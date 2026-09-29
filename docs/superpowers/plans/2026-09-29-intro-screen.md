# Intro Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3D-bubble intro with a fullscreen 2D intro scene (couple, head bubbles, Start Exploring) that fades into the fully original 3D setup.

**Architecture:** New self-contained `IntroScreen.jsx` (opaque overlay: gradient sky, seeded stars, moon, inline SVG couple, fixed-layout head bubbles, phase timers, Start/skip, self-fade) mounted by NightSky after the splash; all dialogue-era camera/reset machinery reverted to original code paths; `IntroDialogue.jsx` deleted.

**Tech Stack:** React 19, Tailwind 4, existing hand-rolled keyframes in `src/index.css` (reuse `splashStar`, `modal-pop`; no new CSS needed).

## Global Constraints

- Dialogue copy is the existing 7-pair pool verbatim — no copy changes.
- Timing: boy ~0-4s, girl ~4-8s, then Start Exploring button (no auto-dismiss; waits for click); Start fades everything ~1s, then unmount.
- Post-fade 3D setup is byte-identical to the pre-dialogue original (position, target, autoRotate 0.3 always, controls enabled, original handlers).
- Reset is pure: `clearProps()` + `setHomeSignal(s+1)` only.
- After implementation, `grep -rn "pendingIntroRef\|introHold\|onHomed\|setHoming\|handleHomed\|HOME_TARGET\|introRun\|IntroDialogue" frontend/src` returns zero matches.
- No backend changes; no test runner exists — verification is `npx eslint` on touched files, `npm run build`, plus manual browser checks. Do not add test infrastructure.
- Full-repo `npm run lint` has pre-existing errors in unrelated files — lint only touched files; never fix unrelated files. `Math.random` during render trips `react-hooks/purity` — use the seeded helper below, never `Math.random` in render.

---

### Task 1: Fullscreen IntroScreen component

**Files:**
- Create: `frontend/src/components/sky/IntroScreen.jsx`
- Test: manual browser checks in Task 2 (component renders standalone; verified live after wiring)

**Interfaces:**
- Consumes: `POOL`, `FALLBACK_PAIR`, `randomDialogueIndex` from `./introDialogues` (already exists — read it to confirm names).
- Produces: `IntroScreen({ onStart })` — default export only (no other exports: `react-refresh/only-export-components`). Task 2 renders `{ready && !splashVisible && showIntro && <IntroScreen onStart={handleIntroStart} />}`.

- [ ] **Step 1: Create the component exactly as specified**

Create `frontend/src/components/sky/IntroScreen.jsx` with this content (copy exactly; only adjust if eslint demands):

