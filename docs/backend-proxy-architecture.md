# 后端代理架构设计

## 设计目标

统一使用lark-cli方式操作飞书，认证信息保存在后端，前端无需配置App ID/App Secret。

---

## 架构设计

### 当前方案（问题）

```
┌─────────┐                    ┌──────────┐
│  Web前端 │──App ID/Secret────→│ 飞书API  │
│         │   （暴露风险）       │          │
└─────────┘                    └──────────┘

┌─────────┐                    ┌──────────┐
│ Tauri端 │──lark-cli本地──────→│ 飞书API  │
│         │   （需要安装CLI）     │          │
└─────────┘                    └──────────┘
```

**问题**：
- Web端App Secret暴露
- Tauri端需要用户安装lark-cli
- 两套方案，体验不一致

---

### 新方案（统一）

```
┌─────────┐                    ┌──────────┐                    ┌──────────┐
│ Web前端 │──Moraya API───────→│ Moraya   │──lark-cli───────→│ 飞书API  │
│         │   （无需Secret）    │ 后端服务 │   （后端安装）    │          │
└─────────┘                    │          │                    └──────────┘
                               │ 用户认证 │                    ┌──────────┐
┌─────────┐                    │ 凭证存储 │──lark-cli───────→│ 飞书API  │
│ Tauri端 │──Moraya API───────→│          │   （后端安装）    │          │
│         │   （无需CLI）       └──────────┘                    └──────────┘
└─────────┘
```

**优势**：
- ✅ App Secret保存在后端（安全）
- ✅ 用户无需安装lark-cli
- ✅ Web/Tauri统一体验
- ✅ 后端统一管理飞书凭证
- ✅ 支持个人和企业账号

---

## 后端服务设计

### 技术栈

**方案A：Node.js + Express**（推荐）
- 与前端技术栈一致
- 开发速度快
- 易于集成

**方案B：Go + Gin**
- 性能更高
- 内存占用小
- 适合高并发

**方案C：Python + FastAPI**
- 易于开发
- 飞书SDK丰富
- 快速原型

**选择**：Node.js + Express（快速实现）

---

### 核心模块

#### 1. **用户认证模块**

```typescript
// src/backend/auth/user-auth.ts

interface User {
  id: string;
  email: string;
  passwordHash: string;
  larkCredentials?: LarkCredentials;
}

interface LarkCredentials {
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  domain: 'docs' | 'drive' | 'markdown';
}

class UserAuthService {
  // 用户注册
  async register(email: string, password: string): Promise<User> {
    // 密码加密
    // 创建用户记录
    // 返回用户对象
  }
  
  // 用户登录
  async login(email: string, password: string): Promise<string> {
    // 验证密码
    // 生成JWT token
    // 返回token
  }
  
  // 验证JWT
  async verifyToken(token: string): Promise<User> {
    // 解析JWT
    // 返回用户对象
  }
}
```

#### 2. **飞书认证模块**

```typescript
// src/backend/lark/lark-auth-service.ts

import { spawn } from 'child_process';

class LarkAuthService {
  private cliPath: string;
  
  constructor(cliPath: string = '/usr/bin/lark-cli') {
    this.cliPath = cliPath;
  }
  
  // 检查lark-cli是否安装
  async checkCliInstalled(): Promise<boolean> {
    try {
      await this.executeCli(['--version']);
      return true;
    } catch {
      return false;
    }
  }
  
  // 安装lark-cli（后端自动安装）
  async installCli(): Promise<void> {
    // npm install -g @bytedance/lark-cli
  }
  
  // 用户飞书登录
  async login(userId: string, domain: 'docs' | 'markdown'): Promise<void> {
    // 执行：lark-cli auth login --domain {domain}
    // 等待用户完成认证（前端显示认证URL）
    // 保存储凭证
  }
  
  // 获取用户飞书凭证
  async getUserCredentials(userId: string): Promise<LarkCredentials | null> {
    // 从数据库读取
    // 检查是否过期
    // 如果过期，刷新token
  }
  
  // 刷新token
  async refreshToken(userId: string): Promise<void> {
    // 执行：lark-cli auth refresh
    // 更新数据库中的凭证
  }
  
  // 检查认证状态
  async checkAuthStatus(userId: string): Promise<'authenticated' | 'expired' | 'unauthenticated'> {
    const credentials = await this.getUserCredentials(userId);
    
    if (!credentials) {
      return 'unauthenticated';
    }
    
    if (credentials.expiresAt && credentials.expiresAt < Date.now()) {
      return 'expired';
    }
    
    return 'authenticated';
  }
  
  // 执行lark-cli命令
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

#### 3. **飞书同步模块**

```typescript
// src/backend/lark/lark-sync-service.ts

class LarkSyncService {
  private authService: LarkAuthService;
  
  constructor(authService: LarkAuthService) {
    this.authService = authService;
  }
  
