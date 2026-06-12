import { useState, useEffect, useMemo } from 'react';
import { useAreas } from './useAreas';
import { DashboardApiService } from '../services/dashboardApi';

export interface AlertLogRecord {
  id: string;
  timestamp: string;
  areaId: string;
  areaName: string;
  type: 'flame' | 'smoke' | 'vibration' | 'temperature' | 'current';
  message: string;
  value: string;
  status: string;
}

export const useAlertLogs = () => {
  const { areasList, areaNamesMap } = useAreas();
  const [rawAlerts, setRawAlerts] = useState<any[]>([]);
  const [filterArea, setFilterArea] = useState<string>('all');

  // Subscribe dynamically to the Firebase RTDB /alerts parent node
  useEffect(() => {
    const unsubscribe = DashboardApiService.subscribeToAlertLogs((updatedAlerts) => {
      setRawAlerts(updatedAlerts);
    });
    return unsubscribe;
  }, []);

  // Map the raw database records into clean React UI display elements
  const alerts: AlertLogRecord[] = useMemo(() => {
    return rawAlerts.map((alert) => {
      const areaName = areaNamesMap[alert.areaId] || 'Unnamed Sector';
      const sensorName = alert.sensorName || 'temperature';
      
      // Determine safety message & units dynamically
      let message = 'Critical sensor threshold Breach.';
      let valueWithUnit = String(alert.value);

      if (sensorName === 'flame') {
        message = '🔥 Fire detector sensor alarm triggered!';
        valueWithUnit = 'Detected';
      } else if (sensorName === 'smoke') {
        message = `Smoke density threshold limit crossed.`;
        valueWithUnit = `${alert.value} ppm`;
      } else if (sensorName === 'vibration') {
        message = 'Machinery vibration threshold limit crossed.';
        valueWithUnit = `${alert.value} m/s2`;
      } else if (sensorName === 'current') {
        message = `Electrical amperage draw threshold crossed.`;
        valueWithUnit = `${alert.value} A`;
      } else if (sensorName === 'temperature') {
        const isEnv = alert.envId !== null;
        message = isEnv 
          ? `Ambient temperature threshold limit crossed.`
          : `Motor temperature threshold limit crossed.`;
        valueWithUnit = `${alert.value} °C`;
      }

      // Format timestamp beautifully
      const date = new Date(alert.timestamp || Date.now());
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });

      return {
        id: alert.alertId || alert.id,
        timestamp: formattedTime,
        areaId: alert.areaId,
        areaName,
        type: sensorName as any,
        message,
        value: valueWithUnit,
        status: alert.status || 'Alert Triggered'
      };
    });
  }, [rawAlerts, areaNamesMap]);

  // Filter alerts by sector dynamically
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

export default useAlertLogs;
