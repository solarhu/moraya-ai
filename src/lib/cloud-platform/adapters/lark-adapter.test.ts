/**
 * 飞书云适配器测试
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LarkCloudAdapter } from './lark-adapter';
import type { PlatformAdapter } from '$lib/platform/types';

// Mock Tauri invoke
const mockInvoke = vi.fn();

// Mock platform adapters
const mockTauriAdapter: PlatformAdapter = {
  platform: 'tauri',
  fs: {
    init: vi.fn(async () => {}),
    readFile: vi.fn(async (path: string) => `Content of ${path}`),
    writeFile: vi.fn(async () => {}),
    deleteFile: vi.fn(async () => {}),
    exists: vi.fn(async () => true),
    listFiles: vi.fn(async () => [
      { path: 'test.md', name: 'test.md', size: 100, lastModified: Date.now() },
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

const mockWebAdapter: PlatformAdapter = {
  platform: 'web',
  fs: {
    init: vi.fn(async () => {}),
    readFile: vi.fn(async (path: string) => `Content of ${path}`),
    writeFile: vi.fn(async () => {}),
    deleteFile: vi.fn(async () => {}),
    exists: vi.fn(async () => true),
    listFiles: vi.fn(async () => [
      { path: 'test.md', name: 'test.md', size: 100, lastModified: Date.now() },
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
    get: vi.fn(async () => 'mock-token'),
    set: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    list: vi.fn(async () => []),
  },
  http: {
    fetch: vi.fn(async () => new Response(JSON.stringify({
      data: {
        file_token: 'test-token',
        content: 'test content',
      },
    }))),
  },
};

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

describe('LarkCloudAdapter', () => {
  describe('平台信息', () => {
    test('应该有正确的平台标识', () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      expect(adapter.provider).toBe('lark');
      expect(adapter.displayName).toBe('飞书');
      expect(adapter.icon).toBe('lark');
      expect(adapter.description).toContain('飞书');
    });
    
    test('应该根据syncMode返回正确的平台能力', () => {
      const docsAdapter = new LarkCloudAdapter({ syncMode: 'docs' }, mockTauriAdapter);
      const driveAdapter = new LarkCloudAdapter({ syncMode: 'drive' }, mockTauriAdapter);
      const wikiAdapter = new LarkCloudAdapter({ syncMode: 'wiki' }, mockTauriAdapter);
      
      expect(docsAdapter.getCapabilities().supportsDocs).toBe(true);
      expect(driveAdapter.getCapabilities().supportsDrive).toBe(true);
      expect(wikiAdapter.getCapabilities().supportsWiki).toBe(true);
    });
    
    test('应该包含正确的特性标识', () => {
      const tauriAdapter = new LarkCloudAdapter({}, mockTauriAdapter);
      const webAdapter = new LarkCloudAdapter({ appId: 'test', appSecret: 'test' }, mockWebAdapter);
      
      expect(tauriAdapter.getCapabilities().features).toContain('lark-cli-integration');
      expect(webAdapter.getCapabilities().features).toContain('lark-open-api');
    });
  });
  
  describe('Tauri环境认证', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockInvoke.mockReset();
    });
    
    test('应该能够调用lark-cli认证命令', async () => {
      mockInvoke.mockResolvedValueOnce('success');
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'docs',
      }, mockTauriAdapter);
      
      const result = await adapter.authenticate();
      
      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('lark_cli_auth_login', {
        cliPath: '/usr/bin/lark-cli',
        domain: 'docs',
      });
    });
    
    test('认证失败应该返回false', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Auth failed'));
      
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      const result = await adapter.authenticate();
      
      expect(result).toBe(false);
    });
    
    test('检查认证状态应该调用lark-cli', async () => {
      mockInvoke.mockResolvedValueOnce('success');
      
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      const isAuth = await adapter.isAuthenticated();
      
      expect(isAuth).toBe(true);
      expect(mockInvoke).toHaveBeenCalled();
    });
  });
  
  describe('Web环境认证', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
    
    test('缺少appId和appSecret应该抛出错误', async () => {
      const adapter = new LarkCloudAdapter({}, mockWebAdapter);
      
      await expect(adapter.authenticate()).rejects.toThrow('需要配置appId和appSecret');
    });
    
    test('已有token应该返回true', async () => {
      const adapter = new LarkCloudAdapter({
        appId: 'test-app',
        appSecret: 'test-secret',
      }, mockWebAdapter);
      
      // 等待初始化完成
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const isAuth = await adapter.isAuthenticated();
      expect(isAuth).toBe(true);
    });
    
    test('logout应该清除token', async () => {
      mockWebAdapter.storage.get = vi.fn(async () => null);
      
      const adapter = new LarkCloudAdapter({
        appId: 'test-app',
        appSecret: 'test-secret',
      }, mockWebAdapter);
      
      await adapter.logout();
      
      const isAuth = await adapter.isAuthenticated();
      expect(isAuth).toBe(false);
      expect(mockWebAdapter.storage.delete).toHaveBeenCalledWith('lark-access-token');
    });
  });
  
  describe('文件操作 - Tauri环境', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockInvoke.mockReset();
    });
    
    test('创建文档应该调用docs_create命令', async () => {
      mockInvoke.mockResolvedValueOnce('new-file-token');
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'docs',
        folderToken: 'folder-123',
      }, mockTauriAdapter);
      
      const file = await adapter.createFile({
        name: 'Test Doc',
        content: '# Test',
        folderId: 'folder-123',
      });
      
      expect(file.id).toBe('new-file-token');
      expect(file.name).toBe('Test Doc');
      expect(mockInvoke).toHaveBeenCalledWith('lark_cli_docs_create', {
        cliPath: '/usr/bin/lark-cli',
        title: 'Test Doc',
        content: '# Test',
        folderToken: 'folder-123',
      });
    });
    
    test('创建Markdown文件应该调用markdown_create命令', async () => {
      mockInvoke.mockResolvedValueOnce('new-md-token');
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'markdown',
      }, mockTauriAdapter);
      
      const file = await adapter.createFile({
        name: 'test.md',
        content: '# Test',
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('lark_cli_markdown_create', expect.anything());
    });
    
    test('读取文件应该调用fetch命令', async () => {
      mockInvoke.mockResolvedValueOnce('# File Content');
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'docs',
      }, mockTauriAdapter);
      
      const content = await adapter.readFile('file-token-123');
      
      expect(content).toBe('# File Content');
      expect(mockInvoke).toHaveBeenCalledWith('lark_cli_docs_fetch', {
        cliPath: '/usr/bin/lark-cli',
        fileToken: 'file-token-123',
      });
    });
    
    test('更新文件应该调用update命令', async () => {
      mockInvoke.mockResolvedValueOnce('success');
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'docs',
      }, mockTauriAdapter);
      
      const file = await adapter.updateFile('file-token', {
        content: 'Updated content',
      });
      
      expect(file.id).toBe('file-token');
      expect(mockInvoke).toHaveBeenCalledWith('lark_cli_docs_update', expect.anything());
    });
    
    test('drive模式应该能够列出文件', async () => {
      mockInvoke.mockResolvedValueOnce([
        { token: 'file1', name: 'file1.md', size: 100 },
        { token: 'file2', name: 'file2.md', size: 200 },
      ]);
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'drive',
        folderToken: 'folder-123',
      }, mockTauriAdapter);
      
      const files = await adapter.listFiles();
      
      expect(files.length).toBe(2);
      expect(files[0].name).toBe('file1.md');
      expect(mockInvoke).toHaveBeenCalledWith('lark_cli_drive_list', expect.anything());
    });
    
    test('docs模式搜索应该调用search命令', async () => {
      mockInvoke.mockResolvedValueOnce([
        { token: 'result1', title: 'Result 1' },
      ]);
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'docs',
      }, mockTauriAdapter);
      
      const results = await adapter.searchFiles('test query');
      
      expect(results.length).toBe(1);
      expect(mockInvoke).toHaveBeenCalledWith('lark_cli_docs_search', expect.anything());
    });
  });
  
  describe('文件操作 - Web环境', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockWebAdapter.storage.get = vi.fn(async () => 'mock-access-token');
      mockWebAdapter.http.fetch = vi.fn(async (url: string, options?: any) => {
        if (options?.method === 'POST') {
          return new Response(JSON.stringify({
            data: { file_token: 'new-web-token' },
          }));
        }
        return new Response(JSON.stringify({
          data: { content: 'web content' },
        }));
      });
    });
    
    test('创建文件应该调用飞书开放平台API', async () => {
      const adapter = new LarkCloudAdapter({
        appId: 'test-app',
        appSecret: 'test-secret',
        syncMode: 'docs',
      }, mockWebAdapter);
      
      // 等待初始化
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const file = await adapter.createFile({
        name: 'Web Doc',
        content: '# Test',
      });
      
      expect(file.id).toBe('new-web-token');
      expect(mockWebAdapter.http.fetch).toHaveBeenCalledWith(
        expect.stringContaining('open.feishu.cn'),
        expect.objectContaining({ method: 'POST' })
      );
    });
    
    test('读取文件应该调用飞书API', async () => {
      const adapter = new LarkCloudAdapter({
        appId: 'test-app',
        appSecret: 'test-secret',
      }, mockWebAdapter);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const content = await adapter.readFile('web-file-token');
      
      expect(content).toBe('web content');
      expect(mockWebAdapter.http.fetch).toHaveBeenCalledWith(
        expect.stringContaining('open.feishu.cn'),
        expect.anything()
      );
    });
    
    test('未认证时应该抛出错误', async () => {
      mockWebAdapter.storage.get = vi.fn(async () => null);
      
      const adapter = new LarkCloudAdapter({
        appId: 'test-app',
        appSecret: 'test-secret',
      }, mockWebAdapter);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await expect(adapter.createFile({
        name: 'test',
        content: 'test',
      })).rejects.toThrow('未认证');
    });
  });
  
  describe('文件夹操作', () => {
    test('wiki模式应该能够创建文件夹', async () => {
      mockInvoke.mockResolvedValueOnce('new-node-token');
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'wiki',
      }, mockTauriAdapter);
      
      const folder = await adapter.createFolder('New Folder', 'parent-token');
      
      expect(folder.id).toBe('new-node-token');
      expect(mockInvoke).toHaveBeenCalledWith('lark_cli_wiki_create_node', expect.anything());
    });
    
    test('非wiki模式应该抛出错误', async () => {
      const adapter = new LarkCloudAdapter({
        syncMode: 'docs',
      }, mockTauriAdapter);
      
      await expect(adapter.createFolder('test')).rejects.toThrow('仅支持Wiki模式下创建文件夹');
    });
    
    test('wiki模式应该能够列出文件夹', async () => {
      mockInvoke.mockResolvedValueOnce([
        { token: 'node1', title: 'Node 1' },
        { token: 'node2', title: 'Node 2' },
      ]);
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'wiki',
      }, mockTauriAdapter);
      
      const folders = await adapter.listFolders();
      
      expect(folders.length).toBe(2);
      expect(mockInvoke).toHaveBeenCalledWith('lark_cli_wiki_list', expect.anything());
    });
    
    test('删除文件夹应该抛出错误', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      await expect(adapter.deleteFolder('folder-id')).rejects.toThrow('不支持通过API删除');
    });
  });
  
  describe('同步功能', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
    
    test('应该能够执行上传同步', async () => {
      mockInvoke.mockResolvedValue('upload-token');
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'docs',
      }, mockTauriAdapter);
      
      const report = await adapter.sync({
        mode: 'upload',
        localPath: '/local',
        remoteFolderId: 'remote-folder',
      });
      
      expect(report.success).toBeDefined();
      expect(report.uploadedFiles).toBeDefined();
      expect(report.duration).toBeDefined();
    });
    
    test('应该能够执行下载同步', async () => {
      mockInvoke.mockResolvedValue([
        { token: 'file1', name: 'file1.md' },
      ]);
      mockInvoke.mockResolvedValue('# Downloaded content');
      
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'drive',
      }, mockTauriAdapter);
      
      const report = await adapter.sync({
        mode: 'download',
        localPath: '/local',
        remoteFolderId: 'remote-folder',
      });
      
      expect(report.downloadedFiles).toBeDefined();
    });
    
    test('同步错误应该记录到报告中', async () => {
      mockInvoke.mockRejectedValue(new Error('Sync failed'));
      
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      const report = await adapter.sync({
        mode: 'upload',
        localPath: '/local',
        remoteFolderId: 'remote',
      });
      
      expect(report.errors.length).toBeGreaterThan(0);
    });
    
    test('应该能够获取同步状态', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      const status = await adapter.getSyncStatus();
      expect(status.status).toBe('idle');
    });
    
    test('应该能够暂停同步', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      await adapter.pauseSync();
      const status = await adapter.getSyncStatus();
      expect(status.status).toBe('paused');
    });
  });
  
  describe('权限与分享', () => {
    test('应该返回基本权限信息', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      const permissions = await adapter.getPermissions('file-id');
      
      expect(permissions.readable).toBe(true);
      expect(permissions.writable).toBe(true);
      expect(permissions.deletable).toBe(false);
    });
    
    test('设置权限应该抛出错误', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      await expect(adapter.setPermissions('file-id', {})).rejects.toThrow('不支持通过API设置');
    });
    
    test('分享应该返回飞书URL', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      const share = await adapter.shareFile('file-token', { type: 'public' });
      
      expect(share.shareUrl).toContain('feishu.cn');
      expect(share.shareId).toBe('file-token');
    });
  });
  
  describe('配置管理', () => {
    test('应该能够获取配置', () => {
      const adapter = new LarkCloudAdapter({
        cliPath: '/usr/bin/lark-cli',
        syncMode: 'docs',
      }, mockTauriAdapter);
      
      const config = adapter.getConfig();
      
      expect(config.cliPath).toBe('/usr/bin/lark-cli');
      expect(config.syncMode).toBe('docs');
    });
    
    test('应该能够设置配置', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      await adapter.setConfig({ syncMode: 'wiki' });
      const config = adapter.getConfig();
      
      expect(config.syncMode).toBe('wiki');
    });
  });
  
  describe('可用性检查', () => {
    test('Tauri环境应该返回true', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      const available = await adapter.isAvailable();
      expect(available).toBe(true);
    });
    
    test('Web环境需要appId和appSecret', async () => {
      const adapterWithConfig = new LarkCloudAdapter({
        appId: 'test',
        appSecret: 'test',
      }, mockWebAdapter);
      
      const adapterWithoutConfig = new LarkCloudAdapter({}, mockWebAdapter);
      
      expect(await adapterWithConfig.isAvailable()).toBe(true);
      expect(await adapterWithoutConfig.isAvailable()).toBe(false);
    });
  });
  
  describe('不支持的操作', () => {
    test('删除文件应该抛出错误', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      await expect(adapter.deleteFile('file-id')).rejects.toThrow('不支持通过API删除');
    });
    
    test('移动文件应该抛出错误', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      await expect(adapter.moveFile('file-id', 'folder-id')).rejects.toThrow('不支持通过API移动');
    });
    
    test('复制文件应该抛出错误', async () => {
      const adapter = new LarkCloudAdapter({}, mockTauriAdapter);
      
      await expect(adapter.copyFile('file-id', 'folder-id')).rejects.toThrow('不支持通过API复制');
    });
  });
});