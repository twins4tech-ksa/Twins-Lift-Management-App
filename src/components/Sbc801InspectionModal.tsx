import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  PenTool, 
  Camera, 
  Save, 
  Check, 
  AlertOctagon, 
  Layers, 
  Wrench, 
  Plus, 
  Trash2, 
  WifiOff, 
  Clock, 
  Building, 
  User,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { CheckpointCategory, CheckpointItem, CheckpointStatus, Sbc801InspectionReport, AttachedPhoto } from '../types/inspection';
import { SBC_801_STANDARD_CHECKPOINTS } from '../data/sbc801Checkpoints';
import { CameraPhotoCapture } from './CameraPhotoCapture';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { offlineSyncService } from '../services/offlineSyncService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface Sbc801InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (report: Sbc801InspectionReport) => void;
  elevatorId?: string;
  elevatorName?: string;
  buildingName?: string;
  customerName?: string;
  customerPhone?: string;
  technicianName?: string;
  technicianId?: string;
  isOnline?: boolean;
  isAr?: boolean;
}

const CATEGORIES: { key: CheckpointCategory | 'ALL'; titleAr: string; titleEn: string; count: number }[] = [
  { key: 'ALL', titleAr: 'كافة البنود (24)', titleEn: 'All Points (24)', count: 24 },
  { key: 'MACHINE_ROOM', titleAr: '1. غرفة المحرك (6)', titleEn: '1. Machine Room (6)', count: 6 },
  { key: 'CAR_AND_TOP', titleAr: '2. الصاعدة وسقفها (6)', titleEn: '2. Car & Top (6)', count: 6 },
  { key: 'DOORS_LANDING', titleAr: '3. الأبواب والمداخل (5)', titleEn: '3. Doors & Sills (5)', count: 5 },
  { key: 'HOISTWAY_PIT', titleAr: '4. بئر وحفرة المصعد (5)', titleEn: '4. Hoistway & Pit (5)', count: 5 },
  { key: 'SAFETY_DEVICES', titleAr: '5. الأمان والإنقاذ (2)', titleEn: '5. Safety Devices (2)', count: 2 },
];

