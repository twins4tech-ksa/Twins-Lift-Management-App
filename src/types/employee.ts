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

export type EmployeeCategoryType = 
  | 'SALES'           // قطاع المبيعات والتسويق
  | 'MAINTENANCE'     // قطاع الصيانة والتشغيل والطوارئ
  | 'INSTALLATION'    // قطاع التركيبات والمشاريع
  | 'FINANCE'         // قطاع المالية والمحاسبة والتحصيل
  | 'WAREHOUSE'       // قطاع المستودع وسلاسل الإمداد
  | 'EXECUTIVE'       // الإدارة العامة والإشرافية
  | 'CUSTOMER_CARE';  // قطاع خدمة العملاء والجودة

export interface CustomPermissionRule {
  id: string;
  nameAr: string;
  nameEn: string;
  category: EmployeeCategoryType;
  description?: string;
  colorTheme: 'indigo' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'teal';
  isCustom: boolean; // true if created by user
  createdAt: string;
  permissions: {
    // 1. Sales & Projects
    canViewPricing: boolean;
    canViewGrossMargins: boolean;
    canCreateQuotations: boolean;
    canManageSalesContracts: boolean;
    canViewSalesAnalytics: boolean;
    canManageCustomers: boolean;
    canViewCadDrawings: boolean;
    canPrintQuotations?: boolean;
    canPrintCadDrawings?: boolean;

    // 2. Maintenance & Operations
    canManageMaintenanceContracts: boolean;
    canManageMaintenanceVisits: boolean;
    canReportBreakdowns: boolean;
    canUpdateBreakdowns: boolean;
    canDispatchTechnicians: boolean;
    canSendWhatsAppAlerts?: boolean;

    // 3. Finance, Stock & Safety
    canManageInvoicesAndVouchers: boolean;
    canGenerateZatcaQr?: boolean;
    canManageSafetyCertificates: boolean;
    canManageInventoryAndStock: boolean;
    canAccessSupplierPortal: boolean;
    canCreatePurchaseOrders?: boolean;

    // 4. Administration & Portals
    canManageEmployees: boolean;
    canManageCustomRules?: boolean;
    canManageSettings: boolean;
    canCheckInGps: boolean;
    canPrintDocuments: boolean;
    canAccessCustomerPortal: boolean;
    canAccessTechnicianPortal: boolean;
    canViewAllDepartmentRecords: boolean;
  };
}

export interface EmployeeCategoryConfig {
  category: EmployeeCategoryType;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  defaultRole: EmployeeRole;
}

export const EMPLOYEE_CATEGORY_CONFIGS: Record<EmployeeCategoryType, EmployeeCategoryConfig> = {
  SALES: {
    category: 'SALES',
    labelAr: 'قطاع المبيعات والتسويق',
    labelEn: 'Sales & Marketing',
    descriptionAr: 'عروض الأسعار، عقود البيع، العملاء، والتارقت',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    defaultRole: 'SALES_REP',
  },
  MAINTENANCE: {
    category: 'MAINTENANCE',
    labelAr: 'قطاع الصيانة والتشغيل والطوارئ',
    labelEn: 'Maintenance & Service',
    descriptionAr: 'عقود الصيانة، البلاغات، الزيارات الدورية، والبصمة',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    defaultRole: 'MAINTENANCE_TECH',
  },
  INSTALLATION: {
    category: 'INSTALLATION',
    labelAr: 'قطاع التركيبات والمشاريع الهندسية',
    labelEn: 'Installation & Projects',
    descriptionAr: 'إشراف المواقع، المخططات الهندسية CAD، وتراخيص الدفاع المدني',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    defaultRole: 'INSTALLATION_ENG',
  },
  FINANCE: {
    category: 'FINANCE',
    labelAr: 'قطاع المالية والمحاسبة والتحصيل',
    labelEn: 'Finance & Accounting',
    descriptionAr: 'الفواتير الضريبية ZATCA، سندات القبض، والتقارير المالية',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    defaultRole: 'ACCOUNTANT',
  },
  WAREHOUSE: {
    category: 'WAREHOUSE',
    labelAr: 'قطاع المستودع وسلاسل الإمداد',
    labelEn: 'Warehouse & Spare Parts',
    descriptionAr: 'إدارة قطع الغيار، حركات المخزون، وأوامر الشراء',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    defaultRole: 'WAREHOUSE_KEEPER',
  },
  EXECUTIVE: {
    category: 'EXECUTIVE',
    labelAr: 'الإدارة العامة والإشرافية العليا',
    labelEn: 'Executive Management',
    descriptionAr: 'كامل صلاحيات النظام، الرقابة، والإعدادات العليا',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    defaultRole: 'GENERAL_MGR',
  },
  CUSTOMER_CARE: {
    category: 'CUSTOMER_CARE',
    labelAr: 'قطاع خدمة العملاء ومراقبة الجودة',
    labelEn: 'Customer Care & QC',
    descriptionAr: 'استقبال الاستفسارات، متابعة البلاغات، وقياس الرضا',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
    defaultRole: 'CUSTOMER_SERVICE',
  },
};

