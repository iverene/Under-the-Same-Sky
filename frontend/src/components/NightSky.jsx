import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { fetchMessages, sendMessage } from '../api';
import ComposeModal from './ComposeModal';
import WishingModal from './WishingModal';
import SignModal from './SignModal';
import TeamModal from './TeamModal';
import HUD from './HUD';
import TopBar from './TopBar';
import { FRESH_GLOW_MS, TAP_TOLERANCE_SQ } from '../three/config';
import { BENCH_FOCUS, OVERLOOK, SIGN_CAM, DECK_FOCUS } from '../three/terrain';
import { THEME_CYCLE, THEME_CYCLE_MS } from '../three/themes';
import { normalizeMessage, randomLanternPosition, getRandomPositionOnSphere } from '../three/messages';
import Sky3D from './Sky3D';
import Sky2D from './sky2d/Sky2D';
import { readView, writeView } from './sky2d/viewStorage';
import ReadingCard from './sky/ReadingCard';
import IntroScreen from './sky/IntroScreen';
import SearchPanel from './sky/SearchPanel';
import { useOutsideTapClose } from './sky/useOutsideTapClose';
import { readGraphicsQuality, writeGraphicsQuality } from '../graphicsSettings';

const INTRO_SEEN_KEY = 'utss.intro-seen:v1';

const readIntroSeen = () => {
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const markIntroSeen = () => {
  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Private mode / storage disabled — show the intro again next session.
  }
};

