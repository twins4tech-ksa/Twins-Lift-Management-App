import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Briefcase, 
  Wrench, 
  CreditCard, 
  Boxes, 
  Receipt, 
  ShieldAlert, 
  Layers, 
  Award,
  Compass,
  FileText,
  Printer,
  MessageSquare,
  Search,
  CheckCircle2,
  Bookmark,
  Share2
} from 'lucide-react';
import { 
  CustomPermissionRule, 
  EmployeeCategoryType, 
  DEFAULT_CUSTOM_RULES,
  EMPLOYEE_CATEGORY_CONFIGS 
} from '../types/employee';
import { AppLanguage } from '../utils/translations';

interface CustomRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customRules: CustomPermissionRule[];
  onSaveRule: (rule: CustomPermissionRule) => void;
  onDeleteRule: (ruleId: string) => void;
  language: AppLanguage;
  onSelectRuleForEmployee?: (rule: CustomPermissionRule) => void;
}

export const CustomRolesModal: React.FC<CustomRolesModalProps> = ({
  isOpen,
  onClose,
  customRules,
  onSaveRule,
  onDeleteRule,
  language,
  onSelectRuleForEmployee
}) => {
  const isAr = language === 'ar';

  const [editingRule, setEditingRule] = useState<CustomPermissionRule | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [permissionFilter, setPermissionFilter] = useState('');

  if (!isOpen) return null;

  const defaultAllPermissions = {
    canViewPricing: true,
    canViewGrossMargins: false,
    canCreateQuotations: true,
    canManageSalesContracts: false,
    canViewSalesAnalytics: false,
    canManageCustomers: true,
    canViewCadDrawings: true,
    canPrintQuotations: true,
    canPrintCadDrawings: true,

    canManageMaintenanceContracts: false,
    canManageMaintenanceVisits: false,
    canReportBreakdowns: true,
    canUpdateBreakdowns: false,
    canDispatchTechnicians: false,
    canSendWhatsAppAlerts: true,

    canManageInvoicesAndVouchers: false,
    canGenerateZatcaQr: false,
    canManageSafetyCertificates: false,
    canManageInventoryAndStock: false,
    canAccessSupplierPortal: false,
    canCreatePurchaseOrders: false,

    canManageEmployees: false,
    canManageCustomRules: false,
    canManageSettings: false,
    canCheckInGps: true,
    canPrintDocuments: true,
    canAccessCustomerPortal: false,
    canAccessTechnicianPortal: false,
    canViewAllDepartmentRecords: false,
  };

  const handleStartCreateNew = (templateCategory?: EmployeeCategoryType) => {
    const cat = templateCategory || 'SALES';
    const newRule: CustomPermissionRule = {
      id: `rule-custom-${Date.now()}`,
      nameAr: '',
      nameEn: '',
      category: cat,
      description: '',
      colorTheme: cat === 'MAINTENANCE' ? 'blue' : cat === 'INSTALLATION' ? 'purple' : cat === 'FINANCE' ? 'emerald' : 'indigo',
      isCustom: true,
      createdAt: new Date().toISOString(),
      permissions: { ...defaultAllPermissions }
    };
    setEditingRule(newRule);
    setIsCreatingNew(true);
  };

  const handleStartEdit = (rule: CustomPermissionRule) => {
    setEditingRule({
      ...rule,
      permissions: {
        ...defaultAllPermissions,
        ...rule.permissions
      }
    });
    setIsCreatingNew(false);
  };

  const handleTogglePermission = (key: keyof CustomPermissionRule['permissions']) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      permissions: {
        ...editingRule.permissions,
        [key]: !editingRule.permissions[key]
      }
    });
  };

  const handleSelectAllGroup = (keys: (keyof CustomPermissionRule['permissions'])[], enable: boolean) => {
    if (!editingRule) return;
    const updated = { ...editingRule.permissions };
    keys.forEach(k => { updated[k] = enable; });
    setEditingRule({ ...editingRule, permissions: updated });
  };

  const handleSelectAllAppPermissions = (enable: boolean) => {
    if (!editingRule) return;
    const updated = { ...editingRule.permissions };
    (Object.keys(updated) as (keyof CustomPermissionRule['permissions'])[]).forEach(k => {
      updated[k] = enable;
    });
    setEditingRule({ ...editingRule, permissions: updated });
  };

  // Quick Preset Templates
  const handleApplyTemplate = (type: 'FULL_ADMIN' | 'SALES_LEAD' | 'TECH_LEAD' | 'FINANCE_ZATCA' | 'SAFETY_ENG' | 'WAREHOUSE_SUPPLY') => {
    if (!editingRule) return;
    let templateNameAr = editingRule.nameAr;
    let templateNameEn = editingRule.nameEn;
    let category = editingRule.category;
    let colorTheme: CustomPermissionRule['colorTheme'] = editingRule.colorTheme;
    let permissions = { ...defaultAllPermissions };

    if (type === 'FULL_ADMIN') {
      templateNameAr = templateNameAr || 'إدارة عامة مع كافة الصلاحيات المخصصة';
      templateNameEn = templateNameEn || 'Full Administrative Access';
      category = 'EXECUTIVE';
      colorTheme = 'rose';
      (Object.keys(permissions) as (keyof typeof permissions)[]).forEach(k => { permissions[k] = true; });
    } else if (type === 'SALES_LEAD') {
      templateNameAr = templateNameAr || 'مدير مبيعات ومشاريع مع تسعير وعقود';
      templateNameEn = templateNameEn || 'Sales & Projects Supervisor';
      category = 'SALES';
      colorTheme = 'indigo';
      permissions.canCreateQuotations = true;
      permissions.canManageSalesContracts = true;
      permissions.canViewSalesAnalytics = true;
      permissions.canManageCustomers = true;
      permissions.canViewPricing = true;
      permissions.canViewGrossMargins = true;
      permissions.canViewCadDrawings = true;
      permissions.canPrintQuotations = true;
      permissions.canPrintDocuments = true;
      permissions.canViewAllDepartmentRecords = true;
    } else if (type === 'TECH_LEAD') {
      templateNameAr = templateNameAr || 'فني أول صيانة واستجابة طوارئ وتوجيه';
      templateNameEn = templateNameEn || 'Senior Maintenance & Dispatch Lead';
      category = 'MAINTENANCE';
      colorTheme = 'blue';
      permissions.canManageMaintenanceContracts = true;
      permissions.canManageMaintenanceVisits = true;
      permissions.canReportBreakdowns = true;
      permissions.canUpdateBreakdowns = true;
      permissions.canDispatchTechnicians = true;
      permissions.canSendWhatsAppAlerts = true;
      permissions.canCheckInGps = true;
      permissions.canAccessTechnicianPortal = true;
      permissions.canManageInventoryAndStock = true;
      permissions.canManageSafetyCertificates = true;
      permissions.canViewCadDrawings = true;
      permissions.canViewAllDepartmentRecords = false;
    } else if (type === 'FINANCE_ZATCA') {
      templateNameAr = templateNameAr || 'محاسب مالي وإدارة فواتير ZATCA وسندات';
      templateNameEn = templateNameEn || 'Financial & ZATCA Invoicing Specialist';
      category = 'FINANCE';
      colorTheme = 'emerald';
      permissions.canManageInvoicesAndVouchers = true;
      permissions.canGenerateZatcaQr = true;
      permissions.canViewPricing = true;
      permissions.canViewGrossMargins = true;
      permissions.canCreateQuotations = true;
      permissions.canManageSalesContracts = true;
      permissions.canManageMaintenanceContracts = true;
      permissions.canAccessSupplierPortal = true;
      permissions.canCreatePurchaseOrders = true;
      permissions.canPrintDocuments = true;
      permissions.canViewAllDepartmentRecords = true;
    } else if (type === 'SAFETY_ENG') {
      templateNameAr = templateNameAr || 'مهندس تركيبات واعتماد دفاع مدني وسلامة SASO';
      templateNameEn = templateNameEn || 'Civil Defense & Safety Engineer';
      category = 'INSTALLATION';
      colorTheme = 'purple';
      permissions.canManageSafetyCertificates = true;
      permissions.canViewCadDrawings = true;
      permissions.canPrintCadDrawings = true;
      permissions.canManageSalesContracts = true;
      permissions.canManageCustomers = true;
      permissions.canCheckInGps = true;
      permissions.canPrintDocuments = true;
      permissions.canViewAllDepartmentRecords = true;
    } else if (type === 'WAREHOUSE_SUPPLY') {
      templateNameAr = templateNameAr || 'مدير مستودع وبوابة موردين وأوامر شراء';
      templateNameEn = templateNameEn || 'Warehouse & Supplier Procurement Lead';
      category = 'WAREHOUSE';
      colorTheme = 'amber';
      permissions.canManageInventoryAndStock = true;
      permissions.canAccessSupplierPortal = true;
      permissions.canCreatePurchaseOrders = true;
      permissions.canViewPricing = true;
      permissions.canPrintDocuments = true;
    }

    setEditingRule({
      ...editingRule,
      nameAr: templateNameAr,
      nameEn: templateNameEn,
      category,
      colorTheme,
      permissions
    });
  };

  const handleSaveCurrentRule = () => {
    if (!editingRule) return;
    if (!editingRule.nameAr.trim()) {
      alert(isAr ? 'يرجى إدخال مسمى الـ Rule / الدور المخصص' : 'Please enter role name');
      return;
    }

    onSaveRule(editingRule);
    if (onSelectRuleForEmployee) {
      onSelectRuleForEmployee(editingRule);
    }
    setEditingRule(null);
    setIsCreatingNew(false);
  };

  // Granular Permission Groups Definition
  const permissionGroups = [
    {
      titleAr: '1. المبيعات، عروض الأسعار والمشاريع',
      titleEn: '1. Sales, Quotations & Projects',
      icon: Briefcase,
      color: 'text-blue-600',
      keys: [
        { key: 'canCreateQuotations', labelAr: 'إنشاء وتعديل عروض الأسعار الفنية والمالية', labelEn: 'Create & Edit Quotations' },
        { key: 'canManageSalesContracts', labelAr: 'إدارة وتوقيع عقود بيع المصاعد', labelEn: 'Manage Sales Contracts' },
        { key: 'canViewSalesAnalytics', labelAr: 'استعراض لوحة التحليلات وإحصاءات المبيعات', labelEn: 'View Sales Analytics' },
        { key: 'canManageCustomers', labelAr: 'إدارة وتعديل دليل العملاء والمستندات', labelEn: 'Manage Customers' },
        { key: 'canViewCadDrawings', labelAr: 'استعراض المخططات الهندسية ونظام التعليق CAD', labelEn: 'View CAD Drawings' },
        { key: 'canPrintCadDrawings', labelAr: 'طباعة المخطط الرأسي والأفقي CAD', labelEn: 'Print CAD Elevation/Plan' },
        { key: 'canViewPricing', labelAr: 'إظهار أسعار التكلفة والمبالغ المالية للمصاعد', labelEn: 'View Cost & Pricing' },
        { key: 'canViewGrossMargins', labelAr: 'إظهار هوامش الربح وتحليلات الأرباح الصافية', labelEn: 'View Gross Margins' },
        { key: 'canPrintQuotations', labelAr: 'طباعة عروض الأسعار الرسمية PDF', labelEn: 'Print Official Quotations' },
      ] as { key: keyof CustomPermissionRule['permissions']; labelAr: string; labelEn: string }[]
    },
    {
      titleAr: '2. الصيانة، الأعطال والطوارئ والخريطة',
      titleEn: '2. Maintenance, Breakdowns & Dispatch',
      icon: Wrench,
      color: 'text-amber-600',
      keys: [
        { key: 'canManageMaintenanceContracts', labelAr: 'إدارة وتجديد عقود الصيانة الدورية', labelEn: 'Manage Maintenance Contracts' },
        { key: 'canManageMaintenanceVisits', labelAr: 'جدولة وتوقيع زيارات الصيانة الدورية الميدانية', labelEn: 'Schedule Maintenance Visits' },
        { key: 'canReportBreakdowns', labelAr: 'تسجيل بلاغات الأعطال الجديدة', labelEn: 'Report New Breakdowns' },
        { key: 'canUpdateBreakdowns', labelAr: 'مباشرة وإغلاق وتحديث حالات بلاغات الأعطال', labelEn: 'Update Breakdown Status' },
        { key: 'canDispatchTechnicians', labelAr: 'الخريطة التفاعلية وتوجيه أقرب فني ميداني بنقرة', labelEn: 'Interactive Map & Tech Dispatch' },
        { key: 'canSendWhatsAppAlerts', labelAr: 'إرسال بيانات ومواقع الأعطال للفنيين عبر WhatsApp', labelEn: 'Send WhatsApp Breakdown Alerts' },
      ] as { key: keyof CustomPermissionRule['permissions']; labelAr: string; labelEn: string }[]
    },
    {
      titleAr: '3. المالية، الفواتير وسندات القبض (ZATCA)',
      titleEn: '3. Finance, Invoicing & Receipts',
      icon: Receipt,
      color: 'text-emerald-600',
      keys: [
        { key: 'canManageInvoicesAndVouchers', labelAr: 'إصدار وإدارة الفواتير الضريبية وسندات القبض', labelEn: 'Manage Tax Invoices & Receipts' },
        { key: 'canGenerateZatcaQr', labelAr: 'توليد وتدقيق QR Code المشفر TLV لهيئة الزكاة ZATCA', labelEn: 'Generate ZATCA Phase 1 & 2 QR' },
        { key: 'canPrintDocuments', labelAr: 'طباعة الفواتير والسندات بالترويسة والختم الرسمي', labelEn: 'Print Official Receipts & Invoices' },
      ] as { key: keyof CustomPermissionRule['permissions']; labelAr: string; labelEn: string }[]
    },
    {
      titleAr: '4. تراخيص السلامة والدفاع المدني (SASO)',
      titleEn: '4. Safety & Civil Defense (SASO)',
      icon: ShieldAlert,
      color: 'text-rose-600',
      keys: [
        { key: 'canManageSafetyCertificates', labelAr: 'إجراء الفحص الفني وإصدار شهادات السلامة المعتمدة', labelEn: 'Conduct Safety Audits & Certs' },
      ] as { key: keyof CustomPermissionRule['permissions']; labelAr: string; labelEn: string }[]
    },
    {
      titleAr: '5. المستودع، قطع الغيار وبوابة الموردين',
      titleEn: '5. Warehouse, Stock & Suppliers',
      icon: Boxes,
      color: 'text-cyan-700',
      keys: [
        { key: 'canManageInventoryAndStock', labelAr: 'إدارة المستودع والمخزون وحركات الجرد وقطع الغيار', labelEn: 'Manage Stock & Spare Parts' },
        { key: 'canAccessSupplierPortal', labelAr: 'الدخول لبوابة الموردين المعتمدين والمواصفات', labelEn: 'Access Supplier Portal' },
        { key: 'canCreatePurchaseOrders', labelAr: 'إنشاء وطباعة أوامر الشراء POs وإرسالها للموردين', labelEn: 'Create & Send Purchase Orders' },
      ] as { key: keyof CustomPermissionRule['permissions']; labelAr: string; labelEn: string }[]
    },
    {
      titleAr: '6. الإدارة، شؤون الموظفين، البصمة والبوابات',
      titleEn: '6. Administration, HR, GPS & Portals',
      icon: ShieldCheck,
      color: 'text-indigo-700',
      keys: [
        { key: 'canManageEmployees', labelAr: 'إدارة شؤون الموظفين والمناديب والبيانات الوظيفية', labelEn: 'Manage Employees & Directory' },
        { key: 'canManageCustomRules', labelAr: 'إنشاء وتعديل وتخصيص الأدوار والقواعد (Rules Builder)', labelEn: 'Create & Edit Custom Rules' },
        { key: 'canManageSettings', labelAr: 'إعدادات الشركة والشعار والتسعير الأساسي', labelEn: 'Company Settings & Branding' },
        { key: 'canCheckInGps', labelAr: 'تسجيل الحضور الميداني بالبصمة الجغرافية GPS', labelEn: 'GPS Site Check-In' },
        { key: 'canAccessCustomerPortal', labelAr: 'الوصول لبوابة العميل المعتمد واستعراض عقوده', labelEn: 'Customer Portal Access' },
        { key: 'canAccessTechnicianPortal', labelAr: 'الوصول لبوابة الفني الميداني ومباشرة الأعطال', labelEn: 'Technician Portal Access' },
        { key: 'canViewAllDepartmentRecords', labelAr: 'مشاهدة كافة سجلات وإضافات القسم المصرح به', labelEn: 'View All Department Records' },
      ] as { key: keyof CustomPermissionRule['permissions']; labelAr: string; labelEn: string }[]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>{isAr ? 'منظومة تخصيص الأدوار والصلاحيات (Custom Rules Builder)' : 'Custom Rules & Permissions Builder'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-400/30">
                  {customRules.length} {isAr ? 'قاعدة مسجلة' : 'rules'}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {isAr 
                  ? 'إنشاء وتسمية صلاحيات وقواعد مخصصة واختيار أي ميزة أو شاشة في التطبيق لكل موظف' 
                  : 'Build custom roles by name and configure granular permissions across the app'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          
          {/* Mode 1: Editor Form when creating or editing a rule */}
          {editingRule ? (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-black text-sm text-slate-900">
                    {isCreatingNew 
                      ? (isAr ? 'إنشاء Rule / دور مخصص جديد وإضافة الصلاحيات المطلوبة' : 'Create New Custom Rule') 
                      : (isAr ? `تعديل الـ Rule: ${editingRule.nameAr}` : `Edit Rule: ${editingRule.nameAr}`)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                >
                  {isAr ? '← العودة لقائمة الأدوار المعتمدة' : '← Back to Rules List'}
                </button>
              </div>

              {/* Quick Preset Templates Bar */}
              <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Bookmark className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'قوالب سريعة للبدء (يمكنك تخصيص وتعديل أي صلاحية بعدها):' : 'Quick Start Templates:'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('FULL_ADMIN')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    👑 {isAr ? 'إدارة عليا شاملة' : 'Full Admin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('SALES_LEAD')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    💼 {isAr ? 'مبيعات ومشاريع متقدمة' : 'Sales Lead'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('TECH_LEAD')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    🔧 {isAr ? 'فني أول وطوارئ وخريطة' : 'Tech & Emergency Lead'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('FINANCE_ZATCA')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    💵 {isAr ? 'محاسبة وفواتير ZATCA' : 'ZATCA Accountant'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('SAFETY_ENG')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    🛡️ {isAr ? 'تراخيص دفاع مدني ومخططات CAD' : 'Civil Defense & CAD'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('WAREHOUSE_SUPPLY')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    📦 {isAr ? 'مستودع وموردين وأوامر شراء' : 'Warehouse & Supply'}
                  </button>
                </div>
              </div>

              {/* Basic Rule Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {isAr ? 'اسم الـ Rule / الدور المخصص (بالعربية) *' : 'Role Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRule.nameAr}
                    onChange={(e) => setEditingRule({ ...editingRule, nameAr: e.target.value })}
                    placeholder={isAr ? 'مثال: مشرف مشاريع وتراخيص دفاع مدني' : 'e.g. Projects & Safety Supervisor'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {isAr ? 'مسمى الدور (بالإنجليزية)' : 'Role Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={editingRule.nameEn}
                    onChange={(e) => setEditingRule({ ...editingRule, nameEn: e.target.value })}
                    placeholder="e.g. Projects & Safety Lead"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {isAr ? 'نوعية وتصنيف القطاع (Category) *' : 'Category / Sector *'}
                  </label>
                  <select
                    value={editingRule.category}
                    onChange={(e) => setEditingRule({ ...editingRule, category: e.target.value as EmployeeCategoryType })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {(Object.keys(EMPLOYEE_CATEGORY_CONFIGS) as EmployeeCategoryType[]).map((catKey) => {
                      const c = EMPLOYEE_CATEGORY_CONFIGS[catKey];
                      return (
                        <option key={catKey} value={catKey}>
                          {isAr ? c.labelAr : c.labelEn}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    {isAr ? 'وصف الصلاحيات والغرض من هذا الـ Rule' : 'Role Description'}
                  </label>
                  <input
                    type="text"
                    value={editingRule.description || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    placeholder={isAr ? 'مثال: يمنح الموظف حق الوصول لعقود البيع والتركيبات، فحص السلامة، والخرائط الميدانية...' : 'Description...'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {isAr ? 'اللون التمييزي للدور' : 'Theme Color'}
                  </label>
                  <select
                    value={editingRule.colorTheme}
                    onChange={(e) => setEditingRule({ ...editingRule, colorTheme: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="indigo">أرجواني نيلي (Indigo)</option>
                    <option value="emerald">أخضر زمردي (Emerald)</option>
                    <option value="blue">أزرق سماوي (Blue)</option>
                    <option value="purple">بنفسجي (Purple)</option>
                    <option value="amber">برتقالي ذهبي (Amber)</option>
                    <option value="rose">وردي ياقوتي (Rose)</option>
                    <option value="teal">فيروزي (Teal)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permission Checklist Groups */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">
                      {isAr ? 'حدد أي صلاحية أو شاشة بالتطبيق لهذا الـ Rule:' : 'Configure Allowed Permissions in the App:'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'يمكنك تفعيل أو إلغاء تفعيل أي ميزة أو شاشة بالتطبيق بمرونة تامة' : 'Select granular features & screens across the entire system'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllAppPermissions(true)}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 cursor-pointer"
                    >
                      {isAr ? '✓ تحديد كافة صلاحيات التطبيق' : 'Select All in App'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllAppPermissions(false)}
                      className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      {isAr ? '✗ إلغاء تحديد الكل' : 'Clear All'}
                    </button>
                    <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      {Object.values(editingRule.permissions).filter(Boolean).length} / {Object.keys(editingRule.permissions).length} {isAr ? 'مفعلة' : 'active'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissionGroups.map((grp, gIdx) => {
                    const GroupIcon = grp.icon;
                    const groupKeys = grp.keys.map(k => k.key);
                    const allChecked = groupKeys.every(k => editingRule.permissions[k]);

                    return (
                      <div key={gIdx} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <div className="flex items-center gap-2">
                            <GroupIcon className={`w-4 h-4 ${grp.color}`} />
                            <span className="font-black text-xs text-slate-900">{grp.titleAr}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectAllGroup(groupKeys, !allChecked)}
                            className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            {allChecked ? (isAr ? 'إلغاء تحديد القسم' : 'Unselect') : (isAr ? 'تحديد القسم' : 'Select All')}
                          </button>
                        </div>

                        <div className="space-y-2">
                          {grp.keys.map((item) => {
                            const isChecked = Boolean(editingRule.permissions[item.key]);
                            return (
                              <label
                                key={item.key}
                                className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                                  isChecked 
                                    ? 'bg-white border-indigo-300 shadow-2xs' 
                                    : 'bg-white/60 border-slate-200/60 opacity-80 hover:bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(item.key)}
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className={`text-[11px] leading-snug ${isChecked ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                  {isAr ? item.labelAr : item.labelEn}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveCurrentRule}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ وتثبيت الـ Rule' : 'Save Custom Rule'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Mode 2: Rules List View */
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200">
                <div>
                  <h3 className="font-black text-sm text-indigo-950 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>{isAr ? 'الأدوار والقواعد المعتمدة والمخصصة للمنشأة' : 'Company Rules & Permissions'}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isAr 
                      ? 'يمكنك إنشاء أي Rule مخصص، تسميته بالمسمى المطلوب، اختيار نوعيته، وتحديد أي ميزة في التطبيق ثم إسناده للموظفين.' 
                      : 'Create custom rules, specify category, select any permission in the app, and assign to staff.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartCreateNew()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-102"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? '+ إنشاء Rule مخصص جديد' : '+ Create Custom Rule'}</span>
                </button>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customRules.map((rule) => {
                  const enabledCount = Object.values(rule.permissions).filter(Boolean).length;
                  const catConfig = EMPLOYEE_CATEGORY_CONFIGS[rule.category] || EMPLOYEE_CATEGORY_CONFIGS.SALES;

                  return (
                    <div 
                      key={rule.id} 
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                              <ShieldCheck className="w-5 h-5" />
                            </span>
                            <div>
                              <h4 className="font-black text-sm text-slate-900">{rule.nameAr}</h4>
                              {rule.nameEn && <div className="text-[10px] text-slate-400 font-medium">{rule.nameEn}</div>}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${catConfig.badgeBg} ${catConfig.badgeText} ${catConfig.badgeBorder}`}>
                            {isAr ? catConfig.labelAr : catConfig.labelEn}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {rule.description || (isAr ? 'صلاحيات مخصصة محددة بواسطة الإدارة العامة.' : 'Custom configured permissions.')}
                        </p>

                        {/* Summary of active permissions */}
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            {enabledCount} {isAr ? 'صلاحية نشطة' : 'active'}
                          </span>
                          {rule.permissions.canViewPricing && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {isAr ? 'كشف الأسعار' : 'Pricing'}
                            </span>
                          )}
                          {rule.permissions.canManageSafetyCertificates && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              {isAr ? 'الدفاع المدني' : 'Civil Defense'}
                            </span>
                          )}
                          {rule.permissions.canManageInvoicesAndVouchers && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              {isAr ? 'فواتير ZATCA' : 'ZATCA'}
                            </span>
                          )}
                          {rule.permissions.canAccessSupplierPortal && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              {isAr ? 'بوابة الموردين' : 'Suppliers'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        {onSelectRuleForEmployee ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectRuleForEmployee(rule);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isAr ? 'إسناد هذا الـ Rule للموظف' : 'Select for Employee'}</span>
                          </button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(rule)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={isAr ? 'تعديل الصلاحيات' : 'Edit Rule'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {rule.isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(isAr ? `هل أنت متأكد من حذف الـ Rule «${rule.nameAr}»؟` : `Delete rule ${rule.nameAr}?`)) {
                                  onDeleteRule(rule.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
