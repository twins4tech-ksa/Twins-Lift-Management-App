/**
 * Twins Lift Manager - Native Capacitor & Hybrid Mobile Integration Service
 * Bridges Web/PWA with native Android (APK) and iOS platforms.
 * 
 * Capabilities:
 * - Seamless runtime detection (Web / Android / iOS)
 * - Firebase Cloud Messaging (FCM) Push Notifications for code-red rescue alerts
 * - Local Notifications with high-priority sound and vibration
 * - Native Geolocation with high-accuracy GPS
 * - Deep background lifecycle management
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications, PushNotificationSchema, ActionPerformed, Token } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation, Position } from '@capacitor/geolocation';
import { App as CapApp, AppState } from '@capacitor/app';

export interface NativeCapacitorState {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  fcmToken: string | null;
  pushPermissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';
  isListeningToPush: boolean;
  lastNotificationReceived: PushNotificationSchema | null;
}

const STORAGE_KEY_FCM_TOKEN = 'twins_fcm_push_token';

type NativeStateListener = (state: NativeCapacitorState) => void;

class NativeCapacitorService {
  private isNative: boolean = false;
  private platform: 'android' | 'ios' | 'web' = 'web';
  private fcmToken: string | null = null;
  private pushPermissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';
  private isListeningToPush: boolean = false;
  private lastNotificationReceived: PushNotificationSchema | null = null;
  private listeners: Set<NativeStateListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.isNative = Capacitor.isNativePlatform();
      this.platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';

      try {
        const cached = localStorage.getItem(STORAGE_KEY_FCM_TOKEN);
        if (cached) {
          this.fcmToken = cached;
        }
      } catch (e) {
        console.warn('Could not read cached FCM token', e);
      }

      // Initialize native lifecycle listeners if on native device
      if (this.isNative) {
        this.setupNativeLifecycle();
      }
    }
  }

  public getState(): NativeCapacitorState {
    return {
      isNative: this.isNative,
      platform: this.platform,
      fcmToken: this.fcmToken,
      pushPermissionStatus: this.pushPermissionStatus,
      isListeningToPush: this.isListeningToPush,
      lastNotificationReceived: this.lastNotificationReceived,
    };
  }

  public subscribe(cb: NativeStateListener): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const st = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(st);
      } catch (err) {
        console.error('Native Capacitor listener error:', err);
      }
    });
  }

  /**
   * Initialize FCM Push Notifications
   * Works natively on Android / iOS and falls back to Web Push API on browsers.
   */
  public async initPushNotifications(): Promise<boolean> {
    if (!this.isNative) {
      // In web browser, check standard Notification API
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const perm = await Notification.requestPermission();
          this.pushPermissionStatus = perm === 'granted' ? 'granted' : 'denied';
          this.notify();
          return perm === 'granted';
        } catch (e) {
          this.pushPermissionStatus = 'unsupported';
          this.notify();
          return false;
        }
      }
      this.pushPermissionStatus = 'unsupported';
      this.notify();
      return false;
    }

    try {
      // Request permission via Capacitor plugin
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive === 'granted') {
        this.pushPermissionStatus = 'granted';

        // Register device with APNs / FCM
        await PushNotifications.register();

        if (!this.isListeningToPush) {
          // Token generated
          await PushNotifications.addListener('registration', (token: Token) => {
            this.fcmToken = token.value;
            try {
              localStorage.setItem(STORAGE_KEY_FCM_TOKEN, token.value);
            } catch {}
            this.notify();
          });

          // Registration error
          await PushNotifications.addListener('registrationError', (err: any) => {
            console.error('FCM registration error:', err);
          });

          // Notification received in foreground
          await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            this.lastNotificationReceived = notification;
            this.notify();

            // Trigger sound & alert
            this.triggerLocalEmergencyNotification(
              notification.title || '🚨 بلاغ طوارئ مصعد عاجل',
              notification.body || 'يوجد بلاغ طوارئ جديد يتطلب استجابتك الفورية'
            );
          });

          // Action performed (user clicked notification)
          await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
            console.log('Push notification action performed:', notification.actionId, notification.inputValue);
            const data = notification.notification.data;
            if (data?.incidentId || data?.breakdownId) {
              window.dispatchEvent(new CustomEvent('twins:open-rescue-incident', {
                detail: { incidentId: data.incidentId || data.breakdownId }
              }));
            }
          });

          this.isListeningToPush = true;
        }

        this.notify();
        return true;
      } else {
        this.pushPermissionStatus = 'denied';
        this.notify();
        return false;
      }
    } catch (err) {
      console.error('Push notification setup failed:', err);
      this.pushPermissionStatus = 'denied';
      this.notify();
      return false;
    }
  }

  /**
   * Trigger high-urgency local notification with sound & vibration
   */
  public async triggerLocalEmergencyNotification(title: string, body: string, incidentId?: string): Promise<void> {
    if (this.isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now() % 100000,
              title,
              body,
              sound: 'emergency_siren.wav',
              extra: { incidentId },
              actionTypeId: 'EMERGENCY_RESCUE',
              schedule: { at: new Date(Date.now() + 100) },
            },
          ],
        });
      } catch (err) {
        console.warn('LocalNotifications plugin error:', err);
      }
    } else {
      // Web Notification fallback
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/twins_logo.png',
            badge: '/twins_logo.png',
            tag: 'emergency-rescue',
            requireInteraction: true,
          });
        } catch {}
      }
    }
  }

  /**
   * Native high-accuracy GPS location
   */
  public async getNativeLocation(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
    try {
      const pos: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      });

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch (e) {
      console.warn('Native GPS retrieval error:', e);
      return null;
    }
  }

  /**
   * Native App Lifecycle
   */
  private setupNativeLifecycle() {
    CapApp.addListener('appStateChange', (state: AppState) => {
      console.log('Capacitor App state changed. isActive:', state.isActive);
      if (state.isActive) {
        // App resumed to foreground: refresh location and sync pending records
        window.dispatchEvent(new CustomEvent('twins:app-resumed'));
      }
    });
  }
}

export const nativeCapacitorService = new NativeCapacitorService();
