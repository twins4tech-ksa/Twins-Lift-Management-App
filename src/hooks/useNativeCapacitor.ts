import { useState, useEffect } from 'react';
import { nativeCapacitorService, NativeCapacitorState } from '../services/nativeCapacitorService';

export function useNativeCapacitor() {
  const [state, setState] = useState<NativeCapacitorState>(() => nativeCapacitorService.getState());

  useEffect(() => {
    const unsub = nativeCapacitorService.subscribe(setState);
    return unsub;
  }, []);

  const initPushNotifications = async () => {
    return await nativeCapacitorService.initPushNotifications();
  };

  const triggerLocalEmergencyNotification = async (title: string, body: string, incidentId?: string) => {
    return await nativeCapacitorService.triggerLocalEmergencyNotification(title, body, incidentId);
  };

  const getNativeLocation = async () => {
    return await nativeCapacitorService.getNativeLocation();
  };

  return {
    ...state,
    initPushNotifications,
    triggerLocalEmergencyNotification,
    getNativeLocation,
  };
}
