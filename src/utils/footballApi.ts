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

export async function fetchFixtureStatistics(fixtureId: number | string): Promise<{
  homeCorners?: number;
  awayCorners?: number;
  homeXg?: number;
  awayXg?: number;
  hasOfficialStats: boolean;
}> {
  try {
    const res = await fetch(`/api/football/fixture-statistics?fixture=${fixtureId}`);
    if (!res.ok) throw new Error('Error al consultar estadísticas oficiales');
    const data = await res.json();
    if (!data.response || !Array.isArray(data.response) || data.response.length < 2) {
      return { hasOfficialStats: false };
    }

    const team1 = data.response[0];
    const team2 = data.response[1];

    const extractStat = (teamObj: any, typeName: string): number | undefined => {
      const stat = teamObj.statistics?.find(
        (s: any) => s.type?.toLowerCase() === typeName.toLowerCase()
      );
      if (!stat || stat.value === null || stat.value === undefined) return undefined;
      const parsed = typeof stat.value === 'string' ? parseFloat(stat.value) : Number(stat.value);
      return isNaN(parsed) ? undefined : parsed;
    };

    const t1Corners = extractStat(team1, 'Corner Kicks');
    const t2Corners = extractStat(team2, 'Corner Kicks');
    const t1Xg = extractStat(team1, 'expected_goals');
    const t2Xg = extractStat(team2, 'expected_goals');

    return {
      homeCorners: t1Corners,
      awayCorners: t2Corners,
      homeXg: t1Xg,
      awayXg: t2Xg,
      hasOfficialStats: t1Corners !== undefined || t1Xg !== undefined
    };
  } catch (error) {
    console.warn('Error fetching fixture statistics:', error);
    return { hasOfficialStats: false };
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

  // STRICT AUDIT COMPLIANCE:
  // Never fabricate pseudo-random corners or xG with Math.random().
  // If official match statistics have not been explicitly fetched or recorded,
  // leave undefined and mark data_source and flags accordingly.
  return {
    id: `api-fix-${item.fixture.id}`,
    api_fixture_id: item.fixture.id,
    date: item.fixture.date.substring(0, 10),
    home_team: item.teams.home.name,
    away_team: item.teams.away.name,
    home_score: item.goals.home ?? 0,
    away_score: item.goals.away ?? 0,
    home_corners: undefined,
    away_corners: undefined,
    home_xg: undefined,
    away_xg: undefined,
    has_real_corners: false,
    has_real_xg: false,
    data_source: 'official_api',
    competition: item.league.name,
    competition_country: item.league.country,
    competition_logo: item.league.logo,
    home_logo: item.teams.home.logo,
    away_logo: item.teams.away.logo,
    status,
    minute: item.fixture.status.elapsed ? `${item.fixture.status.elapsed}'` : item.fixture.status.short,
    venue: item.fixture.venue?.name || 'Estadio Oficial',
    local_time: localTime,
    raw_status: item.fixture.status.long
  } as Match;
}
