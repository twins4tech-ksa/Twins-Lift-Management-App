import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Search, 
  MapPin, 
  User, 
  Phone,
  Clock,
  CheckCircle2,
  Wrench,
  Plus,
  Edit2,
  Printer,
  ShieldCheck,
  MessageSquare,
  Building2,
  DollarSign,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  X,
  Calendar
} from 'lucide-react';
import { AppLanguage, TRANSLATIONS } from '../utils/translations';
import { MaintenanceBreakdown, BreakdownStatus, BreakdownPriority, BreakdownCustomerType } from '../types/maintenance';
import { Employee } from '../types/employee';
import { ElevatorSpecification, Customer } from '../types/elevator';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/settings';
import { BreakdownModal } from './BreakdownModal';
import { BreakdownReportModal } from './BreakdownReportModal';
import { SendWhatsAppModal } from './SendWhatsAppModal';
import { buildBreakdownAlertMessage } from '../services/whatsappService';

interface MaintenanceBreakdownsViewProps {
  breakdowns: MaintenanceBreakdown[];
  language: AppLanguage;
  onAddBreakdown: (breakdown: MaintenanceBreakdown) => void;
  onUpdateBreakdown: (breakdown: MaintenanceBreakdown) => void;
  employees: Employee[];
  projects: ElevatorSpecification[];
  customers: Customer[];
  companySettings?: CompanySettings;
}

