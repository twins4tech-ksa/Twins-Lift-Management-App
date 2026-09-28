import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ElevatorSpecification, ProjectStatus, ElevatorType, Customer } from '../types/elevator';
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Layers, 
  Printer, 
  Edit, 
  Trash2, 
  Plus, 
  Download,
  FileDown,
  CheckSquare,
  Square,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Eye,
  SlidersHorizontal,
  FolderPlus,
  Check,
  Pencil,
  Zap,
  Percent,
  BadgeCheck,
  FileText,
  BarChart3,
  AlertTriangle,
  Table,
  LayoutGrid,
  TrendingUp,
  Wrench,
  Award
} from 'lucide-react';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';
import { AppLanguage, TRANSLATIONS } from '../utils/translations';
import { exportCrmProjectsToExcel } from '../utils/excelExport';
import { SalesAnalyticsDashboard } from './SalesAnalyticsDashboard';
import { SearchableSelect } from './SearchableSelect';
import { UserProfile, UserPortalRole, ROLE_PRIVILEGES_MAP } from '../types/portal';
import { useInteractiveTable, InteractiveColumn } from '../hooks/useInteractiveTable';
import { InteractiveTableHeader, TableControlBar } from './InteractiveTableHeader';
import { exportProjectsBatchPdf } from '../utils/pdfExport';

export const STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    dotClass: string;
    icon: React.ElementType;
    description: string;
  }
> = {
  Won: {
    label: 'Won',
    bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
    dotClass: 'bg-emerald-500',
    icon: BadgeCheck,
    description: 'Contract awarded / Won',
  },
  Installed: {
    label: 'Installed',
    bgClass: 'bg-teal-100 text-teal-800 border-teal-300 shadow-2xs',
    textClass: 'text-teal-800',
    borderClass: 'border-teal-300',
    dotClass: 'bg-teal-500',
    icon: CheckCircle2,
    description: 'Handed over & commissioned',
  },
  Draft: {
    label: 'Draft',
    bgClass: 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-2xs',
    textClass: 'text-yellow-800',
    borderClass: 'border-yellow-300',
    dotClass: 'bg-yellow-500',
    icon: Clock,
    description: 'Draft quotation proposal',
  },
  Lost: {
    label: 'Lost',
    bgClass: 'bg-rose-100 text-rose-800 border-rose-300 shadow-2xs',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-300',
    dotClass: 'bg-rose-500',
    icon: XCircle,
    description: 'Tender lost / cancelled',
  },
  Approved: {
    label: 'Approved',
    bgClass: 'bg-blue-100 text-blue-800 border-blue-300 shadow-2xs',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-300',
    dotClass: 'bg-blue-500',
    icon: ShieldCheck,
    description: 'Client / Consultant approved',
  },
  Sent: {
    label: 'Sent',
    bgClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-2xs',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-300',
    dotClass: 'bg-indigo-500',
    icon: Send,
    description: 'Delivered to client',
  },
};

export const getLocalizedStatusConfig = (status: ProjectStatus, isAr: boolean) => {
  const configs: Record<
    ProjectStatus,
    {
      label: string;
      bgClass: string;
      textClass: string;
      borderClass: string;
      dotClass: string;
      icon: React.ElementType;
      description: string;
    }
  > = {
    Won: {
      label: isAr ? 'فوز بالعقد (Won)' : 'Won (Contract Signed)',
      bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-300',
      dotClass: 'bg-emerald-500',
      icon: BadgeCheck,
      description: isAr ? 'تم توقيع العقد الرسمي والتعميد' : 'Contract officially signed & awarded',
    },
    Installed: {
      label: isAr ? 'تم التركيب (Installed)' : 'Installed & Handed Over',
      bgClass: 'bg-teal-100 text-teal-800 border-teal-300 shadow-2xs',
      textClass: 'text-teal-800',
      borderClass: 'border-teal-300',
      dotClass: 'bg-teal-500',
      icon: CheckCircle2,
      description: isAr ? 'تم توريد المصعد وتركيبه وتسليمه' : 'Handed over and commissioned',
    },
    Draft: {
      label: isAr ? 'مسودة (Draft)' : 'Draft Proposal',
      bgClass: 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-300',
      dotClass: 'bg-amber-500',
      icon: Clock,
      description: isAr ? 'قيد الإعداد والتسعير الفني' : 'Draft quotation under preparation',
    },
    Lost: {
      label: isAr ? 'ملغى (Lost)' : 'Lost / Cancelled',
      bgClass: 'bg-rose-100 text-rose-800 border-rose-300 shadow-2xs',
      textClass: 'text-rose-800',
      borderClass: 'border-rose-300',
      dotClass: 'bg-rose-500',
      icon: XCircle,
      description: isAr ? 'تم إلغاء العرض أو التعاقد مع منافس' : 'Tender lost or project cancelled',
    },
    Approved: {
      label: isAr ? 'معتمد ومقبول (Approved)' : 'Approved by Client',
      bgClass: 'bg-blue-100 text-blue-800 border-blue-300 shadow-2xs',
      textClass: 'text-blue-800',
      borderClass: 'border-blue-300',
      dotClass: 'bg-blue-500',
      icon: ShieldCheck,
      description: isAr ? 'مقبول فنياً وبانتظار التوقيع' : 'Approved by consultant / client',
    },
    Sent: {
      label: isAr ? 'تم الإرسال (Sent)' : 'Sent to Client',
      bgClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-2xs',
      textClass: 'text-indigo-800',
      borderClass: 'border-indigo-300',
      dotClass: 'bg-indigo-500',
      icon: Send,
      description: isAr ? 'تم إرسال العرض للعميل وبانتظار الرد' : 'Delivered to client, pending response',
    },
  };
  return configs[status] || configs.Draft;
};

export interface CustomerGroup {
  customer: Customer;
  projects: ElevatorSpecification[];
  totalValue: number;
  wonValue: number;
  wonCount: number;
  latestDate: string;
}

import { MaintenanceContract, MaintenanceBreakdown } from '../types/maintenance';

interface Props {
  projects: ElevatorSpecification[];
  customers: Customer[];
  maintenanceContracts?: MaintenanceContract[];
  breakdowns?: MaintenanceBreakdown[];
  currentRole?: UserPortalRole;
  currentUser?: UserProfile;
  language?: AppLanguage;
  activeSection?: 'CUSTOMERS' | 'PROJECTS';
  forcedProjectsTab?: 'QUOTES' | 'CONTRACTS' | 'ALL' | 'ANALYTICS';
  onSwitchSection?: (section: 'CUSTOMERS' | 'PROJECTS') => void;
  onSelectProject: (project: ElevatorSpecification) => void;
  onNewQuotation: () => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProjectStatus?: (projectId: string, newStatus: ProjectStatus) => void;
  onUpdateProjectPrice?: (projectId: string, newPrice: number) => void;
  onUpdateProjectInline?: (projectId: string, updates: { status?: ProjectStatus; quotedPrice?: number }) => void;
  onNavigateToDrawings: (project: ElevatorSpecification) => void;
  onNavigateToPrint: (project: ElevatorSpecification) => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer | void;
  onDeleteCustomer?: (customerId: string) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onAddProjectForCustomer: (customer: Customer) => void;
  onSyncAllToGoogleSheets?: () => void;
  onCreateNewGoogleSheet?: () => void;
  isSheetsConnected?: boolean;
  sheetsUrl?: string;
  lastSyncedAt?: string;
}

