import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Users,
  Timer,
  Check,
  X,
  Plus,
  AlertCircle,
  Building2,
  DollarSign,
  Briefcase,
  Layers,
  Wrench,
  Award,
  Sparkles,
  FileCheck
} from 'lucide-react';
import {
  ElevatorSpecification,
  ProjectMilestoneKey,
  ProjectEmployeeLaborLog
} from '../types/elevator';
import { Employee } from '../types/employee';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';

export interface DailyProjectTimesheetEntryProps {
  spec: ElevatorSpecification;
  employees: Employee[];
  language?: 'ar' | 'en';
  initialMilestone?: ProjectMilestoneKey | 'General';
  onSaveLogs: (newLogs: ProjectEmployeeLaborLog[]) => void;
  onClose?: () => void;
  isModal?: boolean;
}

const COMMON_TASK_TAGS_AR = [
  'تركيب سكك الكابينة وثقل الموازنة',
  'تجميع وتثبيت هيكل الكابينة',
  'تركيب ماكينة الجر ومحرك PMSM',
  'تمديد كابلات البئر ولوحة الكنترول',
  'تركيب وضبط أبواب الطوابق والكابينة',
  'اختبارات السرعة وجهاز البراشوت',
  'تشغيل مبدئي واختبار الأحمال',
  'استلام الدفاع المدني والرخصة',
  'تعتيق وتفريغ الشحنة بالموقع',
  'فحص البئر ومطابقة المخططات CAD',
];

const COMMON_TASK_TAGS_EN = [
  'Guide Rails & Counterweight Installation',
  'Car Sling & Cabin Assembly',
  'PMSM Traction Machine Mounting',
  'Shaft Traveling Cables & Controller Wiring',
  'Landing & Car Doors Erection & Alignment',
  'Overspeed Governor & Safety Gear Testing',
  'Initial Commissioning & Full-Load Tests',
  'Civil Defense & Authority Handover',
  'Site Logistics & Materials Unloading',
  'Shaft Clearance Survey & CAD Compliance',
];

const OVERTIME_REASON_PRESETS_AR = [
  'استعجال تسليم المشروع للعميل',
  'تأخر الأعمال المدنية وتمديد الوردية',
  'فحص واختبارات السلامة والتشغيل المسائية',
  'أعمال طوارئ وصيانة حرجة بالموقع',
  'طلب مباشر من الاستشاري / المقاول',
  'تفريغ وتعتيق شحنة القطع والمعدات',
];

const OVERTIME_REASON_PRESETS_EN = [
  'Urgent client handover deadline',
  'Civil works delay & shift extension',
  'Evening commissioning & safety tests',
  'Critical site troubleshooting & emergency',
  'Direct consultant / contractor request',
  'Unloading & hoisting heavy equipment',
];

