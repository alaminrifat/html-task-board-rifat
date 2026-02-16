import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import {
  Layers,
  User,
  Mail,
  Briefcase,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Camera,
  Info,
  Check,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { authService } from '~/services/httpServices/authService';
import { registerSchema, type RegisterFormData } from '~/utils/validations/auth';

export default function Signup() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      jobTitle: '',
      password: '',
      confirmPassword: '',
      terms: false as unknown as true,
    },
    mode: 'onChange',
  });

  const passwordValue = watch('password');
  const passwordLength = passwordValue?.length ?? 0;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await authService.register({
        name: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        jobTitle: data.jobTitle || undefined,
      });
      navigate('/login');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4 md:py-8 text-[#1E293B] overflow-y-auto">
      {/* Main Card */}
      <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 flex flex-col relative my-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 text-[#4A90D9]">
            <Layers className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight text-[#1E293B]">TaskBoard</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#1E293B] tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Start managing your tasks effectively
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-4 p-3 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/20 text-sm text-[#EF4444]">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center gap-2 mb-2">
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={handleAvatarClick}
                className="w-[80px] h-[80px] rounded-full bg-[#F1F5F9] border border-[#E5E7EB] flex items-center justify-center cursor-pointer hover:bg-[#E2E8F0] transition-colors relative overflow-hidden group-hover:border-[#4A90D9]"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-[#64748B] group-hover:text-[#4A90D9] transition-colors" />
                )}
              </button>
            </div>
            <span className="text-xs text-[#64748B]">Tap to upload photo (Optional)</span>
          </div>

          {/* Full Name */}
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Full name"
                className="w-full h-[48px] pl-11 pr-4 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-colors"
                {...register('fullName')}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1.5 text-xs text-[#EF4444]">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                className="w-full h-[48px] pl-11 pr-4 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-colors"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-[#EF4444]">{errors.email.message}</p>
            )}
          </div>

          {/* Job Title (Optional) */}
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
                <Briefcase className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Job title"
                className="w-full h-[48px] pl-11 pr-20 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-colors"
                {...register('jobTitle')}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] uppercase font-medium text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded">
                  Optional
                </span>
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex flex-col gap-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full h-[48px] pl-11 pr-11 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-colors"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] cursor-pointer outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {/* Password Hint */}
              <div
                className={`flex items-center gap-1 text-xs pl-1 transition-colors ${
                  passwordLength >= 8
                    ? 'text-[#10B981]'
                    : passwordLength > 0
                      ? 'text-[#F59E0B]'
                      : 'text-[#64748B]'
                }`}
              >
                {passwordLength >= 8 ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Info className="w-3 h-3" />
                )}
                <span>Minimum 8 characters</span>
              </div>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-[#EF4444]">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                className="w-full h-[48px] pl-11 pr-11 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-colors"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] cursor-pointer outline-none transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-[#EF4444]">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="mt-2">
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  {...register('terms')}
                />
                <div className="w-5 h-5 border border-[#E5E7EB] rounded bg-white peer-checked:bg-[#4A90D9] peer-checked:border-[#4A90D9] peer-focus:ring-2 peer-focus:ring-[#4A90D9]/20 transition-all" />
                <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
              </div>
              <span className="text-sm text-[#64748B] leading-tight">
                I agree to the{' '}
                <a href="#" className="text-[#4A90D9] hover:underline hover:text-[#3B82F6]">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#4A90D9] hover:underline hover:text-[#3B82F6]">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {errors.terms && (
              <p className="mt-1.5 text-xs text-[#EF4444]">{errors.terms.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[48px] mt-4 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-sm font-semibold rounded-md shadow-sm hover:shadow active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
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
            <Link
              to="/login"
              className="text-[#4A90D9] font-medium hover:text-[#3B82F6] ml-1 transition-colors"
            >
              Log In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
