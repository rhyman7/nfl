#!/usr/bin/env python3
"""
Builds data/data.json for the NFL Matchup Dashboard from nflverse data.

Inputs (downloaded each week into a working folder, not committed):
    stats_player_week_<season>.csv  github.com/nflverse/nflverse-data releases (stats_player)
    stats_team_week_<season>.csv    github.com/nflverse/nflverse-data releases (stats_team)
    games.csv                       raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv
    standings.json                  list of {Tm, W, L, T, SoS, SRS, OSRS, DSRS} from
                                    pro-football-reference.com/years/<season>/ (optional)

Usage:
    python scripts/build_from_nflverse.py --season 2026 --src <folder> [--out data/data.json]

Only the given season's regular-season games are used. Nothing from earlier
seasons is read or carried over.
"""
import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

TEAM_NAMES = {
    "ARI": "Arizona Cardinals", "ATL": "Atlanta Falcons", "BAL": "Baltimore Ravens",
    "BUF": "Buffalo Bills", "CAR": "Carolina Panthers", "CHI": "Chicago Bears",
    "CIN": "Cincinnati Bengals", "CLE": "Cleveland Browns", "DAL": "Dallas Cowboys",
    "DEN": "Denver Broncos", "DET": "Detroit Lions", "GB": "Green Bay Packers",
    "HOU": "Houston Texans", "IND": "Indianapolis Colts", "JAX": "Jacksonville Jaguars",
    "KC": "Kansas City Chiefs", "LA": "Los Angeles Rams", "LAC": "Los Angeles Chargers",
    "LV": "Las Vegas Raiders", "MIA": "Miami Dolphins", "MIN": "Minnesota Vikings",
    "NE": "New England Patriots", "NO": "New Orleans Saints", "NYG": "New York Giants",
    "NYJ": "New York Jets", "PHI": "Philadelphia Eagles", "PIT": "Pittsburgh Steelers",
    "SEA": "Seattle Seahawks", "SF": "San Francisco 49ers", "TB": "Tampa Bay Buccaneers",
    "TEN": "Tennessee Titans", "WAS": "Washington Commanders",
}


def r1(x):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else round(float(x), 1)


def r2(x):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else round(float(x), 2)


def rank(series, ascending):
    """Rank 1..32; ties share the lower number."""
    return series.rank(method="min", ascending=ascending).astype(int)


