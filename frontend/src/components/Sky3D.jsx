import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { HOME_POS } from '../three/terrain';
import { toVector3 } from '../three/messages';
import {
  useStarTexture,
  useCoronaTexture,
  useGlowTexture,
  usePaperTexture,
  useTrailTexture,
  useNebulaTexture,
  useMoonTexture,
  useGroundTexture,
  useWoodTexture,
} from '../three/textures';
import MessageStar from './sky/MessageStar';
import FloatingLantern from './sky/FloatingLantern';
import FallingStarSystem from './sky/FallingStarSystem';
import Constellations from './sky/Constellations';
import { NebulaField, Moon } from './sky/Backdrop';
import { Ground, HillDetails, Fireflies, MountainRange } from './sky/Terrain';
import { Bench, Signpost, Stargazers } from './sky/Foreground';
import { CameraRig, SkyRig, GroundCollision } from './sky/Rigs';

const SceneWarmup = () => {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
};

const Sky3D = ({
  stars,
  lanterns,
  selectedId,
  selectedMessage,
  selectedIsLantern,
  freshMap,
  skyTheme,
  showIntro,
  isTouchDevice,
  landmarkFocus,
  focusCam,
  flightRef,
  homeSignal,
  lockTarget,
  onSelectStar,
  onSelectLantern,
  onSelectBench,
  onSelectSign,
  onSelectTeam,
  onPointerMissed,
}) => {
  const starTexture = useStarTexture();
  const coronaTexture = useCoronaTexture();
  const glowTexture = useGlowTexture();
  const paperTexture = usePaperTexture();
  const trailTexture = useTrailTexture();
  const nebulaTexture = useNebulaTexture();
  const moonTexture = useMoonTexture();
  const groundTexture = useGroundTexture();
  const woodTexture = useWoodTexture();

  const ambientRef = useRef(null);
  const sunRef = useRef(null);
  const groundMatRef = useRef(null);
  const mtnMatRef = useRef(null);
  const mtnFarMatRef = useRef(null);
  const veilRef = useRef(null);
  const controlsRef = useRef(null);

  // Lanterns drift as they rise: remember the live position with its id so a
  // stale value can never leak into the next selection (no effect needed).
  const [focusOverride, setFocusOverride] = useState(null);
  const livePosition = focusOverride?.id === selectedId ? focusOverride.pos : null;

  const focusPoint = selectedMessage
    ? toVector3(livePosition) || toVector3(selectedMessage.position)
    : landmarkFocus;

  return (
    <Canvas
      camera={{ position: HOME_POS.toArray(), fov: 50 }}
      frameloop={showIntro ? 'never' : 'always'}
      onPointerMissed={onPointerMissed}
    >
      <SceneWarmup />

      <color attach="background" args={['#020205']} />
      <fog attach="fog" args={['#020205', 25, 300]} />

      <Ground texture={groundTexture} matRef={groundMatRef} />
      <Bench wood={woodTexture} glow={glowTexture} onSelect={onSelectBench} />
      <Signpost wood={woodTexture} onSelect={onSelectSign} />
      <Stargazers wood={woodTexture} glow={glowTexture} onSelect={onSelectTeam} />
      <HillDetails />
      <Fireflies texture={coronaTexture} />
      <MountainRange nearRef={mtnMatRef} farRef={mtnFarMatRef} />

      <NebulaField texture={nebulaTexture} />
      <Moon texture={moonTexture} glow={coronaTexture} />

      <Stars radius={800} depth={100} count={7000} factor={4} saturation={0} fade speed={0.5} raycast={() => null} />
      <Stars ref={veilRef} radius={500} depth={80} count={6000} factor={5} saturation={0} fade speed={0.6} raycast={() => null} />
      <Sparkles count={300} scale={60} size={2} speed={0.2} opacity={0.3} color="#aaddff" raycast={() => null} />
      <Constellations />

      <ambientLight ref={ambientRef} intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight ref={sunRef} position={[-345, 237, -496]} intensity={0.35} color="#b9c8ff" />
      <SkyRig
        theme={skyTheme}
        ambientRef={ambientRef}
        sunRef={sunRef}
        groundRef={groundMatRef}
        mtnRef={mtnMatRef}
        mtnFarRef={mtnFarMatRef}
        veilRef={veilRef}
      />

      {stars.map((msg) => (
        <MessageStar
          key={msg.id}
          position={msg.position}
          message={msg}
          baseSize={(msg.size || 0.5) * 2}
          texture={starTexture}
          corona={coronaTexture}
          selected={msg.id === selectedId}
          onSelect={onSelectStar}
          bornAt={freshMap[msg.id]}
        />
      ))}

      {lanterns.map((msg) => (
        <FloatingLantern
          key={msg.id}
          position={msg.position}
          message={msg}
          onSelect={onSelectLantern}
          glow={glowTexture}
          paper={paperTexture}
          bornAt={freshMap[msg.id]}
          selected={msg.id === selectedId && selectedIsLantern}
          onLivePosition={
            msg.id === selectedId && selectedIsLantern
              ? (pos) => setFocusOverride({ id: msg.id, pos })
              : undefined
          }
        />
      ))}

      <FallingStarSystem headTexture={starTexture} trailTexture={trailTexture} />

      <CameraRig
        controlsRef={controlsRef}
        focusPoint={focusPoint}
        focusCam={focusCam}
        flightRef={flightRef}
        homeSignal={homeSignal}
        introHold={showIntro}
      />
      <OrbitControls
        ref={controlsRef}
        target={[0, 1, 0]}
        enablePan={false}
        enableZoom={true}
        minDistance={2.5}
        maxDistance={80}
        zoomSpeed={isTouchDevice ? 1.8 : 1.2}
        zoomToCursor={!isTouchDevice}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        minPolarAngle={0.6}
        maxPolarAngle={Math.PI - 0.05}
        autoRotate={true}
        autoRotateSpeed={0.15}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.4}
        reverseOrbit={true}
      />
      <GroundCollision controlsRef={controlsRef} lockTarget={lockTarget} />
    </Canvas>
  );
};

export default Sky3D;
