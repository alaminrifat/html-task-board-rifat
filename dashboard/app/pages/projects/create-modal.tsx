import { useState, useEffect } from 'react';
import { FolderPlus, PlusCircle } from 'lucide-react';

import { Modal } from '~/components/shared/modal';
import { adminProjectService } from '~/services/httpServices/adminProjectService';
import { adminUserService } from '~/services/httpServices/adminUserService';
import type { AdminUser } from '~/types/admin';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'Development', label: 'Development' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Design', label: 'Design' },
];

const chevronIcon = (
  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [notifyTeam, setNotifyTeam] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      setIsLoadingUsers(true);
      adminUserService
        .getUsers({ limit: 100, status: 'ACTIVE' })
        .then((result) => {
          setUsers(result?.data ?? []);
        })
        .catch(() => {})
        .finally(() => setIsLoadingUsers(false));
    }
  }, [isOpen, users.length]);

  const handleClose = () => {
    setProjectName('');
    setDescription('');
    setOwnerId('');
    setCategory('');
    setStartDate('');
    setDeadline('');
    setStatus('ACTIVE');
    setNotifyTeam(true);
    onClose();
  };

  const handleSubmit = async () => {
    if (!projectName.trim() || !ownerId) return;

    setIsSubmitting(true);
    try {
      await adminProjectService.createProject({
        title: projectName.trim(),
        description: description.trim() || undefined,
        ownerId,
        startDate: startDate || undefined,
        deadline: deadline || undefined,
        status: status as 'ACTIVE' | 'COMPLETED',
        notifyTeam,
      });
      handleClose();
      onSuccess();
    } catch {
      // Error handled by service layer
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = projectName.trim().length > 0 && ownerId.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      description="Set up a new project workspace"
      icon={<FolderPlus className="w-5 h-5" />}
      maxWidth="w-[520px]"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-[40px] px-5 flex items-center justify-center border border-[#E5E7EB] text-sm font-medium text-[#64748B] rounded-lg hover:bg-white hover:text-[#1E293B] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="h-[40px] px-5 flex items-center gap-2 justify-center bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3b82f6] transition-all shadow-sm disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </>
      }
    >
      {/* Project Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1E293B]">
          Project Name <span className="text-[#EF4444]">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Website Redesign"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="h-[44px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1E293B]">
          Description
        </label>
        <textarea
          placeholder="Brief description of the project goals and scope"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="px-4 py-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all resize-none"
        />
      </div>

      {/* Owner and Category row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Owner */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E293B]">
            Owner <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              disabled={isLoadingUsers}
              className="w-full h-[44px] px-4 appearance-none rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all disabled:opacity-50"
            >
              <option value="" disabled>
                {isLoadingUsers ? 'Loading...' : 'Select owner'}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
              {chevronIcon}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E293B]">
            Category <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-[44px] px-4 appearance-none rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
            >
              <option value="" disabled>Select category</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
              {chevronIcon}
            </div>
          </div>
        </div>
      </div>

      {/* Start Date and Deadline row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E293B]">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-[44px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E293B]">
            Deadline
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="h-[44px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
          />
        </div>
      </div>

      {/* Initial Status */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1E293B]">
          Initial Status
        </label>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-[44px] px-4 appearance-none rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
          >
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
            {chevronIcon}
          </div>
        </div>
      </div>

      {/* Notify team */}
      <div className="flex items-center gap-3 pt-1">
        <input
          type="checkbox"
          id="notify-team"
          checked={notifyTeam}
          onChange={(e) => setNotifyTeam(e.target.checked)}
          className="w-4 h-4 rounded border-[#D1D5DB] text-[#4A90D9] focus:ring-[#4A90D9] cursor-pointer"
        />
        <label
          htmlFor="notify-team"
          className="text-sm text-[#1E293B] cursor-pointer select-none"
        >
          Notify team members when project is created
        </label>
      </div>
    </Modal>
  );
}
