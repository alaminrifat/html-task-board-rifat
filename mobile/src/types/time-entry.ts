export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  user?: { id: string; fullName: string; avatarUrl?: string };
  entryType: 'TIMER' | 'MANUAL';
  durationMinutes: number;
  description?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}
