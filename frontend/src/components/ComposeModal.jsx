import React, { useState, useEffect, useRef } from 'react';

// Icons
const StarIcon = () => (
  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ComposeModal = ({ isOpen, onClose, onSend }) => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const hideTimer = useRef(null);
  const rootRef = useRef(null);

  const RECIPIENT_LIMIT = 60;
  const MESSAGE_LIMIT = 500;

  useEffect(() => {
    if (isOpen) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setIsVisible(true);
    } else {
      // Drop focus before the modal hides so focus never sits inside an
      // aria-hidden tree (avoids the assistive-tech warning on submit)
      if (rootRef.current?.contains(document.activeElement)) document.activeElement.blur();
      hideTimer.current = setTimeout(() => setIsVisible(false), 300);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isOpen]);

  // Escape closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isVisible && !isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!recipient || !message) return;
    onSend({ recipient, message, type: 'star' });
    setRecipient('');
    setMessage('');
    onClose();
  };

  return (
    <div ref={rootRef} className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none pointer-events-none'}`} aria-hidden={!isOpen}>
      
      {/* Darkened Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/60 transition-opacity" 
        onClick={onClose}
      />

      {/* Modern Glass Card */}
      <div className={`relative w-full max-w-lg overflow-hidden bg-slate-900/50 border border-white/10 rounded-3xl shadow-2xl shadow-blue-900/20 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        
        {/* Subtle Ambient Light Effect at Top */}
        <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-blue-500/10 to-transparent pointer-events-none" />
        
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
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">To</label>
                <span className="text-[10px] text-slate-500 tabular-nums mr-1">{recipient.length}/{RECIPIENT_LIMIT}</span>
              </div>
              <input 
                type="text" 
                value={recipient}
                maxLength={RECIPIENT_LIMIT}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 focus:border-blue-400/50 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-all duration-200"
                placeholder="Someone..."
              />
            </div>
            
            {/* Message Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message</label>
                <span className="text-[10px] text-slate-500 tabular-nums mr-1">{message.length}/{MESSAGE_LIMIT}</span>
              </div>
              <textarea 
                rows={4}
                value={message}
                maxLength={MESSAGE_LIMIT}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 focus:border-blue-400/50 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-all duration-200 resize-none leading-relaxed"
                placeholder="What's on your mind?"
              />
            </div>

            {/* Form type */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-600/20 border border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                <div className="text-blue-300">
                  <StarIcon />
                </div>
                <span className="font-bold text-sm tracking-wide text-white">Star</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Permanent</span>
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