// One game: header, head-to-head edges, then both full team cards.
const gameHeader = document.getElementById("gameHeader");
const edges = document.getElementById("edges");
const teamCards = document.getElementById("teamCards");

init();

async function init() {
  try {
    await loadData();
  } catch (err) {
    loadError(gameHeader);
    return;
  }
  document.getElementById("printBtn").addEventListener("click", () => window.print());

  const id = new URLSearchParams(location.search).get("game");
  const g = id ? findGame(id) : null;
  if (!g || !DATA.teams[g.away] || !DATA.teams[g.home]) {
    gameHeader.innerHTML = `<div class="empty-note">That game isn't on this week's schedule anymore. <a href="index.html">See this week's matchups</a>.</div>`;
    return;
  }

  const away = DATA.teams[g.away];
  const home = DATA.teams[g.home];
  document.title = `${away.abbr} @ ${home.abbr} · NFL Matchup Dashboard`;

  gameHeader.innerHTML = renderHeader(g, away, home);
  edges.innerHTML = `
    <h3 class="section-title">Head to Head</h3>
    <div class="edge-grid">
      ${edgePanel(away, home)}
      ${edgePanel(home, away)}
    </div>
    <p class="edge-key">Ranks are out of 32. The edge goes to whichever side ranks at least 6 spots better; INT compares interceptions thrown by the offense with interceptions made by the defense.</p>`;
  teamCards.innerHTML = `<h3 class="section-title">Full Team Stats</h3>` +
    renderTeamCard(away) + renderTeamCard(home);
}

function renderHeader(g, away, home) {
  const final = g.awayScore !== null && g.homeScore !== null;
  const info = [
    `${fmtGameday(g.gameday)} · ${final ? "Final" : fmtKickoff(g.gametime)}`,
    [g.stadium, roofLabel(g.roof)].filter(Boolean).join(" · "),
  ].filter(Boolean);
  const line = [
    fmtSpread(g) ? `Spread: ${fmtSpread(g)}` : null,
    g.total ? `O/U ${g.total}` : null,
    g.divisional ? "Division game" : null,
  ].filter(Boolean);

  return `
  <div class="game-hero">
    ${heroTeam(away, "Away", g.awayQb, final ? g.awayScore : null)}
    <div class="hero-mid">
      <div class="hero-at">@</div>
      ${info.map(i => `<div class="hero-info">${escapeHtml(i)}</div>`).join("")}
      ${line.length ? `<div class="hero-line">${escapeHtml(line.join(" · "))}</div>` : ""}
    </div>
    ${heroTeam(home, "Home", g.homeQb, final ? g.homeScore : null)}
  </div>`;
}

function heroTeam(t, side, qb, score) {
  return `
    <div class="hero-team">
      <div class="hero-side">${side}</div>
      <div class="hero-name">${escapeHtml(t.team)}</div>
      <div class="hero-rec">${fmtRecord(t)}${score !== null ? ` · <b>${score}</b>` : ""}</div>
      ${qb ? `<div class="hero-qb">QB: ${escapeHtml(qb)}</div>` : ""}
      <div class="hero-srs">SRS <span class="${t.record.srs > 0 ? "pos" : t.record.srs < 0 ? "neg" : ""}">${t.record.srs}</span></div>
    </div>`;
}

function roofLabel(r) {
  if (!r) return null;
  return { dome: "Dome", closed: "Roof closed", open: "Roof open", outdoors: "Outdoors" }[r] || r;
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
