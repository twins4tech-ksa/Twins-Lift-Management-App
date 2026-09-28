import React, { useState } from 'react';
import { X, Save, UserPlus, Building, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { Customer } from '../types/elevator';
import { AppLanguage } from '../utils/translations';

interface QuickAddCustomerModalProps {
  language: AppLanguage;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  language,
  onSave,
  onClose
}) => {
  const isAr = language === 'ar';

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    location: 'Riyadh, Saudi Arabia',
    taxNumber: '',
    customerType: 'company' as 'individual' | 'company' | 'contractor' | 'consultant',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      name: formData.name.trim(),
      company: formData.company.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      location: formData.location.trim(),
      taxNumber: formData.taxNumber.trim(),
      customerType: formData.customerType,
      notes: formData.notes.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1E3B] to-[#16335C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime-500/20 text-lime-400 flex items-center justify-center border border-lime-500/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {isAr ? 'إضافة عميل جديد للنظام' : 'Add New Customer'}
              </h3>
              <p className="text-[11px] text-blue-200/80">
                {isAr ? 'تسجيل بيانات العميل للربط مع عروض الأسعار والمصاعد' : 'Register customer for quotations and contracts'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Customer Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'اسم العميل / المسؤول *' : 'Customer / Contact Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isAr ? 'مثال: شركة برج المملكة للاستثمار' : 'e.g. Kingdom Tower Co.'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                {isAr ? 'اسم الشركة أو المشروع' : 'Company / Project'}
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder={isAr ? 'اسم المنشأة' : 'Company name'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
              />
            </div>

            {/* Customer Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'تصنيف العميل' : 'Customer Category'}
              </label>
              <select
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
              >
                <option value="company">{isAr ? 'شركة ومؤسسة' : 'Company'}</option>
                <option value="contractor">{isAr ? 'مقاول إنشاءات' : 'Contractor'}</option>
                <option value="consultant">{isAr ? 'استشاري هندسي' : 'Consultant'}</option>
                <option value="individual">{isAr ? 'مالك فرد / عميل خاص' : 'Individual / Private'}</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                {isAr ? 'رقم الهاتف / الجوال' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966 5X XXX XXXX"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all text-left"
                dir="ltr"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all text-left"
                dir="ltr"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {isAr ? 'المدينة والموقع' : 'Location & City'}
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
              />
            </div>

            {/* Tax Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'الرقم الضريبي (اختياري)' : 'VAT / Tax Number'}
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                placeholder="300XXXXXXXXXXXX"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                {isAr ? 'ملاحظات إضافية' : 'Notes'}
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={isAr ? 'أي اشتراطات خاصة بالعميل أو المشاريع المستهدفة...' : 'Any special notes or target projects...'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ العميل' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
