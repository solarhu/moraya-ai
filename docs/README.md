# Moraya 文档中心

## 用户指南

| 文档 | 说明 | 适用人群 |
|------|------|----------|
| [BUILD.md](./BUILD.md) | 构建指南：从源码构建应用程序 | 开发者 |
| [INSTALLATION.md](./INSTALLATION.md) | 安装指南：系统要求、安装步骤、卸载方法 | 所有用户 |
| [USAGE.md](./USAGE.md) | 使用指南：功能介绍、操作方法、快捷键 | 所有用户 |
| [lark-cli-installation-guide.md](./lark-cli-installation-guide.md) | lark-cli安装：飞书同步配置指南 | 需要云同步的用户 |

## 设计文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [design-multi-terminal-ai-collab-platform.md](./design-multi-terminal-ai-collab-platform.md) | 多终端AI协同平台设计方案（v4） | 当前版本 |
| [project-plan-multi-terminal-ai-collab-platform.md](./project-plan-multi-terminal-ai-collab-platform.md) | 项目计划（v4：飞书CLI集成） | 当前版本 |
| [glib-dependency-solution.md](./glib-dependency-solution.md) | glib依赖解决方案 | 技术参考 |

## 完成总结

| 文档 | 说明 | 版本 |
|------|------|------|
| [phase3-completion-summary.md](./phase3-completion-summary.md) | Phase 3 MVP完成总结 | v0.2-alpha |

## 规格文档

| 文档 | 说明 | 内容 |
|------|------|------|
| [specs/markdown-syntax-reference.md](./specs/markdown-syntax-reference.md) | Markdown语法参考 | CommonMark + GFM扩展 |

## 迭代需求

| 版本 | 阶段 | 状态 | 文档 |
|------|------|------|------|
| v0.1.0 | Phase 1 — 核心编辑器 | 已完成 | WYSIWYG Markdown 编辑、数学公式、文件操作、侧栏、设置、导出、主题 |
| v0.1.1 | Phase 2 — AI 集成 | 已完成 | 多 Provider LLM API、流式输出、AI 聊天面板、AI 指令 |
| v0.1.2 | Phase 3 — MCP 生态 | 已完成 | MCP 客户端（stdio/SSE/HTTP 三种传输）、服务管理 |
| v0.1.3 | Phase 4 — 编辑器增强 | 已完成 | 源码/可视/分屏模式、表格工具栏、原生菜单、国际化、滚动同步 |
| v0.2.0 | Phase 5 — 创作发布工作流 | 规划中 | [详细需求](iterations/v0.2.0-publish-workflow.md) |

## 目录结构

```
docs/
├── README.md              ← 本文件（文档索引）
├── BUILD.md               ← 构建指南
├── INSTALLATION.md        ← 安装指南
├── USAGE.md               ← 使用指南
├── lark-cli-installation-guide.md ← lark-cli安装指南
├── design-*.md            ← 设计方案文档
├── project-plan-*.md      ← 项目计划文档
├── phase3-completion-summary.md ← Phase 3总结
├── glib-dependency-solution.md ← 依赖解决方案
├── iterations/            ← 增量需求迭代
├── specs/                 ← 功能规格书
├── changelog/             ← 版本变更记录
└── decisions/             ← 架构决策记录 (ADR)
```

## 文档规范

- **用户指南**: `BUILD.md`, `INSTALLATION.md`, `USAGE.md` — 用户必读文档
- **设计文档**: `design-*.md`, `project-plan-*.md` — 项目设计方案
- **增量迭代文档**: `iterations/v{版本号}-{描述}.md` — 独立完整，包含需求、交互、技术方案、文件清单、验证方案
- **功能规格书**: `specs/{功能名}.md` — 从迭代文档中拆分的独立功能详细设计
- **架构决策**: `decisions/{序号}-{主题}.md` — ADR 格式，记录重要技术决策
- **变更记录**: `changelog/CHANGELOG.md` — Keep a Changelog 格式

## 快速开始

### 普通用户

1. 阅读 [INSTALLATION.md](./INSTALLATION.md) 安装应用
2. 阅读 [USAGE.md](./USAGE.md) 学习使用方法
3. 如需飞书同步，阅读 [lark-cli-installation-guide.md](./lark-cli-installation-guide.md)

### 开发者

1. 阅读 [BUILD.md](./BUILD.md) 搭建开发环境
2. 阅读 [design-multi-terminal-ai-collab-platform.md](./design-multi-terminal-ai-collab-platform.md) 了解架构
3. 阅读 [project-plan-multi-terminal-ai-collab-platform.md](./project-plan-multi-terminal-ai-collab-platform.md) 了解路线图
