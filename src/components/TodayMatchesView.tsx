import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Clock, 
  Search, 
  Calendar, 
  ArrowRight, 
  AlertCircle,
  RefreshCw,
  Trophy,
  Activity,
  ChevronDown,
  ChevronUp,
  Globe,
  Sparkles
} from 'lucide-react';
import { Match } from '../types/football';
import { fetchFixturesByDate, convertApiFixtureToMatch, fetchFixtureStatistics } from '../utils/footballApi';

interface TodayMatchesViewProps {
  setActiveSection: (section: string) => void;
  setHomeTeam: (team: string) => void;
  setAwayTeam: (team: string) => void;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

// Normalized League Priority Order requested by user:
// 1. Inglaterra — Premier League
// 2. Alemania — Bundesliga
// 3. España — LaLiga
// 4. Italia — Serie A
// 5. Francia — Ligue 1
// 6. Países Bajos — Eredivisie
// 7. Brasil — Série A
// 8. Perú — Liga 1
// Independientes: Champions League, Europa League, Libertadores, Sudamericana
function getLeagueScore(compName: string = '', compCountry: string = ''): { rank: number; category: 'top' | 'cups' | 'others'; label: string } {
  const name = compName.toLowerCase();
  const country = compCountry.toLowerCase();

  // International Cups
  if (name.includes('champions league') || name.includes('ucl')) {
    return { rank: 101, category: 'cups', label: 'UEFA Champions League' };
  }
  if (name.includes('europa league') || name.includes('uel')) {
    return { rank: 102, category: 'cups', label: 'UEFA Europa League' };
  }
  if (name.includes('libertadores')) {
    return { rank: 103, category: 'cups', label: 'CONMEBOL Copa Libertadores' };
  }
  if (name.includes('sudamericana')) {
    return { rank: 104, category: 'cups', label: 'CONMEBOL Copa Sudamericana' };
  }

  // 1. Inglaterra — Premier League
  if (name.includes('premier league') || (country.includes('england') && name.includes('premier'))) {
    return { rank: 1, category: 'top', label: '1. Inglaterra — Premier League' };
  }
  // 2. Alemania — Bundesliga
  if (name.includes('bundesliga') || country.includes('germany') || country.includes('alemania')) {
    return { rank: 2, category: 'top', label: '2. Alemania — Bundesliga' };
  }
  // 3. España — LaLiga
  if (name.includes('la liga') || name.includes('laliga') || name.includes('primera división') && (country.includes('spain') || country.includes('españa'))) {
    return { rank: 3, category: 'top', label: '3. España — LaLiga' };
  }
  // 4. Italia — Serie A
  if ((name.includes('serie a') || country.includes('italy') || country.includes('italia')) && !country.includes('brazil') && !country.includes('brasil')) {
    return { rank: 4, category: 'top', label: '4. Italia — Serie A' };
  }
  // 5. Francia — Ligue 1
  if (name.includes('ligue 1') || name.includes('ligue1') || country.includes('france') || country.includes('francia')) {
    return { rank: 5, category: 'top', label: '5. Francia — Ligue 1' };
  }
  // 6. Países Bajos — Eredivisie
  if (name.includes('eredivisie') || country.includes('netherlands') || country.includes('holanda') || country.includes('países bajos')) {
    return { rank: 6, category: 'top', label: '6. Países Bajos — Eredivisie' };
  }
  // 7. Brasil — Série A
  if (name.includes('brasileir') || (name.includes('serie a') && (country.includes('brazil') || country.includes('brasil')))) {
    return { rank: 7, category: 'top', label: '7. Brasil — Série A' };
  }
  // 8. Perú — Liga 1
  if (name.includes('liga 1') || country.includes('peru') || country.includes('perú')) {
    return { rank: 8, category: 'top', label: '8. Perú — Liga 1' };
  }

  return { rank: 999, category: 'others', label: compName || 'Otras Competiciones' };
}

export const TodayMatchesView: React.FC<TodayMatchesViewProps> = ({
  setActiveSection,
  setHomeTeam,
  setAwayTeam,
  matches,
  setMatches
}) => {
  // Helper for Peru time (America/Lima UTC-5)
  const getLimaDateStr = (daysOffset: number = 0): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  };

