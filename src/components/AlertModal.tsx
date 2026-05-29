import React from 'react';
import { useStore } from '../hooks/useStore';
import { useAlarmSound } from '../hooks/useAlarmSound';
import { DashboardApiService } from '../services/dashboardApi';
import { 
  X, 
  Flame, 
  Activity, 
  Zap, 
  Thermometer, 
  Wind,
  BellRing,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const AlertModal: React.FC = () => {
  const activeModalAlert = useStore((state) => state.activeModalAlert);
  const setActiveModalAlert = useStore((state) => state.setActiveModalAlert);
  const setSelectedAreaId = useStore((state) => state.setSelectedAreaId);
  const setActiveTab = useStore((state) => state.setActiveTab);

  // Invoke the continuous alarm sound hook - rings indefinitely until activeModalAlert becomes null
  useAlarmSound(!!activeModalAlert);

  if (!activeModalAlert) return null;

  // Passive dismiss: Close modal UI without changing the Firebase 'Alert Triggered' status
  const handleDismiss = () => {
    setActiveModalAlert(null);
  };

  // Explicit acknowledge: Update Firebase status to 'Acknowledged' and close
  const handleAcknowledge = () => {
    if (activeModalAlert.alertId) {
      DashboardApiService.updateAlertStatus(activeModalAlert.alertId, 'Acknowledged');
    }
    setActiveModalAlert(null);
  };

  // Explicit acknowledge & explore: Update Firebase status to 'Acknowledged', close, and navigate
  const handleExplore = () => {
    if (activeModalAlert.alertId) {
      DashboardApiService.updateAlertStatus(activeModalAlert.alertId, 'Acknowledged');
    }
    setSelectedAreaId(activeModalAlert.areaId);
    setActiveTab(activeModalAlert.sourceType === 'machine' ? 'analytics' : 'areas');
    setActiveModalAlert(null);
  };

  const getAlertIcon = () => {
    const iconClass = "w-10 h-10 animate-bounce";
    switch (activeModalAlert.sensorType) {
      case 'flame':
        return <Flame className={`${iconClass} text-rose-500`} />;
      case 'smoke':
        return <Wind className={`${iconClass} text-orange-500`} />;
      case 'vibration':
        return <Activity className={`${iconClass} text-rose-600`} />;
      case 'current':
        return <Zap className={`${iconClass} text-yellow-500`} />;
      default:
        return <Thermometer className={`${iconClass} text-amber-500`} />;
    }
  };

  const isEnvironmental = activeModalAlert.sourceType === 'environment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div 
        onClick={handleDismiss}
        className="absolute inset-0 bg-[#090d16]/75 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Glowing Modal Box (Glassmorphism layout) */}
      <div className="relative w-full max-w-md bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-lg border border-rose-500/30 rounded-[32px] shadow-[0_20px_50px_rgba(239,68,68,0.15)] overflow-hidden transform transition-all duration-500 scale-100 flex flex-col p-6 gap-6">
        
        {/* Glowing Top Alert Light */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-600 animate-pulse" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-none">
              Live Edge Alert Event
            </span>
          </div>
          <button 
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alert Icon & Source Details */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 shadow-inner flex items-center justify-center">
            {getAlertIcon()}
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {activeModalAlert.areaName}
            </h2>
            <span className={`text-[10px] uppercase font-bold tracking-widest ${
              isEnvironmental ? 'text-orange-500' : 'text-blue-500'
            }`}>
              {isEnvironmental ? 'Environmental Hazard Detected' : 'Machinery Stress Detected'}
            </span>
          </div>
        </div>

        {/* Sensor Breakdown Box */}
        <div className="bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Trigger Sensor</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{activeModalAlert.sensorLabel}</span>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800/40 w-full" />
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Recorded Value</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-mono font-bold text-rose-600 dark:text-rose-450">
                {activeModalAlert.value}
              </span>
              {activeModalAlert.unit && (
                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wide">
                  {activeModalAlert.unit}
                </span>
              )}
            </div>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800/40 w-full" />
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider pl-0.5">
            <span>Log Timestamp</span>
            <span>{activeModalAlert.timestamp}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <button
            onClick={handleAcknowledge}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer select-none"
          >
            Acknowledge
          </button>
          <button
            onClick={handleExplore}
            className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-550 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-550/20 hover:shadow-rose-550/30 transition-all cursor-pointer select-none"
          >
            Explore Telemetry
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
export default AlertModal;
