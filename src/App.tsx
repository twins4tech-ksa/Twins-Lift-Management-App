import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ElevatorSpecification, ProjectStatus, Customer } from './types/elevator';
import { MaintenanceBreakdown } from './types/maintenance';
import { SAMPLE_HISTORICAL_PROJECTS, SAMPLE_CUSTOMERS, DEFAULT_ELEVATOR_SPEC } from './data/sampleProjects';
import { QuotationWizard } from './components/QuotationWizard';
import { ElevatorDrawings } from './components/ElevatorDrawings';
import { ComponentsView } from './components/ComponentsView';
import { HistoricalDashboard } from './components/HistoricalDashboard';
import { PrintQuotation } from './components/PrintQuotation';
import { SettingsView } from './components/SettingsView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { TwinsLogo } from './components/TwinsLogo';
import { AppFooter } from './components/AppFooter';
import { SupplierPortalView } from './components/SupplierPortalView';
import { 
  Wand2, 
  Layers, 
  Package, 
  BarChart3, 
  Printer, 
  FileSpreadsheet, 
  ExternalLink,
  Plus,
  CheckCircle2,
  Info,
  Briefcase,
  Users,
  Settings as SettingsIcon,
  Globe,
  Menu,
  X,
  Wrench,
  Award,
  UserCheck,
  BadgeCheck,
  FileText,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Building2,
  MapPin,
  Boxes,
  Database,
  AlertCircle,
  Clock
} from 'lucide-react';
import { DatabaseStatusModal, DbStatusInfo } from './components/DatabaseStatusModal';
import { InventoryItem, InventoryMovement, Vendor } from './types/inventory';
import { SAMPLE_INVENTORY, SAMPLE_INVENTORY_MOVEMENTS, SAMPLE_VENDORS } from './data/sampleInventory';
import { InventoryView } from './components/InventoryView';
import { MapDashboardView } from './components/MapDashboardView';
import { 
  syncAllProjectsToSheet, 
  appendQuotationToSheet 
} from './services/googleSheetsService';
import { generateComponentList, calculateQuotationFinancials } from './utils/pricingEngine';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS, AutoSyncLogEntry } from './types/settings';
import { AppLanguage, TRANSLATIONS } from './utils/translations';
import MaintenanceDashboard from './components/MaintenanceDashboard';
import { MaintenanceContract, SAMPLE_MAINTENANCE_CONTRACTS, SAMPLE_BREAKDOWNS } from './types/maintenance';
import EmployeesDashboard from './components/EmployeesDashboard';
import { Employee, SAMPLE_EMPLOYEES, SAMPLE_ATTENDANCE_RECORDS, SiteAttendanceRecord } from './types/employee';
import { getContractExpiryInfo } from './utils/maintenanceExpiry';
import { MaintenanceSchedulesView } from './components/MaintenanceSchedulesView';
import { MaintenanceBreakdownsView } from './components/MaintenanceBreakdownsView';
import { SiteAttendanceModal } from './components/SiteAttendanceModal';
import { NavTab } from './types/navigation';
import { 
  UserProfile, 
  UserPortalRole, 
  ROLE_PRIVILEGES_MAP, 
  SAMPLE_USER_PROFILES 
} from './types/portal';
import { PortalHeaderBadge } from './components/PortalHeaderBadge';
import { PortalSwitcherModal } from './components/PortalSwitcherModal';
import { CustomerPortalView } from './components/CustomerPortalView';
import { TechnicianPortalView } from './components/TechnicianPortalView';
import { DesktopSidebar } from './components/DesktopSidebar';
import { QuickCreateMenu } from './components/QuickCreateMenu';
import { QuickAddCustomerModal } from './components/QuickAddCustomerModal';
import { BreakdownModal } from './components/BreakdownModal';
import { UserProfileMenu } from './components/UserProfileMenu';
import { InAppNotificationsPopover } from './components/InAppNotificationsPopover';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { exportElementToPdf } from './utils/pdfExport';
import { RenewalQuotationEmailModal } from './components/RenewalQuotationEmailModal';

const STORAGE_KEY_PROJECTS = 'vvt_elevator_projects_v1';
const STORAGE_KEY_ACTIVE_SPEC = 'vvt_elevator_active_spec_v1';
const STORAGE_KEY_CUSTOMERS = 'vvt_elevator_customers_v1';
const STORAGE_KEY_MAINTENANCE = 'vvt_elevator_maintenance_contracts_v1';
const STORAGE_KEY_EMPLOYEES = 'vvt_elevator_employees_v1';
const STORAGE_KEY_SHEETS_CONFIG = 'vvt_elevator_sheets_config_v1';
const STORAGE_KEY_SYNC_LOGS = 'vvt_elevator_sheets_sync_logs_v1';
const STORAGE_KEY_BREAKDOWNS = 'vvt_elevator_breakdowns_v1';
const STORAGE_KEY_SETTINGS = 'vvt_elevator_settings_v1';
const STORAGE_KEY_LANG = 'vvt_elevator_lang_v1';
const STORAGE_KEY_ACTIVE_PORTAL = 'vvt_elevator_active_portal_v1';
const STORAGE_KEY_INVENTORY = 'vvt_elevator_inventory_v1';
const STORAGE_KEY_INVENTORY_MOVEMENTS = 'vvt_elevator_inventory_movements_v1';
const STORAGE_KEY_VENDORS = 'vvt_elevator_vendors_v1';

