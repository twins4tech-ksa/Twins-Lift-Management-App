import React from 'react';
import { InteractiveColumn, SortDirection } from '../hooks/useInteractiveTable';
import { GripVertical, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

interface InteractiveTableHeaderProps<T> {
  key?: React.Key;
  column: InteractiveColumn<T>;
  sortKey: string | null;
  sortDir: SortDirection;
  onSort: (columnId: string) => void;
  draggedColId: string | null;
  dragOverColId: string | null;
  onDragStart: (columnId: string, e: React.DragEvent) => void;
  onDragOver: (columnId: string, e: React.DragEvent) => void;
  onDragLeave: (columnId: string) => void;
  onDrop: (columnId: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
  isAr?: boolean;
  theme?: 'light' | 'dark';
}

export function InteractiveTableHeader<T>({
  column,
  sortKey,
  sortDir,
  onSort,
  draggedColId,
  dragOverColId,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isAr = true,
  theme = 'light',
}: InteractiveTableHeaderProps<T>) {
  const isSorted = sortKey === column.id;
  const isBeingDragged = draggedColId === column.id;
  const isTargetOfDrag = dragOverColId === column.id;
  const canDrag = column.draggable !== false;
  const canSort = column.sortable !== false;
  const isDark = theme === 'dark';

  const headerTitle = isAr
    ? column.headerAr || column.header
    : column.headerEn || column.header;

  const alignmentClass =
    column.align === 'center'
      ? 'text-center justify-center'
      : column.align === 'end'
      ? 'text-end justify-end'
      : 'text-start justify-start';

  return (
    <th
      draggable={canDrag}
      onDragStart={(e) => canDrag && onDragStart(column.id, e)}
      onDragOver={(e) => canDrag && onDragOver(column.id, e)}
      onDragLeave={() => canDrag && onDragLeave(column.id)}
      onDrop={(e) => canDrag && onDrop(column.id, e)}
      onDragEnd={onDragEnd}
      style={{
        width: column.width,
        minWidth: column.minWidth,
      }}
      className={`relative py-3 px-3.5 select-none transition-all duration-150 group font-bold text-xs ${
        alignmentClass
      } ${
        isBeingDragged
          ? isDark
            ? 'opacity-40 bg-slate-800 cursor-grabbing'
            : 'opacity-40 bg-blue-100/50 cursor-grabbing'
          : canDrag
          ? isDark
            ? 'cursor-grab active:cursor-grabbing hover:bg-slate-800/90'
            : 'cursor-grab active:cursor-grabbing hover:bg-slate-100/90'
          : ''
      } ${
        isTargetOfDrag
          ? isDark
            ? 'bg-slate-800 border-s-2 border-s-blue-400 ring-2 ring-blue-500/50 z-10'
            : 'bg-blue-100/80 border-s-2 border-s-blue-600 ring-2 ring-blue-400/40 z-10'
          : ''
      } ${column.headerClassName || ''}`}
      title={
        canSort && canDrag
          ? isAr
            ? 'انقر للفرز • اسحب لإعادة ترتيب العمود'
            : 'Click to sort • Drag to reorder column'
          : canSort
          ? isAr
            ? 'انقر للفرز'
            : 'Click to sort'
          : undefined
      }
    >
      <div className={`flex items-center gap-1.5 ${alignmentClass}`}>
        {/* Drag handle grip */}
        {canDrag && (
          <span
            className={`${
              isDark
                ? 'text-slate-500 group-hover:text-slate-300'
                : 'text-slate-300 group-hover:text-slate-500'
            } transition-colors shrink-0 p-0.5 -ms-1 cursor-grab`}
            aria-hidden="true"
          >
            <GripVertical className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </span>
        )}

        {/* Column Title button (for sorting) */}
        {canSort ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSort(column.id);
            }}
            className={`flex items-center gap-1 transition-colors focus:outline-hidden cursor-pointer ${
              isDark
                ? isSorted
                  ? 'text-blue-300 font-black'
                  : 'text-white hover:text-blue-200'
                : isSorted
                ? 'text-blue-700 font-black'
                : 'text-slate-800 hover:text-blue-700'
            }`}
          >
            <span className="truncate">{headerTitle}</span>

            {/* Sort indicator icon */}
            <span
              className={`p-0.5 rounded transition-colors ${
                isDark
                  ? isSorted
                    ? 'bg-blue-900/80 text-blue-300 font-bold border border-blue-700/60'
                    : 'text-slate-500 group-hover:text-slate-300'
                  : isSorted
                  ? 'bg-blue-100 text-blue-700 font-bold'
                  : 'text-slate-300 group-hover:text-slate-500'
              }`}
            >
              {isSorted && sortDir === 'asc' ? (
                <ArrowUp className="w-3 h-3 stroke-[2.5]" />
              ) : isSorted && sortDir === 'desc' ? (
                <ArrowDown className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              )}
            </span>
          </button>
        ) : (
          <span className={`truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {headerTitle}
          </span>
        )}
      </div>
    </th>
  );
}

interface TableControlBarProps {
  isReordered: boolean;
  onResetOrder: () => void;
  sortKey: string | null;
  sortDir: SortDirection;
  onResetSort: () => void;
  isAr?: boolean;
  totalCount?: number;
}

export const TableControlBar: React.FC<TableControlBarProps> = ({
  isReordered,
  onResetOrder,
  sortKey,
  sortDir,
  onResetSort,
  isAr = true,
  totalCount,
}) => {
  if (!isReordered && !sortKey) return null;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-blue-50/80 border-b border-blue-100 text-xs text-blue-900 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        <span className="text-[11px] font-medium text-slate-700">
          {isReordered && sortKey
            ? isAr
              ? 'تم تعديل ترتيب الأعمدة وفرز الجدول'
              : 'Columns reordered & table sorted'
            : isReordered
            ? isAr
              ? 'تم تعديل ترتيب الأعمدة (اسحب رأس أي عمود لإعادة الترتيب)'
              : 'Columns reordered (drag any column header to rearrange)'
            : isAr
            ? `الجدول مفرز حالياً (${sortDir === 'asc' ? 'تصاعدي' : 'تنازلي'})`
            : `Table sorted (${sortDir === 'asc' ? 'Ascending' : 'Descending'})`}
        </span>
        {totalCount !== undefined && (
          <span className="text-[10px] text-slate-500 font-semibold">
            ({totalCount} {isAr ? 'عنصر' : 'items'})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {sortKey && (
          <button
            type="button"
            onClick={onResetSort}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors"
            title={isAr ? 'إلغاء الفرز' : 'Clear sort'}
          >
            <span>{isAr ? 'إلغاء الفرز' : 'Clear sort'}</span>
          </button>
        )}

        {isReordered && (
          <button
            type="button"
            onClick={onResetOrder}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100/50 border border-blue-200 shadow-2xs transition-colors"
            title={isAr ? 'إعادة ضبط الأعمدة للافتراضي' : 'Reset columns order'}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isAr ? 'إعادة ضبط الأعمدة' : 'Reset Columns'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
