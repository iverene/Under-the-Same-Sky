import { useMemo } from 'react';
import * as THREE from 'three';
import { getMoonAge } from '../moon';

// Procedural canvas textures. Each hook creates its canvas once and shares it.

// Star core: hot white center, cool halo, subtle 4-point sparkle flare
export const useStarTexture = () => {
  return useMemo(() => {
    const s = 128;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const c = s / 2;

    const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.12, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.3, 'rgba(210, 230, 255, 0.55)');
    glow.addColorStop(0.6, 'rgba(140, 180, 255, 0.16)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, s, s);

    // Cross flare (additive light streaks)
    ctx.globalCompositeOperation = 'lighter';
    const beamH = ctx.createLinearGradient(0, 0, s, 0);
    beamH.addColorStop(0, 'rgba(255,255,255,0)');
    beamH.addColorStop(0.5, 'rgba(255,255,255,0.85)');
    beamH.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beamH;
    ctx.fillRect(0, c - 1.5, s, 3);
    const beamV = ctx.createLinearGradient(0, 0, 0, s);
    beamV.addColorStop(0, 'rgba(255,255,255,0)');
    beamV.addColorStop(0.5, 'rgba(255,255,255,0.85)');
    beamV.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beamV;
    ctx.fillRect(c - 1.5, 0, 3, s);

    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Ultra-soft wide halo for star coronas (tinted per instance)
export const useCoronaTexture = () => {
  return useMemo(() => {
    const s = 128;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.28)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Warm radial glow texture, shared by all lantern halos (one canvas total)
export const useGlowTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 200, 130, 1)');
    gradient.addColorStop(0.35, 'rgba(255, 140, 50, 0.45)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Lantern rice-paper: warm base with vertical rib shading (used as map + emissiveMap)
export const usePaperTexture = () => {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');

    // Brightest at the canvas bottom (= shell base, v0) where the flame
    // breathes; dimmer toward the top, like real sky lanterns
    const base = ctx.createLinearGradient(0, 0, 0, s);
    base.addColorStop(0, '#e3bd92');
    base.addColorStop(0.5, '#ffedd2');
    base.addColorStop(1, '#fff8e6');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);

    // Vertical ribs (wrap around the lathe shell) — kept soft to avoid
    // moiré shimmer when the lantern is viewed from far away
    for (let x = 0; x < s; x += 16) {
      ctx.fillStyle = 'rgba(170, 110, 60, 0.14)';
      ctx.fillRect(x, 0, 3, s);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(x + 3, 0, 2, s);
    }
    // Top / bottom binding bands
    ctx.fillStyle = 'rgba(150, 90, 40, 0.25)';
    ctx.fillRect(0, 0, s, 12);
    ctx.fillRect(0, s - 12, s, 12);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8; // keeps ribs crisp at grazing/far angles
    return tex;
  }, []);
};

// Comet trail: bright head (canvas top = v1 = travel direction) fading to transparent tail
export const useTrailTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(200, 230, 255, 0.55)');
    gradient.addColorStop(0.6, 'rgba(140, 190, 255, 0.18)');
    gradient.addColorStop(1, 'rgba(140, 190, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 256);
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Nebula: soft white blobs, tinted per sprite via material color
export const useNebulaTexture = () => {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const blobs = [
      [128, 128, 110, 0.16],
      [80, 100, 60, 0.14],
      [180, 150, 70, 0.12],
      [120, 180, 55, 0.13],
      [170, 90, 45, 0.12],
    ];
    for (const [x, y, r, a] of blobs) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255, 255, 255, ${a})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// Stylized moon: bright disc, dark maria, rim-lit craters, limb darkening
export const useMoonTexture = () => {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const c = s / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, 120, 0, Math.PI * 2);
    ctx.clip();

    // Bright face, gently darker toward the limb
    const base = ctx.createRadialGradient(c - 25, c - 25, 20, c, c, 130);
    base.addColorStop(0, '#f4f1e6');
    base.addColorStop(0.65, '#ddd8c4');
    base.addColorStop(1, '#b3ae9c');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);

    // Faint mineral mottling (tan / cool gray, very subtle like LRO maps)
    const mottles = [
      [90, 90, 46, '205, 190, 160'], [170, 120, 52, '170, 180, 195'],
      [130, 180, 44, '200, 185, 165'], [70, 150, 36, '175, 185, 200'],
    ];
    for (const [x, y, r, rgb] of mottles) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb}, 0.14)`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }

    // Maria — irregular dark plains built from overlapping lobes
    const maria = [
      [100, 110, 42], [160, 140, 50], [128, 172, 34], [182, 92, 26], [80, 160, 24],
      [118, 122, 26], [88, 126, 22], [178, 152, 26], [148, 160, 24], [140, 96, 16],
    ];
    for (const [x, y, r] of maria) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(125, 122, 108, 0.42)');
      g.addColorStop(0.7, 'rgba(125, 122, 108, 0.22)');
      g.addColorStop(1, 'rgba(125, 122, 108, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Craters — dark bowl + light-caught lower rim
    const craters = [
      [92, 96, 15], [150, 78, 10], [168, 152, 17],
      [108, 176, 11], [140, 128, 7], [68, 148, 9], [188, 112, 8], [120, 60, 6],
    ];
    for (const [x, y, r] of craters) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(100, 95, 80, 0.5)');
      g.addColorStop(0.8, 'rgba(100, 95, 80, 0.25)');
      g.addColorStop(1, 'rgba(100, 95, 80, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.8, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }

    // Rayed craters — bright pinpoint with faint ejecta halo
    const rays = [[150, 60, 3.5], [70, 110, 3], [185, 140, 2.5]];
    for (const [x, y, r] of rays) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      g.addColorStop(0.25, 'rgba(255, 255, 255, 0.35)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine surface grain
    for (let i = 0; i < 900; i++) {
      const x = c + (Math.random() - 0.5) * 220;
      const y = c + (Math.random() - 0.5) * 220;
      if (Math.hypot(x - c, y - c) > 118) continue;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90, 85, 70, 0.25)' : 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(x, y, 1, 1);
    }

    // Live phase shading: shadow eats one limb (left when waxing, right when waning).
    // Exaggerated ~3x so the phase reads clearly — a true 95% gibbous sliver
    // is nearly invisible at this distance.
    const { illumination: lit, waxing } = getMoonAge();
    const shadowW = Math.min(240, Math.max(0, 1 - lit) * 240 * 3);
    if (shadowW > 4) {
      const x0 = waxing ? c - 120 : c + 120;
      const x1 = waxing ? x0 + shadowW : x0 - shadowW;
      const shade = ctx.createLinearGradient(x0, 0, x1, 0);
      shade.addColorStop(0, 'rgba(8, 8, 20, 0.92)');
      shade.addColorStop(0.75, 'rgba(8, 8, 20, 0.6)');
      shade.addColorStop(1, 'rgba(8, 8, 20, 0)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, s, s);
    }

    // Limb darkening — edge melts softly instead of a hard disc cutout
    const limb = ctx.createRadialGradient(c, c, 70, c, c, 122);
    limb.addColorStop(0, 'rgba(70, 70, 95, 0)');
    limb.addColorStop(1, 'rgba(70, 70, 95, 0.45)');
    ctx.fillStyle = limb;
    ctx.fillRect(0, 0, s, s);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
};

// Night-grass texture: dark base, moonlit patches, speckled blades
export const useGroundTexture = () => {
  return useMemo(() => {
    const s = 512;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    // Dark base so the hill melts into the night (fog finishes the blend)
    ctx.fillStyle = '#08120d';
    ctx.fillRect(0, 0, s, s);

    // Large soft tonal variation (breaks visible tiling at distance)
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 90 + Math.random() * 160;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const warm = Math.random() > 0.5;
      g.addColorStop(0, warm ? 'rgba(40, 60, 35, 0.12)' : 'rgba(50, 80, 110, 0.10)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }

    // Cool moonlit patches
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 60 + Math.random() * 120;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(70, 100, 130, 0.08)');
      g.addColorStop(1, 'rgba(70, 100, 130, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
    // Fine grass speckles (small enough to read as blades, not noise)
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const v = Math.random();
      ctx.fillStyle =
        v > 0.65
          ? `rgba(${25 + v * 30}, ${55 + v * 40}, ${28 + v * 25}, 0.45)`
          : 'rgba(3, 6, 5, 0.5)';
      ctx.fillRect(x, y, 1 + Math.random() * 1.5, 1 + Math.random() * 2.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
};

// Wood-grain texture shared by every slat and leg
export const useWoodTexture = () => {
  return useMemo(() => {
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#6e4b2e';
    ctx.fillRect(0, 0, s, s);

    // Long grain streaks
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * s;
      const h = 1 + Math.random() * 2;
      ctx.fillStyle =
        Math.random() > 0.5
          ? `rgba(61, 40, 23, ${0.08 + Math.random() * 0.12})`
          : `rgba(138, 98, 56, ${0.08 + Math.random() * 0.12})`;
      ctx.fillRect(0, y, s, h);
    }
    // A few knots
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 4 + Math.random() * 6;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(45, 28, 15, 0.8)');
      g.addColorStop(0.6, 'rgba(70, 46, 26, 0.4)');
      g.addColorStop(1, 'rgba(70, 46, 26, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
};

// Carved wooden trail-sign face
export const useSignTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Weathered board
    ctx.fillStyle = '#5d3f26';
    ctx.fillRect(0, 0, 512, 160);
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * 160;
      ctx.fillStyle =
        Math.random() > 0.5
          ? `rgba(50, 32, 18, ${0.1 + Math.random() * 0.15})`
          : `rgba(120, 86, 50, ${0.1 + Math.random() * 0.12})`;
      ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
    }
    // Carved border
    ctx.strokeStyle = 'rgba(240, 230, 210, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, 488, 136);

    // Carved lettering
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2e7cd';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText('UNDER THE SAME SKY', 256, 65);
    ctx.font = 'italic 16px Georgia, serif';
    ctx.fillStyle = '#e8d5a8';
    ctx.fillText('★ look up ★', 256, 105);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
};
