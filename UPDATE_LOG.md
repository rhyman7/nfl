# NFL dashboard update log

Written by the **NFL dashboard daily update** scheduled task (10:50 AM ET) at the end of each run, newest
entries first, and committed with the data it describes. Before Nov 5, 2026 this log lived in a Claude
project doc; those entries were moved here unchanged.

## 2026-11-11 (manual follow-up) — ratings fix, Week 10
- Commit "Week 10 ratings update (2026-11-11)". Through Week 9, schedule Week 10. Published.
- SoS/SRS/OSRS/DSRS now computed from final scores through Week 9 (scripts/srs.py, PR #36), replacing the Week 7 values reused since the PFR standings page started failing. Only the ratings changed; lineOpen unchanged (set 2026-11-10).
- PDF build re-run after the Ubuntu-mirror outage (succeeded); Build PDFs install now retries (PR #35, cfb PR #41).

## 2026-11-11 (10:50 AM ET) — daily refresh, Week 10
- Commit "Week 10 daily refresh (2026-11-11)". Through Week 9, schedule Week 10 (14 games; byes CHI, DEN, PHI, TB). Published.
- Lines moved vs 11-10 publish (home spread / total): CAR@NO spread 1.5 → 2.5; HOU@CLE spread −4.5 → −5.5; MIA@IND 2.5/40.5 → 3.5/38.5; MIN@GB 4.5/42.5 → 3.5/41.5; LA@ARI total 40.5 → 39.5; SEA@LV −3.5/43.5 → −6.5/40.5; SF@DAL spread −4.5 → −3.5; PIT@CIN total 48.5 → 49.5; LAC@BAL spread 5.5 → 4.5.
- Referees: 0 of 14 games assigned (normal on Wednesday).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 9); SoS/SRS/OSRS/DSRS reused from the published 2026 file (still through Week 7).
- Small nflverse stat corrections in Week 9 game logs (e.g. J. Daniels 273 → 274 pass yds). data/capped.json and data/epa.json: only generatedAt changed; capped.json not committed.
- lineOpen unchanged (set 2026-11-10). All data checks and headless page tests passed (Weekly Edges prop tables hidden locally: they need the value board feed).

## 2026-11-10 (10:50 AM ET) — new-week update, Week 10
- Commit "Week 10 data update (through Week 9, 2026)". Through Week 9, schedule Week 10 (14 games; byes CHI, DEN, PHI, TB). Published.
- Referees: 0 of 14 games assigned (normal on Tuesday).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 9); SoS/SRS/OSRS/DSRS reused from the published 2026 file, so they're still through Week 7.
- PFR passing page also failed (client error), so the 5-QB cross-check was skipped.
- data/capped.json committed too (moved to through Week 9, 506 players).
- No earlier run had listed Week 10 opening lines, so lineOpen was set from today's lines. All data checks and headless page tests passed (Weekly Edges prop tables hidden locally: they need the value board feed).
- lineOpen (set 2026-11-10), home spread / total: WAS@NYG 2.5/41.5, NE@DET 2.5/51.5, BUF@NYJ −8.5/50.5, CAR@NO 1.5/48.5, HOU@CLE −4.5/39.5, JAX@TEN −10.5/46.5, KC@ATL −3.5/45.5, MIA@IND 2.5/40.5, MIN@GB 4.5/42.5, LA@ARI −9.5/40.5, SEA@LV −3.5/43.5, SF@DAL −4.5/55.5, PIT@CIN 3.5/48.5, LAC@BAL 5.5/38.5.

## 2026-11-09 (10:50 AM ET) — daily refresh, Week 9
- Commit "Week 9 daily refresh (2026-11-09)". Through Week 8, schedule Week 9 (15 games; byes PIT, TEN; 14 final, BUF@MIN is tonight). Published.
- Lines moved vs 11-08 publish (home spread / total): CLE@NO 3.0/42.5 → 4.5/43.5; DEN@CAR spread −2.5 → −3.0; DET@MIA total 50.5 → 49.5; LA@WAS total 47.5 → 48.5; LV@SF spread 9.5 → 8.5; TB@CHI spread 6.0 → 6.5; BUF@MIN total 43.5 → 44.5.
- Referees: 0 of 15 games assigned (still blank in nflverse games.csv on Monday; flagged).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 8, match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- data/capped.json: only generatedAt changed, not committed.
- lineOpen unchanged (set 2026-11-03). All data checks and headless page tests passed (Weekly Edges prop tables hidden locally: they need the value board feed).

