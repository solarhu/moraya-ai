/**
 * 云平台统一接口定义
 * 
 * 为不同云平台（飞书、Notion、本地等）提供统一的API接口，
 * 支持Web端和Tauri端都能使用云平台功能。
 */

export type CloudProvider = 'lark' | 'notion' | 'obsidian' | 'git' | 'local' | 'custom';

export interface CloudFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: number;
  updatedAt: number;
  url?: string;
  metadata?: Record<string, any>;
}

export interface CloudFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdAt: number;
  childrenCount?: number;
}

export interface CreateFileOptions {
  name: string;
  content: string;
  mimeType?: string;
  folderId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateFileOptions {
  content?: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface SyncOptions {
  mode: 'upload' | 'download' | 'bidirectional';
  localPath: string;
  remoteFolderId: string;
  conflictResolution?: 'local-wins' | 'remote-wins' | 'manual' | 'newer-wins';
  filePatterns?: string[];
}

export interface SyncReport {
  success: boolean;
  uploadedFiles: number;
  downloadedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  errors: Array<{ file: string; error: string }>;
  duration: number;
  timestamp: number;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'success' | 'paused';
  lastSyncAt?: number;
  nextSyncAt?: number;
  pendingChanges: number;
  progress?: number;
}

export interface Permissions {
  readable: boolean;
  writable: boolean;
  deletable: boolean;
  shareable: boolean;
  owner: string;
  collaborators?: string[];
}

export interface ShareOptions {
  type: 'public' | 'private' | 'team';
  expiresIn?: number;
  password?: string;
  permissions?: Partial<Permissions>;
}

export interface ShareResult {
  shareUrl: string;
  shareId: string;
  expiresAt?: number;
}

export interface ProviderCapabilities {
  supportsMarkdown: boolean;
  supportsWiki: boolean;
  supportsDrive: boolean;
  supportsDocs: boolean;
  supportsCollaboration: boolean;
  supportsVersioning: boolean;
  supportsOffline: boolean;
  supportsShare: boolean;
  maxFileSize: number;
  maxFolderDepth: number;
  supportedMimeTypes: string[];
  features: string[];
}

export interface CloudProviderAPI {
  // 平台信息
  provider: CloudProvider;
  displayName: string;
  icon: string;
  description: string;
  
  // 认证相关
  authenticate(config?: Record<string, any>): Promise<boolean>;
  isAuthenticated(): Promise<boolean>;
  logout(): Promise<void>;
  getAuthStatus(): Promise<'authenticated' | 'unauthenticated' | 'expired' | 'error'>;
  
  // 文件操作（核心接口）
  createFile(options: CreateFileOptions): Promise<CloudFile>;
  readFile(fileId: string): Promise<string>;
  updateFile(fileId: string, options: UpdateFileOptions): Promise<CloudFile>;
  deleteFile(fileId: string): Promise<void>;
  moveFile(fileId: string, targetFolderId: string): Promise<CloudFile>;
  copyFile(fileId: string, targetFolderId: string): Promise<CloudFile>;
  
  // 文件查询
  getFile(fileId: string): Promise<CloudFile>;
  listFiles(folderId?: string, options?: ListOptions): Promise<CloudFile[]>;
  searchFiles(query: string, options?: SearchOptions): Promise<CloudFile[]>;
  
  // 文件夹操作
  createFolder(name: string, parentId?: string): Promise<CloudFolder>;
  getFolder(folderId: string): Promise<CloudFolder>;
  listFolders(parentId?: string): Promise<CloudFolder[]>;
  deleteFolder(folderId: string, recursive?: boolean): Promise<void>;
  moveFolder(folderId: string, targetFolderId: string): Promise<CloudFolder>;
  
  // 同步相关（核心接口）
  sync(options: SyncOptions): Promise<SyncReport>;
  getSyncStatus(): Promise<SyncStatus>;
  pauseSync(): Promise<void>;
  resumeSync(): Promise<void>;
  cancelSync(): Promise<void>;
  
  // 权限与分享
  getPermissions(fileId: string): Promise<Permissions>;
  setPermissions(fileId: string, permissions: Partial<Permissions>): Promise<void>;
  shareFile(fileId: string, options: ShareOptions): Promise<ShareResult>;
  unshareFile(fileId: string): Promise<void>;
  
  // 平台特性
  getCapabilities(): ProviderCapabilities;
  isAvailable(): Promise<boolean>;
  
  // 配置管理
  getConfig(): Record<string, any>;
  setConfig(config: Record<string, any>): Promise<void>;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  mimeType?: string;
}

export interface SearchOptions {
  limit?: number;
  folderId?: string;
  mimeType?: string;
  includeMetadata?: boolean;
}

export interface CloudProviderConfig {
  provider: CloudProvider;
  enabled: boolean;
  config: Record<string, any>;
  syncMode?: 'upload' | 'download' | 'bidirectional';
  autoSync?: boolean;
  syncInterval?: number;
}

export interface CloudBinding {
  localKbId: string;
  provider: CloudProvider;
  remoteFolderId: string;
  config: CloudProviderConfig;
  status: SyncStatus;
  lastSyncReport?: SyncReport;
  createdAt: number;
}

export type CloudEvent = 
  | { type: 'file-created'; file: CloudFile }
  | { type: 'file-updated'; file: CloudFile }
  | { type: 'file-deleted'; fileId: string }
  | { type: 'sync-started'; options: SyncOptions }
  | { type: 'sync-completed'; report: SyncReport }
  | { type: 'sync-error'; error: string }
  | { type: 'auth-changed'; status: string };

export interface CloudEventListener {
  (event: CloudEvent): void;
}