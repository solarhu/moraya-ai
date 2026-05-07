# Moraya 多终端 AI 协同 Markdown 平台 - 方案设计文档（v3：AI Agent多平台架构）

**版本**: v3.0  
**日期**: 2026-05-07  
**项目代号**: Moraya-X  
**目标**: 构建可扩展的AI Agent平台，通过Agent工具调用实现多云平台文档同步

---

## 一、项目背景与目标

### 1.1 背景

Moraya作为开源Markdown AI Agent编辑器，已具备：
- **本地优先架构**: Tauri v2桌面端 + 本地KB管理
- **AI集成**: 多LLM提供商 + MCP工具生态 + AI模板系统
- **编辑能力**: ProseMirror编辑器 + 三种模式 + Markdown增强

**关键理解**: OpenClaw是AI Agent，不是中间层服务
- OpenClaw Agent具备工具调用能力
- OpenClaw Agent可通过工具调用飞书、Notion、语雀等云平台API
- 本项目通过AI Agent的工具调用实现文档同步
- AI Agent层需要支持多Agent（OpenClaw、Claude、ChatGPT等）
- 每个Agent可支持多平台（飞书、Notion、语雀、GitHub等）

### 1.2 项目目标（v3：AI Agent多平台架构）

**核心目标**: 构建可扩展的AI Agent平台，通过Agent工具调用实现多云平台文档同步

具体目标:
1. **AI Agent Registry**: 可扩展架构，支持多Agent注册
2. **Agent工具调用**: 核心能力，Agent通过工具调用访问云平台API
3. **OpenClaw Agent**: 首个Agent实现，支持飞书平台
4. **Agent上下文注入**: 文档内容注入Agent，提升同步准确性
5. **多平台扩展**: 后续扩展Notion、语雀、GitHub等平台
6. **多Agent扩展**: 后续扩展Claude、ChatGPT等Agent

**架构特点**:
- AI Agent是核心，不是中间层服务
- Agent通过工具调用访问云平台API
- Agent Registry支持多Agent注册
- 每个Agent可支持多个云平台
- 工具定义标准化（JSON Schema）
- Agent可扩展、平台可扩展

---

## 二、整体架构设计（v3）

### 2.1 架构分层

