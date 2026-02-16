import { httpService } from '~/services/httpService';
import type { ActivityLog } from '~/types/activity';
import type { PaginatedResponse, PaginationParams } from '~/types/common';

export const activityService = {
  list: (projectId: string, params?: PaginationParams) =>
    httpService.get<PaginatedResponse<ActivityLog>>(`/projects/${projectId}/activity`, { params }),
};
