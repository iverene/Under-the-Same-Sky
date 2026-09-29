import * as THREE from 'three';
import { STAR_DISTANCE, LANTERN_DISTANCE } from './config';

// Normalize backend <-> mock shapes into a render-ready THREE.Vector3.
export const toVector3 = (pos) => {
  if (!pos) return null;
  if (pos instanceof THREE.Vector3) return pos;
  if (typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
    return new THREE.Vector3(pos.x, pos.y, pos.z);
  }
  return null;
};

export const randomLanternPosition = () =>
  // Terrain never rises above y=-5, so start just above the grass (-2)
  // instead of buried in the hill
  new THREE.Vector3((Math.random() - 0.5) * 40, -2, (Math.random() - 0.5) * 40);

// Random sky position for a new star: hangs above the hill so arrivals
// stay visible and camera flights can always arrive.
export const getRandomPositionOnSphere = (radius) => {
  const SKY_FLOOR = 10;
  let pos = new THREE.Vector3();
  for (let i = 0; i < 12; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = radius * (0.8 + Math.random() * 0.4);
    pos = new THREE.Vector3().setFromSphericalCoords(r, phi, theta);
    if (pos.y >= SKY_FLOOR) return pos;
  }
  pos.y = Math.max(pos.y, SKY_FLOOR);
  return pos;
};

export const normalizeMessage = (raw) => {
  const type = raw.type || 'star';
  let position =
    toVector3(raw.position) ||
    (raw.position_x !== null && raw.position_x !== undefined
      ? new THREE.Vector3(Number(raw.position_x), Number(raw.position_y), Number(raw.position_z))
      : null);
  if (position) {
    // Clone (mock vectors are shared) then push out to viewing distance
    position = position.clone().multiplyScalar(type === 'lantern' ? LANTERN_DISTANCE : STAR_DISTANCE);
  } else if (type === 'lantern') {
    position = randomLanternPosition().multiplyScalar(LANTERN_DISTANCE);
  }
  return {
    id: raw.id,
    recipient: raw.recipient,
    sender: raw.sender || null,
    content: raw.content,
    type,
    position,
    // Stars read smaller at depth — compensate their glow size (lanterns stay near)
    size: (raw.size ?? 0.5) * (type === 'star' ? 1.7 : 1),
    color:
      raw.color ||
      (type === 'lantern' ? '#ffaa00' : 'white'),
  };
};
