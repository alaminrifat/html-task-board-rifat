import { httpService } from '~/services/httpService';
import type { Attachment } from '~/types/attachment';

export const attachmentService = {
  list: (projectId: string, taskId: string) =>
    httpService.get<Attachment[]>(`/projects/${projectId}/tasks/${taskId}/attachments`),

  upload: (projectId: string, taskId: string, file: FormData) =>
    httpService.post<Attachment>(`/projects/${projectId}/tasks/${taskId}/attachments`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  download: (projectId: string, attachmentId: string) =>
    httpService.get<Blob>(`/projects/${projectId}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    }),

  delete: (projectId: string, attachmentId: string) =>
    httpService.delete<void>(`/projects/${projectId}/attachments/${attachmentId}`),
};
