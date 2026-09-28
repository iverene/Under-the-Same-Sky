// Shared tuning constants for the night-sky scene.
// Single source of truth so components never hard-code magic numbers.

// The sky sits far beyond the hill: stars pushed deep, lanterns mid-distance.
// (Stored DB positions stay on the ~45-unit sphere; scaled at render time.)
export const STAR_DISTANCE = 1.8;
export const LANTERN_DISTANCE = 1.2;

// Star color temperatures so the sky doesn't look monochrome
export const STAR_TINTS = ['#ffffff', '#cfe4ff', '#ffe9c9', '#e8d8ff'];

// New arrivals glow brightly so you can spot where yours landed,
// then settle back to normal over this long (ms)
export const FRESH_GLOW_MS = 30000;

// Falling-star flight time (s)
export const FALL_DURATION = 2.2;

// Camera focus flights stop this far from their target
export const FOCUS_DISTANCE = 8;

// Tap-vs-drag tolerance (squared px): 12px is forgiving for touch taps
// while still ignoring orbit drags
export const TAP_TOLERANCE_SQ = 144;
