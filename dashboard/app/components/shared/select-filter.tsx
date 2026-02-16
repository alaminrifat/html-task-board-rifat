import { ChevronDown } from 'lucide-react';
import { cn } from '~/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFilterProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SelectFilter({ options, value, onChange, className }: SelectFilterProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="appearance-none h-full pl-3 pr-8 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] cursor-pointer min-w-[120px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {(options ?? []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#64748B]">
        <ChevronDown className="w-3 h-3" />
      </div>
    </div>
  );
}