```
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 1: Multi-Terminal Presentation (多终端展示层)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Desktop      │  │ Web (PWA)    │  │ Mobile       │              │
│  │ (Tauri v2)   │  │ (后续)       │  │ (后续)       │              │
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
│ Layer 3: AI Agent Registry (AI Agent注册层 - 核心)                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              AI Agent Registry (可扩展架构)                    │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │ OpenClaw Agent │  │ Claude Agent   │  │ ChatGPT Agent  │  │  │
│  │  │ (首个实现)     │  │ (后续扩展)     │  │ (后续扩展)     │  │  │
│  │  │                │  │                │  │                │  │  │
│  │  │ Platforms:     │  │ Platforms:     │  │ Platforms:     │  │  │
│  │  │ - 飞书 ✓       │  │ - 飞书         │  │ - 飞书         │  │  │
│  │  │ - Notion       │  │ - Notion       │  │ - GitHub       │  │  │
│  │  │ - 语雀         │  │ - 语雀         │  │                │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │  │
│  │  ┌────────────────┐  ┌────────────────┐                     │  │
│  │  │ Gemini Agent   │  │ Custom Agent   │                     │  │
│  │  │ (后续扩展)     │  │ (用户自定义)   │                     │  │
│  │  └────────────────┘  └────────────────┘                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                ↓                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Agent工具调用层 (核心能力)                        │  │
│  │                                                               │  │
│  │  OpenClaw Agent工具集:                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │ feishu_upload│  │feishu_download│  │ feishu_list  │        │  │
│  │  │ (飞书上传)   │  │ (飞书下载)   │  │ (飞书列表)   │        │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │ notion_upload│  │ yuque_upload │  │ github_upload│        │  │
│  │  │ (后续扩展)   │  │ (后续扩展)   │  │ (后续扩展)   │        │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │  │
│  │                                                               │  │
│  │  Claude Agent工具集:                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐                          │  │
│  │  │ feishu_sync  │  │ notion_sync  │                          │  │
│  │  │ (后续扩展)   │  │ (后续扩展)   │                          │  │
│  │  └──────────────┘  └──────────────┘                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 4: Agent Context Injection (Agent上下文注入层)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Document     │  │ KB Context   │  │ Platform     │              │
│  │ Content      │  │ (KB文件)     │  │ Context      │              │
│  │ (文档内容)   │  │              │  │ (目标平台)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ Rules        │  │ Instructions │                                │
│  │ (MORAYA.md)  │  │ (角色指令)   │                                │
│  └──────────────┘  └──────────────┘                                │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 5: Agent Memory Management (Agent记忆管理层)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Long-term    │  │ Short-term   │  │ Memory       │              │
│  │ Memory       │  │ Memory       │  │ Persistence  │              │
│  │ (跨会话)     │  │ (当前会话)   │  │ (.moraya/)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 6: Rust Backend (Tauri Commands)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ File I/O     │  │ Agent API    │  │ Tool Call    │              │
│  │ Commands     │  │ Proxy        │  │ Commands     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Keychain     │  │ WebSocket    │  │ Memory       │              │
│  │ (密钥存储)   │  │ Subscribe    │  │ Storage      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 7: Storage & Security (存储与安全层)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Local FS     │  │ Agent Memory │  │ OS Keychain  │              │
│  │ (KB文件)     │  │ JSON         │  │ (Agent API)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                          ↓ Agent工具调用
┌─────────────────────────────────────────────────────────────────────┤
│ Cloud Platform APIs (云平台API层)                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 飞书云文档   │  │ Notion API   │  │ 语雀API      │              │
│  │ API          │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ GitHub API   │  │ GitLab API   │  │ Google Docs  │              │
│  │              │  │              │  │ API          │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心设计理念

#### 2.2.1 AI Agent是核心，不是中间层

**理念**: OpenClaw是AI Agent，通过工具调用访问云平台API

**实现**:
- AI Agent Registry注册多个Agent（OpenClaw、Claude、ChatGPT等）
- 每个Agent具备工具调用能力（callTool）
- Agent通过工具调用访问飞书、Notion、语雀等云平台API
- 工具定义标准化（JSON Schema格式）
- Agent可根据用户需求选择不同平台

**优势**:
- **Agent可扩展**: 支持注册新Agent（Claude、ChatGPT、Gemini等）
- **平台可扩展**: 每个Agent可支持新平台（Notion、语雀、GitHub等）
- **工具标准化**: 工具定义遵循JSON Schema，易于扩展
- **智能选择**: Agent可根据上下文智能选择合适的平台

#### 2.2.2 Agent工具调用模式

**理念**: Agent通过工具调用访问云平台API，而不是直接封装

**实现**:
- Agent工具定义（AgentTool接口）
- 工具参数JSON Schema
- Agent调用工具（callTool方法）
- Rust后端代理工具调用（安全）
- 工具结果标准化返回

**工具调用流程**:
```
用户发起同步请求
    ↓
选择Agent（如OpenClaw）
    ↓
选择目标平台（如飞书）
    ↓
Agent构建工具调用请求
    ↓
Rust后端代理工具调用
    ↓
Agent调用云平台API（如飞书API）
    ↓
工具结果返回
    ↓
Agent解析结果并通知前端
    ↓
前端更新同步状态
```

#### 2.2.3 多Agent多平台架构

**理念**: Agent Registry支持多Agent，每个Agent支持多平台

**实现**:
- Agent Registry注册多个Agent
- 每个Agent声明支持的云平台列表（supportedPlatforms）
- 每个Agent定义可用的工具集（listAvailableTools）
- 用户可选择Agent + 平台组合
- Agent可根据上下文智能推荐平台

**架构示例**:
```
用户配置:
  Agent: OpenClaw
  Platforms:
    - 飞书 ✓ (enabled)
    - Notion (disabled)
    - 语雀 (disabled)

OpenClaw Agent可用工具:
  - feishu_upload ✓
  - feishu_download ✓
  - feishu_list ✓
  - notion_upload (disabled)
  - yuque_upload (disabled)
```

---

## 三、AI Agent Registry设计

### 3.1 核心接口定义

```typescript
// src/lib/services/ai-agent/types.ts

export type AgentType = 
  | 'openclaw'
  | 'claude'
  | 'chatgpt'
  | 'gemini'
  | 'deepseek'
  | 'custom-agent';

export type CloudPlatform = 
  | 'feishu'
  | 'notion'
  | 'yuque'
  | 'github'
  | 'gitlab'
  | 'google-docs';

export type AgentRole = 
  | 'sync-agent'      // 文档同步Agent（当前优先）
  | 'co-author'       // 共同创作Agent（后续）
  | 'reviewer';       // 评审Agent（后续）

