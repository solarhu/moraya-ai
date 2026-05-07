# Moraya 多终端 AI 协同 Markdown 平台 - 方案设计文档（v4：飞书CLI直接集成）

**版本**: v4.0  
**日期**: 2026-05-07  
**项目代号**: Moraya-X  
**目标**: 通过飞书CLI工具实现飞书云文档同步 + 本地Markdown编辑

---

## 一、项目背景与目标

### 1.1 背景

Moraya作为开源Markdown AI Agent编辑器，已具备：
- **本地优先架构**: Tauri v2桌面端 + 本地KB管理
- **AI集成**: 多LLM提供商 + MCP工具生态
- **编辑能力**: ProseMirror编辑器 + Markdown增强

**关键信息**: 飞书发布官方CLI工具
- 飞书CLI可直接操作飞书云文档
- 飞书CLI已实现飞书OAuth认证
- 飞书CLI已实现Markdown ↔ 飞书Block转换
- 飞书CLI支持upload/download/list等命令

**架构简化**:
- 不需要封装飞书API
- 不需要实现飞书OAuth
- 不需要实现Markdown ↔ 飞书Block转换
- 不需要AI Agent中间层
- 直接调用飞书CLI命令即可

### 1.2 项目目标（v4：最简化方案）

**核心目标**: 通过飞书CLI工具实现飞书云文档同步 + 本地Markdown编辑

具体目标:
1. **飞书CLI集成**: Rust后端调用飞书CLI命令
2. **本地文件监听**: 文件变更检测 + 变更队列
3. **同步流程**: 首次同步 + 增量同步（CLI命令）
4. **同步状态**: 同步进度反馈 + 状态指示器
5. **Desktop优先**: 后续扩展Web/Mobile

**架构特点**:
- 飞书CLI是官方工具，稳定可靠
- 直接调用CLI命令，无需中间层
- 架构最简化，开发量最小
- 维护成本低（飞书官方维护CLI）

---

## 二、整体架构设计（v4）

### 2.1 架构分层（最简化）

```
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 1: Desktop端 (Tauri v2)                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ ProseMirror  │  │ File Watcher │  │ Sync Manager │              │
│  │ Editor       │  │ (文件监听)   │  │ (同步管理)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 2: 本地KB管理                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Local FS     │  │ Local        │  │ Sync Queue   │              │
│  │ (KB文件)     │  │ Manifest     │  │ (变更队列)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 3: 飞书CLI集成层                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Feishu CLI Command调用                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │ feishu upload│  │feishu download│  │ feishu list  │        │  │
│  │  │ (上传文档)   │  │ (下载文档)   │  │ (文档列表)   │        │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │  │
│  │  ┌──────────────┐  ┌──────────────┐                         │  │
│  │  │ feishu auth  │  │ feishu delete│                         │  │
│  │  │ (认证登录)   │  │ (删除文档)   │                         │  │
│  │  └──────────────┘  └──────────────┘                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 4: Rust Backend (Tauri Commands)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ File I/O     │  │ Feishu CLI   │  │ Process      │              │
│  │ Commands     │  │ Executor     │  │ Spawn        │              │
│  │              │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ Keychain     │  │ Sync State   │                                │
│  │ (CLI路径)    │  │ Storage      │                                │
│  └──────────────┘  └──────────────┘                                │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 5: 飞书CLI工具 (官方工具)                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 飞书OAuth    │  │ Markdown ↔   │  │ 飞书API      │              │
│  │ 认证        │  │ Block转换    │  │ 调用封装     │              │
│  │ (已实现)     │  │ (已实现)     │  │ (已实现)     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                          ↓ 飞书API
┌─────────────────────────────────────────────────────────────────────┤
│ 飞书云文档 (云端存储)                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 文档内容     │  │ 版本历史     │  │ 实时协同     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心设计理念

#### 2.2.1 飞书CLI直接集成

**理念**: 利用飞书官方CLI工具，无需任何中间层

**实现**:
- 飞书CLI已实现飞书OAuth认证（`feishu auth login`）
- 飞书CLI已实现Markdown ↔ 飞书Block转换
- 飞书CLI支持upload/download/list/delete命令
- Rust后端通过Process.spawn调用CLI命令
- CLI输出解析为同步结果

**优势**:
- **官方工具**: 飞书官方维护，稳定可靠
- **无需封装**: 不需要封装飞书API
- **无需OAuth**: 飞书CLI已处理认证
- **无需转换**: 飞书CLI已处理格式转换
- **开发量最小**: 仅需集成CLI调用
- **维护成本低**: 飞书官方维护CLI更新

#### 2.2.2 本地编辑 + CLI同步模式

**理念**: 本地编辑为主，通过飞书CLI命令同步到飞书

**实现**:
- 本地KB文件编辑（ProseMirror编辑器）
- 文件变更监听（FileWatcher）
- 变更队列管理（SyncQueue）
- Rust调用飞书CLI命令同步
- CLI输出解析为同步状态

**同步流程**:
```
本地文件变更
    ↓
