import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '~/hooks/useAuth';

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Still checking auth
    if (isAuthenticated) {
      navigate('/projects', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div
      className="h-screen w-full overflow-hidden flex flex-col items-center justify-center text-white select-none relative"
      style={{ background: 'linear-gradient(180deg, #4A90D9 0%, #3A7BC8 100%)' }}
    >
      {/* Main Content */}
      <main className="flex flex-col items-center z-10 animate-fade-in-scale">
        {/* Logo */}
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter animate-subtle-pulse">
          TaskBoard
        </h1>

        {/* Loading Spinner */}
        <div className="mt-6 text-white/90">
          <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} />
        </div>
      </main>

      {/* Background Decoration */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay opacity-20" />

      {/* Inline CSS for animations */}
      <style>{`
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-subtle-pulse {
          animation: subtlePulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
