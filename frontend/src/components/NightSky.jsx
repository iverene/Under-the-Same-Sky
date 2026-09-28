import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Float } from '@react-three/drei';
import { fetchMessages, sendMessage } from '../api';
import ComposeModal from './ComposeModal';
import WishingModal from './WishingModal';
import SignModal from './SignModal';
import HUD from './HUD';
import TopBar from './TopBar';
import { FRESH_GLOW_MS, TAP_TOLERANCE_SQ } from '../three/config';
import { BENCH_FOCUS, HOME_POS, OVERLOOK, SIGN_CAM } from '../three/terrain';
import { THEME_CYCLE, THEME_CYCLE_MS } from '../three/themes';
import { normalizeMessage, randomLanternPosition, getRandomPositionOnSphere, toVector3 } from '../three/messages';
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
import { NebulaField, Moon } from './sky/Backdrop';
import { Ground, HillDetails, Fireflies, MountainRange } from './sky/Terrain';
import { Bench, Signpost } from './sky/Foreground';
import { CameraRig, SkyRig, GroundCollision } from './sky/Rigs';
import ReadingCard from './sky/ReadingCard';
import SearchPanel from './sky/SearchPanel';
import { useOutsideTapClose } from './sky/useOutsideTapClose';

// Orchestrator: owns scene state (messages, selection, theme, modals),
// wires texture instances into scene components via props, and composes
// the Canvas + HTML overlays. All 3D/presentational work lives in ./sky/*.
const NightSky = () => {
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);

  // States for modals
  const [isWriting, setIsWriting] = useState(false);
  const [isWishing, setIsWishing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Last failed send — shown as a dismissible banner (auto-clears)
  const [sendError, setSendError] = useState(null);
  useEffect(() => {
    if (!sendError) return;
    const t = setTimeout(() => setSendError(null), 6000);
    return () => clearTimeout(t);
  }, [sendError]);

  // Fresh arrivals (id -> release timestamp): they glow brightly for
  // FRESH_GLOW_MS so you can spot where yours landed, then settle
  const [freshMap, setFreshMap] = useState({});
  const markFresh = (id) => {
    if (id === null || id === undefined) return;
    setFreshMap((prev) => ({ ...prev, [id]: Date.now() }));
    setTimeout(() => {
      setFreshMap((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, FRESH_GLOW_MS + 1000);
  };

  // Sky atmosphere setting (dusk / nightfall / deep night / dawn — smoothed by SkyRig)
  const [skyTheme, setSkyTheme] = useState('deepnight');
  // Immersion toggle: hides every button (panels + modals stay readable)
  const [uiHidden, setUiHidden] = useState(false);
  const ambientRef = useRef(null);
  const sunRef = useRef(null);
  const groundMatRef = useRef(null);
  const mtnMatRef = useRef(null);
  const mtnFarMatRef = useRef(null);
  const veilRef = useRef(null);

  // Click-to-focus: which object the camera is flying to (null = free explore)
  const [selectedId, setSelectedId] = useState(null);
  // Trail sign selection (its own state — it isn't a message row)
  const [selectedSign, setSelectedSign] = useState(false);
  // Bench close-up selection (also not a message row, no reading panel)
  const [selectedBench, setSelectedBench] = useState(false);
  // Lanterns drift as they rise, so we snapshot the lantern's live position on click
  const [focusOverride, setFocusOverride] = useState(null);
  const controlsRef = useRef(null);
  const downPos = useRef(null);
  // Flight state shared with the CameraRig (grabbing the scene cancels motion)
  const flightRef = useRef({ flying: false, homingCam: false });
  // Reset-to-bench signal consumed by the CameraRig
  const [homeSignal, setHomeSignal] = useState(0);

  const starTexture = useStarTexture();
  const coronaTexture = useCoronaTexture();
  const glowTexture = useGlowTexture();
  const paperTexture = usePaperTexture();
  const trailTexture = useTrailTexture();
  const nebulaTexture = useNebulaTexture();
  const moonTexture = useMoonTexture();
  const groundTexture = useGroundTexture();
  const woodTexture = useWoodTexture();

  // Smooth fade-in on mount — slight delay so the splash screen shows
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Ambient rotation: drift through every sky mood on a slow timer so the
  // scene stays alive. Manual picks just move the starting point — the
  // cycle continues from there. SkyRig blends each shift over ~2s.
  useEffect(() => {
    const id = setInterval(() => {
      setSkyTheme((prev) => {
        const i = THEME_CYCLE.indexOf(prev);
        return THEME_CYCLE[(i + 1) % THEME_CYCLE.length];
      });
    }, THEME_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  // Load messages from the backend on mount — real user data only.
  // Empty sky (background stars + terrain still render) when empty/offline.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchMessages();
        if (cancelled) return;
        setMessages(Array.isArray(data) ? data.map(normalizeMessage) : []);
      } catch (err) {
        console.error('Failed to load messages:', err);
        if (!cancelled) setMessages([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const stars = useMemo(() => messages.filter(m => m.type === 'star' && m.position), [messages]);
  const lanterns = useMemo(() => messages.filter(m => m.type === 'lantern'), [messages]);

  // Selected object + its world position drive the reading panel and camera flight
  const selectedStar = useMemo(
    () => messages.find(m => m.id === selectedId) || null,
    [messages, selectedId]
  );
  const selectedIsLantern = selectedStar?.type === 'lantern';
  const focusPoint = useMemo(() => {
    if (selectedSign) return OVERLOOK;
    if (selectedBench) return BENCH_FOCUS;
    if (!selectedId) return null;
    return toVector3(focusOverride) || toVector3(selectedStar?.position);
  }, [selectedId, selectedSign, selectedBench, focusOverride, selectedStar]);
  // Directed camera perch (sign overlook) — null means "hold current side"
  const focusCam = useMemo(() => (selectedSign ? SIGN_CAM : null), [selectedSign]);

  const clearProps = useCallback(() => {
    setSelectedId(null);
    setFocusOverride(null);
    setSelectedSign(false);
    setSelectedBench(false);
  }, []);

  // Ref to the reading card: taps inside it never close it
  const cardRef = useRef(null);

  // Fast outside-tap close (HTML-level pointerup) + Escape
  useOutsideTapClose({ active: !!selectedStar, cardRef, onClose: clearProps });

  const handleSelectStar = (msg) => {
    clearProps();
    if (msg) {
      setSelectedId(msg.id);
    }
  };

  const handleSelectLantern = (msg, livePos) => {
    clearProps();
    if (msg) {
      setSelectedId(msg.id);
      setFocusOverride(livePos || msg.position);
    }
  };

  const handleSelectSign = () => {
    clearProps();
    setSelectedSign(true);
  };

  const handleSelectSearchResult = (msg) => {
    if (msg.type === 'lantern') {
      setSelectedId(msg.id);
      setFocusOverride(msg.position);
      setSelectedSign(false);
      setSelectedBench(false);
    } else {
      setSelectedId(msg.id);
      setFocusOverride(null);
      setSelectedSign(false);
      setSelectedBench(false);
    }
  };

  const handleSelectBench = () => {
    clearProps();
    setSelectedBench(true);
  };

  // Clicking empty space deselects (ignored when it was actually an orbit drag).
  // Note: background objects (stars field, nebulae, ground, mountains, moon)
  // opt out of raycasting via raycast={() => null} so taps there count as
  // a miss instead of a dead hit.
  const handlePointerMissed = (e) => {
    if (!downPos.current) return;
    const dx = e.clientX - downPos.current[0];
    const dy = e.clientY - downPos.current[1];
    // Forgiving for touch taps, still ignores orbit drags
    if (dx * dx + dy * dy < TAP_TOLERANCE_SQ) clearProps();
  };

  // Arm a fresh focus flight whenever a (new) star is selected
  useEffect(() => {
    flightRef.current.flying = selectedId !== null || selectedSign || selectedBench;
  }, [selectedId, selectedSign, selectedBench]);

  const handleSendMessage = async (data) => {
    // Persist to the backend (Supabase) — no local fallback: unsaved
    // messages must never appear as phantom stars/lanterns.
    try {
      const saved = await sendMessage(data);
      const normalized = normalizeMessage({
        ...saved,
        // Backend returns a raw row (position_x/y/z); normalizeMessage handles it.
        // Keep the requested lantern type for display even if backend stored otherwise.
        type: data.type || saved.type,
        position: saved.position || saved.position_x !== undefined
          ? (saved.position || { x: saved.position_x, y: saved.position_y, z: saved.position_z })
          : undefined,
      });
      // Ensure display position exists for stars/lanterns created without one
      if (!normalized.position) {
        normalized.position =
          normalized.type === 'lantern' ? randomLanternPosition() : getRandomPositionOnSphere(45);
      }
      setMessages(prev => [...prev, normalized]);
      markFresh(normalized.id);
      // Showcase the new arrival: fly the camera out to it (stops at focus
      // distance — close enough to see, never on top of it)
      if (normalized.type === 'lantern') handleSelectLantern(normalized, normalized.position);
      else handleSelectStar(normalized);
    } catch (err) {
      // Surface the failure so the user knows their wish wasn't saved
      // (rate-limit, validation, or backend down) instead of faking it.
      setSendError(err.message || 'Could not save — please try again');
    }
  };

  return (
    <div
      className={`relative w-full h-screen bg-black text-white overflow-hidden transition-opacity duration-[1500ms] ${ready ? 'opacity-100' : 'opacity-0'}`}
      onPointerDown={(e) => {
        downPos.current = [e.clientX, e.clientY];
        flightRef.current.flying = false; // grabbing the scene cancels any flight
        flightRef.current.homingCam = false;
      }}
    >
      {/* Splash overlay — fades out once the scene is ready */}
      <div
        className={`absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#020205] transition-all duration-[2000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          ready ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
        }`}
      >
        {/* Star icon */}
        <div className={`transition-all duration-1000 delay-300 ${ready ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          <svg className="w-10 h-10 text-blue-300/80 mb-6 filter drop-shadow-[0_0_12px_rgba(147,197,253,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        {/* Title */}
        <h1 className={`font-serif text-2xl sm:text-4xl tracking-[0.15em] text-white/90 transition-all duration-1000 delay-500 ${ready ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          Under the Same Sky
        </h1>
        {/* Subtle tagline */}
        <p className={`mt-3 text-[10px] sm:text-xs text-blue-200/40 uppercase tracking-[0.3em] font-bold transition-all duration-1000 delay-700 ${ready ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
          Cast your thought into the void
        </p>
        {/* Loading bar */}
        <div className={`mt-8 w-32 h-[2px] bg-white/5 rounded-full overflow-hidden transition-all duration-700 delay-200 ${ready ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`h-full bg-gradient-to-r from-blue-400/60 to-indigo-400/60 rounded-full transition-all duration-[3000ms] ease-linear ${ready ? 'w-full' : 'w-0'}`} />
        </div>
      </div>
      <Canvas camera={{ position: HOME_POS.toArray(), fov: 50 }} onPointerMissed={handlePointerMissed}>

        {/* --- ATMOSPHERE --- */}
        {/* Dark Blue-Black Night Sky */}
        <color attach="background" args={['#020205']} />
        {/* Long-range fog: crisp hilltop nearby, hazy ridges far (melts peaks into sky) */}
        <fog attach="fog" args={['#020205', 25, 300]} />

        {/* Hilltop POV: ground, bench, signpost, pines, rocks, fireflies + mountain ranges */}
        <Ground texture={groundTexture} matRef={groundMatRef} />
        <Bench wood={woodTexture} glow={glowTexture} onSelect={handleSelectBench} />
        <Signpost wood={woodTexture} onSelect={handleSelectSign} />
        <HillDetails />
        <Fireflies texture={coronaTexture} />
        <MountainRange nearRef={mtnMatRef} farRef={mtnFarMatRef} />

        {/* Deep-space nebula clouds + moon */}
        <NebulaField texture={nebulaTexture} />
        <Moon texture={moonTexture} glow={coronaTexture} />

        {/* Thousands of distant background stars (shell sits beyond the moon) */}
        <Stars radius={800} depth={100} count={7000} factor={4} saturation={0} fade speed={0.5} raycast={() => null} />
        {/* Brighter near veil: extra depth at deep night, breathed by SkyRig */}
        <Stars ref={veilRef} radius={500} depth={80} count={6000} factor={5} saturation={0} fade speed={0.6} raycast={() => null} />

        {/* Subtle floating dust/fireflies */}
        <Sparkles count={300} scale={60} size={2} speed={0.2} opacity={0.3} color="#aaddff" raycast={() => null} />

        {/* --- LIGHTING --- */}
        <ambientLight ref={ambientRef} intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        {/* Key light: moonlight by night, low warm sun at dusk/dawn (driven by SkyRig) */}
        <directionalLight ref={sunRef} position={[-345, 237, -496]} intensity={0.35} color="#b9c8ff" />
        {/* Sky theme blender */}
        <SkyRig theme={skyTheme} ambientRef={ambientRef} sunRef={sunRef} groundRef={groundMatRef} mtnRef={mtnMatRef} mtnFarRef={mtnFarMatRef} veilRef={veilRef} />

        {/* --- CONTENT --- */}
        <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
          {/* Stars */}
          {stars.map((msg) => (
            <MessageStar
              key={msg.id}
              position={msg.position}
              message={msg}
              baseSize={(msg.size || 0.5) * 2}
              texture={starTexture}
              corona={coronaTexture}
              selected={msg.id === selectedId}
              onSelect={handleSelectStar}
              bornAt={freshMap[msg.id]}
            />
          ))}
        </Float>

        {/* Lanterns */}
        {lanterns.map((msg) => (
            <FloatingLantern
              key={msg.id}
              position={msg.position}
              message={msg}
              onSelect={handleSelectLantern}
              glow={glowTexture}
              paper={paperTexture}
              bornAt={freshMap[msg.id]}
            />
        ))}

        <FallingStarSystem headTexture={starTexture} trailTexture={trailTexture} />

        {/* --- CONTROLS --- */}
        {/* Focus flight runs alongside the controls */}
        <CameraRig controlsRef={controlsRef} focusPoint={focusPoint} focusCam={focusCam} flightRef={flightRef} homeSignal={homeSignal} />
        <OrbitControls
          ref={controlsRef}
          // Rest gaze aims at the signage so it sits centered on reset
          target={[0, 1, 0]}
          enablePan={false}
          enableZoom={true}
          // Deep dynamic zoom: dive right up to a star, pull back for the wide
          // hilltop vista — capped so scrolling out can't leave the scene
          minDistance={2.5}
          maxDistance={80}
          zoomSpeed={1.2}
          zoomToCursor={true}
          // Full vertical freedom: dragging down swoops the camera to the grass
          // so you can lie back and gaze straight up (GroundCollision below
          // keeps you from tunneling through the hill). Dragging up stops
          // before a top-down view so you never lose the sky to dirt.
          minPolarAngle={0.6}
          maxPolarAngle={Math.PI - 0.05}
          // Slow, cinematic rotation
          autoRotate={true}
          autoRotateSpeed={0.3}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.4}
          reverseOrbit={true}
        />
        {/* Terrain collision: runs after the controls, slides the camera
            along the hill instead of letting it sink through */}
        <GroundCollision
          controlsRef={controlsRef}
          lockTarget={selectedId !== null || selectedSign || selectedBench}
        />
      </Canvas>

      {/* Selected star / lantern message — responsive bottom-center reading card */}
      {selectedStar && (
        <ReadingCard message={selectedStar} isLantern={selectedIsLantern} cardRef={cardRef} />
      )}

      {/* Trail sign uses the centered wooden SignModal (see Global Modals) */}

      {/* --- Global Modals --- */}
      <ComposeModal isOpen={isWriting} onClose={() => setIsWriting(false)} onSend={handleSendMessage} />
      <WishingModal isOpen={isWishing} onClose={() => setIsWishing(false)} onSend={handleSendMessage} />
      <SignModal open={selectedSign} onClose={() => setSelectedSign(false)} />

      {/* Search panel — centered on mobile, top-right on desktop */}
      {isSearching && (
        <div className="fixed top-16 left-4 right-4 sm:top-20 sm:right-6 sm:left-auto sm:w-auto z-50 flex sm:block justify-center">
          <SearchPanel
            messages={messages}
            onSelect={handleSelectSearchResult}
            onClose={() => setIsSearching(false)}
          />
        </div>
      )}

      {/* Send failure banner — top-center, dismissible, auto-clears */}
      {sendError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <div className="flex items-center gap-3 bg-red-950/90 backdrop-blur-xl border border-red-500/30 rounded-xl px-4 py-3 shadow-[0_0_30px_rgba(239,68,68,0.25)] animate-in fade-in slide-in-from-top-4 duration-300">
            <span aria-hidden className="text-red-400 text-lg shrink-0">⚠</span>
            <p className="flex-1 text-sm text-red-200 font-medium leading-snug">{sendError}</p>
            <button
              type="button"
              onClick={() => setSendError(null)}
              aria-label="Dismiss error"
              className="shrink-0 text-red-400/70 hover:text-red-300 text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {!uiHidden && <TopBar />}

      <HUD
        onOpenCompose={() => setIsWriting(true)}
        onOpenWish={() => setIsWishing(true)}
        skyTheme={skyTheme}
        onSkyTheme={setSkyTheme}
        uiHidden={uiHidden}
        onToggleUI={() => setUiHidden((v) => !v)}
        onReset={() => {
          clearProps();
          setHomeSignal((s) => s + 1);
        }}
        isSearching={isSearching}
        onToggleSearch={() => { setIsSearching((v) => !v); clearProps(); }}
      />
    </div>
  );
};

export default NightSky;
