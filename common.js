// Shared helpers for every page: data loading, lines, forecast, the game header,
// Head to Head and the team card.
let DATA = null;

async function loadData() {
  const res = await fetch("data/data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  DATA = await res.json();
  try { initPlayerSearch(); } catch (e) { /* search is optional */ }
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

// Implied team totals from the current spread and O/U: favorite = (total + spread) / 2.
function impliedTotals(g) {
  const ln = lineFor(g);
  if (!ln || ln.total == null) return null;
  const half = ln.pick || !ln.fav ? 0 : ln.spread / 2;
  const fav = ln.total / 2 + half, dog = ln.total / 2 - half;
  const away = ln.fav === "home" ? dog : fav, home = ln.fav === "home" ? fav : dog;
  return { away: +away.toFixed(1), home: +home.toFixed(1) };
}
function impliedText(g) {
  const it = impliedTotals(g);
  return it ? `Implied: ${abbrOf(g.away)} ${it.away} · ${abbrOf(g.home)} ${it.home}` : "";
}

// Line movement since this week's first update (g.lineOpen, nflverse sign: positive = home favored).
function spreadLabel(g, homeSpread) {
  if (homeSpread == null) return null;
  if (homeSpread === 0) return "PK";
  return homeSpread > 0 ? `${abbrOf(g.home)} -${homeSpread}` : `${abbrOf(g.away)} -${-homeSpread}`;
}
function lineMoveText(g) {
  const o = g.lineOpen, ln = lineFor(g);
  if (!o || !ln || isFinal(g)) return "";
  const cur = ln.pick ? 0 : ln.fav === "home" ? ln.spread : ln.fav === "away" ? -ln.spread : null;
  const moved = [];
  if (cur != null && o.spread != null && Math.abs(cur - o.spread) >= 0.5) moved.push(`spread ${spreadLabel(g, o.spread)} → ${spreadLabel(g, cur)}`);
  if (ln.total != null && o.total != null && Math.abs(ln.total - o.total) >= 0.5) moved.push(`O/U ${o.total} → ${ln.total}`);
  const when = o.at ? new Date(o.at + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" }) : "earlier";
  return moved.length ? `Line move since ${when}: ${moved.join(" · ")}` : `No line move since ${when}`;
}

function refText(g) {
  const r = g.referee && DATA.referees ? DATA.referees[g.referee] : null;
  if (!g.referee) return "";
  if (!r) return `Referee: ${g.referee}`;
  const n = r.o + r.u;
  return `Referee: ${g.referee} · ${r.g} games ${DATA.refereeSeasons}: overs ${r.o}-${r.u}${r.p ? "-" + r.p : ""}${n ? ` (${Math.round((100 * r.o) / n)}%)` : ""} · ${r.ppg} pts/G`;
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
    <p class="edge-key">Ranks are out of 32. The edge goes to whichever side ranks at least 6 spots better; INT compares interceptions thrown by the offense with interceptions made by the defense. EPA / play (expected points added) and Success % use every pass and run play from nflverse play-by-play; for a defense, lower is better.</p>`;
  const cards = `<h3 class="section-title">Full Team Stats</h3>` + renderTeamCard(away) + renderTeamCard(home);
  return { head: renderHero(g, away, home), edges: edges + renderBetting(away, home), cards };
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
      <div class="hero-info hero-implied" id="heroImplied"${impliedText(g) ? "" : " hidden"}>${escapeHtml(impliedText(g))}</div>
      <div class="hero-info hero-move" id="heroMove"${lineMoveText(g) ? "" : " hidden"}>${escapeHtml(lineMoveText(g))}</div>
      ${refText(g) ? `<div class="hero-info">${escapeHtml(refText(g))}</div>` : ""}
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

const EFF_ROWS = [
  ["EPA / play", t => t.eff.off.epa, t => t.eff.def.epa, true, false],
  ["Success %", t => t.eff.off.sr, t => t.eff.def.sr, true, false],
];
function edgeRows() {
  return Object.values(DATA.teams).every(t => t.eff) ? EDGE_ROWS.slice(0, 1).concat(EFF_ROWS, EDGE_ROWS.slice(1)) : EDGE_ROWS;
}

function edgePanel(offTeam, defTeam) {
  const rows = edgeRows().map(([label, offGet, defGet, offHi, defHi]) => {
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

/* ---------------- Betting trends (ATS and over/under) ---------------- */
// t.betting = { ats, fav, dog, home, away: {w,l,p}, ou: {o,u,p}, games: [{ w, opp, at, line, score, ats, total, ou }] }
// line is the team's own closing spread from nflverse (negative = favored).

function renderBetting(a, b) {
  if (!a || !b || !a.betting || !b.betting) return "";
  return `<div class="bet-section no-print">
    <h3 class="section-title">Betting Trends</h3>
    <div class="edge-grid">${bettingPanel(a)}${bettingPanel(b)}</div>
    <p class="edge-key">Against the spread (ATS) and over/under records use each game's closing line from nflverse. W-L-P = wins, losses and pushes. Small samples early in the season can mislead.</p>
  </div>`;
}

function fmtLine(x) {
  if (x === null || x === undefined) return "—";
  return x === 0 ? "PK" : x > 0 ? `+${x}` : `${x}`;
}
function wlp(r) { return `${r.w}-${r.l}${r.p ? "-" + r.p : ""}`; }
function pct(n, d) { return d ? ` <span class="rk">${Math.round((100 * n) / d)}%</span>` : ""; }

function bettingPanel(t) {
  const b = t.betting;
  const chip = (label, r) => `<div class="bet-chip"><span class="lbl">${label}</span><b>${wlp(r)}</b>${pct(r.w, r.w + r.l)}</div>`;
  const ouChip = `<div class="bet-chip"><span class="lbl">O/U</span><b>${b.ou.o}-${b.ou.u}${b.ou.p ? "-" + b.ou.p : ""}</b>${pct(b.ou.o, b.ou.o + b.ou.u)}</div>`;
  const rows = b.games.slice().reverse().map(g => `<tr>
    <td>${g.w}</td><td>${g.at ? "@" : "vs"} ${escapeHtml(g.opp)}</td><td class="num">${fmtLine(g.line)}</td>
    <td class="num">${escapeHtml(g.score)}</td><td class="num"><span class="tag ${g.ats}">${g.ats}</span></td>
    <td class="num">${g.total != null ? g.total : "—"}</td><td class="num">${g.ou ? `<span class="tag ${g.ou === "O" ? "W" : g.ou === "U" ? "L" : "P"}">${g.ou}</span>` : "—"}</td></tr>`).join("");
  return `<div class="edge-panel bet-panel">
    <h4>${escapeHtml(t.team)}</h4>
    <div class="bet-chips">${chip("ATS", b.ats)}${chip("Fav", b.fav)}${chip("Dog", b.dog)}${chip("Home", b.home)}${chip("Away", b.away)}${ouChip}</div>
    ${b.games.length ? `<table class="edge-table">
      <thead><tr><th>Wk</th><th>Opp</th><th class="num">Line</th><th class="num">Score</th><th class="num">ATS</th><th class="num">Total</th><th class="num">O/U</th></tr></thead>
      <tbody>${rows}</tbody></table>` : `<div class="empty-note">No games with a line yet.</div>`}
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
        ? `<button type="button" class="plink" data-log="${escapeHtml(r.log)}" data-kind="${kind}" data-pos="${escapeHtml(r.pos || "")}" data-name="${txt}">${txt}</button>${injTag(r.inj)}`
        : txt + (key === "player" ? injTag(r.inj) : "");
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

/* ---------------- Injury tags + player index ---------------- */
// r.inj = { s: "O" | "D" | "Q" | "DNP" | "LP", note } from the nflverse injury report (DATA.injuryWeek).
const INJ_LABEL = { O: "Out", D: "Doubtful", Q: "Questionable", DNP: "Did not practice", LP: "Limited practice" };
function injTag(inj) {
  if (!inj || !inj.s) return "";
  const title = `Week ${DATA.injuryWeek} injury report: ${INJ_LABEL[inj.s] || inj.s}${inj.note ? " (" + inj.note + ")" : ""}`;
  return ` <span class="inj inj-${inj.s}" title="${escapeHtml(title)}">${escapeHtml(inj.s)}</span>`;
}

let PLAYER_INDEX = null;  // log key -> { key, name, pos, team, abbr, inj, kind }
function playerIndex() {
  if (PLAYER_INDEX) return PLAYER_INDEX;
  PLAYER_INDEX = {};
  for (const t of Object.values(DATA.teams)) {
    for (const kind of ["passing", "rushing", "receiving"]) {
      for (const r of t[kind] || []) {
        if (!r.log || PLAYER_INDEX[r.log]) continue;
        PLAYER_INDEX[r.log] = { key: r.log, name: r.player, pos: r.pos || "", team: t.team, abbr: t.abbr, inj: r.inj || null, kind };
      }
    }
  }
  return PLAYER_INDEX;
}

// Search box in the top bar: type a name, pick a player, and his game log opens.
function initPlayerSearch() {
  const bar = document.querySelector(".topbar");
  if (!bar || bar.querySelector(".psearch") || !DATA.gameLogs) return;
  const wrap = document.createElement("div");
  wrap.className = "psearch no-print";
  wrap.innerHTML = `<input type="search" placeholder="Search players" aria-label="Search players" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="psearchList">
    <ul class="psearch-list" id="psearchList" role="listbox" hidden></ul>`;
  (bar.querySelector(".topnav") || bar).appendChild(wrap);
  const input = wrap.querySelector("input"), list = wrap.querySelector("ul");
  let hits = [], active = -1;
  const norm = x => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.'’-]/g, "");
  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); active = -1; };
  const render = () => {
    list.innerHTML = hits.map((p, i) => `<li role="option" data-i="${i}" class="${i === active ? "active" : ""}" aria-selected="${i === active}">
      <span class="ps-name">${escapeHtml(p.name)}${injTag(p.inj)}</span><span class="ps-meta">${escapeHtml([p.pos, p.abbr].filter(Boolean).join(" · "))}</span></li>`).join("")
      || `<li class="ps-empty">No players found</li>`;
    list.hidden = false; input.setAttribute("aria-expanded", "true");
  };
  const pick = i => {
    const p = hits[i];
    if (!p) return;
    close(); input.value = "";
    if (window.openPlayerLog) window.openPlayerLog(p, input);
  };
  input.addEventListener("input", () => {
    const q = norm(input.value.trim());
    if (q.length < 2) { close(); return; }
    const all = Object.values(playerIndex());
    hits = all.filter(p => norm(p.name).split(" ").some(w => w.startsWith(q)) || norm(p.name).startsWith(q) || norm(p.name).includes(q))
      .sort((a, b) => (norm(a.name).startsWith(q) ? 0 : 1) - (norm(b.name).startsWith(q) ? 0 : 1) || a.name.localeCompare(b.name)).slice(0, 8);
    active = hits.length ? 0 : -1;
    render();
  });
  input.addEventListener("keydown", e => {
    if (list.hidden) return;
    if (e.key === "ArrowDown") { active = Math.min(hits.length - 1, active + 1); render(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { active = Math.max(0, active - 1); render(); e.preventDefault(); }
    else if (e.key === "Enter") { pick(active); e.preventDefault(); }
    else if (e.key === "Escape") { close(); }
  });
  list.addEventListener("mousedown", e => { const li = e.target.closest("li[data-i]"); if (li) { e.preventDefault(); pick(+li.dataset.i); } });
  input.addEventListener("blur", () => setTimeout(close, 100));
}

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

function tooltipHtml(name, kind, log, inj) {
  const cols = LOG_GROUPS[kind] || [];
  const head = `<th>Wk</th><th>Opp</th>${cols.map(([l]) => `<th class="num">${l}</th>`).join("")}<th class="num">FPts</th>`;
  const body = log.map(e => `<tr><td>${e.w}</td><td>${escapeHtml(oppText(e))}</td>${cols.map(([, f]) => `<td class="num">${f(e)}</td>`).join("")}<td class="num fp">${(e.fp || 0).toFixed(1)}</td></tr>`).join("");
  return `<div class="ptip-head"><b>${name}${inj ? injTag(inj) : ""}</b><span>${fpAvg(log)} FPts/G</span></div>
    ${inj && inj.note ? `<div class="ptip-inj">Week ${DATA.injuryWeek} report: ${escapeHtml(inj.note)}</div>` : ""}
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    <div class="ptip-foot">Click for full game log and prop check</div>`;
}

// Stats the prop tool can check, by group. get(e) returns that game's number.
const PROP_STATS = [
  ["pYds", "Pass Yds", "passing", e => e.pYds || 0],
  ["pTd", "Pass TD", "passing", e => e.pTd || 0],
  ["cmp", "Completions", "passing", e => e.cmp || 0],
  ["att", "Pass Attempts", "passing", e => e.att || 0],
  ["int", "Interceptions", "passing", e => e.int || 0],
  ["rYds", "Rush Yds", "rushing", e => e.rYds || 0],
  ["car", "Carries", "rushing", e => e.car || 0],
  ["rTd", "Rush TD", "rushing", e => e.rTd || 0],
  ["recYds", "Rec Yds", "receiving", e => e.recYds || 0],
  ["rec", "Receptions", "receiving", e => e.rec || 0],
  ["tgt", "Targets", "receiving", e => e.tgt || 0],
  ["rrYds", "Rush + Rec Yds", "rushrec", e => (e.rYds || 0) + (e.recYds || 0)],
  ["prYds", "Pass + Rush Yds", "passrush", e => (e.pYds || 0) + (e.rYds || 0)],
  ["tds", "Any TD (rush/rec)", "rushrec", e => (e.rTd || 0) + (e.recTd || 0)],
  ["fp", "Fantasy Pts (PPR)", "all", e => e.fp || 0],
];
const DEFAULT_PROP = { passing: "pYds", rushing: "rYds", receiving: "recYds" };

function propOptions(groups) {
  const has = g => groups.includes(g);
  return PROP_STATS.filter(([, , grp]) => grp === "all" || has(grp)
    || (grp === "rushrec" && has("rushing") && has("receiving"))
    || (grp === "passrush" && has("passing") && has("rushing")));
}

// What the next opponent allows for this stat, from the team cards' data.
function oppContext(teamAbbr, statKey, pos) {
  const team = Object.values(DATA.teams).find(t => t.abbr === teamAbbr);
  if (!team) return "";
  const g = scheduleGames().find(x => x.away === team.team || x.home === team.team);
  if (!g) return `${escapeHtml(teamAbbr)} is on a bye this week.`;
  const isAway = g.away === team.team;
  const opp = DATA.teams[isAway ? g.home : g.away];
  if (!opp) return "";
  const where = `${isAway && !g.neutral ? "@" : "vs"} ${escapeHtml(opp.abbr)}`;
  const d = opp.defense, dv = opp.defVsPosition;
  const P = (pos || "").toUpperCase();
  let what;
  if (["pYds", "pTd", "cmp", "att", "int", "prYds"].includes(statKey) || (statKey === "fp" && P === "QB"))
    what = `${d.passYdsG} pass yds/G (#${d.passYdsGRank})`;
  else if (["rYds", "car", "rTd"].includes(statKey))
    what = P === "RB" || P === "FB" ? `${dv.rb.yds} rush yds/G to RBs (#${dv.rb.rank})` : `${d.rushYdsG} rush yds/G (#${d.rushYdsGRank})`;
  else {
    const k = P === "TE" ? "te" : P === "RB" || P === "FB" ? "recRb" : "wr";
    const lbl = { te: "TEs", recRb: "RBs", wr: "WRs" }[k];
    what = `${dv[k].yds} rec yds/G to ${lbl} (#${dv[k].rank})`;
    if (statKey === "rrYds" && (P === "RB" || P === "FB")) what = `${dv.rb.yds} rush + ${dv.recRb.yds} rec yds/G to RBs (#${dv.rb.rank} / #${dv.recRb.rank})`;
  }
  return `Next: ${where} — ${escapeHtml(opp.abbr)} allows ${what}. Ranks out of 32; #1 = allows the fewest.`;
}

function propToolHtml(groups, kind) {
  const opts = propOptions(groups);
  const def = DEFAULT_PROP[kind] && opts.some(o => o[0] === DEFAULT_PROP[kind]) ? DEFAULT_PROP[kind] : opts[0][0];
  return `<div class="prop-tool">
    <div class="prop-inputs">
      <label>Prop <select class="prop-stat">${opts.map(([k, l]) => `<option value="${k}"${k === def ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label>Line <input class="prop-line" type="number" inputmode="decimal" step="0.5" min="0"></label>
    </div>
    <div class="prop-result" aria-live="polite"></div>
    <div class="prop-ctx"></div>
  </div>`;
}

function updateProp(card, log) {
  const key = card.querySelector(".prop-stat").value;
  const stat = PROP_STATS.find(s => s[0] === key);
  const lineEl = card.querySelector(".prop-line");
  const vals = log.map(stat[3]);
  const avg = vals.reduce((a, v) => a + v, 0) / (vals.length || 1);
  if (lineEl.dataset.stat !== key) {  // new stat: suggest a line just under the season average
    lineEl.value = Math.max(0.5, Math.floor(avg) + 0.5);
    lineEl.dataset.stat = key;
  }
  const line = parseFloat(lineEl.value);
  const rows = card.querySelectorAll("tbody tr");
  let over = 0, under = 0, push = 0;
  vals.forEach((v, i) => {
    const r = isNaN(line) ? "" : v > line ? "O" : v < line ? "U" : "P";
    if (r === "O") over++; else if (r === "U") under++; else if (r === "P") push++;
    const cell = rows[i] && rows[i].querySelector(".prop-cell");
    if (cell) cell.innerHTML = `${Number.isInteger(v) ? v : v.toFixed(1)}${r ? ` <span class="tag ${r === "O" ? "W" : r === "U" ? "L" : "P"}">${r}</span>` : ""}`;
    if (rows[i]) { rows[i].classList.toggle("prop-over", r === "O"); rows[i].classList.toggle("prop-under", r === "U"); }
  });
  card.querySelector(".prop-head").textContent = stat[1];
  const res = card.querySelector(".prop-result");
  if (isNaN(line)) { res.textContent = "Enter a line to see how often he's cleared it."; return; }
  const n = over + under;
  const last3 = vals.slice(-3).map(v => (v > line ? "O" : v < line ? "U" : "P")).join(" ");
  res.innerHTML = `Over ${line}: <b>${over} of ${vals.length} games</b>${n ? ` (${Math.round((100 * over) / n)}%)` : ""}${push ? `, ${push} push` : ""} · Avg ${avg.toFixed(1)} · Last ${Math.min(3, vals.length)}: ${last3}`;
}

function panelHtml(name, key, log, kind) {
  const t = teamOfLog(key);
  const pinfo = playerIndex()[key];
  const groups = ["passing", "rushing", "receiving"].filter(g => log.some(hasGroup[g]));
  if (kind && !groups.includes(kind)) groups.push(kind);
  const anyFl = log.some(e => e.fl);
  const gh = groups.map(g => `<th colspan="${LOG_GROUPS[g].length}" class="grp">${GROUP_LABEL[g]}</th>`).join("");
  const sub = groups.map(g => LOG_GROUPS[g].map(([l], i) => `<th class="num${i === 0 ? " gstart" : ""}">${l}</th>`).join("")).join("");
  const body = log.map(e => `<tr>
    <td>${e.w}</td><td>${escapeHtml(oppText(e))}</td><td class="res ${e.res && e.res[0] === "W" ? "pos" : e.res && e.res[0] === "L" ? "neg" : ""}">${escapeHtml(e.res || "")}</td>
    ${groups.map(g => LOG_GROUPS[g].map(([, f], i) => `<td class="num${i === 0 ? " gstart" : ""}">${f(e)}</td>`).join("")).join("")}
    ${anyFl ? `<td class="num gstart">${e.fl || 0}</td>` : ""}
    <td class="num fp gstart">${(e.fp || 0).toFixed(1)}</td><td class="num prop-cell gstart"></td></tr>`).join("");
  const total = log.reduce((a, e) => a + (e.fp || 0), 0);
  return `<div class="plog-card" role="dialog" aria-modal="true" aria-labelledby="plogTitle">
    <div class="plog-top">
      <div>
        <h3 id="plogTitle">${name}${pinfo && pinfo.inj ? injTag(pinfo.inj) : ""}</h3>
        ${pinfo && pinfo.inj && pinfo.inj.note ? `<div class="plog-inj">Week ${DATA.injuryWeek} injury report: ${escapeHtml(pinfo.inj.note)}</div>` : ""}
        <div class="plog-sub">${pinfo && pinfo.pos ? escapeHtml(pinfo.pos) + " · " : ""}${t ? escapeHtml(t.team) + " · " : ""}${log.length} game${log.length === 1 ? "" : "s"} · ${total.toFixed(1)} FPts (${fpAvg(log)}/G)</div>
      </div>
      <button type="button" class="plog-close" aria-label="Close">✕</button>
    </div>
    <div class="plog-scroll">
      <table>
        <thead>
          <tr><th colspan="3"></th>${gh}${anyFl ? `<th></th>` : ""}<th></th><th class="grp">Prop</th></tr>
          <tr><th>Wk</th><th>Opp</th><th>Result</th>${sub}${anyFl ? `<th class="num gstart" title="Fumbles lost">FL</th>` : ""}<th class="num gstart">FPts</th><th class="num gstart prop-head"></th></tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    ${propToolHtml(groups, kind)}
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
    const pi = playerIndex()[btn.dataset.log];
    tip.innerHTML = tooltipHtml(escapeHtml(btn.dataset.name), btn.dataset.kind, log, pi && pi.inj);
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
    panel.innerHTML = panelHtml(escapeHtml(btn.dataset.name), btn.dataset.log, log, btn.dataset.kind);
    const card = panel.querySelector(".plog-card");
    const ctx = card.querySelector(".prop-ctx");
    const refresh = () => { updateProp(card, log); ctx.textContent = ""; ctx.innerHTML = oppContext(btn.dataset.log.split("|")[0], card.querySelector(".prop-stat").value, btn.dataset.pos); };
    card.querySelector(".prop-stat").addEventListener("change", refresh);
    card.querySelector(".prop-line").addEventListener("input", () => updateProp(card, log));
    refresh();
    panel.hidden = false;
    document.body.classList.add("plog-open");
    panel.querySelector(".plog-close").focus();
  }

  window.openPlayerLog = (p, returnFocus) => openPanel({
    dataset: { log: p.key, name: p.name, kind: p.kind, pos: p.pos },
    focus: () => returnFocus && returnFocus.focus(),
  });

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

// ---------- PDF downloads ----------
// PDFs are built by .github/workflows/build-pdfs.yml (scripts/build_pdfs.py) with
// headless Chrome whenever data.json changes. pdf/manifest.json says which week they
// are for; a link only shows when its PDF matches the week on the page.
let _pdfManifest;
function pdfManifest() {
  if (_pdfManifest === undefined) {
    _pdfManifest = fetch("pdf/manifest.json", { cache: "no-cache" })
      .then(r => (r.ok ? r.json() : null)).catch(() => null);
  }
  return _pdfManifest;
}
// el: an <a>. gameId: one game, or falsy for every game this week.
async function showPdfLink(el, gameId) {
  if (!el) return;
  const m = await pdfManifest();
  if (!m || !DATA || !DATA.schedule || m.week !== DATA.schedule.week || m.season !== DATA.season) return;
  if (gameId) {
    if (!(m.games || []).includes(gameId)) return;
    el.href = `pdf/games/${encodeURIComponent(gameId)}.pdf?v=${encodeURIComponent(m.generatedAt)}`;
    el.setAttribute("download", `${gameId}.pdf`);
  } else {
    el.href = `pdf/matchups.pdf?v=${encodeURIComponent(m.generatedAt)}`;
    el.setAttribute("download", `NFL_${m.season}_week_${m.week}_matchups.pdf`);
  }
  el.title = `PDF built ${new Date(m.generatedAt).toLocaleString()}`;
  el.hidden = false;
}