export const DEFAULT_CUSTOM_RULES: CustomPermissionRule[] = [
  {
    id: 'rule-projects-safety',
    nameAr: 'مشرف مشاريع وتراخيص دفاع مدني',
    nameEn: 'Projects & Civil Defense Inspector',
    category: 'INSTALLATION',
    description: 'صلاحيات كاملة لعقود البيع والتركيبات، المخططات الهندسية، وشهادات الدفاع المدني والسلامة.',
    colorTheme: 'indigo',
    isCustom: false,
    createdAt: '2026-01-15T08:00:00Z',
    permissions: {
      canViewPricing: true,
      canViewGrossMargins: false,
      canCreateQuotations: true,
      canManageSalesContracts: true,
      canViewSalesAnalytics: true,
      canManageCustomers: true,
      canViewCadDrawings: true,
      canManageMaintenanceContracts: false,
      canManageMaintenanceVisits: false,
      canReportBreakdowns: true,
      canUpdateBreakdowns: true,
      canDispatchTechnicians: false,
      canManageInvoicesAndVouchers: false,
      canManageSafetyCertificates: true,
      canManageInventoryAndStock: true,
      canAccessSupplierPortal: false,
      canManageEmployees: false,
      canManageSettings: false,
      canCheckInGps: true,
      canPrintDocuments: true,
      canAccessCustomerPortal: false,
      canAccessTechnicianPortal: false,
      canViewAllDepartmentRecords: true,
    }
  },
  {
    id: 'rule-accountant-zatca',
    nameAr: 'محاسب مالي ومسؤول فواتير ZATCA',
    nameEn: 'Accountant & ZATCA Invoicing Specialist',
    category: 'FINANCE',
    description: 'صلاحيات الفوترة وسندات القبض الإلكترونية، عروض الأسعار، وكشوفات الموردين دون تعديل الإعدادات.',
    colorTheme: 'emerald',
    isCustom: false,
    createdAt: '2026-02-10T09:30:00Z',
    permissions: {
      canViewPricing: true,
      canViewGrossMargins: true,
      canCreateQuotations: true,
      canManageSalesContracts: true,
      canViewSalesAnalytics: true,
      canManageCustomers: true,
      canViewCadDrawings: false,
      canManageMaintenanceContracts: true,
      canManageMaintenanceVisits: false,
      canReportBreakdowns: false,
      canUpdateBreakdowns: false,
      canDispatchTechnicians: false,
      canManageInvoicesAndVouchers: true,
      canManageSafetyCertificates: false,
      canManageInventoryAndStock: false,
      canAccessSupplierPortal: true,
      canManageEmployees: false,
      canManageSettings: false,
      canCheckInGps: false,
      canPrintDocuments: true,
      canAccessCustomerPortal: false,
      canAccessTechnicianPortal: false,
      canViewAllDepartmentRecords: true,
    }
  },
  {
    id: 'rule-senior-tech-bom',
    nameAr: 'فني أول صيانة معتمد مع كشف التكلفة وقطع الغيار',
    nameEn: 'Senior Field Technician with BOM Access',
    category: 'MAINTENANCE',
    description: 'مباشرة الأعطال والزيارات، البصمة الجغرافية، كشف أسعار قطع الغيار وطلب التوريد المباشر.',
    colorTheme: 'blue',
    isCustom: false,
    createdAt: '2026-03-01T11:00:00Z',
    permissions: {
      canViewPricing: true,
      canViewGrossMargins: false,
      canCreateQuotations: false,
      canManageSalesContracts: false,
      canViewSalesAnalytics: false,
      canManageCustomers: true,
      canViewCadDrawings: true,
      canManageMaintenanceContracts: true,
      canManageMaintenanceVisits: true,
      canReportBreakdowns: true,
      canUpdateBreakdowns: true,
      canDispatchTechnicians: true,
      canManageInvoicesAndVouchers: false,
      canManageSafetyCertificates: true,
      canManageInventoryAndStock: true,
      canAccessSupplierPortal: false,
      canManageEmployees: false,
      canManageSettings: false,
      canCheckInGps: true,
      canPrintDocuments: true,
      canAccessCustomerPortal: false,
      canAccessTechnicianPortal: true,
      canViewAllDepartmentRecords: false,
    }
  }
];

