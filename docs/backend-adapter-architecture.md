# 正确的架构设计：适配层在后端

## 核心思想

云平台适配层应该在后端实现，前端只需要一个统一的HTTP API客户端，无需知道具体云平台细节。

---

## 正确架构

```
┌──────────────────────────────────────┐
│          前端（简单）                  │
│  - HTTPClient（统一API调用）           │
│  - 无适配器                            │
│  - 无凭证管理                          │
└──────────────────────────────────────┘
                ↓ HTTP API
┌──────────────────────────────────────┐
│          后端（核心）                  │
│  ┌────────────────────────────────┐  │
│  │  云平台适配层（统一接口）        │  │
│  │  - CloudProviderAPI            │  │
│  │  - ProviderRegistry            │  │
│  │  - LarkCliAdapter              │  │
│  │  - LocalAdapter                │  │
│  │  - NotionAdapter               │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  凭证管理                        │  │
│  │  - 用户飞书凭证                  │  │
│  │  - App ID/App Secret           │  │
│  │  - lark-cli配置                 │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  用户管理                        │  │
│  │  - 注册/登录                     │  │
│  │  - JWT认证                      │  │
│  │  - 权限管理                      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
                ↓ lark-cli / SDK
┌──────────────────────────────────────┐
│          云平台                       │
│  - 飞书                               │
│  - Notion                             │
│  - 本地文件系统                        │
└──────────────────────────────────────┐
```

---

## 前端设计（极简）

### 1. HTTPClient（唯一接口）

```typescript
// src/lib/api/http-client.ts

export class HTTPClient {
  private baseUrl: string;
  private token: string | null = null;
  
  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }
  
  setToken(token: string) {
    this.token = token;
  }
  
  async request(
    path: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
  }
  
  // 用户相关
  async register(email: string, password: string) {
    return await this.request('/auth/register', 'POST', { email, password });
  }
  
  async login(email: string, password: string) {
    return await this.request('/auth/login', 'POST', { email, password });
  }
  
  // 云平台相关（统一接口，无需知道具体平台）
  async listProviders() {
    return await this.request('/cloud/providers');
  }
  
  async authenticateProvider(provider: string) {
    return await this.request(`/cloud/${provider}/auth/login`, 'POST');
  }
  
  async getAuthStatus(provider: string) {
    return await this.request(`/cloud/${provider}/auth/status`);
  }
  
  async createFile(provider: string, options: CreateFileOptions) {
    return await this.request(`/cloud/${provider}/files/create`, 'POST', options);
  }
  
  async readFile(provider: string, fileId: string) {
    return await this.request(`/cloud/${provider}/files/${fileId}`);
  }
  
  async updateFile(provider: string, fileId: string, content: string) {
    return await this.request(`/cloud/${provider}/files/${fileId}`, 'PUT', { content });
  }
  
  async listFiles(provider: string, folderId?: string) {
    const query = folderId ? `?folder=${folderId}` : '';
    return await this.request(`/cloud/${provider}/files${query}`);
  }
  
  async sync(provider: string, options: SyncOptions) {
    return await this.request(`/cloud/${provider}/sync`, 'POST', options);
  }
}

// 使用示例
const client = new HTTPClient();

// 登录
const { token } = await client.login('user@example.com', 'password');
client.setToken(token);

// 飞书认证
const { authUrl } = await client.authenticateProvider('lark');

// 创建文件
const { fileId } = await client.createFile('lark', {
  name: 'test.md',
  content: '# Test',
});

// 读取文件
const { content } = await client.readFile('lark', fileId);

// 同步
const report = await client.sync('lark', {
  mode: 'upload',
  localPath: '/path/to/kb',
  remoteFolderId: 'folder-token',
});
```

### 2. 前端无需适配器

前端**不再需要**：
- ❌ CloudProviderAPI接口定义
- ❌ ProviderRegistry注册表
- ❌ LarkCloudAdapter适配器
- ❌ LocalCloudAdapter适配器
- ❌ App ID/App Secret配置
- ❌ 平台抽象层（platform-detector）

前端**只需要**：
- ✅ HTTPClient（调用后端API）
- ✅ Moraya账号登录
- ✅ 选择云平台（lark/local等）
- ✅ 显示文件列表和编辑内容

---

## 后端设计（核心）

### 1. 后端云平台适配层（复用现有设计）

```typescript
// backend/src/cloud-platform/types.ts

export interface CloudProviderAPI {
  provider: CloudProvider;
  displayName: string;
  icon: string;
  description: string;
  
  authenticate(userId: string): Promise<boolean>;
  isAuthenticated(userId: string): Promise<boolean>;
  
  createFile(userId: string, options: CreateFileOptions): Promise<CloudFile>;
  readFile(userId: string, fileId: string): Promise<string>;
  updateFile(userId: string, fileId: string, content: string): Promise<void>;
  deleteFile(userId: string, fileId: string): Promise<void>;
  listFiles(userId: string, folderId?: string): Promise<CloudFile[]>;
  
  sync(userId: string, options: SyncOptions): Promise<SyncReport>;
  getSyncStatus(userId: string): Promise<SyncStatus>;
  
  getCapabilities(): ProviderCapabilities;
}
```

