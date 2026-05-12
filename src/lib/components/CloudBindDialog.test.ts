/**
 * 云平台绑定对话框逻辑测试
 * 
 * 测试对话框的核心逻辑，不依赖UI渲染库
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { cloudProviderRegistry } from '$lib/cloud-platform';
import type { CloudProviderAPI, ProviderCapabilities } from '$lib/cloud-platform/types';
import type { KnowledgeBase } from '$lib/stores/files-store';

// Mock cloud provider
let mockConfig = {};
const mockLarkProvider: CloudProviderAPI = {
  provider: 'lark',
  displayName: '飞书',
  icon: 'lark',
  description: '飞书云文档',
  
  authenticate: vi.fn(async () => true),
  isAuthenticated: vi.fn(async () => true),
  logout: vi.fn(async () => {}),
  getAuthStatus: vi.fn(async () => 'authenticated'),
  
  createFile: vi.fn(async () => ({ id: 'test' } as any)),
  readFile: vi.fn(async () => 'content'),
  updateFile: vi.fn(async () => ({ id: 'test' } as any)),
  deleteFile: vi.fn(async () => {}),
  moveFile: vi.fn(async () => ({ id: 'test' } as any)),
  copyFile: vi.fn(async () => ({ id: 'test' } as any)),
  getFile: vi.fn(async () => ({ id: 'test' } as any)),
  listFiles: vi.fn(async () => [
    { id: 'file1', name: 'file1.md', size: 100, updatedAt: Date.now() },
    { id: 'file2', name: 'file2.md', size: 200, updatedAt: Date.now() },
  ]),
  searchFiles: vi.fn(async () => []),
  
  createFolder: vi.fn(async () => ({ id: 'folder' } as any)),
  getFolder: vi.fn(async () => ({ id: 'folder' } as any)),
  listFolders: vi.fn(async () => []),
  deleteFolder: vi.fn(async () => {}),
  moveFolder: vi.fn(async () => ({ id: 'folder' } as any)),
  
  sync: vi.fn(async () => ({
    success: true,
    uploadedFiles: 10,
    downloadedFiles: 5,
    skippedFiles: 2,
    failedFiles: 0,
    errors: [],
    duration: 1000,
    timestamp: Date.now(),
  })),
  getSyncStatus: vi.fn(async () => ({ status: 'idle' })),
  pauseSync: vi.fn(async () => {}),
  resumeSync: vi.fn(async () => {}),
  cancelSync: vi.fn(async () => {}),
  
  getPermissions: vi.fn(async () => ({ readable: true })),
  setPermissions: vi.fn(async () => {}),
  shareFile: vi.fn(async () => ({ shareUrl: 'url' })),
  unshareFile: vi.fn(async () => {}),
  
  getCapabilities: vi.fn(() => ({
    supportsMarkdown: true,
    supportsDocs: true,
    supportsWiki: false,
    supportsDrive: false,
    supportsCollaboration: true,
    supportsVersioning: true,
    supportsOffline: false,
    supportsShare: true,
    maxFileSize: 50 * 1024 * 1024,
    maxFolderDepth: 10,
    supportedMimeTypes: ['text/markdown'],
    features: ['lark-cli-integration'],
  })),
  
  isAvailable: vi.fn(async () => true),
  getConfig: vi.fn(() => mockConfig),
  setConfig: vi.fn(async (config) => { mockConfig = { ...mockConfig, ...config }; }),
};

describe('CloudBindDialog逻辑', () => {
  let mockKb: KnowledgeBase;
  
  beforeEach(() => {
    vi.clearAllMocks();
    cloudProviderRegistry.clear();
    mockConfig = {}; // Reset config
    
    mockKb = {
      id: 'kb-123',
      name: 'Test KB',
      path: '/path/to/kb',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    cloudProviderRegistry.register(mockLarkProvider);
  });
  
  describe('云平台选择', () => {
    test('应该能够获取可用的云平台列表', () => {
      const providers = cloudProviderRegistry.getAvailable();
      expect(providers.length).toBe(1);
      expect(providers[0].provider).toBe('lark');
    });
    
    test('应该能够获取飞书平台能力', () => {
      const provider = cloudProviderRegistry.get('lark');
      const capabilities = provider?.getCapabilities();
      
      expect(capabilities?.supportsMarkdown).toBe(true);
      expect(capabilities?.supportsDocs).toBe(true);
    });
  });
  
  describe('认证流程', () => {
    test('飞书认证应该成功', async () => {
      const provider = cloudProviderRegistry.get('lark');
      const success = await provider?.authenticate();
      
      expect(success).toBe(true);
      expect(mockLarkProvider.authenticate).toHaveBeenCalled();
    });
    
    test('应该能够设置飞书配置', async () => {
      const provider = cloudProviderRegistry.get('lark');
      await provider?.setConfig({
        cliPath: '/usr/bin/lark-cli',
        folderToken: 'test-folder',
        syncMode: 'markdown',
      });
      
      expect(mockLarkProvider.setConfig).toHaveBeenCalledWith({
        cliPath: '/usr/bin/lark-cli',
        folderToken: 'test-folder',
        syncMode: 'markdown',
      });
    });
  });
  
  describe('文件扫描', () => {
    test('应该能够列出远程文件', async () => {
      const provider = cloudProviderRegistry.get('lark');
      const files = await provider?.listFiles('test-folder');
      
      expect(files?.length).toBe(2);
      expect(files?.[0].name).toBe('file1.md');
    });
  });
  
  describe('同步流程', () => {
    test('上传同步应该成功', async () => {
      const provider = cloudProviderRegistry.get('lark');
      const report = await provider?.sync({
        mode: 'upload',
        localPath: mockKb.path,
        remoteFolderId: 'test-folder',
      });
      
      expect(report?.success).toBe(true);
      expect(report?.uploadedFiles).toBe(10);
      expect(mockLarkProvider.sync).toHaveBeenCalled();
    });
    
    test('下载同步应该成功', async () => {
      const provider = cloudProviderRegistry.get('lark');
      const report = await provider?.sync({
        mode: 'download',
        localPath: mockKb.path,
        remoteFolderId: 'test-folder',
      });
      
      expect(report?.success).toBe(true);
      expect(report?.downloadedFiles).toBe(5);
    });
    
    test('双向同步应该成功', async () => {
      const provider = cloudProviderRegistry.get('lark');
      const report = await provider?.sync({
        mode: 'bidirectional',
        localPath: mockKb.path,
        remoteFolderId: 'test-folder',
      });
      
      expect(report?.success).toBe(true);
      expect(report?.uploadedFiles).toBe(10);
      expect(report?.downloadedFiles).toBe(5);
    });
  });
  
  describe('绑定完成', () => {
    test('应该能够保存绑定配置', async () => {
      const provider = cloudProviderRegistry.get('lark');
      
      await provider?.setConfig({
        cliPath: '/usr/bin/lark-cli',
        folderToken: 'final-folder',
        autoSync: true,
        syncInterval: 60,
      });
      
      const config = provider?.getConfig();
      expect(config?.autoSync).toBe(true);
      expect(config?.syncInterval).toBe(60);
    });
  });
});