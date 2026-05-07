# Moraya 多终端 AI 协同 Markdown 平台 - 方案设计文档

**版本**: v1.0  
**日期**: 2026-05-07  
**项目代号**: Moraya-X  
**目标**: 构建基于Markdown的多终端、AI协同、云同步一体化创作平台

---

## 一、项目背景与目标

### 1.1 背景

Moraya作为开源Markdown AI Agent编辑器，已具备：
- **本地优先架构**: Tauri v2桌面端 + 本地KB管理
- **AI集成**: 多LLM提供商 + MCP工具生态 + AI模板系统
- **同步基础**: KB ↔ GitHub/Picora云同步 + 三向Diff算法
- **协同萌芽**: Review评论系统 + Git版本管理

当前痛点：
- **终端局限**: 仅支持桌面端，缺少Web/Mobile/鸿蒙覆盖
- **云平台单一**: 仅支持GitHub/Picora，无法接入飞书等主流云文档
- **AI被动**: AI作为对话工具，缺少深度协同创作能力
- **多用户缺失**: 缺少实时协同编辑、团队协作功能

### 1.2 项目目标

**核心目标**：构建"Markdown as Single Source of Truth"的多终端AI协同创作平台

具体目标：
1. **多终端全覆盖**: Desktop/Web/Mobile/HarmonyOS Next四端一致体验
2. **云平台可扩展**: 首个支持飞书，架构支持Notion/语雀等任意平台扩展
3. **AI深度协同**: Agent作为co-author/reviewer等角色深度参与创作
4. **实时协作**: 多用户CRDT协同编辑 + AI实时建议
5. **数据主权**: 本地优先架构，用户完全掌控数据

### 1.3 目标用户

| 用户群体 | 核心诉求 | 使用场景 |
|---------|---------|---------|
| **个人创作者** | Markdown写作 + AI辅助 + 云同步 | 博客、文档、笔记 |
| **团队协作** | 多人协同编辑 + 评论评审 + 版本管理 | 技术文档、产品文档 |
| **企业用户** | 飞书集成 + 权限管理 + 审计合规 | 企业知识库、内部文档 |
| **开发者** | Git集成 + 技术写作 + MCP工具调用 | README、API文档、技术博客 |
| **AI Agent用户** | Agent深度协同 + 多Agent协作 | AI辅助创作、自动化文档生成 |

---

## 二、整体架构设计

### 2.1 架构分层

