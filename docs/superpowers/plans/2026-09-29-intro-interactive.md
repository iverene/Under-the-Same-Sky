# Interactive Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the intro tactile (tap-advance, typewriter text) with clean modules, and pause the hidden 3D render loop until Start.

**Architecture:** New `useTypewriter` hook and `Couple` figure module keep `IntroScreen` as pure flow (pair, phases, tap routing, fade); tap advances never regress against fallback timers; Canvas `frameloop` pauses while the opaque intro covers it, with a one-frame warmup on mount.

**Tech Stack:** React 19, Tailwind 4 (existing `modal-fade` keyframes, `animate-pulse`, `sr-only` utilities), @react-three/fiber 9 (`frameloop`, `useThree`).

## Global Constraints

- Dialogue copy is the existing 7-pair pool verbatim — no copy changes. Timing fallback unchanged (boy→girl 4.2s, girl→ready 8.4s).
- Tap anywhere except buttons advances; tapping mid-typing completes the line first; `ready` taps do nothing.
- Typewriter ~28ms/char with blinking caret; instant full text when reduced-motion; screen readers hear each line once.
- No sound of any kind. No backend changes. No test runner exists — verification is `npx eslint` on touched files, `npm run build`, plus manual browser checks. Do not add test infrastructure.
- Full-repo `npm run lint` has pre-existing errors in unrelated files — lint only touched files; never fix unrelated files. Never call `Math.random` during render (`react-hooks/purity`).

---

### Task 1: useTypewriter hook + Couple figure module

**Files:**
- Create: `frontend/src/components/sky/useTypewriter.js`
- Create: `frontend/src/components/sky/Couple.jsx`
- Test: `npx eslint` on both files (no test runner; render checks in Task 2)

**Interfaces:**
- Consumes: nothing.
- Produces: `useTypewriter(text, { active = true, speed = 28, reduceMotion = false })` → `{ shown, done, complete }` (default export, hook only); `Couple.jsx` named exports `GirlFigure`, `BoyFigure` (memo components with displayNames, SVG art verbatim). Task 2 consumes both.

- [ ] **Step 1: Create the hook exactly as specified**

Create `frontend/src/components/sky/useTypewriter.js`:

```js
import { useEffect, useRef, useState } from 'react';

// Types `text` out character by character. Returns the visible slice, whether
// typing finished, and a synchronous completer for tap-to-skip.
//
// Lint note (react-hooks/set-state-in-effect is active repo-wide): resets use
// the render-phase adjustment pattern (comparing previous inputs during
// render), never synchronous setState in the effect body. Interval callbacks
// are async and permitted (same as the existing timer setState calls).
const useTypewriter = (text, { active = true, speed = 28, reduceMotion = false } = {}) => {
  const [count, setCount] = useState(() => text.length);
  const [prev, setPrev] = useState({ text, active, reduceMotion });
  if (prev.text !== text || prev.active !== active || prev.reduceMotion !== reduceMotion) {
    setPrev({ text, active, reduceMotion });
    setCount(reduceMotion || !active ? text.length : 0);
  }
  const timer = useRef(null);

  useEffect(() => {
    if (reduceMotion || !active) return;
    timer.current = setInterval(() => {
      setCount((c) => {
        if (c + 1 >= text.length) {
          clearInterval(timer.current);
          return text.length;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(timer.current);
  }, [text, active, speed, reduceMotion]);

  const complete = () => {
    clearInterval(timer.current);
    setCount(text.length);
  };

  return { shown: text.slice(0, count), done: count >= text.length, complete };
};

export default useTypewriter;
```

- [ ] **Step 2: Create Couple.jsx by moving the figures verbatim**

Create `frontend/src/components/sky/Couple.jsx`: copy `GirlFigure` and `BoyFigure` (including `memo`, `displayName`, and every SVG attribute) verbatim out of `frontend/src/components/sky/IntroScreen.jsx` (read the current file first — lines ~24-53), changing only the export form:

```jsx
import { memo } from 'react';

export const GirlFigure = memo(() => (
  /* ... verbatim girl SVG ... */
));
GirlFigure.displayName = 'GirlFigure';

export const BoyFigure = memo(() => (
  /* ... verbatim boy SVG ... */
));
BoyFigure.displayName = 'BoyFigure';
```

Do not restyle, resize, or reorder any SVG element.

- [ ] **Step 3: Lint both files**

