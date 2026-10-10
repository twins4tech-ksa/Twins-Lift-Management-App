import { NavTab } from './navigation';

export type UserPortalRole = 'MANAGEMENT' | 'TECHNICIAN' | 'CUSTOMER' | 'SALES_REP' | 'SUPPLIER' | 'CUSTOM';

export interface RolePrivileges {
  role: UserPortalRole;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  avatarColor: string;
  
  // Specific Functional Privileges
  canViewPricing: boolean;            // أسعار التكلفة والمبالغ المالية
  canViewGrossMargins: boolean;       // هوامش الربح وتحليلات الأرباح
  canManageSettings: boolean;         // إعدادات الشركة والشعار والتسعير
  canManageEmployees: boolean;        // إدارة الموظفين والمناديب والرواتب
  canManageCustomers: boolean;        // إضافة وتعديل بيانات العملاء
  canCreateQuotations: boolean;       // إنشاء وتعديل عروض الأسعار
  canViewSalesAnalytics: boolean;     // تقارير وتحليلات المبيعات التنفيذية
  canManageContracts: boolean;        // اعتماد وتوقيع عقود الصيانة والبيع
  canSignVisits: boolean;             // تسجيل وتوقيع زيارات الصيانة الدورية
  canUpdateBreakdowns: boolean;       // تحديث حالات بلاغات الأعطال والإصلاح
  canReportBreakdowns: boolean;       // تسجيل بلاغ عطل جديد
  canViewCadDrawings: boolean;        // استعراض المخططات الهندسية ونظام التعليق
  canCheckInGps: boolean;             // تسجيل الحضور الميداني بالبصمة الجغرافية
  canViewAllDepartmentRecords?: boolean; // مشاهدة كافة سجلات وإضافات القسم المصرح به
  canManageSaaS?: boolean;            // إدارة المنظومة السحابية والشركات المتعددة والفروع
}

export interface UserProfile {
  id: string;
  name: string;
  nameEn?: string;
  role: UserPortalRole;
  email: string;
  phone: string;
  avatarLabel: string;
  title: string;
  customerId?: string;      // Linked customer if role === 'CUSTOMER'
  customerCompany?: string; // Company / Project name
  employeeId?: string;      // Linked employee if role === 'TECHNICIAN' or 'SALES_REP'
  canViewAllDepartmentRecords?: boolean; // إمكانية رؤية كافة سجلات القسم (وليس فقط المسند له)
  customRoleId?: string;      // الـ Rule المخصص المعتمد
  customRoleName?: string;    // مسمى الـ Rule المخصص
  username?: string;          // اسم المستخدم للدخول
  password?: string;          // الرقم السري الخاص
  masterPassword?: string;    // الرقم السري الماستر للمستخدم
  lastLogin?: string;         // تاريخ آخر تسجيل دخول
}

