"""
Core Game Engine for Tsar Bomba Zone.
Handles networth, power grid efficiency, resource turns, building construction,
unit training, scientific research, conventional warfare, missile strikes, and covert ops.
"""

import math
import random
from server.game_config import BUILDINGS, FACTIONS, GAME_CONFIG, RESEARCH, UNITS


def compute_power_stats(buildings: dict, research: dict) -> dict:
    """Calculates power produced, consumed, and grid efficiency (0.25 to 1.0)."""
    energy_lvl = research.get("energy_grid", 0)
    plant_mult = 1.0 + (energy_lvl * 0.10)

    produced = 0
    consumed = 0
    for b_id, count in buildings.items():
        if count <= 0 or b_id not in BUILDINGS:
            continue
        p = BUILDINGS[b_id]["power"]
        if p > 0:
            if b_id == "power_plant":
                produced += int(round(p * count * plant_mult))
            else:
                produced += p * count
        elif p < 0:
            consumed += abs(p) * count

    if consumed == 0:
        efficiency = 1.0
    elif produced >= consumed:
        efficiency = 1.0
    else:
        efficiency = max(0.25, round(produced / consumed, 2))

    return {
        "produced": produced,
        "consumed": consumed,
        "surplus": produced - consumed,
        "efficiency": efficiency,
        "efficiency_pct": int(round(efficiency * 100)),
    }


def compute_occupied_land(buildings: dict) -> int:
    total = 0
    for b_id, count in buildings.items():
        if count > 0 and b_id in BUILDINGS:
            total += BUILDINGS[b_id]["land"] * count
    return total


def compute_networth(province: dict) -> int:
    """Computes total province Networth ($NW) just like Nukezone."""
    nw = 0
    # Land is worth 25 NW per m2
    nw += int(province.get("land", 0)) * 25
    # Cash is worth 1 NW per $1,500
    nw += int(province.get("money", 0)) // 1500
    # Uranium is worth 15 NW per unit
    nw += int(province.get("uranium", 0)) * 15

    buildings = province.get("buildings", {})
    for b_id, count in buildings.items():
        if count > 0 and b_id in BUILDINGS:
            nw += count * BUILDINGS[b_id]["networth"]

    units = province.get("units", {})
    for u_id, count in units.items():
        if count > 0 and u_id in UNITS:
            nw += count * UNITS[u_id]["networth"]

    research = province.get("research", {})
    for r_id, lvl in research.items():
        if lvl > 0 and r_id in RESEARCH:
            nw += lvl * lvl * 120

    return max(100, nw)


