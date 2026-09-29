import { useEffect, useState } from 'react';
import { POOL, FALLBACK_PAIR, randomDialogueIndex } from './introDialogues';

// Deterministic star layout: stable across renders without calling the
// impure Math.random during render (react-hooks/purity forbids it).
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rand = mulberry32(20260929);
const STARS = Array.from({ length: 90 }, () => ({
  x: rand() * 100,
  y: rand() * 62,
  size: rand() * 2 + 1,
  delay: rand() * 4,
  dur: 2 + rand() * 3,
}));

const bubbleCls =
  'absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 sm:w-56 rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-xl px-4 py-3 text-xs sm:text-sm font-serif italic text-slate-200 shadow-[0_0_30px_rgba(150,180,255,0.2)] transition-opacity duration-1000';

const IntroScreen = ({ onStart }) => {
  const [pair] = useState(() => POOL[randomDialogueIndex(-1)] || FALLBACK_PAIR);
  const [phase, setPhase] = useState('boy');
  const [leaving, setLeaving] = useState(false);
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('girl'), 4000);
    const t2 = setTimeout(() => setPhase('ready'), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const skipToButton = () => setPhase('ready');
  const handleStart = () => {
    setLeaving(true);
    setTimeout(() => onStart && onStart(), reduceMotion ? 0 : 1000);
  };

  return (
    <div
      aria-live="polite"
      className={`fixed inset-0 z-40 overflow-hidden bg-[#020205] transition-opacity duration-1000 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop: gradient wash, twinkling stars, moon glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,#1b2340_0%,#020205_65%)]" aria-hidden />
      <div className="absolute inset-0" aria-hidden>
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              animation: reduceMotion ? undefined : `splashStar ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>
      <div
        aria-hidden
        className="absolute top-[10%] right-[16%] h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-amber-50 to-yellow-100 shadow-[0_0_80px_rgba(255,250,205,0.25)]"
      />

      {/* Couple: original inline SVG echoing the 3D stargazers */}
      <div className="absolute inset-x-0 bottom-[16%] flex items-end justify-center gap-10 sm:gap-14">
        {/* Girl (left, dress) */}
        <div className="relative">
          <div
            className={`transition-opacity duration-1000 ${phase === 'girl' ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className={bubbleCls}>
              <p className="font-sans text-[9px] font-bold uppercase not-italic tracking-[0.25em] text-pink-200">
                Girl
              </p>
              <p className="mt-1">{pair.girl}</p>
            </div>
          </div>
          <svg width="86" height="150" viewBox="0 0 86 150" role="img" aria-label="Girl stargazer">
            <ellipse cx="43" cy="144" rx="30" ry="6" fill="#000" opacity="0.5" />
            <path d="M43 62 L28 118 L58 118 Z" fill="#8a4f6e" />
            <rect x="36" y="46" width="14" height="20" rx="5" fill="#8a4f6e" />
            <circle cx="43" cy="36" r="11" fill="#eab88f" />
            <path d="M32 34 a11 11 0 0 1 22 0 l0 -4 a11 8 0 0 0 -22 0" fill="#4a2c1a" />
            <rect x="30" y="40" width="26" height="26" rx="9" fill="none" stroke="#4a2c1a" strokeWidth="5" />
            <rect x="24" y="66" width="8" height="26" rx="4" fill="#8a4f6e" />
            <rect x="54" y="52" width="8" height="26" rx="4" fill="#8a4f6e" transform="rotate(-24 58 56)" />
          </svg>
          <p className="mt-2 text-center font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-pink-200/80">
            Girl
          </p>
        </div>
        {/* Boy (right, jacket) */}
        <div className="relative">
          <div
            className={`transition-opacity duration-1000 ${phase === 'boy' ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className={bubbleCls}>
              <p className="font-sans text-[9px] font-bold uppercase not-italic tracking-[0.25em] text-blue-200">
                Boy
              </p>
              <p className="mt-1">{pair.boy}</p>
            </div>
          </div>
          <svg width="86" height="150" viewBox="0 0 86 150" role="img" aria-label="Boy stargazer">
            <ellipse cx="43" cy="144" rx="30" ry="6" fill="#000" opacity="0.5" />
            <rect x="30" y="96" width="11" height="44" rx="4" fill="#26304a" />
            <rect x="45" y="96" width="11" height="44" rx="4" fill="#26304a" />
            <rect x="29" y="58" width="28" height="42" rx="7" fill="#3a5a8c" />
            <circle cx="43" cy="44" r="12" fill="#d99f6e" />
            <path d="M31 42 a12 12 0 0 1 24 0 l0 -3 a12 8 0 0 0 -24 0" fill="#241a12" />
            <rect x="21" y="62" width="9" height="30" rx="4.5" fill="#3a5a8c" />
            <rect x="56" y="62" width="9" height="30" rx="4.5" fill="#3a5a8c" />
          </svg>
          <p className="mt-2 text-center font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-blue-200/80">
            Boy
          </p>
        </div>
      </div>

      {/* Start button replaces the dialogue; Skip jumps straight here */}
      <div className="absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-3">
        {phase === 'ready' && !leaving && (
          <button
            type="button"
            onClick={handleStart}
            autoFocus
            className="modal-pop rounded-full border border-white/20 bg-white/10 px-8 py-3 font-sans text-xs font-bold uppercase tracking-[0.3em] text-white backdrop-blur-xl transition-colors hover:bg-white/20"
          >
            Start Exploring
          </button>
        )}
        {phase !== 'ready' && (
          <button
            type="button"
            onClick={skipToButton}
            aria-label="Skip introduction"
            className="text-[11px] uppercase tracking-[0.3em] text-slate-400 transition-colors hover:text-white"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

export default IntroScreen;
