import React, { useState } from 'react';
import { 
  Building2, 
  Wrench, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Camera, 
  Navigation, 
  Phone, 
  MessageSquare, 
  QrCode, 
  CheckCircle2, 
  X, 
  Clock, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  Printer,
  ChevronRight,
  User,
  MapPin,
  Calendar,
  Cpu,
  Share2
} from 'lucide-react';
import { MaintenanceContract, MaintenanceBreakdown, DamagedPartsVoucher } from '../types/maintenance';
import { Sbc801InspectionReport } from '../types/inspection';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/settings';
import { TwinsLogo } from './TwinsLogo';

export interface ElevatorPassportData {
  elevatorId: string;
  elevatorName: string;
  elevatorSerial?: string;
  buildingName: string;
  siteLocation: string;
  customerName: string;
  customerPhone?: string;
  latitude?: number;
  longitude?: number;
  capacityKg?: number;
  passengers?: number;
  stops?: number;
  speed?: string;
  machineType?: string;
  controllerType?: string;
  contractRef?: string;
  contractStatus?: string;
  lastVisitDate?: string;
  nextVisitDate?: string;
}

interface ElevatorPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elevator: ElevatorPassportData | null;
  contract?: MaintenanceContract | null;
  breakdowns?: MaintenanceBreakdown[];
  vouchers?: DamagedPartsVoucher[];
  inspectionReports?: Sbc801InspectionReport[];
  companySettings?: CompanySettings;
  isAr?: boolean;
  onStartSbcInspection?: (elevator: ElevatorPassportData) => void;
  onRequestParts?: (elevator: ElevatorPassportData) => void;
  onOpenDrawings?: () => void;
  onOpenCabinSticker?: (elevator: ElevatorPassportData) => void;
  onReportBreakdown?: (elevator: ElevatorPassportData) => void;
}

