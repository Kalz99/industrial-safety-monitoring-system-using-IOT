import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../config/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export class PushNotificationService {
  /**
   * Requests browser permission for native operating system push notifications
   * and retrieves the unique FCM registration token.
   */
  static async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      // Check if browser supports Service Workers and Messaging
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('FCM Background notifications are not supported in this browser.');
        return null;
      }

      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        
        console.log('Registering modern Firebase Service Worker from TS...');
        const registration = await navigator.serviceWorker.register(
          new URL('../firebase-messaging-sw.ts', import.meta.url),
          { type: 'module' }
        );
        
        const messaging = getMessaging(app);
        
        // Fetch the unique device token using the custom service worker registration
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY || undefined,
          serviceWorkerRegistration: registration
        });

        if (token) {
          console.log('\n\x1b[32m✔ FCM Registration Token successfully fetched:\x1b[0m');
          console.log(token);

          // Auto-register token in RTDB so serverless Cloud Functions can broadcast pushes to it!
          try {
            const { ref: dbRef, set: dbSet } = await import('firebase/database');
            const { database } = await import('../config/firebase');
            // Sanitize key characters for firebase node safety
            const safeTokenKey = token.replace(/[\.\$\#\[\]\/]/g, '_');
            await dbSet(dbRef(database, `fcm_tokens/${safeTokenKey}`), {
              token: token,
              registeredAt: Date.now()
            });
            console.log('FCM Device Token successfully registered in Realtime Database.');
          } catch (dbErr) {
            console.error('Failed to auto-register FCM token in database:', dbErr);
          }

          return token;
        } else {
          console.warn('No registration token available. Request permission or generate VAPID Key pair.');
          return null;
        }

      } else {
        console.warn('Notification permission was denied by the user.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving the FCM token:', error);
      return null;
    }
  }

  /**
   * Listens to foreground push notifications when the browser tab is open and focused.
   */
  static listenToForegroundMessages(onNotification: (payload: any) => void): () => void {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return () => {};
      }
      const messaging = getMessaging(app);
      return onMessage(messaging, (payload) => {
        console.log('Foreground push notification received:', payload);
        onNotification(payload);
      });
    } catch (error) {
      console.error('Error setting up foreground message listener:', error);
      return () => {};
    }
  }
}

export default PushNotificationService;
