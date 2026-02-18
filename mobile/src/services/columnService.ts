import { httpService } from '~/services/httpService';
import type { Column } from '~/types/column';

interface CreateColumnRequest {
  title: string;
  wipLimit?: number;
}

interface UpdateColumnRequest {
  title?: string;
  wipLimit?: number;
}

interface ReorderColumnsRequest {
  columnIds: string[];
}

export const columnService = {
  list: (projectId: string) =>
    httpService.get<Column[]>(`/projects/${projectId}/columns`),
  create: (projectId: string, data: CreateColumnRequest) =>
    httpService.post<Column>(`/projects/${projectId}/columns`, data),
  update: (projectId: string, columnId: string, data: UpdateColumnRequest) =>
    httpService.patch<Column>(
      `/projects/${projectId}/columns/${columnId}`,
      data,
    ),
  delete: (projectId: string, columnId: string) =>
    httpService.delete<void>(
      `/projects/${projectId}/columns/${columnId}`,
    ),
  reorder: (projectId: string, data: ReorderColumnsRequest) =>
    httpService.patch<Column[]>(
      `/projects/${projectId}/columns/reorder`,
      data,
    ),
};
