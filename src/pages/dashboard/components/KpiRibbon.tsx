import React from 'react';
import { 
  MetricCard
} from '../../../components/MetricCard';
import { 
  Building2, 
  Settings
} from 'lucide-react';

interface KpiStats {
  activeAreas: number;
  healthyMachines: number;
  atRiskMachines: number;
  safetySecureCount: number;
  activeAlerts: number;
}

interface KpiRibbonProps {
  stats: KpiStats;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ stats }) => {
  const totalMachines = stats.healthyMachines + stats.atRiskMachines;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      <MetricCard
        label="Total Monitored Areas"
        value={`${stats.activeAreas} Sectors`}
        subtext="All regional gateways active"
        icon={Building2}
      />
      <MetricCard
        label="Total Machines Count"
        value={`${totalMachines} Machines`}
        subtext="Predictive health monitoring active"
        icon={Settings}
        status="normal"
      />
    </div>
  );
};
