import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Check, 
  ExternalLink, 
  X, 
  Link, 
  PlusCircle, 
  UploadCloud, 
  AlertCircle,
  HelpCircle,
  Download
} from 'lucide-react';
import { 
  createElevatorQuotationSheet, 
  syncAllProjectsToSheet, 
  appendQuotationToSheet
} from '../services/googleSheetsService';
import { exportBomToExcel } from '../utils/excelExport';
import { ElevatorSpecification } from '../types/elevator';
import { generateComponentList } from '../utils/pricingEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: ElevatorSpecification[];
  currentSpec: ElevatorSpecification;
  isSheetsConnected: boolean;
  sheetsUrl?: string;
  spreadsheetId?: string;
  onConnected: (spreadsheetId: string, sheetUrl: string, accessToken: string) => void;
}

export const GoogleSheetsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  projects,
  currentSpec,
  isSheetsConnected,
  sheetsUrl,
  spreadsheetId,
  onConnected,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [sheetIdInput, setSheetIdInput] = useState('');
  const [sheetTitleInput, setSheetTitleInput] = useState('Twins Lift Calc - Quotations & Engineering BOM Database');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  // Extract ID if user pasted a full Google Sheets URL
  const cleanSpreadsheetId = (input: string): string => {
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  const handleCreateNewSheet = async () => {
    if (!tokenInput.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please provide a Google OAuth Access Token with Google Sheets & Drive permissions.',
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Creating new Elevator Engineering & Quotation Google Sheet in your Google Drive...' });

    try {
      const newSheet = await createElevatorQuotationSheet(tokenInput.trim(), sheetTitleInput);
      onConnected(newSheet.spreadsheetId, newSheet.spreadsheetUrl, tokenInput.trim());

      // Sync existing projects immediately
      if (projects.length > 0) {
        setStatusMessage({ type: 'info', text: `Syncing ${projects.length} historical project records to your new sheet...` });
        await syncAllProjectsToSheet(tokenInput.trim(), newSheet.spreadsheetId, projects);
      }

      setStatusMessage({
        type: 'success',
        text: `Successfully created and initialized Google Sheet: "${sheetTitleInput}"!`,
      });
    } catch (err: any) {
      console.error('Sheet creation error:', err);
      setStatusMessage({
        type: 'error',
        text: `Error creating Google Sheet: ${err.message || 'Check OAuth permissions.'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectExistingSheet = async () => {
    const cleanedId = cleanSpreadsheetId(sheetIdInput);
    if (!cleanedId) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Google Spreadsheet ID or URL.' });
      return;
    }
    if (!tokenInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a Google OAuth Access Token.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Connecting to existing Google Sheet...' });

    try {
      const url = `https://docs.google.com/spreadsheets/d/${cleanedId}/edit`;
      onConnected(cleanedId, url, tokenInput.trim());
      setStatusMessage({ type: 'success', text: `Successfully connected to Google Sheet!` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to connect: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickSyncNow = async () => {
    if (!spreadsheetId || !tokenInput.trim()) {
      setStatusMessage({ type: 'error', text: 'No active Google Sheet connection or token found.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Syncing all projects and current BOM to Google Sheets...' });

    try {
      await syncAllProjectsToSheet(tokenInput.trim(), spreadsheetId, projects);
      setStatusMessage({
        type: 'success',
        text: `All ${projects.length} project quotations successfully synchronized to Google Sheets!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Sync error: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadExcelFallback = () => {
    const components = generateComponentList(currentSpec);
    exportBomToExcel(currentSpec, components, `${currentSpec.quoteRef}_BOM_Excel_Export.xlsx`);
    setStatusMessage({
      type: 'success',
      text: 'Exported Excel (.xlsx) file! You can open it directly in Microsoft Excel or import into Google Sheets.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Google Sheets Integration &amp; Cloud Sync
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically store quotations, components list, and past project performance in Google Sheets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
            ) : (
              <UploadCloud className="w-4 h-4 mt-0.5 shrink-0 text-blue-600 animate-pulse" />
            )}
            <div>{statusMessage.text}</div>
          </div>
        )}

        {/* Current Connection Status */}
        {isSheetsConnected && sheetsUrl && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Linked to Active Google Sheet
              </div>
              <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                ID: {spreadsheetId}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={sheetsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Sheet
              </a>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleQuickSyncNow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-50 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Sync All Projects
              </button>
            </div>
          </div>
        )}

        {/* Token Input Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              Google OAuth 2.0 Access Token
            </label>
            <span className="text-[11px] text-slate-400">Required for live Google Sheets API</span>
          </div>

          <input
            type="password"
            placeholder="Paste your Bearer access token (from Google OAuth flow)..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <strong>Tip:</strong> The applet is registered with <code>spreadsheets</code> and <code>drive.file</code> OAuth scopes. If you are using the app in preview or standalone mode, enter your Google OAuth bearer token above, or use the 1-click Excel (.xlsx) export below to open in Google Sheets or Microsoft Excel instantly.
          </div>
        </div>

        {/* Option 1: Create New Google Sheet */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            Option A: Create New Quotations Database Spreadsheet
          </h4>

          <div className="flex gap-2">
            <input
              type="text"
              value={sheetTitleInput}
              onChange={(e) => setSheetTitleInput(e.target.value)}
              placeholder="Spreadsheet Title..."
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCreateNewSheet}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              {isProcessing ? 'Creating Sheet...' : 'Create in Google Drive'}
            </button>
          </div>
        </div>

        {/* Option 2: Connect Existing Sheet */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Link className="w-4 h-4 text-blue-600" />
            Option B: Connect Existing Google Sheet
          </h4>

          <div className="flex gap-2">
            <input
              type="text"
              value={sheetIdInput}
              onChange={(e) => setSheetIdInput(e.target.value)}
              placeholder="Paste Google Sheet URL or ID (e.g. 1BxiMVs0XRA5...)"
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConnectExistingSheet}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Connect Sheet
            </button>
          </div>
        </div>

        {/* Option 3: Offline 1-Click Excel */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-800">
              Offline Compatibility: Direct Excel (.xlsx) Export
            </div>
            <div className="text-[11px] text-slate-500">
              Download clean Excel (.xlsx) spreadsheet ready to open in Microsoft Excel or Google Sheets anytime.
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadExcelFallback}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Download Excel (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
};
