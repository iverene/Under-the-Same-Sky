import React, { useState, useEffect, useMemo } from 'react';
import { SKY_THEMES } from '../three/themes';
import { getMoonData, fetchMoonData } from '../moon';

const TopBar = ({ skyTheme }) => {
  const [now, setNow] = useState(() => new Date());
  const [apiMoon, setApiMoon] = useState(null);

  // Refresh at local midnight so the date never goes stale
  useEffect(() => {
    const scheduleTick = () => {
      const current = new Date();
      const next = new Date(current);
      next.setHours(24, 0, 5, 0);
      return setTimeout(() => {
        setNow(new Date());
        timer = scheduleTick();
      }, next.getTime() - current.getTime());
    };
    let timer = scheduleTick();
    return () => clearTimeout(timer);
  }, []);

  // Complete date on every screen size
  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(now),
    [now]
  );

  // Live phase from the open API, local math as instant fallback
  useEffect(() => {
    let live = true;
    fetchMoonData(now).then(
      (data) => {
        if (live) setApiMoon(data);
      },
      () => {
        if (live) setApiMoon(null);
      }
    );
    return () => {
      live = false;
    };
  }, [now]);

  const localMoon = useMemo(() => getMoonData(now), [now]);
  const moon = apiMoon || localMoon;

  // Live sky theme, mirroring the SkyRig blend (same fallback)
  const theme = SKY_THEMES[skyTheme] || SKY_THEMES.deepnight;

  return (
    <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-40 flex flex-col items-start gap-1 pointer-events-none select-none">

      {/* Date Display — always complete */}
      <h1 className="text-white font-serif text-sm sm:text-xl tracking-wide drop-shadow-md leading-snug max-w-[70vw] sm:max-w-none">
        {currentDate}
      </h1>

      {/* Status pills — moon first, then sky; stacked on mobile, side by side on desktop */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 mt-1">
      {/* Moon Phase Widget (live API — local math as fallback) */}
      <div className="flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
        <span className="text-xl sm:text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
          {moon.icon}
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">
            Current Moon
          </span>
          <span className="text-xs sm:text-sm text-white font-serif leading-none">
            {moon.name} • {moon.illumination}
          </span>
        </div>
      </div>

      {/* Sky Theme Widget — dot glides with the blend, label cross-fades */}
      <div className="flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
        <span
          aria-hidden
          className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border border-white/20 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] transition-colors duration-1000"
          style={{ backgroundColor: theme.bg }}
        />
        <div className="flex flex-col">
          <span className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">
            Current Sky
          </span>
          <span
            key={skyTheme || 'deepnight'}
            className="theme-fade text-xs sm:text-sm text-white font-serif leading-none"
          >
            {theme.label}
          </span>
        </div>
      </div>
      </div>

    </div>
  );
};

export default TopBar;
