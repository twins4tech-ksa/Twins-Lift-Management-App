import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Plus,
  Users,
  Search,
  CheckCircle2,
  Lock,
  Layers,
  Wrench,
  Briefcase,
  Receipt,
  Boxes,
  Compass,
  Edit3,
  Trash2,
  UserCheck,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import {
  CustomPermissionRule,
  Employee,
  EmployeeCategoryType,
  EMPLOYEE_CATEGORY_CONFIGS
} from '../types/employee';
import { AppLanguage } from '../utils/translations';

interface PermissionsManagementPageProps {
  customRules: CustomPermissionRule[];
  employees: Employee[];
  language: AppLanguage;
  onOpenCreateRule: () => void;
  onEditRule: (rule: CustomPermissionRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onAssignRuleToEmployee?: (employeeId: string, ruleId?: string) => void;
}

export const PermissionsManagementPage: React.FC<PermissionsManagementPageProps> = ({
  customRules,
  employees,
  language,
  onOpenCreateRule,
  onEditRule,
  onDeleteRule,
  onAssignRuleToEmployee,
}) => {
  const isAr = language === 'ar';

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleIdForAssignment, setSelectedRuleIdForAssignment] = useState<string | null>(null);

  // Group employees by custom rule
  const ruleEmployeeMap = useMemo(() => {
    const map: Record<string, Employee[]> = {};
    employees.forEach((emp) => {
      if (emp.customRoleId) {
        if (!map[emp.customRoleId]) {
          map[emp.customRoleId] = [];
        }
        map[emp.customRoleId].push(emp);
      }
    });
    return map;
  }, [employees]);

  // Filter rules
  const filteredRules = useMemo(() => {
    return customRules.filter((rule) => {
      if (categoryFilter !== 'ALL' && rule.category !== categoryFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        rule.nameAr.toLowerCase().includes(q) ||
        (rule.nameEn && rule.nameEn.toLowerCase().includes(q)) ||
        (rule.description && rule.description.toLowerCase().includes(q)) ||
        rule.category.toLowerCase().includes(q)
      );
    });
  }, [customRules, categoryFilter, searchQuery]);