export interface EmployeePortalUser {
  hasAccount: boolean;
  userId?: string;
  username?: string;
  email?: string;
  password?: string;
  masterPassword?: string;  // الرقم السري الماستر الخاص بالموظف
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
  position?: string;          // Job title / position
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

  // Custom Role & Category (نوعية الموظف والـ Rule المخصص)
  employeeType?: EmployeeCategoryType;
  customRoleId?: string;
  customRoleName?: string;

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
    id: 'emp-admin',
    code: 'ADM-001',
    name: 'Twins Admin',
    nameEn: 'Twins Admin',
    role: 'GENERAL_MGR',
    phone: '+966 50 111 2233',
    email: 'admin@twinselevators.com',
    nationalIdOrIqama: '1010000001',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2023-01-01',
    avatarBg: 'bg-rose-700',
    portalUser: {
      hasAccount: true,
      userId: 'user-mgt-01',
      username: 'admin',
      email: 'admin@twinselevators.com',
      password: 'admin',
      portalRole: 'MANAGEMENT',
      isActive: true,
      userTitle: 'المدير العام - كامل الصلاحيات',
      lastLogin: '2026-10-02 09:00',
    },
    notes: 'المدير العام والمشرف التنفيذي لكافة فروع وعمليات مصاعد التوأم.',
    createdAt: '2023-01-01',
    updatedAt: '2026-10-02',
  },
  {
    id: 'emp-tech',
    code: 'TECH-001',
    name: 'Twins Technician',
    nameEn: 'Twins Technician',
    role: 'MAINTENANCE_TECH',
    phone: '+966 56 123 7890',
    email: 'technician@twinselevators.com',
    nationalIdOrIqama: '2020000002',
    nationality: 'مصري',
    status: 'ACTIVE',
    joinDate: '2023-06-01',
    avatarBg: 'bg-blue-600',
    technicianSpecialty: 'صيانة دورية، طوارئ، كروت VVVF ولوحات التحكم',
    assignedZone: 'الرياض والمناطق المجاورة',
    emergencyOnCall: true,
    dailyVisitCapacity: 6,
    portalUser: {
      hasAccount: true,
      userId: 'user-tech-01',
      username: 'technician',
      email: 'technician@twinselevators.com',
      password: 'password123',
      portalRole: 'TECHNICIAN',
      isActive: true,
      userTitle: 'فني الصيانة والطوارئ الميداني',
      lastLogin: '2026-10-02 08:30',
    },
    notes: 'فني الصيانة الميدانية المعتمد لزيارات الصيانة وبلاغات الأعطال.',
    createdAt: '2023-06-01',
    updatedAt: '2026-10-02',
  },
  {
    id: 'emp-sales',
    code: 'SALES-001',
    name: 'Twins Sales',
    nameEn: 'Twins Sales',
    role: 'SALES_REP',
    phone: '+966 50 412 8899',
    email: 'sales@twinselevators.com',
    nationalIdOrIqama: '1030000003',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2024-01-15',
    avatarBg: 'bg-emerald-600',
    commissionRate: 3.0,
    monthlyTargetSar: 250000,
    monthlyTargetElevators: 4,
    territory: 'الرياض والمناطق المجاورة',
    portalUser: {
      hasAccount: true,
      userId: 'user-sales-01',
      username: 'sales',
      email: 'sales@twinselevators.com',
      password: 'password123',
      portalRole: 'SALES_REP',
      isActive: true,
      userTitle: 'مسؤول مبيعات المشاريع والعقود',
      lastLogin: '2026-10-02 08:45',
    },
    notes: 'مسؤول مبيعات المشاريع وعقود التوريد والتركيب.',
    createdAt: '2024-01-15',
    updatedAt: '2026-10-02',
  },
  {
    id: 'emp-install',
    code: 'INST-001',
    name: 'Twins Installation',
    nameEn: 'Twins Installation',
    role: 'INSTALLATION_ENG',
    phone: '+966 50 777 4433',
    email: 'installation@twinselevators.com',
    nationalIdOrIqama: '1040000004',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2023-03-01',
    avatarBg: 'bg-purple-600',
    portalUser: {
      hasAccount: true,
      userId: 'user-install-01',
      username: 'installation',
      email: 'installation@twinselevators.com',
      password: 'password123',
      portalRole: 'CUSTOM',
      isActive: true,
      userTitle: 'مشرف التركيبات والمشاريع الهندسية',
      lastLogin: '2026-10-01 15:00',
    },
    notes: 'مشرف قطاع التركيبات والشواقول واعتمادات الدفاع المدني.',
    createdAt: '2023-03-01',
    updatedAt: '2026-10-02',
  },
  {
    id: 'emp-finance',
    code: 'FIN-001',
    name: 'Twins Accountant',
    nameEn: 'Twins Accountant',
    role: 'ACCOUNTANT',
    phone: '+966 11 450 0012',
    email: 'finance@twinselevators.com',
    nationalIdOrIqama: '1050000005',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2024-02-01',
    avatarBg: 'bg-teal-600',
    portalUser: {
      hasAccount: true,
      userId: 'user-fin-01',
      username: 'finance',
      email: 'finance@twinselevators.com',
      password: 'password123',
      portalRole: 'CUSTOM',
      isActive: true,
      userTitle: 'مسؤول الإدارة المالية والفوترة',
      lastLogin: '2026-10-01 12:00',
    },
    notes: 'مسؤول قطاع المالية والحسابات وفواتير ZATCA وسندات القبض.',
    createdAt: '2024-02-01',
    updatedAt: '2026-10-02',
  },
  {
    id: 'emp-warehouse',
    code: 'WH-001',
    name: 'Twins Warehouse',
    nameEn: 'Twins Warehouse',
    role: 'WAREHOUSE_KEEPER',
    phone: '+966 50 888 9900',
    email: 'warehouse@twinselevators.com',
    nationalIdOrIqama: '2060000006',
    nationality: 'هندي',
    status: 'ACTIVE',
    joinDate: '2023-10-01',
    avatarBg: 'bg-amber-600',
    portalUser: {
      hasAccount: true,
      userId: 'user-wh-01',
      username: 'warehouse',
      email: 'warehouse@twinselevators.com',
      password: 'password123',
      portalRole: 'CUSTOM',
      isActive: true,
      userTitle: 'أمين المستودع وسلاسل الإمداد',
      lastLogin: '2026-10-01 11:30',
    },
    notes: 'مسؤول قطاع المستودع وقطع الغيار وأوامر الشراء والتوريد.',
    createdAt: '2023-10-01',
    updatedAt: '2026-10-02',
  },
  {
    id: 'emp-care',
    code: 'CARE-001',
    name: 'Twins Customer Care',
    nameEn: 'Twins Customer Care',
    role: 'CUSTOMER_SERVICE',
    phone: '+966 50 333 4455',
    email: 'care@twinselevators.com',
    nationalIdOrIqama: '1070000007',
    nationality: 'سعودي',
    status: 'ACTIVE',
    joinDate: '2024-04-01',
    avatarBg: 'bg-cyan-600',
    portalUser: {
      hasAccount: true,
      userId: 'user-care-01',
      username: 'care',
      email: 'care@twinselevators.com',
      password: 'password123',
      portalRole: 'CUSTOM',
      isActive: true,
      userTitle: 'مسؤول خدمة العملاء ومراقبة الجودة',
      lastLogin: '2026-10-01 10:00',
    },
    notes: 'مسؤول قطاع خدمة العملاء وبلاغات الطوارئ ورضا المشتركين.',
    createdAt: '2024-04-01',
    updatedAt: '2026-10-02',
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
    employeeId: 'emp-tech',
    employeeName: 'Twins Technician',
    employeeRole: 'MAINTENANCE_TECH',
    employeePhone: '+966 56 123 7890',
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
    employeeId: 'emp-sales',
    employeeName: 'Twins Sales',
    employeeRole: 'SALES_REP',
    employeePhone: '+966 50 412 8899',
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
    employeeId: 'emp-install',
    employeeName: 'Twins Installation',
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
