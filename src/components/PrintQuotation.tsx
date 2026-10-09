import React, { useState, useEffect, useMemo } from 'react';
import { ElevatorSpecification } from '../types/elevator';
import { generateComponentList, calculateQuotationFinancials } from '../utils/pricingEngine';
import { calculateElevatorEngineering } from '../utils/elevatorCalculations';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  FileSpreadsheet,
  FileText,
  FileCheck,
  Layers,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Clock,
  QrCode,
  Share2,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { exportBomToExcel } from '../utils/excelExport';
import { exportElementToPdf } from '../utils/pdfExport';
import { TwinsLogo } from './TwinsLogo';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';
import { CadPrintPlanDrawing } from './CadPrintPlanDrawing';
import { CadPrintElevationDrawing } from './CadPrintElevationDrawing';
import { ARCHITECTURAL_PRESETS } from '../utils/architecturalPresets';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/settings';
import { AppLanguage, TRANSLATIONS } from '../utils/translations';
import { DisbursementStatementView } from './DisbursementStatementView';
import { ProjectQRCode } from './ProjectQRCode';
import { buildProjectDigitalUrl } from '../utils/qrCodeGenerator';

export type UnifiedPrintScope = 'UNIFIED_MASTER' | 'QUOTATION_ONLY' | 'CONTRACT_ONLY' | 'DISBURSEMENT_STATEMENT';
export type CadPrintViewChoice = 'PLAN_ONLY' | 'ELEVATION_ONLY' | 'BOTH';

interface Props {
  spec: ElevatorSpecification;
  initialDocumentType?: 'QUOTATION' | 'CONTRACT';
  settings?: CompanySettings;
  language?: AppLanguage;
  onBackToWizard: () => void;
  onSyncToGoogleSheet?: () => void;
  isSheetsConnected?: boolean;
}

