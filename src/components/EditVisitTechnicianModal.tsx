import React, { useState, useEffect } from 'react';
import { MaintenanceContract, MaintenanceVisit } from '../types/maintenance';
import { Employee } from '../types/employee';
import { AppLanguage } from '../utils/translations';
import { CompanySettings } from '../types/settings';
import { SearchableSelect } from './SearchableSelect';
import { 
  UserCheck, 
  X, 
  Send, 
  MessageSquare, 
  Building2, 
  MapPin, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Info,
  ExternalLink,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { 
  sendWhatsAppMessage, 
  buildTechnicianDispatchMessage, 
  buildVisitScheduledMessage,
  generateWaMeUrl 
} from '../services/whatsappService';

export type VisitItemTarget = {
  contract: MaintenanceContract;
  visit: MaintenanceVisit;
  isOverdue: boolean;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  visitItem: VisitItemTarget | null;
  employees: Employee[];
  language: AppLanguage;
  companySettings?: CompanySettings;
  onSave: (
    item: VisitItemTarget, 
    newTechId: string, 
    instructions?: string,
    onSuccessCallback?: (msg: string) => void
  ) => void;
}

export const EditVisitTechnicianModal: React.FC<Props> = ({
  isOpen,
  onClose,
  visitItem,
  employees,
  language,
  companySettings,
  onSave,
}) => {
  const isAr = language === 'ar';
  
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [sendWhatsAppToTech, setSendWhatsAppToTech] = useState<boolean>(true);
  const [sendWhatsAppToCustomer, setSendWhatsAppToCustomer] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{ success: boolean; text: string; url?: string } | null>(null);

  useEffect(() => {
    if (visitItem) {
      setSelectedTechId(visitItem.visit.assignedTechnicianId || visitItem.contract.assignedTechnicianId || '');
      setInstructions('');
      setSendWhatsAppToTech(true);
      setSendWhatsAppToCustomer(false);
      setStatusFeedback(null);
    }
  }, [visitItem, isOpen]);

  if (!isOpen || !visitItem) return null;

  const currentEmp = employees.find(e => e.id === visitItem.visit.assignedTechnicianId);
  const selectedEmp = employees.find(e => e.id === selectedTechId);

  // Preview generated WhatsApp dispatch message
  const previewTechMsg = selectedEmp ? buildTechnicianDispatchMessage({
    technicianName: selectedEmp.name,
    customerName: visitItem.contract.customerName,
    customerPhone: visitItem.contract.customerPhone,
    elevatorName: visitItem.contract.elevatorName,
    siteLocation: visitItem.contract.siteLocation,
    scheduledDate: visitItem.visit.scheduledDate,
    notes: instructions || visitItem.visit.monthLabel,
    isReassigned: Boolean(visitItem.visit.assignedTechnicianId && visitItem.visit.assignedTechnicianId !== selectedTechId),
  }) : '';

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) {
      alert(isAr ? 'الرجاء اختيار الفني' : 'Please select a technician');
      return;
    }

    setIsSubmitting(true);
    setStatusFeedback(null);

    try {
      // 1. Send WhatsApp to Technician via API if enabled and has phone
      let waTechSuccess = false;
      let waError = '';
      if (sendWhatsAppToTech && selectedEmp && selectedEmp.phone) {
        const payload = {
          mobile_no: selectedEmp.phone,
          message: previewTechMsg,
          priority: 'high' as const,
          source: 'technician-assignment',
        };
        const waRes = await sendWhatsAppMessage(payload);
        waTechSuccess = waRes.success;
        if (!waRes.success) {
          waError = waRes.error || (isAr ? 'فشل إرسال واتساب الفني' : 'Failed to send WhatsApp');
        }
      }

      // 2. Send WhatsApp to Customer if enabled
      if (sendWhatsAppToCustomer && visitItem.contract.customerPhone) {
        const custMsg = buildVisitScheduledMessage({
          customerName: visitItem.contract.customerName,
          elevatorName: visitItem.contract.elevatorName,
          scheduledDate: visitItem.visit.scheduledDate,
          siteLocation: visitItem.contract.siteLocation,
          technicianName: selectedEmp?.name,
          technicianPhone: selectedEmp?.phone,
          companyName: companySettings?.companyNameAr || 'شركة توينز للمصاعد',
        });
        await sendWhatsAppMessage({
          mobile_no: visitItem.contract.customerPhone,
          message: custMsg,
          priority: 'normal',
          source: 'customer-notice',
        });
      }

      // 3. Save to system
      onSave(visitItem, selectedTechId, instructions, (successMsg) => {
        let finalFeedback = successMsg;
        if (sendWhatsAppToTech && selectedEmp?.phone) {
          if (waTechSuccess) {
            finalFeedback += isAr ? ' وتم إرسال تفاصيل المهمة للفني عبر واتساب (API) بنجاح ✅' : ' and WhatsApp sent to technician ✅';
          } else if (waError) {
            finalFeedback += isAr ? ` (تنبيه: تعذر إرسال الواتساب: ${waError})` : ` (WhatsApp error: ${waError})`;
          }
        }
        setIsSubmitting(false);
        onClose();
      });

    } catch (err: any) {
      setIsSubmitting(false);
      setStatusFeedback({
        success: false,
        text: err?.message || (isAr ? 'حدث خطأ أثناء حفظ التعديل' : 'Failed to save changes'),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
              <UserCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                {isAr ? 'تعديل الفني المسؤول عن زيارة الصيانة' : 'Edit Visit Technician'}
              </h3>
              <p className="text-xs text-purple-200/80">
                {isAr ? 'تحديد أو تغيير فني الصيانة للزيارة مع إمكانية إرسال إشعار فوري عبر واتساب API' : 'Assign or reassign technician with instant WhatsApp API notification'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirm} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Visit Information Card */}
          <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200/80 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {visitItem.visit.monthLabel}
                </span>
                <div className="font-black text-slate-900 text-sm sm:text-base mt-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{visitItem.contract.customerName}</span>
                </div>
              </div>

              <div className="text-end">
                <div className="text-[11px] text-slate-500">{isAr ? 'تاريخ الزيارة:' : 'Date:'}</div>
                <div className="font-bold text-slate-900 font-mono flex items-center gap-1 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>{visitItem.visit.scheduledDate}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-purple-100 text-xs">
              <div className="text-slate-600 flex items-center gap-1 truncate">
                <span className="font-semibold text-slate-700">{isAr ? 'المصعد:' : 'Elevator:'}</span>
                <span className="font-bold text-slate-900 truncate">{visitItem.contract.elevatorName}</span>
              </div>
              {visitItem.contract.siteLocation && (
                <div className="text-slate-600 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{visitItem.contract.siteLocation}</span>
                </div>
              )}
            </div>

            {/* Current Assigned Technician Banner */}
            <div className="mt-2 pt-2 border-t border-purple-100/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">{isAr ? 'الفني المعين حالياً:' : 'Current Tech:'}</span>
              <span className="font-bold text-purple-900 bg-white px-2.5 py-0.5 rounded-md border border-purple-200">
                {currentEmp ? currentEmp.name : (visitItem.visit.technician || (isAr ? 'غير محدد' : 'Unassigned'))}
              </span>
            </div>
          </div>

          {/* Select New Technician */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-purple-600" />
                <span>{isAr ? 'اختر الفني الجديد للزيارة *' : 'Select New Technician *'}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {employees.length} {isAr ? 'فني مسجل بالنظام' : 'registered'}
              </span>
            </label>

            <SearchableSelect
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">{isAr ? '-- اختر فني الصيانة --' : '-- Select Technician --'}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.phone ? `(${emp.phone})` : ''} - {emp.role || (isAr ? 'فني صيانة' : 'Tech')}
                </option>
              ))}
            </SearchableSelect>

            {/* Selected Technician Card Preview */}
            {selectedEmp && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    {selectedEmp.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{selectedEmp.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{selectedEmp.phone || (isAr ? 'لا يوجد رقم هاتف' : 'No phone')}</div>
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {isAr ? 'فني معتمد' : 'Certified Tech'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Instructions for the Technician */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {isAr ? 'تعليمات أو ملاحظات خاصة للفني (اختياري):' : 'Special Instructions for Technician (Optional):'}
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={isAr ? 'مثال: التأكد من نظافة البئر وفحص حساسات الباب، التنسيق مع الحارس...' : 'e.g., Check door sensors, inspect gear oil...'}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* WhatsApp API Dispatch Options */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs sm:text-sm text-emerald-950">
                  {isAr ? 'خدمة إرسال إشعارات واتساب عبر API' : 'WhatsApp API Notifications'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-mono">
                API Active ✅
              </span>
            </div>

            {/* Checkbox: WhatsApp to Technician */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendWhatsAppToTech}
                onChange={(e) => setSendWhatsAppToTech(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div className="text-xs text-slate-700">
                <span className="font-bold text-slate-900">
                  {isAr ? 'إرسال إشعار فوري للفني عبر واتساب بمهمة الزيارة' : 'Send instant WhatsApp notice to technician'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedEmp?.phone 
                    ? `${isAr ? 'سيتم الإرسال للرقم:' : 'Will send to:'} ${selectedEmp.phone}` 
                    : (isAr ? '⚠️ الفني المختار ليس لديه رقم هاتف مسجل' : '⚠️ No phone registered for this tech')}
                </p>
              </div>
            </label>

            {/* Checkbox: WhatsApp to Customer */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendWhatsAppToCustomer}
                onChange={(e) => setSendWhatsAppToCustomer(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div className="text-xs text-slate-700">
                <span className="font-bold text-slate-900">
                  {isAr ? 'إشعار العميل بتكليف هذا الفني عبر واتساب أيضاً' : 'Also notify customer via WhatsApp'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {visitItem.contract.customerPhone 
                    ? `${isAr ? 'هاتف العميل:' : 'Customer phone:'} ${visitItem.contract.customerPhone}` 
                    : (isAr ? '⚠️ لا يوجد رقم هاتف للعميل' : 'No phone')}
                </p>
              </div>
            </label>

            {/* Live Message Preview Accordion */}
            {sendWhatsAppToTech && selectedEmp && previewTechMsg && (
              <details className="text-xs bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                <summary className="font-bold text-emerald-800 cursor-pointer flex items-center justify-between">
                  <span>{isAr ? '👁️ معاينة نص الرسالة التي ستُرسل للفني' : 'Preview WhatsApp Message'}</span>
                  <span className="text-[10px] text-slate-400">انقر للعرض</span>
                </summary>
                <div className="mt-2 p-2 bg-slate-50 rounded text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed border border-slate-200">
                  {previewTechMsg}
                </div>
              </details>
            )}
          </div>

          {/* Feedback banner if error */}
          {statusFeedback && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              statusFeedback.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {statusFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{statusFeedback.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedTechId}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-300 text-white text-xs font-black rounded-xl shadow-md shadow-purple-700/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري الحفظ والإرسال...' : 'Saving & Sending...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'حفظ وتعديل الفني' : 'Save & Assign Tech'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
