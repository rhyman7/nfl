// Landing page: every game in the current week, grouped by day, with live
// scores (live.js), the current line and the kickoff forecast (weather.js).
const gameList = document.getElementById("gameList");

init();

async function init() {
  try {
    await loadData();
  } catch (err) {
    loadError(gameList);
    return;
  }

  const sched = DATA.schedule;
  const games = (sched && sched.games) || [];
  if (!games.length) {
    gameList.innerHTML = `<div class="empty-note">This week's schedule shows up after the next weekly update. In the meantime, <a href="compare.html">compare any two teams</a>.</div>`;
    updatePrintAll(0);
    return;
  }

  document.getElementById("weekTitle").textContent = `Week ${sched.week} Matchups`;
  document.getElementById("weekSub").textContent =
    `${games.length} game${games.length === 1 ? "" : "s"} · team stats through Week ${DATA.throughWeek}` +
    " · tap a game for the full matchup";

  const rerender = () => renderWeek(games);
  rerender();
  updatePrintAll(games.length);
  if (typeof startLiveWeek === "function") startLiveWeek(games, rerender);
  if (typeof startWeather === "function") startWeather(games, rerender);
}

// Games are grouped by day and kickoff hour. A group whose games all start at the same
// time is labeled with that time (1:00 PM); one that mixes times within the hour
// (4:05 and 4:25) is labeled with the hour (4:00 PM).
function renderWeek(games) {
  // live games get their own group at the top
  const groups = [];
  const live = games.filter(g => (liveFor(g) || {}).state === "in");
  if (live.length) groups.push({ label: "Live now", live: true, games: live });
  const fmtTime = d => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  games.filter(g => !live.includes(g))
    .slice().sort((a, b) => gameStart(a) - gameStart(b))
    .forEach(g => {
      const d = gameStart(g);
      const day = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      const key = day + (g.gametime ? " " + d.getHours() : "");
      let grp = groups[groups.length - 1];
      if (!grp || grp.live || grp.key !== key) groups.push(grp = { key, day, timed: !!g.gametime, games: [] });
      grp.games.push(g);
    });
  groups.filter(grp => !grp.live).forEach(grp => {
    if (!grp.timed) { grp.label = grp.day; return; }
    const starts = grp.games.map(gameStart);
    const same = starts.every(s => s.getTime() === starts[0].getTime());
    const hour = new Date(starts[0]); hour.setMinutes(0, 0, 0);
    grp.label = `${grp.day} · ${fmtTime(same ? starts[0] : hour)}`;
  });

  gameList.innerHTML = groups.map(grp => `
    <section class="day-group">
      <h2 class="day-label${grp.live ? " live" : ""}">${grp.live ? '<span class="live-dot"></span>' : ""}${escapeHtml(grp.label)} <span class="day-count">${grp.games.length}</span></h2>
      <div class="game-grid">${grp.games.map(gameCard).join("")}</div>
    </section>`).join("") + byeNote(DATA.schedule.byes);
}

function updatePrintAll(n) {
  const btn = document.getElementById("printAllBtn");
  if (!btn) return;
  btn.disabled = !n;
  btn.textContent = `🖨 Print all (${n})`;
  if (!btn.dataset.wired) {
    btn.dataset.wired = "1";
    btn.addEventListener("click", () => window.open("print.html", "_blank"));
  }
}

function kickoff(g) {
  const L = liveFor(g);
  if (L && L.state === "in") return L.detail || "Live";
  if (L && L.state === "post") return L.detail || "Final";
  if (isFinal(g)) return "Final";
  if (!g.gametime) return "TBD";
  return gameStart(g).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function gameSide(g, sideKey) {
  const name = g[sideKey];
  const t = DATA.teams[name];
  const otherKey = sideKey === "away" ? "home" : "away";
  // Before kickoff: favored team shows the spread, the other team shows the O/U.
  const ln = lineFor(g);
  let lineTag = "";
  if (ln) {
    if (ln.pick && sideKey === "away") lineTag = `<span class="gs-srs gs-line" title="Spread">PK</span>`;
    else if (ln.fav === sideKey) lineTag = `<span class="gs-srs gs-line" title="Spread">-${ln.spread}</span>`;
    else if (ln.total != null) lineTag = `<span class="gs-srs gs-line" title="Over/under">O/U ${ln.total}</span>`;
  }
  const L = liveFor(g);
  const scoreKey = sideKey + "Score", otherScoreKey = otherKey + "Score";
  let score = isFinal(g) ? g[scoreKey] : null, otherScore = isFinal(g) ? g[otherScoreKey] : null, done = isFinal(g);
  if (L && (L.state === "in" || L.state === "post") && L[sideKey]) {
    score = L[sideKey].score; otherScore = L[otherKey] ? L[otherKey].score : null; done = L.state === "post";
  }
  const won = done && score != null && otherScore != null && score > otherScore;
  const poss = L && L.state === "in" && L.possession === sideKey ? `<span class="poss" title="Has the ball">●</span>` : "";
  const sub = t ? `${fmtRecord(t)} · ${t.offense.ppg} PPG · ${t.defense.papg} PA/G` : "";
  return `<div class="gs-row${won ? " won" : ""}">
    <span class="gs-name">${escapeHtml(name)}${poss}</span>
    <span class="gs-rec">${escapeHtml(sub)}</span>
    ${score != null ? `<span class="gs-score">${score}</span>` : lineTag}
  </div>`;
}

function gameCard(g) {
  const L = liveFor(g);
  const isLive = L && L.state === "in";
  const sit = isLive && L.downDistance ? `<div class="game-sit">${escapeHtml(L.downDistance)}</div>` : "";
  return `<a class="game-card${isLive ? " live" : ""}" href="matchup.html?game=${encodeURIComponent(g.id)}">
    <div class="game-meta">
      <span class="game-time">${isLive ? '<span class="live-badge">Live</span> ' : ""}${escapeHtml(kickoff(g))}</span>
      ${g.divisional ? `<span class="game-tv">Division</span>` : ""}
    </div>
    ${gameSide(g, "away")}
    <div class="gs-at">${g.neutral ? "vs" : "@"}</div>
    ${gameSide(g, "home")}
    ${sit}
    ${gameExtra(g, L)}
    <div class="game-venue">${escapeHtml([g.stadium, g.city].filter(Boolean).join(" · "))}${g.neutral ? " (neutral)" : ""}</div>
  </a>`;
}

// Kickoff forecast, shown until the game starts.
function gameExtra(g, L) {
  if (isFinal(g) || (L && (L.state === "in" || L.state === "post"))) return "";
  const w = WX[g.id];
  let wx = "";
  if (g.indoor === true) wx = `<span class="game-wx" title="Indoor stadium">🏟 Indoors</span>`;
  else if (w) {
    const bits = [`${w.temp}°`, w.pop != null ? `${w.pop}% rain` : null, w.wind != null ? `${w.wind} mph` : null].filter(Boolean);
    wx = `<span class="game-wx" title="${escapeHtml("Forecast at kickoff: " + w.text)}">${w.icon} ${escapeHtml(bits.join(" · "))}</span>`;
  }
  return wx ? `<div class="game-extra">${wx}</div>` : "";
}

function byeNote(byes) {
  if (!byes || byes.length === 0) return "";
  return `<p class="bye-note">On bye: ${byes.map(escapeHtml).join(", ")}</p>`;
}
