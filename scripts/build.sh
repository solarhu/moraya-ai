#!/bin/bash

# Moraya统一构建脚本
# 功能：自动解决编译依赖、打包运行依赖、支持指定构建目录、避免影响代码目录

set -e  # 遇到错误立即退出

# ============================================
# 配置参数
# ============================================

SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="Moraya Builder"

# 默认构建目录（在代码目录外）
DEFAULT_BUILD_DIR="/tmp/moraya-build"
BUILD_DIR="${DEFAULT_BUILD_DIR}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# 辅助函数
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_version() {
    echo "${SCRIPT_NAME} v${SCRIPT_VERSION}"
    exit 0
}

show_help() {
    cat <<EOF
${SCRIPT_NAME} v${SCRIPT_VERSION} - Moraya统一构建脚本

用法:
    $0 [选项]

选项:
    -d, --build-dir DIR      指定构建目录（默认: ${DEFAULT_BUILD_DIR})
    -c, --clean              构建前清理构建目录
    -k, --keep               构建后保留构建目录（默认删除）
    -s, --skip-deps          跳过依赖安装（假设已安装）
    -t, --target PLATFORM    指定构建目标（linux/macos/windows，默认当前平台）
    -r, --release            生产构建（默认）
    -D, --dev                开发构建
    -p, --package TYPE       指定打包类型（deb/appimage/dmg/msi/nsis/all，默认all）
    -v, --verbose            显示详细输出
    -h, --help               显示帮助信息
    --version                显示版本信息

示例:
    # 默认构建（使用临时目录）
    $0

    # 指定构建目录
    $0 --build-dir ~/build/moraya

    # 清理后构建并保留构建目录
    $0 --clean --keep

    # 只构建特定平台包
    $0 --target linux --package deb

    # 开发构建（跳过依赖安装）
    $0 --dev --skip-deps

平台支持:
    Linux:   deb, appimage, rpm
    macOS:   dmg, app
    Windows: msi, nsis, portable

EOF
    exit 0
}

# ============================================
# 参数解析
# ============================================

CLEAN_BUILD=false
KEEP_BUILD=false
SKIP_DEPS=false
BUILD_TARGET="current"
BUILD_MODE="release"
PACKAGE_TYPE="all"
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--build-dir)
            BUILD_DIR="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        -k|--keep)
            KEEP_BUILD=true
            shift
            ;;
        -s|--skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        -t|--target)
            BUILD_TARGET="$2"
            shift 2
            ;;
        -r|--release)
            BUILD_MODE="release"
            shift
            ;;
        -D|--dev)
            BUILD_MODE="dev"
            shift
            ;;
        -p|--package)
            PACKAGE_TYPE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        --version)
            show_version
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            ;;
    esac
done

# ============================================
# 系统检测
# ============================================

detect_platform() {
    case "$(uname -s)" in
        Linux*)
            PLATFORM="linux"
            ;;
        Darwin*)
            PLATFORM="macos"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            PLATFORM="windows"
            ;;
        *)
            log_error "未知平台: $(uname -s)"
            exit 1
            ;;
    esac
    
    if [[ "$BUILD_TARGET" == "current" ]]; then
        BUILD_TARGET="$PLATFORM"
    fi
    
    log_info "检测到平台: ${PLATFORM}"
    log_info "构建目标: ${BUILD_TARGET}"
}

# ============================================
# 依赖检查和安装
# ============================================

check_nodejs() {
    if ! command -v node &> /dev/null; then
        log_warning "Node.js未安装"
        return 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
    
    if [[ "$NODE_MAJOR" -lt 18 ]]; then
        log_warning "Node.js版本过低: v${NODE_VERSION} (需要 >= 18)"
        return 1
    fi
    
    log_success "Node.js版本: v${NODE_VERSION}"
    return 0
}

install_nodejs() {
    log_info "安装Node.js..."
    
    case "$PLATFORM" in
        linux)
            # 使用NodeSource仓库
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        macos)
            # 使用Homebrew
            if command -v brew &> /dev/null; then
                brew install node@18
            else
                log_error "需要Homebrew，请手动安装Node.js"
                exit 1
            fi
            ;;
        windows)
            log_warning "Windows平台请手动安装Node.js: https://nodejs.org/"
            exit 1
            ;;
    esac
    
    log_success "Node.js安装完成"
}

check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        log_warning "pnpm未安装"
        return 1
    fi
    
    PNPM_VERSION=$(pnpm --version)
    PNPM_MAJOR=$(echo "$PNPM_VERSION" | cut -d'.' -f1)
    
    if [[ "$PNPM_MAJOR" -lt 8 ]]; then
        log_warning "pnpm版本过低: v${PNPM_VERSION} (需要 >= 8)"
        return 1
    fi
    
    log_success "pnpm版本: v${PNPM_VERSION}"
    return 0
}