export const ElevatorPassportModal: React.FC<ElevatorPassportModalProps> = ({
  isOpen,
  onClose,
  elevator,
  contract,
  breakdowns = [],
  vouchers = [],
  inspectionReports = [],
  companySettings = DEFAULT_COMPANY_SETTINGS,
  isAr = true,
  onStartSbcInspection,
  onRequestParts,
  onOpenDrawings,
  onOpenCabinSticker,
  onReportBreakdown,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'PARTS' | 'INSPECTIONS'>('OVERVIEW');

  if (!isOpen || !elevator) return null;

  // Filter elevator-specific breakdowns
  const elevatorBreakdowns = breakdowns.filter(
    b => b.elevatorName === elevator.elevatorName || (b.contractId && contract && b.contractId === contract.id)
  );

  // Filter elevator-specific vouchers
  const elevatorVouchers = vouchers.filter(
    v => v.elevatorName === elevator.elevatorName || (v.contractId && contract && v.contractId === contract.id)
  );

  // Filter elevator-specific inspection reports
  const elevatorReports = inspectionReports.filter(
    r => r.elevatorName === elevator.elevatorName
  );

  // Open Google Maps / Navigation
  const handleOpenMaps = () => {
    if (elevator.latitude && elevator.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${elevator.latitude},${elevator.longitude}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(elevator.siteLocation)}`, '_blank');
    }
  };

  // Open WhatsApp contact
  const handleOpenWhatsApp = () => {
    if (!elevator.customerPhone) return;
    const cleanPhone = elevator.customerPhone.replace(/[^0-9]/g, '');
    const text = isAr 
      ? `السلام عليكم، معكم الفني من شركة ${companySettings.companyNameAr || 'توينز للمصاعد'}. أنا في طريقي لموقع ${elevator.buildingName} لمباشرة صيانة المصعد (${elevator.elevatorName}).`
      : `Hello, this is the technician from ${companySettings.companyNameEn || 'Twins Elevators'}. I am heading to ${elevator.buildingName} for elevator maintenance (${elevator.elevatorName}).`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0B1E3B] via-[#16335C] to-[#0B1E3B] text-white flex items-center justify-between shrink-0 border-b border-blue-900/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30">
                  {isAr ? 'جواز سفر وبطاقة المصعد الرقمية' : 'Elevator Digital Passport'}
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {elevator.elevatorSerial || elevator.elevatorId}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {elevator.elevatorName} — {elevator.buildingName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QUICK ACTION BAR (CONNECTING EVERYTHING FOR THE TECH) */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 select-none">
          {onStartSbcInspection && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartSbcInspection(elevator);
              }}
              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{isAr ? 'بدء فحص SBC 801 (24 نقطة)' : 'Start SBC 801'}</span>
            </button>
          )}

          {onRequestParts && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestParts(elevator);
              }}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <Camera className="w-4 h-4 text-amber-200" />
              <span>{isAr ? 'طلب قطع تالفة' : 'Request Parts'}</span>
            </button>
          )}

          {onOpenDrawings && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDrawings();
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-cyan-300" />
              <span>{isAr ? 'المخطط الهندسي CAD' : 'CAD Drawings'}</span>
            </button>
          )}

          {onOpenCabinSticker && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCabinSticker(elevator);
              }}
              className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>{isAr ? 'ملصق الكابينة وQR' : 'Cabin Decal'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenMaps}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-blue-600 fill-blue-600" />
            <span>{isAr ? 'ملاحة الخريطة' : 'Navigation'}</span>
          </button>

          {elevator.customerPhone && (
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isAr ? 'واتساب العميل' : 'WhatsApp'}</span>
            </button>
          )}
        </div>

        {/* TABS */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'المواصفات والبيانات الفنية' : 'Specifications'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'HISTORY' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? `الأعطال السابقة (${elevatorBreakdowns.length})` : `Breakdowns (${elevatorBreakdowns.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PARTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PARTS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{isAr ? `قطع الغيار المصروفة (${elevatorVouchers.length})` : `Parts (${elevatorVouchers.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INSPECTIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INSPECTIONS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? `شهادات SBC 801 (${elevatorReports.length})` : `Audits (${elevatorReports.length})`}</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50">
          
          {/* TAB 1: OVERVIEW & SPECS */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              
              {/* Technical Passport Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-600" />
                    <h3 className="font-black text-sm text-slate-900">
                      {isAr ? 'البطاقة الفنية والتجهيزات الميكانيكية والكهربائية' : 'Technical Specifications'}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {contract?.status === 'Active' ? (isAr ? 'عقد صيانة ساري ✓' : 'Active Contract') : (isAr ? 'مُسجل بالنظام' : 'Registered')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'الحمولة وسعة الكابينة' : 'Capacity'}</span>
                    <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                      {elevator.capacityKg || 630} كجم ({elevator.passengers || 8} ركاب)
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'عدد الأدوار والتوقفات' : 'Stops'}</span>
                    <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                      {elevator.stops || contract?.elevatorStops || 6} توقفات
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'السرعة المقننة' : 'Rated Speed'}</span>
                    <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                      {elevator.speed || '1.0 م/ث'}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'نوع الماكينة والمحرك' : 'Traction Machine'}</span>
                    <strong className="text-slate-900 text-sm block mt-0.5 truncate">
                      {elevator.machineType || 'Gearless PMSM متزامن'}
                    </strong>
                  </div>
                </div>

                {/* Building & Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60 space-y-1">
                    <div className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isAr ? 'الموقع والعنوان الجغرافي:' : 'Site Location:'}</span>
                    </div>
                    <div className="font-bold text-slate-900">{elevator.buildingName}</div>
                    <div className="text-slate-600 text-[11px]">{elevator.siteLocation}</div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-1">
                    <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مسؤول الموقع والعميل:' : 'Client & Site Contact:'}</span>
                    </div>
                    <div className="font-bold text-slate-900">{elevator.customerName}</div>
                    <div className="text-slate-600 font-mono text-[11px] flex items-center gap-2">
                      <span>{elevator.customerPhone || 'بدون هاتف'}</span>
                      {elevator.customerPhone && (
                        <a 
                          href={`tel:${elevator.customerPhone}`}
                          className="text-emerald-700 hover:underline font-bold text-[10px]"
                        >
                          (اتصال 📞)
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Contract & Next Visit Summary */}
              {contract && (
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <h4 className="font-bold text-xs text-slate-900">
                        {isAr ? 'بيانات عقد الصيانة الدوري المعتمد' : 'Maintenance Contract'}
                      </h4>
                    </div>
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {contract.contractRef}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isAr ? 'تاريخ البدء:' : 'Start:'}</span>
                      <strong className="text-slate-800 font-mono">{contract.startDate}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isAr ? 'تاريخ الانتهاء:' : 'End:'}</span>
                      <strong className="text-slate-800 font-mono">{contract.endDate}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isAr ? 'عدد الزيارات السنوية:' : 'Visits/Year:'}</span>
                      <strong className="text-slate-800 font-mono">{contract.annualVisitsCount} زيارة</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isAr ? 'تغطية الطوارئ:' : 'Emergency 24/7:'}</span>
                      <strong className="text-emerald-600 font-bold">{contract.emergencyCoverage ? 'مشمولة 24/7' : 'غير مشمولة'}</strong>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: BREAKDOWNS HISTORY */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              {elevatorBreakdowns.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-800">لا توجد بلاغات أعطال مسجلة لهذا المصعد</p>
                  <p className="text-xs text-slate-400 mt-0.5">المصعد بحالة تشغيلية ممتازة</p>
                </div>
              ) : (
                elevatorBreakdowns.map(b => (
                  <div key={b.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.priority === 'Emergency' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {b.priority}
                        </span>
                        <span className="font-mono text-xs text-slate-500">#{b.id}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{b.reportedAt}</span>
                    </div>
                    <p className="text-xs text-slate-800 font-semibold">{b.description}</p>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>الفني المسند: {b.assignedTechnicianName || 'غير مسند'}</span>
                      <span className={`font-bold ${b.isResolved ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {b.isResolved ? '✓ تم الإصلاح' : 'قيد المتابعة'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: DAMAGED PARTS VOUCHERS */}
          {activeTab === 'PARTS' && (
            <div className="space-y-3">
              {elevatorVouchers.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                  <Wrench className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-800">لم يتم إصدار سندات صرف قطع غيار تالفة لهذا المصعد</p>
                </div>
              ) : (
                elevatorVouchers.map(v => (
                  <div key={v.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        #{v.voucherNumber}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{v.requestDate}</span>
                    </div>
                    <div className="space-y-1">
                      {v.items.map(item => (
                        <div key={item.id} className="text-xs text-slate-700 flex items-center justify-between bg-slate-50 p-1.5 rounded">
                          <span>{item.partName} (الكمية: {item.quantity})</span>
                          <span className="text-[10px] text-slate-500 font-mono">{item.urgency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: SBC 801 INSPECTIONS */}
          {activeTab === 'INSPECTIONS' && (
            <div className="space-y-3">
              {elevatorReports.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                  <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-800">لا توجد شهادات فحص دوري سابقة مسجلة</p>
                  <p className="text-xs text-slate-400 mt-0.5">يمكنك بدء فحص جديد من زر الإجراءات السريعة بالأعلى</p>
                </div>
              ) : (
                elevatorReports.map(rep => (
                  <div key={rep.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {rep.reportNumber || rep.id}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{rep.inspectionDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>الفاحص: {rep.technicianName}</span>
                      <span className="font-bold text-emerald-600">
                        النتيجة: {rep.scorePercentage}% ({rep.overallResult})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>نظام جواز سفر المصعد الذكي • شركة توينز للمصاعد</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