```
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 1: Multi-Terminal Presentation (多终端展示层)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Desktop      │  │ Web (PWA)    │  │ Mobile       │              │
│  │ (Tauri v2)   │  │ (SvelteKit)  │  │ (Tauri)      │              │
│  │ macOS/Win/Lin│  │ Chrome/Safari│  │ iOS/Android  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐                                                  │
│  │ HarmonyOS    │  (可选，Phase 9)                                 │
│  │ Next (ArkTS) │                                                  │
│  └──────────────┘                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 2: Moraya Core (@moraya/core)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ ProseMirror  │  │ Markdown-it  │  │ Sync Engine  │              │
│  │ Editor       │  │ Parser       │  │ (Diff/CRDT)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ AI Service   │  │ MCP Manager  │  │ KB Service   │              │
│  │ (Multi-LLM)  │  │ (Tool Call)  │  │ (Knowledge)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 3: Cloud Sync Adapter Registry (云同步适配器层)               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Sync Adapter Registry (可扩展架构)                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │ Feishu   │  │ Picora   │  │ GitHub   │  │ Notion   │      │  │
│  │  │ Adapter  │  │ Adapter  │  │ Adapter  │  │ Adapter  │      │  │
│  │  │ (首个)   │  │ (改造)   │  │ (改造)   │  │ (扩展)   │      │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │  │
│  │  │ Yuque    │  │ GitLab   │  │ Custom   │                    │  │
│  │  │ Adapter  │  │ Adapter  │  │ API      │                    │  │
│  │  └──────────┘  └──────────┘  └──────────┘                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 4: AI Agent Adapter Registry (AI Agent适配器层)               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              AI Agent Registry (可扩展架构)                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │ OpenClaw │  │ Claude   │  │ ChatGPT  │  │ Gemini   │      │  │
│  │  │ Agent    │  │ Agent    │  │ Agent    │  │ Agent    │      │  │
│  │  │ (首个)   │  │ (改造)   │  │ (改造)   │  │ (改造)   │      │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │  │
│  │  │ DeepSeek │  │ Qwen     │  │ Custom   │                    │  │
│  │  │ Agent    │  │ Agent    │  │ Agent    │                    │  │
│  │  └──────────┘  └──────────┘  └──────────┘                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 5: Agent Collaboration Engine (Agent协同引擎)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Context      │  │ Block-level  │  │ Memory      │              │
│  │ Injection    │  │ Operations   │  │ Management  │              │
│  │ (KB→Agent)   │  │ (锚点定位)   │  │ (长期记忆)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Tool Call    │  │ Multi-Agent  │  │ Audit       │              │
│  │ (MCP集成)    │  │ Collab       │  │ Tracking    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 6: Real-time Collaboration (实时协同层)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ CRDT Engine  │  │ WebSocket    │  │ Awareness   │              │
│  │ (Yjs)        │  │ Sync         │  │ (在线状态)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 7: Rust Backend (Tauri Commands)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ File I/O     │  │ AI Proxy     │  │ MCP Proc     │              │
│  │ Commands     │  │ HTTP/SSE     │  │ Manager      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Keychain     │  │ Object       │  │ Feishu       │              │
│  │ (keyring)    │  │ Storage      │  │ API Proxy    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ OpenClaw     │  │ WebSocket    │                                │
│  │ API Proxy    │  │ Server       │                                │
│  └──────────────┘  └──────────────┘                                │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 8: Storage & Security (存储与安全层)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Local FS     │  │ IndexedDB    │  │ SQLite      │              │
│  │ (Desktop)    │  │ (Web/Mobile) │  │ (HarmonyOS)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ OS Keychain  │  │ TLS/E2E      │  │ Audit Log   │              │
│  │ (密钥存储)   │  │ Encrypt      │  │ (审计)      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心设计理念

#### 2.2.1 Markdown as Single Source of Truth

**理念**: Markdown作为唯一数据源，所有操作基于Markdown，所有平台转换Markdown

**实现**:
- 本地KB: Markdown文件 + sidecar JSON (AI操作/评论)
- 云平台: Markdown ↔ Block转换器（飞书、Notion等）
- Agent操作: Markdown Block标记 (:::ai-operation)
- 协同编辑: Yjs绑定ProseMirror，操作序列化为Markdown
- 版本管理: Git追踪Markdown变更

**优势**:
- 数据格式标准化，避免平台锁定
- 本地优先，用户完全掌控数据
- 跨平台一致性，任意终端查看同一Markdown

#### 2.2.2 本地优先架构 (Local-First Architecture)

**理念**: 所有操作优先本地，云端作为可选同步目标

**实现**:
- 本地存储优先: Desktop用File System，Web/Mobile用IndexedDB，鸿蒙用SQLite
- 离线编辑支持: 所有终端支持离线编辑，联网后自动同步
- 云端可选: 用户可选择同步到飞书、GitHub等任意平台
- 冲突本地解决: 三向Diff + 冲突策略配置

**优势**:
- 数据主权: 用户数据不依赖云端
- 性能优先: 本地操作零延迟
- 灵活同步: 支持多目标、多策略同步

#### 2.2.3 可扩展插件架构 (Plugin-Based Extensibility)

**理念**: 核心功能通过Registry + Adapter模式，支持无限扩展

**实现**:
- **Sync Adapter Registry**: 云平台适配器注册中心
- **AI Agent Registry**: Agent适配器注册中心
- **Plugin System**: 现有插件系统扩展（Plugin API v1）
- **MCP Ecosystem**: MCP工具生态（现有）

**优势**:
- 新增平台/Agent无需修改核心代码
- 社区贡献适配器
- 用户自定义集成

---

## 三、多终端设计

### 3.1 Desktop端 (已有基础)

**现状**: Tauri v2 + Svelte 5 + ProseMirror + Rust后端

**增强计划**:
- 支持多窗口（已有）
- 集成Sync Adapter（新增）
- 集成Agent Adapter（新增）
- 实时协同WebSocket（新增）

**技术栈**:
| 层 | 技术 | 版本 |
|---|---|---|
| Runtime | Tauri v2 | ≥2.9 |
| Frontend | Svelte 5 + SvelteKit | ^5.0 |
| Editor | Milkdown v7 (ProseMirror) | ^7.18 |
| Backend | Rust | 2021 edition |
| Build | Vite | ^6.0 |

### 3.2 Web端 (PWA)

**目标**: 浏览器访问，离线支持，与Desktop功能一致

**架构**:
```
┌────────────────────────────────────────────────────────┐
│ Web Frontend (SvelteKit SPA)                           │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Editor       │  │ Agent Panel  │                   │
│  │ (ProseMirror)│  │              │                   │
│  └──────────────┘  └──────────────┘                   │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Sync Manager │  │ IndexedDB    │                   │
│  │              │  │ Storage      │                   │
│  └──────────────┘  └──────────────┘                   │
│  ┌──────────────┐                                     │
│  │ Service      │  离线缓存、后台同步                 │
│  │ Worker       │                                     │
│  └──────────────┘                                     │
└────────────────────────────────────────────────────────┘
```

**关键技术点**:
- **@moraya/core**: 抽取核心逻辑为npm包，复用Editor/AI/Sync
- **IndexedDB**: 本地存储（替代Desktop的File System）
- **Service Worker**: 离线缓存、后台同步
- **WebSocket**: 实时协同、Agent流式响应

**PWA特性**:
- 离线编辑
- 后台同步（Service Worker）
- 推送通知（Agent建议、协同消息）
- 安装到桌面（桌面图标）

### 3.3 Mobile端 (iOS/Android)

**目标**: Tauri v2移动端支持，适配移动UI

**技术栈**: Tauri v2 Mobile (iOS/Android)

**UI适配**:
- **编辑器**: ProseMirror触摸优化
- **Agent面板**: 底部Sheet抽屉
- **文件浏览**: List视图优先
- **手势支持**: 双指缩放、三指滑动

**关键特性**:
- 离线编辑（本地SQLite/IndexedDB）
- 云同步（飞书/Picora）
- Agent协同（OpenClaw/Claude）
- 实时协同（WebSocket + Yjs Awareness）

### 3.4 HarmonyOS Next (可选)

**决策点**: 等Phase 8完成后，评估Tauri官方是否支持鸿蒙

**方案选择**:

| 方案 | 条件 | 技术路线 | 工作量 |
|------|------|----------|--------|
| **Tauri移植** | Tauri官方支持鸿蒙 | 直接复用Desktop架构 | 1.5周 |
| **ArkTS原生** | Tauri不支持 | ArkTS + @moraya/core移植 | 3周 |
| **React Native** | 需跨平台优先 | RN + @moraya/core | 2周 |

**推荐**: 等Tauri官方决策，优先ArkTS原生方案

**ArkTS原生架构**:
```
┌────────────────────────────────────────────────────────┐
│ HarmonyOS App (ArkTS)                                  │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ UI Layer     │  │ Core Layer   │                   │
│  │ (ArkUI)      │  │ (@moraya     │                   │
│  │              │  │ core移植)    │                   │
│  └──────────────┘  └──────────────┘                   │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Native API   │  │ SQLite       │                   │
│  │ (@ohos.*)    │  │ Storage      │                   │
│  └──────────────┘  └──────────────┘                   │
└────────────────────────────────────────────────────────┘
```

**关键模块移植**:
- MarkdownParser.ets (从markdown-it移植)
- SyncEngine.ets (从kb-sync移植)
- FeishuClient.ets (飞书API封装)
- AgentService.ets (Agent封装)

---

## 四、云端同步可扩展架构

### 4.1 Sync Adapter Registry设计

#### 4.1.1 核心接口抽象

```typescript
export interface CloudSyncAdapter {
  // 基础信息
  id: CloudPlatform;
  name: string;
  icon: string;
  description: string;
  features: AdapterFeature[];
  
