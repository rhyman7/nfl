"""Simple Rating System (SRS, OSRS, DSRS, SoS) computed from final scores.

Same method Pro-Football-Reference describes for its ratings:
  SRS  = average margin of victory + SoS, where SoS = average SRS of the opponents played
  OSRS = points scored per game above league average + average DSRS of the opponents
  DSRS = points allowed per game below league average + average OSRS of the opponents
Solved by iterating until the ratings stop moving, then centered so the league averages 0.
The build uses these when standings.json (PFR) isn't in the download folder.
"""


def compute(games, iterations=1000, tol=1e-9):
    """games: list of (away, home, away_score, home_score) for completed games.

    Returns {team: {"srs", "osrs", "dsrs", "sos"}} (unrounded).
    """
    pf, pa, opps = {}, {}, {}
    for away, home, a_pts, h_pts in games:
        for team, opp, f, g in ((away, home, a_pts, h_pts), (home, away, h_pts, a_pts)):
            pf.setdefault(team, []).append(f)
            pa.setdefault(team, []).append(g)
            opps.setdefault(team, []).append(opp)
    teams = sorted(opps)
    if not teams:
        return {}
    n = {t: len(opps[t]) for t in teams}
    league = sum(sum(pf[t]) for t in teams) / sum(n.values())
    off = {t: sum(pf[t]) / n[t] - league for t in teams}   # points scored above average
    dfn = {t: league - sum(pa[t]) / n[t] for t in teams}   # points allowed below average

    o, d = dict(off), dict(dfn)
    for _ in range(iterations):
        no = {t: off[t] + sum(d[x] for x in opps[t]) / n[t] for t in teams}
        nd = {t: dfn[t] + sum(o[x] for x in opps[t]) / n[t] for t in teams}
        mo = sum(no.values()) / len(teams)
        md = sum(nd.values()) / len(teams)
        no = {t: v - mo for t, v in no.items()}
        nd = {t: v - md for t, v in nd.items()}
        delta = max(max(abs(no[t] - o[t]), abs(nd[t] - d[t])) for t in teams)
        o, d = no, nd
        if delta < tol:
            break

    srs = {t: o[t] + d[t] for t in teams}
    return {
        t: {
            "srs": srs[t],
            "osrs": o[t],
            "dsrs": d[t],
            "sos": sum(srs[x] for x in opps[t]) / n[t],
        }
        for t in teams
    }
