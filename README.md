# ☢️ Tsar Bomba Zone

**Tsar Bomba Zone** is a multiplayer web-based strategic text warfare game inspired by the classic browser game **Nukezone**. Designed from the ground up for both **Desktop** and **Mobile browsers**, it features turn-based territory management, power-grid balancing, combined-arms warfare, covert intelligence operations, clan alliances, and strategic thermonuclear weapons culminating in the **50-Megaton AN602 Tsar Bomba (RDS-220)**.

---

## 🚀 Quick Start

No external build steps or package installations are required on systems with Python 3.12 and `python3-aiohttp`:

```bash
python3 -m server.app
```

Then open **http://localhost:8080** in any desktop or mobile web browser.

---

## 🎮 Core Nukezone-Inspired Mechanics

1. **Turns, Land & Networth (`$NW`)**:
   - Turns regenerate automatically over time (and can be mobilized on demand during testing).
   - Spend turns to **Explore Territory (`m²`)**, **Produce Treasury Cash (`$`)**, **Enrich Uranium-235 (`U-235`)**, Construct Buildings, Train Units, Research Tech, or Launch Strikes.
   - Your **Networth (`$NW`)** dynamically reflects your land, buildings, military forces, nuclear arsenal, scientific research, and treasury.

2. **Base Infrastructure & Power Grid Balance**:
   - 13 distinct structures across Infrastructure, Economy, Military, Science, Strategic, and Defense categories.
   - Every structure (except **Command Bunkers** and **Nuclear Power Plants**) consumes Megawatts (`MW`) from your grid.
   - If power consumption exceeds output, your province suffers a **Brownout**, reducing factory output and weakening **SAM Batteries**, **Over-the-Horizon Radars**, and **Peresvet Laser Turrets**!

3. **Combined Arms Military & The Tsar Bomba**:
   - **Infantry**: Motorized Riflemen, RPG Shock Troopers, SVD Marksman Squads, Spetsnaz Alpha Operators.
   - **Armor/Vehicles**: BTR-90 APCs, T-80U Main Battle Tanks, 2S19 Msta Artillery, TOS-1A Thermobaric MLRS.
   - **Air Force**: MiG-31 Interceptors, Su-25T Close Air Support, Mi-24V Hind Gunships, Tu-160 Blackjack Bombers.
   - **Navy**: Tarantul Missile Corvettes, Akula Attack Submarines, Udaloy Destroyers, Kirov Nuclear Battlecruisers.
   - **Strategic Silo**: Tactical Scud-B, 3M-54 Kalibr Nuclear Cruise Missile, RT-2PM2 Topol-M ICBM, and the **50-Megaton AN602 Tsar Bomba**.

4. **War Room & Covert Intelligence**:
   - **Covert Ops**: Reconnaissance Scan (caches a full classified dossier on the target), Sabotage Power Plants (cripple enemy grid efficiency before attacking!), Siphon Treasury, and Sabotage Missile Silos.
   - **Conventional Offensives**: Combined Arms Invasion (captures 8%–16% of enemy land), Strategic Air Raid, and Amphibious Naval Blitz.
   - **Nuclear Strikes**: Launch ballistic missiles or the Tsar Bomba to vaporize enemy structures, units, and scorch territory.

5. **Clans & World Leaderboard**:
   - Join existing alliances (`[RED]`, `[NATO]`, `[SHDW]`) or charter your own Clan with an encrypted Clan Comms channel.
