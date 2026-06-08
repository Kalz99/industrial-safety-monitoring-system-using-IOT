import { ref, onValue, set, update, push } from 'firebase/database';
import { database } from '../config/firebase';
import type { AreaTelemetry } from '../pages/dashboard/components/AreaCard';
import type { SensorStatus } from '../components/SensorLabel';


export class DashboardApiService {
  /**
   * Helper to map a nested Firebase Realtime Database Area record into AreaTelemetry UI format.
   */
  static mapFirebaseAreaToTelemetry(areaId: string, data: any): AreaTelemetry {
    const name = data.area_name || 'Unnamed Sector';
    
    // Extract machine health (vibration, current, temperature) from nested map
    let vibration = { value: 0, unit: 'g', status: 'normal' as SensorStatus };
    let current = { value: 0, unit: 'A', status: 'normal' as SensorStatus };
    let temperature = { value: 0, unit: '°C', status: 'normal' as SensorStatus };
    let machineId = 'machine-1'; // Fallback
    let machineAlerts = { vibration: false, current: false, temp: false, temperature: false };
    
    if (data.machine_health) {
      const keys = Object.keys(data.machine_health);
      if (keys.length > 0) {
        machineId = keys[0];
        const machine = data.machine_health[machineId];
        vibration.value = Number(machine.vibration ?? 0);
        current.value = Number(machine.current ?? 0);
        temperature.value = Number(machine.temp ?? 0);
        if (machine.alerts) {
          machineAlerts = { ...machineAlerts, ...machine.alerts };
        }
      }
    }
    
    // Extract environmental safety metrics (smoke, flame, temperature) from nested map
    let smoke = { value: 0, unit: 'ppm', status: 'normal' as SensorStatus };
    let flame = { value: 'None' as 'Detected' | 'None', status: 'normal' as SensorStatus };
    let envTemperature = { value: 0, unit: '°C', status: 'normal' as SensorStatus };
    let envId = 'env-1'; // Fallback
    let envAlerts = { smoke: false, fire: false, flame: false, temp: false, temperature: false };
    
    if (data.environment) {
      const keys = Object.keys(data.environment);
      if (keys.length > 0) {
        envId = keys[0];
        const env = data.environment[envId];
        smoke.value = Number(env.smoke ?? 0);
        flame.value = env.flame ? 'Detected' : 'None';
        envTemperature.value = Number(env.temp ?? 0);
        if (env.alerts) {
          envAlerts = { ...envAlerts, ...env.alerts };
        }
      }
    }

    // Determine statuses based on alerts in Firebase
    vibration.status = machineAlerts.vibration ? 'critical' : 'normal';
    current.status = machineAlerts.current ? 'critical' : 'normal';
    temperature.status = (machineAlerts.temperature || machineAlerts.temp) ? 'critical' : 'normal';
    smoke.status = envAlerts.smoke ? 'critical' : 'normal';
    flame.status = (envAlerts.fire || envAlerts.flame) ? 'critical' : 'normal';
    envTemperature.status = (envAlerts.temperature || envAlerts.temp) ? 'critical' : 'normal';

    const isCritical = 
      vibration.status === 'critical' ||
      current.status === 'critical' ||
      temperature.status === 'critical' ||
      smoke.status === 'critical' ||
      flame.status === 'critical' ||
      envTemperature.status === 'critical';


    // Store metadata so simulation or write-backs can refer to the correct keys
    return {
      id: areaId,
      name,
      status: isCritical ? 'critical' : 'normal',
      machineHealth: { vibration, current, temperature },
      environment: { smoke, flame, temperature: envTemperature },
      // Inject internal key details for dynamic mapping back to DB
      _meta: { machineId, envId }
    } as any;
  }

  /**
   * Seeds the Realtime Database with default structures if empty.
   */
  static async seedInitialSectors(initialData: AreaTelemetry[]): Promise<void> {
    try {
      const areasRef = ref(database, 'areas');
      
      const snapshot = await new Promise<any>((resolve, reject) => {
        onValue(areasRef, (snap) => resolve(snap), (err) => reject(err), { onlyOnce: true });
      });

      if (!snapshot.exists()) {
        console.log('Seeding initial sectors to Firebase Realtime Database...');
        const seedData: Record<string, any> = {};
        for (const sector of initialData) {
          seedData[sector.id] = {
            area_id: sector.id,
            area_name: sector.name,
            machine_health: {
              "machine-1": {
                machine_id: "machine-1",
                machine_name: "Machine 1",
                vibration: sector.machineHealth.vibration.value,
                current: sector.machineHealth.current.value,
                temp: sector.machineHealth.temperature.value
              }
            },
            environment: {
              "env-1": {
                env_id: "env-1",
                env_name: "Environment 1",
                smoke: sector.environment.smoke.value,
                flame: sector.environment.flame.value === 'Detected',
                temp: sector.environment.temperature.value
              }
            }
          };
        }
        await set(areasRef, seedData);
        console.log('Firebase Realtime Database successfully seeded.');
      }
    } catch (error) {
      console.error('Error seeding initial RTDB sectors:', error);
    }
  }

