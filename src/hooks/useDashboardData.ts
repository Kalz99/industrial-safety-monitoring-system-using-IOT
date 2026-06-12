import { useEffect, useMemo } from 'react';
import type { AreaTelemetry } from '../pages/dashboard/components/AreaCard';
import { DashboardApiService } from '../services/dashboardApi';
import { useStore } from './useStore';

const initialAreasData: AreaTelemetry[] = [
  {
    id: 'prod-line-1',
    name: 'Production Line 1',
    status: 'critical',
    machineHealth: {
      vibration: { value: 3.4, unit: 'm/s2', status: 'normal' },
      current: { value: 28.5, unit: 'A', status: 'normal' },
      temperature: { value: 68.0, unit: '°C', status: 'normal' }
    },
    environment: {
      smoke: { value: 650, unit: 'ppm', status: 'critical' },
      flame: { value: 'Detected', status: 'critical' },
      temperature: { value: 45.0, unit: '°C', status: 'critical' }
    }
  },
  {
    id: 'boiler-room',
    name: 'Boiler Room Sector',
    status: 'critical',
    machineHealth: {
      vibration: { value: 5.8, unit: 'm/s2', status: 'critical' },
      current: { value: 45.2, unit: 'A', status: 'normal' },
      temperature: { value: 82.5, unit: '°C', status: 'critical' }
    },
    environment: {
      smoke: { value: 120, unit: 'ppm', status: 'normal' },
      flame: { value: 'None', status: 'normal' },
      temperature: { value: 34.0, unit: '°C', status: 'normal' }
    }
  },
  {
    id: 'storage-a',
    name: 'Storage Area A',
    status: 'normal',
    machineHealth: {
      vibration: { value: 1.1, unit: 'm/s2', status: 'normal' },
      current: { value: 8.4, unit: 'A', status: 'normal' },
      temperature: { value: 35.2, unit: '°C', status: 'normal' }
    },
    environment: {
      smoke: { value: 42, unit: 'ppm', status: 'normal' },
      flame: { value: 'None', status: 'normal' },
      temperature: { value: 22.4, unit: '°C', status: 'normal' }
    }
  },
  {
    id: 'assembly-hall',
    name: 'Main Assembly Hall',
    status: 'normal',
    machineHealth: {
      vibration: { value: 1.8, unit: 'm/s2', status: 'normal' },
      current: { value: 14.2, unit: 'A', status: 'normal' },
      temperature: { value: 42.1, unit: '°C', status: 'normal' }
    },
    environment: {
      smoke: { value: 55, unit: 'ppm', status: 'normal' },
      flame: { value: 'None', status: 'normal' },
      temperature: { value: 24.1, unit: '°C', status: 'normal' }
    }
  }
];

import { type ActiveAlertInfo } from './useStore';

