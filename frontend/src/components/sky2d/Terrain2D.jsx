import { GirlFigure, BoyFigure } from '../sky/Couple';
import { SKY_THEMES } from '../../three/themes';

const Terrain2D = ({ skyTheme, onSelectTeam, onSelectSign }) => {
  const theme = SKY_THEMES[skyTheme] || SKY_THEMES.deepnight;

  return (
    <div className="pointer-events-none absolute inset-0">
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

      {/* Decorative bench */}
      <div aria-hidden className="absolute bottom-[13%] left-[38%] hidden sm:block">
        <svg width="64" height="34" viewBox="0 0 64 34" fill="none">
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
        className="pointer-events-auto absolute bottom-[15%] left-[20%] flex h-16 w-14 items-center justify-center rounded-xl transition-transform duration-300 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
      >
        <svg aria-hidden width="44" height="56" viewBox="0 0 44 56">
          <rect x="20" y="10" width="4" height="46" rx="2" fill="#3b2a1c" />
          <rect x="4" y="12" width="36" height="12" rx="2" fill="#5b3d24" />
          <rect x="8" y="15" width="28" height="2" rx="1" fill="#d9b98a" opacity="0.8" />
          <rect x="8" y="19" width="18" height="2" rx="1" fill="#d9b98a" opacity="0.55" />
        </svg>
      </button>

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
