# Intro Hold + Variations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hold the camera still during the intro dialogue and play a random dialogue variation per load, replayed with a new variation on HUD reset.

**Architecture:** Dialogue pool moves to `introDialogues.json`; `IntroDialogue` takes a `dialogueIndex` prop and blocks canvas input while mounted; `CameraRig` damps `autoRotateSpeed` to 0 on a new `introHold` prop instead of fighting its per-frame `autoRotate = true`; `NightSky` owns the `introRun` index, disables controls during intro, and replays on reset.

**Tech Stack:** React 19, @react-three/fiber 9, three 0.182 (`MathUtils.damp`, `Vector3.project`), Tailwind 4, Vite JSON imports.

## Global Constraints

- Dialogue copy is verbatim from the spec (7 pairs, curly punctuation preserved); the duplicated user pair is stored once.
- Timing unchanged: boy ~0-4s, girl ~4-8s, fade ~1s, then unmount.
- No forced camera moves at any point; speed damps 0.3 → 0 during intro and back after (~1s each way).
- While intro shows: no orbit/zoom/pan input, no canvas-tap select or dismiss; Skip button is the only manual exit; timers still auto-finish.
- Reset replays with a variation different from the just-played one (when pool > 1); existing reset behavior (clear selection, glide home) unchanged.
- No backend changes; no test runner exists — verification is `npx eslint` on touched files, `npm run build`, plus manual browser checks. Do not add test infrastructure.
- Full-repo `npm run lint` has pre-existing errors in unrelated files — compare before/after or lint only touched files; never fix unrelated files.

---

### Task 1: Dialogue pool JSON + indexed IntroDialogue

**Files:**
- Create: `frontend/src/components/sky/introDialogues.json`, `frontend/src/components/sky/introDialogues.js` (pool helper module — non-component exports live here per `react-refresh/only-export-components`)
- Modify: `frontend/src/components/sky/IntroDialogue.jsx` (default component export only)
- Test: manual (pool renders; verified live in Task 3)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `introDialogues.json` (array of `{ "boy": string, "girl": string }`, 7 entries); `introDialogues.js` exporting `POOL`, `FALLBACK_PAIR`, `randomDialogueIndex(exclude = -1): number` (`Math.random`-based, never returns `exclude` when pool length > 1, falls back to 0); `IntroDialogue({ onDone, camera, dialogueIndex })` with no non-component exports. `BOY_LINE`/`GIRL_LINE` exports are REMOVED — Task 3 imports `randomDialogueIndex` from `./introDialogues` instead.

- [ ] **Step 1: Create the JSON pool with exact copy**

Create `frontend/src/components/sky/introDialogues.json`:

```json
[
  { "boy": "Our stories may be different, but we're under the same sky.", "girl": "And sometimes, knowing we're not alone is enough to keep going." },
  { "boy": "The moon is beautiful, isn't it?", "girl": "It is… especially when I'm looking at it with you." },
  { "boy": "What happens when someone finally shares what they've been carrying?", "girl": "Maybe their voice becomes a light for someone else." },
  { "boy": "Every star up there holds someone's story.", "girl": "Then tonight, let's make sure every voice is heard." },
  { "boy": "Do you think someone out there is listening?", "girl": "Maybe—that's why we leave our words among the stars." },
  { "boy": "What are you wishing for?", "girl": "A little more hope for tomorrow." },
  { "boy": "What if you could send one thing into the night?", "girl": "I'd send the words I never found the courage to say." }
]
```

Note: entry 1 uses straight apostrophes (existing code copy); entries 2-7 use the user's curly punctuation verbatim.

- [ ] **Step 2: Rewrite IntroDialogue for indexed pair + blocking overlay**

In `frontend/src/components/sky/IntroDialogue.jsx`, replace the `BOY_LINE`/`GIRL_LINE` constants with:

Create `frontend/src/components/sky/introDialogues.js`:

