// One game: header (with live score, forecast and current line), live box score,
// Head to Head, then both full team cards.
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
  if (!g || !DATA.teams[g.away] || !DATA.teams[g.home]) {
    gameHeader.innerHTML = `<div class="empty-note">That game isn't on this week's schedule anymore. <a href="index.html">See this week's matchups</a> or <a href="compare.html">compare any two teams</a>.</div>`;
    return;
  }

  const away = DATA.teams[g.away], home = DATA.teams[g.home];
  document.title = `${away.abbr} ${g.neutral ? "vs" : "@"} ${home.abbr} · NFL Matchup Dashboard`;

  const parts = renderMatchupParts(g);
  gameHeader.innerHTML = parts.head;
  document.getElementById("edges").innerHTML = parts.edges;
  document.getElementById("teamCards").innerHTML = parts.cards;

  if (typeof startLiveMatchup === "function") startLiveMatchup(g);
  // Fill the forecast and the current line into the header in place (live.js may be updating it too).
  const refreshExtras = () => {
    const wx = document.getElementById("heroWx"), ln = document.getElementById("heroLine");
    if (wx) { const t = heroWxText(g); wx.textContent = t || ""; wx.hidden = !t; }
    if (ln) { const t = heroLineText(g); ln.textContent = t || ""; ln.hidden = !t; }
  };
  if (typeof refreshLines === "function") refreshLines([g], refreshExtras);
  if (typeof startWeather === "function") startWeather([g], refreshExtras);
}
