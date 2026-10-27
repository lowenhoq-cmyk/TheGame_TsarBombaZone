/**
 * Tsar Bomba Zone — Frontend Tactical Client
 * Supports both Desktop and Mobile Web Browsers
 */

const state = {
  token: localStorage.getItem("tbz_token") || null,
  username: null,
  config: null,
  province: null,
  leaderboard: [],
  logs: [],
  clans: [],
  clan_messages: [],
  activeTab: "overview",
  turnQty: 1,
  buildQty: 1,
  trainQty: 1,
  militaryFilter: "ALL",
  selectedTargetId: null,
};

const fmt = (n) => Number(n || 0).toLocaleString();

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }
  const res = await fetch(path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Command request failed.");
  }
  return data;
}

function showBanner(msg, isError = false) {
  const el = document.getElementById("action-banner");
  el.textContent = msg;
  el.classList.remove("hidden", "error");
  if (isError) el.classList.add("error");
  clearTimeout(window._bannerTimer);
  window._bannerTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, 7000);
}

/* AUTHENTICATION & INITIALIZATION */
window.switchAuthTab = function (tab) {
  const isReg = tab === "register";
  document.getElementById("tab-register").classList.toggle("active", isReg);
  document.getElementById("tab-login").classList.toggle("active", !isReg);
  document.getElementById("register-form").classList.toggle("hidden", !isReg);
  document.getElementById("login-form").classList.toggle("hidden", isReg);
  document.getElementById("auth-error").classList.add("hidden");
};

function renderFactionSelector() {
  if (!state.config) return;
  const container = document.getElementById("faction-selector");
  const current = document.getElementById("reg-faction").value;
  container.innerHTML = Object.values(state.config.factions)
    .map(
      (f) => `
      <div class="faction-option ${f.id === current ? "selected" : ""}" onclick="window.selectFaction('${f.id}')">
        <div class="faction-option-title">${f.badge} ${f.name}</div>
        <div class="faction-option-desc">${f.description}</div>
      </div>
    `
    )
    .join("");
}

window.selectFaction = function (factionId) {
  document.getElementById("reg-faction").value = factionId;
  renderFactionSelector();
};

window.handleRegister = async function (e) {
  e.preventDefault();
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const province_name = document.getElementById("reg-province").value.trim();
  const faction = document.getElementById("reg-faction").value;

  try {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, province_name, faction }),
    });
    onAuthSuccess(res);
  } catch (err) {
    const errBox = document.getElementById("auth-error");
    errBox.textContent = err.message;
    errBox.classList.remove("hidden");
  }
};

window.quickStartCommander = async function () {
  const rand = Math.floor(100 + Math.random() * 899);
  const factions = ["soviet_directorate", "nato_command", "pacific_syndicate"];
  const faction = factions[rand % factions.length];
  try {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: `cmdr_${rand}`,
        password: `pass_${rand}`,
        province_name: `Sector-${rand} Atomic Bastion`,
        faction,
      }),
    });
    onAuthSuccess(res);
    showBanner(`Welcome Commander! Sector-${rand} Atomic Bastion is online with 25 operational turns.`);
  } catch (err) {
    const errBox = document.getElementById("auth-error");
    errBox.textContent = err.message;
    errBox.classList.remove("hidden");
  }
};

window.handleLogin = async function (e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    onAuthSuccess(res);
  } catch (err) {
    const errBox = document.getElementById("auth-error");
    errBox.textContent = err.message;
    errBox.classList.remove("hidden");
  }
};

window.handleLogout = async function () {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch (_) {}
  localStorage.removeItem("tbz_token");
  state.token = null;
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("auth-screen").classList.remove("hidden");
};

function onAuthSuccess(data) {
  state.token = data.token;
  localStorage.setItem("tbz_token", data.token);
  applyServerState(data);
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  maybeAutoStartTutorial();
}

function applyServerState(data) {
  if (data.username) state.username = data.username;
  if (data.province) state.province = data.province;
  if (data.leaderboard) state.leaderboard = data.leaderboard;
  if (data.logs) state.logs = data.logs;
  if (data.clans) state.clans = data.clans;
  if (data.clan_messages) state.clan_messages = data.clan_messages;

  if (!state.selectedTargetId && state.leaderboard.length > 0) {
    const firstEnemy = state.leaderboard.find((p) => !p.is_self);
    if (firstEnemy) state.selectedTargetId = firstEnemy.id;
  }

  renderAll();
}

window.refreshState = async function () {
  try {
    const data = await apiFetch("/api/state");
    applyServerState(data);
  } catch (err) {
    handleLogout();
  }
};

/* TAB NAVIGATION */
window.switchTab = function (tabName) {
  state.activeTab = tabName;
  document.querySelectorAll(".tab-view").forEach((el) => el.classList.add("hidden"));
  const target = document.getElementById(`tab-view-${tabName}`);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-btn, .mob-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  renderAll();
};

/* RENDERING FUNCTIONS */
function hydrateStaticIcons() {
  if (!window.getTbzIcon) return;
  document.querySelectorAll("[data-icon]").forEach((el) => {
    if (!el.dataset.hydrated) {
      el.innerHTML = window.getTbzIcon(el.dataset.icon);
      el.dataset.hydrated = "1";
    }
  });
}

function renderAll() {
  if (!state.province || !state.config) return;
  hydrateStaticIcons();
  renderHUD();
  renderOverview();
  renderBuildings();
  renderMilitary();
  renderResearch();
  renderWarRoom();
  renderLogs();
  renderClans();
  renderRankings();
}

