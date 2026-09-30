"""Build downloadable PDFs of this week's matchups with headless Chrome.

Renders print.html exactly as the browser's print does (one landscape page per
matchup) and writes:
  pdf/matchups.pdf          every game this week
  pdf/games/<game id>.pdf   one file per game
  pdf/manifest.json         season, week and build time; the pages use it to show
                            the Download PDF links only when the PDFs match the data

Run from the repo root:  python scripts/build_pdfs.py
Needs: pip install playwright && python -m playwright install --with-deps chromium
"""
import functools
import http.server
import json
import shutil
import threading
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "pdf"


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    handler = functools.partial(Quiet, directory=str(ROOT))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"


def render(page, url, dest):
    page.goto(url, wait_until="networkidle")
    # print.js enables the Print button once every matchup has been laid out
    page.wait_for_selector("#printAllBtn:not([disabled])", timeout=30000)
    page.evaluate("document.fonts.ready")
    page.emulate_media(media="print")
    page.pdf(path=str(dest), prefer_css_page_size=True, print_background=True)
    page.emulate_media(media="screen")


def main():
    data = json.loads((ROOT / "data" / "data.json").read_text(encoding="utf-8"))
    teams = data.get("teams", {})
    games = [g for g in data["schedule"]["games"] if g["away"] in teams and g["home"] in teams]

    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "games").mkdir(parents=True)

    srv, base = serve()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.add_init_script("window.print = () => {}")
            render(page, f"{base}/print.html?auto=0", OUT / "matchups.pdf")
            for g in games:
                render(page, f"{base}/print.html?auto=0&game={g['id']}", OUT / "games" / f"{g['id']}.pdf")
                print("built", g["id"])
            browser.close()
    finally:
        srv.shutdown()

    manifest = {
        "season": data.get("season"),
        "week": data["schedule"]["week"],
        "dataGeneratedAt": data.get("generatedAt"),
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "games": [g["id"] for g in games],
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"built {len(games)} game PDFs + matchups.pdf for week {manifest['week']}")


if __name__ == "__main__":
    main()
