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
  const flameRef = useRef();
  // Gentle candle-like flicker for the seat lantern
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const f = 0.85 + 0.15 * (Math.sin(t * 7.3) * 0.6 + Math.sin(t * 13.7) * 0.4);
    if (seatLightRef.current) seatLightRef.current.intensity = 3.2 * f;
    if (seatGlowRef.current) seatGlowRef.current.material.opacity = 0.5 * f + 0.15;
    if (flameRef.current) {
      const s = 1 + (f - 0.85) * 1.6;
      flameRef.current.scale.set(1 / s, s, 1 / s);
    }
  });
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wood, roughness: 0.8, metalness: 0 }),
    [wood]
  );
  const darkWoodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2e2013', roughness: 0.9 }),
    []
  );
  // Vintage lantern fittings: dark iron frame, warm brass trim, glowing glass
  const ironMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1c1c22', roughness: 0.55, metalness: 0.85 }),
    []
  );
  const brassMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8a6a3a', roughness: 0.4, metalness: 0.9 }),
    []
  );
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffdf9e',
        emissive: '#ff9a3c',
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.28,
        roughness: 0.15,
        metalness: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  useEffect(
    () => () => {
      woodMat.dispose();
      darkWoodMat.dispose();
      ironMat.dispose();
      brassMat.dispose();
      glassMat.dispose();
    },
    [woodMat, darkWoodMat, ironMat, brassMat, glassMat]
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
      {/* A vintage hurricane lantern left waiting on the seat */}
      <group position={[-0.6, 1.19, 0]}>
        {/* Flat iron base + brass trim ring */}
        <mesh position={[0, 0.025, 0]} material={ironMat}>
          <cylinderGeometry args={[0.17, 0.19, 0.05, 16]} />
        </mesh>
        <mesh position={[0, 0.055, 0]} material={brassMat}>
          <cylinderGeometry args={[0.175, 0.175, 0.02, 16]} />
        </mesh>
        {/* Glass chimney (warm, translucent — the flame glows through it) */}
        <mesh position={[0, 0.26, 0]} material={glassMat}>
          <cylinderGeometry args={[0.11, 0.145, 0.38, 16, 1, true]} />
        </mesh>
        {/* Inner flame — small teardrop that stretches with the flicker */}
        <mesh ref={flameRef} position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color="#ffdf9e" fog={false} />
        </mesh>
        {/* Candle stub the flame sits on */}
        <mesh position={[0, 0.12, 0]} material={brassMat}>
          <cylinderGeometry args={[0.035, 0.045, 0.1, 10]} />
        </mesh>
        {/* Four iron frame pillars around the glass */}
        {[
          [0.13, 0.13],
          [-0.13, 0.13],
          [0.13, -0.13],
          [-0.13, -0.13],
        ].map(([x, z], i) => (
          <mesh key={`pillar-${i}`} position={[x, 0.28, z]} material={ironMat}>
            <cylinderGeometry args={[0.015, 0.015, 0.46, 8]} />
          </mesh>
        ))}
        {/* Top cap: brass collar + iron chimney cone + handle arch */}
        <mesh position={[0, 0.48, 0]} material={brassMat}>
          <cylinderGeometry args={[0.15, 0.13, 0.04, 16]} />
        </mesh>
        <mesh position={[0, 0.53, 0]} material={ironMat}>
          <cylinderGeometry args={[0.05, 0.12, 0.09, 16]} />
        </mesh>
        <mesh position={[0, 0.62, 0]} rotation={[0, 0, 0]} material={ironMat}>
          <torusGeometry args={[0.11, 0.014, 8, 20, Math.PI]} />
        </mesh>
      </group>
      {glow && (
        <sprite ref={seatGlowRef} position={[-0.6, 1.45, 0]} scale={[1.1, 1.1, 1]}>
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

// A girl and a boy standing on a wooden platform beside the sign,
// gazing up at the night sky together (she points at a star).
const DECK_X = -1.25;
const DECK_Z = 28.1;
const DECK_W = 2.2;
const DECK_D = 1.4;

export const Stargazers = ({ wood, glow }) => {
  const bobRef = useRef();
  const girlHeadRef = useRef();
  const boyHeadRef = useRef();
  const girlArmRef = useRef();
  const sparkRef = useRef();

  // Platform: deck top floats above the lowest ground, corner legs reach the dirt.
  const deck = useMemo(() => {
    const pts = [];
    for (const dx of [-DECK_W / 2, 0, DECK_W / 2]) {
      for (const dz of [-DECK_D / 2, 0, DECK_D / 2]) {
        pts.push(groundHeight(DECK_X + dx, DECK_Z + dz));
      }
    }
    const minG = Math.min(...pts);
    const top = minG + 0.35;
    const legs = [];
    for (const dx of [-DECK_W / 2 + 0.12, DECK_W / 2 - 0.12]) {
      for (const dz of [-DECK_D / 2 + 0.12, DECK_D / 2 - 0.12]) {
        const g = groundHeight(DECK_X + dx, DECK_Z + dz) - 0.06;
        const h = top - 0.18 - g;
        legs.push({ x: dx, z: dz, y: g + h / 2, h });
      }
    }
    const stepG = groundHeight(DECK_X, DECK_Z + DECK_D / 2 + 0.2);
    return { top, legs, stepY: stepG + 0.08 };
  }, []);

  const skinG = useMemo(() => new THREE.MeshStandardMaterial({ color: '#eab88f', roughness: 0.7 }), []);
  const skinB = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d99f6e', roughness: 0.7 }), []);
  const hairG = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2c1a', roughness: 0.9 }), []);
  const hairB = useMemo(() => new THREE.MeshStandardMaterial({ color: '#241a12', roughness: 0.9 }), []);
  const dressMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a4f6e', roughness: 0.85 }), []);
  const jacketMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a5a8c', roughness: 0.85 }), []);
  const pantsMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#26304a', roughness: 0.9 }), []);
  const shoeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c1c22', roughness: 0.9 }), []);
  const deckMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85, metalness: 0 }),
    [wood]
  );

  useEffect(
    () => () => {
      skinG.dispose();
      skinB.dispose();
      hairG.dispose();
      hairB.dispose();
      dressMat.dispose();
      jacketMat.dispose();
      pantsMat.dispose();
      shoeMat.dispose();
      deckMat.dispose();
    },
    [skinG, skinB, hairG, hairB, dressMat, jacketMat, pantsMat, shoeMat, deckMat]
  );

  // Gentle idle life: breathing bob, slow head drift, pointing-arm wave, sparkle flicker
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bobRef.current) bobRef.current.position.y = deck.top + Math.sin(t * 1.1) * 0.018;
    if (girlHeadRef.current) girlHeadRef.current.rotation.x = -0.34 + Math.sin(t * 0.8) * 0.03;
    if (boyHeadRef.current) boyHeadRef.current.rotation.x = -0.3 + Math.sin(t * 0.8 + 1) * 0.03;
    if (girlArmRef.current) girlArmRef.current.rotation.x = 2.35 + Math.sin(t * 0.7) * 0.06;
    if (sparkRef.current) sparkRef.current.material.opacity = 0.55 + 0.3 * Math.sin(t * 6);
  });

  const noRay = () => null;

  return (
    <group position={[DECK_X, 0, DECK_Z]}>
      {/* Deck */}
      <mesh position={[0, deck.top - 0.09, 0]} material={deckMat} raycast={noRay}>
        <boxGeometry args={[DECK_W, 0.18, DECK_D]} />
      </mesh>
      {deck.legs.map((leg, i) => (
        <mesh key={`leg-${i}`} position={[leg.x, leg.y, leg.z]} material={deckMat} raycast={noRay}>
          <boxGeometry args={[0.14, leg.h, 0.14]} />
        </mesh>
      ))}
      {/* Step up at the front edge */}
      <mesh position={[0, deck.stepY, DECK_D / 2 + 0.2]} material={deckMat} raycast={noRay}>
        <boxGeometry args={[0.6, 0.16, 0.4]} />
      </mesh>
      {/* Warm spill so the pair reads in the dark */}
      <pointLight position={[0, deck.top + 1.8, 0.2]} distance={7} intensity={2} decay={2} color="#ff9a4e" />

      <group ref={bobRef} position={[0, deck.top, 0.05]}>
        {/* ---------- GIRL (left, dress + long hair, pointing at the sky) ---------- */}
        <group position={[-0.5, 0, 0]} rotation={[0, -0.15, 0]} scale={0.93}>
          {/* Shoes + legs */}
          {[-0.08, 0.08].map((x, i) => (
            <group key={`gleg-${i}`}>
              <mesh position={[x, 0.05, 0.02]} material={shoeMat} raycast={noRay}>
                <boxGeometry args={[0.1, 0.09, 0.24]} />
              </mesh>
              <mesh position={[x, 0.2, 0]} material={skinG} raycast={noRay}>
                <cylinderGeometry args={[0.055, 0.05, 0.3, 8]} />
              </mesh>
            </group>
          ))}
          {/* Dress + torso */}
          <mesh position={[0, 0.62, 0]} material={dressMat} raycast={noRay}>
            <cylinderGeometry args={[0.19, 0.34, 0.75, 12]} />
          </mesh>
          <mesh position={[0, 1.14, 0]} material={dressMat} raycast={noRay}>
            <cylinderGeometry args={[0.15, 0.18, 0.42, 10]} />
          </mesh>
          {/* Left arm relaxed */}
          <group position={[-0.2, 1.28, 0]} rotation={[0.12, 0, 0.18]}>
            <mesh position={[0, -0.26, 0]} material={dressMat} raycast={noRay}>
              <cylinderGeometry args={[0.05, 0.045, 0.52, 8]} />
            </mesh>
            <mesh position={[0, -0.55, 0]} material={skinG} raycast={noRay}>
              <sphereGeometry args={[0.055, 8, 8]} />
            </mesh>
          </group>
          {/* Right arm raised, pointing up at the sky */}
          <group ref={girlArmRef} position={[0.2, 1.3, 0]} rotation={[2.35, 0, -0.1]}>
            <mesh position={[0, -0.08, 0]} material={dressMat} raycast={noRay}>
              <cylinderGeometry args={[0.06, 0.055, 0.16, 8]} />
            </mesh>
            <mesh position={[0, -0.32, 0]} material={skinG} raycast={noRay}>
              <cylinderGeometry args={[0.05, 0.045, 0.4, 8]} />
            </mesh>
            <mesh position={[0, -0.55, 0]} material={skinG} raycast={noRay}>
              <sphereGeometry args={[0.055, 8, 8]} />
            </mesh>
            {/* Sparkle at the fingertip — "look, that one!" */}
            <mesh position={[0, -0.58, 0]} raycast={noRay}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#fff2cf" fog={false} />
            </mesh>
            {glow && (
              <sprite ref={sparkRef} position={[0, -0.58, 0]} scale={[0.35, 0.35, 1]}>
                <spriteMaterial
                  map={glow}
                  color="#ffd9a0"
                  transparent
                  opacity={0.6}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  fog={false}
                />
              </sprite>
            )}
          </group>
          {/* Neck + head (tilted up, leaning toward him) */}
          <mesh position={[0, 1.4, 0]} material={skinG} raycast={noRay}>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
          </mesh>
          <group ref={girlHeadRef} position={[0, 1.52, 0]} rotation={[-0.34, 0, -0.07]}>
            <mesh material={skinG} raycast={noRay}>
              <sphereGeometry args={[0.125, 14, 14]} />
            </mesh>
            <mesh position={[0, -0.01, -0.125]} rotation={[-Math.PI / 2, 0, 0]} material={skinG} raycast={noRay}>
              <coneGeometry args={[0.02, 0.05, 8]} />
            </mesh>
            {/* Long hair: back mass + fall + bun */}
            <mesh position={[0, -0.06, 0.09]} scale={[1.05, 1.5, 0.8]} material={hairG} raycast={noRay}>
              <sphereGeometry args={[0.13, 12, 12]} />
            </mesh>
            <mesh position={[0, -0.33, 0.1]} material={hairG} raycast={noRay}>
              <boxGeometry args={[0.17, 0.45, 0.09]} />
            </mesh>
            <mesh position={[0, 0.1, 0.09]} material={hairG} raycast={noRay}>
              <sphereGeometry args={[0.06, 8, 8]} />
            </mesh>
          </group>
        </group>

        {/* ---------- BOY (right, jacket, hands relaxed, leaning toward her) ---------- */}
        <group position={[0.5, 0, 0]} rotation={[0, 0.15, 0]}>
          {[-0.11, 0.11].map((x, i) => (
            <group key={`bleg-${i}`}>
              <mesh position={[x, 0.05, 0.02]} material={shoeMat} raycast={noRay}>
                <boxGeometry args={[0.11, 0.1, 0.26]} />
              </mesh>
              <mesh position={[x, 0.475, 0]} material={pantsMat} raycast={noRay}>
                <cylinderGeometry args={[0.075, 0.07, 0.75, 8]} />
              </mesh>
            </group>
          ))}
          {/* Jacket torso + collar */}
          <mesh position={[0, 1.08, 0]} material={jacketMat} raycast={noRay}>
            <boxGeometry args={[0.36, 0.58, 0.24]} />
          </mesh>
          <mesh position={[0, 1.36, 0]} material={jacketMat} raycast={noRay}>
            <boxGeometry args={[0.3, 0.08, 0.2]} />
          </mesh>
          {/* Arms relaxed at sides */}
          {[
            [-0.22, 0.14],
            [0.22, -0.14],
          ].map(([x, rz], i) => (
            <group key={`barm-${i}`} position={[x, 1.32, 0]} rotation={[0.08, 0, rz]}>
              <mesh position={[0, -0.3, 0]} material={jacketMat} raycast={noRay}>
                <cylinderGeometry args={[0.055, 0.05, 0.6, 8]} />
              </mesh>
              <mesh position={[0, -0.63, 0]} material={skinB} raycast={noRay}>
                <sphereGeometry args={[0.06, 8, 8]} />
              </mesh>
            </group>
          ))}
          {/* Neck + head (tilted up, leaning toward her) */}
          <mesh position={[0, 1.44, 0]} material={skinB} raycast={noRay}>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
          </mesh>
          <group ref={boyHeadRef} position={[0, 1.58, 0]} rotation={[-0.3, 0, 0.06]}>
            <mesh material={skinB} raycast={noRay}>
              <sphereGeometry args={[0.135, 14, 14]} />
            </mesh>
            <mesh position={[0, -0.01, -0.135]} rotation={[-Math.PI / 2, 0, 0]} material={skinB} raycast={noRay}>
              <coneGeometry args={[0.022, 0.05, 8]} />
            </mesh>
            {/* Short hair cap */}
            <mesh position={[0, 0.045, 0.015]} scale={[1.02, 0.75, 1.02]} material={hairB} raycast={noRay}>
              <sphereGeometry args={[0.14, 12, 12]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
// A carved wooden trail sign beside the bench.
// Single central log + TWO separate boards: one faces front (+z),
// one faces back (-z), so the post never blocks either lettering.
export const Signpost = ({ wood, onSelect }) => {
  // Sample the lowest ground under the whole footprint (log + both boards)
  // so nothing floats on the slope — then sink the log slightly.
  const base = useMemo(() => {
    const pts = [];
    for (const dx of [-1.0, -0.5, 0, 0.5, 1.0]) {
      for (const dz of [-0.3, 0, 0.3]) {
        pts.push(groundHeight(SIGN_X + dx, SIGN_Z + dz));
      }
    }
    return Math.min(...pts) - 0.35;
  }, []);
  const signTexture = useSignTexture();
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85, metalness: 0 }),
    [wood]
  );

  // One board = wood edges + sign face on its outward (+z local) side.
  // The back board mesh is rotated Y by PI so its +z face points to world -z:
  // no texture mirroring hacks, both faces read correctly.
  const boardMats = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85, metalness: 0 });
    const face = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.85, metalness: 0 });
    return { mats: [edge, edge, edge, edge, face, edge], edge, face };
  }, [wood, signTexture]);

  useEffect(
    () => () => {
      woodMat.dispose();
      boardMats.edge.dispose();
      boardMats.face.dispose();
    },
    [woodMat, boardMats]
  );

  const handleClick = (e) => { e.stopPropagation(); onSelect && onSelect(); };
  const handleOver = () => { document.body.style.cursor = 'pointer'; };
  const handleOut = () => { document.body.style.cursor = 'default'; };

  return (
    <group position={[SIGN_X, base, SIGN_Z]} rotation={[0, -0.35, 0]}>
      {/* Single timber-stand (wood box style): sunk 0.35 into the lowest ground, rises past the boards */}
      <mesh position={[0, 1.325, 0]} material={woodMat} raycast={() => null}>
        <boxGeometry args={[0.24, 2.65, 0.24]} />
      </mesh>
      {/* Post cap */}
      <mesh position={[0, 2.7, 0]} material={woodMat} raycast={() => null}>
        <boxGeometry args={[0.34, 0.1, 0.34]} />
      </mesh>
      {/* Front board (+z) */}
      <mesh
        position={[0, 1.9, 0.17]}
        material={boardMats.mats}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <boxGeometry args={[2.0, 0.62, 0.06]} />
      </mesh>
      {/* Back board (-z): rotated so its sign face points backwards */}
      <mesh
        position={[0, 1.9, -0.17]}
        rotation={[0, Math.PI, 0]}
        material={boardMats.mats}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <boxGeometry args={[2.0, 0.62, 0.06]} />
      </mesh>
    </group>
  );
};
