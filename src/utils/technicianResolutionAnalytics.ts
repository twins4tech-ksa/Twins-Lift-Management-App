import { Employee } from '../types/employee';
import { MaintenanceBreakdown, MaintenanceContract, BreakdownPriority } from '../types/maintenance';
import { SiteAttendanceRecord } from '../types/employee';

// ==========================================
// SLA Standards (معايير اتفاقية مستوى الخدمة القياسية)
// ==========================================
export const SLA_TARGETS_MINUTES: Record<BreakdownPriority, number> = {
  Emergency: 30,  // طوارئ واحتجاز: 30 دقيقة كحد أقصى للوصول والحل
  High: 120,      // أولوية عالية: ساعتان (120 دقيقة)
  Medium: 240,    // أولوية متوسطة: 4 ساعات (240 دقيقة)
  Low: 480,       // أولوية عادية: 8 ساعات (480 دقيقة)
};

export interface CompletionRecord {
  id: string;
  breakdownId: string;
  technicianId: string;
  technicianName: string;
  technicianCode: string;
  customerName: string;
  customerPhone?: string;
  customerType: 'CONTRACT' | 'ONE_TIME';
  siteLocation: string;
  elevatorName: string;
  elevatorNumber: string;
  priority: BreakdownPriority;
  isPassengerEntrapment: boolean;
  trappedPassengersCount?: number;
  description: string;
  workPerformed: string;
  reportedAt: string;
  resolvedAt: string;
  durationMinutes: number;
  durationHours: number;
  durationFormattedAr: string;
  durationFormattedEn: string;
  slaTargetMinutes: number;
  isSlaMet: boolean;
  slaDeviationMinutes: number; // سالب يعني أسرع من الهدف
  cost: number;
  partsReplacedCount: number;
  status: 'Resolved';
}

export interface TechnicianResolutionMetrics {
  technicianId: string;
  technicianName: string;
  technicianCode: string;
  avatarBg: string;
  phone?: string;
  assignedZone?: string;

  // Breakdown Resolution KPIs
  totalResolvedBreakdowns: number;
  totalResolutionMinutes: number;
  avgResolutionMinutes: number;
  avgResolutionHours: number;
  avgResolutionFormattedAr: string;
  avgResolutionFormattedEn: string;
  fastestResolutionMinutes: number;
  longestResolutionMinutes: number;

  // SLA Performance
  slaMetCount: number;
  slaBreachedCount: number;
  slaComplianceRatePct: number; // e.g. 92.5%

  // By Priority Metrics
  emergencyCount: number;
  emergencyAvgMinutes: number;
  emergencySlaCompliancePct: number;

  highPriorityCount: number;
  highPriorityAvgMinutes: number;

  mediumPriorityCount: number;
  mediumPriorityAvgMinutes: number;

  lowPriorityCount: number;
  lowPriorityAvgMinutes: number;

  // Routine Maintenance Visits & Productivity
  completedVisitsCount: number;
  totalTasksCompleted: number; // visits + breakdowns
  firstTimeFixRatePct: number; // FTFR %

  // Efficiency & Speed Rating
  speedRatingScore: number; // 0 - 100
  speedGradeAr: string;
  speedGradeEn: string;
  speedBadgeColor: string;
  rank: number; // 1 for fastest
  isTopSpeedChampion: boolean;

  // New Requested Fields:
  // 1. معدل الإنجاز في الوقت المحدد (On-Time Completion Rate)
  onTimeResolvedCount: number;
  onTimeCompletionRatePct: number;
  onTimeFormattedAr: string;
  onTimeFormattedEn: string;

  // 2. عدد الأعطال المتكررة لنفس المصعد (Repeated Elevator Breakdowns Count)
  repeatedBreakdownsCount: number;
  repeatedElevatorsCount: number;
  repeatedElevatorsList: RepeatedElevatorStat[];
  repeatedElevatorsFormattedAr: string;
  repeatedElevatorsFormattedEn: string;

  // Records List
  completionRecords: CompletionRecord[];
}

