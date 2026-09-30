import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  Printer, 
  FileDown, 
  ExternalLink, 
  Building2, 
  Clock, 
  MapPin, 
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Boxes,
  FileCheck,
  AlertTriangle,
  Layers,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { ElevatorSpecification, ProjectStatus } from '../types/elevator';
import { MaintenanceContract, MaintenanceBreakdown } from '../types/maintenance';
import { InventoryItem } from '../types/inventory';
import { NavTab } from '../types/navigation';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';

export interface GlobalSearchBarProps {
  projects: ElevatorSpecification[];
  language: AppLanguage;
  onSelectProject: (project: ElevatorSpecification, targetTab?: 'WIZARD' | 'PRINT' | 'DRAWINGS') => void;
  onExportProjectPdf?: (project: ElevatorSpecification) => void;
  className?: string;
  maintenanceContracts?: MaintenanceContract[];
  breakdowns?: MaintenanceBreakdown[];
  inventory?: InventoryItem[];
  onNavigateTab?: (tab: NavTab) => void;
  onSelectBreakdown?: (breakdown: MaintenanceBreakdown) => void;
  onSelectContract?: (contract: MaintenanceContract) => void;
  onSelectInventoryItem?: (item: InventoryItem) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { bg: string; text: string; labelAr: string; labelEn: string }> = {
  Draft: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', labelAr: 'مسودة', labelEn: 'Draft' },
  Sent: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', labelAr: 'مرسل للعميل', labelEn: 'Sent' },
  Approved: { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800', labelAr: 'معتمد', labelEn: 'Approved' },
  Won: { bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800', labelAr: 'رابح ومنفذ', labelEn: 'Won' },
  Installed: { bg: 'bg-teal-50 border-teal-300', text: 'text-teal-800', labelAr: 'تم التركيب', labelEn: 'Installed' },
  Lost: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', labelAr: 'مستبعد', labelEn: 'Lost' },
};

// Normalize Arabic text for smart flexible search
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove tatweel / diacritics
    .trim();
}

interface QuickNavItem {
  id: NavTab;
  labelAr: string;
  labelEn: string;
  keywords: string[];
  icon: React.ElementType;
  badgeAr: string;
  badgeEn: string;
}

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { id: 'WIZARD', labelAr: 'حاسبة ومواصفات المصعد', labelEn: 'Quotation Wizard & Specs', keywords: ['حاسبة', 'مواصفات', 'عرض', 'سعر', 'جديد', 'wizard', 'quote'], icon: FileText, badgeAr: 'المبيعات', badgeEn: 'Sales' },
  { id: 'DRAWINGS', labelAr: 'المخططات الهندسية ونظام التعليق CAD', labelEn: 'CAD Engineering Drawings', keywords: ['مخطط', 'رسم', 'cad', 'drawings', 'هندسة', 'بئر', 'كابينة'], icon: Layers, badgeAr: 'الهندسة', badgeEn: 'Engineering' },
  { id: 'CUSTOMERS', labelAr: 'سجل وإدارة العملاء CRM', labelEn: 'Customers Directory CRM', keywords: ['عميل', 'عملاء', 'زبائن', 'هاتف', 'customers', 'crm'], icon: Users, badgeAr: 'CRM', badgeEn: 'CRM' },
  { id: 'SALES_QUOTATIONS', labelAr: 'سجل عروض الأسعار', labelEn: 'Sales Quotations Hub', keywords: ['عروض', 'عقد', 'مبيعات', 'quotations', 'sales'], icon: FileText, badgeAr: 'المبيعات', badgeEn: 'Sales' },
  { id: 'MAINTENANCE_CONTRACTS', labelAr: 'عقود الصيانة السارية', labelEn: 'Active Maintenance Contracts', keywords: ['عقد صيانة', 'عقود', 'تجديد', 'contracts', 'maintenance'], icon: FileCheck, badgeAr: 'الصيانة', badgeEn: 'Maintenance' },
  { id: 'MAINTENANCE_BREAKDOWNS', labelAr: 'إدارة بلاغات الأعطال والطوارئ', labelEn: 'Emergency Breakdowns Dispatch', keywords: ['عطل', 'بلاغ', 'طوارئ', 'أعطال', 'فني', 'breakdown', 'emergency'], icon: AlertTriangle, badgeAr: 'الطوارئ', badgeEn: 'Emergency' },
  { id: 'MAINTENANCE_SCHEDULES', labelAr: 'جدول زيارات الصيانة الدورية', labelEn: 'Maintenance Visit Schedules', keywords: ['زيارات', 'جدول', 'صيانة دورية', 'schedules', 'visits'], icon: Clock, badgeAr: 'الميدان', badgeEn: 'Field' },
  { id: 'INVENTORY', labelAr: 'المستودع وقطع الغيار والموردين', labelEn: 'Warehouse, Parts & Vendors', keywords: ['مستودع', 'قطع غيار', 'مخزون', 'موردين', 'رصيد', 'inventory', 'parts', 'warehouse'], icon: Boxes, badgeAr: 'المستودع', badgeEn: 'Warehouse' },
  { id: 'EMPLOYEES', labelAr: 'شؤون الموظفين والمناديب', labelEn: 'Employees & HR Dashboard', keywords: ['موظف', 'موظفين', 'مناديب', 'حضور', 'employees', 'hr'], icon: Users, badgeAr: 'HR', badgeEn: 'HR' },
  { id: 'SETTINGS', labelAr: 'إعدادات الشركة والتسعير والنسخ الاحتياطي', labelEn: 'Settings & Branding & Backup', keywords: ['إعدادات', 'شركة', 'تسعير', 'نسخ احتياطي', 'واتساب', 'شعار', 'settings', 'backup'], icon: Sparkles, badgeAr: 'النظام', badgeEn: 'System' },
];

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  projects,
  language,
  onSelectProject,
  onExportProjectPdf,
  className = '',
  maintenanceContracts = [],
  breakdowns = [],
  inventory = [],
  onNavigateTab,
  onSelectBreakdown,
  onSelectContract,
  onSelectInventoryItem,
}) => {
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'PROJECTS' | 'MAINTENANCE' | 'INVENTORY' | 'PAGES'>('ALL');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setIsMobileExpanded(true);
          setIsOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
          setIsOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsMobileExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter projects by client name, project ID, or quotation reference number
  const projectResults = useMemo(() => {
    const q = normalizeArabic(query);
    if (!q) return projects.slice(0, 4);

    return projects.filter((p) => {
      const matchQuoteRef = normalizeArabic(p.quoteRef || '').includes(q);
      const matchId = normalizeArabic(p.id || '').includes(q);
      const matchClientName = normalizeArabic(p.clientName || '').includes(q);
      const matchProjectName = normalizeArabic(p.projectName || '').includes(q);
      const matchPhone = (p.clientPhone || '').includes(q);
      const matchLocation = normalizeArabic(p.siteLocation || '').includes(q);

      return (
        matchQuoteRef ||
        matchId ||
        matchClientName ||
        matchProjectName ||
        matchPhone ||
        matchLocation
      );
    }).slice(0, 5);
  }, [projects, query]);

  // Filter maintenance contracts
  const contractResults = useMemo(() => {
    if (!maintenanceContracts.length) return [];
    const q = normalizeArabic(query);
    if (!q) return maintenanceContracts.slice(0, 2);

    return maintenanceContracts.filter((c) => {
      const matchNum = normalizeArabic(c.contractNumber || '').includes(q);
      const matchClient = normalizeArabic(c.customerName || '').includes(q);
      const matchElevator = normalizeArabic(c.elevatorName || '').includes(q);
      const matchPhone = (c.customerPhone || '').includes(q);
      const matchLocation = normalizeArabic(c.siteLocation || '').includes(q);
      return matchNum || matchClient || matchElevator || matchPhone || matchLocation;
    }).slice(0, 3);
  }, [maintenanceContracts, query]);

  // Filter emergency breakdowns
  const breakdownResults = useMemo(() => {
    if (!breakdowns.length) return [];
    const q = normalizeArabic(query);
    if (!q) return breakdowns.slice(0, 2);

    return breakdowns.filter((b) => {
      const matchElevator = normalizeArabic(b.elevatorName || '').includes(q);
      const matchClient = normalizeArabic(b.customerName || '').includes(q);
      const matchDesc = normalizeArabic(b.description || '').includes(q);
      const matchPhone = (b.customerPhone || '').includes(q);
      return matchElevator || matchClient || matchDesc || matchPhone;
    }).slice(0, 3);
  }, [breakdowns, query]);

  // Filter inventory items
  const inventoryResults = useMemo(() => {
    if (!inventory.length) return [];
    const q = normalizeArabic(query);
    if (!q) return [];

    return inventory.filter((item) => {
      const matchSku = normalizeArabic(item.sku || '').includes(q);
      const matchAr = normalizeArabic(item.nameAr || '').includes(q);
      const matchEn = normalizeArabic(item.nameEn || '').includes(q);
      const matchSpec = normalizeArabic(item.specification || '').includes(q);
      return matchSku || matchAr || matchEn || matchSpec;
    }).slice(0, 3);
  }, [inventory, query]);

  // Filter quick nav pages
  const navResults = useMemo(() => {
    const q = normalizeArabic(query);
    if (!q) return QUICK_NAV_ITEMS.slice(0, 4);

    return QUICK_NAV_ITEMS.filter((item) => {
      const matchAr = normalizeArabic(item.labelAr).includes(q);
      const matchEn = normalizeArabic(item.labelEn).includes(q);
      const matchKey = item.keywords.some((k) => normalizeArabic(k).includes(q));
      return matchAr || matchEn || matchKey;
    });
  }, [query]);

  // Total results count
  const totalResultsCount = projectResults.length + contractResults.length + breakdownResults.length + inventoryResults.length + navResults.length;

  const handleOpenProject = (project: ElevatorSpecification, tab: 'WIZARD' | 'PRINT' | 'DRAWINGS' = 'PRINT') => {
    onSelectProject(project, tab);
    setIsOpen(false);
    setIsMobileExpanded(false);
  };

  const handleDirectExportPdf = (e: React.MouseEvent, project: ElevatorSpecification) => {
    e.stopPropagation();
    if (onExportProjectPdf) {
      onExportProjectPdf(project);
    } else {
      onSelectProject(project, 'PRINT');
    }
    setIsOpen(false);
  };

  const handleNavigateToTab = (tab: NavTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
    setIsOpen(false);
    setIsMobileExpanded(false);
  };

  const handleOpenBreakdown = (breakdown: MaintenanceBreakdown) => {
    if (onSelectBreakdown) {
      onSelectBreakdown(breakdown);
    } else if (onNavigateTab) {
      onNavigateTab('MAINTENANCE_BREAKDOWNS');
    }
    setIsOpen(false);
    setIsMobileExpanded(false);
  };

  const handleOpenContract = (contract: MaintenanceContract) => {
    if (onSelectContract) {
      onSelectContract(contract);
    } else if (onNavigateTab) {
      onNavigateTab('MAINTENANCE_CONTRACTS');
    }
    setIsOpen(false);
    setIsMobileExpanded(false);
  };

  const handleOpenInventory = (item: InventoryItem) => {
    if (onSelectInventoryItem) {
      onSelectInventoryItem(item);
    } else if (onNavigateTab) {
      onNavigateTab('INVENTORY');
    }
    setIsOpen(false);
    setIsMobileExpanded(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* 1. Mobile Search Trigger Icon Button */}
      <div className="sm:hidden flex items-center">
        <button
          type="button"
          onClick={() => {
            setIsMobileExpanded(true);
            setIsOpen(true);
            setTimeout(() => mobileInputRef.current?.focus(), 150);
          }}
          className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title={isAr ? 'البحث العام والتنقل السريع (Ctrl+K)' : 'Global Search & Quick Access (Ctrl+K)'}
        >
          <Search className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* 2. Desktop Search Input Bar */}
      <div 
        className={`hidden sm:flex relative items-center h-10 w-full min-w-[220px] max-w-lg rounded-xl transition-all duration-200 ${
          isOpen && !isMobileExpanded
            ? 'bg-[#08172F] border-amber-400 shadow-md ring-2 ring-amber-400/20'
            : 'bg-[#122A54]/80 hover:bg-[#122A54] border-[#1E437E]'
        } border`}
      >
        <div className="ps-3 pe-2 flex items-center pointer-events-none text-amber-400 shrink-0">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            isAr
              ? 'بحث ذكي: عميل، مشروع، عطل، صيانة، صنف، أو قسم...'
              : 'Search client, project, breakdown, contract, parts...'
          }
          className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-blue-200/50 focus:outline-hidden pe-8"
        />

        {/* Clear Button or Keyboard Shortcut Indicator */}
        <div className="pe-2.5 flex items-center gap-1.5 shrink-0">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-blue-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isAr ? 'مسح البحث' : 'Clear search'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-blue-200/60 bg-[#0A1D3D] rounded border border-blue-900/80 shadow-2xs select-none">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* 3. Mobile Full-Width Expanded Search Overlay */}
      {isMobileExpanded && (
        <div className="sm:hidden fixed inset-x-0 top-0 z-50 bg-[#0B1E3B] p-2.5 shadow-2xl border-b border-[#16335C] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center h-10 rounded-xl bg-[#08172F] border border-amber-400 shadow-sm ring-2 ring-amber-400/20">
              <div className="ps-3 pe-2 text-amber-400 shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!isOpen) setIsOpen(true);
                }}
                placeholder={
                  isAr
                    ? 'بحث سريع بالعميل، المشروع، أو العرض...'
                    : 'Search client, project, quote...'
                }
                className="w-full bg-transparent text-white text-xs placeholder:text-blue-200/50 focus:outline-hidden pe-2"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    mobileInputRef.current?.focus();
                  }}
                  className="pe-2.5 text-blue-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMobileExpanded(false);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl shrink-0 transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Dropdown Results Palette */}
      {isOpen && (
        <div 
          className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150 text-slate-800 ${
            isMobileExpanded
              ? 'fixed inset-x-2 top-16 max-h-[75vh]'
              : 'hidden sm:block absolute start-0 end-0 top-full mt-2'
          }`}
          style={{ maxHeight: isMobileExpanded ? 'calc(80vh - 65px)' : 'min(520px, 80vh)' }}
        >
          {/* Header filter strip */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth max-w-full py-0.5">
              <button
                type="button"
                onClick={() => setActiveCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  activeCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('PROJECTS')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  activeCategory === 'PROJECTS'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? 'المشاريع والعروض' : 'Projects'} ({projectResults.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('MAINTENANCE')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  activeCategory === 'MAINTENANCE'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? 'الصيانة والأعطال' : 'Maintenance'} ({contractResults.length + breakdownResults.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('INVENTORY')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  activeCategory === 'INVENTORY'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? 'المستودع' : 'Inventory'} ({inventoryResults.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('PAGES')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  activeCategory === 'PAGES'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? 'التنقل السريع' : 'Shortcuts'} ({navResults.length})
              </button>
            </div>

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              {query ? (isAr ? 'نتائج فورية' : 'Instant search') : (isAr ? 'الوصول السريع' : 'Quick access')}
            </span>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto max-h-[390px] divide-y divide-slate-100">
            {totalResultsCount === 0 ? (
              <div className="py-10 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {isAr ? 'لم يتم العثور على أي نتائج تطابق البحث' : 'No matching records found'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  {isAr
                    ? 'جرّب البحث باسم العميل، كود المشروع، عطل، أو اسم قطعة غيار'
                    : 'Try searching by customer, project, breakdown, or part name'}
                </p>
              </div>
            ) : (
              <>
                {/* 1. Quick Navigation Shortcuts Section */}
                {(activeCategory === 'ALL' || activeCategory === 'PAGES') && navResults.length > 0 && (
                  <div className="p-2.5 bg-slate-50/50">
                    <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 px-1">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isAr ? 'التنقل السريع المباشر للأقسام:' : 'Quick Navigation Shortcuts:'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {navResults.map((nav) => {
                        const Icon = nav.icon;
                        return (
                          <div
                            key={nav.id}
                            onClick={() => handleNavigateToTab(nav.id)}
                            className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                                {isAr ? nav.labelAr : nav.labelEn}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                              {isAr ? nav.badgeAr : nav.badgeEn}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Projects & Quotations Section */}
                {(activeCategory === 'ALL' || activeCategory === 'PROJECTS') && projectResults.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 bg-slate-100/70 py-1.5 px-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isAr ? 'مشاريع وعروض الأسعار' : 'Projects & Proposals'}</span>
                      </span>
                      <span className="text-[10px] font-mono">{projectResults.length}</span>
                    </div>

                    {projectResults.map((proj) => {
                      const statusInfo = STATUS_CONFIG[proj.status] || STATUS_CONFIG.Draft;
                      return (
                        <div
                          key={proj.id}
                          onClick={() => handleOpenProject(proj, 'PRINT')}
                          className="p-3 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/50"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300 tracking-wider shrink-0">
                                {proj.quoteRef || proj.id}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.text}`}>
                                {isAr ? statusInfo.labelAr : statusInfo.labelEn}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                                {proj.clientName}
                              </span>
                              {proj.projectName && proj.projectName !== proj.clientName && (
                                <span className="text-xs text-slate-500 font-medium truncate">
                                  • {proj.projectName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                              {proj.siteLocation && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span className="truncate max-w-[150px]">{proj.siteLocation}</span>
                                </span>
                              )}
                              {proj.totalQuotationPrice && (
                                <span className="font-bold text-slate-800 font-mono">
                                  {proj.totalQuotationPrice.toLocaleString()} <SaudiRiyalSymbol className="w-2.5 h-2.5 inline text-emerald-600" />
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 justify-end pt-1 sm:pt-0">
                            <button
                              type="button"
                              onClick={(e) => handleDirectExportPdf(e, proj)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                              title={isAr ? 'تصدير PDF' : 'PDF'}
                            >
                              <FileDown className="w-3 h-3 text-rose-600 group-hover:text-white" />
                              <span className="text-[10px]">PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProject(proj, 'PRINT');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold border border-blue-200 transition-all cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-blue-600 group-hover:text-white" />
                              <span className="text-[10px]">{isAr ? 'عرض' : 'View'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Maintenance Contracts & Breakdowns Section */}
                {(activeCategory === 'ALL' || activeCategory === 'MAINTENANCE') && (contractResults.length > 0 || breakdownResults.length > 0) && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 bg-slate-100/70 py-1.5 px-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isAr ? 'عمليات الصيانة وبلاغات الأعطال' : 'Maintenance & Breakdowns'}</span>
                      </span>
                      <span className="text-[10px] font-mono">{contractResults.length + breakdownResults.length}</span>
                    </div>

                    {/* Breakdowns */}
                    {breakdownResults.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleOpenBreakdown(b)}
                        className="p-3 transition-colors cursor-pointer group flex items-center justify-between gap-3 hover:bg-amber-50/40"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              {isAr ? 'بلاغ عطل' : 'Breakdown'}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {b.elevatorName}
                            </span>
                            <span className="text-xs text-slate-500">({b.customerName})</span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {b.description}
                          </p>
                        </div>
                        <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                          {b.status}
                        </span>
                      </div>
                    ))}

                    {/* Contracts */}
                    {contractResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleOpenContract(c)}
                        className="p-3 transition-colors cursor-pointer group flex items-center justify-between gap-3 hover:bg-emerald-50/40"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {isAr ? 'عقد صيانة' : 'Contract'}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {c.contractNumber}
                            </span>
                            <span className="text-xs text-slate-500">• {c.customerName}</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {c.elevatorName} {c.siteLocation ? `• ${c.siteLocation}` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Inventory Parts Section */}
                {(activeCategory === 'ALL' || activeCategory === 'INVENTORY') && inventoryResults.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 bg-slate-100/70 py-1.5 px-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isAr ? 'قطع غيار ومواد المستودع' : 'Inventory Items & Spare Parts'}</span>
                      </span>
                      <span className="text-[10px] font-mono">{inventoryResults.length}</span>
                    </div>

                    {inventoryResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleOpenInventory(item)}
                        className="p-3 transition-colors cursor-pointer group flex items-center justify-between gap-3 hover:bg-emerald-50/40"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {item.sku}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {isAr ? item.nameAr : item.nameEn || item.nameAr}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {item.specification || (isAr ? 'موقع الرف: ' + item.warehouseLocation : 'Bin: ' + item.warehouseLocation)}
                          </p>
                        </div>
                        <div className="text-left shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.quantityOnHand <= item.minStockLevel
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.quantityOnHand} {isAr ? 'متوفر' : 'in stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Quick Keys Hint */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Ctrl+K للبحث المباشر</span>
              <span>•</span>
              <span>Esc للإغلاق</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-slate-600">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isAr ? 'نظام البحث والتنقل السريع ERP' : 'Fast Access ERP Search'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
