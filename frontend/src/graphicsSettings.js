const STORAGE_KEY = 'utss.graphics-quality';

export const GRAPHICS_OPTIONS = [
  { key: 'low', label: 'Low', description: 'Best for older devices' },
  { key: 'medium', label: 'Balanced', description: 'Recommended' },
  { key: 'high', label: 'High', description: 'More sky detail' },
];

export const GRAPHICS_PRESETS = {
  low: {
    starfieldCount: 32,
    animateObjects: false,
    animateMessageStars: false,
    animateLanterns: false,
    starsCount: 1200,
    veilCount: 800,
    sparklesCount: 0,
    shootingStarCount: 0,
    showFallingStars: false,
    autoRotate: true,
    dpr: [0.7, 1],
    showSecondaryEffects: false,
  },
  medium: {
    starfieldCount: 95,
    animateObjects: true,
    animateMessageStars: true,
    animateLanterns: true,
    starsCount: 7000,
    veilCount: 6000,
    sparklesCount: 300,
    shootingStarCount: 2,
    showFallingStars: true,
    autoRotate: true,
    dpr: [1, 2],
    showSecondaryEffects: true,
  },
  high: {
    starfieldCount: 140,
    animateObjects: true,
    animateMessageStars: true,
    animateLanterns: true,
    starsCount: 11000,
    veilCount: 9000,
    sparklesCount: 500,
    shootingStarCount: 3,
    showFallingStars: true,
    autoRotate: true,
    dpr: [1, 2],
    showSecondaryEffects: true,
  },
};

export const readGraphicsQuality = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return GRAPHICS_PRESETS[saved] ? saved : 'medium';
  } catch {
    return 'medium';
  }
};

export const writeGraphicsQuality = (quality) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, GRAPHICS_PRESETS[quality] ? quality : 'medium');
  } catch {
    // Private mode / storage disabled — keep the setting for this session.
  }
};
