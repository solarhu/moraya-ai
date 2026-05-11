# 云平台适配层架构设计

## 设计目标

统一云平台接口，解耦应用逻辑与具体云平台实现，支持Web端和Tauri端。

## 架构层次

```
┌─────────────────────────────────────────────┐
│         应用层                │
│  - 知识库管理                                │
│  - 文件同步UI                                │
│  - 用户操作界面                              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      云平台适配层           │
│  - 统一接口定义 (CloudProviderAPI)           │
│  - 平台检测与选择                            │
│  - 适配器注册与管理                          │
└─────────────────────────────────────────────┘
                    ↓
┌──────────────┬──────────────┬──────────────┐
│   飞书适配器  │  其他适配器  │  本地适配器  │
│  - LarkCloud │  - Notion    │  - LocalFS   │
│  - LarkDrive │  - Obsidian  │  - IndexedDB │
│  - LarkWiki  │  - GitSync   │  - FileSystem│
└──────────────┴──────────────┴──────────────┘
                    ↓
┌──────────────┬──────────────┬──────────────┐
│  飞书API     │  其他API     │  本地存储     │
│  - lark-cli  │  - Notion    │  - IndexedDB │
│  - HTTP API  │  - Git API   │  - Tauri FS  │
└──────────────┴──────────────┴──────────────┘
```

## 核心接口设计

### 1. CloudProviderAPI（统一接口）

```typescript
// src/lib/cloud-platform/types.ts

export interface CloudProviderAPI {
  // 平台标识
  provider: 'lark' | 'notion' | 'obsidian' | 'git' | 'local';
  displayName: string;
  icon: string;
  
  // 认证相关
  authenticate(): Promise<boolean>;
  isAuthenticated(): Promise<boolean>;
  logout(): Promise<void>;
  
  // 文件操作（统一接口）
  createFile(options: CreateFileOptions): Promise<CloudFile>;
  readFile(fileId: string): Promise<string>;
  updateFile(fileId: string, content: string): Promise<void>;
  deleteFile(fileId: string): Promise<void>;
  listFiles(folderId?: string): Promise<CloudFile[]>;
  
  // 文件夹操作
  createFolder(name: string, parentId?: string): Promise<CloudFolder>;
  listFolders(parentId?: string): Promise<CloudFolder[]>;
  
  // 同步相关
  sync(options: SyncOptions): Promise<SyncReport>;
  getSyncStatus(): Promise<SyncStatus>;
  
  // 权限相关
  getPermissions(fileId: string): Promise<Permissions>;
  shareFile(fileId: string, options: ShareOptions): Promise<ShareResult>;
  
  // 平台特性
  getCapabilities(): ProviderCapabilities;
}

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
}

export interface CreateFileOptions {
  name: string;
  content: string;
  mimeType?: string;
  folderId?: string;
  metadata?: Record<string, any>;
}

export interface SyncOptions {
  mode: 'upload' | 'download' | 'bidirectional';
  localPath: string;
  remoteFolderId: string;
  conflictResolution: 'local-wins' | 'remote-wins' | 'manual';
}

export interface SyncReport {
  success: boolean;
  uploadedFiles: number;
  downloadedFiles: number;
  failedFiles: number;
  errors: string[];
  duration: number;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'success';
  lastSyncAt?: number;
  pendingChanges: number;
}

export interface ProviderCapabilities {
  supportsMarkdown: boolean;
  supportsWiki: boolean;
  supportsDrive: boolean;
  supportsCollaboration: boolean;
  supportsVersioning: boolean;
  supportsOffline: boolean;
  maxFileSize: number;
  supportedMimeTypes: string[];
}
```

### 2. 平台适配器注册表

```typescript
// src/lib/cloud-platform/provider-registry.ts

import type { CloudProviderAPI } from './types';

class CloudProviderRegistry {
  private providers: Map<string, CloudProviderAPI> = new Map();
  
  register(provider: CloudProviderAPI): void {
    this.providers.set(provider.provider, provider);
  }
  
  get(providerId: string): CloudProviderAPI | undefined {
    return this.providers.get(providerId);
  }
  
  list(): CloudProviderAPI[] {
    return Array.from(this.providers.values());
  }
  
  getAvailable(): CloudProviderAPI[] {
    return this.list().filter(p => p.getCapabilities().supportsMarkdown);
  }
}

export const cloudProviderRegistry = new CloudProviderRegistry();
```

## 具体适配器实现

### 1. 飞书适配器（LarkCloudAdapter）

