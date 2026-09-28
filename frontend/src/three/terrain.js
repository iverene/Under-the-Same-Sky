import * as THREE from 'three';

// Rolling terrain with a raised hilltop under the camera home (0, ~0, 31).
// A flattened pad under the bench + signage + stargazers keeps every
// footing level — the hill eases into the pad at the edges.
export const FLAT_Y = -10.45;
const PAD = { x0: -7.2, x1: 0.2, z0: 26.8, z1: 29.6, feather: 1.5 };

const smooth01 = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

export const groundHeight = (x, z) => {
  const rolling =
    2.2 * Math.sin(x * 0.11) * Math.cos(z * 0.09) +
    3.5 * Math.sin(x * 0.045 + 1.7) * Math.cos(z * 0.05 + 0.6) +
    0.6 * Math.sin(x * 0.31 + z * 0.27);
  const bump = 7 * Math.exp(-(x * x + (z - 28) * (z - 28)) / 180);
  const r = Math.hypot(x, z);
  const falloff = r > 60 ? -(r - 60) * 0.08 : 0;
  const natural = Math.min(-16 + rolling + bump + falloff, -5);
  // Box-distance to the pad (<=0 inside) → 1 inside, feathered to 0 outside
  const d = Math.max(PAD.x0 - x, x - PAD.x1, PAD.z0 - z, z - PAD.z1);
  const mask = 1 - smooth01(d / PAD.feather);
  return natural * (1 - mask) + FLAT_Y * mask;
};

// Jagged ridge walls that melt into the sky (real ridgelines, not cones).
// A displaced cylinder band whose peaks dissolve via distance fog.
export const makeRidge = (radius, baseY, maxH, seed) => {
  const geo = new THREE.CylinderGeometry(radius, radius, 1, 180, 4, true);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const t = pos.getY(i) + 0.5; // 0 bottom → 1 top
    const h =
      maxH *
      (0.5 +
        0.28 * Math.sin(a * 3 + seed) +
        0.14 * Math.sin(a * 7 + seed * 2.3) +
        0.08 * Math.sin(a * 13 + seed * 1.1));
    pos.setY(i, baseY + Math.pow(t, 1.2) * h);
    const jitter = 1 + 0.025 * Math.sin(a * 23 + seed * 3.1);
    pos.setX(i, x * jitter);
    pos.setZ(i, z * jitter);
  }
  return geo;
};

// Bench anchor (left of the default view) — camera + signage derive from it
export const BENCH_X = -6;
export const BENCH_Z = 28.5;

export const SIGN_X = -3.6;
export const SIGN_Z = 27.6;

// Overlook shot for sign clicks: camera rises behind bench + sign,
// gaze lands deep in the sky ahead so both sit silhouetted below.
export const SIGN_CAM = new THREE.Vector3(BENCH_X, groundHeight(BENCH_X, BENCH_Z + 11) + 5.5, BENCH_Z + 11);
export const OVERLOOK = new THREE.Vector3(BENCH_X, 26, -80);

// Seated eye position: behind the (human-scale) bench seat
export const HOME_POS = new THREE.Vector3(BENCH_X, groundHeight(BENCH_X, BENCH_Z + 4.5) + 1.45, BENCH_Z + 4.5);
// Bench close-up focus point for click-to-zoom
export const BENCH_FOCUS = new THREE.Vector3(BENCH_X, groundHeight(BENCH_X, BENCH_Z) + 1.2, BENCH_Z);
