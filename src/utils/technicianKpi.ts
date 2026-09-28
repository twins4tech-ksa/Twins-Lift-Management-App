import { Employee } from '../types/employee';
import { MaintenanceContract, MaintenanceBreakdown } from '../types/maintenance';

export const DAILY_TARGET_BREAKDOWNS = 5; // المستهدف اليومي لإصلاح الأعطال
export const DAILY_TARGET_MAINTENANCE = 12; // المستهدف اليومي لزيارات الصيانة الدورية
export const DEFAULT_WORKING_DAYS_PER_MONTH = 26; // أيام العمل الشهرية المعتمدة (6 أيام أسبوعياً)

export interface MonthlyTechnicianKpi {
  technicianId: string;
  technicianName: string;
  technicianCode: string;
  avatarBg?: string;
  assignedZone?: string;
  yearMonth: string; // e.g. "2026-09"
  workingDays: number;

  // Maintenance Visits KPI (Target: 12 visits/day)
  monthlyVisitsTarget: number; // workingDays * 12
  completedVisitsCount: number;
  dailyVisitsAvg: number;
  visitsAchievementPct: number;

  // Breakdowns Repairs KPI (Target: 5 repairs/day)
  monthlyBreakdownsTarget: number; // workingDays * 5
  resolvedBreakdownsCount: number;
  dailyBreakdownsAvg: number;
  breakdownsAchievementPct: number;

  // Composite KPI & Grading ("وما اكثر فله درجات اعلي")
  compositeScore: number; // Total points (can exceed 100)
  grade: 'A++' | 'A+' | 'A' | 'B+' | 'B' | 'C';
  gradeLabelAr: string;
  gradeLabelEn: string;
  badgeClass: string;
  bonusPoints: number; // Points above 100
  isOverachiever: boolean;
}

/**
 * تحديد التقدير والدرجات بناءً على نسبة الإنجاز:
 * إذا حقق أكثر من المستهدف يحصل على درجات ومرتبة أعلى
 */
export function getKpiGrade(score: number): {
  grade: 'A++' | 'A+' | 'A' | 'B+' | 'B' | 'C';
  gradeLabelAr: string;
  gradeLabelEn: string;
  badgeClass: string;
  bonusPoints: number;
  isOverachiever: boolean;
} {
  const bonusPoints = Math.max(0, Math.round(score - 100));
  if (score >= 125) {
    return {
      grade: 'A++',
      gradeLabelAr: 'استثنائي خارق (مرتبة الشرف الأولى)',
      gradeLabelEn: 'Outstanding (Highest Honors)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-400',
      bonusPoints,
      isOverachiever: true,
    };
  }
  if (score >= 110) {
    return {
      grade: 'A+',
      gradeLabelAr: 'ممتاز متفوق (درجات تميز إضافية)',
      gradeLabelEn: 'Excellent (High Distinction)',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400',
      bonusPoints,
      isOverachiever: true,
    };
  }
  if (score >= 100) {
    return {
      grade: 'A',
      gradeLabelAr: 'محقق للمستهدف كاملاً',
      gradeLabelEn: 'Target Achieved',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
      bonusPoints,
      isOverachiever: false,
    };
  }
  if (score >= 85) {
    return {
      grade: 'B+',
      gradeLabelAr: 'جيد جداً (قريب من المستهدف)',
      gradeLabelEn: 'Very Good',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      bonusPoints: 0,
      isOverachiever: false,
    };
  }
  if (score >= 70) {
    return {
      grade: 'B',
      gradeLabelAr: 'جيد (أداء متوسط)',
      gradeLabelEn: 'Good',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      bonusPoints: 0,
      isOverachiever: false,
    };
  }
  return {
    grade: 'C',
    gradeLabelAr: 'دون المستهدف (يحتاج تحسين ومتابعة)',
    gradeLabelEn: 'Below Target',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    bonusPoints: 0,
    isOverachiever: false,
  };
}

/**
 * حساب الـ KPI الشهري لجميع الفنيين أو لفني محدد
 */
