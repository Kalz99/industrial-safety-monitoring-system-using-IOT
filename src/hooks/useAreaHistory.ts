import { useState, useMemo } from 'react';
import type { HistoricalTelemetryRecord } from '../types/historyTypes';

// Seed data generators to produce stable mock history for each area
const generateMockHistory = (areaId: string): HistoricalTelemetryRecord[] => {
  const records: HistoricalTelemetryRecord[] = [];
  const now = new Date();

  // Different baselines based on areaId
  let baseVib = 1.5;
  let baseAmp = 15.0;
  let baseMotTemp = 45.0;
  let baseSmoke = 50;
  let baseAmbTemp = 24.0;
  let criticalChance = 0.05;

  if (areaId === 'prod-line-1') {
    baseVib = 2.8;
    baseAmp = 26.0;
    baseMotTemp = 64.0;
    baseSmoke = 200; // prone to higher smoke
    baseAmbTemp = 35.0;
    criticalChance = 0.25;
  } else if (areaId === 'boiler-room') {
    baseVib = 4.5;
    baseAmp = 42.0;
    baseMotTemp = 78.0;
    baseSmoke = 80;
    baseAmbTemp = 32.0;
    criticalChance = 0.35;
  } else if (areaId === 'storage-a') {
    baseVib = 0.8;
    baseAmp = 7.0;
    baseMotTemp = 32.0;
    baseSmoke = 35;
    baseAmbTemp = 21.0;
    criticalChance = 0.01;
  } else if (areaId === 'assembly-hall') {
    baseVib = 1.6;
    baseAmp = 13.0;
    baseMotTemp = 40.0;
    baseSmoke = 45;
    baseAmbTemp = 23.0;
    criticalChance = 0.02;
  }

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();
    
    // diurnal temp variation + noise
    const timeFactor = Math.sin((hour - 6) * Math.PI / 12); // peak at 15:00 (3 PM)
    const ambTemp = parseFloat((baseAmbTemp + timeFactor * 4 + Math.random() * 1.5).toFixed(1));
    const motTemp = parseFloat((baseMotTemp + timeFactor * 6 + Math.random() * 3).toFixed(1));
    
    // vibration fluctuations with occasional spikes
    const isSpike = Math.random() < criticalChance;
    const vibration = parseFloat((baseVib + (isSpike ? 2.5 : 0) + Math.sin(hour) * 0.3 + Math.random() * 0.4).toFixed(2));
    
    // amperage draw follows vibration
    const current = parseFloat((baseAmp + (vibration - baseVib) * 3 + Math.random() * 1.2).toFixed(1));

    // smoke and flame simulation
    const smokeNoise = Math.random() < criticalChance ? 150 : 0;
    const smoke = Math.round(baseSmoke + smokeNoise + Math.sin(hour) * 10 + Math.random() * 15);
    
    const flameDetected = (areaId === 'prod-line-1' && i === 0) || (isSpike && Math.random() < 0.1);
    const flame: 'Detected' | 'None' = flameDetected ? 'Detected' : 'None';

    // Status mapping based on realistic limits
    const vibrationStatus = vibration > 5.0 ? 'critical' : 'normal';
    const currentStatus = current > 40.0 ? 'critical' : 'normal';
    const motTempStatus = motTemp > 75.0 ? 'critical' : 'normal';
    const smokeStatus = smoke > 400 ? 'critical' : 'normal';
    const flameStatus = flame === 'Detected' ? 'critical' : 'normal';
    const ambTempStatus = ambTemp > 40.0 ? 'critical' : 'normal';

    const timestamp = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + time.toLocaleDateString([], { month: 'short', day: 'numeric' });

    records.push({
      timestamp,
      machineHealth: {
        vibration,
        vibrationStatus,
        current,
        currentStatus,
        temperature: motTemp,
        temperatureStatus: motTempStatus
      },
      environment: {
        smoke,
        smokeStatus,
        flame,
        flameStatus,
        temperature: ambTemp,
        temperatureStatus: ambTempStatus
      }
    });
  }

  return records;
};

export const useAreaHistory = (areaId: string) => {
  const [selectedMetric, setSelectedMetric] = useState<'vibration' | 'temperature' | 'current' | 'smoke'>('temperature');
  
  const records = useMemo(() => {
    return generateMockHistory(areaId);
  }, [areaId]);

  // Compute key summaries over the last 24 hours
  const stats = useMemo(() => {
    let totalVibration = 0;
    let maxVibration = 0;
    let totalCurrent = 0;
    let maxCurrent = 0;
    let totalMotTemp = 0;
    let maxMotTemp = 0;
    let totalSmoke = 0;
    let maxSmoke = 0;
    let totalAmbTemp = 0;
    let flameTriggers = 0;

    records.forEach(r => {
      totalVibration += r.machineHealth.vibration;
      if (r.machineHealth.vibration > maxVibration) maxVibration = r.machineHealth.vibration;

      totalCurrent += r.machineHealth.current;
      if (r.machineHealth.current > maxCurrent) maxCurrent = r.machineHealth.current;

      totalMotTemp += r.machineHealth.temperature;
      if (r.machineHealth.temperature > maxMotTemp) maxMotTemp = r.machineHealth.temperature;

      totalSmoke += r.environment.smoke;
      if (r.environment.smoke > maxSmoke) maxSmoke = r.environment.smoke;

      totalAmbTemp += r.environment.temperature;
      if (r.environment.flame === 'Detected') flameTriggers++;
    });

    const count = records.length || 1;

    return {
      avgVibration: parseFloat((totalVibration / count).toFixed(2)),
      maxVibration,
      avgCurrent: parseFloat((totalCurrent / count).toFixed(1)),
      maxCurrent,
      avgMotTemp: parseFloat((totalMotTemp / count).toFixed(1)),
      maxMotTemp,
      avgSmoke: Math.round(totalSmoke / count),
      maxSmoke,
      avgAmbTemp: parseFloat((totalAmbTemp / count).toFixed(1)),
      flameTriggers
    };
  }, [records]);

  // Compute simple chart points based on selected metric
  const chartData = useMemo(() => {
    return records.map(r => {
      let value = 0;
      switch (selectedMetric) {
        case 'vibration':
          value = r.machineHealth.vibration;
          break;
        case 'current':
          value = r.machineHealth.current;
          break;
        case 'smoke':
          value = r.environment.smoke;
          break;
        default:
          value = r.machineHealth.temperature;
      }
      return {
        label: r.timestamp.split(' ')[0], // just the time component
        value
      };
    });
  }, [records, selectedMetric]);

  return {
    records,
    stats,
    chartData,
    selectedMetric,
    setSelectedMetric
  };
};
