# Web端飞书API使用指南（从零开始）

本指南将帮助您从零开始配置飞书开放平台，并在Moraya Web端使用飞书云文档功能。

## 目录

- [前置准备](#前置准备)
- [第一部分：飞书开放平台配置](#第一部分飞书开放平台配置)
- [第二部分：飞书应用创建与配置](#第二部分飞书应用创建与配置)
- [第三部分：权限配置](#第三部分权限配置)
- [第四部分：获取应用凭证](#第四部分获取应用凭证)
- [第五部分：Moraya Web端配置](#第五部分moraya-web端配置)
- [第六部分：OAuth认证流程](#第六部分oauth认证流程)
- [第七部分：常见问题](#第七部分常见问题)

---

## 前置准备

### 必需条件

1. **飞书账号**
   - 个人飞书账号或企业飞书账号
   - 企业账号需要有管理员权限（或申请权限）

2. **飞书开放平台访问权限**
   - 地址：https://open.feishu.cn
   - 需要飞书账号登录

3. **测试环境**
   - Moraya Web端已部署（http://localhost:15173/web）
   - 现代浏览器（Chrome、Firefox、Edge等）

### 推荐条件

- 飞书企业版账号（个人账号功能受限）
- 域名和服务器（用于生产环境部署）
- HTTPS证书（生产环境必需）

---

## 第一部分：飞书开放平台配置

### 1.1 访问飞书开放平台

打开浏览器，访问：
```
https://open.feishu.cn
```

点击右上角"登录"，使用飞书账号登录。

### 1.2 进入开发者后台

登录后，点击顶部导航"开发者后台"：
```
https://open.feishu.cn/app
```

### 1.3 创建企业自建应用

如果您是企业账号：

1. 点击"创建企业自建应用"
2. 填写应用信息：
   - **应用名称**：`Moraya云文档同步`
   - **应用描述**：`Moraya平台的飞书云文档同步工具`
   - **应用图标**：上传应用Logo（可选）

3. 点击"创建"按钮

### 1.4 创建个人测试应用

如果您是个人账号：

1. 点击"创建测试应用"
2. 填写应用名称：`Moraya测试`
3. 点击"创建"

**注意**：个人测试应用功能受限，仅支持基础文档操作。

---

## 第二部分：飞书应用创建与配置

### 2.1 应用基本信息配置

进入应用详情页，配置以下信息：

#### 2.1.1 应用凭证

**位置**：应用详情 → 凭证与基础信息

找到以下两个关键凭证：

1. **App ID**（应用ID）
   - 格式：`cli_xxxxxxxxxxxxxxxx`
   - 示例：`cli_a1b2c3d4e5f6g7h8`
   - **保存此值**（后面配置需要）

2. **App Secret**（应用密钥）
   - 格式：32位随机字符串
   - 示例：`aBc123XyZ789QwErTyUiOp`
   - 点击"查看"按钮获取
   - **保存此值**（后面配置需要）

#### 2.1.2 安全设置

**位置**：应用详情 → 安全设置

配置以下内容：

1. **重定向URL**（Redirect URI）
   - 添加以下URL：
   ```
   http://localhost:15173/web/lark/callback
   http://172.19.7.151:15173/web/lark/callback
   ```
   
   **生产环境**：
   ```
   https://your-domain.com/web/lark/callback
   ```

2. **可信域名**
   - 添加以下域名：
   ```
   localhost:15173
   172.19.7.151:15173
   ```
   
   **生产环境**：
   ```
   your-domain.com
   ```

### 2.2 应用发布配置

**位置**：应用详情 → 版本管理与发布

#### 2.2.1 创建应用版本

1. 点击"创建版本"
2. 填写版本信息：
   - **版本号**：`1.0.0`
   - **版本描述**：`初始版本，支持Markdown文档同步`
3. 点击"保存"

#### 2.2.2 申请发布

1. 点击"申请发布"
2. 等待管理员审批（企业账号）
   - 个人测试应用无需审批

---

## 第三部分：权限配置

### 3.1 添加应用能力

**位置**：应用详情 → 应用能力

添加以下能力：

#### 3.1.1 文档能力

点击"添加应用能力" → 选择"文档"：

**权限列表**：

1. **查看、评论、编辑和管理云空间中所有文件**
   - 权限标识：`drive:drive`
   - 用途：查看和管理云文档
   
2. **查看、评论、编辑和管理文档**
   - 权限标识：`docs:doc:readonly`
   - 用途：读取飞书文档
   
3. **编辑文档内容**
   - 权限标识：`docs:doc`
   - 用途：更新飞书文档

4. **查看、评论、导出和管理表格**
   - 权限标识：`sheets:sheet`
   - 用途：支持飞书表格（可选）

#### 3.1.2 Drive能力（可选）

点击"添加应用能力" → 选择"云空间"：

**权限列表**：

1. **查看云空间文件**
   - 权限标识：`drive:drive:readonly`
   - 用途：查看文件列表
   
2. **上传文件到云空间**
   - 权限标识：`drive:file:upload`
   - 用途：上传文档
   
3. **下载云空间文件**
   - 权限标识：`drive:file:download`
   - 用途：下载文档

### 3.2 权限范围配置

**位置**：应用详情 → 权限管理 → 权限配置

#### 3.2.1 配置可用范围

1. 选择"所有员工"
   - 或选择特定部门/人员
   
2. 点击"保存配置"

#### 3.2.2 申请权限

1. 点击"申请权限开通"
2. 填写申请理由：
   ```
   用于Moraya平台的Markdown文档同步功能，
   支持用户将本地文档同步到飞书云文档。
   ```
3. 等待管理员审批

---

## 第四部分：获取应用凭证

### 4.1 获取App ID

**位置**：应用详情 → 凭证与基础信息

找到"App ID"字段，复制完整值：

```
cli_a1b2c3d4e5f6g7h8
```

**保存方式**：
- 记录到文本文件
- 或保存到安全的地方

### 4.2 获取App Secret

**位置**：应用详情 → 凭证与基础信息

1. 找到"App Secret"字段
2. 点击"查看"按钮
3. 复制完整值：

```
aBc123XyZ789QwErTyUiOp1234567890
```

**注意**：
- App Secret仅在创建时显示一次
- 如果忘记，需要重置（会导致旧token失效）
- 请妥善保存

### 4.3 获取Folder Token（可选）

Folder Token是飞书文件夹的唯一标识，用于指定同步目录。

#### 4.3.1 获取方式

1. 打开飞书网页版：https://feishu.cn
2. 进入云文档或知识库
3. 选择目标文件夹
4. 复制URL中的Folder Token：

```
https://feishu.cn/drive/folder/fldcnAbCDefGhIjKlMnO
                      ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                      这部分就是Folder Token
```

示例：
```
fldcnAbCDefGhIjKlMnO
```

---

## 第五部分：Moraya Web端配置

### 5.1 启动Moraya Web端

```bash
cd /path/to/moraya

# 启动开发服务器
npm run dev

# 或使用指定端口
VITE_PORT=15173 npm run dev
```

访问地址：
```
http://localhost:15173/web
http://172.19.7.151:15173/web
```

### 5.2 进入设置页面

点击右上角"设置"按钮，进入：
```
http://localhost:15173/web/settings
```

### 5.3 配置飞书应用

在"云平台配置"区域，填写以下信息：

#### 5.3.1 飞书应用ID

```
输入框：飞书应用ID (App ID)
值：cli_a1b2c3d4e5f6g7h8
```

#### 5.3.2 飞书应用密钥

```
输入框：飞书应用密钥 (App Secret)
值：aBc123XyZ789QwErTyUiOp1234567890
```

#### 5.3.3 Folder Token（可选）

```
输入框：同步文件夹Token
值：fldcnAbCDefGhIjKlMnO
```

#### 5.3.4 同步模式

```
选择框：同步模式
选项：
  - Markdown：Markdown文档同步（推荐）
  - Docs：飞书文档同步
```

#### 5.3.5 自动同步（可选）

```
复选框：自动同步
值：勾选（可选）

输入框：同步间隔
值：60（分钟）
```

### 5.4 保存配置

点击"保存设置"按钮。

---

## 第六部分：OAuth认证流程

### 6.1 发起认证

在Moraya Web端：

1. 点击"飞书同步"按钮
2. 或在设置页面点击"测试认证"

### 6.2 OAuth流程详解

#### 步骤1：跳转到飞书授权页面

Moraya会弹出飞书授权窗口：
```
https://open.feishu.cn/open-apis/authen/v1/authorize
  ?app_id=cli_a1b2c3d4e5f6g7h8
  &redirect_uri=http://localhost:15173/web/lark/callback
```

#### 步骤2：用户登录飞书

在飞书授权页面：

1. 输入飞书账号密码
2. 点击"登录"
3. 选择授权范围（查看文档、编辑文档等）
4. 点击"授权"

#### 步骤3：回调处理

飞书授权成功后，会重定向到：
```
http://localhost:15173/web/lark/callback
  ?code=AbC123XyZ
  &state=xyz789
```

Moraya处理回调：

1. 获取`code`参数
2. 使用code换取access_token
3. 保存token到localStorage
4. 关闭授权窗口
5. 返回主页面

#### 步骤4：获取Access Token

Moraya调用飞书API：
```javascript
POST https://open.feishu.cn/open-apis/authen/v1/access_token
{
  "app_id": "cli_a1b2c3d4e5f6g7h8",
  "app_secret": "aBc123XyZ789...",
  "grant_type": "authorization_code",
  "code": "AbC123XyZ"
}
```

飞书返回：
```json
{
  "code": 0,
  "data": {
    "access_token": "u-AbC123XyZ...",
    "token_type": "Bearer",
    "expires_in": 7200,
    "refresh_token": "r-AbC123XyZ..."
  }
}
```

#### 步骤5：Token存储

Moraya保存token：
```javascript
localStorage.setItem('lark-access-token', 'u-AbC123XyZ...');
localStorage.setItem('lark-refresh-token', 'r-AbC123XyZ...');
localStorage.setItem('lark-token-expires', Date.now() + 7200000);
```

### 6.3 Token刷新

Token过期后（7200秒），自动刷新：
```javascript
POST https://open.feishu.cn/open-apis/authen/v1/refresh_access_token
{
  "app_id": "cli_a1b2c3d4e5f6g7h8",
  "app_secret": "aBc123XyZ789...",
  "grant_type": "refresh_token",
  "refresh_token": "r-AbC123XyZ..."
}
```

---

## 第七部分：常见问题

### 7.1 权限不足错误

**错误信息**：
```
Error: 权限不足，无法访问文档
```

**解决方案**：
1. 检查飞书开放平台权限配置
2. 确认已申请开通相关权限
3. 等待管理员审批

### 7.2 CORS跨域错误

**错误信息**：
```
Access to fetch at 'https://open.feishu.cn' from origin 'http://localhost:15173' 
has been blocked by CORS policy
```

**解决方案**：

#### 方案1：使用飞书官方域名

确保重定向URL和可信域名已配置正确。

#### 方案2：后端代理

搭建后端服务代理飞书API请求：
```
Moraya Web → Moraya Backend → 飞书API
```

#### 方案3：使用Tauri

Tauri应用无CORS限制，推荐使用。

### 7.3 Token过期

**错误信息**：
```
Error: Token已过期，请重新认证
```

**解决方案**：
1. 点击"重新认证"
2. 或等待自动刷新Token
3. 检查localStorage中的token是否正确

### 7.4 Folder Token无效

**错误信息**：
```
Error: Folder token无效或不存在
```

**解决方案**：
1. 确认Folder Token格式正确
2. 确认文件夹存在且有权限访问
3. 确认已添加相应权限

### 7.5 个人账号功能受限

**问题**：个人飞书账号无法创建企业应用。

**解决方案**：

#### 方案1：使用个人测试应用

创建测试应用，但功能受限。

#### 方案2：申请企业账号

联系飞书客服申请企业试用账号。

#### 方案3：使用Tauri + lark-cli

Tauri桌面应用支持个人账号，无需开放平台配置。

---

## 附录A：飞书开放平台API参考

### 文档API

#### 创建文档
```
POST https://open.feishu.cn/open-apis/docs/v1/documents
Headers: Authorization: Bearer {access_token}
Body: {
  "title": "文档标题",
  "content": "文档内容"
}
```

#### 读取文档
```
GET https://open.feishu.cn/open-apis/docs/v1/documents/{doc_token}/content
Headers: Authorization: Bearer {access_token}
```

#### 更新文档
```
PATCH https://open.feishu.cn/open-apis/docs/v1/documents/{doc_token}/content
Headers: Authorization: Bearer {access_token}
Body: {
  "content": "更新内容"
}
```

### Drive API

#### 列出文件
```
GET https://open.feishu.cn/open-apis/drive/v1/files?folder_token={folder_token}
Headers: Authorization: Bearer {access_token}
```

#### 上传文件
```
POST https://open.feishu.cn/open-apis/drive/v1/files/upload
Headers: Authorization: Bearer {access_token}
Body: multipart/form-data
```

---

## 附录B：环境变量配置

### 开发环境

创建`.env.local`文件：
```bash
# 飞书应用配置
VITE_LARK_APP_ID=cli_a1b2c3d4e5f6g7h8
VITE_LARK_APP_SECRET=aBc123XyZ789QwErTyUiOp1234567890
VITE_LARK_FOLDER_TOKEN=fldcnAbCDefGhIjKlMnO
```

### 生产环境

创建`.env.production`文件：
```bash
# 飞书应用配置（生产）
VITE_LARK_APP_ID=cli_production_app_id
VITE_LARK_APP_SECRET=production_app_secret
VITE_LARK_FOLDER_TOKEN=production_folder_token

# 重定向URL（生产）
VITE_LARK_REDIRECT_URI=https://your-domain.com/web/lark/callback
```

---

## 附录C：安全建议

### 1. 保护App Secret

- 不要将App Secret提交到Git仓库
- 不要在前端代码中硬编码
- 使用环境变量配置

### 2. HTTPS要求

生产环境必须使用HTTPS：
```
https://your-domain.com/web/lark/callback
```

### 3. Token安全

- Token存储在localStorage（仅限开发环境）
- 生产环境建议使用Session Storage
- 或通过后端服务管理Token

### 4. 权限最小化

只申请必需的权限：
- docs:doc（文档编辑）
- drive:file:upload（文件上传）

避免申请过多权限导致审批困难。

---

## 附录D：完整配置示例

### 飞书开放平台配置清单

```
App ID: cli_abc123xyz789
App Secret: ABC123xyz789SecretKey32Chars
重定向URL: http://localhost:15173/web/lark/callback
可信域名: localhost:15173

权限：
  ✓ docs:doc（文档编辑）
  ✓ docs:doc:readonly（文档读取）
  ✓ drive:file:upload（文件上传）
  ✓ drive:file:download（文件下载）
  ✓ drive:drive:readonly（查看文件列表）

Folder Token: fldcnFolderToken123
```

### Moraya Web端配置

```javascript
// src/lib/platform/web-storage.ts
localStorage.setItem('lark-app-id', 'cli_abc123xyz789');
localStorage.setItem('lark-app-secret', 'ABC123xyz789...');
localStorage.setItem('lark-folder-token', 'fldcnFolderToken123');
localStorage.setItem('lark-sync-mode', 'markdown');
localStorage.setItem('lark-auto-sync', 'true');
localStorage.setItem('lark-sync-interval', '60');
```

---

## 总结

通过本指南，您已完成：

1. ✅ 飞书开放平台账号注册
2. ✅ 飞书应用创建与配置
3. ✅ 权限申请与审批
4. ✅ App ID和App Secret获取
5. ✅ Moraya Web端配置
6. ✅ OAuth认证流程理解

现在您可以在Moraya Web端使用飞书云文档功能！

**下一步**：
- 测试文件同步功能
- 配置自动同步
- 探索飞书API其他功能

**技术支持**：
- 飞书开放平台文档：https://open.feishu.cn/document
- Moraya文档：docs/目录

---

**版本**：v1.0
**更新时间**：2024-05-11
**作者**：Moraya开发团队