import { useEffect, useState } from 'react';

// Shared state for simulated offline mode (e.g. basement/elevator shaft testing)
let simulatedOffline = false;
const listeners = new Set<(online: boolean) => void>();

export function setSimulatedOffline(val: boolean) {
  simulatedOffline = val;
  const current = val ? false : (typeof navigator !== 'undefined' ? navigator.onLine : true);
  listeners.forEach((cb) => {
    try {
      cb(current);
    } catch (e) {
      console.error(e);
    }
  });
}

export function isSimulatedOfflineActive(): boolean {
  return simulatedOffline;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (simulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleStatus = () => {
      if (simulatedOffline) {
        setIsOnline(false);
      } else {
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      }
    };

    listeners.add(handleStatus);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    return () => {
      listeners.delete(handleStatus);
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  return isOnline;
}

