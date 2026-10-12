import React, { useState } from 'react';
import { Shield, Swords, TrendingUp, Award, BarChart3, ChevronRight, Search, Calendar } from 'lucide-react';
import { Match, TeamStats } from '../types/football';
import { calculateTeamStats } from '../utils/analytics';

interface MatchAnalysisViewProps {
  homeTeam: string;
  awayTeam: string;
  setHomeTeam: (team: string) => void;
  setAwayTeam: (team: string) => void;
  teams: string[];
  matches: Match[];
}

export const MatchAnalysisView: React.FC<MatchAnalysisViewProps> = ({
  homeTeam,
  awayTeam,
  setHomeTeam,
  setAwayTeam,
  teams,
  matches
}) => {
  const [matchSearch, setMatchSearch] = useState('');

  const statsList = calculateTeamStats(matches);
  const homeStats = statsList.find(s => s.name === homeTeam) || {
    name: homeTeam, matches_played: 0, wins: 0, draws: 0, losses: 0, goals_scored: 0, goals_conceded: 0,
    home_matches: 0, home_wins: 0, home_draws: 0, home_losses: 0, home_goals_scored: 0, home_goals_conceded: 0,
    away_matches: 0, away_wins: 0, away_draws: 0, away_losses: 0, away_goals_scored: 0, away_goals_conceded: 0,
    corners_for: 0, corners_against: 0, xg_for: 0, xg_against: 0, form: []
  };

  const awayStats = statsList.find(s => s.name === awayTeam) || {
    name: awayTeam, matches_played: 0, wins: 0, draws: 0, losses: 0, goals_scored: 0, goals_conceded: 0,
    home_matches: 0, home_wins: 0, home_draws: 0, home_losses: 0, home_goals_scored: 0, home_goals_conceded: 0,
    away_matches: 0, away_wins: 0, away_draws: 0, away_losses: 0, away_goals_scored: 0, away_goals_conceded: 0,
    corners_for: 0, corners_against: 0, xg_for: 0, xg_against: 0, form: []
  };

  // Filter upcoming or live matches from API / matches pool
  const upcomingMatches = matches.filter(m => m.status === 'upcoming' || m.status === 'live' || !m.status);
  const filteredUpcoming = upcomingMatches.filter(m => 
    m.home_team.toLowerCase().includes(matchSearch.toLowerCase()) ||
    m.away_team.toLowerCase().includes(matchSearch.toLowerCase()) ||
    (m.competition && m.competition.toLowerCase().includes(matchSearch.toLowerCase()))
  );

  // Head to head matches
  const h2hMatches = matches.filter(
    m => (m.home_team === homeTeam && m.away_team === awayTeam) ||
         (m.home_team === awayTeam && m.away_team === homeTeam)
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Upcoming Match Selector & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Selector de Próximos Encuentros (API)</h3>
            <p className="text-xs text-slate-400">Selecciona o busca un partido programado para cargar automáticamente ambos equipos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por equipo o liga..."
              value={matchSearch}
              onChange={(e) => setMatchSearch(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const [h, a] = val.split('|');
                if (h && a) {
                  setHomeTeam(h);
                  setAwayTeam(a);
                }
              }
            }}
            className="bg-slate-950 text-white text-xs font-semibold px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            defaultValue=""
          >
            <option value="" disabled>-- Seleccionar encuentro de la lista --</option>
            {filteredUpcoming.map((m, idx) => (
              <option key={idx} value={`${m.home_team}|${m.away_team}`}>
                {m.home_team} vs {m.away_team} ({m.competition || 'Liga'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selector Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full md:w-5/12 space-y-2">
          <label className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Equipo Local</label>
          <select
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            className="w-full bg-slate-950 text-white font-semibold p-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm"
          >
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-slate-400 shrink-0">
          VS
        </div>

        <div className="w-full md:w-5/12 space-y-2">
          <label className="text-xs uppercase font-bold text-teal-400 tracking-wider">Equipo Visitante</label>
          <select
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            className="w-full bg-slate-950 text-white font-semibold p-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500 text-xs sm:text-sm"
          >
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Form & Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Home Team Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                {homeTeam}
              </h3>
              <p className="text-xs text-slate-400">Estadísticas como Local</p>
            </div>
            <div className="flex gap-1.5">
              {homeStats.form.map((f, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                    f === 'W' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    f === 'D' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Partidos Local</span>
              <span className="text-xl font-bold text-white mt-1 block">{homeStats.home_matches}</span>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Goles Favor</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{homeStats.home_goals_scored}</span>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Goles Contra</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">{homeStats.home_goals_conceded}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Victorias Local: <strong className="text-white">{homeStats.home_wins}</strong></span>
              <span>Empates Local: <strong className="text-white">{homeStats.home_draws}</strong></span>
              <span>Derrotas Local: <strong className="text-white">{homeStats.home_losses}</strong></span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${homeStats.home_matches ? (homeStats.home_wins / homeStats.home_matches) * 100 : 0}%` }}
                className="bg-emerald-500 h-full"
                title="Victorias"
              ></div>
              <div 
                style={{ width: `${homeStats.home_matches ? (homeStats.home_draws / homeStats.home_matches) * 100 : 0}%` }}
                className="bg-amber-500 h-full"
                title="Empates"
              ></div>
              <div 
                style={{ width: `${homeStats.home_matches ? (homeStats.home_losses / homeStats.home_matches) * 100 : 0}%` }}
                className="bg-rose-500 h-full"
                title="Derrotas"
              ></div>
            </div>
          </div>
        </div>

        {/* Away Team Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                {awayTeam}
              </h3>
              <p className="text-xs text-slate-400">Estadísticas como Visitante</p>
            </div>
            <div className="flex gap-1.5">
              {awayStats.form.map((f, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                    f === 'W' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    f === 'D' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Partidos Visitante</span>
              <span className="text-xl font-bold text-white mt-1 block">{awayStats.away_matches}</span>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Goles Favor</span>
              <span className="text-xl font-bold text-teal-400 mt-1 block">{awayStats.away_goals_scored}</span>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Goles Contra</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">{awayStats.away_goals_conceded}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Victorias Vis.: <strong className="text-white">{awayStats.away_wins}</strong></span>
              <span>Empates Vis.: <strong className="text-white">{awayStats.away_draws}</strong></span>
              <span>Derrotas Vis.: <strong className="text-white">{awayStats.away_losses}</strong></span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${awayStats.away_matches ? (awayStats.away_wins / awayStats.away_matches) * 100 : 0}%` }}
                className="bg-emerald-500 h-full"
                title="Victorias"
              ></div>
              <div 
                style={{ width: `${awayStats.away_matches ? (awayStats.away_draws / awayStats.away_matches) * 100 : 0}%` }}
                className="bg-amber-500 h-full"
                title="Empates"
              ></div>
              <div 
                style={{ width: `${awayStats.away_matches ? (awayStats.away_losses / awayStats.away_matches) * 100 : 0}%` }}
                className="bg-rose-500 h-full"
                title="Derrotas"
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Head to Head History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
          <Swords className="w-5 h-5 text-emerald-400" />
          Historial Directo (Head-to-Head) entre {homeTeam} y {awayTeam}
        </h3>

        {h2hMatches.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No se encontraron enfrentamientos directos registrados en la base de datos actual para estos dos equipos.
          </div>
        ) : (
          <div className="space-y-3">
            {h2hMatches.map(m => (
              <div key={m.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 px-2 py-1 bg-slate-900 rounded border border-slate-800">
                    {m.date}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">{m.competition || 'Partido oficial'}</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-white">
                  <span className={m.home_team === homeTeam ? 'text-white' : 'text-slate-400'}>{m.home_team}</span>
                  <span className="bg-slate-900 px-3 py-1 rounded font-mono text-emerald-400 border border-slate-800">
                    {m.home_score} - {m.away_score}
                  </span>
                  <span className={m.away_team === awayTeam ? 'text-white' : 'text-slate-400'}>{m.away_team}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