export interface AIAgentAdapter {
  // 基础信息
  id: AgentType;
  name: string;
  provider: string;
  capabilities: AgentCapability[];
  supportedPlatforms: CloudPlatform[];  // 支持的云平台列表
  
  // 配置验证
  validateConfig(config: AgentConfig): Promise<boolean>;
  testConnection(config: AgentConfig): Promise<boolean>;

  // Agent核心接口
  initialize(config: AgentConfig): Promise<AgentSession>;
  chat(session: AgentSession, request: AgentRequest): Promise<AgentResponse>;
  stream(session: AgentSession, request: AgentRequest): AsyncGenerator<AgentStreamChunk>;
  terminate(session: AgentSession): Promise<void>;

  // Agent工具调用（核心：支持多平台）
  callTool(session: AgentSession, tool: AgentToolCall): Promise<ToolResult>;
  listAvailableTools(session: AgentSession): Promise<AgentTool[]>;
  
  // Agent上下文注入
  injectContext(session: AgentSession, context: AgentContext): Promise<void>;
  
  // Agent记忆管理
  getMemory(session: AgentSession): Promise<AgentMemory>;
  setMemory(session: AgentSession, memory: AgentMemory): Promise<void>;
}

export interface AgentCapability {
  streaming: boolean;
  toolCall: boolean;          // 工具调用能力（核心）
  vision: boolean;
  memory: boolean;
  multiTurn: boolean;
  realtime: boolean;
  maxContextTokens: number;
  supportedRoles: AgentRole[];
  supportedPlatforms: CloudPlatform[];  // 支持的云平台
}

export interface AgentConfig {
  id: string;
  type: AgentType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  role?: AgentRole;
  
  // Agent多平台配置（关键）
  platforms?: {
    feishu?: FeishuPlatformConfig;
    notion?: NotionPlatformConfig;
    yuque?: YuquePlatformConfig;
    github?: GitHubPlatformConfig;
  };
  
  // 其他Agent配置
  options?: {
    creativityLevel?: 'low' | 'medium' | 'high';
    preserveStyle?: boolean;
  };
}

export interface FeishuPlatformConfig {
  enabled: boolean;
  folderToken?: string;
  oauth?: {
    app_id?: string;
    app_secret?: string;
  };
}

export interface AgentTool {
  name: string;               // 工具名称，如 'feishu_upload'
  platform: CloudPlatform;    // 所属平台
  description: string;        // 工具描述
  parameters: ToolSchema;     // 参数定义（JSON Schema）
  returns: ToolSchema;        // 返回值定义
}

export interface AgentToolCall {
  id: string;
  name: string;               // 工具名称
  platform: CloudPlatform;    // 目标平台
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  platform: CloudPlatform;
  content: unknown;
  isError: boolean;
  error?: string;
}
```

### 3.2 Agent Registry实现

```typescript
// src/lib/services/ai-agent/registry.ts

class AIAgentRegistry {
  private adapters = new Map<AgentType, AIAgentAdapter>();
  private defaultAgent: AgentType = 'openclaw';

  register(adapter: AIAgentAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(type: AgentType): AIAgentAdapter | undefined {
    return this.adapters.get(type);
  }

  getAll(): AIAgentAdapter[] {
    return Array.from(this.adapters.values());
  }

  // 根据平台筛选支持的Agent
  getByPlatform(platform: CloudPlatform): AIAgentAdapter[] {
    return this.getAll().filter(a => 
      a.supportedPlatforms.includes(platform)
    );
  }

  // 根据角色筛选支持的Agent
  getByRole(role: AgentRole): AIAgentAdapter[] {
    return this.getAll().filter(a => 
      a.capabilities.some(c => c.supportedRoles.includes(role))
    );
  }

  setDefault(type: AgentType): void {
    if (this.adapters.has(type)) {
      this.defaultAgent = type;
    }
  }

  getDefault(): AIAgentAdapter {
    return this.adapters.get(this.defaultAgent)!;
  }
}

export const agentRegistry = new AIAgentRegistry();

// 注册Agent
agentRegistry.register(new OpenClawAgentAdapter());     // 首个
agentRegistry.register(new ClaudeAgentAdapter());        // 后续
agentRegistry.register(new ChatGPTAgentAdapter());       // 后续
```

---

## 四、OpenClaw Agent详细设计

### 4.1 OpenClaw Agent适配器

```typescript
// src/lib/services/ai-agent/adapters/openclaw-adapter.ts

import { invoke } from '@tauri-apps/api/core';
import type { 
  AIAgentAdapter, 
  AgentSession, 
  AgentTool,
  AgentToolCall,
  ToolResult,
  CloudPlatform 
} from '../types';

export class OpenClawAgentAdapter implements AIAgentAdapter {
  id = 'openclaw' as const;
  name = 'OpenClaw Agent';
  provider = 'OpenClaw';
  supportedPlatforms: CloudPlatform[] = ['feishu', 'notion', 'yuque'];

