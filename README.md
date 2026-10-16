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
  prints every matchup, two landscape pages each.
- **Matchup** (`matchup.html?game=<id>`) — one game: kickoff, venue, roof, kickoff
  forecast, current spread and O/U; a Head to Head table (each
  offense against the other defense, with league ranks and edges); then both teams'
  full stat cards. Prints on two landscape pages.
- **Print all** (`print.html`) — opened by the "Print all" button: every game this week,
  two landscape pages per matchup, and brings up the print dialog. Each team card still
  has its own Print button (one team per portrait page).
- **Download PDF** — "Download PDF" on This Week's Matchups (every game) and "Download PDF" on
  each matchup page (that game). The PDFs are the print layout rendered by headless
  Chrome, so they come out the same whatever browser or printer you use.
  `scripts/build_pdfs.py` writes `pdf/matchups.pdf`, `pdf/games/<game id>.pdf`,
  `pdf/epa.pdf` (the EPA page's Print all) and `pdf/manifest.json`; the **Build matchup PDFs** workflow reruns it whenever
  `data/data.json` or the print layout changes. The links only show when the PDFs are
  for the week on the page. `print.html?game=<id>` prints a single game.
- **EPA** (`epa.html`, `epa.js`) — opponent-adjusted EPA, linked left of Weekly Edges.
  Pick a game for Head to Head panels (adjusted EPA / play, pass and rush EPA, early-down
  pass EPA, success rate, with the same rank bars as the matchup page) and both teams'
  cards (raw vs. adjusted rank, QB EPA / dropback and CPOE, pace, neutral pass rate and
  regression flags such as turnover margin or one-score record). Below that: the EPA
  line and total against the current market for every game, a sortable 32-team ratings
  table, and a walk-forward check of how the ratings have done against closing lines.
  **Print all** prints every game (one landscape page each), then the board and the
  ratings; **Download PDF** is the same as `pdf/epa.pdf`. The ratings are
  `data/epa.json`, which `scripts/build_from_nflverse.py` writes next to `data.json`
  using `scripts/epa_ratings.py` (garbage time dropped at 10–90% win probability, a ridge
  regression on offense, defense and home field, projections pulled toward a pick'em);
  the page works out each game's projection from those ratings and the current line.
- **EPA Explained** (`epa-explained.html`) — linked right of EPA: what expected points and EPA
  are, why EPA beats yards and points, what "adjusted" means here, how to read every part of the
  EPA page, a routine for any game and the limits. Its example uses the current #1 team in net
  EPA from `data/epa.json`; the rest of the page is static.
- **Weekly Edges** (`edges.html`) — a game board for the week (current spread and O/U,
  implied team totals, line move since the week's first update, net EPA edge, referee
  and his over/under record) and prop matchup tables by position (QB pass yds, RB rush
  yds, WR/TE/RB rec yds) listing players whose opponent allows more than the league
  average at their position, with a matchup factor and an adjusted average.
- **Compare Any Two Teams** (`compare.html`) — the original dashboard: pick any two teams
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

**Week strip.** Just left of the search box, the top bar lists every week of the season
(1 to 18), right-aligned so the last week sits beside the search. The current week is
outlined and the week on screen is filled in. A finished week (`index.html?week=N`) shows
that week's games with final scores and each team's record going into it; a row opens
`matchup.html?game=<id>` with the game header and the full box score from ESPN, and
nothing else. A later week shows the schedule so far (kickoff, venue, records and any
line) as plain rows that don't open anything. The stats, Head to Head, Weekly Edges,
Print all and the PDFs stay on the current week. When the bar is too narrow for one row
the page names shorten, then the strip and search drop to a second row; on phones the
strip scrolls sideways. The weeks come from `data/season.json` and each week's games from
`data/weeks/<N>.json` (same shape as `schedule` in `data.json`, plus `awayRecord` /
`homeRecord`); the site decides what is past or upcoming from the week in `data.json`.

**Implied totals and line movement.** The matchup header, the week board and Weekly Edges
show implied team totals from the current spread and O/U. `lineOpen` on each schedule
game is the line from the week's first update; the build keeps it when it reruns for the
same week, and the pages show how far the line has moved since.

**EPA and success rate.** Head to Head adds EPA per play and success rate for each
offense and defense, from nflverse play-by-play (`eff` on each team).

**Yards per rush.** Head to Head also has a Rush Yds / Att row: rushing yards divided by
rush attempts for the offense, and the same for what the defense has allowed
(`rushYdsAtt` on each team's `offense` and `defense`, from nflverse team stats). For a
defense, lower is better.

**Referee.** When nflverse has the week's referee assignment, the matchup header and
Weekly Edges show the referee with his over/under record and points per game. These
are the only multi-season numbers on the site (`refereeSeasons`, e.g. 2023–2026),
because one season gives a crew just a few games.

**Betting Trends.** The matchup and Compare Any Two Teams pages show each team's record against
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

and pushes the new `data/data.json` along with `data/season.json` and `data/weeks/`,
which the same build rewrites for the week strip (only the weeks that changed; a week
whose scores are missing there is filled in from ESPN in the browser). Besides team and player stats, the file
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

### Situational, big-play, pressure, pace and usage numbers

Built by `scripts/situational.py` (called from `build_from_nflverse.py`) into each team's
`situ`, `pace` and `usage` keys, plus `ts`/`ts3` on receiving rows and `cs` on rushing rows.
It downloads `snap_counts_<season>.csv` and `advstats_week_pass/def_<season>.csv` from the
nflverse-data releases into `--src` when they aren't there.

- **Head to head** gains three groups under the existing rows: Finishing drives (red zone TD %,
  3rd down %), Big plays (explosive %, passes of 20+ yards, runs of 10+) and Pass rush vs
  protection (sack rate and Pro Football Reference pressure rate, per dropback). Same bars and the
  same 6-spot edge rule as the rows above.
- **Pace and tendency** under Head to head: plays per game, seconds per play in neutral
  situations, early-down pass rate over expected (nflverse `pass_oe`).
- **Usage** in each team card: snap %, target share, air-yards share, last three games' target
  share, and carry share.
- **Weekly Edges**: combined plays per game and pass rate over expected on the game board;
  Tgt % (with the last three games) on the receiving prop tables and Carry % on RB rush yds.

Printouts and the matchup PDFs include them: each matchup prints on two landscape pages (header, Head to Head and pace on the first; both team cards with usage on the second). Betting trends stay screen-only, as before.

### How to Read Matchups (`how-to-read.html`)

Linked left of EPA. Walks through every section of a matchup page (game header, Head to Head,
pace, betting trends, team card, player tables and game logs, usage, defense vs position) using
one game from this week, with numbered markers on the real components and notes written from
that game's numbers (`how-to-read.js`, built on the same render functions as the matchup page).
It opens on a random game; the Game picker and "Pick another game" switch games, and
`?game=<id>` opens a given one. Nothing extra to build: it reads `data/data.json`.

### Player prop lines (`data/props.json`)

The **Fetch player props** workflow (`.github/workflows/fetch-props.yml`, Thursdays at 15:07 UTC
and by hand from the Actions tab) runs `scripts/fetch_props.py`, which pulls seven markets for this
week's games from The Odds API at DraftKings and FanDuel only: pass yds, pass TD, rush yds, rush
attempts, rec yds, receptions and anytime TD. The key is the `ODDS_API_KEY` repository secret. Each
game costs 7 credits (about 105 a week, roughly 450 a month against the free plan's 500); games
already under way are skipped (and kept from the week's earlier pull), and the run stops before
using the last 25 credits. The file keeps each book's own line and prices per player (`dk`, `fd`),
and a `teams` map putting each player on one of the game's two teams from nflverse's weekly
rosters (team defenses left out). `python scripts/fetch_props.py --tag-teams` redoes that map
without the API key or any credits.

**Which book.** Every prop line on the site shows one sportsbook at a time. The DraftKings and
FanDuel buttons (`bookButtons()` in `common.js`, logos in `img/`) switch every line on the page and
the choice is remembered in the browser (`localStorage` `propBook`, DraftKings by default):

- Matchup pages (current week only): the buttons sit under the Run game / Pass game ranks on each
  team card. Passing gets the yards line next to Yds/G and the TD over/under next to TD; Rushing
  the yards line next to Yds/G and the attempts line after A/G; Receiving the yards line next to
  Yds/G and the receptions line after Rec/G, each with its over/under prices. With these columns
  Passing runs across the top and Rushing and Receiving sit side by side under it. An Anytime TD
  block (shortest price first, up to four columns of four) sits between the tables and Usage.
  "—" means that book has no line for the player (FanDuel posts no rush-attempt lines). Printing
  shows the chosen book without the buttons.
- Weekly Edges: the buttons sit above the prop tables; the Line column (with Adj minus the line)
  shows the chosen book.
- The game-log panel's prop check starts from the chosen book's line and shows its prices.

Without the file (or for another week) all of these fall back to how they worked before.
