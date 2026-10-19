// Deterministic helpers shared by the 2D scene. No three.js import: positions
// only need x/y/z, so plain objects and THREE.Vector3 both work.

export const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const hashString = (value) => {
  let h = 2166136261;
  const s = String(value);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const direction = (position) => {
  const x = Number(position?.x) || 0;
  const y = Number(position?.y) || 0;
  const z = Number(position?.z) || 0;
  const len = Math.hypot(x, y, z) || 1;
  return { x: x / len, y: y / len, z: z / len };
};

// Tiny deterministic offset so identical directions never stack exactly.
const jitter = (id) => (hashString(id) % 2001) / 1000 - 1; // -1 .. 1

export const starTo2D = (position, id) => {
  const d = direction(position);
  const azimuth = Math.atan2(d.x, -d.z);
  const elevation = Math.asin(clamp(d.y, -1, 1));
  const j = jitter(`star-${id}`);
  // Full-circle azimuth → width, so the whole stored sky spreads out
  // instead of piling against the edges.
  const x = ((azimuth + Math.PI) / (Math.PI * 2)) * 100 + j * 1.5;
  // Elevation band: low stars sit near the horizon, high stars near the top.
  const t = clamp((elevation + 0.2) / 1.65, 0, 1);
  const y = 62 - t * 56 + j * 1.2;
  return { x: clamp(x, 4, 96), y: clamp(y, 6, 62) };
};

export const lanternTo2D = (position, id) => {
  const { x = 0, z = 0 } = position || {};
  const azimuth = Math.atan2(Number(x) || 0, -(Number(z) || 0));
  const h = hashString(`lantern-${id}`);
  const xPct = ((azimuth + Math.PI) / (Math.PI * 2)) * 100;
  // Lanterns share one stored y, so stagger them vertically by id hash.
  const yPct = 45 + ((h >>> 8) % 1000) / 1000 * 27;
  return { x: clamp(xPct, 4, 96), y: clamp(yPct, 45, 72) };
};

export const messageTo2D = (message) => {
  if (message?.type === 'lantern') return lanternTo2D(message.position, message.id);
  return starTo2D(message?.position, message?.id);
};

const spreadPoint = (point, index, count) => {
  if (count < 2) return point;
  const angle = index * 2.399963229728653;
  const ring = Math.floor(index / 6);
  const radius = Math.min(3.2, 0.9 + ring * 0.7);
  return {
    x: clamp(point.x + Math.cos(angle) * radius, 3, 97),
    y: clamp(point.y + Math.sin(angle) * radius * 0.72, 5, 74),
  };
};

export const layoutMessages2D = (messages) => {
  const projected = messages.map((message) => ({
    message,
    point: messageTo2D(message),
  }));
  const buckets = new Map();

  projected.forEach((entry) => {
    const key = `${Math.floor(entry.point.x / 4)}:${Math.floor(entry.point.y / 4)}`;
    const bucket = buckets.get(key) || [];
    bucket.push(entry);
    buckets.set(key, bucket);
  });

  const positions = new Map();
  buckets.forEach((bucket) => {
    const center = bucket.reduce(
      (total, entry) => ({ x: total.x + entry.point.x, y: total.y + entry.point.y }),
      { x: 0, y: 0 }
    );
    center.x /= bucket.length;
    center.y /= bucket.length;
    bucket.forEach((entry, index) => {
      positions.set(entry.message.id, spreadPoint(center, index, bucket.length));
    });
  });
  return positions;
};

export const makeStarfield = (seed = 20261019, count = 95) => {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: +(rand() * 100).toFixed(2),
    y: +(rand() * 62).toFixed(2),
    size: +(rand() * 2 + 1).toFixed(1),
    delay: +(rand() * 4).toFixed(1),
    dur: +(2.5 + rand() * 3).toFixed(1),
    opacity: +(0.4 + rand() * 0.6).toFixed(2),
  }));
};
