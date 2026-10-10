import React from 'react';
import { NavTab } from '../types/navigation';
import { UserProfile, UserPortalRole } from '../types/portal';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import {
  Layers,
  Package,
  BarChart3,
  Printer,
  FileSpreadsheet,
  Briefcase,
  Users,
  Settings as SettingsIcon,
  Globe,
  Wrench,
  Award,
  BadgeCheck,
  FileText,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Building2,
  RefreshCw,
  Receipt,
  ShieldAlert,
  KeyRound,
  MapPin,
  Boxes,
  LayoutDashboard,
  LogOut
} from 'lucide-react';

interface DesktopSidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentRole: UserPortalRole;
  language: AppLanguage;
  companySettings: CompanySettings;
  currentUserProfile: UserProfile;
  onGoHome?: () => void;
  onOpenPortalSwitcher: () => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
  onToggleLanguage: () => void;
  onOpenSheetsModal: () => void;
  onNewQuotation: () => void;
  onNewProject?: () => void;
  onNewCustomer?: () => void;
  onNewBreakdown?: () => void;
  onNewContract?: () => void;
  onNewSalesContract?: () => void;
  onNewEmployee?: () => void;
  onNewAttendance?: () => void;
  customersCount: number;
  employeesCount: number;
  expiringContractsCount: number;
  inventoryCount?: number;
  lowStockItemsCount?: number;
  onNewInventoryItem?: () => void;
  activeCompanyName?: string;
  activeBranchName?: string;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  language,
  companySettings,
  currentUserProfile,
  onGoHome,
  onOpenPortalSwitcher,
  onChangePassword,
  onLogout,
  onToggleLanguage,
  onOpenSheetsModal,
  onNewQuotation,
  onNewProject = onNewQuotation,
  onNewCustomer = () => {},
  onNewBreakdown = () => {},
  onNewContract = () => {},
  onNewSalesContract = () => {},
  onNewEmployee = () => {},
  onNewAttendance = () => {},
  customersCount,
  employeesCount,
  expiringContractsCount,
  inventoryCount = 0,
  lowStockItemsCount = 0,
  activeCompanyName,
  activeBranchName,
}) => {
  const isAr = language === 'ar';

  const roleLabels: Record<UserPortalRole, { ar: string; en: string; color: string }> = {
    MANAGEMENT: { ar: 'الإدارة العليا', en: 'Management', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    SALES_REP: { ar: 'مندوب مبيعات', en: 'Sales Rep', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    TECHNICIAN: { ar: 'فني ميداني', en: 'Field Tech', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    CUSTOMER: { ar: 'عميل معتمد', en: 'Customer', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    SUPPLIER: { ar: 'مورد معتمد', en: 'Supplier', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    CUSTOM: { 
      ar: currentUserProfile.customRoleName || 'صلاحيات مخصصة', 
      en: currentUserProfile.customRoleName || 'Custom Role', 
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200' 
    }
  };

  const currentRoleInfo = roleLabels[currentRole] || roleLabels.MANAGEMENT;

  // Nav Item Component - Compact, Clean, Light
  const NavItem = ({
    tab,
    icon: Icon,
    labelAr,
    labelEn,
    iconColor = 'text-slate-400',
    badge,
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'
  }: {
    tab: NavTab;
    icon: React.ElementType;
    labelAr: string;
    labelEn: string;
    iconColor?: string;
    badge?: string | number | null;
    badgeColor?: string;
  }) => {
    const isActive = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-100 group cursor-pointer ${
          isActive
            ? 'bg-blue-600 text-white font-bold shadow-xs'
            : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/70'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 transition-transform duration-100 group-hover:scale-105 ${
              isActive ? 'text-white' : `${iconColor} group-hover:text-blue-600`
            }`}
          />
          <span className="truncate">{isAr ? labelAr : labelEn}</span>
        </div>

        {badge !== undefined && badge !== null && (
          <span
            className={`shrink-0 text-[10px] px-1.5 py-0.2 rounded-full font-bold border transition-colors ${
              isActive ? 'bg-white/20 text-white border-white/30' : badgeColor
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  // Section Header Component - Minimal with subtle divider
  const SectionHeader = ({ titleAr, titleEn }: { titleAr: string; titleEn: string }) => (
    <div className="px-2 pt-2 pb-0.5 flex items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {isAr ? titleAr : titleEn}
      </span>
      <div className="h-px flex-1 bg-slate-200/60" />
    </div>
  );

  return (
    <aside
      id="desktop-sidebar"
      aria-label={isAr ? 'القائمة الجانبية الرئيسية' : 'Main Sidebar Navigation'}
      className="no-print hidden lg:flex flex-col w-64 xl:w-72 2xl:w-80 h-[calc(100vh-4rem)] sticky top-16 bg-white text-slate-700 border-r rtl:border-r-0 rtl:border-l border-slate-200 shadow-sm shrink-0 z-30 select-none overflow-hidden"
    >
      {/* 1. Header: User Profile Card (Clean, Compact, High-contrast) */}
      <div className="p-2 border-b border-slate-200/80 bg-slate-50/70 shrink-0">
        <div className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-1.5 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-slate-900 truncate">
              {currentUserProfile.name || currentUserProfile.nameEn || (isAr ? 'المدير العام' : 'General Manager')}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${currentRoleInfo.color}`}
              >
                {isAr ? currentRoleInfo.ar : currentRoleInfo.en}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onChangePassword && (
              <button
                type="button"
                onClick={onChangePassword}
                title={isAr ? 'تغيير الرقم السري' : 'Change Password'}
                className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-xs flex items-center cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenPortalSwitcher}
              title={isAr ? 'تبديل الدور أو البوابة' : 'Switch Role or Portal'}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors text-xs flex items-center cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors text-xs flex items-center cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {activeCompanyName && (
          <button
            type="button"
            onClick={() => setActiveTab('SAAS_PORTAL')}
            className="w-full mt-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-900 flex items-center justify-between text-[11px] font-bold transition-colors cursor-pointer"
            title={isAr ? 'الشركة الحالية - انقر لفتح لوحة الشركات SaaS' : 'Active Tenant - Click to open SaaS Hub'}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">{activeCompanyName}</span>
            </div>
            {activeBranchName && (
              <span className="text-[10px] text-indigo-600 font-normal shrink-0 truncate max-w-[80px]">
                {activeBranchName}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation List - Fully expanded downwards with all choices visible */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
        {/* ================= MANAGEMENT ROLE ================= */}
        {currentRole === 'MANAGEMENT' && (
          <>
            <SectionHeader titleAr="لوحة التحكم والمؤشرات" titleEn="Dashboard & Overview" />
            <NavItem
              tab="DASHBOARD"
              icon={LayoutDashboard}
              labelAr="لوحة التحكم الرئيسية"
              labelEn="Executive Dashboard"
              iconColor="text-blue-600"
            />

            <SectionHeader titleAr="المبيعات والمشاريع" titleEn="Sales & Projects" />
            <NavItem
              tab="CUSTOMERS"
              icon={Users}
              labelAr="دليل العملاء"
              labelEn="Customers Directory"
              iconColor="text-emerald-500"
              badge={customersCount}
              badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
            />
            <NavItem
              tab="INTERACTIVE_MAP"
              icon={MapPin}
              labelAr="الخريطة التفاعلية"
              labelEn="Interactive Map"
              iconColor="text-rose-500"
            />
            <NavItem
              tab="SALES_QUOTATIONS"
              icon={Briefcase}
              labelAr="عروض بيع المصاعد"
              labelEn="Elevator Sales Quotations"
              iconColor="text-blue-500"
            />
            <NavItem
              tab="SALES_CONTRACTS"
              icon={BadgeCheck}
              labelAr="عقود بيع المصاعد"
              labelEn="Elevator Contracts"
              iconColor="text-teal-500"
            />
            <NavItem
              tab="SALES_ANALYTICS"
              icon={BarChart3}
              labelAr="التحليلات والمبيعات"
              labelEn="Sales Analytics"
              iconColor="text-indigo-500"
            />

            <SectionHeader titleAr="عقود وخدمات الصيانة" titleEn="Maintenance & Support" />
            <NavItem
              tab="MAINTENANCE_QUOTATIONS"
              icon={FileText}
              labelAr="عروض الصيانة"
              labelEn="Maintenance Quotes"
              iconColor="text-blue-500"
            />
            <NavItem
              tab="MAINTENANCE_CONTRACTS"
              icon={Wrench}
              labelAr="عقود الصيانة السارية"
              labelEn="Maintenance Contracts"
              iconColor="text-amber-500"
              badge={expiringContractsCount > 0 ? expiringContractsCount : null}
              badgeColor="bg-amber-100 text-amber-800 border-amber-300 font-bold"
            />
            <NavItem
              tab="MAINTENANCE_SCHEDULES"
              icon={Calendar}
              labelAr="إدارة زيارات الصيانة"
              labelEn="Maintenance Visits"
              iconColor="text-purple-500"
            />
            <NavItem
              tab="MAINTENANCE_BREAKDOWNS"
              icon={AlertTriangle}
              labelAr="إدارة بلاغات الأعطال"
              labelEn="Breakdowns Management"
              iconColor="text-rose-500"
            />
            <NavItem
              tab="TECHNICIAN_PORTAL"
              icon={Wrench}
              labelAr="لوحة الفنيين وتطبيق الميدان"
              labelEn="Technician Field Portal"
              iconColor="text-blue-500"
            />

            <SectionHeader titleAr="المالية والسلامة والتراخيص" titleEn="Finance & Safety" />
            <NavItem
              tab="FINANCE_INVOICES"
              icon={Receipt}
              labelAr="الفوترة وسندات القبض"
              labelEn="Invoices & Receipts (ZATCA)"
              iconColor="text-emerald-500"
            />
            <NavItem
              tab="SAFETY_CERTIFICATES"
              icon={ShieldAlert}
              labelAr="شهادات السلامة والدفاع المدني"
              labelEn="Safety & Civil Defense"
              iconColor="text-rose-500"
            />

            <SectionHeader titleAr="التصميم والهندسة" titleEn="Engineering & Design" />
            <NavItem
              tab="DRAWINGS"
              icon={Layers}
              labelAr="المخطط الهندسي CAD"
              labelEn="CAD Drawings"
              iconColor="text-sky-500"
            />
            <NavItem
              tab="COMPONENTS"
              icon={Package}
              labelAr="قائمة المكونات والتكاليف"
              labelEn="Components BOM"
              iconColor="text-emerald-500"
            />
            <NavItem
              tab="INVENTORY"
              icon={Boxes}
              labelAr="المستودع والمخزون"
              labelEn="Warehouse & Stock"
              iconColor="text-amber-500"
              badge={lowStockItemsCount > 0 ? (isAr ? `${lowStockItemsCount} نواقص` : `${lowStockItemsCount} low`) : inventoryCount}
              badgeColor={lowStockItemsCount > 0 ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' : 'bg-amber-50 text-amber-700 border-amber-200 font-mono'}
            />
            <NavItem
              tab="PRINT"
              icon={Printer}
              labelAr="الطباعة والعقد"
              labelEn="Print & Contract"
              iconColor="text-slate-500"
            />

            <SectionHeader titleAr="الفريق والإعدادات" titleEn="Team & Settings" />
            <NavItem
              tab="EMPLOYEES"
              icon={Award}
              labelAr="الموظفون والفنيون"
              labelEn="Staff & Technicians"
              iconColor="text-teal-500"
              badge={employeesCount}
              badgeColor="bg-teal-50 text-teal-700 border-teal-200"
            />
            <NavItem
              tab="SETTINGS"
              icon={SettingsIcon}
              labelAr="إعدادات الشركة والهوية"
              labelEn="Company Settings"
              iconColor="text-slate-500"
            />
            <NavItem
              tab="SAAS_PORTAL"
              icon={Globe}
              labelAr="لوحة تحكم الشركات (SaaS)"
              labelEn="Multi-Company SaaS"
              iconColor="text-indigo-600"
              badge="SaaS"
              badgeColor="bg-indigo-100 text-indigo-800 border-indigo-300 font-bold"
            />
          </>
        )}

        {/* ================= SALES REP ROLE ================= */}
        {currentRole === 'SALES_REP' && (
          <>
            <SectionHeader titleAr="لوحة التحكم والمبيعات" titleEn="Dashboard & Sales" />
            <NavItem
              tab="DASHBOARD"
              icon={LayoutDashboard}
              labelAr="لوحة التحكم الرئيسية"
              labelEn="Sales Dashboard"
              iconColor="text-blue-600"
            />

            <SectionHeader titleAr="المبيعات والعملاء" titleEn="Sales & CRM" />
            <NavItem
              tab="CUSTOMERS"
              icon={Users}
              labelAr="دليل العملاء"
              labelEn="Customers Directory"
              iconColor="text-emerald-500"
              badge={customersCount}
            />
            <NavItem
              tab="INTERACTIVE_MAP"
              icon={MapPin}
              labelAr="الخريطة التفاعلية"
              labelEn="Interactive Map"
              iconColor="text-rose-500"
            />
            <NavItem
              tab="SALES_QUOTATIONS"
              icon={Briefcase}
              labelAr="عروض بيع المصاعد"
              labelEn="Elevator Sales Quotations"
              iconColor="text-blue-500"
            />
            <NavItem
              tab="SALES_CONTRACTS"
              icon={BadgeCheck}
              labelAr="عقود بيع المصاعد"
              labelEn="Elevator Contracts"
              iconColor="text-teal-500"
            />
            <NavItem
              tab="SALES_ANALYTICS"
              icon={BarChart3}
              labelAr="التحليلات والمبيعات"
              labelEn="Sales Analytics"
              iconColor="text-indigo-500"
            />

            <SectionHeader titleAr="التصميم والمواصفات" titleEn="Specs & CAD" />
            <NavItem
              tab="DRAWINGS"
              icon={Layers}
              labelAr="المخطط الهندسي CAD"
              labelEn="CAD Drawings"
              iconColor="text-sky-500"
            />
            <NavItem
              tab="PRINT"
              icon={Printer}
              labelAr="الطباعة والعقد"
              labelEn="Print & Contract"
              iconColor="text-slate-500"
            />
          </>
        )}

        {/* ================= TECHNICIAN ROLE ================= */}
        {currentRole === 'TECHNICIAN' && (
          <>
            <SectionHeader titleAr="لوحة التحكم والميدان" titleEn="Dashboard & Field" />
            <NavItem
              tab="DASHBOARD"
              icon={LayoutDashboard}
              labelAr="لوحة التحكم الميدانية"
              labelEn="Field Dashboard"
              iconColor="text-blue-600"
            />
            <NavItem
              tab="TECHNICIAN_PORTAL"
              icon={Wrench}
              labelAr="لوحة الفني الميداني"
              labelEn="Technician Workspace"
              iconColor="text-blue-500"
            />
            <NavItem
              tab="INTERACTIVE_MAP"
              icon={MapPin}
              labelAr="خريطة المواقع الميدانية"
              labelEn="Field GPS Map"
              iconColor="text-rose-500"
            />
            <NavItem
              tab="MAINTENANCE_SCHEDULES"
              icon={Calendar}
              labelAr="إدارة زيارات الصيانة"
              labelEn="Maintenance Visits"
              iconColor="text-purple-500"
            />
            <NavItem
              tab="MAINTENANCE_BREAKDOWNS"
              icon={AlertTriangle}
              labelAr="إدارة بلاغات الأعطال"
              labelEn="Breakdowns Management"
              iconColor="text-rose-500"
            />

            <SectionHeader titleAr="المخططات وقطع الغيار" titleEn="Technical Specs" />
            <NavItem
              tab="DRAWINGS"
              icon={Layers}
              labelAr="مخطط التعليق والبئر CAD"
              labelEn="Shaft & Suspension CAD"
              iconColor="text-sky-500"
            />
            <NavItem
              tab="COMPONENTS"
              icon={Package}
              labelAr="المكونات الفنية BOM"
              labelEn="Components BOM"
              iconColor="text-emerald-500"
            />
            <NavItem
              tab="INVENTORY"
              icon={Boxes}
              labelAr="قطع غيار المستودع"
              labelEn="Warehouse Spare Parts"
              iconColor="text-amber-500"
            />
          </>
        )}

        {/* ================= CUSTOMER ROLE ================= */}
        {currentRole === 'CUSTOMER' && (
          <>
            <SectionHeader titleAr="لوحة التحكم والعميل" titleEn="Dashboard & Portal" />
            <NavItem
              tab="DASHBOARD"
              icon={LayoutDashboard}
              labelAr="لوحة التحكم الرئيسية"
              labelEn="Customer Dashboard"
              iconColor="text-blue-600"
            />
            <NavItem
              tab="CUSTOMER_PORTAL"
              icon={ShieldCheck}
              labelAr="لوحة المتابعة الشاملة"
              labelEn="Customer Portal"
              iconColor="text-emerald-500"
            />
            <NavItem
              tab="MAINTENANCE_CONTRACTS"
              icon={Building2}
              labelAr="مصاعدي وعقود الصيانة"
              labelEn="My Elevators & Contracts"
              iconColor="text-blue-500"
            />
            <NavItem
              tab="SALES_QUOTATIONS"
              icon={FileText}
              labelAr="عروض الأسعار المعتمدة"
              labelEn="Approved Quotations"
              iconColor="text-amber-500"
            />
            <NavItem
              tab="DRAWINGS"
              icon={Layers}
              labelAr="المخطط الهندسي ونظام التعليق"
              labelEn="CAD Drawings & Specs"
              iconColor="text-purple-500"
            />
          </>
        )}

        {/* ================= SUPPLIER ROLE ================= */}
        {currentRole === 'SUPPLIER' && (
          <>
            <SectionHeader titleAr="لوحة التحكم والتوريد" titleEn="Dashboard & Supply" />
            <NavItem
              tab="DASHBOARD"
              icon={LayoutDashboard}
              labelAr="لوحة التحكم الرئيسية"
              labelEn="Supplier Dashboard"
              iconColor="text-blue-600"
            />
            <NavItem
              tab="SUPPLIER_PORTAL"
              icon={Building2}
              labelAr="لوحة المورد وأوامر التوريد"
              labelEn="Supplier Dashboard & POs"
              iconColor="text-indigo-500"
            />
            <NavItem
              tab="INVENTORY"
              icon={Boxes}
              labelAr="كتالوج الأصناف والمخزون"
              labelEn="Parts Catalog & Stock"
              iconColor="text-amber-500"
            />
          </>
        )}

        {/* ================= CUSTOM ROLE ================= */}
        {currentRole === 'CUSTOM' && (
          <>
            <SectionHeader 
              titleAr={currentUserProfile.customRoleName || "الأقسام المصرح بها"} 
              titleEn={currentUserProfile.customRoleName || "Authorized Sections"} 
            />
            <NavItem
              tab="DASHBOARD"
              icon={LayoutDashboard}
              labelAr="لوحة التحكم الرئيسية"
              labelEn="Dashboard"
              iconColor="text-blue-600"
            />
            <NavItem
              tab="INTERACTIVE_MAP"
              icon={MapPin}
              labelAr="الخريطة التفاعلية وتوزيع الفنيين"
              labelEn="Interactive Map & Techs"
              iconColor="text-rose-500"
            />
            <NavItem
              tab="CUSTOMERS"
              icon={Users}
              labelAr="دليل العملاء"
              labelEn="Customers Directory"
              iconColor="text-emerald-500"
              badge={customersCount}
              badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
            />
            <NavItem
              tab="SALES_QUOTATIONS"
              icon={Briefcase}
              labelAr="عروض بيع المصاعد"
              labelEn="Elevator Sales Quotations"
              iconColor="text-blue-500"
            />
            <NavItem
              tab="SALES_CONTRACTS"
              icon={Building2}
              labelAr="عقود ومشاريع المصاعد"
              labelEn="Elevator Projects"
              iconColor="text-indigo-500"
            />
            <NavItem
              tab="DRAWINGS"
              icon={Layers}
              labelAr="المخططات الهندسية CAD"
              labelEn="Engineering CAD Drawings"
              iconColor="text-amber-500"
            />
            <NavItem
              tab="MAINTENANCE_CONTRACTS"
              icon={ShieldCheck}
              labelAr="عقود الصيانة الدورية"
              labelEn="Maintenance Contracts"
              iconColor="text-emerald-600"
              badge={expiringContractsCount > 0 ? `${expiringContractsCount}` : null}
              badgeColor="bg-amber-50 text-amber-700 border-amber-200"
            />
            <NavItem
              tab="MAINTENANCE_SCHEDULES"
              icon={Calendar}
              labelAr="إدارة زيارات الصيانة"
              labelEn="Maintenance Visits"
              iconColor="text-purple-500"
            />
            <NavItem
              tab="MAINTENANCE_BREAKDOWNS"
              icon={AlertTriangle}
              labelAr="إدارة بلاغات الأعطال"
              labelEn="Breakdowns Management"
              iconColor="text-rose-500"
            />
            <NavItem
              tab="FINANCE_INVOICES"
              icon={Receipt}
              labelAr="الفوترة وسندات القبض (ZATCA)"
              labelEn="Invoices & Receipts (ZATCA)"
              iconColor="text-emerald-600"
            />
            <NavItem
              tab="SAFETY_CERTIFICATES"
              icon={ShieldAlert}
              labelAr="شهادات السلامة والدفاع المدني"
              labelEn="Safety & Civil Defense"
              iconColor="text-rose-600"
            />
            <NavItem
              tab="INVENTORY"
              icon={Boxes}
              labelAr="المستودع والمخزون وقطع الغيار"
              labelEn="Warehouse & Inventory"
              iconColor="text-amber-500"
              badge={inventoryCount}
              badgeColor="bg-blue-50 text-blue-700 border-blue-200"
            />
            <NavItem
              tab="EMPLOYEES"
              icon={Users}
              labelAr="الموظفون والصلاحيات"
              labelEn="Staff & Permissions"
              iconColor="text-purple-600"
              badge={employeesCount}
              badgeColor="bg-purple-50 text-purple-700 border-purple-200"
            />
          </>
        )}
      </div>

      {/* 3. Footer Section (Language, Google Sheets & System Info) - Compact Single-Row */}
      <div className="px-2.5 py-1.5 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2 py-0.75 rounded-md text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title={isAr ? 'Switch to English' : 'التحويل للغة العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSheetsModal}
            className="p-1 rounded-md text-emerald-600 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title={isAr ? 'مزامنة مع Google Sheets' : 'Sync with Google Sheets'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
          <span className="text-slate-500 font-semibold">{isAr ? 'توينز ERP' : 'Twins'}</span>
          <span className="font-mono">v3.5</span>
        </div>
      </div>
    </aside>
  );
};
