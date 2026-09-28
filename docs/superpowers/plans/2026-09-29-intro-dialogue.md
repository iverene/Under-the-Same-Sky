# Intro Dialogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play an auto-hiding boy→girl dialogue beside the stargazers' heads right after the splash fades.

**Architecture:** New presentational overlay `IntroDialogue.jsx` projects two 3D head anchors to screen coordinates each frame and positions HTML speech bubbles there; `NightSky.jsx` mounts it once per page load after `ready && !splashVisible` and unmounts on done/dismiss.

**Tech Stack:** React 19, @react-three/fiber 9 (Canvas already mounted), three 0.182 (`Vector3.project`), Tailwind 4 (existing glass-card styling).

## Global Constraints

- Copy is exact: boy "Our stories may be different, but we're under the same sky." / girl "And sometimes, knowing we're not alone is enough to keep going."
- Timing is boy ~0-4s, girl ~4-8s, fade ~1s, then unmount; tap/X skips anytime.
- Plays every page load after splash (no localStorage gate).
- No backend changes; no changes to `Stargazers` geometry or `TeamModal` trigger.
- Bubbles are `pointer-events-none` except the close button; `aria-live="polite"`; honor `prefers-reduced-motion`.
- No test runner exists in `frontend/package.json` (scripts: dev/build/lint/preview only) — verification is `npm run lint`, `npm run build`, plus manual browser checks. Do not add test infrastructure.

---

### Task 1: IntroDialogue component with phase timing (static positions first)

**Files:**
- Create: `frontend/src/components/sky/IntroDialogue.jsx`
- Test: manual browser check (no test runner in repo)

**Interfaces:**
- Consumes: nothing from other tasks (props only: `onDone: () => void`).
- Produces: `IntroDialogue({ onDone })` — renders boy bubble in phase `boy`, girl bubble in phase `girl`, fades out in phase `leaving`, calls `onDone()` after fade. Later tasks add positioning props without changing this phase contract.

- [ ] **Step 1: Create the component with phase timers**

Create `frontend/src/components/sky/IntroDialogue.jsx`:

