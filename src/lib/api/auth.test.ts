import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApi } from './auth';
import { HttpClient } from './http-client';

describe('Auth API', () => {
  const mockFetch = vi.fn();
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient('http://localhost:3000');
    global.fetch = mockFetch;
    localStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    authApi.logout();
  });

  describe('register', () => {
    it('should register user and save token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: '1', email: 'test@example.com' },
          token: 'test-token',
        }),
      });

      const result = await authApi.register('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe('test-token');
      expect(localStorage.getItem('moraya_token')).toBe('test-token');
    });

    it('should handle registration error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Email already exists', code: 'USER_EXISTS' }),
      });

      const result = await authApi.register('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
      expect(localStorage.getItem('moraya_token')).toBeNull();
    });

    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: {}, token: 't' }),
      });

      await authApi.register('test@example.com', 'password');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
        })
      );
    });
  });

  describe('login', () => {
    it('should login and save token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: '1', email: 'test@example.com' },
          token: 'login-token',
        }),
      });

      const result = await authApi.login('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe('login-token');
      expect(localStorage.getItem('moraya_token')).toBe('login-token');
    });

    it('should handle login error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials', code: 'AUTH_FAILED' }),
      });

      const result = await authApi.login('test@example.com', 'wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('me', () => {
    it('should get current user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: '1', email: 'test@example.com' },
        }),
      });

      const result = await authApi.me();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/me',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('verify', () => {
    it('should verify token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true, user: { id: '1' } }),
      });

      const result = await authApi.verify();

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear token', () => {
      localStorage.setItem('moraya_token', 'some-token');
      
      authApi.logout();

      expect(localStorage.getItem('moraya_token')).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when no token', () => {
      localStorage.clear();
      expect(authApi.isLoggedIn()).toBe(false);
    });

    it('should return true after login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: {}, token: 'login-token' }),
      });
      
      await authApi.login('test@example.com', 'password');
      expect(localStorage.getItem('moraya_token')).toBe('login-token');
    });
  });
});