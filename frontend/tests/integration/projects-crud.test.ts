import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { projectService } from '~/services/httpServices/projectService';
import { columnService } from '~/services/httpServices/columnService';
import { labelService } from '~/services/httpServices/labelService';
import { memberService } from '~/services/httpServices/memberService';

const API = 'http://localhost:3000/api';

describe('Projects CRUD Integration', () => {
  // ── List ───────────────────────────────────────────────────────────────
  describe('List Projects', () => {
    it('should list projects with pagination', async () => {
      const result = await projectService.list({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
    });

    it('should handle empty project list', async () => {
      server.use(
        http.get(`${API}/projects`, () => {
          return HttpResponse.json({
            data: [],
            meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
          });
        })
      );

      const result = await projectService.list();
      expect(result.data).toHaveLength(0);
    });

    it('should pass filter params to API', async () => {
      let capturedParams: URLSearchParams | null = null;
      server.use(
        http.get(`${API}/projects`, ({ request }) => {
          capturedParams = new URL(request.url).searchParams;
          return HttpResponse.json({
            data: [],
            meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
          });
        })
      );

      await projectService.list({ page: 2, limit: 5 });

      expect(capturedParams).not.toBeNull();
      expect(capturedParams!.get('page')).toBe('2');
      expect(capturedParams!.get('limit')).toBe('5');
    });
  });

  // ── Get By ID ──────────────────────────────────────────────────────────
  describe('Get Project', () => {
    it('should get project by ID', async () => {
      const result = await projectService.getById('proj-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('proj-1');
    });

    it('should handle project not found', async () => {
      server.use(
        http.get(`${API}/projects/:projectId`, () => {
          return HttpResponse.json(
            { success: false, statusCode: 404, message: 'Not found' },
            { status: 404 }
          );
        })
      );

      await expect(projectService.getById('nonexistent')).rejects.toBeDefined();
    });
  });

  // ── Create ─────────────────────────────────────────────────────────────
  describe('Create Project', () => {
    it('should create a project with required fields', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.post(`${API}/projects`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              success: true,
              statusCode: 201,
              data: { id: 'proj-new', ...capturedBody },
            },
            { status: 201 }
          );
        })
      );

      const result = await projectService.create({
        title: 'New Project',
        description: 'Description',
        template: 'DEFAULT',
        deadline: '2025-12-31',
      });

      expect(result).toBeDefined();
      expect(capturedBody.title).toBe('New Project');
      expect(capturedBody.template).toBe('DEFAULT');
    });
  });

  // ── Update ─────────────────────────────────────────────────────────────
  describe('Update Project', () => {
    it('should update a project with PATCH', async () => {
      let capturedBody: Record<string, unknown> = {};
      let capturedMethod = '';
      server.use(
        http.patch(`${API}/projects/:projectId`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          capturedMethod = request.method;
          return HttpResponse.json({
            success: true,
            statusCode: 200,
            data: { id: 'proj-1', ...capturedBody },
          });
        })
      );

      await projectService.update('proj-1', { title: 'Updated Title' });

      expect(capturedMethod).toBe('PATCH');
      expect(capturedBody.title).toBe('Updated Title');
    });
  });

  // ── Archive ────────────────────────────────────────────────────────────
  describe('Archive Project', () => {
    it('should archive a project', async () => {
      const result = await projectService.archive('proj-1');
      expect(result).toBeDefined();
    });
  });

  // ── Delete ─────────────────────────────────────────────────────────────
  describe('Delete Project', () => {
    it('should delete a project', async () => {
      await expect(projectService.delete('proj-1')).resolves.not.toThrow();
    });
  });

  // ── Board ──────────────────────────────────────────────────────────────
  describe('Board', () => {
    it('should get board data', async () => {
      const result = await projectService.getBoard('proj-1');
      expect(result).toBeDefined();
    });
  });

  // ── Columns CRUD ───────────────────────────────────────────────────────
  describe('Columns CRUD', () => {
    it('should list columns', async () => {
      const result = await columnService.list('proj-1');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should create a column', async () => {
      const result = await columnService.create('proj-1', { title: 'New Column' });
      expect(result).toBeDefined();
    });

    it('should update a column', async () => {
      const result = await columnService.update('proj-1', 'col-1', { title: 'Updated' });
      expect(result).toBeDefined();
    });

    it('should delete a column', async () => {
      await expect(columnService.delete('proj-1', 'col-1')).resolves.not.toThrow();
    });

    it('should reorder columns', async () => {
      await expect(
        columnService.reorder('proj-1', { columnIds: ['col-2', 'col-1'] })
      ).resolves.not.toThrow();
    });
  });

  // ── Labels CRUD ────────────────────────────────────────────────────────
  describe('Labels CRUD', () => {
    it('should list labels', async () => {
      const result = await labelService.list('proj-1');
      expect(result).toBeDefined();
    });

    it('should create a label', async () => {
      const result = await labelService.create('proj-1', { name: 'Bug', color: '#EF4444' });
      expect(result).toBeDefined();
    });

    it('should update a label', async () => {
      const result = await labelService.update('proj-1', 'label-1', { name: 'Feature' });
      expect(result).toBeDefined();
    });

    it('should delete a label', async () => {
      await expect(labelService.delete('proj-1', 'label-1')).resolves.not.toThrow();
    });
  });

  // ── Members ────────────────────────────────────────────────────────────
  describe('Members', () => {
    it('should list members', async () => {
      const result = await memberService.list('proj-1');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should invite a member with email', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.post(`${API}/projects/:projectId/members/invite`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            { success: true, statusCode: 201, data: { id: 'inv-new' } },
            { status: 201 }
          );
        })
      );

      await memberService.invite('proj-1', { email: 'new@example.com' });
      expect(capturedBody.email).toBe('new@example.com');
    });

    it('should remove a member', async () => {
      await expect(memberService.remove('proj-1', 'user-2')).resolves.not.toThrow();
    });

    it('should list invitations', async () => {
      const result = await memberService.listInvitations('proj-1');
      expect(result).toBeDefined();
    });

    it('should resend an invitation', async () => {
      await expect(memberService.resendInvitation('proj-1', 'inv-1')).resolves.not.toThrow();
    });

    it('should cancel an invitation', async () => {
      await expect(memberService.cancelInvitation('proj-1', 'inv-1')).resolves.not.toThrow();
    });

    it('should accept an invitation', async () => {
      const result = await memberService.acceptInvitation('inv-token-123');
      expect(result).toBeDefined();
    });

    it('should decline an invitation', async () => {
      const result = await memberService.declineInvitation('inv-token-123');
      expect(result).toBeDefined();
    });
  });
});
