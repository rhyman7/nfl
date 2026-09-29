// Team vs Team page: pick any two teams and compare them side by side.
const team1Select = document.getElementById("team1Select");
const team2Select = document.getElementById("team2Select");
const teamCards = document.getElementById("teamCards");
const printBothBtn = document.getElementById("printBothBtn");

init();

async function init() {
  try {
    await loadData();
  } catch (err) {
    loadError(teamCards);
    return;
  }

  populateSelect(team1Select, DATA.teamNames);
  populateSelect(team2Select, DATA.teamNames);

  // A link like compare.html?t1=Buffalo%20Bills&t2=Miami%20Dolphins preselects teams.
  const params = new URLSearchParams(location.search);
  const pick = (param, key, fallback) => {
    const v = params.get(param) || safeGet(key);
    return v && DATA.teams[v] ? v : fallback;
  };
  team1Select.value = pick("t1", "nfl_team1", DATA.teamNames[0]);
  team2Select.value = pick("t2", "nfl_team2", DATA.teamNames[1]);

  team1Select.addEventListener("change", render);
  team2Select.addEventListener("change", render);
  printBothBtn.addEventListener("click", () => window.print());

  render();
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
}

function populateSelect(select, names) {
  select.innerHTML = names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
}

function render() {
  const t1 = team1Select.value;
  const t2 = team2Select.value;
  safeSet("nfl_team1", t1);
  safeSet("nfl_team2", t2);
  teamCards.innerHTML = [t1, t2].map(name => renderTeamCard(DATA.teams[name])).join("");
}