  capabilities = [{
    streaming: true,
    toolCall: true,           // 核心能力
    vision: false,
    memory: true,
    multiTurn: true,
    realtime: false,
    maxContextTokens: 128000,
    supportedRoles: ['sync-agent', 'co-author', 'reviewer'],
    supportedPlatforms: ['feishu', 'notion', 'yuque']
  }];

  // Agent工具定义（支持多平台）
  private tools: AgentTool[] = [
    // 飞书平台工具
    {
      name: 'feishu_upload',
      platform: 'feishu',
      description: '上传Markdown文档到飞书云文档',
      parameters: {
        type: 'object',
        properties: {
          document_path: { type: 'string', description: '本地文档路径' },
          document_content: { type: 'string', description: 'Markdown内容' },
          folder_token: { type: 'string', description: '飞书文件夹Token' }
        },
        required: ['document_path', 'document_content']
      },
      returns: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: '飞书文档ID' },
          feishu_url: { type: 'string', description: '飞书文档URL' }
        }
      }
    },
    {
      name: 'feishu_download',
      platform: 'feishu',
      description: '从飞书云文档下载Markdown文档',
      parameters: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: '飞书文档ID' }
        },
        required: ['document_id']
      },
      returns: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Markdown内容' }
        }
      }
    },
    {
      name: 'feishu_list',
      platform: 'feishu',
      description: '列出飞书文件夹下的文档列表',
      parameters: {
        type: 'object',
        properties: {
          folder_token: { type: 'string', description: '飞书文件夹Token' }
        },
        required: ['folder_token']
      },
      returns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            updated_at: { type: 'number' }
          }
        }
      }
    },
    {
      name: 'feishu_delete',
      platform: 'feishu',
      description: '删除飞书云文档',
      parameters: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: '飞书文档ID' }
        },
        required: ['document_id']
      },
      returns: { type: 'boolean' }
    },
    
    // Notion平台工具（后续扩展）
    {
      name: 'notion_upload',
      platform: 'notion',
      description: '上传Markdown文档到Notion',
      parameters: { ... },
      returns: { ... }
    },
    {
      name: 'notion_download',
      platform: 'notion',
      description: '从Notion下载Markdown文档',
      parameters: { ... },
      returns: { ... }
    },
    
    // 语雀平台工具（后续扩展）
    {
      name: 'yuque_upload',
      platform: 'yuque',
      description: '上传Markdown文档到语雀',
      parameters: { ... },
      returns: { ... }
    },
    {
      name: 'yuque_download',
      platform: 'yuque',
      description: '从语雀下载Markdown文档',
      parameters: { ... },
      returns: { ... }
    }
  ];

  async validateConfig(config: AgentConfig): Promise<boolean> {
    return config.apiKey?.length > 0;
  }

  async testConnection(config: AgentConfig): Promise<boolean> {
    try {
      const result = await invoke<{ status: string }>('openclaw_test_connection', {
        apiKey: config.apiKey,
        baseUrl: config.baseUrl
      });
      return result.status === 'ok';
    } catch {
      return false;
    }
  }

  async initialize(config: AgentConfig): Promise<AgentSession> {
    const sessionId = `session_${crypto.randomUUID()}`;
    
    const session: AgentSession = {
      id: sessionId,
      agentType: 'openclaw',
      config,
      context: { role: config.role ?? 'sync-agent' },
      memory: { id: `mem_${sessionId}`, agentType: 'openclaw', updatedAt: new Date().toISOString() },
      conversationHistory: [],
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    };

    return session;
  }

  // Agent工具调用（核心方法）
  async callTool(session: AgentSession, toolCall: AgentToolCall): Promise<ToolResult> {
    session.lastActiveAt = Date.now();

    // 验证工具存在
    const tool = this.tools.find(t => t.name === toolCall.name);
    if (!tool) {
      return {
        toolCallId: toolCall.id,
        platform: toolCall.platform,
        content: null,
        isError: true,
        error: `Tool ${toolCall.name} not found`
      };
    }

    // 调用Rust后端执行工具
    const result = await invoke<unknown>('openclaw_call_tool', {
      sessionId: session.id,
      apiKey: session.config.apiKey,
      baseUrl: session.config.baseUrl,
      toolName: toolCall.name,
      platform: toolCall.platform,
      arguments: toolCall.arguments
    });

    return {
      toolCallId: toolCall.id,
      platform: toolCall.platform,
      content: result,
      isError: false
    };
  }

  // 列出Agent可用工具（根据session配置过滤）
  async listAvailableTools(session: AgentSession): Promise<AgentTool[]> {
    const platforms = session.config.platforms || {};
    const enabledPlatforms = Object.entries(platforms)
      .filter(([_, config]) => config && config.enabled)
      .map(([platform]) => platform as CloudPlatform);

    if (enabledPlatforms.length === 0) {
      // 默认启用飞书
      return this.tools.filter(t => t.platform === 'feishu');
    }

    return this.tools.filter(t => enabledPlatforms.includes(t.platform));
  }

  // Agent上下文注入（文档内容）
  async injectContext(session: AgentSession, context: AgentContext): Promise<void> {
    session.context = { ...session.context, ...context };
    
    // 构建系统指令
    const systemPrompt = this.buildSystemPrompt(session);
    
    // 发送到OpenClaw
    await invoke('openclaw_set_context', {
      sessionId: session.id,
      apiKey: session.config.apiKey,
      baseUrl: session.config.baseUrl,
      context: {
        system_prompt: systemPrompt,
        document_content: context.documentContent,
        selected_text: context.selectedText,
        target_platform: context.targetPlatform,
        rules: context.rules
      }
    });
  }

  // 系统指令构建（根据角色）
  private buildSystemPrompt(session: AgentSession): string {
    const roleInstructions: Record<AgentRole, string> = {
      'sync-agent': `
你是一个文档同步Agent。
职责:
- 根据用户指令，调用相应的工具完成文档同步
- 支持飞书、Notion、语雀等多个云平台
- 根据文档内容和平台特性，智能选择同步策略
- 保持Markdown格式完整性

可用工具:
${JSON.stringify(this.tools.map(t => ({ name: t.name, platform: t.platform, description: t.description })), null, 2)}

输出格式:
- 调用工具后，返回工具执行结果
- 如遇错误，返回错误信息和解决建议`,
      
      'co-author': `
你是一个文档创作Agent。
职责:
- 协助用户创作Markdown文档
- 保持作者写作风格
- 支持多平台文档格式转换

可用工具:
- 同步工具（上传/下载）
- 格式转换工具`,
      
      'reviewer': `
你是一个文档评审Agent。
职责:
- 评审Markdown文档质量
- 提出改进建议
- 不直接修改文档`
    };

    return roleInstructions[session.context.role] ?? roleInstructions['sync-agent'];
  }
}
```

---

## 五、Rust后端Agent工具调用实现

### 5.1 核心Command实现

```rust
// src-tauri/src/commands/openclaw.rs