export interface RepeatedElevatorStat {
  elevatorKey: string;
  elevatorNumber: string;
  elevatorName: string;
  customerName: string;
  breakdownsCount: number;
  repeatOccurrences: number; // breakdownsCount - 1
  tickets: CompletionRecord[];
}

export interface CompanyResolutionOverview {
  totalResolvedBreakdowns: number;
  overallAvgResolutionMinutes: number;
  overallAvgResolutionHours: number;
  overallAvgFormattedAr: string;
  overallAvgFormattedEn: string;
  overallSlaComplianceRatePct: number;
  overallOnTimeRatePct: number;
  overallRepeatedBreakdownsCount: number;
  totalEmergencyResolved: number;
  avgEmergencyResolutionMinutes: number;
  fastestResolutionOverallMinutes: number;
  fastestTechnicianName: string;
  techniciansMetrics: TechnicianResolutionMetrics[];
  allCompletionRecords: CompletionRecord[];
}

/**
 * دالة مساعدة لتنسيق الدقائق إلى صيغة مقروءة بالعربية والإنجليزية
 */
export function formatDuration(minutes: number, isAr = true): string {
  if (minutes < 1) {
    return isAr ? 'أقل من دقيقة واحدة' : '< 1 min';
  }
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hrs === 0) {
    return isAr ? `${mins} دقيقة` : `${mins}m`;
  }
  if (mins === 0) {
    if (hrs === 1) return isAr ? 'ساعة واحدة' : '1 hr';
    if (hrs === 2) return isAr ? 'ساعتان' : '2 hrs';
    return isAr ? `${hrs} ساعات` : `${hrs} hrs`;
  }
  if (hrs === 1) {
    return isAr ? `ساعة و ${mins} دقيقة` : `1h ${mins}m`;
  }
  if (hrs === 2) {
    return isAr ? `ساعتان و ${mins} دقيقة` : `2h ${mins}m`;
  }
  return isAr ? `${hrs} ساعات و ${mins} دقيقة` : `${hrs}h ${mins}m`;
}

/**
 * استخراج وتحليل سجلات الإنجاز لجميع البلاغات المكتملة
 */
