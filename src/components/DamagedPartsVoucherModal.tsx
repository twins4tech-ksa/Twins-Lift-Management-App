import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Trash2, 
  Plus, 
  PenTool, 
  CheckCircle2, 
  Share2, 
  Printer, 
  Wrench, 
  Building2, 
  User, 
  AlertTriangle, 
  Tag, 
  FileText,
  Clock,
  Sparkles,
  Phone,
  Image as ImageIcon,
  Save,
  Check,
  QrCode
} from 'lucide-react';
import { DamagedPartsVoucher, DamagedPartItem } from '../types/maintenance';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { TwinsLogo } from './TwinsLogo';
import { generateCustomQRDataUrl } from '../utils/qrCodeGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveVoucher: (voucher: DamagedPartsVoucher) => void;
  breakdownId?: string;
  visitId?: string;
  contractId?: string;
  elevatorName?: string;
  elevatorId?: string;
  buildingName?: string;
  customerName?: string;
  customerPhone?: string;
  technicianName?: string;
  technicianId?: string;
  existingVoucher?: DamagedPartsVoucher | null;
  isAr?: boolean;
}

const COMMON_DAMAGED_PARTS = [
  'تيل فرامل المحرك الكهرومغناطيسي',
  'كالون باب خارجي مع سويتش الأمان',
  'ستارة الفوتوسيل الضوئية للأبواب',
  'سير محرك مشغل الباب (Door Operator Belt)',
  'بكرات تعليق الصاعدة وأثقال الموازنة',
  'حبال الجر الفولاذية (Traction Ropes)',
  'بطاريات جهاز الإنقاذ الآلي للطوارئ ARD',
  'كونتاكتور لوحة الكنترول الرئيسية',
  'مروحة تبريد ماكينة المصعد',
  'كراسي انزلاق الصاعدة (Guide Shoes)',
  'مفتاح نهاية المشوار الحدي (Limit Switch)',
  'مخمد الصدمات الهيدروليكي (Buffer)'
];

