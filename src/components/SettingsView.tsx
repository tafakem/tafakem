import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, Trash2, RotateCcw, Key, CheckCircle2, Radio } from 'lucide-react';
import { Match } from '../types/football';
import { INITIAL_MATCHES } from '../data/defaultData';

interface SettingsViewProps {
  matches: Match[];
  setMatches: (matches: Match[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ matches, setMatches }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('tafakem_football_api_key') || '');
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('tafakem_football_api_url') || 'https://raw.githubusercontent.com/openfootball/football.json/master');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('tafakem_football_api_key', apiKey);
    localStorage.setItem('tafakem_football_api_url', apiEndpoint);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleClearData = () => {
    if (window.confirm('¿Estás seguro de eliminar todos los partidos de la base de datos?')) {
      setMatches([]);
    }
  };

  const handleResetData = () => {
    if (window.confirm('¿Restaurar los datos de demostración originales de hoy?')) {
      setMatches(INITIAL_MATCHES);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Settings className="w-3.5 h-3.5" />
            Configuración de API y Sistema
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Configurar API de Fútbol y Base de Datos
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Configura las fuentes de datos gratuitas y endpoints externos para la sincronización de partidos en vivo.
          </p>
        </div>
      </div>

      {/* Football API Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            Configuración del Proveedor de API de Fútbol
          </h3>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            Gratuito & Abierto
          </span>
        </div>

        {savedMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ¡Configuración de API guardada correctamente!
          </div>
        )}

        <form onSubmit={handleSaveApiConfig} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Endpoint / URL Base de la API de Fútbol</label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.football-data.org/v4 o similar"
              className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">Por defecto utiliza los feeds públicos y abiertos de OpenFootball sin coste alguno.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">API Key (Opcional si usas API de pago externa)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Introduce tu clave API (opcional para servicios gratuitos)"
              className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-emerald-900/40 flex items-center gap-2"
          >
            Guardar Configuración de API
          </button>
        </form>
      </div>

      {/* Database Management Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
          <Database className="w-5 h-5 text-emerald-400" />
          Gestión de Almacenamiento Local (SQLite State)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white">Restaurar Datos de Hoy</h4>
            <p className="text-xs text-slate-400">
              Vuelve a cargar el set completo de partidos de hoy (11 de octubre) y las principales ligas europeas.
            </p>
            <button
              onClick={handleResetData}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Datos por Defecto
            </button>
          </div>

          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white">Vaciar Base de Datos</h4>
            <p className="text-xs text-slate-400">
              Elimina todos los registros de partidos almacenados actualmente en la sesión.
            </p>
            <button
              onClick={handleClearData}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Todos los Registros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
