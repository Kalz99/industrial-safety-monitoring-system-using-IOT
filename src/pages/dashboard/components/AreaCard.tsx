import React from 'react';
import { Badge, type BadgeSeverity } from '../../../components/Badge';
import { SensorLabel, type SensorStatus } from '../../../components/SensorLabel';
import { ArrowUpRight } from 'lucide-react';

export interface AreaTelemetry {
  id: string;
  name: string;
  status: 'normal' | 'critical';
  machineHealth: {
    vibration: { value: number; unit: string; status: SensorStatus };
    current: { value: number; unit: string; status: SensorStatus };
    temperature: { value: number; unit: string; status: SensorStatus };
    prediction?: number;
  };
  environment: {
    smoke: { value: number; unit: string; status: SensorStatus };
    flame: { value: 'Detected' | 'None'; status: SensorStatus };
    temperature: { value: number; unit: string; status: SensorStatus };
  };
  machineName?: string;
  envName?: string;
}

interface AreaCardProps {
  area: AreaTelemetry;
  onExplore: (areaId: string) => void;
}

export const AreaCard: React.FC<AreaCardProps> = ({ area, onExplore }) => {
  const getBadgeConfig = (): { label: string; severity: BadgeSeverity; border: string } => {
    switch (area.status) {
      case 'critical':
        return {
          label: 'Alert',
          severity: 'error',
          border: 'border-rose-100 dark:border-rose-950/20'
        };
      default:
        return {
          label: 'Secure',
          severity: 'success',
          border: 'border-slate-100 dark:border-slate-800/40'
        };
    }
  };

  const badgeConfig = getBadgeConfig();

  return (
    <div
      onClick={() => onExplore(area.id)}
      className={`flex flex-col bg-white dark:bg-[#0f172a]/60 rounded-3xl border ${badgeConfig.border} overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-500 hover:shadow-[0_12px_45px_rgba(0,0,0,0.035)] hover:-translate-y-1 cursor-pointer select-none`}
    >
      {/* Card Header Status Banner */}
      <div className={`p-5 flex items-center justify-between border-b ${badgeConfig.border} ${area.status === 'critical'
        ? 'bg-rose-500/[0.02]'
        : 'bg-slate-50/20'
        }`}>
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full relative flex`}>
            {area.status === 'critical' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${area.status === 'critical' ? 'bg-rose-550' : 'bg-emerald-500'
              }`} />
          </div>
          <h3 className="text-md font-semibold tracking-tight text-slate-800 dark:text-white">
            {area.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            label={badgeConfig.label}
            severity={badgeConfig.severity}
            pulsing={area.status !== 'normal'}
          />
          <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-slate-550 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>

      {/* Grid Columns with elegant layouts */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Health Panel */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
            Machine Health
          </h4>
          <div className="flex flex-col gap-2">
            <SensorLabel
              type="vibration"
              label="Vibration"
              value={area.machineHealth.vibration.value}
              unit={area.machineHealth.vibration.unit}
              status={area.machineHealth.vibration.status}
            />
            <SensorLabel
              type="current"
              label="Amperage Draw"
              value={area.machineHealth.current.value}
              unit={area.machineHealth.current.unit}
              status={area.machineHealth.current.status}
            />
            <SensorLabel
              type="temperature"
              label="Motor Temperature"
              value={area.machineHealth.temperature.value}
              unit={area.machineHealth.temperature.unit}
              status={area.machineHealth.temperature.status}
            />
          </div>
        </div>

        {/* Environmental Safety Panel */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
            Safety & Environment
          </h4>
          <div className="flex flex-col gap-2">
            <SensorLabel
              type="smoke"
              label="Smoke Density"
              value={area.environment.smoke.value}
              unit={area.environment.smoke.unit}
              status={area.environment.smoke.status}
            />
            <SensorLabel
              type="flame"
              label="Fire Detector"
              value={area.environment.flame.value}
              status={area.environment.flame.status}
            />
            <SensorLabel
              type="temperature"
              label="Ambient Temperature"
              value={area.environment.temperature.value}
              unit={area.environment.temperature.unit}
              status={area.environment.temperature.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
