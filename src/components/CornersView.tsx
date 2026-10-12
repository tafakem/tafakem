import React from 'react';
import { Flag, Sparkles, Target, Activity } from 'lucide-react';
import { Match } from '../types/football';
import { calculateCornerProbprobabilities } from '../utils/analytics';

interface CornersViewProps {
  homeTeam: string;
  awayTeam: string;
  matches: Match[];
}

export const CornersView: React.FC<CornersViewProps> = ({
  homeTeam,
  awayTeam,
  matches
}) => {
  const cornerRes = calculateCornerProbprobabilities(homeTeam, awayTeam, matches);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold mb-3">
            <Flag className="w-3.5 h-3.5" />
            Módulo Independiente de Saques de Esquina
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Análisis de Córners y Líneas Estadísticas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Estimación de saques de esquina esperados para {homeTeam} y {homeTeam === awayTeam ? '' : awayTeam} usando Poisson aplicado a saques de esquina.
          </p>
        </div>

        <div className="bg-slate-950/70 px-6 py-4 rounded-2xl border border-slate-800 text-center">
          <span className="text-xs text-slate-400 block uppercase font-medium">Córners Esperados (Total)</span>
          <span className="text-3xl font-black text-indigo-400">{cornerRes.total_expected_corners}</span>
        </div>
      </div>

      {/* Expected Corners breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-emerald-400" />
              {homeTeam} (Local)
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Promedio Córners
            </span>
          </div>

          <div className="text-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800">
            <span className="text-xs uppercase text-slate-400 font-medium">Córners Esperados Match</span>
            <span className="text-4xl font-black text-white mt-2 block">{cornerRes.home_expected_corners}</span>
            <span className="text-xs text-emerald-400 mt-1 block">Basado en saques a favor y en contra históricos</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-teal-400" />
              {awayTeam} (Visitante)
            </h3>
            <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
              Promedio Córners
            </span>
          </div>

          <div className="text-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800">
            <span className="text-xs uppercase text-slate-400 font-medium">Córners Esperados Match</span>
            <span className="text-4xl font-black text-white mt-2 block">{cornerRes.away_expected_corners}</span>
            <span className="text-xs text-teal-400 mt-1 block">Basado en saques a favor y en contra históricos</span>
          </div>
        </div>
      </div>

      {/* Lines 7.5 to 10.5 Probabilities */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
          <Target className="w-5 h-5 text-indigo-400" />
          Probabilidades de Superar Líneas de Córners (Over / Under)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(cornerRes.lines || []).map((lineObj: any) => {
            const overProb = lineObj.over_prob ?? lineObj.probability ?? 50;
            const underProb = lineObj.under_prob ?? (100 - overProb);
            return (
              <div key={lineObj.line} className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                    Línea {lineObj.line}
                  </span>
                  <span className="text-xs text-indigo-400 font-medium">Córners Totales</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Más (+{lineObj.line})</span>
                    <strong className="text-emerald-400">{overProb}%</strong>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${overProb}%` }} className="bg-emerald-500 h-full rounded-full"></div>
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-slate-400">Menos (-{lineObj.line})</span>
                    <strong className="text-rose-400">{underProb}%</strong>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${underProb}%` }} className="bg-rose-500 h-full rounded-full"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
