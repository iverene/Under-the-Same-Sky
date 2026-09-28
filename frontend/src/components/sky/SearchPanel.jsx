import { useState, useMemo } from 'react';

const SearchPanel = ({ messages, onSelect, onClose }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return messages
      .filter((m) => m.recipient && m.recipient.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, messages]);

  return (
    <div className="pointer-events-auto w-72 sm:w-80 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Search input */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name..."
          autoFocus
          className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white text-xs transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto">
        {query.trim() && results.length === 0 && (
          <p className="px-4 py-6 text-center text-slate-500 text-xs">No stars or lanterns found</p>
        )}
        {results.map((msg) => {
          const isLantern = msg.type === 'lantern';
          return (
            <button
              key={msg.id}
              onClick={() => { onSelect(msg); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <span className="text-lg shrink-0">{isLantern ? '🏮' : '⭐'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-serif truncate">{msg.recipient}</p>
                <p className="text-slate-400 text-[11px] truncate mt-0.5">{msg.content}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchPanel;