文件监听器检测
    ↓
变更入队
    ↓
Rust调用飞书CLI命令
    ↓
Process.spawn('feishu', ['upload', file, token])
    ↓
飞书CLI执行上传
    ↓
飞书文档更新
    ↓
CLI输出同步结果
    ↓
Rust解析CLI输出
    ↓
前端更新同步状态
```

---

## 三、飞书CLI集成设计

### 3.1 飞书CLI命令封装（假设）

```bash
# 飞书CLI命令（需与飞书团队确认实际命令格式）

# 1. 认证登录
feishu auth login
# 输出: Authentication successful. Token saved to ~/.feishu/config

# 2. 上传文档
feishu upload <file_path> --folder <folder_token>
# 输出: 
# Document uploaded successfully.
# Document ID: doc_abc123
# URL: https://feishu.cn/docx/doc_abc123

# 3. 下载文档
feishu download <document_id> --output <output_path>
# 输出:
# Document downloaded successfully.
# Saved to: /path/to/output.md

# 4. 列出文档
feishu list --folder <folder_token>
# 输出:
# Document list:
# - doc_abc123: "文档1.md" (updated: 2026-05-07)
# - doc_def456: "文档2.md" (updated: 2026-05-06)

# 5. 删除文档
feishu delete <document_id>
# 输出: Document deleted successfully.

# 6. 获取文档信息
feishu info <document_id>
# 输出:
# Document ID: doc_abc123
# Title: 文档1.md
# Updated: 2026-05-07 10:00:00
# Size: 1024 bytes
```

### 3.2 Rust后端CLI调用实现

```rust
// src-tauri/src/commands/feishu_cli.rs

use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
struct FeishuUploadResult {
    document_id: String,
    document_url: String,
    success: bool,
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct FeishuDownloadResult {
    output_path: String,
    success: bool,
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct FeishuDocInfo {
    document_id: String,
    name: String,
    updated_at: String,
}

/// 飞书CLI认证登录
#[command]
pub async fn feishu_cli_auth_login(
    cli_path: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&["auth", "login"])
        .output()
        .map_err(|e| format!("Failed to execute feishu CLI: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Feishu auth failed: {}", stderr))
    }
}

