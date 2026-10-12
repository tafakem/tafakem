import React from 'react';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  activeSection: string;
  homeTeam: string;
  awayTeam: string;
  setHomeTeam: (team: string) => void;
  setAwayTeam: (team: string) => void;
  teams: string[];
  setActiveSection: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  homeTeam,
  awayTeam,
  setHomeTeam,
  setAwayTeam,
  teams,
  setActiveSection
}) => {
  const getSectionTitle = (id: string) => {
    switch (id) {
      case 'inicio': return 'Panel de Control General';
      case 'hoy': return 'Partidos de Hoy (Zona America/Lima)';
      case 'en-vivo': return 'Marcadores en Vivo (Endpoint live=all)';
      case 'clasificaciones': return 'Competiciones y Clasificaciones Oficiales';
      case 'mejores-probabilidades': return 'Mejores Probabilidades y Value Bets';
      case 'analisis': return 'Análisis Táctico y Estadístico de Partidos';
      case 'probabilidades': return 'Modelo Poisson de Probabilidades y Goles';
      case 'goles': return 'Goles Esperados (xG) y Eficiencia';
      case 'corners': return 'Análisis de Córners y Líneas Estadísticas';
      case 'equipos': return 'Clasificación y Estadísticas por Equipo';
      case 'importar': return 'Importación de Datos y Ligas en Vivo';
      case 'configuracion': return 'Configuración de la Aplicación y Base de Datos';
      default: return 'Tafakem Football Analytics';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md bg-slate-900/95">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          {getSectionTitle(activeSection)}
        </h2>
        <p className="text-xs text-slate-400">
          Motor de probabilidad estadística y modelos de Poisson para fútbol profesional
        </p>
      </div>

      {/* Quick Match Selection Bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800 w-full sm:w-auto">
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <span className="text-[11px] font-medium text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 hidden sm:inline">
            Partido:
          </span>
          <select
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 max-w-[120px] sm:max-w-none"
          >
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="text-slate-500 font-bold text-xs">VS</span>
          <select
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 max-w-[120px] sm:max-w-none"
          >
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setActiveSection('probabilidades')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-900/40 shrink-0 ml-auto sm:ml-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Analizar
        </button>
      </div>
    </header>
  );
};
