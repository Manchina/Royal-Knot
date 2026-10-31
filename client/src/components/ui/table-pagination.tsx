import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemName = 'items',
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  if (totalItems <= pageSize) return null;

  return (
    <div className="px-4 py-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50/60">
      <div className="text-[11px] text-slate-500">
        Showing <span className="font-semibold text-slate-800">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
        <span className="font-semibold text-slate-800">{endIndex}</span> of{' '}
        <span className="font-semibold text-slate-800 font-mono">{totalItems}</span> {itemName}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-7 px-2 text-xs border-slate-300 font-medium cursor-pointer disabled:opacity-40"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
          <span>Previous</span>
        </Button>
        <span className="font-mono text-[11px] font-semibold text-slate-700 px-1">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-7 px-2 text-xs border-slate-300 font-medium cursor-pointer disabled:opacity-40"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
};
