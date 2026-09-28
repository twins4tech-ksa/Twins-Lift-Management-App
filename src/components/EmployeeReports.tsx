import React, { useMemo } from 'react';
import { Employee } from '../types/employee';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import { Award, Briefcase, TrendingUp, DollarSign, Target, Calendar, Wrench, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useInteractiveTable, InteractiveColumn } from '../hooks/useInteractiveTable';
import { InteractiveTableHeader, TableControlBar } from './InteractiveTableHeader';
import { MonthlyTechnicianKpi } from '../utils/technicianKpi';

interface EmployeeReportsProps {
  employees: Employee[];
  stats: any;
  isAr: boolean;
  technicianKpis?: MonthlyTechnicianKpi[];
}

export default function EmployeeReports({ employees, stats, isAr, technicianKpis = [] }: EmployeeReportsProps) {
  const salesReps = useMemo(() => employees.filter(e => e.role === 'SALES_REP'), [employees]);
  const technicians = useMemo(() => employees.filter(e => e.role === 'MAINTENANCE_TECH'), [employees]);

  // Map technician KPI by ID
  const kpiMap = useMemo(() => {
    const map = new Map<string, MonthlyTechnicianKpi>();
    technicianKpis.forEach(k => map.set(k.technicianId, k));
    return map;
  }, [technicianKpis]);

  // Sales Reps Interactive Columns
  const repColumns: InteractiveColumn<Employee>[] = useMemo(() => [
    {
      id: 'rep_name',
      header: isAr ? 'اسم المندوب' : 'Rep Name',
      headerAr: 'اسم المندوب',
      headerEn: 'Rep Name',
      sortable: true,
      accessor: (rep) => rep.name,
      renderCell: (rep) => (
        <div>
          <div className="font-bold text-slate-800">{isAr ? rep.name : (rep.nameEn || rep.name)}</div>
          <div className="text-xs text-slate-500">{rep.code}</div>
        </div>
      ),
    },
    {
      id: 'monthly_target',
      header: isAr ? 'الهدف الشهري' : 'Monthly Target',
      headerAr: 'الهدف الشهري',
      headerEn: 'Monthly Target',
      sortable: true,
      accessor: (rep) => rep.monthlyTargetSar || 0,
      renderCell: (rep) => {
        const target = rep.monthlyTargetSar || 0;
        return (
          <div className="font-mono text-slate-600">
            {target.toLocaleString()} <SaudiRiyalSymbol className="w-3 h-3 inline" />
          </div>
        );
      },
    },
    {
      id: 'achieved_sales',
      header: isAr ? 'المبيعات المحققة' : 'Achieved Sales',
      headerAr: 'المبيعات المحققة',
      headerEn: 'Achieved Sales',
      sortable: true,
      accessor: (rep) => stats.repStatsMap[rep.id]?.totalRevenue || 0,
      renderCell: (rep) => {
        const repStats = stats.repStatsMap[rep.id] || { totalRevenue: 0 };
        return (
          <div className="font-mono font-bold text-slate-800">
            {(repStats.totalRevenue || 0).toLocaleString()} <SaudiRiyalSymbol className="w-3 h-3 inline text-emerald-600" />
          </div>
        );
      },
    },
    {
      id: 'achievement_pct',
      header: isAr ? 'نسبة التحقيق' : 'Achievement %',
      headerAr: 'نسبة التحقيق',
      headerEn: 'Achievement %',
      sortable: true,
      accessor: (rep) => {
        const target = rep.monthlyTargetSar || 0;
        const achieved = stats.repStatsMap[rep.id]?.totalRevenue || 0;
        return target > 0 ? (achieved / target) * 100 : 0;
      },
      renderCell: (rep) => {
        const repStats = stats.repStatsMap[rep.id] || { totalRevenue: 0 };
        const target = rep.monthlyTargetSar || 0;
        const achieved = repStats.totalRevenue || 0;
        const achievementPct = target > 0 ? (achieved / target) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${achievementPct >= 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
              {achievementPct.toFixed(1)}%
            </span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${achievementPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, achievementPct)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: 'assigned_projects',
      header: isAr ? 'المشاريع المسندة' : 'Assigned Projects',
      headerAr: 'المشاريع المسندة',
      headerEn: 'Assigned Projects',
      align: 'center',
      sortable: true,
      accessor: (rep) => stats.repStatsMap[rep.id]?.assignedProjectsCount || 0,
      renderCell: (rep) => (
        <span className="font-medium text-slate-700">
          {stats.repStatsMap[rep.id]?.assignedProjectsCount || 0}
        </span>
      ),
    },
    {
      id: 'won_projects',
      header: isAr ? 'المشاريع المعتمدة' : 'Won Projects',
      headerAr: 'المشاريع المعتمدة',
      headerEn: 'Won Projects',
      align: 'center',
      sortable: true,
      accessor: (rep) => stats.repStatsMap[rep.id]?.wonProjectsCount || 0,
      renderCell: (rep) => (
        <span className="font-bold text-emerald-600">
          {stats.repStatsMap[rep.id]?.wonProjectsCount || 0}
        </span>
      ),
    },
    {
      id: 'comm_rate',
      header: isAr ? 'نسبة العمولة' : 'Comm. Rate',
      headerAr: 'نسبة العمولة',
      headerEn: 'Comm. Rate',
      align: 'center',
      sortable: true,
      accessor: (rep) => rep.commissionRate || 2.5,
      renderCell: (rep) => (
        <span className="font-bold text-slate-700">
          {rep.commissionRate || 2.5}%
        </span>
      ),
    },
    {
      id: 'earned_commission',
      header: isAr ? 'العمولة المستحقة' : 'Earned Commission',
      headerAr: 'العمولة المستحقة',
      headerEn: 'Earned Commission',
      headerClassName: 'bg-amber-50/70',
      className: 'bg-amber-50/50',
      sortable: true,
      accessor: (rep) => stats.repStatsMap[rep.id]?.commissionEarned || 0,
      renderCell: (rep) => {
        const comm = stats.repStatsMap[rep.id]?.commissionEarned || 0;
        return (
          <div className="font-mono font-black text-amber-700">
            {Math.round(comm).toLocaleString()} <SaudiRiyalSymbol className="w-3 h-3 inline" />
          </div>
        );
      },
    },
  ], [isAr, stats]);

  const repsTable = useInteractiveTable({
    tableId: 'reps_reports_table',
    columns: repColumns,
    data: salesReps,
    isAr,
  });

  // Technicians Interactive Columns
  const techColumns: InteractiveColumn<Employee>[] = useMemo(() => [
    {
      id: 'tech_name',
      header: isAr ? 'اسم الفني' : 'Technician Name',
      headerAr: 'اسم الفني',
      headerEn: 'Technician Name',
      sortable: true,
      accessor: (tech) => tech.name,
      renderCell: (tech) => (
        <div>
          <div className="font-bold text-slate-800">{isAr ? tech.name : (tech.nameEn || tech.name)}</div>
          <div className="text-xs text-slate-500">{tech.code}</div>
        </div>
      ),
    },
    {
      id: 'zone',
      header: isAr ? 'المنطقة' : 'Zone',
      headerAr: 'المنطقة',
      headerEn: 'Zone',
      sortable: true,
      accessor: (tech) => tech.assignedZone || '',
      renderCell: (tech) => (
        <span className="text-slate-600">
          {tech.assignedZone || '-'}
        </span>
      ),
    },
    {
      id: 'assigned_contracts',
      header: isAr ? 'العقود المسندة' : 'Assigned Contracts',
      headerAr: 'العقود المسندة',
      headerEn: 'Assigned Contracts',
      align: 'center',
      sortable: true,
      accessor: (tech) => stats.techStatsMap[tech.id]?.assignedContractsCount || 0,
      renderCell: (tech) => (
        <span className="font-bold text-blue-600">
          {stats.techStatsMap[tech.id]?.assignedContractsCount || 0}
        </span>
      ),
    },
    {
      id: 'total_visits',
      header: isAr ? 'إجمالي الزيارات' : 'Total Visits',
      headerAr: 'إجمالي الزيارات',
      headerEn: 'Total Visits',
      align: 'center',
      sortable: true,
      accessor: (tech) => stats.techStatsMap[tech.id]?.assignedVisitsCount || 0,
      renderCell: (tech) => (
        <span className="text-slate-700">
          {stats.techStatsMap[tech.id]?.assignedVisitsCount || 0}
        </span>
      ),
    },
    {
      id: 'completed_visits',
      header: isAr ? 'الزيارات المنجزة' : 'Completed Visits',
      headerAr: 'الزيارات المنجزة',
      headerEn: 'Completed Visits',
      align: 'center',
      sortable: true,
      accessor: (tech) => stats.techStatsMap[tech.id]?.completedVisitsCount || 0,
      renderCell: (tech) => (
        <span className="font-bold text-emerald-600">
          {stats.techStatsMap[tech.id]?.completedVisitsCount || 0}
        </span>
      ),
    },
    {
      id: 'completion_rate',
      header: isAr ? 'معدل الإنجاز' : 'Completion Rate',
      headerAr: 'معدل الإنجاز',
      headerEn: 'Completion Rate',
      sortable: true,
      accessor: (tech) => {
        const techStats = stats.techStatsMap[tech.id];
        return techStats && techStats.assignedVisitsCount > 0
          ? (techStats.completedVisitsCount / techStats.assignedVisitsCount) * 100
          : 0;
      },
      renderCell: (tech) => {
        const techStats = stats.techStatsMap[tech.id] || { assignedVisitsCount: 0, completedVisitsCount: 0 };
        const completionRate = techStats.assignedVisitsCount > 0 
          ? (techStats.completedVisitsCount / techStats.assignedVisitsCount) * 100 
          : 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${completionRate === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
              {completionRate.toFixed(0)}%
            </span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${completionRate === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, completionRate)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: 'kpi_monthly',
      header: isAr ? 'تقييم الـ KPI الشهري (12 صيانة / 5 أعطال)' : 'Monthly KPI & Grade',
      headerAr: 'تقييم الـ KPI الشهري (12 صيانة / 5 أعطال)',
      headerEn: 'Monthly KPI & Grade',
      sortable: true,
      accessor: (tech) => kpiMap.get(tech.id)?.compositeScore || 0,
      renderCell: (tech) => {
        const kpi = kpiMap.get(tech.id);
        if (!kpi) {
          return <span className="text-slate-400 text-xs">-</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${kpi.badgeClass}`}>
              {kpi.grade}
            </span>
            <div>
              <div className="text-xs font-bold text-slate-800 font-mono">
                {kpi.compositeScore}% {kpi.isOverachiever && <span className="text-purple-600 font-bold text-[10px]">+{kpi.bonusPoints} بونص</span>}
              </div>
              <div className="text-[10px] text-slate-500">
                {isAr ? kpi.gradeLabelAr : kpi.gradeLabelEn}
              </div>
            </div>
          </div>
        );
      },
    },
  ], [isAr, stats, kpiMap]);

  const techsTable = useInteractiveTable({
    tableId: 'techs_reports_table',
    columns: techColumns,
    data: technicians,
    isAr,
  });

  return (
    <div className="space-y-6">
      {/* 1. Sales Reps Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          {isAr ? 'تقرير عمولات المناديب وأهداف المبيعات' : 'Sales Reps Commissions & Targets'}
        </h2>
        
        {/* Table Control Bar */}
        <TableControlBar
          isReordered={repsTable.isReordered}
          onResetOrder={repsTable.resetColumnOrder}
          sortKey={repsTable.sortKey}
          sortDir={repsTable.sortDir}
          onResetSort={repsTable.resetSort}
          isAr={isAr}
          totalCount={repsTable.sortedData.length}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
              <tr>
                {repsTable.orderedColumns.map((col) => (
                  <InteractiveTableHeader
                    key={col.id}
                    column={col}
                    sortKey={repsTable.sortKey}
                    sortDir={repsTable.sortDir}
                    onSort={repsTable.handleSort}
                    draggedColId={repsTable.draggedColId}
                    dragOverColId={repsTable.dragOverColId}
                    onDragStart={repsTable.handleDragStart}
                    onDragOver={repsTable.handleDragOver}
                    onDragLeave={repsTable.handleDragLeave}
                    onDrop={repsTable.handleDrop}
                    onDragEnd={repsTable.handleDragEnd}
                    isAr={isAr}
                    theme="light"
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repsTable.sortedData.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                  {repsTable.orderedColumns.map((col) => (
                    <td
                      key={col.id}
                      className={`px-4 py-3 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'end'
                          ? 'text-end'
                          : 'text-start'
                      } ${col.className || ''}`}
                    >
                      {col.renderCell(rep, 0)}
                    </td>
                  ))}
                </tr>
              ))}
              {repsTable.sortedData.length === 0 && (
                <tr>
                  <td colSpan={repsTable.orderedColumns.length} className="px-4 py-8 text-center text-slate-500">
                    {isAr ? 'لا يوجد مناديب مبيعات حالياً' : 'No sales representatives found'}
                  </td>
                </tr>
              )}
            </tbody>
            {salesReps.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                <tr>
                  <td className="px-4 py-3">{isAr ? 'الإجمالي' : 'Total'}</td>
                  <td className="px-4 py-3 font-mono">
                    {stats.totalMonthlySalesTarget.toLocaleString()} <SaudiRiyalSymbol className="w-3 h-3 inline" />
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-700">
                    {stats.totalAchievedSales.toLocaleString()} <SaudiRiyalSymbol className="w-3 h-3 inline" />
                  </td>
                  <td className="px-4 py-3">
                    {stats.totalMonthlySalesTarget > 0 
                      ? ((stats.totalAchievedSales / stats.totalMonthlySalesTarget) * 100).toFixed(1) + '%' 
                      : '0%'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Object.values(stats.repStatsMap as Record<string, { assignedProjectsCount: number }>).reduce((acc, curr) => acc + curr.assignedProjectsCount, 0)}
                  </td>
                  <td className="px-4 py-3 text-center text-emerald-700">
                    {Object.values(stats.repStatsMap as Record<string, { wonProjectsCount: number }>).reduce((acc, curr) => acc + curr.wonProjectsCount, 0)}
                  </td>
                  <td className="px-4 py-3 text-center">-</td>
                  <td className="px-4 py-3 font-mono text-amber-800">
                    {Math.round(stats.totalCommissionsEarned).toLocaleString()} <SaudiRiyalSymbol className="w-3 h-3 inline" />
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 2. Technicians Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-500" />
          {isAr ? 'تقرير أداء فنيي الصيانة' : 'Technicians Performance Report'}
        </h2>

        {/* Table Control Bar */}
        <TableControlBar
          isReordered={techsTable.isReordered}
          onResetOrder={techsTable.resetColumnOrder}
          sortKey={techsTable.sortKey}
          sortDir={techsTable.sortDir}
          onResetSort={techsTable.resetSort}
          isAr={isAr}
          totalCount={techsTable.sortedData.length}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
              <tr>
                {techsTable.orderedColumns.map((col) => (
                  <InteractiveTableHeader
                    key={col.id}
                    column={col}
                    sortKey={techsTable.sortKey}
                    sortDir={techsTable.sortDir}
                    onSort={techsTable.handleSort}
                    draggedColId={techsTable.draggedColId}
                    dragOverColId={techsTable.dragOverColId}
                    onDragStart={techsTable.handleDragStart}
                    onDragOver={techsTable.handleDragOver}
                    onDragLeave={techsTable.handleDragLeave}
                    onDrop={techsTable.handleDrop}
                    onDragEnd={techsTable.handleDragEnd}
                    isAr={isAr}
                    theme="light"
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {techsTable.sortedData.map((tech) => (
                <tr key={tech.id} className="hover:bg-slate-50 transition-colors">
                  {techsTable.orderedColumns.map((col) => (
                    <td
                      key={col.id}
                      className={`px-4 py-3 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'end'
                          ? 'text-end'
                          : 'text-start'
                      } ${col.className || ''}`}
                    >
                      {col.renderCell(tech, 0)}
                    </td>
                  ))}
                </tr>
              ))}
              {techsTable.sortedData.length === 0 && (
                <tr>
                  <td colSpan={techsTable.orderedColumns.length} className="px-4 py-8 text-center text-slate-500">
                    {isAr ? 'لا يوجد فنيي صيانة حالياً' : 'No technicians found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
