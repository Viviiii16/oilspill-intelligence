import React from 'react';
import { InvestigationProvider, useInvestigation } from './context/InvestigationContext';
import { AppHeader } from './components/common/AppHeader';
import { LandingPage } from './pages/LandingPage';
import { DetectionPage } from './pages/DetectionPage';
import { Workspace } from './pages/Workspace';
import { ReportPage } from './pages/ReportPage';
import { DemoModeModal } from './components/modals/DemoModeModal';
import { RouteLoadingOverlay } from './components/common/RouteLoadingOverlay';

const MainApp: React.FC = () => {
  const { currentRoute } = useInvestigation();

  return (
    <div className="w-full h-screen flex flex-col bg-[#F4F6F8] text-[#1E293B] overflow-hidden font-sans select-none">
      {/* Persistent Minimal Header */}
      <AppHeader />

      {/* Main View Router */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentRoute === 'landing' && <LandingPage />}
        {currentRoute === 'detection' && <DetectionPage />}
        {currentRoute === 'investigation' && <Workspace />}
        {currentRoute === 'report' && <ReportPage />}
      </main>

      {/* Global Modals & Route Loading */}
      <RouteLoadingOverlay />
      <DemoModeModal />
    </div>
  );
};

export default function App() {
  return (
    <InvestigationProvider>
      <MainApp />
    </InvestigationProvider>
  );
}
