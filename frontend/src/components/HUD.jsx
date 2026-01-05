import React from 'react';

const HUD = ({ onOpenCompose }) => {
  return (
    <>
      {/* 1. Instructional Text - Stays at the Bottom Center */}
      <div className="fixed bottom-8 left-0 w-full z-40 pointer-events-none flex justify-center pb-4">
        <p className="text-blue-100/40 text-xs font-light tracking-widest uppercase bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
          Scroll to Zoom • Drag to Explore • Watch for Falling Stars
        </p>
      </div>

      {/* 2. Write Button - Moved to Top Right */}
      <div className="fixed top-6 right-6 z-40">
        <button 
          onClick={onOpenCompose}
          className="pointer-events-auto flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white font-serif tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          <span className="text-xl">✎</span>
          <span>Write an Entry</span>
        </button>
      </div>
    </>
  );
};

export default HUD;