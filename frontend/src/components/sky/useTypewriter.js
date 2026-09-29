import { useEffect, useRef, useState } from 'react';

// Types `text` out character by character. Returns the visible slice, whether
// typing finished, and a synchronous completer for tap-to-skip.
//
// Lint note (react-hooks/set-state-in-effect is active repo-wide): resets use
// the render-phase adjustment pattern (comparing previous inputs during
// render), never synchronous setState in the effect body. Interval callbacks
// are async and permitted (same as the existing timer setState calls).
const useTypewriter = (text, { active = true, speed = 28, reduceMotion = false } = {}) => {
  const [count, setCount] = useState(() => (reduceMotion || !active ? text.length : 0));
  const [prev, setPrev] = useState({ text, active, reduceMotion });
  if (prev.text !== text || prev.active !== active || prev.reduceMotion !== reduceMotion) {
    setPrev({ text, active, reduceMotion });
    setCount(reduceMotion || !active ? text.length : 0);
  }
  const timer = useRef(null);

  useEffect(() => {
    if (reduceMotion || !active) return;
    timer.current = setInterval(() => {
      setCount((c) => {
        if (c + 1 >= text.length) {
          clearInterval(timer.current);
          return text.length;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(timer.current);
  }, [text, active, speed, reduceMotion]);

  const complete = () => {
    clearInterval(timer.current);
    setCount(text.length);
  };

  return { shown: text.slice(0, count), done: count >= text.length, complete };
};

export default useTypewriter;