def gauge_range(series):
    lo, hi = float(series.min()), float(series.max())
    pad = (hi - lo) * 0.05
    return {"min": 0, "max": int(math.ceil((hi + pad) / 5) * 5)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--season", type=int, required=True)
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent.parent / "data" / "data.json"))
    args = ap.parse_args()
    src, season = Path(args.src), args.season

    games = pd.read_csv(src / "games.csv")
    games = games[(games.season == season) & (games.game_type == "REG")].copy()
    done = games.dropna(subset=["home_score", "away_score"])
    if done.empty:
        sys.exit("No completed regular-season games for this season yet.")
    # Weeks where every game is final count as completed.
    week_done = games.groupby("week").apply(lambda g: g.home_score.notna().all())
    completed_weeks = [int(w) for w, ok in week_done.items() if ok]
    through_week = max(completed_weeks) if completed_weeks else 0
    if through_week == 0:
        sys.exit("Week 1 isn't finished yet.")
    done = done[done.week <= through_week]

    ps = pd.read_csv(src / f"stats_player_week_{season}.csv")
    ts = pd.read_csv(src / f"stats_team_week_{season}.csv")
    ps = ps[(ps.season == season) & (ps.season_type == "REG") & (ps.week <= through_week)]
    ts = ts[(ts.season == season) & (ts.season_type == "REG") & (ts.week <= through_week)]

    # ---- points for / against per team (from game results) ----
    rows = []
    for _, g in done.iterrows():
        rows.append({"team": g.home_team, "pf": g.home_score, "pa": g.away_score, "res": np.sign(g.home_score - g.away_score)})
        rows.append({"team": g.away_team, "pf": g.away_score, "pa": g.home_score, "res": np.sign(g.away_score - g.home_score)})
    pts = pd.DataFrame(rows)
    rec = pts.groupby("team").agg(
        gp=("pf", "size"), pf=("pf", "sum"), pa=("pa", "sum"),
        w=("res", lambda s: int((s > 0).sum())), l=("res", lambda s: int((s < 0).sum())),
        t=("res", lambda s: int((s == 0).sum())),
    )

    # ---- offense / defense yardage per game ----
    ts = ts.copy()
    ts["pass_yds"] = ts["passing_yards"]
    off = ts.groupby("team").agg(
        gp=("week", "nunique"), rush_yds=("rushing_yards", "sum"), rush_td=("rushing_tds", "sum"),
        pass_yds=("pass_yds", "sum"), pass_td=("passing_tds", "sum"),
        int_thrown=("passing_interceptions", "sum"), int_made=("def_interceptions", "sum"),
    )
    allowed = ts.groupby("opponent_team").agg(
        rush_yds=("rushing_yards", "sum"), rush_td=("rushing_tds", "sum"),
        pass_yds=("pass_yds", "sum"), pass_td=("passing_tds", "sum"),
    )
    teams = sorted(off.index)
    if len(teams) != 32:
        sys.exit(f"Expected 32 teams in team stats, found {len(teams)}")

    gp = off["gp"]
    o = pd.DataFrame({
        "rushYdsG": off.rush_yds / gp, "rushTdG": off.rush_td / gp,
        "passYdsG": off.pass_yds / gp, "passTdG": off.pass_td / gp,
        "int": off.int_thrown / gp, "ppg": rec.pf / rec.gp,
    })
    d = pd.DataFrame({
        "rushYdsG": allowed.rush_yds / gp, "rushTdG": allowed.rush_td / gp,
        "passYdsG": allowed.pass_yds / gp, "passTdG": allowed.pass_td / gp,
        "int": off.int_made / gp, "papg": rec.pa / rec.gp,
    })
    o["rushRk"], o["passRk"] = rank(o.rushYdsG, False), rank(o.passYdsG, False)
    d["rushRk"], d["passRk"] = rank(d.rushYdsG, True), rank(d.passYdsG, True)

    # ---- defense vs position ----
    def vs_pos(positions, yds_col, td_col):
        sub = ps[ps.position.isin(positions)]
        agg = sub.groupby("opponent_team").agg(yds=(yds_col, "sum"), td=(td_col, "sum")).reindex(teams, fill_value=0)
        out = pd.DataFrame({"yds": agg.yds / gp, "td": agg.td / gp})
        out["rank"] = rank(out.yds, True)
        return out

    dvp = {
        "rb": vs_pos(["RB", "FB"], "rushing_yards", "rushing_tds"),
        "recRb": vs_pos(["RB", "FB"], "receiving_yards", "receiving_tds"),
        "te": vs_pos(["TE"], "receiving_yards", "receiving_tds"),
        "wr": vs_pos(["WR"], "receiving_yards", "receiving_tds"),
    }

    # ---- player tables ----
    def players(team, kind):
        sub = ps[ps.team == team]
        if kind == "passing":
            sub = sub[sub.attempts > 0]
            agg = sub.groupby("player_display_name").agg(g=("week", "nunique"), yds=("passing_yards", "sum"),
                                                        td=("passing_tds", "sum"), i=("passing_interceptions", "sum"))
            rows = [{"player": n, "ydsG": r1(a.yds / a.g), "td": r2(a.td / a.g), "int": r2(a.i / a.g)} for n, a in agg.iterrows()]
            n = 6
        elif kind == "rushing":
            sub = sub[sub.carries > 0]
            agg = sub.groupby("player_display_name").agg(g=("week", "nunique"), yds=("rushing_yards", "sum"),
                                                        td=("rushing_tds", "sum"), att=("carries", "sum"))
            rows = [{"player": n, "ydsG": r1(a.yds / a.g), "td": r2(a.td / a.g), "ya": r1(a.yds / a.att),
                     "ag": r1(a.att / a.g)} for n, a in agg.iterrows()]
            n = 6
        else:
            sub = sub[sub.targets > 0]
            agg = sub.groupby("player_display_name").agg(g=("week", "nunique"), yds=("receiving_yards", "sum"),
                                                        td=("receiving_tds", "sum"), rec=("receptions", "sum"))
            rows = [{"player": n, "ydsG": r1(a.yds / a.g), "td": r2(a.td / a.g),
                     "yr": r1(a.yds / a.rec) if a.rec else 0.0, "rec": r2(a.rec / a.g)} for n, a in agg.iterrows()]
            n = 7
        return sorted(rows, key=lambda r: r["ydsG"], reverse=True)[:n]

    # ---- standings / ratings from PFR (optional) ----
    ratings, notes = {}, []
    sfile = src / "standings.json"
    if sfile.exists():
        for row in json.loads(sfile.read_text()):
            ratings[row["Tm"]] = row
    for abbr in teams:
        name = TEAM_NAMES[abbr]
        s = ratings.get(name)
        if s is None:
            notes.append(f"no PFR ratings for {name}; set to 0.0")
            continue
        if (int(s["W"]), int(s["L"]), int(s.get("T", 0))) != (rec.w[abbr], rec.l[abbr], rec.t[abbr]):
            notes.append(f"PFR record for {name} ({s['W']}-{s['L']}) differs from game results; using game results")
        if abs(float(s["SRS"]) - (float(s["OSRS"]) + float(s["DSRS"]))) > 0.25:
            notes.append(f"PFR SRS for {name} isn't OSRS+DSRS; check it")

    def rating(name, key):
        s = ratings.get(name)
        return r1(s[key]) if s else 0.0

    teams_out = {}
    for abbr in teams:
        name = TEAM_NAMES[abbr]
        teams_out[name] = {
            "team": name,
            "abbr": abbr,
            "record": {"w": int(rec.w[abbr]), "l": int(rec.l[abbr]), "t": int(rec.t[abbr]),
                       "sos": rating(name, "SoS"), "srs": rating(name, "SRS"),
                       "osrs": rating(name, "OSRS"), "dsrs": rating(name, "DSRS")},
            "offense": {"ppg": r1(o.ppg[abbr]), "rushYdsG": r1(o.rushYdsG[abbr]), "rushYdsGRank": int(o.rushRk[abbr]),
                        "rushTdG": r2(o.rushTdG[abbr]), "passYdsG": r1(o.passYdsG[abbr]),
                        "passYdsGRank": int(o.passRk[abbr]), "passTdG": r2(o.passTdG[abbr]), "int": r2(o["int"][abbr])},
            "defense": {"papg": r1(d.papg[abbr]), "rushYdsG": r1(d.rushYdsG[abbr]), "rushYdsGRank": int(d.rushRk[abbr]),
                        "rushTdG": r2(d.rushTdG[abbr]), "passYdsG": r1(d.passYdsG[abbr]),
                        "passYdsGRank": int(d.passRk[abbr]), "passTdG": r2(d.passTdG[abbr]), "int": r2(d["int"][abbr])},
            "passing": players(abbr, "passing"),
            "rushing": players(abbr, "rushing"),
            "receiving": players(abbr, "receiving"),
            "defVsPosition": {k: {"rank": int(v["rank"][abbr]), "yds": r1(v.yds[abbr]), "td": r2(v.td[abbr])}
                              for k, v in dvp.items()},
        }

    # ---- this week's schedule: the first week that isn't finished ----
    remaining = [int(w) for w, ok in week_done.items() if not ok]
    sched_week = min(remaining) if remaining else through_week
    wk = games[games.week == sched_week].sort_values(["gameday", "gametime", "game_id"])

    def num(x):
        return None if pd.isna(x) else float(x)

    def txt(x):
        return None if pd.isna(x) else str(x)

    schedule_games = []
    for _, g in wk.iterrows():
        schedule_games.append({
            "id": g.game_id, "gameday": g.gameday, "weekday": g.weekday, "gametime": txt(g.gametime),
            "away": TEAM_NAMES[g.away_team], "home": TEAM_NAMES[g.home_team],
            "awayScore": None if pd.isna(g.away_score) else int(g.away_score),
            "homeScore": None if pd.isna(g.home_score) else int(g.home_score),
            "spread": num(g.spread_line),  # positive = home team favored by that many points
            "total": num(g.total_line), "stadium": txt(g.stadium), "roof": txt(g.roof),
            "divisional": bool(g.div_game) if not pd.isna(g.div_game) else False,
            "awayQb": txt(g.away_qb_name), "homeQb": txt(g.home_qb_name),
        })
    playing = {x for g in schedule_games for x in (g["away"], g["home"])}
    byes = sorted(n for n in teams_out if n not in playing)

    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "season": season,
        "throughWeek": through_week,
        "schedule": {"week": sched_week, "games": schedule_games, "byes": byes},
        "teams": teams_out,
        "teamNames": sorted(teams_out),
        "leagueAverage": {"rushTdG": r1(o.rushTdG.mean()), "passTdG": r1(o.passTdG.mean()), "ppg": r1(o.ppg.mean())},
        "gaugeRanges": {"offRushYdsG": gauge_range(o.rushYdsG), "offPassYdsG": gauge_range(o.passYdsG),
                        "defRushYdsG": gauge_range(d.rushYdsG), "defPassYdsG": gauge_range(d.passYdsG)},
    }
    Path(args.out).write_text(json.dumps(data, indent=2))
    print(f"Wrote {args.out}: season {season}, through Week {through_week}, schedule Week {sched_week} "
          f"({len(schedule_games)} games, {len(byes)} byes)")
    for n in notes:
        print("NOTE:", n)


if __name__ == "__main__":
    main()
