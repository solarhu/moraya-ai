import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from './http-client';

describe('HttpClient', () => {
  let client: HttpClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    client = new HttpClient('http://localhost:3000');
    global.fetch = mockFetch;
    localStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
    client.setToken(null);
  });

  describe('Token Management', () => {
    it('should initialize without token', () => {
      expect(client.getToken()).toBeNull();
    });

    it('should set and get token', () => {
      client.setToken('test-token');
      expect(client.getToken()).toBe('test-token');
      expect(localStorage.getItem('moraya_token')).toBe('test-token');
    });

    it('should clear token', () => {
      client.setToken('test-token');
      client.setToken(null);
      expect(client.getToken()).toBeNull();
      expect(localStorage.getItem('moraya_token')).toBeNull();
    });

    it('should load token from localStorage on init', () => {
      localStorage.setItem('moraya_token', 'saved-token');
      const newClient = new HttpClient();
      expect(newClient.getToken()).toBe('saved-token');
    });
  });

  describe('GET Request', () => {
    it('should make GET request without token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 1 } }),
      });

      const result = await client.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, data: { id: 1 } });
    });

    it('should make GET request with token', async () => {
      client.setToken('my-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer my-token',
        },
        body: undefined,
      });
    });

    it('should handle error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found', code: 'NOT_FOUND' }),
      });

      const result = await client.get('/api/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.get('/api/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('POST Request', () => {
    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 2 } }),
      });

      const result = await client.post('/api/test', { name: 'test' });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'test' }),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('PUT Request', () => {
    it('should make PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.put('/api/test/1', { name: 'updated' });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/test/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'updated' }),
      });
    });
  });

  describe('DELETE Request', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.delete('/api/test/1');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/test/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
    });
  });
});