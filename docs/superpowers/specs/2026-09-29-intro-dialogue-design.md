# Intro Dialogue Design — Stargazer Conversation

## Context
Under the Same Sky opens on a 3D night-sky hilltop (`frontend/src/components/NightSky.jsx`) with a stargazing couple (`frontend/src/components/sky/Foreground.jsx` → `Stargazers`: girl left pointing, boy right). Splash overlay fades after ~1.2–2.5s (`ready` / `splashVisible`). Request: at the beginning, boy and girl exchange two lines, text shown beside their heads.

Lines (final copy):
- Boy: "Our stories may be different, but we're under the same sky."
- Girl: "And sometimes, knowing we're not alone is enough to keep going."

## Decisions (from brainstorming)
- Timing: after splash, auto-play every load (no localStorage gate).
- Flow: sequential + auto-hide.
- Rendering: projected HTML labels (not in-scene 3D sprites, not bottom visual-novel bar).
- Visual companion: declined by user.

## Section 1 — Flow & timing (approved)
1. Splash fades (`ready=true`, `splashVisible=false`) → intro starts.
2. Camera holds near couple (no forced flight if user grabs controls; grabbing cancels glide via existing `flightRef`).
3. Boy bubble visible ~0–4s.
4. Girl bubble visible ~4–8s.
5. Fade out ~1s, free explore resumes.
6. Tap anywhere outside bubbles or X button skips/dismisses immediately.
7. Plays once per page mount.

## Section 2 — Components & rendering (approved)
- New component: `frontend/src/components/sky/IntroDialogue.jsx`.
  - Props: `active`, `onDone`, `camera`, `size` (viewport).
  - Internal phase state: `boy` → `girl` → `done` via timers (4000ms each + 1000ms fade).
  - Anchors: derive from `DECK_X`, `DECK_Z` (`src/three/terrain.js`) + deck top height + head offsets (girl ≈ `[-0.5, top+1.52, 0.05]`, boy ≈ `[+0.5, top+1.58, 0.05]`). Project with `THREE.Vector3.project(camera)` each frame.
  - Bubbles: absolute-positioned HTML, offset to the side of each head (boy right, girl left), `pointer-events-none` except close button, Tailwind glass style matching `ReadingCard`.
  - Hides when behind camera (`z > 1`) or when `!active`.
- Wiring in `NightSky.jsx`:
  - Render `<IntroDialogue active={ready && !splashVisible && showIntro} />` above Canvas, below TopBar/HUD.
  - `showIntro` local state, `onDone` sets false.
  - No changes to `Stargazers` geometry, `CameraRig`, or backend.
- Accessibility: `aria-live="polite"`, focus not stolen, close button labelled, `prefers-reduced-motion` skips camera nudge.
- Mobile: bubbles `max-w-[220px]`, `text-xs`, offsets clamp to viewport edges.

## Data flow
Splash timers → `ready` → `IntroDialogue` mounts → timers drive `phase` → CSS opacity transitions → `onDone` unmounts. Projection runs in `useFrame`-equivalent (`requestAnimationFrame`) reading live camera. No API calls, no persistence.

## Error handling
- WebGL/camera unavailable → bubbles fall back to fixed left/right positions.
- User drags during intro → intro keeps playing (non-blocking) unless dismissed.
- Reduced motion → no camera suggestion, bubbles still show.

## Testing
- Manual: load page, verify boy then girl bubble beside correct heads, auto-hide ~9s, tap skips, resize keeps bubbles on-screen.
- No backend tests. Optional vitest for phase timing if test setup exists.

## Out of scope
- Voice audio, lip sync, head animation changes.
- First-visit-only gating, i18n, backend storage of dialogue.
- Changes to TeamModal trigger (couple click still opens team modal after intro).
