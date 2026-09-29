# Interactive Intro Design (tap-advance + typewriter, no sound)

## Context
`IntroScreen.jsx` (214 lines) plays boy→girl→button on fixed 4.2s/8.4s timers with full text shown at once. The user wants it tactile: tap to advance, lively text reveal. Sound explicitly excluded by the user (no audio engine, no toggle, no assets).

## Decisions (from brainstorming)
- Text effect: typewriter (not word-fade).
- Tap anywhere advances; timers stay as silent fallback.
- No sound whatsoever.
- Split into focused modules (user asked for clean/modular).

## Section 1 — Tap machine + typewriter (approved)
1. Root intro container handles tap/click: any tap outside a `<button>` advances. Boy phase: typing → complete line instantly; complete → go to girl. Girl phase: same → go to `ready` (button). `ready` phase: taps do nothing (button owns Start).
2. Existing 4.2s/8.4s timers stay and set absolute phases — a manual advance can never be regressed by a later timer fire.
3. New `useTypewriter.js`: `useTypewriter(text, { speed = 28 })` returns `{ shown, done, complete }`. Interval-based with cleanup on text change/unmount; `complete()` jumps to full text. Reduced-motion → full text instantly, no interval.
4. Caret: blinking `▍` (CSS `animate-pulse`) appended while `!done`.
5. Screen readers: typed span is `aria-hidden`, paired with visually-hidden full text (`sr-only`), so SR users hear each line once instead of character churn. Root keeps `aria-live="polite"`.
6. Discoverability: subtle "tap anywhere to continue" hint fades in under the couple after ~1.5s, hidden once `ready`.

## Section 2 — Structure (approved, sounds removed)
1. `IntroScreen.jsx` — flow only: pair pick, phase timers, tap routing, Start/skip/fade, layout.
2. `useTypewriter.js` — the hook, nothing else (hook export allowed by `react-refresh/only-export-components`).
3. `Couple.jsx` — `GirlFigure` + `BoyFigure` moved verbatim (keep `memo` + `displayName`), exported for IntroScreen. No visual changes.
4. Bubbles stay inline in IntroScreen (small, coupled to phases — splitting further is churn).
5. Skip behavior unchanged (jumps to `ready`). Start/fade/unmount flow unchanged. Pair pool, timing values, SVG art, z-order, HUD gating unchanged.

## Data flow
Tap → (typing ? complete : advance) → phase state → typewriter restarts per line → `ready` → Start click → existing fade → `onStart`.

## Error handling
- Interval cleanup on unmount/text change (StrictMode-safe).
- `closest('button')` guard so Skip/Start taps never double-advance.
- Reduced-motion path verified (no interval, full text).

## Testing
- `npx eslint` on touched files (zero new), `npm run build`, manual by user (has browser): tap advances, mid-type tap completes, timers still fire when idle, no double-advance on button taps, caret blinks, 390px layout, reduced-motion shows full text.
- No test infra (unchanged constraint).

## Out of scope
- Sound of any kind. Copy/timing/SVG changes. TeamModal, backend, test infrastructure.
