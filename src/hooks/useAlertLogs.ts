import { useState, useMemo } from 'react';
import { useAreas } from './useAreas';

export interface AlertLogRecord {
  id: string;
  timestamp: string;
  areaId: string;
  areaName: string;
  type: 'flame' | 'smoke' | 'vibration' | 'temperature' | 'current';
  message: string;
  value: string;
}

const generateMockAlerts = (areaNamesMap: Record<string, string>): AlertLogRecord[] => {
  const alerts: AlertLogRecord[] = [];
  const now = new Date();
  
  const alertSpecs = [
    {
      offsetHours: 0.5,
      areaId: 'prod-line-1',
      type: 'smoke' as const,
      message: 'Smoke density threshold limit reached.',
      value: '650 ppm'
    },
    {
      offsetHours: 1.2,
      areaId: 'boiler-room',
      type: 'temperature' as const,
      message: 'Boiler feed motor temperature threshold met.',
      value: '82.5 °C'
    },
    {
      offsetHours: 3.5,
      areaId: 'boiler-room',
      type: 'vibration' as const,
      message: 'Turbine axle vibration sensor threshold triggered.',
      value: '5.8 g'
    },
    {
      offsetHours: 6.0,
      areaId: 'prod-line-1',
      type: 'flame' as const,
      message: 'Flame detector sensor reading recorded.',
      value: 'Detected'
    },
    {
      offsetHours: 8.5,
      areaId: 'assembly-hall',
      type: 'temperature' as const,
      message: 'HVAC controller reporting elevated temperature.',
      value: '29.2 °C'
    },
    {
      offsetHours: 12.0,
      areaId: 'storage-a',
      type: 'current' as const,
      message: 'Refrigeration unit compression pump current spike.',
      value: '18.4 A'
    },
    {
      offsetHours: 16.5,
      areaId: 'boiler-room',
      type: 'smoke' as const,
      message: 'Particulate density warning sensor logged.',
      value: '190 ppm'
    },
    {
      offsetHours: 21.0,
      areaId: 'prod-line-1',
      type: 'current' as const,
      message: 'Welding system actuator current spike recorded.',
      value: '38.5 A'
    }
  ];

  alertSpecs.forEach((spec, index) => {
    const time = new Date(now.getTime() - spec.offsetHours * 60 * 60 * 1000);
    const timestamp = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + time.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    alerts.push({
      id: `alert-${index + 1}`,
      timestamp,
      areaId: spec.areaId,
      areaName: areaNamesMap[spec.areaId] || 'Unknown',
      type: spec.type,
      message: spec.message,
      value: spec.value
    });
  });

  return alerts;
};

export const useAlertLogs = () => {
  const { areasList, areaNamesMap } = useAreas();
  const [alerts] = useState<AlertLogRecord[]>(() => generateMockAlerts(areaNamesMap));
  const [filterArea, setFilterArea] = useState<string>('all');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      return filterArea === 'all' || a.areaId === filterArea;
    });
  }, [alerts, filterArea]);

  const stats = useMemo(() => {
    return {
      totalCount: alerts.length
    };
  }, [alerts]);

  return {
    alerts: filteredAlerts,
    allAlerts: alerts,
    stats,
    filterArea,
    setFilterArea,
    areasList
  };
};