export const ROLE_PRIVILEGES_MAP: Record<UserPortalRole, RolePrivileges> = {
  MANAGEMENT: {
    role: 'MANAGEMENT',
    titleAr: 'الإدارة العامة والمدير التنفيذي',
    titleEn: 'Executive Management',
    subtitleAr: 'صلاحيات كاملة وغير مقيدة: هوامش الربح، الإعدادات، الحسابات، والموظفين',
    subtitleEn: 'Full unconstrained privileges: Margins, Settings, Financials & Staff',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-300',
    avatarColor: 'bg-rose-700 text-white',
    canViewPricing: true,
    canViewGrossMargins: true,
    canManageSettings: true,
    canManageEmployees: true,
    canManageCustomers: true,
    canCreateQuotations: true,
    canViewSalesAnalytics: true,
    canManageContracts: true,
    canSignVisits: true,
    canUpdateBreakdowns: true,
    canReportBreakdowns: true,
    canViewCadDrawings: true,
    canCheckInGps: true,
    canViewAllDepartmentRecords: true,
    canManageSaaS: true,
  },
  TECHNICIAN: {
    role: 'TECHNICIAN',
    titleAr: 'بوابة الفني ومهندس الصيانة',
    titleEn: 'Field Technician Portal',
    subtitleAr: 'زيارات الصيانة، بلاغات الأعطال، البصمة الميدانية، والمخططات الفنية',
    subtitleEn: 'Maintenance visits, emergency breakdowns, GPS check-in & drawings',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-300',
    avatarColor: 'bg-blue-600 text-white',
    canViewPricing: false,
    canViewGrossMargins: false,
    canManageSettings: false,
    canManageEmployees: false,
    canManageCustomers: false,
    canCreateQuotations: false,
    canViewSalesAnalytics: false,
    canManageContracts: false,
    canSignVisits: true,
    canUpdateBreakdowns: true,
    canReportBreakdowns: true,
    canViewCadDrawings: true,
    canCheckInGps: true,
    canViewAllDepartmentRecords: false, // افتراضياً لا يشاهد إلا ما هو مسند له أو مدخل بواسطته
  },
  CUSTOMER: {
    role: 'CUSTOMER',
    titleAr: 'بوابة العميل والمالك',
    titleEn: 'Customer & Client Portal',
    subtitleAr: 'مصاعدي، عقود الصيانة، تسجيل بلاغ عطل فوري، وسجل الزيارات السابقة',
    subtitleEn: 'My elevators, active contracts, report breakdowns & service history',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-300',
    avatarColor: 'bg-emerald-600 text-white',
    canViewPricing: false,
    canViewGrossMargins: false,
    canManageSettings: false,
    canManageEmployees: false,
    canManageCustomers: false,
    canCreateQuotations: false,
    canViewSalesAnalytics: false,
    canManageContracts: false,
    canSignVisits: false,
    canUpdateBreakdowns: false,
    canReportBreakdowns: true,
    canViewCadDrawings: true,
    canCheckInGps: false,
    canViewAllDepartmentRecords: false,
  },
  SALES_REP: {
    role: 'SALES_REP',
    titleAr: 'بوابة المبيعات والمشاريع',
    titleEn: 'Sales & Projects Portal',
    subtitleAr: 'حاسبة المواصفات، عروض الأسعار، سجل العملاء، وطباعة العروض الفنية',
    subtitleEn: 'Quotation wizard, pricing calculator, client CRM & submittals',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-300',
    avatarColor: 'bg-amber-600 text-white',
    canViewPricing: true,
    canViewGrossMargins: false,
    canManageSettings: false,
    canManageEmployees: false,
    canManageCustomers: true,
    canCreateQuotations: true,
    canViewSalesAnalytics: true,
    canManageContracts: true,
    canSignVisits: false,
    canUpdateBreakdowns: false,
    canReportBreakdowns: true,
    canViewCadDrawings: true,
    canCheckInGps: true,
    canViewAllDepartmentRecords: false, // افتراضياً لا يشاهد إلا ما هو مسند له أو مدخل بواسطته
  },
  SUPPLIER: {
    role: 'SUPPLIER',
    titleAr: 'بوابة المورد المعتمد',
    titleEn: 'Certified Supplier Portal',
    subtitleAr: 'متابعة أوامر الشراء، تحديث فترات التوريد، كتالوج قطع الغيار المعتمدة',
    subtitleEn: 'Track purchase orders, lead-time schedules & supplied spare parts',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-300',
    avatarColor: 'bg-indigo-700 text-white',
    canViewPricing: true,
    canViewGrossMargins: false,
    canManageSettings: false,
    canManageEmployees: false,
    canManageCustomers: false,
    canCreateQuotations: false,
    canViewSalesAnalytics: false,
    canManageContracts: false,
    canSignVisits: false,
    canUpdateBreakdowns: false,
    canReportBreakdowns: false,
    canViewCadDrawings: false,
    canCheckInGps: false,
    canViewAllDepartmentRecords: false,
  },
  CUSTOM: {
    role: 'CUSTOM',
    titleAr: 'صلاحيات مخصصة (Custom Rule)',
    titleEn: 'Custom Role & Privileges',
    subtitleAr: 'صلاحيات محددة ومخصصة بدقة حسب قواعد النظام',
    subtitleEn: 'Granular permissions tailored dynamically across the application',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-300',
    avatarColor: 'bg-indigo-700 text-white',
    canViewPricing: true,
    canViewGrossMargins: false,
    canManageSettings: false,
    canManageEmployees: false,
    canManageCustomers: true,
    canCreateQuotations: true,
    canViewSalesAnalytics: true,
    canManageContracts: true,
    canSignVisits: true,
    canUpdateBreakdowns: true,
    canReportBreakdowns: true,
    canViewCadDrawings: true,
    canCheckInGps: true,
    canViewAllDepartmentRecords: false,
  },
};

export const SAMPLE_USER_PROFILES: UserProfile[] = [
  {
    id: 'user-mgt-01',
    name: 'Twins Admin',
    nameEn: 'Twins Admin',
    role: 'MANAGEMENT',
    username: 'admin',
    email: 'admin@twinselevators.com',
    phone: '+966 50 111 2233',
    password: 'admin',
    masterPassword: 'MASTER2026',
    avatarLabel: 'إد',
    title: 'المدير العام - كامل الصلاحيات',
    employeeId: 'emp-admin',
  },
  {
    id: 'user-tech-01',
    name: 'Twins Technician',
    nameEn: 'Twins Technician',
    role: 'TECHNICIAN',
    username: 'technician',
    email: 'technician@twinselevators.com',
    phone: '+966 56 123 7890',
    password: 'password123',
    masterPassword: 'MASTER2026',
    avatarLabel: 'فن',
    title: 'فني الصيانة والطوارئ الميداني',
    employeeId: 'emp-tech',
  },
  {
    id: 'user-sales-01',
    name: 'Twins Sales',
    nameEn: 'Twins Sales',
    role: 'SALES_REP',
    username: 'sales',
    email: 'sales@twinselevators.com',
    phone: '+966 50 412 8899',
    password: 'password123',
    masterPassword: 'MASTER2026',
    avatarLabel: 'مب',
    title: 'مسؤول مبيعات المشاريع والعقود',
    employeeId: 'emp-sales',
  },
  {
    id: 'user-cust-01',
    name: 'Twins Customer',
    nameEn: 'Twins Customer',
    role: 'CUSTOMER',
    username: 'customer',
    email: 'customer@twinselevators.com',
    phone: '+966 11 478 9900',
    password: 'password123',
    masterPassword: 'MASTER2026',
    avatarLabel: 'عم',
    title: 'عميل معتمد - إدارة وتشغيل المصاعد',
    customerId: 'cust-twins',
    customerCompany: 'Twins Customer Co.',
  },
  {
    id: 'user-supp-01',
    name: 'Twins Supplier',
    nameEn: 'Twins Supplier',
    role: 'SUPPLIER',
    username: 'supplier',
    email: 'supplier@twinselevators.com',
    phone: '+966 50 123 4567',
    password: 'password123',
    masterPassword: 'MASTER2026',
    avatarLabel: 'ور',
    title: 'مورد معتمد - أنظمة الجر وقطع الغيار',
  },
];
