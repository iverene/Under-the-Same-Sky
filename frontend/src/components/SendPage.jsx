import { useState, useEffect, useMemo } from 'react';
import { sendMessage } from '../api';

const StarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const LanternIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

// Static starfield background
const Starfield = () => {
  const stars = useMemo(() =>
    Array.from({ length: 120 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      delay: Math.random() * 4,
    })), []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
};

const SendPage = () => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('star');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  const RECIPIENT_LIMIT = 60;
  const MESSAGE_LIMIT = 500;

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipient || !message || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage({ recipient, message, type });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="relative w-full min-h-screen bg-[#020205] flex items-center justify-center p-4 overflow-hidden">
        <Starfield />
        <div className={`relative z-10 text-center transition-all duration-700 ease-out ${ready ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
          <div className="text-5xl mb-4">⭐</div>
          <h1 className="text-2xl sm:text-3xl font-serif text-white mb-3 tracking-wide">Released to the Sky</h1>
          <p className="text-blue-200/50 text-sm mb-8">Your star is now among the others</p>
          <button
            onClick={() => { setSent(false); setRecipient(''); setMessage(''); setReady(false); setTimeout(() => setReady(true), 100); }}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-medium transition-all duration-300"
          >
            Send Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#020205] flex items-center justify-center p-4 overflow-hidden">
      <Starfield />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${ready ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-500/10 rounded-full mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <svg className="w-8 h-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif text-white mb-2 tracking-wide">Under the Same Sky</h1>
          <p className="text-blue-200/50 text-xs font-medium tracking-[0.2em] uppercase">Cast your thought into the void</p>
        </div>

        {/* Form card */}
        <div className="relative overflow-hidden bg-slate-900/50 border border-white/10 rounded-3xl shadow-2xl shadow-blue-900/20 backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-blue-500/10 to-transparent pointer-events-none" />

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 relative z-0">

            {/* Recipient */}
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

            {/* Message */}
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

            {/* Type toggle */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Form</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('star')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                    type === 'star'
                      ? 'bg-blue-600/20 border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.15)] text-blue-300'
                      : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-500'
                  }`}
                >
                  <StarIcon />
                  <span className="font-bold text-sm">Star</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('lantern')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                    type === 'lantern'
                      ? 'bg-amber-600/20 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] text-amber-300'
                      : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-500'
                  }`}
                >
                  <LanternIcon />
                  <span className="font-bold text-sm">Wish</span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!recipient || !message || sending}
              className={`w-full py-4 mt-2 font-bold rounded-xl shadow-lg border border-white/10 transition-all transform relative overflow-hidden group ${
                type === 'star'
                  ? 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/30'
                  : 'bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30'
              } ${sending ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
              <span className="relative tracking-widest uppercase text-xs">
                {sending ? 'Sending...' : type === 'star' ? 'Release Star' : 'Release Lantern'}
              </span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-[10px] mt-6 tracking-wide">
          No account needed. Your message becomes a celestial object.
        </p>
      </div>
    </div>
  );
};

export default SendPage;
