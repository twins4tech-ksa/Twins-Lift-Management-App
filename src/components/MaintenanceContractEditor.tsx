import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Wrench,
  CheckCircle2,
  FileCheck2,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Printer,
  RotateCcw,
  Sparkles,
  DollarSign,
  AlertCircle,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { generateElevatorNumber } from '../utils/elevatorCode';
import {
  MaintenanceContract,
  MaintenanceVisit,
  MaintenanceVisitStatus,
  MaintenanceVisitReview,
  CONTRACT_TYPE_CONFIG,
  CONTRACT_STATUS_CONFIG,
  VISIT_STATUS_CONFIG,
  MaintenanceContractType,
  MaintenanceContractStatus
} from '../types/maintenance';
import { Customer, ElevatorSpecification } from '../types/elevator';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import MaintenanceVisitReviewModal from './MaintenanceVisitReviewModal';
import { Employee } from '../types/employee';
import { SearchableSelect } from './SearchableSelect';

interface MaintenanceContractEditorProps {
  contract: MaintenanceContract;
  customers: Customer[];
  projects: ElevatorSpecification[];
  employees?: Employee[];
  companySettings: CompanySettings;
  language: AppLanguage;
  onSave: (contract: MaintenanceContract) => void;
  onCancel: () => void;
}

