import React, { useState, useMemo } from 'react';
import { 
  ElevatorSpecification, 
  ElevatorType, 
  BuildingType, 
  DoorType, 
  WallFinish, 
  CeilingStyle, 
  FloorFinish, 
  HandrailType, 
  CopDisplayType, 
  CounterweightPosition,
  ProjectStatus,
  Customer
} from '../types/elevator';
import { 
  calculateElevatorEngineering, 
  STANDARD_LOAD_LOOKUP 
} from '../utils/elevatorCalculations';
import { generateElevatorNumber } from '../utils/elevatorCode';
import { 
  generateComponentList, 
  calculateQuotationFinancials 
} from '../utils/pricingEngine';
import { 
  Wand2, 
  Building2, 
  Gauge, 
  Ruler, 
  Sparkles, 
  Shield, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  ArrowRight,
  Layers,
  Printer,
  FileSpreadsheet,
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Users,
  Check,
  X,
  ChevronDown,
  Clock,
  ShieldCheck,
  Send,
  XCircle,
  FileText,
  BadgeCheck,
  Building,
  Award,
  UserCheck,
  Save,
  Package
} from 'lucide-react';
import { Employee } from '../types/employee';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';
import { AppLanguage, TRANSLATIONS } from '../utils/translations';
import { ProjectTimeline } from './ProjectTimeline';
import { ProjectTimelineProgressBar } from './ProjectTimelineProgressBar';
import { ProjectTimelineLaborView } from './ProjectTimelineLaborView';
import { ProjectTimesheetTab } from './ProjectTimesheetTab';
import { ArchitecturalImageCard } from './ArchitecturalImageCard';
import { SearchableSelect } from './SearchableSelect';

interface Props {
  spec: ElevatorSpecification;
  customers?: Customer[];
  employees?: Employee[];
  language?: AppLanguage;
  onUpdateSpec: (updated: Partial<ElevatorSpecification>) => void;
  onNavigateToDrawings: () => void;
  onNavigateToBOM: () => void;
  onNavigateToPrint: () => void;
  onSaveToHistorical: () => void;
  onSyncToGoogleSheet?: () => void;
  isSheetsConnected?: boolean;
  onAddCustomer?: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Customer | void;
}

type WizardTab = 'PROJECT' | 'TECHNICAL' | 'SHAFT_CABIN' | 'FINISHES' | 'OPTIONS' | 'COMMERCIAL' | 'TIMELINE' | 'TIMESHEET';

