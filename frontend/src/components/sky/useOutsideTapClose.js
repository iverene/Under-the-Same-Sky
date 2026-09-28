import { useEffect } from 'react';
import { TAP_TOLERANCE_SQ } from '../../three/config';

// Fast outside-tap close: fires on pointerup instantly at the HTML level,
// without waiting for the R3F raycast/click cycle (which feels laggy on
// mobile). Any short tap that lands on the canvas and outside the card
// closes it. Taps on another star also pass through here (cleared first,
// then the star's onClick selects it). Drags are ignored.
export const useOutsideTapClose = ({ active, cardRef, onClose }) => {
  useEffect(() => {
    if (!active) return;
    let down = null;
    const onDown = (e) => {
      down = [e.clientX, e.clientY];
    };
    const onUp = (e) => {
      if (!down) return;
      const dx = e.clientX - down[0];
      const dy = e.clientY - down[1];
      down = null;
      if (dx * dx + dy * dy > TAP_TOLERANCE_SQ) return;
      if (cardRef.current?.contains(e.target)) return;
      if (e.target?.closest?.('canvas')) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, cardRef, onClose]);
};
