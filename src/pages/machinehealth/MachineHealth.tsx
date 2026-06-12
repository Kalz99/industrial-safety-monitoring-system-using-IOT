import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';
import { MetricCard } from '../../components/MetricCard';
import { MachineCard, type MachineData } from './components/MachineCard';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useStore } from '../../hooks/useStore';
import { signOut } from 'firebase/auth';
import { auth, database } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

interface MachineHealthProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MachineHealth: React.FC<MachineHealthProps> = ({ activeTab, setActiveTab }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const user = useStore((state) => state.user);
  
  // Call the live IOT sensor streaming hook
  const { areasData, kpiStats } = useDashboardData();

  // Keep track of an internal minute ticker for "Last Checked"
  const [minutesCounter, setMinutesCounter] = useState(0);
  const [pastAlerts, setPastAlerts] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutesCounter(prev => prev + 1);
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time machine alert logs
  useEffect(() => {
    const alertsRef = ref(database, 'machine_alerts');
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPastAlerts([]);
        return;
      }
      const list = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      setPastAlerts(list);
    }, (error) => {
      console.error("Failed to fetch machine alerts:", error);
    });
    return unsubscribe;
  }, []);

  // Dynamic machines list mapping directly from the Firebase areas database data
  const machines: MachineData[] = useMemo(() => {
    const list: MachineData[] = [];
    
    const realMachineNames: Record<string, string> = {
      'prod-line-1': 'Production Line Conveyor',
      'boiler-room': 'Boiler Feed Pump',
      'storage-a': 'Storage Area Elevator',
      'assembly-hall': 'Robotic Assembly Arm'
    };

    // Map machines from areasData dynamically
    areasData.forEach((liveArea, index) => {
      // Status determination based on alerts/critical indicators and AI prediction
      const isCritical =
        liveArea.machineHealth.vibration.status === 'critical' ||
        liveArea.machineHealth.current.status === 'critical' ||
        liveArea.machineHealth.temperature.status === 'critical' ||
        liveArea.machineHealth.prediction === 1;

      const machineName = realMachineNames[liveArea.id] || 
        (liveArea.machineName && !liveArea.machineName.toLowerCase().startsWith('machine 1') 
          ? liveArea.machineName 
          : liveArea.name.replace('Sector', '').replace('Area', 'Machine'));

      list.push({
        id: liveArea.id,
        name: machineName,
        status: isCritical ? 'Maintenance Recommended' : 'Healthy',
        metrics: {
          current: liveArea.machineHealth.current.value,
          vibration: liveArea.machineHealth.vibration.value,
          temperature: liveArea.machineHealth.temperature.value
        },
        lastCheckedMinutesAgo: (minutesCounter + index * 2) % 10
      });
    });

    return list;
  }, [areasData, minutesCounter]);

  // Compute stats based on the 12 machines list
  const totalMonitored = machines.length;
  const maintenanceRecommended = machines.filter(m => m.status === 'Maintenance Recommended').length;
  const healthyMachines = totalMonitored - maintenanceRecommended;

  return (
    <div className={`${theme === 'dark' ? 'dark bg-[#090d16]' : 'bg-[#f1f5f9]'} text-slate-850 dark:text-slate-100 flex min-h-screen font-sans antialiased overflow-hidden w-full transition-colors duration-500`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={kpiStats.activeAlerts}
        username={user?.email ? user.email.split('@')[0] : 'Alex Carter'}
        onLogout={() => signOut(auth)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto max-h-screen">
        {/* Topbar Header */}
        <Topbar
          activeTab={activeTab}
          theme={theme}
          setTheme={setTheme}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Machine Health Status
            </h2>
          </div>
        </Topbar>

        {/* Top KPI Cards section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <MetricCard
            label="Machines Monitored"
            value={totalMonitored}
            icon={Activity}
            status="normal"
          />
          <MetricCard
            label="Healthy Machines"
            value={healthyMachines}
            icon={ShieldCheck}
            status="normal"
          />
          <MetricCard
            label="Maintenance Recommended"
            value={maintenanceRecommended}
            icon={AlertTriangle}
            status="normal"
          />
        </div>

        {/* Machine Health Grid */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white pl-6">
            Machines
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {machines.map((machine) => {
              const machinePastAlerts = pastAlerts.filter(a => a.areaId === machine.id);
              return (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  pastAlerts={machinePastAlerts}
                />
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MachineHealth;
