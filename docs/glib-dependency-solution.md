# glib和libsoup依赖解决方案

## 问题现状

### 1. glib依赖（已解决 ✓）
- **要求**: glib ≥2.70
- **系统版本**: 2.68.4
- **解决方案**: 已编译安装glib 2.72.3到/usr/local
- **状态**: ✅ 已解决
- **配置**: 
  - Cargo配置: `src-tauri/.cargo/config.toml`
  - 环境脚本: `scripts/env-glib.sh`

### 2. libsoup依赖（待解决）
- **要求**: libsoup-3.0
- **系统版本**: libsoup-2.4（不兼容）
- **解决方案**: 需编译libsoup-3.0.8
- **状态**: ⏳ 进行中
- **阻塞依赖**: libnghttp2-devel

## 解决步骤

### Step 1: 安装libnghttp2-devel（需要root）

```bash
sudo dnf install -y libnghttp2-devel
```

或使用脚本：
```bash
sudo ./scripts/install-libsoup-deps.sh
```

### Step 2: 编译libsoup-3.0.8

```bash
cd libsoup-3.0.8

# 设置glib环境
export PKG_CONFIG_PATH=/usr/local/lib64/pkgconfig:/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH

# 配置
meson setup build --prefix=/usr/local

# 编译
ninja -C build

# 安装（需要root）
sudo ninja -C build install
```

### Step 3: 更新PKG_CONFIG_PATH

编译完成后，libsoup-3.0.pc会安装到/usr/local/lib64/pkgconfig

更新Cargo配置（已自动包含）：
```toml
[env]
PKG_CONFIG_PATH = "/usr/local/lib64/pkgconfig:/usr/local/lib/pkgconfig"
```

### Step 4: 构建Moraya

```bash
cd src-tauri

# 清理旧构建（可选）
cargo clean

# 构建
cargo build --lib

# 或运行测试
cargo test --lib lark_cli
```

## 依赖关系图

```
Moraya (Rust)
    ↓
webkit2gtk-sys
    ↓
soup3-sys → libsoup-3.0
    ↓         ↓
    glib-2.0 ≥2.70  libnghttp2
    ↓               ↓
glib 2.72.3 ✓    libnghttp2-devel (需要安装)
```

## 已安装的依赖

✅ glib 2.72.3 → /usr/local/lib64/pkgconfig/glib-2.0.pc
✅ gobject 2.72.3 → /usr/local/lib64/pkgconfig/gobject-2.0.pc  
✅ gio 2.72.3 → /usr/local/lib64/pkgconfig/gio-2.0.pc
✅ gmodule 2.72.3 → /usr/local/lib64/pkgconfig/gmodule-2.0.pc

## 待安装的依赖

⏳ libsoup-3.0.8 → 需编译安装
⏳ libnghttp2-devel → 需dnf安装

## 快速检查命令

```bash
# 检查glib版本
pkg-config --modversion glib-2.0

# 检查libsoup版本
pkg-config --modversion libsoup-3.0  # 应输出3.0.8

# 检查所有依赖
pkg-config --list-all | grep -E "glib|soup|nghttp2"

# 检查PKG_CONFIG_PATH
echo $PKG_CONFIG_PATH
```

## 环境变量配置

### 永久配置（推荐）
已创建 `src-tauri/.cargo/config.toml`，自动设置PKG_CONFIG_PATH

### 临时配置
```bash
source scripts/env-glib.sh
```

### 手动设置
```bash
export PKG_CONFIG_PATH=/usr/local/lib64/pkgconfig:/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH
```

## 验证步骤

### 1. 验证glib
```bash
pkg-config --modversion glib-2.0
# 应输出: 2.72.3
```

### 2. 验证libsoup-3.0（安装后）
```bash
pkg-config --modversion libsoup-3.0
# 应输出: 3.0.8
```

### 3. 验证cargo构建
```bash
cd src-tauri
cargo check --lib
# 应无错误
```

## 测试命令

```bash
# TypeScript测试（已通过）
npm test -- src/lib/services/lark-cli.test.ts

# Rust测试（待libsoup安装）
cargo test --lib lark_cli

# 完整测试脚本
./scripts/test-lark-cli.sh
```

## 故障排查

### 问题1: cargo找不到glib
**错误**: `glib-2.0 >= 2.70 not found`

**解决**: 
```bash
# 检查PKG_CONFIG_PATH是否包含/usr/local
cat src-tauri/.cargo/config.toml
pkg-config --modversion glib-2.0
```

### 问题2: cargo找不到libsoup-3.0
**错误**: `libsoup-3.0 not found`

**解决**: 
```bash
# 安装libnghttp2-devel
sudo dnf install -y libnghttp2-devel

# 编译libsoup-3.0
cd libsoup-3.0.8
meson setup build --prefix=/usr/local
ninja -C build
sudo ninja -C build install

# 验证
pkg-config --modversion libsoup-3.0
```

### 问题3: cargo clean后重新构建失败
**解决**: 
```bash
# 清理并重新构建
cd src-tauri
cargo clean
cargo build --lib
```

## 文件清单

### 配置文件
- `src-tauri/.cargo/config.toml` - Cargo环境配置
- `scripts/env-glib.sh` - 环境变量脚本

### 编译脚本  
- `scripts/build-with-glib.sh` - 使用glib 2.72.3构建
- `scripts/install-libsoup-deps.sh` - 安装libsoup依赖

### 测试脚本
- `scripts/test-lark-cli.sh` - lark-cli测试
- `src/lib/services/lark-cli.test.ts` - TypeScript测试

### 源码目录
- `glib-2.72.3/` - glib源码（已编译）
- `libsoup-3.0.8/` - libsoup源码（待编译）

---

**创建时间**: 2026-05-08  
**状态**: glib已解决，libsoup待解决  
**下一步**: 安装libnghttp2-devel并编译libsoup-3.0