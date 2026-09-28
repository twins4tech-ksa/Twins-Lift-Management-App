import React from 'react';
import { AppLanguage } from '../utils/translations';
import { CompanySettings } from '../types/settings';
import { 
  Building2, 
  Package, 
  FileText, 
  Truck, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Inbox,
  DollarSign,
  Layers,
  Settings,
  ShieldCheck,
  Wrench,
  Send
} from 'lucide-react';

interface SupplierPortalViewProps {
  language: AppLanguage;
  companySettings?: CompanySettings;
  onGoHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({
  language,
  companySettings,
  onGoHome,
  onNavigateTab,
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner Notice: Under Design / Upcoming Feature */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-indigo-500/15 border-2 border-dashed border-amber-400/60 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {isAr ? 'بوابة المورد المعتمد' : 'Authorized Supplier Portal'}
                </h1>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500 text-white shadow-xs">
                  {isAr ? 'مخصصة للتصميم في المرحلة القادمة' : 'Scheduled for upcoming design'}
                </span>
              </div>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                {isAr
                  ? 'هذه البوابة مخصصة للموردين المعتمدين لقطع ومحركات وأنظمة المصاعد. جاري إعداد التصميم والواجهات التفاعلية والربط مع نظام إدارة المخزون وقوائم التسعير.'
                  : 'This portal is dedicated to authorized suppliers of elevator parts, traction motors, and control systems. Interactive UI and ERP inventory integration are scheduled for the next design iteration.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onNavigateTab && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateTab('CUSTOMER_PORTAL')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'بوابة العميل' : 'Customer Portal'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('TECHNICIAN_PORTAL')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'بوابة الفني' : 'Technician Portal'}</span>
                </button>
              </>
            )}
            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? 'العودة للرئيسية' : 'Back to Home'}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wireframe & Upcoming Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Quotations & RFQ */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-400/80 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black text-slate-900">
              {isAr ? 'طلبات عروض الأسعار (RFQ)' : 'RFQs & Component Pricing'}
            </h3>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {isAr ? 'مخطط 1' : 'Plan 1'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isAr 
              ? 'استلام طلبات توريد قطع المصاعد (محركات، لوحات تحكم، أبواب، كبائن) وتقديم عروض أسعار مباشرة.' 
              : 'Direct reception of elevator component purchase requests and live pricing submissions.'}
          </p>
        </div>

        {/* Module 2: Catalog & Stock Management */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400/80 transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black text-slate-900">
              {isAr ? 'كتالوج المنتجات والمخزون' : 'Catalog & Stock Sync'}
            </h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {isAr ? 'مخطط 2' : 'Plan 2'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isAr 
              ? 'إدارة المنتجات المتاحة من المورد ومواصفاتها الفنية (محركات إيطالية، كروت تحكم، أنظمة أمان) والكميات المتوفرة.' 
              : 'Managing available supplier products, technical datasheets, Italian/Turkish motors, and stock levels.'}
          </p>
        </div>

        {/* Module 3: Purchase Orders & Delivery */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-400/80 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black text-slate-900">
              {isAr ? 'أوامر التوريد والشحن' : 'Purchase Orders & Logistics'}
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {isAr ? 'مخطط 3' : 'Plan 3'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isAr 
              ? 'تأكيد أوامر الشراء الصادرة من شركة توينز وتحديد مواعيد التسليم الميداني لمواقع المشاريع.' 
              : 'PO confirmations, delivery schedules, and on-site receipt tracking for projects.'}
          </p>
        </div>

        {/* Module 4: Invoicing & Payments */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-400/80 transition-all">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black text-slate-900">
              {isAr ? 'الفواتير والمطابقات المالية' : 'Invoices & Payments'}
            </h3>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {isAr ? 'مخطط 4' : 'Plan 4'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isAr 
              ? 'إصدار الفواتير الضريبية المعتمدة ومتابعة الدفعات النقدية ومطابقة كشوف الحساب السنوية.' 
              : 'Issuing electronic VAT invoices, tracking payment disbursements, and supplier statements.'}
          </p>
        </div>
      </div>

      {/* Feature Request & Collaboration Box */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-start">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-800">
              {isAr ? 'هل أنت مورد مصاعد وترغب في الانضمام لشبكة موردي توينز؟' : 'Interested in joining Twins Certified Supplier Network?'}
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            {isAr 
              ? 'يمكنك التواصل معنا عبر البريد المعتمد لتسجيل اعتماد منشأتك وربط نظام التوريد والتسعير الخاص بك.' 
              : 'Contact our procurement department at info@twins4tech.com to register your supplier profile.'}
          </p>
        </div>

        <a
          href="mailto:info@twins4tech.com?subject=طلب اعتماد مورد - شركة توينز للمصاعد"
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Send className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAr ? 'مراسلة إدارة المشتريات والتوريد' : 'Contact Procurement Team'}</span>
        </a>
      </div>
    </div>
  );
};
