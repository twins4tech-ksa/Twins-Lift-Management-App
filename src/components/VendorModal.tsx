import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Save, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  Tag,
  Check
} from 'lucide-react';
import { Vendor, InventoryCategory, INVENTORY_CATEGORIES_INFO } from '../types/inventory';
import { AppLanguage } from '../utils/translations';

export interface VendorModalProps {
  vendor?: Vendor | null;
  language: AppLanguage;
  onSave: (vendorData: Omit<Vendor, 'id'>) => void;
  onClose: () => void;
}

export const VendorModal: React.FC<VendorModalProps> = ({
  vendor,
  language,
  onSave,
  onClose,
}) => {
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Omit<Vendor, 'id'>>({
    nameAr: vendor?.nameAr || '',
    nameEn: vendor?.nameEn || '',
    code: vendor?.code || '',
    contactPerson: vendor?.contactPerson || '',
    phone: vendor?.phone || '',
    email: vendor?.email || '',
    country: vendor?.country || (isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'),
    city: vendor?.city || 'الرياض',
    address: vendor?.address || '',
    categories: vendor?.categories || ['TRACTION_DRIVE'],
    paymentTerms: vendor?.paymentTerms || 'آجل 30 يوم (30 Days Net)',
    taxNumber: vendor?.taxNumber || '',
    rating: vendor?.rating || 5,
    isApproved: vendor?.isApproved !== undefined ? vendor.isApproved : true,
    leadTimeDaysAvg: vendor?.leadTimeDaysAvg || 14,
    website: vendor?.website || '',
    notes: vendor?.notes || '',
  });

  const handleToggleCategory = (cat: InventoryCategory) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        if (prev.categories.length === 1) return prev; // Keep at least one
        return { ...prev, categories: prev.categories.filter((c) => c !== cat) };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr.trim()) return;

    onSave({
      ...formData,
      code: formData.code.trim().toUpperCase() || formData.nameEn.slice(0, 4).toUpperCase() || 'VND',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 text-right overflow-hidden flex flex-col max-h-[92vh]" 
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shadow-xs shrink-0">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {vendor ? (isAr ? 'تعديل بيانات المورد المعتمد' : 'Edit Vendor Profile') : (isAr ? 'تسجيل مورد ومصنع معتمد جديد' : 'Register New Certified Vendor')}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'إدارة بيانات الاتصال، شروط الدفع، فترات التوريد، وتصنيفات قطع الغيار' : 'Manage contact details, payment terms, lead times, and supplied part categories'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1 pl-1 [scrollbar-width:thin]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Arabic Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'اسم الشركة / المورد بالعربية *' : 'Company Name (Arabic) *'}
              </label>
              <input
                type="text"
                required
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="شركة تورين درايف لأنظمة الجر"
                className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* English Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'اسم الشركة / المورد بالإنجليزية' : 'Company Name (English)'}
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="Torin Drive Machinery Co."
                className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Short Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'كود المورد المختصر (Code)' : 'Vendor Code'}
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="TORIN"
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'جهة الاتصال أو المسؤول المعتمد' : 'Contact Person'}
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="م. ماجد الشهري / مبيعات المصاعد"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'رقم الهاتف أو الجوال / واتساب' : 'Phone / WhatsApp'}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966 50 123 4567"
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="orders@torindrive.com"
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Country of Origin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'بلد المنشأ والتصنيع' : 'Country of Origin'}
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="ألمانيا / إسبانيا / الصين / إيطاليا"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'المدينة / المقر الإقليمي' : 'City / Regional Hub'}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="الرياض / دبي"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'شروط السداد والدفع' : 'Payment Terms'}
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="آجل 30 يوم (30 Days Net)">آجل 30 يوم (30 Days Net)</option>
                <option value="آجل 45 يوم (45 Days Net)">آجل 45 يوم (45 Days Net)</option>
                <option value="آجل 60 يوم (60 Days Net)">آجل 60 يوم (60 Days Net)</option>
                <option value="اعتماد بنكي LC">اعتماد بنكي معزز (LC)</option>
                <option value="نقداً عند الاستلام COD">نقداً عند التوريد والاستلام (COD)</option>
                <option value="50% دفعة مقدمة + 50% عند الشحن">50% دفعة مقدمة + 50% عند الشحن</option>
              </select>
            </div>

            {/* Lead Time Days */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'متوسط فترة التوريد (أيام)' : 'Avg. Lead Time (Days)'}
              </label>
              <input
                type="number"
                min={1}
                value={formData.leadTimeDaysAvg}
                onChange={(e) => setFormData({ ...formData, leadTimeDaysAvg: Number(e.target.value) })}
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quality Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'تقييم الجودة والاعتمادية (1-5 نجوم)' : 'Quality Rating (1-5 Stars)'}
              </label>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-300">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (formData.rating || 5) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 mr-2">
                  {formData.rating || 5} / 5
                </span>
              </div>
            </div>

            {/* Approved Status Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-300 self-end">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isAr ? 'مورد معتمد رسمياً' : 'Approved Vendor Status'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isAr ? 'مطابق لشهادات SASO والمواصفات' : 'Compliant with SASO / ISO'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.isApproved}
                onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Categories Supplied (Multi-select pills) */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAr ? 'التصنيفات المعتمدة للتوريد من هذا المورد *' : 'Supplied Part Categories *'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(INVENTORY_CATEGORIES_INFO).map(([catKey, info]) => {
                const isSelected = formData.categories.includes(catKey as InventoryCategory);
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleToggleCategory(catKey as InventoryCategory)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-right transition-all cursor-pointer ${
                      isSelected
                        ? `${info.color} ring-1 ring-indigo-500 shadow-2xs font-bold`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{isAr ? info.labelAr.split('(')[0] : info.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'ملاحظات واعتمادات إضافية' : 'Notes & Certifications'}
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={isAr ? 'مثلاً: وكيل حصري لقطع الغيار الأصلية، شهادات مطابقة SASO، رقم السجل التجاري...' : 'Additional notes, SASO certs, etc.'}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{vendor ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'تسجيل المورد' : 'Register Vendor')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
