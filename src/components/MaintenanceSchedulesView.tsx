import React, { useState, useMemo } from 'react';
import { 
  MaintenanceContract, 
  MaintenanceVisit, 
  MaintenanceVisitStatus, 
  VISIT_STATUS_CONFIG,
  MaintenanceVisitReview
} from '../types/maintenance';
import { AppLanguage } from '../utils/translations';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  CalendarDays, 
  Printer, 
  CheckCheck, 
  AlertTriangle, 
  RotateCcw, 
  Layers, 
  UserCheck, 
  Building2, 
  FileText,
  X,
  ExternalLink,
  Phone,
  BarChart3,
  CalendarCheck,
  MessageSquare,
  ArrowLeftRight,
  Send,
  Users
} from 'lucide-react';
import { Employee } from '../types/employee';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/settings';
import { SearchableSelect } from './SearchableSelect';
import { useInteractiveTable, InteractiveColumn } from '../hooks/useInteractiveTable';
import { InteractiveTableHeader, TableControlBar } from './InteractiveTableHeader';
import MaintenanceVisitReviewModal from './MaintenanceVisitReviewModal';
import { SendWhatsAppModal } from './SendWhatsAppModal';
import { EditVisitTechnicianModal } from './EditVisitTechnicianModal';
import { BatchReassignTechnicianModal } from './BatchReassignTechnicianModal';
import { 
  buildVisitScheduledMessage, 
  buildVisitCompletedMessage, 
  buildTechnicianDispatchMessage,
  buildTechnicianScheduleSummaryMessage,
  buildClientScheduleSummaryMessage
} from '../services/whatsappService';

interface Props {
  contracts: MaintenanceContract[];
  employees: Employee[];
  language: AppLanguage;
  companySettings?: CompanySettings;
  onSaveContract?: (contract: MaintenanceContract) => void;
}

