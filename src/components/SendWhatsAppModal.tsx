import React, { useState, useEffect } from 'react';
import { 
  SendWhatsAppPayload, 
  sendWhatsAppMessage, 
  formatWhatsAppNumber, 
  generateWaMeUrl, 
  getWhatsAppConfig,
  checkWhatsAppConnection
} from '../services/whatsappService';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  X, 
  Loader2, 
  Phone, 
  Wifi, 
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultMessage?: string;
  recipientName?: string;
  contextTitle?: string;
  isAr?: boolean;
}

export const SendWhatsAppModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultPhone = '',
  defaultMessage = '',
  recipientName = '',
  contextTitle = '',
  isAr = true,
}) => {
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState(defaultMessage);
  const [priority, setPriority] = useState<'normal' | 'high' | 'critical'>('normal');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    text: string;
    outbox_id?: string;
    fallbackUrl?: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('جاري التحقق...');
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setPhone(defaultPhone);
      setMessage(defaultMessage);
      setSendResult(null);
      checkConnection();
    }
  }, [isOpen, defaultPhone, defaultMessage]);

  const checkConnection = async () => {
    const res = await checkWhatsAppConnection();
    setIsConnected(res.connected);
    setConnectionStatus(res.statusText);
  };

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) return;

    setIsSending(true);
    setSendResult(null);

    const payload: SendWhatsAppPayload = {
      mobile_no: phone,
      message: message,
      priority,
      source: 'twins-app',
    };

    const res = await sendWhatsAppMessage(payload);
    setIsSending(false);

    if (res.success) {
      setSendResult({
        success: true,
        text: isAr ? 'تم إرسال الرسالة إلى قائمة انتظار الواتساب بنجاح! ✅' : 'Message queued successfully! ✅',
        outbox_id: res.outbox_id,
        fallbackUrl: res.fallbackUrl,
      });
    } else {
      setSendResult({
        success: false,
        text: res.error || (isAr ? 'تعذر الإرسال عبر الـ API مباشرة' : 'Failed to send via API'),
        fallbackUrl: res.fallbackUrl || generateWaMeUrl(phone, message),
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formattedPreview = formatWhatsAppNumber(phone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base">
                  {isAr ? 'إرسال رسالة واتساب' : 'Send WhatsApp Message'}
                </h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-300' : 'bg-amber-300'}`}></span>
                  API v1.0
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80">
                {contextTitle || (recipientName ? `${isAr ? 'إلى:' : 'To:'} ${recipientName}` : (isAr ? 'عبر بوابة Twins WA Integration' : 'Via Twins WA API'))}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Status Banner */}
          {sendResult ? (
            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
              sendResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-start gap-2.5">
                {sendResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-black text-xs sm:text-sm">{sendResult.text}</div>
                  {sendResult.outbox_id && (
                    <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      {isAr ? 'معرف الإرسال:' : 'Outbox ID:'} {sendResult.outbox_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Direct WhatsApp Fallback Link */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-slate-600">
                  {sendResult.success 
                    ? (isAr ? 'يمكنك أيضاً فتح المحادثة مباشرة في واتساب:' : 'Open directly in WhatsApp:')
                    : (isAr ? 'اضغط لفتح المحادثة في واتساب مباشرة:' : 'Open in WhatsApp directly:')}
                </span>
                {sendResult.fallbackUrl && (
                  <a
                    href={sendResult.fallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                  >
                    <span>{isAr ? 'فتح في واتساب' : 'Open in WhatsApp'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSend} className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'رقم الهاتف (واتساب):' : 'Phone Number (WhatsApp):'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050XXXXXXXX أو 9665XXXXXXXX"
                  className="w-full text-xs sm:text-sm ps-9 pe-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono bg-slate-50 focus:bg-white"
                  required
                />
              </div>
              {formattedPreview && (
                <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                  <span>{isAr ? 'الصيغة الدولية المعتمدة:' : 'International Format:'}</span>
                  <span className="font-bold text-slate-700">+{formattedPreview}</span>
                </div>
              )}
            </div>

            {/* Priority & Source */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'درجة الأولوية:' : 'Priority:'}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-700"
                >
                  <option value="normal">{isAr ? 'عادية (Normal)' : 'Normal'}</option>
                  <option value="high">{isAr ? 'عالية (High)' : 'High'}</option>
                  <option value="critical">{isAr ? 'حرجة / طارئة (Critical)' : 'Critical'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'بوابة الإرسال:' : 'Gateway:'}
                </label>
                <div className="py-2 px-2.5 bg-slate-100 rounded-xl text-xs text-slate-600 font-mono truncate border border-slate-200">
                  wa.serv-1001.twins4tech.com
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'نص الرسالة:' : 'Message Text:'}
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ النص' : 'Copy')}</span>
                </button>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white leading-relaxed resize-y font-sans"
                placeholder={isAr ? 'اكتب نص الرسالة هنا...' : 'Enter message text here...'}
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <a
                href={generateWaMeUrl(phone, message)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                title={isAr ? 'فتح المحادثة في تطبيق واتساب' : 'Open in WhatsApp Web / App'}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'فتح في واتساب' : 'WhatsApp Web'}</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSending || !phone.trim() || !message.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري الإرسال عبر API...' : 'Sending via API...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isAr ? 'إرسال عبر API' : 'Send via API'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
