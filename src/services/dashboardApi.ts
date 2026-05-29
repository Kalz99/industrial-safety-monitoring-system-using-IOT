import { ref, onValue, set, update } from 'firebase/database';
import { database } from '../config/firebase';
import { SENSOR_THRESHOLDS } from '../config/thresholds';
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
    
    if (data.machine_health) {
      const keys = Object.keys(data.machine_health);
      if (keys.length > 0) {
        machineId = keys[0];
        const machine = data.machine_health[machineId];
        vibration.value = Number(machine.vibration ?? 0);
        current.value = Number(machine.current ?? 0);
        temperature.value = Number(machine.temp ?? 0);
      }
    }
    
    // Extract environmental safety metrics (smoke, flame, temperature) from nested map
    let smoke = { value: 0, unit: 'ppm', status: 'normal' as SensorStatus };
    let flame = { value: 'None' as 'Detected' | 'None', status: 'normal' as SensorStatus };
    let envTemperature = { value: 0, unit: '°C', status: 'normal' as SensorStatus };
    let envId = 'env-1'; // Fallback
    
    if (data.environment) {
      const keys = Object.keys(data.environment);
      if (keys.length > 0) {
        envId = keys[0];
        const env = data.environment[envId];
        smoke.value = Number(env.smoke ?? 0);
        flame.value = env.flame ? 'Detected' : 'None';
        envTemperature.value = Number(env.temp ?? 0);
      }
    }

    // Determine statuses based on industrial standards/thresholds from config
    vibration.status = vibration.value > SENSOR_THRESHOLDS.machine.vibration ? 'critical' : 'normal';
    current.status = current.value > SENSOR_THRESHOLDS.machine.current ? 'critical' : 'normal';
    temperature.status = temperature.value > SENSOR_THRESHOLDS.machine.temperature ? 'critical' : 'normal';
    smoke.status = smoke.value > SENSOR_THRESHOLDS.environment.smoke ? 'critical' : 'normal';
    flame.status = flame.value === 'Detected' ? 'critical' : 'normal';
    envTemperature.status = envTemperature.value > SENSOR_THRESHOLDS.environment.temperature ? 'critical' : 'normal';

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
}
export default DashboardApiService;