export default function MaintenanceContractEditor({
  contract: initialContract,
  customers,
  projects,
  employees = [],
  companySettings,
  language,
  onSave,
  onCancel,
}: MaintenanceContractEditorProps) {
  const isAr = language === 'ar';

  const [contract, setContract] = useState<MaintenanceContract>(initialContract);
  const [selectedVisitForReview, setSelectedVisitForReview] = useState<MaintenanceVisit | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [visitDayOfMonth, setVisitDayOfMonth] = useState<number>(10);
  const [defaultTech, setDefaultTech] = useState<string>('م. أحمد السعيد (فريق الصيانة)');
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Helper to format date YYYY-MM-DD
  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Month names for period labels
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Quick preset: Set 1 year range from today or start date
  const handleSetYearPreset = (yearsCount: number) => {
    const start = contract.startDate ? new Date(contract.startDate) : new Date();
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + yearsCount);
    end.setDate(end.getDate() - 1); // 1 day before anniversary
    setContract(prev => ({
      ...prev,
      startDate: formatDateStr(start),
      endDate: formatDateStr(end),
    }));
    notify(isAr ? `تم تحديد نطاق الفترة لمدة ${yearsCount} سنة` : `Set duration to ${yearsCount} year(s)`);
  };

  // BUTTON 1: Generate monthly schedule between Start Date and End Date
  const handleGenerateMonthlySchedule = () => {
    if (!contract.startDate || !contract.endDate) {
      alert(isAr ? 'يرجى تحديد تاريخ بداية ونهاية جدول الصيانة أولاً' : 'Please select start and end dates first');
      return;
    }

    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);

    if (end < start) {
      alert(isAr ? 'تاريخ نهاية الجدول يجب أن يكون بعد تاريخ البداية' : 'End date must be after start date');
      return;
    }

    const generatedVisits: MaintenanceVisit[] = [];
    let current = new Date(start);
    let visitNum = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const defaultTech = contract.assignedTechnicianName || initialContract.assignedTechnicianName || (isAr ? 'فني الصيانة المعتمد' : 'Certified Technician');
    const defaultTechId = contract.assignedTechnicianId || initialContract.assignedTechnicianId;

    while (current <= end) {
      // Calculate target date using the specified visit day of month
      const targetYear = current.getFullYear();
      const targetMonth = current.getMonth();
      
      // Handle days like 30/31 in months with fewer days
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const safeDay = Math.min(visitDayOfMonth, daysInMonth);
      const visitDate = new Date(targetYear, targetMonth, safeDay);

      const mName = isAr ? monthNamesAr[targetMonth] : monthNamesEn[targetMonth];
      const monthLabel = isAr 
        ? `الشهر ${visitNum} - ${mName} ${targetYear}`
        : `Month ${visitNum} - ${mName} ${targetYear}`;

      const dateStr = formatDateStr(visitDate);
      const isPast = visitDate < today;

      generatedVisits.push({
        id: `v-${Date.now()}-${visitNum}`,
        visitNumber: visitNum,
        monthLabel,
        scheduledDate: dateStr,
        status: isPast ? 'Completed' : 'Scheduled',
        technician: defaultTech,
        assignedTechnicianId: defaultTechId,
      });

      visitNum++;
      // Advance to next month
      current.setMonth(current.getMonth() + 1);
    }

    setContract(prev => ({
      ...prev,
      visits: generatedVisits,
      annualVisitsCount: generatedVisits.length,
    }));

    notify(
      isAr 
        ? `تم توليد وإدراج ${generatedVisits.length} زيارة صيانة شهرية بنجاح!` 
        : `Generated ${generatedVisits.length} monthly maintenance visits!`
    );
  };

  // BUTTON 2: Insert Next Monthly Visit down into the list
  const handleInsertNextMonthlyVisit = () => {
    const existingVisits = contract.visits || [];
    const nextVisitNum = existingVisits.length + 1;

    let nextDate: Date;
    if (existingVisits.length > 0) {
      const lastVisit = existingVisits[existingVisits.length - 1];
      const lastDate = new Date(lastVisit.scheduledDate);
      nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (contract.startDate) {
      nextDate = new Date(contract.startDate);
      const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      nextDate.setDate(Math.min(visitDayOfMonth, daysInMonth));
    } else {
      nextDate = new Date();
    }

    const targetYear = nextDate.getFullYear();
    const targetMonth = nextDate.getMonth();
    const mName = isAr ? monthNamesAr[targetMonth] : monthNamesEn[targetMonth];
    const monthLabel = isAr 
      ? `الشهر ${nextVisitNum} - ${mName} ${targetYear}`
      : `Month ${nextVisitNum} - ${mName} ${targetYear}`;

    const defaultTech = contract.assignedTechnicianName || initialContract.assignedTechnicianName || (isAr ? 'فني الصيانة المعتمد' : 'Certified Technician');
    const defaultTechId = contract.assignedTechnicianId || initialContract.assignedTechnicianId;

    const newVisit: MaintenanceVisit = {
      id: `v-${Date.now()}-${nextVisitNum}`,
      visitNumber: nextVisitNum,
      monthLabel,
      scheduledDate: formatDateStr(nextDate),
      status: 'Scheduled',
      technician: defaultTech,
      assignedTechnicianId: defaultTechId,
    };

    setContract(prev => ({
      ...prev,
      visits: [...prev.visits, newVisit],
      annualVisitsCount: prev.visits.length + 1,
    }));

    notify(
      isAr 
        ? `تم إدراج الزيارة الشهرية رقم #${nextVisitNum} في الأسفل` 
        : `Inserted monthly visit #${nextVisitNum} down in schedule`
    );
  };

  // BUTTON 3: Add Custom / Emergency visit
  const handleAddCustomVisit = () => {
    const existingVisits = contract.visits || [];
    const nextVisitNum = existingVisits.length + 1;
    const todayStr = formatDateStr(new Date());

    const defaultTech = contract.assignedTechnicianName || initialContract.assignedTechnicianName || (isAr ? 'فني الصيانة المعتمد' : 'Certified Technician');
    const defaultTechId = contract.assignedTechnicianId || initialContract.assignedTechnicianId;

    const newVisit: MaintenanceVisit = {
      id: `v-custom-${Date.now()}`,
      visitNumber: nextVisitNum,
      monthLabel: isAr ? `زيارة طوارئ / إضافية #${nextVisitNum}` : `Extra / Emergency Visit #${nextVisitNum}`,
      scheduledDate: todayStr,
      status: 'Scheduled',
      technician: defaultTech,
      assignedTechnicianId: defaultTechId,
    };

    setContract(prev => ({
      ...prev,
      visits: [...prev.visits, newVisit],
      annualVisitsCount: prev.visits.length + 1,
    }));

    notify(isAr ? 'تمت إضافة زيارة إضافية بنجاح' : 'Added extra visit');
  };

  // Delete visit row
  const handleDeleteVisit = (visitId: string) => {
    setContract(prev => {
      const updated = prev.visits.filter(v => v.id !== visitId);
      // Re-index visit numbers
      const reindexed = updated.map((v, i) => ({ ...v, visitNumber: i + 1 }));
      return {
        ...prev,
        visits: reindexed,
        annualVisitsCount: reindexed.length,
      };
    });
  };

  // Update specific visit inline
  const handleUpdateVisit = (visitId: string, field: keyof MaintenanceVisit, value: any) => {
    setContract(prev => ({
      ...prev,
      visits: prev.visits.map(v => v.id === visitId ? { ...v, [field]: value } : v),
    }));
  };

  // Mark all past visits as completed
  const handleMarkPastCompleted = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setContract(prev => ({
      ...prev,
      visits: prev.visits.map(v => {
        const vDate = new Date(v.scheduledDate);
        if (vDate < today && v.status === 'Scheduled') {
          return { ...v, status: 'Completed' };
        }
        return v;
      }),
    }));
    notify(isAr ? 'تم تحديد الزيارات السابقة كمنجزة' : 'Marked past visits as completed');
  };

  // HYPERLINK HANDLER: Open Visit Review Modal
  const handleOpenVisitReview = (visit: MaintenanceVisit) => {
    setSelectedVisitForReview(visit);
    setIsReviewModalOpen(true);
  };

  // Save reviewed visit from modal
  const handleSaveVisitReview = (
    visitId: string,
    updatedReview: MaintenanceVisitReview,
    newStatus: MaintenanceVisitStatus
  ) => {
    setContract(prev => ({
      ...prev,
      visits: prev.visits.map(v => {
        if (v.id === visitId) {
          return {
            ...v,
            status: newStatus,
            review: updatedReview,
            technician: updatedReview.technicianName || v.technician,
          };
        }
        return v;
      }),
    }));
  };

  // Link with existing customer
  const handleSelectCustomer = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      setContract(prev => ({
        ...prev,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone || prev.customerPhone,
        customerEmail: cust.email || prev.customerEmail,
        customerCompany: cust.company || prev.customerCompany,
        siteLocation: cust.location || prev.siteLocation,
      }));
    }
  };

  // Link with existing elevator project
  const handleSelectProject = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setContract(prev => ({
        ...prev,
        elevatorProjectId: proj.id,
        elevatorName: `${proj.projectName} - ${proj.elevatorType}`,
        elevatorNumber: prev.elevatorNumber || generateElevatorNumber('MAINTENANCE', prev.startDate || prev.createdAt),
        elevatorStops: proj.stops || 4,
        elevatorCapacityKg: proj.capacityKg || 630,
        siteLocation: proj.siteLocation || prev.siteLocation,
      }));
    }
  };

  const completedVisits = contract.visits.filter(v => v.status === 'Completed').length;
  const scheduledVisits = contract.visits.filter(v => v.status === 'Scheduled').length;
  const pricePerVisit = contract.visits.length > 0 ? (contract.totalPrice / contract.visits.length).toFixed(0) : '0';

  return (
    <div className="space-y-6 pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed top-20 right-1/2 translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {showNotification}
        </div>
      )}

      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title={isAr ? 'العودة' : 'Back'}
          >
            {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                {contract.isContract
                  ? (isAr ? 'جدول وإدارة عقد الصيانة' : 'Maintenance Contract & Schedule')
                  : (isAr ? 'عرض سعر صيانة وجدولة الزيارات' : 'Maintenance Quotation & Schedule')}
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${CONTRACT_STATUS_CONFIG[contract.status]?.bgClass}`}>
                {isAr ? CONTRACT_STATUS_CONFIG[contract.status]?.labelAr : CONTRACT_STATUS_CONFIG[contract.status]?.labelEn}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {contract.contractRef} • {contract.title || (isAr ? 'مشروع جديد' : 'New Project')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Quotation vs Contract */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
            <button
              type="button"
              onClick={() => setContract(prev => ({ ...prev, isContract: false }))}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                !contract.isContract
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'عرض سعر صيانة' : 'Quotation'}
            </button>
            <button
              type="button"
              onClick={() => setContract(prev => ({ ...prev, isContract: true }))}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                contract.isContract
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'عقد صيانة ساري' : 'Active Contract'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPrintMode(!isPrintMode)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            {isAr ? (isPrintMode ? 'العودة للتحرير' : 'معاينة العقد') : (isPrintMode ? 'Edit Mode' : 'Print View')}
          </button>

          <button
            type="button"
            onClick={() => onSave(contract)}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isAr ? 'حفظ التعديلات' : 'Save Contract'}
          </button>
        </div>
      </div>

      {!isPrintMode ? (
        <>
          {/* Section 1: Client & Elevator Specs Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer & Location Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  {isAr ? 'بيانات العميل والموقع' : 'Customer & Site Location'}
                </h3>
                {customers.length > 0 && (
                  <div className="min-w-[200px]">
                    <SearchableSelect
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="text-xs p-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700"
                      value=""
                      placeholder={isAr ? 'ربط مع عميل مسجل...' : 'Link to existing customer...'}
                    >
                      <option value="" disabled>{isAr ? 'ربط مع عميل مسجل...' : 'Link to existing customer...'}</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                      ))}
                    </SearchableSelect>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'اسم العميل / المالك' : 'Client Name'}</label>
                  <input
                    type="text"
                    value={contract.customerName}
                    onChange={(e) => setContract(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="شركة الأندلس العقارية"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'الشركة أو المنشأة' : 'Company'}</label>
                  <input
                    type="text"
                    value={contract.customerCompany || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, customerCompany: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="مجموعة الأندلس"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'رقم جوال العميل' : 'Phone'}</label>
                  <input
                    type="text"
                    value={contract.customerPhone || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="+966 50 000 0000"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    value={contract.customerEmail || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="info@client.sa"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'عنوان الموقع ومكان المصعد' : 'Site Location & Building'}</label>
                  <input
                    type="text"
                    value={contract.siteLocation}
                    onChange={(e) => setContract(prev => ({ ...prev, siteLocation: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="الرياض - طريق الملك فهد - مبنى الأندلس"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700 block">
                      {isAr ? 'الإحداثيات الجغرافية (لإثبات حضور الفنيين)' : 'GPS Coordinates (For Tech Attendance)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setContract(prev => ({
                                ...prev,
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                              }));
                            },
                            (error) => {
                              alert(isAr ? 'عذراً، لم نتمكن من الوصول للموقع. يرجى تفعيل الـ GPS' : 'Could not get location. Please enable GPS.');
                            }
                          );
                        } else {
                          alert(isAr ? 'المتصفح لا يدعم تحديد الموقع الجغرافي' : 'Geolocation is not supported by your browser');
                        }
                      }}
                      className="text-[10px] sm:text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                      {isAr ? 'التقاط الموقع الحالي' : 'Get Current Location'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        step="any"
                        placeholder={isAr ? 'خط العرض (Latitude)' : 'Latitude'}
                        value={contract.latitude || ''}
                        onChange={(e) => setContract(prev => ({ ...prev, latitude: parseFloat(e.target.value) || undefined }))}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="any"
                        placeholder={isAr ? 'خط الطول (Longitude)' : 'Longitude'}
                        value={contract.longitude || ''}
                        onChange={(e) => setContract(prev => ({ ...prev, longitude: parseFloat(e.target.value) || undefined }))}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isAr ? 'يتم استخدام هذه الإحداثيات لمقارنة موقع الفني والسماح بتسجيل الحضور ضمن النطاق المعتمد (Geofence).' : 'Used for automatic geofencing to verify technicians site attendance.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Elevator Details & Commercial Terms */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#b6be49]" />
                  {isAr ? 'مواصفات المصعد والشروط المالية' : 'Elevator & Commercial Terms'}
                </h3>
                {projects.length > 0 && (
                  <div className="min-w-[200px]">
                    <SearchableSelect
                      onChange={(e) => handleSelectProject(e.target.value)}
                      className="text-xs p-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700"
                      value=""
                      placeholder={isAr ? 'ربط مع مصعد مسجل...' : 'Link to elevator project...'}
                    >
                      <option value="" disabled>{isAr ? 'ربط مع مصعد مسجل...' : 'Link to elevator project...'}</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.projectName} ({p.stops} {isAr ? 'توقفات' : 'stops'})</option>
                      ))}
                    </SearchableSelect>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'تسمية المصعد وموديله' : 'Elevator Identifier & Type'}</label>
                  <input
                    type="text"
                    value={contract.elevatorName}
                    onChange={(e) => setContract(prev => ({ ...prev, elevatorName: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="مصعد الركاب الرئيسي - MRL 8 ركاب"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700 block">
                      {isAr ? 'رقم كود المصعد (عقد صيانة جديد)' : 'Elevator Unit Code (Maintenance)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newCode = generateElevatorNumber('MAINTENANCE', contract.startDate || contract.createdAt || new Date());
                        setContract(prev => ({ ...prev, elevatorNumber: newCode }));
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      title={isAr ? 'توليد كود تلقائي بناءً على سنة وشهر الإصدار' : 'Auto-generate based on Year & Month'}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isAr ? 'توليد تلقائي' : 'Auto Generate'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={contract.elevatorNumber || ''}
                    onChange={(e) => setContract(prev => ({ ...prev, elevatorNumber: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/20 text-blue-900 font-bold font-mono focus:ring-2 focus:ring-blue-500"
                    placeholder={isAr ? "مثال: MNT-202609-001" : "e.g. MNT-202609-001"}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isAr 
                      ? 'ترميز خاص بعقود الصيانة بنمط MNT-السنةوالشهر-التسلسل (يعتمد على شهر وسنة الإصدار)' 
                      : 'Maintenance code pattern: MNT-YYYYMM-XXX based on issuance month and year.'}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'نوع باقة الصيانة' : 'Maintenance Package'}</label>
                  <SearchableSelect
                    value={contract.contractType}
                    onChange={(e) => setContract(prev => ({ ...prev, contractType: e.target.value as MaintenanceContractType }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="PREVENTIVE_STANDARD">{isAr ? 'وقائية دورية معتادة' : 'Standard Preventive'}</option>
                    <option value="COMPREHENSIVE_PARTS">{isAr ? 'شاملة قطع الغيار' : 'Comprehensive with Parts'}</option>
                    <option value="SEMI_COMPREHENSIVE">{isAr ? 'نصف شاملة' : 'Semi-Comprehensive'}</option>
                    <option value="EMERGENCY_24_7">{isAr ? 'خدمة طوارئ VIP 24/7' : '24/7 Emergency'}</option>
                  </SearchableSelect>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'إجمالي قيمة العقد (ريال)' : 'Total Price (SAR)'}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={contract.totalPrice}
                      onChange={(e) => setContract(prev => ({ ...prev, totalPrice: Number(e.target.value) || 0 }))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                    <div className="absolute inset-y-0 end-0 pe-3 flex items-center pointer-events-none text-slate-500">
                      <SaudiRiyalSymbol className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'طريقة دفع الأقساط' : 'Payment Schedule'}</label>
                  <SearchableSelect
                    value={contract.paymentFrequency}
                    onChange={(e) => setContract(prev => ({ ...prev, paymentFrequency: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Annual">{isAr ? 'دفعة سنوية واحدة' : 'Annual'}</option>
                    <option value="Biannual">{isAr ? 'نصف سنوي (دفعتان)' : 'Biannual (2 payments)'}</option>
                    <option value="Quarterly">{isAr ? 'ربع سنوي (4 دفعات)' : 'Quarterly (4 payments)'}</option>
                    <option value="Monthly">{isAr ? 'شهري (12 قسط)' : 'Monthly'}</option>
                  </SearchableSelect>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">{isAr ? 'حالة التعاقد' : 'Contract Status'}</label>
                  <SearchableSelect
                    value={contract.status}
                    onChange={(e) => setContract(prev => ({ ...prev, status: e.target.value as MaintenanceContractStatus }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="Active">{isAr ? 'عقد ساري وموقع' : 'Active Contract'}</option>
                    <option value="Approved">{isAr ? 'معتمد ومقبول' : 'Approved'}</option>
                    <option value="Sent">{isAr ? 'مرسل للعميل' : 'Sent'}</option>
                    <option value="Draft">{isAr ? 'مسودة' : 'Draft'}</option>
                    <option value="Completed">{isAr ? 'منتهي' : 'Completed'}</option>
                    <option value="Cancelled">{isAr ? 'ملغى' : 'Cancelled'}</option>
                  </SearchableSelect>
                </div>

                {/* Lead Technician */}
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    {isAr ? 'الفني الرئيسي المسؤول (Lead Technician)' : 'Assigned Lead Technician'}
                  </label>
                  <SearchableSelect
                    value={contract.assignedTechnicianId || ''}
                    onChange={(e) => {
                      const emp = employees.find(x => x.id === e.target.value);
                      setContract(prev => ({
                        ...prev,
                        assignedTechnicianId: emp?.id,
                        assignedTechnicianName: emp?.name,
                        assignedTechnicianPhone: emp?.phone,
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">{isAr ? '-- اختر فني الصيانة المسؤول --' : '-- Select Lead Tech --'}</option>
                    {employees
                      .filter(e => e.role === 'MAINTENANCE_TECH' || e.role === 'MAINTENANCE_MGR' || e.role === 'INSTALLATION_ENG')
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.code}) {emp.phone ? `- ${emp.phone}` : ''}
                        </option>
                      ))}
                  </SearchableSelect>
                </div>

                {/* Sales Representative */}
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    {isAr ? 'مندوب المبيعات المبرم للعقد (Sales Rep)' : 'Contract Sales Representative'}
                  </label>
                  <SearchableSelect
                    value={contract.assignedSalesRepId || ''}
                    onChange={(e) => {
                      const emp = employees.find(x => x.id === e.target.value);
                      setContract(prev => ({
                        ...prev,
                        assignedSalesRepId: emp?.id,
                        assignedSalesRepName: emp?.name,
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">{isAr ? '-- اختر مندوب المبيعات --' : '-- Select Sales Rep --'}</option>
                    {employees
                      .filter(e => e.role === 'SALES_REP' || e.role === 'PROJECT_MANAGER')
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.code})
                        </option>
                      ))}
                  </SearchableSelect>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: THE REQUESTED MAINTENANCE SCHEDULE CONTROLS & BUTTONS */}
          <div className="bg-white p-6 rounded-2xl border-2 border-blue-200/80 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {isAr ? 'جدول وتواريخ زيارات الصيانة الشهرية' : 'Maintenance Schedule Dates & Visits'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isAr 
                        ? 'حدد تاريخ البداية والنهاية واستخدم الأزرار لإدراج وتوليد مواعيد الزيارات الشهرية وحالاتها'
                        : 'Specify schedule start & end date and insert monthly visit dates with operational status'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule Summary Stats */}
              <div className="flex items-center gap-3 text-xs">
                <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-center">
                  <span className="text-slate-500 block text-[11px]">{isAr ? 'إجمالي الزيارات' : 'Total Visits'}</span>
                  <span className="font-bold text-sm text-slate-900">{contract.visits.length}</span>
                </div>
                <div className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-center">
                  <span className="text-emerald-700 block text-[11px]">{isAr ? 'المنجزة' : 'Completed'}</span>
                  <span className="font-bold text-sm text-emerald-800">{completedVisits}</span>
                </div>
                <div className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 text-center">
                  <span className="text-blue-700 block text-[11px]">{isAr ? 'القادمة' : 'Scheduled'}</span>
                  <span className="font-bold text-sm text-blue-800">{scheduledVisits}</span>
                </div>
                <div className="bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 text-center">
                  <span className="text-amber-700 block text-[11px]">{isAr ? 'تكلفة الزيارة' : 'Cost/Visit'}</span>
                  <span className="font-bold text-sm text-amber-800">{pricePerVisit} ر.س</span>
                </div>
              </div>
            </div>

            {/* Date Range Inputs: Start Date & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
              {/* Start Date of Maintenance Schedule */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {isAr ? 'تاريخ بداية جدول الصيانة (Start Date)' : 'Schedule Start Date'}
                </label>
                <input
                  type="date"
                  value={contract.startDate}
                  onChange={(e) => setContract(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* End Date of Maintenance Schedule */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {isAr ? 'تاريخ نهاية جدول الصيانة (End Date)' : 'Schedule End Date'}
                </label>
                <input
                  type="date"
                  value={contract.endDate}
                  onChange={(e) => setContract(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Day of Month for visits */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  {isAr ? 'يوم الزيارة المفضل من كل شهر' : 'Preferred Day of Month'}
                </label>
                <SearchableSelect
                  value={visitDayOfMonth}
                  onChange={(e) => setVisitDayOfMonth(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>{isAr ? 'يوم 1 من الشهر' : '1st of month'}</option>
                  <option value={5}>{isAr ? 'يوم 5 من الشهر' : '5th of month'}</option>
                  <option value={10}>{isAr ? 'يوم 10 من الشهر (افتراضي)' : '10th of month (Default)'}</option>
                  <option value={15}>{isAr ? 'يوم 15 من الشهر' : '15th of month'}</option>
                  <option value={20}>{isAr ? 'يوم 20 من الشهر' : '20th of month'}</option>
                  <option value={25}>{isAr ? 'يوم 25 من الشهر' : '25th of month'}</option>
                </SearchableSelect>
              </div>

              {/* Default Technician */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  {isAr ? 'الفني الافتراضي للزيارات' : 'Default Technician'}
                </label>
                <input
                  type="text"
                  value={defaultTech}
                  onChange={(e) => setDefaultTech(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  placeholder="م. أحمد السعيد"
                />
              </div>

              {/* Quick Presets row */}
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">
                  {isAr ? 'تحديد مدة سريعة:' : 'Quick Presets:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleSetYearPreset(1)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-medium transition-colors"
                >
                  {isAr ? 'عقد سنة كاملة (12 شهر)' : '1 Year (12 Months)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetYearPreset(2)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-medium transition-colors"
                >
                  {isAr ? 'عقد سنتين (24 شهر)' : '2 Years (24 Months)'}
                </button>
                <button
                  type="button"
                  onClick={handleMarkPastCompleted}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg font-medium transition-colors ms-auto"
                >
                  {isAr ? 'تحديد الزيارات المنتهية كمنجزة' : 'Mark Past Visits Completed'}
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS: Insert Down Monthly Date & Visits */}
            <div className="flex flex-wrap items-center gap-3">
              {/* BUTTON 1: Auto-generate full monthly schedule */}
              <button
                type="button"
                id="btn-generate-monthly-schedule"
                onClick={handleGenerateMonthlySchedule}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 hover:shadow-md"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isAr 
                  ? 'توليد وجدولة الزيارات الشهرية تلقائياً (Generate Schedule)' 
                  : 'Auto-Generate Monthly Schedule'}
              </button>

              {/* BUTTON 2: Insert Next Monthly Visit down into table */}
              <button
                type="button"
                id="btn-insert-monthly-visit-down"
                onClick={handleInsertNextMonthlyVisit}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                {isAr 
                  ? '+ إدراج زيارة شهرية تالية بالأسفل (Insert Monthly Visit Down)' 
                  : '+ Insert Next Monthly Visit Down'}
              </button>

              {/* BUTTON 3: Add Emergency / Extra Visit */}
              <button
                type="button"
                onClick={handleAddCustomVisit}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                {isAr ? '+ إضافة زيارة طوارئ إضافية' : '+ Add Emergency / Extra Visit'}
              </button>

              {/* BUTTON 4: Reset / Clear schedule */}
              {contract.visits.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(isAr ? 'هل أنت متأكد من رغبتك في حذف وتفريغ جدول الزيارات بالكامل؟' : 'Clear all scheduled visits?')) {
                      setContract(prev => ({ ...prev, visits: [], annualVisitsCount: 0 }));
                    }
                  }}
                  className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ms-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isAr ? 'تصفير الجدول' : 'Reset Table'}
                </button>
              )}
            </div>

            {/* THE MONTHLY VISITS SCHEDULE TABLE WITH HYPERLINKS TO REVIEW */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right rtl:text-right ltr:text-left divide-y divide-slate-200">
                  <thead className="bg-slate-900 text-white font-semibold">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-3">{isAr ? 'تاريخ الزيارة الشهري المحدد' : 'Monthly Scheduled Date'}</th>
                      <th className="py-3 px-3">{isAr ? 'الشهر / الفترة' : 'Month / Period'}</th>
                      <th className="py-3 px-3">{isAr ? 'الفني المسند له' : 'Assigned Technician'}</th>
                      <th className="py-3 px-3">{isAr ? 'حالة الزيارة' : 'Visit Status'}</th>
                      <th className="py-3 px-4 text-center">
                        <span className="flex items-center justify-center gap-1.5 text-[#b6be49]">
                          <FileCheck2 className="w-4 h-4" />
                          {isAr ? 'رابط مراجعة تقرير الزيارة (Review Hyperlink)' : 'Visit Review Hyperlink'}
                        </span>
                      </th>
                      <th className="py-3 px-3 text-center w-14">{isAr ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {contract.visits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-sm text-slate-600">
                            {isAr ? 'لا توجد زيارات صيانة مجدولة بعد' : 'No maintenance visits scheduled yet'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            {isAr 
                              ? 'انقر على زر «توليد وجدولة الزيارات الشهرية تلقائياً» أو «+ إدراج زيارة شهرية تالية» بالأعلى لإدراج التواريخ والأرقام والحالات.'
                              : 'Click "Auto-Generate Monthly Schedule" or "+ Insert Next Monthly Visit Down" to insert monthly dates.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      contract.visits.map((visit) => {
                        const statusConf = VISIT_STATUS_CONFIG[visit.status] || VISIT_STATUS_CONFIG.Scheduled;
                        const hasCertifiedReview = visit.review && visit.status === 'Completed';

                        return (
                          <tr key={visit.id} className="hover:bg-blue-50/40 transition-colors">
                            {/* Visit Number */}
                            <td className="py-2.5 px-3 text-center">
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold font-mono text-xs flex items-center justify-center mx-auto border border-slate-200">
                                {visit.visitNumber}
                              </span>
                            </td>

                            {/* Scheduled Monthly Date (Editable input) */}
                            <td className="py-2.5 px-3">
                              <input
                                type="date"
                                value={visit.scheduledDate}
                                onChange={(e) => handleUpdateVisit(visit.id, 'scheduledDate', e.target.value)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-blue-500"
                              />
                            </td>

                            {/* Month / Period Label */}
                            <td className="py-2.5 px-3 font-medium text-slate-700">
                              <span className="bg-slate-100 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-800">
                                {visit.monthLabel}
                              </span>
                            </td>

                            {/* Assigned Technician */}
                            <td className="py-2.5 px-3">
                              <input
                                list={`techs-list-${visit.id}`}
                                type="text"
                                value={visit.technician}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const matchedEmp = employees.find(emp => emp.name.toLowerCase() === val.toLowerCase());
                                  setContract(prev => ({
                                    ...prev,
                                    visits: prev.visits.map(v => v.id === visit.id ? {
                                      ...v,
                                      technician: val,
                                      assignedTechnicianId: matchedEmp ? matchedEmp.id : v.assignedTechnicianId,
                                    } : v),
                                  }));
                                }}
                                className="w-full min-w-[140px] p-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                                placeholder={isAr ? 'اسم الفني أو اختر من القائمة' : 'Technician name'}
                              />
                              <datalist id={`techs-list-${visit.id}`}>
                                {employees
                                  .filter(e => e.role === 'MAINTENANCE_TECH' || e.role === 'MAINTENANCE_MGR' || e.role === 'INSTALLATION_ENG')
                                  .map(emp => (
                                    <option key={emp.id} value={emp.name}>
                                      {emp.code} - {emp.phone || ''}
                                    </option>
                                  ))}
                              </datalist>
                            </td>

                            {/* Visit Status Selector */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${statusConf.dotClass} shrink-0`} />
                                <SearchableSelect
                                  value={visit.status}
                                  onChange={(e) => handleUpdateVisit(visit.id, 'status', e.target.value as MaintenanceVisitStatus)}
                                  className={`text-xs font-bold py-1 px-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${statusConf.badgeClass}`}
                                >
                                  <option value="Scheduled">{isAr ? 'مجدولة قادمة' : 'Scheduled'}</option>
                                  <option value="Completed">{isAr ? 'منجزة وموثقة' : 'Completed'}</option>
                                  <option value="In_Progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                                  <option value="Pending">{isAr ? 'معلقة / مؤجلة' : 'Pending'}</option>
                                  <option value="Missed">{isAr ? 'فائتة / غير منجزة' : 'Missed'}</option>
                                </SearchableSelect>
                              </div>
                            </td>

                            {/* HYPERLINK WITH MAINTENANCE VISIT REVIEW */}
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                id={`link-review-visit-${visit.visitNumber}`}
                                onClick={() => handleOpenVisitReview(visit)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs group ${
                                  hasCertifiedReview
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-900'
                                }`}
                                title={isAr ? 'فتح ومراجعة محضر الفحص الفني والاعتماد' : 'Open inspection review and sign-off report'}
                              >
                                {hasCertifiedReview ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>{isAr ? 'الفحص موثّق ومعتمد' : 'Review Certified'}</span>
                                  </>
                                ) : (
                                  <>
                                    <FileCheck2 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                                    <span className="underline decoration-blue-300 underline-offset-2">
                                      {isAr ? 'مراجعة تقرير الزيارة' : 'Review Visit'}
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-blue-400 ms-0.5" />
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Delete Visit Action */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteVisit(visit.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title={isAr ? 'حذف الزيارة' : 'Delete Visit'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* PRINTABLE CONTRACT / QUOTATION VIEW */
        <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md space-y-6 text-slate-900 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900">
                  {isAr ? companySettings.companyNameAr : companySettings.companyNameEn}
                </span>
              </div>
              <p className="text-xs text-slate-600">{isAr ? companySettings.addressAr : companySettings.addressEn}</p>
              <p className="text-xs text-slate-600">
                {isAr ? 'س.ت: ' : 'CR: '} {companySettings.commercialRegistration} | {isAr ? 'الرقم الضريبي: ' : 'VAT: '} {companySettings.vatNumber}
              </p>
            </div>

            <div className="text-left rtl:text-right space-y-1">
              <span className="inline-block bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded-md">
                {contract.isContract ? (isAr ? 'عقد صيانة مصاعد رسمي' : 'Official Maintenance Agreement') : (isAr ? 'عرض سعر صيانة دورية' : 'Maintenance Quotation')}
              </span>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1">{contract.contractRef}</p>
              <p className="text-xs text-slate-600">{isAr ? 'تاريخ البداية: ' : 'Start: '} {contract.startDate} - {contract.endDate}</p>
            </div>
          </div>

          {/* Parties & Scope */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block">{isAr ? 'الطرف الأول (المورد / المنفذ):' : 'First Party:'}</span>
                <span className="font-bold text-slate-800">{isAr ? companySettings.companyNameAr : companySettings.companyNameEn}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isAr ? 'الطرف الثاني (العميل / المالك):' : 'Second Party (Client):'}</span>
                <span className="font-bold text-slate-800">{contract.customerName} - {contract.customerCompany}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-500 block">{isAr ? 'موقع المصعد:' : 'Location:'}</span>
                <span className="font-semibold text-slate-800">{contract.siteLocation}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isAr ? 'بيانات المصعد:' : 'Elevator:'}</span>
                <span className="font-semibold text-slate-800">{contract.elevatorName} ({contract.elevatorStops || 6} محطات)</span>
              </div>
            </div>
          </div>

          {/* Schedule Summary in Print */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              {isAr ? `جدول الزيارات الدورية المعتمدة (${contract.visits.length} زيارة)` : `Approved Maintenance Schedule (${contract.visits.length} visits)`}
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-[11px]">
              {contract.visits.map((v) => (
                <div key={v.id} className="p-2 border border-slate-200 rounded-lg bg-white flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">#{v.visitNumber}</span>
                    <span className="block text-slate-500">{v.scheduledDate}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">
                    {v.status === 'Completed' ? '✅' : '⏳'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Value & Signatures */}
          <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">{isAr ? 'إجمالي قيمة العقد السنوي:' : 'Total Contract Value:'}</span>
            <span className="text-base font-black text-slate-900">
              {contract.totalPrice.toLocaleString()} {isAr ? 'ريال سعودي' : 'SAR'}
            </span>
          </div>

          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-10 text-xs">
            <div>
              <span className="font-bold text-slate-800 block mb-8">{isAr ? 'توقيع وختم الطرف الأول' : 'First Party Signature'}</span>
              <div className="border-b border-dashed border-slate-400" />
            </div>
            <div>
              <span className="font-bold text-slate-800 block mb-8">{isAr ? 'توقيع وختم الطرف الثاني (العميل)' : 'Second Party Signature'}</span>
              <div className="border-b border-dashed border-slate-400" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL TARGET FOR HYPERLINK: Maintenance Visit Review */}
      {selectedVisitForReview && (
        <MaintenanceVisitReviewModal
          isOpen={isReviewModalOpen}
          visit={selectedVisitForReview}
          contract={contract}
          companySettings={companySettings}
          language={language}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedVisitForReview(null);
          }}
          onSaveReview={handleSaveVisitReview}
        />
      )}
    </div>
  );
}
