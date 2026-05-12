/**
 * 飞书云平台适配器
 * 
 * 支持Tauri环境（lark-cli）和Web环境（飞书开放平台API）
 */

import type { 
  CloudProviderAPI, 
  CloudFile, 
  CloudFolder,
  CreateFileOptions,
  UpdateFileOptions,
  SyncOptions,
  SyncReport,
  SyncStatus,
  Permissions,
  ShareOptions,
  ShareResult,
  ProviderCapabilities,
  ListOptions,
  SearchOptions,
} from '../types';
import type { PlatformAdapter } from '$lib/platform/types';

export interface LarkConfig {
  // Tauri环境配置
  cliPath?: string;
  folderToken?: string;
  syncMode?: 'docs' | 'drive' | 'markdown';
  
  // Web环境配置
  appId?: string;
  appSecret?: string;
  
  // 通用配置
  autoSync?: boolean;
  syncInterval?: number;
}

export class LarkCloudAdapter implements CloudProviderAPI {
  provider = 'lark' as const;
  displayName = '飞书';
  icon = 'lark';
  description = '飞书云文档、Drive和Wiki';
  
  private platformAdapter: PlatformAdapter;
  private config: LarkConfig;
  private syncStatus: SyncStatus = { status: 'idle', pendingChanges: 0 };
  private accessToken?: string;
  private mode: 'docs' | 'drive' | 'markdown';
  
  constructor(config: LarkConfig, platformAdapter: PlatformAdapter) {
    this.config = config;
    this.platformAdapter = platformAdapter;
    this.mode = config.syncMode || 'markdown';
    
    // Web环境初始化accessToken
    if (platformAdapter.platform === 'web' && config.appId && config.appSecret) {
      this.initWebAuth();
    }
  }
  
  private async initWebAuth() {
    // Web环境：从localStorage读取token
    if (this.platformAdapter.platform === 'web') {
      const token = await this.platformAdapter.storage.get('lark-access-token');
      if (token) {
        this.accessToken = token;
      }
    }
  }
  
  async authenticate(config?: Record<string, any>): Promise<boolean> {
    // Tauri环境：使用lark-cli认证
    if (this.platformAdapter.platform === 'tauri') {
      return await this.authenticateTauri();
    }
    
    // Web环境：使用飞书开放平台OAuth
    if (this.platformAdapter.platform === 'web') {
      return await this.authenticateWeb();
    }
    
    return false;
  }
  
  private async authenticateTauri(): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      
      // 调用lark-cli认证命令
      const result = await invoke('lark_cli_auth_login', {
        cliPath: this.config.cliPath,
        domain: this.mode === 'docs' ? 'docs' : 'markdown',
      });
      
