import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserPortalRole, 
  ROLE_PRIVILEGES_MAP, 
  SAMPLE_USER_PROFILES 
} from '../types/portal';
import { Customer } from '../types/elevator';
import { Employee, ROLE_CONFIGS } from '../types/employee';
import { SearchableSelect } from './SearchableSelect';
import { 
  X, 
  ShieldCheck, 
  Wrench, 
  Building2, 
  Briefcase, 
  Lock, 
  Check, 
  ArrowRight,
  Info
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  currentProfile?: UserProfile;
  onSelectUser?: (user: UserProfile) => void;
  onSelectProfile?: (user: UserProfile) => void;
  customers?: Customer[];
  employees?: Employee[];
  isAr?: boolean;
}

export const PortalSwitcherModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  currentProfile,
  onSelectUser,
  onSelectProfile,
  customers = [],
  employees = [],
  isAr = true,
}) => {
  const activeUser: UserProfile = currentUser || currentProfile || SAMPLE_USER_PROFILES[0];
  const activeRole: UserPortalRole = activeUser?.role && ROLE_PRIVILEGES_MAP[activeUser.role] ? activeUser.role : 'MANAGEMENT';
  const effectiveOnSelect = onSelectUser || onSelectProfile || (() => {});

  const [selectedRole, setSelectedRole] = useState<UserPortalRole>(activeRole);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState<number>(0);
  const [selectedEmployeeIndex, setSelectedEmployeeIndex] = useState<number>(0);
  const [canViewAllDepartmentRecords, setCanViewAllDepartmentRecords] = useState<boolean>(
    Boolean(activeUser?.canViewAllDepartmentRecords)
  );

  const technicians = employees.filter((e) => e?.role === 'MAINTENANCE_TECH' || e?.role === 'INSTALLATION_ENG' || (e?.role as any) === 'TECHNICIAN');
  const salesReps = employees.filter((e) => e?.role === 'SALES_REP');

  useEffect(() => {
    if (activeUser?.role) {
      setSelectedRole(activeUser.role);
      setCanViewAllDepartmentRecords(Boolean(activeUser.canViewAllDepartmentRecords));
    }
  }, [activeUser]);

  // Sync canViewAllDepartmentRecords when employee changes
  useEffect(() => {
    if (selectedRole === 'TECHNICIAN' && technicians[selectedEmployeeIndex]) {
      setCanViewAllDepartmentRecords(
        technicians[selectedEmployeeIndex].portalUser?.canViewAllDepartmentRecords ?? false
      );
    } else if (selectedRole === 'SALES_REP' && salesReps[selectedEmployeeIndex]) {
      setCanViewAllDepartmentRecords(
        salesReps[selectedEmployeeIndex].portalUser?.canViewAllDepartmentRecords ?? false
      );
    }
  }, [selectedRole, selectedEmployeeIndex, technicians, salesReps]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedRole === 'MANAGEMENT') {
      const base = SAMPLE_USER_PROFILES.find((p) => p.role === 'MANAGEMENT') || SAMPLE_USER_PROFILES[0];
      effectiveOnSelect({
        ...base,
        canViewAllDepartmentRecords: true,
      });
    } else if (selectedRole === 'CUSTOMER') {
      if (customers.length > 0 && customers[selectedCustomerIndex]) {
        const c = customers[selectedCustomerIndex];
        const user: UserProfile = {
          id: `cust-user-${c.id}`,
          name: c.name,
          role: 'CUSTOMER',
          email: c.email || 'customer@twinselevators.com',
          phone: c.phone || '+966 50 000 0000',
          avatarLabel: 'عم',
          title: `عميل معتمد - ${c.company || c.name}`,
          customerId: c.id,
          customerCompany: c.company || c.name,
          canViewAllDepartmentRecords: false,
        };
        effectiveOnSelect(user);
      } else {
        const base = SAMPLE_USER_PROFILES.find((p) => p.role === 'CUSTOMER') || SAMPLE_USER_PROFILES[2];
        effectiveOnSelect(base);
      }
    } else if (selectedRole === 'TECHNICIAN') {
      if (technicians.length > 0 && technicians[selectedEmployeeIndex]) {
        const t = technicians[selectedEmployeeIndex];
        const user: UserProfile = {
          id: t.portalUser?.userId || `tech-user-${t.id}`,
          name: t.name,
          nameEn: t.nameEn,
          role: 'TECHNICIAN',
          email: t.portalUser?.email || t.email || 'tech@twinselevators.com',
          phone: t.phone || '+966 50 000 0000',
          avatarLabel: 'فن',
          title: t.portalUser?.userTitle || `${ROLE_CONFIGS[t.role]?.labelAr || 'فني صيانة'} - قسم الطوارئ`,
          employeeId: t.id,
          canViewAllDepartmentRecords: canViewAllDepartmentRecords,
        };
        effectiveOnSelect(user);
      } else {
        const base = SAMPLE_USER_PROFILES.find((p) => p.role === 'TECHNICIAN') || SAMPLE_USER_PROFILES[1];
        effectiveOnSelect({
          ...base,
          canViewAllDepartmentRecords: canViewAllDepartmentRecords,
        });
      }
    } else if (selectedRole === 'SALES_REP') {
      if (salesReps.length > 0 && salesReps[selectedEmployeeIndex]) {
        const s = salesReps[selectedEmployeeIndex];
        const user: UserProfile = {
          id: s.portalUser?.userId || `sales-user-${s.id}`,
          name: s.name,
          nameEn: s.nameEn,
          role: 'SALES_REP',
          email: s.portalUser?.email || s.email || 'sales@twinselevators.com',
          phone: s.phone || '+966 50 000 0000',
          avatarLabel: 'مب',
          title: s.portalUser?.userTitle || `${ROLE_CONFIGS[s.role]?.labelAr || 'مسؤول مبيعات'} - قسم المشاريع`,
          employeeId: s.id,
          canViewAllDepartmentRecords: canViewAllDepartmentRecords,
        };
        effectiveOnSelect(user);
      } else {
        const base = SAMPLE_USER_PROFILES.find((p) => p.role === 'SALES_REP') || SAMPLE_USER_PROFILES[3];
        effectiveOnSelect({
          ...base,
          canViewAllDepartmentRecords: canViewAllDepartmentRecords,
        });
      }
    }
    onClose();
  };

  const priv = ROLE_PRIVILEGES_MAP[selectedRole] || ROLE_PRIVILEGES_MAP.MANAGEMENT;
  const activeUserPriv = ROLE_PRIVILEGES_MAP[activeRole] || ROLE_PRIVILEGES_MAP.MANAGEMENT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black">
                {isAr ? 'بوابة المستخدم وتبديل الصلاحيات (User Portal & RBAC)' : 'User Portal & Role Switcher'}
              </h2>
              <p className="text-xs text-slate-300">
                {isAr 
                  ? 'اختر الدور لاختبار صلاحيات الإدارة، الفني الميداني، أو العميل' 
                  : 'Select role to test Management, Technician, or Customer views'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
          {/* Current Active User Banner */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${activeUserPriv.avatarColor}`}>
                {activeUser.avatarLabel || 'إد'}
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold">
                  {isAr ? 'المستخدم الحالي النشط:' : 'Current Active User:'}
                </div>
                <div className="text-sm font-black text-slate-900">
                  {activeUser.name}
                </div>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${activeUserPriv.badgeBg}`}>
              {activeUserPriv.titleAr}
            </span>
          </div>

          {/* Role Selection Grid */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2.5">
              {isAr ? 'اختر البوابة والصلاحية المطلوبة:' : 'Select Target Portal & Role:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Management Option */}
              <button
                type="button"
                onClick={() => setSelectedRole('MANAGEMENT')}
                className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                  selectedRole === 'MANAGEMENT'
                    ? 'border-rose-600 bg-rose-50/70 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">الإدارة العامة</span>
                    {selectedRole === 'MANAGEMENT' && <Check className="w-4 h-4 text-rose-600 font-bold" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    كامل الصلاحيات: هوامش الأرباح، الأسعار، الإعدادات، والموظفين.
                  </p>
                </div>
              </button>

              {/* Technician Option */}
              <button
                type="button"
                onClick={() => setSelectedRole('TECHNICIAN')}
                className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                  selectedRole === 'TECHNICIAN'
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">بوابة الفني الميداني</span>
                    {selectedRole === 'TECHNICIAN' && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    مهام الصيانة، بلاغات الأعطال، البصمة الجغرافية، والمخططات الفنية.
                  </p>
                </div>
              </button>

              {/* Customer Option */}
              <button
                type="button"
                onClick={() => setSelectedRole('CUSTOMER')}
                className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                  selectedRole === 'CUSTOMER'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">بوابة العميل والمالك</span>
                    {selectedRole === 'CUSTOMER' && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    مصاعدي، عقود الصيانة، تسجيل بلاغ عطل فوري، وسجل الفحص الدوري.
                  </p>
                </div>
              </button>

              {/* Sales Rep Option */}
              <button
                type="button"
                onClick={() => setSelectedRole('SALES_REP')}
                className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                  selectedRole === 'SALES_REP'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">بوابة المبيعات والمشاريع</span>
                    {selectedRole === 'SALES_REP' && <Check className="w-4 h-4 text-amber-600 font-bold" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    حاسبة المواصفات، عروض الأسعار، عقود التوريد، وسجل العملاء.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Dropdowns based on Selected Role */}
          {selectedRole === 'CUSTOMER' && customers.length > 0 && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
              <label className="block text-xs font-black text-emerald-900 mb-1.5">
                اختر العميل المعروض في البوابة:
              </label>
              <SearchableSelect
                value={selectedCustomerIndex}
                onChange={(e) => setSelectedCustomerIndex(Number(e.target.value))}
                className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {customers.map((c, idx) => (
                  <option key={c.id} value={idx}>
                    {c.name} {c.company ? `(${c.company})` : ''} - هاتف: {c.phone}
                  </option>
                ))}
              </SearchableSelect>
            </div>
          )}

          {selectedRole === 'TECHNICIAN' && technicians.length > 0 && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200">
              <label className="block text-xs font-black text-blue-900 mb-1.5">
                {isAr ? 'اختر الفني الميداني النشط:' : 'Select Active Field Technician:'}
              </label>
              <SearchableSelect
                value={selectedEmployeeIndex}
                onChange={(e) => setSelectedEmployeeIndex(Number(e.target.value))}
                className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                {technicians.map((t, idx) => (
                  <option key={t.id} value={idx}>
                    {t.name} ({t.position || (isAr ? 'فني صيانة' : 'Tech')}) - {t.phone}
                  </option>
                ))}
              </SearchableSelect>
            </div>
          )}

          {selectedRole === 'SALES_REP' && salesReps.length > 0 && (
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
              <label className="block text-xs font-black text-amber-900 mb-1.5">
                {isAr ? 'اختر مندوب المبيعات النشط:' : 'Select Active Sales Representative:'}
              </label>
              <SearchableSelect
                value={selectedEmployeeIndex}
                onChange={(e) => setSelectedEmployeeIndex(Number(e.target.value))}
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                {salesReps.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    {s.name} ({s.position || (isAr ? 'مندوب مبيعات' : 'Sales Rep')}) - {s.phone}
                  </option>
                ))}
              </SearchableSelect>
            </div>
          )}

          {/* Department Records Scope Option (for Technicians and Sales Reps) */}
          {(selectedRole === 'TECHNICIAN' || selectedRole === 'SALES_REP') && (
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-950 font-black text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'نطاق الوصول واستعراض سجلات القسم:' : 'Department Access Scope:'}</span>
              </div>

              <label className="relative flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 cursor-pointer transition-colors shadow-2xs">
                <input
                  type="checkbox"
                  checked={canViewAllDepartmentRecords}
                  onChange={(e) => setCanViewAllDepartmentRecords(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <span className="font-extrabold text-indigo-950 block">
                    {isAr ? 'السماح بمشاهدة كافة سجلات وإضافات القسم المصرح به' : 'Allow viewing all department records & entries'}
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {isAr ? (
                      <>
                        <strong className="text-slate-800">• الوضع الطبيعي (الافتراضي):</strong> لا يشاهد المناديب والفنيون إلا ما هو مسند إليهم شخصياً أو تم إدخاله بواسطتهم.
                        <br />
                        <strong className="text-emerald-700">• عند تفعيل هذا الخيار:</strong> يتمكن المستخدم من مشاهدة جميع مشاريع وعقود وأعطال القسم المصرح له كاملاً.
                      </>
                    ) : (
                      <>
                        <strong>• Normal:</strong> Technicians & reps only view assigned/created records.
                        <br />
                        <strong>• Enabled:</strong> Full visibility across all department records.
                      </>
                    )}
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Privilege Matrix Preview Table */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-black text-slate-700">
              <Info className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'جدول صلاحيات البوابة المختارة:' : 'Privilege Matrix for Selected Role:'}</span>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="divide-y divide-slate-200">
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">{isAr ? 'نطاق استعراض سجلات القسم' : 'Department Records Scope'}</span>
                  {selectedRole === 'MANAGEMENT' || canViewAllDepartmentRecords ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {isAr ? 'كافة سجلات القسم (موسعة)' : 'All Records (Expanded)'}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> {isAr ? 'المسند والمدخل فقط (الوضع الطبيعي)' : 'Assigned Only (Standard)'}
                    </span>
                  )}
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">هوامش الربح وأسعار التكلفة الحساسة</span>
                  {priv.canViewGrossMargins ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> متاح
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> محجوب تماماً
                    </span>
                  )}
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">إعدادات الشركة ومعاملات التسعير</span>
                  {priv.canManageSettings ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> متاح
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> محجوب
                    </span>
                  )}
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">تسجيل بلاغات الأعطال الفورية للطوارئ</span>
                  {priv.canReportBreakdowns ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> متاح للعميل والفني
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold">محجوب</span>
                  )}
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">تحديث حالات بلاغات الأعطال وإتمام الصيانة</span>
                  {priv.canUpdateBreakdowns ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> متاح
                    </span>
                  ) : (
                    <span className="text-slate-400 font-bold">غير مصرح</span>
                  )}
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">المخططات الهندسية ونظام التعليق CAD</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> متاح للجميع
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <span>تأكيد تبديل البوابة</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
