import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MessageSquare,
  Award,
  TrendingUp,
  Target,
  ShieldCheck,
  Wrench,
  Briefcase,
  Calendar,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Layers,
  LayoutGrid,
  List,
  Check,
  Building2,
  UserCheck,
  Compass,
  Navigation,
  BarChart3,
  Key,
  Zap,
  Lock,
  Unlock,
  Shield,
} from 'lucide-react';
import {
  Employee,
  EmployeeRole,
  EmployeeStatus,
  EmployeePortalUser,
  ROLE_CONFIGS,
  EMPLOYEE_STATUS_CONFIG,
  SiteAttendanceRecord,
} from '../types/employee';
import { ElevatorSpecification } from '../types/elevator';
import { MaintenanceContract, MaintenanceBreakdown } from '../types/maintenance';
import { 
  calculateMonthlyTechnicianKpis, 
  DAILY_TARGET_BREAKDOWNS, 
  DAILY_TARGET_MAINTENANCE, 
  DEFAULT_WORKING_DAYS_PER_MONTH, 
  MonthlyTechnicianKpi 
} from '../utils/technicianKpi';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import { AttendanceLogsTable } from './AttendanceLogsTable';
import EmployeeReports from './EmployeeReports';
import { SearchableSelect } from './SearchableSelect';
import { useInteractiveTable, InteractiveColumn } from '../hooks/useInteractiveTable';
import { InteractiveTableHeader, TableControlBar } from './InteractiveTableHeader';
import { UserProfile, UserPortalRole, ROLE_PRIVILEGES_MAP } from '../types/portal';
import { Employee30DayTrendChart } from './Employee30DayTrendChart';

interface EmployeesDashboardProps {
  employees: Employee[];
  projects: ElevatorSpecification[];
  maintenanceContracts: MaintenanceContract[];
  breakdowns?: MaintenanceBreakdown[];
  companySettings: CompanySettings;
  language: AppLanguage;
  attendanceRecords?: SiteAttendanceRecord[];
  onSaveEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onSelectProject?: (project: ElevatorSpecification) => void;
  onOpenAttendanceModal?: (empId?: string, projId?: string) => void;
  onSwitchUser?: (userProfile: UserProfile) => void;
}

