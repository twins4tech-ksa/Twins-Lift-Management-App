import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Printer, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Calendar, 
  Award, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { SafetyCertificate, CertificateStatus, InspectionTestResult, SafetyChecklistResults } from '../types/safety';
import { MaintenanceContract } from '../types/maintenance';
import { ElevatorSpecification, Customer } from '../types/elevator';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';

interface SafetyCertificatesViewProps {
  contracts: MaintenanceContract[];
  projects: ElevatorSpecification[];
  customers: Customer[];
  companySettings: CompanySettings;
  language: AppLanguage;
  onShowToast?: (msg: string) => void;
}

const LOCAL_STORAGE_CERTIFICATES_KEY = 'twins_elevators_safety_certs_v1';

export const SafetyCertificatesView: React.FC<SafetyCertificatesViewProps> = ({
  contracts,
  projects,
  customers,
  companySettings,
  language,
  onShowToast = () => {}
}) => {
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Stored Certificates with realistic initial seed
  const [certificates, setCertificates] = useState<SafetyCertificate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CERTIFICATES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }

    const defaultChecklist: SafetyChecklistResults = {
      overspeedGovernorTest: 'PASS',
      safetyGearDropTest: 'PASS',
      carBufferAndClearance: 'PASS',
      counterweightBufferAndClearance: 'PASS',
      machineBrakeTorqueAndHolding: 'PASS',
      tractionSheaveAndRopesWear: 'PASS',
      machineRoomVentilationAndLighting: 'PASS',
      carDoorInterlockAndLightCurtain: 'PASS',
      landingDoorLocksAndEmergencyRelease: 'PASS',
      pitEmergencyStopSwitch: 'PASS',
      carTopInspectionStationAndStop: 'PASS',
      automaticRescueDeviceArd: 'PASS',
      emergencyCabinLightingAndAlarm: 'PASS',
      intercomAndTelephoneSystem: 'PASS',
      firefightersControlReturnPhase: 'PASS',
    };

    return [
      {
        id: 'cert-1',
        certificateNumber: 'CERT-CIVIL-2026-0041',
        licenseNumber: 'CD-MNT-99214',
        elevatorName: 'مصعد الركاب الرئيسي - برج الأندلس',
        elevatorNumber: 'LIFT-AND-01',
        buildingName: 'برج الأندلس التجاري',
        siteLocation: 'الرياض - طريق الملك فهد',
        customerId: customers[0]?.id || 'cust-1',
        customerName: 'شركة الأندلس العقارية',
        customerPhone: '+966 50 111 2233',
        elevatorType: 'MRL Traction Gearless (بدون غرفة ماكينة)',
        capacityKg: 1000,
        personsCount: 13,
        speedMps: 1.6,
        stopsCount: 8,
        manufacturer: 'Twins / Sicor',
        installationYear: 2024,
        issueDate: '2026-03-10',
        expiryDate: '2027-03-09',
        status: 'VALID',
        inspectorEngineerName: 'م. أحمد كمال الغامدي',
        inspectorLicenseNumber: 'SCE-ENG-49120',
        civilDefenseApprovedCode: 'SCD-LIFT-AUTH-2026',
        standardsCompliance: 'كود البناء السعودي SBC 801 / المواصفة السعودية SASO EN 81-20:2020',
        checklist: defaultChecklist,
        inspectorNotes: 'تم اختبار كواسر السقوط ومنظومة الطوارئ ARD بكفاءة تامة. المصعد مطابق لكافة اشتراطات السلامة.',
        createdAt: '2026-03-10T10:00:00Z'
      },
      {
        id: 'cert-2',
        certificateNumber: 'CERT-CIVIL-2026-0042',
        licenseNumber: 'CD-MNT-77189',
        elevatorName: 'مصعد فيلا ركاب بانورامي',
        elevatorNumber: 'LIFT-NRJ-02',
        buildingName: 'فيلا م. فهد السبيعي',
        siteLocation: 'الرياض - حي النرجس',
        customerId: customers[1]?.id || 'cust-2',
        customerName: 'م. فهد السبيعي',
        customerPhone: '+966 55 444 7788',
        elevatorType: 'MRL Hydraulic / Traction',
        capacityKg: 450,
        personsCount: 6,
        speedMps: 1.0,
        stopsCount: 3,
        manufacturer: 'Twins',
        installationYear: 2025,
        issueDate: '2025-11-15',
        expiryDate: '2026-11-14', // Expiring soon (< 60 days)
        status: 'EXPIRING_SOON',
        inspectorEngineerName: 'م. راشد القحطاني',
        inspectorLicenseNumber: 'SCE-ENG-38102',
        civilDefenseApprovedCode: 'SCD-LIFT-AUTH-2025',
        standardsCompliance: 'كود البناء السعودي SBC 801 / SASO EN 81-20',
        checklist: defaultChecklist,
        inspectorNotes: 'قريب الانتهاء. تم جدولة اختبار فحص الحبال واختبار الباراشوت للتجديد السنوي.',
        createdAt: '2025-11-15T11:00:00Z'
      }
    ];
  });

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CERTIFICATES_KEY, JSON.stringify(certificates));
    } catch (e) {
      console.error(e);
    }
  }, [certificates]);

  // Modal States
  const [isNewCertModalOpen, setIsNewCertModalOpen] = useState(false);
  const [viewCert, setViewCert] = useState<SafetyCertificate | null>(null);

  // Form State for new certificate
  const [newCertNumber, setNewCertNumber] = useState(`CERT-CIVIL-2026-${String(certificates.length + 43).padStart(4, '0')}`);
  const [newCertLicense, setNewCertLicense] = useState(`CD-MNT-${Math.floor(10000 + Math.random() * 90000)}`);
  const [newCertElevatorName, setNewCertElevatorName] = useState('');
  const [newCertElevatorNumber, setNewCertElevatorNumber] = useState('');
  const [newCertBuildingName, setNewCertBuildingName] = useState('');
  const [newCertLocation, setNewCertLocation] = useState('');
  const [newCertCustName, setNewCertCustName] = useState('');
  const [newCertCustPhone, setNewCertCustPhone] = useState('');
  const [newCertType, setNewCertType] = useState('MRL Traction Gearless (بدون غرفة ماكينة)');
  const [newCertCapacity, setNewCertCapacity] = useState<number>(630);
  const [newCertPersons, setNewCertPersons] = useState<number>(8);
  const [newCertSpeed, setNewCertSpeed] = useState<number>(1.0);
  const [newCertStops, setNewCertStops] = useState<number>(5);
  const [newCertIssueDate, setNewCertIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCertExpiryDate, setNewCertExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newCertInspector, setNewCertInspector] = useState('م. أحمد كمال الغامدي');
  const [newCertInspectorLic, setNewCertInspectorLic] = useState('SCE-ENG-49120');
  const [newCertNotes, setNewCertNotes] = useState('تم اجتياز جميع اختبارات السلامة وكواسر السقوط ومنظومة الإنقاذ التلقائي بنجاح تام.');

  // Checklist responses
  const [formChecklist, setFormChecklist] = useState<SafetyChecklistResults>({
    overspeedGovernorTest: 'PASS',
    safetyGearDropTest: 'PASS',
    carBufferAndClearance: 'PASS',
    counterweightBufferAndClearance: 'PASS',
    machineBrakeTorqueAndHolding: 'PASS',
    tractionSheaveAndRopesWear: 'PASS',
    machineRoomVentilationAndLighting: 'PASS',
    carDoorInterlockAndLightCurtain: 'PASS',
    landingDoorLocksAndEmergencyRelease: 'PASS',
    pitEmergencyStopSwitch: 'PASS',
    carTopInspectionStationAndStop: 'PASS',
    automaticRescueDeviceArd: 'PASS',
    emergencyCabinLightingAndAlarm: 'PASS',
    intercomAndTelephoneSystem: 'PASS',
    firefightersControlReturnPhase: 'PASS',
  });

  // Quick fill from Contract or Project
  const handleImportSite = (contractId: string) => {
    const c = contracts.find(item => item.id === contractId);
    if (!c) return;

    setNewCertElevatorName(c.elevatorName || c.title);
    setNewCertElevatorNumber(c.elevatorNumber || `LIFT-${c.contractRef.slice(-4)}`);
    setNewCertBuildingName(c.title || c.customerName);
    setNewCertLocation(c.siteLocation);
    setNewCertCustName(c.customerName);
    setNewCertCustPhone(c.customerPhone || '');
    if (c.elevatorCapacityKg) setNewCertCapacity(c.elevatorCapacityKg);
    if (c.elevatorStops) setNewCertStops(c.elevatorStops);
    onShowToast(isAr ? 'تم استيراد بيانات المصعد والموقع!' : 'Elevator & site data imported!');
  };

  const handleSaveCertificate = () => {
    if (!newCertElevatorName.trim() || !newCertCustName.trim()) {
      alert(isAr ? 'يرجى إدخال اسم المصعد والعميل' : 'Please enter elevator and customer name');
      return;
    }

    const today = new Date();
    const exp = new Date(newCertExpiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let status: CertificateStatus = 'VALID';
    if (diffDays < 0) status = 'EXPIRED';
    else if (diffDays <= 60) status = 'EXPIRING_SOON';

    const newCert: SafetyCertificate = {
      id: `cert-${Date.now()}`,
      certificateNumber: newCertNumber,
      licenseNumber: newCertLicense,
      elevatorName: newCertElevatorName,
      elevatorNumber: newCertElevatorNumber || `LIFT-${Date.now().toString().slice(-4)}`,
      buildingName: newCertBuildingName || newCertElevatorName,
      siteLocation: newCertLocation,
      customerName: newCertCustName,
      customerPhone: newCertCustPhone,
      elevatorType: newCertType,
      capacityKg: Number(newCertCapacity),
      personsCount: Number(newCertPersons),
      speedMps: Number(newCertSpeed),
      stopsCount: Number(newCertStops),
      manufacturer: 'Twins Elevators',
      installationYear: new Date().getFullYear(),
      issueDate: newCertIssueDate,
      expiryDate: newCertExpiryDate,
      status,
      inspectorEngineerName: newCertInspector,
      inspectorLicenseNumber: newCertInspectorLic,
      civilDefenseApprovedCode: 'SCD-LIFT-AUTH-2026',
      standardsCompliance: 'كود البناء السعودي العام SBC 801 / المواصفة القياسية SASO EN 81-20:2020',
      checklist: formChecklist,
      inspectorNotes: newCertNotes,
      createdAt: new Date().toISOString()
    };

    setCertificates([newCert, ...certificates]);
    setIsNewCertModalOpen(false);
    onShowToast(isAr ? `تم إصدار شهادة السلامة ${newCertNumber} بنجاح!` : `Safety Certificate ${newCertNumber} issued!`);
    setNewCertNumber(`CERT-CIVIL-2026-${String(certificates.length + 44).padStart(4, '0')}`);
  };

  const handleDeleteCert = (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الشهادة؟' : 'Are you sure you want to delete this certificate?')) {
      setCertificates(certificates.filter(c => c.id !== id));
      onShowToast(isAr ? 'تم حذف الشهادة' : 'Certificate deleted');
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = certificates.length;
    const valid = certificates.filter(c => c.status === 'VALID').length;
    const expiringSoon = certificates.filter(c => c.status === 'EXPIRING_SOON').length;
    const expired = certificates.filter(c => c.status === 'EXPIRED').length;
    return { total, valid, expiringSoon, expired };
  }, [certificates]);

  // Filtered
  const filteredCerts = useMemo(() => {
    return certificates.filter(c => {
      const matchSearch = 
        c.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.elevatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.buildingName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [certificates, searchQuery, statusFilter]);

  const getStatusBadge = (st: CertificateStatus) => {
    switch (st) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'سارية ومعتمدة' : 'Valid'}</span>
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAr ? 'قريبة الانتهاء (< 60 يوم)' : 'Expiring Soon'}</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{isAr ? 'منتهية الصلاحية' : 'Expired'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>{isAr ? 'السلامة والامتثال وتراخيص الدفاع المدني (SASO / SBC 801)' : 'Safety Compliance & Civil Defense Audits'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {isAr ? 'شهادات السلامة ورخص تشغيل المصاعد' : 'Safety Certificates & Operating Licenses'}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              {isAr ? 'إصدار وتوثيق شهادات الفحص الهندسي الدوري، واختبارات كواسر السقوط، ورخص الدفاع المدني المعتمدة.' : 'Issue periodic engineering safety certificates, overspeed/drop test records, and official Civil Defense licenses.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewCertModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer hover:scale-102 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إصدار شهادة فحص سلامة جديدة' : 'New Safety Audit Certificate'}</span>
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{isAr ? 'إجمالي شهادات السلامة' : 'Total Certificates'}</span>
            </div>
            <div className="text-2xl font-black text-white">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-1">{isAr ? 'مصعد مسجل' : 'elevators'}</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'رخص سارية ومعتمدة' : 'Valid Licenses'}</span>
            </div>
            <div className="text-2xl font-black text-emerald-400">{stats.valid}</div>
            <div className="text-[11px] text-slate-400 mt-1">{isAr ? 'مطابقة للمواصفات' : 'compliant'}</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'قريبة الانتهاء (< 60 يوماً)' : 'Expiring Soon (< 60d)'}</span>
            </div>
            <div className="text-2xl font-black text-amber-400">{stats.expiringSoon}</div>
            <div className="text-[11px] text-slate-400 mt-1">{isAr ? 'بحاجة لجدولة الفحص' : 'needs renewal'}</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{isAr ? 'رخص منتهية الصلاحية' : 'Expired'}</span>
            </div>
            <div className="text-2xl font-black text-rose-400">{stats.expired}</div>
            <div className="text-[11px] text-slate-400 mt-1">{isAr ? 'تحذير توقف التشغيل' : 'urgent action'}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث برقم الشهادة، المبنى، المصعد، العميل...' : 'Search certificate, building, customer...'}
            className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
        >
          <option value="ALL">{isAr ? 'كافة حالات الشهادات' : 'All Statuses'}</option>
          <option value="VALID">{isAr ? 'سارية ومعتمدة' : 'Valid'}</option>
          <option value="EXPIRING_SOON">{isAr ? 'قريبة الانتهاء' : 'Expiring Soon'}</option>
          <option value="EXPIRED">{isAr ? 'منتهية' : 'Expired'}</option>
        </select>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">{isAr ? 'رقم الشهادة / الترخيص' : 'Cert / License #'}</th>
                <th className="px-4 py-3">{isAr ? 'المصعد والمبنى' : 'Elevator / Building'}</th>
                <th className="px-4 py-3">{isAr ? 'الموقع والعميل' : 'Site / Customer'}</th>
                <th className="px-4 py-3">{isAr ? 'المواصفة الفنية' : 'Technical Spec'}</th>
                <th className="px-4 py-3">{isAr ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                <th className="px-4 py-3">{isAr ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}</th>
                <th className="px-4 py-3">{isAr ? 'المهندس الفاحص' : 'Inspector'}</th>
                <th className="px-4 py-3">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                    <p className="font-semibold">{isAr ? 'لا توجد شهادات سلامة مطابقة' : 'No certificates found'}</p>
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-rose-700">{cert.certificateNumber}</div>
                      {cert.licenseNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {isAr ? 'ترخيص:' : 'Lic:'} {cert.licenseNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{cert.elevatorName}</div>
                      <div className="text-[10px] text-slate-500">{cert.buildingName}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{cert.customerName}</div>
                      <div className="text-[10px] text-slate-400">{cert.siteLocation}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-700">
                        {cert.capacityKg} kg / {cert.personsCount} {isAr ? 'ركاب' : 'pers.'}
                      </div>
                      <div className="text-[10px] text-slate-400">{cert.stopsCount} {isAr ? 'وقفات' : 'stops'} • {cert.speedMps} m/s</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{cert.issueDate}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {cert.expiryDate}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{cert.inspectorEngineerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{cert.inspectorLicenseNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(cert.status)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewCert(cert)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={isAr ? 'عرض وطباعة شهادة السلامة المعتمدة' : 'View & Print Certificate'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCert(cert.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Create New Safety Audit Certificate             */}
      {/* ======================================================== */}
      {isNewCertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">
                  {isAr ? 'إصدار تقرير فحص وشهادة سلامة معتمدة للمصعد' : 'New Elevator Safety Inspection Certificate'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCertModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Quick import site */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold">
                  <Building2 className="w-4 h-4 text-rose-600" />
                  <span>{isAr ? 'استيراد بيانات المصعد والموقع من عقد قائم:' : 'Import site from contract:'}</span>
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleImportSite(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-semibold focus:outline-hidden"
                >
                  <option value="">{isAr ? '— اختر عقداً للاستيراد —' : 'Select contract'}</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.contractRef} - {c.elevatorName} ({c.siteLocation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Basic Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'رقم الشهادة المعتمد' : 'Certificate #'}</label>
                  <input
                    type="text"
                    value={newCertNumber}
                    onChange={(e) => setNewCertNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-rose-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'رقم رخصة الدفاع المدني' : 'Civil Defense Lic #'}</label>
                  <input
                    type="text"
                    value={newCertLicense}
                    onChange={(e) => setNewCertLicense(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'كود المصعد (Elevator Tag)' : 'Elevator Tag #'}</label>
                  <input
                    type="text"
                    value={newCertElevatorNumber}
                    onChange={(e) => setNewCertElevatorNumber(e.target.value)}
                    placeholder="LIFT-RDH-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Site & Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'اسم المصعد' : 'Elevator Name'}</label>
                  <input
                    type="text"
                    value={newCertElevatorName}
                    onChange={(e) => setNewCertElevatorName(e.target.value)}
                    placeholder="مصعد الركاب الرئيسي..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'اسم المبنى / المنشأة' : 'Building Name'}</label>
                  <input
                    type="text"
                    value={newCertBuildingName}
                    onChange={(e) => setNewCertBuildingName(e.target.value)}
                    placeholder="برج... / مجمع..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'العميل / مالك العقار' : 'Customer Name'}</label>
                  <input
                    type="text"
                    value={newCertCustName}
                    onChange={(e) => setNewCertCustName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'موقع ومدينة المنشأة' : 'Site Location'}</label>
                  <input
                    type="text"
                    value={newCertLocation}
                    onChange={(e) => setNewCertLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Technical Capacity */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'الحمولة (كجم)' : 'Capacity (kg)'}</label>
                  <input
                    type="number"
                    value={newCertCapacity}
                    onChange={(e) => setNewCertCapacity(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'سعة الركاب' : 'Persons'}</label>
                  <input
                    type="number"
                    value={newCertPersons}
                    onChange={(e) => setNewCertPersons(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'السرعة (م/ث)' : 'Speed (m/s)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCertSpeed}
                    onChange={(e) => setNewCertSpeed(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'عدد التوقفات' : 'Stops'}</label>
                  <input
                    type="number"
                    value={newCertStops}
                    onChange={(e) => setNewCertStops(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-center"
                  />
                </div>
              </div>

              {/* Dates & Inspector */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'تاريخ الفحص' : 'Issue Date'}</label>
                  <input
                    type="date"
                    value={newCertIssueDate}
                    onChange={(e) => setNewCertIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'تاريخ انتهاء الشهادة' : 'Expiry Date'}</label>
                  <input
                    type="date"
                    value={newCertExpiryDate}
                    onChange={(e) => setNewCertExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'المهندس الفاحص' : 'Inspector Engineer'}</label>
                  <input
                    type="text"
                    value={newCertInspector}
                    onChange={(e) => setNewCertInspector(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'رقم الاعتماد الهندسي' : 'Engineer SCE Lic #'}</label>
                  <input
                    type="text"
                    value={newCertInspectorLic}
                    onChange={(e) => setNewCertInspectorLic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Key Technical Safety Tests Checklist */}
              <div>
                <label className="font-bold text-slate-900 block mb-2 text-sm">
                  {isAr ? 'نتائج الفحص والاختبارات الفنية الإلزامية (SASO EN 81-20 / SBC 801):' : 'Mandatory Safety Test Results:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {[
                    { key: 'overspeedGovernorTest', label: isAr ? 'اختبار منظم السرعة الميكانيكي (Overspeed Governor)' : 'Overspeed Governor Test' },
                    { key: 'safetyGearDropTest', label: isAr ? 'اختبار كواسر السقوط والباراشوت (Safety Gear Drop Test)' : 'Safety Gear Test' },
                    { key: 'machineBrakeTorqueAndHolding', label: isAr ? 'اختبار فرامل الماكينة والحمولة الزائدة 125%' : 'Brake Holding & 125% Overload' },
                    { key: 'automaticRescueDeviceArd', label: isAr ? 'منظومة الطوارئ والنزول التلقائي (ARD / Batteries)' : 'ARD Automatic Rescue' },
                    { key: 'carDoorInterlockAndLightCurtain', label: isAr ? 'ستائر الأبواب الضوئية وحساسات القفل الميكانيكي' : 'Light Curtains & Interlocks' },
                    { key: 'pitEmergencyStopSwitch', label: isAr ? 'مفاتيح التوقف ومصدات الصدمات بالحفرة (Buffer & Pit Stop)' : 'Pit Stop & Buffer' }
                  ].map((test) => (
                    <div key={test.key} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <span className="font-medium text-[11px] text-slate-800">{test.label}</span>
                      <select
                        value={(formChecklist as any)[test.key]}
                        onChange={(e) => {
                          setFormChecklist({ ...formChecklist, [test.key]: e.target.value as InspectionTestResult });
                        }}
                        className="px-2 py-1 rounded bg-slate-100 border border-slate-300 font-bold text-[10px]"
                      >
                        <option value="PASS">{isAr ? 'اجتاز (Pass)' : 'Pass'}</option>
                        <option value="NEEDS_ATTENTION">{isAr ? 'ملاحظة (Attention)' : 'Attention'}</option>
                        <option value="FAIL">{isAr ? 'لم يجتز (Fail)' : 'Fail'}</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">{isAr ? 'ملاحظات وتوصيات الفحص الهندسي' : 'Engineer Recommendations'}</label>
                <textarea
                  rows={2}
                  value={newCertNotes}
                  onChange={(e) => setNewCertNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsNewCertModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveCertificate}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                {isAr ? 'اعتماد وإصدار شهادة السلامة' : 'Issue Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Printable Official Safety Certificate           */}
      {/* ======================================================== */}
      {viewCert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Action Bar */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-xs">{isAr ? 'معاينة شهادة السلامة ورخصة التشغيل المعتمدة' : 'Official Certificate Preview'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة الشهادة الرسمية' : 'Print Certificate'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewCert(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Certificate Canvas */}
            <div className="p-8 space-y-6 text-slate-800 bg-white border-8 border-slate-900 m-4 rounded-xl" id="official-safety-cert-print">
              {/* Certificate Border & Header */}
              <div className="text-center border-b-2 border-rose-800 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-right text-xs text-slate-600 space-y-0.5">
                    <div className="font-bold text-slate-900">{companySettings.nameAr || 'شركة توينز للمصاعد المحدودة'}</div>
                    <div>{isAr ? 'إدارة الصيانة والسلامة الهندسية' : 'Safety Engineering Dept.'}</div>
                    <div>{isAr ? 'سجل تجاري:' : 'CR:'} <span className="font-mono">{companySettings.commercialReg || '1010889922'}</span></div>
                  </div>

                  <div className="w-14 h-14 rounded-full border-2 border-rose-800 bg-rose-50 text-rose-800 flex items-center justify-center mx-auto shadow-xs">
                    <ShieldCheck className="w-8 h-8" />
                  </div>

                  <div className="text-left text-xs text-slate-600 space-y-0.5">
                    <div>{isAr ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}</div>
                    <div>{isAr ? 'المديرية العامة للدفاع المدني' : 'General Directorate of Civil Defense'}</div>
                    <div className="font-mono text-rose-800 font-bold">{viewCert.certificateNumber}</div>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide mt-2">
                  {isAr ? 'شهادة فحص واجتياز سلامة تشغيل مصعد' : 'CERTIFICATE OF ELEVATOR SAFETY & INSPECTION'}
                </h2>
                <div className="text-xs font-semibold text-rose-800 mt-1">
                  {viewCert.standardsCompliance}
                </div>
              </div>

              {/* Certificate Statement */}
              <div className="text-center text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {isAr ? (
                  <p>
                    تشهد إدارة السلامة الفنية والهندسية بأن المصعد الموضح بياناته أدناه قد خضع للفحص الشامل
                    واختبارات السلامة الميكانيكية والكهربائية واختبار كواسر السقوط ومنظومة الطوارئ،
                    وقد <strong>اجتاز كافة المعايير والاشتراطات الفنية</strong> ويُصرّح له بالتشغيل الآمن
                    حتى تاريخ انتهاء الصلاحية المحدد أدناه.
                  </p>
                ) : (
                  <p>
                    This is to certify that the vertical transportation equipment detailed below has undergone
                    rigorous periodic technical inspection, overspeed drop tests, and emergency system verification
                    and has successfully passed all mandatory Saudi Building Code and SASO standards.
                  </p>
                )}
              </div>

              {/* Elevator Details Table */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-white border border-slate-200 rounded-xl p-4">
                <div className="space-y-1.5">
                  <div><span className="text-slate-500">{isAr ? 'رقم الشهادة:' : 'Cert #:'}</span> <strong className="font-mono text-rose-700">{viewCert.certificateNumber}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'ترخيص الدفاع المدني:' : 'Civil Defense Lic:'}</span> <strong className="font-mono">{viewCert.licenseNumber}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'اسم المصعد:' : 'Elevator Name:'}</span> <strong className="text-slate-900">{viewCert.elevatorName}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'المبنى والمنشأة:' : 'Building:'}</span> <strong className="text-slate-900">{viewCert.buildingName}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'الموقع الجغرافي:' : 'Location:'}</span> <span>{viewCert.siteLocation}</span></div>
                </div>

                <div className="space-y-1.5">
                  <div><span className="text-slate-500">{isAr ? 'اسم العميل / المالك:' : 'Customer / Owner:'}</span> <strong className="text-slate-900">{viewCert.customerName}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'نوع ونظام المصعد:' : 'Elevator Type:'}</span> <span>{viewCert.elevatorType}</span></div>
                  <div><span className="text-slate-500">{isAr ? 'الحمولة وسعة الركاب:' : 'Load & Persons:'}</span> <strong className="font-mono">{viewCert.capacityKg} kg / {viewCert.personsCount} {isAr ? 'ركاب' : 'persons'}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'عدد التوقفات والسرعة:' : 'Stops & Speed:'}</span> <strong className="font-mono">{viewCert.stopsCount} stops • {viewCert.speedMps} m/s</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'حالة الاعتماد:' : 'Status:'}</span> <strong className="text-emerald-700">{isAr ? 'معتمد وساري المفعول' : 'Certified & Valid'}</strong></div>
                </div>
              </div>

              {/* Checklist Grid */}
              <div>
                <div className="font-bold text-xs text-slate-800 mb-2">
                  {isAr ? 'نتائج الاختبارات المعملية والفحص الميداني:' : 'Mandatory Technical Test Results:'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <span>{isAr ? 'اختبار كواسر السقوط والباراشوت' : 'Safety Gear Drop Test'}</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> اجتاز (Pass)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <span>{isAr ? 'منظم السرعة الميكانيكي (Governor)' : 'Overspeed Governor'}</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> اجتاز (Pass)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <span>{isAr ? 'فرامل الماكينة والحمولة الزائدة 125%' : 'Brake Holding & Overload 125%'}</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> اجتاز (Pass)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                    <span>{isAr ? 'جهاز النزول التلقائي للطوارئ ARD' : 'Emergency ARD Device'}</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> اجتاز (Pass)</span>
                  </div>
                </div>
              </div>

              {/* Dates & Validity Highlight */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-600">{isAr ? 'تاريخ الفحص والإصدار:' : 'Issue Date:'}</span>
                  <strong className="font-mono text-slate-900 ms-1.5">{viewCert.issueDate}</strong>
                </div>
                <div>
                  <span className="text-rose-900 font-bold">{isAr ? 'تاريخ انتهاء الصلاحية والتجديد:' : 'Expiry Date:'}</span>
                  <strong className="font-mono text-rose-800 text-sm ms-1.5">{viewCert.expiryDate}</strong>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex items-end justify-between pt-8 border-t border-slate-300 text-xs">
                <div>
                  <div className="text-slate-500 mb-8 font-medium">
                    {isAr ? 'المهندس الفاحص المعتمد:' : 'Certified Engineer:'} {viewCert.inspectorEngineerName}
                    <div className="text-[10px] text-slate-400 font-mono">رقم الاعتماد: {viewCert.inspectorLicenseNumber}</div>
                  </div>
                  <div className="border-b border-slate-400 w-44"></div>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-rose-800 flex items-center justify-center mx-auto text-rose-800 text-[10px] font-bold text-center p-2 mb-2">
                    ختم الاعتماد<br/>الهندسي
                  </div>
                  <div className="text-[10px] text-slate-400">{isAr ? 'إدارة الصيانة والسلامة' : 'Safety Management'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
