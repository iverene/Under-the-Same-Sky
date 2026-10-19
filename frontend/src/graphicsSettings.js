const STORAGE_KEY = 'utss.graphics-quality';

export const GRAPHICS_OPTIONS = [
  { key: 'low', label: 'Low', description: 'Best for older devices' },
  { key: 'medium', label: 'Balanced', description: 'Recommended' },
  { key: 'high', label: 'High', description: 'More sky detail' },
];

export const GRAPHICS_PRESETS = {
  low: {
    starfieldCount: 45,
    animateObjects: false,
    starsCount: 2500,
    veilCount: 1800,
    sparklesCount: 80,
    showSecondaryEffects: false,
  },
  medium: {
    starfieldCount: 95,
    animateObjects: true,
    starsCount: 7000,
    veilCount: 6000,
    sparklesCount: 300,
    showSecondaryEffects: true,
  },
  high: {
    starfieldCount: 140,
    animateObjects: true,
    starsCount: 11000,
    veilCount: 9000,
    sparklesCount: 500,
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
