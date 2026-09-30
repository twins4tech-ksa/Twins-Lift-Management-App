import React, { useState, useRef } from 'react';
import { CompanySettings, BRAND_COLOR_PRESETS, ColorPreset, AutoSyncLogEntry } from '../types/settings';
import { TRANSLATIONS, AppLanguage } from '../utils/translations';
import { TwinsLogo } from './TwinsLogo';
import { 
  PenTool,
  Building2,   
  Palette, 
  FileText, 
  Image as ImageIcon, 
  Languages, 
  Save, 
  RotateCcw, 
  Upload, 
  Trash2, 
  Check, 
  Sparkles, 
  Eye, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  ShieldCheck, 
  FileCheck,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Wifi,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Clock,
  Activity,
  History,
  Info,
  Download
} from 'lucide-react';
import { 
  getWhatsAppConfig, 
  saveWhatsAppConfig, 
  checkWhatsAppConnection, 
  sendWhatsAppMessage, 
  WhatsAppConfig 
} from '../services/whatsappService';
import { exportSyncLogsToExcel } from '../utils/excelExport';
import { 
  exportSystemBackup, 
  validateBackupFile, 
  restoreSystemBackup, 
  SystemBackupData 
} from '../utils/backupRestore';

interface Props {
  settings: CompanySettings;
  language: AppLanguage;
  onUpdateSettings: (newSettings: CompanySettings) => void;
  onLanguageChange: (lang: AppLanguage) => void;
  onShowToast: (msg: string) => void;
  sheetsConfig?: {
    spreadsheetId: string;
    sheetUrl: string;
    accessToken: string;
    lastSyncedAt?: string;
  };
  onOpenSheetsModal?: () => void;
  onSyncNow?: () => Promise<void>;
  activeProjectsCount?: number;
  totalProjectsCount?: number;
  syncLogs?: AutoSyncLogEntry[];
  onClearSyncLogs?: () => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  language,
  onUpdateSettings,
  onLanguageChange,
  onShowToast,
  sheetsConfig,
  onOpenSheetsModal,
  onSyncNow,
  activeProjectsCount = 0,
  totalProjectsCount = 0,
  syncLogs = [],
  onClearSyncLogs,
}) => {
  const t = TRANSLATIONS[language];
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'LOGO' | 'COLORS' | 'TERMS' | 'ATTENDANCE' | 'WHATSAPP' | 'SHEETS' | 'PREVIEW' | 'DRAWING' | 'BACKUP'>('PROFILE');
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Backup & Restore State
  const [pendingBackup, setPendingBackup] = useState<SystemBackupData | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // WhatsApp API Settings State
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(getWhatsAppConfig);
  const [isCheckingWa, setIsCheckingWa] = useState(false);
  const [waConnResult, setWaConnResult] = useState<{ connected: boolean; statusText: string } | null>(null);
  const [waTestPhone, setWaTestPhone] = useState('966501234567');
  const [waTestMsg, setWaTestMsg] = useState('رسالة تجريبية من منصة إدارة المصاعد عبر Twins WA Integration API 🚀');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<any>(null);

  const handleExportLogsToExcel = () => {
    try {
      exportSyncLogsToExcel(syncLogs, sheetsConfig);
      onShowToast(
        t.sheetsExportSuccess ||
          (language === 'ar'
            ? 'تم تصدير سجلات المزامنة إلى ملف Excel بنجاح'
            : 'Sync logs exported to Excel (.xlsx) successfully')
      );
    } catch (err: any) {
      console.error('Failed to export sync logs to Excel:', err);
      onShowToast(language === 'ar' ? 'تعذر تصدير السجل' : 'Failed to export logs');
    }
  };

  const handleInputChange = (field: keyof CompanySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleColorPresetSelect = (preset: ColorPreset) => {
    setFormData((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      accentColor: preset.accent,
      headerColor: preset.header,
    }));
    onShowToast(language === 'ar' ? `تم تطبيق باليت: ${preset.nameAr}` : `Applied palette: ${preset.nameEn}`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(language === 'ar' ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG)' : 'Please select a valid image file (PNG, JPG, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        logoUrl: base64,
      }));
      onShowToast(language === 'ar' ? 'تم تحميل الشعار بنجاح!' : 'Logo uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onShowToast(language === 'ar' ? 'تم استعادة الشعار الافتراضي' : 'Restored default logo');
  };

  const handleSave = () => {
    onUpdateSettings(formData);
    onShowToast(t.settingsSavedSuccess);
  };

  const handleResetDefaults = () => {
    const confirmMsg = language === 'ar'
      ? 'هل أنت متأكد من استعادة كافة إعدادات الشركة والألوان والشعار إلى القيم الافتراضية؟'
      : 'Are you sure you want to reset all company settings, colors, and logo to defaults?';
    if (window.confirm(confirmMsg)) {
      import('../types/settings').then(({ DEFAULT_COMPANY_SETTINGS }) => {
        setFormData(DEFAULT_COMPANY_SETTINGS);
        onUpdateSettings(DEFAULT_COMPANY_SETTINGS);
        onLanguageChange(DEFAULT_COMPANY_SETTINGS.language);
        onShowToast(language === 'ar' ? 'تمت استعادة الإعدادات الافتراضية' : 'Settings reset to defaults');
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: formData.primaryColor }}
          >
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {t.settingsTitle}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t.settingsSubtitle}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            id="btn-reset-settings"
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDefaultsBtn}</span>
          </button>

          <button
            id="btn-save-settings"
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
            style={{ backgroundColor: formData.primaryColor }}
          >
            <Save className="w-4 h-4" />
            <span>{t.saveSettingsBtn}</span>
          </button>
        </div>
      </div>

      {/* Language Switcher Fast Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl border border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-700/60 rounded-xl text-amber-400">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold">{t.languageSelection}</div>
            <div className="text-xs text-slate-300">{t.languageSelectionDesc}</div>
          </div>
        </div>

        <div className="flex items-center bg-slate-950/80 p-1.5 rounded-xl border border-slate-700 gap-1.5">
          <button
            id="btn-lang-ar"
            type="button"
            onClick={() => {
              onLanguageChange('ar');
              handleInputChange('language', 'ar');
              onShowToast('تم تحويل لغة النظام إلى اللغة العربية');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              language === 'ar'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <span>🇸🇦</span>
            <span>{t.arabicLanguage}</span>
            {language === 'ar' && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-lang-en"
            type="button"
            onClick={() => {
              onLanguageChange('en');
              handleInputChange('language', 'en');
              onShowToast('System language switched to English');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <span>🌐</span>
            <span>{t.englishLanguage}</span>
            {language === 'en' && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full max-w-full bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs text-xs">
        <button
          id="tab-btn-profile"
          type="button"
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'PROFILE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t.tabCompanyProfile}</span>
        </button>

        <button
          id="tab-btn-logo"
          type="button"
          onClick={() => setActiveTab('LOGO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'LOGO'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>{t.tabLogoBranding}</span>
        </button>

        <button
          id="tab-btn-colors"
          type="button"
          onClick={() => setActiveTab('COLORS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'COLORS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>{t.tabColorPalette}</span>
        </button>

        <button
          id="tab-btn-terms"
          type="button"
          onClick={() => setActiveTab('TERMS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'TERMS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>{t.tabTermsDefaults}</span>
        </button>

        <button
          id="tab-btn-attendance"
          type="button"
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'ATTENDANCE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4 text-rose-500" />
          <span>{language === 'ar' ? 'نطاق الحضور الجغرافي (Geofence)' : 'Attendance & Geofence'}</span>
        </button>

        <button
          id="tab-btn-whatsapp"
          type="button"
          onClick={() => setActiveTab('WHATSAPP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'WHATSAPP'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          <span>{language === 'ar' ? 'ربط واتساب API' : 'WhatsApp API'}</span>
        </button>

        <button
          id="tab-btn-sheets"
          type="button"
          onClick={() => setActiveTab('SHEETS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'SHEETS'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>{t.tabSheetsSync || (language === 'ar' ? 'مزامنة جداول Google (Auto-Sync)' : 'Google Sheets & Auto-Sync')}</span>
          {formData.googleSheetsAutoSync && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          )}
        </button>

        <button
          id="tab-btn-preview"
          type="button"
          onClick={() => setActiveTab('PREVIEW')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'PREVIEW'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>{t.tabLivePreview}</span>
        </button>

        <button
          id="tab-btn-backup"
          type="button"
          onClick={() => setActiveTab('BACKUP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'BACKUP'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>{language === 'ar' ? 'النسخ الاحتياطي وحفظ البيانات' : 'Backup & Restore'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COMPANY PROFILE (بيانات المنشأة الرسمية)                            */}
      {/* ========================================================================= */}
      {activeTab === 'PROFILE' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.tabCompanyProfile}</h2>
              <p className="text-xs text-slate-500">هذه البيانات تظهر في ترويسة عروض الأسعار وعقود التوريد والتركيب والشهادات</p>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200">
              ERP &amp; Contracts Info
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arabic Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.companyNameAr} <span className="text-red-500">*</span>
              </label>
              <input
                id="input-company-name-ar"
                type="text"
                value={formData.companyNameAr}
                onChange={(e) => handleInputChange('companyNameAr', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* English Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.companyNameEn} <span className="text-red-500">*</span>
              </label>
              <input
                id="input-company-name-en"
                type="text"
                dir="ltr"
                value={formData.companyNameEn}
                onChange={(e) => handleInputChange('companyNameEn', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Commercial Registration (CR) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.commercialReg} <span className="text-red-500">*</span>
              </label>
              <input
                id="input-commercial-reg"
                type="text"
                value={formData.commercialRegistration}
                onChange={(e) => handleInputChange('commercialRegistration', e.target.value)}
                placeholder="7003007833"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Tax Number (VAT) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.vatNumber} <span className="text-red-500">*</span>
              </label>
              <input
                id="input-vat-number"
                type="text"
                value={formData.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                placeholder="310912107300003"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'ar' ? 'هاتف الإدارة / الخط الثابت' : 'Office Phone'}
              </label>
              <div className="relative">
                <input
                  id="input-phone"
                  type="text"
                  dir="ltr"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
              </div>
            </div>

            {/* Mobile / Sales Hotline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'ar' ? 'جوال المبيعات والتعاقدات' : 'Sales Hotline / Mobile'}
              </label>
              <div className="relative">
                <input
                  id="input-mobile"
                  type="text"
                  dir="ltr"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.email}
              </label>
              <div className="relative">
                <input
                  id="input-email"
                  type="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.website}
              </label>
              <div className="relative">
                <input
                  id="input-website"
                  type="text"
                  dir="ltr"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
              </div>
            </div>

            {/* Address Arabic */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.addressAr}
              </label>
              <div className="relative">
                <input
                  id="input-address-ar"
                  type="text"
                  value={formData.addressAr}
                  onChange={(e) => handleInputChange('addressAr', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Address English */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.addressEn}
              </label>
              <div className="relative">
                <input
                  id="input-address-en"
                  type="text"
                  dir="ltr"
                  value={formData.addressEn}
                  onChange={(e) => handleInputChange('addressEn', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LOGO & VISUAL IDENTITY (الشعار واللوجو)                             */}
      {/* ========================================================================= */}
      {activeTab === 'LOGO' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">{t.tabLogoBranding}</h2>
            <p className="text-xs text-slate-500">اختر شعار شركتك ليظهر بأعلى جودة على جميع أوراق وعروض أسعار وعقود المصاعد</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Upload Area */}
            <div className="md:col-span-7 space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 text-blue-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{t.uploadLogo}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.uploadLogoDesc}</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  اختيار ملف الشعار
                </button>
              </div>

              {formData.logoUrl && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>تم رفع واستخدام شعار مخصص بنجاح</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.removeCustomLogo}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Live Logo Preview Box */}
            <div className="md:col-span-5 space-y-3">
              <div className="text-xs font-bold text-slate-700">معاينة الشعار في الخلفية البيضاء والداكنة:</div>
              
              {/* Light Background Preview */}
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center min-h-32">
                <TwinsLogo size={72} customLogoUrl={formData.logoUrl} />
              </div>

              {/* Dark Background Preview */}
              <div 
                className="p-4 rounded-xl border border-slate-800 flex items-center justify-center min-h-32"
                style={{ backgroundColor: formData.primaryColor }}
              >
                <TwinsLogo size={72} customLogoUrl={formData.logoUrl} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COLOR PALETTES & BRANDING (ألوان الطباعة والهوية)                    */}
      {/* ========================================================================= */}
      {activeTab === 'COLORS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">{t.tabColorPalette}</h2>
            <p className="text-xs text-slate-500">تحكم باللون الأساسي واللون الثانوي للطباعة وجداول الأسعار والشهادات المعتمدة</p>
          </div>

          {/* Color Palettes Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2.5">
              {t.colorPresets} (جاهزة بنقرة واحدة):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {BRAND_COLOR_PRESETS.map((preset) => {
                const isSelected = formData.primaryColor === preset.primary && formData.accentColor === preset.accent;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleColorPresetSelect(preset)}
                    className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black text-slate-900">
                        {language === 'ar' ? preset.nameAr : preset.nameEn}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: preset.primary }} />
                      <div className="w-7 h-7 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: preset.accent }} />
                      <div className="w-7 h-7 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: preset.header }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            {/* Primary Color */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.primaryColor}
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.accentColor}
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => handleInputChange('accentColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={formData.accentColor}
                  onChange={(e) => handleInputChange('accentColor', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Header Dark Color */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.headerColor}
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={formData.headerColor}
                  onChange={(e) => handleInputChange('headerColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={formData.headerColor}
                  onChange={(e) => handleInputChange('headerColor', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DEFAULT TERMS & WARRANTY (الشروط والضمان الافتراضي)                 */}
      {/* ========================================================================= */}
      {activeTab === 'TERMS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">{t.tabTermsDefaults}</h2>
            <p className="text-xs text-slate-500">تخصيص الفترات الزمنية للضمان والصيانة والشروط التلقائية لعقود التوريد والتركيب</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                صلاحية عرض السعر الافتراضية (يوم)
              </label>
              <input
                type="number"
                min="7"
                max="180"
                value={formData.validityDays}
                onChange={(e) => handleInputChange('validityDays', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ضمان ماكينة المصعد (سنوات)
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={formData.warrantyYearsMachine}
                onChange={(e) => handleInputChange('warrantyYearsMachine', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الصيانة الدورية المجانية (سنوات)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.warrantyYearsFreeMaintenance}
                onChange={(e) => handleInputChange('warrantyYearsFreeMaintenance', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نص ترويسة العقد المعتمد (بالعربية)
              </label>
              <textarea
                rows={2}
                value={formData.contractHeaderNotesAr}
                onChange={(e) => handleInputChange('contractHeaderNotesAr', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تجهيزات والتزامات العميل (الملخص)
              </label>
              <textarea
                rows={2}
                value={formData.clientScopeNotesAr || ''}
                onChange={(e) => handleInputChange('clientScopeNotesAr', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ATTENDANCE & GEOFENCE RADIUS SETTINGS (نطاق التحقق الجغرافي)         */}
      {/* ========================================================================= */}
      {activeTab === 'ATTENDANCE' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                <span>{language === 'ar' ? 'إعدادات تسجيل حضور الموظف ونطاق الموقع (Geofence Radius)' : 'Field Attendance & Geofence Radius'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'ضبط المسافة المسموحة (بالمتر) لتسجيل حضور الفنيين والمناديب في موقع العميل والتأكد من تواجدهم الفعلي'
                  : 'Configure the allowed distance radius in meters for GPS check-in at client sites'}
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">
              GPS Radius Geofence
            </span>
          </div>

          {/* Primary Radius Control */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-5 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-0.5">
                  {language === 'ar' ? 'المسافة المسموحة المعتمدة حالياً:' : 'Current Allowed Radius:'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">
                    {formData.attendanceRadiusMeters || 150}
                  </span>
                  <span className="text-sm font-bold text-slate-300">
                    {language === 'ar' ? 'متر من مركز موقع العميل' : 'meters from client site'}
                  </span>
                </div>
              </div>

              {/* Direct numeric input */}
              <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-700">
                <label className="text-xs text-slate-300 font-medium">
                  {language === 'ar' ? 'تعديل يدوي:' : 'Manual Value:'}
                </label>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  step={10}
                  value={formData.attendanceRadiusMeters || 150}
                  onChange={(e) => handleInputChange('attendanceRadiusMeters', Math.max(10, parseInt(e.target.value) || 150))}
                  className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-bold text-center focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400 font-bold">{language === 'ar' ? 'متر' : 'm'}</span>
              </div>
            </div>

            {/* Visual Radius Presets */}
            <div>
              <span className="block text-xs font-bold text-slate-300 mb-2">
                {language === 'ar' ? 'مسافات محددة مسبقاً (اختر بنقرة واحدة):' : 'Quick Radius Presets:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { value: 50, labelAr: '50 متر', descAr: 'دقيق جداً (داخل المبنى)', descEn: 'Strict / Indoor' },
                  { value: 100, labelAr: '100 متر', descAr: 'المبنى وبوابته الرئيسية', descEn: 'Building & Gates' },
                  { value: 150, labelAr: '150 متر (موصى به)', descAr: 'مبنى ومواقف السيارات', descEn: 'Standard & Parking' },
                  { value: 300, labelAr: '300 متر', descAr: 'مجمع تجاري أو سكني واسع', descEn: 'Shopping Mall / Plaza' },
                  { value: 500, labelAr: '500 متر', descAr: 'مشروع إنشائي ضخم / مخطط', descEn: 'Large Construction Site' },
                ].map((preset) => {
                  const isSelected = (formData.attendanceRadiusMeters || 150) === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleInputChange('attendanceRadiusMeters', preset.value)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-400/40 shadow-xs text-white font-bold'
                          : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-medium'
                      }`}
                    >
                      <div className="text-xs font-extrabold text-white">{preset.labelAr}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{language === 'ar' ? preset.descAr : preset.descEn}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Verification Policies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strict Enforcement Toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <input
                id="toggle-strict-geofence"
                type="checkbox"
                checked={formData.strictAttendanceGeofence ?? true}
                onChange={(e) => handleInputChange('strictAttendanceGeofence', e.target.checked)}
                className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="toggle-strict-geofence" className="cursor-pointer">
                <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                  {language === 'ar'
                    ? 'فرض التحقق الصارم من النطاق الجغرافي (Strict Geofencing)'
                    : 'Enforce Strict Geofencing'}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {language === 'ar'
                    ? 'عند التفعيل: لا يمكن للفني أو المندوب اعتماد الحضور إذا كان خارج النطاق المحدد إلا بإدخال مبرر إداري رسمي يُسجل في التقرير.'
                    : 'Require mandatory written justification if check-in is attempted outside the designated radius.'}
                </span>
              </label>
            </div>

            {/* Photo Proof Toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <input
                id="toggle-require-photo"
                type="checkbox"
                checked={formData.requireLocationPhoto ?? false}
                onChange={(e) => handleInputChange('requireLocationPhoto', e.target.checked)}
                className="w-4 h-4 mt-1 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="toggle-require-photo" className="cursor-pointer">
                <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                  {language === 'ar'
                    ? 'اشتراط صورة إثبات من الموقع (Photo Verification)'
                    : 'Require Photo Verification on Site'}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {language === 'ar'
                    ? 'حث الفني أو المندوب على التقاط صورة سريعة للوحة التحكم أو الباب الخارجي للموقع لتوثيق الزيارة.'
                    : 'Prompt field staff to capture a photo of the site or elevator panel to confirm presence.'}
                </span>
              </label>
            </div>
          </div>

          {/* Compliance & GPS Advisory Callout */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">
                {language === 'ar'
                  ? 'حماية حقوق الصيانة والمبيعات عبر التوثيق الجغرافي بالأقمار الصناعية'
                  : 'Audit Protection via Satellite Geofencing'}
              </div>
              <p className="text-blue-800/90 leading-relaxed text-[11px]">
                {language === 'ar'
                  ? 'يتم حساب المسافة بين الموظف وموقع العميل لحظياً عبر معادلة هافرسين (Haversine Formula) الكروية الدقيقة. هذا النظام يضمن لعملائكم في عقود الصيانة الدورية وتوريد وتركيب المصاعد وصول الفني الميداني الفعلي للبرج، ويمنع الحضور الوهمي أو تسجيل الزيارات عن بعد.'
                  : 'Distance is measured in real-time using high-precision spherical Haversine formula, ensuring all maintenance visits and inspections are legitimately performed on site.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: TWINS WHATSAPP INTEGRATION API SETTINGS                              */}
      {/* ========================================================================= */}
      {activeTab === 'WHATSAPP' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <h2 className="text-base font-black text-slate-900">
                  {language === 'ar' ? 'إعدادات بوابة Twins WA Integration API' : 'Twins WhatsApp Integration API'}
                </h2>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  v1.0 Connected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {language === 'ar' 
                  ? 'ربط النظام ببوابة الواتساب لإرسال تنبيهات الزيارات، مواعيد الصيانة، التقارير الفنية، وإشعارات الأعطال للعملاء والفنيين تلقائياً.' 
                  : 'Configure API token and webhook endpoint to send automated WhatsApp alerts to clients and technicians.'}
              </p>
            </div>

            {/* Test Connection Button */}
            <button
              type="button"
              onClick={async () => {
                setIsCheckingWa(true);
                setWaConnResult(null);
                const res = await checkWhatsAppConnection();
                setIsCheckingWa(false);
                setWaConnResult(res);
                onShowToast(res.connected ? (language === 'ar' ? 'الاتصال بخادم واتساب نشط وجاهز ✅' : 'WhatsApp API Connected ✅') : (language === 'ar' ? 'تعذر الاتصال بخادم واتساب' : 'Connection failed'));
              }}
              disabled={isCheckingWa}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors shrink-0"
            >
              {isCheckingWa ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Wifi className="w-4 h-4 text-emerald-600" />}
              <span>{isCheckingWa ? (language === 'ar' ? 'جاري فحص الاتصال...' : 'Checking...') : (language === 'ar' ? 'فحص حالة الاتصال' : 'Test Connection')}</span>
            </button>
          </div>

          {/* Connection Test Status Banner */}
          {waConnResult && (
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              waConnResult.connected 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2.5">
                {waConnResult.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="font-black text-xs sm:text-sm">{waConnResult.statusText}</div>
                  <div className="text-[11px] opacity-80 font-mono mt-0.5">
                    Endpoint: {waConfig.baseUrl}/api/webhooks/send
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Configuration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'رابط الخادم الأساسي (Base URL):' : 'Base URL:'}
              </label>
              <input
                type="text"
                value={waConfig.baseUrl}
                onChange={(e) => setWaConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://wa.serv-1001.twins4tech.com"
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'رمز التوثيق (API Token / Webhook Token):' : 'API Token:'}
              </label>
              <input
                type="text"
                value={waConfig.apiToken}
                onChange={(e) => setWaConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                placeholder="fbe8674783dea0f0bf95073e4365853fd6181c4345c5b3fd"
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'مفتاح الدولة الافتراضي (Country Code):' : 'Default Country Code:'}
              </label>
              <input
                type="text"
                value={waConfig.defaultCountryCode}
                onChange={(e) => setWaConfig(prev => ({ ...prev, defaultCountryCode: e.target.value }))}
                placeholder="966"
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {language === 'ar' ? 'يتم استبدال الصفر الأول برمز الدولة تلقائياً (مثال: 0501234567 -> 966501234567)' : 'Replaces leading 0 automatically'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'معرف المصدر (Source Group):' : 'Source ID:'}
              </label>
              <input
                type="text"
                value={waConfig.source}
                onChange={(e) => setWaConfig(prev => ({ ...prev, source: e.target.value }))}
                placeholder="twins-app"
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* VPS & Data Directory Info Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
            <div className="font-bold flex items-center gap-2 text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{language === 'ar' ? 'بيانات الاستضافة والتكامل على السيرفر (Twins WA Integration)' : 'Server & Data Integration'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block">{language === 'ar' ? 'مجلد البيانات:' : 'Data Directory:'}</span>
                <span className="font-bold text-slate-800">/home/frappe/Twins_WA_Integration</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block">{language === 'ar' ? 'حماية API:' : 'API Protection:'}</span>
                <span className="font-bold text-emerald-700">{language === 'ar' ? 'مفعلة ومحمية برمز التوثيق لكل حساب' : 'Active & Token Protected'}</span>
              </div>
            </div>
          </div>

          {/* Test Send Section */}
          <div className="p-5 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/30 border border-emerald-200 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <h3 className="font-black text-sm text-slate-900">
                {language === 'ar' ? 'اختبار إرسال رسالة واتساب حية عبر الـ API' : 'Live WhatsApp Send Test'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'رقم الهاتف للتجربة:' : 'Test Phone Number:'}
                </label>
                <input
                  type="text"
                  value={waTestPhone}
                  onChange={(e) => setWaTestPhone(e.target.value)}
                  placeholder="050XXXXXXXX أو 9665XXXXXXXX"
                  className="w-full text-xs font-mono p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'نص الرسالة التجريبية:' : 'Test Message:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={waTestMsg}
                    onChange={(e) => setWaTestMsg(e.target.value)}
                    className="flex-1 text-xs p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!waTestPhone.trim() || !waTestMsg.trim()) return;
                      setIsSendingTest(true);
                      setTestSendResult(null);
                      const res = await sendWhatsAppMessage({
                        mobile_no: waTestPhone,
                        message: waTestMsg,
                        priority: 'high',
                        source: waConfig.source || 'twins-app',
                      });
                      setIsSendingTest(false);
                      setTestSendResult(res);
                      onShowToast(res.success ? (language === 'ar' ? 'تمت إضافة الرسالة لصف الإرسال بالواتساب بنجاح ✅' : 'Sent to queue! ✅') : (language === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send'));
                    }}
                    disabled={isSendingTest}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isSendingTest ? (language === 'ar' ? 'إرسال...' : 'Sending...') : (language === 'ar' ? 'إرسال الآن' : 'Send Test')}</span>
                  </button>
                </div>
              </div>
            </div>

            {testSendResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                testSendResult.success ? 'bg-emerald-100/60 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2">
                  {testSendResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{testSendResult.success ? (testSendResult.message || 'تم قبول الرسالة في صف الإرسال بنجاح') : (testSendResult.error || 'خطأ في الإرسال')}</span>
                  {testSendResult.outbox_id && (
                    <span className="font-mono font-bold bg-white/60 px-2 py-0.5 rounded">ID: {testSendResult.outbox_id}</span>
                  )}
                </div>
                {testSendResult.fallbackUrl && (
                  <a
                    href={testSendResult.fallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold hover:text-emerald-700"
                  >
                    {language === 'ar' ? 'فتح المحادثة' : 'Open in WA'}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Save WhatsApp Config Button */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                saveWhatsAppConfig(waConfig);
                onShowToast(language === 'ar' ? 'تم حفظ إعدادات واتساب بنجاح ✅' : 'WhatsApp settings saved ✅');
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{language === 'ar' ? 'حفظ إعدادات واتساب' : 'Save WhatsApp Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: GOOGLE SHEETS AUTO-SYNC CONFIGURATION (مزامنة جداول جوجل التلقائية)  */}
      {/* ========================================================================= */}
      {activeTab === 'SHEETS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {t.sheetsAutoSyncTitle || (language === 'ar' ? 'المزامنة التلقائية مع Google Sheets' : 'Google Sheets Auto-Sync')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.sheetsAutoSyncDesc || (language === 'ar' ? 'تحديث جداول Google تلقائياً ودفع بيانات المشاريع النشطة عند التركيز على التطبيق' : 'Automatically push updates for active projects when the app is focused')}
                </p>
              </div>
            </div>

            {/* Live Status Pill */}
            <div>
              {formData.googleSheetsAutoSync ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{t.sheetsAutoSyncActive || (language === 'ar' ? 'المزامنة التلقائية قيد التشغيل' : 'Auto-Sync Active')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>{t.sheetsAutoSyncInactive || (language === 'ar' ? 'المزامنة التلقائية متوقفة' : 'Auto-Sync Disabled')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Master Switch Banner */}
          <div className={`p-5 rounded-2xl border transition-all ${
            formData.googleSheetsAutoSync
              ? 'bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-emerald-50/50 border-emerald-300 shadow-xs'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900">
                    {t.sheetsAutoSyncEnable || (language === 'ar' ? 'تفعيل المزامنة التلقائية (Auto-Sync)' : 'Enable Auto-Sync')}
                  </span>
                  {formData.googleSheetsAutoSync && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                      {language === 'ar' ? 'مفعل' : 'ENABLED'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {language === 'ar'
                    ? 'عند تفعيل هذا الخيار، سيقوم النظام تلقائياً برفع وتحديث سجلات المشاريع وعروض الأسعار في جدول Google Sheets المتصل دون الحاجة لضغط زر المزامنة يدوياً في كل مرة.'
                    : 'When enabled, the system automatically pushes and updates active project records and quotations to the linked Google Sheet in the background without needing manual sync clicks.'}
                </p>
              </div>

              {/* Master Toggle Button */}
              <button
                id="toggle-sheets-auto-sync"
                type="button"
                role="switch"
                aria-checked={formData.googleSheetsAutoSync}
                onClick={() => {
                  const nextVal = !formData.googleSheetsAutoSync;
                  const updated = { ...formData, googleSheetsAutoSync: nextVal };
                  setFormData(updated);
                  onUpdateSettings(updated);
                  onShowToast(
                    nextVal
                      ? (language === 'ar' ? 'تم تفعيل المزامنة التلقائية مع Google Sheets بنجاح! 🔄' : 'Google Sheets Auto-Sync Enabled! 🔄')
                      : (language === 'ar' ? 'تم إيقاف المزامنة التلقائية مؤقتاً' : 'Google Sheets Auto-Sync Disabled')
                  );
                }}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  formData.googleSheetsAutoSync ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    formData.googleSheetsAutoSync 
                      ? (language === 'ar' ? '-translate-x-7' : 'translate-x-7') 
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sub-configurations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Setting 1: Sync on Window Focus */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{t.sheetsSyncOnFocus || (language === 'ar' ? 'المزامنة عند تنشيط النافذة (Window Focus Sync)' : 'Sync on Window Focus')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {language === 'ar'
                      ? 'دفع التحديثات تلقائياً فور العودة للتبويب وتنشيط نافذة التطبيق (مع مهلة حماية 30 ثانية لتفادي التكرار).'
                      : 'Automatically pushes updates as soon as you refocus or switch back to the app window (throttled to 30s to prevent spam).'}
                  </p>
                </div>
                <input
                  id="chk-sync-on-focus"
                  type="checkbox"
                  checked={formData.googleSheetsSyncOnFocus !== false}
                  onChange={(e) => {
                    const nextVal = e.target.checked;
                    const updated = { ...formData, googleSheetsSyncOnFocus: nextVal };
                    setFormData(updated);
                    onUpdateSettings(updated);
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-1 cursor-pointer"
                />
              </div>
              <div className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                <span>{language === 'ar' ? 'حالة ميزة Focus Listener:' : 'Focus Listener Status:'}</span>
                <span className="font-bold text-emerald-700">
                  {formData.googleSheetsSyncOnFocus !== false ? (language === 'ar' ? 'مفعلة' : 'Active') : (language === 'ar' ? 'معطلة' : 'Disabled')}
                </span>
              </div>
            </div>

            {/* Setting 2: Sync Interval Picker */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <RefreshCw className="w-4 h-4 text-teal-600" />
                  <span>{t.sheetsSyncInterval || (language === 'ar' ? 'الفاصل الزمني للمزامنة الدورية' : 'Periodic Sync Interval')}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {language === 'ar'
                    ? 'المدة الزمنية بين كل محاولة دفع تلقائي للتعديلات أثناء بقاء التطبيق مفتوحاً.'
                    : 'Duration between periodic sync pushes while working inside the app.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 1, labelAr: '1 دقيقة', labelEn: '1 min' },
                  { value: 2, labelAr: '2 دقيقة', labelEn: '2 min' },
                  { value: 5, labelAr: '5 دقائق ⭐', labelEn: '5 min ⭐' },
                  { value: 10, labelAr: '10 دقائق', labelEn: '10 min' },
                  { value: 15, labelAr: '15 دقيقة', labelEn: '15 min' },
                  { value: 30, labelAr: '30 دقيقة', labelEn: '30 min' },
                ].map((item) => {
                  const currentVal = formData.googleSheetsSyncIntervalMinutes || 5;
                  const isSelected = currentVal === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, googleSheetsSyncIntervalMinutes: item.value };
                        setFormData(updated);
                        onUpdateSettings(updated);
                        onShowToast(language === 'ar' ? `تم ضبط دورة المزامنة: كل ${item.labelAr}` : `Sync interval set to ${item.labelEn}`);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {language === 'ar' ? item.labelAr : item.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Setting 3: Scope Filter: Active Projects Only */}
            <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>{t.sheetsActiveOnly || (language === 'ar' ? 'حصر المزامنة على المشاريع النشطة فقط' : 'Sync Active Projects Only')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {language === 'ar'
                      ? 'مزامنة المشاريع المعتمدة وقيد التنفيذ والتوريد واستثناء المشاريع الملغية (Lost) للحفاظ على جدول شيتس منظم وخالي من العروض الملغية.'
                      : 'Pushes active quotes, approved, and in-progress projects, excluding lost/cancelled bids to keep Google Sheets clean.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg">
                    {language === 'ar' 
                      ? `${activeProjectsCount} مشروع نشط جاهز للمزامنة` 
                      : `${activeProjectsCount} active projects ready`}
                  </span>
                  <input
                    id="chk-active-projects-only"
                    type="checkbox"
                    checked={formData.googleSheetsOnlyActiveProjects !== false}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      const updated = { ...formData, googleSheetsOnlyActiveProjects: nextVal };
                      setFormData(updated);
                      onUpdateSettings(updated);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Connection Status Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${sheetsConfig?.spreadsheetId ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <h3 className="text-xs font-black text-slate-900">
                  {language === 'ar' ? 'حالة الاتصال والجدول المرتبط' : 'Google Sheets Connection & Target Spreadsheet'}
                </h3>
              </div>

              {sheetsConfig?.spreadsheetId && sheetsConfig.sheetUrl && (
                <a
                  href={sheetsConfig.sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                >
                  <span>{language === 'ar' ? 'فتح الجدول في Google Sheets' : 'Open in Google Sheets'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {sheetsConfig?.spreadsheetId ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    {language === 'ar' ? 'معرف الجدول (Spreadsheet ID):' : 'Spreadsheet ID:'}
                  </span>
                  <span className="font-mono font-bold text-slate-800 break-all text-[11px]">
                    {sheetsConfig.spreadsheetId}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    {language === 'ar' ? 'آخر توقيت مزامنة ناجحة:' : 'Last Synced At:'}
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-[11px]">
                    {sheetsConfig.lastSyncedAt || (language === 'ar' ? 'لم تتم المزامنة بعد في هذه الجلسة' : 'Not synced yet this session')}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    {language === 'ar' ? 'إجمالي المشاريع في الذاكرة:' : 'Total Projects in System:'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {language === 'ar' ? `${totalProjectsCount} مشاريع` : `${totalProjectsCount} Projects`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold">
                      {language === 'ar' ? 'لم يتم ربط جدول Google Sheets حتى الآن' : 'No Google Sheet currently connected'}
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      {language === 'ar'
                        ? 'يرجى ربط جدول أو إنشاء جدول جديد وتزويد رمز التوثيق لتبدأ المزامنة التلقائية.'
                        : 'Connect an existing sheet or create a new one to enable automatic background sync.'}
                    </div>
                  </div>
                </div>

                {onOpenSheetsModal && (
                  <button
                    type="button"
                    onClick={onOpenSheetsModal}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {language === 'ar' ? 'ربط جدول Google Sheets الآن' : 'Connect Google Sheet Now'}
                  </button>
                )}
              </div>
            )}

            {/* Quick Action Buttons for Google Sheets */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                {onOpenSheetsModal && (
                  <button
                    type="button"
                    onClick={onOpenSheetsModal}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'ar' ? 'إعدادات ربط الجدول والتوثيق' : 'Configure Sheet & Token'}</span>
                  </button>
                )}
              </div>

              {onSyncNow && sheetsConfig?.spreadsheetId && (
                <button
                  type="button"
                  disabled={isSyncingNow}
                  onClick={async () => {
                    setIsSyncingNow(true);
                    try {
                      await onSyncNow();
                      onShowToast(language === 'ar' ? 'تمت مزامنة جميع المشاريع بنجاح مع Google Sheets! ✅' : 'All projects synced to Google Sheets! ✅');
                    } catch (err: any) {
                      onShowToast(language === 'ar' ? 'تعذرت المزامنة: يرجى التحقق من صلاحيات التوثيق' : 'Sync failed: please check permissions');
                    } finally {
                      setIsSyncingNow(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSyncingNow ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSyncingNow
                      ? (language === 'ar' ? 'جاري المزامنة...' : 'Syncing...')
                      : (language === 'ar' ? 'مزامنة المشاريع النشطة الآن' : 'Push Updates Now')}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* AUTO-SYNC HEALTH & ACTIVITY LOGS (LAST 10 EVENTS)                         */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>{t.sheetsLogsTitle || (language === 'ar' ? 'سجل عمليات المزامنة التلقائية (آخر 10 عمليات)' : 'Auto-Sync Health & Activity Log (Last 10 Events)')}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {syncLogs.length} / 10
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.sheetsLogsSubtitle || (language === 'ar' ? 'مراقبة صحة التكامل، التوقيت، وحالات النجاح وأي أخطاء مسجلة' : 'Monitor integration health, event timestamps, success rates, and errors')}
                  </p>
                </div>
              </div>

              {/* Status Metric Pills, Export Button & Clear Button */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Export Sync Logs to xlsx Button */}
                <button
                  id="btn-export-sync-logs-excel"
                  type="button"
                  onClick={handleExportLogsToExcel}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                  title={language === 'ar' ? 'تصدير سجل المزامنة كاملاً بصيغة Excel (.xlsx) للتدقيق والأرشفة' : 'Export sync logs to Excel (.xlsx) for audit and archival'}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.sheetsExportLogsExcel || 'Export Sync Logs to xlsx'}</span>
                </button>

                {syncLogs.length > 0 && (
                  <>
                    {/* Success Count */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{syncLogs.filter(l => l.status === 'success').length} {language === 'ar' ? 'ناجحة' : 'Success'}</span>
                    </span>

                    {/* Error Count */}
                    {syncLogs.some(l => l.status === 'error') ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{syncLogs.filter(l => l.status === 'error').length} {language === 'ar' ? 'أخطاء مسجلة' : 'Errors'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>{language === 'ar' ? 'الحالة: 100% سليمة' : 'Health: 100% OK'}</span>
                      </span>
                    )}

                    {/* Clear Button */}
                    {onClearSyncLogs && (
                      <button
                        type="button"
                        onClick={onClearSyncLogs}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                        title={language === 'ar' ? 'مسح سجل الأحداث' : 'Clear log history'}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t.sheetsClearLogs || (language === 'ar' ? 'مسح' : 'Clear')}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Logs List Container */}
            {syncLogs.length === 0 ? (
              <div className="py-8 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <History className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {t.sheetsNoLogs || (language === 'ar' ? 'لا توجد سجلات مزامنة مسجلة حتى الآن' : 'No sync logs recorded yet')}
                </div>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  {language === 'ar'
                    ? 'سيتم تسجيل آخر 10 عمليات تلقائياً عند تركيز النافذة أو عند انطلاق الموقت الدوري أو المزامنة اليدوية، مع تتبع الأخطاء إن وجدت.'
                    : 'The last 10 auto-sync events will appear here with timestamps, project counts, and error details to help diagnose integration status.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 divide-y divide-slate-100">
                {syncLogs.map((log) => {
                  const isSuccess = log.status === 'success';
                  const isError = log.status === 'error';
                  const isWarning = log.status === 'warning';

                  return (
                    <div 
                      key={log.id} 
                      className={`pt-2.5 pb-2.5 first:pt-0 last:pb-0 transition-colors rounded-xl px-2.5 ${
                        isError ? 'bg-rose-50/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Status + Trigger + Message */}
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                          {/* Status Icon */}
                          <div className="shrink-0 mt-0.5 sm:mt-0">
                            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            {isError && <AlertCircle className="w-4 h-4 text-rose-600" />}
                            {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                            {log.status === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                          </div>

                          {/* Trigger Pill */}
                          <div className="shrink-0">
                            {log.trigger === 'focus' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                <Clock className="w-3 h-3" />
                                <span>{t.sheetsTriggerFocus || (language === 'ar' ? 'تنشيط النافذة' : 'Focus')}</span>
                              </span>
                            )}
                            {log.trigger === 'interval' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                                <RefreshCw className="w-3 h-3" />
                                <span>{t.sheetsTriggerInterval || (language === 'ar' ? 'دورية' : 'Interval')}</span>
                              </span>
                            )}
                            {log.trigger === 'manual' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                <span>{t.sheetsTriggerManual || (language === 'ar' ? 'يدوية' : 'Manual')}</span>
                              </span>
                            )}
                          </div>

                          {/* Message */}
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {log.message}
                          </div>

                          {/* Project Count Pill */}
                          {typeof log.projectCount === 'number' && (
                            <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {log.projectCount} {language === 'ar' ? 'مشاريع' : 'projects'}
                            </span>
                          )}
                        </div>

                        {/* Timestamp & Extra metadata */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0 justify-end">
                          {log.details && (
                            <span className="text-[10px] text-slate-500 hidden md:inline truncate max-w-xs">
                              {log.details}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-500 font-semibold">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{log.timestamp}</span>
                          </span>
                        </div>
                      </div>

                      {/* Error Banner Callout if present */}
                      {log.error && (
                        <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-mono flex items-start gap-2 break-all">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-bold block text-rose-900">{language === 'ar' ? 'تفاصيل الخطأ المسجل:' : 'Encountered Error Details:'}</span>
                            <span>{log.error}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* How It Works Explainer Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>{language === 'ar' ? 'كيف تعمل المزامنة التلقائية (Auto-Sync) عند التركيز؟' : 'How does Auto-Sync work on window focus?'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-300">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                <div className="font-bold text-white mb-1">1. {language === 'ar' ? 'استشعار التركيز (Focus)' : 'Focus Detection'}</div>
                <div>{language === 'ar' ? 'بمجرد تنشيط تبويب التطبيق أو العودة إليه، يستشعر النظام التفاعل ويقوم بالتحقق من آخر توقيت مزامنة.' : 'Whenever you return to the app tab, the system checks whether active changes need to be pushed.'}</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                <div className="font-bold text-white mb-1">2. {language === 'ar' ? 'الدفع في الخلفية (Background Push)' : 'Background Push'}</div>
                <div>{language === 'ar' ? 'يتم رفع سجلات المشاريع النشطة والمواصفات إلى Google Sheets دون مقاطعة العمل أو تجميد الشاشة.' : 'Active project specifications and financial totals are synced silently in the background.'}</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                <div className="font-bold text-white mb-1">3. {language === 'ar' ? 'حماية الأداء والكوتا' : 'Quota Protection'}</div>
                <div>{language === 'ar' ? 'وجود فترة تهدئة 30 ثانية يضمن عدم استهلاك كوتا Google Sheets API حتى مع التبديل السريع بين النوافذ.' : 'Smart 30-second throttling prevents redundant API quota usage during fast alt-tabbing.'}</div>
              </div>
            </div>
          </div>

          {/* Save Settings Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: formData.primaryColor }}
            >
              <Save className="w-4 h-4" />
              <span>{t.saveSettingsBtn}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LIVE PRINT PREVIEW (معاينة حية للمستند)                             */}
      {/* ========================================================================= */}
      
      {activeTab === 'DRAWING' && (
        <div className="space-y-6">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-6">
              <PenTool className="w-6 h-6 text-blue-400" />
              {language === 'ar' ? 'المقاسات الافتراضية للمخطط' : 'Default Drawing Sizes'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {language === 'ar' ? 'عمق ثقل الموازنة (CWT Depth)' : 'CWT Depth'} (mm)
                </label>
                <input
                  type="number"
                  value={formData.drawingSettings?.cwtDepthMm || 250}
                  onChange={(e) => setFormData({ ...formData, drawingSettings: { ...(formData.drawingSettings || { cwtDepthMm: 250, cwtWidthMm: 800, cwtToRearGapMm: 70, carToCwtGapMm: 150, frontSillGapMm: 100 }), cwtDepthMm: Number(e.target.value) } })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {language === 'ar' ? 'عرض ثقل الموازنة (CWT Width)' : 'CWT Width'} (mm)
                </label>
                <input
                  type="number"
                  value={formData.drawingSettings?.cwtWidthMm || 800}
                  onChange={(e) => setFormData({ ...formData, drawingSettings: { ...(formData.drawingSettings || { cwtDepthMm: 250, cwtWidthMm: 800, cwtToRearGapMm: 70, carToCwtGapMm: 150, frontSillGapMm: 100 }), cwtWidthMm: Number(e.target.value) } })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {language === 'ar' ? 'مسافة الثقل من الجدار الخلفي (CWT to Rear Gap)' : 'CWT to Rear Gap'} (mm)
                </label>
                <input
                  type="number"
                  value={formData.drawingSettings?.cwtToRearGapMm ?? 70}
                  onChange={(e) => setFormData({ ...formData, drawingSettings: { ...(formData.drawingSettings || { cwtDepthMm: 250, cwtWidthMm: 800, cwtToRearGapMm: 70, carToCwtGapMm: 150, frontSillGapMm: 100 }), cwtToRearGapMm: Number(e.target.value) } })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {language === 'ar' ? 'المسافة بين الكابينة والثقل (Car to CWT Gap)' : 'Car to CWT Gap'} (mm)
                </label>
                <input
                  type="number"
                  value={formData.drawingSettings?.carToCwtGapMm ?? 150}
                  onChange={(e) => setFormData({ ...formData, drawingSettings: { ...(formData.drawingSettings || { cwtDepthMm: 250, cwtWidthMm: 800, cwtToRearGapMm: 70, carToCwtGapMm: 150, frontSillGapMm: 100 }), carToCwtGapMm: Number(e.target.value) } })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {language === 'ar' ? 'خلوص العتبة الأمامية (Front Sill Gap)' : 'Front Sill Gap'} (mm)
                </label>
                <input
                  type="number"
                  value={formData.drawingSettings?.frontSillGapMm || 100}
                  onChange={(e) => setFormData({ ...formData, drawingSettings: { ...(formData.drawingSettings || { cwtDepthMm: 250, cwtWidthMm: 800, cwtToRearGapMm: 70, carToCwtGapMm: 150, frontSillGapMm: 100 }), frontSillGapMm: Number(e.target.value) } })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PREVIEW' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.tabLivePreview}</h2>
              <p className="text-xs text-slate-500">معاينة مباشرة لشكل الترويسة وألوان وهوية الشركة التي ستطبع على عروض الأسعار والعقود</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
              Live Mockup
            </span>
          </div>

          {/* Letterhead Sample Container */}
          <div className="border border-slate-300 rounded-2xl p-6 bg-white shadow-md max-w-4xl mx-auto">
            {/* Top Brand Strip */}
            <div 
              className="h-2 rounded-full mb-5"
              style={{
                background: `linear-gradient(90deg, ${formData.primaryColor} 0%, ${formData.primaryColor} 40%, ${formData.accentColor} 40%, ${formData.accentColor} 100%)`
              }}
            />

            {/* Official Header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <TwinsLogo size={52} customLogoUrl={formData.logoUrl} />
                <div>
                  <div 
                    className="text-base font-black tracking-tight"
                    style={{ color: formData.primaryColor }}
                  >
                    {formData.companyNameAr}
                  </div>
                  <div 
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: formData.accentColor }}
                  >
                    {formData.companyNameEn}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    سجل تجاري: {formData.commercialRegistration} | الرقم الضريبي: {formData.vatNumber}
                  </div>
                </div>
              </div>

              <div className="text-left text-[10px] text-slate-600 space-y-0.5" dir="ltr">
                <div className="font-bold text-right" dir="rtl">{formData.addressAr}</div>
                <div>{formData.addressEn}</div>
                <div>Phone: {formData.mobile || formData.phone}</div>
                <div>Email: {formData.email}</div>
              </div>
            </div>

            {/* Sample Section Title */}
            <div className="mt-6">
              <div 
                className="flex items-center justify-between px-3.5 py-2 text-white font-bold text-xs rounded-t-xl"
                style={{
                  backgroundColor: formData.primaryColor,
                  borderRight: `6px solid ${formData.accentColor}`,
                }}
              >
                <span>المواصفات الهندسية وجدول التكاليف</span>
                <span className="text-[10px] opacity-80" dir="ltr">Engineering Specifications</span>
              </div>
              <div className="border border-slate-200 border-t-0 p-4 rounded-b-xl bg-slate-50 text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>نوع المصعد: مصعد ركاب بدون غرفة ماكينة (MRL)</span>
                  <span className="font-mono font-bold" style={{ color: formData.primaryColor }}>800 KG / 10 P</span>
                </div>
                <div className="flex justify-between">
                  <span>الأكواد المعتمدة: كود البناء السعودي وكود المصاعد EN 81-20/50</span>
                  <span className="font-semibold text-emerald-700">SASO APPROVED</span>
                </div>
              </div>
            </div>

            {/* Sample Official Seal */}
            <div className="mt-8 flex justify-end">
              <div className="border border-slate-200 rounded-xl p-4 w-64 text-center bg-white relative">
                <div className="text-xs font-bold text-slate-900">{formData.companyNameAr}</div>
                <div className="text-[10px] text-slate-400">الختم والتوقيع الرسمي المعتمد</div>
                <div 
                  className="w-16 h-16 rounded-full border-2 mx-auto mt-2 flex flex-col items-center justify-center rotate-[-12deg] opacity-80"
                  style={{ borderColor: formData.accentColor }}
                >
                  <span className="text-[7px] font-black" style={{ color: formData.primaryColor }}>APPROVED</span>
                  <span className="text-[6px] font-bold" style={{ color: formData.accentColor }}>SEAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: SYSTEM BACKUP & RESTORE (النسخ الاحتياطي واستعادة البيانات)           */}
      {/* ========================================================================= */}
      {activeTab === 'BACKUP' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'ar' ? 'النسخ الاحتياطي الشامل واستعادة البيانات' : 'System Full Backup & Restore'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'ar' 
                    ? 'حفظ وتصدير كافة بيانات النظام (مشاريع، عملاء، عقود، بلاغات، موظفين، مخزون وموردين) لحمايتها من الضياع أو نقلها لجهاز آخر'
                    : 'Export and restore all database records, elevator projects, contracts, employees and inventory'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200">
              Offline JSON Vault
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Export Backup */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <Download className="w-5 h-5 text-indigo-600" />
                  <span>{language === 'ar' ? 'تصدير نسخة احتياطية كاملة (Export)' : 'Export Full Backup'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'ar'
                    ? 'يقوم النظام بجمع كافة الجداول والسجلات المحلية وحزمها في ملف بصيغة JSON آمن يمكنك حفظه في السحابة، على حاسوبك، أو إرساله بالبريد الإلكتروني.'
                    : 'Packs all local records, quotes, contracts and inventory into a single downloadable JSON backup file.'}
                </p>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <div>• {language === 'ar' ? `المشاريع المسجلة: ${totalProjectsCount} مشروع` : `Projects: ${totalProjectsCount}`}</div>
                  <div>• {language === 'ar' ? 'عقود الصيانة وبلاغات الأعطال' : 'Maintenance contracts & breakdowns'}</div>
                  <div>• {language === 'ar' ? 'أصناف المستودع وسجلات الموردين' : 'Inventory & vendors database'}</div>
                  <div>• {language === 'ar' ? 'إعدادات المنشأة والهوية البصرية' : 'Company branding & settings'}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    exportSystemBackup();
                    onShowToast(language === 'ar' ? 'تم تصدير وتحميل النسخة الاحتياطية بنجاح ✅' : 'Backup exported successfully ✅');
                  } catch (err) {
                    console.error(err);
                    onShowToast(language === 'ar' ? 'تعذر تصدير النسخة الاحتياطية' : 'Failed to export backup');
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? 'تحميل النسخة الاحتياطية الآن (.JSON)' : 'Download Backup File (.JSON)'}</span>
              </button>
            </div>

            {/* Card 2: Restore Backup */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Upload className="w-5 h-5 text-teal-600" />
                  <span>{language === 'ar' ? 'استعادة البيانات من نسخة سابقة (Restore)' : 'Restore from Backup'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'ar'
                    ? 'اختر ملف نسخة احتياطية سبق تصديره من هذا النظام لتحديث واستعادة كافة البيانات والسجلات مع فحص ومطابقة الهيكل تلقائياً.'
                    : 'Upload a previously exported JSON backup file to restore your entire database seamlessly.'}
                </p>

                {/* Hidden File Input */}
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result as string;
                        const parsed = validateBackupFile(content);
                        setPendingBackup(parsed);
                        onShowToast(language === 'ar' ? 'تم فحص ملف النسخة الاحتياطية بنجاح، يرجى التأكيد' : 'Backup validated, please confirm');
                      } catch (err: any) {
                        alert(language === 'ar' ? `خطأ في ملف النسخة الاحتياطية: ${err.message}` : `Invalid backup: ${err.message}`);
                      }
                    };
                    reader.readAsText(file);
                    // Reset input
                    e.target.value = '';
                  }}
                />

                {/* Pending Backup Preview if loaded */}
                {pendingBackup ? (
                  <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{language === 'ar' ? 'الملف جاهز للاستعادة:' : 'Backup ready to restore:'}</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 space-y-0.5">
                      <div>• {language === 'ar' ? `تاريخ النسخة: ${pendingBackup.timestamp.split('T')[0]}` : `Date: ${pendingBackup.timestamp.split('T')[0]}`}</div>
                      <div>• {language === 'ar' ? `المشاريع: ${pendingBackup.metadata.projectsCount} | العملاء: ${pendingBackup.metadata.customersCount}` : `Projects: ${pendingBackup.metadata.projectsCount} | Customers: ${pendingBackup.metadata.customersCount}`}</div>
                      <div>• {language === 'ar' ? `عقود الصيانة: ${pendingBackup.metadata.contractsCount} | الأصناف: ${pendingBackup.metadata.inventoryCount}` : `Contracts: ${pendingBackup.metadata.contractsCount} | Inventory: ${pendingBackup.metadata.inventoryCount}`}</div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-200">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            setIsRestoring(true);
                            const res = restoreSystemBackup(pendingBackup);
                            onShowToast(language === 'ar' ? `تمت استعادة البيانات بنجاح: ${res.restoredItemsSummary}` : 'Database restored successfully');
                            setTimeout(() => {
                              window.location.reload();
                            }, 1200);
                          } catch (err) {
                            alert(language === 'ar' ? 'حدث خطأ أثناء استعادة البيانات' : 'Restore failed');
                            setIsRestoring(false);
                          }
                        }}
                        disabled={isRestoring}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        {isRestoring ? (language === 'ar' ? 'جاري الاستعادة...' : 'Restoring...') : (language === 'ar' ? 'تأكيد واستعادة البيانات' : 'Confirm Restore')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingBackup(null)}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold border border-slate-300 cursor-pointer"
                      >
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 p-4 rounded-xl text-center text-xs text-slate-400">
                    {language === 'ar' ? 'انقر على الزر أدناه لاختيار ملف النسخة الاحتياطية (.json)' : 'Select .json backup file below'}
                  </div>
                )}
              </div>

              {!pendingBackup && (
                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{language === 'ar' ? 'اختيار ملف النسخة واستعادتها (.JSON)' : 'Select Backup File to Restore'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Quick Save Bar (Visible on mobile/tablet) */}
      <div className="sm:hidden sticky bottom-3 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-300 shadow-xl flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.resetDefaultsBtn}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 transition-all cursor-pointer"
          style={{ backgroundColor: formData.primaryColor }}
        >
          <Save className="w-4 h-4" />
          <span>{t.saveSettingsBtn}</span>
        </button>
      </div>
    </div>
  );
};
