# Moraya 多终端 AI 协同 Markdown 平台 - 方案设计文档（简化版v2）

**版本**: v2.0  
**日期**: 2026-05-07  
**项目代号**: Moraya-X  
**目标**: 构建基于OpenClaw中间层的飞书文档同步 + 本地Markdown编辑平台

---

## 一、项目背景与目标

### 1.1 背景

Moraya作为开源Markdown AI Agent编辑器，已具备：
- **本地优先架构**: Tauri v2桌面端 + 本地KB管理
- **AI集成**: 多LLM提供商 + MCP工具生态 + AI模板系统
- **编辑能力**: ProseMirror编辑器 + 三种模式 + Markdown增强

**关键信息**: OpenClaw已具备飞书平台对接能力
- OpenClaw Agent可调用飞书API
- OpenClaw已实现Markdown ↔ 飞书Block转换
- OpenClaw已实现飞书OAuth认证
- OpenClaw支持飞书实时订阅

**当前痛点**:
- 本地编辑后无法同步到飞书云文档
- 缺少飞书文档下载到本地编辑能力
- 缺少实时同步状态反馈

### 1.2 项目目标（简化版）

**核心目标**: 通过OpenClaw中间层实现飞书文档同步 + 本地Markdown编辑

具体目标:
1. **OpenClaw对接**: 对接OpenClaw API，实现文档上传/下载/同步
2. **本地编辑**: 本地KB文件编辑 + 变更监听
3. **同步流程**: 首次同步 + 增量同步 + 实时订阅
4. **同步状态**: 同步进度反馈 + 状态指示器
5. **多终端基础**: Desktop优先，后续扩展Web/Mobile

**不包含范围**（移除）:
- ❌ 飞书API直接封装（OpenClaw已实现）
- ❌ Markdown ↔ 飞书Block转换器（OpenClaw已实现）
- ❌ 飞书OAuth实现（OpenClaw已实现）
- ❌ Sync Adapter Registry（简化为OpenClaw单适配器）
- ❌ AI Agent角色系统（简化为sync-agent单一角色）

---

## 二、整体架构设计（简化版）

### 2.1 架构分层

```
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 1: Multi-Terminal Presentation (多终端展示层)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Desktop      │  │ Web (PWA)    │  │ Mobile       │              │
│  │ (Tauri v2)   │  │ (后续)       │  │ (后续)       │              │
│  │ macOS/Win/Lin│  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 2: Moraya Core (本地核心层)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ ProseMirror  │  │ File Watcher │  │ Sync Engine  │              │
│  │ Editor       │  │ (文件监听)   │  │ (同步流程)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Local KB     │  │ Local        │  │ Sync Queue   │              │
│  │ (文件管理)   │  │ Manifest     │  │ (变更队列)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 3: OpenClaw Sync Adapter (OpenClaw适配层)                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              OpenClawSyncAdapter (同步适配器)                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │ 文档上传 │  │ 文档下载 │  │ 文档列表 │  │ 同步状态 │      │  │
│  │  │ (upload) │  │(download)│  │  (list)  │  │ (status) │      │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │  │
│  │  ┌──────────┐  ┌──────────┐                                 │  │
│  │  │ 变更通知 │  │ 实时订阅 │                                 │  │
│  │  │ (notify) │  │  (watch) │                                 │  │
│  │  └──────────┘  └──────────┘                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 4: AI Agent Registry (简化版)                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              AI Agent Registry (单适配器)                     │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ OpenClaw Sync Agent (同步专用Agent)                     │  │  │
│  │  │ - role: sync-agent                                      │  │  │
│  │  │ - capabilities: upload/download/list/watch              │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 5: Rust Backend (Tauri Commands)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ File I/O     │  │ OpenClaw     │  │ WebSocket    │              │
│  │ Commands     │  │ API Proxy    │  │ Subscribe    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ Keychain     │  │ Sync State   │                                │
│  │ (密钥存储)   │  │ Storage      │                                │
│  └──────────────┘  └──────────────┘                                │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 6: Storage & Security (存储与安全层)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Local FS     │  │ Sync State   │  │ OS Keychain  │              │
│  │ (KB文件)     │  │ JSON         │  │ (OpenClaw    │              │
│  │              │  │              │  │ API Key)     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                          ↓ OpenClaw API
┌─────────────────────────────────────────────────────────────────────┤
│ OpenClaw (中间层) - 外部服务                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 飞书OAuth    │  │ Markdown ↔   │  │ 飞书API      │              │
│  │ 认证        │  │ Block转换    │  │ 调用封装     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                          ↓ 飞书API
┌─────────────────────────────────────────────────────────────────────┤
│ 飞书云文档 (云端存储)                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 文档内容     │  │ 版本历史     │  │ 实时协同     │              │
│  │ 管理        │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心设计理念

#### 2.2.1 OpenClaw中间层架构

**理念**: 利用OpenClaw现有的飞书对接能力，减少重复开发

**实现**:
- OpenClaw已实现飞书OAuth认证
- OpenClaw已实现Markdown ↔ 飞书Block转换
- OpenClaw已实现飞书文档上传/下载API
- OpenClaw已实现飞书实时订阅

**优势**:
- **减少开发量**: 不需要自己实现飞书API封装
- **减少维护成本**: OpenClaw团队维护飞书对接逻辑
- **降低风险**: OpenClaw已验证飞书API稳定性
- **快速上线**: 复用OpenClaw能力，缩短开发周期

#### 2.2.2 本地编辑 + 同步通知模式

**理念**: 本地编辑为主，OpenClaw负责同步到飞书

**实现**:
- 本地KB文件编辑（已有ProseMirror编辑器）
- 文件变更监听（新增file-watcher服务）
- 变更队列管理（新增sync-queue服务）
- 通知OpenClaw执行同步（通过OpenClaw API）

**同步流程**:
```
本地文件变更
    ↓
