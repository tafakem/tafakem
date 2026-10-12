import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side proxy for API-Football fixtures
  app.get('/api/football/fixtures', async (req, res) => {
    const { date, live, timezone } = req.query;
    const apiKey = 'f1c68cdc4bf167684d6b9c485dc12d2b';
    
    let apiUrl = 'https://v3.football.api-sports.io/fixtures?';
    const params = new URLSearchParams();

    if (live) {
      params.append('live', String(live));
    } else if (date) {
      params.append('date', String(date));
    } else {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
      params.append('date', today);
    }

    if (timezone) {
      params.append('timezone', String(timezone));
    } else {
      params.append('timezone', 'America/Lima');
    }

    apiUrl += params.toString();

    try {
      const apiRes = await fetch(apiUrl, {
        headers: {
          'x-apisports-key': apiKey,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        return res.status(apiRes.status).json({ error: 'API-Football error', details: errText });
      }

      const data = await apiRes.json();
      return res.json(data);
    } catch (error: any) {
      console.error('Proxy error fetching API-Football fixtures:', error);
      return res.status(500).json({ error: 'Internal server error fetching football data', message: error.message });
    }
  });

  // Server-side proxy for API-Football standings
  app.get('/api/football/standings', async (req, res) => {
    const { league, season } = req.query;
    const apiKey = 'f1c68cdc4bf167684d6b9c485dc12d2b';
    
    const leagueId = league || '39'; // Default Premier League
    const seasonYear = season || '2025'; // Default season

    const apiUrl = `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${seasonYear}`;

    try {
      const apiRes = await fetch(apiUrl, {
        headers: {
          'x-apisports-key': apiKey,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        return res.status(apiRes.status).json({ error: 'API-Football standings error', details: errText });
      }

      const data = await apiRes.json();
      return res.json(data);
    } catch (error: any) {
      console.error('Proxy error fetching API-Football standings:', error);
      return res.status(500).json({ error: 'Internal server error fetching standings', message: error.message });
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
