import React, { useState } from 'react';
import { PieChart, Sparkles, Target, Activity, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';
import { Match } from '../types/football';
import { calculateMatchProbabilities } from '../utils/analytics';

interface ProbabilitiesViewProps {
  homeTeam: string;
  awayTeam: string;
  setHomeTeam: (team: string) => void;
  setAwayTeam: (team: string) => void;
  matches: Match[];
}

export const ProbabilitiesView: React.FC<ProbabilitiesViewProps> = ({
  homeTeam,
  awayTeam,
  setHomeTeam,
  setAwayTeam,
  matches
}) => {
  const [selectedModel, setSelectedModel] = useState<'poisson' | 'dixon-coles' | 'monte-carlo' | 'ai-neural'>('poisson');

  const probs = calculateMatchProbabilities(homeTeam, awayTeam, matches, selectedModel);

  const todayMatches = matches.slice(0, 4);

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Motor Activo: {selectedModel.toUpperCase()}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Modelo Estadístico de Poisson & Modelos Avanzados
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Cálculo de probabilidad de victoria, distribución de goles exactos, over/under y ambos anotan basados en xG y histórico.
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex flex-wrap gap-2">
          {(['poisson', 'dixon-coles', 'monte-carlo', 'ai-neural'] as const).map(model => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedModel === model
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {model.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Select Match */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          Seleccionar Partido Rápido para Calcular Probabilidades
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayMatches.map((m, idx) => {
            const isSelected = m.home_team === homeTeam && m.away_team === awayTeam;
            return (
              <button
                key={idx}
                onClick={() => {
                  setHomeTeam(m.home_team);
                  setAwayTeam(m.away_team);
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                  isSelected 
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-medium">
                    {m.competition || 'Liga'}
                  </span>
                  <span className="text-slate-400 font-mono">{m.local_time || m.minute || 'Hoy'}</span>
                </div>
                <div className="font-bold text-sm text-white flex justify-between items-center">
                  <span>{m.home_team} vs {m.away_team}</span>
                  <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 1X2 Probabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 text-center">
          <span className="text-xs uppercase text-slate-400 font-medium block">Victoria Local ({homeTeam})</span>
          <span className="text-4xl font-black text-emerald-400 block font-mono">{probs.home_win_prob}%</span>
          <span className="text-xs text-slate-500 block font-mono">λ (Expectativa Goles): {probs.home_lambda}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 text-center">
          <span className="text-xs uppercase text-slate-400 font-medium block">Empate (X)</span>
          <span className="text-4xl font-black text-amber-400 block font-mono">{probs.draw_prob}%</span>
          <span className="text-xs text-slate-500 block font-mono">Probabilidad Conjunta</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 text-center">
          <span className="text-xs uppercase text-slate-400 font-medium block">Victoria Visitante ({awayTeam})</span>
          <span className="text-4xl font-black text-teal-400 block font-mono">{probs.away_win_prob}%</span>
          <span className="text-xs text-slate-500 block font-mono">λ (Expectativa Goles): {probs.away_lambda}</span>
        </div>
      </div>

      {/* Over Under Markets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Mercados de Goles (Over / Under)
          </h3>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-slate-400 block font-medium">Más / Menos de 1.5 Goles</span>
              <div className="flex justify-between font-mono">
                <span className="text-emerald-400 font-bold">Más: {probs.over_under.over_15 ?? probs.over_under.ou15_over}%</span>
                <span className="text-slate-400">Menos: {probs.over_under.under_15 ?? probs.over_under.ou15_under}%</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-slate-400 block font-medium">Más / Menos de 2.5 Goles</span>
              <div className="flex justify-between font-mono">
                <span className="text-emerald-400 font-bold">Más: {probs.over_under.over_25 ?? probs.over_under.ou25_over}%</span>
                <span className="text-slate-400">Menos: {probs.over_under.under_25 ?? probs.over_under.ou25_under}%</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-slate-400 block font-medium">Más / Menos de 3.5 Goles</span>
              <div className="flex justify-between font-mono">
                <span className="text-emerald-400 font-bold">Más: {probs.over_under.over_35 ?? probs.over_under.ou35_over}%</span>
                <span className="text-slate-400">Menos: {probs.over_under.under_35 ?? probs.over_under.ou35_under}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
            Ambos Equipos Anotan (BTTS)
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
              <span className="text-xs uppercase text-slate-400 font-medium">Sí Anotan</span>
              <span className="text-3xl font-black text-emerald-400 block">{probs.btts.yes}%</span>
            </div>
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
              <span className="text-xs uppercase text-slate-400 font-medium">No Anotan</span>
              <span className="text-3xl font-black text-rose-400 block">{probs.btts.no}%</span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <strong className="text-white block mb-1">Nota metodológica ({selectedModel.toUpperCase()}):</strong>
            Las estimaciones se calculan utilizando el modelo seleccionado con los datos de goles esperados ($\lambda$) obtenidos del API.
          </div>
        </div>
      </div>

      {/* Top Exact Scores Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
          <Activity className="w-5 h-5 text-emerald-400" />
          Resultados Exactos Más Probables
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {(probs.exact_scores || probs.correct_scores || []).slice(0, 10).map((score: any, index: number) => (
            <div key={index} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-emerald-500/50 transition-all">
              <span className="text-xs text-slate-400 block">{index + 1}&ordm; Resultado</span>
              <span className="text-xl font-black text-white font-mono block">{score.home} - {score.away}</span>
              <span className="text-sm font-bold text-emerald-400">{score.prob}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