文件监听器检测
    ↓
变更入队
    ↓
通知OpenClaw (notifyChange API)
    ↓
OpenClaw执行上传
    ↓
飞书文档更新
    ↓
同步状态回调
    ↓
前端状态更新
```

#### 2.2.3 单一Agent角色模式

**理念**: 简化AI Agent角色，专注同步功能

**实现**:
- AgentRole: `sync-agent`（单一角色）
- Capabilities: upload/download/list/watch/status
- 不需要co-author/reviewer等复杂角色（后续可扩展）

---

## 三、OpenClaw同步适配器设计

### 3.1 OpenClawSyncAdapter接口

```typescript
// src/lib/services/ai-agent/types.ts

export type AgentRole = 'sync-agent';  // 简化为单一角色

export interface OpenClawSyncAdapter {
  // 基础信息
  id: 'openclaw';
  name: 'OpenClaw Sync Agent';
  role: 'sync-agent';
  
  // 配置验证
  validateConfig(config: OpenClawConfig): Promise<boolean>;
  testConnection(config: OpenClawConfig): Promise<boolean>;
  
  // 同步核心接口
  initialize(config: OpenClawConfig): Promise<SyncSession>;
  
  // 文档操作（通过OpenClaw API）
  uploadDocument(request: UploadRequest): Promise<UploadResult>;
  downloadDocument(request: DownloadRequest): Promise<DownloadResult>;
  listDocuments(request: ListRequest): Promise<DocumentList>;
  
  // 同步状态
  getSyncStatus(sessionId: string): Promise<SyncStatus>;
  notifyChange(sessionId: string, change: FileChange): Promise<void>;
  
  // 实时订阅
  watchSyncEvents(sessionId: string): Promise<WatchHandle>;
}

export interface OpenClawConfig {
  apiKey: string;
  baseUrl?: string;  // 默认 https://api.openclaw.ai/v1
  
  // 飞书绑定信息（OpenClaw已处理OAuth）
  feishuFolderToken?: string;
}

export interface UploadRequest {
  sessionId: string;
  documentPath: string;  // 本地文件路径
  documentContent: string;  // Markdown内容
  feishuFolderToken?: string;  // 目标飞书文件夹
}

export interface DownloadRequest {
  sessionId: string;
  feishuDocumentId: string;  // 飞书文档ID
  localPath: string;  // 保存到本地路径
}

export interface FileChange {
  path: string;
  type: 'create' | 'update' | 'delete';
  content?: string;
  timestamp: number;
}

export interface SyncStatus {
  sessionId: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncAt?: number;
  pendingChanges?: number;
  error?: string;
}
```

### 3.2 OpenClaw API封装（Rust后端）

```rust
// src-tauri/src/commands/openclaw.rs

