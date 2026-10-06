import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building, 
  User, 
  Wrench, 
  Check, 
  AlertOctagon,
  Camera,
  Layers,
  Phone,
  QrCode
} from 'lucide-react';
import { Sbc801InspectionReport } from '../types/inspection';
import { TwinsLogo } from './TwinsLogo';
import { generateCustomQRDataUrl } from '../utils/qrCodeGenerator';

interface Sbc801InspectionCertificateModalProps {
  report: Sbc801InspectionReport;
  onClose: () => void;
  isAr?: boolean;
}

export const Sbc801InspectionCertificateModal: React.FC<Sbc801InspectionCertificateModalProps> = ({
  report,
  onClose,
  isAr = true,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    generateCustomQRDataUrl(`https://twins4tech.com/inspection/${report.reportNumber}`).then(setQrCodeUrl);
  }, [report.reportNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = isAr
      ? `تقرير الفحص الدوري المعتمد لمصعد (${report.elevatorName}) وفق كود المصاعد السعودي SBC 801:\nرقم التقرير: ${report.reportNumber}\nالنتيجة العامة: ${report.overallResult === 'APPROVED' ? 'معتمد ومطابق' : report.overallResult === 'CONDITIONAL' ? 'مطابق بشروط وملاحظات' : 'يحتاج معالجة فورية'}\nنسبة السلامة: ${report.scorePercentage}%\nتاريخ الفحص: ${report.inspectionDate}`
      : `SBC 801 Elevator Inspection Certificate for ${report.elevatorName}\nReport #${report.reportNumber}\nScore: ${report.scorePercentage}%\nStatus: ${report.overallResult}`;
    
    const phone = report.customerPhone?.replace(/\D/g, '') || '';
    const url = phone 
      ? `https://wa.me/${phone.startsWith('966') ? phone : `966${phone.replace(/^0/, '')}`}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const allPhotos = report.checkpoints.flatMap((c) => c.photos);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] my-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Top Actions Bar (No Print) */}
        <div className="no-print p-3 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black tracking-wide">
              {isAr ? 'شهادة الفحص الدوري المعتمد (كود البناء والمصاعد SBC 801)' : 'SBC 801 Elevator Inspection Certificate'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مشاركة واتساب' : 'WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة التقرير / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-0 print:overflow-visible">
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5">
            <div className="flex items-center gap-3">
              <TwinsLogo className="w-14 h-14" />
              <div>
                <h1 className="text-lg font-black text-slate-900">شركة مصاعد التوأم للتجارة والمقاولات</h1>
                <p className="text-xs text-slate-500 font-semibold">Twins Lift Co. - إدارة الصيانة والسلامة الهندسية</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-900 border border-blue-200">
                    كود البناء والمصاعد السعودي SBC 801
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    #{report.reportNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left rtl:text-left ltr:text-right flex items-center gap-4">
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800">{isAr ? 'تاريخ الفحص:' : 'Date:'} {report.inspectionDate}</p>
                <p className="text-xs text-slate-500 font-mono">{report.inspectionTime}</p>
                <p className="text-[11px] text-emerald-700 font-bold mt-1">
                  {report.isSynced ? (isAr ? '✓ معتمد بالسيرفر' : '✓ Synced') : (isAr ? 'تم الحفظ ميدانياً (Offline)' : 'Offline Saved')}
                </p>
              </div>
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt={`QR #${report.reportNumber}`}
                    className="w-16 h-16 rounded-lg border border-slate-200 p-0.5 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">{isAr ? 'اسم المبنى / الموقع:' : 'Building / Site:'}</span>
              <span className="font-bold text-slate-800">{report.buildingName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{isAr ? 'معرّف المصعد:' : 'Elevator ID:'}</span>
              <span className="font-bold text-slate-800">{report.elevatorName} ({report.elevatorId})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{isAr ? 'العميل / المشرف:' : 'Client:'}</span>
              <span className="font-bold text-slate-800">{report.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{isAr ? 'الفني الفاحص:' : 'Inspector:'}</span>
              <span className="font-bold text-slate-800">{report.technicianName}</span>
            </div>
          </div>

          {/* Score & Evaluation Meter */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-4 ${
            report.overallResult === 'APPROVED' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : report.overallResult === 'CONDITIONAL'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white ${
                report.overallResult === 'APPROVED' ? 'bg-emerald-600' : report.overallResult === 'CONDITIONAL' ? 'bg-amber-600' : 'bg-rose-600'
              }`}>
                {report.scorePercentage}%
              </div>
              <div>
                <h4 className="text-sm font-black">
                  {report.overallResult === 'APPROVED' && (isAr ? 'المصعد آمن ومعتمد ومطابق لاشتراطات كود SBC 801' : 'Elevator Approved & Code Compliant')}
                  {report.overallResult === 'CONDITIONAL' && (isAr ? 'مطابق مع وجود ملاحظات تشغيلية تتطلب معالجة' : 'Conditional Approval - Minor Items Require Attention')}
                  {report.overallResult === 'FAILED' && (isAr ? 'خطر - وجود عيوب حرجة تستوجب إيقاف المصعد فوراً' : 'FAILED - Critical Defects Detected')}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  {isAr 
                    ? `تم فحص كافة بنود الأمان الـ 24 المعتمدة. عدد الملاحظات الحرجة: ${report.criticalDefectsCount}` 
                    : `Evaluated all 24 SBC 801 safety checkpoints. Critical defects: ${report.criticalDefectsCount}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white shadow-2xs border border-current">
                {report.overallResult === 'APPROVED' ? (isAr ? 'شهادة سارية' : 'Valid') : (isAr ? 'متابعة مطلوبة' : 'Action Required')}
              </span>
            </div>
          </div>

          {/* Detailed 24 Checkpoints Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'تفاصيل فحص الـ 24 بنداً وفق الكود السعودي SBC 801:' : 'SBC 801 24-Point Inspection Details:'}</span>
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-16">الكود</th>
                    <th className="py-2.5 px-3">بند الفحص والسلامة</th>
                    <th className="py-2.5 px-3 w-32 text-center">المرجع بالكود</th>
                    <th className="py-2.5 px-3 w-28 text-center">الحالة</th>
                    <th className="py-2.5 px-3">الملاحظات والإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.checkpoints.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 font-mono font-bold text-slate-500 text-[11px]">{item.code}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          {item.titleAr}
                          {item.isCritical && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">حرج</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.descriptionAr}</div>
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[10px] text-slate-500">{item.standardReference}</td>
                      <td className="py-2 px-3 text-center">
                        {item.status === 'PASS' && (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>سليم</span>
                          </span>
                        )}
                        {item.status === 'ATTENTION' && (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>متابعة</span>
                          </span>
                        )}
                        {item.status === 'DEFECT' && (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200 flex items-center justify-center gap-1">
                            <AlertOctagon className="w-3 h-3 text-rose-600" />
                            <span>معيب / خطر</span>
                          </span>
                        )}
                        {item.status === 'NA' && (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            غير مطبق
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {item.notes || <span className="text-slate-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attached Evidence Photos */}
          {allPhotos.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'الصور الميدانية الموثقة للأعطال والقطع التالفة:' : 'Field Photo Evidence:'}</span>
                <span className="text-slate-400 font-mono text-[11px]">({allPhotos.length} صورة)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {allPhotos.map((photo) => (
                  <div key={photo.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    <img src={photo.dataUrl} alt={photo.caption} className="w-full h-28 object-cover" />
                    <div className="p-2 text-[10px] bg-white border-t border-slate-100">
                      <p className="font-bold text-slate-800 truncate">{photo.caption}</p>
                      <p className="text-slate-400 font-mono">{photo.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spare Parts Recommendation */}
          {report.sparePartsRecommended && report.sparePartsRecommended.length > 0 && (
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2 text-xs">
              <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-700" />
                <span>{isAr ? 'قطع الغيار الموصى باستبدالها (سند طلب صرف القطع):' : 'Recommended Replacement Parts:'}</span>
              </h4>
              <div className="space-y-1">
                {report.sparePartsRecommended.map((part, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-100 text-xs">
                    <span className="font-bold text-slate-800">{part.partName}</span>
                    <span className="text-slate-500 font-mono">الكمية: {part.quantity}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      part.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {part.urgency === 'HIGH' ? 'عاجل جداً' : 'متوسط'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Notes */}
          {report.generalNotes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">{isAr ? 'توصيات وملاحظات الفاحص الهندسية:' : 'Engineering Notes:'}</span>
              <p>{report.generalNotes}</p>
            </div>
          )}

          {/* Signatures Section */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900 text-xs">
            {/* Technician Signature */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block">{isAr ? 'اعتماد المهندس / الفني الفاحص:' : 'Technician Signature:'}</span>
              <p className="text-slate-600">{report.technicianName}</p>
              {report.technicianSignature ? (
                <div className="h-16 flex items-center justify-center bg-white rounded-lg border border-slate-200">
                  <img src={report.technicianSignature} alt="Technician Signature" className="max-h-14 max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-16 flex items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                  {isAr ? 'معتمد إلكترونياً' : 'E-Verified'}
                </div>
              )}
            </div>

            {/* Customer Signature */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block">{isAr ? 'توقيع واستلام العميل / مسؤول الموقع:' : 'Client Sign-Off:'}</span>
              <p className="text-slate-600">{report.customerRepresentativeName || report.customerName}</p>
              {report.customerSignature ? (
                <div className="h-16 flex items-center justify-center bg-white rounded-lg border border-slate-200">
                  <img src={report.customerSignature} alt="Customer Signature" className="max-h-14 max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-16 flex items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                  {isAr ? 'لم يتم التوقيع' : 'No Signature'}
                </div>
              )}
            </div>
          </div>

          {/* Footer Official Seal */}
          <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
            <span>منظومة مصاعد التوأم Twins Lift Manager • تم الإصدار وفق كود SBC 801</span>
            <span>الرياض - المملكة العربية السعودية • هاتف الطوارئ: 0551717838</span>
          </div>
        </div>
      </div>
    </div>
  );
};
