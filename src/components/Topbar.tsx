import React, { useEffect, useState } from 'react';
import { Clock, Sun, Moon } from 'lucide-react';

interface TopbarProps {
  activeTab: string;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  children?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({ activeTab, theme, setTheme, children }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (tabId: string) => {
    switch (tabId) {
      case 'overview':
        return 'Active Sectors';
      case 'areas':
        return 'Industrial Area Conditions';
      case 'analytics':
        return 'Machine Predictive Analytics';
      case 'alerts':
        return 'System Alert Logs';
      default:
        return 'Industrial IoT Dashboard';
    }
  };

  return (
    <header className="min-h-20 bg-white dark:bg-[#0f172a]/60 backdrop-blur-2xl border border-slate-100 dark:border-slate-800/40 rounded-3xl px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-500 gap-4">
      {/* Title/Custom section */}
      {children ? (
        <div className="flex-1 flex items-center min-w-0">{children}</div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            {getPageTitle(activeTab)}
          </h2>
        </div>
      )}

      {/* Right Clock & Theme Toggler section */}
      <div className="flex items-center gap-4">
        {/* Real-time Clock */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/30 rounded-2xl text-slate-700 dark:text-slate-300 font-mono text-xs shadow-inner transition-colors duration-300">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{time || 'Initializing...'}</span>
        </div>

        {/* Theme Changer Button */}
        <div className="flex bg-slate-100/80 dark:bg-slate-800/40 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/20 transition-colors duration-300">
          <button
            onClick={() => setTheme('light')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${theme === 'light' ? 'bg-white text-blue-600 shadow-md font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            title="Light Theme"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-2 rounded-xl transition-all cursor-pointer ${theme === 'dark' ? 'bg-[#0f172a] text-yellow-400 shadow-md font-medium' : 'text-slate-500 hover:text-slate-300'}`}
            title="Dark Theme"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
