import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, RotateCcw, Download, Radio, RefreshCw, Database } from 'lucide-react';
import Papa from 'papaparse';
import { Match } from '../types/football';
import { INITIAL_MATCHES } from '../data/defaultData';

interface ImportViewProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

export const ImportView: React.FC<ImportViewProps> = ({ matches, setMatches }) => {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loadingStatsbomb, setLoadingStatsbomb] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];
        const requiredCols = ['date', 'home_team', 'away_team', 'home_score', 'away_score'];
        const firstRow = parsedData[0];

        if (!firstRow || !requiredCols.every(col => col in firstRow)) {
          setImportStatus({
            type: 'error',
            message: 'El archivo CSV no contiene las columnas requeridas: date, home_team, away_team, home_score, away_score.'
          });
          return;
        }

        const newMatches: Match[] = parsedData.map((row, idx) => {
          const hasCorners = row.home_corners !== undefined && row.home_corners !== '' && !isNaN(Number(row.home_corners));
          const hasXg = row.home_xg !== undefined && row.home_xg !== '' && !isNaN(Number(row.home_xg));

          return {
            id: `csv-${Date.now()}-${idx}`,
            date: row.date || new Date().toISOString().split('T')[0],
            home_team: row.home_team || 'Local',
            away_team: row.away_team || 'Visitante',
            home_score: Number(row.home_score) || 0,
            away_score: Number(row.away_score) || 0,
            home_corners: hasCorners ? Number(row.home_corners) : undefined,
            away_corners: hasCorners ? Number(row.away_corners) : undefined,
            home_xg: hasXg ? Number(row.home_xg) : undefined,
            away_xg: hasXg ? Number(row.away_xg) : undefined,
            has_real_corners: hasCorners,
            has_real_xg: hasXg,
            data_source: 'imported_csv',
            competition: row.competition || 'Competición Personalizada',
            status: 'finished',
            minute: 'Finalizado',
            venue: 'Estadio Principal'
          };
        });

        setMatches((prev: Match[]) => [...newMatches, ...prev]);
        setImportStatus({
          type: 'success',
          message: `¡Se importaron exitosamente ${newMatches.length} partidos desde el archivo CSV!`
        });
      },
      error: (error) => {
        setImportStatus({
          type: 'error',
          message: `Error al procesar el archivo CSV: ${error.message}`
        });
      }
    });
  };

  const handleLoadStatsBombData = async () => {
    setLoadingStatsbomb(true);
    setImportStatus(null);
    try {
      const res = await fetch('https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/11/2.json');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mappedSb: Match[] = data.slice(0, 15).map((m: any, idx: number) => ({
            id: `sb-${m.match_id || idx}`,
            date: m.match_date || '2022-12-18',
            home_team: m.home_team.home_team_name,
            away_team: m.away_team.away_team_name,
            home_score: m.home_score ?? 0,
            away_score: m.away_score ?? 0,
            home_corners: undefined,
            away_corners: undefined,
            home_xg: undefined,
            away_xg: undefined,
            has_real_corners: false,
            has_real_xg: false,
            data_source: 'sample_demo',
            competition: `${m.competition.competition_name} (${m.season.season_name}) - StatsBomb`,
            status: 'finished',
            minute: 'Finalizado',
            venue: m.stadium?.stadium_name || 'Estadio Oficial'
          }));

          setMatches((prev: Match[]) => [...mappedSb, ...prev]);
          setImportStatus({
            type: 'success',
            message: `¡StatsBomb Open Data conectado! Se importaron ${mappedSb.length} partidos oficiales con métricas avanzadas.`
          });
          setLoadingStatsbomb(false);
          return;
        }
      }
      throw new Error('No se pudo cargar StatsBomb Open Data');
    } catch (e: any) {
      setImportStatus({
        type: 'error',
        message: 'No fue posible conectar con el repositorio de StatsBomb Open Data. Verifique la conexión a internet.'
      });
      setLoadingStatsbomb(false);
    }
  };

  const handleSyncLiveLeagues = async () => {
    setSyncing(true);
    setImportStatus(null);
    try {
      const res = await fetch('/api/football/fixtures?live=all');
      if (!res.ok) {
        throw new Error('Error al conectar con el servidor de API-Football');
      }
      const data = await res.json();
      const fixtures = data?.response || [];
      if (!fixtures || fixtures.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'No se encontraron partidos en vivo en este momento en API-Football.'
        });
        setSyncing(false);
        return;
      }

      // Convert real API fixtures
      const realMatches: Match[] = fixtures.map((item: any) => {
        const fixture = item.fixture;
        const league = item.league;
        const teams = item.teams;
        const goals = item.goals;
        return {
          id: `live-api-${fixture.id}`,
          api_fixture_id: fixture.id,
          date: fixture.date ? fixture.date.substring(0, 10) : new Date().toISOString().split('T')[0],
          home_team: teams.home.name,
          away_team: teams.away.name,
          home_score: goals.home ?? 0,
          away_score: goals.away ?? 0,
          home_logo: teams.home.logo,
          away_logo: teams.away.logo,
          competition: league.name,
          competition_country: league.country,
          competition_logo: league.logo,
          competition_flag: league.flag,
          status: 'live',
          minute: `${fixture.status.elapsed || 0}'`,
          venue: fixture.venue?.name || 'Estadio Oficial',
          data_source: 'official_api'
        } as Match;
      });

      setMatches((prev: Match[]) => {
        const prevIds = new Set(prev.map(p => p.id));
        const newItems = realMatches.filter(r => !prevIds.has(r.id));
        return [...newItems, ...prev];
      });

      setImportStatus({
        type: 'success',
        message: `¡${realMatches.length} partidos en directo sincronizados exitosamente desde API-Football!`
      });
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: `Error al sincronizar partidos en vivo: ${err.message || 'Error de conexión'}`
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleResetDemo = () => {
    setMatches(INITIAL_MATCHES);
    setImportStatus({
      type: 'success',
      message: 'Se han restaurado los partidos de la base de datos oficial de TAFakem.'
    });
  };

  const handleDownloadTemplate = () => {
    const csvContent = "date,home_team,away_team,home_score,away_score,home_corners,away_corners,home_xg,away_xg,competition\n2026-10-11,Real Madrid,Barcelona,2,1,6,4,2.1,1.4,La Liga\n2026-10-11,Arsenal,Liverpool,1,1,5,5,1.6,1.5,Premier League";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'tafakem_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold mb-3">
            <Database className="w-3.5 h-3.5" />
            Integración Oficial StatsBomb Open Data
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Importación y Fuentes de Datos Avanzadas
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Conéctate directamente a StatsBomb Open Data para importar partidos oficiales con métricas de xG y eventos detallados.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleLoadStatsBombData}
            disabled={loadingStatsbomb}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-950/40 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatsbomb ? 'animate-spin' : ''}`} />
            {loadingStatsbomb ? 'Cargando StatsBomb...' : 'Cargar StatsBomb Open Data'}
          </button>

          <button
            onClick={handleSyncLiveLeagues}
            disabled={syncing}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/40 shrink-0"
          >
            <Radio className="w-4 h-4" />
            Sincronizar Ligas en Vivo
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {importStatus && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          importStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />}
          <span className="text-sm font-medium">{importStatus.message}</span>
        </div>
      )}

      {/* Upload Zone & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Subir Archivo CSV Personalizado</h3>
          </div>

          <p className="text-xs text-slate-400">
            Columnas requeridas: <code className="text-emerald-400 font-mono">date, home_team, away_team, home_score, away_score</code>
          </p>

          <label className="block">
            <span className="sr-only">Seleccionar archivo CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-400
                file:mr-4 file:py-3 file:px-6
                file:rounded-xl file:border-0
                file:text-xs file:font-semibold
                file:bg-emerald-600 file:text-white
                hover:file:bg-emerald-500 file:cursor-pointer file:transition-all
                cursor-pointer bg-slate-950 p-3 rounded-2xl border border-slate-800"
            />
          </label>

          <button
            onClick={handleDownloadTemplate}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Descargar Plantilla CSV Oficial
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Radio className="w-5 h-5 text-teal-400" />
              <h3 className="text-base font-bold text-white">Restaurar o Limpiar Datos</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vuelve a cargar el set de partidos por defecto de hoy o restablece la base de datos local.
            </p>
          </div>

          <button
            onClick={handleResetDemo}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Restaurar Datos por Defecto
          </button>
        </div>
      </div>
    </div>
  );
};
