#!/usr/bin/env python3
"""Fetch this week's NFL player prop lines (DraftKings and FanDuel) from The Odds API into data/props.json.

Runs in GitHub Actions (.github/workflows/fetch-props.yml) with the key in the ODDS_API_KEY
repository secret; nothing else in the repo or on the site sees the key.

Cost: the events list is free; each game's odds cost one credit per market (two named
bookmakers count as one region). With the seven markets below that is 7 credits a game,
so a full week (~15 games) is about 105 credits. Games that have already kicked off are skipped, and the
run stops before a game would take the remaining credits below --keep (default 25).

Output (data/props.json):
{
  "fetchedAt": ISO time, "season", "week", "credits": {"used", "remaining", "lastCall"},
  "markets": {market key: label},
  "games": {nflverse game id: {"eventId", "commence", "players": {
      player name: {market key: {"line", "over", "under", "books", "best": {"over": [price, book], "under": [price, book]},
                                  "dk": {"line", "over", "under"}, "fd": {"line", "over", "under"}}}},
      "teams": {player name: team abbr}}}
}
"line" is the median line across the books; "over"/"under" are the median prices at that line;
"dk" and "fd" are each book's own line and prices (missing when that book has no line).
For the anytime-TD market there is no line: "line" is 0.5 and "over" is the Yes price.
"teams" puts each player on one of the game's two teams, from nflverse's weekly rosters (the API's
player props don't say); team defenses (D/ST) and anyone not found are left out.

Usage: ODDS_API_KEY=... python scripts/fetch_props.py [--keep 25] [--dry-run] [--game <nflverse id>]
       python scripts/fetch_props.py --tag-teams   (re-tag the teams in data/props.json; no key, no credits)
"""
import argparse
import csv
import io
import json
import re
import os
import statistics
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl"
MARKETS = {
    "player_pass_yds": "Pass Yds",
    "player_pass_tds": "Pass TD",
    "player_rush_yds": "Rush Yds",
    "player_reception_yds": "Rec Yds",
    "player_receptions": "Receptions",
    "player_anytime_td": "Anytime TD",
    "player_rush_attempts": "Rush Att",
}
BOOKS = {"draftkings": "dk", "fanduel": "fd"}
ROOT = Path(__file__).resolve().parent.parent
ROSTERS = "https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_{season}.csv"


def norm_name(n):
    """Same as normName() in common.js: lower case, no Jr./Sr./II-V, letters only."""
    n = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b\.?", "", str(n or "").lower())
    return re.sub(r"[^a-z]", "", n)


def load_rosters(season):
    """{normalized name: {team abbr, ...}} from each player's latest week on nflverse's rosters."""
    try:
        req = urllib.request.Request(ROSTERS.format(season=season), headers={"User-Agent": "rhyman7-nfl-dashboard"})
        with urllib.request.urlopen(req, timeout=120) as r:
            text = r.read().decode("utf-8")
    except Exception as e:  # rosters are a nice-to-have; the lines still work without them
        print(f"rosters unavailable: {e}")
        return {}
    latest = {}
    for row in csv.DictReader(io.StringIO(text)):
        key = row.get("gsis_id") or row.get("full_name")
        wk = int(row.get("week") or 0)
        if key not in latest or wk >= latest[key][0]:
            latest[key] = (wk, row)
    out = {}
    for _, row in latest.values():
        if not row.get("team"):
            continue
        for nm in {row.get("full_name"), f"{row.get('football_name') or row.get('first_name')} {row.get('last_name')}"}:
            if nm:
                out.setdefault(norm_name(nm), set()).add(row["team"])
        # fallback for nicknames (Hollywood Brown, Bam Knight): last name among skill players
        if row.get("position") in ("QB", "RB", "WR", "TE", "FB"):
            out.setdefault("~" + norm_name(row.get("last_name")), set()).add(row["team"])
            out.setdefault("~~" + norm_name(row.get("last_name")), []).append(row["team"])
    return out