export const useDashboardData = () => {
  const areasData = useStore((state) => state.areasData);
  const setAreasData = useStore((state) => state.setAreasData);
  const activeModalAlert = useStore((state) => state.activeModalAlert);
  const setActiveModalAlert = useStore((state) => state.setActiveModalAlert);
  const activePredictionAlert = useStore((state) => state.activePredictionAlert);
  const setActivePredictionAlert = useStore((state) => state.setActivePredictionAlert);
  const acknowledgedAlerts = useStore((state) => state.acknowledgedAlerts);
  const setAcknowledgedAlerts = useStore((state) => state.setAcknowledgedAlerts);

  // Seed database and subscribe to real-time RTDB updates directly
  useEffect(() => {
    DashboardApiService.seedInitialSectors(initialAreasData).then(() => {
      const unsubscribe = DashboardApiService.subscribeToSectors((updatedSectors) => {
        setAreasData(updatedSectors);
      });
      return unsubscribe;
    });
  }, [setAreasData]);

  // Real-time edge trigger alert scanner
  useEffect(() => {
    if (areasData.length === 0) return;

    let newTriggeredAlert: ActiveAlertInfo | null = null;
    let generatedAlertId: string | undefined = undefined;
    let newTriggeredPrediction: ActiveAlertInfo | null = null;
    let generatedPredictionId: string | undefined = undefined;
    const currentCriticalKeys: string[] = [];

    for (const area of areasData) {
      // 1. Scan Machine Health
      const machines = [
        { type: 'vibration', label: 'Vibration', sensor: area.machineHealth.vibration },
        { type: 'current', label: 'Amperage Draw', sensor: area.machineHealth.current },
        { type: 'temperature', label: 'Machine Temperature', sensor: area.machineHealth.temperature }
      ];

      for (const m of machines) {
        const key = `${area.id}-${m.type}`;
        if (m.sensor.status === 'critical') {
          currentCriticalKeys.push(key);
          if (!acknowledgedAlerts.includes(key) && !newTriggeredAlert && !activeModalAlert) {
            generatedAlertId = DashboardApiService.generateAlertId();
            
            const machineMetrics = [];
            if (area.machineHealth.vibration.status === 'critical') {
              machineMetrics.push({
                label: 'Machine Vibration',
                value: area.machineHealth.vibration.value,
                unit: area.machineHealth.vibration.unit
              });
            }
            if (area.machineHealth.current.status === 'critical') {
              machineMetrics.push({
                label: 'Amperage Draw',
                value: area.machineHealth.current.value,
                unit: area.machineHealth.current.unit
              });
            }
            if (area.machineHealth.temperature.status === 'critical') {
              machineMetrics.push({
                label: 'Machine Temperature',
                value: area.machineHealth.temperature.value,
                unit: area.machineHealth.temperature.unit
              });
            }

            newTriggeredAlert = {
              alertId: generatedAlertId,
              areaId: area.id,
              areaName: area.name,
              sourceType: 'machine',
              sensorType: m.type,
              sensorLabel: m.label,
              value: m.sensor.value,
              unit: m.sensor.unit || '',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              deviceName: area.machineName || 'Machine 1',
              criticalMetrics: machineMetrics
            };
          }
        }
      }

      // 2. Scan Environmental Safety
      const environments = [
        { type: 'smoke', label: 'Smoke Density', sensor: area.environment.smoke },
        { type: 'flame', label: 'Fire Detector', sensor: area.environment.flame },
        { type: 'temperature', label: 'Ambient Temperature', sensor: area.environment.temperature }
      ];

      for (const env of environments) {
        const key = `${area.id}-${env.type}`;
        if (env.sensor.status === 'critical') {
          currentCriticalKeys.push(key);
          if (!acknowledgedAlerts.includes(key) && !newTriggeredAlert && !activeModalAlert) {
            generatedAlertId = DashboardApiService.generateAlertId();

            const envMetrics = [];
            if (area.environment.smoke.status === 'critical') {
              envMetrics.push({
                label: 'Smoke Density',
                value: area.environment.smoke.value,
                unit: area.environment.smoke.unit
              });
            }
            if (area.environment.flame.status === 'critical') {
              envMetrics.push({
                label: 'Fire Detector',
                value: area.environment.flame.value,
                unit: ''
              });
            }
            if (area.environment.temperature.status === 'critical') {
              envMetrics.push({
                label: 'Ambient Temperature',
                value: area.environment.temperature.value,
                unit: area.environment.temperature.unit
              });
            }

            newTriggeredAlert = {
              alertId: generatedAlertId,
              areaId: area.id,
              areaName: area.name,
              sourceType: 'environment',
              sensorType: env.type,
              sensorLabel: env.label,
              value: env.sensor.value,
              unit: 'unit' in env.sensor ? env.sensor.unit : '',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              deviceName: area.envName || 'Environment 1',
              criticalMetrics: envMetrics
            };
          }
        }
      }

      // 3. Scan AI Predictions (prediction child got 1)
      if (area.machineHealth.prediction === 1) {
        const key = `${area.id}-prediction`;
        currentCriticalKeys.push(key);
        if (!acknowledgedAlerts.includes(key) && !newTriggeredPrediction && !activePredictionAlert) {
          generatedPredictionId = DashboardApiService.generateAlertId();
          newTriggeredPrediction = {
            alertId: generatedPredictionId,
            areaId: area.id,
            areaName: area.name,
            sourceType: 'machine',
            sensorType: 'prediction',
            sensorLabel: 'AI Prediction Alert',
            value: 'Anomaly (1)',
            unit: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            deviceName: area.machineName || 'Machine 1',
            criticalMetrics: [
              { label: 'Status', value: 'Maintenance Recommended' }
            ]
          };
        }
      }
    }

    // Edge trigger action: show modal, track key, and record alert in Firebase
    if (newTriggeredAlert && generatedAlertId) {
      setActiveModalAlert(newTriggeredAlert);
      setAcknowledgedAlerts([...acknowledgedAlerts, `${newTriggeredAlert.areaId}-${newTriggeredAlert.sensorType}`]);
      
      // Asynchronously log this critical alert record to Firebase /alerts node with pre-generated alertId
      DashboardApiService.logAlertRecord({
        alertId: generatedAlertId,
        areaId: newTriggeredAlert.areaId,
        sourceType: newTriggeredAlert.sourceType,
        sensorName: newTriggeredAlert.sensorType,
        value: newTriggeredAlert.value
      }).catch(err => console.error("Failed to register alert log in Firebase:", err));
    }

    // Edge trigger action for AI predictions
    if (newTriggeredPrediction && generatedPredictionId) {
      setActivePredictionAlert(newTriggeredPrediction);
      setAcknowledgedAlerts([...acknowledgedAlerts, `${newTriggeredPrediction.areaId}-prediction`]);

      // Asynchronously log this prediction alert record to Firebase /alerts
      DashboardApiService.logAlertRecord({
        alertId: generatedPredictionId,
        areaId: newTriggeredPrediction.areaId,
        sourceType: newTriggeredPrediction.sourceType,
        sensorName: newTriggeredPrediction.sensorType,
        value: '1'
      }).catch(err => console.error("Failed to register prediction alert in Firebase:", err));
    }

    // Re-arm recovery nodes
    const stillCritical = acknowledgedAlerts.filter(k => currentCriticalKeys.includes(k));
    if (stillCritical.length !== acknowledgedAlerts.length) {
      setAcknowledgedAlerts(stillCritical);
    }
  }, [areasData, acknowledgedAlerts, activeModalAlert, setActiveModalAlert, activePredictionAlert, setActivePredictionAlert, setAcknowledgedAlerts]);

  // Compute live aggregates dynamically
  const kpiStats = useMemo(() => {
    const alertCount = areasData.filter(a => a.status !== 'normal').length;
    const healthyMachines = areasData.filter(a => a.machineHealth.vibration.status === 'normal' && a.machineHealth.temperature.status === 'normal').length;
    const atRiskMachines = areasData.filter(a => a.machineHealth.vibration.status !== 'normal' || a.machineHealth.temperature.status !== 'normal').length;
    const safetySecureCount = areasData.filter(a => a.environment.smoke.status === 'normal' && a.environment.flame.status === 'normal').length;

    return {
      activeAreas: areasData.length,
      healthyMachines,
      atRiskMachines,
      safetySecureCount,
      activeAlerts: alertCount
    };
  }, [areasData]);

  return {
    areasData,
    kpiStats
  };
};




