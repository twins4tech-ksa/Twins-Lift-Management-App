import React, { useState, useMemo } from 'react';
import { AppLanguage } from '../utils/translations';
import { CompanySettings } from '../types/settings';
import { InventoryItem, PurchaseOrder, Vendor } from '../types/inventory';
import { UserProfile } from '../types/portal';
import { 
  Building2, 
  Package, 
  FileText, 
  Truck, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Inbox,
  DollarSign,
  Layers,
  Settings,
  ShieldCheck,
  Wrench,
  Send,
  Boxes,
  Phone,
  Mail,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface SupplierPortalViewProps {
  language: AppLanguage;
  companySettings?: CompanySettings;
  currentUser?: UserProfile | null;
  purchaseOrders?: PurchaseOrder[];
  inventory?: InventoryItem[];
  vendors?: Vendor[];
  onUpdatePOStatus?: (poId: string, newStatus: 'SENT' | 'PARTIAL' | 'RECEIVED') => void;
  onGoHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({
  language,
  companySettings,
  currentUser,
  purchaseOrders = [],
  inventory = [],
  vendors = [],
  onUpdatePOStatus,
  onGoHome,
  onNavigateTab,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'POS' | 'PARTS' | 'CERTIFICATES'>('POS');
  const [filterPOStatus, setFilterPOStatus] = useState<string>('ALL');

  // Supplier identification
  const currentVendor = useMemo(() => {
    return vendors[0] || {
      id: 'VND-TORIN',
      nameAr: 'شركة تورين درايف لأنظمة الجر والمحركات',
      nameEn: 'Torin Drive Co. International',
      code: 'TORIN',
      rating: 5,
      isApproved: true,
      leadTimeDaysAvg: 20,
      country: 'ألمانيا / الصين',
      paymentTerms: 'آجل 30 يوم (30 Days Net)',
    };
  }, [vendors]);

  // Filtered POs for this supplier
  const supplierPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (filterPOStatus !== 'ALL' && po.status !== filterPOStatus) return false;
      return true;
    });
  }, [purchaseOrders, filterPOStatus]);

  // Supplied Parts
  const suppliedParts = useMemo(() => {
    return inventory.filter(
      (item) => item.vendorId === currentVendor.id || 
               item.supplier.toLowerCase().includes(currentVendor.code.toLowerCase())
    );
  }, [inventory, currentVendor]);

  // Overall stats
  const stats = useMemo(() => {
    const totalPOs = purchaseOrders.length;
    const pendingPOs = purchaseOrders.filter((p) => p.status === 'SENT').length;
    const completedPOs = purchaseOrders.filter((p) => p.status === 'RECEIVED').length;
    const totalOrderValue = purchaseOrders.reduce((acc, p) => acc + p.totalAmount, 0);

    return {
      totalPOs,
      pendingPOs,
      completedPOs,
      totalOrderValue,
      suppliedPartsCount: suppliedParts.length,
    };
  }, [purchaseOrders, suppliedParts]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 text-right select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-950/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shadow-lg shrink-0">
              <Building2 className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  {currentVendor.code}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مورد معتمد رسمياً' : 'Authorized Supplier'}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {currentVendor.nameAr}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                {isAr 
                  ? 'بوابة المورد المعتمد لمتابعة أوامر الشراء، جداول مواعيد التوريد، وتأكيد شحن قطع الغيار'
                  : 'Supplier portal to track purchase orders, confirm delivery lead times and stock status'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
              <div className="text-[10px] text-indigo-200">{isAr ? 'تقييم الجودة' : 'Quality Rating'}</div>
              <div className="text-lg font-black text-amber-400 font-mono">5.0 ★</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
              <div className="text-[10px] text-indigo-200">{isAr ? 'شروط السداد' : 'Payment'}</div>
              <div className="text-xs font-bold text-white mt-1">{currentVendor.paymentTerms}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">
            {isAr ? 'إجمالي أوامر الشراء' : 'Total Purchase Orders'}
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.totalPOs}
          </div>
          <span className="text-[10px] text-slate-400">
            {isAr ? `${stats.completedPOs} مكتمل ومستلم` : `${stats.completedPOs} received`}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-700 block mb-1">
            {isAr ? 'طلبيات جاري تجهيزها' : 'Pending Orders'}
          </span>
          <div className="text-2xl font-black text-blue-600 font-mono">
            {stats.pendingPOs}
          </div>
          <span className="text-[10px] text-blue-600 font-semibold">
            {isAr ? 'بانتظار الشحن والتسليم' : 'Awaiting delivery'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 block mb-1">
            {isAr ? 'قيمة التوريدات الإجمالية' : 'Total PO Value'}
          </span>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {stats.totalOrderValue.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
          </div>
          <span className="text-[10px] text-emerald-600">
            {isAr ? 'شاملة ضريبة القيمة المضافة' : 'VAT included'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">
            {isAr ? 'الأصناف المعتمدة للتوريد' : 'Supplied Catalog Items'}
          </span>
          <div className="text-2xl font-black text-indigo-700 font-mono">
            {stats.suppliedPartsCount}
          </div>
          <span className="text-[10px] text-indigo-600">
            {isAr ? 'قطع غيار ومحركات معتمدة' : 'Certified parts'}
          </span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('POS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'POS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isAr ? 'أوامر الشراء والتوريد' : 'Purchase Orders'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">
            {supplierPOs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PARTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PARTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>{isAr ? 'الأصناف والمحركات المعتمدة' : 'Certified Parts Catalog'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
            {suppliedParts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CERTIFICATES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CERTIFICATES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'شهادات الاعتماد والمطابقة' : 'Certificates & Compliance'}</span>
        </button>
      </div>

      {/* 4. Tab 1: Purchase Orders */}
      {activeTab === 'POS' && (
        <div className="space-y-4">
          {supplierPOs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <div className="font-bold text-slate-700">
                {isAr ? 'لا توجد أوامر شراء صادرة حالياً' : 'No purchase orders found'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {supplierPOs.map((po) => {
                const isReceived = po.status === 'RECEIVED';
                return (
                  <div
                    key={po.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold font-mono border border-indigo-200">
                          PO
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-mono text-base font-black text-slate-900">
                              {po.poNumber}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              isReceived 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {isReceived ? (isAr ? 'تم الاستلام والتوريد' : 'Delivered & Received') : (isAr ? 'جاري التجهيز والشحن' : 'In Production / Transit')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{isAr ? `تاريخ الطلب: ${po.orderDate}` : `Ordered: ${po.orderDate}`}</span>
                            <span>•</span>
                            <span className="text-amber-700 font-semibold">
                              {isAr ? `تاريخ التسليم المتوقع: ${po.expectedDeliveryDate || 'قريباً'}` : `Expected: ${po.expectedDeliveryDate}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left font-mono" dir="ltr">
                        <div className="text-xs text-slate-400">Total Amount</div>
                        <div className="text-lg font-black text-indigo-700">
                          {po.totalAmount.toLocaleString()} SAR
                        </div>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-700 mb-2">
                        {isAr ? 'البنود المشمولة بأمر الشراء:' : 'Included line items:'}
                      </div>
                      <div className="space-y-1.5 divide-y divide-slate-200/60">
                        {po.items.map((it, idx) => (
                          <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-800">{isAr ? it.nameAr : it.nameEn}</span>
                              <span className="font-mono text-[10px] text-amber-700 mx-1.5">[{it.sku}]</span>
                            </div>
                            <div className="font-mono font-bold text-slate-700">
                              {it.quantityOrdered} {it.unit} × {it.unitCost.toLocaleString()} = {it.totalCost.toLocaleString()} ر.س
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Destination */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isAr ? `وجهة التوريد: ${po.deliveryLocation}` : `Destination: ${po.deliveryLocation}`}</span>
                      </div>

                      {!isReceived && onUpdatePOStatus && (
                        <button
                          type="button"
                          onClick={() => onUpdatePOStatus(po.id, 'RECEIVED')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تأكيد جاهزية الشحن والتسليم' : 'Confirm Dispatch'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Supplied Parts Catalog */}
      {activeTab === 'PARTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {isAr ? 'قائمة قطع الغيار والماكينات المعتمدة من هذا المورد' : 'Certified Supplied Parts Catalog'}
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              {suppliedParts.length} {isAr ? 'صنف معتمد' : 'parts'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right" dir={isAr ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">{isAr ? 'اسم الصنف والمواصفات' : 'Part Name & Spec'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'كود SKU' : 'SKU'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'فترة التوريد' : 'Lead Time'}</th>
                  <th className="py-2.5 px-3 text-left">{isAr ? 'سعر التوريد' : 'Supply Cost'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'المتاح بالمستودع' : 'Stock on Hand'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliedParts.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono text-slate-400">{index + 1}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900">{isAr ? item.nameAr : item.nameEn}</div>
                      <div className="text-[10px] text-slate-400">{item.specification}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                      {item.sku}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {item.leadTimeDays} {isAr ? 'يوم' : 'days'}
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-800">
                      {item.unitCost.toLocaleString()} ر.س
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                      {item.quantityOnHand} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Certificates & Compliance */}
      {activeTab === 'CERTIFICATES' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'شهادة مطابقة كود البناء السعودي (SASO)' : 'SASO Compliance Certificate'}
                </h4>
                <div className="text-xs text-slate-500 font-mono">SASO-EN81-20/50-2026</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr 
                ? 'شهادة الاعتماد الفني الرسمية الصادرة من الهيئة السعودية للمواصفات والمقاييس والجودة لمطابقة أنظمة الجر والأبواب لمعايير السلامة والأمان العالمية.'
                : 'Official SASO Certificate confirming full conformity with EN 81-20/50 elevator safety codes.'}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
              <span>{isAr ? 'الحالة: سارية المفعول حتى 2028' : 'Valid until 2028'}</span>
              <span className="px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-200">معتمد</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'شهادة نظام إدارة الجودة الدولية (ISO 9001:2015)' : 'ISO 9001:2015 Quality Management'}
                </h4>
                <div className="text-xs text-slate-500 font-mono">TUV-CERT-9001-ELV</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr 
                ? 'اعتماد الفحص والتصنيع بموجب شهادة الجودة الألمانية TÜV Rheinland للماكينات بدون تروس والأنظمة الهيدروليكية.'
                : 'International quality and manufacturing inspection certification under TÜV Rheinland Germany.'}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-bold">
              <span>{isAr ? 'الحالة: تدقيق سنوي معتمد' : 'Audited Annually'}</span>
              <span className="px-2 py-0.5 bg-blue-50 rounded-md border border-blue-200">TÜV معتمد</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
