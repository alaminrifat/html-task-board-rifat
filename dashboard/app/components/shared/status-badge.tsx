import { cn } from '~/lib/utils';

const BADGE_COLORS: Record<string, string> = {
  ACTIVE: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
  SUSPENDED: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
  DELETED: 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20',
  INACTIVE: 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20',
  COMPLETED: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
  ARCHIVED: 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20',
  ADMIN: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20',
  PROJECT_OWNER: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
  TEAM_MEMBER: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
  OWNER: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
  MEMBER: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
};

const DOT_COLORS: Record<string, string> = {
  ACTIVE: 'bg-[#10B981]',
  SUSPENDED: 'bg-[#EF4444]',
  DELETED: 'bg-[#64748B]',
  INACTIVE: 'bg-[#64748B]',
  COMPLETED: 'bg-[#3B82F6]',
  ARCHIVED: 'bg-[#64748B]',
};

const DISPLAY_LABELS: Record<string, string> = {
  PROJECT_OWNER: 'Owner',
  TEAM_MEMBER: 'Member',
};

interface StatusBadgeProps {
  status: string;
  variant?: 'badge' | 'dot';
  className?: string;
}

export function StatusBadge({ status, variant = 'badge', className }: StatusBadgeProps) {
  const key = (status ?? '').toUpperCase();
  const displayLabel = DISPLAY_LABELS[key] ?? (status ?? '');

  if (variant === 'dot') {
    const dotColor = DOT_COLORS[key] ?? 'bg-[#64748B]';
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <div className={cn('w-2 h-2 rounded-full', dotColor)} />
        <span className="text-sm text-[#1E293B]">{displayLabel}</span>
      </div>
    );
  }

  const badgeColor = BADGE_COLORS[key] ?? 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
        badgeColor,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
