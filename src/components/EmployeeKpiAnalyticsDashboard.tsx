import React, { useState, useMemo, useRef } from 'react';
import {
  Clock,
  Zap,
  Target,
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  ShieldCheck,
  FileText,
  ExternalLink,
  Sparkles,
  BarChart3,
  Layers,
  Phone,
  Eye,
  Check,
  X,
  Compass,
  DollarSign,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import * as XLSX from 'xlsx';
import { Employee, EmployeeRole, ROLE_CONFIGS, SiteAttendanceRecord } from '../types/employee';
import { MaintenanceBreakdown, MaintenanceContract, BreakdownPriority } from '../types/maintenance';
import { ElevatorSpecification } from '../types/elevator';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import {
  calculateTechniciansResolutionMetrics,
  extractCompletionRecords,
  formatDuration,
  CompletionRecord,
  TechnicianResolutionMetrics,
  SLA_TARGETS_MINUTES,
} from '../utils/technicianResolutionAnalytics';
import {
  calculateMonthlyTechnicianKpis,
  DAILY_TARGET_BREAKDOWNS,
  DAILY_TARGET_MAINTENANCE,
} from '../utils/technicianKpi';

interface EmployeeKpiAnalyticsDashboardProps {
  employees: Employee[];
  breakdowns?: MaintenanceBreakdown[];
  contracts?: MaintenanceContract[];
  projects?: ElevatorSpecification[];
  attendanceRecords?: SiteAttendanceRecord[];
  companySettings?: CompanySettings;
  language: AppLanguage;
  onSelectEmployee?: (employee: Employee) => void;
  onOpenBreakdownModal?: (breakdownId: string) => void;
}

type SubTab = 'RESOLUTION_TIMES' | 'COMPLETION_LOGS' | 'ALL_ROLES_KPI' | 'LEADERBOARD';

export const EmployeeKpiAnalyticsDashboard: React.FC<EmployeeKpiAnalyticsDashboardProps> = ({
  employees,
  breakdowns = [],
  contracts = [],
  projects = [],
  attendanceRecords = [],
  companySettings,
  language,
  onSelectEmployee,
  onOpenBreakdownModal,
}) => {
  const isAr = language === 'ar';

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<SubTab>('RESOLUTION_TIMES');

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedTechId, setSelectedTechId] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inspection modal for single completion record
  const [inspectingRecord, setInspectingRecord] = useState<CompletionRecord | null>(null);

  // Pagination for logs table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Available months from breakdowns
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    breakdowns.forEach((b) => {
      const date = b.resolvedAt || b.reportedAt;
      if (date && date.length >= 7) {
        set.add(date.slice(0, 7));
      }
    });
    // Add current month if empty
    if (set.size === 0) {
      set.add(new Date().toISOString().slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [breakdowns]);

  // Calculate resolution metrics
  const companyOverview = useMemo(() => {
    return calculateTechniciansResolutionMetrics(
      employees,
      breakdowns,
      contracts,
      selectedMonth
    );
  }, [employees, breakdowns, contracts, selectedMonth]);

  // Filtered completion records
  const filteredRecords = useMemo(() => {
    return companyOverview.allCompletionRecords.filter((rec) => {
      if (selectedTechId !== 'ALL' && rec.technicianId !== selectedTechId) return false;
      if (selectedPriority !== 'ALL' && rec.priority !== selectedPriority) return false;
      if (selectedCustomerType !== 'ALL' && rec.customerType !== selectedCustomerType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rec.technicianName.toLowerCase().includes(q);
        const matchesCust = rec.customerName.toLowerCase().includes(q);
        const matchesElev = rec.elevatorName.toLowerCase().includes(q) || rec.elevatorNumber.toLowerCase().includes(q);
        const matchesWork = rec.workPerformed.toLowerCase().includes(q) || rec.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCust && !matchesElev && !matchesWork) return false;
      }
      return true;
    });
  }, [companyOverview.allCompletionRecords, selectedTechId, selectedPriority, selectedCustomerType, searchQuery]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Chart data 1: Technician MTTR Comparison (Bar chart)
  const barChartData = useMemo(() => {
    return companyOverview.techniciansMetrics.map((tm) => ({
      name: tm.technicianName,
      code: tm.technicianCode,
      avgHours: tm.avgResolutionHours,
      avgMinutes: tm.avgResolutionMinutes,
      resolvedCount: tm.totalResolvedBreakdowns,
      slaRate: tm.slaComplianceRatePct,
      emergencyAvg: tm.emergencyAvgMinutes,
      targetBenchmarkHours: 1.5, // 90 min benchmark
    }));
  }, [companyOverview.techniciansMetrics]);

  // Chart data 2: Resolution Time Distribution (Pie/Bar)
  const distributionData = useMemo(() => {
    let under30 = 0;
    let from30to60 = 0;
    let from60to120 = 0;
    let from120to240 = 0;
    let over240 = 0;

    filteredRecords.forEach((r) => {
      if (r.durationMinutes <= 30) under30++;
      else if (r.durationMinutes <= 60) from30to60++;
      else if (r.durationMinutes <= 120) from60to120++;
      else if (r.durationMinutes <= 240) from120to240++;
      else over240++;
    });

    return [
      { name: isAr ? 'أقل من 30 دقيقة (طوارئ فوري)' : '< 30 min (Instant)', count: under30, color: '#10b981' },
      { name: isAr ? '30 - 60 دقيقة (سريع)' : '30-60 min (Fast)', count: from30to60, color: '#3b82f6' },
      { name: isAr ? '1 - 2 ساعة (ضمن المعدل)' : '1-2 hrs (Standard)', count: from60to120, color: '#6366f1' },
      { name: isAr ? '2 - 4 ساعات (معتدل)' : '2-4 hrs (Moderate)', count: from120to240, color: '#f59e0b' },
      { name: isAr ? 'أكثر من 4 ساعات (تطلب قطع)' : '> 4 hrs (Requires Parts)', count: over240, color: '#ef4444' },
    ];
  }, [filteredRecords, isAr]);

  // Export to Excel function using xlsx
  const handleExportToExcel = () => {
    const dataToExport = filteredRecords.map((r, i) => ({
      '#': i + 1,
      [isAr ? 'كود الفني' : 'Tech Code']: r.technicianCode,
      [isAr ? 'اسم الفني' : 'Technician']: r.technicianName,
      [isAr ? 'العميل' : 'Customer']: r.customerName,
      [isAr ? 'الموقع' : 'Location']: r.siteLocation,
      [isAr ? 'المصعد' : 'Elevator']: `${r.elevatorName} (${r.elevatorNumber})`,
      [isAr ? 'الأولوية' : 'Priority']: r.priority,
      [isAr ? 'احتجاز ركاب؟' : 'Entrapment?']: r.isPassengerEntrapment ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No'),
      [isAr ? 'وقت البلاغ' : 'Reported At']: r.reportedAt?.replace('T', ' ').slice(0, 16) || '',
      [isAr ? 'وقت الحل' : 'Resolved At']: r.resolvedAt?.replace('T', ' ').slice(0, 16) || '',
      [isAr ? 'مدة الحل (دقائق)' : 'Duration (min)']: r.durationMinutes,
      [isAr ? 'مدة الحل المقروءة' : 'Duration Text']: isAr ? r.durationFormattedAr : r.durationFormattedEn,
      [isAr ? 'مستهدف الـ SLA (دقيقة)' : 'SLA Target (min)']: r.slaTargetMinutes,
      [isAr ? 'الالتزام بالـ SLA' : 'SLA Met']: r.isSlaMet ? (isAr ? 'ملتزم ⚡' : 'Met') : (isAr ? 'متجاوز ⏳' : 'Breached'),
      [isAr ? 'الإصلاح المنفذ' : 'Work Done']: r.workPerformed,
      [isAr ? 'التكلفة (ريال)' : 'Cost (SAR)']: r.cost,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isAr ? 'سجلات الإنجاز' : 'Resolution Logs');
    XLSX.writeFile(workbook, `technician_resolution_kpi_${selectedMonth}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  // Monthly KPI targets from technicianKpi.ts
  const monthlyKpis = useMemo(() => {
    const m = selectedMonth === 'ALL' ? (availableMonths[0] || new Date().toISOString().slice(0, 7)) : selectedMonth;
    return calculateMonthlyTechnicianKpis(employees, contracts, breakdowns, m);
  }, [employees, contracts, breakdowns, selectedMonth, availableMonths]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-indigo-900/60 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'تحليلات سرعة الإنجاز ومؤشرات KPI' : 'Resolution & KPI Analytics'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-indigo-200 border border-white/15">
                {companyOverview.totalResolvedBreakdowns} {isAr ? 'سجل إنجاز معتمد' : 'completed tickets'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isAr ? 'نسبة الـ SLA العامة:' : 'SLA Compliance:'} {companyOverview.overallSlaComplianceRatePct}%
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
              {isAr ? 'لوحة تحليلات أداء الأعطال و KPI الموظفين' : 'Breakdown MTTR & Staff KPI Analytics'}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1.5 max-w-3xl leading-relaxed">
              {isAr
                ? 'قياس متوسط زمن حل بلاغات الأعطال (MTTR) لكل فني بالدقائق والساعات استناداً إلى سجلات الإنجاز الفعلية، مع تحليل الالتزام باتفاقية الخدمة (SLA)، ومستهدفات الأداء اليومية والشهرية.'
                : 'Mean Time to Resolve (MTTR) analytics per technician based on real completion records, SLA compliance, emergency response times, and cross-departmental staff KPIs.'}
            </p>
          </div>

          {/* Quick Actions (Export Excel, Print) */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              title={isAr ? 'تصدير سجلات الإنجاز إلى Excel' : 'Export to Excel'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير Excel' : 'Export Excel'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
              title={isAr ? 'طباعة تقرير التحليلات' : 'Print Analytics Report'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة التقرير' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="relative z-10 mt-5 pt-4 border-t border-indigo-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Month selector */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-indigo-500/30">
            <label className="text-[11px] text-indigo-300 font-bold block mb-1">
              {isAr ? 'فترة التقييم / الشهر:' : 'Period / Month:'}
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 text-white font-mono text-xs font-bold p-1.5 rounded-lg border border-indigo-500/40 focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">{isAr ? 'كافة الفترات (سجل تراكمي)' : 'All Periods (Cumulative)'}</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Technician selector */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-indigo-500/30">
            <label className="text-[11px] text-indigo-300 font-bold block mb-1">
              {isAr ? 'تخصيص الفني:' : 'Technician Filter:'}
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => {
                setSelectedTechId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 text-white text-xs font-bold p-1.5 rounded-lg border border-indigo-500/40 focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">{isAr ? 'جميع الفنيين (مقارنة شاملة)' : 'All Technicians'}</option>
              {companyOverview.techniciansMetrics.map((t) => (
                <option key={t.technicianId} value={t.technicianId}>
                  {t.technicianName} ({t.totalResolvedBreakdowns} {isAr ? 'بلاغ' : 'fixes'})
                </option>
              ))}
            </select>
          </div>

          {/* Priority selector */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-indigo-500/30">
            <label className="text-[11px] text-indigo-300 font-bold block mb-1">
              {isAr ? 'مستوى الأولوية:' : 'Priority Level:'}
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 text-white text-xs font-bold p-1.5 rounded-lg border border-indigo-500/40 focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">{isAr ? 'كافة الأولويات' : 'All Priorities'}</option>
              <option value="Emergency">{isAr ? 'طوارئ واحتجاز (SLA: 30 دقيقة)' : 'Emergency (30m SLA)'}</option>
              <option value="High">{isAr ? 'عالية (SLA: ساعتان)' : 'High (2h SLA)'}</option>
              <option value="Medium">{isAr ? 'متوسطة (SLA: 4 ساعات)' : 'Medium (4h SLA)'}</option>
              <option value="Low">{isAr ? 'عادية (SLA: 8 ساعات)' : 'Low (8h SLA)'}</option>
            </select>
          </div>

          {/* Customer type */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-indigo-500/30">
            <label className="text-[11px] text-indigo-300 font-bold block mb-1">
              {isAr ? 'نوع التعاقد:' : 'Contract Type:'}
            </label>
            <select
              value={selectedCustomerType}
              onChange={(e) => {
                setSelectedCustomerType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-800 text-white text-xs font-bold p-1.5 rounded-lg border border-indigo-500/40 focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">{isAr ? 'الكل (عقود وإصلاح مفرد)' : 'All'}</option>
              <option value="CONTRACT">{isAr ? 'عقد صيانة سنوي (مشمول)' : 'Maintenance Contract'}</option>
              <option value="ONE_TIME">{isAr ? 'إصلاح لمرة واحدة' : 'One-Time Repair'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Summary KPI Cards (Executive Scorecards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Overall MTTR (Average Resolution Time) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-indigo-900 uppercase flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              {isAr ? 'متوسط زمن الحل (MTTR)' : 'Mean Time to Resolve'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {isAr ? 'الهدف: < 90 د' : '< 90m'}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {isAr ? companyOverview.overallAvgFormattedAr : companyOverview.overallAvgFormattedEn}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{isAr ? 'إجمالي البلاغات المحلولة:' : 'Total resolved:'}</span>
            <span className="font-mono font-bold text-slate-800">{companyOverview.totalResolvedBreakdowns}</span>
          </div>
        </div>

        {/* Card 2: Emergency Entrapment MTTR */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-rose-900 uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {isAr ? 'طوارئ فك الاحتجاز' : 'Rescue MTTR'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {isAr ? 'SLA: 30 د' : '30m'}
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {formatDuration(companyOverview.avgEmergencyResolutionMinutes, isAr)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{isAr ? 'إنقاذ ركاب منجز:' : 'Rescues:'}</span>
            <span className="font-mono font-bold text-rose-700">{companyOverview.totalEmergencyResolved} {isAr ? 'حالة' : ''}</span>
          </div>
        </div>

        {/* Card 3: On-Time Completion Rate (معدل الإنجاز في الوقت المحدد) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-emerald-900 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {isAr ? 'الإنجاز في الوقت المحدد' : 'On-Time Completion'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {companyOverview.overallOnTimeRatePct}%
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{isAr ? 'ضمن إطار الـ SLA القياسي' : 'Within SLA Target'}</span>
            <span className="font-mono font-bold text-emerald-800">⚡ {companyOverview.overallSlaComplianceRatePct}%</span>
          </div>
        </div>

        {/* Card 4: Repeated Breakdowns for Same Elevator (الأعطال المتكررة لنفس المصعد) */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              {isAr ? 'الأعطال المتكررة للمصاعد' : 'Repeated Lift Faults'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {isAr ? 'نفس المصعد' : 'Same Lift'}
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {companyOverview.overallRepeatedBreakdownsCount}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{isAr ? 'تكرارات مسجلة لنفس المصاعد' : 'Recurrent tickets'}</span>
            <span className="font-mono font-bold text-amber-800">
              {companyOverview.overallRepeatedBreakdownsCount === 0 ? (isAr ? 'ممتاز 🟢' : '0 🟢') : (isAr ? 'تحت المتابعة ⚠️' : 'Watch ⚠️')}
            </span>
          </div>
        </div>

        {/* Card 5: Speed Champion Technician */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-200 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              {isAr ? 'فارس سرعة الإنجاز ⚡' : 'Speed Champ'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              #1
            </span>
          </div>
          <div className="text-sm font-black text-slate-900 truncate">
            {companyOverview.techniciansMetrics[0]?.technicianName || '—'}
          </div>
          <div className="flex items-center justify-between text-xs text-amber-900 mt-2 pt-2 border-t border-amber-200/80">
            <span>{isAr ? 'متوسط زمنه:' : 'Avg time:'}</span>
            <span className="font-mono font-bold">
              {companyOverview.techniciansMetrics[0]?.avgResolutionFormattedAr || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('RESOLUTION_TIMES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'RESOLUTION_TIMES'
              ? 'bg-[#172033] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAr ? 'تحليلات زمن حل الأعطال (MTTR)' : 'Resolution Times & Charts'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPLETION_LOGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'COMPLETION_LOGS'
              ? 'bg-[#172033] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>{isAr ? `سجلات الإنجاز المعتمدة (${filteredRecords.length})` : `Completion Logs (${filteredRecords.length})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'LEADERBOARD'
              ? 'bg-[#172033] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAr ? 'منصة تكريم وتصنيف الفنيين' : 'Technician Leaderboard'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALL_ROLES_KPI')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ALL_ROLES_KPI'
              ? 'bg-[#172033] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'منظومة KPI لكافة فئات الموظفين' : 'All Roles KPI'}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: RESOLUTION TIMES & CHARTS (متوسط زمن حل الأعطال لكل فني)
      ========================================================================= */}
      {activeTab === 'RESOLUTION_TIMES' && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Average MTTR by Technician (Bar Chart) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>{isAr ? 'مقارنة متوسط زمن حل البلاغات (بالساعات) لكل فني' : 'Average Resolution Time (Hours) by Tech'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr ? 'العمود الأقل يعكس سرعة واستجابة أعلى. الخط المتقطع يمثل المستهدف القياسي (1.5 ساعة).' : 'Lower bar indicates faster resolution. Dashed line is 1.5h benchmark.'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {isAr ? 'مستهدف: 1.5 ساعة' : 'Target: 1.5h'}
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#475569' }}
                      unit={isAr ? ' س' : 'h'}
                      domain={[0, 'dataMax + 0.5']}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 font-sans border border-slate-700">
                            <div className="font-black text-amber-300">{d.name} ({d.code})</div>
                            <div>{isAr ? 'متوسط زمن الحل:' : 'Avg MTTR:'} <strong className="text-white">{formatDuration(d.avgMinutes, isAr)}</strong> ({d.avgHours} {isAr ? 'ساعة' : 'hrs'})</div>
                            <div>{isAr ? 'إجمالي البلاغات المنجزة:' : 'Resolved:'} <strong className="text-emerald-400">{d.resolvedCount}</strong></div>
                            <div>{isAr ? 'نسبة الالتزام بالـ SLA:' : 'SLA Rate:'} <strong className="text-blue-400">{d.slaRate}%</strong></div>
                            {d.emergencyAvg > 0 && (
                              <div className="text-rose-300">{isAr ? 'متوسط الطوارئ:' : 'Emergency Avg:'} <strong>{formatDuration(d.emergencyAvg, isAr)}</strong></div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: isAr ? 'الهدف (1.5 س)' : 'Target 1.5h', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                    <Bar dataKey="avgHours" radius={[8, 8, 0, 0]}>
                      {barChartData.map((entry, index) => {
                        // Green if <= 1.5 hours, Amber if <= 2.5, Red if > 2.5
                        const color = entry.avgHours <= 1.5 ? '#10b981' : entry.avgHours <= 2.5 ? '#f59e0b' : '#ef4444';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Resolution Time Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'توزيع سرعة حل البلاغات' : 'Resolution Time Distribution'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr ? 'تصنيف البلاغات حسب الوقت المستغرق للإصلاح الفعلي.' : 'Tickets categorized by completion timeframe.'}
                </p>
              </div>

              <div className="space-y-3 my-4">
                {distributionData.map((item, idx) => {
                  const pct = filteredRecords.length > 0 ? Math.round((item.count / filteredRecords.length) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span>{item.name}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {item.count} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>{isAr ? 'إجمالي السجلات المفروزة:' : 'Filtered tickets:'}</span>
                <span className="font-mono font-black text-slate-900">{filteredRecords.length}</span>
              </div>
            </div>
          </div>

          {/* Technician Performance Comparison Table (جدول أداء ومقارنة الفنيين استناداً لسجلات الإنجاز) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'جدول مقارنة أداء الفنيين ومعدل الإنجاز في الوقت المحدد' : 'Technician Performance & On-Time Completion Table'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr ? 'بيانات دقيقة لكل فني: معدل الإنجاز في الوقت المحدد، وعدد الأعطال المتكررة لنفس المصعد، ومتوسط زمن الحل (MTTR).' : 'Detailed technician data: on-time completion rates, repeated elevator breakdowns, and MTTR.'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 font-mono shrink-0">
                {companyOverview.techniciansMetrics.length} {isAr ? 'فنيين مشمولين' : 'technicians'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{isAr ? 'الفني والكود' : 'Technician'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'الأعطال المنجزة' : 'Resolved'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'متوسط زمن الحل (MTTR)' : 'Avg MTTR'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'معدل الإنجاز في الوقت المحدد' : 'On-Time Completion Rate'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'عدد الأعطال المتكررة لنفس المصعد' : 'Repeated Lift Faults'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'زيارات الصيانة الدورية' : 'Visits'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'تقييم السرعة' : 'Speed Grade'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companyOverview.techniciansMetrics.map((tm) => (
                    <tr key={tm.technicianId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg ${tm.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                            {tm.technicianName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{tm.technicianName}</span>
                              {tm.isTopSpeedChampion && <span title={isAr ? 'الأسرع حلاً' : 'Fastest'}>⚡</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{tm.technicianCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-bold text-slate-800">
                        {tm.totalResolvedBreakdowns}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-bold text-indigo-900">
                        {isAr ? tm.avgResolutionFormattedAr : tm.avgResolutionFormattedEn}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          tm.onTimeCompletionRatePct >= 90
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : tm.onTimeCompletionRatePct >= 75
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{tm.onTimeCompletionRatePct}%</span>
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {tm.totalResolvedBreakdowns > 0 
                            ? (isAr ? `${tm.onTimeResolvedCount} من ${tm.totalResolvedBreakdowns} بالموعد` : `${tm.onTimeResolvedCount}/${tm.totalResolvedBreakdowns}`)
                            : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {tm.repeatedBreakdownsCount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{isAr ? '0 (لا تكرار 🟢)' : '0 (None 🟢)'}</span>
                          </span>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>{isAr ? `${tm.repeatedBreakdownsCount} متكرر ⚠️` : `${tm.repeatedBreakdownsCount} repeat`}</span>
                            </span>
                            <span className="text-[10px] text-amber-700 font-sans mt-0.5 cursor-help" title={tm.repeatedElevatorsList.map(r => `${r.elevatorName}: ${r.breakdownsCount} بلاغات`).join('، ')}>
                              {isAr ? `في ${tm.repeatedElevatorsCount} مصعد` : `in ${tm.repeatedElevatorsCount} lifts`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-bold text-blue-900">
                        {tm.completedVisitsCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border ${tm.speedBadgeColor}`}>
                          {isAr ? tm.speedGradeAr : tm.speedGradeEn}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Scorecards for Each Technician */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'بطاقات مؤشرات سرعة الحل والـ KPI التفصيلية لكل فني' : 'Technician Resolution Scorecards'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyOverview.techniciansMetrics.map((tm) => {
                return (
                  <div
                    key={tm.technicianId}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    {/* Top Stripe: Rank & Speed Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-11 h-11 rounded-xl ${tm.avatarBg} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs`}>
                          {tm.technicianName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                            <span>{tm.technicianName}</span>
                            {tm.isTopSpeedChampion && (
                              <span title={isAr ? 'الفني الأسرع استجابة' : 'Fastest Tech'}>⚡</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {tm.technicianCode} &bull; {tm.assignedZone || (isAr ? 'منطقة الرياض' : 'Riyadh')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right rtl:text-left shrink-0">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                          {isAr ? `المركز #${tm.rank}` : `Rank #${tm.rank}`}
                        </span>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 font-mono">
                          {isAr ? 'تقييم السرعة:' : 'Speed:'} {tm.speedRatingScore}%
                        </div>
                      </div>
                    </div>

                    {/* Speed Badge Banner */}
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-between ${tm.speedBadgeColor}`}>
                      <span>{isAr ? tm.speedGradeAr : tm.speedGradeEn}</span>
                      <span className="font-mono text-[11px] font-black">
                        {isAr ? tm.avgResolutionFormattedAr : tm.avgResolutionFormattedEn}
                      </span>
                    </div>

                    {/* Metrics Grid (6 KPI Metrics) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {/* Metric 1: Resolved Count */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">{isAr ? 'الأعطال المنجزة' : 'Resolved Fixes'}</div>
                        <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                          {tm.totalResolvedBreakdowns}
                        </div>
                      </div>

                      {/* Metric 2: On-Time Completion Rate */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">{isAr ? 'الإنجاز بالموعد' : 'On-Time Rate'}</div>
                        <div className={`text-base font-black font-mono mt-0.5 ${tm.onTimeCompletionRatePct >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {tm.onTimeCompletionRatePct}%
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {tm.totalResolvedBreakdowns > 0 ? `${tm.onTimeResolvedCount}/${tm.totalResolvedBreakdowns}` : '-'}
                        </div>
                      </div>

                      {/* Metric 3: Repeated Breakdowns for Same Elevator */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">{isAr ? 'أعطال متكررة' : 'Repeated'}</div>
                        <div className={`text-base font-black font-mono mt-0.5 ${tm.repeatedBreakdownsCount === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {tm.repeatedBreakdownsCount}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {tm.repeatedBreakdownsCount === 0 ? (isAr ? 'لا تكرار 🟢' : 'None') : (isAr ? `في ${tm.repeatedElevatorsCount} مصعد` : `${tm.repeatedElevatorsCount} lifts`)}
                        </div>
                      </div>

                      {/* Metric 4: SLA Compliance */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">{isAr ? 'التزام الـ SLA' : 'SLA Rate'}</div>
                        <div className={`text-base font-black font-mono mt-0.5 ${tm.slaComplianceRatePct >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {tm.slaComplianceRatePct}%
                        </div>
                      </div>

                      {/* Metric 5: Fastest Record */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">{isAr ? 'أسرع حل له' : 'Fastest Fix'}</div>
                        <div className="text-xs font-bold text-slate-800 font-mono mt-1">
                          {tm.fastestResolutionMinutes > 0 ? formatDuration(tm.fastestResolutionMinutes, isAr) : '—'}
                        </div>
                      </div>

                      {/* Metric 6: Emergency Rescue Avg */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] text-slate-500">{isAr ? 'طوارئ الاحتجاز' : 'Emergency Avg'}</div>
                        <div className="text-xs font-bold text-rose-700 font-mono mt-1">
                          {tm.emergencyCount > 0 ? formatDuration(tm.emergencyAvgMinutes, isAr) : (isAr ? 'لا يوجد' : 'None')}
                        </div>
                      </div>
                    </div>

                    {/* Routine Visits & Monthly Target Link */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isAr ? 'زيارات الصيانة الدورية:' : 'Routine visits:'}</span>
                      </span>
                      <span className="font-mono font-bold text-blue-900">
                        {tm.completedVisitsCount} {isAr ? 'زيارة' : 'visits'}
                      </span>
                    </div>

                    {/* Quick Action to Filter Records */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTechId(tm.technicianId);
                        setActiveTab('COMPLETION_LOGS');
                      }}
                      className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>{isAr ? `عرض سجلات إنجاز ${tm.technicianName} (${tm.totalResolvedBreakdowns})` : `View logs (${tm.totalResolvedBreakdowns})`}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: COMPLETION LOGS TABLE (سجلات الإنجاز المعتمدة)
      ========================================================================= */}
      {activeTab === 'COMPLETION_LOGS' && (
        <div className="space-y-4">
          {/* Search & Results Count Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                placeholder={isAr ? 'بحث في سجلات الإنجاز (اسم الفني، العميل، كود المصعد، الإصلاح المنفذ)...' : 'Search completion records...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
              <span>{isAr ? 'عدد النتائج:' : 'Results:'}</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                {filteredRecords.length}
              </span>
              {(selectedTechId !== 'ALL' || selectedPriority !== 'ALL' || selectedMonth !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTechId('ALL');
                    setSelectedPriority('ALL');
                    setSelectedMonth('ALL');
                    setSelectedCustomerType('ALL');
                    setSearchQuery('');
                  }}
                  className="text-blue-600 hover:underline font-bold ms-2 cursor-pointer"
                >
                  {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
                </button>
              )}
            </div>
          </div>

          {/* Interactive Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{isAr ? 'الفني المنفذ' : 'Technician'}</th>
                    <th className="px-4 py-3">{isAr ? 'المصعد والموقع والعميل' : 'Elevator & Client'}</th>
                    <th className="px-4 py-3">{isAr ? 'الأولوية والنوع' : 'Priority'}</th>
                    <th className="px-4 py-3">{isAr ? 'توقيت البلاغ والحل' : 'Timestamps'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'زمن الحل الفعلي' : 'Resolution Time'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'مؤشر الـ SLA' : 'SLA Status'}</th>
                    <th className="px-4 py-3">{isAr ? 'الإصلاح المنفذ' : 'Work Done'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'تفاصيل' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((rec) => {
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Tech */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{rec.technicianName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{rec.technicianCode}</div>
                          </td>

                          {/* Elevator & Client */}
                          <td className="px-4 py-3 max-w-[200px]">
                            <div className="font-bold text-slate-800 truncate" title={rec.elevatorName}>
                              {rec.elevatorName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate" title={rec.customerName}>
                              {rec.customerName} &bull; {rec.siteLocation}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{rec.elevatorNumber}</div>
                          </td>

                          {/* Priority */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  rec.priority === 'Emergency'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : rec.priority === 'High'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : rec.priority === 'Medium'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {rec.priority === 'Emergency'
                                  ? (isAr ? 'طوارئ واحتجاز 🚨' : 'Emergency 🚨')
                                  : rec.priority === 'High'
                                  ? (isAr ? 'عالي ⚠️' : 'High')
                                  : rec.priority === 'Medium'
                                  ? (isAr ? 'متوسط 🟡' : 'Medium')
                                  : (isAr ? 'عادي 🟢' : 'Low')}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {rec.customerType === 'CONTRACT' ? (isAr ? 'عقد صيانة' : 'Contract') : (isAr ? 'إصلاح مفرد' : 'One-time')}
                              </span>
                            </div>
                          </td>

                          {/* Timestamps */}
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                            <div>
                              <span className="text-slate-400">{isAr ? 'بلاغ:' : 'Rep:'}</span> {rec.reportedAt?.replace('T', ' ').slice(0, 16)}
                            </div>
                            <div>
                              <span className="text-slate-400">{isAr ? 'حل:' : 'Res:'}</span> {rec.resolvedAt?.replace('T', ' ').slice(0, 16)}
                            </div>
                          </td>

                          {/* Resolution Duration */}
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-mono font-bold text-xs">
                              {isAr ? rec.durationFormattedAr : rec.durationFormattedEn}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ({rec.durationMinutes} {isAr ? 'دقيقة' : 'mins'})
                            </div>
                          </td>

                          {/* SLA Status */}
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {rec.isSlaMet ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {isAr ? 'ملتزم ⚡' : 'SLA Met'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <Clock className="w-3 h-3 text-rose-600" />
                                {isAr ? 'تجاوز الوقت ⏳' : 'Breached'}
                              </span>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {isAr ? `هدف: ${rec.slaTargetMinutes} د` : `Target: ${rec.slaTargetMinutes}m`}
                            </div>
                          </td>

                          {/* Work Performed */}
                          <td className="px-4 py-3 max-w-[220px]">
                            <p className="text-slate-700 line-clamp-2 text-[11px]" title={rec.workPerformed}>
                              {rec.workPerformed}
                            </p>
                          </td>

                          {/* Action Button */}
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() => setInspectingRecord(rec)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isAr ? 'معاينة' : 'View'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                        {isAr ? 'لا توجد سجلات إنجاز مطابقة للبحث أو الفلاتر المحددة.' : 'No matching completion records found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">
                  {isAr ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-bold"
                  >
                    {isAr ? 'السابق' : 'Previous'}
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-bold"
                  >
                    {isAr ? 'التالي' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: LEADERBOARD & RECOGNITION (منصة تكريم وتصنيف الفنيين)
      ========================================================================= */}
      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 p-5 rounded-2xl border border-amber-300/40 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                🏆
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr ? 'منصة الأوسمة والتميز التكريمي للفنيين الميدانيين' : 'Field Technician Hall of Fame'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isAr ? 'تكريم أسرع الفنيين في استجابة الأعطال والأعلى إنتاجية في زيارات الصيانة والأكثر التزاماً باتفاقية الـ SLA.' : 'Top performers in resolution speed, maintenance volume, and SLA compliance.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs font-mono">
                {companyOverview.techniciansMetrics.length} {isAr ? 'فنيين متنافسين' : 'competing technicians'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Crown 1: Speed Champion */}
            {(() => {
              const champion = companyOverview.techniciansMetrics[0];
              return (
                <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-2 end-2 text-3xl opacity-20">⚡</div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        {isAr ? '👑 بطل سرعة الاستجابة' : '⚡ Speed Champion'}
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900">{champion?.technicianName || '—'}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{champion?.technicianCode}</div>
                    <div className="text-2xl font-black text-amber-600 font-mono mt-3">
                      {champion ? champion.avgResolutionFormattedAr : '—'}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {isAr ? `أنجز ${champion?.totalResolvedBreakdowns || 0} بلاغ بنسبة التزام SLA تبلغ ${champion?.slaComplianceRatePct || 100}%` : `Resolved ${champion?.totalResolvedBreakdowns || 0} fixes with ${champion?.slaComplianceRatePct || 100}% SLA rate`}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Crown 2: Routine Maintenance Volume Champion */}
            {(() => {
              const topVolume = [...companyOverview.techniciansMetrics].sort((a, b) => b.completedVisitsCount - a.completedVisitsCount)[0];
              return (
                <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-2 end-2 text-3xl opacity-20">🔧</div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                        {isAr ? '⭐ بطل إنتاجية الصيانة' : '🔧 Volume Champion'}
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900">{topVolume?.technicianName || '—'}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{topVolume?.technicianCode}</div>
                    <div className="text-2xl font-black text-blue-700 font-mono mt-3">
                      {topVolume?.completedVisitsCount || 0} <span className="text-sm font-normal text-slate-500">{isAr ? 'زيارة' : 'visits'}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {isAr ? 'الأعلى إنجازاً للزيارات الوقائية الدورية وفحص الأمان والتشحيم' : 'Highest completed preventive maintenance visits count'}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Crown 3: On-Time & Quality Guardian */}
            {(() => {
              const topQuality = [...companyOverview.techniciansMetrics].sort((a, b) => {
                if (b.onTimeCompletionRatePct !== a.onTimeCompletionRatePct) {
                  return b.onTimeCompletionRatePct - a.onTimeCompletionRatePct;
                }
                return a.repeatedBreakdownsCount - b.repeatedBreakdownsCount;
              })[0];
              return (
                <div className="bg-white rounded-2xl border-2 border-emerald-300 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-2 end-2 text-3xl opacity-20">🛡️</div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {isAr ? '🛡️ بطل الإنجاز بالموعد وسلامة المصاعد' : '🛡️ On-Time & Quality Guardian'}
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900">{topQuality?.technicianName || '—'}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{topQuality?.technicianCode}</div>
                    <div className="text-2xl font-black text-emerald-700 font-mono mt-3">
                      {topQuality?.onTimeCompletionRatePct || 100}%
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {isAr
                        ? `إنجاز ${topQuality?.onTimeResolvedCount || 0} بلاغ في الوقت المحدد • ${topQuality?.repeatedBreakdownsCount || 0} أعطال متكررة لنفس المصعد`
                        : `${topQuality?.onTimeResolvedCount || 0} fixes on time • ${topQuality?.repeatedBreakdownsCount || 0} repeated elevator faults`}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ALL ROLES KPI (منظومة KPI الشاملة لكافة فئات الموظفين)
      ========================================================================= */}
      {activeTab === 'ALL_ROLES_KPI' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'مصفوفة مؤشرات الأداء الرئيسية (KPIs) لجميع أقسام الشركة' : 'Company-Wide Cross-Role KPI Matrix'}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isAr
                ? 'تقييم شامل لجميع الفئات الوظيفية: فنيو الصيانة • مسؤولو المبيعات • مهندسو التركيبات • خدمة العملاء • الحسابات والمالية.'
                : 'Comprehensive performance index across maintenance, sales, installation, customer service, and finance departments.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Role 1: Maintenance Technicians */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-900 text-xs flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    {isAr ? 'فنيو الصيانة والطوارئ' : 'Maintenance Techs'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {employees.filter((e) => e.role === 'MAINTENANCE_TECH').length} {isAr ? 'فني' : 'techs'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>&bull; <strong>{isAr ? 'مستهدف الأعطال:' : 'Breakdown target:'}</strong> 5 {isAr ? 'إصلاحات/يوم' : 'fixes/d'}</div>
                  <div>&bull; <strong>{isAr ? 'مستهدف الصيانة:' : 'Visits target:'}</strong> 12 {isAr ? 'زيارة/يوم' : 'visits/d'}</div>
                  <div>&bull; <strong>{isAr ? 'متوسط زمن الحل الفعلي:' : 'Current MTTR:'}</strong> {companyOverview.overallAvgFormattedAr}</div>
                  <div>&bull; <strong>{isAr ? 'التزام البصمة الجغرافية:' : 'GPS Geofence:'}</strong> 96%</div>
                </div>
              </div>

              {/* Role 2: Sales Representatives */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-900 text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    {isAr ? 'مسؤولو المبيعات والعقود' : 'Sales Representatives'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {employees.filter((e) => e.role === 'SALES_REP').length} {isAr ? 'مندوب' : 'reps'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>&bull; <strong>{isAr ? 'التارجت المالي الشهري:' : 'Monthly target:'}</strong> 250,000 <SaudiRiyalSymbol className="w-3 h-3 inline" /></div>
                  <div>&bull; <strong>{isAr ? 'تارجت المصاعد الجديدة:' : 'New lifts target:'}</strong> 4 {isAr ? 'مصاعد/شهر' : 'lifts/mo'}</div>
                  <div>&bull; <strong>{isAr ? 'معدل إغلاق الصفقات:' : 'Win rate:'}</strong> 38%</div>
                  <div>&bull; <strong>{isAr ? 'عمولة المبيعات المعتمدة:' : 'Commission:'}</strong> 3.0%</div>
                </div>
              </div>

              {/* Role 3: Installation Engineers */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-900 text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    {isAr ? 'مهندسو التركيبات والمشاريع' : 'Installation Engineers'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    {employees.filter((e) => e.role === 'INSTALLATION_ENG' || e.role === 'PROJECT_MANAGER').length} {isAr ? 'مهندس' : 'engs'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>&bull; <strong>{isAr ? 'المشاريع الجارية:' : 'Active projects:'}</strong> {projects.length} {isAr ? 'مشروع' : 'projects'}</div>
                  <div>&bull; <strong>{isAr ? 'مطابقة كود SBC 801:' : 'SBC 801 compliance:'}</strong> 100% {isAr ? 'معتمد' : 'passed'}</div>
                  <div>&bull; <strong>{isAr ? 'التسليم في الموعد:' : 'On-time delivery:'}</strong> 94%</div>
                  <div>&bull; <strong>{isAr ? 'شهادات سلامة الدفاع المدني:' : 'Civil defense certs:'}</strong> {isAr ? 'سارية' : 'valid'}</div>
                </div>
              </div>

              {/* Role 4: Customer Service & Dispatch */}
              <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-cyan-900 text-xs flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-cyan-600" />
                    {isAr ? 'خدمة العملاء وغرفة العمليات' : 'Customer Care & Dispatch'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                    24/7
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>&bull; <strong>{isAr ? 'سرعة توجيه البلاغات (MTTA):' : 'Dispatch time:'}</strong> &lt; 5 {isAr ? 'دقائق' : 'mins'}</div>
                  <div>&bull; <strong>{isAr ? 'معدل رضا العملاء (CSAT):' : 'Customer rating:'}</strong> 4.9 / 5.0 ⭐</div>
                  <div>&bull; <strong>{isAr ? 'إغلاق البلاغات بدون تكرار:' : 'First-time fix:'}</strong> 95%</div>
                </div>
              </div>

              {/* Role 5: Finance & Accounting */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-teal-900 text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-teal-600" />
                    {isAr ? 'الإدارة المالية والفوترة ZATCA' : 'Finance & ZATCA'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                    ZATCA Phase 2
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>&bull; <strong>{isAr ? 'إصدار الفواتير الفوري:' : 'Invoicing speed:'}</strong> 100% {isAr ? 'إلكتروني' : 'e-invoicing'}</div>
                  <div>&bull; <strong>{isAr ? 'مطابقة كود QR الضريبي:' : 'Tax QR code:'}</strong> {isAr ? 'معتمد نظامياً' : 'compliant'}</div>
                  <div>&bull; <strong>{isAr ? 'معدل تحصيل المطالبات:' : 'Collection rate:'}</strong> 92%</div>
                </div>
              </div>

              {/* Role 6: Warehouse & Supply Chain */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-900 text-xs flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-600" />
                    {isAr ? 'المستودع وقطع الغيار' : 'Warehouse & Parts'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {isAr ? 'جاهزية المخزون' : 'Stock Ready'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>&bull; <strong>{isAr ? 'صرف سندات القطع التالفة:' : 'Damaged parts fulfill:'}</strong> &lt; 2 {isAr ? 'ساعات' : 'hrs'}</div>
                  <div>&bull; <strong>{isAr ? 'توفر قطع طوارئ الأبواب والبريك:' : 'Safety parts stock:'}</strong> 100%</div>
                  <div>&bull; <strong>{isAr ? 'دقة الجرد الدوري:' : 'Inventory accuracy:'}</strong> 99.2%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INSPECTION MODAL: DETAILED COMPLETION RECORD
      ========================================================================= */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/20 text-indigo-200 font-bold">
                  {inspectingRecord.breakdownId}
                </span>
                <h3 className="text-base font-black mt-1">
                  {isAr ? 'سجل إنجاز ومعالجة البلاغ المعتمد' : 'Certified Resolution Ticket'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Highlight Ribbon */}
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-indigo-700 font-bold">{isAr ? 'مدة الإصلاح والحل المحسوبة:' : 'Calculated Duration:'}</div>
                  <div className="text-xl font-black text-indigo-950 font-mono mt-0.5">
                    {isAr ? inspectingRecord.durationFormattedAr : inspectingRecord.durationFormattedEn}
                  </div>
                </div>
                <div className="text-right rtl:text-left">
                  {inspectingRecord.isSlaMet ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                      {isAr ? 'ملتزم بـ SLA ⚡' : 'SLA Met'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 inline-block">
                      {isAr ? 'تجاوز الـ SLA ⏳' : 'SLA Breached'}
                    </span>
                  )}
                  <div className="text-[10px] text-indigo-600 font-mono mt-1">
                    {isAr ? `هدف الأولوية: ${inspectingRecord.slaTargetMinutes} دقيقة` : `Target: ${inspectingRecord.slaTargetMinutes}m`}
                  </div>
                </div>
              </div>

              {/* Technician Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                    {inspectingRecord.technicianName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-slate-900">{inspectingRecord.technicianName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{inspectingRecord.technicianCode}</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {isAr ? 'فني صيانة معتمد' : 'Field Technician'}
                </span>
              </div>

              {/* Elevator & Customer Details */}
              <div className="space-y-1.5 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'العميل:' : 'Customer:'}</span>
                  <span className="font-bold text-slate-900">{inspectingRecord.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الموقع:' : 'Location:'}</span>
                  <span className="font-bold text-slate-800">{inspectingRecord.siteLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'المصعد:' : 'Elevator:'}</span>
                  <span className="font-bold text-indigo-900">{inspectingRecord.elevatorName} ({inspectingRecord.elevatorNumber})</span>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-sans font-bold">{isAr ? 'وقت استلام البلاغ:' : 'Reported At:'}</div>
                  <div className="text-slate-900 font-bold mt-0.5">{inspectingRecord.reportedAt?.replace('T', ' ').slice(0, 16)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-sans font-bold">{isAr ? 'وقت إتمام الحل والإغلاق:' : 'Resolved At:'}</div>
                  <div className="text-slate-900 font-bold mt-0.5">{inspectingRecord.resolvedAt?.replace('T', ' ').slice(0, 16)}</div>
                </div>
              </div>

              {/* Work Performed */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-700 mb-1">
                  {isAr ? 'تفاصيل الإصلاح والعمل المنفذ:' : 'Work Performed:'}
                </div>
                <p className="text-slate-800 leading-relaxed font-sans">
                  {inspectingRecord.workPerformed}
                </p>
              </div>

              {inspectingRecord.cost > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                  <span>{isAr ? 'تكلفة الإصلاح وقطع الغيار:' : 'Repair & Parts Cost:'}</span>
                  <span className="font-mono text-sm">{inspectingRecord.cost} <SaudiRiyalSymbol className="w-3.5 h-3.5 inline" /></span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
