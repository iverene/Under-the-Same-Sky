import React, { useState, useEffect } from 'react';

// Simple Icons to avoid external dependencies
const StarIcon = () => (
  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const CometIcon = () => (
  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const ComposeModal = ({ isOpen, onClose, onSend }) => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('star');
  const [isVisible, setIsVisible] = useState(false);

  // Handle animation mounting/unmounting
  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else setTimeout(() => setIsVisible(false), 200);
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!recipient || !message) return;
    onSend({ recipient, message, type });
    
    // Reset and close
    setRecipient('');
    setMessage('');
    setType('star');
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className={`relative w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-serif  mb-2 tracking-wide text-transparent bg-clip-text bg-linear-to-r from-blue-200 to-white">
            Write an Entry
          </h2>
          <p className="text-slate-400 text-sm font-light tracking-wide">
            Cast your thoughts into the eternal sky.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Recipient Input */}
          <div className="group">
            <label className="block text-xs font-bold text-blue-300/80 uppercase tracking-widest mb-2 ml-1">To</label>
            <input 
              type="text" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 transition-all"
              placeholder="Someone"
            />
          </div>
          
          {/* Message Input */}
          <div className="group">
            <label className="block text-xs font-bold text-blue-300/80 uppercase tracking-widest mb-2 ml-1">Message</label>
            <textarea 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 transition-all resize-none"
              placeholder="What do you want to say?"
            />
          </div>

          {/* Type Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-blue-300/80 uppercase tracking-widest mb-3 ml-1">Celestial Type</label>
            <div className="grid grid-cols-2 gap-4">
              
              {/* Star Option */}
              <label 
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border transition-all duration-200 hover:bg-white/5
                ${type === 'star' 
                  ? 'bg-blue-500/10 border-blue-400 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                  : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20'}`}
              >
                <input type="radio" name="type" value="star" checked={type === 'star'} onChange={() => setType('star')} className="hidden" />
                <StarIcon />
                <span className="font-bold text-sm tracking-wide">Star</span>
                <span className="text-[10px] opacity-60 mt-1 uppercase tracking-wider">Permanent</span>
              </label>
              
              {/* Falling Star Option */}
              <label 
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border transition-all duration-200 hover:bg-white/5
                ${type === 'falling_star' 
                  ? 'bg-cyan-500/10 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                  : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20'}`}
              >
                <input type="radio" name="type" value="falling_star" checked={type === 'falling_star'} onChange={() => setType('falling_star')} className="hidden" />
                <CometIcon />
                <span className="font-bold text-sm tracking-wide">Falling Star</span>
                <span className="text-[10px] opacity-60 mt-1 uppercase tracking-wider">Fleeting</span>
              </label>

            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full py-4 mt-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Send to Sky
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComposeModal;