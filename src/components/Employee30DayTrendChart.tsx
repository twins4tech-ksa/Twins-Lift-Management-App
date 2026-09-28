import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Calendar,
  Wrench,
  AlertTriangle,
  Target,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Employee, EmployeeRole, ROLE_CONFIGS } from '../types/employee';
import { MaintenanceContract, MaintenanceBreakdown } from '../types/maintenance';
import { ElevatorSpecification } from '../types/elevator';
import { SiteAttendanceRecord } from '../types/employee';
import {
  calculateEmployee30DayTrend,
  Employee30DaySummary,
  DailyKpiDataPoint,
} from '../utils/employee30DayTrend';

interface Props {
  employee?: Employee;
  employees?: Employee[];
  contracts?: MaintenanceContract[];
  breakdowns?: MaintenanceBreakdown[];
  projects?: ElevatorSpecification[];
  attendanceRecords?: SiteAttendanceRecord[];
  isAr?: boolean;
  onSelectEmployee?: (emp: Employee) => void;
  className?: string;
  compact?: boolean;
}

type MetricView = 'SCORE' | 'VISITS' | 'BREAKDOWNS' | 'COMBINED';

export const Employee30DayTrendChart: React.FC<Props> = ({
  employee,
  employees = [],
  contracts = [],
  breakdowns = [],
  projects = [],
  attendanceRecords = [],
  isAr = true,
  onSelectEmployee,
  className = '',
  compact = false,
}) => {
  // If no single employee passed, let user choose from employees list
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    employee?.id || employees[0]?.id || ''
  );
  const [metricView, setMetricView] = useState<MetricView>('SCORE');

  const activeEmployee = useMemo(() => {
    if (employee) return employee;
    return employees.find((e) => e.id === selectedEmpId) || employees[0];
  }, [employee, employees, selectedEmpId]);

  const summary: Employee30DaySummary | null = useMemo(() => {
    if (!activeEmployee) return null;
    return calculateEmployee30DayTrend(
      activeEmployee,
      contracts,
      breakdowns,
      projects,
      attendanceRecords
    );
  }, [activeEmployee, contracts, breakdowns, projects, attendanceRecords]);

  if (!activeEmployee || !summary) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
        {isAr ? 'لا تتوفر بيانات أداء لهذا الموظف' : 'No performance data available'}
      </div>
    );
  }

  const roleConfig = ROLE_CONFIGS[activeEmployee.role as EmployeeRole];
  const roleName = isAr ? roleConfig?.labelAr || activeEmployee.role : roleConfig?.labelEn || activeEmployee.role;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DailyKpiDataPoint = payload[0].payload;
      return (
        <div 
          className="bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1.5 backdrop-blur-md min-w-[210px]"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{data.fullDayName}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">{data.date}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'مؤشر الأداء اليومي:' : 'Daily Score:'}</span>
            </span>
            <span className={`font-mono font-black ${data.score >= 100 ? 'text-emerald-400' : 'text-blue-400'}`}>
              {data.score}%
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              <span>{isAr ? 'زيارات صيانة مكتملة:' : 'Maintenance Visits:'}</span>
            </span>
            <span className="font-mono font-bold text-blue-300">
              {data.completedVisits} <span className="text-[9px] text-slate-500">/ 12</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{isAr ? 'إصلاح أعطال طوارئ:' : 'Repairs Done:'}</span>
            </span>
            <span className="font-mono font-bold text-rose-300">
              {data.resolvedBreakdowns} <span className="text-[9px] text-slate-500">/ 5</span>
            </span>
          </div>

          {data.isWeekend && (
            <div className="pt-1 border-t border-slate-800 text-[10px] text-amber-400/90 font-medium">
              {isAr ? '• عطلة نهاية الأسبوع (مناوبة طوارئ)' : '• Weekend on-call shift'}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4 ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. Header with Employee Selector & View Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {isAr ? 'منحنى أداء وإنتاجية الموظف (آخر 30 يوماً)' : '30-Day Performance & Productivity Trend'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'تحليل الاتجاه الزمني ومستوى الاستقرار والإنتاجية اليومية للفنيين والمناديب'
                : 'Analyze time-series productivity patterns, consistency, and daily output'}
            </p>
          </div>
        </div>

        {/* Controls: Employee Selector (if multiple) & Metric View Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Employee dropdown if not fixed */}
          {!employee && employees.length > 1 && (
            <div className="min-w-[180px]">
              <select
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  const found = employees.find((emp) => emp.id === e.target.value);
                  if (found && onSelectEmployee) onSelectEmployee(found);
                }}
                className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({ROLE_CONFIGS[emp.role]?.labelAr || emp.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metric View Segmented Switcher */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMetricView('SCORE')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricView === 'SCORE'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الدرجة KPI (%)' : 'KPI Score (%)'}
            </button>
            <button
              type="button"
              onClick={() => setMetricView('VISITS')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricView === 'VISITS'
                  ? 'bg-white text-blue-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الصيانة (زيارة)' : 'Visits'}
            </button>
            <button
              type="button"
              onClick={() => setMetricView('BREAKDOWNS')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricView === 'BREAKDOWNS'
                  ? 'bg-white text-rose-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الأعطال (إصلاح)' : 'Repairs'}
            </button>
            <button
              type="button"
              onClick={() => setMetricView('COMBINED')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricView === 'COMBINED'
                  ? 'bg-white text-purple-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل معاً' : 'All Metrics'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards Strip (Last 30 Days Summary) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card 1: 30-Day Average Score */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1 font-bold">
            <span>{isAr ? 'متوسط أداء الـ 30 يوماً' : '30-Day Average Score'}</span>
            <Target className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {summary.averageScore}%
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
              summary.averageScore >= 100 
                ? 'bg-emerald-100 text-emerald-800' 
                : summary.averageScore >= 85 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              {summary.averageScore >= 100 ? (isAr ? 'متفوق' : 'Achiever') : (isAr ? 'جيد' : 'Good')}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isAr ? 'المستهدف الأساسي: 100%' : 'Base Target: 100%'}
          </div>
        </div>

        {/* Card 2: Peak Productivity */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1 font-bold">
            <span>{isAr ? 'ذروة الإنتاجية (أعلى يوم)' : 'Peak Output Day'}</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
              {summary.peakScore}%
            </span>
            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[90px]">
              {summary.peakDate}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isAr ? 'تحقيق إنجاز قياسي فائق' : 'Highest achievement day'}
          </div>
        </div>

        {/* Card 3: Consistency & Days Above Target */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1 font-bold">
            <span>{isAr ? 'معدل الاستقرار والالتزام' : 'Consistency Rate'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              {summary.consistencyRate}%
            </span>
            <span className="text-[10px] font-bold text-slate-600">
              ({summary.daysAboveTarget} {isAr ? 'يوم تفوق' : 'days >100%'})
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isAr ? 'نسبة أيام تحقيق > 80% من المستهدف' : 'Days achieving >80%'}
          </div>
        </div>

        {/* Card 4: Recent Trend Direction */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1 font-bold">
            <span>{isAr ? 'اتجاه الأداء الأخير' : 'Recent Trend'}</span>
            {summary.trendDirection === 'UP' ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : summary.trendDirection === 'DOWN' ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-blue-600" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-sm sm:text-base font-black ${
              summary.trendDirection === 'UP' 
                ? 'text-emerald-700' 
                : summary.trendDirection === 'DOWN' 
                ? 'text-rose-700' 
                : 'text-blue-700'
            }`}>
              {summary.trendDirection === 'UP'
                ? (isAr ? '↗ صاعد ومتنامي' : '↗ Improving')
                : summary.trendDirection === 'DOWN'
                ? (isAr ? '↘ يحتاج دعم ومتابعة' : '↘ Softening')
                : (isAr ? '→ أداء مستقر وثابت' : '→ Stable Output')}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isAr ? 'مقارنة آخر أسبوع بالأسبوع السابق' : 'Last 7 days vs previous 7'}
          </div>
        </div>
      </div>

      {/* 3. Recharts Line Chart Container */}
      <div className="w-full h-72 sm:h-80 pt-2 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={summary.dataPoints}
            margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
          >
            <defs>
              {/* Gradient for score area under line */}
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              interval="preserveStartEnd"
              minTickGap={20}
            />

            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              domain={
                metricView === 'SCORE'
                  ? [0, 'dataMax + 15']
                  : metricView === 'VISITS'
                  ? [0, 16]
                  : metricView === 'BREAKDOWNS'
                  ? [0, 8]
                  : [0, 'auto']
              }
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              align={isAr ? 'left' : 'right'}
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
            />

            {/* Target Benchmark Line at 100% (for SCORE view) */}
            {metricView === 'SCORE' && (
              <ReferenceLine
                y={100}
                stroke="#e11d48"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: isAr ? 'المستهدف 100%' : '100% Target',
                  fill: '#e11d48',
                  fontSize: 10,
                  position: isAr ? 'insideTopLeft' : 'insideTopRight',
                  fontWeight: 700,
                }}
              />
            )}

            {/* Target line for Visits (12) */}
            {metricView === 'VISITS' && (
              <ReferenceLine
                y={12}
                stroke="#0284c7"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: isAr ? 'مستهدف الصيانة (12 زيارة)' : 'Target 12 Visits',
                  fill: '#0284c7',
                  fontSize: 10,
                  position: 'insideTopLeft',
                  fontWeight: 700,
                }}
              />
            )}

            {/* Target line for Breakdowns (5) */}
            {metricView === 'BREAKDOWNS' && (
              <ReferenceLine
                y={5}
                stroke="#e11d48"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: isAr ? 'مستهدف الأعطال (5 إصلاحات)' : 'Target 5 Repairs',
                  fill: '#e11d48',
                  fontSize: 10,
                  position: 'insideTopLeft',
                  fontWeight: 700,
                }}
              />
            )}

            {/* Render Lines depending on selected Metric View */}
            {(metricView === 'SCORE' || metricView === 'COMBINED') && (
              <>
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="none"
                  fill="url(#scoreGradient)"
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  name={isAr ? 'نسبة الإنجاز KPI (%)' : 'KPI Score (%)'}
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#4f46e5', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </>
            )}

            {(metricView === 'VISITS' || metricView === 'COMBINED') && (
              <Line
                type="monotone"
                dataKey="completedVisits"
                name={isAr ? 'زيارات الصيانة اليومية' : 'Daily Visits'}
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ r: 2, fill: '#0284c7' }}
                activeDot={{ r: 5, fill: '#0284c7' }}
              />
            )}

            {(metricView === 'BREAKDOWNS' || metricView === 'COMBINED') && (
              <Line
                type="monotone"
                dataKey="resolvedBreakdowns"
                name={isAr ? 'إصلاح الأعطال' : 'Breakdown Repairs'}
                stroke="#e11d48"
                strokeWidth={2}
                dot={{ r: 2, fill: '#e11d48' }}
                activeDot={{ r: 5, fill: '#e11d48' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Footer Insights Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-600" />
          <span>
            {isAr
              ? `الموظف: ${activeEmployee.name} (${roleName}) • مجموع مهام 30 يوماً: ${summary.totalVisits30Days} زيارة صيانة و ${summary.totalBreakdowns30Days} عطل تم إصلاحه.`
              : `Staff: ${activeEmployee.name} (${roleName}) • 30-Day Totals: ${summary.totalVisits30Days} visits & ${summary.totalBreakdowns30Days} repairs.`}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-indigo-700">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
            <span>{isAr ? 'مؤشر الأداء اليومي' : 'Daily Score'}</span>
          </span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>{isAr ? 'زيارات دورية' : 'Visits'}</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <span>{isAr ? 'أعطال طارئة' : 'Breakdowns'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
