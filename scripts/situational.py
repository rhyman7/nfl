"""Situational, big-play, pressure, pace and usage numbers for the matchup page and Weekly Edges.

Called by build_from_nflverse.py. Everything is regular season through the latest completed week.

Per team (data.json -> teams[name]):
    situ.off / situ.def   each value is {"v": number, "rank": 1..32}
        rzTd          red zone TD %: drives that ran a play inside the 20 and ended in a touchdown
        third         3rd down conversion %
        explosive     explosive play %: passes of 20+ yards and runs of 10+ yards, per pass/run play
        expPass       passes of 20+ yards, per pass play
        expRush       runs of 10+ yards, per run
        sackRate      sacks per dropback (offense: rank 1 = fewest taken; defense: rank 1 = most made)
        pressureRate  pressures per dropback (pro-football-reference via nflverse advstats; offense:
                      rank 1 = fewest allowed; defense: rank 1 = most made)
      Offense rank 1 = best for the offense; defense rank 1 = best for the defense.
    pace                  plays per game, seconds per play in neutral situations (one-score game,
                          quarters 1-3, between snaps of the same drive) and pass rate over expected
                          (early downs, neutral situations; nflverse's pass_oe). Rank 1 = most plays,
                          fastest, most pass-heavy.
    usage.targets         top 5 by targets: snap % (offense snaps, nflverse snap counts), target share,
                          air-yards share, and target share over the team's last three games
    usage.carries         top 3 by carries: carry share

Extra source files (nflverse-data releases). Downloaded into --src when missing:
    snap_counts_<season>.csv, advstats_week_pass_<season>.csv, advstats_week_def_<season>.csv
"""
import subprocess
from pathlib import Path

import numpy as np
import pandas as pd

RELEASES = "https://github.com/nflverse/nflverse-data/releases/download"
EXTRA = {
    "snap_counts_{s}.csv": "snap_counts",
    "advstats_week_pass_{s}.csv": "pfr_advstats",
    "advstats_week_def_{s}.csv": "pfr_advstats",
}
PBP_COLS = ["season_type", "week", "game_id", "play_id", "posteam", "defteam", "pass", "rush", "down",
            "yards_gained", "yardline_100", "fixed_drive", "fixed_drive_result", "third_down_converted",
            "third_down_failed", "qb_dropback", "sack", "score_differential", "qtr",
            "game_seconds_remaining", "pass_oe"]


def fetch_extras(src, season, notes):
    """Download the extra files into src when they aren't there yet. Returns {name: path or None}."""
    out = {}
    for pattern, tag in EXTRA.items():
        name = pattern.format(s=season)
        path = Path(src) / name
        if not path.exists():
            try:
                subprocess.run(["curl", "-sSLf", "--max-time", "300", "-o", str(path), f"{RELEASES}/{tag}/{name}"],
                               check=True, capture_output=True)
            except (subprocess.CalledProcessError, OSError) as e:
                path.unlink(missing_ok=True)
                notes.append(f"couldn't download {name} ({e}); its numbers are left out")
                path = None
        out[name] = path
    return out


def _rank(s, best_high):
    return s.rank(ascending=not best_high, method="min")


def _pack(series, best_high, teams, digits=1):
    r = _rank(series, best_high)
    out = {}
    for t in teams:
        v = series.get(t, np.nan)
        out[t] = None if pd.isna(v) else {"v": round(float(v), digits), "rank": int(r[t])}
    return out


