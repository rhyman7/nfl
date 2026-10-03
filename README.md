# NFL Matchup Dashboard

**Live site: https://rhyman7.github.io/nfl/**

A static GitHub Pages site. Sister site: the [CFB Matchup Dashboard](https://github.com/rhyman7/cfb).

## Pages

- **This Week's Matchups** (`index.html`) — a board with one row per game in the current
  week, grouped by kickoff time. Each row has both teams (a block in the team's color,
  record and points per game), the spread, the total, implied team totals and the venue,
  in fixed columns so the lines read straight down. A spread or total that has moved
  shows what it opened at underneath. The venue line carries the kickoff forecast
  ("Indoors" for domes and closed roofs). Once a game starts, scores join the teams and
  the implied column shows the game's status. Click a row to open the game. "Print all"
  prints every matchup, one per landscape page.
- **Matchup** (`matchup.html?game=<id>`) — one game: kickoff, venue, roof, kickoff
  forecast, current spread and O/U; a Head to Head table (each
  offense against the other defense, with league ranks and edges); then both teams'
  full stat cards. Prints on one landscape page.
- **Print all** (`print.html`) — opened by the "Print all" button: every game this week,
  one matchup per landscape page, and brings up the print dialog. Each team card still
  has its own Print button (one team per portrait page).
- **Download PDF** — "Download PDF" on This Week's Matchups (every game) and "Download PDF" on
  each matchup page (that game). The PDFs are the print layout rendered by headless
  Chrome, so they come out the same whatever browser or printer you use.
  `scripts/build_pdfs.py` writes `pdf/matchups.pdf`, `pdf/games/<game id>.pdf` and
  `pdf/manifest.json`; the **Build matchup PDFs** workflow reruns it whenever
  `data/data.json` or the print layout changes. The links only show when the PDFs are
  for the week on the page. `print.html?game=<id>` prints a single game.
- **Weekly Edges** (`edges.html`) — a game board for the week (current spread and O/U,
  implied team totals, line move since the week's first update, net EPA edge, referee
  and his over/under record) and prop matchup tables by position (QB pass yds, RB rush
  yds, WR/TE/RB rec yds) listing players whose opponent allows more than the league
  average at their position, with a matchup factor and an adjusted average.
- **Team vs Team** (`compare.html`) — the original dashboard: pick any two teams
  and compare them side by side. Links like `compare.html?t1=Buffalo%20Bills&t2=Miami%20Dolphins` preselect teams.
- **Ratings Explained** (`ratings.html`) — plain-language definitions of SoS, OSRS,
  DSRS and SRS and how to use them in a matchup. Its example uses the current top-SRS
  team from `data/data.json`; the rest of the page is static.

All pages read one file, `data/data.json`, and share `common.js`, `teamcolors.js` and
`style.css`.

**Look.** Graphite background, with team colors carrying the color: `teamcolors.js` holds
each team's primary and secondary color and derives readable versions for the dark page
and for print. The matchup header is a scorebug (each team's name on its color, lettered
in its secondary color, with the current line between them); the bar under it lists
kickoff, venue, and either the roof ("Dome") for indoor games or the kickoff forecast for
outdoor ones. Head to Head draws a bar for each side's league rank, and the side with the
edge shows in its team color. Type is Archivo, loaded from Google Fonts.

**Player game logs.** On every team card, each player name in the Passing, Rushing and
Receiving tables is clickable. Hovering (on a computer) shows a tooltip with that
player's week-by-week stats for the table, the opponent, and full-PPR fantasy points;
clicking or tapping opens a panel with the full game log (result, passing, rushing,
receiving, fumbles lost, fantasy points). The logs live in `gameLogs` in
`data/data.json`, keyed `ABBR|player_id`, and each player row carries a `log` key that
points to its entry. Fantasy points are nflverse's `fantasy_points_ppr`.

**Team games and box scores.** Team names in the matchup header and on every team card
are clickable. Hovering (on a computer) shows the team's games this season: week,
opponent, result, and the team's high passer, rusher and receiver by yards. Clicking or
tapping opens a panel with the same list; pick a game to see its box score (scoring by
quarter, team stats, every passer, rusher and receiver, scoring plays), which the
browser fetches from ESPN using the game's `espnId`. If ESPN can't be reached the panel
says so and links to the game on ESPN. The list is `games` on each team in
`data/data.json`.

**Prop check.** The game log panel has a prop tool: pick a stat (pass/rush/rec yards,
receptions, TDs, combos, fantasy points), type a line, and it shows how many games he
went over, the average, the last 3 results, each game marked O/U, and what next week's
opponent allows for that stat (from the defense and defense-vs-position numbers).
Each player row carries `pos` for this.

**Injury tags.** Player names carry a tag from the nflverse injury report for the
current week (O, D, Q, or DNP/LP from practice); hover it for the injury. The report
fills in Wednesday–Friday, which is why there's a Friday refresh.

**Player search.** The search box in the top bar finds any player in the team tables
and opens his game log and prop check.

**Implied totals and line movement.** The matchup header, the week board and Weekly Edges
show implied team totals from the current spread and O/U. `lineOpen` on each schedule
game is the line from the week's first update; the build keeps it when it reruns for the
same week, and the pages show how far the line has moved since.

**EPA and success rate.** Head to Head adds EPA per play and success rate for each
offense and defense, from nflverse play-by-play (`eff` on each team).

**Referee.** When nflverse has the week's referee assignment, the matchup header and
Weekly Edges show the referee with his over/under record and points per game. These
are the only multi-season numbers on the site (`refereeSeasons`, e.g. 2023–2026),
because one season gives a crew just a few games.

**Betting Trends.** The matchup and Team vs Team pages show each team's record against
the spread (overall, as favorite/underdog, home/away) and over/under record, plus a
game-by-game list, from nflverse's closing `spread_line` and `total_line`. The data is
`betting` on each team in `data/data.json`. It's left out of printouts.

**Live scores.** On game days the slate and matchup pages fetch live scores straight
from ESPN's public site API in the viewer's browser (`live.js`): the slate shows
scores, quarter/clock, possession and a "Live now" group; the matchup page adds a box
score (line score, team stats, player stats, scoring plays) under the game header. Both
refresh every 30 seconds while a game is live and do nothing before the pre-game window.
The box score is left out of the printout. The feed is unofficial, so if it fails the
pages fall back to the weekly data and show a short note.

**Lines and forecast.** On page load the slate and matchup pages ask ESPN's scoreboard
for each game's current spread and O/U; games without ESPN odds keep the weekly
nflverse line. The forecast comes from [Open-Meteo](https://open-meteo.com/) (free, no
key) in the viewer's browser (`weather.js`), using each stadium's coordinates from
`data/data.json`: temperature, chance of rain and wind for the hour nearest kickoff.
Forecasts only reach 16 days out, and if either service is down the page simply leaves
that part out.

Stadium locations and roof types live in `STADIUMS` at the top of
`scripts/build_from_nflverse.py` (keyed by nflverse `stadium_id`). If a new stadium or
international site shows up, add a row; until then that game just has no forecast.

After changing any CSS or JS file, bump the `?v=` number on the `<link>`/`<script>`
tags in every HTML page so browsers pick up the new version.

## Weekly update (current)

A Claude scheduled task runs every Wednesday morning during the season. It
downloads the current season's nflverse data, gets standings/SRS from
Pro-Football-Reference, runs:

```bash
python scripts/build_from_nflverse.py --season 2026 --src <download folder>
```

A second scheduled task reruns the same build Friday at about 5 PM ET to pick up the
final injury report, referee assignments and line moves. The download folder also needs
`play_by_play_2026.csv.gz` and `injuries_2026.csv` from the nflverse-data releases
(`pbp` and `injuries`); without them the build leaves EPA or injury tags out.

and pushes the new `data/data.json`. Besides team and player stats, the file
holds `schedule` (the current week's games and byes), `season` and `throughWeek`.
Each schedule game also carries `espnId` (for live scores), `start` (kickoff in UTC),
`neutral`, and the venue's `city`, `lat`, `lon` and `indoor` flag.

## Legacy Excel pipeline

The sections below describe the original Excel-based workflow. It's no longer
used but still works if you ever want to go back to it.

## One-time setup

1. Create a new **public** GitHub repository (e.g. `nfl`).
2. Push everything in this folder to that repo (see "Pushing to GitHub" below).
3. In the repo, go to **Settings → Pages**, and under "Build and deployment"
   set **Source: Deploy from a branch**, branch **main**, folder **/ (root)**.
   Save. GitHub gives you a URL like `https://<username>.github.io/nfl/`
   — that's your live site.

That's it. The site is now live and will re-deploy automatically any time
`data/data.json` changes.

## Weekly update

Every week, replace the 14 Excel files in `data/raw/` with your fresh
exports (same file names — just overwrite them) and push. A GitHub Action
(`.github/workflows/rebuild-data.yml`) automatically regenerates
`data/data.json` and commits it, which triggers Pages to redeploy. Usually
live within a minute or two.

The 14 expected files (case-sensitive names):

```
data/raw/NFL Records.xlsx
data/raw/NFL Offense.xlsx
data/raw/NFL Offense Rush.xlsx
data/raw/NFL Offense Pass.xlsx
data/raw/NFL Defense.xlsx
data/raw/NFL Defense Rush.xlsx
data/raw/NFL Defense Pass.xlsx
data/raw/NFL Passing.xlsx
data/raw/NFL Rushing.xlsx
data/raw/NFL Receiving1.xlsx
data/raw/NFL DEF v RB.xlsx
data/raw/NFL v RecRB.xlsx
data/raw/NFL DEF v TE.xlsx
data/raw/NFL DEF v WR.xlsx
```

You can update these either by:
- **GitHub web UI** (easiest): open the file in `data/raw/` on github.com,
  click the pencil/upload icon, and upload the new version. No git needed.
- **git**: drop the new files in `data/raw/` locally, then
  `git add data/raw && git commit -m "Week N update" && git push`.

### Running the build locally (optional)

If you want to preview changes before pushing:

```bash
pip install -r requirements.txt
python scripts/build_data.py
python -m http.server 8000
# open http://localhost:8000
```

## Pushing to GitHub for the first time

From inside this folder:

```bash
git init
git add .
git commit -m "Initial NFL dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/nfl.git
git push -u origin main
```

(Create the empty repo on github.com first, without a README, so there's
nothing to conflict with.)

## How the numbers are derived

- **Offense/Defense rank & gauges** — rank and per-game yards come straight
  from the `Offense/Defense Rush/Pass` rank tables (rank 1 = best).
- **SoS / SRS / OSRS / DSRS** — pulled directly from `NFL Records.xlsx`.
- **Player tables** — top 6 passers/rushers and top 7 receivers per team,
  sorted by yards/game.
- **Def vs position tables** — direct lookup of each team's own row in the
  `DEF v RB/TE/WR/RecRB` files (i.e., how that team's defense performs
  against the position, not an opponent-specific matchup).
- **League averages** — mean of Rush TD/G, Pass TD/G, and PF across all 32
  teams in `NFL Offense.xlsx`.

Note: the old Looker Studio report had a broken "Offense Pass Yds/G" gauge
(it showed a static, non-updating number). This site fixes that — the
offense column now has a real, working Pass Yds/G gauge and rank alongside
the Rush Yds/G one.