```js
import DIALOGUES from './introDialogues.json';

export const FALLBACK_PAIR = {
  boy: "Our stories may be different, but we're under the same sky.",
  girl: "And sometimes, knowing we're not alone is enough to keep going.",
};

export const POOL = Array.isArray(DIALOGUES) && DIALOGUES.length > 0 ? DIALOGUES : [FALLBACK_PAIR];

export const randomDialogueIndex = (exclude = -1) => {
  if (POOL.length <= 1) return 0;
  let i = Math.floor(Math.random() * POOL.length);
  if (i === exclude) i = (i + 1) % POOL.length;
  return i;
};
```

Change the signature to `const IntroDialogue = ({ onDone, camera, dialogueIndex }) => {` and resolve the pair at the top of the component:

```jsx
import { POOL, FALLBACK_PAIR } from './introDialogues';

const pair = POOL[dialogueIndex] || FALLBACK_PAIR;
```

Replace every `{BOY_LINE}` with `{pair.boy}` and `{GIRL_LINE}` with `{pair.girl}`. Change the overlay root class from `pointer-events-none` to `pointer-events-auto` (the component only mounts during the locked intro, so blocking canvas taps is correct; the Skip button keeps working). Keep phase timers (4000/8000/9000), projection, clamping, behind-camera hide, null-camera fallback, `aria-live="polite"` byte-for-byte in behavior.

- [ ] **Step 3: Confirm no remaining references to the removed exports**

