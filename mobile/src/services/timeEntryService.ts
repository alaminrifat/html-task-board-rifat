import { httpService } from '~/services/httpService';
import type { TimeEntry } from '~/types/time-entry';

interface CreateTimeEntryRequest {
  durationMinutes: number;
  description?: string;
}

interface UpdateTimeEntryRequest {
  durationMinutes?: number;
  description?: string;
}

export const timeEntryService = {
  list: (projectId: string, taskId: string) =>
    httpService.get<TimeEntry[]>(
      `/projects/${projectId}/tasks/${taskId}/time-entries`,
    ),
  create: (projectId: string, taskId: string, data: CreateTimeEntryRequest) =>
    httpService.post<TimeEntry>(
      `/projects/${projectId}/tasks/${taskId}/time-entries`,
      data,
    ),
  start: (projectId: string, taskId: string) =>
    httpService.post<TimeEntry>(
      `/projects/${projectId}/tasks/${taskId}/time-entries/start`,
    ),
  stop: (timeEntryId: string) =>
    httpService.post<TimeEntry>(`/time-entries/${timeEntryId}/stop`),
  update: (timeEntryId: string, data: UpdateTimeEntryRequest) =>
    httpService.patch<TimeEntry>(`/time-entries/${timeEntryId}`, data),
  delete: (timeEntryId: string) =>
    httpService.delete<void>(`/time-entries/${timeEntryId}`),
};