  /**
   * Subscribes to real-time updates for all sectors.
   * Returns an unsubscribe function.
   */
  static subscribeToSectors(onUpdate: (sectors: AreaTelemetry[]) => void): () => void {
    const areasRef = ref(database, 'areas');
    return onValue(areasRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        onUpdate([]);
        return;
      }
      
      const telemetryList: AreaTelemetry[] = Object.keys(data).map((key) => 
        this.mapFirebaseAreaToTelemetry(key, data[key])
      );
      onUpdate(telemetryList);
    }, (error) => {
      console.error('RTDB subscription error:', error);
    });
  }

  /**
   * Updates specific telemetry properties of a sector in RTDB.
   */
  static async updateSectorTelemetry(
    areaId: string, 
    machineId: string, 
    envId: string, 
    telemetry: AreaTelemetry
  ): Promise<void> {
    const dbUpdates: Record<string, any> = {};
    dbUpdates[`areas/${areaId}/machine_health/${machineId}/vibration`] = telemetry.machineHealth.vibration.value;
    dbUpdates[`areas/${areaId}/machine_health/${machineId}/current`] = telemetry.machineHealth.current.value;
    dbUpdates[`areas/${areaId}/machine_health/${machineId}/temp`] = telemetry.machineHealth.temperature.value;
    
    dbUpdates[`areas/${areaId}/environment/${envId}/smoke`] = telemetry.environment.smoke.value;
    dbUpdates[`areas/${areaId}/environment/${envId}/flame`] = telemetry.environment.flame.value === 'Detected';
    dbUpdates[`areas/${areaId}/environment/${envId}/temp`] = telemetry.environment.temperature.value;

    await update(ref(database), dbUpdates);
  }

  /**
   * Generates a unique Firebase push key for alert reference synchronously.
   */
  static generateAlertId(): string {
    return push(ref(database, 'alerts')).key || '';
  }

  /**
   * Logs a critical alert to the Realtime Database under /alerts using a push key.
   */
  static async logAlertRecord(alertInfo: {
    alertId: string;
    areaId: string;
    sourceType: 'machine' | 'environment';
    sensorName: string;
    value: string | number;
  }): Promise<void> {
    try {
      const alertRef = ref(database, `alerts/${alertInfo.alertId}`);

      // Look up corresponding machineId / envId from areas list
      const areaSnapshot = await new Promise<any>((resolve, reject) => {
        onValue(ref(database, `areas/${alertInfo.areaId}`), (snap) => resolve(snap), (err) => reject(err), { onlyOnce: true });
      });

      const areaData = areaSnapshot.val();
      let machineId = null;
      let envId = null;

      if (areaData) {
        if (alertInfo.sourceType === 'machine' && areaData.machine_health) {
          machineId = Object.keys(areaData.machine_health)[0] || 'machine-1';
        } else if (alertInfo.sourceType === 'environment' && areaData.environment) {
          envId = Object.keys(areaData.environment)[0] || 'env-1';
        }
      }

      await set(alertRef, {
        alertId: alertInfo.alertId,
        areaId: alertInfo.areaId,
        machineId: machineId,
        envId: envId,
        sensorName: alertInfo.sensorName,
        value: String(alertInfo.value),
        status: 'Alert Triggered', // Initial safety trigger state
        timestamp: Date.now()
      });
      console.log(`Alert ${alertInfo.alertId} successfully logged to RTDB under /alerts.`);
    } catch (error) {
      console.error('Failed to log alert to RTDB:', error);
    }
  }

  /**
   * Updates the status of an existing alert (e.g. to 'Acknowledged') in the Realtime Database.
   */
  static async updateAlertStatus(alertId: string, status: string): Promise<void> {
    try {
      const alertStatusRef = ref(database, `alerts/${alertId}/status`);
      await set(alertStatusRef, status);
      console.log(`Alert ${alertId} status successfully updated to: ${status}`);
    } catch (error) {
      console.error(`Failed to update status for alert ${alertId}:`, error);
    }
  }

  /**
   * Fetches any active unacknowledged alerts (status 'Alert Triggered') from RTDB once.
   */
  static async fetchUnacknowledgedAlerts(): Promise<any[]> {
    try {
      const alertsRef = ref(database, 'alerts');
      const snapshot = await new Promise<any>((resolve, reject) => {
        onValue(alertsRef, (snap) => resolve(snap), (err) => reject(err), { onlyOnce: true });
      });

      const data = snapshot.val();
      if (!data) return [];

      return Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .filter((a) => a.status === 'Alert Triggered')
        .sort((a, b) => b.timestamp - a.timestamp); // Newest first
    } catch (error) {
      console.error('Failed to fetch unacknowledged alerts from RTDB:', error);
      return [];
    }
  }



  /**
   * Subscribes to real-time chronological alert logs from `/alerts` node in RTDB.
   * Returns an unsubscribe function.
   */
  static subscribeToAlertLogs(onUpdate: (alerts: any[]) => void): () => void {
    const alertsRef = ref(database, 'alerts');
    return onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        onUpdate([]);
        return;
      }
      const rawAlerts = Object.keys(data).map((key) => ({
        id: key,
        ...data[key]
      }));
      // Sort in reverse chronological order (newest first)
      rawAlerts.sort((a, b) => b.timestamp - a.timestamp);
      onUpdate(rawAlerts);
    }, (error) => {
      console.error('Alerts subscription error:', error);
    });
  }
}
export default DashboardApiService;


