import React from 'react';
import { useStore } from '../hooks/useStore';
import { useAlarmSound } from '../hooks/useAlarmSound';
import { DashboardApiService } from '../services/dashboardApi';
import {
  X,
  BrainCircuit,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const PredictionAlertModal: React.FC = () => {
  const activePredictionAlert = useStore((state) => state.activePredictionAlert);
  const setActivePredictionAlert = useStore((state) => state.setActivePredictionAlert);
  const setSelectedAreaId = useStore((state) => state.setSelectedAreaId);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const areasData = useStore((state) => state.areasData);

  // Invoke the continuous alarm sound hook - rings indefinitely until prediction alert is resolved
  useAlarmSound(!!activePredictionAlert);

  if (!activePredictionAlert) return null;

  const saveLog = (status: 'Dismissed' | 'Acknowledged') => {
    if (!activePredictionAlert) return;
    const area = areasData.find(a => a.id === activePredictionAlert.areaId);
    const vibration = area?.machineHealth?.vibration?.value ?? 0;
    const current = area?.machineHealth?.current?.value ?? 0;
    const temperature = area?.machineHealth?.temperature?.value ?? 0;
    const machineId = (area as any)?._meta?.machineId || 'machine-1';

    DashboardApiService.logMachineAlert({
      areaId: activePredictionAlert.areaId,
      machineId,
      vibration,
      current,
      temperature,
      status,
      timestamp: Date.now()
    }).catch(err => console.error("Failed to log machine alert:", err));
  };

  // Passive dismiss: Close modal UI without changing the Firebase status
  const handleDismiss = () => {
    saveLog('Dismissed');
    setActivePredictionAlert(null);
  };

  // Explicit acknowledge: Update Firebase status to 'Acknowledged' and close
  const handleAcknowledge = () => {
    saveLog('Acknowledged');
    if (activePredictionAlert.alertId) {
      DashboardApiService.updateAlertStatus(activePredictionAlert.alertId, 'Acknowledged');
    }
    setActivePredictionAlert(null);
  };

  // Explicit acknowledge & explore: Navigate to machine health page
  const handleExplore = () => {
    saveLog('Acknowledged');
    if (activePredictionAlert.alertId) {
      DashboardApiService.updateAlertStatus(activePredictionAlert.alertId, 'Acknowledged');
    }
    setSelectedAreaId(activePredictionAlert.areaId);
    setActiveTab('machinehealth');
    setActivePredictionAlert(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        onClick={handleDismiss}
        className="absolute inset-0 bg-[#090d16]/75 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Glowing Modal Box (Glassmorphism layout) */}
      <div className="relative w-full max-w-md bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-lg border border-amber-500/30 rounded-[32px] shadow-[0_20px_50px_rgba(245,158,11,0.15)] overflow-hidden transform transition-all duration-500 scale-100 flex flex-col p-6 gap-6">

        {/* Glowing Top Alert Light */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 animate-pulse" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
            </span>
            <span className="text-[10px] font-bold text-amber-650 dark:text-amber-400 uppercase tracking-widest leading-none">
              AI Forecast
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
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 shadow-inner flex items-center justify-center">
            <BrainCircuit className="w-10 h-10 animate-bounce text-amber-550 dark:text-amber-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {activePredictionAlert.areaName}
            </h2>
          </div>
        </div>

        {/* Sensor Breakdown Box */}
        <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 dark:text-slate-550 font-medium">
              Predicted Device
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activePredictionAlert.deviceName || 'Machine 1'}
            </span>
          </div>

          {activePredictionAlert.criticalMetrics && activePredictionAlert.criticalMetrics.length > 0 && (
            activePredictionAlert.criticalMetrics.map((metric, idx) => (
              <React.Fragment key={idx}>
                <div className="h-px bg-slate-100 dark:bg-slate-800/40 w-full" />
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-xs text-slate-400 dark:text-slate-550 font-medium">{metric.label}</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-450 text-right">
                      {metric.value}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <button
            onClick={handleAcknowledge}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer select-none"
          >
            Dismiss Alert
          </button>
          <button
            onClick={handleExplore}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-550 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-550/20 hover:shadow-amber-550/30 transition-all cursor-pointer select-none"
          >
            View
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
export default PredictionAlertModal;
