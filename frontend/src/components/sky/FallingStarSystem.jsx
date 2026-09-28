import { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FALL_DURATION } from '../../three/config';

// Spawns a single shooting star: random arc from upper sky to lower sky.
const makeBolt = () => {
  const startPhi = Math.random() * Math.PI * 0.35;
  const startTheta = Math.random() * Math.PI * 2;
  const startPos = new THREE.Vector3().setFromSphericalCoords(72, startPhi, startTheta);
  const endPos = new THREE.Vector3().copy(startPos).add(
    new THREE.Vector3(
      (Math.random() - 0.5) * 56,
      -(Math.random() * 48 + 20),
      (Math.random() - 0.5) * 56,
    ),
  );
  return { startPos, endPos, progress: 0 };
};

// One visual shooting star: head sprite + gradient trail, fading in/out.
const ShootingBolt = ({ bolt, headTexture, trailTexture, onDone }) => {
  const groupRef = useRef();
  const trailMatRef = useRef();
  const headMatRef = useRef();
  const lightRef = useRef();
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    progress.current = Math.min(progress.current + delta / FALL_DURATION, 1);
    const p = progress.current;
    const eased = Math.pow(p, 1.7);
    groupRef.current.position.lerpVectors(bolt.startPos, bolt.endPos, eased);
    groupRef.current.lookAt(bolt.endPos);
    const fade = Math.min(p / 0.12, 1) * (1 - THREE.MathUtils.smoothstep(p, 0.65, 1));
    if (trailMatRef.current) trailMatRef.current.opacity = fade;
    if (headMatRef.current) headMatRef.current.opacity = fade;
    if (lightRef.current) lightRef.current.intensity = 6 * fade;
    if (p >= 1) onDone();
  });

  return (
    <group ref={groupRef}>
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
  );
};

// Pure visual shooting-star system: randomly spawns single bolts or
// occasional showers (2-4 at once). No messages — just ambient beauty.
const FallingStarSystem = ({ headTexture, trailTexture }) => {
  const [bolts, setBolts] = useState([]);
  const idRef = useRef(0);

  const removeBolt = useCallback((id) => {
    setBolts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Schedule the next event (single bolt or shower)
  useEffect(() => {
    let timer;
    const schedule = () => {
      const delay = Math.random() * 12000 + 4000; // 4-16 s between events
      timer = setTimeout(() => {
        const isShower = Math.random() < 0.2; // 20 % chance of a shower
        const count = isShower ? Math.floor(Math.random() * 3) + 2 : 1; // 2-4 bolts
        const newBolts = Array.from({ length: count }, () => ({
          id: ++idRef.current,
          ...makeBolt(),
        }));
        setBolts((prev) => [...prev, ...newBolts]);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <group>
      {bolts.map((bolt) => (
        <ShootingBolt
          key={bolt.id}
          bolt={bolt}
          headTexture={headTexture}
          trailTexture={trailTexture}
          onDone={() => removeBolt(bolt.id)}
        />
      ))}
    </group>
  );
};

export default FallingStarSystem;
