import React, { useState, useMemo } from 'react';
import { AppLanguage } from '../utils/translations';
import { CompanySettings } from '../types/settings';
import { InventoryItem, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Vendor } from '../types/inventory';
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
  AlertTriangle,
  Printer,
  Plus,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  FileCheck2,
  ExternalLink,
  MessageSquare,
  QrCode,
  Tag,
  MapPin,
  ClipboardCheck,
  Download,
  Receipt,
  User
} from 'lucide-react';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';
import { sendWhatsAppMessage } from '../services/whatsappService';

interface SupplierPortalViewProps {
  language: AppLanguage;
  companySettings?: CompanySettings;
  currentUser?: UserProfile | null;
  purchaseOrders?: PurchaseOrder[];
  inventory?: InventoryItem[];
  vendors?: Vendor[];
  onUpdatePOStatus?: (poId: string, newStatus: PurchaseOrderStatus) => void;
  onAddPurchaseOrder?: (po: PurchaseOrder) => void;
  onAdjustStock?: (itemId: string, changeQty: number, type: 'IN' | 'OUT' | 'ADJUST' | 'RESERVE', meta: any) => void;
  onGoHome?: () => void;
  onNavigateTab?: (tab: string) => void;
  onShowToast?: (msg: string) => void;
}

// Supplier Financial Transaction interface
interface SupplierLedgerEntry {
  id: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT';
  reference: string;
  description: string;
  amount: number;
  paidAmount: number;
  balance: number;
  paymentMethod?: string;
  notes?: string;
}

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({
  language,
  companySettings = {} as CompanySettings,
  currentUser,
  purchaseOrders = [],
  inventory = [],
  vendors = [],
  onUpdatePOStatus,
  onAddPurchaseOrder,
  onAdjustStock,
  onGoHome,
  onNavigateTab,
  onShowToast = () => {}
}) => {
  const isAr = language === 'ar';

  // Active main tab inside Supplier Portal
  const [activeTab, setActiveTab] = useState<'POS' | 'STATEMENT' | 'PARTS' | 'CERTIFICATES' | 'GRN'>('POS');
  const [filterPOStatus, setFilterPOStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Vendor filter (Allows switching between vendors or viewing specific vendor)
  const [selectedVendorId, setSelectedVendorId] = useState<string>(() => {
    return vendors[0]?.id || 'VND-TORIN';
  });

  // Current active vendor data
  const currentVendor = useMemo(() => {
    return vendors.find(v => v.id === selectedVendorId) || vendors[0] || {
      id: 'VND-TORIN',
      nameAr: 'شركة تورين درايف لأنظمة الجر والمحركات',
      nameEn: 'Torin Drive Co. International',
      code: 'TORIN',
      contactPerson: 'م. تشن وي / م. طارق العسيري',
      phone: '+966 50 123 4567',
      email: 'orders@torindrive.com',
      country: 'ألمانيا / الصين',
      city: 'الرياض',
      categories: ['TRACTION_DRIVE'],
      paymentTerms: 'آجل 30 يوم (30 Days Net)',
      taxNumber: '300998877600003',
      rating: 5,
      isApproved: true,
      leadTimeDaysAvg: 18,
      address: 'المستودعات المركزية - طريق الخرج، الرياض'
    };
  }, [vendors, selectedVendorId]);

  // Modal States
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [selectedPOForPrint, setSelectedPOForPrint] = useState<PurchaseOrder | null>(null);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<PurchaseOrder | null>(null);
  const [isStatementPrintOpen, setIsStatementPrintOpen] = useState(false);

  // Form State: New Purchase Order
  const [newPoNumber, setNewPoNumber] = useState(`PO-2026-${String(purchaseOrders.length + 1045)}`);
  const [newPoDate, setNewPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPoDeliveryDate, setNewPoDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (currentVendor.leadTimeDaysAvg || 20));
    return d.toISOString().split('T')[0];
  });
  const [newPoLocation, setNewPoLocation] = useState('مستودع الرياض المركزي - باحة الاستلام A-01');
  const [newPoTerms, setNewPoTerms] = useState(currentVendor.paymentTerms || 'آجل 30 يوم');
  const [newPoNotes, setNewPoNotes] = useState('توريد بضاعة مطابقة لكود البناء السعودي SASO EN 81-20 مع شهادات المنشأ الأصلية.');
  const [newPoItems, setNewPoItems] = useState<PurchaseOrderItem[]>([
    {
      itemId: 'INV-DRV-01',
      sku: 'MOT-PMSM-1000',
      nameAr: 'ماكينة جر متزامنة بدون تروس (PMSM Gearless 1000kg)',
      nameEn: 'PMSM Permanent Magnet Synchronous Gearless Machine 1000kg',
      quantityOrdered: 2,
      quantityReceived: 0,
      unitCost: 7800,
      totalCost: 15600,
      unit: 'set'
    }
  ]);

  // Filtered POs for current supplier
  const supplierPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      // Match vendor
      const matchVendor = !selectedVendorId || po.vendorId === selectedVendorId || 
                          po.vendorCode?.toLowerCase() === currentVendor.code?.toLowerCase();
      if (!matchVendor) return false;

      // Status filter
      if (filterPOStatus !== 'ALL' && po.status !== filterPOStatus) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = po.poNumber.toLowerCase().includes(q);
        const matchItem = po.items.some(i => i.nameAr.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
        if (!matchNum && !matchItem) return false;
      }

      return true;
    });
  }, [purchaseOrders, selectedVendorId, currentVendor, filterPOStatus, searchQuery]);

  // Supplied Parts for current vendor
  const suppliedParts = useMemo(() => {
    return inventory.filter(
      (item) => item.vendorId === currentVendor.id || 
               item.supplier.toLowerCase().includes(currentVendor.code.toLowerCase()) ||
               item.supplier.toLowerCase().includes(currentVendor.nameAr.toLowerCase())
    );
  }, [inventory, currentVendor]);

  // Supplier Statement of Account Mock Data (linked to vendor POs)
  const supplierStatementLedger: SupplierLedgerEntry[] = useMemo(() => {
    const list: SupplierLedgerEntry[] = [];
    let runningBalance = 0;

    supplierPOs.forEach((po, index) => {
      runningBalance += po.totalAmount;
      list.push({
        id: `tx-inv-${po.id}`,
        date: po.orderDate,
        type: 'INVOICE',
        reference: po.poNumber,
        description: `أمر شراء وتوريد بضاعة (${po.items.length} بنود)`,
        amount: po.totalAmount,
        paidAmount: 0,
        balance: runningBalance,
        notes: po.deliveryLocation
      });

      // If received, simulate payment
      if (po.status === 'RECEIVED') {
        const payAmount = po.totalAmount;
        runningBalance -= payAmount;
        list.push({
          id: `tx-pay-${po.id}`,
          date: po.receivedDate || po.orderDate,
          type: 'PAYMENT',
          reference: `PAY-TRX-${1089 + index}`,
          description: `سداد مستحقات أمر الشراء ${po.poNumber}`,
          amount: 0,
          paidAmount: payAmount,
          balance: runningBalance,
          paymentMethod: 'حوالة بنكية سريعة (IBAN)',
          notes: 'مصرف الراجحي - تم التحويل'
        });
      }
    });

    return list;
  }, [supplierPOs]);

  // Overall financial summary for supplier
  const financialSummary = useMemo(() => {
    const totalOrdered = supplierPOs.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalReceived = supplierPOs.filter(p => p.status === 'RECEIVED').reduce((acc, p) => acc + p.totalAmount, 0);
    const pendingDeliveries = supplierPOs.filter(p => p.status !== 'RECEIVED' && p.status !== 'CANCELLED').reduce((acc, p) => acc + p.totalAmount, 0);
    const balanceDue = pendingDeliveries; // balance waiting for delivery & invoice

    return {
      totalOrdered,
      totalReceived,
      pendingDeliveries,
      balanceDue,
    };
  }, [supplierPOs]);

  // ==========================================
  // WHATSAPP GENERATION UTILITIES
  // ==========================================

  // 1. Send Purchase Order to Vendor via WhatsApp
  const handleSendPOWhatsApp = async (po: PurchaseOrder) => {
    const cleanPhone = (po.vendorPhone || currentVendor.phone || '').replace(/[^0-9]/g, '');
    
    const itemsListText = po.items.map((it, idx) => 
      `  ${idx + 1}. *${it.nameAr}* [${it.sku}]\n     الكمية: ${it.quantityOrdered} ${it.unit} | السعر: ${it.unitCost} ر.س | الإجمالي: ${it.totalCost} ر.س`
    ).join('\n');

    const message = isAr
      ? `🏢 *${companySettings.companyNameAr || 'شركة توينز للمصاعد المحدودة'}*\n` +
        `📦 *أمر شراء وتوريد رقم:* ${po.poNumber}\n` +
        `👤 *السادة المورد:* ${po.vendorName}\n` +
        `📅 *تاريخ الطلب:* ${po.orderDate}\n` +
        `⏱️ *تاريخ التسليم المتوقع:* ${po.expectedDeliveryDate || 'عاجل'}\n` +
        `📍 *مستودع التسليم:* ${po.deliveryLocation}\n\n` +
        `📋 *قائمة البنود المطلوبة:*\n${itemsListText}\n\n` +
        `💵 *المبلغ قبل الضريبة:* ${po.subtotal.toLocaleString()} ر.س\n` +
        `🧾 *ضريبة القيمة المضافة (15%):* ${po.vatAmount.toLocaleString()} ر.س\n` +
        `💰 *الإجمالي النهائي:* *${po.totalAmount.toLocaleString()} ر.س*\n` +
        `📄 *شروط السداد:* ${po.paymentTerms}\n\n` +
        `يرجى تأكيد استلام أمر الشراء وإشعارنا بموعد الشحن.`
      : `Purchase Order ${po.poNumber} from Twins Elevators. Total: ${po.totalAmount} SAR.`;

    const res = await sendWhatsAppMessage({
      mobile_no: cleanPhone,
      message,
      priority: 'high',
      source: 'twins-supplier-portal',
    });
    if (res.success) {
      onShowToast(isAr ? 'تم إرسال أمر الشراء إلى المورد عبر API الخاص بنا بنجاح ✅' : 'PO sent via our WhatsApp API successfully ✅');
    } else {
      onShowToast(res.error || (isAr ? 'تعذر الإرسال عبر API الواتساب' : 'Failed to send via WhatsApp API'));
    }
  };

  // 2. Send RFQ (Price / Stock Inquiry) via WhatsApp
  const handleSendRFQWhatsApp = async (item: InventoryItem) => {
    const cleanPhone = (currentVendor.phone || '').replace(/[^0-9]/g, '');
    const message = isAr
      ? `السلام عليكم ورحمة الله وبركاته،\n` +
        `السادة / *${currentVendor.nameAr}*\n\n` +
        `نرجو التكرم بموافاتنا بعرض سعر وتوفر الصنف التالي لمشاريع المصاعد لدينا:\n` +
        `🔹 *اسم الصنف:* ${item.nameAr}\n` +
        `🔹 *كود SKU:* ${item.sku}\n` +
        `🔹 *المواصفات الفنية:* ${item.specification}\n` +
        `🔹 *الكمية المقترحة:* 5 ${item.unit}\n` +
        `🔹 *موقع التسليم:* الرياض\n\n` +
        `شاكرين ومقدرين حسن تعاونكم الدائم.\n` +
        `*قسم المشتريات - شركة توينز للمصاعد*`
      : `Price and availability inquiry for SKU: ${item.sku}`;

    const res = await sendWhatsAppMessage({
      mobile_no: cleanPhone,
      message,
      priority: 'normal',
      source: 'twins-rfq',
    });
    if (res.success) {
      onShowToast(isAr ? 'تم إرسال طلب عرض السعر للمورد عبر API الخاص بنا بنجاح ✅' : 'RFQ sent via our WhatsApp API successfully ✅');
    } else {
      onShowToast(res.error || (isAr ? 'تعذر الإرسال عبر API الواتساب' : 'Failed to send via WhatsApp API'));
    }
  };

  // 3. Send Payment Confirmation Notification via WhatsApp
  const handleSendPaymentWhatsApp = async (tx: SupplierLedgerEntry) => {
    const cleanPhone = (currentVendor.phone || '').replace(/[^0-9]/g, '');
    const message = isAr
      ? `🏢 *شركة توينز للمصاعد المحدودة - الإدارة المالية*\n` +
        `إشعار سداد حوالة بنكية لمستحقات المورد:\n\n` +
        `👤 *المورد:* ${currentVendor.nameAr}\n` +
        `💵 *المبلغ المحول:* *${tx.paidAmount.toLocaleString()} ر.س*\n` +
        `📄 *المرجع:* ${tx.reference}\n` +
        `📅 *تاريخ الحوالة:* ${tx.date}\n` +
        `💳 *طريقة الدفع:* ${tx.paymentMethod || 'حوالة بنكية سريعة'}\n` +
        `📝 *البيان:* ${tx.description}\n\n` +
        `يرجى تأكيد وصول الحوالة ومطابقة كشف الحساب.`
      : `Payment Notification of ${tx.paidAmount} SAR for Ref: ${tx.reference}`;

    const res = await sendWhatsAppMessage({
      mobile_no: cleanPhone,
      message,
      priority: 'high',
      source: 'twins-finance',
    });
    if (res.success) {
      onShowToast(isAr ? 'تم إرسال إشعار السداد للمورد عبر API الخاص بنا بنجاح ✅' : 'Payment notice sent via our WhatsApp API successfully ✅');
    } else {
      onShowToast(res.error || (isAr ? 'تعذر الإرسال عبر API الواتساب' : 'Failed to send via WhatsApp API'));
    }
  };

  // ==========================================
  // PO Handlers & Actions
  // ==========================================

  // Add Item to new PO line
  const handleAddNewPOItem = () => {
    const firstPart = suppliedParts[0];
    setNewPoItems([
      ...newPoItems,
      {
        itemId: firstPart?.id || `inv-cust-${Date.now()}`,
        sku: firstPart?.sku || 'CUSTOM-SKU',
        nameAr: firstPart?.nameAr || 'صنف توريد جديد',
        nameEn: firstPart?.nameEn || 'New Supply Item',
        quantityOrdered: 1,
        quantityReceived: 0,
        unitCost: firstPart?.unitCost || 1000,
        totalCost: firstPart?.unitCost || 1000,
        unit: firstPart?.unit || 'set'
      }
    ]);
  };

  const handleUpdateNewPOItem = (index: number, field: keyof PurchaseOrderItem, val: any) => {
    const updated = [...newPoItems];
    const item = { ...updated[index], [field]: val };
    if (field === 'quantityOrdered' || field === 'unitCost') {
      item.totalCost = Number(item.quantityOrdered || 0) * Number(item.unitCost || 0);
    }
    updated[index] = item;
    setNewPoItems(updated);
  };

  const handleRemoveNewPOItem = (index: number) => {
    if (newPoItems.length <= 1) return;
    setNewPoItems(newPoItems.filter((_, i) => i !== index));
  };

  // Submit New Purchase Order
  const handleSavePurchaseOrder = () => {
    const subtotal = newPoItems.reduce((acc, it) => acc + (it.totalCost || 0), 0);
    const vatAmount = subtotal * 0.15;
    const totalAmount = subtotal + vatAmount;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: newPoNumber,
      vendorId: currentVendor.id,
      vendorName: currentVendor.nameAr,
      vendorCode: currentVendor.code,
      vendorEmail: currentVendor.email,
      vendorPhone: currentVendor.phone,
      orderDate: newPoDate,
      expectedDeliveryDate: newPoDeliveryDate,
      status: 'SENT',
      items: newPoItems,
      subtotal,
      vatRate: 15,
      vatAmount,
      totalAmount,
      paymentTerms: newPoTerms,
      deliveryLocation: newPoLocation,
      notes: newPoNotes,
      createdBy: currentUser?.name || 'إدارة المشتريات وسلاسل الإمداد'
    };

    if (onAddPurchaseOrder) {
      onAddPurchaseOrder(newPO);
    }
    setIsNewPOModalOpen(false);
    onShowToast(isAr ? `تم اعتماد أمر الشراء ${newPoNumber} بنجاح!` : `Purchase Order ${newPoNumber} created!`);
    setNewPoNumber(`PO-2026-${String(purchaseOrders.length + 1046)}`);
  };

  // Confirm goods receipt & update stock
  const handleConfirmGoodsReceipt = (po: PurchaseOrder) => {
    if (onUpdatePOStatus) {
      onUpdatePOStatus(po.id, 'RECEIVED');
    }

    // Auto-update warehouse inventory stock if handler provided
    if (onAdjustStock) {
      po.items.forEach(it => {
        onAdjustStock(it.itemId, it.quantityOrdered, 'IN', {
          referenceType: 'PURCHASE_ORDER',
          referenceId: po.poNumber,
          referenceLabel: `توريد واستلام أمر الشراء ${po.poNumber} من ${po.vendorName}`,
          notes: 'تم فحص الشحنة واجتياز مطابقة المواصفات القياسية'
        });
      });
    }

    setSelectedPOForGRN(null);
    onShowToast(isAr ? `تم تأكيد استلام الشحنة وإيداع البنود في المستودع بنجاح!` : `Goods received & inventory restocked!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header & Vendor Switcher Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/60">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-lg shrink-0">
              <Building2 className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  {currentVendor.code}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مورد معتمد رسمياً (SASO Certified)' : 'Authorized Supplier'}</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {currentVendor.country}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {currentVendor.nameAr}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-300 mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{currentVendor.contactPerson}</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <a href={`tel:${currentVendor.phone}`} className="hover:underline">{currentVendor.phone}</a>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-blue-300" />
                  <a href={`mailto:${currentVendor.email}`} className="hover:underline">{currentVendor.email}</a>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Vendor Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Vendor Switcher Dropdown */}
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15">
              <label className="text-[10px] text-indigo-200 font-bold block mb-1">
                {isAr ? 'تبديل المورد المعتمد النشط:' : 'Switch Supplier Profile:'}
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-indigo-400/30 focus:outline-hidden cursor-pointer"
              >
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.code} - {v.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNewPOModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إصدار أمر شراء (PO)' : 'New Purchase Order'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsStatementPrintOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة كشف الحساب' : 'Print Statement'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isAr ? 'إجمالي أوامر الشراء' : 'Total Orders'}</span>
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {supplierPOs.length}
            </div>
            <span className="text-[10px] text-slate-400">
              {isAr ? 'أوامر توريد معتمدة' : 'active orders'}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-blue-300 block mb-1 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>{isAr ? 'قيمة طلبيات قيد التجهيز' : 'In Transit / Pending'}</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-300 font-mono">
              <SarPrice amount={financialSummary.pendingDeliveries} />
            </div>
            <span className="text-[10px] text-blue-400">
              {isAr ? 'بانتظار وصول الشحنة' : 'awaiting delivery'}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-emerald-300 block mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'إجمالي ما تم استلامه' : 'Delivered & Received'}</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
              <SarPrice amount={financialSummary.totalReceived} />
            </div>
            <span className="text-[10px] text-emerald-400">
              {isAr ? 'تم إيداعها بالمستودع' : 'in warehouse stock'}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
            <span className="text-[11px] font-bold text-amber-300 block mb-1 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'أصناف معتمدة بالكتالوج' : 'Catalog Items'}</span>
            </span>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {suppliedParts.length}
            </div>
            <span className="text-[10px] text-amber-400">
              {isAr ? 'قطع غيار وماكينات' : 'approved components'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('POS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'POS'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'أوامر الشراء والتوريد (POs)' : 'Purchase Orders'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-mono border border-indigo-200">
              {supplierPOs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STATEMENT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'STATEMENT'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{isAr ? 'كشف الحساب والدفعات (Statement)' : 'Account Statement'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PARTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PARTS'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>{isAr ? 'كتالوج الأصناف والأسعار (BOM)' : 'Parts Catalog'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 font-mono border border-purple-200">
              {suppliedParts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CERTIFICATES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CERTIFICATES'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'شهادات الجودة والاعتمادات (SASO / ISO)' : 'Certificates'}</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث برقم الأمر أو الصنف...' : 'Search PO or part...'}
              className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {activeTab === 'POS' && (
            <select
              value={filterPOStatus}
              onChange={(e) => setFilterPOStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">{isAr ? 'كافة حالات الطلبيات' : 'All PO Statuses'}</option>
              <option value="SENT">{isAr ? 'بانتظار الشحن (Sent)' : 'Sent'}</option>
              <option value="RECEIVED">{isAr ? 'تم الاستلام (Received)' : 'Received'}</option>
            </select>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PURCHASE ORDERS (أوامر الشراء والتوريد)           */}
      {/* ======================================================== */}
      {activeTab === 'POS' && (
        <div className="space-y-4">
          {supplierPOs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <div className="font-bold text-slate-700 text-sm">
                {isAr ? 'لا توجد أوامر شراء مسجلة لهذا المورد حالياً' : 'No purchase orders found for this supplier'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'يمكنك إنشاء أمر شراء جديد بالنقر على زر «إصدار أمر شراء» أعلاه.' : 'Click "New Purchase Order" to create one.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {supplierPOs.map((po) => {
                const isReceived = po.status === 'RECEIVED';
                return (
                  <div
                    key={po.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
                  >
                    {/* PO Top Row */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold font-mono border border-indigo-200 text-base shadow-2xs">
                          PO
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-mono text-base font-black text-slate-900">
                              {po.poNumber}
                            </h3>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isReceived 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                : 'bg-blue-50 text-blue-700 border-blue-300'
                            }`}>
                              {isReceived ? (isAr ? 'تم التوريد والاستلام بالمستودع' : 'Delivered & Received') : (isAr ? 'جاري التجهيز والشحن' : 'In Production / Transit')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                            <span>{isAr ? `تاريخ الطلب: ${po.orderDate}` : `Date: ${po.orderDate}`}</span>
                            <span>•</span>
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{isAr ? `التسليم المتوقع: ${po.expectedDeliveryDate || 'خلال 15 يوم'}` : `Due: ${po.expectedDeliveryDate}`}</span>
                            </span>
                            <span>•</span>
                            <span className="text-slate-600">{po.deliveryLocation}</span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Amount */}
                      <div className="text-left font-mono" dir="ltr">
                        <div className="text-xs text-slate-400">Grand Total (incl. 15% VAT)</div>
                        <div className="text-xl font-black text-indigo-700">
                          <SarPrice amount={po.totalAmount} />
                        </div>
                      </div>
                    </div>

                    {/* Ordered Line Items Table */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-700 mb-2 flex items-center justify-between">
                        <span>{isAr ? 'البنود والقطع المشمولة بأمر التوريد:' : 'Ordered Line Items:'}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {po.items.length} {isAr ? 'أصناف' : 'items'}
                        </span>
                      </div>
                      <div className="space-y-2 divide-y divide-slate-200/60">
                        {po.items.map((it, idx) => (
                          <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs flex-wrap gap-2">
                            <div>
                              <span className="font-bold text-slate-900">{isAr ? it.nameAr : it.nameEn}</span>
                              <span className="font-mono text-[10px] text-amber-700 mx-2 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {it.sku}
                              </span>
                            </div>
                            <div className="font-mono font-bold text-slate-800">
                              {it.quantityOrdered} {it.unit} × <SarPrice amount={it.unitCost} /> = <SarPrice amount={it.totalCost} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar (Print & WhatsApp & Confirm Receipt) */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {/* 🖨️ PRINT PURCHASE ORDER */}
                        <button
                          type="button"
                          onClick={() => setSelectedPOForPrint(po)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>{isAr ? 'معاينة وطباعة أمر الشراء' : 'Print Official PO'}</span>
                        </button>

                        {/* 📱 WHATSAPP DISPATCH */}
                        <button
                          type="button"
                          onClick={() => handleSendPOWhatsApp(po)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-200 shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAr ? 'إرسال أمر الشراء عبر الواتساب' : 'Send via WhatsApp'}</span>
                        </button>
                      </div>

                      {/* Confirm Receipt & Restock Button */}
                      {!isReceived ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPOForGRN(po)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>{isAr ? 'فحص واستلام البضاعة بالمستودع' : 'Receive & Restock (GRN)'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isAr ? 'تم إيداع الشحنة في مخزون المستودع' : 'Stocked in Central Warehouse'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: STATEMENT OF ACCOUNT (كشف حساب المورد)            */}
      {/* ======================================================== */}
      {activeTab === 'STATEMENT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4 bg-slate-50/60">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isAr ? 'كشف الحساب والمطابقة المالية للمورد' : 'Supplier Financial Ledger & Statement'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr 
                  ? 'سجل التوريدات والفواتير وأوامر الشراء والحوالات البنكية الصادرة للمورد.'
                  : 'Track invoices, deliveries, and payment settlements.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStatementPrintOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة كشف الحساب الرسمي' : 'Print Statement'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right" dir={isAr ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3 px-4">{isAr ? 'نوع الحركة' : 'Type'}</th>
                  <th className="py-3 px-4">{isAr ? 'المرجع' : 'Reference'}</th>
                  <th className="py-3 px-4">{isAr ? 'البيان والتفاصيل' : 'Description'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'قيمة التوريد (SAR)' : 'Invoiced (SAR)'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'المسدد / المحول (SAR)' : 'Paid (SAR)'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'الرصيد التراكمي (SAR)' : 'Balance (SAR)'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierStatementLedger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      {isAr ? 'لا توجد حركات مالية مسجلة لهذا المورد' : 'No financial transactions recorded'}
                    </td>
                  </tr>
                ) : (
                  supplierStatementLedger.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-slate-600">{tx.date}</td>
                      <td className="py-3 px-4">
                        {tx.type === 'INVOICE' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {isAr ? 'فاتورة توريد' : 'Supply Invoice'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {isAr ? 'سداد وحوالة' : 'Payment'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{tx.reference}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{tx.description}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {tx.amount > 0 ? <SarPrice amount={tx.amount} /> : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                        {tx.paidAmount > 0 ? <SarPrice amount={tx.paidAmount} /> : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-indigo-700">
                        <SarPrice amount={tx.balance} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {tx.type === 'PAYMENT' && (
                          <button
                            type="button"
                            onClick={() => handleSendPaymentWhatsApp(tx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                            title={isAr ? 'إرسال إشعار سداد عبر الواتساب' : 'Send WhatsApp receipt'}
                          >
                            <Send className="w-3 h-3" />
                            <span>{isAr ? 'إشعار واتساب' : 'WhatsApp'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: APPROVED PARTS CATALOG (كتالوج الأصناف والأسعار)   */}
      {/* ======================================================== */}
      {activeTab === 'PARTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? `قائمة المكونات والماكينات المعتمدة من: ${currentVendor.nameAr}` : 'Certified Supplied Parts Catalog'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAr ? 'يمكنك إرسال طلب تسعير أو الاستفسار عن توفر أي صنف مباشرة للمورد عبر الواتساب.' : 'Request price quotes or stock availability via WhatsApp.'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              {suppliedParts.length} {isAr ? 'صنف معتمد' : 'parts'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right" dir={isAr ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">{isAr ? 'اسم الصنف والمواصفات' : 'Part Name & Spec'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'كود SKU' : 'SKU'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'فترة التوريد' : 'Lead Time'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'سعر التوريد' : 'Supply Cost'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'المتاح بالمستودع' : 'Stock on Hand'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'طلب تسعير واتساب' : 'WhatsApp RFQ'}</th>
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
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      <SarPrice amount={item.unitCost} />
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                      {item.quantityOnHand} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleSendRFQWhatsApp(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[10px] border border-emerald-200 transition-colors cursor-pointer"
                        title={isAr ? 'طلب تسعير واستفسار عبر الواتساب' : 'Inquire via WhatsApp'}
                      >
                        <Send className="w-3 h-3 text-emerald-600" />
                        <span>{isAr ? 'طلب تسعير' : 'Inquire'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: CERTIFICATES & COMPLIANCE (شهادات الجودة)         */}
      {/* ======================================================== */}
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

      {/* ======================================================== */}
      {/* MODAL 1: Create New Purchase Order (إصدار أمر شراء)     */}
      {/* ======================================================== */}
      {isNewPOModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-base">
                  {isAr ? 'إصدار أمر شراء وتوريد رسمي للمورد (Purchase Order)' : 'Issue New Purchase Order'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPOModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'رقم أمر الشراء (PO #)' : 'PO Number'}</label>
                  <input
                    type="text"
                    value={newPoNumber}
                    onChange={(e) => setNewPoNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'تاريخ الطلب' : 'Order Date'}</label>
                  <input
                    type="date"
                    value={newPoDate}
                    onChange={(e) => setNewPoDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'تاريخ التسليم المطلوب' : 'Due Date'}</label>
                  <input
                    type="date"
                    value={newPoDeliveryDate}
                    onChange={(e) => setNewPoDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-indigo-900 block">{currentVendor.nameAr}</span>
                  <span className="text-[11px] text-slate-500 font-mono">هاتف المورد: {currentVendor.phone} | بريد: {currentVendor.email}</span>
                </div>
                <span className="text-xs px-2.5 py-1 bg-white rounded-lg border border-indigo-200 font-bold text-indigo-700">
                  {currentVendor.code}
                </span>
              </div>

              {/* Items Line Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-900 text-sm">{isAr ? 'البنود والكميات المطلوبة:' : 'Line Items:'}</label>
                  <button
                    type="button"
                    onClick={handleAddNewPOItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة صنف' : 'Add Item'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newPoItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 items-center">
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          value={item.nameAr}
                          onChange={(e) => handleUpdateNewPOItem(idx, 'nameAr', e.target.value)}
                          placeholder={isAr ? 'اسم الصنف والمواصفة' : 'Item name'}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-xs"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="text"
                          value={item.sku}
                          onChange={(e) => handleUpdateNewPOItem(idx, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantityOrdered}
                          onChange={(e) => handleUpdateNewPOItem(idx, 'quantityOrdered', e.target.value)}
                          placeholder={isAr ? 'الكمية' : 'Qty'}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-mono text-xs font-bold"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => handleUpdateNewPOItem(idx, 'unitCost', e.target.value)}
                          placeholder={isAr ? 'السعر' : 'Cost'}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-mono text-xs font-bold"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveNewPOItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery and Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'مستودع ووجهة التسليم' : 'Delivery Destination'}</label>
                  <input
                    type="text"
                    value={newPoLocation}
                    onChange={(e) => setNewPoLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'شروط السداد المتفق عليها' : 'Payment Terms'}</label>
                  <input
                    type="text"
                    value={newPoTerms}
                    onChange={(e) => setNewPoTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Total Calculation Banner */}
              {(() => {
                const subtotal = newPoItems.reduce((acc, it) => acc + (it.totalCost || 0), 0);
                const vat = subtotal * 0.15;
                const grand = subtotal + vat;
                return (
                  <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block">{isAr ? 'المجموع قبل الضريبة:' : 'Subtotal:'} <SarPrice amount={subtotal} /></span>
                      <span className="text-indigo-300 block">{isAr ? 'ضريبة القيمة المضافة (15%):' : 'VAT 15%:'} <SarPrice amount={vat} /></span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">{isAr ? 'الإجمالي النهائي (SAR):' : 'Grand Total:'}</span>
                      <span className="text-lg font-black font-mono text-emerald-400"><SarPrice amount={grand} /></span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsNewPOModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSavePurchaseOrder}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                {isAr ? 'اعتماد وإصدار أمر الشراء' : 'Save & Issue PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Printable Purchase Order Sheet (طباعة أمر شراء) */}
      {/* ======================================================== */}
      {selectedPOForPrint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Action Bar */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs">{isAr ? 'معاينة أمر الشراء المعتمد' : 'Purchase Order Preview'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendPOWhatsApp(selectedPOForPrint)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إرسال واتساب' : 'WhatsApp'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة أمر الشراء' : 'Print PO'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPOForPrint(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Sheet */}
            <div className="p-8 space-y-6 text-slate-800 bg-white" id="official-po-print">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-indigo-900 pb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {companySettings.companyNameAr || 'شركة توينز للمصاعد المحدودة'}
                  </h2>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    {companySettings.companyNameEn || 'Twins Elevators & Escalators Co. Ltd.'}
                  </div>
                  <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                    <div>{isAr ? 'السجل التجاري:' : 'CR:'} <span className="font-mono font-bold">{companySettings.commercialRegistration || '1010889922'}</span></div>
                    <div>{isAr ? 'الرقم الضريبي (VAT):' : 'VAT No:'} <span className="font-mono font-bold text-slate-900">{companySettings.vatNumber || '300000000000003'}</span></div>
                    <div>{companySettings.addressAr || 'المملكة العربية السعودية - الرياض'}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="bg-indigo-900 text-white font-black text-xs px-4 py-1.5 rounded-lg uppercase tracking-wider inline-block">
                    {isAr ? 'أمر شراء وتوريد رسمي' : 'OFFICIAL PURCHASE ORDER'}
                  </div>
                  <div className="font-mono font-black text-indigo-900 text-base mt-2">{selectedPOForPrint.poNumber}</div>
                  <div className="text-xs text-slate-500 font-mono">{isAr ? 'تاريخ الطلب:' : 'Date:'} {selectedPOForPrint.orderDate}</div>
                  <div className="text-xs text-amber-700 font-bold mt-1">
                    {isAr ? 'التسليم المطلوب:' : 'Due:'} {selectedPOForPrint.expectedDeliveryDate}
                  </div>
                </div>
              </div>

              {/* Vendor & Delivery Box */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div className="font-bold text-slate-500 text-[11px] uppercase">{isAr ? 'بيانات المورد (Supplier):' : 'Supplier Details:'}</div>
                  <div className="font-black text-sm text-slate-900">{selectedPOForPrint.vendorName}</div>
                  <div><span className="text-slate-500">{isAr ? 'كود المورد:' : 'Code:'}</span> <strong className="font-mono">{selectedPOForPrint.vendorCode}</strong></div>
                  {selectedPOForPrint.vendorPhone && (
                    <div><span className="text-slate-500">{isAr ? 'الهاتف:' : 'Phone:'}</span> <span className="font-mono">{selectedPOForPrint.vendorPhone}</span></div>
                  )}
                  {selectedPOForPrint.vendorEmail && (
                    <div><span className="text-slate-500">{isAr ? 'البريد:' : 'Email:'}</span> <span>{selectedPOForPrint.vendorEmail}</span></div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-500 text-[11px] uppercase">{isAr ? 'وجهة التسليم والشروط:' : 'Delivery & Terms:'}</div>
                  <div><span className="text-slate-500">{isAr ? 'مستودع التسليم:' : 'Warehouse:'}</span> <strong className="text-slate-900">{selectedPOForPrint.deliveryLocation}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'شروط السداد:' : 'Payment Terms:'}</span> <strong>{selectedPOForPrint.paymentTerms}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'المعتمد من:' : 'Issued By:'}</span> <span>{selectedPOForPrint.createdBy}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right text-xs border border-slate-200">
                <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">{isAr ? 'كود الصنف' : 'SKU'}</th>
                    <th className="p-2.5">{isAr ? 'بيان الصنف والمواصفات' : 'Description'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'سعر الوحدة' : 'Unit Cost'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedPOForPrint.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2.5 text-center text-slate-500">{i + 1}</td>
                      <td className="p-2.5 font-mono text-amber-700 font-bold">{it.sku}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{isAr ? it.nameAr : it.nameEn}</td>
                      <td className="p-2.5 text-center font-bold">{it.quantityOrdered} {it.unit}</td>
                      <td className="p-2.5 text-center font-mono"><SarPrice amount={it.unitCost} /></td>
                      <td className="p-2.5 text-center font-mono font-black text-slate-900"><SarPrice amount={it.totalCost} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-between items-start pt-2">
                <div className="text-xs text-slate-500 max-w-sm">
                  <div className="font-bold text-slate-700 mb-1">{isAr ? 'ملاحظات والتزامات التوريد:' : 'Terms & Conditions:'}</div>
                  <div>{selectedPOForPrint.notes || 'يجب إرفاق شهادات المنشأ الأصلية وشهادات المطابقة لكود البناء السعودي SASO EN 81-20 مع بوليصة الشحن.'}</div>
                </div>

                <div className="w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'المجموع قبل الضريبة:' : 'Subtotal:'}</span>
                    <span className="font-mono font-bold"><SarPrice amount={selectedPOForPrint.subtotal} /></span>
                  </div>
                  <div className="flex justify-between text-purple-700 font-semibold">
                    <span>{isAr ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                    <span className="font-mono font-bold"><SarPrice amount={selectedPOForPrint.vatAmount} /></span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t-2 border-slate-300 pt-2 text-indigo-900">
                    <span>{isAr ? 'المجموع الإجمالي (SAR):' : 'Grand Total:'}</span>
                    <span className="font-mono text-indigo-800"><SarPrice amount={selectedPOForPrint.totalAmount} /></span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex items-end justify-between pt-8 border-t border-slate-300 text-xs">
                <div>
                  <div className="text-slate-500 text-[11px] mb-8">{isAr ? 'إدارة المشتريات وسلاسل الإمداد:' : 'Procurement Manager:'}</div>
                  <div className="border-b border-slate-300 w-40"></div>
                </div>
                <div className="text-center">
                  <div className="text-slate-500 text-[11px] mb-8">{isAr ? 'الختم الرسمي لشركة توينز:' : 'Company Official Seal:'}</div>
                  <div className="border-b border-slate-300 w-44 mx-auto"></div>
                </div>
                <div className="text-left">
                  <div className="text-slate-500 text-[11px] mb-8">{isAr ? 'اعتماد وقبول المورد:' : 'Supplier Acknowledgment:'}</div>
                  <div className="border-b border-slate-300 w-40"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Printable Supplier Statement of Account         */}
      {/* ======================================================== */}
      {isStatementPrintOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Action Bar */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs">{isAr ? 'معاينة كشف حساب المورد' : 'Supplier Statement Preview'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة كشف الحساب' : 'Print Statement'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsStatementPrintOpen(null as any)}
                  className="text-white/80 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Statement Sheet */}
            <div className="p-8 space-y-6 text-slate-800 bg-white" id="official-statement-print">
              <div className="flex items-start justify-between border-b-2 border-emerald-900 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {companySettings.companyNameAr || 'شركة توينز للمصاعد المحدودة'}
                  </h2>
                  <div className="text-xs text-slate-500 font-semibold">
                    {companySettings.companyNameEn || 'Twins Elevators & Escalators Co. Ltd.'}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {isAr ? 'الإدارة المالية - قسم حسابات الموردين' : 'Finance Dept - Accounts Payable'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="bg-emerald-900 text-white font-black text-xs px-4 py-1.5 rounded-lg uppercase tracking-wider inline-block">
                    {isAr ? 'كشف حساب ومطابقة رصيد مورد' : 'SUPPLIER STATEMENT OF ACCOUNT'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-2">{isAr ? 'تاريخ الاستخراج:' : 'Date:'} {new Date().toISOString().split('T')[0]}</div>
                </div>
              </div>

              {/* Vendor Info Box */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-xs flex justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">{isAr ? 'اسم المورد المعتمد:' : 'Supplier Name:'}</span>
                  <span className="font-black text-base text-slate-900">{currentVendor.nameAr}</span>
                  <div className="text-[11px] text-slate-600 font-mono mt-1">كود المورد: {currentVendor.code} | هاتف: {currentVendor.phone}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">{isAr ? 'الرصيد المتبقي المستحق (SAR):' : 'Balance Due:'}</span>
                  <span className="font-mono text-lg font-black text-emerald-800"><SarPrice amount={financialSummary.balanceDue} /></span>
                </div>
              </div>

              {/* Transactions Table */}
              <table className="w-full text-right text-xs border border-slate-200">
                <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-2.5">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="p-2.5">{isAr ? 'المرجع' : 'Reference'}</th>
                    <th className="p-2.5">{isAr ? 'البيان' : 'Description'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'قيمة الفاتورة' : 'Invoiced'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'المسدد / المحول' : 'Paid'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'الرصيد' : 'Balance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {supplierStatementLedger.map((tx, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-mono text-slate-600">{tx.date}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">{tx.reference}</td>
                      <td className="p-2.5 text-slate-800">{tx.description}</td>
                      <td className="p-2.5 text-center font-mono font-bold">{tx.amount > 0 ? <SarPrice amount={tx.amount} /> : '—'}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-700">{tx.paidAmount > 0 ? <SarPrice amount={tx.paidAmount} /> : '—'}</td>
                      <td className="p-2.5 text-center font-mono font-black text-slate-900"><SarPrice amount={tx.balance} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="flex items-end justify-between pt-8 border-t border-slate-300 text-xs">
                <div>
                  <div className="text-slate-500 text-[11px] mb-8">{isAr ? 'المحاسب المالي المسؤول:' : 'Accountant:'}</div>
                  <div className="border-b border-slate-300 w-40"></div>
                </div>
                <div className="text-center">
                  <div className="text-slate-500 text-[11px] mb-8">{isAr ? 'ختم الإدارة المالية:' : 'Finance Stamp:'}</div>
                  <div className="border-b border-slate-300 w-44 mx-auto"></div>
                </div>
                <div className="text-left">
                  <div className="text-slate-500 text-[11px] mb-8">{isAr ? 'مصادقة وتوقيع المورد:' : 'Supplier Confirmation:'}</div>
                  <div className="border-b border-slate-300 w-40"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Goods Receipt Note (محضر استلام وفحص بضاعة)    */}
      {/* ======================================================== */}
      {selectedPOForGRN && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {isAr ? 'محضر فحص واستلام شحنة بضاعة (GRN)' : 'Goods Receipt & Inspection Note'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPOForGRN(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="font-bold text-emerald-950 text-sm">{selectedPOForGRN.poNumber}</div>
                <div className="text-slate-600 mt-0.5">المورد: {selectedPOForGRN.vendorName}</div>
                <div className="text-slate-500 font-mono mt-1">مستودع الاستلام: {selectedPOForGRN.deliveryLocation}</div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-2">{isAr ? 'قائمة الفحص الفني ومطابقة الجودة:' : 'Quality & Inspection Checklist:'}</label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span>سلامة التغليف والصناديق الخشبية وخلوها من الكسر أو الرطوبة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span>مطابقة لوحة بيانات الماكينة (Nameplate): الفولتية 380V والحمولة وسرعة الدوران</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span>إرفاق شهادة الفحص المعملية الأصلية وكتالوج التوصيل والتشغيل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span>مطابقة الكميات الموردة فعلياً مع بنود أمر الشراء</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">{isAr ? 'البنود التي سيتم إيداعها بالمخزون:' : 'Items to Restock:'}</span>
                <div className="space-y-1">
                  {selectedPOForGRN.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between font-mono text-slate-700">
                      <span>{it.nameAr} [{it.sku}]</span>
                      <span className="font-bold text-emerald-700">+{it.quantityOrdered} {it.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPOForGRN(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmGoodsReceipt(selectedPOForGRN)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                {isAr ? 'تأكيد الاستلام وإيداع المخزون فوراً' : 'Confirm & Restock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
