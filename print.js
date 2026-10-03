// Print all: every game this week, one matchup per landscape page.
init();

async function init() {
  const wrap = document.getElementById("printAll");
  const status = document.getElementById("printStatus");
  try {
    await loadData();
  } catch (err) {
    loadError(wrap);
    status.textContent = "";
    return;
  }

  // ?game=<id> prints just that game (used for the per-game PDFs)
  const only = new URLSearchParams(location.search).get("game");
  const games = scheduleGames().filter(g => DATA.teams[g.away] && DATA.teams[g.home])
    .filter(g => !only || g.id === only)
    .slice().sort((a, b) => gameStart(a) - gameStart(b));
  document.title = `Week ${DATA.schedule.week} matchups (${games.length}) · NFL Matchups`;
  if (!games.length) {
    status.textContent = "No games to print.";
    return;
  }

  wrap.innerHTML = games.map(g => {
    const p = renderMatchupParts(g);
    return `<section class="print-matchup">
      <div class="matchup-header m-head">${p.head}</div>
      <div class="m-edges">${p.edges}</div>
      <div class="m-cards">${p.cards}</div>
    </section>`;
  }).join("");
  // per-team Print buttons don't belong on this page; ids only make sense once per page
  wrap.querySelectorAll(".print-btn-single").forEach(b => b.remove());
  wrap.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));

  const n = games.length;
  status.textContent = `${n} matchup${n === 1 ? "" : "s"} ready, ${n} landscape page${n === 1 ? "" : "s"}`;
  const btn = document.getElementById("printAllBtn");
  btn.disabled = false;
  btn.addEventListener("click", () => window.print());
  showPdfLink(document.getElementById("pdfAllBtn"), only);
  // open the print dialog automatically once everything has laid out
  if (new URLSearchParams(location.search).get("auto") !== "0") {
    requestAnimationFrame(() => setTimeout(() => window.print(), 400));
  }
}
