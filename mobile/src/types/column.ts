export interface Column {
  id: string;
  projectId: string;
  title: string;
  position: number;
  wipLimit?: number;
  createdAt: string;
  updatedAt: string;
}
