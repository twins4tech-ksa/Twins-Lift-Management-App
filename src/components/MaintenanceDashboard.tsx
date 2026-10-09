import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Wrench,
  FileCheck2,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Trash2,
  Edit3,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  AlertTriangle,
  RotateCcw,
  BellRing,
  Mail,
  Send,
  Sparkles
} from 'lucide-react';
import {
  MaintenanceContract,
  CONTRACT_TYPE_CONFIG,
  CONTRACT_STATUS_CONFIG,
  MaintenanceContractStatus
} from '../types/maintenance';
import { Customer, ElevatorSpecification } from '../types/elevator';
import { Employee } from '../types/employee';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import MaintenanceContractEditor from './MaintenanceContractEditor';
import { RenewalQuotationEmailModal } from './RenewalQuotationEmailModal';
import { SearchableSelect } from './SearchableSelect';
import { getContractExpiryInfo, getExpiringContracts } from '../utils/maintenanceExpiry';
import { generateElevatorNumber } from '../utils/elevatorCode';
import { useInteractiveTable, InteractiveColumn } from '../hooks/useInteractiveTable';
import { InteractiveTableHeader, TableControlBar } from './InteractiveTableHeader';

interface MaintenanceDashboardProps {
  contracts: MaintenanceContract[];
  customers: Customer[];
  projects: ElevatorSpecification[];
  employees?: Employee[];
  companySettings: CompanySettings;
  language: AppLanguage;
  onSaveContract: (contract: MaintenanceContract) => void;
  onDeleteContract: (contractId: string) => void;
  onNewContractClick?: () => void;
  forcedTab?: 'CONTRACTS' | 'QUOTATIONS' | 'SCHEDULES';
  onOpenRenewalEmail?: (contract: MaintenanceContract) => void;
  onShowToast?: (msg: string) => void;
}

