import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Target, 
  Flag, 
  ArrowRight, 
  Sparkles, 
  BarChart2,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { Match, TeamStats } from '../types/football';
import { calculateMatchProbabilities } from '../utils/analytics';

interface HomeViewProps {
  matches: Match[];
  teamStats: TeamStats[];
  setActiveSection: (section: string) => void;
  homeTeam: string;
  awayTeam: string;
  setHomeTeam: (team: string) => void;
  setAwayTeam: (team: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  matches,
  teamStats,
  setActiveSection,
  homeTeam,
  awayTeam,
  setHomeTeam,
  setAwayTeam
}) => {
  const totalGoals = matches.reduce((sum, m) => sum + m.home_score + m.away_score, 0);
  const avgGoals = matches.length > 0 ? (totalGoals / matches.length).toFixed(2) : '0.00';
  
  const totalCorners = matches.reduce((sum, m) => sum + (m.home_corners || 0) + (m.away_corners || 0), 0);
  const avgCorners = matches.length > 0 ? (totalCorners / matches.length).toFixed(1) : '0.0';

  const previewProbs = calculateMatchProbabilities(homeTeam, awayTeam, matches);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma de Analítica Avanzada de Fútbol
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tafakem Football Analytics
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Analiza partidos, simula distribuciones de Poisson, predice goles y córners con rigor estadístico y descubre patrones tácticos sin necesidad de APIs de pago.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setActiveSection('probabilidades')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
            >
              Simular Probabilidades ({homeTeam} vs {awayTeam})
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveSection('analisis')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all border border-slate-700"
            >
              Comparar Equipos
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Partidos Analizados</p>
            <p className="text-3xl font-black text-white mt-1">{matches.length}</p>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Base de datos activa
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Equipos Registrados</p>
            <p className="text-3xl font-black text-white mt-1">{teamStats.length}</p>
            <span className="text-[11px] text-teal-400 font-medium flex items-center gap-1 mt-1">
              <Users className="w-3.5 h-3.5" /> Ligas Top
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Promedio Goles / Partido</p>
            <p className="text-3xl font-black text-white mt-1">{avgGoals}</p>
            <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Modelo Poisson OK
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Promedio Córners</p>
            <p className="text-3xl font-black text-white mt-1">{avgCorners}</p>
            <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1 mt-1">
              <Flag className="w-3.5 h-3.5" /> Líneas 7.5 - 10.5
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Flag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Featured Match Quick Probability Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Vista Previa de Probabilidades (Poisson)</h3>
                <p className="text-xs text-slate-400">Estimación actual para el duelo seleccionado</p>
              </div>
            </div>
            <button
              onClick={() => setActiveSection('probabilidades')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Ver análisis completo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-6 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Local</span>
              <h4 className="text-xl font-bold text-white mt-1">{homeTeam}</h4>
              <p className="text-xs text-emerald-400 font-mono mt-1">xG Est: {previewProbs.home_lambda}</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-xs font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-700 text-slate-300 mb-2">
                Probabilidades de Resultado
              </div>
              <div className="flex items-center gap-4 text-sm font-bold">
                <div className="text-emerald-400">{previewProbs.home_win_prob}%</div>
                <div className="text-slate-400">{previewProbs.draw_prob}%</div>
                <div className="text-teal-400">{previewProbs.away_win_prob}%</div>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Visitante</span>
              <h4 className="text-xl font-bold text-white mt-1">{awayTeam}</h4>
              <p className="text-xs text-teal-400 font-mono mt-1">xG Est: {previewProbs.away_lambda}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Más 2.5 Goles</span>
              <span className="text-lg font-bold text-white mt-1 block">{previewProbs.over_under.ou25_over}%</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Ambos Marcan (BTTS)</span>
              <span className="text-lg font-bold text-white mt-1 block">{previewProbs.btts.yes}%</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Menos 2.5 Goles</span>
              <span className="text-lg font-bold text-white mt-1 block">{previewProbs.over_under.ou25_under}%</span>
            </div>
          </div>
        </div>

        {/* Recent Matches Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Últimos Partidos
            </h3>
            <button
              onClick={() => setActiveSection('importar')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {matches.slice(0, 5).map(m => (
              <div key={m.id} className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-medium">
                    {m.competition || 'Liga'}
                  </span>
                  <span>{m.date}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-white">
                  <span className="truncate max-w-[110px]">{m.home_team}</span>
                  <span className="bg-slate-900 px-2.5 py-1 rounded font-mono text-emerald-400 border border-slate-800">
                    {m.home_score} - {m.away_score}
                  </span>
                  <span className="truncate max-w-[110px] text-right">{m.away_team}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
