"""
Main aiohttp Web Server & REST API for Tsar Bomba Zone.
"""

import asyncio
import json
import os
import random
import secrets
import sqlite3
import time
from aiohttp import web

from server.database import (
    create_user_and_province,
    get_conn,
    init_db,
    row_to_province,
    save_province,
    verify_password,
)
from server.game_config import BUILDINGS, DIRECTIVES, FACTIONS, GAME_CONFIG, RESEARCH, UNITS
from server.game_engine import (
    compute_income_per_turn,
    compute_military_power,
    compute_networth,
    compute_occupied_land,
    compute_power_stats,
    compute_turn_stats,
    resolve_conventional_attack,
    resolve_covert_op,
    resolve_missile_strike,
)

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")


def evaluate_province_directives(prov: dict, logs: list) -> list:
    """Evaluates progress and claim status for Tactical Directives that award bonus turns."""
    cache = prov.get("intel_cache", {})
    claimed = set(cache.get("_directives_claimed", []))
    mil = prov.get("military_stats") or compute_military_power(prov)

    total_buildings = sum(c for c in prov["buildings"].values() if c > 0)
    has_recon = any(not k.startswith("_") for k in cache.keys())
    has_victory = any(
        l["is_outgoing"] and l["victory"] and l["log_type"] in ("conventional", "missile", "nuclear")
        for l in logs
    )

    progress_map = {
        "recon_sweep": (1 if has_recon else 0, 1),
        "base_expansion": (min(45, total_buildings), 45),
        "uranium_stockpile": (min(50, prov["uranium"]), 50),
        "war_machine": (min(2000, mil["attack"]), 2000),
        "battle_victory": (1 if has_victory else 0, 1),
    }

    result = []
    for d_id, d_info in DIRECTIVES.items():
        cur_val, target_val = progress_map.get(d_id, (0, 1))
        is_claimed = d_id in claimed
        is_ready = (cur_val >= target_val) and not is_claimed
        result.append(
            {
                **d_info,
                "current": cur_val,
                "target": target_val,
                "claimed": is_claimed,
                "ready": is_ready,
            }
        )
    return result


def enrich_province_telemetry(prov: dict, logs: list = None) -> dict:
    """Adds calculated military, power, income, turn regen, and networth stats to a province dict."""
    prov["occupied_land"] = compute_occupied_land(prov["buildings"])
    prov["free_land"] = max(0, prov["land"] - prov["occupied_land"])
    prov["networth"] = compute_networth(prov)
    prov["power_stats"] = compute_power_stats(prov["buildings"], prov["research"])
    prov["military_stats"] = compute_military_power(prov)
    prov["income_stats"] = compute_income_per_turn(prov)

    t_stats = compute_turn_stats(prov)
    prov["max_turns"] = t_stats["max_turns"]
    prov["turns_per_hour"] = t_stats["turns_per_hour"]
    now = int(time.time())
    elapsed = max(0, now - prov["last_tick_at"])
    prov["next_tick_seconds"] = max(0, GAME_CONFIG["turn_tick_seconds"] - (elapsed % GAME_CONFIG["turn_tick_seconds"]))

    cache = prov.get("intel_cache", {})
    logistics_count = int(cache.get("_logistics_count", 0))
    prov["logistics_turn_cost"] = 18000 + (logistics_count * 7000)
    prov["directives"] = evaluate_province_directives(prov, logs or [])
    return prov


def apply_passive_ticks(conn: sqlite3.Connection, prov: dict) -> bool:
    """Applies elapsed hourly ticks for turns and passive morale recovery."""
    now = int(time.time())
    t_stats = compute_turn_stats(prov)
    prov["max_turns"] = t_stats["max_turns"]
    elapsed = now - prov["last_tick_at"]
    tick_sec = GAME_CONFIG["turn_tick_seconds"]
    if elapsed < tick_sec:
        return False

    ticks = elapsed // tick_sec
    if ticks <= 0:
        return False

    turns_gained = min(
        max(0, prov["max_turns"] - prov["turns"]),
        ticks * t_stats["turns_per_hour"],
    )
    if turns_gained > 0:
        prov["turns"] += turns_gained

    # Passive morale recovery toward 100 every hour
    if prov["morale"] < 100:
        prov["morale"] = min(100, prov["morale"] + min(ticks * 10, 100 - prov["morale"]))

    prov["last_tick_at"] = prov["last_tick_at"] + (ticks * tick_sec)
    save_province(conn, prov)
    return True


