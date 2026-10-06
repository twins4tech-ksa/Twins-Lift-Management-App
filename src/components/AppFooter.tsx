import React from 'react';
import { AppLanguage } from '../utils/translations';
import { 
  ArrowUp, 
  ShieldCheck, 
  Wrench, 
  Building2, 
  Globe, 
  Mail, 
  Phone,
  Home
} from 'lucide-react';

interface AppFooterProps {
  language: AppLanguage;
  onGoHome?: () => void;
  onToggleLanguage?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  language,
  onGoHome,
  onToggleLanguage,
  onNavigateTab,
}) => {
  const isAr = language === 'ar';

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer 
      id="app-global-footer"
      className="no-print mt-auto w-full bg-[#050D1E] text-slate-300 border-t border-[#132A58] shadow-xl relative overflow-hidden select-none"
    >
      {/* Top Hairline Gradient Highlight Bar */}
      <div className="w-full h-0.5 bg-gradient-to-r from-blue-600 via-amber-400 via-emerald-400 to-blue-500 opacity-90" />

      {/* Main Full-Width Content Container - Compact & Sleek Height */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-6">
          
          {/* 1. Brand Identity with PNG Logo (No SVG) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onGoHome}
              className="cursor-pointer flex items-center gap-2.5 p-1 -m-1 rounded-xl hover:bg-white/5 transition-all text-start rtl:text-right ltr:text-left focus:outline-hidden"
              title={isAr ? 'الصفحة الرئيسية لتطبيق توينز' : 'Twins App Home'}
            >
              {/* PNG Logo - Strictly PNG Image, Not converted to SVG */}
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/90 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                <img
                  src="/twins4tech.png"
                  alt="Twins Technology Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src.indexOf('twins_logo.png') === -1) {
                      target.src = '/twins_logo.png';
                    }
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white tracking-tight hover:text-amber-300 transition-colors">
                    {isAr ? 'شركة توينز للتقنية' : 'Twins Technology'}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    v3.5 ERP
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                  {isAr 
                    ? 'أنظمة المصاعد المتطورة وحسابات المشاريع' 
                    : 'Advanced Elevator Systems & Cloud Suite'}
                </div>
              </div>
            </button>
          </div>

          {/* Direct Contact: Email (Send email directly on click, NO copy) + Egypt & Saudi Phones */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap justify-center text-xs">
            {/* Email - Direct mailto click without copy button */}
            <a
              href="mailto:info@twins4tech.com"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-blue-950/80 border border-slate-700/80 hover:border-blue-500/50 text-amber-300 hover:text-white transition-all font-mono font-bold shadow-2xs group"
              title={isAr ? 'إرسال بريد إلكتروني مباشر إلى info@twins4tech.com' : 'Send email directly to info@twins4tech.com'}
              dir="ltr"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              <span>info@twins4tech.com</span>
            </a>

            {/* Saudi Arabia Hotline */}
            <a
              href="tel:+966548764412"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 transition-all font-mono text-[11px] font-semibold shadow-2xs group"
              title={isAr ? 'Saudi Hotline: +966 54 876 4412' : 'Saudi Hotline: +966 54 876 4412'}
              dir="ltr"
            >
              <Phone className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-slate-400 font-sans text-[10px] mr-0.5">🇸🇦</span>
              <span>+966 54 876 4412</span>
            </a>

            {/* Egypt Hotline */}
            <a
              href="tel:+201063131831"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 transition-all font-mono text-[11px] font-semibold shadow-2xs group"
              title={isAr ? 'Egypt Hotline: +20 10 63131 831' : 'Egypt Hotline: +20 10 63131 831'}
              dir="ltr"
            >
              <Phone className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-slate-400 font-sans text-[10px] mr-0.5">🇪🇬</span>
              <span>+20 10 63131 831</span>
            </a>

            {/* Compact Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onToggleLanguage && (
                <button
                  type="button"
                  onClick={onToggleLanguage}
                  className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-bold transition-colors hover:text-white cursor-pointer"
                  title={isAr ? 'Switch to English' : 'التحويل للعربية'}
                >
                  <Globe className="w-3 h-3 inline-block mr-1 text-blue-400" />
                  <span>{isAr ? 'EN' : 'عربي'}</span>
                </button>
              )}

              {onGoHome && (
                <button
                  type="button"
                  onClick={onGoHome}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
                  title={isAr ? 'الرئيسية' : 'Home'}
                >
                  <Home className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={scrollToTop}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                title={isAr ? 'للأعلى' : 'Scroll to top'}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Bottom Copyright Row */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] text-slate-400">
          <div>
            <span>© {new Date().getFullYear()} </span>
            <span className="font-bold text-slate-300">{isAr ? 'شركة توينز للتقنية (Twins Technology).' : 'Twins Technology.'}</span>
            <span> {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</span>
          </div>
          <div className="text-slate-400">
            {isAr 
              ? 'المملكة العربية السعودية • جمهورية مصر العربية' 
              : 'Kingdom of Saudi Arabia • Egypt'}
          </div>
        </div>
      </div>
    </footer>
  );
};
