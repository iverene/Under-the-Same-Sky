import { useMemo } from 'react';
import * as THREE from 'three';

// Decorative dot-to-dot figures pinned to the far sky shell. Purely ambient:
// fixed positions, gentle glow, no interaction, fog-exempt so they read at depth.
const SHELL = 700;

// Organic wobble per star (local units — small enough to keep every figure
// readable). Reseeded each page load so no two skies match exactly.
const JITTER = 0.18;
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const loadSeed = Math.floor(Math.random() * 1e9);

// Each figure: [azimuthDeg, elevationDeg, scale, segments]
// A segment is a pair of [x, y] endpoints in the figure's local frame.
const FIGURES = [
  // Little lantern — diamond body, handle arc, hanging tassel
  [25, 42, 0.055, [
    [[0, 2], [1.4, 0.6]], [[1.4, 0.6], [0, -1]], [[0, -1], [-1.4, 0.6]], [[-1.4, 0.6], [0, 2]],
    [[-0.5, 2], [0, 2.7]], [[0, 2.7], [0.5, 2]],
    [[0, -1], [0, -1.8]],
  ]],
  // Sealed letter — envelope square, flap V
  [140, 34, 0.05, [
    [[-1.5, 1], [1.5, 1]], [[1.5, 1], [1.5, -1]], [[1.5, -1], [-1.5, -1]], [[-1.5, -1], [-1.5, 1]],
    [[-1.5, 1], [0, -0.2]], [[0, -0.2], [1.5, 1]],
  ]],
  // Comet — short rising arc
  [232, 50, 0.06, [
    [[-2, 0.2], [-1, 0.7]], [[-1, 0.7], [0, 0.9]], [[0, 0.9], [1, 0.6]], [[1, 0.6], [1.8, 0.1]],
  ]],
  // Stargazer — head, body, raised arms, legs (echoes the hilltop couple)
  [318, 38, 0.055, [
    [[0, 0.6], [0, -0.5]],
    [[0, 0.6], [-1.2, 1.5]], [[0, 0.6], [1.2, 1.2]],
    [[0, -0.5], [-0.6, -1.6]], [[0, -0.5], [0.6, -1.6]],
  ]],
  // Stargazer head dot (kept separate so it renders as a star, not a line end)
  [318, 38, 0.055, []],
  // Heart — closed outline, bottom point
  [70, 44, 0.05, [
    [[-1.4, 0.8], [-1.0, 1.5]], [[-1.0, 1.5], [-0.3, 1.5]], [[-0.3, 1.5], [0, 0.9]],
    [[0, 0.9], [0.3, 1.5]], [[0.3, 1.5], [1.0, 1.5]], [[1.0, 1.5], [1.4, 0.8]],
    [[1.4, 0.8], [0.7, -0.2]], [[0.7, -0.2], [0, -1.2]], [[0, -1.2], [-0.7, -0.2]],
    [[-0.7, -0.2], [-1.4, 0.8]],
  ]],
  // Smiley — ring, arc smile, dot eyes
  [185, 38, 0.055, [
    [[1.5, 0], [1.06, 1.06]], [[1.06, 1.06], [0, 1.5]], [[0, 1.5], [-1.06, 1.06]],
    [[-1.06, 1.06], [-1.5, 0]], [[-1.5, 0], [-1.06, -1.06]], [[-1.06, -1.06], [0, -1.5]],
    [[0, -1.5], [1.06, -1.06]], [[1.06, -1.06], [1.5, 0]],
    [[-0.7, -0.2], [0, -0.6]], [[0, -0.6], [0.7, -0.2]],
  ]],
  // Cat — hexagon head, triangle ears, whisker lines
  [275, 47, 0.05, [
    [[1.2, 0], [0.6, 1.04]], [[0.6, 1.04], [-0.6, 1.04]], [[-0.6, 1.04], [-1.2, 0]],
    [[-1.2, 0], [-0.6, -1.04]], [[-0.6, -1.04], [0.6, -1.04]], [[0.6, -1.04], [1.2, 0]],
    [[-0.9, 0.9], [-1.2, 1.9]], [[-1.2, 1.9], [-0.3, 1.15]],
    [[0.9, 0.9], [1.2, 1.9]], [[1.2, 1.9], [0.3, 1.15]],
    [[-1.1, 0.2], [-2.0, 0.45]], [[-1.1, -0.15], [-2.0, -0.3]],
    [[1.1, 0.2], [2.0, 0.45]], [[1.1, -0.15], [2.0, -0.3]],
  ]],
];

const HEAD_OFFSETS = {
  // figure index -> extra standalone star dots in local frame
  0: [[0, 2.7]],
  3: [[0, 1.9]],
  6: [[-0.5, 0.4], [0.5, 0.4]],
};

const Constellations = () => {
  const { linePositions, starPositions } = useMemo(() => {
    const lines = [];
    const stars = [];
    const up = new THREE.Vector3(0, 1, 0);
    FIGURES.forEach(([azDeg, elDeg, scale, segments], fi) => {
      const az = (azDeg * Math.PI) / 180;
      const el = (elDeg * Math.PI) / 180;
      const dir = new THREE.Vector3(
        Math.cos(el) * Math.cos(az),
        Math.sin(el),
        Math.cos(el) * Math.sin(az)
      );
      const u = new THREE.Vector3().crossVectors(up, dir).normalize();
      const v = new THREE.Vector3().crossVectors(dir, u).normalize();
      // Jitter once per unique vertex so shared line joints stay connected
      const rng = mulberry32(loadSeed + fi * 101);
      const cache = new Map();
      const jit = ([x, y]) => {
        const k = `${x},${y}`;
        if (!cache.has(k)) {
          cache.set(k, [x + (rng() - 0.5) * 2 * JITTER, y + (rng() - 0.5) * 2 * JITTER]);
        }
        return cache.get(k);
      };
      const toWorld = (pt) => {
        const [x, y] = jit(pt);
        return dir
          .clone()
          .addScaledVector(u, x * scale)
          .addScaledVector(v, y * scale)
          .normalize()
          .multiplyScalar(SHELL);
      };
      segments.forEach(([a, b]) => {
        const pa = toWorld(a);
        const pb = toWorld(b);
        lines.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
        stars.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
      });
      (HEAD_OFFSETS[fi] || []).forEach(([x, y]) => {
        const p = toWorld([x, y]);
        stars.push(p.x, p.y, p.z);
      });
    });
    return {
      linePositions: new Float32Array(lines),
      starPositions: new Float32Array(stars),
    };
  }, []);

  const noRay = () => null;

  return (
    <group raycast={noRay}>
      <lineSegments raycast={noRay}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#8fa8d8"
          transparent
          opacity={0.5}
          fog={false}
          depthWrite={false}
        />
      </lineSegments>
      <points raycast={noRay}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#dfe8ff"
          size={2.4}
          sizeAttenuation={false}
          transparent
          opacity={0.9}
          fog={false}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

export default Constellations;