```typescript
// src/lib/cloud-platform/adapters/lark-adapter.ts

import type { CloudProviderAPI, CloudFile, ProviderCapabilities } from '../types';

export class LarkCloudAdapter implements CloudProviderAPI {
  provider = 'lark';
  displayName = '飞书';
  icon = 'lark-icon';
  
  private mode: 'docs' | 'drive' | 'wiki';
  private config: LarkConfig;
  private platformAdapter: PlatformAdapter; // 使用已有的平台抽象层
  
  constructor(config: LarkConfig, platformAdapter: PlatformAdapter) {
    this.config = config;
    this.platformAdapter = platformAdapter;
    this.mode = config.syncMode;
  }
  
  async authenticate(): Promise<boolean> {
    // Tauri环境：使用lark-cli命令
    if (this.platformAdapter.platform === 'tauri') {
      return await this.invokeLarkCli('auth_login');
    }
    
    // Web环境：使用飞书开放平台API
    if (this.platformAdapter.platform === 'web') {
      return await this.authenticateViaLarkAPI();
    }
    
    return false;
  }
  
  async createFile(options: CreateFileOptions): Promise<CloudFile> {
    if (this.platformAdapter.platform === 'tauri') {
      // 使用lark-cli
      const result = await this.invokeLarkCli('create', {
        title: options.name,
        content: options.content,
        folderToken: options.folderId || this.config.folderToken,
      });
      return this.parseLarkFile(result);
    }
    
    // Web环境：HTTP API
    return await this.createViaHTTP(options);
  }
  
  async readFile(fileId: string): Promise<string> {
    if (this.platformAdapter.platform === 'tauri') {
      return await this.invokeLarkCli('fetch', { fileToken: fileId });
    }
    
    return await this.readViaHTTP(fileId);
  }
  
  getCapabilities(): ProviderCapabilities {
    return {
      supportsMarkdown: true,
      supportsWiki: this.mode === 'wiki',
      supportsDrive: this.mode === 'drive',
      supportsCollaboration: true,
      supportsVersioning: true,
      supportsOffline: false,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      supportedMimeTypes: ['text/markdown', 'text/plain'],
    };
  }
  
  // 私有方法
  private async invokeLarkCli(command: string, args: any): Promise<any> {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke(`lark_cli_${command}`, args);
  }
  
  private async authenticateViaLarkAPI(): Promise<boolean> {
    // 使用飞书开放平台OAuth
    const appId = this.config.appId;
    const appSecret = this.config.appSecret;
    // ... OAuth流程
    return true;
  }
  
  private async createViaHTTP(options: CreateFileOptions): Promise<CloudFile> {
    // 使用飞书HTTP API创建文档
    const response = await this.platformAdapter.http.fetch(
      `https://open.feishu.cn/open-apis/docs/v1/documents`,
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    );
    return await response.json();
  }
}
```

### 2. 本地适配器（LocalCloudAdapter）

```typescript
// src/lib/cloud-platform/adapters/local-adapter.ts

import type { CloudProviderAPI, CloudFile } from '../types';
import { webFileSystem } from '$lib/platform/web-filesystem';
import type { PlatformAdapter } from '$lib/platform/types';

export class LocalCloudAdapter implements CloudProviderAPI {
  provider = 'local';
  displayName = '本地存储';
  icon = 'folder-icon';
  
  private platformAdapter: PlatformAdapter;
  
  constructor(platformAdapter: PlatformAdapter) {
    this.platformAdapter = platformAdapter;
  }
  
  async authenticate(): Promise<boolean> {
    // 本地存储无需认证
    return true;
  }
  