/// 飞书CLI上传文档
#[command]
pub async fn feishu_cli_upload(
    cli_path: String,
    file_path: String,
    folder_token: String,
) -> Result<FeishuUploadResult, String> {
    let output = Command::new(&cli_path)
        .args(&["upload", &file_path, "--folder", &folder_token])
        .output()
        .map_err(|e| format!("Failed to execute feishu CLI: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        // 解析CLI输出
        parse_upload_result(&stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Feishu upload failed: {}", stderr))
    }
}

/// 飞书CLI下载文档
#[command]
pub async fn feishu_cli_download(
    cli_path: String,
    document_id: String,
    output_path: String,
) -> Result<FeishuDownloadResult, String> {
    let output = Command::new(&cli_path)
        .args(&["download", &document_id, "--output", &output_path])
        .output()
        .map_err(|e| format!("Failed to execute feishu CLI: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        Ok(FeishuDownloadResult {
            output_path,
            success: true,
            message: stdout.to_string(),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Feishu download failed: {}", stderr))
    }
}

/// 飞书CLI列出文档
#[command]
pub async fn feishu_cli_list(
    cli_path: String,
    folder_token: String,
) -> Result<Vec<FeishuDocInfo>, String> {
    let output = Command::new(&cli_path)
        .args(&["list", "--folder", &folder_token])
        .output()
        .map_err(|e| format!("Failed to execute feishu CLI: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        // 解析CLI输出的文档列表
        parse_doc_list(&stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Feishu list failed: {}", stderr))
    }
}

/// 飞书CLI删除文档
#[command]
pub async fn feishu_cli_delete(
    cli_path: String,
    document_id: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&["delete", &document_id])
        .output()
        .map_err(|e| format!("Failed to execute feishu CLI: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Feishu delete failed: {}", stderr))
    }
}

// 辅助函数：解析CLI输出
fn parse_upload_result(stdout: &str) -> Result<FeishuUploadResult, String> {
    // 解析飞书CLI输出格式（需根据实际CLI输出格式调整）
    // 假设输出格式：
    // Document uploaded successfully.
    // Document ID: doc_abc123
    // URL: https://feishu.cn/docx/doc_abc123
    
    let lines: Vec<&str> = stdout.lines().collect();
    let mut document_id = String::new();
    let mut document_url = String::new();
    
    for line in lines {
        if line.starts_with("Document ID:") {
            document_id = line.split(':').nth(1).unwrap_or("").trim().to_string();
        }
        if line.starts_with("URL:") {
            document_url = line.split(':').nth(1).unwrap_or("").trim().to_string();
        }
    }
    
    if document_id.is_empty() {
        return Err("Failed to parse document ID from CLI output".to_string());
    }
    
    Ok(FeishuUploadResult {
        document_id,
        document_url,
        success: true,
        message: stdout.to_string(),
    })
}

fn parse_doc_list(stdout: &str) -> Result<Vec<FeishuDocInfo>, String> {
    // 解析飞书CLI输出的文档列表
    // 假设输出格式：
    // - doc_abc123: "文档1.md" (updated: 2026-05-07)
    
    let mut docs = Vec::new();
    for line in stdout.lines() {
        if line.starts_with("- ") {
            // 解析每一行
            let parts: Vec<&str> = line.split(':').collect();
            if parts.len() >= 2 {
                let document_id = parts[0].trim().replace("- ", "");
                let name = parts[1].trim().replace('"', "");
                let updated_at = parts.get(2)
                    .map(|s| s.trim().replace("(updated: ", "").replace(")", ""))
                    .unwrap_or("");
                
                docs.push(FeishuDocInfo {
                    document_id,
                    name,
                    updated_at,
                });
            }
        }
    }
    
    Ok(docs)
}
```

### 3.3 前端CLI配置UI

```svelte
<!-- src/lib/components/settings/FeishuCliConfig.svelte -->

<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';

  let cliPath = $state('/usr/local/bin/feishu');  // 飞书CLI路径
  let folderToken = $state('');
  let authStatus = $state<'idle' | 'logging' | 'success' | 'error'>('idle');

  async function authLogin() {
    authStatus = 'logging';
    try {
      const result = await invoke<string>('feishu_cli_auth_login', { cliPath });
      authStatus = 'success';
    } catch (err) {
      authStatus = 'error';
    }
  }

  async function testUpload() {
    const result = await invoke('feishu_cli_upload', {
      cliPath,
      filePath: '/tmp/test.md',
      folderToken
    });
    // ...
  }
</script>

<div class="cli-config">
  <div class="form-group">
    <label>飞书CLI路径:</label>
    <input type="text" bind:value={cliPath} placeholder="/usr/local/bin/feishu" />
  </div>

  <div class="form-group">
    <label>飞书文件夹Token:</label>
    <input type="text" bind:value={folderToken} placeholder="fld_xxx" />
  </div>

  <button onclick={authLogin}>
    {authStatus === 'logging' ? '登录中...' : '飞书CLI认证'}
  </button>

  {#if authStatus === 'success'}
    <div class="status success">✓ 飞书CLI认证成功</div>
  {:else if authStatus === 'error'}
    <div class="status error">✗ 认证失败</div>
  {/if}
</div>
```

---

## 四、同步引擎设计

### 4.1 SyncEngine（基于飞书CLI）

```typescript
// src/lib/services/sync-engine.ts

import { invoke } from '@tauri-apps/api/core';
import { FileWatcher } from './file-watcher';

export interface FeishuCliConfig {
  cliPath: string;           // 飞书CLI路径
  folderToken: string;       // 飞书文件夹Token
  kbPath: string;            // KB路径
}

export class SyncEngine {
  private config: FeishuCliConfig;
  private fileWatcher: FileWatcher;
  private syncQueue: FileChange[] = [];
  private autoSync: boolean = false;

  constructor(config: FeishuCliConfig) {
    this.config = config;
    this.fileWatcher = new FileWatcher();
  }

  // 初始化同步
  async initialize(): Promise<void> {
    // 验证飞书CLI路径
    const authResult = await invoke<string>('feishu_cli_auth_login', {
      cliPath: this.config.cliPath
    });

    // 启动文件监听
    await this.fileWatcher.startWatch(this.config.kbPath);
    
    this.fileWatcher.onChange((change) => {
      this.syncQueue.push(change);
      
      if (this.autoSync) {
        this.syncChange(change);
      }
    });
  }

  // 上传文档（调用飞书CLI）
  async uploadDocument(filePath: string): Promise<string> {
    const result = await invoke<{
      document_id: string;
      document_url: string;
      success: boolean;
    }>('feishu_cli_upload', {
      cliPath: this.config.cliPath,
      filePath,
      folderToken: this.config.folderToken
    });

    return result.document_id;
  }

  // 下载文档（调用飞书CLI）
  async downloadDocument(documentId: string, outputPath: string): Promise<void> {
    await invoke('feishu_cli_download', {
      cliPath: this.config.cliPath,
      documentId,
      outputPath
    });
  }

  // 列出文档（调用飞书CLI）
  async listDocuments(): Promise<DocInfo[]> {
    const result = await invoke<DocInfo[]>('feishu_cli_list', {
      cliPath: this.config.cliPath,
      folderToken: this.config.folderToken
    });

    return result;
  }

  // 首次同步上传（KB → 飞书）
  async firstSyncUpload(): Promise<void> {
    // 扫描KB文件
    const files = await invoke<KBFileInfo[]>('kb_scan_files', {
      kbPath: this.config.kbPath
    });

    // 批量上传（调用飞书CLI）
    for (const file of files) {
      await this.uploadDocument(file.path);
    }
  }

  // 首次同步下载（飞书 → KB）
  async firstSyncDownload(): Promise<void> {
    // 获取飞书文档列表（调用飞书CLI）
    const docs = await this.listDocuments();

    // 批量下载（调用飞书CLI）
    for (const doc of docs) {
      await this.downloadDocument(
        doc.document_id,
        `${this.config.kbPath}/${doc.name}`
      );
    }
  }

  // 同步单个变更
  private async syncChange(change: FileChange): Promise<void> {
    if (change.type === 'create' || change.type === 'update') {
      await this.uploadDocument(change.path);
    } else if (change.type === 'delete') {
      // 需要映射本地文件 → 飞书文档ID
      const docId = await this.findDocumentId(change.path);
      if (docId) {
        await invoke('feishu_cli_delete', {
          cliPath: this.config.cliPath,
          documentId: docId
        });
      }
    }
  }

  // 手动触发同步
  async triggerSync(): Promise<void> {
    for (const change of this.syncQueue) {
      await this.syncChange(change);
    }
    this.syncQueue = [];
  }

  // 设置自动同步
  setAutoSync(enabled: boolean): void {
    this.autoSync = enabled;
  }

  // 映射本地文件 → 飞书文档ID（需要维护映射表）
  private async findDocumentId(localPath: string): Promise<string | null> {
    // 从本地Manifest或sidecar文件中查找映射
    // ...
    return null;
  }
}
```

---

## 五、技术选型（v4）

### 5.1 核心技术栈

| 层 | 技术 | 版本 | 说明 |
|---|------|------|------|
| **Runtime** | Tauri v2 | ≥2.9 | Desktop应用 |
| **Frontend** | Svelte 5 | ^5.0 | UI框架 |
| **Editor** | ProseMirror | via Milkdown v7 | Markdown编辑器 |
| **Backend** | Rust | 2021 edition | CLI调用 + 文件监听 |
| **飞书CLI** | 飞书官方CLI | latest | 飞书文档操作 |

### 5.2 外部依赖

| 依赖 | 提供方 | 作用 |
|------|--------|------|
| **飞书CLI** | 飞书官方 | 飞书云文档操作（upload/download/list） |
| **飞书OAuth** | 飞书CLI内置 | 飞书认证（CLI已实现） |
| **飞书Block转换** | 飞书CLI内置 | Markdown ↔ 飞书Block（CLI已实现） |

---

## 六、方案设计总结（v4）

### 6.1 核心设计亮点

1. **飞书CLI直接集成**: 无需任何中间层，架构最简化
2. **CLI调用模式**: Rust通过Process.spawn调用CLI命令
3. **官方工具**: 飞书官方维护，稳定可靠
4. **开发量最小**: 仅需集成CLI调用，无需封装API
5. **维护成本低**: 飞书官方维护CLI更新

### 6.2 与v1/v2/v3对比

| 项目 | v1（原方案） | v2（OpenClaw） | v3（Agent） | **v4（飞书CLI）** |
|------|-------------|--------------|------------|------------------|
| **核心** | 飞书API封装 | OpenClaw中间层 | Agent工具调用 | **飞书CLI直接集成** |
| **架构** | 多层架构 | 中间层架构 | Agent Registry | **最简化架构** |
| **依赖** | 需封装飞书OAuth | OpenClaw服务 | OpenClaw Agent | **飞书CLI（官方）** |
| **开发量** | 420h | 300h | 428h | **~150h** |
| **周期** | 18-21周 | 7周 | 8-9周 | **~4周** |
| **维护成本** | 高（需维护API） | 中（依赖OpenClaw） | 高（Agent架构） | **低（飞书官方）** |

### 6.3 方案优势

| 优势 | 描述 |
|------|------|
| **官方工具** | 飞书官方CLI，稳定可靠 |
| **架构最简** | 仅需集成CLI调用 |
| **开发量最小** | 约150h，周期约4周 |
| **无中间层** | 无需OpenClaw/Agent |
| **维护成本最低** | 飞书官方维护CLI |
| **认证已实现** | 飞书CLI已处理OAuth |
| **转换已实现** | 飞书CLI已处理格式转换 |

---

## 七、实现路线图（v4）

| Phase | 内容 | 工作量 | 周期 |
|-------|------|--------|------|
| **Phase 1** | 飞书CLI调研 + Rust CLI调用实现 | 40h | 1周 |
| **Phase 2** | 文件监听 + 同步引擎 | 50h | 1周 |
| **Phase 3** | 前端CLI配置 + 同步UI | 30h | 1周 |
| **Phase 4** | 集成测试 + Beta发布 | 30h | 1周 |
| **总计** | | **150h** | **4周** |

---

**文档版本**: v4.0（飞书CLI直接集成）  
**最后更新**: 2026-05-07  
**审核状态**: 待审核  
**下一步**: 确认飞书CLI命令格式后启动开发