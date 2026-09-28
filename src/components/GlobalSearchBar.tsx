import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  Printer, 
  FileDown, 
  ExternalLink, 
  Building2, 
  Clock, 
  MapPin, 
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ElevatorSpecification, ProjectStatus } from '../types/elevator';
import { AppLanguage } from '../utils/translations';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';

interface GlobalSearchBarProps {
  projects: ElevatorSpecification[];
  language: AppLanguage;
  onSelectProject: (project: ElevatorSpecification, targetTab?: 'WIZARD' | 'PRINT' | 'DRAWINGS') => void;
  onExportProjectPdf?: (project: ElevatorSpecification) => void;
  className?: string;
}

const STATUS_CONFIG: Record<ProjectStatus, { bg: string; text: string; labelAr: string; labelEn: string }> = {
  Draft: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', labelAr: 'مسودة', labelEn: 'Draft' },
  Sent: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', labelAr: 'مرسل للعميل', labelEn: 'Sent' },
  Approved: { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800', labelAr: 'معتمد', labelEn: 'Approved' },
  Won: { bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800', labelAr: 'رابح ومنفذ', labelEn: 'Won' },
  Installed: { bg: 'bg-teal-50 border-teal-300', text: 'text-teal-800', labelAr: 'تم التركيب', labelEn: 'Installed' },
  Lost: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', labelAr: 'مستبعد', labelEn: 'Lost' },
};

// Normalize Arabic text for smart flexible search
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove tatweel / diacritics
    .trim();
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  projects,
  language,
  onSelectProject,
  onExportProjectPdf,
  className = '',
}) => {
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WON' | 'QUOTATIONS'>('ALL');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setIsMobileExpanded(true);
          setIsOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
          setIsOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsMobileExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter projects by client name, project ID, or quotation reference number
  const searchResults = useMemo(() => {
    const q = normalizeArabic(query);

    let list = projects;
    if (statusFilter === 'WON') {
      list = list.filter((p) => p.status === 'Won' || p.status === 'Approved' || p.status === 'Installed');
    } else if (statusFilter === 'QUOTATIONS') {
      list = list.filter((p) => p.status === 'Draft' || p.status === 'Sent');
    }

    if (!q) {
      // When empty query: show recent 5 projects
      return list.slice(0, 5);
    }

    return list.filter((p) => {
      const matchQuoteRef = normalizeArabic(p.quoteRef || '').includes(q);
      const matchId = normalizeArabic(p.id || '').includes(q);
      const matchClientName = normalizeArabic(p.clientName || '').includes(q);
      const matchProjectName = normalizeArabic(p.projectName || '').includes(q);
      const matchPhone = (p.clientPhone || '').includes(q);
      const matchLocation = normalizeArabic(p.siteLocation || '').includes(q);
      const matchConsultant = normalizeArabic(p.consultant || '').includes(q);

      return (
        matchQuoteRef ||
        matchId ||
        matchClientName ||
        matchProjectName ||
        matchPhone ||
        matchLocation ||
        matchConsultant
      );
    });
  }, [projects, query, statusFilter]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults.length, query]);

  // Keyboard navigation within dropdown
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[selectedIndex]) {
        handleOpenProject(searchResults[selectedIndex], 'PRINT');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleOpenProject = (project: ElevatorSpecification, tab: 'WIZARD' | 'PRINT' | 'DRAWINGS' = 'PRINT') => {
    onSelectProject(project, tab);
    setIsOpen(false);
    setIsMobileExpanded(false);
  };

  const handleDirectExportPdf = (e: React.MouseEvent, project: ElevatorSpecification) => {
    e.stopPropagation();
    if (onExportProjectPdf) {
      onExportProjectPdf(project);
    } else {
      onSelectProject(project, 'PRINT');
    }
    setIsOpen(false);
    setIsMobileExpanded(false);
  };

  return (
    <div ref={containerRef} className={`relative flex items-center justify-center ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Mobile Search Icon Button: visible only on mobile (< sm) */}
      <button
        type="button"
        onClick={() => {
          setIsMobileExpanded(true);
          setIsOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 80);
        }}
        className="sm:hidden p-2 rounded-xl text-amber-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
        title={isAr ? 'البحث عن المشاريع وعروض الأسعار' : 'Search projects & quotes'}
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* 2. Desktop Search Input Bar: visible on sm and up */}
      <div 
        className={`hidden sm:flex relative items-center h-10 w-full min-w-[220px] max-w-lg rounded-xl transition-all duration-200 ${
          isOpen && !isMobileExpanded
            ? 'bg-[#08172F] border-amber-400 shadow-md ring-2 ring-amber-400/20'
            : 'bg-[#122A54]/80 hover:bg-[#122A54] border-[#1E437E]'
        } border`}
      >
        <div className="ps-3 pe-2 flex items-center pointer-events-none text-amber-400 shrink-0">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={
            isAr
              ? 'بحث سريع بالعميل، كود المشروع، أو رقم العرض...'
              : 'Search client name, project ID, quote ref...'
          }
          className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-blue-200/50 focus:outline-hidden pe-8"
        />

        {/* Clear Button or Keyboard Shortcut Indicator */}
        <div className="pe-2.5 flex items-center gap-1.5 shrink-0">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-blue-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isAr ? 'مسح البحث' : 'Clear search'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-blue-200/60 bg-[#0A1D3D] rounded border border-blue-900/80 shadow-2xs select-none">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* 3. Mobile Full-Width Expanded Search Overlay */}
      {isMobileExpanded && (
        <div className="sm:hidden fixed inset-x-0 top-0 z-50 bg-[#0B1E3B] p-2.5 shadow-2xl border-b border-[#16335C] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center h-10 rounded-xl bg-[#08172F] border border-amber-400 shadow-sm ring-2 ring-amber-400/20">
              <div className="ps-3 pe-2 text-amber-400 shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!isOpen) setIsOpen(true);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  isAr
                    ? 'بحث سريع بالعميل، المشروع، أو العرض...'
                    : 'Search client, project, quote...'
                }
                className="w-full bg-transparent text-white text-xs placeholder:text-blue-200/50 focus:outline-hidden pe-2"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    mobileInputRef.current?.focus();
                  }}
                  className="pe-2.5 text-blue-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMobileExpanded(false);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl shrink-0 transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Dropdown Results Palette (Rendered either as mobile dropdown or desktop dropdown) */}
      {isOpen && (
        <div 
          className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150 text-slate-800 ${
            isMobileExpanded
              ? 'fixed inset-x-2 top-16 max-h-[75vh]'
              : 'hidden sm:block absolute start-0 end-0 top-full mt-2'
          }`}
          style={{ maxHeight: isMobileExpanded ? 'calc(80vh - 65px)' : 'min(500px, 80vh)' }}
        >
          {/* Header filter strip */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth max-w-full py-0.5">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? 'كافة المشاريع' : 'All Projects'} ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('WON')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  statusFilter === 'WON'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? 'المعتمدة / الرابحة' : 'Won & Approved'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('QUOTATIONS')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  statusFilter === 'QUOTATIONS'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? 'عروض الأسعار' : 'Quotations'}
              </button>
            </div>

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              {query
                ? isAr
                  ? `${searchResults.length} نتائج`
                  : `${searchResults.length} results`
                : isAr
                ? 'آخر المشاريع المضافة'
                : 'Recent projects'}
            </span>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {searchResults.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {isAr ? 'لم يتم العثور على أي مشروع يطابق البحث' : 'No matching projects found'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  {isAr
                    ? 'جرّب البحث باسم العميل، أو كود المشروع، أو رقم العرض مثل: "TW-QT"'
                    : 'Try searching by client name, project ID, or quotation ref (e.g. "TW-QT")'}
                </p>
              </div>
            ) : (
              searchResults.map((proj, index) => {
                const isSelected = index === selectedIndex;
                const statusInfo = STATUS_CONFIG[proj.status] || STATUS_CONFIG.Draft;
                
                return (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProject(proj, 'PRINT')}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Project Metadata */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Quotation Reference Badge */}
                        <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300 tracking-wider shrink-0">
                          {proj.quoteRef || proj.id}
                        </span>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.text}`}>
                          {isAr ? statusInfo.labelAr : statusInfo.labelEn}
                        </span>

                        {/* Project ID */}
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          ID: {proj.id}
                        </span>
                      </div>

                      {/* Client & Project Name */}
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                          {proj.clientName}
                        </span>
                        {proj.projectName && proj.projectName !== proj.clientName && (
                          <span className="text-xs text-slate-500 font-medium">
                            • {proj.projectName}
                          </span>
                        )}
                      </div>

                      {/* Subtitle details: Location, Date, Price */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        {proj.siteLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate max-w-[150px]">{proj.siteLocation}</span>
                          </span>
                        )}
                        {proj.date && (
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{proj.date}</span>
                          </span>
                        )}
                        {proj.totalQuotationPrice && (
                          <span className="font-bold text-slate-800 font-mono">
                            {proj.totalQuotationPrice.toLocaleString()} <SaudiRiyalSymbol className="w-2.5 h-2.5 inline text-emerald-600" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons Toolbar */}
                    <div className="flex items-center gap-1.5 shrink-0 justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* 1. Direct PDF Export Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDirectExportPdf(e, proj)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-xs font-bold border border-rose-200 transition-all shadow-2xs group/btn cursor-pointer"
                        title={isAr ? 'تصدير المستند كملف PDF مباشرة' : 'Export document as PDF directly'}
                      >
                        <FileDown className="w-3.5 h-3.5 text-rose-600 group-hover/btn:text-white" />
                        <span className="text-[11px]">{isAr ? 'تصدير PDF' : 'PDF'}</span>
                      </button>

                      {/* 2. Open in View & Print */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProject(proj, 'PRINT');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold border border-blue-200 transition-all shadow-2xs group/btn cursor-pointer"
                        title={isAr ? 'عرض وطباعة عرض السعر' : 'View & print quotation'}
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600 group-hover/btn:text-white" />
                        <span className="text-[11px]">{isAr ? 'عرض وطباعة' : 'View'}</span>
                      </button>

                      {/* 3. Open in Wizard / Edit */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProject(proj, 'WIZARD');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        title={isAr ? 'تعديل المواصفات بالمعالج' : 'Edit in specification wizard'}
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[11px]">{isAr ? 'تعديل' : 'Edit'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Keys Hint */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>↑↓ للتنقل</span>
              <span>•</span>
              <span>Enter للفتح</span>
              <span>•</span>
              <span>Esc للإغلاق</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-slate-600">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isAr ? 'نظام البحث الذكي للمشاريع' : 'Smart Project Search'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
