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

### 3.1 飞书CLI命令封装（lark-cli实际命令）

```bash
# 飞书CLI命令（lark-cli - 飞书官方CLI工具）
# CLI路径: /home/admin/.npm-global/bin/lark-cli

# 1. 认证登录
lark-cli auth login [--domain docs,drive]
# 设备流认证，生成二维码或链接进行登录
# 输出: 认证成功，token保存在本地

# 2. 飞书文档操作 (lark-cli docs)
# 创建文档（从Markdown）
lark-cli docs +create --title "标题" --markdown @file.md --folder-token "fld_xxx"
# 输出: Document created: doc_xxx

# 获取文档（导出为Markdown/JSON）
lark-cli docs +fetch --doc "doc_xxx" --format json
# 输出: 文档内容JSON

# 更新文档
lark-cli docs +update --doc "doc_xxx" --markdown @file.md --mode append
# 支持模式: append, overwrite, replace_range, replace_all
# 输出: Document updated: doc_xxx

# 搜索文档
lark-cli docs +search --query "关键词"
# 输出: 文档列表JSON

# 3. Drive文件操作 (lark-cli drive)
# 列出文件夹内容
lark-cli drive +list --folder-token "fld_xxx"
# 输出: 文件列表JSON

# 上传文件
lark-cli drive +upload --file @file.md --folder-token "fld_xxx"
# 输出: File uploaded: file_xxx

# 下载文件
lark-cli drive +download --file "file_xxx" --output /path/to/save
# 输出: File downloaded to: /path/to/save

# 4. Drive Markdown操作 (lark-cli markdown)
# 创建Markdown文件
lark-cli markdown +create --file @file.md --folder-token "fld_xxx"
# 输出: Markdown file created: file_xxx

# 获取Markdown文件
lark-cli markdown +fetch --file "file_xxx"
# 输出: Markdown内容

# 覆盖Markdown文件
lark-cli markdown +overwrite --file "file_xxx" --markdown @file.md
# 输出: Markdown file updated: file_xxx

# 5. 知识库操作 (lark-cli wiki)
# 列出知识库
lark-cli wiki +list
# 输出: 知识库列表JSON

# 创建知识库节点
lark-cli wiki +create-node --wiki "wiki_xxx" --title "节点标题"
# 输出: Node created: node_xxx
```

### 3.2 Rust后端CLI调用实现

