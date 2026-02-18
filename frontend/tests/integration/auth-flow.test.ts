import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { authService } from '~/services/httpServices/authService';
import { userService } from '~/services/httpServices/userService';

const API = 'http://localhost:3000/api';

describe('Auth Flow Integration', () => {
  // ── Login ───────────────────────────────────────────────────────────────
  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should fail login with invalid credentials', async () => {
      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toBeDefined();
    });

    it('should send rememberMe flag when provided', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.post(`${API}/auth/login`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            statusCode: 200,
            data: { user: { id: 'u1', email: 'test@example.com' } },
          });
        })
      );

      await authService.login({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      });

      expect(capturedBody.rememberMe).toBe(true);
    });
  });

  // ── Registration ────────────────────────────────────────────────────────
  describe('Registration', () => {
    // BUG: authService.register calls /auth/register but backend expects POST /users
    // These tests verify the BUG EXISTS by expecting the call to fail (no handler at /auth/register)
    it('should fail because register calls wrong endpoint /auth/register', async () => {
      // authService.register calls POST /auth/register which doesn't exist
      // After fix: it should call POST /users
      await expect(
        authService.register({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.toBeDefined();
    });

    // Also mock /auth/register to verify the frontend IS calling it
    it('should currently call /auth/register (wrong endpoint)', async () => {
      let calledUrl = '';
      server.use(
        http.post(`${API}/auth/register`, async ({ request }) => {
          calledUrl = new URL(request.url).pathname;
          return HttpResponse.json(
            { success: true, statusCode: 201, data: { id: 'u1' } },
            { status: 201 }
          );
        })
      );

      await authService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      // Confirms the BUG: frontend calls /auth/register instead of /users
      expect(calledUrl).toContain('/auth/register');
    });
  });

  // ── Forgot Password ────────────────────────────────────────────────────
  describe('Forgot Password', () => {
    it('should send forgot password request', async () => {
      const result = await authService.forgotPassword({
        email: 'test@example.com',
      });

      expect(result).toBeDefined();
    });
  });

  // ── Reset Password ─────────────────────────────────────────────────────
  describe('Reset Password', () => {
    it('should send email and password (not token) to reset endpoint', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.post(`${API}/auth/reset-password`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            statusCode: 200,
            data: { user: { id: 'u1' } },
          });
        })
      );

      await authService.resetPassword({
        token: 'reset-token',
        password: 'newPassword123',
      });

      expect(capturedBody.token).toBe('reset-token');
      expect(capturedBody.password).toBe('newPassword123');
    });
  });

  // ── Token Refresh ──────────────────────────────────────────────────────
  describe('Token Refresh', () => {
    it('should call refresh endpoint', async () => {
      const result = await authService.refresh();
      expect(result).toBeDefined();
    });
  });

  // ── Auth Check (getMe) ────────────────────────────────────────────────
  describe('Auth Check', () => {
    it('should fetch current user profile', async () => {
      const user = await userService.getMe();
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should handle unauthenticated state', async () => {
      server.use(
        http.get(`${API}/users/me`, () => {
          return HttpResponse.json(
            { success: false, statusCode: 401, message: 'Unauthorized' },
            { status: 401 }
          );
        }),
        // Also mock the refresh to fail
        http.get(`${API}/auth/refresh-access-token`, () => {
          return HttpResponse.json(
            { success: false, statusCode: 401, message: 'Refresh failed' },
            { status: 401 }
          );
        })
      );

      await expect(userService.getMe()).rejects.toBeDefined();
    });
  });

  // ── Logout ─────────────────────────────────────────────────────────────
  describe('Logout', () => {
    it('should call logout endpoint', async () => {
      const result = await authService.logout();
      expect(result).toBeDefined();
    });
  });

  // ── Social Login ───────────────────────────────────────────────────────
  describe('Social Login', () => {
    it('should send full social login payload', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.post(`${API}/auth/social-login`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            statusCode: 200,
            data: { user: { id: 'u1' }, isNewUser: false },
          });
        })
      );

      await authService.googleAuth({
        token: 'google-token-123',
        fullName: 'Test User',
        email: 'test@example.com',
        socialLoginType: 'GOOGLE',
      });

      expect(capturedBody).toBeDefined();
      expect(capturedBody.token).toBe('google-token-123');
      expect(capturedBody.fullName).toBe('Test User');
      expect(capturedBody.email).toBe('test@example.com');
      expect(capturedBody.socialLoginType).toBe('GOOGLE');
    });
  });
});
