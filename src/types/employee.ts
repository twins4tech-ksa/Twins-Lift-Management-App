import { UserPortalRole } from './portal';

export type EmployeeRole = 
  | 'SALES_REP'           // مندوب مبيعات وتسويق مشاريع
  | 'MAINTENANCE_TECH'    // فني صيانة ميداني
  | 'INSTALLATION_ENG'    // مهندس تركيبات ومشرف مواقع
  | 'PROJECT_MANAGER'     // مدير مشاريع وتسليم
  | 'MAINTENANCE_MGR'     // مدير إدارة الصيانة والتشغيل
  | 'ACCOUNTANT'          // محاسب مالي ومسؤول عمولات
  | 'GENERAL_MGR'         // مدير عام / إدارة عليا وتنفيذية
  | 'HR_OFFICER'          // مسؤول شؤون موظفين وموارد بشرية
  | 'CUSTOMER_SERVICE'    // خدمة عملاء ودعم فني واستقبال
  | 'WAREHOUSE_KEEPER'    // أمين مستودع وقطع غيار
  | 'SAFETY_INSPECTOR';   // مفتش جودة وسلامة مهنية

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

export interface EmployeePortalUser {
  hasAccount: boolean;
  userId?: string;
  username?: string;
  email?: string;
  password?: string;
  portalRole?: UserPortalRole;
  isActive?: boolean;
  userTitle?: string;
  lastLogin?: string;
  canViewAllDepartmentRecords?: boolean; // إمكانية مشاهدة كافة سجلات القسم المصرح به
}

export interface Employee {
  id: string;
  code: string;               // e.g. "REP-101", "TECH-201"
  name: string;               // Arabic Full Name e.g. "م. أحمد كمال الغامدي"
  nameEn?: string;            // English Name e.g. "Eng. Ahmed Al-Ghamdi"
  role: EmployeeRole;
  phone: string;              // Mobile phone e.g. "+966 50 123 4567"
  email: string;              // Work email
  nationalIdOrIqama?: string; // رقم الهوية الوطنية / الإقامة
  nationality?: string;       // الجنسية
  status: EmployeeStatus;
  joinDate: string;           // YYYY-MM-DD
  avatarBg?: string;          // Tailwind color class e.g. "bg-blue-600"

  // Portal & System User Account (حساب مستخدم النظام وبوابة الدخول)
  portalUser?: EmployeePortalUser;

  // For Sales Representatives (المناديب)
  commissionRate?: number;    // % e.g. 2.5
  monthlyTargetSar?: number;  // SAR e.g. 250000
  monthlyTargetElevators?: number; // e.g. 3
  territory?: string;         // e.g. "شمال ووسط الرياض"

  // For Maintenance Technicians (فنيو الصيانة)
  technicianSpecialty?: string; // e.g. "كهرباء ولوحات تحكم وطوارئ"
  assignedZone?: string;        // e.g. "وسط وشرق الرياض"
  emergencyOnCall?: boolean;    // مناوب طوارئ 24/7
  dailyVisitCapacity?: number;  // الحد الأقصى للزيارات اليومية e.g. 4

  // For Engineers & Supervisors
  engineeringSpecialty?: string; // تخصص التركيبات والهندسة
  licenseNumber?: string;        // رقم الاعتماد المهني / الهيئة السعودية للمهندسين