Run from `frontend/`: `npx eslint src/components/sky/useTypewriter.js src/components/sky/Couple.jsx`
Expected: clean, zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/sky/useTypewriter.js frontend/src/components/sky/Couple.jsx
git commit -m "feat: typewriter hook and intro couple figures"
```

### Task 2: Tap machine + typewriter rendering in IntroScreen

**Files:**
- Modify: `frontend/src/components/sky/IntroScreen.jsx` (read the full current 214-line file first)
- Test: manual browser checks below (required)

**Interfaces:**
- Consumes: `useTypewriter`, `{ GirlFigure, BoyFigure }`, pool helpers (Task 1 + existing).
- Produces: tap-advance flow with typed bubbles. Nothing downstream (Task 3 touches NightSky/Canvas only).

- [ ] **Step 1: Swap figure imports, add hook + tap routing**

In `frontend/src/components/sky/IntroScreen.jsx`:
1. Delete the local `GirlFigure`/`BoyFigure` definitions (now in Couple.jsx) and the `memo` import if unused elsewhere; add `import { GirlFigure, BoyFigure } from './Couple';` and `import useTypewriter from './useTypewriter';`.
2. After the phase timers, add per-line typewriters:

```jsx
  const boyType = useTypewriter(pair.boy, {
    active: phase === 'boy',
    speed: 28,
    reduceMotion: prefersReducedMotion,
  });
  const girlType = useTypewriter(pair.girl, {
    active: phase === 'girl',
    speed: 28,
    reduceMotion: prefersReducedMotion,
  });

  // Tap anywhere except buttons: complete the typing line first,
  // otherwise advance boy -> girl -> ready. Absolute-phase timers can
  // never regress a manual advance.
  const advanceFromTap = (e) => {
    if (e.target.closest?.('button')) return;
    if (phase === 'boy') {
      if (!boyType.done) boyType.complete();
      else setPhase('girl');
    } else if (phase === 'girl') {
      if (!girlType.done) girlType.complete();
      else setPhase('ready');
    }
  };
```

3. Attach `onClick={advanceFromTap}` to the root intro `div` (the one with `aria-live="polite"`).
4. Replace each bubble's text `<p>` with the typed version (boy bubble shown; girl identical with `girlType`/`pair.girl`):

```jsx
            <p className="mt-1 leading-relaxed text-slate-100">
              <span aria-hidden="true">
                {boyType.shown}
                {!boyType.done && <span className="animate-pulse">▍</span>}
              </span>
              <span className="sr-only">{pair.boy}</span>
            </p>
```

5. Add the discoverability hint inside the action-buttons container, above the Skip/Start area (renders only while dialogue phases are active):

```jsx
        {phase !== 'ready' && (
          <p
            aria-hidden
            className="text-[10px] uppercase tracking-[0.3em] text-slate-500"
            style={{ animation: 'modal-fade 0.8s ease-out 1.5s both' }}
          >
            Tap anywhere to continue
          </p>
        )}
```

`modal-fade` is an existing keyframe in `src/index.css` — do not add CSS.

- [ ] **Step 2: Lint and build**

From `frontend/`: `npx eslint src/components/sky/IntroScreen.jsx src/components/sky/Couple.jsx src/components/sky/useTypewriter.js` (zero errors), then `npm run build` (succeeds).

- [ ] **Step 3: Manual verification (required, no test runner)**

Run `npm run dev`, report pass/fail per item:
1. Boy line types out char by char with blinking caret; tap mid-typing completes it; next tap shows girl typing.
2. Idle (no taps): boy→girl→button still auto-advance on the old timers.
3. Tapping Skip/Start buttons never double-advances (button actions fire once).
4. Screen-reader text present (DevTools: `sr-only` spans hold full lines; `aria-hidden` on typed spans).
5. Reduced-motion emulated: full lines appear instantly, no caret.
6. 390px width unchanged and readable.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/sky/IntroScreen.jsx
git commit -m "feat: tap-to-advance intro with typewriter dialogue"
```

### Task 3: Pause hidden 3D loop until Start (performance)

**Files:**
- Modify: `frontend/src/components/NightSky.jsx` (Canvas props + tiny warmup component)
- Test: manual perf check below

**Interfaces:**
- Consumes: `showIntro` state (already in NightSky).
- Produces: zero GPU/CPU render-loop cost while the opaque intro covers the scene; identical post-Start behavior.

- [ ] **Step 1: Gate frameloop on intro + one-frame warmup**

In `frontend/src/components/NightSky.jsx`:
1. Extend the fiber import: `import { Canvas, useThree } from '@react-three/fiber';` (check the current import line first — add `useThree` to it).
2. Define at module scope (above the `NightSky` component, after imports):

```jsx
// Renders a single frame on mount so shaders and textures are warm while the
// opaque intro covers the screen; the loop itself stays paused until Start.
const SceneWarmup = () => {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
};
```

`useEffect` is already imported in NightSky.jsx — verify before adding.
3. Canvas gets `frameloop={showIntro ? 'never' : 'always'}` (add beside the existing `camera` prop) and `<SceneWarmup />` as its first child (before the atmosphere color/fog lines).
4. Do not touch anything else: autoRotate, controls, reset, and gate logic stay exactly as they are.

- [ ] **Step 2: Lint and build**

From `frontend/`: `npx eslint src/components/NightSky.jsx` (zero new errors vs baseline), then `npm run build` (succeeds).

- [ ] **Step 3: Manual verification (required)**

Run `npm run dev`, report pass/fail:
1. During intro: scene behind is exactly the opening frame (no drift — loop paused); GPU idle in task manager/devtools.
2. Click Start: fade lifts onto the opening frame with no long hitch (warmup did its job), auto-pan eases in.
3. Reset/drag/zoom/modals all behave exactly as before (untouched paths).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/NightSky.jsx
git commit -m "perf: pause 3D loop behind intro until Start"
```
