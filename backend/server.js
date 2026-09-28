require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Behind a proxy (Render/Railway/etc.) so rate-limiting sees the real client IP.
// Only enable with exactly one trusted proxy hop to avoid IP spoofing.
app.set('trust proxy', 1);

// Security headers (nosniff, frame-ancestors, XSS filter, etc.)
app.use(helmet());

// CORS allowlist: comma-separated origins, e.g.
// CORS_ORIGIN=https://under-the-same-sky.app,https://www.under-the-same-sky.app
// Defaults to the local Vite dev server; same-origin needs no CORS anyway.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      // No Origin header (curl, same-origin, mobile apps) — allow
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
  })
);

// Small bodies only: a wish is a few hundred bytes at most
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/messages', messageRoutes);

// Moon phase proxy — browsers (especially mobile Safari) get blocked calling
// open APIs directly (CORS/network), so the backend relays a slimmed payload.
// Same-origin/CORS-enabled here, so the frontend always reaches it.
// Cached 10 min: the moon barely moves, and this shields wttr.in from a
// traffic spike (every visitor would otherwise trigger an upstream call).
let moonCache = null;
let moonCacheAt = 0;
const MOON_CACHE_MS = 10 * 60 * 1000;
app.get('/api/moonphase', async (req, res) => {
  if (moonCache && Date.now() - moonCacheAt < MOON_CACHE_MS) {
    return res.json(moonCache);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    // Primary relay: wttr.in free JSON (weather[0].astronomy[0] holds the moon)
    const r = await fetch('https://wttr.in/?format=j1', {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'UnderTheSameSky/1.0' },
    });
    if (!r.ok) throw new Error(`moon API status ${r.status}`);
    const json = await r.json();
    const astro = json?.weather?.[0]?.astronomy?.[0];
    if (!astro?.moon_phase) throw new Error('no moon data in relay response');
    // FarmSense-shaped so the frontend parser reuses unchanged
    moonCache = { Phase: astro.moon_phase, Illumination: Number(astro.moon_illumination) / 100 };
    moonCacheAt = Date.now();
    res.json(moonCache);
  } catch (err) {
    console.error('Moon proxy error:', err.message);
    // Serve a stale reading instead of failing when upstream is down
    if (moonCache) return res.json(moonCache);
    res.status(502).json({ error: 'moon phase unavailable' });
  } finally {
    clearTimeout(timer);
  }
});

// Root Endpoint (Check if server is running)
app.get('/', (req, res) => {
  res.send('Under the Same Sky API is running...');
});

// JSON 404 (after all routes) + centralized error handler (CORS denials, etc.)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Body too large (max 10kb)' });
  }
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
