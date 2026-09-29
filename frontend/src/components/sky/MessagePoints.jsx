import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { STAR_TINTS, FRESH_GLOW_MS } from '../../three/config';

// All message stars in exactly 2 draw calls (core + corona points clouds).
// Shimmer, birth-glow, and highlight sizing run in-shader; hover/selection
// flip a single highlight attribute — no per-frame React or JS animation work.
const numericIdOf = (id) => {
  if (typeof id === 'string') {
    return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  }
  return Number(id) || 0;
};

const VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;
attribute float aBorn;
attribute float aHighlight;
uniform float uTime;
uniform float uPxScale;
uniform float uSizeMul;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float t = uTime;
  float active = step(0.5, aHighlight);
  float shimmer = 0.72 + 0.28 * (0.6 * sin(t * 2.1 + aPhase) + 0.4 * sin(t * 3.9 + aPhase * 1.7));
  float glow = 0.0;
  if (aBorn > 0.0) {
    glow = max(0.0, 1.0 - ((t * 1000.0) - aBorn) / ${FRESH_GLOW_MS.toFixed(1)});
  }
  float sizeBoost;
  float baseAlpha;
  if (uSizeMul > 2.0) {
    // Corona layer (mirrors the old 3.4x sprite behavior)
    sizeBoost = mix(1.0 + 0.06 * sin(t * 1.7 + aPhase), 1.2, active) * (1.0 + glow);
    baseAlpha = min(1.0, mix(0.38, 0.85, active) * shimmer + glow * 0.6);
  } else {
    // Hot core layer
    sizeBoost = mix(1.0, 2.4, active) * (1.0 + glow * 1.5);
    baseAlpha = min(1.0, mix(shimmer, 1.0, active) + glow);
  }
  gl_PointSize = aSize * uSizeMul * sizeBoost * uPxScale / max(0.1, -mv.z);
  vColor = aColor;
  vAlpha = baseAlpha;
}
`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 tex = texture2D(uMap, gl_PointCoord);
  gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha);
}
`;

const makeMaterial = (map, sizeMul) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPxScale: { value: 600 },
      uSizeMul: { value: sizeMul },
      uMap: { value: map },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

const MessagePoints = ({ messages, selectedId, onSelect, texture, corona, freshMap }) => {
  const geoRef = useRef();
  const coreMatRef = useRef();
  const coronaMatRef = useRef();
  const hoverRef = useRef(-1);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  // Tap-target width comes from the Canvas raycaster params (Points threshold
  // 2.2 world units, matching the old ~3.4-wide corona sprites).

  // Parallel to attribute rows: messages[index] for click resolution.
  const items = useMemo(() => (messages || []).filter((m) => m.position), [messages]);

  const idToIndex = useMemo(() => {
    const map = new Map();
    items.forEach((m, i) => map.set(m.id, i));
    return map;
  }, [items]);

  const arrays = useMemo(() => {
    const n = items.length;
    const position = new Float32Array(n * 3);
    const aColor = new Float32Array(n * 3);
    const aSize = new Float32Array(n);
    const aPhase = new Float32Array(n);
    const aBorn = new Float32Array(n);
    const aHighlight = new Float32Array(n);
    const tint = new THREE.Color();
    items.forEach((m, i) => {
      const p = m.position;
      position[i * 3] = p.x;
      position[i * 3 + 1] = p.y;
      position[i * 3 + 2] = p.z;
      tint.set(STAR_TINTS[numericIdOf(m.id) % STAR_TINTS.length]);
      aColor[i * 3] = tint.r;
      aColor[i * 3 + 1] = tint.g;
      aColor[i * 3 + 2] = tint.b;
      aSize[i] = (m.size || 0.5) * 2;
      aPhase[i] = numericIdOf(m.id) * 0.7;
      aBorn[i] = (freshMap && freshMap[m.id]) || -1;
    });
    return { position, aColor, aSize, aPhase, aBorn, aHighlight };
  }, [items, freshMap]);

  const coreMat = useMemo(() => makeMaterial(texture, 1), [texture]);
  const coronaMat = useMemo(() => makeMaterial(corona, 3.4), [corona]);

  // One shared geometry instance feeds both draw calls (core + corona layers).
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arrays.position, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(arrays.aColor, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(arrays.aSize, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(arrays.aPhase, 1));
    g.setAttribute('aBorn', new THREE.BufferAttribute(arrays.aBorn, 1));
    g.setAttribute('aHighlight', new THREE.BufferAttribute(arrays.aHighlight, 1));
    return g;
  }, [arrays]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(
    () => () => {
      coreMat.dispose();
      coronaMat.dispose();
    },
    [coreMat, coronaMat]
  );

  // Selection flips highlight rows directly — no React re-render involved.
  const selectedIndexRef = useRef(-1);
  useEffect(() => {
    const attr = geoRef.current?.getAttribute('aHighlight');
    if (!attr) return;
    if (selectedIndexRef.current >= 0 && selectedIndexRef.current < attr.count) {
      attr.array[selectedIndexRef.current] = 0;
    }
    const next = selectedId == null ? -1 : idToIndex.get(selectedId) ?? -1;
    selectedIndexRef.current = next;
    if (next >= 0) attr.array[next] = 1;
    attr.needsUpdate = true;
  }, [selectedId, idToIndex]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pxScale =
      (size.height * gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    for (const m of [coreMatRef.current, coronaMatRef.current]) {
      if (!m) continue;
      m.uniforms.uTime.value = t;
      m.uniforms.uPxScale.value = pxScale;
    }
  });

  const setHover = (idx) => {
    if (idx === hoverRef.current) return;
    const attr = geoRef.current?.getAttribute('aHighlight');
    hoverRef.current = idx;
    if (!attr) return;
    // Hover shares the highlight channel; selection row is re-asserted below
    // so the two never fight over the same attribute.
    attr.array.forEach((_, i) => {
      attr.array[i] = i === idx || i === selectedIndexRef.current ? 1 : 0;
    });
    attr.needsUpdate = true;
    document.body.style.cursor = idx >= 0 ? 'pointer' : 'default';
  };

  const clearHover = () => setHover(-1);

  const handleClick = (e) => {
    e.stopPropagation();
    const msg = items[e.index];
    if (msg) onSelect(msg);
  };

  if (items.length === 0) return null;

  // geoRef tracks the shared geometry for highlight-attribute writes.
  // (The ref lands on the <points> object, so unwrap to its geometry.)
  const trackGeometry = (points) => {
    geoRef.current = points ? points.geometry : null;
  };

  return (
    <group>
      <points
        frustumCulled={false}
        geometry={geometry}
        ref={trackGeometry}
        onClick={handleClick}
        onPointerMove={(e) => setHover(e.index ?? -1)}
        onPointerOut={clearHover}
      >
        <primitive object={coreMat} ref={coreMatRef} attach="material" />
      </points>
      <points
        frustumCulled={false}
        geometry={geometry}
        onClick={handleClick}
        onPointerMove={(e) => setHover(e.index ?? -1)}
        onPointerOut={clearHover}
      >
        <primitive object={coronaMat} ref={coronaMatRef} attach="material" />
      </points>
    </group>
  );
};

export default MessagePoints;