def compute_military_power(province: dict) -> dict:
    """Calculates effective Attack, Defense, Spy, Anti-Spy, and Missile Interception stats."""
    faction_id = province.get("faction", "soviet_directorate")
    f_bonuses = FACTIONS.get(faction_id, {}).get("bonuses", {})
    buildings = province.get("buildings", {})
    units = province.get("units", {})
    research = province.get("research", {})
    morale = province.get("morale", 100)
    power = compute_power_stats(buildings, research)
    grid_eff = power["efficiency"]

    # Tech multipliers
    cat_tech = {
        "Infantry": 1.0 + research.get("infantry_weapons", 0) * 0.08,
        "Vehicles": (1.0 + research.get("armored_warfare", 0) * 0.08) * f_bonuses.get("armor_attack_mult", 1.0),
        "Aircraft": (1.0 + research.get("aerospace_dynamics", 0) * 0.08) * f_bonuses.get("air_attack_mult", 1.0),
        "Navy": (1.0 + research.get("naval_supremacy", 0) * 0.08) * f_bonuses.get("navy_attack_mult", 1.0),
    }

    raw_attack = 0.0
    raw_defense = 0.0
    category_attack = {"Infantry": 0, "Vehicles": 0, "Aircraft": 0, "Navy": 0}

    for u_id, count in units.items():
        if count <= 0 or u_id not in UNITS:
            continue
        u_info = UNITS[u_id]
        cat = u_info["category"]
        mult = cat_tech.get(cat, 1.0)
        atk = u_info.get("attack", 0) * count * mult
        dfn = u_info.get("defense", 0) * count * mult
        raw_attack += atk
        raw_defense += dfn
        if cat in category_attack:
            category_attack[cat] += int(round(atk))

    # Defensive buildings (scaled by Power Grid Efficiency & Strategic Defense tech!)
    turret_mult = (1.0 + research.get("strategic_defense", 0) * 0.10) * grid_eff
    turret_defense = 0.0
    missile_intercept = research.get("strategic_defense", 0) * 0.03 * grid_eff

    for b_id in ("radar_tower", "sam_site", "laser_turret"):
        cnt = buildings.get(b_id, 0)
        if cnt > 0:
            b_info = BUILDINGS[b_id]
            turret_defense += cnt * b_info.get("defense", 0) * turret_mult
            missile_intercept += cnt * b_info.get("missile_intercept", 0.0) * grid_eff

    missile_intercept *= f_bonuses.get("missile_defense_mult", 1.0)
    missile_intercept = min(0.85, round(missile_intercept, 3))

    morale_mult = max(0.5, morale / 100.0)
    total_attack = int(round(raw_attack * morale_mult))
    total_defense = int(round((raw_defense + turret_defense) * morale_mult))

    # Covert power
    spy_mult = (1.0 + research.get("espionage_networks", 0) * 0.12) * f_bonuses.get("espionage_mult", 1.0)
    spy_power = int(round(units.get("operatives", 0) * UNITS["operatives"]["spy_power"] * spy_mult))
    anti_spy_power = int(
        round(
            (
                units.get("counter_intel_agents", 0) * UNITS["counter_intel_agents"]["anti_spy_power"]
                + buildings.get("radar_tower", 0) * BUILDINGS["radar_tower"]["anti_spy"] * grid_eff
            )
            * spy_mult
        )
    )

    return {
        "attack": total_attack,
        "defense": total_defense,
        "turret_defense": int(round(turret_defense)),
        "category_attack": category_attack,
        "spy_power": spy_power,
        "anti_spy_power": anti_spy_power,
        "missile_intercept_pct": int(round(missile_intercept * 100)),
        "missile_intercept": missile_intercept,
        "power": power,
    }