use reqwest;
use serde::{Deserialize, Serialize};
use tauri::command;

const OPENCLAW_API_BASE: &str = "https://api.openclaw.ai/v1";

#[derive(Debug, Serialize, Deserialize)]
struct OpenClawToolCallRequest {
    session_id: String,
    tool_name: String,
    platform: String,
    arguments: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenClawToolCallResult {
    tool_call_id: String,
    platform: String,
    content: serde_json::Value,
    is_error: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

/// Agent工具调用（核心：支持多平台）
#[command]
pub async fn openclaw_call_tool(
    api_key: String,
    base_url: Option<String>,
    session_id: String,
    tool_name: String,
    platform: String,
    arguments: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "{}/agent/call-tool",
        base_url.unwrap_or(OPENCLAW_API_BASE.to_string())
    );

    let res = client
        .post(&url)
        .bearer_auth(&api_key)
        .json(&OpenClawToolCallRequest {
            session_id,
            tool_name,
            platform,
            arguments,
        })
        .send()
        .await
        .map_err(|_| "Network error")?;

    if !res.status().is_success() {
        let status = res.status().as_u16();
        let body = res.text().await.unwrap_or_default();
        return Err(format!("OpenClaw tool call failed ({status}): {body}"));
    }

    res.json::<serde_json::Value>()
        .await
        .map_err(|_| "Invalid response")
}

/// 列出Agent可用工具
#[command]
pub async fn openclaw_list_tools(
    api_key: String,
    base_url: Option<String>,
    session_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "{}/agent/tools",
        base_url.unwrap_or(OPENCLAW_API_BASE.to_string())
    );

