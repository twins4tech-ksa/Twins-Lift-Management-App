import { useState, useEffect } from 'react';
import { liveTrackingService, LiveTrackingState, TechnicianDutyStatus } from '../services/liveTrackingService';

export function useLiveTracking() {
  const [state, setState] = useState<LiveTrackingState>(() => liveTrackingService.getState());

  useEffect(() => {
    const unsubscribe = liveTrackingService.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  const startTracking = async () => {
    return await liveTrackingService.startTracking();
  };

  const stopTracking = () => {
    liveTrackingService.stopTracking();
  };

  const setDutyStatus = (status: TechnicianDutyStatus, incidentId?: string | null) => {
    liveTrackingService.setDutyStatus(status, incidentId);
  };

  const playEmergencyAlarm = () => {
    liveTrackingService.playEmergencyAlarm();
  };

  const stopEmergencyAlarm = () => {
    liveTrackingService.stopEmergencyAlarm();
  };

  return {
    ...state,
    startTracking,
    stopTracking,
    setDutyStatus,
    playEmergencyAlarm,
    stopEmergencyAlarm,
  };
}
