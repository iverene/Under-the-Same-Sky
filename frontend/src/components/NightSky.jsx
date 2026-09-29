import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { fetchMessages, sendMessage } from '../api';
import ComposeModal from './ComposeModal';
import WishingModal from './WishingModal';
import SignModal from './SignModal';
import TeamModal from './TeamModal';
import HUD from './HUD';
import TopBar from './TopBar';
import { FRESH_GLOW_MS, TAP_TOLERANCE_SQ } from '../three/config';
import { BENCH_FOCUS, HOME_POS, OVERLOOK, SIGN_CAM, DECK_FOCUS } from '../three/terrain';
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
import { Bench, Signpost, Stargazers } from './sky/Foreground';
import { CameraRig, SkyRig, GroundCollision } from './sky/Rigs';
import ReadingCard from './sky/ReadingCard';
import IntroScreen from './sky/IntroScreen';
import SearchPanel from './sky/SearchPanel';
import { useOutsideTapClose } from './sky/useOutsideTapClose';

// Renders a single frame on mount so shaders and textures are warm while the
// opaque intro covers the screen; the loop itself stays paused until Start.
const SceneWarmup = () => {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
};

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
  const [skyTheme, setSkyTheme] = useState('dusk');
  // Immersion toggle: hides every button (panels + modals stay readable)
  const [uiHidden, setUiHidden] = useState(false);
  // Touch device signal (coarse pointer): drives touch-tuned controls.
  // Matches HUD's detection so hint copy and behavior stay in sync.
  const [isTouchDevice, setIsTouchDevice] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = (e) => setIsTouchDevice(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
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
  // Stargazer couple selection (opens the team modal)
  const [selectedTeam, setSelectedTeam] = useState(false);
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

  const [splashVisible, setSplashVisible] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const handleIntroStart = useCallback(() => setShowIntro(false), []);

  // Memoized starfield for splash so positions don't regenerate on re-render
  const splashStars = useMemo(() =>
    Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 4,
      dur: 1.5 + Math.random() * 3,
    })), []
  );

  // Memoized floating lanterns for splash
  const splashLanterns = useMemo(() =>
    Array.from({ length: 6 }, () => ({
      x: 10 + Math.random() * 80,
      size: 14 + Math.random() * 10,
      delay: Math.random() * 5,
      dur: 6 + Math.random() * 4,
      drift: (Math.random() - 0.5) * 30,
    })), []
  );

  // Splash shows briefly then fades out gracefully
  useEffect(() => {
    const fadeTimer = setTimeout(() => setReady(true), 1200);
    const unmountTimer = setTimeout(() => setSplashVisible(false), 2500);
    return () => { clearTimeout(fadeTimer); clearTimeout(unmountTimer); };
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
  // Polls every 10s and merges new arrivals by ID so existing stars
  // never remount or jump. Also refetches when the tab regains focus.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchMessages();
        if (cancelled) return;
        const incoming = Array.isArray(data) ? data.map(normalizeMessage) : [];
        setMessages((prev) => {
          if (prev.length === 0) return incoming;
          const byId = new Map(prev.map((m) => [m.id, m]));
          let changed = false;
          for (const msg of incoming) {
            if (!byId.has(msg.id)) {
              byId.set(msg.id, msg);
              changed = true;
            }
          }
          return changed ? Array.from(byId.values()) : prev;
        });
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    load();

    // Poll every 10 seconds for cross-device updates
    const pollId = setInterval(load, 10000);

    // Refetch when tab becomes visible again
    const onVisibility = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
    if (selectedTeam) return DECK_FOCUS;
    if (!selectedId) return null;
    return toVector3(focusOverride) || toVector3(selectedStar?.position);
  }, [selectedId, selectedSign, selectedBench, selectedTeam, focusOverride, selectedStar]);
  // Directed camera perch (sign overlook) — null means "hold current side"
  const focusCam = useMemo(() => (selectedSign ? SIGN_CAM : null), [selectedSign]);

  const clearProps = useCallback(() => {
    setSelectedId(null);
    setFocusOverride(null);
    setSelectedSign(false);
    setSelectedBench(false);
    setSelectedTeam(false);
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
    clearProps();
    if (msg.type === 'lantern') {
      setSelectedId(msg.id);
      setFocusOverride(msg.position);
    } else {
      setSelectedId(msg.id);
    }
  };

  const handleSelectBench = () => {
    clearProps();
    setSelectedBench(true);
  };

  const handleSelectTeam = () => {
    clearProps();
    setSelectedTeam(true);
  };

  // Clicking empty space deselects (ignored when it was actually an orbit drag).
  // Note: background objects (stars field, nebulae, ground, mountains, moon)
  // opt out of raycasting via raycast={() => null} so taps there count as
  // a miss instead of a dead hit.
  const handlePointerMissed = (e) => {
    if (!downPos.current || isSearching) return;
    const dx = e.clientX - downPos.current[0];
    const dy = e.clientY - downPos.current[1];
    // Forgiving for touch taps, still ignores orbit drags
    if (dx * dx + dy * dy < TAP_TOLERANCE_SQ) clearProps();
  };

  // Arm a fresh focus flight whenever a (new) star is selected
  useEffect(() => {
    flightRef.current.flying = selectedId !== null || selectedSign || selectedBench || selectedTeam;

  }, [selectedId, selectedSign, selectedBench, selectedTeam]);
  const handleSendMessage = async (data) => {
    // Persist to the backend (Supabase) — no local fallback: unsaved
    // messages must never appear as phantom stars/lanterns.
    try {
      const saved = await sendMessage(data);
      const normalized = normalizeMessage({
        ...saved,
        // Backend returns a raw row (position_x/y/z); normalizeMessage handles it.
        // Keep the requested lantern type for display even if backend stored otherwise.
        // Prefer the saved sender row, fall back to what was just typed.
        sender: saved.sender ?? data.sender ?? null,
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
    <>
    {/* Splash overlay — fades out gracefully */}
    {splashVisible && (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#020205] overflow-hidden transition-opacity duration-[1300ms] ease-out ${ready ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

      {/* Animated starfield background */}
      <div className="absolute inset-0">
        {splashStars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              animation: `splashStar ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Gradient orbs — ambient glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[150px] top-1/4 left-1/2 -translate-x-1/2" />
      <div className="absolute w-[300px] h-[300px] bg-indigo-500/6 rounded-full blur-[120px] bottom-1/4 left-1/3" />

      {/* Floating lanterns */}
      {splashLanterns.map((l, i) => (
        <div
          key={`lantern-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: `${l.x}%`,
            bottom: '-5%',
            width: l.size,
            height: l.size * 1.3,
            '--drift': `${l.drift}px`,
            animation: `splashLantern ${l.dur}s ease-in ${l.delay}s infinite`,
          }}
        >
          {/* Lantern body */}
          <div className="w-full h-full rounded-[40%_40%_50%_50%] bg-gradient-to-b from-amber-200/80 to-amber-400/60 shadow-[0_0_20px_rgba(255,200,100,0.4),0_0_40px_rgba(255,180,60,0.15)]" />
          {/* Inner glow */}
          <div className="absolute inset-[20%] rounded-[40%_40%_50%_50%] bg-gradient-to-b from-yellow-100/90 to-amber-300/70 blur-[1px]" />
        </div>
      ))}

      {/* Moon */}
      <div className="absolute top-[12%] left-1/2 -translate-x-1/2">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-50 to-yellow-100 shadow-[0_0_80px_rgba(255,250,205,0.25),0_0_160px_rgba(255,250,205,0.1)]" />
          <div className="absolute top-2 right-3 w-6 h-6 rounded-full bg-amber-200/30 blur-[2px]" />
          <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-amber-200/20 blur-[1px]" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* App name */}
        <h1 className="font-serif text-3xl sm:text-6xl tracking-[0.08em] text-white mb-3 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          Under the Same Sky
        </h1>

        {/* Divider line */}
        <div className="w-20 sm:w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-3" />

        {/* Tagline */}
        <p className="text-[10px] sm:text-xs text-blue-200/50 uppercase tracking-[0.3em] sm:tracking-[0.35em] font-bold mb-8 sm:mb-10">
          Cast your thought into the void
        </p>

        {/* Loading bar */}
        <div className="w-40 sm:w-56 relative">
          <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 rounded-full animate-[splashLoad_1.2s_ease-in-out_forwards]" />
          </div>
          <div className="absolute -bottom-2 left-0 right-0 h-4 bg-blue-400/10 blur-lg rounded-full animate-[splashLoad_1.2s_ease-in-out_forwards]" />
        </div>

        {/* Loading text */}
        <p className="mt-5 text-[9px] text-slate-500 uppercase tracking-[0.4em] font-bold animate-pulse" style={{ animationDuration: '1.5s' }}>
          Entering the sky
        </p>
      </div>
    </div>
    )}

    <div
      className={`relative w-full h-screen bg-black text-white overflow-hidden transition-opacity duration-[1500ms] ${ready ? 'opacity-100' : 'opacity-0'}`}
      onPointerDown={(e) => {
        downPos.current = [e.clientX, e.clientY];
        flightRef.current.flying = false; // grabbing the scene cancels any flight
        flightRef.current.homingCam = false;
      }}
    >
      <Canvas camera={{ position: HOME_POS.toArray(), fov: 50 }} frameloop={showIntro ? 'never' : 'always'} onPointerMissed={handlePointerMissed}>
        <SceneWarmup />

        {/* --- ATMOSPHERE --- */}
        {/* Dark Blue-Black Night Sky */}
        <color attach="background" args={['#020205']} />
        {/* Long-range fog: crisp hilltop nearby, hazy ridges far (melts peaks into sky) */}
        <fog attach="fog" args={['#020205', 25, 300]} />

        {/* Hilltop POV: ground, bench, signpost, pines, rocks, fireflies + mountain ranges */}
        <Ground texture={groundTexture} matRef={groundMatRef} />
        <Bench wood={woodTexture} glow={glowTexture} onSelect={handleSelectBench} />
        <Signpost wood={woodTexture} onSelect={handleSelectSign} />
        <Stargazers wood={woodTexture} glow={glowTexture} onSelect={handleSelectTeam} />
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
              selected={msg.id === selectedId && selectedIsLantern}
              onLivePosition={msg.id === selectedId && selectedIsLantern ? (pos) => setFocusOverride(pos) : undefined}
            />
        ))}

        <FallingStarSystem headTexture={starTexture} trailTexture={trailTexture} />

        {/* --- CONTROLS --- */}
        {/* Focus flight runs alongside the controls */}
        <CameraRig controlsRef={controlsRef} focusPoint={focusPoint} focusCam={focusCam} flightRef={flightRef} homeSignal={homeSignal} introHold={showIntro} />
        <OrbitControls
          ref={controlsRef}
          target={[0, 1, 0]}
          enablePan={false}
          enableZoom={true}
          // Deep dynamic zoom: dive right up to a star, pull back for the wide
          // hilltop vista — capped so scrolling out can't leave the scene
          minDistance={2.5}
          maxDistance={80}
          // Touch tuning: pinch moves less per gesture than a wheel, so it
          // gets a higher speed; zoomToCursor is off on touch so the target
          // doesn't drift under the fingers mid-pinch.
          zoomSpeed={isTouchDevice ? 1.8 : 1.2}
          zoomToCursor={!isTouchDevice}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
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
          lockTarget={selectedId !== null || selectedSign || selectedBench || selectedTeam}
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
      <TeamModal open={selectedTeam} onClose={() => setSelectedTeam(false)} />

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

      {ready && !splashVisible && showIntro && (<IntroScreen onStart={handleIntroStart} />)}
      {!showIntro && !uiHidden && <TopBar skyTheme={skyTheme} />}

      {!showIntro && (
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
      )}
    </div>
    </>
  );
};

export default NightSky;
