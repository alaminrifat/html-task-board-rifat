import { httpService } from '~/services/httpService';
import type {
  AdminUser,
  AdminUserDetail,
  CreateUserPayload,
  UpdateUserPayload,
  BulkUserActionPayload,
} from '~/types/admin';
import type { PaginationParams } from '~/types/common';

interface UserListParams extends PaginationParams {
  role?: string;
  status?: string;
}

export const adminUserService = {
  getUsers: (params?: UserListParams) =>
    httpService.getPaginated<AdminUser>('/admin/users', { params }),

  getUserById: (id: string) =>
    httpService.get<AdminUserDetail>(`/admin/users/${id}`),

  createUser: (data: CreateUserPayload) =>
    httpService.post<AdminUser>('/admin/users', data),

  updateUser: (id: string, data: UpdateUserPayload) =>
    httpService.patch<AdminUser>(`/admin/users/${id}`, data),

  changeStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') =>
    httpService.patch<AdminUser>(`/admin/users/${id}/status`, { status }),

  changeRole: (id: string, role: 'PROJECT_OWNER' | 'TEAM_MEMBER') =>
    httpService.patch<AdminUser>(`/admin/users/${id}/role`, { role }),

  resetPassword: (id: string) =>
    httpService.post<{ message: string }>(`/admin/users/${id}/reset-password`),

  deleteUser: (id: string) =>
    httpService.delete(`/admin/users/${id}`),

  bulkAction: (data: BulkUserActionPayload) =>
    httpService.post<{ affected: number }>('/admin/users/bulk', data),

  exportUsers: (params?: { format?: string }) =>
    httpService.get<Blob>('/admin/users/export', {
      params,
      responseType: 'blob',
    }),
};
