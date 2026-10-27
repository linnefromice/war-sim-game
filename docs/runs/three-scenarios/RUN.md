# Three scenarios run

- Approved request: ../../from-research-hub/2026-10-28-three-scenarios.md
- Start: 2026-10-27 16:20:16 UTC / 2026-10-28 01:20:16 JST.
- No new stage after: 2026-10-27 22:20:16 UTC; finish target: 23:20:16 UTC.
- Base: b1d0d81. Codex alone; no delegation. Launcher owns rcm cleanup.
- No new PC tools, browsers, global packages, lock changes, publishing, other-repository edits.
- Heavy commands use flock /tmp/research-hub-w2-w3-w8-heavy.lock.

## Stage 0: fixed design

Keep tutorial data unchanged. Add three symmetric local two-player maps using existing unit specifications and weapons (full HP/EN):

1. `first-contact` / はじめの射程: 5 columns × 4 rows, plain; P1 soldier (0,3), P2 soldier (4,0). Learn movement and range.
2. `combined-arms` / 混成小隊: 6 × 5, plain; P1 fighter (0,4), soldier (1,4); P2 fighter (5,0), soldier (4,0). Learn fighter assault and infantry weapons.
3. `crossroads` / 森の交差点: 7 × 5; forest at (2,1), (4,3), (3,2), mountain at (0,2), (6,2); P1 tank (1,4), soldier (2,4); P2 tank (5,0), soldier (4,0). Learn range, cover and tank adjacency. No water/isolation.

Existing specs: soldier HP200 EN100 move1; fighter HP1000 EN200 move3; tank HP2000 EN400 move2. Weapons from getAraments only. Existing terrain-cost BFS movement and Manhattan attack range preserved, reject occupied/water/out-of-bounds/repeated actions, friendly fire and invalid weapons at reducer boundary. Victory still settles at TURN_END after final kill.

Scenario registry → selection → keyed Stage with scenario-bound pure reducer → result → same-scenario replay or menu. Reset all game/UI/animation state by remount. Pass selected scenario to reducer, movement BFS, damage, keyboard, replay and statistics. Action controls sit below the scrollable board to avoid covering target cells; native buttons support keyboard/touch. Optional difficulty only preserves legacy CPU saves; new games always hotseat. Existing v1 save migrates to tutorial with its original difficulty; new saves record scenario and hotseat/legacy mode.

## Stages and gates

0. Inspect rules, dependencies/browser, baseline; freeze design here.
1. Scenario data and reducer isolation; legal victory traces for each map and both winners.
2. Selection/restart/menu, hotseat input, save compatibility, responsive controls.
3. Full lint → build → test; browser mouse, keyboard, touch flows without state injection; PC/narrow layout screenshots. Self-review and fixes.
4. PR; squash only when all gates including CI pass; otherwise leave unmerged. Commit/push REPORT and STOPPED, verify clean/upstream equality.

Trace limits fixed before implementation: each of 6 witnesses ≤200 accepted reducer actions and ≤80 half-turns; deterministic greedy legal movement/attacks with passive opponent ending turns. At most 2 scenario-layout revisions (document before rerun); no limit relaxation. Witnesses prove reachability only, not balance or human playtime. Browser test ≤120 actions per flow, 30 seconds per interaction, no state injection. Coverage target from local rules: 80%; use existing tooling only, record blocked if unavailable.
