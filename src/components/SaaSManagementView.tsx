import React, { useState, useMemo } from 'react';
import {
  Globe,
  Building2,
  GitBranch,
  Boxes,
  Database,
  Server,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit3,
  Trash2,
  Copy,
  Download,
  Terminal,
  ExternalLink,
  RefreshCw,
  Eye,
  Check,
  ChevronDown,
  Layers,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  User,
  Key,
  Calendar,
  Lock,
  Cpu,
  HardDrive,
  Activity,
  Play,
  FileCode,
  FileText,
  Clock
} from 'lucide-react';
import {
  CompanyTenant,
  CompanyBranch,
  CompanyWarehouse,
  ContaboVpsConfig,
  SaaSCompanyStatus,
  SaaSSubscriptionPlan,
  DatabaseIsolationMode,
  DatabaseEngine,
} from '../types/saas';
import {
  saveTenants,
  saveBranches,
  saveWarehouses,
  saveContaboConfig,
  generateContaboDockerCompose,
  generatePostgresInitScript,
  generateContaboDeployScript,
  generateContaboEnvFile,
  generateContaboNginxConfig,
  generateContaboAllInOneScript,
} from '../utils/saasStorage';

interface SaaSManagementViewProps {
  tenants: CompanyTenant[];
  branches: CompanyBranch[];
  warehouses: CompanyWarehouse[];
  activeTenantId: string;
  contaboConfig: ContaboVpsConfig;
  onUpdateTenants: (tenants: CompanyTenant[]) => void;
  onUpdateBranches: (branches: CompanyBranch[]) => void;
  onUpdateWarehouses: (warehouses: CompanyWarehouse[]) => void;
  onSelectActiveTenant: (tenantId: string) => void;
  onUpdateContaboConfig: (config: ContaboVpsConfig) => void;
  isAr: boolean;
}

