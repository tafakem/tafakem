import React, { useState } from 'react';
import { Target, TrendingUp, Sparkles, Shield, BarChart2, AlertTriangle, Search, Filter, CheckCircle2 } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState('ALL');
  const [activeHomeTeam, setActiveHomeTeam] = useState(homeTeam);
  const [activeAwayTeam, setActiveAwayTeam] = useState(awayTeam);

  // Extract unique competitions
  const competitions = Array.from(new Set(matches.map(m => m.competition || 'Otras Ligas')));

  // Filter matches based on search & filters
  const filteredMatches = matches.filter(m => {
    const matchesSearch = searchTerm === '' || 
      m.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.competition && m.competition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesComp = selectedCompetition === 'ALL' || m.competition === selectedCompetition;
    
    return matchesSearch && matchesComp;
  });

  const statsList = calculateTeamStats(matches);
  const homeStats = statsList.find(s => s.name === activeHomeTeam);
  const awayStats = statsList.find(s => s.name === activeAwayTeam);

  const homeXgMatches = homeStats?.xg_matches_count || 0;
  const awayXgMatches = awayStats?.xg_matches_count || 0;
  const hasRealXg = homeXgMatches > 0 && awayXgMatches > 0;

  // Filter only teams that have actual recorded xG > 0 for the chart
  const teamsWithXg = statsList.filter(s => {
    const matchesSearch = searchTerm === '' || s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return (s.xg_matches_count || 0) > 0 && matchesSearch;
  });

  const chartData = (teamsWithXg.length > 0 ? teamsWithXg : statsList)
    .slice(0, 8)
    .map(s => ({
      team: s.name.length > 10 ? s.name.substring(0, 10) + '...' : s.name,
      'Goles Anotados': s.goals_scored,
      'xG Acumulado': Number((s.xg_for || 0).toFixed(1))
    }));

  const calcEfficiency = (stats?: TeamStats) => {
    if (!stats || !stats.xg_matches_count || stats.xg_for === 0) {
      return { ratio: null, label: 'Sin registros xG suficientes', color: 'text-slate-400' };
    }
    const ratio = stats.goals_scored / stats.xg_for;
    if (ratio > 1.15) {
      return { 
        ratio: ratio.toFixed(2), 
        label: `Sobrerendimiento (+${((ratio - 1) * 100).toFixed(0)}% sobre xG)`, 
        color: 'text-emerald-400' 
      };
    } else if (ratio < 0.85) {
      return { 
        ratio: ratio.toFixed(2), 
        label: `Subrendimiento (-${((1 - ratio) * 100).toFixed(0)}% sobre xG)`, 
        color: 'text-rose-400' 
      };
    }
    return { 
      ratio: ratio.toFixed(2), 
      label: 'Alineado con el modelo xG esperado', 
      color: 'text-teal-400' 
    };
  };

  const homeEfficiency = calcEfficiency(homeStats);
  const awayEfficiency = calcEfficiency(awayStats);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Goles Esperados (xG) y Eficiencia</h2>
            <p className="text-xs text-slate-400">Analizando: <strong className="text-emerald-400">{activeHomeTeam}</strong> vs <strong className="text-teal-400">{activeAwayTeam}</strong></p>
          </div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 font-mono">
          Equipos con xG oficial: <span className="text-amber-400 font-bold">{teamsWithXg.length}/{statsList.length}</span>
        </div>
      </div>

      {/* SEARCH & SELECTABLE MATCHES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            Buscador y Selección de Partidos (Haz clic para analizar)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredMatches.length} partidos encontrados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar equipo o competición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <div>
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">🏆 Todas las Competiciones ({competitions.length})</option>
              {competitions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selectable Matches List from Search */}
        {filteredMatches.length > 0 ? (
          <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
            <span className="text-[11px] text-slate-400 block font-medium">Selecciona un partido para ver su análisis xG:</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredMatches.map(m => {
                const isSelected = m.home_team === activeHomeTeam && m.away_team === activeAwayTeam;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveHomeTeam(m.home_team);
                      setActiveAwayTeam(m.away_team);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                      isSelected 
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{m.home_team}</span>
                        <span className="text-slate-500 font-normal">vs</span>
                        <span>{m.away_team}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{m.competition || 'Competición'} {m.date ? `• ${m.date}` : ''}</span>
                    </div>
                    {isSelected ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Analizando
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 underline">Seleccionar</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-slate-500 text-xs">
            No se encontraron partidos para los filtros seleccionados.
          </div>
        )}
      </div>

      {/* Comparison Cards for Active Teams */}
      {hasRealXg ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                {activeHomeTeam}
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                {homeXgMatches} Partidos xG
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">xG Total a Favor</span>
                <span className="text-xl font-black text-white mt-1 block font-mono">
                  {homeStats ? homeStats.xg_for.toFixed(2) : '0.00'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Promedio: {homeXgMatches > 0 ? (homeStats!.xg_for / homeXgMatches).toFixed(2) : '0'}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">xG En Contra</span>
                <span className="text-xl font-black text-rose-400 mt-1 block font-mono">
                  {homeStats ? homeStats.xg_against.toFixed(2) : '0.00'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Promedio: {homeXgMatches > 0 ? (homeStats!.xg_against / homeXgMatches).toFixed(2) : '0'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-white">Eficiencia Ofensiva (Goles / xG):</strong>
                <span className={`font-mono font-bold ${homeEfficiency.color}`}>
                  {homeEfficiency.ratio ? `${homeEfficiency.ratio}x` : 'N/A'}
                </span>
              </div>
              <p className={homeEfficiency.color}>{homeEfficiency.label}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                {activeAwayTeam}
              </h3>
              <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-lg border border-teal-500/20">
                {awayXgMatches} Partidos xG
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">xG Total a Favor</span>
                <span className="text-xl font-black text-white mt-1 block font-mono">
                  {awayStats ? awayStats.xg_for.toFixed(2) : '0.00'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Promedio: {awayXgMatches > 0 ? (awayStats!.xg_for / awayXgMatches).toFixed(2) : '0'}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">xG En Contra</span>
                <span className="text-xl font-black text-rose-400 mt-1 block font-mono">
                  {awayStats ? awayStats.xg_against.toFixed(2) : '0.00'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Promedio: {awayXgMatches > 0 ? (awayStats!.xg_against / awayXgMatches).toFixed(2) : '0'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-white">Eficiencia Ofensiva (Goles / xG):</strong>
                <span className={`font-mono font-bold ${awayEfficiency.color}`}>
                  {awayEfficiency.ratio ? `${awayEfficiency.ratio}x` : 'N/A'}
                </span>
              </div>
              <p className={awayEfficiency.color}>{awayEfficiency.label}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">Sin Muestra xG para este encuentro</h4>
          <p className="text-xs text-slate-400">
            {activeHomeTeam} o {activeAwayTeam} no disponen de registros oficiales de goles esperados. Selecciona otro partido del buscador superior.
          </p>
        </div>
      )}

      {/* xG Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Comparativa xG vs Goles Reales por Equipo
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {teamsWithXg.length} equipos con xG
          </span>
        </div>

        {teamsWithXg.length > 0 ? (
          <div className="w-full h-72 pt-2">
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
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            Gráfico no disponible. Sin métricas de xG oficiales en la base de datos actual.
          </div>
        )}
      </div>
    </div>
  );
};
