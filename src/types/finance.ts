export type InvoiceType = 'TAX_INVOICE' | 'SIMPLIFIED_TAX_INVOICE';

export type InvoiceCategory = 
  | 'MAINTENANCE_CONTRACT' 
  | 'NEW_INSTALLATION' 
  | 'SPARE_PARTS' 
  | 'EMERGENCY_REPAIR' 
  | 'ANNUAL_AUDIT';

export type InvoiceStatus = 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  vatRate: number;      // usually 0.15
  vatAmount: number;
  totalWithVat: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;         // e.g. "INV-2026-0012"
  type: InvoiceType;
  category: InvoiceCategory;
  date: string;                  // YYYY-MM-DD
  dueDate: string;               // YYYY-MM-DD
  
  // Customer details
  customerId?: string;
  customerName: string;
  customerCompany?: string;
  customerTaxNumber?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Linked entities
  contractId?: string;           // Linked MaintenanceContract
  projectId?: string;            // Linked ElevatorSpecification
  contractRef?: string;
  projectRef?: string;
  
  // Financial amounts
  items: InvoiceItem[];
  subtotal: number;              // SAR before VAT
  discountAmount?: number;       // Optional discount
  taxableAmount: number;         // Amount subject to VAT
  vatRate: number;               // 0.15
  vatAmount: number;             // 15% VAT
  totalAmount: number;           // Total SAR with VAT
  paidAmount: number;            // Amount received so far
  remainingAmount: number;       // Balance due
  status: InvoiceStatus;
  
  // ZATCA & Notes
  zatcaQrRaw?: string;           // Base64 TLV string
  zatcaQrDataUrl?: string;       // Rendered QR image
  notes?: string;
  terms?: string;
  paymentDetails?: string;       // Bank transfer instructions
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MADA_POS' | 'CHEQUE';

export interface ReceiptVoucher {
  id: string;
  voucherNumber: string;         // e.g. "REC-2026-0045"
  date: string;                  // YYYY-MM-DD
  customerId?: string;
  customerName: string;
  customerCompany?: string;
  customerPhone?: string;
  amount: number;                // SAR
  paymentMethod: PaymentMethod;
  referenceNumber?: string;      // Transaction reference / Check number
  bankName?: string;
  invoiceId?: string;            // Linked Invoice
  invoiceNumber?: string;
  contractId?: string;           // Linked MaintenanceContract
  contractRef?: string;
  projectId?: string;
  receivedFor: string;           // نظير: دفعة مقدمة لعقد صيانة...
  receivedBy: string;            // اسم المحاسب أو المستلم
  notes?: string;
  createdAt: string;
}