```rust
// src-tauri/src/commands/lark_cli.rs

use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
struct LarkDocCreateResult {
    document_id: String,
    success: bool,
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LarkDocFetchResult {
    content: String,
    format: String,
    success: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct LarkDocUpdateResult {
    document_id: String,
    success: bool,
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LarkFileInfo {
    file_token: String,
    name: String,
    r#type: String,
    updated_at: String,
}

/// lark-cli 认证登录
#[command]
pub async fn lark_cli_auth_login(
    cli_path: String,
    domain: Option<String>,
) -> Result<String, String> {
    let mut args = vec!["auth", "login"];
    if let Some(d) = domain {
        args.extend_from_slice(&["--domain", &d]);
    }
    
    let output = Command::new(&cli_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli auth failed: {}", stderr))
    }
}

/// lark-cli 创建文档（从Markdown）
#[command]
pub async fn lark_cli_docs_create(
    cli_path: String,
    title: String,
    markdown_file: String,
    folder_token: String,
) -> Result<LarkDocCreateResult, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "docs",
            "+create",
            "--title", &title,
            "--markdown", &format!("@{}", markdown_file),
            "--folder-token", &folder_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        let document_id = parse_document_id(&stdout)?;
        Ok(LarkDocCreateResult {
            document_id,
            success: true,
            message: stdout.to_string(),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli docs create failed: {}", stderr))
    }
}

/// lark-cli 获取文档
#[command]
pub async fn lark_cli_docs_fetch(
    cli_path: String,
    doc_token: String,
    format: String,
) -> Result<LarkDocFetchResult, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "docs",
            "+fetch",
            "--doc", &doc_token,
            "--format", &format,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        Ok(LarkDocFetchResult {
            content: stdout.to_string(),
            format,
            success: true,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli docs fetch failed: {}", stderr))
    }
}

/// lark-cli 更新文档
#[command]
pub async fn lark_cli_docs_update(
    cli_path: String,
    doc_token: String,
    markdown_file: String,
    mode: String,
) -> Result<LarkDocUpdateResult, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "docs",
            "+update",
            "--doc", &doc_token,
            "--markdown", &format!("@{}", markdown_file),
            "--mode", &mode,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        Ok(LarkDocUpdateResult {
            document_id: doc_token,
            success: true,
            message: stdout.to_string(),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli docs update failed: {}", stderr))
    }
}

/// lark-cli 搜索文档
#[command]
pub async fn lark_cli_docs_search(
    cli_path: String,
    query: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "docs",
            "+search",
            "--query", &query,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli docs search failed: {}", stderr))
    }
}

/// lark-cli 列出Drive文件
#[command]
pub async fn lark_cli_drive_list(
    cli_path: String,
    folder_token: String,
) -> Result<Vec<LarkFileInfo>, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "drive",
            "+list",
            "--folder-token", &folder_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        parse_file_list(&stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli drive list failed: {}", stderr))
    }
}

/// lark-cli 上传文件到Drive
#[command]
pub async fn lark_cli_drive_upload(
    cli_path: String,
    file_path: String,
    folder_token: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "drive",
            "+upload",
            "--file", &format!("@{}", file_path),
            "--folder-token", &folder_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli drive upload failed: {}", stderr))
    }
}

/// lark-cli 下载文件
#[command]
pub async fn lark_cli_drive_download(
    cli_path: String,
    file_token: String,
    output_path: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "drive",
            "+download",
            "--file", &file_token,
            "--output", &output_path,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli drive download failed: {}", stderr))
    }
}

/// lark-cli 创建Markdown文件
#[command]
pub async fn lark_cli_markdown_create(
    cli_path: String,
    markdown_file: String,
    folder_token: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "markdown",
            "+create",
            "--file", &format!("@{}", markdown_file),
            "--folder-token", &folder_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli markdown create failed: {}", stderr))
    }
}

/// lark-cli 获取Markdown文件
#[command]
pub async fn lark_cli_markdown_fetch(
    cli_path: String,
    file_token: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "markdown",
            "+fetch",
            "--file", &file_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli markdown fetch failed: {}", stderr))
    }
}

/// lark-cli 覆盖Markdown文件
#[command]
pub async fn lark_cli_markdown_overwrite(
    cli_path: String,
    file_token: String,
    markdown_file: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "markdown",
            "+overwrite",
            "--file", &file_token,
            "--markdown", &format!("@{}", markdown_file),
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli markdown overwrite failed: {}", stderr))
    }
}

// 辅助函数：解析文档ID
fn parse_document_id(stdout: &str) -> Result<String, String> {
    // 解析lark-cli输出格式
    // 可能格式: Document created: doc_xxx
    // 或 JSON格式: {"document_id": "doc_xxx"}
    
    for line in stdout.lines() {
        if line.contains("doc_") || line.contains("Document created:") {
            // 尝试提取doc_xxx格式的ID
            let words: Vec<&str> = line.split_whitespace().collect();
            for word in words {
                if word.starts_with("doc_") {
                    return Ok(word.trim_end_matches(',').to_string());
                }
            }
        }
    }
    
    // 尝试JSON解析
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(stdout) {
        if let Some(doc_id) = json.get("document_id").and_then(|v| v.as_str()) {
            return Ok(doc_id.to_string());
        }
    }
    
    Err("Failed to parse document ID from lark-cli output".to_string())
}

// 辅助函数：解析文件列表
fn parse_file_list(stdout: &str) -> Result<Vec<LarkFileInfo>, String> {
    // 尝试JSON解析
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(stdout) {
        if let Some(files) = json.get("files").and_then(|v| v.as_array()) {
            let mut result = Vec::new();
            for file in files {
                if let (Some(token), Some(name), Some(typ), Some(updated)) = (
                    file.get("token").and_then(|v| v.as_str()),
                    file.get("name").and_then(|v| v.as_str()),
                    file.get("type").and_then(|v| v.as_str()),
                    file.get("updated_at").and_then(|v| v.as_str()),
                ) {
                    result.push(LarkFileInfo {
                        file_token: token.to_string(),
                        name: name.to_string(),
                        r#type: typ.to_string(),
                        updated_at: updated.to_string(),
                    });
                }
            }
            return Ok(result);
        }
    }
    
    Err("Failed to parse file list from lark-cli output".to_string())
}
```

### 3.3 前端CLI配置UI

