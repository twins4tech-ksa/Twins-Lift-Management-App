import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Wand2, 
  Building2, 
  Users, 
  AlertTriangle, 
  Wrench, 
  BadgeCheck, 
  Award, 
  Clock, 
  X,
  ChevronDown,
  Boxes
} from 'lucide-react';
import { AppLanguage } from '../utils/translations';
import { UserPortalRole } from '../types/portal';

export interface QuickCreateMenuProps {
  language: AppLanguage;
  currentRole?: UserPortalRole;
  onNewQuotation: () => void;
  onNewProject: () => void;
  onNewCustomer: () => void;
  onNewBreakdown: () => void;
  onNewContract: () => void;
  onNewSalesContract: () => void;
  onNewEmployee: () => void;
  onNewAttendance: () => void;
  onNewInventoryItem?: () => void;
  variant?: 'navbar' | 'sidebar' | 'mobile';
  className?: string;
}

export const QuickCreateMenu: React.FC<QuickCreateMenuProps> = ({
  language,
  currentRole = 'MANAGEMENT',
  onNewQuotation,
  onNewProject,
  onNewCustomer,
  onNewBreakdown,
  onNewContract,
  onNewSalesContract,
  onNewEmployee,
  onNewAttendance,
  onNewInventoryItem,
  variant = 'navbar',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAr = language === 'ar';

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

  const items = [
    {
      id: 'quotation',
      titleAr: 'عرض سعر مصعد',
      titleEn: 'New Quotation',
      icon: Wand2,
      iconColor: 'text-blue-500',
      action: () => {
        setIsOpen(false);
        onNewQuotation();
      },
      roles: ['MANAGEMENT', 'SALES_REP']
    },
    {
      id: 'project',
      titleAr: 'مشروع مصعد',
      titleEn: 'New Project',
      icon: Building2,
      iconColor: 'text-indigo-500',
      action: () => {
        setIsOpen(false);
        onNewProject();
      },
      roles: ['MANAGEMENT', 'SALES_REP']
    },
    {
      id: 'customer',
      titleAr: 'تسجيل عميل',
      titleEn: 'New Customer',
      icon: Users,
      iconColor: 'text-emerald-500',
      action: () => {
        setIsOpen(false);
        onNewCustomer();
      },
      roles: ['MANAGEMENT', 'SALES_REP']
    },
    {
      id: 'breakdown',
      titleAr: 'بلاغ عطل وطوارئ',
      titleEn: 'Emergency Breakdown',
      icon: AlertTriangle,
      iconColor: 'text-rose-500',
      action: () => {
        setIsOpen(false);
        onNewBreakdown();
      },
      roles: ['MANAGEMENT', 'TECHNICIAN', 'CUSTOMER']
    },
    {
      id: 'maintenance_contract',
      titleAr: 'عقد صيانة',
      titleEn: 'Maintenance Contract',
      icon: Wrench,
      iconColor: 'text-amber-500',
      action: () => {
        setIsOpen(false);
        onNewContract();
      },
      roles: ['MANAGEMENT']
    },
    {
      id: 'sales_contract',
      titleAr: 'عقد بيع وتوريد',
      titleEn: 'Sales Contract',
      icon: BadgeCheck,
      iconColor: 'text-teal-500',
      action: () => {
        setIsOpen(false);
        onNewSalesContract();
      },
      roles: ['MANAGEMENT', 'SALES_REP']
    },
    {
      id: 'employee',
      titleAr: 'إضافة موظف / كادر جديد (كافة التخصصات)',
      titleEn: 'Add New Staff Member',
      icon: Award,
      iconColor: 'text-sky-500',
      action: () => {
        setIsOpen(false);
        onNewEmployee();
      },
      roles: ['MANAGEMENT']
    },
    {
      id: 'attendance',
      titleAr: 'تسجيل دوام ميداني',
      titleEn: 'Field Attendance',
      icon: Clock,
      iconColor: 'text-purple-500',
      action: () => {
        setIsOpen(false);
        onNewAttendance();
      },
      roles: ['MANAGEMENT', 'TECHNICIAN']
    },
    {
      id: 'inventory_item',
      titleAr: 'إضافة صنف للمستودع',
      titleEn: 'New Stock Item',
      icon: Boxes,
      iconColor: 'text-amber-500',
      action: () => {
        setIsOpen(false);
        if (onNewInventoryItem) onNewInventoryItem();
      },
      roles: ['MANAGEMENT']
    }
  ];

  // Filter items accessible to the current user role
  const filteredItems = items.filter(
    (item) => !item.roles || item.roles.includes(currentRole)
  );

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all active:scale-[0.98] group"
          title={isAr ? 'جديد' : 'New'}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Plus className="w-3 h-3 stroke-[2.5]" />
            </span>
            <span>{isAr ? 'جديد' : 'New'}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-blue-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : variant === 'mobile' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
          title={isAr ? 'جديد' : 'New'}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isAr ? 'جديد' : 'New'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        /* Navbar Variant: Standout CTA button with smooth interactive hover transitions */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ease-out cursor-pointer select-none ${
            isOpen
              ? 'bg-blue-600 text-white ring-2 ring-blue-300/80 ring-offset-1 ring-offset-[#0B1E3B] shadow-md shadow-blue-500/40 scale-[1.02]'
              : 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:via-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 hover:border-blue-300/80 shadow-sm shadow-blue-900/40 hover:shadow-lg hover:shadow-blue-500/35 hover:scale-[1.05] active:scale-[0.97]'
          }`}
          title={isAr ? 'جديد' : 'New'}
        >
          <span className="w-4 h-4 rounded bg-white/20 group-hover:bg-white/30 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110">
            <Plus className="w-3 h-3 stroke-[2.5] transition-transform duration-300 ease-out group-hover:rotate-90" />
          </span>
          <span className="text-xs tracking-wide">{isAr ? 'جديد' : 'New'}</span>
          <ChevronDown className={`w-3 h-3 text-blue-100 transition-all duration-300 ease-out ${isOpen ? 'rotate-180 text-white' : 'group-hover:translate-y-0.5'}`} />
        </button>
      )}

      {/* Dropdown Popover: Ultra-compact, Light colors, Simple Icons */}
      {isOpen && (
        <div 
          dir={isAr ? 'rtl' : 'ltr'}
          className={`fixed top-16 left-3 right-3 max-w-xs mx-auto sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:mt-1.5 sm:max-w-none ${
            variant === 'sidebar' ? 'w-full sm:w-56' : 'w-56 sm:w-60'
          } rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-slate-800 z-50`}
        >
          {/* Header */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                {isAr ? 'إضافة جديد' : 'Quick Add'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Items List: Clean, Single-Line, Compact */}
          <div className="p-1 space-y-0.5 max-h-[65vh] overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-right rtl:text-right ltr:text-left transition-colors duration-100 group hover:bg-slate-100 active:bg-blue-50"
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.iconColor} group-hover:scale-110 transition-transform`} />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 group-hover:font-semibold truncate">
                    {isAr ? item.titleAr : item.titleEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
