import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  KeyRound, 
  RefreshCw, 
  LogOut, 
  Shield, 
  Wrench, 
  Building2, 
  Briefcase,
  Globe,
  Check,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { UserProfile, UserPortalRole, ROLE_PRIVILEGES_MAP, SAMPLE_USER_PROFILES } from '../types/portal';
import { AppLanguage } from '../utils/translations';

interface UserProfileMenuProps {
  currentUser?: UserProfile | null;
  language: AppLanguage;
  onChangePassword: () => void;
  onSwitchUser: () => void;
  onLogout: () => void;
  onToggleLanguage: () => void;
  className?: string;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  language,
  onChangePassword,
  onSwitchUser,
  onLogout,
  onToggleLanguage,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAr = language === 'ar';

  const profile = currentUser && currentUser.role && ROLE_PRIVILEGES_MAP[currentUser.role] 
    ? currentUser 
    : SAMPLE_USER_PROFILES[0];
  const role = profile.role || 'MANAGEMENT';
  const priv = ROLE_PRIVILEGES_MAP[role] || ROLE_PRIVILEGES_MAP.MANAGEMENT;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getRoleIcon = () => {
    switch (role) {
      case 'MANAGEMENT':
        return <Shield className="w-3 h-3 text-amber-600" />;
      case 'TECHNICIAN':
        return <Wrench className="w-3 h-3 text-blue-600" />;
      case 'CUSTOMER':
        return <Building2 className="w-3 h-3 text-emerald-600" />;
      case 'SALES_REP':
        return <Briefcase className="w-3 h-3 text-purple-600" />;
      default:
        return <User className="w-3 h-3 text-slate-500" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Profile Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={isAr ? `المستخدم: ${profile.name} (${priv.titleAr})` : `User: ${profile.name} (${priv.titleEn})`}
        className={`relative inline-flex items-center justify-center p-1 rounded-lg border transition-all duration-150 group cursor-pointer focus:outline-hidden ${
          isOpen
            ? 'bg-blue-600/30 border-blue-400 text-white shadow-xs'
            : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200 hover:text-white'
        }`}
      >
        <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 shadow-xs transition-transform group-hover:scale-105 ${priv.avatarColor}`}>
          {profile.avatarLabel || 'إد'}
        </div>

        {/* Role indicator dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0B1E3B] bg-emerald-400" />
      </button>

      {/* User Dropdown Menu: Ultra-compact, Light colors, Simple Icons */}
      {isOpen && (
        <div 
          dir={isAr ? 'rtl' : 'ltr'}
          className="fixed top-16 left-3 right-3 max-w-xs mx-auto sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:right-auto sm:mt-1.5 sm:max-w-none sm:w-64 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-slate-800 z-50"
        >
          {/* User Profile Header Card - Clean & Light */}
          <div className="p-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${priv.avatarColor}`}>
                {profile.avatarLabel || 'إد'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-800 truncate">
                  {profile.name}
                </h4>
                <div className="mt-1 flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded w-fit">
                    {getRoleIcon()}
                    <span>{isAr ? priv.titleAr : priv.titleEn}</span>
                  </span>
                  {(role === 'TECHNICIAN' || role === 'SALES_REP') && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold w-fit border ${
                      profile.canViewAllDepartmentRecords
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {profile.canViewAllDepartmentRecords
                        ? (isAr ? '• نطاق القسم بالكامل (موسع)' : '• All Dept Records')
                        : (isAr ? '• المسند والمدخل فقط (افتراضي)' : '• Assigned Only')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Language Selector: Compact Segmented Switcher */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium">{isAr ? 'اللغة' : 'Language'}</span>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => {
                  if (language !== 'ar') onToggleLanguage();
                }}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  language === 'ar'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                عربي
              </button>
              <button
                type="button"
                onClick={() => {
                  if (language !== 'en') onToggleLanguage();
                }}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  language === 'en'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Action Items List: Compact & Light */}
          <div className="p-1 space-y-0.5">
            {/* Change Password */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onChangePassword();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>{isAr ? 'تغيير الرقم السري' : 'Change Password'}</span>
              </div>
              {isAr ? <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />}
            </button>

            {/* Switch User / Portal */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSwitchUser();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                <span>{isAr ? 'تبديل المستخدم' : 'Switch User'}</span>
              </div>
              {isAr ? <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />}
            </button>

            <div className="my-1 border-t border-slate-100" />

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </div>
              {isAr ? <ChevronLeft className="w-3.5 h-3.5 text-rose-400" /> : <ChevronRight className="w-3.5 h-3.5 text-rose-400" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
