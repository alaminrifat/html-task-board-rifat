import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  subtitle?: ReactNode;
}

export function StatsCard({ title, value, icon, iconBg, iconColor, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#64748B]">{title}</p>
          <h3 className="text-2xl font-semibold text-[#1E293B] mt-1 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
        </div>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg} ${iconColor}`}
        >
          {icon}
        </div>
      </div>
      {subtitle && (
        <div className="flex items-center gap-1 text-xs">{subtitle}</div>
      )}
    </div>
  );
}
