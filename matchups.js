// Landing page: every game in the current week, grouped by day.
const gameList = document.getElementById("gameList");
const weekTitle = document.getElementById("weekTitle");

init();

async function init() {
  try {
    await loadData();
  } catch (err) {
    loadError(gameList);
    return;
  }

  const sched = DATA.schedule;
  if (!sched || !sched.games || sched.games.length === 0) {
    gameList.innerHTML = `<div class="empty-note">This week's schedule shows up after the next weekly update. In the meantime, <a href="compare.html">compare any two teams</a>.</div>`;
    return;
  }

  weekTitle.textContent = `Week ${sched.week} Matchups`;

  const byDay = [];
  sched.games.forEach(g => {
    let group = byDay.find(d => d.day === g.gameday);
    if (!group) byDay.push(group = { day: g.gameday, games: [] });
    group.games.push(g);
  });

  gameList.innerHTML = byDay.map(d => `
    <section class="day-group">
      <h3 class="day-title">${fmtGameday(d.day)}</h3>
      <div class="game-grid">${d.games.map(gameCard).join("")}</div>
    </section>`).join("") + byeNote(sched.byes);
}

function gameCard(g) {
  const away = DATA.teams[g.away];
  const home = DATA.teams[g.home];
  const final = g.awayScore !== null && g.homeScore !== null;
  const spread = fmtSpread(g);
  const lineBits = [spread, g.total ? `O/U ${g.total}` : null].filter(Boolean).join(" · ");

  return `
  <a class="game-card" href="matchup.html?game=${encodeURIComponent(g.id)}">
    <div class="game-meta">
      <span>${final ? "Final" : fmtKickoff(g.gametime)}</span>
      ${g.divisional ? `<span class="tag">Division</span>` : ""}
    </div>
    ${teamRow(away, g.away, final ? g.awayScore : null, final && g.awayScore > g.homeScore)}
    ${teamRow(home, g.home, final ? g.homeScore : null, final && g.homeScore > g.awayScore, true)}
    <div class="game-foot">
      <span>${escapeHtml(lineBits || "Line not posted")}</span>
      <span class="game-venue">${escapeHtml(g.stadium || "")}</span>
    </div>
  </a>`;
}

function teamRow(t, name, score, won, isHome) {
  const rec = t ? fmtRecord(t) : "";
  const ppg = t ? `${t.offense.ppg} PPG · ${t.defense.papg} PA/G` : "";
  return `
    <div class="game-team${won ? " won" : ""}">
      <span class="gt-at">${isHome ? "@" : ""}</span>
      <div class="gt-main">
        <div class="gt-name"><b>${escapeHtml(name)}</b> <span class="gt-rec">${rec}</span></div>
        <div class="gt-ppg">${ppg}</div>
      </div>
      ${score !== null ? `<span class="gt-score">${score}</span>` : ""}
    </div>`;
}

function byeNote(byes) {
  if (!byes || byes.length === 0) return "";
  return `<p class="bye-note">On bye: ${byes.map(escapeHtml).join(", ")}</p>`;
}
