import React, { useState, useMemo } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { MetricCard } from '../../components/MetricCard';
import { Badge } from '../../components/Badge';
import { TelemetryChart } from '../../components/TelemetryChart';
import { useAreaHistory } from '../../hooks/useAreaHistory';
import { useAreas } from '../../hooks/useAreas';
import { 
  Activity, 
  Zap, 
  Thermometer, 
  Wind,
  AlertTriangle,
  Flame,
  ShieldCheck
} from 'lucide-react';

interface AreaHistoryProps {
  areaId: string;
  setSelectedAreaId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
  mode?: 'machine' | 'environment';
}

export const AreaHistory: React.FC<AreaHistoryProps> = ({ 
  areaId, 
  setSelectedAreaId,
  activeTab,
  setActiveTab,
  mode = 'machine'
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { areasList, areaNamesMap } = useAreas();
  const areaName = areaNamesMap[areaId] || 'Unknown Sector';

  // Fetch telemetry records
  const { records, stats } = useAreaHistory(areaId);

  // Available metrics depend on mode
  const metricsList = mode === 'environment' 
    ? (['temperature', 'smoke'] as const)
    : (['temperature', 'vibration', 'current', 'smoke'] as const);

  const [selectedMetric, setSelectedMetric] = useState<'vibration' | 'temperature' | 'current' | 'smoke'>(
    mode === 'environment' ? 'temperature' : 'temperature'
  );

  // Compute dynamic chart data based on selected metric and active mode
  const chartData = useMemo(() => {
    return records.map(r => {
      let value = 0;
      switch (selectedMetric) {
        case 'vibration':
          value = r.machineHealth.vibration;
          break;
        case 'current':
          value = r.machineHealth.current;
          break;
        case 'smoke':
          value = r.environment.smoke;
          break;
        default:
          // temperature maps to Ambient in environment mode, Motor in machine mode
          value = mode === 'environment' ? r.environment.temperature : r.machineHealth.temperature;
      }
      return {
        label: r.timestamp.split(' ')[0], // only the time component
        value
      };
    });
  }, [records, selectedMetric, mode]);

  // Compute alert counts based on active mode
  const alertCount = useMemo(() => {
    return records.filter(r => {
      if (mode === 'environment') {
        return r.environment.smokeStatus === 'critical' || 
               r.environment.flameStatus === 'critical' || 
               r.environment.temperatureStatus === 'critical';
      } else {
        return r.machineHealth.vibrationStatus === 'critical' || 
               r.machineHealth.temperatureStatus === 'critical' || 
               r.machineHealth.currentStatus === 'critical';
      }
    }).length;
  }, [records, mode]);

  // Get active metric details for styling
  const metricDetails = {
    temperature: { 
      label: mode === 'environment' ? 'Ambient Temperature' : 'Motor Temperature', 
      unit: '°C', 
      icon: Thermometer, 
      color: '#f59e0b', 
      gradientId: 'tempGrad' 
    },
    vibration: { 
      label: 'Machine Vibration', 
      unit: 'g', 
      icon: Activity, 
      color: '#3b82f6', 
      gradientId: 'vibGrad' 
    },
    current: { 
      label: 'Amperage Draw', 
      unit: 'A', 
      icon: Zap, 
      color: '#10b981', 
      gradientId: 'ampGrad' 
    },
    smoke: { 
      label: 'Smoke Density', 
      unit: 'ppm', 
      icon: Wind, 
      color: '#ef4444', 
      gradientId: 'smokeGrad' 
    }
  };

  const currentMetric = metricDetails[selectedMetric];

  return (
    <div className={`${theme === 'dark' ? 'dark bg-[#090d16]' : 'bg-[#f1f5f9]'} text-slate-850 dark:text-slate-100 flex min-h-screen font-sans antialiased overflow-hidden w-full transition-colors duration-500`}>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={alertCount}
        username="Alex Carter"
        onLogout={() => alert("Securely logging out...")}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto max-h-screen">
        {/* Topbar Header with nested items */}
        <Topbar 
          activeTab={activeTab === 'areas' ? 'Industrial Area Conditions' : 'Machine Predictive Analytics'}
          theme={theme}
          setTheme={setTheme}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full mr-4">
            {/* Left section: Title info */}
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {areaName} {mode === 'environment' ? 'Environment Conditions' : 'History'}
              </h1>
            </div>

            {/* Right section: Area selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/30 rounded-2xl p-1.5 shadow-inner">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">
                  Active Area
                </span>
                <select
                  value={areaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl px-3 py-1 border border-slate-100 dark:border-slate-800/40 outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
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
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
          
          {/* Quick Metrics Averages (changes based on Mode) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
            {mode === 'environment' ? (
              <>
                <MetricCard 
                  label="24h Avg Ambient Temp"
                  value={`${stats.avgAmbTemp}°C`}
                  subtext="Regulated ventilation active"
                  icon={Thermometer}
                  status={stats.avgAmbTemp > 38 ? 'critical' : 'normal'}
                />
                <MetricCard 
                  label="24h Avg Smoke Density"
                  value={`${stats.avgSmoke} ppm`}
                  subtext={`Peak: ${stats.maxSmoke} ppm`}
                  icon={Wind}
                  status={stats.avgSmoke > 350 ? 'critical' : 'normal'}
                />
                <MetricCard 
                  label="Flame Incidents"
                  value={stats.flameTriggers > 0 ? `${stats.flameTriggers} Triggers` : 'None'}
                  subtext={stats.flameTriggers > 0 ? 'Urgent inspection required' : 'Sensors nominal'}
                  icon={Flame}
                  status={stats.flameTriggers > 0 ? 'critical' : 'normal'}
                />
                <MetricCard 
                  label="Environmental Safety"
                  value={alertCount > 0 ? 'Warnings' : 'Nominal'}
                  subtext={alertCount > 0 ? `${alertCount} safety logs flagged` : 'All safe thresholds met'}
                  icon={ShieldCheck}
                  status={alertCount > 0 ? 'critical' : 'normal'}
                />
              </>
            ) : (
              <>
                <MetricCard 
                  label="24h Avg Motor Temp"
                  value={`${stats.avgMotTemp}°C`}
                  subtext={`Peak: ${stats.maxMotTemp}°C`}
                  icon={Thermometer}
                  status={stats.avgMotTemp > 70 ? 'critical' : 'normal'}
                />
                <MetricCard 
                  label="24h Avg Vibration"
                  value={`${stats.avgVibration} g`}
                  subtext={`Peak: ${stats.maxVibration} g`}
                  icon={Activity}
                  status={stats.avgVibration > 4.0 ? 'critical' : 'normal'}
                />
                <MetricCard 
                  label="24h Avg Amperage"
                  value={`${stats.avgCurrent} A`}
                  subtext={`Peak: ${stats.maxCurrent} A`}
                  icon={Zap}
                  status={stats.avgCurrent > 35.0 ? 'critical' : 'normal'}
                />
                <MetricCard 
                  label="24h Avg Smoke Density"
                  value={`${stats.avgSmoke} ppm`}
                  subtext={stats.flameTriggers > 0 ? `Flame detected ${stats.flameTriggers}x` : 'No Flame Incidents'}
                  icon={stats.flameTriggers > 0 ? Flame : Wind}
                  status={stats.avgSmoke > 300 || stats.flameTriggers > 0 ? 'critical' : 'normal'}
                />
              </>
            )}
          </div>

          {/* Interactive Chart Container */}
          <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-100 dark:border-slate-800/40 rounded-3xl p-6 flex flex-col gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] w-full">
            
            {/* Chart Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 dark:border-slate-800/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/5 dark:bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/10">
                  <currentMetric.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                    {currentMetric.label} Analytics Graph
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Hover nodes to track dynamic sensor variations
                  </span>
                </div>
              </div>

              {/* Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                {metricsList.map((metric) => {
                  const isActive = selectedMetric === metric;
                  const item = metricDetails[metric];
                  return (
                    <button
                      key={metric}
                      onClick={() => setSelectedMetric(metric)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-slate-850 text-blue-600 dark:text-blue-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-slate-100/50 dark:border-slate-800/40'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span className="capitalize">{metric}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reusable Global TelemetryChart */}
            <TelemetryChart 
              chartData={chartData}
              selectedMetric={selectedMetric}
              metricConfig={currentMetric}
              theme={theme}
            />
          </div>

          {/* Chronological Table Log */}
          <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-100 dark:border-slate-800/40 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Detailed {mode === 'environment' ? 'Environment' : 'Telemetry'} Log Records
              </h3>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl">
                24 Hourly Readings
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left">
                {mode === 'environment' ? (
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/10 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/20">
                      <th className="p-4 pl-6">Timestamp</th>
                      <th className="p-4">Ambient Temp</th>
                      <th className="p-4">Smoke Density</th>
                      <th className="p-4">Flame Detector</th>
                      <th className="p-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                ) : (
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/10 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/20">
                      <th className="p-4 pl-6">Timestamp</th>
                      <th className="p-4">Vibration</th>
                      <th className="p-4">Current Draw</th>
                      <th className="p-4">Motor Temp</th>
                      <th className="p-4">Smoke Density</th>
                      <th className="p-4">Flame Detector</th>
                      <th className="p-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                )}
                
                <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/20 text-xs">
                  {[...records].reverse().map((record, index) => {
                    const isEnvAlert = 
                      record.environment.smokeStatus === 'critical' || 
                      record.environment.flameStatus === 'critical' || 
                      record.environment.temperatureStatus === 'critical';

                    const isMachineAlert = 
                      record.machineHealth.vibrationStatus === 'critical' || 
                      record.machineHealth.temperatureStatus === 'critical' || 
                      record.machineHealth.currentStatus === 'critical';

                    const hasAlert = mode === 'environment' ? isEnvAlert : isMachineAlert;

                    return (
                      <tr 
                        key={index} 
                        className={`hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors ${
                          hasAlert ? 'bg-rose-500/[0.015]' : ''
                        }`}
                      >
                        <td className="p-4 pl-6 font-semibold text-slate-700 dark:text-slate-350">
                          {record.timestamp}
                        </td>
                        
                        {mode === 'environment' ? (
                          <>
                            <td className="p-4">
                              <span className={`font-semibold ${record.environment.temperatureStatus === 'critical' ? 'text-rose-600 dark:text-rose-450' : 'text-slate-800 dark:text-slate-200'}`}>
                                {record.environment.temperature}°C
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`font-semibold ${record.environment.smokeStatus === 'critical' ? 'text-rose-600 dark:text-rose-450' : 'text-slate-800 dark:text-slate-200'}`}>
                                {record.environment.smoke} ppm
                              </span>
                            </td>
                            <td className="p-4">
                              {record.environment.flame === 'Detected' ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-450">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Detected
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">None</span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4">
                              <span className={`font-semibold ${record.machineHealth.vibrationStatus === 'critical' ? 'text-rose-600 dark:text-rose-450' : 'text-slate-800 dark:text-slate-200'}`}>
                                {record.machineHealth.vibration} g
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`font-semibold ${record.machineHealth.currentStatus === 'critical' ? 'text-rose-600 dark:text-rose-450' : 'text-slate-800 dark:text-slate-200'}`}>
                                {record.machineHealth.current} A
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                              <span className={`font-semibold ${record.machineHealth.temperatureStatus === 'critical' ? 'text-rose-600 dark:text-rose-450' : 'text-slate-800 dark:text-slate-200'}`}>
                                {record.machineHealth.temperature}°C
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                              <span className={`font-semibold ${record.environment.smokeStatus === 'critical' ? 'text-rose-600 dark:text-rose-450' : 'text-slate-800 dark:text-slate-200'}`}>
                                {record.environment.smoke} ppm
                              </span>
                            </td>
                            <td className="p-4">
                              {record.environment.flame === 'Detected' ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-450">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Detected
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">None</span>
                              )}
                            </td>
                          </>
                        )}
                        
                        <td className="p-4 pr-6 text-right">
                          <Badge 
                            label={hasAlert ? 'Alert Event' : 'Nominal'}
                            severity={hasAlert ? 'error' : 'success'}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
