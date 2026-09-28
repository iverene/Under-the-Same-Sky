import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Deep-space backdrop: drifting nebula clouds + stylized moon.
// All pass-through to raycasts so empty-sky taps count as a miss.
export const NebulaField = ({ texture }) => {
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

export const Moon = ({ texture, glow }) => (
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
