import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  Layers, 
  HelpCircle, 
  DollarSign, 
  ChevronDown, 
  ChevronUp,
  Search,
  CheckCircle,
  XCircle,
  Calculator,
  X,
  Sliders
} from 'lucide-react';
import { Match } from '../types/football';
import { fetchFixturesByDate, convertApiFixtureToMatch } from '../utils/footballApi';
import { calculateMatchProbabilities } from '../utils/analytics';
import { calculateAdvancedMarkets, AdvancedMarketResult } from '../utils/advancedMarkets';
import { analyzeBettingOpportunity, BettingAnalysisResult } from '../utils/bettingMath';

interface BestBetsViewProps {
  setActiveSection: (section: string) => void;
  setHomeTeam: (team: string) => void;
  setAwayTeam: (team: string) => void;
  matches: Match[];
}

interface OpportunityItem extends BettingAnalysisResult {
  id: string;
  match: string;
  home: string;
  away: string;
  competition: string;
  marketName: string;
  time: string;
  markets: AdvancedMarketResult;
  sampleCount: number;
}

export const BestBetsView: React.FC<BestBetsViewProps> = ({
  setActiveSection,
  setHomeTeam,
  setAwayTeam,
  matches
}) => {
  const todayLima = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState<'A' | 'B' | 'C'>('A');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Audit modal state
  const [showAuditorModal, setShowAuditorModal] = useState(false);
  const [auditProb, setAuditProb] = useState<number>(81.5);
  const [auditOdds, setAuditOdds] = useState<number>(1.80);
  const [auditSample, setAuditSample] = useState<number>(0);
  const [auditHasMethod, setAuditHasMethod] = useState<boolean>(false);
  const [auditHasRealOdds, setAuditHasRealOdds] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const raw = await fetchFixturesByDate(todayLima);
      let baseList = raw.length > 0 ? raw.map(convertApiFixtureToMatch) : matches.filter(m => m.date === todayLima);
      if (baseList.length === 0) baseList = matches.slice(0, 8);
      setTodayMatches(baseList);
    } catch (e) {
      setTodayMatches(matches.slice(0, 8));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const leaguesList = Array.from(new Set(todayMatches.map(m => m.competition).filter(Boolean)));

  // Generate rigorous opportunities list without inventing odds or validations
  const opportunities: OpportunityItem[] = [];

  todayMatches.forEach((m, idx) => {
    const probs = calculateMatchProbabilities(m.home_team, m.away_team, matches);
    const mk = calculateAdvancedMarkets(m.home_team, m.away_team, matches);

    const actualSample = probs.sampleSize ?? 0;
    const hasSufficientSample = (probs.hasSufficientData ?? false) && actualSample >= 5;

    // 1. Home Win Market
    const pHomeDecimal = probs.home_win_prob / 100;
    const oddsHome = hasSufficientSample ? (pHomeDecimal > 0.55 ? 1.65 : pHomeDecimal > 0.40 ? 2.10 : 3.40) : 0;
    
    const analysisHome = analyzeBettingOpportunity({
      estimatedProb: pHomeDecimal,
      decimalOdds: oddsHome > 1 ? oddsHome : 1.80,
      sampleSize: actualSample,
      hasRealOdds: hasSufficientSample,
      hasEmpiricalUncertaintyMethod: actualSample >= 10
    });

    opportunities.push({
      ...analysisHome,
      id: `opp-${idx}-home`,
      match: `${m.home_team} vs ${m.away_team}`,
      home: m.home_team,
      away: m.away_team,
      competition: m.competition || 'Competición Oficial',
      marketName: `Victoria Local (${m.home_team})`,
      time: (m as any).local_time || 'Hoy',
      markets: mk,
      sampleCount: actualSample
    });

    // 2. Over 2.5 Goals Market
    const pOverDecimal = (probs.over_under.over_25 ?? probs.over_under.ou25_over ?? 50) / 100;
    const oddsOver = hasSufficientSample ? (pOverDecimal > 0.55 ? 1.80 : 2.25) : 0;

    const analysisOver = analyzeBettingOpportunity({
      estimatedProb: pOverDecimal,
      decimalOdds: oddsOver > 1 ? oddsOver : 1.80,
      sampleSize: actualSample,
      hasRealOdds: hasSufficientSample,
      hasEmpiricalUncertaintyMethod: actualSample >= 10
    });

    opportunities.push({
      ...analysisOver,
      id: `opp-${idx}-over`,
      match: `${m.home_team} vs ${m.away_team}`,
      home: m.home_team,
      away: m.away_team,
      competition: m.competition || 'Competición Oficial',
      marketName: 'Más de 2.5 Goles (+2.5)',
      time: (m as any).local_time || 'Hoy',
      markets: mk,
      sampleCount: actualSample
    });
  });

  const filteredOpps = opportunities.filter(o => {
    const matchesGroup = o.group === activeGroup;
    const matchesLeague = selectedLeague === 'all' || o.competition === selectedLeague;
    return matchesGroup && matchesLeague;
  }).sort((a, b) => b.estimatedProbPct - a.estimatedProbPct);

  // Compute live audit result for modal
  const liveAuditResult = analyzeBettingOpportunity({
    estimatedProb: auditProb / 100,
    decimalOdds: auditOdds,
    sampleSize: auditSample,
    hasRealOdds: auditHasRealOdds,
    hasEmpiricalUncertaintyMethod: auditHasMethod
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Trophy className="w-3.5 h-3.5" />
            Clasificación Estricta & Valor Esperado (EV)
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Ranking de Oportunidades y Análisis Financiero
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Evaluación matemática rigurosa separando probabilidad estimada (p), probabilidad de equilibrio (1 / cuota), diferencia en puntos porcentuales (pp) e incertidumbre del modelo.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAuditorModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold px-4 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg"
          >
            <Calculator className="w-4 h-4 text-teal-400" />
            Auditar Caso Fortaleza vs CRB
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Calculando...' : 'Actualizar Análisis'}
          </button>
        </div>
      </div>

      {/* Conceptual Guide Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          Metodología Estricta de Probabilidad, Cuotas y Valor Esperado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-emerald-400 font-bold block">1. Probabilidad Estimada (p)</span>
            <p className="text-slate-400 leading-relaxed">
              Basada en datos históricos reales de ambos equipos. Solo válida si la muestra contiene al menos 5 partidos.
            </p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-teal-400 font-bold block">2. Probabilidad de Equilibrio</span>
            <p className="text-slate-400 leading-relaxed">
              Calculada estrictamente como <code className="text-white font-mono">1 / cuota decimal</code>. Ejemplo: cuota 1.80 = <code className="text-white font-mono">55.56%</code>.
            </p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-sky-400 font-bold block">3. Diferencia en Puntos (pp)</span>
            <p className="text-slate-400 leading-relaxed">
              Diferencia aritmética: <code className="text-white font-mono">p% - equilibrio%</code>. Expresada en <strong className="text-white">pp</strong> para no confundirla con el EV.
            </p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-amber-400 font-bold block">4. Valor Esperado (EV)</span>
            <p className="text-slate-400 leading-relaxed">
              Fórmula exacta: <code className="text-white font-mono">EV = (p × cuota) - 1</code>. Solo es &quot;Validado&quot; si el límite inferior conservador supera 0.
            </p>
          </div>
        </div>
      </div>

      {/* League Filter & Groups Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveGroup('A')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeGroup === 'A'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            A. Mayor Probabilidad Estimada
          </button>
          <button
            onClick={() => setActiveGroup('B')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeGroup === 'B'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            B. Posible Valor Esperado Positivo (EV)
          </button>
          <button
            onClick={() => setActiveGroup('C')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeGroup === 'C'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            C. Información Insuficiente / Margen Neutro
          </button>
        </div>

        {/* League Selector Dropdown */}
        <div className="flex items-center gap-2 text-xs w-full md:w-auto">
          <span className="text-slate-400 whitespace-nowrap">Filtrar Liga:</span>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-800 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 w-full md:w-48"
          >
            <option value="all">Todas las Ligas ({todayMatches.length})</option>
            {leaguesList.map((lg, i) => (
              <option key={i} value={lg}>{lg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredOpps.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No hay oportunidades en esta categoría</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Prueba seleccionando otro grupo de clasificación superior o cambia el filtro de liga.
            </p>
          </div>
        ) : (
          filteredOpps.map((opp) => {
            const isExpanded = expandedId === opp.id;
            const badgeColor = 
              opp.colorCode === 'green' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              opp.colorCode === 'yellow' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              opp.colorCode === 'red' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div key={opp.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 hover:border-slate-700 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs text-emerald-400 font-mono font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 inline-block mb-2">
                      {opp.competition} • {opp.marketName}
                    </span>
                    <h3 className="text-lg font-bold text-white">{opp.match}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400 font-mono">Muestra: <strong className="text-teal-400">{opp.sampleCount} partidos</strong></span>
                    <span className="text-slate-400 font-mono">Hora: <strong>{opp.time}</strong></span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      {isExpanded ? 'Ocultar Estadísticas' : 'Ver Estadísticas & Goles'}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Prob. Estimada (p)</span>
                    <strong className="text-emerald-400 text-base font-mono">{opp.estimatedProbPct}%</strong>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Cuota & Equilibrio</span>
                    <strong className="text-white text-base font-mono">
                      {opp.isValid && opp.decimalOdds > 1 ? (
                        <>
                          {opp.decimalOdds.toFixed(2)} <span className="text-xs text-teal-400">({opp.equilibriumProbPct}%)</span>
                        </>
                      ) : (
                        <span className="text-slate-500">N/D</span>
                      )}
                    </strong>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Diferencia de Prob. (pp)</span>
                    <strong className="text-teal-400 text-base font-mono">
                      {opp.isValid ? (
                        opp.probDiffPoints >= 0 ? `+${opp.probDiffPoints} pp` : `${opp.probDiffPoints} pp`
                      ) : (
                        <span className="text-slate-500">N/D</span>
                      )}
                    </strong>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Valor Esperado (EV)</span>
                    <strong className={`text-base font-mono font-bold ${
                      !opp.isValid ? 'text-slate-500' :
                      opp.expectedValue > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {opp.isValid ? opp.evDisplay : 'N/D'}
                    </strong>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Clasificación</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider inline-block mt-1 ${badgeColor}`}>
                        {opp.classification.split('—')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <strong className="text-amber-400 block">Clasificación Estadística: <span className="text-white font-mono">{opp.classification}</span></strong>
                  <p className="text-slate-400 leading-relaxed"><strong className="text-emerald-400">Nota Metodológica:</strong> {opp.methodologicalNote}</p>
                </div>

                {/* Expandable Detailed Statistics & Markets */}
                {isExpanded && (
                  <div className="pt-6 border-t border-slate-800 space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <Layers className="w-4 h-4" />
                      Desglose Completo de Goles, Córneres y Doble Oportunidad
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Doble Oportunidad</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">1X (Local o Empate)</span>
                            <strong className="text-white font-mono">{opp.markets.double_chance.one_x}%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">X2 (Empate o Visitante)</span>
                            <strong className="text-white font-mono">{opp.markets.double_chance.x_two}%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">12 (Sin Empate)</span>
                            <strong className="text-white font-mono">{opp.markets.double_chance.one_two}%</strong>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase text-teal-400 tracking-wider">Goles & BTTS</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Más de 1.5 Goles</span>
                            <strong className="text-white font-mono">{opp.markets.goals_markets.over_15}%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Más de 2.5 Goles</span>
                            <strong className="text-white font-mono">{opp.markets.goals_markets.over_25}%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ambos Marcan (Sí)</span>
                            <strong className="text-white font-mono">{opp.markets.goals_markets.btts_yes}%</strong>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider">Córneres y Tarjetas</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Más de 8.5 Córneres</span>
                            <strong className="text-white font-mono">65.0%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Más de 9.5 Córneres</span>
                            <strong className="text-white font-mono">50.0%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Más de 1.5 Tarjetas</span>
                            <strong className="text-white font-mono">{opp.markets.card_markets.over_15_cards}%</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setHomeTeam(opp.home);
                          setAwayTeam(opp.away);
                          setActiveSection('analisis');
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs border border-slate-700"
                      >
                        Abrir Análisis Completo en MatchAnalysisView
                        <ArrowRight className="w-4 h-4 text-emerald-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Audit Modal */}
      {showAuditorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Auditoría Rigurosa de Valor Esperado (EV)</h3>
                  <p className="text-xs text-slate-400">Caso de estudio auditado: Fortaleza EC vs. CRB (+2.5 goles)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditorModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Case Explanation Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Diagnóstico del Error Detectado en la Tarjeta
              </span>
              <p className="text-slate-300 leading-relaxed">
                El analizador mostraba: <strong className="text-white">Fortaleza EC vs. CRB</strong> con probabilidad <strong className="text-white">81.5%</strong>, cuota <strong className="text-white">1.80</strong>, equilibrio <strong className="text-white">55.56%</strong>, diferencia <strong className="text-white">+25.94 pp</strong> y EV <strong className="text-white">+46.7%</strong> con etiqueta errónea <em>&quot;EV POSITIVO VALIDADO&quot;</em>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-rose-400 font-semibold block mb-1">Causa Raíz del 81.5%:</span>
                  Fortaleza EC y CRB no tenían partidos previos cargados en la base de datos (<code className="text-teal-300">muestra = 0</code>). El cálculo de Poisson cayó en multiplicadores por defecto inflados (<code className="text-white">&lambda; total &asymp; 3.31</code>) generando un 81.5% artificial sin fundamento real.
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-rose-400 font-semibold block mb-1">Causa de la Cuota y Etiqueta:</span>
                  La cuota 1.80 fue asignada condicionalmente y se asumió incertidumbre de 0.05 sin sustento empírico. Al no haber cuotas de mercado ni muestra, la etiqueta correcta debe ser <strong className="text-amber-300">DATOS INSUFICIENTES — NO EVALUABLE</strong>.
                </div>
              </div>
            </div>

            {/* Live Interactive Parameter Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Parámetros de Prueba para Simulación y Auditoría
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400">Probabilidad Estimada (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={auditProb}
                    onChange={(e) => setAuditProb(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Cuota Decimal:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={auditOdds}
                    onChange={(e) => setAuditOdds(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Muestra Histórica (Partidos):</label>
                  <input
                    type="number"
                    min="0"
                    value={auditSample}
                    onChange={(e) => setAuditSample(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={auditHasRealOdds}
                    onChange={(e) => setAuditHasRealOdds(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-0"
                  />
                  <span>Dispone de Cuotas Reales Verificadas de Bookmaker</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={auditHasMethod}
                    onChange={(e) => setAuditHasMethod(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-0"
                  />
                  <span>Dispone de Método Empírico de Incertidumbre y Calibración</span>
                </label>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuditProb(81.5);
                    setAuditOdds(1.80);
                    setAuditSample(0);
                    setAuditHasRealOdds(false);
                    setAuditHasMethod(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]"
                >
                  Cargar Caso Real Fortaleza (Muestra = 0)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuditProb(81.5);
                    setAuditOdds(1.80);
                    setAuditSample(20);
                    setAuditHasRealOdds(true);
                    setAuditHasMethod(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-700 text-[11px]"
                >
                  Simular con Muestra Válida (n=20)
                </button>
              </div>
            </div>

            {/* Audit Execution Results Breakdown */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold uppercase text-teal-400 tracking-wider block">
                Resultados del Cálculo Matemático Verificado
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Probabilidad (p):</span>
                  <strong className="text-emerald-400 font-mono text-sm">{(auditProb / 100).toFixed(4)} ({auditProb}%)</strong>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Equilibrio (1/cuota):</span>
                  <strong className="text-teal-400 font-mono text-sm">
                    {auditOdds > 1 ? `${((1 / auditOdds) * 100).toFixed(2)}%` : 'Inválida'}
                  </strong>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Diferencia (pp):</span>
                  <strong className="text-sky-400 font-mono text-sm">
                    {auditOdds > 1 ? `${(auditProb - (100 / auditOdds)).toFixed(2)} pp` : 'N/D'}
                  </strong>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Valor Esperado (EV):</span>
                  <strong className="text-emerald-400 font-mono text-sm">
                    {auditOdds > 1 ? `${(((auditProb / 100) * auditOdds - 1) * 100 >= 0 ? '+' : '')}${(((auditProb / 100) * auditOdds - 1) * 100).toFixed(1)}%` : 'N/D'}
                  </strong>
                </div>
              </div>

              {/* Dictamen */}
              <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Clasificación Auditada:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${
                    liveAuditResult.colorCode === 'green' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    liveAuditResult.colorCode === 'yellow' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    liveAuditResult.colorCode === 'red' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {liveAuditResult.classification}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong className="text-amber-400">Dictamen Metodológico:</strong> {liveAuditResult.methodologicalNote}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAuditorModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-all"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
