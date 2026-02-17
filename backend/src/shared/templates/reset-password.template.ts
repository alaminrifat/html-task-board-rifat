export const getResetPasswordEmailTemplate = (resetUrl: string): string => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #4A90D9; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #4A90D9; font-size: 14px; word-break: break-all;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px;">This link is valid for 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
    `;
};
