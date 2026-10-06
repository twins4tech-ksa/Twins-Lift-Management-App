import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Users,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
  Building2,
  CalendarDays,
  ShieldAlert,
  Info,
  DollarSign,
  Coffee,
  MapPin,
  Save,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  Employee,
  SiteAttendanceRecord,
  ManualAttendanceStatus,
  AttendanceCheckInType
} from '../types/employee';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';

export interface ManualAttendanceWizardProps {
  employees: Employee[];
  existingRecords?: SiteAttendanceRecord[];
  language?: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onSaveAttendance: (records: SiteAttendanceRecord[]) => void;
}

interface EmployeeAttendanceDraft {
  employeeId: string;
  status: ManualAttendanceStatus;
  checkInTime: string;
  checkOutTime: string;
  notes?: string;
  projectName?: string;
}

const STATUS_CONFIG: Record<
  ManualAttendanceStatus,
  {
    labelAr: string;
    labelEn: string;
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    icon: string;
  }
> = {
  PRESENT: {
    labelAr: 'حاضر',
    labelEn: 'Present',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    badgeBg: 'bg-emerald-600 text-white',
    icon: '✓',
  },
  ON_SITE: {
    labelAr: 'ميداني / موقع',
    labelEn: 'On-Site',
    bg: 'bg-purple-50 hover:bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    badgeBg: 'bg-purple-600 text-white',
    icon: '🏗️',
  },
  LATE: {
    labelAr: 'متأخر',
    labelEn: 'Late',
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    badgeBg: 'bg-amber-600 text-white',
    icon: '⏳',
  },
  ON_LEAVE: {
    labelAr: 'إجازة رسمية',
    labelEn: 'On Leave',
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    badgeBg: 'bg-blue-600 text-white',
    icon: '🏖️',
  },
  MISSION: {
    labelAr: 'مهمة عمل',
    labelEn: 'Mission',
    bg: 'bg-teal-50 hover:bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-300',
    badgeBg: 'bg-teal-600 text-white',
    icon: '💼',
  },
  ABSENT: {
    labelAr: 'غائب',
    labelEn: 'Absent',
    bg: 'bg-rose-50 hover:bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-300',
    badgeBg: 'bg-rose-600 text-white',
    icon: '✕',
  },
};

