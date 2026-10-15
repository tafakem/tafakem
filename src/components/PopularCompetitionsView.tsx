import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Target, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { Match } from '../types/football';
import { calculateMatchProbabilities, calculateTeamStats } from '../utils/analytics';

interface PopularCompetitionsViewProps {
  matches: Match[];
  setActiveSection: (section: string) => void;
  setHomeTeam: (team: string) => void;
  setAwayTeam: (team: string) => void;
}

interface PopularLeague {
  id: string;
  name: string;
  searchNames: string[];
  country: string;
  flag: string;
  logo: string;
}

const POPULAR_LEAGUES: PopularLeague[] = [
  // 1. Inglaterra — Premier League
  {
    id: 'premier',
    name: '1. Premier League',
    searchNames: ['premier league', 'premier'],
    country: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    logo: 'https://media.api-sports.io/football/leagues/39.png'
  },
  // 2. Alemania — Bundesliga
  {
    id: 'bundesliga',
    name: '2. Bundesliga',
    searchNames: ['bundesliga'],
    country: 'Alemania',
    flag: '🇩🇪',
    logo: 'https://media.api-sports.io/football/leagues/78.png'
  },
  // 3. España — LaLiga
  {
    id: 'laliga',
    name: '3. La Liga',
    searchNames: ['la liga', 'laliga', 'primera division', 'primera división'],
    country: 'España',
    flag: '🇪🇸',
    logo: 'https://media.api-sports.io/football/leagues/140.png'
  },
  // 4. Italia — Serie A
  {
    id: 'serie-a-it',
    name: '4. Serie A (Italia)',
    searchNames: ['serie a (italia)', 'serie a - italy', 'serie a italy', 'serie a'],
    country: 'Italia',
    flag: '🇮🇹',
    logo: 'https://media.api-sports.io/football/leagues/135.png'
  },
  // 5. Francia — Ligue 1
  {
    id: 'ligue-1',
    name: '5. Ligue 1',
    searchNames: ['ligue 1', 'ligue1'],
    country: 'Francia',
    flag: '🇫🇷',
    logo: 'https://media.api-sports.io/football/leagues/61.png'
  },
  // 6. Países Bajos — Eredivisie
  {
    id: 'eredivisie',
    name: '6. Eredivisie',
    searchNames: ['eredivisie', 'eredivisie (países bajos)'],
    country: 'Países Bajos',
    flag: '🇳🇱',
    logo: 'https://media.api-sports.io/football/leagues/88.png'
  },
  // 7. Brasil — Série A
  {
    id: 'serie-a-br',
    name: '7. Brasileirão Serie A',
    searchNames: ['brasileirão serie a (brasil)', 'brasileirao', 'brasileirão', 'serie a brasil', 'serie a brazil'],
    country: 'Brasil',
    flag: '🇧🇷',
    logo: 'https://media.api-sports.io/football/leagues/71.png'
  },
  // 8. Perú — Liga 1
  {
    id: 'peru',
    name: '8. Liga 1 Perú',
    searchNames: ['liga 1 perú', 'liga 1 peru', 'liga 1 de perú', 'primera división perú'],
    country: 'Perú',
    flag: '🇵🇪',
    logo: 'https://media.api-sports.io/football/leagues/281.png'
  },
  // Torneos Internacionales
  {
    id: 'ucl',
    name: 'UEFA Champions League',
    searchNames: ['uefa champions league', 'champions league', 'ucl'],
    country: 'Europa',
    flag: '🏆',
    logo: 'https://media.api-sports.io/football/leagues/2.png'
  },
  {
    id: 'uel',
    name: 'UEFA Europa League',
    searchNames: ['uefa europa league', 'europa league', 'uel'],
    country: 'Europa',
    flag: '🏆',
    logo: 'https://media.api-sports.io/football/leagues/3.png'
  },
  {
    id: 'libertadores',
    name: 'Copa Libertadores',
    searchNames: ['copa libertadores', 'libertadores'],
    country: 'Sudamérica',
    flag: '🌎',
    logo: 'https://media.api-sports.io/football/leagues/13.png'
  },
  {
    id: 'sudamericana',
    name: 'Copa Sudamericana',
    searchNames: ['copa sudamericana', 'sudamericana'],
    country: 'Sudamérica',
    flag: '🌎',
    logo: 'https://media.api-sports.io/football/leagues/11.png'
  }
];

