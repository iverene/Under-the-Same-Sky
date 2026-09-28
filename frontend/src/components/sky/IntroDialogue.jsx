import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { DECK_X, DECK_Z, FLAT_Y } from '../../three/terrain';

import { POOL, FALLBACK_PAIR } from './introDialogues';

const headAnchors = () => ({
  // Must match Foreground.jsx Stargazers offsets: girl x -0.5 head y ~1.52, boy x +0.5 head y ~1.58, deck top ~ FLAT_Y + 0.35
  girl: new THREE.Vector3(DECK_X - 0.5, FLAT_Y + 0.35 + 1.52, DECK_Z + 0.05),
  boy: new THREE.Vector3(DECK_X + 0.5, FLAT_Y + 0.35 + 1.58, DECK_Z + 0.05),
});

const IntroDialogue = ({ onDone, camera, dialogueIndex }) => {
  const pair = POOL[dialogueIndex] || FALLBACK_PAIR;
  const [phase, setPhase] = useState('boy');
  const [pos, setPos] = useState({ bx: 0, by: 0, gx: 0, gy: 0, visible: false });

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('girl'), 4000);
    const t2 = setTimeout(() => setPhase('leaving'), 8000);
    const t3 = setTimeout(() => onDone && onDone(), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const anchors = useMemo(() => headAnchors(), []);

  useEffect(() => {
    if (!camera) return;
    let raf = 0;
    const v = new THREE.Vector3();
    const { girl, boy } = anchors;
    const tick = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const project = (p) => {
        v.copy(p).project(camera);
        return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, behind: v.z > 1 };
      };
      const b = project(boy), g = project(girl);
      const clamp = (x, y) => ({ x: Math.min(Math.max(x, 90), w - 90), y: Math.min(Math.max(y, 80), h - 120) });
      const bc = clamp(b.x + 90, b.y - 60), gc = clamp(g.x - 90, g.y - 60);
      setPos({ bx: bc.x, by: bc.y, gx: gc.x, gy: gc.y, visible: !b.behind && !g.behind });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [camera, anchors]);

  if (camera && !pos.visible) return null;

  const boyStyle = camera
    ? { left: pos.bx, top: pos.by, transform: 'translate(-50%, -100%)' }
    : { left: '70%', top: '30%' };
  const girlStyle = camera
    ? { left: pos.gx, top: pos.gy, transform: 'translate(-50%, -100%)' }
    : { left: '30%', top: '30%' };

  return (
    <div aria-live="polite" className="pointer-events-auto fixed inset-0 z-40">
      <div
        style={boyStyle}
        className={`absolute max-w-[220px] rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3 text-xs font-serif italic text-slate-200 shadow-[0_0_30px_rgba(150,180,255,0.2)] transition-opacity duration-1000 ${phase === 'boy' ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-[9px] not-italic font-sans font-bold uppercase tracking-[0.25em] text-blue-200">Boy</p>
        <p className="mt-1">{pair.boy}</p>
      </div>
      <div
        style={girlStyle}
        className={`absolute max-w-[220px] rounded-2xl border border-pink-200/20 bg-slate-950/80 backdrop-blur-xl px-4 py-3 text-xs font-serif italic text-slate-200 shadow-[0_0_30px_rgba(255,180,220,0.2)] transition-opacity duration-1000 ${phase === 'girl' ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-[9px] not-italic font-sans font-bold uppercase tracking-[0.25em] text-pink-200">Girl</p>
        <p className="mt-1">{pair.girl}</p>
      </div>
      <button
        type="button"
        aria-label="Skip introduction"
        onClick={() => onDone && onDone()}
        className="pointer-events-auto absolute top-16 right-4 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300 hover:text-white"
      >
        Skip
      </button>
    </div>
  );
};

export default IntroDialogue;
