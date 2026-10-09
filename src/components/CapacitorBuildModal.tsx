import React, { useState } from 'react';
import { 
  Smartphone, 
  X, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Check, 
  BellRing, 
  ShieldCheck, 
  MapPin, 
  Radio, 
  Download, 
  ExternalLink,
  Layers,
  Sparkles,
  Cpu,
  Flame,
  Info
} from 'lucide-react';
import { useNativeCapacitor } from '../hooks/useNativeCapacitor';
import { AppLanguage } from '../utils/translations';

interface CapacitorBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
}

export const CapacitorBuildModal: React.FC<CapacitorBuildModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isAr = language === 'ar';
  const { 
    isNative, 
    platform, 
    fcmToken, 
    pushPermissionStatus, 
    initPushNotifications, 
    triggerLocalEmergencyNotification 
  } = useNativeCapacitor();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [testPushSent, setTestPushSent] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleTestPush = async () => {
    await triggerLocalEmergencyNotification(
      isAr ? '🚨 اختبار إشعار طوارئ مصعد (FCM)' : '🚨 Test Elevator Emergency Alert (FCM)',
      isAr ? 'تم استلام إشعار الطوارئ بنجاح عبر قناة الإشعارات ذات الأولوية القصوى.' : 'Emergency notification received successfully via high-priority channel.',
      'test-incident-999'
    );
    setTestPushSent(true);
    setTimeout(() => setTestPushSent(false), 4000);
  };

  const buildSteps = [
    {
      titleAr: '1. بناء ملفات الواجهة ومزامنة Capacitor',
      titleEn: '1. Build frontend & sync Capacitor',
      command: 'npm run cap:build',
      descAr: 'يقوم بعمل vite build وتحديث مجلدات الأندرويد والـ plugins تلقائياً.',
    },
    {
      titleAr: '2. إضافة منصة الأندرويد (تُنفذ مرة واحدة فقط)',
      titleEn: '2. Add Android platform (one-time)',
      command: 'npx cap add android',
      descAr: 'يولد مشروع Android Studio كامل مع كود الـ Java/Kotlin ومجلد الأصول.',
    },
    {
      titleAr: '3. بناء ملف APK فورياً عبر سطر الأوامر (Gradle)',
      titleEn: '3. Build APK directly via Gradle CLI',
      command: 'cd android && ./gradlew assembleDebug',
      descAr: 'يولد ملف تثبيت APK مباشر في المسار: android/app/build/outputs/apk/debug/app-debug.apk',
    },
    {
      titleAr: '4. أو فتح المشروع في Android Studio',
      titleEn: '4. Or open in Android Studio',
      command: 'npx cap open android',
      descAr: 'لفتح المشروع وبناء حزمة إنتاج موقعة (Release Signed APK / AAB) لمتجر Google Play.',
    },
  ];

  const androidPermissionsCode = `<!-- أذونات تتبع الموقع في الخلفية العميقة وإشعارات FCM في AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl text-white overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 px-6 py-4 border-b border-indigo-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {isAr ? 'منظومة Capacitor وبناء تطبيق أندرويد (APK) وiOS' : 'Capacitor Native APK & iOS Suite'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  HYBRID ENGINE
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {isAr 
                  ? 'تشغيل الكود الحالي كتطبيق هاتف أصلي مع تتبع GPS في الخلفية وإشعارات FCM' 
                  : 'Native Android/iOS runtime with background location & FCM push notifications'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Runtime Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* 1. Platform Detection */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'بيئة التشغيل الحالية' : 'Current Platform'}</span>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-black text-white">
                  {isNative ? `${platform.toUpperCase()} Native` : 'Web / PWA (Browser)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isNative ? (isAr ? 'يعمل كتطبيق هاتف أصلي' : 'Native app runtime') : (isAr ? 'يعمل كمنصة ويب تقدمية PWA' : 'Progressive web mode')}
              </p>
            </div>

            {/* 2. FCM Push Status */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'إشعارات FCM الفورية' : 'FCM Push Status'}</span>
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black text-white">
                  {pushPermissionStatus === 'granted' ? (isAr ? 'مفعل وجاهز ✓' : 'Active') : (isAr ? 'بانتظار الإذن' : 'Standby')}
                </span>
              </div>
              <button
                type="button"
                onClick={initPushNotifications}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-bold cursor-pointer"
              >
                {isAr ? 'طلب إذن الإشعارات الآن' : 'Request Permissions'}
              </button>
            </div>

            {/* 3. Background GPS Capability */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'تتبع GPS في الخلفية' : 'Background GPS'}</span>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-black text-white">
                  {isNative ? 'Foreground Service' : 'Wake Lock API'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isNative ? (isAr ? 'خدمة خلفية مستمرة 24/7' : '24/7 persistent background') : (isAr ? 'إبقاء الشاشة مضاءة أثناء المناوبة' : 'Screen awake duty mode')}
              </p>
            </div>

          </div>

          {/* Test Emergency Notification Button */}
          <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <span>{isAr ? 'اختبار صفارة وإشعار الطوارئ الفوري (Test Push)' : 'Test Emergency Push & Siren'}</span>
              </h4>
              <p className="text-slate-300 text-[11px] mt-0.5">
                {isAr ? 'يرسل إشعار طوارئ تجريبي مع نغمة التنبيه القصوى لاختبار استجابة الهاتف.' : 'Simulates a code-red entrapment alert with siren on device.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestPush}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0 active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{testPushSent ? (isAr ? 'تم الإرسال ✓' : 'Sent!') : (isAr ? 'إرسال إشعار تجريبي' : 'Send Test Alert')}</span>
            </button>
          </div>

          {/* FCM Token Display (If exists) */}
          {fcmToken && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">FCM Device Registration Token:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(fcmToken, 999)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === 999 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 999 ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الرمز' : 'Copy')}</span>
                </button>
              </div>
              <p className="font-mono text-[10px] text-slate-300 bg-slate-900 p-2 rounded-xl break-all">
                {fcmToken}
              </p>
            </div>
          )}

          {/* Step-by-Step Build Commands for Android APK */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'خطوات توليد ملف الـ APK المباشر وتثبيته على هواتف الفنيين' : 'Build & Generate APK for Technicians'}</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'أوامر سريعة بنقرة واحدة' : 'One-click copy'}
              </span>
            </div>

            <div className="space-y-2.5">
              {buildSteps.map((step, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-200">
                      {isAr ? step.titleAr : step.titleEn}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(step.command, idx)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">{isAr ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{isAr ? 'نسخ الأمر' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-900 p-2 rounded-xl font-mono text-emerald-400 text-[11px] flex items-center justify-between">
                    <code>{step.command}</code>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    {step.descAr}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AndroidManifest.xml Background Permissions Reference */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>{isAr ? 'أذونات الخلفية العميقة المجهزة في AndroidManifest.xml' : 'Configured Android Background Permissions'}</span>
              </h4>
              <button
                type="button"
                onClick={() => copyToClipboard(androidPermissionsCode, 888)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 888 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === 888 ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الأذونات' : 'Copy XML')}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
              {androidPermissionsCode}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isAr ? 'جاهز للتصدير للأندرويد وiOS في أي وقت' : 'Capacitor configured & ready'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