### 2. 后端飞书适配器（使用lark-cli）

```typescript
// backend/src/cloud-platform/adapters/lark-cli-adapter.ts

import { spawn } from 'child_process';
import type { CloudProviderAPI } from '../types';

export class LarkCliAdapter implements CloudProviderAPI {
  provider = 'lark';
  displayName = '飞书';
  icon = 'lark';
  description = '飞书云文档（通过lark-cli）';
  
  private cliPath: string = '/usr/bin/lark-cli';
  private credentialsStore: CredentialsStore;
  
  constructor(credentialsStore: CredentialsStore) {
    this.credentialsStore = credentialsStore;
  }
  
  async authenticate(userId: string): Promise<boolean> {
    // 执行lark-cli auth login
    const output = await this.executeCli(['auth', 'login', '--domain', 'markdown']);
    
    // 解析输出，提取认证URL
    const authUrlMatch = output.match(/Visit: (https:\/\/[^\s]+)/);
    
    if (authUrlMatch) {
      // 返回认证URL给前端
      return {
        authUrl: authUrlMatch[1],
        waiting: true,
      };
    }
    
    return false;
  }
  
  async createFile(userId: string, options: CreateFileOptions): Promise<CloudFile> {
    // 检查用户是否已认证
    const credentials = await this.credentialsStore.get(userId);
    
    if (!credentials) {
      throw new Error('用户未认证飞书');
    }
    
    // 写入临时文件
    const tempFile = `/tmp/${userId}-${Date.now()}.md`;
    await writeFile(tempFile, options.content);
    
    // 执行lark-cli markdown create
    const output = await this.executeCli([
      'markdown', 'create',
      '--file', tempFile,
      '--title', options.name,
    ]);
    
    // 解析输出，提取file token
    const tokenMatch = output.match(/Token: ([a-zA-Z0-9]+)/);
    
    // 删除临时文件
    await unlink(tempFile);
    
    return {
      id: tokenMatch?.[1] || '',
      name: options.name,
      path: tokenMatch?.[1] || '',
      size: options.content.length,
      mimeType: 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  async readFile(userId: string, fileId: string): Promise<string> {
    // 执行lark-cli markdown fetch
    const output = await this.executeCli([
      'markdown', 'fetch',
      '--token', fileId,
    ]);
    
    return output;
  }
  
  async updateFile(userId: string, fileId: string, content: string): Promise<void> {
    // 写入临时文件
    const tempFile = `/tmp/${userId}-${Date.now()}.md`;
    await writeFile(tempFile, content);
    
    // 执行lark-cli markdown overwrite
    await this.executeCli([
      'markdown', 'overwrite',
      '--token', fileId,
      '--file', tempFile,
    ]);
    
    // 删除临时文件
    await unlink(tempFile);
  }
  
  async listFiles(userId: string, folderId?: string): Promise<CloudFile[]> {
    // 执行lark-cli drive list
    const output = await this.executeCli([
      'drive', 'list',
      '--folder', folderId || '',
    ]);
    
    // 解析输出，提取文件列表
    return this.parseFileList(output);
  }
  
  async sync(userId: string, options: SyncOptions): Promise<SyncReport> {
    // 根据mode执行不同同步策略
    // upload: 执行lark-cli drive upload
    // download: 执行lark-cli drive download
    // bidirectional: 两者都执行
    
    // ...
  }
  
  private async executeCli(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.cliPath, args);
      
      let output = '';
      let error = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(error || output));
        }
      });
    });
  }
}
```

### 3. 后端API路由（统一接口）

```typescript
// backend/src/api/cloud-routes.ts

import express from 'express';
import { cloudProviderRegistry } from '../cloud-platform/provider-registry';

const router = express.Router();

// 获取可用云平台列表
router.get('/providers', authenticateUser, async (req, res) => {
  const providers = cloudProviderRegistry.list();
  
  res.json({
    providers: providers.map(p => ({
      id: p.provider,
      name: p.displayName,
      icon: p.icon,
      description: p.description,
      capabilities: p.getCapabilities(),
    })),
  });
});

// 飞书认证
router.post('/lark/auth/login', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const provider = cloudProviderRegistry.get('lark');
  
  const result = await provider.authenticate(userId);
  
  res.json(result);
});

router.get('/lark/auth/status', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const provider = cloudProviderRegistry.get('lark');
  
  const authenticated = await provider.isAuthenticated(userId);
  
  res.json({
    status: authenticated ? 'authenticated' : 'unauthenticated',
  });
});

// 创建文件
router.post('/:provider/files/create', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const providerId = req.params.provider;
  const { name, content, folderId } = req.body;
  
  const provider = cloudProviderRegistry.get(providerId);
  
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }
  
  const file = await provider.createFile(userId, {
    name,
    content,
    folderId,
  });
  
  res.json({
    success: true,
    file,
  });
});

// 读取文件
router.get('/:provider/files/:fileId', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const providerId = req.params.provider;
  const fileId = req.params.fileId;
  
  const provider = cloudProviderRegistry.get(providerId);
  
  const content = await provider.readFile(userId, fileId);
  
  res.json({
    success: true,
    content,
  });
});

// 更新文件
router.put('/:provider/files/:fileId', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const providerId = req.params.provider;
  const fileId = req.params.fileId;
  const { content } = req.body;
  
  const provider = cloudProviderRegistry.get(providerId);
  
  await provider.updateFile(userId, fileId, content);
  
  res.json({
    success: true,
  });
});

// 列出文件
router.get('/:provider/files', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const providerId = req.params.provider;
  const folderId = req.query.folder as string;
  
  const provider = cloudProviderRegistry.get(providerId);
  
  const files = await provider.listFiles(userId, folderId);
  
  res.json({
    success: true,
    files,
  });
});

// 同步
router.post('/:provider/sync', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const providerId = req.params.provider;
  const { mode, localPath, remoteFolderId } = req.body;
  
  const provider = cloudProviderRegistry.get(providerId);
  
  const report = await provider.sync(userId, {
    mode,
    localPath,
    remoteFolderId,
  });
  
  res.json({
    success: true,
    report,
  });
});

function authenticateUser(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未认证' });
  }
  
  try {
    const user = verifyJWT(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token无效' });
  }
}

export default router;
```