type VisitScheduleItem = {
  contract: MaintenanceContract;
  visit: MaintenanceVisit;
  isOverdue: boolean;
};

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAYS_OF_WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MaintenanceSchedulesView: React.FC<Props> = ({ 
  contracts, 
  employees, 
  language,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  onSaveContract
}) => {
  const isAr = language === 'ar';
  const today = useMemo(() => new Date(), []);
  
  // Month & Year state
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-11
  const [monthScope, setMonthScope] = useState<'SELECTED_MONTH' | 'ALL_MONTHS'>('SELECTED_MONTH');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CALENDAR'>('TABLE');

  // Active visit modal state
  const [reviewingVisitItem, setReviewingVisitItem] = useState<VisitScheduleItem | null>(null);
  const [editingTechnicianItem, setEditingTechnicianItem] = useState<VisitScheduleItem | null>(null);
  const [batchReassignOpen, setBatchReassignOpen] = useState(false);
  const [activeCalendarVisitMenu, setActiveCalendarVisitMenu] = useState<VisitScheduleItem | null>(null);
  const [reschedulingVisitItem, setReschedulingVisitItem] = useState<VisitScheduleItem | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('طلب العميل');
  const [rescheduleNotes, setRescheduleNotes] = useState<string>('');
  const [rescheduleTechId, setRescheduleTechId] = useState<string>('');

  // WhatsApp send modal state
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [waTargetPhone, setWaTargetPhone] = useState('');
  const [waDefaultMessage, setWaDefaultMessage] = useState('');
  const [waRecipientName, setWaRecipientName] = useState('');
  const [waContextTitle, setWaContextTitle] = useState('');

  // Toast / feedback message
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleJumpToCurrentMonth = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setMonthScope('SELECTED_MONTH');
  };

  // Flatten all visits from all active contracts
  const allVisits = useMemo(() => {
    const visitsList: VisitScheduleItem[] = [];
    const todayStr = today.toISOString().split('T')[0];

    contracts.filter(c => c.isContract && c.status === 'Active').forEach(c => {
      c.visits.forEach(v => {
        const isPast = v.scheduledDate < todayStr;
        const isOverdue = isPast && v.status !== 'Completed';

        visitsList.push({ 
          contract: c, 
          visit: v,
          isOverdue
        });
      });
    });
    
    return visitsList.sort((a, b) => new Date(a.visit.scheduledDate).getTime() - new Date(b.visit.scheduledDate).getTime());
  }, [contracts, today]);

  // Visits specifically for the selected month & year (for KPIs and monthly overview)
  const monthlyVisits = useMemo(() => {
    return allVisits.filter(item => {
      if (!item.visit.scheduledDate) return false;
      const [yStr, mStr] = item.visit.scheduledDate.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10) - 1; // 0-indexed
      return y === selectedYear && m === selectedMonth;
    });
  }, [allVisits, selectedYear, selectedMonth]);

  // Target pool based on scope (Monthly or All Months)
  const scopedVisits = useMemo(() => {
    if (monthScope === 'ALL_MONTHS') return allVisits;
    return monthlyVisits;
  }, [monthScope, allVisits, monthlyVisits]);

  // Monthly KPI Statistics
  const stats = useMemo(() => {
    const pool = scopedVisits;
    const total = pool.length;
    const completed = pool.filter(item => item.visit.status === 'Completed').length;
    const pending = pool.filter(item => item.visit.status === 'Pending').length;
    const inProgress = pool.filter(item => item.visit.status === 'In_Progress').length;
    const scheduled = pool.filter(item => item.visit.status === 'Scheduled').length;
    const missed = pool.filter(item => item.visit.status === 'Missed' || (item.isOverdue && item.visit.status !== 'Completed')).length;
    const overdueOnly = pool.filter(item => item.isOverdue && item.visit.status !== 'Completed').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      inProgress,
      scheduled,
      missed,
      overdueOnly,
      completionRate
    };
  }, [scopedVisits]);

  // Unique Clients for filtering
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, { name: string; count: number; phone?: string; location?: string }>();
    scopedVisits.forEach(item => {
      const name = item.contract.customerName;
      if (!name) return;
      const existing = map.get(name);
      if (existing) {
        existing.count++;
      } else {
        map.set(name, {
          name,
          count: 1,
          phone: item.contract.customerPhone,
          location: item.contract.siteLocation,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [scopedVisits]);

  // Visit counts per technician
  const technicianVisitCounts = useMemo(() => {
    const map: Record<string, number> = {};
    scopedVisits.forEach(item => {
      const techId = item.visit.assignedTechnicianId || item.contract.assignedTechnicianId || 'UNASSIGNED';
      map[techId] = (map[techId] || 0) + 1;
    });
    return map;
  }, [scopedVisits]);

  // Filtered visits based on user search, status, technician, and customer
  const filteredVisits = useMemo(() => {
    return scopedVisits.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.contract.customerName.toLowerCase().includes(q) ||
        item.contract.elevatorName.toLowerCase().includes(q) ||
        (item.contract.contractRef && item.contract.contractRef.toLowerCase().includes(q)) ||
        (item.contract.siteLocation && item.contract.siteLocation.toLowerCase().includes(q)) ||
        (item.visit.technician && item.visit.technician.toLowerCase().includes(q));
      
      let matchStatus = true;
      if (selectedStatus === 'COMPLETED') {
        matchStatus = item.visit.status === 'Completed';
      } else if (selectedStatus === 'PENDING') {
        matchStatus = item.visit.status === 'Pending';
      } else if (selectedStatus === 'MISSED_OVERDUE') {
        matchStatus = item.visit.status === 'Missed' || item.isOverdue;
      } else if (selectedStatus === 'IN_PROGRESS') {
        matchStatus = item.visit.status === 'In_Progress';
      } else if (selectedStatus === 'SCHEDULED') {
        matchStatus = item.visit.status === 'Scheduled';
      }

      let matchTech = true;
      if (selectedTechnicianId !== 'ALL') {
        if (selectedTechnicianId === 'UNASSIGNED') {
          matchTech = !item.visit.assignedTechnicianId && !item.contract.assignedTechnicianId;
        } else {
          matchTech = item.visit.assignedTechnicianId === selectedTechnicianId || 
                      item.contract.assignedTechnicianId === selectedTechnicianId;
        }
      }

      let matchCustomer = true;
      if (selectedCustomerId !== 'ALL') {
        matchCustomer = item.contract.customerName === selectedCustomerId;
      }

      return matchSearch && matchStatus && matchTech && matchCustomer;
    });
  }, [scopedVisits, searchQuery, selectedStatus, selectedTechnicianId, selectedCustomerId]);

  // Handler: Save Completed Review
  const handleSaveReview = (visitId: string, updatedReview: MaintenanceVisitReview, newStatus: MaintenanceVisitStatus) => {
    if (!reviewingVisitItem || !onSaveContract) return;

    const contract = reviewingVisitItem.contract;
    const updatedVisits = contract.visits.map(v => {
      if (v.id === visitId) {
        return {
          ...v,
          status: newStatus,
          technician: updatedReview.technicianName,
          review: updatedReview,
        };
      }
      return v;
    });

    onSaveContract({
      ...contract,
      visits: updatedVisits,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    setReviewingVisitItem(null);
    triggerToast(isAr ? 'تم توثيق وحفظ تقرير زيارة الصيانة بنجاح!' : 'Maintenance visit documented successfully!');
  };

  // Handler: Quick Status Update
  const handleQuickStatusChange = (item: VisitScheduleItem, newStatus: MaintenanceVisitStatus) => {
    if (!onSaveContract) return;

    const contract = item.contract;
    const updatedVisits = contract.visits.map(v => {
      if (v.id === item.visit.id) {
        return {
          ...v,
          status: newStatus,
        };
      }
      return v;
    });

    onSaveContract({
      ...contract,
      visits: updatedVisits,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    triggerToast(
      isAr 
        ? `تم تحديث حالة الزيارة إلى "${VISIT_STATUS_CONFIG[newStatus]?.labelAr || newStatus}"`
        : `Visit status updated to ${newStatus}`
    );
  };

  // Handler: Submit Reschedule
  const handleConfirmReschedule = () => {
    if (!reschedulingVisitItem || !newScheduleDate || !onSaveContract) return;

    const contract = reschedulingVisitItem.contract;
    const assignedEmp = employees.find(e => e.id === rescheduleTechId);

    const updatedVisits = contract.visits.map(v => {
      if (v.id === reschedulingVisitItem.visit.id) {
        const monthLabel = `${isAr ? 'زيارة مؤجلة' : 'Rescheduled'} - ${newScheduleDate}`;
        return {
          ...v,
          scheduledDate: newScheduleDate,
          monthLabel,
          status: 'Scheduled' as MaintenanceVisitStatus,
          assignedTechnicianId: rescheduleTechId || v.assignedTechnicianId,
          technician: assignedEmp ? assignedEmp.name : v.technician,
          technicianPhone: assignedEmp ? assignedEmp.phone : v.technicianPhone,
        };
      }
      return v;
    });

    onSaveContract({
      ...contract,
      visits: updatedVisits,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    setReschedulingVisitItem(null);
    setNewScheduleDate('');
    setRescheduleNotes('');
    triggerToast(isAr ? 'تمت إعادة جدولة موعد الزيارة بنجاح!' : 'Visit rescheduled successfully!');
  };

  // Handler: Quick Change Assigned Technician
  const handleQuickTechnicianChange = (item: VisitScheduleItem, newTechId: string) => {
    if (!onSaveContract) return;

    const contract = item.contract;
    const assignedEmp = employees.find(e => e.id === newTechId);
    const techName = assignedEmp ? assignedEmp.name : '';
    const techPhone = assignedEmp ? assignedEmp.phone : '';

    const updatedVisits = contract.visits.map(v => {
      if (v.id === item.visit.id) {
        return {
          ...v,
          assignedTechnicianId: newTechId,
          technician: techName,
          technicianPhone: techPhone,
        };
      }
      return v;
    });

    onSaveContract({
      ...contract,
      visits: updatedVisits,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    triggerToast(
      isAr 
        ? `تم إسناد الزيارة إلى الفني "${techName || 'غير محدد'}" بنجاح!` 
        : `Technician assigned to visit successfully!`
    );
  };

  // Handler: Save Technician from EditVisitTechnicianModal
  const handleSaveTechnicianModal = (
    item: VisitScheduleItem,
    newTechId: string,
    instructions?: string,
    onSuccessCallback?: (msg: string) => void
  ) => {
    if (!onSaveContract) return;

    const contract = item.contract;
    const assignedEmp = employees.find(e => e.id === newTechId);
    const techName = assignedEmp ? assignedEmp.name : '';
    const techPhone = assignedEmp ? assignedEmp.phone : '';

    const updatedVisits = contract.visits.map(v => {
      if (v.id === item.visit.id) {
        return {
          ...v,
          assignedTechnicianId: newTechId,
          technician: techName,
          technicianPhone: techPhone,
        };
      }
      return v;
    });

    onSaveContract({
      ...contract,
      visits: updatedVisits,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    const msg = isAr 
      ? `تم تعديل وإسناد الزيارة للفني "${techName}" بنجاح!` 
      : `Visit successfully assigned to ${techName}!`;

    triggerToast(msg);
    if (onSuccessCallback) {
      onSuccessCallback(msg);
    }
  };

  // Handler: Batch Reassign Callback
  const handleBatchReassignSuccess = (
    updatedContracts: MaintenanceContract[],
    count: number,
    fromName: string,
    toName: string
  ) => {
    if (!onSaveContract) return;
    updatedContracts.forEach(c => onSaveContract(c));
    triggerToast(
      isAr 
        ? `تم نقل وإسناد (${count}) زيارة صيانة من "${fromName}" إلى "${toName}" بنجاح!` 
        : `Successfully reassigned ${count} visits from ${fromName} to ${toName}!`
    );
  };

  // Handler: Send Monthly Summary to Technician
  const handleSendTechnicianMonthlySummary = (techId: string) => {
    const emp = employees.find(e => e.id === techId);
    if (!emp || !emp.phone) {
      alert(isAr ? 'الفني ليس لديه رقم هاتف مسجل' : 'No phone registered for technician');
      return;
    }
    const techVisits = scopedVisits.filter(item => 
      item.visit.assignedTechnicianId === techId || item.contract.assignedTechnicianId === techId
    );
    const msg = buildTechnicianScheduleSummaryMessage({
      technicianName: emp.name,
      monthName: isAr ? MONTH_NAMES_AR[selectedMonth] : MONTH_NAMES_EN[selectedMonth],
      year: selectedYear,
      visitsCount: techVisits.length,
      visitsList: techVisits.map(v => ({
        date: v.visit.scheduledDate,
        customer: v.contract.customerName,
        elevator: v.contract.elevatorName,
        location: v.contract.siteLocation,
      })),
      companyName: companySettings?.companyNameAr || 'شركة توينز للمصاعد',
    });
    setWaTargetPhone(emp.phone);
    setWaDefaultMessage(msg);
    setWaRecipientName(emp.name);
    setWaContextTitle(isAr ? `كشف زيارات الشهر للفني: ${emp.name}` : `Monthly Schedule`);
    setWhatsAppModalOpen(true);
  };

  // Handler: Send Monthly Schedule to Customer
  const handleSendCustomerSchedule = (customerName: string) => {
    const custVisits = scopedVisits.filter(item => item.contract.customerName === customerName);
    const targetPhone = custVisits[0]?.contract.customerPhone || '';
    const msg = buildClientScheduleSummaryMessage({
      customerName,
      monthName: isAr ? MONTH_NAMES_AR[selectedMonth] : MONTH_NAMES_EN[selectedMonth],
      year: selectedYear,
      visits: custVisits.map(v => ({
        date: v.visit.scheduledDate,
        elevator: v.contract.elevatorName,
        techName: v.visit.technician,
        status: VISIT_STATUS_CONFIG[v.visit.status]?.labelAr || v.visit.status,
      })),
      companyName: companySettings?.companyNameAr || 'شركة توينز للمصاعد',
    });
    setWaTargetPhone(targetPhone);
    setWaDefaultMessage(msg);
    setWaRecipientName(customerName);
    setWaContextTitle(isAr ? `جدول المواعيد للعميل: ${customerName}` : `Client Schedule`);
    setWhatsAppModalOpen(true);
  };

  // Handler: Open WhatsApp Modal
  const handleOpenWhatsAppForVisit = (item: VisitScheduleItem, targetType: 'CUSTOMER' | 'TECHNICIAN' = 'CUSTOMER') => {
    const isCompleted = item.visit.status === 'Completed';
    const compName = companySettings?.companyNameAr || 'شركة توينز للمصاعد';
    
    if (targetType === 'CUSTOMER') {
      const phone = item.contract.customerPhone || '';
      let msg = '';
      if (isCompleted) {
        msg = buildVisitCompletedMessage({
          customerName: item.contract.customerName,
          elevatorName: item.contract.elevatorName,
          completedDate: item.visit.scheduledDate,
          technicianName: item.visit.technician,
          elevatorCondition: item.visit.review?.elevatorCondition,
          notes: item.visit.review?.technicianNotes || item.visit.review?.workPerformed,
          companyName: compName,
        });
      } else {
        msg = buildVisitScheduledMessage({
          customerName: item.contract.customerName,
          elevatorName: item.contract.elevatorName,
          scheduledDate: item.visit.scheduledDate,
          siteLocation: item.contract.siteLocation,
          technicianName: item.visit.technician,
          technicianPhone: item.visit.technicianPhone,
          companyName: compName,
        });
      }
      setWaTargetPhone(phone);
      setWaDefaultMessage(msg);
      setWaRecipientName(item.contract.customerName);
      setWaContextTitle(isAr ? `إشعار العميل: ${item.contract.customerName}` : `Customer Notice`);
    } else {
      // Send dispatch notice to technician
      const emp = employees.find(e => e.id === item.visit.assignedTechnicianId);
      const phone = emp?.phone || item.visit.technicianPhone || '';
      const msg = buildTechnicianDispatchMessage({
        technicianName: item.visit.technician || (emp ? emp.name : 'فني الصيانة'),
        customerName: item.contract.customerName,
        customerPhone: item.contract.customerPhone,
        elevatorName: item.contract.elevatorName,
        siteLocation: item.contract.siteLocation,
        scheduledDate: item.visit.scheduledDate,
        notes: item.visit.monthLabel,
      });
      setWaTargetPhone(phone);
      setWaDefaultMessage(msg);
      setWaRecipientName(item.visit.technician || (emp ? emp.name : 'الفني'));
      setWaContextTitle(isAr ? `إسناد مهمة للفني: ${item.visit.technician || emp?.name}` : `Technician Dispatch`);
    }
    setWhatsAppModalOpen(true);
  };

  // Calendar Day Generation
  const calendarDays = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth;
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { dayNumber: number; dateStr: string; visits: VisitScheduleItem[]; isCurrentMonth: boolean }[] = [];

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const padM = String(month + 1).padStart(2, '0');
      const padD = String(d).padStart(2, '0');
      const dateStr = `${year}-${padM}-${padD}`;
      const dayVisits = filteredVisits.filter(v => v.visit.scheduledDate === dateStr);
      days.push({
        dayNumber: d,
        dateStr,
        visits: dayVisits,
        isCurrentMonth: true
      });
    }

    return { firstDayIndex, days };
  }, [selectedYear, selectedMonth, filteredVisits]);

  // Interactive Table Column Definitions
  const scheduleColumns: InteractiveColumn<VisitScheduleItem>[] = useMemo(() => [
    {
      id: 'date',
      header: isAr ? 'التاريخ المجدول' : 'Date',
      headerAr: 'التاريخ المجدول',
      headerEn: 'Date',
      sortable: true,
      accessor: (item) => item.visit.scheduledDate,
      renderCell: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${item.isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
            <span className={`font-bold font-mono text-sm ${item.isOverdue ? 'text-rose-700 underline font-black' : 'text-slate-900'}`}>
              {item.visit.scheduledDate}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
              {item.visit.monthLabel}
            </span>
            {item.isOverdue && item.visit.status !== 'Completed' && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 border border-rose-200">
                <AlertCircle className="w-3 h-3" />
                {isAr ? 'متأخرة' : 'Overdue'}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'client_location',
      header: isAr ? 'العميل والموقع' : 'Client & Location',
      headerAr: 'العميل والموقع',
      headerEn: 'Client & Location',
      sortable: true,
      accessor: (item) => item.contract.customerName,
      renderCell: (item) => (
        <div className="space-y-0.5 max-w-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{item.contract.customerName}</span>
          </div>
          {item.contract.siteLocation && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="truncate">{item.contract.siteLocation}</span>
            </div>
          )}
          {item.contract.customerPhone && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Phone className="w-2.5 h-2.5" />
              <span>{item.contract.customerPhone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'elevator',
      header: isAr ? 'المصعد والعقد' : 'Elevator & Contract',
      headerAr: 'المصعد والعقد',
      headerEn: 'Elevator & Contract',
      sortable: true,
      accessor: (item) => item.contract.elevatorName,
      renderCell: (item) => (
        <div className="space-y-0.5 max-w-[200px]">
          <div className="font-semibold text-slate-800 text-xs truncate">
            {item.contract.elevatorName}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded-sm font-bold text-slate-700">
              {item.contract.contractRef}
            </span>
            {item.contract.elevatorStops && (
              <span>{item.contract.elevatorStops} {isAr ? 'وقفة' : 'stops'}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'technician',
      header: isAr ? 'الفني المعين' : 'Technician',
      headerAr: 'الفني المعين',
      headerEn: 'Technician',
      sortable: true,
      accessor: (item) => {
        const emp = employees.find(e => e.id === item.visit.assignedTechnicianId);
        return emp ? emp.name : (item.visit.technician || '');
      },
      renderCell: (item) => {
        const emp = employees.find(e => e.id === item.visit.assignedTechnicianId);
        const techName = emp ? emp.name : (item.visit.technician || (isAr ? 'غير محدد' : 'Unassigned'));
        return (
          <div className="space-y-1.5 min-w-[140px]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                {techName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">{techName}</div>
                <div className="text-[10px] text-slate-400">
                  {emp?.phone || item.visit.technicianPhone || (isAr ? 'فني معتمد' : 'Tech')}
                </div>
              </div>
            </div>

            {/* Quick Reassign Technician Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditingTechnicianItem(item)}
                className="text-[10px] py-1 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md font-bold transition-colors flex items-center gap-1 flex-1 justify-center shadow-2xs"
                title={isAr ? 'تعديل الفني مع إمكانية إرسال إشعار واتساب فوري' : 'Edit Technician & Notify via WhatsApp'}
              >
                <UserCheck className="w-3 h-3 text-purple-600 shrink-0" />
                <span className="truncate">{isAr ? 'تعديل الفني' : 'Edit Tech'}</span>
              </button>

              {/* Quick WhatsApp Dispatch to Technician */}
              {item.visit.assignedTechnicianId && (
                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppForVisit(item, 'TECHNICIAN')}
                  className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition-colors shrink-0 shadow-2xs"
                  title={isAr ? 'إرسال تفاصيل المهمة للفني عبر واتساب (API)' : 'Dispatch via WhatsApp API'}
                >
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: isAr ? 'حالة الزيارة' : 'Status',
      headerAr: 'حالة الزيارة',
      headerEn: 'Status',
      sortable: true,
      accessor: (item) => item.visit.status,
      renderCell: (item) => {
        const statusCfg = VISIT_STATUS_CONFIG[item.visit.status] || VISIT_STATUS_CONFIG['Scheduled'];
        return (
          <div className="space-y-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border shadow-2xs ${statusCfg.badgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${statusCfg.dotClass}`}></span>
              {isAr ? statusCfg.labelAr : statusCfg.labelEn}
            </span>

            {/* Quick Status Dropdown */}
            <div>
              <select
                aria-label={isAr ? 'تغيير حالة الزيارة السريعة' : 'Quick change visit status'}
                value={item.visit.status}
                onChange={(e) => handleQuickStatusChange(item, e.target.value as MaintenanceVisitStatus)}
                className="text-[11px] py-0.5 px-1 bg-white border border-slate-200 rounded-sm text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Completed">{isAr ? '✓ منجزة وموثقة' : 'Completed'}</option>
                <option value="Scheduled">{isAr ? '⏳ مجدولة قادمة' : 'Scheduled'}</option>
                <option value="In_Progress">{isAr ? '⚙️ قيد التنفيذ' : 'In Progress'}</option>
                <option value="Pending">{isAr ? '⏸ معلقة / مؤجلة' : 'Pending'}</option>
                <option value="Missed">{isAr ? '✕ فائتة / متأخرة' : 'Missed'}</option>
              </select>
            </div>
          </div>
        );
      },
    },
    {
      id: 'review',
      header: isAr ? 'التوثيق والفحص' : 'Inspection Report',
      headerAr: 'التوثيق والفحص',
      headerEn: 'Inspection Report',
      sortable: false,
      renderCell: (item) => {
        const review = item.visit.review;
        const isDocumented = Boolean(review && item.visit.status === 'Completed');

        return (
          <div className="text-xs space-y-1">
            {isDocumented ? (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                  {isAr ? 'موثقة بتقرير فني' : 'Inspection Certified'}
                </span>
                {review?.elevatorCondition && (
                  <div className="text-[10px] text-slate-500">
                    {isAr ? 'حالة المصعد:' : 'Condition:'}{' '}
                    <span className="font-bold text-slate-700">
                      {review.elevatorCondition === 'Excellent' ? (isAr ? 'ممتازة' : 'Excellent') :
                       review.elevatorCondition === 'Good' ? (isAr ? 'جيدة' : 'Good') :
                       review.elevatorCondition === 'Needs_Attention' ? (isAr ? 'تحتاج ملاحظات' : 'Attention') :
                       (isAr ? 'حرجة' : 'Critical')}
                    </span>
                  </div>
                )}
                {review?.clientSigned && (
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <span>✓</span> {isAr ? 'توقيع العميل معتمد' : 'Client Approved'}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium italic">
                {isAr ? 'بانتظار التوثيق الفني' : 'Pending Documentation'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      headerAr: 'الإجراءات',
      headerEn: 'Actions',
      sortable: false,
      align: 'end',
      renderCell: (item) => (
        <div className="flex items-center gap-1.5 justify-end">
          {/* Document / Complete Button */}
          <button
            type="button"
            onClick={() => setReviewingVisitItem(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
            title={isAr ? 'توثيق وتسجيل إنجاز الزيارة' : 'Complete & Document Visit'}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{item.visit.status === 'Completed' ? (isAr ? 'تقرير' : 'Report') : (isAr ? 'إنجاز' : 'Complete')}</span>
          </button>

          {/* Edit Technician Button */}
          <button
            type="button"
            onClick={() => setEditingTechnicianItem(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-lg transition-colors border border-purple-200 shadow-2xs"
            title={isAr ? 'تعديل أو إسناد فني الزيارة' : 'Edit Assigned Technician'}
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden xl:inline">{isAr ? 'الفني' : 'Tech'}</span>
          </button>

          {/* WhatsApp to Client Button */}
          <button
            type="button"
            onClick={() => handleOpenWhatsAppForVisit(item, 'CUSTOMER')}
            className="inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors border border-emerald-300 shadow-2xs"
            title={isAr ? 'إرسال إشعار واتساب للعميل عبر API' : 'Send WhatsApp to Client via API'}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xl:inline">{isAr ? 'واتساب' : 'WA'}</span>
          </button>

          {/* Reschedule Button */}
          <button
            type="button"
            onClick={() => {
              setReschedulingVisitItem(item);
              setNewScheduleDate(item.visit.scheduledDate);
              setRescheduleTechId(item.visit.assignedTechnicianId || item.contract.assignedTechnicianId || '');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
            title={isAr ? 'تأجيل أو إعادة جدولة الزيارة' : 'Reschedule Visit'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'تأجيل' : 'Reschedule'}</span>
          </button>
        </div>
      ),
    },
  ], [isAr, employees, onSaveContract]);

  const schedulesTable = useInteractiveTable({
    tableId: 'maintenance_schedules_table_v2',
    columns: scheduleColumns,
    data: filteredVisits,
    isAr,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20 px-2 sm:px-4">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{feedbackToast}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute -top-12 -start-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -end-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-black rounded-full border border-purple-500/30">
                <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
                {isAr ? 'إدارة وتوثيق زيارات الصيانة' : 'Maintenance Visits Management'}
              </span>
              <span className="text-xs text-purple-200 font-mono">
                {scopedVisits.length} {isAr ? 'زيارة مسجلة' : 'visits'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr ? 'إدارة ومتابعة زيارات الصيانة الدورية' : 'Maintenance Visits & Schedules'}
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm mt-1 max-w-2xl">
              {isAr 
                ? 'لوحة تحكم مركزية لجدولة، وتوثيق، ومتابعة الزيارات المنجزة وغير المكتملة لجميع المصاعد شهرياً وسنوياً مع التوثيق المعتمد.' 
                : 'Centralized workspace to track completed, pending, and scheduled maintenance visits across all contracts month by month.'}
            </p>
          </div>

          {/* Quick Action / View Switcher */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="bg-white/10 p-1 rounded-xl flex items-center gap-1 border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول الزيارات' : 'Table View'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CALENDAR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'CALENDAR'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{isAr ? 'التقويم الشهري' : 'Calendar View'}</span>
              </button>
            </div>

            {/* Quick WhatsApp Free Composer */}
            <button
              type="button"
              onClick={() => {
                setWaTargetPhone('');
                setWaDefaultMessage(`السلام عليكم ورحمة الله،\nتواصل من قسم الصيانة والتشغيل بـ ${companySettings?.companyNameAr || 'شركة توينز للمصاعد'}.`);
                setWaRecipientName('');
                setWaContextTitle(isAr ? 'إرسال رسالة واتساب حرة (API)' : 'Direct WhatsApp API');
                setWhatsAppModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              title={isAr ? 'إرسال رسالة واتساب عبر API' : 'Send WhatsApp via API'}
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              <span>{isAr ? 'واتساب سريع' : 'WhatsApp'}</span>
            </button>

            {/* Batch Reassign Technician Button */}
            <button
              type="button"
              onClick={() => setBatchReassignOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              title={isAr ? 'نقل وتوزيع زيارات فني إلى فني آخر دفعة واحدة' : 'Batch Reassign Technician Visits'}
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-300" />
              <span>{isAr ? 'نقل زيارات فني' : 'Transfer Visits'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              title={isAr ? 'طباعة كشف الزيارات' : 'Print Schedule'}
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة الكشف' : 'Print'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Month & Year Navigator Bar (Any Past or Future Month) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Month Arrows & Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1 text-xs font-bold"
            title={isAr ? 'الشهر السابق' : 'Previous Month'}
          >
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span className="hidden sm:inline">{isAr ? 'الشهر السابق' : 'Prev'}</span>
          </button>

          {/* Current Month & Year Display Badge */}
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200/80 px-4 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-purple-700" />
            <span className="font-black text-slate-900 text-sm sm:text-base">
              {isAr ? MONTH_NAMES_AR[selectedMonth] : MONTH_NAMES_EN[selectedMonth]} {selectedYear}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1 text-xs font-bold"
            title={isAr ? 'الشهر التالي' : 'Next Month'}
          >
            <span className="hidden sm:inline">{isAr ? 'الشهر التالي' : 'Next'}</span>
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Direct Month & Year Dropdowns + Jump to Today */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Quick Month Dropdown */}
          <select
            aria-label={isAr ? 'اختر الشهر' : 'Select Month'}
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(Number(e.target.value));
              setMonthScope('SELECTED_MONTH');
            }}
            className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {MONTH_NAMES_AR.map((m, idx) => (
              <option key={idx} value={idx}>
                {isAr ? m : MONTH_NAMES_EN[idx]}
              </option>
            ))}
          </select>

          {/* Quick Year Dropdown */}
          <select
            aria-label={isAr ? 'اختر السنة' : 'Select Year'}
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setMonthScope('SELECTED_MONTH');
            }}
            className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Jump to Today Button */}
          <button
            type="button"
            onClick={handleJumpToCurrentMonth}
            className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 rounded-lg transition-colors border border-slate-200 flex items-center gap-1"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>{isAr ? 'هذا الشهر' : 'Current Month'}</span>
          </button>

          {/* Toggle All Months vs Selected Month */}
          <button
            type="button"
            onClick={() => setMonthScope(prev => prev === 'SELECTED_MONTH' ? 'ALL_MONTHS' : 'SELECTED_MONTH')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
              monthScope === 'ALL_MONTHS'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {monthScope === 'ALL_MONTHS' ? (isAr ? '✓ عرض كل الأشهر' : 'All Months Active') : (isAr ? 'عرض كل الأشهر' : 'Show All Months')}
          </button>
        </div>
      </div>

      {/* 3. Monthly Statistics / KPIs Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Visits */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {isAr ? 'إجمالي الزيارات' : 'Total Visits'}
            </span>
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {monthScope === 'SELECTED_MONTH' 
              ? `${isAr ? MONTH_NAMES_AR[selectedMonth] : MONTH_NAMES_EN[selectedMonth]} ${selectedYear}`
              : (isAr ? 'كافة العقود' : 'All contracts')}
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">
              {isAr ? 'المنجزة والموثقة' : 'Completed'}
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">{stats.completed}</div>
          <div className="text-[10px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
            <span>{stats.completionRate}%</span>
            <span>{isAr ? 'نسبة الإنجاز' : 'Rate'}</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-amber-800 uppercase">
              {isAr ? 'قيد التنفيذ' : 'In Progress'}
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">{stats.inProgress}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">
            {isAr ? 'مع الفنيين حالياً' : 'Active today'}
          </div>
        </div>

        {/* Scheduled Upcoming */}
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-blue-800 uppercase">
              {isAr ? 'مجدولة قادمة' : 'Scheduled'}
            </span>
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 font-mono">{stats.scheduled}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">
            {isAr ? 'ضمن المواعيد' : 'Upcoming'}
          </div>
        </div>

        {/* Pending / Delayed */}
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs bg-gradient-to-br from-white to-purple-50/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-purple-800 uppercase">
              {isAr ? 'غير مكتملة / مؤجلة' : 'Pending / Postponed'}
            </span>
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 font-mono">{stats.pending}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">
            {isAr ? 'تتطلب إعادة جدولة' : 'Needs attention'}
          </div>
        </div>

        {/* Missed / Overdue */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-rose-800 uppercase">
              {isAr ? 'متأخرة / فائتة' : 'Missed / Overdue'}
            </span>
            <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-700 font-mono">{stats.missed}</div>
          <div className="text-[10px] font-bold text-rose-600 mt-0.5">
            {stats.overdueOnly > 0 ? `${stats.overdueOnly} ${isAr ? 'تجاوزت التاريخ' : 'past date'}` : (isAr ? 'لا يوجد تأخير' : 'No delay')}
          </div>
        </div>
      </div>

      {/* Monthly Progress Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span>
              {isAr ? 'نسبة إنجاز زيارات الصيانة:' : 'Monthly Maintenance Completion Rate:'}{' '}
              <strong className="text-purple-700">{stats.completionRate}%</strong>
            </span>
          </div>
          <span className="text-slate-500 font-mono">
            {stats.completed} {isAr ? 'منجزة من أصل' : 'completed of'} {stats.total} {isAr ? 'زيارة' : 'visits'}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500" 
            style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
            title={`${stats.completed} ${isAr ? 'منجزة' : 'Completed'}`}
          />
          <div 
            className="bg-amber-400 h-full transition-all duration-500" 
            style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
            title={`${stats.inProgress} ${isAr ? 'قيد التنفيذ' : 'In Progress'}`}
          />
          <div 
            className="bg-rose-400 h-full transition-all duration-500" 
            style={{ width: `${stats.total > 0 ? (stats.missed / stats.total) * 100 : 0}%` }}
            title={`${stats.missed} ${isAr ? 'متأخرة أو فائتة' : 'Missed'}`}
          />
        </div>
      </div>

      {/* 4. Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{isAr ? 'كل الزيارات' : 'All Visits'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {scopedVisits.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'منجزة وموثقة' : 'Completed'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {stats.completed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'PENDING'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'غير مكتملة / معلقة' : 'Pending / Delayed'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'PENDING' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
              {stats.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('MISSED_OVERDUE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'MISSED_OVERDUE'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isAr ? 'متأخرة وفائتة' : 'Missed / Overdue'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'MISSED_OVERDUE' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {stats.missed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'IN_PROGRESS'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{isAr ? 'قيد التنفيذ' : 'In Progress'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'IN_PROGRESS' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {stats.inProgress}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('SCHEDULED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'SCHEDULED'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'مجدولة قادمة' : 'Scheduled'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'SCHEDULED' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {stats.scheduled}
            </span>
          </button>
        </div>

        {/* Search Input & Selectors Row */}
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث باسم العميل، موقع المصعد، رقم العقد، أو اسم الفني...' : 'Search client, elevator, location, or technician...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm ps-9 pe-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {/* Filter by Client */}
            <div className="w-full sm:w-52">
              <SearchableSelect
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700"
              >
                <option value="ALL">{isAr ? '👤 كل العملاء' : '👤 All Clients'} ({uniqueCustomers.length})</option>
                {uniqueCustomers.map(cust => (
                  <option key={cust.name} value={cust.name}>
                    {cust.name} ({cust.count} {isAr ? 'زيارة' : 'visits'})
                  </option>
                ))}
              </SearchableSelect>
            </div>

            {/* Filter by Technician */}
            <div className="w-full sm:w-52">
              <SearchableSelect
                value={selectedTechnicianId}
                onChange={e => setSelectedTechnicianId(e.target.value)}
                className="text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700"
              >
                <option value="ALL">{isAr ? '👷 كل الفنيين' : '👷 All Technicians'} ({scopedVisits.length})</option>
                <option value="UNASSIGNED">{isAr ? '⚠️ زيارات غير معينة' : '⚠️ Unassigned'} ({technicianVisitCounts['UNASSIGNED'] || 0})</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({technicianVisitCounts[emp.id] || 0} {isAr ? 'زيارة' : 'visits'})
                  </option>
                ))}
              </SearchableSelect>
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedStatus !== 'ALL' || selectedTechnicianId !== 'ALL' || selectedCustomerId !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('ALL');
                  setSelectedTechnicianId('ALL');
                  setSelectedCustomerId('ALL');
                }}
                className="p-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 shrink-0"
                title={isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {(selectedTechnicianId !== 'ALL' || selectedCustomerId !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">{isAr ? 'الفلاتر النشطة:' : 'Active:'}</span>

            {selectedCustomerId !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs">
                <span>{isAr ? 'العميل:' : 'Client:'} {selectedCustomerId}</span>
                <button type="button" onClick={() => setSelectedCustomerId('ALL')} className="hover:text-blue-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTechnicianId !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-bold text-xs">
                <span>
                  {isAr ? 'الفني:' : 'Tech:'}{' '}
                  {selectedTechnicianId === 'UNASSIGNED' 
                    ? (isAr ? 'غير معين' : 'Unassigned') 
                    : (employees.find(e => e.id === selectedTechnicianId)?.name || selectedTechnicianId)}
                </span>
                <button type="button" onClick={() => setSelectedTechnicianId('ALL')} className="hover:text-purple-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs">
                <span>{isAr ? 'الحالة:' : 'Status:'} {selectedStatus}</span>
                <button type="button" onClick={() => setSelectedStatus('ALL')} className="hover:text-slate-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs">
                <span>"{searchQuery}"</span>
                <button type="button" onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4.5 Filtered Technician Profile Banner */}
      {selectedTechnicianId !== 'ALL' && selectedTechnicianId !== 'UNASSIGNED' && (() => {
        const emp = employees.find(e => e.id === selectedTechnicianId);
        if (!emp) return null;
        const techVisits = scopedVisits.filter(v => v.visit.assignedTechnicianId === selectedTechnicianId);
        const techCompleted = techVisits.filter(v => v.visit.status === 'Completed').length;
        const techPending = techVisits.filter(v => v.visit.status !== 'Completed').length;

        return (
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-xl shadow-md border border-purple-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 text-purple-200 flex items-center justify-center font-black text-base border border-white/10 shrink-0">
                {emp.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base">{emp.name}</h3>
                  <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30">
                    {emp.role || (isAr ? 'فني صيانة معتمد' : 'Tech')}
                  </span>
                </div>
                <div className="text-xs text-purple-200/80 font-mono mt-0.5 flex items-center gap-2">
                  {emp.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{emp.phone}</span>
                    </span>
                  )}
                  <span>•</span>
                  <span>{techVisits.length} {isAr ? 'زيارة موكلة' : 'assigned visits'}</span>
                  <span>•</span>
                  <span className="text-emerald-300 font-bold">{techCompleted} {isAr ? 'منجزة' : 'done'}</span>
                  <span>•</span>
                  <span className="text-amber-300">{techPending} {isAr ? 'متبقية' : 'pending'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {emp.phone && (
                <button
                  type="button"
                  onClick={() => handleSendTechnicianMonthlySummary(emp.id)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  title={isAr ? 'إرسال جدول الزيارات للفني عبر واتساب (API)' : 'Send Schedule via WhatsApp'}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span>{isAr ? 'إرسال كشف الزيارات بالواتساب' : 'WhatsApp Schedule'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setBatchReassignOpen(true)}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>{isAr ? 'نقل زيارات الفني' : 'Transfer'}</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* 4.6 Filtered Client Profile Banner */}
      {selectedCustomerId !== 'ALL' && (() => {
        const custInfo = uniqueCustomers.find(c => c.name === selectedCustomerId);
        if (!custInfo) return null;
        const custVisits = scopedVisits.filter(v => v.contract.customerName === selectedCustomerId);
        const custCompleted = custVisits.filter(v => v.visit.status === 'Completed').length;

        return (
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 rounded-xl shadow-md border border-blue-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 text-blue-200 flex items-center justify-center border border-white/10 shrink-0">
                <Building2 className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h3 className="font-black text-base">{custInfo.name}</h3>
                <div className="text-xs text-blue-200/80 mt-0.5 flex items-center gap-2 flex-wrap">
                  {custInfo.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" />
                      <span>{custInfo.phone}</span>
                    </span>
                  )}
                  {custInfo.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{custInfo.location}</span>
                    </span>
                  )}
                  <span>•</span>
                  <span>{custVisits.length} {isAr ? 'زيارة صيانة' : 'visits'}</span>
                  <span>•</span>
                  <span className="text-emerald-300 font-bold">{custCompleted} {isAr ? 'منجزة وموثقة' : 'completed'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleSendCustomerSchedule(custInfo.name)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                title={isAr ? 'إرسال جدول المواعيد للعميل عبر واتساب (API)' : 'Send Schedule via WhatsApp'}
              >
                <MessageSquare className="w-4 h-4 text-emerald-200" />
                <span>{isAr ? 'إرسال المواعيد للعميل بالواتساب' : 'WhatsApp Schedule'}</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* 5. View Mode: TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Control Bar for Drag-and-Drop and Sorting Reset */}
          <TableControlBar
            isReordered={schedulesTable.isReordered}
            onResetOrder={schedulesTable.resetColumnOrder}
            sortKey={schedulesTable.sortKey}
            sortDir={schedulesTable.sortDir}
            onResetSort={schedulesTable.resetSort}
            isAr={isAr}
            totalCount={schedulesTable.sortedData.length}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  {schedulesTable.orderedColumns.map((col) => (
                    <InteractiveTableHeader
                      key={col.id}
                      column={col}
                      sortKey={schedulesTable.sortKey}
                      sortDir={schedulesTable.sortDir}
                      onSort={schedulesTable.handleSort}
                      draggedColId={schedulesTable.draggedColId}
                      dragOverColId={schedulesTable.dragOverColId}
                      onDragStart={schedulesTable.handleDragStart}
                      onDragOver={schedulesTable.handleDragOver}
                      onDragLeave={schedulesTable.handleDragLeave}
                      onDrop={schedulesTable.handleDrop}
                      onDragEnd={schedulesTable.handleDragEnd}
                      isAr={isAr}
                      theme="dark"
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedulesTable.sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={schedulesTable.orderedColumns.length} className="p-12 text-center text-slate-500">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                        <div className="font-bold text-slate-700">
                          {isAr ? 'لا توجد زيارات صيانة تطابق المعايير' : 'No visits matching criteria'}
                        </div>
                        <p className="text-xs text-slate-400">
                          {isAr 
                            ? 'يمكنك تجربة تغيير الشهر، أو اختيار "عرض كل الأشهر"، أو تعديل نص البحث.' 
                            : 'Try selecting a different month, choosing "Show All Months", or adjusting your search filters.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  schedulesTable.sortedData.map((item, idx) => (
                    <tr 
                      key={`${item.contract.id}-${item.visit.id}-${idx}`} 
                      className={`hover:bg-slate-50 transition-colors ${item.isOverdue && item.visit.status !== 'Completed' ? 'bg-rose-50/20' : ''}`}
                    >
                      {schedulesTable.orderedColumns.map((col) => (
                        <td
                          key={col.id}
                          className={`p-3.5 ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'end'
                              ? 'text-end'
                              : 'text-start'
                          } ${col.className || ''}`}
                        >
                          {col.renderCell(item, idx)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. View Mode: CALENDAR VIEW */}
      {viewMode === 'CALENDAR' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>
                {isAr ? 'تقويم زيارات شهر' : 'Visits Calendar for'}{' '}
                {isAr ? MONTH_NAMES_AR[selectedMonth] : MONTH_NAMES_EN[selectedMonth]} {selectedYear}
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>{isAr ? 'منجزة' : 'Done'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>{isAr ? 'مجدولة' : 'Scheduled'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>{isAr ? 'متأخرة' : 'Overdue'}</span>
              </span>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-600">
            {(isAr ? DAYS_OF_WEEK_AR : DAYS_OF_WEEK_EN).map((dayName, idx) => (
              <div key={idx} className="py-2 bg-slate-50 rounded-lg">
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty slots before first day */}
            {Array.from({ length: calendarDays.firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[90px] sm:min-h-[110px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-1.5 opacity-40"></div>
            ))}

            {/* Days in Month */}
            {calendarDays.days.map((day) => {
              const hasVisits = day.visits.length > 0;
              const isToday = day.dateStr === today.toISOString().split('T')[0];

              return (
                <div 
                  key={day.dateStr}
                  className={`min-h-[90px] sm:min-h-[110px] rounded-xl border p-1.5 flex flex-col justify-between transition-all ${
                    isToday 
                      ? 'border-purple-500 bg-purple-50/30 ring-2 ring-purple-200' 
                      : hasVisits 
                      ? 'border-slate-300 bg-white hover:border-purple-300' 
                      : 'border-slate-100 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-purple-600 text-white' : 'text-slate-700'
                    }`}>
                      {day.dayNumber}
                    </span>
                    {hasVisits && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 rounded-full">
                        {day.visits.length}
                      </span>
                    )}
                  </div>

                  {/* Day Visits Badges */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                    {day.visits.map((vItem, vIdx) => {
                      const isDone = vItem.visit.status === 'Completed';
                      const isLate = vItem.isOverdue && !isDone;
                      const emp = employees.find(e => e.id === vItem.visit.assignedTechnicianId);
                      const techName = emp ? emp.name : (vItem.visit.technician || '');

                      return (
                        <div
                          key={vIdx}
                          onClick={() => setActiveCalendarVisitMenu(vItem)}
                          className={`p-1.5 rounded-lg text-[10px] font-semibold truncate cursor-pointer transition-transform hover:scale-102 border shadow-2xs ${
                            isDone 
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                              : isLate 
                              ? 'bg-rose-50 text-rose-900 border-rose-300 font-bold' 
                              : 'bg-blue-50 text-blue-900 border-blue-200'
                          }`}
                          title={`${vItem.contract.customerName} - ${vItem.contract.elevatorName} (${techName || 'بدون فني'})`}
                        >
                          <div className="truncate font-bold flex items-center justify-between">
                            <span className="truncate">{vItem.contract.customerName}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-500' : isLate ? 'bg-rose-500' : 'bg-blue-500'} shrink-0`}></span>
                          </div>
                          <div className="text-[9px] text-slate-500 truncate">{vItem.contract.elevatorName}</div>
                          {techName && (
                            <div className="text-[9px] font-bold text-purple-700 truncate flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                              <span className="truncate">{techName}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Calendar Visit Action Dialog */}
      {activeCalendarVisitMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
                  {activeCalendarVisitMenu.visit.scheduledDate}
                </span>
                <h3 className="font-bold text-sm mt-1">{activeCalendarVisitMenu.contract.customerName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCalendarVisitMenu(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-600 font-medium">المصعد: <strong className="text-slate-900">{activeCalendarVisitMenu.contract.elevatorName}</strong></div>
                {activeCalendarVisitMenu.contract.siteLocation && (
                  <div className="text-slate-500 text-[11px] truncate">الموقع: {activeCalendarVisitMenu.contract.siteLocation}</div>
                )}
                <div className="text-purple-700 font-bold text-[11px]">
                  الفني المعين: {activeCalendarVisitMenu.visit.technician || 'غير محدد'}
                </div>
              </div>

              {/* Action Buttons List */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const item = activeCalendarVisitMenu;
                    setActiveCalendarVisitMenu(null);
                    setReviewingVisitItem(item);
                  }}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>{activeCalendarVisitMenu.visit.status === 'Completed' ? 'عرض وتعديل تقرير الفحص' : 'توثيق وإنجاز الزيارة'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const item = activeCalendarVisitMenu;
                    setActiveCalendarVisitMenu(null);
                    setEditingTechnicianItem(item);
                  }}
                  className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 transition-colors flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span>تعديل الفني المسؤول عن الزيارة</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const item = activeCalendarVisitMenu;
                      setActiveCalendarVisitMenu(null);
                      handleOpenWhatsAppForVisit(item, 'CUSTOMER');
                    }}
                    className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>واتساب العميل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const item = activeCalendarVisitMenu;
                      setActiveCalendarVisitMenu(null);
                      handleOpenWhatsAppForVisit(item, 'TECHNICIAN');
                    }}
                    className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>واتساب الفني</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const item = activeCalendarVisitMenu;
                    setActiveCalendarVisitMenu(null);
                    setReschedulingVisitItem(item);
                    setNewScheduleDate(item.visit.scheduledDate);
                    setRescheduleTechId(item.visit.assignedTechnicianId || item.contract.assignedTechnicianId || '');
                  }}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>إعادة جدولة أو تأجيل الموعد</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Document / Complete Review Modal */}
      {reviewingVisitItem && (
        <MaintenanceVisitReviewModal
          visit={reviewingVisitItem.visit}
          contract={reviewingVisitItem.contract}
          companySettings={companySettings}
          language={language}
          isOpen={Boolean(reviewingVisitItem)}
          onClose={() => setReviewingVisitItem(null)}
          onSaveReview={handleSaveReview}
        />
      )}

      {/* 7.5 Edit Visit Technician Modal */}
      <EditVisitTechnicianModal
        isOpen={Boolean(editingTechnicianItem)}
        onClose={() => setEditingTechnicianItem(null)}
        visitItem={editingTechnicianItem}
        employees={employees}
        language={language}
        companySettings={companySettings}
        onSave={handleSaveTechnicianModal}
      />

      {/* 7.6 Batch Reassign Technician Visits Modal */}
      <BatchReassignTechnicianModal
        isOpen={batchReassignOpen}
        onClose={() => setBatchReassignOpen(false)}
        visits={scopedVisits}
        contracts={contracts}
        employees={employees}
        language={language}
        selectedMonthName={isAr ? MONTH_NAMES_AR[selectedMonth] : MONTH_NAMES_EN[selectedMonth]}
        selectedYear={selectedYear}
        onBatchReassign={handleBatchReassignSuccess}
      />

      {/* 8. Reschedule / Postpone Modal */}
      {reschedulingVisitItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-base">
                  {isAr ? 'إعادة جدولة أو تأجيل زيارة الصيانة' : 'Reschedule Maintenance Visit'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReschedulingVisitItem(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Visit Info Summary */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{reschedulingVisitItem.contract.customerName}</div>
                <div className="text-slate-600">{reschedulingVisitItem.contract.elevatorName}</div>
                <div className="text-purple-700 font-mono">
                  {isAr ? 'الموعد السابق:' : 'Previous date:'} {reschedulingVisitItem.visit.scheduledDate} ({reschedulingVisitItem.visit.monthLabel})
                </div>
              </div>

              {/* New Date Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'الموعد المجدول الجديد *' : 'New Scheduled Date *'}
                </label>
                <input
                  type="date"
                  value={newScheduleDate}
                  onChange={(e) => setNewScheduleDate(e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                  required
                />
              </div>

              {/* Reason for delay */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'سبب التأجيل / التعديل' : 'Reason for Postponement'}
                </label>
                <select
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold"
                >
                  <option value="طلب العميل">{isAr ? 'بطلب وموافقة العميل' : 'Client Request'}</option>
                  <option value="تعذر الدخول للمبنى">{isAr ? 'تعذر الدخول للمبنى أو إغلاق الموقع' : 'Access Restricted'}</option>
                  <option value="انتظار قطع غيار">{isAr ? 'انتظار وصول قطع غيار معتمدة' : 'Waiting for Spare Parts'}</option>
                  <option value="انقطاع تيار كهربائي">{isAr ? 'انقطاع تيار كهربائي أو أعمال إنشائية' : 'Power Outage'}</option>
                  <option value="ظروف طارئة">{isAr ? 'ظروف تشغيلية وفنية طارئة' : 'Operational Emergency'}</option>
                </select>
              </div>

              {/* Reassign Technician */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'إسناد لفني صيانة' : 'Assign to Technician'}
                </label>
                <SearchableSelect
                  value={rescheduleTechId}
                  onChange={(e) => setRescheduleTechId(e.target.value)}
                  className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 font-bold"
                >
                  <option value="">{isAr ? 'الاحتفاظ بالفني الحالي' : 'Keep Current Technician'}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </SearchableSelect>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReschedulingVisitItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={!newScheduleDate}
                className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'حفظ الموعد الجديد' : 'Save Reschedule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Send WhatsApp Notification Modal */}
      <SendWhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        defaultPhone={waTargetPhone}
        defaultMessage={waDefaultMessage}
        recipientName={waRecipientName}
        contextTitle={waContextTitle}
        isAr={isAr}
      />
    </div>
  );
};
