import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X, AlertCircle } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: ReactNode;
  text?: string;
  disabled?: boolean;
  group?: string;
}

export interface SearchableSelectProps {
  id?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
  options?: SelectOption[];
  children?: ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  title?: string;
  allowClear?: boolean;
  emptyLabel?: string;
  autoFocusSearch?: boolean;
}

/**
 * Normalizes Arabic and English text for forgiving, search-friendly matching.
 * Handles Arabic hamza variations, taa marbuta/haa, alif maqsura/yaa, and tashkeel.
 */
function normalizeForSearch(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel/harakat
    .replace(/[_\-–—/\\|,.]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Recursively extracts plain text from React nodes for search matching.
 */
function extractNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join(' ');
  if (React.isValidElement(node) && node.props) {
    const props = node.props as { children?: ReactNode };
    if (props.children) {
      return extractNodeText(props.children);
    }
  }
  return '';
}

/**
 * Highlights matches within option text.
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const normQuery = normalizeForSearch(query);
  const normText = normalizeForSearch(text);
  const matchIdx = normText.indexOf(normQuery);

  if (matchIdx === -1) {
    return <>{text}</>;
  }

  // Find approximate start and end in original string
  const start = Math.max(0, matchIdx);
  const end = Math.min(text.length, start + query.length);

  return (
    <>
      {text.substring(0, start)}
      <mark className="bg-amber-200 text-amber-900 rounded-xs px-0.5 font-bold">
        {text.substring(start, end)}
      </mark>
      {text.substring(end)}
    </>
  );
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  options: explicitOptions,
  children,
  placeholder,
  searchPlaceholder,
  className = '',
  disabled = false,
  required = false,
  title,
  allowClear,
  emptyLabel,
  autoFocusSearch = true,
}) => {
  // Extract parsed options from children if explicitOptions are not supplied
  const parsedOptions = useMemo<SelectOption[]>(() => {
    if (explicitOptions && explicitOptions.length > 0) {
      return explicitOptions.map((opt) => ({
        ...opt,
        text: opt.text || extractNodeText(opt.label),
      }));
    }

    const items: SelectOption[] = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;

      if (child.type === 'option') {
        const props = child.props as {
          value?: string | number;
          children?: ReactNode;
          disabled?: boolean;
        };
        const val = props.value !== undefined ? String(props.value) : extractNodeText(props.children);
        items.push({
          value: val,
          label: props.children,
          text: extractNodeText(props.children),
          disabled: props.disabled,
        });
      } else if (child.type === 'optgroup') {
        const groupProps = child.props as {
          label?: string;
          children?: ReactNode;
        };
        const groupLabel = groupProps.label || '';
        React.Children.forEach(groupProps.children, (groupChild) => {
          if (!React.isValidElement(groupChild)) return;
          const props = groupChild.props as {
            value?: string | number;
            children?: ReactNode;
            disabled?: boolean;
          };
          const val = props.value !== undefined ? String(props.value) : extractNodeText(props.children);
          items.push({
            value: val,
            label: props.children,
            text: extractNodeText(props.children),
            disabled: props.disabled,
            group: groupLabel,
          });
        });
      }
    });

    return items;
  }, [explicitOptions, children]);

  // Uncontrolled vs Controlled state
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string | number>(
    defaultValue !== undefined ? defaultValue : (parsedOptions[0]?.value ?? '')
  );

  const currentValue = isControlled ? controlledValue : internalValue;
  const stringValue = currentValue !== undefined && currentValue !== null ? String(currentValue) : '';

  // UI Open / Search state
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Floating menu coordinates
  const [dropdownCoords, setDropdownCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpward: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Selected Option Object
  const selectedOption = useMemo(() => {
    return parsedOptions.find((opt) => String(opt.value) === stringValue);
  }, [parsedOptions, stringValue]);

  // Filtered Options
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return parsedOptions;
    }
    const normQuery = normalizeForSearch(searchTerm);
    return parsedOptions.filter((opt) => {
      const normText = normalizeForSearch(opt.text || '');
      const normVal = normalizeForSearch(String(opt.value));
      return normText.includes(normQuery) || normVal.includes(normQuery);
    });
  }, [parsedOptions, searchTerm]);

  // Update dropdown coordinates relative to viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 310; // max expected height of popover
    const openUpward = spaceBelow < 230 && spaceAbove > spaceBelow;

    const top = openUpward
      ? Math.max(8, rect.top - dropdownHeight - 4)
      : Math.min(window.innerHeight - 60, rect.bottom + 4);

    const computedWidth = Math.min(window.innerWidth - 16, Math.max(rect.width, 240));
    const computedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - computedWidth - 8));

    setDropdownCoords({
      top,
      left: computedLeft,
      width: computedWidth,
      openUpward,
    });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Close on outside click or window resize / scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (!(e.target instanceof Node)) return;
      const target = e.target;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (e: Event) => {
      // Don't close or reposition if scrolling inside our own dropdown list
      if (
        e.target instanceof Node &&
        dropdownRef.current &&
        dropdownRef.current.contains(e.target)
      ) {
        return;
      }
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(
        filteredOptions.findIndex((o) => String(o.value) === stringValue)
      );
      if (autoFocusSearch) {
        // Small delay ensures portal element is mounted
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 30);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoFocusSearch, filteredOptions, stringValue]);

  // Keep highlighted index in view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Handle Selection
  const handleSelectOption = (opt: SelectOption) => {
    if (opt.disabled) return;
    const newVal = String(opt.value);

    if (!isControlled) {
      setInternalValue(newVal);
    }

    if (onChange) {
      onChange({
        target: {
          value: newVal,
          name,
        },
      });
    }

    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Keyboard navigation on Trigger button
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // User pressed a character key directly on the select trigger!
      setIsOpen(true);
      setSearchTerm(e.key);
    }
  };

  // Keyboard navigation inside Search Input & List
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      } else if (filteredOptions.length > 0) {
        handleSelectOption(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  // Compute display label
  const displayLabel = selectedOption ? (
    selectedOption.label
  ) : (
    <span className="text-slate-400 font-normal">
      {placeholder || emptyLabel || '— اختر —'}
    </span>
  );

  return (
    <div className="relative inline-block w-full">
      {/* Hidden native select for form serialization, accessibility, and validation */}
      <select
        id={id}
        name={name}
        value={stringValue}
        required={required}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        onChange={() => {}}
        className="sr-only pointer-events-none"
      >
        {parsedOptions.map((opt, i) => (
          <option key={i} value={opt.value} disabled={opt.disabled}>
            {opt.text || String(opt.value)}
          </option>
        ))}
      </select>

      {/* Main Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={`flex items-center justify-between gap-1.5 text-start transition-all cursor-pointer select-none text-slate-800 ${className} ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
        } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
      >
        <span className="truncate flex-1 font-medium">{displayLabel}</span>

        <span className="flex items-center gap-1 shrink-0 text-slate-400 ms-1">
          {allowClear && stringValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              title="مسح الاختيار"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectOption({ value: '', label: '', text: '' });
              }}
              className="p-0.5 hover:text-rose-600 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <Search className="w-3 h-3 text-slate-400 group-hover:text-slate-600 opacity-60" />
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </span>
      </button>

      {/* Portal Dropdown Menu */}
      {isOpen &&
        dropdownCoords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${dropdownCoords.top}px`,
              left: `${dropdownCoords.left}px`,
              width: `${dropdownCoords.width}px`,
              maxHeight: '320px',
              zIndex: 99999,
            }}
            data-searchable-select-portal="true"
            className="flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xs text-xs"
          >
            {/* Search Input Bar */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-blue-600 absolute start-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder || 'اكتب للبحث والتصفية الفورية... (Type to filter)'}
                  className="w-full ps-8 pe-16 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 placeholder:text-slate-400"
                />

                {/* Clear search or count indicator */}
                <div className="absolute end-2 flex items-center gap-1">
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        searchInputRef.current?.focus();
                      }}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold">
                    {filteredOptions.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Options List */}
            <div
              ref={listRef}
              role="listbox"
              className="overflow-y-auto flex-1 p-1 max-h-[240px] divide-y divide-slate-50"
            >
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-slate-500 flex flex-col items-center justify-center gap-1.5">
                  <AlertCircle className="w-5 h-5 text-amber-500/80" />
                  <span className="font-semibold text-xs text-slate-700">لم يتم العثور على خيار مطابق</span>
                  <span className="text-[11px] text-slate-400">"{searchTerm}"</span>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="mt-1 text-[11px] text-blue-600 hover:underline font-bold"
                    >
                      مسح البحث (Show all)
                    </button>
                  )}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === stringValue;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={`${opt.value}-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed bg-transparent'
                          : isSelected
                          ? 'bg-blue-50/90 text-blue-900 font-bold'
                          : isHighlighted
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-1 truncate">
                        {opt.group && (
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            {opt.group}
                          </div>
                        )}
                        <div className="truncate">
                          {typeof opt.label === 'string' ? (
                            <HighlightMatch text={opt.label} query={searchTerm} />
                          ) : (
                            opt.label
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0 ms-1 stroke-[2.5]" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SearchableSelect;
