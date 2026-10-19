// One game: header (with live score, forecast and current line), live box score,
// Head to Head, then both full team cards. A game from a finished week (week strip)
// shows its header and box score only; the stats live on this week's matchups.
const gameHeader = document.getElementById("gameHeader");

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
  const mode = weekMode();
  if (mode !== "current") {
    const back = document.querySelector(".back-link");
    back.href = weekHref(VIEW_WEEK);
    back.textContent = `Week ${VIEW_WEEK} games`;
    document.querySelector(".bar-actions").hidden = true;   // printing is for this week's matchups
    document.body.classList.remove("mprint");
  }
  if (!g || !DATA.teams[g.away] || !DATA.teams[g.home]) {
    gameHeader.innerHTML = `<div class="empty-note">That game isn't on ${mode === "current" ? "this week's schedule anymore" : "the Week " + VIEW_WEEK + " schedule"}. <a href="index.html">See this week's matchups</a> or <a href="compare.html">compare any two teams</a>.</div>`;
    return;
  }

  const away = DATA.teams[g.away], home = DATA.teams[g.home];
  document.title = `${away.abbr} ${g.neutral ? "vs" : "@"} ${home.abbr}${mode === "current" ? "" : ", Week " + VIEW_WEEK} · NFL Matchups`;

  if (mode !== "current") {
    // another week: the game header, then the box score (finished) or a pointer back (not played yet)
    gameHeader.innerHTML = renderHero(g, away, home);
    document.getElementById("edges").innerHTML = mode === "past" ? ""
      : `<div class="empty-note">The full matchup opens when Week ${VIEW_WEEK} is the current week. <a href="compare.html?t1=${encodeURIComponent(g.away)}&t2=${encodeURIComponent(g.home)}">Compare these two teams now</a>.</div>`;
    if (mode === "past" && typeof startLiveMatchup === "function") startLiveMatchup(g);
    return;
  }

  showPdfLink(document.getElementById("pdfBtn"), g.id);
  const parts = renderMatchupParts(g);
  gameHeader.innerHTML = parts.head;
  document.getElementById("edges").innerHTML = parts.edges;
  document.getElementById("teamCards").innerHTML = parts.cards;

  if (typeof startLiveMatchup === "function") startLiveMatchup(g);
  // Fill the forecast and the current line into the header in place (live.js may be updating it too).
  const refreshExtras = () => refreshHero(g);
  if (typeof refreshLines === "function") refreshLines([g], refreshExtras);
  if (typeof startWeather === "function") startWeather([g], refreshExtras);
}
