export type MaintenanceVisitStatus = 'Scheduled' | 'Completed' | 'In_Progress' | 'Pending' | 'Missed';

export type MaintenanceContractType = 
  | 'PREVENTIVE_STANDARD'    // صيانة وقائية دورية معتادة
  | 'COMPREHENSIVE_PARTS'    // صيانة شاملة قطع الغيار
  | 'SEMI_COMPREHENSIVE'     // صيانة نصف شاملة
  | 'EMERGENCY_24_7';        // صيانة طوارئ وخدمة 24/7

export type MaintenanceContractStatus = 
  | 'Draft'                  // مسودة عرض سعر صيانة
  | 'Sent'                   // تم إرسال العرض للعميل
  | 'Approved'               // معتمد ومقبول
  | 'Active'                 // عقد صيانة ساري وموقع
  | 'Completed'              // عقد منتهي
  | 'Cancelled';             // ملغى

export interface MaintenanceInspectionItem {
  id: string;
  category: string;
  categoryAr: string;
  itemAr: string;
  itemEn: string;
  status: 'Pass' | 'Attention' | 'Fail' | 'NA';
  notes?: string;
}

export interface MaintenanceVisitReview {
  visitId: string;
  visitNumber: number;
  scheduledDate: string; // YYYY-MM-DD
  actualDate?: string;    // YYYY-MM-DD
  technicianName: string;
  technicianPhone?: string;
  status: MaintenanceVisitStatus;
  elevatorCondition: 'Excellent' | 'Good' | 'Needs_Attention' | 'Critical';
  checklist: MaintenanceInspectionItem[];
  workPerformed: string;
  partsReplaced?: string;
  clientRepresentative?: string;
  clientFeedback?: string;
  clientSigned: boolean;
  technicianNotes?: string;
  notes?: string;
  updatedAt?: string;
}

export interface MaintenanceVisit {
  id: string;
  visitNumber: number;        // 1, 2, 3...
  monthLabel: string;         // e.g. "الشهر 1 - يناير 2025"
  scheduledDate: string;      // YYYY-MM-DD
  status: MaintenanceVisitStatus;
  technician: string;
  technicianId?: string;
  assignedTechnicianId?: string;
  technicianPhone?: string;
  review?: MaintenanceVisitReview;
}

export type BreakdownStatus = 'Reported' | 'Assigned' | 'In_Progress' | 'Resolved' | 'Requires_Parts';
export type BreakdownPriority = 'Low' | 'Medium' | 'High' | 'Emergency';
export type BreakdownCustomerType = 'CONTRACT' | 'ONE_TIME'; // عقد صيانة أو إصلاح لمرة واحدة

export interface MaintenanceBreakdown {
  id: string;
  contractId?: string;       // Linked maintenance contract if applicable
  projectId?: string;        // Linked project if applicable
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerType?: BreakdownCustomerType; // نوع العميل: 'CONTRACT' (عقد صيانة) أو 'ONE_TIME' (إصلاح لمرة واحدة)
  siteLocation: string;
  elevatorName: string;      
  elevatorNumber?: string;   // رقم كود المصعد
  reportedAt: string;        // ISO Date Time
  resolvedAt?: string;       // ISO Date Time
  description: string;       // Description of the fault
  status: BreakdownStatus;
  priority: BreakdownPriority;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianPhone?: string;
  technicianNotes?: string;
  partsRequired?: string;
  workPerformed?: string;    // تفاصيل الإصلاح المنفذ
  cost?: number;             // Optional cost if not covered by warranty/contract
  isResolved: boolean;
  recordedBy?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  clientSignatureDataUrl?: string;
  partsVouchers?: DamagedPartsVoucher[];
}

export interface DamagedPartItem {
  id: string;
  partName: string;
  partCode?: string;
  quantity: number;
  damageReason: string;
  urgency: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'NORMAL';
  unitCostEstimate?: number;
  photoUrl?: string;
  photoTimestamp?: string;
}

export interface DamagedPartsVoucher {
  id: string;
  voucherNumber: string;
  breakdownId?: string;
  visitId?: string;
  contractId?: string;
  elevatorId?: string;
  elevatorName: string;
  buildingName: string;
  customerName: string;
  customerPhone?: string;
  technicianId: string;
  technicianName: string;
  requestDate: string;
  status: 'ISSUED' | 'DISPATCHED_TO_WAREHOUSE' | 'APPROVED' | 'FULFILLED';
  items: DamagedPartItem[];
  technicianSignature?: string;
  customerSignature?: string;
  customerRepName?: string;
  generalNotes?: string;
  createdAt: string;
}

