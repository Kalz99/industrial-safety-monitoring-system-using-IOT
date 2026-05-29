import React from 'react';

export type BadgeSeverity = 'success' | 'error';

interface BadgeProps {
  label: string;
  severity?: BadgeSeverity;
  pulsing?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  severity = 'success',
  pulsing = false
}) => {
  const colors = severity === 'error' 
    ? {
        bg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30',
        dot: 'bg-rose-500'
      }
    : {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
        dot: 'bg-emerald-500'
      };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xxs font-medium uppercase tracking-wider ${colors.bg} transition-all duration-300`}>
      <span className="relative flex h-2 w-2">
        {pulsing && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.dot}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`}></span>
      </span>
      {label}
    </span>
  );
};
