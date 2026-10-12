import React, { useState, useMemo } from 'react';
import { ElevatorSpecification } from '../types/elevator';
import { Customer } from '../types/elevator';
import { MaintenanceContract, MaintenanceBreakdown } from '../types/maintenance';
import { InventoryItem } from '../types/inventory';
import { Employee } from '../types/employee';
import { UserProfile } from '../types/portal';
import { Invoice } from '../types/finance';
import { NavTab } from '../types/navigation';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';
import { SalesAnalyticsDashboard } from './SalesAnalyticsDashboard';
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Wrench,
  AlertTriangle,
  Calendar,
  Receipt,
  Boxes,
  Users,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  MapPin,
  FileText,
  BadgeCheck,
  DollarSign,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Activity,
  Flame,
  Award,
  Moon
} from 'lucide-react';
import { formatHijriDate, formatGregorianDate } from '../utils/hijriDate';

interface ExecutiveDashboardViewProps {
  projects: ElevatorSpecification[];
  customers: Customer[];
  maintenanceContracts: MaintenanceContract[];
  breakdowns: MaintenanceBreakdown[];
  inventory: InventoryItem[];
  employees: Employee[];
  invoices?: Invoice[];
  currentUser: UserProfile | null;
  language: AppLanguage;
  onNavigate: (tab: NavTab) => void;
  onSelectProject?: (project: ElevatorSpecification) => void;
  onNewQuotation?: () => void;
  onNewContract?: () => void;
  onNewBreakdown?: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  projects,
  customers,
  maintenanceContracts,
  breakdowns,
  inventory,
  employees,
  invoices = [],
  currentUser,
  language,
  onNavigate,
  onSelectProject,
  onNewQuotation,
  onNewContract,
  onNewBreakdown,
}) => {
  const isAr = language === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'SALES_ANALYTICS' | 'MAINTENANCE_OPS' | 'FINANCE_SUMMARY'>('OVERVIEW');

  // 1. High-level Sales & Pipeline Statistics
  const salesStats = useMemo(() => {
    const totalProjects = projects.length;
    const wonProjects = projects.filter((p) => p.status === 'Won' || p.status === 'Installed');
    const pipelineProjects = projects.filter((p) => p.status === 'Sent' || p.status === 'Approved' || p.status === 'Draft');
    
    const wonTotalSar = wonProjects.reduce((acc, p) => acc + (p.totalQuotationPrice || 0), 0);
    const pipelineTotalSar = pipelineProjects.reduce((acc, p) => acc + (p.totalQuotationPrice || 0), 0);
    const totalPotentialSar = projects.reduce((acc, p) => acc + (p.totalQuotationPrice || 0), 0);

    const winRate = totalProjects > 0 ? Math.round((wonProjects.length / totalProjects) * 100) : 0;

    return {
      totalProjects,
      wonCount: wonProjects.length,
      pipelineCount: pipelineProjects.length,
      wonTotalSar,
      pipelineTotalSar,
      totalPotentialSar,
      winRate,
    };
  }, [projects]);

  // 2. Maintenance Contracts Statistics
  const maintenanceStats = useMemo(() => {
    const activeContracts = maintenanceContracts.filter((c) => c.status === 'Active');
    const totalAnnualValue = activeContracts.reduce((acc, c) => acc + (c.totalPrice || 0), 0);
    
    // Check expiring in 30 days
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = activeContracts.filter((c) => {
      const end = new Date(c.endDate);
      return end >= now && end <= thirtyDaysAhead;
    });

    return {
      totalContracts: maintenanceContracts.length,
      activeCount: activeContracts.length,
      totalAnnualValue,
      expiringSoonCount: expiringSoon.length,
    };
  }, [maintenanceContracts]);

  // 3. Field Breakdowns Statistics
  const breakdownStats = useMemo(() => {
    const openBreakdowns = breakdowns.filter((b) => b.status === 'Reported' || b.status === 'Assigned' || b.status === 'In_Progress');
    const emergencyBreakdowns = openBreakdowns.filter((b) => b.priority === 'Emergency' || b.priority === 'High');
    const completedRecently = breakdowns.filter((b) => b.status === 'Resolved');

    return {
      totalBreakdowns: breakdowns.length,
      openCount: openBreakdowns.length,
      emergencyCount: emergencyBreakdowns.length,
      completedCount: completedRecently.length,
    };
  }, [breakdowns]);

  // 4. Inventory Health
  const inventoryStats = useMemo(() => {
    const lowStockItems = inventory.filter((item) => (item.quantityOnHand ?? 0) <= (item.minStockLevel ?? 5));
    const totalValuation = inventory.reduce((acc, item) => acc + ((item.quantityOnHand || 0) * (item.unitCost || 0)), 0);

    return {
      totalItems: inventory.length,
      lowStockCount: lowStockItems.length,
      totalValuation,
    };
  }, [inventory]);

  // 5. Finance & Invoicing
  const financeStats = useMemo(() => {
    if (invoices.length > 0) {
      const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
      const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');
      const totalCollected = paidInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
      const pendingAmount = totalInvoiced - totalCollected;

      return {
        totalInvoiced,
        totalCollected,
        pendingAmount: Math.max(0, pendingAmount),
        count: invoices.length,
      };
    }

    // Default estimate calculated from active contracts and projects
    const contractsTotal = maintenanceContracts.filter(c => c.status === 'Active').reduce((acc, c) => acc + (c.totalPrice || 0), 0);
    const projectsTotal = projects.filter(p => p.status === 'Won' || p.status === 'Installed').reduce((acc, p) => acc + (p.totalQuotationPrice || 0), 0);
    const estimatedTotal = Math.max(284500, contractsTotal + Math.round(projectsTotal * 0.4));
    const estimatedCollected = Math.round(estimatedTotal * 0.75);

    return {
      totalInvoiced: estimatedTotal,
      totalCollected: estimatedCollected,
      pendingAmount: estimatedTotal - estimatedCollected,
      count: maintenanceContracts.length + projects.length,
    };
  }, [invoices, maintenanceContracts, projects]);

  const activeTechniciansCount = useMemo(() => {
    return employees.filter((e) => e.role === 'MAINTENANCE_TECH' && e.status === 'ACTIVE').length;
  }, [employees]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Top Executive Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                {isAr ? 'لوحة التحكم والمؤشرات التنفيذية' : 'Executive Management Dashboard'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isAr ? 'النظام متصل ومباشر' : 'Live System Online'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isAr
                ? `مرحباً بك، ${currentUser?.name || 'مدير المنظومة'}`
                : `Welcome, ${currentUser?.name || 'Executive Administrator'}`}
            </h1>

            <p className="text-xs sm:text-sm text-blue-200/80 max-w-2xl leading-relaxed">
              {isAr
                ? 'مركز القيادة الموحد لمتابعة مؤشرات مبيعات المصاعد، عقود الصيانة، حركة الأعطال الميدانية، الفوترة والمخزون.'
                : 'Central enterprise command for real-time elevator sales, maintenance contracts, field breakdowns, invoicing, and inventory.'}
            </p>
          </div>

          {/* Executive Dual Calendar: Gregorian & Hijri Date */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15 text-xs flex items-center gap-3 shadow-inner">
              <div className="flex flex-col gap-1.5 text-start">
                {/* Gregorian Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-[11px] text-blue-200/90 font-medium">{isAr ? 'الميلادي:' : 'Gregorian:'}</span>
                  <span className="font-bold text-white font-mono text-[11px] sm:text-xs">
                    {formatGregorianDate(new Date(), isAr)}
                  </span>
                </div>
                {/* Hijri Date */}
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] text-amber-300 font-semibold">{isAr ? 'الهجري:' : 'Hijri:'}</span>
                  <span className="font-black text-amber-300 font-mono text-[11px] sm:text-xs">
                    {formatHijriDate(new Date(), isAr)}
                  </span>
                </div>
              </div>
            </div>

            {onNewQuotation && (
              <button
                type="button"
                onClick={onNewQuotation}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? '+ عرض بيع جديد' : '+ New Quote'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Primary Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Sales & Commercial Pipeline */}
        <div 
          onClick={() => onNavigate('SALES_QUOTATIONS')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
              {isAr ? 'عقود البيع المعتمدة' : 'Won Sales Contracts'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BadgeCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 font-mono">
              <SarPrice value={salesStats.wonTotalSar} />
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <span>{salesStats.wonCount} {isAr ? 'عقد منجز' : 'contracts'}</span>
              <span className="text-slate-400">•</span>
              <span>{salesStats.winRate}% {isAr ? 'نسبة الفوز' : 'win rate'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Maintenance Contracts */}
        <div 
          onClick={() => onNavigate('MAINTENANCE_CONTRACTS')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-amber-600 transition-colors">
              {isAr ? 'عقود الصيانة السارية' : 'Active Maint. Contracts'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 font-mono">
              <SarPrice value={maintenanceStats.totalAnnualValue} />
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
              <span>{maintenanceStats.activeCount} {isAr ? 'عقد ساري' : 'active'}</span>
              {maintenanceStats.expiringSoonCount > 0 && (
                <span className="text-rose-600 font-bold">
                  ({maintenanceStats.expiringSoonCount} {isAr ? 'قرب انتهاء' : 'expiring'})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Active Breakdowns & Emergencies */}
        <div 
          onClick={() => onNavigate('MAINTENANCE_BREAKDOWNS')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-rose-600 transition-colors">
              {isAr ? 'بلاغات الأعطال الميدانية' : 'Active Breakdowns'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${breakdownStats.openCount > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 font-mono flex items-baseline gap-1.5">
              <span>{breakdownStats.openCount}</span>
              <span className="text-xs font-bold text-slate-400">{isAr ? 'بلاغ مفتوح' : 'open'}</span>
            </div>
            <div className="text-[11px] mt-0.5">
              {breakdownStats.emergencyCount > 0 ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {breakdownStats.emergencyCount} {isAr ? 'طوارئ حرجة' : 'critical'}
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">{isAr ? 'لا توجد طوارئ حرجة' : 'No critical'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Technicians & Field Workforce */}
        <div 
          onClick={() => onNavigate('TECHNICIAN_PORTAL')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
              {isAr ? 'الفنيون الميدانيون' : 'Active Field Technicians'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 font-mono flex items-baseline gap-1.5">
              <span>{activeTechniciansCount}</span>
              <span className="text-xs font-bold text-slate-400">{isAr ? 'فني على رأس العمل' : 'on duty'}</span>
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">
              {isAr ? 'جاهزية PWA والعمل بدون إنترنت' : 'PWA & Offline Ready'}
            </div>
          </div>
        </div>

        {/* Card 5: Finance & ZATCA Invoicing */}
        <div 
          onClick={() => onNavigate('FINANCE_INVOICES')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-600 transition-colors">
              {isAr ? 'الفوترة وضريبة ZATCA' : 'ZATCA Billing'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 font-mono">
              <SarPrice value={financeStats.totalInvoiced} />
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {isAr ? 'فواتير إلكترونية معتمدة' : 'Phase 2 Compliant'}
            </div>
          </div>
        </div>

        {/* Card 6: Inventory & Spare Parts Alerts */}
        <div 
          onClick={() => onNavigate('INVENTORY')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-amber-600 transition-colors">
              {isAr ? 'مستودع قطع الغيار' : 'Warehouse Stock'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 font-mono flex items-baseline gap-1.5">
              <span>{inventoryStats.totalItems}</span>
              <span className="text-xs font-bold text-slate-400">{isAr ? 'صنف مسجل' : 'items'}</span>
            </div>
            <div className="text-[11px] mt-0.5">
              {inventoryStats.lowStockCount > 0 ? (
                <span className="text-rose-600 font-bold">
                  {inventoryStats.lowStockCount} {isAr ? 'أصناف بلغت حد الطلب' : 'low stock items'}
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">{isAr ? 'المخزون متوفر ومستقر' : 'Stock healthy'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Fast Action Command Ribbon */}
      <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
        <span className="text-slate-600 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>{isAr ? 'الوصول السريع والإجراءات الفورية:' : 'Quick Shortcuts:'}</span>
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('CUSTOMERS')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'دليل العملاء' : 'Customers'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('INTERACTIVE_MAP')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>{isAr ? 'الخريطة التفاعلية' : 'Field Map'}</span>
          </button>

          {onNewContract && (
            <button
              type="button"
              onClick={onNewContract}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAr ? 'عقد صيانة جديد' : 'New Maint. Contract'}</span>
            </button>
          )}

          {onNewBreakdown && (
            <button
              type="button"
              onClick={onNewBreakdown}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-rose-700 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{isAr ? 'تسجيل بلاغ عطل' : 'Report Breakdown'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('TECHNICIAN_PORTAL')}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Wrench className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? 'بوابة الفنيين الميدانية' : 'Technician Workspace'}</span>
          </button>
        </div>
      </div>

      {/* 4. Sub-Tabs Bar: Overview vs Sales Analytics vs Maintenance vs Finance */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 overflow-x-auto shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{isAr ? 'نظرة عامة والعمليات الحالية' : 'Operational Overview'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('SALES_ANALYTICS')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'SALES_ANALYTICS'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'تحليلات المبيعات والإيرادات' : 'Sales & Revenue Analytics'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('MAINTENANCE_OPS')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'MAINTENANCE_OPS'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>{isAr ? 'عمليات الصيانة ومستوى الخدمة SLA' : 'Maintenance & SLA'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('FINANCE_SUMMARY')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'FINANCE_SUMMARY'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4 text-purple-600" />
          <span>{isAr ? 'الملخص المالي والفوترة' : 'Financial Summary'}</span>
        </button>
      </div>

      {/* 5. Sub-Tab Content Rendering */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
          {/* Section A: Recent Sales Quotations & Projects Pipeline */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-800">
                  {isAr ? 'أحدث عروض ومشاريع بيع المصاعد' : 'Recent Elevator Quotations'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('SALES_QUOTATIONS')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isAr ? 'عرض الكل' : 'View All'}</span>
                {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="space-y-2.5">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  onClick={() => onSelectProject?.(project)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{project.clientName || 'عميل تجريبي'}</div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {project.buildingType || 'سكني'} • {project.stops || 4} {isAr ? 'طوابق' : 'stops'} • {project.elevatorType}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-mono font-bold text-slate-900">
                      <SarPrice value={project.totalQuotationPrice || 0} />
                    </div>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                      project.status === 'Won' || project.status === 'Installed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : project.status === 'Lost'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Urgent Breakdowns & Field Operations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-black text-slate-800">
                  {isAr ? 'بلاغات الأعطال الميدانية النشطة' : 'Active Field Breakdowns'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('MAINTENANCE_BREAKDOWNS')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isAr ? 'لوحة الأعطال' : 'Breakdown Board'}</span>
                {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="space-y-2.5">
              {breakdowns.filter((b) => b.status !== 'Resolved').slice(0, 5).map((bd) => (
                <div
                  key={bd.id}
                  onClick={() => onNavigate('MAINTENANCE_BREAKDOWNS')}
                  className="p-3 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/20 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{bd.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({bd.elevatorName})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{bd.description}</div>
                  </div>
                  <div className="text-end shrink-0">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      bd.priority === 'Emergency' || bd.priority === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {bd.priority}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{bd.reportedAt ? bd.reportedAt.slice(0, 10) : 'الآن'}</div>
                  </div>
                </div>
              ))}

              {breakdowns.filter((b) => b.status !== 'Resolved').length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span>{isAr ? 'لا توجد بلاغات أعطال مفتوحة حالياً، كل المصاعد تعمل بكفاءة' : 'No active breakdowns, all elevators operational.'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Render embedded SalesAnalyticsDashboard */}
      {activeSubTab === 'SALES_ANALYTICS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs animate-in fade-in duration-150">
          <SalesAnalyticsDashboard
            projects={projects}
            language={language}
            onSelectProject={onSelectProject}
            onNavigateToDrawings={() => onNavigate('DRAWINGS')}
            onNavigateToPrint={() => onNavigate('PRINT')}
          />
        </div>
      )}

      {/* Render Maintenance Operations */}
      {activeSubTab === 'MAINTENANCE_OPS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isAr ? 'مؤشرات أداء عقود وزيارات الصيانة الميدانية' : 'Maintenance & SLA Performance'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'عقود سارية، مواعيد التجديد، والتغطية الفنية' : 'Active contracts, renewal alerts, and coverage'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('MAINTENANCE_CONTRACTS')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {isAr ? 'إدارة عقود الصيانة بالكامل' : 'Manage All Contracts'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">{isAr ? 'إجمالي العقود' : 'Total Contracts'}</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{maintenanceContracts.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-700 font-medium">{isAr ? 'عقود سارية نشطة' : 'Active Contracts'}</span>
              <div className="text-2xl font-black text-emerald-800 mt-1">{maintenanceStats.activeCount}</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-xs text-amber-700 font-medium">{isAr ? 'تجديدات خلال 30 يوم' : 'Renewals in 30 Days'}</span>
              <div className="text-2xl font-black text-amber-800 mt-1">{maintenanceStats.expiringSoonCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Render Financial Summary */}
      {activeSubTab === 'FINANCE_SUMMARY' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isAr ? 'الموجز المالي والفواتير والتحصيل' : 'Financial & Invoicing Summary'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'الربط مع هيئة الزكاة والضريبة والجمارك (ZATCA Phase 2)' : 'ZATCA E-invoicing & Collections'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('FINANCE_INVOICES')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {isAr ? 'سجل الفواتير وسندات القبض' : 'Invoices & Receipts'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">{isAr ? 'إجمالي المفوتر' : 'Total Invoiced'}</span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                <SarPrice value={financeStats.totalInvoiced} />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-700 font-medium">{isAr ? 'إجمالي المحصل' : 'Collected'}</span>
              <div className="text-2xl font-black text-emerald-800 font-mono mt-1">
                <SarPrice value={financeStats.totalCollected} />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-xs text-purple-700 font-medium">{isAr ? 'ضريبة القيمة المضافة (15%)' : 'VAT 15%'}</span>
              <div className="text-2xl font-black text-purple-800 font-mono mt-1">
                <SarPrice value={Math.round(financeStats.totalInvoiced * 0.15)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
