// Shared helpers for every page: data loading, lines, forecast, the game header,
// Head to Head and the team card.
let DATA = null;

async function loadData() {
  const res = await fetch("data/data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  DATA = await res.json();
  return DATA;
}

function loadError(target) {
  target.innerHTML = `<div class="empty-note">Couldn't load the stats. Try refreshing in a minute.</div>`;
}

// Filled in after load: live game state from ESPN (live.js), ESPN's current
// betting line (live.js) and the kickoff forecast (weather.js). All keyed by game id.
const LIVE = {};    // { [id]: { state, detail, away, home, possession, ... } }
const LINES = {};   // { [id]: { details: "CLE -2.5", total: 38.5 } }
const WX = {};      // { [id]: { icon, text, temp, pop, wind } }
function liveFor(g) { return LIVE[g.id] || null; }

// nflverse abbreviations that ESPN writes differently.
const ESPN_ABBR = { LA: "LAR", WAS: "WSH" };
function abbrOf(name) {
  const t = DATA.teams[name];
  return t ? t.abbr : name;
}
function espnAbbrOf(name) {
  const a = abbrOf(name);
  return ESPN_ABBR[a] || a;
}

function scheduleGames() {
  return (DATA.schedule && DATA.schedule.games) || [];
}

function findGame(id) {
  return scheduleGames().find(g => g.id === id) || null;
}

// Kickoff as a Date. Uses `start` (UTC) when the data has it, otherwise gameday +
// gametime, which nflverse gives in US Eastern time.
function gameStart(g) {
  if (g.start) return new Date(g.start);
  if (!g.gametime) return new Date(g.gameday + "T12:00:00");
  const guess = new Date(`${g.gameday}T${g.gametime}:00Z`);
  // Eastern is UTC-4 in daylight time and UTC-5 otherwise; ask the browser which applies.
  const etHour = +new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(guess);
  const offset = (guess.getUTCHours() - etHour + 24) % 24;
  return new Date(guess.getTime() + offset * 3600 * 1000);
}

function isFinal(g) {
  return g.awayScore !== null && g.awayScore !== undefined && g.homeScore !== null && g.homeScore !== undefined;
}

function fmtRecord(t) {
  return `${t.record.w}-${t.record.l}${t.record.t ? "-" + t.record.t : ""}`;
}

// Current line for a game: ESPN's (live.js) when it names one of the two teams,
// otherwise the weekly nflverse line. spread = points the favorite gives;
// fav = "away" or "home". nflverse spread_line: positive = home team favored.
function lineFor(g) {
  let fav = null, spread = null, pick = false;
  const cur = LINES[g.id];
  if (cur && cur.details) {
    if (/^(even|pk|pick)/i.test(cur.details)) pick = true;
    else {
      const m = cur.details.match(/^(.+?)\s+-(\d+(?:\.\d+)?)$/);
      if (m) {
        const ab = m[1].trim().toUpperCase();
        if (ab === espnAbbrOf(g.away).toUpperCase() || ab === abbrOf(g.away).toUpperCase()) fav = "away";
        else if (ab === espnAbbrOf(g.home).toUpperCase() || ab === abbrOf(g.home).toUpperCase()) fav = "home";
        if (fav) spread = parseFloat(m[2]);
      }
    }
  }
  if (!pick && !fav && g.spread !== null && g.spread !== undefined) {
    if (g.spread === 0) pick = true;
    else { fav = g.spread > 0 ? "home" : "away"; spread = Math.abs(g.spread); }
  }
  const total = cur && cur.total != null ? cur.total : (g.total || null);
  if (!pick && !fav && total == null) return null;
  return { fav, spread, pick, total };
}

// "Spread: CLE -2.5 · O/U 38.5" from the current line.
function heroLineText(g) {
  const ln = lineFor(g);
  if (!ln) return "";
  const spread = ln.pick ? "Pick'em" : ln.fav ? `${abbrOf(g[ln.fav])} -${ln.spread}` : null;
  return [spread ? `Spread: ${spread}` : null, ln.total != null ? `O/U ${ln.total}` : null].filter(Boolean).join(" · ");
}

// Forecast line for the game header; blank for indoor games and once the game is over.
function heroWxText(g) {
  if (isFinal(g) || g.indoor === true) return "";
  const w = WX[g.id];
  if (!w) return "";
  return [`${w.icon} ${w.text}`, `${w.temp}° at kickoff`,
    w.pop != null ? `${w.pop}% chance of rain` : null, w.wind != null ? `Wind ${w.wind} mph` : null]
    .filter(Boolean).join(" · ");
}

function roofLabel(g) {
  if (g.indoor === true) return { dome: "Dome", closed: "Roof closed" }[g.roof] || "Indoors";
  if (g.indoor === false) return g.roof === "open" ? "Roof open" : "Outdoors";
  return { dome: "Dome", closed: "Roof closed", open: "Roof open", outdoors: "Outdoors" }[g.roof] || null;
}

/* ---------------- One game: header, Head to Head, team cards ---------------- */

// Used by the matchup page and Print all.
function renderMatchupParts(g) {
  const away = DATA.teams[g.away], home = DATA.teams[g.home];
  const edges = `
    <h3 class="section-title">Head to Head</h3>
    <div class="edge-grid">
      ${edgePanel(away, home)}
      ${edgePanel(home, away)}
    </div>
    <p class="edge-key">Ranks are out of 32. The edge goes to whichever side ranks at least 6 spots better; INT compares interceptions thrown by the offense with interceptions made by the defense.</p>`;
  const cards = `<h3 class="section-title">Full Team Stats</h3>` + renderTeamCard(away) + renderTeamCard(home);
  return { head: renderHero(g, away, home), edges, cards };
}

function renderHero(g, away, home) {
  const final = isFinal(g);
  const d = gameStart(g);
  const day = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = final ? "Final" : !g.gametime ? "Time TBD"
    : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const info = [
    `${day} · ${time}`,
    [g.stadium, g.city, roofLabel(g)].filter(Boolean).join(" · "),
    g.neutral ? "Neutral site" : null,
  ].filter(Boolean);
  const lineText = heroLineText(g), wxText = heroWxText(g);

  return `
  <div class="mh-week">Week ${DATA.schedule.week}</div>
  <div class="game-hero">
    ${heroTeam(away, g.neutral ? "Team 1" : "Away", final ? g.awayScore : null, "away")}
    <div class="hero-mid">
      <div class="hero-live" id="heroLive" hidden></div>
      <div class="hero-at">${g.neutral ? "vs" : "@"}</div>
      ${info.map(i => `<div class="hero-info">${escapeHtml(i)}</div>`).join("")}
      <div class="hero-info hero-wx" id="heroWx"${wxText ? "" : " hidden"}>${escapeHtml(wxText || "")}</div>
      <div class="hero-line" id="heroLine"${lineText ? "" : " hidden"}>${escapeHtml(lineText || "")}</div>
      ${g.divisional ? `<div class="hero-info">Division game</div>` : ""}
    </div>
    ${heroTeam(home, g.neutral ? "Team 2" : "Home", final ? g.homeScore : null, "home")}
  </div>`;
}

function heroTeam(t, side, score, sideKey) {
  return `
    <div class="hero-team" data-side="${sideKey}">
      <div class="hero-side">${side}</div>
      <div class="hero-score" hidden></div>
      <div class="hero-name">${escapeHtml(t.team)}</div>
      <div class="hero-rec">${fmtRecord(t)}${score !== null ? ` · <b>${score}</b>` : ""}</div>
      <div class="hero-srs">SRS <span class="${t.record.srs > 0 ? "pos" : t.record.srs < 0 ? "neg" : ""}">${t.record.srs}</span></div>
    </div>`;
}

// Rank a value among all 32 teams. higherIsBetter decides direction; ties share the lower rank.
function leagueRank(getter, value, higherIsBetter) {
  const all = Object.values(DATA.teams).map(getter);
  return 1 + all.filter(v => (higherIsBetter ? v > value : v < value)).length;
}

const EDGE_ROWS = [
  // label, offense getter, defense getter, offense higher-better, defense higher-better
  ["Points / G", t => t.offense.ppg, t => t.defense.papg, true, false],
  ["Rush Yds / G", t => t.offense.rushYdsG, t => t.defense.rushYdsG, true, false],
  ["Rush TD / G", t => t.offense.rushTdG, t => t.defense.rushTdG, true, false],
  ["Pass Yds / G", t => t.offense.passYdsG, t => t.defense.passYdsG, true, false],
  ["Pass TD / G", t => t.offense.passTdG, t => t.defense.passTdG, true, false],
  ["INT / G", t => t.offense.int, t => t.defense.int, false, true],
];

function edgePanel(offTeam, defTeam) {
  const rows = EDGE_ROWS.map(([label, offGet, defGet, offHi, defHi]) => {
    const ov = offGet(offTeam), dv = defGet(defTeam);
    const or = leagueRank(offGet, ov, offHi), dr = leagueRank(defGet, dv, defHi);
    const diff = dr - or;
    const edge = diff >= 6 ? `<span class="edge-chip off">Offense</span>`
      : diff <= -6 ? `<span class="edge-chip def">Defense</span>`
      : `<span class="edge-chip even">Even</span>`;
    return `<tr>
      <td class="lbl">${label}</td>
      <td class="num"><b>${ov}</b> <span class="rk">#${or}</span></td>
      <td class="num"><b>${dv}</b> <span class="rk">#${dr}</span></td>
      <td class="edge">${edge}</td>
    </tr>`;
  }).join("");

  return `
  <div class="edge-panel">
    <h4><span class="off-txt">${escapeHtml(offTeam.abbr)} offense</span> vs <span class="def-txt">${escapeHtml(defTeam.abbr)} defense</span></h4>
    <table class="edge-table">
      <thead><tr><th></th><th class="num">${escapeHtml(offTeam.abbr)} O</th><th class="num">${escapeHtml(defTeam.abbr)} D</th><th class="num">Edge</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

/* ---------------- Team card ---------------- */

function renderTeamCard(t) {
  if (!t) return "";
  const avg = DATA.leagueAverage;
  const gr = DATA.gaugeRanges;

  return `
  <div class="team-card" data-team="${escapeHtml(t.team)}">
    <div class="team-card-header">
      <div class="team-name-block">
        <h2>${escapeHtml(t.team)}</h2>
        <div class="record"><b>${t.record.w}-${t.record.l}${t.record.t ? "-" + t.record.t : ""}</b></div>
      </div>
      <div class="rating-badges">
        ${badge("SoS", t.record.sos)}
        ${badge("OSRS", t.record.osrs)}
        ${badge("DSRS", t.record.dsrs)}
        ${badge("SRS", t.record.srs)}
      </div>
      <button class="print-btn print-btn-single no-print" type="button" onclick="printOneTeam('${escapeHtml(t.team).replace(/'/g, "\\'")}')">🖨 Print</button>
    </div>

    <div class="stat-columns">
      <div class="stat-col offense">
        <h3>Offense</h3>
        <div class="gauges">
          ${gaugeBlock("Rush Yds/G", t.offense.rushYdsG, gr.offRushYdsG, t.offense.rushYdsGRank, "var(--off)")}
          ${gaugeBlock("Pass Yds/G", t.offense.passYdsG, gr.offPassYdsG, t.offense.passYdsGRank, "var(--off)")}
        </div>
        <div class="mini-stats">
          ${miniStat("Rush TD/G", t.offense.rushTdG, avg.rushTdG)}
          ${miniStat("Pass TD/G", t.offense.passTdG, avg.passTdG)}
          ${miniStat("PPG", t.offense.ppg, avg.ppg)}
        </div>
      </div>

      <div class="center-col">
        <div class="rank-compare">
          <div class="rank-pill off">
            <span class="lbl">Off Rush Rk</span>
            <span class="val">${fmtRank(t.offense.rushYdsGRank)}</span>
          </div>
          <span class="rank-arrow">vs</span>
          <div class="rank-pill def">
            <span class="lbl">Def Rush Rk</span>
            <span class="val">${fmtRank(t.defense.rushYdsGRank)}</span>
          </div>
        </div>
        <div class="rank-compare">
          <div class="rank-pill off">
            <span class="lbl">Off Pass Rk</span>
            <span class="val">${fmtRank(t.offense.passYdsGRank)}</span>
          </div>
          <span class="rank-arrow">vs</span>
          <div class="rank-pill def">
            <span class="lbl">Def Pass Rk</span>
            <span class="val">${fmtRank(t.defense.passYdsGRank)}</span>
          </div>
        </div>
        <div class="pass-rank-block">
          <div class="lbl">League Avg (Rush TD/G · Pass TD/G · PPG)</div>
          <div class="pass-rank-row">${avg.rushTdG} · ${avg.passTdG} · ${avg.ppg}</div>
        </div>
      </div>

      <div class="stat-col defense">
        <h3>Defense</h3>
        <div class="gauges">
          ${gaugeBlock("Rush Yds/G", t.defense.rushYdsG, gr.defRushYdsG, t.defense.rushYdsGRank, "var(--def)")}
          ${gaugeBlock("Pass Yds/G", t.defense.passYdsG, gr.defPassYdsG, t.defense.passYdsGRank, "var(--def)")}
        </div>
        <div class="mini-stats">
          ${miniStat("Rush TD/G", t.defense.rushTdG, avg.rushTdG)}
          ${miniStat("Pass TD/G", t.defense.passTdG, avg.passTdG)}
          ${miniStat("PA/G", t.defense.papg, avg.ppg)}
        </div>
      </div>
    </div>

    <div class="tables-row">
      ${playerTable("Passing", t.passing, [
        ["Player", "player", "text"],
        ["Yds/G", "ydsG", "num"],
        ["TD", "td", "num"],
        ["Int", "int", "num"],
      ])}
      ${playerTable("Rushing", t.rushing, [
        ["Player", "player", "text"],
        ["Yds/G", "ydsG", "num"],
        ["TD", "td", "num"],
        ["Y/A", "ya", "num"],
        ["A/G", "ag", "num"],
      ])}
      ${playerTable("Receiving", t.receiving, [
        ["Player", "player", "text"],
        ["Yds/G", "ydsG", "num"],
        ["TD", "td", "num"],
        ["Y/R", "yr", "num"],
        ["Rec/G", "rec", "num"],
      ])}
    </div>

    <div class="defpos-row">
      ${defPosBlock("Def vs RB", t.defVsPosition.rb)}
      ${defPosBlock("Def vs Rec-RB", t.defVsPosition.recRb)}
      ${defPosBlock("Def vs TE", t.defVsPosition.te)}
      ${defPosBlock("Def vs WR", t.defVsPosition.wr)}
    </div>
  </div>`;
}

function badge(label, value) {
  const cls = value > 0 ? "pos" : value < 0 ? "neg" : "";
  return `<div class="badge"><span class="label">${label}</span><span class="value ${cls}">${value}</span></div>`;
}

function miniStat(label, value, avg) {
  return `<div class="mini-stat">
    <div class="val">${value}</div>
    <div class="lbl">${label}</div>
    <div class="avg">avg ${avg}</div>
  </div>`;
}

function fmtRank(r) {
  if (r === null || r === undefined) return "—";
  return "#" + r;
}

function defPosBlock(title, d) {
  if (!d) return `<div class="defpos-block"><h4>${title}</h4><div class="empty-note">No data</div></div>`;
  return `<div class="defpos-block">
    <h4>${title}</h4>
    <div class="defpos-stats">
      <div class="item"><div class="val">${fmtRank(d.rank)}</div><div class="lbl">Rank</div></div>
      <div class="item"><div class="val">${d.yds}</div><div class="lbl">Yds/G</div></div>
      <div class="item"><div class="val">${d.td}</div><div class="lbl">TD/G</div></div>
    </div>
  </div>`;
}

function playerTable(title, rows, cols) {
  if (!rows || rows.length === 0) {
    return `<div class="table-block"><h4>${title}</h4><div class="empty-note">No data</div></div>`;
  }
  const head = cols.map(([label, , type]) => `<th class="${type === "num" ? "num" : ""}">${label}</th>`).join("");
  const kind = title.toLowerCase();
  const body = rows.map(r => {
    const cells = cols.map(([, key, type]) => {
      const txt = escapeHtml(String(r[key]));
      const val = key === "player" && r.log && DATA.gameLogs && DATA.gameLogs[r.log]
        ? `<button type="button" class="plink" data-log="${escapeHtml(r.log)}" data-kind="${kind}" data-name="${txt}">${txt}</button>`
        : txt;
      return `<td class="${type === "num" ? "num" : ""}">${val}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<div class="table-block">
    <h4>${title}</h4>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  </div>`;
}

// --- Gauge (SVG semicircle) ---
function gaugeBlock(label, value, range, rank, color) {
  const svg = gaugeSvg(value, range.min, range.max, color);
  return `<div class="gauge-block">
    ${svg}
    <div class="gauge-value">${value}</div>
    <div class="gauge-label">${label}</div>
    <div class="gauge-rank">${fmtRank(rank)} in NFL</div>
  </div>`;
}

function gaugeSvg(value, min, max, color) {
  const clamped = Math.max(min, Math.min(max, value));
  const pct = (clamped - min) / (max - min || 1);
  const angle = 180 * pct; // 0 = left (min), 180 = right (max)

  const cx = 60, cy = 58, r = 46;
  const startAngle = 180; // left
  const endAngle = 180 - angle; // sweep toward right as pct increases

  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  };

  const [sx, sy] = toXY(180);
  const [ex, ey] = toXY(180 - angle);
  const largeArc = angle > 180 ? 1 : 0;

  const arcPath = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;

  // needle
  const needleAngleDeg = 180 - angle;
  const needleRad = (needleAngleDeg * Math.PI) / 180;
  const nx = cx + (r - 6) * Math.cos(needleRad);
  const ny = cy - (r - 6) * Math.sin(needleRad);

  return `
  <svg viewBox="0 0 120 66" width="120" height="66">
    <path d="M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}" fill="none" stroke="var(--track)" stroke-width="9" stroke-linecap="round"/>
    <path d="${arcPath}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(2)}" y2="${ny.toFixed(2)}" stroke="var(--text)" stroke-width="2" class="gauge-needle-tip"/>
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--text)"/>
  </svg>`;
}

function printOneTeam(teamName) {
  document.body.classList.add("print-single");
  const cards = document.querySelectorAll(".team-card");
  cards.forEach(c => {
    if (c.dataset.team !== teamName) c.classList.add("print-hide");
  });
  window.print();
}

window.addEventListener("afterprint", () => {
  document.querySelectorAll(".team-card.print-hide").forEach(c => c.classList.remove("print-hide"));
  document.body.classList.remove("print-single");
});

/* ---------------- Player game logs: hover tooltip + click panel ---------------- */
// DATA.gameLogs["ABBR|player_id"] = [{ w, opp, at, res, cmp, att, pYds, pTd, int, car, rYds,
// rTd, tgt, rec, recYds, recTd, fl, fp }], one entry per game; stats left out are 0.
// fp = full-PPR fantasy points from nflverse.

const LOG_GROUPS = {
  passing: [["C/Att", e => `${e.cmp || 0}/${e.att || 0}`], ["Yds", e => e.pYds || 0], ["TD", e => e.pTd || 0], ["Int", e => e.int || 0]],
  rushing: [["Att", e => e.car || 0], ["Yds", e => e.rYds || 0], ["TD", e => e.rTd || 0],
    ["Y/A", e => e.car ? ((e.rYds || 0) / e.car).toFixed(1) : "—"]],
  receiving: [["Tgt", e => e.tgt || 0], ["Rec", e => e.rec || 0], ["Yds", e => e.recYds || 0], ["TD", e => e.recTd || 0],
    ["Y/R", e => e.rec ? ((e.recYds || 0) / e.rec).toFixed(1) : "—"]],
};
const GROUP_LABEL = { passing: "Passing", rushing: "Rushing", receiving: "Receiving" };
const hasGroup = { passing: e => e.att > 0, rushing: e => e.car > 0, receiving: e => e.tgt > 0 || e.rec > 0 };

function oppText(e) { return `${e.at ? "@" : "vs"} ${e.opp}`; }
function fpAvg(log) { return log.length ? (log.reduce((a, e) => a + (e.fp || 0), 0) / log.length).toFixed(1) : "—"; }
function teamOfLog(key) {
  const abbr = key.split("|")[0];
  return Object.values(DATA.teams).find(t => t.abbr === abbr) || null;
}

function tooltipHtml(name, kind, log) {
  const cols = LOG_GROUPS[kind] || [];
  const head = `<th>Wk</th><th>Opp</th>${cols.map(([l]) => `<th class="num">${l}</th>`).join("")}<th class="num">FPts</th>`;
  const body = log.map(e => `<tr><td>${e.w}</td><td>${escapeHtml(oppText(e))}</td>${cols.map(([, f]) => `<td class="num">${f(e)}</td>`).join("")}<td class="num fp">${(e.fp || 0).toFixed(1)}</td></tr>`).join("");
  return `<div class="ptip-head"><b>${name}</b><span>${fpAvg(log)} FPts/G</span></div>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    <div class="ptip-foot">Click for full game log</div>`;
}

function panelHtml(name, key, log) {
  const t = teamOfLog(key);
  const groups = ["passing", "rushing", "receiving"].filter(g => log.some(hasGroup[g]));
  const anyFl = log.some(e => e.fl);
  const gh = groups.map(g => `<th colspan="${LOG_GROUPS[g].length}" class="grp">${GROUP_LABEL[g]}</th>`).join("");
  const sub = groups.map(g => LOG_GROUPS[g].map(([l], i) => `<th class="num${i === 0 ? " gstart" : ""}">${l}</th>`).join("")).join("");
  const body = log.map(e => `<tr>
    <td>${e.w}</td><td>${escapeHtml(oppText(e))}</td><td class="res ${e.res && e.res[0] === "W" ? "pos" : e.res && e.res[0] === "L" ? "neg" : ""}">${escapeHtml(e.res || "")}</td>
    ${groups.map(g => LOG_GROUPS[g].map(([, f], i) => `<td class="num${i === 0 ? " gstart" : ""}">${f(e)}</td>`).join("")).join("")}
    ${anyFl ? `<td class="num gstart">${e.fl || 0}</td>` : ""}
    <td class="num fp gstart">${(e.fp || 0).toFixed(1)}</td></tr>`).join("");
  const total = log.reduce((a, e) => a + (e.fp || 0), 0);
  return `<div class="plog-card" role="dialog" aria-modal="true" aria-labelledby="plogTitle">
    <div class="plog-top">
      <div>
        <h3 id="plogTitle">${name}</h3>
        <div class="plog-sub">${t ? escapeHtml(t.team) + " · " : ""}${log.length} game${log.length === 1 ? "" : "s"} · ${total.toFixed(1)} FPts (${fpAvg(log)}/G)</div>
      </div>
      <button type="button" class="plog-close" aria-label="Close">✕</button>
    </div>
    <div class="plog-scroll">
      <table>
        <thead>
          <tr><th colspan="3"></th>${gh}${anyFl ? `<th></th>` : ""}<th></th></tr>
          <tr><th>Wk</th><th>Opp</th><th>Result</th>${sub}${anyFl ? `<th class="num gstart" title="Fumbles lost">FL</th>` : ""}<th class="num gstart">FPts</th></tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="plog-note">Fantasy points use full-PPR scoring. Games played for ${t ? escapeHtml(t.abbr) : "this team"} only.</div>
  </div>`;
}

(function setupPlayerLogs() {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let tip = null, panel = null, lastFocus = null, quiet = false;

  function hideTip() { if (tip) tip.hidden = true; }
  function showTip(btn) {
    const log = DATA && DATA.gameLogs && DATA.gameLogs[btn.dataset.log];
    if (!log) return;
    if (!tip) { tip = document.createElement("div"); tip.className = "ptip no-print"; document.body.appendChild(tip); }
    tip.innerHTML = tooltipHtml(escapeHtml(btn.dataset.name), btn.dataset.kind, log);
    tip.hidden = false;
    const r = btn.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let left = r.left, top = r.bottom + 6;
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
    if (top + h > window.innerHeight - 8) top = r.top - h - 6;
    tip.style.left = Math.max(8, left) + "px";
    tip.style.top = Math.max(8, top) + "px";
  }
  function closePanel() {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove("plog-open");
    if (lastFocus) { quiet = true; lastFocus.focus(); quiet = false; }
  }
  function openPanel(btn) {
    const log = DATA && DATA.gameLogs && DATA.gameLogs[btn.dataset.log];
    if (!log) return;
    hideTip();
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "plog no-print";
      panel.addEventListener("click", e => { if (e.target === panel || e.target.closest(".plog-close")) closePanel(); });
      document.body.appendChild(panel);
    }
    lastFocus = btn;
    panel.innerHTML = panelHtml(escapeHtml(btn.dataset.name), btn.dataset.log, log);
    panel.hidden = false;
    document.body.classList.add("plog-open");
    panel.querySelector(".plog-close").focus();
  }

  document.addEventListener("click", e => {
    const btn = e.target.closest(".plink");
    if (btn) openPanel(btn);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closePanel(); hideTip(); } });
  if (canHover) {
    document.addEventListener("mouseover", e => {
      const btn = e.target.closest(".plink");
      if (btn) showTip(btn);
    });
    document.addEventListener("mouseout", e => {
      const btn = e.target.closest(".plink");
      if (btn && !btn.contains(e.relatedTarget)) hideTip();
    });
    document.addEventListener("focusin", e => { const b = e.target.closest && e.target.closest(".plink"); if (b && !quiet) showTip(b); });
    document.addEventListener("focusout", e => { if (e.target.closest && e.target.closest(".plink")) hideTip(); });
  }
  window.addEventListener("scroll", hideTip, { passive: true });
})();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
