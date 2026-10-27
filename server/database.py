"""
SQLite Database Layer for Tsar Bomba Zone.
Manages Users, Sessions, Provinces, Clans, Combat/Intel Logs, and AI World Seeding.
"""

import hashlib
import json
import os
import secrets
import sqlite3
import time
from typing import Optional

from server.game_config import AI_PROVINCES_SEED, BUILDINGS, GAME_CONFIG, RESEARCH, UNITS
from server.game_engine import compute_networth, compute_occupied_land

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tsar_bomba.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    if "$" not in stored_hash:
        return False
    salt, _ = stored_hash.split("$", 1)
    return hash_password(password, salt) == stored_hash


def default_buildings() -> dict:
    return {b_id: b_info.get("initial", 0) for b_id, b_info in BUILDINGS.items()}


def default_units() -> dict:
    u = {u_id: 0 for u_id in UNITS}
    u["conscripts"] = 60
    u["shock_troopers"] = 20
    u["btr_apc"] = 10
    u["operatives"] = 10
    u["counter_intel_agents"] = 5
    return u


def default_research() -> dict:
    return {r_id: 0 for r_id in RESEARCH}


def init_db() -> None:
    conn = get_conn()
    with conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                is_ai INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS clans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag TEXT UNIQUE NOT NULL,
                name TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                leader_province_id INTEGER,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS provinces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                name TEXT UNIQUE NOT NULL,
                faction TEXT NOT NULL,
                clan_id INTEGER,
                money INTEGER NOT NULL,
                land INTEGER NOT NULL,
                free_land INTEGER NOT NULL,
                turns INTEGER NOT NULL,
                max_turns INTEGER NOT NULL,
                uranium INTEGER NOT NULL,
                morale INTEGER NOT NULL,
                networth INTEGER NOT NULL,
                protection_turns_left INTEGER NOT NULL DEFAULT 50,
                buildings_json TEXT NOT NULL,
                units_json TEXT NOT NULL,
                research_json TEXT NOT NULL,
                intel_cache_json TEXT NOT NULL DEFAULT '{}',
                last_tick_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(clan_id) REFERENCES clans(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS combat_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attacker_id INTEGER NOT NULL,
                attacker_name TEXT NOT NULL,
                defender_id INTEGER NOT NULL,
                defender_name TEXT NOT NULL,
                log_type TEXT NOT NULL,
                victory INTEGER NOT NULL,
                summary TEXT NOT NULL,
                details_json TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS clan_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clan_id INTEGER NOT NULL,
                province_id INTEGER NOT NULL,
                province_name TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY(clan_id) REFERENCES clans(id) ON DELETE CASCADE
            );
            """
        )

    seed_world_if_empty(conn)
    with conn:
        conn.execute(
            """
            UPDATE provinces
            SET max_turns = 50,
                turns = CASE WHEN turns > 30 THEN 25 ELSE turns END,
                protection_turns_left = CASE WHEN protection_turns_left > 20 THEN 20 ELSE protection_turns_left END,
                last_tick_at = ?
            WHERE max_turns >= 200
            """,
            (int(time.time()),),
        )
    conn.close()


def seed_world_if_empty(conn: sqlite3.Connection) -> None:
    cur = conn.execute("SELECT COUNT(*) AS cnt FROM provinces")
    if cur.fetchone()["cnt"] > 0:
        return

    now = int(time.time())
    # Create initial Clans
    initial_clans = [
        ("RED", "Red Star Directorate", "Supreme thermonuclear coalition of the Northern Hemisphere."),
        ("NATO", "Atlantic Defense Pact", "Integrated air & missile defense alliance."),
        ("SHDW", "Shadow Pacific Syndicate", "Covert intelligence & deep-ocean naval syndicate."),
    ]
    clan_map = {}
    with conn:
        for tag, name, desc in initial_clans:
            c = conn.execute(
                "INSERT INTO clans (tag, name, description, created_at) VALUES (?, ?, ?, ?)",
                (tag, name, desc, now),
            )
            clan_map[tag] = c.lastrowid

        for ai in AI_PROVINCES_SEED:
            u_cur = conn.execute(
                "INSERT INTO users (username, password_hash, is_ai, created_at) VALUES (?, ?, 1, ?)",
                (ai["username"], hash_password(secrets.token_hex(12)), now),
            )
            user_id = u_cur.lastrowid

            b_dict = default_buildings()
            b_dict.update(ai["buildings"])
            u_dict = default_units()
            u_dict.update(ai["units"])
            r_dict = default_research()
            r_dict.update(ai["research"])

            occupied = compute_occupied_land(b_dict)
            free_land = max(0, ai["land"] - occupied)
            clan_id = clan_map.get(ai["clan_tag"]) if ai.get("clan_tag") else None

            prov_temp = {
                "land": ai["land"],
                "money": ai["money"],
                "uranium": ai["uranium"],
                "buildings": b_dict,
                "units": u_dict,
                "research": r_dict,
            }
            nw = compute_networth(prov_temp)

            p_cur = conn.execute(
                """
                INSERT INTO provinces (
                    user_id, name, faction, clan_id, money, land, free_land,
                    turns, max_turns, uranium, morale, networth, protection_turns_left,
                    buildings_json, units_json, research_json, intel_cache_json,
                    last_tick_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, '{}', ?, ?)
                """,
                (
                    user_id,
                    ai["province_name"],
                    ai["faction"],
                    clan_id,
                    ai["money"],
                    ai["land"],
                    free_land,
                    40,
                    50,
                    ai["uranium"],
                    100,
                    nw,
                    json.dumps(b_dict),
                    json.dumps(u_dict),
                    json.dumps(r_dict),
                    now,
                    now,
                ),
            )
            prov_id = p_cur.lastrowid
            if clan_id:
                conn.execute(
                    "UPDATE clans SET leader_province_id = COALESCE(leader_province_id, ?) WHERE id = ?",
                    (prov_id, clan_id),
                )
                conn.execute(
                    "INSERT INTO clan_messages (clan_id, province_id, province_name, message, created_at) VALUES (?, ?, ?, ?, ?)",
                    (
                        clan_id,
                        prov_id,
                        ai["province_name"],
                        f"All stations on DEFCON 2. {ai['province_name']} online and monitoring radar sectors.",
                        now,
                    ),
                )


def row_to_province(row: sqlite3.Row, conn: Optional[sqlite3.Connection] = None) -> dict:
    buildings = json.loads(row["buildings_json"])
    units = json.loads(row["units_json"])
    research = json.loads(row["research_json"])
    intel_cache = json.loads(row["intel_cache_json"] or "{}")

    clan_tag = None
    clan_name = None
    if row["clan_id"] and conn is not None:
        c_row = conn.execute("SELECT tag, name FROM clans WHERE id = ?", (row["clan_id"],)).fetchone()
        if c_row:
            clan_tag = c_row["tag"]
            clan_name = c_row["name"]

    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "name": row["name"],
        "faction": row["faction"],
        "clan_id": row["clan_id"],
        "clan_tag": clan_tag,
        "clan_name": clan_name,
        "money": row["money"],
        "land": row["land"],
        "free_land": row["free_land"],
        "turns": row["turns"],
        "max_turns": row["max_turns"],
        "uranium": row["uranium"],
        "morale": row["morale"],
        "networth": row["networth"],
        "protection_turns_left": row["protection_turns_left"],
        "buildings": buildings,
        "units": units,
        "research": research,
        "intel_cache": intel_cache,
        "last_tick_at": row["last_tick_at"],
        "created_at": row["created_at"],
    }


def save_province(conn: sqlite3.Connection, prov: dict) -> None:
    prov["occupied_land"] = compute_occupied_land(prov["buildings"])
    prov["free_land"] = max(0, prov["land"] - prov["occupied_land"])
    prov["networth"] = compute_networth(prov)

    conn.execute(
        """
        UPDATE provinces SET
            clan_id = ?,
            money = ?,
            land = ?,
            free_land = ?,
            turns = ?,
            max_turns = ?,
            uranium = ?,
            morale = ?,
            networth = ?,
            protection_turns_left = ?,
            buildings_json = ?,
            units_json = ?,
            research_json = ?,
            intel_cache_json = ?,
            last_tick_at = ?
        WHERE id = ?
        """,
        (
            prov.get("clan_id"),
            int(prov["money"]),
            int(prov["land"]),
            int(prov["free_land"]),
            int(prov["turns"]),
            int(prov["max_turns"]),
            int(prov["uranium"]),
            int(prov["morale"]),
            int(prov["networth"]),
            int(prov["protection_turns_left"]),
            json.dumps(prov["buildings"]),
            json.dumps(prov["units"]),
            json.dumps(prov["research"]),
            json.dumps(prov.get("intel_cache", {})),
            int(prov["last_tick_at"]),
            prov["id"],
        ),
    )


def create_user_and_province(username: str, password: str, province_name: str, faction: str) -> dict:
    conn = get_conn()
    now = int(time.time())
    start = GAME_CONFIG["starting_resources"]
    b_dict = default_buildings()
    u_dict = default_units()
    r_dict = default_research()

    occupied = compute_occupied_land(b_dict)
    free_land = start["land"] - occupied
    temp_prov = {
        "land": start["land"],
        "money": start["money"],
        "uranium": start["uranium"],
        "buildings": b_dict,
        "units": u_dict,
        "research": r_dict,
    }
    nw = compute_networth(temp_prov)

    try:
        with conn:
            u_cur = conn.execute(
                "INSERT INTO users (username, password_hash, is_ai, created_at) VALUES (?, ?, 0, ?)",
                (username, hash_password(password), now),
            )
            user_id = u_cur.lastrowid

            p_cur = conn.execute(
                """
                INSERT INTO provinces (
                    user_id, name, faction, clan_id, money, land, free_land,
                    turns, max_turns, uranium, morale, networth, protection_turns_left,
                    buildings_json, units_json, research_json, intel_cache_json,
                    last_tick_at, created_at
                ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', ?, ?)
                """,
                (
                    user_id,
                    province_name,
                    faction,
                    start["money"],
                    start["land"],
                    free_land,
                    start["turns"],
                    start["max_turns"],
                    start["uranium"],
                    start["morale"],
                    nw,
                    start["protection_turns"],
                    json.dumps(b_dict),
                    json.dumps(u_dict),
                    json.dumps(r_dict),
                    now,
                    now,
                ),
            )
            token = secrets.token_hex(24)
            conn.execute(
                "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
                (token, user_id, now),
            )
            row = conn.execute("SELECT * FROM provinces WHERE id = ?", (p_cur.lastrowid,)).fetchone()
            prov = row_to_province(row, conn)
            return {"token": token, "username": username, "province": prov}
    finally:
        conn.close()

