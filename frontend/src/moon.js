// Shared lunar-phase helper.
//
// Primary source: FarmSense open Moon Phases API (free, no key) — direct
// call, then our backend proxy. Both can fail (dead service, CORS, offline),
// so the final fallback is a precise built-in calculation (Schlyter's
// low-precision lunar theory: sun + moon positions with major periodic
// perturbations, accurate to minutes — no network needed).
export const PHASES = [
  { name: 'New Moon', icon: '🌑' },
  { name: 'Waxing Crescent', icon: '🌒' },
  { name: 'First Quarter', icon: '🌓' },
  { name: 'Waxing Gibbous', icon: '🌔' },
  { name: 'Full Moon', icon: '🌕' },
  { name: 'Waning Gibbous', icon: '🌖' },
  { name: 'Last Quarter', icon: '🌗' },
  { name: 'Waning Crescent', icon: '🌘' },
];

export const SYNODIC_MONTH = 29.53058867;

const RAD = Math.PI / 180;
const rev = (x) => x - Math.floor(x / 360) * 360;
const sinD = (x) => Math.sin(x * RAD);
const cosD = (x) => Math.cos(x * RAD);
const EARTH_RADII_PER_AU = 6378.14 / 149597870.7;

// Days since 2000 Jan 0.0
const dayNumber = (date) => date.getTime() / 86400000 - 10956;

const solveKepler = (M, e) => {
  let E = M + e * (180 / Math.PI) * sinD(M) * (1 + e * cosD(M));
  for (let k = 0; k < 3; k++) {
    E -= (E - e * (180 / Math.PI) * sinD(E) - M) / (1 - e * cosD(E));
  }
  return E;
};

const sunPosition = (d) => {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = rev(356.0470 + 0.9856002585 * d);
  const E = solveKepler(M, e);
  const x = cosD(E) - e;
  const y = sinD(E) * Math.sqrt(1 - e * e);
  const r = Math.hypot(x, y);
  const v = rev(Math.atan2(y, x) / RAD);
  return { lon: rev(v + w), r, M, L: rev(w + M) };
};

const moonPosition = (d, sun) => {
  const N = rev(125.1228 - 0.0529538083 * d);
  const incl = 5.1454;
  const w = rev(318.0634 + 0.1643573223 * d);
  const a = 60.2666; // Earth radii
  const e = 0.0549;
  const M = rev(115.3654 + 13.0649929509 * d);
  const E = solveKepler(M, e);
  const x = a * (cosD(E) - e);
  const y = a * Math.sqrt(1 - e * e) * sinD(E);
  const r = Math.hypot(x, y);
  const v = rev(Math.atan2(y, x) / RAD);
  const cosN = cosD(N);
  const sinN = sinD(N);
  const cosVW = cosD(v + w);
  const sinVW = sinD(v + w);
  const cosI = cosD(incl);
  const sinI = sinD(incl);
  const xh = r * (cosN * cosVW - sinN * sinVW * cosI);
  const yh = r * (sinN * cosVW + cosN * sinVW * cosI);
  const zh = r * sinVW * sinI;
  let lon = rev(Math.atan2(yh, xh) / RAD);
  let lat = (Math.atan2(zh, Math.hypot(xh, yh)) / RAD);
  let rr = r;
  // Major periodic perturbations
  const Ms = sun.M;
  const Mm = M;
  const Lm = N + w + M;
  const D = rev(Lm - sun.L);
  const F = rev(Lm - N);
  lon +=
    -1.274 * sinD(Mm - 2 * D) +
    0.658 * sinD(2 * D) -
    0.186 * sinD(Ms) -
    0.059 * sinD(2 * Mm - 2 * D) -
    0.057 * sinD(Mm - 2 * D + Ms);
  lat +=
    -0.173 * sinD(F - 2 * D) -
    0.055 * sinD(Mm - F - 2 * D) -
    0.046 * sinD(Mm + F - 2 * D) +
    0.033 * sinD(F + 2 * D) +
    0.017 * sinD(2 * Mm + F);
  rr += -0.58 * cosD(Mm - 2 * D) - 0.46 * cosD(2 * D);
  return { lon: rev(lon), lat, rER: rr };
};

