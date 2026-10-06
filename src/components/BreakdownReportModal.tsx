import React, { useRef } from 'react';
import { MaintenanceBreakdown } from '../types/maintenance';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Wrench, 
  FileText, 
  ShieldCheck, 
  MessageSquare,
  Building2,
  DollarSign,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { SendWhatsAppModal } from './SendWhatsAppModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  breakdown: MaintenanceBreakdown | null;
  companySettings?: CompanySettings;
  language: AppLanguage;
  onOpenWhatsApp?: (phone: string, message: string, recipientName: string) => void;
}

export const BreakdownReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  breakdown,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  language,
  onOpenWhatsApp,
}) => {
  const isAr = language === 'ar';
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !breakdown) return null;

  const handlePrint = () => {
    window.print();
  };

  const isContractCustomer = breakdown.customerType !== 'ONE_TIME';
  const customerTypeLabel = isContractCustomer 
    ? (isAr ? 'عقد صيانة ساري ومشمول بالضمان' : 'Active Maintenance Contract')
    : (isAr ? 'إصلاح عطل لمرة واحدة (بدون عقد)' : 'One-Time Emergency Repair');

  const reportDateFormatted = new Date(breakdown.reportedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const resolvedDateFormatted = breakdown.resolvedAt 
    ? new Date(breakdown.resolvedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : (isAr ? 'قيد المتابعة والإصلاح' : 'In Progress');

  // Summary message for WhatsApp
  const waSummary = `*تقرير إصلاح عطل طارئ للمصعد* 🛠️\n` +
    `▫️ *رقم البلاغ:* ${breakdown.id}\n` +
    `▫️ *العميل:* ${breakdown.customerName}\n` +
    `▫️ *نوع الخدمة:* ${customerTypeLabel}\n` +
    `▫️ *المصعد:* ${breakdown.elevatorName}\n` +
    `▫️ *الموقع:* ${breakdown.siteLocation}\n` +
    `▫️ *الحالة:* ${breakdown.isResolved ? 'تم الإصلاح بنجاح ✅' : 'قيد المعالجة والإصلاح ⏳'}\n` +
    (breakdown.assignedTechnicianName ? `▫️ *الفني المسؤول:* ${breakdown.assignedTechnicianName}\n` : '') +
    (breakdown.technicianNotes ? `▫️ *ملاحظات الفحص:* ${breakdown.technicianNotes}\n` : '') +
    (breakdown.cost ? `▫️ *قيمة الإصلاح:* ${breakdown.cost} ر.س\n` : '') +
    `\nشاكرين ثقتكم بنا.\n*${companySettings?.companyNameAr || 'شركة توينز للمصاعد'}* 🏢`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Action Bar (hidden in print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {isAr ? 'تقرير وأمر عمل إصلاح العطل' : 'Breakdown & Repair Report'}
            </h3>
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {breakdown.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWhatsApp && breakdown.customerPhone && (
              <button
                type="button"
                onClick={() => onOpenWhatsApp(breakdown.customerPhone || '', waSummary, breakdown.customerName)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                title={isAr ? 'إرسال ملخص التقرير للعميل عبر واتساب (API)' : 'Send to Customer via WhatsApp'}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'إرسال واتساب' : 'WhatsApp'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Sheet Content */}
        <div className="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible space-y-6 text-slate-800" ref={printContentRef}>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950">
                {companySettings?.companyNameAr || 'شركة توينز للمصاعد والسلالم الكهربائية'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr ? 'قسم الصيانة الوقائية وخدمة الطوارئ الميدانية' : 'Preventive Maintenance & Emergency Service'}
              </p>
              <div className="text-[11px] text-slate-500 mt-1 space-y-0.5 font-mono">
                {companySettings?.phone && <div>{isAr ? 'هاتف:' : 'Tel:'} {companySettings.phone}</div>}
                {companySettings?.vatNumber && <div>{isAr ? 'الرقم الضريبي:' : 'VAT No:'} {companySettings.vatNumber}</div>}
              </div>
            </div>

            <div className="text-end">
              <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 font-black text-xs rounded-md border border-rose-200 uppercase">
                {isAr ? 'تقرير إصلاح عطل طارئ' : 'Emergency Repair Report'}
              </span>
              <div className="text-xs font-mono font-bold text-slate-900 mt-2">
                REF: {breakdown.id}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </div>
            </div>
          </div>

          {/* Customer Type & Priority Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                {isAr ? 'نوع العميل والخدمة' : 'Customer & Service Type'}
              </span>
              <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                <span className={`w-2.5 h-2.5 rounded-full ${isContractCustomer ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className={isContractCustomer ? 'text-emerald-700' : 'text-amber-700'}>
                  {customerTypeLabel}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                {isAr ? 'درجة الخطورة والأولوية' : 'Priority Level'}
              </span>
              <div className="font-bold text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-black text-rose-700">
                  {breakdown.priority === 'Emergency' ? (isAr ? 'طوارئ قصوى (حرجة)' : 'Emergency') :
                   breakdown.priority === 'High' ? (isAr ? 'عالية الأولوية' : 'High') :
                   breakdown.priority === 'Medium' ? (isAr ? 'متوسطة' : 'Medium') : (isAr ? 'عادية' : 'Normal')}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                {isAr ? 'حالة البلاغ الحالية' : 'Repair Status'}
              </span>
              <div className="font-bold text-xs flex items-center gap-1.5">
                {breakdown.isResolved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-black">{isAr ? 'تم الإصلاح وتشغيل المصعد' : 'Resolved'}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-700 font-black">{isAr ? 'قيد العمل والمتابعة' : 'In Progress'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Elevator Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-white">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'بيانات العميل والموقع' : 'Client & Site'}</span>
              </h4>
              <div className="text-sm font-black text-slate-900">{breakdown.customerName}</div>
              {breakdown.customerPhone && (
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span dir="ltr">{breakdown.customerPhone}</span>
                </div>
              )}
              <div className="text-xs text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                <span>{breakdown.siteLocation}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'بيانات المصعد والفني المسؤول' : 'Elevator & Technician'}</span>
              </h4>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>{breakdown.elevatorName}</span>
                {breakdown.elevatorNumber && (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200" title={isAr ? 'رقم كود المصعد' : 'Elevator Unit Code'}>
                    {breakdown.elevatorNumber}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-semibold">{isAr ? 'الفني المعين:' : 'Technician:'} </span>
                <span className="font-bold text-purple-900">{breakdown.assignedTechnicianName || (isAr ? 'غير محدد' : 'Unassigned')}</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                <span>{isAr ? 'تاريخ البلاغ:' : 'Reported:'} </span>
                <span>{reportDateFormatted}</span>
              </div>
            </div>
          </div>

          {/* Fault Description */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>{isAr ? 'وصف العطل كما ورد في البلاغ:' : 'Reported Fault Description:'}</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
              {breakdown.description}
            </p>
          </div>

          {/* Actions Taken & Diagnosis */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'الإجراءات الفنية المنفذة والتشخيص الميداني:' : 'Technical Actions Taken & Diagnosis:'}</span>
            </h4>
            
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[60px]">
              {breakdown.workPerformed || breakdown.technicianNotes || (
                isAr 
                  ? 'تم فحص لوحة التحكم الرئيسية ومحرك الأبواب ومكابح الأمان وضمان سلامة التشغيل وفق اشتراطات الكود السعودي.' 
                  : 'Inspected main controller, door drive, safety circuits and tested operations.'
              )}
            </div>

            {/* Spare Parts if any */}
            {breakdown.partsRequired && (
              <div className="text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                <span className="font-bold">{isAr ? 'قطع الغيار المستبدلة / المطلوبة: ' : 'Parts: '}</span>
                <span>{breakdown.partsRequired}</span>
              </div>
            )}

            {/* Cost if One-time repair */}
            {Boolean(breakdown.cost) && (
              <div className="flex items-center justify-between text-xs bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-950 font-bold">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'تكلفة وأتعاب الإصلاح لمرة واحدة:' : 'One-Time Repair Cost:'}</span>
                </span>
                <span className="text-base font-black font-mono">{breakdown.cost} {isAr ? 'ريال سعودي' : 'SAR'}</span>
              </div>
            )}
          </div>

          {/* Photo Documentation Section (Before & After & Damaged Parts) */}
          {((breakdown.beforePhotos && breakdown.beforePhotos.length > 0) || (breakdown.afterPhotos && breakdown.afterPhotos.length > 0)) && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'التوثيق المصور الميداني للقطع والعطل:' : 'Field Photographic Evidence:'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Before Photos */}
                {breakdown.beforePhotos && breakdown.beforePhotos.length > 0 && (
                  <div className="space-y-1.5 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-900 block">
                      {isAr ? '📷 صور العطل والقطع التالفة (قبل الإصلاح):' : 'Before Repair:'}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {breakdown.beforePhotos.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-amber-300 shadow-2xs">
                          <img src={img} alt="Before" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* After Photos */}
                {breakdown.afterPhotos && breakdown.afterPhotos.length > 0 && (
                  <div className="space-y-1.5 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      {isAr ? '📷 صور ما بعد الإصلاح واستبدال القطع:' : 'After Repair:'}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {breakdown.afterPhotos.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-emerald-300 shadow-2xs">
                          <img src={img} alt="After" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Linked Damaged Parts Disbursement Vouchers (Requisitions) */}
          {breakdown.partsVouchers && breakdown.partsVouchers.length > 0 && (
            <div className="border border-amber-300 rounded-xl p-4 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-700" />
                  <span>{isAr ? 'سندات صرف وحصر قطع الغيار التالفة المرفقة:' : 'Requisition Vouchers for Damaged Parts:'}</span>
                </h4>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  {isAr ? `${breakdown.partsVouchers.length} سند موثق` : `${breakdown.partsVouchers.length} Vouchers`}
                </span>
              </div>

              <div className="space-y-2">
                {breakdown.partsVouchers.map((vch) => (
                  <div key={vch.id} className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 text-[10px]">
                          #{vch.voucherNumber}
                        </span>
                        <span className="text-slate-500 text-[10px]">{vch.requestDate}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {isAr ? 'موجه للمستودع والصرف' : 'Dispatched to Warehouse'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {vch.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          {item.photoUrl && (
                            <img src={item.photoUrl} alt={item.partName} className="w-12 h-12 object-cover rounded-md border border-slate-300 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 text-[11px] truncate">{item.partName}</div>
                            <div className="text-[10px] text-slate-500">
                              {isAr ? `الكمية: ${item.quantity} • السبب: ${item.damageReason}` : `Qty: ${item.quantity} • Reason: ${item.damageReason}`}
                            </div>
                            <div className="text-[9px] font-bold text-amber-700">
                              {item.urgency === 'EMERGENCY' ? (isAr ? '🚨 طارئ جداً' : 'Emergency') : (isAr ? 'أولوية عاجلة' : 'High Urgency')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Status & Signatures Box */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 bg-white space-y-6">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
              <span className="font-bold text-slate-700">
                {isAr ? 'حالة المصعد بعد التدخل الفني:' : 'Final Elevator Condition:'}
              </span>
              <span className="font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                {breakdown.isResolved 
                  ? (isAr ? '✓ جاهز ويعمل بكفاءة وأمان تام' : 'Operational & Certified') 
                  : (isAr ? 'قيد العمل والمتابعة الفنية' : 'In Progress')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">
                  {isAr ? 'الفني المختص المنفذ للعملية' : 'Technician Signature'}
                </span>
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 h-20 flex items-center justify-center font-bold text-slate-900">
                  {breakdown.assignedTechnicianName || (isAr ? 'فني الطوارئ المعتمد' : 'Certified Tech')}
                </div>
                <div className="text-[10px] text-slate-400">{isAr ? 'التوقيع والاعتماد الفني' : 'Signature & Date'}</div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">
                  {isAr ? 'استلام واعتماد العميل / مسؤول الموقع' : 'Customer Acceptance'}
                </span>
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 h-20 flex items-center justify-center">
                  {breakdown.clientSignatureDataUrl ? (
                    <img src={breakdown.clientSignatureDataUrl} alt="Client Signature" className="max-h-16 max-w-full object-contain" />
                  ) : (
                    <span className="font-bold text-slate-900 text-xs">{breakdown.customerName}</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">{isAr ? 'التوقيع وختم الاستلام الحي' : 'Signature & Stamp'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