export const QuotationWizard: React.FC<Props> = ({
  spec,
  customers = [],
  employees = [],
  language = 'ar',
  onUpdateSpec,
  onNavigateToDrawings,
  onNavigateToBOM,
  onNavigateToPrint,
  onSaveToHistorical,
  onSyncToGoogleSheet,
  isSheetsConnected,
  onAddCustomer,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.ar;
  const isAr = language === 'ar';
  
  const [activeTab, setActiveTab] = useState<WizardTab>('PROJECT');

  // Customer search & quick add states
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    location: '',
    notes: '',
  });
  const [quickAddSuccess, setQuickAddSuccess] = useState<string | null>(null);

  // Status Metadata & Visual Configurations
  const STATUS_META: Record<ProjectStatus, { labelAr: string; labelEn: string; bg: string; text: string; border: string; descAr: string; descEn: string }> = {
    Draft: {
      labelAr: 'مسودة عرض',
      labelEn: 'Draft Proposal',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      descAr: 'قيد الإعداد والمراجعة الفنية',
      descEn: 'Under technical preparation',
    },
    Sent: {
      labelAr: 'تم الإرسال للعميل',
      labelEn: 'Sent to Client',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-300',
      descAr: 'تم إرسال العرض للعميل وبانتظار الرد',
      descEn: 'Offer sent, awaiting client feedback',
    },
    Approved: {
      labelAr: 'معتمد ومقبول',
      labelEn: 'Approved by Client',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300',
      descAr: 'تمت الموافقة المبدئية على المواصفات والأسعار',
      descEn: 'Approved by consultant / client',
    },
    Won: {
      labelAr: 'عقد موقّع / فوز بالمشروع',
      labelEn: 'Won / Contract Signed',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      descAr: 'تم توقيع العقد الرسمي والتعميد بالتنفيذ',
      descEn: 'Contract officially signed & awarded',
    },
    Installed: {
      labelAr: 'تم التوريد والتركيب',
      labelEn: 'Installed & Commissioned',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-300',
      descAr: 'تم توريد المصعد وتركيبه وتسليمه بنجاح',
      descEn: 'Handover & commissioning completed',
    },
    Lost: {
      labelAr: 'ملغى / لم يتم التعاقد',
      labelEn: 'Lost / Cancelled',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-300',
      descAr: 'تم إلغاء العرض أو التعاقد مع جهة أخرى',
      descEn: 'Tender lost or project cancelled',
    },
  };

  const currentStatusCfg = STATUS_META[spec.status] || STATUS_META.Draft;

  // Filtered registered customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Selected customer resolution
  const selectedCustomer = useMemo(() => {
    if (spec.customerId) {
      return customers.find((c) => c.id === spec.customerId) || null;
    }
    if (spec.clientName) {
      return customers.find((c) => c.name.toLowerCase() === spec.clientName.toLowerCase()) || null;
    }
    return null;
  }, [customers, spec.customerId, spec.clientName]);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddData.name.trim()) return;

    let createdCustomer: Customer | undefined;
    if (onAddCustomer) {
      const res = onAddCustomer({
        name: quickAddData.name.trim(),
        company: quickAddData.company.trim(),
        phone: quickAddData.phone.trim(),
        email: quickAddData.email.trim(),
        location: quickAddData.location.trim(),
        notes: quickAddData.notes.trim(),
      });
      if (res && res.id) {
        createdCustomer = res;
      }
    }

    // Auto-link to current spec
    onUpdateSpec({
      customerId: createdCustomer?.id || `cust-${Date.now()}`,
      clientName: quickAddData.name.trim(),
      clientPhone: quickAddData.phone.trim() || spec.clientPhone,
      clientEmail: quickAddData.email.trim() || spec.clientEmail,
      siteLocation: quickAddData.location.trim() || spec.siteLocation,
    });

    setQuickAddSuccess(
      isAr
        ? `تمت إضافة العميل "${quickAddData.name}" وربطه بعرض السعر بنجاح!`
        : `Customer "${quickAddData.name}" added and linked to quote!`
    );
    setTimeout(() => setQuickAddSuccess(null), 4000);

    setQuickAddData({ name: '', company: '', phone: '', email: '', location: '', notes: '' });
    setIsQuickAddModalOpen(false);
    setIsCustomerSearchOpen(false);
    setCustomerSearch('');
  };

  // Engineering calculations
  const calc = useMemo(() => calculateElevatorEngineering(spec), [spec]);
  
  // Real-time pricing calculations
  const components = useMemo(() => generateComponentList(spec), [spec]);
  const financials = useMemo(() => calculateQuotationFinancials(spec, components), [spec, components]);

  // Keep subtotal and price synchronized in spec
  React.useEffect(() => {
    if (
      spec.subtotalCost !== financials.subtotalCost ||
      spec.totalQuotationPrice !== financials.totalQuotationPrice ||
      spec.grossMarginPercent !== financials.grossMarginPercent
    ) {
      onUpdateSpec({
        subtotalCost: financials.subtotalCost,
        totalQuotationPrice: financials.totalQuotationPrice,
        grossProfit: financials.grossProfit,
        grossMarginPercent: financials.grossMarginPercent,
      });
    }
  }, [financials, onUpdateSpec, spec.subtotalCost, spec.totalQuotationPrice, spec.grossMarginPercent]);

  // Auto-Dimension standard lookup based on current capacity
  const handleApplyStandardDimensions = () => {
    const lookup = STANDARD_LOAD_LOOKUP[spec.capacityKg] || STANDARD_LOAD_LOOKUP[1000];
    const isRear = spec.counterweightPosition === 'REAR';
    const recSW = isRear ? lookup.minShaftWidthRearCwt : lookup.minShaftWidthSideCwt;
    const recSD = isRear ? lookup.minShaftDepthRearCwt : lookup.minShaftDepthSideCwt;
    
    // Calculate recommended Overhead and Pit based on speed
    const recOH = spec.ratedSpeed <= 1.0 ? 3600 : spec.ratedSpeed <= 1.6 ? 3850 : spec.ratedSpeed <= 2.0 ? 4200 : 4600;
    const recPD = spec.ratedSpeed <= 1.0 ? 1200 : spec.ratedSpeed <= 1.6 ? 1450 : spec.ratedSpeed <= 2.0 ? 1650 : 2000;

    onUpdateSpec({
      cabinWidthMm: lookup.carWidthMm,
      cabinDepthMm: lookup.carDepthMm,
      cabinHeightMm: lookup.carHeightMm,
      doorWidthMm: lookup.doorWidthMm,
      doorHeightMm: lookup.doorHeightMm,
      shaftWidthMm: recSW,
      shaftDepthMm: recSD,
      overheadHeightMm: recOH,
      pitDepthMm: recPD,
      personsCount: lookup.persons,
    });
  };

  const handleCapacityPreset = (kg: number) => {
    const lookup = STANDARD_LOAD_LOOKUP[kg];
    if (lookup) {
      const isRear = spec.counterweightPosition === 'REAR';
      onUpdateSpec({
        capacityKg: kg,
        personsCount: lookup.persons,
        cabinWidthMm: lookup.carWidthMm,
        cabinDepthMm: lookup.carDepthMm,
        doorWidthMm: lookup.doorWidthMm,
        shaftWidthMm: isRear ? lookup.minShaftWidthRearCwt : lookup.minShaftWidthSideCwt,
        shaftDepthMm: isRear ? lookup.minShaftDepthRearCwt : lookup.minShaftDepthSideCwt,
      });
    } else {
      onUpdateSpec({ capacityKg: kg, personsCount: Math.round(kg / 75) });
    }
  };

  return (
    <div id="quotation-wizard-container" className="space-y-6">
      {/* ========================================================================= */}
      {/* PERSISTENT CONTRACT & QUOTATION STATUS CONTROL BAR                       */}
      {/* Always visible across all wizard steps to keep contract status top-of-mind*/}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${currentStatusCfg.bg} ${currentStatusCfg.border}`}>
            {spec.status === 'Won' ? (
              <BadgeCheck className="w-5 h-5 text-emerald-600" />
            ) : spec.status === 'Installed' ? (
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
            ) : spec.status === 'Sent' ? (
              <Send className="w-5 h-5 text-indigo-600" />
            ) : spec.status === 'Approved' ? (
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            ) : spec.status === 'Lost' ? (
              <XCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {spec.quoteRef}
              </span>
              {spec.elevatorNumber && (
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded" title={isAr ? 'رقم كود المصعد' : 'Elevator Unit Code'}>
                  {spec.elevatorNumber}
                </span>
              )}
              <span className="text-sm font-bold text-slate-900">
                {spec.projectName || (isAr ? 'مشروع مصعد جديد' : 'New Elevator Project')}
              </span>
              {selectedCustomer && (
                <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-500" />
                  {selectedCustomer.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                {spec.capacityKg} kg &bull; {spec.ratedSpeed} m/s &bull; {spec.stops} {isAr ? 'وقفات' : 'Stops'}
              </span>
              <span className="text-slate-300">|</span>
              <span>{isAr ? 'حالة التعاقد الحالية:' : 'Current Contract Stage:'}</span>
              <span className={`font-semibold ${currentStatusCfg.text}`}>
                {isAr ? currentStatusCfg.labelAr : currentStatusCfg.labelEn}
              </span>
              <span className="text-slate-400 text-[11px]">
                • {isAr ? currentStatusCfg.descAr : currentStatusCfg.descEn}
              </span>
            </p>
          </div>
        </div>

        {/* Status Switcher Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-3 sm:mt-0">
          <label className="text-xs font-bold text-slate-700">
            {isAr ? 'تغيير حالة العقد:' : 'Change Contract Status:'}
          </label>
          <div className="relative w-full sm:w-auto min-w-[200px]">
            <SearchableSelect
              id="sticky-select-contract-status"
              value={spec.status}
              onChange={(e) => onUpdateSpec({ status: e.target.value as any })}
              className={`w-full text-xs font-bold px-3 py-1.5 rounded-lg border shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none truncate ${currentStatusCfg.bg} ${currentStatusCfg.text} ${currentStatusCfg.border}`}
            >
              <option value="Draft">📝 {isAr ? 'مسودة قيد الإعداد (Draft)' : 'Draft Proposal'}</option>
              <option value="Sent">📤 {isAr ? 'تم الإرسال للعميل (Sent)' : 'Sent to Client'}</option>
              <option value="Approved">👍 {isAr ? 'معتمد ومقبول (Approved)' : 'Approved by Client'}</option>
              <option value="Won">📜 {isAr ? 'عقد موقع / فوز بالمشروع (Won)' : 'Won / Contract Signed'}</option>
              <option value="Installed">⚙️ {isAr ? 'تم التوريد والتركيب (Installed)' : 'Installed & Commissioned'}</option>
              <option value="Lost">❌ {isAr ? 'ملغى / لم يتم التعاقد (Lost)' : 'Lost / Cancelled'}</option>
            </SearchableSelect>
          </div>
          {(spec.status === 'Won' || spec.status === 'Installed') && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in self-start sm:self-auto">
              <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
              {isAr ? 'عقد موقّع ومعتمد' : 'Contract Awarded'}
            </span>
          )}
        </div>
      </div>

      {/* Top Wizard Steps Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full max-w-full pb-1 text-xs">
          <button
            id="tab-step-project"
            type="button"
            onClick={() => setActiveTab('PROJECT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'PROJECT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {isAr ? '1. بيانات المشروع والعميل' : '1. Project & Client'}
          </button>

          <button
            id="tab-step-technical"
            type="button"
            onClick={() => setActiveTab('TECHNICAL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'TECHNICAL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Gauge className="w-4 h-4" />
            {isAr ? '2. المواصفات الأساسية' : '2. Core Specifications'}
          </button>

          <button
            id="tab-step-shaft-cabin"
            type="button"
            onClick={() => setActiveTab('SHAFT_CABIN')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'SHAFT_CABIN'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Ruler className="w-4 h-4" />
            {isAr ? '3. أبعاد البئر والكابينة' : '3. Shaft & Cabin Sizing'}
          </button>

          <button
            id="tab-step-finishes"
            type="button"
            onClick={() => setActiveTab('FINISHES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'FINISHES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {isAr ? '4. التشطيبات الداخلية' : '4. Interior Finishes'}
          </button>

          <button
            id="tab-step-options"
            type="button"
            onClick={() => setActiveTab('OPTIONS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'OPTIONS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            {isAr ? '5. الأمان والإضافات' : '5. Safety & Extras'}
          </button>

          <button
            id="tab-step-commercial"
            type="button"
            onClick={() => setActiveTab('COMMERCIAL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'COMMERCIAL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <SaudiRiyalSymbol className="w-4 h-4 shrink-0" />
            {isAr ? '6. التسعير والشروط' : '6. Pricing & Terms'}
          </button>

          <button
            id="tab-step-timeline"
            type="button"
            onClick={() => setActiveTab('TIMELINE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'TIMELINE'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            {isAr ? '7. المسار الزمني وتكلفة العمالة' : '7. Timeline & Labor Cost'}
            {spec.laborLogs && spec.laborLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-white">
                {spec.laborLogs.length}
              </span>
            )}
          </button>

          <button
            id="tab-step-timesheet"
            type="button"
            onClick={() => setActiveTab('TIMESHEET')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'TIMESHEET'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-300" />
            {isAr ? '8. سجلات دوام وتكاليف العمالة' : '8. Project Timesheet Logs'}
            {spec.laborLogs && spec.laborLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-white">
                {spec.laborLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left 8 cols) + Sticky Engineering & Financial Summary (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Area */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          {/* ============================================================ */}
          {/* TAB 1: PROJECT & CLIENT DETAILS                             */}
          {/* ============================================================ */}
          {activeTab === 'PROJECT' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Project Identification &amp; Client Data
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter project metadata, tender reference number, and client contact details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label htmlFor="input-project-name" className="block font-semibold text-slate-800 mb-1.5">
                    {t.projectName || (isAr ? 'اسم المشروع' : 'Project Name')}
                  </label>
                  <input
                    id="input-project-name"
                    type="text"
                    value={spec.projectName}
                    onChange={(e) => onUpdateSpec({ projectName: e.target.value })}
                    placeholder="e.g. Al-Noor Executive Tower"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="input-quote-ref" className="block font-semibold text-slate-800 mb-1.5">
                    {t.quoteRef || (isAr ? 'رقم المرجع لعرض السعر' : 'Quotation Reference No.')}
                  </label>
                  <input
                    id="input-quote-ref"
                    type="text"
                    value={spec.quoteRef}
                    onChange={(e) => onUpdateSpec({ quoteRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-elevator-number" className="block font-semibold text-slate-800">
                      {isAr ? 'رقم كود المصعد (تركيب)' : 'Elevator Unit Code (Installation)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newCode = generateElevatorNumber('INSTALLATION', spec.date || new Date());
                        onUpdateSpec({ elevatorNumber: newCode });
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      title={isAr ? 'توليد كود تلقائي بناءً على سنة وشهر الإصدار' : 'Auto-generate based on Year & Month'}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isAr ? 'توليد تلقائي' : 'Auto Generate'}</span>
                    </button>
                  </div>
                  <input
                    id="input-elevator-number"
                    type="text"
                    value={spec.elevatorNumber || ''}
                    onChange={(e) => onUpdateSpec({ elevatorNumber: e.target.value })}
                    placeholder={isAr ? "مثال: INS-202609-001" : "e.g. INS-202609-001"}
                    className="w-full px-3 py-2 border border-blue-200 bg-blue-50/20 rounded-lg font-mono text-blue-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isAr 
                      ? 'ترميز خاص بالتركيب بنمط INS-السنةوالشهر-التسلسل (يعتمد على شهر وسنة الإصدار)' 
                      : 'Installation elevator pattern: INS-YYYYMM-XXX based on issuance month and year.'}
                  </p>
                </div>

                {/* Searchable Customer Combobox & Quick Add */}
                <div className="sm:col-span-2 bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label htmlFor="input-search-customers-wizard" className="font-bold text-slate-800 text-xs flex items-center gap-1.5 cursor-pointer">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>{isAr ? 'ربط العرض بعميل مسجل أو إضافة عميل سريعاً' : 'Link Customer or Quick Add'}</span>
                    </label>
                    <button
                      id="btn-quick-add-customer-wizard"
                      type="button"
                      onClick={() => setIsQuickAddModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isAr ? '+ إضافة عميل جديد سريعاً' : '+ Quick Add Customer'}</span>
                    </button>
                  </div>

                  {quickAddSuccess && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{quickAddSuccess}</span>
                    </div>
                  )}

                  {/* If a customer is already linked */}
                  {selectedCustomer ? (
                    <div className="p-3 bg-white border border-blue-200 rounded-lg shadow-xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {selectedCustomer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">{selectedCustomer.name}</span>
                            {selectedCustomer.company && (
                              <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                                {selectedCustomer.company}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            {selectedCustomer.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span dir="ltr">{selectedCustomer.phone}</span>
                              </span>
                            )}
                            {selectedCustomer.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{selectedCustomer.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ms-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomerSearchOpen(true);
                            setCustomerSearch('');
                          }}
                          className="px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded border border-blue-200 font-semibold transition-colors"
                        >
                          {isAr ? 'تغيير العميل' : 'Change'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSpec({ customerId: undefined });
                          }}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 font-medium transition-colors"
                        >
                          {isAr ? 'إلغاء الربط' : 'Unlink'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Search customer input & dropdown */
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
                        <input
                          id="input-search-customers-wizard"
                          type="text"
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setIsCustomerSearchOpen(true);
                          }}
                          onFocus={() => setIsCustomerSearchOpen(true)}
                          placeholder={
                            isAr
                              ? 'ابحث في العملاء بالاسم، الشركة، الهاتف أو المدينة...'
                              : 'Search customers by name, company, phone or city...'
                          }
                          className="w-full ps-9 pe-8 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        {customerSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerSearch('');
                              setIsCustomerSearchOpen(false);
                            }}
                            className="absolute end-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown list */}
                      {isCustomerSearchOpen && (
                        <div className="absolute z-20 start-0 end-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((cust) => (
                              <button
                                key={cust.id}
                                type="button"
                                onClick={() => {
                                  onUpdateSpec({
                                    customerId: cust.id,
                                    clientName: cust.name,
                                    clientEmail: cust.email || spec.clientEmail,
                                    clientPhone: cust.phone || spec.clientPhone,
                                    siteLocation: cust.location || spec.siteLocation,
                                  });
                                  setIsCustomerSearchOpen(false);
                                  setCustomerSearch('');
                                }}
                                className="w-full text-start p-2.5 hover:bg-blue-50 flex items-center justify-between gap-3 transition-colors"
                              >
                                <div>
                                  <div className="font-bold text-xs text-slate-900">{cust.name}</div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    {cust.company && <span>{cust.company}</span>}
                                    {cust.phone && <span dir="ltr">• {cust.phone}</span>}
                                    {cust.location && <span>• {cust.location}</span>}
                                  </div>
                                </div>
                                <span className="text-[11px] text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded shrink-0">
                                  {isAr ? 'اختيار' : 'Select'}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-xs text-slate-500">
                              <p>{isAr ? 'لم يتم العثور على عميل مطابق.' : 'No matching customers found.'}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickAddData((prev) => ({ ...prev, name: customerSearch }));
                                  setIsQuickAddModalOpen(true);
                                  setIsCustomerSearchOpen(false);
                                }}
                                className="mt-2 text-blue-600 font-bold hover:underline"
                              >
                                {isAr ? `+ إضافة "${customerSearch}" كعميل جديد` : `+ Add "${customerSearch}" as new customer`}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="input-client-name" className="block font-semibold text-slate-800 mb-1.5">
                    {t.clientName || (isAr ? 'اسم العميل / المالك' : 'Client / Developer Name')}
                  </label>
                  <input
                    id="input-client-name"
                    type="text"
                    value={spec.clientName}
                    onChange={(e) => onUpdateSpec({ clientName: e.target.value })}
                    placeholder="e.g. Emaar Properties PJSC"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="input-consultant" className="block font-semibold text-slate-800 mb-1.5">
                    {t.consultant || (isAr ? 'الاستشاري الهندسي' : 'Engineering Consultant')}
                  </label>
                  <input
                    id="input-consultant"
                    type="text"
                    value={spec.consultant}
                    onChange={(e) => onUpdateSpec({ consultant: e.target.value })}
                    placeholder="e.g. WSP / Atkins Engineering"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="input-client-email" className="block font-semibold text-slate-800 mb-1.5">
                    {t.clientEmail || (isAr ? 'البريد الإلكتروني للعميل' : 'Client Email Address')}
                  </label>
                  <input
                    id="input-client-email"
                    type="email"
                    value={spec.clientEmail}
                    onChange={(e) => onUpdateSpec({ clientEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="input-client-phone" className="block font-semibold text-slate-800 mb-1.5">
                    {t.clientPhone || (isAr ? 'رقم جوال العميل' : 'Client Phone Number')}
                  </label>
                  <input
                    id="input-client-phone"
                    type="text"
                    value={spec.clientPhone}
                    onChange={(e) => onUpdateSpec({ clientPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="input-site-location" className="block font-semibold text-slate-800 mb-1.5">
                    {t.siteLocation || (isAr ? 'موقع المشروع / العنوان' : 'Site Location / Address')}
                  </label>
                  <input
                    id="input-site-location"
                    type="text"
                    value={spec.siteLocation}
                    onChange={(e) => onUpdateSpec({ siteLocation: e.target.value })}
                    placeholder="e.g. Plot 418, Financial District, Downtown"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-slate-800">
                      {isAr ? 'الإحداثيات الجغرافية للموقع (لإثبات الحضور)' : 'Site GPS Coordinates (For Attendance)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              onUpdateSpec({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                              });
                            },
                            (error) => {
                              alert(isAr ? 'عذراً، لم نتمكن من الوصول للموقع. يرجى تفعيل إذن الوصول للموقع (GPS).' : 'Could not get location. Please enable GPS.');
                            }
                          );
                        } else {
                          alert(isAr ? 'المتصفح لا يدعم تحديد الموقع الجغرافي' : 'Geolocation is not supported by your browser');
                        }
                      }}
                      className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                      {isAr ? 'التقاط الموقع الحالي' : 'Get Current Location'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        step="any"
                        placeholder={isAr ? 'خط العرض (Latitude)' : 'Latitude'}
                        value={spec.latitude || ''}
                        onChange={(e) => onUpdateSpec({ latitude: parseFloat(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="any"
                        placeholder={isAr ? 'خط الطول (Longitude)' : 'Longitude'}
                        value={spec.longitude || ''}
                        onChange={(e) => onUpdateSpec({ longitude: parseFloat(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    {isAr ? 'تُستخدم هذه الإحداثيات للتحقق التلقائي من تواجد فنيي الصيانة ومهندسي التركيبات في الموقع عند تسجيل الحضور.' : 'Used for automatic geofencing to verify engineers site attendance.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="input-quote-date" className="block font-semibold text-slate-800 mb-1.5">
                    {t.quoteDate || (isAr ? 'تاريخ عرض السعر' : 'Quotation Date')}
                  </label>
                  <input
                    id="input-quote-date"
                    type="date"
                    value={spec.date}
                    onChange={(e) => onUpdateSpec({ date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Sales Representative / Delegate Assignment */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold text-xs text-emerald-950">
                          {isAr ? 'مندوب المبيعات المسؤول عن العرض (Sales Representative)' : 'Assigned Sales Representative'}
                        </span>
                      </div>
                      {spec.assignedSalesRepId && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          {isAr ? 'تم ربط المندوب' : 'Rep Assigned'}
                        </span>
                      )}
                    </div>

                    {spec.assignedSalesRepId || spec.assignedSalesRepName ? (
                      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {(spec.assignedSalesRepName || 'REP').slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900">
                                {spec.assignedSalesRepName}
                              </span>
                              {spec.assignedSalesRepCommissionRate !== undefined && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                                  {isAr ? `عمولة ${spec.assignedSalesRepCommissionRate}%` : `${spec.assignedSalesRepCommissionRate}% Comm.`}
                                </span>
                              )}
                            </div>
                            {spec.assignedSalesRepPhone && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-mono">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span dir="ltr">{spec.assignedSalesRepPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ms-auto min-w-[200px]">
                          <SearchableSelect
                            value={spec.assignedSalesRepId || ''}
                            onChange={(e) => {
                              const emp = employees.find((x) => x.id === e.target.value);
                              if (emp) {
                                onUpdateSpec({
                                  assignedSalesRepId: emp.id,
                                  assignedSalesRepName: emp.name,
                                  assignedSalesRepPhone: emp.phone,
                                  assignedSalesRepCommissionRate: emp.commissionRate || 2.5,
                                });
                              }
                            }}
                            className="text-xs px-2 py-1 rounded border border-slate-200 bg-slate-50 font-medium"
                          >
                            <option value="">{isAr ? 'تغيير المندوب...' : 'Change Rep...'}</option>
                            {employees
                              .filter((e) => e.role === 'SALES_REP' || e.role === 'PROJECT_MANAGER')
                              .map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.code}) - {emp.territory || ''}
                                </option>
                              ))}
                          </SearchableSelect>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateSpec({
                                assignedSalesRepId: undefined,
                                assignedSalesRepName: undefined,
                                assignedSalesRepPhone: undefined,
                                assignedSalesRepCommissionRate: undefined,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title={isAr ? 'إلغاء الربط' : 'Unlink'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <SearchableSelect
                          id="select-sales-rep-wizard"
                          value=""
                          onChange={(e) => {
                            const emp = employees.find((x) => x.id === e.target.value);
                            if (emp) {
                              onUpdateSpec({
                                assignedSalesRepId: emp.id,
                                assignedSalesRepName: emp.name,
                                assignedSalesRepPhone: emp.phone,
                                assignedSalesRepCommissionRate: emp.commissionRate || 2.5,
                              });
                            }
                          }}
                          className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="">{isAr ? '-- اختر مندوب المبيعات المسؤول عن هذا العرض --' : '-- Select Sales Representative --'}</option>
                          {employees
                            .filter((e) => e.role === 'SALES_REP' || e.role === 'PROJECT_MANAGER')
                            .map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.code}) - {emp.territory || ''} [عمولة {emp.commissionRate || 2.5}%]
                              </option>
                            ))}
                        </SearchableSelect>
                        <p className="text-[10px] text-emerald-800/80 mt-1">
                          {isAr
                            ? 'اختيار المندوب يتيح طباعة بياناته وتوقيعه على وثيقة العرض واحتساب عمولته وتارقت المبيعات تلقائياً.'
                            : 'Selecting a sales rep displays their contact & signature on printouts and calculates commission automatically.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-800 mb-2 text-xs flex items-center justify-between">
                    <span>{isAr ? 'حالة العرض والتعاقد (Contract & Proposal Status)' : 'Contract & Proposal Status'}</span>
                    <span className="text-slate-400 font-normal text-[11px]">
                      {isAr ? 'حدد المرحلة التعاقدية للمشروع' : 'Select active project stage'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(STATUS_META) as ProjectStatus[]).map((st) => {
                      const meta = STATUS_META[st];
                      const isSelected = spec.status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => onUpdateSpec({ status: st })}
                          className={`p-2.5 rounded-lg border text-start transition-all ${
                            isSelected
                              ? `${meta.bg} ${meta.border} ring-2 ring-blue-500/30`
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold ${meta.text}`}>
                              {isAr ? meta.labelAr : meta.labelEn}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {isAr ? meta.descAr : meta.descEn}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: TECHNICAL SPECIFICATIONS & BUILDING PROFILE          */}
          {/* ============================================================ */}
          {activeTab === 'TECHNICAL' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Elevator Drive &amp; Core Performance Parameters
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure traction drive type, rated capacity, travel height, and electrical supply.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Elevator Type */}
                <div>
                  <label htmlFor="select-elevator-type" className="block font-semibold text-slate-800 mb-1.5">
                    {t.elevatorType || (isAr ? 'نوع المصعد ونظام الجر (Elevator Type)' : 'Elevator Machine & Drive Type')}
                  </label>
                  <SearchableSelect
                    id="select-elevator-type"
                    value={spec.elevatorType}
                    onChange={(e) => onUpdateSpec({ elevatorType: e.target.value as ElevatorType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="MRL_TRACTION">{isAr ? "بدون غرفة ماكينة (MRL) جيرليس" : "Machine Room-Less (MRL) PMSM Gearless"}</option>
                    <option value="GEARED_TRACTION">{isAr ? "غرفة ماكينة علوية (موتور جير)" : "Overhead Machine Room Geared Traction"}</option>
                    <option value="HYDRAULIC">{isAr ? "نظام هيدروليك (مباشر/غير مباشر)" : "Hydraulic Drive (Direct/Indirect)"}</option>
                    <option value="PANORAMIC_GLASS">{isAr ? "مصعد بانوراما زجاجي" : "Architectural Panoramic Glass Elevator"}</option>
                    <option value="FREIGHT_HEAVY">{isAr ? "مصعد بضائع للأحمال الثقيلة" : "Heavy-Duty Industrial Freight Elevator"}</option>
                  </SearchableSelect>
                </div>

                {/* Building Type */}
                <div>
                  <label htmlFor="select-building-type" className="block font-semibold text-slate-800 mb-1.5">
                    {t.buildingApp || (isAr ? 'نوع المبنى (الاستخدام)' : 'Building Application / Usage')}
                  </label>
                  <SearchableSelect
                    id="select-building-type"
                    value={spec.buildingType}
                    onChange={(e) => onUpdateSpec({ buildingType: e.target.value as BuildingType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="Residential">{isAr ? "عمائر سكنية / فلل" : "Residential Apartment Complex"}</option>
                    <option value="Commercial Office">{isAr ? "مبنى تجاري / مكاتب" : "Commercial Office High-Rise"}</option>
                    <option value="Hospital / Healthcare">{isAr ? "مستشفى / رعاية صحية (سرير طبي)" : "Hospital & Healthcare"}</option>
                    <option value="Hotel">{isAr ? "فندق ضيافة فاخر" : "Luxury Hospitality Hotel"}</option>
                    <option value="Industrial">{isAr ? "مستودع صناعي / مصنع" : "Industrial Warehouse / Factory"}</option>
                    <option value="Luxury Villa">{isAr ? "فيلا سكنية خاصة فاخرة" : "Private Luxury Residence / Villa"}</option>
                  </SearchableSelect>
                </div>

                {/* Capacity Quick Presets */}
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-semibold text-slate-800">
                      {isAr ? 'الحمولة المقننة وسعة الركاب (Rated Load Capacity)' : 'Rated Load Capacity (kg / Persons Presets)'}
                    </label>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono">
                      {spec.capacityKg} kg / {spec.personsCount || spec.persons || Math.round(spec.capacityKg / 75)} {isAr ? 'ركاب' : 'persons'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[320, 450, 630, 800, 1000, 1275, 1600, 2000, 2500].map((kg) => (
                      <button
                        key={kg}
                        type="button"
                        onClick={() => handleCapacityPreset(kg)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          spec.capacityKg === kg
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {kg} kg ({STANDARD_LOAD_LOOKUP[kg]?.persons || Math.round(kg / 75)} P)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rated Speed */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="select-rated-speed" className="font-semibold text-slate-800">
                      {t.ratedSpeed || (isAr ? 'السرعة المقننة (م/ث / Rated Speed)' : 'Rated Speed (m/s)')}
                    </label>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono">
                      {spec.ratedSpeed} m/s
                    </span>
                  </div>
                  <SearchableSelect
                    id="select-rated-speed"
                    value={spec.ratedSpeed}
                    onChange={(e) => onUpdateSpec({ ratedSpeed: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value={0.63}>0.63 m/s (Low Rise / Hydraulic / Villa)</option>
                    <option value={1.0}>1.0 m/s (Standard Mid-Rise ≤ 10 Stops)</option>
                    <option value={1.6}>1.6 m/s (Mid-to-High Rise ≤ 20 Stops)</option>
                    <option value={2.0}>2.0 m/s (High-Rise Express ≤ 30 Stops)</option>
                    <option value={2.5}>2.5 m/s (Super High-Rise Commercial)</option>
                    <option value={3.0}>3.0 m/s (High-Speed Tower)</option>
                  </SearchableSelect>
                </div>

                {/* Stops Count */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-stops" className="font-semibold text-slate-800">
                      {t.stopsCount || (isAr ? 'عدد الوقفات / الطوابق (Stops)' : 'Number of Stops / Floors')}
                    </label>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono">
                      {spec.stops} {isAr ? 'وقفات' : 'stops'}
                    </span>
                  </div>
                  <input
                    id="input-stops"
                    type="number"
                    min={2}
                    max={40}
                    value={spec.stops}
                    onChange={(e) => {
                      const st = parseInt(e.target.value) || 2;
                      onUpdateSpec({ 
                        stops: st, 
                        openings: st,
                        travelHeightM: Math.round((st - 1) * (spec.floorToFloorM || 3.2) * 10) / 10 
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Travel Height */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-travel-height" className="font-semibold text-slate-800">
                      {t.travelHeight || (isAr ? 'ارتفاع مشوار الصعود الإجمالي (Travel Height)' : 'Total Travel Height (m)')}
                    </label>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono">
                      {spec.travelHeightM} {isAr ? 'متر' : 'm'}
                    </span>
                  </div>
                  <input
                    id="input-travel-height"
                    type="number"
                    step="0.1"
                    value={spec.travelHeightM}
                    onChange={(e) => onUpdateSpec({ travelHeightM: parseFloat(e.target.value) || 3 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Floor Height */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-floor-height" className="font-semibold text-slate-800">
                      {t.floorHeight || (isAr ? 'متوسط ارتفاع الطابق (Floor-to-Floor Height)' : 'Floor-to-Floor Height (m)')}
                    </label>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono">
                      {spec.floorToFloorM || 3.2} {isAr ? 'متر' : 'm'}
                    </span>
                  </div>
                  <input
                    id="input-floor-height"
                    type="number"
                    step="0.05"
                    value={spec.floorToFloorM}
                    onChange={(e) => onUpdateSpec({ floorToFloorM: parseFloat(e.target.value) || 3 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Roping Ratio */}
                <div>
                  <label htmlFor="select-roping-ratio" className="block font-semibold text-slate-800 mb-1.5">
                    {t.ropingRatio || (isAr ? 'نظام التعليق (Roping Ratio)' : 'Roping Suspension Ratio')}
                  </label>
                  <SearchableSelect
                    id="select-roping-ratio"
                    value={spec.ropingRatio}
                    onChange={(e) => onUpdateSpec({ ropingRatio: e.target.value as '1:1' | '2:1' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="2:1">2:1 Roping (Standard for MRL Gearless)</option>
                    <option value="1:1">1:1 Direct Roping (High-Speed / Geared)</option>
                  </SearchableSelect>
                </div>

                {/* Power Supply */}
                <div>
                  <label htmlFor="select-power-supply" className="block font-semibold text-slate-800 mb-1.5">
                    {t.powerSupply || (isAr ? 'مصدر الطاقة والكهرباء الرئيسي' : 'Mains Power Supply')}
                  </label>
                  <SearchableSelect
                    id="select-power-supply"
                    value={spec.powerSupply}
                    onChange={(e) => onUpdateSpec({ powerSupply: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="400V_3PH_50HZ">400V, 3-Phase, 50 Hz (Standard UK / EU / UAE)</option>
                    <option value="380V_3PH_50HZ">380V, 3-Phase, 50 Hz</option>
                    <option value="415V_3PH_50HZ">415V, 3-Phase, 50 Hz</option>
                    <option value="480V_3PH_60HZ">480V, 3-Phase, 60 Hz (USA / Canada)</option>
                    <option value="220V_3PH_60HZ">220V, 3-Phase, 60 Hz</option>
                  </SearchableSelect>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: SHAFT & CABIN DIMENSIONS                             */}
          {/* ============================================================ */}
          {activeTab === 'SHAFT_CABIN' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Shaft Well &amp; Cabin Engineering Dimensions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ensure hoistway width, depth, headroom, and pit comply with EN 81-20 safety regulations.
                  </p>
                </div>
                <button
                  id="btn-apply-standard-dimensions"
                  type="button"
                  onClick={handleApplyStandardDimensions}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Auto-Calculate EN 81-20 Dimensions
                </button>
              </div>

              {/* 3D Architectural Visualizer Card (Imagen AI) */}
              <ArchitecturalImageCard
                spec={spec}
                onUpdateSpec={onUpdateSpec}
                language={isAr ? 'ar' : 'en'}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Shaft Width */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-shaft-width" className="font-semibold text-slate-800">
                      {t.shaftWidthMm || (isAr ? 'عرض بئر المصعد الصافي (SW مم)' : 'Clear Shaft Width (SW mm)')}
                    </label>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {isAr ? 'الحد الأدنى:' : 'Min req:'} {calc.recommendedShaftWidth} mm
                    </span>
                  </div>
                  <input
                    id="input-shaft-width"
                    type="number"
                    step="50"
                    value={spec.shaftWidthMm}
                    onChange={(e) => onUpdateSpec({ shaftWidthMm: parseInt(e.target.value) || 1500 })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none font-medium ${
                      calc.isShaftWidthCompliant
                        ? 'border-slate-200 focus:ring-blue-500'
                        : 'border-amber-500 bg-amber-50 focus:ring-amber-500'
                    }`}
                  />
                  {!calc.isShaftWidthCompliant && (
                    <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {isAr ? 'عرض البئر أقل من الخلوص الهندسي الموصى به!' : 'Shaft width is less than recommended clearance!'}
                    </p>
                  )}
                </div>

                {/* Shaft Depth */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-shaft-depth" className="font-semibold text-slate-800">
                      {t.shaftDepthMm || (isAr ? 'عمق بئر المصعد الصافي (SD مم)' : 'Clear Shaft Depth (SD mm)')}
                    </label>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {isAr ? 'الحد الأدنى:' : 'Min req:'} {calc.recommendedShaftDepth} mm
                    </span>
                  </div>
                  <input
                    id="input-shaft-depth"
                    type="number"
                    step="50"
                    value={spec.shaftDepthMm}
                    onChange={(e) => onUpdateSpec({ shaftDepthMm: parseInt(e.target.value) || 1500 })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none font-medium ${
                      calc.isShaftDepthCompliant
                        ? 'border-slate-200 focus:ring-blue-500'
                        : 'border-amber-500 bg-amber-50 focus:ring-amber-500'
                    }`}
                  />
                  {!calc.isShaftDepthCompliant && (
                    <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {isAr ? 'عمق البئر قد يضيق خلوص ثقل الموازنة!' : 'Shaft depth may pinch counterweight clearances.'}
                    </p>
                  )}
                </div>

                {/* Pit Depth */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-pit-depth" className="font-semibold text-slate-800">
                      {t.pitDepthMm || (isAr ? 'عمق حفرة البئر (Pit Depth مم)' : 'Shaft Pit Depth (Pit mm)')}
                    </label>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {isAr ? 'الحد الأدنى:' : 'Min req:'} {calc.recommendedPitDepth} mm
                    </span>
                  </div>
                  <input
                    id="input-pit-depth"
                    type="number"
                    step="50"
                    value={spec.pitDepthMm}
                    onChange={(e) => onUpdateSpec({ pitDepthMm: parseInt(e.target.value) || 1200 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Overhead Height */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-overhead-height" className="font-semibold text-slate-800">
                      {t.overheadHeightMm || (isAr ? 'ارتفاع الدور الأخير (Overhead مم)' : 'Top Overhead Height (Overhead mm)')}
                    </label>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {isAr ? 'الحد الأدنى:' : 'Min req:'} {calc.recommendedOverhead} mm
                    </span>
                  </div>
                  <input
                    id="input-overhead-height"
                    type="number"
                    step="50"
                    value={spec.overheadHeightMm}
                    onChange={(e) => onUpdateSpec({ overheadHeightMm: parseInt(e.target.value) || 3600 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Cabin Width & Depth */}
                <div>
                  <label htmlFor="input-cabin-width" className="block font-semibold text-slate-800 mb-1.5">
                    {t.cabinWidthMm || (isAr ? 'عرض الكابينة الداخلي (CW مم)' : 'Cabin Interior Width (CW mm)')}
                  </label>
                  <input
                    id="input-cabin-width"
                    type="number"
                    step="50"
                    value={spec.cabinWidthMm}
                    onChange={(e) => onUpdateSpec({ cabinWidthMm: parseInt(e.target.value) || 1000 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="input-cabin-depth" className="block font-semibold text-slate-800 mb-1.5">
                    {t.cabinDepthMm || (isAr ? 'عمق الكابينة الداخلي (CD مم)' : 'Cabin Interior Depth (CD mm)')}
                  </label>
                  <input
                    id="input-cabin-depth"
                    type="number"
                    step="50"
                    value={spec.cabinDepthMm}
                    onChange={(e) => onUpdateSpec({ cabinDepthMm: parseInt(e.target.value) || 1000 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Door Type & Clear Width */}
                <div>
                  <label htmlFor="select-door-type" className="block font-semibold text-slate-800 mb-1.5">
                    {t.doorConfig || (isAr ? 'طراز وتوزيع فتح الأبواب' : 'Entrance Door Configuration')}
                  </label>
                  <SearchableSelect
                    id="select-door-type"
                    value={spec.doorType}
                    onChange={(e) => onUpdateSpec({ doorType: e.target.value as DoorType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="CENTER_2P">{isAr ? 'سنترال - فتح وسطي ضلفتين (CO 2P)' : 'Center Opening 2-Panel (CO 2P)'}</option>
                    <option value="CENTER_4P">{isAr ? 'سنترال - فتح وسطي 4 ضلف (CO 4P عريض)' : 'Center Opening 4-Panel (CO 4P - Wide/Freight)'}</option>
                    <option value="SIDE_2P">{isAr ? 'تلسكوبي جانبي ضلفتين (2P)' : 'Side Opening Telescopic 2-Panel (2P)'}</option>
                    <option value="SIDE_3P">{isAr ? 'تلسكوبي جانبي 3 ضلف (3P)' : 'Side Opening Telescopic 3-Panel (3P)'}</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label htmlFor="input-door-width" className="block font-semibold text-slate-800 mb-1.5">
                    {t.doorWidthMm || (isAr ? 'عرض فتحة الباب الصافية (DW مم)' : 'Clear Door Opening Width (DW mm)')}
                  </label>
                  <input
                    id="input-door-width"
                    type="number"
                    step="50"
                    value={spec.doorWidthMm}
                    onChange={(e) => onUpdateSpec({ doorWidthMm: parseInt(e.target.value) || 800 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="select-cwt-position" className="block font-semibold text-slate-800 mb-1.5">
                    {t.cwtPlacement || (isAr ? 'موقع ثقل الموازنة (CWT Position)' : 'Counterweight Placement')}
                  </label>
                  <SearchableSelect
                    id="select-cwt-position"
                    value={spec.counterweightPosition || 'REAR'}
                    onChange={(e) => onUpdateSpec({ counterweightPosition: e.target.value as CounterweightPosition })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="REAR">{isAr ? 'في الخلف (Rear Wall - قياسي وموصى به)' : 'Rear Wall (Recommended Standard)'}</option>
                    <option value="SIDE_LEFT">{isAr ? 'على الجدار الجانبي الأيسر - عمودي موازي للعمق (Side Left)' : 'Side Left Wall - Vertical (Parallel to Depth)'}</option>
                    <option value="SIDE_RIGHT">{isAr ? 'على الجدار الجانبي الأيمن - عمودي موازي للعمق (Side Right)' : 'Side Right Wall - Vertical (Parallel to Depth)'}</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label htmlFor="select-wall-structure" className="block font-semibold text-slate-800 mb-1.5">
                    {t.shaftWall || (isAr ? 'نوع بناء وهيكل جدران البئر' : 'Shaft Wall Construction')}
                  </label>
                  <SearchableSelect
                    id="select-wall-structure"
                    value={spec.wallStructure}
                    onChange={(e) => onUpdateSpec({ wallStructure: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="CONCRETE">Reinforced Concrete Walls</option>
                    <option value="STEEL_FRAME_GLASS">Structural Steel Frame with Glass Cladding</option>
                    <option value="BRICK_MASONRY">Brick / Masonry Block Walls</option>
                  </SearchableSelect>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: INTERIOR CABIN FINISHES                              */}
          {/* ============================================================ */}
          {activeTab === 'FINISHES' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Cabin Architectural Styling &amp; Luxury Finishes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select wall cladding, ceiling lighting, flooring materials, and car operating panel (COP) options.
                </p>
              </div>

              {/* 3D Architectural Visualizer Card (Imagen AI) */}
              <ArchitecturalImageCard
                spec={spec}
                onUpdateSpec={onUpdateSpec}
                language={isAr ? 'ar' : 'en'}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label htmlFor="select-wall-finish" className="block font-semibold text-slate-800 mb-1.5">
                    {t.wallFinish || (isAr ? 'تشطيب وتجليد جدران الكابينة' : 'Cabin Wall Cladding & Finish')}
                  </label>
                  <SearchableSelect
                    id="select-wall-finish"
                    value={spec.wallFinish}
                    onChange={(e) => onUpdateSpec({ wallFinish: e.target.value as WallFinish })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="BRUSHED_STEEL_304">{isAr ? 'ستانلس ستيل مشطوب مقاوم للبصمات (AISI 304)' : 'Brushed Stainless Steel (AISI 304)'}</option>
                    <option value="MIRROR_ETCHED_GOLD">{isAr ? 'تيتانيوم ذهبي مرايا منقوش بالليزر' : 'Hairline Titanium Gold & Mirror Etched'}</option>
                    <option value="HAIRLINE_TITANIUM_BLACK">{isAr ? 'تيتانيوم أسود فاخر (Black Stainless Steel)' : 'Hairline Titanium Black Stainless Steel'}</option>
                    <option value="PANORAMIC_GLASS">{isAr ? 'زجاج بانورامي دبل سيكوريت شفاف' : 'Panoramic Laminated Safety Glass Walls'}</option>
                    <option value="WOOD_VENEER_LUXURY">{isAr ? 'قشرة خشب طبيعي فاخر مع إطارات برونزية' : 'Handcrafted Wood Veneer & Bronze Trims'}</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label htmlFor="select-ceiling-style" className="block font-semibold text-slate-800 mb-1.5">
                    {t.ceilingStyle || (isAr ? 'تصميم السقف وإضاءة الكابينة' : 'Ceiling Design & Lighting')}
                  </label>
                  <SearchableSelect
                    id="select-ceiling-style"
                    value={spec.ceilingStyle}
                    onChange={(e) => onUpdateSpec({ ceilingStyle: e.target.value as CeilingStyle })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="LED_DOWNLIGHTS_CUTOUT">{isAr ? 'سبوت لايت LED مدمج مع قص ستانلس ديكوري' : 'Concealed LED Downlights with Stainless Cutout'}</option>
                    <option value="INDIRECT_HALO_ACRYLIC">{isAr ? 'إضاءة مخفية محيطية هالو مع أكريليك مثلج' : 'Indirect Perimeter Halo Glow with Frosted Acrylic'}</option>
                    <option value="STAINLESS_MIRROR_SPOT">{isAr ? 'سقف مرايا عاكس مع مصفوفة سبوتات فاخرة' : 'Mirror Stainless Steel Ceiling with Spotlight Arrays'}</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label htmlFor="select-floor-finish" className="block font-semibold text-slate-800 mb-1.5">
                    {t.floorFinish || (isAr ? 'تشطيب أرضية الكابينة' : 'Cabin Flooring Material')}
                  </label>
                  <SearchableSelect
                    id="select-floor-finish"
                    value={spec.floorFinish}
                    onChange={(e) => onUpdateSpec({ floorFinish: e.target.value as FloorFinish })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="GRANITE_BLACK_GALAXY">{isAr ? 'جرانيت طبيعي فاخر (بلاك جالاكسي)' : 'Granite Stone Tile (Black Galaxy)'}</option>
                    <option value="PVC_MARBLE_EFFECT">{isAr ? 'فينيل PVC تجاري عالي التحمل بمظهر الرخام' : 'Heavy-Duty PVC Commercial Marble Effect'}</option>
                    <option value="CERAMIC_TILES">{isAr ? 'سيراميك بورسلان مانع للانزلاق' : 'Vitrified Anti-Slip Ceramic Stone'}</option>
                    <option value="CHECKERED_STEEL_PLATE">{isAr ? 'صاج ألمنيوم مبزر مانع للانزلاق (للخدمة الشاقة)' : 'Anti-Slip Diamond Checkered Aluminum Plate'}</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label htmlFor="select-handrail-type" className="block font-semibold text-slate-800 mb-1.5">
                    {t.handrail || (isAr ? 'شكل وطراز الدرابزين (Handrail)' : 'Handrail Style & Material')}
                  </label>
                  <SearchableSelect
                    id="select-handrail-type"
                    value={spec.handrailType}
                    onChange={(e) => onUpdateSpec({ handrailType: e.target.value as HandrailType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="ROUND_BRUSHED_STAINLESS">{isAr ? 'دائري قطر 38مم ستانلس ستيل مشطوب' : 'Round Ø38mm Brushed Stainless Steel'}</option>
                    <option value="FLAT_GOLD_TITANIUM">{isAr ? 'مسطح تيتانيوم ذهبي مع حواف ناعمة' : 'Flat Titanium Gold Profile with Soft Edges'}</option>
                    <option value="DUAL_ACCESSIBILITY_ADA">{isAr ? 'درابزين مزدوج لكبار السن وذوي الإعاقة (ADA)' : 'Dual Handrail ADA Compliant (Adult + Child/Wheelchair)'}</option>
                    <option value="WOOD_STAINLESS_COMBO">{isAr ? 'خشب جوز طبيعي مع نهايات ستانلس' : 'Solid Walnut Wood with Stainless End Caps'}</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label htmlFor="select-cop-display" className="block font-semibold text-slate-800 mb-1.5">
                    {t.copDisplayType || (isAr ? 'لوحة التحكم ومبين الأدوار (COP Display)' : 'COP Operating Panel & Display')}
                  </label>
                  <SearchableSelect
                    id="select-cop-display"
                    value={spec.copDisplayType}
                    onChange={(e) => onUpdateSpec({ copDisplayType: e.target.value as CopDisplayType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="TFT_7_INCH_COLOR">{isAr ? 'شاشة TFT ملونة 7 بوصة مع مؤشرات رسومية' : '7-Inch High-Res Color TFT Screen with Graphic Indicators'}</option>
                    <option value="MULTIMEDIA_10_INCH_VIDEO">{isAr ? 'شاشة وسائط متعددة 10.4 بوصة (فيديو وأخبار)' : '10.4-Inch Multimedia Screen (Video & News Feed)'}</option>
                    <option value="DOT_MATRIX_BLUE">{isAr ? 'دوت ماتريكس أزرق فائق الوضوح (LED)' : 'Ultra-Bright Blue LED Dot Matrix'}</option>
                    <option value="SEGMENT_RED">{isAr ? 'سفن سجمنت رقمي أحمر تقليدي' : 'Classic Red 7-Segment Digital Display'}</option>
                  </SearchableSelect>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-cabin-height" className="font-semibold text-slate-800">
                      {t.cabinHeightMm || (isAr ? 'ارتفاع الكابينة الصافي (CH مم)' : 'Cabin Clear Height (CH mm)')}
                    </label>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {spec.cabinHeightMm} mm
                    </span>
                  </div>
                  <input
                    id="input-cabin-height"
                    type="number"
                    step="50"
                    value={spec.cabinHeightMm}
                    onChange={(e) => onUpdateSpec({ cabinHeightMm: parseInt(e.target.value) || 2400 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: SAFETY SYSTEMS & OPTIONAL EXTRAS                     */}
          {/* ============================================================ */}
          {activeTab === 'OPTIONS' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Safety Packages &amp; Advanced Operational Options
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select auxiliary backup, green energy regenerative drives, and accessibility features.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* ARD */}
                <label htmlFor="chk-ard" className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    id="chk-ard"
                    type="checkbox"
                    checked={spec.automaticRescueDeviceARD}
                    onChange={(e) => onUpdateSpec({ automaticRescueDeviceARD: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {isAr ? 'جهاز الإنقاذ التلقائي للطوارئ (ARD)' : 'Automatic Rescue Device (ARD)'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {t.ardDesc || (isAr ? 'يقوم بنقل المصعد لأقرب دور وفتح الأبواب فوراً عند انقطاع التيار الكهربائي' : 'Rescues passengers safely to nearest landing during main power failure.')}
                    </div>
                  </div>
                </label>

                {/* Regenerative Drive */}
                <label htmlFor="chk-regen" className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    id="chk-regen"
                    type="checkbox"
                    checked={spec.regenerativeDriveUnit}
                    onChange={(e) => onUpdateSpec({ regenerativeDriveUnit: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {isAr ? 'وحدة استعادة وتوليد الطاقة المتجددة (Regenerative Drive)' : 'Regenerative Energy Feeder Unit'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {isAr ? 'استعادة الطاقة الكهربائية أثناء النزول بحمولة أو الصعود فارغاً وضخها لشبكة المبنى' : 'Recovers electrical power during descent with heavy load or ascent with light load and returns clean AC to building grid.'}
                    </div>
                  </div>
                </label>

                {/* Fireman Service */}
                <label htmlFor="chk-fireman" className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    id="chk-fireman"
                    type="checkbox"
                    checked={spec.firemanServiceEN8172}
                    onChange={(e) => onUpdateSpec({ firemanServiceEN8172: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {isAr ? 'نظام خدمة الإطفائيين ومكافحة الحريق (EN 81-72)' : 'EN 81-72 Firefighters Priority Control'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {isAr ? 'مفتاح استدعاء رجال الإطفاء والتحكم المباشر في حالات الطوارئ والإخلاء' : 'Includes landing fireman recall key, designated evacuation landing return, and firefighter car operation switch.'}
                    </div>
                  </div>
                </label>

                {/* Seismic Sensor */}
                <label htmlFor="chk-seismic" className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    id="chk-seismic"
                    type="checkbox"
                    checked={spec.seismicSensorEN8177}
                    onChange={(e) => onUpdateSpec({ seismicSensorEN8177: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {isAr ? 'مستشعر رصد الهزات والزلازل (EN 81-77)' : 'EN 81-77 Earthquake Seismic Detection'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {isAr ? 'كاشف اهتزاز موجات P و S يوقف المصعد عند أقرب دور في الاتجاه الآمن' : 'P-wave / S-wave vibration sensor halts elevator at nearest floor in opposite direction of counterweight.'}
                    </div>
                  </div>
                </label>

                {/* Voice Synthesizer */}
                <label htmlFor="chk-voice" className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    id="chk-voice"
                    type="checkbox"
                    checked={spec.voiceSynthesizer}
                    onChange={(e) => onUpdateSpec({ voiceSynthesizer: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {isAr ? 'جهاز المذيع الصوتي ثنائي اللغة (عربي / إنجليزي)' : 'Multi-Lingual Voice Announcer'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {isAr ? 'إعلان رقم الدور والاتجاه وتنبيهات قفل الباب ورسائل الطوارئ' : 'Floor arrival, direction voice prompts, door closing reminders, and emergency broadcast in English & Arabic.'}
                    </div>
                  </div>
                </label>

                {/* Air Purifier */}
                <label htmlFor="chk-purifier" className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    id="chk-purifier"
                    type="checkbox"
                    checked={spec.airPurifierSterilizer}
                    onChange={(e) => onUpdateSpec({ airPurifierSterilizer: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {isAr ? 'منقي ومعقم هواء الكابينة بالأيونات والأشعة UV' : 'Plasma Ionizer & UV Air Sterilizer'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {isAr ? 'تعقيم هواء الكابينة المستمر ضد البكتيريا والفيروسات بصوت هادئ جداً' : 'Continuously sanitizes cabin air against bacteria and viruses, whisper-quiet operation.'}
                    </div>
                  </div>
                </label>

                {/* Access Control */}
                <label htmlFor="chk-access" className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    id="chk-access"
                    type="checkbox"
                    checked={spec.accessControlCardReader}
                    onChange={(e) => onUpdateSpec({ accessControlCardReader: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {isAr ? 'نظام التحكم بالدخول بالبطاقات الذكية (RFID / NFC)' : 'RFID / NFC Card Reader Integration'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {isAr ? 'تقييد الوصول لأدوار محددة للنزلاء وملاك شقق البنتهاوس' : 'Restricts access to specific floors for tenants and penthouse suites.'}
                    </div>
                  </div>
                </label>

                {/* CCTV Cable */}
                <label htmlFor="chk-cctv" className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    id="chk-cctv"
                    type="checkbox"
                    checked={spec.cctvShaftCabling}
                    onChange={(e) => onUpdateSpec({ cctvShaftCabling: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {isAr ? 'كابل شيلد مخصص لكاميرات المراقبة في البئر (CCTV Cable)' : 'Shaft CCTV Shielded Video Cabling'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {isAr ? 'موصلات شيلد محورية وطاقة ضمن كابل المرن المتنقل لربط الكاميرات بدون تشويش' : 'Coaxial + power shielded conductors in traveling cable for security camera integration.'}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: COMMERCIAL TERMS, MARKUPS & FINANCES                 */}
          {/* ============================================================ */}
          {activeTab === 'COMMERCIAL' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Commercial Conditions, Margins &amp; Contract Terms
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set target profit margins, client discounts, tax rates, warranty periods, and payment schedule.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-markup" className="font-semibold text-slate-800">
                      {t.targetMarkup || (isAr ? 'هامش الربح المستهدف (%)' : 'Target Profit Markup (%)')}
                    </label>
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {spec.markupPercentage}%
                    </span>
                  </div>
                  <input
                    id="input-markup"
                    type="number"
                    min={0}
                    max={100}
                    value={spec.markupPercentage}
                    onChange={(e) => onUpdateSpec({ markupPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-discount" className="font-semibold text-slate-800">
                      {t.clientDiscount || (isAr ? 'خصم العميل الخاص (%)' : 'Client Discount (%)')}
                    </label>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {spec.discountPercentage}%
                    </span>
                  </div>
                  <input
                    id="input-discount"
                    type="number"
                    min={0}
                    max={50}
                    value={spec.discountPercentage}
                    onChange={(e) => onUpdateSpec({ discountPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-tax" className="font-semibold text-slate-800">
                      {t.vatTax || (isAr ? 'ضريبة القيمة المضافة VAT (%)' : 'VAT / Sales Tax (%)')}
                    </label>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {spec.taxPercentage}%
                    </span>
                  </div>
                  <input
                    id="input-tax"
                    type="number"
                    min={0}
                    max={30}
                    value={spec.taxPercentage}
                    onChange={(e) => onUpdateSpec({ taxPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-warranty" className="font-semibold text-slate-800">
                      {t.warrantyPeriod || (isAr ? 'فترة الضمان الشامل (شهور)' : 'Comprehensive Warranty (Months)')}
                    </label>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {spec.warrantyMonths} {isAr ? 'شهر' : 'mo'}
                    </span>
                  </div>
                  <input
                    id="input-warranty"
                    type="number"
                    value={spec.warrantyMonths}
                    onChange={(e) => onUpdateSpec({ warrantyMonths: parseInt(e.target.value) || 12 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-delivery-weeks" className="font-semibold text-slate-800">
                      {t.deliveryLeadTime || (isAr ? 'مدة التوريد والتسليم (أسابيع)' : 'Manufacturing & Delivery (Weeks)')}
                    </label>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {spec.deliveryWeeks} {isAr ? 'أسبوع' : 'wks'}
                    </span>
                  </div>
                  <input
                    id="input-delivery-weeks"
                    type="number"
                    value={spec.deliveryWeeks}
                    onChange={(e) => onUpdateSpec({ deliveryWeeks: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="input-validity-days" className="font-semibold text-slate-800">
                      {t.quoteValidity || (isAr ? 'صلاحية عرض السعر (أيام)' : 'Price Validity Duration (Days)')}
                    </label>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {spec.validityDays} {isAr ? 'يوم' : 'days'}
                    </span>
                  </div>
                  <input
                    id="input-validity-days"
                    type="number"
                    value={spec.validityDays}
                    onChange={(e) => onUpdateSpec({ validityDays: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="input-payment-terms" className="block font-semibold text-slate-800 mb-1.5">
                    {t.paymentTerms || (isAr ? 'شروط وجدول الدفعات المالية' : 'Payment Milestones & Terms')}
                  </label>
                  <input
                    id="input-payment-terms"
                    type="text"
                    value={spec.paymentTerms}
                    onChange={(e) => onUpdateSpec({ paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="input-notes" className="block font-semibold text-slate-800 mb-1.5">
                    {t.techNotes || (isAr ? 'ملاحظات فنية ونطاق الأعمال والاستثناءات' : 'Technical Scope & Engineering Notes')}
                  </label>
                  <textarea
                    id="input-notes"
                    rows={3}
                    value={spec.notes}
                    onChange={(e) => onUpdateSpec({ notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 7: PROJECT TIMELINE & FIELD LABOR COST CENTER           */}
          {/* ============================================================ */}
          {activeTab === 'TIMELINE' && (
            <ProjectTimelineLaborView
              spec={spec}
              employees={employees}
              language={isAr ? 'ar' : 'en'}
              onUpdateSpec={onUpdateSpec}
            />
          )}

          {/* ============================================================ */}
          {/* TAB 8: PROJECT EMPLOYEE TIMESHEET & LABOR COST CENTER        */}
          {/* ============================================================ */}
          {activeTab === 'TIMESHEET' && (
            <ProjectTimesheetTab
              spec={spec}
              employees={employees}
              language={isAr ? 'ar' : 'en'}
              onUpdateSpec={onUpdateSpec}
            />
          )}

          {/* Wizard Navigation Footer */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 gap-3">
            <button
              id="btn-wizard-prev-step"
              type="button"
              disabled={activeTab === 'PROJECT'}
              onClick={() => {
                const tabs: WizardTab[] = ['PROJECT', 'TECHNICAL', 'SHAFT_CABIN', 'FINISHES', 'OPTIONS', 'COMMERCIAL', 'TIMELINE', 'TIMESHEET'];
                const idx = tabs.indexOf(activeTab);
                if (idx > 0) setActiveTab(tabs[idx - 1]);
              }}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                activeTab === 'PROJECT'
                  ? 'text-slate-300 border-slate-200 cursor-not-allowed bg-slate-50'
                  : 'text-slate-700 border-slate-200 hover:bg-slate-50 active:bg-slate-100'
              }`}
            >
              {isAr ? '← الخطوة السابقة' : '← Previous Step'}
            </button>

            <button
              id="btn-wizard-next-step"
              type="button"
              onClick={() => {
                const tabs: WizardTab[] = ['PROJECT', 'TECHNICAL', 'SHAFT_CABIN', 'FINISHES', 'OPTIONS', 'COMMERCIAL', 'TIMELINE', 'TIMESHEET'];
                const idx = tabs.indexOf(activeTab);
                if (idx < tabs.length - 1) {
                  setActiveTab(tabs[idx + 1]);
                } else {
                  onNavigateToDrawings();
                }
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {activeTab === 'TIMESHEET' ? (
                <>
                  <span>{isAr ? 'عرض مخططات CAD' : 'View CAD Drawings'}</span>
                  <Layers className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>{isAr ? 'الخطوة التالية →' : 'Next Step →'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sticky Sidebar: Real-Time Financials & Compliance Quick View */}
        <div className="lg:col-span-4 space-y-4">
          {/* Real-time Quotation Price Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-xs">
            <div className="text-slate-400 text-xs font-medium">Turnkey Quoted Selling Price (SAR)</div>
            <div className="text-3xl font-extrabold text-blue-400 mt-1 tracking-tight font-mono">
              <SarPrice amount={financials.totalQuotationPrice} symbolClassName="w-6 h-6 inline-block align-baseline mr-1.5 text-blue-400" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 mt-3 pt-3 border-t border-slate-700/60">
              <span>BOM Equipment Cost:</span>
              <span className="font-mono font-medium">
                <SarPrice amount={financials.subtotalCost} />
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 mt-1">
              <span>Gross Profit Margin:</span>
              <span className="font-mono font-semibold text-emerald-400">
                <SarPrice amount={financials.grossProfit} /> ({financials.grossMarginPercent}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 mt-1">
              <span>Includes VAT / Tax ({spec.taxPercentage}%):</span>
              <span className="font-mono font-medium">
                <SarPrice amount={financials.taxAmount} />
              </span>
            </div>

            {/* Direct Quick Action Buttons (Compact Side-by-Side Toolbar) */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                id="btn-quick-drawings"
                type="button"
                onClick={onNavigateToDrawings}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                title={isAr ? 'عرض المخطط الهندسي CAD' : 'View CAD Drawings'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAr ? 'مخطط CAD' : 'CAD'}</span>
              </button>

              <button
                id="btn-quick-print"
                type="button"
                onClick={onNavigateToPrint}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                title={isAr ? 'طباعة عرض السعر والعقد الموحد' : 'Print Proposal & Contract'}
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>{isAr ? 'طباعة' : 'Print'}</span>
              </button>

              <button
                id="btn-quick-bom"
                type="button"
                onClick={onNavigateToBOM}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                title={isAr ? 'بيان مقرر الصرف وقائمة المكونات BOM' : 'Components BOM & Disbursement'}
              >
                <Package className="w-3.5 h-3.5 text-slate-300" />
                <span>{isAr ? 'الصرف BOM' : 'BOM'}</span>
              </button>

              <button
                id="btn-quick-save-project"
                type="button"
                onClick={onSaveToHistorical}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                title={isAr ? 'حفظ المشروع في سجل المشاريع' : 'Save Project to Database'}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAr ? 'حفظ' : 'Save'}</span>
              </button>
            </div>

            {onSyncToGoogleSheet && (
              <button
                id="btn-sidebar-sync-sheets"
                type="button"
                onClick={onSyncToGoogleSheet}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors border border-emerald-500/40 shadow-2xs"
                title={isSheetsConnected ? (isAr ? 'مزامنة حية مع Google Sheets' : 'Sync live to Google Sheets') : (isAr ? 'ربط مع Google Sheets' : 'Connect Google Sheets')}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isSheetsConnected ? (isAr ? 'مزامنة Google Sheets' : 'Live Sync') : (isAr ? 'ربط Google Sheets' : 'Connect Sheets')}</span>
              </button>
            )}
          </div>

          {/* EN 81-20/50 Safety Compliance Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">EN 81-20 Clearance Check</span>
              {calc.isShaftWidthCompliant && calc.isShaftDepthCompliant && calc.isOverheadCompliant && calc.isPitCompliant ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Fully Compliant
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertTriangle className="w-3 h-3" /> Check Dimensions
                </span>
              )}
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span className="text-slate-500">Shaft Width Clearance:</span>
                <span className={calc.isShaftWidthCompliant ? 'text-slate-800 font-medium' : 'text-amber-600 font-semibold'}>
                  {spec.shaftWidthMm} mm (Min: {calc.recommendedShaftWidth})
                </span>
              </div>

              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span className="text-slate-500">Shaft Depth Clearance:</span>
                <span className={calc.isShaftDepthCompliant ? 'text-slate-800 font-medium' : 'text-amber-600 font-semibold'}>
                  {spec.shaftDepthMm} mm (Min: {calc.recommendedShaftDepth})
                </span>
              </div>

              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span className="text-slate-500">Overhead Refuge Safety:</span>
                <span className={calc.isOverheadCompliant ? 'text-slate-800 font-medium' : 'text-amber-600 font-semibold'}>
                  {spec.overheadHeightMm} mm (Min: {calc.recommendedOverhead})
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Pit Depth Safety Refuge:</span>
                <span className={calc.isPitCompliant ? 'text-slate-800 font-medium' : 'text-amber-600 font-semibold'}>
                  {spec.pitDepthMm} mm (Min: {calc.recommendedPitDepth})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Specifications Snapshot */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2 text-slate-600">
            <div className="font-semibold text-slate-800 text-xs">Drive &amp; Power Summary</div>
            <div className="flex justify-between">
              <span>Drive Motor:</span>
              <strong className="text-slate-900">{calc.motorPowerKw} kW PMSM</strong>
            </div>
            <div className="flex justify-between">
              <span>Rated Torque:</span>
              <strong className="text-slate-900">{calc.motorTorqueNm} Nm</strong>
            </div>
            <div className="flex justify-between">
              <span>Guide Rails:</span>
              <strong className="text-slate-900">{calc.carGuideRailType.split(' ')[0]}</strong>
            </div>
            <div className="flex justify-between">
              <span>Buffer Spec:</span>
              <strong className="text-slate-900">{spec.ratedSpeed > 1.0 ? 'Hydraulic Oil' : 'Polyurethane'}</strong>
            </div>
          </div>

          {/* Project Timeline Milestones Snapshot Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                {isAr ? 'مراحل التنفيذ الميداني' : 'Project Milestones'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {spec.currentMilestone || 'Engineering'}
              </span>
            </div>

            <div className="space-y-2">
              {[
                { key: 'Engineering', labelAr: '1. الاعتماد الهندسي', labelEn: '1. Engineering' },
                { key: 'Manufacturing', labelAr: '2. التصنيع والتجهيز', labelEn: '2. Manufacturing' },
                { key: 'Shipping', labelAr: '3. الشحن والتوريد', labelEn: '3. Shipping' },
                { key: 'Installation', labelAr: '4. التركيب الميداني', labelEn: '4. Installation' },
              ].map((item) => {
                const milestoneState = spec.projectMilestones?.[item.key as any]?.status || 
                  (spec.status === 'Installed' ? 'COMPLETED' : 
                   spec.status === 'Won' && item.key === 'Engineering' ? 'COMPLETED' :
                   spec.status === 'Approved' && item.key === 'Engineering' ? 'COMPLETED' :
                   item.key === 'Engineering' ? 'IN_PROGRESS' : 'PENDING');

                const isCurrent = spec.currentMilestone === item.key || (!spec.currentMilestone && item.key === 'Engineering');

                return (
                  <div key={item.key} className="flex items-center justify-between text-[11px]">
                    <span className={`font-medium ${isCurrent ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
                      {isAr ? item.labelAr : item.labelEn}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        milestoneState === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : milestoneState === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {milestoneState === 'COMPLETED'
                        ? (isAr ? 'مكتمل ✓' : 'Done ✓')
                        : milestoneState === 'IN_PROGRESS'
                        ? (isAr ? 'جاري ⏳' : 'Active ⏳')
                        : (isAr ? 'قيد الانتظار' : 'Pending')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{isAr ? 'إضافة عميل جديد سريعاً' : 'Quick Add Customer'}</h3>
                  <p className="text-[11px] text-blue-200">
                    {isAr ? 'سيتم حفظ العميل وربطه بعرض السعر الحالي فوراً' : 'Will be saved and auto-linked to this quotation'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label htmlFor="modal-quickadd-name" className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'اسم العميل / المالك *' : 'Customer Name *'}
                </label>
                <input
                  id="modal-quickadd-name"
                  type="text"
                  required
                  value={quickAddData.name}
                  onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                  placeholder={isAr ? 'مثال: شركة التطوير العقاري / فهد السبيعي' : 'e.g. Al-Madar Group'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-quickadd-company" className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الشركة / المؤسسة' : 'Company'}
                  </label>
                  <input
                    id="modal-quickadd-company"
                    type="text"
                    value={quickAddData.company}
                    onChange={(e) => setQuickAddData({ ...quickAddData, company: e.target.value })}
                    placeholder={isAr ? 'المجموعة الاستثمارية' : 'Real Estate Holding'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="modal-quickadd-phone" className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'رقم الهاتف / الجوال' : 'Phone'}
                  </label>
                  <input
                    id="modal-quickadd-phone"
                    type="text"
                    dir="ltr"
                    value={quickAddData.phone}
                    onChange={(e) => setQuickAddData({ ...quickAddData, phone: e.target.value })}
                    placeholder="+966 50 000 0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-quickadd-email" className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    id="modal-quickadd-email"
                    type="email"
                    dir="ltr"
                    value={quickAddData.email}
                    onChange={(e) => setQuickAddData({ ...quickAddData, email: e.target.value })}
                    placeholder="client@domain.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
                  />
                </div>

                <div>
                  <label htmlFor="modal-quickadd-location" className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'المدينة / الموقع' : 'Location / City'}
                  </label>
                  <input
                    id="modal-quickadd-location"
                    type="text"
                    value={quickAddData.location}
                    onChange={(e) => setQuickAddData({ ...quickAddData, location: e.target.value })}
                    placeholder={isAr ? 'الرياض - طريق الملك فهد' : 'Riyadh, Saudi Arabia'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-quickadd-notes" className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات إضافية' : 'Notes'}
                </label>
                <textarea
                  id="modal-quickadd-notes"
                  rows={2}
                  value={quickAddData.notes}
                  onChange={(e) => setQuickAddData({ ...quickAddData, notes: e.target.value })}
                  placeholder={isAr ? 'أي متطلبات خاصة بالعميل أو تفضيلات...' : 'Notes about requirements...'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors"
                >
                  {isAr ? 'حفظ واختيار العميل فوراً' : 'Save & Link to Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sticky Quick Action Bar (Visible only on mobile/tablet) */}
      <div className="lg:hidden sticky bottom-3 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom-2">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
            {isAr ? 'السعر الإجمالي' : 'Total Price'}
          </div>
          <div className="text-sm font-extrabold text-blue-400 font-mono leading-tight truncate">
            <SarPrice amount={financials.totalQuotationPrice} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onNavigateToDrawings}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            title={isAr ? 'عرض مخطط CAD' : 'View CAD'}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CAD</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToPrint}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold transition-colors border border-slate-700 shadow-xs"
            title={isAr ? 'طباعة العرض والعقد' : 'Print Proposal'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'طباعة' : 'Print'}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToBOM}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors border border-slate-700 shadow-xs"
            title={isAr ? 'بيان الصرف والمكونات' : 'BOM'}
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'الصرف' : 'BOM'}</span>
          </button>

          <button
            type="button"
            onClick={onSaveToHistorical}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            title={isAr ? 'حفظ المشروع' : 'Save Project'}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isAr ? 'حفظ' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
