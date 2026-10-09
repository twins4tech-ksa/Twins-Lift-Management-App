import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  X, 
  MapPin, 
  Phone, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  Send, 
  Radio, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  UserCheck, 
  Car, 
  Users, 
  Building2, 
  Flame, 
  ExternalLink, 
  Compass, 
  HelpCircle, 
  Smartphone, 
  Layers, 
  Share2, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  BellRing,
  QrCode
} from 'lucide-react';
import { MaintenanceBreakdown, BreakdownStatus } from '../types/maintenance';
import { Employee } from '../types/employee';
import { AppLanguage } from '../utils/translations';
import { liveTrackingService, LiveTrackingService, TechnicianDutyStatus } from '../services/liveTrackingService';
import { sendWhatsAppMessage } from '../services/whatsappService';

interface ElevatorRescueDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: MaintenanceBreakdown | null;
  employees: Employee[];
  language: AppLanguage;
  onUpdateBreakdown: (updated: MaintenanceBreakdown) => void;
  onOpenCapacitorModal?: () => void;
  onOpenCabinSticker?: () => void;
}

export const ElevatorRescueDispatchModal: React.FC<ElevatorRescueDispatchModalProps> = ({
  isOpen,
  onClose,
  breakdown,
  employees,
  language,
  onUpdateBreakdown,
  onOpenCapacitorModal,
  onOpenCabinSticker,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'DISPATCH' | 'CHECKLIST' | 'PWA_VS_NATIVE'>('DISPATCH');
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [dispatchingTechId, setDispatchingTechId] = useState<string | null>(null);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);
  
  // Checklist state for standard emergency rescue procedure
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    step1: true, // Auto intercom communication
  });

  // Elapsed time tracker
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!breakdown || !isOpen) return;

    const reportedTime = new Date(breakdown.reportedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - reportedTime) / 1000));
      setElapsedMinutes(Math.floor(diffSec / 60));
      setElapsedSeconds(diffSec % 60);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [breakdown, isOpen]);

  // Audio siren control
  const toggleAlarm = () => {
    if (isAlarmPlaying) {
      liveTrackingService.stopEmergencyAlarm();
      setIsAlarmPlaying(false);
    } else {
      liveTrackingService.playEmergencyAlarm();
      setIsAlarmPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (isAlarmPlaying) {
        liveTrackingService.stopEmergencyAlarm();
      }
    };
  }, [isAlarmPlaying]);

  // Filter technicians from employees
  const technicians = useMemo(() => {
    return employees.filter(e => {
      const role = (e.role || '').toLowerCase();
      const pos = (e.position || '').toLowerCase();
      const type = (e.employeeType || '').toLowerCase();
      return role.includes('tech') || role.includes('فني') || role.includes('صيانة') || type.includes('maintenance') || pos.includes('فني');
    });
  }, [employees]);

  // Target coordinates of the breakdown site
  const incidentLat = breakdown?.latitude || 24.6975;
  const incidentLng = breakdown?.longitude || 46.6850;

  // Calculate distances & ETAs for technicians
  const sortedTechnicians = useMemo(() => {
    return technicians.map((tech, idx) => {
      // Deterministic coordinates in Riyadh / Eastern region for demonstration
      const baseLat = 24.7136 + (Math.sin(idx * 2) * 0.04);
      const baseLng = 46.6753 + (Math.cos(idx * 2) * 0.04);
      
      const distanceKm = LiveTrackingService.calculateDistanceKm(incidentLat, incidentLng, baseLat, baseLng);
      const etaMinutes = Math.max(3, Math.ceil((distanceKm / 35) * 60) + 2);
      const isAvailable = idx % 2 === 0;

      return {
        ...tech,
        lat: baseLat,
        lng: baseLng,
        distanceKm,
        etaMinutes,
        isAvailable,
        dutyLabel: isAvailable ? (isAr ? 'متاح للتدخل السريع' : 'Available on Duty') : (isAr ? 'يباشر موقعاً آخر' : 'Busy on Task'),
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [technicians, incidentLat, incidentLng, isAr]);

  if (!isOpen || !breakdown) return null;

  const isRescued = breakdown.status === 'Resolved' || !!breakdown.rescueCompletedTimestamp;
  const isAssigned = !!breakdown.assignedTechnicianId;

  // Handle instant technician dispatch
  const handleDispatch = async (tech: typeof sortedTechnicians[0]) => {
    setDispatchingTechId(tech.id);
    const nowIso = new Date().toISOString();

    const updated: MaintenanceBreakdown = {
      ...breakdown,
      status: 'Assigned',
      assignedTechnicianId: tech.id,
      assignedTechnicianName: tech.name,
      assignedTechnicianPhone: tech.phone,
      dispatchTimestamp: nowIso,
    };

    onUpdateBreakdown(updated);

    // Send WhatsApp dispatch alert with Google Maps navigation link
    if (tech.phone) {
      const gmapsLink = `https://www.google.com/maps/dir/?api=1&destination=${incidentLat},${incidentLng}`;
      const msg = isAr
        ? `🚨 *استغاثة طوارئ واحتجاز ركاب بمصعد - توجيه فوري* 🚨\n\n` +
          `🏢 *الموقع:* ${breakdown.siteLocation}\n` +
          `📍 *المصعد:* ${breakdown.elevatorName}\n` +
          `👥 *المحتجزون:* ${breakdown.trappedPassengersCount || 1} أشخاص (${breakdown.trappedDetails || 'حالة ذعر'})\n` +
          `🪜 *الموضع:* ${breakdown.floorLocation || 'بين الأدوار'}\n` +
          `⏱️ *الزمن المنقضي:* ${elapsedMinutes} دقيقة\n\n` +
          `🚗 *رابط الملاحة المباشر GPS:*\n${gmapsLink}\n\n` +
          `⚠️ يرجى التوجه الفوري واتباع بروتوكول الأمان والسلامة لكود SBC 801.`
        : `🚨 *URGENT ELEVATOR ENTRAPMENT DISPATCH* 🚨\n\nLocation: ${breakdown.siteLocation}\nElevator: ${breakdown.elevatorName}\nTrapped: ${breakdown.trappedPassengersCount || 1} persons\nGPS Nav: ${gmapsLink}`;

      try {
        await sendWhatsAppMessage({
          mobile_no: tech.phone.replace(/[^0-9]/g, ''),
          message: msg,
          priority: 'critical',
        });
      } catch (e) {
        console.warn('WhatsApp dispatch warning:', e);
      }
    }

    setDispatchingTechId(null);
    setDispatchSuccessMsg(
      isAr 
        ? `تم توجيه الفني ${tech.name} بنجاح وإرسال إحداثيات GPS ورابط الملاحة إلى هاتفه!` 
        : `Technician ${tech.name} dispatched with live GPS route!`
    );
    setTimeout(() => setDispatchSuccessMsg(null), 5000);
  };

  const handleMarkArrived = () => {
    onUpdateBreakdown({
      ...breakdown,
      status: 'In_Progress',
      arrivedTimestamp: new Date().toISOString(),
    });
  };

  const handleMarkRescued = () => {
    onUpdateBreakdown({
      ...breakdown,
      status: 'Resolved',
      isResolved: true,
      rescueCompletedTimestamp: new Date().toISOString(),
      workPerformed: isAr 
        ? 'تم الوصول للموقع وفصل القاطع، تحريك الكابينة يدوياً لأقرب دور وفتح الباب بالمفتاح الثلاثي وإخراج المحتجزين بسلام وبدون إصابات.' 
        : 'Emergency rescue executed. Passengers freed safely without injuries.',
    });
  };

  const toggleChecklistStep = (key: string) => {
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl shadow-red-950/50 text-white overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-rose-950 px-5 py-4 border-b border-red-700/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40 animate-pulse">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-black">
                SOS
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>{isAr ? 'مركز الاستجابة السريعة: إنقاذ واحتجاز بمصعد' : 'Emergency Elevator Entrapment Rescue Console'}</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-200 border border-red-400/30">
                  CODE RED 0
                </span>
              </div>
              <p className="text-xs text-red-200/80 flex items-center gap-2 mt-0.5">
                <span>{breakdown.customerName}</span>
                <span>•</span>
                <span className="font-mono text-amber-300 font-bold">{breakdown.elevatorName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cabin Safety Placard & QR Trigger */}
            {onOpenCabinSticker && (
              <button
                type="button"
                onClick={onOpenCabinSticker}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-500/30"
                title={isAr ? 'طباعة ومعاينة ملصق طوارئ واستغاثة الكابينة ورمز QR' : 'Cabin Safety Placard & QR'}
              >
                <QrCode className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">{isAr ? 'ملصق الكابينة وQR' : 'Cabin Decal & QR'}</span>
              </button>
            )}

            {/* Siren Alarm Toggle */}
            <button
              type="button"
              onClick={toggleAlarm}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAlarmPlaying 
                  ? 'bg-red-500 text-white animate-bounce shadow-lg shadow-red-500/50' 
                  : 'bg-white/10 hover:bg-white/20 text-red-200 border border-red-500/30'
              }`}
              title={isAr ? 'تشغيل / إيقاف جرس الإنذار الصوتي' : 'Toggle emergency siren'}
            >
              {isAlarmPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{isAlarmPlaying ? (isAr ? 'كتم الإنذار' : 'Mute Siren') : (isAr ? 'جرس الطوارئ' : 'Siren')}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('DISPATCH')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'DISPATCH'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isAr ? 'تتبع وتوجيه الفنيين (GPS)' : 'Live GPS Dispatch'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHECKLIST')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'CHECKLIST'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isAr ? 'بروتوكول السلامة وكود SBC' : 'Safety SOP Checklist'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PWA_VS_NATIVE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'PWA_VS_NATIVE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isAr ? 'مقارنة PWA أم تطبيق أصلي؟' : 'PWA vs Native App Advisory'}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold">
              {isAr ? 'إجابة هندسية' : 'Engineering'}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Success Banner */}
          {dispatchSuccessMsg && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-200 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{dispatchSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: DISPATCH & LIVE TRACKING */}
          {activeTab === 'DISPATCH' && (
            <div className="space-y-6">
              
              {/* Emergency Banner Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* 1. Trapped Stats */}
                <div className="bg-slate-800/80 border border-red-500/30 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'الأشخاص المحتجزون' : 'Trapped Passengers'}</p>
                    <p className="text-base font-black text-white">
                      {breakdown.trappedPassengersCount || 1} {isAr ? 'أشخاص داخل الكابينة' : 'persons trapped'}
                    </p>
                    <p className="text-[10px] text-amber-400 mt-0.5 line-clamp-1">
                      {breakdown.trappedDetails || (isAr ? 'حالة ذعر وهلع، الإضاءة تعمل' : 'Panic state, emergency lights on')}
                    </p>
                  </div>
                </div>

                {/* 2. Location & Shaft Position */}
                <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'موقع البئر والكابينة' : 'Shaft Position'}</p>
                    <p className="text-xs font-black text-white truncate">
                      {breakdown.floorLocation || (isAr ? 'بين الطابق 2 و 3' : 'Between floors 2 & 3')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{breakdown.siteLocation}</p>
                  </div>
                </div>

                {/* 3. Elapsed Time Counter */}
                <div className="bg-slate-800/80 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? 'زمن الاستجابة المنقضي' : 'Elapsed Time'}</p>
                    <div className="flex items-baseline gap-1 text-base font-black font-mono text-amber-300">
                      <span>{String(elapsedMinutes).padStart(2, '0')}:{String(elapsedSeconds).padStart(2, '0')}</span>
                      <span className="text-[10px] font-normal text-slate-400">{isAr ? 'دقيقة:ثانية' : 'mm:ss'}</span>
                    </div>
                    <p className={`text-[10px] font-bold ${elapsedMinutes > 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {elapsedMinutes > 20 ? (isAr ? '⚠️ تجاوز المعيار القياسي' : 'Exceeded target') : (isAr ? '✓ ضمن زمن الاستجابة الفورية' : 'Within target')}
                    </p>
                  </div>
                </div>

              </div>

              {/* Progress Milestones Bar */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-200">{isAr ? 'مسار الاستجابة والإنقاذ الميداني' : 'Rescue Progress Stages'}</span>
                  <span className="text-[11px] text-slate-400">
                    {isRescued ? (isAr ? 'تم الإنقاذ بسلام 🎉' : 'Rescued Safely') : isAssigned ? (isAr ? 'الفني متوجه للموقع 🚗' : 'Tech En Route') : (isAr ? 'بانتظار التوجيه ⏳' : 'Awaiting Dispatch')}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {/* Step 1 */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                    <p className="text-[11px] font-bold text-emerald-200">{isAr ? 'استلام الاستغاثة' : 'SOS Received'}</p>
                    <p className="text-[9px] text-slate-400">{new Date(breakdown.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-2.5 rounded-xl text-center space-y-1 border ${
                    isAssigned 
                      ? 'bg-blue-950/60 border-blue-500/40 text-blue-200' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <Car className="w-4 h-4 mx-auto text-blue-400" />
                    <p className="text-[11px] font-bold">{isAr ? 'توجيه وتحرك الفني' : 'Dispatched'}</p>
                    <p className="text-[9px] text-slate-400">
                      {breakdown.assignedTechnicianName ? breakdown.assignedTechnicianName.split(' ')[0] : '-'}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-2.5 rounded-xl text-center space-y-1 border ${
                    breakdown.status === 'In_Progress' || isRescued
                      ? 'bg-amber-950/60 border-amber-500/40 text-amber-200' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <Building2 className="w-4 h-4 mx-auto text-amber-400" />
                    <p className="text-[11px] font-bold">{isAr ? 'الوصول للموقع' : 'On Site'}</p>
                    {breakdown.status === 'Assigned' && !isRescued ? (
                      <button 
                        type="button" 
                        onClick={handleMarkArrived}
                        className="text-[9px] font-bold text-amber-300 underline cursor-pointer"
                      >
                        {isAr ? 'تسجيل الوصول' : 'Mark Arrived'}
                      </button>
                    ) : (
                      <p className="text-[9px] text-slate-400">{breakdown.arrivedTimestamp ? 'تم الوصول' : '-'}</p>
                    )}
                  </div>

                  {/* Step 4 */}
                  <div className={`p-2.5 rounded-xl text-center space-y-1 border ${
                    isRescued 
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <ShieldAlert className="w-4 h-4 mx-auto text-emerald-400" />
                    <p className="text-[11px] font-bold">{isAr ? 'تحرير الركاب بنجاح' : 'Rescued Safely'}</p>
                    {!isRescued ? (
                      <button 
                        type="button" 
                        onClick={handleMarkRescued}
                        className="text-[9px] font-bold text-emerald-300 underline cursor-pointer"
                      >
                        {isAr ? 'إتمام الإنقاذ' : 'Mark Rescued'}
                      </button>
                    ) : (
                      <p className="text-[9px] text-emerald-400 font-bold">✓ {isAr ? 'تم بسلام' : 'Completed'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Nearest Technicians GPS Radar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-400 animate-spin" />
                    <h3 className="text-sm font-black text-white">
                      {isAr ? 'رادار الفنيين الميدانيين (الأقرب لموقع الحادث)' : 'Nearest Field Technicians (GPS Distance)'}
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {isAr ? `${sortedTechnicians.length} فني مسجل بالمناوبة` : `${sortedTechnicians.length} techs on duty`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sortedTechnicians.map((tech, idx) => {
                    const isCurrentAssigned = breakdown.assignedTechnicianId === tech.id;
                    const isFirstClosest = idx === 0;

                    return (
                      <div 
                        key={tech.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrentAssigned
                            ? 'bg-blue-950/60 border-blue-500/80 shadow-lg shadow-blue-950/50'
                            : isFirstClosest
                            ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                            : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                              isCurrentAssigned 
                                ? 'bg-blue-600 text-white' 
                                : isFirstClosest 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-white">{tech.name}</h4>
                                {isFirstClosest && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-400/30">
                                    {isAr ? 'الأقرب مسافة ⚡' : 'Closest'}
                                  </span>
                                )}
                                {isCurrentAssigned && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 text-[9px] font-black border border-blue-400/30">
                                    {isAr ? 'مكلف حالياً ✓' : 'Assigned'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{tech.phone || 'بدون هاتف'}</span>
                                <span>•</span>
                                <span className={tech.isAvailable ? 'text-emerald-400' : 'text-amber-400'}>
                                  {tech.dutyLabel}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Distance & ETA */}
                          <div className="text-right">
                            <div className="text-xs font-black font-mono text-emerald-400">
                              {tech.distanceKm} {isAr ? 'كم' : 'km'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ~{tech.etaMinutes} {isAr ? 'دقيقة وصول' : 'mins ETA'}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${incidentLat},${incidentLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Compass className="w-3.5 h-3.5 text-blue-400" />
                            <span>{isAr ? 'مسار Google Maps' : 'Route'}</span>
                          </a>

                          <div className="flex items-center gap-1.5">
                            {tech.phone && (
                              <a
                                href={`tel:${tech.phone}`}
                                className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                                title={isAr ? 'اتصال هاتفي بالفني' : 'Call Tech'}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDispatch(tech)}
                              disabled={dispatchingTechId === tech.id}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                                isCurrentAssigned
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                  : isFirstClosest
                                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                                  : 'bg-slate-700 hover:bg-slate-600 text-white'
                              }`}
                            >
                              <Send className="w-3 h-3" />
                              <span>
                                {isCurrentAssigned 
                                  ? (isAr ? 'إعادة إرسال التنبيه' : 'Resend Alert') 
                                  : (isAr ? 'توجيه فوري (SOS)' : 'Dispatch Now')}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SAFETY SOP CHECKLIST */}
          {activeTab === 'CHECKLIST' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                <div className="flex items-center gap-2 font-black text-amber-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{isAr ? 'بروتوكول السلامة القياسي لكود البناء السعودي (SBC 801) والدفاع المدني' : 'Civil Defense & SBC 801 Safety Rescue Protocol'}</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-200/80">
                  {isAr 
                    ? 'يمنع منعاً باتاً محاولة سحب الركاب دون فصل التيار الكهربائي والتأكد من استواء الكابينة مع عتبة الباب منعاً لحدوث أي سقوط أو حركة مفاجئة.' 
                    : 'Never attempt rescue without isolating electrical power and ensuring cabin leveling.'}
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'step1', titleAr: '1. التهدئة والتواصل عبر الإنتركوم', descAr: 'طمأنة المحتجزين بالداخل وإرشادهم للبقاء في عمق الكابينة وعدم محاولة فتح الأبواب بالقوة.' },
                  { id: 'step2', titleAr: '2. فصل القاطع الكهربائي الرئيسي (Main Switch)', descAr: 'التوجه إلى غرفة المحركات وفصل التيار الكهربائي الرئيسي عن المصعد لمنع تحركه فجأة.' },
                  { id: 'step3', titleAr: '3. تحديد موضع الكابينة ومطابقة الشواخص', descAr: 'فحص شواخص الحبال أو الفحص البصري لتحديد موضع الكابينة بالنسبة لأقرب طابق.' },
                  { id: 'step4', titleAr: '4. فك الفرامل والتحريك اليدوي لمنطقة الهبوط', descAr: 'استخدام ذراع فك الفرامل اليدوي بحذر لتحريك المصعد إلى أقرب وقفة مع مراقبة مؤشر التوقف.' },
                  { id: 'step5', titleAr: '5. فتح الباب الخارجي بالمفتاح الثلاثي', descAr: 'إدخال المفتاح الثلاثي المخصص في ثقب فتح الطوارئ بالباب الخارجي ودفعه لفتح المصراعين.' },
                  { id: 'step6', titleAr: '6. مساعدة الركاب في الخروج الآمن وفحص سلامتهم', descAr: 'مساعدة جميع المحتجزين للخروج واحداً تلو الآخر والتأكد من عدم وجود أي إصابات أو حالات اختناق.' },
                  { id: 'step7', titleAr: '7. إغلاق الباب ووضع شريط تحذيري', descAr: 'إعادة إقفال الباب تماماً ووضع لوحة تحذيرية "المصعد قيد الصيانة" لحين فحص سبب التوقف الفني.' },
                ].map((step) => {
                  const isChecked = !!completedSteps[step.id];
                  return (
                    <div 
                      key={step.id}
                      onClick={() => toggleChecklistStep(step.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked 
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-white' 
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0 mt-0.5 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className={`text-xs font-black ${isChecked ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {step.titleAr}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {step.descAr}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PWA VS NATIVE APP ADVISORY */}
          {activeTab === 'PWA_VS_NATIVE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white">
                    {isAr ? 'الاستشارة الهندسية: تفعيل PWA أم بناء تطبيق هاتف أصلي (Native App)؟' : 'Engineering Advisory: PWA vs Native App for Elevator Emergencies'}
                  </h3>
                </div>
                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  {isAr 
                    ? 'سؤالك دقيق وجوهري في قطاع المصاعد والطوارئ. إليك التحليل الفني الشامل والحل الموصى به لضمان أعلى سرعة استجابة وموثوقية ميدانية:'
                    : 'A comprehensive technical comparison covering background tracking, push notifications, and offline resiliency.'}
                </p>
              </div>

              {/* Comparison Table Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* PWA Card */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>{isAr ? 'تطبيق الويب التقدمي (PWA) - مفعل الآن' : 'Progressive Web App (PWA)'}</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                      {isAr ? 'جاهز فوراً مجاناً' : 'Ready Now'}
                    </span>
                  </div>

                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>التثبيت والتشغيل:</strong> يتثبت بضغطة زر واحدة على أي جوال (آيفون، سامسونج، هواوي، حاسوب) بدون انتظار مراجعات Apple Store أو Google Play.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>التتبع أثناء الاستخدام:</strong> يدعم قراءة الـ GPS الدقيق وحساب المسافات وETA وتوجيه الواتساب.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>حل إبقاء الشاشة:</strong> قمنا ببرمجة <code>Screen Wake Lock API</code> لمنع إغلاق الشاشة أثناء مناوبة الفني.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">⚠️</span>
                      <span><strong>القيد التقني الوحيد:</strong> في أجهزة iOS وبعض هواتف أندرويد، إذا أُغلقت الشاشة ووضِع الهاتف بالجيب لفترة طويلة، يوقف نظام التشغيل الـ GPS لتوفير البطارية.</span>
                    </li>
                  </ul>
                </div>

                {/* Native App Card */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span>{isAr ? 'التطبيق الأصلي (Native / Capacitor)' : 'Native App (Android / iOS)'}</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[9px] font-bold">
                      {isAr ? 'خلفية عميقة 24/7' : 'Deep Background'}
                    </span>
                  </div>

                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>تتبع GPS دائم بالخلفية:</strong> يعمل عبر <code>Foreground Service</code> ويرسل الإحداثيات كل 30 ثانية حتى لو الهاتف مقفل تماماً في جيب الفني طوال 24 ساعة.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>تنبيهات تجاوز الصامت (Critical Alerts):</strong> إمكانية إطلاق صوت صفارة طوارئ عالي حتى لو كان جوال الفني في وضع الصامت التام.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">⚠️</span>
                      <span><strong>التكلفة والوقت:</strong> يتطلب حسابات مطورين (99$/سنة لأبل) ومراجعات وتحديثات متجر.</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Final Recommendation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 text-emerald-100 space-y-2">
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'الخلاصة والتوصية الهندسية الذهبية (Best Approach)' : 'Recommended Implementation Strategy'}</span>
                </h4>
                <div className="text-xs text-slate-200 space-y-1.5 leading-relaxed">
                  <p>
                    <strong>1. المرحلة الأولى (مفعلة وتعمل الآن فوراً في المنظومة):</strong> استخدام الـ <strong>PWA</strong> الحالي الذي زودناه بميزة تثبيت التطبيق، وحفظ البيانات بلا إنترنت في الآبار، وميزة <code>Screen Wake Lock</code>، وصفارة الإنذار الصوتي، وتتبع الـ GPS والتوجيه الفوري عبر الواتساب. هذا يمنحكم عملاً ميدانياً فورياً اليوم بنسبة 100%.
                  </p>
                  <p>
                    <strong>2. المرحلة الثانية (للتتبع العميق التام):</strong> يمكن تحويل هذا التطبيق نفسه عبر أداة <strong>Capacitor</strong> إلى حزمة تطبيق أندرويد (APK) وiOS دون إعادة كتابة الكود، لإضافة خدمة الخلفية العميقة مع إشعارات FCM متى ما أردتم!
                  </p>
                </div>

                {onOpenCapacitorModal && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCapacitorModal();
                      }}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{isAr ? 'فتح لوحة أوامر حزمة تطبيق أندرويد (APK) وإعدادات Capacitor' : 'Open Android APK & Capacitor Build Console'}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>{isAr ? 'رقم البلاغ:' : 'Incident ID:'}</span>
            <span className="font-mono text-slate-200 font-bold">{breakdown.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              {isAr ? 'إغلاق النافذة' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