```jsx
import { useEffect, useState } from 'react';

export const BOY_LINE = "Our stories may be different, but we're under the same sky.";
export const GIRL_LINE = "And sometimes, knowing we're not alone is enough to keep going.";

const IntroDialogue = ({ onDone, boyStyle, girlStyle }) => {
  const [phase, setPhase] = useState('boy');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('girl'), 4000);
    const t2 = setTimeout(() => setPhase('leaving'), 8000);
    const t3 = setTimeout(() => onDone && onDone(), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-40">
      <div
        style={boyStyle}
        className={`absolute max-w-[220px] rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3 text-xs font-serif italic text-slate-200 shadow-[0_0_30px_rgba(150,180,255,0.2)] transition-opacity duration-1000 ${phase === 'boy' ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-[9px] not-italic font-sans font-bold uppercase tracking-[0.25em] text-blue-200">Boy</p>
        <p className="mt-1">{BOY_LINE}</p>
      </div>
      <div
        style={girlStyle}
        className={`absolute max-w-[220px] rounded-2xl border border-pink-200/20 bg-slate-950/80 backdrop-blur-xl px-4 py-3 text-xs font-serif italic text-slate-200 shadow-[0_0_30px_rgba(255,180,220,0.2)] transition-opacity duration-1000 ${phase === 'girl' ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-[9px] not-italic font-sans font-bold uppercase tracking-[0.25em] text-pink-200">Girl</p>
        <p className="mt-1">{GIRL_LINE}</p>
      </div>
      <button
        type="button"
        aria-label="Skip introduction"
        onClick={() => onDone && onDone()}
        className="pointer-events-auto absolute top-16 right-4 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300 hover:text-white"
      >
        Skip
      </button>
    </div>
  );
};

export default IntroDialogue;
```

- [ ] **Step 2: Lint the new file**

Run: `npm run lint -- src/components/sky/IntroDialogue.jsx` (from `frontend/`)
Expected: no errors.

- [ ] **Step 3: Fix lint issues if any, re-run until clean**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/sky/IntroDialogue.jsx
git commit -m "feat: add intro dialogue bubbles with phase timing"
```

### Task 2: Project head anchors to screen positions

**Files:**
- Modify: `frontend/src/components/sky/IntroDialogue.jsx`
- Test: manual browser check (bubbles sit beside correct heads on desktop + mobile widths)

**Interfaces:**
- Consumes: `DECK_X`, `DECK_Z`, `FLAT_Y` from `frontend/src/three/terrain.js`; live `THREE.Camera` via new required prop `camera`.
- Produces: `IntroDialogue({ onDone, camera })` — internally computes `boyStyle`/`girlStyle` (`{left, top}` px, clamped to viewport). NightSky passes `camera` (Task 3); `boyStyle`/`girlStyle` props from Task 1 are removed.

- [ ] **Step 1: Add projection logic**

Replace the `boyStyle`/`girlStyle` props with internally computed positions. Add to `IntroDialogue.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { DECK_X, DECK_Z, FLAT_Y } from '../../three/terrain';

const headAnchors = () => ({
  // Must match Foreground.jsx Stargazers offsets: girl x -0.5 head y ~1.52, boy x +0.5 head y ~1.58, deck top ~ FLAT_Y + 0.35
  girl: new THREE.Vector3(DECK_X - 0.5, FLAT_Y + 0.35 + 1.52, DECK_Z + 0.05),
  boy: new THREE.Vector3(DECK_X + 0.5, FLAT_Y + 0.35 + 1.58, DECK_Z + 0.05),
});
```

Track positions with `requestAnimationFrame` while mounted:

```jsx
const [pos, setPos] = useState({ bx: 0, by: 0, gx: 0, gy: 0, visible: false });
useEffect(() => {
  if (!camera) return;
  let raf = 0;
  const v = new THREE.Vector3();
  const { girl, boy } = headAnchors();
  const tick = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const project = (p) => {
      v.copy(p).project(camera);
      return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, behind: v.z > 1 };
    };
    const b = project(boy), g = project(girl);
    const clamp = (x, y) => ({ x: Math.min(Math.max(x, 90), w - 90), y: Math.min(Math.max(y, 80), h - 120) });
    const bc = clamp(b.x + 90, b.y - 60), gc = clamp(g.x - 90, g.y - 60);
    setPos({ bx: bc.x, by: bc.y, gx: gc.x, gy: gc.y, visible: !b.behind && !g.behind });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}, [camera]);
```

Then derive styles (hide whole overlay when `!pos.visible`):

```jsx
const boyStyle = { left: pos.bx, top: pos.by, transform: 'translate(-50%, -100%)' };
const girlStyle = { left: pos.gx, top: pos.gy, transform: 'translate(-50%, -100%)' };
```

Fallback when `camera` is null: skip the rAF loop and use `{ left: '70%', top: '30%' }` / `{ left: '30%', top: '30%' }`.

- [ ] **Step 2: Lint and build**

Run: `npm run lint -- src/components/sky/IntroDialogue.jsx` then `npm run build` (from `frontend/`)
Expected: lint clean, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sky/IntroDialogue.jsx
git commit -m "feat: anchor intro bubbles beside stargazer heads"
```

### Task 3: Wire into NightSky after splash with dismiss + reduced motion

**Files:**
- Modify: `frontend/src/components/NightSky.jsx:123-152` (splash state area) and overlay render area near `frontend/src/components/NightSky.jsx:581` (`TopBar`).

**Interfaces:**
- Consumes: `IntroDialogue({ onDone, camera })` from Task 2. Camera ref: `controlsRef.current?.object` is the live camera (OrbitControls owns it); pass it at render time, may be null on first frames (fallback covers it).
- Produces: intro shows once per mount when `ready && !splashVisible && showIntro`, unmounts on done. No exports.

- [ ] **Step 1: Add state and render the overlay**

In `NightSky.jsx`, add near `splashVisible` state:

```jsx
const [showIntro, setShowIntro] = useState(true);
const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
```

Render above `{!uiHidden && <TopBar />}`:

```jsx
{ready && !splashVisible && showIntro && (
  <IntroDialogue camera={controlsRef.current?.object ?? null} onDone={() => setShowIntro(false)} />
)}
```

Dismiss on canvas tap during intro: in the existing root `onPointerDown`, add `setShowIntro(false)` only when intro is showing (guard with a ref or check `showIntro` via functional update — simplest: call `setShowIntro(false)` unconditionally there is wrong because it would kill nothing later; instead gate: `if (showIntroRef.current) ...`). Minimal correct approach:

```jsx
const showIntroRef = useRef(true);
showIntroRef.current = showIntro;
// inside onPointerDown handler:
if (showIntroRef.current) setShowIntro(false);
```

`prefersReduced` is documented for motion only: bubbles still show (no camera nudge exists in this design, so no further code needed — keep the variable only if used; if unused, drop it to satisfy lint).

- [ ] **Step 2: Lint and build**

Run: `npm run lint` then `npm run build` (from `frontend/`)
Expected: both pass.

- [ ] **Step 3: Manual verification (required, no test runner)**

1. `npm run dev`, load page: after splash, boy bubble appears beside right figure (~4s), then girl bubble beside left figure (~4s), then both fade and free explore resumes.
2. Click Skip / tap canvas: intro dismisses immediately, couple click still opens TeamModal.
3. Resize to 390px width: bubbles stay on-screen, text readable.
4. `prefers-reduced-motion` emulated: bubbles still show, no camera motion forced.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/NightSky.jsx
git commit -m "feat: auto-play intro dialogue after splash"
```
