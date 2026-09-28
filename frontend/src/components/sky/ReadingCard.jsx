// Selected star / lantern message: responsive bottom-center reading card.
// Purely presentational — closing is owned by the orchestrator
// (fast outside-tap + Escape). No buttons inside.
const ReadingCard = ({ message, isLantern, cardRef }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-52 sm:bottom-24 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] sm:w-full max-w-md pointer-events-none">
      <div ref={cardRef} className={`pointer-events-auto relative max-h-[55vh] overflow-y-auto bg-slate-950/80 backdrop-blur-xl border rounded-2xl px-5 py-5 sm:px-8 sm:py-6 animate-in fade-in slide-in-from-bottom-4 duration-300 ${isLantern ? 'border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 'border-white/10 shadow-[0_0_50px_rgba(150,180,255,0.15)]'}`}>
        <div className="text-center">
          <h3 className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] ${isLantern ? 'text-amber-200' : 'text-blue-200'}`}>
            {isLantern ? 'A Wish Floating By' : 'Addressed To'}
          </h3>
          <p className="text-white font-serif text-xl sm:text-2xl leading-tight mt-1 break-words">{message.recipient}</p>
        </div>
        {/* Full message flows naturally — no inner scrollbar */}
        <div className="relative mt-3">
          <span aria-hidden className="absolute -top-2 left-0 text-4xl text-white/10 font-serif leading-none">“</span>
          <p className="text-[15px] sm:text-base font-serif text-slate-300 leading-relaxed italic text-center px-6 break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReadingCard;
