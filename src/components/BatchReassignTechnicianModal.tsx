import React, { useState } from 'react';
import { MaintenanceContract } from '../types/maintenance';
import { Employee } from '../types/employee';
import { AppLanguage } from '../utils/translations';
import { SearchableSelect } from './SearchableSelect';
import { 
  Users, 
  X, 
  ArrowLeftRight, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  MessageSquare
} from 'lucide-react';
import { sendWhatsAppMessage, buildTechnicianDispatchMessage } from '../services/whatsappService';

type VisitScheduleItem = {
  contract: MaintenanceContract;
  visit: any;
  isOverdue: boolean;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  visits: VisitScheduleItem[];
  contracts: MaintenanceContract[];
  employees: Employee[];
  language: AppLanguage;
  selectedMonthName: string;
  selectedYear: number;
  onBatchReassign: (
    updatedContracts: MaintenanceContract[], 
    countReassigned: number, 
    fromTechName: string, 
    toTechName: string
  ) => void;
}

export const BatchReassignTechnicianModal: React.FC<Props> = ({
  isOpen,
  onClose,
  visits,
  contracts,
  employees,
  language,
  selectedMonthName,
  selectedYear,
  onBatchReassign,
}) => {
  const isAr = language === 'ar';

  const [fromTechId, setFromTechId] = useState<string>('');
  const [toTechId, setToTechId] = useState<string>('');
  const [onlyPending, setOnlyPending] = useState<boolean>(true);
  const [notifyNewTech, setNotifyNewTech] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter visits eligible for reassign
  const matchingVisits = visits.filter(item => {
    const isTechMatch = fromTechId === 'UNASSIGNED' 
      ? !item.visit.assignedTechnicianId 
      : (item.visit.assignedTechnicianId === fromTechId);
    
    if (!isTechMatch) return false;
    if (onlyPending) {
      return item.visit.status !== 'Completed';
    }
    return true;
  });

  const fromEmp = employees.find(e => e.id === fromTechId);
  const toEmp = employees.find(e => e.id === toTechId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromTechId || !toTechId || fromTechId === toTechId) {
      alert(isAr ? 'الرجاء اختيار فنيين مختلفين للنقل' : 'Please select different technicians');
      return;
    }

    if (matchingVisits.length === 0) {
      alert(isAr ? 'لا توجد زيارات تطابق هذا الفني لنقلها' : 'No visits found to reassign');
      return;
    }

    setIsSubmitting(true);

    try {
      const targetVisitIds = new Set(matchingVisits.map(v => v.visit.id));
      const newTechName = toEmp?.name || '';
      const newTechPhone = toEmp?.phone || '';

      // Update all contracts containing these visits
      const updatedContracts = contracts.map(contract => {
        let hasChanges = false;
        const updatedVisits = contract.visits.map(v => {
          if (targetVisitIds.has(v.id)) {
            hasChanges = true;
            return {
              ...v,
              assignedTechnicianId: toTechId,
              technician: newTechName,
              technicianPhone: newTechPhone,
            };
          }
          return v;
        });

        if (hasChanges) {
          return {
            ...contract,
            visits: updatedVisits,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return contract;
      });

      // Send WhatsApp summary to new technician via API
      if (notifyNewTech && toEmp?.phone) {
        let summaryMsg = `مرحباً الفني المعتمد *${toEmp.name}* 👷‍♂️\n\n`;
        summaryMsg += `تم نقل وإسناد عدد *(${matchingVisits.length})* زيارة صيانة إليك لشهر *${selectedMonthName} ${selectedYear}*:\n\n`;
        matchingVisits.slice(0, 10).forEach((item, idx) => {
          summaryMsg += `${idx + 1}. *${item.visit.scheduledDate}* - ${item.contract.customerName} (${item.contract.elevatorName})\n`;
        });
        if (matchingVisits.length > 10) {
          summaryMsg += `... ومتبقي ${matchingVisits.length - 10} زيارة أخرى مسجلة بحسابك في التطبيق.\n`;
        }
        summaryMsg += `\nيرجى مراجعة جدولك عبر النظام والمتابعة الميدانية.`;

        await sendWhatsAppMessage({
          mobile_no: toEmp.phone,
          message: summaryMsg,
          priority: 'high',
          source: 'batch-reassign',
        });
      }

      onBatchReassign(
        updatedContracts,
        matchingVisits.length,
        fromEmp?.name || (isAr ? 'غير محدد' : 'Unassigned'),
        toEmp?.name || ''
      );

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err?.message || (isAr ? 'حدث خطأ أثناء نقل الزيارات' : 'Failed to reassign visits'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
              <ArrowLeftRight className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                {isAr ? 'نقل وإعادة توزيع زيارات الصيانة' : 'Batch Reassign Maintenance Visits'}
              </h3>
              <p className="text-xs text-purple-200/80">
                {isAr ? `نقل زيارات شهر ${selectedMonthName} ${selectedYear} من فني إلى فني آخر دفعة واحدة` : `Transfer visits from one technician to another in batch`}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* From Technician */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {isAr ? 'نقل الزيارات الموكلة حالياً إلى:' : 'Transfer visits currently assigned to:'}
            </label>
            <SearchableSelect
              value={fromTechId}
              onChange={(e) => setFromTechId(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-bold"
              required
            >
              <option value="">{isAr ? '-- اختر الفني المصدر --' : '-- Select Source Technician --'}</option>
              <option value="UNASSIGNED">{isAr ? '⚠️ زيارات غير معينة لأي فني' : '⚠️ Unassigned visits'}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </SearchableSelect>
          </div>

          {/* To Technician */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {isAr ? 'إسنادها ونقلها إلى الفني الجديد:' : 'Assign to New Technician:'}
            </label>
            <SearchableSelect
              value={toTechId}
              onChange={(e) => setToTechId(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 border border-purple-300 rounded-xl bg-purple-50/40 font-bold text-purple-950"
              required
            >
              <option value="">{isAr ? '-- اختر الفني البديل المستلم --' : '-- Select Target Technician --'}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} {emp.phone ? `(${emp.phone})` : ''}</option>
              ))}
            </SearchableSelect>
          </div>

          {/* Scope & Status Filter */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(e) => setOnlyPending(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span className="font-bold text-xs text-slate-800">
                {isAr ? 'نقل الزيارات غير المكتملة والمجدولة فقط (استثناء الزيارات المنجزة)' : 'Only pending / scheduled visits (skip completed)'}
              </span>
            </label>

            {fromTechId && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">{isAr ? 'عدد الزيارات المؤهلة للنقل:' : 'Visits to transfer:'}</span>
                <span className="font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full font-mono text-sm">
                  {matchingVisits.length} {isAr ? 'زيارة' : 'visits'}
                </span>
              </div>
            )}
          </div>

          {/* WhatsApp Notification */}
          <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyNewTech}
                onChange={(e) => setNotifyNewTech(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'إرسال جدول الزيارات المنقولة للفني الجديد عبر واتساب (API)' : 'Send WhatsApp summary to new technician'}</span>
              </span>
            </label>
            <p className="text-[11px] text-slate-500 ps-6">
              {toEmp?.phone 
                ? `${isAr ? 'سيتم إرسال كشف الزيارات لرقم:' : 'Will notify:'} ${toEmp.phone}` 
                : (isAr ? 'تنبيه: اختر فني لديه رقم هاتف مسجل' : 'No phone')}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !fromTechId || !toTechId || matchingVisits.length === 0}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-300 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري النقل والإرسال...' : 'Transferring...'}</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>{isAr ? `تأكيد نقل (${matchingVisits.length}) زيارة` : `Confirm Transfer (${matchingVisits.length})`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