  // 配置验证
  validateConfig(config: Record<string, unknown>): Promise<boolean>;
  testConnection(config: Record<string, unknown>): Promise<boolean>;
  
  // 文档操作接口（统一抽象）
  listDocuments(options: ListOptions): Promise<DocManifestEntry[]>;
  getDocument(id: string, options?: GetOptions): Promise<CloudDocument>;
  createDocument(request: CreateDocRequest): Promise<CloudDocument>;
  updateDocument(id: string, request: UpdateDocRequest): Promise<CloudDocument>;
  deleteDocument(id: string): Promise<void>;
  
  // Markdown双向转换（核心扩展点）
  mdToNative(content: string, options?: TransformOptions): Promise<NativeContent>;
  nativeToMd(native: NativeContent, options?: TransformOptions): Promise<string>;
  
  // 同步能力
  sync(binding: SyncBinding, options: SyncOptions): Promise<SyncResult>;
  
  // 实时监听（可选实现）
  watch?(options: WatchOptions): Promise<WatchHandle>;
  
  // 特殊Block处理（扩展点）
  unsupportedBlocks?: UnsupportedBlockHandler[];
}
```

#### 4.1.2 Adapter能力矩阵

| 平台 | realtime | history | comments | folder | permission | offline |
|------|----------|---------|----------|--------|------------|---------|
| **飞书** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Picora** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **GitHub** | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Notion** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **语雀** | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| **GitLab** | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Google Docs** | ✓ | ✓ | ✓ | ✓ | ✓ | - |

#### 4.1.3 Adapter配置Schema（统一结构）

```typescript
export interface SyncBindingConfig {
  platform: CloudPlatform;
  
