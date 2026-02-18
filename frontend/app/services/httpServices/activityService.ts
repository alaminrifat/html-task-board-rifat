import { httpService } from '~/services/httpService';
import type { ActivityLog } from '~/types/activity';
import type { PaginationParams } from '~/types/common';

export const activityService = {
  list: (projectId: string, params?: PaginationParams & { taskId?: string }) =>
    httpService.getPaginated<ActivityLog>(`/projects/${projectId}/activity`, { params }),
};
