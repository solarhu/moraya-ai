/**
 * 本地云适配器测试
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LocalCloudAdapter } from './local-adapter';
import type { PlatformAdapter } from '$lib/platform/types';

// 模拟平台适配器
const mockPlatformAdapter: PlatformAdapter = {
  platform: 'web',
  fs: {
    init: vi.fn(async () => {}),
    readFile: vi.fn(async (path: string) => `Content of ${path}`),
    writeFile: vi.fn(async () => {}),
    deleteFile: vi.fn(async () => {}),
    exists: vi.fn(async (path: string) => path.includes('test')),
    listFiles: vi.fn(async () => [
      { path: 'test.md', name: 'test.md', size: 100, lastModified: Date.now() },
      { path: 'folder/file.md', name: 'file.md', size: 50, lastModified: Date.now() },
    ]),
    pickFile: vi.fn(async () => null),
    downloadFile: vi.fn(async () => {}),
  },
  dialog: {
    openFile: vi.fn(async () => null),
    saveFile: vi.fn(async () => null),
    message: vi.fn(async () => {}),
    ask: vi.fn(async () => false),
    confirm: vi.fn(async () => false),
  },
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    list: vi.fn(async () => []),
  },
  http: {
    fetch: vi.fn(async () => new Response()),
  },
};

describe('LocalCloudAdapter', () => {
  let adapter: LocalCloudAdapter;
  
  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new LocalCloudAdapter(mockPlatformAdapter);
  });
  
  describe('平台信息', () => {
    test('应该有正确的平台标识', () => {
      expect(adapter.provider).toBe('local');
      expect(adapter.displayName).toBe('本地存储');
      expect(adapter.icon).toBe('folder');
      expect(adapter.description).toContain('本地');
    });
    
    test('应该返回正确的平台能力', () => {
      const capabilities = adapter.getCapabilities();
      
      expect(capabilities.supportsMarkdown).toBe(true);
      expect(capabilities.supportsOffline).toBe(true);
      expect(capabilities.supportsCollaboration).toBe(false);
      expect(capabilities.supportsShare).toBe(false);
      expect(capabilities.maxFileSize).toBe(Infinity);
      expect(capabilities.features).toContain('local-storage');
    });
  });
  
  describe('认证相关', () => {
    test('authenticate应该始终返回true', async () => {
      const result = await adapter.authenticate();
      expect(result).toBe(true);
    });
    
    test('isAuthenticated应该始终返回true', async () => {
      const result = await adapter.isAuthenticated();
      expect(result).toBe(true);
    });
    
    test('getAuthStatus应该返回authenticated', async () => {
      const status = await adapter.getAuthStatus();
      expect(status).toBe('authenticated');
    });
    
    test('logout应该不执行任何操作', async () => {
      await adapter.logout();
      // 应该正常完成，无异常
    });
  });
  
  describe('文件操作', () => {
    test('应该能够创建文件', async () => {
      const file = await adapter.createFile({
        name: 'new-file.md',
        content: '# New File',
      });
      
      expect(file.name).toBe('new-file.md');
      expect(file.size).toBe('# New File'.length);
      expect(file.mimeType).toBe('text/markdown');
      expect(mockPlatformAdapter.fs.writeFile).toHaveBeenCalled();
    });
    
    test('应该能够读取文件', async () => {
      const content = await adapter.readFile('test.md');
      
      expect(content).toBe('Content of test.md');
      expect(mockPlatformAdapter.fs.readFile).toHaveBeenCalledWith('test.md');
    });
    
    test('应该能够更新文件内容', async () => {
      const file = await adapter.updateFile('test.md', {
        content: 'Updated content',
      });
      
      expect(file.id).toBe('test.md');
      expect(mockPlatformAdapter.fs.writeFile).toHaveBeenCalledWith('test.md', 'Updated content');
    });
    
    test('应该能够删除文件', async () => {
      await adapter.deleteFile('test.md');
      
      expect(mockPlatformAdapter.fs.deleteFile).toHaveBeenCalledWith('test.md');
    });
    
    test('应该能够列出文件', async () => {
      const files = await adapter.listFiles();
      
      expect(files.length).toBe(2);
      expect(files[0].name).toBe('test.md');
      expect(files[1].name).toBe('file.md');
      expect(mockPlatformAdapter.fs.listFiles).toHaveBeenCalled();
    });
    
    test('应该能够检查文件是否存在', async () => {
      const file = await adapter.getFile('test.md');
      
      expect(file.id).toBe('test.md');
      expect(file.name).toBe('test.md');
    });
    
    test('获取不存在的文件应该抛出错误', async () => {
      mockPlatformAdapter.fs.exists = vi.fn(async () => false);
      
      await expect(adapter.getFile('not-exist.md')).rejects.toThrow('File not found');
    });
  });
  
  describe('文件夹操作', () => {
    test('应该能够创建文件夹（创建.folder标记）', async () => {
      const folder = await adapter.createFolder('new-folder');
      
      expect(folder.name).toBe('new-folder');
      expect(folder.id).toBe('new-folder');
      expect(mockPlatformAdapter.fs.writeFile).toHaveBeenCalledWith('new-folder/.folder', '');
    });
    
    test('应该能够列出文件夹', async () => {
      const folders = await adapter.listFolders();
      
      expect(folders.length).toBeGreaterThan(0);
      expect(folders.some(f => f.name === 'folder')).toBe(true);
    });
    
    test('应该能够删除文件夹', async () => {
      await adapter.deleteFolder('test-folder', false);
      
      expect(mockPlatformAdapter.fs.deleteFile).toHaveBeenCalledWith('test-folder/.folder');
    });
  });
  
  describe('同步功能', () => {
    test('应该能够执行同步', async () => {
      const report = await adapter.sync({
        mode: 'upload',
        localPath: 'local',
        remoteFolderId: 'remote',
      });
      
      expect(report.success).toBeDefined();
      expect(report.uploadedFiles).toBeDefined();
      expect(report.duration).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });
    
    test('应该能够获取同步状态', async () => {
      const status = await adapter.getSyncStatus();
      
      expect(status.status).toBeDefined();
      expect(typeof status.pendingChanges).toBe('number');
    });
    
    test('应该能够暂停同步', async () => {
      await adapter.pauseSync();
      const status = await adapter.getSyncStatus();
      expect(status.status).toBe('paused');
    });
    
    test('应该能够恢复同步', async () => {
      await adapter.pauseSync();
      await adapter.resumeSync();
      const status = await adapter.getSyncStatus();
      expect(status.status).toBe('idle');
    });
    
    test('应该能够取消同步', async () => {
      await adapter.cancelSync();
      const status = await adapter.getSyncStatus();
      expect(status.status).toBe('idle');
    });
  });
  
  describe('权限与分享', () => {
    test('应该返回正确的权限', async () => {
      const permissions = await adapter.getPermissions('test.md');
      
      expect(permissions.readable).toBe(true);
      expect(permissions.writable).toBe(true);
      expect(permissions.deletable).toBe(true);
      expect(permissions.shareable).toBe(false);
    });
    
    test('setPermissions应该不执行任何操作', async () => {
      await adapter.setPermissions('test.md', { writable: false });
      // 应该正常完成，无异常
    });
    
    test('shareFile应该抛出错误（本地不支持分享）', async () => {
      try {
        await adapter.shareFile('test.md', { type: 'public' });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('does not support');
      }
    });
  });
  
  describe('配置管理', () => {
    test('应该能够获取配置', () => {
      const config = adapter.getConfig();
      expect(typeof config).toBe('object');
    });
    
    test('应该能够设置配置', async () => {
      await adapter.setConfig({ test: 'value' });
      const config = adapter.getConfig();
      expect(config.test).toBe('value');
    });
  });
  
  describe('可用性检查', () => {
    test('isAvailable应该返回true（如果init成功）', async () => {
      const available = await adapter.isAvailable();
      expect(available).toBe(true);
      expect(mockPlatformAdapter.fs.init).toHaveBeenCalled();
    });
    
    test('isAvailable应该返回false（如果init失败）', async () => {
      mockPlatformAdapter.fs.init = vi.fn(async () => { throw new Error('Failed'); });
      
      const available = await adapter.isAvailable();
      expect(available).toBe(false);
    });
  });
  
  describe('搜索功能', () => {
    test('应该能够搜索文件（按名称）', async () => {
      const results = await adapter.searchFiles('test');
      
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('test.md');
    });
    
    test('应该返回空数组（如果未匹配）', async () => {
      const results = await adapter.searchFiles('not-exist');
      
      expect(results.length).toBe(0);
    });
  });
  
  describe('文件排序和分页', () => {
    test('应该能够按名称排序', async () => {
      mockPlatformAdapter.fs.listFiles = vi.fn(async () => [
        { path: 'b.md', name: 'b.md', lastModified: 1 },
        { path: 'a.md', name: 'a.md', lastModified: 2 },
      ]);
      
      const files = await adapter.listFiles(undefined, { sortBy: 'name', sortOrder: 'asc' });
      
      expect(files[0].name).toBe('a.md');
      expect(files[1].name).toBe('b.md');
    });
    
    test('应该能够分页', async () => {
      mockPlatformAdapter.fs.listFiles = vi.fn(async () => [
        { path: 'file1.md', name: 'file1.md', lastModified: 1 },
        { path: 'file2.md', name: 'file2.md', lastModified: 2 },
        { path: 'file3.md', name: 'file3.md', lastModified: 3 },
      ]);
      
      const files = await adapter.listFiles(undefined, { offset: 1, limit: 1 });
      
      expect(files.length).toBe(1);
      expect(files[0].name).toBe('file2.md');
    });
  });
});