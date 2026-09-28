import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FOCUS_DISTANCE } from '../../three/config';
import { HOME_POS, groundHeight } from '../../three/terrain';
import { SKY_THEMES } from '../../three/themes';

// One-time fly-to-star, then full user control.
// Clicking an object triggers a short flight (armed via flightRef). Once the
// camera arrives, the flight disengages and you can orbit/zoom freely —
// closing cards or picking other objects never resets your POV.
// Only the reset button glides you home. An optional explicit focusCam
// overrides the perch (used by the sign overlook shot).
export const CameraRig = ({ controlsRef, focusPoint, focusCam, flightRef, homeSignal, introHold }) => {
  const wasFocused = useRef(false);
  // Rest gaze aims at the signage area so it sits centered on reset
  const homeTarget = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const tmpDir = useMemo(() => new THREE.Vector3(), []);
  const tmpDesired = useMemo(() => new THREE.Vector3(), []);
  const tmpFocus = useMemo(() => new THREE.Vector3(), []);
  // Failsafe bookkeeping: a flight that can't arrive must release the camera
  const flySince = useRef(0);
  const wasFlying = useRef(false);

  // Reset button arms a glide back to the bench POV
  useEffect(() => {
    if (homeSignal > 0) {
      flightRef.current.flying = false;
      flightRef.current.homingCam = true;
    }
  }, [homeSignal, flightRef]);

  useFrame(({ camera, clock }, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Failsafe: a flight that can't arrive (bad data, lost race) releases
    // after 8s instead of trapping the camera with autoRotate off
    const time = clock.getElapsedTime();
    if (flightRef.current.flying && !wasFlying.current) flySince.current = time;
    wasFlying.current = flightRef.current.flying;
    if (flightRef.current.flying && time - flySince.current > 8) {
      flightRef.current.flying = false;
    }

    if (flightRef.current.homingCam) {
      // Glide home to the bench: position + target together, then release
      const t = 1 - Math.exp(-2.5 * delta);
      camera.position.lerp(HOME_POS, t);
      controls.target.lerp(homeTarget, t);
      if (camera.position.distanceTo(HOME_POS) < 0.15) {
        flightRef.current.homingCam = false;
      }
      return;
    }

    const t = 1 - Math.exp(-3 * delta);

    if (focusPoint && flightRef.current.flying) {
      controls.autoRotate = false;
      // Never dive the gaze under the hill — below-horizon data (old rows)
      // can't bury the view or stall the flight
      tmpFocus.copy(focusPoint);
      tmpFocus.setY(Math.max(tmpFocus.y, groundHeight(tmpFocus.x, tmpFocus.z) + 2.0));
      if (focusCam) {
        // Directed shot (sign overlook): explicit camera perch, gaze to the point
        tmpDesired.copy(focusCam);
      } else {
        tmpDir.copy(camera.position).sub(tmpFocus);
        if (tmpDir.lengthSq() < 1e-4) tmpDir.set(0, 0, 1);
        tmpDir.normalize();
        // Scale focus distance proportionally to how far the target is:
        // nearby lanterns stop close, distant stars stop further back
        const targetDist = tmpFocus.length();
        const scaledDist = Math.max(FOCUS_DISTANCE, targetDist * 0.25);
        tmpDesired.copy(tmpFocus).addScaledVector(tmpDir, scaledDist);
        // Keep the camera out of the hill during focus flights
        tmpDesired.y = Math.max(tmpDesired.y, groundHeight(tmpDesired.x, tmpDesired.z) + 1.5);
      }
      controls.target.lerp(tmpFocus, t);
      camera.position.lerp(tmpDesired, t);
      if (camera.position.distanceTo(tmpDesired) < 0.25) {
        flightRef.current.flying = false; // arrived — user is free to move
      }
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
    wasFocused.current = !!focusPoint;
  });

  return null;
};

// Smooth brightness/mood transitions: damps the live scene toward the
// active theme (~2s silky blend).
export const SkyRig = ({ theme, ambientRef, sunRef, groundRef, mtnRef, mtnFarRef, veilRef }) => {
  const cur = useMemo(() => ({
    bg: new THREE.Color(SKY_THEMES.dusk.bg),
    ambient: SKY_THEMES.dusk.ambient,
    sun: SKY_THEMES.dusk.sun,
    sunColor: new THREE.Color(SKY_THEMES.dusk.sunColor),
    sunPos: new THREE.Vector3(...SKY_THEMES.dusk.sunPos),
    exposure: SKY_THEMES.dusk.exposure,
    ground: new THREE.Color(SKY_THEMES.dusk.ground),
    mtn: new THREE.Color(SKY_THEMES.dusk.mtn),
    mtnFar: new THREE.Color(SKY_THEMES.dusk.mtnFar),
    veil: SKY_THEMES.dusk.veil,
  }), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);

  // The extra star veil needs a transparent material for opacity blending
  useEffect(() => {
    const pts = veilRef.current;
    if (pts && pts.material) pts.material.transparent = true;
  }, [veilRef]);

  useFrame(({ scene, gl }, delta) => {
    const t = SKY_THEMES[theme] || SKY_THEMES.deepnight;
    const k = 1 - Math.exp(-1.8 * delta);

    cur.bg.lerp(tmpColor.set(t.bg), k);
    cur.sunColor.lerp(tmpColor.set(t.sunColor), k);
    cur.ground.lerp(tmpColor.set(t.ground), k);
    cur.mtn.lerp(tmpColor.set(t.mtn), k);
    cur.mtnFar.lerp(tmpColor.set(t.mtnFar), k);
    cur.sunPos.lerp(tmpPos.set(...t.sunPos), k);
    cur.ambient = THREE.MathUtils.damp(cur.ambient, t.ambient, 1.8, delta);
    cur.sun = THREE.MathUtils.damp(cur.sun, t.sun, 1.8, delta);
    cur.exposure = THREE.MathUtils.damp(cur.exposure, t.exposure, 1.8, delta);
    cur.veil = THREE.MathUtils.damp(cur.veil, t.veil ?? 1, 1.8, delta);

    if (scene.background instanceof THREE.Color) scene.background.copy(cur.bg);
    if (scene.fog) scene.fog.color.copy(cur.bg);
    gl.toneMappingExposure = cur.exposure;
    if (ambientRef.current) ambientRef.current.intensity = cur.ambient;
    if (sunRef.current) {
      sunRef.current.intensity = cur.sun;
      sunRef.current.color.copy(cur.sunColor);
      sunRef.current.position.copy(cur.sunPos);
    }
    // Hills follow the sky: tinted ground + silhouette ranges per theme
    if (groundRef.current) groundRef.current.color.copy(cur.ground);
    if (mtnRef.current) mtnRef.current.color.copy(cur.mtn);
    if (mtnFarRef.current) mtnFarRef.current.color.copy(cur.mtnFar);
    // Extra star veil breathes with the theme (full at deep night)
    if (veilRef.current && veilRef.current.material) {
      veilRef.current.material.opacity = cur.veil;
    }
  });

  return null;
};

// Keeps the camera out of the hill and (in free explore) the orbit target
// inside the sky region, so scrolling can't bury you in dirt.
// While anything is selected the target fence lifts — focus flights and
// overlook shots manage their own target.
export const GroundCollision = ({ controlsRef, lockTarget }) => {
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const minY = groundHeight(camera.position.x, camera.position.z) + 0.6;
    if (camera.position.y < minY) camera.position.y = minY;
    const controls = controlsRef.current;
    if (controls && !lockTarget) {
      const t = controls.target;
      // Nearest allowed target (fence). Damped instead of snapped: the bench
      // close-up gazes below the fence, so a hard clamp used to jolt the view
      // the moment a selection released. This glides out smoothly instead.
      tmp.copy(t);
      // Wide enough to contain every focus target (stars sit near r=80),
      // so releasing a selection never snaps the view
      const r = Math.hypot(tmp.x, tmp.z);
      if (r > 95) {
        tmp.x *= 95 / r;
        tmp.z *= 95 / r;
      }
      tmp.y = THREE.MathUtils.clamp(tmp.y, -5, 95);
      t.lerp(tmp, 1 - Math.exp(-4 * delta));
    }
  });
  return null;
};
