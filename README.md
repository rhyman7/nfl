# NFL Matchup Dashboard

**Live site: https://rhyman7.github.io/nfl-dashboard/**

A static GitHub Pages site. Sister site: the [CFB Matchup Dashboard](https://github.com/rhyman7/cfb).

## Pages

- **This Week's Matchups** (`index.html`) — every game in the current week grouped by
  day, with kickoff time, records and points per game. Before kickoff, the favored
  team's row shows the spread (e.g. -3), the other team's row shows the O/U (PK on the
  first row for a pick'em), and a kickoff forecast sits under the teams ("Indoors" for
  domes and closed roofs). Once a game starts, the scores take that spot. Click a game
  to open it. "Print all" prints every matchup, one per landscape page.
- **Matchup** (`matchup.html?game=<id>`) — one game: kickoff, venue, roof, kickoff
  forecast, current spread and O/U, and projected QBs; a Head to Head table (each
  offense against the other defense, with league ranks and edges); then both teams'
  full stat cards. Prints on one landscape page.
- **Print all** (`print.html`) — opened by the "Print all" button: every game this week,
  one matchup per landscape page, and brings up the print dialog. Each team card still
  has its own Print button (one team per portrait page).
- **Team vs Team** (`compare.html`) — the original dashboard: pick any two teams
  and compare them side by side. Links like `compare.html?t1=Buffalo%20Bills&t2=Miami%20Dolphins` preselect teams.
- **Ratings Explained** (`ratings.html`) — plain-language definitions of SoS, OSRS,
  DSRS and SRS and how to use them in a matchup. Its example uses the current top-SRS
  team from `data/data.json`; the rest of the page is static.

All pages read one file, `data/data.json`, and share `common.js` and `style.css`.

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

and pushes the new `data/data.json`. Besides team and player stats, the file
holds `schedule` (the current week's games and byes), `season` and `throughWeek`.
Each schedule game also carries `espnId` (for live scores), `start` (kickoff in UTC),
`neutral`, and the venue's `city`, `lat`, `lon` and `indoor` flag.

## Legacy Excel pipeline

The sections below describe the original Excel-based workflow. It's no longer
used but still works if you ever want to go back to it.

## One-time setup

1. Create a new **public** GitHub repository (e.g. `nfl-dashboard`).
2. Push everything in this folder to that repo (see "Pushing to GitHub" below).
3. In the repo, go to **Settings → Pages**, and under "Build and deployment"
   set **Source: Deploy from a branch**, branch **main**, folder **/ (root)**.
   Save. GitHub gives you a URL like `https://<username>.github.io/nfl-dashboard/`
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
git remote add origin https://github.com/<your-username>/nfl-dashboard.git
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
