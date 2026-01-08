import React from 'react';

const HUD = ({ onOpenCompose, onOpenWish }) => {
  return (
    <>
      {/* 1. Instructional Text - Stays at the Bottom Center */}
      <div className="fixed bottom-8 left-0 w-full z-40 pointer-events-none flex justify-center pb-4">
        <p className="text-blue-100/40 text-xs font-light tracking-widest uppercase bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
          Scroll to Zoom • Drag to Explore • Watch for Falling Stars
        </p>
      </div>

      {/* 2. Action Buttons - Top Right */}
      <div className="fixed top-6 right-6 z-40 flex flex-col gap-4 items-end">
        
        {/* Write Entry Button */}
        <button 
          onClick={onOpenCompose}
          className="pointer-events-auto flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white font-serif tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] group"
        >
          <span className="text-xl group-hover:rotate-12 transition-transform">✎</span>
          <span>Write an Entry</span>
        </button>

        {/* Glowing Lantern Button */}
        <button 
          onClick={onOpenWish}
          className="pointer-events-auto flex items-center gap-3 px-6 py-3 bg-amber-900/20 hover:bg-amber-600/20 backdrop-blur-md border border-amber-500/30 rounded-full text-amber-100 font-serif tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
        >
          <span className="text-xl group-hover:-translate-y-1 transition-transform duration-300">🏮</span>
          <span>Light a Lantern</span>
        </button>

      </div>
    </>
  );
};

export default HUD;