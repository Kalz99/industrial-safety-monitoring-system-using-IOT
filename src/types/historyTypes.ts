import type { SensorStatus } from '../components/SensorLabel';

export interface HistoricalTelemetryRecord {
  timestamp: string; // "YYYY-MM-DD HH:00"
  machineHealth: {
    vibration: number;
    vibrationStatus: SensorStatus;
    current: number;
    currentStatus: SensorStatus;
    temperature: number;
    temperatureStatus: SensorStatus;
  };
  environment: {
    smoke: number;
    smokeStatus: SensorStatus;
    flame: 'Detected' | 'None';
    flameStatus: SensorStatus;
    temperature: number;
    temperatureStatus: SensorStatus;
  };
}

export interface AreaHistorySummary {
  areaId: string;
  areaName: string;
  records: HistoricalTelemetryRecord[];
}