## 2026-11-08 (10:50 AM ET) — daily refresh, Week 9
- Commit "Week 9 daily refresh (2026-11-08)". Through Week 8, schedule Week 9 (15 games; byes PIT, TEN; JAX@BAL final, today's games not yet in). Published.
- Lines moved vs 11-07 publish (home spread / total): CLE@NO spread 3.5 → 3.0; DEN@CAR spread −3.0 → −2.5; DET@MIA total 49.5 → 50.5; NYJ@KC spread 8.5 → 9.5; HOU@LAC spread −6.0 → −5.5; LV@SF spread 10.0 → 9.5.
- Referees: 0 of 15 games assigned (still blank in nflverse games.csv on Sunday; flagged).
- Fallback: PFR standings fetch failed (permission request timed out). Records from games.csv (through Week 8, match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- data/capped.json: only generatedAt changed, not committed.
- lineOpen unchanged (set 2026-11-03). All data checks and headless page tests passed (Weekly Edges prop tables hidden locally: they need the value board feed).

## 2026-11-07 (10:50 AM ET) — daily refresh, Week 9
- Commit "Week 9 daily refresh (2026-11-07)". Through Week 8, schedule Week 9 (15 games; byes PIT, TEN; JAX@BAL final). Published.
- Lines moved vs 11-06 publish (home spread / total): CLE@NO spread 3.0 → 3.5; DAL@IND spread −5.5 → −4.5; DEN@CAR spread −2.5 → −3.0; DET@MIA total 50.5 → 49.5; LA@WAS total 48.5 → 47.5; NYG@PHI spread −3.5 → −3.0; NYJ@KC spread 9.5 → 8.5; BUF@MIN total 44.5 → 43.5.
- Referees: 0 of 15 games assigned (still blank in nflverse games.csv on Saturday; flagged).
- Fallback: PFR standings fetch failed (permission request timed out). Records from games.csv (through Week 8, match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- data/capped.json: only generatedAt changed, not committed.
- lineOpen unchanged (set 2026-11-03). All data checks and headless page tests passed.

## 2026-11-06 (10:50 AM ET) — daily refresh, Week 9
- Commit "Week 9 daily refresh (2026-11-06)". Through Week 8, schedule Week 9 (15 games; byes PIT, TEN; JAX@BAL final, JAX won 33-10). Published.
- Lines moved vs 11-05 publish (home spread / total): JAX@BAL closing −10.0/39.5 → −8.5/40.5; DET@MIA spread −7.0 → −6.5; NYJ@KC spread 10.0 → 9.5; HOU@LAC spread −4.5 → −6.0; LV@SF total 52.5 → 51.5; GB@NE 3.5/45.5 → 3.0/44.5; BUF@MIN −3.5/45.5 → −3.0/44.5.
- Referees: 0 of 15 games assigned (still blank in nflverse games.csv on Friday; flagged).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 8, match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- data/capped.json: only generatedAt changed, not committed.
- lineOpen unchanged (set 2026-11-03). All data checks and headless page tests passed (Weekly Edges prop tables hidden locally: they need the value board feed).

## 2026-11-05 (10:50 AM ET) — daily refresh, Week 9
- Commit "Week 9 daily refresh (2026-11-05)". Through Week 8, schedule Week 9 (15 games; byes PIT, TEN; JAX@BAL is tonight's TNF). Published.
- Lines moved vs 11-04 publish (home spread / total): DAL@IND spread −6.0 → −5.5; DEN@CAR total 43.5 → 44.5; LA@WAS −5.5/47.5 → −4.5/48.5; NYG@PHI total 39.5 → 38.5; NYJ@KC spread 9.5 → 10.0; ARI@SEA 12.5/41.5 → 8.5/39.5; GB@NE 3.0/46.5 → 3.5/45.5.
- Referees: 0 of 15 games assigned (still blank in nflverse games.csv).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 8, match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- data/capped.json: only generatedAt changed, not committed.
- lineOpen unchanged (set 2026-11-03). All data checks and headless page tests passed (Weekly Edges prop tables hidden locally: they need the value board feed).

## 2026-11-04 (10:50 AM ET) — daily refresh, Week 9
- Commit f56d81b "Week 9 daily refresh (2026-11-04)". Through Week 8, schedule Week 9. Published (the
  run's own log entry went to the old project doc; this line was added when the log moved here).

## 2026-11-03 (10:50 AM ET) — new-week update, Week 9
- Commit 918f227 "Week 9 data update (through Week 8, 2026)". Through Week 8, schedule Week 9 (15 games; byes PIT, TEN). Published; live generatedAt confirmed (2026-11-03T15:52Z).
- Referees: 0 of 15 games assigned (normal on Tuesday).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 8); SoS/SRS/OSRS/DSRS reused from the published 2026 file, so they're still through Week 7.
- PFR passing page also failed (client error), so the 5-QB cross-check was skipped.
- data/capped.json committed too (moved to through Week 8, 483 players).
- No earlier run had listed Week 9 opening lines, so lineOpen was set from today's lines. All data checks and headless page tests passed.
- lineOpen (set 2026-11-03), home spread / total: JAX@BAL −9.5/42.5, CIN@ATL −3.0/52.5, CLE@NO 2.5/43.5, DAL@IND −6.0/51.5, DEN@CAR −2.5/44.5, DET@MIA −7.0/50.5, LA@WAS −5.5/47.5, NYG@PHI −3.5/39.5, NYJ@KC 9.5/46.5, HOU@LAC −4.5/40.5, LV@SF 10.0/51.5, ARI@SEA 10.5/43.5, GB@NE 2.5/46.5, TB@CHI 6.0/46.5, BUF@MIN −3.5/45.5.

## 2026-11-02 (10:50 AM ET) — daily refresh, Week 8
- Commit 2280461 "Week 8 daily refresh (2026-11-02)". Through Week 7, schedule Week 8 (14 games, 4 byes; 13 final, CHI@SEA is tonight's MNF). Published; main has generatedAt 2026-11-02T16:21Z and the "pages build and deployment" run for 2280461 succeeded (live WebFetch was refused: permission prompt timed out).
- Lines moved vs 11-01 publish (home spread / total; closing lines on Sunday's finished games): ATL@TB total 43.5 → 42.5; IND@JAX total 46.5 → 45.5; TEN@CIN 12.5/46.5 → 13.5/45.5; LAC@LA total 45.5 → 46.5; KC@DEN spread −1.5 → +1.5 (DEN now favored by 1.5); PHI@WAS spread 6.5 → 6.0. CHI@SEA unchanged.
- Referees: 0 of 14 games assigned (still blank in nflverse games.csv, even for finished games; flagged).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 7, match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- data/capped.json is also rewritten by the build; only its generatedAt changed, so it wasn't committed.
- lineOpen unchanged (set 2026-10-27). All data checks and headless page tests passed (prop tables on Weekly Edges can't render locally: they need the value board feed, and 13 of 14 games are final).

## 2026-11-01 (10:50 AM ET) — daily refresh, Week 8
- Commit ba3765f "Week 8 daily refresh (2026-11-01)". Through Week 7, schedule Week 8 (14 games, 4 byes; CAR@GB final, 12 games today, CHI@SEA Monday). Published; live generatedAt confirmed (2026-11-01T15:51Z).
- Lines moved vs 10-31 publish (home spread / total): LV@NYJ total 45.5 → 46.5; KC@DEN total 40.5 → 41.5; NE@MIA total 43.5 → 41.5; PHI@WAS spread 6.0 → 6.5.
- Referees: 0 of 14 games assigned (Sunday — still blank in nflverse games.csv; flagged).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 7, match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- lineOpen unchanged (set 2026-10-27). All checks and headless page tests passed.

## 2026-10-31 (10:50 AM ET) — daily refresh, Week 8
- Commit 2de28d3 "Week 8 daily refresh (2026-10-31)". Through Week 7, schedule Week 8 (14 games, 4 byes; CAR@GB final). Published; live generatedAt confirmed (2026-10-31T14:52Z).
- Lines moved vs 10-30 publish (home spread / total): ATL@TB total 44.5 → 43.5; CLE@PIT total 39.5 → 38.5.
- Referees: 0 of 14 games assigned (Saturday — still blank in nflverse games.csv; flagged).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 7, match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- lineOpen unchanged (set 2026-10-27). All checks and headless page tests passed.

## 2026-10-30 (10:50 AM ET) — daily refresh, Week 8
- Commit 341d1de "Week 8 daily refresh (2026-10-30)". Through Week 7, schedule Week 8 (14 games, 4 byes). Published; live generatedAt confirmed (2026-10-30T15:11Z).
- Thursday game final: CAR 19 @ GB 27.
- Lines moved vs 10-29 publish (home spread / total): CAR@GB total 46.5 → 47.5 (closing); TEN@CIN spread 10.0 → 12.5.
- Referees: 0 of 14 games assigned (Friday — still blank in nflverse games.csv; flagged).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (through Week 7, match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- lineOpen unchanged (set 2026-10-27). All checks and headless page tests passed.

## 2026-10-29 (10:50 AM ET) — daily refresh, Week 8
- Commit 96131c5 "Week 8 daily refresh (2026-10-29)". Through Week 7, schedule Week 8 (14 games, 4 byes; first game CAR@GB tonight). Published; live generatedAt confirmed (2026-10-29T15:07Z).
- Lines moved vs 10-28 publish (home spread / total): CAR@GB total 47.5 → 46.5; ATL@TB total 45.5 → 44.5; IND@JAX spread 9.5 → 10.0; PHI@WAS spread 5.5 → 6.0.
- Referees: 0 of 14 games assigned (still blank in nflverse games.csv).
- Fallback: PFR standings fetch failed (permission prompt timed out). Records from games.csv (all match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (no games since, so unchanged).
- lineOpen unchanged (set 2026-10-27). All checks and headless page tests passed.

## 2026-10-28 (10:50 AM ET) — daily refresh, Week 8
- Commit 51039e8 "Week 8 daily refresh (2026-10-28)". Through Week 7, schedule Week 8 (14 games, 4 byes; first game Thu 10-29). Published; live generatedAt confirmed (2026-10-28T14:57Z).
- Lines moved vs 10-27 publish (home spread / total): ARI@DAL spread 6.0 → 7.0; ATL@TB total 46.5 → 45.5; BAL@BUF 3.5/53.5 → 3.0/54.5; IND@JAX spread 7.5 → 9.5; LV@NYJ spread −1.5 → +1.5 (NYJ now favored by 1.5); LAC@LA total 44.5 → 45.5; KC@DEN total 41.5 → 40.5; NE@MIA −7.5/44.5 → −7.0/43.5; PHI@WAS spread 4.5 → 5.5; CHI@SEA spread 3.5 → 3.0.
- Referees: 0 of 14 games assigned (Wednesday — fine).
- Fallback: PFR standings fetch failed (client error). Records from games.csv (all match published); SoS/SRS/OSRS/DSRS reused from the published 2026 file (no games since, so unchanged).
- nflverse play-by-play refresh moved some EPA-page pressure-rate values. lineOpen unchanged (set 2026-10-27). All checks and headless page tests passed.

## 2026-10-27 (10:50 AM ET) — new-week update, Week 8
- Commit ad138b9 "Week 8 data update (through Week 7, 2026)". Through Week 7, schedule Week 8 (14 games; byes HOU, NO, NYG, SF). Published; live generatedAt confirmed (2026-10-27T15:10Z).
- Referees: 0 of 14 games assigned (normal on Tuesday).
- PFR standings fetched fine; PFR was a day behind on MNF, so DAL (3-4) and PHI (2-5) W-L-T came from games.csv; PFR ratings kept.
- PFR passing page couldn't be read (client error, twice), so the 5-QB cross-check was skipped.
- No earlier run had listed Week 8 opening lines, so lineOpen was set from today's lines. All checks and headless page tests passed.
- lineOpen (set 2026-10-27), home spread / total: CAR@GB 3.5/47.5, ARI@DAL 6.0/54.5, ATL@TB 2.5/46.5, BAL@BUF 3.5/53.5, CLE@PIT 3.5/39.5, IND@JAX 7.5/46.5, LV@NYJ −1.5/45.5, MIN@DET 3.0/46.5, TEN@CIN 10.0/46.5, LAC@LA 6.5/44.5, KC@DEN −1.5/41.5, NE@MIA −7.5/44.5, PHI@WAS 4.5/40.5, CHI@SEA 3.5/46.5.

## 2026-10-26 (10:50 AM ET) — daily refresh, Week 7
- Commit b4da4d2 "Week 7 daily refresh (2026-10-26)". Through Week 6, schedule Week 7 (14 games, 4 byes; 13 final, DAL@PHI is tonight's MNF). Published; live generatedAt confirmed (2026-10-26T14:57Z).
- Lines moved vs 10-25 second publish (home spread / total; mostly closing lines on Sunday's finished games): CLE@TEN spread −2.5 → −1.5; IND@MIN spread 7.0 → 6.5; NYG@HOU spread 10.5 → 10.0; SF@ATL total 50.5 → 49.5; DEN@ARI total 42.5 → 44.5; LA@LV total 48.5 → 49.5; KC@SEA total 42.5 → 43.5.
- Referees: 0 of 14 games assigned (still blank in nflverse games.csv; flagged).
- PFR standings fetched fine (still through Week 6 apart from Thursday's NE@CHI, so NE and CHI W-L-T came from games.csv); PFR ratings kept.
- lineOpen unchanged (set 2026-10-20). All checks and headless page tests passed.

## 2026-10-25 (second run, ~10:50 AM ET) — daily refresh, Week 7
- Commit 242a074 "Week 7 daily refresh (2026-10-25)". Through Week 6, schedule Week 7 (14 games, 4 byes; NE@CHI final). Published; live generatedAt confirmed (2026-10-25T14:51Z).
- Second refresh today; line moves are vs the earlier 980feb0 publish (12:50Z), home spread / total: PIT@NO total 42.5 → 43.5; CLE@TEN spread −1.5 → −2.5; IND@MIN spread 6.5 → 7.0.
- Referees: 0 of 14 games assigned (Sunday — still blank in nflverse games.csv; flagged).
- Fallback: PFR standings fetch failed again (client error). Records from games.csv (through Week 6); SoS/SRS/OSRS/DSRS reused from the published 2026 file (unchanged).
- lineOpen unchanged (set 2026-10-20). All checks and headless page tests passed.

## 2026-10-25 (~9:50 AM ET) — injury tags fix (not a data run)
- ESPN's league injuries feed (site.api.espn.com/.../nfl/injuries) was returning only the Arizona Cardinals, last updated Oct 16–17, so no other team showed tags.
- PR #15 (squash 6b4fb06): new **Fetch injuries** Action (`.github/workflows/fetch-injuries.yml`, every 3 hours Aug–Feb, or by hand) runs `scripts/fetch_espn_injuries.py`, which reads ESPN's per-team injury lists (core API) and writes `data/injuries.json`. `common.js` reads that file first and falls back to ESPN's league feed if it's missing or over 2 days old.
- First run (commit 5d18afc): 32 teams; 275 IR, 104 Out, 71 Questionable, 2 Doubtful, 2 Suspension; 52 of those are players in the dashboard's stat tables. Tags confirmed on the live matchup pages.
- With Ryan's approval, the NFL daily task's prompt was updated to match: injuries come from `data/injuries.json` (Fetch injuries Action), the task never adds that file, it pulls/rebases if an Action commit lands before its push, and site restores must be at or after 6b4fb06.

## 2026-10-25 (10:50 AM ET) — daily refresh, Week 7
- Commit 980feb0 "Week 7 daily refresh (2026-10-25)". Through Week 6, schedule Week 7 (14 games, 4 byes). Published; live generatedAt confirmed (2026-10-25T12:50Z).
- Lines moved vs 10-24 publish (home spread / total): PIT@NO total 44.5 → 42.5; CIN@BAL −1.5/47.5 → −3.0/46.5 (CIN now favored by 3); CLE@TEN spread −2.5 → −1.5; MIA@NYJ spread 4.5 → 3.5; NYG@HOU spread 10.0 → 10.5; SF@ATL total 49.5 → 50.5; DEN@ARI total 43.5 → 42.5; GB@DET 3.0/53.5 → 3.5/55.5; LA@LV spread −3.0 → −3.5; DAL@PHI total 44.5 → 43.5.
- Referees: 0 of 14 games assigned (Sunday — still blank in nflverse games.csv; flagged).
- Fallback: PFR standings fetch failed (client error). Records from games.csv; SoS/SRS/OSRS/DSRS reused from the published 2026 file (through Week 6, so unchanged).
- lineOpen unchanged (set 2026-10-20). All checks and headless page tests passed.

## 2026-10-24 (second run, ~10:50 AM ET) — daily refresh, Week 7
- Commit 1ee3f75 "Week 7 daily refresh (2026-10-24)". Through Week 6, schedule Week 7 (14 games, 4 byes). Published; live generatedAt confirmed (2026-10-24T14:52Z).
- Second refresh today; line moves are vs the earlier c6b0e11 publish (13:10Z): CIN@BAL total 48.5 → 47.5; NYG@HOU spread 10.5 → 10.0.
- Referees: 0 of 14 games assigned (Saturday — still blank in nflverse games.csv).
- PFR standings fetched fine; PFR counts Thursday's NE@CHI, so NE and CHI W-L-T taken from games.csv (through Week 6); PFR ratings kept.
- lineOpen unchanged (set 2026-10-20). All checks and headless page tests passed.

## 2026-10-24 (10:50 AM ET) — daily refresh, Week 7
- Commit c6b0e11 "Week 7 daily refresh (2026-10-24)". Through Week 6, schedule Week 7 (14 games, 4 byes). Published; live generatedAt confirmed (2026-10-24T13:10Z).
- Lines moved vs 10-23 publish (home spread / total): CIN@BAL spread +1.5 → −1.5 (CIN now favored by 1.5); CLE@TEN −1.5/37.5 → −2.5/36.5; LA@LV spread −3.5 → −3.0.
- Referees: 0 of 14 games assigned (Saturday — flagged; nflverse games.csv hasn't filled them in).
- PFR standings fetched fine. PFR already counts Thursday's NE@CHI result, so the build used games.csv records (through Week 6) for CHI and NE; PFR ratings kept.
- lineOpen unchanged (set 2026-10-20). All checks and headless page tests passed.

## 2026-10-23 (10:50 AM ET) — daily refresh, Week 7
- Commit cb90b75 "Week 7 daily refresh (2026-10-23)". Through Week 6, schedule Week 7 (14 games, 4 byes). Published; live generatedAt confirmed.
- Thursday game final: NE 24 @ CHI 30.
- Lines moved vs 10-22 publish (home spread / total): CIN@BAL spread −1.5 → +1.5 (BAL now favored by 1.5); LA@LV spread −4.5 → −3.5; KC@SEA spread 2.5 → 3.0; NYG@HOU total 43.5 → 42.5; GB@DET total 52.5 → 53.5.
- Referees: 0 of 14 games assigned yet (from Friday on — flag).
- Fallback: PFR standings fetch was blocked (permission prompt timed out). Records come from games.csv; SoS/SRS/OSRS/DSRS reused from the published 2026 file (through Week 6, so unchanged anyway).
- lineOpen unchanged (set 2026-10-20).

## 2026-10-22 (12:30 PM ET) — daily refresh, Week 7
- Commit 450b4f0 "Week 7 daily refresh (2026-10-22)". Through Week 6, schedule Week 7 (14 games, 4 byes). Published.
- Second refresh today: an earlier run had already pushed 96af92b at 10:55 AM ET. Line moves below are vs that publish.
- Lines moved: PIT @ NO spread PIT −3.5 → −3.0; LA @ LV spread LA −3.5 → −4.5; KC @ SEA spread SEA −3.0 → −2.5; NYG @ HOU total 42.5 → 43.5; GB @ DET total 53.5 → 52.5.
- Referees: 0 of 14 games assigned yet.
- PFR standings fetched fine; all 32 W-L-T match games.csv. No fallbacks.
- Other data change: nflverse reclassified one Detroit receiver (7th row) from WR to TE, shifting NYJ defense vs WR/TE yards slightly.
- lineOpen (unchanged, set 2026-10-20), home spread / total: NE@CHI 3.0/50.5, PIT@NO −3.5/44.5, CIN@BAL 2.5/51.5, CLE@TEN −1.5/38.5, IND@MIN 6.5/41.5, MIA@NYJ 4.5/38.5, NYG@HOU 10.0/42.5, SF@ATL −3.0/50.5, TB@CAR 3.5/44.5, DEN@ARI −4.5/43.5, GB@DET 3.0/53.5, LA@LV −4.5/47.5, KC@SEA 2.5/42.5, DAL@PHI −4.5/44.5.

## 2026-10-22 (daily refresh) — published
- Week 7 daily refresh: `data/data.json` through Week 6, schedule Week 7 (14 games; byes BUF, JAX, LAC, WAS), plus `data/epa.json` and `data/weeks/7.json`, `8.json`. Commit 96af92b on main; the PDF workflow followed with 3e1e0f9. Confirmed via main (`generatedAt` 2026-10-22T14:53:58Z) and the "pages build and deployment" run for 96af92b (success); the live URL isn't reachable from the workspace (proxy 403).
- Repo access worked: the existing clone had push access to `rhyman7/nfl`.
- PFR standings fetched cleanly: 32 teams, W-L-T all match games.csv.
- First run since injuries moved to ESPN in the browser (d40fa19): no injury data built; no `inj` keys, `injuryWeek` null.
- Referees: 0 of 14 (Thursday; nflverse still blank).
- `lineOpen` unchanged (2026-10-20 lines). Current lines moved since yesterday: CIN@BAL 3.0/51.5 → -1.5/48.5 (BAL went from 3-pt favorite to 1.5-pt underdog); NYG@HOU 10.0 → 10.5; SF@ATL -3.0/50.5 → -2.5/49.5; TB@CAR 3.5 → 3.0; LA@LV -4.5 → -3.5; KC@SEA 2.5 → 3.0.
- All other checks passed (32 teams, ranks 1–32, ranges, logs through Week 6, PPR points for DJ Moore (BUF) and Justin Jefferson, ATS 87–87, WAS@SF Week 6 ATS/O-U hand-check, BUF and SF PF/G and records, EPA, epa.json 32 teams through 6 / week 7, week files; every page renders with no page errors, tooltip, prop check, search, Week 6 rows link and Week 9 rows don't).

## 2026-10-21 (daily refresh) — published
- Week 7 daily refresh: `data/data.json` through Week 6, schedule Week 7 (14 games; byes BUF, JAX, LAC, WAS), plus `data/epa.json` and `data/weeks/7.json`, `8.json`. Commit 8773a97 on main. Confirmed via main (`generatedAt` 2026-10-21T14:52:48Z) and the "pages build and deployment" run for 8773a97 (success); the live URL isn't reachable from the workspace.
- Repo access worked: the clone already had push access to `rhyman7/nfl` (`add_repo` wasn't listed, not needed).
- PFR standings fetched cleanly: 32 teams, W-L-T all match games.csv (Monday's WAS@SF now counted).
- Injury report: Week 7, but only the Thursday teams (NE, CHI) are in it, practice status only; nflverse file Last-Modified 2026-10-21 12:53 UTC. 0 teams with game-status designations yet (normal for Wednesday morning). Site tags: 3 (2 DNP, 1 LP — e.g. Kyle Monangai CHI DNP thumb, A.J. Brown NE LP ankle; both match the file). Tags from the Week 6 report are gone.
- Referees: 0 of 14.
- `lineOpen` unchanged (2026-10-20 lines). Current lines moved since yesterday: CIN@BAL 2.5 → 3.0; CLE@TEN total 38.5 → 37.5; MIA@NYJ total 38.5 → 39.5; LA@LV total 47.5 → 48.5.
- All other checks passed (32 teams, ranks 1–32, ranges, logs through Week 6, PPR points for Rashee Rice and Justin Jefferson, ATS 87–87, KC and NYG Week 6 ATS/O-U hand-checks, EPA, epa.json 32 teams through 6 / week 7, week files; every page renders with no page errors, tooltip, prop check, search, Week 6 rows link and Week 9 rows don't).

## 2026-10-20 (Week 7 update, published by hand from the chat session) — published
- Published the Week 7 update the scheduled runs had built but couldn't push: `data/data.json` through Week 6, schedule Week 7 (14 games; byes BUF, JAX, LAC, WAS), plus `data/epa.json`, `data/season.json` and `data/weeks/`. Rebuilt from fresh nflverse downloads in a hand-run session with `rhyman7/nfl` attached (push). Commit fd9457e on main; the PDF workflow followed with d9e22c5.
- Confirmed via main (`generatedAt` 2026-10-20T15:51:01Z) and the "pages build and deployment" run for d9e22c5 (success; the one for fd9457e showed "cancelled", normal).
- `lineOpen` = the Week 7 table in the entry below (`at` 2026-10-20); the build's lines matched it exactly. The Wednesday 2026-10-21 run should find no new games and stop.
- PFR standings fetched (32 teams) but still missing Monday's WAS@SF; W-L for WAS (1-4-1) and SF (6-0) corrected from games.csv, ratings kept from PFR.
- Injury report: Week 6 (Week 7 not posted yet); nflverse file Last-Modified 2026-10-20 12:41 UTC. 73 tagged: 26 O, 28 Q, 5 DNP, 14 LP. Referees: 0 of 14.
- Checks passed: 32 teams, all 32 covered by games + byes, ATS 87–87, logs through Week 6, epa.json 32 teams (through 6 / week 7), Week 6 file all final; every page renders with no page errors, prop check works, five Edges prop tables, Week 6 rows link and Week 9 rows don't.

## 2026-10-20 (Wednesday run, fired again by hand) — built, NOT published (published later the same day, entry above)
- Re-fired by hand the same day in the same session. Rebuilt from fresh nflverse downloads: through Week 6, schedule Week 7 (14 games; byes BUF, JAX, LAC, WAS). Local commit e03cb47 (replaces e1c3c59), not on main. The live site stays on the 2026-10-18 file (through Week 5).
- **Push failed again**: still no `add_repo` in this session, and the git proxy returned the same 403 for `rhyman7/nfl` ("not in this session's authorized repository set"). The task needs a new session with `rhyman7/nfl` (push) in its sources. Built files delivered again as `nfl-week7-data.zip`.
- Output is the same as the earlier run today: `lineOpen` = today's lines (table below, `at` 2026-10-20), 0 of 14 referees, Week 6 injury report (73 tagged: 26 O, 28 Q, 5 DNP, 14 LP), ATS 87–87, epa.json 32 teams. PFR standings were reused from the earlier fetch today, with WAS/SF W-L corrected from games.csv. All seven pages render with no page errors; the prop check and the five Weekly Edges prop tables are present (the DraftKings/FanDuel buttons were removed on purpose in PR #10).

## 2026-10-20 (Wednesday run, fired Tuesday) — built, NOT published
- Built `data/data.json` through Week 6, schedule Week 7 (14 games; byes BUF, JAX, LAC, WAS), plus `data/epa.json`, `data/season.json` and `data/weeks/6–18.json`. Local commit e1c3c59, not on main. The live site stays on the 2026-10-18 file (through Week 5).
- **Push failed**: `add_repo` wasn't available (ToolSearch and an MCP refresh found nothing), and the git proxy refused both `rhyman7/nfl` and `rhyman7/nfl-dashboard` ("not in this session's authorized repository set ... 403"). Fix: add `rhyman7/nfl` to the scheduled task's sources with push access. The built files were delivered in the session as `nfl-week7-data.zip`.
- **PFR standings partly stale**: fetched 32 teams, but PFR hadn't yet counted Monday's WAS@SF (SF showed 5-0, WAS 1-3-1). W-L for those two corrected from games.csv; SoS/SRS/OSRS/DSRS kept from PFR (this season, through Week 6 minus that one game).
- PFR passing check: Allen, Prescott, Goff, Lawrence, Mahomes and Stafford match games and yards exactly. Purdy differs (PFR 5 G / 1196 yds, nflverse 6 G / 1460) because of the same missing Monday game.
- Injury report: Week 6 (nflverse hasn't posted Week 7 yet). 73 tagged in the stat tables: 26 O, 0 D, 28 Q, 5 DNP, 14 LP. Spot-checked Jeremiyah Love (ARI, Out, ankle) and Drake London (ATL, LP).
- Referees: 0 of 14 games (blank in nflverse); 18 referees in the history table.
- All other step-5 checks passed (32 teams, ranks 1–32, ranges, game logs and PPR points for Purdy and a DET receiver, betting ATS 87–87, WAS@SF hand-check: SF −7.5 won 23-17 → SF ATS L, under 51.5; EPA; epa.json 32 teams through Week 6 / week 7; week files; all seven pages render with no page errors, tooltip, game-log panel, prop check, search, week strip, finished-week (6) and later-week (9) boards).

### Week 7 opening lines from this run (lineOpen, at 2026-10-20; spread positive = home favored)

Used as the published Week 7 `lineOpen` on 2026-10-20.

| Game | Spread | Total |
|---|---|---|
| 2026_07_NE_CHI | 3.0 | 50.5 |
| 2026_07_PIT_NO | -3.5 | 44.5 |
| 2026_07_CIN_BAL | 2.5 | 51.5 |
| 2026_07_CLE_TEN | -1.5 | 38.5 |
| 2026_07_IND_MIN | 6.5 | 41.5 |
| 2026_07_MIA_NYJ | 4.5 | 38.5 |
| 2026_07_NYG_HOU | 10.0 | 42.5 |
| 2026_07_SF_ATL | -3.0 | 50.5 |
| 2026_07_TB_CAR | 3.5 | 44.5 |
| 2026_07_DEN_ARI | -4.5 | 43.5 |
| 2026_07_GB_DET | 3.0 | 53.5 |
| 2026_07_LA_LV | -4.5 | 47.5 |
| 2026_07_KC_SEA | 2.5 | 42.5 |
| 2026_07_DAL_PHI | -4.5 | 44.5 |

## 2026-10-18 (Sunday injury refresh) — published
- Published the Week 6 Sunday injury refresh: `data/data.json` through Week 5, schedule Week 6 (14 games; byes CIN, DET, MIA, MIN), plus `data/epa.json` and `data/weeks/6.json`, `7.json`. Commit 3d4cb50 on main; the PDF workflow followed with 7cb8810.
- Confirmed via the "pages build and deployment" runs for 3d4cb50 and 7cb8810 (both success). The workspace can't reach rhyman7.github.io (proxy 403).
- **Repo access** (same as before): `add_repo` not available; re-pointing the remote to `rhyman7/nfl` was blocked by the permission check. Pushed via `rhyman7/nfl-dashboard`, which GitHub redirects to `rhyman7/nfl`.
- **PFR fell back** (same as before): standings fetch failed (permission request unanswered). W-L-T from games.csv; SoS/SRS/OSRS/DSRS reused from the published 2026 file (same through-week). 5-QB comparison not done.
- Injury report: Week 6; nflverse file Last-Modified 2026-10-18 12:02 UTC (8:02 AM ET). All 28 teams playing have game-status designations, including Monday's WAS and SF. File-wide: 82 Out, 5 Doubtful, 94 Questionable. Site stat tables: 74 tagged — 29 O, 0 D, 24 Q, 5 DNP, 16 LP.
- Referees: 0 of 14 games (still blank in nflverse).
- `lineOpen` unchanged (Wednesday 2026-10-14 lines). Only current-line move since Saturday: TEN@IND 7.0 → 6.5.
- All other step-5 checks passed (32 teams, ranks, ranges, game logs, fantasy points, betting ATS 73–73, DEN@KC and NO@DET Wk1 hand-checks, EPA, week files, all seven pages render with no page errors, tooltip, game-log panel, prop check, search, finished/later-week boards).

## 2026-10-17 (Saturday injury refresh) — published
- Published the Week 6 Saturday injury refresh: `data/data.json` through Week 5, schedule Week 6 (14 games; byes CIN, DET, MIA, MIN), plus `data/epa.json` and `data/weeks/6.json`. Commit 41867d4 on main; the PDF workflow followed with fae4cc9.
- Confirmed via the "pages build and deployment" run for fae4cc9 (success; the one for 41867d4 showed "cancelled", normal). The workspace can't reach rhyman7.github.io (proxy 403).
- **Repo access** (same as before): `add_repo` not available; re-pointing the remote to `rhyman7/nfl` was blocked by the permission check. Pushed via `rhyman7/nfl-dashboard`, which GitHub redirects to `rhyman7/nfl`.
- **PFR fell back** (same as before): standings fetch failed (permission request unanswered). W-L-T from games.csv; SoS/SRS/OSRS/DSRS reused from the published 2026 file (same through-week). 5-QB comparison not done.
- Injury report: Week 6; nflverse file Last-Modified 2026-10-17 11:33 UTC (7:33 AM ET). 26 of 28 teams playing have game-status designations; the two without are WAS and SF (Monday game), expected on Saturday. File-wide: 70 Out, 5 Doubtful, 84 Questionable. Site stat tables: 72 tagged — 24 O, 0 D, 23 Q, 9 DNP, 16 LP.
- Referees: 0 of 14 games (still blank in nflverse).
- `lineOpen` unchanged (Wednesday 2026-10-14 lines). Current lines moved since Friday: CAR@PHI -3.5 → -3.0, CHI@ATL total 51.5 → 52.5, PIT@TB total 39.5 → 38.5, BUF@LV -4.5 → -5.5, WAS@SF total 51.5 → 52.5.
- All other step-5 checks passed (32 teams, ranks, ranges, game logs, fantasy points, betting ATS 73–73, BUF@HOU Wk1 hand-check, EPA, week files, all seven pages render with no page errors, tooltip, game-log panel, prop check, search, finished/later-week boards).

## 2026-10-16 (Friday run) — published
- Published the Week 6 Friday refresh: `data/data.json` through Week 5, schedule Week 6 (14 games; byes CIN, DET, MIA, MIN; Thursday's SEA 14, DEN 17 is in), plus `data/epa.json` and `data/weeks/6.json`, `7.json`. Commit 1f926ed on main (rebased twice over concurrent props/feature/PDF commits); the PDF workflow followed with c7c8895.
- Confirmed by checking main (`generatedAt` 2026-10-16T20:57:13Z) and the "pages build and deployment" run for c7c8895, successful (the one for 1f926ed showed "cancelled", normal). The workspace can't reach rhyman7.github.io (proxy 403).
- **Repo access**: `add_repo` wasn't available (ToolSearch found nothing); re-pointing the clone's remote to `rhyman7/nfl` was blocked by the session's permission check. Pushed through the session's source `rhyman7/nfl-dashboard`, which GitHub redirects to `rhyman7/nfl`.
- **PFR fell back**: both Pro-Football-Reference fetches failed (permission request unanswered in the unattended run). W-L-T from games.csv; SoS/SRS/OSRS/DSRS reused from the published 2026 file (same through-week). 5-QB comparison not done.
- Injury report: Week 6; nflverse file Last-Modified 2026-10-16 12:16 UTC, so Friday game designations aren't in yet — only SEA/DEN have statuses. 53 players tagged in the stat tables, practice status only (28 DNP, 25 LP), e.g. Lamar Jackson DNP (ankle).
- Referees: 0 of 14 games (nflverse still blank, including the played SEA@DEN).
- `lineOpen` unchanged (Wednesday 2026-10-14 lines). Current lines moved since the earlier 2026-10-16 rebuild: BAL@CLE total 40.5 → 39.5, NO@NYG total 45.5 → 46.5, BUF@LV spread -5.5 → -4.5.
- All other step-5 checks passed (32 teams, ranks, ranges, game logs, fantasy points, betting ATS 73–73, NE@SEA hand-check, EPA, week files, all seven pages render with no page errors, tooltip, game-log panel, prop check, search, week strip, finished/later-week boards; re-checked after rebasing onto the new props UI).

## 2026-10-14 (Wednesday, re-run by hand) — published
- Published the Week 6 update: `data/data.json` through Week 5, schedule Week 6 (14 games; byes CIN, DET, MIA, MIN), plus `data/season.json` and `data/weeks/5–18.json`. Commit 212d978 on main; the PDF workflow followed with 85cbe93.
- Confirmed by checking main (`generatedAt` 2026-10-14T15:03:33Z) and the "pages build and deployment" run for 85cbe93, successful (the one for 212d978 showed "cancelled", which is normal).
- Repo access worked: `add_repo` attached `rhyman7/nfl` with push access in this hand-run session. The scheduled tasks still need `rhyman7/nfl` added to their sources for unattended runs.
- `lineOpen` set to this morning's Wednesday lines (table in the entry below, `at` = 2026-10-14). Only BAL@CLE (-5.5/42.5 now) and PIT@TB (total 40.5 now) had moved since. The Friday and weekend runs keep these, since the published file is now Week 6.
- PFR standings fetched cleanly: 32 teams, W-L-T totals match games.csv (158 team-games). 6 QBs (Allen, Prescott, Goff, Mahomes, Purdy, Lawrence) match PFR games and yards exactly.
- Injury report: Week 6; nflverse file Last-Modified 2026-10-14 12:50 UTC (8:50 AM ET). Only SEA and DEN (Thursday game) are in it, practice status only; 0 teams with game-status designations. 2 tagged players in the stat tables (both LP: Drew Lock, Jaxon Smith-Njigba).
- Referees: 0 of 14 games assigned yet.
- All step-5 checks passed (32 teams, ranks, ranges, game logs, fantasy points, betting ATS 73–73, TB@DAL hand-check, EPA, week files, all six pages render with no page errors, tooltip, game-log panel, prop check, search, week strip, finished/later-week boards).

## 2026-10-14 (Wednesday run) — built, NOT published (published later the same day, entry above)
- Built `data/data.json` through Week 5, schedule Week 6 (14 games; byes CIN, DET, MIA, MIN), plus `data/weeks/5–18.json`. Local commit a4e5c0b, not on main. The live site stays on the 2026-10-11 file (through Week 4).
- **Push failed**: `add_repo` wasn't available (ToolSearch found nothing), and the git proxy refused `rhyman7/nfl` ("not in this session's authorized repository set ... 403"). A push via the old `rhyman7/nfl-dashboard` name (which worked Oct 9–11) was blocked by the session's permission check this time. Fix: add `rhyman7/nfl` to the scheduled task's sources with push access.
- Built files delivered in the session as `nfl-week6-data.zip`.
- PFR standings fetched cleanly this time: 32 teams, W-L-T and games match games.csv. 7 QBs (Allen, Prescott, Goff, Lawrence, Mahomes, Purdy, Murray) match PFR games and yards exactly.
- Injury report: Week 6, but nflverse only has the Thursday game's teams so far (SEA, DEN; practice status only). 5 tagged players in the stat tables.
- Referees: 0 of 14 games assigned yet.
- All step-5 checks passed (32 teams, ranks, ranges, game logs, fantasy points, betting ATS 73–73, TB@DAL hand-check, EPA, week files, all six pages render with no page errors, tooltip, prop check, search, week strip, finished/later-week boards).

### Week 6 opening lines from this run (lineOpen, at 2026-10-14; spread positive = home favored)

Used as the published Week 6 `lineOpen` on 2026-10-14.

| Game | Spread | Total |
|---|---|---|
| 2026_06_SEA_DEN | -2.5 | 40.5 |
| 2026_06_HOU_JAX | 3.0 | 42.5 |
| 2026_06_BAL_CLE | -4.5 | 41.5 |
| 2026_06_CAR_PHI | 1.5 | 40.5 |
| 2026_06_CHI_ATL | -3.0 | 49.5 |
| 2026_06_NO_NYG | -1.5 | 45.5 |
| 2026_06_NYJ_NE | 7.5 | 43.5 |
| 2026_06_PIT_TB | -2.5 | 39.5 |
| 2026_06_TEN_IND | 7.0 | 44.5 |
| 2026_06_ARI_LA | 12.5 | 51.5 |
| 2026_06_BUF_LV | -5.5 | 53.5 |
| 2026_06_LAC_KC | 8.5 | 42.5 |
| 2026_06_DAL_GB | 1.5 | 52.5 |
| 2026_06_WAS_SF | 7.5 | 50.5 |

## 2026-10-11 (Sunday injury refresh) — published
- Published the Week 5 Sunday injury refresh: `data/data.json` through Week 4, schedule Week 5 (15 games; byes CAR and KC), plus `data/weeks/5.json` and `data/weeks/6.json`. Commit f58ccf8 on main; the PDF workflow followed with b01b875.
- Confirmed by checking main (`generatedAt` 2026-10-11T14:16:28Z) and the "pages build and deployment" runs for f58ccf8 and b01b875, both successful. The workspace can't reach rhyman7.github.io (proxy 403), so the live file wasn't fetched directly.
- **Repo access** (same as Friday and Saturday): `add_repo` wasn't available in this session. The push went through the session's listed source `rhyman7/nfl-dashboard`, which GitHub redirected to `rhyman7/nfl`. Updating the scheduled task's source to `rhyman7/nfl` would stop this depending on the redirect.
- **PFR fell back** (same as Friday and Saturday): the Pro-Football-Reference fetches (standings twice, passing once) failed because the fetch permission request went unanswered in the unattended run. W-L-T came from games.csv; SoS/SRS/OSRS/DSRS were reused from the published 2026 file (same through-week, so unchanged). The 5-QB comparison against PFR was not done.
- Injury report: Week 5; nflverse injury file Last-Modified 2026-10-11 13:56 UTC (9:56 AM ET). All 30 teams playing now have game-status designations, including Monday's BUF and LA (file-wide: 92 Out, 4 Doubtful, 82 Questionable). In the site's stat tables 43 players are tagged: 17 O, 0 D, 19 Q, 2 DNP, 5 LP. Changes since Saturday: BUF DJ Moore DNP → Questionable (shoulder), BUF Josh Palmer now Out (shoulder); LA's rest-day DNP tag moved from Davante Adams to Tyler Higbee.
- Referees: still 1 of 15 games (Alex Moore, the already-played TB@DAL game). The 14 remaining games are blank in nflverse.
- `lineOpen` unchanged from the published file (the Wednesday 2026-10-07 lines). Current lines moved on 5 games since Saturday: CHI@GB total 45.5 → 47.5, HOU@TEN total 38.5 → 37.5, MIN@NO spread -2.5 → -1.5, SF@SEA total 45.5 → 46.5, BUF@LA spread 3.0 → 3.5.
- All other step-5 checks passed (32 teams, ranks, ranges, game logs, betting ATS 59–59, EPA, week files, all six pages render with no page errors, tooltip, game-log panel, prop check, search, week strip, finished-week and later-week boards).

## 2026-10-10 (Saturday injury refresh) — published
- Published the Week 5 Saturday injury refresh: `data/data.json` through Week 4, schedule Week 5 (15 games; byes CAR and KC), plus `data/weeks/5.json`. Commit db34196 on main; the PDF workflow followed with 6829185.
- Confirmed by checking main (`generatedAt` 2026-10-10T14:16:35Z) and the "pages build and deployment" runs for db34196 and 6829185, both successful. The workspace can't reach rhyman7.github.io, so the live file wasn't fetched directly.
- **Repo access** (same as Friday): `add_repo` wasn't available in this session and the git proxy refused `rhyman7/nfl` ("not in this session's authorized repository set"). The push went through the session's listed source `rhyman7/nfl-dashboard`, which GitHub redirected to `rhyman7/nfl`. Updating the scheduled task's source to `rhyman7/nfl` would stop this depending on the redirect.
- **PFR fell back** (same as Friday): both Pro-Football-Reference fetches (standings and passing) failed twice because the fetch permission request went unanswered in the unattended run. W-L-T came from games.csv; SoS/SRS/OSRS/DSRS were reused from the published 2026 file (same through-week, so unchanged). The 5-QB comparison against PFR was not done.
- Injury report: Week 5; nflverse injury file Last-Modified 2026-10-10 13:33 UTC (9:33 AM ET). 28 of the 30 teams playing now have game-status designations (file-wide: 90 Out, 4 Doubtful, 78 Questionable). The two without are BUF and LA, who play Monday; expected on Saturday. In the site's stat tables 42 players are tagged: 16 O, 0 D, 18 Q, 3 DNP, 5 LP. E.g. Lamar Jackson is Out (ankle), Caleb Williams Questionable (hamstring), Ashton Jeanty Questionable (ankle).
- Referees: still 1 of 15 games (Alex Moore, the already-played TB@DAL game). The 14 remaining games are blank in nflverse.
- `lineOpen` unchanged from the published file (the Wednesday 2026-10-07 lines). Current lines moved on 3 games since Friday: HOU@TEN total 37.5 → 38.5, NYG@WAS spread 4.5 → 3.5, BAL@ATL spread 3.5 → 3.0.
- All other step-5 checks passed (32 teams, ranks, ranges, game logs, betting ATS 59–59, EPA, week files, all six pages render with no page errors, tooltip, game-log panel, prop check, search, week strip, finished-week and later-week boards).

## 2026-10-09 (Friday run) — published
- Published the Week 5 Friday refresh: `data/data.json` through Week 4, schedule Week 5 (15 games; byes CAR and KC), plus `data/weeks/5–18.json` (records now include Thursday's TB 24, DAL 16). Commit c2830ed on main; the PDF workflow followed with 7ddc05a.
- Confirmed by checking main (`generatedAt` 2026-10-09T21:01:48Z) and the "pages build and deployment" runs for c2830ed and 7ddc05a, both successful. The workspace can't reach rhyman7.github.io (proxy 403), so the live file wasn't fetched directly.
- **Repo access**: `add_repo` wasn't available in this session, and the git proxy refused `rhyman7/nfl` ("not in this session's authorized repository set"). The session's own source is still listed as `rhyman7/nfl-dashboard`; pushing through that old name worked (GitHub redirected it to `rhyman7/nfl`). Updating the scheduled task's source to `rhyman7/nfl` would stop this depending on the redirect.
- **PFR fell back**: both Pro-Football-Reference fetches (standings and passing) failed because the fetch permission request went unanswered in the unattended run. W-L-T came from games.csv; SoS/SRS/OSRS/DSRS were reused from the published 2026 file (same through-week, so unchanged). The 5-QB comparison against PFR was not done.
- `lineOpen` unchanged from the published file (the Wednesday 2026-10-07 lines). Current lines moved on 10 of 15 games, e.g. CHI@GB -3.0 → -1.5, NYG@WAS 3.5/43.5 → 4.5/41.5, MIN@NO -1.5/42.5 → -2.5/41.5.
- Injury report: Week 5, 54 tagged players in the stat tables (up from 40). Only TB and DAL have game statuses (Out/Questionable); the other 28 teams playing show practice status only (DNP/LP), since nflverse hadn't posted Friday's game designations yet. E.g. Lamar Jackson (ankle), Caleb Williams (hamstring) and Marcus Mariota (knee) show DNP.
- Referees: 1 of 15 games has one (Alex Moore, the already-played TB@DAL game). The 14 weekend games are still blank in nflverse.
- All other step-5 checks passed (32 teams, ranks, ranges, game logs, betting ATS 59–59, EPA, week files, all six pages render with no page errors, tooltip, game-log panel, prop check and search work).

## 2026-10-08 (Thursday, run by hand) — published
- Published `data/data.json` through Week 4, schedule Week 5 (15 games; byes CAR and KC), plus `data/season.json` and `data/weeks/`. Commit 5338bd3 on rhyman7/nfl; the PDF workflow followed with f5060a5 and Pages deployed it. Live `generatedAt` 2026-10-08T16:58:19Z confirmed.
- Pushed through the renamed repo `rhyman7/nfl` (attached with push access this session).
- PFR standings fetched cleanly: 32 teams, records match games.csv, SRS = OSRS + DSRS.
- All step-5 checks passed. 7 QBs (Allen, Mahomes, Jackson, Goff, Purdy, Lawrence, Burrow) match PFR games and yards exactly.
- `lineOpen` for Week 5 was set to the Wednesday 2026-10-07 lines below (with `at` = 2026-10-07), so line movement is measured from Wednesday even though that run didn't publish. The Friday run keeps these, since the published file is now Week 5.
- Injury report: Week 5 (40 tagged players in the stat tables; e.g. Baker Mayfield Out, thumb). Referees: 0 of 15 games assigned yet in nflverse.

## 2026-10-07 (Wednesday run) — built, NOT published
- Built `data/data.json` through Week 4 (schedule Week 5, 15 games, byes CAR and KC). All step-5 checks passed; 12 QBs matched Pro-Football-Reference exactly; PFR standings fetched cleanly (32 teams, records match games.csv).
- **Push failed**: the session had no `add_repo` tool, and the git proxy refused `rhyman7/nfl` (and `rhyman7/nfl-dashboard`) as "not in this session's authorized repository set". The live site stayed on Week 3 data (generatedAt 2026-10-04). Fix: add the repo to the scheduled task's sources with push access.
- The built files were delivered in that session as `nfl-week4-data.zip`.
- Redesign (PR #1) is merged into main.

### Week 5 opening lines from this run (lineOpen, at 2026-10-07; spread positive = home favored)

Used as the published Week 5 `lineOpen` on 2026-10-08.

| Game | Spread | Total |
|---|---|---|
| 2026_05_TB_DAL | 8.5 | 47.5 |
| 2026_05_PHI_JAX | 7.0 | 42.5 |
| 2026_05_CHI_GB | -3.0 | 45.5 |
| 2026_05_CIN_MIA | -7.0 | 42.5 |
| 2026_05_CLE_NYJ | 2.5 | 39.5 |
| 2026_05_HOU_TEN | -7.5 | 37.5 |
| 2026_05_IND_PIT | 2.5 | 44.5 |
| 2026_05_LV_NE | 3.5 | 45.5 |
| 2026_05_MIN_NO | -1.5 | 42.5 |
| 2026_05_NYG_WAS | 3.5 | 43.5 |
| 2026_05_DEN_LAC | -3.5 | 42.5 |
| 2026_05_DET_ARI | -5.5 | 54.5 |
| 2026_05_SF_SEA | 2.5 | 46.5 |
| 2026_05_BAL_ATL | 3.5 | 43.5 |
| 2026_05_BUF_LA | 3.0 | 54.5 |

### Open data quirk

nflverse lists 2026_05_PHI_JAX at Tottenham Hotspur Stadium (9:30 AM ET) but with `stadium_id` JAX00 and location Home, so the build gives it city Jacksonville, FL, Jacksonville coordinates and `neutral: false`. The script was left unchanged.
