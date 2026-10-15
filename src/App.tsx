import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { TodayMatchesView } from './components/TodayMatchesView';
import { LiveMatchesView } from './components/LiveMatchesView';
import { CompetitionsStandingsView } from './components/CompetitionsStandingsView';
import { BestBetsView } from './components/BestBetsView';
import { MatchAnalysisView } from './components/MatchAnalysisView';
import { ProbabilitiesView } from './components/ProbabilitiesView';
import { XgView } from './components/XgView';
import { CornersView } from './components/CornersView';
import { CombinadasView } from './components/CombinadasView';
import { TeamsView } from './components/TeamsView';
import { ImportView } from './components/ImportView';
import { SettingsView } from './components/SettingsView';
import { PredictionsAuditView } from './components/PredictionsAuditView';
import { PopularCompetitionsView } from './components/PopularCompetitionsView';
import { Match } from './types/football';
import { INITIAL_MATCHES } from './data/defaultData';
import { calculateTeamStats } from './utils/analytics';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('hoy');
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('tafakem_matches_lima_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(m => m.competition_logo)) {
          return parsed;
        }
      } catch (e) {
        return INITIAL_MATCHES;
      }
    }
    return INITIAL_MATCHES;
  });

  useEffect(() => {
    localStorage.setItem('tafakem_matches_lima_v2', JSON.stringify(matches));
  }, [matches]);

  // Extract unique teams
  const teamStats = calculateTeamStats(matches);
  const teams = teamStats.map(t => t.name);
  const defaultHome = teams.length > 0 ? teams[0] : 'Real Madrid';
  const defaultAway = teams.length > 1 ? teams[1] : 'Barcelona';

  const [homeTeam, setHomeTeam] = useState<string>(defaultHome);
  const [awayTeam, setAwayTeam] = useState<string>(defaultAway);

  // Ensure selected teams exist in list
  useEffect(() => {
    if (teams.length > 0) {
      if (!teams.includes(homeTeam)) setHomeTeam(teams[0]);
      if (!teams.includes(awayTeam) && teams.length > 1) setAwayTeam(teams[1]);
    }
  }, [teams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans antialiased overflow-x-hidden">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        matchesCount={matches.length}
        teamsCount={teamStats.length}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeSection={activeSection}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          setHomeTeam={setHomeTeam}
          setAwayTeam={setAwayTeam}
          teams={teams}
          setActiveSection={setActiveSection}
        />

        <main className="flex-1 overflow-y-auto">
          {activeSection === 'inicio' && (
            <HomeView
              matches={matches}
              teamStats={teamStats}
              setActiveSection={setActiveSection}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              setHomeTeam={setHomeTeam}
              setAwayTeam={setAwayTeam}
            />
          )}
          {activeSection === 'hoy' && (
            <TodayMatchesView
              setActiveSection={setActiveSection}
              setHomeTeam={setHomeTeam}
              setAwayTeam={setAwayTeam}
              matches={matches}
              setMatches={setMatches}
            />
          )}
          {activeSection === 'top-ligas' && (
            <PopularCompetitionsView
              matches={matches}
              setActiveSection={setActiveSection}
              setHomeTeam={setHomeTeam}
              setAwayTeam={setAwayTeam}
            />
          )}
          {activeSection === 'en-vivo' && (
            <LiveMatchesView
              matches={matches}
              setMatches={setMatches}
              setActiveSection={setActiveSection}
              setHomeTeam={setHomeTeam}
              setAwayTeam={setAwayTeam}
            />
          )}
          {activeSection === 'clasificaciones' && (
            <CompetitionsStandingsView />
          )}
          {activeSection === 'mejores-probabilidades' && (
            <BestBetsView
              matches={matches}
              setActiveSection={setActiveSection}
              setHomeTeam={setHomeTeam}
              setAwayTeam={setAwayTeam}
            />
          )}
          {activeSection === 'analisis' && (
            <MatchAnalysisView
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              setHomeTeam={setHomeTeam}
              setAwayTeam={setAwayTeam}
              teams={teams}
              matches={matches}
            />
          )}
          {activeSection === 'probabilidades' && (
            <ProbabilitiesView
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              setHomeTeam={setHomeTeam}
              setAwayTeam={setAwayTeam}
              matches={matches}
            />
          )}
          {activeSection === 'goles' && (
            <XgView
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              matches={matches}
            />
          )}
          {activeSection === 'corners' && (
            <CornersView
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              matches={matches}
            />
          )}
          {activeSection === 'combinadas' && (
            <CombinadasView
              matches={matches}
            />
          )}
          {activeSection === 'predicciones' && (
            <PredictionsAuditView
              matches={matches}
            />
          )}
          {activeSection === 'equipos' && (
            <TeamsView
              matches={matches}
            />
          )}
          {activeSection === 'importar' && (
            <ImportView
              matches={matches}
              setMatches={setMatches}
            />
          )}
          {activeSection === 'configuracion' && (
            <SettingsView
              matches={matches}
              setMatches={setMatches}
            />
          )}
        </main>
      </div>
    </div>
  );
}