def get_authenticated_province(request: web.Request, conn: sqlite3.Connection) -> tuple:
    auth_header = request.headers.get("Authorization", "")
    token = ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    if not token:
        raise web.HTTPUnauthorized(text=json.dumps({"error": "Authentication required."}), content_type="application/json")

    s_row = conn.execute(
        """
        SELECT u.id AS user_id, u.username
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ?
        """,
        (token,),
    ).fetchone()
    if not s_row:
        raise web.HTTPUnauthorized(text=json.dumps({"error": "Invalid or expired session."}), content_type="application/json")

    p_row = conn.execute("SELECT * FROM provinces WHERE user_id = ?", (s_row["user_id"],)).fetchone()
    if not p_row:
        raise web.HTTPNotFound(text=json.dumps({"error": "Province not found."}), content_type="application/json")

    prov = row_to_province(p_row, conn)
    apply_passive_ticks(conn, prov)
    return s_row["username"], prov


def build_world_state(conn: sqlite3.Connection, current_prov: dict) -> dict:
    # Leaderboard
    rows = conn.execute(
        """
        SELECT p.*, u.username, u.is_ai, c.tag AS clan_tag, c.name AS clan_name
        FROM provinces p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN clans c ON c.id = p.clan_id
        ORDER BY p.networth DESC
        """
    ).fetchall()

    leaderboard = []
    for idx, r in enumerate(rows, start=1):
        leaderboard.append(
            {
                "rank": idx,
                "id": r["id"],
                "name": r["name"],
                "username": r["username"],
                "faction": r["faction"],
                "clan_id": r["clan_id"],
                "clan_tag": r["clan_tag"],
                "clan_name": r["clan_name"],
                "land": r["land"],
                "networth": r["networth"],
                "morale": r["morale"],
                "protection_turns_left": r["protection_turns_left"],
                "is_ai": bool(r["is_ai"]),
                "is_self": r["id"] == current_prov["id"],
            }
        )

    # Recent combat & covert logs involving current province
    log_rows = conn.execute(
        """
        SELECT * FROM combat_logs
        WHERE attacker_id = ? OR defender_id = ?
        ORDER BY id DESC LIMIT 30
        """,
        (current_prov["id"], current_prov["id"]),
    ).fetchall()

    logs = []
    for lr in log_rows:
        logs.append(
            {
                "id": lr["id"],
                "attacker_id": lr["attacker_id"],
                "attacker_name": lr["attacker_name"],
                "defender_id": lr["defender_id"],
                "defender_name": lr["defender_name"],
                "log_type": lr["log_type"],
                "victory": bool(lr["victory"]),
                "summary": lr["summary"],
                "details": json.loads(lr["details_json"]),
                "created_at": lr["created_at"],
                "is_outgoing": lr["attacker_id"] == current_prov["id"],
            }
        )

    # Clans list
    clan_rows = conn.execute(
        """
        SELECT c.*,
               COUNT(p.id) AS member_count,
               COALESCE(SUM(p.networth), 0) AS total_networth,
               COALESCE(SUM(p.land), 0) AS total_land
        FROM clans c
        LEFT JOIN provinces p ON p.clan_id = c.id
        GROUP BY c.id
        ORDER BY total_networth DESC
        """
    ).fetchall()

    clans = []
    for cr in clan_rows:
        clans.append(
            {
                "id": cr["id"],
                "tag": cr["tag"],
                "name": cr["name"],
                "description": cr["description"],
                "member_count": cr["member_count"],
                "total_networth": cr["total_networth"],
                "total_land": cr["total_land"],
            }
        )

    clan_messages = []
    if current_prov.get("clan_id"):
        m_rows = conn.execute(
            """
            SELECT * FROM clan_messages
            WHERE clan_id = ?
            ORDER BY id DESC LIMIT 30
            """,
            (current_prov["clan_id"],),
        ).fetchall()
        for mr in m_rows:
            clan_messages.append(
                {
                    "id": mr["id"],
                    "province_id": mr["province_id"],
                    "province_name": mr["province_name"],
                    "message": mr["message"],
                    "created_at": mr["created_at"],
                }
            )

    return {
        "province": enrich_province_telemetry(current_prov, logs),
        "leaderboard": leaderboard,
        "logs": logs,
        "clans": clans,
        "clan_messages": clan_messages,
        "server_time": int(time.time()),
    }


