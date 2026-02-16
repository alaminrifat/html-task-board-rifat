import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '~/services/httpServices/authService';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValid = password.length >= 8;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 8 || password !== confirmPassword) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await authService.resetPassword(email, password);
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      setError('Failed to reset password. Please check your email and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4 text-[#1E293B]">
      <main className="relative w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
        {!isSuccess ? (
          /* Reset Password Form */
          <div>
            {/* Header */}
            <h1 className="text-2xl font-semibold text-[#1E293B] tracking-tight mb-6">
              Create new password
            </h1>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-[#EF4444] text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[48px] pl-11 pr-4 text-base bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
                />
              </div>

              {/* New Password Input */}
              <div className="flex flex-col gap-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-[48px] pl-11 pr-11 text-base bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirement Hint */}
                <div
                  className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                    passwordValid ? 'text-[#10B981]' : 'text-[#64748B]'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Minimum 8 characters</span>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col gap-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full h-[48px] pl-11 pr-11 text-base bg-white border rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:ring-1 transition-all duration-200 ${
                      passwordsMismatch
                        ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                        : 'border-[#E5E7EB] focus:border-[#4A90D9] focus:ring-[#4A90D9]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] transition-colors focus:outline-none"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Mismatch Error */}
                {passwordsMismatch && (
                  <div className="flex items-center gap-1.5 text-xs text-[#EF4444]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Passwords do not match</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !passwordValid || !passwordsMatch}
                className="w-full h-[48px] mt-2 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-base font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
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
        ) : (
          /* Success State */
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
