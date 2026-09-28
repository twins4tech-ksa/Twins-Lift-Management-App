import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  Wrench, 
  FileCheck, 
  Copy, 
  Check, 
  Sparkles, 
  CalendarDays, 
  Building2, 
  Info,
  ChevronDown,
  ChevronUp,
  Share2,
  Layers,
  ArrowRight,
  ArrowLeft,
  Settings2
} from 'lucide-react';
import { ElevatorSpecification } from '../types/elevator';

interface Props {
  spec: ElevatorSpecification;
  language?: 'ar' | 'en';
  onUpdateSpec?: (updated: Partial<ElevatorSpecification>) => void;
  className?: string;
}

interface Milestone {
  id: string;
  phaseNumber: number;
  titleAr: string;
  titleEn: string;
  shortDescAr: string;
  shortDescEn: string;
  weekStart: number;
  weekEnd: number;
  dateStart: Date;
  dateEnd: Date;
  icon: React.ElementType;
  badgeAr: string;
  badgeEn: string;
  color: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    lightBg: string;
    badgeBg: string;
  };
  detailsAr: string[];
  detailsEn: string[];
  deliverablesAr: string;
  deliverablesEn: string;
  responsibilityAr: string;
  responsibilityEn: string;
}

export const ProjectTimeline: React.FC<Props> = ({
  spec,
  language = 'ar',
  onUpdateSpec,
  className = '',
}) => {
  const isAr = language === 'ar';
  const [copied, setCopied] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('m-delivery');
  const [showLeadTimeExplainer, setShowLeadTimeExplainer] = useState(true);

  // Normalize deliveryWeeks (default to 6 if <= 0) and warrantyMonths (default to 24)
  const deliveryWeeks = Math.max(2, spec.deliveryWeeks || 6);
  const warrantyMonths = Math.max(3, spec.warrantyMonths || 24);
  const stops = Math.max(2, spec.stops || 4);

  // Calculate realistic installation duration based on elevator stops (approx 2 to 4 weeks)
  const installationWeeks = Math.max(2, Math.min(6, Math.round(stops * 0.4) + 1));
  const testingWeeks = 1;
  const totalWeeksToHandover = deliveryWeeks + installationWeeks + testingWeeks;

  // Base starting date from spec.date or today
  const baseDate = useMemo(() => {
    if (spec.date) {
      const parsed = new Date(spec.date);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [spec.date]);

  // Helper to add weeks to a base date
  const addWeeks = (date: Date, weeks: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + Math.round(weeks * 7));
    return result;
  };

  // Helper to add months to a base date
  const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  // Format date helper
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Milestone schedule breakdown
  const milestones: Milestone[] = useMemo(() => {
    const mfgEndWeek = Math.max(1, Math.round(deliveryWeeks * 0.65));
    const transitStartWeek = mfgEndWeek;
    const transitEndWeek = deliveryWeeks;
    const installStartWeek = deliveryWeeks;
    const installEndWeek = deliveryWeeks + installationWeeks;
    const testStartWeek = installEndWeek;
    const testEndWeek = totalWeeksToHandover;

    const d0 = baseDate;
    const dEngEnd = addWeeks(baseDate, 1);
    const dMfgEnd = addWeeks(baseDate, mfgEndWeek);
    const dSiteDelivery = addWeeks(baseDate, transitEndWeek);
    const dInstallEnd = addWeeks(baseDate, installEndWeek);
    const dHandover = addWeeks(baseDate, testEndWeek);
    const dWarrantyEnd = addMonths(dHandover, warrantyMonths);

    return [
      {
        id: 'm-engineering',
        phaseNumber: 1,
        titleAr: 'توقيع العقد والمخططات التنفيذية',
        titleEn: 'Contract & Engineering Approval',
        shortDescAr: 'اعتماد رسومات البئر، دراسة الأحمال الميدانية، والمسح المساحي',
        shortDescEn: 'Shaft CAD approvals, structural survey, and down payment confirmation',
        weekStart: 0,
        weekEnd: 1,
        dateStart: d0,
        dateEnd: dEngEnd,
        icon: Building2,
        badgeAr: 'الأسبوع 0 - 1',
        badgeEn: 'Week 0 - 1',
        color: {
          bg: 'bg-blue-600',
          border: 'border-blue-400',
          text: 'text-blue-700',
          accent: 'blue',
          lightBg: 'bg-blue-50/70',
          badgeBg: 'bg-blue-100 text-blue-800',
        },
        detailsAr: [
          'توقيع العقد النهائي ومراجعة الشروط التعاقدية وجدول الدفعات',
          'مراجعة وتعديل مخططات البئر (SW × SD) وخلوصات الحفرة والارتفاع الأخير',
          'الرفع المساحي لموقع البئر ومطابقة الفتحات مع مواصفات الأبواب',
          'إصدار أمر التصنيع المصنعي المعتمد',
        ],
        detailsEn: [
          'Final contract ratification & payment milestone confirmation',
          'Architectural & structural CAD drawing signoff (SW × SD, Pit & Overhead)',
          'Plumb line laser measurement of shaft verticality & door wall cutouts',
          'Issuance of official factory manufacturing build order',
        ],
        deliverablesAr: 'المخططات التنفيذية المعتمدة (Shop Drawings) ومحضر المسح الميداني',
        deliverablesEn: 'Approved CAD Shop Drawings & Site Clearance Survey',
        responsibilityAr: 'مشتركة (المقاول والعميل/الاستشاري)',
        responsibilityEn: 'Joint (Contractor & Client / Consultant)',
      },
      {
        id: 'm-manufacturing',
        phaseNumber: 2,
        titleAr: 'التصنيع والتجهيز المصنعي للقطع',
        titleEn: 'Factory Precision Manufacturing',
        shortDescAr: 'تصنيع ماكينة الجر، الكابينة، لوحة التحكم، سكك التوجيه والأبواب',
        shortDescEn: 'Fabrication of traction drive, car frame, smart controller, and door systems',
        weekStart: 1,
        weekEnd: mfgEndWeek,
        dateStart: dEngEnd,
        dateEnd: dMfgEnd,
        icon: Sparkles,
        badgeAr: `الأسبوع 1 - ${mfgEndWeek}`,
        badgeEn: `Week 1 - ${mfgEndWeek}`,
        color: {
          bg: 'bg-indigo-600',
          border: 'border-indigo-400',
          text: 'text-indigo-700',
          accent: 'indigo',
          lightBg: 'bg-indigo-50/70',
          badgeBg: 'bg-indigo-100 text-indigo-800',
        },
        detailsAr: [
          `تصنيع ماكينة الجر بدون تروس (Gearless Traction Machine) طبقاً لمعايير EN 81-20/50`,
          `تشكيل ألواح كابينة المصعد بالتشطيب المعتمد (${spec.wallFinish || 'Stainless Steel'})`,
          `برمجة وتجميع لوحة التحكم الذكية والإنفرتر (VVVF Inverter)`,
          'اختبارات الجودة ومطابقة السلامة في المصنع قبل التعبئة والتغليف المحمي',
        ],
        detailsEn: [
          'Precision casting & winding of gearless traction machine (EN 81-20/50)',
          `CNC fabrication & finishing of cabin walls (${spec.wallFinish || 'Stainless Steel'})`,
          'Smart microprocessor controller assembly & dynamic drive parameter testing',
          'Factory Quality Assurance (QA/QC) bench-testing & protective crating',
        ],
        deliverablesAr: 'شهادة الفحص المصنعي (Factory Test Certificate) وبوالص الشحن',
        deliverablesEn: 'Factory Test Certificate & Component Compliance Pack',
        responsibilityAr: 'الشركة المصنعة / المورد',
        responsibilityEn: 'Elevator Manufacturer / Supplier',
      },
      {
        id: 'm-delivery',
        phaseNumber: 3,
        titleAr: 'الشحن والتوريد الميداني للموقع (Equipment On-Site)',
        titleEn: 'Logistics & Site Equipment Delivery',
        shortDescAr: `وصول جميع المكونات للموقع جاهزة للتعتيق والتخزين (خلال ${deliveryWeeks} أسابيع)`,
        shortDescEn: `Arrival of all certified elevator components on-site within ${deliveryWeeks} weeks`,
        weekStart: transitStartWeek,
        weekEnd: transitEndWeek,
        dateStart: dMfgEnd,
        dateEnd: dSiteDelivery,
        icon: Truck,
        badgeAr: `الأسبوع ${transitEndWeek} (تاريخ التسليم المستهدف)`,
        badgeEn: `Week ${transitEndWeek} (Delivery Target)`,
        color: {
          bg: 'bg-amber-600',
          border: 'border-amber-400',
          text: 'text-amber-700',
          accent: 'amber',
          lightBg: 'bg-amber-50/70',
          badgeBg: 'bg-amber-100 text-amber-900',
        },
        detailsAr: [
          'التخليص الجمركي واستيفاء مطابقة الهيئة السعودية للمواصفات (SASO / Saber)',
          `نقل المعدات إلى موقع المشروع (${spec.siteLocation || 'موقع العميل'})`,
          'تفريغ وتعتيق المواد الثقيلة (الماكينة، سكك الحديد، الشاسيه) في مستودع الموقع الآمن',
          'محضر استلام وتطابق البضاعة والمكونات الميدانية بحضور المهندس المشرف',
        ],
        detailsEn: [
          'Customs clearance, port handling & SASO/Saber compliance certifications',
          `Direct specialized transport to project location (${spec.siteLocation || 'Client Site'})`,
          'Rigging, safe unloading & secure staging of heavy components (machine, rails, sling)',
          'Formal delivery note sign-off & physical inventory verification',
        ],
        deliverablesAr: 'سند تسليم التوريد للموقع (Site Delivery Note) وبطاقات الضمان الجمركية',
        deliverablesEn: 'Site Delivery Note & Bill of Materials Inventory Receipt',
        responsibilityAr: 'شركة المصاعد / فريق النقل واللوجستيات',
        responsibilityEn: 'Elevator Company Logistics & Freight Operations',
      },
      {
        id: 'm-installation',
        phaseNumber: 4,
        titleAr: 'التركيبات الميكانيكية والكهربائية للبئر',
        titleEn: 'Shaft Mechanical & Electrical Installation',
        shortDescAr: `تركيب سكك الحديد، الأبواب، تجميع الكابينة وتمديد الأسلاك (${installationWeeks} أسابيع)`,
        shortDescEn: `Installation of guide rails, landing doors, cabin assembly, and wiring (${installationWeeks} wks)`,
        weekStart: installStartWeek,
        weekEnd: installEndWeek,
        dateStart: dSiteDelivery,
        dateEnd: dInstallEnd,
        icon: Wrench,
        badgeAr: `الأسبوع ${installStartWeek} - ${installEndWeek}`,
        badgeEn: `Week ${installStartWeek} - ${installEndWeek}`,
        color: {
          bg: 'bg-teal-600',
          border: 'border-teal-400',
          text: 'text-teal-700',
          accent: 'teal',
          lightBg: 'bg-teal-50/70',
          badgeBg: 'bg-teal-100 text-teal-900',
        },
        detailsAr: [
          `تثبيت كوابيل السكك وضبط استقامة سكك الكابينة وثقل الموازنة بالليزر (${stops} وقفات)`,
          'تركيب أبواب الأعتاب الخارجية والميكانيزم وتثبيتها بالجدران',
          'تجميع شاسيه الكابينة (Sling)، تعليق الحبال الفولاذية وتركيب جهاز منظم السرعة والبراشوت',
          'تمديد الكابل المرن وتوصيل لوحة الكنترول وأزرار الأدوار وشاشات TFT',
        ],
        detailsEn: [
          `Laser alignment & wall bracket anchoring of guide rails for ${stops} landing stops`,
          'Precision hanging of landing door headers, sills, and interlock mechanisms',
          'Car frame (sling) erection, counterweight staging, and hoist rope rigging',
          'Traveling cable hanging, shaft wiring, motor wiring & COP/LOP electrical connections',
        ],
        deliverablesAr: 'محضر إنجاز الأعمال الميكانيكية والكهربائية (Installation Completion)',
        deliverablesEn: 'Mechanical & Electrical Erection Sign-off Checklist',
        responsibilityAr: 'فريق التركيبات المعتمد بشركة المصاعد',
        responsibilityEn: 'Certified Elevator Installation Team',
      },
      {
        id: 'm-handover',
        phaseNumber: 5,
        titleAr: 'الاختبارات، تصريح الدفاع المدني والتسليم النهائي',
        titleEn: 'Safety Commissioning, Civil Defense & Handover',
        shortDescAr: 'معايرة الأوزان، فحص جهاز الطوارئ ARD، وإصدار شهادة التشغيل الرسمية',
        shortDescEn: 'Weight calibration, ARD emergency testing, Civil Defense certification & handover',
        weekStart: testStartWeek,
        weekEnd: testEndWeek,
        dateStart: dInstallEnd,
        dateEnd: dHandover,
        icon: FileCheck,
        badgeAr: `الأسبوع ${testEndWeek} (التشغيل والتعميد)`,
        badgeEn: `Week ${testEndWeek} (Ready for Operation)`,
        color: {
          bg: 'bg-emerald-600',
          border: 'border-emerald-400',
          text: 'text-emerald-700',
          accent: 'emerald',
          lightBg: 'bg-emerald-50/70',
          badgeBg: 'bg-emerald-100 text-emerald-900',
        },
        detailsAr: [
          'اختبار الحمولة الزائدة واختبار تدلي الكابينة وهبوط البراشوت (Safety Gear Drop Test)',
          'فحص جهاز الطوارئ الأوتوماتيكي (ARD) والتأكد من فتح الباب عند انقطاع الكهرباء',
          'إجراء فحص كفاءة الحركة وسلاسة الوقوف والتسارع بنظام V/F',
          'إصدار تقرير السلامة المعتمد لتقديم طلب ترخيص الدفاع المدني وتسليم المفاتيح للعميل',
        ],
        detailsEn: [
          'Dynamic full-load & overspeed governor safety gear drop test',
          'Automatic Rescue Device (ARD) evacuation drill during simulated blackout',
          'Ride comfort analysis, leveling calibration & door safety curtain beam checks',
          'Official Civil Defense safety compliance certificate & keys handover to client',
        ],
        deliverablesAr: 'شهادة التسليم النهائي، شهادة الدفاع المدني، ومفاتيح الطوارئ والتشغيل',
        deliverablesEn: 'Official Handover Certificate, Civil Defense Safety Permit & Operating Keys',
        responsibilityAr: 'مشتركة (إدارة الجودة والسلامة + العميل)',
        responsibilityEn: 'Joint (QA Inspection Engineers & Client)',
      },
      {
        id: 'm-warranty',
        phaseNumber: 6,
        titleAr: 'فترة الضمان الشامل والصيانة الدورية المجانية',
        titleEn: 'Comprehensive Warranty & Scheduled Maintenance',
        shortDescAr: `تغطية شاملة مجانية لمدة ${warrantyMonths} شهراً تشمل الزيارات الدورية وقطع الغيار`,
        shortDescEn: `Full ${warrantyMonths}-month warranty coverage with scheduled monthly preventive visits`,
        weekStart: totalWeeksToHandover,
        weekEnd: totalWeeksToHandover + Math.round(warrantyMonths * 4.33),
        dateStart: dHandover,
        dateEnd: dWarrantyEnd,
        icon: ShieldCheck,
        badgeAr: `سارية لمدة ${warrantyMonths} شهراً (${(warrantyMonths / 12).toFixed(1)} سنة)`,
        badgeEn: `Active for ${warrantyMonths} Months (${(warrantyMonths / 12).toFixed(1)} Yrs)`,
        color: {
          bg: 'bg-purple-600',
          border: 'border-purple-400',
          text: 'text-purple-700',
          accent: 'purple',
          lightBg: 'bg-purple-50/70',
          badgeBg: 'bg-purple-100 text-purple-900',
        },
        detailsAr: [
          `زيارات دورية وقائية منتظمة شهرياً (${warrantyMonths} زيارة دورية معتمدة)`,
          'طوارئ 24/7 للتعامل الفوري مع أي بلاغ عبر مركز الاتصال الموحد',
          'استبدال مجاني فوري لأي قطعة غيار تالفة ناتجة عن عيوب التصنيع طوال مدة الضمان',
          'تقارير دورية إلكترونية بحالة المصعد بعد كل زيارة صيانة',
        ],
        detailsEn: [
          `Regular monthly preventive maintenance checkups (${warrantyMonths} certified visits)`,
          '24/7 emergency dispatch response for rapid entrapment assistance',
          'Free replacement of genuine components against manufacturer defects',
          'Digital maintenance visit reports and performance health checks',
        ],
        deliverablesAr: `عقد الضمان الشامل المعتمد (${warrantyMonths} شهر) وسجل زيارات الصيانة الدوري`,
        deliverablesEn: `Certified Warranty Certificate (${warrantyMonths} Months) & Maintenance Logbook`,
        responsibilityAr: 'قسم الصيانة والخدمات ما بعد البيع بشركة المصاعد',
        responsibilityEn: 'Elevator Company After-Sales & Maintenance Operations',
      },
    ];
  }, [baseDate, deliveryWeeks, warrantyMonths, stops, totalWeeksToHandover, spec.wallFinish, spec.siteLocation, isAr]);

  // Selected milestone details
  const activeMilestone = useMemo(() => {
    return milestones.find((m) => m.id === selectedMilestoneId) || milestones[2];
  }, [milestones, selectedMilestoneId]);

  // Copy proposal lead time text for client communication
  const handleCopySummary = () => {
    const text = isAr
      ? `📋 الجدول الزمني المعتمد لمشروع المصعد: ${spec.projectName || 'مشروع المصعد'} (${spec.quoteRef})
══════════════════════════════════════════════════
• مدة التصنيع والتوريد للموقع: ${deliveryWeeks} أسابيع (تاريخ التوريد المتوقع: ${formatDate(milestones[2].dateEnd)})
• مدة التركيبات الميكانيكية والكهربائية: ${installationWeeks} أسابيع
• موعد التسليم النهائي والتشغيل: الأسبوع ${totalWeeksToHandover} (الموافق: ${formatDate(milestones[4].dateEnd)})
• فترة الضمان الشامل والصيانة الوقائية المجانية: ${warrantyMonths} شهراً (${(warrantyMonths / 12).toFixed(1)} سنة) حتى ${formatDate(milestones[5].dateEnd)}
• عدد وقفات المصعد: ${stops} وقفات | الحمولة: ${spec.capacityKg || 450} كجم | السرعة: ${spec.ratedSpeed || 1.0} م/ث
══════════════════════════════════════════════════
* تم إعداد هذا الجدول الزمني استناداً إلى المواصفات الفنية المعتمدة.`
      : `📋 Project Lead Time & Milestone Schedule: ${spec.projectName || 'Elevator Project'} (${spec.quoteRef})
══════════════════════════════════════════════════
• Manufacturing & Site Delivery: ${deliveryWeeks} Weeks (Expected Delivery: ${formatDate(milestones[2].dateEnd)})
• Shaft Mechanical & Electrical Installation: ${installationWeeks} Weeks
• Commissioning, Civil Defense & Handover: Week ${totalWeeksToHandover} (Target: ${formatDate(milestones[4].dateEnd)})
• Comprehensive Warranty & Free Maintenance: ${warrantyMonths} Months (${(warrantyMonths / 12).toFixed(1)} Years) until ${formatDate(milestones[5].dateEnd)}
• Specs: ${stops} Stops | Capacity: ${spec.capacityKg || 450} kg | Speed: ${spec.ratedSpeed || 1.0} m/s
══════════════════════════════════════════════════
* Milestone schedule based on approved engineering parameters.`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div id="project-visual-timeline-schedule" className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAr ? 'الجدول الزمني ومراحل التوريد والضمان' : 'Lead Time & Milestone Schedule'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{isAr ? `تسليم الموقع: ${deliveryWeeks} أسابيع` : `Delivery: ${deliveryWeeks} wks`}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                <span>{isAr ? `الضمان: ${warrantyMonths} شهراً` : `Warranty: ${warrantyMonths} mo`}</span>
              </span>
            </div>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>{isAr ? 'الخطة الزمنية للتنفيذ والتسليم' : 'Project Delivery & Warranty Timeline'}</span>
              <span className="text-slate-400 text-xs font-normal">
                ({spec.projectName || (isAr ? 'المشروع' : 'Project')} - {spec.quoteRef})
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
              {isAr 
                ? `مخطط زمني تفاعلي يربط مدة التوريد المعتمدة (${deliveryWeeks} أسابيع) وفترة الضمان (${warrantyMonths} شهراً) بمراحل إنجاز واضحة لتسهيل شرح المواعيد للعميل.`
                : `Interactive roadmap mapping delivery lead time (${deliveryWeeks} wks) and warranty duration (${warrantyMonths} mo) into client-ready milestones.`}
            </p>
          </div>

          {/* Quick Action Button: Copy Client Pitch */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-copy-timeline-summary"
              type="button"
              onClick={handleCopySummary}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
              title={isAr ? 'نسخ ملخص المواعيد للعميل' : 'Copy Client Lead Time Summary'}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ ملخص المواعيد للعميل' : 'Copy Client Schedule')}</span>
            </button>
          </div>
        </div>

        {/* Lead Times Quick Sliders / Modifiers (Allows direct adjustment right in the timeline) */}
        {onUpdateSpec && (
          <div className="mt-4 pt-3 border-t border-slate-700/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl">
            <div>
              <label htmlFor="quick-delivery-weeks" className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                <span>{isAr ? 'مدة التوريد (أسابيع)' : 'Delivery Lead Time'}</span>
                <span className="font-mono text-amber-400 font-bold">{deliveryWeeks} {isAr ? 'أسبوع' : 'wks'}</span>
              </label>
              <input
                id="quick-delivery-weeks"
                type="range"
                min={2}
                max={20}
                step={1}
                value={deliveryWeeks}
                onChange={(e) => onUpdateSpec({ deliveryWeeks: parseInt(e.target.value) || 6 })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                <span>2 {isAr ? 'سريع' : 'fast'}</span>
                <span>6-8 {isAr ? 'قياسي' : 'std'}</span>
                <span>20 {isAr ? 'مصنع' : 'heavy'}</span>
              </div>
            </div>

            <div>
              <label htmlFor="quick-warranty-months" className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                <span>{isAr ? 'مدة الضمان الشامل' : 'Warranty Duration'}</span>
                <span className="font-mono text-purple-300 font-bold">{warrantyMonths} {isAr ? 'شهراً' : 'mo'}</span>
              </label>
              <input
                id="quick-warranty-months"
                type="range"
                min={6}
                max={60}
                step={6}
                value={warrantyMonths}
                onChange={(e) => onUpdateSpec({ warrantyMonths: parseInt(e.target.value) || 24 })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                <span>6 {isAr ? 'أشهر' : 'mo'}</span>
                <span>24 (سنتين)</span>
                <span>60 (5 سنوات)</span>
              </div>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80 flex flex-col justify-center">
              <span className="text-[11px] text-slate-400 font-medium">
                {isAr ? 'التسليم الميداني المتوقع للموقع' : 'Target Site Delivery Date'}
              </span>
              <span className="text-xs font-bold text-amber-300 font-mono mt-0.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                {formatDate(milestones[2].dateEnd)}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80 flex flex-col justify-center">
              <span className="text-[11px] text-slate-400 font-medium">
                {isAr ? 'تاريخ التشغيل والتسليم النهائي' : 'Commissioning & Handover'}
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {formatDate(milestones[4].dateEnd)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Milestone Bar / Progress Stepper */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'المسار الزمني المترابط للمشروع (انقر على أي مرحلة لعرض تفاصيلها):' : 'Project Milestones Track (Click any phase for detailed view):'}</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {isAr 
              ? `إجمالي زمن المشروع حتى التسليم: ${totalWeeksToHandover} أسبوعاً` 
              : `Total duration to handover: ${totalWeeksToHandover} weeks`}
          </span>
        </div>

        {/* Milestone Steps Responsive Grid / Flow */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {milestones.map((m, idx) => {
            const isSelected = m.id === selectedMilestoneId;
            const Icon = m.icon;

            return (
              <button
                key={m.id}
                id={`btn-milestone-${m.id}`}
                type="button"
                onClick={() => setSelectedMilestoneId(m.id)}
                className={`text-start p-3 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20 translate-y-[-2px]'
                    : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                {/* Step Number & Icon */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                    isSelected ? `${m.color.bg} text-white` : 'bg-slate-100 text-slate-700'
                  }`}>
                    {m.phaseNumber}
                  </div>
                  <Icon className={`w-4 h-4 ${isSelected ? m.color.text : 'text-slate-400'}`} />
                </div>

                {/* Title & Badge */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-slate-500 mb-0.5">
                    {isAr ? m.badgeAr : m.badgeEn}
                  </div>
                  <div className={`text-xs font-bold leading-snug line-clamp-2 ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {isAr ? m.titleAr : m.titleEn}
                  </div>
                </div>

                {/* Estimated Completion Date */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>{isAr ? 'حتى:' : 'By:'}</span>
                  <span className={`font-semibold ${isSelected ? m.color.text : 'text-slate-600'}`}>
                    {formatDate(m.dateEnd).split(' ')[0]} {formatDate(m.dateEnd).split(' ')[1]}
                  </span>
                </div>

                {/* Active Indicator Arrow */}
                {isSelected && (
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Milestone Detail Card */}
      <div className="p-4 sm:p-6 bg-white">
        <div className={`rounded-xl border p-4 sm:p-5 ${activeMilestone.color.lightBg} border-slate-200`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white ${activeMilestone.color.bg} shadow-sm shrink-0`}>
                {React.createElement(activeMilestone.icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeMilestone.color.badgeBg}`}>
                    {isAr ? `المرحلة ${activeMilestone.phaseNumber}: ${activeMilestone.badgeAr}` : `Phase ${activeMilestone.phaseNumber}: ${activeMilestone.badgeEn}`}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatDate(activeMilestone.dateStart)} &rarr; {formatDate(activeMilestone.dateEnd)}
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 mt-1">
                  {isAr ? activeMilestone.titleAr : activeMilestone.titleEn}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">{isAr ? 'المسؤولية التنفيذية:' : 'Responsibility:'}</span>
              <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {isAr ? activeMilestone.responsibilityAr : activeMilestone.responsibilityEn}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 text-xs">
            {/* Action Items List */}
            <div className="md:col-span-2 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'المهام والخطوات الفنية المشمولة في هذه المرحلة:' : 'Tasks & Technical Steps Covered in this Phase:'}</span>
              </div>
              <ul className="space-y-1.5 pr-1">
                {(isAr ? activeMilestone.detailsAr : activeMilestone.detailsEn).map((detail, dIdx) => (
                  <li key={dIdx} className="flex items-start gap-2 text-slate-700 bg-white/70 p-2 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Deliverables & Client Benefit */}
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {isAr ? 'المخرجات والوثائق الرسمية المستلمة' : 'Formal Deliverables & Proof'}
                </div>
                <div className="font-bold text-slate-800 text-xs">
                  {isAr ? activeMilestone.deliverablesAr : activeMilestone.deliverablesEn}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {isAr ? 'نصيحة التواصل مع العميل (Client Pitch)' : 'Client Communication Tip'}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed italic">
                  {activeMilestone.id === 'm-delivery'
                    ? (isAr 
                        ? `«خلال ${deliveryWeeks} أسابيع، ستكون معدات المصعد كاملة بالموقع لتفادي أي تأخير في تشطيبات المبنى، مع ضمان أصالة المكونات الأوروبية/السعودية المعتمدة.»`
                        : `"Within ${deliveryWeeks} weeks, all elevator assemblies arrive on-site, preventing architectural finishing delays."`)
                    : activeMilestone.id === 'm-warranty'
                    ? (isAr 
                        ? `«نضمن لك راحة بال تامة لمدة ${warrantyMonths} شهراً بصيانة شهرية مجانية وقطع غيار أصيلة مجانية وفريق طوارئ 24/7 دون أي تكاليف خفية.»`
                        : `"Enjoy ${warrantyMonths} months of worry-free operation with free scheduled visits and genuine parts."`)
                    : (isAr 
                        ? `«نلتزم بتطبيق المعايير القياسية مع توثيق مراحل العمل ومشاركتها معك خطوة بخطوة.»`
                        : `"Strict adherence to engineering timelines with weekly transparency reports."`)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Client Lead Time Communication Explainer */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowLeadTimeExplainer(!showLeadTimeExplainer)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors py-1"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span>{isAr ? 'كيف تشرح مدد التوريد والضمان للعميل بفعالية؟' : 'How to Communicate Lead Times & Warranty Value to Clients'}</span>
            </span>
            {showLeadTimeExplainer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLeadTimeExplainer && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{isAr ? '1. التوريد خلال أسابيع واضحة' : '1. Clear Delivery Lead Time'}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isAr 
                    ? `تحديد ${deliveryWeeks} أسابيع للتوريد يمنح العميل يقيناً لجدولة مقاولي التشطيبات، الدهانات، ورصف الأرضيات.`
                    : `Specifying ${deliveryWeeks} weeks lets contractors sync floor tiling and entrance masonry.`}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{isAr ? '2. تسليم معتمد للدفاع المدني' : '2. Certified Civil Defense Handover'}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isAr 
                    ? 'تسليم شهادة السلامة يضمن للعميل استخراج شهادة إتمام البناء وإطلاق التيار الكهربائي الدائم بدون تعقيدات.'
                    : 'Safety certification guarantees client receives building occupancy permits without delay.'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>{isAr ? `3. الضمان الممتد (${warrantyMonths} شهر)` : `3. Extended ${warrantyMonths}-Mo Warranty`}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isAr 
                    ? `الضمان الشامل لـ ${warrantyMonths} شهراً يوفر على العميل تكاليف الصيانة الدورية وقطع الغيار ويبرهن على ثقة الشركة بجودة منتجاتها.`
                    : `Full ${warrantyMonths}-month warranty proves product confidence and saves thousands in upkeep.`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
