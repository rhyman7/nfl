# Conventions: NFL Matchup Dashboard

Read this before changing anything in this repo, and update it in the same pull request
whenever a convention changes. The sister site, [rhyman7/cfb](https://github.com/rhyman7/cfb),
has its own CONVENTIONS.md; the shared rules below are the same in both files.

- Live site: https://rhyman7.github.io/nfl/ (GitHub Pages, branch `main`, repo root)
- Landing page: https://rhyman7.github.io/ (the Weekly Gridiron Board, repo
  [rhyman7/rhyman7.github.io](https://github.com/rhyman7/rhyman7.github.io)), which links to both dashboards
- README.md describes every page and feature in detail; this file is the rules.

## How changes get made

- **Pull requests only.** Never push or merge to `main` yourself: `main` is the live site.
  Open a pull request and wait for Ryan's approval. One topic per PR.
- **Both dashboards.** Design and feature changes go to both this site and the CFB site
  unless Ryan says otherwise. Open the matching PR in `rhyman7/cfb`, and don't call the
  change finished until both are done.
- **Ask first** if anything is unclear or a change could break the live site.
- **Keep the landing page in step.** If the look or the page names change, check that
  rhyman7.github.io still matches (same graphite palette, Archivo, same page names and order).
- **Out of scope here:** prediction and betting-model work belongs in the separate CFB/NFL
  Model project, not in this repo.
- **What does commit straight to `main`** (automated, not hand edits): the weekly data
  update (`data/`), the **Build matchup PDFs** Action (`pdf/`) and the **Fetch player props**
  Action (`data/props.json`). Everything else goes through a PR.

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
  forecast, game header, Head to Head, team cards, game logs, search, week strip, prop book
  buttons) and `live.js` (ESPN live scores and current lines). `weather.js` loads on the
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
  `--tc`, `--tc-on`, `--tc-on2`, `--tc-ink`, `--tc-inkp` on the team's element.
- **Team-color blocks** (the matchup header scorebug, the team stats header, the week
  board's abbreviation blocks) are the primary color lettered in the team's **secondary**
  color (`--tc-on2`), **never black**. Don't swap in `--tc-on` or a fixed color.
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
  show when it matches the week on the page. Don't hand-edit anything in `pdf/`.
- If you change the print layout, check the page count still comes out right.

## Cache busting

- After changing a CSS or JS file, bump its `?v=` value on the `<link>` / `<script>` tag in
  **every** HTML page that loads it. The value is the change time, `YYYYMMDDHHMM`
  (e.g. `style.css?v=202610162300`). Only bump the files you changed.

## Data

- **Sources:** nflverse (player and team stats, schedule, play-by-play, injuries, snap
  counts, advanced stats) and **Pro-Football-Reference.com** (standings, SoS / SRS / OSRS / DSRS,
  and pressure rate via nflverse advanced stats). Lines: ESPN in the browser, nflverse in the
  weekly data.
- **Build:** `python scripts/build_from_nflverse.py --season 2026 --src <download folder>`
  writes `data/data.json`, `data/epa.json` (via `scripts/epa_ratings.py`),
  `data/season.json` and the `data/weeks/<N>.json` that changed. `scripts/situational.py`
  is called from it.
- **The weekly update is manual and done together**, not fully automated: a scheduled task
  runs Wednesday morning, and a second run Friday around 5 PM ET picks up the final injury
  report, referees and line moves. The README's "Weekly update (current)" section has the steps.
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
- DraftKings and FanDuel only. The chosen book is remembered in `localStorage` `propBook`
  (DraftKings by default). Without `data/props.json` for this week, pages fall back to how
  they worked before props.

## Testing a change

- Serve the repo root locally (`python -m http.server 8000`, or `start-local-server.bat` on
  Windows) and load the pages you touched at desktop and phone widths with no console errors.
  ESPN and Open-Meteo may be unreachable in a sandbox; the pages should still load.
- For anything touching print: print a matchup and the EPA page to PDF and check the page count.
- Do the same check on the CFB site for the matching change.