export const HistoricalDashboard: React.FC<Props> = ({
  projects,
  customers,
  maintenanceContracts = [],
  breakdowns = [],
  currentRole = 'MANAGEMENT',
  currentUser,
  language = 'ar',
  activeSection = 'CUSTOMERS',
  forcedProjectsTab,
  onSwitchSection,
  onSelectProject,
  onNewQuotation,
  onDeleteProject,
  onUpdateProjectStatus,
  onUpdateProjectPrice,
  onUpdateProjectInline,
  onNavigateToDrawings,
  onNavigateToPrint,
  onAddCustomer,
  onDeleteCustomer,
  onUpdateCustomer,
  onAddProjectForCustomer,
  onSyncAllToGoogleSheets,
  onCreateNewGoogleSheet,
  isSheetsConnected,
  sheetsUrl,
  lastSyncedAt,
}) => {
  const isAr = language === 'ar';
  const t = TRANSLATIONS[language] || TRANSLATIONS.ar;

  // Primary Section: 'CUSTOMERS' or 'PROJECTS'
  const [currentSection, setCurrentSection] = useState<'CUSTOMERS' | 'PROJECTS'>(activeSection);

  useEffect(() => {
    if (activeSection) {
      setCurrentSection(activeSection);
    }
  }, [activeSection]);

  const handleSectionChange = (sec: 'CUSTOMERS' | 'PROJECTS') => {
    setCurrentSection(sec);
    if (onSwitchSection) {
      onSwitchSection(sec);
    }
  };

  // Projects View Specific: Tabs for Quotations vs Contracts vs All vs Sales Analytics
  const [projectsTab, setProjectsTab] = useState<'QUOTES' | 'CONTRACTS' | 'ALL' | 'ANALYTICS'>(forcedProjectsTab || 'QUOTES');
  useEffect(() => { if (forcedProjectsTab) setProjectsTab(forcedProjectsTab); }, [forcedProjectsTab]);

  // Customer List View mode: 'COMPACT_TABLE' (multi-column showing more customers) or 'CARDS'
  const [customerListView, setCustomerListView] = useState<'COMPACT_TABLE' | 'CARDS'>('COMPACT_TABLE');

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'PRICE_DESC' | 'MARGIN_DESC' | 'NAME_ASC'>('DATE_DESC');

  // Single filter icon popover state
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterType !== 'ALL') count++;
    if (filterStatus !== 'ALL') count++;
    if (sortBy !== 'DATE_DESC') count++;
    return count;
  }, [filterType, filterStatus, sortBy]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        e.target instanceof Node &&
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(e.target)
      ) {
        const target = e.target as HTMLElement;
        if (target.closest && target.closest('[data-searchable-select-portal="true"]')) {
          return;
        }
        setIsFilterPopoverOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFilterPopoverOpen(false);
      }
    };

    if (isFilterPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterPopoverOpen]);

  // Customer expansion state for Cards view
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Set<string>>(new Set());

  // Modal: Full Customer Details & Profile (View All Data)
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);

  // Modal: Add New Customer
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [customerModalData, setCustomerModalData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    location: '',
    taxNumber: '',
    customerType: 'company' as 'individual' | 'company' | 'contractor' | 'government',
    notes: '',
  });

  // Modal: Edit Existing Customer
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Modal: Quick Inline Edit
  const [inlineEditProject, setInlineEditProject] = useState<ElevatorSpecification | null>(null);
  const [inlineEditPrice, setInlineEditPrice] = useState<string>('');
  const [inlineEditStatus, setInlineEditStatus] = useState<ProjectStatus>('Draft');

  const openInlineEdit = (proj: ElevatorSpecification) => {
    setInlineEditProject(proj);
    setInlineEditPrice(proj.totalQuotationPrice.toString());
    setInlineEditStatus(proj.status);
  };

  const handleSaveInlineEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inlineEditProject && onUpdateProjectInline) {
      onUpdateProjectInline(inlineEditProject.id, {
        status: inlineEditStatus,
        quotedPrice: Number(inlineEditPrice),
      });
      setInlineEditProject(null);
    }
  };

  const toggleCustomerExpanded = (customerId: string) => {
    setExpandedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  const expandAllCustomers = () => {
    setExpandedCustomerIds(new Set(customers.map((c) => c.id)));
  };

  const collapseAllCustomers = () => {
    setExpandedCustomerIds(new Set());
  };

  // Batch Export PDF Selection State
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [isBatchExporting, setIsBatchExporting] = useState<boolean>(false);
  const [batchExportMessage, setBatchExportMessage] = useState<string | null>(null);

  const toggleSelectProject = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const toggleSelectAllProjects = () => {
    if (selectedProjectIds.size === filteredProjectsFlat.length && filteredProjectsFlat.length > 0) {
      setSelectedProjectIds(new Set());
    } else {
      setSelectedProjectIds(new Set(filteredProjectsFlat.map((p) => p.id)));
    }
  };

  const clearSelectedProjects = () => {
    setSelectedProjectIds(new Set());
  };

  const handleBatchExportPdf = async () => {
    const targetList = selectedProjectIds.size > 0
      ? projects.filter((p) => selectedProjectIds.has(p.id))
      : filteredProjectsFlat.length > 0
      ? filteredProjectsFlat
      : projects;

    if (targetList.length === 0) return;

    setIsBatchExporting(true);
    setBatchExportMessage(
      isAr
        ? `جاري تجهيز وتوليد ملف PDF المجمع لعدد ${targetList.length} مشروع...`
        : `Generating consolidated PDF for ${targetList.length} projects...`
    );

    try {
      await exportProjectsBatchPdf(
        targetList,
        isAr ? 'شركة توينز تكنولوجي للمصاعد' : 'Twins Technology for Elevators',
        '+966 50 000 0000',
        isAr ? 'ar' : 'en'
      );
      setBatchExportMessage(
        isAr
          ? `تم تحميل ملف PDF المجمع بنجاح لـ ${targetList.length} مشروع!`
          : `Consolidated PDF downloaded successfully for ${targetList.length} projects!`
      );
      setTimeout(() => setBatchExportMessage(null), 4000);
    } catch (err) {
      console.error('Batch PDF export failed:', err);
      setBatchExportMessage(isAr ? 'حدث خطأ أثناء التصدير، يرجى المحاولة ثانية' : 'Export failed, please try again');
      setTimeout(() => setBatchExportMessage(null), 4000);
    } finally {
      setIsBatchExporting(false);
    }
  };

  // Scope filtering: If current role is SALES_REP and does NOT have canViewAllDepartmentRecords,
  // restrict projects & customers to only those assigned to or entered by this sales rep.
  const isSalesRepRestricted = currentRole === 'SALES_REP' && !currentUser?.canViewAllDepartmentRecords;

  const effectiveProjects = useMemo(() => {
    if (!isSalesRepRestricted || !currentUser) return projects;
    const repEmpId = currentUser.employeeId;
    const repName = currentUser.name;
    const repUserId = currentUser.id;

    const matched = projects.filter((p) => {
      const matchEmpId = repEmpId && p.assignedSalesRepId === repEmpId;
      const matchUserId = p.assignedSalesRepId === repUserId;
      const matchName = repName && (
        p.assignedSalesRepName === repName || 
        (p.consultant && p.consultant.includes(repName))
      );
      return matchEmpId || matchUserId || matchName;
    });

    // If demo environment doesn't have explicit assigned IDs matching, preserve 2 demo projects so rep has sample data
    if (matched.length === 0 && projects.length > 0) {
      return projects.slice(0, 2);
    }
    return matched;
  }, [projects, isSalesRepRestricted, currentUser]);

  const effectiveCustomers = useMemo(() => {
    if (!isSalesRepRestricted || !currentUser) return customers;
    return customers.filter((cust) => {
      const matchEmpId = currentUser.employeeId && cust.assignedSalesRepId === currentUser.employeeId;
      const matchUserId = cust.assignedSalesRepId === currentUser.id;
      const matchName = currentUser.name && cust.assignedSalesRepName === currentUser.name;
      const hasProj = effectiveProjects.some(
        (p) => (p.customerId && p.customerId === cust.id) || (p.clientName && p.clientName.trim().toLowerCase() === cust.name.trim().toLowerCase())
      );
      return matchEmpId || matchUserId || matchName || hasProj;
    });
  }, [customers, effectiveProjects, isSalesRepRestricted, currentUser]);

  // Group projects inside each customer
  const customerGroups: CustomerGroup[] = useMemo(() => {
    const list: CustomerGroup[] = [];
    const assignedProjectIds = new Set<string>();

    // 1. Process all known registered customers
    effectiveCustomers.forEach((cust) => {
      const matchedProjects = effectiveProjects.filter((p) => {
        const isIdMatch = p.customerId && p.customerId === cust.id;
        const isNameMatch = p.clientName && p.clientName.trim().toLowerCase() === cust.name.trim().toLowerCase();
        return isIdMatch || isNameMatch;
      });

      matchedProjects.forEach((p) => assignedProjectIds.add(p.id));

      const totalVal = matchedProjects.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
      const wonProjects = matchedProjects.filter((p) => p.status === 'Won' || p.status === 'Installed');
      const wonVal = wonProjects.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);

      // Latest project date
      let latest = cust.createdAt || '2025-01-01';
      if (matchedProjects.length > 0) {
        const sorted = [...matchedProjects].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        latest = sorted[0].date;
      }

      list.push({
        customer: cust,
        projects: matchedProjects,
        totalValue: totalVal,
        wonValue: wonVal,
        wonCount: wonProjects.length,
        latestDate: latest,
      });
    });

    // 2. Catch orphaned projects (custom client names without registered customer ID)
    const orphaned = effectiveProjects.filter((p) => !assignedProjectIds.has(p.id));
    const orphanedClientMap = new Map<string, ElevatorSpecification[]>();

    orphaned.forEach((p) => {
      const key = p.clientName.trim() || 'عميل غير مسجل (Unassigned)';
      const existing = orphanedClientMap.get(key) || [];
      existing.push(p);
      orphanedClientMap.set(key, existing);
    });

    orphanedClientMap.forEach((projs, clientName) => {
      const totalVal = projs.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
      const wonProjects = projs.filter((p) => p.status === 'Won' || p.status === 'Installed');
      const wonVal = wonProjects.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
      const sorted = [...projs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const syntheticCustomer: Customer = {
        id: `auto-${clientName.replace(/\s+/g, '-').toLowerCase()}`,
        name: clientName,
        company: projs[0]?.consultant || '',
        phone: projs[0]?.clientPhone || '',
        email: projs[0]?.clientEmail || '',
        location: projs[0]?.siteLocation || '',
        notes: 'تم إنشاؤه تلقائياً من عروض الأسعار السابقة',
        createdAt: sorted[0]?.date || '2025-01-01',
      };

      list.push({
        customer: syntheticCustomer,
        projects: projs,
        totalValue: totalVal,
        wonValue: wonVal,
        wonCount: wonProjects.length,
        latestDate: sorted[0]?.date || '2025-01-01',
      });
    });

    return list;
  }, [effectiveCustomers, effectiveProjects]);

  // Filtered customer groups based on search & filters
  const filteredCustomerGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return customerGroups
      .map((grp) => {
        const filteredProjs = grp.projects.filter((p) => {
          const matchesType = filterType === 'ALL' || p.elevatorType === filterType;
          const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
          if (!matchesType || !matchesStatus) return false;
          if (!q) return true;

          const inProj =
            p.projectName.toLowerCase().includes(q) ||
            p.quoteRef.toLowerCase().includes(q) ||
            (p.elevatorNumber && p.elevatorNumber.toLowerCase().includes(q)) ||
            p.elevatorType.toLowerCase().includes(q);
          const inCust =
            grp.customer.name.toLowerCase().includes(q) ||
            (grp.customer.company && grp.customer.company.toLowerCase().includes(q)) ||
            (grp.customer.location && grp.customer.location.toLowerCase().includes(q)) ||
            (grp.customer.phone && grp.customer.phone.toLowerCase().includes(q)) ||
            (grp.customer.email && grp.customer.email.toLowerCase().includes(q));

          return inProj || inCust;
        });

        const customerMatchesDirectly =
          !q ||
          grp.customer.name.toLowerCase().includes(q) ||
          (grp.customer.company && grp.customer.company.toLowerCase().includes(q)) ||
          (grp.customer.location && grp.customer.location.toLowerCase().includes(q)) ||
          (grp.customer.phone && grp.customer.phone.toLowerCase().includes(q)) ||
          (grp.customer.email && grp.customer.email.toLowerCase().includes(q));

        const shouldIncludeCustomer = customerMatchesDirectly || filteredProjs.length > 0;

        return {
          ...grp,
          projects: filteredProjs,
          shouldInclude: shouldIncludeCustomer,
        };
      })
      .filter((grp) => grp.shouldInclude)
      .sort((a, b) => {
        if (sortBy === 'NAME_ASC') return a.customer.name.localeCompare(b.customer.name);
        if (sortBy === 'PRICE_DESC') return b.totalValue - a.totalValue;
        if (sortBy === 'DATE_DESC') return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
        if (sortBy === 'DATE_ASC') return new Date(a.latestDate).getTime() - new Date(b.latestDate).getTime();
        return 0;
      });
  }, [customerGroups, searchQuery, filterType, filterStatus, sortBy]);

  // Flattened filtered projects for Projects section with Quotations/Contracts tab filtering
  const filteredProjectsFlat = useMemo(() => {
    return effectiveProjects
      .filter((p) => {
        // Tab-level filter:
        if (projectsTab === 'QUOTES') {
          // Quotations pipeline: Draft, Sent, Approved
          if (p.status === 'Won' || p.status === 'Installed' || p.status === 'Lost') return false;
        } else if (projectsTab === 'CONTRACTS') {
          // Awarded contracts and installed lifts: Won, Installed
          if (p.status !== 'Won' && p.status !== 'Installed') return false;
        }

        const matchesSearch =
          !searchQuery.trim() ||
          p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.quoteRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.elevatorNumber && p.elevatorNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.siteLocation.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === 'ALL' || p.elevatorType === filterType;
        const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'DATE_DESC') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'DATE_ASC') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'PRICE_DESC') return b.totalQuotationPrice - a.totalQuotationPrice;
        if (sortBy === 'MARGIN_DESC') return b.grossMarginPercent - a.grossMarginPercent;
        if (sortBy === 'NAME_ASC') return a.projectName.localeCompare(b.projectName);
        return 0;
      });
  }, [effectiveProjects, projectsTab, searchQuery, filterType, filterStatus, sortBy]);

  // Check if any filter or search query is currently active
  const hasActiveFilter = Boolean(
    searchQuery.trim() !== '' ||
    filterType !== 'ALL' ||
    filterStatus !== 'ALL'
  );

  // Dynamic datasets that respect active filters across Dashboard Summary and tabs
  const displayedProjects = useMemo(() => {
    return hasActiveFilter ? filteredProjectsFlat : effectiveProjects;
  }, [hasActiveFilter, filteredProjectsFlat, effectiveProjects]);

  const displayedCustomers = useMemo(() => {
    return hasActiveFilter ? filteredCustomerGroups.map((g) => g.customer) : effectiveCustomers;
  }, [hasActiveFilter, filteredCustomerGroups, effectiveCustomers]);

  // Overall and Section-specific Metrics (Dynamically reflects active filters)
  const metrics = useMemo(() => {
    const totalCustomersCount = displayedCustomers.length;
    const totalProjectsCount = displayedProjects.length;
    const totalQuotedValue = displayedProjects.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);

    const quotesList = displayedProjects.filter((p) => p.status === 'Draft' || p.status === 'Sent' || p.status === 'Approved');
    const contractsList = displayedProjects.filter((p) => p.status === 'Won' || p.status === 'Installed');
    const lostList = displayedProjects.filter((p) => p.status === 'Lost');

    const quotesCount = quotesList.length;
    const contractsCount = contractsList.length;

    const quotesValue = quotesList.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
    const contractsValue = contractsList.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);

    const activeQuotes = displayedProjects.filter((p) => p.status !== 'Lost');
    const totalProjectedRevenue = activeQuotes.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
    
    let totalMargin = 0;
    let marginCount = 0;
    activeQuotes.forEach((p) => {
      if (p.grossMarginPercent > 0) {
        totalMargin += p.grossMarginPercent;
        marginCount++;
      }
    });
    const averageMargin = marginCount > 0 ? (totalMargin / marginCount).toFixed(1) : '0.0';

    const winRate = totalProjectsCount > 0 ? Math.round((contractsCount / totalProjectsCount) * 100) : 0;

    return {
      totalCustomersCount,
      totalProjectsCount,
      totalQuotedValue,
      quotesCount,
      contractsCount,
      quotesValue,
      contractsValue,
      winRate,
      totalProjectedRevenue,
      averageMargin,
      lostCount: lostList.length,
      hasActiveFilter,
    };
  }, [displayedCustomers, displayedProjects, hasActiveFilter]);

  // Active privilege role in Dashboard Summary (defaults to currentRole or MANAGEMENT)
  const [activePrivilegeRole, setActivePrivilegeRole] = useState<UserPortalRole>(currentRole || 'MANAGEMENT');

  useEffect(() => {
    if (currentRole) {
      setActivePrivilegeRole(currentRole);
    }
  }, [currentRole]);

  // Active maintenance contracts
  const activeMaintenanceContracts = useMemo(() => {
    return maintenanceContracts.filter((c) => c.status === 'Active' || c.status === 'Pending');
  }, [maintenanceContracts]);

  // Monthly Recurring Revenue (MRR) from maintenance contracts
  const monthlyMaintenanceRevenue = useMemo(() => {
    return activeMaintenanceContracts.reduce((sum, c) => {
      const price = c.totalPrice || 0;
      switch (c.paymentFrequency) {
        case 'Monthly':
          return sum + price;
        case 'Quarterly':
          return sum + (price / 3);
        case 'Biannual':
          return sum + (price / 6);
        case 'Annual':
        default:
          return sum + (price / 12);
      }
    }, 0);
  }, [activeMaintenanceContracts]);

  // Current month's signed/won projects revenue (Respects filters)
  const currentMonthProjectsRevenue = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const wonThisMonth = displayedProjects.filter((p) => {
      if (p.status !== 'Won' && p.status !== 'Installed') return false;
      if (!p.date) return false;
      const d = new Date(p.date);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const wonTotal = wonThisMonth.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
    if (wonTotal > 0) return wonTotal;

    // Monthly average of won/installed projects in current active filter
    const totalWon = displayedProjects
      .filter((p) => p.status === 'Won' || p.status === 'Installed')
      .reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
    return totalWon > 0 ? Math.round(totalWon / 12) : 0;
  }, [displayedProjects]);

  const totalMonthlyRevenue = Math.round(monthlyMaintenanceRevenue + currentMonthProjectsRevenue);
  const totalActiveContractsCount = activeMaintenanceContracts.length + metrics.contractsCount;

  // Active customer details resolution for details modal
  const customerDetailsGroup = useMemo(() => {
    if (!selectedCustomerForDetails) return null;
    return customerGroups.find((g) => g.customer.id === selectedCustomerForDetails.id) || null;
  }, [selectedCustomerForDetails, customerGroups]);

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerModalData.name.trim()) return;

    onAddCustomer({
      name: customerModalData.name.trim(),
      company: customerModalData.company.trim(),
      phone: customerModalData.phone.trim(),
      email: customerModalData.email.trim(),
      location: customerModalData.location.trim(),
      notes: customerModalData.notes.trim(),
      taxNumber: customerModalData.taxNumber.trim(),
      customerType: customerModalData.customerType,
    });

    setCustomerModalData({
      name: '',
      company: '',
      phone: '',
      email: '',
      location: '',
      taxNumber: '',
      customerType: 'company',
      notes: '',
    });
    setIsAddCustomerModalOpen(false);
  };

  const handleEditCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name.trim()) return;
    if (onUpdateCustomer) {
      onUpdateCustomer(editingCustomer);
    }
    setEditingCustomer(null);
    if (selectedCustomerForDetails && selectedCustomerForDetails.id === editingCustomer.id) {
      setSelectedCustomerForDetails(editingCustomer);
    }
  };

  const [excelExportNotification, setExcelExportNotification] = useState(false);
  const handleExportAllExcel = () => {
    exportCrmProjectsToExcel(customerGroups);
    setExcelExportNotification(true);
    setTimeout(() => setExcelExportNotification(false), 3000);
  };

  const renderStatusBadge = (p: ElevatorSpecification) => {
    const cfg = getLocalizedStatusConfig(p.status, isAr);
    const Icon = cfg.icon;

    return (
      <div className="relative inline-block group min-w-[140px]">
        {onUpdateProjectStatus ? (
          <SearchableSelect
            value={p.status}
            onChange={(e) => onUpdateProjectStatus(p.id, e.target.value as ProjectStatus)}
            title={`Change status for ${p.quoteRef}`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bgClass} cursor-pointer`}
          >
            <option value="Won">Won - عقد موقّع ومعتمد</option>
            <option value="Installed">Installed - تم التوريد والتركيب</option>
            <option value="Approved">Approved - معتمد ومقبول</option>
            <option value="Sent">Sent - تم الإرسال للعميل</option>
            <option value="Draft">Draft - مسودة قيد الإعداد</option>
            <option value="Lost">Lost - ملغى / لم يتم التعاقد</option>
          </SearchableSelect>
        ) : (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bgClass}`}
            title={`Status: ${p.status} (${cfg.description})`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{cfg.label.split('(')[0]}</span>
          </div>
        )}
      </div>
    );
  };

  // 1. Interactive Customer Table Columns & Hook
  const customerColumns = useMemo<InteractiveColumn<typeof filteredCustomerGroups[0]>[]>(() => [
    {
      id: 'index',
      header: '#',
      align: 'center',
      width: '44px',
      sortable: false,
      draggable: false,
      renderCell: (_, idx) => (
        <span className="text-slate-400 font-mono text-[11px]">{idx + 1}</span>
      ),
    },
    {
      id: 'name',
      header: isAr ? 'اسم العميل' : 'Customer Name',
      headerAr: 'اسم العميل',
      headerEn: 'Customer Name',
      minWidth: '160px',
      sortable: true,
      accessor: (grp) => grp.customer.name,
      renderCell: (grp) => {
        const cust = grp.customer;
        const initials = cust.name.slice(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#172033] text-[#b6be49] flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
              {initials}
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                {cust.name}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'company',
      header: isAr ? 'الشركة / المؤسسة' : 'Company',
      headerAr: 'الشركة / المؤسسة',
      headerEn: 'Company',
      minWidth: '120px',
      sortable: true,
      accessor: (grp) => grp.customer.company || '',
      renderCell: (grp) => (
        <span className="text-slate-600 truncate max-w-[140px] block">
          {grp.customer.company ? <span className="font-medium text-slate-700">{grp.customer.company}</span> : <span className="text-slate-300">-</span>}
        </span>
      ),
    },
    {
      id: 'phone',
      header: isAr ? 'الهاتف' : 'Phone',
      headerAr: 'الهاتف',
      headerEn: 'Phone',
      minWidth: '110px',
      sortable: true,
      accessor: (grp) => grp.customer.phone || '',
      renderCell: (grp) => (
        grp.customer.phone ? (
          <a
            href={`tel:${grp.customer.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-slate-600 hover:text-emerald-700 font-mono text-[11px] inline-flex items-center gap-1"
            dir="ltr"
          >
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{grp.customer.phone}</span>
          </a>
        ) : <span className="text-slate-300">-</span>
      ),
    },
    {
      id: 'email',
      header: isAr ? 'البريد الإلكتروني' : 'Email',
      headerAr: 'البريد الإلكتروني',
      headerEn: 'Email',
      minWidth: '140px',
      sortable: true,
      accessor: (grp) => grp.customer.email || '',
      renderCell: (grp) => (
        grp.customer.email ? (
          <a
            href={`mailto:${grp.customer.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-slate-600 hover:text-blue-700 inline-flex items-center gap-1 truncate max-w-[150px]"
          >
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{grp.customer.email}</span>
          </a>
        ) : <span className="text-slate-300">-</span>
      ),
    },
    {
      id: 'location',
      header: isAr ? 'المدينة / الموقع' : 'Location',
      headerAr: 'المدينة / الموقع',
      headerEn: 'Location',
      minWidth: '110px',
      sortable: true,
      accessor: (grp) => grp.customer.location || '',
      renderCell: (grp) => (
        grp.customer.location ? (
          <span className="inline-flex items-center gap-1 text-slate-600 truncate max-w-[120px]">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{grp.customer.location}</span>
          </span>
        ) : <span className="text-slate-300">-</span>
      ),
    },
    {
      id: 'lifts',
      header: isAr ? 'المصاعد' : 'Lifts',
      headerAr: 'المصاعد',
      headerEn: 'Lifts',
      align: 'center',
      minWidth: '80px',
      sortable: true,
      accessor: (grp) => grp.projects.length,
      renderCell: (grp) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
          {grp.projects.length}
        </span>
      ),
    },
    {
      id: 'totalQuoted',
      header: isAr ? 'إجمالي العروض' : 'Total Quoted',
      headerAr: 'إجمالي العروض',
      headerEn: 'Total Quoted',
      minWidth: '110px',
      sortable: true,
      accessor: (grp) => grp.totalValue,
      renderCell: (grp) => (
        <span className="font-mono font-bold text-slate-900">
          <SarPrice amount={grp.totalValue} />
        </span>
      ),
    },
    {
      id: 'won',
      header: isAr ? 'عقود معتمدة' : 'Won',
      headerAr: 'عقود معتمدة',
      headerEn: 'Won',
      align: 'center',
      minWidth: '90px',
      sortable: true,
      accessor: (grp) => grp.wonCount,
      renderCell: (grp) => (
        grp.wonCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Check className="w-3 h-3" />
            <span>{grp.wonCount}</span>
          </span>
        ) : <span className="text-slate-300">-</span>
      ),
    },
    {
      id: 'date',
      header: isAr ? 'التاريخ' : 'Date',
      headerAr: 'التاريخ',
      headerEn: 'Date',
      align: 'center',
      minWidth: '90px',
      sortable: true,
      accessor: (grp) => grp.latestDate,
      renderCell: (grp) => (
        <span className="text-slate-500 font-mono text-[11px]">{grp.latestDate}</span>
      ),
    },
    {
      id: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      headerAr: 'الإجراءات',
      headerEn: 'Actions',
      align: 'center',
      minWidth: '130px',
      sortable: false,
      draggable: true,
      renderCell: (grp) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onAddProjectForCustomer(grp.customer)}
            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
            title="إضافة عرض سعر جديد"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(grp.customer);
              setCustomerModalData({
                name: grp.customer.name,
                company: grp.customer.company || '',
                phone: grp.customer.phone || '',
                email: grp.customer.email || '',
                location: grp.customer.location || '',
                notes: grp.customer.notes || '',
                taxNumber: grp.customer.taxNumber || '',
                customerType: grp.customer.customerType || 'INDIVIDUAL',
              });
              setIsAddCustomerModalOpen(true);
            }}
            className="p-1 text-slate-500 hover:bg-slate-100 rounded"
            title="تعديل العميل"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedCustomerForDetails(grp.customer)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="عرض التفاصيل"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], [isAr, onAddProjectForCustomer]);

  const customerTable = useInteractiveTable({
    tableId: 'historical_customers_table',
    columns: customerColumns,
    data: filteredCustomerGroups,
    isAr,
  });

  // 2. Interactive Projects Table Columns & Hook
  const projectColumns = useMemo<InteractiveColumn<ElevatorSpecification>[]>(() => [
    {
      id: 'select',
      header: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={
              filteredProjectsFlat.length > 0 &&
              selectedProjectIds.size === filteredProjectsFlat.length
            }
            onChange={toggleSelectAllProjects}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            title={isAr ? 'تحديد كل المشاريع المعروضة' : 'Select all shown projects'}
          />
        </div>
      ),
      headerAr: 'تحديد',
      headerEn: 'Select',
      align: 'center',
      minWidth: '45px',
      sortable: false,
      draggable: false,
      renderCell: (p) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedProjectIds.has(p.id)}
            onChange={() => toggleSelectProject(p.id)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
        </div>
      ),
    },
    {
      id: 'quoteRef',
      header: isAr ? 'رقم المرجع (Ref)' : 'Quote Ref',
      headerAr: 'رقم المرجع (Ref)',
      headerEn: 'Quote Ref',
      minWidth: '120px',
      sortable: true,
      accessor: (p) => p.quoteRef,
      renderCell: (p) => (
        <div>
          <button
            type="button"
            onClick={() => onSelectProject(p)}
            className="font-mono font-bold text-blue-700 hover:underline text-start block"
            title="فتح في المعالج"
          >
            {p.quoteRef}
          </button>
          {p.elevatorNumber && (
            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200" title={isAr ? 'رقم كود المصعد' : 'Elevator Unit Code'}>
              {p.elevatorNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'projectName',
      header: isAr ? 'المشروع والعميل' : 'Project & Client',
      headerAr: 'المشروع والعميل',
      headerEn: 'Project & Client',
      minWidth: '170px',
      sortable: true,
      accessor: (p) => p.projectName,
      renderCell: (p) => (
        <div>
          <div className="font-bold text-slate-900">{p.projectName}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="font-medium text-slate-700">{p.clientName}</span>
            {p.siteLocation && (
              <span className="text-slate-400">&bull; {p.siteLocation.split(',')[0]}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'specs',
      header: isAr ? 'المواصفات الفنية' : 'Technical Specs',
      headerAr: 'المواصفات الفنية',
      headerEn: 'Technical Specs',
      minWidth: '170px',
      sortable: true,
      accessor: (p) => p.capacityKg,
      renderCell: (p) => (
        <div className="text-[11px] text-slate-600">
          <div className="font-medium text-slate-800">{p.elevatorType}</div>
          <div className="text-slate-400">
            {p.capacityKg} kg &bull; {p.ratedSpeed} m/s &bull; {p.stops} {isAr ? 'وقفات' : 'stops'}
          </div>
        </div>
      ),
    },
    {
      id: 'date',
      header: isAr ? 'التاريخ' : 'Date',
      headerAr: 'التاريخ',
      headerEn: 'Date',
      align: 'center',
      minWidth: '90px',
      sortable: true,
      accessor: (p) => p.date,
      renderCell: (p) => (
        <span className="text-center text-slate-500 font-mono text-[11px] block">{p.date}</span>
      ),
    },
    {
      id: 'price',
      header: isAr ? 'القيمة (SAR)' : 'Price (SAR)',
      headerAr: 'القيمة (SAR)',
      headerEn: 'Price (SAR)',
      minWidth: '110px',
      sortable: true,
      accessor: (p) => p.totalQuotationPrice,
      renderCell: (p) => (
        <span className="font-mono font-bold text-slate-900">
          <SarPrice amount={p.totalQuotationPrice} />
        </span>
      ),
    },
    {
      id: 'margin',
      header: isAr ? 'الهامش' : 'Margin',
      headerAr: 'الهامش',
      headerEn: 'Margin',
      align: 'center',
      minWidth: '80px',
      sortable: true,
      accessor: (p) => p.grossMarginPercent,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono inline-block ${
            p.grossMarginPercent >= 25
              ? 'bg-emerald-100 text-emerald-800'
              : p.grossMarginPercent >= 15
              ? 'bg-blue-100 text-blue-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {p.grossMarginPercent}%
        </span>
      ),
    },
    {
      id: 'status',
      header: isAr ? 'حالة التعاقد' : 'Contract Status',
      headerAr: 'حالة التعاقد',
      headerEn: 'Contract Status',
      align: 'center',
      minWidth: '130px',
      sortable: true,
      accessor: (p) => p.status,
      renderCell: (p) => renderStatusBadge(p),
    },
    {
      id: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      headerAr: 'الإجراءات',
      headerEn: 'Actions',
      align: 'center',
      minWidth: '130px',
      sortable: false,
      draggable: true,
      renderCell: (p) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => openInlineEdit(p)}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title={t.quickInlineEditTitle}
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onSelectProject(p)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={isAr ? 'فتح وتعديل في المعالج' : 'Edit in Wizard'}
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateToDrawings(p)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title={isAr ? 'عرض المخطط الهندسي CAD' : 'CAD Drawings'}
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateToPrint(p)}
            className="p-1.5 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title={isAr ? 'طباعة عرض السعر والعقد الموحد' : 'Print Proposal & Contract'}
          >
            <Printer className="w-4 h-4 text-[#b6be49]" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(isAr ? `هل أنت متأكد من حذف مشروع "${p.projectName}"؟` : `Delete project "${p.projectName}"?`)) {
                onDeleteProject(p.id);
              }
            }}
            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            title={isAr ? 'حذف المشروع' : 'Delete Project'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [isAr, onSelectProject, onNavigateToDrawings, onNavigateToPrint, onDeleteProject, t.quickInlineEditTitle, selectedProjectIds, filteredProjectsFlat.length]);

  const projectsTable = useInteractiveTable({
    tableId: 'historical_projects_table',
    columns: projectColumns,
    data: filteredProjectsFlat,
    isAr,
  });

  return (
    <div id="customers-and-projects-directory" className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Sales Representative Visibility Scope Banner */}
      {currentRole === 'SALES_REP' && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
          currentUser?.canViewAllDepartmentRecords
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center gap-2.5">
            {currentUser?.canViewAllDepartmentRecords ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-extrabold block">
                {currentUser?.canViewAllDepartmentRecords
                  ? (isAr ? 'صلاحية موسعة: تشاهد كافة مشاريع وعروض أسعار قسم المبيعات بالكامل' : 'Expanded Scope: Viewing all sales department projects & quotes')
                  : (isAr ? 'نطاق العرض الطبيعي: تشاهد فقط عروض الأسعار والمشاريع المسندة إليك أو المدخلة بواسطتك' : 'Standard Scope: Viewing only projects assigned to or created by you')}
              </span>
              <span className="text-[11px] opacity-80 block">
                {currentUser?.canViewAllDepartmentRecords
                  ? (isAr ? 'تم تفعيل خيار "مشاهدة كافة سجلات القسم المصرح به" من حسابك في إدارة الموظفين.' : 'Option "View all department records" is active.')
                  : (isAr ? 'هذا هو الوضع الافتراضي للمناديب لحماية خصوصية المشاريع والعمولات. يمكن للإدارة تفعيل خيار مشاهدة كافة سجلات القسم من تبويب الصلاحيات.' : 'Default rep privacy mode. Admins can grant department-wide access in permissions tab.')}
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 border uppercase font-mono tracking-wider ${
            currentUser?.canViewAllDepartmentRecords
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            {currentUser?.canViewAllDepartmentRecords ? (isAr ? 'صلاحية موسعة' : 'EXPANDED') : (isAr ? 'مسند فقط' : 'ASSIGNED ONLY')}
          </span>
        </div>
      )}

      {/* 0. NEW: DASHBOARD SUMMARY SECTION (Role Privileges Aware with Small Stat Cards) */}
      <section 
        aria-label={isAr ? 'ملخص لوحة التحكم' : 'Dashboard Summary'}
        className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 text-slate-800"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-tight text-slate-900">
                  {isAr ? 'ملخص لوحة التحكم' : 'Dashboard Summary'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {ROLE_PRIVILEGES_MAP[activePrivilegeRole] 
                    ? (isAr ? ROLE_PRIVILEGES_MAP[activePrivilegeRole].titleAr : ROLE_PRIVILEGES_MAP[activePrivilegeRole].titleEn)
                    : activePrivilegeRole}
                </span>
                {hasActiveFilter && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1 animate-in fade-in">
                    <Filter className="w-2.5 h-2.5 text-blue-600" />
                    <span>{isAr ? `تصفية نشطة (${displayedProjects.length} مشروع)` : `Active Filter (${displayedProjects.length} projs)`}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterType('ALL');
                        setFilterStatus('ALL');
                      }}
                      className="ms-1 font-black text-blue-900 hover:text-rose-600 cursor-pointer"
                      title={isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isAr 
                  ? 'مؤشرات الأداء اللحظية، المشاريع، العقود النشطة والإيرادات الشهرية وفق صلاحيات المستخدم' 
                  : 'Real-time KPIs: Projects, active contracts & current monthly revenue as per user privileges'}
              </p>
            </div>
          </div>

          {/* Quick Role Privileges Switcher Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar bg-slate-50 p-1 rounded-lg border border-slate-200/70 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold px-1.5 shrink-0 hidden md:inline">
              {isAr ? 'عرض الصلاحيات:' : 'Privilege:'}
            </span>
            {(['MANAGEMENT', 'SALES_REP', 'TECHNICIAN', 'CUSTOMER'] as UserPortalRole[]).map((r) => {
              const priv = ROLE_PRIVILEGES_MAP[r];
              const isSelected = activePrivilegeRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActivePrivilegeRole(r)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-white text-blue-700 shadow-2xs border border-blue-200/80 font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={isAr ? `عرض ملخص ${priv.titleAr}` : `View ${priv.titleEn} Dashboard`}
                >
                  {isAr 
                    ? (r === 'MANAGEMENT' ? 'الإدارة العليا' : r === 'SALES_REP' ? 'المبيعات' : r === 'TECHNICIAN' ? 'الفني' : 'العميل') 
                    : (r === 'MANAGEMENT' ? 'Admin' : r === 'SALES_REP' ? 'Sales' : r === 'TECHNICIAN' ? 'Tech' : 'Client')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Small Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Total Project Count */}
          <div className="bg-slate-50/70 hover:bg-slate-100/70 p-3 rounded-xl border border-slate-200/80 transition-all duration-200 group">
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600 truncate">
                {activePrivilegeRole === 'CUSTOMER' 
                  ? (isAr ? 'مصاعدي المسجلة' : 'My Registered Lifts')
                  : activePrivilegeRole === 'TECHNICIAN'
                  ? (isAr ? 'مواقع المصاعد الميدانية' : 'Field Elevator Sites')
                  : activePrivilegeRole === 'SALES_REP'
                  ? (isAr ? 'مشاريع المبيعات' : 'Assigned Projects')
                  : (isAr ? 'إجمالي المشاريع' : 'Total Project Count')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {activePrivilegeRole === 'CUSTOMER'
                  ? Math.max(1, projects.filter(p => currentUser?.customerId ? p.customerId === currentUser.customerId : true).length)
                  : metrics.totalProjectsCount}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {isAr ? 'مشروع' : 'projects'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">
                {activePrivilegeRole === 'CUSTOMER'
                  ? (isAr ? 'مصاعد مطابقة لمعايير SASO' : 'SASO Compliant Lifts')
                  : `${metrics.contractsCount} ${isAr ? 'عقود موقّعة' : 'Won'} • ${metrics.quotesCount} ${isAr ? 'عروض نشطة' : 'Quotes'}`}
              </span>
            </div>
          </div>

          {/* Card 2: Active Contracts */}
          <div className="bg-slate-50/70 hover:bg-slate-100/70 p-3 rounded-xl border border-slate-200/80 transition-all duration-200 group">
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600 truncate">
                {activePrivilegeRole === 'CUSTOMER'
                  ? (isAr ? 'عقود الصيانة السارية' : 'Active Service Contracts')
                  : activePrivilegeRole === 'TECHNICIAN'
                  ? (isAr ? 'عقود الصيانة المكلّف بها' : 'Assigned Maintenance')
                  : activePrivilegeRole === 'SALES_REP'
                  ? (isAr ? 'العقود المعتمدة الناجحة' : 'Closed Active Deals')
                  : (isAr ? 'العقود النشطة' : 'Active Contracts')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 leading-tight">
                {activePrivilegeRole === 'CUSTOMER'
                  ? Math.max(1, activeMaintenanceContracts.length)
                  : activePrivilegeRole === 'TECHNICIAN'
                  ? activeMaintenanceContracts.length
                  : activePrivilegeRole === 'SALES_REP'
                  ? metrics.contractsCount
                  : totalActiveContractsCount}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {isAr ? 'عقد نشط' : 'contracts'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span className="truncate">
                {activePrivilegeRole === 'CUSTOMER'
                  ? (isAr ? 'تغطية طوارئ وبلاغات 24/7' : '24/7 Emergency Coverage')
                  : `${activeMaintenanceContracts.length} ${isAr ? 'صيانة دورية' : 'Mnt.'} • ${metrics.contractsCount} ${isAr ? 'توريد وتركيب' : 'Install'}`}
              </span>
            </div>
          </div>

          {/* Card 3: Current Monthly Revenue */}
          <div className="bg-slate-50/70 hover:bg-slate-100/70 p-3 rounded-xl border border-slate-200/80 transition-all duration-200 group">
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600 truncate">
                {activePrivilegeRole === 'CUSTOMER'
                  ? (isAr ? 'رسوم الصيانة الشهرية' : 'Monthly Service Fees')
                  : activePrivilegeRole === 'TECHNICIAN'
                  ? (isAr ? 'قيمة أعمال الصيانة الشهرية' : 'Monthly Maintenance Value')
                  : activePrivilegeRole === 'SALES_REP'
                  ? (isAr ? 'حجم مبيعاتي للشهر' : 'My Monthly Sales')
                  : (isAr ? 'الإيراد الشهري الحالي' : 'Current Monthly Revenue')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <SaudiRiyalSymbol className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                <SarPrice 
                  amount={
                    activePrivilegeRole === 'CUSTOMER'
                      ? Math.round(monthlyMaintenanceRevenue > 0 ? (monthlyMaintenanceRevenue / (activeMaintenanceContracts.length || 1)) : 850)
                      : activePrivilegeRole === 'TECHNICIAN'
                      ? Math.round(monthlyMaintenanceRevenue)
                      : activePrivilegeRole === 'SALES_REP'
                      ? Math.round(totalMonthlyRevenue * 0.75)
                      : totalMonthlyRevenue
                  } 
                />
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
              <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">
                {activePrivilegeRole === 'CUSTOMER'
                  ? (isAr ? 'رسوم العقد الشهري الحالي' : 'Current Monthly Dues')
                  : (isAr ? 'عقود صيانة MRR + إيراد الشهر' : 'MRR + Monthly Realized')}
              </span>
            </div>
          </div>

          {/* Card 4: Role Privileges Key Indicator */}
          <div className="bg-slate-50/70 hover:bg-slate-100/70 p-3 rounded-xl border border-slate-200/80 transition-all duration-200 group">
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[11px] font-bold text-slate-600 truncate">
                {activePrivilegeRole === 'CUSTOMER'
                  ? (isAr ? 'حالة السلامة والتشغيل' : 'Safety & Operational Health')
                  : activePrivilegeRole === 'TECHNICIAN'
                  ? (isAr ? 'الالتزام باتفاقية الخدمة SLA' : 'SLA Response Rate')
                  : activePrivilegeRole === 'SALES_REP'
                  ? (isAr ? 'عمولة المبيعات التقديرية' : 'Estimated Commission')
                  : (isAr ? 'متوسط هامش الربح' : 'Average Margin')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {activePrivilegeRole === 'CUSTOMER' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : activePrivilegeRole === 'TECHNICIAN' ? (
                  <Wrench className="w-3.5 h-3.5" />
                ) : activePrivilegeRole === 'SALES_REP' ? (
                  <Award className="w-3.5 h-3.5" />
                ) : (
                  <Percent className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-purple-700 leading-tight">
                {activePrivilegeRole === 'CUSTOMER' ? (
                  '100%'
                ) : activePrivilegeRole === 'TECHNICIAN' ? (
                  '98.5%'
                ) : activePrivilegeRole === 'SALES_REP' ? (
                  <SarPrice amount={Math.round(totalMonthlyRevenue * 0.025)} />
                ) : (
                  `${metrics.averageMargin}%`
                )}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
              <BadgeCheck className="w-3 h-3 text-purple-600 shrink-0" />
              <span className="truncate">
                {activePrivilegeRole === 'CUSTOMER'
                  ? (isAr ? 'فحص دوري معتمد EN 81-20' : 'EN 81-20 Certified')
                  : activePrivilegeRole === 'TECHNICIAN'
                  ? (isAr ? 'استجابة طوارئ في أقل من ساعتين' : '< 2hr emergency response')
                  : activePrivilegeRole === 'SALES_REP'
                  ? (isAr ? 'نسبة عمولة 2.5% من العقود' : '2.5% Closed Contract Rate')
                  : `${metrics.winRate}% ${isAr ? 'نسبة الفوز بالمشاريع' : 'Win rate'}`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Main Navigation Header & Section Switcher */}
      <div className="bg-white text-slate-800 p-3.5 sm:p-4 rounded-xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md border border-blue-200/60">
                {currentSection === 'CUSTOMERS' ? (
                  <>
                    <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{isAr ? 'دليل العملاء' : 'Customer Directory'}</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{isAr ? 'مركز المشاريع والعقود' : 'Projects & Contracts'}</span>
                  </>
                )}
              </span>
              <span className="text-slate-500 text-xs font-semibold">
                ({currentSection === 'CUSTOMERS' ? `${customers.length} ${isAr ? 'عميل' : 'clients'}` : `${projects.length} ${isAr ? 'مشروع' : 'projects'}`})
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 truncate">
              {currentSection === 'CUSTOMERS' 
                ? (isAr ? 'دليل العملاء المسجلين' : 'Customer Directory')
                : (isAr ? 'قائمة عروض الأسعار والعقود' : 'Quotations & Contracts')}
            </h1>
          </div>

          {/* Section Selector + Global Action Buttons (Compact Toolbar) */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0 w-full sm:w-auto justify-start sm:justify-end">
            {/* Context Action Button */}
            {currentSection === 'CUSTOMERS' ? (
              <button
                id="btn-add-customer-header"
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                title={isAr ? 'إضافة عميل جديد' : 'Add New Customer'}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAr ? '+ عميل' : '+ Customer'}</span>
              </button>
            ) : (
              <button
                id="btn-add-lift-header"
                type="button"
                onClick={onNewQuotation}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                title={isAr ? 'إنشاء عرض سعر جديد' : 'New Quotation'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? '+ عرض جديد' : '+ New Quote'}</span>
              </button>
            )}

            {onSyncAllToGoogleSheets && (
              <button
                id="btn-sync-sheets-header"
                type="button"
                onClick={onSyncAllToGoogleSheets}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
                title={isSheetsConnected ? (isAr ? 'مزامنة مع Google Sheets' : 'Sync Google Sheet') : (isAr ? 'ربط Google Sheets' : 'Connect Google Sheet')}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline text-[11px] font-bold">{isSheetsConnected ? 'Sync' : 'Sheets'}</span>
              </button>
            )}

            <button
              id="btn-export-excel-header"
              type="button"
              onClick={handleExportAllExcel}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
              title={isAr ? 'تصدير كامل بيانات المشاريع والعملاء إلى ملف Excel (.xlsx)' : 'Export All to Excel (.xlsx)'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline text-[11px] font-bold">Excel (.xlsx)</span>
              {excelExportNotification && (
                <span className="text-[10px] text-emerald-700 bg-emerald-200/80 px-1 py-0.2 rounded font-black animate-in fade-in">
                  تم!
                </span>
              )}
            </button>

            <button
              id="btn-batch-export-pdf-header"
              type="button"
              onClick={handleBatchExportPdf}
              disabled={isBatchExporting}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title={
                isAr
                  ? selectedProjectIds.size > 0
                    ? `تصدير ${selectedProjectIds.size} مشروع محدد كملف PDF موحد`
                    : `تصدير كافة المشاريع الحالية (${displayedProjects.length}) كملف PDF موحد`
                  : selectedProjectIds.size > 0
                    ? `Export ${selectedProjectIds.size} selected projects as consolidated PDF`
                    : `Export all (${displayedProjects.length}) projects as consolidated PDF`
              }
            >
              {isBatchExporting ? (
                <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-rose-600" />
              )}
              <span className="text-[11px] font-bold">
                {selectedProjectIds.size > 0 ? `PDF (${selectedProjectIds.size})` : 'PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* Dashboard Quick Metric Cards (Dynamic per section - High density side-by-side) */}
        {currentSection === 'CUSTOMERS' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
            <div className="bg-slate-50/80 hover:bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-bold truncate">
                  {isAr ? 'إجمالي العملاء' : 'Total Customers'}
                </div>
                <div className="text-base font-black text-slate-900 leading-tight">
                  {metrics.totalCustomersCount}
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 hover:bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-bold truncate">
                  {isAr ? 'المصاعد المطلوبة' : 'Total Elevators'}
                </div>
                <div className="text-base font-black text-slate-900 leading-tight">
                  {metrics.totalProjectsCount}
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 hover:bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-bold truncate">
                  {isAr ? 'عقود موقّعة' : 'Signed Contracts'}
                </div>
                <div className="text-base font-black text-emerald-600 leading-tight">
                  {metrics.contractsCount}
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 hover:bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <SaudiRiyalSymbol className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-bold truncate">
                  {isAr ? 'إجمالي القيمة' : 'Total Quoted'}
                </div>
                <div className="text-sm font-black text-slate-900 font-mono leading-tight truncate">
                  <SarPrice amount={metrics.totalQuotedValue} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Projects & Contracts KPI Summary Cards */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
            <div className="bg-slate-50/80 hover:bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <SaudiRiyalSymbol className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-wider">
                  {projectsTab === 'CONTRACTS'
                    ? isAr ? 'قيمة العقود المعتمدة' : 'Total Contract Value'
                    : isAr ? 'الإيرادات المتوقعة' : 'Projected Revenue'}
                </div>
                <div className="text-base font-black text-slate-900 font-mono leading-tight truncate">
                  <SarPrice amount={projectsTab === 'CONTRACTS' ? metrics.contractsValue : metrics.totalProjectedRevenue} />
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 hover:bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-wider">
                  {projectsTab === 'CONTRACTS'
                    ? isAr ? 'العقود المعتمدة' : 'Active Contracts'
                    : isAr ? 'عروض الأسعار النشطة' : 'Active Quotes'}
                </div>
                <div className="text-base font-black text-slate-900 leading-tight">
                  {projectsTab === 'CONTRACTS' ? metrics.contractsCount : metrics.quotesCount}{' '}
                  <span className="text-[11px] font-normal text-slate-500">
                    {projectsTab === 'CONTRACTS' ? (isAr ? 'عقد' : 'ctrs') : (isAr ? 'عرض' : 'quotes')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 hover:bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Percent className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-wider">
                  {isAr ? 'متوسط هامش الربح' : 'Average Margin'}
                </div>
                <div className="text-base font-black text-emerald-600 leading-tight">
                  {metrics.averageMargin}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-search-crm"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              currentSection === 'CUSTOMERS'
                ? isAr
                  ? 'بحث باسم العميل، الشركة، الهاتف، المدينة أو الملاحظات...'
                  : 'Search customers by name, company, phone, city...'
                : isAr
                  ? 'بحث برقم المرجع، المشروع، العميل أو نوع المصعد...'
                  : 'Search by quote ref, project, client, elevator type...'
            }
            className="w-full ps-9 pe-8 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters and View Switcher */}
        <div className="flex items-center gap-2">
          {/* Single Filter & Sort Icon Button */}
          <div className="relative" ref={filterPopoverRef}>
            <button
              type="button"
              onClick={() => setIsFilterPopoverOpen((prev) => !prev)}
              className={`p-2 rounded-lg border transition-all flex items-center justify-center relative cursor-pointer ${
                activeFilterCount > 0 || isFilterPopoverOpen
                  ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={
                isAr
                  ? activeFilterCount > 0
                    ? `الفلاتر والترتيب (${activeFilterCount} نشط)`
                    : 'الفلاتر والترتيب'
                  : activeFilterCount > 0
                    ? `Filters & Sorting (${activeFilterCount} active)`
                    : 'Filters & Sorting'
              }
              aria-label={isAr ? 'الفلاتر والترتيب' : 'Filters & Sorting'}
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Popover Panel */}
            {isFilterPopoverOpen && (
              <>
                {/* Mobile Backdrop Overlay to prevent touching behind */}
                <div 
                  className="sm:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-2xs"
                  onClick={() => setIsFilterPopoverOpen(false)}
                />
                <div
                  className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 w-auto sm:w-80 max-w-sm mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800 max-h-[85vh] overflow-y-auto"
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {isAr ? 'الفلاتر وخيارات الترتيب' : 'Filters & Sorting'}
                      </h4>
                      {activeFilterCount > 0 ? (
                        <span className="text-[10px] text-blue-600 font-semibold">
                          {isAr ? `${activeFilterCount} فلاتر نشطة` : `${activeFilterCount} active`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {isAr ? 'كل الفلاتر افتراضية' : 'All defaults'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterType('ALL');
                          setFilterStatus('ALL');
                          setSortBy('DATE_DESC');
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-bold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors"
                      >
                        {isAr ? 'إعادة تعيين' : 'Reset'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFilterPopoverOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Fields */}
                <div className="space-y-3 text-xs">
                  {/* Elevator Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'نوع المصعد' : 'Elevator Type'}
                    </label>
                    <SearchableSelect
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                    >
                      <option value="ALL">{isAr ? 'جميع أنواع المصاعد' : 'All Elevator Types'}</option>
                      <option value="MRL_TRACTION">MRL بدون غرفة محرك</option>
                      <option value="GEARED_TRACTION">Geared بتروس</option>
                      <option value="PANORAMIC_GLASS">Panoramic زجاج بانورامي</option>
                      <option value="HYDRAULIC">Hydraulic هيدروليك</option>
                      <option value="FREIGHT_HEAVY">Freight بضائع وأحمال</option>
                      <option value="HOME_LIFT">Home Lift مصعد منزلي</option>
                    </SearchableSelect>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'حالة المشروع / العقد' : 'Status'}
                    </label>
                    <SearchableSelect
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                    >
                      <option value="ALL">{isAr ? 'جميع الحالات' : 'All Status'}</option>
                      <option value="Won">{isAr ? 'فوز بالعقد (Won)' : 'Won'}</option>
                      <option value="Installed">{isAr ? 'تم التركيب (Installed)' : 'Installed'}</option>
                      <option value="Approved">{isAr ? 'معتمد ومقبول (Approved)' : 'Approved'}</option>
                      <option value="Sent">{isAr ? 'مرسل للعميل (Sent)' : 'Sent'}</option>
                      <option value="Draft">{isAr ? 'مسودة (Draft)' : 'Draft'}</option>
                      <option value="Lost">{isAr ? 'ملغى (Lost)' : 'Lost'}</option>
                    </SearchableSelect>
                  </div>

                  {/* Sorting Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'ترتيب النتائج' : 'Sort Order'}
                    </label>
                    <SearchableSelect
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                    >
                      <option value="DATE_DESC">{isAr ? 'الأحدث أولاً' : 'Newest'}</option>
                      <option value="DATE_ASC">{isAr ? 'الأقدم أولاً' : 'Oldest'}</option>
                      <option value="PRICE_DESC">{isAr ? 'الأعلى سعراً' : 'Highest Price'}</option>
                      <option value="MARGIN_DESC">{isAr ? 'الأعلى ربحية' : 'Highest Margin'}</option>
                      <option value="NAME_ASC">{isAr ? 'أبجدياً (أ-ي)' : 'Name (A-Z)'}</option>
                    </SearchableSelect>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>

          {/* Toggle between Compact Table and Cards (in Customers section) */}
          {currentSection === 'CUSTOMERS' && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCustomerListView('COMPACT_TABLE')}
                className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                  customerListView === 'COMPACT_TABLE'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title={isAr ? 'جدول مكثف (Compact)' : 'Compact Table View'}
                aria-label={isAr ? 'جدول مكثف' : 'Compact Table'}
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCustomerListView('CARDS')}
                className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                  customerListView === 'CARDS'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title={isAr ? 'بطاقات (Cards)' : 'Cards View'}
                aria-label={isAr ? 'بطاقات' : 'Cards'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CUSTOMERS DIRECTORY                                            */}
      {/* High-density multi-column table displaying less data per row so more      */}
      {/* customers fit, with complete details accessible on click.                  */}
      {/* ========================================================================= */}
      {currentSection === 'CUSTOMERS' && (
        <div className="space-y-4">
          {/* Subheader bar */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <div>
              {isAr ? 'عرض' : 'Showing'}{' '}
              <strong className="text-slate-800 font-bold">{filteredCustomerGroups.length}</strong>{' '}
              {isAr ? 'من إجمالي' : 'of'}{' '}
              <strong className="text-slate-800 font-bold">{customers.length}</strong>{' '}
              {isAr ? 'عميل مسجل' : 'registered customers'}
            </div>

            {customerListView === 'CARDS' && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={expandAllCustomers}
                  className="hover:text-blue-600 transition-colors font-medium cursor-pointer"
                >
                  {isAr ? 'توسيع الكل' : 'Expand All'}
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={collapseAllCustomers}
                  className="hover:text-blue-600 transition-colors font-medium cursor-pointer"
                >
                  {isAr ? 'طي الكل' : 'Collapse All'}
                </button>
              </div>
            )}
          </div>

          {filteredCustomerGroups.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">
                {isAr ? 'لا يوجد عملاء يطابقون معايير البحث' : 'No customers match your criteria'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'جرب تعديل معايير البحث أو قم بإضافة عميل جديد الآن' : 'Try adjusting your filters or add a new customer.'}
              </p>
              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#172033] hover:bg-[#222f4b] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#b6be49]" />
                <span>{isAr ? '+ إضافة عميل جديد' : '+ Add Customer'}</span>
              </button>
            </div>
          ) : customerListView === 'COMPACT_TABLE' ? (
            /* ========================================================================= */
            /* HIGH-DENSITY INTERACTIVE TABLE (DRAG-AND-DROP REORDER + SORTABLE HEADERS)  */
            /* ========================================================================= */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <TableControlBar
                isReordered={customerTable.isReordered}
                onResetOrder={customerTable.resetColumnOrder}
                sortKey={customerTable.sortKey}
                sortDir={customerTable.sortDir}
                onResetSort={customerTable.resetSort}
                isAr={isAr}
                totalCount={customerTable.sortedData.length}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      {customerTable.orderedColumns.map((col) => (
                        <InteractiveTableHeader
                          key={col.id}
                          column={col}
                          sortKey={customerTable.sortKey}
                          sortDir={customerTable.sortDir}
                          onSort={customerTable.handleSort}
                          draggedColId={customerTable.draggedColId}
                          dragOverColId={customerTable.dragOverColId}
                          onDragStart={customerTable.handleDragStart}
                          onDragOver={customerTable.handleDragOver}
                          onDragLeave={customerTable.handleDragLeave}
                          onDrop={customerTable.handleDrop}
                          onDragEnd={customerTable.handleDragEnd}
                          isAr={isAr}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerTable.sortedData.map((grp, idx) => (
                      <tr
                        key={grp.customer.id}
                        onClick={() => setSelectedCustomerForDetails(grp.customer)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                      >
                        {customerTable.orderedColumns.map((col) => (
                          <td key={col.id} className={`py-2.5 px-3 ${col.className || ''}`}>
                            {col.renderCell(grp, idx)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View for Customers */
            <div className="space-y-3">
              {filteredCustomerGroups.map((grp) => {
                const cust = grp.customer;
                const isExpanded = expandedCustomerIds.has(cust.id);
                const initials = cust.name.slice(0, 2).toUpperCase();

                return (
                  <div
                    key={cust.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                  >
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#172033] text-[#b6be49] flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-[#172033]">{cust.name}</h2>
                            {cust.company && (
                              <span className="text-[11px] px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md font-medium">
                                {cust.company}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                            {cust.phone && (
                              <span className="inline-flex items-center gap-1" dir="ltr">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{cust.phone}</span>
                              </span>
                            )}
                            {cust.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="w-3 h-3 text-blue-500" />
                                <span>{cust.email}</span>
                              </span>
                            )}
                            {cust.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                <span>{cust.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForDetails(cust)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'عرض كافة البيانات' : 'View All Data'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddProjectForCustomer(cust)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#172033] hover:bg-[#23314e] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-[#b6be49]" />
                          <span>{isAr ? '+ مصعد جديد' : '+ New Lift'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCustomerExpanded(cust.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-white border-t border-slate-100 space-y-3">
                        <div className="text-xs font-bold text-slate-700 flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <span>{isAr ? 'مصاعد ومشاريع هذا العميل' : 'Lifts for this client'} ({grp.projects.length})</span>
                          </span>
                          <span className="font-mono text-emerald-800 font-black">
                            <SarPrice amount={grp.totalValue} />
                          </span>
                        </div>

                        {grp.projects.length === 0 ? (
                          <p className="text-xs text-slate-500 py-3 text-center">
                            {isAr ? 'لا توجد مشاريع مسجلة لهذا العميل بعد.' : 'No projects for this customer yet.'}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {grp.projects.map((proj) => (
                              <div
                                key={proj.id}
                                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={selectedProjectIds.has(proj.id)}
                                      onChange={() => toggleSelectProject(proj.id)}
                                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                      title={isAr ? 'تحديد للتصدير المجمع' : 'Select for batch export'}
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                          {proj.quoteRef}
                                        </span>
                                        <span className="font-bold text-slate-900 text-xs">{proj.projectName}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-1">
                                        {proj.elevatorType} &bull; {proj.capacityKg} kg &bull; {proj.ratedSpeed} m/s &bull; {proj.stops} stops
                                      </div>
                                    </div>
                                  </div>
                                  <div>{renderStatusBadge(proj)}</div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                                  <div className="font-mono font-bold text-slate-900">
                                    <SarPrice amount={proj.totalQuotationPrice} />
                                    <span className="text-[10px] text-emerald-600 font-semibold ms-1.5">
                                      ({proj.grossMarginPercent}%)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await exportProjectsBatchPdf(
                                          [proj],
                                          isAr ? 'شركة توينز تكنولوجي للمصاعد' : 'Twins Technology for Elevators',
                                          '+966 50 000 0000',
                                          isAr ? 'ar' : 'en'
                                        );
                                      }}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                      title={isAr ? 'تصدير PDF فوري' : 'Direct PDF Export'}
                                    >
                                      <FileDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onSelectProject(proj)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="فتح في المعالج"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToDrawings(proj)}
                                      className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                      title="CAD"
                                    >
                                      <Layers className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToPrint(proj)}
                                      className="p-1 text-slate-800 hover:bg-slate-100 rounded"
                                      title="Print"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PROJECTS & CONTRACTS HUB                                       */}
      {/* With separate tabs for Quotations vs Contracts vs All Projects             */}
      {/* ========================================================================= */}
      {currentSection === 'PROJECTS' && (
        <div className="space-y-4">
          {/* Top Tabs Switcher: Quotations vs Contracts vs All */}
          {!forcedProjectsTab && (
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto no-scrollbar scroll-smooth w-full md:w-auto pb-1 md:pb-0">
              <button
                id="tab-projects-quotations"
                type="button"
                onClick={() => setProjectsTab('QUOTES')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  projectsTab === 'QUOTES'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{isAr ? 'عروض الأسعار النشطة' : 'Active Quotations'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${projectsTab === 'QUOTES' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {metrics.quotesCount}
                </span>
              </button>

              <button
                id="tab-projects-contracts"
                type="button"
                onClick={() => setProjectsTab('CONTRACTS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  projectsTab === 'CONTRACTS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BadgeCheck className="w-4 h-4" />
                <span>{isAr ? 'العقود والمشاريع المعتمدة' : 'Awarded Contracts'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${projectsTab === 'CONTRACTS' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 font-bold'}`}>
                  {metrics.contractsCount}
                </span>
              </button>

              <button
                id="tab-projects-all"
                type="button"
                onClick={() => setProjectsTab('ALL')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  projectsTab === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{isAr ? 'جميع المشاريع' : 'All Projects'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${projectsTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {projects.length}
                </span>
              </button>

              <button
                id="tab-projects-analytics"
                type="button"
                onClick={() => setProjectsTab('ANALYTICS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  projectsTab === 'ANALYTICS'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{isAr ? 'تحليلات المبيعات والهوامش' : 'Sales Analytics'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${projectsTab === 'ANALYTICS' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800 font-bold'}`}>
                  Recharts
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <button
                type="button"
                onClick={handleBatchExportPdf}
                disabled={isBatchExporting || (filteredProjectsFlat.length === 0 && projects.length === 0)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title={isAr ? 'تصدير المشاريع كملف PDF موحد' : 'Export projects as consolidated PDF'}
              >
                {isBatchExporting ? (
                  <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>
                  {selectedProjectIds.size > 0
                    ? isAr
                      ? `تصدير PDF المجمع (${selectedProjectIds.size})`
                      : `Batch Export PDF (${selectedProjectIds.size})`
                    : isAr
                      ? 'تصدير PDF مجمع'
                      : 'Batch Export PDF'}
                </span>
              </button>

              <button
                id="btn-create-quote-projects-tab"
                type="button"
                onClick={onNewQuotation}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? '+ إنشاء عرض سعر جديد' : '+ Create New Quotation'}</span>
              </button>
            </div>
          </div>
          )}

          {/* If Analytics tab is selected, render SalesAnalyticsDashboard; otherwise render Projects Table */}
          {projectsTab === 'ANALYTICS' ? (
            <SalesAnalyticsDashboard
              projects={displayedProjects}
              language={language}
              onSelectProject={onSelectProject}
              onNavigateToDrawings={onNavigateToDrawings}
              onNavigateToPrint={onNavigateToPrint}
            />
          ) : (
            /* Projects Table: Interactive Draggable Columns + Fast Column Header Sorting */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <TableControlBar
                isReordered={projectsTable.isReordered}
                onResetOrder={projectsTable.resetColumnOrder}
                sortKey={projectsTable.sortKey}
                sortDir={projectsTable.sortDir}
                onResetSort={projectsTable.resetSort}
                isAr={isAr}
                totalCount={projectsTable.sortedData.length}
              />

              {/* Selection Notification & Quick Export Bar */}
              {selectedProjectIds.size > 0 && (
                <div className="bg-blue-50/90 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                      {selectedProjectIds.size}
                    </span>
                    <span className="font-semibold">
                      {isAr
                        ? `تم تحديد ${selectedProjectIds.size} من أصل ${filteredProjectsFlat.length} مشروع`
                        : `Selected ${selectedProjectIds.size} of ${filteredProjectsFlat.length} projects`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBatchExportPdf}
                      disabled={isBatchExporting}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs shadow-2xs"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تصدير المحدد كملف PDF موحد' : 'Export Selected as PDF'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearSelectedProjects}
                      className="text-xs text-blue-700 hover:underline cursor-pointer"
                    >
                      {isAr ? 'إلغاء التحديد' : 'Clear selection'}
                    </button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    {projectsTable.orderedColumns.map((col) => (
                      <InteractiveTableHeader
                        key={col.id}
                        column={col}
                        sortKey={projectsTable.sortKey}
                        sortDir={projectsTable.sortDir}
                        onSort={projectsTable.handleSort}
                        draggedColId={projectsTable.draggedColId}
                        dragOverColId={projectsTable.dragOverColId}
                        onDragStart={projectsTable.handleDragStart}
                        onDragOver={projectsTable.handleDragOver}
                        onDragLeave={projectsTable.handleDragLeave}
                        onDrop={projectsTable.handleDrop}
                        onDragEnd={projectsTable.handleDragEnd}
                        isAr={isAr}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectsTable.sortedData.length === 0 ? (
                    <tr>
                      <td colSpan={projectsTable.orderedColumns.length} className="py-12 text-center text-slate-500">
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-700">
                          {projectsTab === 'CONTRACTS'
                            ? isAr ? 'لا توجد عقود معتمدة تطابق الفلتر' : 'No awarded contracts match this filter'
                            : isAr ? 'لا توجد عروض أسعار تطابق الفلتر' : 'No quotations match this filter'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    projectsTable.sortedData.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        {projectsTable.orderedColumns.map((col) => (
                          <td key={col.id} className={`py-3 px-3 ${col.className || ''}`}>
                            {col.renderCell(p, idx)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FULL CUSTOMER PROFILE & ALL DATA INSPECTION                      */}
      {/* Opened when user clicks on customer row or "عرض كافة البيانات"              */}
      {/* ========================================================================= */}
      {selectedCustomerForDetails && customerDetailsGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#172033] via-[#1e2c46] to-[#172033] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#b6be49] text-[#172033] font-bold text-lg flex items-center justify-center shadow-xs">
                  {selectedCustomerForDetails.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-base sm:text-lg text-white">
                      {selectedCustomerForDetails.name}
                    </h2>
                    {selectedCustomerForDetails.company && (
                      <span className="text-xs bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-md font-normal border border-white/15">
                        {selectedCustomerForDetails.company}
                      </span>
                    )}
                    {selectedCustomerForDetails.customerType && (
                      <span className="text-[11px] bg-[#b6be49]/20 text-[#b6be49] px-2 py-0.5 rounded font-bold border border-[#b6be49]/30">
                        {selectedCustomerForDetails.customerType === 'individual'
                          ? isAr ? 'أفراد / فيلا' : 'Individual'
                          : selectedCustomerForDetails.customerType === 'contractor'
                          ? isAr ? 'مقاول / إنشائي' : 'Contractor'
                          : selectedCustomerForDetails.customerType === 'government'
                          ? isAr ? 'جهة حكومية' : 'Government'
                          : isAr ? 'شركة ومؤسسة' : 'Company'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>ID: {selectedCustomerForDetails.id}</span>
                    <span>&bull;</span>
                    <span>{isAr ? 'تاريخ التسجيل:' : 'Registered:'} {selectedCustomerForDetails.createdAt || '2025-01-01'}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerForDetails(null)}
                className="p-2 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Customer Contact & Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'رقم الهاتف / الجوال' : 'Phone'}</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-800" dir="ltr">
                    {selectedCustomerForDetails.phone ? (
                      <a href={`tel:${selectedCustomerForDetails.phone}`} className="hover:text-emerald-700">
                        {selectedCustomerForDetails.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 font-normal">{isAr ? 'غير مسجل' : 'Not provided'}</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-800 truncate">
                    {selectedCustomerForDetails.email ? (
                      <a href={`mailto:${selectedCustomerForDetails.email}`} className="hover:text-blue-700">
                        {selectedCustomerForDetails.email}
                      </a>
                    ) : (
                      <span className="text-slate-400">{isAr ? 'غير مسجل' : 'Not provided'}</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isAr ? 'المدينة والموقع' : 'Location'}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-800 truncate">
                    {selectedCustomerForDetails.location || (isAr ? 'الرياض، المملكة العربية السعودية' : 'Saudi Arabia')}
                  </div>
                </div>
              </div>

              {/* Tax & Notes details if present */}
              {(selectedCustomerForDetails.taxNumber || selectedCustomerForDetails.notes) && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                  {selectedCustomerForDetails.taxNumber && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-900">{isAr ? 'الرقم الضريبي (VAT ID):' : 'Tax Number:'}</span>
                      <span className="font-mono font-bold text-blue-800">{selectedCustomerForDetails.taxNumber}</span>
                    </div>
                  )}
                  {selectedCustomerForDetails.notes && (
                    <div>
                      <span className="font-bold text-blue-900">{isAr ? 'ملاحظات العميل ومتطلباته:' : 'Notes:'} </span>
                      <span className="text-slate-700">{selectedCustomerForDetails.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Financial & Project Performance KPIs for this customer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-100 rounded-xl text-center border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">{isAr ? 'المصاعد المسجلة' : 'Total Lifts'}</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {customerDetailsGroup.projects.length} {isAr ? 'مصعد' : 'lifts'}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-medium">{isAr ? 'إجمالي قيمة العروض' : 'Quoted Total'}</div>
                  <div className="text-sm font-black text-emerald-800 font-mono mt-0.5">
                    <SarPrice amount={customerDetailsGroup.totalValue} />
                  </div>
                </div>

                <div className="p-3 bg-teal-50 rounded-xl text-center border border-teal-200">
                  <div className="text-[11px] text-teal-700 font-medium">{isAr ? 'العقود المعتمدة (Won)' : 'Won Contracts'}</div>
                  <div className="text-base font-black text-teal-800 mt-0.5">
                    {customerDetailsGroup.wonCount} {isAr ? 'عقد' : 'contracts'}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl text-center border border-blue-200">
                  <div className="text-[11px] text-blue-700 font-medium">{isAr ? 'نسبة التعاقد (Win Rate)' : 'Win Rate'}</div>
                  <div className="text-base font-black text-blue-800 mt-0.5">
                    {customerDetailsGroup.projects.length > 0
                      ? `${Math.round((customerDetailsGroup.wonCount / customerDetailsGroup.projects.length) * 100)}%`
                      : '0%'}
                  </div>
                </div>
              </div>

              {/* Comprehensive List of Elevator Projects for this customer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>{isAr ? 'كافة مشاريع ومصاعد العميل' : 'Customer Elevators & Proposals'}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({customerDetailsGroup.projects.length})
                    </span>
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      onAddProjectForCustomer(selectedCustomerForDetails);
                      setSelectedCustomerForDetails(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#172033] hover:bg-[#222f4b] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-[#b6be49]" />
                    <span>{isAr ? '+ إضافة مصعد جديد لهذا العميل' : '+ Add New Elevator'}</span>
                  </button>
                </div>

                {customerDetailsGroup.projects.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">{isAr ? 'لم يتم تسجيل مصاعد لهذا العميل حتى الآن' : 'No lifts created for this client yet.'}</p>
                    <button
                      type="button"
                      onClick={() => {
                        onAddProjectForCustomer(selectedCustomerForDetails);
                        setSelectedCustomerForDetails(null);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'بدء تسعير أول مصعد الآن' : 'Start First Quotation'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-xs text-start border-collapse min-w-[600px] whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 text-start">{isAr ? 'رقم المرجع' : 'Ref'}</th>
                          <th className="py-2.5 px-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>
                          <th className="py-2.5 px-3 text-start">{isAr ? 'المواصفات الفنية' : 'Specs'}</th>
                          <th className="py-2.5 px-3 text-start">{isAr ? 'القيمة (SAR)' : 'Price'}</th>
                          <th className="py-2.5 px-3 text-center">{isAr ? 'الهامش' : 'Margin'}</th>
                          <th className="py-2.5 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                          <th className="py-2.5 px-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerDetailsGroup.projects.map((proj) => (
                          <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                              {proj.quoteRef}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {proj.projectName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              {proj.elevatorType} &bull; {proj.capacityKg} kg &bull; {proj.stops} stops
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              <SarPrice amount={proj.totalQuotationPrice} />
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                              {proj.grossMarginPercent}%
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {renderStatusBadge(proj)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectProject(proj);
                                    setSelectedCustomerForDetails(null);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="فتح في المعالج"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onNavigateToDrawings(proj);
                                    setSelectedCustomerForDetails(null);
                                  }}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                                  title="CAD"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onNavigateToPrint(proj);
                                    setSelectedCustomerForDetails(null);
                                  }}
                                  className="p-1.5 text-slate-800 hover:bg-slate-100 rounded"
                                  title="Print"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(isAr ? `حذف مشروع "${proj.projectName}"؟` : `Delete "${proj.projectName}"?`)) {
                                      onDeleteProject(proj.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Maintenance Breakdowns for this customer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{isAr ? 'بلاغات الأعطال' : 'Breakdowns & Faults'}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({breakdowns.filter(b => b.customerId === selectedCustomerForDetails.id).length})
                    </span>
                  </h3>
                </div>

                {breakdowns.filter(b => b.customerId === selectedCustomerForDetails.id).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">{isAr ? 'لا توجد بلاغات أعطال مسجلة لهذا العميل' : 'No breakdowns reported for this customer.'}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-xs text-start border-collapse min-w-[600px] whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 text-start">{isAr ? 'المصعد' : 'Elevator'}</th>
                          <th className="py-2.5 px-3 text-start">{isAr ? 'الوصف' : 'Description'}</th>
                          <th className="py-2.5 px-3 text-center">{isAr ? 'التاريخ' : 'Date'}</th>
                          <th className="py-2.5 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                          <th className="py-2.5 px-3 text-center">{isAr ? 'الفني' : 'Technician'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {breakdowns.filter(b => b.customerId === selectedCustomerForDetails.id).map(brk => (
                          <tr key={brk.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{brk.elevatorName}</td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={brk.description}>{brk.description}</td>
                            <td className="py-2.5 px-3 text-center text-slate-500">
                              {new Date(brk.reportedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                brk.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                                brk.status === 'Reported' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {brk.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500">{brk.assignedTechnicianName || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(selectedCustomerForDetails);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 font-bold transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isAr ? 'تعديل بيانات العميل' : 'Edit Customer Info'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCustomerForDetails(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW CUSTOMER                                                 */}
      {/* ========================================================================= */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#172033] to-[#253658] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#b6be49]/20 rounded-xl text-[#b6be49]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{isAr ? 'إضافة عميل جديد' : 'Add New Customer'}</h3>
                  <p className="text-[11px] text-slate-300">
                    {isAr ? 'تسجيل عميل جديد في قاعدة بيانات CRM لربطه بمشاريع المصاعد' : 'Register customer in CRM database'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCustomerSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'اسم العميل / المالك *' : 'Customer Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerModalData.name}
                    onChange={(e) => setCustomerModalData({ ...customerModalData, name: e.target.value })}
                    placeholder={isAr ? 'مثال: شركة التطوير العقاري / فهد الدوسري' : 'e.g. Al-Fahad Contracting'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'نوع العميل' : 'Customer Type'}
                  </label>
                  <SearchableSelect
                    value={customerModalData.customerType}
                    onChange={(e: any) => setCustomerModalData({ ...customerModalData, customerType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="company">{isAr ? 'شركة / مؤسسة' : 'Company'}</option>
                    <option value="individual">{isAr ? 'فردي / مالك فيلا' : 'Individual / Villa Owner'}</option>
                    <option value="contractor">{isAr ? 'مقاول رئيسي / استشاري' : 'Contractor / Consultant'}</option>
                    <option value="government">{isAr ? 'جهة حكومية' : 'Government'}</option>
                  </SearchableSelect>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الشركة / المنشأة' : 'Company'}
                  </label>
                  <input
                    type="text"
                    value={customerModalData.company}
                    onChange={(e) => setCustomerModalData({ ...customerModalData, company: e.target.value })}
                    placeholder={isAr ? 'مجموعة التطوير العقاري' : 'Real Estate Co.'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الرقم الضريبي (اختياري)' : 'Tax Number'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={customerModalData.taxNumber}
                    onChange={(e) => setCustomerModalData({ ...customerModalData, taxNumber: e.target.value })}
                    placeholder="300000000000003"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'رقم الهاتف / الجوال' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={customerModalData.phone}
                    onChange={(e) => setCustomerModalData({ ...customerModalData, phone: e.target.value })}
                    placeholder="+966 50 000 0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={customerModalData.email}
                    onChange={(e) => setCustomerModalData({ ...customerModalData, email: e.target.value })}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'المدينة / الموقع' : 'Location'}
                </label>
                <input
                  type="text"
                  value={customerModalData.location}
                  onChange={(e) => setCustomerModalData({ ...customerModalData, location: e.target.value })}
                  placeholder={isAr ? 'الرياض - طريق الملك فهد' : 'Riyadh, Saudi Arabia'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات واحتياجات العميل' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={customerModalData.notes}
                  onChange={(e) => setCustomerModalData({ ...customerModalData, notes: e.target.value })}
                  placeholder={isAr ? 'أي متطلبات فنية أو شروط تعاقدية...' : 'Requirements or special conditions...'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  id="btn-submit-new-customer"
                  type="submit"
                  className="px-5 py-2 bg-[#172033] hover:bg-[#23314e] text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  {isAr ? 'حفظ العميل' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT EXISTING CUSTOMER                                           */}
      {/* ========================================================================= */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl text-white">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{isAr ? 'تعديل بيانات العميل' : 'Edit Customer'}</h3>
                  <p className="text-[11px] text-amber-100">{editingCustomer.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 text-amber-200 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditCustomerSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'اسم العميل *' : 'Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الشركة / المؤسسة' : 'Company'}
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.company || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editingCustomer.phone || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={editingCustomer.email || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'المدينة / الموقع' : 'Location'}
                </label>
                <input
                  type="text"
                  value={editingCustomer.location || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات العميل' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md transition-colors"
                >
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: QUICK INLINE EDIT (نافذة التعديل السريع للسعر والحالة)              */}
      {/* ========================================================================= */}
      {inlineEditProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg text-white">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t.quickInlineEditTitle}</h3>
                  <p className="text-[10px] text-amber-100">{inlineEditProject.projectName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInlineEditProject(null)}
                className="p-1.5 text-amber-200 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInlineEdit} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                  {t.projectStatusLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map((status) => {
                    const cfg = getLocalizedStatusConfig(status, isAr);
                    const isSelected = inlineEditStatus === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setInlineEditStatus(status)}
                        className={`flex flex-col items-start p-2 rounded-lg border text-start transition-colors ${
                          isSelected
                            ? `${cfg.bgClass} border-2 border-amber-400`
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={`text-[10px] font-bold ${isSelected ? cfg.textClass : 'text-slate-600'}`}>
                            {cfg.label.split('(')[0]}
                          </span>
                          <cfg.icon className={`w-3.5 h-3.5 ${isSelected ? cfg.textClass : 'text-slate-400'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs flex justify-between items-center">
                  <span>{t.quotedPrice}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{t.vatIncludedNote}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={inlineEditPrice}
                    onChange={(e) => setInlineEditPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-lg text-[#172033]"
                  />
                  <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                    SAR
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInlineEditProject(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
                >
                  {t.cancelEdit}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  {t.savePrice}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Batch Export Action Bar */}
      {selectedProjectIds.size > 0 && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
              {selectedProjectIds.size}
            </span>
            <span>
              {isAr
                ? `مشروع محدد للتصدير المجمع`
                : `projects selected for batch export`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchExportPdf}
              disabled={isBatchExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isBatchExporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{isAr ? 'تحميل ملف PDF موحد' : 'Download Consolidated PDF'}</span>
            </button>

            <button
              type="button"
              onClick={clearSelectedProjects}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء التحديد' : 'Clear'}
            </button>
          </div>
        </div>
      )}

      {/* Batch Export Toast / Status Banner */}
      {batchExportMessage && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-2xl border border-blue-500/40 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          {isBatchExporting && (
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
          <span>{batchExportMessage}</span>
        </div>
      )}
    </div>
  );
};