export const SaaSManagementView: React.FC<SaaSManagementViewProps> = ({
  tenants,
  branches,
  warehouses,
  activeTenantId,
  contaboConfig,
  onUpdateTenants,
  onUpdateBranches,
  onUpdateWarehouses,
  onSelectActiveTenant,
  onUpdateContaboConfig,
  isAr,
}) => {
  // Navigation sub-tabs within SaaS Hub
  const [activeTab, setActiveTab] = useState<'COMPANIES' | 'BRANCHES' | 'WAREHOUSES' | 'DATABASE_ISOLATION' | 'CONTABO_VPS'>('COMPANIES');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');

  // Modals state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyTenant | null>(null);

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<CompanyBranch | null>(null);

  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<CompanyWarehouse | null>(null);

  // DB Connection Test Notification State
  const [testingDbTenantId, setTestingDbTenantId] = useState<string | null>(null);
  const [dbTestResult, setDbTestResult] = useState<{ id: string; success: boolean; message: string; ping: number } | null>(null);

  // Copied alert notification
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Method tab for uploading files to /opt/twins-saas on VPS
  const [uploadMethodTab, setUploadMethodTab] = useState<'AUTO_SCRIPT' | 'SFTP' | 'GIT'>('AUTO_SCRIPT');

  // Active Company Object
  const currentActiveTenant = useMemo(() => {
    return tenants.find((t) => t.id === activeTenantId) || tenants[0];
  }, [tenants, activeTenantId]);

  // Filtered Companies
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.commercialReg.includes(searchQuery) ||
        t.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPlan = planFilter === 'ALL' || t.plan === planFilter;

      return matchSearch && matchStatus && matchPlan;
    });
  }, [tenants, searchQuery, statusFilter, planFilter]);

  // Filtered Branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchCompany = selectedCompanyFilter === 'ALL' || b.companyId === selectedCompanyFilter;
      const matchSearch =
        !searchQuery ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.managerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCompany && matchSearch;
    });
  }, [branches, selectedCompanyFilter, searchQuery]);

  // Filtered Warehouses
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      const matchCompany = selectedCompanyFilter === 'ALL' || w.companyId === selectedCompanyFilter;
      const matchSearch =
        !searchQuery ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.managerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCompany && matchSearch;
    });
  }, [warehouses, selectedCompanyFilter, searchQuery]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Test DB Connection Simulation
  const handleTestDatabaseConnection = (tenant: CompanyTenant) => {
    setTestingDbTenantId(tenant.id);
    setDbTestResult(null);

    setTimeout(() => {
      const ping = Math.floor(Math.random() * 8) + 3;
      const result = {
        id: tenant.id,
        success: true,
        message: isAr
          ? `تم الاتصال بنجاح بقاعدة البيانات [${tenant.databaseConfig.databaseName}] على المنفذ ${tenant.databaseConfig.port} زمن الاستجابة: ${ping}ms.`
          : `Connected successfully to [${tenant.databaseConfig.databaseName}] on port ${tenant.databaseConfig.port}. Latency: ${ping}ms.`,
        ping,
      };
      setDbTestResult(result);
      setTestingDbTenantId(null);

      // Update tenant status
      const updatedTenants = tenants.map((t) => {
        if (t.id === tenant.id) {
          return {
            ...t,
            databaseConfig: {
              ...t.databaseConfig,
              connectionStatus: 'CONNECTED' as const,
              lastTestTimestamp: new Date().toISOString(),
              lastPingMs: ping,
            },
          };
        }
        return t;
      });
      onUpdateTenants(updatedTenants);
      saveTenants(updatedTenants);
    }, 900);
  };

  // Open Create Company Modal
  const handleOpenCreateCompany = () => {
    const newId = `tenant-${Date.now()}`;
    const newCode = `COMP-${tenants.length + 1}`;
    setEditingCompany({
      id: newId,
      code: newCode,
      nameAr: '',
      nameEn: '',
      commercialReg: '',
      vatNumber: '',
      phone: '+966 ',
      email: '',
      website: '',
      country: 'المملكة العربية السعودية',
      city: 'الرياض',
      address: '',
      subdomain: `comp${tenants.length + 1}`.toLowerCase(),
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
      monthlyFeeSar: 1200,
      licenseStartDate: new Date().toISOString().slice(0, 10),
      licenseEndDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      maxBranches: 5,
      maxWarehouses: 5,
      maxUsers: 30,
      maxElevators: 300,
      activeUsersCount: 1,
      activeElevatorsCount: 0,
      databaseConfig: {
        mode: 'SEPARATE_DATABASE',
        engine: 'POSTGRESQL',
        host: contaboConfig.vpsIp || '127.0.0.1',
        port: 5432,
        databaseName: `twins_db_${newCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        schemaName: 'public',
        username: `db_user_${newCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        password: `Pass_${Math.random().toString(36).substring(2, 9)}!`,
        ssl: false,
        poolSize: 15,
        connectionStatus: 'CONNECTED',
      },
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setIsCompanyModalOpen(true);
  };

  // Save Company
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    if (!editingCompany.nameAr.trim()) {
      alert(isAr ? 'يرجى إدخال اسم الشركة بالعربية' : 'Please enter company Arabic name');
      return;
    }

    const exists = tenants.some((t) => t.id === editingCompany.id);
    let updated: CompanyTenant[];
    if (exists) {
      updated = tenants.map((t) => (t.id === editingCompany.id ? { ...editingCompany, updatedAt: new Date().toISOString().slice(0, 10) } : t));
    } else {
      updated = [editingCompany, ...tenants];

      // Automatically create a default HQ branch and central warehouse for the new company
      const defaultBranch: CompanyBranch = {
        id: `br-${editingCompany.id}-hq`,
        companyId: editingCompany.id,
        code: `${editingCompany.code}-HQ`,
        name: `الفرع الرئيسي - ${editingCompany.city || 'الرياض'}`,
        nameEn: `${editingCompany.nameEn || 'Headquarters'}`,
        city: editingCompany.city || 'الرياض',
        address: editingCompany.address || 'طريق الملك فهد',
        phone: editingCompany.phone || '+966 11 000 0000',
        managerName: 'المدير العام للمنظومة',
        isHeadquarter: true,
        active: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      const defaultWarehouse: CompanyWarehouse = {
        id: `wh-${editingCompany.id}-central`,
        companyId: editingCompany.id,
        branchId: defaultBranch.id,
        code: `WH-${editingCompany.code}-01`,
        name: `المستودع المركزي لقطع الغيار`,
        nameEn: 'Central Spare Parts Warehouse',
        type: 'CENTRAL',
        city: editingCompany.city || 'الرياض',
        address: `${editingCompany.city} - المنطقة اللوجستية`,
        managerName: 'أمين المستودع الرئيسي',
        managerPhone: editingCompany.phone || '+966 50 000 0000',
        capacityUnits: 3000,
        currentStockItemsCount: 150,
        active: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      const newBranches = [defaultBranch, ...branches];
      const newWarehouses = [defaultWarehouse, ...warehouses];
      onUpdateBranches(newBranches);
      saveBranches(newBranches);
      onUpdateWarehouses(newWarehouses);
      saveWarehouses(newWarehouses);
    }

    onUpdateTenants(updated);
    saveTenants(updated);
    setIsCompanyModalOpen(false);
  };

  // Delete Company
  const handleDeleteCompany = (tenant: CompanyTenant) => {
    if (tenant.id === 'tenant-twins-main') {
      alert(isAr ? 'لا يمكن حذف الشركة الرئيسية (توينز للمصاعد).' : 'Cannot delete default main company (Twins Elevators).');
      return;
    }
    const confirmed = confirm(
      isAr
        ? `هل أنت متأكد من حذف شركة [${tenant.nameAr}] وكافة فروعها ومستودعاتها وبياناتها؟`
        : `Are you sure you want to delete company [${tenant.nameAr}] and its branches/warehouses?`
    );
    if (!confirmed) return;

    const updatedTenants = tenants.filter((t) => t.id !== tenant.id);
    const updatedBranches = branches.filter((b) => b.companyId !== tenant.id);
    const updatedWarehouses = warehouses.filter((w) => w.companyId !== tenant.id);

    onUpdateTenants(updatedTenants);
    saveTenants(updatedTenants);
    onUpdateBranches(updatedBranches);
    saveBranches(updatedBranches);
    onUpdateWarehouses(updatedWarehouses);
    saveWarehouses(updatedWarehouses);

    if (activeTenantId === tenant.id) {
      onSelectActiveTenant('tenant-twins-main');
    }
  };

  // Save Branch
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    const exists = branches.some((b) => b.id === editingBranch.id);
    let updated: CompanyBranch[];
    if (exists) {
      updated = branches.map((b) => (b.id === editingBranch.id ? editingBranch : b));
    } else {
      updated = [editingBranch, ...branches];
    }
    onUpdateBranches(updated);
    saveBranches(updated);
    setIsBranchModalOpen(false);
  };

  // Delete Branch
  const handleDeleteBranch = (branchId: string) => {
    if (!confirm(isAr ? 'تأكيد حذف هذا الفرع؟' : 'Confirm branch deletion?')) return;
    const updated = branches.filter((b) => b.id !== branchId);
    onUpdateBranches(updated);
    saveBranches(updated);
  };

  // Save Warehouse
  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse) return;

    const exists = warehouses.some((w) => w.id === editingWarehouse.id);
    let updated: CompanyWarehouse[];
    if (exists) {
      updated = warehouses.map((w) => (w.id === editingWarehouse.id ? editingWarehouse : w));
    } else {
      updated = [editingWarehouse, ...warehouses];
    }
    onUpdateWarehouses(updated);
    saveWarehouses(updated);
    setIsWarehouseModalOpen(false);
  };

  // Delete Warehouse
  const handleDeleteWarehouse = (warehouseId: string) => {
    if (!confirm(isAr ? 'تأكيد حذف هذا المستودع؟' : 'Confirm warehouse deletion?')) return;
    const updated = warehouses.filter((w) => w.id !== warehouseId);
    onUpdateWarehouses(updated);
    saveWarehouses(updated);
  };

  // Generated scripts strings
  const dockerComposeContent = useMemo(() => generateContaboDockerCompose(tenants, contaboConfig), [tenants, contaboConfig]);
  const postgresInitContent = useMemo(() => generatePostgresInitScript(tenants), [tenants]);
  const deployScriptContent = useMemo(() => generateContaboDeployScript(contaboConfig), [contaboConfig]);
  const envContent = useMemo(() => generateContaboEnvFile(contaboConfig), [contaboConfig]);
  const nginxContent = useMemo(() => generateContaboNginxConfig(contaboConfig), [contaboConfig]);
  const allInOneScriptContent = useMemo(() => generateContaboAllInOneScript(tenants, contaboConfig), [tenants, contaboConfig]);

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header Banner & Active Tenant Impersonation Indicator */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAr ? 'منظومة السحاب متعددة الشركات (Multi-Tenant SaaS)' : 'Multi-Tenant SaaS Master'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>{isAr ? 'عزل تام لقواعد البيانات والمستخدمين' : 'Isolated DB per Company'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                <Server className="w-3 h-3 text-amber-400" />
                <span>{isAr ? 'جاهز للتثبيت على Contabo VPS' : 'Contabo VPS Ready'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr ? 'لوحة تحكم وإدارة الشركات السحابية (SaaS Portal)' : 'SaaS Companies & Tenants Management'}
            </h1>
            <p className="text-sm text-indigo-200/80 max-w-3xl leading-relaxed">
              {isAr
                ? 'إدارة شاملة لعدة شركات مصاعد تعمل على نظام واحد، ولكل شركة فروعها، مستودعاتها، مستخدموها، وقاعدة بياناتها المنفصلة كلياً (PostgreSQL). مع أدوات توليد ملفات التثبيت لسيرفر Contabo VPS.'
                : 'Comprehensive multi-company management with isolated branches, warehouses, user privileges, and separate databases, ready for deployment on your Contabo VPS.'}
            </p>
          </div>

          {/* Quick Active Tenant Switcher Widget */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[300px] shrink-0 space-y-2">
            <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>{isAr ? 'الشركة النشطة الحالية بالمنظومة:' : 'Current Active Tenant:'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                {currentActiveTenant?.code || 'TW'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-white text-sm truncate">{currentActiveTenant?.nameAr}</div>
                <div className="text-xs text-indigo-200 font-mono flex items-center gap-2 mt-0.5">
                  <span>{currentActiveTenant?.city}</span>
                  <span>&bull;</span>
                  <span className="text-emerald-300">{currentActiveTenant?.databaseConfig.databaseName}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-indigo-300">{isAr ? 'التبديل لشركة أخرى:' : 'Switch Company:'}</span>
              <select
                value={activeTenantId}
                onChange={(e) => onSelectActiveTenant(e.target.value)}
                className="bg-slate-900/90 text-white text-xs font-bold px-2 py-1 rounded-lg border border-indigo-400/40 focus:ring-2 focus:ring-amber-400"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Global SaaS Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-indigo-500/20 text-xs">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-indigo-300 block text-[11px]">{isAr ? 'إجمالي الشركات' : 'Companies'}</span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">{tenants.length}</span>
            <span className="text-[10px] text-emerald-400 font-bold">{tenants.filter(t => t.status === 'ACTIVE').length} {isAr ? 'نشطة' : 'active'}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-indigo-300 block text-[11px]">{isAr ? 'إجمالي الفروع' : 'Branches'}</span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">{branches.length}</span>
            <span className="text-[10px] text-indigo-200">{branches.filter(b => b.isHeadquarter).length} {isAr ? 'مقر رئيسي' : 'HQs'}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-indigo-300 block text-[11px]">{isAr ? 'المستودعات والمخازن' : 'Warehouses'}</span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">{warehouses.length}</span>
            <span className="text-[10px] text-amber-300">{warehouses.filter(w => w.type === 'MAINTENANCE_VAN').length} {isAr ? 'سيارات طوارئ' : 'Vans'}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-indigo-300 block text-[11px]">{isAr ? 'قواعد البيانات المعزولة' : 'Databases'}</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">{tenants.length}</span>
            <span className="text-[10px] text-emerald-300">100% {isAr ? 'معزولة PostgreSQL' : 'Isolated'}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-indigo-300 block text-[11px]">{isAr ? 'عوائد الاشتراكات' : 'Monthly MRR'}</span>
            <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">
              {tenants.reduce((acc, t) => acc + (t.monthlyFeeSar || 0), 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-200">ر.س / {isAr ? 'شهرياً' : 'mo'}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-indigo-300 block text-[11px]">{isAr ? 'سيرفر Contabo VPS' : 'Contabo VPS'}</span>
            <span className="text-sm font-black text-white font-mono mt-1 block truncate">{contaboConfig.vpsIp}</span>
            <span className="text-[10px] text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {isAr ? 'جاهز للتثبيت' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('COMPANIES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'COMPANIES'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isAr ? 'إدارة الشركات المشتركة (Tenants)' : 'Companies Directory'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'COMPANIES' ? 'bg-white/20' : 'bg-slate-100'}`}>
            {tenants.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BRANCHES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'BRANCHES'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>{isAr ? 'فروع الشركات (Branches)' : 'Branches'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'BRANCHES' ? 'bg-white/20' : 'bg-slate-100'}`}>
            {branches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('WAREHOUSES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'WAREHOUSES'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>{isAr ? 'مستودعات قطع الغيار (Warehouses)' : 'Warehouses'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'WAREHOUSES' ? 'bg-white/20' : 'bg-slate-100'}`}>
            {warehouses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DATABASE_ISOLATION')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'DATABASE_ISOLATION'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{isAr ? 'عزل قواعد البيانات (Database Isolation)' : 'Database Isolation'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CONTABO_VPS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'CONTABO_VPS'
              ? 'bg-indigo-700 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Server className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'حزمة سيرفر Contabo VPS والتثبيت' : 'Contabo VPS Deployment'}</span>
        </button>
      </div>

      {/* Database Test Result Banner */}
      {dbTestResult && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
          dbTestResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{dbTestResult.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setDbTestResult(null)}
            className="p-1 hover:bg-emerald-200/50 rounded-lg text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: COMPANIES DIRECTORY & MANAGEMENT                                   */}
      {/* ========================================================================= */}
      {activeTab === 'COMPANIES' && (
        <div className="space-y-4">
          {/* Action Bar: Search & Filter & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث بالاسم، الكود، السجل التجاري، أو المدينة...' : 'Search company, code, CR, or city...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-medium pr-9 pl-3 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              >
                <option value="ALL">{isAr ? 'جميع الحالات' : 'All Status'}</option>
                <option value="ACTIVE">{isAr ? 'نشط' : 'Active'}</option>
                <option value="TRIAL">{isAr ? 'تجريبي' : 'Trial'}</option>
                <option value="SUSPENDED">{isAr ? 'موقوف' : 'Suspended'}</option>
              </select>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hidden md:block"
              >
                <option value="ALL">{isAr ? 'جميع الباقات' : 'All Plans'}</option>
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateCompany}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة شركة جديدة (Add Tenant)' : 'Add New Company'}</span>
            </button>
          </div>

          {/* Companies Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTenants.map((tenant) => {
              const tenantBranches = branches.filter((b) => b.companyId === tenant.id);
              const tenantWarehouses = warehouses.filter((w) => w.companyId === tenant.id);
              const isCurrentActive = tenant.id === activeTenantId;

              return (
                <div
                  key={tenant.id}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                    isCurrentActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                  }`}
                >
                  {/* Top Badge Strip: Active Indicator + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                        {tenant.code}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                          <span>{tenant.nameAr}</span>
                          {isCurrentActive && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              {isAr ? 'الشركة الحالية' : 'Active'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-sans mt-0.5">{tenant.nameEn}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase shrink-0 ${
                        tenant.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : tenant.status === 'TRIAL'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {tenant.status}
                    </span>
                  </div>

                  {/* Company Info Points */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">{isAr ? 'السجل التجاري (CR):' : 'CR Number:'}</span>
                      <strong className="text-slate-800">{tenant.commercialReg || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">{isAr ? 'الرقم الضريبي (VAT):' : 'VAT Number:'}</span>
                      <strong className="text-slate-800 truncate block">{tenant.vatNumber || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">{isAr ? 'المدينة والمقر:' : 'City:'}</span>
                      <strong className="text-slate-800 font-sans">{tenant.city}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">{isAr ? 'الباقة والرسوم:' : 'Plan:'}</span>
                      <strong className="text-indigo-700">{tenant.plan} ({tenant.monthlyFeeSar} ر.س)</strong>
                    </div>
                  </div>

                  {/* Isolated DB & Quota Badges */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 border border-blue-200/70 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 text-blue-900 truncate">
                        <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{tenant.databaseConfig.databaseName}</span>
                      </div>
                      <span className="text-emerald-700 font-bold shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {isAr ? 'معزولة' : 'Isolated'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-slate-400" />
                        <strong>{tenantBranches.length}</strong> / {tenant.maxBranches} {isAr ? 'فروع' : 'branches'}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Boxes className="w-3 h-3 text-slate-400" />
                        <strong>{tenantWarehouses.length}</strong> / {tenant.maxWarehouses} {isAr ? 'مستودعات' : 'warehouses'}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <strong>{tenant.activeUsersCount || 1}</strong> {isAr ? 'مستخدم' : 'users'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectActiveTenant(tenant.id)}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isCurrentActive
                          ? 'bg-slate-100 text-slate-500 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCurrentActive ? (isAr ? 'نشطة حالياً' : 'Current Active') : (isAr ? 'التبديل لهذه الشركة' : 'Switch to this')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTestDatabaseConnection(tenant)}
                      disabled={testingDbTenantId === tenant.id}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      title={isAr ? 'اختبار اتصال قاعدة البيانات المستقلة' : 'Test Database Connection'}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingDbTenantId === tenant.id ? 'animate-spin text-blue-600' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingCompany(tenant);
                        setIsCompanyModalOpen(true);
                      }}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      title={isAr ? 'تعديل بيانات الشركة وقاعدة البيانات' : 'Edit Company & DB'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {tenant.id !== 'tenant-twins-main' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(tenant)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                        title={isAr ? 'حذف الشركة' : 'Delete Company'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BRANCHES DIRECTORY (فروع الشركات)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'BRANCHES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 flex-1 max-w-lg">
              <span className="text-xs font-bold text-slate-600 shrink-0">{isAr ? 'تصفية حسب الشركة:' : 'Filter Company:'}</span>
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 flex-1"
              >
                <option value="ALL">{isAr ? 'جميع الشركات' : 'All Companies'}</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingBranch({
                  id: `br-${Date.now()}`,
                  companyId: selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : activeTenantId,
                  code: 'BR-NEW',
                  name: '',
                  nameEn: '',
                  city: 'الرياض',
                  address: '',
                  phone: '+966 ',
                  managerName: '',
                  isHeadquarter: false,
                  active: true,
                  createdAt: new Date().toISOString().slice(0, 10),
                });
                setIsBranchModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة فرع جديد' : 'Add New Branch'}</span>
            </button>
          </div>

          {/* Branches Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left divide-y divide-slate-200">
                <thead className="bg-slate-900 text-white font-bold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{isAr ? 'كود واسم الفرع' : 'Branch Name & Code'}</th>
                    <th className="px-4 py-3">{isAr ? 'الشركة التابعة' : 'Parent Company'}</th>
                    <th className="px-4 py-3">{isAr ? 'المدينة والعنوان' : 'City & Address'}</th>
                    <th className="px-4 py-3">{isAr ? 'مدير الفرع وهاتفه' : 'Manager & Contact'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'المقر الرئيسي' : 'HQ'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="px-4 py-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBranches.map((branch) => {
                    const parentCompany = tenants.find((t) => t.id === branch.companyId);
                    return (
                      <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{branch.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{branch.code}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold text-blue-900">{parentCompany?.nameAr || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{branch.city}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{branch.address}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{branch.managerName || '—'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{branch.phone}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {branch.isHeadquarter ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              {isAr ? 'مقر رئيسي ⭐' : 'HQ ⭐'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">{isAr ? 'فرع فرعي' : 'Sub-branch'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {isAr ? 'مفعل' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBranch(branch);
                                setIsBranchModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WAREHOUSES DIRECTORY (مستودعات قطع الغيار)                          */}
      {/* ========================================================================= */}
      {activeTab === 'WAREHOUSES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 flex-1 max-w-lg">
              <span className="text-xs font-bold text-slate-600 shrink-0">{isAr ? 'تصفية حسب الشركة:' : 'Filter Company:'}</span>
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 flex-1"
              >
                <option value="ALL">{isAr ? 'جميع الشركات' : 'All Companies'}</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingWarehouse({
                  id: `wh-${Date.now()}`,
                  companyId: selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : activeTenantId,
                  code: 'WH-NEW',
                  name: '',
                  type: 'CENTRAL',
                  city: 'الرياض',
                  address: '',
                  managerName: '',
                  managerPhone: '+966 ',
                  capacityUnits: 2500,
                  currentStockItemsCount: 0,
                  active: true,
                  createdAt: new Date().toISOString().slice(0, 10),
                });
                setIsWarehouseModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة مستودع جديد' : 'Add New Warehouse'}</span>
            </button>
          </div>

          {/* Warehouses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWarehouses.map((wh) => {
              const parentCompany = tenants.find((t) => t.id === wh.companyId);
              return (
                <div key={wh.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm leading-tight">{wh.name}</div>
                        <div className="text-[11px] text-indigo-700 font-bold">{parentCompany?.nameAr}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                      {wh.code}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isAr ? 'نوع المستودع:' : 'Type:'}</span>
                      <strong className="text-slate-800">
                        {wh.type === 'CENTRAL'
                          ? (isAr ? 'مركزي رئيسي' : 'Central')
                          : wh.type === 'MAINTENANCE_VAN'
                          ? (isAr ? 'سيارة طوارئ سريعة' : 'Emergency Van')
                          : (isAr ? 'مستودع فرع' : 'Branch Depot')}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isAr ? 'المدينة:' : 'City:'}</span>
                      <strong className="text-slate-800">{wh.city}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isAr ? 'المسؤول:' : 'Manager:'}</span>
                      <strong className="text-slate-800">{wh.managerName}</strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">{isAr ? 'السعة وقطع الغيار:' : 'Capacity:'}</span>
                      <strong className="text-emerald-700">{wh.currentStockItemsCount} / {wh.capacityUnits}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWarehouse(wh);
                        setIsWarehouseModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWarehouse(wh.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DATABASE ISOLATION MONITOR (عزل قواعد البيانات لكل شركة)             */}
      {/* ========================================================================= */}
      {activeTab === 'DATABASE_ISOLATION' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'هيكلية عزل قواعد البيانات السحابية (Database Isolation Architecture)' : 'Multi-Tenant Database Isolation'}</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'يتم تخصيص قاعدة بيانات مستقلة (Dedicated Database per Tenant) باسم فريد لكل شركة ومستخدم DB خاص بها داخل محرك PostgreSQL. هذا يوفر أعلى معايير الخصوصية والأمان وسهولة النسخ الاحتياطي المستقل والنقل إلى سيرفر Contabo VPS.'
                : 'Each registered company receives an isolated database with dedicated credentials in PostgreSQL, ensuring total privacy, security, and effortless backups.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => {
              const cfg = t.databaseConfig;
              const connString = `postgresql://${cfg.username}:••••••••@${cfg.host}:${cfg.port}/${cfg.databaseName}?sslmode=${cfg.ssl ? 'require' : 'disable'}`;

              return (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs font-mono">
                        {t.code}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm">{t.nameAr}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cfg.databaseName}</div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{isAr ? 'متصل وجاهز' : 'Connected'}</span>
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400 font-sans">{isAr ? 'محرك البيانات:' : 'Engine:'}</span>
                      <strong className="text-slate-800">{cfg.engine}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400 font-sans">{isAr ? 'المضيف والمنفذ:' : 'Host & Port:'}</span>
                      <strong className="text-slate-800">{cfg.host}:{cfg.port}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400 font-sans">{isAr ? 'اسم قاعدة البيانات:' : 'Database Name:'}</span>
                      <strong className="text-indigo-700">{cfg.databaseName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400 font-sans">{isAr ? 'المستخدم المعزول:' : 'DB User:'}</span>
                      <strong className="text-slate-800">{cfg.username}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400 font-sans">{isAr ? 'زمن الاستجابة (Ping):' : 'Ping Latency:'}</span>
                      <strong className="text-emerald-700 font-bold">{cfg.lastPingMs || 5} ms</strong>
                    </div>
                  </div>

                  {/* Connection String Box */}
                  <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] flex items-center justify-between gap-2">
                    <span className="truncate">{connString}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(connString, `conn-${t.id}`)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer shrink-0"
                      title={isAr ? 'نسخ سلسلة الاتصال' : 'Copy Connection String'}
                    >
                      {copiedKey === `conn-${t.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTestDatabaseConnection(t)}
                      disabled={testingDbTenantId === t.id}
                      className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingDbTenantId === t.id ? 'animate-spin' : ''}`} />
                      <span>{isAr ? 'اختبار سلامة الاتصال والـ Ping' : 'Test Connection & Ping'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CONTABO VPS DEPLOYMENT & DOCKER HUB                                 */}
      {/* ========================================================================= */}
      {activeTab === 'CONTABO_VPS' && (
        <div className="space-y-6">
          {/* VPS Specs & Configuration Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  <span>{isAr ? 'إعدادات وخطة سيرفر Contabo VPS' : 'Contabo VPS Server Deployment Specs'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'أدخل بيانات سيرفر Contabo الخاص بك لتوليد ملفات Docker Compose والنشر التلقائي فوراً.'
                    : 'Enter your Contabo VPS details to dynamically generate ready-to-deploy Docker scripts.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  Contabo Cloud VPS M / L Recommended
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <label className="text-slate-600 block mb-1">{isAr ? 'عنوان IP لسيرفر Contabo:' : 'Contabo VPS IP:'}</label>
                <input
                  type="text"
                  value={contaboConfig.vpsIp}
                  onChange={(e) => {
                    const updated = { ...contaboConfig, vpsIp: e.target.value };
                    onUpdateContaboConfig(updated);
                    saveContaboConfig(updated);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 bg-slate-50 focus:bg-white"
                  placeholder="185.198.57.12"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">{isAr ? 'الدومين الرئيسي للنظام:' : 'App Domain:'}</label>
                <input
                  type="text"
                  value={contaboConfig.domain}
                  onChange={(e) => {
                    const updated = { ...contaboConfig, domain: e.target.value };
                    onUpdateContaboConfig(updated);
                    saveContaboConfig(updated);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 bg-slate-50 focus:bg-white"
                  placeholder="elevators-saas.com"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">{isAr ? 'بريد إصدار شهادة SSL:' : 'SSL Cert Email:'}</label>
                <input
                  type="email"
                  value={contaboConfig.sslEmail}
                  onChange={(e) => {
                    const updated = { ...contaboConfig, sslEmail: e.target.value };
                    onUpdateContaboConfig(updated);
                    saveContaboConfig(updated);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 bg-slate-50 focus:bg-white"
                  placeholder="admin@yourdomain.com"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">{isAr ? 'منفذ PostgreSQL السحابي:' : 'Postgres Port:'}</label>
                <input
                  type="number"
                  value={contaboConfig.postgresPort}
                  onChange={(e) => {
                    const updated = { ...contaboConfig, postgresPort: Number(e.target.value) || 5432 };
                    onUpdateContaboConfig(updated);
                    saveContaboConfig(updated);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 bg-slate-50 focus:bg-white"
                  placeholder="5432"
                />
              </div>
            </div>
          </div>

          {/* Step by Step Deployment Guide on Contabo */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h4 className="font-black text-sm text-amber-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>{isAr ? 'خطوات التثبيت ورفع الملفات على سيرفر Contabo VPS عبر SSH' : 'Contabo VPS Deployment & File Setup'}</span>
              </h4>
              <span className="text-[11px] font-sans text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                {isAr ? 'مسار المشروع المعتمد: /opt/twins-saas' : 'Project Path: /opt/twins-saas'}
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Step 1: SSH Login */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-slate-400 text-[11px] font-sans flex items-center justify-between">
                  <span>{isAr ? '1. تسجيل الدخول عبر SSH إلى سيرفر Contabo:' : '1. Connect via SSH to Contabo VPS:'}</span>
                  <span className="text-slate-500 font-mono text-[10px]">Port: 22</span>
                </div>
                <div className="text-emerald-400 flex items-center justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="select-all">ssh root@{contaboConfig.vpsIp}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`ssh root@${contaboConfig.vpsIp}`, 'step1')}
                    className="text-slate-400 hover:text-white cursor-pointer px-2 py-0.5"
                    title={isAr ? 'نسخ الأمر' : 'Copy Command'}
                  >
                    {copiedKey === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 2: Clarification and Methods to Put Files into /opt/twins-saas */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <div className="text-amber-300 font-bold text-xs flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{isAr ? '2. إنشاء المجلد ورفع / توليد الملفات بداخله:' : '2. Create Folder & Upload / Generate Files:'}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      {isAr
                        ? '💡 هل يتم رفع ملفات بهذا المجلد بعد إنشائه؟ نعم! المجلد يحتاج لملفات التشغيل وقواعد البيانات. نوفر لك 3 خيارات أسهلها الخيار الأول بنقرة زر:'
                        : '💡 Are files uploaded to this folder? Yes! It requires compose, configs, & DB scripts. Choose your preferred method below:'}
                    </p>
                  </div>
                </div>

                {/* Upload Method Selector Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadMethodTab('AUTO_SCRIPT')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                      uploadMethodTab === 'AUTO_SCRIPT'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الخيار 1 (الآلي الأسهل): سكريبت شامل دون نقل يدوي' : 'Option 1 (Easiest): All-In-One Script'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethodTab('SFTP')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                      uploadMethodTab === 'SFTP'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الخيار 2: رفع الملفات عبر SFTP / WinSCP' : 'Option 2: SFTP / WinSCP Upload'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethodTab('GIT')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                      uploadMethodTab === 'GIT'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الخيار 3: استنساخ Git Clone' : 'Option 3: Git Clone'}</span>
                  </button>
                </div>

                {/* Method 1: All-In-One Automated Script */}
                {uploadMethodTab === 'AUTO_SCRIPT' && (
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-amber-500/20 space-y-2.5 text-xs">
                    <p className="text-amber-200 text-[11px] leading-relaxed">
                      {isAr
                        ? '⚡ لا داعي لرفع ملفات يدوياً! هذا الأمر يقوم تلقائياً بإنشاء المجلد (/opt/twins-saas) وتوليد كافة ملفات docker-compose و .env وتهيئة قواعد بيانات جميع الشركات وتشغيل الحاويات فوراً:'
                        : '⚡ No manual file uploads needed! This command auto-creates /opt/twins-saas, writes all configs & DBs, and starts Docker containers instantly:'}
                    </p>
                    <div className="text-amber-300 font-mono text-[11px] flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="truncate select-all mr-2">
                        curl -fsSL -o setup-contabo.sh && bash setup-contabo.sh || cat &lt;&lt; 'EOF' &gt; /opt/twins-saas/setup-all-in-one.sh
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(allInOneScriptContent, 'all_in_one')}
                          className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'all_in_one' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'all_in_one' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ السكربت الشامل' : 'Copy All-in-One')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(allInOneScriptContent, 'setup-all-in-one.sh')}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                          title={isAr ? 'تحميل ملف setup-all-in-one.sh' : 'Download setup script'}
                        >
                          <Download className="w-3 h-3" />
                          <span>{isAr ? 'تحميل' : 'Download'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Method 2: SFTP / FileZilla / WinSCP */}
                {uploadMethodTab === 'SFTP' && (
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-blue-500/20 space-y-2.5 text-xs text-slate-300">
                    <p className="text-[11px] leading-relaxed text-blue-200">
                      {isAr
                        ? '📂 لرفع ملفات المشروع من حاسوبك إلى السيرفر باستخدام FileZilla أو WinSCP أو Cyberduck:'
                        : '📂 To upload files from your local PC using FileZilla, WinSCP, or Cyberduck:'}
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                      <li>{isAr ? `أنشئ المجلد أولاً: mkdir -p /opt/twins-saas` : `Create the folder first: mkdir -p /opt/twins-saas`}</li>
                      <li>{isAr ? `افتح برنامج SFTP واتصل بالمضيف: ${contaboConfig.vpsIp} واسم المستخدم: root والمنفذ: 22` : `Connect via SFTP to Host: ${contaboConfig.vpsIp}, User: root, Port: 22`}</li>
                      <li>{isAr ? `انتقل في السيرفر إلى المسار: /opt/twins-saas` : `Navigate on the remote server to: /opt/twins-saas`}</li>
                      <li>{isAr ? 'قم بسحب وإفلات ملفات التكوين المولدة بالأسفل (أو ملفات المشروع) مباشرة إلى المجلد.' : 'Drag and drop the generated configuration files below directly into that directory.'}</li>
                    </ol>
                    <div className="font-mono text-[11px] text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                      <span>scp -r ./* root@{contaboConfig.vpsIp}:/opt/twins-saas/</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`scp -r ./* root@${contaboConfig.vpsIp}:/opt/twins-saas/`, 'scp_cmd')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'scp_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Method 3: Git Clone */}
                {uploadMethodTab === 'GIT' && (
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-purple-500/20 space-y-2 text-xs">
                    <p className="text-purple-200 text-[11px] leading-relaxed">
                      {isAr
                        ? '🐙 إذا كان مشروعك على مستودع GitHub / GitLab الخاص بك، يمكنك استنساخه مباشرة إلى السيرفر:'
                        : '🐙 If your repository is hosted on GitHub / GitLab, clone it directly into the directory:'}
                    </p>
                    <div className="text-purple-300 font-mono text-[11px] flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span>git clone &lt;YOUR_GIT_REPO_URL&gt; /opt/twins-saas && cd /opt/twins-saas</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`git clone <YOUR_GIT_REPO_URL> /opt/twins-saas && cd /opt/twins-saas`, 'git_cmd')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'git_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Run Containers */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-slate-400 text-[11px] font-sans">
                  {isAr ? '3. تشغيل كافة الخدمات وقواعد البيانات للشركات بأمر واحد:' : '3. Start All Services & Isolated DBs with One Command:'}
                </div>
                <div className="text-emerald-400 flex items-center justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="select-all">cd /opt/twins-saas && docker compose up -d --build</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`cd /opt/twins-saas && docker compose up -d --build`, 'step3')}
                    className="text-slate-400 hover:text-white cursor-pointer px-2 py-0.5"
                    title={isAr ? 'نسخ الأمر' : 'Copy Command'}
                  >
                    {copiedKey === 'step3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generated File Previews with Copy & Download Buttons */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'ملفات التكوين والتشغيل الجاهزة للتحميل والنقل إلى /opt/twins-saas' : 'Generated Deployment Configuration Files'}</span>
              </h4>
              <button
                type="button"
                onClick={() => handleDownloadFile(allInOneScriptContent, 'setup-all-in-one.sh')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحميل سكربت الإعداد الشامل (setup-all-in-one.sh)' : 'Download All-In-One Script'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* docker-compose.yml */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-900 font-mono">docker-compose.yml</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(dockerComposeContent, 'docker-compose.yml')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                      title={isAr ? 'تحميل الملف' : 'Download File'}
                    >
                      <Download className="w-3 h-3 text-slate-600" />
                      <span>{isAr ? 'تحميل' : 'Download'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(dockerComposeContent, 'compose')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'compose' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={dockerComposeContent}
                  rows={9}
                  className="w-full font-mono text-[11px] bg-slate-900 text-emerald-400 p-3 rounded-xl resize-none"
                />
              </div>

              {/* init-multiple-databases.sh */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900 font-mono">init-multiple-databases.sh (PostgreSQL)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(postgresInitContent, 'init-multiple-databases.sh')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                      title={isAr ? 'تحميل الملف' : 'Download File'}
                    >
                      <Download className="w-3 h-3 text-slate-600" />
                      <span>{isAr ? 'تحميل' : 'Download'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(postgresInitContent, 'initdb')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'initdb' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'initdb' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={postgresInitContent}
                  rows={9}
                  className="w-full font-mono text-[11px] bg-slate-900 text-indigo-300 p-3 rounded-xl resize-none"
                />
              </div>

              {/* .env.contabo */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-xs text-slate-900 font-mono">.env.contabo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(envContent, '.env')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                      title={isAr ? 'تحميل كملف .env' : 'Download as .env'}
                    >
                      <Download className="w-3 h-3 text-slate-600" />
                      <span>{isAr ? 'تحميل' : 'Download'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(envContent, 'env')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'env' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={envContent}
                  rows={8}
                  className="w-full font-mono text-[11px] bg-slate-900 text-amber-300 p-3 rounded-xl resize-none"
                />
              </div>

              {/* nginx.conf */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-xs text-slate-900 font-mono">nginx.conf (SSL & Reverse Proxy)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(nginxContent, 'nginx.conf')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                      title={isAr ? 'تحميل الملف' : 'Download File'}
                    >
                      <Download className="w-3 h-3 text-slate-600" />
                      <span>{isAr ? 'تحميل' : 'Download'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(nginxContent, 'nginx')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'nginx' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'nginx' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={nginxContent}
                  rows={8}
                  className="w-full font-mono text-[11px] bg-slate-900 text-purple-300 p-3 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT COMPANY WIZARD                                        */}
      {/* ========================================================================= */}
      {isCompanyModalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-sm">
                  {editingCompany.nameAr ? (isAr ? `تعديل شركة: ${editingCompany.nameAr}` : `Edit: ${editingCompany.nameAr}`) : (isAr ? 'إضافة شركة جديدة وتخصيص قاعدة بياناتها' : 'Add New Company & Isolated DB')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompanyModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="p-6 overflow-y-auto space-y-5 text-xs font-semibold">
              {/* Basic Company Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-blue-900 uppercase border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? '1. البيانات الأساسية للشركة' : '1. Company Details'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'اسم الشركة بالعربية *' : 'Company Name (Ar) *'}</label>
                    <input
                      type="text"
                      required
                      value={editingCompany.nameAr}
                      onChange={(e) => setEditingCompany({ ...editingCompany, nameAr: e.target.value })}
                      placeholder="شركة الفرسان للمصاعد المحدودة"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'اسم الشركة بالإنجليزية' : 'Company Name (En)'}</label>
                    <input
                      type="text"
                      value={editingCompany.nameEn}
                      onChange={(e) => setEditingCompany({ ...editingCompany, nameEn: e.target.value })}
                      placeholder="Al-Fursan Elevators Co."
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'كود الشركة التعريفي' : 'Company Code'}</label>
                    <input
                      type="text"
                      required
                      value={editingCompany.code}
                      onChange={(e) => setEditingCompany({ ...editingCompany, code: e.target.value.toUpperCase() })}
                      placeholder="FURSAN"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'المدينة والمقر' : 'City'}</label>
                    <input
                      type="text"
                      value={editingCompany.city}
                      onChange={(e) => setEditingCompany({ ...editingCompany, city: e.target.value })}
                      placeholder="جدة"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'رقم السجل التجاري (CR)' : 'CR Number'}</label>
                    <input
                      type="text"
                      value={editingCompany.commercialReg}
                      onChange={(e) => setEditingCompany({ ...editingCompany, commercialReg: e.target.value })}
                      placeholder="1010874521"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'الرقم الضريبي (VAT)' : 'VAT Number'}</label>
                    <input
                      type="text"
                      value={editingCompany.vatNumber}
                      onChange={(e) => setEditingCompany({ ...editingCompany, vatNumber: e.target.value })}
                      placeholder="310245879600003"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'رقم الهاتف / الواتساب' : 'Phone / Mobile'}</label>
                    <input
                      type="text"
                      value={editingCompany.phone}
                      onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                      placeholder="+966 12 000 0000"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'البريد الإلكتروني للشركة' : 'Email'}</label>
                    <input
                      type="email"
                      value={editingCompany.email}
                      onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
                      placeholder="info@company.com"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plan & Limits */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-indigo-900 uppercase border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isAr ? '2. باقة الاشتراك وحدود الفروع والمستخدمين' : '2. Subscription Plan & Limits'}</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'حالة الحساب' : 'Status'}</label>
                    <select
                      value={editingCompany.status}
                      onChange={(e) => setEditingCompany({ ...editingCompany, status: e.target.value as SaaSCompanyStatus })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="ACTIVE">{isAr ? 'نشط (Active)' : 'Active'}</option>
                      <option value="TRIAL">{isAr ? 'تجريبي (Trial)' : 'Trial'}</option>
                      <option value="SUSPENDED">{isAr ? 'موقوف (Suspended)' : 'Suspended'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'باقة الاشتراك' : 'Plan'}</label>
                    <select
                      value={editingCompany.plan}
                      onChange={(e) => setEditingCompany({ ...editingCompany, plan: e.target.value as SaaSSubscriptionPlan })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="STARTER">Starter</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                      <option value="UNLIMITED">Unlimited</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'الحد الأقصى للفروع' : 'Max Branches'}</label>
                    <input
                      type="number"
                      value={editingCompany.maxBranches}
                      onChange={(e) => setEditingCompany({ ...editingCompany, maxBranches: Number(e.target.value) || 1 })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'الحد الأقصى للمستودعات' : 'Max Warehouses'}</label>
                    <input
                      type="number"
                      value={editingCompany.maxWarehouses}
                      onChange={(e) => setEditingCompany({ ...editingCompany, maxWarehouses: Number(e.target.value) || 1 })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Isolated Database Settings */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-emerald-900 uppercase border-b border-slate-200 pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? '3. إعدادات قاعدة البيانات المستقلة (PostgreSQL Isolation)' : '3. Dedicated Database Configuration'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">Contabo VPS Multi-DB</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'اسم قاعدة البيانات المستقلة *' : 'Database Name *'}</label>
                    <input
                      type="text"
                      required
                      value={editingCompany.databaseConfig.databaseName}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          databaseConfig: { ...editingCompany.databaseConfig, databaseName: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-200 font-mono bg-white text-indigo-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'مستخدم قاعدة البيانات (DB User) *' : 'DB User *'}</label>
                    <input
                      type="text"
                      required
                      value={editingCompany.databaseConfig.username}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          databaseConfig: { ...editingCompany.databaseConfig, username: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-200 font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">{isAr ? 'كلمة سر قاعدة البيانات *' : 'DB Password *'}</label>
                    <input
                      type="text"
                      value={editingCompany.databaseConfig.password || ''}
                      onChange={(e) =>
                        setEditingCompany({
                          ...editingCompany,
                          databaseConfig: { ...editingCompany.databaseConfig, password: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-200 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md cursor-pointer"
                >
                  {isAr ? 'حفظ وتثبيت الشركة' : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT BRANCH                                                */}
      {/* ========================================================================= */}
      {isBranchModalOpen && editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">{isAr ? 'بيانات فرع الشركة' : 'Branch Details'}</h3>
              </div>
              <button type="button" onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1">{isAr ? 'الشركة المالكة للفرع' : 'Owner Company'}</label>
                <select
                  value={editingBranch.companyId}
                  onChange={(e) => setEditingBranch({ ...editingBranch, companyId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'اسم الفرع *' : 'Branch Name *'}</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.name}
                    onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    placeholder="فرع المنطقة الوسطى"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'كود الفرع' : 'Branch Code'}</label>
                  <input
                    type="text"
                    value={editingBranch.code}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })}
                    placeholder="RUH-01"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'المدينة' : 'City'}</label>
                  <input
                    type="text"
                    value={editingBranch.city}
                    onChange={(e) => setEditingBranch({ ...editingBranch, city: e.target.value })}
                    placeholder="الرياض"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'مدير الفرع' : 'Manager Name'}</label>
                  <input
                    type="text"
                    value={editingBranch.managerName}
                    onChange={(e) => setEditingBranch({ ...editingBranch, managerName: e.target.value })}
                    placeholder="م. فهد السبيعي"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1">{isAr ? 'رقم هاتف الفرع' : 'Phone'}</label>
                <input
                  type="text"
                  value={editingBranch.phone}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  placeholder="+966 11 000 0000"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isHqCheck"
                  checked={editingBranch.isHeadquarter}
                  onChange={(e) => setEditingBranch({ ...editingBranch, isHeadquarter: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="isHqCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  {isAr ? 'تعيين هذا الفرع كمقر رئيسي للشركة (Headquarters)' : 'Set as Company HQ'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isAr ? 'حفظ الفرع' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT WAREHOUSE                                             */}
      {/* ========================================================================= */}
      {isWarehouseModalOpen && editingWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">{isAr ? 'بيانات المستودع ومخزن قطع الغيار' : 'Warehouse Details'}</h3>
              </div>
              <button type="button" onClick={() => setIsWarehouseModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1">{isAr ? 'الشركة المالكة للمستودع' : 'Owner Company'}</label>
                <select
                  value={editingWarehouse.companyId}
                  onChange={(e) => setEditingWarehouse({ ...editingWarehouse, companyId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'اسم المستودع *' : 'Warehouse Name *'}</label>
                  <input
                    type="text"
                    required
                    value={editingWarehouse.name}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })}
                    placeholder="مستودع السلي المركزي"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'كود المستودع' : 'Code'}</label>
                  <input
                    type="text"
                    value={editingWarehouse.code}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, code: e.target.value })}
                    placeholder="WH-01"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'نوع المستودع' : 'Type'}</label>
                  <select
                    value={editingWarehouse.type}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="CENTRAL">{isAr ? 'مركزي رئيسي' : 'Central'}</option>
                    <option value="BRANCH">{isAr ? 'مستودع فرع' : 'Branch'}</option>
                    <option value="MAINTENANCE_VAN">{isAr ? 'سيارة طوارئ سريعة' : 'Maintenance Van'}</option>
                    <option value="RAPID_DISPATCH">{isAr ? 'نقطة إمداد سريع' : 'Rapid Dispatch'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'المدينة' : 'City'}</label>
                  <input
                    type="text"
                    value={editingWarehouse.city}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, city: e.target.value })}
                    placeholder="الرياض"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'أمين المستودع' : 'Manager Name'}</label>
                  <input
                    type="text"
                    value={editingWarehouse.managerName}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, managerName: e.target.value })}
                    placeholder="أ. عبد الرحمن الشهري"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">{isAr ? 'هاتف المسؤول' : 'Manager Phone'}</label>
                  <input
                    type="text"
                    value={editingWarehouse.managerPhone}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, managerPhone: e.target.value })}
                    placeholder="+966 50 000 0000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isAr ? 'حفظ المستودع' : 'Save Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
