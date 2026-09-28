import React, { useState, useMemo } from 'react';
import { 
  ElevatorSpecification, 
  ElevatorType, 
  ProjectStatus 
} from '../types/elevator';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  ComposedChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Award, 
  Layers, 
  Filter, 
  Calendar, 
  BarChart3, 
  ArrowUpRight, 
  BadgeCheck, 
  Briefcase, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';
import { SearchableSelect } from './SearchableSelect';

interface Props {
  projects: ElevatorSpecification[];
  language?: 'ar' | 'en';
  onSelectProject?: (project: ElevatorSpecification) => void;
  onNavigateToDrawings?: (project: ElevatorSpecification) => void;
  onNavigateToPrint?: (project: ElevatorSpecification) => void;
}

// Status colors matching application theme
const STATUS_COLORS: Record<ProjectStatus, string> = {
  Won: '#10b981',       // Emerald
  Installed: '#0d9488', // Teal
  Approved: '#2563eb',  // Blue
  Sent: '#6366f1',      // Indigo
  Draft: '#f59e0b',     // Amber
  Lost: '#ef4444',      // Rose
};

const ELEVATOR_TYPE_LABELS: Record<ElevatorType, { ar: string; en: string }> = {
  MRL_TRACTION: { ar: 'MRL بدون غرفة محرك', en: 'MRL Traction' },
  GEARED_TRACTION: { ar: 'Geared بتروس', en: 'Geared Traction' },
  HYDRAULIC: { ar: 'هيدروليك', en: 'Hydraulic' },
  PANORAMIC_GLASS: { ar: 'زجاج بانورامي', en: 'Panoramic Glass' },
  FREIGHT_HEAVY: { ar: 'بضائع وأحمال ثقيلة', en: 'Freight Heavy' },
};

