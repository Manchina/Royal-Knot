import * as React from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface ComboboxMultiSelectProps {
  options: ComboboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxDisplay?: number;
  className?: string;
  disabled?: boolean;
}

export const ComboboxMultiSelect: React.FC<ComboboxMultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  maxDisplay = 3,
  className,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const removeValue = (val: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== val));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className={cn(
          'min-h-9 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 transition-colors',
          'flex flex-wrap items-center gap-1.5 cursor-pointer shadow-2xs',
          'focus:outline-none focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-50',
          open && 'ring-1 ring-[#714B67] border-[#714B67]'
        )}
      >
        {selectedValues.length === 0 ? (
          <span className="text-slate-400 select-none">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1 flex-1">
            {selectedOptions.slice(0, maxDisplay).map((opt) => (
              <Badge
                key={opt.value}
                variant="secondary"
                className="bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 text-[11px] font-medium py-0 px-1.5 flex items-center gap-1"
              >
                <span>{opt.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeValue(opt.value, e)}
                  onKeyDown={(e) => e.key === 'Enter' && removeValue(opt.value, e)}
                  className="hover:text-red-600 rounded-full cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </Badge>
            ))}
            {selectedValues.length > maxDisplay && (
              <Badge variant="outline" className="text-[10px] text-slate-500 py-0 px-1.5">
                +{selectedValues.length - maxDisplay} more
              </Badge>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1 text-slate-400">
          {selectedValues.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearAll}
              className="hover:text-slate-600 p-0.5 rounded cursor-pointer"
              title="Clear all"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-150', open && 'rotate-180')} />
        </div>
      </div>

      {/* Dropdown Popover */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded border border-slate-200 bg-white shadow-lg py-1 text-xs">
          {/* Search Box */}
          <div className="px-2 pb-1.5 pt-0.5 border-b border-slate-100 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
            />
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-slate-400 text-center text-xs">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      'px-3 py-2 flex items-center justify-between cursor-pointer transition-colors',
                      isSelected ? 'bg-slate-50 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                            isSelected
                              ? 'bg-[#714B67] border-[#714B67] text-white'
                              : 'border-slate-300 bg-white'
                          )}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs">{opt.label}</span>
                        {opt.badge && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 border-slate-200">
                            {opt.badge}
                          </Badge>
                        )}
                      </div>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-400 pl-5">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          {options.length > 0 && (
            <div className="px-2.5 py-1.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
              <span>{selectedValues.length} selected</span>
              {selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[11px] text-[#714B67] hover:underline font-medium"
                >
                  Deselect all
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
