import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { fetchMessages, sendMessage } from '../api';
import { getMoonAge, SYNODIC_MONTH } from '../moon';
import { mockMessages, getRandomPositionOnSphere } from '../data/mockMessages';
import { mockWishes } from '../data/mockWishes';
import ComposeModal from './ComposeModal';
import WishingModal from './WishingModal';
import SignModal from './SignModal';
import HUD from './HUD';
import TopBar from './TopBar';

// --- Helpers: normalize backend <-> mock shapes ---
const toVector3 = (pos) => {
  if (!pos) return null;
  if (pos instanceof THREE.Vector3) return pos;
  if (typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
    return new THREE.Vector3(pos.x, pos.y, pos.z);
  }
  return null;
};

const randomLanternPosition = () =>
  // Terrain never rises above y=-5, so start just above the grass (-2)
  // instead of buried in the hill
  new THREE.Vector3((Math.random() - 0.5) * 40, -2, (Math.random() - 0.5) * 40);

// The sky sits far beyond the hill: stars pushed deep, lanterns mid-distance.
// (Stored DB positions stay on the ~45-unit sphere; scaled at render time.)
const STAR_DISTANCE = 1.8;
const LANTERN_DISTANCE = 1.2;

const normalizeMessage = (raw) => {
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
    content: raw.content,
    type,
    position,
    // Stars read smaller at depth — compensate their glow size (lanterns stay near)
    size: (raw.size ?? 0.5) * (type === 'star' ? 1.7 : 1),
    color:
      raw.color ||
      (type === 'lantern' ? '#ffaa00' : type === 'falling_star' ? '#aaddff' : 'white'),
  };
};

// --- 1. Procedural Textures (each canvas is created once and shared) ---

