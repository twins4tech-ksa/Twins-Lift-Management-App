import { UserPortalRole } from './portal';

export type SaaSCompanyStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'MAINTENANCE';
export type SaaSSubscriptionPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'UNLIMITED';
export type DatabaseIsolationMode = 'SEPARATE_DATABASE' | 'SEPARATE_SCHEMA' | 'DEDICATED_HOST';
export type DatabaseEngine = 'POSTGRESQL' | 'MYSQL' | 'SQLITE';
export type DatabaseConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'MIGRATING' | 'ERROR';

export interface TenantDatabaseConfig {
  mode: DatabaseIsolationMode;
  engine: DatabaseEngine;
  host: string;
  port: number;
  databaseName: string;
  schemaName?: string;
  username: string;
  password?: string;
  ssl: boolean;
  poolSize: number;
  connectionStatus: DatabaseConnectionStatus;
  lastTestTimestamp?: string;
  lastPingMs?: number;
  tablesCount?: number;
  storageUsedMb?: number;
  customConnectionString?: string;
}

export interface CompanyBranch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  nameEn?: string;
  city: string;
  address: string;
  phone: string;
  email?: string;
  managerName: string;
  managerPhone?: string;
  isHeadquarter: boolean;
  active: boolean;
  elevatorsCount?: number;
  techniciansCount?: number;
  createdAt: string;
}

export interface CompanyWarehouse {
  id: string;
  companyId: string;
  branchId?: string;
  code: string;
  name: string;
  nameEn?: string;
  type: 'CENTRAL' | 'BRANCH' | 'MAINTENANCE_VAN' | 'RAPID_DISPATCH';
  city: string;
  address: string;
  managerName: string;
  managerPhone: string;
  capacityUnits: number;
  currentStockItemsCount: number;
  active: boolean;
  createdAt: string;
}

