# 2D Sky View (fixed illustrated scene, intro visual language)

## Context
Some users struggle to navigate the 3D sky: orbiting, pinching, and flying the camera is the barrier. We add an optional 2D view that shows the same content (moon, stars, lanterns, couple, terrain) in one fixed illustrated frame styled like `IntroScreen`, with the same interactions minus camera navigation. 3D remains the default first impression.

## Decisions (from brainstorming)
- **Fixed single screen** — everything composed in one frame like the intro; no pan, no zoom, no camera flights. Chosen as the lowest-friction navigation model.
- **Full feature parity** — tap to read, search, Write, Wish, sky themes, help/share/reset all work in 2D. Only free-camera navigation is replaced.
- **HUD toggle, persisted** — a segmented 2D/3D pill in the HUD; last choice stored in `localStorage`, default `3d`.
- **Project from stored 3D positions** — each message's existing position drives its 2D spot, so the same sky maps to the same picture with no new data.
- **Rendering approach A** — HTML/Tailwind/CSS + SVG DOM scene (not a second R3F scene, not a `<canvas>` loop): matches the intro exactly, needs no WebGL (helps the weak devices we're targeting), and objects are real buttons for free.

## Section 1 — View state & architecture (approved)
1. `NightSky` owns `view` (`'3d' | '2d'`), initialized from `localStorage['utss.view']` (guarded read), default `'3d'`; writes back on change via a small `view.js`/inline helper.
2. Extract the `<Canvas>` block plus the procedural-texture hooks (`useStarTexture` … `useWoodTexture`) into a new `Sky3D` child, so WebGL and its canvas textures are created only while 3D is mounted. Hooks stay unconditional (they live inside `Sky3D`).
3. `NightSky` keeps all orchestration state unchanged (messages, `selectedId`, `selectedSign/Bench/Team`, modals, send banners, `skyTheme`, `uiHidden`, search, `clearProps`) and renders either `<Sky3D/>` or `<Sky2D/>` behind the shared overlays.
4. Shared, unchanged: `ReadingCard`, `ComposeModal`, `WishingModal`, `SignModal`, `TeamModal`, `ConfirmDialog`, `HUD`, `TopBar`, `SearchPanel`, `IntroScreen`, splash. `HUD` gains the toggle pill and an `onToggleView` / `view` prop pair, placed next to Reset in **both** layouts (mobile left column and desktop bottom bar), fading with the UI like the other controls.
5. HUD copy adapts to the view: the instruction pill and the mobile help modal show "Tap stars & lanterns to discover a message" in 2D instead of the pinch/drag wording.
6. Reset in 2D clears the current selection only (no camera to home); `homeSignal` stays a 3D concern.
7. Switching crossfades (~300ms opacity) between views; the unmounted view releases its resources. Returning to 3D re-runs `SceneWarmup` and lands on `HOME_POS`.
8. `IntroScreen` and splash behavior is untouched. If the remembered view is `2d`, `Sky2D` mounts behind the intro and the 3D warmup is simply not rendered.

## Section 2 — 2D scene composition (approved)
1. `Sky2D` is a full-screen, `overflow-hidden` container that reuses the intro's language: layered night bands from `SKY_THEMES[skyTheme]` (`bg`, then masked `mtnFar`/`mtn` haze so `transition-colors` can animate them), a deterministic CSS starfield (seeded `mulberry32` star table), a soft moon glow disc in the upper left (`left-[20%] top-[12%]`), and the `splashStar` twinkle plus a hand-rolled lantern-bob keyframe.
2. Terrain layer (`Terrain2D.jsx`): flat SVG silhouettes — near hill with the couple's platform, a ridge line behind it, and a few pine triangles. Colors derive from the theme (`mtn`, `mtnFar`, `ground`).
3. Landmarks, matching every 3D entry point:
   - Couple: reuse `Couple.jsx` `GirlFigure` / `BoyFigure`, standing on the hill. Tappable → `handleSelectTeam` (About/Team modal).
   - Signpost: illustrated post+board, sized to read at a glance (`66x84` art in a `h-24 w-20` tap target). Tappable → `handleSelectSign`.
   - Bench: decorative wood SVG beside the couple, `aria-hidden`, no interaction (matches 3D, where the bench has no content). Rendered at every breakpoint.
   - Fireflies: eight deterministic glowing dots drifting around the couple (literal coordinate table, `fireflyGlow` keyframe), decorative and `aria-hidden`; suppressed under reduced motion.
4. Bands: sky occupies roughly the top 62% (stars), the horizon/lantern band ~45–72%, terrain silhouette below ~58%, matching the intro's `bottom-[18%]` couple layout.

## Section 3 — Placement & projection (approved)
1. New `projection.js` exports `messageTo2D(message)` → `{ x, y }` in percentages.
2. Stars: `d = position.clone().normalize()`; azimuth `a = atan2(d.x, -d.z)` (−z is the home view direction), elevation `e = asin(clamp(d.y, −1, 1))`. Wrap the full circle across the width: `x = ((a + π) / 2π) * 100`, so the whole stored sky spreads across the frame instead of piling up at the edges; map elevation `[−0.2, 1.45]` → `y` in `[62, 6]` (the sky band). Clamp `x` to `[4, 96]` and `y` to `[6, 62]` only for final safety.
3. Lanterns: use the horizontal direction only (`atan2(x, -z)`) for `x`; because `randomLanternPosition` gives every lantern the same `y`, add a deterministic vertical stagger from a message-id hash inside the horizon band `[45, 72]` so they don't form one flat row.
4. Overlap: add a tiny deterministic jitter (id hash, ±1.5%) so identical directions don't stack exactly; heavy clusters are resolved visually by glow bloom, not by repositioning.
5. Parity with 3D: stars with no position stay hidden in 2D (same filter as the 3D sky) but remain searchable. Lanterns always have a position after `normalizeMessage`.
6. New arrivals (`markFresh`) get the same bright-glow treatment as in 3D for `FRESH_GLOW_MS`, then settle.

## Section 4 — Interaction & accessibility (approved)
1. Each star/lantern renders as a real `<button>` with a ≥44px hit area and an `aria-label` like `Star message for Alice` / `Lantern wish for Alice`.
2. Tap/click calls the existing `handleSelectStar` / `handleSelectLantern`; the selected object scales up and brightens (selected state mirrors the 3D selected glow). `ReadingCard` opens unchanged at the bottom center.
3. Tapping empty sky closes the reading card using the existing fast outside-tap + Escape behavior, reusing `useOutsideTapClose` with the "outside" selector broadened from `canvas` to `[data-sky-surface], canvas` so it works in both views. Tapping the already-selected star/lantern closes it and does not reopen it (pointerdown records the pre-close selection).
4. Search results, Write, Wish, theme changes, help, and share work through the same handlers; a selected object closes when a modal opens (`clearProps`).
5. Keyboard: all interactive objects are tab-reachable with visible focus rings; decorative layers are `aria-hidden`.
6. Reduced motion: `prefers-reduced-motion` disables twinkle, lantern bob, and firefly drift (content still renders statically), mirroring `IntroScreen`.

## Section 5 — Themes, motion & density (approved)
1. Theme palette is derived from `SKY_THEMES[skyTheme]` (`bg` / `mtnFar` / `mtn` bands, `ground`, `veil` star opacity); switching crossfades ~1s, so the HUD sky picker keeps full parity in 2D.
2. Gentle idle motion: slow lantern bob, starfield twinkle, and a slow firefly drift near the couple. No falling stars or camera motion.
3. Density guard: above ~150 stars/lanterns, render all objects static (no twinkle/bob) while the decorative starfield keeps twinkling, protecting low-end phones.
4. `overflow-hidden` and percentage coordinates keep the composition correct from 320px phones to wide desktop.

## Data flow
Mount → read `utss.view` → render `Sky3D` or `Sky2D` behind shared overlays → toggle writes `utss.view` and crossfades → 2D maps `messages` through `messageTo2D` → tap → existing selection handlers → `ReadingCard` / modals → close via X, outside tap, or Escape.

## Error handling
- `localStorage` unavailable/throws: fall back to `'3d'`, wrap reads and writes in try/catch.
- No messages / backend offline: 2D renders sky, moon, terrain, and couple — same graceful-empty behavior as 3D.
- No WebGL: 2D still renders (it has no WebGL dependency); this is the intended escape hatch.
- Very large message lists: density guard bounds animated nodes; layout math is O(n) with no per-frame work.

## Testing
- `npx eslint` on touched files (zero new), `npm run build`.
- WebKit + Chromium (mobile viewport + desktop): toggle 2D↔3D both ways; choice persists across reload; tap star opens the correct message; tap empty sky closes; couple opens About/Team; sign opens the sign modal; Write/Wish/send updates both views; search jumps to a message; sky theme recolors the 2D scene; keyboard reaches every object; reduced-motion stops animation; ~150-message density smoke test stays smooth.
- No test infra (unchanged constraint).

## Files
- New: `frontend/src/components/sky2d/Sky2D.jsx`, `sky2d/projection.js`, `sky2d/Star2D.jsx`, `sky2d/Lantern2D.jsx`, `sky2d/Terrain2D.jsx`, `sky2d/Moon2D.jsx`, `sky2d/viewStorage.js`.
- New: `frontend/src/components/Sky3D.jsx` (extracted Canvas + texture hooks).
- Changed: `frontend/src/components/NightSky.jsx` (view state, view switch, shared overlays), `frontend/src/components/HUD.jsx` (toggle pill, view-aware copy), `frontend/src/components/sky/useOutsideTapClose.js` (accept the 2D surface as an outside-tap region). Reused untouched: `sky/Couple.jsx`, `sky/ReadingCard.jsx`, `sky/SearchPanel.jsx`, `sky/IntroScreen.jsx`, `three/themes.js`, modals, `ConfirmDialog`.

## Out of scope
- Changing the 3D scene, OrbitControls, camera rigs, or textures.
- Backend/schema changes or adding 2D positions to stored messages.
- New image assets (all art stays inline SVG/CSS).
- Making 2D the default for any cohort (3D stays the default first impression).
- Reworking `ReadingCard`'s semantics (reused unchanged).