  // 通用字段
  name: string;
  enabled: boolean;
  
  // 平台特定配置（每个适配器定义自己的schema）
  credentials: Record<string, unknown>;
  
  // 同步策略
  strategy: {
    mode: 'manual' | 'auto-save' | 'interval' | 'realtime';
    intervalSecs?: number;
    conflictPolicy: 'local-first' | 'remote-first' | 'auto-merge' | 'prompt';
    scope: 'markdown-only' | 'all-files';
    excludePatterns: string[];
  };
  
  // 绑定关系
  binding: {
    localKbId: string;
    remoteFolderId?: string;
    remoteDocId?: string;
  };
}
```

### 4.2 飞书适配器详细设计

#### 4.2.1 飞书Block ↔ Markdown转换规则

| Markdown语法 | 飞书Block Type | 飞书字段 |
|-------------|---------------|---------|
| `# Heading` | block_type=2 | heading_level=1, text.content |
| `## Heading` | block_type=2 | heading_level=2 |
| `普通文本` | block_type=1 | text.content |
| `- Bullet` | block_type=3 | text.content |
| `1. Ordered` | block_type=4 | text.content |
| `> Quote` | block_type=13 | text.content |
| ` ```code``` ` | block_type=14 | code.content, code.language |
| `- [ ] Task` | block_type=16 | todo.content, todo.is_done |
| `Table` | block_type=24 | table.cells |
| `![img](url)` | block_type=27 | image.file_token |
| `**Bold**` | text_style | text_element_style.bold=true |
| `*Italic*` | text_style | text_element_style.italic=true |
| ` `inline` ` | text_style | text_element_style.inline_code=true |
| `[link](url)` | text_style | text_element_style.link_url=url |

#### 4.2.2 不支持Block处理策略

```typescript
unsupportedBlocks = [
  {
    blockType: 'math_block',  // LaTeX
    strategy: 'preserve',
    convertTo: '<!-- math -->\n$CONTENT$\n<!-- end-math -->'
  },
  {
    blockType: 'mermaid',     // Mermaid图
    strategy: 'preserve',
    convertTo: '<!-- mermaid -->\n$CONTENT$\n<!-- end-mermaid -->'
  },
  {
    blockType: 'callout',
    strategy: 'convert',
    convertTo: '> **注：** $CONTENT$'
  },
  {
    blockType: 'front_matter',
    strategy: 'preserve',
    convertTo: '<!-- front-matter -->\n$CONTENT$\n<!-- end -->'
  }
];
```

#### 4.2.3 飞书OAuth登录流程

```
用户点击"连接飞书"
    ↓
打开飞书OAuth WebView
    ↓
用户登录飞书授权
    ↓
飞书回调 moraya://feishu-callback?code=xxx
    ↓
Rust后端用code换取user_access_token
    ↓
存储token到OS Keychain
    ↓
前端获取用户飞书文件夹列表
    ↓
用户选择目标文件夹
    ↓
创建KB ↔ 飞书文件夹Binding
```

### 4.3 三向Diff算法

**继承现有kb-sync/diff.ts架构**

```
三向Diff原理:
┌───────────────┐
│ Last Manifest │  上次同步基准状态
│ (lastSync)    │
└───────────────┘
        ↓
┌───────────────┐     ┌───────────────┐
│ Local Manifest│     │ Remote Manifest│
│ (当前本地)    │     │ (当前云端)     │
└───────────────┘     └───────────────┘
        ↓                    ↓
    计算变更:
    - Local vs Last: 本地新增/删除/修改
    - Remote vs Last: 云端新增/删除/修改
    
    三向合并:
    1. Local新增 + Remote无变化 → upload
    2. Remote新增 + Local无变化 → download
    3. Local删除 + Remote无变化 → delete-remote
    4. Remote删除 + Local无变化 → delete-local
    5. Local修改 + Remote无变化 → upload
    6. Remote修改 + Local无变化 → download
    7. Local修改 + Remote修改 → conflict
    8. Local修改 + Remote删除 → conflict
    9. Local删除 + Remote修改 → conflict
```

---

## 五、AI Agent可扩展架构

### 5.1 AI Agent Registry设计

#### 5.1.1 核心接口抽象

