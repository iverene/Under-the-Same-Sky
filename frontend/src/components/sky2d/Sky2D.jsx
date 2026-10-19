import { useEffect, useMemo, useState } from 'react';
import { messageTo2D, makeStarfield } from './projection';
import { SKY_THEMES } from '../../three/themes';
import Moon2D from './Moon2D';
import Terrain2D from './Terrain2D';
import Star2D from './Star2D';
import Lantern2D from './Lantern2D';

const Sky2D = ({
  messages,
  selectedId,
  skyTheme,
  freshMap,
  onSelectStar,
  onSelectLantern,
  onSelectTeam,
  onSelectSign,
}) => {
  const theme = SKY_THEMES[skyTheme] || SKY_THEMES.deepnight;
  const stars = useMemo(
    () => messages.filter((m) => m.type === 'star' && m.position),
    [messages]
  );
  const lanterns = useMemo(() => messages.filter((m) => m.type === 'lantern'), [messages]);
  const starfield = useMemo(() => makeStarfield(20261019, 95), []);

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

  // Density guard: keep twinkle/bob cheap on low-end phones.
  const animateObjects = stars.length + lanterns.length <= 150;

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

      <Moon2D skyTheme={skyTheme} />

      <div className="absolute inset-0">
        {stars.map((m) => {
          const p = messageTo2D(m);
          return (
            <Star2D
              key={m.id}
              message={m}
              x={p.x}
              y={p.y}
              selected={m.id === selectedId}
              fresh={!!freshMap[m.id]}
              animate={animateObjects}
              reduceMotion={reduceMotion}
              onSelect={onSelectStar}
            />
          );
        })}
        {lanterns.map((m) => {
          const p = messageTo2D(m);
          return (
            <Lantern2D
              key={m.id}
              message={m}
              x={p.x}
              y={p.y}
              selected={m.id === selectedId}
              fresh={!!freshMap[m.id]}
              animate={animateObjects}
              reduceMotion={reduceMotion}
              onSelect={onSelectLantern}
            />
          );
        })}
      </div>

      <Terrain2D
        skyTheme={skyTheme}
        onSelectTeam={onSelectTeam}
        onSelectSign={onSelectSign}
      />
    </div>
  );
};

export default Sky2D;