```jsx
import { useEffect, useState } from 'react';
import { POOL, FALLBACK_PAIR, randomDialogueIndex } from './introDialogues';

// Deterministic star layout: stable across renders without calling the
// impure Math.random during render (react-hooks/purity forbids it).
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rand = mulberry32(20260929);
const STARS = Array.from({ length: 90 }, () => ({
  x: rand() * 100,
  y: rand() * 62,
  size: rand() * 2 + 1,
  delay: rand() * 4,
  dur: 2 + rand() * 3,
}));

const bubbleCls =
  'absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 sm:w-56 rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-xl px-4 py-3 text-xs sm:text-sm font-serif italic text-slate-200 shadow-[0_0_30px_rgba(150,180,255,0.2)] transition-opacity duration-1000';

const IntroScreen = ({ onStart }) => {
  const [pair] = useState(() => POOL[randomDialogueIndex(-1)] || FALLBACK_PAIR);
  const [phase, setPhase] = useState('boy');
  const [leaving, setLeaving] = useState(false);
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('girl'), 4000);
    const t2 = setTimeout(() => setPhase('ready'), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const skipToButton = () => setPhase('ready');
  const handleStart = () => {
    setLeaving(true);
    setTimeout(() => onStart && onStart(), reduceMotion ? 0 : 1000);
  };

  return (
    <div
      aria-live="polite"
      className={`fixed inset-0 z-40 overflow-hidden bg-[#020205] transition-opacity duration-1000 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop: gradient wash, twinkling stars, moon glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,#1b2340_0%,#020205_65%)]" aria-hidden />
      <div className="absolute inset-0" aria-hidden>
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              animation: reduceMotion ? undefined : `splashStar ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>
      <div
        aria-hidden
        className="absolute top-[10%] right-[16%] h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-amber-50 to-yellow-100 shadow-[0_0_80px_rgba(255,250,205,0.25)]"
      />

      {/* Couple: original inline SVG echoing the 3D stargazers */}
      <div className="absolute inset-x-0 bottom-[16%] flex items-end justify-center gap-10 sm:gap-14">
        {/* Girl (left, dress) */}
        <div className="relative">
          <div
            className={`transition-opacity duration-1000 ${phase === 'girl' ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className={bubbleCls}>
              <p className="font-sans text-[9px] font-bold uppercase not-italic tracking-[0.25em] text-pink-200">
                Girl
              </p>
              <p className="mt-1">{pair.girl}</p>
            </div>
          </div>
          <svg width="86" height="150" viewBox="0 0 86 150" role="img" aria-label="Girl stargazer">
            <ellipse cx="43" cy="144" rx="30" ry="6" fill="#000" opacity="0.5" />
            <path d="M43 62 L28 118 L58 118 Z" fill="#8a4f6e" />
            <rect x="36" y="46" width="14" height="20" rx="5" fill="#8a4f6e" />
            <circle cx="43" cy="36" r="11" fill="#eab88f" />
            <path d="M32 34 a11 11 0 0 1 22 0 l0 -4 a11 8 0 0 0 -22 0" fill="#4a2c1a" />
            <rect x="30" y="40" width="26" height="26" rx="9" fill="none" stroke="#4a2c1a" strokeWidth="5" />
            <rect x="24" y="66" width="8" height="26" rx="4" fill="#8a4f6e" />
            <rect x="54" y="52" width="8" height="26" rx="4" fill="#8a4f6e" transform="rotate(-24 58 56)" />
          </svg>
          <p className="mt-2 text-center font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-pink-200/80">
            Girl
          </p>
        </div>
        {/* Boy (right, jacket) */}
        <div className="relative">
          <div
            className={`transition-opacity duration-1000 ${phase === 'boy' ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className={bubbleCls}>
              <p className="font-sans text-[9px] font-bold uppercase not-italic tracking-[0.25em] text-blue-200">
                Boy
              </p>
              <p className="mt-1">{pair.boy}</p>
            </div>
          </div>
          <svg width="86" height="150" viewBox="0 0 86 150" role="img" aria-label="Boy stargazer">
            <ellipse cx="43" cy="144" rx="30" ry="6" fill="#000" opacity="0.5" />
            <rect x="30" y="96" width="11" height="44" rx="4" fill="#26304a" />
            <rect x="45" y="96" width="11" height="44" rx="4" fill="#26304a" />
            <rect x="29" y="58" width="28" height="42" rx="7" fill="#3a5a8c" />
            <circle cx="43" cy="44" r="12" fill="#d99f6e" />
            <path d="M31 42 a12 12 0 0 1 24 0 l0 -3 a12 8 0 0 0 -24 0" fill="#241a12" />
            <rect x="21" y="62" width="9" height="30" rx="4.5" fill="#3a5a8c" />
            <rect x="56" y="62" width="9" height="30" rx="4.5" fill="#3a5a8c" />
          </svg>
          <p className="mt-2 text-center font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-blue-200/80">
            Boy
          </p>
        </div>
      </div>

      {/* Start button replaces the dialogue; Skip jumps straight here */}
      <div className="absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-3">
        {phase === 'ready' && !leaving && (
          <button
            type="button"
            onClick={handleStart}
            autoFocus
            className="modal-pop rounded-full border border-white/20 bg-white/10 px-8 py-3 font-sans text-xs font-bold uppercase tracking-[0.3em] text-white backdrop-blur-xl transition-colors hover:bg-white/20"
          >
            Start Exploring
          </button>
        )}
        {phase !== 'ready' && (
          <button
            type="button"
            onClick={skipToButton}
            aria-label="Skip introduction"
            className="text-[11px] uppercase tracking-[0.3em] text-slate-400 transition-colors hover:text-white"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

export default IntroScreen;
```

Note: each bubble sits above its own speaker (boy line above the boy figure, girl line above the girl figure); the boy still speaks first per the phase timers. Keep exactly as written.

- [ ] **Step 2: Lint the new file**

Run from `frontend/`: `npx eslint src/components/sky/IntroScreen.jsx`
Expected: clean, zero errors.

- [ ] **Step 3: Fix lint issues if any, re-run until clean**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/sky/IntroScreen.jsx
git commit -m "feat: fullscreen 2D intro screen with couple dialogue"
```

### Task 2: Wire IntroScreen, revert camera/reset, delete bubbles

**Files:**
- Modify: `frontend/src/components/NightSky.jsx` (import, state, handlers, controls, gate, reset)
- Modify: `frontend/src/three/terrain.js` (restore original HOME_POS, delete HOME_TARGET)
- Modify: `frontend/src/components/sky/Rigs.jsx` (remove introHold/onHomed)
- Delete: `frontend/src/components/sky/IntroDialogue.jsx` (`git rm`)
- Keep: `introDialogues.json`, `introDialogues.js` (consumed by IntroScreen)

**Interfaces:**
- Consumes: `IntroScreen({ onStart })` from Task 1.
- Produces: original 3D behavior + intro gate. Nothing downstream.

- [ ] **Step 1: Revert terrain.js to the exact original**

Replace the HOME_POS/HOME_TARGET block with the byte-exact original:

```js
// Seated eye position: behind the (human-scale) bench seat
export const HOME_POS = new THREE.Vector3(BENCH_X, groundHeight(BENCH_X, BENCH_Z + 4.5) + 1.45, BENCH_Z + 4.5);
```

Delete the `HOME_TARGET` export and its comment entirely.

- [ ] **Step 2: Revert Rigs.jsx CameraRig to the exact original**

Signature back to `export const CameraRig = ({ controlsRef, focusPoint, focusCam, flightRef, homeSignal }) => {`. Arrival block back to:

```js
      if (camera.position.distanceTo(HOME_POS) < 0.15) {
        flightRef.current.homingCam = false;
      }
      return;
```

Free-explore else branch back to:

```js
    } else {
      // Free explore: nothing yanks the camera or target (no auto-reset).
      // Closing a card or picking another object never moves your POV —
      // only the reset button glides you home.
      controls.autoRotate = true;
    }
```

Import back to `import { HOME_POS, groundHeight } from '../../three/terrain';`. The `homeTarget` memo `new THREE.Vector3(0, 1, 0)` stays as it was originally.

- [ ] **Step 3: Rewire NightSky.jsx to IntroScreen + original behavior**

Make exactly these edits (read each region first):
1. Import line back to `import { BENCH_FOCUS, HOME_POS, OVERLOOK, SIGN_CAM, DECK_FOCUS } from '../three/terrain';` and add `import IntroScreen from './sky/IntroScreen';`. No `randomDialogueIndex` import (the pick lives in IntroScreen now).
2. Replace the whole intro state block (`showIntroRef`, `introRun`, `pendingIntroRef`, `homing`, `handleIntroDone`, `handleHomed`) with:

```jsx
  const [showIntro, setShowIntro] = useState(true);
  const handleIntroStart = useCallback(() => setShowIntro(false), []);
```

3. Restore the original pointer handler (delete the early return and pending/homing lines):

```jsx
      onPointerDown={(e) => {
        downPos.current = [e.clientX, e.clientY];
        flightRef.current.flying = false; // grabbing the scene cancels any flight
        flightRef.current.homingCam = false;
      }}
```

4. CameraRig usage back to `<CameraRig controlsRef={controlsRef} focusPoint={focusPoint} focusCam={focusCam} flightRef={flightRef} homeSignal={homeSignal} />`. OrbitControls: `target={[0, 1, 0]}`, delete the `enabled` prop, keep `autoRotate={true}` `autoRotateSpeed={0.3}`.
5. Render gate back to `{ready && !splashVisible && showIntro && (<IntroScreen onStart={handleIntroStart} />)}` (keep its position above TopBar).
6. Reset handler back to:

```jsx
        onReset={() => {
          clearProps();
          setHomeSignal((s) => s + 1);
        }}
```

- [ ] **Step 4: Delete the bubble component + verify zero references**

```bash
git rm frontend/src/components/sky/IntroDialogue.jsx
```

Then run from the repo root (PowerShell): `Select-String -Path "frontend/src" -Pattern "pendingIntroRef|introHold|onHomed|setHoming|handleHomed|HOME_TARGET|introRun|IntroDialogue" -Recurse` — must return zero matches. (The string `IntroDialogue` will still match docs/specs — restrict to `frontend/src` only.)

- [ ] **Step 5: Lint and build**

From `frontend/`: `npx eslint src/components/NightSky.jsx src/components/sky/Rigs.jsx src/three/terrain.js src/components/sky/IntroScreen.jsx` — zero new errors versus the pre-existing baseline. Then `npm run build` — succeeds.

- [ ] **Step 6: Manual verification (required, no test runner)**

Run `npm run dev`, report pass/fail per item:
1. Load: splash → opaque intro screen (gradient, stars, moon, centered SVG couple, boy bubble 4s → girl bubble 4s) with the 3D scene hidden behind it.
2. Skip jumps straight to Start Exploring; Start fades everything ~1s into free explore with camera panning immediately (drag/zoom live).
3. Reload 3+ times: different pairs across reloads.
4. Reset: silent glide home, no dialogue, no replay; pressing reset mid-anything never shows intro.
5. 390px width: figures centered, bubbles above heads without overlap, button reachable.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/NightSky.jsx frontend/src/three/terrain.js frontend/src/components/sky/Rigs.jsx frontend/src/components/sky/IntroDialogue.jsx
git commit -m "feat: intro screen gate with original camera setup"
```
