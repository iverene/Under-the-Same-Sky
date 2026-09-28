import React, { useState, useEffect } from 'react';

const SKY_OPTIONS = [
  { key: 'dusk', label: 'Dusk', dot: 'linear-gradient(135deg, #2e1a45 50%, #ff8a4c 100%)' },
  { key: 'nightfall', label: 'Nightfall', dot: 'linear-gradient(135deg, #0a1230 60%, #4a6bdb 100%)' },
  { key: 'deepnight', label: 'Deep Night', dot: 'linear-gradient(135deg, #020205 60%, #3b5bdb 100%)' },
  { key: 'dawn', label: 'Early Dawn', dot: 'linear-gradient(135deg, #173f52 50%, #ffcf9a 100%)' },
];

const HUD = ({ onOpenCompose, onOpenWish, skyTheme, onSkyTheme, onReset, uiHidden, onToggleUI }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // Touch-aware hint copy (pinch vs scroll)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setIsTouch(mq.matches);
    const onChange = (e) => setIsTouch(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      {/* 1. Instructional pill — hidden in immersion mode */}
      {!uiHidden && (
      <div className="fixed top-28 sm:top-auto left-0 w-full z-40 pointer-events-none flex justify-center px-4 sm:bottom-8 sm:px-4">
        <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 px-4 sm:px-6 py-2 rounded-full shadow-lg max-w-full">
          <p className="text-blue-100/60 text-[9px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center leading-relaxed text-balance">
            {isTouch
              ? 'Pinch to Zoom • Drag • Tap Stars & Lanterns'
              : 'Scroll to Zoom • Drag to Explore • Click Stars & Lanterns to Fly Closer'}
          </p>
        </div>
      </div>
      )}

      {/* 2. Action buttons — hidden in immersion mode */}
      {!uiHidden && (
      <div className="fixed z-40 left-4 bottom-4 sm:left-auto sm:right-6 sm:top-6 sm:bottom-auto flex flex-col gap-2 sm:gap-3 items-start sm:items-end">

        {/* Write Entry Button (Star Theme) */}
        <button
          onClick={onOpenCompose}
          className="group relative pointer-events-auto flex flex-col sm:flex-row items-center gap-1 sm:gap-3 px-3 py-2 sm:px-5 sm:py-3 sm:pr-6
                     bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-xl
                     border border-blue-400/20 hover:border-blue-400/50
                     rounded-2xl sm:rounded-full text-white transition-all duration-300
                     hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
        >
          {/* Inner Glow Effect */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <span className="text-xl sm:text-xl filter drop-shadow-[0_0_5px_rgba(191,219,254,0.8)] group-hover:rotate-12 transition-transform duration-300">
            ✎
          </span>
          <div className="flex flex-col items-center sm:items-start">
            <span className="font-serif tracking-wide text-[10px] sm:text-sm leading-none">Write</span>
            <span className="hidden sm:block text-[9px] text-blue-200/50 uppercase tracking-wider font-bold mt-0.5 group-hover:text-blue-200 transition-colors">
              Cast a Star
            </span>
          </div>
        </button>

        {/* Lantern Button (Warm/Wish Theme) */}
        <button
          onClick={onOpenWish}
          className="group relative pointer-events-auto flex flex-col sm:flex-row items-center gap-1 sm:gap-3 px-3 py-2 sm:px-5 sm:py-3 sm:pr-6
                     bg-amber-950/30 hover:bg-amber-900/50 backdrop-blur-xl
                     border border-amber-500/20 hover:border-amber-500/50
                     rounded-2xl sm:rounded-full text-amber-50 transition-all duration-300
                     hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95"
        >
          {/* Inner Glow Effect */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-full bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <span className="text-xl filter drop-shadow-[0_0_5px_rgba(253,186,116,0.8)] group-hover:-translate-y-1 transition-transform duration-300">
            🏮
          </span>
          <div className="flex flex-col items-center sm:items-start">
            <span className="font-serif tracking-wide text-[10px] sm:text-sm leading-none">Wish</span>
            <span className="hidden sm:block text-[9px] text-amber-200/50 uppercase tracking-wider font-bold mt-0.5 group-hover:text-amber-200 transition-colors">
              Light a Lantern
            </span>
          </div>
        </button>

      </div>
      )}

      {/* 3. Sky Settings - Bottom Right (always available) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 sm:gap-3">
        {/* UI hide/show — top-right on mobile, above reset on desktop. Always visible. */}
        <button
          onClick={() => onToggleUI && onToggleUI()}
          aria-label={uiHidden ? 'Show interface' : 'Hide interface'}
          title={uiHidden ? 'Show interface' : 'Hide interface'}
          className={`pointer-events-auto flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-105 active:scale-95 fixed top-4 right-4 sm:static sm:order-2 ${
            uiHidden
              ? 'opacity-20 hover:opacity-100 bg-slate-950/50 border-white/10 text-slate-300'
              : 'bg-slate-900/40 border-white/10 hover:border-white/30 text-slate-200'
          }`}
        >
          {uiHidden ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
              <line x1="4" y1="4" x2="20" y2="20" />
            </svg>
          )}
        </button>

        {!uiHidden && (
        <>
        {/* Settings panel */}
        <div
          className={`pointer-events-auto w-52 sm:w-56 sm:order-1 overflow-hidden bg-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right ${
            settingsOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
          }`}
        >
          <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Sky
          </p>
          {SKY_OPTIONS.map((opt) => {
            const active = skyTheme === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => onSkyTheme && onSkyTheme(opt.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-200 ${
                  active ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full shrink-0 border transition-all duration-200 ${
                    active ? 'border-white/70 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/20'
                  }`}
                  style={{ background: opt.dot }}
                />
                <span className={`font-serif text-sm tracking-wide ${active ? 'text-white' : 'text-slate-300'}`}>
                  {opt.label}
                </span>
                {active && <span className="ml-auto text-sky-300 text-xs">●</span>}
              </button>
            );
          })}
          <div className="h-2" />
        </div>

        {/* Reset view — glide back to the bench POV */}
        <button
          onClick={() => onReset && onReset()}
          aria-label="Reset view to bench"
          title="Back to the bench"
          className="pointer-events-auto sm:order-3 flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-xl bg-slate-900/40 border border-white/10 hover:border-white/30 text-slate-200 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="text-xl">⟲</span>
        </button>

        {/* Gear toggle */}
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          aria-label="Sky settings"
          className={`pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-105 active:scale-95 sm:order-4 ${
            settingsOpen
              ? 'bg-sky-500/20 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
              : 'bg-slate-900/40 border-white/10 hover:border-white/30'
          }`}
        >
          <span
            className={`text-xl text-slate-200 transition-transform duration-500 ${
              settingsOpen ? 'rotate-90' : ''
            }`}
          >
            ⚙
          </span>
        </button>
        </>)}
      </div>
    </>
  );
};

export default HUD;
