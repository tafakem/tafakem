import React, { useState, useEffect } from 'react';
import { Trophy, Shield, Search, Calendar, RefreshCw, AlertCircle, BarChart2 } from 'lucide-react';
import { fetchStandings, StandingRow } from '../utils/footballApi';

export const CompetitionsStandingsView: React.FC = () => {
  const competitionsList = [
    { id: '39', name: 'Premier League', country: 'Inglaterra' },
    { id: '140', name: 'La Liga', country: 'España' },
    { id: '135', name: 'Serie A', country: 'Italia' },
    { id: '78', name: 'Bundesliga', country: 'Alemania' },
    { id: '61', name: 'Ligue 1', country: 'Francia' },
    { id: '282', name: 'Liga 1 de Perú', country: 'Perú' },
    { id: '2', name: 'UEFA Champions League', country: 'Europa' },
    { id: '3', name: 'UEFA Europa League', country: 'Europa' }
  ];

  const [selectedComp, setSelectedComp] = useState(competitionsList[0].id);
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const [standingsGroups, setStandingsGroups] = useState<StandingRow[][]>([[]]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStandings = async (leagueId: string, season: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchStandings(leagueId, season);
      if (data && data.length > 0) {
        setStandingsGroups(data);
      } else {
        setStandingsGroups([]);
        setErrorMsg('No se encontró tabla de clasificación disponible para esta competición en la temporada seleccionada.');
      }
    } catch (err: any) {
      setErrorMsg('Error al consultar las clasificaciones de la API.');
      setStandingsGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandings(selectedComp, selectedSeason);
  }, [selectedComp, selectedSeason]);

  const activeCompInfo = competitionsList.find(c => c.id === selectedComp);

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Trophy className="w-3.5 h-3.5" />
            Competiciones Oficiales & Clasificaciones
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Tablas de Posiciones de Ligas Top
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Consulta la clasificación actualizada de la Premier League, LaLiga, Serie A, Bundesliga, Liga 1 de Perú y torneos UEFA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedComp}
            onChange={(e) => setSelectedComp(e.target.value)}
            className="bg-slate-950 text-white text-xs font-semibold px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
          >
            {competitionsList.map(comp => (
              <option key={comp.id} value={comp.id}>{comp.name} ({comp.country})</option>
            ))}
          </select>

          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="bg-slate-950 text-white text-xs font-semibold px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="2025">Temporada 2025/2026</option>
            <option value="2026">Temporada 2026</option>
            <option value="2024">Temporada 2024/2025</option>
          </select>
        </div>
      </div>

      {/* Standings Content */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Cargando clasificación de {activeCompInfo?.name}...</p>
        </div>
      ) : errorMsg || standingsGroups.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Tabla no disponible</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {errorMsg || 'No hay datos de clasificación disponibles para esta competición en la temporada seleccionada.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {standingsGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  {activeCompInfo?.name} &bull; {activeCompInfo?.country} {group[0]?.group ? `(${group[0].group})` : ''}
                </h3>
                <span className="text-xs font-mono text-slate-400">Temporada {selectedSeason}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                      <th className="py-3 px-4 text-center w-12">Pos</th>
                      <th className="py-3 px-6">Equipo</th>
                      <th className="py-3 px-3 text-center">PJ</th>
                      <th className="py-3 px-3 text-center">G</th>
                      <th className="py-3 px-3 text-center">E</th>
                      <th className="py-3 px-3 text-center">P</th>
                      <th className="py-3 px-3 text-center">GF</th>
                      <th className="py-3 px-3 text-center">GC</th>
                      <th className="py-3 px-3 text-center">DG</th>
                      <th className="py-3 px-6 text-center font-bold text-white">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {group.map((row) => (
                      <tr key={row.team.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                          <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] ${
                            row.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            row.rank <= 4 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            'bg-slate-950 text-slate-400'
                          }`}>
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3 px-6 font-bold text-white flex items-center gap-3">
                          {row.team.logo ? (
                            <img src={row.team.logo} alt={row.team.name} className="w-6 h-6 object-contain" />
                          ) : (
                            <Shield className="w-5 h-5 text-slate-500" />
                          )}
                          <span className="truncate">{row.team.name}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{row.all.played}</td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-400 font-semibold">{row.all.win}</td>
                        <td className="py-3 px-3 text-center font-mono text-amber-400 font-semibold">{row.all.draw}</td>
                        <td className="py-3 px-3 text-center font-mono text-rose-400 font-semibold">{row.all.lose}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-200">{row.all.goals.for}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-200">{row.all.goals.against}</td>
                        <td className={`py-3 px-3 text-center font-mono font-bold ${row.goalsDiff > 0 ? 'text-emerald-400' : row.goalsDiff < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                        </td>
                        <td className="py-3 px-6 text-center font-mono font-black text-white text-sm bg-slate-950/40">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