def tag_teams(game_id, players, sched_by_id, abbr_of, rosters):
    g = sched_by_id.get(game_id)
    if not g:
        return {}
    pair = {abbr_of.get(g["away"]), abbr_of.get(g["home"])}
    out = {}
    for name in players:
        if re.search(r"\b(D/ST|Defense)$", name):
            continue
        hits = rosters.get(norm_name(name), set()) & pair
        if not hits:   # nickname: a last name only one skill player on the two teams has
            last = norm_name(name.split()[-1] if not re.search(r"\b(jr|sr|ii|iii|iv|v)\.?$", name.lower()) else name.split()[-2])
            if sum(1 for t in rosters.get("~~" + last, []) if t in pair) == 1:
                hits = rosters.get("~" + last, set()) & pair
        if len(hits) == 1:
            out[name] = hits.pop()
    return out


def get(path, key, **params):
    q = urllib.parse.urlencode({"apiKey": key, **params})
    req = urllib.request.Request(f"{API}{path}?{q}", headers={"User-Agent": "rhyman7-nfl-dashboard"})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = json.loads(r.read().decode("utf-8"))
        h = {k.lower(): v for k, v in r.headers.items()}
    credits = {"used": h.get("x-requests-used"), "remaining": h.get("x-requests-remaining"), "lastCall": h.get("x-requests-last")}
    return body, {k: (int(float(v)) if v not in (None, "") else None) for k, v in credits.items()}


def median(xs):
    return statistics.median(xs) if xs else None


