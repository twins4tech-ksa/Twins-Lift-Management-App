import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCheck, 
  X, 
  ChevronRight,
  ChevronLeft,
  Mail
} from 'lucide-react';
import { MaintenanceBreakdown, MaintenanceContract } from '../types/maintenance';
import { NavTab } from '../types/navigation';
import { AppLanguage } from '../utils/translations';
import { getContractExpiryInfo } from '../utils/maintenanceExpiry';

export interface InAppNotificationsPopoverProps {
  breakdowns: MaintenanceBreakdown[];
  contracts: MaintenanceContract[];
  language: AppLanguage;
  onNavigate: (tab: NavTab) => void;
  onOpenRenewalEmail?: (contract: MaintenanceContract) => void;
  className?: string;
}

interface NotificationItem {
  id: string;
  type: 'breakdown' | 'visit' | 'contract_expiry';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  dateStr: string;
  isUrgent?: boolean;
  targetTab: NavTab;
  badgeLabelAr: string;
  badgeLabelEn: string;
  contract?: MaintenanceContract;
  canSendRenewalEmail?: boolean;
}

const STORAGE_KEY_READ_NOTIFS = 'vvt_read_notification_ids_v1';

export const InAppNotificationsPopover: React.FC<InAppNotificationsPopoverProps> = ({
  breakdowns,
  contracts,
  language,
  onNavigate,
  onOpenRenewalEmail,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'breakdowns' | 'visits' | 'contracts'>('all');
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_READ_NOTIFS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read read notifications', e);
    }
    return [];
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const isAr = language === 'ar';

  // Save read notifications to localStorage
  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY_READ_NOTIFS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEY_READ_NOTIFS, JSON.stringify(allIds));
    } catch (e) {
      console.warn(e);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Compile list of notifications
  const notifications = useMemo(() => {
    const list: NotificationItem[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Unhandled & Open Breakdowns
    breakdowns.forEach((b) => {
      if (!b.isResolved) {
        const isUntouched = b.status === 'Reported';
        const isUrgent = b.priority === 'Emergency' || b.priority === 'High' || isUntouched;

        const dateObj = new Date(b.reportedAt);
        const timeFormatted = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : b.reportedAt;

        list.push({
          id: `notif-brk-${b.id}`,
          type: 'breakdown',
          titleAr: isUntouched 
            ? `بلاغ عطل جديد: ${b.elevatorName}`
            : `بلاغ عطل قيد الصيانة: ${b.elevatorName}`,
          titleEn: isUntouched
            ? `New Breakdown: ${b.elevatorName}`
            : `Active Breakdown: ${b.elevatorName}`,
          descAr: `العميل: ${b.customerName} - ${b.description || 'عطل بالمصعد يحتاج فحصاً'}`,
          descEn: `Client: ${b.customerName} - ${b.description || 'Elevator requires technician check'}`,
          dateStr: timeFormatted,
          isUrgent,
          targetTab: 'MAINTENANCE_BREAKDOWNS',
          badgeLabelAr: isUntouched ? 'جديد لم يعالج' : 'قيد الصيانة',
          badgeLabelEn: isUntouched ? 'New' : 'In Progress',
        });
      }
    });

    // 2. Upcoming Maintenance Visits
    contracts.forEach((c) => {
      if (c.status === 'Active' && c.visits) {
        c.visits.forEach((v) => {
          if (v.status === 'Scheduled' || v.status === 'Pending') {
            const isOverdue = v.scheduledDate < todayStr;
            const diffDays = Math.ceil(
              (new Date(v.scheduledDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (isOverdue || (diffDays >= 0 && diffDays <= 7)) {
              list.push({
                id: `notif-vis-${c.id}-${v.id || v.visitNumber}`,
                type: 'visit',
                titleAr: isOverdue
                  ? `زيارة صيانة متأخرة: ${c.customerName}`
                  : `موعد صيانة قادم (${v.scheduledDate}): ${c.customerName}`,
                titleEn: isOverdue
                  ? `Overdue Visit: ${c.customerName}`
                  : `Upcoming Visit (${v.scheduledDate}): ${c.customerName}`,
                descAr: `المصعد: ${c.elevatorName} - الزيارة رقم #${v.visitNumber}`,
                descEn: `Elevator: ${c.elevatorName} - Visit #${v.visitNumber}`,
                dateStr: v.scheduledDate,
                isUrgent: isOverdue,
                targetTab: 'MAINTENANCE_SCHEDULES',
                badgeLabelAr: isOverdue ? 'متأخرة' : 'قادمة',
                badgeLabelEn: isOverdue ? 'Overdue' : 'Upcoming',
                contract: c,
              });
            }
          }
        });
      }
    });

    // 3. Expiring Contracts (< 30 days)
    contracts.forEach((c) => {
      if (c.status === 'Completed' || c.status === 'Cancelled') return;
      if (c.isContract === false) return; // Only active/valid contracts
      const exp = getContractExpiryInfo({ endDate: c.endDate, status: c.status, isContract: c.isContract }, 30);
      if (exp && (exp.isExpired || exp.isExpiringSoon)) {
        list.push({
          id: `notif-cnt-${c.id}`,
          type: 'contract_expiry',
          titleAr: exp.isExpired 
            ? `عقد صيانة منتهي: ${c.customerName}`
            : `عقد صيانة ينتهي قريباً: ${c.customerName}`,
          titleEn: exp.isExpired
            ? `Expired Contract: ${c.customerName}`
            : `Expiring Contract: ${c.customerName}`,
          descAr: `عقد #${c.contractRef} للمصعد: ${c.elevatorName} (${isAr ? `متبقي ${exp.diffDays} يوماً` : `${exp.diffDays}d left`})`,
          descEn: `Contract #${c.contractRef} for ${c.elevatorName} (${exp.diffDays} days left)`,
          dateStr: c.endDate,
          isUrgent: exp.isExpired || exp.diffDays <= 7,
          targetTab: 'MAINTENANCE_CONTRACTS',
          badgeLabelAr: isAr ? exp.badgeTextAr : exp.badgeTextEn,
          badgeLabelEn: exp.badgeTextEn,
          contract: c,
          canSendRenewalEmail: true,
        });
      }
    });

    return list;
  }, [breakdowns, contracts, isAr]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  // Has urgent unhandled breakdowns
  const hasUrgentBreakdowns = useMemo(() => {
    return notifications.some((n) => n.type === 'breakdown' && n.isUrgent && !readIds.includes(n.id));
  }, [notifications, readIds]);

  // Filter counts
  const breakdownsCount = useMemo(() => notifications.filter((n) => n.type === 'breakdown').length, [notifications]);
  const visitsCount = useMemo(() => notifications.filter((n) => n.type === 'visit').length, [notifications]);
  const contractsCount = useMemo(() => notifications.filter((n) => n.type === 'contract_expiry').length, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'breakdowns':
        return notifications.filter((n) => n.type === 'breakdown');
      case 'visits':
        return notifications.filter((n) => n.type === 'visit');
      case 'contracts':
        return notifications.filter((n) => n.type === 'contract_expiry');
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    onNavigate(item.targetTab);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Bell Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={
          isAr
            ? `التنبيهات والإشعارات (${unreadCount} غير مقروء)`
            : `Notifications & Alerts (${unreadCount} unread)`
        }
        className={`relative inline-flex items-center justify-center p-1.5 rounded-lg border transition-all duration-150 group cursor-pointer focus:outline-hidden ${
          isOpen
            ? 'bg-blue-600/30 border-blue-400 text-white shadow-xs'
            : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200 hover:text-white'
        }`}
      >
        <Bell className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-12' : 'group-hover:rotate-12'}`} />

        {/* Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-bold bg-rose-600 text-white border-2 border-[#0B1E3B] shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Pulsing indicator dot for emergency breakdowns */}
        {hasUrgentBreakdowns && (
          <span className="absolute top-0 right-0 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </button>

      {/* Notifications Popover Window: Compact, Light Theme, Simple Icons */}
      {isOpen && (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          className="fixed top-16 left-3 right-3 max-w-sm mx-auto sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-1.5 sm:max-w-none sm:w-80 md:sm:w-84 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-slate-800 z-50"
          style={{ maxHeight: '85vh' }}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                {isAr ? 'مركز الإشعارات' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 text-rose-600">
                  {unreadCount} {isAr ? 'جديد' : 'new'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title={isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                  className="px-2 py-0.5 rounded text-blue-600 hover:bg-blue-50 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'قراءة الكل' : 'Read all'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="p-1 bg-slate-50 border-b border-slate-100 flex items-center gap-1 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('breakdowns')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 flex items-center gap-1 ${
                activeFilter === 'breakdowns'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{isAr ? 'الأعطال' : 'Breakdowns'}</span>
              <span>({breakdownsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('visits')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 flex items-center gap-1 ${
                activeFilter === 'visits'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{isAr ? 'الصيانة' : 'Visits'}</span>
              <span>({visitsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('contracts')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 flex items-center gap-1 ${
                activeFilter === 'contracts'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{isAr ? 'العقود' : 'Contracts'}</span>
              <span className={`px-1 rounded-full text-[10px] font-bold ${activeFilter === 'contracts' ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-800'}`}>
                {contractsCount}
              </span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="p-1.5 space-y-1 overflow-y-auto max-h-[60vh] divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-6 px-3 text-center">
                <div className="w-9 h-9 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">
                  {isAr ? 'لا توجد تنبيهات جديدة' : 'No new notifications'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                  {isAr 
                    ? 'جميع المصاعد وعقود الصيانة تعمل بانتظام وبحالة ممتازة.' 
                    : 'All elevators and maintenance schedules are running smoothly.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isRead = readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-2 rounded-lg transition-colors duration-100 cursor-pointer group border ${
                      isRead
                        ? 'bg-slate-50/50 border-transparent hover:border-slate-200 opacity-70'
                        : item.isUrgent
                        ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Simple Icon */}
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'breakdown' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ) : item.type === 'visit' ? (
                          <Calendar className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 text-right rtl:text-right ltr:text-left">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-xs font-semibold truncate group-hover:text-blue-600 transition-colors ${
                            item.isUrgent && !isRead ? 'text-rose-700 font-bold' : 'text-slate-800'
                          }`}>
                            {isAr ? item.titleAr : item.titleEn}
                          </h4>
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {isAr ? item.descAr : item.descEn}
                        </p>

                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          <span className={`px-1.5 py-0.2 rounded font-medium ${
                            item.type === 'breakdown'
                              ? 'bg-rose-100 text-rose-700'
                              : item.type === 'visit'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isAr ? item.badgeLabelAr : item.badgeLabelEn}
                          </span>

                          <span className="text-slate-400 text-[10px] flex items-center gap-0.5">
                            <span>{item.dateStr}</span>
                            {isAr ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </span>
                        </div>

                        {/* Action Suggestion: Send Renewal Email */}
                        {item.canSendRenewalEmail && item.contract && onOpenRenewalEmail && (
                          <div className="mt-2 pt-1.5 border-t border-amber-200/60 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(item.id);
                                setIsOpen(false);
                                onOpenRenewalEmail(item.contract!);
                              }}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                              title={isAr ? 'إرسال بريد عرض التجديد للعميل بالنموذج المعتمد' : 'Send renewal quotation email to client'}
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-950" />
                              <span>{isAr ? 'إرسال عرض تجديد عبر الإيميل (نموذج معتمد)' : 'Send Renewal Quotation Email'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>{isAr ? 'اضغط للانتقال المباشر' : 'Click to open ticket'}</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('MAINTENANCE_BREAKDOWNS');
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              {isAr ? 'كافة البلاغات' : 'All tickets'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
