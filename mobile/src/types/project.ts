export interface Project {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  template: 'DEFAULT' | 'MINIMAL' | 'CUSTOM';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}
