import { TableClient, AzureSASCredential } from "@azure/data-tables";

export interface SensorReading {
  partitionKey: string;
  rowKey: string;
  timestamp: Date;
  timestampUtc?: string;
  deviceType: "machine_sensor" | "environmental_sensor";
  areaId: string;
  temperature?: number;
  current?: number;
  vibration?: number;
  smoke?: number;
  humidity?: number;
  alertCurrent?: boolean;
  alertTemperature?: boolean;
  alertVibration?: boolean;
  alertFire?: boolean;
  light?: number;
}

class TableStorageService {
  private client: TableClient;

  constructor() {
    const accountName = "industrialsensorstore";
    const rawSasToken = import.meta.env.VITE_TABLE_SAS_TOKEN || "";
    const sasToken = rawSasToken.replace(/^"|"$/g, "");
    const tableName = "NodeHistory";

    const credential = new AzureSASCredential(sasToken);
    this.client = new TableClient(
      `https://${accountName}.table.core.windows.net`,
      tableName,
      credential
    );
  }

  /**
   * Get recent readings for a specific area and device type
   */
  async getRecentReadings(
    areaId: string,
    deviceType: "machine_sensor" | "environmental_sensor",
    hours: number = 24,
    startTimeMs?: number,
    endTimeMs?: number
  ): Promise<SensorReading[]> {
    const MAX_TICKS = 8640000000000000;
    let filterString = "";

    if (startTimeMs !== undefined && endTimeMs !== undefined) {
      const startInverted = MAX_TICKS - startTimeMs;
      const endInverted = MAX_TICKS - endTimeMs;
      filterString = `PartitionKey eq '${areaId}' and RowKey ge '${endInverted}' and RowKey le '${startInverted}'`;

      console.log("🔍 Querying Table Storage by Date Range:", {
        areaId,
        deviceType,
        startTime: new Date(startTimeMs).toISOString(),
        endTime: new Date(endTimeMs).toISOString(),
        startInverted,
        endInverted
      });
    } else {
      const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
      const cutoffInverted = MAX_TICKS - cutoffTime;
      filterString = `PartitionKey eq '${areaId}' and RowKey le '${cutoffInverted}'`;

      console.log("🔍 Querying Table Storage by Hours:", {
        areaId,
        deviceType,
        hours,
        cutoffTime: new Date(cutoffTime).toISOString(),
        cutoffInverted
      });
    }

    const entities: SensorReading[] = [];
    const query = this.client.listEntities({
      queryOptions: {
        filter: filterString
      }
    });

    for await (const entity of query) {
      // Convert RowKey back to timestamp (fallback)
      const entityTimestamp = MAX_TICKS - parseInt(entity.rowKey as string);
      const timestampUtcStr = entity.TimestampUTC as string | undefined;
      const resolvedDate = timestampUtcStr ? new Date(timestampUtcStr) : new Date(entityTimestamp);

      // ✅ FIX 2: Use correct column names from Table Storage (capitalized)
      const entityDeviceType = entity.DeviceType as string;
      const entityAreaId = entity.AreaId as string;

      // Only include matching device type
      if (entityDeviceType === deviceType) {
        entities.push({
          partitionKey: entity.partitionKey as string,
          rowKey: entity.rowKey as string,
          timestamp: resolvedDate,
          timestampUtc: timestampUtcStr,
          deviceType: entityDeviceType as any,
          areaId: entityAreaId,
          // Convert potential BigInt fields safely to JavaScript numbers
          temperature: entity.Temperature !== undefined ? Number(entity.Temperature) : undefined,
          current: entity.Current !== undefined ? Number(entity.Current) : undefined,
          vibration: entity.Vibration !== undefined ? Number(entity.Vibration) : undefined,
          smoke: entity.Smoke !== undefined ? Number(entity.Smoke) : undefined,
          humidity: entity.Humidity !== undefined ? Number(entity.Humidity) : undefined,
          alertCurrent: entity.AlertCurrent as boolean | undefined,
          alertTemperature: entity.AlertTemperature as boolean | undefined,
          alertVibration: entity.AlertVibration as boolean | undefined,
          alertFire: entity.AlertFire as boolean | undefined,
          light: entity.Light !== undefined ? Number(entity.Light) : undefined
        });
      }
    }

    // ✅ FIX 4: Sort by timestamp ascending (oldest to newest for charts)
    return entities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Calculate 24-hour average for a specific metric
   */
  async get24HourAverage(
    areaId: string,
    deviceType: "machine_sensor" | "environmental_sensor",
    metric: "temperature" | "current" | "vibration" | "smoke"
  ): Promise<number> {
    const readings = await this.getRecentReadings(areaId, deviceType, 24);

    const validReadings = readings
      .filter(r => r[metric] !== undefined && r[metric] !== null)
      .map(r => r[metric] as number);

    if (validReadings.length === 0) return 0;

    const sum = validReadings.reduce((a, b) => a + b, 0);
    return sum / validReadings.length;
  }

  /**
   * Get peak value for a specific metric in last 24 hours
   */
  async getPeakValue(
    areaId: string,
    deviceType: "machine_sensor" | "environmental_sensor",
    metric: "temperature" | "current" | "vibration" | "smoke"
  ): Promise<number> {
    const readings = await this.getRecentReadings(areaId, deviceType, 24);

    const validReadings = readings
      .filter(r => r[metric] !== undefined && r[metric] !== null)
      .map(r => r[metric] as number);

    if (validReadings.length === 0) return 0;

    return Math.max(...validReadings);
  }

  /**
   * Get chart data for the last N hours
   */
  async getChartData(
    areaId: string,
    deviceType: "machine_sensor" | "environmental_sensor",
    hours: number = 24
  ): Promise<{ timestamp: Date; temperature?: number; current?: number; vibration?: number; smoke?: number }[]> {
    const readings = await this.getRecentReadings(areaId, deviceType, hours);

    return readings.map(r => ({
      timestamp: r.timestamp,
      temperature: r.temperature,
      current: r.current,
      vibration: r.vibration,
      smoke: r.smoke
    }));
  }
}

export const tableStorage = new TableStorageService();