Run from `frontend/`: `npx eslint src/components/sky/IntroDialogue.jsx` must be clean. Then search: `Select-String -Path "src" -Pattern "BOY_LINE|GIRL_LINE" -Recurse` must return zero matches (NightSky never imported them — verify, don't assume).

- [ ] **Step 4: Build**

Run from `frontend/`: `npm run build`
Expected: succeeds (the build will fail at the NightSky call site only if you broke the old prop contract — NightSky still passes only `camera`/`onDone` until Task 3; `dialogueIndex` undefined falls back to `FALLBACK_PAIR`, so the build stays green).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sky/introDialogues.json frontend/src/components/sky/introDialogues.js frontend/src/components/sky/IntroDialogue.jsx
git commit -m "feat: dialogue variation pool with indexed intro bubbles"
```

### Task 2: Smooth camera hold (rig damp + input lock)

**Files:**
- Modify: `frontend/src/components/sky/Rigs.jsx` (`CameraRig`, free-explore branch ~line 85-90)
- Modify: `frontend/src/components/NightSky.jsx:507-536` (`OrbitControls` props), `NightSky.jsx:425-433` (`onPointerDown`), `NightSky.jsx:506` (`CameraRig` props)
- Test: manual browser check (spin stops smoothly during intro, resumes after)

**Interfaces:**
- Consumes: `showIntro` state (already in NightSky).
- Produces: `CameraRig` accepts new optional prop `introHold: boolean` (undefined = false, so all existing call behavior is unchanged). No other signature changes.

- [ ] **Step 1: Damp spin speed in CameraRig**

In `frontend/src/components/sky/Rigs.jsx`, change the signature to `export const CameraRig = ({ controlsRef, focusPoint, focusCam, flightRef, homeSignal, introHold }) => {`. In the free-explore `else` branch (currently `controls.autoRotate = true;`), replace with:

```jsx
} else {
  // Free explore: nothing yanks the camera or target (no auto-reset).
  // Closing a card or picking another object never moves your POV —
  // only the reset button glides you home.
  controls.autoRotate = true;
  // Intro hold: glide the pan speed to 0 while the dialogue plays so the
  // stop and the resume both feel smooth instead of snapping.
  controls.autoRotateSpeed = THREE.MathUtils.damp(
    controls.autoRotateSpeed, introHold ? 0 : 0.3, 2.5, delta
  );
}
```

Do not touch the focus-flight branch, homing branch, failsafe, or any other rig. `THREE` is already imported in Rigs.jsx.

- [ ] **Step 2: Lock input + pass the hold flag in NightSky**

In `frontend/src/components/NightSky.jsx` make exactly these edits:
1. `<CameraRig ... />` gets `introHold={showIntro}`.
2. `<OrbitControls ... />` gets `enabled={!showIntro}` (add beside `enablePan={false}`).
3. Wrapper `onPointerDown` early-returns during intro — replace the handler body with:

```jsx
onPointerDown={(e) => {
  if (showIntroRef.current) return; // intro is fully locked: only Skip/timers exit
  downPos.current = [e.clientX, e.clientY];
  flightRef.current.flying = false; // grabbing the scene cancels any flight
  flightRef.current.homingCam = false;
}}
```

(The old `if (showIntroRef.current) setShowIntro(false);` tap-dismiss line is deleted — dead code after the early return would fail lint `no-unreachable`.)

- [ ] **Step 3: Verify HUD/TopBar stay above the overlay**

Read `frontend/src/components/HUD.jsx` and `frontend/src/components/TopBar.jsx` root classes: confirm their `z-*` is `>= 40` (overlay is `z-40`). If either is below, note it in your report as a concern (do NOT restyle them in this task — aiming for minimal diff; report DONE_WITH_CONCERNS if so).

- [ ] **Step 4: Lint and build**

Run from `frontend/`: `npx eslint src/components/NightSky.jsx src/components/sky/Rigs.jsx src/components/sky/IntroDialogue.jsx` — zero new errors versus the pre-existing baseline. Then `npm run build` — succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/NightSky.jsx frontend/src/components/sky/Rigs.jsx
git commit -m "feat: hold camera still during intro dialogue"
```

### Task 3: Reset replays intro with a new variation

**Files:**
- Modify: `frontend/src/components/NightSky.jsx:124-128` (intro state), `NightSky.jsx:599-602` (`onReset`), `NightSky.jsx:587-589` (render gate)
- Test: manual browser checks below (required)

**Interfaces:**
- Consumes: `randomDialogueIndex` from Task 1; `showIntro`/`handleIntroDone`/`showIntroRef` (existing).
- Produces: nothing downstream. Final UX: load → random pair; reset → new pair (≠ current) + replay.

- [ ] **Step 1: Own the dialogue index and replay on reset**

In `frontend/src/components/NightSky.jsx`:
1. Import: `import IntroDialogue, { randomDialogueIndex } from './sky/IntroDialogue';` (replace the existing default-only import at line 35).
2. After `handleIntroDone` (line 126), add: `const [introRun, setIntroRun] = useState(() => randomDialogueIndex(-1));`
3. Render gate becomes:

```jsx
{ready && !splashVisible && showIntro && (
  <IntroDialogue key={introRun} dialogueIndex={introRun} camera={controlsRef.current?.object ?? null} onDone={handleIntroDone} />
)}
```

4. Reset handler becomes:

```jsx
onReset={() => {
  clearProps();
  setIntroRun((i) => randomDialogueIndex(i));
  setShowIntro(true);
  setHomeSignal((s) => s + 1);
}}
```

Order matters: re-roll + reshow before the home glide signal, so the replay is armed even if the glide finishes first. `showIntroRef.current = showIntro` (line 128) already mirrors every render — no change needed there.

- [ ] **Step 2: Lint and build**

Run from `frontend/`: `npx eslint src/components/NightSky.jsx` (zero new errors) then `npm run build` (succeeds).

- [ ] **Step 3: Manual verification (required, no test runner)**

Run `npm run dev` and check each, reporting pass/fail per item:
1. Load: camera auto-pan eases to a stop as the first bubble appears; boy 4s → girl 4s → fade → pan eases back; bubbles sit beside the right heads.
2. During intro: drag/zoom does nothing, canvas taps select nothing and don't dismiss; Skip dismisses instantly and control returns.
3. Reload 3+ times: different pairs appear across reloads (repeats by chance allowed, note if seen).
4. Press HUD reset: intro replays with a different pair than the one just shown, camera glides home; reset mid-intro restarts with another new pair.
5. 390px width: bubbles on-screen and readable during hold.

If no browser is available, say so explicitly and map each item to code lines instead.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/NightSky.jsx
git commit -m "feat: replay a new intro variation on reset"
```