```svelte
<!-- src/lib/components/settings/LarkCliConfig.svelte -->

<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';

  let cliPath = $state('/home/admin/.npm-global/bin/lark-cli');  // lark-cli路径
  let folderToken = $state('');
  let domain = $state('docs');  // docs 或 drive
  let authStatus = $state<'idle' | 'logging' | 'success' | 'error'>('idle');

  async function authLogin() {
    authStatus = 'logging';
    try {
      const result = await invoke<string>('lark_cli_auth_login', {
        cliPath,
        domain
      });
      authStatus = 'success';
    } catch (err) {
      authStatus = 'error';
      console.error('Auth failed:', err);
    }
  }

  async function createDocument() {
    const result = await invoke('lark_cli_docs_create', {
      cliPath,
      title: 'Test Document',
      markdownFile: '/tmp/test.md',
      folderToken
    });
    console.log('Document created:', result);
  }

  async function fetchDocument(docToken: string) {
    const result = await invoke('lark_cli_docs_fetch', {
      cliPath,
      docToken,
      format: 'json'
    });
    console.log('Document fetched:', result);
  }

  async function listFiles() {
    const result = await invoke('lark_cli_drive_list', {
      cliPath,
      folderToken
    });
    console.log('Files listed:', result);
  }
</script>

<div class="cli-config">
  <div class="form-group">
    <label>lark-cli路径:</label>
    <input type="text" bind:value={cliPath} placeholder="/path/to/lark-cli" />
  </div>

  <div class="form-group">
    <label>认证域:</label>
    <select bind:value={domain}>
      <option value="docs">docs</option>
      <option value="drive">drive</option>
      <option value="docs,drive">docs,drive</option>
    </select>
  </div>

  <div class="form-group">
    <label>飞书文件夹Token:</label>
    <input type="text" bind:value={folderToken} placeholder="fld_xxx" />
  </div>

  <button onclick={authLogin} disabled={authStatus === 'logging'}>
    {authStatus === 'logging' ? '登录中...' : 'lark-cli认证'}
  </button>

  {#if authStatus === 'success'}
    <div class="status success">✓ lark-cli认证成功</div>
  {:else if authStatus === 'error'}
    <div class="status error">✗ 认证失败</div>
  {/if}

  {#if authStatus === 'success'}
    <div class="actions">
      <button onclick={createDocument}>创建测试文档</button>
      <button onclick={listFiles}>列出文件</button>
    </div>
  {/if}
</div>

<style>
  .cli-config {
    padding: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
  }
  
  .form-group input, .form-group select {
    width: 100%;
    padding: 0.5rem;
  }
  
  .status {
    padding: 0.5rem;
    margin-top: 1rem;
    border-radius: 4px;
  }
  
  .status.success {
    background-color: #d4edda;
    color: #155724;
  }
  
  .status.error {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  .actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
  }
</style>
```

---

## 四、同步引擎设计

### 4.1 SyncEngine（基于lark-cli）

