import React, { useState, useMemo } from 'react';
import { 
  ComponentItem, 
  ElevatorSpecification, 
  ComponentCategory 
} from '../types/elevator';
import { 
  generateComponentList, 
  calculateQuotationFinancials 
} from '../utils/pricingEngine';
import { 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Sliders, 
  Package, 
  Cpu, 
  Wrench, 
  ShieldCheck, 
  DollarSign,
  TrendingUp,
  Check,
  FileSpreadsheet,
  CheckCircle2,
  PackageCheck,
  Truck,
  Clock,
  Boxes,
  ArrowRight,
  Warehouse,
  AlertTriangle
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { exportBomToExcel } from '../utils/excelExport';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';
import { DisbursementStatementView } from './DisbursementStatementView';
import { useInteractiveTable, InteractiveColumn } from '../hooks/useInteractiveTable';
import { InteractiveTableHeader, TableControlBar } from './InteractiveTableHeader';

interface Props {
  spec: ElevatorSpecification;
  onUpdateSpec: (updated: Partial<ElevatorSpecification>) => void;
  onSyncToGoogleSheet?: () => void;
  isSheetsConnected?: boolean;
  inventory?: InventoryItem[];
  onNavigateToInventory?: () => void;
  onReserveFromInventory?: (component: ComponentItem) => void;
}

const CATEGORY_NAMES: Record<ComponentCategory, string> = {
  TRACTION_DRIVE: 'Traction Drive & Motor',
  CONTROL_ELECTRICAL: 'Control System & Inverter',
  CAR_STRUCTURE: 'Car Sling & Safety Assembly',
  CAR_INTERIOR: 'Cabin Interior & Finishes',
  DOORS_ENTRANCES: 'Automatic Doors & Headers',
  GUIDE_RAILS: 'Guide Rails & Brackets',
  ROPING_PULLEYS: 'Suspension Ropes & Pulleys',
  SAFETY_EQUIPMENT: 'Safety Devices & ARD',
  PIT_EQUIPMENT: 'Pit Equipment & Buffers',
  INSTALLATION_LABOR: 'Labor, Testing & Commissioning',
};

export const ComponentsView: React.FC<Props> = ({
  spec,
  onUpdateSpec,
  onSyncToGoogleSheet,
  isSheetsConnected,
  inventory = [],
  onNavigateToInventory,
  onReserveFromInventory,
}) => {
  // Mode switcher: Default to DISBURSEMENT_STAGES as requested by user
  const [viewMode, setViewMode] = useState<'DISBURSEMENT_STAGES' | 'TECHNICAL_BOM'>('DISBURSEMENT_STAGES');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | 'DELIVERED' | 'PENDING'>('ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Generate real-time components based on spec and material factors
  const components = useMemo(() => generateComponentList(spec), [spec]);
  const financials = useMemo(() => calculateQuotationFinancials(spec, components), [spec, components]);

  const deliveredSet = useMemo(() => new Set(spec.deliveredComponentIds || []), [spec.deliveredComponentIds]);
  const deliveredCount = useMemo(() => {
    return components.filter((c) => deliveredSet.has(c.id)).length;
  }, [components, deliveredSet]);

  // Toggle delivery status for a component
  const handleToggleComponentDelivery = (componentId: string) => {
    const isCurrentlyDelivered = deliveredSet.has(componentId);
    const nextDelivered = new Set(deliveredSet);
    const nextRecords = { ...(spec.siteDeliveryRecords || {}) };

    if (isCurrentlyDelivered) {
      nextDelivered.delete(componentId);
      delete nextRecords[componentId];
    } else {
      nextDelivered.add(componentId);
      nextRecords[componentId] = {
        deliveredAt: new Date().toISOString().split('T')[0],
        receivedBy: 'مهندس الموقع (Site Engineer)',
        deliveryNoteNumber: `DN-${Date.now().toString().slice(-4)}`
      };
    }

    onUpdateSpec({
      deliveredComponentIds: Array.from(nextDelivered),
      siteDeliveryRecords: nextRecords
    });
  };

  // Mark all components as delivered
  const handleMarkAllDelivered = () => {
    const allIds = components.map((c) => c.id);
    const today = new Date().toISOString().split('T')[0];
    const newRecords: Record<string, { deliveredAt: string; receivedBy: string; deliveryNoteNumber: string }> = {};
    allIds.forEach((id) => {
      newRecords[id] = {
        deliveredAt: today,
        receivedBy: 'مهندس الموقع (Site Engineer)',
        deliveryNoteNumber: `DN-ALL-${Date.now().toString().slice(-4)}`
      };
    });
    onUpdateSpec({
      deliveredComponentIds: allIds,
      siteDeliveryRecords: newRecords
    });
  };

  // Reset all delivery marks
  const handleResetDelivery = () => {
    onUpdateSpec({
      deliveredComponentIds: [],
      siteDeliveryRecords: {}
    });
  };

  // Filtered components
  const filteredComponents = useMemo(() => {
    return components.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specification.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isDelivered = deliveredSet.has(item.id);
      const matchesDelivery = 
        deliveryFilter === 'ALL' ||
        (deliveryFilter === 'DELIVERED' && isDelivered) ||
        (deliveryFilter === 'PENDING' && !isDelivered);

      return matchesCategory && matchesSearch && matchesDelivery;
    });
  }, [components, selectedCategory, searchQuery, deliveryFilter, deliveredSet]);

  const handleSteelFactorChange = (val: number) => {
    onUpdateSpec({ steelPriceIndexFactor: val });
  };

  const handleCopperFactorChange = (val: number) => {
    onUpdateSpec({ copperPriceIndexFactor: val });
  };

  const handleElectronicsFactorChange = (val: number) => {
    onUpdateSpec({ electronicsPriceIndexFactor: val });
  };

  const [excelExportNotification, setExcelExportNotification] = useState(false);

  const handleExportExcel = () => {
    exportBomToExcel(spec, components);
    setExcelExportNotification(true);
    setTimeout(() => setExcelExportNotification(false), 3000);
  };

  const handleCopyTsv = () => {
    const header = 'Item ID\tCategory\tComponent Name\tSpecification\tQuantity\tUnit\tUnit Cost\tTotal Cost\tSupplier\n';
    const rows = components
      .map(
        (c) =>
          `${c.id}\t${c.category}\t${c.name}\t${c.specification}\t${c.quantity}\t${c.unit}\t${c.unitCost}\t${c.totalCost}\t${c.supplier}`
      )
      .join('\n');
    navigator.clipboard.writeText(header + rows);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Interactive Table Columns & Hook
  const componentColumns = useMemo<InteractiveColumn<ComponentItem>[]>(() => [
    {
      id: 'id',
      header: 'Item ID',
      headerAr: 'كود القطعة',
      headerEn: 'Item ID',
      minWidth: '90px',
      sortable: true,
      accessor: (item) => item.id,
      renderCell: (item) => (
        <span className="font-mono text-[11px] text-slate-500 font-semibold whitespace-nowrap">
          {item.id}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Component Description',
      headerAr: 'اسم وتوصيف المكون',
      headerEn: 'Component Description',
      minWidth: '180px',
      sortable: true,
      accessor: (item) => item.name,
      renderCell: (item) => {
        const isDelivered = deliveredSet.has(item.id);
        return (
          <div>
            <div className="flex items-center gap-1.5 font-medium text-slate-900">
              {isDelivered && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{item.name}</span>
            </div>
            <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              {CATEGORY_NAMES[item.category] || item.category}
            </span>
          </div>
        );
      },
    },
    {
      id: 'specification',
      header: 'Engineering Specifications',
      headerAr: 'المواصفات الفنية الهندسية',
      headerEn: 'Engineering Specifications',
      minWidth: '180px',
      sortable: true,
      accessor: (item) => item.specification,
      renderCell: (item) => (
        <span className="text-slate-600 max-w-xs leading-relaxed block">
          {item.specification}
        </span>
      ),
    },
    {
      id: 'delivery',
      header: 'Site Delivery (التوريد)',
      headerAr: 'حالة التوريد للموقع',
      headerEn: 'Site Delivery',
      align: 'center',
      minWidth: '130px',
      sortable: true,
      accessor: (item) => deliveredSet.has(item.id),
      renderCell: (item) => {
        const isDelivered = deliveredSet.has(item.id);
        const deliveryRecord = spec.siteDeliveryRecords?.[item.id];
        return (
          <div className="text-center whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleToggleComponentDelivery(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
                isDelivered
                  ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:border-slate-300'
              }`}
              title={isDelivered ? 'انقر لإلغاء التوريد' : 'انقر لتحديد القطعة كموردة للموقع'}
            >
              {isDelivered ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>مورد بالموقع</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>تحديد كمورد</span>
                </>
              )}
            </button>
            {isDelivered && deliveryRecord?.deliveredAt && (
              <div className="text-[10px] text-emerald-700 mt-0.5 font-mono">
                {deliveryRecord.deliveredAt}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'quantity',
      header: 'Qty / Unit',
      headerAr: 'الكمية والوحدة',
      headerEn: 'Qty / Unit',
      align: 'center',
      minWidth: '90px',
      sortable: true,
      accessor: (item) => item.quantity,
      renderCell: (item) => (
        <span className="whitespace-nowrap font-medium">
          {item.quantity} {item.unit}
        </span>
      ),
    },
    {
      id: 'unitCost',
      header: 'Unit Cost (SAR)',
      headerAr: 'سعر الوحدة (SAR)',
      headerEn: 'Unit Cost (SAR)',
      align: 'end',
      minWidth: '110px',
      sortable: true,
      accessor: (item) => item.unitCost,
      renderCell: (item) => (
        <span className="whitespace-nowrap text-slate-600 font-mono">
          <SarPrice amount={item.unitCost} />
        </span>
      ),
    },
    {
      id: 'totalCost',
      header: 'Total Cost (SAR)',
      headerAr: 'الإجمالي (SAR)',
      headerEn: 'Total Cost (SAR)',
      align: 'end',
      minWidth: '110px',
      sortable: true,
      accessor: (item) => item.totalCost,
      renderCell: (item) => (
        <span className="whitespace-nowrap font-semibold text-slate-900 font-mono">
          <SarPrice amount={item.totalCost} />
        </span>
      ),
    },
    {
      id: 'supplier',
      header: 'Supplier & Lead Time',
      headerAr: 'المورد وفترة التوريد',
      headerEn: 'Supplier & Lead Time',
      minWidth: '140px',
      sortable: true,
      accessor: (item) => item.supplier,
      renderCell: (item) => (
        <div className="whitespace-nowrap text-slate-500">
          <div>{item.supplier}</div>
          <div className="text-[10px] text-slate-400">{item.leadTimeDays} days lead time</div>
        </div>
      ),
    },
    {
      id: 'warehouseStock',
      header: 'Warehouse Stock',
      headerAr: 'رصيد المستودع والمخزون',
      headerEn: 'Warehouse Stock',
      minWidth: '150px',
      sortable: false,
      renderCell: (item) => {
        const matched = inventory.find(
          (inv) =>
            inv.category === item.category ||
            inv.sku.toLowerCase() === item.id.toLowerCase() ||
            item.name.toLowerCase().includes(inv.nameAr.toLowerCase().slice(0, 8))
        );
        if (!matched) {
          return (
            <span className="text-[11px] text-slate-400 font-mono">
              -
            </span>
          );
        }
        const isSufficient = matched.quantityOnHand >= item.quantity;
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                isSufficient
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : matched.quantityOnHand > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <Boxes className="w-3 h-3 shrink-0" />
              <span>
                {isSufficient
                  ? `متوفر (${matched.quantityOnHand} ${matched.unit})`
                  : matched.quantityOnHand > 0
                  ? `عجز: متاح ${matched.quantityOnHand}`
                  : 'غير متوفر بالمستودع'}
              </span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">
              {matched.sku} ({matched.location})
            </span>
          </div>
        );
      },
    },
  ], [deliveredSet, spec.siteDeliveryRecords, handleToggleComponentDelivery, inventory]);

  const componentsTable = useInteractiveTable({
    tableId: 'bom_components_table',
    columns: componentColumns,
    data: filteredComponents,
  });

  return (
    <div id="components-view-container" className="space-y-6">
      {/* Top Main Mode Switcher: Disbursement Statement (المراحل الثلاث) vs Technical BOM */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center overflow-x-auto no-scrollbar max-w-full gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('DISBURSEMENT_STAGES')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-md transition-all ${
              viewMode === 'DISBURSEMENT_STAGES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="بيان مقرر الصرف للموقع (المراحل الثلاث)"
          >
            <Package className="w-3.5 h-3.5 text-amber-300" />
            <span>مقرر الصرف للموقع</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('TECHNICAL_BOM')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-md transition-all ${
              viewMode === 'TECHNICAL_BOM'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="تحليل المواد وحساسية الأسعار (BOM)"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>تحليل المواد (BOM)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-1 truncate">
          {viewMode === 'DISBURSEMENT_STAGES' 
            ? 'مقرر الصرف المعتمد (62 بنداً تنفيذياً)'
            : 'تحليل تكاليف المواد وحساسية مؤشرات الحديد والنحاس'}
        </div>
      </div>

      {/* Mode 1: Disbursement Statement View (3 Stages) */}
      {viewMode === 'DISBURSEMENT_STAGES' && (
        <DisbursementStatementView
          spec={spec}
          onUpdateSpec={(upd) => onUpdateSpec(upd)}
          onSyncToGoogleSheet={onSyncToGoogleSheet}
          isSheetsConnected={isSheetsConnected}
        />
      )}

      {/* Mode 2: Technical BOM & Commodity Index Sensitivity */}
      {viewMode === 'TECHNICAL_BOM' && (
        <div className="space-y-4">
          {/* Inventory Availability Banner */}
          {inventory.length > 0 && (
            <div className="p-3 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-amber-900 block">
                    الربط اللوجستي مع المستودع المركزي ({inventory.length} صنف مسجل)
                  </span>
                  <span className="text-[11px] text-amber-700">
                    مراقبة توفر مكونات العرض في المستودع وحجز رصيد التشغيل للمشروع
                  </span>
                </div>
              </div>

              {onNavigateToInventory && (
                <button
                  type="button"
                  onClick={onNavigateToInventory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs shadow-2xs shrink-0"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>فتح المستودع والمخزون</span>
                </button>
              )}
            </div>
          )}

          {/* Material Index & Sensitivity Control Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Dynamic Material Cost Index & Sensitivity
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                <button
                  id="btn-copy-tsv"
                  type="button"
                  onClick={handleCopyTsv}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                  title="نسخ البيانات لجدول Sheets (TSV)"
                >
                  {copiedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">نسخ Sheets</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-export-excel-bom"
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
                  title="تصدير جدول المكونات وقطع الغيار (BOM) مباشرة إلى ملف Excel (.xlsx) لإدارة المستودع والجرد الميداني"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>تصدير Excel (.xlsx)</span>
                  {excelExportNotification && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-200/80 px-1 py-0.2 rounded font-black animate-in fade-in">
                      تم التصدير!
                    </span>
                  )}
                </button>

                {onSyncToGoogleSheet && (
                  <button
                    id="btn-sync-sheets-bom"
                    type="button"
                    onClick={onSyncToGoogleSheet}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    title={isSheetsConnected ? 'مزامنة BOM مع Google Sheets' : 'حفظ في Google Sheets'}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isSheetsConnected ? 'Sync' : 'Sheets'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              {/* Steel Index */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">Steel Index (Rails, Sling, Frames)</span>
                  <span className="font-semibold text-blue-600">
                    {(spec.steelPriceIndexFactor * 100).toFixed(0)}% ({spec.steelPriceIndexFactor >= 1 ? '+' : ''}
                    {((spec.steelPriceIndexFactor - 1) * 100).toFixed(0)}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={spec.steelPriceIndexFactor || 1.0}
                  onChange={(e) => handleSteelFactorChange(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>-20% (Low)</span>
                  <span>Nominal (100%)</span>
                  <span>+50% (High)</span>
                </div>
              </div>

              {/* Copper Index */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">Copper Index (Motor, Cables, Coils)</span>
                  <span className="font-semibold text-amber-600">
                    {(spec.copperPriceIndexFactor * 100).toFixed(0)}% ({spec.copperPriceIndexFactor >= 1 ? '+' : ''}
                    {((spec.copperPriceIndexFactor - 1) * 100).toFixed(0)}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={spec.copperPriceIndexFactor || 1.0}
                  onChange={(e) => handleCopperFactorChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>-20% (Low)</span>
                  <span>Nominal (100%)</span>
                  <span>+50% (High)</span>
                </div>
              </div>

              {/* Electronics Index */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">Electronics & Microchips (Inverter, COP)</span>
                  <span className="font-semibold text-purple-600">
                    {(spec.electronicsPriceIndexFactor * 100).toFixed(0)}% ({spec.electronicsPriceIndexFactor >= 1 ? '+' : ''}
                    {((spec.electronicsPriceIndexFactor - 1) * 100).toFixed(0)}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={spec.electronicsPriceIndexFactor || 1.0}
                  onChange={(e) => handleElectronicsFactorChange(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>-20% (Low)</span>
                  <span>Nominal (100%)</span>
                  <span>+50% (High)</span>
                </div>
              </div>
            </div>
          </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">Total Bill of Materials Cost</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            <SarPrice amount={financials.subtotalCost} />
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {components.length} Line Items Calculated
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">Quotation Selling Price</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            <SarPrice amount={financials.totalQuotationPrice} />
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Incl. Markup ({spec.markupPercentage}%) & Tax ({spec.taxPercentage}%)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">Projected Gross Profit</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            <SarPrice amount={financials.grossProfit} />
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Gross Margin: {financials.grossMarginPercent}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">Mechanical vs Electrical Ratio</div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            {Math.round((((financials.costByCategory['TRACTION_DRIVE'] || 0) + (financials.costByCategory['CAR_STRUCTURE'] || 0) + (financials.costByCategory['GUIDE_RAILS'] || 0)) / financials.subtotalCost) * 100)}% / {Math.round((((financials.costByCategory['CONTROL_ELECTRICAL'] || 0) + (financials.costByCategory['SAFETY_EQUIPMENT'] || 0)) / financials.subtotalCost) * 100)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Hardware vs Automation
          </div>
        </div>
      </div>

      {/* Site Delivery Tracking Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">متابعة توريد مكونات ومهمات الموقع (Site Delivery Tracking)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {deliveredCount} / {components.length} تم التوريد ({components.length > 0 ? Math.round((deliveredCount / components.length) * 100) : 0}%)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تحديد حالة استلام وتوريد القطع والمعدات في موقع المشروع BUY-24/1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0 w-full md:w-auto justify-start md:justify-end">
          <button
            type="button"
            onClick={handleMarkAllDelivered}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تحديد الكل كمورد (Mark All Delivered)</span>
          </button>
          {deliveredCount > 0 && (
            <button
              type="button"
              onClick={handleResetDelivery}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              إعادة ضبط (Reset)
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-components"
              type="text"
              placeholder="Search components, specs, part numbers, suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Delivery Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth max-w-full">
            <button
              type="button"
              onClick={() => setDeliveryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
                deliveryFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كل القطع ({components.length})
            </button>
            <button
              type="button"
              onClick={() => setDeliveryFilter('DELIVERED')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
                deliveryFilter === 'DELIVERED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مورد بالموقع ({deliveredCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryFilter('PENDING')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
                deliveryFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>قيد التوريد ({components.length - deliveredCount})</span>
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Subsystems ({components.length})
          </button>
          {Object.entries(CATEGORY_NAMES).map(([catKey, label]) => {
            const count = components.filter((c) => c.category === catKey).length;
            if (count === 0) return null;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === catKey
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Components Table: Interactive Draggable Columns + Fast Column Header Sorting */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <TableControlBar
          isReordered={componentsTable.isReordered}
          onResetOrder={componentsTable.resetColumnOrder}
          sortKey={componentsTable.sortKey}
          sortDir={componentsTable.sortDir}
          onResetSort={componentsTable.resetSort}
          isAr={false}
          totalCount={componentsTable.sortedData.length}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                {componentsTable.orderedColumns.map((col) => (
                  <InteractiveTableHeader
                    key={col.id}
                    column={col}
                    sortKey={componentsTable.sortKey}
                    sortDir={componentsTable.sortDir}
                    onSort={componentsTable.handleSort}
                    draggedColId={componentsTable.draggedColId}
                    dragOverColId={componentsTable.dragOverColId}
                    onDragStart={componentsTable.handleDragStart}
                    onDragOver={componentsTable.handleDragOver}
                    onDragLeave={componentsTable.handleDragLeave}
                    onDrop={componentsTable.handleDrop}
                    onDragEnd={componentsTable.handleDragEnd}
                    isAr={false}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {componentsTable.sortedData.length === 0 ? (
                <tr>
                  <td colSpan={componentsTable.orderedColumns.length} className="px-4 py-8 text-center text-slate-400">
                    No components match your search query or delivery filter.
                  </td>
                </tr>
              ) : (
                componentsTable.sortedData.map((item, idx) => {
                  const isDelivered = deliveredSet.has(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/70 transition-colors ${isDelivered ? 'bg-emerald-50/30' : ''}`}>
                      {componentsTable.orderedColumns.map((col) => (
                        <td key={col.id} className={`px-4 py-3 ${col.className || ''}`}>
                          {col.renderCell(item, idx)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold border-t-2 border-slate-200 text-slate-800">
              <tr>
                <td colSpan={Math.max(1, componentsTable.orderedColumns.length - 2)} className="px-4 py-3.5 text-right uppercase tracking-wider text-xs">
                  Total Calculated Equipment &amp; Labor Subtotal:
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-base text-blue-600">
                  <SarPrice amount={componentsTable.sortedData.reduce((s, i) => s + i.totalCost, 0)} />
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">
                  {componentsTable.sortedData.length} items shown
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