export const DamagedPartsVoucherModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveVoucher,
  breakdownId,
  visitId,
  contractId,
  elevatorName = 'مصعد الركاب الرئيسي',
  elevatorId = 'ELV-101',
  buildingName = 'برج الأندلس التجاري',
  customerName = 'شركة الأندلس العقارية',
  customerPhone = '0551717838',
  technicianName = 'فني الصيانة المعتمد',
  technicianId = 'TECH-101',
  existingVoucher = null,
  isAr = true,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [voucherNumber] = useState<string>(() => existingVoucher?.voucherNumber || `DSP-${Date.now().toString().slice(-6)}`);
  const [items, setItems] = useState<DamagedPartItem[]>(() => existingVoucher?.items || []);
  const [generalNotes, setGeneralNotes] = useState<string>(existingVoucher?.generalNotes || '');
  const [customerRepName, setCustomerRepName] = useState<string>(existingVoucher?.customerRepName || customerName);

  // New item draft states
  const [draftPartName, setDraftPartName] = useState('');
  const [draftQuantity, setDraftQuantity] = useState(1);
  const [draftDamageReason, setDraftDamageReason] = useState('تآكل واهتراء ميكانيكي');
  const [draftUrgency, setDraftUrgency] = useState<'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'NORMAL'>('HIGH');
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Signatures
  const [techSignature, setTechSignature] = useState<string | null>(existingVoucher?.technicianSignature || null);
  const [customerSignature, setCustomerSignature] = useState<string | null>(existingVoucher?.customerSignature || null);
  const [activeSignPad, setActiveSignPad] = useState<'TECH' | 'CUSTOMER' | null>(null);

  // View state: 'EDIT' | 'PRINT_PREVIEW'
  const [viewMode, setViewMode] = useState<'EDIT' | 'PREVIEW'>('EDIT');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    generateCustomQRDataUrl(`https://twins4tech.com/voucher/${voucherNumber}`).then(setQrDataUrl);
  }, [voucherNumber]);

  if (!isOpen) return null;

  // Compress photo helper
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPhoto(true);
    try {
      const dataUrl = await processImage(file);
      setDraftPhoto(dataUrl);
    } catch (err) {
      console.error('Error processing part photo', err);
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftPartName.trim()) return;

    const newItem: DamagedPartItem = {
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      partName: draftPartName.trim(),
      quantity: Math.max(1, draftQuantity),
      damageReason: draftDamageReason,
      urgency: draftUrgency,
      photoUrl: draftPhoto || undefined,
      photoTimestamp: draftPhoto ? new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
    };

    setItems([...items, newItem]);
    setDraftPartName('');
    setDraftQuantity(1);
    setDraftPhoto(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSaveAndIssue = () => {
    if (items.length === 0) {
      alert(isAr ? 'يرجى إضافة قطعة غيار تالفة واحدة على الأقل قبل الاعتماد' : 'Please add at least one damaged part');
      return;
    }

    const voucher: DamagedPartsVoucher = {
      id: existingVoucher?.id || `vch-${Date.now()}`,
      voucherNumber,
      breakdownId,
      visitId,
      contractId,
      elevatorId,
      elevatorName,
      buildingName,
      customerName,
      customerPhone,
      technicianId,
      technicianName,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'ISSUED',
      items,
      technicianSignature: techSignature || undefined,
      customerSignature: customerSignature || undefined,
      customerRepName,
      generalNotes,
      createdAt: new Date().toISOString(),
    };

    // Store in permanent local store
    try {
      const storageKey = 'twins_damaged_parts_vouchers';
      const stored = localStorage.getItem(storageKey);
      const list: DamagedPartsVoucher[] = stored ? JSON.parse(stored) : [];
      const updatedList = [voucher, ...list.filter((v) => v.id !== voucher.id)];
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Could not save voucher', e);
    }

    onSaveVoucher(voucher);
    setViewMode('PREVIEW');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const partsSummary = items.map((p, idx) => `${idx + 1}. *${p.partName}* (الكمية: ${p.quantity}) - السبب: ${p.damageReason} [${p.urgency === 'EMERGENCY' ? '🚨 طارئ جداً' : 'عاجل'}]`).join('\n');
    const text = `*سند طلب وصرف قطع غيار تالفة للمصعد* 📋⚙️\n` +
      `▫️ *رقم السند:* ${voucherNumber}\n` +
      `▫️ *العميل:* ${customerName}\n` +
      `▫️ *المبنى والموقع:* ${buildingName}\n` +
      `▫️ *المصعد:* ${elevatorName}\n` +
      `▫️ *الفني المعتمد:* ${technicianName}\n` +
      `▫️ *التاريخ:* ${new Date().toLocaleDateString('ar-SA')}\n\n` +
      `*القطع التالفة المطلوب صرفها:*\n${partsSummary}\n\n` +
      (generalNotes ? `▫️ *ملاحظات الفحص:* ${generalNotes}\n\n` : '') +
      `✅ تم التوثيق بالصور المباشرة للكاميرا وتوقيع محضر الاستلام.\n` +
      `*شركة مصاعد التوأم للتجارة والمقاولات* 🏢`;

    const phone = customerPhone?.replace(/\D/g, '') || '';
    const url = phone 
      ? `https://wa.me/${phone.startsWith('966') ? phone : `966${phone.replace(/^0/, '')}`}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Hidden Camera Inputs with capture="environment" for direct mobile lens */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoCapture}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoCapture}
        />

        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  {isAr ? 'سند طلب وصرف قطع غيار تالفة (توثيق بالكاميرا)' : 'Damaged Parts Requisition Voucher'}
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {voucherNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {buildingName} • {elevatorName} • {isAr ? 'الفني:' : 'Tech:'} {technicianName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'EDIT' ? (
              <button
                type="button"
                onClick={() => setViewMode('PREVIEW')}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isAr ? 'معاينة السند' : 'Preview Voucher'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode('EDIT')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تعديل البيانات' : 'Edit'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إرسال واتساب' : 'WhatsApp'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة / PDF' : 'Print'}</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {viewMode === 'EDIT' ? (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {/* Context Info Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">{isAr ? 'العميل والمبنى:' : 'Customer & Site:'}</span>
                <span className="font-black text-slate-900">{customerName}</span>
                <p className="text-slate-500">{buildingName}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">{isAr ? 'المصعد المعني:' : 'Elevator:'}</span>
                <span className="font-black text-slate-900">{elevatorName}</span>
                <p className="font-mono text-slate-500">ID: {elevatorId}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">{isAr ? 'الفني المسؤول:' : 'Technician:'}</span>
                <span className="font-black text-slate-900">{technicianName}</span>
                <p className="text-slate-500 font-mono">{new Date().toISOString().split('T')[0]}</p>
              </div>
            </div>

            {/* Form to Add Damaged Part with DIRECT CAMERA CAPTURE */}
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'إضافة وتصوير قطعة غيار تالفة (مباشرة بالكاميرا):' : 'Snap & Add Damaged Part:'}</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-medium">
                  {isAr ? 'التقط صورة واضحة للقطعة المعطوبة لتوثيق سند الصرف' : 'Take a live photo of damaged part'}
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 block">
                  {isAr ? 'اختيار سريع لأكثر القطع تكراراً:' : 'Quick Select Common Parts:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DAMAGED_PARTS.slice(0, 8).map((part) => (
                    <button
                      key={part}
                      type="button"
                      onClick={() => setDraftPartName(part)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        draftPartName === part
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {part}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Part Name */}
                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isAr ? 'اسم القطعة التالفة *' : 'Part Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={draftPartName}
                      onChange={(e) => setDraftPartName(e.target.value)}
                      placeholder={isAr ? 'اسم القطعة بالتفصيل (مثل: تيل فرامل، سير الباب)' : 'Part name...'}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isAr ? 'الكمية' : 'Qty'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={draftQuantity}
                      onChange={(e) => setDraftQuantity(parseInt(e.target.value) || 1)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-center font-bold font-mono"
                    />
                  </div>

                  {/* Urgency */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isAr ? 'درجة الإلحاح' : 'Urgency'}
                    </label>
                    <select
                      value={draftUrgency}
                      onChange={(e) => setDraftUrgency(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    >
                      <option value="EMERGENCY">{isAr ? '🚨 طارئ جداً (المصعد متوقف)' : 'Emergency (Elevator Down)'}</option>
                      <option value="HIGH">{isAr ? '⚠️ عاجل (ضروري للتشغيل الآمن)' : 'High Priority'}</option>
                      <option value="MEDIUM">{isAr ? '🔶 متوسط (خلال 48 ساعة)' : 'Medium'}</option>
                      <option value="NORMAL">{isAr ? '⚪ صيانة وقائية معتادة' : 'Normal / Next Visit'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  {/* Failure Reason */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {isAr ? 'سبب التلف / التشخيص الميداني:' : 'Cause of Damage / Defect:'}
                    </label>
                    <select
                      value={draftDamageReason}
                      onChange={(e) => setDraftDamageReason(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
                    >
                      <option value="تآكل واهتراء ميكانيكي بفعل الاستهلاك">{isAr ? 'تآكل واهتراء ميكانيكي بفعل الاستهلاك' : 'Mechanical wear and tear'}</option>
                      <option value="كسر أو التواء ميكانيكي بالقطعة">{isAr ? 'كسر أو التواء ميكانيكي بالقطعة' : 'Fracture / deformation'}</option>
                      <option value="حرق ملفات أو التماس كهربائي">{isAr ? 'حرق ملفات أو التماس كهربائي' : 'Electrical burnout'}</option>
                      <option value="انتهاء العمر الافتراضي أو تسريب">{isAr ? 'انتهاء العمر الافتراضي أو تسريب' : 'Life expiry / seal leakage'}</option>
                      <option value="تلف ناتج عن انقطاع أو تذبذب تيار كهربائي">{isAr ? 'تلف ناتج عن انقطاع وتذبذب التيار' : 'Power surge damage'}</option>
                    </select>
                  </div>

                  {/* Direct Camera Trigger & Photo Preview */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{isAr ? 'صورة القطعة التالفة (مباشرة بالكاميرا):' : 'Damaged Part Photo:'}</span>
                      {draftPhoto && (
                        <button
                          type="button"
                          onClick={() => setDraftPhoto(null)}
                          className="text-[10px] text-rose-600 hover:underline font-bold"
                        >
                          {isAr ? 'حذف الصورة' : 'Remove'}
                        </button>
                      )}
                    </label>

                    {draftPhoto ? (
                      <div className="relative rounded-xl border border-amber-300 bg-amber-50/50 p-2 flex items-center gap-3">
                        <img
                          src={draftPhoto}
                          alt="Part Photo"
                          className="w-16 h-16 rounded-lg object-cover border border-amber-200 shadow-2xs shrink-0"
                        />
                        <div className="text-xs">
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تم التقاط صورة القطعة بنجاح' : 'Photo captured'}</span>
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {isAr ? 'سيتم تضمين الصورة في سند الصرف الرسمي' : 'Included in voucher'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          disabled={isProcessingPhoto}
                          className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                        >
                          <Camera className="w-4 h-4 text-amber-200" />
                          <span>{isProcessingPhoto ? (isAr ? 'جاري المعالجة...' : 'Processing...') : (isAr ? '📷 التقاط صورة بالكاميرا فوراً' : 'Take Photo')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                          title={isAr ? 'اختيار من الاستديو' : 'Gallery'}
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? '+ إضافة القطعة إلى سند الصرف' : '+ Add to Voucher'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of Added Damaged Parts */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? `قائمة القطع المعتمدة في هذا السند (${items.length}):` : `Voucher Items (${items.length}):`}</span>
                </h4>
                {items.length > 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {isAr ? 'جاهزة لإصدار سند الصرف' : 'Ready'}
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">
                    {isAr ? 'لم تتم إضافة أي قطع تالفة حتى الآن' : 'No damaged parts added yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAr ? 'استخدم النموذج أعلاه لالتقاط صورة وتوثيق القطع المطلوب استبدالها' : 'Use form above to snap damaged parts'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>

                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.partName}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-2xs shrink-0 cursor-pointer"
                            onClick={() => window.open(item.photoUrl, '_blank')}
                            title={isAr ? 'انقر لتكبير الصورة' : 'Click to zoom'}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Camera className="w-5 h-5" />
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900">{item.partName}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                              item.urgency === 'EMERGENCY' ? 'bg-rose-100 text-rose-800' :
                              item.urgency === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {item.urgency === 'EMERGENCY' ? (isAr ? 'طارئ جداً' : 'Emergency') :
                               item.urgency === 'HIGH' ? (isAr ? 'عاجل' : 'High') :
                               (isAr ? 'عادي' : 'Normal')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {isAr ? 'السبب:' : 'Reason:'} {item.damageReason} • {isAr ? 'الكمية:' : 'Qty:'} <strong className="text-slate-800 font-mono">{item.quantity}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title={isAr ? 'حذف من السند' : 'Remove'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Notes & Diagnoses */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{isAr ? 'ملاحظات وتوجيهات لقسم المستودع وسلاسل الإمداد:' : 'Notes for Warehouse / Procurement:'}</span>
              </label>
              <textarea
                rows={2}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder={isAr ? 'اكتب ملاحظات إضافية بخصوص المقاسات، الطراز، أو شروط التسليم...' : 'Optional notes for warehouse admin...'}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Digital Signatures Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Technician Signature */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'توقيع الفاحص طالب الصرف:' : 'Technician Sign:'}</span>
                  </span>
                  {techSignature && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isAr ? 'معتمد' : 'Signed'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-bold">{technicianName}</p>

                {techSignature ? (
                  <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center h-16">
                    <img src={techSignature} alt="Tech Signature" className="max-h-14 max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setTechSignature(null)}
                      className="absolute top-1 right-1 text-[10px] text-rose-600 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200"
                    >
                      {isAr ? 'تعديل' : 'Reset'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveSignPad('TECH')}
                    className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{isAr ? 'توقيع الفني رقمياً' : 'Sign Digitally'}</span>
                  </button>
                )}
              </div>

              {/* Customer / Supervisor Signature */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'اعتماد العميل / مشرف الموقع:' : 'Customer Representative:'}</span>
                  </span>
                  {customerSignature && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isAr ? 'معتمد' : 'Signed'}</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={customerRepName}
                  onChange={(e) => setCustomerRepName(e.target.value)}
                  placeholder={isAr ? 'اسم ممثل المبنى أو العميل' : 'Representative Name'}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                />

                {customerSignature ? (
                  <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center h-16">
                    <img src={customerSignature} alt="Customer Signature" className="max-h-14 max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setCustomerSignature(null)}
                      className="absolute top-1 right-1 text-[10px] text-rose-600 hover:underline bg-white px-1.5 py-0.5 rounded border border-slate-200"
                    >
                      {isAr ? 'تعديل' : 'Reset'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveSignPad('CUSTOMER')}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{isAr ? 'توقيع العميل على الشاشة' : 'Customer Sign on Screen'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Printable Official Voucher Document Body */
          <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-0 print:overflow-visible">
            {/* Document Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5">
              <div className="flex items-center gap-3">
                <TwinsLogo className="w-14 h-14" />
                <div>
                  <h1 className="text-lg font-black text-slate-900">شركة مصاعد التوأم للتجارة والمقاولات</h1>
                  <p className="text-xs text-slate-500 font-bold">إدارة الصيانة وسلاسل الإمداد ومستودع قطع الغيار</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-amber-100 text-amber-900 border border-amber-300">
                      سند طلب وصرف قطع غيار تالفة
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-600">
                      #{voucherNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left rtl:text-left ltr:text-right flex items-center gap-4">
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800">{isAr ? 'تاريخ السند:' : 'Date:'} {new Date().toISOString().split('T')[0]}</p>
                  <p className="text-[11px] text-slate-500">{new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">موثق إلكترونياً بالصور</p>
                </div>
                <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-14 h-14 border border-slate-300 rounded-lg p-0.5 object-contain" />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-lg border flex items-center justify-center text-slate-400">
                      <QrCode className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">العميل / المنشأة:</span>
                <span className="font-black text-slate-900">{customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">المبنى والموقع:</span>
                <span className="font-black text-slate-900">{buildingName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">المصعد:</span>
                <span className="font-black text-slate-900">{elevatorName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">الفاحص طالب الصرف:</span>
                <span className="font-black text-slate-900">{technicianName}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-1">
                بيان قطع الغيار التالفة المطلوب استبدالها وصرفها:
              </h4>

              <table className="w-full text-xs text-right border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-black">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5">اسم القطعة</th>
                    <th className="p-2.5 w-16 text-center">الكمية</th>
                    <th className="p-2.5">سبب الاستبدال / التشخيص</th>
                    <th className="p-2.5 w-24 text-center">درجة الإلحاح</th>
                    <th className="p-2.5 w-24 text-center">صورة العطل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="p-2.5 font-black text-slate-900">{item.partName}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                      <td className="p-2.5 text-slate-600">{item.damageReason}</td>
                      <td className="p-2.5 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          item.urgency === 'EMERGENCY' ? 'bg-rose-100 text-rose-800' :
                          item.urgency === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.urgency === 'EMERGENCY' ? 'طارئ جداً' : item.urgency === 'HIGH' ? 'عاجل' : 'عادي'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt="Damaged part"
                            className="w-10 h-10 rounded-md object-cover mx-auto border border-slate-300"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">بدون صورة</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Gallery of photos in print */}
            {items.some((i) => i.photoUrl) && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-black text-slate-900">
                  الملحق المصور للقطع التالفة من الموقع الميداني:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {items.filter((i) => i.photoUrl).map((it) => (
                    <div key={it.id} className="border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                      <img
                        src={it.photoUrl}
                        alt={it.partName}
                        className="w-full h-28 object-cover rounded-lg"
                      />
                      <p className="text-[10px] font-bold text-slate-800 truncate">{it.partName}</p>
                      <p className="text-[9px] text-slate-500 font-mono">{it.photoTimestamp || 'ميداني'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signatures on Voucher */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-900 text-center text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">الفاحص الفني طالب الصرف</span>
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 h-20 flex items-center justify-center">
                  {techSignature ? (
                    <img src={techSignature} alt="Tech Sign" className="max-h-16 object-contain" />
                  ) : (
                    <span className="text-slate-400 text-xs">{technicianName}</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-bold">{technicianName}</p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">اعتماد واستلام العميل / مسؤول الموقع</span>
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 h-20 flex items-center justify-center">
                  {customerSignature ? (
                    <img src={customerSignature} alt="Customer Sign" className="max-h-16 object-contain" />
                  ) : (
                    <span className="text-slate-400 text-xs">{customerRepName}</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-bold">{customerRepName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          {viewMode === 'EDIT' ? (
            <button
              type="button"
              onClick={handleSaveAndIssue}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-600/25 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'اعتماد وإصدار سند الصرف الرسمي' : 'Save & Issue Voucher'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'تم حفظ السند بنجاح' : 'Done'}</span>
            </button>
          )}
        </div>

        {/* Signature Pad Popup Modal */}
        {activeSignPad && (
          <DigitalSignaturePad
            titleAr={activeSignPad === 'TECH' ? 'توقيع الفاحص طالب صرف القطع' : 'توقيع العميل / ممثل المبنى على السند'}
            signatoryName={activeSignPad === 'TECH' ? technicianName : customerRepName}
            signatoryRole={activeSignPad === 'TECH' ? 'فاحص فني ومسؤول صيانة' : 'مشرف الموقع / العميل'}
            onSave={(signatureDataUrl) => {
              if (activeSignPad === 'TECH') {
                setTechSignature(signatureDataUrl);
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
