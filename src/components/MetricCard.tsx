import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type MetricStatus = 'normal' | 'critical';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  status?: MetricStatus;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext = '',
  icon: Icon,
  status = 'normal'
}) => {
  const style = status === 'critical'
    ? {
        card: 'border-rose-100 dark:border-rose-950/20 bg-rose-50/[0.15] dark:bg-rose-950/5',
        iconBg: 'bg-rose-100/60 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400',
        text: 'text-rose-600 dark:text-rose-400'
      }
    : {
        card: 'border-slate-100/80 dark:border-slate-800/40 bg-white dark:bg-[#0f172a]/60',
        iconBg: 'bg-blue-600/5 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400',
        text: 'text-slate-900 dark:text-white'
      };

  return (
    <div className={`p-6 rounded-3xl border flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 ${style.card}`}>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase">
          {label}
        </span>
        <span className={`text-2xl font-semibold tracking-tight ${style.text}`}>
          {value}
        </span>
        {subtext && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {subtext}
          </span>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-105 ${style.iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
