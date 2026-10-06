import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  isAr?: boolean;
  variant?: 'header' | 'banner' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  isAr = true,
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2.5 rounded-2xl shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">{isAr ? 'تثبيت تطبيق Twins Lift الميداني' : 'Install Twins Lift App'}</p>
              <p className="text-[10px] text-blue-100 truncate">{isAr ? 'يعمل دون إنترنت في الآبار والبدروم' : 'Works offline in elevator shafts & basements'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={install}
            className="px-3.5 py-1.5 bg-white text-blue-800 rounded-xl text-xs font-black hover:bg-blue-50 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            {isAr ? 'تثبيت الآن' : 'Install Now'}
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
        title={isAr ? 'تثبيت التطبيق على جهازك' : 'Install PWA App'}
      >
        <Download className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
        <span className="hidden sm:inline">{isAr ? 'تثبيت التطبيق' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          title={isAr ? 'تثبيت على الآيفون' : 'Install on iPhone'}
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">{isAr ? 'تثبيت (iOS)' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isAr ? 'تثبيت التطبيق على iPhone / iPad' : 'Install on iPhone / iPad'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <span>{isAr ? 'اضغط زر المشاركة' : 'Tap the Share icon'}</span>
                      <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'في شريط متصفح Safari السفلي' : 'in the Safari bottom toolbar'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <span>{isAr ? 'اختر "إضافة إلى الصفحة الرئيسية"' : 'Select "Add to Home Screen"'}</span>
                      <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'لتشغيله كتطبيق أصلي بكامل الشاشة وبدون إنترنت' : 'To run standalone like a native app'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isAr ? 'فهمت، حسناً' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
