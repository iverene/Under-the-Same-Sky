import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { groundHeight, makeRidge } from '../../three/terrain';

// Hilltop ground: rolling terrain under the camera home.
export const Ground = ({ texture, matRef }) => {
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

export const HillDetails = () => {
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

// Fireflies drifting over the hilltop grass
export const Fireflies = ({ count = 70, texture }) => {
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

// Background mountain ranges: jagged ridge walls that melt into the sky.
// Near range dark, far range hazier (aerial perspective).
export const MountainRange = ({ nearRef, farRef }) => {
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