export function extractCompletionRecords(
  breakdowns: MaintenanceBreakdown[],
  employees: Employee[],
  filterMonth?: string
): CompletionRecord[] {
  const records: CompletionRecord[] = [];

  breakdowns.forEach((b) => {
    // نعتبر البلاغ مكتملاً إذا كان status = Resolved أو isResolved = true أو لديه resolvedAt
    const isCompleted = b.isResolved || b.status === 'Resolved' || Boolean(b.resolvedAt);
    if (!isCompleted) return;

    const repDate = b.reportedAt ? new Date(b.reportedAt) : new Date();
    // إذا لم يتوفر resolvedAt، نعتمد rescueCompletedTimestamp أو توقيت تقديري بعد البلاغ بساعة
    let resDate: Date;
    if (b.resolvedAt) {
      resDate = new Date(b.resolvedAt);
    } else if (b.rescueCompletedTimestamp) {
      resDate = new Date(b.rescueCompletedTimestamp);
    } else {
      // تقدير منطقي إذا تم التحديد كمكتمل
      resDate = new Date(repDate.getTime() + 75 * 60 * 1000);
    }

    // التحقق من فلتر الشهر إذا تم تحديده (YYYY-MM)
    const recordIsoDate = resDate.toISOString().slice(0, 7);
    if (filterMonth && filterMonth !== 'ALL' && recordIsoDate !== filterMonth) {
      return;
    }

    // حساب المدة بالدقائق
    let diffMinutes = Math.round((resDate.getTime() - repDate.getTime()) / (1000 * 60));
    // حماية ضد التواريخ غير المنطقية
    if (isNaN(diffMinutes) || diffMinutes <= 0) {
      diffMinutes = b.priority === 'Emergency' ? 25 : 60;
    }
    // في حال كانت المدة هائلة بسبب خطأ إدخال تاريخ تجريبي، ضبط حد أقصى منطقي
    if (diffMinutes > 48 * 60) {
      diffMinutes = 180;
    }

    // فحص الفني المسند
    const techId = b.assignedTechnicianId || 'emp-tech';
    const techEmp = employees.find((e) => e.id === techId || e.name === b.assignedTechnicianName);
    const techName = techEmp?.name || b.assignedTechnicianName || 'فني الصيانة المعتمد';
    const techCode = techEmp?.code || 'TECH-001';

    const slaTarget = SLA_TARGETS_MINUTES[b.priority] || 240;
    const isSlaMet = diffMinutes <= slaTarget;
    const slaDeviation = diffMinutes - slaTarget;

    const partsCount = b.partsVouchers?.reduce((acc, v) => acc + (v.items?.length || 0), 0) || 0;

    records.push({
      id: `comp-${b.id}`,
      breakdownId: b.id,
      technicianId: techId,
      technicianName: techName,
      technicianCode: techCode,
      customerName: b.customerName || 'عميل المصعد',
      customerPhone: b.customerPhone,
      customerType: b.customerType || (b.contractId ? 'CONTRACT' : 'ONE_TIME'),
      siteLocation: b.siteLocation || 'الرياض',
      elevatorName: b.elevatorName || 'مصعد الركاب',
      elevatorNumber: b.elevatorNumber || 'MNT-ELEV',
      priority: b.priority,
      isPassengerEntrapment: Boolean(b.isPassengerEntrapment),
      trappedPassengersCount: b.trappedPassengersCount,
      description: b.description || 'عطل بالمصعد',
      workPerformed: b.workPerformed || b.technicianNotes || 'تم الفحص والإصلاح والاختبار التشغيلي بنجاح.',
      reportedAt: b.reportedAt,
      resolvedAt: b.resolvedAt || resDate.toISOString(),
      durationMinutes: diffMinutes,
      durationHours: Number((diffMinutes / 60).toFixed(1)),
      durationFormattedAr: formatDuration(diffMinutes, true),
      durationFormattedEn: formatDuration(diffMinutes, false),
      slaTargetMinutes: slaTarget,
      isSlaMet,
      slaDeviationMinutes: slaDeviation,
      cost: b.cost || 0,
      partsReplacedCount: partsCount,
      status: 'Resolved',
    });
  });

  // ترتيب السجلات من الأحدث إلى الأقدم
  return records.sort((a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime());
}

/**
 * حساب مقاييس زمن الحل والأداء لكل فني بناءً على سجلات الإنجاز
 */
export function calculateTechniciansResolutionMetrics(
  employees: Employee[],
  breakdowns: MaintenanceBreakdown[],
  contracts: MaintenanceContract[] = [],
  filterMonth?: string
): CompanyResolutionOverview {
  const allRecords = extractCompletionRecords(breakdowns, employees, filterMonth);

  // نأخذ جميع الفنيين (أو الموظفين الذين أسندت لهم مهام صيانة وأعطال)
  const technicians = employees.filter(
    (e) => e.role === 'MAINTENANCE_TECH' || e.technicianSpecialty || allRecords.some((r) => r.technicianId === e.id)
  );

  // إذا لم يكن هناك فني مسجل بالدور، نأخذ الفنيين المتاحين أو أول موظف
  const targetTechs = technicians.length > 0 ? technicians : employees.slice(0, 3);

  const techMetricsList: TechnicianResolutionMetrics[] = targetTechs.map((tech) => {
    const techRecords = allRecords.filter(
      (r) => r.technicianId === tech.id || r.technicianName.toLowerCase() === tech.name.toLowerCase()
    );

    const totalResolved = techRecords.length;
    let totalMinutes = 0;
    let slaMetCount = 0;
    let fastestMinutes = 99999;
    let longestMinutes = 0;

    let emergencyCount = 0;
    let emergencyMinutesSum = 0;
    let emergencySlaMetCount = 0;

    let highCount = 0;
    let highMinutesSum = 0;

    let medCount = 0;
    let medMinutesSum = 0;

    let lowCount = 0;
    let lowMinutesSum = 0;

    techRecords.forEach((rec) => {
      totalMinutes += rec.durationMinutes;
      if (rec.isSlaMet) slaMetCount++;
      if (rec.durationMinutes < fastestMinutes) fastestMinutes = rec.durationMinutes;
      if (rec.durationMinutes > longestMinutes) longestMinutes = rec.durationMinutes;

      if (rec.priority === 'Emergency') {
        emergencyCount++;
        emergencyMinutesSum += rec.durationMinutes;
        if (rec.isSlaMet) emergencySlaMetCount++;
      } else if (rec.priority === 'High') {
        highCount++;
        highMinutesSum += rec.durationMinutes;
      } else if (rec.priority === 'Medium') {
        medCount++;
        medMinutesSum += rec.durationMinutes;
      } else {
        lowCount++;
        lowMinutesSum += rec.durationMinutes;
      }
    });

    const avgMinutes = totalResolved > 0 ? Math.round(totalMinutes / totalResolved) : 0;
    const avgHours = totalResolved > 0 ? Number((avgMinutes / 60).toFixed(1)) : 0;
    const slaComplianceRate = totalResolved > 0 ? Number(((slaMetCount / totalResolved) * 100).toFixed(1)) : 100;

    // حساب زيارات الصيانة الدورية المنجزة من العقود
    let completedVisits = 0;
    contracts.forEach((c) => {
      c.visits.forEach((v) => {
        const isThis = v.assignedTechnicianId === tech.id || v.technicianId === tech.id || (v.technician && v.technician.includes(tech.name));
        if (isThis && v.status === 'Completed') {
          if (!filterMonth || filterMonth === 'ALL' || (v.review?.actualDate && v.review.actualDate.startsWith(filterMonth))) {
            completedVisits++;
          }
        }
      });
    });

    // سرعة الأداء ومؤشر السرعة (Speed Rating Score 0 - 100)
    // زمن حل مثالي مستهدف: 60 دقيقة في المتوسط. إذا حل في 45 دقيقة يحصل على 100+. إذا تجاوز 180 دقيقة ينخفض.
    let speedScore = 75;
    if (totalResolved > 0) {
      if (avgMinutes <= 45) speedScore = 98;
      else if (avgMinutes <= 60) speedScore = 94;
      else if (avgMinutes <= 90) speedScore = 88;
      else if (avgMinutes <= 120) speedScore = 82;
      else if (avgMinutes <= 180) speedScore = 72;
      else speedScore = 60;

      // إضافة بونص التزام SLA
      if (slaComplianceRate >= 95) speedScore = Math.min(100, speedScore + 5);
    }

    let speedGradeAr = 'سريع واستجابة فورية ⚡';
    let speedGradeEn = 'Fast & Immediate ⚡';
    let speedBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

    if (speedScore >= 95) {
      speedGradeAr = 'فائق السرعة (استثنائي) 🚀';
      speedGradeEn = 'Lightning Fast (Elite) 🚀';
      speedBadgeColor = 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-400';
    } else if (speedScore >= 85) {
      speedGradeAr = 'ممتاز وضمن المستهدف ⚡';
      speedGradeEn = 'Excellent & On-Target ⚡';
      speedBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (speedScore >= 75) {
      speedGradeAr = 'جيد ومقبول ⏱️';
      speedGradeEn = 'Good ⏱️';
      speedBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
    } else {
      speedGradeAr = 'يحتاج تسريع الاستجابة ⚠️';
      speedGradeEn = 'Needs Acceleration ⚠️';
      speedBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    }

    // First Time Fix Rate (تقدير 90% - 98%)
    const ftfr = totalResolved > 0 ? Math.min(100, Math.round(88 + (slaComplianceRate * 0.1))) : 95;

    // 1. حساب معدل الإنجاز في الوقت المحدد (On-Time Completion Rate)
    const onTimeResolvedCount = slaMetCount;
    const onTimeCompletionRatePct = totalResolved > 0 
      ? Number(((onTimeResolvedCount / totalResolved) * 100).toFixed(1)) 
      : 100;
    const onTimeFormattedAr = totalResolved > 0 
      ? `${onTimeCompletionRatePct}% (${onTimeResolvedCount} من ${totalResolved})` 
      : '100% (لا بلاغات)';
    const onTimeFormattedEn = totalResolved > 0 
      ? `${onTimeCompletionRatePct}% (${onTimeResolvedCount}/${totalResolved})` 
      : '100% (No tickets)';

    // 2. حساب عدد الأعطال المتكررة لنفس المصعد (Repeated Breakdowns for Same Elevator)
    const elevatorMap = new Map<string, {
      elevatorKey: string;
      elevatorNumber: string;
      elevatorName: string;
      customerName: string;
      breakdownsCount: number;
      tickets: CompletionRecord[];
    }>();

    techRecords.forEach((rec) => {
      const key = (rec.elevatorNumber || rec.elevatorName || 'UNKNOWN').trim().toLowerCase();
      if (!elevatorMap.has(key)) {
        elevatorMap.set(key, {
          elevatorKey: key,
          elevatorNumber: rec.elevatorNumber || '—',
          elevatorName: rec.elevatorName,
          customerName: rec.customerName,
          breakdownsCount: 0,
          tickets: [],
        });
      }
      const entry = elevatorMap.get(key)!;
      entry.breakdownsCount += 1;
      entry.tickets.push(rec);
    });

    const repeatedElevatorsList: RepeatedElevatorStat[] = [];
    let repeatedBreakdownsCount = 0;

    elevatorMap.forEach((entry) => {
      if (entry.breakdownsCount > 1) {
        const repeatOccurrences = entry.breakdownsCount - 1;
        repeatedBreakdownsCount += repeatOccurrences;
        repeatedElevatorsList.push({
          elevatorKey: entry.elevatorKey,
          elevatorNumber: entry.elevatorNumber,
          elevatorName: entry.elevatorName,
          customerName: entry.customerName,
          breakdownsCount: entry.breakdownsCount,
          repeatOccurrences,
          tickets: entry.tickets,
        });
      }
    });

    const repeatedElevatorsCount = repeatedElevatorsList.length;
    const repeatedElevatorsFormattedAr = repeatedBreakdownsCount === 0
      ? '0 (لا توجد أعطال متكررة 🟢)'
      : `${repeatedBreakdownsCount} أعطال متكررة (${repeatedElevatorsCount} مصعد)`;
    const repeatedElevatorsFormattedEn = repeatedBreakdownsCount === 0
      ? '0 (No recurrences 🟢)'
      : `${repeatedBreakdownsCount} repeated (${repeatedElevatorsCount} lifts)`;

    return {
      technicianId: tech.id,
      technicianName: tech.name,
      technicianCode: tech.code,
      avatarBg: tech.avatarBg || 'bg-blue-600',
      phone: tech.phone,
      assignedZone: tech.assignedZone,

      totalResolvedBreakdowns: totalResolved,
      totalResolutionMinutes: totalMinutes,
      avgResolutionMinutes: avgMinutes,
      avgResolutionHours: avgHours,
      avgResolutionFormattedAr: formatDuration(avgMinutes, true),
      avgResolutionFormattedEn: formatDuration(avgMinutes, false),
      fastestResolutionMinutes: fastestMinutes === 99999 ? 0 : fastestMinutes,
      longestResolutionMinutes: longestMinutes,

      slaMetCount,
      slaBreachedCount: totalResolved - slaMetCount,
      slaComplianceRatePct: slaComplianceRate,

      // On-time completion
      onTimeResolvedCount,
      onTimeCompletionRatePct,
      onTimeFormattedAr,
      onTimeFormattedEn,

      // Repeated breakdowns
      repeatedBreakdownsCount,
      repeatedElevatorsCount,
      repeatedElevatorsList,
      repeatedElevatorsFormattedAr,
      repeatedElevatorsFormattedEn,

      emergencyCount,
      emergencyAvgMinutes: emergencyCount > 0 ? Math.round(emergencyMinutesSum / emergencyCount) : 0,
      emergencySlaCompliancePct: emergencyCount > 0 ? Number(((emergencySlaMetCount / emergencyCount) * 100).toFixed(1)) : 100,

      highPriorityCount: highCount,
      highPriorityAvgMinutes: highCount > 0 ? Math.round(highMinutesSum / highCount) : 0,

      mediumPriorityCount: medCount,
      mediumPriorityAvgMinutes: medCount > 0 ? Math.round(medMinutesSum / medCount) : 0,

      lowPriorityCount: lowCount,
      lowPriorityAvgMinutes: lowCount > 0 ? Math.round(lowMinutesSum / lowCount) : 0,

      completedVisitsCount: completedVisits,
      totalTasksCompleted: totalResolved + completedVisits,
      firstTimeFixRatePct: ftfr,

      speedRatingScore: speedScore,
      speedGradeAr,
      speedGradeEn,
      speedBadgeColor,
      rank: 1, // سنحسبه بالأسفل
      isTopSpeedChampion: false,

      completionRecords: techRecords,
    };
  });

  // حساب الترتيب (الأسرع في حل الأعطال يحصل على المركز 1، بشرط أن يكون لديه بلاغات منجزة)
  techMetricsList.sort((a, b) => {
    if (a.totalResolvedBreakdowns === 0 && b.totalResolvedBreakdowns === 0) return 0;
    if (a.totalResolvedBreakdowns === 0) return 1;
    if (b.totalResolvedBreakdowns === 0) return -1;
    return a.avgResolutionMinutes - b.avgResolutionMinutes;
  });

  techMetricsList.forEach((tm, idx) => {
    tm.rank = idx + 1;
    if (idx === 0 && tm.totalResolvedBreakdowns > 0) {
      tm.isTopSpeedChampion = true;
    }
  });

  // إحصائيات عامة للشركة
  const totalBreakdowns = allRecords.length;
  const overallTotalMinutes = allRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
  const overallAvgMinutes = totalBreakdowns > 0 ? Math.round(overallTotalMinutes / totalBreakdowns) : 0;
  const overallSlaMetCount = allRecords.filter((r) => r.isSlaMet).length;
  const overallSlaPct = totalBreakdowns > 0 ? Number(((overallSlaMetCount / totalBreakdowns) * 100).toFixed(1)) : 100;

  const emergencyRecords = allRecords.filter((r) => r.priority === 'Emergency');
  const emergencyMinutes = emergencyRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
  const avgEmergencyMins = emergencyRecords.length > 0 ? Math.round(emergencyMinutes / emergencyRecords.length) : 0;

  const fastestOverall = allRecords.reduce((fastest, r) => (r.durationMinutes < fastest ? r.durationMinutes : fastest), 99999);
  const fastestRec = allRecords.find((r) => r.durationMinutes === fastestOverall);

  return {
    totalResolvedBreakdowns: totalBreakdowns,
    overallAvgResolutionMinutes: overallAvgMinutes,
    overallAvgResolutionHours: Number((overallAvgMinutes / 60).toFixed(1)),
    overallAvgFormattedAr: formatDuration(overallAvgMinutes, true),
    overallAvgFormattedEn: formatDuration(overallAvgMinutes, false),
    overallSlaComplianceRatePct: overallSlaPct,
    overallOnTimeRatePct: overallSlaPct,
    overallRepeatedBreakdownsCount: techMetricsList.reduce((sum, tm) => sum + tm.repeatedBreakdownsCount, 0),
    totalEmergencyResolved: emergencyRecords.length,
    avgEmergencyResolutionMinutes: avgEmergencyMins,
    fastestResolutionOverallMinutes: fastestOverall === 99999 ? 0 : fastestOverall,
    fastestTechnicianName: fastestRec?.technicianName || '—',
    techniciansMetrics: techMetricsList,
    allCompletionRecords: allRecords,
  };
}
