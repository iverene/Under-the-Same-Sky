import { useEffect, useState } from 'react';

export const BOY_LINE = "Our stories may be different, but we're under the same sky.";
export const GIRL_LINE = "And sometimes, knowing we're not alone is enough to keep going.";

const IntroDialogue = ({ onDone, boyStyle, girlStyle }) => {
  const [phase, setPhase] = useState('boy');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('girl'), 4000);
    const t2 = setTimeout(() => setPhase('leaving'), 8000);
    const t3 = setTimeout(() => onDone && onDone(), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-40">
      <div
        style={boyStyle}
        className={`absolute max-w-[220px] rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3 text-xs font-serif italic text-slate-200 shadow-[0_0_30px_rgba(150,180,255,0.2)] transition-opacity duration-1000 ${phase === 'boy' ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-[9px] not-italic font-sans font-bold uppercase tracking-[0.25em] text-blue-200">Boy</p>
        <p className="mt-1">{BOY_LINE}</p>
      </div>
      <div
        style={girlStyle}
        className={`absolute max-w-[220px] rounded-2xl border border-pink-200/20 bg-slate-950/80 backdrop-blur-xl px-4 py-3 text-xs font-serif italic text-slate-200 shadow-[0_0_30px_rgba(255,180,220,0.2)] transition-opacity duration-1000 ${phase === 'girl' ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-[9px] not-italic font-sans font-bold uppercase tracking-[0.25em] text-pink-200">Girl</p>
        <p className="mt-1">{GIRL_LINE}</p>
      </div>
      <button
        type="button"
        aria-label="Skip introduction"
        onClick={() => onDone && onDone()}
        className="pointer-events-auto absolute top-16 right-4 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300 hover:text-white"
      >
        Skip
      </button>
    </div>
  );
};

export default IntroDialogue;
