# Moraya Web端设计方案

## 目标

开发Moraya的Web端版本，实现在浏览器中运行的Markdown AI编辑器，无需安装桌面应用。

## 架构设计

### 平台适配层

创建平台抽象层，统一桌面端（Tauri）和Web端（Browser）的API调用：

```
src/lib/platform/
├── platform-detector.ts       # 平台检测
├── tauri-adapter.ts           # Tauri API实现
├── web-adapter.ts             # Web API实现
├── index.ts                   # 统一导出
```

### 核心功能对比

| 功能 | Tauri实现 | Web实现 |
|------|-----------|---------|
| **文件系统** | `@tauri-apps/plugin-fs` | IndexedDB + File API |
| **文件对话框** | `@tauri-apps/plugin-dialog` | `<input type="file">` + `<a download>` |
| **HTTP请求** | `@tauri-apps/plugin-http` | `fetch()` + CORS代理 |
| **事件监听** | `@tauri-apps/api/event` | CustomEvent |
| **窗口管理** | `@tauri-apps/api/window` | Browser API |
| **系统路径** | `@tauri-apps/api/path` | 虚拟路径 |
| **Rust命令** | `invoke()` | HTTP API |
| **系统存储** | `@tauri-apps/plugin-store` | localStorage + IndexedDB |

### Web端特性

#### 优点

- 无需安装，浏览器直接访问
- 跨平台（任何现代浏览器）
- 易于分享和协作
- 支持移动端（响应式设计）

#### 限制

- 无法访问本地文件系统（需用户选择）
- API Key暴露风险（需后端代理或用户手动输入）
- 无法调用系统命令（lark-cli等）
- 存储容量限制（IndexedDB约50MB）

## 实现方案

### Phase 1: 平台抽象层（2天）

#### 1.1 平台检测

```typescript
// src/lib/platform/platform-detector.ts
export type Platform = 'tauri' | 'web';

export function detectPlatform(): Platform {
  // 检测是否在Tauri环境
  if (window.__TAURI__) {
    return 'tauri';
  }
  return 'web';
}

export const platform = detectPlatform();
```

#### 1.2 文件系统适配

**Tauri实现**（已有）:
```typescript
// 使用 @tauri-apps/plugin-fs
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
```

**Web实现**（新增）:
```typescript
// src/lib/platform/web-adapter.ts
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'moraya-web';
const STORE_NAME = 'files';

class WebFileSystem {
  private db: IDBPDatabase;
  
  async init() {
    this.db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  
  // 读取文件（从IndexedDB或用户选择）
  async readFile(path: string): Promise<string> {
    // 尝试从IndexedDB读取
    const content = await this.db.get(STORE_NAME, path);
    if (content) return content;
    
    // 提示用户选择文件
    const file = await this.pickFile();
    return await file.text();
  }
  
  // 写入文件（保存到IndexedDB）
  async writeFile(path: string, content: string): Promise<void> {
    await this.db.put(STORE_NAME, content, path);
  }
  
  // 选择文件（浏览器File API）
  async pickFile(): Promise<File> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown,.txt';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files[0];
        resolve(file);
      };
      input.click();
    });
  }
  
  // 下载文件（浏览器download API）
  async downloadFile(path: string, content: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

#### 1.3 对话框适配

**Web实现**:
```typescript
// src/lib/platform/web-adapter.ts
class WebDialog {
  // 打开文件选择对话框
  async openFile(): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files[0];
        if (file) {
          const content = await file.text();
          // 保存到IndexedDB
          await fileSystem.writeFile(file.name, content);
          resolve(file.name);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }
  
  // 保存文件对话框
  async saveFile(defaultName: string): Promise<string | null> {
    // Web端无法真正"保存到本地"
    // 只能下载文件
    return defaultName;
  }
  
  // 确认对话框
  async confirm(message: string): Promise<boolean> {
    return window.confirm(message);
  }
}
```

#### 1.4 HTTP请求适配

**Web实现**:
```typescript
// src/lib/platform/web-adapter.ts
class WebHTTP {
  // fetch with CORS proxy (if needed)
  async fetch(url: string, options: RequestInit): Promise<Response> {
    // 直接使用fetch（可能需要CORS代理）
    const response = await fetch(url, options);
    return response;
  }
  
