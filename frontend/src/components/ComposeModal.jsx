import React, { useState, useEffect, useRef } from 'react';

const ComposeModal = ({ isOpen, onClose, onSend }) => {
  const [recipient, setRecipient] = useState('');
  const [sender, setSender] = useState('');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const hideTimer = useRef(null);
  const rootRef = useRef(null);

  const RECIPIENT_LIMIT = 60;
  const SENDER_LIMIT = 60;
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
    onSend({ recipient, message, sender: sender.trim(), type: 'star' });
    setRecipient('');
    setSender('');
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
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-blue-500/10 rounded-full shadow-[0_0_15px_rgba(96,165,250,0.25)]">
                <svg className="w-6 h-6 text-blue-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2c.6 4.8 2.9 7.1 7.7 7.7-4.8.6-7.1 2.9-7.7 7.7-.6-4.8-2.9-7.1-7.7-7.7 4.8-.6 7.1-2.9 7.7-7.7z" />
                  <path d="M19 15.5c.3 2.1 1.3 3.1 3.4 3.4-2.1.3-3.1 1.3-3.4 3.4-.3-2.1-1.3-3.1-3.4-3.4 2.1-.3 3.1-1.3 3.4-3.4z" opacity="0.6" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-serif text-white mb-2 tracking-wide drop-shadow-lg">
              Write a Message to the Sky
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
            
            {/* Sender Input (optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">From <span className="text-slate-600 normal-case font-medium tracking-normal">(optional)</span></label>
                <span className="text-[10px] text-slate-500 tabular-nums mr-1">{sender.length}/{SENDER_LIMIT}</span>
              </div>
              <input
                type="text"
                value={sender}
                maxLength={SENDER_LIMIT}
                onChange={(e) => setSender(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 focus:border-blue-400/50 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-all duration-200"
                placeholder="Anonymous"
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