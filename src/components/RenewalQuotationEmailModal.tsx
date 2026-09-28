import React, { useState, useMemo } from 'react';
import {
  Mail,
  X,
  Copy,
  Check,
  Send,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Building2,
  Phone,
  Clock,
  ShieldCheck,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { MaintenanceContract } from '../types/maintenance';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import { generateRenewalEmail, getRenewalPeriod } from '../utils/renewalEmailTemplate';
import { getContractExpiryInfo } from '../utils/maintenanceExpiry';

export interface RenewalQuotationEmailModalProps {
  isOpen: boolean;
  contract: MaintenanceContract | null;
  companySettings: CompanySettings;
  language: AppLanguage;
  onClose: () => void;
  onRenewInSystem?: (contract: MaintenanceContract) => void;
  onShowToast?: (msg: string) => void;
}

export const RenewalQuotationEmailModal: React.FC<RenewalQuotationEmailModalProps> = ({
  isOpen,
  contract,
  companySettings,
  language,
  onClose,
  onRenewInSystem,
  onShowToast,
}) => {
  if (!isOpen || !contract) return null;

  const isInitialAr = language === 'ar';
  const [templateLang, setTemplateLang] = useState<AppLanguage>(language);
  const isAr = templateLang === 'ar';

  const [customPrice, setCustomPrice] = useState<number>(contract.totalPrice || 12000);
  const [recipientEmail, setRecipientEmail] = useState<string>(contract.customerEmail || '');
  const [ccEmail, setCcEmail] = useState<string>(companySettings.email || 'info@twins4tech.com');
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditingCustomBody, setIsEditingCustomBody] = useState<boolean>(false);

  // Expiry calculation
  const expiryInfo = getContractExpiryInfo(contract, 30);
  const diffDays = expiryInfo?.diffDays ?? 30;

  // Base renewal template calculation
  const baseEmail = useMemo(() => {
    return generateRenewalEmail(contract, companySettings, templateLang, customPrice);
  }, [contract, companySettings, templateLang, customPrice]);

  const [subject, setSubject] = useState<string>(baseEmail.subject);
  const [body, setBody] = useState<string>(baseEmail.body);

  // Sync subject and body when base parameters change (if not manually customized)
  React.useEffect(() => {
    if (!isEditingCustomBody) {
      setSubject(baseEmail.subject);
      setBody(baseEmail.body);
    }
  }, [baseEmail, isEditingCustomBody]);

  // Recipient sync if contract changes
  React.useEffect(() => {
    setRecipientEmail(contract.customerEmail || '');
    setCustomPrice(contract.totalPrice || 12000);
  }, [contract]);

  const { startDate: renewalStart, endDate: renewalEnd, renewalYear } = getRenewalPeriod(contract.endDate);

  const handleCopyEmail = async () => {
    try {
      const fullText = `الموضوع / Subject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      onShowToast?.(isAr ? 'تم نسخ نص الإيميل بنجاح!' : 'Email body copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Failed to copy', e);
    }
  };

  const handleOpenMailClient = () => {
    const mailtoParams = new URLSearchParams();
    if (ccEmail) mailtoParams.append('cc', ccEmail);
    mailtoParams.append('subject', subject);
    mailtoParams.append('body', body);

    const targetUrl = `mailto:${encodeURIComponent(recipientEmail)}?${mailtoParams.toString()}`;
    window.location.href = targetUrl;
    onShowToast?.(isAr ? 'تم فتح تطبيق البريد لإرسال عرض التجديد' : 'Mail client opened to send renewal quote');
  };

  const handleRenewInSystemClick = () => {
    if (onRenewInSystem) {
      onRenewInSystem(contract);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  {isAr ? 'إرسال عرض تجديد عقد الصيانة عبر البريد الإلكتروني' : 'Send Maintenance Contract Renewal Quotation'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {diffDays <= 0 ? (isAr ? 'منتهي' : 'Expired') : `${isAr ? 'متبقي' : ''} ${diffDays} ${isAr ? 'يوماً' : 'days'}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {isAr
                  ? 'نموذج بريد رسمي متكامل لإشعار العميل واقتراح التجديد السنوي لضمان استمرارية الخدمة'
                  : 'Built-in renewal quotation email template to notify the client and safeguard retention'}
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

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
          {/* 1. Contract Overview Banner & Expiry Alert */}
          <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-900 border border-amber-300 text-xs">
                    {contract.contractRef}
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs">
                    {contract.title}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                  <span>
                    <strong>{isAr ? 'العميل: ' : 'Client: '}</strong>
                    {contract.customerName} {contract.customerCompany ? `(${contract.customerCompany})` : ''}
                  </span>
                  <span>&bull;</span>
                  <span>
                    <strong>{isAr ? 'المصعد: ' : 'Elevator: '}</strong>
                    {contract.elevatorName}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-start sm:text-end shrink-0 bg-white/80 p-2 sm:p-2.5 rounded-lg border border-amber-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">
                {isAr ? 'تاريخ نهاية العقد الحالي' : 'Current Expiry Date'}
              </div>
              <div className="text-xs font-black text-rose-700 font-mono mt-0.5 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{contract.endDate}</span>
              </div>
              <div className="text-[10px] font-bold text-amber-700 mt-0.5">
                {diffDays <= 0
                  ? (isAr ? 'العقد منتهي ويتطلب تجديداً فورياً' : 'Expired, immediate renewal recommended')
                  : (isAr ? `ينتهي خلال ${diffDays} يوماً` : `Expires in ${diffDays} days`)}
              </div>
            </div>
          </div>

          {/* 2. Renewal Proposal Quick Settings Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {/* Proposed Annual Price */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {isAr ? 'سعر التجديد السنوي المقترح (ر.س)' : 'Proposed Renewal Price (SAR)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={customPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setCustomPrice(val);
                  }}
                  className="w-full text-xs font-mono font-bold py-1.5 ps-2.5 pe-8 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500"
                />
                <SaudiRiyalSymbol className="w-3.5 h-3.5 text-emerald-600 absolute inset-y-0 end-2.5 my-auto" />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isAr ? `السعر السابق: ${(contract.totalPrice || 0).toLocaleString()} ر.س` : `Previous: SAR ${(contract.totalPrice || 0).toLocaleString()}`}
              </span>
            </div>

            {/* Proposed Renewal Period */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {isAr ? 'فترة التجديد المقترحة (سنة كاملة)' : 'Proposed Renewal Period'}
              </label>
              <div className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px] text-slate-800 font-bold flex items-center justify-between">
                <span>{renewalStart}</span>
                <span className="text-slate-400">{isAr ? 'إلى' : 'to'}</span>
                <span>{renewalEnd}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isAr ? `12 زيارة شهرية + طوارئ 24/7` : '12 monthly visits + 24/7 callouts'}
              </span>
            </div>

            {/* Template Language Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {isAr ? 'لغة مسودة البريد' : 'Email Template Language'}
              </label>
              <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setTemplateLang('ar')}
                  className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                    templateLang === 'ar'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  عربي
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateLang('en')}
                  className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                    templateLang === 'en'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isAr ? 'تحديث فوري لصيغة العرض' : 'Instant template reformatting'}
              </span>
            </div>
          </div>

          {/* 3. Email Addressing Fields (To & CC) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {isAr ? 'المرسل إليه (بريد العميل):' : 'Recipient (Client Email):'}
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder={isAr ? 'client@example.com (يرجى إدخال بريد العميل)' : 'client@example.com'}
                className="w-full text-xs font-mono py-1.5 px-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
              />
              {!recipientEmail && (
                <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                  {isAr ? '⚠️ لم يتم تسجيل بريد لهذا العميل، يرجى كتابته أعلاه' : '⚠️ No email on record, please enter one'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {isAr ? 'نسخة كربونية CC (إدارة العقود والمبيعات):' : 'CC (Contracts / Sales):'}
              </label>
              <input
                type="email"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                placeholder="service@twinselevators.com"
                className="w-full text-xs font-mono py-1.5 px-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 4. Email Subject Line */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700">
                {isAr ? 'موضوع الرسالة (Subject):' : 'Email Subject:'}
              </label>
              <span className="text-[10px] text-slate-400">
                {isAr ? 'يمكنك التعديل يدوياً' : 'Editable'}
              </span>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setIsEditingCustomBody(true);
              }}
              className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 5. Email Body Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'نص مسودة عرض التجديد المعتمد (Body):' : 'Official Renewal Quotation Body:'}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCustomBody(false);
                    setSubject(baseEmail.subject);
                    setBody(baseEmail.body);
                    onShowToast?.(isAr ? 'تمت إعادة تعيين النص الأصلي' : 'Reset to default template');
                  }}
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>{isAr ? 'إعادة تعيين القالب' : 'Reset Template'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={11}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setIsEditingCustomBody(true);
              }}
              className="w-full text-[11.5px] font-sans leading-relaxed p-3 rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800"
              dir={isAr ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* System renewal shortcut */}
          <div className="w-full sm:w-auto">
            {onRenewInSystem && (
              <button
                type="button"
                onClick={handleRenewInSystemClick}
                className="w-full sm:w-auto px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title={isAr ? 'إنشاء وتجديد العقد مباشرة داخل النظام' : 'Renew contract directly in system'}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'إنشاء العقد الجديد في النظام' : 'Renew in System'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الإيميل' : 'Copy Email')}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenMailClient}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isAr ? 'إرسال عبر بريد العميل (Mailto)' : 'Send via Mail Client'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
