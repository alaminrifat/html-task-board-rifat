import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { User, Mail, Briefcase, Lock, ShieldCheck, Eye, EyeOff, Loader2, CheckCircle, Info } from 'lucide-react';
import { authService } from '~/services/httpServices/authService';

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength: 'empty' | 'weak' | 'valid' =
    password.length === 0 ? 'empty' : password.length < 8 ? 'weak' : 'valid';

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    if (!agreedToTerms) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      await authService.register({ firstName, lastName, email, password });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4 md:py-8 text-[#1E293B] overflow-y-auto">
      <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 flex flex-col relative my-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#4A90D9] rounded-md flex items-center justify-center text-white font-bold text-xs tracking-tighter flex-shrink-0">
              TB
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1E293B]">TaskBoard</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#1E293B] tracking-tight">Create an account</h1>
          <p className="text-sm text-[#64748B] mt-1">Start managing your tasks effectively</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-[#EF4444] text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-[48px] pl-11 pr-4 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
            />
          </div>

          {/* Email */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[48px] pl-11 pr-4 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
            />
          </div>

          {/* Job Title (Optional) */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Job title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full h-[48px] pl-11 pr-20 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-[10px] uppercase font-medium text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded">Optional</span>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-[48px] pl-11 pr-11 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className={`flex items-center gap-1 text-xs pl-1 transition-colors ${
              passwordStrength === 'valid'
                ? 'text-[#10B981]'
                : passwordStrength === 'weak'
                  ? 'text-[#F59E0B]'
                  : 'text-[#64748B]'
            }`}>
              <Info className="w-3 h-3" />
              <span>Minimum 8 characters</span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full h-[48px] pl-11 pr-11 text-sm bg-white border rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:ring-1 transition-all duration-200 ${
                passwordsMismatch
                  ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]'
                  : passwordsMatch
                    ? 'border-[#10B981] focus:border-[#4A90D9] focus:ring-[#4A90D9]'
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

          {/* Terms Checkbox */}
          <div className="mt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border border-[#E5E7EB] rounded bg-white peer-checked:bg-[#4A90D9] peer-checked:border-[#4A90D9] peer-focus:ring-2 peer-focus:ring-[#4A90D9]/20 transition-all" />
                <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-sm text-[#64748B] leading-tight">
                I agree to the{' '}
                <span className="text-[#4A90D9] hover:underline hover:text-[#3B82F6] cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-[#4A90D9] hover:underline hover:text-[#3B82F6] cursor-pointer">Privacy Policy</span>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isSuccess}
            className={`w-full h-[48px] mt-4 text-white text-sm font-semibold rounded-md shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 ${
              isSuccess
                ? 'bg-[#10B981]'
                : 'bg-[#4A90D9] hover:bg-[#3B82F6] hover:shadow active:scale-[0.99]'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Created!
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-[#E5E7EB] pt-6">
          <p className="text-sm text-[#64748B]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#4A90D9] font-medium hover:text-[#3B82F6] ml-1 transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