export default function App() {
  // Company and Branding Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored settings', e);
    }
    return DEFAULT_COMPANY_SETTINGS;
  });

  // App Language: Default to Arabic ('ar') as requested by user
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LANG);
      if (stored === 'ar' || stored === 'en') return stored;
    } catch (e) {
      console.warn('Could not read stored language', e);
    }
    return 'ar';
  });

  // Load registered customers from localStorage or default to SAMPLE_CUSTOMERS
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored customers', e);
    }
    return SAMPLE_CUSTOMERS;
  });

  // Load historical projects from localStorage or default to SAMPLE_HISTORICAL_PROJECTS
  const [projects, setProjects] = useState<ElevatorSpecification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored projects', e);
    }
    return SAMPLE_HISTORICAL_PROJECTS;
  });

  // Active elevator specification being calculated/viewed
  const [currentSpec, setCurrentSpec] = useState<ElevatorSpecification>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_SPEC);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored active spec', e);
    }
    return SAMPLE_HISTORICAL_PROJECTS[0];
  });

  // Maintenance Contracts & Schedules state
  const [maintenanceContracts, setMaintenanceContracts] = useState<MaintenanceContract[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MAINTENANCE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored maintenance contracts', e);
    }
    return SAMPLE_MAINTENANCE_CONTRACTS;
  });

  // Maintenance Breakdowns state
  const [breakdowns, setBreakdowns] = useState<MaintenanceBreakdown[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BREAKDOWNS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored breakdowns', e);
    }
    return SAMPLE_BREAKDOWNS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BREAKDOWNS, JSON.stringify(breakdowns));
  }, [breakdowns]);

  const handleAddBreakdown = (breakdown: MaintenanceBreakdown) => {
    setBreakdowns([breakdown, ...breakdowns]);
  };

  const handleUpdateBreakdown = (updated: MaintenanceBreakdown) => {
    setBreakdowns(breakdowns.map(b => b.id === updated.id ? updated : b));
  };

  // Employees & Sales Representatives state
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored employees', e);
    }
    return SAMPLE_EMPLOYEES;
  });

  // Attendance states
  const [attendanceRecords, setAttendanceRecords] = useState<SiteAttendanceRecord[]>(SAMPLE_ATTENDANCE_RECORDS);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceModalEmpId, setAttendanceModalEmpId] = useState<string | undefined>();
  const [attendanceModalProjId, setAttendanceModalProjId] = useState<string | undefined>();

  const handleOpenAttendanceModal = (empId?: string, projId?: string) => {
    setAttendanceModalEmpId(empId);
    setAttendanceModalProjId(projId);
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendanceRecord = (record: SiteAttendanceRecord) => {
    setAttendanceRecords([record, ...attendanceRecords]);
    setIsAttendanceModalOpen(false);
  };

  // Warehouse & Inventory ERP State
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored inventory', e);
    }
    return SAMPLE_INVENTORY;
  });

  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INVENTORY_MOVEMENTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored inventory movements', e);
    }
    return SAMPLE_INVENTORY_MOVEMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
    } catch (e) {
      console.warn('Could not save inventory to localStorage', e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY_MOVEMENTS, JSON.stringify(inventoryMovements));
    } catch (e) {
      console.warn('Could not save inventory movements to localStorage', e);
    }
  }, [inventoryMovements]);

  // Approved Vendors / Suppliers State
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_VENDORS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored vendors', e);
    }
    return SAMPLE_VENDORS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(vendors));
    } catch (e) {
      console.warn('Could not save vendors to localStorage', e);
    }
  }, [vendors]);

  const handleAddVendor = (vendorData: Omit<Vendor, 'id'>) => {
    const newVendor: Vendor = {
      ...vendorData,
      id: `VND-${Date.now().toString().slice(-6)}`,
    };
    setVendors((prev) => [newVendor, ...prev]);
    showToast(language === 'ar' ? 'تم تسجيل المورد المعتمد بنجاح' : 'Vendor registered successfully');
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    setVendors((prev) => prev.map((v) => (v.id === updatedVendor.id ? updatedVendor : v)));
    showToast(language === 'ar' ? 'تم تحديث بيانات المورد بنجاح' : 'Vendor updated successfully');
  };

  const handleDeleteVendor = (vendorId: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
    showToast(language === 'ar' ? 'تم حذف المورد من الدليل' : 'Vendor deleted');
  };

  // Inventory CRUD and Stock Adjustment Handlers
  const handleAddInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `INV-${Date.now().toString().slice(-6)}`,
    };
    setInventory((prev) => [newItem, ...prev]);

    if (newItem.quantityOnHand > 0) {
      const newMovement: InventoryMovement = {
        id: `mov-${Date.now()}`,
        itemId: newItem.id,
        itemName: newItem.nameAr,
        sku: newItem.sku,
        type: 'IN',
        quantity: newItem.quantityOnHand,
        previousQty: 0,
        newQty: newItem.quantityOnHand,
        date: new Date().toLocaleString(),
        referenceType: 'MANUAL',
        referenceLabel: language === 'ar' ? 'رصيد افتتاحي أولي' : 'Initial Stock',
        performedBy: currentUserProfile?.name || (language === 'ar' ? 'مسؤول المستودع' : 'Warehouse Admin'),
        notes: language === 'ar' ? 'إدخال رصيد أولي عند تعريف الصنف' : 'Initial stock recorded',
      };
      setInventoryMovements((prev) => [newMovement, ...prev]);
    }
  };

  const handleUpdateInventoryItem = (updatedItem: InventoryItem) => {
    setInventory((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleDeleteInventoryItem = (itemId: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== itemId));
    showToast(language === 'ar' ? 'تم حذف الصنف من المستودع بنجاح' : 'Inventory item removed');
  };

  const handleAdjustStock = (
    itemId: string,
    changeQty: number,
    type: 'IN' | 'OUT' | 'ADJUST' | 'RESERVE',
    meta: {
      referenceType?: 'PROJECT' | 'BREAKDOWN' | 'PURCHASE_ORDER' | 'MAINTENANCE' | 'MANUAL';
      referenceId?: string;
      referenceLabel?: string;
      notes?: string;
      performedBy?: string;
    }
  ) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const prevQty = item.quantityOnHand;
        let nextQty = prevQty;
        let nextReserved = item.quantityReserved || 0;

        if (type === 'IN') {
          nextQty = prevQty + changeQty;
        } else if (type === 'OUT') {
          nextQty = Math.max(0, prevQty - changeQty);
        } else if (type === 'ADJUST') {
          nextQty = Math.max(0, changeQty);
        } else if (type === 'RESERVE') {
          nextReserved = nextReserved + changeQty;
        }

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          itemId: item.id,
          itemName: item.nameAr,
          sku: item.sku,
          type,
          quantity: changeQty,
          previousQty: prevQty,
          newQty: nextQty,
          date: new Date().toLocaleString(),
          referenceType: meta.referenceType,
          referenceId: meta.referenceId,
          referenceLabel: meta.referenceLabel,
          performedBy:
            meta.performedBy ||
            currentUserProfile?.name ||
            (language === 'ar' ? 'مسؤول المستودع' : 'Warehouse Admin'),
          notes: meta.notes,
        };
        setInventoryMovements((mPrev) => [movement, ...mPrev]);

        return {
          ...item,
          quantityOnHand: nextQty,
          quantityReserved: nextReserved,
          lastRestockedAt: type === 'IN' ? new Date().toISOString().slice(0, 10) : item.lastRestockedAt,
        };
      })
    );
  };

  const [activeTab, setActiveTab] = useState<NavTab>('CUSTOMERS');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [isQuickBreakdownModalOpen, setIsQuickBreakdownModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [renewalQuotationContract, setRenewalQuotationContract] = useState<MaintenanceContract | null>(null);

  // PostgreSQL Database Live Health Check
  const [dbStatus, setDbStatus] = useState<DbStatusInfo>({
    connected: false,
    status: 'checking',
    message: 'جاري فحص الاتصال...'
  });
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [customDbUrl, setCustomDbUrl] = useState(() => {
    return localStorage.getItem('TWINS_CUSTOM_POSTGRES_URL') || '';
  });

  const checkDbHealth = useCallback(async (testUrl?: string) => {
    try {
      const urlToCheck = testUrl !== undefined ? testUrl : (localStorage.getItem('TWINS_CUSTOM_POSTGRES_URL') || '');
      const res = await fetch('/api/db-health', {
        method: urlToCheck ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: urlToCheck ? JSON.stringify({ url: urlToCheck }) : undefined
      });
      if (res.ok) {
        const data = await res.json();
        setDbStatus({
          connected: Boolean(data.connected),
          status: data.connected ? 'connected' : 'disconnected',
          host: data.host,
          port: data.port,
          database: data.database,
          message: data.message,
          lastChecked: data.timestamp || new Date().toISOString()
        });
      } else {
        setDbStatus({
          connected: false,
          status: 'disconnected',
          message: 'خطأ في الاتصال بنقطة الفحص',
          lastChecked: new Date().toISOString()
        });
      }
    } catch (e: any) {
      setDbStatus({
        connected: false,
        status: 'disconnected',
        message: e?.message || 'تعذر الوصول لخادم الفحص',
        lastChecked: new Date().toISOString()
      });
    }
  }, []);

  useEffect(() => {
    checkDbHealth();
    const timer = setInterval(() => {
      checkDbHealth();
    }, 45000);
    return () => clearInterval(timer);
  }, [checkDbHealth]);

  const handleSaveCustomDbUrl = async (url: string) => {
    setCustomDbUrl(url);
    if (url) {
      localStorage.setItem('TWINS_CUSTOM_POSTGRES_URL', url);
    } else {
      localStorage.removeItem('TWINS_CUSTOM_POSTGRES_URL');
    }
    await checkDbHealth(url);
  };

  const handleLogout = () => {
    showToast(
      language === 'ar' 
        ? 'تم تسجيل الخروج بنجاح من الجلسة الحالية' 
        : 'Logged out successfully from current session'
    );
    setIsPortalModalOpen(true);
  };

  // User Portal & Role-Based Access Control (RBAC)
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_PORTAL);
      if (stored && stored !== 'undefined' && stored !== 'null') {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.role && ROLE_PRIVILEGES_MAP[parsed.role]) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read stored portal profile', e);
    }
    return SAMPLE_USER_PROFILES[0]; // Default to Management / المدير العام
  });
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  const currentRole: UserPortalRole = currentUserProfile?.role && ROLE_PRIVILEGES_MAP[currentUserProfile.role] 
    ? currentUserProfile.role 
    : 'MANAGEMENT';

  const handleSelectUserProfile = (profile: UserProfile) => {
    const validProfile = profile && profile.role && ROLE_PRIVILEGES_MAP[profile.role]
      ? profile
      : SAMPLE_USER_PROFILES[0];

    setCurrentUserProfile(validProfile);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PORTAL, JSON.stringify(validProfile));
    } catch (e) {
      console.warn('Could not save active portal profile', e);
    }
    
    // Auto redirect to suitable view based on selected role
    if (validProfile.role === 'CUSTOMER') {
      setActiveTab('CUSTOMER_PORTAL');
      showToast(language === 'ar' ? `مرحباً بك في بوابة العميل: ${validProfile.name}` : `Welcome to Customer Portal: ${validProfile.name}`);
    } else if (validProfile.role === 'TECHNICIAN') {
      setActiveTab('TECHNICIAN_PORTAL');
      showToast(language === 'ar' ? `مرحباً بك في لوحة الفني الميداني: ${validProfile.name}` : `Welcome Technician: ${validProfile.name}`);
    } else if (validProfile.role === 'SALES_REP') {
      setActiveTab('SALES_QUOTATIONS');
      showToast(language === 'ar' ? `مرحباً بك ممثل المبيعات: ${validProfile.name}` : `Welcome Sales Rep: ${validProfile.name}`);
    } else {
      setActiveTab('CUSTOMERS');
      showToast(language === 'ar' ? `تم تفعيل صلاحيات الإدارة العليا الكاملة: ${validProfile.name}` : `Admin & Management mode: ${validProfile.name}`);
    }
  };

  // Google Sheets state
  const [sheetsConfig, setSheetsConfig] = useState<{
    spreadsheetId: string;
    sheetUrl: string;
    accessToken: string;
    lastSyncedAt?: string;
  }>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SHEETS_CONFIG);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored sheets config', e);
    }
    return {
      spreadsheetId: '',
      sheetUrl: '',
      accessToken: '',
    };
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Deep-linking & QR Code digital project loader
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('project');
      const quoteRef = params.get('ref') || params.get('quoteRef');
      const doc = params.get('doc');

      if (projectId || quoteRef) {
        const found = projects.find(p => 
          (projectId && p.id === projectId) || 
          (quoteRef && p.quoteRef === quoteRef)
        ) || SAMPLE_HISTORICAL_PROJECTS.find(p => 
          (projectId && p.id === projectId) || 
          (quoteRef && p.quoteRef === quoteRef)
        );

        if (found) {
          setCurrentSpec(found);
          try {
            localStorage.setItem(STORAGE_KEY_ACTIVE_SPEC, JSON.stringify(found));
          } catch (err) {
            console.warn(err);
          }

          if (doc === 'drawings') {
            setActiveTab('DRAWINGS');
          } else if (doc === 'wizard') {
            setActiveTab('WIZARD');
          } else if (doc === 'components') {
            setActiveTab('COMPONENTS');
          } else {
            setActiveTab('PRINT');
          }

          showToast(
            language === 'ar'
              ? `تم تحميل النسخة الرقمية للمشروع المعتمد: ${found.projectName} (${found.quoteRef})`
              : `Loaded digital project: ${found.projectName} (${found.quoteRef})`
          );
        }
      }
    } catch (err) {
      console.warn('Could not parse digital project URL parameters', err);
    }
  }, []);

  // Persist customers to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.warn('Failed to save customers to localStorage', e);
    }
  }, [customers]);

  // Persist projects to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage', e);
    }
  }, [projects]);

  // Persist active spec to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SPEC, JSON.stringify(currentSpec));
    } catch (e) {
      console.warn('Failed to save active spec to localStorage', e);
    }
  }, [currentSpec]);

  // Persist company settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(companySettings));
    } catch (e) {
      console.warn('Failed to save company settings to localStorage', e);
    }
  }, [companySettings]);

  // Persist language and update HTML document direction
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    } catch (e) {
      console.warn('Failed to save language to localStorage', e);
    }
  }, [language]);

  // Persist maintenance contracts
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(maintenanceContracts));
    } catch (e) {
      console.warn('Failed to save maintenance contracts to localStorage', e);
    }
  }, [maintenanceContracts]);

  // Persist employees & sales reps
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.warn('Failed to save employees to localStorage', e);
    }
  }, [employees]);

  const handleSaveEmployee = (emp: Employee) => {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === emp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = emp;
        return next;
      }
      return [emp, ...prev];
    });
    showToast(language === 'ar' ? 'تم حفظ وتحديث بيانات الموظف/المندوب بنجاح' : 'Staff member saved successfully');
  };

  const handleDeleteEmployee = (empId: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== empId));
    showToast(language === 'ar' ? 'تم حذف الموظف من السجلات' : 'Staff member deleted');
  };

  const handleSaveMaintenanceContract = (updatedContract: MaintenanceContract) => {
    setMaintenanceContracts((prev) => {
      const idx = prev.findIndex(c => c.id === updatedContract.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedContract;
        return next;
      }
      return [updatedContract, ...prev];
    });
    showToast(language === 'ar' ? 'تم حفظ جدول وعقد الصيانة بنجاح!' : 'Maintenance contract & schedule saved successfully!');
  };

  const handleDeleteMaintenanceContract = (contractId: string) => {
    setMaintenanceContracts((prev) => prev.filter(c => c.id !== contractId));
    showToast(language === 'ar' ? 'تم حذف عقد الصيانة' : 'Maintenance contract deleted');
  };

  // Contracts expiring within the next 30 days
  const expiringContractsCount = React.useMemo(() => {
    return maintenanceContracts.filter((c) => {
      const info = getContractExpiryInfo(c, 30);
      return info && info.isExpiringSoon && c.isContract && c.status === 'Active';
    }).length;
  }, [maintenanceContracts]);

  // Automated notification system: Flags maintenance contracts expiring in under 30 days
  useEffect(() => {
    if (expiringContractsCount > 0) {
      const hasNotified = sessionStorage.getItem('vvt_notified_expiring_contracts_session');
      if (!hasNotified) {
        sessionStorage.setItem('vvt_notified_expiring_contracts_session', 'true');
        setTimeout(() => {
          showToast(
            language === 'ar'
              ? `🔔 تنبيه الصيانة: لديك ${expiringContractsCount} عقد صيانة ينتهي خلال أقل من 30 يوماً!`
              : `🔔 Maintenance Alert: ${expiringContractsCount} contract(s) expiring in under 30 days!`
          );
        }, 1500);
      }
    }
  }, [expiringContractsCount, language]);

  // Update spec helper
  const handleUpdateSpec = (updated: Partial<ElevatorSpecification>) => {
    setCurrentSpec((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  // Save current project to historical database
  const handleSaveToHistorical = () => {
    setProjects((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === currentSpec.id || p.quoteRef === currentSpec.quoteRef);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex] = currentSpec;
        return next;
      }
      return [currentSpec, ...prev];
    });
    showToast(`Quotation "${currentSpec.quoteRef}" saved to Historical Projects Database!`);
  };

  // Create fresh blank quotation
  const handleNewQuotation = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().split('T')[0];
    const newSpec: ElevatorSpecification = {
      id: `proj-${Date.now()}`,
      quoteRef: `TL-QT-2026-${randomNum}`,
      projectName: 'New Commercial Tower Lift',
      clientName: 'Prime Real Estate Development',
      clientEmail: 'procurement@prime-estate.example.com',
      clientPhone: '+971 4 555-0199',
      siteLocation: 'Plot B12, Business Bay, Dubai',
      consultant: 'Apex Engineering Consultants',
      date: dateStr,
      validityDays: 30,
      status: 'Draft',
      elevatorType: 'MRL_TRACTION',
      buildingType: 'Commercial Office',
      capacityKg: 1000,
      personsCount: 13,
      ratedSpeed: 1.6,
      stops: 12,
      openings: 12,
      travelHeightM: 38.4,
      floorToFloorM: 3.2,
      shaftWidthMm: 2100,
      shaftDepthMm: 2100,
      pitDepthMm: 1500,
      overheadHeightMm: 4200,
      cabinWidthMm: 1600,
      cabinDepthMm: 1400,
      cabinHeightMm: 2400,
      doorType: 'CENTER_2P',
      doorWidthMm: 900,
      doorHeightMm: 2100,
      counterweightPosition: 'REAR',
      wallStructure: 'CONCRETE',
      wallFinish: 'BRUSHED_STEEL_304',
      ceilingStyle: 'LED_DOWNLIGHTS_CUTOUT',
      floorFinish: 'GRANITE_BLACK_GALAXY',
      handrailType: 'ROUND_BRUSHED_STAINLESS',
      copDisplayType: 'TFT_7_INCH_COLOR',
      ropingRatio: '2:1',
      machineLocation: 'MRL_TOP',
      powerSupply: '400V_3PH_50HZ',
      baseEquipmentCost: 21500,
      finishesAddonCost: 2800,
      optionsAddonCost: 3500,
      installationCommissioningCost: 6500,
      shippingFreightCost: 2000,
      automaticRescueDeviceARD: true,
      regenerativeDriveUnit: true,
      firemanServiceEN8172: true,
      seismicSensorEN8177: false,
      voiceSynthesizer: true,
      airPurifierSterilizer: true,
      accessControlCardReader: false,
      cctvShaftCabling: true,
      steelPriceIndexFactor: 1.0,
      copperPriceIndexFactor: 1.0,
      electronicsPriceIndexFactor: 1.0,
      markupPercentage: 28,
      discountPercentage: 0,
      taxPercentage: 5,
      paymentTerms: '30% Advance, 50% on Material Delivery, 20% on Testing & Handover',
      deliveryWeeks: 8,
      warrantyMonths: 24,
      subtotalCost: 31800,
      totalQuotationPrice: 42739,
      grossProfit: 8904,
      grossMarginPercent: 21.9,
      notes: 'Turnkey specification including EN 81-20 compliant car sling and safety gear.',
    };

    setCurrentSpec(newSpec);
    setActiveTab('WIZARD');
    showToast(`Created new quotation proposal: ${newSpec.quoteRef}`);
  };

  const handleQuickAddProject = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().split('T')[0];
    const defaultCust = customers[0];
    const newSpec: ElevatorSpecification = {
      ...DEFAULT_ELEVATOR_SPEC,
      id: `proj-${Date.now()}`,
      quoteRef: `TL-QT-2026-${randomNum}`,
      projectName: language === 'ar' ? 'مشروع مصعد جديد' : 'New Elevator Project',
      clientName: defaultCust ? defaultCust.name : (language === 'ar' ? 'العميل المعتمد' : 'Direct Client'),
      customerId: defaultCust ? defaultCust.id : '',
      clientEmail: defaultCust ? defaultCust.email : '',
      clientPhone: defaultCust ? defaultCust.phone : '',
      siteLocation: defaultCust ? defaultCust.location : 'Riyadh, Saudi Arabia',
      date: dateStr,
      status: 'Draft',
      notes: language === 'ar' ? 'تم إنشاء المشروع عبر قائمة الإجراءات السريعة' : 'Created via quick actions menu',
    };

    setProjects((prev) => [newSpec, ...prev]);
    setCurrentSpec(newSpec);
    setActiveTab('WIZARD');
    showToast(
      language === 'ar'
        ? `تم إنشاء مشروع مصعد جديد بنجاح: ${newSpec.quoteRef}`
        : `New elevator project created: ${newSpec.quoteRef}`
    );
  };

  const handleToggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsDesktopSidebarOpen((prev) => !prev);
    }
  };

  const handleGoHome = () => {
    if (currentRole === 'CUSTOMER') {
      setActiveTab('CUSTOMER_PORTAL');
    } else if (currentRole === 'TECHNICIAN') {
      setActiveTab('TECHNICIAN_PORTAL');
    } else if (currentRole === 'SALES_REP') {
      setActiveTab('SALES_QUOTATIONS');
    } else {
      setActiveTab('CUSTOMERS');
    }
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    showToast('Quotation deleted from records.');
  };

  const handleUpdateProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );
    if (currentSpec.id === projectId) {
      setCurrentSpec((prev) => ({ ...prev, status: newStatus }));
    }
    showToast(
      language === 'ar'
        ? `تم تحديث حالة المشروع إلى "${newStatus}"`
        : `Project status updated to "${newStatus}"`
    );
  };

  const handleUpdateProjectPrice = (projectId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    const cleanPrice = Math.round(newPrice);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const subtotal = p.subtotalCost || 0;
        const taxRate = (p.taxPercentage || 15) / 100;
        const netPrice = taxRate > 0 ? cleanPrice / (1 + taxRate) : cleanPrice;
        const grossProfit = Math.round(netPrice - subtotal);
        const grossMarginPercent = netPrice > 0 ? Math.round(((netPrice - subtotal) / netPrice) * 1000) / 10 : 0;
        return {
          ...p,
          totalQuotationPrice: cleanPrice,
          grossProfit,
          grossMarginPercent,
        };
      })
    );
    if (currentSpec.id === projectId) {
      setCurrentSpec((prev) => {
        const subtotal = prev.subtotalCost || 0;
        const taxRate = (prev.taxPercentage || 15) / 100;
        const netPrice = taxRate > 0 ? cleanPrice / (1 + taxRate) : cleanPrice;
        const grossProfit = Math.round(netPrice - subtotal);
        const grossMarginPercent = netPrice > 0 ? Math.round(((netPrice - subtotal) / netPrice) * 1000) / 10 : 0;
        return {
          ...prev,
          totalQuotationPrice: cleanPrice,
          grossProfit,
          grossMarginPercent,
        };
      });
    }
    showToast(
      language === 'ar'
        ? `تم تحديث سعر العرض بنجاح إلى ${cleanPrice.toLocaleString()} ر.س`
        : `Quoted price updated to ${cleanPrice.toLocaleString()} SAR`
    );
  };

  const handleUpdateProjectInline = (
    projectId: string,
    updates: { status?: ProjectStatus; quotedPrice?: number }
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newStatus = updates.status || p.status;
        const cleanPrice =
          updates.quotedPrice !== undefined && !isNaN(updates.quotedPrice) && updates.quotedPrice >= 0
            ? Math.round(updates.quotedPrice)
            : p.totalQuotationPrice;

        const subtotal = p.subtotalCost || 0;
        const taxRate = (p.taxPercentage || 15) / 100;
        const netPrice = taxRate > 0 ? cleanPrice / (1 + taxRate) : cleanPrice;
        const grossProfit = Math.round(netPrice - subtotal);
        const grossMarginPercent = netPrice > 0 ? Math.round(((netPrice - subtotal) / netPrice) * 1000) / 10 : 0;

        return {
          ...p,
          status: newStatus,
          totalQuotationPrice: cleanPrice,
          grossProfit,
          grossMarginPercent,
        };
      })
    );

    if (currentSpec.id === projectId) {
      setCurrentSpec((prev) => {
        const newStatus = updates.status || prev.status;
        const cleanPrice =
          updates.quotedPrice !== undefined && !isNaN(updates.quotedPrice) && updates.quotedPrice >= 0
            ? Math.round(updates.quotedPrice)
            : prev.totalQuotationPrice;

        const subtotal = prev.subtotalCost || 0;
        const taxRate = (prev.taxPercentage || 15) / 100;
        const netPrice = taxRate > 0 ? cleanPrice / (1 + taxRate) : cleanPrice;
        const grossProfit = Math.round(netPrice - subtotal);
        const grossMarginPercent = netPrice > 0 ? Math.round(((netPrice - subtotal) / netPrice) * 1000) / 10 : 0;

        return {
          ...prev,
          status: newStatus,
          totalQuotationPrice: cleanPrice,
          grossProfit,
          grossMarginPercent,
        };
      });
    }

    showToast(
      language === 'ar'
        ? 'تم حفظ التعديل السريع للمشروع بنجاح!'
        : 'Project quick edits saved successfully!'
    );
  };

  const handleSelectProjectFromDashboard = (project: ElevatorSpecification) => {
    setCurrentSpec(project);
    setActiveTab('WIZARD');
    showToast(`Loaded ${project.projectName} (${project.quoteRef}) into wizard.`);
  };

  const handleNavigateToDrawingsFromProject = (project: ElevatorSpecification) => {
    setCurrentSpec(project);
    setActiveTab('DRAWINGS');
  };

  const handleNavigateToPrintFromProject = (project: ElevatorSpecification) => {
    setCurrentSpec(project);
    setActiveTab('PRINT');
  };

  const handleExportProjectPdf = async (project: ElevatorSpecification) => {
    setCurrentSpec(project);
    setActiveTab('PRINT');
    showToast(
      language === 'ar'
        ? `جاري تجهيز وتصدير ملف PDF لمشروع "${project.projectName}"...`
        : `Preparing PDF export for "${project.projectName}"...`
    );
    setTimeout(async () => {
      const filename = `${project.projectName || 'Quotation'}_${project.quoteRef || 'Ref'}`;
      await exportElementToPdf('printable-quotation-sheet', {
        filename,
        marginMm: 6,
      });
    }, 450);
  };

  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    showToast(`تمت إضافة العميل "${newCustomer.name}" بنجاح!`);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    showToast(`تم تحديث بيانات العميل "${updatedCustomer.name}"`);
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    showToast('تم حذف العميل من القائمة');
  };

  const handleAddProjectForCustomer = (customer: Customer) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().split('T')[0];
    const newSpec: ElevatorSpecification = {
      ...DEFAULT_ELEVATOR_SPEC,
      id: `proj-${Date.now()}`,
      quoteRef: `TL-QT-2026-${randomNum}`,
      projectName: `${customer.name} - مشروع مصعد جديد`,
      clientName: customer.name,
      customerId: customer.id,
      clientEmail: customer.email || '',
      clientPhone: customer.phone || '',
      siteLocation: customer.location || 'Riyadh, Saudi Arabia',
      date: dateStr,
      status: 'Draft',
      notes: `المواصفات الفنية المعتمدة لصالح العميل: ${customer.name}.`,
    };

    setProjects((prev) => [newSpec, ...prev]);
    setCurrentSpec(newSpec);
    setActiveTab('WIZARD');
    showToast(`تم إنشاء مشروع مصعد جديد للعميل "${customer.name}" وفتحه في المعالج!`);
  };

  // Google Sheets connected callback
  const handleSheetsConnected = (id: string, url: string, token: string) => {
    const config = {
      spreadsheetId: id,
      sheetUrl: url,
      accessToken: token,
      lastSyncedAt: new Date().toLocaleTimeString(),
    };
    setSheetsConfig(config);
    try {
      localStorage.setItem(STORAGE_KEY_SHEETS_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save sheets config', e);
    }

    addSyncLog({
      status: 'info',
      trigger: 'manual',
      message: language === 'ar' ? 'تم ربط وتوثيق جدول Google Sheets بنجاح' : 'Connected to Google Sheets successfully',
      details: `ID: ${id}`,
    });
  };

  // Auto-Sync Health & History Logs (last 10 events)
  const [syncLogs, setSyncLogs] = useState<AutoSyncLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SYNC_LOGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored sync logs', e);
    }
    return [];
  });

  const addSyncLog = useCallback((entry: Omit<AutoSyncLogEntry, 'id' | 'timestamp'>) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: AutoSyncLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
    };
    setSyncLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY_SYNC_LOGS, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not persist sync logs', err);
      }
      return updated;
    });
  }, []);

  const handleClearSyncLogs = useCallback(() => {
    setSyncLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEY_SYNC_LOGS);
    } catch {
      // ignore
    }
    showToast(language === 'ar' ? 'تم مسح سجل المزامنة' : 'Sync logs cleared');
  }, [language]);

  // Google Sheets Auto-Sync Engine: periodically push updates for active projects when app is focused
  const lastAutoSyncTimeRef = useRef<number>(0);
  const isAutoSyncingRef = useRef<boolean>(false);

  const performAutoSync = useCallback(async (reason: 'focus' | 'interval') => {
    if (!companySettings.googleSheetsAutoSync) return;
    if (!sheetsConfig.spreadsheetId || !sheetsConfig.accessToken) return;
    if (isAutoSyncingRef.current) return;

    const now = Date.now();
    // Throttle focus triggers: at least 30 seconds between auto-syncs to avoid spamming API on rapid alt-tab
    if (reason === 'focus' && now - lastAutoSyncTimeRef.current < 30 * 1000) {
      return;
    }
    // Throttle interval triggers: at least 45 seconds
    if (reason === 'interval' && now - lastAutoSyncTimeRef.current < 45 * 1000) {
      return;
    }

    // Determine target projects: Active only (status !== 'Lost') or all
    const projectsToPush = companySettings.googleSheetsOnlyActiveProjects !== false
      ? projects.filter((p) => p.status !== 'Lost')
      : projects;

    if (projectsToPush.length === 0) return;

    try {
      isAutoSyncingRef.current = true;
      await syncAllProjectsToSheet(sheetsConfig.accessToken, sheetsConfig.spreadsheetId, projectsToPush);
      lastAutoSyncTimeRef.current = Date.now();
      const timeStr = new Date().toLocaleTimeString();
      setSheetsConfig((prev) => {
        const updated = { ...prev, lastSyncedAt: timeStr };
        try {
          localStorage.setItem(STORAGE_KEY_SHEETS_CONFIG, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      addSyncLog({
        status: 'success',
        trigger: reason,
        message: language === 'ar'
          ? `تم تحديث (${projectsToPush.length}) مشروع بنجاح في Google Sheets`
          : `Successfully updated (${projectsToPush.length}) projects in Google Sheets`,
        projectCount: projectsToPush.length,
        details: reason === 'focus' ? 'Focus Trigger' : 'Periodic Interval',
      });

      showToast(
        language === 'ar'
          ? `🔄 تم تحديث ${projectsToPush.length} مشروع في جداول Google تلقائياً`
          : `🔄 Auto-synced ${projectsToPush.length} active project(s) to Google Sheets`
      );
    } catch (err: any) {
      console.warn('Google Sheets auto-sync background push failed:', err);
      const errMsg = err?.message || (language === 'ar' ? 'خطأ في الاتصال أو انتهاء صلاحية التوثيق' : 'Connection failure or expired token');
      addSyncLog({
        status: 'error',
        trigger: reason,
        message: language === 'ar' ? 'فشلت المزامنة التلقائية للمشاريع' : 'Auto-sync push failed',
        projectCount: projectsToPush.length,
        error: errMsg,
      });
    } finally {
      isAutoSyncingRef.current = false;
    }
  }, [
    companySettings.googleSheetsAutoSync,
    companySettings.googleSheetsOnlyActiveProjects,
    sheetsConfig.spreadsheetId,
    sheetsConfig.accessToken,
    projects,
    language,
    addSyncLog,
  ]);

  // Window Focus and Periodic Timer for Google Sheets Auto-Sync
  useEffect(() => {
    if (!companySettings.googleSheetsAutoSync) return;

    // 1. Focus listener: when the app window/tab gains focus
    const handleFocus = () => {
      if (companySettings.googleSheetsSyncOnFocus !== false) {
        performAutoSync('focus');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && companySettings.googleSheetsSyncOnFocus !== false) {
        performAutoSync('focus');
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 2. Periodic Interval: push updates periodically when the app is focused
    const intervalMinutes = Math.max(1, companySettings.googleSheetsSyncIntervalMinutes || 5);
    const intervalTimer = setInterval(() => {
      // Only push if the window/document is active/focused
      if (document.hasFocus() || document.visibilityState === 'visible') {
        performAutoSync('interval');
      }
    }, intervalMinutes * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalTimer);
    };
  }, [
    companySettings.googleSheetsAutoSync,
    companySettings.googleSheetsSyncOnFocus,
    companySettings.googleSheetsSyncIntervalMinutes,
    performAutoSync,
  ]);

  // Sync all projects to Google Sheets
  const handleSyncAllToGoogleSheets = async () => {
    if (!sheetsConfig.spreadsheetId || !sheetsConfig.accessToken) {
      setIsSheetsModalOpen(true);
      return;
    }
    const projectsToPush = companySettings.googleSheetsOnlyActiveProjects !== false
      ? projects.filter((p) => p.status !== 'Lost')
      : projects;

    try {
      showToast(language === 'ar' ? 'جاري مزامنة بيانات المشاريع مع جداول Google...' : 'Syncing projects to Google Sheets...');
      await syncAllProjectsToSheet(sheetsConfig.accessToken, sheetsConfig.spreadsheetId, projectsToPush);
      lastAutoSyncTimeRef.current = Date.now();
      const now = new Date().toLocaleTimeString();
      setSheetsConfig((prev) => {
        const updated = { ...prev, lastSyncedAt: now };
        try {
          localStorage.setItem(STORAGE_KEY_SHEETS_CONFIG, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      addSyncLog({
        status: 'success',
        trigger: 'manual',
        message: language === 'ar'
          ? `تمت مزامنة (${projectsToPush.length}) مشروع يدوياً بنجاح`
          : `Successfully synchronized (${projectsToPush.length}) projects manually`,
        projectCount: projectsToPush.length,
        details: `Spreadsheet ID: ${sheetsConfig.spreadsheetId}`,
      });

      showToast(language === 'ar' ? `تمت مزامنة (${projectsToPush.length}) مشروع بنجاح مع جداول Google!` : `Successfully synchronized (${projectsToPush.length}) projects with Google Sheets!`);
    } catch (e: any) {
      console.error('Google Sheets sync error:', e);
      addSyncLog({
        status: 'error',
        trigger: 'manual',
        message: language === 'ar' ? 'فشلت عملية المزامنة اليدوية' : 'Manual sync failed',
        error: e?.message || 'Error communicating with Google Sheets API',
      });
      setIsSheetsModalOpen(true);
    }
  };

  // Sync current single BOM to Google Sheets
  const handleSyncCurrentToGoogleSheets = async () => {
    if (!sheetsConfig.spreadsheetId || !sheetsConfig.accessToken) {
      setIsSheetsModalOpen(true);
      return;
    }
    try {
      const components = generateComponentList(currentSpec);
      await appendQuotationToSheet(sheetsConfig.accessToken, sheetsConfig.spreadsheetId, currentSpec, components);
      const now = new Date().toLocaleTimeString();
      setSheetsConfig((prev) => ({ ...prev, lastSyncedAt: now }));
      showToast(`Quotation ${currentSpec.quoteRef} and BOM synced to Google Sheets!`);
    } catch (e) {
      setIsSheetsModalOpen(true);
    }
  };

  return (
    <div 
      dir={language === 'ar' ? 'rtl' : 'ltr'} 
      className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans overflow-x-hidden w-full max-w-full"
    >
      {/* Universal Top Header Navbar */}
      <header id="top-navbar" className="bg-[#0B1E3B] text-white sticky top-0 z-40 shadow-md border-b border-[#16335C] select-none">
        <div className="w-full px-2 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-1.5 sm:gap-3" dir="ltr">
            {/* PHYSICAL LEFT: Navigation first to left, then Profile, then Notifications, then New button */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* 1. Navigation Menu Toggle Button */}
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white transition-colors focus:outline-hidden cursor-pointer"
                onClick={handleToggleMenu}
                title={language === 'ar' ? 'القائمة الرئيسية (فتح / إغلاق)' : 'Main Menu (Toggle)'}
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* 2. User Profile Icon Button with Dropdown */}
              <UserProfileMenu
                currentUser={currentUserProfile}
                language={language}
                onChangePassword={() => setIsChangePasswordModalOpen(true)}
                onSwitchUser={() => setIsPortalModalOpen(true)}
                onLogout={handleLogout}
                onToggleLanguage={() => {
                  const nextLang = language === 'ar' ? 'en' : 'ar';
                  setLanguage(nextLang);
                  showToast(nextLang === 'ar' ? 'تم تحويل لغة التطبيق إلى العربية' : 'Switched interface to English');
                }}
              />

              {/* 3. In-App Notifications Bell Icon */}
              <InAppNotificationsPopover
                breakdowns={breakdowns}
                contracts={maintenanceContracts}
                language={language}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenRenewalEmail={(contract) => setRenewalQuotationContract(contract)}
              />

              {/* 4. PostgreSQL Database Status Check (Icon with rich detailed hover tooltip on failure and status) */}
              <div className="relative group inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setIsDbModalOpen(true)}
                  className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer border shadow-xs shrink-0 ${
                    dbStatus.connected
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/50 hover:border-emerald-400'
                      : 'bg-rose-950/40 text-rose-400 border-rose-500/40 hover:bg-rose-900/50 hover:border-rose-400'
                  }`}
                  title={
                    !dbStatus.connected
                      ? `${language === 'ar' ? 'قاعدة بيانات PostgreSQL: غير متصل' : 'PostgreSQL Database: Disconnected'}\n${language === 'ar' ? 'رسالة الخطأ:' : 'Error Message:'} ${dbStatus.message || (language === 'ar' ? 'تعذر الاتصال بالخادم' : 'Connection failed')}\n${language === 'ar' ? 'وقت آخر فحص:' : 'Last Checked:'} ${dbStatus.lastChecked ? new Date(dbStatus.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (language === 'ar' ? 'غير متوفر' : 'N/A')}`
                      : `${language === 'ar' ? 'قاعدة بيانات PostgreSQL: متصل بنجاح' : 'PostgreSQL Database: Connected'}\n${language === 'ar' ? 'وقت آخر فحص:' : 'Last Checked:'} ${dbStatus.lastChecked ? new Date(dbStatus.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (language === 'ar' ? 'الآن' : 'Now')}`
                  }
                  aria-label="PostgreSQL Database Status"
                >
                  <Database className={`w-5 h-5 shrink-0 ${dbStatus.connected ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span
                    className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-[#0B1E3B] ${
                      dbStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                </button>

                {/* Detailed Hover Tooltip Card */}
                <div
                  className="pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform -translate-y-1 group-hover:translate-y-0 absolute top-full ltr:left-0 rtl:right-0 mt-2.5 z-50 min-w-[270px] max-w-[340px] p-3 rounded-2xl bg-slate-900/98 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs text-slate-100 select-none"
                  style={{ minWidth: '275px' }}
                >
                  {/* Tooltip Arrow pointing up to the icon */}
                  <div className="absolute -top-1.5 ltr:left-3.5 rtl:right-3.5 w-3 h-3 bg-slate-900 border-t border-l border-slate-700/80 transform rotate-45" />

                  {/* Tooltip Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          dbStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-white text-xs">
                        {language === 'ar' ? 'قاعدة بيانات PostgreSQL' : 'PostgreSQL Database'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dbStatus.connected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {dbStatus.connected
                        ? (language === 'ar' ? 'متصل' : 'ONLINE')
                        : (language === 'ar' ? 'فشل الاتصال' : 'FAILED')}
                    </span>
                  </div>

                  {/* Tooltip Body: Failure Details or Operational Info */}
                  {!dbStatus.connected ? (
                    <div className="space-y-2">
                      {/* Specific Error Message */}
                      <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200">
                        <div className="text-[10px] font-semibold text-rose-300/90 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{language === 'ar' ? 'رسالة الخطأ والسبب:' : 'Error Details:'}</span>
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed break-words text-rose-100">
                          {dbStatus.message ||
                            (language === 'ar'
                              ? 'تعذر الاتصال بخادم PostgreSQL أو لم يتم إعداد DATABASE_URL'
                              : 'Connection failed or DATABASE_URL not set')}
                        </p>
                      </div>

                      {/* Specific Last-Checked Timestamp */}
                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5 px-0.5">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{language === 'ar' ? 'وقت آخر فحص:' : 'Last Checked:'}</span>
                        </span>
                        <span className="font-mono text-slate-100 font-semibold text-[11px] bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                          {dbStatus.lastChecked
                            ? new Date(dbStatus.lastChecked).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : (language === 'ar' ? 'لم يتم بعد' : 'Not yet')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">{language === 'ar' ? 'الخادم (Host):' : 'Host:'}</span>
                        <span className="font-mono text-slate-200 font-semibold">{dbStatus.host || 'localhost'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">{language === 'ar' ? 'القاعدة (DB):' : 'Database:'}</span>
                        <span className="font-mono text-slate-200 font-semibold">{dbStatus.database || 'postgres'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{language === 'ar' ? 'وقت آخر فحص:' : 'Last Checked:'}</span>
                        </span>
                        <span className="font-mono text-emerald-300 font-semibold text-[11px] bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          {dbStatus.lastChecked
                            ? new Date(dbStatus.lastChecked).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : (language === 'ar' ? 'الآن' : 'Now')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tooltip Footer Click Hint */}
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <span>{language === 'ar' ? '💡 انقر على الأيقونة لفتح نافذة الفحص وإعدادات الربط' : '💡 Click icon to open diagnostics & settings'}</span>
                  </div>
                </div>
              </div>

              {/* 5. Quick Add Button: "جديد" (New button) */}
              <QuickCreateMenu
                language={language}
                currentRole={currentRole}
                onNewQuotation={handleNewQuotation}
                onNewProject={handleQuickAddProject}
                onNewCustomer={() => setIsQuickCustomerModalOpen(true)}
                onNewBreakdown={() => setIsQuickBreakdownModalOpen(true)}
                onNewContract={() => setActiveTab('MAINTENANCE_CONTRACTS')}
                onNewSalesContract={() => setActiveTab('SALES_CONTRACTS')}
                onNewEmployee={() => setActiveTab('EMPLOYEES')}
                onNewAttendance={() => handleOpenAttendanceModal()}
                onNewInventoryItem={() => setActiveTab('INVENTORY')}
                variant="navbar"
              />
            </div>

            {/* CENTER: Global Search Bar */}
            <div className="flex-1 flex items-center justify-center mx-1 sm:mx-3 min-w-0 max-w-xl">
              <GlobalSearchBar
                projects={projects}
                maintenanceContracts={maintenanceContracts}
                breakdowns={breakdowns}
                inventory={inventory}
                language={language}
                onSelectProject={(project, targetTab) => {
                  setCurrentSpec(project);
                  setActiveTab(targetTab || 'PRINT');
                  showToast(
                    language === 'ar'
                      ? `تم فتح مشروع: ${project.projectName} (${project.quoteRef})`
                      : `Opened project: ${project.projectName} (${project.quoteRef})`
                  );
                }}
                onExportProjectPdf={handleExportProjectPdf}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSelectBreakdown={(breakdown) => {
                  setActiveTab('MAINTENANCE_BREAKDOWNS');
                  showToast(language === 'ar' ? `تم فتح بلاغ العطل: ${breakdown.elevatorName}` : `Opened breakdown: ${breakdown.elevatorName}`);
                }}
                onSelectContract={(contract) => {
                  setActiveTab('MAINTENANCE_CONTRACTS');
                  showToast(language === 'ar' ? `تم فتح عقد الصيانة: ${contract.contractNumber}` : `Opened contract: ${contract.contractNumber}`);
                }}
                onSelectInventoryItem={(item) => {
                  setActiveTab('INVENTORY');
                  showToast(language === 'ar' ? `الانتقال للمستودع: ${item.nameAr}` : `Opened inventory item: ${item.nameEn || item.nameAr}`);
                }}
              />
            </div>

            {/* PHYSICAL RIGHT: Logo is the first item on the right, followed by Company Name - Clicking navigates to Home */}
            <button
              type="button"
              onClick={handleGoHome}
              className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer group rounded-xl p-1 -m-1 hover:bg-white/5 transition-all duration-200 text-right focus:outline-hidden select-none"
              dir="rtl"
              title={language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Go to Home Page'}
            >
              <div className="transition-transform duration-200 group-hover:scale-105">
                <TwinsLogo 
                  size={38} 
                  customLogoUrl={companySettings.logoUrl}
                  primaryColor={companySettings.primaryColor}
                  accentColor={companySettings.accentColor}
                />
              </div>
              <div className="hidden sm:block text-right">
                <div 
                  style={{ textAlign: 'center', fontSize: '10px' }}
                  className="font-bold tracking-tight text-white line-clamp-1 group-hover:text-blue-200 transition-colors"
                >
                  {language === 'ar' ? companySettings.companyNameAr : companySettings.companyNameEn}
                </div>
                <div className="text-[10px] text-blue-200/75 font-medium leading-none mt-0.5">
                  {language === 'ar' ? 'أنظمة المصاعد المتطورة ERP' : 'Advanced Elevator Systems ERP'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area: Desktop Sidebar + Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Desktop Sidebar Navigation */}
        {isDesktopSidebarOpen && (
          <DesktopSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentRole={currentRole}
            language={language}
            companySettings={companySettings}
            currentUserProfile={currentUserProfile}
            onGoHome={handleGoHome}
            onOpenPortalSwitcher={() => setIsPortalModalOpen(true)}
            onChangePassword={() => setIsChangePasswordModalOpen(true)}
            onToggleLanguage={() => {
              const nextLang = language === 'ar' ? 'en' : 'ar';
              setLanguage(nextLang);
              showToast(nextLang === 'ar' ? 'تم تحويل لغة التطبيق إلى العربية' : 'Switched interface to English');
            }}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            onNewQuotation={handleNewQuotation}
            onNewProject={handleQuickAddProject}
            onNewCustomer={() => setIsQuickCustomerModalOpen(true)}
            onNewBreakdown={() => setIsQuickBreakdownModalOpen(true)}
            onNewContract={() => setActiveTab('MAINTENANCE_CONTRACTS')}
            onNewSalesContract={() => setActiveTab('SALES_CONTRACTS')}
            onNewEmployee={() => setActiveTab('EMPLOYEES')}
            onNewAttendance={() => handleOpenAttendanceModal()}
            customersCount={customers.length}
            employeesCount={employees.length}
            expiringContractsCount={expiringContractsCount}
            inventoryCount={inventory.length}
            lowStockItemsCount={inventory.filter(i => i.quantityOnHand <= i.minStockLevel).length}
            onNewInventoryItem={() => setActiveTab('INVENTORY')}
          />
        )}

      {/* Main Content & Mobile View Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[calc(100vh-4rem)] overflow-x-hidden">
        {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay background */}
          <div className="fixed inset-0 bg-[#061224]/75 backdrop-blur-xs transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Sidebar */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white border-r border-slate-200 pt-5 pb-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between px-4 pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
              </span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5 text-slate-600" aria-hidden="true" />
              </button>
            </div>

            {/* Mobile Portal Badge Switcher */}
            <div className="px-3 mb-2">
              <PortalHeaderBadge 
                currentUser={currentUserProfile}
                onOpenSwitcher={() => {
                  setIsPortalModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                isAr={language === 'ar'}
              />
            </div>
            
            <div className="mt-2 h-0 flex-1 overflow-y-auto px-2">
              <nav className="flex flex-col gap-1 text-sm font-medium">
                {/* 1. CUSTOMER ROLE MOBILE */}
                {currentRole === 'CUSTOMER' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('CUSTOMER_PORTAL'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'CUSTOMER_PORTAL'
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      {language === 'ar' ? 'بوابة العميل المعتمد' : 'Customer Portal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('MAINTENANCE_CONTRACTS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'MAINTENANCE_CONTRACTS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Building2 className="w-5 h-5 text-blue-600" />
                      {language === 'ar' ? 'مصاعدي وعقود الصيانة' : 'My Elevators & Contracts'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('SALES_QUOTATIONS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'SALES_QUOTATIONS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <FileText className="w-5 h-5 text-amber-600" />
                      {language === 'ar' ? 'عروض الأسعار المعتمدة' : 'Quotations'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('DRAWINGS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'DRAWINGS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Layers className="w-5 h-5 text-purple-600" />
                      {language === 'ar' ? 'المخطط الهندسي ونظام التعليق' : 'CAD Drawings & Suspension'}
                    </button>
                  </>
                )}

                {/* 2. TECHNICIAN ROLE MOBILE */}
                {currentRole === 'TECHNICIAN' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('TECHNICIAN_PORTAL'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'TECHNICIAN_PORTAL'
                          ? 'bg-blue-600 text-white shadow-xs font-bold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Wrench className="w-5 h-5 text-blue-600" />
                      {language === 'ar' ? 'لوحة الفني الميداني' : 'Technician Workspace'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('MAINTENANCE_SCHEDULES'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'MAINTENANCE_SCHEDULES'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Calendar className="w-5 h-5 text-purple-600" />
                      {language === 'ar' ? 'إدارة زيارات الصيانة' : 'Maintenance Visits'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('MAINTENANCE_BREAKDOWNS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'MAINTENANCE_BREAKDOWNS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      {language === 'ar' ? 'إدارة بلاغات الأعطال' : 'Breakdowns Management'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('INTERACTIVE_MAP'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'INTERACTIVE_MAP'
                          ? 'bg-rose-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-rose-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <MapPin className="w-5 h-5 text-rose-500" />
                      {language === 'ar' ? 'خريطة المواقع الميدانية' : 'Field Sites Map'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('DRAWINGS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'DRAWINGS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Layers className="w-5 h-5 text-amber-600" />
                      {language === 'ar' ? 'مخطط التعليق والبئر CAD' : 'Suspension CAD'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('COMPONENTS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'COMPONENTS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Package className="w-5 h-5 text-emerald-600" />
                      {language === 'ar' ? 'المكونات الفنية' : 'Components BOM'}
                    </button>
                  </>
                )}

                {/* 3. SALES REP / MANAGEMENT MOBILE */}
                {(currentRole === 'SALES_REP' || currentRole === 'MANAGEMENT') && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('CUSTOMERS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'CUSTOMERS' || activeTab === 'DASHBOARD'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Users className="w-5 h-5 text-emerald-600" />
                      {language === 'ar' ? `دليل العملاء (${customers.length})` : `Customers (${customers.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('INTERACTIVE_MAP'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'INTERACTIVE_MAP'
                          ? 'bg-rose-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-rose-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <MapPin className="w-5 h-5 text-rose-500" />
                      {language === 'ar' ? 'الخريطة التفاعلية للمواقع' : 'Interactive Map'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('SALES_QUOTATIONS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'SALES_QUOTATIONS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      {language === 'ar' ? 'عروض بيع المصاعد' : 'Elevator Sales Quotations'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('SALES_CONTRACTS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'SALES_CONTRACTS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <BadgeCheck className="w-5 h-5 text-emerald-600" />
                      {language === 'ar' ? 'عقود بيع المصاعد' : 'Sales Contracts'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('SALES_ANALYTICS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'SALES_ANALYTICS'
                          ? 'bg-purple-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-purple-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      {language === 'ar' ? 'التحليلات والمبيعات' : 'Sales Analytics'}
                    </button>

                    {currentRole === 'MANAGEMENT' && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('MAINTENANCE_QUOTATIONS'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                            activeTab === 'MAINTENANCE_QUOTATIONS'
                              ? 'bg-blue-600 text-white shadow-xs font-semibold'
                              : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <FileText className="w-5 h-5 text-blue-600" />
                          {language === 'ar' ? 'عروض الصيانة' : 'Maint. Quotations'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('MAINTENANCE_CONTRACTS'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                            activeTab === 'MAINTENANCE_CONTRACTS'
                              ? 'bg-blue-600 text-white shadow-xs font-semibold'
                              : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <Wrench className="w-5 h-5 text-amber-600" />
                          {language === 'ar' ? 'عقود الصيانة السارية' : 'Maint. Contracts'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('MAINTENANCE_SCHEDULES'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                            activeTab === 'MAINTENANCE_SCHEDULES'
                              ? 'bg-blue-600 text-white shadow-xs font-semibold'
                              : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <Calendar className="w-5 h-5 text-purple-600" />
                          {language === 'ar' ? 'إدارة زيارات الصيانة' : 'Maintenance Visits'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('MAINTENANCE_BREAKDOWNS'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                            activeTab === 'MAINTENANCE_BREAKDOWNS'
                              ? 'bg-blue-600 text-white shadow-xs font-semibold'
                              : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                          {language === 'ar' ? 'إدارة بلاغات الأعطال' : 'Breakdowns Management'}
                        </button>
                        <button
                          type="button"
                          id="mobile-nav-employees"
                          onClick={() => { setActiveTab('EMPLOYEES'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                            activeTab === 'EMPLOYEES'
                              ? 'bg-blue-600 text-white shadow-xs font-semibold'
                              : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <Award className="w-5 h-5 text-emerald-600" />
                          {language === 'ar' ? `الموظفين (${employees.length})` : `Staff (${employees.length})`}
                        </button>
                        <button
                          type="button"
                          id="mobile-nav-inventory"
                          onClick={() => { setActiveTab('INVENTORY'); setIsMobileMenuOpen(false); }}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                            activeTab === 'INVENTORY'
                              ? 'bg-amber-600 text-white shadow-xs font-semibold'
                              : 'text-slate-700 hover:text-amber-600 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Boxes className="w-5 h-5 text-amber-600" />
                            <span>{language === 'ar' ? 'المستودع والمخزون' : 'Warehouse & Stock'}</span>
                          </div>
                          {inventory.filter(i => i.quantityOnHand <= i.minStockLevel).length > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              {inventory.filter(i => i.quantityOnHand <= i.minStockLevel).length} {language === 'ar' ? 'نواقص' : 'low'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {inventory.length}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('SETTINGS'); setIsMobileMenuOpen(false); }}
                          style={{ borderColor: '#080809' }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors border border-[#080809] ${
                            activeTab === 'SETTINGS'
                              ? 'bg-amber-600 text-white shadow-xs font-semibold'
                              : 'text-slate-700 hover:text-amber-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <SettingsIcon className="w-5 h-5 text-amber-600" />
                          {language === 'ar' ? 'إعدادات الشركة' : 'Settings & Branding'}
                        </button>

                        {/* Mobile Portals Links */}
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="px-4 text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                            {language === 'ar' ? 'البوابات الإلكترونية المعتمدة' : 'Authorized Portals'}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setActiveTab('CUSTOMER_PORTAL'); setIsMobileMenuOpen(false); }}
                            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-colors ${
                              activeTab === 'CUSTOMER_PORTAL'
                                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                                : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-100 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-emerald-600" />
                              <span>{language === 'ar' ? 'بوابة العميل' : 'Customer Portal'}</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setActiveTab('TECHNICIAN_PORTAL'); setIsMobileMenuOpen(false); }}
                            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-colors ${
                              activeTab === 'TECHNICIAN_PORTAL'
                                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                                : 'text-slate-700 hover:text-blue-700 hover:bg-slate-100 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Wrench className="w-5 h-5 text-blue-600" />
                              <span>{language === 'ar' ? 'بوابة الفني' : 'Technician Portal'}</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setActiveTab('SUPPLIER_PORTAL'); setIsMobileMenuOpen(false); }}
                            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-colors ${
                              activeTab === 'SUPPLIER_PORTAL'
                                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                                : 'text-slate-700 hover:text-amber-700 hover:bg-slate-100 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Building2 className="w-5 h-5 text-amber-600" />
                              <span>{language === 'ar' ? 'بوابة المورد' : 'Supplier Portal'}</span>
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              {language === 'ar' ? 'للتصميم لاحقاً' : 'Later'}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
                
                {['WIZARD', 'DRAWINGS', 'COMPONENTS', 'PRINT'].includes(activeTab) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-1">
                    <div className="px-4 text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      {language === 'ar' ? 'محرر المشروع' : 'Project Editor'}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('WIZARD'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'WIZARD'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Wand2 className="w-5 h-5 text-blue-600" />
                      {language === 'ar' ? 'معالج المواصفات' : 'Quotation Wizard'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('DRAWINGS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'DRAWINGS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Layers className="w-5 h-5 text-purple-600" />
                      {language === 'ar' ? 'المخطط الهندسي CAD' : 'CAD Drawings'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('COMPONENTS'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'COMPONENTS'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Package className="w-5 h-5 text-emerald-600" />
                      {language === 'ar' ? 'قائمة المكونات والتكاليف' : 'Components BOM'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('PRINT'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        activeTab === 'PRINT'
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Printer className="w-5 h-5 text-indigo-600" />
                      {language === 'ar' ? 'الطباعة والعقد' : 'Print & Contract'}
                    </button>
                  </div>
                )}
              </nav>
            </div>

            {/* Mobile Drawer Footer: Language Chooser & Quick Actions */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2 mt-auto shrink-0">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    {language === 'ar' ? 'لغة التطبيق' : 'Language'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (language !== 'ar') {
                        setLanguage('ar');
                        showToast('تم تحويل لغة التطبيق إلى العربية');
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                      language === 'ar'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    عربي
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (language !== 'en') {
                        setLanguage('en');
                        showToast('Switched interface to English');
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                      language === 'en'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div 
          id="toast-notification"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 lg:p-5">

        {/* Tab 1: Quotation Wizard */}
        {activeTab === 'WIZARD' && (
          <QuotationWizard
            spec={currentSpec}
            customers={customers}
            employees={employees}
            language={language}
            onUpdateSpec={handleUpdateSpec}
            onNavigateToDrawings={() => setActiveTab('DRAWINGS')}
            onNavigateToBOM={() => setActiveTab('COMPONENTS')}
            onNavigateToPrint={() => setActiveTab('PRINT')}
            onSaveToHistorical={handleSaveToHistorical}
            onSyncToGoogleSheet={handleSyncCurrentToGoogleSheets}
            isSheetsConnected={Boolean(sheetsConfig.spreadsheetId)}
          />
        )}

        {/* Tab 2: Dynamic CAD Shaft & Cabin Drawings */}
        {activeTab === 'DRAWINGS' && (
          <ElevatorDrawings
            spec={currentSpec}
            settings={companySettings}
            onUpdateSettings={setCompanySettings}
            onUpdateSpec={handleUpdateSpec}
            onNavigateToBOM={() => setActiveTab('COMPONENTS')}
            onNavigateToPrint={() => setActiveTab('PRINT')}
          />
        )}

        {/* Tab 3: Component View & Material Costs */}
        {activeTab === 'COMPONENTS' && (
          <ComponentsView
            spec={currentSpec}
            onUpdateSpec={handleUpdateSpec}
            onSyncToGoogleSheet={handleSyncCurrentToGoogleSheets}
            isSheetsConnected={Boolean(sheetsConfig.spreadsheetId)}
            inventory={inventory}
            onNavigateToInventory={() => setActiveTab('INVENTORY')}
          />
        )}

        {/* Tab 4: Customers & Projects Hub & Sales Analytics */}
        {(activeTab === 'CUSTOMERS' || activeTab === 'SALES_QUOTATIONS' || activeTab === 'SALES_CONTRACTS' || activeTab === 'SALES_ANALYTICS') && (
          <HistoricalDashboard
            projects={projects}
            customers={customers}
            maintenanceContracts={maintenanceContracts}
            breakdowns={breakdowns}
            currentRole={currentRole}
            currentUser={currentUserProfile}
            language={language}
            activeSection={activeTab === 'CUSTOMERS' ? 'CUSTOMERS' : 'PROJECTS'}
            forcedProjectsTab={
              activeTab === 'SALES_QUOTATIONS'
                ? 'QUOTES'
                : activeTab === 'SALES_CONTRACTS'
                ? 'CONTRACTS'
                : activeTab === 'SALES_ANALYTICS'
                ? 'ANALYTICS'
                : undefined
            }
            onSwitchSection={(sec) => setActiveTab(sec === 'PROJECTS' ? 'PROJECTS' : 'CUSTOMERS')}
            onSelectProject={handleSelectProjectFromDashboard}
            onNewQuotation={handleNewQuotation}
            onDeleteProject={handleDeleteProject}
            onUpdateProjectStatus={handleUpdateProjectStatus}
            onUpdateProjectPrice={handleUpdateProjectPrice}
            onUpdateProjectInline={handleUpdateProjectInline}
            onNavigateToDrawings={handleNavigateToDrawingsFromProject}
            onNavigateToPrint={handleNavigateToPrintFromProject}
            onAddCustomer={handleAddCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onAddProjectForCustomer={handleAddProjectForCustomer}
            onSyncAllToGoogleSheets={handleSyncAllToGoogleSheets}
            onCreateNewGoogleSheet={() => setIsSheetsModalOpen(true)}
            isSheetsConnected={Boolean(sheetsConfig.spreadsheetId)}
            sheetsUrl={sheetsConfig.sheetUrl}
            lastSyncedAt={sheetsConfig.lastSyncedAt}
          />
        )}

        {/* Tab: Standalone Interactive Map & GPS Sites */}
        {activeTab === 'INTERACTIVE_MAP' && (
          <div className="space-y-4">
            <div className="bg-white text-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {language === 'ar' ? 'الخرائط الميدانية ونظم GIS' : 'Field GIS & Interactive Map'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        • {projects.length + maintenanceContracts.length} {language === 'ar' ? 'موقع نشط مسجل' : 'registered sites'}
                      </span>
                    </div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                      {language === 'ar' ? 'الخريطة التفاعلية لمواقع العمل والمشاريع وعقود الصيانة' : 'Interactive Map of Sites, Projects & Maintenance'}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('CUSTOMERS')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                    <span>{language === 'ar' ? 'دليل العملاء' : 'Customers'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('SALES_QUOTATIONS')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                    <span>{language === 'ar' ? 'المشاريع' : 'Projects'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('MAINTENANCE_CONTRACTS')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-slate-600" />
                    <span>{language === 'ar' ? 'عقود الصيانة' : 'Contracts'}</span>
                  </button>
                </div>
              </div>
            </div>

            <MapDashboardView
              projects={projects}
              maintenanceContracts={maintenanceContracts}
              language={language}
              onSelectProject={handleSelectProjectFromDashboard}
            />
          </div>
        )}

        {/* Tab 5: Print Quotation Offer */}
        {activeTab === 'PRINT' && (
          <PrintQuotation
            spec={currentSpec}
            settings={companySettings}
            language={language}
            onBackToWizard={() => setActiveTab('WIZARD')}
            onSyncToGoogleSheet={handleSyncCurrentToGoogleSheets}
            isSheetsConnected={Boolean(sheetsConfig.spreadsheetId)}
          />
        )}

        {/* Tab: Maintenance Contracts */}
        {(activeTab === 'MAINTENANCE_CONTRACTS' || activeTab === 'MAINTENANCE_QUOTATIONS') && (
          <MaintenanceDashboard
            contracts={maintenanceContracts}
            customers={customers}
            projects={projects}
            employees={employees}
            companySettings={companySettings}
            language={language}
            onSaveContract={handleSaveMaintenanceContract}
            onDeleteContract={handleDeleteMaintenanceContract}
            forcedTab={activeTab === 'MAINTENANCE_CONTRACTS' ? 'CONTRACTS' : 'QUOTATIONS'}
            onOpenRenewalEmail={(contract) => setRenewalQuotationContract(contract)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'MAINTENANCE_SCHEDULES' && (
          <MaintenanceSchedulesView 
            contracts={maintenanceContracts}
            employees={employees}
            language={language}
            companySettings={companySettings}
            onSaveContract={handleSaveMaintenanceContract}
          />
        )}

        {activeTab === 'MAINTENANCE_BREAKDOWNS' && (
          <MaintenanceBreakdownsView 
            breakdowns={breakdowns}
            language={language}
            onAddBreakdown={handleAddBreakdown}
            onUpdateBreakdown={handleUpdateBreakdown}
            employees={employees}
            projects={projects}
            customers={customers}
            companySettings={companySettings}
          />
        )}

        {/* Tab: Employees & Sales Representatives Hub */}
        {activeTab === 'EMPLOYEES' && (
          <EmployeesDashboard
            employees={employees}
            projects={projects}
            maintenanceContracts={maintenanceContracts}
            breakdowns={breakdowns}
            companySettings={companySettings}
            language={language}
            attendanceRecords={attendanceRecords}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onSelectProject={handleSelectProjectFromDashboard}
            onOpenAttendanceModal={handleOpenAttendanceModal}
            onSwitchUser={handleSelectUserProfile}
          />
        )}

        {/* Tab 6: Company Settings & Print Branding */}
        {activeTab === 'SETTINGS' && (
          <SettingsView
            settings={companySettings}
            language={language}
            onUpdateSettings={(newSettings) => {
              setCompanySettings(newSettings);
            }}
            onLanguageChange={setLanguage}
            onShowToast={showToast}
            sheetsConfig={sheetsConfig}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            onSyncNow={handleSyncAllToGoogleSheets}
            activeProjectsCount={projects.filter(p => p.status !== 'Lost').length}
            totalProjectsCount={projects.length}
            syncLogs={syncLogs}
            onClearSyncLogs={handleClearSyncLogs}
          />
        )}

        {/* Tab: Warehouse & Inventory Management ERP */}
        {activeTab === 'INVENTORY' && (
          <InventoryView
            inventory={inventory}
            movements={inventoryMovements}
            projects={projects}
            breakdowns={breakdowns}
            vendors={vendors}
            language={language}
            companySettings={companySettings}
            onAddItem={handleAddInventoryItem}
            onUpdateItem={handleUpdateInventoryItem}
            onDeleteItem={handleDeleteInventoryItem}
            onAdjustStock={handleAdjustStock}
            onAddVendor={handleAddVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
            onShowToast={showToast}
          />
        )}

        {/* Tab 7: Customer Dedicated Portal */}
        {activeTab === 'CUSTOMER_PORTAL' && (
          <CustomerPortalView
            currentUser={currentUserProfile}
            contracts={maintenanceContracts}
            breakdowns={breakdowns}
            spec={currentSpec}
            companySettings={companySettings}
            onReportBreakdown={(newBreakdown) => {
              const fullBreakdown: MaintenanceBreakdown = {
                ...newBreakdown,
                id: `brk-${Date.now()}`,
                reportedAt: new Date().toISOString(),
                isResolved: false,
              };
              handleAddBreakdown(fullBreakdown);
              showToast(language === 'ar' ? 'تم تسجيل بلاغ العطل بنجاح وإشعار فريق الطوارئ الميداني' : 'Breakdown reported successfully');
            }}
            onOpenDrawings={() => setActiveTab('DRAWINGS')}
            isAr={language === 'ar'}
          />
        )}

        {/* Tab 8: Field Technician Workspace */}
        {activeTab === 'TECHNICIAN_PORTAL' && (
          <TechnicianPortalView
            currentUser={currentUserProfile}
            contracts={maintenanceContracts}
            breakdowns={breakdowns}
            spec={currentSpec}
            companySettings={companySettings}
            onSaveContract={handleSaveMaintenanceContract}
            onUpdateBreakdownStatus={(breakdownId, newStatus) => {
              const b = breakdowns.find((x) => x.id === breakdownId);
              if (b) {
                handleUpdateBreakdown({
                  ...b,
                  status: newStatus,
                  isResolved: newStatus === 'Resolved',
                  resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : undefined,
                });
                showToast(language === 'ar' ? `تم تحديث حالة البلاغ إلى: ${newStatus}` : `Status updated to ${newStatus}`);
              }
            }}
            onOpenGpsCheckIn={() => {
              const emp = employees.find((e) => e.id === currentUserProfile.employeeId) || employees[0];
              if (emp) handleOpenAttendanceModal(emp);
            }}
            onOpenDrawings={() => setActiveTab('DRAWINGS')}
            isAr={language === 'ar'}
          />
        )}

        {/* Tab 9: Supplier Portal (For Later Design) */}
        {activeTab === 'SUPPLIER_PORTAL' && (
          <SupplierPortalView
            language={language}
            companySettings={companySettings}
            onGoHome={handleGoHome}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}
      </main>
      </div>
      </div>

      {/* Modern Permanent Global App Footer (Twins Technology Owner & App Identity) - Full Width */}
      <AppFooter
        language={language}
        onGoHome={handleGoHome}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
        onToggleLanguage={() => {
          const nextLang = language === 'ar' ? 'en' : 'ar';
          setLanguage(nextLang);
          showToast(nextLang === 'ar' ? 'تم تحويل لغة التطبيق إلى العربية' : 'Switched interface to English');
        }}
      />

      {/* Quick Add Customer Modal */}
      {isQuickCustomerModalOpen && (
        <QuickAddCustomerModal
          language={language}
          onSave={handleAddCustomer}
          onClose={() => setIsQuickCustomerModalOpen(false)}
        />
      )}

      {/* Quick Add Breakdown Modal */}
      {isQuickBreakdownModalOpen && (
        <BreakdownModal
          language={language}
          employees={employees}
          projects={projects}
          customers={customers}
          onSave={(breakdown) => {
            handleAddBreakdown(breakdown);
            setIsQuickBreakdownModalOpen(false);
            showToast(language === 'ar' ? 'تم تسجيل وتمرير بلاغ العطل بنجاح' : 'Breakdown reported successfully');
          }}
          onClose={() => setIsQuickBreakdownModalOpen(false)}
        />
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUserProfile}
        language={language}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        projects={projects}
        currentSpec={currentSpec}
        isSheetsConnected={Boolean(sheetsConfig.spreadsheetId)}
        sheetsUrl={sheetsConfig.sheetUrl}
        spreadsheetId={sheetsConfig.spreadsheetId}
        onConnected={handleSheetsConnected}
      />
      <SiteAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        employees={employees}
        projects={projects}
        maintenanceContracts={maintenanceContracts}
        companySettings={companySettings}
        language={language}
        preselectedEmployeeId={attendanceModalEmpId}
        preselectedProjectId={attendanceModalProjId}
        onSaveRecord={handleSaveAttendanceRecord}
      />

      {/* User Portal Role & Privilege Switcher Modal */}
      <PortalSwitcherModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        currentUser={currentUserProfile}
        currentProfile={currentUserProfile}
        onSelectUser={handleSelectUserProfile}
        onSelectProfile={handleSelectUserProfile}
        customers={customers}
        employees={employees}
        isAr={language === 'ar'}
      />

      {/* Global Maintenance Contract Renewal Quotation Email Modal */}
      {renewalQuotationContract && (
        <RenewalQuotationEmailModal
          isOpen={Boolean(renewalQuotationContract)}
          contract={renewalQuotationContract}
          companySettings={companySettings}
          language={language}
          onClose={() => setRenewalQuotationContract(null)}
          onRenewInSystem={(renewed) => {
            const today = new Date();
            let newStart = new Date();
            if (renewed.endDate) {
              const parts = renewed.endDate.split('-');
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
              ...renewed,
              id: `mnt-${Date.now()}`,
              contractRef: `MNT-CTR-${renewalYear}-${String(maintenanceContracts.length + 1).padStart(3, '0')}`,
              title: `${renewed.title.replace(/\s*-\s*تجديد.*$/i, '')} - تجديد ${renewalYear}`,
              status: 'Active',
              startDate: startStr,
              endDate: endStr,
              createdAt: today.toISOString().split('T')[0],
              updatedAt: today.toISOString().split('T')[0],
              visits: [],
            };

            handleSaveMaintenanceContract(renewalContract);
            setRenewalQuotationContract(null);
            setActiveTab('MAINTENANCE_CONTRACTS');
            showToast(
              language === 'ar'
                ? `تم إنشاء وتجديد عقد الصيانة بنجاح للسنة ${renewalYear} برقم (${renewalContract.contractRef})`
                : `Renewal contract created successfully for year ${renewalYear} (${renewalContract.contractRef})`
            );
          }}
          onShowToast={showToast}
        />
      )}

      {/* PostgreSQL Database Health Status Modal */}
      <DatabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        statusInfo={dbStatus}
        onRecheck={async () => {
          await checkDbHealth();
        }}
        language={language}
        customDbUrl={customDbUrl}
        onSaveCustomDbUrl={handleSaveCustomDbUrl}
      />
    </div>
  );
}
