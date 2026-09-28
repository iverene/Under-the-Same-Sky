import { useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAR_TINTS, FRESH_GLOW_MS } from '../../three/config';
import { toVector3 } from '../../three/messages';

// Interactive message star: glowing core + wide corona click target,
// layered shimmer, birth-glow for fresh arrivals.
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

export default MessageStar;