export default function MaintenanceDashboard({
  contracts,
  customers,
  projects,
  employees = [],
  companySettings,
  language,
  onSaveContract,
  onDeleteContract,
  forcedTab,
  onOpenRenewalEmail,
  onShowToast,
}: MaintenanceDashboardProps) {
  const isAr = language === 'ar';

  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'CONTRACTS' | 'QUOTATIONS' | 'EXPIRING_SOON'>(forcedTab === 'CONTRACTS' ? 'CONTRACTS' : (forcedTab === 'QUOTATIONS' ? 'QUOTATIONS' : 'ALL'));
  React.useEffect(() => { if(forcedTab && forcedTab !== 'SCHEDULES') setActiveFilterTab(forcedTab as any); }, [forcedTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [editingContract, setEditingContract] = useState<MaintenanceContract | null>(null);
  const [renewalEmailModalContract, setRenewalEmailModalContract] = useState<MaintenanceContract | null>(null);

  // Expiring contracts calculation (within 30 days based on service end date)
  const expiringContractsList = contracts.filter((c) => {
    const info = getContractExpiryInfo(c, 30);
    return info && info.isExpiringSoon && c.isContract && c.status === 'Active';
  });

  // Helper to renew an expiring contract for the next year
  const handleRenewContract = (contract: MaintenanceContract) => {
    const today = new Date();
    let newStart = new Date();
    if (contract.endDate) {
      const parts = contract.endDate.split('-');
      if (parts.length === 3) {
        newStart = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        newStart.setDate(newStart.getDate() + 1);
      }
    }
    const newEnd = new Date(newStart);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    newEnd.setDate(newEnd.getDate() - 1);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${newStart.getFullYear()}-${pad(newStart.getMonth() + 1)}-${pad(newStart.getDate())}`;
    const endStr = `${newEnd.getFullYear()}-${pad(newEnd.getMonth() + 1)}-${pad(newEnd.getDate())}`;
    const renewalYear = newStart.getFullYear();

    const renewalContract: MaintenanceContract = {
      ...contract,
      id: `mnt-${Date.now()}`,
      contractRef: `MNT-CTR-${renewalYear}-${String(contracts.length + 1).padStart(3, '0')}`,
      elevatorNumber: contract.elevatorNumber || generateElevatorNumber('MAINTENANCE', today, contracts.length + 1),
      title: `${contract.title.replace(/\s*-\s*تجديد.*$/i, '')} - تجديد ${renewalYear}`,
      status: 'Active',
      startDate: startStr,
      endDate: endStr,
      createdAt: today.toISOString().split('T')[0],
      updatedAt: today.toISOString().split('T')[0],
      visits: [],
    };

    setEditingContract(renewalContract);
  };

  // Helper to create a new blank contract
  const handleCreateNew = (isContract: boolean = true) => {
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    nextYear.setDate(nextYear.getDate() - 1);

    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const nextYearStr = `${nextYear.getFullYear()}-${pad(nextYear.getMonth() + 1)}-${pad(nextYear.getDate())}`;

    const newRef = isContract 
      ? `MNT-CTR-${today.getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`
      : `MNT-QT-${today.getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`;

    const newElevatorNumber = generateElevatorNumber('MAINTENANCE', today, contracts.length + 1);

    const newContract: MaintenanceContract = {
      id: `mnt-${Date.now()}`,
      contractRef: newRef,
      elevatorNumber: newElevatorNumber,
      isContract,
      title: isContract ? 'عقد صيانة دورية سنوية لمصعد' : 'عرض سعر صيانة دورية لمصعد',
      customerName: customers.length > 0 ? customers[0].name : 'عميل جديد',
      customerCompany: customers.length > 0 ? customers[0].company : '',
      customerPhone: customers.length > 0 ? customers[0].phone : '',
      customerEmail: customers.length > 0 ? customers[0].email : '',
      siteLocation: 'الرياض - حي العليا',
      elevatorName: 'مصعد ركاب رئيسي 8 أشخاص',
      elevatorStops: 6,
      elevatorCapacityKg: 630,
      contractType: 'PREVENTIVE_STANDARD',
      status: isContract ? 'Active' : 'Draft',
      totalPrice: 12000,
      paymentFrequency: 'Quarterly',
      startDate: todayStr,
      endDate: nextYearStr,
      annualVisitsCount: 12,
      emergencyCoverage: true,
      responseTimeHours: 2,
      visits: [],
      createdAt: todayStr,
      updatedAt: todayStr,
    };

    setEditingContract(newContract);
  };

  // Convert Quotation to Active Contract
  const handleConvertToContract = (quote: MaintenanceContract) => {
    const updated: MaintenanceContract = {
      ...quote,
      isContract: true,
      status: 'Active',
      contractRef: quote.contractRef.replace('QT-', 'CTR-'),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveContract(updated);
  };

  // Duplicate contract
  const handleDuplicate = (source: MaintenanceContract) => {
    const duplicate: MaintenanceContract = {
      ...source,
      id: `mnt-${Date.now()}`,
      contractRef: `${source.contractRef}-COPY`,
      title: `${source.title} (نسخة)`,
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveContract(duplicate);
  };

  // Filter calculations
  const filteredContracts = contracts.filter((c) => {
    // Type tab filter
    if (activeFilterTab === 'CONTRACTS' && !c.isContract) return false;
    if (activeFilterTab === 'QUOTATIONS' && c.isContract) return false;
    if (activeFilterTab === 'EXPIRING_SOON') {
      const info = getContractExpiryInfo(c, 30);
      if (!info || !info.isExpiringSoon || !c.isContract || c.status !== 'Active') return false;
    }

    // Status filter
    if (selectedStatusFilter !== 'ALL' && c.status !== selectedStatusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customerName?.toLowerCase().includes(q);
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchRef = c.contractRef?.toLowerCase().includes(q);
      const matchElevatorNum = c.elevatorNumber?.toLowerCase().includes(q);
      const matchElevator = c.elevatorName?.toLowerCase().includes(q);
      const matchLocation = c.siteLocation?.toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchRef && !matchElevatorNum && !matchElevator && !matchLocation) {
        return false;
      }
    }
    return true;
  });

  // KPI Calculations
  const activeContractsList = contracts.filter(c => c.isContract && c.status === 'Active');
  const quotationsList = contracts.filter(c => !c.isContract);
  const totalContractRevenue = activeContractsList.reduce((acc, c) => acc + (c.totalPrice || 0), 0);
  
  let totalVisits = 0;
  let totalCompletedVisits = 0;
  let totalUpcomingVisits = 0;

  contracts.forEach(c => {
    c.visits.forEach(v => {
      totalVisits++;
      if (v.status === 'Completed') totalCompletedVisits++;
      if (v.status === 'Scheduled') totalUpcomingVisits++;
    });
  });

  // Interactive Table Column Definitions
  const contractColumns: InteractiveColumn<MaintenanceContract>[] = useMemo(() => [
    {
      id: 'ref_and_type',
      header: isAr ? 'المرجع والنوع' : 'Ref & Type',
      headerAr: 'المرجع والنوع',
      headerEn: 'Ref & Type',
      sortable: true,
      accessor: (c) => c.contractRef,
      renderCell: (c) => (
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${
              c.isContract ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {c.contractRef}
            </span>
            {c.elevatorNumber && (
              <span className="px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200" title={isAr ? 'رقم كود المصعد' : 'Elevator Unit Code'}>
                {c.elevatorNumber}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            {c.isContract ? (isAr ? 'عقد صيانة ساري' : 'Active Contract') : (isAr ? 'عرض سعر صيانة' : 'Quotation')}
          </span>
        </div>
      ),
    },
    {
      id: 'customer',
      header: isAr ? 'اسم العميل والمنشأة' : 'Client & Company',
      headerAr: 'اسم العميل والمنشأة',
      headerEn: 'Client & Company',
      sortable: true,
      accessor: (c) => c.customerName,
      renderCell: (c) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">
            {c.customerName}
          </div>
          {c.customerCompany && (
            <span className="text-[11px] text-slate-500 block">{c.customerCompany}</span>
          )}
          {c.customerPhone && (
            <span className="text-[10px] text-slate-400 block font-mono">{c.customerPhone}</span>
          )}
        </div>
      ),
    },
    {
      id: 'elevator_location',
      header: isAr ? 'بيانات المصعد والموقع' : 'Elevator & Location',
      headerAr: 'بيانات المصعد والموقع',
      headerEn: 'Elevator & Location',
      sortable: true,
      accessor: (c) => c.elevatorName,
      renderCell: (c) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">
            {c.elevatorName}
          </div>
          <span className="text-[11px] text-slate-500 block truncate max-w-xs">
            {c.siteLocation}
          </span>
          {c.assignedTechnicianName && (
            <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded w-fit mt-1">
              <Wrench className="w-2.5 h-2.5" />
              <span>{isAr ? `الفني: ${c.assignedTechnicianName}` : `Tech: ${c.assignedTechnicianName}`}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'duration',
      header: isAr ? 'فترة سريان الجدول' : 'Schedule Duration',
      headerAr: 'فترة سريان الجدول',
      headerEn: 'Schedule Duration',
      sortable: true,
      accessor: (c) => c.startDate || '',
      renderCell: (c) => {
        const expiryInfo = getContractExpiryInfo(c, 30);
        return (
          <div className="font-mono text-[11px]">
            <div className="flex items-center gap-1 text-slate-800 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{c.startDate || '-'}</span>
              <span className="text-slate-400">{isAr ? 'إلى' : 'to'}</span>
              <span>{c.endDate || '-'}</span>
            </div>
            
            {expiryInfo && c.isContract && (
              <div className="mt-1">
                {expiryInfo.isExpiringSoon ? (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs ${expiryInfo.badgeClass}`}>
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{isAr ? expiryInfo.badgeTextAr : expiryInfo.badgeTextEn}</span>
                  </span>
                ) : expiryInfo.isExpired ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{isAr ? expiryInfo.badgeTextAr : expiryInfo.badgeTextEn}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 block font-sans">
                    {CONTRACT_TYPE_CONFIG[c.contractType]?.labelAr}
                  </span>
                )}
              </div>
            )}
            {(!expiryInfo || !c.isContract) && (
              <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">
                {CONTRACT_TYPE_CONFIG[c.contractType]?.labelAr}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'visits_progress',
      header: isAr ? 'تقدم الزيارات' : 'Visits Progress',
      headerAr: 'تقدم الزيارات',
      headerEn: 'Visits Progress',
      align: 'center',
      sortable: true,
      accessor: (c) => {
        const totalVisitsCount = c.visits.length;
        const completedCount = c.visits.filter(v => v.status === 'Completed').length;
        return totalVisitsCount > 0 ? (completedCount / totalVisitsCount) * 100 : 0;
      },
      renderCell: (c) => {
        const completedCount = c.visits.filter(v => v.status === 'Completed').length;
        const totalVisitsCount = c.visits.length;
        const progressPct = totalVisitsCount > 0 ? Math.round((completedCount / totalVisitsCount) * 100) : 0;
        return (
          <div className="inline-block text-center w-full max-w-[120px]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
              <span>{completedCount} / {totalVisitsCount}</span>
              <span className="text-blue-600 font-bold">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: 'value',
      header: isAr ? 'قيمة العقد' : 'Value (SAR)',
      headerAr: 'قيمة العقد',
      headerEn: 'Value (SAR)',
      align: 'end',
      sortable: true,
      accessor: (c) => c.totalPrice || 0,
      renderCell: (c) => (
        <div>
          <div className="font-bold text-slate-900 text-xs flex items-center justify-end gap-1">
            {(c.totalPrice || 0).toLocaleString()}
            <SaudiRiyalSymbol className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-[10px] text-slate-500 block text-end">
            {c.paymentFrequency === 'Quarterly' ? (isAr ? 'أقساط ربع سنوية' : 'Quarterly') : c.paymentFrequency === 'Annual' ? (isAr ? 'دفعة سنوية' : 'Annual') : c.paymentFrequency}
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: isAr ? 'الحالة' : 'Status',
      headerAr: 'الحالة',
      headerEn: 'Status',
      sortable: true,
      accessor: (c) => c.status,
      renderCell: (c) => {
        const statusConf = CONTRACT_STATUS_CONFIG[c.status] || CONTRACT_STATUS_CONFIG.Draft;
        const expiryInfo = getContractExpiryInfo(c, 30);
        const isExpSoon = expiryInfo && expiryInfo.isExpiringSoon && c.isContract && c.status === 'Active';
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConf.bgClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dotClass}`} />
              {isAr ? statusConf.labelAr : statusConf.labelEn}
            </span>
            {isExpSoon && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                <span>{isAr ? 'تجديد مطلوب' : 'Renewal Due'}</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      headerAr: 'الإجراءات',
      headerEn: 'Actions',
      align: 'center',
      sortable: false,
      draggable: false,
      renderCell: (c) => {
        const expiryInfo = getContractExpiryInfo(c, 30);
        const isExpSoon = expiryInfo && expiryInfo.isExpiringSoon && c.isContract && c.status === 'Active';
        return (
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            {isExpSoon && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenRenewalEmail) {
                      onOpenRenewalEmail(c);
                    } else {
                      setRenewalEmailModalContract(c);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                  title={isAr ? 'إرسال بريد عرض تجديد العقد للعميل بالنموذج المعتمد' : 'Send renewal quotation email'}
                >
                  <Mail className="w-3 h-3" />
                  <span>{isAr ? 'عرض تجديد' : 'Renewal Email'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRenewContract(c)}
                  className="px-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                  title={isAr ? 'إنشاء وتجديد العقد للسنة القادمة في النظام' : 'Renew contract for next year in system'}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isAr ? 'تجديد' : 'Renew'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setEditingContract(c)}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              title={isAr ? 'فتح جدول الزيارات' : 'Open Schedule'}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isAr ? 'جدول الزيارات' : 'Schedule'}</span>
            </button>

            {!c.isContract && (
              <button
                type="button"
                onClick={() => handleConvertToContract(c)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title={isAr ? 'اعتماد وتحويل إلى عقد ساري' : 'Convert to Active Contract'}
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDuplicate(c)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title={isAr ? 'تكرار' : 'Duplicate'}
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذا العقد/العرض؟' : 'Delete this contract?')) {
                  onDeleteContract(c.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title={isAr ? 'حذف' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ], [isAr, handleRenewContract, handleConvertToContract, handleDuplicate, onDeleteContract, setEditingContract]);

  const contractsTable = useInteractiveTable({
    tableId: 'maintenance_contracts_table',
    columns: contractColumns,
    data: filteredContracts,
    isAr,
  });

  // If currently in Editor mode, render the editor after all hooks have executed
  if (editingContract) {
    return (
      <MaintenanceContractEditor
        contract={editingContract}
        customers={customers}
        projects={projects}
        employees={employees}
        companySettings={companySettings}
        language={language}
        onSave={(updated) => {
          onSaveContract(updated);
          setEditingContract(null);
        }}
        onCancel={() => setEditingContract(null)}
      />
    );
  }

  return (
    <div className="space-y-4 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header & New Contract Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                {isAr ? 'مركز عقود وجداول صيانة المصاعد' : 'Maintenance Quotations & Contracts'}
              </h1>
              {/* Expiring Contracts Header Notification Badge */}
              {expiringContractsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilterTab(activeFilterTab === 'EXPIRING_SOON' ? 'ALL' : 'EXPIRING_SOON')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[11px] font-bold transition-all shadow-2xs group cursor-pointer"
                  title={isAr ? 'انقر لتصفية العقود التي تنتهي خلال 30 يوماً' : 'Click to filter contracts expiring within 30 days'}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <Clock className="w-3 h-3 text-amber-600 group-hover:rotate-12 transition-transform" />
                  <span>
                    {isAr
                      ? `${expiringContractsList.length} تنتهي قريباً`
                      : `${expiringContractsList.length} expiring`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto justify-start sm:justify-end">
          {/* Create New Maintenance Quotation */}
          <button
            type="button"
            onClick={() => handleCreateNew(false)}
            className="flex-1 sm:flex-initial px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            title={isAr ? 'إنشاء عرض سعر صيانة جديد' : 'New Maintenance Quotation'}
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? '+ عرض صيانة' : '+ Quotation'}</span>
          </button>

          {/* Create New Active Maintenance Contract */}
          <button
            type="button"
            id="btn-create-maintenance-contract"
            onClick={() => handleCreateNew(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
            title={isAr ? 'إنشاء وتفعيل عقد صيانة وجدول زيارات جديد' : 'Create New Maintenance Contract'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? '+ عقد صيانة' : '+ New Contract'}</span>
          </button>
        </div>
      </div>

      {/* Expiry Notification Alert Banner (shows when active contracts expire within 30 days) */}
      {expiringContractsList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-amber-950">
                  {isAr 
                    ? `تنبيه: ${expiringContractsList.length} عقود صيانة تنتهي خلال 30 يوماً` 
                    : `Notification: ${expiringContractsList.length} Contracts Expiring in 30 Days`}
                </h3>
              </div>
              {/* Quick tags of expiring contracts with quick actions */}
              <div className="flex flex-wrap gap-2 mt-1.5">
                {expiringContractsList.map((ec) => {
                  const expInfo = getContractExpiryInfo(ec, 30);
                  return (
                    <div
                      key={ec.id}
                      className="inline-flex items-center gap-1.5 p-1 ps-2 bg-white/95 text-slate-800 text-[11px] font-semibold rounded-lg border border-amber-200 shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setEditingContract(ec)}
                        className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                        title={isAr ? 'عرض وتعديل جدول العقد' : 'View contract schedule'}
                      >
                        <span className="font-mono text-amber-700 font-bold">{ec.contractRef}</span>
                        <span className="text-slate-700 truncate max-w-[120px]">{ec.customerName}</span>
                        <span className={`text-[9px] font-black px-1 rounded ${expInfo?.badgeClass}`}>
                          {isAr ? expInfo?.badgeTextAr : expInfo?.badgeTextEn}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenRenewalEmail) {
                            onOpenRenewalEmail(ec);
                          } else {
                            setRenewalEmailModalContract(ec);
                          }
                        }}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10.5px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                        title={isAr ? 'إرسال بريد عرض تجديد العقد للعميل بالنموذج المعتمد' : 'Send renewal quote email to client'}
                      >
                        <Mail className="w-3 h-3" />
                        <span>{isAr ? 'عرض تجديد' : 'Renewal Email'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
            {expiringContractsList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const firstContract = expiringContractsList[0];
                  if (onOpenRenewalEmail) {
                    onOpenRenewalEmail(firstContract);
                  } else {
                    setRenewalEmailModalContract(firstContract);
                  }
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title={isAr ? 'إرسال بريد عرض التجديد للعميل' : 'Send renewal quotation email'}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isAr ? 'إرسال عرض تجديد' : 'Send Renewal Quote'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveFilterTab(activeFilterTab === 'EXPIRING_SOON' ? 'ALL' : 'EXPIRING_SOON')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer ${
                activeFilterTab === 'EXPIRING_SOON'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {activeFilterTab === 'EXPIRING_SOON'
                  ? (isAr ? 'عرض الكل' : 'All')
                  : (isAr ? 'تصفية المنتهية قريباً' : 'Filter Expiring')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
        {/* Active Contracts Card */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 block truncate">
              {isAr ? 'العقود السارية' : 'Active Contracts'}
            </span>
            <span className="text-base font-black text-slate-900 leading-tight">
              {activeContractsList.length} {isAr ? 'عقد' : 'Ctrs'}
            </span>
          </div>
        </div>

        {/* Expiring Soon Badge KPI Card */}
        <div 
          onClick={() => setActiveFilterTab(activeFilterTab === 'EXPIRING_SOON' ? 'ALL' : 'EXPIRING_SOON')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center gap-2.5 ${
            activeFilterTab === 'EXPIRING_SOON'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40'
              : expiringContractsList.length > 0 
                ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300 hover:bg-amber-50' 
                : 'bg-white border-slate-200'
          }`}
          title={isAr ? 'تصفية العقود المنتهية خلال 30 يوماً' : 'Filter contracts expiring in 30 days'}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            expiringContractsList.length > 0 
              ? 'bg-amber-100 text-amber-700 border border-amber-300' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-600 block truncate">
                {isAr ? 'تنتهي بـ 30 يوم' : 'Expiring in 30d'}
              </span>
              {expiringContractsList.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              )}
            </div>
            <span className="text-base font-black text-amber-800 leading-tight">
              {expiringContractsList.length} {isAr ? 'عقد' : 'Ctrs'}
            </span>
          </div>
        </div>

        {/* Maintenance Revenue Card */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 block truncate">
              {isAr ? 'قيمة العقود' : 'Revenue'}
            </span>
            <span className="text-base font-black text-slate-900 flex items-center gap-0.5 leading-tight truncate">
              {totalContractRevenue.toLocaleString()}
              <SaudiRiyalSymbol className="w-3 h-3 text-emerald-600 shrink-0" />
            </span>
          </div>
        </div>

        {/* Certified Visits Card */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 block truncate">
              {isAr ? 'الزيارات المنفذة' : 'Visits'}
            </span>
            <span className="text-base font-black text-slate-900 leading-tight">
              {totalCompletedVisits} / {totalVisits}
            </span>
          </div>
        </div>

        {/* Upcoming Scheduled Visits Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">
              {isAr ? 'زيارات مجدولة قادمة' : 'Upcoming Scheduled'}
            </span>
            <span className="text-lg font-black text-slate-700">
              {totalUpcomingVisits} {isAr ? 'زيارة' : 'Visits'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Filter: All vs Contracts vs Quotations vs Expiring Soon */}
          {!forcedTab && (
          <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth max-w-full bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200 w-full sm:w-fit whitespace-nowrap">
            <button
              type="button"
              onClick={() => setActiveFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeFilterTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? `الكل (${contracts.length})` : `All (${contracts.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('CONTRACTS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeFilterTab === 'CONTRACTS'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? `العقود السارية (${activeContractsList.length})` : `Active Contracts (${activeContractsList.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('QUOTATIONS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeFilterTab === 'QUOTATIONS'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              {isAr ? `عروض الأسعار (${quotationsList.length})` : `Quotations (${quotationsList.length})`}
            </button>
            {/* 30-Day Expiring Contracts Tab Badge */}
            <button
              type="button"
              onClick={() => setActiveFilterTab('EXPIRING_SOON')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeFilterTab === 'EXPIRING_SOON'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAr ? 'تنتهي قريباً (30 يوم)' : 'Expiring Soon (30d)'}</span>
              {expiringContractsList.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeFilterTab === 'EXPIRING_SOON'
                    ? 'bg-white text-amber-800'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {expiringContractsList.length}
                </span>
              )}
            </button>
          </div>
          )}

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث بالعميل، المرجع، أو الموقع...' : 'Search by client, ref, or location...'}
                className="w-full text-xs ps-9 pe-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="min-w-[150px]">
              <SearchableSelect
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="ALL">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="Active">{isAr ? 'عقد ساري' : 'Active'}</option>
                <option value="Approved">{isAr ? 'معتمد' : 'Approved'}</option>
                <option value="Sent">{isAr ? 'مرسل' : 'Sent'}</option>
                <option value="Draft">{isAr ? 'مسودة' : 'Draft'}</option>
                <option value="Completed">{isAr ? 'منتهي' : 'Completed'}</option>
              </SearchableSelect>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table of Contracts & Quotations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Control Bar for Drag-and-Drop and Sorting Reset */}
        <TableControlBar
          isReordered={contractsTable.isReordered}
          onResetOrder={contractsTable.resetColumnOrder}
          sortKey={contractsTable.sortKey}
          sortDir={contractsTable.sortDir}
          onResetSort={contractsTable.resetSort}
          isAr={isAr}
          totalCount={contractsTable.sortedData.length}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right rtl:text-right ltr:text-left divide-y divide-slate-200">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                {contractsTable.orderedColumns.map((col) => (
                  <InteractiveTableHeader
                    key={col.id}
                    column={col}
                    sortKey={contractsTable.sortKey}
                    sortDir={contractsTable.sortDir}
                    onSort={contractsTable.handleSort}
                    draggedColId={contractsTable.draggedColId}
                    dragOverColId={contractsTable.dragOverColId}
                    onDragStart={contractsTable.handleDragStart}
                    onDragOver={contractsTable.handleDragOver}
                    onDragLeave={contractsTable.handleDragLeave}
                    onDrop={contractsTable.handleDrop}
                    onDragEnd={contractsTable.handleDragEnd}
                    isAr={isAr}
                    theme="dark"
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contractsTable.sortedData.length === 0 ? (
                <tr>
                  <td colSpan={contractsTable.orderedColumns.length} className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm text-slate-600">
                      {isAr ? 'لم يتم العثور على أي عقود أو عروض صيانة' : 'No maintenance contracts or quotations found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAr ? 'انقر على زر «+ إنشاء عقد صيانة جديد» للبدء' : 'Click "+ New Contract" to create your first schedule'}
                    </p>
                  </td>
                </tr>
              ) : (
                contractsTable.sortedData.map((c, rowIdx) => {
                  const expiryInfo = getContractExpiryInfo(c, 30);
                  const isExpSoon = expiryInfo && expiryInfo.isExpiringSoon && c.isContract && c.status === 'Active';

                  return (
                    <tr 
                      key={c.id} 
                      className={`transition-colors group cursor-pointer ${
                        isExpSoon 
                          ? 'bg-amber-50/70 hover:bg-amber-100/80 border-s-4 border-s-amber-500' 
                          : 'hover:bg-blue-50/40'
                      }`}
                      onClick={() => setEditingContract(c)}
                    >
                      {contractsTable.orderedColumns.map((col) => (
                        <td
                          key={col.id}
                          className={`py-3.5 px-4 ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'end'
                              ? 'text-end'
                              : 'text-start'
                          } ${col.className || ''}`}
                        >
                          {col.renderCell(c, rowIdx)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Quotation Email Modal */}
      {renewalEmailModalContract && (
        <RenewalQuotationEmailModal
          isOpen={Boolean(renewalEmailModalContract)}
          contract={renewalEmailModalContract}
          companySettings={companySettings}
          language={language}
          onClose={() => setRenewalEmailModalContract(null)}
          onRenewInSystem={(c) => {
            handleRenewContract(c);
            setRenewalEmailModalContract(null);
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