install_pnpm() {
    log_info "安装pnpm..."
    npm install -g pnpm
    log_success "pnpm安装完成"
}

check_rust() {
    if ! command -v rustc &> /dev/null; then
        log_warning "Rust未安装"
        return 1
    fi
    
    RUST_VERSION=$(rustc --version | cut -d' ' -f2)
    RUST_MAJOR=$(echo "$RUST_VERSION" | cut -d'.' -f1)
    RUST_MINOR=$(echo "$RUST_VERSION" | cut -d'.' -f2)
    
    if [[ "$RUST_MAJOR" -lt 1 ]] || [[ "$RUST_MAJOR" -eq 1 && "$RUST_MINOR" -lt 70 ]]; then
        log_warning "Rust版本过低: ${RUST_VERSION} (需要 >= 1.70)"
        return 1
    fi
    
    log_success "Rust版本: ${RUST_VERSION}"
    return 0
}

install_rust() {
    log_info "安装Rust..."
    
    # 使用rustup
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    
    # 加载环境变量
    source "$HOME/.cargo/env"
    
    log_success "Rust安装完成"
}

check_system_deps() {
    log_info "检查系统依赖..."
    
    case "$PLATFORM" in
        linux)
            DEPS=(
                "build-essential"
                "libgtk-3-dev"
                "libwebkit2gtk-4.1-dev"
                "libappindicator3-dev"
                "librsvg2-dev"
                "libssl-dev"
                "libglib2.0-dev"
            )
            
            MISSING_DEPS=()
            for DEP in "${DEPS[@]}"; do
                if ! dpkg -l "$DEP" &> /dev/null; then
                    MISSING_DEPS+=("$DEP")
                fi
            done
            
            if [[ ${#MISSING_DEPS[@]} -gt 0 ]]; then
                log_warning "缺少系统依赖: ${MISSING_DEPS[*]}"
                return 1
            fi
            
            log_success "系统依赖完整"
            return 0
            ;;
        macos)
            # macOS依赖检查
            if ! command -v xcode-select &> /dev/null || ! xcode-select -p &> /dev/null; then
                log_warning "Xcode Command Line Tools未安装"
                return 1
            fi
            
            log_success "系统依赖完整"
            return 0
            ;;
        windows)
            # Windows依赖检查（简化）
            log_info "Windows平台依赖请确保已安装MSVC Build Tools"
            return 0
            ;;
    esac
}

install_system_deps() {
    log_info "安装系统依赖..."
    
    case "$PLATFORM" in
        linux)
            sudo apt-get update
            sudo apt-get install -y \
                build-essential \
                libgtk-3-dev \
                libwebkit2gtk-4.1-dev \
                libappindicator3-dev \
                librsvg2-dev \
                libssl-dev \
                libglib2.0-dev
            ;;
        macos)
            xcode-select --install || true
            ;;
        windows)
            log_warning "Windows平台请手动安装MSVC Build Tools"
            ;;
    esac
    
    log_success "系统依赖安装完成"
}

check_all_deps() {
    log_info "检查所有依赖..."
    
    DEPS_OK=true
    
    check_nodejs || DEPS_OK=false
    check_pnpm || DEPS_OK=false
    check_rust || DEPS_OK=false
    check_system_deps || DEPS_OK=false
    
    if [[ "$DEPS_OK" == true ]]; then
        log_success "所有依赖检查通过"
        return 0
    else
        log_warning "部分依赖缺失"
        return 1
    fi
}

install_all_deps() {
    log_info "安装所有缺失依赖..."
    
    check_nodejs || install_nodejs
    check_pnpm || install_pnpm
    check_rust || install_rust
    check_system_deps || install_system_deps
    
    log_success "所有依赖安装完成"
}

# ============================================
# 构建目录准备
# ============================================

prepare_build_dir() {
    log_info "准备构建目录: ${BUILD_DIR}"
    
    # 创建构建目录
    mkdir -p "$BUILD_DIR"
    
    # 如果指定清理，删除构建目录内容
    if [[ "$CLEAN_BUILD" == true ]]; then
        log_info "清理构建目录..."
        rm -rf "$BUILD_DIR/*"
    fi
    
    # 获取源码目录（脚本所在目录的上级）
    SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
    
    log_info "源码目录: ${SOURCE_DIR}"
    
    # 复制源码到构建目录
    log_info "复制源码到构建目录..."
    rsync -av --exclude='node_modules' \
                --exclude='.git' \
                --exclude='build' \
                --exclude='.svelte-kit' \
                --exclude='src-tauri/target' \
                --exclude='tests/*/target' \
                "$SOURCE_DIR/" "$BUILD_DIR/"
    
    log_success "源码复制完成"
}

# ============================================
# 安装项目依赖
# ============================================

