import { ChevronDown } from 'lucide-react';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({ page, limit, total, onPageChange, onLimitChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit) || 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="px-6 py-4 border-t border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="text-sm text-[#64748B]">
        Showing <span className="font-medium text-[#1E293B]">{from}-{to}</span> of{' '}
        <span className="font-medium text-[#1E293B]">{total}</span>
      </span>

      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            className="appearance-none pl-3 pr-8 py-1.5 border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] cursor-pointer"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#64748B]">
            <ChevronDown className="w-3 h-3" />
          </div>
        </div>

        <div className="flex items-center border border-[#E5E7EB] rounded-lg overflow-hidden">
          <button
            className="px-3 py-1.5 text-sm text-[#64748B] hover:bg-gray-50 border-r border-[#E5E7EB] disabled:opacity-50 disabled:hover:bg-white"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          {getPageNumbers().map((p, idx) =>
            p === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1.5 text-sm text-[#64748B] border-r border-[#E5E7EB]"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                className={`px-3 py-1.5 text-sm border-r border-[#E5E7EB] transition-colors ${
                  p === page
                    ? 'bg-[#4A90D9] text-white font-medium'
                    : 'text-[#64748B] hover:bg-gray-50 hover:text-[#1E293B]'
                }`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            className="px-3 py-1.5 text-sm text-[#64748B] hover:bg-gray-50 hover:text-[#1E293B] transition-colors"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
