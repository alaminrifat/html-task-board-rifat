import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';

import { Camera } from 'lucide-react';

import MobileHeader from '~/components/layout/mobile-header';
import { cn } from '~/lib/utils';
import { useAuth } from '~/hooks/useAuth';
import { userService } from '~/services/httpServices/userService';

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    fullName !== (user?.fullName ?? '') || jobTitle !== (user?.jobTitle ?? '');

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        await userService.uploadAvatar(formData);
        window.location.reload();
      } catch {
        // Silently fail
      }
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!isDirty || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await userService.updateMe({ fullName, jobTitle });
      navigate('/profile');
    } catch (err: unknown) {
      const message =
        err != null && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to save changes';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isDirty, isSubmitting, fullName, jobTitle, navigate]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <MobileHeader
        title="Edit Profile"
        onBack={() => navigate('/profile')}
        centerTitle
      />

      {/* Form Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[90px]">
        {/* Avatar */}
        <div className="flex flex-col items-center justify-center mb-5">
          <div
            className="relative cursor-pointer group"
            role="button"
            tabIndex={0}
            onClick={handleAvatarClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAvatarClick();
              }
            }}
          >
            {user?.profilePhotoUrl ? (
              <img
                src={user.profilePhotoUrl}
                alt={user?.fullName ?? 'User'}
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#E0F2FE] text-[#4A90D9] flex items-center justify-center text-2xl font-bold border-2 border-white shadow-sm">
                {getInitials(user?.fullName)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-[#E5E7EB] text-[#4A90D9] flex items-center justify-center group-hover:bg-[#F9FAFB] transition-colors">
              <Camera size={16} />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 flex flex-col gap-5">
          {/* Error Message */}
          {error ? (
            <div className="text-sm text-[#EF4444] bg-red-50 rounded-lg p-3">
              {error}
            </div>
          ) : null}

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullname" className="text-sm font-medium text-[#1E293B]">
              Full name
            </label>
            <input
              id="fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-[44px] w-full rounded-lg border border-[#E5E7EB] px-4 text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
              placeholder="Enter your full name"
            />
          </div>

          {/* Job Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="jobtitle" className="text-sm font-medium text-[#1E293B]">
              Job title
            </label>
            <input
              id="jobtitle"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="h-[44px] w-full rounded-lg border border-[#E5E7EB] px-4 text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
              placeholder="Enter your job title"
            />
          </div>

          {/* Email (Disabled) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[#1E293B]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user?.email ?? ''}
              disabled
              className="h-[44px] w-full rounded-lg border border-[#E5E7EB] px-4 text-sm text-[#94A3B8] bg-[#F9FAFB] cursor-not-allowed select-none"
            />
            <p className="text-xs text-[#64748B]">
              Changing email requires re-verification
            </p>
          </div>
        </div>
      </main>

      {/* Sticky Save Button */}
      <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] p-4 z-20">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isDirty || isSubmitting}
          className={cn(
            'w-full h-[44px] bg-[#4A90D9] text-white rounded-lg font-medium text-sm flex items-center justify-center shadow-sm transition-opacity',
            (!isDirty || isSubmitting) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
