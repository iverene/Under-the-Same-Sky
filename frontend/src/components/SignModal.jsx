import React, { useMemo } from 'react';

// Centered modal styled like the wooden trail sign in the 3D scene.
// Uses hand-rolled modal-fade/modal-pop animations (see index.css).
const SignModal = ({ open, onClose }) => {
  const boardBg = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    // Weathered board
    ctx.fillStyle = '#5d3f26';
    ctx.fillRect(0, 0, 512, 384);
    for (let i = 0; i < 90; i++) {
      const y = Math.random() * 384;
      ctx.fillStyle =
        Math.random() > 0.5
          ? `rgba(50, 32, 18, ${0.1 + Math.random() * 0.15})`
          : `rgba(120, 86, 50, ${0.1 + Math.random() * 0.12})`;
      ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
    }
    // Carved inner border
    ctx.strokeStyle = 'rgba(240, 230, 210, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, 484, 356);
    // Vignette to seat the text
    const v = ctx.createRadialGradient(256, 192, 60, 256, 192, 300);
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, 'rgba(20, 12, 6, 0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 512, 384);

    return canvas.toDataURL();
  }, []);

  if (!open) return null;

  return (
    <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — click anywhere outside to return */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Wooden board card */}
      <div
        className="modal-pop relative w-full max-w-md rounded-2xl overflow-hidden border-4 border-[#3a2817] shadow-[0_0_60px_rgba(0,0,0,0.8)]"
        style={{ backgroundImage: `url(${boardBg})`, backgroundSize: 'cover' }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 p-2 text-amber-100/60 hover:text-amber-100 bg-black/30 hover:bg-black/50 rounded-full transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 py-10 text-center">
          <p className="text-amber-100/60 text-[10px] font-bold tracking-[0.3em] uppercase mb-2">
            Trail Marker
          </p>
          <h2
            className="text-3xl font-serif text-[#f2e7cd] tracking-wide mb-1"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            UNDER THE SAME SKY
          </h2>
          <p
            className="text-lg font-serif italic text-[#e8d5a8] mb-5"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            ★ look up ★
          </p>

          <div className="mx-auto h-px w-2/3 bg-amber-100/25 mb-5" />

          <p className="text-sm font-serif text-amber-50/90 leading-relaxed italic">
            You are sitting on a quiet hill beneath a sky full of unsaid things.
            Scroll to zoom, drag to wander. Click a star to read its message,
            catch a falling one if you can — and leave one of your own.
          </p>

          <button
            onClick={onClose}
            className="mt-7 px-8 py-3 bg-black/40 hover:bg-black/60 border border-amber-100/30 hover:border-amber-100/60 rounded-full text-amber-100 text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          >
            Back to the sky
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignModal;
