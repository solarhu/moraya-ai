# 前端API集成指南

## 概述

前端现在通过HTTP API调用后端服务，而不是直接调用lark-cli。

## 文件结构

```
src/lib/api/
├── http-client.ts    # HTTP请求客户端
├── auth.ts           # 用户认证API
├── cloud.ts          # 飞书云平台API  
└── index.ts          # 导出汇总
```

## 使用方式

### 1. 配置环境变量

在`.env.local`中配置后端地址:

```bash
VITE_API_URL=http://localhost:3000
```

### 2. 用户认证

```typescript
import { authApi } from '$lib/api';

// 注册
const result = await authApi.register('user@example.com', 'password');
if (result.success) {
  console.log('Token:', result.data.token);
}

// 登录
const result = await authApi.login('user@example.com', 'password');

// 检查登录状态
if (authApi.isLoggedIn()) {
  const user = await authApi.me();
}

// 登出
authApi.logout();
```

### 3. 飞书云平台

```typescript
import { cloudApi } from '$lib/api';

// 获取状态
const status = await cloudApi.getStatus();

// 启动认证
const auth = await cloudApi.startLarkAuth();
if (auth.data.loginUrl) {
  window.open(auth.data.loginUrl);
}

// 创建文档
const doc = await cloudApi.createDocument('标题', '内容');

// 获取文档
const doc = await cloudApi.fetchDocument('doc_token');

// 更新文档
await cloudApi.updateDocument('doc_token', '新内容');

// 删除文档
await cloudApi.deleteDocument('doc_token');
```

## API端点映射

| 前端方法 | 后端端点 |
|---------|---------|
| authApi.register() | POST /api/auth/register |
| authApi.login() | POST /api/auth/login |
| authApi.me() | GET /api/auth/me |
| cloudApi.getStatus() | GET /api/cloud/status |
| cloudApi.startLarkAuth() | POST /api/cloud/lark/auth |
| cloudApi.createDocument() | POST /api/cloud/lark/documents |
| cloudApi.fetchDocument() | GET /api/cloud/lark/documents/:token |
| cloudApi.updateDocument() | PUT /api/cloud/lark/documents/:token |
| cloudApi.deleteDocument() | DELETE /api/cloud/lark/documents/:token |

## Token存储

Token自动存储在localStorage:

- 存储: `localStorage.setItem('moraya_token', token)`
- 读取: `localStorage.getItem('moraya_token')`
- 清除: `localStorage.removeItem('moraya_token')`

## 错误处理

所有API返回统一格式:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
```

## 启动流程

1. 启动后端: `cd backend && npm run dev`
2. 启动前端: `npm run dev`
3. 打开 http://localhost:15173