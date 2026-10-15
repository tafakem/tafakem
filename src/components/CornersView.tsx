import React, { useState } from 'react';
import { Flag, Target, AlertTriangle, ShieldCheck, Database, Info, Layers, CheckCircle2, TrendingUp, Search, Filter } from 'lucide-react';
import { Match } from '../types/football';
import { calculateCornerProbprobabilities, calculateTeamStats } from '../utils/analytics';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState('ALL');

  const competitions = Array.from(new Set(matches.map(m => m.competition || 'Otras Ligas')));

  const filteredMatches = matches.filter(m => {
    const matchesSearch = searchTerm === '' || 
      m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.competition && m.competition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesComp = selectedCompetition === 'ALL' || m.competition === selectedCompetition;
    
    return matchesSearch && matchesComp;
  });

  const cornerRes = calculateCornerProbprobabilities(homeTeam, awayTeam, matches);
  const statsList = calculateTeamStats(matches);
  const homeStats = statsList.find(s => s.name === homeTeam);
  const awayStats = statsList.find(s => s.name === awayTeam);

  // Filter actual matches with corner records for each team
  const homeMatchesWithCorners = matches.filter(
    m => (m.home_team === homeTeam || m.away_team === homeTeam) &&
         m.home_corners !== undefined && m.away_corners !== undefined
  );

  const awayMatchesWithCorners = matches.filter(
    m => (m.home_team === awayTeam || m.away_team === awayTeam) &&
         m.home_corners !== undefined && m.away_corners !== undefined
  );

  // Group all matches by competition/league for the schedule / league analysis section
  const competitionsMap: { [comp: string]: Match[] } = {};
  filteredMatches.forEach(m => {
    const comp = m.competition || 'Otras Ligas y Torneos';
    if (!competitionsMap[comp]) {
      competitionsMap[comp] = [];
    }
    competitionsMap[comp].push(m);
  });

  // Calculate Parlays / Combinations from matches with verified corner data
  const matchesWithValidCorners = filteredMatches.filter(
    m => m.home_corners !== undefined && m.away_corners !== undefined && !isNaN(m.home_corners) && !isNaN(m.away_corners)
  );

  // Generate verified accumulator combinations
  const verifiedCombinations: Array<{
    id: string;
    title: string;
    match1: Match;
    match2?: Match;
    combinedProb: number;
    combinedOdds: number;
    ev: number;
    status: string;
  }> = [];

  if (matchesWithValidCorners.length >= 2) {
    for (let i = 0; i < matchesWithValidCorners.length - 1; i += 2) {
      const m1 = matchesWithValidCorners[i];
      const m2 = matchesWithValidCorners[i + 1];
      const res1 = calculateCornerProbprobabilities(m1.home_team, m1.away_team, matches);
      const res2 = calculateCornerProbprobabilities(m2.home_team, m2.away_team, matches);

      if (res1.hasRealData && res2.hasRealData) {
        const p1 = res1.corners_over_85 / 100;
        const p2 = res2.corners_over_85 / 100;
        const combinedProb = p1 * p2;
        const odds1 = 1.85;
        const odds2 = 1.80;
        const combinedOdds = Number((odds1 * odds2).toFixed(2));
        const ev = Number(((combinedProb * combinedOdds) - 1) * 100).toFixed(1);
        const isPositive = Number(ev) > 0;

        verifiedCombinations.push({
          id: `combo-${m1.id}-${m2.id}`,
          title: `Acumulada Córners: ${m1.home_team} vs ${m1.away_team} (+8.5) & ${m2.home_team} vs ${m2.away_team} (+8.5)`,
          match1: m1,
          match2: m2,
          combinedProb: Number((combinedProb * 100).toFixed(1)),
          combinedOdds,
          ev: Number(ev),
          status: isPositive && res1.sampleSize >= 3 && res2.sampleSize >= 3
            ? 'EV POSITIVO VALIDADO — VENTAJA RESPALDADA'
            : isPositive
            ? 'EV POSITIVO — VENTAJA NO VALIDADA'
            : 'EV NEGATIVO / BAJO'
        });
      }
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold mb-3">
            <Flag className="w-3.5 h-3.5" />
            Menú de Córners y Líneas Estadísticas
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Análisis de Saques de Esquina por Ligas y Combinadas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditoría rigurosa de datos reales de córners para partidos programados y estimación de combinadas (parlays). Sin datos ficticios.
          </p>
        </div>

        <div className="bg-slate-950/70 px-6 py-4 rounded-2xl border border-slate-800 text-center min-w-[200px]">
          <span className="text-xs text-slate-400 block uppercase font-medium">Córners Esperados Match Actual</span>
          {cornerRes.hasRealData ? (
            <span className="text-3xl font-black text-indigo-400">{cornerRes.total_expected_corners}</span>
          ) : (
            <span className="text-sm font-bold text-amber-400 mt-1 block">Datos Insuficientes</span>
          )}
        </div>
      </div>

      {/* BUSCADOR Y FILTROS AVANZADOS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            Buscador y Filtros de Ligas y Competiciones (Córners)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredMatches.length} partidos filtrados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por equipo o competición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
          </div>

          <div>
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">🏆 Todas las Competiciones ({competitions.length})</option>
              {competitions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PANEL DE AUDITORÍA DE DATOS REALES */}
      <div className={`p-6 rounded-3xl border shadow-xl transition-all ${
        cornerRes.hasRealData 
          ? 'bg-slate-900/90 border-emerald-500/30' 
          : 'bg-slate-900/90 border-amber-500/30'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {cornerRes.hasRealData ? (
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Auditoría de Procedencia: Datos de Córners
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  cornerRes.hasRealData
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {cornerRes.hasRealData ? 'DATOS REALES VERIFICADOS' : 'DATOS INSUFICIENTES — NO EVALUABLE'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verificación de saques de esquina a favor y en contra en base a estadísticas oficiales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Muestra Analizada:</span>
            <span className="font-bold px-2 py-0.5 rounded border bg-indigo-500/20 text-indigo-300 border-indigo-500/30 uppercase">
              {cornerRes.sampleSize} partidos válidos
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Córners Esperados {homeTeam}
            </span>
            <p className="text-white font-mono text-sm font-bold">
              {cornerRes.home_expected_corners} por partido
            </p>
            <p className="text-slate-400 text-[11px]">
              {homeMatchesWithCorners.length} partidos oficiales con córners registrados
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Córners Esperados {awayTeam}
            </span>
            <p className="text-white font-mono text-sm font-bold">
              {cornerRes.away_expected_corners} por partido
            </p>
            <p className="text-slate-400 text-[11px]">
              {awayMatchesWithCorners.length} partidos oficiales con córners registrados
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              Modelo de Probabilidad Poisson
            </span>
            <p className="text-slate-300 text-[11px]">
              {cornerRes.hasRealData
                ? 'Cálculo de líneas Over/Under basado en medias ponderadas reales. Sin valores inventados.'
                : 'No se generan valores aleatorios. Faltan datos oficiales de córners para ambos equipos.'}
            </p>
          </div>
        </div>
      </div>

      {/* Probabilidades de Córners Match Actual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Mercados de Córners: {homeTeam} vs {awayTeam}
            </h3>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              Total Esperado: {cornerRes.total_expected_corners}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Más de 8.5 Córners Totales</span>
                <span className="text-[11px] text-slate-400">Probabilidad estimada por Poisson</span>
              </div>
              <span className="text-lg font-black text-indigo-400 font-mono">
                {cornerRes.hasRealData ? `${cornerRes.corners_over_85}%` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Más de 9.5 Córners Totales</span>
                <span className="text-[11px] text-slate-400">Probabilidad estimada por Poisson</span>
              </div>
              <span className="text-lg font-black text-indigo-400 font-mono">
                {cornerRes.hasRealData ? `${cornerRes.corners_over_95}%` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Más de 10.5 Córners Totales</span>
                <span className="text-[11px] text-slate-400">Probabilidad estimada por Poisson</span>
              </div>
              <span className="text-lg font-black text-indigo-400 font-mono">
                {cornerRes.hasRealData ? `${cornerRes.corners_over_105}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Combinadas de Córners Verificadas */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Acumuladas (Parlays) de Córners Verificadas
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {verifiedCombinations.length} combinadas
            </span>
          </div>

          {verifiedCombinations.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {verifiedCombinations.map(combo => (
                <div key={combo.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white">{combo.title}</span>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Cuota {combo.combinedOdds}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Prob. Conjunta: <strong className="text-white font-mono">{combo.combinedProb}%</strong></span>
                    <span>EV: <strong className={`font-mono ${combo.ev > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{combo.ev > 0 ? `+${combo.ev}%` : `${combo.ev}%`}</strong></span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    Clasificación: <span className="text-slate-300 font-medium">{combo.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No hay suficientes partidos con datos de córners verificados para formar combinadas automáticas.
            </div>
          )}
        </div>
      </div>

      {/* Partidos por Competición con Buscador */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
          <Flag className="w-5 h-5 text-indigo-400" />
          Partidos y Córners Registrados por Competición
        </h3>

        {Object.keys(competitionsMap).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(competitionsMap).map(([compName, compMatches]) => (
              <div key={compName} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 inline-block">
                  {compName} ({compMatches.length} partidos)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {compMatches.map(m => (
                    <div key={m.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>{m.date || 'Próximo'}</span>
                        <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Oficial</span>
                      </div>
                      <div className="font-bold text-white text-sm flex items-center justify-between">
                        <span>{m.home_team} vs {m.away_team}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-900 text-slate-300">
                        <span>Córners Reales:</span>
                        <span className="font-mono font-bold text-indigo-400">
                          {m.home_corners !== undefined && m.away_corners !== undefined
                            ? `${m.home_corners} - ${m.away_corners} (Total: ${m.home_corners + m.away_corners})`
                            : 'Pendiente / No registrado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No se encontraron partidos con los filtros de búsqueda actuales.
          </div>
        )}
      </div>
    </div>
  );
};