    let res = client
        .get(&url)
        .bearer_auth(&api_key)
        .query(&[("session_id", session_id.as_str())])
        .send()
        .await
        .map_err(|_| "Network error")?;

    if !res.status().is_success() {
        return Err(format!("OpenClaw list tools failed: {}", res.status()));
    }

    res.json::<Vec<serde_json::Value>>()
        .await
        .map_err(|_| "Invalid response")
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

/// Agent设置上下文
#[command]
pub async fn openclaw_set_context(
    api_key: String,
    base_url: Option<String>,
    session_id: String,
    context: serde_json::Value,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!(
        "{}/agent/context",
        base_url.unwrap_or(OPENCLAW_API_BASE.to_string())
    );

    let res = client
        .post(&url)
        .bearer_auth(&api_key)
        .json(&serde_json::json!({
            "session_id": session_id,
            "context": context
        }))
        .send()
        .await
        .map_err(|_| "Network error")?;

    if !res.status().is_success() {
        return Err(format!("OpenClaw set context failed: {}", res.status()));
    }

    Ok(())
}
```

---

## 六、前端Agent配置UI（多平台）

### 6.1 Agent选择 + 平台配置

```svelte
<!-- src/lib/components/settings/AgentPlatformConfig.svelte -->

<script lang="ts">
  import { agentRegistry } from '$lib/services/ai-agent/registry';
  import type { AgentType, CloudPlatform } from '$lib/services/ai-agent/types';

  let agents = $state(agentRegistry.getAll());
  let selectedAgent: AgentType = 'openclaw';
  let selectedPlatforms: CloudPlatform[] = ['feishu'];

  let agentConfig = $state({
    apiKey: '',
    baseUrl: 'https://api.openclaw.ai/v1',
    platforms: {
      feishu: { enabled: true, folderToken: '' },
      notion: { enabled: false, apiKey: '' },
      yuque: { enabled: false, apiKey: '' }
    }
  });

  // 获取当前Agent支持的平台
  $derived availablePlatforms = agents
    .find(a => a.id === selectedAgent)
    ?.supportedPlatforms || [];

  async function testAgentConnection() {
    const adapter = agentRegistry.get(selectedAgent);
    if (!adapter) return;

    const success = await adapter.testConnection(agentConfig);
    // ...
  }