export function calculateMonthlyTechnicianKpis(
  employees: Employee[],
  contracts: MaintenanceContract[],
  breakdowns: MaintenanceBreakdown[],
  selectedYearMonth: string, // YYYY-MM
  workingDays: number = DEFAULT_WORKING_DAYS_PER_MONTH
): MonthlyTechnicianKpi[] {
  const technicians = employees.filter(e => e.role === 'MAINTENANCE_TECH');

  return technicians.map((tech) => {
    // 1. حساب الزيارات المكتملة في هذا الشهر
    let completedVisitsCount = 0;
    contracts.forEach((contract) => {
      contract.visits.forEach((v) => {
        const isThisTech = v.assignedTechnicianId === tech.id || 
          v.technicianId === tech.id || 
          contract.assignedTechnicianId === tech.id ||
          (v.technician && v.technician.includes(tech.name));

        if (isThisTech) {
          const dateToTest = v.review?.actualDate || v.scheduledDate;
          if (dateToTest && dateToTest.startsWith(selectedYearMonth) && v.status === 'Completed') {
            completedVisitsCount++;
          }
        }
      });
    });

    // 2. حساب الأعطال التي تم إصلاحها في هذا الشهر
    let resolvedBreakdownsCount = 0;
    breakdowns.forEach((b) => {
      const isThisTech = b.assignedTechnicianId === tech.id || 
        (b.assignedTechnicianName && b.assignedTechnicianName.includes(tech.name));

      if (isThisTech) {
        const dateToTest = b.resolvedAt || b.reportedAt;
        if (dateToTest && dateToTest.startsWith(selectedYearMonth) && (b.isResolved || b.status === 'Resolved')) {
          resolvedBreakdownsCount++;
        }
      }
    });

    // الأهداف الشهرية:
    // صيانة: 12 زيارة يومياً × أيام العمل
    // أعطال: 5 إصلاحات يومياً × أيام العمل
    const monthlyVisitsTarget = workingDays * DAILY_TARGET_MAINTENANCE;
    const monthlyBreakdownsTarget = workingDays * DAILY_TARGET_BREAKDOWNS;

    const dailyVisitsAvg = Number((completedVisitsCount / workingDays).toFixed(1));
    const dailyBreakdownsAvg = Number((resolvedBreakdownsCount / workingDays).toFixed(1));

    const visitsAchievementPct = monthlyVisitsTarget > 0 
      ? Number(((completedVisitsCount / monthlyVisitsTarget) * 100).toFixed(1))
      : 0;

    const breakdownsAchievementPct = monthlyBreakdownsTarget > 0
      ? Number(((resolvedBreakdownsCount / monthlyBreakdownsTarget) * 100).toFixed(1))
      : 0;

    // حساب الدرجة الإجمالية (Composite Score):
    // إذا كان الفني يمارس الصيانة والأعطال: وزن 60% للصيانة و 40% للأعطال، أو حسب الأنشطة المسندة
    let compositeScore = 0;
    if (completedVisitsCount > 0 && resolvedBreakdownsCount > 0) {
      compositeScore = Number(((visitsAchievementPct * 0.6) + (breakdownsAchievementPct * 0.4)).toFixed(1));
    } else if (completedVisitsCount > 0) {
      compositeScore = visitsAchievementPct;
    } else if (resolvedBreakdownsCount > 0) {
      compositeScore = breakdownsAchievementPct;
    } else {
      compositeScore = 0;
    }

    const gradeInfo = getKpiGrade(compositeScore);

    return {
      technicianId: tech.id,
      technicianName: tech.name,
      technicianCode: tech.code,
      avatarBg: tech.avatarBg,
      assignedZone: tech.assignedZone,
      yearMonth: selectedYearMonth,
      workingDays,
      monthlyVisitsTarget,
      completedVisitsCount,
      dailyVisitsAvg,
      visitsAchievementPct,
      monthlyBreakdownsTarget,
      resolvedBreakdownsCount,
      dailyBreakdownsAvg,
      breakdownsAchievementPct,
      compositeScore,
      ...gradeInfo,
    };
  });
}
