import { useEffect, useMemo, useState } from 'react';
import { layoutMessages2D, makeStarfield } from './projection';
import { SKY_THEMES } from '../../three/themes';
import Moon2D from './Moon2D';
import Terrain2D from './Terrain2D';
import Star2D from './Star2D';
import Lantern2D from './Lantern2D';
import { GRAPHICS_PRESETS } from '../../graphicsSettings';

const Sky2D = ({
  messages,
  selectedId,
  skyTheme,
  graphicsQuality,
  freshMap,
  onSelectStar,
  onSelectLantern,
  onSelectTeam,
  onSelectSign,
}) => {
  const graphics = GRAPHICS_PRESETS[graphicsQuality] || GRAPHICS_PRESETS.medium;
  const theme = SKY_THEMES[skyTheme] || SKY_THEMES.deepnight;
  const stars = useMemo(
    () => messages.filter((m) => m.type === 'star' && m.position),
    [messages]
  );
  const lanterns = useMemo(() => messages.filter((m) => m.type === 'lantern'), [messages]);
  const entryPositions = useMemo(() => layoutMessages2D([...stars, ...lanterns]), [stars, lanterns]);
  const starfield = useMemo(() => makeStarfield(20261019, graphics.starfieldCount), [graphics.starfieldCount]);

  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Keep every entry visible while removing expensive effects as density rises.
  const entryCount = stars.length + lanterns.length;
  const denseEntries = entryCount > 180;
  const animateObjects = graphics.animateObjects && entryCount <= 150;
  const shootingStars = useMemo(
    () =>
      Array.from({ length: graphics.shootingStarCount }, (_, index) => ({
        key: index,
        left: 12 + index * 29,
        top: 12 + (index % 2) * 15,
        delay: index * 4.5,
        duration: 1.8 + (index % 2) * 0.3,
      })),
    [graphics.shootingStarCount]
  );

  return (
    <div data-sky-surface className="absolute inset-0 overflow-hidden">
      {/* Theme bands: solid colors so `transition-colors` actually animates
          (CSS gradients do not interpolate). */}
      <div
        aria-hidden
        className="absolute inset-0 transition-colors duration-1000"
        style={{ backgroundColor: theme.bg }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[64%] transition-colors duration-1000"
        style={{
          backgroundColor: theme.mtnFar,
          maskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[40%] transition-colors duration-1000"
        style={{
          backgroundColor: theme.mtn,
          maskImage: 'linear-gradient(to top, black 62%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 62%, transparent 100%)',
        }}
      />
      <style>{`
        @keyframes lanternBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes lanternRise2D {
          0% { opacity: 0; transform: translate3d(0, 100vh, 0) scale(0.65); }
          72% { opacity: 0.9; transform: translate3d(0, -5px, 0) scale(1.02); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes shootingStar2D {
          0%, 72% { opacity: 0; transform: translate3d(0, 0, 0) rotate(32deg) scaleX(0.35); }
          76% { opacity: 1; }
          88% { opacity: 0.9; transform: translate3d(18vw, 15vh, 0) rotate(32deg) scaleX(1); }
          100% { opacity: 0; transform: translate3d(24vw, 20vh, 0) rotate(32deg) scaleX(1.1); }
        }
      `}</style>

      <div aria-hidden className="pointer-events-none absolute inset-0">
        {starfield.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animation: reduceMotion
                ? undefined
                : `splashStar ${s.dur}s ease-in-out ${s.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {!reduceMotion && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {shootingStars.map((star) => (
            <span
              key={star.key}
              className="absolute h-px w-16 origin-left rounded-full bg-gradient-to-r from-transparent via-blue-100 to-white shadow-[0_0_8px_2px_rgba(190,220,255,0.65)]"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                animation: `shootingStar2D ${star.duration}s ease-in-out ${star.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      <Moon2D skyTheme={skyTheme} />

      <div className="absolute inset-0">
        {stars.map((m) => {
          const p = entryPositions.get(m.id);
          return (
            <Star2D
              key={m.id}
              message={m}
              x={p.x}
              y={p.y}
              selected={m.id === selectedId}
              fresh={!!freshMap[m.id]}
              animate={animateObjects}
              dense={denseEntries}
              reduceMotion={reduceMotion}
              onSelect={onSelectStar}
            />
          );
        })}
        {lanterns.map((m) => {
          const p = entryPositions.get(m.id);
          return (
            <Lantern2D
              key={m.id}
              message={m}
              x={p.x}
              y={p.y}
              selected={m.id === selectedId}
              fresh={!!freshMap[m.id]}
              animate={animateObjects}
              dense={denseEntries}
              reduceMotion={reduceMotion}
              onSelect={onSelectLantern}
            />
          );
        })}
      </div>

      <Terrain2D
        skyTheme={skyTheme}
        reduceMotion={reduceMotion}
        onSelectTeam={onSelectTeam}
        onSelectSign={onSelectSign}
      />
    </div>
  );
};

export default Sky2D;
