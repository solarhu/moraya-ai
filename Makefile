# Moraya Makefile
# 简化构建命令调用

.PHONY: help deps dev build clean test check install uninstall package

# 默认目标
.DEFAULT_GOAL := help

# ============================================
# 帮助信息
# ============================================

help:
	@echo "Moraya 构建工具"
	@echo ""
	@echo "用法: make [目标]"
	@echo ""
	@echo "目标:"
	@echo "  help        显示帮助信息"
	@echo "  deps        安装所有依赖"
	@echo "  dev         开发构建（热重载）"
	@echo "  build       生产构建（默认）"
	@echo "  build-dir   使用指定构建目录构建"
	@echo "  clean       清理构建产物"
	@echo "  test        运行测试"
	@echo "  check       类型检查"
	@echo "  lint        代码检查"
	@echo "  install     安装到系统"
	@echo "  uninstall   从系统卸载"
	@echo "  package     打包发布版本"
	@echo "  release     创建发布版本"
	@echo ""
	@echo "示例:"
	@echo "  make deps        # 安装依赖"
	@echo "  make dev         # 开发模式"
	@echo "  make build       # 生产构建"
	@echo "  make test        # 运行测试"
	@echo ""

# ============================================
# 依赖管理
# ============================================

deps:
	@echo "[INFO] 安装所有依赖..."
	@./scripts/build.sh --skip-deps false
	@echo "[SUCCESS] 依赖安装完成"

deps-check:
	@echo "[INFO] 检查依赖..."
	@node --version || echo "Node.js未安装"
	@pnpm --version || echo "pnpm未安装"
	@rustc --version || echo "Rust未安装"
	@echo "[SUCCESS] 依赖检查完成"

# ============================================
# 开发构建
# ============================================

dev:
	@echo "[INFO] 启动开发服务器..."
	@pnpm tauri dev

dev-frontend:
	@echo "[INFO] 启动前端开发服务器..."
	@pnpm dev

dev-backend:
	@echo "[INFO] 启动后端开发服务器..."
	@pnpm tauri dev

# ============================================
# 生产构建
# ============================================

build:
	@echo "[INFO] 执行生产构建..."
	@./scripts/build.sh --release

build-dir:
	@echo "[INFO] 使用指定构建目录构建..."
	@if [ -z "$(DIR)" ]; then \
		echo "[ERROR] 请指定构建目录: make build-dir DIR=/path/to/build"; \
		exit 1; \
	fi
	@./scripts/build.sh --build-dir $(DIR) --keep

build-linux:
	@echo "[INFO] 构建Linux版本..."
	@./scripts/build.sh --target linux --package all

build-macos:
	@echo "[INFO] 构建macOS版本..."
	@./scripts/build.sh --target macos --package all

build-windows:
	@echo "[INFO] 构建Windows版本（需要在Windows环境）..."
	@powershell -File scripts/build.ps1

# ============================================
# 特定包构建
# ============================================

build-deb:
	@echo "[INFO] 构建DEB包..."
	@./scripts/build.sh --target linux --package deb

build-appimage:
	@echo "[INFO] 构建AppImage..."
	@./scripts/build.sh --target linux --package appimage

build-rpm:
	@echo "[INFO] 构建RPM包..."
	@./scripts/build.sh --target linux --package rpm

build-dmg:
	@echo "[INFO] 构建DMG包..."
	@./scripts/build.sh --target macos --package dmg

build-msi:
	@echo "[INFO] 构建MSI包..."
	@powershell -File scripts/build.ps1 -Package msi

build-nsis:
	@echo "[INFO] 构建NSIS包..."
	@powershell -File scripts/build.ps1 -Package nsis

# ============================================
# 清理
# ============================================