export default function EmployeesDashboard({
  employees,
  projects,
  maintenanceContracts,
  breakdowns = [],
  companySettings,
  language,
  attendanceRecords = [],
  onSaveEmployee,
  onDeleteEmployee,
  onSelectProject,
  onOpenAttendanceModal,
  onSwitchUser,
}: EmployeesDashboardProps) {
  const isAr = language === 'ar';

  // Section switcher: Staff directory vs Attendance GPS logs vs KPI Dashboard vs Reports
  const [activeSection, setActiveSection] = useState<'STAFF' | 'ATTENDANCE_LOGS' | 'KPI_DASHBOARD' | 'REPORTS'>('STAFF');

  // KPI Period filter state (قياس هذا شهرياً: 12 زيارة صيانة يومياً و 5 أعطال يومياً)
  const [kpiMonth, setKpiMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // e.g. "2026-09"
  const [kpiWorkingDays, setKpiWorkingDays] = useState<number>(DEFAULT_WORKING_DAYS_PER_MONTH);

  // Filters state
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeFormTab, setEmployeeFormTab] = useState<'BASIC' | 'JOB_DETAILS' | 'USER_PERMISSIONS'>('BASIC');
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [isAddRoleMenuOpen, setIsAddRoleMenuOpen] = useState(false);

  // Quick User Account Modal State (إضافة وإدارة حساب المستخدم من داخل الموظف)
  const [quickUserModalEmployee, setQuickUserModalEmployee] = useState<Employee | null>(null);
  const [quickUserModalTab, setQuickUserModalTab] = useState<'CREDENTIALS' | 'PERMISSIONS'>('CREDENTIALS');
  const [quickUsername, setQuickUsername] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickPassword, setQuickPassword] = useState('');
  const [quickRole, setQuickRole] = useState<UserPortalRole>('TECHNICIAN');
  const [quickCanViewAllDepartmentRecords, setQuickCanViewAllDepartmentRecords] = useState(false);
  const [quickIsActive, setQuickIsActive] = useState(true);
  const [showQuickPassword, setShowQuickPassword] = useState(false);
  const [userNotificationToast, setUserNotificationToast] = useState<string | null>(null);

  // Quick stats calculations
  const stats = useMemo(() => {
    const totalStaff = employees.length;
    const activeStaff = employees.filter((e) => e.status === 'ACTIVE').length;
    const salesReps = employees.filter((e) => e.role === 'SALES_REP');
    const technicians = employees.filter((e) => e.role === 'MAINTENANCE_TECH');

    // Total monthly sales target across all active reps
    const totalMonthlySalesTarget = salesReps.reduce(
      (acc, r) => acc + (r.monthlyTargetSar || 0),
      0
    );

    // Calculate achieved sales per rep and overall
    let totalAchievedSales = 0;
    let totalCommissionsEarned = 0;

    // Map of rep ID -> stats
    const repStatsMap: Record<
      string,
      {
        assignedProjectsCount: number;
        wonProjectsCount: number;
        totalRevenue: number;
        commissionEarned: number;
      }
    > = {};

    salesReps.forEach((rep) => {
      repStatsMap[rep.id] = {
        assignedProjectsCount: 0,
        wonProjectsCount: 0,
        totalRevenue: 0,
        commissionEarned: 0,
      };
    });

    projects.forEach((proj) => {
      if (proj.assignedSalesRepId && repStatsMap[proj.assignedSalesRepId]) {
        repStatsMap[proj.assignedSalesRepId].assignedProjectsCount++;
        if (proj.status === 'Won' || proj.status === 'Approved' || proj.status === 'Installed') {
          const val = proj.totalQuotationPrice || 0;
          repStatsMap[proj.assignedSalesRepId].wonProjectsCount++;
          repStatsMap[proj.assignedSalesRepId].totalRevenue += val;
          const rep = employees.find((e) => e.id === proj.assignedSalesRepId);
          const rate = proj.assignedSalesRepCommissionRate || rep?.commissionRate || 2.5;
          const comm = (val * rate) / 100;
          repStatsMap[proj.assignedSalesRepId].commissionEarned += comm;
          totalAchievedSales += val;
          totalCommissionsEarned += comm;
        }
      }
    });

    // Technician stats
    const techStatsMap: Record<
      string,
      { assignedContractsCount: number; assignedVisitsCount: number; completedVisitsCount: number }
    > = {};

    technicians.forEach((t) => {
      techStatsMap[t.id] = {
        assignedContractsCount: 0,
        assignedVisitsCount: 0,
        completedVisitsCount: 0,
      };
    });

    maintenanceContracts.forEach((contract) => {
      if (contract.assignedTechnicianId && techStatsMap[contract.assignedTechnicianId]) {
        techStatsMap[contract.assignedTechnicianId].assignedContractsCount++;
      }
      contract.visits.forEach((v) => {
        if (v.technicianId && techStatsMap[v.technicianId]) {
          techStatsMap[v.technicianId].assignedVisitsCount++;
          if (v.status === 'Completed') {
            techStatsMap[v.technicianId].completedVisitsCount++;
          }
        }
      });
    });

    return {
      totalStaff,
      activeStaff,
      salesRepsCount: salesReps.length,
      techniciansCount: technicians.length,
      totalMonthlySalesTarget,
      totalAchievedSales,
      totalCommissionsEarned,
      repStatsMap,
      techStatsMap,
    };
  }, [employees, projects, maintenanceContracts]);

  // حساب مؤشرات الأداء الشهرية (KPI) للفنيين (5 أعطال يومياً و 12 زيارة صيانة يومياً وما أكثر فله درجات أعلى)
  const technicianKpis = useMemo(() => {
    return calculateMonthlyTechnicianKpis(
      employees,
      maintenanceContracts,
      breakdowns,
      kpiMonth,
      kpiWorkingDays
    );
  }, [employees, maintenanceContracts, breakdowns, kpiMonth, kpiWorkingDays]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedRoleFilter !== 'ALL' && emp.role !== selectedRoleFilter) return false;
      if (selectedStatusFilter !== 'ALL' && emp.status !== selectedStatusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchNameEn = emp.nameEn?.toLowerCase().includes(q);
        const matchCode = emp.code.toLowerCase().includes(q);
        const matchPhone = emp.phone.toLowerCase().includes(q);
        const matchEmail = emp.email.toLowerCase().includes(q);
        const matchTerritory = emp.territory?.toLowerCase().includes(q);
        const matchSpecialty = emp.technicianSpecialty?.toLowerCase().includes(q);

        if (!matchName && !matchNameEn && !matchCode && !matchPhone && !matchEmail && !matchTerritory && !matchSpecialty) {
          return false;
        }
      }
      return true;
    });
  }, [employees, selectedRoleFilter, selectedStatusFilter, searchQuery]);

  // Interactive Table Column Definitions
  const employeeColumns: InteractiveColumn<Employee>[] = useMemo(() => [
    {
      id: 'code_and_staff',
      header: isAr ? 'الكود والموظف' : 'Code & Staff',
      headerAr: 'الكود والموظف',
      headerEn: 'Code & Staff',
      sortable: true,
      accessor: (emp) => emp.name,
      renderCell: (emp) => (
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
            {emp.code}
          </span>
          <div>
            <span className="font-bold text-slate-900 block text-xs">{emp.name}</span>
            {emp.nameEn && <span className="text-[10px] text-slate-400 block">{emp.nameEn}</span>}
          </div>
        </div>
      ),
    },
    {
      id: 'role_and_dept',
      header: isAr ? 'الدور والقسم' : 'Role & Dept',
      headerAr: 'الدور والقسم',
      headerEn: 'Role & Dept',
      sortable: true,
      accessor: (emp) => emp.role,
      renderCell: (emp) => {
        const roleConf = ROLE_CONFIGS[emp.role] || ROLE_CONFIGS.SALES_REP;
        return (
          <div>
            <span
              className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleConf.badgeBg} ${roleConf.badgeText} ${roleConf.badgeBorder}`}
            >
              {isAr ? roleConf.labelAr : roleConf.labelEn}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isAr ? roleConf.departmentAr : roleConf.departmentEn}
            </span>
          </div>
        );
      },
    },
    {
      id: 'contact',
      header: isAr ? 'بيانات التواصل' : 'Contact',
      headerAr: 'بيانات التواصل',
      headerEn: 'Contact',
      sortable: true,
      accessor: (emp) => emp.phone || emp.email || '',
      renderCell: (emp) => (
        <div className="space-y-0.5 font-mono text-[11px]">
          {emp.phone && (
            <a
              href={`tel:${emp.phone}`}
              className="text-slate-800 hover:text-emerald-600 block transition-colors"
              dir="ltr"
            >
              {emp.phone}
            </a>
          )}
          {emp.email && (
            <a
              href={`mailto:${emp.email}`}
              className="text-slate-400 hover:text-blue-600 block text-[10px] transition-colors"
            >
              {emp.email}
            </a>
          )}
        </div>
      ),
    },
    {
      id: 'zone_specialty',
      header: isAr ? 'المنطقة / التخصص' : 'Zone / Specialty',
      headerAr: 'المنطقة / التخصص',
      headerEn: 'Zone / Specialty',
      sortable: true,
      accessor: (emp) => emp.territory || emp.assignedZone || emp.technicianSpecialty || '',
      renderCell: (emp) => (
        <div>
          {emp.role === 'SALES_REP' && (
            <div>
              <span className="font-medium text-slate-800 text-xs block">{emp.territory || '-'}</span>
              <span className="text-[10px] text-emerald-600 font-bold block">
                عمولة {emp.commissionRate || 2.5}%
              </span>
            </div>
          )}
          {emp.role === 'MAINTENANCE_TECH' && (
            <div>
              <span className="font-medium text-slate-800 text-xs block">{emp.assignedZone || '-'}</span>
              <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                {emp.technicianSpecialty}
              </span>
            </div>
          )}
          {emp.role !== 'SALES_REP' && emp.role !== 'MAINTENANCE_TECH' && (
            <span className="text-slate-400 text-xs">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'performance_target',
      header: isAr ? 'مؤشرات الأداء والتارقت' : 'Performance & Target',
      headerAr: 'مؤشرات الأداء والتارقت',
      headerEn: 'Performance & Target',
      sortable: true,
      accessor: (emp) => {
        if (emp.role === 'SALES_REP') {
          return stats.repStatsMap[emp.id]?.totalRevenue || 0;
        }
        if (emp.role === 'MAINTENANCE_TECH') {
          return stats.techStatsMap[emp.id]?.completedVisitsCount || 0;
        }
        return 0;
      },
      renderCell: (emp) => {
        const repData = stats.repStatsMap[emp.id];
        const techData = stats.techStatsMap[emp.id];
        return (
          <div>
            {emp.role === 'SALES_REP' && (
              <div className="space-y-1 min-w-[140px]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">{isAr ? 'المحقق' : 'Won'}:</span>
                  <span className="font-bold text-slate-900">
                    {(repData?.totalRevenue || 0).toLocaleString()} ر.س
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-amber-700 font-bold">
                  <span>{isAr ? 'العمولة' : 'Commission'}:</span>
                  <span>{Math.round(repData?.commissionEarned || 0).toLocaleString()} ر.س</span>
                </div>
              </div>
            )}
            {emp.role === 'MAINTENANCE_TECH' && (
              <div className="text-xs">
                <span className="font-bold text-slate-900">
                  {techData?.assignedContractsCount || 0} {isAr ? 'عقود' : 'contracts'}
                </span>
                <span className="text-[10px] text-emerald-600 block">
                  {techData?.completedVisitsCount || 0} {isAr ? 'زيارة منجزة' : 'completed'}
                </span>
              </div>
            )}
            {emp.role !== 'SALES_REP' && emp.role !== 'MAINTENANCE_TECH' && (
              <span className="text-slate-400 text-xs">{isAr ? 'كادر إداري' : 'Admin'}</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'userAccount',
      header: isAr ? 'حساب المستخدم' : 'User Account',
      headerAr: 'حساب المستخدم',
      headerEn: 'User Account',
      sortable: true,
      accessor: (emp) => (emp.portalUser?.hasAccount ? 'YES' : 'NO'),
      renderCell: (emp) => {
        const hasUser = emp.portalUser?.hasAccount;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasUser ? (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>
                    {emp.portalUser?.portalRole === 'TECHNICIAN'
                      ? (isAr ? 'فني' : 'Tech')
                      : emp.portalUser?.portalRole === 'SALES_REP'
                      ? (isAr ? 'مبيعات' : 'Sales')
                      : (isAr ? 'إدارة' : 'Admin')}
                  </span>
                </span>
                {onSwitchUser && (
                  <button
                    type="button"
                    onClick={() => handleLoginAsEmployeeUser(emp)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                    title={isAr ? `تسجيل الدخول كـ ${emp.name}` : `Login as ${emp.name}`}
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{isAr ? 'دخول' : 'Login'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenQuickUserModal(emp)}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                  title={isAr ? 'إدارة وتعديل حساب المستخدم' : 'Manage User'}
                >
                  <Key className="w-3 h-3" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenQuickUserModal(emp)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                title={isAr ? 'إضافة وتفعيل حساب مستخدم لهذا الموظف' : 'Add User Account'}
              >
                <UserPlus className="w-3 h-3 text-emerald-600" />
                <span>{isAr ? '+ مستخدم' : '+ User'}</span>
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: isAr ? 'الحالة' : 'Status',
      headerAr: 'الحالة',
      headerEn: 'Status',
      sortable: true,
      accessor: (emp) => emp.status,
      renderCell: (emp) => {
        const statusConf = EMPLOYEE_STATUS_CONFIG[emp.status] || EMPLOYEE_STATUS_CONFIG.ACTIVE;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConf.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
            {isAr ? statusConf.labelAr : statusConf.labelEn}
          </span>
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
      renderCell: (emp) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setViewingEmployee(emp)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title={isAr ? 'عرض الملف' : 'View Profile'}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleEditClick(emp)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={isAr ? 'تعديل' : 'Edit'}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(isAr ? `حذف الموظف ${emp.name}؟` : `Delete employee ${emp.name}?`)) {
                onDeleteEmployee(emp.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title={isAr ? 'حذف' : 'Delete'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [isAr, stats, onDeleteEmployee, onSwitchUser]);

  const employeesTable = useInteractiveTable({
    tableId: 'staff_employees_table',
    columns: employeeColumns,
    data: filteredEmployees,
    isAr,
  });

  // Open quick user modal and populate fields
  const handleOpenQuickUserModal = (emp: Employee) => {
    setQuickUserModalEmployee(emp);
    const suggestedUsername = emp.portalUser?.username || 
      (emp.email ? emp.email.split('@')[0] : emp.code.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const suggestedRole: UserPortalRole = emp.portalUser?.portalRole || 
      (emp.role === 'SALES_REP' ? 'SALES_REP' : emp.role === 'MAINTENANCE_TECH' ? 'TECHNICIAN' : 'MANAGEMENT');
    
    setQuickUsername(suggestedUsername);
    setQuickEmail(emp.portalUser?.email || emp.email || `${suggestedUsername}@twinselevators.com`);
    setQuickPassword(emp.portalUser?.password || 'twins' + Math.floor(1000 + Math.random() * 9000));
    setQuickRole(suggestedRole);
    setQuickCanViewAllDepartmentRecords(emp.portalUser?.canViewAllDepartmentRecords ?? false);
    setQuickIsActive(emp.portalUser?.isActive ?? true);
    setQuickUserModalTab('CREDENTIALS');
    setShowQuickPassword(false);
  };

  // Login as employee user
  const handleLoginAsEmployeeUser = (emp: Employee) => {
    if (!onSwitchUser) return;
    const portalRole: UserPortalRole = emp.portalUser?.portalRole || 
      (emp.role === 'SALES_REP' ? 'SALES_REP' : emp.role === 'MAINTENANCE_TECH' ? 'TECHNICIAN' : 'MANAGEMENT');
    
    const userProfile: UserProfile = {
      id: emp.portalUser?.userId || `user-emp-${emp.id}`,
      name: emp.name,
      nameEn: emp.nameEn,
      role: portalRole,
      email: emp.portalUser?.email || emp.email || 'user@twinselevators.com',
      phone: emp.phone,
      avatarLabel: emp.name.slice(0, 2),
      title: emp.portalUser?.userTitle || ROLE_CONFIGS[emp.role]?.labelAr || 'موظف مصرح',
      employeeId: emp.id,
      canViewAllDepartmentRecords: emp.portalUser?.canViewAllDepartmentRecords ?? false,
    };
    onSwitchUser(userProfile);
  };

  // Save quick user modal
  const handleSaveQuickUserModal = (shouldLoginImmediately = false) => {
    if (!quickUserModalEmployee) return;
    const finalUsername = quickUsername.trim() || quickUserModalEmployee.code.toLowerCase();
    const finalEmail = quickEmail.trim() || quickUserModalEmployee.email || `${finalUsername}@twinselevators.com`;
    const finalPassword = quickPassword.trim() || 'twins1234';

    const updatedEmp: Employee = {
      ...quickUserModalEmployee,
      email: finalEmail,
      portalUser: {
        hasAccount: true,
        userId: quickUserModalEmployee.portalUser?.userId || `user-${quickUserModalEmployee.id}`,
        username: finalUsername,
        email: finalEmail,
        password: finalPassword,
        portalRole: quickRole,
        isActive: quickIsActive,
        canViewAllDepartmentRecords: quickCanViewAllDepartmentRecords,
        userTitle: ROLE_CONFIGS[quickUserModalEmployee.role]?.labelAr || 'موظف مصرح',
        lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 16),
      },
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveEmployee(updatedEmp);
    if (viewingEmployee?.id === updatedEmp.id) {
      setViewingEmployee(updatedEmp);
    }
    setQuickUserModalEmployee(null);

    setUserNotificationToast(isAr 
      ? `تم تفعيل حساب وصلاحيات الموظف (${updatedEmp.name}) بنجاح!` 
      : `User account & permissions saved for (${updatedEmp.name})!`);
    setTimeout(() => setUserNotificationToast(null), 4000);

    if (shouldLoginImmediately) {
      handleLoginAsEmployeeUser(updatedEmp);
    }
  };

  // Toggle user account in main employee form
  const handleToggleFormUserAccount = (enabled: boolean) => {
    if (!editingEmployee) return;
    if (enabled) {
      const suggestedUsername = editingEmployee.portalUser?.username || 
        (editingEmployee.email ? editingEmployee.email.split('@')[0] : editingEmployee.code.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const suggestedRole: UserPortalRole = editingEmployee.portalUser?.portalRole || 
        (editingEmployee.role === 'SALES_REP' ? 'SALES_REP' : editingEmployee.role === 'MAINTENANCE_TECH' ? 'TECHNICIAN' : 'MANAGEMENT');
      
      setEditingEmployee({
        ...editingEmployee,
        portalUser: {
          hasAccount: true,
          userId: editingEmployee.portalUser?.userId || `user-${editingEmployee.id}`,
          username: suggestedUsername,
          email: editingEmployee.email || `${suggestedUsername}@twinselevators.com`,
          password: editingEmployee.portalUser?.password || 'twins' + Math.floor(1000 + Math.random() * 9000),
          portalRole: suggestedRole,
          isActive: true,
          canViewAllDepartmentRecords: editingEmployee.portalUser?.canViewAllDepartmentRecords ?? false,
          userTitle: ROLE_CONFIGS[editingEmployee.role]?.labelAr,
        }
      });
    } else {
      setEditingEmployee({
        ...editingEmployee,
        portalUser: {
          ...(editingEmployee.portalUser || { hasAccount: false }),
          hasAccount: false,
        }
      });
    }
  };

  // Handle open create modal for ANY employee role
  const handleOpenCreateModal = (defaultRole: EmployeeRole = 'SALES_REP') => {
    const nextNum = employees.length + 1;
    let codePrefix = 'EMP';
    switch (defaultRole) {
      case 'SALES_REP': codePrefix = 'REP'; break;
      case 'MAINTENANCE_TECH': codePrefix = 'TECH'; break;
      case 'INSTALLATION_ENG': codePrefix = 'ENG'; break;
      case 'PROJECT_MANAGER': codePrefix = 'PM'; break;
      case 'MAINTENANCE_MGR': codePrefix = 'MGR'; break;
      case 'ACCOUNTANT': codePrefix = 'ACC'; break;
      case 'GENERAL_MGR': codePrefix = 'GM'; break;
      case 'HR_OFFICER': codePrefix = 'HR'; break;
      case 'CUSTOMER_SERVICE': codePrefix = 'CS'; break;
      case 'WAREHOUSE_KEEPER': codePrefix = 'WH'; break;
      case 'SAFETY_INSPECTOR': codePrefix = 'QC'; break;
      default: codePrefix = 'EMP'; break;
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      code: `${codePrefix}-${100 + nextNum}`,
      name: '',
      nameEn: '',
      role: defaultRole,
      phone: '+966 5',
      email: '',
      nationality: 'سعودي',
      status: 'ACTIVE',
      joinDate: new Date().toISOString().split('T')[0],
      commissionRate: defaultRole === 'SALES_REP' ? 2.5 : undefined,
      monthlyTargetSar: defaultRole === 'SALES_REP' ? 200000 : undefined,
      monthlyTargetElevators: defaultRole === 'SALES_REP' ? 3 : undefined,
      territory: defaultRole === 'SALES_REP' ? 'الرياض' : undefined,
      technicianSpecialty: defaultRole === 'MAINTENANCE_TECH' ? 'صيانة وقائية وكهرباء وكنترول' : undefined,
      assignedZone: defaultRole === 'MAINTENANCE_TECH' ? 'شمال الرياض' : undefined,
      emergencyOnCall: defaultRole === 'MAINTENANCE_TECH' ? false : undefined,
      engineeringSpecialty: (defaultRole === 'INSTALLATION_ENG' || defaultRole === 'PROJECT_MANAGER') ? 'تركيبات ميكانيكية وإشراف مدني وهندسي' : undefined,
      licenseNumber: (defaultRole === 'INSTALLATION_ENG' || defaultRole === 'PROJECT_MANAGER') ? 'SCE-89210' : undefined,
      warehouseLocation: defaultRole === 'WAREHOUSE_KEEPER' ? 'مستودع الرياض المركزي - قطع الغيار' : undefined,
      portalUser: {
        hasAccount: false,
        username: '',
        email: '',
        password: 'twins' + Math.floor(1000 + Math.random() * 9000),
        portalRole: defaultRole === 'SALES_REP' ? 'SALES_REP' : defaultRole === 'MAINTENANCE_TECH' ? 'TECHNICIAN' : 'MANAGEMENT',
        isActive: true,
        canViewAllDepartmentRecords: false,
      },
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setEditingEmployee(newEmp);
    setEmployeeFormTab('BASIC');
    setIsEditModalOpen(true);
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee({ ...emp });
    setEmployeeFormTab('BASIC');
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.name.trim()) return;

    onSaveEmployee({
      ...editingEmployee,
      updatedAt: new Date().toISOString().split('T')[0],
    });
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-4 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>{isAr ? 'إدارة المناديب والموظفين وكادر الصيانة' : 'Sales Reps, Staff & Technicians'}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                {employees.length} {isAr ? 'كادر' : 'Staff'}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick GPS Check-In Button */}
          <button
            type="button"
            onClick={() => onOpenAttendanceModal?.()}
            className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
            title={isAr ? 'تسجيل حضور بالموقع الجغرافي GPS' : 'Site GPS Check-In'}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isAr ? 'حضور GPS' : 'GPS Check-In'}</span>
          </button>

          {/* Primary Action: Add Employee with All 11 Roles Selector */}
          <div className="relative">
            <div className="inline-flex rounded-lg shadow-xs">
              <button
                type="button"
                onClick={() => handleOpenCreateModal('SALES_REP')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-s-lg transition-all flex items-center gap-1.5 cursor-pointer"
                title={isAr ? 'إضافة موظف جديد' : 'Add Employee'}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isAr ? '+ إضافة موظف جديد' : '+ Add Employee'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddRoleMenuOpen(!isAddRoleMenuOpen)}
                className="px-2 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-e-lg border-s border-emerald-500/40 transition-colors flex items-center justify-center cursor-pointer"
                title={isAr ? 'اختيار الدور الوظيفي للإضافة' : 'Select role to add'}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dropdown Menu listing all roles */}
            {isAddRoleMenuOpen && (
              <div 
                className="absolute end-0 top-full mt-1.5 w-64 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                dir={isAr ? 'rtl' : 'ltr'}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? 'اختر الدور الوظيفي للموظف الجديد:' : 'Choose role to add:'}
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {(Object.keys(ROLE_CONFIGS) as EmployeeRole[]).map((roleKey) => {
                    const cfg = ROLE_CONFIGS[roleKey];
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => {
                          setIsAddRoleMenuOpen(false);
                          handleOpenCreateModal(roleKey);
                        }}
                        className="w-full px-3 py-2 text-start hover:bg-slate-50 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer group"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 group-hover:text-emerald-700">
                            {isAr ? cfg.labelAr : cfg.labelEn}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isAr ? cfg.departmentAr : cfg.departmentEn}
                          </span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                          +{roleKey.slice(0, 4)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Shortcuts for Frequent Roles */}
          <button
            type="button"
            onClick={() => handleOpenCreateModal('MAINTENANCE_TECH')}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title={isAr ? 'إضافة فني صيانة ميداني' : 'Add Tech'}
          >
            <Wrench className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? '+ فني' : '+ Tech'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal('INSTALLATION_ENG')}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title={isAr ? 'إضافة مهندس تركيبات ومواقع' : 'Add Engineer'}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>{isAr ? '+ مهندس' : '+ Engineer'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal('ACCOUNTANT')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title={isAr ? 'إضافة محاسب أو موظف إداري' : 'Add Admin / Finance'}
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-700" />
            <span>{isAr ? '+ مالي / إداري' : '+ Finance'}</span>
          </button>
        </div>
      </div>

      {/* Top Section Switcher: Staff Directory vs Site Attendance Logs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('STAFF')}
          className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
            activeSection === 'STAFF'
              ? 'bg-[#172033] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? `فريق العمل (${employees.length})` : `Staff (${employees.length})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('ATTENDANCE_LOGS')}
          className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
            activeSection === 'ATTENDANCE_LOGS'
              ? 'bg-[#172033] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-rose-400" />
          <span>{isAr ? `حضور الموقع (${attendanceRecords.length})` : `Attendance (${attendanceRecords.length})`}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500/20 text-rose-300 font-bold">
            {companySettings.attendanceRadiusMeters || 150} {isAr ? 'م' : 'm'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('KPI_DASHBOARD')}
          className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
            activeSection === 'KPI_DASHBOARD'
              ? 'bg-[#172033] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAr ? 'مؤشرات الأداء KPI (شهرياً)' : 'Monthly KPI'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-500 font-black">
            {isAr ? '٥ أعطال • ١٢ صيانة' : 'Target: 5 & 12'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('REPORTS')}
          className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
            activeSection === 'REPORTS'
              ? 'bg-[#172033] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAr ? 'تقارير العمولات' : 'Commissions'}</span>
        </button>
      </div>

      {activeSection === 'ATTENDANCE_LOGS' && (
        <AttendanceLogsTable
          records={attendanceRecords}
          companySettings={companySettings}
          language={language}
          onOpenCheckInModal={() => onOpenAttendanceModal?.()}
        />
      )}

      {activeSection === 'REPORTS' && (
        <EmployeeReports
          employees={employees}
          stats={stats}
          isAr={isAr}
          technicianKpis={technicianKpis}
        />
      )}

      {/* KPI DASHBOARD SECTION (قياس شهرياً لمستهدف 5 أعطال يومياً و 12 زيارة صيانة يومياً وما أكثر فله درجات أعلى) */}
      {activeSection === 'KPI_DASHBOARD' && (
        <div className="space-y-5 animate-fadeIn" dir={isAr ? 'rtl' : 'ltr'}>
          {/* 1. Header & Period Controls */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-900/60 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    {isAr ? 'نظام قياس وتقييم الأداء الفني الميداني' : 'Technician KPI System'}
                  </span>
                  <span className="text-xs text-indigo-300 font-mono">
                    {technicianKpis.length} {isAr ? 'فنيين مشمولين' : 'technicians'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  {isAr ? 'مؤشرات الأداء KPI الشهرية للفنيين' : 'Monthly Technician KPI Dashboard'}
                </h2>
                <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl leading-relaxed">
                  {isAr 
                    ? 'المعايير المعتمدة: ٥ أعطال يومياً لفني الإصلاح • ١٢ زيارة صيانة يومياً لفني الصيانة • من ينجز أكثر يحصل على درجات تفوق وبونص تكريمي أعلى (A++ / A+)' 
                    : 'Benchmark standards: 5 breakdown fixes/day and 12 maintenance visits/day. Higher outputs achieve superior honor grades and bonus points.'}
                </p>
              </div>

              {/* Month Picker & Working Days Controls */}
              <div className="flex items-center gap-2.5 bg-white/10 p-2 rounded-xl border border-white/15 shrink-0 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-indigo-200">{isAr ? 'شهر التقييم:' : 'Month:'}</span>
                  <input
                    type="month"
                    value={kpiMonth}
                    onChange={(e) => setKpiMonth(e.target.value || new Date().toISOString().slice(0, 7))}
                    className="bg-slate-900/90 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-500/40 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-indigo-200">
                  <span className="font-bold">{isAr ? 'أيام العمل:' : 'Days:'}</span>
                  <select
                    value={kpiWorkingDays}
                    onChange={(e) => setKpiWorkingDays(Number(e.target.value) || 26)}
                    className="bg-slate-900/90 text-white font-mono text-xs font-bold px-2 py-1 rounded-lg border border-indigo-500/40"
                  >
                    <option value={26}>{isAr ? '26 يوم (قياسي)' : '26 days'}</option>
                    <option value={24}>24 {isAr ? 'يوم' : 'days'}</option>
                    <option value={22}>22 {isAr ? 'يوم' : 'days'}</option>
                    <option value={20}>20 {isAr ? 'يوم' : 'days'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Official KPI Targets Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Maintenance Standard Target */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-blue-900 uppercase flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  {isAr ? 'مستهدف الصيانة اليومي' : 'Daily Maintenance'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {DAILY_TARGET_MAINTENANCE} {isAr ? 'زيارة/يوم' : 'visits/d'}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {kpiWorkingDays * DAILY_TARGET_MAINTENANCE}
                <span className="text-xs text-slate-400 font-normal ms-1">
                  {isAr ? `زيارة شهرياً (${kpiWorkingDays} يوم)` : `visits/mo`}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isAr ? 'إنجاز الزيارات الدورية وفحص الأمان والتشحيم' : 'Routine visits & safety inspections'}
              </div>
            </div>

            {/* Breakdowns Standard Target */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-rose-900 uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {isAr ? 'مستهدف الأعطال اليومي' : 'Daily Repairs'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {DAILY_TARGET_BREAKDOWNS} {isAr ? 'أعطال/يوم' : 'repairs/d'}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {kpiWorkingDays * DAILY_TARGET_BREAKDOWNS}
                <span className="text-xs text-slate-400 font-normal ms-1">
                  {isAr ? `إصلاح شهرياً (${kpiWorkingDays} يوم)` : `repairs/mo`}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isAr ? 'سرعة الاستجابة وفك الاحتجاز ومعالجة الأعطال' : 'Emergency dispatch & rapid repairs'}
              </div>
            </div>

            {/* Grade & Bonus System Rule Card */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  {isAr ? 'نظام الدرجات والبونص' : 'Grades & Honors'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  A++ / A+
                </span>
              </div>
              <div className="text-lg font-black text-amber-900">
                {isAr ? 'وما أكثر فله درجات أعلى ⭐' : 'Overachiever Bonus'}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {isAr ? 'تحقيق > 100% يمنح الفني درجات تفوق وبونص تميز إضافي' : 'Exceeding targets unlocks honors tier and distinction points'}
              </div>
            </div>

            {/* Total Month Performance Snapshot */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-purple-900 uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  {isAr ? 'فارس الأداء لهذا الشهر' : 'Top Performer'}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              {(() => {
                const topTech = [...technicianKpis].sort((a, b) => b.compositeScore - a.compositeScore)[0];
                return topTech ? (
                  <div>
                    <div className="font-black text-slate-900 text-sm truncate">{topTech.technicianName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-black border ${topTech.badgeClass}`}>
                        {topTech.grade}
                      </span>
                      <span className="font-mono font-bold text-xs text-purple-700">
                        {topTech.compositeScore}% {topTech.isOverachiever && `(+${topTech.bonusPoints} بونص)`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">{isAr ? 'لا يوجد بيانات' : 'No data'}</div>
                );
              })()}
            </div>
          </div>

          {/* 2.5 Recharts 30-Day Performance & Productivity Trend Chart */}
          <Employee30DayTrendChart
            employees={employees}
            contracts={maintenanceContracts}
            breakdowns={breakdowns}
            projects={projects}
            attendanceRecords={attendanceRecords}
            isAr={isAr}
          />

          {/* 3. Detailed Technician KPI Performance Cards */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>{isAr ? `نتائج وتقييم الفنيين لشهر (${kpiMonth})` : `Technicians Scorecard for (${kpiMonth})`}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicianKpis.map((kpi) => {
                return (
                  <div
                    key={kpi.technicianId}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 relative overflow-hidden"
                  >
                    {/* Top Stripe: Tech Profile & Grade Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl ${kpi.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs`}>
                          {kpi.technicianName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm leading-tight">{kpi.technicianName}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                            <span>{kpi.technicianCode}</span>
                            {kpi.assignedZone && (
                              <span className="text-slate-400 font-sans truncate max-w-[120px]">&bull; {kpi.assignedZone}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Grade Badge */}
                      <div className="text-center shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black border ${kpi.badgeClass}`}>
                          {kpi.grade}
                        </span>
                        <div className="text-[10px] text-slate-500 font-bold mt-0.5 font-mono">
                          {kpi.compositeScore}%
                        </div>
                      </div>
                    </div>

                    {/* Honor / Overachiever Banner if score >= 100 */}
                    {kpi.isOverachiever && (
                      <div className="bg-gradient-to-r from-purple-50 to-emerald-50 border border-purple-200 text-purple-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{isAr ? kpi.gradeLabelAr : kpi.gradeLabelEn}</span>
                        </span>
                        <span className="font-mono bg-purple-200/60 px-1.5 py-0.2 rounded text-[10px] text-purple-800">
                          +{kpi.bonusPoints} {isAr ? 'درجة تميز' : 'pts'}
                        </span>
                      </div>
                    )}

                    {/* Metric 1: Maintenance Visits (12/day Target) */}
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-blue-600" />
                          <span>{isAr ? 'زيارات الصيانة الدورية' : 'Maintenance Visits'}</span>
                        </span>
                        <span className="font-mono font-bold text-blue-900">
                          {kpi.completedVisitsCount} / {kpi.monthlyVisitsTarget}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            kpi.visitsAchievementPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, kpi.visitsAchievementPct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {isAr ? 'المعدل اليومي: ' : 'Daily avg: '}
                          <strong className="text-slate-800 font-mono">{kpi.dailyVisitsAvg}</strong>
                          <span className="text-[10px] text-slate-400"> (مستهدف 12)</span>
                        </span>
                        <span className={`font-mono font-bold ${kpi.visitsAchievementPct >= 100 ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {kpi.visitsAchievementPct}%
                        </span>
                      </div>
                    </div>

                    {/* Metric 2: Breakdown Repairs (5/day Target) */}
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{isAr ? 'إصلاح بلاغات الأعطال' : 'Breakdown Repairs'}</span>
                        </span>
                        <span className="font-mono font-bold text-rose-900">
                          {kpi.resolvedBreakdownsCount} / {kpi.monthlyBreakdownsTarget}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            kpi.breakdownsAchievementPct >= 100 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, kpi.breakdownsAchievementPct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {isAr ? 'المعدل اليومي: ' : 'Daily avg: '}
                          <strong className="text-slate-800 font-mono">{kpi.dailyBreakdownsAvg}</strong>
                          <span className="text-[10px] text-slate-400"> (مستهدف 5)</span>
                        </span>
                        <span className={`font-mono font-bold ${kpi.breakdownsAchievementPct >= 100 ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {kpi.breakdownsAchievementPct}%
                        </span>
                      </div>
                    </div>

                    {/* Footer Score Summary */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">
                        {isAr ? 'التقييم والدرجات المستحقة:' : 'Evaluation:'}
                      </span>
                      <span className="font-black text-slate-900">
                        {isAr ? kpi.gradeLabelAr : kpi.gradeLabelEn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'STAFF' && (
        <>
          {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Total Staff Card */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 block truncate">
              {isAr ? 'إجمالي الموظفين' : 'Total Employees'}
            </span>
            <span className="text-base font-black text-slate-900 leading-tight">
              {stats.totalStaff}{' '}
              <span className="text-[10px] font-bold text-emerald-600">
                ({stats.activeStaff} {isAr ? 'نشط' : 'act'})
              </span>
            </span>
          </div>
        </div>

        {/* Sales Targets Card */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 block truncate">
              {isAr ? 'تارقت المبيعات الشهري' : 'Sales Target'}
            </span>
            <div className="text-base font-black text-slate-900 flex items-center gap-0.5 leading-tight truncate">
              <span>{stats.totalMonthlySalesTarget.toLocaleString()}</span>
              <SaudiRiyalSymbol className="w-3 h-3 text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* Sales Commissions Earned Card */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 block truncate">
              {isAr ? 'عمولات البيع المحققة' : 'Commissions'}
            </span>
            <div className="text-base font-black text-amber-800 flex items-center gap-0.5 leading-tight truncate">
              <span>{Math.round(stats.totalCommissionsEarned).toLocaleString()}</span>
              <SaudiRiyalSymbol className="w-3 h-3 text-amber-700 shrink-0" />
            </div>
          </div>
        </div>

        {/* Maintenance Technicians Card */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 block truncate">
              {isAr ? 'كادر الصيانة الميداني' : 'Technicians'}
            </span>
            <span className="text-base font-black text-slate-900 leading-tight">
              {stats.techniciansCount} {isAr ? 'فني' : 'Techs'}
            </span>
          </div>
        </div>
      </div>

      {/* Target Progress Bar for Sales Team */}
      {stats.totalMonthlySalesTarget > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'أداء فريق المبيعات والمناديب نحو التارقت المالي العام' : 'Sales Team Target Progress'}</span>
            </div>
            <div className="flex items-center gap-3 font-semibold text-slate-600">
              <span>
                {isAr ? 'المحقق' : 'Achieved'}:{' '}
                <strong className="text-emerald-700">{stats.totalAchievedSales.toLocaleString()}</strong> ر.س
              </span>
              <span>/</span>
              <span>
                {isAr ? 'الهدف' : 'Target'}:{' '}
                <strong className="text-slate-900">{stats.totalMonthlySalesTarget.toLocaleString()}</strong> ر.س
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {Math.min(100, Math.round((stats.totalAchievedSales / stats.totalMonthlySalesTarget) * 100))}%
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((stats.totalAchievedSales / stats.totalMonthlySalesTarget) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Role Segmented Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? `الكل (${employees.length})` : `All (${employees.length})`}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('SALES_REP')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedRoleFilter === 'SALES_REP'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              {isAr ? `المناديب (${stats.salesRepsCount})` : `Sales Reps (${stats.salesRepsCount})`}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('MAINTENANCE_TECH')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedRoleFilter === 'MAINTENANCE_TECH'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              {isAr ? `فنيو الصيانة (${stats.techniciansCount})` : `Techs (${stats.techniciansCount})`}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('INSTALLATION_ENG')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'INSTALLATION_ENG'
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'مهندسو المواقع' : 'Site Engineers'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('PROJECT_MANAGER')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'PROJECT_MANAGER'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'إدارة المشاريع' : 'Project Mgmt'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('MAINTENANCE_MGR')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'MAINTENANCE_MGR'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'مديرو الصيانة' : 'Maint Directors'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('ACCOUNTANT')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'ACCOUNTANT'
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'المالية والمحاسبة' : 'Finance'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('GENERAL_MGR')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'GENERAL_MGR'
                  ? 'bg-rose-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الإدارة العليا' : 'Management'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('HR_OFFICER')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'HR_OFFICER'
                  ? 'bg-cyan-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'شؤون الموظفين HR' : 'HR'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('CUSTOMER_SERVICE')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'CUSTOMER_SERVICE'
                  ? 'bg-teal-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'خدمة العملاء' : 'Customer Service'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('WAREHOUSE_KEEPER')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'WAREHOUSE_KEEPER'
                  ? 'bg-orange-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'المستودع وقطع الغيار' : 'Warehouse'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('SAFETY_INSPECTOR')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoleFilter === 'SAFETY_INSPECTOR'
                  ? 'bg-lime-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'مشرفو الجودة والسلامة' : 'Safety & HSE'}
            </button>
          </div>

          {/* Search, Status, & View Mode Switch */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم، الكود، الهاتف أو المنطقة...' : 'Search name, code, phone, zone...'}
                className="w-full text-xs ps-9 pe-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="min-w-[140px]">
              <SearchableSelect
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="ACTIVE">{isAr ? 'على رأس العمل' : 'Active'}</option>
                <option value="ON_LEAVE">{isAr ? 'في إجازة' : 'On Leave'}</option>
                <option value="INACTIVE">{isAr ? 'غير نشط' : 'Inactive'}</option>
              </SearchableSelect>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title={isAr ? 'عرض البطاقات' : 'Grid View'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title={isAr ? 'عرض الجدول' : 'Table View'}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Grid View */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const roleConf = ROLE_CONFIGS[emp.role] || ROLE_CONFIGS.SALES_REP;
            const statusConf = EMPLOYEE_STATUS_CONFIG[emp.status] || EMPLOYEE_STATUS_CONFIG.ACTIVE;
            const repData = stats.repStatsMap[emp.id];
            const techData = stats.techStatsMap[emp.id];

            // Target calculations for sales reps
            const target = emp.monthlyTargetSar || 0;
            const achieved = repData?.totalRevenue || 0;
            const targetPct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
            const commission = repData?.commissionEarned || 0;

            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Code, Role badge, and Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                        {emp.code}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleConf.badgeBg} ${roleConf.badgeText} ${roleConf.badgeBorder}`}
                      >
                        {isAr ? roleConf.labelAr : roleConf.labelEn}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConf.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                      {isAr ? statusConf.labelAr : statusConf.labelEn}
                    </span>
                  </div>

                  {/* Profile Header: Avatar & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${
                        emp.avatarBg || 'bg-emerald-600'
                      } text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0`}
                    >
                      {emp.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">{emp.name}</h3>
                      {emp.nameEn && <span className="text-[11px] text-slate-400 block truncate">{emp.nameEn}</span>}
                      <span className="text-[11px] text-slate-500 block truncate font-medium">
                        {isAr ? roleConf.departmentAr : roleConf.departmentEn}
                      </span>
                    </div>
                  </div>

                  {/* Direct Contacts Strip */}
                  <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 mb-3.5">
                    {emp.phone && (
                      <a
                        href={`tel:${emp.phone}`}
                        className="inline-flex items-center gap-1 hover:text-emerald-600 font-mono text-[11px] transition-colors"
                        title={isAr ? 'اتصال هاتفي' : 'Call'}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span dir="ltr">{emp.phone}</span>
                      </a>
                    )}

                    {emp.phone && (
                      <a
                        href={`https://wa.me/${emp.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors ms-auto"
                        title={isAr ? 'مراسلة عبر واتساب' : 'WhatsApp'}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}

                    {emp.email && (
                      <a
                        href={`mailto:${emp.email}`}
                        className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                        title={isAr ? 'إرسال بريد إلكتروني' : 'Email'}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Role Specific Section: SALES_REP */}
                  {emp.role === 'SALES_REP' && (
                    <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 mb-3 text-xs">
                      {/* Territory */}
                      {emp.territory && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {isAr ? 'نطاق التغطية / المنطقة' : 'Territory'}
                          </span>
                          <span className="font-bold text-slate-800">{emp.territory}</span>
                        </div>
                      )}

                      {/* Commission rate */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{isAr ? 'نسبة العمولة' : 'Commission Rate'}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {emp.commissionRate || 2.5}%
                        </span>
                      </div>

                      {/* Monthly Target Bar */}
                      {target > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-semibold">
                              {isAr ? 'تارقت المبيعات' : 'Sales Target'}
                            </span>
                            <span className="font-bold text-slate-900 flex items-center gap-0.5">
                              {achieved.toLocaleString()} / {target.toLocaleString()}
                              <SaudiRiyalSymbol className="w-3 h-3 text-emerald-600" />
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${targetPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>{targetPct}% محقق</span>
                            <span>
                              {repData?.wonProjectsCount || 0} {isAr ? 'مشاريع فائزة' : 'won projects'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Calculated Commission Badge */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs font-bold">
                        <span className="text-amber-800 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          {isAr ? 'العمولة المستحقة' : 'Commission'}:
                        </span>
                        <span className="text-amber-700 flex items-center gap-1">
                          {Math.round(commission).toLocaleString()}
                          <SaudiRiyalSymbol className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Role Specific Section: MAINTENANCE_TECH */}
                  {emp.role === 'MAINTENANCE_TECH' && (
                    <div className="space-y-2 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 mb-3 text-xs">
                      {emp.technicianSpecialty && (
                        <div>
                          <span className="text-[10px] font-bold text-blue-700 block">
                            {isAr ? 'التخصص الفني:' : 'Specialty:'}
                          </span>
                          <span className="text-[11px] text-slate-700 font-medium block mt-0.5">
                            {emp.technicianSpecialty}
                          </span>
                        </div>
                      )}

                      {emp.assignedZone && (
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {isAr ? 'نطاق التغطية' : 'Zone'}
                          </span>
                          <span className="font-bold text-slate-800">{emp.assignedZone}</span>
                        </div>
                      )}

                      {/* Emergency 24/7 on call tag */}
                      {emp.emergencyOnCall && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            {isAr ? 'فني مناوب طوارئ 24/7' : '24/7 Emergency On-Call'}
                          </span>
                        </div>
                      )}

                      {/* Active Maintenance Contracts & Completed Visits */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-100 text-center">
                        <div className="bg-white p-1.5 rounded-lg border border-blue-100">
                          <span className="text-[10px] text-slate-500 block">{isAr ? 'عقود مسندة' : 'Contracts'}</span>
                          <span className="font-black text-xs text-blue-900">
                            {techData?.assignedContractsCount || 0}
                          </span>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg border border-blue-100">
                          <span className="text-[10px] text-slate-500 block">{isAr ? 'زيارات مكتملة' : 'Completed'}</span>
                          <span className="font-black text-xs text-emerald-600">
                            {techData?.completedVisitsCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General details: National ID & Join Date */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    {emp.nationalIdOrIqama && (
                      <span className="font-mono">
                        {isAr ? 'الهوية:' : 'ID:'} {emp.nationalIdOrIqama}
                      </span>
                    )}
                    <span>
                      {isAr ? 'التعيين:' : 'Joined:'} {emp.joinDate || '-'}
                    </span>
                  </div>

                  {/* User Portal Account Strip */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    {emp.portalUser?.hasAccount ? (
                      <div className="flex items-center justify-between w-full bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-bold text-emerald-900 truncate">
                            {isAr ? 'مستخدم البوابة' : 'Portal'}: <span className="font-mono text-[10px] text-emerald-700">@{emp.portalUser.username}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {onSwitchUser && (
                            <button
                              type="button"
                              onClick={() => handleLoginAsEmployeeUser(emp)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title={isAr ? `تسجيل الدخول كـ ${emp.name}` : `Login as ${emp.name}`}
                            >
                              <Zap className="w-3 h-3 text-amber-300" />
                              <span>{isAr ? 'دخول' : 'Login'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenQuickUserModal(emp)}
                            className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title={isAr ? 'إدارة وتعديل حساب المستخدم' : 'Manage User Account'}
                          >
                            <Key className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl px-2.5 py-1.5">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>{isAr ? 'لا يوجد حساب مستخدم' : 'No user account'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickUserModal(emp)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3 text-emerald-600" />
                          <span>{isAr ? '+ إضافة مستخدم' : '+ Add User'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setViewingEmployee(emp)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'ملف الأداء' : 'Profile'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditClick(emp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={isAr ? 'تعديل البيانات' : 'Edit'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(isAr ? `هل أنت متأكد من حذف ${emp.name}؟` : `Delete employee ${emp.name}?`)) {
                          onDeleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content: Table View */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Control Bar for Drag-and-Drop and Sorting Reset */}
          <TableControlBar
            isReordered={employeesTable.isReordered}
            onResetOrder={employeesTable.resetColumnOrder}
            sortKey={employeesTable.sortKey}
            sortDir={employeesTable.sortDir}
            onResetSort={employeesTable.resetSort}
            isAr={isAr}
            totalCount={employeesTable.sortedData.length}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left divide-y divide-slate-200">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  {employeesTable.orderedColumns.map((col) => (
                    <InteractiveTableHeader
                      key={col.id}
                      column={col}
                      sortKey={employeesTable.sortKey}
                      sortDir={employeesTable.sortDir}
                      onSort={employeesTable.handleSort}
                      draggedColId={employeesTable.draggedColId}
                      dragOverColId={employeesTable.dragOverColId}
                      onDragStart={employeesTable.handleDragStart}
                      onDragOver={employeesTable.handleDragOver}
                      onDragLeave={employeesTable.handleDragLeave}
                      onDrop={employeesTable.handleDrop}
                      onDragEnd={employeesTable.handleDragEnd}
                      isAr={isAr}
                      theme="dark"
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeesTable.sortedData.map((emp, rowIdx) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {employeesTable.orderedColumns.map((col) => (
                      <td
                        key={col.id}
                        className={`py-3 px-4 ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'end'
                            ? 'text-end'
                            : 'text-start'
                        } ${col.className || ''}`}
                      >
                        {col.renderCell(emp, rowIdx)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            {isAr ? 'لم يتم العثور على موظفين أو مناديب مطابقين' : 'No matching staff found'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isAr
              ? 'يرجى تغيير معايير البحث أو إضافة مندوب أو موظف جديد'
              : 'Try changing filter criteria or create a new employee'}
          </p>
        </div>
      )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT EMPLOYEE                                              */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-extrabold">
                  {editingEmployee.name
                    ? isAr
                      ? `تعديل بيانات: ${editingEmployee.name}`
                      : `Edit: ${editingEmployee.name}`
                    : isAr
                    ? 'إضافة مندوب أو موظف جديد'
                    : 'Add New Employee'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setEmployeeFormTab('BASIC')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  employeeFormTab === 'BASIC'
                    ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'البيانات الأساسية والوظيفية' : 'Basic Info'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEmployeeFormTab('JOB_DETAILS')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  employeeFormTab === 'JOB_DETAILS'
                    ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isAr ? 'التخصص والميدان' : 'Field & Specialty'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEmployeeFormTab('USER_PERMISSIONS')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  employeeFormTab === 'USER_PERMISSIONS'
                    ? 'border-indigo-600 text-indigo-900 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-indigo-800'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isAr ? 'حساب الدخول والصلاحيات' : 'User & Permissions'}</span>
                {editingEmployee.portalUser?.hasAccount && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* ========================================================================= */}
              {/* TAB 1: BASIC & JOB ROLE DETAILS                                          */}
              {/* ========================================================================= */}
              {employeeFormTab === 'BASIC' && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'الاسم الكامل بالعربية *' : 'Full Name (Arabic) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingEmployee.name}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                        placeholder={isAr ? 'مثال: م. أحمد كمال الغامدي' : 'e.g. Eng. Ahmed Al-Ghamdi'}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'الاسم بالإنجليزية (اختياري)' : 'English Name (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.nameEn || ''}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, nameEn: e.target.value })}
                        placeholder="e.g. Ahmed Al-Ghamdi"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'الكود الوظيفي *' : 'Employee Code *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingEmployee.code}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, code: e.target.value })}
                        placeholder="REP-101"
                        className="w-full text-xs p-2.5 font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'الدور الوظيفي بالمنشأة (Role) *' : 'Role & Department *'}
                      </label>
                      <SearchableSelect
                        value={editingEmployee.role}
                        onChange={(e) => {
                          const newRole = e.target.value as EmployeeRole;
                          const prefixMap: Record<EmployeeRole, string> = {
                            SALES_REP: 'REP',
                            MAINTENANCE_TECH: 'TECH',
                            INSTALLATION_ENG: 'ENG',
                            PROJECT_MANAGER: 'PM',
                            MAINTENANCE_MGR: 'MGR',
                            ACCOUNTANT: 'ACC',
                            GENERAL_MGR: 'GM',
                            HR_OFFICER: 'HR',
                            CUSTOMER_SERVICE: 'CS',
                            WAREHOUSE_KEEPER: 'WH',
                            SAFETY_INSPECTOR: 'QC',
                          };
                          const prefix = prefixMap[newRole] || 'EMP';
                          let updatedCode = editingEmployee.code;
                          if (/^[A-Z]{2,4}-\d+$/.test(updatedCode)) {
                            const numPart = updatedCode.split('-')[1];
                            updatedCode = `${prefix}-${numPart}`;
                          }
                          setEditingEmployee({
                            ...editingEmployee,
                            role: newRole,
                            code: updatedCode,
                            portalUser: editingEmployee.portalUser ? {
                              ...editingEmployee.portalUser,
                              portalRole: newRole === 'SALES_REP' ? 'SALES_REP' : newRole === 'MAINTENANCE_TECH' ? 'TECHNICIAN' : 'MANAGEMENT',
                            } : undefined,
                          });
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="SALES_REP">{isAr ? 'مندوب مبيعات ومشاريع (Sales Rep)' : 'Sales Representative'}</option>
                        <option value="MAINTENANCE_TECH">{isAr ? 'فني صيانة ميداني (Maintenance Tech)' : 'Maintenance Technician'}</option>
                        <option value="INSTALLATION_ENG">{isAr ? 'مهندس تركيبات ومواقع (Installation Engineer)' : 'Installation Engineer'}</option>
                        <option value="PROJECT_MANAGER">{isAr ? 'مدير مشاريع وتسليم (Project Manager)' : 'Project Manager'}</option>
                        <option value="MAINTENANCE_MGR">{isAr ? 'مدير إدارة الصيانة (Maintenance Director)' : 'Maintenance Director'}</option>
                        <option value="ACCOUNTANT">{isAr ? 'محاسب وتدقيق مالي (Accountant)' : 'Financial Accountant'}</option>
                        <option value="GENERAL_MGR">{isAr ? 'مدير عام / إدارة عليا (General Manager)' : 'General Manager'}</option>
                        <option value="HR_OFFICER">{isAr ? 'مسؤول شؤون موظفين (HR Officer)' : 'HR Officer'}</option>
                        <option value="CUSTOMER_SERVICE">{isAr ? 'خدمة عملاء واستقبال (Customer Service)' : 'Customer Service'}</option>
                        <option value="WAREHOUSE_KEEPER">{isAr ? 'أمين مستودع وقطع غيار (Warehouse Keeper)' : 'Warehouse Keeper'}</option>
                        <option value="SAFETY_INSPECTOR">{isAr ? 'مشرف جودة وسلامة مهنية (Safety Inspector)' : 'Safety Inspector'}</option>
                      </SearchableSelect>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'رقم الهاتف / الجوال *' : 'Phone / Mobile *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={editingEmployee.phone}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                        placeholder="+966 50 123 4567"
                        dir="ltr"
                        className="w-full text-xs p-2.5 font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'البريد الإلكتروني للعمل' : 'Work Email'}
                      </label>
                      <input
                        type="email"
                        value={editingEmployee.email}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                        placeholder="rep@twinselevators.com"
                        dir="ltr"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'رقم الهوية الوطنية / الإقامة' : 'National ID / Iqama'}
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.nationalIdOrIqama || ''}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, nationalIdOrIqama: e.target.value })}
                        placeholder="10XXXXXXXX"
                        className="w-full text-xs p-2.5 font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'حالة الموظف' : 'Status'}
                      </label>
                      <SearchableSelect
                        value={editingEmployee.status}
                        onChange={(e) =>
                          setEditingEmployee({ ...editingEmployee, status: e.target.value as EmployeeStatus })
                        }
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="ACTIVE">{isAr ? 'على رأس العمل (نشط)' : 'Active'}</option>
                        <option value="ON_LEAVE">{isAr ? 'في إجازة رسمية' : 'On Leave'}</option>
                        <option value="INACTIVE">{isAr ? 'غير نشط' : 'Inactive'}</option>
                      </SearchableSelect>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'تاريخ الالتحاق' : 'Join Date'}
                      </label>
                      <input
                        type="date"
                        value={editingEmployee.joinDate}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, joinDate: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'الجنسية' : 'Nationality'}
                      </label>
                      <input
                        type="text"
                        value={editingEmployee.nationality || 'سعودي'}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, nationality: e.target.value })}
                        placeholder={isAr ? 'مثال: سعودي' : 'Saudi'}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setEmployeeFormTab('JOB_DETAILS')}
                      className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isAr ? 'التالي: بيانات التخصص والميدان ←' : 'Next: Field Details →'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: FIELD, TARGETS & SPECIALTY (JOB_DETAILS)                          */}
              {/* ========================================================================= */}
              {employeeFormTab === 'JOB_DETAILS' && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  {/* Dynamic Section: If Role is SALES_REP */}
                  {editingEmployee.role === 'SALES_REP' && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                        <Award className="w-4 h-4 text-emerald-700" />
                        <span>{isAr ? 'محددات التارقت والعمولة لمندوب المبيعات' : 'Sales Rep Target & Commission'}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {isAr ? 'نسبة العمولة (%)' : 'Commission Rate (%)'}
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="50"
                            value={editingEmployee.commissionRate ?? 2.5}
                            onChange={(e) =>
                              setEditingEmployee({
                                ...editingEmployee,
                                commissionRate: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full text-xs p-2 rounded-lg border border-emerald-300 bg-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {isAr ? 'تارقت المبيعات الشهري (ر.س)' : 'Monthly Sales Target (SAR)'}
                          </label>
                          <input
                            type="number"
                            step="5000"
                            min="0"
                            value={editingEmployee.monthlyTargetSar ?? 200000}
                            onChange={(e) =>
                              setEditingEmployee({
                                ...editingEmployee,
                                monthlyTargetSar: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full text-xs p-2 rounded-lg border border-emerald-300 bg-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {isAr ? 'هدف عدد المصاعد / شهر' : 'Target Lifts / Mo'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={editingEmployee.monthlyTargetElevators ?? 3}
                            onChange={(e) =>
                              setEditingEmployee({
                                ...editingEmployee,
                                monthlyTargetElevators: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-full text-xs p-2 rounded-lg border border-emerald-300 bg-white font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {isAr ? 'نطاق التغطية الجغرافي / المدن والقطاعات المسندة' : 'Sales Territory & Sector'}
                        </label>
                        <input
                          type="text"
                          value={editingEmployee.territory || ''}
                          onChange={(e) => setEditingEmployee({ ...editingEmployee, territory: e.target.value })}
                          placeholder={isAr ? 'مثال: شمال ووسط الرياض، المشاريع التجارية والأبراج' : 'e.g. North Riyadh, Commercial Towers'}
                          className="w-full text-xs p-2 rounded-lg border border-emerald-300 bg-white font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Section: If Role is MAINTENANCE_TECH */}
                  {editingEmployee.role === 'MAINTENANCE_TECH' && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                        <Wrench className="w-4 h-4 text-blue-700" />
                        <span>{isAr ? 'بيانات التخصص والتغطية الفنية لفني الصيانة' : 'Technician Specialty & Coverage'}</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {isAr ? 'التخصص الفني الدقيق' : 'Technical Specialty'}
                        </label>
                        <input
                          type="text"
                          value={editingEmployee.technicianSpecialty || ''}
                          onChange={(e) =>
                            setEditingEmployee({ ...editingEmployee, technicianSpecialty: e.target.value })
                          }
                          placeholder={isAr ? 'مثال: لوحات تحكم، أنظمة الأمان والفرامل، صيانة وقائية' : 'e.g. Controls, Safety, Electrical'}
                          className="w-full text-xs p-2 rounded-lg border border-blue-300 bg-white font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {isAr ? 'نطاق التغطية الميداني (الحي / المدينة)' : 'Assigned Zone / Neighborhood'}
                          </label>
                          <input
                            type="text"
                            value={editingEmployee.assignedZone || ''}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, assignedZone: e.target.value })}
                            placeholder={isAr ? 'مثال: شمال ووسط الرياض' : 'e.g. North & Central Riyadh'}
                            className="w-full text-xs p-2 rounded-lg border border-blue-300 bg-white font-medium"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-5">
                          <label className="relative flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingEmployee.emergencyOnCall || false}
                              onChange={(e) =>
                                setEditingEmployee({ ...editingEmployee, emergencyOnCall: e.target.checked })
                              }
                              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                            />
                            <span>{isAr ? 'مناوب طوارئ 24/7 (أعطال المصاعد)' : '24/7 Emergency On-Call'}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Section: If Role is INSTALLATION_ENG or PROJECT_MANAGER */}
                  {(editingEmployee.role === 'INSTALLATION_ENG' || editingEmployee.role === 'PROJECT_MANAGER') && (
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-purple-900">
                        <Layers className="w-4 h-4 text-purple-700" />
                        <span>{isAr ? 'بيانات الاعتماد الهندسي والمواقع' : 'Engineering Credentials & Sites'}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {isAr ? 'التخصص الهندسي' : 'Engineering Specialty'}
                          </label>
                          <input
                            type="text"
                            value={editingEmployee.engineeringSpecialty || ''}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, engineeringSpecialty: e.target.value })}
                            placeholder={isAr ? 'مثال: هندسة ميكانيكية وإشراف مدني' : 'e.g. Mechanical & Civil Inspection'}
                            className="w-full text-xs p-2 rounded-lg border border-purple-300 bg-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {isAr ? 'رقم اعتماد الهيئة السعودية للمهندسين SCE' : 'SCE License Number'}
                          </label>
                          <input
                            type="text"
                            value={editingEmployee.licenseNumber || ''}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, licenseNumber: e.target.value })}
                            placeholder="SCE-XXXXX"
                            className="w-full text-xs p-2 rounded-lg border border-purple-300 bg-white font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Section: If Role is WAREHOUSE_KEEPER */}
                  {editingEmployee.role === 'WAREHOUSE_KEEPER' && (
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-xs text-orange-900">
                        <Briefcase className="w-4 h-4 text-orange-700" />
                        <span>{isAr ? 'المستودع وقطع الغيار المسندة' : 'Assigned Warehouse & Parts'}</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {isAr ? 'المستودع الرئيسي / الفرع' : 'Warehouse Location / Branch'}
                        </label>
                        <input
                          type="text"
                          value={editingEmployee.warehouseLocation || ''}
                          onChange={(e) => setEditingEmployee({ ...editingEmployee, warehouseLocation: e.target.value })}
                          placeholder={isAr ? 'مستودع الرياض المركزي - قطع الغيار والمحركات' : 'Central Warehouse - Motors & Spares'}
                          className="w-full text-xs p-2 rounded-lg border border-orange-300 bg-white font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes for all roles */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'ملاحظات إدارية، مؤهلات، أو دورات تدريبية' : 'Certifications & Administrative Notes'}
                    </label>
                    <textarea
                      rows={3}
                      value={editingEmployee.notes || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, notes: e.target.value })}
                      placeholder={isAr ? 'أي مؤهلات، دورات تدريبية، أو تفاصيل خاصة...' : 'Certifications, training, notes...'}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setEmployeeFormTab('BASIC')}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <span>{isAr ? '← السابق: البيانات الأساسية' : '← Back: Basic Info'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmployeeFormTab('USER_PERMISSIONS')}
                      className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isAr ? 'التالي: حساب الدخول والصلاحيات ←' : 'Next: User & Permissions →'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: USER PORTAL ACCOUNT & SCOPE PERMISSIONS (USER_PERMISSIONS)        */}
              {/* ========================================================================= */}
              {employeeFormTab === 'USER_PERMISSIONS' && (
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Key className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">
                            {isAr ? 'حساب مستخدم النظام وبوابة الدخول' : 'Portal User Account & Login'}
                          </h4>
                          <p className="text-[10px] text-indigo-700/80">
                            {isAr ? 'تمكين الموظف من تسجيل الدخول واستخدام النظام بصلاحياته' : 'Enable employee login with tailored role permissions'}
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingEmployee.portalUser?.hasAccount || false}
                          onChange={(e) => handleToggleFormUserAccount(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {editingEmployee.portalUser?.hasAccount ? (
                      <div className="pt-2 border-t border-indigo-100 space-y-4">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-indigo-800 font-bold">
                            {isAr ? 'بيانات الاعتماد والدخول' : 'Login Credentials'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const suggestedHandle = editingEmployee.email
                                ? editingEmployee.email.split('@')[0]
                                : (editingEmployee.code.toLowerCase().replace(/[^a-z0-9]/g, '') || 'emp');
                              setEditingEmployee({
                                ...editingEmployee,
                                portalUser: {
                                  ...editingEmployee.portalUser,
                                  hasAccount: true,
                                  username: suggestedHandle,
                                  email: editingEmployee.email || `${suggestedHandle}@twinselevators.com`,
                                  password: 'twins' + Math.floor(1000 + Math.random() * 9000),
                                  portalRole: editingEmployee.role === 'SALES_REP'
                                    ? 'SALES_REP'
                                    : editingEmployee.role === 'MAINTENANCE_TECH'
                                    ? 'TECHNICIAN'
                                    : 'MANAGEMENT',
                                  isActive: true,
                                  canViewAllDepartmentRecords: editingEmployee.portalUser?.canViewAllDepartmentRecords ?? false,
                                },
                              });
                            }}
                            className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer"
                          >
                            {isAr ? 'توليد بيانات الدخول تلقائياً ⚡' : 'Auto-Generate Credentials ⚡'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'اسم المستخدم (Username) *' : 'Username *'}
                            </label>
                            <input
                              type="text"
                              required={editingEmployee.portalUser?.hasAccount}
                              value={editingEmployee.portalUser?.username || ''}
                              onChange={(e) =>
                                setEditingEmployee({
                                  ...editingEmployee,
                                  portalUser: {
                                    ...editingEmployee.portalUser!,
                                    username: e.target.value,
                                  },
                                })
                              }
                              placeholder="m.shennawy"
                              className="w-full text-xs p-2 rounded-lg border border-indigo-200 bg-white font-mono font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'البريد الإلكتروني للدخول' : 'Login Email'}
                            </label>
                            <input
                              type="email"
                              value={editingEmployee.portalUser?.email || editingEmployee.email || ''}
                              onChange={(e) =>
                                setEditingEmployee({
                                  ...editingEmployee,
                                  portalUser: {
                                    ...editingEmployee.portalUser!,
                                    email: e.target.value,
                                  },
                                })
                              }
                              placeholder="emp@twinselevators.com"
                              className="w-full text-xs p-2 rounded-lg border border-indigo-200 bg-white font-mono text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'كلمة المرور / الرمز السري' : 'Password / PIN'}
                            </label>
                            <div className="relative">
                              <input
                                type={showQuickPassword ? 'text' : 'password'}
                                value={editingEmployee.portalUser?.password || ''}
                                onChange={(e) =>
                                  setEditingEmployee({
                                    ...editingEmployee,
                                    portalUser: {
                                      ...editingEmployee.portalUser!,
                                      password: e.target.value,
                                    },
                                  })
                                }
                                placeholder="******"
                                className="w-full text-xs p-2 pe-8 rounded-lg border border-indigo-200 bg-white font-mono font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowQuickPassword(!showQuickPassword)}
                                className="absolute inset-y-0 end-2 flex items-center text-slate-400 hover:text-slate-600"
                              >
                                {showQuickPassword ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'صلاحية البوابة (Portal Role) *' : 'Portal Role *'}
                            </label>
                            <select
                              value={
                                editingEmployee.portalUser?.portalRole ||
                                (editingEmployee.role === 'SALES_REP'
                                  ? 'SALES_REP'
                                  : editingEmployee.role === 'MAINTENANCE_TECH'
                                  ? 'TECHNICIAN'
                                  : 'MANAGEMENT')
                              }
                              onChange={(e) =>
                                setEditingEmployee({
                                  ...editingEmployee,
                                  portalUser: {
                                    ...editingEmployee.portalUser!,
                                    portalRole: e.target.value as UserPortalRole,
                                  },
                                })
                              }
                              className="w-full text-xs p-2 rounded-lg border border-indigo-200 bg-white font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="TECHNICIAN">
                                {isAr ? 'بوابة الفني (صيانة، أعطال، بصمة، مخططات)' : 'Technician Portal'}
                              </option>
                              <option value="SALES_REP">
                                {isAr ? 'بوابة المبيعات (عروض أسعار، سجل عملاء، تسعير)' : 'Sales Rep Portal'}
                              </option>
                              <option value="MANAGEMENT">
                                {isAr ? 'الإدارة العامة (كامل الصلاحيات والتحكم)' : 'Executive Management'}
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* ============================================================= */}
                        {/* SPECIAL PERMISSION TAB / OPTION: DEPARTMENT-WIDE VIEW SCOPE   */}
                        {/* ============================================================= */}
                        <div className="p-3.5 bg-white rounded-xl border border-indigo-200/80 shadow-2xs space-y-2.5">
                          <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            <span>{isAr ? 'نطاق الصلاحيات واستعراض السجلات (Access Scope)' : 'Access Scope & Permissions'}</span>
                          </div>

                          <label className="relative flex items-start gap-2.5 p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={editingEmployee.portalUser?.canViewAllDepartmentRecords || false}
                              onChange={(e) =>
                                setEditingEmployee({
                                  ...editingEmployee,
                                  portalUser: {
                                    ...editingEmployee.portalUser!,
                                    canViewAllDepartmentRecords: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex-1 text-xs">
                              <span className="font-extrabold text-indigo-950 block">
                                {isAr ? 'السماح بمشاهدة كافة سجلات وإضافات القسم المصرح به' : 'Allow viewing all department records & entries'}
                              </span>
                              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                {isAr ? (
                                  <>
                                    <strong className="text-slate-800">• الوضع الطبيعي (الافتراضي):</strong> لا يشاهد المناديب والفنيون إلا ما هو مسند إليهم شخصياً أو تم إدخاله بواسطتهم.
                                    <br />
                                    <strong className="text-emerald-700">• عند تفعيل هذا الخيار:</strong> يُمنح الموظف صلاحية موسعة للاطلاع على كافة مشاريع وعروض وبلاغات وعقود القسم المصرح له كاملاً.
                                  </>
                                ) : (
                                  <>
                                    <strong>• Normal behavior:</strong> Techs and sales reps only see records assigned to or created by them.
                                    <br />
                                    <strong>• When enabled:</strong> Grants department-wide visibility across all projects, quotes, contracts & breakdowns.
                                  </>
                                )}
                              </p>
                            </div>
                          </label>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                            <div className="p-2 rounded bg-slate-50 border border-slate-200">
                              <span className="text-slate-500 block">{isAr ? 'عرض الأسعار:' : 'Pricing:'}</span>
                              <strong className="text-slate-800">{editingEmployee.portalUser?.portalRole === 'TECHNICIAN' ? (isAr ? 'مخفي' : 'Hidden') : (isAr ? 'متاح' : 'Allowed')}</strong>
                            </div>
                            <div className="p-2 rounded bg-slate-50 border border-slate-200">
                              <span className="text-slate-500 block">{isAr ? 'هوامش الربح:' : 'Margins:'}</span>
                              <strong className="text-slate-800">{editingEmployee.portalUser?.portalRole === 'MANAGEMENT' ? (isAr ? 'متاح' : 'Allowed') : (isAr ? 'محجوب' : 'Hidden')}</strong>
                            </div>
                            <div className="p-2 rounded bg-slate-50 border border-slate-200">
                              <span className="text-slate-500 block">{isAr ? 'تسجيل GPS:' : 'GPS Check-In:'}</span>
                              <strong className="text-emerald-700">{isAr ? 'متاح ميدانياً' : 'Active'}</strong>
                            </div>
                            <div className="p-2 rounded bg-slate-50 border border-slate-200">
                              <span className="text-slate-500 block">{isAr ? 'مخطط التعليق:' : 'CAD Drawings:'}</span>
                              <strong className="text-blue-700">{isAr ? 'متاح' : 'Active'}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 pt-1">
                        {isAr 
                          ? 'هذا الموظف لا يمتلك حساب مستخدم للدخول حتى الآن. يمكنك تفعيل الخيار أعلاه لتمكينه من الدخول إلى بوابته وتحديد صلاحياته.'
                          : 'No login account is currently active for this employee. Toggle above to enable.'}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-start pt-2">
                    <button
                      type="button"
                      onClick={() => setEmployeeFormTab('JOB_DETAILS')}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <span>{isAr ? '← السابق: التخصص والميدان' : '← Back: Field Details'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons in Footer */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200">
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'تأكد من مراجعة التبويبات قبل الحفظ' : 'Review tabs before saving'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {isAr ? 'حفظ البيانات' : 'Save Employee'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EMPLOYEE DOSSIER / PROFILE & PERFORMANCE                         */}
      {/* ========================================================================= */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Dossier Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${
                    viewingEmployee.avatarBg || 'bg-emerald-600'
                  } text-white flex items-center justify-center font-black text-sm`}
                >
                  {viewingEmployee.name.slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-base font-extrabold">{viewingEmployee.name}</h2>
                  <span className="text-xs text-slate-400 font-mono">{viewingEmployee.code}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingEmployee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Quick Contacts Bar */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex-wrap">
                {viewingEmployee.phone && (
                  <a
                    href={`tel:${viewingEmployee.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:border-emerald-500"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span dir="ltr">{viewingEmployee.phone}</span>
                  </a>
                )}
                {viewingEmployee.phone && (
                  <a
                    href={`https://wa.me/${viewingEmployee.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {viewingEmployee.email && (
                  <a
                    href={`mailto:${viewingEmployee.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:border-blue-500"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{viewingEmployee.email}</span>
                  </a>
                )}
              </div>

              {/* If SALES REP: Assigned Projects list */}
              {viewingEmployee.role === 'SALES_REP' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'المشاريع وعروض الأسعار المسندة للمندوب' : 'Assigned Quotations & Projects'}</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {projects.filter((p) => p.assignedSalesRepId === viewingEmployee.id).length === 0 ? (
                      <p className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl">
                        {isAr
                          ? 'لم يتم ربط أي عروض أسعار بهذا المندوب حتى الآن. يمكنك اختياره كمندوب مسؤول عند إنشاء أو تعديل أي عرض.'
                          : 'No projects currently assigned to this sales rep.'}
                      </p>
                    ) : (
                      projects
                        .filter((p) => p.assignedSalesRepId === viewingEmployee.id)
                        .map((proj) => (
                          <div
                            key={proj.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{proj.projectName}</div>
                              <span className="text-[11px] text-slate-500">{proj.clientName}</span>
                            </div>
                            <div className="text-end">
                              <span className="font-mono font-bold text-emerald-700 block">
                                {(proj.totalQuotationPrice || 0).toLocaleString()} ر.س
                              </span>
                              <span className="text-[10px] text-slate-400">{proj.status}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* If MAINTENANCE TECH: Assigned Contracts & Visits */}
              {viewingEmployee.role === 'MAINTENANCE_TECH' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      <span>{isAr ? 'عقود الصيانة المسندة للفني' : 'Assigned Maintenance Contracts'}</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {maintenanceContracts.filter(
                      (c) =>
                        c.assignedTechnicianId === viewingEmployee.id ||
                        c.visits.some((v) => v.technicianId === viewingEmployee.id)
                    ).length === 0 ? (
                      <p className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl">
                        {isAr
                          ? 'لا توجد عقود صيانة مسندة لهذا الفني حالياً.'
                          : 'No maintenance contracts assigned to this technician.'}
                      </p>
                    ) : (
                      maintenanceContracts
                        .filter(
                          (c) =>
                            c.assignedTechnicianId === viewingEmployee.id ||
                            c.visits.some((v) => v.technicianId === viewingEmployee.id)
                        )
                        .map((contract) => (
                          <div
                            key={contract.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{contract.title}</div>
                              <span className="text-[11px] text-slate-500">
                                {contract.customerName} - {contract.siteLocation}
                              </span>
                            </div>
                            <div className="text-end">
                              <span className="font-mono font-bold text-blue-700 block">
                                {contract.contractRef}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {contract.visits.length} {isAr ? 'زيارات مجدولة' : 'visits'}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* 30-Day Performance & Productivity Trend Line Chart */}
              <div className="pt-1">
                <Employee30DayTrendChart
                  employee={viewingEmployee}
                  contracts={maintenanceContracts}
                  breakdowns={breakdowns}
                  projects={projects}
                  attendanceRecords={attendanceRecords}
                  isAr={isAr}
                  compact={true}
                />
              </div>

              {/* User Portal Account Card inside Employee Dossier */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950">
                        {isAr ? 'حساب مستخدم النظام وبوابة الدخول' : 'User Portal Account'}
                      </h4>
                      <span className="text-[10px] text-indigo-700">
                        {isAr ? 'إمكانية الدخول والتفاعل مع بوابات النظام' : 'Portal access and authentication credentials'}
                      </span>
                    </div>
                  </div>

                  {viewingEmployee.portalUser?.hasAccount ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{isAr ? 'حساب مستخدم نشط' : 'Active Account'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>{isAr ? 'غير مفعل' : 'Not Activated'}</span>
                    </span>
                  )}
                </div>

                {viewingEmployee.portalUser?.hasAccount ? (
                  <div className="space-y-3 pt-2 border-t border-indigo-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'اسم المستخدم' : 'Username'}</span>
                        <span className="font-mono font-bold text-indigo-950">@{viewingEmployee.portalUser.username}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'صلاحية البوابة' : 'Portal Role'}</span>
                        <span className="font-bold text-slate-800">
                          {viewingEmployee.portalUser.portalRole === 'TECHNICIAN'
                            ? (isAr ? 'بوابة الفني الميداني' : 'Technician Portal')
                            : viewingEmployee.portalUser.portalRole === 'SALES_REP'
                            ? (isAr ? 'بوابة المبيعات' : 'Sales Portal')
                            : (isAr ? 'الإدارة العامة' : 'Management')}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'كلمة المرور' : 'Password'}</span>
                        <span className="font-mono font-bold text-slate-700">
                          {viewingEmployee.portalUser.password ? '••••••••' : '-'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-100 col-span-2 sm:col-span-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block">{isAr ? 'نطاق استعراض السجلات' : 'Record Access Scope'}</span>
                          <span className={`font-bold text-xs ${viewingEmployee.portalUser.canViewAllDepartmentRecords ? 'text-emerald-700' : 'text-slate-800'}`}>
                            {viewingEmployee.portalUser.canViewAllDepartmentRecords
                              ? (isAr ? 'مشاهدة كافة سجلات وإضافات القسم المصرح به (صلاحية موسعة)' : 'All Department Records (Expanded)')
                              : (isAr ? 'ما تم إسناده له أو إدخاله بواسطته فقط (الوضع الطبيعي)' : 'Assigned & Personal Records Only (Standard)')}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          viewingEmployee.portalUser.canViewAllDepartmentRecords
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {viewingEmployee.portalUser.canViewAllDepartmentRecords ? (isAr ? 'صلاحية موسعة' : 'EXPANDED') : (isAr ? 'مسند فقط' : 'STANDARD')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {onSwitchUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setViewingEmployee(null);
                            handleLoginAsEmployeeUser(viewingEmployee);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>{isAr ? `تسجيل الدخول المباشر كـ ${viewingEmployee.name}` : `Login as ${viewingEmployee.name}`}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenQuickUserModal(viewingEmployee)}
                        className="px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isAr ? 'تعديل بيانات الحساب' : 'Edit Account'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-indigo-100">
                    <p className="text-xs text-slate-600">
                      {isAr 
                        ? 'لم يتم إنشاء حساب مستخدم لهذا الموظف بعد. يمكنك تفعيل حسابه فوراً لتمكينه من الدخول لبوابته.'
                        : 'No portal user account is active for this employee yet. Create one to enable portal access.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickUserModal(viewingEmployee)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isAr ? 'إنشاء وتفعيل حساب مستخدم الآن' : 'Create User Account Now'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Notes section */}
              {viewingEmployee.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-1">{isAr ? 'ملاحظات:' : 'Notes:'}</span>
                  <p className="text-amber-800">{viewingEmployee.notes}</p>
                </div>
              )}
            </div>

            {/* Dossier Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setViewingEmployee(null);
                  handleEditClick(viewingEmployee);
                }}
                className="px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl border border-blue-200 transition-colors"
              >
                {isAr ? 'تعديل بيانات الموظف' : 'Edit Employee'}
              </button>
              <button
                type="button"
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add/Edit User Account Modal */}
      {quickUserModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="px-5 py-4 bg-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">
                    {isAr ? 'إضافة / إدارة حساب المستخدم' : 'Manage User Account'}
                  </h3>
                  <span className="text-xs text-indigo-300 font-bold">{quickUserModalEmployee.name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickUserModalEmployee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2">
              <button
                type="button"
                onClick={() => setQuickUserModalTab('CREDENTIALS')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  quickUserModalTab === 'CREDENTIALS'
                    ? 'border-indigo-600 text-indigo-900 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isAr ? 'بيانات الاعتماد والدخول' : 'Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickUserModalTab('PERMISSIONS')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  quickUserModalTab === 'PERMISSIONS'
                    ? 'border-indigo-600 text-indigo-900 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isAr ? 'الصلاحيات ونطاق الوصول' : 'Permissions & Scope'}</span>
                {quickCanViewAllDepartmentRecords && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveQuickUserModal(false);
              }}
              className="p-5 space-y-4"
            >
              {/* TAB 1: CREDENTIALS */}
              {quickUserModalTab === 'CREDENTIALS' && (
                <div className="space-y-3 animate-in fade-in-50 duration-150">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'اسم المستخدم (Username) *' : 'Username *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={quickUsername}
                      onChange={(e) => setQuickUsername(e.target.value)}
                      placeholder="e.g. m.shennawy"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'البريد الإلكتروني لتسجيل الدخول *' : 'Login Email *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                      placeholder="shennawy@twinselevators.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {isAr ? 'كلمة المرور / الرمز السري' : 'Password / PIN'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setQuickPassword('twins' + Math.floor(1000 + Math.random() * 9000))}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                      >
                        {isAr ? 'توليد كلمة سر عشوائية' : 'Generate random'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showQuickPassword ? 'text' : 'password'}
                        required
                        value={quickPassword}
                        onChange={(e) => setQuickPassword(e.target.value)}
                        placeholder="******"
                        className="w-full text-xs p-2.5 pe-9 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowQuickPassword(!showQuickPassword)}
                        className="absolute inset-y-0 end-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showQuickPassword ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={quickIsActive}
                        onChange={(e) => setQuickIsActive(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span>{isAr ? 'الحساب نشط ومفعل لتسجيل الدخول' : 'Account is active for login'}</span>
                    </label>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setQuickUserModalTab('PERMISSIONS')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isAr ? 'الانتقال لضبط الصلاحيات ونطاق السجلات ←' : 'Next: Permissions & Scope →'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: PERMISSIONS & SCOPE */}
              {quickUserModalTab === 'PERMISSIONS' && (
                <div className="space-y-3.5 animate-in fade-in-50 duration-150">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'صلاحيات البوابة (Portal Role) *' : 'Portal Role *'}
                    </label>
                    <select
                      value={quickRole}
                      onChange={(e) => setQuickRole(e.target.value as UserPortalRole)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="TECHNICIAN">{isAr ? 'بوابة الفني (صيانة، أعطال، بصمة، مخططات)' : 'Technician Portal'}</option>
                      <option value="SALES_REP">{isAr ? 'بوابة المبيعات (عروض أسعار، سجل عملاء، تسعير)' : 'Sales Rep Portal'}</option>
                      <option value="MANAGEMENT">{isAr ? 'الإدارة العامة (كامل الصلاحيات والتحكم)' : 'Executive Management'}</option>
                    </select>
                  </div>

                  {/* CRITICAL OPTION: CAN VIEW ALL DEPARTMENT RECORDS */}
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-950 font-black text-xs">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>{isAr ? 'نطاق الوصول والسجلات بالقسم' : 'Department Access Scope'}</span>
                    </div>

                    <label className="relative flex items-start gap-2.5 p-2 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={quickCanViewAllDepartmentRecords}
                        onChange={(e) => setQuickCanViewAllDepartmentRecords(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-extrabold text-indigo-950 block">
                          {isAr ? 'السماح بمشاهدة كافة سجلات وإضافات القسم المصرح به' : 'Allow viewing all department records & additions'}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {isAr ? (
                            <>
                              <strong className="text-slate-800">• الوضع الطبيعي (غير مفعّل):</strong> المناديب والفنيون لا يشاهدون إلا ما تم إسناده لهم أو إدخاله بواسطتهم.
                              <br />
                              <strong className="text-emerald-700">• عند تفعيل هذا الخيار:</strong> يتمكن المستخدم من الاطلاع على كافة سجلات القسم كاملاً (جميع مشاريع المبيعات أو جميع عقود وأعطال الصيانة).
                            </>
                          ) : (
                            <>
                              <strong>• Normal:</strong> Technicians and reps only view assigned/created records.
                              <br />
                              <strong>• Enabled:</strong> Full visibility across all department records.
                            </>
                          )}
                        </p>
                      </div>
                    </label>

                    <div className="p-2 rounded bg-white border border-indigo-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">{isAr ? 'النطاق الفعّال حالياً:' : 'Active Scope:'}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        quickCanViewAllDepartmentRecords
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {quickCanViewAllDepartmentRecords 
                          ? (isAr ? 'مشاهدة كافة سجلات القسم' : 'All Department Records')
                          : (isAr ? 'المسند فقط (طبيعي)' : 'Assigned Only (Standard)')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-start pt-1">
                    <button
                      type="button"
                      onClick={() => setQuickUserModalTab('CREDENTIALS')}
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isAr ? '← العودة لبيانات الاعتماد' : '← Back to Credentials'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuickUserModalEmployee(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <div className="flex items-center gap-2">
                  {onSwitchUser && (
                    <button
                      type="button"
                      onClick={() => handleSaveQuickUserModal(true)}
                      className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isAr ? 'حفظ والدخول الآن' : 'Save & Login'}</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {isAr ? 'حفظ وتفعيل الحساب' : 'Save & Activate'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {userNotificationToast && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{userNotificationToast}</span>
        </div>
      )}
    </div>
  );
}
