# Conventions: NFL Matchup Dashboard

Read this before changing anything in this repo, and update it in the same pull request
whenever a convention changes. The sister site, [rhyman7/cfb](https://github.com/rhyman7/cfb),
has its own CONVENTIONS.md; the shared rules below are the same in both files.

- Live site: https://rhyman7.github.io/nfl/ (GitHub Pages, branch `main`, repo root)
- Landing page: https://rhyman7.github.io/ (the Weekly Gridiron Board, repo
  [rhyman7/rhyman7.github.io](https://github.com/rhyman7/rhyman7.github.io)), which links to both dashboards
- README.md describes every page and feature in detail; this file is the rules.

## How changes get made

- **Pull requests, merged after checks.** Don't push hand edits straight to `main`: `main`
  is the live site. Open a pull request (one topic per PR), run the checks in "Testing a
  change", and merge it yourself once they pass (squash, delete the branch). Then tell Ryan in
  a line or two what went live, with the PR link. If a check fails, don't merge: fix it, or
  leave the PR open and tell Ryan why.
- **After merging**, confirm the Pages deploy for the merge commit succeeded and load the
  live pages you changed. If something broke, revert right away (a revert PR, merged the same
  way) and tell Ryan.
- **Both dashboards.** Design and feature changes go to both this site and the CFB site
  unless Ryan says otherwise. Open and merge the matching PR in `rhyman7/cfb`, and don't call
  the change finished until both are merged.
- **Ask first** if anything is unclear or a change could break the live site.
- **Keep the landing page in step.** If the look or the page names change, check that
  rhyman7.github.io still matches (same graphite palette, Archivo, same page names and order).
- **Out of scope here:** prediction and betting-model work belongs in the separate CFB/NFL
  Model project, not in this repo.
- **What does commit straight to `main`** (automated, not hand edits): the weekly data
  update (`data/`), the **Build matchup PDFs** Action (`pdf/`), the **Fetch player props**
  Action (`data/props.json`) and the **Fetch injuries** Action (`data/injuries.json`). Everything else goes through a PR.
- **Task merges are pre-approved.** `.claude/settings.json` lets Claude sessions, including the
  scheduled tasks, merge their own PRs (`gh api -X PUT repos/rhyman7/nfl/pulls/<n>/merge`)
  without stopping to ask. The checks above still decide whether a PR is merged. Keep it in
  step with the same file in `rhyman7/cfb` and `rhyman7/fb-value-board`.

## Site structure

- Static site, no build step for the pages. Plain HTML, CSS and JavaScript; no framework,
  no bundler. Every page fetches `data/data.json` in the browser.
- Pages and their scripts:

  | Page | File | Page script | `data-page` |
  |---|---|---|---|
  | This Week's Matchups | `index.html` | `matchups.js` | `week` |
  | How to Read Matchups | `how-to-read.html` | `how-to-read.js` | `learn` |
  | EPA | `epa.html` | `epa.js` | `epa` |
  | EPA Explained | `epa-explained.html` | (inline script) | `epaexplained` |
  | Weekly Edges | `edges.html` | `edges.js` | `edges` |
  | Compare Any Two Teams | `compare.html` | `app.js` | `compare` |
  | Ratings Explained | `ratings.html` | (inline script) | `ratings` |
  | Matchup (one game) | `matchup.html?game=<nflverse id>` | `matchup.js` | `matchup` |
  | Print all | `print.html` | `print.js` | `printall` |

- Shared by every page: `style.css`, `teamcolors.js`, `common.js` (data loading, lines,
  forecast, game header, Head to Head, team cards, game logs, search, week strip) and
  `live.js` (ESPN live scores and current lines). `weather.js` loads on the
  pages that show a forecast. Put shared logic in `common.js`, not in a page script.
- Load order at the bottom of each page: `teamcolors.js`, `common.js`, `live.js`,
  `weather.js` (if used), then the page script.
- Each page has `<body data-page="…">`; scripts branch on it.
- Escape anything from data before putting it in HTML (`escapeHtml()` in `common.js`).
- Wrap `localStorage` reads and writes in try/catch; the page has to work without it.
- Live scores, current lines (ESPN) and forecasts (Open-Meteo) are fetched in the viewer's
  browser. If either service fails, the page leaves that part out or shows a short note and
  falls back to the weekly data. Never let a failed fetch break a page.

## Nav and page names

- Same nav on every page, in this order:
  This Week's Matchups | How to Read Matchups | **EPA | EPA Explained | Weekly Edges** |
  Compare Any Two Teams | Ratings Explained.
  EPA sits left of Weekly Edges and EPA Explained sits right of EPA.
- Each link has a full and a short label (`nav-full` / `nav-short`); the short ones show when
  the bar is narrow. The current page's link gets `class="active"`.
- The top bar's right side links to the other dashboard (`league-link`, `/cfb/`).
- The CFB site uses the same order and labels. Change both together.

## Look

- Graphite dark theme. Colors are CSS custom properties on `:root` in `style.css`
  (`--bg`, `--panel`, `--text`, …); use them rather than new hex values.
- Type is Archivo from Google Fonts, falling back to Helvetica Neue / Arial.
- Team colors carry the color. `TEAM_COLORS[abbr] = [primary, secondary]` in
  `teamcolors.js`; `teamColors()` / `teamVars()` derive the readable versions and set
  `--tc`, `--tc-on`, `--tc-on2`, `--tc-on2s`, `--tc-ink`, `--tc-inkp` on the team's element.
- **Team-color blocks** (the matchup header scorebug, the team stats header, the week
  board's abbreviation blocks) are the primary color lettered in the team's **secondary**
  color (`--tc-on2` for the big lettering, `--tc-on2s` for the small lines), **never black**.
  Don't swap in `--tc-on` or a fixed color. `tcLetter()` in `teamcolors.js` decides it:
  the listed secondary when it reads (3:1 for big lettering, 4.5:1 for small lines and
  grays); a lighter secondary that falls short moves lighter in the same hue; a black
  secondary, or one darker than the block that can't be read on it, becomes **white**.
- Team color as text, bars and dials on the dark page uses `--tc-ink`; in print, `--tc-inkp`.
- Pages must work from phone width up: nothing cut off or overlapping, wide tables scroll
  sideways inside their container.

## Matchup page

- Game header is a scorebug: each team's name on its block, the current line between them.
- **Info bar under the header:** kickoff, venue, then one slot (`heroWxText()` in `common.js`):
  - indoor games show only the roof, `Dome` (or `Roof closed` for a closed retractable roof);
  - outdoor games show the kickoff forecast itself (conditions, temperature, rain chance,
    wind), with **no "Forecast" label**.
- Head to Head: league rank bars, and the edge goes to the side that ranks **6 or more spots**
  better (out of 32). The side with the edge shows in its team color.
- Betting trends and the live box score are screen-only (left out of print).

## Printing and PDFs

- Anything screen-only gets `class="no-print"`; print rules live in `@media print` blocks in
  `style.css`.
- A matchup prints on **two landscape pages** (header, Head to Head and pace; then both team
  cards with usage). Print all (`print.html`) is every game this week, two pages each.
- The **EPA page always has both "Print all" and "Download PDF"** buttons (`epaPrintBtn`,
  `epaPdfBtn`). Print all is every game (one landscape page each), then the board and the
  ratings; Download PDF is `pdf/epa.pdf`.
- This Week's Matchups and each matchup page also have Download PDF.
- PDFs are built by `scripts/build_pdfs.py` (headless Chromium via Playwright) in the
  **Build matchup PDFs** Action, which runs when the data, the print layout or the EPA page
  change. `pdf/manifest.json` says which week the PDFs are for; the Download PDF links only
  show when it matches the week on the page. Don't hand-edit anything in `pdf/`. The same
  Action also builds the game packets below, and runs daily after the NFL value board updates.
- **Game packets** (`packets.js`, `scripts/build_report.py`, `scripts/build_packets.py`,
  `scripts/report.css`, `vendor/pdf-lib.min.js`). For every game, four parts back to back:
  the Weekly Matchup Report page, the printed matchup, the EPA matchup page and the value
  board's matchup. This Week's Matchups has **Print all packets / Save all packets** and
  **Print report / Save report**; each matchup page has **Print packet / Save packet**.
  `build_packets.py` writes `pdf/report.pdf`, `pdf/matchups.pdf`, `pdf/value-board.pdf` and
  `pdf/packets.json` (which pages of each file belong to each game); `packets.js` assembles the
  packet in the browser with pdf-lib, so each week's pages are stored once. The buttons only
  show when `packets.json` is for the week on the page. A part with no page for a game is left
  out of that packet and listed under `missing`.
- The **Weekly Matchup Report** is rule-based and built from `data/data.json` only (good and
  tough spots per game, Best Overall Matchups, Most Likely to Score a TD). `build_report.py`,
  `build_packets.py` and `report.css` are **identical in both repos**; change them in both.
- The value board's pages come from a checkout of rhyman7/fb-value-board (its Matchups view,
  Print all). If that board's print layout or game ids change, check the packets still map
  every game (the Action log prints the counts and any missing parts).
- If you change the print layout, check the page count still comes out right.

## Cache busting

- After changing a CSS or JS file, bump its `?v=` value on the `<link>` / `<script>` tag in
  **every** HTML page that loads it. The value is the change time, `YYYYMMDDHHMM`
  (e.g. `style.css?v=202610162300`). Only bump the files you changed.

## Data

- **Sources:** nflverse (player and team stats, schedule, play-by-play, snap
  counts, advanced stats) and **Pro-Football-Reference.com** (standings, SoS / SRS / OSRS / DSRS,
  and pressure rate via nflverse advanced stats). Lines: ESPN in the browser, nflverse in the
  weekly data.
- **Build:** `python scripts/build_from_nflverse.py --season 2026 --src <download folder>`
  writes `data/data.json`, `data/epa.json` (via `scripts/epa_ratings.py`),
  `data/season.json` and the `data/weeks/<N>.json` that changed. `scripts/situational.py`
  is called from it.
- **Injury tags** come only from ESPN: the **Fetch injuries** Action writes
  `data/injuries.json` from ESPN's per-team injury lists every 3 hours (`scripts/fetch_espn_injuries.py`);
  the pages fall back to ESPN's league feed in the browser when that file is missing or over
  2 days old. The data update never builds injury data (no nflverse injury file, no `inj` keys).
- **The data update is manual and done together**, not fully automated: a scheduled task
  runs daily at 10:50 AM ET (new-week update after the week's last game, otherwise a refresh
  of referees and lines). The README's "Weekly update (current)" section has the steps.
- **When a change touches the scheduled data-update tasks** (new or renamed pages, data
  files or keys), check that the tasks' wording still matches the site, and update them.
- `data.json` keys are read by the pages. Adding a key is fine; renaming or removing one
  needs the pages (and the scheduled task's checks) updated in the same PR.
- `lineOpen` is the line from the week's first build and is kept on reruns in the same week;
  run the build with the default `--out` so it can.
- Stadiums and roof types live in `STADIUMS` at the top of `build_from_nflverse.py`. A new or
  international venue needs a row there, or that game has no forecast.
- `scripts/epa_ratings.py` is **identical in both repos**. Change it in both, or not at all.
- The legacy Excel pipeline (`data/raw/*.xlsx`, `scripts/build_data.py`,
  `.github/workflows/rebuild-data.yml`) is no longer used. Leave it alone unless asked.

## Player props (NFL first)

- Player prop odds come from **The Odds API on the free plan** (500 credits a month), and are
  being tested on this site first; the CFB site gets them later.
- `scripts/fetch_props.py` runs in the **Fetch player props** Action (Thursdays 15:07 UTC, or
  by hand). The key is the `ODDS_API_KEY` repository secret; never put it in a file or a page.
- About 105 credits a week (7 markets × ~15 games); the script skips games already under way
  and stops before the last 25 credits. Check the credit math before adding markets, books
  or runs. `--dry-run` shows the cost without spending credits.
- DraftKings and FanDuel only. The lines aren't displayed on any page (no book buttons, no
  prop-line columns); `data/props.json` is only read for the header QB below. Without it for
  this week, pages fall back to nflverse.
- The matchup header's "X at QB" before kickoff is the team's player with the highest
  passing-yards prop (`heroQb()` in `common.js`); without QB props, and once the game is
  final, it is nflverse's starter.

## Testing a change

- Serve the repo root locally (`python -m http.server 8000`, or `start-local-server.bat` on
  Windows) and load the pages you touched at desktop and phone widths with no console errors.
  ESPN and Open-Meteo may be unreachable in a sandbox; the pages should still load.
- For anything touching print: print a matchup and the EPA page to PDF and check the page count.
- Do the same check on the CFB site for the matching change.