// Star core: hot white center, cool halo, subtle 4-point sparkle flare
const useStarTexture = () => {
  return useMemo(() => {
    const s = 128;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const c = s / 2;

    const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.12, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.3, 'rgba(210, 230, 255, 0.55)');
    glow.addColorStop(0.6, 'rgba(140, 180, 255, 0.16)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, s, s);

    // Cross flare (additive light streaks)
    ctx.globalCompositeOperation = 'lighter';
    const beamH = ctx.createLinearGradient(0, 0, s, 0);
    beamH.addColorStop(0, 'rgba(255,255,255,0)');
    beamH.addColorStop(0.5, 'rgba(255,255,255,0.85)');
    beamH.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beamH;
    ctx.fillRect(0, c - 1.5, s, 3);
    const beamV = ctx.createLinearGradient(0, 0, 0, s);
    beamV.addColorStop(0, 'rgba(255,255,255,0)');
    beamV.addColorStop(0.5, 'rgba(255,255,255,0.85)');
    beamV.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beamV;
    ctx.fillRect(c - 1.5, 0, 3, s);

    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Ultra-soft wide halo for star coronas (tinted per instance)
const useCoronaTexture = () => {
  return useMemo(() => {
    const s = 128;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.28)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Warm radial glow texture, shared by all lantern halos (one canvas total)
const useGlowTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 200, 130, 1)');
    gradient.addColorStop(0.35, 'rgba(255, 140, 50, 0.45)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Lantern rice-paper: warm base with vertical rib shading (used as map + emissiveMap)
const usePaperTexture = () => {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');

    const base = ctx.createLinearGradient(0, 0, 0, s);
    base.addColorStop(0, '#fff6e3');
    base.addColorStop(0.5, '#ffedd2');
    base.addColorStop(1, '#f7d9ae');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);

    // Vertical ribs (wrap around the lathe shell) — kept soft to avoid
    // moiré shimmer when the lantern is viewed from far away
    for (let x = 0; x < s; x += 16) {
      ctx.fillStyle = 'rgba(170, 110, 60, 0.14)';
      ctx.fillRect(x, 0, 3, s);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(x + 3, 0, 2, s);
    }
    // Top / bottom binding bands
    ctx.fillStyle = 'rgba(150, 90, 40, 0.25)';
    ctx.fillRect(0, 0, s, 12);
    ctx.fillRect(0, s - 12, s, 12);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8; // keeps ribs crisp at grazing/far angles
    return tex;
  }, []);
};

// Comet trail: bright head (canvas top = v1 = travel direction) fading to transparent tail
const useTrailTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(200, 230, 255, 0.55)');
    gradient.addColorStop(0.6, 'rgba(140, 190, 255, 0.18)');
    gradient.addColorStop(1, 'rgba(140, 190, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 256);
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Nebula: soft white blobs, tinted per sprite via material color
const useNebulaTexture = () => {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const blobs = [
      [128, 128, 110, 0.16],
      [80, 100, 60, 0.14],
      [180, 150, 70, 0.12],
      [120, 180, 55, 0.13],
      [170, 90, 45, 0.12],
    ];
    for (const [x, y, r, a] of blobs) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255, 255, 255, ${a})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Stylized moon: bright disc, dark maria, rim-lit craters, limb darkening
const useMoonTexture = () => {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const c = s / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, 120, 0, Math.PI * 2);
    ctx.clip();

    // Bright face, gently darker toward the limb
    const base = ctx.createRadialGradient(c - 25, c - 25, 20, c, c, 130);
    base.addColorStop(0, '#f4f1e6');
    base.addColorStop(0.65, '#ddd8c4');
    base.addColorStop(1, '#b3ae9c');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);

    // Faint mineral mottling (tan / cool gray, very subtle like LRO maps)
    const mottles = [
      [90, 90, 46, '205, 190, 160'], [170, 120, 52, '170, 180, 195'],
      [130, 180, 44, '200, 185, 165'], [70, 150, 36, '175, 185, 200'],
    ];
    for (const [x, y, r, rgb] of mottles) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb}, 0.14)`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }

    // Maria — irregular dark plains built from overlapping lobes
    const maria = [
      [100, 110, 42], [160, 140, 50], [128, 172, 34], [182, 92, 26], [80, 160, 24],
      [118, 122, 26], [88, 126, 22], [178, 152, 26], [148, 160, 24], [140, 96, 16],
    ];
    for (const [x, y, r] of maria) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(125, 122, 108, 0.42)');
      g.addColorStop(0.7, 'rgba(125, 122, 108, 0.22)');
      g.addColorStop(1, 'rgba(125, 122, 108, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Craters — dark bowl + light-caught lower rim
    const craters = [
      [92, 96, 15], [150, 78, 10], [168, 152, 17],
      [108, 176, 11], [140, 128, 7], [68, 148, 9], [188, 112, 8], [120, 60, 6],
    ];
    for (const [x, y, r] of craters) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(100, 95, 80, 0.5)');
      g.addColorStop(0.8, 'rgba(100, 95, 80, 0.25)');
      g.addColorStop(1, 'rgba(100, 95, 80, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.8, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }

    // Rayed craters — bright pinpoint with faint ejecta halo
    const rays = [[150, 60, 3.5], [70, 110, 3], [185, 140, 2.5]];
    for (const [x, y, r] of rays) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      g.addColorStop(0.25, 'rgba(255, 255, 255, 0.35)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine surface grain
    for (let i = 0; i < 900; i++) {
      const x = c + (Math.random() - 0.5) * 220;
      const y = c + (Math.random() - 0.5) * 220;
      if (Math.hypot(x - c, y - c) > 118) continue;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90, 85, 70, 0.25)' : 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(x, y, 1, 1);
    }

    // Live phase shading: shadow eats one limb (left when waxing, right when waning).
    // Exaggerated ~3x so the phase reads clearly — a true 95% gibbous sliver
    // is nearly invisible at this distance.
    const { illumination: lit, waxing } = getMoonAge();
    const shadowW = Math.min(240, Math.max(0, 1 - lit) * 240 * 3);
    if (shadowW > 4) {
      const x0 = waxing ? c - 120 : c + 120;
      const x1 = waxing ? x0 + shadowW : x0 - shadowW;
      const shade = ctx.createLinearGradient(x0, 0, x1, 0);
      shade.addColorStop(0, 'rgba(8, 8, 20, 0.92)');
      shade.addColorStop(0.75, 'rgba(8, 8, 20, 0.6)');
      shade.addColorStop(1, 'rgba(8, 8, 20, 0)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, s, s);
    }

    // Limb darkening — edge melts softly instead of a hard disc cutout
    const limb = ctx.createRadialGradient(c, c, 70, c, c, 122);
    limb.addColorStop(0, 'rgba(70, 70, 95, 0)');
    limb.addColorStop(1, 'rgba(70, 70, 95, 0.45)');
    ctx.fillStyle = limb;
    ctx.fillRect(0, 0, s, s);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
};

// Star color temperatures so the sky doesn't look monochrome
const STAR_TINTS = ['#ffffff', '#cfe4ff', '#ffe9c9', '#e8d8ff'];

// New arrivals glow brightly so you can spot where yours landed,
// then settle back to normal over this long (ms)
const FRESH_GLOW_MS = 30000;

// --- 2. Interactive Message Star (core + corona, smooth shimmer) ---
const MessageStar = ({ position, message, baseSize, texture, corona, selected, onSelect, bornAt }) => {
  const [hovered, setHovered] = useState(false);
  const coreRef = useRef();
  const coronaRef = useRef();

  // Stable ID for animation + tint
  const numericId = useMemo(() => {
    if (typeof message.id === 'string') {
      return message.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    }
    return Number(message.id) || 0;
  }, [message.id]);

  const tint = useMemo(() => STAR_TINTS[numericId % STAR_TINTS.length], [numericId]);
  const vecPosition = useMemo(() => toVector3(position), [position]);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const offset = numericId * 0.7;
    // Layered shimmer feels organic, never fully dark
    const shimmer =
      0.72 + 0.28 * (0.6 * Math.sin(time * 2.1 + offset) + 0.4 * Math.sin(time * 3.9 + offset * 1.7));
    const active = hovered || selected;
    // Birth glow: 1 at release → 0 after FRESH_GLOW_MS
    const glow = bornAt ? Math.max(0, 1 - (Date.now() - bornAt) / FRESH_GLOW_MS) : 0;

    if (coreRef.current) {
      coreRef.current.material.opacity = Math.min(1, (active ? 1 : shimmer) + glow);
      const target = (active ? baseSize * 2.4 : baseSize) * (1 + glow * 1.5);
      const s = THREE.MathUtils.damp(coreRef.current.scale.x, target, 8, delta);
      coreRef.current.scale.set(s, s, 1);
    }
    if (coronaRef.current) {
      coronaRef.current.material.opacity = Math.min(1, (active ? 0.85 : 0.38) * shimmer + glow * 0.6);
      const target = baseSize * 3.4 * (active ? 1.2 : 1 + 0.06 * Math.sin(time * 1.7 + offset)) * (1 + glow);
      const s = THREE.MathUtils.damp(coronaRef.current.scale.x, target, 6, delta);
      coronaRef.current.scale.set(s, s, 1);
    }
  });

  if (!vecPosition) return null;

  return (
    <group position={vecPosition}>
      {/* Outer corona — shares the click target so far (tiny) stars stay tappable */}
      <sprite
        ref={coronaRef}
        scale={[baseSize * 3.4, baseSize * 3.4, 1]}
        onClick={(e) => { e.stopPropagation(); onSelect(message); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false); }}
      >
        <spriteMaterial
          map={corona}
          color={tint}
          transparent
          opacity={0.38}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </sprite>

      {/* Hot core */}
      <sprite
        ref={coreRef}
        scale={[baseSize, baseSize, 1]}
        onClick={(e) => { e.stopPropagation(); onSelect(message); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false); }}
      >
        <spriteMaterial
          map={texture}
          color={tint}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </sprite>
    </group>
  );
};

// --- 3. Floating Lantern (textured paper sky-lantern) ---
// Lathe profile: rounded paper shell, open at the bottom where the flame sits
const LANTERN_PROFILE = [
  [0.02, -0.46],
  [0.16, -0.46],
  [0.24, -0.38],
  [0.30, -0.22],
  [0.325, -0.05],
  [0.31, 0.12],
  [0.26, 0.28],
  [0.18, 0.39],
  [0.09, 0.45],
  [0.02, 0.47],
].map(([x, y]) => new THREE.Vector2(x, y));

const FloatingLantern = ({ position, message, onSelect, glow, paper, bornAt }) => {
  const groupRef = useRef();
  const lightRef = useRef();
  const flameRef = useRef();
  const haloRef = useRef();
  const shellRef = useRef();
  const farRef = useRef();
  const [hovered, setHovered] = useState(false);
  // Random offsets so lanterns don't move/flicker in sync
  const randomOffset = useMemo(() => Math.random() * 100, []);
  const flickerSpeed = useMemo(() => 2 + Math.random() * 3, []);
  const riseSpeed = useMemo(() => 0.3 + Math.random() * 0.25, []);
  // Slight per-lantern warm tint variation
  const tint = useMemo(
    () => new THREE.Color().setHSL(0.06 + Math.random() * 0.05, 0.9, 0.62),
    []
  );
  const vecPosition = useMemo(() => toVector3(position) || randomLanternPosition(), [position]);

  // Rise + sway + flame flicker (all delta-based = same speed on any refresh rate)
  useFrame(({ clock }, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const time = clock.getElapsedTime();

    // Gentle rise
    g.position.y += riseSpeed * delta;

    // Reset position if it goes too high (infinite loop effect)
    if (g.position.y > 50) {
      g.position.y = -20;
    }

    // Gentle sway + slow spin
    g.position.x += Math.sin(time * 0.6 + randomOffset) * delta * 0.12;
    g.rotation.z = Math.sin(time * 0.8 + randomOffset) * 0.1;
    g.rotation.y += delta * 0.18;

    // Flame flicker (two layered sines feel like a real flame)
    const flicker =
      Math.sin(time * flickerSpeed + randomOffset) * 0.3 +
      Math.sin(time * 13 + randomOffset * 2) * 0.12;
    // Birth glow: 1 at release → 0 after FRESH_GLOW_MS
    const glowAmt = bornAt ? Math.max(0, 1 - (Date.now() - bornAt) / FRESH_GLOW_MS) : 0;
    if (lightRef.current) lightRef.current.intensity = 1.8 + flicker + glowAmt * 8;
    if (shellRef.current) shellRef.current.emissiveIntensity = 1.6 + glowAmt * 2.5;
    if (flameRef.current) {
      const s = 1 + flicker * 0.15;
      flameRef.current.scale.set(s, s, s);
    }
    if (haloRef.current) {
      haloRef.current.material.opacity = Math.min(1, (hovered ? 0.75 : 0.5) + flicker * 0.08 + glowAmt * 0.5);
    }
    if (farRef.current) {
      farRef.current.material.opacity = 0.16 + glowAmt * 0.5;
    }

    // Smooth hover grow (base 1.15 so lanterns hold presence at distance)
    const s = THREE.MathUtils.damp(g.scale.x, (hovered ? 1.45 : 1.15) * (1 + glowAmt * 0.35), 8, delta);
    g.scale.set(s, s, s);
  });

  return (
    <group position={vecPosition} ref={groupRef} scale={1.15}>
      {/* Ribbed paper shell (ribs glow too via emissiveMap) */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(message, groupRef.current?.position.clone()); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false); }}
      >
        <latheGeometry args={[LANTERN_PROFILE, 16]} />
        <meshStandardMaterial
          ref={shellRef}
          map={paper}
          color={tint}
          emissive="#ff5a00"
          emissiveMap={paper}
          emissiveIntensity={1.6}
          roughness={0.9}
          side={THREE.DoubleSide}
          fog={false}
        />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.07, 12]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.8} fog={false} />
      </mesh>

      {/* Bottom bamboo rim */}
      <mesh position={[0, -0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.022, 8, 20]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.8} fog={false} />
      </mesh>

      {/* Fuel flame glowing through the open base */}
      <mesh ref={flameRef} position={[0, -0.38, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#ffe3ae" fog={false} />
      </mesh>

      {/* Warm halo (bloom-like glow) — part of the click target for far lanterns */}
      {glow && (
        <sprite
          ref={haloRef}
          scale={[3.0, 3.0, 1]}
          onClick={(e) => { e.stopPropagation(); onSelect(message, groupRef.current?.position.clone()); }}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
          onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false); }}
        >
          <spriteMaterial
            map={glow}
            color="#ff9a3c"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </sprite>
      )}

      {/* Far-distance glow so lanterns read as warm lights across the sky.
          Not clickable — it's nearly invisible, so taps here should count
          as empty sky (deselect) instead of a surprise selection. */}
      {glow && (
        <sprite
          ref={farRef}
          scale={[7, 7, 1]}
          raycast={() => null}
        >
          <spriteMaterial
            map={glow}
            color="#ff8a2a"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </sprite>
      )}

      {/* Lantern Light */}
      <pointLight ref={lightRef} position={[0, -0.3, 0]} distance={4} intensity={1.8} color="#ff9a3c" />
    </group>
  );
};

// --- 4. Falling Star System (gradient trail + glowing head, eased flight) ---
const FALL_DURATION = 2.2;

const FallingStarSystem = ({ messages, headTexture, trailTexture }) => {
  const [activeStar, setActiveStar] = useState(null);
  const [caught, setCaught] = useState(false);
  const [caughtPos, setCaughtPos] = useState(null);
  const groupRef = useRef();
  const trailMatRef = useRef();
  const headMatRef = useRef();
  const lightRef = useRef();
  const progress = useRef(0);

  useEffect(() => {
    if (activeStar || messages.length === 0) return;
    const timeout = setTimeout(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const startPhi = Math.random() * Math.PI * 0.5;
      const startTheta = Math.random() * Math.PI * 2;
      const startPos = new THREE.Vector3().setFromSphericalCoords(72, startPhi, startTheta);
      const endPos = new THREE.Vector3().copy(startPos).add(new THREE.Vector3((Math.random() - 0.5) * 48, -(Math.random() * 48 + 16), (Math.random() - 0.5) * 48));
      progress.current = 0;
      setActiveStar({ message: randomMsg, startPos, endPos });
      setCaught(false);
      setCaughtPos(null);
    }, Math.random() * 5000 + 3000);
    return () => clearTimeout(timeout);
  }, [activeStar, messages]);

  useFrame((_, delta) => {
    if (!activeStar || caught || !groupRef.current) return;
    progress.current = Math.min(progress.current + delta / FALL_DURATION, 1);
    const p = progress.current;
    // Accelerating fall + fade in/out
    const eased = Math.pow(p, 1.7);
    groupRef.current.position.lerpVectors(activeStar.startPos, activeStar.endPos, eased);
    groupRef.current.lookAt(activeStar.endPos);
    const fade = Math.min(p / 0.12, 1) * (1 - THREE.MathUtils.smoothstep(p, 0.65, 1));
    if (trailMatRef.current) trailMatRef.current.opacity = fade;
    if (headMatRef.current) headMatRef.current.opacity = fade;
    if (lightRef.current) lightRef.current.intensity = 6 * fade;
    if (p >= 1) setActiveStar(null);
  });

  const handleCatch = (e) => {
    e.stopPropagation();
    if (groupRef.current) setCaughtPos(groupRef.current.position.clone());
    setCaught(true);
  };

  if (!activeStar) return null;

  return (
    <group>
      {!caught && (
        <group
          ref={groupRef}
          onClick={handleCatch}
          onPointerOver={() => { document.body.style.cursor = 'crosshair'; }}
          onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
          {/* Gradient trail streaming behind the head */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -3]}>
            <cylinderGeometry args={[0.1, 0.015, 6, 8, 1, true]} />
            <meshBasicMaterial
              ref={trailMatRef}
              map={trailTexture}
              color="#bfe0ff"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              fog={false}
            />
          </mesh>
          {/* Bright head */}
          <sprite scale={[1.4, 1.4, 1]}>
            <spriteMaterial
              ref={headMatRef}
              map={headTexture}
              color="#dff0ff"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
            />
          </sprite>
          <pointLight ref={lightRef} intensity={0} distance={8} color="#bfe0ff" />
        </group>
      )}

      {caught && (
        <Html position={caughtPos || activeStar.startPos} center>
          <div className="bg-cyan-950/90 backdrop-blur-xl text-white p-8 rounded-2xl border border-cyan-400/30 w-80 shadow-[0_0_60px_rgba(34,211,238,0.2)] animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">✨</div>
              <h2 className="text-cyan-300 font-bold uppercase tracking-widest text-xs mb-6">Falling Star Caught</h2>
              <div className="w-full bg-black/20 rounded-lg p-4 mb-4 border border-cyan-500/10">
                <p className="text-xs text-cyan-200/60 uppercase tracking-wider mb-1">For</p>
                <p className="font-serif text-xl text-white">{activeStar.message.recipient}</p>
              </div>
              <p className="text-lg font-serif italic text-cyan-100/90 mb-6 leading-relaxed">"{activeStar.message.content}"</p>
              <button onClick={() => setActiveStar(null)} className="px-6 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full transition-colors text-xs uppercase tracking-widest text-cyan-300">Release to Sky</button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- 5. Deep-space backdrop: drifting nebula clouds + stylized moon ---
const NebulaField = ({ texture }) => {
  const groupRef = useRef();
  const clouds = useMemo(() => [
    { pos: [-70, 25, -60], scale: 70, color: '#5b3fa8', opacity: 0.16 },
    { pos: [65, 10, -70], scale: 80, color: '#1f6f8b', opacity: 0.14 },
    { pos: [0, 45, -85], scale: 60, color: '#a03d7a', opacity: 0.10 },
    { pos: [-30, -5, 80], scale: 75, color: '#274b9b', opacity: 0.12 },
    { pos: [55, 30, 60], scale: 55, color: '#6d28d9', opacity: 0.10 },
  ], []);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.004;
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <sprite key={i} position={cloud.pos} scale={[cloud.scale, cloud.scale, 1]} raycast={() => null}>
          <spriteMaterial
            map={texture}
            color={cloud.color}
            transparent
            opacity={cloud.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </sprite>
      ))}
    </group>
  );
};

const Moon = ({ texture, glow }) => (
  <group position={[-345, 237, -496]}>
    <mesh raycast={() => null}>
      <sphereGeometry args={[16, 32, 32]} />
      <meshStandardMaterial
        map={texture}
        emissive="#9aa3c0"
        emissiveMap={texture}
        emissiveIntensity={0.35}
        roughness={1}
        metalness={0}
        fog={false}
      />
    </mesh>
    <sprite scale={[62, 62, 1]} raycast={() => null}>
      <spriteMaterial
        map={glow}
        color="#cdd8ff"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </sprite>
  </group>
);

// --- 6. Camera Rig: one-time fly-to-star, then full user control ---
// Clicking an object triggers a short flight (armed via flightRef). Once the
// camera arrives, the flight disengages and you can orbit/zoom freely —
// closing cards or picking other objects never resets your POV.
// Only the reset button glides you home. An optional explicit focusCam
// overrides the perch (used by the sign overlook shot).
const FOCUS_DISTANCE = 8;

const CameraRig = ({ controlsRef, focusPoint, focusCam, flightRef, homeSignal }) => {
  const wasFocused = useRef(false);
  // Rest gaze looks slightly upward so the sky dominates and the hill sits low
  const homeTarget = useMemo(() => new THREE.Vector3(0, 4, 0), []);
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
        tmpDesired.copy(tmpFocus).addScaledVector(tmpDir, FOCUS_DISTANCE);
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
    }
    wasFocused.current = !!focusPoint;
  });

  return null;
};

// --- 7. Hilltop ground: the POV is standing on a hill looking up ---
// Rolling terrain with a raised hilltop under the camera home (0, ~0, 31).
const groundHeight = (x, z) => {
  const rolling =
    2.2 * Math.sin(x * 0.11) * Math.cos(z * 0.09) +
    3.5 * Math.sin(x * 0.045 + 1.7) * Math.cos(z * 0.05 + 0.6) +
    0.6 * Math.sin(x * 0.31 + z * 0.27);
  const bump = 7 * Math.exp(-(x * x + (z - 28) * (z - 28)) / 180);
  const r = Math.hypot(x, z);
  const falloff = r > 60 ? -(r - 60) * 0.08 : 0;
  return Math.min(-16 + rolling + bump + falloff, -5);
};

// Night-grass texture: dark base, moonlit patches, speckled blades
const useGroundTexture = () => {
  return useMemo(() => {
    const s = 512;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    // Dark base so the hill melts into the night (fog finishes the blend)
    ctx.fillStyle = '#08120d';
    ctx.fillRect(0, 0, s, s);

    // Large soft tonal variation (breaks visible tiling at distance)
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 90 + Math.random() * 160;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const warm = Math.random() > 0.5;
      g.addColorStop(0, warm ? 'rgba(40, 60, 35, 0.12)' : 'rgba(50, 80, 110, 0.10)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }

    // Cool moonlit patches
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 60 + Math.random() * 120;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(70, 100, 130, 0.08)');
      g.addColorStop(1, 'rgba(70, 100, 130, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
    // Fine grass speckles (small enough to read as blades, not noise)
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const v = Math.random();
      ctx.fillStyle =
        v > 0.65
          ? `rgba(${25 + v * 30}, ${55 + v * 40}, ${28 + v * 25}, 0.45)`
          : 'rgba(3, 6, 5, 0.5)';
      ctx.fillRect(x, y, 1 + Math.random() * 1.5, 1 + Math.random() * 2.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
};

const Ground = ({ texture, matRef }) => {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(320, 320, 96, 96);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)));
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} raycast={() => null}>
      <meshStandardMaterial ref={matRef} map={texture} color="#b9c9c2" roughness={1} metalness={0} />
    </mesh>
  );
};

// Pine silhouettes + scattered rocks on the hilltop
const TREES = [
  [-16, 14, 1.2], [20, 38, 1.5], [-6, 52, 1.0], [30, 8, 0.9],
  [-24, 20, 1.3], [12, 44, 1.1], [-30, 32, 1.4], [26, 20, 1.0],
  [-12, 60, 1.2], [36, 30, 1.1],
];

const HillDetails = () => {
  const rocks = useMemo(
    () =>
      Array.from({ length: 8 }, () => {
        const a = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 25;
        const x = Math.cos(a) * r;
        const z = 28 + Math.sin(a) * r * 0.6;
        return { x, z, s: 0.3 + Math.random() * 0.7, rot: Math.random() * Math.PI };
      }),
    []
  );

  return (
    <group>
      {TREES.map(([x, z, s], i) => (
        <group key={`tree-${i}`} position={[x, groundHeight(x, z) - 0.1, z]} scale={s}>
          <mesh position={[0, 1.2, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.18, 0.3, 2.4, 7]} />
            <meshStandardMaterial color="#0d1410" roughness={1} />
          </mesh>
          <mesh position={[0, 3.0, 0]} raycast={() => null}>
            <coneGeometry args={[1.6, 3.2, 8]} />
            <meshStandardMaterial color="#0a1a10" roughness={1} />
          </mesh>
          <mesh position={[0, 4.6, 0]} raycast={() => null}>
            <coneGeometry args={[1.1, 2.4, 8]} />
            <meshStandardMaterial color="#0c2013" roughness={1} />
          </mesh>
        </group>
      ))}
      {rocks.map((rock, i) => (
        <mesh
          key={`rock-${i}`}
          position={[rock.x, groundHeight(rock.x, rock.z) + rock.s * 0.2, rock.z]}
          rotation={[0, rock.rot, 0]}
          scale={rock.s}
          raycast={() => null}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#1b2331" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
};

// (MountainRing replaced by MountainRange above — real ridgelines, not cones)

// Fireflies drifting over the hilltop grass
const Fireflies = ({ count = 70, texture }) => {
  const pointsRef = useRef();
  const matRef = useRef();
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 28;
      const x = Math.cos(a) * r;
      const z = 28 + Math.sin(a) * r * 0.7;
      positions[i * 3] = x;
      positions[i * 3 + 1] = groundHeight(x, z) + 0.6 + Math.random() * 2.2;
      positions[i * 3 + 2] = z;
      seeds.push({
        sp: 0.3 + Math.random() * 0.7,
        ph: Math.random() * 100,
      });
    }
    return { positions, seeds };
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const attr = pointsRef.current?.geometry.attributes.position;
    if (!attr) return;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      attr.array[i * 3] += Math.sin(t * s.sp + s.ph) * 0.008;
      attr.array[i * 3 + 1] += Math.cos(t * s.sp * 0.8 + s.ph) * 0.006;
    }
    attr.needsUpdate = true;
    if (matRef.current) matRef.current.opacity = 0.55 + 0.35 * Math.sin(t * 2.2);
  });

  return (
    <points ref={pointsRef} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.55}
        map={texture}
        color="#d8ff9e"
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

// --- 8. Sky themes: smooth brightness/mood transitions ---
// Targets only — SkyRig damps the live scene toward these (~2s silky blend).
const SKY_THEMES = {
  dusk: {
    label: 'Dusk',
    bg: '#2e1a45',
    ambient: 0.7,
    sun: 0.6,
    sunColor: '#ff8a4c',
    sunPos: [85, 8, -45],
    exposure: 1.05,
    ground: '#d9a8c8',
    mtn: '#221239',
    mtnFar: '#40234e',
    veil: 0.45,
  },
  nightfall: {
    label: 'Nightfall',
    bg: '#0a1230',
    ambient: 0.6,
    sun: 0.45,
    sunColor: '#a9bfff',
    sunPos: [-140, 90, -200],
    exposure: 1.0,
    ground: '#a8bcc8',
    mtn: '#0a1024',
    mtnFar: '#16203c',
    veil: 0.8,
  },
  deepnight: {
    label: 'Deep Night',
    bg: '#020205',
    ambient: 0.5,
    sun: 0.35,
    sunColor: '#b9c8ff',
    sunPos: [-345, 237, -496],
    exposure: 1.0,
    ground: '#b9c9c2',
    mtn: '#0b1020',
    mtnFar: '#141b30',
    veil: 1,
  },
  dawn: {
    label: 'Early Dawn',
    bg: '#173f52',
    ambient: 0.9,
    sun: 0.8,
    sunColor: '#ffcf9a',
    sunPos: [70, 14, 45],
    exposure: 1.12,
    ground: '#b5d4c4',
    mtn: '#123642',
    mtnFar: '#20505f',
    veil: 0.5,
  },
};

const SkyRig = ({ theme, ambientRef, sunRef, groundRef, mtnRef, mtnFarRef, veilRef }) => {
  const cur = useMemo(() => ({
    bg: new THREE.Color(SKY_THEMES.deepnight.bg),
    ambient: SKY_THEMES.deepnight.ambient,
    sun: SKY_THEMES.deepnight.sun,
    sunColor: new THREE.Color(SKY_THEMES.deepnight.sunColor),
    sunPos: new THREE.Vector3(...SKY_THEMES.deepnight.sunPos),
    exposure: SKY_THEMES.deepnight.exposure,
    ground: new THREE.Color(SKY_THEMES.deepnight.ground),
    mtn: new THREE.Color(SKY_THEMES.deepnight.mtn),
    mtnFar: new THREE.Color(SKY_THEMES.deepnight.mtnFar),
    veil: SKY_THEMES.deepnight.veil,
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
const GroundCollision = ({ controlsRef, lockTarget }) => {
  useFrame(({ camera }) => {
    const minY = groundHeight(camera.position.x, camera.position.z) + 0.6;
    if (camera.position.y < minY) camera.position.y = minY;
    const controls = controlsRef.current;
    if (controls && !lockTarget) {
      const t = controls.target;
      // Wide enough to contain every focus target (stars sit near r=80),
      // so releasing a selection never snaps the view
      const r = Math.hypot(t.x, t.z);
      if (r > 95) {
        t.x *= 95 / r;
        t.z *= 95 / r;
      }
      t.y = THREE.MathUtils.clamp(t.y, -5, 95);
    }
  });
  return null;
};

// --- 9. Background mountain ranges: jagged ridge walls that melt into the sky ---
// Built from displaced cylinder bands (real ridgelines, not cones) with a
// vertical alpha fade so the peaks dissolve into the background instead of
// cutting a hard triangle edge. Near range dark, far range hazier (aerial perspective).
const makeRidge = (radius, baseY, maxH, seed) => {
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

const MountainRange = ({ nearRef, farRef }) => {
  const nearGeo = useMemo(() => makeRidge(118, -26, 30, 1.7), []);
  const farGeo = useMemo(() => makeRidge(145, -28, 42, 4.2), []);
  // (ridge tops now blend via distance fog instead of an alpha fade)
  const nearMat = useMemo(
    () =>
      // Opaque so peaks correctly occlude the sky behind them (fog softens the blend)
      new THREE.MeshBasicMaterial({ color: '#0b1020', side: THREE.DoubleSide }),
    []
  );
  const farMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#141b30', side: THREE.DoubleSide }),
    []
  );

  useEffect(() => {
    if (nearRef) nearRef.current = nearMat;
    if (farRef) farRef.current = farMat;
    return () => {
      nearGeo.dispose();
      farGeo.dispose();
      nearMat.dispose();
      farMat.dispose();
    };
  }, [nearGeo, farGeo, nearMat, farMat, nearRef, farRef]);

  return (
    <group>
      <mesh geometry={farGeo} material={farMat} raycast={() => null} />
      <mesh geometry={nearGeo} material={nearMat} raycast={() => null} />
    </group>
  );
};

// --- 10. Bench: a wooden seat on the hilltop where your POV rests ---
// Bench anchor (left of the default view) — camera + signage derive from it
const BENCH_X = -6;
const BENCH_Z = 28.5;
// Wood-grain texture shared by every slat and leg
const useWoodTexture = () => {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#6e4b2e';
    ctx.fillRect(0, 0, s, s);

    // Long grain streaks
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * s;
      const h = 1 + Math.random() * 2;
      ctx.fillStyle =
        Math.random() > 0.5
          ? `rgba(61, 40, 23, ${0.08 + Math.random() * 0.12})`
          : `rgba(138, 98, 56, ${0.08 + Math.random() * 0.12})`;
      ctx.fillRect(0, y, s, h);
    }
    // A few knots
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 4 + Math.random() * 6;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(45, 28, 15, 0.8)');
      g.addColorStop(0.6, 'rgba(70, 46, 26, 0.4)');
      g.addColorStop(1, 'rgba(70, 46, 26, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
};

// Faces the open sky (-z); sitter's back rests against the +z slats
const Bench = ({ wood, glow, onSelect }) => {
  // Seat the legs on the lowest ground under the footprint (slightly embedded)
  // so no leg floats above the slope
  const base = useMemo(() => {
    const corners = [
      [BENCH_X - 0.7, BENCH_Z - 0.4],
      [BENCH_X + 0.7, BENCH_Z - 0.4],
      [BENCH_X - 0.7, BENCH_Z + 0.4],
      [BENCH_X + 0.7, BENCH_Z + 0.4],
    ];
    return Math.min(...corners.map(([x, z]) => groundHeight(x, z))) - 0.08;
  }, []);
  const seatGlowRef = useRef();
  const seatLightRef = useRef();
  // Gentle candle-like flicker for the seat lantern
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const f = 0.85 + 0.15 * (Math.sin(t * 7.3) * 0.6 + Math.sin(t * 13.7) * 0.4);
    if (seatLightRef.current) seatLightRef.current.intensity = 3.2 * f;
    if (seatGlowRef.current) seatGlowRef.current.material.opacity = 0.5 * f + 0.15;
  });
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wood, roughness: 0.8, metalness: 0 }),
    [wood]
  );
  const darkWoodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2e2013', roughness: 0.9 }),
    []
  );

  useEffect(
    () => () => {
      woodMat.dispose();
      darkWoodMat.dispose();
    },
    [woodMat, darkWoodMat]
  );

  return (
    <group
      position={[BENCH_X, base, BENCH_Z]}
      rotation={[0, -0.12, 0]}
      scale={0.6}
      onClick={(e) => { e.stopPropagation(); onSelect && onSelect(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Front + back legs (backs rise to carry the backrest) */}
      {[
        [-0.9, -0.35, 1.1, 0.55, woodMat],
        [0.9, -0.35, 1.1, 0.55, woodMat],
        [-0.9, 0.38, 2.1, 1.05, darkWoodMat],
        [0.9, 0.38, 2.1, 1.05, darkWoodMat],
      ].map(([x, z, h, y, m], i) => (
        <mesh key={i} position={[x, y, z]} material={m}>
          <boxGeometry args={[0.14, h, 0.14]} />
        </mesh>
      ))}
      {/* Seat slats */}
      {[-0.3, -0.1, 0.1, 0.3].map((z, i) => (
        <mesh key={`seat-${i}`} position={[0, 1.14, z]} material={woodMat}>
          <boxGeometry args={[2.0, 0.09, 0.17]} />
        </mesh>
      ))}
      {/* Backrest slats, gently reclined */}
      {[1.5, 1.75, 2.0].map((y, i) => (
        <mesh key={`back-${i}`} position={[0, y, 0.44]} rotation={[-0.12, 0, 0]} material={woodMat}>
          <boxGeometry args={[2.0, 0.18, 0.07]} />
        </mesh>
      ))}
      {/* A small lit lantern left waiting on the seat */}
      <mesh position={[-0.6, 1.42, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#ffcf8e" fog={false} />
      </mesh>
      {glow && (
        <sprite ref={seatGlowRef} position={[-0.6, 1.42, 0]} scale={[1.1, 1.1, 1]}>
          <spriteMaterial
            map={glow}
            color="#ffb35c"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </sprite>
      )}
      <pointLight ref={seatLightRef} position={[-0.6, 1.75, 0]} distance={8} intensity={3.2} decay={2} color="#ffab4e" />
    </group>
  );
};

// --- 11. Signpost: a carved wooden trail sign beside the bench ---
const useSignTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Weathered board
    ctx.fillStyle = '#5d3f26';
    ctx.fillRect(0, 0, 512, 160);
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * 160;
      ctx.fillStyle =
        Math.random() > 0.5
          ? `rgba(50, 32, 18, ${0.1 + Math.random() * 0.15})`
          : `rgba(120, 86, 50, ${0.1 + Math.random() * 0.12})`;
      ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
    }
    // Carved border
    ctx.strokeStyle = 'rgba(240, 230, 210, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, 488, 136);

    // Carved lettering
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2e7cd';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText('UNDER THE SAME SKY', 256, 72);
    ctx.font = 'italic 28px Georgia, serif';
    ctx.fillStyle = '#e8d5a8';
    ctx.fillText('★ look up ★', 256, 116);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
};

const SIGN_X = -3.6;
const SIGN_Z = 27.6;
// Overlook shot for sign clicks: camera rises behind bench + sign,
// gaze lands deep in the sky ahead so both sit silhouetted below.
const SIGN_CAM = new THREE.Vector3(BENCH_X, groundHeight(BENCH_X, BENCH_Z + 11) + 5.5, BENCH_Z + 11);
const OVERLOOK = new THREE.Vector3(BENCH_X, 26, -80);

const Signpost = ({ wood, onSelect }) => {
  const base = useMemo(() => groundHeight(SIGN_X, SIGN_Z) - 0.1, []);
  const signTexture = useSignTexture();
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85, metalness: 0 }),
    [wood]
  );

  // Board faces: readable text front AND back (un-mirrored), plain wood edges.
  // BoxGeometry order: [+x, -x, +y, -y, +z(front), -z(back)]
  const boardMats = useMemo(() => {
    const backTex = signTexture.clone();
    backTex.wrapS = THREE.RepeatWrapping;
    backTex.repeat.x = -1; // cancel the back face's natural mirroring
    backTex.needsUpdate = true;
    const edge = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85, metalness: 0 });
    const front = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.85, metalness: 0 });
    const back = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.85, metalness: 0 });
    return { mats: [edge, edge, edge, edge, front, back], backTex, edge, front, back };
  }, [wood, signTexture]);

  useEffect(
    () => () => {
      woodMat.dispose();
      boardMats.edge.dispose();
      boardMats.front.dispose();
      boardMats.back.dispose();
      boardMats.backTex.dispose();
    },
    [woodMat, boardMats]
  );

  return (
    <group position={[SIGN_X, base, SIGN_Z]} rotation={[0, -0.35, 0]}>
      {/* Post sits behind the board so it never covers the lettering */}
      <mesh position={[0, 1.2, -0.15]} material={woodMat} raycast={() => null}>
        <boxGeometry args={[0.18, 2.4, 0.18]} />
      </mesh>
      {/* Post cap */}
      <mesh position={[0, 2.45, -0.15]} material={woodMat} raycast={() => null}>
        <boxGeometry args={[0.26, 0.1, 0.26]} />
      </mesh>
      {/* Board (front face kept clear) */}
      <mesh
        position={[0, 1.9, 0]}
        material={boardMats.mats}
        onClick={(e) => { e.stopPropagation(); onSelect && onSelect(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[2.0, 0.62, 0.08]} />
      </mesh>
    </group>
  );
};

// Seated eye position: on the (human-scale) bench seat, ~1.4 above the grass
const HOME_POS = new THREE.Vector3(BENCH_X, groundHeight(BENCH_X, BENCH_Z + 0.7) + 1.45, BENCH_Z + 0.7);
// Bench close-up focus point for click-to-zoom
const BENCH_FOCUS = new THREE.Vector3(BENCH_X, groundHeight(BENCH_X, BENCH_Z) + 1.2, BENCH_Z);

// --- Main Component ---
const NightSky = () => {
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);

  // States for modals
  const [isWriting, setIsWriting] = useState(false);
  const [isWishing, setIsWishing] = useState(false);

  // Fresh arrivals (id -> release timestamp): they glow brightly for
  // FRESH_GLOW_MS so you can spot where yours landed, then settle
  const [freshMap, setFreshMap] = useState({});
  const markFresh = (id) => {
    if (id === null || id === undefined) return;
    setFreshMap((prev) => ({ ...prev, [id]: Date.now() }));
    setTimeout(() => {
      setFreshMap((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, FRESH_GLOW_MS + 1000);
  };

  // Sky atmosphere setting (dusk / nightfall / deep night / dawn — smoothed by SkyRig)
  const [skyTheme, setSkyTheme] = useState('deepnight');
  // Immersion toggle: hides every button (panels + modals stay readable)
  const [uiHidden, setUiHidden] = useState(false);
  const ambientRef = useRef(null);
  const sunRef = useRef(null);
  const groundMatRef = useRef(null);
  const mtnMatRef = useRef(null);
  const mtnFarMatRef = useRef(null);
  const veilRef = useRef(null);

  // Click-to-focus: which object the camera is flying to (null = free explore)
  const [selectedId, setSelectedId] = useState(null);
  // Trail sign selection (its own state — it isn't a message row)
  const [selectedSign, setSelectedSign] = useState(false);
  // Bench close-up selection (also not a message row, no reading panel)
  const [selectedBench, setSelectedBench] = useState(false);
  // Lanterns drift as they rise, so we snapshot the lantern's live position on click
  const [focusOverride, setFocusOverride] = useState(null);
  const controlsRef = useRef(null);
  const downPos = useRef(null);
  // Flight state shared with the CameraRig (grabbing the scene cancels motion)
  const flightRef = useRef({ flying: false, homingCam: false });
  // Reset-to-bench signal consumed by the CameraRig
  const [homeSignal, setHomeSignal] = useState(0);

  const starTexture = useStarTexture();
  const coronaTexture = useCoronaTexture();
  const glowTexture = useGlowTexture();
  const paperTexture = usePaperTexture();
  const trailTexture = useTrailTexture();
  const nebulaTexture = useNebulaTexture();
  const moonTexture = useMoonTexture();
  const groundTexture = useGroundTexture();
  const woodTexture = useWoodTexture();

  // Smooth fade-in on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Load from backend on mount, fall back to mock data when backend is down/empty
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchMessages();
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data.map(normalizeMessage));
        } else {
          setMessages([...mockMessages, ...mockWishes]);
        }
      } catch {
        if (!cancelled) setMessages([...mockMessages, ...mockWishes]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const stars = useMemo(() => messages.filter(m => m.type === 'star' && m.position), [messages]);
  const fallingStars = useMemo(() => messages.filter(m => m.type === 'falling_star'), [messages]);
  const lanterns = useMemo(() => messages.filter(m => m.type === 'lantern'), [messages]);

  // Selected object + its world position drive the reading panel and camera flight
  const selectedStar = useMemo(
    () => messages.find(m => m.id === selectedId) || null,
    [messages, selectedId]
  );
  const selectedIsLantern = selectedStar?.type === 'lantern';
  const focusPoint = useMemo(() => {
    if (selectedSign) return OVERLOOK;
    if (selectedBench) return BENCH_FOCUS;
    if (!selectedId) return null;
    return toVector3(focusOverride) || toVector3(selectedStar?.position);
  }, [selectedId, selectedSign, selectedBench, focusOverride, selectedStar]);
  // Directed camera perch (sign overlook) — null means "hold current side"
  const focusCam = useMemo(() => (selectedSign ? SIGN_CAM : null), [selectedSign]);

  const clearProps = React.useCallback(() => {
    setSelectedId(null);
    setFocusOverride(null);
    setSelectedSign(false);
    setSelectedBench(false);
  }, []);

  // Ref to the reading card: taps inside it never close it
  const cardRef = useRef(null);
  const tapDown = useRef(null);

  const handleSelectStar = (msg) => {
    clearProps();
    if (msg) {
      setSelectedId(msg.id);
    }
  };

  const handleSelectLantern = (msg, livePos) => {
    clearProps();
    if (msg) {
      setSelectedId(msg.id);
      setFocusOverride(livePos || msg.position);
    }
  };

  const handleSelectSign = () => {
    clearProps();
    setSelectedSign(true);
  };

  const handleSelectBench = () => {
    clearProps();
    setSelectedBench(true);
  };

  // Clicking empty space deselects (ignored when it was actually an orbit drag).
  // Note: background objects (stars field, nebulae, ground, mountains, moon)
  // opt out of raycasting via raycast={() => null} so taps there count as
  // a miss instead of a dead hit.
  const handlePointerMissed = (e) => {
    if (!downPos.current) return;
    const dx = e.clientX - downPos.current[0];
    const dy = e.clientY - downPos.current[1];
    // 12px tolerance — forgiving for touch taps, still ignores orbit drags
    if (dx * dx + dy * dy < 144) clearProps();
  };

  // Fast outside-tap close: fires on pointerup instantly at the HTML level,
  // without waiting for the R3F raycast/click cycle (which feels laggy on
  // mobile). Any short tap that lands on the canvas and outside the card
  // closes it. Taps on another star also pass through here (cleared first,
  // then the star's onClick selects it). Drags are ignored.
  useEffect(() => {
    if (!selectedStar) return;
    const onDown = (e) => {
      tapDown.current = [e.clientX, e.clientY];
    };
    const onUp = (e) => {
      if (!tapDown.current) return;
      const dx = e.clientX - tapDown.current[0];
      const dy = e.clientY - tapDown.current[1];
      tapDown.current = null;
      if (dx * dx + dy * dy > 144) return;
      if (cardRef.current?.contains(e.target)) return;
      if (e.target?.closest?.('canvas')) clearProps();
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    const onKey = (e) => {
      if (e.key === 'Escape') clearProps();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [selectedStar, clearProps]);

  // Arm a fresh focus flight whenever a (new) star is selected
  useEffect(() => {
    flightRef.current.flying = selectedId !== null || selectedSign || selectedBench;
  }, [selectedId, selectedSign, selectedBench]);

  const handleSendMessage = async (data) => {
    // Try backend first so the message persists in Supabase
    try {
      const saved = await sendMessage(data);
      const normalized = normalizeMessage({
        ...saved,
        // Backend returns a raw row (position_x/y/z); normalizeMessage handles it.
        // Keep the requested lantern type for display even if backend stored otherwise.
        type: data.type || saved.type,
        position: saved.position || saved.position_x !== undefined
          ? (saved.position || { x: saved.position_x, y: saved.position_y, z: saved.position_z })
          : undefined,
      });
      // Ensure display position exists for stars/lanterns created without one
      if (!normalized.position) {
        normalized.position =
          normalized.type === 'lantern' ? randomLanternPosition() : getRandomPositionOnSphere(45);
      }
      setMessages(prev => [...prev, normalized]);
      markFresh(normalized.id);
      // Showcase the new arrival: fly the camera out to it (stops at focus
      // distance — close enough to see, never on top of it)
      if (normalized.type === 'lantern') handleSelectLantern(normalized, normalized.position);
      else handleSelectStar(normalized);
    } catch {
      // Backend down — fall back to local-only message so UX still works
      const fallback = normalizeMessage({
        id: Date.now(),
        recipient: data.recipient || data.name,
        content: data.message || data.wish,
        type: data.type,
        size: Math.random() * 0.5 + 0.3,
        color: data.type === 'lantern' ? '#ffaa00' : (data.type === 'falling_star' ? '#aaddff' : 'white'),
        position: data.type === 'lantern'
          ? randomLanternPosition()
          : (data.type === 'star' ? getRandomPositionOnSphere(45) : null)
      });
      setMessages(prev => [...prev, fallback]);
      markFresh(fallback.id);
      if (fallback.type === 'lantern') handleSelectLantern(fallback, fallback.position);
      else handleSelectStar(fallback);
    }
  };

  return (
    <div
      className={`relative w-full h-screen bg-black text-white overflow-hidden transition-opacity duration-[1500ms] ${ready ? 'opacity-100' : 'opacity-0'}`}
      onPointerDown={(e) => {
        downPos.current = [e.clientX, e.clientY];
        flightRef.current.flying = false; // grabbing the scene cancels any flight
        flightRef.current.homingCam = false;
      }}
    >
      <Canvas camera={{ position: HOME_POS.toArray(), fov: 50 }} onPointerMissed={handlePointerMissed}>

        {/* --- ATMOSPHERE --- */}
        {/* Dark Blue-Black Night Sky */}
        <color attach="background" args={['#020205']} />
        {/* Long-range fog: crisp hilltop nearby, hazy ridges far (melts peaks into sky) */}
        <fog attach="fog" args={['#020205', 25, 300]} />

        {/* Hilltop POV: ground, bench, signpost, pines, rocks, fireflies + mountain ranges */}
        <Ground texture={groundTexture} matRef={groundMatRef} />
        <Bench wood={woodTexture} glow={glowTexture} onSelect={handleSelectBench} />
        <Signpost wood={woodTexture} onSelect={handleSelectSign} />
        <HillDetails />
        <Fireflies texture={coronaTexture} />
        <MountainRange nearRef={mtnMatRef} farRef={mtnFarMatRef} />

        {/* Deep-space nebula clouds + moon */}
        <NebulaField texture={nebulaTexture} />
        <Moon texture={moonTexture} glow={coronaTexture} />

        {/* Thousands of distant background stars (shell sits beyond the moon) */}
        <Stars radius={800} depth={100} count={7000} factor={4} saturation={0} fade speed={0.5} raycast={() => null} />
        {/* Brighter near veil: extra depth at deep night, breathed by SkyRig */}
        <Stars ref={veilRef} radius={500} depth={80} count={6000} factor={5} saturation={0} fade speed={0.6} raycast={() => null} />

        {/* Subtle floating dust/fireflies */}
        <Sparkles count={300} scale={60} size={2} speed={0.2} opacity={0.3} color="#aaddff" raycast={() => null} />

        {/* --- LIGHTING --- */}
        <ambientLight ref={ambientRef} intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        {/* Key light: moonlight by night, low warm sun at dusk/dawn (driven by SkyRig) */}
        <directionalLight ref={sunRef} position={[-345, 237, -496]} intensity={0.35} color="#b9c8ff" />
        {/* Sky theme blender */}
        <SkyRig theme={skyTheme} ambientRef={ambientRef} sunRef={sunRef} groundRef={groundMatRef} mtnRef={mtnMatRef} mtnFarRef={mtnFarMatRef} veilRef={veilRef} />

        {/* --- CONTENT --- */}
        <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
          {/* Stars */}
          {stars.map((msg) => (
            <MessageStar
              key={msg.id}
              position={msg.position}
              message={msg}
              baseSize={(msg.size || 0.5) * 2}
              texture={starTexture}
              corona={coronaTexture}
              selected={msg.id === selectedId}
              onSelect={handleSelectStar}
              bornAt={freshMap[msg.id]}
            />
          ))}
        </Float>

        {/* Lanterns */}
        {lanterns.map((msg) => (
            <FloatingLantern
              key={msg.id}
              position={msg.position}
              message={msg}
              onSelect={handleSelectLantern}
              glow={glowTexture}
              paper={paperTexture}
              bornAt={freshMap[msg.id]}
            />
        ))}

        <FallingStarSystem messages={fallingStars} headTexture={starTexture} trailTexture={trailTexture} />

        {/* --- CONTROLS --- */}
        {/* Focus flight runs alongside the controls */}
        <CameraRig controlsRef={controlsRef} focusPoint={focusPoint} focusCam={focusCam} flightRef={flightRef} homeSignal={homeSignal} />
        <OrbitControls
          ref={controlsRef}
          // Rest gaze aims slightly above the horizon so the sky dominates
          target={[0, 4, 0]}
          enablePan={false}
          enableZoom={true}
          // Deep dynamic zoom: dive right up to a star, pull back for the wide
          // hilltop vista — capped so scrolling out can't leave the scene
          minDistance={2.5}
          maxDistance={80}
          zoomSpeed={1.2}
          zoomToCursor={true}
          // Full vertical freedom: dragging down swoops the camera to the grass
          // so you can lie back and gaze straight up (GroundCollision below
          // keeps you from tunneling through the hill). Dragging up stops
          // before a top-down view so you never lose the sky to dirt.
          minPolarAngle={0.6}
          maxPolarAngle={Math.PI - 0.05}
          // Slow, cinematic rotation
          autoRotate={true}
          autoRotateSpeed={0.3}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.4}
          reverseOrbit={true}
        />
        {/* Terrain collision: runs after the controls, slides the camera
            along the hill instead of letting it sink through */}
        <GroundCollision
          controlsRef={controlsRef}
          lockTarget={selectedId !== null || selectedSign || selectedBench}
        />
      </Canvas>

      {/* Selected star / lantern message — responsive bottom-center reading card.
          Closes via fast outside-tap (see effect above) or Escape; no button. */}
      {selectedStar && (
        <div className="fixed bottom-52 sm:bottom-24 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] sm:w-full max-w-md pointer-events-none">
          <div ref={cardRef} className={`pointer-events-auto relative max-h-[55vh] overflow-y-auto bg-slate-950/80 backdrop-blur-xl border rounded-2xl px-5 py-5 sm:px-8 sm:py-6 animate-in fade-in slide-in-from-bottom-4 duration-300 ${selectedIsLantern ? 'border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 'border-white/10 shadow-[0_0_50px_rgba(150,180,255,0.15)]'}`}>
            <div className="text-center">
              <h3 className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] ${selectedIsLantern ? 'text-amber-200' : 'text-blue-200'}`}>
                {selectedIsLantern ? 'A Wish Floating By' : 'Addressed To'}
              </h3>
              <p className="text-white font-serif text-xl sm:text-2xl leading-tight mt-1 break-words">{selectedStar.recipient}</p>
            </div>
            {/* Full message flows naturally — no inner scrollbar */}
            <div className="relative mt-3">
              <span aria-hidden className="absolute -top-2 left-0 text-4xl text-white/10 font-serif leading-none">“</span>
              <p className="text-[15px] sm:text-base font-serif text-slate-300 leading-relaxed italic text-center px-6 break-words">
                {selectedStar.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trail sign uses the centered wooden SignModal (see Global Modals) */}

      {/* --- Global Modals --- */}
      <ComposeModal isOpen={isWriting} onClose={() => setIsWriting(false)} onSend={handleSendMessage} />
      <WishingModal isOpen={isWishing} onClose={() => setIsWishing(false)} onSend={handleSendMessage} />
      <SignModal open={selectedSign} onClose={() => setSelectedSign(false)} />

      {!uiHidden && <TopBar />}

      <HUD
        onOpenCompose={() => setIsWriting(true)}
        onOpenWish={() => setIsWishing(true)}
        skyTheme={skyTheme}
        onSkyTheme={setSkyTheme}
        uiHidden={uiHidden}
        onToggleUI={() => setUiHidden((v) => !v)}
        onReset={() => {
          clearProps();
          setHomeSignal((s) => s + 1);
        }}
      />
    </div>
  );
};

export default NightSky;
