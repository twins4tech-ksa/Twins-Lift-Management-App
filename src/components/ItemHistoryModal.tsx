import React, { useState, useMemo } from 'react';
import { 
  X, 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  Package, 
  Tag, 
  MapPin, 
  Truck, 
  Calendar, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Boxes,
  Plus,
  Edit,
  Building2,
  Bookmark
} from 'lucide-react';
import { InventoryItem, InventoryMovement, INVENTORY_CATEGORIES_INFO } from '../types/inventory';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';

export interface ItemHistoryModalProps {
  item: InventoryItem | null;
  movements: InventoryMovement[];
  language: AppLanguage;
  onClose: () => void;
  onStockIn: (item: InventoryItem) => void;
  onStockOut: (item: InventoryItem) => void;
  onEditItem?: (item: InventoryItem) => void;
}

export const ItemHistoryModal: React.FC<ItemHistoryModalProps> = ({
  item,
  movements,
  language,
  onClose,
  onStockIn,
  onStockOut,
  onEditItem,
}) => {
  const isAr = language === 'ar';
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!item) return null;

  const categoryInfo = INVENTORY_CATEGORIES_INFO[item.category];

  // Movements specifically for this item
  const itemMovements = useMemo(() => {
    return movements.filter(
      (m) => m.itemId === item.id || m.sku === item.sku
    );
  }, [movements, item.id, item.sku]);

  // Statistics calculation for this item
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalAdjust = 0;
    let totalReserved = item.quantityReserved || 0;

    itemMovements.forEach((m) => {
      if (m.type === 'IN') totalIn += m.quantity;
      if (m.type === 'OUT') totalOut += m.quantity;
      if (m.type === 'ADJUST') totalAdjust += m.quantity;
    });

    const isLow = item.quantityOnHand <= item.minStockLevel;
    const isZero = item.quantityOnHand <= 0;
    const totalValuation = item.quantityOnHand * item.unitCost;

    return {
      totalIn,
      totalOut,
      totalAdjust,
      totalReserved,
      isLow,
      isZero,
      totalValuation,
      totalMovementsCount: itemMovements.length,
      lastDate: itemMovements.length > 0 ? itemMovements[0].date : item.lastRestockedAt || '-',
    };
  }, [itemMovements, item]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return itemMovements.filter((m) => {
      if (filterType !== 'ALL' && m.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = (m.referenceLabel || '').toLowerCase().includes(q);
        const matchId = (m.referenceId || '').toLowerCase().includes(q);
        const matchNote = (m.notes || '').toLowerCase().includes(q);
        const matchActor = (m.performedBy || '').toLowerCase().includes(q);
        if (!matchRef && !matchId && !matchNote && !matchActor) {
          return false;
        }
      }
      return true;
    });
  }, [itemMovements, filterType, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 text-right overflow-hidden flex flex-col max-h-[92vh]" 
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* 1. Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-xs shrink-0 mt-0.5">
              <History className="w-6 h-6 text-blue-600" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300">
                  {item.sku}
                </span>

                {categoryInfo && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${categoryInfo.color}`}>
                    {isAr ? categoryInfo.labelAr : categoryInfo.labelEn}
                  </span>
                )}

                {stats.isZero ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                    {isAr ? 'رصيد نافد بالكامل (0)' : 'Out of Stock (0)'}
                  </span>
                ) : stats.isLow ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                    {isAr ? `نواقص: متبقي ${item.quantityOnHand} فقط` : `Low: ${item.quantityOnHand} remaining`}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {isAr ? 'متوفر ومستقر' : 'In Stock'}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {isAr ? item.nameAr : item.nameEn}
              </h2>

              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5" title={item.specification}>
                {item.specification || (isAr ? 'لا توجد مواصفات فنية إضافية' : 'No technical specifications')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Item Location, Vendor & Pricing Info Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
              {isAr ? 'الموقع بالمستودع:' : 'Warehouse Location:'}
            </span>
            <div className="flex items-center gap-1 font-bold text-slate-800 truncate" title={item.location}>
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.location || (isAr ? 'المستودع المركزي' : 'Central Warehouse')}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
              {isAr ? 'المورد المعتمد:' : 'Supplier / Vendor:'}
            </span>
            <div className="flex items-center gap-1 font-bold text-slate-800 truncate" title={item.supplier}>
              <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.supplier || (isAr ? 'مورد معتمد' : 'Vendor')}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
              {isAr ? 'سعر التكلفة للوحدة:' : 'Unit Cost:'}
            </span>
            <span className="font-mono font-bold text-slate-900">
              {item.unitCost.toLocaleString()} ر.س
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
              {isAr ? 'سعر بيع قطع الغيار:' : 'Selling Price:'}
            </span>
            <span className="font-mono font-bold text-emerald-700">
              {(item.sellingPrice || Math.round(item.unitCost * 1.35)).toLocaleString()} ر.س
            </span>
          </div>
        </div>

        {/* 3. Lifecycle KPI Cards for This Item */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          {/* Physical Stock */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 block">
              {isAr ? 'الرصيد المتاح الفعلي' : 'Current on Hand'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-black font-mono ${stats.isZero ? 'text-rose-600' : stats.isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                {item.quantityOnHand}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{item.unit}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {isAr ? `حد الأمان: ${item.minStockLevel}` : `Min threshold: ${item.minStockLevel}`}
            </span>
          </div>

          {/* Total In */}
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-800 block">
              {isAr ? 'إجمالي الوارد والتوريد (+)' : 'Total Received (IN)'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-emerald-700">
                +{stats.totalIn}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">{item.unit}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
              {isAr ? 'من أوامر الشراء' : 'from purchase orders'}
            </span>
          </div>

          {/* Total Out */}
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-800 block">
              {isAr ? 'إجمالي المنصرف (-)' : 'Total Issued (OUT)'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-amber-700">
                -{stats.totalOut}
              </span>
              <span className="text-xs text-amber-600 font-semibold">{item.unit}</span>
            </div>
            <span className="text-[10px] text-amber-700 font-mono block mt-0.5">
              {isAr ? 'للمشاريع وبلاغات الأعطال' : 'for lifts & repairs'}
            </span>
          </div>

          {/* Net Valuation */}
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 shadow-2xs">
            <span className="text-[10px] font-bold text-blue-800 block">
              {isAr ? 'قيمة الرصيد الحالي' : 'Stock Valuation'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black font-mono text-blue-800">
                {stats.totalValuation.toLocaleString()}
              </span>
              <span className="text-xs text-blue-600 font-semibold">ر.س</span>
            </div>
            <span className="text-[10px] text-blue-700 font-mono block mt-0.5">
              {itemMovements.length} {isAr ? 'حركة مسجلة' : 'movements'}
            </span>
          </div>
        </div>

        {/* 4. Movements Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700 ml-1">
              {isAr ? 'تصفية الحركات:' : 'Filter Movements:'}
            </span>

            {['ALL', 'IN', 'OUT', 'RESERVE', 'ADJUST'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterType === type
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'ALL' && (isAr ? 'الكل' : 'All')}
                {type === 'IN' && (isAr ? 'توريد (IN)' : 'Stock In')}
                {type === 'OUT' && (isAr ? 'صرف (OUT)' : 'Stock Out')}
                {type === 'RESERVE' && (isAr ? 'حجز لمشروع' : 'Reserve')}
                {type === 'ADJUST' && (isAr ? 'تسوية' : 'Adjust')}
              </button>
            ))}
          </div>

          {/* Quick search input */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالمرجع أو الملاحظات...' : 'Search ref or note...'}
              className="w-full pl-7 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute top-2 right-2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-2 left-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 5. Movements Chronological Table / List */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl [scrollbar-width:thin]">
          {filteredMovements.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">
                {isAr ? 'لا توجد حركات مطابقة لهذا الصنف' : 'No movements found for this item'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr ? 'يمكنك تسجيل أول حركة توريد أو صرف باستخدام الأزرار أدناه' : 'Record a movement using the actions below'}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs text-right" dir={isAr ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">{isAr ? 'التاريخ والتوقيت' : 'Date & Time'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'نوع الحركة' : 'Type'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'الرصيد قبل/بعد' : 'Prev -> New'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'نوع المرجع والبيان' : 'Reference & Note'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'المنفذ / المسؤول' : 'Actor'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((mov, index) => {
                  const isPositive = mov.type === 'IN';
                  const isNegative = mov.type === 'OUT';

                  return (
                    <tr key={mov.id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{index + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                        {mov.date}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {mov.type === 'IN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            <span>{isAr ? 'توريد واستلام' : 'Stock In'}</span>
                          </span>
                        )}
                        {mov.type === 'OUT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            <ArrowUpRight className="w-3 h-3 text-amber-600" />
                            <span>{isAr ? 'صرف وإخراج' : 'Stock Out'}</span>
                          </span>
                        )}
                        {mov.type === 'RESERVE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                            <Bookmark className="w-3 h-3 text-blue-600" />
                            <span>{isAr ? 'حجز لمشروع' : 'Reserve'}</span>
                          </span>
                        )}
                        {mov.type === 'ADJUST' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                            <RotateCcw className="w-3 h-3 text-purple-600" />
                            <span>{isAr ? 'تسوية جردية' : 'Adjust'}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-black text-sm whitespace-nowrap">
                        <span className={isPositive ? 'text-emerald-700' : isNegative ? 'text-amber-700' : 'text-slate-800'}>
                          {isPositive ? `+${mov.quantity}` : isNegative ? `-${mov.quantity}` : mov.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal mx-0.5">{item.unit}</span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                        <span className="text-slate-500">{mov.previousQty}</span>
                        <span className="text-slate-400 mx-1">➔</span>
                        <span className="font-bold text-slate-900">{mov.newQty}</span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">
                          {mov.referenceLabel || mov.referenceId || (isAr ? 'عملية مخزنية' : 'Stock op')}
                        </div>
                        {mov.notes && (
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1" title={mov.notes}>
                            {mov.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                        {mov.performedBy || (isAr ? 'مسؤول المستودع' : 'Admin')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 6. Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {/* Quick Stock In (+) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onStockIn(item);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{isAr ? 'توريد رصيد جديد (+)' : 'Stock In (+)'}</span>
            </button>

            {/* Quick Stock Out (-) */}
            <button
              type="button"
              disabled={item.quantityOnHand <= 0}
              onClick={() => {
                onClose();
                onStockOut(item);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{isAr ? 'صرف رصيد (-)' : 'Stock Out (-)'}</span>
            </button>

            {/* Edit Item */}
            {onEditItem && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditItem(item);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'تعديل بيانات الصنف' : 'Edit Item'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
