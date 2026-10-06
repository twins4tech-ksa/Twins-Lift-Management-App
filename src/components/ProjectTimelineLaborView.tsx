import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  Factory,
  Truck,
  Wrench,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  Trash2,
  DollarSign,
  Users,
  Building2,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Info,
  CalendarDays,
  Timer,
  X,
  PieChart,
  TrendingUp,
  FileText,
  Sparkles
} from 'lucide-react';
import {
  ElevatorSpecification,
  ProjectMilestoneKey,
  MilestoneStatus,
  ProjectMilestoneData,
  ProjectEmployeeLaborLog
} from '../types/elevator';
import { Employee } from '../types/employee';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import { DailyProjectTimesheetEntry } from './DailyProjectTimesheetEntry';

interface Props {
  spec: ElevatorSpecification;
  employees: Employee[];
  language?: 'ar' | 'en';
  onUpdateSpec: (updated: Partial<ElevatorSpecification>) => void;
}

const MILESTONE_DEFINITIONS: {
  key: ProjectMilestoneKey;
  stepNumber: number;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: React.ElementType;
}[] = [
  {
    key: 'Engineering',
    stepNumber: 1,
    titleAr: 'الاعتماد الهندسي والتصميم',
    titleEn: 'Engineering & CAD Approval',
    descAr: 'اعتماد المخططات التنفيذية، فحص ومطابقة البئر، وإصدار أمر التصنيع',
    descEn: 'Shaft CAD signoff, architectural clearance survey & factory build order',
    icon: FileCheck,
  },
  {
    key: 'Manufacturing',
    stepNumber: 2,
    titleAr: 'التصنيع والتجهيز بالمصنع',
    titleEn: 'Precision Manufacturing',
    descAr: 'تصنيع ماكينة الجر، الكابينة، لوحة الكنترول، واختبارات الجودة QA',
    descEn: 'Fabrication of traction drive, car frame, control panel & factory QA tests',
    icon: Factory,
  },
  {
    key: 'Shipping',
    stepNumber: 3,
    titleAr: 'الشحن والتوريد للموقع',
    titleEn: 'Shipping & Site Logistics',
    descAr: 'الشحن، التخليص الجمركي (سابر/SASO)، وتعتيق المواد بموقع المشروع',
    descEn: 'Freight transit, Saber/SASO clearance, site delivery & staging',
    icon: Truck,
  },
  {
    key: 'Installation',
    stepNumber: 4,
    titleAr: 'التركيب الميداني والتشغيل',
    titleEn: 'Installation & Commissioning',
    descAr: 'تركيب السكك والأبواب، تجميع الكابينة، الفحص الميداني، وتسليم الدفاع المدني',
    descEn: 'Guide rails, landing doors, cabin assembly, safety tests & civil defense handover',
    icon: Wrench,
  },
];

