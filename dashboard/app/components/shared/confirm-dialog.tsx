import { AlertCircle, Trash2 } from 'lucide-react';
import { Modal } from './modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const icon = variant === 'danger' ? <Trash2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />;
  const confirmBg = variant === 'danger' ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-[#F59E0B] hover:bg-[#D97706]';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      maxWidth="w-[420px]"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="h-[40px] px-5 flex items-center justify-center border border-[#E5E7EB] text-sm font-medium text-[#64748B] rounded-lg hover:bg-white hover:text-[#1E293B] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`h-[40px] px-5 flex items-center justify-center text-white text-sm font-medium rounded-lg transition-all shadow-sm disabled:opacity-50 ${confirmBg}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      {description && <p className="text-sm text-[#64748B]">{description}</p>}
    </Modal>
  );
}
