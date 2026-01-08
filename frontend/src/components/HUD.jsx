import React from 'react';

const HUD = ({ onOpenCompose, onOpenWish }) => {
  return (
    <>
      {/* 1. Instructional Text - Refined "Pill" Design */}
      <div className="fixed bottom-8 left-0 w-full z-40 pointer-events-none flex justify-center pb-4">
        <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 px-6 py-2 rounded-full shadow-lg">
          <p className="text-blue-100/60 text-[10px] font-bold tracking-[0.2em] uppercase">
            Scroll to Zoom • Drag to Explore • Click Stars to Read
          </p>
        </div>
      </div>

      {/* 2. Action Buttons - Top Right with "Deep Space" Glass Effect */}
      <div className="fixed top-6 right-6 z-40 flex flex-col gap-3 items-end">
        
        {/* Write Entry Button (Star Theme) */}
        <button 
          onClick={onOpenCompose}
          className="group relative pointer-events-auto flex items-center gap-3 px-5 py-3 pr-6 
                     bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-xl 
                     border border-blue-400/20 hover:border-blue-400/50 
                     rounded-full text-white transition-all duration-300 
                     hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
        >
          {/* Inner Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <span className="text-xl filter drop-shadow-[0_0_5px_rgba(191,219,254,0.8)] group-hover:rotate-12 transition-transform duration-300">
            ✎
          </span>
          <div className="flex flex-col items-start">
            <span className="font-serif tracking-wide text-sm leading-none">Write Entry</span>
            <span className="text-[9px] text-blue-200/50 uppercase tracking-wider font-bold mt-0.5 group-hover:text-blue-200 transition-colors">
              Cast a Star
            </span>
          </div>
        </button>

        {/* Lantern Button (Warm/Wish Theme) */}
        <button 
          onClick={onOpenWish}
          className="group relative pointer-events-auto flex items-center gap-3 px-5 py-3 pr-6 
                     bg-amber-950/30 hover:bg-amber-900/50 backdrop-blur-xl 
                     border border-amber-500/20 hover:border-amber-500/50 
                     rounded-full text-amber-50 transition-all duration-300 
                     hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95"
        >
          {/* Inner Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <span className="text-xl filter drop-shadow-[0_0_5px_rgba(253,186,116,0.8)] group-hover:-translate-y-1 transition-transform duration-300">
            🏮
          </span>
          <div className="flex flex-col items-start">
            <span className="font-serif tracking-wide text-sm leading-none">Make a Wish</span>
            <span className="text-[9px] text-amber-200/50 uppercase tracking-wider font-bold mt-0.5 group-hover:text-amber-200 transition-colors">
              Light a Lantern
            </span>
          </div>
        </button>

      </div>
    </>
  );
};

export default HUD;