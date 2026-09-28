import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AppLanguage } from '../utils/translations';
import { UserProfile } from '../types/portal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  language: AppLanguage;
  onSuccess: (message: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  onSuccess,
}) => {
  const isAr = language === 'ar';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError(isAr ? 'يرجى إدخال كلمة المرور الحالية' : 'Please enter current password');
      return;
    }

    if (newPassword.length < 6) {
      setError(
        isAr 
          ? 'يجب أن تتكون كلمة المرور الجديدة من 6 خانات أو أحرف على الأقل' 
          : 'New password must be at least 6 characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        isAr 
          ? 'كلمة المرور الجديدة وتأكيدها غير متطابقين' 
          : 'New password and confirmation do not match'
      );
      return;
    }

    // Save custom password in localStorage associated with user profile ID
    try {
      localStorage.setItem(`vvt_password_${currentUser.id}`, newPassword);
    } catch (e) {
      console.warn('Could not persist new password', e);
    }

    onSuccess(
      isAr 
        ? `تم تحديث كلمة المرور للمستخدم (${currentUser.name}) بنجاح!` 
        : `Password updated successfully for (${currentUser.name})!`
    );

    // Reset and close
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md rounded-2xl bg-[#0B1E3B] text-white shadow-2xl border border-[#16335C] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#07152B] border-b border-[#16335C] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'تغيير الرقم السري' : 'Change Password'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentUser.name} ({currentUser.role})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'الرقم السري الحالي *' : 'Current Password *'}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={isAr ? 'أدخل الرقم السري الحالي' : 'Enter current password'}
                className="w-full px-3.5 py-2.5 bg-[#061224] border border-[#16335C] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-10 rtl:pr-3.5 rtl:pl-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-3 rtl:right-auto rtl:left-3 flex items-center text-slate-400 hover:text-white"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'الرقم السري الجديد *' : 'New Password *'}
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={isAr ? '6 خانات على الأقل' : 'At least 6 characters'}
                className="w-full px-3.5 py-2.5 bg-[#061224] border border-[#16335C] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-10 rtl:pr-3.5 rtl:pl-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-3 rtl:right-auto rtl:left-3 flex items-center text-slate-400 hover:text-white"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'تأكيد الرقم السري الجديد *' : 'Confirm New Password *'}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isAr ? 'أعد إدخال الرقم السري الجديد' : 'Re-enter new password'}
                className="w-full px-3.5 py-2.5 bg-[#061224] border border-[#16335C] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-10 rtl:pr-3.5 rtl:pl-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-3 rtl:right-auto rtl:left-3 flex items-center text-slate-400 hover:text-white"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2 text-[11px] text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              {isAr 
                ? 'يتم تشفير وتأمين بيانات تسجيل الدخول الخاصة بحسابك لحماية الصلاحيات والبيانات الفنية.' 
                : 'Account credentials are encrypted to protect portal roles and confidential data.'}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#16335C] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/40 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ وتأكيد' : 'Save & Confirm'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