  const todayLima = getLimaDateStr(0);
  const tomorrowLima = getLimaDateStr(1);

  const [dateMode, setDateMode] = useState<'today' | 'tomorrow' | 'week' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayLima);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [selectedComp, setSelectedComp] = useState<string>('all');
  const [apiFetchedMatches, setApiFetchedMatches] = useState<Match[]>([]);
  const [expandedComps, setExpandedComps] = useState<{ [comp: string]: boolean }>({});
  const [loadingStatId, setLoadingStatId] = useState<number | null>(null);

  const handleFetchStats = async (matchItem: Match) => {
    if (!matchItem.api_fixture_id) return;
    setLoadingStatId(matchItem.api_fixture_id);
    try {
      const stats = await fetchFixtureStatistics(matchItem.api_fixture_id);
      if (stats.hasOfficialStats) {
        const updateFn = (m: Match) => {
          if (m.id === matchItem.id || m.api_fixture_id === matchItem.api_fixture_id) {
            return {
              ...m,
              home_corners: stats.homeCorners,
              away_corners: stats.awayCorners,
              home_xg: stats.homeXg,
              away_xg: stats.awayXg,
              has_real_corners: stats.homeCorners !== undefined,
              has_real_xg: stats.homeXg !== undefined,
              data_source: 'official_api' as const
            };
          }
          return m;
        };
        setMatches(prev => prev.map(updateFn));
        setApiFetchedMatches(prev => prev.map(updateFn));
      }
    } catch (err) {
      console.warn('Error fetching stats:', err);
    } finally {
      setLoadingStatId(null);
    }
  };

  const loadFixturesForDate = async (dateStr: string) => {
    setLoading(true);
    try {
      const rawFixtures = await fetchFixturesByDate(dateStr);
      const converted = rawFixtures.map(convertApiFixtureToMatch);
      setApiFetchedMatches(converted);
      if (converted.length > 0) {
        setMatches(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = converted.filter(c => !existingIds.has(c.id));
          return [...newItems, ...prev];
        });
      }
    } catch (err) {
      console.error('Error loading API fixtures:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFixturesForRange = async (fromStr: string, toStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/football/fixtures?from=${fromStr}&to=${toStr}&timezone=America/Lima`);
      if (res.ok) {
        const data = await res.json();
        const converted = (data?.response || []).map(convertApiFixtureToMatch);
        setApiFetchedMatches(converted);
        if (converted.length > 0) {
          setMatches(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = converted.filter((c: Match) => !existingIds.has(c.id));
            return [...newItems, ...prev];
          });
        }
      }
    } catch (err) {
      console.error('Error loading fixtures range:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateMode === 'week') {
      loadFixturesForRange(todayLima, getLimaDateStr(7));
    } else {
      loadFixturesForDate(selectedDate);
    }
  }, [selectedDate, dateMode]);

  const handleSetQuickDate = (mode: 'today' | 'tomorrow' | 'week') => {
    setDateMode(mode);
    if (mode === 'today') {
      setSelectedDate(todayLima);
    } else if (mode === 'tomorrow') {
      setSelectedDate(tomorrowLima);
    } else if (mode === 'week') {
      setSelectedDate(todayLima);
    }
  };

  const currentPool = apiFetchedMatches.length > 0 
    ? apiFetchedMatches 
    : (dateMode === 'week' ? matches : matches.filter(m => m.date === selectedDate));

  const filteredMatches = currentPool.filter(m => {
    const matchesSearch = m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.competition && m.competition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'live' && m.status === 'live') ||
                          (statusFilter === 'upcoming' && m.status === 'upcoming') ||
                          (statusFilter === 'finished' && m.status === 'finished');

    const matchesComp = selectedComp === 'all' || m.competition === selectedComp;

    return matchesSearch && matchesStatus && matchesComp;
  });

  // Group by competition
  const groupedByComp: { [comp: string]: Match[] } = {};
  filteredMatches.forEach(m => {
    const compKey = m.competition || 'Otras Competiciones';
    if (!groupedByComp[compKey]) groupedByComp[compKey] = [];
    groupedByComp[compKey].push(m);
  });

  // Sort competitions by priority hierarchy
  const sortedCompEntries = Object.entries(groupedByComp).sort(([compA, matchesA], [compB, matchesB]) => {
    const scoreA = getLeagueScore(compA, matchesA[0]?.competition_country);
    const scoreB = getLeagueScore(compB, matchesB[0]?.competition_country);
    return scoreA.rank - scoreB.rank;
  });

  // Split into Top Leagues (1-8), International Cups, and Others
  const topLeagueEntries = sortedCompEntries.filter(([c, m]) => getLeagueScore(c, m[0]?.competition_country).category === 'top');
  const cupEntries = sortedCompEntries.filter(([c, m]) => getLeagueScore(c, m[0]?.competition_country).category === 'cups');
  const otherEntries = sortedCompEntries.filter(([c, m]) => getLeagueScore(c, m[0]?.competition_country).category === 'others');

  const toggleExpandComp = (compName: string) => {
    setExpandedComps(prev => ({ ...prev, [compName]: !prev[compName] }));
  };

  const renderMatchGroup = (entries: [string, Match[]][], sectionTitle: string, badgeIcon: React.ReactNode, badgeColor: string) => {
    if (entries.length === 0) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {badgeIcon}
          <h3 className="text-lg font-bold text-white tracking-wide">{sectionTitle}</h3>
          <span className="ml-auto text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {entries.reduce((sum, [, m]) => sum + m.length, 0)} encuentros
          </span>
        </div>

        <div className="space-y-6">
          {entries.map(([compName, compMatches]) => {
            const firstM = compMatches[0];
            const isExpanded = expandedComps[compName] || compMatches.length <= 4;
            const visibleMatches = isExpanded ? compMatches : compMatches.slice(0, 4);

            return (
              <div key={compName} className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900/90 px-5 py-3 rounded-2xl border border-slate-800 shadow-md">
                  <div className="flex items-center gap-3">
                    {firstM.competition_logo ? (
                      <img src={firstM.competition_logo} alt={compName} className="w-6 h-6 object-contain" />
                    ) : (
                      <span className="text-lg">{firstM.competition_flag || '⚽'}</span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{compName}</h4>
                        {firstM.competition_flag && <span>{firstM.competition_flag}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {firstM.competition_country || 'Internacional'} &bull; {compMatches.length} partidos
                      </span>
                    </div>
                  </div>

                  {compMatches.length > 4 && (
                    <button
                      onClick={() => toggleExpandComp(compName)}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 transition-all"
                    >
                      {isExpanded ? 'Ver menos' : `Ver más (${compMatches.length - 4} más)`}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleMatches.map(m => (
                    <div 
                      key={m.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-mono text-emerald-400 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          {m.local_time || m.date} (PET / UTC-5)
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          m.status === 'live' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' :
                          m.status === 'finished' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                          'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        }`}>
                          {m.status === 'live' ? `🔴 En Vivo ${m.minute || ''}` : m.status === 'finished' ? 'Finalizado' : 'Por disputar'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {m.home_logo ? (
                            <img src={m.home_logo} alt={m.home_team} className="w-8 h-8 object-contain shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                              {m.home_team.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-white text-sm truncate">{m.home_team}</span>
                        </div>

                        {/* Exact Score Display: only show scores if match is finished or live; never 0-0 for upcoming matches */}
                        <div className="bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800 font-mono text-lg font-black text-white shrink-0 mx-2">
                          {(m.status === 'finished' || m.status === 'live') && m.home_score !== undefined && m.away_score !== undefined
                            ? `${m.home_score} - ${m.away_score}`
                            : 'VS'}
                        </div>

                        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
                          <span className="font-bold text-white text-sm truncate text-right">{m.away_team}</span>
                          {m.away_logo ? (
                            <img src={m.away_logo} alt={m.away_team} className="w-8 h-8 object-contain shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                              {m.away_team.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Corner / xG indicators & Action Button */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          {m.has_real_corners && m.home_corners !== undefined ? (
                            <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                              🚩 {m.home_corners + (m.away_corners || 0)} córners
                            </span>
                          ) : null}
                          {m.has_real_xg && m.home_xg !== undefined ? (
                            <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                              ⚡ xG {(m.home_xg + (m.away_xg || 0)).toFixed(1)}
                            </span>
                          ) : null}
                          {m.api_fixture_id && !m.has_real_corners && m.status === 'finished' && (
                            <button
                              onClick={() => handleFetchStats(m)}
                              disabled={loadingStatId === m.api_fixture_id}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                            >
                              <Activity className="w-3 h-3" />
                              {loadingStatId === m.api_fixture_id ? 'Cargando...' : 'Ver xG/Córners'}
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setHomeTeam(m.home_team);
                            setAwayTeam(m.away_team);
                            setActiveSection('probabilidades');
                          }}
                          className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-xl border border-emerald-500/30 font-semibold transition-all flex items-center gap-1.5"
                        >
                          Analizar
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner & Quick Date Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            Horario oficial de Perú (UTC-5) &bull; API-Football en vivo
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Programación y Resultados Oficiales
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Partidos ordenados según jerarquía de ligas y copas continentales con sincronización en tiempo real.
          </p>
        </div>

        {/* Quick Date Pills */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => handleSetQuickDate('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateMode === 'today' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => handleSetQuickDate('tomorrow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateMode === 'tomorrow' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mañana
            </button>
            <button
              onClick={() => handleSetQuickDate('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateMode === 'week' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Próximos 7 días
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setDateMode('custom');
                setSelectedDate(e.target.value);
              }}
              className="bg-slate-900 text-white text-xs font-mono font-semibold px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => {
                if (dateMode === 'week') {
                  loadFixturesForRange(todayLima, getLimaDateStr(7));
                } else {
                  loadFixturesForDate(selectedDate);
                }
              }}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-all"
              title="Recargar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por equipo o competición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Estado: Todos</option>
              <option value="live">🔴 En Vivo</option>
              <option value="upcoming">⏰ Programados / Por disputar</option>
              <option value="finished">✅ Finalizados</option>
            </select>
          </div>

          <div>
            <select
              value={selectedComp}
              onChange={(e) => setSelectedComp(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Competición: Todas</option>
              {Object.keys(groupedByComp).map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Matches Display Section */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">
            Consultando API-Football para {dateMode === 'week' ? 'los próximos 7 días' : selectedDate} (Horario Lima)...
          </p>
        </div>
      ) : sortedCompEntries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No se encontraron encuentros</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No hay partidos disponibles para la fecha ({selectedDate}) o con los filtros activos. Selecciona otra fecha o pulsa "Próximos 7 días".
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section 1: Top Ligas (Premier League, Bundesliga, LaLiga, Serie A, Ligue 1, Eredivisie, Série A Brasil, Liga 1 Perú) */}
          {renderMatchGroup(
            topLeagueEntries,
            'Ligas Principales (Orden Oficial)',
            <Trophy className="w-5 h-5 text-amber-400" />,
            'text-amber-400'
          )}

          {/* Section 2: Torneos Internacionales (Champions League, Europa League, Libertadores, Sudamericana) */}
          {renderMatchGroup(
            cupEntries,
            'Torneos Internacionales (UEFA & CONMEBOL)',
            <Globe className="w-5 h-5 text-indigo-400" />,
            'text-indigo-400'
          )}

          {/* Section 3: Otras Competiciones */}
          {renderMatchGroup(
            otherEntries,
            'Otras Ligas y Competiciones',
            <Sparkles className="w-5 h-5 text-emerald-400" />,
            'text-emerald-400'
          )}
        </div>
      )}
    </div>
  );
};
