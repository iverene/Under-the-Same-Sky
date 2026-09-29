import React, { useState, useEffect, useMemo } from 'react';

const SKY_OPTIONS = [
  { key: 'dusk', label: 'Dusk', dot: 'linear-gradient(135deg, #2e1a45 50%, #ff8a4c 100%)' },
  { key: 'nightfall', label: 'Nightfall', dot: 'linear-gradient(135deg, #0a1230 60%, #4a6bdb 100%)' },
  { key: 'deepnight', label: 'Deep Night', dot: 'linear-gradient(135deg, #020205 60%, #3b5bdb 100%)' },
  { key: 'dawn', label: 'Early Dawn', dot: 'linear-gradient(135deg, #173f52 50%, #ffcf9a 100%)' },
];

const HUD = ({ onOpenCompose, onOpenWish, skyTheme, onSkyTheme, onReset, uiHidden, onToggleUI, isSearching, onToggleSearch }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setIsTouch(mq.matches);
    const onChange = (e) => setIsTouch(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const show = !uiHidden;

  // Dismiss the sky picker on Escape
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen]);
  const pillCls = `transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`;
  const barCls = `transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95 pointer-events-none'}`;
  const panelCls = `transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`;

  const sendUrl = useMemo(() => {
    const loc = window.location;
    return `${loc.origin}/send`;
  }, []);
  const qrUrl = useMemo(() =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sendUrl)}&bgcolor=020205&color=ffffff`,
    [sendUrl]
  );
  const handleCopy = () => {
    navigator.clipboard.writeText(sendUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      {/* 1. Instructional pill */}
      <div className={`fixed bottom-2 sm:bottom-24 left-0 w-full z-40 pointer-events-none flex justify-center px-4 ${pillCls}`}>
        <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 px-4 sm:px-6 py-2 rounded-full shadow-lg max-w-full">
          <p className="text-blue-100/60 text-[9px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center leading-relaxed text-balance">
            {isTouch
              ? 'Pinch to Zoom \u2022 Drag \u2022 Tap Stars & Lanterns'
              : 'Scroll to Zoom \u2022 Drag to Explore \u2022 Click Stars & Lanterns to discover a message.'}
          </p>
        </div>
      </div>

      {/* 2. Top-right buttons — search fades with UI, hide toggle always visible */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2">
        {/* Search — fades with UI */}
        <button
          onClick={() => onToggleSearch && onToggleSearch()}
          aria-label="Search by name"
          className={`pointer-events-auto flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full backdrop-blur-xl border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-95 ${
            uiHidden
              ? 'opacity-0 pointer-events-none scale-90'
              : isSearching
                ? 'opacity-100 bg-blue-500/20 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] text-blue-300'
                : 'opacity-100 bg-slate-900/40 border-white/10 hover:border-white/30 text-slate-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>

        {/* Hide toggle — always visible, 20% when UI hidden */}
        <button
          onClick={() => onToggleUI && onToggleUI()}
          aria-label={uiHidden ? 'Show interface' : 'Hide interface'}
          title={uiHidden ? 'Show interface' : 'Hide interface'}
          className={`pointer-events-auto flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full backdrop-blur-xl border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-95 ${
            uiHidden
              ? 'opacity-20 hover:opacity-100 bg-slate-950/50 border-white/10 text-slate-300'
              : 'opacity-100 bg-slate-900/40 border-white/10 hover:border-white/30 text-slate-200'
          }`}
        >
          {uiHidden ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
              <line x1="4" y1="4" x2="20" y2="20" />
            </svg>
          )}
        </button>
      </div>

      {/* Dismiss layer for the sky picker — taps anywhere outside it close it */}
      {settingsOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setSettingsOpen(false)} aria-hidden />
      )}

      {/* ============================================================
          MOBILE LAYOUT — old design, left & right columns
          ============================================================ */}

      {/* Mobile: Write + Wish — bottom left */}
      <div className={`sm:hidden fixed z-40 left-4 bottom-16 flex flex-col gap-2 items-start ${barCls}`}>
        <button
          onClick={onOpenCompose}
          className="group relative pointer-events-auto flex flex-col items-center gap-1 px-3 py-2 w-[60px] h-[60px]
                     bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-xl
                     border border-blue-400/20 hover:border-blue-400/50
                     rounded-2xl text-white transition-all duration-300
                     hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <span className="text-xl filter drop-shadow-[0_0_5px_rgba(191,219,254,0.8)] group-hover:rotate-12 transition-transform duration-300">
            ✎
          </span>
          <span className="font-serif tracking-wide text-[10px] leading-none">Write</span>
        </button>

        <button
          onClick={onOpenWish}
          className="group relative pointer-events-auto flex flex-col items-center gap-1 px-3 py-2 w-[60px] h-[60px]
                     bg-amber-950/30 hover:bg-amber-900/50 backdrop-blur-xl
                     border border-amber-500/20 hover:border-amber-500/50
                     rounded-2xl text-amber-50 transition-all duration-300
                     hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <span className="text-xl filter drop-shadow-[0_0_5px_rgba(253,186,116,0.8)] group-hover:-translate-y-1 transition-transform duration-300">
            🏮
          </span>
          <span className="font-serif tracking-wide text-[10px] leading-none">Wish</span>
        </button>
      </div>

      {/* Mobile: Settings panel + Reset + Moon toggle — bottom right */}
      <div className={`sm:hidden fixed z-40 bottom-16 right-4 flex flex-col items-end gap-2 ${panelCls}`}>
        {/* Settings panel */}
        <div
          className={`pointer-events-auto w-52 overflow-hidden bg-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right ${
            settingsOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
          }`}
        >
          <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sky</p>
          {SKY_OPTIONS.map((opt) => {
            const active = skyTheme === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => onSkyTheme && onSkyTheme(opt.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-200 ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <span
                  className={`w-6 h-6 rounded-full shrink-0 border transition-all duration-200 ${active ? 'border-white/70 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/20'}`}
                  style={{ background: opt.dot }}
                />
                <span className={`font-serif text-sm tracking-wide ${active ? 'text-white' : 'text-slate-300'}`}>{opt.label}</span>
                {active && <span className="ml-auto text-sky-300 text-xs">●</span>}
              </button>
            );
          })}
          <div className="h-2" />
        </div>

        {/* Reset */}
        <button
          onClick={() => onReset && onReset()}
          aria-label="Reset view to bench"
          title="Back to the bench"
          className="pointer-events-auto flex items-center justify-center w-[60px] h-[60px] rounded-full backdrop-blur-xl bg-slate-900/40 border border-white/10 hover:border-white/30 text-slate-200 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="text-xl">⟲</span>
        </button>

        {/* Moon toggle */}
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          aria-label="Sky settings"
          aria-expanded={settingsOpen}
          className={`pointer-events-auto flex items-center justify-center w-[60px] h-[60px] rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
            settingsOpen
              ? 'bg-sky-500/20 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
              : 'bg-slate-900/40 border-white/10 hover:border-white/30'
          }`}
        >
          <svg aria-hidden="true" className={`w-6 h-6 text-slate-200 transition-transform duration-500 ${settingsOpen ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0012 21.75a9.753 9.753 0 009.752-6.748z" />
          </svg>
        </button>
      </div>

      {/* ============================================================
          DESKTOP LAYOUT — horizontal bar bottom center
          ============================================================ */}

      {/* Desktop: Write + Wish + Reset + Moon + Share — bottom center bar (search lives in TopBar) */}
      <div className={`hidden sm:flex fixed bottom-8 left-0 right-0 z-40 justify-center items-center gap-3 pointer-events-none ${barCls}`}>
        <div className="relative">
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="Sky settings"
            aria-expanded={settingsOpen}
            className={`pointer-events-auto flex items-center justify-center w-12 h-12 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
              settingsOpen
                ? 'bg-sky-500/20 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                : 'bg-slate-900/40 border-white/10 hover:border-white/30 text-slate-200'
            }`}
          >
            <svg aria-hidden="true" className={`w-5 h-5 text-slate-200 transition-transform duration-500 ${settingsOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0012 21.75a9.753 9.753 0 009.752-6.748z" />
            </svg>
          </button>
          {/* Sky panel — anchored above its moon button */}
          <div className={`absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-40 pointer-events-none ${panelCls}`}>
            <div
              className={`pointer-events-auto w-56 overflow-hidden bg-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom ${
                settingsOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
              }`}
            >
              <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sky</p>
              {SKY_OPTIONS.map((opt) => {
                const active = skyTheme === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => onSkyTheme && onSkyTheme(opt.key)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-200 ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full shrink-0 border transition-all duration-200 ${active ? 'border-white/70 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/20'}`}
                      style={{ background: opt.dot }}
                    />
                    <span className={`font-serif text-sm tracking-wide ${active ? 'text-white' : 'text-slate-300'}`}>{opt.label}</span>
                    {active && <span className="ml-auto text-sky-300 text-xs">●</span>}
                  </button>
                );
              })}
              <div className="h-2" />
            </div>
          </div>
        </div>

        <button
          onClick={() => onReset && onReset()}
          aria-label="Reset view to bench"
          title="Back to the bench"
          className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-white/10 hover:border-white/30 text-slate-200 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" />
          </svg>
        </button>

        <button
          onClick={() => setShareOpen((v) => !v)}
          aria-label="Share send page"
          className={`pointer-events-auto flex items-center justify-center w-12 h-12 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
            shareOpen
              ? 'bg-emerald-500/20 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'bg-slate-900/40 border-white/10 hover:border-white/30 text-slate-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
          </svg>
        </button>

        <div className="w-px h-8 bg-white/10" />

        <button
          onClick={onOpenCompose}
          className="pointer-events-auto group relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-xl border border-blue-400/20 hover:border-blue-400/50 text-white transition-all duration-300 hover:shadow-[0_0_24px_rgba(59,130,246,0.25)] hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <span className="text-xl filter drop-shadow-[0_0_5px_rgba(191,219,254,0.8)] group-hover:rotate-12 transition-transform duration-300">✎</span>
          <span className="font-serif text-sm tracking-wide">Write</span>
        </button>

        <button
          onClick={onOpenWish}
          className="pointer-events-auto group relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-amber-950/30 hover:bg-amber-900/50 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/50 text-amber-50 transition-all duration-300 hover:shadow-[0_0_24px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <span className="text-xl filter drop-shadow-[0_0_5px_rgba(253,186,116,0.8)] group-hover:-translate-y-1 transition-transform duration-300">🏮</span>
          <span className="font-serif text-sm tracking-wide">Wish</span>
        </button>
      </div>

      {/* Share modal — QR code + link */}
      {shareOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShareOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200"
          >
            <div className="text-center mb-5">
              <h3 className="text-lg font-serif text-white tracking-wide">Share Send Page</h3>
              <p className="text-slate-400 text-xs mt-1">Scan or share the link</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
              <div className="bg-white p-3 rounded-2xl">
                <img src={qrUrl} alt="QR Code" className="w-40 h-40" />
              </div>
            </div>

            {/* URL + Copy */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-3">
              <span className="flex-1 text-xs text-slate-300 truncate font-mono">{sendUrl}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Download QR */}
            <a
              href={qrUrl}
              download="under-the-same-sky-qr.png"
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/30 hover:border-emerald-400/50 text-emerald-300 text-xs font-bold uppercase tracking-wider transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download QR
            </a>

            {/* Close */}
            <button
              onClick={() => setShareOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HUD;