  const totalAssignedStaff = useMemo(() => {
    return employees.filter((e) => e.customRoleId).length;
  }, [employees]);

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-150" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-900/60 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                {isAr ? 'منظومة الصلاحيات وقواعد النظام المخصصة' : 'Custom Permissions & RBAC Engine'}
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                {customRules.length} {isAr ? 'قواعد مسجلة' : 'Rules'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {isAr ? 'إدارة الصلاحيات والأدوار المخصصة (Permissions)' : 'Permissions & Custom Roles Management'}
            </h2>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl leading-relaxed">
              {isAr
                ? 'تحكم دقيق ومخصص في صلاحيات شاشات النظام، ميزات الأسعار، هوامش الربح، الفوترة والربط مع هيئة الزكاة، والمخططات الهندسية لكل دور وموظف'
                : 'Fine-grained access control over module screens, pricing visibility, gross margins, invoicing, civil defense and CAD drawings for every staff role'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreateRule}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? '+ إنشاء قاعدة صلاحيات جديدة' : '+ Create Custom Rule'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">{isAr ? 'إجمالي الـ Rules:' : 'Total Rules:'}</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {customRules.length}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {isAr ? 'قواعد صلاحيات قياسية ومخصصة' : 'Standard & custom rules'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">{isAr ? 'الموظفون المسندون:' : 'Assigned Staff:'}</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
            {totalAssignedStaff} / {employees.length}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {isAr ? 'موظف يعمل بقاعدة مخصصة' : 'Staff with custom rule'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">{isAr ? 'الأقسام والتصنيفات:' : 'Categories:'}</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-700 mt-1 font-mono">
            {Object.keys(EMPLOYEE_CATEGORY_CONFIGS).length}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {isAr ? 'مبيعات، صيانة، تركيب، مالية، مستودع' : 'Sales, Tech, Ops, Finance, WH'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">{isAr ? 'الصلاحيات المتاحة:' : 'Permissions:'}</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 mt-1 font-mono">
            27
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {isAr ? 'صلاحية وظيفية دقيقة قابلة للضبط' : 'Granular access flags'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            placeholder={isAr ? 'بحث في قواعد الصلاحيات، الوصف، التصنيف...' : 'Search custom rules, description...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-bold">{isAr ? 'التصنيف:' : 'Category:'}</span>
          {[
            { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
            { id: 'SALES', labelAr: 'المبيعات', labelEn: 'Sales' },
            { id: 'MAINTENANCE', labelAr: 'الصيانة', labelEn: 'Maintenance' },
            { id: 'INSTALLATION', labelAr: 'التركيبات', labelEn: 'Installation' },
            { id: 'FINANCE', labelAr: 'المالية', labelEn: 'Finance' },
            { id: 'WAREHOUSE', labelAr: 'المستودع', labelEn: 'Warehouse' },
            { id: 'EXECUTIVE', labelAr: 'الإدارة', labelEn: 'Executive' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isAr ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredRules.map((rule) => {
          const assignedEmployees = ruleEmployeeMap[rule.id] || [];
          const activePermsCount = Object.values(rule.permissions).filter(Boolean).length;
          const totalPermsCount = Object.keys(rule.permissions).length;
          const categoryConfig = EMPLOYEE_CATEGORY_CONFIGS[rule.category] || {
            labelAr: rule.category,
            labelEn: rule.category,
            icon: 'Briefcase',
            themeColor: 'indigo',
          };

          return (
            <div
              key={rule.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Header of Rule Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900 truncate">
                          {isAr ? rule.nameAr : (rule.nameEn || rule.nameAr)}
                        </h3>
                        {rule.isCustom && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            ✨ {isAr ? 'مخصص' : 'Custom'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isAr ? categoryConfig.labelAr : categoryConfig.labelEn}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Edit / Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditRule(rule)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title={isAr ? 'تعديل الصلاحيات' : 'Edit Rule'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {rule.isCustom && (
                      <button
                        type="button"
                        onClick={() => onDeleteRule(rule.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={isAr ? 'حذف القاعدة' : 'Delete Rule'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {rule.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {rule.description}
                  </p>
                )}

                {/* Key Permissions Badges */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] pt-3">
                  {rule.permissions.canCreateQuotations && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                      ✓ {isAr ? 'عروض الأسعار' : 'Quotes'}
                    </span>
                  )}
                  {rule.permissions.canViewGrossMargins && (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      ✓ {isAr ? 'هوامش الربح' : 'Margins'}
                    </span>
                  )}
                  {rule.permissions.canManageInvoicesAndVouchers && (
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                      ✓ {isAr ? 'فواتير ZATCA' : 'ZATCA'}
                    </span>
                  )}
                  {rule.permissions.canManageSafetyCertificates && (
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-bold border border-rose-200">
                      ✓ {isAr ? 'الدفاع المدني' : 'Civil Defense'}
                    </span>
                  )}
                  {rule.permissions.canViewCadDrawings && (
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-bold border border-purple-200">
                      ✓ {isAr ? 'مخططات CAD' : 'CAD'}
                    </span>
                  )}
                  {rule.permissions.canDispatchTechnicians && (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                      ✓ {isAr ? 'توجيه الفنيين' : 'Dispatch'}
                    </span>
                  )}
                  {rule.permissions.canManageInventoryAndStock && (
                    <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 font-bold border border-orange-200">
                      ✓ {isAr ? 'المستودع' : 'Stock'}
                    </span>
                  )}
                  {rule.permissions.canCheckInGps && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                      ✓ {isAr ? 'بصمة GPS' : 'GPS'}
                    </span>
                  )}
                  {rule.permissions.canViewAllDepartmentRecords && (
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold border border-indigo-300">
                      ★ {isAr ? 'عرض كافة سجلات القسم' : 'All Dept Records'}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Assigned Staff & Quick Assignment */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5 rtl:space-x-reverse overflow-hidden">
                    {assignedEmployees.slice(0, 4).map((emp) => (
                      <div
                        key={emp.id}
                        className={`inline-block w-6 h-6 rounded-full ring-2 ring-white text-[10px] font-bold text-white flex items-center justify-center shrink-0 ${
                          emp.avatarBg || 'bg-blue-600'
                        }`}
                        title={emp.name}
                      >
                        {emp.name.slice(0, 1)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">
                    {assignedEmployees.length > 0 ? (
                      isAr
                        ? `${assignedEmployees.length} موظف مسند`
                        : `${assignedEmployees.length} staff assigned`
                    ) : (
                      <span className="text-slate-400 font-normal">
                        {isAr ? 'لم يسند لأحد بعد' : 'No staff assigned'}
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                    {activePermsCount} / {totalPermsCount} {isAr ? 'صلاحية' : 'perms'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditRule(rule)}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    {isAr ? 'تخصيص ←' : 'Configure →'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRules.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            {isAr ? 'لم يتم العثور على قواعد صلاحيات مطابقة' : 'No matching rules found'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isAr ? 'يمكنك إنشاء قاعدة صلاحيات جديدة الآن' : 'You can create a new custom rule'}
          </p>
          <button
            type="button"
            onClick={onOpenCreateRule}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء قاعدة جديدة' : 'Create New Rule'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