  // For Warehouse & Inventory
  warehouseLocation?: string;   // المستودع المسند / الفرع

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleConfig {
  role: EmployeeRole;
  labelAr: string;
  labelEn: string;
  departmentAr: string;
  departmentEn: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const ROLE_CONFIGS: Record<EmployeeRole, RoleConfig> = {
  SALES_REP: {
    role: 'SALES_REP',
    labelAr: 'مندوب مبيعات ومشاريع',
    labelEn: 'Sales Representative',
    departmentAr: 'إدارة المبيعات والتسويق',
    departmentEn: 'Sales & Marketing',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
  },
  MAINTENANCE_TECH: {
    role: 'MAINTENANCE_TECH',
    labelAr: 'فني صيانة ميداني',
    labelEn: 'Maintenance Technician',
    departmentAr: 'إدارة الصيانة والتشغيل',
    departmentEn: 'Maintenance & Service',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
  },
  INSTALLATION_ENG: {
    role: 'INSTALLATION_ENG',
    labelAr: 'مهندس تركيبات ومواقع',
    labelEn: 'Installation Engineer',
    departmentAr: 'إدارة المشاريع والتركيبات',
    departmentEn: 'Engineering & Installation',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
  },
  PROJECT_MANAGER: {
    role: 'PROJECT_MANAGER',
    labelAr: 'مدير مشاريع وتسليم',
    labelEn: 'Project Manager',
    departmentAr: 'إدارة المشاريع الكبرى',
    departmentEn: 'Project Management',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
  },
  MAINTENANCE_MGR: {
    role: 'MAINTENANCE_MGR',
    labelAr: 'مدير إدارة الصيانة',
    labelEn: 'Maintenance Director',
    departmentAr: 'إدارة الصيانة والتشغيل',
    departmentEn: 'Operations & Maintenance',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
  },
  ACCOUNTANT: {
    role: 'ACCOUNTANT',
    labelAr: 'محاسب وتدقيق مالي',
    labelEn: 'Financial Accountant',
    departmentAr: 'الإدارة المالية والمحاسبة',
    departmentEn: 'Finance & Accounts',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
  },
  GENERAL_MGR: {
    role: 'GENERAL_MGR',
    labelAr: 'مدير عام / إدارة عليا',
    labelEn: 'General Manager',
    departmentAr: 'الإدارة التنفيذية العامة',
    departmentEn: 'Executive Management',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
  },
  HR_OFFICER: {
    role: 'HR_OFFICER',
    labelAr: 'مسؤول شؤون موظفين وHR',
    labelEn: 'HR Officer',
    departmentAr: 'الموارد البشرية والشؤون الإدارية',
    departmentEn: 'Human Resources',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
  },
  CUSTOMER_SERVICE: {
    role: 'CUSTOMER_SERVICE',
    labelAr: 'خدمة عملاء واستقبال',
    labelEn: 'Customer Service',
    departmentAr: 'العناية بالعملاء والدعم',
    departmentEn: 'Customer Support',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200',
  },
  WAREHOUSE_KEEPER: {
    role: 'WAREHOUSE_KEEPER',
    labelAr: 'أمين مستودع وقطع غيار',
    labelEn: 'Warehouse Keeper',
    departmentAr: 'إدارة المستودعات وسلاسل الإمداد',
    departmentEn: 'Supply Chain & Warehouse',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-200',
  },
  SAFETY_INSPECTOR: {
    role: 'SAFETY_INSPECTOR',
    labelAr: 'مشرف جودة وسلامة مهنية',
    labelEn: 'Quality & Safety Inspector',
    departmentAr: 'إدارة الجودة والسلامة والبيئة',
    departmentEn: 'Quality Assurance & HSE',
    badgeBg: 'bg-lime-50',
    badgeText: 'text-lime-800',
    badgeBorder: 'border-lime-200',
  },
};

export const EMPLOYEE_STATUS_CONFIG: Record<EmployeeStatus, { labelAr: string; labelEn: string; bg: string; dot: string; text: string }> = {
  ACTIVE: {
    labelAr: 'على رأس العمل (نشط)',
    labelEn: 'Active',
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  ON_LEAVE: {
    labelAr: 'في إجازة رسمية',
    labelEn: 'On Leave',
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
  },
  INACTIVE: {
    labelAr: 'غير نشط / منتهي',
    labelEn: 'Inactive',
    bg: 'bg-slate-100 border-slate-200 text-slate-700',
    dot: 'bg-slate-400',
    text: 'text-slate-600',
  },
};

export const SAMPLE_EMPLOYEES: Employee[] = [
  {
    id: 'emp-101',
    code: 'REP-101',
    name: 'م. أحمد كمال الغامدي',
    nameEn: 'Eng. Ahmed Al-Ghamdi',
    role: 'SALES_REP',
    phone: '+966 50 412 8899',
    email: 'ahmed.ghamdi@twinselevators.com',
    nationalIdOrIqama: '1084920144',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2024-03-01',
    avatarBg: 'bg-emerald-600',
    commissionRate: 2.5,
    monthlyTargetSar: 250000,
    monthlyTargetElevators: 4,
    territory: 'شمال الرياض والدرعية',
    portalUser: {
      hasAccount: true,
      userId: 'user-sales-01',
      username: 'ahmed.ghamdi',
      email: 'ahmed.ghamdi@twinselevators.com',
      password: 'password123',
      portalRole: 'SALES_REP',
      isActive: true,
      userTitle: 'مسؤول مبيعات المشاريع الكبرى',
      lastLogin: '2026-09-25 14:30',
    },
    notes: 'مندوب مبيعات معتمد للمشاريع التجارية والأبراج، حاصل على جائزة أعلى مبيعات للربع الأول.',
    createdAt: '2024-03-01',
    updatedAt: '2026-09-01',
  },
  {
    id: 'emp-102',
    code: 'REP-102',
    name: 'عبدالرحمن فهد الدوسري',
    nameEn: 'Abdulrahman Al-Dossary',
    role: 'SALES_REP',
    phone: '+966 55 987 6543',
    email: 'a.dossary@twinselevators.com',
    nationalIdOrIqama: '1093829103',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2024-08-15',
    avatarBg: 'bg-blue-600',
    commissionRate: 3.0,
    monthlyTargetSar: 180000,
    monthlyTargetElevators: 3,
    territory: 'شرق ووسط الرياض والمصانع',
    notes: 'متخصص في عروض تحديث المصاعد القديمة (Modernization) وعقود الصيانة الوقائية والسنوية.',
    createdAt: '2024-08-15',
    updatedAt: '2026-09-01',
  },
  {
    id: 'emp-103',
    code: 'REP-103',
    name: 'م. فيصل بن سعد القرني',
    nameEn: 'Eng. Faisal Al-Qarni',
    role: 'SALES_REP',
    phone: '+966 54 332 1100',
    email: 'faisal.qarni@twinselevators.com',
    nationalIdOrIqama: '1072910394',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2025-01-10',
    avatarBg: 'bg-indigo-600',
    commissionRate: 3.5,
    monthlyTargetSar: 220000,
    monthlyTargetElevators: 3,
    territory: 'القصيم والمنطقة الغربية (جدة ومكة)',
    notes: 'مسؤول مبيعات المصاعد البانورامية الزجاجية والفلل الفاخرة ذات التصاميم الخاصة.',
    createdAt: '2025-01-10',
    updatedAt: '2026-09-01',
  },
  {
    id: 'emp-201',
    code: 'TECH-201',
    name: 'فني / محمد إبراهيم الشناوي',
    nameEn: 'Mohamed Ibrahim El-Shennawy',
    role: 'MAINTENANCE_TECH',
    phone: '+966 56 123 7890',
    email: 'm.shennawy@twinselevators.com',
    nationalIdOrIqama: '2398401928',
    nationality: 'مصري',
    status: 'ACTIVE',
    joinDate: '2023-06-01',
    avatarBg: 'bg-cyan-600',
    technicianSpecialty: 'لوحات التحكم الكهرومغناطيسية، كروت VVVF، وأنظمة الأمان والفرامل',
    assignedZone: 'شمال الرياض وحي الملقا وحطين',
    emergencyOnCall: true,
    dailyVisitCapacity: 5,
    portalUser: {
      hasAccount: true,
      userId: 'user-tech-01',
      username: 'm.shennawy',
      email: 'm.shennawy@twinselevators.com',
      password: 'password123',
      portalRole: 'TECHNICIAN',
      isActive: true,
      userTitle: 'كبير فنيي الصيانة والطوارئ',
      lastLogin: '2026-09-25 16:15',
    },
    notes: 'كبير فنيي الصيانة الدورية الميدانية، خبرة 12 عاماً في مصاعد فوجي وتوينز ومونتاناري الإيطالية.',
    createdAt: '2023-06-01',
    updatedAt: '2026-09-01',
  },
  {
    id: 'emp-202',
    code: 'TECH-202',
    name: 'فني / راجيش كومار برابهاكار',
    nameEn: 'Rajesh Kumar Prabhakar',
    role: 'MAINTENANCE_TECH',
    phone: '+966 59 765 4321',
    email: 'rajesh.kumar@twinselevators.com',
    nationalIdOrIqama: '2489201938',
    nationality: 'هندي',
    status: 'ACTIVE',
    joinDate: '2023-11-20',
    avatarBg: 'bg-teal-600',
    technicianSpecialty: 'ميكانيكا، حبال الجر، أبواب السلاب، أجهزة الهيدروليك والمكابس',
    assignedZone: 'شرق وجنوب الرياض، الروضة والنسيم',
    emergencyOnCall: false,
    dailyVisitCapacity: 6,
    notes: 'فني متخصص في فحص وضبط وزنية أبواب السيلين وفواصل الأمان ومساند المحركات.',
    createdAt: '2023-11-20',
    updatedAt: '2026-09-01',
  },
  {
    id: 'emp-203',
    code: 'TECH-203',
    name: 'فني / سالم مبارك العلي',
    nameEn: 'Salem Mubarak Al-Ali',
    role: 'MAINTENANCE_TECH',
    phone: '+966 53 888 2211',
    email: 'salem.ali@twinselevators.com',
    nationalIdOrIqama: '1098492018',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2024-02-15',
    avatarBg: 'bg-sky-600',
    technicianSpecialty: 'صيانة وقائية، أجهزة الإنقاذ الأوتوماتيكي ARD، والستائر الضوئية',
    assignedZone: 'وسط وغرب الرياض، العليا والسليمانية',
    emergencyOnCall: true,
    dailyVisitCapacity: 5,
    notes: 'فني معتمد لدى الدفاع المدني، مسؤول عن فحص شهادات السلامة السنوية.',
    createdAt: '2024-02-15',
    updatedAt: '2026-09-01',
  },
  {
    id: 'emp-301',
    code: 'ENG-301',
    name: 'م. خالد بن سلطان العتيبي',
    nameEn: 'Eng. Khalid Al-Otaibi',
    role: 'INSTALLATION_ENG',
    phone: '+966 50 777 4433',
    email: 'khalid.otaibi@twinselevators.com',
    nationalIdOrIqama: '1063920182',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2023-01-15',
    avatarBg: 'bg-purple-600',
    notes: 'رئيس مهندسي التركيبات الميدانية، يشرف على مراحل تسليم البئر، الشاقول، واختبارات الأحمال الأولية.',
    createdAt: '2023-01-15',
    updatedAt: '2026-09-01',
  },
  {
    id: 'emp-401',
    code: 'MGR-401',
    name: 'م. طارق عبدالكريم المنصور',
    nameEn: 'Eng. Tariq Al-Mansoor',
    role: 'MAINTENANCE_MGR',
    phone: '+966 50 111 9922',
    email: 'tariq.mansoor@twinselevators.com',
    nationalIdOrIqama: '1052910294',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2022-09-01',
    avatarBg: 'bg-indigo-700',
    notes: 'مدير عام إدارة الصيانة والتشغيل، مسؤول عن توزيع جداول الزيارات وتجديد العقود الكبرى.',
    createdAt: '2022-09-01',
    updatedAt: '2026-09-01',
  },
  {
    id: 'emp-501',
    code: 'ACC-501',
    name: 'سارة عبدالله النجاشي',
    nameEn: 'Sara Al-Najashi',
    role: 'ACCOUNTANT',
    phone: '+966 11 450 0012',
    email: 'sara.najashi@twinselevators.com',
    nationalIdOrIqama: '1082910392',
    nationality: 'سعودية',
    status: 'ACTIVE',
    joinDate: '2024-05-01',
    avatarBg: 'bg-slate-700',
    notes: 'مسؤولة الحسابات والفوترة الضريبية وإصدار كشوف عمولات المناديب الشهرية.',
    createdAt: '2024-05-01',
    updatedAt: '2026-09-01',
  },
];

// ==========================================
// Field Attendance & Geofencing Types
// ==========================================

export type AttendanceCheckInType = 
  | 'MAINTENANCE_VISIT'       // زيارة صيانة دورية
  | 'EMERGENCY_BREAKDOWN'     // عطل طارئ وتدخل فوري
  | 'SITE_INSPECTION'         // معاينة موقع ورفع مقاسات البئر
  | 'CLIENT_MEETING'          // اجتماع مبيعات وتفاوض (مندوب)
  | 'INSTALLATION_SUPERVISION';// إشراف ومطابقة شاقول وتركيبات

export type AttendanceStatus = 'VERIFIED_IN_RANGE' | 'OUT_OF_RANGE_OVERRIDE' | 'REJECTED';

export interface SiteAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: EmployeeRole;
  employeePhone?: string;
  checkInType: AttendanceCheckInType;

  // Target Client & Project
  projectId?: string;
  projectName: string;
  clientName: string;
  siteLocation: string;
  targetLatitude: number;
  targetLongitude: number;

  // Actual Employee GPS Position
  recordedLatitude: number;
  recordedLongitude: number;
  distanceMeters: number;
  allowedRadiusMeters: number;
  isWithinRadius: boolean;
  status: AttendanceStatus;

  // Timestamps
  timestamp: string; // ISO
  dateStr: string;   // YYYY-MM-DD
  timeStr: string;   // HH:mm

  deviceAccuracyMeters?: number;
  notes?: string;
  overrideReason?: string; // Reason if checked-in outside radius
  photoDataUrl?: string;   // Optional site selfie / proof
  batteryLevel?: number;   // Device battery % if available
}

export const CHECKIN_TYPE_CONFIG: Record<AttendanceCheckInType, { labelAr: string; labelEn: string; iconColor: string; bg: string }> = {
  MAINTENANCE_VISIT: {
    labelAr: 'زيارة صيانة دورية',
    labelEn: 'Routine Maintenance',
    iconColor: 'text-blue-600',
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  EMERGENCY_BREAKDOWN: {
    labelAr: 'عطل طارئ واستجابة سريعة',
    labelEn: 'Emergency Breakdown',
    iconColor: 'text-rose-600',
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  SITE_INSPECTION: {
    labelAr: 'معاينة ورفع مقاسات الموقع',
    labelEn: 'Site Survey & Dimensions',
    iconColor: 'text-amber-600',
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  CLIENT_MEETING: {
    labelAr: 'اجتماع تفاوض ومبيعات',
    labelEn: 'Sales / Client Meeting',
    iconColor: 'text-emerald-600',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  INSTALLATION_SUPERVISION: {
    labelAr: 'إشراف على أعمال التركيبات',
    labelEn: 'Installation Supervision',
    iconColor: 'text-purple-600',
    bg: 'bg-purple-50 text-purple-800 border-purple-200',
  },
};

/**
 * Calculates Great-Circle distance in meters using Haversine formula
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (val: number) => (val * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const SAMPLE_ATTENDANCE_RECORDS: SiteAttendanceRecord[] = [
  {
    id: 'att-2026-001',
    employeeId: 'emp-201',
    employeeName: 'فني/ حسن إبراهيم رضوان',
    employeeRole: 'MAINTENANCE_TECH',
    employeePhone: '+966 50 333 8811',
    checkInType: 'MAINTENANCE_VISIT',
    projectName: 'برج الأندلس للأعمال - العليا',
    clientName: 'شركة العليان العقارية',
    siteLocation: 'الرياض - حي العليا - شارع موسى بن نصير',
    targetLatitude: 24.7136,
    targetLongitude: 46.6753,
    recordedLatitude: 24.7138,
    recordedLongitude: 46.6751,
    distanceMeters: 32,
    allowedRadiusMeters: 150,
    isWithinRadius: true,
    status: 'VERIFIED_IN_RANGE',
    timestamp: '2026-09-07T09:15:00Z',
    dateStr: '2026-09-07',
    timeStr: '09:15',
    deviceAccuracyMeters: 8,
    notes: 'تم الوصول لموقع البرج والبدء بفحص زيت المحرك ولوحة التحكم',
  },
  {
    id: 'att-2026-002',
    employeeId: 'emp-101',
    employeeName: 'أ. فهد عبدالله الدوسري',
    employeeRole: 'SALES_REP',
    employeePhone: '+966 50 222 1199',
    checkInType: 'CLIENT_MEETING',
    projectName: 'فيلا حي النرجس الفاخرة',
    clientName: 'سعادة الشيخ منصور بن عبدالعزيز',
    siteLocation: 'الرياض - حي النرجس - شمال طريق الملك سلمان',
    targetLatitude: 24.8251,
    targetLongitude: 46.6621,
    recordedLatitude: 24.8253,
    recordedLongitude: 46.6618,
    distanceMeters: 45,
    allowedRadiusMeters: 150,
    isWithinRadius: true,
    status: 'VERIFIED_IN_RANGE',
    timestamp: '2026-09-07T10:30:00Z',
    dateStr: '2026-09-07',
    timeStr: '10:30',
    deviceAccuracyMeters: 12,
    notes: 'اجتماع مع المالك والمهندس المشرف لاعتماد ديكور الكابينة البانورامية الذهبية',
  },
  {
    id: 'att-2026-003',
    employeeId: 'emp-301',
    employeeName: 'م. خالد بن سلطان العتيبي',
    employeeRole: 'INSTALLATION_ENG',
    employeePhone: '+966 50 777 4433',
    checkInType: 'SITE_INSPECTION',
    projectName: 'مجمع واحة الياسمين الطبي',
    clientName: 'مجموعة الياسمين الطبية',
    siteLocation: 'الرياض - حي الياسمين - طريق أنس بن مالك',
    targetLatitude: 24.8112,
    targetLongitude: 46.6341,
    recordedLatitude: 24.8126,
    recordedLongitude: 46.6358,
    distanceMeters: 220,
    allowedRadiusMeters: 150,
    isWithinRadius: false,
    status: 'OUT_OF_RANGE_OVERRIDE',
    timestamp: '2026-09-06T14:10:00Z',
    dateStr: '2026-09-06',
    timeStr: '14:10',
    deviceAccuracyMeters: 18,
    notes: 'استلام بئر المصعد وتأكيد سلامة العزل المائي وتوزيع الكهرباء',
    overrideReason: 'توقف مؤقت في مواقف السيارات الخارجية للمجمع بسبب حواجز أعمال البناء',
  },
];
