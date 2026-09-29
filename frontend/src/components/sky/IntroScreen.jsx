import { useEffect, useState, useMemo } from 'react';
import { POOL, FALLBACK_PAIR, randomDialogueIndex } from './introDialogues';
import { GirlFigure, BoyFigure } from './Couple';
import useTypewriter from './useTypewriter';

// Deterministic PRNG
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rand = mulberry32(20260929);
const STARS = Array.from({ length: 95 }, () => ({
  x: +(rand() * 100).toFixed(2),
  y: +(rand() * 68).toFixed(2),
  size: +(rand() * 2 + 1).toFixed(1),
  delay: +(rand() * 4).toFixed(1),
  dur: +(2.5 + rand() * 3).toFixed(1),
  opacity: +(0.4 + rand() * 0.6).toFixed(2),
}));

const PHASE_ORDER = { boy: 0, girl: 1, ready: 2 };

const IntroScreen = ({ onStart }) => {
  const pair = useMemo(() => POOL[randomDialogueIndex(-1)] || FALLBACK_PAIR, []);
  const [phase, setPhase] = useState('boy');
  const [leaving, setLeaving] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    media.addEventListener?.('change', handler);
    return () => media.removeEventListener?.('change', handler);
  }, []);

  // Monotonic fallback timers: rapid taps must never be regressed by a late
  // timer fire (e.g. reaching `ready` before t1 fires).
  useEffect(() => {
    const t1 = setTimeout(() => setPhase((p) => (PHASE_ORDER[p] < 1 ? 'girl' : p)), 4200);
    const t2 = setTimeout(() => setPhase((p) => (PHASE_ORDER[p] < 2 ? 'ready' : p)), 8400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const skipToButton = () => setPhase('ready');

  const boyType = useTypewriter(pair.boy, {
    active: phase === 'boy',
    speed: 28,
    reduceMotion: prefersReducedMotion,
  });
  const girlType = useTypewriter(pair.girl, {
    active: phase === 'girl',
    speed: 28,
    reduceMotion: prefersReducedMotion,
  });

  // Tap anywhere except buttons: complete the typing line first,
  // otherwise advance boy -> girl -> ready. Absolute-phase timers can
  // never regress a manual advance.
  const advanceFromTap = (e) => {
    if (e.target.closest?.('button')) return;
    if (phase === 'boy') {
      if (!boyType.done) boyType.complete();
      else setPhase('girl');
    } else if (phase === 'girl') {
      if (!girlType.done) girlType.complete();
      else setPhase('ready');
    }
  };

  const handleStart = () => {
    setLeaving(true);
    setTimeout(() => onStart && onStart(), prefersReducedMotion ? 0 : 850);
  };

  const bubbleBaseCls =
    'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-44 sm:w-60 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-md px-4 py-3 text-xs sm:text-sm font-serif italic text-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(150,180,255,0.15)] transition-all duration-700';

  return (
    <div
      aria-live="polite"
      onClick={advanceFromTap}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#020205] select-none transition-opacity duration-1000 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background gradients */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,#1c2545_0%,#080a14_45%,#020205_80%)]"
        aria-hidden
      />

      {/* Moon glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[9%] right-[14%] h-20 w-20 rounded-full bg-gradient-to-br from-amber-50 to-amber-200 shadow-[0_0_90px_rgba(255,245,210,0.35)]"
      />

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animation: prefersReducedMotion
                ? undefined
                : `splashStar ${s.dur}s ease-in-out ${s.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Couple Showcase */}
      <div className="absolute inset-x-0 bottom-[18%] flex items-end justify-center gap-12 sm:gap-20">
        {/* Girl (Left) */}
        <div className="relative flex flex-col items-center">
          <div
            aria-hidden={phase !== 'girl'}
            className={`${bubbleBaseCls} ${
              phase === 'girl'
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-2 scale-95'
            }`}
          >
            <p className="font-sans text-[10px] font-semibold uppercase not-italic tracking-[0.2em] text-pink-300/90">
              Girl
            </p>
            <p className="mt-1 leading-relaxed text-slate-100">
              <span aria-hidden="true">
                {girlType.shown}
                {!girlType.done && <span className="animate-pulse">▍</span>}
              </span>
              <span className="sr-only">{pair.girl}</span>
            </p>
            {/* Bubble Tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-r border-b border-white/10 bg-slate-950/80" />
          </div>

          <GirlFigure />
          <span className="mt-3 text-center font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-pink-200/70">
            Girl
          </span>
        </div>

        {/* Boy (Right) */}
        <div className="relative flex flex-col items-center">
          <div
            aria-hidden={phase !== 'boy'}
            className={`${bubbleBaseCls} ${
              phase === 'boy'
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-2 scale-95'
            }`}
          >
            <p className="font-sans text-[10px] font-semibold uppercase not-italic tracking-[0.2em] text-sky-300/90">
              Boy
            </p>
            <p className="mt-1 leading-relaxed text-slate-100">
              <span aria-hidden="true">
                {boyType.shown}
                {!boyType.done && <span className="animate-pulse">▍</span>}
              </span>
              <span className="sr-only">{pair.boy}</span>
            </p>
            {/* Bubble Tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-r border-b border-white/10 bg-slate-950/80" />
          </div>

          <BoyFigure />
          <span className="mt-3 text-center font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-sky-200/70">
            Boy
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute inset-x-0 bottom-[7%] flex flex-col items-center justify-center">
        {phase !== 'ready' && (
          <p
            aria-hidden
            className="text-[10px] uppercase tracking-[0.3em] text-slate-500"
            style={{ animation: 'modal-fade 0.8s ease-out 1.5s both' }}
          >
            Tap anywhere to continue
          </p>
        )}
        {phase === 'ready' && !leaving ? (
          <button
            type="button"
            onClick={handleStart}
            autoFocus
            className="animate-in fade-in zoom-in-95 duration-500 rounded-full border border-white/25 bg-white/10 px-9 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_0_25px_rgba(255,255,255,0.1)] backdrop-blur-lg transition-all hover:bg-white/20 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
          >
            Start Exploring
          </button>
        ) : (
          <button
            type="button"
            onClick={skipToButton}
            aria-label="Skip introduction dialogue"
            className="text-[11px] font-medium uppercase tracking-[0.3em] text-slate-400/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            Skip
          </button>
        )}
      </div>

      {/* CSS Star Fallback */}
      <style>{`
        @keyframes splashStar {
          0% { opacity: 0.2; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 0.2; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;