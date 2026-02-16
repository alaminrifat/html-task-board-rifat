import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#64748B]">
      {(items ?? []).map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-3 h-3" />}
            <span className={isLast ? 'text-[#1E293B] font-medium' : ''}>
              {item.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}
