import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Mail } from 'lucide-react';
import { useAuth } from '~/hooks/useAuth';
import { memberService } from '~/services/httpServices/memberService';
import type { Invitation } from '~/types/member';

type PageState = 'loading' | 'preview' | 'accepted' | 'declined' | 'error';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid invitation link. No token provided.');
      setPageState('error');
      return;
    }

    if (authLoading) return;

    const fetchInvitation = async () => {
      try {
        const data = await memberService.getInvitationByToken(token);
        setInvitation(data);
        setPageState('preview');
      } catch (err: unknown) {
        const error = err as { message?: string };
        setErrorMessage(error?.message || 'This invitation is no longer valid.');
        setPageState('error');
      }
    };

    fetchInvitation();
  }, [token, authLoading]);

  const handleAccept = async () => {
    if (!token) return;

    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await memberService.acceptInvitation(token);
      setPageState('accepted');
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error?.message?.includes('already a member')) {
        setPageState('accepted');
      } else if (error?.message?.includes('No account found')) {
        navigate(`/signup?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`);
      } else {
        setErrorMessage(error?.message || 'Failed to accept invitation.');
        setPageState('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await memberService.declineInvitation(token);
      setPageState('declined');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMessage(error?.message || 'Failed to decline invitation.');
      setPageState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === 'loading' || authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4 text-[#1E293B]">
      <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#4A90D9] select-none">
            TaskBoard
          </h1>
        </div>

        {/* Preview State */}
        {pageState === 'preview' && invitation && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[#4A90D9]/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#4A90D9]" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#1E293B] mb-2">
                You've been invited!
              </h2>
              <p className="text-sm text-[#64748B]">
                {invitation.inviter?.fullName || 'A team member'} has invited you to join
              </p>
              <p className="text-lg font-semibold text-[#1E293B] mt-1">
                {invitation.project?.title || 'a project'}
              </p>
            </div>

            <div className="w-full p-3 rounded-md bg-[#F1F5F9] border border-[#E5E7EB]">
              <p className="text-xs text-[#64748B]">Invitation sent to</p>
              <p className="text-sm font-medium text-[#1E293B]">{invitation.email}</p>
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-[#F59E0B]">
                You'll need to log in to accept this invitation.
              </p>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={handleDecline}
                disabled={isSubmitting}
                className="flex-1 h-[48px] bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#64748B] text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="flex-1 h-[48px] bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-sm font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  isAuthenticated ? 'Accept Invitation' : 'Log in & Accept'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Accepted State */}
        {pageState === 'accepted' && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1E293B] mb-2">
                Welcome to the team!
              </h2>
              <p className="text-sm text-[#64748B]">
                You've successfully joined{' '}
                <span className="font-medium text-[#1E293B]">
                  {invitation?.project?.title || 'the project'}
                </span>.
              </p>
            </div>
            <Link
              to={invitation?.projectId ? `/projects/${invitation.projectId}/board` : '/projects'}
              className="w-full h-[48px] bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-sm font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center"
            >
              Go to Project
            </Link>
          </div>
        )}

        {/* Declined State */}
        {pageState === 'declined' && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[#64748B]/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-[#64748B]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1E293B] mb-2">
                Invitation Declined
              </h2>
              <p className="text-sm text-[#64748B]">
                You've declined the invitation. You can ask the project owner to send a new one if you change your mind.
              </p>
            </div>
            <Link
              to="/projects"
              className="w-full h-[48px] bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#1E293B] text-sm font-medium rounded-md transition-colors flex items-center justify-center"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Error State */}
        {pageState === 'error' && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1E293B] mb-2">
                Invalid Invitation
              </h2>
              <p className="text-sm text-[#64748B]">
                {errorMessage}
              </p>
            </div>
            <Link
              to="/projects"
              className="w-full h-[48px] bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#1E293B] text-sm font-medium rounded-md transition-colors flex items-center justify-center"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
