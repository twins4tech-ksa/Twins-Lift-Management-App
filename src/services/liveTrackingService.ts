/**
 * Twins Lift Manager - Live Technician GPS Tracking & Emergency Rescue Service
 * Features:
 * 1. Geolocation API (watchPosition) for continuous live coordinates
 * 2. Screen Wake Lock API to prevent device sleep while on emergency standby
 * 3. Web Audio API emergency alarm chime/siren (synthesized, zero external asset dependencies)
 * 4. Haversine distance & ETA calculations
 * 5. PWA background sync & duty status management
 */

export type TechnicianDutyStatus = 
  | 'ON_DUTY_AVAILABLE'      // متاح للمناوبة والتدخل السريع
  | 'DISPATCHED_TO_RESCUE'   // متوجه فوراً لحالة احتجاز مصعد
  | 'ON_SITE_RESCUING'       // وصل الموقع ويباشر فك الاحتجاز
  | 'OFF_DUTY';              // خارج المناوبة

export interface TechnicianLivePosition {
  latitude: number;
  longitude: number;
  accuracy: number;          // meters
  altitude?: number | null;
  speed?: number | null;     // m/s
  heading?: number | null;
  timestamp: number;
  isMocked?: boolean;
}

export interface LiveTrackingState {
  isTracking: boolean;
  dutyStatus: TechnicianDutyStatus;
  currentPosition: TechnicianLivePosition | null;
  wakeLockActive: boolean;
  assignedIncidentId: string | null;
  lastUpdated: number | null;
  errorMessage: string | null;
}

const STORAGE_KEY_DUTY_STATUS = 'twins_tech_duty_status';
const STORAGE_KEY_LAST_POS = 'twins_tech_last_pos';

type StateListener = (state: LiveTrackingState) => void;

