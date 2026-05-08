# Moraya 安装指南

本文档介绍如何安装 Moraya 应用程序。

## 目录

- [安装方式](#安装方式)
- [系统要求](#系统要求)
- [下载安装包](#下载安装包)
- [平台安装步骤](#平台安装步骤)
- [首次运行](#首次运行)
- [卸载](#卸载)
- [常见问题](#常见问题)

## 安装方式

Moraya 提供多种安装方式：

1. **预编译安装包**（推荐）- 从GitHub Releases下载
2. **从源码构建** - 适合开发者，参考 [BUILD.md](./BUILD.md)
3. **便携版**（Windows）- 无需安装，解压即用

## 系统要求

### 最低要求

| 平台 | 操作系统 | 内存 | 存储空间 |
|------|---------|------|----------|
| **Linux** | Ubuntu 20.04+ / Debian 11+ / Fedora 36+ | 2GB | 50MB |
| **macOS** | macOS 11.0 (Big Sur) + | 2GB | 30MB |
| **Windows** | Windows 10 1903+ / Windows 11 | 2GB | 20MB |

### 推荐配置

| 平台 | 操作系统 | 内存 | 存储空间 |
|------|---------|------|----------|
| **Linux** | Ubuntu 22.04 LTS | 4GB | 100MB |
| **macOS** | macOS 13.0+ (Ventura) | 4GB | 50MB |
| **Windows** | Windows 11 | 4GB | 50MB |

### 依赖要求

#### Linux

- **GTK 3**: 已预装在大多数发行版
- **WebKit2GTK**: 现代浏览器引擎
- **glib2**: 系统库

#### macOS

- **WebView**: macOS内置（基于WebKit）
- **无额外依赖**

#### Windows

- **WebView2**: Windows 10/11已预装，Windows 10旧版本需手动安装

## 下载安装包

### GitHub Releases

访问 [Moraya Releases](https://github.com/zouwei/moraya/releases) 页面：

- **Linux**: 
  - `moraya_x.x.x_amd64.deb`（推荐，适用于Ubuntu/Debian）
  - `moraya_x.x.x_amd64.AppImage`（通用，适用于所有发行版）
  - `moraya_x.x.x_x86_64.rpm`（适用于Fedora/RHEL）

- **macOS**:
  - `moraya_x.x.x_x64.dmg`（Intel Mac）
  - `moraya_x.x.x_aarch64.dmg`（Apple Silicon: M1/M2/M3）

- **Windows**:
  - `moraya_x.x.x_x64-setup.exe`（推荐，NSIS安装包）
  - `moraya_x.x.x_x64.msi`（MSI安装包）
  - `moraya_x.x.x_x64_portable.zip`（便携版，解压即用）

### 国内镜像

如GitHub下载速度慢，可使用Gitee镜像：

- [Gitee Releases](https://gitee.com/solarhu/moraya/releases)

### 版本选择建议

- **稳定版**：推荐生产使用（Latest Release）
- **开发版**：尝鲜新功能（Pre-release）
- **特定版本**：需特定功能或修复

## 平台安装步骤

### Linux

#### 方式1：DEB包（Ubuntu/Debian）

```bash
# 下载安装包
wget https://github.com/zouwei/moraya/releases/download/v0.40.0/moraya_0.40.0_amd64.deb

# 安装
sudo dpkg -i moraya_0.40.0_amd64.deb

# 如有依赖问题，修复依赖
sudo apt install -f

# 运行
moraya
```

#### 方式2：AppImage（通用）

```bash
# 下载AppImage
wget https://github.com/zouwei/moraya/releases/download/v0.40.0/moraya_0.40.0_amd64.AppImage

# 添加执行权限
chmod +x moraya_0.40.0_amd64.AppImage

# 运行（无需安装）
./moraya_0.40.0_amd64.AppImage

# 如需系统集成（可选）
# 安装到 /opt
sudo mv moraya_0.40.0_amd64.AppImage /opt/moraya.AppImage
sudo ln -s /opt/moraya.AppImage /usr/local/bin/moraya
```

#### 方式3：RPM包（Fedora/RHEL）

```bash
# 下载RPM包
wget https://github.com/zouwei/moraya/releases/download/v0.40.0/moraya_0.40.0_x86_64.rpm

# 安装（Fedora）
sudo dnf install moraya_0.40.0_x86_64.rpm

# 安装（RHEL/CentOS）
sudo yum localinstall moraya_0.40.0_x86_64.rpm

# 运行
moraya
```

#### Linux桌面集成（可选）

```bash
# 创建桌面图标
cat > ~/.local/share/applications/moraya.desktop <<EOF
[Desktop Entry]
Version=1.0
Name=Moraya
Comment=Minimal Markdown AI Agent Editor
Exec=/opt/moraya.AppImage
Icon=moraya
Terminal=false
Type=Application
Categories=Development;TextEditor;
EOF

# 复制图标（如已下载）
sudo cp moraya-icon.png /usr/share/icons/hicolor/256x256/apps/moraya.png
```

### macOS

#### 方式1：DMG安装包（推荐）

1. 下载DMG文件：
   - Intel Mac: `moraya_0.40.0_x64.dmg`
   - Apple Silicon: `moraya_0.40.0_aarch64.dmg`

2. 打开DMG文件：
   ```bash
   open moraya_0.40.0_x64.dmg
   # 或双击DMG文件
   ```

3. 拖动到Applications文件夹：
   - 将 `Moraya.app` 拖到 `Applications` 文件夹

4. 运行：
   ```bash
   open /Applications/Moraya.app
   # 或在Finder中双击Moraya.app
   ```

#### 方式2：Homebrew Cask（未来支持）

```bash
# 安装（待官方支持）
brew install --cask moraya

# 运行
moraya
```

#### macOS权限设置

首次运行可能需要授权：

1. **打开应用**：
   - 如提示"无法打开，因为它来自身份不明的开发者"
   - 系统偏好设置 → 安全性与隐私 → 通用 → 点击"仍要打开"

2. **文件访问权限**：
   - 首次打开文件时，系统会请求文件访问权限
   - 点击"允许"

3. **网络权限**：
   - 如需AI功能，允许网络访问

### Windows

#### 方式1：NSIS安装包（推荐）

1. 下载安装包：
   ```
   moraya_0.40.0_x64-setup.exe
   ```

2. 运行安装程序：
   - 双击 `moraya_0.40.0_x64-setup.exe`
   - 或命令行：`start moraya_0.40.0_x64-setup.exe`

3. 安装向导：
   - 选择安装路径（默认：`C:\Program Files\Moraya`）
   - 选择组件（默认全部）
   - 点击"安装"

4. 运行：
   - 桌面快捷方式：双击 `Moraya` 图标
   - 开始菜单：开始菜单 → Moraya → Moraya
   - 命令行：
     ```cmd
     "C:\Program Files\Moraya\Moraya.exe"
     ```

#### 方式2：MSI安装包

```cmd
# 使用管理员权限
msiexec /i moraya_0.40.0_x64.msi

# 或指定安装路径
msiexec /i moraya_0.40.0_x64.msi INSTALLDIR="D:\Moraya"
```

#### 方式3：便携版

1. 下载便携版：
   ```
   moraya_0.40.0_x64_portable.zip
   ```

2. 解压：
   ```cmd
   # 解压到任意目录
   unzip moraya_0.40.0_x64_portable.zip -d C:\Tools\Moraya
   ```

3. 运行：
   ```cmd
   C:\Tools\Moraya\Moraya.exe
   ```

4. 创建快捷方式（可选）：
   - 右键点击 `Moraya.exe` → 创建快捷方式
   - 将快捷方式拖到桌面

#### Windows权限设置

1. **SmartScreen警告**：
   - 如提示"Windows已保护你的电脑"
   - 点击"更多信息" → "仍要运行"

2. **防火墙**：
   - 首次运行可能请求防火墙权限
   - 允许访问（AI功能需要）

## 首次运行

### 启动应用

#### Linux

```bash
# DEB/RPM安装
moraya

# AppImage
./moraya_0.40.0_amd64.AppImage
```

#### macOS

```bash
# Applications安装
open /Applications/Moraya.app

# 或在Finder中双击
```

#### Windows

```cmd
# NSIS/MSI安装
# 桌面快捷方式或开始菜单

# 便携版
C:\Tools\Moraya\Moraya.exe
```

### 首次配置

#### 1. 选择工作目录

首次启动时，Moraya会请求选择默认工作目录：

- **推荐**: 选择一个专门用于Markdown文件的目录
- **示例**: 
  - Linux: `/home/user/Documents/Markdown`
  - macOS: `/Users/user/Documents/Markdown`
  - Windows: `C:\Users\user\Documents\Markdown`

#### 2. AI配置（可选）

如需使用AI功能，配置AI Provider：

- 打开设置（`Ctrl+,` 或 `Cmd+,`）
- AI设置 → 选择Provider（Claude, OpenAI, Gemini等）
- 输入API Key
- 测试连接

#### 3. MCP配置（可选）

如需使用MCP（Model Context Protocol）：

- 打开设置 → MCP设置
- 添加MCP容器
- 配置MCP服务器

### 快速开始

1. **创建第一个文档**：
   - 侧边栏 → 右键 → 新建文件
   - 输入文件名（如 `README.md`）
   - 开始编写

2. **使用AI助手**：
   - 点击右侧AI面板图标
   - 选择AI模板或直接对话
   - 插入AI生成的内容

3. **导出文档**：
   - 文件 → 导出 → PDF/HTML/Word

## 卸载

### Linux

#### DEB包卸载

```bash
sudo dpkg --remove moraya

# 或完全卸载（包括配置）
sudo dpkg --purge moraya
```

#### AppImage卸载

```bash
# 删除文件
rm moraya_0.40.0_amd64.AppImage

# 如已安装到/opt
sudo rm /opt/moraya.AppImage
sudo rm /usr/local/bin/moraya

# 删除桌面图标
rm ~/.local/share/applications/moraya.desktop
```

#### RPM包卸载

```bash
sudo dnf remove moraya
# 或
sudo yum remove moraya
```

### macOS

```bash
# 删除应用
rm -rf /Applications/Moraya.app

# 删除配置（可选）
rm -rf ~/Library/Application Support/Moraya
rm -rf ~/Library/Preferences/com.moraya.app.plist
rm -rf ~/Library/Caches/Moraya

# 删除用户数据（可选）
rm -rf ~/.config/moraya
```

### Windows

#### NSIS卸载

- 运行卸载程序：
  - 开始菜单 → Moraya → Uninstall Moraya
  - 或：`C:\Program Files\Moraya\uninstall.exe`

- 或使用控制面板：
  - 控制面板 → 程序 → 程序和功能 → Moraya → 卸载

#### MSI卸载

```cmd
msiexec /x moraya_0.40.0_x64.msi
```

#### 便携版卸载

```cmd
# 删除目录
rmdir /S /Q C:\Tools\Moraya

# 删除快捷方式
del "%USERPROFILE%\Desktop\Moraya.lnk"
```

## 常见问题

### 1. Linux缺少依赖

**问题**: `error while loading shared libraries: libwebkit2gtk-4.1.so.0`

**解决**:
```bash
# Ubuntu/Debian
sudo apt install -y libwebkit2gtk-4.1-dev

# Fedora
sudo dnf install -y webkit2gtk4.1-devel
```

### 2. macOS无法打开

**问题**: "无法打开，因为它来自身份不明的开发者"

**解决**:
```bash
# 方法1：右键打开
# 右键点击Moraya.app → 打开 → 打开

# 方法2：系统设置
# 系统偏好设置 → 安全性与隐私 → 通用 → 点击"仍要打开"

# 方法3：命令行授权
xattr -cr /Applications/Moraya.app
```

### 3. Windows SmartScreen警告

**问题**: "Windows已保护你的电脑"

**解决**:
- 点击"更多信息"
- 点击"仍要运行"

### 4. WebView2缺失（Windows）

**问题**: "WebView2 Runtime not found"

**解决**:
- 下载并安装 [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
- 或使用Windows 10/11（已预装）

### 5. 无法访问文件

**问题**: 文件权限错误

**解决**:
- Linux/macOS：
  ```bash
  # 检查文件权限
  ls -l /path/to/file
  
  # 修改权限
  chmod 644 /path/to/file
  ```
- Windows：右键文件 → 属性 → 安全 → 编辑权限

### 6. AI功能无法使用

**问题**: API连接失败

**解决**:
- 检查网络连接
- 确认API Key正确
- 检查API配额
- 尝试使用本地模型（Ollama）

### 7. 应用启动慢

**问题**: 启动时间超过10秒

**解决**:
- 检查系统资源占用
- 关闭不必要的后台应用
- 使用本地AI模型代替云端API

### 8. 找不到配置文件

**问题**: 配置丢失

**解决**:
- 查看配置文件位置：
  - Linux: `~/.config/moraya/`
  - macOS: `~/Library/Application Support/Moraya/`
  - Windows: `%APPDATA%\Moraya\`
- 恢复默认配置：删除配置目录，重启应用

## 更新

### 自动更新（未来支持）

Moraya将支持自动更新检测：

- 设置 → 通用 → 启用自动更新
- 定期检查新版本

### 手动更新

1. 下载最新版本安装包
2. 运行安装程序（覆盖安装）
3. 便携版：直接替换文件

### 版本回退

如新版本有问题：

1. 下载旧版本安装包
2. 卸载当前版本
3. 安装旧版本

## 数据迁移

### 配置迁移

配置文件位置：

- Linux: `~/.config/moraya/`
- macOS: `~/Library/Application Support/Moraya/`
- Windows: `%APPDATA%\Moraya\`

迁移步骤：

```bash
# 备份配置
tar -czf moraya-config-backup.tar.gz ~/.config/moraya/

# 恢复配置
tar -xzf moraya-config-backup.tar.gz -C ~/
```

### 文档迁移

Markdown文件可直接复制到新机器：

```bash
# 备份文档
tar -czf markdown-backup.tar.gz ~/Documents/Markdown/

# 恢复文档
tar -xzf markdown-backup.tar.gz -C ~/
```

## 下一步

安装完成后：

- 阅读 [USAGE.md](./USAGE.md) 了解使用方法
- 阅读 [lark-cli-installation-guide.md](./lark-cli-installation-guide.md) 了解飞书同步配置
- 阅读 [BUILD.md](./BUILD.md) 了解如何从源码构建

## 获取帮助

- **GitHub Issues**: [提交问题](https://github.com/zouwei/moraya/issues)
- **Wiki**: [用户手册](https://github.com/zouwei/moraya/wiki)
- **社区**: 参与讨论和贡献