use reqwest;
use serde::{Deserialize, Serialize};
use tauri::command;

const OPENCLAW_API_BASE: &str = "https://api.openclaw.ai/v1";

#[derive(Debug, Serialize, Deserialize)]
struct OpenClawUploadRequest {
    session_id: String,
    document_path: String,
    document_content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    feishu_folder_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenClawUploadResult {
    document_id: String,
    feishu_url: String,
    synced_at: i64,
}

/// 测试OpenClaw连接
#[command]
pub async fn openclaw_test_connection(
    api_key: String,
    base_url: Option<String>,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/health", base_url.unwrap_or(OPENCLAW_API_BASE.to_string()));

    let res = client
        .get(&url)
        .bearer_auth(&api_key)
        .send()
        .await
        .map_err(|_| "Network error")?;

    if !res.status().is_success() {
        return Err(format!("OpenClaw connection failed: {}", res.status()));
    }

    res.json::<serde_json::Value>()
        .await
        .map_err(|_| "Invalid response")
}

/// 上传文档到飞书（通过OpenClaw）
#[command]
pub async fn openclaw_upload_doc(
    api_key: String,
    base_url: Option<String>,
    request: OpenClawUploadRequest,
) -> Result<OpenClawUploadResult, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/sync/upload", base_url.unwrap_or(OPENCLAW_API_BASE.to_string()));

    let res = client
        .post(&url)
        .bearer_auth(&api_key)
        .json(&request)
        .send()
        .await
        .map_err(|_| "Network error")?;

    if !res.status().is_success() {
        let status = res.status().as_u16();
        let body = res.text().await.unwrap_or_default();
        return Err(format!("OpenClaw upload failed ({status}): {body}"));
    }

    res.json::<OpenClawUploadResult>()
        .await
        .map_err(|_| "Invalid response")
}

/// 从飞书下载文档（通过OpenClaw）
#[command]
pub async fn openclaw_download_doc(
    api_key: String,
    base_url: Option<String>,
    session_id: String,
    feishu_document_id: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/sync/download", base_url.unwrap_or(OPENCLAW_API_BASE.to_string()));

    let res = client
        .get(&url)
        .bearer_auth(&api_key)
        .query(&[
            ("session_id", session_id.as_str()),
            ("document_id", feishu_document_id.as_str())
        ])
        .send()
        .await
        .map_err(|_| "Network error")?;

    if !res.status().is_success() {
        return Err(format!("OpenClaw download failed: {}", res.status()));
    }

    res.text()
        .await
        .map_err(|_| "Failed to read response")
}

/// 列出飞书文档列表（通过OpenClaw）
#[command]
pub async fn openclaw_list_docs(
    api_key: String,
    base_url: Option<String>,
    session_id: String,
    feishu_folder_token: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/sync/list", base_url.unwrap_or(OPENCLAW_API_BASE.to_string()));

    let res = client
        .get(&url)
        .bearer_auth(&api_key)
        .query(&[
            ("session_id", session_id.as_str()),
            ("folder_token", feishu_folder_token.as_str())
        ])
        .send()
        .await
        .map_err(|_| "Network error")?;

    if !res.status().is_success() {
        return Err(format!("OpenClaw list failed: {}", res.status()));
    }

    res.json::<serde_json::Value>()
        .await
        .map_err(|_| "Invalid response")
}

/// 获取同步状态
#[command]
pub async fn openclaw_sync_status(
    api_key: String,
    base_url: Option<String>,
    session_id: String,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/sync/status", base_url.unwrap_or(OPENCLAW_API_BASE.to_string()));

    let res = client
        .get(&url)
        .bearer_auth(&api_key)
        .query(&[("session_id", session_id.as_str())])
        .send()
        .await
        .map_err(|_| "Network error")?;

    if !res.status().is_success() {
        return Err(format!("OpenClaw status failed: {}", res.status()));
    }

    res.json::<serde_json::Value>()
        .await
        .map_err(|_| "Invalid response")
}

