# NFL Matchup Dashboard

A static site that shows a side-by-side offense/defense breakdown for any two
NFL teams — record, SRS/OSRS/DSRS, rush/pass yards-per-game gauges with
league rank, points per game, top skill-position players, and how each
team's defense performs against RBs, receiving-RBs, TEs, and WRs.

No backend, no scraping — it reads a single `data/data.json` file that's
generated from the same weekly Excel workbooks you've been using.

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
