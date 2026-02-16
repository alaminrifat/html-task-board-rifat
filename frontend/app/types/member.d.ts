export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  projectRole: 'OWNER' | 'MEMBER';
  joinedAt: string;
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
}
