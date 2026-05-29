import React, { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { MetricCard } from '../../components/MetricCard';
import { Badge } from '../../components/Badge';
import { useAlertLogs } from '../../hooks/useAlertLogs';
import { useAreas } from '../../hooks/useAreas';
import { useStore } from '../../hooks/useStore';
import { 
  BellRing, 
  Flame, 
  Wind, 
  Activity, 
  Zap, 
  Thermometer, 
  SlidersHorizontal,
  Building,
  Settings
} from 'lucide-react';


interface AlertLogsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AlertLogs: React.FC<AlertLogsProps> = ({ activeTab, setActiveTab }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { areasList } = useAreas();

  const {
    alerts,
    stats,
    filterArea,
    setFilterArea
  } = useAlertLogs();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'flame':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'smoke':
        return <Wind className="w-4 h-4 text-orange-500" />;
      case 'vibration':
        return <Activity className="w-4 h-4 text-red-500" />;
      case 'current':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      default:
        return <Thermometer className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'dark bg-[#090d16]' : 'bg-[#f1f5f9]'} text-slate-850 dark:text-slate-100 flex min-h-screen font-sans antialiased overflow-hidden w-full transition-colors duration-500`}>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={stats.totalCount}
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
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full mr-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Alert Logs
              </h1>
            </div>

            {/* Right section: Area selector dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/30 rounded-2xl p-1.5 shadow-inner">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">
                  Select Sector
                </span>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl px-3 py-1 border border-slate-100 dark:border-slate-800/40 outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <option value="all">All Sectors</option>
                  {areasList.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Topbar>

        {/* Dynamic Page Container */}
        <div className="flex-1 flex flex-col gap-6 pr-1">
          {/* Quick Metrics Averages */}
          {(() => {
            const areasData = useStore.getState().areasData;
            const activeAreas = areasData.length || 4;
            const totalMachines = areasData.length || 4;
            const activeAlerts = areasData.filter(a => a.status === 'critical').length;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <MetricCard 
                  label="Total Incidents"
                  value={`${stats.totalCount} Logged`}
                  subtext="Chronological violations logged"
                  icon={BellRing}
                  status="normal"
                />
                <MetricCard 
                  label="Monitored Sectors"
                  value={`${activeAreas} Areas`}
                  subtext="Active regional gateways"
                  icon={Building}
                  status="normal"
                />
                <MetricCard 
                  label="Connected Machines"
                  value={`${totalMachines} Units`}
                  subtext="Health monitoring active"
                  icon={Settings}
                  status="normal"
                />
                <MetricCard 
                  label="Active Warnings"
                  value={`${activeAlerts} Live Alerts`}
                  subtext="Current critical alarms"
                  icon={Flame}
                  status={activeAlerts > 0 ? 'critical' as any : 'normal'}
                />
              </div>
            );
          })()}


          {/* Alarm Log Feed */}
          <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-100 dark:border-slate-800/40 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)] w-full">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Chronological Alert Log Stream
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl">
                Real-Time Stream
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/10 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/20">
                    <th className="p-4 pl-6">Alert Details</th>
                    <th className="p-4">Sector Location</th>
                    <th className="p-4">Sensor Value</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 pr-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/20 text-xs">
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                        No alert logs found for selected criteria.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((alert) => {
                      return (
                        <tr 
                          key={alert.id} 
                          className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors bg-rose-500/[0.015]"
                        >
                          {/* Alert Type Message */}
                          <td className="p-4 pl-6 max-w-sm">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 bg-rose-500/10 border-rose-100 dark:border-rose-950/20">
                                {getAlertIcon(alert.type)}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold tracking-tight text-slate-900 dark:text-white">
                                  {alert.message}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                                  {alert.type} Alert
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Sector */}
                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-350">
                            {alert.areaName}
                          </td>

                          {/* Trigger Value */}
                          <td className="p-4 font-mono font-bold text-slate-850 dark:text-slate-200">
                            {alert.value}
                          </td>

                          {/* Timestamp */}
                          <td className="p-4 font-medium text-slate-500 dark:text-slate-450">
                            {alert.timestamp}
                          </td>

                          {/* Status */}
                          <td className="p-4 pr-6 text-right">
                            <Badge 
                              label="Alert Triggered"
                              severity="error"
                              pulsing={true}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
