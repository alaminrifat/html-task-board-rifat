import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { authService } from '~/services/httpServices/authService';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '~/utils/validations/auth';

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await authService.forgotPassword({ email: data.email });
      setIsSuccess(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4 text-[#1E293B]">
      {/* Card Container */}
      <main className="relative w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
        {/* View 1: Forgot Password Form */}
        {!isSuccess && (
          <div>
            {/* Back Arrow */}
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-[44px] h-[44px] -ml-2 mb-2 text-[#64748B] hover:text-[#1E293B] rounded-full hover:bg-gray-50 transition-colors"
              aria-label="Back to Login"
            >
              <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
            </Link>

            {/* Header */}
            <h1 className="text-2xl font-semibold text-[#1E293B] tracking-tight mb-2">
              Reset your password
            </h1>
            <p className="text-base text-[#64748B] mb-6">
              Enter your email and we&apos;ll send a reset link
            </p>

            {/* Server Error */}
            {serverError && (
              <div className="mb-4 p-3 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/20 text-sm text-[#EF4444]">
                {serverError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Email Input */}
              <div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full h-[48px] pl-11 pr-4 text-base bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-colors"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-[#EF4444]">{errors.email.message}</p>
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
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          </div>
        )}

        {/* View 2: Success State */}
        {isSuccess && (
          <div className="flex flex-col items-center text-center py-4">
            {/* Success Icon */}
            <div className="w-[80px] h-[80px] rounded-full bg-[#10B981]/15 flex items-center justify-center mb-6 text-[#10B981]">
              <CheckCircle className="w-12 h-12" strokeWidth={1.5} />
            </div>

            <h2 className="text-xl font-semibold text-[#1E293B] tracking-tight mb-2">
              Reset link sent to your email
            </h2>
            <p className="text-sm text-[#64748B] mb-8">
              Check your inbox and spam folder
            </p>

            <Link
              to="/login"
              className="text-base font-medium text-[#4A90D9] hover:text-[#3B82F6] flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              Back to Login
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