  async function initializeAgent() {
    const adapter = agentRegistry.get(selectedAgent);
    if (!adapter) return;

    const session = await adapter.initialize({
      type: selectedAgent,
      apiKey: agentConfig.apiKey,
      baseUrl: agentConfig.baseUrl,
      platforms: agentConfig.platforms,
      role: 'sync-agent'
    });

    // 列出可用工具
    const tools = await adapter.listAvailableTools(session);
    // ...
  }
</script>

<div class="agent-platform-config">
  <!-- Agent选择 -->
  <div class="agent-selector">
    <label>选择Agent:</label>
    <select bind:value={selectedAgent}>
      {#each agents as agent}
        <option value={agent.id}>
          {agent.name} - 支持: {agent.supportedPlatforms.join(', ')}
        </option>
      {/each}
    </select>
  </div>

  <!-- Agent配置 -->
  <div class="agent-config">
    <div class="form-group">
      <label>API Key:</label>
      <input type="password" bind:value={agentConfig.apiKey} />
    </div>

    <div class="form-group">
      <label>Base URL:</label>
      <input type="text" bind:value={agentConfig.baseUrl} />
    </div>
  </div>

  <!-- 平台选择 -->
  <div class="platform-selector">
    <label>启用云平台:</label>
    {#each availablePlatforms as platform}
      <div class="platform-option">
        <input 
          type="checkbox" 
          checked={agentConfig.platforms[platform]?.enabled}
          onchange={() => {
            agentConfig.platforms[platform] = {
              ...agentConfig.platforms[platform],
              enabled: !agentConfig.platforms[platform]?.enabled
            };
          }
        />
        <label>{platform}</label>
      </div>
    {/each}
  </div>

  <!-- 平台配置（飞书） -->
  {#if agentConfig.platforms.feishu?.enabled}
    <div class="platform-config feishu">
      <h4>飞书配置:</h4>
      <div class="form-group">
        <label>文件夹Token:</label>
        <input type="text" bind:value={agentConfig.platforms.feishu.folderToken} />
      </div>
    </div>
  {/if}

  <!-- 平台配置（Notion） -->
  {#if agentConfig.platforms.notion?.enabled}
    <div class="platform-config notion">
      <h4>Notion配置:</h4>
      <div class="form-group">
        <label>API Key:</label>
        <input type="password" bind:value={agentConfig.platforms.notion.apiKey} />
      </div>
    </div>
  {/if}

  <!-- 操作按钮 -->
  <div class="button-group">
    <button onclick={testAgentConnection}>测试连接</button>
    <button onclick={initializeAgent}>初始化Agent</button>
  </div>
</div>
```

---

## 七、同步流程实现（基于Agent工具调用）

### 7.1 SyncEngine（基于Agent工具调用）

```typescript
// src/lib/services/sync-engine.ts

import { agentRegistry } from './ai-agent/registry';
import type { AgentSession, AgentToolCall, CloudPlatform } from './ai-agent/types';

export class SyncEngine {
  private session: AgentSession | null = null;
  private fileWatcher: FileWatcher;

  // 初始化同步（选择Agent + 平台）
  async initialize(
    agentType: AgentType,
    platform: CloudPlatform,
    config: AgentConfig
  ): Promise<void> {
    const adapter = agentRegistry.get(agentType);
    if (!adapter) throw new Error(`Agent ${agentType} not registered`);

    // 初始化Agent会话
    this.session = await adapter.initialize(config);

    // 注入文档上下文
    await adapter.injectContext(this.session, {
      role: 'sync-agent',
      targetPlatform: platform,
      documentContent: '',  // 后续动态注入
    });

    // 启动文件监听
    await this.fileWatcher.startWatch(config.kbPath);
  }

  // 文档上传（通过Agent工具调用）
  async uploadDocument(
    documentPath: string,
    content: string
  ): Promise<ToolResult> {
    if (!this.session) throw new Error('Session not initialized');

    const adapter = agentRegistry.get(this.session.agentType);
    const platform = this.session.context.targetPlatform as CloudPlatform;

    // 构建工具调用请求
    const toolCall: AgentToolCall = {
      id: `call_${crypto.randomUUID()}`,
      name: `${platform}_upload`,  // 如 'feishu_upload'
      platform,
      arguments: {
        document_path: documentPath,
        document_content: content,
        folder_token: this.session.config.platforms?.[platform]?.folderToken
      }
    };

    // Agent调用工具
    const result = await adapter.callTool(this.session, toolCall);
    return result;
  }

  // 文档下载（通过Agent工具调用）
  async downloadDocument(documentId: string): Promise<string> {
    if (!this.session) throw new Error('Session not initialized');

    const adapter = agentRegistry.get(this.session.agentType);
    const platform = this.session.context.targetPlatform as CloudPlatform;

    const toolCall: AgentToolCall = {
      id: `call_${crypto.randomUUID()}`,
      name: `${platform}_download`,  // 如 'feishu_download'
      platform,
      arguments: {
        document_id: documentId
      }
    };

    const result = await adapter.callTool(this.session, toolCall);
    
    if (result.isError) {
      throw new Error(result.error || 'Download failed');
    }

    return result.content as string;
  }

  // 文档列表（通过Agent工具调用）
  async listDocuments(): Promise<DocumentInfo[]> {
    if (!this.session) throw new Error('Session not initialized');

    const adapter = agentRegistry.get(this.session.agentType);
    const platform = this.session.context.targetPlatform as CloudPlatform;

    const toolCall: AgentToolCall = {
      id: `call_${crypto.randomUUID()}`,
      name: `${platform}_list`,  // 如 'feishu_list'
      platform,
      arguments: {
        folder_token: this.session.config.platforms?.[platform]?.folderToken
      }
    };

    const result = await adapter.callTool(this.session, toolCall);
    return result.content as DocumentInfo[];
  }

  // 首次同步上传（KB → 云平台）
  async firstSyncUpload(): Promise<void> {
    if (!this.session) throw new Error('Session not initialized');

    // 扫描KB文件
    const files = await invoke<KBFileInfo[]>('kb_scan_files', {
      kbPath: this.session.config.kbPath
    });

    // 批量上传（通过Agent工具调用）
    for (const file of files) {
      const content = await invoke<string>('read_file', { path: file.path });
      await this.uploadDocument(file.relativePath, content);
    }
  }

  // 首次同步下载（云平台 → KB）
  async firstSyncDownload(): Promise<void> {
    if (!this.session) throw new Error('Session not initialized');

    // 获取文档列表
    const docs = await this.listDocuments();

    // 批量下载
    for (const doc of docs) {
      const content = await this.downloadDocument(doc.id);
      await invoke('write_file', {
        path: `${this.session.config.kbPath}/${doc.name}`,
        content
      });
    }
  }
}
```

---

## 八、扩展性设计

### 8.1 新增Agent步骤

```typescript
// 1. 实现AIAgentAdapter接口
class ClaudeAgentAdapter implements AIAgentAdapter {
  id = 'claude';
  name = 'Claude Agent';
  supportedPlatforms = ['feishu', 'notion', 'github'];
  
  // 实现所有方法...
}

// 2. 定义Agent工具
private tools: AgentTool[] = [
  { name: 'feishu_upload', platform: 'feishu', ... },
  { name: 'feishu_download', platform: 'feishu', ... },
  { name: 'notion_upload', platform: 'notion', ... },
  // ...
];

// 3. 注册到Registry
agentRegistry.register(new ClaudeAgentAdapter());
```

### 8.2 新增平台步骤（在Agent内扩展）

```typescript
// 在OpenClawAgentAdapter中新增Notion支持
private tools: AgentTool[] = [
  // ...现有飞书工具
  
  // 新增Notion工具
  {
    name: 'notion_upload',
    platform: 'notion',
    description: '上传Markdown文档到Notion',
    parameters: {
      type: 'object',
      properties: {
        document_content: { type: 'string' },
        page_id: { type: 'string' }
      },
      required: ['document_content']
    },
    returns: { ... }
  },
  {
    name: 'notion_download',
    platform: 'notion',
    description: '从Notion下载Markdown文档',
    parameters: { ... },
    returns: { ... }
  }
];

// 更新supportedPlatforms
supportedPlatforms: CloudPlatform[] = ['feishu', 'notion', 'yuque'];
```

---

## 九、技术选型总结（v3）

### 9.1 核心技术栈

| 层 | 技术 | 版本 | 选择理由 |
|---|------|------|---------|
| **Runtime** | Tauri v2 | ≥2.9 | 跨平台、性能优 |
| **Frontend** | Svelte 5 | ^5.0 | 轻量、响应式 |
| **Editor** | ProseMirror | via Milkdown v7 | WYSIWYG |
| **Backend** | Rust | 2021 edition | 性能、安全 |

### 9.2 外部服务依赖

| 服务 | 类型 | 作用 |
|------|------|------|
| **OpenClaw API** | AI Agent | 飞书/Notion/语雀文档同步（工具调用） |
| **Claude API** | AI Agent | 飞书/Notion同步（后续扩展） |
| **飞书API** | 云平台 | 文档存储（通过Agent工具调用） |
| **Notion API** | 云平台 | 文档存储（通过Agent工具调用） |
| **语雀API** | 云平台 | 文档存储（通过Agent工具调用） |

---

## 十、方案设计总结（v3）

### 10.1 核心设计亮点

1. **AI Agent是核心**: OpenClaw是AI Agent，不是中间层服务
2. **Agent工具调用**: Agent通过工具调用访问云平台API
3. **Agent Registry可扩展**: 支持多Agent注册（OpenClaw、Claude等）
4. **平台可扩展**: 每个Agent可支持多平台（飞书、Notion、语雀等）
5. **工具标准化**: 工具定义遵循JSON Schema
6. **智能选择**: Agent可根据上下文智能选择平台

### 10.2 与原方案对比

| 项目 | 原方案（v1） | 简化方案（v2） | Agent方案（v3） |
|------|-------------|--------------|----------------|
| **核心架构** | 多层架构 | OpenClaw中间层 | AI Agent Registry |
| **同步实现** | 直接封装飞书API | OpenClaw封装 | Agent工具调用 |
| **可扩展性** | Adapter Registry | 单适配器 | 多Agent + 多平台 |
| **工作量** | 420h | 300h | 350h |
| **周期** | 18-21周 | 7周 | 8-9周 |

### 10.3 方案优势

| 优势 | 描述 |
|------|------|
| **架构清晰** | AI Agent是核心，工具调用是能力 |
| **Agent可扩展** | 支持注册新Agent（Claude、ChatGPT等） |
| **平台可扩展** | 每个Agent可支持新平台 |
| **工具标准化** | 工具定义JSON Schema，易于理解 |
| **智能决策** | Agent可根据上下文智能选择平台 |

---

**文档版本**: v3.0（AI Agent多平台架构）  
**最后更新**: 2026-05-07  
**审核状态**: 待审核  
**下一步**: 基于此设计方案制定v3项目计划