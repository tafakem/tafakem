import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Clock, 
  Search, 
  Filter, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  Trophy,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Match } from '../types/football';
import { fetchFixturesByDate, convertApiFixtureToMatch } from '../utils/footballApi';

interface TodayMatchesViewProps {
  setActiveSection: (section: string) => void;
  setHomeTeam: (team: string) => void;
  setAwayTeam: (team: string) => void;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

export const TodayMatchesView: React.FC<TodayMatchesViewProps> = ({
  setActiveSection,
  setHomeTeam,
  setAwayTeam,
  matches,
  setMatches
}) => {
  const todayLima = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const [selectedDate, setSelectedDate] = useState<string>(todayLima);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedComp, setSelectedComp] = useState<string>('all');
  const [apiFetchedMatches, setApiFetchedMatches] = useState<Match[]>([]);
  const [expandedComps, setExpandedComps] = useState<{ [comp: string]: boolean }>({});

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

  useEffect(() => {
    loadFixturesForDate(selectedDate);
  }, [selectedDate]);

  const currentPool = apiFetchedMatches.length > 0 ? apiFetchedMatches : matches.filter(m => m.date === selectedDate);

  const countries = Array.from(new Set(currentPool.map((m: any) => m.competition_country).filter(Boolean)));
  const competitions = Array.from(new Set(currentPool.map((m: any) => m.competition).filter(Boolean)));

  const filteredMatches = currentPool.filter(m => {
    const matchesSearch = m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.competition && m.competition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'live' && m.status === 'live') ||
                          (statusFilter === 'upcoming' && m.status === 'upcoming') ||
                          (statusFilter === 'finished' && m.status === 'finished');

    const matchesCountry = selectedCountry === 'all' || (m as any).competition_country === selectedCountry;
    const matchesComp = selectedComp === 'all' || m.competition === selectedComp;

    return matchesSearch && matchesStatus && matchesCountry && matchesComp;
  });

  const groupedByComp: { [comp: string]: Match[] } = {};
  filteredMatches.forEach(m => {
    const compKey = m.competition || 'Otras Competiciones';
    if (!groupedByComp[compKey]) groupedByComp[compKey] = [];
    groupedByComp[compKey].push(m);
  });

  const toggleExpandComp = (compName: string) => {
    setExpandedComps(prev => ({ ...prev, [compName]: !prev[compName] }));
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner & Date Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            Zona Horaria: America/Lima
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Partidos en Directo y por Fecha
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Consulta oficial en tiempo real desde la API-Football con generación dinámica de fecha.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 text-white text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => loadFixturesForDate(selectedDate)}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-all"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <option value="upcoming">⏰ Programados</option>
              <option value="finished">✅ Finalizados</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">País: Todos</option>
              {countries.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedComp}
              onChange={(e) => setSelectedComp(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Competición: Todas</option>
              {competitions.map((comp: any) => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Matches Grouped by Competition with "Ver más" option */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Consultando API-Football para la fecha {selectedDate} (America/Lima)...</p>
        </div>
      ) : Object.keys(groupedByComp).length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No se encontraron encuentros</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No hay partidos disponibles para la fecha seleccionada ({selectedDate}) o con los filtros aplicados. Prueba seleccionando otra fecha.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByComp).map(([compName, compMatches]) => {
            const firstM: any = compMatches[0];
            const isExpanded = expandedComps[compName] || compMatches.length <= 4;
            const visibleMatches = isExpanded ? compMatches : compMatches.slice(0, 4);

            return (
              <div key={compName} className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900 px-5 py-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    {firstM.competition_logo && (
                      <img src={firstM.competition_logo} alt={compName} className="w-6 h-6 object-contain" />
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white">{compName}</h3>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{firstM.competition_country || 'Internacional'} &bull; {compMatches.length} partidos</span>
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
                  {visibleMatches.map((m: any) => (
                    <div 
                      key={m.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                          <Clock className="w-3.5 h-3.5" />
                          {m.local_time || m.date}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          m.status === 'live' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' :
                          m.status === 'finished' ? 'bg-slate-800 text-slate-300' :
                          'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        }`}>
                          {m.status === 'live' ? `🔴 En Vivo ${m.minute}` : m.status === 'finished' ? 'Finalizado' : 'Programado'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 flex-1">
                          {m.home_logo ? (
                            <img src={m.home_logo} alt={m.home_team} className="w-8 h-8 object-contain" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                              {m.home_team.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-white text-sm truncate">{m.home_team}</span>
                        </div>

                        <div className="bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800 font-mono text-lg font-black text-white shrink-0 mx-2">
                          {m.status === 'upcoming' ? 'VS' : `${m.home_score} - ${m.away_score}`}
                        </div>

                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <span className="font-bold text-white text-sm truncate text-right">{m.away_team}</span>
                          {m.away_logo ? (
                            <img src={m.away_logo} alt={m.away_team} className="w-8 h-8 object-contain" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                              {m.away_team.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 truncate">{m.venue || 'Estadio Principal'}</span>
                        <button
                          onClick={() => {
                            setHomeTeam(m.home_team);
                            setAwayTeam(m.away_team);
                            setActiveSection('probabilidades');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                        >
                          Estadísticas
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
      )}
    </div>
  );
};
