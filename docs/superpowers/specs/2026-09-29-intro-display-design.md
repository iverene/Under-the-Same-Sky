# Intro Display v2 Design (cinematic card + bubbles, original camera)

## Context
Intro dialogue currently lives in 3D bubbles only, with camera hold/lock and reset-replay machinery (`showIntro`, `introRun`, `pendingIntroRef`, `homing`, `handleHomed`, `introHold`, `onHomed`, pointerdown gating). The user wants a new approach: dialogue on a dedicated display, Start Exploring gate, original free camera, pure reset. Centered couple framing (`HOME_POS`/`HOME_TARGET`) stays; 3D bubbles + head tracking stay.

## Decisions (from brainstorming)
- Display: cinematic card over dimmed live scene (not solid screen, not bottom bar).
- Bubbles stay and mirror the same lines/timing behind the veil.
- Framing: keep centered (revert rejected — original framing re-creates the edge-bubble bug).
- Variations: keep random 1-of-7 per load.

## Section 1 — Combined intro display (approved)
1. After splash, NightSky renders new `IntroDisplay` (veil + card) which owns phase state: `boy` (~0-4s) → `girl` (~4-8s) → `ready` (Start Exploring button). Single timer set drives both card and bubbles.
2. Veil: full-screen translucent dark (`bg-slate-950/60 backdrop-blur-[2px]`-ish), scene + head-tracked bubbles visible behind it.
3. Card: centered glass card (ReadingCard styling language), speaker label + line, cross-fade between boy/girl. Then card body cross-fades to the Start Exploring button.
4. Skip link jumps straight to `ready` (button shows). No auto-dismiss — the intro waits for the click.
5. `IntroDisplay` picks the pair once via `randomDialogueIndex(-1)` in a `useState` initializer; renders `<IntroDialogue phase={phase} dialogueIndex={...} onSkip={...} />` for the bubbles. `IntroDialogue` becomes controlled: internal phase timers and auto-`onDone` removed; bubble Skip calls `onSkip`.

## Section 2 — Start, camera, reset (approved)
1. Start Exploring click: `IntroDisplay` sets internal `leaving` (veil+card+bubbles fade together ~1s via opacity transition), then calls `onStart` → NightSky `setShowIntro(false)` unmounts everything.
2. Camera returns to ORIGINAL behavior: `autoRotate` always true at 0.3, controls always enabled, drag/zoom/tap live from the first frame. Removed: `introHold` damp (Rigs), `enabled` lock, pointerdown gating, tap-dismiss deletion (original handler restored: `downPos` + `flying=false` + `homingCam=false`).
3. Reset returns to pure reset: `clearProps()` + `setHomeSignal(s+1)` only. Removed: `introRun`/`pendingIntroRef`/`homing`/`handleHomed`/`onHomed` (Rigs), replay, re-roll.
4. Deleted-state check: after the change, `grep -rn "pendingIntroRef\|introHold\|onHomed\|setHoming\|handleHomed" frontend/src` must return zero matches. `introRun` state removed from NightSky (pick lives in IntroDisplay).

## Data flow
Splash → `showIntro=true` → `IntroDisplay` mounts (pair picked, timers run) → user clicks Start → `leaving` 1s → `onStart` → unmount → free explore. Reset never touches intro state.

## Error handling
- JSON empty/import failure: existing `FALLBACK_PAIR` path unchanged.
- `camera` null / behind camera: existing IntroDialogue fallbacks unchanged.
- StrictMode double effects: timer effect with full cleanup (existing pattern).

## Testing
- `npx eslint` on touched files (zero new), `npm run build`, manual by user (has browser): card+bubbles sync, Skip, Start fade, immediate free pan/drag from frame one, reset = silent glide home with no dialogue, reloads vary pairs, 390px layout.
- No test infra (unchanged constraint).

## Out of scope
- Changing pair copy/timing, bubble styling/positioning, TeamModal, backend, test infrastructure.
- Tour choreography (bench→sign→characters scripted path) — not requested in this approach.
