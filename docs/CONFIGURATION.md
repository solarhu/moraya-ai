# Moraya 配置说明

## 开发环境配置

### 端口配置

Moraya 开发服务器默认端口为 `15173`（支持外网访问）。

**配置方式**：

1. **环境变量方式**（推荐）：
   ```bash
   # 临时修改
   VITE_PORT=5173 npm run dev
   
   # 永久修改：创建 .env.local 文件
   echo "VITE_PORT=5173" > .env.local
   npm run dev
   ```

2. **直接修改默认值**：
   编辑 `vite.config.ts`：
   ```ts
   port: parseInt(process.env.VITE_PORT || '5173')
   ```

### 端口说明

| 端口 | 用途 | 说明 |
|------|------|------|
| 15173 | 开发服务器 | 默认端口，支持外网访问（0.0.0.0） |
| 15174 | HMR WebSocket | 开发服务器端口+1 |
| 1420 | Tauri开发 | Tauri框架默认端口 |

### 常用端口配置

**本地开发（默认）**：
```bash
npm run dev  # 使用 15173
```

**标准Vite端口**：
```bash
VITE_PORT=5173 npm run dev
```

**自定义端口**：
```bash
VITE_PORT=3000 npm run dev
```

### 外网访问配置

开发服务器默认监听 `0.0.0.0`，支持外网访问：

```bash
# 查看网络IP
ip addr show | grep "inet "

# 其他设备访问
http://YOUR_IP:15173/web
```

### Host配置

通过 `TAURI_DEV_HOST` 环境变量配置：

```bash
TAURI_DEV_HOST=192.168.1.100 npm run dev
```

## 环境变量文件

### .env.example

项目提供 `.env.example` 作为配置示例：

```bash
# 复制并修改
cp .env.example .env.local

# 编辑配置
vim .env.local
```

### 支持的环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| VITE_PORT | 开发服务器端口 | 15173 |
| TAURI_DEV_HOST | 开发服务器Host | 0.0.0.0 |

## 生产环境配置

### 构建配置

生产环境构建使用固定配置：

```bash
npm run build
```

构建产物在 `.svelte-kit/output/` 目录。

### 部署配置

部署时可通过环境变量配置：

```bash
# Docker部署
docker run -p 80:3000 -e PORT=3000 moraya-app

# Node.js部署
PORT=3000 node server.js
```

## 配置最佳实践

1. **开发环境**：使用 `.env.local` 配置个人偏好
2. **团队协作**：`.env.example` 说明必需配置
3. **生产部署**：通过环境变量或配置文件
4. **CI/CD**：在构建脚本中设置环境变量

## 相关文件

- `vite.config.ts` - Vite配置
- `.env.example` - 环境变量示例
- `.gitignore` - 忽略 `.env.local`
- `src-tauri/tauri.conf.json` - Tauri配置（端口1420）