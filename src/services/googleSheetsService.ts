import { ElevatorSpecification, ComponentItem, GoogleSheetsConfig } from '../types/elevator';
import { InventoryItem } from '../types/inventory';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

const STORAGE_KEY_CONFIG = 'elevator_app_sheets_config';
const STORAGE_KEY_TOKEN = 'elevator_app_google_token';

export function getStoredSheetsConfig(): GoogleSheetsConfig {
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    spreadsheetId: '',
    spreadsheetUrl: '',
    spreadsheetTitle: 'Elevator Quotations & Projects Database',
    isConnected: false,
  };
}

export function saveSheetsConfig(config: GoogleSheetsConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export function getStoredAccessToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setStoredAccessToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
}

/**
 * Creates a structured Google Spreadsheet for the Elevator Quotations & Projects database
 */
export async function createElevatorSpreadsheet(accessToken: string, title?: string): Promise<{ id: string; url: string; spreadsheetId: string; spreadsheetUrl: string }> {
  const spreadsheetTitle = title || `Elevator Quotations & Engineering Database - ${new Date().toISOString().split('T')[0]}`;
  
  const payload = {
    properties: {
      title: spreadsheetTitle,
    },
    sheets: [
      {
        properties: {
          title: 'Quotations_Summary',
          gridProperties: { rowCount: 200, columnCount: 16 },
        },
      },
      {
        properties: {
          title: 'BOM_Components',
          gridProperties: { rowCount: 300, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'Shaft_Cabin_Specs',
          gridProperties: { rowCount: 200, columnCount: 16 },
        },
      },
      {
        properties: {
          title: 'Material_Cost_Benchmarks',
          gridProperties: { rowCount: 100, columnCount: 6 },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Google Sheet: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize Headers for each sheet tab
  await initializeSheetHeaders(spreadsheetId, accessToken);

  return { 
    id: spreadsheetId, 
    url: spreadsheetUrl,
    spreadsheetId,
    spreadsheetUrl
  };
}

export const createElevatorQuotationSheet = createElevatorSpreadsheet;

/**
 * Populates header rows and formatting for all sheets
 */
export async function initializeSheetHeaders(spreadsheetId: string, accessToken: string): Promise<void> {
  const headers = [
    {
      range: 'Quotations_Summary!A1:N1',
      values: [
        [
          'Quote Ref',
          'Project Name',
          'Client Name',
          'Date',
          'Elevator Type',
          'Capacity (kg)',
          'Speed (m/s)',
          'Stops',
          'Travel (m)',
          'Subtotal Cost (SAR)',
          'Quotation Price (SAR)',
          'Gross Profit (SAR)',
          'Margin (%)',
          'Status',
        ],
      ],
    },
    {
      range: 'BOM_Components!A1:J1',
      values: [
        [
          'Quote Ref',
          'Item ID',
          'Category',
          'Component Name',
          'Engineering Specification',
          'Qty',
          'Unit',
          'Unit Cost (SAR)',
          'Total Cost (SAR)',
          'Supplier',
        ],
      ],
    },
    {
      range: 'Shaft_Cabin_Specs!A1:N1',
      values: [
        [
          'Quote Ref',
          'Project Name',
          'Shaft Width (mm)',
          'Shaft Depth (mm)',
          'Pit Depth (mm)',
          'Overhead (mm)',
          'Cabin Width (mm)',
          'Cabin Depth (mm)',
          'Cabin Height (mm)',
          'Door Type',
          'Door Width (mm)',
          'CWT Position',
          'Wall Finish',
          'ARD Backup',
        ],
      ],
    },
  ];

  for (const header of headers) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(header.range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: header.values }),
      }
    );
  }
}

/**
 * Appends a full quotation and its components to the linked Google Sheet
 */
export async function appendQuotationToSheet(
  param1: string,
  param2: string,
  spec: ElevatorSpecification,
  components: ComponentItem[]
): Promise<void> {
  const isParam1Token = param1.startsWith('ya29') || param1.length > 60;
  const accessToken = isParam1Token ? param1 : param2;
  const spreadsheetId = isParam1Token ? param2 : param1;

  // 1. Append summary row
  const summaryRow = [
    spec.quoteRef,
    spec.projectName,
    spec.clientName,
    spec.date,
    spec.elevatorType,
    spec.capacityKg,
    spec.ratedSpeed,
    spec.stops,
    spec.travelHeightM,
    spec.subtotalCost,
    spec.totalQuotationPrice,
    spec.grossProfit,
    spec.grossMarginPercent,
    spec.status,
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Quotations_Summary!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [summaryRow] }),
    }
  );

  // 2. Append technical specs row
  const specRow = [
    spec.quoteRef,
    spec.projectName,
    spec.shaftWidthMm,
    spec.shaftDepthMm,
    spec.pitDepthMm,
    spec.overheadHeightMm,
    spec.cabinWidthMm,
    spec.cabinDepthMm,
    spec.cabinHeightMm,
    spec.doorType,
    spec.doorWidthMm,
    spec.counterweightPosition,
    spec.wallFinish,
    spec.automaticRescueDeviceARD ? 'YES' : 'NO',
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Shaft_Cabin_Specs!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [specRow] }),
    }
  );

  // 3. Append component rows
  const componentRows = components.map((item) => [
    spec.quoteRef,
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

  if (componentRows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/BOM_Components!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: componentRows }),
      }
    );
  }
}

