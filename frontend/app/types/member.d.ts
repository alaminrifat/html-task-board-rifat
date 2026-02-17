export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  projectRole: 'OWNER' | 'MEMBER';
  joinedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    profilePhotoUrl?: string;
  };
}

export interface Invitation {
  id: string;
  projectId: string;
  inviterId: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    title: string;
  };
  inviter?: {
    id: string;
    fullName: string;
    email: string;
  };
}
