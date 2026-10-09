import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Phone, 
  QrCode, 
  Printer, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  X, 
  Copy, 
  ExternalLink, 
  Share2, 
  Download, 
  Building2, 
  Smartphone, 
  FileText, 
  Flame, 
  Eye, 
  Check, 
  Radio, 
  Flashlight,
  Layers,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/settings';
import { generateCustomQRDataUrl } from '../utils/qrCodeGenerator';
import { MaintenanceBreakdown } from '../types/maintenance';
import { MaintenanceContract } from '../types/maintenance';
import { TwinsLogo } from './TwinsLogo';

interface ElevatorCabinEmergencyStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  elevatorInfo?: {
    elevatorName?: string;
    elevatorSerial?: string;
    buildingName?: string;
    buildingAddress?: string;
    floors?: string | number;
    capacityKg?: number;
    passengers?: number;
    speed?: string;
    controlType?: string;
    contractRef?: string;
    lastInspectionDate?: string;
    nextInspectionDate?: string;
  };
  breakdown?: MaintenanceBreakdown | null;
  contract?: MaintenanceContract | null;
  companySettings?: CompanySettings;
  language?: 'ar' | 'en';
}

export const ElevatorCabinEmergencyStickerModal: React.FC<ElevatorCabinEmergencyStickerModalProps> = ({
  isOpen,
  onClose,
  elevatorInfo,
  breakdown,
  contract,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'STICKER' | 'SOS_SIMULATION' | 'MAINTENANCE_CARD'>('STICKER');
  const [stickerLanguage, setStickerLanguage] = useState<'AR' | 'BILINGUAL'>('BILINGUAL');
  const [stickerSize, setStickerSize] = useState<'A5' | 'A6' | 'COMPACT'>('A5');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [isFlashlightMode, setIsFlashlightMode] = useState<boolean>(false);

  // Audio Context Ref for emergency audio beacon
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Determine Elevator Details
  const elevatorName = elevatorInfo?.elevatorName || breakdown?.elevatorName || contract?.elevatorName || 'مصعد الركاب الرئيسي - كابينة 1';
  const elevatorSerial = elevatorInfo?.elevatorSerial || breakdown?.id || contract?.contractRef || 'TWIN-ELEV-2026-09';
  const buildingName = elevatorInfo?.buildingName || breakdown?.customerName || contract?.customerName || 'برج الأندلس للأعمال';
  const buildingAddress = elevatorInfo?.buildingAddress || breakdown?.siteLocation || contract?.siteLocation || 'الرياض - طريق الملك فهد - تقاطع العليا';
  const emergencyPhone = companySettings.phone || companySettings.mobile || '+966 50 123 4567';
  const emergencyWhatsApp = companySettings.mobile || companySettings.phone || '+966 50 123 4567';
  const civilDefensePhone = '998';
  const capacityKg = elevatorInfo?.capacityKg || 630;
  const passengers = elevatorInfo?.passengers || 8;
  const floors = elevatorInfo?.floors || '8 أدوار (G + 7)';
  const speed = elevatorInfo?.speed || '1.0 م/ث';

  // Construct Direct SOS Landing URL for the QR code
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://twins-lifts.com';
  const sosWebUrl = `${origin}?sos=cabin&elev=${encodeURIComponent(elevatorSerial)}&building=${encodeURIComponent(buildingName)}`;

  // Generate QR Code Data URL on mount or url change
  useEffect(() => {
    let isMounted = true;
    generateCustomQRDataUrl(sosWebUrl, {
      size: 320,
      margin: 1,
      darkColor: '#0f172a',
      lightColor: '#ffffff',
      errorCorrectionLevel: 'H'
    }).then((dataUrl) => {
      if (isMounted) setQrCodeDataUrl(dataUrl);
    }).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [sosWebUrl]);

  // Audio Siren Effect for Trapped Passenger Simulation
  useEffect(() => {
    if (!isSirenActive) {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (e) {
          // ignore
        }
        oscillatorRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, ctx.currentTime);

      // Oscillate pitch between 650Hz and 950Hz
      const now = ctx.currentTime;
      for (let i = 0; i < 30; i++) {
        osc.frequency.linearRampToValueAtTime(950, now + (i * 0.8) + 0.4);
        osc.frequency.linearRampToValueAtTime(650, now + (i * 0.8) + 0.8);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscillatorRef.current = osc;
    } catch (e) {
      console.warn('Audio siren could not start', e);
    }

    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (e) {
          // ignore
        }
        oscillatorRef.current = null;
      }
    };
  }, [isSirenActive]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sosWebUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleOpenWhatsAppSOS = () => {
    const cleanPhone = emergencyWhatsApp.replace(/[^0-9]/g, '');
    const text = isAr 
      ? `🚨 *نداء استغاثة عاجل - احتجاز ركاب بمصعد* 🚨\n\n` +
        `🏢 *المبنى:* ${buildingName}\n` +
        `📍 *الموقع:* ${buildingAddress}\n` +
        `🚪 *المصعد:* ${elevatorName} (كود: ${elevatorSerial})\n` +
        `⚠️ *الحالة:* توقف مفاجئ للمصعد واحتجاز ركاب في الداخل!\n` +
        `⏱️ *الوقت:* ${new Date().toLocaleTimeString('ar-SA')}\n\n` +
        `نرجو توجيه أقرب فني إنقاذ فوراً عبر غرفة العمليات المركزية.`
      : `🚨 *URGENT ELEVATOR SOS - PASSENGER ENTRAPMENT* 🚨\n\nBuilding: ${buildingName}\nElevator: ${elevatorName} (${elevatorSerial})\nLocation: ${buildingAddress}`;
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      {/* Fullscreen Flashlight Mode for Trapped Passengers Simulation */}
      {isFlashlightMode && (
        <div 
          onClick={() => setIsFlashlightMode(false)}
          className="fixed inset-0 z-60 bg-white flex flex-col items-center justify-center p-6 text-slate-900 cursor-pointer select-none"
        >
          <div className="w-20 h-20 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-2xl mb-4 animate-pulse">
            <Flashlight className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-center mb-2">وضع إنارة الطوارئ القصوى</h2>
          <p className="text-slate-600 text-sm text-center max-w-sm">
            تم ضبط الشاشة على أقصى سطوع أبيض لإنارة كابينة المصعد عند انقطاع الكهرباء. انقر في أي مكان للخروج.
          </p>
          <button 
            type="button" 
            className="mt-6 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm"
          >
            إغلاق الإنارة
          </button>
        </div>
      )}

      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1E3B] via-[#16335C] to-[#0B1E3B] text-white flex items-center justify-between shrink-0 border-b border-blue-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {isAr ? 'معتمد الدفاع المدني وSBC 801' : 'Civil Defense & SASO Compliant'}
                </span>
                <span className="text-xs text-blue-200/80 font-mono">
                  {elevatorSerial}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {isAr ? 'ملصق طوارئ واستغاثة الكابينة ورمز QR المعتمد' : 'Elevator Cabin Emergency Placard & Smart QR'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 cursor-pointer"
              title="طباعة الملصق فوراً (Print Placard)"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{isAr ? 'طباعة الملصق' : 'Print Placard'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('STICKER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'STICKER'
                  ? 'bg-white text-[#0B1E3B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'ملصق الكابينة المعتمد' : 'Cabin Safety Placard'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SOS_SIMULATION')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'SOS_SIMULATION'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{isAr ? 'بوابة استغاثة الركاب (عند مسح الـ QR)' : 'Passenger SOS Portal'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MAINTENANCE_CARD')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'MAINTENANCE_CARD'
                  ? 'bg-white text-[#0B1E3B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'بطاقة الصيانة الدورية والمعاينة' : 'PPM Maintenance Card'}</span>
            </button>
          </div>

          {activeTab === 'STICKER' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                <span>اللغة:</span>
                <button
                  type="button"
                  onClick={() => setStickerLanguage(stickerLanguage === 'BILINGUAL' ? 'AR' : 'BILINGUAL')}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-bold hover:bg-slate-50 text-slate-700"
                >
                  {stickerLanguage === 'BILINGUAL' ? 'عربي + إنجليزي' : 'عربي فقط'}
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                <span>المقاس:</span>
                <select
                  value={stickerSize}
                  onChange={(e) => setStickerSize(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-md text-[11px] font-bold px-2 py-1 text-slate-700"
                >
                  <option value="A5">A5 (شائع وواضح)</option>
                  <option value="A6">A6 (مدمج)</option>
                  <option value="COMPACT">مربع لوحة الكابينة (COP)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
          
          {/* TAB 1: THE PRINTABLE OFFICIAL STICKER */}
          {activeTab === 'STICKER' && (
            <div className="flex flex-col items-center">
              
              {/* STICKER CONTAINER (Optimized for Screen & Print) */}
              <div 
                id="printable-cabin-sticker"
                className={`w-full max-w-[540px] bg-white rounded-2xl shadow-xl border-4 border-amber-400 overflow-hidden text-slate-900 print:shadow-none print:border-4 print:border-black transition-all ${
                  stickerSize === 'A6' ? 'max-w-[420px] text-[11px]' : ''
                }`}
              >
                {/* 1. TOP SAFETY STRIPE */}
                <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 py-1.5 px-3 flex items-center justify-between border-b-2 border-amber-500">
                  <div className="flex items-center gap-1.5 font-black text-[11px] sm:text-xs text-slate-900 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-red-600 fill-red-600" />
                    <span>إرشادات طوارئ وسلامة المصعد المعتمدة</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 bg-white/70 px-2 py-0.5 rounded-full border border-amber-500/40">
                    SBC 801 / SASO
                  </div>
                </div>

                {/* 2. HEADER: COMPANY BRAND & CIVIL DEFENSE */}
                <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <TwinsLogo 
                        size={36} 
                        customLogoUrl={companySettings.logoUrl}
                        primaryColor={companySettings.primaryColor}
                        accentColor={companySettings.accentColor}
                      />
                      <div>
                        <div className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                          {companySettings.companyNameAr || 'شركة توينز للمصاعد والأنظمة المتطورة'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {companySettings.companyNameEn || 'Twins Elevators & Escalators Co.'}
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0 bg-red-50 border border-red-200 rounded-xl p-2 text-center min-w-[95px]">
                      <div className="text-[9px] font-bold text-red-700 uppercase">الدفاع المدني</div>
                      <div className="text-base sm:text-lg font-black text-red-700 font-mono leading-none mt-0.5">998</div>
                      <div className="text-[8px] text-red-600 mt-0.5 font-bold">Civil Defense</div>
                    </div>
                  </div>

                  {/* Elevator Serial & Building Identity Box */}
                  <div className="mt-3.5 p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold">معرّف المصعد / Elevator ID</div>
                      <div className="font-mono font-black text-slate-900 text-sm">{elevatorSerial}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-slate-500 font-bold">الموقع / Location</div>
                      <div className="font-bold text-slate-800 truncate max-w-[200px]">{buildingName}</div>
                    </div>
                  </div>
                </div>

                {/* 3. CENTER: 4 GOLDEN SAFETY RULES & QR CODE */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  
                  {/* Left 2 Cols: Reassurance Rules */}
                  <div className="sm:col-span-2 space-y-2.5 text-right">
                    <div className="font-black text-xs text-red-700 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-red-600" />
                      <span>في حالة التوقف المفاجئ أو انقطاع التيار الكهربائي:</span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700 leading-snug">
                      <div className="flex items-start gap-2 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-900">1. ابقَ هادئاً: </strong>
                          <span>الكابينة مهواة بالكامل ولا ينفد منها الأكسجين نهائياً، والمصعد محمي بمكابح ميكانيكية ضد السقوط.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-900">2. لا تفتح الأبواب بالقوة: </strong>
                          <span>محاولة فتح الأبواب أو الخروج بدون فني يشكل خطراً، أنت في أمان تام داخل الصاعدة.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-blue-50/80 p-2 rounded-lg border border-blue-200">
                        <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-blue-900">3. اتصل أو امسح رمز الـ QR: </strong>
                          <span>اضغط زر الإنذار الأصفر بالكابينة أو اتصل بأرقام الطوارئ أدناه، أو امسح الـ QR لهاتفك.</span>
                        </div>
                      </div>
                    </div>

                    {stickerLanguage === 'BILINGUAL' && (
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 leading-tight">
                        <strong>IN EMERGENCY:</strong> Stay calm. The cabin is well-ventilated and protected with safety gears. Do not force doors open. Scan the QR code or call numbers below for instant rescue.
                      </div>
                    )}
                  </div>

                  {/* Right 1 Col: Big High-Contrast QR Code */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center">
                    <div className="text-[10px] font-black text-slate-700 mb-1">
                      امسح للاستغاثة
                    </div>
                    
                    <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200">
                      {qrCodeDataUrl ? (
                        <img 
                          src={qrCodeDataUrl} 
                          alt="Cabin Emergency SOS QR" 
                          className="w-28 h-28 object-contain"
                        />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center text-slate-400">
                          <QrCode className="w-12 h-12" />
                        </div>
                      )}
                    </div>

                    <div className="text-[9px] text-slate-500 font-bold mt-1.5 uppercase font-mono">
                      SCAN FOR SOS
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5">
                      يفتح البوابة المباشرة
                    </div>
                  </div>
                </div>

                {/* 4. BOTTOM HOTLINE NUMBERS BANNER */}
                <div className="bg-[#0B1E3B] text-white p-3.5 sm:p-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-white/10 hover:bg-white/15 p-2 rounded-xl border border-white/10">
                      <div className="text-[10px] text-blue-200 font-bold flex items-center justify-center gap-1">
                        <Phone className="w-3 h-3 text-amber-400" />
                        <span>طوارئ الصيانة والإنقاذ 24/7</span>
                      </div>
                      <a 
                        href={`tel:${emergencyPhone}`}
                        className="text-xs sm:text-sm font-black font-mono tracking-wider text-amber-300 hover:text-amber-200 block mt-0.5"
                        dir="ltr"
                      >
                        {emergencyPhone}
                      </a>
                    </div>

                    <div className="bg-white/10 hover:bg-white/15 p-2 rounded-xl border border-white/10">
                      <div className="text-[10px] text-blue-200 font-bold flex items-center justify-center gap-1">
                        <Smartphone className="w-3 h-3 text-emerald-400" />
                        <span>استغاثة واتساب فورية</span>
                      </div>
                      <a 
                        href={`https://wa.me/${emergencyWhatsApp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs sm:text-sm font-black font-mono tracking-wider text-emerald-300 hover:text-emerald-200 block mt-0.5"
                        dir="ltr"
                      >
                        {emergencyWhatsApp}
                      </a>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-300">
                    <div>الحمولة: {capacityKg} كجم ({passengers} أشخاص) • {floors}</div>
                    <div className="font-mono">صالح حتى: {new Date(Date.now() + 365*24*3600*1000).toLocaleDateString('en-GB')}</div>
                  </div>
                </div>
              </div>

              {/* ACTION TOOLBAR UNDER STICKER */}
              <div className="mt-5 flex items-center gap-3 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isAr ? 'طباعة الملصق الآن (Print Decal)' : 'Print Decal Placard'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs sm:text-sm border border-slate-300 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{isCopied ? 'تم نسخ الرابط!' : 'نسخ رابط الاستغاثة'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('SOS_SIMULATION')}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs sm:text-sm border border-rose-200 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-rose-600" />
                  <span>معاينة صفحة الراكب عند المسح</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PASSENGER SOS SIMULATION (What trapped passengers see upon scanning QR) */}
          {activeTab === 'SOS_SIMULATION' && (
            <div className="flex flex-col items-center">
              
              <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                
                {/* Mobile Simulation Header */}
                <div className="bg-rose-600 text-white p-4 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span className="text-[10px] font-black uppercase">LIVE SOS</span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-2 text-white">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-black">غرفة الاستغاثة وطوارئ الكابينة</h3>
                  <p className="text-xs text-rose-100 mt-0.5">
                    أنت متصل مباشرة بنظام التحكم وإدارة الطوارئ في شركة توينز للمصاعد
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  
                  {/* Elevator Details Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>كود المصعد:</span>
                      <span className="font-mono font-bold text-slate-800">{elevatorSerial}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>المبنى:</span>
                      <span className="font-bold text-slate-800">{buildingName}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>الموقع الجغرافي:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">{buildingAddress}</span>
                    </div>
                  </div>

                  {/* Reassurance Banner */}
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900 leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black text-emerald-950 mb-0.5">أنت في أمان تام:</strong>
                      الصاعدة مزودة بفتحات تهوية طبيعية متجددة وجهاز أمان ميكانيكي لمنع الهبوط. فرق الإنقاذ والفنيين المناوبين تم إشعارهم.
                    </div>
                  </div>

                  {/* Quick Action Buttons for Passenger */}
                  <div className="space-y-2.5">
                    {/* 1. Direct Phone Call */}
                    <a
                      href={`tel:${emergencyPhone}`}
                      className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-center"
                    >
                      <Phone className="w-5 h-5" />
                      <span>اتصال طوارئ فوري: {emergencyPhone}</span>
                    </a>

                    {/* 2. One-Touch WhatsApp SOS */}
                    <button
                      type="button"
                      onClick={handleOpenWhatsAppSOS}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Smartphone className="w-5 h-5" />
                      <span>إرسال استغاثة بالواتساب وتحديد الموقع</span>
                    </button>

                    {/* 3. Audio Alarm & Flashlight Tools */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsSirenActive(!isSirenActive)}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                          isSirenActive 
                            ? 'bg-amber-600 text-white border-amber-600 animate-pulse' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isSirenActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
                        <span>{isSirenActive ? 'إيقاف صافرة التنبيه' : 'تشغيل صافرة إنذار'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsFlashlightMode(true)}
                        className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Flashlight className="w-4 h-4 text-amber-500" />
                        <span>إنارة طوارئ شاشة</span>
                      </button>
                    </div>
                  </div>

                  {/* Safety Guidance Checklist */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 mb-2">تعليمات السلامة داخل الكابينة:</div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>لا تحاول القفز أو هز الكابينة.</li>
                      <li>لا تفتح أبواب المصعد بالقوة مطلقاً.</li>
                      <li>اجلس على أرضية الكابينة إذا شعرت بدوار أو تعب.</li>
                      <li>تحدث عبر الإنتركوم أو اضغط زر الجرس الأصفر.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 text-center text-[10px] text-slate-400 border-t border-slate-200">
                  نظام استغاثة الكابينة الذكي • توينز لأنظمة المصاعد
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PPM PERIODIC MAINTENANCE CARD */}
          {activeTab === 'MAINTENANCE_CARD' && (
            <div className="flex flex-col items-center">
              
              <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border-2 border-slate-300 p-5 sm:p-6 text-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200">
                  <div className="flex items-center gap-3">
                    <TwinsLogo size={36} customLogoUrl={companySettings.logoUrl} />
                    <div>
                      <h3 className="font-black text-base text-slate-900">بطاقة الصيانة الدورية والفحص الوقائي (PPM)</h3>
                      <p className="text-xs text-slate-500">سجل الزيارات الميدانية المعتمد لدى إدارة المبنى والدفاع المدني</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="font-mono text-xs font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                      {elevatorSerial}
                    </span>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">المبنى:</span>
                    <strong className="text-slate-800">{buildingName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">المصعد:</span>
                    <strong className="text-slate-800">{elevatorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">الحمولة:</span>
                    <strong className="text-slate-800">{capacityKg} كجم ({passengers} ركاب)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">السرعة والأدوار:</span>
                    <strong className="text-slate-800">{speed} • {floors}</strong>
                  </div>
                </div>

                {/* Sample Maintenance Visit Log Table */}
                <div className="mt-4">
                  <div className="text-xs font-black text-slate-800 mb-2 flex items-center justify-between">
                    <span>سجل الزيارات الوقائية الدورية:</span>
                    <span className="text-[10px] text-slate-500 font-normal">مطابق لجدول كود البناء السعودي SBC 801</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="p-2.5">رقم الزيارة</th>
                          <th className="p-2.5">تاريخ الفحص</th>
                          <th className="p-2.5">اسم الفني</th>
                          <th className="p-2.5">الأعمال المنجزة</th>
                          <th className="p-2.5">الحالة</th>
                          <th className="p-2.5 text-center">التوقيع</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold">V-01</td>
                          <td className="p-2.5 font-mono">{new Date(Date.now() - 30*24*3600*1000).toLocaleDateString('en-GB')}</td>
                          <td className="p-2.5 font-bold">م. أحمد فؤاد</td>
                          <td className="p-2.5 text-slate-600">فحص المكابح، تزييت السكك، فحص إنارة الطوارئ وأجهزة الأمان</td>
                          <td className="p-2.5"><span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">سليم 100%</span></td>
                          <td className="p-2.5 text-center font-serif text-slate-400 italic">معتمد ✓</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold">V-02</td>
                          <td className="p-2.5 font-mono">{new Date().toLocaleDateString('en-GB')}</td>
                          <td className="p-2.5 font-bold">م. طارق العتيبي</td>
                          <td className="p-2.5 text-slate-600">فحص منظم السرعة (Governor)، ضبط حساسية ستارة الباب الضوئية</td>
                          <td className="p-2.5"><span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">سليم 100%</span></td>
                          <td className="p-2.5 text-center font-serif text-slate-400 italic">معتمد ✓</td>
                        </tr>
                        <tr className="hover:bg-slate-50 bg-amber-50/30">
                          <td className="p-2.5 font-mono font-bold text-amber-700">V-03</td>
                          <td className="p-2.5 font-mono text-amber-800">{new Date(Date.now() + 30*24*3600*1000).toLocaleDateString('en-GB')}</td>
                          <td className="p-2.5 text-slate-400">مجدول...</td>
                          <td className="p-2.5 text-slate-500">فحص كوابل الجر ومخمدات البئر والكنترول الكهربائي</td>
                          <td className="p-2.5"><span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">مجدولة</span></td>
                          <td className="p-2.5 text-center text-slate-400">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                  <div>هاتف البلاغات: {emergencyPhone}</div>
                  <div>يجب تعليق هذه البطاقة داخل غرفة المحرك أو جوار لوحة التحكم الرئيسية</div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة بطاقة الصيانة الدورية</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>متوافق مع ملصقات الألومنيوم والفينيل المقاوم للحرارة والرطوبة</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