function formatCountdown(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function updateTurnTickDisplay() {
  if (!state.province) return;
  const p = state.province;
  const timerStr = formatCountdown(p.next_tick_seconds);
  const perHr = p.turns_per_hour || 7;
  const hudTimer = document.getElementById("hud-turn-timer");
  if (hudTimer) hudTimer.textContent = `+${perHr}T in ${timerStr}`;
  const ovNext = document.getElementById("overview-next-tick");
  if (ovNext) ovNext.textContent = `+${perHr} Turns in ${timerStr}`;
  const ovRegen = document.getElementById("overview-regen-rate");
  if (ovRegen) ovRegen.textContent = `+${perHr} Turns/hr`;
}

function renderHUD() {
  const p = state.province;
  const f = state.config.factions[p.faction] || { name: p.faction, badge: "☢" };

  document.getElementById("hud-province-name").textContent = p.name;
  document.getElementById("hud-faction-name").textContent = `${f.badge} ${f.name} // Morale: ${p.morale}%`;

  const clanBadge = document.getElementById("hud-clan-tag");
  if (p.clan_tag) {
    clanBadge.textContent = `[${p.clan_tag}]`;
    clanBadge.classList.remove("hidden");
  } else {
    clanBadge.classList.add("hidden");
  }

  document.getElementById("hud-turns").textContent = fmt(p.turns);
  document.getElementById("hud-max-turns").textContent = `/${p.max_turns}`;
  updateTurnTickDisplay();

  document.getElementById("hud-money").textContent = `$${fmt(p.money)}`;
  document.getElementById("hud-uranium").textContent = fmt(p.uranium);
  document.getElementById("hud-free-land").textContent = fmt(p.free_land);
  document.getElementById("hud-land").textContent = fmt(p.land);

  const pwrEl = document.getElementById("hud-power");
  const eff = p.power_stats.efficiency_pct;
  pwrEl.textContent = `${eff}% (${p.power_stats.produced}/${p.power_stats.consumed} MW)`;
  pwrEl.className = `res-val ${eff >= 100 ? "text-green" : "text-red"}`;

  document.getElementById("hud-networth").textContent = `$${fmt(p.networth)}`;

  const protEl = document.getElementById("protection-indicator");
  if (p.protection_turns_left > 0) {
    protEl.textContent = `🛡️ UN PROTECTION: ${p.protection_turns_left}T LEFT`;
    protEl.classList.remove("hidden");
  } else {
    protEl.classList.add("hidden");
  }
}

function renderOverview() {
  const p = state.province;
  const mil = p.military_stats;
  const pwr = p.power_stats;
  const inc = p.income_stats;

  document.getElementById("overview-cash-rate").textContent = `Yield: +$${fmt(inc.cash_per_turn * state.turnQty)} (${state.turnQty}T)`;
  document.getElementById("overview-uranium-rate").textContent = `Yield: +${Math.max(1, inc.uranium_per_op * state.turnQty)} U-235 (${state.turnQty}T)`;
  document.getElementById("overview-morale-val").textContent = `Current Morale: ${p.morale}%`;

  const logCostEl = document.getElementById("logistics-cost-label");
  if (logCostEl && p.logistics_turn_cost) {
    logCostEl.textContent = `Spend $${fmt(p.logistics_turn_cost)} Treasury to mobilize +4 Turns`;
  }

  const dirContainer = document.getElementById("directives-list");
  if (dirContainer && p.directives) {
    dirContainer.innerHTML = p.directives
      .map((d) => {
        const rewardText = `+${d.reward_turns} Turns, +$${fmt(d.reward_money)}${d.reward_uranium > 0 ? `, +${d.reward_uranium} U-235` : ""}`;
        let btnHtml = "";
        if (d.claimed) {
          btnHtml = `<button class="btn btn-secondary btn-sm btn-block" disabled>✓ DIRECTIVE CLAIMED</button>`;
        } else if (d.ready) {
          btnHtml = `<button class="btn btn-primary btn-sm btn-block" onclick="window.claimDirective('${d.id}')">🎖️ CLAIM +${d.reward_turns} TURNS &amp; REWARD</button>`;
        } else {
          btnHtml = `<button class="btn btn-outline btn-sm btn-block" disabled>PROGRESS: ${fmt(d.current)} / ${fmt(d.target)}</button>`;
        }

        return `
          <div class="op-box">
            <div>
              <div class="op-header-row">
                <div class="thumb-pic">${window.getTbzIcon ? window.getTbzIcon("dir_" + d.id) : ""}</div>
                <div>
                  <div class="op-title">${d.claimed ? "✅" : d.ready ? "🎖️" : "📋"} ${d.title}</div>
                  <p class="op-desc">${d.description}</p>
                </div>
              </div>
              <div class="op-meta">Reward: ${rewardText}</div>
            </div>
            ${btnHtml}
          </div>
        `;
      })
      .join("");
  }

  const tsars = p.units.tsar_bomba || 0;
  const totalMissiles =
    (p.units.tactical_scud || 0) +
    (p.units.cruise_missile || 0) +
    (p.units.icbm_topol || 0) +
    tsars;

  document.getElementById("overview-combat-stats").innerHTML = `
    <div class="stat-row"><span>Combined Offense Rating</span><strong class="text-green">${fmt(mil.attack)}</strong></div>
    <div class="stat-row"><span>Combined Defense Rating</span><strong class="text-cyan">${fmt(mil.defense)} (Turrets: ${fmt(mil.turret_defense)})</strong></div>
    <div class="stat-row"><span>ABM Missile Interception</span><strong class="text-amber">${mil.missile_intercept_pct}% Chance</strong></div>
    <div class="stat-row"><span>Espionage / Counter-Intel</span><strong>${fmt(mil.spy_power)} / ${fmt(mil.anti_spy_power)}</strong></div>
    <div class="stat-row"><span>Armed Nuclear / Ballistic Missiles</span><strong class="${tsars > 0 ? "text-red" : ""}">${totalMissiles} (${tsars}x Tsar Bomba)</strong></div>
  `;

  document.getElementById("overview-economy-stats").innerHTML = `
    <div class="stat-row"><span>Hourly Turn Regeneration</span><strong class="text-amber">+${p.turns_per_hour || 7} Turns / hour (Cap: ${p.max_turns})</strong></div>
    <div class="stat-row"><span>Power Grid Output / Drain</span><strong class="${pwr.efficiency_pct >= 100 ? "text-green" : "text-red"}">${fmt(pwr.produced)} MW / ${fmt(pwr.consumed)} MW (${pwr.efficiency_pct}%)</strong></div>
    <div class="stat-row"><span>Territory (Occupied / Total)</span><strong>${fmt(p.occupied_land)} / ${fmt(p.land)} m² (${fmt(p.free_land)} m² Free)</strong></div>
    <div class="stat-row"><span>Industrial Cash per Turn</span><strong class="text-green">+$${fmt(inc.cash_per_turn)} / turn</strong></div>
    <div class="stat-row"><span>Uranium Centrifuge Output</span><strong class="text-amber">+${inc.uranium_per_op} U-235 / turn</strong></div>
  `;

  const recentContainer = document.getElementById("overview-recent-logs");
  if (state.logs.length === 0) {
    recentContainer.innerHTML = `<div class="stat-row">No combat or espionage transmissions recorded yet.</div>`;
  } else {
    recentContainer.innerHTML = state.logs
      .slice(0, 5)
      .map((l) => formatLogItemHTML(l))
      .join("");
  }
}

window.claimDirective = async function (directive_id) {
  try {
    const res = await apiFetch("/api/action/turns", {
      method: "POST",
      body: JSON.stringify({ action: "claim_directive", directive_id, turns: 1 }),
    });
    applyServerState(res);
    showBanner(res.message);
  } catch (err) {
    showBanner(err.message, true);
  }
};

/* TURN OPERATIONS */
window.setTurnQty = function (qty, btnEl) {
  state.turnQty = qty;
  document.querySelectorAll(".turn-qty-selector .qty-btn").forEach((b) => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  document.querySelectorAll(".turn-qty-label").forEach((el) => (el.textContent = qty));
  renderOverview();
};

window.executeTurnOp = function (action) {
  window.spendTurns(action, state.turnQty);
};

window.spendTurns = async function (action, turns) {
  try {
    const res = await apiFetch("/api/action/turns", {
      method: "POST",
      body: JSON.stringify({ action, turns }),
    });
    applyServerState(res);
    showBanner(res.message);
  } catch (err) {
    showBanner(err.message, true);
  }
};

/* BUILDINGS */
window.setBuildQty = function (qty, btnEl) {
  state.buildQty = qty;
  btnEl.parentElement.querySelectorAll(".qty-btn").forEach((b) => b.classList.remove("active"));
  btnEl.classList.add("active");
  renderBuildings();
};

function renderBuildings() {
  const p = state.province;
  const pwr = p.power_stats;
  const banner = document.getElementById("power-alert-banner");

  if (pwr.efficiency_pct >= 100) {
    banner.className = "power-banner mb-16";
    banner.innerHTML = `⚡ <strong>POWER GRID NOMINAL (100% EFFICIENCY)</strong> — Output: ${fmt(pwr.produced)} MW | Consumption: ${fmt(pwr.consumed)} MW | Surplus: +${fmt(pwr.surplus)} MW`;
  } else {
    banner.className = "power-banner brownout mb-16";
    banner.innerHTML = `⚠️ <strong>BROWNOUT WARNING (${pwr.efficiency_pct}% EFFICIENCY)</strong> — Output: ${fmt(pwr.produced)} MW vs Drain: ${fmt(pwr.consumed)} MW. Construct more <strong>Nuclear Power Plants</strong> immediately or base turrets and factories operate at ${pwr.efficiency_pct}%!`;
  }

  const qty = state.buildQty;
  const turnsCost = Math.max(1, Math.floor((qty + 4) / 5));

  document.getElementById("buildings-grid").innerHTML = Object.values(state.config.buildings)
    .map((b) => {
      const owned = p.buildings[b.id] || 0;
      const totalCost = b.cost * qty;
      const totalLand = b.land * qty;
      const pwrText = b.power > 0 ? `+${b.power} MW` : `${b.power} MW`;
      const pwrClass = b.power > 0 ? "text-green" : "text-amber";

      return `
        <div class="item-card">
          <div>
            <div class="item-header-with-pic">
              <div class="thumb-pic">${window.getTbzIcon ? window.getTbzIcon(b.id) : ""}</div>
              <div class="item-header-body">
                <div class="item-top">
                  <span class="item-name">${b.name}</span>
                  <span class="item-cat-tag">${b.category}</span>
                </div>
                <div class="item-owned">Operational: <strong>${fmt(owned)}</strong></div>
              </div>
            </div>
            <p class="item-desc">${b.description}</p>
            <div class="item-specs">
              <span class="spec-badge">Cost: $${fmt(b.cost)}</span>
              <span class="spec-badge">Land: ${b.land} m²</span>
              <span class="spec-badge ${pwrClass}">Power: ${pwrText}</span>
              ${b.defense ? `<span class="spec-badge text-cyan">Def: +${b.defense}</span>` : ""}
            </div>
          </div>
          <div class="item-actions">
            <button class="btn btn-primary btn-sm" style="flex:1" onclick="window.buildStructure('${b.id}', ${qty}, 'build')">
              BUILD ${qty}x ($${fmt(totalCost)} / ${totalLand}m² / ${turnsCost}T)
            </button>
            ${
              owned > 0 && b.id !== "command_center"
                ? `<button class="btn btn-danger-outline btn-sm" onclick="window.buildStructure('${b.id}', 1, 'demolish')" title="Demolish 1x">🗑️</button>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

window.buildStructure = async function (building_id, quantity, mode) {
  try {
    const res = await apiFetch("/api/action/build", {
      method: "POST",
      body: JSON.stringify({ building_id, quantity, mode }),
    });
    applyServerState(res);
    showBanner(res.message);
  } catch (err) {
    showBanner(err.message, true);
  }
};

/* MILITARY & SILOS */
window.setTrainQty = function (qty, btnEl) {
  state.trainQty = qty;
  btnEl.parentElement.querySelectorAll(".qty-btn").forEach((b) => b.classList.remove("active"));
  btnEl.classList.add("active");
  renderMilitary();
};

window.filterMilitary = function (cat, btnEl) {
  state.militaryFilter = cat;
  document.querySelectorAll("#military-cat-tabs .sub-tab").forEach((b) => b.classList.remove("active"));
  btnEl.classList.add("active");
  renderMilitary();
};

function renderMilitary() {
  const p = state.province;
  const qty = state.trainQty;

  const unitsList = Object.values(state.config.units).filter(
    (u) => state.militaryFilter === "ALL" || u.category === state.militaryFilter
  );

  document.getElementById("military-grid").innerHTML = unitsList
    .map((u) => {
      const owned = p.units[u.id] || 0;
      const reqB = u.req_building;
      const hasBuilding = !reqB || (p.buildings[reqB] || 0) > 0;

      let hasTech = true;
      let missingReqs = [];

      if (!hasBuilding) {
        missingReqs.push(`Build ${state.config.buildings[reqB].name}`);
      }
      if (u.req_tech) {
        const [tId, tLvl] = u.req_tech;
        if ((p.research[tId] || 0) < tLvl) {
          hasTech = false;
          missingReqs.push(`${state.config.research[tId].name} Lv.${tLvl}`);
        }
      }
      if (u.secondary_req_tech) {
        const [stId, stLvl] = u.secondary_req_tech;
        if ((p.research[stId] || 0) < stLvl) {
          hasTech = false;
          missingReqs.push(`${state.config.research[stId].name} Lv.${stLvl}`);
        }
      }

      const unlocked = hasBuilding && hasTech;
      const isMissile = u.category === "Missiles";
      const effectiveQty = isMissile && qty > 10 ? 1 : qty;

      let unitCost = u.cost;
      if (isMissile && p.faction === "soviet_directorate") {
        unitCost = Math.round(unitCost * 0.85);
      }
      const totalCost = unitCost * effectiveQty;
      const totalU = (u.uranium || 0) * effectiveQty;

      return `
        <div class="item-card ${!unlocked ? "locked" : ""} ${u.id === "tsar_bomba" ? "tsar-highlight" : ""}">
          <div>
            <div class="item-header-with-pic">
              <div class="thumb-pic">${window.getTbzIcon ? window.getTbzIcon(u.id) : ""}</div>
              <div class="item-header-body">
                <div class="item-top">
                  <span class="item-name">${u.id === "tsar_bomba" ? "☢️ " : ""}${u.name}</span>
                  <span class="item-cat-tag">${u.category}</span>
                </div>
                <div class="item-owned">Deployed / Stockpiled: <strong>${fmt(owned)}</strong></div>
              </div>
            </div>
            <p class="item-desc">${u.description}</p>
            <div class="item-specs">
              <span class="spec-badge">Cost: $${fmt(unitCost)}</span>
              ${u.uranium > 0 ? `<span class="spec-badge text-amber">U-235: ${u.uranium}</span>` : ""}
              ${u.attack > 0 ? `<span class="spec-badge text-green">Atk: ${u.attack}</span>` : ""}
              ${u.defense > 0 ? `<span class="spec-badge text-cyan">Def: ${u.defense}</span>` : ""}
              ${u.spy_power ? `<span class="spec-badge text-amber">Spy: +${u.spy_power}</span>` : ""}
              ${u.anti_spy_power ? `<span class="spec-badge text-cyan">Anti-Spy: +${u.anti_spy_power}</span>` : ""}
              ${u.building_damage ? `<span class="spec-badge text-red">Blast: ${u.building_damage[0]}–${u.building_damage[1]} Bldgs</span>` : ""}
            </div>
          </div>
          <div>
            ${
              unlocked
                ? `<button class="btn ${u.id === "tsar_bomba" ? "btn-nuke" : "btn-primary"} btn-sm btn-block" onclick="window.trainUnit('${u.id}', ${effectiveQty})">
                    PRODUCE ${effectiveQty}x ($${fmt(totalCost)}${totalU > 0 ? ` + ${totalU} U-235` : ""})
                  </button>`
                : `<div class="spec-badge text-red">🔒 Requires: ${missingReqs.join(" & ")}</div>`
            }
          </div>
        </div>
      `;
    })
    .join("");
}

window.trainUnit = async function (unit_id, quantity) {
  try {
    const res = await apiFetch("/api/action/train", {
      method: "POST",
      body: JSON.stringify({ unit_id, quantity }),
    });
    applyServerState(res);
    showBanner(res.message);
  } catch (err) {
    showBanner(err.message, true);
  }
};

/* RESEARCH */
function renderResearch() {
  const p = state.province;
  const labs = Math.max(1, p.buildings.research_lab || 0);
  const costMult = p.faction === "pacific_syndicate" ? 0.85 : 1.0;

  document.getElementById("research-grid").innerHTML = Object.values(state.config.research)
    .map((r) => {
      const lvl = p.research[r.id] || 0;
      const isMax = lvl >= r.max_level;
      const moneyCost = Math.round(r.base_cost * Math.pow(1.45, lvl) * costMult);
      const uCost = Math.round((r.base_uranium || 0) * Math.pow(1.35, lvl));
      const turnsNeeded = Math.max(1, Math.round((r.base_turns + Math.floor(lvl / 2)) * (1.0 / (1.0 + (labs - 1) * 0.12))));

      return `
        <div class="item-card ${r.id === "thermonuclear_fission" ? "tsar-highlight" : ""}">
          <div>
            <div class="item-header-with-pic">
              <div class="thumb-pic">${window.getTbzIcon ? window.getTbzIcon(r.id) : ""}</div>
              <div class="item-header-body">
                <div class="item-top">
                  <span class="item-name">${r.name}</span>
                  <span class="item-cat-tag">${r.category}</span>
                </div>
                <div class="item-owned">Current Level: <strong>${lvl} / ${r.max_level}</strong></div>
              </div>
            </div>
            <p class="item-desc">${r.description}</p>
            ${
              !isMax
                ? `<div class="item-specs">
                    <span class="spec-badge">Upgrade Cost: $${fmt(moneyCost)}</span>
                    ${uCost > 0 ? `<span class="spec-badge text-amber">U-235: ${uCost}</span>` : ""}
                    <span class="spec-badge">Turns: ${turnsNeeded}T</span>
                  </div>`
                : `<div class="item-specs"><span class="spec-badge text-green">MAXIMUM TECH LEVEL ACHIEVED</span></div>`
            }
          </div>
          <div>
            ${
              !isMax
                ? `<button class="btn btn-primary btn-sm btn-block" onclick="window.upgradeTech('${r.id}')">
                    RESEARCH LEVEL ${lvl + 1} ($${fmt(moneyCost)}${uCost > 0 ? ` + ${uCost} U` : ""} / ${turnsNeeded}T)
                  </button>`
                : `<button class="btn btn-secondary btn-sm btn-block" disabled>COMPLETED</button>`
            }
          </div>
        </div>
      `;
    })
    .join("");
}

window.upgradeTech = async function (tech_id) {
  try {
    const res = await apiFetch("/api/action/research", {
      method: "POST",
      body: JSON.stringify({ tech_id }),
    });
    applyServerState(res);
    showBanner(res.message);
  } catch (err) {
    showBanner(err.message, true);
  }
};

/* WAR ROOM & COVERT OPS */
function renderWarRoom() {
  const p = state.province;
  const enemies = state.leaderboard.filter((row) => !row.is_self);
  const selectEl = document.getElementById("war-target-select");

  selectEl.innerHTML = enemies
    .map(
      (e) => `
      <option value="${e.id}" ${Number(state.selectedTargetId) === e.id ? "selected" : ""}>
        #${e.rank} ${e.clan_tag ? `[${e.clan_tag}] ` : ""}${e.name} — NW: $${fmt(e.networth)} (${e.land} m²)
      </option>
    `
    )
    .join("");

  document.getElementById("war-spy-power").textContent = fmt(p.military_stats.spy_power);
  document.getElementById("war-agent-count").textContent = fmt(p.units.operatives || 0);
  document.getElementById("war-atk-power").textContent = fmt(p.military_stats.attack);

  renderTargetDetails();

  const missileTypes = ["tactical_scud", "cruise_missile", "icbm_topol", "tsar_bomba"];
  document.getElementById("war-missile-buttons").innerHTML = missileTypes
    .map((mId) => {
      const m = state.config.units[mId];
      const count = p.units[mId] || 0;
      const isTsar = mId === "tsar_bomba";
      return `
        <button class="btn ${isTsar ? "btn-nuke" : "btn-secondary"} war-btn-with-pic" ${count <= 0 ? "disabled" : ""} onclick="window.launchAttack('missile', '${mId}')">
          <div class="thumb-pic sm">${window.getTbzIcon ? window.getTbzIcon(mId) : ""}</div>
          <div class="war-btn-text">
            <span>${isTsar ? "☢️ LAUNCH TSAR BOMBA" : `🚀 LAUNCH ${m.name.split(" (")[0].toUpperCase()}`}</span>
            <small>Stockpile: ${count} armed | Blast: ${m.building_damage[0]}–${m.building_damage[1]} structures</small>
          </div>
        </button>
      `;
    })
    .join("");
}

window.onTargetChange = function () {
  const selectEl = document.getElementById("war-target-select");
  state.selectedTargetId = Number(selectEl.value);
  renderTargetDetails();
};

function renderTargetDetails() {
  const target = state.leaderboard.find((e) => e.id === Number(state.selectedTargetId));
  const summaryBox = document.getElementById("target-summary-box");
  const intelBox = document.getElementById("target-intel-box");

  if (!target) {
    summaryBox.innerHTML = "No target selected.";
    intelBox.innerHTML = "";
    return;
  }

  const f = state.config.factions[target.faction] || { name: target.faction, badge: "☢" };
  summaryBox.innerHTML = `
    <div class="stat-row"><span>Province</span><strong>${target.clan_tag ? `[${target.clan_tag}] ` : ""}${target.name}</strong></div>
    <div class="stat-row"><span>Commander</span><strong>${target.username} ${target.is_ai ? "(AI Commander)" : "(Player)"}</strong></div>
    <div class="stat-row"><span>Doctrine</span><strong>${f.badge} ${f.name}</strong></div>
    <div class="stat-row"><span>Territory</span><strong>${fmt(target.land)} m²</strong></div>
    <div class="stat-row"><span>Networth</span><strong class="text-cyan">$${fmt(target.networth)}</strong></div>
    <div class="stat-row"><span>Protection</span><strong>${target.protection_turns_left > 0 ? `Protected (${target.protection_turns_left}T)` : "Vulnerable to Strike"}</strong></div>
  `;

  const cached = state.province.intel_cache && state.province.intel_cache[String(target.id)];
  if (!cached) {
    intelBox.innerHTML = `<div class="text-muted">🕵️ No Reconnaissance File on record for ${target.name}. Run <strong>Reconnaissance Scan</strong> (3 Turns) to reveal exact defense ratings, power grid, treasury, and nuclear stockpile.</div>`;
  } else {
    const d = cached.data;
    intelBox.innerHTML = `
      <div style="color:var(--amber);font-weight:700;margin-bottom:6px">📂 CLASSIFIED RECON DOSSIER:</div>
      <div class="stat-row"><span>Treasury / Uranium</span><strong class="text-green">$${fmt(d.money)} / ${fmt(d.uranium)} U-235</strong></div>
      <div class="stat-row"><span>Defense / Attack Rating</span><strong class="text-cyan">${fmt(d.defense_rating)} Def / ${fmt(d.attack_rating)} Atk</strong></div>
      <div class="stat-row"><span>Power Grid Efficiency</span><strong class="${d.power_efficiency_pct >= 100 ? "text-green" : "text-red"}">${d.power_efficiency_pct}% (${d.power_produced}/${d.power_consumed} MW)</strong></div>
      <div class="stat-row"><span>ABM Missile Intercept</span><strong class="text-amber">${d.missile_intercept_pct}%</strong></div>
      <div class="stat-row"><span>Power Plants / SAMs / Lasers</span><strong>${d.buildings.power_plant || 0} / ${d.buildings.sam_site || 0} / ${d.buildings.laser_turret || 0}</strong></div>
      <div class="stat-row"><span>Tsar Bomba / ICBMs Armed</span><strong class="text-red">${d.units.tsar_bomba || 0} Tsar / ${d.units.icbm_topol || 0} ICBM</strong></div>
    `;
  }
}

window.targetFromLeaderboard = function (targetId) {
  state.selectedTargetId = targetId;
  window.switchTab("war");
};

window.launchAttack = async function (mode, sub_type) {
  if (!state.selectedTargetId) return;
  try {
    const res = await apiFetch("/api/action/attack", {
      method: "POST",
      body: JSON.stringify({
        target_id: Number(state.selectedTargetId),
        mode,
        sub_type,
      }),
    });
    applyServerState(res);
    showBanner(res.message, !res.battle_report.victory);
  } catch (err) {
    showBanner(err.message, true);
  }
};

window.launchCovert = async function (op_type) {
  if (!state.selectedTargetId) return;
  try {
    const res = await apiFetch("/api/action/covert", {
      method: "POST",
      body: JSON.stringify({
        target_id: Number(state.selectedTargetId),
        op_type,
      }),
    });
    applyServerState(res);
    showBanner(res.message, !res.covert_report.success);
  } catch (err) {
    showBanner(err.message, true);
  }
};

/* LOGS */
function formatLogItemHTML(l) {
  const dateStr = new Date(l.created_at * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const cls = l.log_type === "nuclear" ? "nuclear" : l.victory ? "victory" : "defeat";
  const dirBadge = l.is_outgoing ? "OUTGOING OP" : "INCOMING ALERT";
  return `
    <div class="log-item ${cls}">
      <div class="log-meta">
        <span>[${dirBadge}] ${l.attacker_name} → ${l.defender_name} (${l.log_type.toUpperCase()})</span>
        <span>${dateStr}</span>
      </div>
      <div class="log-summary">${l.summary}</div>
    </div>
  `;
}

function renderLogs() {
  const container = document.getElementById("full-logs-list");
  if (state.logs.length === 0) {
    container.innerHTML = `<div class="card">No combat or intelligence logs recorded yet. Visit the War Room to launch operations!</div>`;
    return;
  }
  container.innerHTML = state.logs.map((l) => formatLogItemHTML(l)).join("");
}

/* CLANS */
function renderClans() {
  const p = state.province;
  const listEl = document.getElementById("clans-list-container");
  const leaveBtn = document.getElementById("leave-clan-btn");
  const createBox = document.getElementById("create-clan-box");

  leaveBtn.classList.toggle("hidden", !p.clan_id);
  createBox.classList.toggle("hidden", Boolean(p.clan_id));

  listEl.innerHTML = state.clans
    .map(
      (c) => `
      <div class="stat-row">
        <div>
          <strong class="text-amber">[${c.tag}] ${c.name}</strong>
          <div style="font-size:11px;color:var(--text-muted)">${c.description} • Members: ${c.member_count} • Total NW: $${fmt(c.total_networth)}</div>
        </div>
        <div>
          ${
            p.clan_id === c.id
              ? `<span class="clan-badge">YOUR CLAN</span>`
              : `<button class="btn btn-xs btn-secondary" onclick="window.handleJoinClan(${c.id})">JOIN</button>`
          }
        </div>
      </div>
    `
    )
    .join("");

  const commsBox = document.getElementById("clan-comms-box");
  if (!p.clan_id) {
    commsBox.innerHTML = `<p class="text-muted">Join or found a Strategic Clan to access encrypted alliance communications.</p>`;
  } else {
    const msgsHtml =
      state.clan_messages.length === 0
        ? `<div class="text-muted">No transmissions yet.</div>`
        : state.clan_messages
            .map(
              (m) => `
            <div class="stat-row" style="flex-direction:column;align-items:flex-start">
              <div style="font-size:11px;color:var(--amber)"><strong>${m.province_name}</strong>:</div>
              <div>${m.message}</div>
            </div>
          `
            )
            .join("");

    commsBox.innerHTML = `
      <form onsubmit="window.handleSendClanMsg(event)" class="form-row mb-16">
        <input type="text" id="clan-msg-input" placeholder="Transmit encrypted message to clan..." required maxlength="300" />
        <button type="submit" class="btn btn-primary btn-sm">SEND</button>
      </form>
      <div class="stat-list">${msgsHtml}</div>
    `;
  }
}

window.handleCreateClan = async function (e) {
  e.preventDefault();
  const tag = document.getElementById("clan-tag-input").value.trim();
  const name = document.getElementById("clan-name-input").value.trim();
  const description = document.getElementById("clan-desc-input").value.trim();
  try {
    const res = await apiFetch("/api/action/clan", {
      method: "POST",
      body: JSON.stringify({ action: "create", tag, name, description }),
    });
    applyServerState(res);
    showBanner(res.message);
  } catch (err) {
    showBanner(err.message, true);
  }
};

window.handleJoinClan = async function (clan_id) {
  try {
    const res = await apiFetch("/api/action/clan", {
      method: "POST",
      body: JSON.stringify({ action: "join", clan_id }),
    });
    applyServerState(res);
    showBanner(res.message);
  } catch (err) {
    showBanner(err.message, true);
  }
};

window.handleLeaveClan = async function () {
  try {
    const res = await apiFetch("/api/action/clan", {
      method: "POST",
      body: JSON.stringify({ action: "leave" }),
    });
    applyServerState(res);
    showBanner(res.message);
  } catch (err) {
    showBanner(err.message, true);
  }
};

window.handleSendClanMsg = async function (e) {
  e.preventDefault();
  const input = document.getElementById("clan-msg-input");
  const message = input.value.trim();
  if (!message) return;
  try {
    const res = await apiFetch("/api/action/clan", {
      method: "POST",
      body: JSON.stringify({ action: "message", message }),
    });
    input.value = "";
    applyServerState(res);
  } catch (err) {
    showBanner(err.message, true);
  }
};

/* RANKINGS LEADERBOARD */
function renderRankings() {
  const tbody = document.getElementById("leaderboard-tbody");
  tbody.innerHTML = state.leaderboard
    .map((r) => {
      const f = state.config.factions[r.faction] || { name: r.faction, badge: "☢" };
      return `
        <tr class="${r.is_self ? "self-row" : ""}">
          <td><strong>#${r.rank}</strong></td>
          <td>
            ${r.clan_tag ? `<span class="clan-badge">[${r.clan_tag}]</span> ` : ""}
            <strong>${r.name}</strong>
            <div style="font-size:11px;color:var(--text-muted)">Cmdr: ${r.username} ${r.is_ai ? "[AI]" : "[PLAYER]"}</div>
          </td>
          <td>${f.badge} ${f.name}</td>
          <td>${fmt(r.land)} m²</td>
          <td class="text-cyan"><strong>$${fmt(r.networth)}</strong></td>
          <td>
            ${
              r.protection_turns_left > 0
                ? `<span class="text-cyan">🛡️ Protected (${r.protection_turns_left}T)</span>`
                : `<span class="text-green">DEFCON Active</span>`
            }
          </td>
          <td>
            ${
              r.is_self
                ? `<span class="text-amber">COMMAND HQ</span>`
                : `<button class="btn btn-xs btn-secondary" onclick="window.targetFromLeaderboard(${r.id})">🎯 TARGET</button>`
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

/* INTERACTIVE GUIDED TUTORIAL & FIELD MANUAL */
const TUTORIAL_STEPS = [
  {
    tab: "overview",
    icon: "command_center",
    title: "1. Welcome Commander — Your Telemetry & Operational Turns",
    desc: "Welcome to Tsar Bomba Zone! Look at the top bar: every action uses Operational Turns. You start with 25 Turns (base cap 50) and automatically regenerate +7 Turns every hour.",
    tip: "💡 ACTION TO TRY: Check your top telemetry bar (Turns, Treasury $, U-235, Free Land, Power Grid, and Networth). You also start under 20 Turns of UN Rookie Protection!",
  },
  {
    tab: "overview",
    icon: "op_work",
    title: "2. Direct Turn Operations — Expand Territory & Mint Cash",
    desc: "In Command HQ, you can spend turns directly to Annex Territory (m²), run an Industrial Shift for Treasury Cash ($), or Enrich Weapons-Grade Uranium-235.",
    desc_extra: "",
    tip: "💡 ACTION TO TRY: Click 'PRODUCE CASH (1T)' or 'EXPLORE LAND (1T)' right below to see your Treasury and Territory grow immediately!",
  },
  {
    tab: "overview",
    icon: "dir_recon_sweep",
    title: "3. Earning Bonus Turns — Tactical Directives & Overtime",
    desc: "Want more turns right away without waiting for the 1-hour supply clock? Complete the 5 Tactical Directives in Command HQ or fund an Emergency Logistics Convoy / Reactor Overdrive!",
    tip: "💡 PRO TIP: Completing your first Reconnaissance Scan in the War Room costs only 1 Turn and immediately rewards +3 Bonus Turns & +$12,000!",
  },
  {
    tab: "buildings",
    icon: "power_plant",
    title: "4. Base Infrastructure & The Power Grid (Avoid Brownouts!)",
    desc: "Every structure requires Free Land (m²) and Megawatts (MW) of electricity. Only Command Bunkers (+15 MW) and Nuclear Power Plants (+50 MW) generate electricity.",
    tip: "💡 ACTION TO TRY: Build a Nuclear Power Plant or Industrial Complex below! Always keep Power Grid Efficiency at 100% — if it drops, your factories and base defense turrets weaken!",
  },
  {
    tab: "military",
    icon: "t80_tank",
    title: "5. Combined Arms Military & Nuclear Missile Silos",
    desc: "Recruit Infantry, Armor, Aircraft, Navy, and Covert Agents here. Building more Barracks, War Factories, Airfields, and Shipyards lets you train larger batches per turn.",
    tip: "💡 ACTION TO TRY: Train Motorized Riflemen, RPG Shock Troopers, or BTR-90 APCs to boost your Offense & Defense ratings!",
  },
  {
    tab: "research",
    icon: "thermonuclear_fission",
    title: "6. Scientific Research & Unlocking the Tsar Bomba",
    desc: "Upgrading technologies permanently boosts your unit attack/defense, power output, treasury income, and spy rating, while unlocking elite units and strategic missiles.",
    tip: "💡 TSAR BOMBA BLUEPRINT: Construct a Hardened Missile Silo + research Ballistic Guidance Lv 6 + Multi-Stage Thermonuclear Physics Lv 5 to build the 50-Megaton AN602 Tsar Bomba!",
  },
  {
    tab: "war",
    icon: "cov_spy_intel",
    title: "7. War Room, Reconnaissance & Covert Sabotage",
    desc: "Select any rival province to run a Reconnaissance Scan (1T), sabotage their Nuclear Power Plants (crippling their defense turrets!), launch a Combined Arms Invasion (3T) to capture their land, or fire Nuclear Missiles!",
    tip: "💡 FIRST MISSION: Click 'RECONNAISSANCE SCAN (1T)' on a target below, then return to Command HQ to claim your +3 Bonus Turns from the 'Reconnaissance Sweep' Directive!",
  },
];

let currentTutorialStep = 0;

function maybeAutoStartTutorial() {
  if (!state.province) return;
  const key = `tbz_tutorial_done_${state.province.id}`;
  if (!localStorage.getItem(key)) {
    window.startGuidedTutorial();
  }
}

window.startGuidedTutorial = function () {
  currentTutorialStep = 0;
  document.getElementById("tutorial-coach").classList.remove("hidden");
  renderTutorialStep();
};

window.closeGuidedTutorial = function () {
  document.getElementById("tutorial-coach").classList.add("hidden");
  if (state.province) {
    localStorage.setItem(`tbz_tutorial_done_${state.province.id}`, "1");
  }
};

window.nextTutorialStep = function () {
  if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
    currentTutorialStep += 1;
    renderTutorialStep();
  } else {
    window.closeGuidedTutorial();
    showBanner("🎓 Basic Training Complete! You can click 'Redo Tutorial' or 'Basic Tutorial' anytime.");
  }
};

window.prevTutorialStep = function () {
  if (currentTutorialStep > 0) {
    currentTutorialStep -= 1;
    renderTutorialStep();
  }
};

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[currentTutorialStep];
  if (!step) return;

  if (state.activeTab !== step.tab) {
    window.switchTab(step.tab);
  }

  document.getElementById("tut-step-badge").textContent = `COMMANDER TRAINING // STEP ${currentTutorialStep + 1} OF ${TUTORIAL_STEPS.length}`;
  document.getElementById("tut-step-icon").innerHTML = window.getTbzIcon ? window.getTbzIcon(step.icon) : "";
  document.getElementById("tut-step-title").textContent = step.title;
  document.getElementById("tut-step-desc").textContent = step.desc;
  document.getElementById("tut-step-tip").textContent = step.tip;

  const prevBtn = document.getElementById("tut-prev-btn");
  const nextBtn = document.getElementById("tut-next-btn");
  prevBtn.disabled = currentTutorialStep === 0;
  nextBtn.textContent = currentTutorialStep === TUTORIAL_STEPS.length - 1 ? "✓ FINISH TRAINING" : "NEXT STEP →";
}

/* FIELD MANUAL ENCYCLOPEDIA MODAL */
const MANUAL_CONTENT = {
  quickstart: () => `
    <div class="manual-section">
      <h4>🚀 NEW COMMANDER 5-MINUTE PLAYBOOK</h4>
      <p><strong>Tsar Bomba Zone</strong> is a tactical text-based strategy game inspired by classic <em>Nukezone</em>. Follow these 5 steps to establish a superpower province:</p>
      <div class="manual-grid">
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("cov_spy_intel")}</div>
          <div>
            <div class="manual-card-title">Step 1: Run a Spy Recon Scan (1T)</div>
            <div class="manual-card-desc">Go to <strong>🎯 War &amp; Covert Ops</strong> and click <em>Reconnaissance Scan (1T)</em> on a rival. Then go back to <strong>Command HQ</strong> and claim the <strong>Reconnaissance Sweep</strong> directive for <strong>+3 Bonus Turns &amp; +$12,000</strong>!</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("supply_depot")}</div>
          <div>
            <div class="manual-card-title">Step 2: Expand Base to 45 Buildings</div>
            <div class="manual-card-desc">Open <strong>🏭 Base &amp; Power Grid</strong>. Build 5x <em>Nuclear Power Plants</em> and 5x <em>Industrial Complexes</em> to reach 45 total structures and claim the <strong>Industrial Expansion (+4 Turns)</strong> directive.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("uranium_refinery")}</div>
          <div>
            <div class="manual-card-title">Step 3: Enrich 50 U-235 Canisters</div>
            <div class="manual-card-desc">Construct a few extra <em>Uranium Centrifuges</em> and run <em>Enrich U-235</em> in Command HQ to reach 50 U-235 and claim <strong>+4 Bonus Turns</strong> from <em>Fissile Stockpile</em>.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("t80_tank")}</div>
          <div>
            <div class="manual-card-title">Step 4: Build a 2,000+ Attack Army</div>
            <div class="manual-card-desc">Research <em>Composite Armor Lv 2</em> or <em>Infantry Weapons Lv 2</em>, then train Tanks, APCs, and Shock Troopers to unlock <strong>Red Alert Mobilization (+5 Turns)</strong>.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  turns: () => `
    <div class="manual-section">
      <h4>⚡ OPERATIONAL TURNS, HOURLY SUPPLY &amp; OVERTIME</h4>
      <p>Every action in Tsar Bomba Zone spends <strong>Operational Turns</strong>. Managing and earning turns is the key to climbing the World Leaderboard:</p>
      <div class="manual-grid">
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("command_center")}</div>
          <div>
            <div class="manual-card-title">1-Hour Regeneration &amp; Command Bunkers</div>
            <div class="manual-card-desc">Your province regenerates <strong>+6 base turns every 1 hour</strong> (+1 extra turn/hr for every 3 <em>Command Bunkers</em>). Each extra Command Bunker beyond 5 also raises your <strong>Max Turn Cap by +2</strong>!</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("dir_battle_victory")}</div>
          <div>
            <div class="manual-card-title">Tactical Directives (+22 Bonus Turns)</div>
            <div class="manual-card-desc">Complete the 5 milestone directives in <strong>Command HQ</strong> (Spy Scan, 45 Buildings, 50 U-235, 2,000 Attack, First Victory) to claim up to <strong>+22 Bonus Turns</strong> and over <strong>$100,000</strong>.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("op_logistics")}</div>
          <div>
            <div class="manual-card-title">Emergency Logistics Convoy (+4 Turns)</div>
            <div class="manual-card-desc">Have surplus cash in your Treasury? Click <em>Emergency Logistics Convoy</em> in Command HQ to convert Treasury funds directly into <strong>+4 Operational Turns</strong> anytime.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("op_reactor")}</div>
          <div>
            <div class="manual-card-title">Command Reactor Overdrive (+5 Turns)</div>
            <div class="manual-card-desc">Burn <strong>12 U-235 canisters</strong> in your Command Bunker's auxiliary reactor to immediately generate <strong>+5 Operational Turns</strong>.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  base: () => `
    <div class="manual-section">
      <h4>🏭 TERRITORY, BUILDINGS &amp; THE POWER GRID</h4>
      <p>You can construct up to <strong>5 buildings per 1 Turn</strong>. Every building occupies <strong>Free Land (m²)</strong> and either produces or consumes <strong>Megawatts (MW)</strong> of electrical power:</p>
      <div class="manual-grid">
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("power_plant")}</div>
          <div>
            <div class="manual-card-title">Nuclear Power Plants (+50 MW)</div>
            <div class="manual-card-desc">Supplies electricity to your entire base. Upgrading <em>Tokamak Fusion Grid</em> in the Research Lab boosts all Power Plant output by +10% per level.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("cov_sabotage_power")}</div>
          <div>
            <div class="manual-card-title">⚠️ Brownout Penalties (&lt;100% Grid)</div>
            <div class="manual-card-desc">If Power Consumed exceeds Power Produced, your province enters a <strong>Brownout</strong>. At 50% grid efficiency, your Industrial Complexes produce 50% less cash and your SAM/Laser/Radar defense turrets lose 50% of their strength!</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("supply_depot")}</div>
          <div>
            <div class="manual-card-title">Economy: Industrial &amp; Centrifuges</div>
            <div class="manual-card-desc"><strong>Industrial Complexes</strong> boost cash earned per turn. <strong>Uranium Centrifuges</strong> enrich U-235 needed for advanced tanks, nuclear submarines, strategic bombers, and nuclear missiles.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("laser_turret")}</div>
          <div>
            <div class="manual-card-title">Base Defense: Radar, SAMs &amp; Lasers</div>
            <div class="manual-card-desc"><strong>OTH Radars</strong> (+35 Def, +20 Anti-Spy), <strong>S-400 SAMs</strong> (+85 Def, 4% Missile Intercept), and <strong>Peresvet Lasers</strong> (+180 Def, 8% Missile Intercept) protect your territory automatically when powered.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  military: () => `
    <div class="manual-section">
      <h4>🪖 COMBINED ARMS MILITARY &amp; PRODUCTION SCALING</h4>
      <p>Constructing more military production structures (<em>Barracks, Heavy War Factories, Tactical Airfields, Naval Shipyards</em>) increases how many units you can train per single turn:</p>
      <div class="manual-grid">
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("spetsnaz_commandos")}</div>
          <div>
            <div class="manual-card-title">Infantry Divisions (Barracks)</div>
            <div class="manual-card-desc"><strong>Motorized Riflemen</strong> &amp; <strong>SVD Marksmen</strong> provide cost-effective garrison defense, while <strong>RPG Shock Troopers</strong> and <strong>Spetsnaz Alpha Operators</strong> add offensive punch.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("tos1_thermobaric")}</div>
          <div>
            <div class="manual-card-title">Armor &amp; Artillery (War Factory)</div>
            <div class="manual-card-desc"><strong>BTR-90 APCs</strong>, <strong>T-80U Tanks</strong>, <strong>2S19 Msta Artillery</strong>, and <strong>TOS-1A Thermobaric Launchers</strong> form the backbone of Combined Arms Invasions.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("tu160_blackjack")}</div>
          <div>
            <div class="manual-card-title">Air Force (Tactical Airfield)</div>
            <div class="manual-card-desc"><strong>MiG-31 Interceptors</strong> guard your skies, while <strong>Su-25T Frogfoots</strong>, <strong>Mi-24 Hind Gunships</strong>, and <strong>Tu-160 Blackjack Bombers</strong> execute devastating Air Raids.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("kirov_battlecruiser")}</div>
          <div>
            <div class="manual-card-title">Naval Fleet (Naval Shipyard)</div>
            <div class="manual-card-desc"><strong>Tarantul Corvettes</strong>, <strong>Akula Submarines</strong>, <strong>Udaloy Destroyers</strong>, and <strong>Kirov Nuclear Battlecruisers</strong> dominate Amphibious Naval Blitzes to plunder enemy treasuries.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  research: () => `
    <div class="manual-section">
      <h4>🔬 SCIENTIFIC RESEARCH &amp; UNLOCKING THE TSAR BOMBA</h4>
      <p>Constructing additional <strong>Weapons Research Labs</strong> reduces the turn cost of every research upgrade. Each technology can be upgraded to <strong>Level 10</strong>:</p>
      <div class="manual-grid">
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("research_lab")}</div>
          <div>
            <div class="manual-card-title">Combat &amp; Economic Multipliers</div>
            <div class="manual-card-desc"><em>Infantry, Armored, Aerospace,</em> and <em>Naval</em> techs grant <strong>+8% Attack &amp; Defense per level</strong> and unlock higher-tier units. <em>Tokamak Grid</em> &amp; <em>Cybernetic Planning</em> boost power and cash by <strong>+10% per level</strong>.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("rocketry")}</div>
          <div>
            <div class="manual-card-title">Ballistic Guidance (Rocketry)</div>
            <div class="manual-card-desc">Level 1 unlocks the <strong>Tactical Scud-B</strong>. Level 3 unlocks the <strong>3M-54 Kalibr Nuclear Cruise Missile</strong>. Level 6 unlocks the <strong>RT-2PM2 Topol-M ICBM</strong>.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("tsar_bomba")}</div>
          <div>
            <div class="manual-card-title">☢️ AN602 TSAR BOMBA (50 MT RDS-220)</div>
            <div class="manual-card-desc">Requires: <strong>1x Hardened Missile Silo</strong> + <strong>Rocketry Lv 6</strong> + <strong>Thermonuclear Physics Lv 5</strong>. Costs $250,000 ($212,500 for Soviet Directorate) &amp; 80 U-235. Vaporizes 65–110 enemy buildings, 35%+ units, and scorches 60–120 m² land!</div>
          </div>
        </div>
      </div>
    </div>
  `,
  war: () => `
    <div class="manual-section">
      <h4>🎯 WARFARE, COVERT ESPIONAGE &amp; UN PROTECTION</h4>
      <p>In the <strong>War Room</strong>, combine espionage, sabotage, conventional strikes, and nuclear weapons to dismantle enemy provinces:</p>
      <div class="manual-grid">
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("operatives")}</div>
          <div>
            <div class="manual-card-title">Covert Ops (1–2 Turns)</div>
            <div class="manual-card-desc"><strong>Reconnaissance Scan (1T)</strong> saves a full dossier on the target. <strong>Sabotage Power Plants (2T)</strong> blows up enemy reactors so their SAMs and Laser Turrets lose power right before you invade!</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("war_all_out")}</div>
          <div>
            <div class="manual-card-title">Combined Arms Invasion (3 Turns)</div>
            <div class="manual-card-desc">Pits your total Attack Rating against the target's Defense Rating. Victory captures <strong>8%–16% of the enemy's Territory (m²)</strong> and loots their treasury!</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("war_air_raid")}</div>
          <div>
            <div class="manual-card-title">Air Raid &amp; Naval Blitz (2 Turns)</div>
            <div class="manual-card-desc"><strong>Strategic Air Raids</strong> bombard and destroy 4–14 enemy buildings. <strong>Amphibious Naval Blitzes</strong> plunder 18%–30% of the enemy's treasury cash.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("counter_intel_agents")}</div>
          <div>
            <div class="manual-card-title">🛡️ UN Rookie Protection (20 Turns)</div>
            <div class="manual-card-desc">New provinces cannot be attacked or sabotaged for their first 20 turns spent. Launching an offensive attack against another province immediately ends your Rookie Protection.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  clans: () => `
    <div class="manual-section">
      <h4>🛡️ STRATEGIC DOCTRINES, CLANS &amp; NETWORTH ($NW)</h4>
      <p>Your global rank is determined by your total <strong>Province Networth ($NW)</strong>, calculated dynamically from your Land, Buildings, Military Units, Missiles, Research Levels, Treasury, and U-235:</p>
      <div class="manual-grid">
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("icbm_topol")}</div>
          <div>
            <div class="manual-card-title">☭ Soviet Atomic Directorate</div>
            <div class="manual-card-desc"><strong>+15% Armor Attack</strong>, <strong>+25% Uranium-235 Centrifuge output</strong>, <strong>-15% Missile &amp; Tsar Bomba cost</strong>, and <strong>+15% Thermonuclear blast yield</strong>.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("mig_interceptor")}</div>
          <div>
            <div class="manual-card-title">✪ Atlantic Strategic Command (NATO)</div>
            <div class="manual-card-desc"><strong>+15% Aircraft Attack</strong>, <strong>+15% Industrial Cash Income</strong>, and <strong>+20% ABM Missile Interception</strong> efficiency.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("attack_sub")}</div>
          <div>
            <div class="manual-card-title">❖ Pacific Shadow Syndicate</div>
            <div class="manual-card-desc"><strong>+25% Covert Espionage &amp; Counter-Intel Power</strong>, <strong>+15% Naval Fleet Attack</strong>, and <strong>-15% Scientific Research cost</strong>.</div>
          </div>
        </div>
        <div class="manual-card">
          <div class="thumb-pic sm">${window.getTbzIcon("radar_tower")}</div>
          <div>
            <div class="manual-card-title">Clans &amp; Encrypted Comms</div>
            <div class="manual-card-desc">Join an existing Alliance (<code>[RED]</code>, <code>[NATO]</code>, <code>[SHDW]</code>) for free or charter your own Clan ($25,000). Clan allies cannot attack each other and share a private Comms channel.</div>
          </div>
        </div>
      </div>
    </div>
  `,
};