```typescript
// src/lib/services/sync-engine.ts

import { invoke } from '@tauri-apps/api/core';
import { FileWatcher } from './file-watcher';

export interface LarkCliConfig {
  cliPath: string;           // lark-cli路径
  folderToken: string;       // 飞书文件夹Token
  kbPath: string;            // KB路径
  syncMode: 'docs' | 'drive' | 'markdown';  // 同步模式
}

export class SyncEngine {
  private config: LarkCliConfig;
  private fileWatcher: FileWatcher;
  private syncQueue: FileChange[] = [];
  private autoSync: boolean = false;

  constructor(config: LarkCliConfig) {
    this.config = config;
    this.fileWatcher = new FileWatcher();
  }

  // 初始化同步
  async initialize(): Promise<void> {
    // 验证lark-cli认证
    const authResult = await invoke<string>('lark_cli_auth_login', {
      cliPath: this.config.cliPath,
      domain: this.config.syncMode
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

  // 创建飞书文档（使用lark-cli docs）
  async createDocument(markdownFile: string, title: string): Promise<string> {
    const result = await invoke<{
      document_id: string;
      success: boolean;
    }>('lark_cli_docs_create', {
      cliPath: this.config.cliPath,
      title,
      markdownFile,
      folderToken: this.config.folderToken
    });

    return result.document_id;
  }

  // 获取飞书文档（使用lark-cli docs）
  async fetchDocument(docToken: string, format: string = 'json'): Promise<string> {
    const result = await invoke<{
      content: string;
      success: boolean;
    }>('lark_cli_docs_fetch', {
      cliPath: this.config.cliPath,
      docToken,
      format
    });

    return result.content;
  }

  // 更新飞书文档（使用lark-cli docs）
  async updateDocument(docToken: string, markdownFile: string, mode: string = 'overwrite'): Promise<void> {
    await invoke('lark_cli_docs_update', {
      cliPath: this.config.cliPath,
      docToken,
      markdownFile,
      mode
    });
  }

  // 上传文件到Drive（使用lark-cli drive）
  async uploadFile(filePath: string): Promise<string> {
    const result = await invoke<string>('lark_cli_drive_upload', {
      cliPath: this.config.cliPath,
      filePath,
      folderToken: this.config.folderToken
    });

    return result;
  }

  // 下载文件（使用lark-cli drive）
  async downloadFile(fileToken: string, outputPath: string): Promise<void> {
    await invoke('lark_cli_drive_download', {
      cliPath: this.config.cliPath,
      fileToken,
      outputPath
    });
  }

  // 列出Drive文件（使用lark-cli drive）
  async listFiles(): Promise<FileInfo[]> {
    const result = await invoke<FileInfo[]>('lark_cli_drive_list', {
      cliPath: this.config.cliPath,
      folderToken: this.config.folderToken
    });

    return result;
  }

  // 创建Markdown文件（使用lark-cli markdown）
  async createMarkdownFile(markdownFile: string): Promise<string> {
    const result = await invoke<string>('lark_cli_markdown_create', {
      cliPath: this.config.cliPath,
      markdownFile,
      folderToken: this.config.folderToken
    });

    return result;
  }

  // 获取Markdown文件（使用lark-cli markdown）
  async fetchMarkdownFile(fileToken: string): Promise<string> {
    const result = await invoke<string>('lark_cli_markdown_fetch', {
      cliPath: this.config.cliPath,
      fileToken
    });

    return result;
  }

  // 覆盖Markdown文件（使用lark-cli markdown）
  async overwriteMarkdownFile(fileToken: string, markdownFile: string): Promise<void> {
    await invoke('lark_cli_markdown_overwrite', {
      cliPath: this.config.cliPath,
      fileToken,
      markdownFile
    });
  }

  // 首次同步上传（KB → 飞书）
  async firstSyncUpload(): Promise<void> {
    // 扫描KB文件
    const files = await invoke<KBFileInfo[]>('kb_scan_files', {
      kbPath: this.config.kbPath
    });

    // 根据syncMode选择同步方式
    if (this.config.syncMode === 'docs') {
      // 使用docs命令同步（Markdown → 飞书文档）
      for (const file of files) {
        await this.createDocument(file.path, file.name);
      }
    } else if (this.config.syncMode === 'markdown') {
      // 使用markdown命令同步（Markdown → Drive Markdown文件）
      for (const file of files) {
        await this.createMarkdownFile(file.path);
      }
    } else {
      // 使用drive命令同步（文件上传）
      for (const file of files) {
        await this.uploadFile(file.path);
      }
    }
  }

  // 首次同步下载（飞书 → KB）
  async firstSyncDownload(): Promise<void> {
    // 获取飞书文件列表
    const files = await this.listFiles();

    // 根据syncMode选择下载方式
    if (this.config.syncMode === 'markdown') {
      // 使用markdown fetch下载
      for (const file of files) {
        const content = await this.fetchMarkdownFile(file.file_token);
        await invoke('kb_write_file', {
          kbPath: this.config.kbPath,
          fileName: file.name,
          content
        });
      }
    } else {
      // 使用drive download下载
      for (const file of files) {
        await this.downloadFile(
          file.file_token,
          `${this.config.kbPath}/${file.name}`
        );
      }
    }
  }

  // 同步单个变更
  private async syncChange(change: FileChange): Promise<void> {
    if (change.type === 'create' || change.type === 'update') {
      // 根据syncMode选择同步方式
      if (this.config.syncMode === 'docs') {
        const docId = await this.findDocumentId(change.path);
        if (docId) {
          await this.updateDocument(docId, change.path, 'overwrite');
        } else {
          await this.createDocument(change.path, change.name);
        }
      } else if (this.config.syncMode === 'markdown') {
        const fileToken = await this.findFileToken(change.path);
        if (fileToken) {
          await this.overwriteMarkdownFile(fileToken, change.path);
        } else {
          await this.createMarkdownFile(change.path);
        }
      } else {
        await this.uploadFile(change.path);
      }
    } else if (change.type === 'delete') {
      // 需要映射本地文件 → 飞书文件Token
      const fileToken = await this.findFileToken(change.path);
      if (fileToken) {
        // 删除飞书文件（需实现lark_cli_delete命令）
        // await invoke('lark_cli_delete', { cliPath, fileToken });
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

  // 映射本地文件 → 飞书文件Token（需要维护映射表）
  private async findFileToken(localPath: string): Promise<string | null> {
    // 从本地Manifest或sidecar文件中查找映射
    // ...
    return null;
  }
}

interface FileInfo {
  file_token: string;
  name: string;
  type: string;
  updated_at: string;
}

interface KBFileInfo {
  path: string;
  name: string;
}

interface FileChange {
  type: 'create' | 'update' | 'delete';
  path: string;
  name: string;
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