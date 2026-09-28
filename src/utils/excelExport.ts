import * as XLSX from 'xlsx';
import { ElevatorSpecification, ComponentItem, DisbursementStatement, Customer } from '../types/elevator';
import { AutoSyncLogEntry } from '../types/settings';
import { InventoryItem, InventoryMovement, INVENTORY_CATEGORIES_INFO } from '../types/inventory';

export interface CustomerGroupExport {
  customer: Customer;
  projects: ElevatorSpecification[];
  totalValue?: number;
  wonValue?: number;
  wonCount?: number;
  latestActivityDate?: string;
}

/**
 * Utility to calculate column widths based on content
 */
function fitToColumnWidths(data: (string | number)[][]): XLSX.ColInfo[] {
  const colWidths: number[] = [];

  data.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const cellLen = cell !== null && cell !== undefined ? String(cell).length : 0;
      // Multi-byte or Arabic characters take a bit more visual width
      const visualLen = Math.max(cellLen, Math.ceil(cellLen * 1.15));
      colWidths[colIndex] = Math.max(colWidths[colIndex] || 8, visualLen + 3);
    });
  });

  return colWidths.map((w) => ({ wch: Math.min(Math.max(w, 10), 60) }));
}

/**
 * 1. Export Bill of Materials (BOM) to Excel (.xlsx)
 * Contains both a detailed BOM sheet and a Project Specification Summary sheet.
 */
