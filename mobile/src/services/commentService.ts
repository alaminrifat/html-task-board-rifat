import { httpService } from '~/services/httpService';
import type { Comment } from '~/types/comment';

interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

interface UpdateCommentRequest {
  content: string;
}

export const commentService = {
  list: (projectId: string, taskId: string) =>
    httpService.get<Comment[]>(
      `/projects/${projectId}/tasks/${taskId}/comments`,
    ),
  create: (projectId: string, taskId: string, data: CreateCommentRequest) =>
    httpService.post<Comment>(
      `/projects/${projectId}/tasks/${taskId}/comments`,
      data,
    ),
  update: (
    projectId: string,
    taskId: string,
    commentId: string,
    data: UpdateCommentRequest,
  ) =>
    httpService.patch<Comment>(
      `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
      data,
    ),
  delete: (projectId: string, taskId: string, commentId: string) =>
    httpService.delete<void>(
      `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    ),
};