/// 通知文档变更
#[command]
pub async fn openclaw_notify_change(
    api_key: String,
    base_url: Option<String>,
    session_id: String,
    change: serde_json::Value,  // FileChange对象
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("{}/sync/notify", base_url.unwrap_or(OPENCLAW_API_BASE.to_string()));

    let res = client
        .post(&url)
        .bearer_auth(&api_key)
        .json(&serde_json::json!({
            "session_id": session_id,
            "change": change
        }))
        .send()
        .await
        .map_err(|_| "Network error")?;

    if !res.status().is_success() {
        return Err(format!("OpenClaw notify failed: {}", res.status()));
    }

    Ok(())
}

/// WebSocket实时订阅飞书变更
#[command]
pub async fn openclaw_watch_sync(
    app: tauri::AppHandle,
    api_key: String,
    base_url: Option<String>,
    session_id: String,
) -> Result<String, String> {
    use tokio_tungstenite::{connect_async, tungstenite::Message};

    let ws_url = format!(
        "{}?session_id={}&api_key={}",
        base_url.unwrap_or(OPENCLAW_API_BASE.to_string())
            .replace("https://", "wss://")
            .replace("/v1", "/ws/v1"),
        session_id,
        api_key
    );

    let (ws_stream, _) = connect_async(&ws_url)
        .await
        .map_err(|_| "WebSocket connection failed")?;

    let (_, read) = ws_stream.split();

    let watch_id = format!("watch_{}", uuid::Uuid::new_v4());
    
    tokio::spawn(async move {
        use futures_util::StreamExt;
        while let Some(msg) = read.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    // 发送同步事件到前端
                    app.emit(&format!("openclaw_sync_{}", watch_id), &text).ok();
                }
                Ok(Message::Close(_)) => break,
                Err(_) => break,
                _ => {}
            }
        }
    });

    Ok(watch_id)
}
```

---

## 四、本地文件监听与同步流程

### 4.1 文件监听服务

```typescript
// src/lib/services/file-watcher.ts

import { invoke } from '@tauri-apps/api/core';
import type { FileChange } from './ai-agent/types';

export class FileWatcher {
  private watchId: string | null = null;
  private changeQueue: FileChange[] = [];
  private onChangeCallback?: (change: FileChange) => void;

  // 启动文件监听
  async startWatch(kbPath: string): Promise<void> {
    this.watchId = await invoke<string>('start_file_watch', { path: kbPath });
    
    // 监听Rust后端的文件变更事件
    const unlisten = await listen<FileChangeEvent>(
      `file-change-${this.watchId}`,
      (event) => {
        this.handleFileChange(event.payload);
      }
    );
  }

  // 处理文件变更
  private handleFileChange(event: FileChangeEvent): void {
    const change: FileChange = {
      path: event.path,
      type: event.type,  // 'create' | 'update' | 'delete'
      content: event.content,
      timestamp: Date.now()
    };

    // 入队
    this.changeQueue.push(change);

    // 触发回调
    if (this.onChangeCallback) {
      this.onChangeCallback(change);
    }
  }

  // 设置变更回调
  onChange(callback: (change: FileChange) => void): void {
    this.onChangeCallback = callback;
  }

  // 获取变更队列
  getChangeQueue(): FileChange[] {
    return this.changeQueue;
  }

  // 清空队列
  clearQueue(): void {
    this.changeQueue = [];
  }

  // 停止监听
  async stopWatch(): Promise<void> {
    if (this.watchId) {
      await invoke('stop_file_watch', { watchId: this.watchId });
      this.watchId = null;
    }
  }
}
```

### 4.2 同步引擎

```typescript
// src/lib/services/sync-engine.ts

import { OpenClawSyncAdapter } from './ai-agent/adapters/openclaw-sync-adapter';
import { FileWatcher } from './file-watcher';
import type { OpenClawConfig, FileChange, SyncStatus } from './ai-agent/types';

export class SyncEngine {
  private adapter: OpenClawSyncAdapter;
  private fileWatcher: FileWatcher;
  private session: SyncSession | null = null;
  private syncQueue: FileChange[] = [];
  private autoSyncEnabled: boolean = false;

  constructor(config: OpenClawConfig) {
    this.adapter = new OpenClawSyncAdapter();
    this.fileWatcher = new FileWatcher();
    this.initialize(config);
  }

  // 初始化同步会话
  async initialize(config: OpenClawConfig): Promise<void> {
    this.session = await this.adapter.initialize(config);
    
    // 启动文件监听
    await this.fileWatcher.startWatch(config.kbPath);
    
    // 设置变更回调
    this.fileWatcher.onChange((change) => {
      this.enqueueChange(change);
    });
  }

