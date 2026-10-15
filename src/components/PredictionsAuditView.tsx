import React, { useState } from 'react';
import { Target, CheckCircle2, XCircle, Clock, ShieldCheck, Search, Filter, Trophy, ArrowRight, Activity, Sparkles, AlertTriangle } from 'lucide-react';
import { Match } from '../types/football';
import { calculateMatchProbabilities } from '../utils/analytics';

interface PredictionsAuditViewProps {
  matches: Match[];
}

export const PredictionsAuditView: React.FC<PredictionsAuditViewProps> = ({ matches }) => {
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'incorrect' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract unique competitions
  const competitions = Array.from(new Set(matches.map(m => m.competition || 'Otras Ligas')));

  // Process matches and generate predictions + audit
  const auditData = matches.map(m => {
    const probs = calculateMatchProbabilities(m.home_team, m.away_team, matches);
    
    // Determine most favored outcome based on probabilities
    let favored = 'Local (1)';
    let favoredProb = probs.home_win_prob;
    let predictedHomeGoals = Math.round(probs.home_lambda);
    let predictedAwayGoals = Math.round(probs.away_lambda);

    if (probs.draw_prob > probs.home_win_prob && probs.draw_prob > probs.away_win_prob) {
      favored = 'Empate (X)';
      favoredProb = probs.draw_prob;
    } else if (probs.away_win_prob > probs.home_win_prob) {
      favored = 'Visitante (2)';
      favoredProb = probs.away_win_prob;
    }

    // Check if match is finished
    const isFinished = m.status === 'finished' || (m.home_score !== undefined && m.away_score !== undefined && m.status !== 'upcoming');
    
    let auditResult: 'correct' | 'incorrect' | 'pending' = 'pending';
    let auditExplanation = 'Partido pendiente de disputarse o sin marcador final registrado.';

    if (isFinished) {
      const actualHome = m.home_score ?? 0;
      const actualAway = m.away_score ?? 0;
      
      let actualOutcome = 'X';
      if (actualHome > actualAway) actualOutcome = '1';
      else if (actualHome < actualAway) actualOutcome = '2';

      let predictedOutcomeCode = '1';
      if (favored.includes('Empate')) predictedOutcomeCode = 'X';
      else if (favored.includes('Visitante')) predictedOutcomeCode = '2';

      if (predictedOutcomeCode === actualOutcome) {
        auditResult = 'correct';
        auditExplanation = `¡Acierto! El modelo predijo ${favored} (${favoredProb}%) y el resultado real fue ${actualHome}-${actualAway} (${actualOutcome}).`;
      } else {
        auditResult = 'incorrect';
        auditExplanation = `Fallo en pronóstico. El modelo favorecía a ${favored} (${favoredProb}%), pero el resultado real fue ${actualHome}-${actualAway} (${actualOutcome === '1' ? 'Local' : actualOutcome === '2' ? 'Visitante' : 'Empate'}). El rendimiento en campo divergió de la expectativa estadística.`;
      }
    }

    return {
      match: m,
      probs,
      favored,
      favoredProb,
      predictedScore: `${predictedHomeGoals}-${predictedAwayGoals}`,
      isFinished,
      auditResult,
      auditExplanation
    };
  });

  // Filter audit items
  const filteredItems = auditData.filter(item => {
    const matchesComp = selectedCompetition === 'all' || item.match.competition === selectedCompetition;
    const matchesSearch = item.match.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.match.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.match.competition && item.match.competition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'correct' && item.auditResult === 'correct') ||
                          (filterStatus === 'incorrect' && item.auditResult === 'incorrect') ||
                          (filterStatus === 'pending' && item.auditResult === 'pending');

    return matchesComp && matchesSearch && matchesStatus;
  });

  // Global audit stats
  const finishedItems = auditData.filter(i => i.isFinished);
  const correctItems = finishedItems.filter(i => i.auditResult === 'correct');
  const incorrectItems = finishedItems.filter(i => i.auditResult === 'incorrect');
  const successRate = finishedItems.length > 0 ? Math.round((correctItems.length / finishedItems.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Auditoría de Modelos y Predicciones en Vivo
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Predicciones de Resultados & Verificación Honestos
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Evaluación transparente basada estrictamente en datos reales de partidos y modelos de Poisson/xG. Sin datos ficticios ni ocultamiento de errores.
          </p>
        </div>

        {/* Global Stats Summary */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center min-w-[280px]">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Auditados</span>
            <span className="text-xl font-black text-white font-mono">{finishedItems.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Aciertos</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{correctItems.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider block">% Efectividad</span>
            <span className="text-xl font-black text-amber-400 font-mono">{successRate}%</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar equipo o competición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Competition Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todas las Competiciones</option>
              {competitions.map((comp, idx) => (
                <option key={idx} value={comp}>{comp}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
            {(['all', 'correct', 'incorrect', 'pending'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterStatus === st 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' && 'Todos'}
                {st === 'correct' && 'Aciertos ✅'}
                {st === 'incorrect' && 'Fallos ❌'}
                {st === 'pending' && 'Pendientes ⏳'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Predictions & Audit List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">No se encontraron partidos con los filtros seleccionados</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Intenta cambiar los términos de búsqueda o el estado de auditoría para visualizar las predicciones del modelo estadístico.
            </p>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const m = item.match;
            return (
              <div 
                key={index} 
                className={`bg-slate-900 border rounded-3xl p-6 shadow-xl transition-all flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 ${
                  item.auditResult === 'correct' ? 'border-emerald-500/40 bg-gradient-to-r from-slate-900 to-emerald-950/10' :
                  item.auditResult === 'incorrect' ? 'border-rose-500/40 bg-gradient-to-r from-slate-900 to-rose-950/10' :
                  'border-slate-800'
                }`}
              >
                {/* Match Info & Score */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-emerald-400 font-semibold border border-slate-800">
                      {m.competition || 'Partido Oficial'}
                    </span>
                    <span className="text-slate-400 font-mono">{m.local_time || m.date || 'Programado'}</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center gap-3 flex-1">
                      {m.home_logo && <img src={m.home_logo} alt="" className="w-8 h-8 object-contain" />}
                      <span className="font-bold text-white text-sm sm:text-base">{m.home_team}</span>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono font-black text-lg text-white">
                      {item.isFinished ? `${m.home_score} - ${m.away_score}` : 'vs'}
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end text-right">
                      <span className="font-bold text-white text-sm sm:text-base">{m.away_team}</span>
                      {m.away_logo && <img src={m.away_logo} alt="" className="w-8 h-8 object-contain" />}
                    </div>
                  </div>
                </div>

                {/* Prediction / Favored Outcome */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-center min-w-[220px] space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Pronóstico Modelo</span>
                    <span className="font-mono text-emerald-400 font-bold">{item.favoredProb}%</span>
                  </div>
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Favorito: {item.favored}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between font-mono">
                    <span>Goles Est: {item.predictedScore}</span>
                    <span>λ H:{item.probs.home_lambda} A:{item.probs.away_lambda}</span>
                  </div>
                </div>

                {/* Audit Verification Result */}
                <div className="flex flex-col justify-center lg:max-w-xs space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Auditoría de Acierto
                  </div>
                  <div className="flex items-center gap-2">
                    {item.auditResult === 'correct' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Acertado ✅
                      </div>
                    )}
                    {item.auditResult === 'incorrect' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        Fallado ❌
                      </div>
                    )}
                    {item.auditResult === 'pending' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Pendiente ⏳
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.auditExplanation}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