```typescript
export interface AIAgentAdapter {
  // 基础信息
  id: AgentType;
  name: string;
  provider: string;
  icon: string;
  description: string;
  capabilities: AgentCapability[];
  
  // 配置验证
  validateConfig(config: AgentConfig): Promise<boolean>;
  testConnection(config: AgentConfig): Promise<boolean>;

  // Agent核心接口
  initialize(config: AgentConfig): Promise<AgentSession>;
  chat(session: AgentSession, request: AgentRequest): Promise<AgentResponse>;
  stream(session: AgentSession, request: AgentRequest): AsyncGenerator<AgentStreamChunk>;
  terminate(session: AgentSession): Promise<void>;

  // Agent能力（可选实现）
  callTool?(session: AgentSession, tool: ToolCall): Promise<ToolResult>;
  injectContext?(session: AgentSession, context: AgentContext): Promise<void>;
  getMemory?(session: AgentSession): Promise<AgentMemory>;
  setMemory?(session: AgentSession, memory: AgentMemory): Promise<void>;

  // Markdown协同（核心扩展点）
  mdToAgentContext(doc: MarkdownDocument): AgentContext;
  agentResultToMd(result: AgentResult, options?: InsertOptions): MarkdownInsert;
}
```

#### 5.1.2 Agent角色定义

| 角色 | 职责 | Markdown操作模式 |
|------|------|-----------------|
| **co-author** | 共同创作 | 主动修改文档内容，保持作者风格 |
| **reviewer** | 评审建议 | 评论格式，指出问题并提出建议 |
| **researcher** | 信息搜集 | 提供参考资料、数据、来源链接 |
| **translator** | 翻译员 | 翻译文档内容，保持格式风格 |
| **summarizer** | 概括员 | 生成摘要、提炼核心要点 |
| **tool-executor** | 工具执行者 | 调用MCP工具完成任务 |

#### 5.1.3 Agent能力矩阵

| Agent | streaming | toolCall | vision | memory | multiTurn | realtime | maxContext |
|-------|-----------|----------|--------|--------|-----------|----------|------------|
| **OpenClaw** | ✓ | ✓ | - | ✓ | ✓ | - | 128K |
| **Claude** | ✓ | ✓ | ✓ | ✓ | ✓ | - | 200K |
| **ChatGPT** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 128K |
| **Gemini** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1M |
| **DeepSeek** | ✓ | ✓ | - | ✓ | ✓ | - | 64K |

### 5.2 Agent协同引擎设计

#### 5.2.1 上下文注入机制

```typescript
export interface AgentContext {
  // 文档上下文
  documentId?: string;
  documentPath?: string;
  documentContent?: string;      // 当前文档全文
  selectedText?: string;         // 用户选中文本
  selectionAnchor?: AnchorPosition;  // 选区锚点
  
  // KB上下文
  kbId?: string;
  kbName?: string;
  kbFiles?: KBFileInfo[];        // KB内文件列表
  
  // Agent上下文
  role: AgentRole;
  instructions?: string;         // Agent角色指令
  rules?: string;                // MORAYA.md规则内容
}

// 注入流程:
1. 用户打开文档 → 读取documentContent
2. 用户选中文本 → 读取selectedText + selectionAnchor
3. 读取KB规则文件 → 读取rules (MORAYA.md)
4. 构建AgentContext对象 → injectContext(session, context)
5. Agent接收上下文 → 系统指令 + 规则 + 文档内容
```

#### 5.2.2 Block级AI操作标记

```markdown
<!-- AI Agent操作示例 -->

:::ai-operation id="op_001" session="session_abc" role="co-author"
**AI协同编辑 (OpenClaw Agent):**
这段内容是Agent补充的，用户可以接受、修改或拒绝。

[接受] [修改] [拒绝] [讨论]
:::

:::ai-comment id="op_002" session="session_xyz" role="reviewer"
> **评审建议 (Claude Agent):**
> 这段逻辑表述不够清晰，建议重构为更清晰的表达方式。
:::

:::ai-suggestion id="op_003" session="session_xyz" status="pending"
**AI建议:**
请考虑添加更多示例代码。
:::

<!-- 人机讨论线程 -->
:::ai-thread op-id="op_001"
**用户:** 这段内容太长了，请精简。
**OpenClaw:** 好的，我来概括为3个要点...
**用户:** 保留1和2，删除3。
**OpenClaw:** 已修改，请查看。
:::
```

#### 5.2.3 Agent操作Sidecar存储

**继承review-service架构**