def consume_turns(prov: dict, turns_needed: int) -> None:
    if turns_needed <= 0:
        raise web.HTTPBadRequest(text=json.dumps({"error": "Invalid turn amount."}), content_type="application/json")
    if prov["turns"] < turns_needed:
        raise web.HTTPBadRequest(
            text=json.dumps({"error": f"Insufficient turns! Need {turns_needed} turns, you have {prov['turns']}."}),
            content_type="application/json",
        )
    prov["turns"] -= turns_needed
    if prov["protection_turns_left"] > 0:
        prov["protection_turns_left"] = max(0, prov["protection_turns_left"] - turns_needed)


# --- HTTP Handlers ---


async def handle_config(request: web.Request) -> web.Response:
    return web.json_response(
        {
            "game_config": GAME_CONFIG,
            "directives": DIRECTIVES,
            "factions": FACTIONS,
            "buildings": BUILDINGS,
            "units": UNITS,
            "research": RESEARCH,
        }
    )


async def handle_register(request: web.Request) -> web.Response:
    data = await request.json()
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    province_name = (data.get("province_name") or "").strip()
    faction = data.get("faction") or "soviet_directorate"

    if len(username) < 3 or len(username) > 24:
        return web.json_response({"error": "Commander callsign must be 3–24 characters."}, status=400)
    if len(password) < 4:
        return web.json_response({"error": "Security passphrase must be at least 4 characters."}, status=400)
    if len(province_name) < 3 or len(province_name) > 32:
        return web.json_response({"error": "Province name must be 3–32 characters."}, status=400)
    if faction not in FACTIONS:
        return web.json_response({"error": "Invalid faction selected."}, status=400)

    try:
        res = create_user_and_province(username, password, province_name, faction)
        conn = get_conn()
        try:
            world = build_world_state(conn, res["province"])
            return web.json_response(
                {
                    "token": res["token"],
                    "username": res["username"],
                    **world,
                }
            )
        finally:
            conn.close()
    except sqlite3.IntegrityError:
        return web.json_response(
            {"error": "Callsign or Province name is already registered by another Commander."},
            status=400,
        )


async def handle_login(request: web.Request) -> web.Response:
    data = await request.json()
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    conn = get_conn()
    try:
        u_row = conn.execute("SELECT * FROM users WHERE username = ? AND is_ai = 0", (username,)).fetchone()
        if not u_row or not verify_password(password, u_row["password_hash"]):
            return web.json_response({"error": "Invalid Commander callsign or passphrase."}, status=401)

        token = secrets.token_hex(24)
        with conn:
            conn.execute(
                "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
                (token, u_row["id"], int(time.time())),
            )
            p_row = conn.execute("SELECT * FROM provinces WHERE user_id = ?", (u_row["id"],)).fetchone()
            prov = row_to_province(p_row, conn)
            apply_passive_ticks(conn, prov)
            world = build_world_state(conn, prov)

        return web.json_response({"token": token, "username": username, **world})
    finally:
        conn.close()


async def handle_logout(request: web.Request) -> web.Response:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        conn = get_conn()
        with conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.close()
    return web.json_response({"ok": True})


async def handle_state(request: web.Request) -> web.Response:
    conn = get_conn()
    try:
        with conn:
            username, prov = get_authenticated_province(request, conn)
            world = build_world_state(conn, prov)
        return web.json_response({"username": username, **world})
    finally:
        conn.close()


