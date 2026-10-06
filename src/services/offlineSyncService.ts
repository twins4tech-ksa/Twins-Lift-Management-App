import { Sbc801InspectionReport } from '../types/inspection';

const OFFLINE_REPORTS_KEY = 'twins_offline_sbc801_inspections';
const OFFLINE_BREAKDOWNS_KEY = 'twins_offline_breakdowns';

export interface OfflineSyncStatus {
  pendingReportsCount: number;
  pendingBreakdownsCount: number;
  lastSyncTimestamp: string | null;
  isSyncing: boolean;
}

type SyncListener = (status: OfflineSyncStatus) => void;
const listeners: Set<SyncListener> = new Set();

function notifyListeners(status: OfflineSyncStatus) {
  listeners.forEach((listener) => {
    try {
      listener(status);
    } catch (e) {
      console.error('Error notifying sync listener', e);
    }
  });
}

export const offlineSyncService = {
  // 1. Get all pending offline reports
  getOfflineReports(): Sbc801InspectionReport[] {
    try {
      const data = localStorage.getItem(OFFLINE_REPORTS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse offline reports', err);
      return [];
    }
  },

  // 2. Save a report offline
  saveReportOffline(report: Sbc801InspectionReport): void {
    try {
      const existing = this.getOfflineReports();
      const filtered = existing.filter((r) => r.id !== report.id);
      const updated = [
        {
          ...report,
          isSynced: false,
          isOfflineCreated: true,
          savedOfflineAt: new Date().toISOString(),
        },
        ...filtered,
      ];
      localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(updated));
      this.broadcastStatus();
    } catch (err) {
      console.error('Failed to save report offline', err);
    }
  },

  // 3. Remove a synced report from offline queue
  removeOfflineReport(id: string): void {
    try {
      const existing = this.getOfflineReports();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(updated));
      this.broadcastStatus();
    } catch (err) {
      console.error('Failed to remove offline report', err);
    }
  },

  // 4. Mark report as synced and store into main permanent reports store
  markReportAsSynced(id: string): void {
    try {
      const existing = this.getOfflineReports();
      const target = existing.find((r) => r.id === id);
      if (!target) return;

      // Add to permanent inspection reports
      const permanentKey = 'twins_sbc801_all_reports';
      const permanentData = localStorage.getItem(permanentKey);
      const permanentList: Sbc801InspectionReport[] = permanentData ? JSON.parse(permanentData) : [];
      const updatedPermanent = [
        {
          ...target,
          isSynced: true,
          syncedAt: new Date().toISOString(),
        },
        ...permanentList.filter((r) => r.id !== id),
      ];
      localStorage.setItem(permanentKey, JSON.stringify(updatedPermanent));

      // Remove from pending offline queue
      this.removeOfflineReport(id);
    } catch (err) {
      console.error('Failed to mark report as synced', err);
    }
  },

  // 5. Sync all pending items
  async syncAll(): Promise<{ syncedCount: number }> {
    const reports = this.getOfflineReports();
    if (reports.length === 0) {
      return { syncedCount: 0 };
    }

    notifyListeners({
      ...this.getStatus(),
      isSyncing: true,
    });

    let syncedCount = 0;
    for (const report of reports) {
      // Simulate remote sync / API POST
      await new Promise((resolve) => setTimeout(resolve, 200));
      this.markReportAsSynced(report.id);
      syncedCount++;
    }

    const now = new Date().toISOString();
    localStorage.setItem('twins_last_sync_timestamp', now);

    notifyListeners({
      pendingReportsCount: 0,
      pendingBreakdownsCount: 0,
      lastSyncTimestamp: now,
      isSyncing: false,
    });

    return { syncedCount };
  },

  // 6. Get overall status
  getStatus(): OfflineSyncStatus {
    const reports = this.getOfflineReports();
    const lastSync = localStorage.getItem('twins_last_sync_timestamp');
    return {
      pendingReportsCount: reports.length,
      pendingBreakdownsCount: 0,
      lastSyncTimestamp: lastSync,
      isSyncing: false,
    };
  },

  broadcastStatus(): void {
    notifyListeners(this.getStatus());
  },

  subscribe(listener: SyncListener): () => void {
    listeners.add(listener);
    listener(this.getStatus());
    return () => {
      listeners.delete(listener);
    };
  },
};