export interface CompanyTenant {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  commercialReg: string;
  vatNumber: string;
  phone: string;
  email: string;
  website?: string;
  country: string;
  city: string;
  address: string;
  logoUrl?: string;
  subdomain?: string;
  status: SaaSCompanyStatus;
  plan: SaaSSubscriptionPlan;
  monthlyFeeSar: number;
  licenseStartDate: string;
  licenseEndDate: string;
  maxBranches: number;
  maxWarehouses: number;
  maxUsers: number;
  maxElevators: number;
  activeUsersCount?: number;
  activeElevatorsCount?: number;
  databaseConfig: TenantDatabaseConfig;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  companyId: string;
  branchId?: string;
  name: string;
  nameEn?: string;
  email: string;
  username: string;
  role: UserPortalRole | 'SUPER_ADMIN';
  phone: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface ContaboVpsConfig {
  vpsIp: string;
  domain: string;
  sshPort: number;
  postgresPort: number;
  postgresSuperUser: string;
  redisPort: number;
  appPort: number;
  sslEmail: string;
  dockerNetwork: string;
  projectDir: string;
  gitRepoUrl?: string;
}

export const DEFAULT_CONTABO_CONFIG: ContaboVpsConfig = {
  vpsIp: '144.91.114.143',
  domain: 'twins-elevators-saas.serv-1001.twins4tech.com',
  sshPort: 22,
  postgresPort: 5433,
  postgresSuperUser: 'postgres',
  redisPort: 6379,
  appPort: 3000,
  sslEmail: 'twins4tech@gmail.com',
  dockerNetwork: 'twins_saas_network',
  projectDir: '/opt/Twins-Elevators-Saas',
  gitRepoUrl: '',
};

// ==========================================
// Seed Data: Realistic Initial Companies
// ==========================================
export const INITIAL_SAAS_COMPANIES: CompanyTenant[] = [
  {
    id: 'tenant-twins-main',
    code: 'TWINS',
    nameAr: 'شركة توينز للمصاعد المحدودة',
    nameEn: 'Twins Elevators Co. Ltd.',
    commercialReg: '1010874521',
    vatNumber: '310245879600003',
    phone: '+966 11 456 7890',
    email: 'info@twins-elevators.com',
    website: 'https://twins-elevators.com',
    country: 'المملكة العربية السعودية',
    city: 'الرياض',
    address: 'طريق الملك فهد، حي الصحافة، الرياض',
    logoUrl: '',
    subdomain: 'twins',
    status: 'ACTIVE',
    plan: 'ENTERPRISE',
    monthlyFeeSar: 1850,
    licenseStartDate: '2026-01-01',
    licenseEndDate: '2027-12-31',
    maxBranches: 10,
    maxWarehouses: 10,
    maxUsers: 100,
    maxElevators: 1500,
    activeUsersCount: 18,
    activeElevatorsCount: 320,
    databaseConfig: {
      mode: 'SEPARATE_DATABASE',
      engine: 'POSTGRESQL',
      host: '127.0.0.1',
      port: 5432,
      databaseName: 'twins_db_twins_main',
      schemaName: 'public',
      username: 'db_twins_main_user',
      ssl: false,
      poolSize: 20,
      connectionStatus: 'CONNECTED',
      lastTestTimestamp: '2026-10-09T18:00:00Z',
      lastPingMs: 4,
      tablesCount: 28,
      storageUsedMb: 148,
    },
    notes: 'الشركة الأم - حساب رئيسي مع كافة الصلاحيات وفروع في الرياض وجدة والدمام.',
    createdAt: '2026-01-01',
    updatedAt: '2026-10-09',
  },
  {
    id: 'tenant-al-fursan',
    code: 'FURSAN',
    nameAr: 'شركة الفرسان للمصاعد والسلالم الكهربائية',
    nameEn: 'Al-Fursan Elevators & Escalators',
    commercialReg: '4030652198',
    vatNumber: '302541897500003',
    phone: '+966 12 685 4120',
    email: 'contact@al-fursan-elevators.sa',
    website: 'https://al-fursan-elevators.sa',
    country: 'المملكة العربية السعودية',
    city: 'جدة',
    address: 'طريق الأمير ماجد، حي الروضة، جدة',
    subdomain: 'fursan',
    status: 'ACTIVE',
    plan: 'PROFESSIONAL',
    monthlyFeeSar: 1200,
    licenseStartDate: '2026-03-01',
    licenseEndDate: '2027-03-01',
    maxBranches: 4,
    maxWarehouses: 4,
    maxUsers: 30,
    maxElevators: 500,
    activeUsersCount: 11,
    activeElevatorsCount: 145,
    databaseConfig: {
      mode: 'SEPARATE_DATABASE',
      engine: 'POSTGRESQL',
      host: '127.0.0.1',
      port: 5432,
      databaseName: 'twins_db_fursan',
      schemaName: 'public',
      username: 'db_fursan_user',
      ssl: false,
      poolSize: 15,
      connectionStatus: 'CONNECTED',
      lastTestTimestamp: '2026-10-09T17:30:00Z',
      lastPingMs: 6,
      tablesCount: 28,
      storageUsedMb: 85,
    },
    notes: 'وكيل مصاعد إيطالية وترفيهية بالمنطقة الغربية.',
    createdAt: '2026-03-01',
    updatedAt: '2026-10-08',
  },
  {
    id: 'tenant-gulf-peaks',
    code: 'GULF',
    nameAr: 'مؤسسة قمم الخليج لصيانة وتركيب المصاعد',
    nameEn: 'Gulf Peaks Elevator Services',
    commercialReg: '2050983412',
    vatNumber: '311456987100003',
    phone: '+966 13 897 2200',
    email: 'operations@gulfpeaks.com',
    website: 'https://gulfpeaks.com',
    country: 'المملكة العربية السعودية',
    city: 'الخبر',
    address: 'طريق الملك فيصل، حي اليرموك، الخبر',
    subdomain: 'gulfpeaks',
    status: 'ACTIVE',
    plan: 'STARTER',
    monthlyFeeSar: 650,
    licenseStartDate: '2026-06-15',
    licenseEndDate: '2027-06-15',
    maxBranches: 2,
    maxWarehouses: 2,
    maxUsers: 15,
    maxElevators: 200,
    activeUsersCount: 6,
    activeElevatorsCount: 68,
    databaseConfig: {
      mode: 'SEPARATE_DATABASE',
      engine: 'POSTGRESQL',
      host: '127.0.0.1',
      port: 5432,
      databaseName: 'twins_db_gulf_peaks',
      schemaName: 'public',
      username: 'db_gulf_user',
      ssl: false,
      poolSize: 10,
      connectionStatus: 'CONNECTED',
      lastTestTimestamp: '2026-10-09T16:15:00Z',
      lastPingMs: 5,
      tablesCount: 28,
      storageUsedMb: 42,
    },
    notes: 'متخصصون في عقود صيانة الفلل والعمائر السكنية بالمنطقة الشرقية.',
    createdAt: '2026-06-15',
    updatedAt: '2026-10-05',
  },
  {
    id: 'tenant-smart-towers',
    code: 'SMART',
    nameAr: 'شركة الأبراج الذكية لتقنيات المصاعد والسلالم',
    nameEn: 'Smart Towers Elevator Technologies',
    commercialReg: '1010992384',
    vatNumber: '300987654300003',
    phone: '+966 11 223 9988',
    email: 'info@smart-towers.sa',
    country: 'المملكة العربية السعودية',
    city: 'الرياض',
    address: 'حي النرجس، تقاطع طريق عثمان بن عفان، الرياض',
    subdomain: 'smart-towers',
    status: 'TRIAL',
    plan: 'ENTERPRISE',
    monthlyFeeSar: 0,
    licenseStartDate: '2026-10-01',
    licenseEndDate: '2026-11-01',
    maxBranches: 5,
    maxWarehouses: 5,
    maxUsers: 50,
    maxElevators: 600,
    activeUsersCount: 4,
    activeElevatorsCount: 15,
    databaseConfig: {
      mode: 'SEPARATE_DATABASE',
      engine: 'POSTGRESQL',
      host: '127.0.0.1',
      port: 5432,
      databaseName: 'twins_db_smart_towers',
      schemaName: 'public',
      username: 'db_smart_user',
      ssl: false,
      poolSize: 10,
      connectionStatus: 'CONNECTED',
      lastTestTimestamp: '2026-10-09T12:00:00Z',
      lastPingMs: 7,
      tablesCount: 28,
      storageUsedMb: 18,
    },
    notes: 'فترة تجريبية 30 يوماً تنتهي في 1 نوفمبر 2026.',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-09',
  },
];

export const INITIAL_SAAS_BRANCHES: CompanyBranch[] = [
  // Twins Branches
  {
    id: 'br-twins-ruh-hq',
    companyId: 'tenant-twins-main',
    code: 'RUH-HQ',
    name: 'الفرع الرئيسي - الرياض',
    nameEn: 'Riyadh Headquarters',
    city: 'الرياض',
    address: 'طريق الملك فهد، حي الصحافة',
    phone: '+966 11 456 7890',
    managerName: 'م. فهد السبيعي',
    managerPhone: '+966 50 112 3344',
    isHeadquarter: true,
    active: true,
    elevatorsCount: 190,
    techniciansCount: 8,
    createdAt: '2026-01-01',
  },
  {
    id: 'br-twins-jed',
    companyId: 'tenant-twins-main',
    code: 'JED-01',
    name: 'فرع المنطقة الغربية - جدة',
    nameEn: 'Western Region Branch - Jeddah',
    city: 'جدة',
    address: 'طريق الأندلس، حي الحمراء',
    phone: '+966 12 555 4321',
    managerName: 'م. سلطان الغامدي',
    managerPhone: '+966 55 223 4455',
    isHeadquarter: false,
    active: true,
    elevatorsCount: 85,
    techniciansCount: 4,
    createdAt: '2026-02-10',
  },
  {
    id: 'br-twins-dmm',
    companyId: 'tenant-twins-main',
    code: 'DMM-01',
    name: 'فرع المنطقة الشرقية - الدمام',
    nameEn: 'Eastern Region Branch - Dammam',
    city: 'الدمام',
    address: 'طريق الملك خالد، حي الشاطئ',
    phone: '+966 13 888 7766',
    managerName: 'م. خالد الدوسري',
    managerPhone: '+966 54 334 5566',
    isHeadquarter: false,
    active: true,
    elevatorsCount: 45,
    techniciansCount: 3,
    createdAt: '2026-04-15',
  },
  // Al-Fursan Branches
  {
    id: 'br-fursan-jed-hq',
    companyId: 'tenant-al-fursan',
    code: 'FUR-JED',
    name: 'الفرع الرئيسي - جدة',
    nameEn: 'Jeddah Main HQ',
    city: 'جدة',
    address: 'طريق الأمير ماجد، حي الروضة',
    phone: '+966 12 685 4120',
    managerName: 'م. عمر الحربي',
    managerPhone: '+966 50 678 9900',
    isHeadquarter: true,
    active: true,
    elevatorsCount: 95,
    techniciansCount: 5,
    createdAt: '2026-03-01',
  },
  {
    id: 'br-fursan-mak',
    companyId: 'tenant-al-fursan',
    code: 'FUR-MAK',
    name: 'فرع العاصمة المقدسة - مكة المكرمة',
    nameEn: 'Makkah Branch',
    city: 'مكة المكرمة',
    address: 'حي الشوقية، الدائري الرابع',
    phone: '+966 12 544 1122',
    managerName: 'م. ياسر الشريف',
    managerPhone: '+966 56 778 8990',
    isHeadquarter: false,
    active: true,
    elevatorsCount: 50,
    techniciansCount: 3,
    createdAt: '2026-05-01',
  },
  // Gulf Peaks Branches
  {
    id: 'br-gulf-khb-hq',
    companyId: 'tenant-gulf-peaks',
    code: 'GP-KHB',
    name: 'الفرع الرئيسي - الخبر',
    nameEn: 'Khobar Main Office',
    city: 'الخبر',
    address: 'طريق الملك فيصل، حي اليرموك',
    phone: '+966 13 897 2200',
    managerName: 'م. عبد الله القحطاني',
    managerPhone: '+966 53 445 6677',
    isHeadquarter: true,
    active: true,
    elevatorsCount: 48,
    techniciansCount: 3,
    createdAt: '2026-06-15',
  },
  {
    id: 'br-gulf-jub',
    companyId: 'tenant-gulf-peaks',
    code: 'GP-JUB',
    name: 'فرع الجبيل الصناعية',
    nameEn: 'Jubail Industrial Branch',
    city: 'الجبيل',
    address: 'شارع جدة، الجبيل البلد',
    phone: '+966 13 361 4455',
    managerName: 'أ. ماجد الخالدي',
    managerPhone: '+966 54 889 0011',
    isHeadquarter: false,
    active: true,
    elevatorsCount: 20,
    techniciansCount: 2,
    createdAt: '2026-08-01',
  },
  // Smart Towers Branches
  {
    id: 'br-smart-ruh-hq',
    companyId: 'tenant-smart-towers',
    code: 'SM-RUH',
    name: 'الفرع الرئيسي - الرياض (شمال)',
    nameEn: 'North Riyadh HQ',
    city: 'الرياض',
    address: 'حي النرجس، طريق عثمان بن عفان',
    phone: '+966 11 223 9988',
    managerName: 'م. بدر المطيري',
    managerPhone: '+966 55 990 1122',
    isHeadquarter: true,
    active: true,
    elevatorsCount: 15,
    techniciansCount: 2,
    createdAt: '2026-10-01',
  },
];

export const INITIAL_SAAS_WAREHOUSES: CompanyWarehouse[] = [
  // Twins Warehouses
  {
    id: 'wh-twins-main-c',
    companyId: 'tenant-twins-main',
    branchId: 'br-twins-ruh-hq',
    code: 'WH-RUH-01',
    name: 'المستودع المركزي لقطع الغيار - الرياض',
    nameEn: 'Riyadh Central Spare Parts Warehouse',
    type: 'CENTRAL',
    city: 'الرياض',
    address: 'منطقة السلي للمستودعات، الرياض',
    managerName: 'أ. عبد الرحمن الشهري',
    managerPhone: '+966 50 889 4433',
    capacityUnits: 5000,
    currentStockItemsCount: 1420,
    active: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'wh-twins-van-1',
    companyId: 'tenant-twins-main',
    branchId: 'br-twins-ruh-hq',
    code: 'VAN-RUH-EMERGENCY',
    name: 'مستودع سيارة الطوارئ السريعة #1',
    nameEn: 'Emergency Rapid Van Warehouse #1',
    type: 'MAINTENANCE_VAN',
    city: 'الرياض',
    address: 'سيارة الصيانة الميدانية (فورد ترانزيت)',
    managerName: 'فني طارق المنصور',
    managerPhone: '+966 55 334 1122',
    capacityUnits: 150,
    currentStockItemsCount: 85,
    active: true,
    createdAt: '2026-02-15',
  },
  {
    id: 'wh-twins-jed-w',
    companyId: 'tenant-twins-main',
    branchId: 'br-twins-jed',
    code: 'WH-JED-01',
    name: 'مستودع المنطقة الغربية - جدة',
    nameEn: 'Western Region Spares Depot - Jeddah',
    type: 'BRANCH',
    city: 'جدة',
    address: 'حي الخمرة الصناعي، جدة',
    managerName: 'أ. مازن بادحدح',
    managerPhone: '+966 54 112 9988',
    capacityUnits: 2500,
    currentStockItemsCount: 680,
    active: true,
    createdAt: '2026-03-01',
  },
  // Al-Fursan Warehouses
  {
    id: 'wh-fursan-jed-c',
    companyId: 'tenant-al-fursan',
    branchId: 'br-fursan-jed-hq',
    code: 'WH-FUR-JED',
    name: 'مستودع الفرسان المركزي - جدة',
    nameEn: 'Al-Fursan Central Depot - Jeddah',
    type: 'CENTRAL',
    city: 'جدة',
    address: 'المستودعات، حي الخمرة، جدة',
    managerName: 'أ. نبيل السقاف',
    managerPhone: '+966 56 223 8811',
    capacityUnits: 3000,
    currentStockItemsCount: 890,
    active: true,
    createdAt: '2026-03-05',
  },
  {
    id: 'wh-fursan-mak-r',
    companyId: 'tenant-al-fursan',
    branchId: 'br-fursan-mak',
    code: 'WH-FUR-MAK',
    name: 'مستودع الإمداد الفوري - مكة',
    nameEn: 'Makkah Rapid Dispatch Hub',
    type: 'RAPID_DISPATCH',
    city: 'مكة المكرمة',
    address: 'حي الشوقية، مكة',
    managerName: 'أ. عادل هوساوي',
    managerPhone: '+966 50 998 1122',
    capacityUnits: 800,
    currentStockItemsCount: 240,
    active: true,
    createdAt: '2026-05-10',
  },
  // Gulf Peaks Warehouses
  {
    id: 'wh-gulf-dmm-c',
    companyId: 'tenant-gulf-peaks',
    branchId: 'br-gulf-khb-hq',
    code: 'WH-GP-MAIN',
    name: 'مستودع قمم الخليج لقطع المصاعد',
    nameEn: 'Gulf Peaks Spares Warehouse',
    type: 'CENTRAL',
    city: 'الدمام',
    address: 'المدينة الصناعية الثانية، الدمام',
    managerName: 'أ. مشعل الغامدي',
    managerPhone: '+966 53 114 7722',
    capacityUnits: 2000,
    currentStockItemsCount: 520,
    active: true,
    createdAt: '2026-06-20',
  },
  // Smart Towers Warehouses
  {
    id: 'wh-smart-ruh',
    companyId: 'tenant-smart-towers',
    branchId: 'br-smart-ruh-hq',
    code: 'WH-SMART-01',
    name: 'مستودع التجربة الذكية - الرياض',
    nameEn: 'Smart Towers Test Warehouse',
    type: 'CENTRAL',
    city: 'الرياض',
    address: 'طريق التخصصي، الرياض',
    managerName: 'م. بندر العتيبي',
    managerPhone: '+966 55 441 2233',
    capacityUnits: 1000,
    currentStockItemsCount: 160,
    active: true,
    createdAt: '2026-10-01',
  },
];
