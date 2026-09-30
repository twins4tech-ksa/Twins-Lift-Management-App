import React, { useState } from 'react';
import { X, Save, AlertTriangle, Camera, Image as ImageIcon, Trash2, PenTool, Check } from 'lucide-react';
import { MaintenanceBreakdown, BreakdownStatus, BreakdownPriority } from '../types/maintenance';
import { AppLanguage } from '../utils/translations';
import { Employee } from '../types/employee';
import { ElevatorSpecification, Customer } from '../types/elevator';
import { SearchableSelect } from './SearchableSelect';
import { DigitalSignaturePad } from './DigitalSignaturePad';

interface BreakdownModalProps {
  breakdown?: MaintenanceBreakdown;
  language: AppLanguage;
  employees: Employee[];
  projects: ElevatorSpecification[];
  customers: Customer[];
  onSave: (breakdown: MaintenanceBreakdown) => void;
  onClose: () => void;
}

export const BreakdownModal: React.FC<BreakdownModalProps> = ({
  breakdown,
  language,
  employees,
  projects,
  customers,
  onSave,
  onClose
}) => {
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<MaintenanceBreakdown>>(
    breakdown || {
      status: 'Reported',
      priority: 'Medium',
      customerType: 'CONTRACT',
      isResolved: false,
      reportedAt: new Date().toISOString()
    }
  );

  const [beforePhotos, setBeforePhotos] = useState<string[]>((breakdown as any)?.beforePhotos || []);
  const [afterPhotos, setAfterPhotos] = useState<string[]>((breakdown as any)?.afterPhotos || []);
  const [clientSignatureUrl, setClientSignatureUrl] = useState<string | null>((breakdown as any)?.clientSignatureDataUrl || null);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);

  const handleFileUpload = (type: 'BEFORE' | 'AFTER', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'BEFORE') {
        setBeforePhotos((prev) => [...prev, dataUrl]);
      } else {
        setAfterPhotos((prev) => [...prev, dataUrl]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-set resolvedAt if status is resolved and wasn't set
    let resolvedAt = formData.resolvedAt;
    let isResolved = formData.status === 'Resolved';
    if (isResolved && !resolvedAt) {
      resolvedAt = new Date().toISOString();
    }

    onSave({
      ...formData,
      customerType: formData.customerType || 'CONTRACT',
      id: formData.id || `brk-${Date.now()}`,
      isResolved,
      resolvedAt,
      beforePhotos,
      afterPhotos,
      clientSignatureDataUrl: clientSignatureUrl || undefined,
    } as any);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customerId: customer.id,
        customerName: customer.nameAr,
        customerPhone: customer.phone,
        siteLocation: customer.city || ''
      });
    }
  };

  const handleProjectChange = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setFormData({
        ...formData,
        projectId: proj.id,
        elevatorName: proj.projectName || '',
        elevatorNumber: proj.elevatorNumber || formData.elevatorNumber,
      });
    }
  };

  const handleTechnicianChange = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setFormData({
      ...formData,
      assignedTechnicianId: emp?.id,
      assignedTechnicianName: emp ? (emp.name || (isAr ? (emp as any).nameAr : (emp as any).nameEn)) : undefined,
      assignedTechnicianPhone: emp?.phone,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            {breakdown ? (isAr ? 'تعديل بيانات العطل' : 'Edit Breakdown') : (isAr ? 'تسجيل عطل جديد' : 'New Breakdown')}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="breakdown-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer & Service Type Selector */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {isAr ? 'نوع العميل والخدمة *' : 'Customer & Service Type *'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, customerType: 'CONTRACT' })}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    formData.customerType !== 'ONE_TIME'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.customerType !== 'ONE_TIME' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                  <span>{isAr ? 'عميل عقد صيانة دورية' : 'Maintenance Contract'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, customerType: 'ONE_TIME' })}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    formData.customerType === 'ONE_TIME'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.customerType === 'ONE_TIME' ? 'bg-white' : 'bg-amber-500'}`}></span>
                  <span>{isAr ? 'إصلاح عطل لمرة واحدة (بدون عقد)' : 'One-Time Repair'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'العميل (اختياري للربط)' : 'Customer (Optional)'}</label>
                <SearchableSelect
                  value={formData.customerId || ''}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">{isAr ? '-- اختر العميل --' : '-- Select Customer --'}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.nameAr} - {c.phone}</option>
                  ))}
                </SearchableSelect>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'اسم العميل المباشر' : 'Customer Name'}</label>
                <input
                  type="text"
                  required
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'المشروع (اختياري للربط)' : 'Project (Optional)'}</label>
                <SearchableSelect
                  value={formData.projectId || ''}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">{isAr ? '-- اختر المشروع --' : '-- Select Project --'}</option>
                  {projects.filter(p => p.customerId === formData.customerId).map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </SearchableSelect>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'اسم المصعد / الوصف' : 'Elevator Name/Desc'}</label>
                <input
                  type="text"
                  required
                  value={formData.elevatorName || ''}
                  onChange={(e) => setFormData({ ...formData, elevatorName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'رقم كود المصعد' : 'Elevator Code'}</label>
                <input
                  type="text"
                  placeholder={isAr ? "مثال: INS-202609-001 أو MNT-202609-001" : "e.g. INS-202609-001 or MNT-202609-001"}
                  value={formData.elevatorNumber || ''}
                  onChange={(e) => setFormData({ ...formData, elevatorNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-rose-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'الموقع' : 'Location'}</label>
                <input
                  type="text"
                  required
                  value={formData.siteLocation || ''}
                  onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
                <input
                  type="text"
                  value={formData.customerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-left" dir="ltr"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'وصف العطل' : 'Fault Description'}</label>
              <textarea
                required
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'الحالة' : 'Status'}</label>
                <SearchableSelect
                  value={formData.status || 'Reported'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as BreakdownStatus })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Reported">{isAr ? 'مبلغ عنه' : 'Reported'}</option>
                  <option value="Assigned">{isAr ? 'تم التعيين' : 'Assigned'}</option>
                  <option value="In_Progress">{isAr ? 'قيد الإصلاح' : 'In Progress'}</option>
                  <option value="Requires_Parts">{isAr ? 'بانتظار قطع غيار' : 'Requires Parts'}</option>
                  <option value="Resolved">{isAr ? 'تم الإصلاح' : 'Resolved'}</option>
                </SearchableSelect>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'الأولوية' : 'Priority'}</label>
                <SearchableSelect
                  value={formData.priority || 'Medium'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as BreakdownPriority })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Low">{isAr ? 'عادي' : 'Low'}</option>
                  <option value="Medium">{isAr ? 'متوسط' : 'Medium'}</option>
                  <option value="High">{isAr ? 'مرتفع' : 'High'}</option>
                  <option value="Emergency">{isAr ? 'طوارئ' : 'Emergency'}</option>
                </SearchableSelect>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isAr ? 'الفني المختص' : 'Assigned Technician'}</label>
                <SearchableSelect
                  value={formData.assignedTechnicianId || ''}
                  onChange={(e) => handleTechnicianChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">{isAr ? '-- غير معين --' : '-- Unassigned --'}</option>
                  {employees.filter(emp => emp?.role === 'MAINTENANCE_TECH' || emp?.role === 'INSTALLATION_ENG' || (emp?.role as any) === 'TECHNICIAN' || (emp?.role as any) === 'ENGINEER').map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name || (isAr ? (emp as any).nameAr : (emp as any).nameEn)}</option>
                  ))}
                </SearchableSelect>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {isAr ? 'الإجراءات الفنية المنفذة (أمر العمل)' : 'Work Performed / Action Taken'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isAr ? 'الإصلاحات التي قام بها الفني، فحص المحرك، البرمجة...' : 'Actions taken, repairs completed...'}
                  value={formData.workPerformed || ''}
                  onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {isAr ? 'قطع الغيار المستبدلة أو المطلوبة' : 'Parts Required / Replaced'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isAr ? 'مثال: حساس ضوئي، كتاوت، زيت تشحيم...' : 'e.g. door sensor, relay...'}
                  value={formData.partsRequired || ''}
                  onChange={(e) => setFormData({ ...formData, partsRequired: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات الفني (بعد الإصلاح)' : 'Technician Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formData.technicianNotes || ''}
                  onChange={(e) => setFormData({ ...formData, technicianNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {isAr ? 'تكلفة الإصلاح (ريال - لحالات الإصلاح لمرة واحدة)' : 'Repair Cost (SAR - if One-Time)'}
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.cost !== undefined ? formData.cost : ''}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {formData.customerType !== 'ONE_TIME' 
                    ? (isAr ? 'ملاحظة: عقود الصيانة الشاملة تغطي الإصلاحات دون رسوم' : 'Contract clients are usually covered') 
                    : (isAr ? 'يتم توضيح التكلفة في التقرير المطبوع والفاتورة' : 'Appears on the printed report')}
                </p>
              </div>
            </div>

            {/* Photo Documentation Section (Before & After) */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">
                  {isAr ? 'التوثيق الميداني بالصور (قبل وبعد الإصلاح)' : 'Photo Documentation (Before & After)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Before Photos */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-800">
                      {isAr ? '📷 صور العطل / القطعة التالفة (قبل)' : 'Before Repair'}
                    </span>
                    <label className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-white px-2 py-1 rounded-lg border border-amber-300 hover:bg-amber-50 cursor-pointer shadow-2xs">
                      <span>{isAr ? '+ إضافة صورة' : '+ Add Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload('BEFORE', e)}
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {beforePhotos.length === 0 ? (
                      <div className="text-[10px] text-slate-400 py-2 text-center w-full">
                        {isAr ? 'لا توجد صور مضافة' : 'No photos added'}
                      </div>
                    ) : (
                      beforePhotos.map((img, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shrink-0 group">
                          <img src={img} alt="Before" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setBeforePhotos(beforePhotos.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* After Photos */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800">
                      {isAr ? '📷 صور الإصلاح والتركيب (بعد)' : 'After Repair'}
                    </span>
                    <label className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-50 cursor-pointer shadow-2xs">
                      <span>{isAr ? '+ إضافة صورة' : '+ Add Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload('AFTER', e)}
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {afterPhotos.length === 0 ? (
                      <div className="text-[10px] text-slate-400 py-2 text-center w-full">
                        {isAr ? 'لا توجد صور مضافة' : 'No photos added'}
                      </div>
                    ) : (
                      afterPhotos.map((img, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shrink-0 group">
                          <img src={img} alt="After" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setAfterPhotos(afterPhotos.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Client E-Signature Section */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSignaturePadOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{clientSignatureUrl ? (isAr ? 'تعديل التوقيع الحي للعميل' : 'Edit E-Signature') : (isAr ? '✍️ توقيع العميل إلكترونياً على الإصلاح' : 'Client E-Signature')}</span>
                  </button>
                  {clientSignatureUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{isAr ? 'تم اعتماد التوقيع' : 'Signed'}</span>
                    </span>
                  )}
                </div>

                {clientSignatureUrl && (
                  <div className="border border-slate-200 bg-white p-1 rounded-lg shadow-2xs">
                    <img src={clientSignatureUrl} alt="Client Signature" className="h-8 max-w-[120px] object-contain" />
                  </div>
                )}
              </div>
            </div>
            
          </form>
        </div>

        {/* Digital Signature Pad Modal */}
        {isSignaturePadOpen && (
          <DigitalSignaturePad
            titleAr="توقيع العميل على إنجاز إصلاح العطل"
            titleEn="Client E-Signature for Breakdown Resolution"
            signatoryName={formData.customerName || ''}
            signatoryRole={isAr ? 'العميل أو ممثل الموقع' : 'Client Representative'}
            language={language}
            onSave={(dataUrl) => {
              setClientSignatureUrl(dataUrl);
              setIsSignaturePadOpen(false);
            }}
            onClose={() => setIsSignaturePadOpen(false)}
          />
        )}

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="submit"
            form="breakdown-form"
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-xl transition-colors font-semibold shadow-xs"
          >
            <Save className="w-5 h-5" />
            {isAr ? 'حفظ البيانات' : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  );
};
