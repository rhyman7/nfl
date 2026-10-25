"""Write data/injuries.json: ESPN's current injury designations for every NFL team.

ESPN's league-wide injuries feed (site.api.espn.com/.../nfl/injuries, the one the pages used to
load in the browser) can go stale or come back with only a few teams, so this script reads
ESPN's per-team injury lists from its core API instead and keeps each player's latest entry.
It runs in the "Fetch injuries" Action (GitHub's runners can reach ESPN; the Claude workspace
can't), and the pages read the file it writes.

    python scripts/fetch_espn_injuries.py [--out data/injuries.json]

The output uses the same shape as ESPN's league feed, so common.js parses either one:
{ "generatedAt", "source", "teamCount", "injuries": [ { "displayName", "abbreviation",
  "injuries": [ { "status", "date", "athlete": { "displayName" }, "details": { "type" } } ] } ] }
Only players whose latest status is a designation the site shows (Out, Doubtful, Questionable,
Injured Reserve, PUP, Suspension) are kept. Standard library only.
"""
import argparse
import json
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl"
# ESPN team id -> (ESPN abbreviation, full name as the site writes it)
TEAMS = {
    1: ("ATL", "Atlanta Falcons"), 2: ("BUF", "Buffalo Bills"), 3: ("CHI", "Chicago Bears"),
    4: ("CIN", "Cincinnati Bengals"), 5: ("CLE", "Cleveland Browns"), 6: ("DAL", "Dallas Cowboys"),
    7: ("DEN", "Denver Broncos"), 8: ("DET", "Detroit Lions"), 9: ("GB", "Green Bay Packers"),
    10: ("TEN", "Tennessee Titans"), 11: ("IND", "Indianapolis Colts"), 12: ("KC", "Kansas City Chiefs"),
    13: ("LV", "Las Vegas Raiders"), 14: ("LAR", "Los Angeles Rams"), 15: ("MIA", "Miami Dolphins"),
    16: ("MIN", "Minnesota Vikings"), 17: ("NE", "New England Patriots"), 18: ("NO", "New Orleans Saints"),
    19: ("NYG", "New York Giants"), 20: ("NYJ", "New York Jets"), 21: ("PHI", "Philadelphia Eagles"),
    22: ("ARI", "Arizona Cardinals"), 23: ("PIT", "Pittsburgh Steelers"), 24: ("LAC", "Los Angeles Chargers"),
    25: ("SF", "San Francisco 49ers"), 26: ("SEA", "Seattle Seahawks"), 27: ("TB", "Tampa Bay Buccaneers"),
    28: ("WSH", "Washington Commanders"), 29: ("CAR", "Carolina Panthers"), 30: ("JAX", "Jacksonville Jaguars"),
    33: ("BAL", "Baltimore Ravens"), 34: ("HOU", "Houston Texans"),
}
SHOWN = {"out", "doubtful", "questionable", "injured reserve", "physically unable to perform", "pup",
         "suspension", "suspended"}


def get(url, tries=4):
    url = url.replace("http://", "https://", 1)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (nfl-dashboard injuries)"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001 - retry anything, report the last
            if i == tries - 1:
                raise RuntimeError(f"{url}: {e}") from e
            time.sleep(1.5 * (i + 1))


def team_refs(tid):
    refs, page = [], 1
    while True:
        d = get(f"{CORE}/teams/{tid}/injuries?limit=200&page={page}")
        refs += [it["$ref"] for it in d.get("items", []) if "$ref" in it]
        if page >= int(d.get("pageCount") or 1):
            return refs
        page += 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "data" / "injuries.json"))
    args = ap.parse_args()
    out = Path(args.out)

    pool = ThreadPoolExecutor(max_workers=16)
    refs = dict(zip(TEAMS, pool.map(team_refs, TEAMS)))
    flat = [(tid, ref) for tid, rs in refs.items() for ref in rs]
    items = list(pool.map(lambda x: get(x[1]), flat))

    latest = {}   # (team id, athlete ref) -> injury item with the latest date
    for (tid, _), it in zip(flat, items):
        aref = (it.get("athlete") or {}).get("$ref")
        if not aref:
            continue
        aref = aref.split("?")[0].replace("http://", "https://", 1)
        k = (tid, aref)
        if k not in latest or str(it.get("date") or "") > str(latest[k].get("date") or ""):
            latest[k] = it

    keep = {k: it for k, it in latest.items()
            if str(it.get("status") or (it.get("type") or {}).get("description") or "").strip().lower() in SHOWN}
    names = dict(zip(keep, pool.map(lambda k: get(k[1]).get("displayName", ""), keep)))

    groups = []
    for tid, (abbr, name) in TEAMS.items():
        rows = []
        for (t, aref), it in keep.items():
            if t != tid or not names.get((t, aref)):
                continue
            status = str(it.get("status") or (it.get("type") or {}).get("description") or "").strip()
            det = it.get("details") or {}
            rows.append({"status": status, "date": it.get("date"),
                         "athlete": {"displayName": names[(t, aref)]},
                         "details": {"type": det.get("type", "")} if isinstance(det.get("type"), str) else {}})
        rows.sort(key=lambda r: r["athlete"]["displayName"])
        groups.append({"displayName": name, "abbreviation": abbr, "injuries": rows})

    listed = sum(1 for tid in TEAMS if refs[tid])
    if listed < 28:
        sys.exit(f"Only {listed} of 32 teams returned an injury list from ESPN; not writing {out}")
    body = {"source": "ESPN injury report", "teamCount": listed, "injuries": groups}
    if out.exists():
        try:
            old = json.loads(out.read_text())
            if {k: v for k, v in old.items() if k != "generatedAt"} == body:
                print(f"No change in ESPN injuries; {out} left as is")
                return
        except Exception:  # noqa: BLE001
            pass
    body = {"generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"), **body}
    out.write_text(json.dumps(body, separators=(",", ":"), ensure_ascii=False) + "\n")
    print(f"Wrote {out}: {listed} teams, {sum(len(g['injuries']) for g in groups)} designated players "
          f"from {len(items)} ESPN injury entries")


if __name__ == "__main__":
    main()