export const PrintQuotation: React.FC<Props> = ({
  spec,
  initialDocumentType,
  settings,
  language = 'ar',
  onBackToWizard,
  onSyncToGoogleSheet,
  isSheetsConnected,
}) => {
  const activeSettings = settings || DEFAULT_COMPANY_SETTINGS;
  const t = TRANSLATIONS[language];
  const [cadViewChoice, setCadViewChoice] = useState<CadPrintViewChoice>('BOTH');

  // Unified Print Scope State
  const [printScope, setPrintScope] = useState<UnifiedPrintScope>(
    initialDocumentType === 'CONTRACT' ? 'CONTRACT_ONLY' : 'UNIFIED_MASTER'
  );
  const [digitalCopied, setDigitalCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialDocumentType === 'CONTRACT') {
      setPrintScope('CONTRACT_ONLY');
    }
  }, [initialDocumentType, spec.id]);

  const components = useMemo(() => generateComponentList(spec), [spec]);
  const financials = useMemo(() => calculateQuotationFinancials(spec, components), [spec, components]);
  const calc = useMemo(() => calculateElevatorEngineering(spec), [spec]);

  // Derived financial values
  const elevatorsQty = 1;
  const unitElevatorTotal = financials.totalQuotationPrice - financials.taxAmount;
  const baseTotal = unitElevatorTotal * elevatorsQty;
  const discountAmount = spec.discountPercentage > 0 ? (baseTotal * spec.discountPercentage) / 100 : 0;
  const taxableTotal = baseTotal - discountAmount;
  const vatAmount = taxableTotal * 0.15;
  const grandTotal = taxableTotal + vatAmount;

  // Timeline & Warranty numbers
  const supplyDurationDays = spec.deliveryWeeks ? spec.deliveryWeeks * 6 : 45;
  const warrantyYears = Math.round(spec.warrantyMonths / 12) || 1;

  // Bilingual Elevator Mappings
  const getElevatorTypeAr = () => {
    switch (spec.elevatorType) {
      case 'MRL_TRACTION':
        return 'مصعد ركاب بدون غرفة ماكينة (MRL)';
      case 'GEARED_TRACTION':
        return 'مصعد ركاب بماكينة تروس (Geared)';
      case 'HYDRAULIC':
        return 'مصعد هيدروليكي (Hydraulic)';
      case 'PANORAMIC_GLASS':
        return 'مصعد ركاب بانورامي زجاجي فاخر';
      case 'FREIGHT_HEAVY':
        return 'مصعد بضائع وخدمة شاقة';
      default:
        return 'مصعد ركاب';
    }
  };

  const getElevatorTypeEn = () => {
    switch (spec.elevatorType) {
      case 'MRL_TRACTION':
        return 'MRL Passenger Elevator';
      case 'GEARED_TRACTION':
        return 'Geared Traction Passenger Elevator';
      case 'HYDRAULIC':
        return 'Hydraulic Passenger Elevator';
      case 'PANORAMIC_GLASS':
        return 'Luxury Panoramic Glass Elevator';
      case 'FREIGHT_HEAVY':
        return 'Freight & Heavy Goods Elevator';
      default:
        return 'Passenger Elevator';
    }
  };

  const getDoorTypeAr = () => {
    switch (spec.doorType) {
      case 'CENTER_2P':
        return 'أوتوماتيك سنتر يفتح من المنتصف (ضلفات 2)';
      case 'CENTER_4P':
        return 'أوتوماتيك سنتر 4 ضلفات';
      case 'SIDE_2P':
        return 'أوتوماتيك جانبي تلسكوبي (ضلفات 2)';
      case 'SIDE_3P':
        return 'أوتوماتيك جانبي تلسكوبي (3 ضلفات)';
      default:
        return 'أوتوماتيك سنتر يفتح من المنتصف';
    }
  };

  const getDoorTypeEn = () => {
    switch (spec.doorType) {
      case 'CENTER_2P':
        return 'Center Opening 2-Panel Automatic';
      case 'CENTER_4P':
        return 'Center Opening 4-Panel Automatic';
      case 'SIDE_2P':
        return 'Side Telescopic 2-Panel Automatic';
      case 'SIDE_3P':
        return 'Side Telescopic 3-Panel Automatic';
      default:
        return 'Center Opening Automatic';
    }
  };

  const getCabinFinishAr = () => {
    switch (spec.wallFinish) {
      case 'BRUSHED_STEEL_304':
        return 'استانلس ستيل شعري 304 المقاوم للصدأ';
      case 'MIRROR_ETCHED_GOLD':
        return 'استانلس ستيل ذهبي منقوش مع مرايا عاكسة فاخرة';
      case 'HAIRLINE_TITANIUM_BLACK':
        return 'استانلس ستيل تيتانيوم أسود فاخر';
      case 'PANORAMIC_GLASS':
        return 'زجاج سيكوريت مقسى شفاف بانوراما 360';
      case 'WOOD_VENEER_LUXURY':
        return 'خشب طبيعي فاخر مع تطعيمات ستانلس ستيل';
      default:
        return 'استانلس ستيل فاخر';
    }
  };

  const getCabinFinishEn = () => {
    switch (spec.wallFinish) {
      case 'BRUSHED_STEEL_304':
        return 'Brushed Hairline Stainless Steel 304';
      case 'MIRROR_ETCHED_GOLD':
        return 'Mirror Etched Gold Stainless Steel';
      case 'HAIRLINE_TITANIUM_BLACK':
        return 'Titanium Black Stainless Steel';
      case 'PANORAMIC_GLASS':
        return 'Tempered Safety Panoramic Glass';
      case 'WOOD_VENEER_LUXURY':
        return 'Luxury Natural Wood Veneer & Stainless Steel';
      default:
        return 'Stainless Steel Finish';
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const filename = `${spec.projectName || 'Quotation'}_${spec.quoteRef || 'Ref'}_${printScope}`;
      const targetId = printScope === 'DISBURSEMENT_STATEMENT' ? 'disbursement-statement-sheet' : 'printable-quotation-sheet';
      await exportElementToPdf(targetId, {
        filename,
        marginMm: 6,
      });
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const [excelExportNotification, setExcelExportNotification] = useState(false);
  const handleExportExcel = () => {
    exportBomToExcel(spec, components, `${spec.quoteRef || 'Twins_Quotation'}_ERP_Print.xlsx`);
    setExcelExportNotification(true);
    setTimeout(() => setExcelExportNotification(false), 3000);
  };

  // Dimensions for embedded CAD diagram
  const SW = spec.shaftWidthMm;
  const SD = spec.shaftDepthMm;
  const CW = spec.cabinWidthMm;
  const CD = spec.cabinDepthMm;
  const DW = spec.doorWidthMm;

  // Mini CAD SVG Plan scale
  const planScale = Math.min(260 / Math.max(SW, 1500), 180 / Math.max(SD, 1500));
  const shaftSvgW = SW * planScale;
  const shaftSvgH = SD * planScale;
  const shaftX = (340 - shaftSvgW) / 2;
  const shaftY = (220 - shaftSvgH) / 2;

  const cwtPos = spec.counterweightPosition || 'REAR';
  const carSvgW = CW * planScale;
  const carSvgH = CD * planScale;
  const carSvgX = shaftX + (shaftSvgW - carSvgW) / 2;
  const frontSillOffset = 18 * planScale;
  const carSvgY = shaftY + shaftSvgH - carSvgH - frontSillOffset - (cwtPos === 'REAR' ? 0 : 15 * planScale);

  const doorSvgW = DW * planScale;
  const doorSvgX = shaftX + (shaftSvgW - doorSvgW) / 2;

  const cwtWidth = cwtPos === 'REAR' ? (CW * 0.7) * planScale : 140 * planScale;
  const cwtDepth = cwtPos === 'REAR' ? 90 * planScale : (CD * 0.5) * planScale;
  const cwtX = cwtPos === 'REAR'
    ? shaftX + (shaftSvgW - cwtWidth) / 2
    : cwtPos === 'SIDE_LEFT'
    ? shaftX + 15 * planScale
    : shaftX + shaftSvgW - cwtWidth - 15 * planScale;
  const cwtY = cwtPos === 'REAR'
    ? shaftY + 15 * planScale
    : shaftY + (shaftSvgH - cwtDepth) / 2;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Control Navigation & Print Header Bar (Screen Only - Compact High-Density) */}
      <div className="no-print bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            id="btn-back-to-wizard"
            type="button"
            onClick={onBackToWizard}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="العودة لمعالج المواصفات (Back to Wizard)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">العودة</span>
          </button>

          {/* Unified Design Scope Selector */}
          <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth max-w-full bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs whitespace-nowrap">
            <button
              id="scope-unified-master"
              type="button"
              onClick={() => setPrintScope('UNIFIED_MASTER')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-md transition-all ${
                printScope === 'UNIFIED_MASTER'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="الوثيقة الشاملة الموحدة (Master)"
            >
              <FileText className="w-3.5 h-3.5 text-[#b6be49]" />
              <span>المستند الموحد</span>
            </button>
            <button
              id="scope-quotation-only"
              type="button"
              onClick={() => setPrintScope('QUOTATION_ONLY')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-md transition-all ${
                printScope === 'QUOTATION_ONLY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض السعر الفني فقط"
            >
              <span>عرض السعر</span>
            </button>
            <button
              id="scope-contract-only"
              type="button"
              onClick={() => setPrintScope('CONTRACT_ONLY')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-md transition-all ${
                printScope === 'CONTRACT_ONLY'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عقد التوريد والتركيب فقط"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>عقد التركيب</span>
            </button>
            <button
              id="scope-disbursement-statement"
              type="button"
              onClick={() => setPrintScope('DISBURSEMENT_STATEMENT')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-md transition-all ${
                printScope === 'DISBURSEMENT_STATEMENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="مقرر الصرف للموقع (المراحل الثلاث)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>مقرر الصرف</span>
            </button>
          </div>
        </div>

        {/* Compact Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto justify-end pt-1 md:pt-0">
          {onSyncToGoogleSheet && (
            <button
              id="btn-print-sync-sheet"
              type="button"
              onClick={onSyncToGoogleSheet}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-300 transition-colors shadow-2xs"
              title={isSheetsConnected ? 'مزامنة مع Google Sheets' : 'حفظ في Google Sheets'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{isSheetsConnected ? 'Sync' : 'Sheets'}</span>
            </button>
          )}

          <button
            id="btn-print-copy-digital-link"
            type="button"
            onClick={() => {
              const url = buildProjectDigitalUrl(spec, printScope);
              navigator.clipboard.writeText(url).then(() => {
                setDigitalCopied(true);
                setTimeout(() => setDigitalCopied(false), 2500);
              });
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors shadow-2xs"
            title="نسخ رابط النسخة الرقمية المشفر في رمز QR"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">
              {digitalCopied ? 'تم النسخ!' : 'رابط QR'}
            </span>
          </button>

          <button
            id="btn-print-export-excel"
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
            title="تصدير بيانات ومواصفات العرض إلى ملف Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Excel (.xlsx)</span>
            {excelExportNotification && (
              <span className="text-[10px] text-emerald-700 bg-emerald-200/80 px-1 py-0.2 rounded font-black animate-in fade-in">
                تم!
              </span>
            )}
          </button>

          <button
            id="btn-print-export-pdf"
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-xs border border-rose-500/40 transition-all cursor-pointer"
            title="تصدير وحفظ المستند كملف PDF عالي الدقة (Export PDF)"
          >
            {isExportingPdf ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-white" />
                <span>تصدير PDF</span>
              </>
            )}
          </button>

          <button
            id="btn-trigger-print"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#172033] hover:bg-[#222f4b] text-white text-xs font-bold rounded-lg shadow-sm border border-[#b6be49]/40 transition-colors cursor-pointer"
            title="طباعة المستند الرسمي (Print Document)"
          >
            <Printer className="w-4 h-4 text-[#b6be49]" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Render 3-Stage Disbursement Statement when selected */}
      {printScope === 'DISBURSEMENT_STATEMENT' ? (
        <DisbursementStatementView 
          spec={spec} 
          onSyncToGoogleSheet={onSyncToGoogleSheet}
          isSheetsConnected={isSheetsConnected}
        />
      ) : (
        /* ========================================================================= */
        /* UNIFIED SINGLE PRINT TEMPLATE (قالب الطباعة الموحد لتطبيق TWINS LIFT CALC) */
        /* ========================================================================= */
        <div 
          id="printable-quotation-sheet" 
          className="erp-print-shell max-w-4xl mx-auto p-6 sm:p-10 rounded-xl border border-slate-200 shadow-md bg-white text-[#172033]"
        >
        {/* Top ERPNext Brand Gradient Strip */}
        <div 
          className="brand-strip"
          style={{
            background: `linear-gradient(90deg, ${activeSettings.primaryColor} 0%, ${activeSettings.primaryColor} 45%, ${activeSettings.accentColor} 45%, ${activeSettings.accentColor} 100%)`
          }}
        ></div>

        {/* Company Identification & Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <TwinsLogo size={52} customLogoUrl={activeSettings.logoUrl} />
            <div>
              <div 
                className="font-extrabold text-base tracking-wide"
                style={{ color: activeSettings.primaryColor }}
              >
                {activeSettings.companyNameAr}
              </div>
              <div 
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: activeSettings.accentColor }}
              >
                {activeSettings.companyNameEn}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                سجل تجاري: {activeSettings.commercialRegistration} | الرقم الضريبي: {activeSettings.vatNumber}
              </div>
            </div>
          </div>

          <div className="text-left text-[11px] text-slate-500 space-y-0.5" dir="ltr">
            <div className="font-bold text-right" dir="rtl" style={{ color: activeSettings.primaryColor }}>
              {activeSettings.addressAr}
            </div>
            <div>{activeSettings.addressEn}</div>
            <div>Hotline: {activeSettings.mobile || activeSettings.phone}</div>
            <div>Email: {activeSettings.email}</div>
          </div>
        </div>

        {/* Document Hero Titles */}
        <div className="hero-title-ar">
          {printScope === 'UNIFIED_MASTER' && 'عرض سعر فني ومالي وعقد توريد وتركيب مصعد'}
          {printScope === 'QUOTATION_ONLY' && 'عرض سعر فني ومالي لتركيب مصعد'}
          {printScope === 'CONTRACT_ONLY' && 'عقد توريد وتركيب مصعد معتمد'}
        </div>
        <div className="hero-title-en">
          {printScope === 'UNIFIED_MASTER' && 'Turnkey Technical Quotation & Supply Contract Agreement'}
          {printScope === 'QUOTATION_ONLY' && 'Technical & Financial Elevator Quotation'}
          {printScope === 'CONTRACT_ONLY' && 'Contract for Supply and Installation Elevators'}
        </div>

        {/* Unified Document Hero Metadata Card */}
        <div className="quote-hero mt-3">
          <table className="w-full">
            <tbody>
              <tr>
                <td style={{ width: '68%', verticalAlign: 'top', paddingLeft: '10px' }}>
                  <table className="hero-meta">
                    <tbody>
                      <tr>
                        <td className="m-label">رقم المرجع <span className="text-slate-500 text-[10px]" dir="ltr">Ref</span></td>
                        <td className="m-value font-mono font-bold text-blue-700">{spec.quoteRef}</td>
                      </tr>
                      {spec.elevatorNumber && (
                        <tr>
                          <td className="m-label">رقم كود المصعد <span className="text-slate-500 text-[10px]" dir="ltr">Unit Code</span></td>
                          <td className="m-value font-mono font-bold text-blue-800">{spec.elevatorNumber}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="m-label">تاريخ الإصدار <span className="text-slate-500 text-[10px]" dir="ltr">Date</span></td>
                        <td className="m-value font-mono">{spec.date}</td>
                      </tr>
                      <tr>
                        <td className="m-label">اسم المشروع <span className="text-slate-500 text-[10px]" dir="ltr">Project</span></td>
                        <td className="m-value font-bold">{spec.projectName}</td>
                      </tr>
                      <tr>
                        <td className="m-label">السيد / السادة <span className="text-slate-500 text-[10px]" dir="ltr">Client</span></td>
                        <td className="m-value font-bold">{spec.clientName}</td>
                      </tr>
                      <tr>
                        <td className="m-label">موقع الموقع <span className="text-slate-500 text-[10px]" dir="ltr">Location</span></td>
                        <td className="m-value">{spec.siteLocation}</td>
                      </tr>
                      {spec.assignedSalesRepName && (
                        <tr>
                          <td className="m-label">مندوب المبيعات <span className="text-slate-500 text-[10px]" dir="ltr">Sales Rep</span></td>
                          <td className="m-value font-bold text-slate-900">
                            {spec.assignedSalesRepName}
                            {spec.assignedSalesRepPhone && (
                              <span className="text-[10px] font-mono text-slate-500 font-normal ms-2" dir="ltr">
                                ({spec.assignedSalesRepPhone})
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="m-label">هاتف العميل <span className="text-slate-500 text-[10px]" dir="ltr">Phone</span></td>
                        <td className="m-value font-mono">{spec.clientPhone}</td>
                      </tr>
                      <tr>
                        <td className="m-label">فترة الصلاحية <span className="text-slate-500 text-[10px]" dir="ltr">Validity</span></td>
                        <td className="m-value font-bold text-emerald-700">30 يوماً من تاريخه / 30 Days</td>
                      </tr>
                    </tbody>
                  </table>
                </td>

                <td style={{ width: '32%', verticalAlign: 'middle', textAlign: 'center' }}>
                  <div className="flex flex-col items-center justify-center">
                    <ProjectQRCode
                      spec={spec}
                      docScope={printScope}
                      size={96}
                      primaryColor={activeSettings.primaryColor}
                      showLabel={true}
                      showActions={true}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Contract Preamble if in Master or Contract mode */}
        {printScope !== 'QUOTATION_ONLY' && (
          <div className="section-erp">
            <div className="section-title-erp">
              <span>تمهيد وموضوع الاتفاق</span>
              <span className="en">Preamble &amp; Agreement Purpose</span>
            </div>
            <div className="box-erp text-[11px] leading-relaxed text-slate-800">
              <p className="mb-1.5 font-medium">
                بعون الله وتوفيقه تم الاتفاق والتراضي بين كل من:
              </p>
              <div className="grid grid-cols-2 gap-3 mb-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <strong style={{ color: activeSettings.primaryColor }}>الطرف الأول:</strong> {activeSettings.companyNameAr}، سجل تجاري ({activeSettings.commercialRegistration})، الرقم الضريبي ({activeSettings.vatNumber})، ويمثلها المهندس المسؤول.
                </div>
                <div>
                  <strong style={{ color: activeSettings.primaryColor }}>الطرف الثاني:</strong> المكرم / {spec.clientName}، هاتف: {spec.clientPhone}، مالك المشروع بموقع: {spec.siteLocation}.
                </div>
              </div>
              <p className="text-slate-600 text-[10.5px]">
                وحيث أبدى الطرف الثاني رغبته في توريد وتركيب مصعد مطابق للمواصفات والمخططات الهندسية المرفقة، فقد التقت إرادة الطرفين على بنود هذا الاتفاق الملزم.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: TECHNICAL SPECIFICATIONS (المواصفات الفنية المعتمدة للمصعد) */}
        {/* ========================================================================= */}
        <div className="section-erp">
          <div className="section-title-erp">
            <span>المواصفات الفنية المعتمدة للمصعد</span>
            <span className="en">Approved Technical Specifications</span>
          </div>

          <div className="box-erp">
            <table className="spec-table-erp">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>البند الفني</th>
                  <th style={{ width: '38%' }}>المواصفة التفصيلية</th>
                  <th style={{ width: '24%' }}>Technical Specification</th>
                  <th style={{ width: '16%' }}>Item</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold">نوع واستخدام المصعد</td>
                  <td className="font-semibold text-right">{getElevatorTypeAr()}</td>
                  <td className="value">{getElevatorTypeEn()}</td>
                  <td className="font-bold text-left" dir="ltr">Elevator Type</td>
                </tr>

                <tr>
                  <td className="font-bold">الحمولة المقدرة والركاب</td>
                  <td className="text-right">
                    حمولة {spec.capacityKg} كجم (تتسع لعدد {spec.personsCount} ركاب طبقاً للأكواد)
                  </td>
                  <td className="value">{spec.capacityKg} kg ({spec.personsCount} Persons)</td>
                  <td className="font-bold text-left" dir="ltr">Rated Capacity</td>
                </tr>

                <tr>
                  <td className="font-bold">السرعة الاسمية</td>
                  <td className="text-right">
                    سرعة حركة الصاعدة {spec.ratedSpeed} متر/الثانية مع هبوط وإقلاع هادئ
                  </td>
                  <td className="value">{spec.ratedSpeed} m/s</td>
                  <td className="font-bold text-left" dir="ltr">Rated Speed</td>
                </tr>

                <tr>
                  <td className="font-bold">عدد الوقفات والمداخل</td>
                  <td className="text-right">
                    عدد {spec.stops} وقفات متتالية &bull; عدد {spec.stops} مداخل في نفس الاتجاه
                  </td>
                  <td className="value">{spec.stops} Stops &bull; {spec.stops} Openings</td>
                  <td className="font-bold text-left" dir="ltr">Stops &amp; Landings</td>
                </tr>

                <tr>
                  <td className="font-bold">ارتفاع مشوار المصعد</td>
                  <td className="text-right">
                    إجمالي مشوار الصعود {spec.travelHeightM} متر
                  </td>
                  <td className="value">{spec.travelHeightM} Meters</td>
                  <td className="font-bold text-left" dir="ltr">Travel Height</td>
                </tr>

                <tr>
                  <td className="font-bold">ماكينة الجر والمحرك</td>
                  <td className="text-right font-medium">
                    ماكينة مغناطيس دائم بدون تروس PMSM Gearless قدرة {calc.motorPowerKw} كيلوواط عزم {calc.motorTorqueNm} ن.م
                  </td>
                  <td className="value">PMSM Gearless {calc.motorPowerKw} kW ({calc.motorTorqueNm} Nm)</td>
                  <td className="font-bold text-left" dir="ltr">Traction Machine</td>
                </tr>

                <tr>
                  <td className="font-bold">لوحة التحكم ومغير السرعة</td>
                  <td className="text-right">
                    لوحة معالج دقيق ذكية Microprocessor مزودة بإنفرتر VVVF متطور لتوفير الطاقة
                  </td>
                  <td className="value">VVVF Microprocessor Intelligent Panel</td>
                  <td className="font-bold text-left" dir="ltr">Control System</td>
                </tr>

                <tr>
                  <td className="font-bold">أبعاد وتشطيب الكابينة</td>
                  <td className="text-right">
                    عرض {spec.cabinWidthMm} &times; عمق {spec.cabinDepthMm} &times; ارتفاع {spec.cabinHeightMm} مم &bull; {getCabinFinishAr()}
                  </td>
                  <td className="value">{CW}&times;{CD}&times;{spec.cabinHeightMm} mm &bull; {getCabinFinishEn()}</td>
                  <td className="font-bold text-left" dir="ltr">Cabin Finishes</td>
                </tr>

                <tr>
                  <td className="font-bold">أبواب الأدوار والكابينة</td>
                  <td className="text-right">
                    {getDoorTypeAr()} &bull; فتحة صافية {spec.doorWidthMm} &times; {spec.doorHeightMm} مم ستانلس ستيل
                  </td>
                  <td className="value">{getDoorTypeEn()} ({DW}&times;{spec.doorHeightMm} mm)</td>
                  <td className="font-bold text-left" dir="ltr">Doors &amp; Openings</td>
                </tr>

                <tr>
                  <td className="font-bold">سكك التوجيه والحبال</td>
                  <td className="text-right">
                    سكك سحب بارد T-Type {calc.carGuideRailType.split(' ')[0]} مع ثقل موازنة {spec.counterweightPosition === 'REAR' ? 'خلفي' : 'جانبي'}
                  </td>
                  <td className="value">{calc.carGuideRailType.split(' ')[0]} Rails &bull; CWT: {spec.counterweightPosition}</td>
                  <td className="font-bold text-left" dir="ltr">Guide Rails</td>
                </tr>

                <tr>
                  <td className="font-bold">أجهزة السلامة والطوارئ</td>
                  <td className="text-right">
                    باراشوت أمان فوري/تدريجي، محدد سرعة زائدة، ستارة ضوئية بالأبواب، وجهاز إنقاذ طوارئ ARD
                  </td>
                  <td className="value">Safety Gear &bull; Governor &bull; Light Curtain &bull; ARD</td>
                  <td className="font-bold text-left" dir="ltr">Safety Devices</td>
                </tr>

                <tr>
                  <td className="font-bold">المعايير والأكواد المعتمدة</td>
                  <td className="text-right font-semibold text-emerald-800">
                    كود المصاعد الأوروبي المعتمد EN 81-20 / EN 81-50 وكود البناء السعودي (SBC)
                  </td>
                  <td className="value font-bold text-emerald-800">EN 81-20/50 &bull; SASO SBC</td>
                  <td className="font-bold text-left" dir="ltr">Safety Codes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: CAD SHAFT CLEARANCES & ENGINEERING PLAN (المخطط الهندسي)     */}
        {/* ========================================================================= */}
        <div className="section-erp">
          <div 
            className="section-title-erp flex items-center justify-between"
            style={{
              backgroundColor: activeSettings.primaryColor,
              borderRightColor: activeSettings.accentColor,
            }}
          >
            <div className="flex items-center gap-2">
              <span>المخطط الهندسي وأبعاد مسار المصعد والكابينة</span>
              <span className="en">Shaft &amp; Cabin Engineering CAD Clearances</span>
            </div>

            {/* Print View Selector (hidden in actual paper print) */}
            <div className="no-print flex items-center gap-1 text-[10px] bg-white/10 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setCadViewChoice('BOTH')}
                className={`px-2 py-0.5 rounded transition-all ${
                  cadViewChoice === 'BOTH' ? 'bg-white text-slate-900 font-bold' : 'text-white hover:bg-white/20'
                }`}
              >
                كلا المسقطين (Both)
              </button>
              <button
                type="button"
                onClick={() => setCadViewChoice('PLAN_ONLY')}
                className={`px-2 py-0.5 rounded transition-all ${
                  cadViewChoice === 'PLAN_ONLY' ? 'bg-white text-slate-900 font-bold' : 'text-white hover:bg-white/20'
                }`}
              >
                مسقط أفقي (Plan)
              </button>
              <button
                type="button"
                onClick={() => setCadViewChoice('ELEVATION_ONLY')}
                className={`px-2 py-0.5 rounded transition-all ${
                  cadViewChoice === 'ELEVATION_ONLY' ? 'bg-white text-slate-900 font-bold' : 'text-white hover:bg-white/20'
                }`}
              >
                مقطع رأسي (Elevation)
              </button>
            </div>
          </div>

          <div className="box-erp space-y-4">
            {/* Drawings Display Grid */}
            <div className={`grid gap-4 ${cadViewChoice === 'BOTH' ? 'grid-cols-1' : 'grid-cols-1'}`}>
              {(cadViewChoice === 'BOTH' || cadViewChoice === 'PLAN_ONLY') && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between px-1">
                    <span>1. المسقط الأفقي الهندسي لمسار المصعد والخلوصات (Cross Section Plan)</span>
                    <span className="font-mono text-[10px] text-slate-500">SCALE 1:25 APPROX &bull; EN 81-20</span>
                  </div>
                  <CadPrintPlanDrawing 
                    spec={spec} 
                    primaryColor={activeSettings.primaryColor}
                    accentColor={activeSettings.accentColor}
                  />
                </div>
              )}

              {(cadViewChoice === 'BOTH' || cadViewChoice === 'ELEVATION_ONLY') && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between px-1">
                    <span>2. المقطع الرأسي للبئر ومسافات التحليق والحفرة (Vertical Elevation Section)</span>
                    <span className="font-mono text-[10px] text-slate-500">MRL ELEVATION &bull; SASO SBC</span>
                  </div>
                  <CadPrintElevationDrawing 
                    spec={spec} 
                    primaryColor={activeSettings.primaryColor}
                    accentColor={activeSettings.accentColor}
                  />
                </div>
              )}
            </div>

            {/* Engineering Compliance Summary Bar */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 mb-2 flex items-center justify-between text-xs">
                <span>جدول المطابقة الهندسية للأبعاد ومسارات الأمان المعتمدة</span>
                <span className="font-mono text-emerald-700 font-bold px-2 py-0.5 bg-emerald-100 rounded text-[10px]">
                  SASO &bull; EN 81-20/50 COMPLIANT
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] text-slate-700">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">بئر المصعد (Shaft)</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">SW {SW} &times; SD {SD} mm</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">الكابينة الصافية (Cabin)</div>
                  <div className="font-mono font-bold text-emerald-800 mt-0.5">CW {CW} &times; CD {CD} mm</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">فتحة الباب (Door Opening)</div>
                  <div className="font-mono font-bold text-amber-800 mt-0.5">DW {DW} &times; DH {spec.doorHeightMm} mm</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">مسار التحليق والحفرة (OH / Pit)</div>
                  <div className="font-mono font-bold text-blue-800 mt-0.5">OH {spec.overheadHeightMm} / Pit {spec.pitDepthMm} mm</div>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-slate-600 font-medium">
                <strong>الاعتماد الهندسي:</strong> تم تدقيق جميع الخلوصات الهندسية ومطابقتها وفق كود البناء السعودي SBC وكود المصاعد EN 81-20/50 والاشتراطات الفنية لشركة {activeSettings.companyNameAr}.
              </div>
            </div>

            {/* 3D Architectural Visualization & Cabin Finishes Section */}
            {spec.includeRenderInPdf !== false && (
              <div className="space-y-1.5 pt-3 border-t border-slate-200">
                <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between px-1">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>3. التصور المعماري ثلاثي الأبعاد لكابينة وبئر المصعد (3D Architectural Visualization &amp; Finishes)</span>
                  </span>
                  <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                    IMAGEN AI 3D RENDER &bull; CONCEPTUAL
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-xs">
                  <div className="relative aspect-16/9 sm:aspect-21/9 max-h-72 w-full overflow-hidden flex items-center justify-center bg-slate-900">
                    <img
                      src={spec.architecturalRenderUrl || ARCHITECTURAL_PRESETS[0].svgDataUri}
                      alt="Architectural 3D Render"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 start-2 bg-black/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/20">
                      {spec.projectName || 'Twins Elevator'} &bull; {spec.quoteRef}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] border-t border-slate-800">
                    <span className="font-medium text-slate-300">
                      <strong>ملاحظة الاعتماد المعماري:</strong> {spec.architecturalRenderCaption || 'تصور معماري ثلاثي الأبعاد مقترح لكابينة وتشطيبات المصعد المعتمدة وفق كود SBC 801.'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 text-slate-400">
                      <span>CW {CW} &times; CD {CD} mm</span>
                      <span>&bull;</span>
                      <span className="text-amber-300 font-bold">{getCabinFinishAr()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: COMMERCIAL OFFER & FINANCIAL SCHEDULE (العرض المالي وجدول الأسعار) */}
        {/* ========================================================================= */}
        <div className="section-erp">
          <div className="section-title-erp">
            <span>العرض المالي وجدول الكميات والأسعار</span>
            <span className="en">Financial Offer &amp; Bill of Quantities</span>
          </div>

          <div className="box-erp">
            <table className="spec-table-erp financial-table-erp">
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>#</th>
                  <th style={{ width: '42%' }}>الوصف وبيان الأعمال</th>
                  <th style={{ width: '12%' }}>العدد</th>
                  <th style={{ width: '19%' }}>إجمالي المصعد (SAR)</th>
                  <th style={{ width: '19%' }}>الإجمالي (SAR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center font-mono font-bold">1</td>
                  <td className="text-right font-semibold text-slate-900">
                    توريد وتركيب وتشغيل مصعد ركاب شامل ماكينة الجر والكابينة والأبواب وكافة التجهيزات المذكورة بالعرض
                  </td>
                  <td className="text-center font-bold font-mono">{elevatorsQty}</td>
                  <td className="text-center font-mono font-bold">
                    <SarPrice amount={unitElevatorTotal} />
                  </td>
                  <td className="text-center font-mono font-bold">
                    <SarPrice amount={baseTotal} />
                  </td>
                </tr>

                {discountAmount > 0 && (
                  <tr>
                    <td colSpan={4} className="text-right font-bold text-slate-700">
                      الخصم التجاري الممنوح <span className="text-slate-500 font-normal" dir="ltr">({spec.discountPercentage}%)</span>
                    </td>
                    <td className="text-center font-mono font-bold text-rose-600">
                      - <SarPrice amount={discountAmount} />
                    </td>
                  </tr>
                )}

                <tr className="highlight-row-erp">
                  <td colSpan={4} className="text-right font-bold text-slate-800">
                    المجموع الخاضع للضريبة <span className="text-slate-500 font-normal" dir="ltr">(Taxable Subtotal)</span>
                  </td>
                  <td className="text-center font-mono font-bold">
                    <SarPrice amount={taxableTotal} />
                  </td>
                </tr>

                <tr className="highlight-row-erp">
                  <td colSpan={4} className="text-right font-bold text-slate-800">
                    ضريبة القيمة المضافة 15% <span className="text-slate-500 font-normal" dir="ltr">(VAT 15%)</span>
                  </td>
                  <td className="text-center font-mono font-bold">
                    <SarPrice amount={vatAmount} />
                  </td>
                </tr>

                <tr className="total-row-erp">
                  <td colSpan={4} className="text-right font-black text-sm text-[#172033]">
                    الإجمالي النهائي الصافي شامل الضريبة <span className="text-slate-700 text-xs font-bold" dir="ltr">(Grand Total Value)</span>
                  </td>
                  <td className="text-center font-mono font-black text-sm text-[#172033]">
                    <SarPrice amount={grandTotal} showCode={true} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: PAYMENT SCHEDULE (جدول سداد الدفعات التعاقدية)                */}
        {/* ========================================================================= */}
        <div className="section-erp">
          <div className="section-title-erp">
            <span>جدول سداد الدفعات المالية المعتمد</span>
            <span className="en">Contractual Payment Milestones</span>
          </div>

          <div className="box-erp">
            <table className="spec-table-erp">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>المرحلة</th>
                  <th style={{ width: '12%' }}>النسبة</th>
                  <th style={{ width: '38%' }}>شروط وميعاد الاستحقاق</th>
                  <th style={{ width: '32%' }}>Payment Trigger</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center font-bold">الدفعة الأولى</td>
                  <td className="text-center font-bold text-blue-700">50%</td>
                  <td className="text-right font-medium">دفعة مقدمة تُسدد فور توقيع العقد واعتماد المخططات الهندسية لبدء التصنيع.</td>
                  <td className="text-left" dir="ltr">Advance payment upon contract signing and drawing approvals.</td>
                </tr>
                <tr>
                  <td className="text-center font-bold">الدفعة الثانية</td>
                  <td className="text-center font-bold text-blue-700">30%</td>
                  <td className="text-right font-medium">تُسدد فور توريد المواد والأبواب والمهمات لموقع المشروع.</td>
                  <td className="text-left" dir="ltr">Upon delivery of elevator materials and doors to site.</td>
                </tr>
                <tr>
                  <td className="text-center font-bold">الدفعة الثالثة</td>
                  <td className="text-center font-bold text-blue-700">15%</td>
                  <td className="text-right font-medium">تُسدد بعد تركيب الماكينة، السكك، وهيكل الكابينة الميكانيكي.</td>
                  <td className="text-left" dir="ltr">Upon mechanical installation of machine, rails, and car sling.</td>
                </tr>
                <tr>
                  <td className="text-center font-bold">الدفعة الرابعة</td>
                  <td className="text-center font-bold text-emerald-700">5%</td>
                  <td className="text-right font-medium">بعد فحص واختبار وتشغيل وتسليم المصعد جاهزاً للاستخدام وإصدار المحضر.</td>
                  <td className="text-left" dir="ltr">Final payment upon testing, commissioning, and official handover.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: WARRANTY, TIMELINE & FREE MAINTENANCE STATS                   */}
        {/* ========================================================================= */}
        <div className="section-erp">
          <div className="section-title-erp">
            <span>الضمان، الصيانة، ومدة التوريد</span>
            <span className="en">Warranty, Maintenance &amp; Supply Timeline</span>
          </div>

          <div className="box-erp">
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div className="stat-card-erp">
                <div className="stat-label-erp">مدة التوريد والتنفيذ</div>
                <div className="stat-value-erp accent">{supplyDurationDays} يوم عمل</div>
                <div className="text-[9px] text-slate-500 font-medium">Working Days Timeline</div>
              </div>

              <div className="stat-card-erp">
                <div className="stat-label-erp">ضمان ماكينة المصعد</div>
                <div className="stat-value-erp">10 سنوات</div>
                <div className="text-[9px] text-slate-500 font-medium">10-Year Machine Warranty</div>
              </div>

              <div className="stat-card-erp">
                <div className="stat-label-erp">الصيانة الوقائية المجانية</div>
                <div className="stat-value-erp accent">{warrantyYears} سنة مجانية</div>
                <div className="text-[9px] text-slate-500 font-medium">Free Preventive Maintenance</div>
              </div>
            </div>

            <div className="note-box-erp mb-0 text-[10.5px]">
              <strong>شروط الضمان:</strong> يشمل الضمان إصلاح أو استبدال أي قطعة تظهر بها عيوب تصنيعية خلال فترة الضمان، وتلتزم الشركة بإجراء زيارات صيانة دورية شهرية مجاناً لمدة عام كامل من تاريخ التسليم.
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6: CLIENT SCOPE & SITE PREPARATION (التزامات العميل)             */}
        {/* ========================================================================= */}
        <div className="section-erp">
          <div className="section-title-erp">
            <span>الأعمال المطلوبة والتجهيزات من طرف العميل</span>
            <span className="en">Client Scope &amp; Site Preparations</span>
          </div>

          <div className="box-erp">
            <table className="spec-table-erp">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>الأعمال المطلوبة من العميل</th>
                  <th style={{ width: '50%' }}>Required Works from Client</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-right">توفير مصدر تيار كهربائي مؤقت ومستديم 380 فولت 3 فاز 60 هرتز مع قاطع رئيسي في غرفة الآلات أو أعلى البئر.</td>
                  <td className="text-left" dir="ltr">Provision of temporary and permanent 3-phase power 380V/60Hz with circuit breaker.</td>
                </tr>
                <tr>
                  <td className="text-right">تجهيز بئر المصعد وعزل الحفرة السفلية ضد تسرب المياه طبقاً للأبعاد والرسومات الهندسية المعتمدة.</td>
                  <td className="text-left" dir="ltr">Shaft preparation and waterproofing of pit according to approved CAD drawings.</td>
                </tr>
                <tr>
                  <td className="text-right">توفير مخزن آمن ومغلق ومضاء بموقع المشروع لتخزين معدات ومهمات المصعد أثناء التركيب.</td>
                  <td className="text-left" dir="ltr">Provision of a lockable and lit storage space for elevator materials during installation.</td>
                </tr>
                <tr>
                  <td className="text-right">تجهيز فتحات الأبواب وتثبيت عتبات الأبواب وإنهاء اللياسة والتقفيل حول الأبواب بعد تثبيتها.</td>
                  <td className="text-left" dir="ltr">Opening preparation, threshold leveling, and finishing around doors after mounting.</td>
                </tr>
                <tr>
                  <td className="text-right">توفير خطاف تعليق (Hook) معتمد في سقف البئر أو غرفة الآلات يتحمل وزن الماكينة ومهمات الرفع.</td>
                  <td className="text-left" dir="ltr">Certified ceiling lifting hook in hoistway top or machine room for installation rigging.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Optional Notes */}
        {spec.notes && (
          <div className="section-erp">
            <div className="section-title-erp">
              <span>ملاحظات فنية خاصة</span>
              <span className="en">Special Technical Notes</span>
            </div>
            <div className="box-erp">
              <div className="note-box-erp mb-0 font-medium text-slate-800 leading-relaxed">
                {spec.notes}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 7: BILATERAL SIGNATURES & OFFICIAL SEALS (الاعتماد والتوقيعات)    */}
        {/* ========================================================================= */}
        <div className="section-erp">
          <div className="section-title-erp">
            <span>الاعتماد والتوقيعات الرسمية</span>
            <span className="en">Official Bilateral Signatures &amp; Corporate Seals</span>
          </div>

          <div className="box-erp">
            <div className={`grid ${spec.assignedSalesRepName ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
              {/* First Party (Company) */}
              <div className="signature-box-erp relative">
                <div className="font-extrabold text-xs" style={{ color: activeSettings.primaryColor }}>
                  الطرف الأول: {activeSettings.companyNameAr}
                </div>
                <div className="text-[10px] text-slate-500 font-medium" dir="ltr">
                  First Party: {activeSettings.companyNameEn}
                </div>
                <div className="signature-line-erp">
                  الختم والتوقيع الرسمي المعتمد / Official Seal
                </div>
                {/* Visual Stamp Graphic with dynamic company colors */}
                <div 
                  className="absolute top-8 left-6 w-16 h-16 border-2 rounded-full flex flex-col items-center justify-center rotate-[-12deg] opacity-75 pointer-events-none"
                  style={{ borderColor: activeSettings.accentColor }}
                >
                  <span className="text-[7px] font-black tracking-tighter" style={{ color: activeSettings.primaryColor }}>
                    APPROVED
                  </span>
                  <span className="text-[6px] font-bold" style={{ color: activeSettings.accentColor }}>
                    SEAL
                  </span>
                  <span className="text-[6px] font-mono text-slate-600">OFFICIAL</span>
                </div>
              </div>

              {/* Sales Representative (If assigned) */}
              {spec.assignedSalesRepName && (
                <div className="signature-box-erp">
                  <div className="font-extrabold text-emerald-900 text-xs">
                    إعداد المندوب: {spec.assignedSalesRepName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium" dir="ltr">
                    Sales Rep: {spec.assignedSalesRepPhone || 'Authorized'}
                  </div>
                  <div className="signature-line-erp">
                    توقيع المندوب المعتمد / Sales Rep Sign
                  </div>
                </div>
              )}

              {/* Second Party (Client) */}
              <div className="signature-box-erp">
                <div className="font-extrabold text-[#172033] text-xs">
                  الطرف الثاني: المكرم / {spec.clientName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium" dir="ltr">
                  Second Party: Client Acceptance &amp; Stamp
                </div>
                <div className="signature-line-erp">
                  توقيع المالك أو من ينوب عنه رسمياً
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info in print */}
        <div className="text-center text-[9px] text-slate-400 mt-4 pt-2 border-t border-slate-200">
          وثيقة رسمية صادرة من نظام Twins Lift Calc المعتمد &bull; شركة توينز تكنولوجي للمصاعد &bull; كود التحقق الرقمي المشفر (QR Ref): {spec.quoteRef || spec.id} &bull; تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}
        </div>
      </div>
      )}
    </div>
  );
};
