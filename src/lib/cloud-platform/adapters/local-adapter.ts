/**
 * 本地存储云平台适配器
 * 
 * 基于 IndexedDB（Web端）或 FileSystem（Tauri端）提供云平台统一接口。
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

export class LocalCloudAdapter implements CloudProviderAPI {
  provider = 'local' as const;
  displayName = '本地存储';
  icon = 'folder';
  description = '使用本地文件系统或IndexedDB存储文件';
  
  private platformAdapter: PlatformAdapter;
  private syncStatus: SyncStatus = { status: 'idle', pendingChanges: 0 };
  private config: Record<string, any> = {};
  
  constructor(platformAdapter: PlatformAdapter) {
    this.platformAdapter = platformAdapter;
  }
  
  async authenticate(): Promise<boolean> {
    // 本地存储无需认证，始终返回true
    return true;
  }
  
  async isAuthenticated(): Promise<boolean> {
    return true;
  }
  
  async logout(): Promise<void> {
    // 本地存储无需登出
    return;
  }
  
  getAuthStatus(): Promise<'authenticated' | 'unauthenticated' | 'expired' | 'error'> {
    return Promise.resolve('authenticated');
  }
  
  async createFile(options: CreateFileOptions): Promise<CloudFile> {
    const path = options.folderId 
      ? `${options.folderId}/${options.name}` 
      : options.name;
    
    await this.platformAdapter.fs.writeFile(path, options.content);
    
    const now = Date.now();
    return {
      id: path,
      name: options.name,
      path: path,
      size: options.content.length,
      mimeType: options.mimeType || 'text/markdown',
      createdAt: now,
      updatedAt: now,
      metadata: options.metadata,
    };
  }
  
  async readFile(fileId: string): Promise<string> {
    return await this.platformAdapter.fs.readFile(fileId);
  }
  
  async updateFile(fileId: string, options: UpdateFileOptions): Promise<CloudFile> {
    if (options.content) {
      await this.platformAdapter.fs.writeFile(fileId, options.content);
    }
    
    // 本地不支持重命名，需要复制+删除
    if (options.name && options.name !== fileId.split('/').pop()) {
      const newPath = fileId.replace(fileId.split('/').pop() || '', options.name);
      await this.platformAdapter.fs.writeFile(newPath, options.content || await this.readFile(fileId));
      await this.platformAdapter.fs.deleteFile(fileId);
      fileId = newPath;
    }
    
    const now = Date.now();
    return {
      id: fileId,
      name: options.name || fileId.split('/').pop() || fileId,
      path: fileId,
      size: (options.content || '').length,
      mimeType: 'text/markdown',
      createdAt: now,
      updatedAt: now,
      metadata: options.metadata,
    };
  }
  
  async deleteFile(fileId: string): Promise<void> {
    await this.platformAdapter.fs.deleteFile(fileId);
  }
  
  async moveFile(fileId: string, targetFolderId: string): Promise<CloudFile> {
    const content = await this.readFile(fileId);
    const newPath = `${targetFolderId}/${fileId.split('/').pop()}`;
    
    await this.platformAdapter.fs.writeFile(newPath, content);
    await this.platformAdapter.fs.deleteFile(fileId);
    
    return {
      id: newPath,
      name: newPath.split('/').pop() || newPath,
      path: newPath,
      size: content.length,
      mimeType: 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  async copyFile(fileId: string, targetFolderId: string): Promise<CloudFile> {
    const content = await this.readFile(fileId);
    const newPath = `${targetFolderId}/${fileId.split('/').pop()}`;
    
    await this.platformAdapter.fs.writeFile(newPath, content);
    
    return {
      id: newPath,
      name: newPath.split('/').pop() || newPath,
      path: newPath,
      size: content.length,
      mimeType: 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  async getFile(fileId: string): Promise<CloudFile> {
    const exists = await this.platformAdapter.fs.exists(fileId);
    if (!exists) {
      throw new Error(`File not found: ${fileId}`);
    }
    
    const content = await this.readFile(fileId);
    const stats = await this.platformAdapter.fs.listFiles();
    const stat = stats.find(f => f.path === fileId);
    
    return {
      id: fileId,
      name: fileId.split('/').pop() || fileId,
      path: fileId,
      size: content.length,
      mimeType: 'text/markdown',
      createdAt: stat?.lastModified || Date.now(),
      updatedAt: stat?.lastModified || Date.now(),
    };
  }
  
  async listFiles(folderId?: string, options?: ListOptions): Promise<CloudFile[]> {
    const files = await this.platformAdapter.fs.listFiles(folderId);
    
    let result = files.map(f => ({
      id: f.path,
      name: f.name || f.path.split('/').pop() || f.path,
      path: f.path,
      size: f.size || 0,
      mimeType: 'text/markdown',
      createdAt: f.lastModified || Date.now(),
      updatedAt: f.lastModified || Date.now(),
    }));
    
    // 排序
    if (options?.sortBy) {
      const sortKey = options.sortBy;
      const order = options.sortOrder || 'asc';
      
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        return order === 'asc' 
          ? (aVal > bVal ? 1 : -1)
          : (aVal < bVal ? 1 : -1);
      });
    }
    
    // 分页
    if (options?.offset !== undefined) {
      result = result.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  async searchFiles(query: string, options?: SearchOptions): Promise<CloudFile[]> {
    const allFiles = await this.listFiles(options?.folderId);
    
    return allFiles.filter(f => 
      f.name.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  async createFolder(name: string, parentId?: string): Promise<CloudFolder> {
    // 本地存储不支持真正的文件夹，用路径模拟
    const path = parentId ? `${parentId}/${name}` : name;
    
    // 创建一个空文件作为文件夹标记
    await this.platformAdapter.fs.writeFile(`${path}/.folder`, '');
    
    return {
      id: path,
      name: name,
      path: path,
      parentId: parentId,
      createdAt: Date.now(),
      childrenCount: 0,
    };
  }
  
  async getFolder(folderId: string): Promise<CloudFolder> {
    const files = await this.listFiles(folderId);
    
    return {
      id: folderId,
      name: folderId.split('/').pop() || folderId,
      path: folderId,
      parentId: folderId.split('/').slice(0, -1).join('/'),
      createdAt: Date.now(),
      childrenCount: files.length,
    };
  }
  
  async listFolders(parentId?: string): Promise<CloudFolder[]> {
    const files = await this.listFiles(parentId);
    
    // 识别文件夹（包含.folder文件的路径）
    const folders: CloudFolder[] = [];
    const seenFolders = new Set<string>();
    
    for (const file of files) {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        const folderPath = parts.slice(0, -1).join('/');
        if (!seenFolders.has(folderPath)) {
          seenFolders.add(folderPath);
          folders.push({
            id: folderPath,
            name: folderPath.split('/').pop() || folderPath,
            path: folderPath,
            parentId,
            createdAt: file.createdAt,
            childrenCount: 0,
          });
        }
      }
    }
    
    return folders;
  }
  
  async deleteFolder(folderId: string, recursive?: boolean): Promise<void> {
    if (recursive) {
      const files = await this.listFiles(folderId);
      for (const file of files) {
        await this.deleteFile(file.id);
      }
    }
    
    await this.platformAdapter.fs.deleteFile(`${folderId}/.folder`);
  }
  
  async moveFolder(folderId: string, targetFolderId: string): Promise<CloudFolder> {
    const files = await this.listFiles(folderId);
    const newPath = `${targetFolderId}/${folderId.split('/').pop()}`;
    
    for (const file of files) {
      await this.moveFile(file.id, newPath);
    }
    
    return await this.getFolder(newPath);
  }
  
  async sync(options: SyncOptions): Promise<SyncReport> {
    // 本地同步：将文件从一个位置复制到另一个位置
    const startTime = Date.now();
    this.syncStatus = { status: 'syncing', pendingChanges: 0, progress: 0 };
    
    try {
      let uploadedFiles = 0;
      let downloadedFiles = 0;
      let skippedFiles = 0;
      const errors: Array<{ file: string; error: string }> = [];
      
      const localFiles = await this.listFiles(options.localPath);
      
      for (const file of localFiles) {
        try {
          if (options.mode === 'upload' || options.mode === 'bidirectional') {
            // 复制文件到远程路径
            const content = await this.readFile(file.id);
            const remotePath = `${options.remoteFolderId}/${file.name}`;
            await this.platformAdapter.fs.writeFile(remotePath, content);
            uploadedFiles++;
          }
          
          if (options.mode === 'download') {
            // 从远程路径读取（这里远程也在本地）
            const remotePath = `${options.remoteFolderId}/${file.name}`;
            const exists = await this.platformAdapter.fs.exists(remotePath);
            if (exists) {
              const content = await this.readFile(remotePath);
              await this.platformAdapter.fs.writeFile(file.id, content);
              downloadedFiles++;
            } else {
              skippedFiles++;
            }
          }
        } catch (error) {
          errors.push({ file: file.id, error: String(error) });
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
    return Promise.resolve({
      readable: true,
      writable: true,
      deletable: true,
      shareable: false, // 本地不支持分享
      owner: 'local-user',
    });
  }
  
  setPermissions(fileId: string, permissions: Partial<Permissions>): Promise<void> {
    // 本地不支持权限设置
    return Promise.resolve();
  }
  
  shareFile(fileId: string, options: ShareOptions): Promise<ShareResult> {
    // 本地不支持分享
    throw new Error('Local storage does not support file sharing');
  }
  
  unshareFile(fileId: string): Promise<void> {
    return Promise.resolve();
  }
  
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
      maxFileSize: Infinity,
      maxFolderDepth: 100,
      supportedMimeTypes: ['text/markdown', 'text/plain', '*'],
      features: ['local-storage', 'offline-access', 'no-auth-required'],
    };
  }
  
  async isAvailable(): Promise<boolean> {
    // 检查平台适配器是否可用
    try {
      await this.platformAdapter.fs.init?.();
      return true;
    } catch {
      return false;
    }
  }
  
  getConfig(): Record<string, any> {
    return this.config;
  }
  
  setConfig(config: Record<string, any>): Promise<void> {
    this.config = config;
    return Promise.resolve();
  }
}