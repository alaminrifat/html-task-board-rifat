import { cn } from '~/lib/utils';

interface FilterChipsProps {
  options: string[];
  activeFilter: string;
  onChange: (filter: string) => void;
}

export default function FilterChips({
  options,
  activeFilter,
  onChange,
}: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1 pr-2">
      {(options ?? []).map((option) => {
        const isActive = option === activeFilter;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'h-[32px] px-[12px] rounded-2xl text-xs font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-[#4A90D9] text-white shadow-sm'
                : 'bg-[#F1F5F9] text-[#64748B] border border-transparent hover:border-[#E5E7EB]'
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
