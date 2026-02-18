import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '~/hooks/useAuth';
import { authService } from '~/services/httpServices/authService';
import { loginSchema, type LoginFormData } from '~/utils/validations/auth';
import { auth, googleProvider } from '~/lib/firebase';
import { useAppDispatch } from '~/redux/store/hooks';
import { setUser } from '~/redux/features/userSlice';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setServerError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const fullName = result.user.displayName || result.user.email?.split('@')[0] || '';
      const email = result.user.email || '';

      const response = await authService.googleAuth({
        token: idToken,
        fullName,
        email,
        socialLoginType: 'GOOGLE',
        termsAndConditionsAccepted: true,
      });
      dispatch(setUser(response.user));
      navigate('/projects');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no error needed
      } else {
        setServerError(error?.message || 'Google login failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await login(data.email, data.password);
      navigate('/projects');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4 text-[#1E293B]">
      {/* Login Card */}
      <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#4A90D9] select-none">
            TaskBoard
          </h1>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-4 p-3 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/20 text-sm text-[#EF4444]">
            {serverError}
          </div>
        )}

        {/* Login Form */}
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
                className="w-full h-[48px] pl-11 pr-4 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-colors"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-[#EF4444]">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
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
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-[#EF4444]">{errors.password.message}</p>
            )}

            {/* Forgot Password */}
            <div className="flex justify-end mt-2">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[#64748B] hover:text-[#4A90D9] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
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
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="h-px bg-[#E5E7EB] flex-1" />
          <span className="text-xs text-[#64748B] font-medium">Or continue with</span>
          <div className="h-px bg-[#E5E7EB] flex-1" />
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full h-[48px] bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#1E293B] text-base font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            'Continue with Google'
          )}
        </button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#64748B]">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="text-[#4A90D9] font-medium hover:underline ml-0.5"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
