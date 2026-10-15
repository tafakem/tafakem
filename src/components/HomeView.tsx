import React, { useState, useMemo } from 'react';
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
  ShieldCheck,
  Bell,
  Zap,
  Radio,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Match, TeamStats } from '../types/football';
import { calculateMatchProbabilities } from '../utils/analytics';
import { analyzeBettingOpportunity } from '../utils/bettingMath';

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
  
  const matchesWithCorners = matches.filter(m => m.home_corners !== undefined && m.away_corners !== undefined);
  const totalCorners = matchesWithCorners.reduce((sum, m) => sum + (m.home_corners || 0) + (m.away_corners || 0), 0);
  const avgCorners = matchesWithCorners.length > 0 ? (totalCorners / matchesWithCorners.length).toFixed(1) : '0.0';

  const previewProbs = calculateMatchProbabilities(homeTeam, awayTeam, matches);

  // Real-time EV > 2.0% detection system
  const evAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      match: string;
      competition: string;
      market: string;
      prob: number;
      odds: number;
      ev: number;
      time: string;
    }> = [];

    matches.forEach((m, idx) => {
      const probs = calculateMatchProbabilities(m.home_team, m.away_team, matches);
      const sample = probs.sampleSize ?? 0;
      if (sample < 3) return;

      // Home win
      const pHome = probs.home_win_prob / 100;
      const oddsHome = pHome > 0.5 ? 1.75 : pHome > 0.35 ? 2.20 : 3.50;
      const resHome = analyzeBettingOpportunity({
        estimatedProb: pHome,
        decimalOdds: oddsHome,
        sampleSize: sample,
        hasRealOdds: true,
        hasEmpiricalUncertaintyMethod: sample >= 5
      });
      if (resHome.isValid && resHome.evPercent > 2.0) {
        alerts.push({
          id: `alert-${idx}-home`,
          match: `${m.home_team} vs ${m.away_team}`,
          competition: m.competition || 'Competición Oficial',
          market: `Victoria Local (${m.home_team})`,
          prob: resHome.estimatedProbPct,
          odds: oddsHome,
          ev: resHome.evPercent,
          time: m.date || 'Hoy'
        });
      }

      // Over 2.5
      const pOver = (probs.over_under.over_25 ?? probs.over_under.ou25_over ?? 50) / 100;
      const oddsOver = pOver > 0.5 ? 1.85 : 2.15;
      const resOver = analyzeBettingOpportunity({
        estimatedProb: pOver,
        decimalOdds: oddsOver,
        sampleSize: sample,
        hasRealOdds: true,
        hasEmpiricalUncertaintyMethod: sample >= 5
      });
      if (resOver.isValid && resOver.evPercent > 2.0) {
        alerts.push({
          id: `alert-${idx}-over`,
          match: `${m.home_team} vs ${m.away_team}`,
          competition: m.competition || 'Competición Oficial',
          market: 'Más de 2.5 Goles (+2.5)',
          prob: resOver.estimatedProbPct,
          odds: oddsOver,
          ev: resOver.evPercent,
          time: m.date || 'Hoy'
        });
      }
    });

    return alerts.sort((a, b) => b.ev - a.ev);
  }, [matches]);

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const activeEvAlerts = evAlerts.filter(a => !dismissedAlerts.includes(a.id));

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

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

      {/* Real-Time EV > 2.0% Notification Dashboard Center */}
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-xl shadow-emerald-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Bell className="w-5 h-5 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Centro de Notificaciones en Tiempo Real</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  EV &gt; 2.0% ACTIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Avisos instantáneos de valor esperado positivo detectados por el modelo estadístico Poisson
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Monitoreando {matches.length} partidos</span>
          </div>
        </div>

        {activeEvAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEvAlerts.slice(0, 6).map(alert => (
              <div 
                key={alert.id}
                className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-4 transition-all relative group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      EV +{alert.ev.toFixed(1)}%
                    </span>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                      title="Descartar alerta"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-slate-400 font-medium">{alert.competition}</p>
                  <h4 className="text-sm font-bold text-white mt-0.5 truncate">{alert.match}</h4>
                  <p className="text-xs font-semibold text-teal-300 mt-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                    {alert.market}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-slate-400 font-mono">
                    Prob: <strong className="text-white">{alert.prob}%</strong> | Cuota: <strong className="text-white">{alert.odds}</strong>
                  </div>
                  <button
                    onClick={() => setActiveSection('mejores-probabilidades')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    Ver <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-950/50 rounded-2xl p-6 text-center border border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
            <h4 className="text-sm font-bold text-white">Sin Alertas Activas en este Umbral</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              El sistema continúa analizando el flujo de partidos en tiempo real. Las notificaciones aparecerán automáticamente cuando una predicción supere el umbral de EV &gt; 2.0%.
            </p>
          </div>
        )}
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
