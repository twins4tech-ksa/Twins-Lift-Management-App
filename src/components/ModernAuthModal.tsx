import React, { useState } from 'react';
import { UserProfile } from '../types/portal';
import { Customer } from '../types/elevator';
import { Employee } from '../types/employee';
import { ModernLoginPage } from './ModernLoginPage';
import { X } from 'lucide-react';

interface ModernAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  currentProfile?: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onSelectProfile?: (user: UserProfile) => void;
  customers?: Customer[];
  employees?: Employee[];
  onUpdateEmployeePassword?: (employeeId: string, newPass: string) => void;
  isAr?: boolean;
}

export const ModernAuthModal: React.FC<ModernAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentProfile,
  onSelectUser,
  onSelectProfile,
  customers = [],
  employees = [],
  onUpdateEmployeePassword,
  isAr = true,
}) => {
  const [lang, setLang] = useState<'ar' | 'en'>(isAr ? 'ar' : 'en');

  if (!isOpen) return null;

  const handleUserSelect = (user: UserProfile) => {
    if (onSelectUser) onSelectUser(user);
    else if (onSelectProfile) onSelectProfile(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Floating Close Button */}
        <div className="absolute top-4 end-4 z-30">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white/90 hover:bg-slate-100 border border-slate-200 rounded-2xl shadow-xs transition-colors cursor-pointer"
            title={lang === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Embedded White Modern Login Experience */}
        <div className="flex-1">
          <ModernLoginPage
            onLogin={handleUserSelect}
            customers={customers}
            employees={employees}
            onUpdateEmployeePassword={onUpdateEmployeePassword}
            language={lang}
            onToggleLanguage={() => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
          />
        </div>
      </div>
    </div>
  );
};