  // 创建文档
  async createDocument(
    userId: string,
    title: string,
    content: string,
    folderToken?: string
  ): Promise<string> {
    // 检查用户认证
    const credentials = await this.authService.getUserCredentials(userId);
    
    if (!credentials) {
      throw new Error('用户未登录飞书');
    }
    
    // 执行：lark-cli docs create --title {title} --content {content}
    // 或：lark-cli markdown create --file {path}
    // 返回文档token
  }
  
  // 读取文档
  async readDocument(userId: string, fileToken: string): Promise<string> {
    // 执行：lark-cli docs fetch --token {fileToken}
    // 或：lark-cli markdown fetch --token {fileToken}
    // 返回文档内容
  }
  
  // 更新文档
  async updateDocument(
    userId: string,
    fileToken: string,
    content: string
  ): Promise<void> {
    // 执行：lark-cli docs update --token {fileToken} --content {content}
    // 或：lark-cli markdown overwrite --token {fileToken} --file {path}
  }
  
  // 列出文件
  async listFiles(userId: string, folderToken?: string): Promise<any[]> {
    // 执行：lark-cli drive list --folder {folderToken}
    // 返回文件列表
  }
  
  // 上传文件
  async uploadFile(
    userId: string,
    filePath: string,
    folderToken?: string
  ): Promise<string> {
    // 执行：lark-cli drive upload --file {filePath} --folder {folderToken}
    // 返回文件token
  }
  
  // 下载文件
  async downloadFile(userId: string, fileToken: string): Promise<string> {
    // 执行：lark-cli drive download --token {fileToken}
    // 返回文件内容
  }
}
```

#### 4. **API路由**

```typescript
// src/backend/api/routes.ts

import express from 'express';
import { UserAuthService } from '../auth/user-auth';
import { LarkAuthService } from '../lark/lark-auth-service';
import { LarkSyncService } from '../lark/lark-sync-service';

const router = express.Router();

const userAuthService = new UserAuthService();
const larkAuthService = new LarkAuthService();
const larkSyncService = new LarkSyncService(larkAuthService);

// 用户认证
router.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const user = await userAuthService.register(email, password);
  res.json({ success: true, userId: user.id });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const token = await userAuthService.login(email, password);
  res.json({ success: true, token });
});

// 飞书认证
router.get('/lark/auth/status', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const status = await larkAuthService.checkAuthStatus(userId);
  res.json({ status });
});

router.post('/lark/auth/login', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { domain } = req.body;
  
  // 返回认证URL给前端
  const authUrl = await larkAuthService.getLoginUrl(userId, domain);
  res.json({ authUrl });
});

router.post('/lark/auth/callback', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  await larkAuthService.completeLogin(userId);
  res.json({ success: true });
});

// 飞书同步
router.post('/lark/documents/create', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { title, content, folderToken } = req.body;
  
  const fileToken = await larkSyncService.createDocument(
    userId,
    title,
    content,
    folderToken
  );
  
  res.json({ success: true, fileToken });
});

router.get('/lark/documents/:token', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const fileToken = req.params.token;
  
  const content = await larkSyncService.readDocument(userId, fileToken);
  res.json({ success: true, content });
});

router.put('/lark/documents/:token', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const fileToken = req.params.token;
  const { content } = req.body;
  
  await larkSyncService.updateDocument(userId, fileToken, content);
  res.json({ success: true });
});

router.get('/lark/files', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { folderToken } = req.query;
  
  const files = await larkSyncService.listFiles(userId, folderToken);
  res.json({ success: true, files });
});

// 中间件：验证用户JWT
function authenticateUser(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未认证' });
  }
  
  try {
    const user = userAuthService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token无效' });
  }
}

export default router;
```

---

## 前端适配器改造

### 新的Web适配器

```typescript
// src/lib/cloud-platform/adapters/lark-backend-adapter.ts

import type { CloudProviderAPI } from '../types';
import type { PlatformAdapter } from '$lib/platform/types';

export class LarkBackendAdapter implements CloudProviderAPI {
  provider = 'lark';
  displayName = '飞书（后端代理）';
  icon = 'lark';
  description = '通过Moraya后端服务访问飞书';
  
  private platformAdapter: PlatformAdapter;
  private backendUrl: string;
  
  constructor(platformAdapter: PlatformAdapter, backendUrl: string) {
    this.platformAdapter = platformAdapter;
    this.backendUrl = backendUrl;
  }
  
  async authenticate(): Promise<boolean> {
    // 获取Moraya登录token
    const morayaToken = await this.platformAdapter.storage.get('moraya-auth-token');
    
    if (!morayaToken) {
      // 跳转到Moraya登录页面
      throw new Error('请先登录Moraya账号');
    }
    
    // 检查飞书认证状态
    const status = await this.getLarkAuthStatus(morayaToken);
    
    if (status === 'unauthenticated') {
      // 获取飞书认证URL
      const authUrl = await this.getLarkLoginUrl(morayaToken);
      
      // 弹出窗口让用户认证飞书
      window.open(authUrl, '_blank');
      
      // 等待认证完成
      return await this.waitForLarkAuth(morayaToken);
    }
    
    return true;
  }
  
