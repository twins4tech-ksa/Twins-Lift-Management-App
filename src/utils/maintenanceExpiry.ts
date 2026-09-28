import { MaintenanceContract } from '../types/maintenance';

export interface ContractExpiryInfo {
  diffDays: number;
  isExpiringSoon: boolean; // 0 <= diffDays <= 30
  isExpired: boolean;      // diffDays < 0
  isToday: boolean;        // diffDays === 0
  urgency: 'critical' | 'warning' | 'normal' | 'expired';
  badgeTextAr: string;
  badgeTextEn: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * Calculates the expiration status of a maintenance contract based on its service end date.
 */
export function getContractExpiryInfo(
  contract: { endDate?: string; isContract?: boolean; status?: string },
  daysThreshold: number = 30
): ContractExpiryInfo | null {
  if (!contract.endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = contract.endDate.split('-');
  if (parts.length !== 3) return null;

  const end = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  end.setHours(0, 0, 0, 0);

  if (isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isToday = diffDays === 0;
  const isExpiringSoon = diffDays >= 0 && diffDays <= daysThreshold;
  const isExpired = diffDays < 0;

  let urgency: ContractExpiryInfo['urgency'] = 'normal';
  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-400';

  if (isExpired) {
    urgency = 'expired';
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
    dotClass = 'bg-rose-500';
  } else if (diffDays <= 7) {
    urgency = 'critical';
    badgeClass = 'bg-red-100 text-red-800 border-red-300 animate-pulse';
    dotClass = 'bg-red-600';
  } else if (diffDays <= daysThreshold) {
    urgency = 'warning';
    badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    dotClass = 'bg-amber-500';
  } else {
    urgency = 'normal';
    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotClass = 'bg-emerald-500';
  }

  let badgeTextAr = '';
  let badgeTextEn = '';

  if (isToday) {
    badgeTextAr = 'ينتهي اليوم!';
    badgeTextEn = 'Expires Today!';
  } else if (isExpiringSoon) {
    if (diffDays === 1) {
      badgeTextAr = 'ينتهي غداً (يوم واحد)';
      badgeTextEn = 'Expires tomorrow (1 day)';
    } else if (diffDays === 2) {
      badgeTextAr = 'ينتهي خلال يومين';
      badgeTextEn = 'Expires in 2 days';
    } else if (diffDays <= 10) {
      badgeTextAr = `ينتهي خلال ${diffDays} أيام`;
      badgeTextEn = `Expires in ${diffDays} days`;
    } else {
      badgeTextAr = `ينتهي خلال ${diffDays} يوماً`;
      badgeTextEn = `Expires in ${diffDays} days`;
    }
  } else if (isExpired) {
    const pastDays = Math.abs(diffDays);
    badgeTextAr = `منتهي منذ ${pastDays} يوم`;
    badgeTextEn = `Expired ${pastDays}d ago`;
  } else {
    badgeTextAr = `متبقي ${diffDays} يوماً`;
    badgeTextEn = `${diffDays} days left`;
  }

  return {
    diffDays,
    isExpiringSoon,
    isExpired,
    isToday,
    urgency,
    badgeTextAr,
    badgeTextEn,
    badgeClass,
    dotClass,
  };
}

/**
 * Filter contracts that are expiring within the specified days (default: 30 days).
 */
export function getExpiringContracts(
  contracts: MaintenanceContract[],
  daysThreshold: number = 30
): MaintenanceContract[] {
  return contracts.filter((c) => {
    // We consider active or approved contracts that have an end date
    if (c.status === 'Completed' || c.status === 'Cancelled') return false;
    const info = getContractExpiryInfo(c, daysThreshold);
    return info && info.isExpiringSoon;
  });
}

/**
 * Helper to produce ISO YYYY-MM-DD date with an offset in days from today.
 */
export function getRelativeIsoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
