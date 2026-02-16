import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-[#94A3B8] mb-3">
        {icon ?? <Inbox className="w-12 h-12" />}
      </div>
      <h3 className="text-base font-medium text-[#1E293B] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#64748B] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
