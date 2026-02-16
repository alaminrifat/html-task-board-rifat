import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';

import { Camera, LogOut, Trash2, Lock, Eye, EyeOff } from 'lucide-react';

import { cn } from '~/lib/utils';
import { useAuth } from '~/hooks/useAuth';
import { userService } from '~/services/httpServices/userService';

type DigestFrequency = 'OFF' | 'DAILY' | 'WEEKLY';

const DIGEST_OPTIONS: { label: string; value: DigestFrequency }[] = [
  { label: 'Off', value: 'OFF' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
];

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  size?: 'sm' | 'md';
}

function Toggle({ enabled, onChange, size = 'md' }: ToggleProps) {
  const isMd = size === 'md';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'rounded-full relative cursor-pointer transition-colors',
        isMd ? 'w-11 h-6' : 'w-9 h-5',
        enabled ? 'bg-[#4A90D9]' : 'bg-[#E5E7EB]'
      )}
    >
      <div
        className={cn(
          'bg-white rounded-full shadow-sm transition-transform absolute top-0.5',
          isMd ? 'w-5 h-5' : 'w-4 h-4',
          enabled ? (isMd ? 'right-0.5' : 'right-0.5') : (isMd ? 'left-0.5' : 'left-0.5')
        )}
        style={enabled ? { right: '2px', left: 'auto' } : { left: '2px', right: 'auto' }}
      />
    </button>
  );
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification preferences state
  const [pushEnabled, setPushEnabled] = useState(user?.pushEnabled ?? true);
  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>(
    user?.digestFrequency ?? 'DAILY'
  );
  const [assignments, setAssignments] = useState(true);
  const [deadlines, setDeadlines] = useState(true);
  const [comments, setComments] = useState(true);
  const [statusChanges, setStatusChanges] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePushToggle = useCallback(
    async (enabled: boolean) => {
      setPushEnabled(enabled);
      try {
        await userService.updateNotifications({ pushEnabled: enabled });
      } catch {
        setPushEnabled(!enabled);
      }
    },
    []
  );

  const handleDigestChange = useCallback(
    async (frequency: DigestFrequency) => {
      const prev = digestFrequency;
      setDigestFrequency(frequency);
      try {
        await userService.updateNotifications({ digestFrequency: frequency });
      } catch {
        setDigestFrequency(prev);
      }
    },
    [digestFrequency]
  );

  const handleAvatarUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('avatar', file);
      try {
        await userService.uploadAvatar(formData);
        // Reload page to reflect avatar change
        window.location.reload();
      } catch {
        // Silently fail
      }
    },
    []
  );

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    setPasswordError(null);
    setIsChangingPassword(true);
    try {
      await userService.changePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err != null && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Failed to change password';
      setPasswordError(message);
    } finally {
      setIsChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleDeleteAccount = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await userService.deleteAccount();
      await logout();
    } catch {
      setIsDeleting(false);
    }
  }, [logout]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <header className="bg-white h-[56px] flex items-center justify-center px-4 shrink-0 z-20 border-b border-[#E5E7EB]">
        <h2 className="text-lg font-semibold tracking-tight text-[#1E293B]">
          Profile
        </h2>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-[70px] p-4 flex flex-col gap-4">
        {/* Account Info Card */}
        <section className="bg-white rounded-lg p-5 shadow-sm border border-[#E5E7EB] flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-3">
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
            <button
              type="button"
              onClick={handleAvatarUpload}
              className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-[#E5E7EB] text-[#4A90D9] flex items-center justify-center hover:bg-[#F9FAFB] transition-colors"
              aria-label="Upload photo"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Details */}
          <h3 className="text-xl font-semibold tracking-tight text-[#1E293B] mb-1">
            {user?.fullName ?? 'User'}
          </h3>
          <div className="text-sm text-[#64748B] mb-0.5">{user?.email ?? ''}</div>
          {user?.jobTitle ? (
            <div className="text-sm text-[#64748B]">{user.jobTitle}</div>
          ) : null}

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => navigate('/profile/edit')}
            className="mt-4 h-10 w-[120px] rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#1E293B] hover:bg-[#F9FAFB] transition-colors flex items-center justify-center"
          >
            Edit Profile
          </button>
        </section>

        {/* Notification Preferences Card */}
        <section className="bg-white rounded-lg p-5 shadow-sm border border-[#E5E7EB]">
          <h4 className="text-base font-semibold tracking-tight text-[#1E293B] mb-5">
            Notification Preferences
          </h4>

          {/* Push Notifications */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-medium text-[#1E293B]">Push notifications</span>
            <Toggle enabled={pushEnabled} onChange={handlePushToggle} size="md" />
          </div>

          {/* Email Digest */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-medium text-[#1E293B]">Email digest</span>
            <div className="flex bg-[#F3F4F6] rounded-md p-0.5 h-8 items-center">
              {DIGEST_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleDigestChange(option.value)}
                  className={cn(
                    'px-3 h-full text-xs font-medium rounded transition-colors',
                    digestFrequency === option.value
                      ? 'bg-white text-[#1E293B] shadow-sm border border-[#E5E7EB]'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#E5E7EB] w-full mb-5" />

          {/* Sub Toggles */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1E293B]">Assignments</span>
              <Toggle enabled={assignments} onChange={setAssignments} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1E293B]">Deadlines</span>
              <Toggle enabled={deadlines} onChange={setDeadlines} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1E293B]">Comments</span>
              <Toggle enabled={comments} onChange={setComments} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1E293B]">Status Changes</span>
              <Toggle enabled={statusChanges} onChange={setStatusChanges} size="sm" />
            </div>
          </div>
        </section>

        {/* Password Section */}
        <section className="bg-white rounded-lg p-5 shadow-sm border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold tracking-tight text-[#1E293B]">Security</h4>
            {!showPasswordForm && (
              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className="text-sm font-medium text-[#4A90D9] hover:text-[#3B82F6] transition-colors"
              >
                Change Password
              </button>
            )}
          </div>

          {passwordSuccess && (
            <div className="mb-3 p-2.5 bg-green-50 border border-green-200 rounded-md text-xs text-green-700">
              Password changed successfully
            </div>
          )}

          {showPasswordForm && (
            <div className="flex flex-col gap-3">
              {passwordError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
                  {passwordError}
                </div>
              )}

              {/* Current Password */}
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full h-10 px-3 pr-10 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#4A90D9] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* New Password */}
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full h-10 px-3 pr-10 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#4A90D9] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirm Password */}
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#4A90D9] transition-colors"
              />

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="flex-1 h-10 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3B82F6] disabled:opacity-50 transition-colors"
                >
                  {isChangingPassword ? 'Changing...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError(null);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="h-10 px-4 border border-[#E5E7EB] text-[#64748B] text-sm rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Danger Zone Card */}
        <section className="bg-white rounded-lg p-5 shadow-sm border border-[#E5E7EB]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-12 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#64748B] hover:bg-[#F9FAFB] hover:text-[#1E293B] transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Log Out
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className={cn(
              'w-full h-12 mt-3 rounded-lg text-sm font-medium text-[#EF4444] hover:bg-red-50 transition-colors flex items-center justify-center gap-2',
              isDeleting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </section>

        {/* App Version */}
        <div className="text-center">
          <span className="text-xs text-[#94A3B8]">App version: 1.1.0</span>
        </div>
      </main>
    </div>
  );
}
