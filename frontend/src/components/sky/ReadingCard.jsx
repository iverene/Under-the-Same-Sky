// Selected star / lantern message: responsive bottom-center reading card.
// Presentational; close is explicit (X) plus fast outside-tap / Escape owned
// by the orchestrator.
const ReadingCard = ({ message, isLantern, cardRef, onClose }) => {
  if (!message) return null;

  return (
    <div data-reading-card className="fixed bottom-[19rem] sm:bottom-40 left-1/2 -translate-x-1/2 z-[55] w-[calc(100%-2rem)] sm:w-full max-w-md pointer-events-none">
      <div ref={cardRef} className={`pointer-events-auto relative max-h-[48vh] sm:max-h-[55vh] overflow-hidden bg-slate-950/80 backdrop-blur-xl border rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${isLantern ? 'border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 'border-white/10 shadow-[0_0_50px_rgba(150,180,255,0.15)]'}`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close message"
          className="absolute top-2.5 right-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-slate-300 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Scrolls independently so the close button never moves */}
        <div className="scroll-celestial max-h-[48vh] sm:max-h-[55vh] overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-8 sm:py-6">
          <div className="text-center px-8">
            <h3 className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] ${isLantern ? 'text-amber-200' : 'text-blue-200'}`}>
              {isLantern ? 'A Wish For' : 'Addressed To'}
            </h3>
            <p className="text-white font-serif text-xl sm:text-2xl leading-tight mt-1 break-words">{message.recipient}</p>
          </div>
          {/* Full message flows naturally — no inner scrollbar */}
          <div className="relative mt-3">
            <span aria-hidden className="absolute -top-2 left-0 text-4xl text-white/10 font-serif leading-none">“</span>
            <p
              className="text-[15px] sm:text-base font-serif text-slate-300 leading-relaxed italic text-center px-6 break-words max-w-full"
              style={{ overflowWrap: 'anywhere' }}
            >
              {message.content}
            </p>
            {message.sender && (
              <p className="mt-2 pr-6 text-xs font-sans text-slate-400 text-right tracking-wide break-words">
                — {message.sender}
              </p>
            )}
            <span aria-hidden className="absolute -bottom-3 right-1 text-4xl text-white/10 font-serif leading-none">”</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingCard;
