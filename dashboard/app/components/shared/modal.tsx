import { useEffect, useCallback, type ReactNode } from 'react';
import { XCircle } from 'lucide-react';
import { cn } from '~/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'w-[480px]',
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className={cn(
          'max-h-[90vh] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden',
          maxWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 rounded-lg bg-[#4A90D9]/10 flex items-center justify-center text-[#4A90D9]">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-[#1E293B]">{title}</h3>
              {description && (
                <p className="text-xs text-[#64748B]">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1E293B] transition-colors p-1 -mr-1"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3 flex-shrink-0 bg-[#F9FAFB]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
