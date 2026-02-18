import { ArrowLeft } from "lucide-react";

import { cn } from "~/lib/utils";

import type { ReactNode } from "react";

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  rightContent?: ReactNode;
  centerTitle?: boolean;
}

export default function MobileHeader({
  title,
  onBack,
  rightContent,
  centerTitle = false,
}: MobileHeaderProps) {
  return (
    <header className="h-[56px] bg-white border-b border-[#E5E7EB] flex items-center shrink-0 z-20 pe-4 ps-2">
      {/* Left section */}
      <div className="flex items-center min-w-[40px]">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="p-1 -ml-1 rounded-md text-[#1E293B] hover:bg-[#F9FAFB] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Title */}
      <h1
        className={cn(
          "text-base font-semibold text-[#1E293B] truncate",
          centerTitle && "flex-1 text-center",
        )}
      >
        {title}
      </h1>

      {/* Right section */}
      <div
        className={cn(
          "flex items-center min-w-[40px] justify-end",
          !centerTitle && "ml-auto",
        )}
      >
        {rightContent}
      </div>
    </header>
  );
}
