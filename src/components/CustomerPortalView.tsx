import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types/portal';
import { 
  MaintenanceContract, 
  MaintenanceBreakdown, 
  MaintenanceVisit, 
  VISIT_STATUS_CONFIG,
  MaintenanceVisitReview 
} from '../types/maintenance';
import { ElevatorSpecification } from '../types/elevator';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../types/settings';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  MessageSquare, 
  FileText, 
  Layers, 
  Plus, 
  ShieldCheck, 
  Wrench,
  Search,
  ExternalLink,
  ChevronRight,
  CheckCheck,
  CalendarCheck,
  Calendar,
  RotateCcw,
  Phone
} from 'lucide-react';
import MaintenanceVisitReviewModal from './MaintenanceVisitReviewModal';
import { SendWhatsAppModal } from './SendWhatsAppModal';

interface Props {
  currentUser: UserProfile;
  contracts: MaintenanceContract[];
  breakdowns: MaintenanceBreakdown[];
  spec: ElevatorSpecification;
  onReportBreakdown: (breakdown: Omit<MaintenanceBreakdown, 'id' | 'reportedAt' | 'isResolved'>) => void;
  onOpenDrawings: () => void;
  companySettings?: CompanySettings;
  isAr?: boolean;
}

export const CustomerPortalView: React.FC<Props> = ({
  currentUser,
  contracts,
  breakdowns,
  spec,
  onReportBreakdown,
  onOpenDrawings,
  companySettings = DEFAULT_COMPANY_SETTINGS,
  isAr = true,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [breakdownElevator, setBreakdownElevator] = useState<string>(
    contracts[0]?.elevatorName || spec.quoteRef || 'مصعد المبنى الرئيسي'
  );
  const [breakdownPriority, setBreakdownPriority] = useState<'Emergency' | 'High' | 'Medium' | 'Low'>('Emergency');
  const [breakdownDescription, setBreakdownDescription] = useState<string>('');
  const [siteLocation, setSiteLocation] = useState<string>(
    contracts[0]?.siteLocation || currentUser.customerCompany || 'الرياض - حي الأندلس'
  );
  const [reportSuccess, setReportSuccess] = useState(false);

  // Visits state & filters for client
  const [clientVisitFilter, setClientVisitFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [clientVisitSearch, setClientVisitSearch] = useState<string>('');
  const [viewingReviewVisit, setViewingReviewVisit] = useState<{ visit: MaintenanceVisit; contract: MaintenanceContract } | null>(null);

  // WhatsApp modal state for client contacting company / tech
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waRecipient, setWaRecipient] = useState('');

  // Filter client data (match by customerId or customerName/Company)
  const clientContracts = contracts.filter(
    (c) => 
      (currentUser.customerId && c.customerId === currentUser.customerId) ||
      c.customerName.includes(currentUser.name) ||
      (currentUser.customerCompany && c.customerCompany?.includes(currentUser.customerCompany)) ||
      contracts.length <= 2 // fallback if sample data
  );

  // Extract all client visits across contracts
  const clientVisits = useMemo(() => {
    const list: { contract: MaintenanceContract; visit: MaintenanceVisit; isPast: boolean }[] = [];
    const today = new Date().toISOString().split('T')[0];
    clientContracts.forEach((c) => {
      c.visits.forEach((v) => {
        list.push({
          contract: c,
          visit: v,
          isPast: v.scheduledDate < today,
        });
      });
    });
    return list.sort((a, b) => new Date(b.visit.scheduledDate).getTime() - new Date(a.visit.scheduledDate).getTime());
  }, [clientContracts]);

  // Filtered client visits
  const filteredClientVisits = useMemo(() => {
    return clientVisits.filter((item) => {
      const q = clientVisitSearch.toLowerCase().trim();
      const matchSearch = !q ||
        item.contract.elevatorName.toLowerCase().includes(q) ||
        (item.visit.technician && item.visit.technician.toLowerCase().includes(q)) ||
        (item.visit.scheduledDate && item.visit.scheduledDate.includes(q));

      let matchFilter = true;
      if (clientVisitFilter === 'UPCOMING') {
        matchFilter = item.visit.status !== 'Completed';
      } else if (clientVisitFilter === 'COMPLETED') {
        matchFilter = item.visit.status === 'Completed';
      }

      return matchSearch && matchFilter;
    });
  }, [clientVisits, clientVisitFilter, clientVisitSearch]);

  const clientBreakdowns = breakdowns.filter(
    (b) =>
      (currentUser.customerId && b.customerId === currentUser.customerId) ||
      b.customerName.includes(currentUser.name) ||
      breakdowns.length <= 3 // fallback if sample data
  );

  const activeBreakdowns = clientBreakdowns.filter((b) => !b.isResolved);
  const resolvedBreakdowns = clientBreakdowns.filter((b) => b.isResolved);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdownDescription.trim()) return;

    onReportBreakdown({
      customerId: currentUser.customerId,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      siteLocation: siteLocation,
      elevatorName: breakdownElevator,
      description: breakdownDescription,
      status: 'Reported',
      priority: breakdownPriority,
    });

    setBreakdownDescription('');
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ===================================================================== */}
      {/* 1. WELCOME HERO & QUICK ACTION BAR                                    */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>بوابة العميل المعتمد &bull; خدمة الملاك 24/7</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              مرحباً بك، {currentUser.customerCompany || currentUser.name}
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1.5 max-w-xl leading-relaxed">
              تابع حالة مصاعدك المسجلة، جداول الزيارات الوقائية، وسجل بلاغات الأعطال مع فريق الدعم الفني مباشرة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs md:text-sm rounded-2xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 fill-white" />
              <span>تسجيل بلاغ عطل طارئ</span>
            </button>
            <button
              type="button"
              onClick={onOpenDrawings}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm rounded-2xl border border-white/20 transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>المخطط الهندسي ونظام التعليق</span>
            </button>
          </div>
        </div>

        {/* Quick Contact Ribbon */}
        <div className="mt-6 pt-5 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 text-emerald-200">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>طوارئ 24 ساعة: 920001234</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>واتساب الصيانة: +966 50 123 4567</span>
            </span>
          </div>
          <div className="text-emerald-300/80 font-mono text-[11px]">
            رقم العميل الموحد: {currentUser.customerId || 'CUST-0092'}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. STATS TILES                                                        */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المصاعد المسجلة</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {clientContracts.length || 1}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> جميعها مشمولة بالضمان
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">عقود الصيانة السارية</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {clientContracts.filter((c) => c.status === 'Active').length || clientContracts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            تجديد سنوي معتمد
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">البلاغات النشطة</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {activeBreakdowns.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {activeBreakdowns.length === 0 ? 'لا توجد أعطال حالية' : 'جاري المتابعة والإصلاح'}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">البلاغات المنجزة</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">
            {resolvedBreakdowns.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            سجل الصيانة الوقائية
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MY ELEVATORS & ACTIVE CONTRACTS CARDS                              */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">
              مصاعدي وعقود الصيانة النشطة
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            عدد المصاعد: {clientContracts.length || 1}
          </span>
        </div>

        <div className="p-6 divide-y divide-slate-100">
          {(clientContracts.length > 0 ? clientContracts : [null]).map((contract, idx) => {
            const elevatorTitle = contract?.elevatorName || `مصعد الركاب الرئيسي (${spec.capacityKg} كجم - ${spec.personsCount} ركاب)`;
            const location = contract?.siteLocation || currentUser.customerCompany || 'موقع العميل';
            const status = contract?.status || 'Active';
            const roping = spec.ropingRatio || '2:1';

            return (
              <div key={contract?.id || idx} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black shrink-0 border border-emerald-200">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">{elevatorTitle}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {status === 'Active' ? 'عقد ساري' : status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>الموقع: {location}</span>
                      <span>عدد الوقفات: {spec.stops} وقفات</span>
                      <span>الحمولة: {spec.capacityKg} كجم</span>
                      <span className="font-mono text-blue-600 font-bold">نظام التعليق: {roping}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setBreakdownElevator(elevatorTitle);
                      setSiteLocation(location);
                      setShowReportModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>إبلاغ عن عطل</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDrawings}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>مخطط التعليق</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. BREAKDOWN TICKETS STATUS & HISTORY                                */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Breakdowns */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-black text-slate-900">
                بلاغات الأعطال قيد المتابعة ({activeBreakdowns.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> بلاغ جديد
            </button>
          </div>

          <div className="p-5">
            {activeBreakdowns.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">لا توجد بلاغات أعطال نشطة حالياً</p>
                <p className="text-slate-400 mt-1">جميع مصاعدك تعمل بكفاءة وأمان كامل</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBreakdowns.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">{b.elevatorName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                        {b.status === 'Reported' ? 'تم الاستلام' : b.status === 'In_Progress' ? 'قيد الفحص والإصلاح' : b.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{b.description}</p>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-amber-200/60">
                      <span>وقت البلاغ: {new Date(b.reportedAt).toLocaleDateString('ar-SA')}</span>
                      {b.assignedTechnicianName && (
                        <span className="text-blue-700 font-bold">الفني المعين: {b.assignedTechnicianName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Maintenance Visits Workspace */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  {isAr ? 'جدول زيارات الصيانة الوقائية والتقارير المعتمدة' : 'Maintenance Visits & Inspection Reports'}
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  {filteredClientVisits.length} {isAr ? 'زيارة مسجلة' : 'visits recorded'}
                </span>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute inset-y-0 start-2.5 my-auto" />
              <input
                type="text"
                placeholder={isAr ? 'ابحث بالمصعد، الفني، أو التاريخ...' : 'Search elevator, tech, date...'}
                value={clientVisitSearch}
                onChange={(e) => setClientVisitSearch(e.target.value)}
                className="w-full text-xs ps-8 pe-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/30 overflow-x-auto">
            <button
              type="button"
              onClick={() => setClientVisitFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                clientVisitFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isAr ? 'كافة الزيارات' : 'All'} ({clientVisits.length})
            </button>
            <button
              type="button"
              onClick={() => setClientVisitFilter('UPCOMING')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                clientVisitFilter === 'UPCOMING'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{isAr ? 'القادمة والمجدولة' : 'Upcoming'}</span>
              <span>({clientVisits.filter(v => v.visit.status !== 'Completed').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setClientVisitFilter('COMPLETED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                clientVisitFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{isAr ? 'المنجزة والموثقة' : 'Completed'}</span>
              <span>({clientVisits.filter(v => v.visit.status === 'Completed').length})</span>
            </button>
          </div>

          <div className="p-5">
            {filteredClientVisits.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">{isAr ? 'لا توجد زيارات صيانة تطابق المعايير' : 'No visits match criteria'}</p>
                <p className="text-slate-400 mt-1">{isAr ? 'اختر تبويب "كافة الزيارات" لعرض كل المواعيد' : 'Select "All" to view all visits'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClientVisits.map((item, idx) => {
                  const statusCfg = VISIT_STATUS_CONFIG[item.visit.status] || VISIT_STATUS_CONFIG['Scheduled'];
                  const isDone = item.visit.status === 'Completed';
                  const review = item.visit.review;

                  return (
                    <div 
                      key={item.visit.id || idx} 
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                        isDone ? 'bg-emerald-50/20 border-emerald-200/80' : 'bg-slate-50/60 border-slate-200/80'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs text-slate-900">{item.contract.elevatorName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.badgeClass}`}>
                            {isAr ? statusCfg.labelAr : statusCfg.labelEn}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {item.visit.scheduledDate}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                          <span>{item.visit.monthLabel}</span>
                          {item.visit.technician && (
                            <span className="text-blue-700 font-bold flex items-center gap-1">
                              <Wrench className="w-3 h-3" />
                              <span>{isAr ? 'الفني المسند:' : 'Tech:'} {item.visit.technician}</span>
                            </span>
                          )}
                          {item.visit.technicianPhone && (
                            <a href={`tel:${item.visit.technicianPhone}`} className="text-emerald-700 font-bold hover:underline font-mono flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{item.visit.technicianPhone}</span>
                            </a>
                          )}
                        </div>

                        {/* Review report notes if completed */}
                        {isDone && review && (
                          <div className="text-[11px] text-emerald-800 bg-white p-2 rounded-lg border border-emerald-200 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="font-bold flex items-center gap-1">
                              <CheckCheck className="w-3 h-3 text-emerald-600" />
                              {isAr ? 'تقرير معتمد:' : 'Certified:'}
                            </span>
                            <span>
                              {isAr ? 'حالة المصعد' : 'Condition'}: <strong>{review.elevatorCondition || 'ممتازة'}</strong>
                            </span>
                            {review.notes && (
                              <span className="text-slate-600 truncate max-w-xs">&bull; {review.notes}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                        {isDone && (
                          <button
                            type="button"
                            onClick={() => setViewingReviewVisit(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تقرير الفحص' : 'Inspection'}</span>
                          </button>
                        )}

                        {/* Contact on WhatsApp */}
                        <button
                          type="button"
                          onClick={() => {
                            const phone = item.visit.technicianPhone || companySettings.phone || '966501234567';
                            const msg = `السلام عليكم، بخصوص زيارة الصيانة لمصعدنا (${item.contract.elevatorName}) المجدولة بتاريخ ${item.visit.scheduledDate}.`;
                            setWaPhone(phone);
                            setWaMessage(msg);
                            setWaRecipient(item.visit.technician || (isAr ? 'خدمة عملاء توينز' : 'Customer Support'));
                            setWaModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition-colors flex items-center gap-1"
                          title={isAr ? 'تواصل عبر واتساب' : 'WhatsApp'}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAr ? 'واتساب' : 'WA'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. REPORT BREAKDOWN MODAL                                             */}
      {/* ===================================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 fill-white" />
                <h3 className="font-black text-base">تسجيل بلاغ عطل طارئ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">
                  تم تسجيل البلاغ بنجاح!
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  تم إرسال إشعار فوري لفريق الطوارئ الميداني وتم تخصيص فني الصيانة للتوجه إلى الموقع.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المصعد المعني بالعطل:
                  </label>
                  <input
                    type="text"
                    value={breakdownElevator}
                    onChange={(e) => setBreakdownElevator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    موقع المبنى / العنوان:
                  </label>
                  <input
                    type="text"
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    درجة الخطورة والاستعجال:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'Emergency', label: 'طارئ جداً (احتجاز / توقف)', color: 'border-red-500 text-red-700 bg-red-50' },
                      { key: 'High', label: 'عالي (صوت / اهتزاز)', color: 'border-amber-500 text-amber-700 bg-amber-50' },
                      { key: 'Medium', label: 'عادي (ملاحظة)', color: 'border-slate-300 text-slate-700 bg-slate-50' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setBreakdownPriority(p.key as any)}
                        className={`p-2 rounded-xl text-center border text-[11px] font-bold transition-all ${
                          breakdownPriority === p.key ? `${p.color} ring-2 ring-red-400 font-black` : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وصف المشكلة بالتفصيل:
                  </label>
                  <textarea
                    rows={3}
                    value={breakdownDescription}
                    onChange={(e) => setBreakdownDescription(e.target.value)}
                    placeholder="مثال: المصعد متوقف في الدور الثاني والباب لا يفتح، أو يوجد صوت غير معتاد أثناء النزول..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-red-500 outline-hidden"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 fill-white" />
                    <span>إرسال البلاغ فوراً</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Review Report Modal for Customer Preview */}
      {viewingReviewVisit && (
        <MaintenanceVisitReviewModal
          visit={viewingReviewVisit.visit}
          contract={viewingReviewVisit.contract}
          companySettings={companySettings}
          language={isAr ? 'ar' : 'en'}
          isOpen={Boolean(viewingReviewVisit)}
          onClose={() => setViewingReviewVisit(null)}
          onSaveReview={() => {}}
        />
      )}

      {/* WhatsApp Modal for Customer Contact */}
      <SendWhatsAppModal
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        defaultPhone={waPhone}
        defaultMessage={waMessage}
        recipientName={waRecipient}
        contextTitle={isAr ? `تواصل مع: ${waRecipient}` : `Contact WhatsApp`}
        isAr={isAr}
      />
    </div>
  );
};
