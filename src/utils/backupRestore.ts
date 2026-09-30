/**
 * Full System Backup & Restore Utility for Twins Elevators ERP
 * Allows complete data export & import via JSON file.
 */

export interface SystemBackupData {
  version: string;
  timestamp: string;
  exportedBy?: string;
  metadata: {
    projectsCount: number;
    customersCount: number;
    contractsCount: number;
    breakdownsCount: number;
    employeesCount: number;
    inventoryCount: number;
    vendorsCount: number;
    purchaseOrdersCount: number;
  };
  data: {
    projects: any[];
    activeSpec: any;
    customers: any[];
    maintenanceContracts: any[];
    breakdowns: any[];
    employees: any[];
    attendanceRecords: any[];
    inventory: any[];
    inventoryMovements: any[];
    vendors: any[];
    purchaseOrders: any[];
    settings: any;
    sheetsConfig: any;
  };
}

const STORAGE_KEYS = {
  PROJECTS: 'vvt_elevator_projects_v1',
  ACTIVE_SPEC: 'vvt_elevator_active_spec_v1',
  CUSTOMERS: 'vvt_elevator_customers_v1',
  MAINTENANCE: 'vvt_elevator_maintenance_contracts_v1',
  EMPLOYEES: 'vvt_elevator_employees_v1',
  ATTENDANCE: 'vvt_elevator_attendance_records_v1',
  SHEETS_CONFIG: 'vvt_elevator_sheets_config_v1',
  BREAKDOWNS: 'vvt_elevator_breakdowns_v1',
  SETTINGS: 'vvt_elevator_settings_v1',
  INVENTORY: 'vvt_elevator_inventory_v1',
  INVENTORY_MOVEMENTS: 'vvt_elevator_inventory_movements_v1',
  VENDORS: 'vvt_elevator_vendors_v1',
  PURCHASE_ORDERS: 'vvt_elevator_purchase_orders_v1',
};

/**
 * Creates and triggers download of a complete system backup JSON file.
 */
export function exportSystemBackup(): void {
  try {
    const getStored = (key: string, fallback: any = []) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch {
        return fallback;
      }
    };

    const projects = getStored(STORAGE_KEYS.PROJECTS, []);
    const activeSpec = getStored(STORAGE_KEYS.ACTIVE_SPEC, null);
    const customers = getStored(STORAGE_KEYS.CUSTOMERS, []);
    const maintenanceContracts = getStored(STORAGE_KEYS.MAINTENANCE, []);
    const breakdowns = getStored(STORAGE_KEYS.BREAKDOWNS, []);
    const employees = getStored(STORAGE_KEYS.EMPLOYEES, []);
    const attendanceRecords = getStored(STORAGE_KEYS.ATTENDANCE, []);
    const inventory = getStored(STORAGE_KEYS.INVENTORY, []);
    const inventoryMovements = getStored(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
    const vendors = getStored(STORAGE_KEYS.VENDORS, []);
    const purchaseOrders = getStored(STORAGE_KEYS.PURCHASE_ORDERS, []);
    const settings = getStored(STORAGE_KEYS.SETTINGS, null);
    const sheetsConfig = getStored(STORAGE_KEYS.SHEETS_CONFIG, null);

    const backupObject: SystemBackupData = {
      version: '2.5.0',
      timestamp: new Date().toISOString(),
      metadata: {
        projectsCount: Array.isArray(projects) ? projects.length : 0,
        customersCount: Array.isArray(customers) ? customers.length : 0,
        contractsCount: Array.isArray(maintenanceContracts) ? maintenanceContracts.length : 0,
        breakdownsCount: Array.isArray(breakdowns) ? breakdowns.length : 0,
        employeesCount: Array.isArray(employees) ? employees.length : 0,
        inventoryCount: Array.isArray(inventory) ? inventory.length : 0,
        vendorsCount: Array.isArray(vendors) ? vendors.length : 0,
        purchaseOrdersCount: Array.isArray(purchaseOrders) ? purchaseOrders.length : 0,
      },
      data: {
        projects,
        activeSpec,
        customers,
        maintenanceContracts,
        breakdowns,
        employees,
        attendanceRecords,
        inventory,
        inventoryMovements,
        vendors,
        purchaseOrders,
        settings,
        sheetsConfig,
      },
    };

    const jsonString = JSON.stringify(backupObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const fileName = `Twins_Elevators_Full_Backup_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export backup:', error);
    throw error;
  }
}

/**
 * Validates an uploaded JSON string and parses the backup metadata.
 */
export function validateBackupFile(fileContent: string): SystemBackupData {
  const parsed = JSON.parse(fileContent);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('الملف غير صالح أو فارغ');
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    throw new Error('هيكل ملف النسخ الاحتياطي غير متوافق');
  }

  return parsed as SystemBackupData;
}

/**
 * Restores data from the parsed backup object into LocalStorage.
 */
export function restoreSystemBackup(backup: SystemBackupData): {
  success: boolean;
  restoredItemsSummary: string;
} {
  try {
    const { data } = backup;

    if (Array.isArray(data.projects)) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
    }
    if (data.activeSpec) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SPEC, JSON.stringify(data.activeSpec));
    }
    if (Array.isArray(data.customers)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
    }
    if (Array.isArray(data.maintenanceContracts)) {
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(data.maintenanceContracts));
    }
    if (Array.isArray(data.breakdowns)) {
      localStorage.setItem(STORAGE_KEYS.BREAKDOWNS, JSON.stringify(data.breakdowns));
    }
    if (Array.isArray(data.employees)) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(data.employees));
    }
    if (Array.isArray(data.attendanceRecords)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data.attendanceRecords));
    }
    if (Array.isArray(data.inventory)) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(data.inventory));
    }
    if (Array.isArray(data.inventoryMovements)) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, JSON.stringify(data.inventoryMovements));
    }
    if (Array.isArray(data.vendors)) {
      localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(data.vendors));
    }
    if (Array.isArray(data.purchaseOrders)) {
      localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(data.purchaseOrders));
    }
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    if (data.sheetsConfig) {
      localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(data.sheetsConfig));
    }

    const summary = `${data.projects?.length || 0} مشاريع، ${data.customers?.length || 0} عملاء، ${data.maintenanceContracts?.length || 0} عقود، ${data.inventory?.length || 0} أصناف مخزون`;

    return {
      success: true,
      restoredItemsSummary: summary,
    };
  } catch (error) {
    console.error('Failed to restore backup:', error);
    throw error;
  }
}
