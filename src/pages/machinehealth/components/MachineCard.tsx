import React from 'react';
import { History } from 'lucide-react';

export interface MachineData {
  id: string;
  name: string;
  status: 'Healthy' | 'Maintenance Recommended';
  metrics: {
    current: number;
    vibration: number;
    temperature: number;
  };
  lastCheckedMinutesAgo: number;
}

interface MachineCardProps {
  machine: MachineData;
  pastAlerts?: Array<{
    id: string;
    areaId: string;
    machineId: string;
    vibration: number;
    current: number;
    temperature: number;
    status: 'Dismissed' | 'Acknowledged';
    timestamp: number;
  }>;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, pastAlerts = [] }) => {
  const isHealthy = machine.status === 'Healthy';

  // Sort past alerts newest first
  const sortedAlerts = [...pastAlerts].sort((a, b) => b.timestamp - a.timestamp);

  const formatAlertTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${timeStr} (${dateStr})`;
  };

  return (
    <div className="bg-white dark:bg-[#0f172a]/60 backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-slate-800/40 p-8 flex flex-col justify-between shadow-[0_12px_40px_rgb(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_16px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1 select-none min-h-[480px]">
      <div className="flex flex-col flex-1">
        {/* Machine Name Header */}
        <div className="flex items-center justify-between mb-4 min-w-0">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight truncate whitespace-nowrap w-full" title={machine.name}>
            {machine.name}
          </h3>
        </div>

        {/* Custom Character Divider as requested: ━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-slate-200 dark:text-slate-800 text-sm overflow-hidden tracking-tighter mb-5 select-none opacity-80">
          ━━━━━━━━━━━━━━━━━━━
        </div>

        {/* Status and Current Live Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Status Section */}
          <div className="flex flex-col justify-center bg-slate-50/45 dark:bg-slate-900/10 border border-slate-100/50 dark:border-slate-800/20 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest block mb-1">
              Live Status
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">
                {isHealthy ? '🟢' : '🟡'}
              </span>
              <span className={`text-[10px] font-bold ${isHealthy ? 'text-emerald-600 dark:text-emerald-450' : 'text-amber-500 dark:text-amber-450'}`}>
                {machine.status}
              </span>
            </div>
          </div>

          {/* Metrics Section */}
          <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800/20">
            <div className="flex flex-col justify-center items-center text-center">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">
                Current
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-250 mt-1">
                {machine.metrics.current.toFixed(1)} A
              </span>
            </div>
            <div className="flex flex-col justify-center items-center text-center border-x border-slate-150 dark:border-slate-800/40 px-1">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">
                Vibration
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-250 mt-1">
                {machine.metrics.vibration.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col justify-center items-center text-center">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">
                Temp
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-250 mt-1">
                {machine.metrics.temperature.toFixed(0)}°C
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Past Notifications/Alerts History */}
        <div className="flex-1 flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-1">
            <History className="w-3.5 h-3.5 text-blue-500" />
            Alerts History ({sortedAlerts.length})
          </div>
          
          {sortedAlerts.length === 0 ? (
            <div className="flex-1 min-h-[100px] flex flex-col items-center justify-center border border-dashed border-slate-150 dark:border-slate-800/50 rounded-2xl p-4 text-center">
              <span className="text-[20px] mb-1">🔍</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                No past prediction alerts logged
              </span>
            </div>
          ) : (
            <div className="flex-1 min-h-[100px] max-h-[180px] overflow-y-auto pr-1 flex flex-col gap-2.5">
              {sortedAlerts.map((alert) => {
                const isAck = alert.status === 'Acknowledged';
                return (
                  <div 
                    key={alert.id} 
                    className="p-3 bg-slate-50/45 dark:bg-slate-900/20 border border-slate-100/50 dark:border-slate-800/30 rounded-xl flex flex-col gap-1.5 transition-colors hover:bg-slate-100/30 dark:hover:bg-slate-900/40"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-550 font-semibold">
                        {formatAlertTime(alert.timestamp)}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isAck 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10' 
                          : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/10'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    


                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100 dark:border-slate-850/50 text-[9px] text-slate-400 dark:text-slate-550">
                      <div>
                        Vib: <span className="font-semibold text-slate-600 dark:text-slate-350">{alert.vibration.toFixed(2)}</span>
                      </div>
                      <div>
                        Amp: <span className="font-semibold text-slate-600 dark:text-slate-350">{alert.current.toFixed(1)}A</span>
                      </div>
                      <div>
                        Temp: <span className="font-semibold text-slate-600 dark:text-slate-350">{alert.temperature.toFixed(0)}°C</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="border-t border-slate-100 dark:border-slate-800/20 pt-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-550">
        <span className="font-semibold">Last Supervised Check</span>
        <span className="font-mono bg-slate-50 dark:bg-slate-850 px-3 py-1 rounded-xl border border-slate-100/35 dark:border-slate-800/30 text-[10px] font-bold">
          {machine.lastCheckedMinutesAgo === 0 ? 'Just now' : `${machine.lastCheckedMinutesAgo} min ago`}
        </span>
      </div>
    </div>
  );
};