def build(src, season, through_week, ps, teams, notes):
    """Returns {abbr: {"situ": {...}, "pace": {...}, "usage": {...}}}. Usage rows carry "pid" for the caller's game log."""
    src = Path(src)
    files = fetch_extras(src, season, notes)
    res = {t: {} for t in teams}

    # ---------- play-by-play: drives, downs, big plays, sacks, pace ----------
    pfile = src / f"play_by_play_{season}.csv.gz"
    if pfile.exists():
        p = pd.read_csv(pfile, low_memory=False, usecols=lambda c: c in PBP_COLS)
        p = p[(p.season_type == "REG") & (p.week <= through_week) & p.posteam.notna()]
        plays = p[(p["pass"] == 1) | (p["rush"] == 1)].copy()
        gp = plays.groupby("posteam").game_id.nunique()

        # red zone: every drive that ran a play inside the 20
        dr = p[p.fixed_drive.notna() & p.yardline_100.notna()].groupby(["game_id", "posteam", "defteam", "fixed_drive"]).agg(
            minyl=("yardline_100", "min"), res=("fixed_drive_result", "last")).reset_index()
        rz = dr[dr.minyl <= 20].assign(td=lambda x: (x.res == "Touchdown").astype(float))
        third = plays[plays.down == 3]

        def third_rate(col):
            g = third.groupby(col)
            c, f = g.third_down_converted.sum(), g.third_down_failed.sum()
            return c / (c + f) * 100

        plays["exp"] = np.where(plays["pass"] == 1, plays.yards_gained >= 20, plays.yards_gained >= 10).astype(float)
        pa, ru = plays[plays["pass"] == 1], plays[plays["rush"] == 1]
        db = p[p.qb_dropback == 1]

        # pressures (pro-football-reference counts, per dropback)
        pr_off = pr_def = None
        fp, fd = files.get(f"advstats_week_pass_{season}.csv"), files.get(f"advstats_week_def_{season}.csv")
        if fp and fd:
            ap = pd.read_csv(fp)
            ad = pd.read_csv(fd)
            ap = ap[(ap.game_type == "REG") & (ap.week <= through_week)]
            ad = ad[(ad.game_type == "REG") & (ad.week <= through_week)]
            pr_off = ap.groupby("team").times_pressured.sum() / db.groupby("posteam").size() * 100
            pr_def = ad.groupby("team").def_pressures.sum() / db.groupby("defteam").size() * 100

        off = {
            "rzTd": (rz.groupby("posteam").td.mean() * 100, True),
            "third": (third_rate("posteam"), True),
            "explosive": (plays.groupby("posteam").exp.mean() * 100, True),
            "expPass": (pa.groupby("posteam").exp.mean() * 100, True),
            "expRush": (ru.groupby("posteam").exp.mean() * 100, True),
            "sackRate": (db.groupby("posteam").sack.mean() * 100, False),
        }
        dfn = {
            "rzTd": (rz.groupby("defteam").td.mean() * 100, False),
            "third": (third_rate("defteam"), False),
            "explosive": (plays.groupby("defteam").exp.mean() * 100, False),
            "expPass": (pa.groupby("defteam").exp.mean() * 100, False),
            "expRush": (ru.groupby("defteam").exp.mean() * 100, False),
            "sackRate": (db.groupby("defteam").sack.mean() * 100, True),
        }
        if pr_off is not None:
            off["pressureRate"] = (pr_off, False)
            dfn["pressureRate"] = (pr_def, True)
        else:
            notes.append("no pressure counts this run; pressure rate left out")
        rz_trips = rz.groupby("posteam").size()
        po = {k: _pack(s, hi, teams) for k, (s, hi) in off.items()}
        pd_ = {k: _pack(s, hi, teams) for k, (s, hi) in dfn.items()}

        # pace: neutral situations, time between snaps within a drive
        neu = plays[(plays.score_differential.abs() <= 7) & (plays.qtr <= 3)].sort_values(["game_id", "play_id"])
        gap = neu.groupby(["game_id", "fixed_drive"]).game_seconds_remaining.diff(-1)
        spp = neu.assign(gap=gap)[(gap > 0) & (gap < 60)].groupby("posteam").gap.mean()
        proe = neu[neu.pass_oe.notna() & (neu.down <= 2)].groupby("posteam").pass_oe.mean()
        pace = {"ppg": (plays.groupby("posteam").size() / gp, True), "spp": (spp, False), "proe": (proe, True)}
        pk = {k: _pack(s, hi, teams) for k, (s, hi) in pace.items()}

        for t in teams:
            res[t]["situ"] = {"off": {k: v[t] for k, v in po.items()}, "def": {k: v[t] for k, v in pd_.items()},
                              "rzTrips": int(rz_trips.get(t, 0))}
            res[t]["pace"] = {k: v[t] for k, v in pk.items()}
    else:
        notes.append(f"no {pfile.name}; situational, big-play and pace numbers left out")

    # ---------- usage: target, air-yards and carry share from weekly player stats, snaps from snap counts ----------
    snaps = {}
    sf = files.get(f"snap_counts_{season}.csv")
    if sf:
        sc = pd.read_csv(sf)
        sc = sc[(sc.game_type == "REG") & (sc.week <= through_week)]
        snaps = sc.groupby(["team", "player"]).offense_pct.mean().to_dict()
    for t in teams:
        sub = ps[ps.team == t]
        if sub.empty:
            continue
        weeks = sorted(sub.week.unique())[-3:]
        tgt_all = sub.targets.fillna(0).sum()
        air_all = sub.receiving_air_yards.fillna(0).clip(lower=0).sum()
        tgt_l3 = sub[sub.week.isin(weeks)].targets.fillna(0).sum()
        car_all = sub.carries.fillna(0).sum()
        g = sub.groupby("player_id").agg(
            player=("player_display_name", "last"),
            pos=("position", lambda x: x.mode().iat[0] if x.notna().any() else ""),
            tgt=("targets", "sum"), air=("receiving_air_yards", lambda x: x.fillna(0).clip(lower=0).sum()),
            car=("carries", "sum"))
        l3 = sub[sub.week.isin(weeks)].groupby("player_id").targets.sum()
        rows = []
        for pid, r in g[g.tgt > 0].sort_values("tgt", ascending=False).head(5).iterrows():
            snap = snaps.get((t, r.player))
            rows.append({"pid": pid, "player": r.player, "pos": r.pos,
                         "snap": None if snap is None else int(round(snap * 100)),
                         "ts": round(r.tgt / tgt_all * 100, 1) if tgt_all else 0.0,
                         "as": round(r.air / air_all * 100, 1) if air_all else 0.0,
                         "ts3": round(l3.get(pid, 0) / tgt_l3 * 100, 1) if tgt_l3 else 0.0})
        carries = [{"pid": pid, "player": r.player, "cs": round(r.car / car_all * 100, 1)}
                   for pid, r in g[g.car > 0].sort_values("car", ascending=False).head(3).iterrows()] if car_all else []
        res[t]["usage"] = {"targets": rows, "carries": carries, "weeks": [int(w) for w in weeks]}
        # every player's shares, for the player tables (Weekly Edges reads them from there)
        res[t]["shares"] = {pid: {"ts": round(r.tgt / tgt_all * 100, 1) if tgt_all else 0.0,
                                  "ts3": round(l3.get(pid, 0) / tgt_l3 * 100, 1) if tgt_l3 else 0.0,
                                  "cs": round(r.car / car_all * 100, 1) if car_all else 0.0}
                            for pid, r in g.iterrows()}
    if not snaps:
        notes.append("no snap counts this run; snap % left out of the usage tables")
    return res
