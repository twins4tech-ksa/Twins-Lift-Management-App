import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  Factory,
  Truck,
  Wrench,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  AlertCircle,
  Building2,
  Info,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  ElevatorSpecification,
  ProjectMilestoneKey,
  MilestoneStatus,
  ProjectMilestoneData,
} from '../types/elevator';

interface Props {
  spec: ElevatorSpecification;
  language?: 'ar' | 'en';
  onUpdateSpec: (updated: Partial<ElevatorSpecification>) => void;
  className?: string;
  onNavigateToFullTimeline?: () => void;
}

interface MilestoneConfig {
  key: ProjectMilestoneKey;
  stepNumber: number;
  titleAr: string;
  titleEn: string;
  shortDescAr: string;
  shortDescEn: string;
  deliverablesAr: string;
  deliverablesEn: string;
  icon: React.ElementType;
  defaultWeekOffset: number; // offset from base date
  defaultDurationWeeks: number;
  color: {
    badge: string;
    border: string;
    text: string;
    ring: string;
    bg: string;
  };
}

export const ProjectTimelineProgressBar: React.FC<Props> = ({
  spec,
  language = 'ar',
  onUpdateSpec,
  className = '',
  onNavigateToFullTimeline,
}) => {
  const isAr = language === 'ar';
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedMilestoneKey, setSelectedMilestoneKey] = useState<ProjectMilestoneKey>('Engineering');

  const deliveryWeeks = Math.max(2, spec.deliveryWeeks || 8);
  const stops = Math.max(2, spec.stops || 4);
  const installationWeeks = Math.max(2, Math.min(6, Math.round(stops * 0.4) + 1));
  const mfgWeeks = Math.max(2, Math.round(deliveryWeeks * 0.6));
  const shippingWeeks = Math.max(1, deliveryWeeks - mfgWeeks);

  // Configuration of the 4 requested project milestones
  const MILESTONES: MilestoneConfig[] = useMemo(() => [
    {
      key: 'Engineering',
      stepNumber: 1,
      titleAr: 'الاعتماد الهندسي والتصميم',
      titleEn: 'Engineering & CAD Approval',
      shortDescAr: 'اعتماد المخططات التنفيذية، فحص ومطابقة البئر، وإصدار أمر التصنيع',
      shortDescEn: 'Shaft CAD signoff, architectural clearance survey & factory build order',
      deliverablesAr: 'مخططات Shop Drawings المعتمدة ومحضر المسح الميداني للبئر',
      deliverablesEn: 'Approved CAD Drawings & Site Clearance Survey',
      icon: FileCheck,
      defaultWeekOffset: 0,
      defaultDurationWeeks: 1,
      color: {
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        border: 'border-blue-500',
        text: 'text-blue-700',
        ring: 'ring-blue-500',
        bg: 'bg-blue-50',
      },
    },
    {
      key: 'Manufacturing',
      stepNumber: 2,
      titleAr: 'التصنيع والتجهيز بالمصنع',
      titleEn: 'Precision Manufacturing',
      shortDescAr: 'تصنيع ماكينة الجر، الكابينة، لوحة الكنترول، واختبارات الجودة QA',
      shortDescEn: 'Fabrication of traction drive, car frame, control panel & factory QA tests',
      deliverablesAr: 'شهادة الفحص والاختبار المصنعي (Factory Test Certificate)',
      deliverablesEn: 'Factory Test Certificate & Quality Compliance Pass',
      icon: Factory,
      defaultWeekOffset: 1,
      defaultDurationWeeks: mfgWeeks,
      color: {
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        border: 'border-indigo-500',
        text: 'text-indigo-700',
        ring: 'ring-indigo-500',
        bg: 'bg-indigo-50',
      },
    },
    {
      key: 'Shipping',
      stepNumber: 3,
      titleAr: 'الشحن والتوريد للموقع',
      titleEn: 'Logistics & Site Delivery',
      shortDescAr: 'الشحن الدولي، التخليص الجمركي (سابر/SASO)، وتعتيق المواد بالموقع',
      shortDescEn: 'Freight transit, Saber/SASO clearance, site delivery & staging',
      deliverablesAr: 'سند تسليم التوريد للموقع (Site Delivery Note) وبوالص الشحن',
      deliverablesEn: 'Site Delivery Note & Packing Inventory Signoff',
      icon: Truck,
      defaultWeekOffset: 1 + mfgWeeks,
      defaultDurationWeeks: shippingWeeks,
      color: {
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        border: 'border-amber-500',
        text: 'text-amber-700',
        ring: 'ring-amber-500',
        bg: 'bg-amber-50',
      },
    },
    {
      key: 'Installation',
      stepNumber: 4,
      titleAr: 'التركيب والتشغيل الميداني',
      titleEn: 'Site Installation & Handover',
      shortDescAr: 'تركيب السكك والأبواب، تجميع الكابينة، الفحص الميداني، وتسليم الدفاع المدني',
      shortDescEn: 'Guide rails, landing doors, cabin assembly, safety tests & civil defense handover',
      deliverablesAr: 'محضر الاستلام الابتدائي وشهادة السلامة والتشغيل الرسمية',
      deliverablesEn: 'Commissioning Sign-off, Safety Inspection & Handover Certificate',
      icon: Wrench,
      defaultWeekOffset: 1 + mfgWeeks + shippingWeeks,
      defaultDurationWeeks: installationWeeks,
      color: {
        badge: 'bg-teal-100 text-teal-800 border-teal-200',
        border: 'border-teal-500',
        text: 'text-teal-700',
        ring: 'ring-teal-500',
        bg: 'bg-teal-50',
      },
    },
  ], [deliveryWeeks, mfgWeeks, shippingWeeks, installationWeeks]);

  // Base starting date (spec date or today)
  const baseDate = useMemo(() => {
    if (spec.date) {
      const parsed = new Date(spec.date);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [spec.date]);

  const addWeeksToDate = (d: Date, weeks: number): string => {
    const res = new Date(d);
    res.setDate(res.getDate() + Math.round(weeks * 7));
    return res.toISOString().split('T')[0];
  };

  // Derive initial milestone status map if not explicitly set
  const milestoneDataMap: Record<ProjectMilestoneKey, ProjectMilestoneData> = useMemo(() => {
    const raw = spec.projectMilestones || {};
    
    // Auto-infer default status from spec.status if empty
    const defaultStatuses: Record<ProjectMilestoneKey, MilestoneStatus> = {
      Engineering: 'PENDING',
      Manufacturing: 'PENDING',
      Shipping: 'PENDING',
      Installation: 'PENDING',
    };

    if (spec.status === 'Draft') {
      defaultStatuses.Engineering = 'IN_PROGRESS';
    } else if (spec.status === 'Sent') {
      defaultStatuses.Engineering = 'IN_PROGRESS';
    } else if (spec.status === 'Approved') {
      defaultStatuses.Engineering = 'COMPLETED';
      defaultStatuses.Manufacturing = 'IN_PROGRESS';
    } else if (spec.status === 'Won') {
      defaultStatuses.Engineering = 'COMPLETED';
      defaultStatuses.Manufacturing = 'IN_PROGRESS';
    } else if (spec.status === 'Installed') {
      defaultStatuses.Engineering = 'COMPLETED';
      defaultStatuses.Manufacturing = 'COMPLETED';
      defaultStatuses.Shipping = 'COMPLETED';
      defaultStatuses.Installation = 'COMPLETED';
    }

    const res: Record<ProjectMilestoneKey, ProjectMilestoneData> = {
      Engineering: {
        key: 'Engineering',
        status: raw.Engineering?.status || defaultStatuses.Engineering,
        targetDate: raw.Engineering?.targetDate || addWeeksToDate(baseDate, 1),
        completedDate: raw.Engineering?.completedDate,
        notes: raw.Engineering?.notes || '',
        progressPercent: raw.Engineering?.progressPercent,
      },
      Manufacturing: {
        key: 'Manufacturing',
        status: raw.Manufacturing?.status || defaultStatuses.Manufacturing,
        targetDate: raw.Manufacturing?.targetDate || addWeeksToDate(baseDate, 1 + mfgWeeks),
        completedDate: raw.Manufacturing?.completedDate,
        notes: raw.Manufacturing?.notes || '',
        progressPercent: raw.Manufacturing?.progressPercent,
      },
      Shipping: {
        key: 'Shipping',
        status: raw.Shipping?.status || defaultStatuses.Shipping,
        targetDate: raw.Shipping?.targetDate || addWeeksToDate(baseDate, deliveryWeeks),
        completedDate: raw.Shipping?.completedDate,
        notes: raw.Shipping?.notes || '',
        progressPercent: raw.Shipping?.progressPercent,
      },
      Installation: {
        key: 'Installation',
        status: raw.Installation?.status || defaultStatuses.Installation,
        targetDate: raw.Installation?.targetDate || addWeeksToDate(baseDate, deliveryWeeks + installationWeeks),
        completedDate: raw.Installation?.completedDate,
        notes: raw.Installation?.notes || '',
        progressPercent: raw.Installation?.progressPercent,
      },
    };

    return res;
  }, [spec.projectMilestones, spec.status, baseDate, mfgWeeks, deliveryWeeks, installationWeeks]);

  // Compute active/current milestone
  const activeMilestoneKey: ProjectMilestoneKey = useMemo(() => {
    if (spec.currentMilestone) return spec.currentMilestone;
    // Otherwise find the first that is IN_PROGRESS or PENDING
    for (const m of MILESTONES) {
      if (milestoneDataMap[m.key].status === 'IN_PROGRESS') return m.key;
    }
    for (const m of MILESTONES) {
      if (milestoneDataMap[m.key].status === 'PENDING') return m.key;
    }
    return 'Installation';
  }, [spec.currentMilestone, milestoneDataMap, MILESTONES]);

  // Calculate Overall Progress (0 - 100%)
  const overallProgressPercent = useMemo(() => {
    let score = 0;
    const keys: ProjectMilestoneKey[] = ['Engineering', 'Manufacturing', 'Shipping', 'Installation'];
    keys.forEach((k) => {
      const st = milestoneDataMap[k].status;
      if (st === 'COMPLETED') score += 25;
      else if (st === 'IN_PROGRESS') score += 12.5;
    });
    return Math.min(100, Math.round(score));
  }, [milestoneDataMap]);

  // Progress Bar fill width percentage for the horizontal bar
  const progressBarWidthPercent = useMemo(() => {
    // 4 milestones = 3 intervals (0%, 33.3%, 66.6%, 100%) or mapped to score
    let completedCount = 0;
    let hasInProgress = false;
    const keys: ProjectMilestoneKey[] = ['Engineering', 'Manufacturing', 'Shipping', 'Installation'];
    keys.forEach((k, idx) => {
      const st = milestoneDataMap[k].status;
      if (st === 'COMPLETED') {
        completedCount = idx + 1;
      } else if (st === 'IN_PROGRESS' && !hasInProgress) {
        hasInProgress = true;
      }
    });

    if (completedCount === 4) return 100;
    if (completedCount === 0 && !hasInProgress) return 0;
    
    // Each segment between 4 nodes is 33.33%
    const basePercent = (Math.max(0, completedCount - 1) / 3) * 100;
    const addition = hasInProgress ? 16.66 : 0;
    return Math.min(100, Math.max(0, Math.round(basePercent + addition)));
  }, [milestoneDataMap]);

  // Handlers to update milestone data
  const handleUpdateMilestoneStatus = (key: ProjectMilestoneKey, newStatus: MilestoneStatus) => {
    const updatedRecord: ProjectMilestoneData = {
      ...milestoneDataMap[key],
      status: newStatus,
      completedDate: newStatus === 'COMPLETED' ? (milestoneDataMap[key].completedDate || new Date().toISOString().split('T')[0]) : undefined,
    };

    const newMap = {
      ...milestoneDataMap,
      [key]: updatedRecord,
    };

    // If marked as COMPLETED, auto-advance next milestone to IN_PROGRESS if next is PENDING
    const milestoneKeys: ProjectMilestoneKey[] = ['Engineering', 'Manufacturing', 'Shipping', 'Installation'];
    const currentIdx = milestoneKeys.indexOf(key);
    let nextCurrentMilestone: ProjectMilestoneKey = spec.currentMilestone || key;

    if (newStatus === 'COMPLETED' && currentIdx < milestoneKeys.length - 1) {
      const nextKey = milestoneKeys[currentIdx + 1];
      if (newMap[nextKey].status === 'PENDING') {
        newMap[nextKey] = {
          ...newMap[nextKey],
          status: 'IN_PROGRESS',
        };
      }
      nextCurrentMilestone = nextKey;
    } else if (newStatus === 'IN_PROGRESS') {
      nextCurrentMilestone = key;
    }

    // Harmonize with spec.status if appropriate
    let newSpecStatus = spec.status;
    if (key === 'Installation' && newStatus === 'COMPLETED') {
      newSpecStatus = 'Installed';
    } else if (key === 'Engineering' && newStatus === 'COMPLETED' && spec.status === 'Draft') {
      newSpecStatus = 'Approved';
    }

    onUpdateSpec({
      currentMilestone: nextCurrentMilestone,
      projectMilestones: newMap,
      status: newSpecStatus,
    });
  };

  const handleUpdateMilestoneField = (key: ProjectMilestoneKey, field: keyof ProjectMilestoneData, value: any) => {
    const updatedRecord: ProjectMilestoneData = {
      ...milestoneDataMap[key],
      [field]: value,
    };

    const newMap = {
      ...milestoneDataMap,
      [key]: updatedRecord,
    };

    onUpdateSpec({
      projectMilestones: newMap,
    });
  };

  const handleAdvanceNext = () => {
    const milestoneKeys: ProjectMilestoneKey[] = ['Engineering', 'Manufacturing', 'Shipping', 'Installation'];
    const currentIdx = milestoneKeys.indexOf(activeMilestoneKey);

    if (currentIdx >= 0) {
      // Mark current as completed
      handleUpdateMilestoneStatus(activeMilestoneKey, 'COMPLETED');
      if (currentIdx < milestoneKeys.length - 1) {
        const nextKey = milestoneKeys[currentIdx + 1];
        setSelectedMilestoneKey(nextKey);
      }
    }
  };

  const activeSelectedConfig = useMemo(() => {
    return MILESTONES.find((m) => m.key === selectedMilestoneKey) || MILESTONES[0];
  }, [MILESTONES, selectedMilestoneKey]);

  const activeSelectedData = milestoneDataMap[selectedMilestoneKey];

  return (
    <div
      id="quotation-project-timeline-bar"
      className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: TITLE, PROGRESS INDICATOR & QUICK ACTIONS                   */}
      {/* ========================================================================= */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isAr ? 'المسار الزمني وتتبع مراحل المشروع' : 'Project Timeline & Milestone Tracker'}
              </h3>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {overallProgressPercent}% {isAr ? 'مكتمل' : 'Completed'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{isAr ? 'المرحلة النشطة الحالية:' : 'Current Active Phase:'}</span>
              <span className="font-semibold text-amber-300">
                {isAr
                  ? MILESTONES.find((m) => m.key === activeMilestoneKey)?.titleAr
                  : MILESTONES.find((m) => m.key === activeMilestoneKey)?.titleEn}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 text-[11px]">
                {isAr ? `مدة التوريد: ${deliveryWeeks} أسابيع | التركيب: ${installationWeeks} أسابيع` : `Lead time: ${deliveryWeeks} wks | Install: ${installationWeeks} wks`}
              </span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {activeMilestoneKey !== 'Installation' || milestoneDataMap.Installation.status !== 'COMPLETED' ? (
            <button
              type="button"
              id="btn-advance-milestone"
              onClick={handleAdvanceNext}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title={isAr ? 'إنهاء المرحلة الحالية والتقدم للمرحلة التالية' : 'Complete current phase and advance to next'}
            >
              <span>{isAr ? 'اعتماد وإنهاء المرحلة' : 'Advance Milestone'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {isAr ? 'المشروع منفذ بالكامل' : 'All Milestones Delivered'}
            </span>
          )}

          {onNavigateToFullTimeline && (
            <button
              type="button"
              onClick={onNavigateToFullTimeline}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              title={isAr ? 'عرض الجدول الزمني المفصل' : 'View full timeline'}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isAr ? 'الجدول الكامل' : 'Full Schedule'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isExpanded ? (isAr ? 'طي التفاصيل' : 'Collapse') : (isAr ? 'توسيع التفاصيل' : 'Expand')}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE PROGRESS TRACK & STEPPER (ENGINEERING ➔ MANUFACTURING ➔ SHIPPING ➔ INSTALLATION) */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 bg-slate-50/50 border-b border-slate-200/80">
        {/* Horizontal Visual Track */}
        <div className="relative mb-6 mx-4 sm:mx-12">
          {/* Background Rail */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-slate-200 rounded-full" />
          
          {/* Dynamic Completed Progress Rail */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 rounded-full transition-all duration-500"
            style={{
              [isAr ? 'right' : 'left']: 0,
              width: `${progressBarWidthPercent}%`,
            }}
          />

          {/* Stepper Nodes */}
          <div className="relative flex items-center justify-between">
            {MILESTONES.map((m, idx) => {
              const data = milestoneDataMap[m.key];
              const isCompleted = data.status === 'COMPLETED';
              const isInProgress = data.status === 'IN_PROGRESS';
              const isSelected = selectedMilestoneKey === m.key;
              const Icon = m.icon;

              return (
                <div key={m.key} className="flex flex-col items-center">
                  <button
                    type="button"
                    id={`milestone-node-${m.key.toLowerCase()}`}
                    onClick={() => setSelectedMilestoneKey(m.key)}
                    className={`relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 ring-4 ring-emerald-100'
                        : isInProgress
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 ring-4 ring-blue-100 animate-pulse'
                        : 'bg-white text-slate-400 border-2 border-slate-300 hover:border-slate-400 hover:text-slate-600'
                    } ${isSelected ? 'scale-110 ring-offset-2 ring-2 ring-slate-900' : ''}`}
                    title={`${isAr ? m.titleAr : m.titleEn} (${data.status})`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 stroke-[3]" />
                    ) : (
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}

                    {/* Step Number Badge */}
                    <span
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white ${
                        isCompleted
                          ? 'bg-emerald-700 text-white'
                          : isInProgress
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </button>

                  {/* Milestone Label (Desktop & Tablet) */}
                  <div
                    onClick={() => setSelectedMilestoneKey(m.key)}
                    className="mt-2 text-center cursor-pointer max-w-[100px] sm:max-w-[130px]"
                  >
                    <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-700 underline decoration-2 underline-offset-4' : 'text-slate-800'}`}>
                      {isAr ? m.titleAr.split(' ')[0] : m.titleEn.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium hidden sm:block truncate mt-0.5">
                      {isAr ? m.titleAr : m.titleEn}
                    </div>
                    <div className="mt-1">
                      {isCompleted ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                          {isAr ? 'مكتمل' : 'Completed'}
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 animate-pulse">
                          {isAr ? 'قيد التنفيذ' : 'In Progress'}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600">
                          {isAr ? 'قيد الانتظار' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Quick Switcher Pills for Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-200/60">
          {MILESTONES.map((m) => {
            const data = milestoneDataMap[m.key];
            const isSelected = selectedMilestoneKey === m.key;
            return (
              <button
                key={`btn-pill-${m.key}`}
                type="button"
                onClick={() => setSelectedMilestoneKey(m.key)}
                className={`p-2.5 rounded-lg border text-left rtl:text-right transition-all text-xs flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 pr-1 rtl:pr-0 rtl:pl-1">
                  <div className="font-bold truncate">{isAr ? m.titleAr : m.titleEn}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {data.status === 'COMPLETED'
                      ? (isAr ? '✓ تم الإنجاز' : '✓ Completed')
                      : data.status === 'IN_PROGRESS'
                      ? (isAr ? '⏳ جاري العمل' : '⏳ In Progress')
                      : (isAr ? '○ بانتظار البدء' : '○ Pending')}
                  </div>
                </div>
                <div className="shrink-0">
                  {data.status === 'COMPLETED' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
                  ) : data.status === 'IN_PROGRESS' ? (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping block" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 block" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXPANDABLE MILESTONE DETAIL & CONTROL DRAWER                            */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div className="p-4 sm:p-6 bg-white animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Box: Milestone Profile & Scope */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl border ${activeSelectedConfig.color.bg} ${activeSelectedConfig.color.border} text-slate-800 shrink-0`}>
                  {React.createElement(activeSelectedConfig.icon, { className: 'w-6 h-6 text-blue-600' })}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {isAr ? `المرحلة ${activeSelectedConfig.stepNumber} من 4` : `Milestone ${activeSelectedConfig.stepNumber} of 4`}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {isAr ? activeSelectedConfig.titleAr : activeSelectedConfig.titleEn}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {isAr ? activeSelectedConfig.shortDescAr : activeSelectedConfig.shortDescEn}
                  </p>
                </div>
              </div>

              {/* Key Deliverable & Timing Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'المخرج التعاقدي والتسليم المعتمد:' : 'Contractual Deliverables:'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {isAr ? activeSelectedConfig.deliverablesAr : activeSelectedConfig.deliverablesEn}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'المدة التقديرية المبرمجة:' : 'Estimated Window:'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {isAr
                      ? `الأسبوع ${activeSelectedConfig.defaultWeekOffset} إلى الأسبوع ${activeSelectedConfig.defaultWeekOffset + activeSelectedConfig.defaultDurationWeeks} (${activeSelectedConfig.defaultDurationWeeks} أسابيع)`
                      : `Week ${activeSelectedConfig.defaultWeekOffset} to Week ${activeSelectedConfig.defaultWeekOffset + activeSelectedConfig.defaultDurationWeeks} (${activeSelectedConfig.defaultDurationWeeks} weeks)`}
                  </p>
                </div>
              </div>

              {/* Milestone Notes or Action Log */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات وتحديثات المرحلة الميدانية:' : 'Milestone Progress Notes / Action Log:'}
                </label>
                <input
                  type="text"
                  value={activeSelectedData.notes || ''}
                  onChange={(e) => handleUpdateMilestoneField(selectedMilestoneKey, 'notes', e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: تم تدقيق أبعاد البئر وتوقيع المخطط من الاستشاري / بانتظار استلام الدفعة'
                      : 'e.g. Shop drawings ratified by consultant, factory order placed'
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Right Box: Status Controller & Dates Form */}
            <div className="w-full lg:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-4 shrink-0">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>{isAr ? 'التحكم في حالة المرحلة' : 'Milestone Status Control'}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeSelectedData.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : activeSelectedData.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {activeSelectedData.status}
                </span>
              </div>

              {/* 3 Status Switch Buttons */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {isAr ? 'تغيير الحالة الميدانية:' : 'Change Status:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateMilestoneStatus(selectedMilestoneKey, 'PENDING')}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all border ${
                      activeSelectedData.status === 'PENDING'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isAr ? 'قيد الانتظار' : 'Pending'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateMilestoneStatus(selectedMilestoneKey, 'IN_PROGRESS')}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all border ${
                      activeSelectedData.status === 'IN_PROGRESS'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200'
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {isAr ? 'جاري التنفيذ' : 'In Progress'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateMilestoneStatus(selectedMilestoneKey, 'COMPLETED')}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all border ${
                      activeSelectedData.status === 'COMPLETED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    {isAr ? 'تم الإنجاز' : 'Completed'}
                  </button>
                </div>
              </div>

              {/* Target & Completion Dates */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isAr ? 'تاريخ الإنجاز المستهدف:' : 'Target Completion Date:'}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={activeSelectedData.targetDate || ''}
                      onChange={(e) => handleUpdateMilestoneField(selectedMilestoneKey, 'targetDate', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {activeSelectedData.status === 'COMPLETED' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                      {isAr ? 'تاريخ التسليم الفعلي المكتمل:' : 'Actual Signoff Date:'}
                    </label>
                    <input
                      type="date"
                      value={activeSelectedData.completedDate || ''}
                      onChange={(e) => handleUpdateMilestoneField(selectedMilestoneKey, 'completedDate', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-emerald-300 rounded-lg bg-emerald-50/50 text-emerald-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Set as Active Phase Button */}
              <button
                type="button"
                onClick={() => onUpdateSpec({ currentMilestone: selectedMilestoneKey })}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  spec.currentMilestone === selectedMilestoneKey
                    ? 'bg-slate-900 text-white border-slate-900 cursor-default'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                }`}
              >
                {spec.currentMilestone === selectedMilestoneKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isAr ? 'المرحلة النشطة الحالية للمشروع' : 'Active Project Stage'}</span>
                  </>
                ) : (
                  <span>{isAr ? 'تعيين كمرحلة نشطة حالية' : 'Set as Current Stage'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
