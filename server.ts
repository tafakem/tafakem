import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

// Simple in-memory cache to conserve API requests and improve speed
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: any, ttlSeconds: number) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const API_KEY = process.env.API_FOOTBALL_KEY || 'f1c68cdc4bf167684d6b9c485dc12d2b';

  app.use(express.json());

  // Server-side proxy for API-Football fixtures
  app.get('/api/football/fixtures', async (req, res) => {
    const { date, live, timezone, league, season, from, to, next, last } = req.query;

    const cacheKey = `fixtures:${JSON.stringify(req.query)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let apiUrl = 'https://v3.football.api-sports.io/fixtures?';
    const params = new URLSearchParams();

    if (live) {
      params.append('live', String(live));
    } else if (from && to) {
      params.append('from', String(from));
      params.append('to', String(to));
    } else if (date) {
      params.append('date', String(date));
    } else if (next) {
      params.append('next', String(next));
    } else if (last) {
      params.append('last', String(last));
    } else {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
      params.append('date', today);
    }

    if (league) params.append('league', String(league));
    if (season) params.append('season', String(season));

    params.append('timezone', String(timezone || 'America/Lima'));

    apiUrl += params.toString();

    try {
      const apiRes = await fetch(apiUrl, {
        headers: {
          'x-apisports-key': API_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        return res.status(apiRes.status).json({ error: 'API-Football error', details: errText });
      }

      const data = await apiRes.json();
      
      // Cache response: 60s for live, 300s (5min) for historical or upcoming
      const ttl = live ? 60 : 300;
      setCached(cacheKey, data, ttl);

      return res.json(data);
    } catch (error: any) {
      console.error('Proxy error fetching API-Football fixtures:', error);
      return res.status(500).json({ error: 'Internal server error fetching football data', message: error.message });
    }
  });

  // Server-side proxy for API-Football standings
  app.get('/api/football/standings', async (req, res) => {
    const { league, season } = req.query;
    const leagueId = league || '39'; // Default Premier League
    const seasonYear = season || '2025';

    const cacheKey = `standings:${leagueId}:${seasonYear}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const apiUrl = `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${seasonYear}`;

    try {
      const apiRes = await fetch(apiUrl, {
        headers: {
          'x-apisports-key': API_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        return res.status(apiRes.status).json({ error: 'API-Football standings error', details: errText });
      }

      const data = await apiRes.json();
      // Cache standings for 10 minutes
      setCached(cacheKey, data, 600);
      return res.json(data);
    } catch (error: any) {
      console.error('Proxy error fetching API-Football standings:', error);
      return res.status(500).json({ error: 'Internal server error fetching standings', message: error.message });
    }
  });

  // Server-side proxy for API-Football fixture statistics (corners, xG, cards, shots)
  app.get('/api/football/fixture-statistics', async (req, res) => {
    const { fixture } = req.query;
    if (!fixture) {
      return res.status(400).json({ error: 'El parámetro fixture es requerido' });
    }

    const cacheKey = `stats:${fixture}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const apiUrl = `https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixture}`;

    try {
      const apiRes = await fetch(apiUrl, {
        headers: {
          'x-apisports-key': API_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        return res.status(apiRes.status).json({ error: 'API-Football statistics error', details: errText });
      }

      const data = await apiRes.json();
      // Cache statistics for 10 minutes
      setCached(cacheKey, data, 600);
      return res.json(data);
    } catch (error: any) {
      console.error('Proxy error fetching API-Football fixture statistics:', error);
      return res.status(500).json({ error: 'Internal server error fetching fixture statistics', message: error.message });
    }
  });

  // Server-side proxy for API-Football Odds (cuotas reales)
  app.get('/api/football/odds', async (req, res) => {
    const { fixture, league, season, date } = req.query;
    
    const cacheKey = `odds:${JSON.stringify(req.query)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let apiUrl = 'https://v3.football.api-sports.io/odds?';
    const params = new URLSearchParams();
    if (fixture) params.append('fixture', String(fixture));
    if (league) params.append('league', String(league));
    if (season) params.append('season', String(season));
    if (date) params.append('date', String(date));

    apiUrl += params.toString();

    try {
      const apiRes = await fetch(apiUrl, {
        headers: {
          'x-apisports-key': API_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        return res.status(apiRes.status).json({ error: 'API-Football odds error', details: errText });
      }

      const data = await apiRes.json();
      // Cache odds for 5 minutes
      setCached(cacheKey, data, 300);
      return res.json(data);
    } catch (error: any) {
      console.error('Proxy error fetching API-Football odds:', error);
      return res.status(500).json({ error: 'Internal server error fetching odds', message: error.message });
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      allowedHosts: [
        'tafakem.ai.studio',
        '.ai.studio',
        '.run.app',
        'localhost',
        '127.0.0.1',
      ],
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
