import React, { useState, useEffect } from 'react';
import { ElevatorSpecification } from '../types/elevator';
import { 
  buildProjectDigitalUrl, 
  generateProjectQRDataUrl, 
  ProjectQRConfig 
} from '../utils/qrCodeGenerator';
import { QrCode, Copy, Check, ExternalLink, ShieldCheck, Smartphone } from 'lucide-react';

interface Props {
  spec: ElevatorSpecification;
  docScope?: string;
  size?: number;
  primaryColor?: string;
  showLabel?: boolean;
  showActions?: boolean;
  className?: string;
}

export const ProjectQRCode: React.FC<Props> = ({
  spec,
  docScope = 'UNIFIED_MASTER',
  size = 96,
  primaryColor = '#172033',
  showLabel = true,
  showActions = true,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [digitalUrl, setDigitalUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refCode = spec.quoteRef || spec.id || 'TWINS-REF';

  useEffect(() => {
    let isMounted = true;
    const url = buildProjectDigitalUrl(spec, docScope);
    setDigitalUrl(url);

    const config: ProjectQRConfig = {
      docScope,
      size: size * 2.5, // Render at 2.5x resolution for ultra-sharp print quality
      margin: 1,
      darkColor: primaryColor || '#172033',
      lightColor: '#ffffff',
      errorCorrectionLevel: 'M',
    };

    setIsLoading(true);
    generateProjectQRDataUrl(spec, config)
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [spec.id, spec.quoteRef, docScope, size, primaryColor]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!digitalUrl) return;
    navigator.clipboard.writeText(digitalUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  const handleOpenDigitalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!digitalUrl) return;
    window.open(digitalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div 
        className={`group relative inline-flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all ${className}`}
        style={{ minWidth: size + 20 }}
      >
        {/* QR Code Container */}
        <div 
          className="relative flex items-center justify-center bg-white cursor-pointer select-none"
          style={{ width: size, height: size }}
          onClick={() => setShowModal(true)}
          title="انقر لتكبير رمز الاستجابة السريعة ومعاينة الرابط الرقمي (Click to enlarge QR code)"
        >
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`QR Code for project ${refCode}`}
              className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded text-slate-400">
              <QrCode className="w-7 h-7 animate-pulse text-slate-400" />
              <span className="text-[8px] mt-1 font-mono">Generating QR...</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded text-slate-400">
              <QrCode className="w-8 h-8" />
            </div>
          )}

          {/* Hover interactive overlay (hidden in print) */}
          <div className="print:hidden absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center text-white p-1">
            <Smartphone className="w-4 h-4 text-emerald-300 mb-0.5" />
            <span className="text-[8px] font-bold text-center leading-tight">
              فحص الرابط الرقمي
            </span>
            <span className="text-[7px] text-slate-300">انقر للتكبير</span>
          </div>
        </div>

        {/* Labels below QR */}
        {showLabel && (
          <div className="flex flex-col items-center text-center mt-1.5 w-full">
            <span className="text-[8.5px] font-mono font-extrabold text-slate-800 tracking-tight flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 inline print:hidden" />
              VERIFIED DIGITAL
            </span>
            <span className="text-[8px] font-mono font-bold text-slate-600 truncate max-w-[120px]" title={refCode}>
              {refCode}
            </span>
          </div>
        )}

        {/* Action quick buttons (hidden in print) */}
        {showActions && (
          <div className="print:hidden flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-100 w-full justify-center">
            <button
              type="button"
              onClick={handleCopyLink}
              title="نسخ رابط النسخة الرقمية (Copy digital URL)"
              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 text-[9px] font-medium"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>
            <span className="text-slate-200">|</span>
            <button
              type="button"
              onClick={handleOpenDigitalLink}
              title="فتح النسخة الرقمية في نافذة جديدة"
              className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Enlarged QR Modal / Digital Project Verification */}
      {showModal && (
        <div 
          className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                النسخة الرقمية المعتمدة للمشروع
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              امسح الرمز بكاميرا الجوال أو انسخ الرابط للوصول المباشر إلى تفاصيل العرض الفني والمالي
            </p>

            {/* Large QR Display */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block mb-3 shadow-inner">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt={`Enlarged QR Code ${refCode}`}
                  className="w-52 h-52 mx-auto rounded"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
            </div>

            {/* Project Reference Badges */}
            <div className="space-y-1 mb-4 text-xs font-mono">
              <div className="flex justify-between bg-slate-100 px-3 py-1.5 rounded text-slate-700">
                <span className="font-sans text-slate-500">رقم المرجع:</span>
                <span className="font-bold text-blue-700">{refCode}</span>
              </div>
              <div className="flex justify-between bg-slate-100 px-3 py-1.5 rounded text-slate-700">
                <span className="font-sans text-slate-500">اسم العميل:</span>
                <span className="font-sans font-bold text-slate-800 truncate max-w-[160px]">
                  {spec.clientName || 'عميل معتمد'}
                </span>
              </div>
              {spec.projectName && (
                <div className="flex justify-between bg-slate-100 px-3 py-1.5 rounded text-slate-700">
                  <span className="font-sans text-slate-500">المشروع:</span>
                  <span className="font-sans text-slate-800 truncate max-w-[160px]">
                    {spec.projectName}
                  </span>
                </div>
              )}
            </div>

            {/* Digital Link Display Box */}
            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-left font-mono text-[10px] break-all select-all mb-4" dir="ltr">
              {digitalUrl}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط النسخة الرقمية'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenDigitalLink}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                title="فتح الرابط الآن"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
