import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineSyncService, OfflineSyncStatus } from '../services/offlineSyncService';

interface OfflineSyncBannerProps {
  isAr?: boolean;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ isAr = true }) => {
  const isOnline = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<OfflineSyncStatus>(offlineSyncService.getStatus());
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  // When coming back online, auto-sync if items are pending
  useEffect(() => {
    if (isOnline && syncStatus.pendingReportsCount > 0 && !syncStatus.isSyncing) {
      handleSync();
    }
  }, [isOnline]);

  const handleSync = async () => {
    try {
      const res = await offlineSyncService.syncAll();
      if (res.syncedCount > 0) {
        setSyncSuccessMsg(
          isAr
            ? `تمت مزامنة ${res.syncedCount} تقرير بنجاح مع السيرفر الرئيسي!`
            : `Successfully synced ${res.syncedCount} reports!`
        );
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error('Sync failed', e);
    }
  };

  const hasPending = syncStatus.pendingReportsCount > 0;

  // If online and nothing pending and no success message, render nothing
  if (isOnline && !hasPending && !syncSuccessMsg) {
    return null;
  }

  return (
    <aside aria-label={isAr ? 'حالة الاتصال والمزامنة' : 'Connection and sync status'} className="no-print w-full z-40 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* 1. Offline Mode Active Notice */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
            <WifiOff className="w-4 h-4 text-amber-200" />
            <span>
              {isAr
                ? 'وضع عدم الاتصال نشط (Offline) — يمكنك إتمام فحص المصعد وحفظ التوقيع، وسيتم الحفظ محلياً'
                : 'Offline Mode Active — You can inspect elevator & sign, data is saved locally'}
            </span>
          </div>

          {hasPending && (
            <span className="bg-amber-900/60 px-2 py-0.5 rounded-full text-[10px] text-amber-200 border border-amber-500/40">
              {isAr ? `${syncStatus.pendingReportsCount} فحص بانتظار المزامنة` : `${syncStatus.pendingReportsCount} queued`}
            </span>
          )}
        </div>
      )}

      {/* 2. Online with pending queue to sync */}
      {isOnline && hasPending && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-300" />
            <span>
              {isAr
                ? `عادت إشارة الإنترنت! توجد (${syncStatus.pendingReportsCount}) تقارير مسجلة في الآبار جاهزة للمزامنة`
                : `Back online! (${syncStatus.pendingReportsCount}) offline reports are ready to sync`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            className="px-3 py-1 bg-white text-blue-900 rounded-lg text-xs font-black hover:bg-blue-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <CloudUpload className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-bounce' : ''}`} />
            <span>{syncStatus.isSyncing ? (isAr ? 'جاري المزامنة...' : 'Syncing...') : (isAr ? 'مزامنة الآن' : 'Sync Now')}</span>
          </button>
        </div>
      )}

      {/* 3. Sync success toast */}
      {syncSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-bold shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}
    </aside>
  );
};