```
存储路径: {kbRoot}/.moraya/agent-ops/{relDocPath}.ops.json

文件结构:
{
  "version": 1,
  "documentPath": "article.md",
  "operations": [
    {
      "id": "op_001",
      "type": "write",
      "blockId": "blk_123",
      "content": "AI生成的内容",
      "status": "pending",
      "author": {
        "type": "agent",
        "agentType": "openclaw",
        "role": "co-author"
      },
      "createdAt": "2026-05-07T10:00:00Z",
      "thread": [
        {"author": "user", "text": "精简一点", "timestamp": "..."},
        {"author": "agent", "text": "好的", "timestamp": "..."}
      ]
    }
  ]
}
```

### 5.3 OpenClaw Agent详细设计

#### 5.3.1 OpenClaw Agent配置Schema

```typescript
export interface OpenClawConfig extends AgentConfig {
  type: 'openclaw';
  apiKey: string;
  baseUrl?: string;            // 默认 https://api.openclaw.ai/v1
  model?: string;              // 默认 openclaw-agent-v1
  role?: AgentRole;
  
  // OpenClaw特有配置
  options?: {
    creativityLevel?: 'low' | 'medium' | 'high';  // 创造性程度
    preserveStyle?: boolean;                       // 保持作者风格
    maxSuggestions?: number;                       // 最大建议数
    autoAcceptThreshold?: number;                  // 自动接受阈值(质量评分)
  };
}
```

#### 5.3.2 OpenClaw Agent系统指令模板

```typescript
const roleInstructions: Record<AgentRole, string> = {
  'co-author': `
你是一个专业的Markdown文档协作者。
职责:
- 主动修改文档内容，提升质量和可读性
- 保持作者的写作风格和语气
- 遵循文档规则（MORAYA.md）的指导
- 使用Markdown格式输出
- 在适当位置插入你的修改

输出格式:
- 直接输出修改后的Markdown内容
- 使用 :::ai-operation 包裹你的修改
- 等待用户确认后再执行`,
  
  'reviewer': `
你是一个文档评审专家。
职责:
- 指出文档中的问题（逻辑错误、表达不清、格式问题）
- 提出改进建议
- 不直接修改文档，使用评论格式

输出格式:
- 使用 :::ai-comment 包裹评论
- 精确定位到问题段落（使用锚点）
- 给出具体改进建议`,
  
  'researcher': `
你是一个信息搜集助手。
职责:
- 为作者提供相关资料、数据、参考来源
- 搜集主题相关的背景信息
- 提供可信来源链接

输出格式:
- 使用 :::ai-tool-call 展示工具调用结果
- 提供结构化的参考资料列表`
};
```

---

## 六、实时协同编辑设计

### 6.1 CRDT引擎选型

**选择Yjs（推荐）**

| 特性 | Yjs | Automerge |
|------|-----|-----------|
| ProseMirror绑定 | y-prosemirror（成熟） | 无官方绑定 |
| 性能 | 高性能、低内存 | 较高性能 |
| WebSocket Provider | y-websocket（成熟） | 需自行实现 |
| Awareness | ✓（内置） | 需自行实现 |
| 社区生态 | 大、活跃 | 较小 |
| 文档大小支持 | 大文档优化 | 大文档较慢 |

### 6.2 Yjs集成架构

```
┌────────────────────────────────────────────────────────┐
│ Editor Layer (ProseMirror)                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ProseMirror Editor                                │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Y.Doc (Yjs CRDT)                           │  │  │
│  │  │  - Y.XmlFragment (文档内容)                │  │  │
│  │  │  - Y.Map (文档元数据)                      │  │  │
│  │  │  - Awareness (用户状态)                    │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ y-prosemirror binding                       │  │  │
│  │  │  - ProseMirror ↔ Y.XmlFragment同步         │  │  │
│  │  │  - 操作自动转换为Yjs操作                   │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Sync Layer (Yjs Providers)                             │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Websocket    │  │ Webrtc       │                   │
│  │ Provider     │  │ Provider     │                   │
│  │ (服务器同步) │  │ (P2P同步)    │                   │
│  └──────────────┘  └──────────────┘                   │
│  ┌──────────────┐                                     │
│  │ IndexedDB    │  本地持久化                         │
│  │ Provider     │                                     │
│  └──────────────┘                                     │
└────────────────────────────────────────────────────────┘
```

### 6.3 Awareness（在线状态）

```typescript
interface AwarenessState {
  user: {
    id: string;
    name: string;
    color: string;        // 光标颜色
    avatar?: string;
  };
  cursor?: {
    from: number;         // ProseMirror位置
    to: number;
  };
  selection?: {
    from: number;
    to: number;
  };
  editing?: {
    blockId: string;      // 正在编辑的Block ID
  };
  agent?: {
    sessionId: string;    // 正在使用的Agent会话
    role: AgentRole;
  };
}
```

---

## 七、安全与隐私设计

### 7.1 安全架构分层