  // 或使用CORS代理
  async fetchWithProxy(url: string, options: RequestInit): Promise<Response> {
    const proxyUrl = 'https://cors-proxy.example.com/';
    const response = await fetch(proxyUrl + url, options);
    return response;
  }
}
```

#### 1.5 存储适配

**Web实现**:
```typescript
// src/lib/platform/web-adapter.ts
class WebStorage {
  // 设置存储
  async set(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  // 获取存储
  async get(key: string): Promise<any> {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }
  
  // 删除存储
  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}
```

### Phase 2: 核心功能迁移（3天）

#### 2.1 编辑器迁移

编辑器核心（ProseMirror/Milkdown）已经是纯前端，无需修改。

**改动**:
- 移除Tauri特定的事件监听
- 移除系统路径API
- 使用Web适配器的文件操作

#### 2.2 AI功能迁移

**问题**: API Key暴露风险

**解决方案**:

方案A（推荐）: 用户手动输入API Key
- 设置页面输入API Key
- 存储在localStorage（用户自行保管）
- 直接在前端调用AI API

方案B: 后端代理服务
- 部署代理服务器
- API Key存储在服务器
- 前端通过代理调用（安全）

方案C: 仅支持本地模型
- 部署Ollama服务
- 通过HTTP调用本地模型
- 无需API Key

**实现**（方案A）:
```typescript
// Web端AI服务
class WebAIService {
  async chat(messages: Message[]): Promise<string> {
    const apiKey = await storage.get('ai-api-key');
    const provider = await storage.get('ai-provider');
    
    // 直接调用AI API
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
      }),
    });
    
    return await response.json();
  }
}
```

#### 2.3 MCP功能迁移

**限制**: Web端无法运行stdio MCP服务器

**解决方案**:

方案A: 仅支持HTTP MCP服务器
- 保留HTTP传输的MCP服务器
- 移除stdio传输支持

方案B: 提供预配置MCP服务列表
- 用户选择预配置的MCP服务
- 无需本地运行

**实现**（方案A）:
```typescript
// Web端MCP适配
class WebMCPAdapter {
  // 仅支持HTTP传输
  async connectToServer(config: MCPConfig): Promise<void> {
    if (config.transport !== 'http') {
      throw new Error('Web端仅支持HTTP传输的MCP服务器');
    }
    
    // 使用fetch连接HTTP MCP服务器
    const response = await fetch(config.url, {
      method: 'POST',
      body: JSON.stringify(config),
    });
    
    // 处理响应...
  }
}
```

#### 2.4 飞书同步迁移

**限制**: Web端无法调用lark-cli命令

**解决方案**: 使用飞书官方HTTP API

```typescript
// Web端飞书同步（使用HTTP API）
class WebLarkSync {
  async authenticate(appId: string, appSecret: string): Promise<void> {
    // 获取access_token
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    
    const { app_access_token } = await response.json();
    await storage.set('lark-token', app_access_token);
  }
  
  async uploadFile(file: File): Promise<void> {
    const token = await storage.get('lark-token');
    const formData = new FormData();
    formData.append('file', file);
    
    await fetch('https://open.feishu.cn/open-apis/drive/v1/files/upload_all', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
  }
}
```

### Phase 3: UI适配（1天）

#### 3.1 响应式设计

```typescript
// 移动端适配
// src/lib/styles/mobile.css
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: fixed;
    z-index: 100;
  }
  
  .editor-container {
    padding: 0;
  }
}
```

#### 3.2 触摸优化

```typescript
// 触摸事件处理
// src/lib/editor/touch-events.ts
export function handleTouchEvents(editor: EditorView) {
  // 长按显示上下文菜单
  // 双指缩放调整字体大小
  // 单指滑动选择文本
}
```

#### 3.3 文件管理UI

```svelte
<!-- Web端文件选择器 -->
<div class="web-file-picker">
  <button onclick={() => pickFile()}>
    选择文件
  </button>
  <button onclick={() => downloadFile()">
    下载文件
  </button>
</div>
```

### Phase 4: 部署和优化（1天）

#### 4.1 构建配置

```javascript
// svelte.config.js（Web适配器）
import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    adapter: adapter({
      fallback: 'index.html',
      pages: 'build-web', // Web端构建目录
    }),
  },
};
```

#### 4.2 部署方案

**静态部署**:
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

**构建命令**:
```bash
# 构建Web端
pnpm build-web