export const Sbc801InspectionModal: React.FC<Sbc801InspectionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  elevatorId = 'ELV-101',
  elevatorName = 'مصعد الركاب الرئيسي #1',
  buildingName = 'برج الأندلس التجاري',
  customerName = 'شركة الأندلس العقارية',
  customerPhone = '0551717838',
  technicianName = 'م. أحمد كمال الغامدي',
  technicianId = 'TECH-101',
  isOnline: isOnlineProp,
  isAr = true,
}) => {
  const hookOnline = useOnlineStatus();
  const isOnline = isOnlineProp !== undefined ? isOnlineProp : hookOnline;

  // Initialize checkpoints with default PASS
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>(() => {
    return SBC_801_STANDARD_CHECKPOINTS.map((item) => ({
      ...item,
      status: 'PASS' as CheckpointStatus,
      notes: '',
      photos: [] as AttachedPhoto[],
    }));
  });

  const [activeCategory, setActiveCategory] = useState<CheckpointCategory | 'ALL'>('ALL');
  const [generalNotes, setGeneralNotes] = useState('');
  
  // Recommended spare parts list
  const [spareParts, setSpareParts] = useState<{
    partName: string;
    quantity: number;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    notes: string;
  }[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartUrgency, setNewPartUrgency] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // General inspection photos
  const [inspectionPhotos, setInspectionPhotos] = useState<AttachedPhoto[]>([]);

  // Signatures
  const [technicianSignature, setTechnicianSignature] = useState<string | null>(null);
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [customerRepName, setCustomerRepName] = useState(customerName);
  const [activeSignPad, setActiveSignPad] = useState<'TECH' | 'CUSTOMER' | null>(null);

  if (!isOpen) return null;

  // Stats calculation
  const passCount = checkpoints.filter((c) => c.status === 'PASS').length;
  const attentionCount = checkpoints.filter((c) => c.status === 'ATTENTION').length;
  const defectCount = checkpoints.filter((c) => c.status === 'DEFECT').length;
  const criticalDefects = checkpoints.filter((c) => c.status === 'DEFECT' && c.isCritical).length;
  const score = Math.round(((passCount * 100) + (attentionCount * 65)) / (checkpoints.length * 100) * 100);

  const overallResult: 'APPROVED' | 'CONDITIONAL' | 'FAILED' = 
    criticalDefects > 0 || defectCount >= 3 
      ? 'FAILED' 
      : attentionCount > 0 || defectCount > 0 
      ? 'CONDITIONAL' 
      : 'APPROVED';

  // Quick actions
  const handleSetStatus = (id: string, status: CheckpointStatus) => {
    setCheckpoints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const handleSetNotes = (id: string, notes: string) => {
    setCheckpoints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notes } : c))
    );
  };

  const handleSetPhotos = (id: string, photos: AttachedPhoto[]) => {
    setCheckpoints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, photos } : c))
    );
  };

  const handleSetAllToPass = () => {
    setCheckpoints((prev) =>
      prev.map((c) => ({
        ...c,
        status: 'PASS',
      }))
    );
  };

  const handleAddSparePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;
    setSpareParts([
      ...spareParts,
      {
        partName: newPartName.trim(),
        quantity: Math.max(1, newPartQty),
        urgency: newPartUrgency,
        notes: '',
      },
    ]);
    setNewPartName('');
    setNewPartQty(1);
  };

  const handleRemoveSparePart = (index: number) => {
    setSpareParts(spareParts.filter((_, i) => i !== index));
  };

  const handleSaveReport = () => {
    const reportNumber = `SBC-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    
    // Merge general inspection photos into relevant checkpoints or overall
    const report: Sbc801InspectionReport = {
      id: `report-${Date.now()}`,
      reportNumber,
      elevatorId,
      elevatorName,
      buildingName,
      customerName,
      customerPhone,
      technicianId,
      technicianName,
      inspectionDate: now.toISOString().split('T')[0],
      inspectionTime: now.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      checkpoints,
      overallResult,
      scorePercentage: score,
      criticalDefectsCount: criticalDefects,
      generalNotes,
      sparePartsRecommended: spareParts,
      technicianSignature: technicianSignature || undefined,
      customerSignature: customerSignature || undefined,
      customerRepresentativeName: customerRepName,
      isSynced: isOnline,
      isOfflineCreated: !isOnline,
      createdAt: now.toISOString(),
      syncedAt: isOnline ? now.toISOString() : undefined,
    };

    // Save offline or permanent
    if (!isOnline) {
      offlineSyncService.saveReportOffline(report);
    } else {
      // Also save to permanent local store
      const permanentKey = 'twins_sbc801_all_reports';
      const existing = localStorage.getItem(permanentKey);
      const list: Sbc801InspectionReport[] = existing ? JSON.parse(existing) : [];
      localStorage.setItem(permanentKey, JSON.stringify([report, ...list]));
    }

    onSaved(report);
    onClose();
  };

  const filteredCheckpoints = activeCategory === 'ALL'
    ? checkpoints
    : checkpoints.filter((c) => c.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] my-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">
                  {isAr ? 'نموذج الفحص الدوري المعتمد (كود المصاعد السعودي SBC 801)' : 'SBC 801 Periodic Elevator Inspection'}
                </h2>
                {!isOnline && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    <span>{isAr ? 'أوفلاين (آمن)' : 'Offline Safe'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {buildingName} • {elevatorName} • {isAr ? 'الفاحص:' : 'Inspector:'} {technicianName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Score Badge */}
            <div className={`px-3 py-1.5 rounded-xl font-black text-xs border flex items-center gap-1.5 ${
              overallResult === 'APPROVED' ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300' :
              overallResult === 'CONDITIONAL' ? 'bg-amber-950 border-amber-500/60 text-amber-300' :
              'bg-rose-950 border-rose-500/60 text-rose-300'
            }`}>
              <span className="text-sm font-black">{score}%</span>
              <span className="text-[10px] opacity-80">
                {overallResult === 'APPROVED' ? (isAr ? 'مطابق' : 'Pass') : overallResult === 'CONDITIONAL' ? (isAr ? 'ملاحظات' : 'Warning') : (isAr ? 'خطر' : 'Fail')}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs & Quick Action Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold py-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {isAr ? cat.titleAr : cat.titleEn}
              </button>
            ))}
          </div>

          {/* Quick Mark All as Pass */}
          <button
            type="button"
            onClick={handleSetAllToPass}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            title={isAr ? 'تحديد كافة البنود كسليمة دفعة واحدة والتعديل حسب الحاجة' : 'Set all to pass'}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'تحديد الكل سليم ✓' : 'Mark All Pass'}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
          {/* Critical Warning if any */}
          {criticalDefects > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-900 text-xs font-bold animate-in fade-in duration-200">
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
              <span>
                {isAr
                  ? `تحذير كود SBC 801: تم رصد (${criticalDefects}) عيوب أمان حرجة! يلزم إيقاف المصعد أو إصلاح الخلل فوراً قبل إعادة التشغيل.`
                  : `Safety Warning: (${criticalDefects}) critical defects detected! Elevator must not operate until resolved.`}
              </span>
            </div>
          )}

          {/* 24 Checkpoints List */}
          <div className="space-y-3">
            {filteredCheckpoints.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.status === 'PASS'
                    ? 'bg-white border-slate-200 shadow-2xs'
                    : item.status === 'ATTENTION'
                    ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                    : item.status === 'DEFECT'
                    ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {item.code}
                      </span>
                      <h4 className="text-xs font-black text-slate-900">
                        {isAr ? item.titleAr : item.titleEn}
                      </h4>
                      {item.isCritical && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>{isAr ? 'بند حرج' : 'Critical'}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.standardReference}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isAr ? item.descriptionAr : item.descriptionEn}
                    </p>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSetStatus(item.id, 'PASS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        item.status === 'PASS'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAr ? 'سليم' : 'Pass'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStatus(item.id, 'ATTENTION')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        item.status === 'ATTENTION'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-amber-700'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isAr ? 'متابعة' : 'Watch'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStatus(item.id, 'DEFECT')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        item.status === 'DEFECT'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-rose-700'
                      }`}
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>{isAr ? 'معيب / خطر' : 'Defect'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStatus(item.id, 'NA')}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        item.status === 'NA'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>

                {/* Notes Input (Especially if Attention or Defect) */}
                <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => handleSetNotes(item.id, e.target.value)}
                    placeholder={
                      item.status === 'DEFECT'
                        ? (isAr ? 'اكتب تفاصيل العطل والإجراء المطلوب...' : 'Describe defect & required action...')
                        : (isAr ? 'ملاحظة فنية اختيارية لهذا البند...' : 'Optional notes for this checkpoint...')
                    }
                    className={`w-full text-xs p-2 rounded-xl border focus:bg-white focus:outline-none transition-colors ${
                      item.status === 'DEFECT'
                        ? 'border-rose-300 bg-white font-bold text-rose-950 focus:ring-2 focus:ring-rose-500'
                        : 'border-slate-200 bg-slate-50/70 text-slate-800 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />

                  {/* Inline Camera Photo Trigger for this specific defect */}
                  <CameraPhotoCapture
                    photos={item.photos}
                    onChange={(photos) => handleSetPhotos(item.id, photos)}
                    maxPhotos={3}
                    label={isAr ? 'إرفاق صورة البند:' : 'Attach photo:'}
                    isAr={isAr}
                    category={item.category}
                    checkpointId={item.id}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* SECTION: قطع الغيار المطلوبة وسند الصرف (RECOMMENDED REPLACEMENTS) */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'قطع الغيار المطلوب استبدالها (طلب صرف قطع):' : 'Recommended Replacement Spare Parts:'}</span>
              </h4>
              <span className="text-[10px] text-slate-400">
                {isAr ? 'يتم تحويلها لطلب صرف أو تسعير تلقائياً' : 'Auto-routed to procurement'}
              </span>
            </div>

            {/* Add Part Form */}
            <form onSubmit={handleAddSparePart} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder={isAr ? 'اسم القطعة (مثال: تيل فرامل، سير الباب)' : 'Part name'}
                className="text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none sm:col-span-2"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(parseInt(e.target.value) || 1)}
                  className="w-16 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center font-bold"
                  title="الكمية"
                />
                <select
                  value={newPartUrgency}
                  onChange={(e) => setNewPartUrgency(e.target.value as any)}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="HIGH">{isAr ? 'عاجل جداً' : 'High'}</option>
                  <option value="MEDIUM">{isAr ? 'متوسط' : 'Medium'}</option>
                  <option value="LOW">{isAr ? 'عادي' : 'Low'}</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? '+ إضافة قطعة' : '+ Add Part'}</span>
              </button>
            </form>

            {/* Spare Parts List */}
            {spareParts.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {spareParts.map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
                    <span className="font-bold text-slate-800">{part.partName}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-600">الكمية: {part.quantity}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        part.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {part.urgency === 'HIGH' ? 'عاجل' : 'متوسط'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSparePart(index)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* General Notes & Overall Camera Photos */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'الصور الميدانية العامة وملاحظات الفحص:' : 'General Inspection Photos & Notes:'}</span>
            </h4>

            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder={isAr ? 'توصيات عامة للمالك، حالة المصعد الإجمالية، توجيهات للزيارة القادمة...' : 'General recommendations, elevator overall condition...'}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <CameraPhotoCapture
              photos={inspectionPhotos}
              onChange={setInspectionPhotos}
              maxPhotos={8}
              label={isAr ? 'إرفاق صور عامة للمصعد والكابينة والماكينة:' : 'Attach general photos:'}
              isAr={isAr}
            />
          </div>

          {/* SECTION: التوقيع الرقمي (DIGITAL SIGN-OFF) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Technician Signature */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? 'توقيع واعتماد الفاحص:' : 'Inspector Signature:'}</span>
                </span>
                {technicianSignature && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isAr ? 'تم التوقيع' : 'Signed'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-bold">{technicianName}</p>

              {technicianSignature ? (
                <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50/60 flex items-center justify-center h-20">
                  <img src={technicianSignature} alt="Technician Signature" className="max-h-16 max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setTechnicianSignature(null)}
                    className="absolute top-1 right-1 text-[10px] text-rose-600 hover:underline bg-white/80 px-1.5 py-0.5 rounded"
                  >
                    {isAr ? 'إعادة التوقيع' : 'Reset'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSignPad('TECH')}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isAr ? 'توقيع الفني رقمياً الآن' : 'Sign Digitally'}</span>
                </button>
              )}
            </div>

            {/* 2. Customer Signature */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'توقيع العميل / ممثل المبنى:' : 'Customer Signature:'}</span>
                </span>
                {customerSignature && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isAr ? 'تم التوقيع' : 'Signed'}</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                value={customerRepName}
                onChange={(e) => setCustomerRepName(e.target.value)}
                placeholder={isAr ? 'اسم مستلم التقرير أو مشرف المبنى' : 'Customer rep name'}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
              />

              {customerSignature ? (
                <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50/60 flex items-center justify-center h-20">
                  <img src={customerSignature} alt="Customer Signature" className="max-h-16 max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setCustomerSignature(null)}
                    className="absolute top-1 right-1 text-[10px] text-rose-600 hover:underline bg-white/80 px-1.5 py-0.5 rounded"
                  >
                    {isAr ? 'إعادة التوقيع' : 'Reset'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSignPad('CUSTOMER')}
                  className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isAr ? 'توقيع العميل على الشاشة' : 'Customer Signature on Screen'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
                <WifiOff className="w-4 h-4" />
                <span>{isAr ? 'سيتم الحفظ محلياً والمزامنة تلقائياً عند عودة الشبكة' : 'Will save locally and sync when online'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSaveReport}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'اعتماد وحفظ تقرير الفحص SBC 801' : 'Save & Issue Certificate'}</span>
            </button>
          </div>
        </div>

        {/* Signature Pad Modal Popup */}
        {activeSignPad && (
          <DigitalSignaturePad
            titleAr={activeSignPad === 'TECH' ? 'توقيع الفاحص الفني المعتمد' : 'توقيع العميل / ممثل المبنى'}
            signatoryName={activeSignPad === 'TECH' ? technicianName : customerRepName}
            signatoryRole={activeSignPad === 'TECH' ? 'مهندس وفاحص مصاعد' : 'مشرف الموقع / العميل'}
            onSave={(signatureDataUrl) => {
              if (activeSignPad === 'TECH') {
                setTechnicianSignature(signatureDataUrl);
              } else {
                setCustomerSignature(signatureDataUrl);
              }
              setActiveSignPad(null);
            }}
            onClose={() => setActiveSignPad(null)}
            language={isAr ? 'ar' : 'en'}
          />
        )}
      </div>
    </div>
  );
};
