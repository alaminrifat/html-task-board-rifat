import { useState } from 'react';

import { useNavigate } from 'react-router';
import {
  Grid2x2,
  ArrowRight,
  XCircle,
  Link as LinkIcon,
  Calendar,
} from 'lucide-react';

import MobileHeader from '~/components/layout/mobile-header';
import { cn } from '~/lib/utils';
import { projectService } from '~/services/httpServices/projectService';
import { memberService } from '~/services/httpServices/memberService';

const AVATAR_COLORS = [
  'bg-[#E0F2FE] text-[#0369A1]',
  'bg-[#FCE7F3] text-[#BE185D]',
  'bg-[#FEF3C7] text-[#B45309]',
  'bg-[#D1FAE5] text-[#047857]',
];

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  DEFAULT: 'To Do, In Progress, Review, Done',
  MINIMAL: 'To Do, Done',
  CUSTOM: 'Custom column layout',
};

function getEmailInitials(email: string): string {
  const name = (email ?? '').split('@')[0] ?? '';
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (
      (parts[0]?.charAt(0) ?? '').toUpperCase() +
      (parts[1]?.charAt(0) ?? '').toUpperCase()
    );
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ProjectCreate() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [template, setTemplate] = useState<'DEFAULT' | 'MINIMAL' | 'CUSTOM'>('DEFAULT');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed || !(invitedEmails ?? []).indexOf(trimmed)) return;
    if (!trimmed.includes('@')) return;
    if ((invitedEmails ?? []).includes(trimmed)) return;
    setInvitedEmails((prev) => [...(prev ?? []), trimmed]);
    setEmailInput('');
  };

  const handleRemoveEmail = (email: string) => {
    setInvitedEmails((prev) => (prev ?? []).filter((e) => e !== email));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/invite?project=new`
      );
    } catch {
      // Clipboard API may not be available
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const project = await projectService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        template,
        deadline: deadline || undefined,
      });

      // Send invitations for each collected email
      if (project?.id && (invitedEmails ?? []).length > 0) {
        await Promise.allSettled(
          invitedEmails.map((email) =>
            memberService.invite(project.id, { email })
          )
        );
      }

      navigate(`/projects/${project?.id}/board`);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Header */}
      <MobileHeader
        title="New Project"
        onBack={() => navigate(-1)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 max-w-[600px] mx-auto">
          {/* Error message */}
          {error ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[6px] text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {/* SECTION 1 - PROJECT DETAILS */}
          <section className="mb-8">
            <h4 className="text-lg font-semibold text-[#1E293B] mb-4">
              Project Details
            </h4>

            <div className="flex flex-col gap-4">
              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Project title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project title"
                  className="w-full h-[48px] px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-base outline-none focus:border-[#4A90D9] transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description (optional)"
                  className="w-full min-h-[120px] p-3 bg-white border border-[#E5E7EB] rounded-[6px] text-base outline-none focus:border-[#4A90D9] transition-colors resize-none"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">
                  Deadline
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    placeholder="Set deadline"
                    className="w-full h-[48px] pl-10 pr-3 bg-white border border-[#E5E7EB] rounded-[6px] text-base outline-none focus:border-[#4A90D9] transition-colors cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 - BOARD TEMPLATE */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-[#1E293B]">
                Board Template
              </h4>
            </div>

            {/* Selected Template Card */}
            <button
              type="button"
              onClick={() => navigate('/projects/new/template')}
              className="w-full bg-[#F0F7FF] border-[2px] border-[#4A90D9] rounded-[10px] p-4 text-left hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#4A90D9] text-white flex items-center justify-center">
                    <Grid2x2 className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#1E293B]">
                      {template.charAt(0) + template.slice(1).toLowerCase()}
                    </span>
                    <p className="text-[11px] text-[#64748B]">
                      {TEMPLATE_DESCRIPTIONS[template] ?? ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#4A90D9]">
                  <span className="text-xs font-medium group-hover:underline">
                    Change
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              {/* Mini column preview */}
              <div className="flex items-center gap-1 w-full">
                <div className="flex-1 h-2 bg-[#94A3B8] rounded-full opacity-30" />
                <ArrowRight className="h-2.5 w-2.5 text-[#BFDBFE] shrink-0" />
                <div className="flex-1 h-2 bg-[#F59E0B] rounded-full opacity-30" />
                {template !== 'MINIMAL' ? (
                  <>
                    <ArrowRight className="h-2.5 w-2.5 text-[#BFDBFE] shrink-0" />
                    <div className="flex-1 h-2 bg-[#8B5CF6] rounded-full opacity-30" />
                  </>
                ) : null}
                <ArrowRight className="h-2.5 w-2.5 text-[#BFDBFE] shrink-0" />
                <div className="flex-1 h-2 bg-[#10B981] rounded-full opacity-30" />
              </div>
            </button>
          </section>

          {/* SECTION 3 - INVITE MEMBERS */}
          <section className="mb-[100px]">
            <h4 className="text-lg font-semibold text-[#1E293B] mb-4">
              Invite Members
            </h4>

            {/* Add Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                placeholder="name@email.com"
                className="grow h-[48px] px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-base outline-none focus:border-[#4A90D9]"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="w-[80px] h-[48px] bg-[#4A90D9] text-white font-medium rounded-[6px] hover:bg-[#3B82F6] transition-colors"
              >
                Add
              </button>
            </div>

            {/* Member List */}
            {(invitedEmails ?? []).length > 0 ? (
              <div className="flex flex-col gap-2">
                {(invitedEmails ?? []).map((email, index) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-2 bg-white border border-[#E5E7EB] rounded-[6px]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                          AVATAR_COLORS[index % AVATAR_COLORS.length]
                        )}
                      >
                        {getEmailInitials(email)}
                      </div>
                      <span className="text-sm text-[#1E293B] font-medium truncate max-w-[200px]">
                        {email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-[#94A3B8] hover:text-[#EF4444] p-1 transition-colors"
                      aria-label={`Remove ${email}`}
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-4 w-full h-[48px] border border-[#E5E7EB] rounded-[6px] bg-white text-[#4A90D9] font-medium flex items-center justify-center gap-2 hover:bg-[#F8FAFC] active:scale-[0.99] transition-all"
            >
              <LinkIcon className="h-5 w-5" />
              Copy Invite Link
            </button>
          </section>
        </div>
      </main>

      {/* Sticky Bottom */}
      <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] p-4 z-30">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || isSubmitting}
          className={cn(
            'w-full h-[48px] bg-[#4A90D9] text-white font-semibold rounded-[6px]',
            'flex items-center justify-center shadow-sm',
            'hover:bg-[#3B82F6] active:scale-[0.98] transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
          )}
        >
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </div>
  );
}
