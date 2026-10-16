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
                                  "dk": {"line", "over", "under"}, "fd": {"line", "over", "under"}}}}}}
}
"line" is the median line across the books; "over"/"under" are the median prices at that line;
"dk" and "fd" are each book's own line and prices (missing when that book has no line).
For the anytime-TD market there is no line: "line" is 0.5 and "over" is the Yes price.

Usage: ODDS_API_KEY=... python scripts/fetch_props.py [--keep 25] [--dry-run] [--game <nflverse id>]
"""
import argparse
import json
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
    args = ap.parse_args()
    key = os.environ.get("ODDS_API_KEY", "").strip()
    if not key:
        sys.exit("ODDS_API_KEY isn't set (add it as a repository secret).")

    data = json.loads((ROOT / "data" / "data.json").read_text())
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

    out_path = ROOT / "data" / "props.json"
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
        games[g["id"]] = {"eventId": ev["id"], "commence": ev["commence_time"], "players": players}
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
