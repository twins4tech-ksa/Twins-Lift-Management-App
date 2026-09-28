import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types/portal';
import { 
  MaintenanceContract, 
  MaintenanceBreakdown, 
  BreakdownStatus, 
  MaintenanceVisit, 
  MaintenanceVisitStatus,
  VISIT_STATUS_CONFIG,
  MaintenanceVisitReview 
} from '../types/maintenance';
import { ElevatorSpecification } from '../types/elevator';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/settings';
import { 
  Wrench, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  Layers, 
  Calendar,
  ExternalLink,
  Navigation,
  Search,
  Filter,
  FileText,
  CheckCheck,
  RotateCcw,
  MessageSquare,
  Building2,
  CalendarCheck,
  Sparkles,
  Send,
  Award,
  Target,
  ShieldCheck
} from 'lucide-react';
import { 
  DAILY_TARGET_BREAKDOWNS, 
  DAILY_TARGET_MAINTENANCE, 
  DEFAULT_WORKING_DAYS_PER_MONTH, 
  getKpiGrade 
} from '../utils/technicianKpi';
import MaintenanceVisitReviewModal from './MaintenanceVisitReviewModal';
import { SendWhatsAppModal } from './SendWhatsAppModal';
import { 
  buildVisitCompletedMessage, 
  buildVisitScheduledMessage, 
  generateWaMeUrl 
} from '../services/whatsappService';

interface Props {
  currentUser: UserProfile;
  contracts: MaintenanceContract[];
  breakdowns: MaintenanceBreakdown[];
  spec: ElevatorSpecification;
  onUpdateBreakdownStatus: (breakdownId: string, newStatus: BreakdownStatus) => void;
  onOpenGpsCheckIn: () => void;
  onOpenDrawings: () => void;
  onOpenVisitReview?: (contractId: string, visitId: string) => void;
  onSaveContract?: (contract: MaintenanceContract) => void;
  companySettings?: CompanySettings;
  isAr?: boolean;
}

type TechVisitItem = {
  contract: MaintenanceContract;
  visit: MaintenanceVisit;
  isOverdue: boolean;
  isToday: boolean;
  isThisMonth: boolean;
};