export const ProjectTimelineLaborView: React.FC<Props> = ({
  spec,
  employees,
  language = 'ar',
  onUpdateSpec,
}) => {
  const isAr = language === 'ar';

  // ----------------------------------------------------
  // Milestone State Management
  // ----------------------------------------------------
  const milestonesData: Record<ProjectMilestoneKey, ProjectMilestoneData> = useMemo(() => {
    const existing = spec.projectMilestones || {};
    return {
      Engineering: existing.Engineering || { key: 'Engineering', status: 'IN_PROGRESS' },
      Manufacturing: existing.Manufacturing || { key: 'Manufacturing', status: 'PENDING' },
      Shipping: existing.Shipping || { key: 'Shipping', status: 'PENDING' },
      Installation: existing.Installation || { key: 'Installation', status: 'PENDING' },
    };
  }, [spec.projectMilestones]);

  const updateMilestone = (key: ProjectMilestoneKey, partial: Partial<ProjectMilestoneData>) => {
    const updated = {
      ...milestonesData,
      [key]: {
        ...milestonesData[key],
        ...partial,
      },
    };
    onUpdateSpec({ projectMilestones: updated });
  };

  const advanceMilestone = (currentKey: ProjectMilestoneKey) => {
    const keys: ProjectMilestoneKey[] = ['Engineering', 'Manufacturing', 'Shipping', 'Installation'];
    const idx = keys.indexOf(currentKey);
    const updated = { ...milestonesData };
    updated[currentKey] = { ...updated[currentKey], status: 'COMPLETED' };
    if (idx < keys.length - 1) {
      const nextKey = keys[idx + 1];
      if (updated[nextKey].status === 'PENDING') {
        updated[nextKey] = { ...updated[nextKey], status: 'IN_PROGRESS' };
      }
      onUpdateSpec({ projectMilestones: updated, currentMilestone: nextKey });
    } else {
      onUpdateSpec({ projectMilestones: updated, currentMilestone: 'Installation', status: 'Installed' });
    }
  };

  const completedCount = useMemo(() => {
    return Object.values(milestonesData).filter((m) => m.status === 'COMPLETED').length;
  }, [milestonesData]);

  const progressPercent = Math.round((completedCount / 4) * 100);

  // ----------------------------------------------------
  // Labor Logs State Management
  // ----------------------------------------------------
  const laborLogs = useMemo(() => {
    return spec.laborLogs || [];
  }, [spec.laborLogs]);

  // Timesheet Entry Form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('ALL');
  const [filterMilestone, setFilterMilestone] = useState<string>('ALL');

  // Milestone Cost Map
  const milestoneCostMap = useMemo(() => {
    const map: Record<string, { cost: number; hours: number; count: number }> = {
      Engineering: { cost: 0, hours: 0, count: 0 },
      Manufacturing: { cost: 0, hours: 0, count: 0 },
      Shipping: { cost: 0, hours: 0, count: 0 },
      Installation: { cost: 0, hours: 0, count: 0 },
      General: { cost: 0, hours: 0, count: 0 },
    };
    laborLogs.forEach((l) => {
      const key = l.milestone || 'General';
      if (!map[key]) map[key] = { cost: 0, hours: 0, count: 0 };
      map[key].cost += l.totalCost || 0;
      map[key].hours += l.hoursWorked || 0;
      map[key].count += 1;
    });
    return map;
  }, [laborLogs]);

  // Aggregated Cost Center Metrics
  const totalLaborHours = useMemo(() => {
    return Math.round(laborLogs.reduce((sum, item) => sum + (item.hoursWorked || 0), 0) * 10) / 10;
  }, [laborLogs]);

  const totalOvertimeHours = useMemo(() => {
    return Math.round(laborLogs.reduce((sum, item) => sum + (item.overtimeHours || 0), 0) * 10) / 10;
  }, [laborLogs]);

  const totalLaborCost = useMemo(() => {
    return Math.round(laborLogs.reduce((sum, item) => sum + (item.totalCost || 0), 0));
  }, [laborLogs]);

  const distinctEmployeesCount = useMemo(() => {
    const set = new Set(laborLogs.map((l) => l.employeeId));
    return set.size;
  }, [laborLogs]);

  const avgHourlyRate = useMemo(() => {
    return totalLaborHours > 0 ? Math.round((totalLaborCost / totalLaborHours) * 10) / 10 : 0;
  }, [totalLaborHours, totalLaborCost]);

  // Save new logs handler (single or crew)
  const handleSaveNewLogs = (newLogs: ProjectEmployeeLaborLog[]) => {
    const updatedLogs = [...newLogs, ...laborLogs];
    const newTotalCost = updatedLogs.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    onUpdateSpec({
      laborLogs: updatedLogs,
      totalLaborCost: newTotalCost,
    });
    setIsFormOpen(false);
    setIsModalOpen(false);
  };

  const handleDeleteLaborLog = (logId: string) => {
    const updatedLogs = laborLogs.filter((l) => l.id !== logId);
    const newTotalCost = updatedLogs.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    onUpdateSpec({
      laborLogs: updatedLogs,
      totalLaborCost: newTotalCost,
    });
  };

  // Breakdown by Employee
  const employeeSummary = useMemo(() => {
    const map: Record<string, { name: string; role: string; totalHours: number; totalCost: number; logCount: number }> = {};
    laborLogs.forEach((l) => {
      if (!map[l.employeeId]) {
        map[l.employeeId] = {
          name: l.employeeName,
          role: l.employeeRole || '',
          totalHours: 0,
          totalCost: 0,
          logCount: 0,
        };
      }
      map[l.employeeId].totalHours += l.hoursWorked || 0;
      map[l.employeeId].totalCost += l.totalCost || 0;
      map[l.employeeId].logCount += 1;
    });
    return Object.entries(map).map(([empId, data]) => ({
      empId,
      ...data,
      totalHours: Math.round(data.totalHours * 10) / 10,
      totalCost: Math.round(data.totalCost),
    }));
  }, [laborLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return laborLogs.filter((l) => {
      if (filterEmployeeId !== 'ALL' && l.employeeId !== filterEmployeeId) return false;
      if (filterMilestone !== 'ALL' && l.milestone !== filterMilestone) return false;
      return true;
    });
  }, [laborLogs, filterEmployeeId, filterMilestone]);

  // Financial Margins Integration
  const contractPrice = spec.totalQuotationPrice || 0;
  const materialCost = spec.subtotalCost || 0;
  const netOperatingProfit = Math.round(contractPrice - materialCost - totalLaborCost);
  const netMarginPercent = contractPrice > 0 ? Math.round((netOperatingProfit / contractPrice) * 1000) / 10 : 0;

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ========================================================================= */}
      {/* SECTION 1: SIMPLIFIED, EASY-TO-USE PROJECT MILESTONES TRACKER             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>{isAr ? 'المسار الزمني ومراحل تنفيذ المشروع (4 مراحل رئيسية)' : 'Project Milestones & Timeline (4 Core Stages)'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'تحكم سهل وسريع في مراحل التنفيذ الأربعة مع ربط ساعات وتكلفة عمالة كل مرحلة'
                : 'Simple, streamlined control over the 4 execution phases linked directly with phase labor costs'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? `مكتمل ${completedCount} من 4 (${progressPercent}%)` : `Completed ${completedCount} of 4 (${progressPercent}%)`}
            </span>
            <div className="w-24 sm:w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Clean Milestone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {MILESTONE_DEFINITIONS.map((def) => {
            const data = milestonesData[def.key];
            const isCompleted = data.status === 'COMPLETED';
            const isInProgress = data.status === 'IN_PROGRESS';
            const IconComponent = def.icon;
            const phaseLabor = milestoneCostMap[def.key] || { cost: 0, hours: 0 };

            return (
              <div
                key={def.key}
                className={`rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                    : isInProgress
                    ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-100 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isInProgress
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {def.stepNumber}
                      </span>
                      <span>{isAr ? def.titleAr : def.titleEn}</span>
                    </span>

                    <IconComponent
                      className={`w-4 h-4 ${
                        isCompleted ? 'text-emerald-600' : isInProgress ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                    {isAr ? def.descAr : def.descEn}
                  </p>

                  {/* Phase Labor Cost Badge - Directly integrates labor into milestone card */}
                  <div className="mb-3 px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] flex items-center justify-between">
                    <span className="text-slate-500 font-medium">{isAr ? 'أجور المرحلة:' : 'Phase Labor:'}</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {phaseLabor.cost.toLocaleString()} {isAr ? 'ر.س' : 'SAR'} ({phaseLabor.hours} {isAr ? 'س' : 'h'})
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  {/* Status Buttons Segment */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[10px]">
                    <button
                      type="button"
                      onClick={() => updateMilestone(def.key, { status: 'PENDING' })}
                      className={`flex-1 py-1 rounded font-bold transition-colors cursor-pointer text-center ${
                        data.status === 'PENDING'
                          ? 'bg-slate-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isAr ? 'معلق' : 'Pending'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMilestone(def.key, { status: 'IN_PROGRESS' })}
                      className={`flex-1 py-1 rounded font-bold transition-colors cursor-pointer text-center ${
                        data.status === 'IN_PROGRESS'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isAr ? 'جاري' : 'Active'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMilestone(def.key, { status: 'COMPLETED' })}
                      className={`flex-1 py-1 rounded font-bold transition-colors cursor-pointer text-center ${
                        data.status === 'COMPLETED'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isAr ? 'مكتمل ✓' : 'Done ✓'}
                    </button>
                  </div>

                  {/* Target Date and Done Date */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div>
                      <label className="block text-slate-400 font-medium mb-0.5">
                        {isAr ? 'الموعد المتوقع' : 'Target Date'}
                      </label>
                      <input
                        type="date"
                        value={data.targetDate || ''}
                        onChange={(e) => updateMilestone(def.key, { targetDate: e.target.value })}
                        className="w-full px-1.5 py-1 text-[11px] rounded bg-white border border-slate-200 text-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-0.5">
                        {isAr ? 'تاريخ الاعتماد' : 'Finished Date'}
                      </label>
                      <input
                        type="date"
                        value={data.completedDate || ''}
                        onChange={(e) => updateMilestone(def.key, { completedDate: e.target.value })}
                        className="w-full px-1.5 py-1 text-[11px] rounded bg-white border border-slate-200 text-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  {/* Notes Field */}
                  <input
                    type="text"
                    placeholder={isAr ? 'ملاحظات المرحلة...' : 'Milestone notes...'}
                    value={data.notes || ''}
                    onChange={(e) => updateMilestone(def.key, { notes: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] rounded bg-white border border-slate-200 text-slate-700 placeholder-slate-400"
                  />

                  {/* Advance to next milestone button */}
                  {!isCompleted && isInProgress && (
                    <button
                      type="button"
                      onClick={() => advanceMilestone(def.key)}
                      className="w-full py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Check className="w-3 h-3" />
                      <span>{isAr ? 'اعتماد وإنهاء المرحلة' : 'Signoff Milestone'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PROJECT LABOR & ATTENDANCE COST CENTER                         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        {/* Header & Action Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>{isAr ? 'مركز تكلفة عمالة المشروع وسجل اليوميات' : 'Project Labor Cost Center & Timesheet'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'تتبع أوقات بدء وانتهاء ورديات الفنيين يومياً واحتساب الرواتب والأجور المحملة على تكلفة المشروع تلقائياً'
                : 'Track daily start/end times and hours per employee to compute labor costs directly on the project cost center'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {/* Print/Export Timesheet Button */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title={isAr ? 'طباعة تقرير تكلفة وساعات العمالة' : 'Print Timesheet Report'}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isAr ? 'طباعة تقرير التكلفة' : 'Print Timesheet'}</span>
            </button>

            {/* Quick Open Modal */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-indigo-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAr ? 'تسجيل طاقم عمل (سريع)' : 'Quick Crew Entry'}</span>
            </button>

            {/* Inline Toggle Form */}
            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isFormOpen ? (isAr ? 'إغلاق النموذج' : 'Close Form') : (isAr ? 'تسجيل يومية عمل موظف' : 'Log Employee Hours')}</span>
            </button>
          </div>
        </div>

        {/* Cost Center Financial Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-indigo-700 block mb-1">
              {isAr ? 'إجمالي ساعات العمل بالمشروع' : 'Total Labor Hours'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-900 font-mono flex items-baseline gap-1">
              <span>{totalLaborHours}</span>
              <span className="text-xs font-medium text-indigo-600">{isAr ? 'ساعة' : 'hrs'}</span>
            </div>
            <span className="text-[10px] text-indigo-600/80 mt-1 block">
              {laborLogs.length} {isAr ? 'يومية عمل' : 'entries'} &bull; {totalOvertimeHours} {isAr ? 'ساعات إضافية' : 'OT hrs'}
            </span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-emerald-700 block mb-1">
              {isAr ? 'تكلفة الأجور المحملة على المشروع' : 'Total Labor Cost'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono flex items-baseline gap-1">
              <SaudiRiyalSymbol className="w-4 h-4 text-emerald-600 self-center" />
              <span>{totalLaborCost.toLocaleString()}</span>
              <span className="text-xs font-medium text-emerald-600">{isAr ? 'ر.س' : 'SAR'}</span>
            </div>
            <span className="text-[10px] text-emerald-600/80 mt-1 block">
              {contractPrice > 0
                ? `${((totalLaborCost / contractPrice) * 100).toFixed(1)}% ${isAr ? 'من قيمة العقد' : 'of contract'}`
                : isAr ? 'مركز تكلفة المشروع' : 'Cost center'}
            </span>
          </div>

          <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-blue-700 block mb-1">
              {isAr ? 'طاقم العمل والكوادر المسجلة' : 'Active Crew Members'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono flex items-baseline gap-1">
              <span>{distinctEmployeesCount}</span>
              <span className="text-xs font-medium text-blue-600">{isAr ? 'أفراد' : 'persons'}</span>
            </div>
            <span className="text-[10px] text-blue-600/80 mt-1 block">
              {avgHourlyRate} {isAr ? 'ر.س/ساعة متوسط الأجر' : 'SAR/hr avg rate'}
            </span>
          </div>

          <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-purple-700 block mb-1">
              {isAr ? 'هامش الربح بعد خصم العمالة' : 'Net Margin After Labor'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-900 font-mono flex items-baseline gap-1">
              <SaudiRiyalSymbol className="w-4 h-4 text-purple-600 self-center" />
              <span>{netOperatingProfit.toLocaleString()}</span>
              <span className="text-xs font-medium text-purple-600">({netMarginPercent}%)</span>
            </div>
            <span className="text-[10px] text-purple-600/80 mt-1 block">
              {isAr ? 'قيمة العقد - المواد - أجور العمالة' : 'Contract - BOM - Labor'}
            </span>
          </div>
        </div>

        {/* Dedicated Daily Timesheet Entry Component (Inline Form) */}
        {isFormOpen && (
          <div className="mt-5 p-4 sm:p-5 bg-slate-50 border border-indigo-200 rounded-2xl animate-in fade-in duration-150">
            <DailyProjectTimesheetEntry
              spec={spec}
              employees={employees}
              language={language}
              onSaveLogs={handleSaveNewLogs}
              onClose={() => setIsFormOpen(false)}
              isModal={false}
            />
          </div>
        )}

        {/* Milestone Labor Cost Breakdown Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAr ? 'توزيع تكلفة الأجور بحسب مراحل المشروع:' : 'Labor Cost Allocation by Milestone:'}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {isAr ? 'إجمالي المحمل: ' : 'Total: '}
              <strong>{totalLaborCost.toLocaleString()} ر.س</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-500 block truncate">{isAr ? '1. الاعتماد الهندسي' : '1. Engineering'}</span>
              <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                {milestoneCostMap.Engineering.cost.toLocaleString()} ر.س
              </span>
              <span className="text-[9px] text-slate-400">{milestoneCostMap.Engineering.hours} س ({milestoneCostMap.Engineering.count} يومية)</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-500 block truncate">{isAr ? '2. التصنيع والتجهيز' : '2. Manufacturing'}</span>
              <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                {milestoneCostMap.Manufacturing.cost.toLocaleString()} ر.س
              </span>
              <span className="text-[9px] text-slate-400">{milestoneCostMap.Manufacturing.hours} س ({milestoneCostMap.Manufacturing.count} يومية)</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-500 block truncate">{isAr ? '3. الشحن والتوريد' : '3. Shipping'}</span>
              <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                {milestoneCostMap.Shipping.cost.toLocaleString()} ر.س
              </span>
              <span className="text-[9px] text-slate-400">{milestoneCostMap.Shipping.hours} س ({milestoneCostMap.Shipping.count} يومية)</span>
            </div>

            <div className="bg-slate-50 border border-indigo-200 rounded-lg p-2 bg-indigo-50/30">
              <span className="text-[10px] text-indigo-700 font-bold block truncate">{isAr ? '4. التركيب الميداني' : '4. Installation'}</span>
              <span className="font-mono font-bold text-indigo-900 text-xs mt-0.5 block">
                {milestoneCostMap.Installation.cost.toLocaleString()} ر.س
              </span>
              <span className="text-[9px] text-indigo-600">{milestoneCostMap.Installation.hours} س ({milestoneCostMap.Installation.count} يومية)</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-[10px] text-slate-500 block truncate">{isAr ? 'أعمال عامة وإشراف' : 'General'}</span>
              <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                {milestoneCostMap.General.cost.toLocaleString()} ر.س
              </span>
              <span className="text-[9px] text-slate-400">{milestoneCostMap.General.hours} س ({milestoneCostMap.General.count} يومية)</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar for Timesheet Logs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">
                {isAr ? 'الموظف:' : 'Employee:'}
              </span>
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="ALL">{isAr ? 'جميع الموظفين' : 'All Employees'}</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">
                {isAr ? 'المرحلة:' : 'Milestone:'}
              </span>
              <select
                value={filterMilestone}
                onChange={(e) => setFilterMilestone(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="ALL">{isAr ? 'كافة المراحل' : 'All Milestones'}</option>
                <option value="Engineering">{isAr ? '1. الاعتماد الهندسي' : '1. Engineering'}</option>
                <option value="Manufacturing">{isAr ? '2. التصنيع والتجهيز' : '2. Manufacturing'}</option>
                <option value="Shipping">{isAr ? '3. الشحن والتوريد' : '3. Shipping'}</option>
                <option value="Installation">{isAr ? '4. التركيب الميداني' : '4. Installation'}</option>
                <option value="General">{isAr ? 'أعمال عامة' : 'General'}</option>
              </select>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {isAr ? `عرض ${filteredLogs.length} سجل عمل` : `Showing ${filteredLogs.length} entries`}
          </span>
        </div>

        {/* Detailed Timesheet Logs Table */}
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs divide-y divide-slate-200" dir={isAr ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-50 text-slate-700 font-bold text-[11px]">
              <tr>
                <th className="px-3 py-2.5">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="px-3 py-2.5">{isAr ? 'اسم الموظف / الفني' : 'Employee'}</th>
                <th className="px-3 py-2.5">{isAr ? 'المرحلة' : 'Milestone'}</th>
                <th className="px-3 py-2.5">{isAr ? 'فترة العمل' : 'Work Times'}</th>
                <th className="px-3 py-2.5">{isAr ? 'الساعات (عادية / إضافي)' : 'Hours (Reg / OT)'}</th>
                <th className="px-3 py-2.5">{isAr ? 'الأجر/ساعة' : 'Rate/hr'}</th>
                <th className="px-3 py-2.5">{isAr ? 'التكلفة المحملة' : 'Charged Cost'}</th>
                <th className="px-3 py-2.5">{isAr ? 'الأعمال المنجزة' : 'Work Done'}</th>
                <th className="px-3 py-2.5 text-center">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-xs text-slate-600">
                      {isAr ? 'لا توجد سجلات يوميات عمل مسجلة لهذا المشروع بعد' : 'No labor timesheet records logged yet'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isAr
                        ? 'انقر على "تسجيل يومية عمل موظف" لتسجيل ساعات العمل وحساب تكلفة الأجور على المشروع'
                        : 'Click "Log Employee Hours" above to record employee times and compute cost center impact'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{log.employeeName}</div>
                      <div className="text-[10px] text-slate-500">{log.employeeRole}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.milestone === 'Engineering'
                          ? (isAr ? 'الاعتماد الهندسي' : 'Engineering')
                          : log.milestone === 'Manufacturing'
                          ? (isAr ? 'التصنيع' : 'Manufacturing')
                          : log.milestone === 'Shipping'
                          ? (isAr ? 'الشحن والتوريد' : 'Shipping')
                          : log.milestone === 'Installation'
                          ? (isAr ? 'التركيب والتشغيل' : 'Installation')
                          : (isAr ? 'عام' : 'General')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                      {log.startTime} - {log.endTime}
                      {log.breakMinutes ? (
                        <span className="text-[10px] text-slate-400 block">
                          ({log.breakMinutes}m {isAr ? 'استراحة' : 'break'})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                      <span className="font-bold text-indigo-700">{log.hoursWorked} {isAr ? 'س' : 'h'}</span>
                      {log.overtimeHours && log.overtimeHours > 0 ? (
                        <span className="text-[10px] text-amber-700 block font-bold">
                          +{log.overtimeHours} {isAr ? 'إضافي' : 'OT'}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                      {log.hourlyRate} {isAr ? 'ر.س' : 'SAR'}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-black text-emerald-700 whitespace-nowrap">
                      {log.totalCost.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 max-w-xs text-[11px] leading-relaxed">
                      <div>{log.workDescription}</div>
                      {log.supervisorName && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isAr ? 'المشرف: ' : 'Supervisor: '} {log.supervisorName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteLaborLog(log.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title={isAr ? 'حذف السجل' : 'Delete record'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Employee Summary Breakdown Cards */}
        {employeeSummary.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'ملخص ساعات وتكلفة كل موظف على مركز تكلفة المشروع:' : 'Employee Labor Cost Breakdown for this Project:'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {employeeSummary.map((emp) => (
                <div
                  key={emp.empId}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{emp.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {emp.logCount} {isAr ? 'يوميات مسجلة' : 'shifts logged'} &bull; {emp.totalHours} {isAr ? 'ساعة' : 'hrs'}
                    </span>
                  </div>
                  <div className="text-left font-mono font-bold text-emerald-700">
                    <div>{emp.totalCost.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* QUICK MODAL TIMESHEET ENTRY                                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <DailyProjectTimesheetEntry
          spec={spec}
          employees={employees}
          language={language}
          onSaveLogs={handleSaveNewLogs}
          onClose={() => setIsModalOpen(false)}
          isModal={true}
        />
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE TIMESHEET AUDIT REPORT MODAL                                    */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  {isAr ? 'بيان ساعات وتكاليف عمالة المشروع (تقرير مركز التكلفة)' : 'Project Timesheet & Labor Cost Center Audit Report'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة' : 'Print'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
              {/* Project Header Summary */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex justify-between items-center">
                <div>
                  <h4 className="text-base font-extrabold text-slate-800">{spec.projectName}</h4>
                  <div className="text-slate-500 mt-1">
                    {isAr ? 'العميل: ' : 'Client: '} {spec.clientName} &bull; {isAr ? 'رقم العرض/المشروع: ' : 'Ref: '} {spec.quoteRef}
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div className="text-slate-500 text-[11px]">{isAr ? 'إجمالي تكلفة العمالة' : 'Total Labor Cost'}</div>
                  <div className="text-lg font-black text-emerald-700">{totalLaborCost.toLocaleString()} ر.س</div>
                  <div className="text-slate-500 text-[10px]">{totalLaborHours} {isAr ? 'إجمالي ساعات العمل' : 'Hours'}</div>
                </div>
              </div>

              {/* Table of all entries */}
              <table className="w-full text-right divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="p-2">{isAr ? 'الموظف' : 'Employee'}</th>
                    <th className="p-2">{isAr ? 'المرحلة' : 'Milestone'}</th>
                    <th className="p-2">{isAr ? 'الوقت' : 'Times'}</th>
                    <th className="p-2">{isAr ? 'الساعات' : 'Hours'}</th>
                    <th className="p-2">{isAr ? 'الأجر/س' : 'Rate'}</th>
                    <th className="p-2">{isAr ? 'التكلفة' : 'Cost'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {laborLogs.map((log, idx) => (
                    <tr key={log.id} className="text-[11px]">
                      <td className="p-2 text-slate-400">{idx + 1}</td>
                      <td className="p-2 text-slate-700">{log.date}</td>
                      <td className="p-2 font-bold font-sans text-slate-800">{log.employeeName}</td>
                      <td className="p-2 font-sans text-slate-600">{log.milestone || 'General'}</td>
                      <td className="p-2 text-slate-600">{log.startTime} - {log.endTime}</td>
                      <td className="p-2 font-bold text-indigo-700">{log.hoursWorked}</td>
                      <td className="p-2 text-slate-600">{log.hourlyRate}</td>
                      <td className="p-2 font-bold text-emerald-700">{log.totalCost.toLocaleString()} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signoff Footer */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 text-slate-600 text-center">
                <div>
                  <div className="font-bold text-slate-800">{isAr ? 'توقيع المشرف الميداني' : 'Field Supervisor'}</div>
                  <div className="mt-8 border-t border-dashed border-slate-300 pt-1 text-[11px] text-slate-400">
                    {isAr ? 'الاسم والاعتماد' : 'Signature & Date'}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">{isAr ? 'اعتماد الإدارة المالية / مركز التكلفة' : 'Finance / Cost Center Audit'}</div>
                  <div className="mt-8 border-t border-dashed border-slate-300 pt-1 text-[11px] text-slate-400">
                    {isAr ? 'الختم والمصادقة' : 'Stamp & Approval'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
