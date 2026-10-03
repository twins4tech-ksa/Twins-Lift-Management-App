import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Building2, 
  User, 
  QrCode, 
  Download, 
  Trash2, 
  Send,
  Eye,
  Check,
  ChevronDown
} from 'lucide-react';
import { Invoice, ReceiptVoucher, InvoiceItem, InvoiceType, InvoiceCategory, InvoiceStatus, PaymentMethod } from '../types/finance';
import { MaintenanceContract } from '../types/maintenance';
import { ElevatorSpecification, Customer } from '../types/elevator';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol, SarPrice } from './SaudiRiyalSymbol';
import { generateZatcaQrDataUrl } from '../utils/zatcaQr';

interface FinanceInvoicesViewProps {
  contracts: MaintenanceContract[];
  projects: ElevatorSpecification[];
  customers: Customer[];
  companySettings: CompanySettings;
  language: AppLanguage;
  onShowToast?: (msg: string) => void;
}

const LOCAL_STORAGE_INVOICES_KEY = 'twins_elevators_invoices_v1';
const LOCAL_STORAGE_VOUCHERS_KEY = 'twins_elevators_vouchers_v1';

export const FinanceInvoicesView: React.FC<FinanceInvoicesViewProps> = ({
  contracts,
  projects,
  customers,
  companySettings,
  language,
  onShowToast = () => {}
}) => {
  const isAr = language === 'ar';

  // Active view: 'INVOICES' or 'VOUCHERS'
  const [activeSubTab, setActiveSubTab] = useState<'INVOICES' | 'VOUCHERS'>('INVOICES');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Stored Invoices & Vouchers state with initial seed
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_INVOICES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }

    // Default realistic seed invoices from existing contracts & projects
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'inv-seed-1',
        invoiceNumber: 'INV-2026-0081',
        type: 'TAX_INVOICE',
        category: 'MAINTENANCE_CONTRACT',
        date: '2026-09-15',
        dueDate: '2026-10-15',
        customerId: customers[0]?.id || 'cust-1',
        customerName: customers[0]?.name || 'شركة الأندلس العقارية',
        customerTaxNumber: '310123456700003',
        customerAddress: 'الرياض - طريق الملك فهد',
        customerPhone: '+966 50 111 2233',
        contractRef: contracts[0]?.contractRef || 'MNT-2025-001',
        items: [
          {
            id: 'item-1',
            description: 'عقد صيانة وقائية سنوي لمصعد الركاب MRL (الدفعة الأولى)',
            quantity: 1,
            unit: 'عقد',
            unitPrice: 6000,
            subtotal: 6000,
            vatRate: 0.15,
            vatAmount: 900,
            totalWithVat: 6900
          }
        ],
        subtotal: 6000,
        taxableAmount: 6000,
        vatRate: 0.15,
        vatAmount: 900,
        totalAmount: 6900,
        paidAmount: 6900,
        remainingAmount: 0,
        status: 'PAID',
        terms: 'الدفع خلال 30 يوماً من تاريخ إصدار الفاتورة.',
        paymentDetails: 'حساب بنك الراجحي: SA0380000000000000000000',
        createdAt: '2026-09-15T09:00:00Z'
      },
      {
        id: 'inv-seed-2',
        invoiceNumber: 'INV-2026-0082',
        type: 'TAX_INVOICE',
        category: 'NEW_INSTALLATION',
        date: '2026-09-20',
        dueDate: '2026-10-20',
        customerId: customers[1]?.id || 'cust-2',
        customerName: customers[1]?.name || 'م. فهد السبيعي',
        customerTaxNumber: '310987654300003',
        customerAddress: 'الرياض - حي النرجس',
        customerPhone: '+966 55 444 7788',
        projectRef: projects[0]?.quoteRef || 'Q-2026-01',
        items: [
          {
            id: 'item-2',
            description: 'دفعة توريد وتركيب مصعد فيلا ركاب بدون غرفة ماكينة MRL (دفعة تثبيت السكك 40%)',
            quantity: 1,
            unit: 'دفعة مشروع',
            unitPrice: 35000,
            subtotal: 35000,
            vatRate: 0.15,
            vatAmount: 5250,
            totalWithVat: 40250
          }
        ],
        subtotal: 35000,
        taxableAmount: 35000,
        vatRate: 0.15,
        vatAmount: 5250,
        totalAmount: 40250,
        paidAmount: 20000,
        remainingAmount: 20250,
        status: 'PARTIALLY_PAID',
        terms: 'سداد الدفعة مرتبط بإنهاء المرحلة حسب الملحق الفني.',
        paymentDetails: 'حساب بنك الإنماء: SA4405000000000000000000',
        createdAt: '2026-09-20T11:30:00Z'
      }
    ];
  });

  const [vouchers, setVouchers] = useState<ReceiptVoucher[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_VOUCHERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }

    return [
      {
        id: 'vouc-seed-1',
        voucherNumber: 'REC-2026-0145',
        date: '2026-09-16',
        customerId: customers[0]?.id || 'cust-1',
        customerName: customers[0]?.name || 'شركة الأندلس العقارية',
        customerCompany: 'شركة الأندلس العقارية',
        customerPhone: '+966 50 111 2233',
        amount: 6900,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'TRX-ALRAJHI-998124',
        bankName: 'مصرف الراجحي',
        invoiceNumber: 'INV-2026-0081',
        contractRef: contracts[0]?.contractRef || 'MNT-2025-001',
        receivedFor: 'سداد كامل قيمة الفاتورة INV-2026-0081 لعقد صيانة مصعد برج الأندلس',
        receivedBy: 'أحمد كمال (المحاسب المالي)',
        notes: 'تم استلام الإشعار البنكي والمطابقة مع كشف الحساب.',
        createdAt: '2026-09-16T10:15:00Z'
      },
      {
        id: 'vouc-seed-2',
        voucherNumber: 'REC-2026-0146',
        date: '2026-09-21',
        customerId: customers[1]?.id || 'cust-2',
        customerName: customers[1]?.name || 'م. فهد السبيعي',
        customerCompany: 'فيلا خاصة',
        customerPhone: '+966 55 444 7788',
        amount: 20000,
        paymentMethod: 'MADA_POS',
        referenceNumber: 'POS-AUTH-882190',
        bankName: 'شبكة مدى / البنك الأهلي',
        invoiceNumber: 'INV-2026-0082',
        receivedFor: 'دفعة جزئية (20,000 ريال) من قيمة الدفعة الثانية لتوريد مصعد الفيلا',
        receivedBy: 'م. خالد الدوسري (مشرف المبيعات)',
        notes: 'تمت العملية عبر جهاز الدفع المحمول في الموقع.',
        createdAt: '2026-09-21T14:40:00Z'
      }
    ];
  });

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.error(e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_VOUCHERS_KEY, JSON.stringify(vouchers));
    } catch (e) {
      console.error(e);
    }
  }, [vouchers]);

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewVoucher, setViewVoucher] = useState<ReceiptVoucher | null>(null);
  const [renderedZatcaQr, setRenderedZatcaQr] = useState<string>('');

  // Generate ZATCA QR whenever viewInvoice changes
  useEffect(() => {
    if (!viewInvoice) {
      setRenderedZatcaQr('');
      return;
    }

    const seller = companySettings.nameAr || 'شركة توينز للمصاعد المحدودة';
    const vatNum = companySettings.taxNumber || '300000000000003';
    
    generateZatcaQrDataUrl({
      sellerName: seller,
      vatRegistrationNumber: vatNum,
      timestamp: `${viewInvoice.date}T12:00:00Z`,
      invoiceTotalWithVat: viewInvoice.totalAmount,
      vatAmount: viewInvoice.vatAmount
    }).then((url) => {
      setRenderedZatcaQr(url);
    });
  }, [viewInvoice, companySettings]);

  // Form State: New Invoice
  const [newInvCustomerType, setNewInvCustomerType] = useState<'EXISTING' | 'CUSTOM'>('EXISTING');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newInvNumber, setNewInvNumber] = useState(`INV-2026-${String(invoices.length + 83).padStart(4, '0')}`);
  const [newInvDate, setNewInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInvDueDate, setNewInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [newInvCategory, setNewInvCategory] = useState<InvoiceCategory>('MAINTENANCE_CONTRACT');
  const [newInvCustName, setNewInvCustName] = useState('');
  const [newInvCustTax, setNewInvCustTax] = useState('');
  const [newInvCustPhone, setNewInvCustPhone] = useState('');
  const [newInvCustAddress, setNewInvCustAddress] = useState('');
  const [newInvLinkedRef, setNewInvLinkedRef] = useState('');
  const [newInvItems, setNewInvItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      description: 'خدمات صيانة مصعد وقائية معتمدة',
      quantity: 1,
      unit: 'خدمة',
      unitPrice: 5000,
      subtotal: 5000,
      vatRate: 0.15,
      vatAmount: 750,
      totalWithVat: 5750
    }
  ]);
  const [newInvNotes, setNewInvNotes] = useState('');

  // Form State: New Receipt Voucher
  const [newVoucNumber, setNewVoucNumber] = useState(`REC-2026-${String(vouchers.length + 147).padStart(4, '0')}`);
  const [newVoucDate, setNewVoucDate] = useState(new Date().toISOString().split('T')[0]);
  const [newVoucCustName, setNewVoucCustName] = useState('');
  const [newVoucAmount, setNewVoucAmount] = useState<number>(5000);
  const [newVoucMethod, setNewVoucMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [newVoucRef, setNewVoucRef] = useState('');
  const [newVoucBank, setNewVoucBank] = useState('');
  const [newVoucInvNumber, setNewVoucInvNumber] = useState('');
  const [newVoucReceivedFor, setNewVoucReceivedFor] = useState('');
  const [newVoucReceivedBy, setNewVoucReceivedBy] = useState('أحمد كمال (المحاسب المالي)');
  const [newVoucNotes, setNewVoucNotes] = useState('');

  // Handle auto-filling customer info
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find(c => c.id === custId);
    if (found) {
      setNewInvCustName(found.name);
      setNewInvCustTax(found.taxNumber || '');
      setNewInvCustPhone(found.phone || '');
      setNewInvCustAddress(found.location || '');
    }
  };

  // Quick import from Contract
  const handleImportFromContract = (contractId: string) => {
    const c = contracts.find(item => item.id === contractId);
    if (!c) return;

    setNewInvCustName(c.customerName);
    setNewInvCustPhone(c.customerPhone || '');
    setNewInvCustAddress(c.siteLocation || '');
    setNewInvLinkedRef(c.contractRef);
    setNewInvCategory('MAINTENANCE_CONTRACT');
    
    const price = c.totalPrice || 4000;
    const vat = price * 0.15;
    setNewInvItems([
      {
        id: `c-item-${Date.now()}`,
        description: `عقد صيانة سنوي - ${c.title || c.elevatorName} (${c.contractRef})`,
        quantity: 1,
        unit: 'عقد سنوي',
        unitPrice: price,
        subtotal: price,
        vatRate: 0.15,
        vatAmount: vat,
        totalWithVat: price + vat
      }
    ]);
    onShowToast(isAr ? 'تم استيراد بيانات العقد بنجاح!' : 'Contract imported successfully!');
  };

  // Item calculations
  const calculateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const vatAmount = items.reduce((sum, item) => sum + (item.vatAmount || 0), 0);
    const totalAmount = subtotal + vatAmount;
    return { subtotal, vatAmount, totalAmount };
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...newInvItems];
    const item = { ...updated[index], [field]: val };
    
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : item.quantity;
      const p = field === 'unitPrice' ? Number(val) : item.unitPrice;
      const sub = q * p;
      const vat = sub * 0.15;
      item.subtotal = sub;
      item.vatAmount = vat;
      item.totalWithVat = sub + vat;
    }
    updated[index] = item;
    setNewInvItems(updated);
  };

  const handleAddItem = () => {
    setNewInvItems([
      ...newInvItems,
      {
        id: `item-${Date.now()}`,
        description: 'بند خدمة أو قطعة غيار جديدة',
        quantity: 1,
        unit: 'حبة',
        unitPrice: 1000,
        subtotal: 1000,
        vatRate: 0.15,
        vatAmount: 150,
        totalWithVat: 1150
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (newInvItems.length <= 1) return;
    setNewInvItems(newInvItems.filter((_, i) => i !== index));
  };

  // Submit New Invoice
  const handleSaveInvoice = () => {
    if (!newInvCustName.trim()) {
      alert(isAr ? 'يرجى إدخال اسم العميل' : 'Please enter customer name');
      return;
    }

    const { subtotal, vatAmount, totalAmount } = calculateTotals(newInvItems);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: newInvNumber,
      type: 'TAX_INVOICE',
      category: newInvCategory,
      date: newInvDate,
      dueDate: newInvDueDate,
      customerId: selectedCustomerId || undefined,
      customerName: newInvCustName,
      customerTaxNumber: newInvCustTax,
      customerPhone: newInvCustPhone,
      customerAddress: newInvCustAddress,
      contractRef: newInvCategory === 'MAINTENANCE_CONTRACT' ? newInvLinkedRef : undefined,
      projectRef: newInvCategory === 'NEW_INSTALLATION' ? newInvLinkedRef : undefined,
      items: newInvItems,
      subtotal,
      taxableAmount: subtotal,
      vatRate: 0.15,
      vatAmount,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      status: 'PENDING',
      notes: newInvNotes,
      terms: 'الدفع خلال 30 يوماً من تاريخ الفاتورة. تخضع للشروط والأحكام.',
      paymentDetails: companySettings.iban ? `حساب التحويل: ${companySettings.iban}` : 'التحويل لحساب الشركة المعتمد',
      createdAt: new Date().toISOString()
    };

    setInvoices([newInvoice, ...invoices]);
    setIsInvoiceModalOpen(false);
    onShowToast(isAr ? `تم إصدار الفاتورة ${newInvNumber} بنجاح!` : `Invoice ${newInvNumber} issued successfully!`);
    
    // Increment default number
    setNewInvNumber(`INV-2026-${String(invoices.length + 84).padStart(4, '0')}`);
  };

  // Submit New Voucher
  const handleSaveVoucher = () => {
    if (!newVoucCustName.trim() || newVoucAmount <= 0) {
      alert(isAr ? 'يرجى إدخال اسم العميل ومبلغ السند' : 'Please enter customer name and valid amount');
      return;
    }

    const newVoucher: ReceiptVoucher = {
      id: `vouc-${Date.now()}`,
      voucherNumber: newVoucNumber,
      date: newVoucDate,
      customerName: newVoucCustName,
      amount: Number(newVoucAmount),
      paymentMethod: newVoucMethod,
      referenceNumber: newVoucRef || undefined,
      bankName: newVoucBank || undefined,
      invoiceNumber: newVoucInvNumber || undefined,
      receivedFor: newVoucReceivedFor || (isAr ? 'سداد دفعة مالية' : 'Payment receipt'),
      receivedBy: newVoucReceivedBy,
      notes: newVoucNotes || undefined,
      createdAt: new Date().toISOString()
    };

    // If linked to an invoice, update invoice paid amount
    if (newVoucInvNumber) {
      setInvoices(prev => prev.map(inv => {
        if (inv.invoiceNumber === newVoucInvNumber) {
          const newPaid = inv.paidAmount + Number(newVoucAmount);
          const remaining = Math.max(0, inv.totalAmount - newPaid);
          const newStatus: InvoiceStatus = remaining === 0 ? 'PAID' : 'PARTIALLY_PAID';
          return {
            ...inv,
            paidAmount: newPaid,
            remainingAmount: remaining,
            status: newStatus
          };
        }
        return inv;
      }));
    }

    setVouchers([newVoucher, ...vouchers]);
    setIsVoucherModalOpen(false);
    onShowToast(isAr ? `تم تسجيل سند القبض ${newVoucNumber} بنجاح!` : `Receipt voucher ${newVoucNumber} saved!`);
    setNewVoucNumber(`REC-2026-${String(vouchers.length + 148).padStart(4, '0')}`);
  };

  // Open voucher modal prefilled for an invoice
  const handleOpenVoucherForInvoice = (inv: Invoice) => {
    setNewVoucCustName(inv.customerName);
    setNewVoucAmount(inv.remainingAmount > 0 ? inv.remainingAmount : inv.totalAmount);
    setNewVoucInvNumber(inv.invoiceNumber);
    setNewVoucReceivedFor(isAr ? `سداد دفعة الفاتورة الضريبية رقم ${inv.invoiceNumber}` : `Payment for Tax Invoice ${inv.invoiceNumber}`);
    setIsVoucherModalOpen(true);
  };

  // Delete invoice
  const handleDeleteInvoice = (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الفاتورة؟' : 'Are you sure you want to delete this invoice?')) {
      setInvoices(invoices.filter(i => i.id !== id));
      onShowToast(isAr ? 'تم حذف الفاتورة' : 'Invoice deleted');
    }
  };

  // Delete voucher
  const handleDeleteVoucher = (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا السند؟' : 'Are you sure you want to delete this voucher?')) {
      setVouchers(vouchers.filter(v => v.id !== id));
      onShowToast(isAr ? 'تم حذف السند' : 'Voucher deleted');
    }
  };

  // Filtered lists
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.contractRef && inv.contractRef.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      return (
        v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.referenceNumber && v.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [vouchers, searchQuery]);

  // Overall Financial Statistics
  const financialStats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalCollected = vouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
    const pendingReceivables = invoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
    const totalVat = invoices.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0);
    return { totalInvoiced, totalCollected, pendingReceivables, totalVat };
  }, [invoices, vouchers]);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>{isAr ? 'مدفوعة بالكامل' : 'Paid'}</span>
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" />
            <span>{isAr ? 'مسددة جزئياً' : 'Partially Paid'}</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3" />
            <span>{isAr ? 'في انتظار السداد' : 'Pending'}</span>
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3" />
            <span>{isAr ? 'متأخرة السداد' : 'Overdue'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentMethodBadge = (m: PaymentMethod) => {
    switch (m) {
      case 'BANK_TRANSFER':
        return <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-medium">{isAr ? 'حوالة بنكية' : 'Bank Transfer'}</span>;
      case 'MADA_POS':
        return <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-medium">{isAr ? 'مدى / شبكة' : 'Mada / POS'}</span>;
      case 'CASH':
        return <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-medium">{isAr ? 'نقداً' : 'Cash'}</span>;
      case 'CHEQUE':
        return <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-medium">{isAr ? 'شيك بنكي' : 'Cheque'}</span>;
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header & Financial KPI Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" />
              <span>{isAr ? 'الإدارة المالية والفوترة الإلكترونية (ZATCA Phase 1 & 2)' : 'Financial Billing & ZATCA e-Invoicing'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {isAr ? 'الفوترة وسندات القبض وضريبة القيمة المضافة' : 'Invoices, Receipts & VAT Accounting'}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              {isAr ? 'إصدار الفواتير الضريبية المعتمدة بالـ QR كود المشفر وسندات القبض الرسمية لخدمات وعقود المصاعد.' : 'Manage certified tax invoices with compliant ZATCA QR codes and official payment receipts.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إصدار فاتورة ضريبية' : 'New Tax Invoice'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isAr ? 'إنشاء سند قبض مالي' : 'New Receipt Voucher'}</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{isAr ? 'إجمالي الفواتير الصادرة' : 'Total Invoiced'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              <SarPrice value={financialStats.totalInvoiced} />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {invoices.length} {isAr ? 'فاتورة ضريبية' : 'invoices'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'إجمالي التحصيلات الفعلية' : 'Total Collected'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              <SarPrice value={financialStats.totalCollected} />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {vouchers.length} {isAr ? 'سند قبض معتمد' : 'receipt vouchers'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'المستحقات المتبقية للتحصيل' : 'Pending Receivables'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              <SarPrice value={financialStats.pendingReceivables} />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isAr ? 'مستحقات غير محصلة' : 'uncollected balance'}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
              <span>{isAr ? 'ضريبة القيمة المضافة 15%' : 'Total VAT 15%'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-300">
              <SarPrice value={financialStats.totalVat} />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isAr ? 'مطابقة لإقرار هيئة الزكاة' : 'ZATCA compliant'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Toggle View */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('INVOICES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'INVOICES'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'الفواتير الضريبية (Tax Invoices)' : 'Tax Invoices'}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-full font-mono border border-blue-200">
              {invoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('VOUCHERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'VOUCHERS'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{isAr ? 'سندات القبض الرسمية (Receipt Vouchers)' : 'Receipt Vouchers'}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-full font-mono border border-emerald-200">
              {vouchers.length}
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث برقم الفاتورة، السند، العميل...' : 'Search by invoice #, customer...'}
              className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeSubTab === 'INVOICES' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
              <option value="PAID">{isAr ? 'مدفوعة' : 'Paid'}</option>
              <option value="PARTIALLY_PAID">{isAr ? 'مسددة جزئياً' : 'Partially Paid'}</option>
              <option value="PENDING">{isAr ? 'معلقة' : 'Pending'}</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab 1: Tax Invoices Table */}
      {activeSubTab === 'INVOICES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">{isAr ? 'رقم الفاتورة' : 'Invoice #'}</th>
                  <th className="px-4 py-3">{isAr ? 'العميل والموقع' : 'Customer'}</th>
                  <th className="px-4 py-3">{isAr ? 'النوع والمرجع' : 'Category / Ref'}</th>
                  <th className="px-4 py-3">{isAr ? 'التاريخ والاستحقاق' : 'Date / Due'}</th>
                  <th className="px-4 py-3">{isAr ? 'المبلغ قبل الضريبة' : 'Subtotal'}</th>
                  <th className="px-4 py-3">{isAr ? 'الضريبة 15%' : 'VAT 15%'}</th>
                  <th className="px-4 py-3">{isAr ? 'الإجمالي النهائي' : 'Total (SAR)'}</th>
                  <th className="px-4 py-3">{isAr ? 'المسدد والمتبقي' : 'Paid / Due'}</th>
                  <th className="px-4 py-3">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                      <p className="font-semibold">{isAr ? 'لا توجد فواتير مطابقة' : 'No matching invoices found'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold font-mono text-blue-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{inv.customerName}</div>
                        {inv.customerTaxNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {isAr ? 'الرقم الضريبي:' : 'VAT:'} {inv.customerTaxNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-700">
                          {inv.category === 'MAINTENANCE_CONTRACT' && (isAr ? 'عقد صيانة' : 'Maintenance')}
                          {inv.category === 'NEW_INSTALLATION' && (isAr ? 'مشروع توريد وتركيب' : 'Installation')}
                          {inv.category === 'SPARE_PARTS' && (isAr ? 'قطع غيار' : 'Spare Parts')}
                        </div>
                        {(inv.contractRef || inv.projectRef) && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-mono">
                            {inv.contractRef || inv.projectRef}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div>{inv.date}</div>
                        <div className="text-[10px] text-slate-400">{isAr ? 'استحقاق:' : 'Due:'} {inv.dueDate}</div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        <SarPrice value={inv.subtotal} />
                      </td>
                      <td className="px-4 py-3.5 font-medium text-purple-700">
                        <SarPrice value={inv.vatAmount} />
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900 text-sm">
                        <SarPrice value={inv.totalAmount} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-emerald-700 font-bold">
                          <SarPrice value={inv.paidAmount} />
                        </div>
                        {inv.remainingAmount > 0 && (
                          <div className="text-amber-700 text-[10px] font-semibold">
                            {isAr ? 'متبقي:' : 'Due:'} <SarPrice value={inv.remainingAmount} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title={isAr ? 'عرض وطباعة الفاتورة الضريبية' : 'View & Print Tax Invoice'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {inv.remainingAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenVoucherForInvoice(inv)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={isAr ? 'إصدار سند قبض لهذه الفاتورة' : 'Issue receipt voucher'}
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Receipt Vouchers Table */}
      {activeSubTab === 'VOUCHERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">{isAr ? 'رقم السند' : 'Voucher #'}</th>
                  <th className="px-4 py-3">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3">{isAr ? 'العميل' : 'Customer'}</th>
                  <th className="px-4 py-3">{isAr ? 'المبلغ المستلم' : 'Amount (SAR)'}</th>
                  <th className="px-4 py-3">{isAr ? 'طريقة السداد' : 'Payment Method'}</th>
                  <th className="px-4 py-3">{isAr ? 'رقم الحوالة / المرجع' : 'Ref / Auth'}</th>
                  <th className="px-4 py-3">{isAr ? 'الفاتورة المرتبطة' : 'Linked Invoice'}</th>
                  <th className="px-4 py-3">{isAr ? 'نظير ما تم سداده' : 'Received For'}</th>
                  <th className="px-4 py-3">{isAr ? 'المستلم' : 'Received By'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                      <p className="font-semibold">{isAr ? 'لا توجد سندات قبض مطابقة' : 'No receipt vouchers found'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold font-mono text-emerald-700">
                        {v.voucherNumber}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono">
                        {v.date}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{v.customerName}</div>
                        {v.customerPhone && (
                          <div className="text-[10px] text-slate-400">{v.customerPhone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-black text-emerald-800 text-sm">
                        <SarPrice value={v.amount} />
                      </td>
                      <td className="px-4 py-3.5">
                        {getPaymentMethodBadge(v.paymentMethod)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {v.referenceNumber || '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-blue-600 font-semibold">
                        {v.invoiceNumber || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate" title={v.receivedFor}>
                        {v.receivedFor}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {v.receivedBy}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewVoucher(v)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title={isAr ? 'عرض وطباعة سند القبض' : 'View & Print Voucher'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteVoucher(v.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
      {/* MODAL 1: Create New Tax Invoice                          */}
      {/* ======================================================== */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-base">
                  {isAr ? 'إصدار فاتورة ضريبية إلكترونية جديدة (ZATCA)' : 'Issue New Tax Invoice'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Quick Import from existing Maintenance Contract */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'استيراد سريع من عقد صيانة قائم:' : 'Quick import from maintenance contract:'}</span>
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleImportFromContract(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold focus:outline-hidden"
                >
                  <option value="">{isAr ? '— اختر عقداً للاستيراد التلقائي —' : 'Select contract'}</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.contractRef} - {c.customerName} ({c.totalPrice} SAR)
                    </option>
                  ))}
                </select>
              </div>

              {/* Basic Invoice Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'رقم الفاتورة' : 'Invoice Number'}</label>
                  <input
                    type="text"
                    value={newInvNumber}
                    onChange={(e) => setNewInvNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'تاريخ الفاتورة' : 'Date'}</label>
                  <input
                    type="date"
                    value={newInvDate}
                    onChange={(e) => setNewInvDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                  <input
                    type="date"
                    value={newInvDueDate}
                    onChange={(e) => setNewInvDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Customer selection / entry */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-600" />
                    <span>{isAr ? 'بيانات العميل (المشتري)' : 'Customer Info'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">{isAr ? 'اختر من دليل العملاء...' : 'Choose from directory...'}</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'اسم العميل / الشركة' : 'Customer Name'}</label>
                    <input
                      type="text"
                      value={newInvCustName}
                      onChange={(e) => setNewInvCustName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                      placeholder="شركة..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'الرقم الضريبي للعميل (إن وجد)' : 'Customer VAT ID'}</label>
                    <input
                      type="text"
                      value={newInvCustTax}
                      onChange={(e) => setNewInvCustTax(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                      placeholder="3xxxxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'رقم الهاتف / التواصل' : 'Phone'}</label>
                    <input
                      type="text"
                      value={newInvCustPhone}
                      onChange={(e) => setNewInvCustPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'العنوان / الموقع' : 'Location'}</label>
                    <input
                      type="text"
                      value={newInvCustAddress}
                      onChange={(e) => setNewInvCustAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Items Line editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-900 text-sm">
                    {isAr ? 'بنود الفاتورة والخدمات' : 'Invoice Items'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة بند' : 'Add Item'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newInvItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 items-center">
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder={isAr ? 'وصف الخدمة أو الصنف' : 'Item description'}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          min="1"
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center"
                          placeholder={isAr ? 'الكمية' : 'Qty'}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          min="0"
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold"
                          placeholder={isAr ? 'السعر' : 'Price'}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2 text-right sm:text-center font-black text-slate-800">
                        <SarPrice value={item.totalWithVat} />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              {(() => {
                const { subtotal, vatAmount, totalAmount } = calculateTotals(newInvItems);
                return (
                  <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>{isAr ? 'المجموع الخاضع للضريبة (SAR):' : 'Taxable Subtotal:'}</span>
                      <span className="font-mono font-bold"><SarPrice value={subtotal} /></span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>{isAr ? 'ضريبة القيمة المضافة (15% VAT):' : 'VAT 15%:'}</span>
                      <span className="font-mono font-bold"><SarPrice value={vatAmount} /></span>
                    </div>
                    <div className="flex justify-between text-base font-black border-t border-white/20 pt-2 text-white">
                      <span>{isAr ? 'الإجمالي النهائي شامل الضريبة (SAR):' : 'Grand Total (incl. VAT):'}</span>
                      <span className="font-mono text-emerald-400"><SarPrice value={totalAmount} /></span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveInvoice}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                {isAr ? 'اعتماد وإصدار الفاتورة' : 'Issue Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Create New Receipt Voucher                     */}
      {/* ======================================================== */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">
                  {isAr ? 'إنشاء سند قبض مالي إلكتروني' : 'Create Official Receipt Voucher'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'رقم السند' : 'Voucher #'}</label>
                  <input
                    type="text"
                    value={newVoucNumber}
                    onChange={(e) => setNewVoucNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'التاريخ' : 'Date'}</label>
                  <input
                    type="date"
                    value={newVoucDate}
                    onChange={(e) => setNewVoucDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">{isAr ? 'اسم العميل / المستلم منه' : 'Customer Name'}</label>
                <input
                  type="text"
                  value={newVoucCustName}
                  onChange={(e) => setNewVoucCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  placeholder="شركة..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'المبلغ المستلم (SAR)' : 'Amount (SAR)'}</label>
                  <input
                    type="number"
                    min="1"
                    value={newVoucAmount}
                    onChange={(e) => setNewVoucAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-lg font-mono font-black text-emerald-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{isAr ? 'طريقة السداد' : 'Payment Method'}</label>
                  <select
                    value={newVoucMethod}
                    onChange={(e) => setNewVoucMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="BANK_TRANSFER">{isAr ? 'حوالة بنكية' : 'Bank Transfer'}</option>
                    <option value="MADA_POS">{isAr ? 'شبكة / مدى / نقطة بيع' : 'Mada / POS'}</option>
                    <option value="CASH">{isAr ? 'نقداً' : 'Cash'}</option>
                    <option value="CHEQUE">{isAr ? 'شيك بنكي' : 'Cheque'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'رقم الحوالة / المرجع البنكي' : 'Reference / Auth #'}</label>
                  <input
                    type="text"
                    value={newVoucRef}
                    onChange={(e) => setNewVoucRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                    placeholder="TRX-123456"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">{isAr ? 'الفاتورة المرتبطة (إن وجدت)' : 'Linked Invoice #'}</label>
                  <input
                    type="text"
                    value={newVoucInvNumber}
                    onChange={(e) => setNewVoucInvNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                    placeholder="INV-2026-..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">{isAr ? 'وذلك نظير (البيان والغرض)' : 'Received For'}</label>
                <textarea
                  rows={2}
                  value={newVoucReceivedFor}
                  onChange={(e) => setNewVoucReceivedFor(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  placeholder={isAr ? 'سداد دفعة عقد صيانة أو توريد...' : 'Payment purpose...'}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">{isAr ? 'المحاسب المستلم' : 'Received By'}</label>
                <input
                  type="text"
                  value={newVoucReceivedBy}
                  onChange={(e) => setNewVoucReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveVoucher}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                {isAr ? 'حفظ وإصدار سند القبض' : 'Save Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Printable Tax Invoice (ZATCA Compliant)         */}
      {/* ======================================================== */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Action Bar */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs">{isAr ? 'معاينة الفاتورة الضريبية المعتمدة' : 'Tax Invoice Preview'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewInvoice(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Invoice Sheet */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white" id="official-tax-invoice-print">
              {/* Header with Logo and ZATCA QR */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {companySettings.nameAr || 'شركة توينز للمصاعد المحدودة'}
                  </h2>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    {companySettings.nameEn || 'Twins Elevators & Escalators Co. Ltd.'}
                  </div>
                  <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                    <div>{isAr ? 'السجل التجاري:' : 'CR:'} <span className="font-mono font-bold">{companySettings.commercialReg || '1010889922'}</span></div>
                    <div>{isAr ? 'الرقم الضريبي (VAT):' : 'VAT No:'} <span className="font-mono font-bold text-slate-900">{companySettings.taxNumber || '300000000000003'}</span></div>
                    <div>{companySettings.address || 'المملكة العربية السعودية - الرياض'}</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm font-black bg-slate-900 text-white px-4 py-1 rounded-lg uppercase tracking-wide mb-2">
                    {isAr ? 'فاتورة ضريبية' : 'Tax Invoice'}
                  </div>
                  {renderedZatcaQr ? (
                    <img 
                      src={renderedZatcaQr} 
                      alt="ZATCA Compliant QR Code" 
                      className="w-24 h-24 border border-slate-300 rounded p-1 mx-auto bg-white shadow-xs" 
                    />
                  ) : (
                    <div className="w-24 h-24 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                      QR Code
                    </div>
                  )}
                  <span className="text-[9px] font-mono text-slate-400 block mt-1">ZATCA Compliant</span>
                </div>
              </div>

              {/* Invoice & Customer Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div className="font-bold text-slate-500 text-[11px] uppercase">{isAr ? 'بيانات الفاتورة:' : 'Invoice Details:'}</div>
                  <div><span className="text-slate-500">{isAr ? 'رقم الفاتورة:' : 'Invoice #:'}</span> <strong className="font-mono text-blue-700">{viewInvoice.invoiceNumber}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'تاريخ الإصدار:' : 'Date:'}</span> <strong className="font-mono">{viewInvoice.date}</strong></div>
                  <div><span className="text-slate-500">{isAr ? 'تاريخ الاستحقاق:' : 'Due Date:'}</span> <strong className="font-mono">{viewInvoice.dueDate}</strong></div>
                  {(viewInvoice.contractRef || viewInvoice.projectRef) && (
                    <div><span className="text-slate-500">{isAr ? 'المرجع المرتبط:' : 'Linked Ref:'}</span> <strong className="font-mono">{viewInvoice.contractRef || viewInvoice.projectRef}</strong></div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-500 text-[11px] uppercase">{isAr ? 'بيانات العميل (المشتري):' : 'Customer (Buyer):'}</div>
                  <div className="font-bold text-slate-900 text-sm">{viewInvoice.customerName}</div>
                  {viewInvoice.customerTaxNumber && (
                    <div><span className="text-slate-500">{isAr ? 'الرقم الضريبي:' : 'VAT ID:'}</span> <strong className="font-mono">{viewInvoice.customerTaxNumber}</strong></div>
                  )}
                  {viewInvoice.customerPhone && (
                    <div><span className="text-slate-500">{isAr ? 'الهاتف:' : 'Phone:'}</span> {viewInvoice.customerPhone}</div>
                  )}
                  {viewInvoice.customerAddress && (
                    <div><span className="text-slate-500">{isAr ? 'العنوان:' : 'Address:'}</span> {viewInvoice.customerAddress}</div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right text-xs border border-slate-200">
                <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">{isAr ? 'بيان الخدمة / الصنف' : 'Item Description'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'المجموع' : 'Subtotal'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'الضريبة 15%' : 'VAT 15%'}</th>
                    <th className="p-2.5 text-center">{isAr ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewInvoice.items.map((item, i) => (
                    <tr key={item.id}>
                      <td className="p-2.5 text-center text-slate-500">{i + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{item.description}</td>
                      <td className="p-2.5 text-center">{item.quantity}</td>
                      <td className="p-2.5 text-center font-mono"><SarPrice value={item.unitPrice} /></td>
                      <td className="p-2.5 text-center font-mono"><SarPrice value={item.subtotal} /></td>
                      <td className="p-2.5 text-center font-mono text-purple-700"><SarPrice value={item.vatAmount} /></td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-900"><SarPrice value={item.totalWithVat} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Signature */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
                <div className="text-xs space-y-1.5 text-slate-500 max-w-sm">
                  <div className="font-bold text-slate-700">{isAr ? 'طريقة السداد ومعلومات الحساب:' : 'Payment Terms & Bank:'}</div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800">
                    {viewInvoice.paymentDetails || 'مصرف الراجحي: SA0380000000000000000000'}
                  </div>
                  <div>{viewInvoice.terms || 'تخضع كافة المعاملات للأنظمة السارية في المملكة العربية السعودية.'}</div>
                </div>

                <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'المجموع قبل الضريبة:' : 'Subtotal:'}</span>
                    <span className="font-mono font-bold"><SarPrice value={viewInvoice.subtotal} /></span>
                  </div>
                  <div className="flex justify-between text-purple-700 font-semibold">
                    <span>{isAr ? 'ضريبة القيمة المضافة 15%:' : 'VAT 15%:'}</span>
                    <span className="font-mono font-bold"><SarPrice value={viewInvoice.vatAmount} /></span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t-2 border-slate-300 pt-2 text-slate-900">
                    <span>{isAr ? 'المجموع النهائي شامل الضريبة:' : 'Grand Total (SAR):'}</span>
                    <span className="font-mono text-blue-700"><SarPrice value={viewInvoice.totalAmount} /></span>
                  </div>
                </div>
              </div>

              {/* Official Seal and Signature */}
              <div className="flex items-end justify-between pt-8 border-t border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px] mb-8">{isAr ? 'المستلم / العميل:' : 'Customer Signature:'}</div>
                  <div className="border-b border-slate-300 w-40"></div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-[11px] mb-8">{isAr ? 'الختم الرسمي وتوقيع الإدارة المالية:' : 'Official Stamp & Finance Signature:'}</div>
                  <div className="border-b border-slate-300 w-44 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Printable Receipt Voucher                       */}
      {/* ======================================================== */}
      {viewVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
            {/* Action Bar */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs">{isAr ? 'سند قبض رسمي معتمد' : 'Official Receipt Voucher'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة السند' : 'Print Voucher'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewVoucher(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Content */}
            <div className="p-8 space-y-6 text-slate-800 bg-white" id="official-voucher-print">
              <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {companySettings.nameAr || 'شركة توينز للمصاعد المحدودة'}
                  </h2>
                  <div className="text-xs text-slate-500 font-semibold">
                    {companySettings.nameEn || 'Twins Elevators & Escalators Co. Ltd.'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-emerald-800 text-white font-black text-xs px-4 py-1 rounded-lg uppercase tracking-wider inline-block">
                    {isAr ? 'سند قبض مالي' : 'RECEIPT VOUCHER'}
                  </div>
                  <div className="font-mono font-bold text-emerald-800 text-sm mt-1">{viewVoucher.voucherNumber}</div>
                  <div className="text-xs text-slate-500 font-mono">{isAr ? 'التاريخ:' : 'Date:'} {viewVoucher.date}</div>
                </div>
              </div>

              {/* Voucher Details Table */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <span className="text-slate-600 font-semibold">{isAr ? 'استلمنا من المكرم / السادة:' : 'Received From:'}</span>
                  <span className="font-black text-sm text-slate-900">{viewVoucher.customerName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <span className="text-slate-600 font-semibold">{isAr ? 'مبلغاً وقدره (SAR):' : 'The Sum Of:'}</span>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-emerald-800"><SarPrice value={viewVoucher.amount} /></span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <span className="text-slate-600 font-semibold">{isAr ? 'طريقة السداد:' : 'Payment Method:'}</span>
                  <span>{getPaymentMethodBadge(viewVoucher.paymentMethod)}</span>
                </div>

                {viewVoucher.referenceNumber && (
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <span className="text-slate-600 font-semibold">{isAr ? 'رقم الحوالة / المرجع:' : 'Transaction Reference:'}</span>
                    <span className="font-mono font-bold text-slate-800">{viewVoucher.referenceNumber}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-600 font-semibold block mb-1">{isAr ? 'وذلك عن (البيان):' : 'For (Description):'}</span>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 font-medium text-slate-800">
                    {viewVoucher.receivedFor}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex items-end justify-between pt-8 text-xs border-t border-slate-200">
                <div>
                  <div className="text-slate-400 text-[11px] mb-8">{isAr ? 'توقيع المستلم منه:' : 'Payer Signature:'}</div>
                  <div className="border-b border-slate-300 w-36"></div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-[11px] mb-8">
                    {isAr ? 'المحاسب المسؤول:' : 'Accountant:'} {viewVoucher.receivedBy}
                  </div>
                  <div className="border-b border-slate-300 w-44 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
