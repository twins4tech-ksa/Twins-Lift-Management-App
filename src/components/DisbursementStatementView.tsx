import React, { useState, useMemo } from 'react';
import { ElevatorSpecification, DisbursementItem, DisbursementStatement } from '../types/elevator';
import { generateDisbursementStatement } from '../utils/disbursementEngine';
import { SaudiRiyalSymbol } from './SaudiRiyalSymbol';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Search, 
  Layers, 
  CheckCircle2, 
  Building2, 
  User, 
  Calendar, 
  Gauge, 
  Zap, 
  DoorOpen, 
  FileText,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Truck,
  Clock,
  PackageCheck,
  CheckCheck,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { exportDisbursementToExcel } from '../utils/excelExport';

interface Props {
  spec: ElevatorSpecification;
  onUpdateSpec?: (spec: ElevatorSpecification) => void;
  onSyncToGoogleSheet?: () => void;
  isSheetsConnected?: boolean;
}

export const DisbursementStatementView: React.FC<Props> = ({
  spec,
  onUpdateSpec,
  onSyncToGoogleSheet,
  isSheetsConnected,
}) => {
  // Generate statement according to the exact situation, prices, and stages
  const initialStatement = useMemo(() => generateDisbursementStatement(spec), [spec]);
  
  // Local state for customized quantities or prices
  const [statement, setStatement] = useState<DisbursementStatement>(initialStatement);
  const [activeStageTab, setActiveStageTab] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | 'DELIVERED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [collapsedStages, setCollapsedStages] = useState<Record<number, boolean>>({});

  // Site delivery tracking state per item sequence
  const [deliveredItems, setDeliveredItems] = useState<Record<number, { delivered: boolean; deliveredAt?: string; note?: string }>>(() => {
    try {
      const stored = localStorage.getItem(`vvt_disb_delivered_${spec.quoteRef || spec.id || 'BUY-24/1'}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read delivered items from storage', e);
    }
    // Check spec.siteDeliveryRecords
    if (spec.siteDeliveryRecords) {
      const initial: Record<number, { delivered: boolean; deliveredAt?: string; note?: string }> = {};
      Object.entries(spec.siteDeliveryRecords).forEach(([seqStr, rec]) => {
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq)) {
          const r = rec as { deliveredAt?: string; receivedBy?: string };
          initial[seq] = { delivered: true, deliveredAt: r?.deliveredAt, note: r?.receivedBy };
        }
      });
      return initial;
    }
    return {};
  });

  // Sync with spec if spec key properties change
  React.useEffect(() => {
    setStatement(generateDisbursementStatement(spec));
  }, [spec.stops, spec.capacityKg, spec.doorWidthMm, spec.quoteRef, spec.clientName]);

  const toggleStageCollapse = (stageId: number) => {
    setCollapsedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  // Toggle delivery status for a single component
  const handleToggleDelivery = (seq: number) => {
    setDeliveredItems(prev => {
      const isCurrentlyDelivered = !!prev[seq]?.delivered;
      const todayStr = new Date().toISOString().split('T')[0];
      const updated = {
        ...prev,
        [seq]: {
          delivered: !isCurrentlyDelivered,
          deliveredAt: !isCurrentlyDelivered ? todayStr : undefined,
        }
      };
      try {
        localStorage.setItem(`vvt_disb_delivered_${spec.quoteRef || spec.id || 'BUY-24/1'}`, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // Mark all items as delivered to site
  const handleMarkAllDelivered = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated: Record<number, { delivered: boolean; deliveredAt?: string }> = {};
    statement.stages.forEach(stg => {
      stg.items.forEach(it => {
        updated[it.seq] = { delivered: true, deliveredAt: todayStr };
      });
    });
    setDeliveredItems(updated);
    try {
      localStorage.setItem(`vvt_disb_delivered_${spec.quoteRef || spec.id || 'BUY-24/1'}`, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Mark all items in a stage as delivered to site
  const handleMarkStageDelivered = (stageId: 1 | 2 | 3) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDeliveredItems(prev => {
      const updated = { ...prev };
      const stg = statement.stages.find(s => s.stageId === stageId);
      if (stg) {
        stg.items.forEach(it => {
          updated[it.seq] = { delivered: true, deliveredAt: todayStr };
        });
      }
      try {
        localStorage.setItem(`vvt_disb_delivered_${spec.quoteRef || spec.id || 'BUY-24/1'}`, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // Reset all delivery marks
  const handleResetDeliveryMarks = () => {
    setDeliveredItems({});
    try {
      localStorage.removeItem(`vvt_disb_delivered_${spec.quoteRef || spec.id || 'BUY-24/1'}`);
    } catch (e) {
      console.warn(e);
    }
  };

  // Delivery calculation metrics
  const totalItemsCount = useMemo(() => {
    return statement.stages.reduce((acc, stg) => acc + stg.items.length, 0);
  }, [statement]);

  const deliveredCount = useMemo(() => {
    return (Object.values(deliveredItems) as Array<{ delivered: boolean }>).filter(d => d.delivered).length;
  }, [deliveredItems]);

  const deliveredPercentage = totalItemsCount > 0 ? Math.round((deliveredCount / totalItemsCount) * 100) : 0;

  const deliveredValueSar = useMemo(() => {
    let total = 0;
    statement.stages.forEach(stg => {
      stg.items.forEach(it => {
        if (deliveredItems[it.seq]?.delivered) {
          total += it.totalPriceSar;
        }
      });
    });
    return total;
  }, [statement, deliveredItems]);

  const handlePriceChange = (stageId: 1 | 2 | 3, seq: number, newPrice: number) => {
    setStatement(prev => {
      const updatedStages = prev.stages.map(stg => {
        if (stg.stageId !== stageId) return stg;
        const updatedItems = stg.items.map(item => {
          if (item.seq !== seq) return item;
          const validPrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
          return {
            ...item,
            unitPriceSar: validPrice,
            totalPriceSar: Math.round(item.quantity * validPrice),
          };
        });
        const newSubtotal = updatedItems.reduce((acc, it) => acc + it.totalPriceSar, 0);
        return {
          ...stg,
          items: updatedItems,
          subtotalSar: newSubtotal,
        };
      });
      const newTotal = updatedStages.reduce((acc, s) => acc + s.subtotalSar, 0);
      return {
        ...prev,
        stages: updatedStages,
        totalCostSar: newTotal,
      };
    });
  };

  const handleQuantityChange = (stageId: 1 | 2 | 3, seq: number, newQty: number) => {
    setStatement(prev => {
      const updatedStages = prev.stages.map(stg => {
        if (stg.stageId !== stageId) return stg;
        const updatedItems = stg.items.map(item => {
          if (item.seq !== seq) return item;
          const validQty = Math.max(0, isNaN(newQty) ? 0 : newQty);
          return {
            ...item,
            quantity: validQty,
            totalPriceSar: Math.round(validQty * item.unitPriceSar),
          };
        });
        const newSubtotal = updatedItems.reduce((acc, it) => acc + it.totalPriceSar, 0);
        return {
          ...stg,
          items: updatedItems,
          subtotalSar: newSubtotal,
        };
      });
      const newTotal = updatedStages.reduce((acc, s) => acc + s.subtotalSar, 0);
      return {
        ...prev,
        stages: updatedStages,
        totalCostSar: newTotal,
      };
    });
  };

  const handleResetToDefault = () => {
    setStatement(generateDisbursementStatement(spec));
  };

  // Filter items by search query and delivery status
  const filteredStages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return statement.stages
      .filter(s => activeStageTab === 'ALL' || s.stageId === activeStageTab)
      .map(s => ({
        ...s,
        items: s.items.filter(item => {
          const isDelivered = !!deliveredItems[item.seq]?.delivered;
          if (deliveryFilter === 'DELIVERED' && !isDelivered) return false;
          if (deliveryFilter === 'PENDING' && isDelivered) return false;

          if (!q) return true;
          return (
            item.nameAr.toLowerCase().includes(q) ||
            (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
            item.notesAr.toLowerCase().includes(q) ||
            item.unitAr.toLowerCase().includes(q) ||
            item.seq.toString().includes(q)
          );
        }),
      }))
      .filter(s => s.items.length > 0);
  }, [statement, activeStageTab, searchQuery, deliveryFilter, deliveredItems]);

  // Export Excel (.xlsx)
  const [excelExportNotification, setExcelExportNotification] = useState(false);
  const handleExportExcel = () => {
    exportDisbursementToExcel(statement, spec, deliveredItems);
    setExcelExportNotification(true);
    setTimeout(() => setExcelExportNotification(false), 3000);
  };

  // Copy TSV for Google Sheets / Excel
  const handleCopyTsv = () => {
    const header = 'م\tالمرحلة\tالبضاعة المطلوبة للموقع\tالوحدة\tالكمية\tالسعر الإفرادي (ر.س)\tإجمالي الصرف (ر.س)\tحالة التوريد\tالملاحظات\n';
    const rows = statement.stages
      .flatMap(stage =>
        stage.items.map(
          item => {
            const isDelivered = deliveredItems[item.seq]?.delivered ? 'تم التوريد' : 'قيد التوريد';
            return `${item.seq}\t${stage.stageNameAr}\t${item.nameAr}\t${item.unitAr}\t${item.quantity}\t${item.unitPriceSar}\t${item.totalPriceSar}\t${isDelivered}\t${item.notesAr}`;
          }
        )
      )
      .join('\n');

    navigator.clipboard.writeText(header + rows);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const stage1Sub = statement.stages.find(s => s.stageId === 1)?.subtotalSar || 0;
  const stage2Sub = statement.stages.find(s => s.stageId === 2)?.subtotalSar || 0;
  const stage3Sub = statement.stages.find(s => s.stageId === 3)?.subtotalSar || 0;
  const totalCost = statement.totalCostSar;

  return (
    <div id="disbursement-statement-container" className="space-y-4">
      {/* Official Header matching "تقنية الروافع للتجارة - بيان مقرر الصرف" */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[11px] font-extrabold tracking-wide">
                HTH تقنية الروافع للتجارة
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-mono font-bold">
                {statement.docRef}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {statement.date}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              بيان مقرر الصرف وتوريدات الموقع (المراحل الثلاث)
            </h2>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
              title="طباعة مقرر الصرف (A4)"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>طباعة</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
              title="تصدير بيان الصرف والتوريد مباشرة إلى ملف Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
              {excelExportNotification && (
                <span className="text-[10px] text-emerald-700 bg-emerald-200/80 px-1 py-0.2 rounded font-black animate-in fade-in">
                  تم!
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyTsv}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
              title="نسخ جدول الصرف إلى حافظة الجهاز"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">نسخ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              title="استعادة الأسعار والكميات المرجعية الافتراضية"
              className="inline-flex items-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Project & Situation Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5">اسم العميل</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <User className="w-3 h-3 text-blue-500" />
              {statement.clientName}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5">رقم العقد / الكود</span>
            <span className="font-bold font-mono text-blue-700">{statement.docRef}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5">عدد الوقفات</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-500" />
              {statement.stopsCount} وقفات
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5">حمولة المصعد</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-amber-500" />
              {statement.capacityKg} كغ
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5">نوع الماكينة</span>
            <span className="font-bold text-slate-900">{statement.machineTypeAr}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5">نوع المصعد</span>
            <span className="font-bold text-slate-900">{statement.elevatorOriginAr}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5">مقاس الأبواب</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <DoorOpen className="w-3 h-3 text-purple-500" />
              {statement.doorSpecAr}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5">التغذية الكهربائية</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              380V (3 فاز)
            </span>
          </div>
        </div>
      </div>

      {/* Site Delivery Tracking KPI Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-emerald-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">
                  متابعة علامات التوريد للموقع (Site Delivery Tracker)
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[11px] font-bold">
                  {deliveredPercentage}% مُنجز
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تم توريد <strong className="text-emerald-400 font-bold">{deliveredCount}</strong> من إجمالي <strong className="text-white">{totalItemsCount}</strong> بنداً للموقع بقيمة <strong className="text-emerald-400 font-bold">{deliveredValueSar.toLocaleString('en-US')} ر.س</strong>
              </p>
            </div>
          </div>

          {/* Quick Bulk Delivery Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleMarkAllDelivered}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              تحديد الكل كمُورّد للموقع
            </button>
            <button
              type="button"
              onClick={handleResetDeliveryMarks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              إعادة ضبط التوريد
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5 font-medium">
            <span>نسبة التوريد المكتمل للموقع</span>
            <span className="font-mono text-emerald-400 font-bold">{deliveredCount} / {totalItemsCount} بنداً ({deliveredPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${deliveredPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Financial KPIs for the 3 Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Cost */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm border border-slate-700">
          <div className="text-slate-400 text-xs font-semibold">إجمالي تكلفة مقرر الصرف (المواد)</div>
          <div className="text-2xl font-black mt-1 flex items-baseline gap-1.5 text-white">
            <span>{totalCost.toLocaleString('en-US')}</span>
            <span className="text-xs font-normal text-amber-400">ر.س</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            شامل كافة توريدات الموقع (62 بنداً تنفيذياً)
          </div>
        </div>

        {/* Stage 1 Card */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">المرحلة الأولى</span>
            <span className="text-xs font-bold text-slate-400">
              {totalCost > 0 ? Math.round((stage1Sub / totalCost) * 100) : 0}%
            </span>
          </div>
          <div className="text-slate-500 text-xs mt-2">الهيكل، السكك، الأبواب والكوابيل</div>
          <div className="text-xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
            <span>{stage1Sub.toLocaleString('en-US')}</span>
            <span className="text-xs text-slate-500">ر.س</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{statement.stages[0]?.items.length || 0} بنود للتثبيت والمسار</span>
            <button
              type="button"
              onClick={() => handleMarkStageDelivered(1)}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
            >
              + توريد المرحلة
            </button>
          </div>
        </div>

        {/* Stage 2 Card */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">المرحلة الثانية</span>
            <span className="text-xs font-bold text-slate-400">
              {totalCost > 0 ? Math.round((stage2Sub / totalCost) * 100) : 0}%
            </span>
          </div>
          <div className="text-slate-500 text-xs mt-2">الماكينة، الكابينة، الأحبال وثقل الموازنة</div>
          <div className="text-xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
            <span>{stage2Sub.toLocaleString('en-US')}</span>
            <span className="text-xs text-slate-500">ر.س</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{statement.stages[1]?.items.length || 0} بنود ميكانيكية رئيسية</span>
            <button
              type="button"
              onClick={() => handleMarkStageDelivered(2)}
              className="text-[10px] text-amber-700 hover:text-amber-900 font-bold hover:underline"
            >
              + توريد المرحلة
            </button>
          </div>
        </div>

        {/* Stage 3 Card */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">المرحلة الثالثة</span>
            <span className="text-xs font-bold text-slate-400">
              {totalCost > 0 ? Math.round((stage3Sub / totalCost) * 100) : 0}%
            </span>
          </div>
          <div className="text-slate-500 text-xs mt-2">الكنترول، التمديدات واللوحات والتشغيل</div>
          <div className="text-xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
            <span>{stage3Sub.toLocaleString('en-US')}</span>
            <span className="text-xs text-slate-500">ر.س</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{statement.stages[2]?.items.length || 0} بنود كهربائية وإلكترونية</span>
            <button
              type="button"
              onClick={() => handleMarkStageDelivered(3)}
              className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
            >
              + توريد المرحلة
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Stage Switcher Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Stage Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setActiveStageTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeStageTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع المراحل (62 بنداً)
          </button>
          <button
            type="button"
            onClick={() => setActiveStageTab(1)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeStageTab === 1
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المرحلة الأولى: الهيكل والسكك والأبواب
          </button>
          <button
            type="button"
            onClick={() => setActiveStageTab(2)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeStageTab === 2
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المرحلة الثانية: الماكينة والكابينة والأحبال
          </button>
          <button
            type="button"
            onClick={() => setActiveStageTab(3)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeStageTab === 3
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المرحلة الثالثة: الكنترول والكهرباء واللوحات
          </button>
        </div>

        {/* Delivery Status Filter & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setDeliveryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                deliveryFilter === 'ALL' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({totalItemsCount})
            </button>
            <button
              type="button"
              onClick={() => setDeliveryFilter('DELIVERED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                deliveryFilter === 'DELIVERED' ? 'bg-white font-bold text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              تم التوريد ({deliveredCount})
            </button>
            <button
              type="button"
              onClick={() => setDeliveryFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                deliveryFilter === 'PENDING' ? 'bg-white font-bold text-amber-700 shadow-xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-600" />
              قيد التوريد ({totalItemsCount - deliveredCount})
            </button>
          </div>

          {/* Search Field */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالبند، المقاس، أو الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Stage Tables */}
      <div className="space-y-6">
        {filteredStages.map((stage) => {
          const isCollapsed = collapsedStages[stage.stageId];
          const stageDeliveredCount = stage.items.filter(it => deliveredItems[it.seq]?.delivered).length;
          return (
            <div
              key={stage.stageId}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Stage Header */}
              <div 
                onClick={() => toggleStageCollapse(stage.stageId)}
                className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                    stage.stageId === 1 ? 'bg-blue-600' : stage.stageId === 2 ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    {stage.stageId}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {stage.stageNameAr}
                      </h3>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold">
                        مُورّد {stageDeliveredCount} من {stage.items.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {stage.stageDescriptionAr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 block">إجمالي المرحلة</span>
                    <span className="text-sm font-black text-slate-900 flex items-baseline gap-1">
                      <span>{stage.subtotalSar.toLocaleString('en-US')}</span>
                      <span className="text-xs text-slate-500 font-normal">ر.س</span>
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Table of items */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100/60 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-3 w-12 text-center">م</th>
                        <th className="px-3 py-3">البضاعة المطلوبة للموقع</th>
                        <th className="px-3 py-3 w-28 text-center">الوحدة</th>
                        <th className="px-3 py-3 w-20 text-center">الكمية</th>
                        <th className="px-3 py-3 w-28 text-left">السعر الإفرادي</th>
                        <th className="px-3 py-3 w-32 text-left">إجمالي الصرف</th>
                        <th className="px-3 py-3 w-36 text-center">علامة التوريد للموقع</th>
                        <th className="px-3 py-3">الملاحظات والمواصفات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stage.items.map((item) => {
                        const isDelivered = !!deliveredItems[item.seq]?.delivered;
                        return (
                          <tr 
                            key={item.seq} 
                            className={`transition-colors ${
                              isDelivered ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-400">
                              {item.seq}
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                {isDelivered && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="تم توريده للموقع" />
                                )}
                                <div>
                                  {item.nameAr}
                                  {item.nameEn && (
                                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                                      {item.nameEn}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-600 font-medium">
                              <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                                {item.unitAr}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(stage.stageId, item.seq, parseInt(e.target.value))}
                                className="w-16 px-2 py-1 text-center font-bold text-blue-700 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-left font-mono">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.unitPriceSar}
                                  onChange={(e) => handlePriceChange(stage.stageId, item.seq, parseFloat(e.target.value))}
                                  className="w-20 px-2 py-1 text-left font-mono text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs"
                                />
                                <span className="text-[10px] text-slate-400">ر.س</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-left font-mono font-bold text-slate-900">
                              {item.totalPriceSar.toLocaleString('en-US')} <span className="text-[10px] font-normal text-slate-400">ر.س</span>
                            </td>

                            {/* Site Delivery Mark Button / Tag */}
                            <td className="px-3 py-2.5 text-center">
                              {isDelivered ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleDelivery(item.seq)}
                                  className="inline-flex flex-col items-center justify-center w-full px-2 py-1 bg-emerald-100/80 hover:bg-emerald-200/80 text-emerald-800 border border-emerald-300 rounded-lg transition-colors cursor-pointer group"
                                  title="انقر لإلغاء علامة التوريد"
                                >
                                  <span className="flex items-center gap-1 font-bold text-[11px]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    مُورّد للموقع
                                  </span>
                                  <span className="text-[9px] text-emerald-700 font-mono">
                                    {deliveredItems[item.seq]?.deliveredAt || 'مُعتمد'}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleDelivery(item.seq)}
                                  className="inline-flex items-center justify-center gap-1 w-full px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                                  title="انقر لتعليم البند كمُورّد للموقع"
                                >
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>قيد التوريد</span>
                                </button>
                              )}
                            </td>

                            <td className="px-3 py-2.5 text-slate-500 text-[11px]">
                              {item.notesAr || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right text-slate-700">
                          إجمالي {stage.stageNameAr}
                        </td>
                        <td className="px-4 py-3 text-left font-mono text-blue-700 text-sm">
                          {stage.subtotalSar.toLocaleString('en-US')} ر.س
                        </td>
                        <td className="px-3 py-3 text-center text-[11px] text-slate-500 font-normal">
                          مُورّد: {stageDeliveredCount} / {stage.items.length}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Specifications & Technical Details Box (Exact match to the bottom of the photo) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          المواصفات الفنية المعتمدة للموقع (مقرر تقنية الروافع)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1 text-xs">
              ⚡ مواصفات الكنترول والطوارئ:
            </span>
            <p className="text-slate-600 leading-relaxed">
              {statement.controlSpecAr}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1 text-xs">
              🚪 مواصفات الباب الداخلي (الكابينة):
            </span>
            <p className="text-slate-600 leading-relaxed">
              {statement.carDoorSpecAr}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1 text-xs">
              🚪 مواصفات الأبواب الخارجية (الأدوار):
            </span>
            <p className="text-slate-600 leading-relaxed">
              {statement.landingDoorSpecAr}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1 text-xs">
              🎨 ديكور وتشطيب الكابينة:
            </span>
            <p className="text-slate-600 leading-relaxed">
              {statement.cabinDecorSpecAr}
            </p>
          </div>
        </div>
      </div>

      {/* Printable Voucher Section (Only displays clearly in Print) */}
      <div className="hidden print:block text-xs pt-8 border-t border-slate-300">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 mb-6 flex justify-between text-xs">
          <span><strong>إجمالي البنود المُورّدة للموقع:</strong> {deliveredCount} من {totalItemsCount} بنداً ({deliveredPercentage}%)</span>
          <span><strong>قيمة المواد المُورّدة:</strong> {deliveredValueSar.toLocaleString('en-US')} ر.س</span>
          <span><strong>تاريخ الفحص والطباعة:</strong> {new Date().toISOString().split('T')[0]}</span>
        </div>

        <div className="grid grid-cols-3 gap-8 text-center pt-6">
          <div className="border-t border-slate-400 pt-2">
            <span className="font-bold text-slate-800">توقيع مهندس الموقع والتجهيز</span>
            <div className="h-16"></div>
            <span className="text-slate-500 text-[10px]">الاسم: .......................................</span>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <span className="font-bold text-slate-800">مسؤول المستودع والصرف</span>
            <div className="h-16"></div>
            <span className="text-slate-500 text-[10px]">الاسم: .......................................</span>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <span className="font-bold text-slate-800">استلام العميل / المقاول بالموقع</span>
            <div className="h-16"></div>
            <span className="text-slate-500 text-[10px]">الاسم: {statement.clientName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

