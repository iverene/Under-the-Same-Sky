import { useState, useEffect, useMemo } from 'react';

const QRPage = () => {
  const [ready, setReady] = useState(false);

  const sendUrl = useMemo(() => {
    const loc = window.location;
    return `${loc.origin}/send`;
  }, []);

  const qrUrl = useMemo(() =>
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(sendUrl)}&bgcolor=020205&color=ffffff`,
    [sendUrl]
  );

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'under-the-same-sky-qr.png';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#020205] flex items-center justify-center p-4 overflow-hidden">
      {/* Static starfield */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }, (_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          delay: Math.random() * 4,
        })).map((s, i) => (
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

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className={`relative z-10 text-center transition-all duration-700 ease-out ${ready ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide mb-2">Scan to Send</h1>
          <p className="text-slate-400 text-xs tracking-[0.15em] uppercase">Point your phone at the QR code</p>
        </div>

        {/* QR Code */}
        <div className="inline-block bg-white p-4 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.15)] mb-6">
          <img src={qrUrl} alt="QR Code to send a message" className="w-56 h-56 sm:w-64 sm:h-64" />
        </div>

        {/* URL */}
        <p className="text-slate-500 text-xs font-mono mb-6 break-all px-4">{sendUrl}</p>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/30 hover:border-emerald-400/50 text-emerald-300 font-medium text-sm transition-all duration-300 hover:shadow-[0_0_24px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download QR
        </button>

        {/* Footer */}
        <p className="text-slate-600 text-[10px] mt-8 tracking-wide">
          Under the Same Sky
        </p>
      </div>
    </div>
  );
};

export default QRPage;
