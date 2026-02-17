export const getProjectCreatedEmailTemplate = (
    projectName: string,
    projectUrl: string,
    description?: string,
): string => {
    const descriptionBlock = description
        ? `<p style="color: #64748B; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    ${description}
                </p>`
        : '';

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="text-align: center; padding: 32px 0 24px;">
                <h1 style="color: #4A90D9; font-size: 28px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">TaskBoard</h1>
            </div>
            <div style="padding: 0 32px 32px;">
                <h2 style="color: #1E293B; font-size: 20px; margin: 0 0 12px;">You've been assigned as project owner</h2>
                <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    You have been assigned as the owner of
                    <strong style="color: #1E293B;">${projectName}</strong> on TaskBoard.
                </p>
                ${descriptionBlock}
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${projectUrl}"
                       style="display: inline-block; background-color: #4A90D9; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                        View Project
                    </a>
                </div>
                <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin: 24px 0 0; text-align: center;">
                    If you didn't expect this email, please contact your administrator.
                </p>
            </div>
        </div>
    `;
};