const STATUS_CONFIG: Record<BreakdownStatus, { labelAr: string; labelEn: string; badgeClass: string; dotClass: string }> = {
  Reported: { labelAr: 'مبلغ عنه', labelEn: 'Reported', badgeClass: 'bg-rose-50 text-rose-800 border-rose-200', dotClass: 'bg-rose-500' },
  Assigned: { labelAr: 'تم التعيين', labelEn: 'Assigned', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200', dotClass: 'bg-amber-500' },
  In_Progress: { labelAr: 'قيد الإصلاح', labelEn: 'In Progress', badgeClass: 'bg-blue-50 text-blue-800 border-blue-200', dotClass: 'bg-blue-500' },
  Requires_Parts: { labelAr: 'بانتظار قطع غيار', labelEn: 'Requires Parts', badgeClass: 'bg-purple-50 text-purple-800 border-purple-200', dotClass: 'bg-purple-500' },
  Resolved: { labelAr: 'تم الإصلاح', labelEn: 'Resolved', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200', dotClass: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<BreakdownPriority, { labelAr: string; labelEn: string; badgeClass: string }> = {
  Low: { labelAr: 'عادي', labelEn: 'Low', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  Medium: { labelAr: 'متوسط', labelEn: 'Medium', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
  High: { labelAr: 'مرتفع', labelEn: 'High', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 font-bold' },
  Emergency: { labelAr: 'طوارئ قصوى', labelEn: 'Emergency', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse' },
};

export const MaintenanceBreakdownsView: React.FC<MaintenanceBreakdownsViewProps> = ({
  breakdowns,
  language,
  onAddBreakdown,
  onUpdateBreakdown,
  employees,
  projects,
  customers,
  companySettings = DEFAULT_COMPANY_SETTINGS,
}) => {
  const isAr = language === 'ar';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BreakdownStatus | 'ALL'>('ALL');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'ALL' | 'CONTRACT' | 'ONE_TIME'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'COMPACT_GRID' | 'TABLE'>('COMPACT_GRID');
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBreakdown, setEditingBreakdown] = useState<MaintenanceBreakdown | undefined>(undefined);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportBreakdown, setReportBreakdown] = useState<MaintenanceBreakdown | null>(null);

  // WhatsApp modal state
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waRecipient, setWaRecipient] = useState('');
  const [waTitle, setWaTitle] = useState('');

  const handleOpenNewModal = () => {
    setEditingBreakdown(undefined);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (breakdown: MaintenanceBreakdown) => {
    setEditingBreakdown(breakdown);
    setIsEditModalOpen(true);
  };

  const handleOpenReportModal = (breakdown: MaintenanceBreakdown) => {
    setReportBreakdown(breakdown);
    setIsReportModalOpen(true);
  };

  const handleOpenWhatsApp = (breakdown: MaintenanceBreakdown, target: 'CUSTOMER' | 'TECH' = 'CUSTOMER') => {
    if (target === 'CUSTOMER') {
      const msg = buildBreakdownAlertMessage({
        customerName: breakdown.customerName,
        elevatorName: breakdown.elevatorName,
        siteLocation: breakdown.siteLocation,
        priority: PRIORITY_CONFIG[breakdown.priority]?.labelAr || breakdown.priority,
        description: breakdown.description,
        companyName: companySettings?.companyNameAr || 'شركة توينز للمصاعد',
      });
      setWaPhone(breakdown.customerPhone || '');
      setWaMessage(msg);
      setWaRecipient(breakdown.customerName);
      setWaTitle(isAr ? `إشعار عميل البلاغ: ${breakdown.customerName}` : `Breakdown Notice`);
    } else {
      let techMsg = `مرحباً ${breakdown.assignedTechnicianName || 'فني الطوارئ'} 🚨\n\n`;
      techMsg += `بلاغ عطل طارئ مسند إليك:\n`;
      techMsg += `▫️ *العميل:* ${breakdown.customerName}\n`;
      if (breakdown.customerPhone) techMsg += `▫️ *الهاتف:* ${breakdown.customerPhone}\n`;
      techMsg += `▫️ *المصعد:* ${breakdown.elevatorName}\n`;
      techMsg += `▫️ *الموقع:* ${breakdown.siteLocation}\n`;
      techMsg += `▫️ *الأولوية:* ${PRIORITY_CONFIG[breakdown.priority]?.labelAr || breakdown.priority}\n`;
      techMsg += `▫️ *الوصف:* ${breakdown.description}\n`;
      techMsg += `\nيرجى التوجه فوراً وإفادتنا عند الوصول والبدء بالإصلاح.`;
      
      const emp = employees.find(e => e.id === breakdown.assignedTechnicianId);
      setWaPhone(emp?.phone || breakdown.assignedTechnicianPhone || '');
      setWaMessage(techMsg);
      setWaRecipient(breakdown.assignedTechnicianName || 'الفني');
      setWaTitle(isAr ? `إسناد طارئ للفني: ${breakdown.assignedTechnicianName || ''}` : `Tech Dispatch`);
    }
    setWhatsAppModalOpen(true);
  };

  const handleSaveBreakdown = (breakdown: MaintenanceBreakdown) => {
    if (editingBreakdown) {
      onUpdateBreakdown(breakdown);
    } else {
      onAddBreakdown(breakdown);
    }
    setIsEditModalOpen(false);
  };

  // KPIs
  const stats = useMemo(() => {
    const total = breakdowns.length;
    const contractCount = breakdowns.filter(b => b.customerType !== 'ONE_TIME').length;
    const oneTimeCount = breakdowns.filter(b => b.customerType === 'ONE_TIME').length;
    const emergencyCount = breakdowns.filter(b => b.priority === 'Emergency' || b.priority === 'High').length;
    const resolvedCount = breakdowns.filter(b => b.isResolved || b.status === 'Resolved').length;
    const pendingCount = total - resolvedCount;

    return { total, contractCount, oneTimeCount, emergencyCount, resolvedCount, pendingCount };
  }, [breakdowns]);

  // Filtered List
  const filteredBreakdowns = useMemo(() => {
    return breakdowns.filter(b => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        b.customerName.toLowerCase().includes(q) ||
        b.elevatorName.toLowerCase().includes(q) ||
        (b.elevatorNumber && b.elevatorNumber.toLowerCase().includes(q)) ||
        b.siteLocation.toLowerCase().includes(q) ||
        (b.assignedTechnicianName && b.assignedTechnicianName.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q));
      
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      
      const isContract = b.customerType !== 'ONE_TIME';
      const matchesCustomerType = customerTypeFilter === 'ALL' || 
        (customerTypeFilter === 'CONTRACT' && isContract) ||
        (customerTypeFilter === 'ONE_TIME' && !isContract);

      // Period Date Filter
      let matchesPeriod = true;
      if (dateFilter !== 'ALL' && b.reportedAt) {
        const itemDate = new Date(b.reportedAt);
        if (!isNaN(itemDate.getTime())) {
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

          if (dateFilter === 'TODAY') {
            matchesPeriod = itemDate >= todayStart && itemDate <= todayEnd;
          } else if (dateFilter === 'THIS_WEEK') {
            const day = now.getDay();
            const diffToSaturday = (day + 1) % 7;
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - diffToSaturday);
            weekStart.setHours(0, 0, 0, 0);
            matchesPeriod = itemDate >= weekStart && itemDate <= todayEnd;
          } else if (dateFilter === 'THIS_MONTH') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            matchesPeriod = itemDate >= monthStart && itemDate < nextMonthStart;
          } else if (dateFilter === 'LAST_MONTH') {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            matchesPeriod = itemDate >= lastMonthStart && itemDate < thisMonthStart;
          } else if (dateFilter === 'CUSTOM') {
            if (customStartDate && itemDate < new Date(customStartDate + 'T00:00:00')) matchesPeriod = false;
            if (customEndDate && itemDate > new Date(customEndDate + 'T23:59:59')) matchesPeriod = false;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesCustomerType && matchesPeriod;
    });
  }, [breakdowns, searchTerm, statusFilter, customerTypeFilter, dateFilter, customStartDate, customEndDate]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-20 px-2 sm:px-4">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-purple-950 text-white p-5 sm:p-6 rounded-2xl shadow-xl border border-rose-800/40 relative overflow-hidden">
        <div className="absolute -top-12 -start-12 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -end-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-black rounded-full border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {isAr ? 'مركز طوارئ المصاعد الميداني' : 'Elevator Emergency Hub'}
              </span>
              <span className="text-xs text-rose-200 font-mono">
                {breakdowns.length} {isAr ? 'بلاغ مسجل' : 'reports'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              {isAr ? 'إدارة بلاغات الأعطال' : 'Breakdowns Management'}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* New Breakdown Button */}
            <button
              type="button"
              onClick={handleOpenNewModal}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl transition-all font-black text-xs sm:text-sm shadow-md shadow-rose-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تسجيل بلاغ عطل جديد' : 'New Breakdown'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">{isAr ? 'إجمالي البلاغات' : 'Total'}</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.pendingCount} {isAr ? 'قيد المتابعة' : 'active'}</div>
        </div>

        {/* Maintenance Contract Clients */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">{isAr ? 'عقود صيانة دورية' : 'Contracts'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">{stats.contractCount}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{isAr ? 'مشمولة بالضمان والعقد' : 'Under Contract'}</div>
        </div>

        {/* One-Time Repair Clients */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase">{isAr ? 'إصلاح لمرة واحدة' : 'One-Time'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">{stats.oneTimeCount}</div>
          <div className="text-[10px] text-amber-600 font-bold mt-0.5">{isAr ? 'خدمة طوارئ مدفوعة' : 'On-Demand'}</div>
        </div>

        {/* Emergency / Critical */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-rose-800 uppercase">{isAr ? 'طوارئ واحتجاز' : 'Emergency'}</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="text-xl font-black text-rose-700 font-mono">{stats.emergencyCount}</div>
          <div className="text-[10px] text-rose-600 font-bold mt-0.5">{isAr ? 'أولوية قصوى' : 'Critical'}</div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs bg-gradient-to-br from-white to-blue-50/40 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-blue-800 uppercase">{isAr ? 'تم الإصلاح بنجاح' : 'Resolved'}</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-700 font-mono">{stats.resolvedCount}</div>
          <div className="text-[10px] text-blue-600 font-bold mt-0.5">{isAr ? 'تم تشغيل المصاعد' : 'Completed'}</div>
        </div>
      </div>

      {/* 3. Filters & Search Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Customer Type Filter Buttons (عقد صيانة vs إصلاح لمرة واحدة) & View Toggle (بطاقات وجدول) */}
        <div className="flex items-center justify-between gap-3 flex-wrap pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 me-1">{isAr ? 'نوع العميل:' : 'Customer Type:'}</span>
            
            <button
              type="button"
              onClick={() => setCustomerTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                customerTypeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'كافة العملاء' : 'All Customers'} ({breakdowns.length})
            </button>

            <button
              type="button"
              onClick={() => setCustomerTypeFilter('CONTRACT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                customerTypeFilter === 'CONTRACT'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{isAr ? 'عملاء عقود الصيانة' : 'Maintenance Contract'}</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">{stats.contractCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerTypeFilter('ONE_TIME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                customerTypeFilter === 'ONE_TIME'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{isAr ? 'إصلاح عطل لمرة واحدة' : 'One-Time Repair'}</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">{stats.oneTimeCount}</span>
            </button>
          </div>

          {/* نقل زر تغيير شكل العرض بطاقات وجدول قبل الجدول بجوار نوع العميل */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">{isAr ? 'شكل العرض:' : 'View:'}</span>
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('COMPACT_GRID')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'COMPACT_GRID'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
                title={isAr ? 'عرض بطاقات مدمجة' : 'Compact Cards'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? 'بطاقات' : 'Cards'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
                title={isAr ? 'عرض جدول بيانات' : 'Table View'}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول' : 'Table'}</span>
              </button>
            </div>

            {(searchTerm || statusFilter !== 'ALL' || customerTypeFilter !== 'ALL' || dateFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setCustomerTypeFilter('ALL');
                  setDateFilter('ALL');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 ms-1 cursor-pointer"
                title={isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isAr ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Period Filter (فلتر الأعطال خلال فترة) */}
        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>{isAr ? 'فلتر الأعطال خلال فترة:' : 'Breakdown Period Filter:'}</span>
              </span>

              {(['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'CUSTOM'] as const).map((period) => {
                const labels: Record<string, { ar: string; en: string }> = {
                  ALL: { ar: 'كافة الفترات', en: 'All Time' },
                  TODAY: { ar: 'اليوم', en: 'Today' },
                  THIS_WEEK: { ar: 'هذا الأسبوع', en: 'This Week' },
                  THIS_MONTH: { ar: 'هذا الشهر', en: 'This Month' },
                  LAST_MONTH: { ar: 'الشهر الماضي', en: 'Last Month' },
                  CUSTOM: { ar: 'تحديد فترة 📅', en: 'Custom Range 📅' },
                };
                const isActive = dateFilter === period;
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setDateFilter(period)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    {isAr ? labels[period].ar : labels[period].en}
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-slate-500 font-medium font-mono">
              {filteredBreakdowns.length} {isAr ? 'عطل مطابق للفترة' : 'matching'}
            </span>
          </div>

          {/* Custom Date Range Picker Inputs */}
          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200/70 flex-wrap animate-fadeIn text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600">{isAr ? 'من تاريخ:' : 'From:'}</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600">{isAr ? 'إلى تاريخ:' : 'To:'}</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  {isAr ? 'مسح التواريخ' : 'Clear Dates'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={isAr ? "بحث باسم العميل، موقع المصعد، الفني، أو وصف العطل..." : "Search client, location, elevator, technician..."}
              className="w-full ps-9 pe-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 scrollbar-thin">
            {(['ALL', 'Reported', 'Assigned', 'In_Progress', 'Requires_Parts', 'Resolved'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as BreakdownStatus | 'ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' 
                  ? (isAr ? 'كل الحالات' : 'All')
                  : (isAr ? STATUS_CONFIG[status as BreakdownStatus].labelAr : STATUS_CONFIG[status as BreakdownStatus].labelEn)
                }
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. BREAKDOWNS LIST: COMPACT CARDS GRID VIEW */}
      {viewMode === 'COMPACT_GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredBreakdowns.map((breakdown) => {
            const isContract = breakdown.customerType !== 'ONE_TIME';
            const statusCfg = STATUS_CONFIG[breakdown.status] || STATUS_CONFIG['Reported'];
            const priorityCfg = PRIORITY_CONFIG[breakdown.priority] || PRIORITY_CONFIG['Medium'];

            return (
              <div 
                key={breakdown.id} 
                className="bg-white border border-slate-200 hover:border-rose-300 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2.5 relative overflow-hidden group"
              >
                {/* Top Strip: Customer Type + Priority + Status */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  {/* Customer Type Badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    isContract 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isContract ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span>{isContract ? (isAr ? 'عقد صيانة' : 'Contract') : (isAr ? 'إصلاح لمرة واحدة' : 'One-Time')}</span>
                  </span>

                  {/* Priority & Status Badges */}
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${priorityCfg.badgeClass}`}>
                      {isAr ? priorityCfg.labelAr : priorityCfg.labelEn}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${statusCfg.badgeClass}`}>
                      {isAr ? statusCfg.labelAr : statusCfg.labelEn}
                    </span>
                  </div>
                </div>

                {/* Elevator & Customer Details (Compact) */}
                <div>
                  <div className="font-bold text-slate-900 text-sm truncate flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">{breakdown.elevatorName}</span>
                      {breakdown.elevatorNumber && (
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded shrink-0">
                          {breakdown.elevatorNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-normal shrink-0 ms-1">{breakdown.id}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mt-0.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{breakdown.customerName}</span>
                  </div>

                  {breakdown.siteLocation && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{breakdown.siteLocation}</span>
                    </div>
                  )}
                </div>

                {/* Fault Description - Compact line-clamp-2 */}
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-snug line-clamp-2">
                  <span className="font-bold text-rose-900">{isAr ? 'العطل: ' : 'Fault: '}</span>
                  {breakdown.description}
                </div>

                {/* Technician & Date Row */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate font-semibold text-purple-950">
                      {breakdown.assignedTechnicianName || (isAr ? 'غير معين' : 'Unassigned')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(breakdown.reportedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                  {/* Print Repair Report Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenReportModal(breakdown)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    title={isAr ? 'طباعة تقرير وأمر إصلاح العطل' : 'Print Repair Report'}
                  >
                    <Printer className="w-3.5 h-3.5 text-rose-600" />
                    <span>{isAr ? 'طباعة تقرير' : 'Report'}</span>
                  </button>

                  {/* Send WhatsApp Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(breakdown, 'CUSTOMER')}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                    title={isAr ? 'إرسال إشعار للعميل عبر واتساب (API)' : 'WhatsApp Customer'}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(breakdown)}
                    className="p-1.5 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 rounded-lg transition-colors border border-slate-200"
                    title={isAr ? 'تعديل بيانات البلاغ' : 'Edit'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. BREAKDOWNS LIST: HIGH-DENSITY TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'رقم وتاريخ البلاغ' : 'Ref & Date'}</th>
                  <th className="p-3 text-start">{isAr ? 'العميل والموقع' : 'Customer & Site'}</th>
                  <th className="p-3 text-start">{isAr ? 'المصعد' : 'Elevator'}</th>
                  <th className="p-3 text-start">{isAr ? 'نوع العميل' : 'Customer Type'}</th>
                  <th className="p-3 text-start">{isAr ? 'وصف العطل' : 'Description'}</th>
                  <th className="p-3 text-start">{isAr ? 'الفني المعين' : 'Technician'}</th>
                  <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBreakdowns.map((b) => {
                  const isContract = b.customerType !== 'ONE_TIME';
                  const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG['Reported'];
                  const priorityCfg = PRIORITY_CONFIG[b.priority] || PRIORITY_CONFIG['Medium'];

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-900">{b.id}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(b.reportedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 truncate max-w-[160px]">{b.customerName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{b.siteLocation}</div>
                      </td>

                      <td className="p-3 font-semibold text-slate-800 max-w-[160px]">
                        <div className="truncate">{b.elevatorName}</div>
                        {b.elevatorNumber && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                            {b.elevatorNumber}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isContract ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isContract ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          <span>{isContract ? (isAr ? 'عقد صيانة' : 'Contract') : (isAr ? 'إصلاح لمرة واحدة' : 'One-Time')}</span>
                        </span>
                      </td>

                      <td className="p-3 max-w-xs">
                        <p className="truncate text-slate-600 text-xs">{b.description}</p>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-purple-950">
                          {b.assignedTechnicianName || (isAr ? 'غير معين' : 'Unassigned')}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${statusCfg.badgeClass}`}>
                          {isAr ? statusCfg.labelAr : statusCfg.labelEn}
                        </span>
                      </td>

                      <td className="p-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenReportModal(b)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                            title={isAr ? 'طباعة تقرير الإصلاح' : 'Print Report'}
                          >
                            <Printer className="w-3.5 h-3.5 text-rose-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(b, 'CUSTOMER')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors border border-emerald-200"
                            title={isAr ? 'واتساب العميل' : 'WhatsApp'}
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1.5 bg-slate-100 hover:bg-purple-100 text-slate-700 rounded-md transition-colors"
                            title={isAr ? 'تعديل' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredBreakdowns.length === 0 && (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200 border-dashed p-6">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            {isAr ? 'لا توجد بلاغات تطابق البحث والفلاتر' : 'No Breakdowns Found'}
          </h3>
          <p className="text-xs text-slate-400">
            {isAr ? 'يمكنك تجربة تغيير كلمات البحث، أو إعادة ضبط الفلاتر لتظهر كافة البلاغات.' : 'Try changing your search terms or resetting filters.'}
          </p>
        </div>
      )}

      {/* 6. Edit / Create Breakdown Modal */}
      {isEditModalOpen && (
        <BreakdownModal
          breakdown={editingBreakdown}
          language={language}
          employees={employees}
          projects={projects}
          customers={customers}
          onSave={handleSaveBreakdown}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* 7. Print Repair Report Modal */}
      <BreakdownReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        breakdown={reportBreakdown}
        companySettings={companySettings}
        language={language}
        onOpenWhatsApp={(phone, msg, name) => {
          setWaPhone(phone);
          setWaMessage(msg);
          setWaRecipient(name);
          setWaTitle(isAr ? `تقرير الإصلاح: ${name}` : `Repair Report`);
          setWhatsAppModalOpen(true);
        }}
      />

      {/* 8. Send WhatsApp Notification Modal (Twins WA API) */}
      <SendWhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        defaultPhone={waPhone}
        defaultMessage={waMessage}
        recipientName={waRecipient}
        contextTitle={waTitle}
        isAr={isAr}
      />
    </div>
  );
};
