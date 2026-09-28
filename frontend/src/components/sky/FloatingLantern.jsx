import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FRESH_GLOW_MS } from '../../three/config';
import { toVector3, randomLanternPosition } from '../../three/messages';

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

// Floating sky-lantern: ribbed paper shell, flickering flame, warm halo.
// Rises forever (resets at the ceiling), sways, and glows after release.
const FloatingLantern = ({ position, message, onSelect, glow, paper, bornAt, selected, onLivePosition }) => {
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

    // Report live position when selected so camera tracks the rising lantern
    if (selected && onLivePosition) {
      onLivePosition(g.position.clone());
    }
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

export default FloatingLantern;
