export type InventoryCategory =
  | 'TRACTION_DRIVE'
  | 'CONTROL_ELECTRICAL'
  | 'CAR_STRUCTURE'
  | 'CAR_INTERIOR'
  | 'DOORS_ENTRANCES'
  | 'GUIDE_RAILS'
  | 'ROPING_PULLEYS'
  | 'SAFETY_EQUIPMENT'
  | 'PIT_EQUIPMENT'
  | 'SPARE_PARTS'
  | 'CONSUMABLES';

export interface InventoryItem {
  id: string;                    // Internal ID e.g. "INV-DRV-01"
  sku: string;                   // Part code / SKU e.g. "MOT-PMSM-1000"
  nameAr: string;                // Arabic Name
  nameEn: string;                // English Name
  category: InventoryCategory;   // Category
  specification: string;         // Technical specifications
  quantityOnHand: number;        // Available physical stock
  quantityReserved: number;      // Reserved for approved elevator projects
  minStockLevel: number;         // Threshold for low stock alert
  unit: string;                  // 'set' | 'pcs' | 'meters' | 'kg' | 'box' | 'drum' | 'pair'
  unitCost: number;              // Cost in SAR
  sellingPrice?: number;         // Selling / Replacement price in SAR
  supplier: string;              // Manufacturer / Vendor
  vendorId?: string;             // Linked Vendor ID (e.g. "VND-TORIN")
  location: string;              // Warehouse bin / aisle e.g. "Riyadh Central - Aisle 3B"
  leadTimeDays: number;          // Procurement lead time in days
  lastRestockedAt?: string;      // Date string
  notes?: string;                // Internal notes
  compatibleWith?: string;       // Compatibility notes (e.g. MRL, MR, Hydraulic)
}

export interface Vendor {
  id: string;                    // Vendor ID e.g. "VND-TORIN"
  nameAr: string;                // Arabic Name e.g. "شركة تورين درايف لأنظمة الجر"
  nameEn: string;                // English Name e.g. "Torin Drive International"
  code: string;                  // Short code e.g. "TORIN"
  contactPerson: string;         // Contact representative
  phone: string;                 // Phone / Mobile number
  email: string;                 // Email address
  country: string;               // Country of Origin e.g. "China", "Germany", "Italy", "Spain", "Saudi Arabia"
  city?: string;                 // City
  categories: InventoryCategory[]; // Supplied Categories
  paymentTerms: string;          // e.g. "30 Days Net", "Cash on Delivery", "LC", "50% Advance"
  taxNumber?: string;            // Commercial Reg / VAT ID
  rating?: number;               // Quality rating (1 to 5)
  isApproved: boolean;           // Certified / Approved Vendor
  leadTimeDaysAvg: number;       // Average lead time in days
  notes?: string;
  website?: string;
  address?: string;
}

export type InventoryMovementType = 'IN' | 'OUT' | 'ADJUST' | 'RESERVE' | 'RELEASE';

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  itemId: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
  unit: string;
}

export interface PurchaseOrder {
  id: string;               // e.g. "po-101"
  poNumber: string;         // e.g. "PO-2026-1042"
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  vendorEmail?: string;
  vendorPhone?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  vatRate: number;          // e.g. 15
  vatAmount: number;
  totalAmount: number;
  paymentTerms: string;
  deliveryLocation: string;
  notes?: string;
  createdBy: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: InventoryMovementType;
  quantity: number;
  previousQty: number;
  newQty: number;
  date: string;
  referenceType?: 'PROJECT' | 'BREAKDOWN' | 'PURCHASE_ORDER' | 'MAINTENANCE' | 'MANUAL';
  referenceId?: string;          // e.g. Quote Ref TL-QT-2026-1024 or Breakdown ID
  referenceLabel?: string;       // e.g. "مشروع برج الأندلس"
  performedBy?: string;          // User / Technician name
  notes?: string;
}

export const INVENTORY_CATEGORIES_INFO: Record<
  InventoryCategory,
  { labelAr: string; labelEn: string; color: string; iconBg: string }
> = {
  TRACTION_DRIVE: {
    labelAr: 'محركات وآلات الجر (Drives)',
    labelEn: 'Traction Drive & Motor',
    color: 'text-amber-800 bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100 text-amber-700',
  },
  CONTROL_ELECTRICAL: {
    labelAr: 'لوحات التحكم والكهرباء',
    labelEn: 'Control System & Inverter',
    color: 'text-blue-800 bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100 text-blue-700',
  },
  CAR_STRUCTURE: {
    labelAr: 'هياكل الصواعد والأثقال (Slings)',
    labelEn: 'Car Sling & Assembly',
    color: 'text-indigo-800 bg-indigo-50 border-indigo-200',
    iconBg: 'bg-indigo-100 text-indigo-700',
  },
  CAR_INTERIOR: {
    labelAr: 'تشطيبات وتجهيزات الكابينة',
    labelEn: 'Cabin Interior & Finishes',
    color: 'text-purple-800 bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100 text-purple-700',
  },
  DOORS_ENTRANCES: {
    labelAr: 'أبواب ومحركات الأبواب',
    labelEn: 'Automatic Doors & Headers',
    color: 'text-teal-800 bg-teal-50 border-teal-200',
    iconBg: 'bg-teal-100 text-teal-700',
  },
  GUIDE_RAILS: {
    labelAr: 'سكك التوجيه والمثبتات (Rails)',
    labelEn: 'Guide Rails & Brackets',
    color: 'text-slate-800 bg-slate-100 border-slate-300',
    iconBg: 'bg-slate-200 text-slate-700',
  },
  ROPING_PULLEYS: {
    labelAr: 'حبال الجر والبكرات (Ropes)',
    labelEn: 'Suspension Ropes & Pulleys',
    color: 'text-orange-800 bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100 text-orange-700',
  },
  SAFETY_EQUIPMENT: {
    labelAr: 'أجهزة السلامة وجهاز الطوارئ (ARD)',
    labelEn: 'Safety Devices & ARD',
    color: 'text-rose-800 bg-rose-50 border-rose-200',
    iconBg: 'bg-rose-100 text-rose-700',
  },
  PIT_EQUIPMENT: {
    labelAr: 'معدات حفرة البئر والمخمدات',
    labelEn: 'Pit Equipment & Buffers',
    color: 'text-cyan-800 bg-cyan-50 border-cyan-200',
    iconBg: 'bg-cyan-100 text-cyan-700',
  },
  SPARE_PARTS: {
    labelAr: 'قطع الغيار السريعة للصيانة',
    labelEn: 'Maintenance Spare Parts',
    color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  CONSUMABLES: {
    labelAr: 'الزيوت والمستهلكات الدورية',
    labelEn: 'Oils & Consumables',
    color: 'text-yellow-800 bg-yellow-50 border-yellow-200',
    iconBg: 'bg-yellow-100 text-yellow-700',
  },
};
