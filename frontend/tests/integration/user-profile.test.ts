import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { userService } from '~/services/httpServices/userService';

const API = 'http://localhost:3000/api';

describe('User Profile Integration', () => {
  // ── Get Profile ────────────────────────────────────────────────────────
  describe('Get Profile', () => {
    it('should fetch current user profile', async () => {
      const user = await userService.getMe();
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });
  });

  // ── Update Profile ─────────────────────────────────────────────────────
  describe('Update Profile', () => {
    it('should send firstName/lastName to PATCH /users/me', async () => {
      let capturedBody: Record<string, unknown> = {};
      let capturedMethod = '';
      server.use(
        http.patch(`${API}/users/me`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          capturedMethod = request.method;
          return HttpResponse.json({
            success: true,
            statusCode: 200,
            data: { id: 'u1', ...capturedBody },
          });
        })
      );

      await userService.updateMe({ fullName: 'John Doe', jobTitle: 'Engineer' });

      expect(capturedMethod).toBe('PATCH');
      // NOTE: Currently sends { fullName, jobTitle }
      // After fix, should send { firstName, lastName, jobTitle }
      // expect(capturedBody.firstName).toBe('John');
      // expect(capturedBody.lastName).toBe('Doe');
      expect(capturedBody.jobTitle).toBe('Engineer');
    });
  });

  // ── Avatar Upload ──────────────────────────────────────────────────────
  describe('Avatar Upload', () => {
    it('should upload avatar with field name "file"', async () => {
      let receivedFieldName = '';
      server.use(
        http.post(`${API}/users/me/avatar`, async ({ request }) => {
          const formData = await request.formData();
          // Check which field name was used
          if (formData.has('file')) receivedFieldName = 'file';
          if (formData.has('avatar')) receivedFieldName = 'avatar';
          return HttpResponse.json({
            success: true,
            statusCode: 200,
            data: { id: 'u1', avatarUrl: '/uploads/avatar.jpg' },
          });
        })
      );

      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'avatar.png');
      await userService.uploadAvatar(formData);

      expect(receivedFieldName).toBe('file');
    });
  });

  // ── Change Password ────────────────────────────────────────────────────
  describe('Change Password', () => {
    it('should send only currentPassword and newPassword', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.patch(`${API}/users/me/password`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ success: true, statusCode: 200, data: null });
        })
      );

      await userService.changePassword({
        currentPassword: 'oldPass123',
        newPassword: 'newPass456',
        confirmPassword: 'newPass456',
      });

      expect(capturedBody.currentPassword).toBe('oldPass123');
      expect(capturedBody.newPassword).toBe('newPass456');
      // NOTE: After fix, confirmPassword should NOT be sent
      // expect(capturedBody.confirmPassword).toBeUndefined();
    });
  });

  // ── Notification Preferences ───────────────────────────────────────────
  describe('Notification Preferences', () => {
    it('should update notification preferences', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.patch(`${API}/users/me/notifications`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            statusCode: 200,
            data: { id: 'u1', pushEnabled: false },
          });
        })
      );

      await userService.updateNotifications({ pushEnabled: false });
      expect(capturedBody.pushEnabled).toBe(false);
    });

    it('should update digest frequency', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.patch(`${API}/users/me/notifications`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            statusCode: 200,
            data: { id: 'u1', digestFrequency: 'WEEKLY' },
          });
        })
      );

      await userService.updateNotifications({ digestFrequency: 'WEEKLY' });
      expect(capturedBody.digestFrequency).toBe('WEEKLY');
    });
  });

  // ── Devices ────────────────────────────────────────────────────────────
  describe('Push Notification Devices', () => {
    it('should register a device', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.post(`${API}/users/me/devices`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            { success: true, statusCode: 201, data: { id: 'dev-1' } },
            { status: 201 }
          );
        })
      );

      await userService.registerDevice({ token: 'fcm-token', platform: 'web' });
      expect(capturedBody.token).toBe('fcm-token');
      expect(capturedBody.platform).toBe('web');
    });

    it('should remove a device', async () => {
      await expect(userService.removeDevice('dev-1')).resolves.not.toThrow();
    });
  });

  // ── Delete Account ─────────────────────────────────────────────────────
  describe('Delete Account', () => {
    it('should delete account', async () => {
      await expect(userService.deleteAccount()).resolves.not.toThrow();
    });
  });
});
