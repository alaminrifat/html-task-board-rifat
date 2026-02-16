import { httpService } from '~/services/httpService';
import type { Label } from '~/types/label';

interface CreateLabelRequest {
  name: string;
  color: string;
}

interface UpdateLabelRequest {
  name?: string;
  color?: string;
}

export const labelService = {
  list: (projectId: string) =>
    httpService.get<Label[]>(`/projects/${projectId}/labels`),

  create: (projectId: string, data: CreateLabelRequest) =>
    httpService.post<Label>(`/projects/${projectId}/labels`, data),

  update: (projectId: string, labelId: string, data: UpdateLabelRequest) =>
    httpService.patch<Label>(`/projects/${projectId}/labels/${labelId}`, data),

  delete: (projectId: string, labelId: string) =>
    httpService.delete<void>(`/projects/${projectId}/labels/${labelId}`),
};
