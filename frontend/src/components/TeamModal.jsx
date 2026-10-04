import React, { useEffect } from 'react';

// Centered modal celebrating the couple on the hill: the developers
// behind Under the Same Sky. Same glass-card style as the other modals.
const TeamModal = ({ open, onClose }) => {
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

  return (
    <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      {/* Backdrop — click anywhere outside to return */}
      <div className="absolute inset-0 bg-slate-950/60" onClick={onClose} />

      {/* Glass card */}
      <div className="scroll-celestial modal-pop relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-blue-900/20">
        {/* Subtle ambient light at top */}
        <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-blue-500/10 to-transparent pointer-events-none" />

        <div className="p-5 sm:p-8 relative z-0 text-center">
          <p className="text-blue-200/60 text-xs font-medium tracking-[0.25em] uppercase mb-2">
            The Stargazers
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif text-white mb-6 tracking-wide drop-shadow-lg">
            Meet the Team
          </h2>

          <div className="space-y-4 mb-6">
            <div className="bg-white/5 border border-white/5 rounded-2xl px-5 py-4">
              <p className="font-serif text-lg text-white">Iverene Grace Causapin</p>
              <p className="text-[10px] text-blue-200/60 uppercase tracking-[0.2em] font-bold mt-1">
                Frontend Developer
              </p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl px-5 py-4">
              <p className="font-serif text-lg text-white">John Rey Bagunas</p>
              <p className="text-[10px] text-blue-200/60 uppercase tracking-[0.2em] font-bold mt-1">
                Full Stack Developer
              </p>
            </div>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed mb-7">
            4th Year BSIT Students
            <br />
            BSU TNEU Balayan Campus
          </p>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="px-8 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase transition-all hover:scale-105 active:scale-95"
            style={{ letterSpacing: '0.25em' }}
          >
            Back to the sky
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamModal;
