import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '~/services/httpServices/authService';
import { resetPasswordSchema, type ResetPasswordFormData } from '~/utils/validations/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');
  const passwordLength = passwordValue?.length ?? 0;
  const passwordsMatch =
    confirmPasswordValue?.length > 0 && passwordValue === confirmPasswordValue;
  const passwordsMismatch =
    confirmPasswordValue?.length > 0 && passwordValue !== confirmPasswordValue;

  // Auto-redirect after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await authService.resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setIsSuccess(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4 text-[#1E293B]">
      {/* Card Container */}
      <main className="relative w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
        {/* View 1: Reset Password Form */}
        {!isSuccess && (
          <div>
            {/* Header */}
            <h1 className="text-2xl font-semibold text-[#1E293B] tracking-tight mb-6">
              Create new password
            </h1>

            {/* Server Error */}
            {serverError && (
              <div className="mb-4 p-3 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/20 text-sm text-[#EF4444]">
                {serverError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* New Password */}
              <div className="flex flex-col gap-2">
                <div className="relative group">
                  {/* Lock Icon */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    className="w-full h-[48px] pl-11 pr-11 text-base bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-colors"
                    {...register('password')}
                  />
                  {/* Eye Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] cursor-pointer transition-colors outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Requirement Hint */}
                <div
                  className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                    passwordLength >= 8 ? 'text-[#10B981]' : 'text-[#64748B]'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Minimum 8 characters</span>
                </div>

                {errors.password && (
                  <p className="text-xs text-[#EF4444]">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <div className="relative group">
                  {/* Lock Icon */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className={`w-full h-[48px] pl-11 pr-11 text-base bg-white border rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none transition-colors ${
                      passwordsMismatch
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]'
                        : passwordsMatch
                          ? 'border-[#10B981] focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9]'
                          : 'border-[#E5E7EB] focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9]'
                    }`}
                    {...register('confirmPassword')}
                  />
                  {/* Eye Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] cursor-pointer transition-colors outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Match Error */}
                {passwordsMismatch && (
                  <div className="flex items-center gap-1.5 text-xs text-[#EF4444]">
                    <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Passwords do not match</span>
                  </div>
                )}

                {errors.confirmPassword && !passwordsMismatch && (
                  <p className="text-xs text-[#EF4444]">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[48px] mt-2 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-base font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </div>
        )}

        {/* View 2: Success State */}
        {isSuccess && (
          <div className="flex flex-col items-center text-center py-4">
            {/* Success Icon */}
            <div className="w-[80px] h-[80px] rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6 text-[#10B981]">
              <CheckCircle className="w-12 h-12" />
            </div>

            <h2 className="text-base font-medium text-[#1E293B] mb-2">
              Password reset successfully
            </h2>
            <p className="text-xs text-[#64748B] flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Redirecting to login...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