```
┌────────────────────────────────────────────────────────┐
│ Layer 1: 用户数据主权                                  │
│  - 本地优先架构                                        │
│  - 用户完全掌控数据                                    │
│  - 云同步可选、可撤销                                  │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 2: 密钥安全                                      │
│  - OS Keychain存储 (macOS/Windows/Linux)              │
│  - API Key不暴露前端                                   │
│  - Rust后端代理所有API调用                             │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 3: 传输安全                                      │
│  - TLS加密传输                                         │
│  - WebSocket加密                                       │
│  - HMAC请求签名 (对象存储)                             │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 4: 前端安全                                      │
│  - CSP强制执行                                         │
│  - XSS防护 (HTML导出消毒)                              │
│  - Path Traversal防护                                  │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 5: Agent安全                                     │
│  - Agent操作范围限制                                   │
│  - 用户确认机制 (接受/拒绝)                            │
│  - 操作审计追踪                                        │
│  - 工具调用权限控制                                    │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ Layer 6: 云平台安全                                    │
│  - OAuth授权（飞书等）                                 │
│  - 用户自持密钥 (BYOK)                                 │
│  - 无中间服务器（直连云平台）                          │
│  - 客户端加密（可选E2E）                               │
└────────────────────────────────────────────────────────┘
```

### 7.2 Agent操作审计

```typescript
interface AuditLog {
  id: string;
  timestamp: string;
  operation: {
    type: 'agent-write' | 'agent-edit' | 'agent-comment' | 'tool-call';
    agentType: AgentType;
    agentRole: AgentRole;
    sessionId: string;
  };
  target: {
    documentPath: string;
    blockId?: string;
    anchor?: AnchorPosition;
  };
  content: {
    before?: string;       // 操作前内容
    after?: string;        // 操作后内容
    delta?: string;        // 变化量
  };
  userAction?: {
    decision: 'accept' | 'reject' | 'modify';
    reason?: string;
    timestamp: string;
  };
}
```

---

## 八、性能与可扩展性设计

### 8.1 性能优化策略

| 模块 | 优化策略 | 实现方式 |
|------|----------|----------|
| **编辑器** | 懒加载渲染 | Mermaid/KaTeX懒加载（已有） |
| **编辑器** | 文档缓存 | Doc Cache v2（已有） |
| **同步** | 分块上传 | 大文件分块同步 |
| **同步** | 断点续传 | 上传中断恢复 |
| **Agent** | 流式响应 | WebSocket/SSE实时输出 |
| **Agent** | 上下文压缩 | KB向量搜索精简上下文 |
| **CRDT** | 大文档优化 | Yjs大文档性能优化 |
| **存储** | IndexedDB优化 | 分库存储、批量写入 |

### 8.2 可扩展性设计

#### 8.2.1 新增云平台步骤

```typescript
// 1. 定义CloudPlatform枚举
export type CloudPlatform = 'new-platform';

// 2. 实现Adapter接口
class NewPlatformAdapter implements CloudSyncAdapter {
  id = 'new-platform';
  name = 'New Platform';
  // ...实现所有接口方法
}

// 3. 定义Config Schema
export interface NewPlatformConfig extends SyncBindingConfig {
  platform: 'new-platform';
  credentials: {
    apiKey: string;
    baseUrl?: string;
  };
}

// 4. 注册到Registry
syncRegistry.register(new NewPlatformAdapter());

// 5. 前端配置UI
<svelte:component this={NewPlatformConfigForm} platform="new-platform" />
```

#### 8.2.2 新增AI Agent步骤

```typescript
// 1. 定义AgentType枚举
export type AgentType = 'new-agent';

// 2. 实现Adapter接口
class NewAgentAdapter implements AIAgentAdapter {
  id = 'new-agent';
  name = 'New Agent';
  // ...实现所有接口方法
}

// 3. 定义Config Schema
export interface NewAgentConfig extends AgentConfig {
  type: 'new-agent';
  apiKey: string;
  baseUrl?: string;
}

// 4. 注册到Registry
agentRegistry.register(new NewAgentAdapter());

// 5. 前端Agent面板
<option value="new-agent">New Agent</option>
```

---

## 九、技术选型总览

### 9.1 核心技术栈

