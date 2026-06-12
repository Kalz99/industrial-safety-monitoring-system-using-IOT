import { useState, useMemo, useEffect } from 'react';
import type { HistoricalTelemetryRecord } from '../types/historyTypes';
import { tableStorage } from '../services/tableStorage.service';
import { useStore } from './useStore';

// Seed data generators to produce stable mock history for each area (used as fallback or preview)
const generateMockHistory = (areaId: string, customDate?: string | null): HistoricalTelemetryRecord[] => {
  const records: HistoricalTelemetryRecord[] = [];
  const dateBase = customDate ? new Date(customDate + 'T00:00:00') : new Date();
  let year = dateBase.getFullYear();
  let month = dateBase.getMonth();
  let date = dateBase.getDate();

  if (customDate) {
    const parts = customDate.split('-');
    year = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    date = parseInt(parts[2]);
  }

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

  for (let hour = 0; hour < 24; hour++) {
    const utcTime = Date.UTC(year, month, date, hour - 5, -30, 0, 0);
    const time = new Date(utcTime);
    
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
    
    const flameDetected = (areaId === 'prod-line-1' && hour === 12) || (isSpike && Math.random() < 0.1);
    const flame: 'Detected' | 'None' = flameDetected ? 'Detected' : 'None';

    // Status mapping based on realistic limits
    const vibrationStatus = vibration > 5.0 ? 'critical' : 'normal';
    const currentStatus = current > 40.0 ? 'critical' : 'normal';
    const motTempStatus = motTemp > 75.0 ? 'critical' : 'normal';
    const smokeStatus = smoke > 400 ? 'critical' : 'normal';
    const flameStatus = flame === 'Detected' ? 'critical' : 'normal';
    const ambTempStatus = ambTemp > 40.0 ? 'critical' : 'normal';

    const timeStr = time.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = time.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' });
    const timestamp = `${timeStr} (GMT+5:30) ${dateStr}`;

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

interface MergeRecord {
  timeMs: number;
  timestamp: string;
  machineHealth: HistoricalTelemetryRecord['machineHealth'];
  environment: HistoricalTelemetryRecord['environment'];
}

export const useAreaHistory = (areaId: string, mode: 'machine' | 'environment', timeRange: number = 24, selectedDate?: string | null) => {
  const areasData = useStore((state) => state.areasData);
  const [selectedMetric, setSelectedMetric] = useState<'vibration' | 'temperature' | 'current' | 'smoke'>('temperature');
  const [records, setRecords] = useState<HistoricalTelemetryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setIsFallback(false);

    const loadData = async () => {
      try {
        const sasToken = import.meta.env.VITE_TABLE_SAS_TOKEN;
        if (!sasToken || sasToken.includes("REACT_APP_")) {
          throw new Error("Azure Storage SAS Token not configured or invalid in environment.");
        }

        // Resolve PartitionKey by matching area name or index from global state
        if (areasData.length === 0) {
          // Firebase areas are not loaded yet; return early and wait for them to load
          return;
        }

        const index = areasData.findIndex(a => a.id === areaId);
        const targetArea = areasData.find(a => a.id === areaId);
        const name = targetArea ? targetArea.name.toLowerCase() : "";
        let azurePartitionKey = "AREA_001"; // Default fallback

        if (name.includes("warehouse")) {
          azurePartitionKey = "AREA_001";
        } else if (name.includes("production")) {
          azurePartitionKey = "AREA_002";
        } else if (name.includes("boiler")) {
          azurePartitionKey = "AREA_003";
        } else if (name.includes("storage")) {
          azurePartitionKey = "AREA_004";
        } else if (name.includes("assembly")) {
          azurePartitionKey = "AREA_005";
        } else if (name.includes("packaging")) {
          azurePartitionKey = "AREA_006";
        } else {
          // Fallback to index if name doesn't match known keywords
          if (index === 0) azurePartitionKey = "AREA_001";
          else if (index === 1) azurePartitionKey = "AREA_002";
          else if (index === 2) azurePartitionKey = "AREA_003";
          else if (index === 3) azurePartitionKey = "AREA_004";
        }

        console.log(`🔍 [useAreaHistory Hook] Resolved PartitionKey: "${azurePartitionKey}" from areaId: "${areaId}" at index ${index} (Mode: ${mode}, TimeRange: ${timeRange}h)`);

        let startTimeMs: number | undefined;
        let endTimeMs: number | undefined;

        if (selectedDate) {
          const startOfDay = new Date(selectedDate + 'T00:00:00');
          const endOfDay = new Date(selectedDate + 'T23:59:59.999');
          startTimeMs = startOfDay.getTime();
          endTimeMs = endOfDay.getTime();
        }

        // Fetch machine & environmental readings concurrently with dynamic timeRange or date range
        const [machineReadings, envReadings] = await Promise.all([
          tableStorage.getRecentReadings(azurePartitionKey, "machine_sensor", timeRange, startTimeMs, endTimeMs),
          tableStorage.getRecentReadings(azurePartitionKey, "environmental_sensor", timeRange, startTimeMs, endTimeMs)
        ]);

        console.log(`✅ [useAreaHistory Hook] Successfully loaded from Azure Table Storage for "${azurePartitionKey}":`, {
          machineReadingsCount: machineReadings.length,
          environmentalReadingsCount: envReadings.length
        });

        if (!active) return;

        // Log the specific column values based on active analytics mode
        if (mode === 'machine') {
          console.log(`🛠️ [Azure Table - Machine Telemetry for Area ID: ${azurePartitionKey}]`);
          console.table(
            machineReadings.map(r => ({
              PartitionKey: r.partitionKey,
              RowKey: r.rowKey,
              Timestamp: r.timestamp,
              DeviceType: r.deviceType,
              AreaId: r.areaId,
              Temperature: r.temperature,
              Current: r.current,
              Vibration: r.vibration,
              AlertCurrent: r.alertCurrent,
              AlertTemperature: r.alertTemperature,
              AlertVibration: r.alertVibration
            }))
          );
        } else if (mode === 'environment') {
          console.log(`🌱 [Azure Table - Environmental Telemetry for Area ID: ${azurePartitionKey}]`);
          console.table(
            envReadings.map(r => ({
              PartitionKey: r.partitionKey,
              RowKey: r.rowKey,
              Timestamp: r.timestamp,
              DeviceType: r.deviceType,
              AreaId: r.areaId,
              Humidity: r.humidity,
              Smoke: r.smoke,
              Light: r.light,
              AlertFire: r.alertFire
            }))
          );
        }

        if (machineReadings.length === 0 && envReadings.length === 0) {
          console.warn("No analytics data returned from Azure Table Storage.");
          setRecords([]);
          setIsFallback(false);
          setLoading(false);
          return;
        }

        const map = new Map<string, MergeRecord>();

        const formatTimestamp = (d: Date) => {
          const timeStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
          const dateStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' });
          return `${timeStr} (GMT+5:30) ${dateStr}`;
        };

        // Group machine sensor readings by exact formatted timestamp
        for (const r of machineReadings) {
          const readingDate = new Date(r.timestamp);
          const timeMs = readingDate.getTime();
          const tsStr = formatTimestamp(readingDate);

          if (!map.has(tsStr)) {
            map.set(tsStr, {
              timeMs,
              timestamp: tsStr,
              machineHealth: {
                vibration: r.vibration ?? 0,
                vibrationStatus: r.alertVibration ? 'critical' : 'normal',
                current: r.current ?? 0,
                currentStatus: r.alertCurrent ? 'critical' : 'normal',
                temperature: r.temperature ?? 0,
                temperatureStatus: r.alertTemperature ? 'critical' : 'normal'
              },
              environment: {
                smoke: 0,
                smokeStatus: 'normal',
                flame: 'None',
                flameStatus: 'normal',
                temperature: 0,
                temperatureStatus: 'normal'
              }
            });
          } else {
            const existing = map.get(tsStr)!;
            existing.machineHealth = {
              vibration: r.vibration ?? existing.machineHealth.vibration,
              vibrationStatus: r.alertVibration ? 'critical' : existing.machineHealth.vibrationStatus,
              current: r.current ?? existing.machineHealth.current,
              currentStatus: r.alertCurrent ? 'critical' : existing.machineHealth.currentStatus,
              temperature: r.temperature ?? existing.machineHealth.temperature,
              temperatureStatus: r.alertTemperature ? 'critical' : existing.machineHealth.temperatureStatus
            };
          }
        }

        // Group environmental readings by exact formatted timestamp
        for (const r of envReadings) {
          const readingDate = new Date(r.timestamp);
          const timeMs = readingDate.getTime();
          const tsStr = formatTimestamp(readingDate);
          const flameVal: 'Detected' | 'None' = r.alertFire ? 'Detected' : 'None';

          if (!map.has(tsStr)) {
            map.set(tsStr, {
              timeMs,
              timestamp: tsStr,
              machineHealth: {
                vibration: 0,
                vibrationStatus: 'normal',
                current: 0,
                currentStatus: 'normal',
                temperature: 0,
                temperatureStatus: 'normal'
              },
              environment: {
                smoke: r.smoke ?? 0,
                smokeStatus: (r.smoke !== undefined && r.smoke > 400) ? 'critical' : 'normal',
                flame: flameVal,
                flameStatus: r.alertFire ? 'critical' : 'normal',
                temperature: r.temperature ?? 0,
                temperatureStatus: r.alertTemperature ? 'critical' : 'normal'
              }
            });
          } else {
            const existing = map.get(tsStr)!;
            existing.environment = {
              smoke: r.smoke ?? existing.environment.smoke,
              smokeStatus: (r.smoke !== undefined && r.smoke > 400) ? 'critical' : existing.environment.smokeStatus,
              flame: flameVal,
              flameStatus: r.alertFire ? 'critical' : existing.environment.flameStatus,
              temperature: r.temperature ?? existing.environment.temperature,
              temperatureStatus: r.alertTemperature ? 'critical' : existing.environment.temperatureStatus
            };
          }
        }

        // Carry forward sensor data to fill missing fields chronologically
        const sortedBuckets = Array.from(map.values()).sort((a, b) => a.timeMs - b.timeMs);
        let lastVib = 0, lastAmp = 0, lastTemp = 0;
        let lastSmoke = 0, lastEnvTemp = 0, lastFlame: 'Detected' | 'None' = 'None', lastFlameStatus: 'normal' | 'critical' = 'normal';

        for (const bucket of sortedBuckets) {
          if (bucket.machineHealth.vibration === 0 && bucket.machineHealth.current === 0 && bucket.machineHealth.temperature === 0) {
            bucket.machineHealth.vibration = lastVib;
            bucket.machineHealth.current = lastAmp;
            bucket.machineHealth.temperature = lastTemp;
          } else {
            lastVib = bucket.machineHealth.vibration;
            lastAmp = bucket.machineHealth.current;
            lastTemp = bucket.machineHealth.temperature;
          }

          if (bucket.environment.smoke === 0 && bucket.environment.temperature === 0 && bucket.environment.flame === 'None') {
            bucket.environment.smoke = lastSmoke;
            bucket.environment.temperature = lastEnvTemp;
            bucket.environment.flame = lastFlame;
            bucket.environment.flameStatus = lastFlameStatus;
          } else {
            lastSmoke = bucket.environment.smoke;
            lastEnvTemp = bucket.environment.temperature;
            lastFlame = bucket.environment.flame;
            lastFlameStatus = bucket.environment.flameStatus;
          }
        }

        // Sort chronologically (oldest to newest for charts)
        const sorted = sortedBuckets.map(({ timeMs, ...record }) => record as HistoricalTelemetryRecord);

        setRecords(sorted);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to fetch from Azure Table Storage:", err);
        if (active) {
          setError(err.message || "Unknown error connecting to Azure Table Storage.");
          setRecords([]);
          setIsFallback(false);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [areaId, mode, areasData.length, timeRange, selectedDate]);

  // Compute key summaries over the loaded records
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
    setSelectedMetric,
    loading,
    error,
    isFallback
  };
};