clean:
	@echo "[INFO] 清理构建产物..."
	@rm -rf build/
	@rm -rf .svelte-kit/
	@rm -rf src-tauri/target/
	@rm -rf tests/*/target/
	@rm -rf node_modules/.cache/
	@echo "[SUCCESS] 清理完成"

clean-build-dir:
	@echo "[INFO] 清理构建目录..."
	@if [ -z "$(DIR)" ]; then \
		rm -rf /tmp/moraya-build; \
	else \
		rm -rf $(DIR); \
	fi
	@echo "[SUCCESS] 构建目录已清理"

# ============================================
# 测试
# ============================================

test:
	@echo "[INFO] 运行所有测试..."
	@pnpm test
	@cd src-tauri && cargo test
	@echo "[SUCCESS] 测试完成"

test-ts:
	@echo "[INFO] 运行TypeScript测试..."
	@pnpm test

test-rust:
	@echo "[INFO] 运行Rust测试..."
	@cd src-tauri && cargo test

test-watch:
	@echo "[INFO] 运行测试（监听模式）..."
	@pnpm test:watch

test-coverage:
	@echo "[INFO] 运行测试（覆盖率）..."
	@pnpm test --coverage

# ============================================
# 检查
# ============================================

check:
	@echo "[INFO] 类型检查..."
	@pnpm check

check-watch:
	@echo "[INFO] 类型检查（监听模式）..."
	@pnpm check:watch

lint:
	@echo "[INFO] 代码检查..."
	@pnpm lint || echo "lint脚本未配置"

# ============================================
# 安装/卸载
# ============================================

install:
	@echo "[INFO] 安装到系统..."
	@if [ "$(shell uname -s)" = "Linux" ]; then \
		sudo dpkg -i src-tauri/target/release/bundle/deb/*.deb || \
		sudo rpm -i src-tauri/target/release/bundle/rpm/*.rpm; \
	elif [ "$(shell uname -s)" = "Darwin" ]; then \
		cp -r src-tauri/target/release/bundle/macos/*.app /Applications/; \
	else \
		echo "[WARNING] Windows平台请手动运行MSI/NSIS安装包"; \
	fi
	@echo "[SUCCESS] 安装完成"

uninstall:
	@echo "[INFO] 从系统卸载..."
	@if [ "$(shell uname -s)" = "Linux" ]; then \
		sudo dpkg --remove moraya || sudo rpm -e moraya; \
	elif [ "$(shell uname -s)" = "Darwin" ]; then \
		rm -rf /Applications/Moraya.app; \
	else \
		echo "[WARNING] Windows平台请使用控制面板卸载"; \
	fi
	@echo "[SUCCESS] 卸载完成"

# ============================================
# 打包发布
# ============================================

package:
	@echo "[INFO] 打包发布版本..."
	@./scripts/build.sh --release --keep
	@echo "[SUCCESS] 打包完成"

package-deps:
	@echo "[INFO] 打包运行依赖..."
	@tar -czf moraya-dependencies.tar.gz node_modules/ src-tauri/Cargo.lock
	@echo "[SUCCESS] 依赖打包完成: moraya-dependencies.tar.gz"

# ============================================
# 发布管理
# ============================================

release:
	@echo "[INFO] 创建发布版本..."
	@if [ -z "$(VERSION)" ]; then \
		echo "[ERROR] 请指定版本号: make release VERSION=0.41.0"; \
		exit 1; \
	fi
	@echo "[INFO] 更新版本号到 $(VERSION)..."
	@pnpm version:bump $(VERSION)
	@git tag -a v$(VERSION) -m "Release v$(VERSION)"
	@git push origin v$(VERSION)
	@echo "[SUCCESS] 发布版本 v$(VERSION) 已创建"

release-notes:
	@echo "[INFO] 生成发布说明..."
	@git log --pretty=format:"%s" --since="last release" > RELEASE_NOTES.md
	@echo "[SUCCESS] 发布说明已生成: RELEASE_NOTES.md"

# ============================================
# Docker支持（未来）
# ============================================

docker-build:
	@echo "[INFO] 使用Docker构建..."
	@docker build -t moraya-builder:latest .
	@docker run --rm -v $(PWD)/dist:/dist moraya-builder:latest
	@echo "[SUCCESS] Docker构建完成"

# ============================================
# CI/CD支持
# ============================================

ci-test:
	@echo "[INFO] CI测试流程..."
	@pnpm install --frozen-lockfile
	@pnpm test
	@cd src-tauri && cargo test
	@pnpm check

ci-build:
	@echo "[INFO] CI构建流程..."
	@./scripts/build.sh --skip-deps --release --clean