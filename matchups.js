// Landing page: every game in the current week, grouped by day, with live
// scores (live.js), the current line and the kickoff forecast (weather.js).
// index.html?week=N shows another week from the week strip: a finished week's final
// scores (each row opens that game's box score) or a later week's schedule (plain rows).
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
  const mode = weekMode();
  if (mode !== "current") {
    // Print all and the PDF are this week's matchups
    document.getElementById("printAllBtn").hidden = true;
    document.getElementById("weekTitle").textContent = `Week ${sched.week}`;
    document.title = `Week ${sched.week} · NFL Matchups`;
  }
  if (!games.length) {
    gameList.innerHTML = mode === "current"
      ? `<div class="empty-note">This week's schedule shows up after the next weekly update. In the meantime, <a href="compare.html">compare any two teams</a>.</div>`
      : `<div class="empty-note">Week ${sched.week} isn't available right now. <a href="index.html">See this week's matchups</a>.</div>`;
    updatePrintAll(0);
    return;
  }

  const count = `${games.length} game${games.length === 1 ? "" : "s"}`;
  document.getElementById("weekTitle").textContent = `Week ${sched.week}`;
  document.getElementById("weekSub").textContent =
    mode === "past" ? `${count}, final scores. Pick a game for its box score.`
    : mode === "upcoming" ? `${count} on the schedule. Full matchups open when Week ${sched.week} is the current week.`
    : `${count}. Team stats through Week ${DATA.throughWeek}. Pick a game for the full matchup.`;

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
    grp.exact = same;   // every game kicks off at the time in the label
    grp.label = `${grp.day}, ${fmtTime(same ? starts[0] : hour)}`;
  });

  gameList.innerHTML = `
    <div class="board-cols" aria-hidden="true"><span>Away</span><span></span><span>Home</span><span>Spread</span><span>Total</span><span>Implied score</span><span>Where</span></div>`
    + groups.map(grp => `
    <section class="day-group">
      <h2 class="day-label">${grp.live ? '<span class="live-dot"></span>' : ""}${escapeHtml(grp.label)}${grp.games.length > 1 ? ` <span class="day-count">${grp.games.length} games</span>` : ""}</h2>
      ${grp.games.map(g => gameRow(g, grp)).join("")}
    </section>`).join("") + byeNote(DATA.schedule.byes);
}