/**
 * Synchronizes all historical projects to Google Sheet
 */
export async function syncAllProjectsToSheet(
  param1: string,
  param2: string,
  projects: ElevatorSpecification[]
): Promise<number> {
  const isParam1Token = param1.startsWith('ya29') || param1.length > 60;
  const accessToken = isParam1Token ? param1 : param2;
  const spreadsheetId = isParam1Token ? param2 : param1;

  const rows = projects.map((spec) => [
    spec.quoteRef,
    spec.projectName,
    spec.clientName,
    spec.date,
    spec.elevatorType,
    spec.capacityKg,
    spec.ratedSpeed,
    spec.stops,
    spec.travelHeightM,
    spec.subtotalCost,
    spec.totalQuotationPrice,
    spec.grossProfit,
    spec.grossMarginPercent,
    spec.status,
  ]);

  // Clear existing data except header
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Quotations_Summary!A2:N200:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Write new rows
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Quotations_Summary!A2?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to sync projects: ${response.status}`);
  }

  return rows.length;
}

/**
 * Synchronize warehouse inventory items to Google Sheets
 */
export async function syncInventoryToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  inventory: InventoryItem[]
): Promise<number> {
  const headers = [
    'SKU / Part Code',
    'Item Name (Arabic)',
    'Item Name (English)',
    'Category',
    'Specification',
    'Quantity On Hand',
    'Quantity Reserved',
    'Min Stock Level',
    'Unit',
    'Unit Cost (SAR)',
    'Selling Price (SAR)',
    'Supplier',
    'Location',
    'Lead Time (Days)',
    'Last Restocked',
    'Notes',
  ];

  const rows = inventory.map((item) => [
    item.sku,
    item.nameAr,
    item.nameEn,
    item.category,
    item.specification,
    item.quantityOnHand,
    item.quantityReserved || 0,
    item.minStockLevel,
    item.unit,
    item.unitCost,
    item.sellingPrice || Math.round(item.unitCost * 1.35),
    item.supplier,
    item.location,
    item.leadTimeDays,
    item.lastRestockedAt || '',
    item.notes || '',
  ]);

  // First ensure tab exists or write to Quotations_Summary / Inventory
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Warehouse_Inventory',
                  gridProperties: { rowCount: Math.max(100, rows.length + 10), columnCount: 18 },
                },
              },
            },
          ],
        }),
      }
    );
  } catch (e) {
    // Sheet might already exist
  }

  // Clear existing
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Warehouse_Inventory!A1:Z500:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Write headers + data
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Warehouse_Inventory!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [headers, ...rows] }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to sync inventory: ${response.status}`);
  }

  return rows.length;
}

import { exportBomToExcel } from '../utils/excelExport';

/**
 * Generates downloadable Excel (.xlsx) file for the quotation & components BOM
 */
export function exportQuotationAsExcelFile(spec: ElevatorSpecification, components: ComponentItem[]): void {
  exportBomToExcel(spec, components);
}

/**
 * Backward compatibility: Redirects to Excel export
 */
export function exportQuotationAsCsv(spec: ElevatorSpecification, components: ComponentItem[]): string {
  exportBomToExcel(spec, components);
  return '';
}

/**
 * Triggers browser download of a file
 */
export function downloadCsvFile(filename: string, _content?: string): void {
  // Deprecated: No CSV files as requested by user, always triggers Excel export
  console.info('CSV export deprecated in favor of Excel (.xlsx) export:', filename);
}

