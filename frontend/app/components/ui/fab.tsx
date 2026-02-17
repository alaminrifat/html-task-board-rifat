import { Plus } from "lucide-react";

import { cn } from "~/lib/utils";

import type { ReactNode } from "react";

interface FabProps {
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
}

export default function Fab({ onClick, icon, className }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute bottom-6 right-4 w-[56px] h-[56px] rounded-full",
        "bg-[#4A90D9] text-white flex items-center justify-center",
        "shadow-[0_4px_12px_rgba(74,144,217,0.3)] hover:bg-[#3B82F6]",
        "active:scale-90 transition-all z-10",
        className,
      )}
      aria-label="Create new"
    >
      {icon ?? <Plus className="h-7 w-7" />}
    </button>
  );
}
