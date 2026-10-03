import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  Truck, 
  Building2, 
  Calendar, 
  DollarSign, 
  Save, 
  Send,
  ArrowDownLeft,
  Share2,
  Loader2
} from 'lucide-react';
import { InventoryItem, PurchaseOrder, PurchaseOrderItem, Vendor } from '../types/inventory';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { TwinsLogo } from './TwinsLogo';
import { sendWhatsAppMessage } from '../services/whatsappService';

interface PurchaseOrderModalProps {
  po?: PurchaseOrder | null;
  vendors: Vendor[];
  inventory: InventoryItem[];
  preselectedItems?: { item: InventoryItem; suggestedQty: number }[];
  companySettings?: CompanySettings;
  language?: AppLanguage;
  onClose: () => void;
  onSavePO: (po: PurchaseOrder) => void;
  onReceivePO?: (po: PurchaseOrder) => void;
  onShowToast: (msg: string) => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  po,
  vendors,
  inventory,
  preselectedItems,
  companySettings,
  language = 'ar',
  onClose,
  onSavePO,
  onReceivePO,
  onShowToast,
}) => {
  const isAr = language === 'ar';
  const isEditing = Boolean(po);

  // Form State
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    po?.vendorId || vendors[0]?.id || ''
  );
  const [expectedDate, setExpectedDate] = useState<string>(
    po?.expectedDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [deliveryLocation, setDeliveryLocation] = useState<string>(
    po?.deliveryLocation || (isAr ? 'مستودع الرياض الرئيسي - حي السلي' : 'Riyadh Central Warehouse')
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    po?.paymentTerms || 'آجل 30 يوم (30 Days Net)'
  );
  const [notes, setNotes] = useState<string>(po?.notes || '');
  const [isSendingWa, setIsSendingWa] = useState(false);

  const handleSendPOWhatsApp = async () => {
    if (!currentVendor.phone) return;
    setIsSendingWa(true);
    const message = isAr
      ? `السلام عليكم ورحمة الله وبركاته،\nالسادة / *${currentVendor.nameAr}*\nنود تزويدكم بأمر الشراء رقم *${po?.poNumber || 'جديد'}* الصادر من شركة توينز للمصاعد بمبلغ إجمالي *${totalAmount.toLocaleString()} ر.س*.\nيرجى تأكيد التوريد وموعد الشحن.\nشاكرين ومقدرين حسن تعاونكم.`
      : `Hello ${currentVendor.nameEn || currentVendor.nameAr}, please find Purchase Order ${po?.poNumber || 'New'} with total amount ${totalAmount.toLocaleString()} SAR.`;

    const res = await sendWhatsAppMessage({
      mobile_no: currentVendor.phone,
      message,
      priority: 'high',
      source: 'twins-po',
    });
    setIsSendingWa(false);

    if (res.success) {
      onShowToast(isAr ? 'تم إرسال أمر الشراء إلى المورد عبر API الخاص بالنظام بنجاح ✅' : 'PO sent via our WhatsApp API successfully ✅');
    } else {
      onShowToast(res.error || (isAr ? 'تعذر الإرسال عبر API الواتساب' : 'Failed to send via WhatsApp API'));
    }
  };

  // Line items state
  const initialItems: PurchaseOrderItem[] = po
    ? po.items
    : preselectedItems && preselectedItems.length > 0
    ? preselectedItems.map((p) => ({
        itemId: p.item.id,
        sku: p.item.sku,
        nameAr: p.item.nameAr,
        nameEn: p.item.nameEn,
        quantityOrdered: p.suggestedQty,
        quantityReceived: 0,
        unitCost: p.item.unitCost,
        totalCost: p.suggestedQty * p.item.unitCost,
        unit: p.item.unit,
      }))
    : [
        {
          itemId: inventory[0]?.id || 'item-1',
          sku: inventory[0]?.sku || 'PRT-100',
          nameAr: inventory[0]?.nameAr || 'صنف',
          nameEn: inventory[0]?.nameEn || 'Item',
          quantityOrdered: 5,
          quantityReceived: 0,
          unitCost: inventory[0]?.unitCost || 500,
          totalCost: 5 * (inventory[0]?.unitCost || 500),
          unit: inventory[0]?.unit || 'pcs',
        },
      ];

  const [items, setItems] = useState<PurchaseOrderItem[]>(initialItems);

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + it.totalCost, 0);
  const vatRate = 15;
  const vatAmount = (subtotal * vatRate) / 100;
  const totalAmount = subtotal + vatAmount;

  const currentVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];

  const handleAddItem = () => {
    if (inventory.length === 0) return;
    const firstItem = inventory[0];
    const newItem: PurchaseOrderItem = {
      itemId: firstItem.id,
      sku: firstItem.sku,
      nameAr: firstItem.nameAr,
      nameEn: firstItem.nameEn,
      quantityOrdered: 1,
      quantityReceived: 0,
      unitCost: firstItem.unitCost,
      totalCost: firstItem.unitCost,
      unit: firstItem.unit,
    };
    setItems([...items, newItem]);
  };

  const handleItemChange = (index: number, itemId: string) => {
    const selected = inventory.find((i) => i.id === itemId);
    if (!selected) return;

    const next = [...items];
    next[index] = {
      ...next[index],
      itemId: selected.id,
      sku: selected.sku,
      nameAr: selected.nameAr,
      nameEn: selected.nameEn,
      unitCost: selected.unitCost,
      unit: selected.unit,
      totalCost: next[index].quantityOrdered * selected.unitCost,
    };
    setItems(next);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty);
    const next = [...items];
    next[index] = {
      ...next[index],
      quantityOrdered: validQty,
      totalCost: validQty * next[index].unitCost,
    };
    setItems(next);
  };

  const handleCostChange = (index: number, cost: number) => {
    const validCost = Math.max(0, cost);
    const next = [...items];
    next[index] = {
      ...next[index],
      unitCost: validCost,
      totalCost: next[index].quantityOrdered * validCost,
    };
    setItems(next);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      onShowToast(isAr ? 'يجب أن يحتوي أمر الشراء على صنف واحد على الأقل' : 'Must contain at least 1 item');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (status: 'DRAFT' | 'SENT') => {
    if (!currentVendor) {
      onShowToast(isAr ? 'يرجى اختيار مورد معتمد' : 'Please select a vendor');
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = po ? po.poNumber : `PO-${new Date().getFullYear()}-${randomSuffix}`;

    const newPO: PurchaseOrder = {
      id: po ? po.id : `po-${Date.now()}`,
      poNumber: orderNumber,
      vendorId: currentVendor.id,
      vendorName: currentVendor.nameAr,
      vendorCode: currentVendor.code,
      vendorEmail: currentVendor.email,
      vendorPhone: currentVendor.phone,
      orderDate: po ? po.orderDate : new Date().toISOString().split('T')[0],
      expectedDeliveryDate: expectedDate,
      receivedDate: po?.receivedDate,
      status: po ? po.status : status,
      items,
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      paymentTerms,
      deliveryLocation,
      notes,
      createdBy: isAr ? 'مسؤول المشتريات والمستودع' : 'Procurement Officer',
    };

    onSavePO(newPO);
    onShowToast(
      isAr 
        ? `تم حفظ أمر الشراء ${orderNumber} بنجاح` 
        : `Purchase Order ${orderNumber} saved successfully`
    );
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 text-right overflow-hidden flex flex-col max-h-[94vh]" 
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shadow-xs shrink-0">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {po ? (isAr ? `أمر شراء رقم ${po.poNumber}` : `Purchase Order ${po.poNumber}`) : (isAr ? 'إنشاء أمر شراء معتمد جديد (PO)' : 'New Purchase Order')}
                </h2>
                {po && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    po.status === 'SENT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {po.status === 'RECEIVED' ? (isAr ? 'تم الاستلام بالمستودع' : 'Received') :
                     po.status === 'SENT' ? (isAr ? 'مرسل للمورد' : 'Sent to Vendor') :
                     (isAr ? 'مسودة' : 'Draft')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr ? 'إصدار أمر توريد لقطع ومكونات المصاعد ومطابقة الأسعار والضريبة' : 'Issue procurement order with vendor details and VAT breakdown'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {po && (
              <button
                type="button"
                onClick={handlePrint}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                title={isAr ? 'طباعة' : 'Print'}
              >
                <Printer className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1 pl-1 [scrollbar-width:thin]">
          {/* Header Metadata Strip: Vendor, Date, Location, Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
            {/* Vendor Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                {isAr ? 'المورد المعتمد *' : 'Certified Vendor *'}
              </label>
              <select
                disabled={Boolean(po)}
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  const v = vendors.find((x) => x.id === e.target.value);
                  if (v?.paymentTerms) setPaymentTerms(v.paymentTerms);
                }}
                className="w-full font-bold p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.code}] {v.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                {isAr ? 'تاريخ التوريد المتوقع' : 'Expected Delivery Date'}
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full font-semibold p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Delivery Location */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                {isAr ? 'مستودع وموقع الاستلام' : 'Delivery Destination'}
              </label>
              <input
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                className="w-full font-semibold p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                {isAr ? 'شروط السداد والدفع' : 'Payment Terms'}
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full font-semibold p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {isAr ? 'الأصناف وقطع الغيار المطلوبة' : 'Ordered Line Items'}
              </span>
              {!po && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-xs border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة صنف آخر' : 'Add Item'}</span>
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-right" dir={isAr ? 'rtl' : 'ltr'}>
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3 min-w-[200px]">{isAr ? 'الصنف / كود SKU' : 'Item / SKU'}</th>
                    <th className="py-2.5 px-3 text-center w-28">{isAr ? 'الكمية المطلوبة' : 'Qty'}</th>
                    <th className="py-2.5 px-3 text-left w-32">{isAr ? 'سعر التكلفة (ر.س)' : 'Unit Cost (SAR)'}</th>
                    <th className="py-2.5 px-3 text-left w-32">{isAr ? 'إجمالي الصنف' : 'Total'}</th>
                    {!po && <th className="py-2.5 px-3 text-center w-12"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        {po ? (
                          <div>
                            <div className="font-bold text-slate-900">{isAr ? item.nameAr : item.nameEn}</div>
                            <div className="text-[10px] font-mono text-amber-700">{item.sku}</div>
                          </div>
                        ) : (
                          <select
                            value={item.itemId}
                            onChange={(e) => handleItemChange(idx, e.target.value)}
                            className="w-full p-1.5 font-bold border border-slate-300 rounded-lg text-xs bg-white"
                          >
                            {inventory.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                [{inv.sku}] {inv.nameAr}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {po ? (
                          <span className="font-mono font-black text-sm text-slate-900">
                            {item.quantityOrdered} {item.unit}
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min={1}
                              value={item.quantityOrdered}
                              onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                              className="w-16 p-1 border border-slate-300 rounded-lg font-mono font-bold text-center text-xs"
                            />
                            <span className="text-[10px] text-slate-400">{item.unit}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-left">
                        {po ? (
                          <span className="font-mono font-bold text-slate-800">
                            {item.unitCost.toLocaleString()}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            value={item.unitCost}
                            onChange={(e) => handleCostChange(idx, Number(e.target.value))}
                            className="w-24 p-1 border border-slate-300 rounded-lg font-mono font-bold text-left text-xs"
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono font-black text-slate-900">
                        {item.totalCost.toLocaleString()} ر.س
                      </td>
                      {!po && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary Strip */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 text-[11px]">
              <div>{isAr ? `إجمالي عدد البنود: ${items.length} صنف` : `Total items: ${items.length}`}</div>
              <div>{isAr ? 'شامل ضريبة القيمة المضافة 15% المعتمدة' : 'Includes 15% VAT'}</div>
            </div>

            <div className="space-y-1 text-left min-w-[220px]" dir="ltr">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal (المبلغ قبل الضريبة):</span>
                <span className="font-mono font-bold">{subtotal.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>VAT 15% (ضريبة القيمة المضافة):</span>
                <span className="font-mono font-bold text-amber-700">+{vatAmount.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black border-t border-slate-200 pt-1 text-sm">
                <span>Grand Total (الإجمالي النهائي):</span>
                <span className="font-mono text-indigo-700">{totalAmount.toLocaleString()} SAR</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'ملاحظات وشروط خاصة بأمر التوريد:' : 'PO Terms & Special Notes:'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAr ? 'مثال: يلزم تسليم شهادات الفحص ومطابقة SASO مع الشحنة...' : 'e.g. SASO compliance certificates required...'}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {po && po.status !== 'RECEIVED' && onReceivePO && (
              <button
                type="button"
                onClick={() => {
                  onReceivePO(po);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{isAr ? 'استلام البضاعة وتوريدها للمستودع' : 'Receive into Stock'}</span>
              </button>
            )}

            {currentVendor.phone && (
              <button
                type="button"
                onClick={handleSendPOWhatsApp}
                disabled={isSendingWa}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                title={isAr ? 'إرسال أمر الشراء عبر API الواتساب المعتمد' : 'Send PO via Official WhatsApp API'}
              >
                {isSendingWa ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                <span>{isAr ? 'إرسال بالواتساب (API)' : 'Send via WA API'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>

            {!po && (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit('DRAFT')}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  {isAr ? 'حفظ كمسودة' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('SENT')}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isAr ? 'اعتماد وإرسال للمورد' : 'Issue & Send PO'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
