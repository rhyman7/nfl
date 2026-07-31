#!/usr/bin/env python3
"""
Builds data/data.json for the NFL matchup dashboard from the weekly Excel
workbook exports dropped in data/raw/.

Expected files in data/raw/ (same names each week — just overwrite them):
    NFL Records.xlsx        Tm, W, L, T, W-L%, PF, PA, PD, MoV, SoS, SRS, OSRS, DSRS
    NFL Offense.xlsx        Rk, Tm, G, PF, PassYds/G, PassTD/G, Int, RushYds/G, RushTD/Game
    NFL Offense Rush.xlsx   Rk, Tm, RushYds/G
    NFL Offense Pass.xlsx   Rk, Tm, PassYds/G
    NFL Defense.xlsx        Rk, Tm, G, PA, PassYds/G, PassTD/G, Int, RushYds/G, RushTD/Game
    NFL Defense Rush.xlsx   Rk, Tm, RUSHYds/G
    NFL Defense Pass.xlsx   Rk, Tm, PASSYds/G
    NFL Passing.xlsx        Rk, Player, Tm, Pos, G, ..., Yds, TD, Int, Y/G, ...
    NFL Rushing.xlsx        Rk, Player, Tm, G, ..., Yds, TD, Y/A, Y/G, A/G, ...
    NFL Receiving1.xlsx     Rk, Player, Tm, Pos, G, ..., Y/G, TD, Y/R, Rec, ...
    NFL DEF v RB.xlsx       Rk, Tm, G, Att, YDS, TD
    NFL v RecRB.xlsx        Rk, Tm, G, Tgt, Rec, Yds, TD
    NFL DEF v TE.xlsx       Rk, Tm, G, Tgt, Rec, YDS, TD
    NFL DEF v WR.xlsx       Rk, Tm, G, Tgt, Rec, Yds, TD

Run:  python3 scripts/build_data.py
Output: data/data.json
"""
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "data.json"


def read(name):
    path = RAW / name
    if not path.exists():
        sys.exit(f"Missing required file: {path}")
    return pd.read_excel(path)


def by_team(df, key="Tm"):
    return {row[key]: row for _, row in df.iterrows()}


def nz(val, default=0):
    try:
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return default
    except TypeError:
        pass
    return val


def round1(x):
    try:
        return round(float(x), 1)
    except (TypeError, ValueError):
        return x


def round2(x):
    try:
        return round(float(x), 2)
    except (TypeError, ValueError):
        return x


def top_players(df, team, sort_col, cols, n, tm_col="Tm"):
    sub = df[df[tm_col] == team].copy()
    sub = sub.sort_values(sort_col, ascending=False).head(n)
    out = []
    for _, r in sub.iterrows():
        row = {"player": r["Player"]}
        for label, col in cols:
            row[label] = round2(r[col])
        out.append(row)
    return out


def def_vs_position(df, team, yds_col, td_col):
    sub = df[df["Tm"] == team]
    if sub.empty:
        return None
    r = sub.iloc[0]
    return {"rank": int(r["Rk"]), "yds": round1(r[yds_col]), "td": round2(r[td_col])}


def gauge_range(series, pad_frac=0.05):
    lo = float(series.min())
    hi = float(series.max())
    span = hi - lo if hi > lo else hi
    pad = span * pad_frac
    return {"min": 0, "max": math.ceil((hi + pad) / 5) * 5}


