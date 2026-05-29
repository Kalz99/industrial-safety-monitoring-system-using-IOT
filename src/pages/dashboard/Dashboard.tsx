import React, { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { AreaCard } from './components/AreaCard';

import { useDashboardData } from '../../hooks/useDashboardData';

interface DashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExploreArea?: (areaId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab, setActiveTab, onExploreArea }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  
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

        {permissionStatus === 'default' && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-[24px] gap-4 shadow-sm animate-pulse transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold select-none text-lg">
                🔔
              </span>
              <div className="flex flex-col gap-0.5 text-left">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Enable Desktop Safety Alerts
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stay updated on critical sensor anomalies in real-time, even when this tab is minimized or closed.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const { PushNotificationService } = await import('../../services/pushNotification');
                await PushNotificationService.requestPermissionAndGetToken();
                if (typeof Notification !== 'undefined') {
                  setPermissionStatus(Notification.permission);
                }
              }}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-550 text-white rounded-2xl text-xs font-semibold shadow-md cursor-pointer transition-colors duration-300 whitespace-nowrap"
            >
              Enable Notifications
            </button>
          </div>
        )}

        {/* Dynamic Page Container */}
        <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-1">


          {/* Area Telemetry Grid Section */}
          <div className="flex flex-col gap-4">
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
