import type { ReactNode } from 'react';
import { Skeleton } from './skeleton';
import { EmptyState } from './empty-state';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (item: T) => void;
  getId?: (item: T) => string;
  emptyMessage?: string;
  sortKey?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSort?: (key: string) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  getId = (item: T) => (item as Record<string, unknown>)?.id as string,
  emptyMessage = 'No data found',
  sortKey,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  const safeData = data ?? [];
  const allSelected = safeData.length > 0 && safeData.every((item) => selectedIds.includes(getId(item)));

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(safeData.map((item) => getId(item)));
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                {selectable && <th className="px-6 py-3 w-[40px]" />}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wider ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                    }`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {selectable && (
                    <td className="px-6 py-4">
                      <Skeleton className="w-4 h-4" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (safeData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <EmptyState title={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              {selectable && (
                <th className="px-6 py-3 w-[40px]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[#D1D5DB] text-[#4A90D9] focus:ring-[#4A90D9]"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable && onSort;
                return (
                  <th
                    key={col.key}
                    className={`px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wider ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                    } ${canSort ? 'cursor-pointer select-none hover:text-[#1E293B]' : ''}`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={canSort ? () => onSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {canSort && (
                        <span className="inline-flex flex-col leading-none">
                          <svg className={`w-2.5 h-2.5 ${isSorted && sortOrder === 'ASC' ? 'text-[#4A90D9]' : 'text-[#CBD5E1]'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z" /></svg>
                          <svg className={`w-2.5 h-2.5 -mt-0.5 ${isSorted && sortOrder === 'DESC' ? 'text-[#4A90D9]' : 'text-[#CBD5E1]'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0h10z" /></svg>
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {safeData.map((item) => {
              const id = getId(item);
              const isSelected = selectedIds.includes(id);
              return (
                <tr
                  key={id}
                  className="hover:bg-gray-50 transition-colors group cursor-pointer"
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(id)}
                        className="w-4 h-4 rounded border-[#D1D5DB] text-[#4A90D9] focus:ring-[#4A90D9]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 ${
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                      }`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