export const DailyProjectTimesheetEntry: React.FC<DailyProjectTimesheetEntryProps> = ({
  spec,
  employees,
  language = 'ar',
  initialMilestone = 'Installation',
  onSaveLogs,
  onClose,
  isModal = false,
}) => {
  const isAr = language === 'ar';

  // Entry Mode: Single Employee vs Crew (Multiple employees on same shift)
  const [entryMode, setEntryMode] = useState<'single' | 'crew'>('single');

  // Single Employee Selection
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    return employees.length > 0 ? employees[0].id : '';
  });

  // Crew Selection (Multiple Employee IDs)
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>(() => {
    return employees.slice(0, 2).map((e) => e.id);
  });

  // Date and Time state
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [breakMinutes, setBreakMinutes] = useState<number>(60);

  // Overtime state - Toggle & Reason
  const [isOvertime, setIsOvertime] = useState<boolean>(false);
  const [overtimeReason, setOvertimeReason] = useState<string>('');
  const [overtimeMultiplier, setOvertimeMultiplier] = useState<number>(1.5);
  const [customOvertimeHours, setCustomOvertimeHours] = useState<number | ''>('');

  // Milestone and Task description
  const [milestone, setMilestone] = useState<ProjectMilestoneKey | 'General'>(initialMilestone);
  const [workDescription, setWorkDescription] = useState<string>('');
  const [supervisorName, setSupervisorName] = useState<string>('');

  // Rate overrides
  const [customHourlyRate, setCustomHourlyRate] = useState<number>(0);
  const [monthlySalaryBasis, setMonthlySalaryBasis] = useState<number>(0);

  // Get default hourly rate for an employee
  const getDefaultRate = (emp: Employee): number => {
    if (emp.role === 'INSTALLATION_ENG' || emp.role === 'PROJECT_MANAGER') return 75;
    if (emp.role === 'MAINTENANCE_TECH') return 50;
    if (emp.role === 'SALES_REP') return 55;
    if (emp.role === 'WAREHOUSE_KEEPER') return 35;
    return 40;
  };

  // Selected single employee object
  const currentSingleEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Effective hourly rate for single mode
  const effectiveRateSingle = useMemo(() => {
    if (customHourlyRate > 0) return customHourlyRate;
    if (monthlySalaryBasis > 0) return Math.round((monthlySalaryBasis / 240) * 10) / 10;
    if (currentSingleEmployee) return getDefaultRate(currentSingleEmployee);
    return 45;
  }, [customHourlyRate, monthlySalaryBasis, currentSingleEmployee]);

  // Compute total net hours
  const timeBreakdown = useMemo(() => {
    if (!startTime || !endTime) {
      return { totalNetHours: 0, regularHours: 0, overtimeHours: 0 };
    }
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const netMinutes = Math.max(0, totalMinutes - breakMinutes);
    const totalNetHours = Math.round((netMinutes / 60) * 10) / 10;

    let regularHours = totalNetHours;
    let overtimeHours = 0;

    if (isOvertime) {
      if (typeof customOvertimeHours === 'number' && customOvertimeHours > 0) {
        overtimeHours = Math.min(totalNetHours, customOvertimeHours);
        regularHours = Math.max(0, Math.round((totalNetHours - overtimeHours) * 10) / 10);
      } else if (totalNetHours > 8) {
        regularHours = 8;
        overtimeHours = Math.round((totalNetHours - 8) * 10) / 10;
      } else {
        // Entire shift marked as dedicated overtime (e.g. emergency evening callout)
        regularHours = 0;
        overtimeHours = totalNetHours;
      }
    }

    return { totalNetHours, regularHours, overtimeHours };
  }, [startTime, endTime, breakMinutes, isOvertime, customOvertimeHours]);

  // Compute cost for single employee
  const singleCost = useMemo(() => {
    const regCost = timeBreakdown.regularHours * effectiveRateSingle;
    const otCost = timeBreakdown.overtimeHours * (effectiveRateSingle * overtimeMultiplier);
    return Math.round((regCost + otCost) * 100) / 100;
  }, [timeBreakdown, effectiveRateSingle, overtimeMultiplier]);

  // Compute total cost for crew mode
  const crewCostTotal = useMemo(() => {
    let sum = 0;
    selectedCrewIds.forEach((empId) => {
      const emp = employees.find((e) => e.id === empId);
      if (!emp) return;
      const rate = customHourlyRate > 0 ? customHourlyRate : getDefaultRate(emp);
      const reg = timeBreakdown.regularHours * rate;
      const ot = timeBreakdown.overtimeHours * (rate * overtimeMultiplier);
      sum += reg + ot;
    });
    return Math.round(sum * 100) / 100;
  }, [selectedCrewIds, employees, customHourlyRate, timeBreakdown, overtimeMultiplier]);

  // Quick Preset Handlers
  const applyPreset = (preset: 'full' | 'half' | 'overtime' | 'emergency') => {
    if (preset === 'full') {
      setStartTime('08:00');
      setEndTime('17:00');
      setBreakMinutes(60);
      setIsOvertime(false);
      setCustomOvertimeHours('');
    } else if (preset === 'half') {
      setStartTime('08:00');
      setEndTime('12:00');
      setBreakMinutes(0);
      setIsOvertime(false);
      setCustomOvertimeHours('');
    } else if (preset === 'overtime') {
      setStartTime('08:00');
      setEndTime('19:00');
      setBreakMinutes(60);
      setIsOvertime(true);
      setCustomOvertimeHours(2);
      if (!overtimeReason) {
        setOvertimeReason(isAr ? 'تمديد وردية لاستعجال تسليم المشروع للعميل' : 'Shift extension for urgent client delivery');
      }
    } else if (preset === 'emergency') {
      setStartTime('17:00');
      setEndTime('21:00');
      setBreakMinutes(0);
      setIsOvertime(true);
      setCustomOvertimeHours(4);
      if (!overtimeReason) {
        setOvertimeReason(isAr ? 'أعمال طوارئ وتدخل ميداني مسائي عاجل' : 'Emergency & urgent evening site intervention');
      }
    }
  };

  // Toggle crew member selection
  const toggleCrewMember = (empId: string) => {
    setSelectedCrewIds((prev) => {
      if (prev.includes(empId)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((id) => id !== empId);
      } else {
        return [...prev, empId];
      }
    });
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const desc = workDescription.trim() || (isAr ? 'أعمال تركيب وتشغيل ميدانية للمشروع' : 'Site installation & testing tasks');
    const createdLogs: ProjectEmployeeLaborLog[] = [];
    const nowIso = new Date().toISOString();

    if (entryMode === 'single') {
      if (!currentSingleEmployee) return;
      createdLogs.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        projectId: spec.id,
        projectName: spec.projectName,
        employeeId: currentSingleEmployee.id,
        employeeName: currentSingleEmployee.name,
        employeeRole: currentSingleEmployee.position || currentSingleEmployee.role,
        date: logDate,
        startTime,
        endTime,
        breakMinutes,
        hoursWorked: timeBreakdown.totalNetHours,
        regularHours: timeBreakdown.regularHours,
        overtimeHours: timeBreakdown.overtimeHours,
        isOvertime,
        overtimeReason: isOvertime ? (overtimeReason.trim() || (isAr ? 'ساعات عمل إضافية معتمدة' : 'Approved overtime hours')) : undefined,
        hourlyRate: effectiveRateSingle,
        overtimeMultiplier,
        monthlySalarySar: monthlySalaryBasis > 0 ? monthlySalaryBasis : undefined,
        totalCost: singleCost,
        milestone,
        workDescription: desc,
        supervisorName: supervisorName.trim() || undefined,
        status: 'Approved',
        loggedAt: nowIso,
      });
    } else {
      // Crew mode
      selectedCrewIds.forEach((empId) => {
        const emp = employees.find((e) => e.id === empId);
        if (!emp) return;
        const rate = customHourlyRate > 0 ? customHourlyRate : getDefaultRate(emp);
        const regCost = timeBreakdown.regularHours * rate;
        const otCost = timeBreakdown.overtimeHours * (rate * overtimeMultiplier);
        const total = Math.round((regCost + otCost) * 100) / 100;

        createdLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          projectId: spec.id,
          projectName: spec.projectName,
          employeeId: emp.id,
          employeeName: emp.name,
          employeeRole: emp.position || emp.role,
          date: logDate,
          startTime,
          endTime,
          breakMinutes,
          hoursWorked: timeBreakdown.totalNetHours,
          regularHours: timeBreakdown.regularHours,
          overtimeHours: timeBreakdown.overtimeHours,
          isOvertime,
          overtimeReason: isOvertime ? (overtimeReason.trim() || (isAr ? 'ساعات عمل إضافية معتمدة' : 'Approved overtime hours')) : undefined,
          hourlyRate: rate,
          overtimeMultiplier,
          totalCost: total,
          milestone,
          workDescription: desc,
          supervisorName: supervisorName.trim() || undefined,
          status: 'Approved',
          loggedAt: nowIso,
        });
      });
    }

    if (createdLogs.length > 0) {
      onSaveLogs(createdLogs);
    }
  };

  const currentProjectLaborCost = spec.totalLaborCost || 0;
  const addedCost = entryMode === 'single' ? singleCost : crewCostTotal;
  const projectNewLaborCost = currentProjectLaborCost + addedCost;
  const projectPrice = spec.totalQuotationPrice || 1;
  const laborCostPercent = Math.round((projectNewLaborCost / projectPrice) * 1000) / 10;

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Info */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-4 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مركز تكلفة المشروع / يوميات العمل' : 'Project Labor Cost Center / Timesheet'}</span>
            </span>
            <h3 className="text-sm sm:text-base font-extrabold mt-0.5 text-white">
              {spec.projectName || spec.quoteRef || (isAr ? 'مشروع المصعد' : 'Elevator Project')}
            </h3>
            <span className="text-[11px] text-blue-200">
              {spec.clientName} &bull; {spec.quoteRef}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/15 self-start sm:self-auto">
            <span className="text-[11px] text-indigo-200 font-medium">{isAr ? 'نمط التسجيل:' : 'Mode:'}</span>
            <div className="flex bg-black/20 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setEntryMode('single')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  entryMode === 'single' ? 'bg-indigo-600 text-white shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                {isAr ? 'موظف فردي' : 'Single Tech'}
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('crew')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  entryMode === 'crew' ? 'bg-indigo-600 text-white shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                {isAr ? 'طاقم عمل جماعي' : 'Crew / Team'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mode-Specific Employee Selector */}
      {entryMode === 'single' ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            {isAr ? 'اختر الموظف / الفني المكلف *' : 'Select Assigned Employee / Technician *'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                setCustomHourlyRate(0);
                setMonthlySalaryBasis(0);
              }}
              className="w-full text-xs font-medium px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.code}) &bull; {emp.position || emp.role}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">{isAr ? 'معدل الأجر الأساسي:' : 'Base Hourly Rate:'}</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">
                {effectiveRateSingle} {isAr ? 'ر.س/ساعة' : 'SAR/hr'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'حدد طاقم العمل الميداني المسجل لليومية:' : 'Select Crew Members on Site:'}</span>
            </label>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {selectedCrewIds.length} {isAr ? 'موظفين محددين' : 'selected'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 max-h-36 overflow-y-auto">
            {employees.map((emp) => {
              const isSelected = selectedCrewIds.includes(emp.id);
              return (
                <button
                  type="button"
                  key={emp.id}
                  onClick={() => toggleCrewMember(emp.id)}
                  className={`p-2 rounded-lg border text-right transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="truncate block text-[11px]">{emp.name}</span>
                  <span className={`text-[10px] truncate block ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {emp.position || emp.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Date, Presets & Shift Times */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
        {/* Preset Shift Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-500">
            {isAr ? 'قوالب الدوام السريعة:' : 'Quick Shift Presets:'}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => applyPreset('full')}
              className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors"
            >
              ☀️ {isAr ? 'دوام كامل (8 س)' : 'Full Day (8h)'}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('half')}
              className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors"
            >
              🌤️ {isAr ? 'نصف يوم (4 س)' : 'Half Day (4h)'}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('overtime')}
              className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors"
            >
              ⏱️ {isAr ? 'دوام + ساعتين إضافي (10 س)' : '8h + 2h OT'}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('emergency')}
              className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition-colors"
            >
              🚨 {isAr ? 'طوارئ مسائية (4 س)' : 'Emergency'}
            </button>
          </div>
        </div>

        {/* Date, Start, End, Break */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'تاريخ يوم العمل *' : 'Work Date *'}</span>
            </label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full font-mono px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'وقت البدء (Start) *' : 'Start Time *'}</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full font-mono px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'وقت الانتهاء (End) *' : 'End Time *'}</span>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full font-mono px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isAr ? 'خصم الاستراحة (دقائق)' : 'Break Deduction (mins)'}
            </label>
            <div className="flex gap-1">
              {[0, 30, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBreakMinutes(m)}
                  className={`flex-1 py-2 font-bold rounded-lg border transition-colors ${
                    breakMinutes === m
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m} {isAr ? 'د' : 'm'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overtime Toggle & Overtime Reason Details */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isOvertime 
            ? 'bg-amber-50/80 border-amber-300 shadow-2xs' 
            : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Overtime Toggle */}
            <div className="flex items-center gap-2.5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-is-overtime"
                  checked={isOvertime}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsOvertime(checked);
                    if (checked && !overtimeReason) {
                      setOvertimeReason(isAr ? 'استعجال تسليم المشروع للعميل' : 'Urgent client handover deadline');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
              <div>
                <label htmlFor="toggle-is-overtime" className="font-bold text-xs text-slate-900 cursor-pointer flex items-center gap-1.5">
                  <Clock className={`w-4 h-4 ${isOvertime ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{isAr ? 'احتساب عمل إضافي (Overtime Toggle)' : 'Overtime Hours Toggle'}</span>
                  {isOvertime && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold">
                      {isAr ? 'مفعل' : 'Active'}
                    </span>
                  )}
                </label>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isAr 
                    ? 'تفعيل الساعات الإضافية لتسجيل وتوثيق مبرر العمل الإضافي واحتساب الأجر بمعامل الإضافي' 
                    : 'Enable extra hours calculation with mandatory overtime reason and rate multiplier'}
                </p>
              </div>
            </div>

            {/* Overtime Multiplier */}
            {isOvertime && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
                <span className="text-[11px] text-amber-900 font-bold">
                  {isAr ? 'معامل الأجر الإضافي:' : 'OT Multiplier:'}
                </span>
                <select
                  value={overtimeMultiplier}
                  onChange={(e) => setOvertimeMultiplier(parseFloat(e.target.value))}
                  className="bg-amber-50 px-2 py-0.5 rounded border border-amber-300 text-xs font-black text-amber-950 focus:outline-hidden"
                >
                  <option value={1.5}>1.5× {isAr ? '(نظام العمل القياسي)' : '(1.5x Standard)'}</option>
                  <option value={1.25}>1.25× {isAr ? '(مخفف)' : '(1.25x)'}</option>
                  <option value={2.0}>2.0× {isAr ? '(عطلات ومناسبات)' : '(2.0x Holidays)'}</option>
                </select>
              </div>
            )}
          </div>

          {/* Overtime Reason Field (Mandatory / Detailed when Overtime is Enabled) */}
          {isOvertime && (
            <div className="pt-2.5 border-t border-amber-200/80 space-y-2 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAr ? 'سبب ومبرر الساعات الإضافية (Overtime Reason) *' : 'Overtime Reason & Justification *'}</span>
                </label>
                <span className="text-[10px] text-amber-800 font-medium">
                  {isAr ? 'مطلوب لاعتماد تكلفة الأجور الإضافية' : 'Required for cost center audit'}
                </span>
              </div>

              <input
                type="text"
                required={isOvertime}
                value={overtimeReason}
                onChange={(e) => setOvertimeReason(e.target.value)}
                placeholder={isAr ? 'مثال: استعجال تسليم المشروع للعميل أو تأخر الأعمال المدنية...' : 'e.g. Urgent client handover deadline or civil works delay...'}
                className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />

              {/* Fast Overtime Reason Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-amber-900/80 font-bold">
                  {isAr ? 'أسباب شائعة سريعة:' : 'Quick Presets:'}
                </span>
                {(isAr ? OVERTIME_REASON_PRESETS_AR : OVERTIME_REASON_PRESETS_EN).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setOvertimeReason(reason)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      overtimeReason === reason
                        ? 'bg-amber-600 text-white border-amber-700 font-bold shadow-2xs'
                        : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                    }`}
                  >
                    + {reason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time & Overtime Visual readout */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] pt-2 border-t border-slate-200/60 text-slate-700">
            <div className="flex items-center gap-3">
              <span>
                {isAr ? 'صافي وقت العمل:' : 'Net Hours:'}{' '}
                <strong className="text-sm font-black text-slate-900">{timeBreakdown.totalNetHours} {isAr ? 'ساعة' : 'hrs'}</strong>
              </span>
              <span>
                ({timeBreakdown.regularHours} {isAr ? 'ساعات أساسية' : 'reg'} +{' '}
                <span className={timeBreakdown.overtimeHours > 0 ? 'font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded' : ''}>
                  {timeBreakdown.overtimeHours} {isAr ? 'ساعات إضافية' : 'OT'}
                </span>)
              </span>
            </div>

            <div className="font-bold text-emerald-800 text-xs flex items-center gap-1">
              <span>{isAr ? 'إجمالي الأجر المحمل:' : 'Charged Total:'}</span>
              <span className="font-mono text-sm font-black text-emerald-700">
                {(entryMode === 'single' ? singleCost : crewCostTotal).toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone, Task & Description */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isAr ? 'المرحلة الميدانية المسندة للمشروع *' : 'Assigned Project Milestone *'}
            </label>
            <select
              value={milestone}
              onChange={(e) => setMilestone(e.target.value as any)}
              className="w-full text-xs font-bold px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            >
              <option value="Engineering">{isAr ? '1. الاعتماد الهندسي والتصميم (Engineering)' : '1. Engineering & CAD'}</option>
              <option value="Manufacturing">{isAr ? '2. التصنيع والتجهيز بالمصنع (Manufacturing)' : '2. Manufacturing'}</option>
              <option value="Shipping">{isAr ? '3. الشحن والتوريد والتعتيق (Shipping & Logistics)' : '3. Shipping & Site Staging'}</option>
              <option value="Installation">{isAr ? '4. التركيب الميداني والتشغيل (Installation)' : '4. Installation & Commissioning'}</option>
              <option value="General">{isAr ? 'أعمال عامة وإشرافية (General Tasks)' : 'General Site Oversight'}</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isAr ? 'اسم المهندس المشرف / معتمد اليومية' : 'Supervisor / Site Engineer'}
            </label>
            <input
              type="text"
              placeholder={isAr ? 'مثال: م. خالد العتيبي' : 'e.g. Eng. Khalid'}
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden placeholder-slate-400"
            />
          </div>
        </div>

        {/* Task Tag Presets */}
        <div>
          <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
            {isAr ? 'انقر لإدراج المهمة المنجزة تلقائياً:' : 'Click to quickly insert task description:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(isAr ? COMMON_TASK_TAGS_AR : COMMON_TASK_TAGS_EN).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setWorkDescription((prev) => (prev ? `${prev} + ${tag}` : tag))}
                className="px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Work Description Input */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {isAr ? 'تفاصيل وبيان الأعمال الميدانية المنجزة *' : 'Detailed Work Description & Tasks *'}
          </label>
          <textarea
            rows={2}
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            placeholder={
              isAr
                ? 'اكتب تفاصيل ما تم تنفيذه في الموقع، أرقام الطوابق، وأي ملاحظات فنية...'
                : 'Write details of tasks performed on site, floor levels, and technical observations...'
            }
            className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden placeholder-slate-400"
            required
          />
        </div>
      </div>

      {/* Project Cost Center Live Impact Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'الأثر المالي على مركز تكلفة المشروع' : 'Project Cost Center Live Impact'}</span>
          </span>
          <div className="text-xs text-slate-700">
            {isAr ? 'تكلفة الأجور الحالية بالمشروع: ' : 'Current Labor Cost: '}
            <strong className="font-mono text-slate-900">{currentProjectLaborCost.toLocaleString()} ر.س</strong>
            {' → '}
            {isAr ? 'ستصبح بعد الحفظ: ' : 'Becomes: '}
            <strong className="font-mono text-emerald-800 text-sm">{projectNewLaborCost.toLocaleString()} ر.س</strong>
          </div>
          <div className="text-[10px] text-slate-500">
            {isAr
              ? `تمثل تكلفة الأجور ${laborCostPercent}% من إجمالي قيمة عقد المشروع (${spec.totalQuotationPrice.toLocaleString()} ر.س)`
              : `Labor represents ${laborCostPercent}% of total contract price (${spec.totalQuotationPrice.toLocaleString()} SAR)`}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          )}

          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              {entryMode === 'single'
                ? isAr ? 'حفظ اليومية بمركز التكلفة' : 'Save Timesheet Entry'
                : isAr ? `حفظ يوميات الطاقم (${selectedCrewIds.length})` : `Save Crew Shift (${selectedCrewIds.length})`}
            </span>
          </button>
        </div>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold">
                {isAr ? 'تسجيل يومية عمل موظف بمركز تكلفة المشروع' : 'Log Project Daily Timesheet'}
              </h2>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="p-4 sm:p-5 overflow-y-auto flex-1">{content}</div>
        </div>
      </div>
    );
  }

  return content;
};
