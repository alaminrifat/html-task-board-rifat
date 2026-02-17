import { httpService } from '~/services/httpService';
import type { ProjectMember, Invitation } from '~/types/member';
import type { PaginatedResponse } from '~/types/common';

export const memberService = {
  list: (projectId: string) =>
    httpService.get<ProjectMember[]>(`/projects/${projectId}/members`),

  invite: (projectId: string, data: { email: string }) =>
    httpService.post<Invitation>(`/projects/${projectId}/members/invite`, data),

  remove: (projectId: string, userId: string) =>
    httpService.delete<void>(`/projects/${projectId}/members/${userId}`),

  listInvitations: (projectId: string) =>
    httpService.get<Invitation[]>(`/projects/${projectId}/invitations`),

  resendInvitation: (projectId: string, invitationId: string) =>
    httpService.post<Invitation>(`/projects/${projectId}/invitations/${invitationId}/resend`),

  cancelInvitation: (projectId: string, invitationId: string) =>
    httpService.delete<void>(`/projects/${projectId}/invitations/${invitationId}`),

  getInvitationByToken: (token: string) =>
    httpService.get<Invitation>(`/invitations/${token}`),

  acceptInvitation: (token: string) =>
    httpService.post<Invitation>(`/invitations/${token}/accept`),

  declineInvitation: (token: string) =>
    httpService.post<{ message: string }>(`/invitations/${token}/decline`),
};