export const SalesAnalyticsDashboard: React.FC<Props> = ({
  projects,
  language = 'ar',
  onSelectProject,
  onNavigateToDrawings,
  onNavigateToPrint,
}) => {
  const isAr = language === 'ar';

  // Filters state
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [projectRankingLimit, setProjectRankingLimit] = useState<number>(8);
  const [activeMetricTab, setActiveMetricTab] = useState<'REVENUE' | 'MARGIN' | 'COMBINED'>('COMBINED');

  // Filtered dataset based on user controls
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const typeMatch = selectedType === 'ALL' || p.elevatorType === selectedType;
      const statusMatch =
        statusFilter === 'ALL' ||
        (statusFilter === 'WON_ONLY' ? (p.status === 'Won' || p.status === 'Installed') : p.status === statusFilter);
      return typeMatch && statusMatch;
    });
  }, [projects, selectedType, statusFilter]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const totalQuotedValue = filteredProjects.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
    const wonProjects = filteredProjects.filter((p) => p.status === 'Won' || p.status === 'Installed');
    const totalWonRevenue = wonProjects.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
    const winRate = totalProjects > 0 ? Math.round((wonProjects.length / totalProjects) * 100) : 0;

    let totalMargin = 0;
    let marginCount = 0;
    filteredProjects.forEach((p) => {
      if (p.grossMarginPercent > 0) {
        totalMargin += p.grossMarginPercent;
        marginCount++;
      }
    });
    const avgMargin = marginCount > 0 ? (totalMargin / marginCount).toFixed(1) : '0.0';

    // Top revenue project
    const topRevenueProj = [...filteredProjects].sort(
      (a, b) => (b.totalQuotationPrice || 0) - (a.totalQuotationPrice || 0)
    )[0];

    // Top margin project
    const topMarginProj = [...filteredProjects].sort(
      (a, b) => (b.grossMarginPercent || 0) - (a.grossMarginPercent || 0)
    )[0];

    return {
      totalProjects,
      totalQuotedValue,
      wonCount: wonProjects.length,
      totalWonRevenue,
      winRate,
      avgMargin,
      topRevenueProj,
      topMarginProj,
    };
  }, [filteredProjects]);

  // 1. Monthly Sales Performance Data Aggregator
  const monthlySalesData = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        monthKey: string;
        label: string;
        quotedRevenue: number;
        wonRevenue: number;
        dealCount: number;
        wonCount: number;
        margins: number[];
        timestamp: number;
      }
    >();

    filteredProjects.forEach((p) => {
      if (!p.date) return;
      const date = new Date(p.date);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      const monthName = date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        month: 'short',
        year: '2-digit',
      });

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          monthKey,
          label: monthName,
          quotedRevenue: 0,
          wonRevenue: 0,
          dealCount: 0,
          wonCount: 0,
          margins: [],
          timestamp: new Date(year, month, 1).getTime(),
        });
      }

      const item = monthMap.get(monthKey)!;
      item.dealCount += 1;
      item.quotedRevenue += p.totalQuotationPrice || 0;

      if (p.status === 'Won' || p.status === 'Installed') {
        item.wonRevenue += p.totalQuotationPrice || 0;
        item.wonCount += 1;
      }

      if (p.grossMarginPercent > 0) {
        item.margins.push(p.grossMarginPercent);
      }
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((item) => {
        const avgMargin =
          item.margins.length > 0
            ? Math.round((item.margins.reduce((a, b) => a + b, 0) / item.margins.length) * 10) / 10
            : 0;

        return {
          monthKey: item.monthKey,
          month: item.label,
          quotedRevenue: Math.round(item.quotedRevenue),
          wonRevenue: Math.round(item.wonRevenue),
          deals: item.dealCount,
          wonDeals: item.wonCount,
          avgMargin,
        };
      });
  }, [filteredProjects, isAr]);

  // 2. Total Revenue per Project Ranking Data
  const revenuePerProjectData = useMemo(() => {
    return [...filteredProjects]
      .sort((a, b) => (b.totalQuotationPrice || 0) - (a.totalQuotationPrice || 0))
      .slice(0, projectRankingLimit)
      .map((p) => {
        // Shorten long name for chart label
        const shortName =
          p.projectName.length > 22
            ? p.projectName.substring(0, 20) + '...'
            : p.projectName;

        return {
          id: p.id,
          name: shortName,
          fullName: p.projectName,
          client: p.clientName,
          quoteRef: p.quoteRef,
          revenue: p.totalQuotationPrice || 0,
          margin: p.grossMarginPercent || 0,
          status: p.status,
          type: p.elevatorType,
          spec: p,
        };
      });
  }, [filteredProjects, projectRankingLimit]);

  // 3. Margin Trends Data (Chronological progression by date)
  const marginTrendsData = useMemo(() => {
    const valid = filteredProjects
      .filter((p) => p.date && p.grossMarginPercent > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningSum = 0;
    return valid.map((p, idx) => {
      runningSum += p.grossMarginPercent;
      const runningAvg = Math.round((runningSum / (idx + 1)) * 10) / 10;
      const d = new Date(p.date);
      const dateStr = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        month: 'numeric',
        day: 'numeric',
      });

      return {
        id: p.id,
        date: dateStr,
        fullDate: p.date,
        project: p.projectName,
        client: p.clientName,
        margin: p.grossMarginPercent,
        runningAvg,
        price: p.totalQuotationPrice,
        profit: p.grossProfit,
        status: p.status,
      };
    });
  }, [filteredProjects, isAr]);

  // 4. Breakdown by Elevator Type (Revenue & Average Margin)
  const elevatorTypeBreakdown = useMemo(() => {
    const map = new Map<ElevatorType, { count: number; totalRevenue: number; margins: number[] }>();

    filteredProjects.forEach((p) => {
      const type = p.elevatorType;
      if (!map.has(type)) {
        map.set(type, { count: 0, totalRevenue: 0, margins: [] });
      }
      const item = map.get(type)!;
      item.count += 1;
      item.totalRevenue += p.totalQuotationPrice || 0;
      if (p.grossMarginPercent > 0) {
        item.margins.push(p.grossMarginPercent);
      }
    });

    return Array.from(map.entries()).map(([type, data]) => {
      const avgMargin =
        data.margins.length > 0
          ? Math.round((data.margins.reduce((a, b) => a + b, 0) / data.margins.length) * 10) / 10
          : 0;

      const label = ELEVATOR_TYPE_LABELS[type]?.[isAr ? 'ar' : 'en'] || type;

      return {
        type,
        label,
        count: data.count,
        totalRevenue: Math.round(data.totalRevenue),
        avgMargin,
      };
    });
  }, [filteredProjects, isAr]);

  // Formatter for SAR Currency inside Chart Tooltips & Axes
  const formatCurrencyK = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M SAR`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}k SAR`;
    }
    return `${value} SAR`;
  };

  return (
    <div id="historical-sales-analytics-tab" className="space-y-6">
      {/* Top Filter & Controls Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>{isAr ? 'لوحة تحليلات المبيعات وهوامش الربحية' : 'Sales Performance & Margin Analytics'}</span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {filteredProjects.length} {isAr ? 'مشروع محلل' : 'projects analyzed'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'رسوم بيانية تفاعلية مدعومة بـ Recharts توضح الأداء الشهري، إيرادات المشاريع، واتجاهات الهامش الربحي.'
                : 'Recharts-powered interactive analytics for monthly sales trends, project revenue distribution, and profit margins.'}
            </p>
          </div>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Elevator Type Selector */}
          <div className="min-w-[160px]">
            <SearchableSelect
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-semibold"
            >
              <option value="ALL">{isAr ? 'كافة أنواع المصاعد' : 'All Elevator Types'}</option>
              <option value="MRL_TRACTION">MRL بدون غرفة</option>
              <option value="GEARED_TRACTION">Geared بتروس</option>
              <option value="PANORAMIC_GLASS">بانورامي زجاج</option>
              <option value="HYDRAULIC">هيدروليك</option>
              <option value="FREIGHT_HEAVY">بضائع وأحمال</option>
            </SearchableSelect>
          </div>

          {/* Status Filter */}
          <div className="min-w-[170px]">
            <SearchableSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-semibold"
            >
              <option value="ALL">{isAr ? 'كافة حالات المشاريع' : 'All Project Statuses'}</option>
              <option value="WON_ONLY">{isAr ? 'العقود المعتمدة والفائزة فقط (Won + Installed)' : 'Won & Installed Only'}</option>
              <option value="Approved">{isAr ? 'المعتمدة فقط (Approved)' : 'Approved Only'}</option>
              <option value="Draft">{isAr ? 'المسودات (Draft)' : 'Draft Only'}</option>
            </SearchableSelect>
          </div>

          {/* Ranking Limit Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px] font-bold">
            <span className="text-slate-500 px-1">{isAr ? 'الترتيب:' : 'Top:'}</span>
            <button
              type="button"
              onClick={() => setProjectRankingLimit(5)}
              className={`px-2 py-0.5 rounded transition-colors ${projectRankingLimit === 5 ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              5
            </button>
            <button
              type="button"
              onClick={() => setProjectRankingLimit(8)}
              className={`px-2 py-0.5 rounded transition-colors ${projectRankingLimit === 8 ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              8
            </button>
            <button
              type="button"
              onClick={() => setProjectRankingLimit(15)}
              className={`px-2 py-0.5 rounded transition-colors ${projectRankingLimit === 15 ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              15
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline Quoted */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'إجمالي قيمة العروض المقدمة' : 'Total Quoted Pipeline'}
            </div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              <SarPrice amount={kpis.totalQuotedValue} />
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              <span>{kpis.totalProjects} {isAr ? 'عروض ومشاريع' : 'active projects'}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <SaudiRiyalSymbol className="w-6 h-6" />
          </div>
        </div>

        {/* Won Contracts Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/40">
          <div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              {isAr ? 'إيرادات العقود المعتمدة (Won)' : 'Awarded Contracts Revenue'}
            </div>
            <div className="text-xl font-black text-emerald-600 font-mono mt-1">
              <SarPrice amount={kpis.totalWonRevenue} />
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>{kpis.wonCount} {isAr ? 'عقد موقّع' : 'signed contracts'} ({kpis.winRate}% {isAr ? 'معدل الفوز' : 'win rate'})</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Average Gross Margin */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'متوسط هامش الربح الإجمالي' : 'Average Gross Margin'}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
              <span>{kpis.avgMargin}%</span>
              <span className="text-xs font-semibold text-emerald-600 font-sans">
                {parseFloat(kpis.avgMargin) >= 20 ? (isAr ? '✓ ضمن المستهدف' : '✓ Target Met') : ''}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'المستهدف الإداري: 20% فأعلى' : 'Target: 20%+ target'}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        {/* Top Performing Project */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="overflow-hidden">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'أعلى مشروع من حيث القيمة' : 'Top Revenue Project'}
            </div>
            <div className="text-base font-black text-slate-900 truncate mt-1" title={kpis.topRevenueProj?.projectName}>
              {kpis.topRevenueProj?.projectName || '—'}
            </div>
            <div className="text-xs font-bold text-blue-700 font-mono mt-0.5">
              {kpis.topRevenueProj ? <SarPrice amount={kpis.topRevenueProj.totalQuotationPrice} /> : '—'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CHART 1: MONTHLY SALES PERFORMANCE (Recharts Composed / Bar Chart)       */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'الأداء الشهري للمبيعات والإيرادات التعاقدية' : 'Monthly Sales Performance & Revenue Realization'}</span>
            </h4>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'مقارنة بين إجمالي قيمة العروض المقدمة شهرياً مقابل العقود الفائزة المعتمدة مع حجم الصفقات.'
                : 'Comparison of monthly total quoted value vs. won/awarded contracts with deal volume count.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-600" />
              <span className="text-slate-600 font-medium">{isAr ? 'العروض المقدمة (Quoted)' : 'Quoted Pipeline'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-slate-600 font-medium">{isAr ? 'العقود المعتمدة (Won)' : 'Won Revenue'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-500" />
              <span className="text-slate-600 font-medium">{isAr ? 'عدد الصفقات' : 'Deals Count'}</span>
            </div>
          </div>
        </div>

        {monthlySalesData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            {isAr ? 'لا توجد بيانات مشاريع كافية لرسم المنحنى الشهري' : 'No project data available for monthly chart'}
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlySalesData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tickFormatter={formatCurrencyK}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#f59e0b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5">
                        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                          <span>{label}</span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-mono">
                            {data.deals} {isAr ? 'صفقات' : 'deals'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-blue-300">
                          <span>{isAr ? 'إجمالي العروض:' : 'Total Quoted:'}</span>
                          <span className="font-mono font-bold">
                            {data.quotedRevenue.toLocaleString()} SAR
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-emerald-300">
                          <span>{isAr ? 'العقود المعتمدة (Won):' : 'Won Revenue:'}</span>
                          <span className="font-mono font-bold">
                            {data.wonRevenue.toLocaleString()} SAR
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-purple-300 pt-1 border-t border-slate-800 text-[11px]">
                          <span>{isAr ? 'متوسط الهامش:' : 'Avg Margin:'}</span>
                          <span className="font-mono font-bold">{data.avgMargin}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="quotedRevenue" 
                  name={isAr ? 'العروض المقدمة' : 'Quoted Revenue'} 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={38}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="wonRevenue" 
                  name={isAr ? 'العقود المعتمدة' : 'Won Revenue'} 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={38}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="deals" 
                  name={isAr ? 'عدد الصفقات' : 'Deals Count'} 
                  stroke="#f59e0b" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN GRID: TOTAL REVENUE PER PROJECT & MARGIN TRENDS                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 2: TOTAL REVENUE PER PROJECT (Horizontal / Vertical Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? `إجمالي الإيرادات لكل مشروع (أعلى ${revenuePerProjectData.length})` : `Total Revenue per Project (Top ${revenuePerProjectData.length})`}</span>
                </h4>
                <p className="text-xs text-slate-500">
                  {isAr ? 'ترتيب المشاريع حسب القيمة الإجمالية مع تلوين حالة التعاقد.' : 'Project ranking by quotation price with status badge coloring.'}
                </p>
              </div>

              <div className="text-[11px] font-mono text-slate-500">
                SAR
              </div>
            </div>

            {revenuePerProjectData.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                {isAr ? 'لا توجد مشاريع مطابقة للفلتر المحدد' : 'No projects match the selected criteria'}
              </div>
            ) : (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenuePerProjectData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis 
                      type="number" 
                      tickFormatter={formatCurrencyK} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 10, fill: '#334155' }} 
                      width={100}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                            <div className="font-bold text-white text-xs">{d.fullName}</div>
                            <div className="text-slate-400 text-[11px]">
                              {d.client} &bull; {d.quoteRef}
                            </div>
                            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-3 font-mono font-bold text-emerald-400">
                              <span>{isAr ? 'القيمة:' : 'Revenue:'}</span>
                              <span>{d.revenue.toLocaleString()} SAR</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-[11px] text-purple-300">
                              <span>{isAr ? 'هامش الربح:' : 'Gross Margin:'}</span>
                              <span>{d.margin}%</span>
                            </div>
                            <div className="text-[10px] text-slate-400 pt-1">
                              {isAr ? 'الحالة:' : 'Status:'} <span className="font-semibold text-white">{d.status}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {revenuePerProjectData.map((entry) => (
                        <Cell key={`cell-${entry.id}`} fill={STATUS_COLORS[entry.status] || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-[10px] text-slate-600">
            <span className="font-bold text-slate-700">{isAr ? 'حالات المشاريع:' : 'Legend:'}</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span>Won</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
              <span>Installed</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
              <span>Approved</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
              <span>Sent</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span>Draft</span>
            </span>
          </div>
        </div>

        {/* CHART 3: MARGIN TRENDS OVER TIME (Recharts Area / Line Chart with Reference Line) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>{isAr ? 'اتجاهات ومسار هوامش الربحية (Margin Trends)' : 'Profit Margin Trends Over Time'}</span>
                </h4>
                <p className="text-xs text-slate-500">
                  {isAr ? 'تطور هامش الربح الإجمالي (%) لكل مشروع تاريخي مقارنة بالمتوسط المستهدف.' : 'Chronological gross margin percentage trend vs target benchmark.'}
                </p>
              </div>

              <div className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {isAr ? `المتوسط: ${kpis.avgMargin}%` : `Avg: ${kpis.avgMargin}%`}
              </div>
            </div>

            {marginTrendsData.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                {isAr ? 'لا توجد بيانات كافية لحساب مسار الهامش' : 'No historical data to compute margin trends'}
              </div>
            ) : (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={marginTrendsData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      unit="%" 
                      domain={[0, (dataMax: number) => Math.max(35, Math.ceil(dataMax + 5))]}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                            <div className="font-bold text-white text-xs">{d.project}</div>
                            <div className="text-slate-400 text-[10px]">
                              {d.fullDate} &bull; {d.client}
                            </div>
                            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-4 font-mono font-bold text-purple-300">
                              <span>{isAr ? 'هامش الربح:' : 'Gross Margin:'}</span>
                              <span>{d.margin}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[11px] text-emerald-400 font-mono">
                              <span>{isAr ? 'الربح الإجمالي:' : 'Gross Profit:'}</span>
                              <span>{d.profit ? d.profit.toLocaleString() : '—'} SAR</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400">
                              <span>{isAr ? 'متوسط المسار حتى هذا المشروع:' : 'Running Average:'}</span>
                              <span>{d.runningAvg}%</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    {/* Benchmark Reference Line for target margin (e.g. 20%) */}
                    <ReferenceLine 
                      y={20} 
                      stroke="#10b981" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ 
                        value: isAr ? 'المستهدف: 20%' : 'Target 20%', 
                        position: 'insideTopRight', 
                        fill: '#10b981', 
                        fontSize: 10,
                        fontWeight: 'bold' 
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="margin" 
                      name={isAr ? 'هامش الربح (%)' : 'Margin %'} 
                      stroke="#8b5cf6" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#marginGradient)" 
                      dot={{ r: 3.5, fill: '#8b5cf6', strokeWidth: 1.5, stroke: '#ffffff' }}
                      activeDot={{ r: 5.5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="runningAvg" 
                      name={isAr ? 'متوسط المسار التراكمي' : 'Running Avg'} 
                      stroke="#f59e0b" 
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>{isAr ? 'هامش المشروع الفعلي' : 'Actual Margin'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 border border-amber-500 border-dashed" />
              <span>{isAr ? 'متوسط المسار التراكمي' : 'Cumulative Avg'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 border border-emerald-500 border-dashed" />
              <span>{isAr ? 'المستهدف 20%' : '20% Target'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: ELEVATOR TYPE MARGIN & REVENUE MATRIX                          */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'توزيع الإيرادات ومتوسط الهامش حسب نوع المصعد' : 'Revenue & Margin Distribution by Elevator Technology'}</span>
            </h4>
            <p className="text-xs text-slate-500">
              {isAr ? 'تحليل مقارن يحدد الأنواع الأكثر تحقيقاً للأرباح والإيرادات.' : 'Comparative matrix identifying highest revenue & profitability elevator configurations.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {elevatorTypeBreakdown.map((item) => (
            <div 
              key={item.type}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  {item.type.split('_')[0]}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {item.count} {isAr ? 'مصاعد' : 'lifts'}
                </span>
              </div>

              <div className="font-bold text-slate-800 text-xs truncate" title={item.label}>
                {item.label}
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'الإيرادات' : 'Revenue'}</div>
                  <div className="font-mono font-black text-slate-900 text-[11px]">
                    <SarPrice amount={item.totalRevenue} />
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'متوسط الهامش' : 'Margin'}</div>
                  <div className={`font-mono font-black text-xs ${item.avgMargin >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {item.avgMargin}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
