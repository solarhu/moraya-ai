import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cloudApi } from './cloud';

describe('Cloud API', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    localStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  describe('getStatus', () => {
    it('should get cloud status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          larkCliInstalled: true,
          larkAuthenticated: true,
          userName: 'Test User',
        }),
      });

      const result = await cloudApi.getStatus();

      expect(result.success).toBe(true);
      expect(result.data?.larkCliInstalled).toBe(true);
    });

    it('should call correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await cloudApi.getStatus();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/status',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('startLarkAuth', () => {
    it('should start lark auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          loginUrl: 'https://example.com/auth',
          message: 'Please visit URL',
        }),
      });

      const result = await cloudApi.startLarkAuth();

      expect(result.success).toBe(true);
      expect(result.data?.loginUrl).toBe('https://example.com/auth');
    });
  });

  describe('getLarkAuthStatus', () => {
    it('should get lark auth status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          authenticated: true,
          userName: 'User',
        }),
      });

      const result = await cloudApi.getLarkAuthStatus();

      expect(result.success).toBe(true);
      expect(result.data?.authenticated).toBe(true);
    });
  });

  describe('logoutLark', () => {
    it('should logout from lark', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Logged out',
        }),
      });

      const result = await cloudApi.logoutLark();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/lark/auth/logout',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('createDocument', () => {
    it('should create document', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          document: {
            id: 'doc-123',
            title: 'Test Doc',
            url: 'https://feishu.cn/doc/doc-123',
          },
        }),
      });

      const result = await cloudApi.createDocument('Test Doc', '# Content');

      expect(result.success).toBe(true);
      expect(result.data?.document?.id).toBe('doc-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/lark/documents',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'Test Doc',
            content: '# Content',
            folderToken: undefined,
          }),
        })
      );
    });

    it('should create document with folder token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, document: { id: 'doc-456' } }),
      });

      await cloudApi.createDocument('Test', 'Content', 'folder-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/lark/documents',
        expect.objectContaining({
          body: JSON.stringify({
            title: 'Test',
            content: 'Content',
            folderToken: 'folder-123',
          }),
        })
      );
    });
  });

  describe('fetchDocument', () => {
    it('should fetch document', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          document: {
            id: 'doc-123',
            title: 'Test',
            content: '# Test',
          },
        }),
      });

      const result = await cloudApi.fetchDocument('doc-123');

      expect(result.success).toBe(true);
      expect(result.data?.document?.content).toBe('# Test');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/lark/documents/doc-123',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('updateDocument', () => {
    it('should update document', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Updated' }),
      });

      const result = await cloudApi.updateDocument('doc-123', '# New Content');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/lark/documents/doc-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ content: '# New Content', mode: undefined }),
        })
      );
    });

    it('should update document with mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await cloudApi.updateDocument('doc-123', 'Content', 'overwrite');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/lark/documents/doc-123',
        expect.objectContaining({
          body: JSON.stringify({ content: 'Content', mode: 'overwrite' }),
        })
      );
    });
  });

  describe('deleteDocument', () => {
    it('should delete document', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Deleted' }),
      });

      const result = await cloudApi.deleteDocument('doc-123');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/lark/documents/doc-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should delete document with type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await cloudApi.deleteDocument('doc-123', 'docx');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/lark/documents/doc-123?type=docx',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('searchDocuments', () => {
    it('should search documents', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          documents: [
            { id: 'doc-1', title: 'Result 1' },
            { id: 'doc-2', title: 'Result 2' },
          ],
        }),
      });

      const result = await cloudApi.searchDocuments('test query');

      expect(result.success).toBe(true);
      expect(result.data?.documents).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cloud/lark/search?query=test%20query',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('uploadFile', () => {
    it('should upload file', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          file: { token: 'file-123', name: 'test.md', type: 'file' },
        }),
      });

      const result = await cloudApi.uploadFile('/path/to/test.md');

      expect(result.success).toBe(true);
      expect(result.data?.file?.token).toBe('file-123');
    });
  });

  describe('downloadFile', () => {
    it('should download file', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Downloaded' }),
      });

      const result = await cloudApi.downloadFile('file-123', '/local/path');

      expect(result.success).toBe(true);
    });
  });
});