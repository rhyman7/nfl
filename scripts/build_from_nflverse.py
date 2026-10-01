#!/usr/bin/env python3
"""
Builds data/data.json for the NFL Matchup Dashboard from nflverse data.

Inputs (downloaded each week into a working folder, not committed):
    stats_player_week_<season>.csv  github.com/nflverse/nflverse-data releases (stats_player)
    stats_team_week_<season>.csv    github.com/nflverse/nflverse-data releases (stats_team)
    games.csv                       raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv
    standings.json                  list of {Tm, W, L, T, SoS, SRS, OSRS, DSRS} from
                                    pro-football-reference.com/years/<season>/ (optional)
    play_by_play_<season>.csv.gz    github.com/nflverse/nflverse-data releases (pbp) -- EPA and
                                    success rate (optional; left out if missing)
    injuries_<season>.csv           github.com/nflverse/nflverse-data releases (injuries) -- injury
                                    tags (optional; left out if missing)

Usage:
    python scripts/build_from_nflverse.py --season 2026 --src <folder> [--out data/data.json]

Only the given season's regular-season games are used, with one exception: referee
tendencies (over/under record, points per game) use the given season plus the three
before it, because a single season gives each crew only a handful of games. The site
labels them that way. The Wednesday line for this week's games (lineOpen) is kept from
the file already at --out when it covers the same week, so line movement is measured
from the first update of the week.
"""
import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

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


# nflverse stadium_id -> (city, lat, lon, roof type). The site uses the location for the
# kickoff forecast (Open-Meteo) and the roof type when nflverse leaves `roof` blank for
# an upcoming game. "retractable" roofs count as indoors unless nflverse says "open".
# Add a row when a new stadium shows up; unknown stadiums just get no forecast.
STADIUMS = {
    "PHO00": ("Glendale, AZ", 33.528, -112.263, "retractable"),
    "ATL97": ("Atlanta, GA", 33.755, -84.401, "retractable"),
    "BAL00": ("Baltimore, MD", 39.278, -76.623, "outdoors"),
    "BUF00": ("Orchard Park, NY", 42.774, -78.787, "outdoors"),
    "BUF01": ("Orchard Park, NY", 42.774, -78.787, "outdoors"),
    "CAR00": ("Charlotte, NC", 35.226, -80.853, "outdoors"),
    "CHI98": ("Chicago, IL", 41.862, -87.617, "outdoors"),
    "CIN00": ("Cincinnati, OH", 39.095, -84.516, "outdoors"),
    "CLE00": ("Cleveland, OH", 41.506, -81.700, "outdoors"),
    "DAL00": ("Arlington, TX", 32.748, -97.093, "retractable"),
    "DEN00": ("Denver, CO", 39.744, -105.020, "outdoors"),
    "DET00": ("Detroit, MI", 42.340, -83.046, "dome"),
    "GNB00": ("Green Bay, WI", 44.501, -88.062, "outdoors"),
    "HOU00": ("Houston, TX", 29.685, -95.411, "retractable"),
    "IND00": ("Indianapolis, IN", 39.760, -86.164, "retractable"),
    "JAX00": ("Jacksonville, FL", 30.324, -81.637, "outdoors"),
    "KAN00": ("Kansas City, MO", 39.049, -94.484, "outdoors"),
    "LAX01": ("Inglewood, CA", 33.953, -118.339, "dome"),
    "VEG00": ("Las Vegas, NV", 36.091, -115.184, "dome"),
    "MIA00": ("Miami Gardens, FL", 25.958, -80.239, "outdoors"),
    "MIN01": ("Minneapolis, MN", 44.974, -93.258, "dome"),
    "BOS00": ("Foxborough, MA", 42.091, -71.264, "outdoors"),
    "NOR00": ("New Orleans, LA", 29.951, -90.081, "dome"),
    "NYC01": ("East Rutherford, NJ", 40.813, -74.074, "outdoors"),
    "PHI00": ("Philadelphia, PA", 39.901, -75.168, "outdoors"),
    "PIT00": ("Pittsburgh, PA", 40.447, -80.016, "outdoors"),
    "SEA00": ("Seattle, WA", 47.595, -122.332, "outdoors"),
    "SFO01": ("Santa Clara, CA", 37.403, -121.970, "outdoors"),
    "TAM00": ("Tampa, FL", 27.976, -82.503, "outdoors"),
    "NAS00": ("Nashville, TN", 36.166, -86.771, "outdoors"),
    "WAS00": ("Landover, MD", 38.908, -76.864, "outdoors"),
    # international and neutral sites (open-air unless noted)
    "LON00": ("London, England", 51.556, -0.280, "outdoors"),
    "LON02": ("London, England", 51.604, -0.066, "outdoors"),
    "MEL00": ("Melbourne, Australia", -37.820, 144.983, "outdoors"),
    "RIO00": ("Rio de Janeiro, Brazil", -22.912, -43.230, "outdoors"),
    "PAR00": ("Saint-Denis, France", 48.924, 2.360, "outdoors"),
    "MAD01": ("Madrid, Spain", 40.453, -3.688, "retractable"),
    "MUN01": ("Munich, Germany", 48.219, 11.625, "outdoors"),
    "FRA00": ("Frankfurt, Germany", 50.069, 8.646, "retractable"),
    "BER00": ("Berlin, Germany", 52.515, 13.239, "outdoors"),
    "MEX00": ("Mexico City, Mexico", 19.303, -99.150, "outdoors"),
    "SAO00": ("São Paulo, Brazil", -23.545, -46.474, "outdoors"),
    "DUB00": ("Dublin, Ireland", 53.361, -6.251, "outdoors"),
}


