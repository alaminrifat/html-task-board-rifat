import { cn } from '~/lib/utils';

const BG_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-purple-100 text-purple-600',
  'bg-gray-100 text-gray-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
  'bg-teal-100 text-teal-600',
  'bg-red-100 text-red-600',
  'bg-orange-100 text-orange-600',
  'bg-cyan-100 text-cyan-600',
];

function getInitials(name: string): string {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < (name ?? '').length; i++) {
    hash = (name ?? '').charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const sizeClasses = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-16 h-16 text-2xl',
};

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const colorIndex = hashName(name) % BG_COLORS.length;
  const colorClass = BG_COLORS[colorIndex];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0',
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
