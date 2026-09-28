import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BENCH_X, BENCH_Z, SIGN_X, SIGN_Z, groundHeight } from '../../three/terrain';
import { useSignTexture } from '../../three/textures';

// A wooden seat on the hilltop where your POV rests.
// Faces the open sky (-z); sitter's back rests against the +z slats.
export const Bench = ({ wood, glow, onSelect }) => {
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

// A carved wooden trail sign beside the bench.
export const Signpost = ({ wood, onSelect }) => {
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
