import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  Boxes, 
  ArrowRight, 
  ArrowLeft,
  X, 
  MapPin, 
  Truck,
  PackageX,
  ExternalLink
} from 'lucide-react';
import { InventoryItem, INVENTORY_CATEGORIES_INFO } from '../types/inventory';
import { AppLanguage } from '../utils/translations';

export interface NavbarInventoryAlertProps {
  inventory: InventoryItem[];
  language: AppLanguage;
  onNavigateToInventory: () => void;
  className?: string;
}

export const NavbarInventoryAlert: React.FC<NavbarInventoryAlertProps> = ({
  inventory,
  language,
  onNavigateToInventory,
  className = '',
}) => {
  const isAr = language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items with quantity on hand at or below the minimum stock level threshold
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.quantityOnHand <= item.minStockLevel);
  }, [inventory]);

  const count = lowStockItems.length;

  // Out of stock count (0 on hand)
  const outOfStockCount = useMemo(() => {
    return lowStockItems.filter((item) => item.quantityOnHand <= 0).length;
  }, [lowStockItems]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // If there are no low stock items, hide the alert
  if (count === 0) {
    return null;
  }

  const handleOpenWarehouse = () => {
    setIsOpen(false);
    onNavigateToInventory();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Automated Visual Alert Trigger Button - Pulses Red */}
      <button
        id="navbar-inventory-low-stock-alert"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={
          isAr
            ? `تنبيه المخزون: يوجد ${count} صنف أقل من الحد الأدنى`
            : `Inventory Alert: ${count} item(s) below minimum stock level`
        }
        title={
          isAr
            ? `تنبيه فوري: يوجد ${count} أصناف تحت حد الطلب الأدنى بالمستودع - انقر للتفاصيل`
            : `Immediate Alert: ${count} items below minimum reorder point - Click for details`
        }
        className="relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/80 shadow-[0_0_14px_rgba(244,63,94,0.45)] transition-all duration-200 cursor-pointer select-none group focus:outline-hidden"
      >
        {/* Pulsing Beacon / Radar Ring */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-90"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-xs"></span>
        </span>

        {/* Pulsing Alert Icon */}
        <div className="relative animate-pulse shrink-0">
          <AlertTriangle className="w-4 h-4 text-rose-400 drop-shadow-sm" />
        </div>

        {/* Counter Badge */}
        <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded-md bg-rose-600 text-white shadow-2xs leading-none">
          {count}
        </span>

        {/* Responsive Text Label */}
        <span className="hidden md:inline-block text-xs font-bold text-rose-100 whitespace-nowrap">
          {isAr ? 'نواقص بالمستودع' : 'Low Stock'}
        </span>

        {outOfStockCount > 0 && (
          <span className="hidden lg:inline-block text-[10px] font-semibold text-rose-300/90 whitespace-nowrap">
            ({outOfStockCount} {isAr ? 'نفد' : 'out'})
          </span>
        )}
      </button>

      {/* Floating Low-Stock Preview Popover */}
      {isOpen && (
        <div
          id="navbar-inventory-alert-popover"
          className={`absolute top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-white text-slate-800 shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isAr ? 'left-0 sm:left-auto sm:right-0 text-right' : 'right-0 sm:right-auto sm:left-0 text-left'
          }`}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Popover Header */}
          <div className="p-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">
                  {isAr ? 'تنبيه النواقص ومستوى إعادة الطلب' : 'Low Stock Reorder Alert'}
                </h4>
                <p className="text-[10px] text-rose-100 font-medium">
                  {isAr
                    ? `${count} أصناف بحاجة لإعادة الشراء والتوريد فوراً`
                    : `${count} item(s) need immediate procurement`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-rose-100 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="px-3 py-2 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-rose-900">
              {outOfStockCount > 0 ? (
                <span className="flex items-center gap-1 font-bold text-rose-700">
                  <PackageX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{outOfStockCount} {isAr ? 'أصناف رصيدها صفر (نفدت)' : 'items out of stock (0)'}</span>
                </span>
              ) : (
                <span className="text-slate-600">
                  {isAr ? 'جميع الأصناف تحت حد الأمان' : 'All items below safety buffer'}
                </span>
              )}
            </span>

            <span className="font-mono font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200">
              {lowStockItems.length} {isAr ? 'أصناف' : 'items'}
            </span>
          </div>

          {/* Items List (Scrollable, max 5 preview items) */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 [scrollbar-width:thin]">
            {lowStockItems.slice(0, 6).map((item) => {
              const isZero = item.quantityOnHand <= 0;
              const catInfo = INVENTORY_CATEGORIES_INFO[item.category];

              return (
                <div
                  key={item.id}
                  className="p-3 hover:bg-slate-50 transition-colors flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.sku}
                        </span>
                        {catInfo && (
                          <span className="text-[9px] font-semibold text-slate-500">
                            {isAr ? catInfo.labelAr.split('(')[0] : catInfo.labelEn}
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                        {isAr ? item.nameAr : item.nameEn}
                      </h5>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          isZero
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isZero ? (
                          <>
                            <PackageX className="w-3 h-3 text-rose-600" />
                            <span>{isAr ? 'نفد (0)' : 'Out (0)'}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{item.quantityOnHand} / {item.minStockLevel} {item.unit}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Location & Supplier meta */}
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location || (isAr ? 'المستودع الرئيسي' : 'Central Warehouse')}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 font-medium">
                      <Truck className="w-3 h-3 text-slate-400" />
                      <span>{item.supplier || (isAr ? 'مورد معتمد' : 'Vendor')}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {lowStockItems.length > 6 && (
              <div className="p-2 text-center text-xs font-bold text-slate-500 bg-slate-50">
                + {lowStockItems.length - 6} {isAr ? 'أصناف أخرى مسجلة بحاجة لتوريد' : 'more items needing restock'}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              {isAr ? 'انتقل للمستودع لتسجيل التوريد' : 'Open warehouse to restock'}
            </span>

            <button
              type="button"
              onClick={handleOpenWarehouse}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>{isAr ? 'فتح المستودع والمخزون' : 'Go to Warehouse'}</span>
              {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