async def handle_turn_action(request: web.Request) -> web.Response:
    data = await request.json()
    action = data.get("action")
    turns_to_spend = int(data.get("turns", 1))

    conn = get_conn()
    try:
        with conn:
            username, prov = get_authenticated_province(request, conn)
            inc = compute_income_per_turn(prov)
            t_stats = compute_turn_stats(prov)
            prov["max_turns"] = t_stats["max_turns"]

            if action == "claim_directive":
                directive_id = data.get("directive_id")
                if directive_id not in DIRECTIVES:
                    return web.json_response({"error": "Invalid Tactical Directive."}, status=400)
                world_preview = build_world_state(conn, prov)
                dir_list = world_preview["province"]["directives"]
                target_dir = next((d for d in dir_list if d["id"] == directive_id), None)
                if not target_dir or target_dir["claimed"]:
                    return web.json_response({"error": "Directive already claimed."}, status=400)
                if not target_dir["ready"]:
                    return web.json_response({"error": "Directive objective not yet completed!"}, status=400)

                cache = prov.get("intel_cache", {})
                claimed = list(cache.get("_directives_claimed", []))
                claimed.append(directive_id)
                cache["_directives_claimed"] = claimed
                prov["intel_cache"] = cache

                prov["turns"] += target_dir["reward_turns"]
                prov["money"] += target_dir["reward_money"]
                prov["uranium"] += target_dir["reward_uranium"]
                msg = (
                    f"🎖️ Directive Completed: {target_dir['title']}! "
                    f"Earned +{target_dir['reward_turns']} Turns, +${target_dir['reward_money']:,}"
                    + (f", and +{target_dir['reward_uranium']} U-235!" if target_dir["reward_uranium"] > 0 else "!")
                )

            elif action == "logistics_convoy":
                # Convert Treasury into +4 Operational Turns (scaling cost)
                cache = prov.get("intel_cache", {})
                l_cnt = int(cache.get("_logistics_count", 0))
                cost = 18000 + (l_cnt * 7000)
                if prov["money"] < cost:
                    return web.json_response(
                        {"error": f"Requires ${cost:,} Treasury to fund an Emergency Logistics Convoy."},
                        status=400,
                    )
                if prov["turns"] >= prov["max_turns"]:
                    return web.json_response(
                        {"error": f"Your Turn reserves are already at max capacity ({prov['max_turns']}). Spend turns first!"},
                        status=400,
                    )
                added = min(4, prov["max_turns"] - prov["turns"])
                prov["money"] -= cost
                prov["turns"] += added
                cache["_logistics_count"] = l_cnt + 1
                prov["intel_cache"] = cache
                msg = f"🚛 Emergency Logistics Convoy funded (-${cost:,})! Earned +{added} Operational Turns."

            elif action == "reactor_overdrive":
                # Burn 12 U-235 in Command Bunker reactor to generate +5 Operational Turns
                u_cost = 12
                if prov["uranium"] < u_cost:
                    return web.json_response(
                        {"error": f"Requires {u_cost} U-235 canisters to run Reactor Overdrive."},
                        status=400,
                    )
                if prov["turns"] >= prov["max_turns"]:
                    return web.json_response(
                        {"error": f"Your Turn reserves are already at max capacity ({prov['max_turns']}). Spend turns first!"},
                        status=400,
                    )
                added = min(5, prov["max_turns"] - prov["turns"])
                prov["uranium"] -= u_cost
                prov["turns"] += added
                msg = f"☢️ Command Reactor Overdrive engaged (-{u_cost} U-235)! Earned +{added} Operational Turns."

            elif action == "explore":
                consume_turns(prov, turns_to_spend)
                # Land exploration yields ~14-22 m2 per turn
                base_per_turn = max(6, int(round(18 - (prov["land"] / 350.0))))
                gained_land = 0
                for _ in range(turns_to_spend):
                    gained_land += random.randint(max(4, base_per_turn - 3), base_per_turn + 5)
                prov["land"] += gained_land
                prov["free_land"] += gained_land
                msg = f"Expeditionary surveyors annexed +{gained_land:,} m² of new territory ({turns_to_spend} turns spent)."

            elif action == "work":
                consume_turns(prov, turns_to_spend)
                earned = inc["cash_per_turn"] * turns_to_spend
                prov["money"] += earned
                msg = f"Industrial complexes operated at peak output, generating +${earned:,} ({turns_to_spend} turns spent)."

            elif action == "mine_uranium":
                consume_turns(prov, turns_to_spend)
                refineries = prov["buildings"].get("uranium_refinery", 0)
                if refineries <= 0:
                    return web.json_response({"error": "You must construct at least 1 Uranium Centrifuge first!"}, status=400)
                u_gained = max(1, inc["uranium_per_op"] * turns_to_spend)
                prov["uranium"] += u_gained
                msg = f"Centrifuge cascades enriched +{u_gained:,} canisters of Weapons-Grade U-235 ({turns_to_spend} turns spent)."

            elif action == "morale_boost":
                if prov["morale"] >= 100:
                    return web.json_response({"error": "Province morale is already at 100%."}, status=400)
                consume_turns(prov, turns_to_spend)
                boost = turns_to_spend * 12
                prov["morale"] = min(100, prov["morale"] + boost)
                msg = f"Military parade and broadcast restored province morale to {prov['morale']}% ({turns_to_spend} turns spent)."

            else:
                return web.json_response({"error": "Unknown turn action."}, status=400)

            save_province(conn, prov)
            world = build_world_state(conn, prov)
            return web.json_response({"message": msg, "username": username, **world})
    finally:
        conn.close()