export const PopularCompetitionsView: React.FC<PopularCompetitionsViewProps> = ({
  matches,
  setActiveSection,
  setHomeTeam,
  setAwayTeam
}) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('premier');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'finished'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const activeLeague = POPULAR_LEAGUES.find(l => l.id === selectedLeagueId) || POPULAR_LEAGUES[0];

  // Helper to match a match to the selected league without confusing Serie A Italia vs Brasil
  const isMatchInLeague = (m: Match, league: PopularLeague): boolean => {
    const compName = (m.competition || '').toLowerCase();
    const compCountry = (m.competition_country || '').toLowerCase();

    // Specific disambiguation for Italian Serie A vs Brazilian Serie A
    if (league.id === 'serie-a-it') {
      if (compCountry.includes('brazil') || compCountry.includes('brasil')) return false;
      return compName.includes('italia') || compCountry.includes('italy') || compCountry.includes('italia') || (compName === 'serie a' && !compCountry.includes('brazil'));
    }

    if (league.id === 'serie-a-br') {
      if (compCountry.includes('italy') || compCountry.includes('italia')) return false;
      return compName.includes('brasil') || compName.includes('brazil') || compName.includes('brasileir') || compCountry.includes('brazil') || compCountry.includes('brasil');
    }

    // Default check
    return league.searchNames.some(name => compName.includes(name)) ||
           (league.country.toLowerCase() === compCountry && compName.length > 0);
  };

  // Filter matches for the selected league
  const leagueMatches = matches.filter(m => isMatchInLeague(m, activeLeague));

  // Compute league summary statistics
  const finishedLeagueMatches = leagueMatches.filter(m => m.status === 'finished' && m.home_score !== undefined && m.away_score !== undefined);
  const totalGoals = finishedLeagueMatches.reduce((acc, m) => acc + (m.home_score ?? 0) + (m.away_score ?? 0), 0);
  const avgGoals = finishedLeagueMatches.length > 0 ? (totalGoals / finishedLeagueMatches.length).toFixed(2) : '2.65';
  
  const homeWins = finishedLeagueMatches.filter(m => (m.home_score ?? 0) > (m.away_score ?? 0)).length;
  const draws = finishedLeagueMatches.filter(m => (m.home_score ?? 0) === (m.away_score ?? 0)).length;
  const awayWins = finishedLeagueMatches.filter(m => (m.home_score ?? 0) < (m.away_score ?? 0)).length;
  const homeWinPct = finishedLeagueMatches.length > 0 ? Math.round((homeWins / finishedLeagueMatches.length) * 100) : 45;
  const drawPct = finishedLeagueMatches.length > 0 ? Math.round((draws / finishedLeagueMatches.length) * 100) : 26;
  const awayWinPct = finishedLeagueMatches.length > 0 ? Math.round((awayWins / finishedLeagueMatches.length) * 100) : 29;

  // Filter by status and search
  const filteredMatches = leagueMatches.filter(m => {
    const isFinished = m.status === 'finished' && m.home_score !== undefined && m.away_score !== undefined;
    const isUpcoming = m.status === 'upcoming' || !isFinished;

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'upcoming' && isUpcoming) ||
      (statusFilter === 'finished' && isFinished);

    const q = searchTerm.toLowerCase().trim();
    const isSearchPending = q === 'pendiente' || q === 'pendientes' || q === 'proximo' || q === 'proximos';
    const isSearchFinished = q === 'finalizado' || q === 'finalizados' || q === 'terminado';

    const matchesSearch = !q ||
      (isSearchPending && isUpcoming) ||
      (isSearchFinished && isFinished) ||
      m.home_team.toLowerCase().includes(q) ||
      m.away_team.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const handleInspectMatch = (m: Match) => {
    setHomeTeam(m.home_team);
    setAwayTeam(m.away_team);
    setActiveSection('analisis');
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Flame className="w-3.5 h-3.5" />
            Módulo Exclusivo: Ligas de Élite Mundial
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Predicciones de Competiciones Más Populares
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Acceso directo y pronósticos con modelos estadísticos de las principales ligas del planeta, con escudos oficiales y distinción nítida entre ligas homónimas.
          </p>
        </div>

        {/* Selected League Card Badge */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-5 py-3.5 rounded-2xl border border-slate-800">
          <img 
            src={activeLeague.logo} 
            alt={activeLeague.name} 
            className="w-12 h-12 object-contain rounded-xl bg-white/10 p-1 shadow-md"
          />
          <div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span>{activeLeague.flag}</span>
              <span>{activeLeague.country}</span>
            </div>
            <div className="text-lg font-black text-white">{activeLeague.name}</div>
          </div>
        </div>
      </div>

      {/* Popular Leagues Carousel / Switcher */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-400" />
          Selecciona una Competición Popular:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {POPULAR_LEAGUES.map((league) => {
            const isSelected = league.id === selectedLeagueId;
            return (
              <button
                key={league.id}
                onClick={() => setSelectedLeagueId(league.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <img 
                  src={league.logo} 
                  alt="" 
                  className="w-8 h-8 object-contain rounded-lg bg-white/10 p-1 shrink-0" 
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate">
                    <span>{league.flag}</span>
                    <span>{league.country}</span>
                  </div>
                  <div className="font-bold text-xs text-white truncate">
                    {league.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* League Statistics Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Partidos Registrados</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">{leagueMatches.length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[11px] text-emerald-400 uppercase tracking-wider block">Promedio Goles / Partido</span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{avgGoals}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[11px] text-teal-400 uppercase tracking-wider block">% Victoria Local</span>
          <span className="text-2xl font-black text-teal-400 font-mono mt-1 block">{homeWinPct}%</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[11px] text-amber-400 uppercase tracking-wider block">% Empate / Visitante</span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{drawPct}% / {awayWinPct}%</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Buscar en ${activeLeague.name}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({leagueMatches.length})
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'upcoming' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Próximos / Pendientes ⏳
          </button>
          <button
            onClick={() => setStatusFilter('finished')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'finished' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Finalizados ✅
          </button>
        </div>
      </div>

      {/* Match Prediction Cards */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No hay partidos en esta categoría para {activeLeague.name}</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Puedes cambiar el filtro a "Todos" o consultar fixtures actualizados desde "Partidos de Hoy".
            </p>
          </div>
        ) : (
          filteredMatches.map((m, idx) => {
            const isFinished = m.status === 'finished' && m.home_score !== undefined && m.away_score !== undefined;
            const probs = calculateMatchProbabilities(m.home_team, m.away_team, matches);

            let favoredText = `Victoria ${m.home_team} (1)`;
            let favoredPct = probs.home_win_prob;

            if (probs.draw_prob > probs.home_win_prob && probs.draw_prob > probs.away_win_prob) {
              favoredText = 'Empate (X)';
              favoredPct = probs.draw_prob;
            } else if (probs.away_win_prob > probs.home_win_prob) {
              favoredText = `Victoria ${m.away_team} (2)`;
              favoredPct = probs.away_win_prob;
            }

            // Most probable score
            let topScoreStr = `${Math.max(1, Math.round(probs.home_lambda))} - ${Math.max(0, Math.round(probs.away_lambda))}`;
            if (probs.correct_scores && probs.correct_scores.length > 0) {
              const top = [...probs.correct_scores].sort((a, b) => b.prob - a.prob)[0];
              if (top) topScoreStr = `${top.home} - ${top.away} (${top.prob}%)`;
            }

            return (
              <div 
                key={m.id || idx}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 shadow-xl transition-all space-y-5"
              >
                {/* Match Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <img 
                      src={activeLeague.logo} 
                      alt="" 
                      className="w-5 h-5 object-contain rounded bg-white/10 p-0.5" 
                    />
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span>{activeLeague.flag}</span>
                      <span>{activeLeague.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      &bull; {m.venue || 'Estadio Principal'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono">
                      {m.local_time ? `🕒 ${m.local_time} (Lima)` : m.date}
                    </span>
                    {isFinished ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px] border border-slate-700">
                        Finalizado
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold text-[11px] border border-amber-500/30">
                        Por Disputar ⏳
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Teams Confrontation */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/70">
                  {/* Home Team */}
                  <div className="flex items-center gap-3 flex-1 justify-start">
                    {m.home_logo && <img src={m.home_logo} alt="" className="w-10 h-10 object-contain" />}
                    <div>
                      <div className="font-black text-white text-base sm:text-lg">{m.home_team}</div>
                      <div className="text-[11px] text-emerald-400 font-mono">λ Exp: {probs.home_lambda} goles</div>
                    </div>
                  </div>

                  {/* Score or VS Badge */}
                  <div className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center min-w-[140px]">
                    {isFinished ? (
                      <div>
                        <div className="font-mono font-black text-2xl text-white">
                          {m.home_score} - {m.away_score}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Marcador Real</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-mono font-black text-lg text-amber-400">
                          {m.local_time ? m.local_time : 'vs'}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Por Disputar</div>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-3 flex-1 justify-end text-right">
                    <div>
                      <div className="font-black text-white text-base sm:text-lg">{m.away_team}</div>
                      <div className="text-[11px] text-emerald-400 font-mono">λ Exp: {probs.away_lambda} goles</div>
                    </div>
                    {m.away_logo && <img src={m.away_logo} alt="" className="w-10 h-10 object-contain" />}
                  </div>
                </div>

                {/* Statistical Prediction Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1X2 Probabilities Bar */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 uppercase tracking-wider font-semibold">Probabilidad 1X2</span>
                      <span className="text-emerald-400 font-mono font-bold">Favorito: {favoredPct}%</span>
                    </div>
                    <div className="h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                      <div style={{ width: `${probs.home_win_prob}%` }} className="bg-emerald-500 h-full" title={`Local: ${probs.home_win_prob}%`} />
                      <div style={{ width: `${probs.draw_prob}%` }} className="bg-amber-500 h-full" title={`Empate: ${probs.draw_prob}%`} />
                      <div style={{ width: `${probs.away_win_prob}%` }} className="bg-teal-500 h-full" title={`Visitante: ${probs.away_win_prob}%`} />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>1: <strong className="text-white">{probs.home_win_prob}%</strong></span>
                      <span>X: <strong className="text-white">{probs.draw_prob}%</strong></span>
                      <span>2: <strong className="text-white">{probs.away_win_prob}%</strong></span>
                    </div>
                  </div>

                  {/* Goals & Score Prediction */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-2">
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-xs">Marcador Más Probable</span>
                    <div className="font-mono text-lg font-black text-white flex items-center justify-between">
                      <span className="text-emerald-400">{topScoreStr}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-sans">Poisson</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Over 2.5: <strong className="text-white">{probs.over_under.over_25 ?? probs.over_under.ou25_over}%</strong></span>
                      <span>BTTS: <strong className="text-white">{probs.btts.yes}%</strong></span>
                    </div>
                  </div>

                  {/* Direct Action */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-2">
                    <div className="text-xs text-slate-400">
                      <span className="font-bold text-white block">Pronóstico Sugerido:</span>
                      <span className="text-emerald-400 font-semibold">{favoredText}</span>
                    </div>
                    <button
                      onClick={() => handleInspectMatch(m)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 hover:text-white border border-slate-800 text-xs font-semibold text-slate-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Analizar a Fondo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