window.openManualModal = function (topic = "quickstart") {
  document.getElementById("manual-modal").classList.remove("hidden");
  const tabs = document.querySelectorAll("#manual-topic-tabs .sub-tab");
  tabs.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("onclick").includes(`'${topic}'`));
  });
  const renderer = MANUAL_CONTENT[topic] || MANUAL_CONTENT.quickstart;
  document.getElementById("manual-content-body").innerHTML = renderer();
};

window.closeManualModal = function () {
  document.getElementById("manual-modal").classList.add("hidden");
};

window.handleManualBackdropClick = function (e) {
  if (e.target && e.target.id === "manual-modal") {
    window.closeManualModal();
  }
};

window.switchManualTopic = function (topic, btnEl) {
  document.querySelectorAll("#manual-topic-tabs .sub-tab").forEach((b) => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  const renderer = MANUAL_CONTENT[topic] || MANUAL_CONTENT.quickstart;
  document.getElementById("manual-content-body").innerHTML = renderer();
};

window.startGuidedTutorialFromModal = function () {
  window.closeManualModal();
  window.startGuidedTutorial();
};

/* BOOTSTRAP */
async function initApp() {
  try {
    state.config = await apiFetch("/api/config");
    renderFactionSelector();
    if (state.token) {
      const data = await apiFetch("/api/state");
      applyServerState(data);
      document.getElementById("auth-screen").classList.add("hidden");
      document.getElementById("game-screen").classList.remove("hidden");
      maybeAutoStartTutorial();
    }
  } catch (err) {
    localStorage.removeItem("tbz_token");
    state.token = null;
  }

  // 1-second live countdown ticker for hourly turn supply
  setInterval(() => {
    if (state.province && typeof state.province.next_tick_seconds === "number") {
      if (state.province.next_tick_seconds > 0) {
        state.province.next_tick_seconds -= 1;
        updateTurnTickDisplay();
      } else if (state.token) {
        window.refreshState();
      }
    }
  }, 1000);

  // Periodic background telemetry sync every 30s
  setInterval(() => {
    if (state.token) {
      window.refreshState();
    }
  }, 30000);
}

window.addEventListener("DOMContentLoaded", initApp);

