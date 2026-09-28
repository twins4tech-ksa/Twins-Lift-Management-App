import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  FileCheck2,
  Printer,
  Calendar,
  Clock,
  Building2,
  Save,
  CheckCheck
} from 'lucide-react';
import { 
  MaintenanceVisit, 
  MaintenanceVisitReview, 
  MaintenanceInspectionItem, 
  DEFAULT_INSPECTION_CHECKLIST,
  MaintenanceContract,
  VISIT_STATUS_CONFIG,
  MaintenanceVisitStatus
} from '../types/maintenance';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { TwinsLogo } from './TwinsLogo';
import { SearchableSelect } from './SearchableSelect';

interface MaintenanceVisitReviewModalProps {
  visit: MaintenanceVisit;
  contract: MaintenanceContract;
  companySettings: CompanySettings;
  language: AppLanguage;
  isOpen: boolean;
  onClose: () => void;
  onSaveReview: (visitId: string, updatedReview: MaintenanceVisitReview, newStatus: MaintenanceVisitStatus) => void;
}

export default function MaintenanceVisitReviewModal({
  visit,
  contract,
  companySettings,
  language,
  isOpen,
  onClose,
  onSaveReview,
}: MaintenanceVisitReviewModalProps) {
  const isAr = language === 'ar';

  // Initialize review state from existing review or default structure
  const [reviewState, setReviewState] = useState<MaintenanceVisitReview>(() => {
    if (visit.review) {
      return {
        ...visit.review,
        checklist: visit.review.checklist && visit.review.checklist.length > 0 
          ? visit.review.checklist 
          : DEFAULT_INSPECTION_CHECKLIST.map(item => ({ ...item, status: 'Pass' as const })),
      };
    }
    return {
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      scheduledDate: visit.scheduledDate,
      actualDate: new Date().toISOString().split('T')[0],
      technicianName: visit.technician || 'م. أحمد السعيد',
      technicianPhone: '+966 55 000 1122',
      status: visit.status === 'Completed' ? 'Completed' : 'Completed',
      elevatorCondition: 'Excellent',
      checklist: DEFAULT_INSPECTION_CHECKLIST.map(item => ({ ...item, status: 'Pass' as const })),
      workPerformed: 'إجراء فحص شامل لمنظومة المصعد، تنظيف الكابينة وحساسات الأبواب، تزييت سكك الكابينة، واختبار منظومة فرامل الطوارئ.',
      partsReplaced: 'لا توجد قطع غيار مستبدلة - الحالة جيدة',
      clientRepresentative: contract.customerName || 'مسؤول الموقع',
      clientFeedback: 'تم الفحص بنجاح والمصعد يعمل بكفاءة عالية وبدون أي أصوات أو اهتزازات.',
      clientSigned: true,
      technicianNotes: 'تمت الزيارة في الموعد المحدد واجتازت كافة الاختبارات المعيارية.',
      updatedAt: new Date().toISOString(),
    };
  });

  const [activeTab, setActiveTab] = useState<'FORM' | 'PRINT_VIEW'>('FORM');
  const [checklistFilter, setChecklistFilter] = useState<'ALL' | 'ATTENTION_FAIL'>('ALL');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleStatusChange = (status: MaintenanceVisitStatus) => {
    setReviewState(prev => ({ ...prev, status }));
  };

  const handleChecklistItemStatusChange = (itemId: string, status: 'Pass' | 'Attention' | 'Fail' | 'NA') => {
    setReviewState(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => item.id === itemId ? { ...item, status } : item)
    }));
  };

  const handleChecklistItemNotesChange = (itemId: string, notes: string) => {
    setReviewState(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => item.id === itemId ? { ...item, notes } : item)
    }));
  };

  const handleMarkAllPass = () => {
    setReviewState(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => ({ ...item, status: 'Pass' as const }))
    }));
  };

  const handleSave = () => {
    onSaveReview(visit.id, reviewState, reviewState.status);
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      onClose();
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredChecklist = reviewState.checklist.filter(item => {
    if (checklistFilter === 'ATTENTION_FAIL') {
      return item.status === 'Attention' || item.status === 'Fail';
    }
    return true;
  });

  const passCount = reviewState.checklist.filter(c => c.status === 'Pass').length;
  const attentionCount = reviewState.checklist.filter(c => c.status === 'Attention').length;
  const failCount = reviewState.checklist.filter(c => c.status === 'Fail').length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div 
        id="maintenance-review-modal-container"
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {isAr ? `مراجعة واعتماد تقرير الزيارة رقم #${visit.visitNumber}` : `Review & Certify Visit Report #${visit.visitNumber}`}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-400/30">
                  {contract.contractRef}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">
                {contract.title} • {contract.elevatorName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle print view or interactive form */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  activeTab === 'FORM'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isAr ? 'بيانات الفحص والتوثيق' : 'Inspection Checklist'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PRINT_VIEW')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  activeTab === 'PRINT_VIEW'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                {isAr ? 'معاينة سند الفحص الرسمي' : 'Official Report'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {activeTab === 'FORM' ? (
            <>
              {/* Status and Key Highlights Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Visit Status Selection */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    {isAr ? 'حالة الزيارة الفنية' : 'Visit Operational Status'}
                  </label>
                  <SearchableSelect
                    value={reviewState.status}
                    onChange={(e) => handleStatusChange(e.target.value as MaintenanceVisitStatus)}
                    className="w-full text-sm font-semibold p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Completed">{isAr ? 'منجزة وموثقة (Completed)' : 'Completed'}</option>
                    <option value="In_Progress">{isAr ? 'قيد التنفيذ (In Progress)' : 'In Progress'}</option>
                    <option value="Scheduled">{isAr ? 'مجدولة قادمة (Scheduled)' : 'Scheduled'}</option>
                    <option value="Pending">{isAr ? 'معلقة / مؤجلة (Pending)' : 'Pending'}</option>
                    <option value="Missed">{isAr ? 'فائتة / غير منجزة (Missed)' : 'Missed'}</option>
                  </SearchableSelect>
                </div>

                {/* Actual Inspection Date */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    {isAr ? 'تاريخ تنفيذ الفحص الفعلي' : 'Actual Execution Date'}
                  </label>
                  <input
                    type="date"
                    value={reviewState.actualDate || reviewState.scheduledDate}
                    onChange={(e) => setReviewState(prev => ({ ...prev, actualDate: e.target.value }))}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Technician Name */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {isAr ? 'اسم الفني المسؤول' : 'Lead Technician'}
                  </label>
                  <input
                    type="text"
                    value={reviewState.technicianName}
                    onChange={(e) => setReviewState(prev => ({ ...prev, technicianName: e.target.value }))}
                    className="w-full text-sm p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder="م. أحمد السعيد"
                  />
                </div>

                {/* Overall Elevator Condition */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {isAr ? 'الحالة العامة للمصعد' : 'Elevator Condition'}
                  </label>
                  <SearchableSelect
                    value={reviewState.elevatorCondition}
                    onChange={(e) => setReviewState(prev => ({ ...prev, elevatorCondition: e.target.value as any }))}
                    className="w-full text-sm font-semibold p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Excellent">{isAr ? 'ممتازة - خالي من الملاحظات' : 'Excellent - No Issues'}</option>
                    <option value="Good">{isAr ? 'جيدة - أداء طبيعي مستقر' : 'Good - Stable Operation'}</option>
                    <option value="Needs_Attention">{isAr ? 'تحتاج متابعة وتعديلات' : 'Needs Attention / Tuning'}</option>
                    <option value="Critical">{isAr ? 'حرجة - يتطلب إيقاف مؤقت' : 'Critical - Needs Shutdown'}</option>
                  </SearchableSelect>
                </div>
              </div>

              {/* Technical Inspection Checklist (10 Points) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-blue-600" />
                      {isAr ? 'قائمة الفحص الفني والوقائي المعتمدة (10 بنود)' : 'Certified Technical Inspection Checklist (10 Items)'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr 
                        ? 'فحص شامل لغرفة المحرك، أنظمة الأمان، حبال الجر، سكك الكابينة، وأبواب كل طابق'
                        : 'Comprehensive check of machine room, safeties, wire ropes, rails, and landing doors.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Filter buttons */}
                    <button
                      type="button"
                      onClick={() => setChecklistFilter('ALL')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        checklistFilter === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isAr ? `الكل (${reviewState.checklist.length})` : `All (${reviewState.checklist.length})`}
                    </button>
                    {(attentionCount > 0 || failCount > 0) && (
                      <button
                        type="button"
                        onClick={() => setChecklistFilter('ATTENTION_FAIL')}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          checklistFilter === 'ATTENTION_FAIL'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {isAr ? `الملاحظات (${attentionCount + failCount})` : `Issues (${attentionCount + failCount})`}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleMarkAllPass}
                      className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium rounded-md transition-colors flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {isAr ? 'اعتماد الكل كمطابق (Pass)' : 'Mark All Pass'}
                    </button>
                  </div>
                </div>

                {/* Score Pills */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isAr ? `مطابق: ${passCount}` : `Pass: ${passCount}`}
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {isAr ? `يحتاج متابعة: ${attentionCount}` : `Attention: ${attentionCount}`}
                  </span>
                  {failCount > 0 && (
                    <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      {isAr ? `غير مطابق: ${failCount}` : `Fail: ${failCount}`}
                    </span>
                  )}
                </div>

                {/* Checklist Rows */}
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                  {filteredChecklist.map((item, idx) => (
                    <div key={item.id} className="p-3.5 bg-white hover:bg-slate-50/80 transition-colors space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">
                              {item.categoryAr}
                            </span>
                            <p className="text-xs font-semibold text-slate-800 mt-1">
                              {isAr ? item.itemAr : item.itemEn}
                            </p>
                          </div>
                        </div>

                        {/* Pass / Attention / Fail buttons */}
                        <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleChecklistItemStatusChange(item.id, 'Pass')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                              item.status === 'Pass'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isAr ? 'مطابق' : 'Pass'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChecklistItemStatusChange(item.id, 'Attention')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                              item.status === 'Attention'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {isAr ? 'ملاحظة' : 'Attention'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChecklistItemStatusChange(item.id, 'Fail')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                              item.status === 'Fail'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {isAr ? 'خلل' : 'Fail'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChecklistItemStatusChange(item.id, 'NA')}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              item.status === 'NA'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="غير منطبق"
                          >
                            {isAr ? 'غ.م' : 'N/A'}
                          </button>
                        </div>
                      </div>

                      {/* Note for items with attention or failure */}
                      {(item.status === 'Attention' || item.status === 'Fail' || item.notes) && (
                        <div className="pt-1.5">
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleChecklistItemNotesChange(item.id, e.target.value)}
                            placeholder={isAr ? 'تفاصيل الملاحظة الفنية أو الإجراء المطلوب...' : 'Specific technical observation or action taken...'}
                            className="w-full text-xs p-2 rounded-lg border border-amber-200 bg-amber-50/50 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Performed & Replaced Parts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    {isAr ? 'الأعمال الفنية المنجزة أثناء الزيارة' : 'Work & Tasks Performed'}
                  </label>
                  <textarea
                    rows={3}
                    value={reviewState.workPerformed}
                    onChange={(e) => setReviewState(prev => ({ ...prev, workPerformed: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder={isAr ? 'تنظيف، تشحيم، وزن سكك، ضبط شوكات، فحص لوحة التحكم...' : 'Tasks executed...'}
                  />
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    {isAr ? 'قطع الغيار المستبدلة أو المطلوبة (إن وجدت)' : 'Spare Parts Replaced / Needed'}
                  </label>
                  <textarea
                    rows={3}
                    value={reviewState.partsReplaced || ''}
                    onChange={(e) => setReviewState(prev => ({ ...prev, partsReplaced: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder={isAr ? 'لمبات طوارئ، فحمات فرامل، أزرار طلب...' : 'None or list parts...'}
                  />
                </div>
              </div>

              {/* Client Acceptance and Sign-off */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    {isAr ? 'استلام واعتماد العميل / ممثل الموقع' : 'Client Representative Sign-off'}
                  </h4>
                  <label className="flex items-center gap-2 text-xs font-semibold text-emerald-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewState.clientSigned}
                      onChange={(e) => setReviewState(prev => ({ ...prev, clientSigned: e.target.checked }))}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    {isAr ? 'تم استلام وتوقيع ممثل العميل على الزيارة' : 'Client has accepted and signed'}
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      {isAr ? 'اسم ممثل العميل المستلم' : 'Client Signee Name'}
                    </label>
                    <input
                      type="text"
                      value={reviewState.clientRepresentative || ''}
                      onChange={(e) => setReviewState(prev => ({ ...prev, clientRepresentative: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                      placeholder={contract.customerName}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      {isAr ? 'انطباع وملاحظات العميل' : 'Client Feedback / Comments'}
                    </label>
                    <input
                      type="text"
                      value={reviewState.clientFeedback || ''}
                      onChange={(e) => setReviewState(prev => ({ ...prev, clientFeedback: e.target.value }))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                      placeholder={isAr ? 'الخدمة ممتازة والمصعد يعمل بكفاءة' : 'Service is satisfactory'}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Printable Official Report View */
            <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md space-y-6 text-slate-900 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
              {/* Report Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TwinsLogo className="w-8 h-8 text-[#b6be49]" />
                    <span className="text-lg font-black tracking-tight text-slate-900">
                      {isAr ? companySettings.companyNameAr : companySettings.companyNameEn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {isAr ? companySettings.addressAr : companySettings.addressEn}
                  </p>
                  <p className="text-xs text-slate-600">
                    {isAr ? 'س.ت: ' : 'CR: '} {companySettings.commercialRegistration} | {isAr ? 'الرقم الضريبي: ' : 'VAT: '} {companySettings.vatNumber}
                  </p>
                </div>

                <div className="text-left rtl:text-right space-y-1">
                  <div className="inline-block bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded-md">
                    {isAr ? 'سند زيارة وفحص صيانة دورية' : 'Periodic Maintenance Service Report'}
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                    {contract.contractRef} - V#{visit.visitNumber}
                  </p>
                  <p className="text-xs text-slate-600">
                    {isAr ? 'تاريخ التنفيذ: ' : 'Date: '} 
                    <span className="font-semibold text-slate-800">
                      {reviewState.actualDate || reviewState.scheduledDate}
                    </span>
                  </p>
                </div>
              </div>

              {/* Elevator and Client Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">{isAr ? 'العميل / المالك' : 'Client / Owner'}</span>
                  <span className="font-bold text-slate-800">{contract.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{isAr ? 'المشروع والموقع' : 'Site Location'}</span>
                  <span className="font-bold text-slate-800">{contract.siteLocation || contract.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{isAr ? 'بيانات المصعد' : 'Elevator Details'}</span>
                  <span className="font-bold text-slate-800">{contract.elevatorName} ({contract.elevatorStops || 6} محطات)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{isAr ? 'الفني المعتمد' : 'Technician'}</span>
                  <span className="font-bold text-slate-800">{reviewState.technicianName}</span>
                </div>
              </div>

              {/* Certified Checklist Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  {isAr ? 'بنود الفحص والاختبارات الفنية المنفذة' : 'Technical Inspection Checklist'}
                </h4>
                <table className="w-full text-xs text-right rtl:text-right ltr:text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                      <th className="p-2 border border-slate-300 w-8 text-center">#</th>
                      <th className="p-2 border border-slate-300">{isAr ? 'بند الفحص' : 'Check Item'}</th>
                      <th className="p-2 border border-slate-300 w-24 text-center">{isAr ? 'النتيجة' : 'Result'}</th>
                      <th className="p-2 border border-slate-300">{isAr ? 'الملاحظات والإجراءات' : 'Remarks'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewState.checklist.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-medium">
                          {isAr ? item.itemAr : item.itemEn}
                        </td>
                        <td className="p-2 border border-slate-300 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.status === 'Pass' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : item.status === 'Attention' 
                                ? 'bg-amber-100 text-amber-800'
                                : item.status === 'Fail'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.status === 'Pass' ? 'مطابق ✅' : item.status === 'Attention' ? 'ملاحظة ⚠️' : item.status === 'Fail' ? 'غير مطابق ❌' : 'غ.م'}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-600">
                          {item.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Work & Parts notes */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">{isAr ? 'الأعمال المنجزة:' : 'Work Executed:'}</span>
                  <p className="text-slate-700">{reviewState.workPerformed || 'تمت الصيانة الدورية واختبار عناصر الأمان بنجاح.'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">{isAr ? 'قطع الغيار:' : 'Parts:'}</span>
                  <p className="text-slate-700">{reviewState.partsReplaced || 'لا توجد قطع مستبدلة.'}</p>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-10 text-xs">
                <div className="space-y-4">
                  <span className="font-bold text-slate-800 block">{isAr ? 'اعتماد فني الصيانة / الشركة' : 'Technician / Service Engineer'}</span>
                  <p className="text-slate-600">{isAr ? 'الاسم: ' : 'Name: '} {reviewState.technicianName}</p>
                  <div className="h-12 border-b border-dashed border-slate-400 flex items-end">
                    <span className="text-[10px] text-slate-400 font-mono">Verified & Sealed</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="font-bold text-slate-800 block">{isAr ? 'استلام وتوقيع ممثل العميل' : 'Client Representative Sign-off'}</span>
                  <p className="text-slate-600">{isAr ? 'الاسم: ' : 'Name: '} {reviewState.clientRepresentative || contract.customerName}</p>
                  <div className="h-12 border-b border-dashed border-slate-400 flex items-end">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {reviewState.clientSigned ? 'Client Accepted & Certified' : 'Signature'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {saveSuccessMsg && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {isAr ? 'تم حفظ واعتماد التقرير بنجاح!' : 'Report successfully certified & saved!'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'PRINT_VIEW' && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                {isAr ? 'طباعة تقرير الزيارة' : 'Print Visit Sheet'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {isAr ? 'حفظ واعتماد تقرير الفحص' : 'Save & Certify Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