export interface MaintenanceContract {
  id: string;
  contractRef: string;        // e.g. "MNT-2025-001"
  contractNumber?: string;    // Alias for contractRef
  elevatorNumber?: string;    // رقم كود المصعد (عقد صيانة جديد، مثلاً MNT-202609-001)
  isContract: boolean;        // true = Maintenance Contract, false = Maintenance Quotation
  title: string;              // e.g. "عقد صيانة مصعد برج الأندلس"
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCompany?: string;
  assignedSalesRepId?: string;
  assignedSalesRepName?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianPhone?: string;
  siteLocation: string;
  latitude?: number;
  longitude?: number;
  elevatorProjectId?: string; // Linked project id
  elevatorName: string;       // e.g. "مصعد الركاب الرئيسي - MRL 8 ركاب"
  elevatorBrand?: string;     // e.g. "Twins / Fuji / Sicor"
  elevatorStops?: number;     // e.g. 6 stops
  elevatorCapacityKg?: number;// e.g. 630 kg
  contractType: MaintenanceContractType;
  status: MaintenanceContractStatus;
  totalPrice: number;         // SAR
  paymentFrequency: 'Monthly' | 'Quarterly' | 'Biannual' | 'Annual';
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD
  annualVisitsCount: number;  // e.g. 12
  visits: MaintenanceVisit[];
  emergencyCoverage: boolean; // 24/7 breakdown callouts included
  responseTimeHours: number;  // e.g. 2 hours
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_INSPECTION_CHECKLIST: Omit<MaintenanceInspectionItem, 'notes'>[] = [
  {
    id: 'chk-1',
    category: 'Machine Room',
    categoryAr: 'غرفة المحرك والماكينة',
    itemAr: 'فحص المحرك وأقراص الجر (Traction Sheave) وخلوها من التآكل وتسريب الزيوت',
    itemEn: 'Inspection of traction motor, sheave wear, and absence of oil leaks',
    status: 'Pass',
  },
  {
    id: 'chk-2',
    category: 'Safety & Brakes',
    categoryAr: 'الفرامل وأنظمة الأمان',
    itemAr: 'اختبار الفرامل الكهروميكانيكية وبطانة الاحتكاك وسرعة استجابة فتح الفرملة',
    itemEn: 'Testing electromechanical brake clearance, lining wear, and release response',
    status: 'Pass',
  },
  {
    id: 'chk-3',
    category: 'Ropes & Travelling Cable',
    categoryAr: 'حبال الجر والكابل المرن',
    itemAr: 'فحص حبال الجر الفولاذية (Traction Ropes) ومعدل التوتر والاهتراء والكابل المرن',
    itemEn: 'Check traction wire ropes tension, elongation, and travelling cable integrity',
    status: 'Pass',
  },
  {
    id: 'chk-4',
    category: 'Door Mechanisms',
    categoryAr: 'أبواب الكابينة والأبواب الخارجية',
    itemAr: 'فحص محرك باب الكابينة (Door Operator) والأحزمة ومستوى سلاسة الفتح والإغلاق',
    itemEn: 'Check car door operator, belts, rollers, and smooth opening/closing cycle',
    status: 'Pass',
  },
  {
    id: 'chk-5',
    category: 'Door Interlocks',
    categoryAr: 'كوالين وشوكات الأبواب الخارجية',
    itemAr: 'فحص أقفال وشوكات الأبواب الخارجية (Landing Door Locks) والتأكد من القفل الميكانيكي والكهربائي في كل دور',
    itemEn: 'Inspect landing door mechanical locks, electrical contacts and interlocks at all floors',
    status: 'Pass',
  },
  {
    id: 'chk-6',
    category: 'Safety Gear & Governor',
    categoryAr: 'منظم السرعة ومكابح الطوارئ',
    itemAr: 'فحص منظم السرعة (Speed Governor) وحبل البراشوت ومفتاح الأمان الكهربائي',
    itemEn: 'Inspection of overspeed governor, safety gear linkages, and safety switch',
    status: 'Pass',
  },
  {
    id: 'chk-7',
    category: 'Rails & Lubrication',
    categoryAr: 'سكك التوجيه والمشاحم',
    itemAr: 'تزييت وفحص سكك توجيه الكابينة وثقل الموازنة وأحذية الانزلاق (Guide Shoes)',
    itemEn: 'Lubrication and inspection of car and counterweight guide rails & guide shoes',
    status: 'Pass',
  },
  {
    id: 'chk-8',
    category: 'Cabin & COP',
    categoryAr: 'لوحة التحكم وأزرار الكابينة',
    itemAr: 'فحص أزرار لوحة الكابينة (COP) ومؤشرات الأدوار والإنارة وزر طلب النجدة',
    itemEn: 'Inspect COP buttons, floor indicators, cabin lighting, and emergency bell',
    status: 'Pass',
  },
  {
    id: 'chk-9',
    category: 'Pit & Buffers',
    categoryAr: 'بئر المصعد والمصدات',
    itemAr: 'تنظيف قاع البئر وفحص مفتاح التوقف ومصدات الزيت (Oil Buffers) ومفتاح الشد',
    itemEn: 'Inspect pit stop switch, oil buffers, counterweight clearance, and cleanliness',
    status: 'Pass',
  },
  {
    id: 'chk-10',
    category: 'Emergency & ARD',
    categoryAr: 'جهاز الإنقاذ الأوتوماتيكي والاتصال',
    itemAr: 'اختبار بطاريات جهاز الطوارئ الأوتوماتيكي (ARD) وجهاز الاتصال الداخلي (Intercom)',
    itemEn: 'Test Automatic Rescue Device (ARD) batteries and emergency two-way intercom',
    status: 'Pass',
  },
];

export const CONTRACT_TYPE_CONFIG: Record<MaintenanceContractType, {
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  badgeClass: string;
}> = {
  PREVENTIVE_STANDARD: {
    labelAr: 'صيانة وقائية دورية معتادة',
    labelEn: 'Standard Preventive Maintenance',
    descriptionAr: 'زيارات شهرية دورية للفحص والتشحيم والضبط، دون تغطية تكلفة قطع الغيار المستبدلة.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  COMPREHENSIVE_PARTS: {
    labelAr: 'صيانة شاملة قطع الغيار',
    labelEn: 'Comprehensive with Spare Parts',
    descriptionAr: 'تغطية كاملة للزيارات الدورية وبلاغات الأعطال مع تحمل تكلفة استبدال قطع الغيار التالفة.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  SEMI_COMPREHENSIVE: {
    labelAr: 'صيانة نصف شاملة',
    labelEn: 'Semi-Comprehensive Maintenance',
    descriptionAr: 'تشمل الزيارات الدورية واستبدال القطع الاستهلاكية البسيطة (لمبات، زيوت، شحوم، فحمات).',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  EMERGENCY_24_7: {
    labelAr: 'صيانة طوارئ وخدمة VIP 24/7',
    labelEn: '24/7 Emergency & VIP Care',
    descriptionAr: 'استجابة فورية خلال 30 دقيقة على مدار الساعة للمستشفيات والأبراج والفنادق الحيوية.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

export const CONTRACT_STATUS_CONFIG: Record<MaintenanceContractStatus, {
  labelAr: string;
  labelEn: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}> = {
  Active: {
    labelAr: 'عقد ساري وموقّع',
    labelEn: 'Active Contract',
    bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    textClass: 'text-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  Approved: {
    labelAr: 'معتمد ومقبول',
    labelEn: 'Approved Proposal',
    bgClass: 'bg-blue-100 text-blue-800 border-blue-300',
    textClass: 'text-blue-800',
    dotClass: 'bg-blue-500',
  },
  Sent: {
    labelAr: 'تم الإرسال للعميل',
    labelEn: 'Sent to Client',
    bgClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    textClass: 'text-indigo-800',
    dotClass: 'bg-indigo-500',
  },
  Draft: {
    labelAr: 'مسودة عرض سعر',
    labelEn: 'Draft Proposal',
    bgClass: 'bg-amber-100 text-amber-800 border-amber-300',
    textClass: 'text-amber-800',
    dotClass: 'bg-amber-500',
  },
  Completed: {
    labelAr: 'عقد منتهي',
    labelEn: 'Expired / Completed',
    bgClass: 'bg-slate-100 text-slate-800 border-slate-300',
    textClass: 'text-slate-800',
    dotClass: 'bg-slate-500',
  },
  Cancelled: {
    labelAr: 'ملغى',
    labelEn: 'Cancelled',
    bgClass: 'bg-rose-100 text-rose-800 border-rose-300',
    textClass: 'text-rose-800',
    dotClass: 'bg-rose-500',
  },
};

export const VISIT_STATUS_CONFIG: Record<MaintenanceVisitStatus, {
  labelAr: string;
  labelEn: string;
  badgeClass: string;
  dotClass: string;
}> = {
  Completed: {
    labelAr: 'منجزة وموثقة',
    labelEn: 'Completed',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  Scheduled: {
    labelAr: 'مجدولة قادمة',
    labelEn: 'Scheduled',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  In_Progress: {
    labelAr: 'قيد التنفيذ الآن',
    labelEn: 'In Progress',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  Pending: {
    labelAr: 'معلقة / مؤجلة',
    labelEn: 'Pending / Delayed',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-500',
  },
  Missed: {
    labelAr: 'فائتة / غير منجزة',
    labelEn: 'Missed',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
  },
};

const getSampleIsoDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const SAMPLE_BREAKDOWNS: MaintenanceBreakdown[] = [
  {
    id: 'brk-001',
    contractId: 'mnt-contract-001',
    customerName: 'شركة الأندلس العقارية',
    customerPhone: '+966 50 123 4567',
    customerType: 'CONTRACT',
    siteLocation: 'الرياض - حي العليا - طريق الملك فهد',
    elevatorName: 'مصعد الركاب الرئيسي - MRL سرعة 1.6 م/ث',
    elevatorNumber: 'MNT-202609-001',
    reportedAt: getSampleIsoDate(-1) + 'T08:30:00Z',
    description: 'المصعد متوقف في الدور الرابع والباب لا يفتح، يوجد أصوات احتكاك عند محاولة النزول.',
    status: 'In_Progress',
    priority: 'High',
    assignedTechnicianId: 'emp-tech',
    assignedTechnicianName: 'Twins Technician',
    workPerformed: 'فحص ميكانيكي لمحرك الباب وتزييت المسارات وسكك التوجيه.',
    isResolved: false,
  },
  {
    id: 'brk-002',
    contractId: 'mnt-contract-002',
    customerName: 'مؤسسة الملك فهد العقارية',
    customerPhone: '+966 55 987 6543',
    customerType: 'CONTRACT',
    siteLocation: 'جدة - حي الحمراء - كورنيش جدة',
    elevatorName: 'مصعد بانوراما زجاجي 10 ركاب',
    elevatorNumber: 'MNT-202609-002',
    reportedAt: getSampleIsoDate(-5) + 'T14:15:00Z',
    resolvedAt: getSampleIsoDate(-4) + 'T10:00:00Z',
    description: 'توقف مفاجئ للمصعد واحتجاز شخصين بالداخل.',
    status: 'Resolved',
    priority: 'Emergency',
    assignedTechnicianId: 'emp-tech',
    assignedTechnicianName: 'Twins Technician',
    technicianNotes: 'تم فك الاحتجاز خلال 20 دقيقة، المشكلة كانت في حساس الباب وتم إعادة برمجته وتنظيفه.',
    workPerformed: 'إعادة برمجة بطاقة الأمان وتنظيف الحساسات الضوئية واختبار أقفال الأبواب لجميع الوقفات.',
    isResolved: true,
  },
  {
    id: 'brk-003',
    customerName: 'عمارة الياسمين السكنية',
    customerPhone: '+966 59 111 2222',
    customerType: 'ONE_TIME',
    siteLocation: 'الرياض - حي الياسمين - شارع القادسية',
    elevatorName: 'مصعد سكني 6 ركاب (إيطالي)',
    elevatorNumber: 'MNT-202609-003',
    reportedAt: getSampleIsoDate(0) + 'T09:00:00Z',
    description: 'المصعد لا يستجيب للطلبات الخارجية واللوحة مطفأة (بدون عقد صيانة مسبق).',
    status: 'Reported',
    priority: 'Medium',
    assignedTechnicianId: 'emp-tech',
    assignedTechnicianName: 'Twins Technician',
    cost: 450,
    isResolved: false,
  },
  {
    id: 'brk-004',
    contractId: 'mnt-contract-001',
    customerName: 'شركة الأندلس العقارية',
    customerPhone: '+966 50 123 4567',
    customerType: 'CONTRACT',
    siteLocation: 'الرياض - حي العليا - طريق الملك فهد',
    elevatorName: 'مصعد الخدمات والتحميل B1',
    elevatorNumber: 'MNT-202609-001',
    reportedAt: getSampleIsoDate(-3) + 'T11:00:00Z',
    resolvedAt: getSampleIsoDate(-3) + 'T13:45:00Z',
    description: 'عطل في مفتاح نهاية الشوط والفرملة المفاجئة.',
    status: 'Resolved',
    priority: 'High',
    assignedTechnicianId: 'emp-tech',
    assignedTechnicianName: 'Twins Technician',
    workPerformed: 'تم استبدال ميكروسويتش نهاية الشوط وضبط التوقف الدقيق.',
    isResolved: true,
  },
  {
    id: 'brk-005',
    customerName: 'مجمع واحة اليرموك',
    customerPhone: '+966 50 443 2190',
    customerType: 'ONE_TIME',
    siteLocation: 'الرياض - حي اليرموك',
    elevatorName: 'مصعد ركاب فيلا خاصة',
    elevatorNumber: 'MNT-202609-004',
    reportedAt: getSampleIsoDate(-2) + 'T15:20:00Z',
    resolvedAt: getSampleIsoDate(-2) + 'T17:10:00Z',
    description: 'توقف زر الطابق الثاني واهتزاز خفيف بالكابينة.',
    status: 'Resolved',
    priority: 'Medium',
    assignedTechnicianId: 'emp-tech',
    assignedTechnicianName: 'Twins Technician',
    workPerformed: 'تنظيف سكة التوجيه وتغيير زر الطابق الثاني COP.',
    isResolved: true,
  }
];

export const SAMPLE_MAINTENANCE_CONTRACTS: MaintenanceContract[] = [
  {
    id: 'mnt-contract-001',
    contractRef: 'MNT-2026-001',
    elevatorNumber: 'MNT-202609-001',
    isContract: true,
    title: 'عقد صيانة سنوي - برج الأندلس التجاري',
    customerId: 'cust-1',
    customerName: 'شركة الأندلس العقارية',
    customerPhone: '+966 50 123 4567',
    customerEmail: 'info@alandalus.sa',
    customerCompany: 'شركة الأندلس العقارية القابضة',
    siteLocation: 'الرياض - حي العليا - طريق الملك فهد',
    latitude: 24.6980,
    longitude: 46.6850,
    assignedTechnicianId: 'emp-tech',
    assignedTechnicianName: 'Twins Technician',
    elevatorName: 'مصعد الركاب الرئيسي - MRL سرعة 1.6 م/ث',
    elevatorBrand: 'Twins Gearless MRL',
    elevatorStops: 8,
    elevatorCapacityKg: 1000,
    contractType: 'COMPREHENSIVE_PARTS',
    status: 'Active',
    totalPrice: 14500,
    paymentFrequency: 'Quarterly',
    startDate: getSampleIsoDate(-353),
    endDate: getSampleIsoDate(12), // Expiring in 12 days!
    annualVisitsCount: 12,
    emergencyCoverage: true,
    responseTimeHours: 2,
    termsAndConditions: 'يشمل العقد 12 زيارة صيانة وقائية دورية شهرية، مع خدمة طوارئ 24/7 لفك الاحتجاز خلال 30 دقيقة، وتأمين قطع الغيار الأصلية.',
    createdAt: getSampleIsoDate(-355),
    updatedAt: getSampleIsoDate(-10),
    visits: [
      {
        id: 'v-001-1',
        visitNumber: 1,
        monthLabel: 'الشهر 1',
        scheduledDate: getSampleIsoDate(-330),
        status: 'Completed',
        technician: 'م. أحمد السعيد',
        review: {
          visitId: 'v-001-1',
          visitNumber: 1,
          scheduledDate: getSampleIsoDate(-330),
          actualDate: getSampleIsoDate(-330),
          technicianName: 'م. أحمد السعيد',
          technicianPhone: '+966 55 111 2233',
          status: 'Completed',
          elevatorCondition: 'Excellent',
          checklist: DEFAULT_INSPECTION_CHECKLIST.map((item) => ({ ...item, status: 'Pass' })),
          workPerformed: 'تم تنظيف محرك المصعد وفحص بطانات الفرامل، تزييت سكك الكابينة وثقل الموازنة، فحص حساسية الستارة الضوئية للأبواب.',
          partsReplaced: 'استبدال لمبات إضاءة الطوارئ داخل الكابينة (LED)',
          clientRepresentative: 'أ. خالد التميمي (مدير التشغيل)',
          clientFeedback: 'الخدمة ممتازة والمصعد يعمل بسلاسة وهدوء فائق.',
          clientSigned: true,
          technicianNotes: 'المصعد بحالة فنية ممتازة وتم إنجاز جميع بنود الفحص الوقائي.',
          updatedAt: getSampleIsoDate(-330),
        },
      },
      {
        id: 'v-001-2',
        visitNumber: 2,
        monthLabel: 'الشهر 2',
        scheduledDate: getSampleIsoDate(-300),
        status: 'Completed',
        technician: 'م. حسام الدين',
      },
      {
        id: 'v-001-3',
        visitNumber: 3,
        monthLabel: 'الشهر 3',
        scheduledDate: getSampleIsoDate(-270),
        status: 'Completed',
        technician: 'م. أحمد السعيد',
      },
      {
        id: 'v-001-4',
        visitNumber: 4,
        monthLabel: 'الشهر 4',
        scheduledDate: getSampleIsoDate(-240),
        status: 'Completed',
        technician: 'م. حسام الدين',
      },
      {
        id: 'v-001-5',
        visitNumber: 5,
        monthLabel: 'الشهر 5',
        scheduledDate: getSampleIsoDate(-210),
        status: 'Completed',
        technician: 'م. أحمد السعيد',
      },
      {
        id: 'v-001-6',
        visitNumber: 6,
        monthLabel: 'الشهر 6',
        scheduledDate: getSampleIsoDate(-180),
        status: 'Completed',
        technician: 'م. حسام الدين',
      },
      {
        id: 'v-001-7',
        visitNumber: 7,
        monthLabel: 'الشهر 7',
        scheduledDate: getSampleIsoDate(-150),
        status: 'Completed',
        technician: 'م. أحمد السعيد',
      },
      {
        id: 'v-001-8',
        visitNumber: 8,
        monthLabel: 'الشهر 8',
        scheduledDate: getSampleIsoDate(-120),
        status: 'Completed',
        technician: 'م. حسام الدين',
      },
      {
        id: 'v-001-9',
        visitNumber: 9,
        monthLabel: 'الشهر 9',
        scheduledDate: getSampleIsoDate(-90),
        status: 'Completed',
        technician: 'م. أحمد السعيد',
      },
      {
        id: 'v-001-10',
        visitNumber: 10,
        monthLabel: 'الشهر 10',
        scheduledDate: getSampleIsoDate(-60),
        status: 'Completed',
        technician: 'م. حسام الدين',
      },
      {
        id: 'v-001-11',
        visitNumber: 11,
        monthLabel: 'الشهر 11',
        scheduledDate: getSampleIsoDate(-30),
        status: 'Completed',
        technician: 'م. أحمد السعيد',
      },
      {
        id: 'v-001-12',
        visitNumber: 12,
        monthLabel: 'الشهر 12 (الزيارة الختامية)',
        scheduledDate: getSampleIsoDate(8),
        status: 'Scheduled',
        technician: 'م. حسام الدين',
      },
    ],
  },
  {
    id: 'mnt-contract-002',
    contractRef: 'MNT-2026-008',
    elevatorNumber: 'MNT-202609-002',
    isContract: true,
    title: 'عقد صيانة دورية - مجمع الملك فهد السكني',
    customerName: 'مؤسسة الملك فهد العقارية',
    customerPhone: '+966 55 987 6543',
    customerEmail: 'mgmt@kf-residence.sa',
    customerCompany: 'مجموعة الفهد العقارية',
    siteLocation: 'جدة - حي الحمراء - كورنيش جدة',
    latitude: 21.5292,
    longitude: 39.1560,
    assignedTechnicianId: 'emp-tech',
    assignedTechnicianName: 'Twins Technician',
    elevatorName: 'مصعد بانوراما زجاجي 10 ركاب',
    elevatorBrand: 'Fuji Panoramic VVVF',
    elevatorStops: 6,
    elevatorCapacityKg: 800,
    contractType: 'SEMI_COMPREHENSIVE',
    status: 'Active',
    totalPrice: 16800,
    paymentFrequency: 'Quarterly',
    startDate: getSampleIsoDate(-340),
    endDate: getSampleIsoDate(25), // Expiring in 25 days!
    annualVisitsCount: 12,
    emergencyCoverage: true,
    responseTimeHours: 1.5,
    termsAndConditions: 'عقد صيانة مصعد بانوراما يشمل تلميع الواجهات الزجاجية وتشحيم السكك والقطع الاستهلاكية.',
    createdAt: getSampleIsoDate(-342),
    updatedAt: getSampleIsoDate(-15),
    visits: [
      {
        id: 'v-002-1',
        visitNumber: 1,
        monthLabel: 'الشهر 1',
        scheduledDate: getSampleIsoDate(-320),
        status: 'Completed',
        technician: 'م. حسام الدين',
      },
      {
        id: 'v-002-12',
        visitNumber: 12,
        monthLabel: 'الشهر 12 (الزيارة الختامية)',
        scheduledDate: getSampleIsoDate(20),
        status: 'Scheduled',
        technician: 'م. أحمد السعيد',
      },
    ],
  },
  {
    id: 'mnt-contract-003',
    contractRef: 'MNT-2026-015',
    isContract: true,
    title: 'عقد صيانة سنوي - برج الفيصلية للأعمال',
    customerName: 'شركة الفيصلية القابضة',
    customerPhone: '+966 56 333 4444',
    customerEmail: 'service@faisaliah-holding.sa',
    customerCompany: 'شركة الفيصلية القابضة',
    siteLocation: 'الرياض - حي العليا',
    latitude: 24.7050,
    longitude: 46.6800,
    elevatorName: 'مصعد شحن وحمولة ثقيلة 2000 كجم',
    elevatorBrand: 'Twins Freight Heavy Duty',
    elevatorStops: 12,
    elevatorCapacityKg: 2000,
    contractType: 'COMPREHENSIVE_PARTS',
    status: 'Active',
    totalPrice: 24000,
    paymentFrequency: 'Biannual',
    startDate: getSampleIsoDate(-60),
    endDate: getSampleIsoDate(305), // Healthy contract (~10 months left)
    annualVisitsCount: 12,
    emergencyCoverage: true,
    responseTimeHours: 1,
    termsAndConditions: 'عقد صيانة شامل مصاعد الشحن والخدمات.',
    createdAt: getSampleIsoDate(-65),
    updatedAt: getSampleIsoDate(-2),
    visits: [
      {
        id: 'v-003-1',
        visitNumber: 1,
        monthLabel: 'الشهر 1',
        scheduledDate: getSampleIsoDate(-30),
        status: 'Completed',
        technician: 'م. أحمد السعيد',
      },
      {
        id: 'v-003-2',
        visitNumber: 2,
        monthLabel: 'الشهر 2',
        scheduledDate: getSampleIsoDate(1),
        status: 'Scheduled',
        technician: 'م. حسام الدين',
      },
    ],
  },
  {
    id: 'mnt-quote-004',
    contractRef: 'MNT-QT-2026-014',
    isContract: false,
    title: 'عرض سعر صيانة وقائية - مجمع النخيل الطبي',
    customerName: 'مجمع النخيل الطبي التخصصي',
    customerPhone: '+966 54 888 9900',
    customerEmail: 'facilities@alnakheel-med.sa',
    customerCompany: 'شركة النخيل الطبية',
    siteLocation: 'الرياض - حي النخيل',
    latitude: 24.7520,
    longitude: 46.6340,
    elevatorName: 'مصعد نقالات المرضى (Bed Lift) حمولة 1600 كجم',
    elevatorBrand: 'Sicor Traction VVVF',
    elevatorStops: 5,
    elevatorCapacityKg: 1600,
    contractType: 'EMERGENCY_24_7',
    status: 'Sent',
    totalPrice: 18000,
    paymentFrequency: 'Biannual',
    startDate: getSampleIsoDate(10),
    endDate: getSampleIsoDate(375),
    annualVisitsCount: 12,
    emergencyCoverage: true,
    responseTimeHours: 1,
    termsAndConditions: 'عقد استجابة سريعة VIP للمنشآت الطبية، يشمل فحوصات أسبوعية للأمان ومفتاح الطوارئ وبطاريات ARD.',
    createdAt: getSampleIsoDate(-5),
    updatedAt: getSampleIsoDate(-1),
    visits: [
      {
        id: 'v-004-1',
        visitNumber: 1,
        monthLabel: 'الشهر 1',
        scheduledDate: getSampleIsoDate(20),
        status: 'Scheduled',
        technician: 'فريق صيانة الطوارئ الطبية',
      },
    ],
  },
];