  // 变更入队
  private enqueueChange(change: FileChange): void {
    this.syncQueue.push(change);
    
    // 自动同步模式：立即通知OpenClaw
    if (this.autoSyncEnabled) {
      this.notifyOpenClaw(change);
    }
  }

  // 通知OpenClaw执行同步
  private async notifyOpenClaw(change: FileChange): Promise<void> {
    if (!this.session) return;

    await this.adapter.notifyChange(this.session.id, change);
  }

  // 手动触发同步
  async triggerSync(): Promise<SyncStatus> {
    if (!this.session) throw new Error('Session not initialized');

    // 执行队列中的所有变更
    for (const change of this.syncQueue) {
      await this.adapter.notifyChange(this.session.id, change);
    }

    // 清空队列
    this.syncQueue = [];

    // 获取同步状态
    const status = await this.adapter.getSyncStatus(this.session.id);
    return status;
  }

  // 首次同步上传（KB → 飞书）
  async firstSyncUpload(): Promise<void> {
    if (!this.session) throw new Error('Session not initialized');

    // 扫描KB文件
    const files = await invoke<KBFileInfo[]>('kb_scan_files', {
      kbPath: this.session.config.kbPath
    });

    // 批量上传
    for (const file of files) {
      const content = await invoke<string>('read_file', { path: file.path });
      await this.adapter.uploadDocument({
        sessionId: this.session.id,
        documentPath: file.relativePath,
        documentContent: content,
        feishuFolderToken: this.session.config.feishuFolderToken
      });
    }
  }

  // 首次同步下载（飞书 → KB）
  async firstSyncDownload(): Promise<void> {
    if (!this.session) throw new Error('Session not initialized');

    // 获取飞书文档列表
    const docs = await this.adapter.listDocuments({
      sessionId: this.session.id,
      feishuFolderToken: this.session.config.feishuFolderToken!
    });

    // 批量下载
    for (const doc of docs.items) {
      const content = await this.adapter.downloadDocument({
        sessionId: this.session.id,
        feishuDocumentId: doc.id,
        localPath: `${this.session.config.kbPath}/${doc.name}`
      });

      // 写入本地文件
      await invoke('write_file', {
        path: `${this.session.config.kbPath}/${doc.name}`,
        content
      });
    }
  }

  // 启动实时订阅
  async startRealtimeSync(): Promise<void> {
    if (!this.session) return;

    const watchHandle = await this.adapter.watchSyncEvents(this.session.id);
    
    // 监听飞书变更事件
    const unlisten = await listen<SyncEvent>(
      `openclaw_sync_${watchHandle.id}`,
      (event) => {
        this.handleRemoteChange(event.payload);
      }
    );
  }

  // 处理飞书远程变更
  private async handleRemoteChange(event: SyncEvent): void {
    // 下载飞书变更的文档
    const content = await this.adapter.downloadDocument({
      sessionId: this.session.id!,
      feishuDocumentId: event.documentId,
      localPath: event.localPath
    });

    // 写入本地文件
    await invoke('write_file', {
      path: event.localPath,
      content
    });
  }

  // 设置自动同步
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
  }

  // 获取同步状态
  async getSyncStatus(): Promise<SyncStatus> {
    if (!this.session) throw new Error('Session not initialized');
    return await this.adapter.getSyncStatus(this.session.id);
  }
}
```

---

## 五、前端同步UI设计

### 5.1 OpenClaw配置表单

```svelte
<!-- src/lib/components/settings/OpenClawConfigForm.svelte -->

<script lang="ts">
  import { syncEngine } from '$lib/services/sync-engine';
  import type { OpenClawConfig } from '$lib/services/ai-agent/types';

  let apiKey = $state('');
  let baseUrl = $state('https://api.openclaw.ai/v1');
  let kbPath = $state('');
  let feishuFolderToken = $state('');
  let autoSync = $state(false);
  let connectionStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');

  async function testConnection() {
    connectionStatus = 'testing';
    const config: OpenClawConfig = {
      apiKey,
      baseUrl,
      kbPath,
      feishuFolderToken
    };

    const success = await syncEngine.testConnection(config);
    connectionStatus = success ? 'success' : 'error';
  }

  async function saveConfig() {
    const config: OpenClawConfig = {
      apiKey,
      baseUrl,
      kbPath,
      feishuFolderToken
    };

    await invoke('save_openclaw_config', { config });
  }

  async function startSync() {
    await syncEngine.initialize({ apiKey, baseUrl, kbPath, feishuFolderToken });
    syncEngine.setAutoSync(autoSync);
  }
