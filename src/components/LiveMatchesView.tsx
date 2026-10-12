import React, { useState, useEffect } from 'react';
import { Radio, Clock, Trophy, Sparkles, ArrowRight, Activity, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { Match } from '../types/football';
import { fetchLiveFixtures, convertApiFixtureToMatch } from '../utils/footballApi';
import { calculateMatchProbabilities } from '../utils/analytics';

interface LiveMatchesViewProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  setActiveSection: (section: string) => void;
  setHomeTeam: (team: string) => void;
  setAwayTeam: (team: string) => void;
}

export const LiveMatchesView: React.FC<LiveMatchesViewProps> = ({
  matches,
  setMatches,
  setActiveSection,
  setHomeTeam,
  setAwayTeam
}) => {
  const [liveFixtures, setLiveFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLiveMatches = async () => {
    setLoading(true);
    try {
      const rawLive = await fetchLiveFixtures();
      const converted = rawLive.map(convertApiFixtureToMatch);
      setLiveFixtures(converted);
      if (converted.length > 0) {
        setMatches(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = converted.filter(c => !existingIds.has(c.id));
          return [...newItems, ...prev];
        });
      }
    } catch (err) {
      console.error('Error loading live fixtures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveMatches();
    const interval = setInterval(loadLiveMatches, 30000); // Poll live fixtures every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (rawStatus: string, minute?: string) => {
    switch (rawStatus) {
      case 'First Half':
      case '1H':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">🔴 1ª Mitad ({minute || "1H"})</span>;
      case 'Half Time':
      case 'HT':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">⏸️ Descanso (HT)</span>;
      case 'Second Half':
      case '2H':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">🔴 2ª Mitad ({minute || "2H"})</span>;
      case 'Extra Time':
      case 'ET':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">⏱️ T. Suplementario (ET)</span>;
      case 'Penalty Shootout':
      case 'P':
        return <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">⚽ Penales (P)</span>;
      case 'Match Finished':
      case 'FT':
        return <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">✅ Finalizado (FT)</span>;
      case 'Match Suspended':
      case 'SUSP':
      case 'Postponed':
      case 'PST':
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">⚠️ Aplazado / Suspendido</span>;
      default:
        return <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{rawStatus || 'En Vivo'}</span>;
    }
  };

  const displayList = liveFixtures.length > 0 ? liveFixtures : matches.filter(m => m.status === 'live');

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            Endpoint: GET /fixtures?live=all&timezone=America/Lima
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Marcadores en Vivo en Tiempo Real
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Sigue cada incidencia, goles, tarjetas y minuto de juego con indicadores visuales avanzados.
          </p>
        </div>

        <button
          onClick={loadLiveMatches}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/40 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualizando...' : 'Actualizar En Vivo'}
        </button>
      </div>

      {loading && displayList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Consultando marcadores en vivo (America/Lima)...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No hay partidos en juego en este momento</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Actualmente no hay encuentros disputándose bajo el parámetro `live=all`. Revisa la pantalla de "Partidos de Hoy" para la programación completa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayList.map((m: any) => {
            const probs = calculateMatchProbabilities(m.home_team, m.away_team, matches);
            return (
              <div 
                key={m.id}
                className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-emerald-400">{m.competition || 'Competición Oficial'}</span>
                  {getStatusBadge(m.raw_status, m.minute)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-center flex-1 space-y-2">
                    {m.home_logo ? (
                      <img src={m.home_logo} alt={m.home_team} className="w-12 h-12 object-contain mx-auto" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 mx-auto">
                        {m.home_team.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <h4 className="font-bold text-white text-sm sm:text-base truncate">{m.home_team}</h4>
                  </div>

                  <div className="bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 font-mono text-3xl font-black text-white shadow-inner mx-3 shrink-0">
                    {m.home_score} - {m.away_score}
                  </div>

                  <div className="text-center flex-1 space-y-2">
                    {m.away_logo ? (
                      <img src={m.away_logo} alt={m.away_team} className="w-12 h-12 object-contain mx-auto" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 mx-auto">
                        {m.away_team.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <h4 className="font-bold text-white text-sm sm:text-base truncate">{m.away_team}</h4>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block">xG Estimado</span>
                    <strong className="text-emerald-400 font-mono">{m.home_xg || probs.home_lambda} - {m.away_xg || probs.away_lambda}</strong>
                  </div>
                  <button
                    onClick={() => {
                      setHomeTeam(m.home_team);
                      setAwayTeam(m.away_team);
                      setActiveSection('probabilidades');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    Estadísticas
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