export const ManualAttendanceWizard: React.FC<ManualAttendanceWizardProps> = ({
  employees,
  existingRecords = [],
  language = 'ar',
  isOpen,
  onClose,
  onSaveAttendance,
}) => {
  const isAr = language === 'ar';

  // Selected Attendance Date (defaults to today)
  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Default Times for the Day
  const [defaultCheckIn, setDefaultCheckIn] = useState<string>('08:00');
  const [defaultCheckOut, setDefaultCheckOut] = useState<string>('17:00');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Selected Employee IDs for Batch Action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Inline Notification feedback banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Draft Attendance Statuses for all employees for the selected date
  const [draftMap, setDraftMap] = useState<Record<string, EmployeeAttendanceDraft>>(() => {
    const map: Record<string, EmployeeAttendanceDraft> = {};
    employees.forEach((emp) => {
      // By default, active employees default to PRESENT, unless ON_LEAVE
      const initialStatus: ManualAttendanceStatus = emp.status === 'ON_LEAVE' ? 'ON_LEAVE' : 'PRESENT';
      map[emp.id] = {
        employeeId: emp.id,
        status: initialStatus,
        checkInTime: '08:00',
        checkOutTime: '17:00',
        notes: '',
      };
    });
    return map;
  });

  // Check if an employee is eligible to attend on the selected date
  // RULE: "make joining date first date can attend"
  const isEmployeeEligibleOnDate = (emp: Employee, dateStr: string): boolean => {
    if (!emp.joinDate) return true;
    return dateStr >= emp.joinDate;
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (departmentFilter !== 'ALL' && emp.role !== departmentFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        (emp.nameEn && emp.nameEn.toLowerCase().includes(q)) ||
        emp.code.toLowerCase().includes(q) ||
        (emp.position && emp.position.toLowerCase().includes(q))
      );
    });
  }, [employees, departmentFilter, searchQuery]);

  // Bulk Select / Deselect
  const handleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map((e) => e.id));
    }
  };

  const handleToggleSelect = (empId: string) => {
    setSelectedIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Apply a status to all currently selected employees
  // "select with status i want then save and can choose some others for another attendance status"
  const handleApplyStatusToSelected = (status: ManualAttendanceStatus) => {
    if (selectedIds.length === 0) return;

    let appliedCount = 0;
    let skippedIneligible = 0;

    setDraftMap((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        const emp = employees.find((e) => e.id === id);
        if (emp && !isEmployeeEligibleOnDate(emp, attendanceDate) && (status === 'PRESENT' || status === 'ON_SITE')) {
          skippedIneligible++;
          return;
        }
        appliedCount++;
        next[id] = {
          ...next[id],
          status,
          checkInTime: defaultCheckIn,
          checkOutTime: defaultCheckOut,
        };
      });
      return next;
    });

    if (skippedIneligible > 0) {
      setNotification({
        type: 'warning',
        message: isAr
          ? `تم تطبيق حالة (${STATUS_CONFIG[status].labelAr}) على ${appliedCount} موظف. تم استبعاد ${skippedIneligible} موظف لأن تاريخ التحاقهم لاحق لتاريخ اليوم.`
          : `Applied ${STATUS_CONFIG[status].labelEn} to ${appliedCount} staff. Skipped ${skippedIneligible} due to join date.`,
      });
    } else {
      setNotification({
        type: 'success',
        message: isAr
          ? `✓ تم حفظ وتطبيق حالة (${STATUS_CONFIG[status].labelAr}) على ${appliedCount} موظف بنجاح! يمكنك الآن اختيار موظفين آخرين وتطبيق حالة أخرى.`
          : `✓ Successfully applied ${STATUS_CONFIG[status].labelEn} to ${appliedCount} staff! You can now select other employees for another status.`,
      });
    }

    // Clear selection so user can immediately select other employees for another status
    setSelectedIds([]);
  };

  // Set single employee status directly
  const handleSetSingleStatus = (empId: string, status: ManualAttendanceStatus) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp && !isEmployeeEligibleOnDate(emp, attendanceDate) && (status === 'PRESENT' || status === 'ON_SITE')) {
      setNotification({
        type: 'error',
        message: isAr
          ? `لا يمكن تسجيل حضور الموظف ${emp.name} في تاريخ (${attendanceDate}) نظراً لأن تاريخ مباشرته الرسمي هو (${emp.joinDate}).`
          : `Cannot mark ${emp.name} as present before joining date (${emp.joinDate}).`,
      });
      return;
    }

    setDraftMap((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        status,
        checkInTime: defaultCheckIn,
        checkOutTime: defaultCheckOut,
      },
    }));

    setNotification({
      type: 'success',
      message: isAr
        ? `تم تحديث حالة الموظف (${emp?.name}) إلى (${STATUS_CONFIG[status].labelAr}) بنجاح.`
        : `Updated ${emp?.name} to ${STATUS_CONFIG[status].labelEn}.`,
    });
  };

  // Attendance summary counts
  const summaryCounts = useMemo(() => {
    const counts = {
      PRESENT: 0,
      ON_SITE: 0,
      LATE: 0,
      ON_LEAVE: 0,
      MISSION: 0,
      ABSENT: 0,
      INELIGIBLE: 0,
    };
    employees.forEach((emp) => {
      if (!isEmployeeEligibleOnDate(emp, attendanceDate)) {
        counts.INELIGIBLE += 1;
      } else {
        const draft = draftMap[emp.id];
        if (draft && draft.status) {
          counts[draft.status] = (counts[draft.status] || 0) + 1;
        }
      }
    });
    return counts;
  }, [employees, draftMap, attendanceDate]);

  // Salary calculations for the day based on attendance
  // "add salary for the employee and salary start count from joining date"
  const dailyPayrollSummary = useMemo(() => {
    let totalEligibleSalarySAR = 0;
    let earnedTodaySalarySAR = 0;

    employees.forEach((emp) => {
      const salary = emp.totalSalary || emp.basicSalary || 0;
      const dailyRate = Math.round((salary / 30) * 10) / 10;
      const draft = draftMap[emp.id];

      if (isEmployeeEligibleOnDate(emp, attendanceDate)) {
        totalEligibleSalarySAR += dailyRate;
        if (draft && (draft.status === 'PRESENT' || draft.status === 'ON_SITE' || draft.status === 'MISSION' || draft.status === 'LATE')) {
          earnedTodaySalarySAR += dailyRate;
        }
      }
    });

    return {
      totalEligibleSalarySAR: Math.round(totalEligibleSalarySAR),
      earnedTodaySalarySAR: Math.round(earnedTodaySalarySAR),
    };
  }, [employees, draftMap, attendanceDate]);

  // Handle final submission and generation of attendance records
  const handleFinalSave = () => {
    const recordsToSave: SiteAttendanceRecord[] = [];
    const nowIso = new Date().toISOString();

    employees.forEach((emp) => {
      const isEligible = isEmployeeEligibleOnDate(emp, attendanceDate);
      const draft = draftMap[emp.id];
      if (!draft) return;

      const effectiveStatus: ManualAttendanceStatus = isEligible ? draft.status : 'ABSENT';

      let checkInType: AttendanceCheckInType = 'MANUAL_ATTENDANCE';
      if (effectiveStatus === 'ON_SITE') {
        checkInType = emp.role === 'MAINTENANCE_TECH' ? 'MAINTENANCE_VISIT' : 'INSTALLATION_SUPERVISION';
      } else if (effectiveStatus === 'MISSION') {
        checkInType = 'CLIENT_MEETING';
      } else if (effectiveStatus === 'PRESENT') {
        checkInType = 'OFFICE_WORK';
      }

      recordsToSave.push({
        id: `att-manual-${attendanceDate}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeRole: emp.role,
        employeePhone: emp.phone,
        checkInType,
        manualStatus: effectiveStatus,
        projectName: draft.projectName || (isAr ? 'المركز الإداري / الميدان' : 'Headquarters / Field'),
        clientName: isAr ? 'تحضير يدوي معتمد' : 'Authorized Manual Roster',
        siteLocation: isAr ? 'المقر الرئيسي / المواقع الميدانية' : 'Main Office / Field Sites',
        targetLatitude: 24.7136,
        targetLongitude: 46.6753,
        recordedLatitude: 24.7136,
        recordedLongitude: 46.6753,
        distanceMeters: 0,
        allowedRadiusMeters: 500,
        isWithinRadius: true,
        status: 'VERIFIED_IN_RANGE',
        timestamp: `${attendanceDate}T${draft.checkInTime || '08:00'}:00.000Z`,
        dateStr: attendanceDate,
        timeStr: draft.checkInTime || '08:00',
        notes: !isEligible
          ? (isAr ? `تاريخ الالتحاق (${emp.joinDate}) لاحق لهذا اليوم` : `Joined on ${emp.joinDate}`)
          : draft.notes || (isAr ? `تحضير يدوي: ${STATUS_CONFIG[effectiveStatus].labelAr}` : `Manual: ${effectiveStatus}`),
      });
    });

    onSaveAttendance(recordsToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{isAr ? 'معالج التحضير وتسجيل الحضور اليدوي لكافة الموظفين' : 'Manual Attendance & Daily Roster Wizard'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {employees.length} {isAr ? 'موظف' : 'Staff'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'عرض كامل الموظفين، تحديد المجموعات وإسناد حالات الحضور، مع التحقق من تاريخ المباشرة واحتساب الرواتب'
                  : 'View all staff, select groups to apply attendance statuses, enforce join date eligibility & salary calculation'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Notification Banner */}
        {notification && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between transition-all border-b ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : notification.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Control Bar: Date Selector, Default Times & Salary Impact */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'تاريخ يوم التحضير:' : 'Attendance Date:'}</span>
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500">
                {attendanceDate === new Date().toISOString().split('T')[0] ? (isAr ? '• اليوم الحالي' : '• Today') : ''}
              </span>
            </div>

            {/* Quick Shift Times */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">{isAr ? 'وقت الدخول:' : 'In:'}</span>
                <input
                  type="time"
                  value={defaultCheckIn}
                  onChange={(e) => setDefaultCheckIn(e.target.value)}
                  className="font-mono text-xs px-2 py-1 rounded border border-slate-200 bg-white"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-600">{isAr ? 'الخروج:' : 'Out:'}</span>
                <input
                  type="time"
                  value={defaultCheckOut}
                  onChange={(e) => setDefaultCheckOut(e.target.value)}
                  className="font-mono text-xs px-2 py-1 rounded border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* KPI Summary Pill Indicators */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✓ {isAr ? 'حاضر: ' : 'Present: '} {summaryCounts.PRESENT + summaryCounts.ON_SITE}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                🏗️ {isAr ? 'ميداني: ' : 'On-Site: '} {summaryCounts.ON_SITE}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                ⏳ {isAr ? 'متأخر: ' : 'Late: '} {summaryCounts.LATE}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                🏖️ {isAr ? 'إجازة: ' : 'Leave: '} {summaryCounts.ON_LEAVE}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                ✕ {isAr ? 'غائب: ' : 'Absent: '} {summaryCounts.ABSENT}
              </span>
              {summaryCounts.INELIGIBLE > 0 && (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                  ⚠️ {isAr ? 'لم يباشر بعد: ' : 'Not Joined Yet: '} {summaryCounts.INELIGIBLE}
                </span>
              )}
            </div>

            {/* Daily Salary Cost */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono">
              <span className="text-[11px] text-slate-500 font-normal">{isAr ? 'مستحق رواتب اليوم:' : 'Daily Salary:'}</span>
              <span className="text-emerald-700 font-black">
                {dailyPayrollSummary.earnedTodaySalarySAR.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                / {dailyPayrollSummary.totalEligibleSalarySAR.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
              </span>
            </div>
          </div>
        </div>

        {/* Batch Action Toolbar: Select some, apply status, then select others and apply another status */}
        <div className="bg-indigo-900 text-white px-5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-inner">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-indigo-300" />
              )}
              <span>
                {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0
                  ? isAr ? 'إلغاء تحديد الكل' : 'Deselect All'
                  : isAr ? 'تحديد كل المعروض' : 'Select All'}
              </span>
            </button>

            <span className="text-xs text-indigo-200">
              {selectedIds.length > 0 ? (
                <strong className="text-white font-bold">
                  {isAr ? `(تم تحديد ${selectedIds.length} موظف)` : `(${selectedIds.length} selected)`}
                </strong>
              ) : (
                <span className="text-indigo-300/80">
                  {isAr ? 'حدد موظفاً أو أكثر لتطبيق الحالة عليهم دفعة واحدة:' : 'Select staff to apply status in bulk:'}
                </span>
              )}
            </span>
          </div>

          {/* Bulk Status Apply Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-indigo-200 font-medium hidden lg:inline">
              {isAr ? 'تطبيق على المحددين:' : 'Apply to selected:'}
            </span>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleApplyStatusToSelected('PRESENT')}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>✓</span>
              <span>{isAr ? 'حاضر' : 'Present'}</span>
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleApplyStatusToSelected('ON_SITE')}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>🏗️</span>
              <span>{isAr ? 'ميداني' : 'On-Site'}</span>
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleApplyStatusToSelected('LATE')}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>⏳</span>
              <span>{isAr ? 'متأخر' : 'Late'}</span>
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleApplyStatusToSelected('ON_LEAVE')}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>🏖️</span>
              <span>{isAr ? 'إجازة' : 'Leave'}</span>
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleApplyStatusToSelected('ABSENT')}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>✕</span>
              <span>{isAr ? 'غائب' : 'Absent'}</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              placeholder={isAr ? 'بحث بالاسم، الكود، الوظيفة...' : 'Search staff by name, code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-9 pe-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">{isAr ? 'القسم:' : 'Dept:'}</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
            >
              <option value="ALL">{isAr ? 'كافة التخصصات' : 'All Roles'}</option>
              <option value="MAINTENANCE_TECH">{isAr ? 'فنيو الصيانة' : 'Technicians'}</option>
              <option value="INSTALLATION_ENG">{isAr ? 'مهندسو التركيبات' : 'Engineers'}</option>
              <option value="SALES_REP">{isAr ? 'مناديب المبيعات' : 'Sales'}</option>
              <option value="WAREHOUSE_KEEPER">{isAr ? 'المستودع' : 'Warehouse'}</option>
              <option value="GENERAL_MGR">{isAr ? 'الإدارة' : 'Management'}</option>
            </select>
          </div>
        </div>

        {/* Main Employee Table */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <table className="w-full text-right text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                </th>
                <th className="p-2.5">{isAr ? 'الموظف والكود' : 'Employee & Code'}</th>
                <th className="p-2.5">{isAr ? 'الوظيفة والتصنيف' : 'Position'}</th>
                <th className="p-2.5">{isAr ? 'تاريخ التعيين والمباشرة' : 'Join Date'}</th>
                <th className="p-2.5">{isAr ? 'الراتب الشهري واليومي' : 'Salary / Daily'}</th>
                <th className="p-2.5 text-center">{isAr ? 'حالة الحضور ليوم' : 'Attendance Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedIds.includes(emp.id);
                const isEligible = isEmployeeEligibleOnDate(emp, attendanceDate);
                const draft = draftMap[emp.id] || { status: 'PRESENT' };
                const salary = emp.totalSalary || emp.basicSalary || 0;
                const dailyRate = Math.round((salary / 30) * 10) / 10;

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors ${
                      !isEligible
                        ? 'bg-slate-50/80 opacity-75'
                        : isSelected
                        ? 'bg-indigo-50/60'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(emp.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                    </td>

                    {/* Employee Info */}
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                            emp.avatarBg || 'bg-blue-600'
                          }`}
                        >
                          {emp.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate">{emp.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{emp.code}</span>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="font-medium text-slate-700 block truncate">{emp.position || emp.role}</span>
                      <span className="text-[10px] text-slate-400">{emp.phone}</span>
                    </td>

                    {/* Joining Date (Validation Target) */}
                    <td className="p-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <span className={!isEligible ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {emp.joinDate || '-'}
                        </span>
                      </div>
                      {!isEligible ? (
                        <span className="inline-block mt-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          ⚠️ {isAr ? 'لم يباشر بعد' : 'Not joined yet'}
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-700">
                          {isAr ? '✓ مؤهل للحضور' : 'Eligible'}
                        </span>
                      )}
                    </td>

                    {/* Salary & Daily Rate */}
                    <td className="p-2.5 whitespace-nowrap font-mono">
                      {salary > 0 ? (
                        <>
                          <div className="font-bold text-slate-800 text-[11px]">
                            {salary.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {dailyRate} {isAr ? 'ر.س/يوم' : 'SAR/day'}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400 text-[10px]">{isAr ? 'غير مسجل' : 'N/A'}</span>
                      )}
                    </td>

                    {/* Status Picker - Buttons */}
                    <td className="p-2.5 text-center">
                      {!isEligible ? (
                        <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                          {isAr ? `تاريخ الالتحاق (${emp.joinDate}) لاحق لتاريخ اليوم` : `Starts on ${emp.joinDate}`}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          {(['PRESENT', 'ON_SITE', 'LATE', 'ON_LEAVE', 'ABSENT'] as ManualAttendanceStatus[]).map((st) => {
                            const cfg = STATUS_CONFIG[st];
                            const isCurrent = draft.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleSetSingleStatus(emp.id, st)}
                                className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                  isCurrent
                                    ? `${cfg.badgeBg} shadow-xs scale-102`
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                                title={isAr ? cfg.labelAr : cfg.labelEn}
                              >
                                <span>{cfg.icon}</span>
                                <span className="ms-1 hidden sm:inline">{isAr ? cfg.labelAr : cfg.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with Final Save Action */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            {isAr ? (
              <span>
                سيتم حفظ واعتماد كشف الحضور ليوم <strong>{attendanceDate}</strong> لعدد{' '}
                <strong>{employees.length}</strong> موظف.
              </span>
            ) : (
              <span>
                Ready to commit attendance roster for <strong>{attendanceDate}</strong> across{' '}
                <strong>{employees.length}</strong> staff.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleFinalSave}
              className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتثبيت سجل الحضور لكافة الموظفين' : 'Save & Commit Daily Attendance'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
