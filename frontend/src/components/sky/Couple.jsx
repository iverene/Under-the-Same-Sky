import { memo } from 'react';

export const GirlFigure = memo(() => (
  <svg width="86" height="150" viewBox="0 0 86 150" role="img" aria-label="Girl stargazer">
    <ellipse cx="43" cy="144" rx="30" ry="6" fill="#000" opacity="0.45" />
    <ellipse cx="43" cy="52" rx="15" ry="24" fill="#4a2c1a" />
    <rect x="26" y="52" width="9" height="34" rx="4.5" fill="#4a2c1a" />
    <rect x="51" y="52" width="9" height="34" rx="4.5" fill="#4a2c1a" />
    <path d="M43 64 L28 118 L58 118 Z" fill="#8a4f6e" />
    <rect x="36" y="50" width="14" height="18" rx="5" fill="#8a4f6e" />
    <rect x="24" y="68" width="8" height="28" rx="4" fill="#8a4f6e" />
    <rect x="54" y="68" width="8" height="28" rx="4" fill="#8a4f6e" />
    <rect x="39" y="42" width="8" height="10" fill="#eab88f" />
    <circle cx="43" cy="34" r="10.5" fill="#eab88f" />
    <path d="M32.5 33.5 a10.5 10.5 0 0 1 21 0 Z" fill="#4a2c1a" />
  </svg>
));
GirlFigure.displayName = 'GirlFigure';

export const BoyFigure = memo(() => (
  <svg width="86" height="150" viewBox="0 0 86 150" role="img" aria-label="Boy stargazer">
    <ellipse cx="43" cy="144" rx="30" ry="6" fill="#000" opacity="0.45" />
    <rect x="30" y="96" width="11" height="44" rx="4" fill="#26304a" />
    <rect x="45" y="96" width="11" height="44" rx="4" fill="#26304a" />
    <rect x="29" y="58" width="28" height="42" rx="7" fill="#3a5a8c" />
    <circle cx="43" cy="44" r="12" fill="#d99f6e" />
    <path d="M31 42 a12 12 0 0 1 24 0 l0 -3 a12 8 0 0 0 -24 0" fill="#241a12" />
    <rect x="21" y="62" width="9" height="30" rx="4.5" fill="#3a5a8c" />
    <rect x="56" y="62" width="9" height="30" rx="4.5" fill="#3a5a8c" />
  </svg>
));
BoyFigure.displayName = 'BoyFigure';
