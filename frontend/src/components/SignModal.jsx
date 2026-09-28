import React, { useEffect } from 'react';

// Centered modal mirroring the trail signpost in the 3D scene: a single
// framed timber board on posts with bright carved lettering.
// Uses hand-rolled modal-fade/modal-pop animations (see index.css).

// Weathered-wood textures, generated once at module load (never during
// render, so the grain stays stable across re-renders).
const makeWoodCanvas = (w, h, vertical) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Timber base
  ctx.fillStyle = '#6b4a2c';
  ctx.fillRect(0, 0, w, h);

  // Grain streaks
  const streaks = vertical ? 46 : 70;
  for (let i = 0; i < streaks; i++) {
    if (vertical) {
      const x = Math.random() * w;
      ctx.fillStyle =
        Math.random() > 0.5
          ? `rgba(46, 30, 16, ${0.08 + Math.random() * 0.12})`
          : `rgba(150, 108, 64, ${0.08 + Math.random() * 0.1})`;
      ctx.fillRect(x, 0, 1 + Math.random() * 2.5, h);
    } else {
      const y = Math.random() * h;
      ctx.fillStyle =
        Math.random() > 0.5
          ? `rgba(46, 30, 16, ${0.08 + Math.random() * 0.12})`
          : `rgba(150, 108, 64, ${0.08 + Math.random() * 0.1})`;
      ctx.fillRect(0, y, w, 1 + Math.random() * 2.5);
    }
  }
  // A few knots
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 4 + Math.random() * 6;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(40, 25, 13, 0.8)');
    g.addColorStop(0.6, 'rgba(70, 46, 26, 0.4)');
    g.addColorStop(1, 'rgba(70, 46, 26, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Vignette so the board seats into the night
  const v = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.25,
    w / 2, h / 2, Math.max(w, h) * 0.72
  );
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(18, 11, 5, 0.5)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);

  return canvas.toDataURL();
};

// Horizontal grain for the board, upright grain for the posts
const woodBg = {
  plank: makeWoodCanvas(512, 320, false),
  post: makeWoodCanvas(128, 512, true),
};

const SignModal = ({ open, onClose }) => {

  // Escape closes the modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Bright carved-letter relief — readable on dark timber
  const carved = {
    textShadow:
      '0 2px 3px rgba(0,0,0,0.85), 0 -1px 0 rgba(255,244,220,0.3)',
  };

  return (
    <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — click anywhere outside to return */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sign assembly — generous padding so drop shadows never clip */}
      <div className="modal-pop relative w-full max-w-md max-h-[92vh] overflow-y-auto px-6 sm:px-8 pt-5 pb-12">
        <div className="relative px-5 sm:px-8">
          {/* Mounting posts peeking out below the board */}
          <Post className="left-8 sm:left-11" />
          <Post className="right-8 sm:right-11" />

          {/* Framed timber board */}
          <div
            className="relative z-10 rounded-lg border-[6px] text-center"
            style={{
              backgroundImage: `linear-gradient(rgba(10,6,3,0.35), rgba(10,6,3,0.35)), url(${woodBg.plank})`,
              backgroundSize: 'cover',
              borderColor: '#2e1f12',
              boxShadow:
                '0 18px 45px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,240,210,0.22)',
            }}
          >
            {/* Routed inner border, like the carved frame on the 3D sign */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-2.5 rounded-[4px] border-2"
              style={{ borderColor: 'rgba(242,231,205,0.4)' }}
            />
            <Nail className="top-2.5 left-2.5" />
            <Nail className="top-2.5 right-2.5" />
            <Nail className="bottom-2.5 left-2.5" />
            <Nail className="bottom-2.5 right-2.5" />

            <div className="px-6 sm:px-8 py-8 sm:py-10">
              <p
                className="font-serif text-amber-100/85 text-[11px] sm:text-xs font-bold uppercase mb-3"
                style={{ letterSpacing: '0.35em', ...carved }}
              >
                Trail Marker
              </p>
              <h2
                className="font-serif text-[#f2e7cd] text-2xl sm:text-3xl mb-1"
                style={{ letterSpacing: '0.1em', ...carved }}
              >
                UNDER THE SAME SKY
              </h2>
              <p
                className="font-serif italic text-[#e8d5a8] text-lg mb-5"
                style={carved}
              >
                ★ look up ★
              </p>

              <div className="mx-auto h-px w-2/3 bg-amber-100/25 mb-5" />

              <p className="font-serif italic text-amber-50/90 text-sm leading-relaxed">
                You are sitting on a quiet hill beneath a sky full of unsaid things.
                Scroll to zoom, drag to wander. Click a star to read its message,
                catch a falling one if you can — and leave one of your own.
              </p>

              {/* Plank button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="mt-7 px-8 py-2.5 rounded-[3px] border-2 font-serif text-xs uppercase transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundImage: `url(${woodBg.plank})`,
                  backgroundSize: 'cover',
                  borderColor: '#2e1f12',
                  color: '#f2e7cd',
                  letterSpacing: '0.25em',
                  textShadow: '0 2px 0 rgba(0,0,0,0.7)',
                  boxShadow:
                    '0 6px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,240,210,0.25)',
                }}
              >
                Back to the sky
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Timber mounting post with roundness shading
const Post = ({ className = '' }) => (
  <div
    aria-hidden
    className={`absolute top-24 bottom-0 w-9 sm:w-11 rounded-[4px] ${className}`}
    style={{
      backgroundImage: `url(${woodBg.post})`,
      backgroundSize: 'cover',
      boxShadow: '6px 12px 22px rgba(0,0,0,0.55)',
    }}
  >
    <div
      className="absolute inset-0 rounded-[4px]"
      style={{
        background:
          'linear-gradient(90deg, rgba(0,0,0,0.55), rgba(255,235,200,0.10) 35%, rgba(0,0,0,0.12) 58%, rgba(0,0,0,0.6))',
      }}
    />
  </div>
);

// Domed nail head
const Nail = ({ className = '' }) => (
  <span
    aria-hidden
    className={`absolute w-2 h-2 rounded-full ${className}`}
    style={{
      background: 'radial-gradient(circle at 35% 30%, #d8c9a8, #6b5a3e 55%, #241a10)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.8), inset 0 -1px 1px rgba(0,0,0,0.6)',
    }}
  />
);

export default SignModal;
