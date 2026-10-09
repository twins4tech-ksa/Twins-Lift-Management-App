import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  isAr?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isAr = true }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside 
      aria-label={isAr ? 'تنبيه حالة عدم الاتصال' : 'Offline Status Alert'}
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white shadow-xl shadow-amber-900/30 border border-amber-400/40 animate-bounce duration-1000"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 text-amber-100 shrink-0" />
      <span>
        {isAr 
          ? 'وضع العمل دون إنترنت نشط — البيانات محفوظة محلياً (آمن في بئر أو بدروم المصعد)' 
          : 'Offline Mode Active — Cached safely for elevator shafts & basements'}
      </span>
    </aside>
  );
};
