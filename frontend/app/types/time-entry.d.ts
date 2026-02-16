export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  entryType: 'TIMER' | 'MANUAL';
  durationMinutes: number;
  description?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}
