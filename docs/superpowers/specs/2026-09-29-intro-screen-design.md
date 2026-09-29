# Intro Screen Design (fullscreen 2D scene → fade → original setup)

## Context
Supersedes `2026-09-29-intro-display-design.md` (cinematic card over 3D scene — abandoned). The user wants a dedicated fullscreen 2D intro: two characters in the middle, dialogue on their heads, Start Exploring, fade into the original 3D setup.

## Decisions (from brainstorming)
- Fullscreen opaque 2D intro (not card-over-scene, not bottom bar) — chosen for focus and identical rendering on all screens.
- 3D head-tracking bubbles removed (nothing to track behind an opaque screen); the 7-pair JSON pool lives on as the dialogue source.
- Post-fade setup is pixel-identical to the pre-dialogue original (full camera revert).
- Reset is pure reset (unchanged from current spec).

## Section 1 — Fullscreen intro scene (approved)
1. After the splash, NightSky renders new `IntroScreen` (opaque, `z` above Canvas, covers viewport): vertical night-gradient backdrop, scattered CSS stars, a soft moon glow, and a stylized SVG boy + girl standing side by side in the middle (girl left in dress, boy right — echoing the 3D couple; original inline SVG, no image assets).
2. HTML speech bubbles anchored above each figure's head (fixed layout positions — no 3D projection math): boy line ~0-4s, girl line ~4-8s, from a random 1-of-7 pool pick per load (`randomDialogueIndex(-1)` in a `useState` initializer; pool file unchanged).
3. After both lines, bubbles cross-fade to a centered Start Exploring button (~1s fade). A Skip link jumps straight to the button state. No auto-dismiss — waits for the click.
4. `aria-live="polite"` on the dialogue region; button is a real `<button>` with visible focus; `prefers-reduced-motion` disables star twinkle/fade animations (content still shows).

## Section 2 — Start transition + original setup + reset (approved)
1. Start Exploring click: `IntroScreen` fades itself out (~1s opacity transition), then calls `onStart` → NightSky unmounts it, revealing the live 3D scene underneath (Canvas mounts and runs behind the intro from page load so the world is ready).
2. Post-fade camera is the ORIGINAL setup, fully reverted: `HOME_POS = (BENCH_X, groundHeight(BENCH_X, BENCH_Z + 4.5) + 1.45, BENCH_Z + 4.5)`, orbit target `(0, 1, 0)`, `HOME_TARGET` constant deleted, `autoRotate` always true at 0.3, controls always enabled, original `onPointerDown` (downPos + cancel flights only).
3. Reset is pure: `clearProps()` + `setHomeSignal(s+1)` only — no replay, no re-roll, no intro state touched.
4. Removed-state check: `grep -rn "pendingIntroRef\|introHold\|onHomed\|setHoming\|handleHomed\|HOME_TARGET\|introRun\|IntroDialogue" frontend/src` returns zero matches. Deleted files: `IntroDialogue.jsx`. Kept files: `introDialogues.json`, `introDialogues.js` (pool + picker, now consumed by `IntroScreen`).

## Data flow
Splash → `showIntro=true` → `IntroScreen` mounts (pair picked, timers run, 3D world live underneath) → Start click → 1s fade → `onStart` → unmount → free explore. Reset never touches intro state.

## Error handling
- JSON empty/import failure: existing `FALLBACK_PAIR` path unchanged.
- Timer effect with full cleanup (StrictMode-safe).
- WebGL down: intro still plays and Start still reveals whatever rendered (no dependency).

## Testing
- `npx eslint` on touched files (zero new), `npm run build`, manual by user (has browser): fullscreen layout desktop + 390px (figures centered, bubbles above heads, no overlap), Skip, Start fade smoothness, immediate free pan/drag post-fade, reset = silent glide with no dialogue, reloads vary pairs.
- No test infra (unchanged constraint).

## Out of scope
- Pair copy/timing changes, TeamModal, backend, test infrastructure, tour choreography.
