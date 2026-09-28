import React, { useState, useMemo, useCallback, useEffect } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface InteractiveColumn<T> {
  id: string;
  header: string;
  headerAr?: string;
  headerEn?: string;
  sortable?: boolean;
  draggable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
  minWidth?: string;
  className?: string;
  headerClassName?: string;
  // Accessor to extract value for sorting
  accessor?: (item: T) => string | number | boolean | Date | null | undefined;
  // Render function for table cell
  renderCell: (item: T, index: number) => React.ReactNode;
}

interface UseInteractiveTableOptions<T> {
  tableId: string;
  columns: InteractiveColumn<T>[];
  data: T[];
  isAr?: boolean;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  disablePersistence?: boolean;
}

export function useInteractiveTable<T>({
  tableId,
  columns: initialColumns,
  data,
  isAr = true,
  defaultSortKey,
  defaultSortDir = 'asc',
  disablePersistence = false,
}: UseInteractiveTableOptions<T>) {
  // 1. Column ordering state (with localStorage persistence)
  const storageKey = `twins_table_order_${tableId}`;

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (!disablePersistence && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed: string[] = JSON.parse(saved);
          // Verify saved columns match current column IDs
          const initialIds = initialColumns.map((c) => c.id);
          const isValid =
            parsed.length === initialIds.length &&
            initialIds.every((id) => parsed.includes(id));
          if (isValid) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to restore column order for', tableId, e);
      }
    }
    return initialColumns.map((c) => c.id);
  });

  // Re-sync if initialColumns definition IDs changed
  useEffect(() => {
    const initialIds = initialColumns.map((c) => c.id);
    setColumnOrder((prev) => {
      const isSame =
        prev.length === initialIds.length &&
        initialIds.every((id) => prev.includes(id));
      return isSame ? prev : initialIds;
    });
  }, [initialColumns]);

  // Save to localStorage when order changes
  const saveColumnOrder = useCallback(
    (newOrder: string[]) => {
      setColumnOrder(newOrder);
      if (!disablePersistence && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newOrder));
        } catch (e) {
          console.warn('Failed to save column order', e);
        }
      }
    },
    [disablePersistence, storageKey]
  );

  // 2. Drag & Drop state
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const moveColumn = useCallback(
    (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;

      setColumnOrder((prev) => {
        const newOrder = [...prev];
        const sourceIndex = newOrder.indexOf(sourceId);
        const targetIndex = newOrder.indexOf(targetId);

        if (sourceIndex === -1 || targetIndex === -1) return prev;

        // Remove from source position and insert at target position
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, sourceId);

        if (!disablePersistence && typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(newOrder));
          } catch (e) {
            console.warn('Failed to save column order', e);
          }
        }

        return newOrder;
      });
    },
    [disablePersistence, storageKey]
  );

  const handleDragStart = useCallback((columnId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', columnId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColId(columnId);
  }, []);

  const handleDragOver = useCallback(
    (columnId: string, e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverColId !== columnId) {
        setDragOverColId(columnId);
      }
    },
    [dragOverColId]
  );

  const handleDragLeave = useCallback(
    (columnId: string) => {
      if (dragOverColId === columnId) {
        setDragOverColId(null);
      }
    },
    [dragOverColId]
  );

  const handleDrop = useCallback(
    (columnId: string, e: React.DragEvent) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain') || draggedColId;
      if (sourceId && sourceId !== columnId) {
        moveColumn(sourceId, columnId);
      }
      setDraggedColId(null);
      setDragOverColId(null);
    },
    [draggedColId, moveColumn]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedColId(null);
    setDragOverColId(null);
  }, []);

  const resetColumnOrder = useCallback(() => {
    const defaultOrder = initialColumns.map((c) => c.id);
    saveColumnOrder(defaultOrder);
  }, [initialColumns, saveColumnOrder]);

  const isReordered = useMemo(() => {
    const defaultOrder = initialColumns.map((c) => c.id);
    return JSON.stringify(columnOrder) !== JSON.stringify(defaultOrder);
  }, [columnOrder, initialColumns]);

  // 3. Sorting state
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDir, setSortDir] = useState<SortDirection>(
    defaultSortKey ? defaultSortDir : null
  );

  const handleSort = useCallback((columnId: string) => {
    setSortKey((prevKey) => {
      if (prevKey !== columnId) {
        setSortDir('asc');
        return columnId;
      }

      // Cycle: asc -> desc -> null
      setSortDir((prevDir) => {
        if (prevDir === 'asc') return 'desc';
        if (prevDir === 'desc') return null;
        return 'asc';
      });

      return columnId;
    });
  }, []);

  // 4. Sorted Data computation
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;

    const column = initialColumns.find((c) => c.id === sortKey);
    if (!column || !column.accessor) return data;

    const accessor = column.accessor;
    const directionFactor = sortDir === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
      const valA = accessor(a);
      const valB = accessor(b);

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Numerical comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * directionFactor;
      }

      // Date comparison
      if (valA instanceof Date && valB instanceof Date) {
        return (valA.getTime() - valB.getTime()) * directionFactor;
      }

      // Boolean comparison
      if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        return (valA === valB ? 0 : valA ? -1 : 1) * directionFactor;
      }

      // String comparison (supports Arabic, English & numeric collation)
      const strA = String(valA).trim();
      const strB = String(valB).trim();

      // Check if both strings are valid numbers in string format (e.g. "1200", "55.4")
      const numA = parseFloat(strA.replace(/,/g, ''));
      const numB = parseFloat(strB.replace(/,/g, ''));
      if (!isNaN(numA) && !isNaN(numB) && !isNaN(Number(strA)) && !isNaN(Number(strB))) {
        return (numA - numB) * directionFactor;
      }

      return (
        strA.localeCompare(strB, isAr ? 'ar-SA' : 'en-US', {
          numeric: true,
          sensitivity: 'base',
        }) * directionFactor
      );
    });
  }, [data, sortKey, sortDir, initialColumns, isAr]);

  // 5. Ordered columns array for mapping
  const orderedColumns = useMemo(() => {
    const colMap = new Map(initialColumns.map((c) => [c.id, c]));
    return columnOrder
      .map((id) => colMap.get(id))
      .filter((c): c is InteractiveColumn<T> => Boolean(c));
  }, [columnOrder, initialColumns]);

  return {
    sortedData,
    orderedColumns,
    sortKey,
    sortDir,
    handleSort,
    resetSort: () => {
      setSortKey(null);
      setSortDir(null);
    },
    // Drag & Drop
    draggedColId,
    dragOverColId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    resetColumnOrder,
    isReordered,
  };
}