def summarize(bookmakers):
    """{player: {market: {...}}} from one event's bookmakers."""
    raw = {}   # player -> market -> list of (book, line, side, price)
    for bm in bookmakers:
        for m in bm.get("markets", []):
            if m.get("key") not in MARKETS:
                continue
            for o in m.get("outcomes", []):
                player = o.get("description")
                if not player:
                    continue
                side = str(o.get("name", "")).lower()
                if m["key"] == "player_anytime_td":
                    side = "over" if side in ("yes", "over") else "under"
                    line = 0.5
                else:
                    line = o.get("point")
                if line is None or side not in ("over", "under"):
                    continue
                raw.setdefault(player, {}).setdefault(m["key"], []).append((bm.get("title") or bm.get("key"), float(line), side, int(o["price"]), bm.get("key")))
    out = {}
    for player, mk in raw.items():
        for key, rows in mk.items():
            line = median([r[1] for r in rows if r[2] == "over"] or [r[1] for r in rows])
            # snap to the nearest half point that a book actually offers
            offered = sorted({r[1] for r in rows}, key=lambda x: (abs(x - line), x))
            line = offered[0]
            at = [r for r in rows if r[1] == line]
            ov = [r for r in at if r[2] == "over"]
            un = [r for r in at if r[2] == "under"]
            best = {}
            if ov:
                b = max(ov, key=lambda r: r[3])
                best["over"] = [b[3], b[0]]
            if un:
                b = max(un, key=lambda r: r[3])
                best["under"] = [b[3], b[0]]
            out.setdefault(player, {})[key] = {
                "line": line,
                "over": round(median([r[3] for r in ov])) if ov else None,
                "under": round(median([r[3] for r in un])) if un else None,
                "books": len({r[0] for r in rows}),
                "best": best,
            }
            for bkey, short in BOOKS.items():
                mine = [r for r in rows if r[4] == bkey]
                if not mine:
                    continue
                bo = [r for r in mine if r[2] == "over"]
                bu = [r for r in mine if r[2] == "under"]
                bl = (bo or mine)[0][1]
                out[player][key][short] = {"line": bl, "over": bo[0][3] if bo else None,
                                           "under": next((r[3] for r in bu if r[1] == bl), None)}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep", type=int, default=25, help="credits to leave unused")
    ap.add_argument("--dry-run", action="store_true", help="list the games and the cost, fetch no odds")
    ap.add_argument("--game", default="", help="fetch only this nflverse game id")
    ap.add_argument("--tag-teams", action="store_true", help="only re-tag player teams in data/props.json")
    args = ap.parse_args()

    data = json.loads((ROOT / "data" / "data.json").read_text())
    sched_by_id = {g["id"]: g for g in data["schedule"]["games"]}
    abbr_of = {name: t["abbr"] for name, t in data["teams"].items()}
    out_path = ROOT / "data" / "props.json"

    if args.tag_teams:
        p = json.loads(out_path.read_text())
        rosters = load_rosters(p["season"])
        for gid, g in p["games"].items():
            g["teams"] = tag_teams(gid, g.get("players", {}), sched_by_id, abbr_of, rosters)
            print(f"{gid}: {len(g['teams'])} of {len(g.get('players', {}))} players tagged")
        out_path.write_text(json.dumps(p, separators=(",", ":")))
        return

    key = os.environ.get("ODDS_API_KEY", "").strip()
    if not key:
        sys.exit("ODDS_API_KEY isn't set (add it as a repository secret).")
    sched = {(g["away"], g["home"]): g for g in data["schedule"]["games"]}
    now = datetime.now(timezone.utc)

    events, credits = get("/events", key)
    todo = []
    for ev in events:
        g = sched.get((ev.get("away_team"), ev.get("home_team")))
        if not g or (args.game and g["id"] != args.game):
            continue
        start = datetime.fromisoformat(ev["commence_time"].replace("Z", "+00:00"))
        if start <= now:
            print(f"skip {g['id']}: already started")
            continue
        todo.append((g, ev))
    per_game = len(MARKETS)
    print(f"Week {data['schedule']['week']}: {len(todo)} of {len(sched)} games to fetch, about {per_game * len(todo)} credits; "
          f"{credits['remaining']} credits left before this run")
    if args.dry_run:
        return

    rosters = load_rosters(data["season"])
    prev = {}
    if out_path.exists():
        try:
            p = json.loads(out_path.read_text())
            if p.get("season") == data["season"] and p.get("week") == data["schedule"]["week"]:
                prev = p.get("games", {})   # keep games already fetched this week (e.g. the Thursday game after kickoff)
        except ValueError:
            pass
    games = dict(prev)
    fetched = 0
    for g, ev in todo:
        if credits["remaining"] is not None and credits["remaining"] - per_game < args.keep:
            print(f"stop: {credits['remaining']} credits left, keeping {args.keep}")
            break
        try:
            body, credits = get(f"/events/{ev['id']}/odds", key, bookmakers=",".join(BOOKS), markets=",".join(MARKETS), oddsFormat="american")
        except urllib.error.HTTPError as e:
            print(f"{g['id']}: HTTP {e.code} {e.read()[:200]!r}")
            if e.code in (401, 429):
                break
            continue
        players = summarize(body.get("bookmakers", []))
        games[g["id"]] = {"eventId": ev["id"], "commence": ev["commence_time"], "players": players,
                          "teams": tag_teams(g["id"], players, sched_by_id, abbr_of, rosters)}
        fetched += 1
        print(f"{g['id']}: {len(players)} players, {len(body.get('bookmakers', []))} books, cost {credits['lastCall']}, {credits['remaining']} left")

    out = {
        "fetchedAt": now.isoformat(timespec="seconds"),
        "season": data["season"],
        "week": data["schedule"]["week"],
        "credits": credits,
        "markets": MARKETS,
        "games": games,
    }
    out_path.write_text(json.dumps(out, separators=(",", ":")))
    print(f"Wrote data/props.json: {fetched} games fetched this run, {len(games)} in the file; "
          f"{credits['used']} credits used this month, {credits['remaining']} left")


if __name__ == "__main__":
    main()