def compute_turn_stats(province: dict) -> dict:
    """Calculates dynamic max_turns and hourly turn generation based on Command Bunkers."""
    cmd = province.get("buildings", {}).get("command_center", 5)
    base_max = GAME_CONFIG["starting_resources"]["max_turns"]
    extra_max = max(0, (cmd - 5) * 2)
    max_turns = base_max + extra_max
    turns_per_hour = GAME_CONFIG["turns_per_tick"] + (cmd // 3)
    return {
        "max_turns": max_turns,
        "turns_per_hour": turns_per_hour,
        "tick_seconds": GAME_CONFIG["turn_tick_seconds"],
    }


def compute_income_per_turn(province: dict) -> dict:
    """Calculates money and uranium generated per turn spent or tick."""
    buildings = province.get("buildings", {})
    research = province.get("research", {})
    faction_id = province.get("faction", "soviet_directorate")
    f_bonuses = FACTIONS.get(faction_id, {}).get("bonuses", {})
    power = compute_power_stats(buildings, research)
    eff = power["efficiency"]

    ind_mult = (1.0 + research.get("industrial_automation", 0) * 0.10) * f_bonuses.get("income_mult", 1.0)
    depots = buildings.get("supply_depot", 0)
    cmd = buildings.get("command_center", 0)
    base_cash = (cmd * 450) + (depots * BUILDINGS["supply_depot"]["income"] * 2.2 * eff) + (province.get("land", 500) * 5)
    cash_per_turn = int(round(base_cash * ind_mult))

    refineries = buildings.get("uranium_refinery", 0)
    u_mult = f_bonuses.get("uranium_prod_mult", 1.0)
    uranium_per_turn = max(1, int(round(refineries * BUILDINGS["uranium_refinery"]["uranium_yield"] * eff * u_mult)))

    return {
        "cash_per_turn": cash_per_turn,
        "uranium_per_op": uranium_per_turn,
    }


def resolve_conventional_attack(attacker: dict, defender: dict, attack_type: str) -> dict:
    """
    Resolves a conventional military attack:
    - 'all_out': Combined Arms invasion (takes 3 turns). Captures land if successful.
    - 'air_raid': Aircraft & Artillery strike (takes 2 turns). Destroys buildings & units.
    - 'naval_blitz': Naval & Marine strike (takes 2 turns). Captures treasury & destroys coastal structures.
    """
    a_mil = compute_military_power(attacker)
    d_mil = compute_military_power(defender)

    if attack_type == "air_raid":
        atk_score = (
            a_mil["category_attack"]["Aircraft"] * 1.5
            + a_mil["category_attack"]["Vehicles"] * 0.4
        )
        def_score = (
            d_mil["category_attack"]["Aircraft"] * 1.3
            + d_mil["turret_defense"] * 1.4
            + d_mil["defense"] * 0.35
        )
        turns_cost = 2
        label = "Strategic Air & Artillery Raid"
    elif attack_type == "naval_blitz":
        atk_score = (
            a_mil["category_attack"]["Navy"] * 1.6
            + a_mil["category_attack"]["Infantry"] * 0.6
        )
        def_score = (
            d_mil["category_attack"]["Navy"] * 1.4
            + d_mil["turret_defense"] * 1.1
            + d_mil["defense"] * 0.4
        )
        turns_cost = 2
        label = "Amphibious Naval Bombardment"
    else:
        atk_score = a_mil["attack"]
        def_score = d_mil["defense"]
        turns_cost = 3
        label = "Combined Arms Invasion"

    # Random battlefield variance (0.88 to 1.12)
    atk_roll = max(1.0, atk_score * random.uniform(0.90, 1.12))
    def_roll = max(1.0, def_score * random.uniform(0.90, 1.12))
    ratio = atk_roll / def_roll
    victory = ratio >= 1.05

    a_losses = {}
    d_losses = {}

    # Casualties scale with intensity and ratio
    if victory:
        a_loss_rate = max(0.02, min(0.12, 0.08 / ratio))
        d_loss_rate = max(0.06, min(0.22, 0.11 * min(ratio, 2.2)))
    else:
        a_loss_rate = max(0.07, min(0.24, 0.13 / max(ratio, 0.4)))
        d_loss_rate = max(0.02, min(0.09, 0.05 * ratio))

    for u_id, cnt in list(attacker["units"].items()):
        if cnt <= 0 or UNITS[u_id]["category"] in ("Covert", "Missiles"):
            continue
        if attack_type == "air_raid" and UNITS[u_id]["category"] not in ("Aircraft", "Vehicles"):
            continue
        if attack_type == "naval_blitz" and UNITS[u_id]["category"] not in ("Navy", "Infantry"):
            continue
        lost = int(math.floor(cnt * a_loss_rate * random.uniform(0.7, 1.3)))
        if lost > 0:
            attacker["units"][u_id] = max(0, cnt - lost)
            a_losses[UNITS[u_id]["name"]] = lost

    for u_id, cnt in list(defender["units"].items()):
        if cnt <= 0 or UNITS[u_id]["category"] in ("Covert", "Missiles"):
            continue
        lost = int(math.floor(cnt * d_loss_rate * random.uniform(0.7, 1.3)))
        if lost > 0:
            defender["units"][u_id] = max(0, cnt - lost)
            d_losses[UNITS[u_id]["name"]] = lost

    land_captured = 0
    money_looted = 0
    buildings_destroyed = {}

    if victory:
        if attack_type == "all_out":
            # Capture 10% to 16% of defender's land
            pct = min(0.16, max(0.08, 0.11 * min(ratio, 1.6)))
            land_captured = max(10, int(round(defender["land"] * pct)))
            land_captured = min(land_captured, max(0, defender["land"] - 100))

            if land_captured > 0:
                defender["land"] -= land_captured
                # Destroy or clear buildings if free_land drops below 0
                occupied = compute_occupied_land(defender["buildings"])
                defender["free_land"] = max(0, defender["land"] - occupied)
                while compute_occupied_land(defender["buildings"]) > defender["land"]:
                    candidates = [b for b, c in defender["buildings"].items() if c > 0 and b != "command_center"]
                    if not candidates:
                        break
                    victim_b = random.choice(candidates)
                    defender["buildings"][victim_b] -= 1
                    buildings_destroyed[BUILDINGS[victim_b]["name"]] = buildings_destroyed.get(BUILDINGS[victim_b]["name"], 0) + 1
                defender["free_land"] = max(0, defender["land"] - compute_occupied_land(defender["buildings"]))

                attacker["land"] += land_captured
                attacker["free_land"] += land_captured

            money_looted = int(round(defender["money"] * random.uniform(0.08, 0.15)))
            defender["money"] -= money_looted
            attacker["money"] += money_looted
            defender["morale"] = max(35, defender["morale"] - 10)
            attacker["morale"] = min(100, attacker["morale"] + 5)

        elif attack_type == "air_raid":
            # Destroy 4 to 14 buildings
            to_destroy = random.randint(4, 14)
            for _ in range(to_destroy):
                candidates = [b for b, c in defender["buildings"].items() if c > 0 and b != "command_center"]
                if not candidates:
                    break
                victim_b = random.choice(candidates)
                defender["buildings"][victim_b] -= 1
                buildings_destroyed[BUILDINGS[victim_b]["name"]] = buildings_destroyed.get(BUILDINGS[victim_b]["name"], 0) + 1
            defender["free_land"] = max(0, defender["land"] - compute_occupied_land(defender["buildings"]))
            defender["morale"] = max(35, defender["morale"] - 12)

        elif attack_type == "naval_blitz":
            money_looted = int(round(defender["money"] * random.uniform(0.18, 0.30)))
            defender["money"] -= money_looted
            attacker["money"] += money_looted
            to_destroy = random.randint(2, 7)
            for _ in range(to_destroy):
                candidates = [b for b, c in defender["buildings"].items() if c > 0 and b != "command_center"]
                if not candidates:
                    break
                victim_b = random.choice(candidates)
                defender["buildings"][victim_b] -= 1
                buildings_destroyed[BUILDINGS[victim_b]["name"]] = buildings_destroyed.get(BUILDINGS[victim_b]["name"], 0) + 1
            defender["free_land"] = max(0, defender["land"] - compute_occupied_land(defender["buildings"]))
    else:
        attacker["morale"] = max(40, attacker["morale"] - 8)

    if victory:
        summary = f"VICTORY! {attacker['name']} overwhelmed {defender['name']} in a {label}."
        if land_captured > 0:
            summary += f" Captured {land_captured} m² land and looted ${money_looted:,}!"
        elif money_looted > 0:
            summary += f" Plundered ${money_looted:,} and destroyed {sum(buildings_destroyed.values())} structures!"
        else:
            summary += f" Bombarded and destroyed {sum(buildings_destroyed.values())} enemy installations!"
    else:
        summary = f"DEFEAT! {attacker['name']}'s {label} was repelled by {defender['name']}'s defenses."

    return {
        "victory": victory,
        "attack_type": attack_type,
        "label": label,
        "turns_used": turns_cost,
        "attacker_score": int(round(atk_roll)),
        "defender_score": int(round(def_roll)),
        "land_captured": land_captured,
        "money_looted": money_looted,
        "buildings_destroyed": buildings_destroyed,
        "attacker_losses": a_losses,
        "defender_losses": d_losses,
        "summary": summary,
    }


def resolve_missile_strike(attacker: dict, defender: dict, missile_id: str) -> dict:
    """
    Launches a strategic missile (Scud, Cruise Missile, Topol-M ICBM, or TSAR BOMBA).
    Checks defender SAM / Laser interception (scaled by defender Power Grid Efficiency).
    """
    m_info = UNITS[missile_id]
    attacker["units"][missile_id] -= 1

    d_mil = compute_military_power(defender)
    intercept_chance = d_mil["missile_intercept"]
    # Tsar Bomba and Topol-M have MIRV / heavy countermeasures that are harder to intercept
    if missile_id == "tsar_bomba":
        intercept_chance *= 0.45
    elif missile_id == "icbm_topol":
        intercept_chance *= 0.65

    intercepted = random.random() < intercept_chance
    fission_lvl = attacker["research"].get("thermonuclear_fission", 0)
    yield_mult = 1.0 + (fission_lvl * 0.10)
    if attacker.get("faction") == "soviet_directorate":
        yield_mult *= 1.15

    buildings_destroyed = {}
    units_vaporized = {}
    land_scorched = 0

    if intercepted:
        summary = (
            f"INTERCEPTED! {defender['name']}'s SAM & Laser ABM network shot down "
            f"{attacker['name']}'s incoming {m_info['name']} in upper atmosphere!"
        )
        return {
            "victory": False,
            "intercepted": True,
            "missile_name": m_info["name"],
            "buildings_destroyed": {},
            "units_vaporized": {},
            "land_scorched": 0,
            "summary": summary,
        }

    # Direct thermonuclear hit!
    b_min, b_max = m_info["building_damage"]
    total_b_destroy = int(round(random.randint(b_min, b_max) * yield_mult))

    for _ in range(total_b_destroy):
        candidates = [b for b, c in defender["buildings"].items() if c > 0 and (b != "command_center" or c > 1)]
        if not candidates:
            break
        victim_b = random.choice(candidates)
        defender["buildings"][victim_b] -= 1
        buildings_destroyed[BUILDINGS[victim_b]["name"]] = buildings_destroyed.get(BUILDINGS[victim_b]["name"], 0) + 1

    # Scorch land (radioactive fallout reduces total province land)
    s_min, s_max = m_info["land_scorch"]
    land_scorched = int(round(random.randint(s_min, s_max) * yield_mult))
    land_scorched = min(land_scorched, max(0, defender["land"] - compute_occupied_land(defender["buildings"]) - 50))
    if land_scorched > 0:
        defender["land"] -= land_scorched

    defender["free_land"] = max(0, defender["land"] - compute_occupied_land(defender["buildings"]))

    # Vaporize units
    unit_kill_pct = min(0.55, m_info["unit_destruction_pct"] * yield_mult)
    for u_id, cnt in list(defender["units"].items()):
        if cnt <= 0 or u_id == "tsar_bomba":
            continue
        lost = int(math.floor(cnt * unit_kill_pct * random.uniform(0.8, 1.25)))
        if lost > 0:
            defender["units"][u_id] = max(0, cnt - lost)
            units_vaporized[UNITS[u_id]["name"]] = lost

    morale_hit = m_info.get("morale_shock", 15)
    defender["morale"] = max(20, defender["morale"] - morale_hit)

    total_b_count = sum(buildings_destroyed.values())
    total_u_count = sum(units_vaporized.values())

    if missile_id == "tsar_bomba":
        summary = (
            f"☢️ TSAR BOMBA DETONATION! A 50-Megaton fireball engulfed {defender['name']}! "
            f"Vaporized {total_b_count} buildings, {total_u_count} military units, and scorched {land_scorched} m² into radioactive glass!"
        )
    else:
        summary = (
            f"☢️ DIRECT NUCLEAR IMPACT! {attacker['name']}'s {m_info['name']} struck {defender['name']}, "
            f"destroying {total_b_count} structures, {total_u_count} units, and scorching {land_scorched} m² land!"
        )

    return {
        "victory": True,
        "intercepted": False,
        "missile_name": m_info["name"],
        "buildings_destroyed": buildings_destroyed,
        "units_vaporized": units_vaporized,
        "land_scorched": land_scorched,
        "summary": summary,
    }


def resolve_covert_op(attacker: dict, defender: dict, op_type: str) -> dict:
    """
    Executes covert operations:
    - 'spy_intel': Full reconnaissance of target province
    - 'sabotage_power': Blows up enemy Nuclear Power Plants to cripple grid efficiency
    - 'steal_cash': Hacks/siphons enemy treasury
    - 'sabotage_silos': Destroys enemy missiles on the launchpad
    """
    a_mil = compute_military_power(attacker)
    d_mil = compute_military_power(defender)

    spy_atk = max(10, a_mil["spy_power"] * random.uniform(0.85, 1.20))
    spy_def = max(10, d_mil["anti_spy_power"] * random.uniform(0.85, 1.20))

    # Harder ops require higher ratio
    threshold = {
        "spy_intel": 0.70,
        "steal_cash": 0.95,
        "sabotage_power": 1.05,
        "sabotage_silos": 1.20,
    }.get(op_type, 1.0)

    ratio = spy_atk / spy_def
    success = ratio >= threshold

    agents_lost = 0
    if not success:
        agents_lost = max(1, int(round(attacker["units"].get("operatives", 0) * random.uniform(0.06, 0.14))))
        attacker["units"]["operatives"] = max(0, attacker["units"].get("operatives", 0) - agents_lost)
    elif ratio < threshold * 1.3:
        agents_lost = int(round(attacker["units"].get("operatives", 0) * random.uniform(0.01, 0.04)))
        attacker["units"]["operatives"] = max(0, attacker["units"].get("operatives", 0) - agents_lost)

    intel_report = None
    effect_text = ""

    if success:
        if op_type == "spy_intel":
            d_power = compute_power_stats(defender["buildings"], defender["research"])
            intel_report = {
                "province_name": defender["name"],
                "faction": FACTIONS.get(defender["faction"], {}).get("name", defender["faction"]),
                "money": defender["money"],
                "uranium": defender["uranium"],
                "land": defender["land"],
                "free_land": defender["free_land"],
                "morale": defender["morale"],
                "networth": compute_networth(defender),
                "power_efficiency_pct": d_power["efficiency_pct"],
                "power_produced": d_power["produced"],
                "power_consumed": d_power["consumed"],
                "attack_rating": d_mil["attack"],
                "defense_rating": d_mil["defense"],
                "missile_intercept_pct": d_mil["missile_intercept_pct"],
                "buildings": defender["buildings"],
                "units": defender["units"],
                "research": defender["research"],
            }
            effect_text = f"Infiltrated {defender['name']} Command HQ and extracted complete classified telemetry."

        elif op_type == "sabotage_power":
            plants = defender["buildings"].get("power_plant", 0)
            destroyed = min(plants, random.randint(1, max(2, int(plants * 0.20))))
            if destroyed > 0:
                defender["buildings"]["power_plant"] -= destroyed
                defender["free_land"] += destroyed
                effect_text = f"Detonated C4 charges inside {defender['name']}'s reactor complex, destroying {destroyed} Nuclear Power Plants!"
            else:
                effect_text = f"Infiltrated {defender['name']}, but found no operational Nuclear Power Plants to sabotage."

        elif op_type == "steal_cash":
            stolen = int(round(defender["money"] * random.uniform(0.10, 0.20)))
            defender["money"] -= stolen
            attacker["money"] += stolen
            effect_text = f"Siphoned ${stolen:,} from {defender['name']}'s central reserve accounts!"

        elif op_type == "sabotage_silos":
            missile_keys = ["tsar_bomba", "icbm_topol", "cruise_missile", "tactical_scud"]
            sabotaged = None
            for mk in missile_keys:
                if defender["units"].get(mk, 0) > 0:
                    defender["units"][mk] -= 1
                    sabotaged = UNITS[mk]["name"]
                    break
            if sabotaged:
                effect_text = f"Covert team infiltrated {defender['name']}'s launch complex and destroyed 1x {sabotaged} on the pad!"
            else:
                effect_text = f"Covert team breached {defender['name']}'s silos, but found no armed missiles inside."
    else:
        effect_text = (
            f"COMPROMISED! {defender['name']}'s Internal Security Directorate detected your operatives! "
            f"{agents_lost} agents were captured or eliminated."
        )

    return {
        "success": success,
        "op_type": op_type,
        "agents_lost": agents_lost,
        "effect_text": effect_text,
        "intel_report": intel_report,
    }