class LiveTrackingService {
  private isTracking: boolean = false;
  private dutyStatus: TechnicianDutyStatus = 'ON_DUTY_AVAILABLE';
  private currentPosition: TechnicianLivePosition | null = null;
  private watchId: number | null = null;
  private wakeLock: any = null;
  private assignedIncidentId: string | null = null;
  private errorMessage: string | null = null;
  private listeners: Set<StateListener> = new Set();
  private audioCtx: AudioContext | null = null;
  private alarmOscillator: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private alarmInterval: any = null;
  private simulationInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedStatus = localStorage.getItem(STORAGE_KEY_DUTY_STATUS) as TechnicianDutyStatus;
        if (savedStatus) {
          this.dutyStatus = savedStatus;
        }
        const savedPos = localStorage.getItem(STORAGE_KEY_LAST_POS);
        if (savedPos) {
          this.currentPosition = JSON.parse(savedPos);
        }
      } catch (e) {
        console.warn('Could not read cached tracking state', e);
      }

      // Re-acquire screen wake lock on tab visibility change if tracking
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isTracking) {
          this.acquireWakeLock();
        }
      });
    }
  }

  public getState(): LiveTrackingState {
    return {
      isTracking: this.isTracking,
      dutyStatus: this.dutyStatus,
      currentPosition: this.currentPosition,
      wakeLockActive: !!this.wakeLock,
      assignedIncidentId: this.assignedIncidentId,
      lastUpdated: this.currentPosition?.timestamp || null,
      errorMessage: this.errorMessage,
    };
  }

  public subscribe(cb: StateListener): () => void {
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
        console.error('Tracking listener error:', err);
      }
    });
  }

  /**
   * Start Live GPS tracking with Screen Wake Lock
   */
  public async startTracking(): Promise<boolean> {
    if (this.isTracking) return true;
    this.errorMessage = null;

    // 1. Request Screen Wake Lock (prevents mobile phone screen from going dark)
    await this.acquireWakeLock();

    // 2. Setup Geolocation watcher
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        this.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            this.handlePositionUpdate({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
              timestamp: pos.timestamp,
              isMocked: false,
            });
          },
          (err) => {
            console.warn('Geolocation watch error:', err.message);
            // Fallback: If browser GPS permission denied or in preview iframe, start high-fidelity simulation in Riyadh
            this.startSimulatedPosition();
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 12000,
          }
        );
      } catch (e: any) {
        this.errorMessage = e.message || 'Geolocation initialization failed';
        this.startSimulatedPosition();
      }
    } else {
      this.startSimulatedPosition();
    }

    this.isTracking = true;
    this.notify();
    return true;
  }

  /**
   * Stop Live GPS tracking and release Screen Wake Lock
   */
  public stopTracking() {
    if (this.watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.releaseWakeLock();
    this.isTracking = false;
    this.notify();
  }

  public setDutyStatus(status: TechnicianDutyStatus, incidentId?: string | null) {
    this.dutyStatus = status;
    if (incidentId !== undefined) {
      this.assignedIncidentId = incidentId;
    }
    try {
      localStorage.setItem(STORAGE_KEY_DUTY_STATUS, status);
    } catch {}
    this.notify();
  }

  private handlePositionUpdate(pos: TechnicianLivePosition) {
    this.currentPosition = pos;
    try {
      localStorage.setItem(STORAGE_KEY_LAST_POS, JSON.stringify(pos));
    } catch {}
    this.notify();
  }

  /**
   * Screen Wake Lock API to prevent mobile screen sleep during emergency duty
   */
  private async acquireWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
          this.notify();
        });
      } catch (e) {
        console.warn('Wake Lock request error:', e);
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
  }

  /**
   * Realistic Riyadh center location simulation with small movement vectors
   * used when running inside preview iframes or when GPS permissions are blocked.
   */
  private startSimulatedPosition() {
    if (this.simulationInterval) return;
    // Default location: Riyadh King Fahd Road / Olaya area
    let lat = this.currentPosition?.latitude || 24.7136;
    let lng = this.currentPosition?.longitude || 46.6753;

    this.handlePositionUpdate({
      latitude: lat,
      longitude: lng,
      accuracy: 12,
      speed: 8.5, // ~30 km/h
      heading: 45,
      timestamp: Date.now(),
      isMocked: true,
    });

    this.simulationInterval = setInterval(() => {
      // Small drift simulating a technician moving along city roads
      lat += (Math.random() - 0.49) * 0.0004;
      lng += (Math.random() - 0.48) * 0.0004;
      this.handlePositionUpdate({
        latitude: lat,
        longitude: lng,
        accuracy: 8 + Math.round(Math.random() * 6),
        speed: 5 + Math.random() * 8,
        heading: Math.round(Math.random() * 360),
        timestamp: Date.now(),
        isMocked: true,
      });
    }, 4000);
  }

  /**
   * Web Audio API Emergency Siren (Zero external assets required)
   * High-urgency two-tone oscillating siren (880Hz / 660Hz)
   */
  public playEmergencyAlarm() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.stopEmergencyAlarm();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // High pitch

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();

      let isHigh = true;
      this.alarmInterval = setInterval(() => {
        if (!this.audioCtx || !osc) return;
        const targetFreq = isHigh ? 660 : 880;
        osc.frequency.linearRampToValueAtTime(targetFreq, this.audioCtx.currentTime + 0.15);
        isHigh = !isHigh;
      }, 350);

      this.alarmOscillator = osc;
      this.alarmGain = gain;
    } catch (err) {
      console.warn('Could not initialize emergency audio siren:', err);
    }
  }

  public stopEmergencyAlarm() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.alarmOscillator) {
      try {
        this.alarmOscillator.stop();
        this.alarmOscillator.disconnect();
      } catch {}
      this.alarmOscillator = null;
    }
    if (this.alarmGain) {
      try {
        this.alarmGain.disconnect();
      } catch {}
      this.alarmGain = null;
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers (Haversine Formula)
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Estimate Arrival Time (ETA) in minutes considering city driving speed (avg 35 km/h)
   */
  public static estimateEtaMinutes(distanceKm: number, averageSpeedKmh: number = 35): number {
    if (distanceKm <= 0.2) return 2; // Immediate arrival
    const hours = distanceKm / averageSpeedKmh;
    const mins = Math.ceil(hours * 60) + 3; // +3 minutes traffic/dispatch buffer
    return Math.max(3, mins);
  }

  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return LiveTrackingService.calculateDistanceKm(lat1, lon1, lat2, lon2);
  }
}

export { LiveTrackingService };
export const liveTrackingService = new LiveTrackingService();