| 层 | 技术 | 版本 | 选择理由 |
|---|------|------|---------|
| **Runtime** | Tauri v2 | ≥2.9 | 跨平台、性能优、Rust后端 |
| **Frontend** | Svelte 5 | ^5.0 | 轻量、响应式、编译优化 |
| **Editor** | ProseMirror | via Milkdown v7 | WYSIWYG、可扩展、成熟 |
| **CRDT** | Yjs | latest | 性能优、生态成熟、ProseMirror绑定 |
| **Markdown Parser** | markdown-it | ^14.1 | CommonMark + GFM、插件丰富 |
| **Backend** | Rust | 2021 edition | 性能、安全、Tauri原生 |
| **Storage (Desktop)** | File System | Native | 本地优先 |
| **Storage (Web/Mobile)** | IndexedDB | Native | 离线支持 |
| **Storage (HarmonyOS)** | SQLite | @ohos.data | 鸿蒙原生 |

### 9.2 云平台API选型

| 平台 | API协议 | 认证方式 | 关键API |
|------|---------|----------|---------|
| **飞书** | REST + WebSocket | OAuth + tenant_access_token | docx:v1/documents, blocks |
| **Picora** | REST | Bearer token | /v1/kbs, /v1/media |
| **GitHub** | REST + GraphQL | Personal access token | repos/{owner}/{repo}/contents |
| **Notion** | REST | Integration token | v1/pages, v1/blocks |
| **语雀** | REST | OAuth + access_token | api.yuque.com/docs |

### 9.3 AI Agent API选型

| Agent | API协议 | 认证方式 | 关键特性 |
|-------|---------|----------|---------|
| **OpenClaw** | REST + WebSocket | API Key | markdown-native, tool-call |
| **Claude** | REST | API Key | long-context, MCP-native |
| **ChatGPT** | REST + WebSocket | API Key | realtime-voice, vision |
| **Gemini** | REST + WebSocket | API Key | 1M context, multimodal |
| **DeepSeek** | REST | API Key | reasoning, 国内合规 |

---

## 十、方案设计总结

### 10.1 核心设计亮点

1. **Markdown as Single Source of Truth**: 数据格式标准化，避免平台锁定
2. **本地优先架构**: 用户数据主权，性能优先
3. **可扩展插件架构**: Registry + Adapter模式，无限扩展能力
4. **Block级AI协同**: Markdown原生支持AI操作，无缝集成
5. **多终端一致性**: @moraya/core统一核心，跨终端复用
6. **实时协同CRDT**: Yjs + ProseMirror，无冲突并发编辑
7. **安全分层设计**: 密钥安全 + 传输安全 + Agent安全

### 10.2 技术创新点

1. **Markdown ↔ 飞书Block双向转换器**: 首个开源实现
2. **AI Agent角色分工**: co-author/reviewer等角色定义
3. **Agent操作审计**: Sidecar存储AI操作历史
4. **多Agent协同机制**: 多Agent并发协作 + 结果合并
5. **鸿蒙ArkTS原生适配**: 等Tauri官方决策，可选原生实现

### 10.3 架构优势

| 优势 | 描述 |
|------|------|
| **数据主权** | 本地优先，用户完全掌控数据 |
| **平台灵活** | 可接入任意云平台，避免锁定 |
| **Agent深度** | AI作为角色参与创作，而非被动工具 |
| **多终端一致** | 四端一致体验，核心逻辑复用 |
| **性能优先** | 本地操作零延迟，懒加载渲染 |
| **可扩展** | 插件化架构，社区贡献适配器 |

---

## 附录：关键模块依赖关系

```
@moraya/core (npm package)
    ├── ProseMirror Editor Engine
    ├── markdown-it Parser
    ├── Sync Engine (Diff/CRDT)
    ├── AI Service Base
    └── MCP Manager Base
    
Sync Adapter Registry
    ├── Feishu Adapter → Feishu API (Rust proxy)
    ├── Picora Adapter → Picora API (Rust proxy)
    ├── GitHub Adapter → GitHub API (Rust proxy)
    └── ... (其他适配器)
    
AI Agent Registry
    ├── OpenClaw Adapter → OpenClaw API (Rust proxy)
    ├── Claude Adapter → Claude API (现有ai-service改造)
    ├── ChatGPT Adapter → OpenAI API (现有ai-service改造)
    └── ... (其他Agent)
    
Agent Collab Engine
    ├── Context Injection → KB Service + Rules Engine
    ├── Block Operations → ProseMirror + Sidecar Storage
    ├── Tool Call → MCP Manager
    └── Memory Management → IndexedDB/SQLite
    
Real-time Collab (Yjs)
    ├── ProseMirror → y-prosemirror binding
    ├── WebSocket → y-websocket provider
    ├── IndexedDB → y-indexeddb provider
    └── Awareness → User state sharing
```

---

**文档版本**: v1.0  
**最后更新**: 2026-05-07  
**审核状态**: 待审核  
**下一步**: 基于此设计方案制定项目计划文档