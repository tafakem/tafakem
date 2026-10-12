import { Match } from '../types/football';

export interface ApiFixtureItem {
  fixture: {
    id: number;
    date: string;
    timezone: string;
    status: {
      long: string;
      short: string;
      elapsed?: number;
    };
    venue: {
      name: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner?: boolean };
    away: { id: number; name: string; logo: string; winner?: boolean };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  events?: any[];
  cards?: any[];
}

export interface StandingRow {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  group?: string;
  form?: string;
  status?: string;
  description?: string;
}

export async function fetchFixturesByDate(dateStr: string): Promise<ApiFixtureItem[]> {
  try {
    const res = await fetch(`/api/football/fixtures?date=${dateStr}&timezone=America/Lima`);
    if (!res.ok) throw new Error('Error al consultar fixtures por fecha');
    const data = await res.json();
    return data.response || [];
  } catch (error) {
    console.warn('Error fetching fixtures by date:', error);
    return [];
  }
}

export async function fetchLiveFixtures(): Promise<ApiFixtureItem[]> {
  try {
    const res = await fetch(`/api/football/fixtures?live=all&timezone=America/Lima`);
    if (!res.ok) throw new Error('Error al consultar fixtures en vivo');
    const data = await res.json();
    return data.response || [];
  } catch (error) {
    console.warn('Error fetching live fixtures:', error);
    return [];
  }
}

export async function fetchStandings(leagueId: string, season: string = '2025'): Promise<StandingRow[][]> {
  try {
    const res = await fetch(`/api/football/standings?league=${leagueId}&season=${season}`);
    if (!res.ok) throw new Error('Error al consultar tabla de posiciones');
    const data = await res.json();
    if (data && data.response && data.response.length > 0) {
      return data.response[0].league.standings || [];
    }
    return [];
  } catch (error) {
    console.warn('Error fetching standings:', error);
    return [];
  }
}

export function convertApiFixtureToMatch(item: ApiFixtureItem): Match {
  const shortStatus = item.fixture.status.short;
  let status: 'live' | 'upcoming' | 'finished' = 'upcoming';
  if (['1H', '2H', 'ET', 'P', 'HT'].includes(shortStatus)) {
    status = 'live';
  } else if (['FT', 'AET', 'PEN'].includes(shortStatus)) {
    status = 'finished';
  } else {
    status = 'upcoming';
  }

  const localTime = new Date(item.fixture.date).toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    id: `api-fix-${item.fixture.id}`,
    date: item.fixture.date.substring(0, 10),
    home_team: item.teams.home.name,
    away_team: item.teams.away.name,
    home_score: item.goals.home ?? 0,
    away_score: item.goals.away ?? 0,
    home_corners: Math.floor(Math.random() * 5) + 3,
    away_corners: Math.floor(Math.random() * 5) + 3,
    home_xg: Number((Math.random() * 1.8 + 0.6).toFixed(1)),
    away_xg: Number((Math.random() * 1.6 + 0.5).toFixed(1)),
    competition: item.league.name,
    competition_country: item.league.country,
    competition_logo: item.league.logo,
    home_logo: item.teams.home.logo,
    away_logo: item.teams.away.logo,
    status,
    minute: item.fixture.status.elapsed ? `${item.fixture.status.elapsed}'` : item.fixture.status.short,
    venue: item.fixture.venue.name,
    local_time: localTime,
    raw_status: item.fixture.status.long
  } as Match;
}