# 或使用环境变量区分
export BUILD_TARGET=web
pnpm build
```

#### 4.3 性能优化

- **代码分割**: 按功能模块分割
- **懒加载**: Mermaid/KaTeX按需加载
- **缓存**: Service Worker缓存静态资源
- **压缩**: Gzip/Brotli压缩

## 文件清单

### 新增文件

```
src/lib/platform/
├── platform-detector.ts       # 平台检测
├── tauri-adapter.ts           # Tauri API封装
├── web-adapter.ts             # Web API封装
├── types.ts                   # 类型定义
└── index.ts                   # 统一导出

src/lib/adapters/
├── web-file-system.ts         # Web文件系统（IndexedDB）
├── web-dialog.ts              # Web对话框
├── web-http.ts                # Web HTTP请求
├── web-storage.ts             # Web存储
├── web-lark-sync.ts           # Web飞书同步（HTTP API）
└── web-ai-service.ts          # Web AI服务

src/lib/styles/
├── mobile.css                 # 移动端样式
├── web.css                    # Web端特定样式

src/routes/web/
├── +page.svelte               # Web端主页
└── +layout.svelte             # Web端布局

static/
├── sw.js                      # Service Worker
└── manifest.json              # PWA manifest

docs/
├── web-version-guide.md       # Web端使用指南
```

### 修改文件

```
src/routes/+page.svelte        # 条件导入平台适配器
src/lib/editor/Editor.svelte   # 移除Tauri硬编码
src/lib/services/file-service.ts # 添加平台检测
svelte.config.js               # Web构建配置
package.json                   # 添加Web构建命令
```

## 测试计划

### 单元测试

```typescript
// src/lib/platform/platform-detector.test.ts
describe('Platform Detector', () => {
  test('should detect web platform', () => {
    // Mock window.__TAURI__ = undefined
    expect(detectPlatform()).toBe('web');
  });
  
  test('should detect tauri platform', () => {
    // Mock window.__TAURI__ = {}
    expect(detectPlatform()).toBe('tauri');
  });
});

// src/lib/adapters/web-file-system.test.ts
describe('Web File System', () => {
  test('should write and read file from IndexedDB', async () => {
    const fs = new WebFileSystem();
    await fs.writeFile('test.md', 'Hello');
    const content = await fs.readFile('test.md');
    expect(content).toBe('Hello');
  });
});
```

### 集成测试

- 测试Web端在Chrome/Firefox/Safari运行
- 测试IndexedDB存储和读取
- 测试文件选择和下载
- 测试AI API调用（需要API Key）
- 测试移动端响应式布局

## 工作量估算

| Phase | 任务 | 时间 |
|-------|------|------|
| Phase 1 | 平台抽象层 | 2天 |
| Phase 2 | 核心功能迁移 | 3天 |
| Phase 3 | UI适配 | 1天 |
| Phase 4 | 部署和优化 | 1天 |
| **总计** | | **7天** |

## 下一步行动

1. 创建平台检测模块
2. 实现Web文件系统适配器
3. 实现Web对话框适配器
4. 创建Web端路由和布局
5. 测试和部署

## 技术栈

- **前端框架**: SvelteKit（已有）
- **构建工具**: Vite（已有）
- **存储**: IndexedDB（idb库）
- **部署**: Vercel/GitHub Pages
- **PWA**: Service Worker + manifest.json

## 参考资源

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Guide](https://web.dev/progressive-web-apps/)