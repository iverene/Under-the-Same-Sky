require('dotenv').config();
const express = require('express');
const cors = require('cors');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/messages', messageRoutes);

// Moon phase proxy — browsers (especially mobile Safari) get blocked calling
// open APIs directly (CORS/network), so the backend relays a slimmed payload.
// Same-origin/CORS-enabled here, so the frontend always reaches it.
app.get('/api/moonphase', async (req, res) => {
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
    res.json({ Phase: astro.moon_phase, Illumination: Number(astro.moon_illumination) / 100 });
  } catch (err) {
    console.error('Moon proxy error:', err.message);
    res.status(502).json({ error: 'moon phase unavailable' });
  } finally {
    clearTimeout(timer);
  }
});

// Root Endpoint (Check if server is running)
app.get('/', (req, res) => {
  res.send('Under the Same Sky API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});