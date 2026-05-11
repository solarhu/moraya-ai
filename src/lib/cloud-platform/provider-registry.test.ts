/**
 * 云平台注册表测试
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { cloudProviderRegistry } from './provider-registry';
import type { CloudProviderAPI, ProviderCapabilities } from './types';

// 模拟适配器
class MockCloudAdapter implements CloudProviderAPI {
  provider = 'mock' as any;
  displayName = 'Mock Provider';
  icon = 'mock-icon';
  description = 'Mock adapter for testing';
  
  async authenticate() { return true; }
  async isAuthenticated() { return true; }
  async logout() {}
  getAuthStatus() { return Promise.resolve('authenticated'); }
  
  async createFile() { return {} as any; }
  async readFile() { return ''; }
  async updateFile() { return {} as any; }
  async deleteFile() {}
  async moveFile() { return {} as any; }
  async copyFile() { return {} as any; }
  async getFile() { return {} as any; }
  async listFiles() { return []; }
  async searchFiles() { return []; }
  
  async createFolder() { return {} as any; }
  async getFolder() { return {} as any; }
  async listFolders() { return []; }
  async deleteFolder() {}
  async moveFolder() { return {} as any; }
  
  async sync() { return { success: true } as any; }
  getSyncStatus() { return Promise.resolve({ status: 'idle' }); }
  async pauseSync() {}
  async resumeSync() {}
  async cancelSync() {}
  
  getPermissions() { return Promise.resolve({ readable: true }); }
  async setPermissions() {}
  async shareFile() { return {} as any; }
  async unshareFile() {}
  
  getCapabilities(): ProviderCapabilities {
    return {
      supportsMarkdown: true,
      supportsWiki: false,
      supportsDrive: true,
      supportsDocs: false,
      supportsCollaboration: false,
      supportsVersioning: false,
      supportsOffline: true,
      supportsShare: false,
      maxFileSize: 1024,
      maxFolderDepth: 10,
      supportedMimeTypes: ['text/markdown'],
      features: ['mock'],
    };
  }
  
  async isAvailable() { return true; }
  getConfig() { return {}; }
  async setConfig() {}
}

class MockLarkAdapter extends MockCloudAdapter {
  provider = 'lark';
  displayName = '飞书';
  icon = 'lark-icon';
  description = '飞书云文档';
  
  getCapabilities(): ProviderCapabilities {
    return {
      ...super.getCapabilities(),
      supportsWiki: true,
      supportsDocs: true,
      supportsCollaboration: true,
      supportsVersioning: true,
    };
  }
}

describe('CloudProviderRegistry', () => {
  beforeEach(() => {
    cloudProviderRegistry.clear();
  });
  
  test('应该能够注册云平台适配器', () => {
    const adapter = new MockCloudAdapter();
    cloudProviderRegistry.register(adapter);
    
    expect(cloudProviderRegistry.has('mock')).toBe(true);
    expect(cloudProviderRegistry.get('mock')).toBe(adapter);
  });
  
  test('应该能够获取已注册的适配器', () => {
    const adapter = new MockCloudAdapter();
    cloudProviderRegistry.register(adapter);
    
    const retrieved = cloudProviderRegistry.get('mock');
    expect(retrieved).toBeDefined();
    expect(retrieved?.provider).toBe('mock');
    expect(retrieved?.displayName).toBe('Mock Provider');
  });
  
  test('应该能够列出所有适配器', () => {
    const adapter1 = new MockCloudAdapter();
    const adapter2 = new MockLarkAdapter();
    
    cloudProviderRegistry.register(adapter1);
    cloudProviderRegistry.register(adapter2);
    
    const list = cloudProviderRegistry.list();
    expect(list.length).toBe(2);
    expect(list.some(a => a.provider === 'mock')).toBe(true);
    expect(list.some(a => a.provider === 'lark')).toBe(true);
  });
  
  test('应该能够获取可用的适配器（支持Markdown）', () => {
    const adapter1 = new MockCloudAdapter();
    const adapter2 = new MockLarkAdapter();
    
    cloudProviderRegistry.register(adapter1);
    cloudProviderRegistry.register(adapter2);
    
    const available = cloudProviderRegistry.getAvailable();
    expect(available.length).toBe(2);
    expect(available.every(a => a.getCapabilities().supportsMarkdown)).toBe(true);
  });
  
  test('应该能够过滤不支持Markdown的适配器', () => {
    class NoMarkdownAdapter extends MockCloudAdapter {
      provider = 'no-markdown' as any;
      getCapabilities(): ProviderCapabilities {
        return { ...super.getCapabilities(), supportsMarkdown: false };
      }
    }
    
    const adapter1 = new MockCloudAdapter();
    const adapter2 = new NoMarkdownAdapter();
    
    cloudProviderRegistry.register(adapter1);
    cloudProviderRegistry.register(adapter2);
    
    const available = cloudProviderRegistry.getAvailable();
    expect(available.length).toBe(1);
    expect(available[0].provider).toBe('mock');
  });
  
  test('应该能够移除适配器', () => {
    const adapter = new MockCloudAdapter();
    cloudProviderRegistry.register(adapter);
    
    expect(cloudProviderRegistry.has('mock')).toBe(true);
    
    cloudProviderRegistry.unregister('mock');
    expect(cloudProviderRegistry.has('mock')).toBe(false);
    expect(cloudProviderRegistry.get('mock')).toBeUndefined();
  });
  
  test('应该能够清空所有适配器', () => {
    const adapter1 = new MockCloudAdapter();
    const adapter2 = new MockLarkAdapter();
    
    cloudProviderRegistry.register(adapter1);
    cloudProviderRegistry.register(adapter2);
    
    expect(cloudProviderRegistry.list().length).toBe(2);
    
    cloudProviderRegistry.clear();
    expect(cloudProviderRegistry.list().length).toBe(0);
  });
  
  test('应该能够获取推荐的适配器（按优先级）', () => {
    const mockAdapter = new MockCloudAdapter();
    const larkAdapter = new MockLarkAdapter();
    
    cloudProviderRegistry.register(mockAdapter);
    cloudProviderRegistry.register(larkAdapter);
    
    const recommended = cloudProviderRegistry.getRecommended();
    expect(recommended.length).toBeGreaterThanOrEqual(1);
    // lark应该在前面（优先级高）
    expect(recommended.some(a => a.provider === 'lark')).toBe(true);
  });
  
  test('应该能够获取统计信息', () => {
    const adapter1 = new MockCloudAdapter();
    const adapter2 = new MockLarkAdapter();
    
    cloudProviderRegistry.register(adapter1);
    cloudProviderRegistry.register(adapter2);
    
    const stats = cloudProviderRegistry.getStats();
    expect(stats.total).toBe(2);
    expect(stats.available).toBe(2);
  });
  
  test('重复注册应该替换旧适配器', () => {
    const adapter1 = new MockCloudAdapter();
    adapter1.displayName = 'Mock V1';
    
    const adapter2 = new MockCloudAdapter();
    adapter2.displayName = 'Mock V2';
    
    cloudProviderRegistry.register(adapter1);
    cloudProviderRegistry.register(adapter2);
    
    const retrieved = cloudProviderRegistry.get('mock');
    expect(retrieved?.displayName).toBe('Mock V2');
  });
  
  test('获取未注册的适配器应该返回undefined', () => {
    const adapter = cloudProviderRegistry.get('not-exist');
    expect(adapter).toBeUndefined();
  });
  
  test('has方法应该正确检测注册状态', () => {
    expect(cloudProviderRegistry.has('mock')).toBe(false);
    
    const adapter = new MockCloudAdapter();
    cloudProviderRegistry.register(adapter);
    
    expect(cloudProviderRegistry.has('mock')).toBe(true);
    expect(cloudProviderRegistry.has('not-exist')).toBe(false);
  });
});

describe('CloudProviderAPI Interface', () => {
  test('适配器应该实现所有必需方法', () => {
    const adapter = new MockCloudAdapter();
    
    // 检查必需属性
    expect(adapter.provider).toBeDefined();
    expect(adapter.displayName).toBeDefined();
    expect(adapter.icon).toBeDefined();
    expect(adapter.description).toBeDefined();
    
    // 检查认证方法
    expect(typeof adapter.authenticate).toBe('function');
    expect(typeof adapter.isAuthenticated).toBe('function');
    expect(typeof adapter.logout).toBe('function');
    
    // 检查文件操作方法
    expect(typeof adapter.createFile).toBe('function');
    expect(typeof adapter.readFile).toBe('function');
    expect(typeof adapter.updateFile).toBe('function');
    expect(typeof adapter.deleteFile).toBe('function');
    expect(typeof adapter.moveFile).toBe('function');
    expect(typeof adapter.copyFile).toBe('function');
    
    // 检查同步方法
    expect(typeof adapter.sync).toBe('function');
    expect(typeof adapter.getSyncStatus).toBe('function');
    
    // 检查能力方法
    expect(typeof adapter.getCapabilities).toBe('function');
  });
  
  test('getCapabilities应该返回正确的结构', async () => {
    const adapter = new MockCloudAdapter();
    const capabilities = adapter.getCapabilities();
    
    expect(capabilities.supportsMarkdown).toBeDefined();
    expect(capabilities.supportsWiki).toBeDefined();
    expect(capabilities.supportsDrive).toBeDefined();
    expect(capabilities.maxFileSize).toBeDefined();
    expect(capabilities.supportedMimeTypes).toBeDefined();
    expect(Array.isArray(capabilities.supportedMimeTypes)).toBe(true);
  });
});