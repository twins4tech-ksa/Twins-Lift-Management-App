import React, { useState, useMemo } from 'react';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Navigation,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Clock,
  Camera,
  User,
  Building,
  ShieldCheck,
  Plus
} from 'lucide-react';
import {
  SiteAttendanceRecord,
  AttendanceCheckInType,
  CHECKIN_TYPE_CONFIG,
  ROLE_CONFIGS
} from '../types/employee';
import { AttendanceMapPreview } from './AttendanceMapPreview';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { SearchableSelect } from './SearchableSelect';
import { useInteractiveTable, InteractiveColumn } from '../hooks/useInteractiveTable';
import { InteractiveTableHeader, TableControlBar } from './InteractiveTableHeader';

interface AttendanceLogsTableProps {
  records: SiteAttendanceRecord[];
  companySettings: CompanySettings;
  language: AppLanguage;
  onOpenCheckInModal: () => void;
}

export const AttendanceLogsTable: React.FC<AttendanceLogsTableProps> = ({
  records,
  companySettings,
  language,
  onOpenCheckInModal,
}) => {
  const isAr = language === 'ar';
  const allowedRadius = companySettings.attendanceRadiusMeters || 150;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [mapPreviewRecord, setMapPreviewRecord] = useState<SiteAttendanceRecord | null>(null);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rec.employeeName.toLowerCase().includes(q);
        const matchesProject = rec.projectName.toLowerCase().includes(q);
        const matchesClient = rec.clientName.toLowerCase().includes(q);
        const matchesLocation = rec.siteLocation.toLowerCase().includes(q);
        if (!matchesName && !matchesProject && !matchesClient && !matchesLocation) {
          return false;
        }
      }

      // Type filter
      if (selectedTypeFilter !== 'ALL' && rec.checkInType !== selectedTypeFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL' && rec.status !== selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedTypeFilter, selectedStatusFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = records.length;
    const inRange = records.filter(r => r.isWithinRadius).length;
    const inRangePct = total > 0 ? Math.round((inRange / total) * 100) : 100;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = records.filter(r => r.dateStr === todayStr).length;

    return { total, inRange, inRangePct, todayCount };
  }, [records]);

  // Interactive Table Column Definitions
  const attendanceColumns: InteractiveColumn<SiteAttendanceRecord>[] = useMemo(() => [
    {
      id: 'employee',
      header: isAr ? 'الموظف / الفني' : 'Employee',
      headerAr: 'الموظف / الفني',
      headerEn: 'Employee',
      sortable: true,
      accessor: (rec) => rec.employeeName,
      renderCell: (rec) => {
        const roleCfg = ROLE_CONFIGS[rec.employeeRole];
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {rec.employeeName.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-900">{rec.employeeName}</div>
              <div className="text-[10px] text-slate-400">
                {isAr ? roleCfg.labelAr : roleCfg.labelEn}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'project_client',
      header: isAr ? 'موقع العميل والمشروع' : 'Client & Site',
      headerAr: 'موقع العميل والمشروع',
      headerEn: 'Client & Site',
      sortable: true,
      accessor: (rec) => `${rec.projectName} ${rec.siteLocation}`,
      renderCell: (rec) => (
        <div>
          <div className="font-bold text-slate-900">{rec.projectName}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="truncate max-w-[200px]">{rec.siteLocation}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'mission_type',
      header: isAr ? 'نوع المهمة' : 'Mission',
      headerAr: 'نوع المهمة',
      headerEn: 'Mission',
      sortable: true,
      accessor: (rec) => rec.checkInType,
      renderCell: (rec) => {
        const typeCfg = CHECKIN_TYPE_CONFIG[rec.checkInType];
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${typeCfg.bg}`}>
            {isAr ? typeCfg.labelAr : typeCfg.labelEn}
          </span>
        );
      },
    },
    {
      id: 'distance',
      header: isAr ? 'المسافة المقاسة والنطاق' : 'Distance & Geofence',
      headerAr: 'المسافة المقاسة والنطاق',
      headerEn: 'Distance & Geofence',
      sortable: true,
      accessor: (rec) => rec.distanceMeters,
      renderCell: (rec) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            {rec.isWithinRadius ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className={`font-black ${rec.isWithinRadius ? 'text-emerald-700' : 'text-rose-700'}`}>
              {rec.distanceMeters} {isAr ? 'متر' : 'm'}
            </span>
            <span className="text-[10px] text-slate-400">
              / {rec.allowedRadiusMeters} {isAr ? 'م' : 'm'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isAr ? `دقة الجهاز: ±${rec.deviceAccuracyMeters || 10}م` : `Accuracy: ±${rec.deviceAccuracyMeters || 10}m`}
          </div>
        </div>
      ),
    },
    {
      id: 'datetime',
      header: isAr ? 'التوقيت والتاريخ' : 'Time & Date',
      headerAr: 'التوقيت والتاريخ',
      headerEn: 'Time & Date',
      sortable: true,
      accessor: (rec) => `${rec.dateStr} ${rec.timeStr}`,
      renderCell: (rec) => (
        <div>
          <div className="font-mono text-slate-900 font-bold">{rec.timeStr}</div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{rec.dateStr}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'status_notes',
      header: isAr ? 'الحالة والملاحظات' : 'Status & Notes',
      headerAr: 'الحالة والملاحظات',
      headerEn: 'Status & Notes',
      sortable: true,
      accessor: (rec) => (rec.isWithinRadius ? 'Verified' : 'Override'),
      renderCell: (rec) => (
        <div className="max-w-[220px]">
          {rec.isWithinRadius ? (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {isAr ? 'معتمد داخل النطاق ✓' : 'Verified within range'}
            </span>
          ) : (
            <div className="space-y-0.5">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {isAr ? 'تجاوز بمبرر رسمي ⚠️' : 'Override with reason'}
              </span>
              {rec.overrideReason && (
                <p className="text-[10px] text-amber-900 italic line-clamp-2">
                  "{rec.overrideReason}"
                </p>
              )}
            </div>
          )}
          {rec.notes && (
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{rec.notes}</p>
          )}
          {rec.photoDataUrl && (
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(rec.photoDataUrl!)}
              className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Camera className="w-3 h-3" />
              <span>{isAr ? 'عرض صورة الإثبات' : 'View Photo'}</span>
            </button>
          )}
        </div>
      ),
    },
    {
      id: 'map',
      header: isAr ? 'الخريطة' : 'Map',
      headerAr: 'الخريطة',
      headerEn: 'Map',
      align: 'center',
      sortable: false,
      draggable: false,
      renderCell: (rec) => (
        <button
          type="button"
          onClick={() => setMapPreviewRecord(rec)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
          title={isAr ? 'عرض الإحداثيات على الخريطة' : 'View on Map'}
        >
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>{isAr ? 'الخريطة' : 'Map'}</span>
        </button>
      ),
    },
  ], [isAr, setPreviewPhotoUrl, setMapPreviewRecord]);

  const attendanceTable = useInteractiveTable({
    tableId: 'site_attendance_logs_table',
    columns: attendanceColumns,
    data: filteredRecords,
    isAr,
  });

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Quick KPI stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Check-Ins */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">
              {isAr ? 'إجمالي تسجيلات الحضور' : 'Total Site Check-Ins'}
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900">
              {stats.total} {isAr ? 'تسجيل' : 'Logs'}
            </span>
          </div>
        </div>

        {/* In-Range Rate % */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">
              {isAr ? 'نسبة الالتزام بالنطاق' : 'Within Range Rate'}
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-700">
              {stats.inRangePct}%
            </span>
          </div>
        </div>

        {/* Today's Check-ins */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">
              {isAr ? 'حضور اليوم' : "Today's Logs"}
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900">
              {stats.todayCount} {isAr ? 'حضور' : 'Today'}
            </span>
          </div>
        </div>

        {/* Configured Radius Badge */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">
              {isAr ? 'نطاق الموقع المعتمد' : 'Geofence Radius'}
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-700">
              {allowedRadius} {isAr ? 'متر' : 'Meters'}
            </span>
          </div>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث باسم الفني، المندوب، اسم المشروع، أو موقع العميل...'
                  : 'Search by employee, project, or site...'
              }
              className="w-full ps-9 pe-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* New Check-In Button */}
          <button
            type="button"
            onClick={onOpenCheckInModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل حضور ميداني جديد' : 'New GPS Check-In'}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" />
            {isAr ? 'تصفية:' : 'Filter:'}
          </span>

          <div className="min-w-[160px] shrink-0">
            <SearchableSelect
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
            >
              <option value="ALL">{isAr ? 'كل أنواع الزيارات' : 'All Visit Types'}</option>
              {(Object.keys(CHECKIN_TYPE_CONFIG) as AttendanceCheckInType[]).map((key) => (
                <option key={key} value={key}>
                  {isAr ? CHECKIN_TYPE_CONFIG[key].labelAr : CHECKIN_TYPE_CONFIG[key].labelEn}
                </option>
              ))}
            </SearchableSelect>
          </div>

          <div className="min-w-[160px] shrink-0">
            <SearchableSelect
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
            >
              <option value="ALL">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="VERIFIED_IN_RANGE">{isAr ? '✓ داخل النطاق المعتمد' : 'Within Allowed Radius'}</option>
              <option value="OUT_OF_RANGE_OVERRIDE">{isAr ? '⚠️ خارج النطاق مع مبرر' : 'Out-of-range Override'}</option>
            </SearchableSelect>
          </div>
        </div>
      </div>

      {/* Records Listing: Responsive Table for Desktop & Cards for Mobile */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Navigation className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">
            {isAr ? 'لا توجد سجلات حضور تطابق معايير البحث' : 'No attendance records match your search'}
          </p>
          <button
            type="button"
            onClick={onOpenCheckInModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            {isAr ? 'تسجيل أول حضور ميداني الآن' : 'Record First Check-In'}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Control Bar for Drag-and-Drop and Sorting Reset */}
            <TableControlBar
              isReordered={attendanceTable.isReordered}
              onResetOrder={attendanceTable.resetColumnOrder}
              sortKey={attendanceTable.sortKey}
              sortDir={attendanceTable.sortDir}
              onResetSort={attendanceTable.resetSort}
              isAr={isAr}
              totalCount={attendanceTable.sortedData.length}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    {attendanceTable.orderedColumns.map((col) => (
                      <InteractiveTableHeader
                        key={col.id}
                        column={col}
                        sortKey={attendanceTable.sortKey}
                        sortDir={attendanceTable.sortDir}
                        onSort={attendanceTable.handleSort}
                        draggedColId={attendanceTable.draggedColId}
                        dragOverColId={attendanceTable.dragOverColId}
                        onDragStart={attendanceTable.handleDragStart}
                        onDragOver={attendanceTable.handleDragOver}
                        onDragLeave={attendanceTable.handleDragLeave}
                        onDrop={attendanceTable.handleDrop}
                        onDragEnd={attendanceTable.handleDragEnd}
                        isAr={isAr}
                        theme="light"
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {attendanceTable.sortedData.map((rec, rowIdx) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      {attendanceTable.orderedColumns.map((col) => (
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
                          {col.renderCell(rec, rowIdx)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="md:hidden space-y-3">
            {filteredRecords.map((rec) => {
              const typeCfg = CHECKIN_TYPE_CONFIG[rec.checkInType];
              return (
                <div
                  key={rec.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs"
                >
                  {/* Top Bar: Employee & Timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {rec.employeeName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{rec.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{rec.dateStr} • {rec.timeStr}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeCfg.bg}`}>
                      {isAr ? typeCfg.labelAr : typeCfg.labelEn}
                    </span>
                  </div>

                  {/* Client & Site */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-900">{rec.projectName}</div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{rec.siteLocation}</span>
                    </div>
                  </div>

                  {/* Range & Geofence verification */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      rec.isWithinRadius
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50/80 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {rec.isWithinRadius ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-xs">
                          {rec.isWithinRadius
                            ? isAr ? 'داخل النطاق المعتمد ✓' : 'Within Range ✓'
                            : isAr ? 'خارج النطاق المسموح ⚠️' : 'Out of Range ⚠️'}
                        </div>
                        <div className="text-[10px] opacity-80">
                          {isAr ? 'المسافة:' : 'Distance:'} {rec.distanceMeters}م (المسموح {rec.allowedRadiusMeters}م)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMapPreviewRecord(rec)}
                      className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-bold text-blue-600 flex items-center gap-1 shadow-2xs"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{isAr ? 'الخريطة' : 'Map'}</span>
                    </button>
                  </div>

                  {/* Override reason / Notes */}
                  {rec.overrideReason && (
                    <div className="text-[10px] bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900">
                      <strong>{isAr ? 'سبب التجاوز:' : 'Override Reason:'}</strong> {rec.overrideReason}
                    </div>
                  )}

                  {rec.photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoUrl(rec.photoDataUrl!)}
                      className="text-[11px] text-blue-600 font-bold flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isAr ? 'عرض صورة إثبات الحضور' : 'View Site Photo'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

            {/* Photo Preview Modal */}
      {mapPreviewRecord && (
        <AttendanceMapPreview
          record={mapPreviewRecord}
          onClose={() => setMapPreviewRecord(null)}
          language={language}
        />
      )}

      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="font-bold text-xs">{isAr ? 'صورة إثبات الحضور بالموقع' : 'Site Proof Photo'}</span>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="text-slate-500 hover:text-slate-900 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <img src={previewPhotoUrl} alt="Proof" className="w-full max-h-[70vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
};
