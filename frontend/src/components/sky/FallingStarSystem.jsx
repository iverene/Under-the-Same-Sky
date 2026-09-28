import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { FALL_DURATION } from '../../three/config';

// Falling-star system: periodically launches a random message across the sky
// on an eased flight. Click it mid-flight to catch and read it.
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

export default FallingStarSystem;
