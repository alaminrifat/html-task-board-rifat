export const getInvitationEmailTemplate = (
    projectName: string,
    inviterName: string,
    acceptUrl: string,
): string => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="text-align: center; padding: 32px 0 24px;">
                <h1 style="color: #4A90D9; font-size: 28px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">TaskBoard</h1>
            </div>
            <div style="padding: 0 32px 32px;">
                <h2 style="color: #1E293B; font-size: 20px; margin: 0 0 12px;">You've been invited!</h2>
                <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    <strong style="color: #1E293B;">${inviterName}</strong> has invited you to join the project
                    <strong style="color: #1E293B;">${projectName}</strong> on TaskBoard.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${acceptUrl}"
                       style="display: inline-block; background-color: #4A90D9; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                        Accept Invitation
                    </a>
                </div>
                <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin: 24px 0 0; text-align: center;">
                    This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
                </p>
            </div>
        </div>
    `;
};
