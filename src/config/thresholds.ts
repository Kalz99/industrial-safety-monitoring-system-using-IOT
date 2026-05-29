/**
 * Industrial Safety Monitoring System - Sensor Alarm Thresholds
 * 
 * Modify these constants to customize when sensor metrics trigger critical warnings.
 */
export const SENSOR_THRESHOLDS = {
  // Machine Health Thresholds
  machine: {
    vibration: 5.0,   // Max safe vibration in 'g'
    current: 40.0,    // Max safe current draw in 'A'
    temperature: 75.0  // Max safe motor temperature in '°C'
  },
  
  // Environmental Safety Thresholds
  environment: {
    smoke: 400,       // Max safe smoke density in 'ppm'
    temperature: 40.0  // Max safe ambient temperature in '°C'
  }
};

export default SENSOR_THRESHOLDS;