install_project_deps() {
    log_info "安装项目依赖..."
    
    cd "$BUILD_DIR"
    
    # Node.js依赖
    log_info "安装Node.js依赖..."
    pnpm install --frozen-lockfile
    
    # Rust依赖（自动安装）
    log_info "检查Rust依赖..."
    cd src-tauri
    cargo fetch  # 只下载依赖，不编译
    cd ..
    
    log_success "项目依赖安装完成"
}

# ============================================
# 执行构建
# ============================================

run_build() {
    log_info "执行构建（模式: ${BUILD_MODE})..."
    
    cd "$BUILD_DIR"
    
    if [[ "$BUILD_MODE" == "dev" ]]; then
        # 开发构建
        log_info "开发构建（仅前端）..."
        pnpm build
        
        # 开发模式不打包
        log_success "开发构建完成"
        log_info "产物位置: ${BUILD_DIR}/build/"
        
    else
        # 生产构建
        log_info "生产构建（完整打包）..."
        
        # 设置构建目标
        case "$BUILD_TARGET" in
            linux)
                # Linux构建
                case "$PACKAGE_TYPE" in
                    deb)
                        log_info "构建DEB包..."
                        pnpm tauri build --bundles deb
                        ;;
                    appimage)
                        log_info "构建AppImage..."
                        pnpm tauri build --bundles appimage
                        ;;
                    rpm)
                        log_info "构建RPM包..."
                        pnpm tauri build --bundles rpm
                        ;;
                    all)
                        log_info "构建所有Linux包..."
                        pnpm tauri build --bundles deb,appimage,rpm
                        ;;
                esac
                ;;
            macos)
                # macOS构建
                case "$PACKAGE_TYPE" in
                    dmg)
                        log_info "构建DMG包..."
                        pnpm tauri build --bundles dmg
                        ;;
                    app)
                        log_info "构建APP包..."
                        pnpm tauri build --bundles app
                        ;;
                    all)
                        log_info "构建所有macOS包..."
                        pnpm tauri build --bundles dmg,app
                        ;;
                esac
                ;;
            windows)
                # Windows构建
                case "$PACKAGE_TYPE" in
                    msi)
                        log_info "构建MSI包..."
                        pnpm tauri build --bundles msi
                        ;;
                    nsis)
                        log_info "构建NSIS包..."
                        pnpm tauri build --bundles nsis
                        ;;
                    portable)
                        log_info "构建便携版..."
                        # 便携版需要自定义处理
                        pnpm tauri build
                        # 后续打包
                        ;;
                    all)
                        log_info "构建所有Windows包..."
                        pnpm tauri build --bundles msi,nsis
                        ;;
                esac
                ;;
        esac
        
        log_success "构建完成"
        
        # 显示产物位置
        BUNDLE_DIR="$BUILD_DIR/src-tauri/target/release/bundle"
        log_info "产物位置: ${BUNDLE_DIR}"
        ls -lh "$BUNDLE_DIR"/*/  2>/dev/null || true
    fi
}

# ============================================
# 打包运行依赖（可选）
# ============================================

package_deps() {
    log_info "打包运行依赖..."
    
    cd "$BUILD_DIR"
    
    DEPS_PACKAGE="$BUILD_DIR/moraya-dependencies.tar.gz"
    
    # 打包node_modules
    tar -czf "$DEPS_PACKAGE" \
        --exclude='*.log' \
        --exclude='*.tmp' \
        node_modules/
    
    log_success "运行依赖已打包: ${DEPS_PACKAGE}"
    log_info "大小: $(du -sh "$DEPS_PACKAGE" | cut -f1)"
}

# ============================================
# 清理构建目录
# ============================================

cleanup_build_dir() {
    if [[ "$KEEP_BUILD" == false ]]; then
        log_info "清理构建目录..."
        cd "$SOURCE_DIR"
        rm -rf "$BUILD_DIR"
        log_success "构建目录已清理"
    else
        log_info "保留构建目录: ${BUILD_DIR}"
    fi
}

# ============================================
# 主流程
# ============================================

main() {
    log_info "=========================================="
    log_info "${SCRIPT_NAME} v${SCRIPT_VERSION}"
    log_info "=========================================="
    
    # 1. 检测平台
    detect_platform
    
    # 2. 检查和安装依赖（如未跳过）
    if [[ "$SKIP_DEPS" == false ]]; then
        check_all_deps || install_all_deps
    else
        log_info "跳过依赖安装"
    fi
    
    # 3. 准备构建目录
    prepare_build_dir
    
    # 4. 安装项目依赖
    if [[ "$SKIP_DEPS" == false ]]; then
        install_project_deps
    fi
    
    # 5. 执行构建
    run_build
    
    # 6. 打包运行依赖（可选）
    if [[ "$BUILD_MODE" == "release" ]]; then
        package_deps
    fi
    
    # 7. 清理构建目录
    cleanup_build_dir
    
    log_success "=========================================="
    log_success "构建完成！"
    log_success "=========================================="
}

# 执行主流程
main