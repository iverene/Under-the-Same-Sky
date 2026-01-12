// --- Component: Lantern View Modal (STATIC & CENTERED) ---
const LanternViewModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Card */}
      <div className="relative bg-slate-900/95 border border-amber-500/30 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(245,158,11,0.2)] transform transition-all scale-100">
         <button 
           onClick={onClose} 
           className="absolute top-4 right-4 text-slate-500 hover:text-amber-500 transition-colors"
         >
           ✕
         </button>
         
         <div className="text-center">
            {/* Icon */}
            <div className="inline-block p-4 bg-amber-500/10 rounded-full mb-6 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <span className="text-3xl filter drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]">🏮</span>
            </div>
            
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] mb-2">A Wish Floating By</h3>
            
            <div className="my-6">
                <p className="text-[10px] text-amber-200/50 uppercase tracking-widest mb-1">For</p>
                <p className="font-serif text-2xl text-white tracking-wide">{message.recipient}</p>
            </div>
            
            {/* Wish Content */}
            <div className="relative p-6 bg-amber-950/30 rounded-xl border border-amber-500/10">
                <span className="absolute top-2 left-3 text-4xl text-amber-500/10 font-serif leading-none">“</span>
                <p className="text-lg font-serif italic text-amber-100/90 leading-relaxed relative z-10">
                    {message.content}
                </p>
                <span className="absolute bottom-[-10px] right-3 text-4xl text-amber-500/10 font-serif leading-none rotate-180">“</span>
            </div>

            <button 
                onClick={onClose}
                className="mt-8 px-8 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-full text-amber-200 text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
                Release Lantern
            </button>
         </div>
      </div>
    </div>
  );
};

export default LanternViewModal;