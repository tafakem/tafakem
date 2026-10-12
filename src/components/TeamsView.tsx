import React, { useState } from 'react';
import { Shield, Search, Trophy, TrendingUp } from 'lucide-react';
import { Match, TeamStats } from '../types/football';
import { calculateTeamStats } from '../utils/analytics';

interface TeamsViewProps {
  matches: Match[];
}

export const TeamsView: React.FC<TeamsViewProps> = ({ matches }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const statsList = calculateTeamStats(matches);

  const filteredTeams = statsList.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            Clasificación General y Rendimiento
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Equipos y Estadísticas de la Temporada
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Resumen estadístico de todos los clubes registrados en la base de datos de Tafakem.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                <th className="py-4 px-6">Equipo</th>
                <th className="py-4 px-4 text-center">PJ</th>
                <th className="py-4 px-4 text-center">G</th>
                <th className="py-4 px-4 text-center">E</th>
                <th className="py-4 px-4 text-center">P</th>
                <th className="py-4 px-4 text-center">GF</th>
                <th className="py-4 px-4 text-center">GC</th>
                <th className="py-4 px-4 text-center">DG</th>
                <th className="py-4 px-4 text-center">Pts</th>
                <th className="py-4 px-6 text-center">Últimos 5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTeams.map((team, index) => {
                const points = team.wins * 3 + team.draws;
                const gd = team.goals_scored - team.goals_conceded;
                return (
                  <tr key={team.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                        {index + 1}
                      </span>
                      {team.name}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-slate-300">{team.matches_played}</td>
                    <td className="py-4 px-4 text-center font-mono text-emerald-400 font-semibold">{team.wins}</td>
                    <td className="py-4 px-4 text-center font-mono text-amber-400 font-semibold">{team.draws}</td>
                    <td className="py-4 px-4 text-center font-mono text-rose-400 font-semibold">{team.losses}</td>
                    <td className="py-4 px-4 text-center font-mono text-slate-200">{team.goals_scored}</td>
                    <td className="py-4 px-4 text-center font-mono text-slate-200">{team.goals_conceded}</td>
                    <td className={`py-4 px-4 text-center font-mono font-bold ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {gd > 0 ? `+${gd}` : gd}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-white text-sm">{points}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1">
                        {team.form.map((f, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                              f === 'W' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              f === 'D' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
