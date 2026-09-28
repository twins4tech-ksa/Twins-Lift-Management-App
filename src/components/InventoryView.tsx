import React, { useState, useMemo } from 'react';
import { 
  InventoryItem, 
  InventoryMovement, 
  InventoryCategory, 
  INVENTORY_CATEGORIES_INFO,
  Vendor
} from '../types/inventory';
import { ElevatorSpecification } from '../types/elevator';
import { MaintenanceBreakdown } from '../types/maintenance';
import { AppLanguage } from '../utils/translations';
import { CompanySettings } from '../types/settings';
import { SarPrice, SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import { exportInventoryToExcel } from '../utils/excelExport';
import { ItemHistoryModal } from './ItemHistoryModal';
import { VendorModal } from './VendorModal';
import {
  Boxes,
  Package,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Trash2,
  Edit,
  History,
  Tag,
  MapPin,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  X,
  Clock,
  ShieldAlert,
  Layers,
  ArrowUpDown,
  Building2,
  Wrench,
  Star,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Bookmark,
  Check,
  ArrowRight,
  ArrowLeft,
  Eye
} from 'lucide-react';

interface Props {
  inventory: InventoryItem[];
  movements: InventoryMovement[];
  projects: ElevatorSpecification[];
  breakdowns: MaintenanceBreakdown[];
  vendors?: Vendor[];
  language: AppLanguage;
  companySettings: CompanySettings;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onAdjustStock: (
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
  ) => void;
  onAddVendor?: (vendor: Omit<Vendor, 'id'>) => void;
  onUpdateVendor?: (vendor: Vendor) => void;
  onDeleteVendor?: (vendorId: string) => void;
  onShowToast: (msg: string) => void;
}

export const InventoryView: React.FC<Props> = ({
  inventory,
  movements,
  projects,
  breakdowns,
  vendors = [],
  language,
  companySettings,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAdjustStock,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onShowToast,
}) => {
  const isAr = language === 'ar';

  // Navigation tab inside Inventory
  const [activeSubTab, setActiveSubTab] = useState<'ITEMS' | 'MOVEMENTS' | 'LOW_STOCK' | 'VENDORS'>('ITEMS');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'RESERVED'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'STOCK_LOW' | 'STOCK_HIGH' | 'VALUATION_HIGH'>('NAME');
  const [filterByVendorId, setFilterByVendorId] = useState<string | null>(null);

  // Vendor Directory Search & Filters
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState<string>('ALL');
  const [vendorCountryFilter, setVendorCountryFilter] = useState<string>('ALL');
  const [vendorStatusFilter, setVendorStatusFilter] = useState<'ALL' | 'APPROVED'>('ALL');
  const [vendorSortBy, setVendorSortBy] = useState<'RATING' | 'NAME' | 'LEAD_TIME' | 'PARTS_COUNT'>('RATING');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [stockOpItem, setStockOpItem] = useState<{ item: InventoryItem; type: 'IN' | 'OUT' } | null>(null);
  const [stockOpQty, setStockOpQty] = useState<number>(1);
  const [stockOpRefType, setStockOpRefType] = useState<'PURCHASE_ORDER' | 'PROJECT' | 'BREAKDOWN' | 'MANUAL'>('MANUAL');
  const [stockOpRefId, setStockOpRefId] = useState<string>('');
  const [stockOpNotes, setStockOpNotes] = useState<string>('');

  // Item Form state (for Add & Edit)
  const initialFormState: Omit<InventoryItem, 'id'> = {
    sku: '',
    nameAr: '',
    nameEn: '',
    category: 'TRACTION_DRIVE',
    specification: '',
    quantityOnHand: 0,
    quantityReserved: 0,
    minStockLevel: 2,
    unit: 'pcs',
    unitCost: 0,
    sellingPrice: 0,
    supplier: '',
    vendorId: '',
    location: isAr ? 'مستودع الرياض الرئيسي' : 'Riyadh Central Warehouse',
    leadTimeDays: 14,
    notes: '',
    compatibleWith: '',
  };
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>(initialFormState);

  // Locations list
  const locations = useMemo(() => {
    const locSet = new Set<string>();
    inventory.forEach((i) => {
      if (i.location) locSet.add(i.location);
    });
    return Array.from(locSet);
  }, [inventory]);

  // Countries list for vendor filter
  const vendorCountries = useMemo(() => {
    const countrySet = new Set<string>();
    vendors.forEach((v) => {
      if (v.country) countrySet.add(v.country);
    });
    return Array.from(countrySet);
  }, [vendors]);

  // Vendor statistics
  const vendorStats = useMemo(() => {
    const totalVendors = vendors.length;
    const approvedCount = vendors.filter((v) => v.isApproved).length;
    const topRatedCount = vendors.filter((v) => (v.rating || 5) >= 5).length;
    const avgLeadTime = totalVendors > 0
      ? Math.round(vendors.reduce((acc, v) => acc + (v.leadTimeDaysAvg || 0), 0) / totalVendors)
      : 14;

    // Count how many inventory items have linked vendors
    let linkedItemsTotal = 0;
    vendors.forEach((v) => {
      const count = inventory.filter(
        (i) => i.vendorId === v.id || 
               i.supplier.toLowerCase().includes(v.code.toLowerCase()) || 
               i.supplier.toLowerCase().includes(v.nameAr.toLowerCase())
      ).length;
      linkedItemsTotal += count;
    });

    return {
      totalVendors,
      approvedCount,
      topRatedCount,
      avgLeadTime,
      linkedItemsTotal,
    };
  }, [vendors, inventory]);

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    return vendors
      .filter((v) => {
        if (vendorSearchQuery.trim()) {
          const q = vendorSearchQuery.toLowerCase().trim();
          const mNameAr = v.nameAr.toLowerCase().includes(q);
          const mNameEn = v.nameEn.toLowerCase().includes(q);
          const mCode = v.code.toLowerCase().includes(q);
          const mPerson = (v.contactPerson || '').toLowerCase().includes(q);
          const mPhone = (v.phone || '').toLowerCase().includes(q);
          const mEmail = (v.email || '').toLowerCase().includes(q);
          const mCountry = (v.country || '').toLowerCase().includes(q);
          const mCity = (v.city || '').toLowerCase().includes(q);
          if (!mNameAr && !mNameEn && !mCode && !mPerson && !mPhone && !mEmail && !mCountry && !mCity) {
            return false;
          }
        }

        if (vendorCategoryFilter !== 'ALL') {
          if (!v.categories.includes(vendorCategoryFilter as InventoryCategory)) {
            return false;
          }
        }

        if (vendorCountryFilter !== 'ALL' && v.country !== vendorCountryFilter) {
          return false;
        }

        if (vendorStatusFilter === 'APPROVED' && !v.isApproved) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (vendorSortBy === 'RATING') {
          return (b.rating || 5) - (a.rating || 5);
        }
        if (vendorSortBy === 'LEAD_TIME') {
          return (a.leadTimeDaysAvg || 0) - (b.leadTimeDaysAvg || 0);
        }
        if (vendorSortBy === 'PARTS_COUNT') {
          const countA = inventory.filter(
            (i) => i.vendorId === a.id || 
                   i.supplier.toLowerCase().includes(a.code.toLowerCase()) || 
                   i.supplier.toLowerCase().includes(a.nameAr.toLowerCase())
          ).length;
          const countB = inventory.filter(
            (i) => i.vendorId === b.id || 
                   i.supplier.toLowerCase().includes(b.code.toLowerCase()) || 
                   i.supplier.toLowerCase().includes(b.nameAr.toLowerCase())
          ).length;
          return countB - countA;
        }
        return a.nameAr.localeCompare(b.nameAr);
      });
  }, [vendors, vendorSearchQuery, vendorCategoryFilter, vendorCountryFilter, vendorStatusFilter, vendorSortBy, inventory]);

  // KPIs
  const stats = useMemo(() => {
    let totalUnits = 0;
    let totalReserved = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    inventory.forEach((item) => {
      totalUnits += item.quantityOnHand;
      totalReserved += item.quantityReserved || 0;
      totalValue += item.quantityOnHand * (item.unitCost || 0);
      if (item.quantityOnHand <= 0) {
        outOfStockCount++;
        lowStockCount++;
      } else if (item.quantityOnHand <= item.minStockLevel) {
        lowStockCount++;
      }
    });

    return {
      totalItems: inventory.length,
      totalUnits,
      totalReserved,
      totalValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [inventory]);

  // Filtered Inventory Items
  const filteredItems = useMemo(() => {
    return inventory
      .filter((item) => {
        // Vendor filter (from clicking vendor card)
        if (filterByVendorId) {
          const matchingVendor = vendors.find((v) => v.id === filterByVendorId);
          const matchesId = item.vendorId === filterByVendorId;
          const matchesCode = matchingVendor && item.supplier.toLowerCase().includes(matchingVendor.code.toLowerCase());
          const matchesName = matchingVendor && item.supplier.toLowerCase().includes(matchingVendor.nameAr.toLowerCase());
          if (!matchesId && !matchesCode && !matchesName) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchSku = item.sku.toLowerCase().includes(q);
          const matchNameAr = item.nameAr.toLowerCase().includes(q);
          const matchNameEn = item.nameEn.toLowerCase().includes(q);
          const matchSpec = item.specification.toLowerCase().includes(q);
          const matchSupp = item.supplier.toLowerCase().includes(q);
          const matchLoc = item.location.toLowerCase().includes(q);
          if (!matchSku && !matchNameAr && !matchNameEn && !matchSpec && !matchSupp && !matchLoc) {
            return false;
          }
        }

        // Category
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
          return false;
        }

        // Status
        if (selectedStatus === 'LOW_STOCK' && item.quantityOnHand > item.minStockLevel) {
          return false;
        }
        if (selectedStatus === 'OUT_OF_STOCK' && item.quantityOnHand > 0) {
          return false;
        }
        if (selectedStatus === 'IN_STOCK' && item.quantityOnHand <= item.minStockLevel) {
          return false;
        }
        if (selectedStatus === 'RESERVED' && (!item.quantityReserved || item.quantityReserved <= 0)) {
          return false;
        }

        // SubTab forced low stock
        if (activeSubTab === 'LOW_STOCK' && item.quantityOnHand > item.minStockLevel) {
          return false;
        }

        // Location
        if (selectedLocation !== 'ALL' && item.location !== selectedLocation) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'STOCK_LOW') {
          return a.quantityOnHand - b.quantityOnHand;
        }
        if (sortBy === 'STOCK_HIGH') {
          return b.quantityOnHand - a.quantityOnHand;
        }
        if (sortBy === 'VALUATION_HIGH') {
          return b.quantityOnHand * b.unitCost - a.quantityOnHand * a.unitCost;
        }
        return a.nameAr.localeCompare(b.nameAr);
      });
  }, [inventory, searchQuery, selectedCategory, selectedStatus, selectedLocation, sortBy, activeSubTab, filterByVendorId, vendors]);

  // Form submission: Create or Update
  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr.trim() || !formData.sku.trim()) {
      onShowToast(isAr ? 'يرجى إدخال كود الصنف واسم القطعة' : 'Please provide SKU and item name');
      return;
    }

    if (editingItem) {
      onUpdateItem({
        ...formData,
        id: editingItem.id,
      });
      onShowToast(isAr ? 'تم تعديل بيانات الصنف المخزني بنجاح' : 'Item updated successfully');
      setEditingItem(null);
    } else {
      onAddItem(formData);
      onShowToast(isAr ? 'تمت إضافة الصنف الجديد إلى المستودع' : 'New inventory item created');
      setIsAddModalOpen(false);
    }
  };

  // Stock Op submission (In / Out)
  const handleSubmitStockOp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockOpItem || stockOpQty <= 0) return;

    let refLabel = '';
    if (stockOpRefType === 'PROJECT') {
      const p = projects.find((x) => x.id === stockOpRefId || x.quoteRef === stockOpRefId);
      refLabel = p ? `${p.projectName} (${p.quoteRef})` : stockOpRefId;
    } else if (stockOpRefType === 'BREAKDOWN') {
      const b = breakdowns.find((x) => x.id === stockOpRefId);
      refLabel = b ? `${b.customerName} - ${b.elevatorName}` : stockOpRefId;
    } else {
      refLabel = stockOpRefId || (isAr ? 'عملية مخزنية يدوية' : 'Manual stock operation');
    }

    onAdjustStock(stockOpItem.item.id, stockOpQty, stockOpItem.type, {
      referenceType: stockOpRefType,
      referenceId: stockOpRefId,
      referenceLabel: refLabel,
      notes: stockOpNotes,
      performedBy: isAr ? 'أمين المستودع' : 'Warehouse Admin',
    });

    onShowToast(
      stockOpItem.type === 'IN'
        ? (isAr ? `تم توريد واستلام ${stockOpQty} ${stockOpItem.item.unit} بنجاح` : `Received ${stockOpQty} units`)
        : (isAr ? `تم صرف ${stockOpQty} ${stockOpItem.item.unit} بنجاح` : `Issued ${stockOpQty} units`)
    );

    setStockOpItem(null);
    setStockOpQty(1);
    setStockOpRefId('');
    setStockOpNotes('');
  };

  // Open Edit Item modal
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      category: item.category,
      specification: item.specification,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      minStockLevel: item.minStockLevel,
      unit: item.unit,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice || Math.round(item.unitCost * 1.35),
      supplier: item.supplier,
      vendorId: item.vendorId || '',
      location: item.location,
      leadTimeDays: item.leadTimeDays,
      notes: item.notes || '',
      compatibleWith: item.compatibleWith || '',
    });
  };

  // Open Add Item modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    const randomSku = Math.floor(100 + Math.random() * 900);
    setFormData({
      ...initialFormState,
      sku: `PRT-${randomSku}`,
    });
    setIsAddModalOpen(true);
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    try {
      exportInventoryToExcel(inventory, movements);
      onShowToast(isAr ? 'تم تصدير تقرير جرد المستودع إلى Excel بنجاح ✅' : 'Inventory exported to Excel ✅');
    } catch (err) {
      console.error(err);
      onShowToast(isAr ? 'حدث خطأ أثناء تصدير الجرد' : 'Failed to export inventory');
    }
  };

  return (
    <div className="space-y-5 pb-12 select-none">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Boxes className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                {isAr ? 'إدارة سلاسل الإمداد والمخزون ERP' : 'Supply Chain & Inventory ERP'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {inventory.length} {isAr ? 'صنف مسجل' : 'registered items'}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-0.5">
              {isAr ? 'مستودع المكونات الميكانيكية والكهربائية وقطع الغيار' : 'Elevator Mechanical & Electrical Spare Parts Warehouse'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'مراقبة الرصيد المتاح، حجز مكونات المصاعد للمشاريع، وإدارة قطع الغيار المستهلكة في عقود وبلاغات الصيانة'
                : 'Monitor stock on hand, reserve BOM components for contracted lifts, and issue spare parts for maintenance'}
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
            title={isAr ? 'تصدير كامل بيانات المستودع وتقييم المخزون إلى ملف Excel' : 'Export Inventory to Excel (.xlsx)'}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'تصدير الجرد (Excel)' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة صنف جديد' : 'Add New Item'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Total SKUs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">
              {isAr ? 'إجمالي الأصناف بالمستودع' : 'Total Registered SKUs'}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.totalItems}
              <span className="text-xs font-normal text-slate-400 mx-1">
                ({stats.totalUnits} {isAr ? 'قطعة' : 'units'})
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Stock Valuation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">
              {isAr ? 'إجمالي تقييم المخزون' : 'Total Inventory Value'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 flex items-center gap-1">
              <span>{stats.totalValue.toLocaleString()}</span>
              <SaudiRiyalSymbol className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Low Stock Warnings */}
        <div 
          onClick={() => setActiveSubTab(activeSubTab === 'LOW_STOCK' ? 'ITEMS' : 'LOW_STOCK')}
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            stats.lowStockCount > 0 
              ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/60' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-rose-700 block flex items-center gap-1">
              {stats.lowStockCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              {isAr ? 'تنبيهات النواقص وإعادة الطلب' : 'Low Stock Reorder Alerts'}
            </span>
            <div className="text-2xl font-black text-rose-800 mt-1">
              {stats.lowStockCount}
              <span className="text-xs font-normal text-rose-600 mx-1">
                {isAr ? 'أصناف حرجة' : 'critical items'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Reserved for Projects */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">
              {isAr ? 'المكونات المحجوزة للمشاريع' : 'Reserved for Projects'}
            </span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {stats.totalReserved}
              <span className="text-xs font-normal text-slate-400 mx-1">
                {isAr ? 'وحدة مخصصة' : 'allocated'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setActiveSubTab('ITEMS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ITEMS'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>{isAr ? 'دليل الأصناف والمخزون' : 'Stock Catalog'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">
            {inventory.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('LOW_STOCK')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'LOW_STOCK'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>{isAr ? 'النواقص وطلبيات الشراء' : 'Low Stock & Reorders'}</span>
          {stats.lowStockCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-rose-700 font-bold font-mono">
              {stats.lowStockCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('MOVEMENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'MOVEMENTS'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-slate-400" />
          <span>{isAr ? 'سجل الحركات والتوريد' : 'Movements Log & Audit'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
            {movements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('VENDORS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'VENDORS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>{isAr ? 'الموردون والشركات المصنعة' : 'Vendors & Manufacturers'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono font-bold">
            {vendors.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1 & 2: ITEMS CATALOG & LOW STOCK VIEW                                */}
      {/* ========================================================================= */}
      {(activeSubTab === 'ITEMS' || activeSubTab === 'LOW_STOCK') && (
        <div className="space-y-4">
          {/* Active Vendor Filter Banner if selected */}
          {filterByVendorId && (
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-mono shrink-0">
                  {vendors.find(v => v.id === filterByVendorId)?.code || 'VND'}
                </div>
                <div>
                  <div className="font-bold">
                    {isAr 
                      ? `عرض الأصناف الموردة من: ${vendors.find(v => v.id === filterByVendorId)?.nameAr || filterByVendorId}`
                      : `Filtering items from: ${vendors.find(v => v.id === filterByVendorId)?.nameEn || filterByVendorId}`}
                  </div>
                  <div className="text-[10px] text-indigo-700">
                    {isAr ? `إجمالي الأصناف المعروضة: ${filteredItems.length} صنف` : `Total items: ${filteredItems.length}`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFilterByVendorId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-300 font-bold text-xs cursor-pointer shadow-2xs transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isAr ? 'إلغاء التصفية (عرض الكل)' : 'Clear Filter'}</span>
              </button>
            </div>
          )}

          {/* Search & Filters Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث بالكود، الاسم، المواصفات، المورد...' : 'Search SKU, name, spec, supplier...'}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="ALL">{isAr ? 'جميع التصنيفات' : 'All Categories'}</option>
                  {Object.entries(INVENTORY_CATEGORIES_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {isAr ? info.labelAr : info.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="ALL">{isAr ? 'جميع حالات المخزون' : 'All Stock Status'}</option>
                  <option value="IN_STOCK">{isAr ? 'متوفر فوق الحد الأدنى' : 'In Stock (Healthy)'}</option>
                  <option value="LOW_STOCK">{isAr ? 'منخفض / تحت الحد الأدنى' : 'Low Stock (Alert)'}</option>
                  <option value="OUT_OF_STOCK">{isAr ? 'نافد بالكامل (0)' : 'Out of Stock (0)'}</option>
                  <option value="RESERVED">{isAr ? 'أصناف محجوزة للمشاريع' : 'Has Reserved Units'}</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="NAME">{isAr ? 'ترتيب: أبجدياً بالاسم' : 'Sort: By Name'}</option>
                  <option value="STOCK_LOW">{isAr ? 'ترتيب: الرصيد الأقل أولاً (نواقص)' : 'Sort: Lowest Stock First'}</option>
                  <option value="STOCK_HIGH">{isAr ? 'ترتيب: الرصيد الأكثر أولاً' : 'Sort: Highest Stock First'}</option>
                  <option value="VALUATION_HIGH">{isAr ? 'ترتيب: القيمة المالية الأعلى' : 'Sort: Highest Valuation'}</option>
                </select>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span className="font-semibold">
                {isAr
                  ? `عرض ${filteredItems.length} من أصل ${inventory.length} صنف`
                  : `Showing ${filteredItems.length} of ${inventory.length} items`}
              </span>

              {activeSubTab === 'LOW_STOCK' && (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isAr ? 'يتم عرض الأصناف التي تحتاج إعادة طلب فوري' : 'Displaying items that require replenishment'}
                </span>
              )}
            </div>
          </div>

          {/* Items Table / Cards */}
          {filteredItems.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {isAr ? 'لا توجد أصناف تطابق معايير البحث الحالية' : 'No items match the current filters'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAr ? 'يمكنك إعادة ضبط خيارات البحث أو إضافة صنف جديد للمستودع' : 'Try resetting your search query or add a new stock item'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right" dir="rtl">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold select-none">
                      <th className="py-3 px-4 text-center w-12">#</th>
                      <th className="py-3 px-4 min-w-[200px]">{isAr ? 'الصنف وكود SKU' : 'Item & SKU'}</th>
                      <th className="py-3 px-3 text-center">{isAr ? 'التصنيف' : 'Category'}</th>
                      <th className="py-3 px-3 text-center min-w-[120px]">{isAr ? 'الرصيد المتاح' : 'Quantity on Hand'}</th>
                      <th className="py-3 px-3 text-center">{isAr ? 'المحجوز' : 'Reserved'}</th>
                      <th className="py-3 px-3">{isAr ? 'الموقع بالمستودع' : 'Warehouse Location'}</th>
                      <th className="py-3 px-3 text-left">{isAr ? 'سعر التكلفة' : 'Unit Cost'}</th>
                      <th className="py-3 px-3 text-left">{isAr ? 'إجمالي القيمة' : 'Total Valuation'}</th>
                      <th className="py-3 px-4 text-center min-w-[150px]">{isAr ? 'إجراءات سريعة' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item, index) => {
                      const categoryInfo = INVENTORY_CATEGORIES_INFO[item.category];
                      const isLowStock = item.quantityOnHand <= item.minStockLevel && item.quantityOnHand > 0;
                      const isOutOfStock = item.quantityOnHand <= 0;
                      const totalVal = item.quantityOnHand * item.unitCost;

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isOutOfStock ? 'bg-rose-50/30' : isLowStock ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* Index */}
                          <td className="py-3 px-4 text-center font-mono text-slate-400">
                            {index + 1}
                          </td>

                          {/* Item Name & SKU */}
                          <td className="py-3 px-4">
                            <div 
                              onClick={() => setHistoryItem(item)}
                              className="font-bold text-slate-900 leading-snug hover:text-blue-600 cursor-pointer transition-colors"
                              title={isAr ? 'انقر لعرض سجل الحركات والتوريد' : 'Click to view movement history'}
                            >
                              {item.nameAr}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span 
                                onClick={() => setHistoryItem(item)}
                                className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
                                title={isAr ? 'انقر لعرض سجل الحركات والتوريد' : 'Click to view movement history'}
                              >
                                {item.sku}
                              </span>
                              <span className="truncate max-w-[200px]" title={item.nameEn}>
                                {item.nameEn}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[260px] mt-0.5" title={item.specification}>
                              {item.specification}
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${categoryInfo ? categoryInfo.color : 'bg-slate-100 text-slate-700'}`}>
                              {isAr ? categoryInfo?.labelAr : categoryInfo?.labelEn}
                            </span>
                          </td>

                          {/* Quantity On Hand & Stock Status */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1 font-mono font-black text-sm">
                              <span className={isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'}>
                                {item.quantityOnHand}
                              </span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {item.unit}
                              </span>
                            </div>

                            {/* Status Pill */}
                            <div className="mt-1">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>{isAr ? 'نافد بالكامل' : 'Out of Stock'}</span>
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                  <span>{isAr ? `منخفض (حد: ${item.minStockLevel})` : `Low (Min: ${item.minStockLevel})`}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>{isAr ? 'متوفر' : 'In Stock'}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Reserved */}
                          <td className="py-3 px-3 text-center">
                            {item.quantityReserved && item.quantityReserved > 0 ? (
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-xs">
                                {item.quantityReserved}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>

                          {/* Location */}
                          <td className="py-3 px-3 text-slate-600">
                            <div className="flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[130px]" title={item.location}>
                                {item.location}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[130px] mt-0.5" title={item.supplier}>
                              {item.supplier}
                            </div>
                          </td>

                          {/* Unit Cost */}
                          <td className="py-3 px-3 text-left font-mono font-bold text-slate-700" dir="ltr">
                            {item.unitCost.toLocaleString()} ر.س
                          </td>

                          {/* Total Valuation */}
                          <td className="py-3 px-3 text-left font-mono font-black text-emerald-700" dir="ltr">
                            {totalVal.toLocaleString()} ر.س
                          </td>

                          {/* Actions: Stock In, Stock Out, History, Edit, Delete */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Item History (سجل حركات وتوريد الصنف) */}
                              <button
                                type="button"
                                onClick={() => setHistoryItem(item)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                                title={isAr ? 'سجل حركات وتوريد الصنف (Item History)' : 'View Item Movement History'}
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              {/* Stock In (+) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setStockOpItem({ item, type: 'IN' });
                                  setStockOpQty(1);
                                  setStockOpRefType('PURCHASE_ORDER');
                                  setStockOpRefId('');
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                                title={isAr ? 'توريد واستلام رصيد (Stock In)' : 'Receive stock (+)'}
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              </button>

                              {/* Stock Out (-) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setStockOpItem({ item, type: 'OUT' });
                                  setStockOpQty(1);
                                  setStockOpRefType('PROJECT');
                                  setStockOpRefId(projects[0]?.quoteRef || '');
                                }}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                                title={isAr ? 'صرف وإخراج للمشروع أو الصيانة (Stock Out)' : 'Issue stock (-)'}
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title={isAr ? 'تعديل بيانات الصنف' : 'Edit item'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(isAr ? `هل أنت متأكد من حذف الصنف "${item.nameAr}" من المستودع؟` : `Delete "${item.nameAr}"?`)) {
                                    onDeleteItem(item.id);
                                    onShowToast(isAr ? 'تم حذف الصنف من المستودع' : 'Item deleted');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                title={isAr ? 'حذف الصنف' : 'Delete item'}
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: MOVEMENTS & AUDIT LOG TAB                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-700" />
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {isAr ? 'سجل حركات الإدخال والصرف وحجز المواد' : 'Stock In / Out Movement Audit Trail'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'توثيق دقيق لكل تغيير في رصيد القطع مع أرقام المشاريع وبلاغات الصيانة' : 'Complete audit of inventory adjustments with project and breakdown cross-references'}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              {movements.length} {isAr ? 'حركة مسجلة' : 'Movements'}
            </span>
          </div>

          {movements.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
              {isAr ? 'لا توجد حركات مخزنية مسجلة حتى الآن' : 'No movements recorded yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right" dir="rtl">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">{isAr ? 'التاريخ والتوقيت' : 'Timestamp'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'نوع الحركة' : 'Type'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'الصنف' : 'Item'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'قبل / بعد' : 'Prev / New'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'المرجع والبيان' : 'Reference'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'المنفذ' : 'Performed By'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'سجل الصنف' : 'Item History'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((mov, idx) => (
                    <tr key={mov.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{mov.date}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {mov.type === 'IN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            <span>{isAr ? 'توريد (IN)' : 'Stock In'}</span>
                          </span>
                        )}
                        {mov.type === 'OUT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            <ArrowUpRight className="w-3 h-3 text-amber-600" />
                            <span>{isAr ? 'صرف (OUT)' : 'Stock Out'}</span>
                          </span>
                        )}
                        {mov.type === 'RESERVE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                            <Layers className="w-3 h-3 text-blue-600" />
                            <span>{isAr ? 'حجز (RESERVE)' : 'Reserve'}</span>
                          </span>
                        )}
                        {mov.type === 'ADJUST' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>{isAr ? 'تسوية' : 'Adjust'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div 
                          onClick={() => {
                            const found = inventory.find((i) => i.id === mov.itemId || i.sku === mov.sku);
                            if (found) setHistoryItem(found);
                          }}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                          title={isAr ? 'عرض سجل حركات هذا الصنف' : 'View item history'}
                        >
                          {mov.itemName}
                        </div>
                        <div className="text-[10px] font-mono text-amber-700">{mov.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-sm">
                        <span className={mov.type === 'IN' ? 'text-emerald-700' : 'text-amber-700'}>
                          {mov.type === 'IN' ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">
                        {mov.previousQty} ➔ <span className="font-bold text-slate-800">{mov.newQty}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {mov.referenceLabel || mov.referenceId || '-'}
                        </div>
                        {mov.notes && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {mov.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {mov.performedBy || 'المسؤول'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const found = inventory.find((i) => i.id === mov.itemId || i.sku === mov.sku);
                            if (found) {
                              setHistoryItem(found);
                            } else {
                              onShowToast(isAr ? 'لم يتم العثور على الصنف بالمستودع' : 'Item not found in warehouse');
                            }
                          }}
                          className="px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-2xs"
                          title={isAr ? 'عرض سجل حركات هذا الصنف كاملاً' : 'View full item history'}
                        >
                          <History className="w-3 h-3 text-blue-600" />
                          <span>{isAr ? 'السجل' : 'History'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: CERTIFIED VENDORS & SUPPLIERS DIRECTORY TAB                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'VENDORS' && (
        <div className="space-y-4">
          {/* Header Strip with Add Button */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shrink-0">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    {isAr ? 'دليل الموردين والمصانع المعتمدة' : 'Certified Suppliers & Manufacturers Directory'}
                  </h3>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {vendors.length} {isAr ? 'مورد معتمد' : 'Vendors'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr 
                    ? 'إدارة بيانات المصانع والشركات الموردة، تقييم الجودة والاعتمادية، شروط السداد، وتتبع الأصناف المرتبطة بالمستودع'
                    : 'Manage supplier profiles, contact details, payment terms, quality ratings and linked inventory'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingVendor(null);
                setIsVendorModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تسجيل مورد معتمد جديد' : 'Register New Vendor'}</span>
            </button>
          </div>

          {/* Top KPI Cards for Vendors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  {isAr ? 'الموردون المعتمدون' : 'Certified Vendors'}
                </span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {vendorStats.totalVendors}
                  <span className="text-xs font-normal text-emerald-600 mx-1">
                    ({vendorStats.approvedCount} {isAr ? 'معتمد' : 'approved'})
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  {isAr ? 'متوسط فترة التوريد' : 'Avg. Lead Time'}
                </span>
                <div className="text-2xl font-black text-amber-700 mt-0.5">
                  {vendorStats.avgLeadTime}
                  <span className="text-xs font-normal text-slate-400 mx-1">{isAr ? 'يوم' : 'days'}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  {isAr ? 'تقييم ممتاز (5 نجوم)' : 'Top Rated (5 Stars)'}
                </span>
                <div className="text-2xl font-black text-amber-500 mt-0.5 flex items-center gap-1">
                  <span>{vendorStats.topRatedCount}</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  {isAr ? 'أصناف المستودع المربوطة' : 'Supplied Stock SKUs'}
                </span>
                <div className="text-2xl font-black text-blue-700 mt-0.5">
                  {vendorStats.linkedItemsTotal}
                  <span className="text-xs font-normal text-slate-400 mx-1">{isAr ? 'صنف' : 'items'}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                <Boxes className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Search input */}
              <div className="relative lg:col-span-2">
                <input
                  type="text"
                  value={vendorSearchQuery}
                  onChange={(e) => setVendorSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث بالاسم، الكود، جهة الاتصال، الدولة، المدينة...' : 'Search name, code, contact, country...'}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3 pointer-events-none" />
                {vendorSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setVendorSearchQuery('')}
                    className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={vendorCategoryFilter}
                  onChange={(e) => setVendorCategoryFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">{isAr ? 'جميع التصنيفات المعتمدة' : 'All Categories'}</option>
                  {Object.entries(INVENTORY_CATEGORIES_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {isAr ? info.labelAr.split('(')[0] : info.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div>
                <select
                  value={vendorCountryFilter}
                  onChange={(e) => setVendorCountryFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">{isAr ? 'جميع بلدان المنشأ' : 'All Countries'}</option>
                  {vendorCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={vendorSortBy}
                  onChange={(e) => setVendorSortBy(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="RATING">{isAr ? 'الأعلى تقييماً (النجوم)' : 'Highest Rating'}</option>
                  <option value="LEAD_TIME">{isAr ? 'الأسرع توريداً (أيام)' : 'Fastest Lead Time'}</option>
                  <option value="PARTS_COUNT">{isAr ? 'الأكثر توريداً للأصناف' : 'Most Supplied SKUs'}</option>
                  <option value="NAME">{isAr ? 'الترتيب الأبجدي' : 'Alphabetical'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vendor Cards Grid */}
          {filteredVendors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400 space-y-2">
              <Building2 className="w-12 h-12 mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-600">
                {isAr ? 'لا يوجد موردون مطابقون لخيارات البحث' : 'No matching vendors found'}
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? 'جرب تغيير فلاتر البحث أو أضف مورداً معتمداً جديداً' : 'Try adjusting your filters or register a new vendor'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setVendorSearchQuery('');
                  setVendorCategoryFilter('ALL');
                  setVendorCountryFilter('ALL');
                  setVendorStatusFilter('ALL');
                }}
                className="mt-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredVendors.map((vendor) => {
                const linkedItems = inventory.filter(
                  (i) => i.vendorId === vendor.id || 
                         i.supplier.toLowerCase().includes(vendor.code.toLowerCase()) || 
                         i.supplier.toLowerCase().includes(vendor.nameAr.toLowerCase())
                );
                const linkedCount = linkedItems.length;

                return (
                  <div
                    key={vendor.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Top Row: Code, Country & Rating & Approved status */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                            {vendor.code}
                          </span>
                          {vendor.isApproved && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{isAr ? 'معتمد رسمياً' : 'Certified'}</span>
                            </span>
                          )}
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 bg-amber-50/80 px-2 py-0.5 rounded-lg border border-amber-200">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  (vendor.rating || 5) >= s
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-amber-900 font-mono mr-1">
                            {vendor.rating || 5}.0
                          </span>
                        </div>
                      </div>

                      {/* Name Ar & En */}
                      <div>
                        <h4 className="text-base font-black text-slate-900 leading-snug">
                          {vendor.nameAr}
                        </h4>
                        {vendor.nameEn && (
                          <div className="text-xs text-slate-500 font-medium font-sans mt-0.5" dir="ltr">
                            {vendor.nameEn}
                          </div>
                        )}
                      </div>

                      {/* Country & City */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{vendor.country}</span>
                        {vendor.city && <span className="text-slate-400">• {vendor.city}</span>}
                      </div>

                      {/* Contacts Strip: Person, Phone, Email, Website */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {vendor.contactPerson && (
                          <div className="flex items-center gap-1.5 text-slate-700 truncate" title={vendor.contactPerson}>
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold truncate">{vendor.contactPerson}</span>
                          </div>
                        )}

                        {vendor.phone && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <a 
                              href={`tel:${vendor.phone}`} 
                              className="font-mono text-indigo-600 hover:text-indigo-800 hover:underline truncate"
                              dir="ltr"
                            >
                              {vendor.phone}
                            </a>
                          </div>
                        )}

                        {vendor.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <a 
                              href={`mailto:${vendor.email}`} 
                              className="font-mono text-slate-600 hover:text-slate-900 hover:underline truncate"
                              dir="ltr"
                            >
                              {vendor.email}
                            </a>
                          </div>
                        )}

                        {vendor.website && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <a 
                              href={vendor.website} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-600 hover:underline truncate font-mono text-[11px] inline-flex items-center gap-1"
                              dir="ltr"
                            >
                              <span>{vendor.website.replace('https://', '').replace('http://', '').replace('www.', '')}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Commercial Terms Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'شروط السداد:' : 'Payment:'}</span>
                          <span className="font-bold text-slate-800 truncate block" title={vendor.paymentTerms}>
                            {vendor.paymentTerms || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'متوسط التوريد:' : 'Lead Time:'}</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {vendor.leadTimeDaysAvg} {isAr ? 'يوم' : 'days'}
                          </span>
                        </div>
                        {vendor.taxNumber && (
                          <div>
                            <span className="text-slate-400 block">{isAr ? 'الرقم الضريبي:' : 'VAT No:'}</span>
                            <span className="font-mono text-slate-700 truncate block" title={vendor.taxNumber}>
                              {vendor.taxNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Categories Badges */}
                      {vendor.categories && vendor.categories.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {vendor.categories.map((catKey) => {
                            const info = INVENTORY_CATEGORIES_INFO[catKey];
                            return (
                              <span
                                key={catKey}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                  info ? info.color : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isAr ? info?.labelAr.split('(')[0] : info?.labelEn}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Notes */}
                      {vendor.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50/70 p-2 rounded-xl border border-slate-200/60 line-clamp-2">
                          {vendor.notes}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions on Card */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterByVendorId(vendor.id);
                          setActiveSubTab('ITEMS');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
                        title={isAr ? 'عرض الأصناف المسجلة بهذا المورد في المستودع' : 'Filter inventory by this vendor'}
                      >
                        <Boxes className="w-3.5 h-3.5" />
                        <span>{isAr ? `قطع المستودع (${linkedCount})` : `Stock Parts (${linkedCount})`}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingVendor(vendor)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title={isAr ? 'تعديل بيانات المورد' : 'Edit Vendor'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(isAr ? `هل أنت متأكد من حذف المورد "${vendor.nameAr}"؟` : `Delete vendor "${vendor.nameAr}"?`)) {
                              if (onDeleteVendor) onDeleteVendor(vendor.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title={isAr ? 'حذف المورد' : 'Delete Vendor'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD OR EDIT INVENTORY ITEM MODAL                                 */}
      {/* ========================================================================= */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingItem ? (isAr ? 'تعديل بيانات الصنف المخزني' : 'Edit Inventory Item') : (isAr ? 'إضافة صنف جديد للمستودع' : 'Add New Inventory Item')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAr ? 'تسجيل تفاصيل القطعة والمواصفات الفنية وموقع التخزين والحد الأدنى' : 'Specify part specifications, warehouse aisle, unit cost and threshold'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* SKU */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'كود الصنف الفريد (SKU) *' : 'Part SKU / Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. MOT-PMSM-1000"
                    className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'التصنيف المخزني *' : 'Category *'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    {Object.entries(INVENTORY_CATEGORIES_INFO).map(([key, info]) => (
                      <option key={key} value={key}>
                        {isAr ? info.labelAr : info.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name Arabic */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'اسم القطعة أو الصنف (بالعربية) *' : 'Part Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مثال: ماكينة جر بدون تروس متزامنة 1000 كجم"
                    className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Name English */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الاسم بالإنجليزية (English Name)' : 'Part Name (English)'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. PMSM Gearless Traction Hoist Machine 1000kg"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Specification */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'المواصفات الفنية المعتمدة' : 'Technical Specifications'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.specification}
                    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                    placeholder="6.7 kW, 1.6 m/s, 2:1 Roping, 410 Nm, 400V 3PH"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Quantity on Hand */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الرصيد المتاح حالياً بالمستودع *' : 'Quantity on Hand *'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.quantityOnHand}
                    onChange={(e) => setFormData({ ...formData, quantityOnHand: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Min Stock Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الحد الأدنى للتنبيه وإعادة الطلب *' : 'Min Stock Threshold *'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'وحدة القياس *' : 'Unit *'}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="pcs">قطعة (pcs)</option>
                    <option value="set">طقم / طاقم (set)</option>
                    <option value="meters">متر طولي (meters)</option>
                    <option value="pair">زوج (pair)</option>
                    <option value="box">علبة / صندوق (box)</option>
                    <option value="drum">برميل (drum)</option>
                    <option value="kg">كيلوجرام (kg)</option>
                  </select>
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'سعر التكلفة (ر.س) *' : 'Unit Cost (SAR) *'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'سعر البيع لقطع الغيار (ر.س)' : 'Selling Price (SAR)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.sellingPrice || 0}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Warehouse Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'موقع التخزين والرف' : 'Warehouse Aisle / Bin'}
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="مستودع الرياض - رف A-01"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Lead Time Days */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'فترة التوريد المتوقعة (أيام)' : 'Procurement Lead Time (Days)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.leadTimeDays}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
                    className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Supplier & Vendor Selector */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {isAr ? 'المورد أو الشركة المصنعة المعتمدة' : 'Supplier / Certified Manufacturer'}
                    </label>
                    {formData.vendorId && (
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {isAr ? 'مربوط بمورد معتمد' : 'Linked to Certified Vendor'}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vendors.length > 0 && (
                      <select
                        value={formData.vendorId || ''}
                        onChange={(e) => {
                          const vId = e.target.value;
                          const selectedV = vendors.find((v) => v.id === vId);
                          if (selectedV) {
                            setFormData({
                              ...formData,
                              vendorId: selectedV.id,
                              supplier: selectedV.nameAr || selectedV.nameEn,
                              leadTimeDays: selectedV.leadTimeDaysAvg || formData.leadTimeDays,
                            });
                          } else {
                            setFormData({ ...formData, vendorId: '' });
                          }
                        }}
                        className="text-xs font-semibold p-2.5 border border-indigo-300 bg-indigo-50/50 text-indigo-950 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">{isAr ? '⚡ اختيار مورد معتمد من الدليل...' : '⚡ Pick Certified Vendor...'}</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            [{v.code}] {v.nameAr} - {v.country} ({v.leadTimeDaysAvg} يوم)
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder={isAr ? 'أو أدخل اسم المورد يدوياً...' : 'Or type custom supplier name...'}
                      className="text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {editingItem ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة الصنف للمستودع' : 'Create Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK STOCK IN / OUT OPERATION MODAL                             */}
      {/* ========================================================================= */}
      {stockOpItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  stockOpItem.type === 'IN' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {stockOpItem.type === 'IN' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {stockOpItem.type === 'IN' ? (isAr ? 'توريد واستلام رصيد مخزني (Stock In)' : 'Receive Stock In (+)') : (isAr ? 'صرف وإخراج رصيد للمشروع (Stock Out)' : 'Issue Stock Out (-)')}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {stockOpItem.item.sku} - {stockOpItem.item.nameAr}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStockOpItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStockOp} className="space-y-3.5">
              {/* Current Quantity Info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">{isAr ? 'الرصيد المتاح الحالي بالمستودع:' : 'Current on hand:'}</span>
                <span className="font-mono font-black text-slate-800 text-sm">
                  {stockOpItem.item.quantityOnHand} {stockOpItem.item.unit}
                </span>
              </div>

              {/* Quantity to change */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {stockOpItem.type === 'IN' ? (isAr ? 'الكمية الموردة *' : 'Quantity Received *') : (isAr ? 'الكمية المصروفة *' : 'Quantity Issued *')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={stockOpItem.type === 'OUT' ? stockOpItem.item.quantityOnHand : 9999}
                    required
                    value={stockOpQty}
                    onChange={(e) => setStockOpQty(Number(e.target.value))}
                    className="flex-1 text-sm font-mono font-bold p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-500 font-mono px-3 py-2.5 bg-slate-100 rounded-xl border border-slate-200">
                    {stockOpItem.item.unit}
                  </span>
                </div>
              </div>

              {/* Reference Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'نوع المرجع / الغرض من الحركة' : 'Reference Type'}
                </label>
                <select
                  value={stockOpRefType}
                  onChange={(e) => setStockOpRefType(e.target.value as any)}
                  className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="PROJECT">{isAr ? 'مشروع وعرض سعر مصعد' : 'Project Quotation'}</option>
                  <option value="BREAKDOWN">{isAr ? 'بلاغ عطل وصيانة' : 'Maintenance Breakdown'}</option>
                  <option value="PURCHASE_ORDER">{isAr ? 'أمر شراء وتوريد' : 'Purchase Order'}</option>
                  <option value="MANUAL">{isAr ? 'تسوية يدوية' : 'Manual Operation'}</option>
                </select>
              </div>

              {/* Reference Selector */}
              {stockOpRefType === 'PROJECT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'اختر المشروع أو عرض السعر المرتبط' : 'Select Project'}
                  </label>
                  <select
                    value={stockOpRefId}
                    onChange={(e) => setStockOpRefId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">{isAr ? 'اختر مشروعاً...' : 'Select a project...'}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.quoteRef}>
                        {p.projectName} ({p.quoteRef}) - {p.clientName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {stockOpRefType === 'BREAKDOWN' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'اختر بلاغ العطل المرتبط' : 'Select Breakdown'}
                  </label>
                  <select
                    value={stockOpRefId}
                    onChange={(e) => setStockOpRefId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">{isAr ? 'اختر بلاغاً...' : 'Select a breakdown...'}</option>
                    {breakdowns.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.customerName} - {b.elevatorName} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات وتفاصيل السند' : 'Notes & Bill Details'}
                </label>
                <input
                  type="text"
                  value={stockOpNotes}
                  onChange={(e) => setStockOpNotes(e.target.value)}
                  placeholder={isAr ? 'رقم الفاتورة أو إذن التسليم...' : 'Invoice or delivery receipt ref...'}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockOpItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-colors cursor-pointer ${
                    stockOpItem.type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {stockOpItem.type === 'IN' ? (isAr ? 'تأكيد التوريد والإضافة' : 'Confirm Stock In') : (isAr ? 'تأكيد الصرف والإخراج' : 'Confirm Stock Out')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ITEM COMPLETE TRANSACTION & MOVEMENT HISTORY MODAL               */}
      {/* ========================================================================= */}
      {historyItem && (
        <ItemHistoryModal
          item={historyItem}
          movements={movements}
          language={language}
          onClose={() => setHistoryItem(null)}
          onStockIn={(it) => {
            setHistoryItem(null);
            setStockOpItem({ item: it, type: 'IN' });
            setStockOpQty(1);
            setStockOpRefType('PURCHASE_ORDER');
            setStockOpRefId('');
          }}
          onStockOut={(it) => {
            setHistoryItem(null);
            setStockOpItem({ item: it, type: 'OUT' });
            setStockOpQty(1);
            setStockOpRefType('PROJECT');
            setStockOpRefId(projects[0]?.quoteRef || '');
          }}
          onEditItem={(it) => {
            setHistoryItem(null);
            handleOpenEdit(it);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VENDOR PROFILE REGISTRATION & EDIT MODAL                         */}
      {/* ========================================================================= */}
      {(isVendorModalOpen || editingVendor) && (
        <VendorModal
          vendor={editingVendor}
          language={language}
          onClose={() => {
            setIsVendorModalOpen(false);
            setEditingVendor(null);
          }}
          onSave={(vendorData) => {
            if (editingVendor && onUpdateVendor) {
              onUpdateVendor({
                ...vendorData,
                id: editingVendor.id,
              });
              onShowToast(isAr ? 'تم حفظ تعديلات بيانات المورد بنجاح' : 'Vendor details updated successfully');
            } else if (onAddVendor) {
              onAddVendor(vendorData);
              onShowToast(isAr ? 'تم تسجيل المورد المعتمد بنجاح في الدليل' : 'New vendor registered successfully');
            }
            setIsVendorModalOpen(false);
            setEditingVendor(null);
          }}
        />
      )}
    </div>
  );
};
