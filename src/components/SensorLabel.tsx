import React from 'react';
import { 
  Activity, 
  Zap, 
  Thermometer, 
  Wind, 
  Flame, 
  ShieldAlert 
} from 'lucide-react';

export type SensorType = 'vibration' | 'current' | 'temperature' | 'smoke' | 'flame' | 'general';
export type SensorStatus = 'normal' | 'critical';

interface SensorLabelProps {
  type: SensorType;
  label: string;
  value: string | number;
  unit?: string;
  status?: SensorStatus;
}

export const SensorLabel: React.FC<SensorLabelProps> = ({ 
  type, 
  label, 
  value, 
  unit = '', 
  status = 'normal' 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'vibration':
        return <Activity className="w-4 h-4" />;
      case 'current':
        return <Zap className="w-4 h-4" />;
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      case 'smoke':
        return <Wind className="w-4 h-4" />;
      case 'flame':
        return <Flame className="w-4 h-4" />;
      default:
        return <ShieldAlert className="w-4 h-4" />;
    }
  };

  // Modern, sleek indicator colors
  const colors = status === 'critical' 
    ? {
        bg: 'bg-rose-500/[0.04] dark:bg-rose-950/10',
        border: 'border-rose-100 dark:border-rose-950/20',
        text: 'text-rose-600 dark:text-rose-400',
        icon: 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 animate-pulse'
      }
    : {
        bg: 'bg-slate-50/50 dark:bg-slate-800/10',
        border: 'border-slate-100/50 dark:border-slate-800/20',
        text: 'text-slate-900 dark:text-slate-200',
        icon: 'bg-slate-100/80 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400'
      };

  return (
    <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${colors.bg} ${colors.border} transition-all duration-300 hover:scale-[1.01]`}>
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-xl flex items-center justify-center ${colors.icon}`}>
          {getIcon()}
        </div>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-sm font-semibold tracking-tight ${colors.text}`}>{value}</span>
        {unit && <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider pl-0.5">{unit}</span>}
      </div>
    </div>
  );
};
