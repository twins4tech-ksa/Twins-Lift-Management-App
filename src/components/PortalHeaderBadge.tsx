import React from 'react';
import { UserProfile, ROLE_PRIVILEGES_MAP, SAMPLE_USER_PROFILES } from '../types/portal';
import { Shield, ChevronDown, User, Wrench, Building2, Briefcase } from 'lucide-react';

interface Props {
  currentUser?: UserProfile | null;
  onOpenSwitcher: () => void;
  isAr?: boolean;
}

export const PortalHeaderBadge: React.FC<Props> = ({
  currentUser,
  onOpenSwitcher,
  isAr = true,
}) => {
  const profile = currentUser && currentUser.role && ROLE_PRIVILEGES_MAP[currentUser.role] 
    ? currentUser 
    : SAMPLE_USER_PROFILES[0];
  const role = profile.role || 'MANAGEMENT';
  const priv = ROLE_PRIVILEGES_MAP[role] || ROLE_PRIVILEGES_MAP.MANAGEMENT;

  const getRoleIcon = () => {
    switch (role) {
      case 'MANAGEMENT':
        return <Shield className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'TECHNICIAN':
        return <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'CUSTOMER':
        return <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'SALES_REP':
        return <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      default:
        return <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  const displayName = profile.name || profile.nameEn || (isAr ? 'المدير العام' : 'General Manager');

  return (
    <button
      type="button"
      onClick={onOpenSwitcher}
      className="group relative flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 text-right cursor-pointer select-none shadow-xs"
      title={isAr ? 'اضغط لتبديل البوابة والصلاحية' : 'Click to switch portal & privilege'}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${priv.avatarColor}`}>
          {profile.avatarLabel || 'إد'}
        </div>

        <div className="flex flex-col items-start leading-tight min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {getRoleIcon()}
            <span className="text-xs font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-600">
              {priv.titleAr}
            </span>
            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-mono border border-blue-200">
              {role}
            </span>
          </div>
        </div>
      </div>

      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-y-0.5 shrink-0" />
    </button>
  );
};
