import React from 'react';
import { Target, TrendingUp, Sparkles, Shield, BarChart2 } from 'lucide-react';
import { Match, TeamStats } from '../types/football';
import { calculateTeamStats } from '../utils/analytics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface XgViewProps {
  homeTeam: string;
  awayTeam: string;
  matches: Match[];
}

export const XgView: React.FC<XgViewProps> = ({
  homeTeam,
  awayTeam,
  matches
}) => {
  const statsList = calculateTeamStats(matches);
  const homeStats = statsList.find(s => s.name === homeTeam);
  const awayStats = statsList.find(s => s.name === awayTeam);

  const chartData = statsList.slice(0, 8).map(s => ({
    team: s.name.length > 10 ? s.name.substring(0, 10) + '...' : s.name,
    'Goles Anotados': s.goals_scored,
    'xG Acumulado': Number(s.xg_for.toFixed(1))
  }));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold mb-3">
            <Target className="w-3.5 h-3.5" />
            Métrica Avanzada de Creación de Oportunidades
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Goles Esperados (Expected Goals - xG)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analiza la calidad de las ocasiones de gol generadas por {homeTeam} y {awayTeam} frente a la liga.
          </p>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              {homeTeam}
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Local
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">xG Total a Favor</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {homeStats ? homeStats.xg_for.toFixed(2) : '1.85'}
              </span>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">xG Concedido (En Contra)</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block">
                {homeStats ? homeStats.xg_against.toFixed(2) : '1.10'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
            <strong>Eficiencia Ofensiva:</strong> {homeStats && homeStats.goals_scored > (homeStats.xg_for || 1) ? 'Por encima del xG (Alta definición)' : 'Alineado con el xG estándar'}.
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-400" />
              {awayTeam}
            </h3>
            <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
              Visitante
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">xG Total a Favor</span>
              <span className="text-2xl font-black text-white mt-1 block">
                {awayStats ? awayStats.xg_for.toFixed(2) : '1.60'}
              </span>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">xG Concedido (En Contra)</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block">
                {awayStats ? awayStats.xg_against.toFixed(2) : '1.30'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
            <strong>Eficiencia Ofensiva:</strong> {awayStats && awayStats.goals_scored > (awayStats.xg_for || 1) ? 'Excelente aprovechamiento de ocasiones' : 'Ocasiones desaprovechadas'}.
          </div>
        </div>
      </div>

      {/* xG Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
          <BarChart2 className="w-5 h-5 text-emerald-400" />
          Comparativa xG vs Goles Reales por Equipo (Top Ligas)
        </h3>

        <div className="w-full h-80 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="team" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
              />
              <Bar dataKey="Goles Anotados" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="xG Acumulado" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
