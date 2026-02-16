import { UserRole } from '@shared/enums';

export interface IJwtPayload {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;

    avatarUrl?: string | null;
    teamName?: string | null;
    isActive?: boolean;
}
