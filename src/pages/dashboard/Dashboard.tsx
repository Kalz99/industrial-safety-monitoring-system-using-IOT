import React, { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { KpiRibbon } from './components/KpiRibbon';
import { AreaCard } from './components/AreaCard';
import { useDashboardData } from '../../hooks/useDashboardData';

interface DashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExploreArea?: (areaId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab, setActiveTab, onExploreArea }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Call the live IOT sensor streaming hook
  const { areasData, kpiStats } = useDashboardData();

  const handleExploreArea = (areaId: string) => {
    if (onExploreArea) {
      onExploreArea(areaId);
    } else {
      alert(`Opening modern telemetry workspace for: ${areaId}`);
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'dark bg-[#090d16]' : 'bg-[#f1f5f9]'} text-slate-850 dark:text-slate-100 flex min-h-screen font-sans antialiased overflow-hidden w-full transition-colors duration-500`}>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={kpiStats.activeAlerts}
        username="Alex Carter"
        onLogout={() => alert("Securely logging out...")}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto max-h-screen">
        {/* Topbar Header */}
        <Topbar 
          activeTab={activeTab}
          theme={theme}
          setTheme={setTheme}
        />

        {/* Dynamic Page Container */}
        <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-1">
          {/* Plant Summary Ribbons */}
          <KpiRibbon stats={kpiStats} />

          {/* Area Telemetry Grid Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pl-1">
              <h2 className="text-md font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                Sectors
              </h2>
              <span className="text-[11px] font-medium text-blue-600 bg-blue-600/5 px-2.5 py-1 rounded-xl animate-pulse">
                Live Data Stream
              </span>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
              {areasData.map((area) => (
                <AreaCard
                  key={area.id}
                  area={area}
                  onExplore={handleExploreArea}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