def schedule_extras(g):
    """ESPN id, UTC kickoff, neutral site and venue location for one games.csv row."""
    out = {"espnId": None if pd.isna(g.espn) else str(int(g.espn)),
           "start": None, "neutral": str(g.location) == "Neutral",
           "city": None, "lat": None, "lon": None, "indoor": None}
    if not pd.isna(g.gametime):
        et = datetime.strptime(f"{g.gameday} {g.gametime}", "%Y-%m-%d %H:%M").replace(tzinfo=ZoneInfo("America/New_York"))
        out["start"] = et.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    st = STADIUMS.get(None if pd.isna(g.stadium_id) else str(g.stadium_id))
    roof = None if pd.isna(g.roof) else str(g.roof)
    if st:
        out["city"], out["lat"], out["lon"] = st[0], st[1], st[2]
        kind = st[3]
        if kind == "dome":
            out["indoor"] = True
        elif kind == "outdoors":
            out["indoor"] = False
        else:  # retractable: closed unless nflverse says it's open
            out["indoor"] = roof != "open"
    elif roof:
        out["indoor"] = roof in ("dome", "closed")
    return out


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


def team_game_list(done, ps):
    """Each team's completed games in order: opponent, result, the ESPN id (for the box
    score the site fetches) and that team's top passer, rusher and receiver by yards.

    Returns {abbr: [{w, opp, at, res, espnId, pass, rush, rec}]}. pass = {n, yds, td, cmp,
    att}, rush = {n, yds, td, car}, rec = {n, yds, td, rec}; a leader is left out when the
    team has no player with an attempt, carry or catch in that game's stats."""
    def n0(x):
        return 0 if pd.isna(x) else int(x)

    def leader(rows, need, yds, td, extra):
        rows = rows[rows[need] > 0]
        if rows.empty:
            return None
        r = rows.sort_values([yds, td], ascending=False).iloc[0]
        return {"n": r.player_display_name, "yds": n0(r[yds]), "td": n0(r[td]),
                **{k: n0(r[col]) for k, col in extra.items()}}

    by_team_week = {k: v for k, v in ps.groupby(["team", "week"])}
    out = {}
    for _, g in done.sort_values(["week", "gameday", "game_id"]).iterrows():
        for side, other in (("home", "away"), ("away", "home")):
            team = g[f"{side}_team"]
            us, them = int(g[f"{side}_score"]), int(g[f"{other}_score"])
            res = "W" if us > them else "L" if us < them else "T"
            entry = {"w": int(g.week), "opp": g[f"{other}_team"],
                     "at": side == "away" and str(g.location) != "Neutral",
                     "res": f"{res} {us}-{them}",
                     "espnId": None if pd.isna(g.espn) else str(int(g.espn))}
            rows = by_team_week.get((team, int(g.week)))
            if rows is not None:
                for key, args in (
                    ("pass", ("attempts", "passing_yards", "passing_tds", {"cmp": "completions", "att": "attempts"})),
                    ("rush", ("carries", "rushing_yards", "rushing_tds", {"car": "carries"})),
                    ("rec", ("receptions", "receiving_yards", "receiving_tds", {"rec": "receptions"})),
                ):
                    top = leader(rows, *args)
                    if top:
                        entry[key] = top
            out.setdefault(team, []).append(entry)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--season", type=int, required=True)
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent.parent / "data" / "data.json"))
    args = ap.parse_args()
    src, season = Path(args.src), args.season

    all_games = pd.read_csv(src / "games.csv")
    games = all_games[(all_games.season == season) & (all_games.game_type == "REG")].copy()
    notes = []
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

    # ---- efficiency from play-by-play: EPA per play and success rate (pass and run plays) ----
    eff = {}
    pfile = src / f"play_by_play_{season}.csv.gz"
    if pfile.exists():
        pbp = pd.read_csv(pfile, low_memory=False,
                          usecols=["season_type", "week", "posteam", "defteam", "pass", "rush", "epa", "success"])
        pbp = pbp[(pbp.season_type == "REG") & (pbp.week <= through_week) & ((pbp["pass"] == 1) | (pbp["rush"] == 1))
                  & pbp.epa.notna() & pbp.posteam.notna()]

        def side(col):
            gb = pbp.groupby(col)
            out = pd.DataFrame({
                "epa": gb.epa.mean(), "sr": gb.success.mean() * 100, "plays": gb.size(),
                "passEpa": pbp[pbp["pass"] == 1].groupby(col).epa.mean(),
                "rushEpa": pbp[pbp["rush"] == 1].groupby(col).epa.mean(),
            })
            return out

        o_eff, d_eff = side("posteam"), side("defteam")
        o_eff["epaRank"], o_eff["srRank"] = rank(o_eff.epa, False), rank(o_eff.sr, False)
        d_eff["epaRank"], d_eff["srRank"] = rank(d_eff.epa, True), rank(d_eff.sr, True)
        r3 = lambda x: None if pd.isna(x) else round(float(x), 3)
        for t in o_eff.index:
            eff[t] = {k: {"epa": r3(df.epa[t]), "sr": r1(df.sr[t]), "passEpa": r3(df.passEpa[t]),
                          "rushEpa": r3(df.rushEpa[t]), "plays": int(df.plays[t]),
                          "epaRank": int(df.epaRank[t]), "srRank": int(df.srRank[t])}
                      for k, df in (("off", o_eff), ("def", d_eff))}
    else:
        notes.append(f"no {pfile.name}; EPA and success rate left out")

    # ---- injury report: latest report for the schedule week (or the latest before it) ----
    injuries, injury_week = {}, None
    ifile = src / f"injuries_{season}.csv"
    remaining_weeks = [int(w) for w, ok in week_done.items() if not ok]
    sched_week_guess = min(remaining_weeks) if remaining_weeks else through_week
    if ifile.exists():
        inj = pd.read_csv(ifile)
        inj = inj[(inj.season == season) & (inj.season_type == "REG") & (inj.week <= sched_week_guess)]
        if not inj.empty:
            injury_week = int(inj.week.max())
            REPORT = {"Out": "O", "Doubtful": "D", "Questionable": "Q"}
            for _, r in inj[inj.week == injury_week].iterrows():
                rep = None if pd.isna(r.report_status) else str(r.report_status)
                prac = "" if pd.isna(r.practice_status) else str(r.practice_status)
                tag = REPORT.get(rep) or ("DNP" if prac.startswith("Did Not") else "LP" if prac.startswith("Limited") else None)
                if not tag:
                    continue
                what = next((str(x) for x in (r.report_primary_injury, r.practice_primary_injury) if not pd.isna(x)), "")
                injuries[(r.team, r.gsis_id)] = {"s": tag, "note": " · ".join(x for x in (what, rep or prac) if x)}
    else:
        notes.append(f"no {ifile.name}; injury tags left out")

    # ---- referees: over/under record and scoring over this season and the three before ----
    ref_games = all_games[(all_games.season.between(season - 3, season)) & (all_games.game_type == "REG")
                          & all_games.referee.notna() & all_games.home_score.notna()].copy()
    ref_games["pts"] = ref_games.home_score + ref_games.away_score
    referees = {}
    for name, grp in ref_games.groupby("referee"):
        lined = grp[grp.total_line.notna()]
        referees[str(name)] = {
            "g": int(len(grp)), "ppg": r1(grp.pts.mean()),
            "o": int((lined.pts > lined.total_line).sum()), "u": int((lined.pts < lined.total_line).sum()),
            "p": int((lined.pts == lined.total_line).sum()),
            "homeWinPct": r1(100 * (grp.home_score > grp.away_score).mean()),
            "cur": int((grp.season == season).sum()),
        }

    # ---- betting trends: record against the spread and over/under, from nflverse closing lines ----
    # spread_line is positive when the home team is favored; a team's own line is negative when favored.
    def tally():
        return {"w": 0, "l": 0, "p": 0}

    bet = {t: {"ats": tally(), "fav": tally(), "dog": tally(), "home": tally(), "away": tally(),
               "ou": {"o": 0, "u": 0, "p": 0}, "games": []} for t in games.home_team.unique()}
    for _, g in done.sort_values(["week", "gameday"]).iterrows():
        if pd.isna(g.spread_line):
            continue
        for side, other in (("home", "away"), ("away", "home")):
            team = g[f"{side}_team"]
            us, them = int(g[f"{side}_score"]), int(g[f"{other}_score"])
            line = -float(g.spread_line) if side == "home" else float(g.spread_line)
            cover = us - them + line
            res = "W" if cover > 0 else "L" if cover < 0 else "P"
            b = bet[team]
            key = {"W": "w", "L": "l", "P": "p"}[res]
            b["ats"][key] += 1
            if line < 0:
                b["fav"][key] += 1
            elif line > 0:
                b["dog"][key] += 1
            if str(g.location) != "Neutral":
                b[side][key] += 1
            entry = {"w": int(g.week), "opp": g[f"{other}_team"], "at": side == "away" and str(g.location) != "Neutral",
                     "line": line, "score": f"{us}-{them}", "ats": res}
            if not pd.isna(g.total_line):
                pts = us + them
                ou = "O" if pts > g.total_line else "U" if pts < g.total_line else "P"
                b["ou"][ou.lower()] += 1
                entry.update({"total": float(g.total_line), "ou": ou})
            b["games"].append(entry)

    # ---- game results by (week, team): home/away and final score, for game logs ----
    results = {}
    for _, g in done.iterrows():
        for side, other in (("home", "away"), ("away", "home")):
            us, them = int(g[f"{side}_score"]), int(g[f"{other}_score"])
            res = "W" if us > them else "L" if us < them else "T"
            results[(int(g.week), g[f"{side}_team"])] = {
                "at": side == "away" and str(g.location) != "Neutral", "res": f"{res} {us}-{them}"}

    # ---- per-game logs for every player shown in a table (keyed "ABBR|player_id") ----
    game_logs = {}

    def n0(x):
        return 0 if pd.isna(x) else x

    def add_log(team, pid):
        key = f"{team}|{pid}"
        if key in game_logs:
            return key
        rows = ps[(ps.team == team) & (ps.player_id == pid)].sort_values("week")
        log = []
        for _, r in rows.iterrows():
            gr = results.get((int(r.week), team), {})
            fl = n0(r.sack_fumbles_lost) + n0(r.rushing_fumbles_lost) + n0(r.receiving_fumbles_lost)
            log.append({
                "w": int(r.week), "opp": r.opponent_team, "at": gr.get("at", False), "res": gr.get("res"),
                "cmp": int(n0(r.completions)), "att": int(n0(r.attempts)), "pYds": int(n0(r.passing_yards)),
                "pTd": int(n0(r.passing_tds)), "int": int(n0(r.passing_interceptions)),
                "car": int(n0(r.carries)), "rYds": int(n0(r.rushing_yards)), "rTd": int(n0(r.rushing_tds)),
                "tgt": int(n0(r.targets)), "rec": int(n0(r.receptions)), "recYds": int(n0(r.receiving_yards)),
                "recTd": int(n0(r.receiving_tds)), "fl": int(fl), "fp": r1(n0(r.fantasy_points_ppr)),
            })
        # stat fields that are 0 are left out to keep the file small; the site reads them as 0
        game_logs[key] = [{k: v for k, v in e.items() if v or k in ("w", "opp", "at", "fp")} for e in log]
        return key

    # ---- player tables ----
    def players(team, kind):
        sub = ps[ps.team == team]
        ids = sub.groupby("player_display_name").player_id.first()
        pos = sub.groupby("player_display_name").position.agg(lambda x: x.mode().iat[0] if x.notna().any() else "")
        if kind == "passing":
            sub = sub[sub.attempts > 0]
            agg = sub.groupby("player_display_name").agg(g=("week", "nunique"), yds=("passing_yards", "sum"),
                                                        td=("passing_tds", "sum"), i=("passing_interceptions", "sum"),
                                                        cmp=("completions", "sum"))
            rows = [{"player": n, "ydsG": r1(a.yds / a.g), "td": r2(a.td / a.g), "int": r2(a.i / a.g),
                     "cmp": r1(a.cmp / a.g)} for n, a in agg.iterrows()]
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
        top = sorted(rows, key=lambda r: r["ydsG"], reverse=True)[:n]
        for r in top:
            r["pos"] = pos[r["player"]]
            if (team, ids[r["player"]]) in injuries:
                r["inj"] = injuries[(team, ids[r["player"]])]
            r["log"] = add_log(team, ids[r["player"]])
        return top

    # ---- standings / ratings from PFR (optional) ----
    ratings = {}
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

    # ---- each team's games so far, with the game's top passer, rusher and receiver ----
    team_games = team_game_list(done, ps)

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
            "betting": bet.get(abbr),
            "eff": eff.get(abbr),
            "games": team_games.get(abbr, []),
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
            "referee": txt(g.referee), "awayRest": None if pd.isna(g.away_rest) else int(g.away_rest),
            "homeRest": None if pd.isna(g.home_rest) else int(g.home_rest),
            **schedule_extras(g),
        })
    # Line movement baseline: the line from this week's first update, kept across rebuilds of the same week.
    prev_open = {}
    try:
        prev = json.loads(Path(args.out).read_text())
        if prev.get("season") == season and prev.get("schedule", {}).get("week") == sched_week:
            prev_open = {x["id"]: x.get("lineOpen") for x in prev["schedule"]["games"] if x.get("lineOpen")}
    except (OSError, ValueError, KeyError):
        pass
    for x in schedule_games:
        x["lineOpen"] = prev_open.get(x["id"]) or {"spread": x["spread"], "total": x["total"],
                                                    "at": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    playing = {x for g in schedule_games for x in (g["away"], g["home"])}
    for g in schedule_games:
        if not g["city"]:
            notes.append(f"{g['id']}: stadium not in STADIUMS, so no forecast; add a row for it")
        if not g["espnId"]:
            notes.append(f"{g['id']}: no ESPN id in games.csv; live scores will match it by team")
    byes = sorted(n for n in teams_out if n not in playing)

    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "season": season,
        "throughWeek": through_week,
        "schedule": {"week": sched_week, "games": schedule_games, "byes": byes},
        "teams": teams_out,
        "teamNames": sorted(teams_out),
        "gameLogs": game_logs,
        "injuryWeek": injury_week,
        "referees": referees,
        "refereeSeasons": f"{season - 3}–{season}",
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
