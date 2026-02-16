import { cn } from '~/lib/utils';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileContainer({ children, className }: MobileContainerProps) {
  return (
    <div className="bg-[#F9FAFB] text-[#1E293B] flex justify-center min-h-screen w-full">
      <div
        className={cn(
          'w-full max-w-[402px] bg-[#F9FAFB] relative flex flex-col h-screen',
          'md:h-[90vh] md:my-auto md:border md:border-[#E5E7EB] md:rounded-[24px] md:shadow-2xl overflow-hidden',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
