import { useMemo, useRef } from 'react';
import { hashString } from './projection';

const Star2D = ({ message, x, y, selected, fresh, animate, reduceMotion, onSelect }) => {
  const wasSelected = useRef(false);
  const twinkle = useMemo(() => {
    const h = hashString(`twinkle-${message.id}`);
    return { delay: (h % 40) / 10, dur: 2.4 + ((h >>> 6) % 30) / 10 };
  }, [message.id]);

  return (
    <button
      type="button"
      onPointerDown={() => {
        wasSelected.current = selected;
      }}
      onClick={() => {
        // If this object was already selected at pointerdown, the outside-tap
        // hook has just closed its card — don't immediately reopen it.
        if (!wasSelected.current) onSelect?.(message);
      }}
      aria-label={`Star message for ${message.recipient}`}
      aria-pressed={selected}
      className="group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
      style={{ left: `${x}%`, top: `${y}%`, zIndex: selected ? 30 : 10 }}
    >
      <span
        aria-hidden
        className="block rounded-full bg-white transition-[width,height,box-shadow] duration-300"
        style={{
          width: selected ? 10 : 6,
          height: selected ? 10 : 6,
          boxShadow: selected
            ? '0 0 14px 6px rgba(210,230,255,0.7), 0 0 34px 14px rgba(150,190,255,0.28)'
            : '0 0 10px 3px rgba(190,215,255,0.55), 0 0 22px 8px rgba(140,180,255,0.18)',
          animation:
            animate && !reduceMotion
              ? `splashStar ${twinkle.dur}s ease-in-out ${twinkle.delay}s infinite alternate`
              : undefined,
        }}
      />
      {fresh && (
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-white/20" />
      )}
      {selected && (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse rounded-full border border-white/60"
        />
      )}
    </button>
  );
};

export default Star2D;
