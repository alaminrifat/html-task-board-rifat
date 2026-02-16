import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, PlusCircle, ChevronDown } from 'lucide-react';

import { Modal } from '~/components/shared/modal';
import { adminUserService } from '~/services/httpServices/adminUserService';

// ---------- Validation Schema ----------

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['PROJECT_OWNER', 'TEAM_MEMBER']),
  sendWelcomeEmail: z.boolean(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

// ---------- Props ----------

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ---------- Component ----------

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'TEAM_MEMBER',
      sendWelcomeEmail: true,
    },
  });

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await adminUserService.createUser({
        name: data.name,
        email: data.email,
        role: data.role,
      });
      reset();
      onSuccess();
    } catch {
      setSubmitError('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New User"
      description="Add a new member to the workspace"
      icon={<UserPlus className="w-5 h-5" />}
      maxWidth="w-[480px]"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-[40px] px-5 flex items-center justify-center border border-[#E5E7EB] text-sm font-medium text-[#64748B] rounded-lg hover:bg-white hover:text-[#1E293B] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-[40px] px-5 flex items-center justify-center gap-2 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-sm font-medium rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {submitError}
          </div>
        )}

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-[#1E293B]">
            Full Name <span className="text-[#EF4444]">*</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter full name"
            className="h-[40px] px-3 border border-[#E5E7EB] rounded-lg text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-[#EF4444]">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[#1E293B]">
            Email Address <span className="text-[#EF4444]">*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter email address"
            className="h-[40px] px-3 border border-[#E5E7EB] rounded-lg text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-[#EF4444]">{errors.email.message}</p>
          )}
        </div>

        {/* Role */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-[#1E293B]">
            Role <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <select
              id="role"
              className="appearance-none w-full h-[40px] px-3 pr-8 border border-[#E5E7EB] rounded-lg text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] cursor-pointer transition-all"
              {...register('role')}
            >
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="PROJECT_OWNER">Project Owner</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#64748B]">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {errors.role && (
            <p className="text-xs text-[#EF4444]">{errors.role.message}</p>
          )}
        </div>

        {/* Send Welcome Email */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-[#D1D5DB] text-[#4A90D9] focus:ring-[#4A90D9]"
            {...register('sendWelcomeEmail')}
          />
          <span className="text-sm text-[#1E293B]">Send welcome email to the user</span>
        </label>
      </form>
    </Modal>
  );
}
