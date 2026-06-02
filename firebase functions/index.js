const { onValueWritten } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

admin.initializeApp();

// Sensor alarm thresholds
const THRESHOLDS = {
  machine: { vibration: 5.0, current: 40.0, temperature: 75.0 },
  environment: { smoke: 400, temperature: 40.0 }
};

/**
 * Cloud Function that automatically triggers when any sensor value changes in Realtime Database.
 * Evaluates alarm thresholds and broadcasts FCM Push Notifications serverlessly!
 */
exports.evaluateTelemetryAndPush = onValueWritten({
  ref: "/areas/{areaId}"
}, async (event) => {
  const data = event.data.after.val();
  const previousData = event.data.before.val();

  if (!data) return null;

  const areaId = event.params.areaId;
  const areaName = data.area_name || "Industrial Area";

  const notificationsToSend = [];
  const currentCriticalKeys = [];

  // Helper to construct push messages
  const queueNotification = (sensorType, sensorLabel, value, limit, unit, message) => {
    notificationsToSend.push({
      title: `⚠️ Alert in ${areaName}!`,
      body: message,
      data: {
        areaId: areaId,
        areaName: areaName,
        sourceType: sensorType === 'smoke' || sensorType === 'flame' || sensorType === 'ambientTemp' ? 'environment' : 'machine',
        sensorType: sensorType,
        sensorLabel: sensorLabel,
        value: String(value),
        unit: unit
      }
    });
  };

  // 1. Evaluate Machine Sensors
  if (data.machine_health) {
    Object.keys(data.machine_health).forEach((mId) => {
      const machine = data.machine_health[mId];
      const prevMachine = previousData && previousData.machine_health ? previousData.machine_health[mId] : null;

      const vibration = Number(machine.vibration ?? 0);
      const prevVibration = prevMachine ? Number(prevMachine.vibration ?? 0) : 0;
      if (vibration > THRESHOLDS.machine.vibration && prevVibration <= THRESHOLDS.machine.vibration) {
        queueNotification('vibration', 'Vibration', vibration, THRESHOLDS.machine.vibration, 'g', `Machine Vibration limit crossed: ${vibration}g`);
      }

      const current = Number(machine.current ?? 0);
      const prevCurrent = prevMachine ? Number(prevMachine.current ?? 0) : 0;
      if (current > THRESHOLDS.machine.current && prevCurrent <= THRESHOLDS.machine.current) {
        queueNotification('current', 'Amperage Draw', current, THRESHOLDS.machine.current, 'A', `Machine Amperage Draw limit crossed: ${current}A`);
      }

      const temp = Number(machine.temp ?? 0);
      const prevTemp = prevMachine ? Number(prevMachine.temp ?? 0) : 0;
      if (temp > THRESHOLDS.machine.temperature && prevTemp <= THRESHOLDS.machine.temperature) {
        queueNotification('temperature', 'Motor Temperature', temp, THRESHOLDS.machine.temperature, '°C', `Machine Motor Temperature limit crossed: ${temp}°C`);
      }
    });
  }

  // 2. Evaluate Environmental Sensors
  if (data.environment) {
    Object.keys(data.environment).forEach((eId) => {
      const env = data.environment[eId];
      const prevEnv = previousData && previousData.environment ? previousData.environment[eId] : null;

      // Special evaluation: Flame Sensor (Boolean)
      if (env.flame === true && (!prevEnv || prevEnv.flame !== true)) {
        queueNotification('flame', 'Fire Detector', 'Detected', 0, '', `🔥 FIRE HAZARD DETECTED! Fire detector sensor triggered.`);
      }

      const smoke = Number(env.smoke ?? 0);
      const prevSmoke = prevEnv ? Number(prevEnv.smoke ?? 0) : 0;
      if (smoke > THRESHOLDS.environment.smoke && prevSmoke <= THRESHOLDS.environment.smoke) {
        queueNotification('smoke', 'Smoke Density', smoke, THRESHOLDS.environment.smoke, 'ppm', `Smoke Density limit crossed: ${smoke}ppm`);
      }

      const temp = Number(env.temp ?? 0);
      const prevTemp = prevEnv ? Number(prevEnv.temp ?? 0) : 0;
      if (temp > THRESHOLDS.environment.temperature && prevTemp <= THRESHOLDS.environment.temperature) {
        queueNotification('temperature', 'Ambient Temperature', temp, THRESHOLDS.environment.temperature, '°C', `Ambient Temperature limit crossed: ${temp}°C`);
      }
    });
  }

  // If no new edge-triggered alerts occurred, exit
  if (notificationsToSend.length === 0) return null;

  // 3. Fetch registered device tokens from Realtime Database
  const tokensSnapshot = await admin.database().ref("/fcm_tokens").once("value");
  const tokensData = tokensSnapshot.val();

  if (!tokensData) {
    console.log("No registered FCM device tokens found in /fcm_tokens.");
    return null;
  }

  const deviceTokens = Object.keys(tokensData);
  console.log(`Sending notifications to ${deviceTokens.length} active registered devices...`);

  // 4. Send background push payloads securely using Admin SDK
  const sendPromises = notificationsToSend.flatMap((notif) =>
    deviceTokens.map((token) => {
      const message = {
        token: token,
        notification: {
          title: notif.title,
          body: notif.body
        },
        data: notif.data,
        webpush: {
          notification: {
            icon: "/vite.svg",
            requireInteraction: true
          }
        }
      };
      return admin.messaging().send(message)
        .catch((err) => {
          // Clean up invalid or expired registration tokens automatically!
          if (err.code === "messaging/registration-token-not-registered") {
            return admin.database().ref(`/fcm_tokens/${token}`).remove();
          }
          console.error("Error sending FCM message to token:", token, err);
        });
    })
  );

  await Promise.all(sendPromises);
  return null;
});