// Orchestrator: owns scene state (messages, selection, theme, modals),
// wires state into Sky3D via props, and composes the Canvas + HTML overlays.
// All 3D/presentational work lives in ./Sky3D and ./sky/*.
const NightSky = () => {
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);

  // States for modals
  const [isWriting, setIsWriting] = useState(false);
  const [isWishing, setIsWishing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Active sky view ('3d' | '2d'), restored from storage
  const [view, setView] = useState(readView);
  const [viewTransition, setViewTransition] = useState(false);
  const viewTransitionTimer = useRef(null);
  useEffect(() => {
    writeView(view);
  }, [view]);
  useEffect(() => () => clearTimeout(viewTransitionTimer.current), []);
  const [graphicsQuality, setGraphicsQuality] = useState(readGraphicsQuality);
  const handleGraphicsQuality = useCallback((quality) => {
    setGraphicsQuality(quality);
    writeGraphicsQuality(quality);
  }, []);

  // Last failed send — shown as a dismissible banner (auto-clears)
  const [sendError, setSendError] = useState(null);
  useEffect(() => {
    if (!sendError) return;
    const t = setTimeout(() => setSendError(null), 6000);
    return () => clearTimeout(t);
  }, [sendError]);

  // Last successful send — celebratory banner (auto-clears)
  const [sendSuccess, setSendSuccess] = useState(false);
  useEffect(() => {
    if (!sendSuccess) return;
    const t = setTimeout(() => setSendSuccess(false), 6000);
    return () => clearTimeout(t);
  }, [sendSuccess]);

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
  // Click-to-focus: which object the camera is flying to (null = free explore)
  const [selectedId, setSelectedId] = useState(null);
  // Trail sign selection (its own state — it isn't a message row)
  const [selectedSign, setSelectedSign] = useState(false);
  // Bench close-up selection (also not a message row, no reading panel)
  const [selectedBench, setSelectedBench] = useState(false);
  // Stargazer couple selection (opens the team modal)
  const [selectedTeam, setSelectedTeam] = useState(false);
  const downPos = useRef(null);
  // Flight state shared with the CameraRig (grabbing the scene cancels motion)
  const flightRef = useRef({ flying: false, homingCam: false });
  // Reset-to-bench signal consumed by the CameraRig
  const [homeSignal, setHomeSignal] = useState(0);

  const [splashVisible, setSplashVisible] = useState(true);
  const [showIntro, setShowIntro] = useState(() => !readIntroSeen());
  const handleIntroStart = useCallback(() => setShowIntro(false), []);
  useEffect(() => {
    if (ready && !splashVisible && showIntro) markIntroSeen();
  }, [ready, showIntro, splashVisible]);

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
  const landmarkFocus = useMemo(() => {
    if (selectedSign) return OVERLOOK;
    if (selectedBench) return BENCH_FOCUS;
    if (selectedTeam) return DECK_FOCUS;
    return null;
  }, [selectedSign, selectedBench, selectedTeam]);
  // Directed camera perch (sign overlook) — null means "hold current side"
  const focusCam = useMemo(() => (selectedSign ? SIGN_CAM : null), [selectedSign]);
  const lockTarget = selectedId !== null || selectedSign || selectedBench || selectedTeam;

  const clearProps = useCallback(() => {
    setSelectedId(null);
    setSelectedSign(false);
    setSelectedBench(false);
    setSelectedTeam(false);
  }, []);

  const handleToggleView = useCallback(() => {
    clearProps();
    clearTimeout(viewTransitionTimer.current);
    setViewTransition(true);
    setView((v) => (v === '3d' ? '2d' : '3d'));
    viewTransitionTimer.current = setTimeout(() => setViewTransition(false), 700);
  }, [clearProps]);

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

  const handleSelectLantern = (msg) => {
    clearProps();
    if (msg) setSelectedId(msg.id);
  };

  const handleSelectSign = () => {
    clearProps();
    setSelectedSign(true);
  };

  const handleSelectSearchResult = (msg) => {
    clearProps();
    if (msg) setSelectedId(msg.id);
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
      setSendSuccess(true);
      // Showcase the new arrival: fly the camera out to it (stops at focus
      // distance — close enough to see, never on top of it)
      if (normalized.type === 'lantern') handleSelectLantern(normalized);
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
      {view === '3d' ? (
        <div key="sky3d" className="absolute inset-0 modal-fade">
          <Sky3D
            stars={stars}
            lanterns={lanterns}
            selectedId={selectedId}
            selectedMessage={selectedStar}
            selectedIsLantern={selectedIsLantern}
            freshMap={freshMap}
            skyTheme={skyTheme}
            graphicsQuality={graphicsQuality}
            showIntro={showIntro}
            isTouchDevice={isTouchDevice}
            landmarkFocus={landmarkFocus}
            focusCam={focusCam}
            flightRef={flightRef}
            homeSignal={homeSignal}
            lockTarget={lockTarget}
            onSelectStar={handleSelectStar}
            onSelectLantern={handleSelectLantern}
            onSelectBench={handleSelectBench}
            onSelectSign={handleSelectSign}
            onSelectTeam={handleSelectTeam}
            onPointerMissed={handlePointerMissed}
          />
        </div>
      ) : (
        <div key="sky2d" className="absolute inset-0 modal-fade">
          <Sky2D
            messages={messages}
            selectedId={selectedId}
            skyTheme={skyTheme}
            graphicsQuality={graphicsQuality}
            freshMap={freshMap}
            onSelectStar={handleSelectStar}
            onSelectLantern={handleSelectLantern}
            onSelectTeam={handleSelectTeam}
            onSelectSign={handleSelectSign}
          />
        </div>
      )}

      <div
        aria-hidden={!viewTransition}
        className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#0b1024]/95 transition-opacity duration-300 ${
          viewTransition ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200/20 border-t-blue-200/80" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-100/70">
            Opening the sky
          </span>
        </div>
      </div>

      {/* Selected star / lantern message — responsive bottom-center reading card */}
      {selectedStar && (
        <ReadingCard message={selectedStar} isLantern={selectedIsLantern} cardRef={cardRef} onClose={clearProps} />
      )}

      {/* Trail sign uses the centered wooden SignModal (see Global Modals) */}

      {/* --- Global Modals --- */}
      <ComposeModal isOpen={isWriting} onClose={() => setIsWriting(false)} onSend={handleSendMessage} />
      <WishingModal isOpen={isWishing} onClose={() => setIsWishing(false)} onSend={handleSendMessage} />
      <SignModal open={selectedSign} onClose={() => setSelectedSign(false)} />
      <TeamModal open={selectedTeam} onClose={() => setSelectedTeam(false)} />

      {/* Mobile search takeover — blurred backdrop, panel above it */}
      {isSearching && (
        <div
          aria-hidden
          className="sm:hidden fixed inset-0 z-40 bg-[#020205]/60 backdrop-blur-[3px]"
          onClick={() => setIsSearching(false)}
        />
      )}

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

      {/* Send success banner — top-center, dismissible, auto-clears */}
      {sendSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <div className="flex items-center gap-3 bg-emerald-950/90 backdrop-blur-xl border border-emerald-500/30 rounded-xl px-4 py-3 shadow-[0_0_30px_rgba(52,211,153,0.25)] animate-in fade-in slide-in-from-top-4 duration-300">
            <span aria-hidden className="text-emerald-400 text-lg shrink-0">✦</span>
            <div className="flex-1 leading-snug">
              <p className="text-sm text-emerald-100 font-medium">Your voice is now part of the sky.</p>
              <p className="text-xs text-emerald-200/80 mt-0.5">Someone else may be looking up at this same light.</p>
            </div>
            <button
              type="button"
              onClick={() => setSendSuccess(false)}
              aria-label="Dismiss confirmation"
              className="shrink-0 text-emerald-400/70 hover:text-emerald-300 text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>
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
      {!showIntro && !uiHidden && !(isSearching && isTouchDevice) && <TopBar skyTheme={skyTheme} />}

      {!showIntro && (
      <HUD
        onOpenCompose={() => setIsWriting(true)}
        onOpenWish={() => setIsWishing(true)}
        skyTheme={skyTheme}
        onSkyTheme={setSkyTheme}
        graphicsQuality={graphicsQuality}
        onGraphicsQuality={handleGraphicsQuality}
        view={view}
        onToggleView={handleToggleView}
        uiHidden={uiHidden}
        onToggleUI={() => setUiHidden((v) => !v)}
        onReset={() => {
          clearProps();
          setHomeSignal((s) => s + 1);
        }}
        isSearching={isSearching}
        onToggleSearch={() => { setIsSearching((v) => !v); clearProps(); }}
        modalOpen={isWriting || isWishing || selectedSign || selectedTeam || isSearching}
      />
      )}
    </div>
    </>
  );
};

export default NightSky;
