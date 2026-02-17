export interface User {
  id: string;
  email: string;
  fullName: string;
  jobTitle?: string;
  avatarUrl?: string;
  role: 'PROJECT_OWNER' | 'TEAM_MEMBER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  googleId?: string;
  emailVerified: boolean;
  pushEnabled: boolean;
  digestFrequency: 'OFF' | 'DAILY' | 'WEEKLY';
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
