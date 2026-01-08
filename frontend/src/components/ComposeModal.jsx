import React, { useState, useEffect } from 'react';

// Icons
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

  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else setTimeout(() => setIsVisible(false), 300);
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!recipient || !message) return;
    onSend({ recipient, message, type });
    setRecipient('');
    setMessage('');
    setType('star');
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none'}`}>
      
      {/* Darkened Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/60 transition-opacity" 
        onClick={onClose}
      />

      {/* Modern Glass Card */}
      <div className={`relative w-full max-w-lg overflow-hidden bg-slate-900/50 border border-white/10 rounded-3xl shadow-2xl shadow-blue-900/20 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        
        {/* Subtle Ambient Light Effect at Top */}
        <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-blue-500/10 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 z-10 p-2 text-slate-500 hover:text-white bg-transparent hover:bg-white/5 rounded-full transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-8 relative z-0">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-serif text-white mb-2 tracking-wide drop-shadow-lg">
              Write an Entry
            </h2>
            <p className="text-blue-200/60 text-xs font-medium tracking-[0.2em] uppercase">
              Cast your thought into the void
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Recipient Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">To</label>
              <input 
                type="text" 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 focus:border-blue-400/50 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-all duration-200"
                placeholder="Someone..."
              />
            </div>
            
            {/* Message Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message</label>
              <textarea 
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 focus:border-blue-400/50 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-all duration-200 resize-none leading-relaxed"
                placeholder="What's on your mind?"
              />
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Form</label>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Star Option */}
                <label 
                  className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer border transition-all duration-300
                  ${type === 'star' 
                    ? 'bg-blue-600/20 border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                    : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                >
                  <input type="radio" name="type" value="star" checked={type === 'star'} onChange={() => setType('star')} className="hidden" />
                  <div className={`transition-colors duration-300 ${type === 'star' ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    <StarIcon />
                  </div>
                  <span className={`font-bold text-sm tracking-wide transition-colors ${type === 'star' ? 'text-white' : 'text-slate-400'}`}>Star</span>
                  <span className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Permanent</span>
                </label>
                
                {/* Falling Star Option */}
                <label 
                  className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer border transition-all duration-300
                  ${type === 'falling_star' 
                    ? 'bg-cyan-600/20 border-cyan-400/50 shadow-[0_0_20px_rgba(8,145,178,0.15)]' 
                    : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                >
                  <input type="radio" name="type" value="falling_star" checked={type === 'falling_star'} onChange={() => setType('falling_star')} className="hidden" />
                   <div className={`transition-colors duration-300 ${type === 'falling_star' ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    <CometIcon />
                  </div>
                  <span className={`font-bold text-sm tracking-wide transition-colors ${type === 'falling_star' ? 'text-white' : 'text-slate-400'}`}>Falling Star</span>
                  <span className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Fleeting</span>
                </label>

              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-4 mt-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 border border-white/10 transition-all transform hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
              <span className="relative tracking-widest uppercase text-xs">Release to Sky</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;