export const TechnicianPortalView: React.FC<Props> = ({
  currentUser,
  contracts,
  breakdowns,
  spec,
  onUpdateBreakdownStatus,
  onOpenGpsCheckIn,
  onOpenDrawings,
  onSaveContract,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  isAr = true,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentYearMonth = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  // Breakdown filter
  const [breakdownFilter, setBreakdownFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');

  // Visit Filters & Search
  const [visitTab, setVisitTab] = useState<'ALL' | 'TODAY' | 'THIS_MONTH' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING' | 'OVERDUE'>('ALL');
  const [visitSearch, setVisitSearch] = useState<string>('');

  // Active Visit Review modal state
  const [reviewingVisitItem, setReviewingVisitItem] = useState<TechVisitItem | null>(null);

  // Reschedule Modal state
  const [reschedulingVisitItem, setReschedulingVisitItem] = useState<TechVisitItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('طلب العميل');

  // WhatsApp Modal state
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waRecipient, setWaRecipient] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filter tasks assigned to this technician (or all if user has canViewAllDepartmentRecords)
  const assignedBreakdowns = useMemo(() => {
    if (currentUser.canViewAllDepartmentRecords) {
      return breakdowns;
    }
    const matched = breakdowns.filter((b) => {
      const matchEmpId = currentUser.employeeId && b.assignedTechnicianId === currentUser.employeeId;
      const matchRecorded = currentUser.name && b.recordedBy === currentUser.name;
      const matchName = currentUser.name && (
        (b as any).assignedTechnicianName === currentUser.name ||
        (b as any).technicianName === currentUser.name
      );
      return matchEmpId || matchRecorded || matchName;
    });

    // In demo environment, if no breakdown explicitly matched ID, show at most 1 demo task so screen is testable
    if (matched.length === 0 && breakdowns.length > 0) {
      return breakdowns.slice(0, 1);
    }
    return matched;
  }, [breakdowns, currentUser]);

  const activeBreakdowns = assignedBreakdowns.filter((b) => !b.isResolved);

  // Flatten visits assigned to this technician (or all active in department if canViewAllDepartmentRecords is true)
  const allTechVisits = useMemo(() => {
    const list: TechVisitItem[] = [];
    const canSeeAll = Boolean(currentUser.canViewAllDepartmentRecords);

    contracts.filter(c => c.isContract && c.status === 'Active').forEach(c => {
      c.visits.forEach(v => {
        const isAssigned = canSeeAll || Boolean(
          (currentUser.employeeId && (v.assignedTechnicianId === currentUser.employeeId || c.assignedTechnicianId === currentUser.employeeId)) ||
          (currentUser.name && v.technician && v.technician.includes(currentUser.name))
        );

        const isToday = v.scheduledDate === todayStr;
        const isThisMonth = v.scheduledDate.startsWith(currentYearMonth);
        const isPast = v.scheduledDate < todayStr;
        const isOverdue = isPast && v.status !== 'Completed';

        if (isAssigned) {
          list.push({
            contract: c,
            visit: v,
            isOverdue,
            isToday,
            isThisMonth,
          });
        }
      });
    });

    return list.sort((a, b) => new Date(a.visit.scheduledDate).getTime() - new Date(b.visit.scheduledDate).getTime());
  }, [contracts, currentUser, todayStr, currentYearMonth]);

  // Statistics
  const stats = useMemo(() => {
    const total = allTechVisits.length;
    const todayCount = allTechVisits.filter(v => v.isToday).length;
    const thisMonthCount = allTechVisits.filter(v => v.isThisMonth).length;
    const completedCount = allTechVisits.filter(v => v.visit.status === 'Completed').length;
    const inProgressCount = allTechVisits.filter(v => v.visit.status === 'In_Progress').length;
    const overdueCount = allTechVisits.filter(v => v.isOverdue).length;

    return {
      total,
      todayCount,
      thisMonthCount,
      completedCount,
      inProgressCount,
      overdueCount,
    };
  }, [allTechVisits]);

  // Personal KPI Calculation for technician (12 maintenance/day & 5 breakdowns/day)
  const techKpi = useMemo(() => {
    const workingDays = DEFAULT_WORKING_DAYS_PER_MONTH;
    const monthlyVisitsTarget = workingDays * DAILY_TARGET_MAINTENANCE; // 26 * 12 = 312
    const monthlyBreakdownsTarget = workingDays * DAILY_TARGET_BREAKDOWNS; // 26 * 5 = 130

    // Completed visits this month
    const thisMonthCompletedVisits = allTechVisits.filter(v => v.isThisMonth && v.visit.status === 'Completed').length;
    // Today completed visits
    const todayCompletedVisits = allTechVisits.filter(v => v.isToday && v.visit.status === 'Completed').length;

    // Resolved breakdowns this month assigned to this tech
    const thisMonthResolvedBreakdowns = breakdowns.filter(b => {
      const isThisTech = !currentUser.employeeId || b.assignedTechnicianId === currentUser.employeeId || (b.assignedTechnicianName && b.assignedTechnicianName.includes(currentUser.name));
      const isResolved = b.isResolved || b.status === 'Resolved';
      const dateToTest = b.resolvedAt || b.reportedAt;
      return isThisTech && isResolved && dateToTest && dateToTest.startsWith(currentYearMonth);
    }).length;

    // Today resolved breakdowns
    const todayResolvedBreakdowns = breakdowns.filter(b => {
      const isThisTech = !currentUser.employeeId || b.assignedTechnicianId === currentUser.employeeId || (b.assignedTechnicianName && b.assignedTechnicianName.includes(currentUser.name));
      const isResolved = b.isResolved || b.status === 'Resolved';
      const dateToTest = b.resolvedAt || b.reportedAt;
      return isThisTech && isResolved && dateToTest && dateToTest.startsWith(todayStr);
    }).length;

    const visitsAchievementPct = monthlyVisitsTarget > 0 ? Number(((thisMonthCompletedVisits / monthlyVisitsTarget) * 100).toFixed(1)) : 0;
    const breakdownsAchievementPct = monthlyBreakdownsTarget > 0 ? Number(((thisMonthResolvedBreakdowns / monthlyBreakdownsTarget) * 100).toFixed(1)) : 0;

    let compositeScore = 0;
    if (thisMonthCompletedVisits > 0 && thisMonthResolvedBreakdowns > 0) {
      compositeScore = Number(((visitsAchievementPct * 0.6) + (breakdownsAchievementPct * 0.4)).toFixed(1));
    } else if (thisMonthCompletedVisits > 0) {
      compositeScore = visitsAchievementPct;
    } else if (thisMonthResolvedBreakdowns > 0) {
      compositeScore = breakdownsAchievementPct;
    } else {
      compositeScore = Number((((todayCompletedVisits / DAILY_TARGET_MAINTENANCE) * 100)).toFixed(1));
    }

    const gradeInfo = getKpiGrade(compositeScore);

    return {
      monthlyVisitsTarget,
      monthlyBreakdownsTarget,
      thisMonthCompletedVisits,
      todayCompletedVisits,
      thisMonthResolvedBreakdowns,
      todayResolvedBreakdowns,
      visitsAchievementPct,
      breakdownsAchievementPct,
      compositeScore,
      ...gradeInfo,
    };
  }, [allTechVisits, breakdowns, currentUser, currentYearMonth, todayStr]);

  // Filtered Visits
  const filteredVisits = useMemo(() => {
    return allTechVisits.filter(item => {
      const q = visitSearch.toLowerCase().trim();
      const matchSearch = !q ||
        item.contract.customerName.toLowerCase().includes(q) ||
        item.contract.elevatorName.toLowerCase().includes(q) ||
        (item.contract.siteLocation && item.contract.siteLocation.toLowerCase().includes(q)) ||
        (item.contract.contractRef && item.contract.contractRef.toLowerCase().includes(q));

      let matchTab = true;
      if (visitTab === 'TODAY') {
        matchTab = item.isToday;
      } else if (visitTab === 'THIS_MONTH') {
        matchTab = item.isThisMonth;
      } else if (visitTab === 'IN_PROGRESS') {
        matchTab = item.visit.status === 'In_Progress';
      } else if (visitTab === 'COMPLETED') {
        matchTab = item.visit.status === 'Completed';
      } else if (visitTab === 'PENDING') {
        matchTab = item.visit.status === 'Pending';
      } else if (visitTab === 'OVERDUE') {
        matchTab = item.isOverdue;
      }

      return matchSearch && matchTab;
    });
  }, [allTechVisits, visitTab, visitSearch]);

  // Handler: Change Visit Status (e.g. In_Progress)
  const handleUpdateVisitStatus = (item: TechVisitItem, newStatus: MaintenanceVisitStatus) => {
    if (!onSaveContract) return;

    const contract = item.contract;
    const updatedVisits = contract.visits.map(v => {
      if (v.id === item.visit.id) {
        return {
          ...v,
          status: newStatus,
          technician: currentUser.name || v.technician,
          technicianPhone: currentUser.phone || v.technicianPhone,
        };
      }
      return v;
    });

    onSaveContract({
      ...contract,
      visits: updatedVisits,
      updatedAt: todayStr,
    });

    triggerToast(
      isAr 
        ? `تم تحديث حالة الزيارة إلى "${VISIT_STATUS_CONFIG[newStatus]?.labelAr || newStatus}"`
        : `Status updated to ${newStatus}`
    );
  };

  // Handler: Save Completed Review
  const handleSaveVisitReview = (visitId: string, updatedReview: MaintenanceVisitReview, newStatus: MaintenanceVisitStatus) => {
    if (!reviewingVisitItem || !onSaveContract) return;

    const contract = reviewingVisitItem.contract;
    const updatedVisits = contract.visits.map(v => {
      if (v.id === visitId) {
        return {
          ...v,
          status: newStatus,
          technician: updatedReview.technicianName || currentUser.name,
          review: updatedReview,
        };
      }
      return v;
    });

    onSaveContract({
      ...contract,
      visits: updatedVisits,
      updatedAt: todayStr,
    });

    setReviewingVisitItem(null);
    triggerToast(isAr ? 'تم حفظ وتوثيق تقرير الفحص الفني بنجاح! ✅' : 'Inspection documented successfully!');
  };

  // Handler: Reschedule
  const handleConfirmReschedule = () => {
    if (!reschedulingVisitItem || !rescheduleDate || !onSaveContract) return;

    const contract = reschedulingVisitItem.contract;
    const updatedVisits = contract.visits.map(v => {
      if (v.id === reschedulingVisitItem.visit.id) {
        return {
          ...v,
          scheduledDate: rescheduleDate,
          monthLabel: `${isAr ? 'مؤجلة' : 'Rescheduled'} - ${rescheduleDate}`,
          status: 'Scheduled' as MaintenanceVisitStatus,
        };
      }
      return v;
    });

    onSaveContract({
      ...contract,
      visits: updatedVisits,
      updatedAt: todayStr,
    });

    setReschedulingVisitItem(null);
    setRescheduleDate('');
    triggerToast(isAr ? 'تمت إعادة جدولة موعد الزيارة بنجاح!' : 'Visit rescheduled!');
  };

  // Quick WhatsApp Trigger for Tech to Client
  const handleOpenClientWhatsApp = (item: TechVisitItem, msgType: 'ON_THE_WAY' | 'COMPLETED' | 'SCHEDULE') => {
    const phone = item.contract.customerPhone || '';
    const comp = companySettings?.companyNameAr || 'شركة توينز للمصاعد';
    let text = '';

    if (msgType === 'ON_THE_WAY') {
      text = `السلام عليكم ورحمة الله وبركاته، عزيزنا العميل: *${item.contract.customerName}* 🚗\n\n`;
      text += `معكم مهندس الصيانة *${currentUser.name}* من ${comp}.\n`;
      text += `أفيدكم بأنني في طريقي الآن لإجراء زيارة الصيانة الوقائية لمصعدكم (${item.contract.elevatorName}) في موقعكم:\n`;
      if (item.contract.siteLocation) text += `📍 ${item.contract.siteLocation}\n`;
      text += `\nشاكرين تعاونكم وتسهيل دخول فريق الصيانة.`;
    } else if (msgType === 'COMPLETED') {
      text = buildVisitCompletedMessage({
        customerName: item.contract.customerName,
        elevatorName: item.contract.elevatorName,
        completedDate: item.visit.scheduledDate || todayStr,
        technicianName: currentUser.name,
        elevatorCondition: item.visit.review?.elevatorCondition,
        notes: item.visit.review?.technicianNotes || item.visit.review?.workPerformed,
        companyName: comp,
      });
    } else {
      text = buildVisitScheduledMessage({
        customerName: item.contract.customerName,
        elevatorName: item.contract.elevatorName,
        scheduledDate: item.visit.scheduledDate,
        siteLocation: item.contract.siteLocation,
        technicianName: currentUser.name,
        technicianPhone: currentUser.phone,
        companyName: comp,
      });
    }

    setWaPhone(phone);
    setWaMessage(text);
    setWaRecipient(item.contract.customerName);
    setWaModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. TECHNICIAN WORKSPACE HERO                                          */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 mb-3">
              <Wrench className="w-3.5 h-3.5" />
              <span>{isAr ? 'لوحة تحكم مهندس وفني الصيانة الميداني' : 'Technician Workspace'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {isAr ? `مرحباً، ${currentUser.name}` : `Welcome, ${currentUser.name}`}
            </h1>
            <p className="text-blue-100/80 text-sm mt-1.5 max-w-xl leading-relaxed">
              {isAr 
                ? 'إدارة زيارات الصيانة الدورية المجدولة، التوثيق الفني، إرسال إشعارات الواتساب للعملاء، ومتابعة بلاغات الأعطال الطارئة.' 
                : 'Manage scheduled maintenance visits, technical inspection reports, client WhatsApp notifications, and breakdown requests.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenGpsCheckIn}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              <Navigation className="w-4 h-4 fill-white" />
              <span>{isAr ? 'تسجيل حضور الموقع GPS' : 'GPS Check-In'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenDrawings}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm rounded-2xl border border-white/20 transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>{isAr ? 'مخطط التعليق CAD' : 'CAD Drawing'}</span>
            </button>
          </div>
        </div>

        {/* Quick Privilege Badge & Data Scope Indicator */}
        <div className="mt-6 pt-5 border-t border-blue-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isAr ? 'حالة الاتصال الميداني: متصل وجاهز لتنفيذ الزيارات' : 'Status: Online & Ready'}</span>
          </div>

          {currentUser.canViewAllDepartmentRecords ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isAr ? 'نطاق الصلاحيات: مشاهدة كافة سجلات وإضافات قسم الصيانة (صلاحية موسعة)' : 'Scope: All Department Maintenance Records (Expanded)'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/60 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'نطاق العرض الطبيعي: ما تم إسناده إليك أو إدخاله بواسطتك فقط' : 'Scope: Assigned & Personal Records Only'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1.5 TECHNICIAN DAILY & MONTHLY KPI CARD                               */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                {isAr ? 'مؤشرات الأداء KPI والتقييم الشهري الخاص بك' : 'Your Monthly KPI & Target Performance'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr 
                  ? 'المستهدف: ١٢ زيارة صيانة يومياً • ٥ إصلاحات أعطال يومياً • وما أكثر فله درجات أعلى' 
                  : 'Target: 12 maintenance visits/day & 5 breakdown repairs/day. Exceeding targets unlocks distinction honors.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${techKpi.badgeClass}`}>
              {techKpi.grade}
            </span>
            <div className="text-right rtl:text-right ltr:text-left">
              <div className="text-xs font-black text-slate-900 font-mono">{techKpi.compositeScore}%</div>
              <div className="text-[10px] text-slate-400 font-bold">{isAr ? techKpi.gradeLabelAr : techKpi.gradeLabelEn}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Daily Maintenance Visits vs 12 Target */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-600 font-bold">
              <span>{isAr ? 'صيانة اليوم (مستهدف 12)' : 'Today Visits (Target 12)'}</span>
              <span className="font-mono text-blue-700">{techKpi.todayCompletedVisits} / {DAILY_TARGET_MAINTENANCE}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full ${techKpi.todayCompletedVisits >= DAILY_TARGET_MAINTENANCE ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (techKpi.todayCompletedVisits / DAILY_TARGET_MAINTENANCE) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400">
              {techKpi.todayCompletedVisits >= DAILY_TARGET_MAINTENANCE ? '⭐ حققت التارجت اليومي وزيادة' : 'متبقي لتحقيق هدف اليوم'}
            </div>
          </div>

          {/* Daily Breakdown Repairs vs 5 Target */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-600 font-bold">
              <span>{isAr ? 'أعطال اليوم (مستهدف 5)' : 'Today Repairs (Target 5)'}</span>
              <span className="font-mono text-rose-700">{techKpi.todayResolvedBreakdowns} / {DAILY_TARGET_BREAKDOWNS}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full ${techKpi.todayResolvedBreakdowns >= DAILY_TARGET_BREAKDOWNS ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, (techKpi.todayResolvedBreakdowns / DAILY_TARGET_BREAKDOWNS) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400">
              {techKpi.todayResolvedBreakdowns >= DAILY_TARGET_BREAKDOWNS ? '⭐ حققت تارجت الأعطال وزيادة' : 'جاهز لاستقبال بلاغات الطوارئ'}
            </div>
          </div>

          {/* Monthly Maintenance Visits Target */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-600 font-bold">
              <span>{isAr ? 'إجمالي الشهر (صيانة)' : 'Month Visits'}</span>
              <span className="font-mono text-slate-900">{techKpi.thisMonthCompletedVisits} / {techKpi.monthlyVisitsTarget}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full ${techKpi.visitsAchievementPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, techKpi.visitsAchievementPct)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {techKpi.visitsAchievementPct}% {isAr ? 'نسبة إنجاز الشهر' : 'achievement'}
            </div>
          </div>

          {/* Monthly Breakdowns Target & Bonus */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-600 font-bold">
              <span>{isAr ? 'إجمالي الشهر (أعطال)' : 'Month Repairs'}</span>
              <span className="font-mono text-slate-900">{techKpi.thisMonthResolvedBreakdowns} / {techKpi.monthlyBreakdownsTarget}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full ${techKpi.breakdownsAchievementPct >= 100 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, techKpi.breakdownsAchievementPct)}%` }}
              />
            </div>
            <div className="text-[10px] text-purple-700 font-bold">
              {techKpi.isOverachiever ? `+${techKpi.bonusPoints} بونص تميز إضافي` : `${techKpi.breakdownsAchievementPct}% إنجاز الأعطال`}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. SUMMARY METRICS TILES                                              */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Today's Visits */}
        <div 
          onClick={() => setVisitTab('TODAY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            visitTab === 'TODAY' ? 'ring-2 ring-blue-500 bg-blue-50/60 border-blue-300' : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">{isAr ? 'زيارات اليوم' : 'Today'}</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">{stats.todayCount}</div>
          <div className="text-[10px] text-blue-600 font-bold mt-0.5">{isAr ? 'مستحقة اليوم' : 'Due today'}</div>
        </div>

        {/* Active Breakdowns */}
        <div 
          onClick={() => setBreakdownFilter('ACTIVE')}
          className="p-4 rounded-2xl border border-red-200 bg-red-50/30 hover:border-red-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-800">{isAr ? 'أعطال طارئة' : 'Breakdowns'}</span>
            <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-red-600 mt-1 font-mono">{activeBreakdowns.length}</div>
          <div className="text-[10px] text-red-500 font-bold mt-0.5">{isAr ? 'استجابة فورية' : 'Immediate'}</div>
        </div>

        {/* In Progress */}
        <div 
          onClick={() => setVisitTab('IN_PROGRESS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            visitTab === 'IN_PROGRESS' ? 'ring-2 ring-amber-500 bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800">{isAr ? 'قيد التنفيذ' : 'In Progress'}</span>
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1 font-mono">{stats.inProgressCount}</div>
          <div className="text-[10px] text-amber-600 font-bold mt-0.5">{isAr ? 'في الموقع الآن' : 'On Site'}</div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => setVisitTab('COMPLETED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            visitTab === 'COMPLETED' ? 'ring-2 ring-emerald-500 bg-emerald-50/60 border-emerald-300' : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800">{isAr ? 'المنجزة والموثقة' : 'Completed'}</span>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1 font-mono">{stats.completedCount}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{isAr ? 'مع التقرير الفني' : 'Certified'}</div>
        </div>

        {/* This Month */}
        <div 
          onClick={() => setVisitTab('THIS_MONTH')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            visitTab === 'THIS_MONTH' ? 'ring-2 ring-purple-500 bg-purple-50/60 border-purple-300' : 'bg-white border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800">{isAr ? 'زيارات هذا الشهر' : 'This Month'}</span>
            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1 font-mono">{stats.thisMonthCount}</div>
          <div className="text-[10px] text-purple-600 font-bold mt-0.5">{isAr ? 'في نطاق مسؤوليتك' : 'Assigned'}</div>
        </div>

        {/* Overdue */}
        <div 
          onClick={() => setVisitTab('OVERDUE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            visitTab === 'OVERDUE' ? 'ring-2 ring-rose-500 bg-rose-50/60 border-rose-300' : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800">{isAr ? 'متأخرة' : 'Overdue'}</span>
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-700 mt-1 font-mono">{stats.overdueCount}</div>
          <div className="text-[10px] text-rose-600 font-bold mt-0.5">{isAr ? 'تحتاج معالجة' : 'Needs Action'}</div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. ACTIVE EMERGENCY BREAKDOWNS (ACTIONABLE FOR TECH)                  */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-black text-slate-900">
              {isAr ? `بلاغات الأعطال والطوارئ الميدانية (${activeBreakdowns.length})` : `Active Breakdowns (${activeBreakdowns.length})`}
            </h2>
          </div>
          <span className="text-xs text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            {isAr ? 'استجابة فورية مطلوبة' : 'Urgent'}
          </span>
        </div>

        <div className="p-6 divide-y divide-slate-100">
          {activeBreakdowns.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">
                {isAr ? 'لا توجد بلاغات أعطال معلقة حالياً' : 'No active breakdowns currently'}
              </p>
              <p className="text-slate-400 mt-1">
                {isAr ? 'جميع المصاعد المسندة إليك تعمل بكفاءة' : 'All elevators operating smoothly'}
              </p>
            </div>
          ) : (
            activeBreakdowns.map((breakdown) => (
              <div key={breakdown.id} className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-black text-slate-900">
                      {breakdown.elevatorName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
                      {breakdown.priority === 'Emergency' ? '🚨 طارئ جداً' : breakdown.priority}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(breakdown.reportedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {breakdown.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(breakdown.siteLocation || '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-700 font-bold hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{breakdown.siteLocation}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>{isAr ? 'العميل:' : 'Client:'} {breakdown.customerName}</span>
                    {breakdown.customerPhone && (
                      <a href={`tel:${breakdown.customerPhone}`} className="text-emerald-700 font-bold flex items-center gap-1 hover:underline font-mono">
                        <Phone className="w-3 h-3" />
                        {breakdown.customerPhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Status Update Quick Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => onUpdateBreakdownStatus(breakdown.id, 'In_Progress')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      breakdown.status === 'In_Progress'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    {isAr ? 'في الطريق / قيد الفحص' : 'In Progress'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateBreakdownStatus(breakdown.id, 'Requires_Parts')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition-colors"
                  >
                    {isAr ? 'طلب قطع غيار' : 'Needs Parts'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateBreakdownStatus(breakdown.id, 'Resolved')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تم حل العطل بنجاح' : 'Resolved'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. TECHNICIAN PREVENTIVE VISITS WORKSPACE (IMPROVED & FILTERABLE)     */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Workspace Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {isAr ? 'جدول زيارات الصيانة الدورية الميدانية' : 'Maintenance Visits Workspace'}
              </h2>
              <span className="text-xs bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded-full">
                {filteredVisits.length} {isAr ? 'زيارة' : 'visits'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isAr 
                ? 'فحص المصاعد، توثيق التقارير الفنية، وتنبيه العملاء عبر الواتساب عند الوصول أو الانتهاء.' 
                : 'Inspect elevators, document certified reports, and notify clients via WhatsApp on arrival or completion.'}
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث باسم العميل، المبنى، أو المصعد...' : 'Search client, building, elevator...'}
              value={visitSearch}
              onChange={(e) => setVisitSearch(e.target.value)}
              className="w-full text-xs ps-9 pe-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-thin bg-slate-50/60">
          {[
            { key: 'ALL', label: isAr ? 'كل الزيارات' : 'All', count: allTechVisits.length },
            { key: 'TODAY', label: isAr ? 'زيارات اليوم' : 'Today', count: stats.todayCount, color: 'text-blue-700' },
            { key: 'THIS_MONTH', label: isAr ? 'هذا الشهر' : 'This Month', count: stats.thisMonthCount },
            { key: 'IN_PROGRESS', label: isAr ? 'قيد التنفيذ' : 'In Progress', count: stats.inProgressCount, color: 'text-amber-700' },
            { key: 'COMPLETED', label: isAr ? 'منجزة وموثقة' : 'Completed', count: stats.completedCount, color: 'text-emerald-700' },
            { key: 'OVERDUE', label: isAr ? 'متأخرة' : 'Overdue', count: stats.overdueCount, color: 'text-rose-700' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setVisitTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                visitTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                visitTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Visits List */}
        <div className="p-6 divide-y divide-slate-100">
          {filteredVisits.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">
                {isAr ? 'لا توجد زيارات صيانة تطابق الفلتر الحالي' : 'No visits match this filter'}
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? 'اختر تبويب "كل الزيارات" أو غير معايير البحث.' : 'Select "All" or change search terms.'}
              </p>
            </div>
          ) : (
            filteredVisits.map((item) => {
              const statusCfg = VISIT_STATUS_CONFIG[item.visit.status] || VISIT_STATUS_CONFIG['Scheduled'];
              const isDone = item.visit.status === 'Completed';

              return (
                <div 
                  key={item.visit.id}
                  className={`py-4.5 first:pt-0 last:pb-0 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all ${
                    item.isToday ? 'bg-blue-50/20 px-3 rounded-xl' : ''
                  }`}
                >
                  {/* Left info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-black text-slate-900">
                        {item.contract.customerName}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.contract.elevatorName}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${statusCfg.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}></span>
                        {isAr ? statusCfg.labelAr : statusCfg.labelEn}
                      </span>

                      {item.isToday && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-blue-600 text-white rounded-full animate-pulse">
                          {isAr ? 'مستحقة اليوم' : 'Due Today'}
                        </span>
                      )}

                      {item.isOverdue && !isDone && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-800 rounded-full border border-rose-200">
                          {isAr ? 'متأخرة عن الموعد' : 'Overdue'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>{item.visit.scheduledDate}</span>
                        <span className="text-[11px] text-slate-400 font-normal">({item.visit.monthLabel})</span>
                      </div>

                      {item.contract.siteLocation && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(item.contract.siteLocation)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-700 hover:underline font-medium"
                        >
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{item.contract.siteLocation}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}

                      {item.contract.customerPhone && (
                        <a 
                          href={`tel:${item.contract.customerPhone}`}
                          className="flex items-center gap-1 text-emerald-700 font-bold hover:underline font-mono"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{item.contract.customerPhone}</span>
                        </a>
                      )}
                    </div>

                    {/* Inspection certification summary if completed */}
                    {isDone && item.visit.review && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-3 flex-wrap mt-1">
                        <span className="font-bold flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {isAr ? 'تم الفحص الفني المعتمد' : 'Inspection Certified'}
                        </span>
                        {item.visit.review.elevatorCondition && (
                          <span>
                            {isAr ? 'حالة المصعد:' : 'Condition:'}{' '}
                            <strong>
                              {item.visit.review.elevatorCondition === 'Excellent' ? (isAr ? 'ممتازة' : 'Excellent') :
                               item.visit.review.elevatorCondition === 'Good' ? (isAr ? 'جيدة' : 'Good') :
                               item.visit.review.elevatorCondition === 'Needs_Attention' ? (isAr ? 'تحتاج ملاحظات' : 'Attention') : (isAr ? 'حرجة' : 'Critical')}
                            </strong>
                          </span>
                        )}
                        {item.visit.review.clientSigned && (
                          <span className="text-[11px] text-emerald-600">✓ {isAr ? 'توقيع العميل معتمد' : 'Client signed'}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions for Technician */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full xl:w-auto justify-end">
                    {/* Mark In Progress */}
                    {item.visit.status === 'Scheduled' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateVisitStatus(item, 'In_Progress')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                        title={isAr ? 'تسجيل بدء تنفيذ الزيارة في الموقع' : 'Start Visit'}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{isAr ? 'بدء الزيارة' : 'Start Visit'}</span>
                      </button>
                    )}

                    {/* Document / Complete */}
                    <button
                      type="button"
                      onClick={() => setReviewingVisitItem(item)}
                      className={`px-3.5 py-1.5 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
                        isDone 
                          ? 'bg-slate-800 hover:bg-slate-700' 
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isDone ? (isAr ? 'استعراض التقرير' : 'View Report') : (isAr ? 'توثيق الفحص' : 'Document Visit')}</span>
                    </button>

                    {/* Send WhatsApp to Client */}
                    <button
                      type="button"
                      onClick={() => handleOpenClientWhatsApp(item, isDone ? 'COMPLETED' : 'ON_THE_WAY')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition-colors flex items-center gap-1"
                      title={isAr ? 'إرسال إشعار للعميل عبر واتساب (API)' : 'Send WhatsApp to Client'}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAr ? 'واتساب العميل' : 'WhatsApp'}</span>
                    </button>

                    {/* Reschedule */}
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => {
                          setReschedulingVisitItem(item);
                          setRescheduleDate(item.visit.scheduledDate);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                        title={isAr ? 'طلب تأجيل الموعد' : 'Reschedule'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Call Customer */}
                    {item.contract.customerPhone && (
                      <a
                        href={`tel:${item.contract.customerPhone}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
                        title={isAr ? 'اتصال هاتفي سريع' : 'Call'}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Review & Certification Modal */}
      {reviewingVisitItem && (
        <MaintenanceVisitReviewModal
          visit={reviewingVisitItem.visit}
          contract={reviewingVisitItem.contract}
          companySettings={companySettings}
          language={isAr ? 'ar' : 'en'}
          isOpen={Boolean(reviewingVisitItem)}
          onClose={() => setReviewingVisitItem(null)}
          onSaveReview={handleSaveVisitReview}
        />
      )}

      {/* Reschedule Modal */}
      {reschedulingVisitItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {isAr ? 'تأجيل موعد الزيارة' : 'Reschedule Visit'}
              </h3>
              <button
                type="button"
                onClick={() => setReschedulingVisitItem(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'الموعد المجدول الجديد:' : 'New Date:'}
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'سبب التأجيل:' : 'Reason:'}
                </label>
                <select
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-bold"
                >
                  <option value="طلب العميل">{isAr ? 'بطلب العميل' : 'Client Request'}</option>
                  <option value="تعذر الدخول">{isAr ? 'تعذر الدخول للمبنى' : 'Access Restricted'}</option>
                  <option value="انتظار قطع غيار">{isAr ? 'انتظار قطع غيار' : 'Waiting for Parts'}</option>
                  <option value="طوارئ أخرى">{isAr ? 'أعمال صيانة طارئة أخرى' : 'Emergency Priority'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingVisitItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  disabled={!rescheduleDate}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  {isAr ? 'تأكيد الموعد' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      <SendWhatsAppModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        defaultPhone={waPhone}
        defaultMessage={waMessage}
        recipientName={waRecipient}
        contextTitle={isAr ? `إشعار واتساب للعميل: ${waRecipient}` : `WhatsApp Client Notice`}
        isAr={isAr}
      />
    </div>
  );
};