</script>

<div class="config-form">
  <div class="form-group">
    <label>OpenClaw API Key:</label>
    <input type="password" bind:value={apiKey} placeholder="sk_live_xxx" />
  </div>

  <div class="form-group">
    <label>OpenClaw API Base URL:</label>
    <input type="text" bind:value={baseUrl} placeholder="https://api.openclaw.ai/v1" />
  </div>

  <div class="form-group">
    <label>KB本地路径:</label>
    <input type="text" bind:value={kbPath} placeholder="/path/to/kb" />
  </div>

  <div class="form-group">
    <label>飞书文件夹Token (可选):</label>
    <input type="text" bind:value={feishuFolderToken} placeholder="fld_xxx" />
  </div>

  <div class="form-group">
    <label>
      <input type="checkbox" bind:checked={autoSync} />
      自动同步模式
    </label>
  </div>

  <div class="button-group">
    <button onclick={testConnection}>
      {connectionStatus === 'testing' ? '测试中...' : '测试连接'}
    </button>
    <button onclick={saveConfig}>保存配置</button>
    <button onclick={startSync}>启动同步</button>
  </div>

  {#if connectionStatus === 'success'}
    <div class="status success">✓ 连接成功</div>
  {:else if connectionStatus === 'error'}
    <div class="status error">✗ 连接失败</div>
  {/if}
</div>
```

### 5.2 同步状态指示器

```svelte
<!-- src/lib/components/SyncStatusIndicator.svelte -->

<script lang="ts">
  import { syncEngine } from '$lib/services/sync-engine';
  import type { SyncStatus } from '$lib/services/ai-agent/types';

  let syncStatus = $state<SyncStatus>({
    sessionId: '',
    status: 'idle',
    pendingChanges: 0
  });

  // 定时获取同步状态
  $effect(() => {
    const interval = setInterval(async () => {
      try {
        syncStatus = await syncEngine.getSyncStatus();
      } catch (err) {
        console.error('Failed to get sync status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  });

  async function triggerSync() {
    await syncEngine.triggerSync();
  }
</script>

<div class="sync-indicator">
  <div class="status-icon">
    {#if syncStatus.status === 'idle'}
      <span class="icon idle">●</span>
    {:else if syncStatus.status === 'syncing'}
      <span class="icon syncing">⟳</span>
    {:else if syncStatus.status === 'success'}
      <span class="icon success">✓</span>
    {:else if syncStatus.status === 'error'}
      <span class="icon error">✗</span>
    {/if}
  </div>

  <div class="status-text">
    {#if syncStatus.status === 'idle'}
      待同步
    {:else if syncStatus.status === 'syncing'}
      同步中...
    {:else if syncStatus.status === 'success'}
      已同步
    {:else if syncStatus.status === 'error'}
      同步失败: {syncStatus.error}
    {/if}
  </div>

  {#if syncStatus.pendingChanges > 0}
    <div class="pending-count">
      {syncStatus.pendingChanges}个待同步变更
    </div>
  {/if}

  <button class="sync-button" onclick={triggerSync}>
    手动同步
  </button>
</div>

<style>
  .sync-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.25rem;
    background: var(--bg-secondary);
  }

  .icon.idle { color: var(--text-muted); }
  .icon.syncing { color: var(--accent-color); animation: spin 1s infinite; }
  .icon.success { color: var(--color-success); }
  .icon.error { color: var(--color-error); }

  .sync-button {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background: var(--bg-primary);
    cursor: pointer;
  }
</style>
```

---

## 六、技术选型（简化版）

### 6.1 核心技术栈（不变）

| 层 | 技术 | 版本 | 选择理由 |
|---|------|------|---------|
| **Runtime** | Tauri v2 | ≥2.9 | 跨平台、性能优 |
| **Frontend** | Svelte 5 | ^5.0 | 轻量、响应式 |
| **Editor** | ProseMirror | via Milkdown v7 | WYSIWYG、成熟 |
| **Backend** | Rust | 2021 edition | 性能、安全 |

### 6.2 外部服务依赖（简化）

| 服务 | 提供方 | 作用 | API |
|------|--------|------|------|
| **OpenClaw API** | OpenClaw | 飞书文档同步中间层 | `/v1/sync/upload`<br>`/v1/sync/download`<br>`/v1/sync/list`<br>`/v1/sync/status`<br>`/v1/sync/notify`<br>`wss://...` (WebSocket) |
| **飞书云文档** | 飞书 | 云端文档存储 | 由OpenClaw封装 |

### 6.3 OpenClaw API契约（假设）

```typescript
// OpenClaw Sync API契约（需与OpenClaw团队确认）

// 上传文档
POST /v1/sync/upload
Request: {
  session_id: string,
  document_path: string,
  document_content: string,
  feishu_folder_token?: string
}
Response: {
  document_id: string,
  feishu_url: string,
  synced_at: number
}

// 下载文档
GET /v1/sync/download?session_id=xxx&document_id=xxx
Response: Markdown content (text/plain)

// 列出文档
GET /v1/sync/list?session_id=xxx&folder_token=xxx
Response: {
  items: [{
    id: string,
    name: string,
    updated_at: number
  }]
}

// 同步状态
GET /v1/sync/status?session_id=xxx
Response: {
  session_id: string,
  status: 'idle' | 'syncing' | 'success' | 'error',
  last_sync_at?: number,
  pending_changes?: number,
  error?: string
}

// 变更通知
POST /v1/sync/notify
Request: {
  session_id: string,
  change: {
    path: string,
    type: 'create' | 'update' | 'delete',
    content?: string,
    timestamp: number
  }
}
Response: {}

// WebSocket实时订阅
wss://api.openclaw.ai/ws/v1?session_id=xxx&api_key=xxx
Message: {
  type: 'document_changed',
  document_id: string,
  local_path: string,
  timestamp: number
}
```

---

## 七、方案设计总结（简化版）

### 7.1 核心设计亮点

1. **OpenClaw中间层**: 复用OpenClaw飞书对接能力，减少重复开发
2. **本地编辑优先**: 保持本地编辑体验，通过通知触发同步
3. **单一Agent角色**: 简化AI Agent角色为sync-agent
4. **文件监听机制**: 自动检测本地变更，触发同步
5. **实时订阅**: 通过WebSocket监听飞书变更，双向同步

### 7.2 简化带来的优势

| 优势 | 描述 |
|------|------|
| **开发量减少** | 从420小时减少到300小时（减少30%） |
| **维护成本降低** | OpenClaw维护飞书对接逻辑 |
| **风险降低** | OpenClaw已验证飞书API稳定性 |
| **上线加快** | 开发周期从10.5周缩短到7周 |

### 7.3 与原方案对比

| 模块 | 原方案 | 简化方案 | 变化 |
|------|--------|----------|------|
| **飞书API封装** | 自己实现 | OpenClaw已实现 | 移除72h工作量 |
| **Markdown转换器** | 自己实现 | OpenClaw已实现 | 移除62h工作量 |
| **飞书OAuth** | 自己实现 | OpenClaw已实现 | 移除36h工作量 |
| **Sync Adapter Registry** | 多适配器架构 | 单适配器 | 简化26.5h → 12h |
| **Agent角色系统** | 6种角色 | 1种角色 | 简化42h → 2h |
| **总工作量** | 420h | 300h | 减少120h |

---

## 八、后续扩展规划

### 8.1 Phase 8: Web端支持（后续）

- @moraya/core抽取（复用Editor/SyncEngine）
- SvelteKit PWA配置
- IndexedDB存储

### 8.2 Phase 9: Mobile端支持（后续）

- Tauri v2 iOS/Android
- 移动端UI适配

### 8.3 Phase 10: HarmonyOS支持（可选）

- 等Tauri官方支持或ArkTS原生

### 8.4 Phase 11: 多云平台支持（后续）

- 通过OpenClaw扩展其他云平台（Notion/语雀等）
- OpenClaw团队负责新平台对接

---

**文档版本**: v2.0（简化版）  
**最后更新**: 2026-05-07  
**审核状态**: 待审核  
**下一步**: 基于此设计方案制定简化版项目计划