export function exportBomToExcel(
  spec: ElevatorSpecification,
  components: ComponentItem[],
  customFilename?: string
): void {
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: Bill of Materials (BOM) ---
  const bomRows: (string | number)[][] = [
    ['شركة تقنية الروافع المحدودة (توينز) - بيان جدول المكونات وقطع الغيار (BOM)'],
    ['رقم عرض السعر:', spec.quoteRef, 'اسم المشروع:', spec.projectName],
    ['اسم العميل:', spec.clientName, 'تاريخ الإعداد:', spec.date],
    ['نوع المصعد:', spec.elevatorType, 'الحمولة والركاب:', `${spec.capacityKg} كجم (${spec.personsCount} ركاب)`],
    ['السرعة المقررة:', `${spec.ratedSpeed} م/ث`, 'عدد الوقفات / المداخل:', `${spec.stops} وقفات / ${spec.openings} مداخل`],
    ['مقاسات البئر (عرض×عمق):', `${spec.shaftWidthMm} × ${spec.shaftDepthMm} مم`, 'مقاسات الكابينة (عرض×عمق×ارتفاع):', `${spec.cabinWidthMm} × ${spec.cabinDepthMm} × ${spec.cabinHeightMm} مم`],
    ['نوع وأبعاد الباب:', `${spec.doorType} - ${spec.doorWidthMm} × ${spec.doorHeightMm} مم`, 'إجمالي تكلفة المكونات:', `${(spec.subtotalCost || 0).toLocaleString()} ر.س`],
    [], // Blank separator row
    [
      'م',
      'رمز الصنف (Item ID)',
      'تصنيف المكون (Category)',
      'اسم القطعة أو المكون (Component Name)',
      'المواصفات الفنية المعتمدة (Specifications)',
      'الكمية',
      'الوحدة',
      'سعر الوحدة (ر.س)',
      'إجمالي التكلفة (ر.س)',
      'المورد المعتمد (Supplier)',
    ],
  ];

  let totalQty = 0;
  let totalCost = 0;

  components.forEach((item, index) => {
    totalQty += item.quantity || 0;
    totalCost += item.totalCost || 0;

    bomRows.push([
      index + 1,
      item.id,
      item.category,
      item.name,
      item.specification,
      item.quantity,
      item.unit,
      item.unitCost,
      item.totalCost,
      item.supplier,
    ]);
  });

  // Summary Row at end of BOM
  bomRows.push([]);
  bomRows.push([
    '',
    '',
    '',
    'الإجمالي الكلي لجدول المكونات',
    `إجمالي الأصناف: ${components.length} صنف`,
    totalQty,
    'قطعة / وحدة',
    '',
    totalCost,
    'شركة تقنية الروافع المعتمدة',
  ]);

  const wsBom = XLSX.utils.aoa_to_sheet(bomRows);
  wsBom['!cols'] = fitToColumnWidths(bomRows);

  XLSX.utils.book_append_sheet(wb, wsBom, 'قائمة_المكونات_BOM');

  // --- SHEET 2: Technical Specifications Summary ---
  const specRows: (string | number)[][] = [
    ['ملخص المواصفات الفنية والهندسية للمشروع'],
    [],
    ['البيان الهندسي', 'المواصفة الفنية'],
    ['رقم العرض المرجعي', spec.quoteRef],
    ['اسم المشروع', spec.projectName],
    ['العميل والمالك', spec.clientName],
    ['تاريخ العرض', spec.date],
    ['نوع المصعد', spec.elevatorType],
    ['الحمولة المقررة', `${spec.capacityKg} كجم`],
    ['سعة الركاب', `${spec.personsCount} ركاب`],
    ['السرعة الاسمية', `${spec.ratedSpeed} م/ث`],
    ['عدد الوقفات', spec.stops],
    ['عدد المداخل والفتحات', spec.openings],
    ['عرض البئر', `${spec.shaftWidthMm} مم`],
    ['عمق البئر', `${spec.shaftDepthMm} مم`],
    ['عرض الكابينة الداخلي', `${spec.cabinWidthMm} مم`],
    ['عمق الكابينة الداخلي', `${spec.cabinDepthMm} مم`],
    ['ارتفاع الكابينة الصافي', `${spec.cabinHeightMm} مم`],
    ['عرض فتحة الباب', `${spec.doorWidthMm} مم`],
    ['ارتفاع فتحة الباب', `${spec.doorHeightMm} مم`],
    ['نوع حركة الأبواب', spec.doorType],
    ['نظام الجر والتعليق', spec.ropingRatio ? `${spec.ropingRatio} Roping` : '2:1 Roping'],
    ['موقع المحرك وغرفة الماكينة', spec.machineLocation || 'MRL_TOP'],
    ['مصدر وتغذية الكهرباء', spec.powerSupply || '380V / 3-Phase / 60Hz'],
    ['إجمالي تكلفة المكونات (ر.س)', spec.subtotalCost || 0],
    ['سعر البيع النهائي للعميل (ر.س)', spec.totalQuotationPrice || 0],
    ['مجمل الربح التقديري (ر.س)', spec.grossProfit || 0],
    ['نسبة هامش الربح', `${spec.grossMarginPercent || 0}%`],
  ];

  const wsSpec = XLSX.utils.aoa_to_sheet(specRows);
  wsSpec['!cols'] = fitToColumnWidths(specRows);

  XLSX.utils.book_append_sheet(wb, wsSpec, 'المواصفات_الفنية');

  const filename =
    customFilename || `${spec.quoteRef || 'BOM'}_قائمة_المكونات_وقطع_الغيار_ERP.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 2. Export Site Disbursement Statement to Excel (.xlsx)
 */
export function exportDisbursementToExcel(
  statement: DisbursementStatement,
  spec: ElevatorSpecification,
  deliveredItems: Record<number, { delivered: boolean; deliveredAt?: string }> = {}
): void {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ['شركة تقنية الروافع للتجارة HTH - بيان مقرر الصرف وتوريدات الموقع'],
    ['الرقم المرجعي للمقرر:', statement.docRef, 'التاريخ:', statement.date],
    ['المشروع:', spec.projectName, 'العميل:', spec.clientName],
    ['إجمالي تكلفة الصرف المقررة:', `${(statement.totalCostSar || 0).toLocaleString()} ر.س`],
    [],
    [
      'م',
      'المرحلة الإنشائية والتنفيذية',
      'البضاعة المطلوبة للموقع',
      'الوحدة',
      'الكمية',
      'السعر الإفرادي (ر.س)',
      'إجمالي الصرف (ر.س)',
      'حالة التوريد للموقع',
      'تاريخ التوريد',
      'الملاحظات والمواصفات',
    ],
  ];

  statement.stages.forEach((stage) => {
    stage.items.forEach((item) => {
      const isDelivered = deliveredItems[item.seq]?.delivered ? 'تم التوريد للموقع' : 'قيد التوريد';
      const delDate = deliveredItems[item.seq]?.deliveredAt || '';
      rows.push([
        item.seq,
        stage.stageNameAr,
        item.nameAr,
        item.unitAr,
        item.quantity,
        item.unitPriceSar,
        item.totalPriceSar,
        isDelivered,
        delDate,
        item.notesAr,
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = fitToColumnWidths(rows);

  XLSX.utils.book_append_sheet(wb, ws, 'مقرر_الصرف_والتوريد');

  const sanitizedDocRef = statement.docRef.replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `بيان_مقرر_الصرف_وتوريد_الموقع_${sanitizedDocRef}_${spec.clientName || 'مشروع'}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 3. Export CRM Customers & Projects Directory to Excel (.xlsx)
 */
export function exportCrmProjectsToExcel(
  customerGroups: CustomerGroupExport[],
  customFilename?: string
): void {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ['سجل العملاء والمشاريع وعروض الأسعار - تقنية الروافع ERP'],
    [
      'اسم العميل',
      'الشركة / المنشأة',
      'رقم الهاتف',
      'البريد الإلكتروني',
      'الموقع / المدينة',
      'رقم العرض المرجعي',
      'اسم المشروع',
      'تاريخ الإضافة',
      'نوع المصعد',
      'الحمولة (كجم)',
      'السرعة (م/ث)',
      'عدد الوقفات',
      'سعر العرض (ر.س)',
      'هامش الربح (%)',
      'حالة المشروع',
    ],
  ];

  customerGroups.forEach((grp) => {
    const c = grp.customer;
    if (grp.projects.length === 0) {
      rows.push([
        c.name,
        c.company || '',
        c.phone || '',
        c.email || '',
        c.location || '',
        '-',
        '-',
        c.createdAt || '',
        '-',
        '-',
        '-',
        '-',
        0,
        0,
        'عميل بدون مشاريع نشطة',
      ]);
    } else {
      grp.projects.forEach((p) => {
        rows.push([
          c.name,
          c.company || '',
          c.phone || '',
          c.email || '',
          c.location || '',
          p.quoteRef,
          p.projectName,
          p.date,
          p.elevatorType,
          p.capacityKg,
          p.ratedSpeed,
          p.stops,
          p.totalQuotationPrice,
          p.grossMarginPercent,
          p.status,
        ]);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = fitToColumnWidths(rows);

  XLSX.utils.book_append_sheet(wb, ws, 'سجل_العملاء_والمشاريع');

  const filename =
    customFilename || `Elevator_CRM_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 4. General Quotation & BOM Excel Export (Drop-in replacement for CSV exports)
 */
export function exportQuotationAsExcel(
  spec: ElevatorSpecification,
  components: ComponentItem[],
  customFilename?: string
): void {
  exportBomToExcel(spec, components, customFilename);
}

/**
 * 5. Export Google Sheets Auto-Sync Health & Activity Logs to Excel (.xlsx)
 * Designed for audit, compliance, and integration diagnostics.
 */
export function exportSyncLogsToExcel(
  logs: AutoSyncLogEntry[],
  sheetsConfig?: { spreadsheetId?: string; sheetUrl?: string; lastSyncedAt?: string },
  customFilename?: string
): void {
  const wb = XLSX.utils.book_new();

  const exportDate = new Date().toLocaleString();
  const spreadsheetId = sheetsConfig?.spreadsheetId || 'Not Configured';
  const lastSyncTime = sheetsConfig?.lastSyncedAt || 'N/A';

  const rows: (string | number)[][] = [
    ['شركة توينز لتكنولوجيا المصاعد - تقرير وتدقيق مزامنة جداول Google Sheets (Auto-Sync Audit Log)'],
    ['تاريخ التصدير:', exportDate, 'إجمالي السجلات المسجلة:', logs.length],
    ['معرف جدول Google Sheets:', spreadsheetId, 'آخر توقيت مزامنة ناجحة:', lastSyncTime],
    [], // Blank separator row
    [
      'م (#)',
      'التوقيت (Timestamp)',
      'الحالة (Status)',
      'نوع المحفز (Trigger Type)',
      'الرسالة / الملخص (Message)',
      'عدد المشاريع المزامنة (Projects Count)',
      'بيانات إضافية (Details / Target)',
      'تفاصيل الخطأ (Encountered Error / Exception)',
    ],
  ];

  if (logs.length === 0) {
    rows.push(['-', 'لا توجد سجلات مسجلة بعد', 'INFO', '-', 'سجل المزامنة فارغ', 0, '-', '-']);
  } else {
    logs.forEach((entry, idx) => {
      let statusLabel = 'نجاح (Success)';
      if (entry.status === 'error') statusLabel = 'فشل (Error)';
      else if (entry.status === 'warning') statusLabel = 'تنبيه (Warning)';
      else if (entry.status === 'info') statusLabel = 'معلومات (Info)';

      let triggerLabel = 'تنشيط النافذة (Window Focus)';
      if (entry.trigger === 'interval') triggerLabel = 'دورية منتظمة (Periodic Interval)';
      else if (entry.trigger === 'manual') triggerLabel = 'مزامنة يدوية (Manual Push)';

      rows.push([
        idx + 1,
        entry.timestamp,
        statusLabel,
        triggerLabel,
        entry.message,
        typeof entry.projectCount === 'number' ? entry.projectCount : 0,
        entry.details || '-',
        entry.error || '-',
      ]);
    });
  }

  // Summary statistics row
  const successCount = logs.filter((l) => l.status === 'success').length;
  const errorCount = logs.filter((l) => l.status === 'error').length;
  const healthRate = logs.length > 0 ? `${Math.round((successCount / logs.length) * 100)}%` : '100%';

  rows.push([]);
  rows.push([
    '',
    'ملخص التدقيق العام:',
    `العمليات الناجحة: ${successCount}`,
    `الأخطاء المسجلة: ${errorCount}`,
    `معدل الصحة العامة: ${healthRate}`,
    `المشاريع المحدثة: ${logs.reduce((acc, curr) => acc + (curr.projectCount || 0), 0)}`,
    `النظام: Twins Lift ERP`,
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = fitToColumnWidths(rows);

  XLSX.utils.book_append_sheet(wb, ws, 'سجل_مزامنة_Google_Sheets');

  const filename =
    customFilename || `Google_Sheets_Sync_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * 6. Export Inventory Items & Stock Valuation Report to Excel (.xlsx)
 */
export function exportInventoryToExcel(
  items: InventoryItem[],
  movements: InventoryMovement[] = [],
  customFilename?: string
): void {
  const wb = XLSX.utils.book_new();
  const exportDate = new Date().toLocaleString();

  // --- SHEET 1: Stock Inventory Registry & Valuation ---
  const stockRows: (string | number)[][] = [
    ['شركة توينز لتكنولوجيا المصاعد - تقرير جرد المستودع وتقييم المخزون العام'],
    ['تاريخ إعداد التقرير:', exportDate, 'إجمالي الأصناف بالمستودع:', items.length],
    [], // Blank row
    [
      'م',
      'كود الصنف (SKU)',
      'اسم القطعة / الصنف بالعربية',
      'الاسم بالإنجليزية',
      'التصنيف المخزني',
      'المواصفات الفنية المعتمدة',
      'الرصيد المتاح (On Hand)',
      'الكمية المحجوزة للمشاريع',
      'الحد الأدنى للطلب',
      'حالة التوفر',
      'الوحدة',
      'سعر التكلفة (ر.س)',
      'سعر البيع المقترح (ر.س)',
      'إجمالي قيمة المخزون (ر.س)',
      'المورد المعتمد',
      'موقع التخزين بالمستودع',
      'فترة التوريد (أيام)',
      'تاريخ آخر توريد',
      'ملاحظات الصنف',
    ],
  ];

  let totalStockQty = 0;
  let totalReservedQty = 0;
  let totalValuation = 0;
  let lowStockCount = 0;

  items.forEach((item, index) => {
    const totalItemVal = item.quantityOnHand * item.unitCost;
    totalStockQty += item.quantityOnHand;
    totalReservedQty += item.quantityReserved || 0;
    totalValuation += totalItemVal;

    let stockStatus = 'متوفر (In Stock)';
    if (item.quantityOnHand <= 0) {
      stockStatus = 'نافد (Out of Stock)';
      lowStockCount++;
    } else if (item.quantityOnHand <= item.minStockLevel) {
      stockStatus = 'منخفض - يلزم إعادة الطلب (Low Stock)';
      lowStockCount++;
    }

    const categoryInfo = INVENTORY_CATEGORIES_INFO[item.category];
    const categoryName = categoryInfo ? categoryInfo.labelAr : item.category;

    stockRows.push([
      index + 1,
      item.sku,
      item.nameAr,
      item.nameEn,
      categoryName,
      item.specification,
      item.quantityOnHand,
      item.quantityReserved || 0,
      item.minStockLevel,
      stockStatus,
      item.unit,
      item.unitCost,
      item.sellingPrice || Math.round(item.unitCost * 1.35),
      totalItemVal,
      item.supplier,
      item.location,
      item.leadTimeDays,
      item.lastRestockedAt || '-',
      item.notes || '',
    ]);
  });

  // Summary Row
  stockRows.push([]);
  stockRows.push([
    '',
    'الإجمالي العام للمخزون:',
    `إجمالي الأصناف: ${items.length} صنف`,
    '',
    '',
    `إجمالي النواقص: ${lowStockCount} صنف`,
    totalStockQty,
    totalReservedQty,
    '',
    '',
    'وحدة / طقم',
    '',
    '',
    totalValuation,
    'شركة تقنية الروافع المحدودة (توينز)',
    'جميع المستودعات',
    '',
    '',
    'تقرير جرد معتمد',
  ]);

  const wsStock = XLSX.utils.aoa_to_sheet(stockRows);
  wsStock['!cols'] = fitToColumnWidths(stockRows);
  XLSX.utils.book_append_sheet(wb, wsStock, 'جرد_المستودع_والمخزون');

  // --- SHEET 2: Inventory Movements Log ---
  if (movements && movements.length > 0) {
    const movementRows: (string | number)[][] = [
      ['سجل حركات الإدخال والإخراج وحجز المكونات للمشاريع'],
      ['تاريخ التصدير:', exportDate, 'إجمالي الحركات المسجلة:', movements.length],
      [],
      [
        'م',
        'التاريخ والتوقيت',
        'نوع الحركة',
        'كود الصنف (SKU)',
        'اسم الصنف',
        'الكمية',
        'الرصيد السابق',
        'الرصيد بعد الحركة',
        'المرجع / نوع العملية',
        'رقم المرجع (مشروع/بلاغ)',
        'بيان العملية',
        'المنفذ / المسؤول',
        'ملاحظات الحركة',
      ],
    ];

    movements.forEach((mov, idx) => {
      let typeLabel = 'إضافة وتوريد (IN)';
      if (mov.type === 'OUT') typeLabel = 'صرف وإخراج (OUT)';
      else if (mov.type === 'RESERVE') typeLabel = 'حجز لمشروع (RESERVE)';
      else if (mov.type === 'RELEASE') typeLabel = 'فك حجز (RELEASE)';
      else if (mov.type === 'ADJUST') typeLabel = 'تسوية جردية (ADJUST)';

      movementRows.push([
        idx + 1,
        mov.date,
        typeLabel,
        mov.sku,
        mov.itemName,
        mov.quantity,
        mov.previousQty,
        mov.newQty,
        mov.referenceType || 'MANUAL',
        mov.referenceId || '-',
        mov.referenceLabel || '-',
        mov.performedBy || 'المسؤول',
        mov.notes || '',
      ]);
    });

    const wsMovements = XLSX.utils.aoa_to_sheet(movementRows);
    wsMovements['!cols'] = fitToColumnWidths(movementRows);
    XLSX.utils.book_append_sheet(wb, wsMovements, 'سجل_الحركات_المخزنية');
  }

  const filename =
    customFilename || `Elevator_Inventory_Valuation_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}


