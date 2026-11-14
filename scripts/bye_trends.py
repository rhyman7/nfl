"""
Coming Off a Bye: straight-up and against-the-spread records of teams playing their first game
after a bye week, for the Weekly Matchup Report's "Coming Off a Bye" page (scripts/build_report.py).

Called from build_from_nflverse.py with nflverse's games.csv (every season), it returns the
`byeTrends` key of data/data.json:

    since, recent, season       first season counted, first of the "last 10", the current season
    periods                     [{key, label}] for "cur" (this season), "recent", "all" (since `since`)
    splits                      {split: {period: {w, l, t, aw, al, ap}}}: straight-up W-L-T and ATS W-L-P
                                all (every post-bye team), rested (opponent not off a bye), both (both
                                teams off a bye), fav, dog, home, road, and fav_home, fav_road, dog_home,
                                dog_road; the fav/dog/home/road rows count only rested games, home/road
                                leave out neutral sites
    games                       this season's finished post-bye games: {w, team, opp, home, line, pf, pa, ats}
    thisWeek                    {week, teams: [{id, team, home, neutral, oppBye}]}: who is off a bye in `week`

"Off a bye" means the team's previous regular-season game was two or more weeks earlier in the
same season. Regular season only. A team's line is its own (negative = favored), from nflverse's
closing spread_line (positive = home favored). Games without a line or a final score don't count.
"""
import pandas as pd

SINCE = 2002   # the 32-team, one-bye-per-team era
RECENT = 10    # "last 10 seasons"


def _team_games(all_games):
    g = all_games[all_games.game_type == "REG"]
    sides = []
    for side, other in (("home", "away"), ("away", "home")):
        sides.append(pd.DataFrame({
            "season": g.season, "week": g.week, "game_id": g.game_id,
            "team": g[f"{side}_team"], "opp": g[f"{other}_team"],
            "pf": g[f"{side}_score"], "pa": g[f"{other}_score"],
            "line": -g.spread_line if side == "home" else g.spread_line,
            "home": side == "home", "neutral": g.location.astype(str) == "Neutral"}))
    t = pd.concat(sides, ignore_index=True).sort_values(["team", "season", "week"])
    t["off_bye"] = (t.week - t.groupby(["team", "season"]).week.shift()) >= 2
    opp = t[["game_id", "team", "off_bye"]].rename(columns={"team": "opp", "off_bye": "opp_bye"})
    return t.merge(opp, on=["game_id", "opp"], how="left").fillna({"opp_bye": False})


def _rec(df):
    m, a = df.pf - df.pa, df.pf - df.pa + df.line
    return {"w": int((m > 0).sum()), "l": int((m < 0).sum()), "t": int((m == 0).sum()),
            "aw": int((a > 0).sum()), "al": int((a < 0).sum()), "ap": int((a == 0).sum())}


def bye_trends(all_games, season, week):
    t = _team_games(all_games)
    t = t[t.season >= SINCE]
    upcoming = t[(t.season == season) & (t.week == week) & t.off_bye]
    done = t[t.off_bye & t.pf.notna() & t.pa.notna() & t.line.notna()]
    recent = season - RECENT
    periods = {"cur": done[done.season == season],
               "recent": done[(done.season >= recent) & (done.season < season)],
               "all": done[done.season < season]}

    def rested(d):
        return d[~d.opp_bye.astype(bool)]

    def site(d, home):
        d = d[~d.neutral]
        return d[d.home == home]

    cuts = {
        "all": lambda d: d,
        "rested": rested,
        "both": lambda d: d[d.opp_bye.astype(bool)],
        "fav": lambda d: rested(d)[rested(d).line < 0],
        "dog": lambda d: rested(d)[rested(d).line > 0],
        "home": lambda d: site(rested(d), True),
        "road": lambda d: site(rested(d), False),
    }
    for fd, sign in (("fav", -1), ("dog", 1)):
        for hr, home in (("home", True), ("road", False)):
            cuts[f"{fd}_{hr}"] = (lambda s, h: lambda d: (lambda x: x[x.line * s > 0])(site(rested(d), h)))(sign, home)

    cur = periods["cur"].sort_values(["week", "team"])
    return {
        "since": SINCE, "recent": recent, "season": season,
        "periods": [{"key": "cur", "label": str(season)},
                    {"key": "recent", "label": f"{recent}–{str(season - 1)[-2:]}"},
                    {"key": "all", "label": f"{SINCE}–{str(season - 1)[-2:]}"}],
        "splits": {k: {p: _rec(f(d)) for p, d in periods.items()} for k, f in cuts.items()},
        "games": [{"w": int(r.week), "team": r.team, "opp": r.opp, "home": bool(r.home) and not bool(r.neutral),
                   "neutral": bool(r.neutral), "line": float(r.line), "pf": int(r.pf), "pa": int(r.pa),
                   "ats": "W" if r.pf - r.pa + r.line > 0 else "L" if r.pf - r.pa + r.line < 0 else "P"}
                  for r in cur.itertuples()],
        "thisWeek": {"week": int(week), "teams": [
            {"id": r.game_id, "team": r.team, "home": bool(r.home) and not bool(r.neutral), "neutral": bool(r.neutral),
             "oppBye": bool(r.opp_bye)}
            for r in upcoming.sort_values("game_id").itertuples()]},
    }
