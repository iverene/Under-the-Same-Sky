import { useMemo, useRef } from 'react';
import { hashString } from './projection';

const Lantern2D = ({ message, x, y, selected, fresh, animate, dense, reduceMotion, onSelect }) => {
  const wasSelected = useRef(false);
  const bob = useMemo(() => {
    const h = hashString(`bob-${message.id}`);
    return { delay: (h % 50) / 10, dur: 5 + ((h >>> 5) % 40) / 10 };
  }, [message.id]);
  const entrance = useMemo(() => {
    const h = hashString(`entrance-${message.id}`);
    return {
      delay: 0.8 + ((h >>> 8) % 100) / 100 * 8,
      dur: 7 + ((h >>> 16) % 20) / 10,
    };
  }, [message.id]);
  const bobDelay = entrance.delay + entrance.dur;

  return (
    <button
      type="button"
      onPointerDown={() => {
        wasSelected.current = selected;
      }}
      onClick={() => {
        // Same guard as Star2D: the outside-tap hook closes on pointerup, and
        // the native click fires after it.
        if (!wasSelected.current) onSelect?.(message);
      }}
      aria-label={`Lantern wish for ${message.recipient}`}
      aria-pressed={selected}
      className="group absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200/80"
      style={{ left: `${x}%`, top: `${y}%`, zIndex: selected ? 30 : 10 }}
    >
      <span
        aria-hidden
        className="relative block"
        style={{
          animation: reduceMotion
            ? undefined
            : `lanternRise2D ${entrance.dur}s cubic-bezier(0.22, 1, 0.36, 1) ${entrance.delay}s both`,
        }}
      >
        <span
          className={`relative block transition-transform duration-300 group-hover:scale-110 ${dense ? 'h-6 w-5' : 'h-8 w-6'}`}
          style={{
            animation:
              animate && !reduceMotion
                ? `lanternBob ${bob.dur}s ease-in-out ${bobDelay + bob.delay}s infinite`
                : undefined,
          }}
        >
          <span
            className={`absolute inset-0 rounded-[45%_45%_50%_50%] bg-gradient-to-b from-amber-100 to-amber-400 ${
              selected
                ? 'shadow-[0_0_26px_rgba(255,200,100,0.9)]'
                : dense
                  ? 'shadow-[0_0_8px_rgba(255,190,90,0.4)]'
                  : 'shadow-[0_0_18px_rgba(255,190,90,0.55)]'
            }`}
          />
          <span className="absolute inset-[22%] rounded-[45%] bg-yellow-100/90 blur-[1px]" />
        </span>
      </span>
      {fresh && (
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-amber-300/25" />
      )}
      {selected && (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse rounded-full border border-amber-200/70"
        />
      )}
    </button>
  );
};

export default Lantern2D;
