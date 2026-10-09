import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  User,
  Users,
  Download,
  Plus,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PieChart,
  Briefcase,
  TrendingUp,
  Tag,
  ChevronDown,
  Building2,
  FileCheck
} from 'lucide-react';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import {
  ElevatorSpecification,
  ProjectEmployeeLaborLog,
  ProjectMilestoneKey
} from '../types/elevator';
import { Employee } from '../types/employee';
import { DailyProjectTimesheetEntry } from './DailyProjectTimesheetEntry';

interface Props {
  spec: ElevatorSpecification;
  employees: Employee[];
  language?: 'ar' | 'en';
  onUpdateSpec: (partial: Partial<ElevatorSpecification>) => void;
}

export const ProjectTimesheetTab: React.FC<Props> = ({
  spec,
  employees,
  language = 'ar',
  onUpdateSpec,
}) => {
  const isAr = language === 'ar';

  // State: Timesheet entry form open
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);

  // Filters
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('ALL');
  const [selectedMilestoneFilter, setSelectedMilestoneFilter] = useState<string>('ALL');
  const [overtimeFilter, setOvertimeFilter] = useState<'ALL' | 'OVERTIME_ONLY' | 'REGULAR_ONLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Timesheet logs for this project
  const laborLogs = useMemo(() => {
    return spec.laborLogs || [];
  }, [spec.laborLogs]);

  // Handle saving new logs
  const handleSaveNewLogs = (newLogs: ProjectEmployeeLaborLog[]) => {
    const updated = [...laborLogs, ...newLogs];
    const newTotalLaborCost = Math.round(
      updated.reduce((sum, log) => sum + (log.totalCost || 0), 0) * 100
    ) / 100;

    onUpdateSpec({
      laborLogs: updated,
      totalLaborCost: newTotalLaborCost,
    });

    setIsEntryFormOpen(false);
  };

  // Handle deleting a log
  const handleDeleteLog = (logId: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف سجل يومية العمل هذا؟' : 'Are you sure you want to delete this timesheet log?')) {
      const updated = laborLogs.filter((l) => l.id !== logId);
      const newTotalLaborCost = Math.round(
        updated.reduce((sum, log) => sum + (log.totalCost || 0), 0) * 100
      ) / 100;

      onUpdateSpec({
        laborLogs: updated,
        totalLaborCost: newTotalLaborCost,
      });
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return laborLogs.filter((log) => {
      if (selectedEmpFilter !== 'ALL' && log.employeeId !== selectedEmpFilter) {
        return false;
      }
      if (selectedMilestoneFilter !== 'ALL' && log.milestone !== selectedMilestoneFilter) {
        return false;
      }
      if (overtimeFilter === 'OVERTIME_ONLY' && !(log.overtimeHours && log.overtimeHours > 0 || log.isOvertime)) {
        return false;
      }
      if (overtimeFilter === 'REGULAR_ONLY' && (log.overtimeHours && log.overtimeHours > 0 || log.isOvertime)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmp = log.employeeName.toLowerCase().includes(q);
        const matchDesc = log.workDescription.toLowerCase().includes(q);
        const matchDate = log.date.includes(q);
        const matchReason = log.overtimeReason ? log.overtimeReason.toLowerCase().includes(q) : false;
        if (!matchEmp && !matchDesc && !matchDate && !matchReason) return false;
      }
      return true;
    });
  }, [laborLogs, selectedEmpFilter, selectedMilestoneFilter, overtimeFilter, searchQuery]);

  // --------------------------------------------------------------------------
  // Summary Calculations: Multiplying total hours by employee hourly rate
  // --------------------------------------------------------------------------
  const summary = useMemo(() => {
    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    let totalLaborCost = 0;
    let totalOvertimeCost = 0;
    const employeeHoursMap: Record<string, {
      empId: string;
      name: string;
      role: string;
      hours: number;
      regularHours: number;
      overtimeHours: number;
      hourlyRate: number;
      totalCost: number;
      logsCount: number;
      overtimeReasons: string[];
    }> = {};

    laborLogs.forEach((log) => {
      const h = Number(log.hoursWorked) || 0;
      const regH = Number(log.regularHours ?? h);
      const otH = Number(log.overtimeHours) || 0;
      const rate = Number(log.hourlyRate) || 0;
      const mult = Number(log.overtimeMultiplier) || 1.5;
      const cost = Number(log.totalCost) || (regH * rate + otH * rate * mult);
      const otCostOnly = otH * rate * mult;

      totalHours += h;
      regularHours += regH;
      overtimeHours += otH;
      totalLaborCost += cost;
      totalOvertimeCost += otCostOnly;

      // Group per employee
      if (!employeeHoursMap[log.employeeId]) {
        employeeHoursMap[log.employeeId] = {
          empId: log.employeeId,
          name: log.employeeName,
          role: log.employeeRole || 'Technician',
          hours: 0,
          regularHours: 0,
          overtimeHours: 0,
          hourlyRate: rate,
          totalCost: 0,
          logsCount: 0,
          overtimeReasons: [],
        };
      }

      employeeHoursMap[log.employeeId].hours += h;
      employeeHoursMap[log.employeeId].regularHours += regH;
      employeeHoursMap[log.employeeId].overtimeHours += otH;
      employeeHoursMap[log.employeeId].totalCost += cost;
      employeeHoursMap[log.employeeId].logsCount += 1;
      if (log.overtimeReason && !employeeHoursMap[log.employeeId].overtimeReasons.includes(log.overtimeReason)) {
        employeeHoursMap[log.employeeId].overtimeReasons.push(log.overtimeReason);
      }
    });

    const employeeSummaryList = Object.values(employeeHoursMap).sort((a, b) => b.totalCost - a.totalCost);

    const contractPrice = spec.totalQuotationPrice || 0;
    const laborRatio = contractPrice > 0 ? (totalLaborCost / contractPrice) * 100 : 0;
    const avgHourlyRate = totalHours > 0 ? Math.round((totalLaborCost / totalHours) * 10) / 10 : 0;

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      regularHours: Math.round(regularHours * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      totalLaborCost: Math.round(totalLaborCost),
      totalOvertimeCost: Math.round(totalOvertimeCost),
      laborRatio: Math.round(laborRatio * 10) / 10,
      avgHourlyRate,
      distinctStaffCount: employeeSummaryList.length,
      employeeSummaryList,
    };
  }, [laborLogs, spec.totalQuotationPrice]);

  // --------------------------------------------------------------------------
  // CSV Export Handler
  // --------------------------------------------------------------------------
  const handleExportCsv = () => {
    const quoteRef = spec.quoteRef || spec.id || 'PROJ';
    const projName = spec.projectName || 'Project';
    const clientName = spec.clientName || 'Client';
    const exportDate = new Date().toISOString().split('T')[0];

    // CSV Headers
    const headers = isAr
      ? [
          'رقم السجل',
          'التاريخ',
          'اسم الموظف / الفني',
          'المسمى الوظيفي',
          'المرحلة الميدانية',
          'وقت البدء',
          'وقت الانتهاء',
          'الاستراحة (دقيقة)',
          'إجمالي الساعات',
          'الساعات الأساسية',
          'عمل إضافي؟',
          'الساعات الإضافية',
          'مبرر وسبب العمل الإضافي',
          'أجر الساعة (ر.س)',
          'معامل الإضافي',
          'إجمالي تكلفة الأجر (ر.س)',
          'بيان الأعمال المنجزة',
          'اسم المشرف',
        ]
      : [
          'Log ID',
          'Date',
          'Employee Name',
          'Role',
          'Milestone',
          'Start Time',
          'End Time',
          'Break (mins)',
          'Total Hours',
          'Regular Hours',
          'Is Overtime?',
          'Overtime Hours',
          'Overtime Reason',
          'Hourly Rate (SAR)',
          'OT Multiplier',
          'Total Labor Cost (SAR)',
          'Work Description',
          'Supervisor',
        ];

    // CSV Rows
    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.date}"`,
      `"${log.employeeName.replace(/"/g, '""')}"`,
      `"${(log.employeeRole || '').replace(/"/g, '""')}"`,
      `"${log.milestone || 'General'}"`,
      `"${log.startTime}"`,
      `"${log.endTime}"`,
      `"${log.breakMinutes || 0}"`,
      log.hoursWorked,
      log.regularHours ?? log.hoursWorked,
      log.isOvertime || (log.overtimeHours && log.overtimeHours > 0) ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No'),
      log.overtimeHours || 0,
      `"${(log.overtimeReason || '').replace(/"/g, '""')}"`,
      log.hourlyRate,
      log.overtimeMultiplier || 1.5,
      log.totalCost,
      `"${log.workDescription.replace(/"/g, '""')}"`,
      `"${(log.supervisorName || '').replace(/"/g, '""')}"`,
    ]);

    // Metadata lines & Summary Totals
    const csvContent = [
      `\uFEFF${isAr ? 'تقرير سجلات ساعات عمل وتكلفة عمالة المشروع' : 'Project Employee Timesheet & Labor Cost Report'}`,
      `${isAr ? 'اسم المشروع' : 'Project Name'},"${projName.replace(/"/g, '""')}"`,
      `${isAr ? 'رقم العرض / الكود' : 'Quote Ref'},"${quoteRef}"`,
      `${isAr ? 'العميل' : 'Client'},"${clientName.replace(/"/g, '""')}"`,
      `${isAr ? 'تاريخ التصدير' : 'Export Date'},"${exportDate}"`,
      `${isAr ? 'إجمالي ساعات العمل' : 'Total Hours'},${summary.totalHours}`,
      `${isAr ? 'إجمالي تكلفة الأجور (ر.س)' : 'Total Labor Cost (SAR)'},${summary.totalLaborCost}`,
      `${isAr ? 'متوسط أجر الساعة (ر.س)' : 'Avg Hourly Rate (SAR)'},${summary.avgHourlyRate}`,
      `${isAr ? 'عدد الكوادر' : 'Staff Count'},${summary.distinctStaffCount}`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `${isAr ? 'الإجمالي العام' : 'TOTALS'},,,,,,,"${summary.totalHours}","${summary.regularHours}",,"${summary.overtimeHours}",,,"${summary.avgHourlyRate}",,"${summary.totalLaborCost}"`,
    ].join('\r\n');

    // Create Download Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timesheet-${quoteRef.replace(/[^a-zA-Z0-9_-]/g, '_')}-${exportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ========================================================================= */}
      {/* HEADER STRIP WITH ACTION BUTTONS & CSV EXPORT                             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {isAr ? 'سجلات وساعات عمل المشروع وتكلفة الأجور' : 'Project Employee Timesheet Logs & Labor Costs'}
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {laborLogs.length} {isAr ? 'سجل دوام' : 'logs'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr
                  ? `متابعة حضور وفترات عمل الفنيين لمشروع (${spec.projectName || 'المصعد'}) واحتساب تكلفة الأجور بضرب ساعات العمل في أجر الساعة`
                  : `Track staff hours for (${spec.projectName}) with total labor costs calculated by multiplying hours by employee hourly rate.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={laborLogs.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={isAr ? 'تصدير سجلات الساعات وتكلفة الأجور كملف CSV منسق' : 'Export formatted CSV file'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isAr ? 'تصدير ملف CSV' : 'Export CSV'}</span>
            </button>

            {/* Add Log Button */}
            <button
              type="button"
              onClick={() => setIsEntryFormOpen(!isEntryFormOpen)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isEntryFormOpen ? (isAr ? 'إغلاق نموذج التسجيل' : 'Close Form') : (isAr ? '+ تسجيل يومية عمل' : '+ Log Hours')}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUMMARY KPI CARDS: Multiplying total hours by employee hourly rate       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
          {/* 1. Total Labor Cost (Hours × Rate) */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-emerald-400 block mb-1 flex items-center gap-1">
              <SaudiRiyalSymbol className="w-3.5 h-3.5" />
              <span>{isAr ? 'إجمالي تكلفة أجور العمالة المحملة' : 'Total Charged Labor Cost'}</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline gap-1">
              <span>{summary.totalLaborCost.toLocaleString()}</span>
              <span className="text-xs font-bold text-emerald-400">{isAr ? 'ر.س' : 'SAR'}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{isAr ? 'مجموع (الساعات × أجر الساعة)' : '∑ (Hours × Hourly Rate)'}</span>
              {summary.laborRatio > 0 && (
                <span className="text-emerald-400 font-bold">{summary.laborRatio}% {isAr ? 'من العقد' : 'of quote'}</span>
              )}
            </div>
          </div>

          {/* 2. Total Hours Worked */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-indigo-300 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{isAr ? 'إجمالي ساعات العمل بالمشروع' : 'Total Project Hours'}</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline gap-1">
              <span>{summary.totalHours}</span>
              <span className="text-xs font-bold text-indigo-300">{isAr ? 'ساعة' : 'hrs'}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              <span>{summary.regularHours} {isAr ? 'أساسي' : 'reg'}</span>
              {summary.overtimeHours > 0 && (
                <span className="text-amber-300 font-bold ms-1">+ {summary.overtimeHours} {isAr ? 'إضافي' : 'OT'}</span>
              )}
            </div>
          </div>

          {/* 3. Overtime Cost & Hours */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-amber-300 block mb-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'تكلفة العمل الإضافي (Overtime)' : 'Overtime Cost & Hours'}</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-200 font-mono flex items-baseline gap-1">
              <span>{summary.totalOvertimeCost.toLocaleString()}</span>
              <span className="text-xs font-bold text-amber-300">{isAr ? 'ر.س' : 'SAR'}</span>
            </div>
            <div className="text-[10px] text-amber-400/80 mt-1">
              <span>{summary.overtimeHours} {isAr ? 'ساعة إضافية بمعامل 1.5×' : 'OT hours @ 1.5x'}</span>
            </div>
          </div>

          {/* 4. Active Staff & Average Rate */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-blue-300 block mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{isAr ? 'طاقم العمل ومتوسط الأجر' : 'Active Crew & Avg Rate'}</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline gap-1">
              <span>{summary.distinctStaffCount}</span>
              <span className="text-xs font-bold text-blue-300">{isAr ? 'أفراد' : 'crew'}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              <span>{isAr ? 'متوسط أجر الساعة: ' : 'Avg: '}</span>
              <strong className="text-blue-300">{summary.avgHourlyRate} {isAr ? 'ر.س/ساعة' : 'SAR/h'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INLINE / EXPANDABLE TIMESHEET ENTRY FORM                                  */}
      {/* ========================================================================= */}
      {isEntryFormOpen && (
        <div className="p-5 bg-slate-50 border border-indigo-200 rounded-2xl shadow-sm animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-100">
            <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'تسجيل يومية عمل وحساب التكلفة للمشروع' : 'Record Daily Employee Project Timesheet'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsEntryFormOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>

          <DailyProjectTimesheetEntry
            spec={spec}
            employees={employees}
            language={language}
            onSaveLogs={handleSaveNewLogs}
            onClose={() => setIsEntryFormOpen(false)}
            isModal={false}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* EMPLOYEE-BY-EMPLOYEE BREAKDOWN CARDS (Hours × Hourly Rate = Total Cost)  */}
      {/* ========================================================================= */}
      {summary.employeeSummaryList.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'تفصيل ساعات وأجور كل موظف مسند للمشروع (الساعات × أجر الساعة)' : 'Employee Breakdown: Total Hours × Hourly Rate = Labor Cost'}</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              {summary.employeeSummaryList.length} {isAr ? 'فنيين / مهندسين' : 'staff members'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {summary.employeeSummaryList.map((emp) => {
              const pctOfProjectLabor = summary.totalLaborCost > 0
                ? Math.round((emp.totalCost / summary.totalLaborCost) * 100)
                : 0;

              return (
                <div
                  key={emp.empId}
                  className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-black text-xs text-slate-900 block truncate">{emp.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{emp.role}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold shrink-0">
                      {pctOfProjectLabor}%
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xs">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>{isAr ? 'إجمالي الساعات:' : 'Hours Worked:'}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {emp.hours} {isAr ? 'س' : 'hrs'}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>{isAr ? 'أجر الساعة المعتمد:' : 'Hourly Rate:'}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {emp.hourlyRate} {isAr ? 'ر.س/س' : 'SAR/h'}
                      </span>
                    </div>

                    {emp.overtimeHours > 0 && (
                      <div className="flex justify-between text-[11px] text-amber-700 font-bold">
                        <span>{isAr ? 'ساعات إضافية (OT):' : 'Overtime:'}</span>
                        <span className="font-mono">
                          +{emp.overtimeHours} {isAr ? 'س' : 'h'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs font-black text-emerald-900 pt-1 border-t border-slate-200">
                      <span>{isAr ? 'إجمالي التكلفة:' : 'Total Cost:'}</span>
                      <span className="font-mono text-emerald-700">
                        {Math.round(emp.totalCost).toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                  </div>

                  {emp.overtimeReasons.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-200/50">
                      <span className="text-[9px] text-amber-800 font-bold block mb-0.5">
                        {isAr ? 'مبررات الإضافي:' : 'OT Reasons:'}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {emp.overtimeReasons.map((r, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 truncate max-w-full">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FILTER & SEARCH BAR FOR TIMESHEET LOGS TABLE                              */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالموظف، التاريخ، أو بيان الأعمال...' : 'Search by employee, date, or task...'}
              className="w-full ps-9 pe-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Employee */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">{isAr ? 'الموظف:' : 'Staff:'}</span>
              <select
                value={selectedEmpFilter}
                onChange={(e) => setSelectedEmpFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
              >
                <option value="ALL">{isAr ? 'كافة الموظفين' : 'All Staff'}</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Milestone */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">{isAr ? 'المرحلة:' : 'Milestone:'}</span>
              <select
                value={selectedMilestoneFilter}
                onChange={(e) => setSelectedMilestoneFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
              >
                <option value="ALL">{isAr ? 'كافة المراحل' : 'All Milestones'}</option>
                <option value="Engineering">{isAr ? 'الاعتماد الهندسي' : 'Engineering'}</option>
                <option value="Manufacturing">{isAr ? 'التصنيع' : 'Manufacturing'}</option>
                <option value="Shipping">{isAr ? 'الشحن' : 'Shipping'}</option>
                <option value="Installation">{isAr ? 'التركيب الميداني' : 'Installation'}</option>
                <option value="General">{isAr ? 'أعمال عامة' : 'General'}</option>
              </select>
            </div>

            {/* Filter by Overtime */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">{isAr ? 'الدوام:' : 'Shift:'}</span>
              <select
                value={overtimeFilter}
                onChange={(e) => setOvertimeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
              >
                <option value="ALL">{isAr ? 'الكل (أساسي وإضافي)' : 'All Shifts'}</option>
                <option value="OVERTIME_ONLY">{isAr ? 'عمل إضافي فقط (Overtime Only)' : 'Overtime Only'}</option>
                <option value="REGULAR_ONLY">{isAr ? 'دوام عادي فقط' : 'Regular Only'}</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(selectedEmpFilter !== 'ALL' || selectedMilestoneFilter !== 'ALL' || overtimeFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEmpFilter('ALL');
                  setSelectedMilestoneFilter('ALL');
                  setOvertimeFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-2 py-1 text-[11px] text-rose-600 hover:underline cursor-pointer"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DETAILED TIMESHEET LOGS TABLE FOR THIS PROJECT                            */}
        {/* ========================================================================= */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold text-[11px]">
              <tr>
                <th className="px-3 py-2.5">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="px-3 py-2.5">{isAr ? 'الموظف / الفني' : 'Employee & Role'}</th>
                <th className="px-3 py-2.5">{isAr ? 'فترة العمل' : 'Shift Times'}</th>
                <th className="px-3 py-2.5">{isAr ? 'الساعات المسجلة' : 'Hours'}</th>
                <th className="px-3 py-2.5">{isAr ? 'حالة الإضافي وسببه' : 'Overtime & Reason'}</th>
                <th className="px-3 py-2.5">{isAr ? 'أجر الساعة' : 'Rate/hr'}</th>
                <th className="px-3 py-2.5">{isAr ? 'تكلفة الأجر المحملة' : 'Charged Cost'}</th>
                <th className="px-3 py-2.5">{isAr ? 'المرحلة وبيان الأعمال' : 'Milestone & Tasks'}</th>
                <th className="px-3 py-2.5 text-center">{isAr ? 'حذف' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-700">
                      {isAr ? 'لا توجد سجلات دوام مطابقة لهذا المشروع' : 'No timesheet logs found for this project'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {isAr
                        ? 'يمكنك تسجيل ساعات عمل الموظفين والفنيين الآن بالضغط على زر "+ تسجيل يومية عمل" أعلاه.'
                        : 'Log employee work hours now by clicking the "+ Log Hours" button above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const hasOvertime = (log.overtimeHours && log.overtimeHours > 0) || log.isOvertime;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date */}
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {log.date}
                      </td>

                      {/* Employee & Role */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.employeeName}</div>
                        <div className="text-[10px] text-slate-500">{log.employeeRole || 'Technician'}</div>
                      </td>

                      {/* Shift Times */}
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                        <span>{log.startTime} - {log.endTime}</span>
                        {log.breakMinutes ? (
                          <span className="text-[10px] text-slate-400 block">
                            ({log.breakMinutes} {isAr ? 'د راحة' : 'm break'})
                          </span>
                        ) : null}
                      </td>

                      {/* Hours */}
                      <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                        <span className="font-black text-indigo-900">{log.hoursWorked} {isAr ? 'س' : 'hrs'}</span>
                        <div className="text-[10px] text-slate-400">
                          {log.regularHours ?? log.hoursWorked} {isAr ? 'أساسي' : 'reg'}
                        </div>
                      </td>

                      {/* Overtime & Reason */}
                      <td className="px-3 py-2.5">
                        {hasOvertime ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              <span>⏰</span>
                              <span>+{log.overtimeHours || 0} {isAr ? 'س إضافي' : 'OT h'}</span>
                              <span className="text-amber-700">({log.overtimeMultiplier || 1.5}×)</span>
                            </span>
                            {log.overtimeReason && (
                              <p className="text-[10px] text-amber-800 font-medium max-w-xs line-clamp-2">
                                ↳ {log.overtimeReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {isAr ? 'دوام اعتيادي' : 'Regular Shift'}
                          </span>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap font-bold">
                        {log.hourlyRate} {isAr ? 'ر.س' : 'SAR'}
                      </td>

                      {/* Charged Cost = Hours × Rate */}
                      <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                        <div className="font-black text-emerald-700 text-sm">
                          {Number(log.totalCost).toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {log.hoursWorked} × {log.hourlyRate} {hasOvertime ? `(+ OT)` : ''}
                        </div>
                      </td>

                      {/* Milestone & Tasks */}
                      <td className="px-3 py-2.5 max-w-sm">
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mb-1">
                          {log.milestone === 'Engineering'
                            ? (isAr ? 'الاعتماد الهندسي' : 'Engineering')
                            : log.milestone === 'Manufacturing'
                            ? (isAr ? 'التصنيع' : 'Manufacturing')
                            : log.milestone === 'Shipping'
                            ? (isAr ? 'الشحن' : 'Shipping')
                            : log.milestone === 'Installation'
                            ? (isAr ? 'التركيب الميداني' : 'Installation')
                            : (isAr ? 'أعمال عامة' : 'General')}
                        </span>
                        <div className="text-[11px] text-slate-800 line-clamp-2">{log.workDescription}</div>
                        {log.supervisorName && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {isAr ? 'المشرف: ' : 'Supervisor: '} {log.supervisorName}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={isAr ? 'حذف سجل الدوام' : 'Delete Log'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
