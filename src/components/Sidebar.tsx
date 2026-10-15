import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  PieChart, 
  Target, 
  Flag, 
  Shield, 
  UploadCloud, 
  Settings, 
  Activity, 
  Trophy,
  Radio,
  Calendar,
  Menu,
  X,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  matchesCount: number;
  teamsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection,
  matchesCount,
  teamsCount
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { id: 'hoy', label: 'Partidos de Hoy', icon: Calendar },
    { id: 'en-vivo', label: 'Marcadores en Vivo', icon: Radio },
    { id: 'clasificaciones', label: 'Competiciones y Tablas', icon: Trophy },
    { id: 'mejores-probabilidades', label: 'Mejores Probabilidades', icon: Target },
    { id: 'analisis', label: 'Análisis de Partidos', icon: Search },
    { id: 'probabilidades', label: 'Modelo Poisson', icon: PieChart },
    { id: 'goles', label: 'Goles Esperados (xG)', icon: Target },
    { id: 'corners', label: 'Córners', icon: Flag },
    { id: 'combinadas', label: 'Combinadas', icon: Layers },
    { id: 'predicciones', label: 'Predicciones y Auditoría', icon: CheckCircle2 },
    { id: 'equipos', label: 'Equipos y Estadísticas', icon: Shield },
    { id: 'importar', label: 'Importar CSV', icon: UploadCloud },
    { id: 'configuracion', label: 'Configuración', icon: Settings }
  ];

  const handleSelect = (id: string) => {
    setActiveSection(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-lg">
            TA
          </div>
          <span className="font-bold text-white text-base">Tafakem Analytics</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-300 hover:text-white p-2 rounded-lg bg-slate-800"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 h-screen z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-100 select-none shrink-0 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-slate-950 font-black text-xl">
              TA
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white flex items-center gap-1.5">
                Tafakem
                <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold tracking-normal border border-emerald-500/30">PRO</span>
              </h1>
              <p className="text-xs text-slate-400">Football Analytics</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileOpen(false)} 
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] uppercase font-semibold text-slate-500 px-3 pb-2 tracking-wider">
            Módulos Principales
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Database Status Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Zona Horaria:
              </span>
              <span className="text-emerald-400 font-semibold">America/Lima</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Partidos analizados:</span>
              <span className="font-mono font-bold text-white">{matchesCount}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Equipos registrados:</span>
              <span className="font-mono font-bold text-white">{teamsCount}</span>
            </div>
          </div>
          <div className="mt-3 text-center text-[10px] text-slate-500">
            Tafakem Analytics &bull; v2.8 Standings
          </div>
        </div>
      </aside>
    </>
  );
};