      return result === 'success';
    } catch (error) {
      console.error('Lark Tauri authentication failed:', error);
      return false;
    }
  }
  
  private async authenticateWeb(): Promise<boolean> {
    // 飞书开放平台OAuth流程
    if (!this.config.appId || !this.config.appSecret) {
      throw new Error('飞书Web环境需要配置appId和appSecret');
    }
    
    // 检查是否已有token
    if (this.accessToken) {
      return true;
    }
    
    // OAuth认证流程
    const authUrl = `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${this.config.appId}&redirect_uri=${encodeURIComponent(window.location.origin + '/web/lark/callback')}`;
    
    // 弹出窗口让用户登录
    const authWindow = window.open(authUrl, '_blank', 'width=600,height=500');
    
    if (!authWindow) {
      throw new Error('无法打开认证窗口');
    }
    
    // 等待回调获取token（监听消息）
    return new Promise((resolve) => {
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'lark-auth-success') {
          this.accessToken = event.data.accessToken;
          await this.platformAdapter.storage.set('lark-access-token', this.accessToken);
          window.removeEventListener('message', handleMessage);
          resolve(true);
        }
        
        if (event.data.type === 'lark-auth-failed') {
          window.removeEventListener('message', handleMessage);
          resolve(false);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // 5分钟超时
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve(false);
      }, 5 * 60 * 1000);
    });
  }
  
  async isAuthenticated(): Promise<boolean> {
    if (this.platformAdapter.platform === 'tauri') {
      // Tauri环境：检查lark-cli是否已登录
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke('lark_cli_auth_login', {
          cliPath: this.config.cliPath,
          domain: this.mode,
        });
        return result === 'success';
      } catch {
        return false;
      }
    }
    
    // Web环境：检查是否有token
    return !!this.accessToken;
  }
  
  async logout(): Promise<void> {
    if (this.platformAdapter.platform === 'web') {
      this.accessToken = undefined;
      await this.platformAdapter.storage.delete('lark-access-token');
    }
  }
  
  getAuthStatus(): Promise<'authenticated' | 'unauthenticated' | 'expired' | 'error'> {
    if (this.accessToken) {
      return Promise.resolve('authenticated');
    }
    return Promise.resolve('unauthenticated');
  }
  
  async createFile(options: CreateFileOptions): Promise<CloudFile> {
    if (this.platformAdapter.platform === 'tauri') {
      return await this.createFileTauri(options);
    }
    return await this.createFileWeb(options);
  }
  
  private async createFileTauri(options: CreateFileOptions): Promise<CloudFile> {
    const { invoke } = await import('@tauri-apps/api/core');
    
    const command = this.mode === 'docs' ? 'lark_cli_docs_create' : 'lark_cli_markdown_create';
    
    const result = await invoke<string>(command, {
      cliPath: this.config.cliPath,
      title: options.name,
      content: options.content,
      folderToken: options.folderId || this.config.folderToken,
    });
    
    // 解析返回的file token
    const fileToken = result;
    
    return {
      id: fileToken,
      name: options.name,
      path: fileToken,
      size: options.content.length,
      mimeType: 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  private async createFileWeb(options: CreateFileOptions): Promise<CloudFile> {
    if (!this.accessToken) {
      throw new Error('未认证');
    }
    
    const endpoint = this.mode === 'docs' 
      ? 'https://open.feishu.cn/open-apis/docs/v1/documents'
      : 'https://open.feishu.cn/open-apis/drive/v1/files';
    
    const response = await this.platformAdapter.http.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: options.name,
        content: options.content,
        folder_token: options.folderId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`创建文件失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.data.file_token,
      name: options.name,
      path: data.data.file_token,
      size: options.content.length,
      mimeType: 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  async readFile(fileId: string): Promise<string> {
    if (this.platformAdapter.platform === 'tauri') {
      return await this.readFileTauri(fileId);
    }
    return await this.readFileWeb(fileId);
  }
  
  private async readFileTauri(fileId: string): Promise<string> {
    const { invoke } = await import('@tauri-apps/api/core');
    
    const command = this.mode === 'docs' ? 'lark_cli_docs_fetch' : 'lark_cli_markdown_fetch';
    
    return await invoke<string>(command, {
      cliPath: this.config.cliPath,
      fileToken: fileId,
    });
  }
  
  private async readFileWeb(fileId: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('未认证');
    }
    
    const endpoint = this.mode === 'docs'
      ? `https://open.feishu.cn/open-apis/docs/v1/documents/${fileId}/content`
      : `https://open.feishu.cn/open-apis/drive/v1/files/${fileId}/content`;
    
    const response = await this.platformAdapter.http.fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`读取文件失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.content;
  }
  
  async updateFile(fileId: string, options: UpdateFileOptions): Promise<CloudFile> {
    if (this.platformAdapter.platform === 'tauri') {
      return await this.updateFileTauri(fileId, options);
    }
    return await this.updateFileWeb(fileId, options);
  }
  
  private async updateFileTauri(fileId: string, options: UpdateFileOptions): Promise<CloudFile> {
    const { invoke } = await import('@tauri-apps/api/core');
    
    const command = this.mode === 'docs' ? 'lark_cli_docs_update' : 'lark_cli_markdown_overwrite';
    
    await invoke(command, {
      cliPath: this.config.cliPath,
      fileToken: fileId,
      content: options.content,
    });
    
    return {
      id: fileId,
      name: options.name || fileId,
      path: fileId,
      size: (options.content || '').length,
      mimeType: 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  private async updateFileWeb(fileId: string, options: UpdateFileOptions): Promise<CloudFile> {
    if (!this.accessToken) {
      throw new Error('未认证');
    }
    
    const endpoint = this.mode === 'docs'
      ? `https://open.feishu.cn/open-apis/docs/v1/documents/${fileId}/content`
      : `https://open.feishu.cn/open-apis/drive/v1/files/${fileId}/content`;
    
    const response = await this.platformAdapter.http.fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: options.content,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`更新文件失败: ${response.status}`);
    }
    
    return {
      id: fileId,
      name: options.name || fileId,
      path: fileId,
      size: (options.content || '').length,
      mimeType: 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  async deleteFile(fileId: string): Promise<void> {
    // 飞书不支持通过API删除文档（需要用户在飞书界面操作）
    throw new Error('飞书不支持通过API删除文档');
  }
  
  async moveFile(fileId: string, targetFolderId: string): Promise<CloudFile> {
    // 飞书不支持通过API移动文档
    throw new Error('飞书不支持通过API移动文档');
  }
  
  async copyFile(fileId: string, targetFolderId: string): Promise<CloudFile> {
    // 飞书不支持通过API复制文档
    throw new Error('飞书不支持通过API复制文档');
  }
  
  async getFile(fileId: string): Promise<CloudFile> {
    const content = await this.readFile(fileId);
    
    return {
      id: fileId,
      name: fileId,
      path: fileId,
      size: content.length,
      mimeType: 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  async listFiles(folderId?: string, options?: ListOptions): Promise<CloudFile[]> {
    if (this.platformAdapter.platform === 'tauri') {
      return await this.listFilesTauri(folderId);
    }
    return await this.listFilesWeb(folderId);
  }
  
  private async listFilesTauri(folderId?: string): Promise<CloudFile[]> {
    const { invoke } = await import('@tauri-apps/api/core');
    
    if (this.mode === 'drive') {
      const result = await invoke<any[]>('lark_cli_drive_list', {
        cliPath: this.config.cliPath,
        folderToken: folderId || this.config.folderToken,
      });
      
      return result.map(f => ({
        id: f.token || f.file_token,
        name: f.name,
        path: f.token || f.file_token,
        size: f.size || 0,
        mimeType: f.type || 'application/octet-stream',
        createdAt: f.create_time || Date.now(),
        updatedAt: f.modify_time || Date.now(),
      }));
    }
    
    // docs/markdown模式不支持列表
    return [];
  }
  
  private async listFilesWeb(folderId?: string): Promise<CloudFile[]> {
    if (!this.accessToken) {
      throw new Error('未认证');
    }
    
    const endpoint = `https://open.feishu.cn/open-apis/drive/v1/files?folder_token=${folderId || this.config.folderToken}`;
    
    const response = await this.platformAdapter.http.fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取文件列表失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.data.files.map(f => ({
      id: f.token,
      name: f.name,
      path: f.token,
      size: f.size,
      mimeType: f.type,
      createdAt: f.create_time,
      updatedAt: f.modify_time,
    }));
  }
  
  async searchFiles(query: string, options?: SearchOptions): Promise<CloudFile[]> {
    if (this.platformAdapter.platform === 'tauri') {
      const { invoke } = await import('@tauri-apps/api/core');
      
      if (this.mode === 'docs') {
        const result = await invoke<any[]>('lark_cli_docs_search', {
          cliPath: this.config.cliPath,
          query: query,
        });
        
        return result.map(f => ({
          id: f.token,
          name: f.title || f.name,
          path: f.token,
          size: 0,
          mimeType: 'text/markdown',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
      }
    }
    
    // Web环境或其他模式暂不支持搜索
    return [];
  }
  
  async createFolder(name: string, parentId?: string): Promise<CloudFolder> {
    if (this.platformAdapter.platform === 'tauri' && this.mode === 'wiki') {
      const { invoke } = await import('@tauri-apps/api/core');
      
      const result = await invoke<string>('lark_cli_wiki_create_node', {
        cliPath: this.config.cliPath,
        parentNodeToken: parentId || this.config.folderToken,
        title: name,
      });
      
      return {
        id: result,
        name: name,
        path: result,
        parentId: parentId,
        createdAt: Date.now(),
      };
    }
    
    throw new Error('飞书仅支持Wiki模式下创建文件夹');
  }
  
  async getFolder(folderId: string): Promise<CloudFolder> {
    return {
      id: folderId,
      name: folderId,
      path: folderId,
      parentId: undefined,
      createdAt: Date.now(),
      childrenCount: 0,
    };
  }
  
  async listFolders(parentId?: string): Promise<CloudFolder[]> {
    if (this.platformAdapter.platform === 'tauri' && this.mode === 'wiki') {
      const { invoke } = await import('@tauri-apps/api/core');
      
      const result = await invoke<any[]>('lark_cli_wiki_list', {
        cliPath: this.config.cliPath,
        parentNodeToken: parentId || this.config.folderToken,
      });
      
      return result.map(f => ({
        id: f.token,
        name: f.title || f.name,
        path: f.token,
        parentId: parentId,
        createdAt: Date.now(),
      }));
    }
    
    return [];
  }
  
  async deleteFolder(folderId: string, recursive?: boolean): Promise<void> {
    throw new Error('飞书不支持通过API删除文件夹');
  }
  
  async moveFolder(folderId: string, targetFolderId: string): Promise<CloudFolder> {
    throw new Error('飞书不支持通过API移动文件夹');
  }
  
  async sync(options: SyncOptions): Promise<SyncReport> {
    const startTime = Date.now();
    this.syncStatus = { status: 'syncing', pendingChanges: 0, progress: 0 };
    
    try {
      let uploadedFiles = 0;
      let downloadedFiles = 0;
      let skippedFiles = 0;
      const errors: Array<{ file: string; error: string }> = [];
      
      // 获取本地文件列表
      const localFiles = await this.platformAdapter.fs.listFiles(options.localPath);
      
      for (const file of localFiles) {
        try {
          if (options.mode === 'upload' || options.mode === 'bidirectional') {
            // 上传到飞书
            const content = await this.platformAdapter.fs.readFile(file.path);
            await this.createFile({
              name: file.name,
              content: content,
              folderId: options.remoteFolderId,
            });
            uploadedFiles++;
          }
          
          if (options.mode === 'download') {
            // 从飞书下载
            const remoteFiles = await this.listFiles(options.remoteFolderId);
            for (const remoteFile of remoteFiles) {
              const content = await this.readFile(remoteFile.id);
              await this.platformAdapter.fs.writeFile(
                `${options.localPath}/${remoteFile.name}`,
                content
              );
              downloadedFiles++;
            }
          }
        } catch (error) {
          errors.push({ file: file.path, error: String(error) });
        }
      }
      
      const duration = Date.now() - startTime;
      this.syncStatus = {
        status: 'success',
        lastSyncAt: Date.now(),
        pendingChanges: 0,
      };
      
      return {
        success: errors.length === 0,
        uploadedFiles,
        downloadedFiles,
        skippedFiles,
        failedFiles: errors.length,
        errors,
        duration,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.syncStatus = { status: 'error', pendingChanges: 0 };
      return {
        success: false,
        uploadedFiles: 0,
        downloadedFiles: 0,
        skippedFiles: 0,
        failedFiles: 0,
        errors: [{ file: '', error: String(error) }],
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }
  
  getSyncStatus(): Promise<SyncStatus> {
    return Promise.resolve(this.syncStatus);
  }
  
  async pauseSync(): Promise<void> {
    this.syncStatus.status = 'paused';
  }
  
  async resumeSync(): Promise<void> {
    this.syncStatus.status = 'idle';
  }
  
  async cancelSync(): Promise<void> {
    this.syncStatus = { status: 'idle', pendingChanges: 0 };
  }
  
  getPermissions(fileId: string): Promise<Permissions> {
    // 飞书权限管理复杂，返回基本信息
    return Promise.resolve({
      readable: true,
      writable: true,
      deletable: false,
      shareable: true,
      owner: 'lark-user',
    });
  }
  
  async setPermissions(fileId: string, permissions: Partial<Permissions>): Promise<void> {
    // 飞书不支持通过API设置权限
    throw new Error('飞书不支持通过API设置权限');
  }
  
  async shareFile(fileId: string, options: ShareOptions): Promise<ShareResult> {
    // 飞书分享需要通过飞书界面操作
    const shareUrl = `https://.feishu.cn/docx/${fileId}`;
    
    return {
      shareUrl,
      shareId: fileId,
    };
  }
  
  async unshareFile(fileId: string): Promise<void> {
    // 需要用户在飞书界面操作
    throw new Error('飞书不支持通过API取消分享');
  }
  
  getCapabilities(): ProviderCapabilities {
    const baseCapabilities: ProviderCapabilities = {
      supportsMarkdown: true,
      supportsWiki: this.mode === 'wiki',
      supportsDrive: this.mode === 'drive',
      supportsDocs: this.mode === 'docs',
      supportsCollaboration: true,
      supportsVersioning: true,
      supportsOffline: false,
      supportsShare: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFolderDepth: 10,
      supportedMimeTypes: ['text/markdown', 'text/plain'],
      features: [],
    };
    
    if (this.platformAdapter.platform === 'tauri') {
      baseCapabilities.features.push('lark-cli-integration');
    }
    
    if (this.platformAdapter.platform === 'web') {
      baseCapabilities.features.push('lark-open-api');
    }
    
    return baseCapabilities;
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      if (this.platformAdapter.platform === 'tauri') {
        // 检查lark-cli是否可用
        return true; // 假设可用
      }
      
      // Web环境：检查appId和appSecret是否配置
      return !!this.config.appId && !!this.config.appSecret;
    } catch {
      return false;
    }
  }
  
  getConfig(): Record<string, any> {
    return this.config;
  }
  
  async setConfig(config: Record<string, any>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // Web环境保存token
    if (this.accessToken && this.platformAdapter.platform === 'web') {
      await this.platformAdapter.storage.set('lark-access-token', this.accessToken);
    }
  }
}