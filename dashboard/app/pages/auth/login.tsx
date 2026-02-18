import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '~/hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4 text-[#1E293B]">
      {/* Login Card */}
      <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#4A90D9] select-none">
            TaskBoard
          </h1>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-[#EF4444] text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Login Form */}
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
              className="w-full h-[48px] pl-11 pr-4 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
            />
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-[48px] pl-11 pr-11 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-xs font-medium text-[#64748B] hover:text-[#4A90D9] transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[48px] mt-2 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-base font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
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

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#64748B]">Admin Portal</p>
        </div>
      </main>
    </div>
  );
}
