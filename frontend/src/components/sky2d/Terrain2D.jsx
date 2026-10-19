import { GirlFigure, BoyFigure } from '../sky/Couple';
import { SKY_THEMES } from '../../three/themes';

// Deterministic firefly table (literal coords — no randomness during render).
// Percent coordinates, clustered around the couple on the hill.
const FIREFLIES = [
  { left: 36, top: 80, size: 3, delay: 0.2, dur: 4.2, fx: 5, fy: -8 },
  { left: 43, top: 74, size: 2, delay: 1.1, dur: 5.1, fx: -4, fy: -6 },
  { left: 48, top: 86, size: 3, delay: 2.0, dur: 3.8, fx: 6, fy: -5 },
  { left: 55, top: 71, size: 2, delay: 0.7, dur: 4.7, fx: -5, fy: -9 },
  { left: 61, top: 83, size: 3, delay: 1.6, dur: 5.4, fx: 4, fy: -7 },
  { left: 66, top: 76, size: 2, delay: 2.4, dur: 4.4, fx: -6, fy: -6 },
  { left: 40, top: 90, size: 2, delay: 3.0, dur: 5.0, fx: 5, fy: -4 },
  { left: 58, top: 92, size: 3, delay: 0.4, dur: 4.0, fx: -4, fy: -8 },
];

const Terrain2D = ({ skyTheme, reduceMotion, onSelectTeam, onSelectSign }) => {
  const theme = SKY_THEMES[skyTheme] || SKY_THEMES.deepnight;

  return (
    <div className="pointer-events-none absolute inset-0">
      <style>{`
        @keyframes fireflyGlow {
          0%, 100% { opacity: 0.08; transform: translate3d(0, 0, 0) scale(0.85); }
          50% { opacity: 0.9; transform: translate3d(var(--fx, 4px), var(--fy, -7px), 0) scale(1.1); }
        }
      `}</style>

      {/* Far ridge */}
      <svg
        aria-hidden
        viewBox="0 0 1000 400"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[38%] w-full"
        style={{ color: theme.mtn }}
      >
        <path
          fill="currentColor"
          d="M0 268 L90 196 L180 248 L290 158 L390 238 L500 182 L610 252 L720 170 L830 236 L930 190 L1000 224 L1000 400 L0 400 Z"
        />
      </svg>

      {/* Near hill + pines (near-black so it separates from the theme haze) */}
      <svg
        aria-hidden
        viewBox="0 0 1000 400"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[30%] w-full"
        style={{ color: '#05070d' }}
      >
        <path fill="currentColor" d="M0 300 Q240 246 500 292 T1000 276 L1000 400 L0 400 Z" />
        <g fill="currentColor" opacity="0.95">
          <path d="M120 300 l14 -34 l14 34 z" />
          <path d="M150 306 l11 -26 l11 26 z" />
          <path d="M820 292 l16 -40 l16 40 z" />
          <path d="M856 298 l12 -28 l12 28 z" />
        </g>
      </svg>

      {/* Decorative bench, tucked beside the couple */}
      <div aria-hidden className="absolute bottom-[10%] left-[66%]">
        <svg width="80" height="42" viewBox="0 0 64 34" fill="none">
          <rect x="4" y="8" width="56" height="4" rx="2" fill={theme.mtn} />
          <rect x="4" y="14" width="56" height="3" rx="1.5" fill={theme.mtn} opacity="0.8" />
          <rect x="10" y="17" width="3" height="14" rx="1.5" fill={theme.mtn} />
          <rect x="51" y="17" width="3" height="14" rx="1.5" fill={theme.mtn} />
        </svg>
      </div>

      {/* Signpost → SignModal */}
      <button
        type="button"
        onClick={onSelectSign}
        aria-label="Read the trail sign"
        className="pointer-events-auto absolute bottom-[16%] left-[20%] flex h-24 w-20 items-center justify-center rounded-xl transition-transform duration-300 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
      >
        <svg aria-hidden width="66" height="84" viewBox="0 0 44 56">
          <rect x="20" y="10" width="4" height="46" rx="2" fill="#3b2a1c" />
          <rect x="4" y="12" width="36" height="12" rx="2" fill="#5b3d24" />
          <rect x="8" y="15" width="28" height="2" rx="1" fill="#d9b98a" opacity="0.8" />
          <rect x="8" y="19" width="18" height="2" rx="1" fill="#d9b98a" opacity="0.55" />
        </svg>
      </button>

      {/* Fireflies drifting around the couple */}
      <div aria-hidden className="absolute inset-0">
        {FIREFLIES.map((f, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-amber-200"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: f.size,
              height: f.size,
              boxShadow: '0 0 8px 2px rgba(255, 214, 140, 0.55)',
              opacity: reduceMotion ? 0.5 : undefined,
              animation: reduceMotion
                ? undefined
                : `fireflyGlow ${f.dur}s ease-in-out ${f.delay}s infinite`,
              '--fx': `${f.fx}px`,
              '--fy': `${f.fy}px`,
            }}
          />
        ))}
      </div>

      {/* Couple → About/Team modal */}
      <button
        type="button"
        onClick={onSelectTeam}
        aria-label="Meet the stargazers"
        className="pointer-events-auto absolute bottom-[8%] left-1/2 flex origin-bottom -translate-x-1/2 scale-75 items-end gap-1 rounded-2xl transition-transform duration-300 hover:scale-[0.8] active:scale-[0.72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 sm:scale-100 sm:hover:scale-105 sm:active:scale-95"
      >
        <GirlFigure />
        <BoyFigure />
      </button>
    </div>
  );
};

export default Terrain2D;
