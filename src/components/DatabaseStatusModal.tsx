import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, Server, ExternalLink, ShieldCheck, Activity } from 'lucide-react';
import { AppLanguage } from '../utils/translations';

export interface DbStatusInfo {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'checking';
  host?: string;
  port?: number;
  database?: string;
  message?: string;
  lastChecked?: string;
}

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusInfo: DbStatusInfo;
  onRecheck: () => Promise<void>;
  language: AppLanguage;
  customDbUrl: string;
  onSaveCustomDbUrl: (url: string) => Promise<void>;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  statusInfo,
  onRecheck,
  language,
  customDbUrl,
  onSaveCustomDbUrl
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState(customDbUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRecheck();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveCustomDbUrl(dbUrlInput.trim());
      await onRecheck();
    } finally {
      setIsSaving(false);
    }
  };

  const isConnected = statusInfo.connected;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 sm:zoom-in-95 duration-200 flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Mobile Swipe Indicator */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-slate-900">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${
              isConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{isAr ? 'قاعدة بيانات PostgreSQL' : 'PostgreSQL Database'}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {isConnected ? (isAr ? 'متصل' : 'ONLINE') : (isAr ? 'غير متصل' : 'OFFLINE')}
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {isAr ? 'فحص الاتصال والاستجابة المباشر' : 'Live connection & health check'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body for Mobile */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Status Banner */}
          <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-start gap-3">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs sm:text-sm">
                  {isConnected
                    ? (isAr ? 'قاعدة البيانات متصلة وتعمل بكفاءة' : 'Database Connected & Operational')
                    : (isAr ? 'قاعدة البيانات غير متصلة حالياً' : 'Database Currently Disconnected')}
                </div>
                <div className="text-[11px] sm:text-xs opacity-90 mt-1 break-words leading-relaxed">
                  {statusInfo.message || (isConnected 
                    ? (isAr ? 'خادم قاعدة البيانات يستجيب بنجاح' : 'Database server is responding properly') 
                    : (isAr ? 'يرجى التحقق من متغير DATABASE_URL أو عنوان الخادم' : 'Please verify DATABASE_URL or database host'))}
                </div>
              </div>
            </div>
          </div>

          {/* Connection Details Cards - Responsive Grid */}
          <div className="bg-slate-800/60 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-700/60 space-y-2 text-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'بيانات الخادم والاتصال' : 'Connection Telemetry'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex justify-between sm:flex-col sm:justify-start gap-1">
                <span className="text-[11px] text-slate-400">{isAr ? 'الخادم (Host):' : 'Host:'}</span>
                <span className="font-mono text-xs font-semibold text-slate-200 truncate">{statusInfo.host || 'localhost'}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex justify-between sm:flex-col sm:justify-start gap-1">
                <span className="text-[11px] text-slate-400">{isAr ? 'المنفذ (Port):' : 'Port:'}</span>
                <span className="font-mono text-xs font-semibold text-slate-200">{statusInfo.port || 5432}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex justify-between sm:flex-col sm:justify-start gap-1">
                <span className="text-[11px] text-slate-400">{isAr ? 'اسم القاعدة (DB):' : 'Database:'}</span>
                <span className="font-mono text-xs font-semibold text-slate-200 truncate">{statusInfo.database || 'postgres'}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex justify-between sm:flex-col sm:justify-start gap-1">
                <span className="text-[11px] text-slate-400">{isAr ? 'آخر فحص:' : 'Last Checked:'}</span>
                <span className="font-mono text-xs font-semibold text-slate-200">
                  {statusInfo.lastChecked ? new Date(statusInfo.lastChecked).toLocaleTimeString() : (isAr ? 'الآن' : 'Just now')}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Connection String Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {isAr ? 'رابط اتصال PostgreSQL (اختياري / إعداد مخصص):' : 'PostgreSQL Connection URL (Optional / Custom):'}
              </label>
              <input
                type="text"
                value={dbUrlInput}
                onChange={(e) => setDbUrlInput(e.target.value)}
                placeholder="postgresql://user:password@host:5432/dbname"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                dir="ltr"
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {isAr 
                  ? 'يتم الفحص تلقائياً عبر متغير البيئة DATABASE_URL أو الرابط المدخل هنا.'
                  : 'Checks automatically via DATABASE_URL or the custom connection URL above.'}
              </p>
            </div>

            {/* Responsive Actions on Mobile: stacked or side-by-side */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50 min-h-[42px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                {isAr ? 'إعادة الفحص الآن' : 'Re-check Now'}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[42px]"
              >
                {isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ واختبار' : 'Save & Test')}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0 pb-safe">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>PostgreSQL Driver v15+</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
