/**
 * Tactical SVG Miniature Illustrations for Tsar Bomba Zone
 * Provides visual thumbnails for every Building, Unit, Missile, Research Tech,
 * Turn Operation, Tactical Directive, Covert Op, and Military Offensive.
 */

window.TBZ_ICONS = {
  /* ======================== TURN OPERATIONS ======================== */
  op_explore: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0d1b2a"/>
    <circle cx="32" cy="32" r="22" stroke="#10b981" stroke-width="2" stroke-dasharray="4 2" fill="#06281e"/>
    <path d="M12 32H52M32 12V52" stroke="#10b981" stroke-width="1.2" opacity="0.5"/>
    <polygon points="32,16 38,32 32,28 26,32" fill="#f59e0b"/>
    <polygon points="32,48 38,32 32,36 26,32" fill="#38bdf8" opacity="0.8"/>
    <circle cx="32" cy="32" r="3" fill="#fff"/>
  </svg>`,

  op_work: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0f2218"/>
    <rect x="10" y="22" width="44" height="24" rx="3" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
    <circle cx="32" cy="34" r="7" fill="#10b981" opacity="0.25" stroke="#10b981" stroke-width="1.8"/>
    <text x="32" y="39" text-anchor="middle" fill="#34d399" font-size="14" font-family="monospace" font-weight="bold">$</text>
    <path d="M16 16H48" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>
    <circle cx="16" cy="34" r="2" fill="#34d399"/>
    <circle cx="48" cy="34" r="2" fill="#34d399"/>
  </svg>`,

  op_mine_uranium: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1f1608"/>
    <rect x="18" y="10" width="28" height="44" rx="4" fill="#272010" stroke="#f59e0b" stroke-width="2"/>
    <line x1="18" y1="20" x2="46" y2="20" stroke="#f59e0b" stroke-width="1.5"/>
    <line x1="18" y1="44" x2="46" y2="44" stroke="#f59e0b" stroke-width="1.5"/>
    <circle cx="32" cy="32" r="9" fill="#f59e0b" opacity="0.2"/>
    <circle cx="32" cy="32" r="3" fill="#f59e0b"/>
    <path d="M32 23L27 30H37L32 23Z" fill="#f59e0b"/>
    <path d="M24 37L29 33L26 29L24 37Z" fill="#f59e0b"/>
    <path d="M40 37L35 33L38 29L40 37Z" fill="#f59e0b"/>
  </svg>`,

  op_morale: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1e152a"/>
    <polygon points="32,10 37,24 52,24 40,33 44,48 32,39 20,48 24,33 12,24 27,24" fill="#f59e0b" stroke="#fde68a" stroke-width="1.5"/>
    <circle cx="32" cy="31" r="5" fill="#ef4444"/>
  </svg>`,

  op_logistics: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1c1917"/>
    <rect x="8" y="20" width="30" height="20" rx="2" fill="#3f6212" stroke="#84cc16" stroke-width="2"/>
    <path d="M38 26H50L55 33V40H38V26Z" fill="#365314" stroke="#84cc16" stroke-width="2"/>
    <circle cx="18" cy="43" r="5" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="30" cy="43" r="5" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="47" cy="43" r="5" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <path d="M16 30H30M23 24V36" stroke="#f59e0b" stroke-width="2.5"/>
  </svg>`,

  op_reactor: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0c192c"/>
    <circle cx="32" cy="32" r="20" stroke="#38bdf8" stroke-width="2" fill="#082f49"/>
    <ellipse cx="32" cy="32" rx="18" ry="7" transform="rotate(30 32 32)" stroke="#38bdf8" stroke-width="1.5"/>
    <ellipse cx="32" cy="32" rx="18" ry="7" transform="rotate(-30 32 32)" stroke="#38bdf8" stroke-width="1.5"/>
    <polygon points="34,16 24,34 32,34 30,48 40,30 32,30" fill="#f59e0b"/>
  </svg>`,

  /* ======================== DIRECTIVES ======================== */
  dir_recon_sweep: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#091e26"/>
    <circle cx="32" cy="32" r="19" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="32" cy="32" r="11" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="3 3"/>
    <line x1="32" y1="32" x2="46" y2="18" stroke="#10b981" stroke-width="2.5"/>
    <circle cx="40" cy="24" r="3" fill="#ef4444"/>
  </svg>`,

  dir_base_expansion: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#17202a"/>
    <rect x="10" y="32" width="14" height="22" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/>
    <rect x="26" y="20" width="16" height="34" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <rect x="44" y="28" width="12" height="26" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/>
    <path d="M16 14H42M22 14V20" stroke="#f59e0b" stroke-width="2"/>
  </svg>`,

  dir_uranium_stockpile: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1c190a"/>
    <rect x="12" y="18" width="12" height="32" rx="3" fill="#10b981" stroke="#a7f3d0" stroke-width="1.5"/>
    <rect x="26" y="14" width="12" height="36" rx="3" fill="#f59e0b" stroke="#fde68a" stroke-width="1.5"/>
    <rect x="40" y="18" width="12" height="32" rx="3" fill="#10b981" stroke="#a7f3d0" stroke-width="1.5"/>
  </svg>`,

  dir_war_machine: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#231212"/>
    <path d="M16 20L32 12L48 20V34C48 44 32 52 32 52C32 52 16 44 16 34V20Z" fill="#7f1d1d" stroke="#ef4444" stroke-width="2"/>
    <path d="M24 28L32 22L40 28M24 36L32 30L40 36" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  dir_battle_victory: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#26120b"/>
    <circle cx="32" cy="32" r="18" fill="#991b1b" stroke="#f59e0b" stroke-width="2"/>
    <polygon points="32,16 36,27 47,27 38,34 42,45 32,38 22,45 26,34 17,27 28,27" fill="#f59e0b"/>
  </svg>`,

  /* ======================== BUILDINGS (13) ======================== */
  command_center: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#111927"/>
    <path d="M8 48L16 28H48L56 48H8Z" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <rect x="24" y="36" width="16" height="12" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5"/>
    <line x1="22" y1="28" x2="22" y2="12" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="22" cy="12" r="2.5" fill="#ef4444"/>
    <line x1="42" y1="28" x2="42" y2="16" stroke="#38bdf8" stroke-width="2"/>
    <polygon points="32,20 35,26 29,26" fill="#f59e0b"/>
  </svg>`,

  power_plant: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0d211c"/>
    <path d="M12 52C16 38 16 28 14 20H28C26 28 26 38 30 52H12Z" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
    <path d="M32 52C36 38 36 28 34 20H48C46 28 46 38 50 52H32Z" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
    <circle cx="21" cy="13" r="4" fill="#94a3b8" opacity="0.5"/>
    <circle cx="41" cy="13" r="4" fill="#94a3b8" opacity="0.5"/>
    <polygon points="33,26 27,37 33,37 29,48 39,35 33,35" fill="#f59e0b"/>
  </svg>`,

  supply_depot: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#131f1c"/>
    <path d="M8 50V28L22 36V28L36 36V28L54 36V50H8Z" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
    <rect x="44" y="14" width="6" height="20" fill="#334155" stroke="#10b981" stroke-width="1.5"/>
    <text x="28" y="47" fill="#34d399" font-size="11" font-family="monospace" font-weight="bold">$$$</text>
  </svg>`,

  uranium_refinery: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1f1909"/>
    <rect x="12" y="14" width="10" height="38" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.8"/>
    <rect x="27" y="10" width="10" height="42" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.8"/>
    <rect x="42" y="14" width="10" height="38" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.8"/>
    <circle cx="17" cy="33" r="3" fill="#10b981"/>
    <circle cx="32" cy="31" r="3" fill="#f59e0b"/>
    <circle cx="47" cy="33" r="3" fill="#10b981"/>
  </svg>`,

  barracks: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#181c20"/>
    <path d="M10 30L32 16L54 30V50H10V30Z" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <polygon points="32,22 34,27 40,27 35,30 37,36 32,32 27,36 29,30 24,27 30,27" fill="#ef4444"/>
    <rect x="26" y="38" width="12" height="12" fill="#0f172a"/>
  </svg>`,

  war_factory: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1c1917"/>
    <rect x="8" y="24" width="48" height="28" rx="2" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <rect x="16" y="34" width="32" height="18" fill="#090d16"/>
    <path d="M22 46H42L39 40H25L22 46Z" fill="#84cc16"/>
    <line x1="34" y1="42" x2="48" y2="42" stroke="#84cc16" stroke-width="2.5"/>
    <rect x="14" y="14" width="8" height="10" fill="#334155" stroke="#f59e0b" stroke-width="1.5"/>
  </svg>`,

  airfield: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0f1c2e"/>
    <path d="M8 52L22 26H42L56 52H8Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8"/>
    <line x1="32" y1="28" x2="32" y2="50" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 3"/>
    <rect x="46" y="14" width="8" height="20" fill="#334155" stroke="#38bdf8" stroke-width="1.5"/>
    <path d="M32 12L40 24H24L32 12Z" fill="#38bdf8"/>
  </svg>`,

  shipyard: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0a192f"/>
    <path d="M12 36H52L46 46H18L12 36Z" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
    <rect x="24" y="28" width="14" height="8" fill="#475569" stroke="#38bdf8" stroke-width="1.5"/>
    <path d="M8 50Q20 46 32 50T56 50" stroke="#38bdf8" stroke-width="2.5" fill="none"/>
    <path d="M14 14H36M18 14V36" stroke="#f59e0b" stroke-width="2"/>
  </svg>`,

  research_lab: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0d1b2a"/>
    <path d="M16 48C16 32 24 22 32 22C40 22 48 32 48 48H16Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="32" cy="20" r="8" stroke="#10b981" stroke-width="1.5"/>
    <circle cx="32" cy="20" r="2.5" fill="#f59e0b"/>
    <rect x="10" y="48" width="44" height="4" fill="#38bdf8"/>
  </svg>`,

  missile_silo: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#231010"/>
    <rect x="14" y="38" width="36" height="16" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
    <path d="M26 48V20L32 10L38 20V48H26Z" fill="#e2e8f0" stroke="#ef4444" stroke-width="2"/>
    <polygon points="32,10 26,20 38,20" fill="#ef4444"/>
    <line x1="12" y1="38" x2="22" y2="24" stroke="#f59e0b" stroke-width="2.5"/>
    <line x1="52" y1="38" x2="42" y2="24" stroke="#f59e0b" stroke-width="2.5"/>
  </svg>`,

  radar_tower: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0c1e24"/>
    <path d="M22 52L30 30H34L42 52H22Z" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
    <path d="M18 18C24 30 38 32 46 22" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <line x1="32" y1="26" x2="40" y2="14" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="42" cy="12" r="2.5" fill="#ef4444"/>
  </svg>`,

  sam_site: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#111d24"/>
    <rect x="14" y="42" width="36" height="10" rx="2" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
    <path d="M20 40L40 16M26 42L46 18M32 44L52 20" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  laser_turret: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#220e18"/>
    <path d="M16 52L22 36H42L48 52H16Z" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
    <circle cx="32" cy="30" r="9" fill="#334155" stroke="#f43f5e" stroke-width="2"/>
    <line x1="36" y1="26" x2="56" y2="10" stroke="#ef4444" stroke-width="3.5"/>
    <line x1="36" y1="26" x2="56" y2="10" stroke="#fde047" stroke-width="1.2"/>
  </svg>`,

  /* ======================== UNITS & MISSILES (22) ======================== */
  conscripts: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#162114"/>
    <path d="M16 36C16 22 24 16 32 16C40 16 48 22 48 36H16Z" fill="#3f6212" stroke="#84cc16" stroke-width="2"/>
    <polygon points="32,22 34,26 39,26 35,29 36,34 32,31 28,34 29,29 25,26 30,26" fill="#ef4444"/>
    <line x1="12" y1="46" x2="52" y2="46" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  shock_troopers: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#211810"/>
    <line x1="10" y1="44" x2="48" y2="20" stroke="#94a3b8" stroke-width="4"/>
    <polygon points="52,18 40,18 46,28" fill="#f59e0b" stroke="#ef4444" stroke-width="1.5"/>
    <circle cx="16" cy="40" r="6" fill="#ef4444" opacity="0.5"/>
  </svg>`,

  sniper_teams: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0d1f1d"/>
    <circle cx="32" cy="32" r="20" stroke="#10b981" stroke-width="2"/>
    <circle cx="32" cy="32" r="10" stroke="#10b981" stroke-width="1.2"/>
    <line x1="8" y1="32" x2="56" y2="32" stroke="#10b981" stroke-width="1.5"/>
    <line x1="32" y1="8" x2="32" y2="56" stroke="#10b981" stroke-width="1.5"/>
    <circle cx="32" cy="32" r="3" fill="#ef4444"/>
  </svg>`,

  spetsnaz_commandos: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#141424"/>
    <rect x="14" y="20" width="36" height="16" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
    <circle cx="24" cy="28" r="5" fill="#10b981"/>
    <circle cx="40" cy="28" r="5" fill="#10b981"/>
    <path d="M22 48L42 40" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  btr_apc: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#182218"/>
    <polygon points="8,38 16,26 48,26 56,38 52,44 12,44" fill="#365314" stroke="#84cc16" stroke-width="2"/>
    <rect x="24" y="20" width="12" height="6" fill="#4d7c0f" stroke="#84cc16" stroke-width="1.5"/>
    <line x1="36" y1="22" x2="50" y2="20" stroke="#f59e0b" stroke-width="2.5"/>
    <circle cx="16" cy="45" r="4.5" fill="#0f172a" stroke="#84cc16" stroke-width="1.8"/>
    <circle cx="27" cy="45" r="4.5" fill="#0f172a" stroke="#84cc16" stroke-width="1.8"/>
    <circle cx="38" cy="45" r="4.5" fill="#0f172a" stroke="#84cc16" stroke-width="1.8"/>
    <circle cx="49" cy="45" r="4.5" fill="#0f172a" stroke="#84cc16" stroke-width="1.8"/>
  </svg>`,

  t80_tank: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1d2414"/>
    <rect x="8" y="36" width="44" height="12" rx="6" fill="#1e293b" stroke="#84cc16" stroke-width="2"/>
    <path d="M16 36L22 24H38L44 36H16Z" fill="#3f6212" stroke="#a3e635" stroke-width="2"/>
    <line x1="38" y1="28" x2="58" y2="26" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`,

  mobile_artillery: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#241b12"/>
    <rect x="8" y="40" width="42" height="10" rx="5" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <rect x="14" y="28" width="22" height="12" rx="2" fill="#475569" stroke="#f59e0b" stroke-width="2"/>
    <line x1="32" y1="30" x2="54" y2="12" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
    <circle cx="55" cy="11" r="3" fill="#ef4444"/>
  </svg>`,

  tos1_thermobaric: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#28120e"/>
    <rect x="10" y="40" width="44" height="10" rx="5" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
    <rect x="18" y="18" width="28" height="16" rx="2" transform="rotate(-18 18 18)" fill="#7f1d1d" stroke="#f59e0b" stroke-width="2"/>
    <line x1="46" y1="16" x2="56" y2="12" stroke="#f59e0b" stroke-width="3"/>
  </svg>`,

  mig_interceptor: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0d1d31"/>
    <polygon points="32,8 37,26 54,38 54,44 37,40 35,52 29,52 27,40 10,44 10,38 27,26" fill="#1e3a8a" stroke="#38bdf8" stroke-width="2"/>
    <polygon points="32,16 34,26 30,26" fill="#f59e0b"/>
  </svg>`,

  su25_frogfoot: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#132230"/>
    <polygon points="32,10 36,24 56,30 56,36 36,34 35,50 29,50 28,34 8,36 8,30 28,24" fill="#0f766e" stroke="#2dd4bf" stroke-width="2"/>
    <circle cx="18" cy="36" r="2.5" fill="#ef4444"/>
    <circle cx="46" cy="36" r="2.5" fill="#ef4444"/>
  </svg>`,

  hind_gunship: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1a2418"/>
    <line x1="8" y1="16" x2="56" y2="16" stroke="#94a3b8" stroke-width="2.5"/>
    <line x1="32" y1="16" x2="32" y2="24" stroke="#94a3b8" stroke-width="2"/>
    <ellipse cx="28" cy="34" rx="16" ry="8" fill="#365314" stroke="#84cc16" stroke-width="2"/>
    <line x1="44" y1="34" x2="56" y2="28" stroke="#84cc16" stroke-width="3"/>
    <ellipse cx="22" cy="32" rx="6" ry="4" fill="#38bdf8"/>
  </svg>`,

  tu160_blackjack: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#18122b"/>
    <polygon points="32,6 35,24 58,42 54,46 35,36 34,54 30,54 29,36 10,46 6,42 29,24" fill="#e2e8f0" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="32" cy="28" r="3" fill="#ef4444"/>
  </svg>`,

  patrol_boat: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#081c2c"/>
    <polygon points="8,36 56,36 48,46 14,46" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <rect x="22" y="28" width="14" height="8" fill="#334155" stroke="#38bdf8" stroke-width="1.5"/>
    <path d="M6 50Q18 46 32 50T58 50" stroke="#38bdf8" stroke-width="2"/>
  </svg>`,

  attack_sub: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#051322"/>
    <ellipse cx="32" cy="38" rx="22" ry="7" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
    <rect x="26" y="24" width="10" height="8" rx="2" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="46" cy="38" r="2" fill="#10b981"/>
  </svg>`,

  guided_destroyer: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0a1d33"/>
    <polygon points="6,36 58,36 50,46 12,46" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
    <polygon points="20,36 26,22 38,22 42,36" fill="#475569" stroke="#38bdf8" stroke-width="1.5"/>
    <line x1="44" y1="32" x2="54" y2="26" stroke="#f59e0b" stroke-width="2.5"/>
  </svg>`,

  kirov_battlecruiser: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#190e26"/>
    <polygon points="4,36 60,36 52,48 10,48" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <polygon points="18,36 24,18 38,18 44,36" fill="#334155" stroke="#ef4444" stroke-width="1.8"/>
    <circle cx="31" cy="28" r="3" fill="#ef4444"/>
  </svg>`,

  operatives: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#121824"/>
    <path d="M16 26L24 14H40L48 26H16Z" fill="#334155" stroke="#f59e0b" stroke-width="2"/>
    <rect x="20" y="28" width="10" height="5" rx="2" fill="#38bdf8"/>
    <rect x="34" y="28" width="10" height="5" rx="2" fill="#38bdf8"/>
    <path d="M16 52L24 38H40L48 52H16Z" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
  </svg>`,

  counter_intel_agents: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0f2027"/>
    <path d="M32 10L50 18V32C50 44 32 54 32 54C32 54 14 44 14 32V18L32 10Z" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
    <ellipse cx="32" cy="32" rx="11" ry="6" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="32" cy="32" r="3" fill="#ef4444"/>
  </svg>`,

  tactical_scud: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#231710"/>
    <path d="M16 48L44 20L52 12L44 12L12 44L16 48Z" fill="#e2e8f0" stroke="#f59e0b" stroke-width="2"/>
    <polygon points="52,12 42,14 50,22" fill="#ef4444"/>
    <circle cx="16" cy="48" r="5" fill="#f59e0b"/>
  </svg>`,

  cruise_missile: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1e1528"/>
    <rect x="10" y="28" width="42" height="8" rx="4" fill="#e2e8f0" stroke="#38bdf8" stroke-width="2"/>
    <polygon points="56,32 46,27 46,37" fill="#ef4444"/>
    <polygon points="28,28 22,16 34,28" fill="#f59e0b"/>
    <polygon points="28,36 22,48 34,36" fill="#f59e0b"/>
  </svg>`,

  icbm_topol: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#2a1010"/>
    <rect x="26" y="18" width="12" height="32" fill="#e2e8f0" stroke="#ef4444" stroke-width="2"/>
    <polygon points="32,6 24,18 40,18" fill="#ef4444"/>
    <polygon points="26,50 38,50 42,58 22,58" fill="#f59e0b"/>
  </svg>`,

  tsar_bomba: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#350a0a"/>
    <circle cx="32" cy="22" r="14" fill="#ef4444" opacity="0.35"/>
    <path d="M16 24C16 14 24 8 32 8C40 8 48 14 48 24C48 30 42 32 38 32H26C22 32 16 30 16 24Z" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/>
    <rect x="27" y="32" width="10" height="16" fill="#ef4444"/>
    <ellipse cx="32" cy="52" rx="18" ry="5" fill="#f59e0b"/>
    <circle cx="32" cy="22" r="4" fill="#000"/>
  </svg>`,

  /* ======================== RESEARCH TECH (10) ======================== */
  infantry_weapons: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#14221a"/>
    <circle cx="32" cy="32" r="18" stroke="#10b981" stroke-width="2"/>
    <line x1="16" y1="44" x2="48" y2="20" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
    <line x1="16" y1="20" x2="48" y2="44" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  armored_warfare: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1e2212"/>
    <polygon points="32,8 52,18 48,44 32,56 16,44 12,18" fill="#365314" stroke="#84cc16" stroke-width="2.5"/>
    <path d="M22 32H42M32 22V42" stroke="#f59e0b" stroke-width="2.5"/>
  </svg>`,

  aerospace_dynamics: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0c1b2e"/>
    <polygon points="32,8 54,48 32,38 10,48" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
  </svg>`,

  naval_supremacy: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#07192b"/>
    <circle cx="32" cy="16" r="4" stroke="#38bdf8" stroke-width="2"/>
    <line x1="32" y1="20" x2="32" y2="48" stroke="#38bdf8" stroke-width="3"/>
    <path d="M16 36C16 46 24 50 32 50C40 50 48 46 48 36" stroke="#f59e0b" stroke-width="3" fill="none"/>
  </svg>`,

  energy_grid: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#1b1b0a"/>
    <circle cx="32" cy="32" r="20" stroke="#f59e0b" stroke-width="2" fill="#27200a"/>
    <polygon points="35,12 22,34 32,34 29,52 42,30 32,30" fill="#fde047"/>
  </svg>`,

  industrial_automation: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#10221c"/>
    <circle cx="32" cy="32" r="14" stroke="#10b981" stroke-width="4" stroke-dasharray="6 4"/>
    <circle cx="32" cy="32" r="6" fill="#f59e0b"/>
  </svg>`,

  espionage_networks: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#161426"/>
    <path d="M10 32C18 18 46 18 54 32C46 46 18 46 10 32Z" fill="#1e1b4b" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="32" cy="32" r="7" fill="#f59e0b"/>
    <circle cx="32" cy="32" r="3" fill="#000"/>
  </svg>`,

  strategic_defense: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0f2128"/>
    <path d="M12 44C12 24 52 24 52 44" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <line x1="16" y1="16" x2="32" y2="30" stroke="#ef4444" stroke-width="2.5"/>
    <line x1="48" y1="44" x2="32" y2="30" stroke="#10b981" stroke-width="2.5"/>
    <circle cx="32" cy="30" r="5" fill="#f59e0b"/>
  </svg>`,

  rocketry: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#231217"/>
    <path d="M12 50Q32 8 52 22" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="4 3" fill="none"/>
    <polygon points="54,24 44,16 48,28" fill="#ef4444"/>
  </svg>`,

  thermonuclear_fission: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#2e0b0b"/>
    <circle cx="32" cy="32" r="20" stroke="#ef4444" stroke-width="2" fill="#450a0a"/>
    <circle cx="32" cy="32" r="4" fill="#f59e0b"/>
    <path d="M32 14L25 26H39L32 14Z" fill="#f59e0b"/>
    <path d="M18 42L26 36L21 29L18 42Z" fill="#f59e0b"/>
    <path d="M46 42L38 36L43 29L46 42Z" fill="#f59e0b"/>
  </svg>`,

  /* ======================== WAR & COVERT BUTTONS ======================== */
  cov_spy_intel: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0d2028"/>
    <circle cx="28" cy="28" r="14" stroke="#38bdf8" stroke-width="3"/>
    <line x1="38" y1="38" x2="52" y2="52" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  cov_sabotage_power: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#28140d"/>
    <polygon points="34,10 20,34 32,34 28,54 44,28 32,28" fill="#ef4444" stroke="#fde047" stroke-width="1.5"/>
  </svg>`,

  cov_steal_cash: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#0d2418"/>
    <rect x="12" y="20" width="40" height="26" rx="4" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
    <text x="32" y="39" text-anchor="middle" fill="#fde047" font-size="18" font-family="monospace" font-weight="bold">$</text>
  </svg>`,

  cov_sabotage_silos: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#261019"/>
    <line x1="20" y1="48" x2="44" y2="16" stroke="#e2e8f0" stroke-width="5"/>
    <line x1="16" y1="20" x2="48" y2="44" stroke="#ef4444" stroke-width="4"/>
  </svg>`,

  war_all_out: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#26170a"/>
    <polygon points="12,20 38,20 38,12 54,32 38,52 38,44 12,44" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/>
  </svg>`,

  war_air_raid: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#101e33"/>
    <polygon points="32,10 52,36 32,30 12,36" fill="#38bdf8"/>
    <circle cx="24" cy="48" r="4" fill="#ef4444"/>
    <circle cx="40" cy="48" r="4" fill="#f59e0b"/>
  </svg>`,

  war_naval_blitz: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#091d2e"/>
    <polygon points="8,34 56,34 48,46 16,46" fill="#38bdf8"/>
    <path d="M8 52Q20 48 32 52T56 52" stroke="#f59e0b" stroke-width="2.5"/>
  </svg>`,
};

window.getTbzIcon = function (key) {
  return window.TBZ_ICONS[key] || window.TBZ_ICONS.command_center;
};

