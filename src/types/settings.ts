
export interface DrawingSettings {
  cwtDepthMm: number;
  cwtWidthMm: number; // usually calculated, but maybe user wants it fixed or standard
  cwtToRearGapMm: number;
  carToCwtGapMm: number;
  frontSillGapMm: number;
  doorOperatorGapMm?: number; // 150mm for center (50mm each side), 750mm for side opening 700mm
}

export interface CompanySettings {
  drawingSettings?: DrawingSettings;
  companyNameAr: string;
  companyNameEn: string;
  nameAr?: string;                  // alias for companyNameAr
  nameEn?: string;                  // alias for companyNameEn
  commercialRegistration: string;
  commercialReg?: string;           // alias for commercialRegistration
  vatNumber: string;
  taxNumber?: string;               // alias for vatNumber
  iban?: string;                    // Bank IBAN for invoice payments
  addressAr: string;
  addressEn: string;
  address?: string;                 // alias for addressAr
  phone: string;
  mobile: string;
  email: string;
  website: string;
  logoUrl?: string; // base64 or url
  logoPresetId: 'default' | 'gold_navy' | 'modern_blue' | 'royal_emerald';
  primaryColor: string; // e.g. '#172033'
  accentColor: string; // e.g. '#b6be49'
  headerColor: string; // e.g. '#111827'
  language: 'ar' | 'en';
  quotationPrefix: string;
  validityDays: number;
  warrantyYearsMachine: number;
  warrantyYearsFreeMaintenance: number;
  contractHeaderNotesAr: string;
  contractHeaderNotesEn: string;
  clientScopeNotesAr?: string;
  clientScopeNotesEn?: string;

  // Geolocation & Attendance Settings (تسجيل حضور الموقع والنطاق الجغرافي)
  attendanceRadiusMeters: number; // default e.g. 150 (meters)
  strictAttendanceGeofence: boolean; // if true, enforces strict range limit
  requireLocationPhoto?: boolean; // optional site photo proof

  // Google Sheets Auto-Sync Settings (مزامنة جوجل شيتس التلقائية)
  googleSheetsAutoSync?: boolean; // Enable or disable auto-sync
  googleSheetsSyncIntervalMinutes?: number; // Periodic interval in minutes (default: 5)
  googleSheetsSyncOnFocus?: boolean; // Push updates when app window is focused
  googleSheetsOnlyActiveProjects?: boolean; // Filter active projects only (non-Lost)
}

export interface AutoSyncLogEntry {
  id: string;
  timestamp: string; // Formatted date & time
  status: 'success' | 'error' | 'warning' | 'info';
  trigger: 'focus' | 'interval' | 'manual';
  message: string;
  projectCount?: number;
  details?: string;
  error?: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  drawingSettings: {
    cwtDepthMm: 250,
    cwtWidthMm: 800, // 80cm default
    cwtToRearGapMm: 70, // 70mm default
    carToCwtGapMm: 150, // 150mm default
    frontSillGapMm: 100,
    doorOperatorGapMm: 150 // جهاز الباب 150 مم (5 سم يمين و 5 سم يسار للمركزي، و 750 مم للجانبي 700)
  },
  companyNameAr: 'شركة توينز تكنولوجي للمصاعد',
  companyNameEn: 'Twins Technology Elevators Co.',
  commercialRegistration: '7003007833',
  vatNumber: '310912107300003',
  addressAr: 'المملكة العربية السعودية - الرياض - طريق الملك فهد',
  addressEn: 'King Fahd Road, Riyadh, Kingdom of Saudi Arabia',
  phone: '+966 0548764412',
  mobile: '+20 01063131831',
  email: 'info@twins4tech.com',
  website: 'www.twinselevators.com',
  logoUrl: '',
  logoPresetId: 'default',
  primaryColor: '#172033',
  accentColor: '#b6be49',
  headerColor: '#111827',
  language: 'ar',
  quotationPrefix: 'TL-QT-2026',
  validityDays: 30,
  warrantyYearsMachine: 10,
  warrantyYearsFreeMaintenance: 1,
  contractHeaderNotesAr: 'عرض فني ومالي وعقد توريد وتركيب معتمد طبقاً للمواصفات السعودية والأوروبية EN 81-20/50',
  contractHeaderNotesEn: 'Turnkey Technical Quotation & Supply Contract Agreement compliant with SASO & EN 81-20/50',
  clientScopeNotesAr: 'توفير تيار 380 فولت 3 فاز، إنهاء عزل بئر المصعد، وتوفير مكان آمن للتخزين.',
  clientScopeNotesEn: 'Provide 380V 3-phase power supply, hoistway waterproofing, and secure storage area.',
  attendanceRadiusMeters: 150,
  strictAttendanceGeofence: true,
  requireLocationPhoto: false,
  googleSheetsAutoSync: false,
  googleSheetsSyncIntervalMinutes: 5,
  googleSheetsSyncOnFocus: true,
  googleSheetsOnlyActiveProjects: true,
};

export interface ColorPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  primary: string;
  accent: string;
  header: string;
}

export const BRAND_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'twins_classic',
    nameAr: 'توينز كلاسيك (كحلي وذهبي زيتوني)',
    nameEn: 'Twins Classic (Navy & Olive Gold)',
    primary: '#172033',
    accent: '#b6be49',
    header: '#111827',
  },
  {
    id: 'royal_gold',
    nameAr: 'ملكي فاخر (كحلي داكن وذهب خالص)',
    nameEn: 'Royal Luxury (Deep Navy & Pure Gold)',
    primary: '#0d1b2a',
    accent: '#e0a927',
    header: '#0a1118',
  },
  {
    id: 'modern_sapphire',
    nameAr: 'أزرق تقني حديث (سفير وأكوا)',
    nameEn: 'Modern Tech (Sapphire & Cyan)',
    primary: '#0f3460',
    accent: '#06b6d4',
    header: '#0a192f',
  },
  {
    id: 'emerald_prestige',
    nameAr: 'زمردي برستيج (أخضر سعودي وليموني)',
    nameEn: 'Emerald Prestige (Saudi Green & Lime)',
    primary: '#064e3b',
    accent: '#10b981',
    header: '#022c22',
  },
  {
    id: 'charcoal_minimal',
    nameAr: 'رمادي فحمي عصري (فحم وبرتقالي)',
    nameEn: 'Charcoal Minimal (Graphite & Amber)',
    primary: '#1e293b',
    accent: '#f59e0b',
    header: '#0f172a',
  },
];