def main():
    records = read("NFL Records.xlsx")
    offense = read("NFL Offense.xlsx")
    off_rush = read("NFL Offense Rush.xlsx")
    off_pass = read("NFL Offense Pass.xlsx")
    defense = read("NFL Defense.xlsx")
    def_rush = read("NFL Defense Rush.xlsx")
    def_pass = read("NFL Defense Pass.xlsx")
    passing = read("NFL Passing.xlsx")
    rushing = read("NFL Rushing.xlsx")
    receiving = read("NFL Receiving1.xlsx")
    def_v_rb = read("NFL DEF v RB.xlsx")
    def_v_recrb = read("NFL v RecRB.xlsx")
    def_v_te = read("NFL DEF v TE.xlsx")
    def_v_wr = read("NFL DEF v WR.xlsx")

    rec_by_team = by_team(records)
    off_by_team = by_team(offense)
    offr_by_team = by_team(off_rush)
    offp_by_team = by_team(off_pass)
    def_by_team = by_team(defense)
    defr_by_team = by_team(def_rush)
    defp_by_team = by_team(def_pass)

    teams_out = {}
    team_names = sorted(records["Tm"].dropna().unique().tolist())

    for team in team_names:
        rec = rec_by_team.get(team)
        off = off_by_team.get(team)
        offr = offr_by_team.get(team)
        offp = offp_by_team.get(team)
        de = def_by_team.get(team)
        defr = defr_by_team.get(team)
        defp = defp_by_team.get(team)

        if rec is None or off is None or de is None:
            print(f"WARNING: missing core data for {team}, skipping", file=sys.stderr)
            continue

        teams_out[team] = {
            "team": team,
            "record": {
                "w": int(rec["W"]), "l": int(rec["L"]), "t": int(nz(rec.get("T"), 0)),
                "sos": round1(rec["SoS"]), "srs": round1(rec["SRS"]),
                "osrs": round1(rec["OSRS"]), "dsrs": round1(rec["DSRS"]),
            },
            "offense": {
                "ppg": round1(off["PF"]),
                "rushYdsG": round1(off["RushYds/G"]),
                "rushYdsGRank": int(offr["Rk"]) if offr is not None else None,
                "rushTdG": round2(off["RushTD/Game"]),
                "passYdsG": round1(off["PassYds/G"]),
                "passYdsGRank": int(offp["Rk"]) if offp is not None else None,
                "passTdG": round2(off["PassTD/G"]),
                "int": round2(off["Int"]),
            },
            "defense": {
                "papg": round1(de["PA"]),
                "rushYdsG": round1(de["RushYds/G"]),
                "rushYdsGRank": int(defr["Rk"]) if defr is not None else None,
                "rushTdG": round2(de["RushTD/Game"]),
                "passYdsG": round1(de["PassYds/G"]),
                "passYdsGRank": int(defp["Rk"]) if defp is not None else None,
                "passTdG": round2(de["PassTD/G"]),
                "int": round2(de["Int"]),
            },
            "passing": top_players(
                passing, team, "Y/G",
                [("ydsG", "Y/G"), ("td", "TD"), ("int", "Int")], 6,
            ),
            "rushing": top_players(
                rushing, team, "Y/G",
                [("ydsG", "Y/G"), ("td", "TD"), ("ya", "Y/A"), ("ag", "A/G")], 6,
            ),
            "receiving": top_players(
                receiving, team, "Y/G",
                [("ydsG", "Y/G"), ("td", "TD"), ("yr", "Y/R"), ("rec", "Rec")], 7,
            ),
            "defVsPosition": {
                "rb": def_vs_position(def_v_rb, team, "YDS", "TD"),
                "recRb": def_vs_position(def_v_recrb, team, "Yds", "TD"),
                "te": def_vs_position(def_v_te, team, "YDS", "TD"),
                "wr": def_vs_position(def_v_wr, team, "Yds", "TD"),
            },
        }

    league_avg = {
        "rushTdG": round1(offense["RushTD/Game"].mean()),
        "passTdG": round1(offense["PassTD/G"].mean()),
        "ppg": round1(offense["PF"].mean()),
    }

    gauge_ranges = {
        "offRushYdsG": gauge_range(off_rush["RushYds/G"]),
        "offPassYdsG": gauge_range(off_pass["PassYds/G"]),
        "defRushYdsG": gauge_range(def_rush["RUSHYds/G"]),
        "defPassYdsG": gauge_range(def_pass["PASSYds/G"]),
    }

    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "teams": teams_out,
        "teamNames": sorted(teams_out.keys()),
        "leagueAverage": league_avg,
        "gaugeRanges": gauge_ranges,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2))
    print(f"Wrote {OUT} ({len(teams_out)} teams)")


if __name__ == "__main__":
    main()