async def handle_build(request: web.Request) -> web.Response:
    data = await request.json()
    building_id = data.get("building_id")
    quantity = int(data.get("quantity", 1))
    mode = data.get("mode", "build")  # 'build' or 'demolish'

    if building_id not in BUILDINGS or quantity <= 0:
        return web.json_response({"error": "Invalid building or quantity."}, status=400)

    b_info = BUILDINGS[building_id]
    conn = get_conn()
    try:
        with conn:
            username, prov = get_authenticated_province(request, conn)
            if mode == "demolish":
                current_cnt = prov["buildings"].get(building_id, 0)
                if building_id == "command_center" and current_cnt - quantity < 1:
                    return web.json_response({"error": "Cannot demolish your final Command Bunker."}, status=400)
                if current_cnt < quantity:
                    return web.json_response({"error": f"You only have {current_cnt} {b_info['name']}s."}, status=400)
                turns_needed = 1
                consume_turns(prov, turns_needed)
                prov["buildings"][building_id] -= quantity
                freed = b_info["land"] * quantity
                prov["free_land"] += freed
                msg = f"Demolished {quantity}x {b_info['name']}, freeing {freed} m² land."
            else:
                total_cost = b_info["cost"] * quantity
                total_land = b_info["land"] * quantity
                turns_needed = max(1, (quantity + 4) // 5)  # Build up to 5 structures per turn

                if prov["money"] < total_cost:
                    return web.json_response(
                        {"error": f"Insufficient funds! Need ${total_cost:,}, have ${prov['money']:,}."},
                        status=400,
                    )
                if prov["free_land"] < total_land:
                    return web.json_response(
                        {"error": f"Insufficient free land! Need {total_land} m², have {prov['free_land']} m²."},
                        status=400,
                    )

                consume_turns(prov, turns_needed)
                prov["money"] -= total_cost
                prov["buildings"][building_id] = prov["buildings"].get(building_id, 0) + quantity
                t_stats = compute_turn_stats(prov)
                prov["max_turns"] = t_stats["max_turns"]
                msg = f"Constructed {quantity}x {b_info['name']} (-${total_cost:,}, -{total_land} m², -{turns_needed} turns)."

            save_province(conn, prov)
            world = build_world_state(conn, prov)
            return web.json_response({"message": msg, "username": username, **world})
    finally:
        conn.close()


async def handle_train(request: web.Request) -> web.Response:
    data = await request.json()
    unit_id = data.get("unit_id")
    quantity = int(data.get("quantity", 1))

    if unit_id not in UNITS or quantity <= 0:
        return web.json_response({"error": "Invalid unit or quantity."}, status=400)

    u_info = UNITS[unit_id]
    conn = get_conn()
    try:
        with conn:
            username, prov = get_authenticated_province(request, conn)

            # Check required building
            req_b = u_info.get("req_building")
            if req_b and prov["buildings"].get(req_b, 0) <= 0:
                return web.json_response(
                    {"error": f"Requires at least 1 {BUILDINGS[req_b]['name']}!"},
                    status=400,
                )

            # Check required tech
            req_tech = u_info.get("req_tech")
            if req_tech:
                t_id, t_lvl = req_tech
                if prov["research"].get(t_id, 0) < t_lvl:
                    return web.json_response(
                        {"error": f"Requires {RESEARCH[t_id]['name']} Level {t_lvl}!"},
                        status=400,
                    )

            sec_tech = u_info.get("secondary_req_tech")
            if sec_tech:
                st_id, st_lvl = sec_tech
                if prov["research"].get(st_id, 0) < st_lvl:
                    return web.json_response(
                        {"error": f"Requires {RESEARCH[st_id]['name']} Level {st_lvl}!"},
                        status=400,
                    )

            # Faction discount on missiles
            cost_mult = 1.0
            if u_info["category"] == "Missiles" and prov["faction"] == "soviet_directorate":
                cost_mult = FACTIONS["soviet_directorate"]["bonuses"]["missile_cost_mult"]

            unit_cost = int(round(u_info["cost"] * cost_mult))
            total_cost = unit_cost * quantity
            total_uranium = u_info.get("uranium", 0) * quantity

            # Turns calculation: more production buildings = more units trained per turn
            prod_buildings = max(1, prov["buildings"].get(req_b, 1))
            if u_info["category"] == "Missiles":
                turns_needed = quantity * 2
            else:
                units_per_turn = max(10, prod_buildings * 12)
                turns_needed = max(1, (quantity + units_per_turn - 1) // units_per_turn)

            if prov["money"] < total_cost:
                return web.json_response(
                    {"error": f"Insufficient treasury! Need ${total_cost:,}, have ${prov['money']:,}."},
                    status=400,
                )
            if prov["uranium"] < total_uranium:
                return web.json_response(
                    {"error": f"Insufficient Uranium-235! Need {total_uranium} U-235, have {prov['uranium']}."},
                    status=400,
                )

            consume_turns(prov, turns_needed)
            prov["money"] -= total_cost
            prov["uranium"] -= total_uranium
            prov["units"][unit_id] = prov["units"].get(unit_id, 0) + quantity

            u_str = f", -{total_uranium} U-235" if total_uranium > 0 else ""
            msg = f"Deployed {quantity:,}x {u_info['name']} (-${total_cost:,}{u_str}, -{turns_needed} turns)."

            save_province(conn, prov)
            world = build_world_state(conn, prov)
            return web.json_response({"message": msg, "username": username, **world})
    finally:
        conn.close()


async def handle_research(request: web.Request) -> web.Response:
    data = await request.json()
    tech_id = data.get("tech_id")

    if tech_id not in RESEARCH:
        return web.json_response({"error": "Invalid research project."}, status=400)

    r_info = RESEARCH[tech_id]
    conn = get_conn()
    try:
        with conn:
            username, prov = get_authenticated_province(request, conn)
            if prov["buildings"].get("research_lab", 0) <= 0:
                return web.json_response({"error": "You must construct a Weapons Research Lab first!"}, status=400)

            cur_lvl = prov["research"].get(tech_id, 0)
            if cur_lvl >= r_info["max_level"]:
                return web.json_response({"error": f"{r_info['name']} is already at maximum level ({cur_lvl})."}, status=400)

            next_lvl = cur_lvl + 1
            cost_mult = 1.0
            if prov["faction"] == "pacific_syndicate":
                cost_mult = FACTIONS["pacific_syndicate"]["bonuses"]["research_cost_mult"]

            money_cost = int(round(r_info["base_cost"] * (1.45 ** cur_lvl) * cost_mult))
            uranium_cost = int(round(r_info.get("base_uranium", 0) * (1.35 ** cur_lvl)))
            labs = max(1, prov["buildings"].get("research_lab", 1))
            turns_needed = max(1, int(round((r_info["base_turns"] + cur_lvl // 2) * (1.0 / (1.0 + (labs - 1) * 0.12)))))

            if prov["money"] < money_cost:
                return web.json_response(
                    {"error": f"Insufficient funds! Need ${money_cost:,}, have ${prov['money']:,}."},
                    status=400,
                )
            if prov["uranium"] < uranium_cost:
                return web.json_response(
                    {"error": f"Insufficient Uranium-235! Need {uranium_cost} U-235, have {prov['uranium']}."},
                    status=400,
                )

            consume_turns(prov, turns_needed)
            prov["money"] -= money_cost
            prov["uranium"] -= uranium_cost
            prov["research"][tech_id] = next_lvl

            msg = f"Breakthrough! {r_info['name']} upgraded to Level {next_lvl} (-${money_cost:,}, -{turns_needed} turns)."
            save_province(conn, prov)
            world = build_world_state(conn, prov)
            return web.json_response({"message": msg, "username": username, **world})
    finally:
        conn.close()


async def handle_attack(request: web.Request) -> web.Response:
    data = await request.json()
    target_id = int(data.get("target_id", 0))
    attack_mode = data.get("mode", "conventional")  # 'conventional' or 'missile'
    sub_type = data.get("sub_type", "all_out")

    conn = get_conn()
    try:
        with conn:
            username, attacker = get_authenticated_province(request, conn)
            if target_id == attacker["id"]:
                return web.json_response({"error": "Cannot launch an attack against your own Command HQ!"}, status=400)

            t_row = conn.execute("SELECT * FROM provinces WHERE id = ?", (target_id,)).fetchone()
            if not t_row:
                return web.json_response({"error": "Target province not found."}, status=404)

            defender = row_to_province(t_row, conn)
            if attacker.get("clan_id") and attacker.get("clan_id") == defender.get("clan_id"):
                return web.json_response({"error": "Cannot attack a fellow Clan ally!"}, status=400)

            if defender["protection_turns_left"] > 0:
                return web.json_response(
                    {"error": f"{defender['name']} is under UN Rookie Protection ({defender['protection_turns_left']} turns remaining)."},
                    status=400,
                )

            # Attacking breaks own rookie protection immediately
            attacker["protection_turns_left"] = 0

            if attack_mode == "missile":
                if sub_type not in UNITS or UNITS[sub_type]["category"] != "Missiles":
                    return web.json_response({"error": "Invalid missile warhead selected."}, status=400)
                if attacker["units"].get(sub_type, 0) <= 0:
                    return web.json_response(
                        {"error": f"No {UNITS[sub_type]['name']} armed in your silos!"},
                        status=400,
                    )
                if attacker["buildings"].get("missile_silo", 0) <= 0:
                    return web.json_response({"error": "Requires an operational Hardened Missile Silo to launch!"}, status=400)

                consume_turns(attacker, 2)
                report = resolve_missile_strike(attacker, defender, sub_type)
                log_type = "nuclear" if sub_type == "tsar_bomba" else "missile"
            else:
                turns_map = {"all_out": 3, "air_raid": 2, "naval_blitz": 2}
                turns_needed = turns_map.get(sub_type, 3)
                consume_turns(attacker, turns_needed)
                report = resolve_conventional_attack(attacker, defender, sub_type)
                log_type = "conventional"

            save_province(conn, attacker)
            save_province(conn, defender)

            conn.execute(
                """
                INSERT INTO combat_logs (
                    attacker_id, attacker_name, defender_id, defender_name,
                    log_type, victory, summary, details_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    attacker["id"],
                    attacker["name"],
                    defender["id"],
                    defender["name"],
                    log_type,
                    1 if report["victory"] else 0,
                    report["summary"],
                    json.dumps(report),
                    int(time.time()),
                ),
            )

            world = build_world_state(conn, attacker)
            return web.json_response(
                {
                    "message": report["summary"],
                    "battle_report": report,
                    "username": username,
                    **world,
                }
            )
    finally:
        conn.close()


async def handle_covert(request: web.Request) -> web.Response:
    data = await request.json()
    target_id = int(data.get("target_id", 0))
    op_type = data.get("op_type", "spy_intel")

    conn = get_conn()
    try:
        with conn:
            username, attacker = get_authenticated_province(request, conn)
            if target_id == attacker["id"]:
                return web.json_response({"error": "Cannot run covert operations against yourself."}, status=400)
            if attacker["units"].get("operatives", 0) <= 0:
                return web.json_response({"error": "You have no Field Intelligence Agents trained!"}, status=400)

            t_row = conn.execute("SELECT * FROM provinces WHERE id = ?", (target_id,)).fetchone()
            if not t_row:
                return web.json_response({"error": "Target province not found."}, status=404)
            defender = row_to_province(t_row, conn)

            if op_type != "spy_intel" and defender["protection_turns_left"] > 0:
                return web.json_response(
                    {"error": f"{defender['name']} is under Rookie Protection against hostile sabotage."},
                    status=400,
                )

            turns_cost = 1 if op_type == "spy_intel" else 2
            consume_turns(attacker, turns_cost)
            report = resolve_covert_op(attacker, defender, op_type)

            if report["success"] and report["intel_report"]:
                cache = attacker.get("intel_cache", {})
                cache[str(defender["id"])] = {
                    "timestamp": int(time.time()),
                    "data": report["intel_report"],
                }
                attacker["intel_cache"] = cache

            save_province(conn, attacker)
            save_province(conn, defender)

            conn.execute(
                """
                INSERT INTO combat_logs (
                    attacker_id, attacker_name, defender_id, defender_name,
                    log_type, victory, summary, details_json, created_at
                ) VALUES (?, ?, ?, ?, 'covert', ?, ?, ?, ?)
                """,
                (
                    attacker["id"],
                    attacker["name"],
                    defender["id"],
                    defender["name"],
                    1 if report["success"] else 0,
                    report["effect_text"],
                    json.dumps(report),
                    int(time.time()),
                ),
            )

            world = build_world_state(conn, attacker)
            return web.json_response(
                {
                    "message": report["effect_text"],
                    "covert_report": report,
                    "username": username,
                    **world,
                }
            )
    finally:
        conn.close()


async def handle_clan_action(request: web.Request) -> web.Response:
    data = await request.json()
    action = data.get("action")

    conn = get_conn()
    try:
        with conn:
            username, prov = get_authenticated_province(request, conn)
            now = int(time.time())

            if action == "create":
                tag = (data.get("tag") or "").strip().upper()
                name = (data.get("name") or "").strip()
                desc = (data.get("description") or "Strategic Alliance").strip()
                if len(tag) < 2 or len(tag) > 5:
                    return web.json_response({"error": "Clan Tag must be 2–5 characters."}, status=400)
                if len(name) < 3 or len(name) > 30:
                    return web.json_response({"error": "Clan Name must be 3–30 characters."}, status=400)
                if prov["money"] < 25000:
                    return web.json_response({"error": "Founding a new Clan requires $25,000 charter fee."}, status=400)

                try:
                    c_cur = conn.execute(
                        "INSERT INTO clans (tag, name, description, leader_province_id, created_at) VALUES (?, ?, ?, ?, ?)",
                        (tag, name, desc, prov["id"], now),
                    )
                except sqlite3.IntegrityError:
                    return web.json_response({"error": "Clan tag or name already exists."}, status=400)

                prov["money"] -= 25000
                prov["clan_id"] = c_cur.lastrowid
                save_province(conn, prov)
                conn.execute(
                    "INSERT INTO clan_messages (clan_id, province_id, province_name, message, created_at) VALUES (?, ?, ?, ?, ?)",
                    (c_cur.lastrowid, prov["id"], prov["name"], f"Founded alliance [{tag}] {name}!", now),
                )
                msg = f"Founded Clan [{tag}] {name}!"

            elif action == "join":
                clan_id = int(data.get("clan_id", 0))
                c_row = conn.execute("SELECT * FROM clans WHERE id = ?", (clan_id,)).fetchone()
                if not c_row:
                    return web.json_response({"error": "Clan not found."}, status=404)
                prov["clan_id"] = clan_id
                save_province(conn, prov)
                conn.execute(
                    "INSERT INTO clan_messages (clan_id, province_id, province_name, message, created_at) VALUES (?, ?, ?, ?, ?)",
                    (clan_id, prov["id"], prov["name"], f"{prov['name']} has joined [{c_row['tag']}]!", now),
                )
                msg = f"Joined Clan [{c_row['tag']}] {c_row['name']}!"

            elif action == "leave":
                prov["clan_id"] = None
                save_province(conn, prov)
                msg = "You have left your Clan."

            elif action == "message":
                if not prov.get("clan_id"):
                    return web.json_response({"error": "You are not in a Clan."}, status=400)
                text = (data.get("message") or "").strip()
                if not text or len(text) > 300:
                    return web.json_response({"error": "Message must be 1–300 characters."}, status=400)
                conn.execute(
                    "INSERT INTO clan_messages (clan_id, province_id, province_name, message, created_at) VALUES (?, ?, ?, ?, ?)",
                    (prov["clan_id"], prov["id"], prov["name"], text, now),
                )
                msg = "Transmission sent to Clan Comms."

            else:
                return web.json_response({"error": "Invalid clan action."}, status=400)

            # Refresh clan_tag on prov
            p_row = conn.execute("SELECT * FROM provinces WHERE id = ?", (prov["id"],)).fetchone()
            prov = row_to_province(p_row, conn)
            world = build_world_state(conn, prov)
            return web.json_response({"message": msg, "username": username, **world})
    finally:
        conn.close()


async def index_handler(request: web.Request) -> web.FileResponse:
    return web.FileResponse(os.path.join(PUBLIC_DIR, "index.html"))


def create_app() -> web.Application:
    init_db()
    app = web.Application()
    app.router.add_get("/api/config", handle_config)
    app.router.add_post("/api/auth/register", handle_register)
    app.router.add_post("/api/auth/login", handle_login)
    app.router.add_post("/api/auth/logout", handle_logout)
    app.router.add_get("/api/state", handle_state)
    app.router.add_post("/api/action/turns", handle_turn_action)
    app.router.add_post("/api/action/build", handle_build)
    app.router.add_post("/api/action/train", handle_train)
    app.router.add_post("/api/action/research", handle_research)
    app.router.add_post("/api/action/attack", handle_attack)
    app.router.add_post("/api/action/covert", handle_covert)
    app.router.add_post("/api/action/clan", handle_clan_action)

    app.router.add_get("/", index_handler)
    app.router.add_static("/", PUBLIC_DIR, show_index=False)
    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app = create_app()
    print(f"☢️ Tsar Bomba Zone Tactical Server online at http://localhost:{port}")
    web.run_app(app, host="0.0.0.0", port=port, print=None)