  async createFile(options: CreateFileOptions): Promise<CloudFile> {
    const path = options.folderId 
      ? `${options.folderId}/${options.name}` 
      : options.name;
    
    await this.platformAdapter.fs.writeFile(path, options.content);
    
    return {
      id: path,
      name: options.name,
      path: path,
      size: options.content.length,
      mimeType: options.mimeType || 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  async readFile(fileId: string): Promise<string> {
    return await this.platformAdapter.fs.readFile(fileId);
  }
  
  async listFiles(folderId?: string): Promise<CloudFile[]> {
    const files = await this.platformAdapter.fs.listFiles(folderId);
    return files.map(f => ({
      id: f.path,
      name: f.name,
      path: f.path,
      size: f.size,
      mimeType: 'text/markdown',
      createdAt: f.lastModified,
      updatedAt: f.lastModified,
    }));
  }
  
  getCapabilities(): ProviderCapabilities {
    return {
      supportsMarkdown: true,
      supportsWiki: false,
      supportsDrive: true,
      supportsCollaboration: false,
      supportsVersioning: false,
      supportsOffline: true,
      maxFileSize: Infinity,
      supportedMimeTypes: ['text/markdown', 'text/plain', '*'],
    };
  }
}
```

## 应用层集成

### 1. 知识库同步服务重构

```typescript
// src/lib/services/kb-sync-service.ts

import { cloudProviderRegistry } from '$lib/cloud-platform/provider-registry';
import type { CloudProviderAPI, SyncOptions } from '$lib/cloud-platform/types';
import type { KnowledgeBase } from '$lib/stores/files-store';

export class KbSyncService {
  private syncBindings: Map<string, SyncBinding> = new Map();
  
  async bindCloudProvider(
    kb: KnowledgeBase,
    providerId: string,
    config: ProviderConfig
  ): Promise<boolean> {
    const provider = cloudProviderRegistry.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    
    // 认证
    const authenticated = await provider.authenticate();
    if (!authenticated) {
      throw new Error('Authentication failed');
    }
    
    // 保存绑定配置
    this.syncBindings.set(kb.id, {
      kbId: kb.id,
      providerId,
      provider,
      config,
      status: 'idle',
    });
    
    return true;
  }
  
  async syncKb(kbId: string): Promise<SyncReport> {
    const binding = this.syncBindings.get(kbId);
    if (!binding) {
      throw new Error('No binding found');
    }
    
    const syncOptions: SyncOptions = {
      mode: binding.config.syncMode,
      localPath: binding.kbPath,
      remoteFolderId: binding.config.folderId,
      conflictResolution: binding.config.conflictResolution,
    };
    
    return await binding.provider.sync(syncOptions);
  }
  
  getAvailableProviders(): CloudProviderAPI[] {
    return cloudProviderRegistry.getAvailable();
  }
}
```

### 2. 统一绑定UI

```svelte
<!-- src/lib/components/CloudBindDialog.svelte -->

<script lang="ts">
  import { cloudProviderRegistry } from '$lib/cloud-platform/provider-registry';
  
  let availableProviders = cloudProviderRegistry.getAvailable();
  let selectedProvider = $state(availableProviders[0]?.provider || 'local');
  
  async function bindProvider() {
    const provider = cloudProviderRegistry.get(selectedProvider);
    const authenticated = await provider.authenticate();
    
    if (authenticated) {
      // 继续绑定流程
    }
  }
</script>

<div class="cloud-bind-dialog">
  <h3>选择云平台</h3>
  
  <div class="provider-list">
    {#each availableProviders as provider}
      <button 
        class="provider-item" 
        class:active={selectedProvider === provider.provider}
        onclick={() => selectedProvider = provider.provider}
      >
        <img src={provider.icon} alt={provider.displayName} />
        <span>{provider.displayName}</span>
        
        {#if provider.provider === 'lark'}
          <small>支持文档、Drive、Wiki</small>
        {:else if provider.provider === 'local'}
          <small>本地存储（IndexedDB）</small>
        {/if}
      </button>
    {/each}
  </div>
  
  <!-- 根据provider显示特定配置 -->
  {#if selectedProvider === 'lark'}
    <LarkConfigForm />
  {:else if selectedProvider === 'local'}
    <LocalConfigForm />
  {/if}
</div>
```

## Web端飞书集成方案

### 方案A：飞书开放平台API（推荐）

```typescript
// Web环境使用飞书开放平台API

export class LarkCloudWebAdapter implements CloudProviderAPI {
  private appId: string;
  private appSecret: string;
  private accessToken: string;
  
  constructor(config: LarkWebConfig) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
  }
  
  async authenticate(): Promise<boolean> {
    // OAuth 2.0流程
    const authUrl = `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${this.appId}`;
    
    // 弹出窗口让用户登录飞书
    const authWindow = window.open(authUrl, '_blank');
    
    // 等待回调获取access_token
    const accessToken = await this.waitForAuthCallback();
    this.accessToken = accessToken;
    
    return !!accessToken;
  }
  
  async createFile(options: CreateFileOptions): Promise<CloudFile> {
    const response = await fetch(
      'https://open.feishu.cn/open-apis/docs/v1/documents',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: options.name,
          content: options.content,
        }),
      }
    );
    
    const data = await response.json();
    return this.parseResponse(data);
  }
}
```

### 方案B：后端代理（可选）

```typescript
// Web → Moraya后端 → 飞书API

export class LarkCloudProxyAdapter implements CloudProviderAPI {
  private proxyUrl: string; // Moraya后端服务
  
  async createFile(options: CreateFileOptions): Promise<CloudFile> {
    const response = await fetch(`${this.proxyUrl}/api/lark/create`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
    
    return await response.json();
  }
}
```

## 实施计划

### Phase 1: 接口定义与注册表
- [ ] 创建 `cloud-platform/types.ts`
- [ ] 创建 `cloud-platform/provider-registry.ts`
- [ ] 定义统一接口 CloudProviderAPI

### Phase 2: 本地适配器
- [ ] 实现 `LocalCloudAdapter`（基于现有平台抽象层）
- [ ] 测试本地存储功能
- [ ] Web/Tauri双平台验证

### Phase 3: 飞书适配器重构
- [ ] 重构现有lark-sync服务为LarkCloudAdapter
- [ ] Tauri环境：调用lark-cli命令
- [ ] Web环境：飞书开放平台API

### Phase 4: 统一UI
- [ ] 创建 `CloudBindDialog.svelte`（替代KbLarkBindDialog）
- [ ] 支持多云平台选择
- [ ] 动态配置表单

### Phase 5: 扩展其他云平台
- [ ] Notion适配器（可选）
- [ ] Obsidian适配器（可选）
- [ ] Git同步适配器（可选）

## 优势

1. **统一接口**：应用层不关心具体云平台
2. **平台无关**：Web和Tauri都能使用云平台功能
3. **易于扩展**：新增云平台只需实现适配器
4. **配置灵活**：支持多云平台切换
5. **渐进迁移**：可保留现有lark-sync，逐步重构

## 下一步

需要我开始实施Phase 1吗？先创建接口定义和注册表。