  async createFile(options: CreateFileOptions): Promise<CloudFile> {
    const morayaToken = await this.getMorayaToken();
    
    const response = await this.platformAdapter.http.fetch(
      `${this.backendUrl}/api/lark/documents/create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${morayaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: options.name,
          content: options.content,
          folderToken: options.folderId,
        }),
      }
    );
    
    const data = await response.json();
    
    return {
      id: data.fileToken,
      name: options.name,
      path: data.fileToken,
      size: options.content.length,
      mimeType: 'text/markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  async readFile(fileId: string): Promise<string> {
    const morayaToken = await this.getMorayaToken();
    
    const response = await this.platformAdapter.http.fetch(
      `${this.backendUrl}/api/lark/documents/${fileId}`,
      {
        headers: {
          'Authorization': `Bearer ${morayaToken}`,
        },
      }
    );
    
    const data = await response.json();
    return data.content;
  }
  
  // 其他方法类似...
  
  private async getMorayaToken(): Promise<string> {
    const token = await this.platformAdapter.storage.get('moraya-auth-token');
    
    if (!token) {
      throw new Error('请先登录Moraya账号');
    }
    
    return token;
  }
  
  private async getLarkAuthStatus(token: string): Promise<string> {
    const response = await this.platformAdapter.http.fetch(
      `${this.backendUrl}/api/lark/auth/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    const data = await response.json();
    return data.status;
  }
  
  private async getLarkLoginUrl(token: string): Promise<string> {
    const response = await this.platformAdapter.http.fetch(
      `${this.backendUrl}/api/lark/auth/login`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: 'markdown' }),
      }
    );
    
    const data = await response.json();
    return data.authUrl;
  }
}
```

---

## 用户流程

### 1. 注册Moraya账号

```
用户 → Moraya Web → 注册页面 → 输入邮箱密码 → 创建账号
                                            ↓
                                      保存到后端数据库
```

### 2. 登录Moraya

```
用户 → 输入邮箱密码 → 后端验证 → 返回JWT token → 保存到localStorage
```

### 3. 飞书认证

```
用户 → 点击"飞书同步" → 后端返回认证URL → 弹出窗口 → 用户登录飞书
                                                        ↓
                                                飞书返回授权码
                                                        ↓
                                                后端用lark-cli完成认证
                                                        ↓
                                                保存在后端数据库
```

### 4. 文件同步

```
用户 → 编辑文件 → 点击"同步到飞书" → 前端调用后端API → 后端用lark-cli同步
                                            ↓
                                        返回结果给前端
```

---

## 实施计划

### Phase 1：后端基础架构（2周）

- Node.js + Express搭建
- 用户认证系统（注册/登录/JWT）
- 数据库设计（用户表/凭证表）
- lark-cli安装和集成

### Phase 2：飞书认证模块（1周）

- lark-cli认证流程
- 凭证存储和刷新
- 认证状态检查

### Phase 3：飞书同步模块（2周）

- 文档创建/读取/更新
- 文件列表/上传/下载
- 错误处理

### Phase 4：前端适配器改造（1周）

- LarkBackendAdapter实现
- 移除App ID/App Secret配置
- 集成Moraya登录

### Phase 5：部署和测试（1周）

- 后端服务部署
- Docker容器化
- 完整流程测试

---

## 优势总结

### 安全性

✅ App Secret保存在后端（不暴露）
✅ 用户凭证保存在后端（加密存储）
✅ JWT认证（安全可靠）

### 用户体验

✅ 无需安装lark-cli
✅ 无需配置App ID/App Secret
✅ 只需登录Moraya账号
✅ Web/Tauri统一体验

### 维护性

✅ 后端统一管理飞书凭证
✅ lark-cli版本升级（后端更新）
✅ API接口统一

### 扩展性

✅ 支持多云平台（Notion/Git等）
✅ 支持企业飞书账号
✅ 支持个人飞书账号

---

## 部署方案

### 开发环境

```bash
# 后端服务
cd backend
npm install
npm run dev  # 端口3000

# 前端服务
cd frontend
npm run dev  # 端口15173
```

### 生产环境

```yaml
# docker-compose.yml

version: '3.8'

services:
  moraya-backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://...
      - JWT_SECRET=...
    volumes:
      - lark-cli-data:/root/.lark-cli
    
  moraya-web:
    build: ./frontend
    ports:
      - "15173:15173"
    environment:
      - BACKEND_URL=http://moraya-backend:3000
```

---

需要我开始实施Phase 1吗？先搭建后端基础架构。