---

## 优势对比

### 前端负担（旧方案）

```
前端需要：
- CloudProviderAPI接口
- ProviderRegistry注册表
- 适配器实现
- App ID/App Secret配置
- OAuth认证处理
- Token管理
- lark-cli路径配置
```

**问题**：
- 前端复杂度高
- 安全风险（Secret暴露）
- 平台不一致（Web/Tauri不同）

---

### 前端负担（新方案）

```
前端只需要：
- HTTPClient（调用后端API）
- Moraya账号登录
```

**优势**：
- ✅ 前端极简（5KB代码）
- ✅ 无安全风险
- ✅ 平台统一（Web/Tauri相同）
- ✅ 后端统一管理

---

## 实施步骤

### Step 1：后端搭建（Phase 1）

```bash
# 创建后端项目
mkdir backend
cd backend
npm init -y
npm install express jsonwebtoken bcrypt

# 目录结构
backend/
├── src/
│   ├── cloud-platform/      # 云平台适配层（复用现有代码）
│   │   ├── types.ts
│   │   ├── provider-registry.ts
│   │   ├── adapters/
│   │   │   ├── lark-cli-adapter.ts
│   │   │   └── local-adapter.ts
│   ├── api/                 # API路由
│   │   ├── auth-routes.ts
│   │   └── cloud-routes.ts
│   ├── auth/                # 用户认证
│   │   ├── user-auth.ts
│   │   ├── credentials-store.ts
│   └── app.ts               # Express应用
└── package.json
```

### Step 2：前端改造（Phase 2）

删除前端适配器：
```bash
# 删除不再需要的文件
rm -rf src/lib/cloud-platform/  # 整个适配层移到后端
rm src/routes/web/lark/callback/ # OAuth回调由后端处理
```

创建HTTPClient：
```bash
# 创建简化API客户端
vim src/lib/api/http-client.ts  # 统一API调用
vim src/lib/api/auth.ts         # Moraya账号登录
```

### Step 3：集成测试（Phase 3）

```bash
# 启动后端
cd backend
npm run dev  # 端口3000

# 启动前端
cd frontend
npm run dev  # 端口15173

# 测试流程
1. 注册Moraya账号
2. 登录获取JWT
3. 飞书认证（后端返回URL）
4. 创建文件（后端调用lark-cli）
5. 读取文件（后端调用lark-cli）
```

---

## 文件迁移清单

### 从前端移到后端

| 前端文件 | 后端文件 | 说明 |
|---------|---------|------|
| src/lib/cloud-platform/types.ts | backend/src/cloud-platform/types.ts | 类型定义 |
| src/lib/cloud-platform/provider-registry.ts | backend/src/cloud-platform/provider-registry.ts | 注册表 |
| src/lib/cloud-platform/adapters/lark-adapter.ts | backend/src/cloud-platform/adapters/lark-cli-adapter.ts | 飞书适配器 |
| src/lib/cloud-platform/adapters/local-adapter.ts | backend/src/cloud-platform/adapters/local-adapter.ts | 本地适配器 |

### 前端新增文件

| 新文件 | 说明 |
|--------|------|
| src/lib/api/http-client.ts | HTTP API客户端 |
| src/lib/api/auth.ts | Moraya账号登录 |
| src/routes/web/login/+page.svelte | Moraya登录页面 |
| src/routes/web/register/+page.svelte | Moraya注册页面 |

---

## 总结

**正确架构**：
- ✅ 云平台适配层在后端
- ✅ 前端只有HTTPClient
- ✅ 后端使用lark-cli统一操作
- ✅ 凭证保存在后端
- ✅ Web/Tauri完全统一

**前端简化**：
- 从5000行代码 → 500行代码
- 从复杂适配器 → 简单HTTP调用

**后端核心**：
- 复用现有适配层设计
- 统一API路由
- 凭证和用户管理

---

需要我开始实施Step 1（后端搭建）吗？先创建后端项目结构，然后迁移适配层代码。