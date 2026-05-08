# lark-cli 安装指南

本指南帮助用户安装并配置飞书官方CLI工具 lark-cli，用于Moraya的飞书云文档同步功能。

## 目录

- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [认证配置](#认证配置)
- [验证安装](#验证安装)
- [常见问题](#常见问题)

## 系统要求

- Node.js >= 18.0
- npm 或 yarn
- 飞书账号（企业版或个人版）

## 安装步骤

### 方式一：npm全局安装（推荐）

```bash
npm install -g @bytedance/lark-cli
```

安装完成后，lark-cli将自动添加到系统PATH，可在任意位置调用。

### 方式二：yarn全局安装

```bash
yarn global add @bytedance/lark-cli
```

### 方式三：npx临时运行（不推荐）

```bash
npx @bytedance/lark-cli auth login
```

**注意**：npx方式每次都会下载工具，速度较慢，不建议用于频繁同步。

## 认证配置

### Step 1：登录飞书

执行登录命令，选择需要同步的域：

```bash
# 文档同步（推荐）
lark-cli auth login --domain docs

# Drive同步
lark-cli auth login --domain drive

# Markdown同步
lark-cli auth login --domain markdown
```

登录流程：

1. CLI会输出一个URL链接
2. 复制链接到浏览器打开
3. 在飞书网页中确认授权
4. 回到CLI终端等待认证成功提示

### Step 2：验证认证状态

```bash
lark-cli auth status
```

如果输出显示 `Authenticated: true`，则认证成功。

## 验证安装

### 1. 检查CLI路径

找到lark-cli的可执行文件路径：

```bash
# Linux/macOS
which lark-cli

# Windows
where lark-cli
```

常见路径：
- Linux: `/usr/local/bin/lark-cli` 或 `/home/user/.npm-global/bin/lark-cli`
- macOS: `/usr/local/bin/lark-cli` 或 `/opt/homebrew/bin/lark-cli`
- Windows: `C:\Users\用户名\AppData\Roaming\npm\lark-cli.cmd`

### 2. 测试基本命令

```bash
lark-cli --version
lark-cli docs list --folder-token fld_xxx
lark-cli drive list --folder-token fld_xxx
```

### 3. 测试同步功能

创建测试文档：

```bash
echo "# Test Document\n\nThis is a test." > test.md

# 上传到飞书
lark-cli docs create --title "Test" --markdown-file test.md --folder-token fld_xxx

# 或使用Markdown模式
lark-cli markdown create --markdown-file test.md --folder-token fld_xxx
```

## 在Moraya中配置

### 1. 打开KB管理器

在Moraya侧边栏点击「知识库管理」按钮。

### 2. 选择KB并绑定飞书

- 点击KB旁边的飞书图标按钮
- 在绑定对话框中输入：
  - **lark-cli路径**：从验证步骤获取的路径
  - **飞书文件夹Token**：从飞书文件夹URL获取
  - **同步模式**：
    - `markdown`：纯Markdown同步（推荐）
    - `docs`：飞书文档格式转换
    - `drive`：Drive文件同步

### 3. 获取文件夹Token

飞书文件夹Token可以从URL获取：

```
https://feishu.cn/drive/folder/fldcnXXXXXX
                       ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                       这部分是folder-token
```

提取规则：
- 如果URL是 `https://feishu.cn/drive/folder/fldcnABC123`
- 则 folderToken 是 `fldcnABC123`

### 4. 测试认证

点击「测试认证」按钮，确认Moraya能够调用lark-cli。

### 5. 选择同步策略

- **上传到飞书**：将本地KB文件上传，适合首次绑定
- **从飞书下载**：将飞书文件下载到本地，适合恢复备份
- **仅绑定**：先完成绑定，稍后手动同步

### 6. 完成绑定

确认策略后点击「开始同步」，等待同步完成。

## 同步模式说明

### Markdown模式（推荐）

- 纯Markdown文件双向同步
- 保留原始格式和内容
- 适合技术文档和笔记
- **命令**：`lark-cli markdown create/fetch/overwrite`

### Docs模式

- 飞书富文本文档格式
- 自动转换Markdown为飞书格式
- 支持表格、图片、格式化
- **命令**：`lark-cli docs create/fetch/update`

### Drive模式

- Drive文件存储
- 不做格式转换，保持原样
- 适合二进制文件或特殊格式
- **命令**：`lark-cli drive upload/download/list`

## 命令参考

### 认证

```bash
lark-cli auth login [--domain docs|drive|markdown]
lark-cli auth status
lark-cli auth logout
```

### 文档操作

```bash
lark-cli docs create --title "标题" --markdown-file file.md --folder-token fld_xxx
lark-cli docs fetch --doc-token doc_xxx --output file.md
lark-cli docs update --doc-token doc_xxx --markdown-file file.md
lark-cli docs search --query "关键词"
```

### Markdown操作

```bash
lark-cli markdown create --markdown-file file.md --folder-token fld_xxx
lark-cli markdown fetch --file-token doc_xxx
lark-cli markdown overwrite --file-token doc_xxx --markdown-file file.md
```

### Drive操作

```bash
lark-cli drive list --folder-token fld_xxx
lark-cli drive upload --file-path local.md --folder-token fld_xxx
lark-cli drive download --file-token file_xxx --output-path local.md
```

### Wiki操作

```bash
lark-cli wiki list --wiki-token wiki_xxx
lark-cli wiki create-node --wiki-token wiki_xxx --title "节点标题"
```

## 常见问题

### 1. lark-cli not found

**问题**：Moraya提示找不到lark-cli。

**解决**：
1. 检查安装路径是否正确
2. 确认PATH环境变量包含lark-cli路径
3. 在Moraya绑定对话框中手动输入完整路径

### 2. 认证失败

**问题**：认证测试失败。

**解决**：
1. 确认已在终端执行 `lark-cli auth login`
2. 检查飞书账号权限
3. 尝试重新登录：`lark-cli auth logout && lark-cli auth login`

### 3. folder-token无效

**问题**：上传/下载时报错 folder_token invalid。

**解决**：
1. 确认folder-token格式正确（以 `fldcn` 开头）
2. 确认飞书账号有该文件夹的访问权限
3. 尝试在浏览器中打开URL确认文件夹存在

### 4. 同步失败

**问题**：同步时报错 `sync failed`。

**解决**：
1. 检查文件路径是否正确
2. 确认文件是有效的Markdown格式
3. 尝试手动执行命令验证：`lark-cli docs create ...`
4. 查看详细错误信息：`lark-cli docs create --verbose ...`

### 5. Node.js版本过低

**问题**：安装时提示Node.js版本不满足。

**解决**：
1. 升级Node.js到18+：`node --version`
2. 使用nvm管理Node版本：
   ```bash
   nvm install 18
   nvm use 18
   npm install -g @bytedance/lark-cli
   ```

### 6. Windows路径问题

**问题**：Windows下路径格式不正确。

**解决**：
1. 使用完整路径：`C:\Users\用户名\AppData\Roaming\npm\lark-cli.cmd`
2. 或使用PowerShell路径：`$env:APPDATA\npm\lark-cli.cmd`
3. 确保路径中有 `.cmd` 扩展名

### 7. 企业版飞书域

**问题**：使用企业版飞书，域地址不同。

**解决**：
1. 企业版飞书域名通常是 `https://企业名.feishu.cn`
2. 登录时使用企业域：在浏览器打开企业飞书地址
3. CLI认证会自动适配企业域

## 高级配置

### 自定义同步间隔

在Moraya绑定对话框中：
- 启用「自动同步」
- 设置「同步间隔」（秒）
- 推荐值：60-300秒（1-5分钟）

### 多KB同步

可以为多个KB分别绑定不同的飞书文件夹：

1. KB1 → 飞书文件夹A（folderToken: fldcnAAA）
2. KB2 → 飞书文件夹B（folderToken: fldcnBBB）
3. KB3 → 飞书文件夹C（folderToken: fldcnCCC）

### CLI配置文件

lark-cli配置存储在：

- Linux/macOS: `~/.config/lark-cli/`
- Windows: `%APPDATA%\lark-cli\`

配置文件：
- `config.json`：认证token和域设置
- `cache.json`：文件缓存

### 环境变量

可以通过环境变量配置CLI：

```bash
export LARK_CLI_CONFIG_DIR=/custom/path
export LARK_CLI_CACHE_DIR=/custom/cache
export LARK_CLI_LOG_LEVEL=debug
```

## 安全建议

1. **Token保密**：folder-token和doc-token是敏感信息，不要公开分享
2. **定期重新认证**：建议每月重新登录一次，确保token有效
3. **权限管理**：确认飞书账号有最小必要权限
4. **日志检查**：定期检查同步日志，确认无异常操作

## 参考链接

- [lark-cli官方仓库](https://github.com/bytedance/lark-cli)
- [飞书开放平台文档](https://open.feishu.cn/document/)
- [Moraya GitHub](https://github.com/your-org/moraya)

## 更新日志

### v1.0.0（2025-01）
- 完成lark-cli集成
- 支持docs/markdown/drive三种模式
- 实现KB绑定流程UI
- 完成首次同步引导

---

如有问题，请在GitHub提交issue或查看Moraya文档。