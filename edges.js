// Weekly Edges: a game board (lines, implied totals, line moves, efficiency, referee)
// and position-by-position prop matchups for this week's games.
init();

async function init() {
  try {
    await loadData();
  } catch (err) {
    loadError(document.getElementById("gameBoard"));
    return;
  }
  const games = scheduleGames().filter(g => DATA.teams[g.away] && DATA.teams[g.home])
    .slice().sort((a, b) => gameStart(a) - gameStart(b));
  document.getElementById("edgesTitle").textContent = `Week ${DATA.schedule.week} Edges`;
  document.getElementById("edgesSub").textContent =
    `${games.length} games · stats through Week ${DATA.throughWeek}` + (DATA.injuryWeek ? ` · Week ${DATA.injuryWeek} injury report` : "");
  const draw = () => {
    document.getElementById("gameBoard").innerHTML = gameBoard(games);
    document.getElementById("propBoards").innerHTML = propBoards(games);
  };
  draw();
  if (typeof refreshLines === "function") refreshLines(games, () => { document.getElementById("gameBoard").innerHTML = gameBoard(games); });
}

function netEpa(t) {
  return t.eff ? t.eff.off.epa - t.eff.def.epa : null;
}

function gameBoard(games) {
  if (!games.length) return `<div class="empty-note">No games this week.</div>`;
  const rows = games.map(g => {
    const a = DATA.teams[g.away], h = DATA.teams[g.home];
    const ln = lineFor(g), it = impliedTotals(g);
    const spread = !ln ? "—" : ln.pick ? "PK" : ln.fav ? `${abbrOf(g[ln.fav])} -${ln.spread}` : "—";
    const move = lineMoveText(g).replace(/^Line move since \w+: /, "").replace(/^No line move since \w+$/, "—");
    const na = netEpa(a), nh = netEpa(h);
    let epa = "—";
    if (na != null && nh != null) {
      const better = na >= nh ? a : h, gap = Math.abs(na - nh);
      epa = `${escapeHtml(better.abbr)} +${gap.toFixed(2)}`;
    }
    const r = g.referee && DATA.referees ? DATA.referees[g.referee] : null;
    const ref = !g.referee ? `<span class="rk">TBA</span>`
      : r ? `${escapeHtml(g.referee)} <span class="rk">O ${r.o}-${r.u} · ${r.ppg} pts</span>` : escapeHtml(g.referee);
    const d = gameStart(g);
    const when = isFinal(g) ? "Final" : d.toLocaleDateString(undefined, { weekday: "short" }) + " " + (g.gametime ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "TBD");
    return `<tr>
      <td>${escapeHtml(when)}</td>
      <td><a class="board-link" href="matchup.html?game=${encodeURIComponent(g.id)}">${escapeHtml(a.abbr)} ${g.neutral ? "vs" : "@"} ${escapeHtml(h.abbr)}</a></td>
      <td class="num">${escapeHtml(spread)}</td>
      <td class="num">${ln && ln.total != null ? ln.total : "—"}</td>
      <td class="num">${it ? `${escapeHtml(a.abbr)} ${it.away} · ${escapeHtml(h.abbr)} ${it.home}` : "—"}</td>
      <td class="num move">${escapeHtml(move)}</td>
      <td class="num">${epa}</td>
      <td>${ref}</td>
    </tr>`;
  }).join("");
  return `<table>
    <thead><tr><th>Kickoff</th><th>Game</th><th class="num">Spread</th><th class="num">O/U</th><th class="num">Implied</th><th class="num">Line move</th><th class="num">Net EPA edge</th><th>Referee (${escapeHtml(DATA.refereeSeasons || "")})</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

// board: [title, player table, positions, min avg, opponent-allowed getter, label for what the defense allows]
const PROP_BOARDS = [
  ["QB · Pass Yds", "passing", ["QB"], 150, d => d.defense.passYdsG, d => d.defense.passYdsGRank, "pass yds/G"],
  ["RB · Rush Yds", "rushing", ["RB", "FB"], 30, d => d.defVsPosition.rb.yds, d => d.defVsPosition.rb.rank, "RB rush yds/G"],
  ["WR · Rec Yds", "receiving", ["WR"], 30, d => d.defVsPosition.wr.yds, d => d.defVsPosition.wr.rank, "WR rec yds/G"],
  ["TE · Rec Yds", "receiving", ["TE"], 20, d => d.defVsPosition.te.yds, d => d.defVsPosition.te.rank, "TE rec yds/G"],
  ["RB · Rec Yds", "receiving", ["RB", "FB"], 15, d => d.defVsPosition.recRb.yds, d => d.defVsPosition.recRb.rank, "RB rec yds/G"],
];

function propBoards(games) {
  const opp = {};  // team name -> { opp team, at }
  for (const g of games) {
    opp[g.away] = { t: DATA.teams[g.home], at: !g.neutral };
    opp[g.home] = { t: DATA.teams[g.away], at: false };
  }
  const teams = Object.values(DATA.teams);
  return PROP_BOARDS.map(([title, table, positions, minAvg, allowed, allowedRank, what]) => {
    const lg = teams.reduce((a, t) => a + allowed(t), 0) / teams.length;
    const rows = [];
    for (const t of teams) {
      const o = opp[t.team];
      if (!o || isFinalFor(t.team, games)) continue;
      for (const r of t[table] || []) {
        if (!positions.includes((r.pos || "").toUpperCase()) || r.ydsG < minAvg || (r.inj && r.inj.s === "O")) continue;
        const f = lg ? allowed(o.t) / lg : 1;
        if (f <= 1) continue;
        rows.push({ r, t, o, f, adj: r.ydsG * f, kind: table });
      }
    }
    rows.sort((x, y) => y.adj - x.adj);
    const body = rows.slice(0, 10).map(({ r, t, o, f, adj, kind }) => `<tr>
      <td><button type="button" class="plink" data-log="${escapeHtml(r.log)}" data-kind="${kind}" data-pos="${escapeHtml(r.pos || "")}" data-name="${escapeHtml(r.player)}">${escapeHtml(r.player)}</button>${injTag(r.inj)}</td>
      <td>${escapeHtml(t.abbr)} ${o.at ? "@" : "vs"} ${escapeHtml(o.t.abbr)}</td>
      <td class="num">${r.ydsG}</td>
      <td class="num">${allowed(o.t)} <span class="rk">#${allowedRank(o.t)}</span></td>
      <td class="num"><span class="tag W">+${Math.round((f - 1) * 100)}%</span></td>
      <td class="num"><b>${adj.toFixed(1)}</b></td>
    </tr>`).join("");
    return `<div class="table-block">
      <h4>${escapeHtml(title)}</h4>
      ${body ? `<table><thead><tr><th>Player</th><th>Game</th><th class="num">Avg</th><th class="num" title="${escapeHtml("Opponent allows " + what + "; rank out of 32, #1 = fewest")}">Opp allows</th><th class="num">Matchup</th><th class="num">Adj</th></tr></thead><tbody>${body}</tbody></table>`
        : `<div class="empty-note">No favorable matchups this week.</div>`}
      <p class="bet-note">League average allowed: ${lg.toFixed(1)} ${escapeHtml(what)}.</p>
    </div>`;
  }).join("");
}

function isFinalFor(teamName, games) {
  const g = games.find(x => x.away === teamName || x.home === teamName);
  return g ? isFinal(g) : false;
}