// Precise lunar state: { age (days), illumination (0..1), waxing (bool) }
export const getMoonAge = (date = new Date()) => {
  const d = dayNumber(date);
  const sun = sunPosition(d);
  const moon = moonPosition(d, sun);
  const elong =
    Math.acos(Math.min(1, Math.max(-1, cosD(sun.lon - moon.lon) * cosD(moon.lat)))) / RAD;
  const rAU = moon.rER * EARTH_RADII_PER_AU;
  const S = Math.sqrt(sun.r * sun.r + rAU * rAU - 2 * sun.r * rAU * cosD(elong));
  const cosi = Math.min(1, Math.max(-1, (rAU * rAU + S * S - sun.r * sun.r) / (2 * rAU * S)));
  const phaseAngle = Math.acos(cosi) / RAD; // 180 at new moon, 0 at full moon
  const waxing = rev(moon.lon - sun.lon) < 180;
  const age = waxing
    ? ((180 - phaseAngle) / 360) * SYNODIC_MONTH
    : ((180 + phaseAngle) / 360) * SYNODIC_MONTH;
  return { age, illumination: (1 + cosi) / 2, waxing };
};

export const getMoonData = (date = new Date()) => {
  const { age, illumination } = getMoonAge(date);
  const index = Math.floor(((age / SYNODIC_MONTH) * 8 + 0.5)) % 8;
  return { ...PHASES[index], illumination: `${Math.round(illumination * 100)}%`, isFull: index === 4 };
};

const API_NAMES = {
  'new moon': 'New Moon',
  'waxing crescent': 'Waxing Crescent',
  'first quarter': 'First Quarter',
  'waxing gibbous': 'Waxing Gibbous',
  'full moon': 'Full Moon',
  'waning gibbous': 'Waning Gibbous',
  'last quarter': 'Last Quarter',
  'waning crescent': 'Waning Crescent',
};

const API_ICONS = {
  'New Moon': '🌑',
  'Waxing Crescent': '🌒',
  'First Quarter': '🌓',
  'Waxing Gibbous': '🌔',
  'Full Moon': '🌕',
  'Waning Gibbous': '🌖',
  'Last Quarter': '🌗',
  'Waning Crescent': '🌘',
};

// FarmSense spells it "Waxing Cresent" and uses "1st Quarter" — normalize both.
const normalizeApiPhase = (value) =>
  String(value || '')
    .toLowerCase()
    .replace('cresent', 'crescent')
    .replace('1st quarter', 'first quarter')
    .replace('3rd quarter', 'last quarter')
    .trim();

// Live phase Resolve chain: direct open-API call first, then our own
// backend proxy (bypasses mobile/CORS blocks), else the caller falls back
// to local getMoonData(). Resolves { name, icon, illumination, isFull }
// or throws.
const apiBase = () =>
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/messages').replace(/\/messages$/, '');

const parseMoonRow = (json) => {
  const row = Array.isArray(json) ? json[0] : json;
  if (!row || row.Error) throw new Error('moon API error payload');
  const key = normalizeApiPhase(row.Phase);
  const name = API_NAMES[key];
  if (!name) throw new Error(`unknown moon phase "${row.Phase}"`);
  const illumination = Math.round(Number(row.Illumination) * 100);
  return {
    name,
    icon: API_ICONS[name],
    illumination: `${Number.isFinite(illumination) ? illumination : 0}%`,
    isFull: key === 'full moon',
  };
};

const fetchJson = async (url, timeoutMs) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`moon API status ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

// wttr.in free weather JSON embeds daily lunar data:
//   weather[0].astronomy[0] = { moon_phase: "Waning Gibbous", moon_illumination: "94", ... }
// No key needed and fetchable straight from browsers.
const parseWttr = (json) => {
  const astro = json?.weather?.[0]?.astronomy?.[0];
  if (!astro?.moon_phase) throw new Error('no wttr moon data');
  const key = String(astro.moon_phase).toLowerCase().trim();
  const name = API_NAMES[key];
  if (!name) throw new Error(`unknown moon phase "${astro.moon_phase}"`);
  const illumination = Math.round(Number(astro.moon_illumination));
  return {
    name,
    icon: API_ICONS[name],
    illumination: `${Number.isFinite(illumination) ? illumination : 0}%`,
    isFull: key === 'full moon',
  };
};

export const fetchMoonData = async (date = new Date(), { timeoutMs = 7000 } = {}) => {
  const ts = Math.floor(date.getTime() / 1000);
  // 1) wttr.in direct (live, no key)
  try {
    return parseWttr(await fetchJson('https://wttr.in/?format=j1', timeoutMs));
  } catch (wttrErr) {
    // 2) FarmSense direct (legacy source)
    try {
      return parseMoonRow(await fetchJson(`https://api.farmsense.net/v1/moonphases/?d=${ts}`, timeoutMs));
    } catch (directErr) {
      // 3) Our backend relay (bypasses mobile/CORS blocks)
      return parseMoonRow(await fetchJson(`${apiBase()}/moonphase?d=${ts}`, timeoutMs));
    }
  }
};