function updatePrintAll(n) {
  const btn = document.getElementById("printAllBtn");
  if (!btn) return;
  btn.disabled = !n;
  btn.textContent = `Print all ${n}`;
  if (!btn.dataset.wired) {
    btn.dataset.wired = "1";
    btn.addEventListener("click", () => window.open("print.html", "_blank"));
    showPdfLink(document.getElementById("pdfAllBtn"));
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

// One team in a board row: its block, name and record, and its score once the game is on.
function rowTeam(g, sideKey) {
  const name = g[sideKey];
  const t = DATA.teams[name];
  const otherKey = sideKey === "away" ? "home" : "away";
  const L = liveFor(g);
  let score = isFinal(g) ? g[sideKey + "Score"] : null, otherScore = isFinal(g) ? g[otherKey + "Score"] : null, done = isFinal(g);
  if (L && (L.state === "in" || L.state === "post") && L[sideKey]) {
    score = L[sideKey].score; otherScore = L[otherKey] ? L[otherKey].score : null; done = L.state === "post";
  }
  const lost = done && score != null && otherScore != null && score < otherScore;
  const poss = L && L.state === "in" && L.possession === sideKey ? `<span class="poss" title="Has the ball">●</span>` : "";
  // once there's a score the row has no room for the season averages
  // another week's row shows the record going into that week, and leaves this week's averages out
  const weekRec = weekMode() !== "current" ? g[sideKey + "Record"] : null;
  const sub = !t ? "" : weekRec != null ? weekRec : score != null || weekMode() !== "current" ? fmtRecord(t)
    : `${fmtRecord(t)}, ${t.offense.ppg} PPG, ${t.defense.papg} PA/G`;
  return `<div class="gr-team ${sideKey}${lost ? " lost" : ""}">
    ${t ? slabHtml(t.abbr, t.abbr) : ""}
    <div class="gr-tx"><div class="gr-name">${escapeHtml(name)}${poss}</div><div class="gr-sub">${escapeHtml(sub)}</div></div>
    ${score != null ? `<span class="gr-score">${score}</span>` : ""}
  </div>`;
}

// One game on the board: both teams, the current spread and total (with what they opened
// at when they have moved), implied team totals, and where it is played. Once the game
// starts, scores join the teams and the implied column shows the game's status.
function gameRow(g, grp) {
  const L = liveFor(g);
  const isLive = !!L && L.state === "in";
  const done = isFinal(g) || (!!L && L.state === "post");
  const started = isLive || done;
  const mode = weekMode();
  const ln = lineFor(g), it = impliedTotals(g), mv = started || mode !== "current" ? null : lineMove(g);
  const spread = spreadText(g) || "—";
  const total = ln && ln.total != null ? ln.total : "—";

  let status;
  if (isLive) {
    status = `<div class="gr-big"><span class="live-badge">Live</span> ${escapeHtml(L.detail || "")}</div>` +
      (L.downDistance ? `<div class="gr-sub game-sit">${escapeHtml(L.downDistance)}</div>` : "");
  } else if (done) {
    status = `<div class="gr-big">${escapeHtml((L && L.state === "post" && L.detail) || "Final")}</div>`;
  } else {
    status = it ? `<span class="imp-pre">Implied </span>${escapeHtml(abbrOf(g.away))} ${it.away}, ${escapeHtml(abbrOf(g.home))} ${it.home}` : "";
  }

  // second line under the stadium: kickoff time when the group's label doesn't give it,
  // the city, then the forecast (outdoor games, before kickoff) or "Indoors"
  const bits = [];
  if (!started && !(grp && grp.exact)) bits.push(kickoff(g));
  bits.push([g.city, g.neutral ? "neutral site" : null].filter(Boolean).join(", "));
  if (g.indoor === true) bits.push("Indoors");
  else if (!started && WX[g.id]) {
    const w = WX[g.id];
    bits.push([`${w.temp}°`, w.pop != null ? `${w.pop}% rain` : null, w.wind != null ? `${w.wind} mph wind` : null].filter(Boolean).join(", "));
  }
  if (g.divisional) bits.push("Division game");

  // a later week's games are just listed; this week's and finished ones open the game
  const open = mode === "upcoming" && !started ? `<div class="game-row upcoming">`
    : `<a class="game-row${isLive ? " live" : ""}${done ? " done" : ""}" href="matchup.html?game=${encodeURIComponent(g.id)}">`;
  return `${open}
    ${rowTeam(g, "away")}
    <div class="gr-at">${g.neutral ? "vs" : "at"}</div>
    ${rowTeam(g, "home")}
    <div class="gr-spread"><div class="gr-big">${escapeHtml(spread)}</div>${mv && mv.spread ? `<div class="gr-sub gr-move">opened ${escapeHtml(mv.spread)}</div>` : ""}</div>
    <div class="gr-total"><div class="gr-big"><span class="ou-pre">O/U </span>${total}</div>${mv && mv.total != null ? `<div class="gr-sub gr-move">opened ${mv.total}</div>` : ""}</div>
    <div class="gr-implied">${status}</div>
    <div class="gr-where"><div>${escapeHtml(g.stadium || "")}</div><div class="gr-sub">${escapeHtml(bits.filter(Boolean).join(". "))}</div></div>
  </${open.startsWith("<a") ? "a" : "div"}>`;
}

function byeNote(byes) {
  if (!byes || byes.length === 0) return "";
  return `<p class="bye-note">On bye: ${byes.map(escapeHtml).join(", ")}</p>`;
}
