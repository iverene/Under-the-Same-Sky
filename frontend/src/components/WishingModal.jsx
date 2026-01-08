import React, { useState, useEffect } from 'react';

// Lantern Icon
const LanternIcon = () => (
  <svg className="w-6 h-6 mb-2 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v2m0 16v2M8 6h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2zM12 22c-1 0-1.5-.5-1.5-1s.5-1 1.5-1 1.5.5 1.5 1-.5 1-1.5 1z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10l4 4m0-4l-4 4" opacity="0.5" />
  </svg>
);

const WishingModal = ({ isOpen, onClose, onSend }) => {
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else setTimeout(() => setIsVisible(false), 300);
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!wish) return; 
    onSend({ name: name || 'Anonymous', wish, type: 'lantern' });
    
    setName('');
    setWish('');
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none'}`}>
      
      {/* Darkened Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/60 transition-opacity" 
        onClick={onClose}
      />

      {/* Glass Card - Amber Theme */}
      <div className={`relative w-full max-w-lg overflow-hidden bg-slate-900/90 backdrop-blur-2xl border border-amber-500/20 rounded-3xl shadow-2xl shadow-amber-900/20 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        
        {/* Warm Ambient Light Effect */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 z-10 p-2 text-slate-500 hover:text-amber-200 bg-transparent hover:bg-amber-500/10 rounded-full transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-8 relative z-0">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-3">
               <div className="p-3 bg-amber-500/10 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                 <LanternIcon />
               </div>
            </div>
            <h2 className="text-3xl font-serif text-amber-50 mb-2 tracking-wide drop-shadow-lg">
              Make a Wish
            </h2>
            <p className="text-amber-200/60 text-xs font-medium tracking-[0.2em] uppercase">
              Light a lantern for hope
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest ml-1">For Whom?</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-amber-900/5 hover:bg-amber-900/10 focus:bg-amber-900/10 border border-amber-500/10 focus:border-amber-400/50 rounded-xl p-4 text-amber-50 placeholder-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all duration-200"
                placeholder="Yourself, a friend, or the world..."
              />
            </div>
            
            {/* Wish Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest ml-1">Your Wish</label>
              <textarea 
                rows={4}
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                className="w-full bg-amber-900/5 hover:bg-amber-900/10 focus:bg-amber-900/10 border border-amber-500/10 focus:border-amber-400/50 rounded-xl p-4 text-amber-50 placeholder-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all duration-200 resize-none leading-relaxed"
                placeholder="What do you hope for?"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-4 mt-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/30 border border-white/10 transition-all transform hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
              <span className="relative tracking-widest uppercase text-xs">Release Lantern</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WishingModal;