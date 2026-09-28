# Intro Hold + Dialogue Variations Design

## Context
Intro dialogue exists (`frontend/src/components/sky/IntroDialogue.jsx`, wired in `NightSky.jsx`): one fixed boy→girl pair, boy 4s → girl 4s → fade 1s, auto-plays after splash, tap/Skip dismisses. Camera keeps auto-panning (`autoRotateSpeed 0.3`) throughout. `CameraRig` (`frontend/src/components/sky/Rigs.jsx:89`) forces `controls.autoRotate = true` every frame during free explore, so a boolean toggle cannot hold the camera — speed must be ramped.

## Decisions (from brainstorming)
- Hold: speed-ramp + overlay block (not boolean toggle, not cinematic push-in).
- Input during intro: fully locked (not drag-to-free).
- Variations: user-provided copy (below), stored in a JSON file per user request.
- Replay: HUD reset button replays intro with a new variation (user correction: change happens on UI reset, not only browser refresh).

## Section 1 — Camera hold (approved)
1. While intro shows (`showIntro` true): `CameraRig` damps `controls.autoRotateSpeed` toward 0 (~1s smooth stop); `OrbitControls` receives `enabled={false}`.
2. Overlay root switches to `pointer-events-auto` during intro so no canvas tap can select stars/sign/bench/couple or dismiss; wrapper `onPointerDown` early-returns while intro shows (no flight-cancel, no dismiss).
3. Skip button (overlay, `pointer-events-auto`) is the only manual exit; timers auto-finish at ~9s as today.
4. On finish/Skip: controls re-enable, speed damps back to 0.3 (smooth resume over ~1s). No forced camera move at any point.
5. Timing unchanged: boy 4s → girl 4s → fade 1s.
6. HUD/TopBar above the overlay stay usable (verify z-order in implementation; overlay is z-40).

## Section 2 — Variations + reset replay (approved, revised)
1. New file `frontend/src/components/sky/introDialogues.json`: array of `{ "boy": "...", "girl": "..." }`, 7 entries (original + 6 unique user pairs; the user's duplicated "listening/stars" pair is stored once so it isn't double-weighted).
2. `IntroDialogue.jsx` imports the JSON; helper `randomDialogueIndex(exclude)` picks via `Math.random` at module scope (lint-safe: outside render; stable across remounts; random per page load and per device).
3. `NightSky.jsx` owns `introRun` state (dialogue index, init random): `<IntroDialogue key={introRun} dialogueIndex={introRun} ... />`. `key` remount resets phases per replay.
4. HUD reset handler additionally calls `setShowIntro(true)` + `setIntroRun(i => randomDialogueIndex(i))` (never repeats the just-played variation when pool > 1). Existing reset behavior (clear selection, glide home) is unchanged and runs underneath the replay.
5. `BOY_LINE`/`GIRL_LINE` named exports are removed; the component reads the pair by `dialogueIndex`. Phase timing, projection, clamping, aria-live, Skip are unchanged.
6. Reset pressed mid-intro: restarts intro with another new variation (acceptable, stated explicitly).

## Dialogue pool (exact copy, verbatim)
1. Boy: "Our stories may be different, but we're under the same sky." / Girl: "And sometimes, knowing we're not alone is enough to keep going."
2. Boy: "The moon is beautiful, isn't it?" / Girl: "It is… especially when I'm looking at it with you."
3. Boy: "What happens when someone finally shares what they've been carrying?" / Girl: "Maybe their voice becomes a light for someone else."
4. Boy: "Every star up there holds someone's story." / Girl: "Then tonight, let's make sure every voice is heard."
5. Boy: "Do you think someone out there is listening?" / Girl: "Maybe—that's why we leave our words among the stars."
6. Boy: "What are you wishing for?" / Girl: "A little more hope for tomorrow."
7. Boy: "What if you could send one thing into the night?" / Girl: "I'd send the words I never found the courage to say."

(Curly punctuation preserved from the user's message; the duplicate pair 5 is stored once.)

## Data flow
Splash → `showIntro=true`, `introRun=random` → overlay blocks canvas, speed ramps to 0 → phases boy→girl→leaving → `onDone` → controls on, speed ramps to 0.3. Reset → `clearProps` + `homeSignal` (as today) + `introRun=random(excluding current)` + `showIntro=true`.

## Error handling
- JSON import failure or empty pool: fall back to hardcoded pair #1 (original lines) so intro never breaks.
- `camera` null: existing fixed-position fallback unchanged.
- Behind camera: existing hide behavior unchanged (final-review minor about Skip still applies; tap-lock makes it moot during hold since only Skip/timers exit — but Skip is hidden too when behind camera; timers still fire at 9s, so no trap).

## Testing
- Manual: load → pan holds still during dialogue, resumes after; refresh rolls random pairs across reloads; reset replays with a different pair; Skip exits instantly with camera resuming; reset mid-intro restarts; 390px layout unchanged.
- `npx eslint` on touched files + `npm run build`. No test infra (unchanged constraint).

## Out of scope
- Changing phase durations, bubble styling/positioning, TeamModal, backend, test infrastructure.
- Weighted or sequential (non-repeating-cycle) rotation — pure random excluding immediate repeat only.
