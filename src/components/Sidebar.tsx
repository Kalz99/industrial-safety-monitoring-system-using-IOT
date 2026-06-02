import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  BellRing, 
  Activity, 
  Cpu,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  alertCount: number;
  username?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  alertCount,
  username = "Alex Carter",
  onLogout = () => alert("Logging out...")
}) => {
  const menuItems = [
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'areas', name: 'Area Conditions', icon: Map },
    { id: 'analytics', name: 'Machine Analytics', icon: Activity },
    { id: 'alerts', name: 'Alert Logs', icon: BellRing, badge: alertCount },
  ];

  return (
    <aside className="w-72 h-[calc(100vh-2rem)] my-4 ml-4 bg-white dark:bg-[#0f172a]/60 backdrop-blur-2xl border border-slate-100 dark:border-slate-800/40 rounded-3xl p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-500">
      <div className="flex flex-col gap-10">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-500/10 dark:border-blue-500/20 rounded-2xl flex items-center justify-center">
            <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-md font-semibold tracking-tight text-slate-900 dark:text-white uppercase">INDUS-SHIELD</h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Safety Live</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600/5 text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-105 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700'}`} />
                  <span className="text-sm tracking-tight">{item.name}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-lg bg-rose-500/10 px-2 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session Section */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/30">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.08)]">
            {username.split(' ').map(n => n[0]).join('')}
          </div>
          {/* Username */}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{username}</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider">Supervisor</span>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer"
          title="Log Out"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </aside>
  );
};
