# Moraya 多终端 AI 协同 Markdown 平台 - 项目计划文档

**版本**: v1.0  
**日期**: 2026-05-07  
**项目代号**: Moraya-X  
**项目周期**: 18-21周（4.5-5.5个月）  
**项目类型**: 核心功能扩展 + 新平台开发

---

## 一、项目概述

### 1.1 项目背景

基于现有Moraya开源项目，扩展以下核心能力：
- 多终端支持（Desktop/Web/Mobile/HarmonyOS）
- 云端同步可扩展架构（首个支持飞书）
- AI Agent可扩展协同架构（首个支持OpenClaw）
- 实时协同编辑（CRDT）

### 1.2 项目目标

**核心目标**:
- 完成多终端全覆盖（Desktop/Web/Mobile基础版）
- 实现飞书云文档同步（首个云平台）
- 实现OpenClaw Agent协同（首个AI Agent）
- 建立可扩展架构基础（Registry + Adapter）

**扩展目标**:
- HarmonyOS Next支持（可选，视Tauri官方支持情况）
- 实时协同编辑（CRDT）
- 多Agent协同机制

### 1.3 项目范围

**包含范围**:
- Sync Adapter Registry架构 + 飞书适配器 + Picora/GitHub改造
- AI Agent Registry架构 + OpenClaw适配器 + Claude/ChatGPT改造
- Web端PWA + @moraya/core抽取
- Mobile端（iOS/Android Tauri）
- Markdown增强Block（AI操作标记）
- Agent协同引擎 + Sidecar存储
- Rust后端飞书/OpenClaw API封装
- 前端Agent面板 + 同步UI

**不包含范围**:
- Notion/语雀等扩展平台（后续Phase）
- 企业级权限管理（后续Phase）
- E2E加密（后续Phase）
- HarmonyOS Next（可选Phase 9）

---

## 二、团队与角色分工

### 2.1 团队组成

| 角色 | 人数 | 职责 | 技能要求 |
|------|------|------|----------|
| **项目负责人 (PM)** | 1 | 项目规划、进度管理、风险评估、决策协调 | 项目管理经验、技术背景 |
| **架构师** | 1 | 架构设计、技术选型、核心代码编写、代码审查 | TypeScript/Rust/Svelte架构经验 |
| **前端开发** | 2 | Svelte组件开发、ProseMirror扩展、UI实现 | Svelte/TypeScript/ProseMirror |
| **Rust后端开发** | 1 | Rust Command实现、API封装、安全加固 | Rust/reqwest/tauri |
| **AI集成开发** | 1 | Agent适配器实现、MCP集成、AI协同引擎 | TypeScript/AI API经验 |
| **云同步开发** | 1 | Sync适配器实现、转换器、OAuth流程 | TypeScript/API集成经验 |
| **测试工程师** | 1 | 自动化测试、集成测试、性能测试 | vitest/playwright |
| **文档工程师** | 1 | 技术文档、用户手册、API文档 | Markdown/技术写作 |

**总人数**: 9人（核心团队）

### 2.2 角色分工矩阵

| Phase | PM | 架构师 | 前端 | Rust | AI集成 | 云同步 | 测试 | 文档 |
|-------|----|----|------|------|--------|--------|------|------|
| **Phase 1** | 协调 | 主导 | 辅助 | 辅助 | 辅助 | 辅助 | - | 跟随 |
| **Phase 2** | 协调 | 指导 | 配合 | 主导 | - | 主导 | 辅助 | 跟随 |
| **Phase 3** | 协调 | 指导 | 配合 | 主导 | 主导 | - | 辅助 | 跟随 |
| **Phase 4** | 协调 | 指导 | 辅助 | 改造 | 改造 | 改造 | 辅助 | 更新 |
| **Phase 5** | 协调 | 指导 | 主导 | 辅助 | 辅助 | 辅助 | 辅助 | 跟随 |
| **Phase 6** | 协调 | 指导 | 主导 | 辅助 | 辅助 | 辅助 | 辅助 | 跟随 |
| **Phase 7** | 协调 | 指导 | 主导 | 辅助 | 辅助 | 辅助 | 辅助 | 跟随 |
| **Phase 8** | 协调 | 指导 | 配合 | 配合 | 配合 | 配合 | 主导 | 主导 |

### 2.3 外部协作

| 协作方 | 协作内容 | 协作频率 |
|--------|----------|----------|
| **飞书开放平台** | API文档咨询、OAuth调试支持 | 每周1次 |
| **OpenClaw团队** | API接入咨询、Agent能力确认 | 每周1次 |
| **Tauri社区** | Tauri Mobile/HarmonyOS进展跟踪 | 每两周1次 |
| **Moraya社区** | 架构讨论、反馈收集、Beta测试 | 每两周1次 |

---

## 三、项目里程碑规划

### 3.1 总体里程碑

```
Timeline (18-21周):
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: 核心架构 (Week 1-2)                                │
│ [M1] Registry架构完成 + Markdown增强Block定义               │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: 首个云平台 (Week 3-6)                              │
│ [M2] 飞书适配器完成 + OAuth登录 + 转换器实现                 │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: 馍个Agent (Week 7-10)                              │
│ [M3] OpenClaw适配器完成 + 协同引擎 + Sidecar存储            │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: 现有改造 (Week 11-12)                              │
│ [M4] Picora/GitHub适配器改造 + Claude/ChatGPT Agent改造     │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: 前端UI (Week 13-14)                                │
│ [M5] Agent面板 + 同步UI + 冲突解决UI完成                     │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 6: Web端 (Week 15-16)                                 │
│ [M6] @moraya/core抽取 + PWA上线                             │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 7: Mobile端 (Week 17-18)                              │
│ [M7] iOS/Android Tauri版本完成                              │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 8: 集成测试 (Week 19)                                 │
│ [M8] 全系统集成测试完成 + Beta版本发布                       │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 9: HarmonyOS (Week 20-22, 可选)                       │
│ [M9] 鸿蒙版本完成（视Tauri官方支持情况）                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 详细里程碑

#### Milestone 1: 核心架构完成 (Week 2)

**交付物**:
- `Sync Adapter Registry`架构代码 (types.ts + registry.ts)
- `AI Agent Registry`架构代码 (types.ts + registry.ts)
- Markdown增强Block定义 (:::ai-operation等)
- 架构设计文档完成
- 技术选型确认

**验收标准**:
- ✓ Registry接口定义完整并通过类型检查
- ✓ 至少注册1个mock adapter验证架构可行性
- ✓ Markdown Block定义文档化并通过社区review
- ✓ 架构设计文档完成并通过评审

#### Milestone 2: 飞书适配器完成 (Week 6)

**交付物**:
- 飞书适配器实现 (feishu-adapter.ts)
- Rust后端飞书API封装 (commands/feishu.rs)
- Markdown ↔ 飞书Block转换器 (feishu-transformer.ts)
- 飞书OAuth登录流程（Desktop端）
- 三向Diff集成（复用kb-sync）
- 首次同步成功验证

**验收标准**:
- ✓ 飞书OAuth登录成功获取user_access_token
- ✓ 至少1个KB成功绑定到飞书文件夹
- ✓ Markdown文档上传到飞书并正确转换格式
- ✓ 飞书文档下载并转换回Markdown
- ✓ 冲突检测和解决流程验证
- ✓ 单元测试覆盖率≥80%

#### Milestone 3: OpenClaw Agent完成 (Week 10)

**交付物**:
- OpenClaw适配器实现 (openclaw-adapter.ts)
- Rust后端OpenClaw API封装 (commands/openclaw.rs)
- Agent协同引擎 (collab-engine.ts)
- Block级AI操作标记解析器
- Sidecar存储实现（复用review-service架构）
- Agent记忆管理基础

**验收标准**:
- ✓ OpenClaw Agent初始化成功并注入文档上下文
- ✓ Agent至少执行1次co-author操作（修改文档）
- ✓ AI操作正确插入到Markdown :::ai-operation Block
- ✓ 用户成功接受/拒绝AI操作
- ✓ Sidecar存储正确记录AI操作历史
- ✓ Agent记忆持久化验证
- ✓ 单元测试覆盖率≥80%

#### Milestone 4: 现有改造完成 (Week 12)

**交付物**:
- Picora适配器改造为Registry架构
- GitHub适配器改造为Registry架构
- Claude Agent适配器改造（基于ai-service）
- ChatGPT Agent适配器改造
- 改造后的功能验证

**验收标准**:
- ✓ Picora/GitHub同步功能正常（不破坏现有功能）
- ✓ Claude Agent至少执行1次reviewer操作
- ✓ ChatGPT Agent至少执行1次co-author操作
- ✓ 所有改造通过回归测试

#### Milestone 5: 前端UI完成 (Week 14)

**交付物**:
- AgentPanel.svelte（Agent选择、配置、交互）
- SyncSettings.svelte（云平台配置、绑定管理）
- ConflictResolver.svelte（冲突解决界面）
- OperationsList.svelte（AI操作列表）
- StreamPreview.svelte（Agent流式输出预览）
- UI响应式设计（Desktop/Web/Mobile适配）

**验收标准**:
- ✓ Agent面板成功切换Agent类型和角色
- ✓ 同步配置成功保存并触发同步
- ✓ 冲突解决界面正确显示冲突详情并支持选择
- ✓ AI操作列表正确显示pending操作并支持确认
- ✓ Agent流式输出实时显示
- ✓ 所有UI组件通过视觉回归测试

#### Milestone 6: Web端PWA完成 (Week 16)

**交付物**:
- @moraya/core npm包抽取（Editor/AI/Sync核心）
- SvelteKit SPA配置（adapter-static）
- IndexedDB存储实现
- Service Worker离线缓存
- PWA manifest配置
- Web端首次部署成功

**验收标准**:
- ✓ @moraya/core npm包发布成功（npmjs.com）
- ✓ Web端访问正常并加载Editor
- ✓ IndexedDB正确存储文档和KB
- ✓ 离线编辑功能验证（断网后继续编辑）
- ✓ PWA成功安装到浏览器
- ✓ Web端Agent和同步功能正常

#### Milestone 7: Mobile端完成 (Week 18)

**交付物**:
- Tauri v2 iOS配置（Info.plist、entitlements）
- Tauri v2 Android配置（AndroidManifest.xml）
- Mobile端UI适配（触摸优化、手势支持）
- Mobile端Agent和同步功能
- iOS TestFlight版本上传
- Android APK打包成功

**验收标准**:
- ✓ iOS应用成功运行并加载Editor
- ✓ Android应用成功运行并加载Editor
- ✓ Mobile端Agent面板正常交互
- ✓ Mobile端云同步功能正常
- ✓ iOS版本上传到TestFlight并通过审核
- ✓ Android APK安装成功并运行稳定

#### Milestone 8: 集成测试完成 (Week 19)

**交付物**:
- 全系统集成测试套件（vitest + playwright）
- 多终端协同测试验证
- Agent+Cloud集成测试
- 性能测试报告
- Beta版本发布（GitHub Releases）
- 用户手册更新

**验收标准**:
- ✓ 所有单元测试通过（覆盖率≥80%）
- ✓ Desktop/Web/Mobile三端协同验证（同一KB跨终端同步）
- ✓ Agent + 飞书同步集成验证（Agent修改后自动同步到飞书）
- ✓ 性能基准达标（编辑器加载<500ms，同步延迟<2s）
- ✓ Beta版本发布成功并收集社区反馈
- ✓ 用户手册涵盖新功能并发布到Wiki

#### Milestone 9: HarmonyOS版本完成 (Week 22, 可选)

**交付物**:
- 鸿蒙版架构决策文档（Tauri移植 vs ArkTS原生）
- HarmonyOS应用包结构
- ArkUI组件实现（或Tauri移植）
- 鸿蒙版Agent和同步功能
- 华为应用市场上架准备

**验收标准**:
- ✓ 鸿蒙应用成功运行并加载Editor
- ✓ 鸿蒙版Agent面板正常交互
- ✓ 鸿蒙版云同步功能正常（飞书）
- ✓ 鸿蒙应用通过华为应用市场审核（或准备上架）

---

## 四、详细工作计划

### 4.1 Phase 1: 核心架构 (Week 1-2)

#### Week 1: Registry架构设计

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| Sync Adapter Registry类型定义 | 架构师 | 8h | types.ts (CloudPlatform, Adapter接口) |
| Sync Adapter Registry实现 | 架构师 | 4h | registry.ts (register/get/getAll) |
| AI Agent Registry类型定义 | 架构师 | 8h | types.ts (AgentType, Adapter接口) |
| AI Agent Registry实现 | 架构师 | 4h | registry.ts |
| Markdown Block标记规范文档 | 架构师 | 4h | design-markdown-block.md |
| Mock Adapter实现验证架构 | 架构师 | 4h | mock-adapter.ts |

**周总工时**: 36h（架构师） + 8h（前端辅助） = 44h

#### Week 2: Markdown增强Block + 架构评审

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| :::ai-operation Block解析器 | 前端 | 12h | ProseMirror extension |
| :::ai-comment Block解析器 | 前端 | 8h | ProseMirror extension |
| :::ai-suggestion Block解析器 | 前端 | 8h | ProseMirror extension |
| Block解析器单元测试 | 前端 | 4h | block-parser.test.ts |
| 架构设计文档完善 | 架构师 | 8h | design-multi-terminal.md |
| 架构评审（团队） | PM | 4h | 评审会议记录 |
| 技术选型确认文档 | 架构师 | 4h | tech-stack.md |

**周总工时**: 36h（前端） + 12h（架构师） + 4h（PM） = 52h

**Phase 1总工时**: 96h（约2周）

---

### 4.2 Phase 2: 飞书适配器 (Week 3-6)

#### Week 3: 飞书API调研 + OAuth登录

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 飞书开放平台API调研 | 云同步 | 8h | feishu-api-spec.md |
| 飞书OAuth流程设计 | 云同步 | 4h | oauth-flow.md |
| Rust后端飞书API封装基础 | Rust | 12h | commands/feishu.rs基础结构 |
| 飞书tenant_access_token获取 | Rust | 8h | feishu_get_token command |
| 飞书OAuth WebView实现 | 前端 | 12h | OAuth component（Desktop） |
| 飞书OAuth回调处理 | Rust | 8h | deep-link callback |

**周总工时**: 24h（云同步） + 28h（Rust） + 12h（前端） = 64h

#### Week 4: 飞书文档操作API

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 飞书文档列表API | Rust | 8h | feishu_list_docs command |
| 飞书文档详情API | Rust | 8h | feishu_get_doc command |
| 飞书文档创建API | Rust | 8h | feishu_create_doc command |
| 飞书文档更新API | Rust | 8h | feishu_update_doc command |
| 飞书API错误处理 | Rust | 4h | sanitize_feishu_error函数 |
| 飞书API单元测试 | Rust | 8h | feishu.test.ts |

**周总工时**: 36h（Rust） + 8h（云同步辅助） = 44h

#### Week 5: Markdown ↔ 飞书Block转换器

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 飞书Block结构分析 | 云同步 | 8h | feishu-block-spec.md |
| Markdown → 飞书Block转换器 | 云同步 | 16h | mdToFeishu函数 |
| 飞书Block → Markdown转换器 | 云同步 | 16h | feishuToMd函数 |
| 不支持Block处理策略 | 云同步 | 4h | unsupportedBlocks配置 |
| 转换器单元测试 | 云同步 | 8h | feishu-transformer.test.ts |

**周总工时**: 36h（云同步） = 36h

#### Week 6: 飞书适配器集成 + 三向Diff

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 飞书适配器实现 | 云同步 | 16h | feishu-adapter.ts完整实现 |
| 三向Diff集成（复用kb-sync） | 云同步 | 8h | 集成现有diff.ts |
| 飞书同步流程实现 | 云同步 | 8h | sync()方法实现 |
| 飞书适配器注册到Registry | 架构师 | 2h | registry.register(new FeishuAdapter()) |
| 首次同步验证测试 | 测试 | 8h | integration-feishu.test.ts |
| 飞书同步文档编写 | 文档 | 4h | feishu-sync-guide.md |

**周总工时**: 34h（云同步） + 2h（架构师） + 8h（测试） + 4h（文档） = 48h

**Phase 2总工时**: 192h（约4周）

---

### 4.3 Phase 3: OpenClaw Agent (Week 7-10)

#### Week 7: OpenClaw Agent调研 + API封装

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| OpenClaw API调研 | AI集成 | 8h | openclaw-api-spec.md |
| OpenClaw Agent角色指令设计 | AI集成 | 4h | role-instructions.md |
| Rust后端OpenClaw API封装基础 | Rust | 12h | commands/openclaw.rs基础结构 |
| OpenClaw连接测试API | Rust | 8h | openclaw_test_connection command |
| OpenClaw Chat API | Rust | 8h | openclaw_chat command |
| OpenClaw WebSocket连接 | Rust | 12h | openclaw_stream_connect command |

**周总工时**: 12h（AI集成） + 32h（Rust） = 44h

#### Week 8: OpenClaw适配器实现

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| OpenClaw适配器基础实现 | AI集成 | 16h | openclaw-adapter.ts（initialize/chat/terminate） |
| OpenClaw流式响应实现 | AI集成 | 12h | stream() generator实现 |
| OpenClaw上下文注入实现 | AI集成 | 8h | injectContext()实现 |
| OpenClaw记忆管理实现 | AI集成 | 8h | getMemory/setMemory实现 |
| OpenClaw适配器单元测试 | AI集成 | 8h | openclaw-adapter.test.ts |

**周总工时**: 44h（AI集成） = 44h

#### Week 9: Agent协同引擎 + Block操作

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| Agent协同引擎实现 | AI集成 | 16h | collab-engine.ts（createSession/injectDocumentContext） |
| Block级操作记录 | AI集成 | 8h | recordOperation实现 |
| 用户接受/拒绝机制 | AI集成 | 8h | resolveOperation实现 |
| Block更新Markdown逻辑 | 前端 | 8h | updateMarkdownBlock实现 |
| Sidecar存储集成 | AI集成 | 8h | saveOperationToSidecar（复用review-service） |
| 协同引擎单元测试 | AI集成 | 8h | collab-engine.test.ts |

**周总工时**: 40h（AI集成） + 8h（前端） = 48h

#### Week 10: Agent记忆管理 + 集成验证

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| Agent长期记忆实现 | AI集成 | 8h | AgentMemory持久化 |
| Agent短期记忆实现 | AI集成 | 4h | Session context管理 |
| 记忆持久化到本地 | AI集成 | 4h | .moraya/agent-memory.json |
| Agent角色指令模板 | AI集成 | 8h | buildSystemPrompt实现 |
| Agent集成验证测试 | 测试 | 12h | integration-agent.test.ts |
| Agent使用文档 | 文档 | 4h | agent-guide.md |

**周总工时**: 24h（AI集成） + 12h（测试） + 4h（文档） = 40h

**Phase 3总工时**: 176h（约3.5周）

---

### 4.4 Phase 4: 现有改造 (Week 11-12)

#### Week 11: Sync适配器改造

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| Picora适配器改造 | 云同步 | 12h | picora-adapter.ts（改造为Registry架构） |
| GitHub适配器改造 | 云同步 | 12h | github-adapter.ts（改造为Registry架构） |
| kb-sync改造集成 | 云同步 | 8h | 集成改造后的适配器 |
| 改造后同步验证 | 测试 | 8h | regression-sync.test.ts |
| 改造文档更新 | 文档 | 4h | sync-adapter-migration.md |

**周总工时**: 32h（云同步） + 8h（测试） + 4h（文档） = 44h

#### Week 12: AI Agent适配器改造

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| Claude Agent适配器改造 | AI集成 | 12h | claude-adapter.ts（基于ai-service） |
| ChatGPT Agent适配器改造 | AI集成 | 12h | chatgpt-adapter.ts（基于ai-service） |
| Gemini Agent适配器改造 | AI集成 | 12h | gemini-adapter.ts（基于ai-service） |
| DeepSeek Agent适配器改造 | AI集成 | 12h | deepseek-adapter.ts |
| 改造后Agent验证 | 测试 | 8h | regression-agent.test.ts |
| Agent改造文档 | 文档 | 4h | agent-adapter-migration.md |

**周总工时**: 48h（AI集成） + 8h（测试） + 4h（文档） = 60h

**Phase 4总工时**: 104h（约2周）

---

### 4.5 Phase 5: 前端UI (Week 13-14)

#### Week 13: Agent面板 + 同步UI

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| AgentPanel.svelte实现 | 前端 | 16h | Agent选择、配置、交互面板 |
| AgentStreamPreview.svelte | 前端 | 8h | Agent流式输出实时预览 |
| SyncSettings.svelte实现 | 前端 | 16h | 云平台配置、绑定管理界面 |
| SyncStatusIndicator.svelte | 前端 | 4h | 同步状态实时指示器 |
| UI组件单元测试 | 前端 | 8h | ui-components.test.ts |

**周总工时**: 44h（前端） = 44h

#### Week 14: 冲突解决UI + Operations列表

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| ConflictResolver.svelte | 前端 | 12h | 冲突详情、预览、选择界面 |
| OperationsList.svelte | 前端 | 12h | AI操作待处理列表 |
| AgentThread.svelte | 前端 | 8h | 人机讨论线程组件 |
| UI响应式设计 | 前端 | 8h | Desktop/Web/Mobile适配 |
| UI视觉回归测试 | 测试 | 8h | visual-regression.test.ts |
| UI使用文档 | 文档 | 4h | ui-guide.md |

**周总工时**: 40h（前端） + 8h（测试） + 4h（文档） = 52h

**Phase 5总工时**: 96h（约2周）

---

### 4.6 Phase 6: Web端PWA (Week 15-16)

#### Week 15: @moraya/core抽取

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| Editor核心抽取 | 架构师 | 16h | @moraya/core/editor（ProseMirror基础） |
| AI Service核心抽取 | 架构师 | 12h | @moraya/core/ai（基础AI调用） |
| Sync Engine核心抽取 | 架构师 | 12h | @moraya/core/sync（Diff/CRDT） |
| KB Service核心抽取 | 架构师 | 8h | @moraya/core/kb（基础KB管理） |
| npm包配置 | 架构师 | 4h | package.json、tsconfig.json |
| npm包发布 | 架构师 | 4h | npmjs.com发布 |

**周总工时**: 56h（架构师） = 56h

#### Week 16: Web端实现 + PWA配置

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| SvelteKit SPA配置 | 前端 | 8h | adapter-static配置 |
| IndexedDB存储实现 | 前端 | 12h | IndexedDB封装、KB存储 |
| Service Worker离线缓存 | 前端 | 8h | service-worker.js配置 |
| PWA manifest配置 | 前端 | 4h | manifest.json、图标 |
| Web端首次部署 | 前端 | 8h | GitHub Pages/Vercel部署 |
| Web端集成测试 | 测试 | 8h | web-integration.test.ts |
| Web端使用文档 | 文档 | 4h | web-guide.md |

**周总工时**: 40h（前端） + 8h（测试） + 4h（文档） = 52h

**Phase 6总工时**: 108h（约2周）

---

### 4.7 Phase 7: Mobile端 (Week 17-18)

#### Week 17: Tauri Mobile配置

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| Tauri iOS配置 | Rust | 12h | Info.plist、entitlements、provisioning profile |
| Tauri Android配置 | Rust | 12h | AndroidManifest.xml、gradle配置 |
| Mobile端存储适配 | Rust | 8h | SQLite/IndexedDB适配 |
| Mobile端API适配 | Rust | 8h | 移动端HTTP/WebSocket适配 |
| Mobile端编译测试 | Rust | 8h | iOS/Android编译验证 |

**周总工时**: 48h（Rust） = 48h

#### Week 18: Mobile端UI适配 + 发布

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| Mobile端UI触摸优化 | 前端 | 12h | 触摸事件、手势支持 |
| Mobile端Agent面板适配 | 前端 | 8h | 底部Sheet、手势滑动 |
| Mobile端同步UI适配 | 前端 | 8h | 移动端同步状态显示 |
| iOS TestFlight上传 | Rust | 8h | TestFlight审核提交 |
| Android APK打包 | Rust | 4h | APK签名打包 |
| Mobile端集成测试 | 测试 | 8h | mobile-integration.test.ts |
| Mobile端使用文档 | 文档 | 4h | mobile-guide.md |

**周总工时**: 32h（前端） + 12h（Rust） + 8h（测试） + 4h（文档） = 56h

**Phase 7总工时**: 104h（约2周）

---

### 4.8 Phase 8: 集成测试 (Week 19)

#### Week 19: 全系统集成测试

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 全系统单元测试完善 | 测试 | 16h | 覆盖率提升至80%+ |
| 多终端协同测试 | 测试 | 16h | Desktop/Web/Mobile协同验证 |
| Agent+Cloud集成测试 | 测试 | 12h | Agent修改后自动同步验证 |
| 性能基准测试 | 测试 | 8h | 加载时间、同步延迟测试 |
| Beta版本打包 | Rust | 8h | 所有平台Beta版本打包 |
| Beta版本发布 | PM | 4h | GitHub Releases发布 |
| 用户手册更新 | 文档 | 8h | Wiki更新、新功能文档 |
| Beta反馈收集 | PM | 8h | 社区反馈收集整理 |

**周总工时**: 44h（测试） + 8h（Rust） + 12h（PM） + 8h（文档） = 64h

**Phase 8总工时**: 64h（约1周）

---

### 4.9 Phase 9: HarmonyOS (Week 20-22, 可选)

#### Week 20: 鸿蒙架构决策 + 基础搭建

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 鸿蒙架构决策文档 | 架构师 | 8h | Tauri移植 vs ArkTS原生决策 |
| HarmonyOS项目结构 | Rust/前端 | 12h | entry/src/main目录结构 |
| ArkUI基础组件 | 前端 | 16h | EditorPage.ets基础实现 |
| ArkTS核心移植 | 架构师 | 12h | MarkdownParser.ets移植 |

**周总工时**: 8h（架构师） + 28h（前端） + 12h（Rust） = 48h

#### Week 21: 鸿蒙功能实现

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 鸿蒙Agent服务实现 | AI集成 | 16h | AgentService.ets |
| 鸿蒙飞书同步实现 | 云同步 | 16h | FeishuSyncService.ets |
| 鸿蒙存储实现 | Rust | 8h | SQLite存储封装 |
| 鸿蒙WebSocket实现 | Rust | 8h | 实时同步WebSocket |
| 鸿蒙集成测试 | 测试 | 8h | harmony-integration.test.ts |

**周总工时**: 32h（前端） + 16h（Rust） + 8h（测试） = 56h

#### Week 22: 鸿蒙发布准备

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 鸿蒙应用签名打包 | Rust | 8h | HAP签名打包 |
| 华为应用市场准备 | PM | 8h | 应用市场资料准备 |
| 鸿蒙使用文档 | 文档 | 8h | harmony-guide.md |
| 鸿蒙Beta测试 | 测试 | 8h | 鸿蒙Beta验证 |

**周总工时**: 8h（Rust） + 8h（PM） + 8h（文档） + 8h（测试） = 32h

**Phase 9总工时**: 136h（约3周）

---

## 五、工作量汇总

### 5.1 总工作量统计

| Phase | 时间 | 架构师 | 前端 | Rust | AI集成 | 云同步 | 测试 | 文档 | PM | 总计 |
|-------|------|--------|------|------|--------|--------|------|------|----|----|
| **Phase 1** | Week 1-2 | 48h | 36h | - | - | - | - | - | 4h | 88h |
| **Phase 2** | Week 3-6 | 2h | 12h | 64h | - | 94h | 8h | 4h | - | 184h |
| **Phase 3** | Week 7-10 | - | 8h | 32h | 108h | - | 12h | 4h | - | 164h |
| **Phase 4** | Week 11-12 | - | - | - | 48h | 32h | 16h | 8h | - | 104h |
| **Phase 5** | Week 13-14 | - | 84h | - | - | - | 8h | 4h | - | 96h |
| **Phase 6** | Week 15-16 | 56h | 40h | - | - | - | 8h | 4h | - | 108h |
| **Phase 7** | Week 17-18 | - | 32h | 60h | - | - | 8h | 4h | - | 104h |
| **Phase 8** | Week 19 | - | - | 8h | - | - | 44h | 8h | 12h | 64h |
| **Phase 9 (可选)** | Week 20-22 | 8h | 32h | 24h | - | - | 8h | 8h | 8h | 136h |
| **总计 (不含Phase 9)** | Week 1-19 | 106h | 212h | 164h | 156h | 126h | 96h | 28h | 16h | 868h |
| **总计 (含Phase 9)** | Week 1-22 | 114h | 244h | 188h | 156h | 126h | 104h | 36h | 24h | 1004h |

### 5.2 团队工时分配

| 角色 | 总工时 (不含Phase 9) | 周均工时 | 占比 |
|------|---------------------|----------|------|
| **架构师** | 106h | ~5.6h/周 | 12.2% |
| **前端开发** | 212h | ~11.2h/周 | 24.4% |
| **Rust后端开发** | 164h | ~8.6h/周 | 18.9% |
| **AI集成开发** | 156h | ~8.2h/周 | 18.0% |
| **云同步开发** | 126h | ~6.6h/周 | 14.5% |
| **测试工程师** | 96h | ~5.1h/周 | 11.1% |
| **文档工程师** | 28h | ~1.5h/周 | 3.2% |
| **项目经理** | 16h | ~0.8h/周 | 1.8% |

### 5.3 工作量风险缓冲

**建议增加10%风险缓冲工时**: 868h × 10% = 87h

**调整后总工时**: 868h + 87h = 955h（约19周）

---

## 六、风险评估与应对

### 6.1 技术风险

| 风险 | 等级 | 影响 | 应对策略 |
|------|------|------|----------|
| **飞书API不稳定** | 中 | Phase 2延期 | 1. 建立飞书技术支持联系人<br>2. 准备备用云平台（GitHub） |
| **OpenClaw API文档不完整** | 高 | Phase 3延期 | 1. 前期深入调研OpenClaw团队<br>2. 准备Claude Agent作为备用 |
| **Tauri Mobile不支持某些功能** | 中 | Phase 7延期 | 1. 跟踪Tauri v2 Mobile进展<br>2. 准备React Native备用方案 |
| **ProseMirror Block解析复杂** | 中 | Phase 1延期 | 1. 先实现简单Block验证架构<br>2. 分阶段完善复杂Block |
| **Yjs CRDT性能问题** | 低 | 实时协同不稳定 | 1. 大文档场景测试验证<br>2. 准备Automerge备用方案 |
| **IndexedDB性能瓶颈** | 低 | Web端性能差 | 1. 分库存储优化<br>2. 批量写入优化 |

### 6.2 外部依赖风险

| 风险 | 等级 | 影响 | 应对策略 |
|------|------|------|----------|
| **飞书OAuth审核延迟** | 中 | Phase 2延期 | 1. 提前申请飞书应用审核<br>2. 准备备用OAuth流程 |
| **OpenClaw服务不稳定** | 高 | Phase 3延期 | 1. 建立OpenClaw团队联系方式<br>2. 准备Claude API备用 |
| **npm包审核延迟** | 低 | Phase 6延期 | 1. 提前准备npm包材料<br>2. 准备GitHub Packages备用 |
| **TestFlight审核延迟** | 中 | Phase 7延期 | 1. 提前提交TestFlight申请<br>2. 准备Ad Hoc分发备用 |
| **华为应用市场审核延迟** | 高 | Phase 9延期 | 1. 提前准备应用市场资料<br>2. Phase 9可选，不阻塞主线 |

### 6.3 团队风险

| 风险 | 等级 | 影响 | 应对策略 |
|------|------|------|----------|
| **架构师离职** | 高 | 项目延期严重 | 1. 架构设计文档化、视频录制<br>2. 前端/Rust主力backup架构理解 |
| **关键开发人员请假** | 中 | Phase延期 | 1. 关键任务提前完成<br>2. 团队backup机制 |
| **团队技能不足** | 中 | Phase延期 | 1. 前期技术培训<br>2. 外部技术顾问支持 |
| **沟通协作效率低** | 中 | 集成问题频发 | 1. 每周同步会议<br>2. 架构评审会议<br>3. 文档化关键决策 |

### 6.4 风险应对预算

| 风险等级 | 预留缓冲工时 | 说明 |
|---------|-------------|------|
| **高风险** | 24h | 架构师backup、OpenClaw备用方案 |
| **中风险** | 48h | OAuth审核延迟、TestFlight延迟 |
| **低风险** | 15h | 性能优化、npm审核 |

**总风险缓冲工时**: 87h（已在总工时中包含）

---

## 七、验收标准

### 7.1 Phase验收标准

每个Phase完成后需满足以下验收标准：

#### Phase 1验收标准

- ✓ Sync Registry架构定义完整，至少1个mock adapter验证
- ✓ Agent Registry架构定义完整，至少1个mock adapter验证
- ✓ Markdown Block定义文档化并通过社区review
- ✓ 架构设计文档完成并通过团队评审
- ✓ 代码通过类型检查（pnpm check）

#### Phase 2验收标准

- ✓ 飞书OAuth登录成功获取token
- ✓ 至少1个KB成功绑定飞书文件夹
- ✓ Markdown上传飞书并正确转换
- ✓ 飞书文档下载并转换回Markdown
- ✓ 冲突检测和解决流程验证
- ✓ 单元测试覆盖率≥80%

#### Phase 3验收标准

- ✓ OpenClaw Agent初始化成功
- ✓ Agent至少执行1次co-author操作
- ✓ AI操作正确插入Markdown Block
- ✓ 用户成功接受/拒绝AI操作
- ✓ Sidecar存储正确记录AI操作
- ✓ 单元测试覆盖率≥80%

#### Phase 4验收标准

- ✓ Picora/GitHub同步功能正常（不破坏现有功能）
- ✓ Claude Agent至少执行1次reviewer操作
- ✓ ChatGPT Agent至少执行1次co-author操作
- ✓ 所有改造通过回归测试

#### Phase 5验收标准

- ✓ Agent面板成功切换Agent类型和角色
- ✓ 同步配置成功保存并触发同步
- ✓ 冲突解决界面正确显示并支持选择
- ✓ AI操作列表正确显示并支持确认
- ✓ Agent流式输出实时显示
- ✓ UI组件通过视觉回归测试

#### Phase 6验收标准

- ✓ @moraya/core npm包发布成功
- ✓ Web端访问正常并加载Editor
- ✓ IndexedDB正确存储文档
- ✓ 离线编辑功能验证
- ✓ PWA成功安装到浏览器
- ✓ Web端Agent和同步功能正常

#### Phase 7验收标准

- ✓ iOS应用成功运行并加载Editor
- ✓ Android应用成功运行并加载Editor
- ✓ Mobile端Agent面板正常交互
- ✓ Mobile端云同步功能正常
- ✓ iOS版本上传TestFlight并通过审核
- ✓ Android APK安装成功并运行稳定

#### Phase 8验收标准

- ✓ 所有单元测试通过（覆盖率≥80%）
- ✓ Desktop/Web/Mobile三端协同验证
- ✓ Agent + 飞书同步集成验证
- ✓ 性能基准达标（加载<500ms，同步<2s）
- ✓ Beta版本发布成功
- ✓ 用户手册更新完成

#### Phase 9验收标准 (可选)

- ✓ 鸿蒙应用成功运行并加载Editor
- ✓ 鸿蒙版Agent面板正常交互
- ✓ 鸿蒙版云同步功能正常
- ✓ 鸿蒙应用通过华为应用市场审核（或准备上架）

### 7.2 整体验收标准

项目完成后需满足以下整体验收标准：

**功能验收**:
- ✓ 多终端全覆盖（Desktop/Web/Mobile基础版）
- ✓ 飞书云文档同步成功（首个云平台）
- ✓ OpenClaw Agent协同成功（首个Agent）
- ✓ Markdown Block级AI操作支持
- ✓ Agent操作审计和用户确认机制

**性能验收**:
- ✓ 编辑器加载时间<500ms（Desktop）
- ✓ 编辑器加载时间<800ms（Web/Mobile）
- ✓ 云同步延迟<2s（小文档）
- ✓ 云同步延迟<5s（大文档>100KB）
- ✓ Agent响应首字节<1s
- ✓ 内存占用<200MB（Desktop）

**安全验收**:
- ✓ API Key通过OS Keychain存储
- ✓ 所有API调用通过Rust后端代理
- ✓ CSP强制执行
- ✓ Path Traversal防护验证
- ✓ Agent操作审计日志完整

**文档验收**:
- ✓ 技术设计文档完整
- ✓ 用户使用手册完整
- ✓ API文档完整
- ✓ 开发者文档完整

**社区验收**:
- ✓ Beta版本发布GitHub Releases
- ✓ 社区反馈收集并整理
- ✓ 至少10个Beta测试用户验证
- ✓ Wiki文档更新完成

---

## 八、项目时间表

### 8.1 详细时间表

| Week | Phase | 关键里程碑 | 主要交付物 | 团队协作 |
|------|-------|-----------|-----------|----------|
| **Week 1** | Phase 1 | Registry架构启动 | Sync/Agent Registry类型定义 | 架构师主导、前端辅助 |
| **Week 2** | Phase 1 | [M1] Registry架构完成 | Markdown Block解析器、架构评审 | 前端主导、架构师指导 |
| **Week 3** | Phase 2 | 飞书OAuth启动 | 飞书API调研、OAuth流程设计 | 云同步主导、Rust配合 |
| **Week 4** | Phase 2 | 飞书文档API完成 | 飞书文档操作API、单元测试 | Rust主导 |
| **Week 5** | Phase 2 | 飞书转换器完成 | Markdown ↔ 飞书Block转换器 | 云同步主导 |
| **Week 6** | Phase 2 | [M2] 飞书适配器完成 | 飞书适配器集成、首次同步验证 | 云同步主导、测试配合 |
| **Week 7** | Phase 3 | OpenClaw Agent启动 | OpenClaw API调研、Rust封装 | AI集成主导、Rust配合 |
| **Week 8** | Phase 3 | OpenClaw适配器完成 | OpenClaw适配器、流式响应 | AI集成主导 |
| **Week 9** | Phase 3 | Agent协同引擎完成 | 协同引擎、Block操作记录 | AI集成主导、前端配合 |
| **Week 10** | Phase 3 | [M3] OpenClaw Agent完成 | Agent记忆管理、集成验证 | AI集成主导、测试配合 |
| **Week 11** | Phase 4 | Sync适配器改造 | Picora/GitHub适配器改造 | 云同步主导、测试配合 |
| **Week 12** | Phase 4 | [M4] Agent适配器改造 | Claude/ChatGPT Agent改造 | AI集成主导、测试配合 |
| **Week 13** | Phase 5 | Agent面板完成 | AgentPanel、SyncSettings UI | 前端主导 |
| **Week 14** | Phase 5 | [M5] 前端UI完成 | ConflictResolver、OperationsList UI | 前端主导、测试配合 |
| **Week 15** | Phase 6 | @moraya/core抽取 | Editor/AI/Sync核心抽取 | 架构师主导 |
| **Week 16** | Phase 6 | [M6] Web端PWA完成 | IndexedDB、Service Worker、PWA部署 | 前端主导、测试配合 |
| **Week 17** | Phase 7 | Tauri Mobile配置 | iOS/Android配置、编译验证 | Rust主导 |
| **Week 18** | Phase 7 | [M7] Mobile端完成 | Mobile UI适配、TestFlight上传 | 前端主导、Rust配合 |
| **Week 19** | Phase 8 | [M8] 集成测试完成 | 全系统测试、Beta版本发布 | 测试主导、PM配合 |
| **Week 20** | Phase 9 | 鸿蒙架构决策 | 鸿蒙架构决策、基础搭建 | 架构师主导（可选） |
| **Week 21** | Phase 9 | 鸿蒙功能实现 | 鸿蒙Agent、飞书同步实现 | 前端主导（可选） |
| **Week 22** | Phase 9 | [M9] 鸿蒙版本完成 | 鸿蒙应用打包、发布准备 | Rust主导（可选） |

### 8.2 关键决策点

| 决策点 | 时间 | 决策内容 | 决策标准 |
|--------|------|----------|----------|
| **飞书OAuth方案确认** | Week 3 | 飞书OAuth流程方案 | 飞书开放平台支持、用户体验评估 |
| **OpenClaw Agent角色定义** | Week 7 | Agent角色指令模板 | Agent能力评估、用户需求匹配 |
| **@moraya/core范围确认** | Week 15 | npm包抽取范围 | Web端需求评估、维护成本评估 |
| **Tauri Mobile支持范围** | Week 17 | Tauri Mobile支持功能列表 | Tauri v2 Mobile能力评估 |
| **鸿蒙实现方案决策** | Week 20 | Tauri移植 vs ArkTS原生 | Tauri官方支持情况、性能评估 |

### 8.3 同步会议安排

| 会议类型 | 频率 | 参与人员 | 会议内容 |
|---------|------|----------|----------|
| **每日站会** | 每日15分钟 | 全团队 | 任务进度、阻塞问题 |
| **周同步会** | 每周一1小时 | 全团队 | Phase进度、风险回顾、下周计划 |
| **架构评审会** | Phase 1/2/3完成时 | 架构师+核心开发 | 架构方案评审、技术决策 |
| **Beta反馈会** | Phase 8完成时 | PM+社区代表 | Beta反馈整理、优先级调整 |

---

## 九、项目依赖关系

### 9.1 Phase依赖关系

```
Phase依赖链:
Phase 1 (架构) ─┬─→ Phase 2 (飞书) ─→ Phase 4 (Sync改造)
                │
                └─→ Phase 3 (OpenClaw) ─→ Phase 4 (Agent改造)

Phase 1/2/3/4 ─→ Phase 5 (前端UI)

Phase 1/5 ─→ Phase 6 (Web端)

Phase 1/5/6 ─→ Phase 7 (Mobile端)

Phase 1-7 ─→ Phase 8 (集成测试)

Phase 1-8 ─→ Phase 9 (鸿蒙, 可选)
```

### 9.2 外部依赖

| 依赖项 | 提供方 | 需求时间 | 风险 |
|--------|--------|----------|------|
| **飞书开放平台API文档** | 飞书官方 | Phase 2 Week 3 | 低 |
| **飞书OAuth审核** | 飞书官方 | Phase 2 Week 3-4 | 中 |
| **OpenClaw API文档** | OpenClaw团队 | Phase 3 Week 7 | 高 |
| **OpenClaw API接入咨询** | OpenClaw团队 | Phase 3 Week 7-8 | 高 |
| **Tauri v2 Mobile进展** | Tauri社区 | Phase 7 Week 17 | 中 |
| **npm包审核** | npmjs.com | Phase 6 Week 15-16 | 低 |
| **TestFlight审核** | Apple App Store | Phase 7 Week 18 | 中 |
| **华为应用市场审核** | 华为开发者平台 | Phase 9 Week 22 | 高 |

### 9.3 技术依赖

| 技术依赖 | 版本要求 | 获取方式 | 风险 |
|---------|---------|----------|------|
| **Tauri v2** | ≥2.9, <2.10 | Cargo.toml | 低 |
| **Svelte 5** | ^5.0.0 | npm | 低 |
| **ProseMirror** | via Milkdown v7 | npm | 低 |
| **Yjs** | latest | npm | 低 |
| **markdown-it** | ^14.1 | npm | 低 |
| **Rust 2021** | stable | rustup | 低 |

---

## 十、成功指标

### 10.1 项目成功指标

| 指标类别 | 具体指标 | 目标值 | 测量方式 |
|---------|---------|--------|----------|
| **交付完整性** | Phase完成率 | 100%（Phase 1-8） | 里程碑验收 |
| **功能完整性** | 多终端覆盖率 | 3端（Desktop/Web/Mobile） | 功能列表验收 |
| **功能完整性** | 云平台支持数 | ≥2（飞书+Picora/GitHub） | Adapter注册数 |
| **功能完整性** | Agent支持数 | ≥3（OpenClaw+Claude+ChatGPT） | Agent注册数 |
| **代码质量** | 单元测试覆盖率 | ≥80% | vitest覆盖率报告 |
| **代码质量** | TypeScript类型检查通过率 | 100% | pnpm check结果 |
| **性能** | 编辑器加载时间 | <500ms（Desktop） | 性能基准测试 |
| **性能** | 云同步延迟 | <2s（小文档） | 性能基准测试 |
| **性能** | Agent响应首字节 | <1s | 性能基准测试 |
| **安全** | API Key安全存储 | 100%通过OS Keychain | 安全审计 |
| **安全** | Agent操作审计覆盖率 | 100% | Audit log完整性 |
| **文档** | 技术文档完整度 | ≥90% | 文档评审 |
| **文档** | 用户手册完整度 | ≥90% | Wiki内容评估 |
| **社区** | Beta测试用户数 | ≥10人 | GitHub Releases反馈 |
| **社区** | Beta反馈响应率 | ≥80% | 反馈整理报告 |

### 10.2 Phase成功指标

| Phase | 核心指标 | 目标值 |
|-------|---------|--------|
| **Phase 1** | Registry架构完整性 | 2个Registry + Block定义完整 |
| **Phase 2** | 飞书同步成功率 | ≥90%（首次同步验证） |
| **Phase 3** | OpenClaw Agent操作成功率 | ≥90%（至少1次co-author操作） |
| **Phase 4** | 改造回归测试通过率 | 100%（不破坏现有功能） |
| **Phase 5** | UI组件功能完整性 | 5个关键组件完整 |
| **Phase 6** | Web端功能完整性 | 80%（Editor + Agent + Sync基础） |
| **Phase 7** | Mobile端功能完整性 | 80%（Editor + Agent + Sync基础） |
| **Phase 8** | Beta版本发布成功率 | 100%（所有平台Beta发布） |
| **Phase 9** | 鸿蒙版本功能完整性 | 80%（可选，视Tauri支持） |

### 10.3 团队绩效指标

| 指标 | 目标值 | 测量方式 |
|------|--------|----------|
| **代码提交频率** | ≥3次/周/人 | Git提交统计 |
| **代码审查频率** | ≥1次/周 | PR审查统计 |
| **文档更新频率** | ≥1次/Phase | 文档提交统计 |
| **单元测试编写频率** | ≥1个文件/Phase | 测试文件统计 |
| **会议参与率** | ≥90% | 会议签到统计 |

---

## 十一、项目监控与报告

### 11.1 项目监控机制

| 监控项 | 监控频率 | 监控方式 | 负责人 |
|--------|----------|----------|--------|
| **Phase进度** | 每周 | 里程碑验收 | PM |
| **代码质量** | 每周 | pnpm check + vitest覆盖率 | 架构师 |
| **团队工时** | 每周 | 工时记录表 | PM |
| **风险状态** | 每周 | 风险跟踪表 | PM |
| **外部依赖状态** | 每周 | 依赖状态表 | PM |
| **社区反馈** | 每两周 | GitHub Issues/反馈整理 | PM |

### 11.2 项目报告

| 报告类型 | 频率 | 内容 | 发布对象 |
|---------|------|------|----------|
| **周进度报告** | 每周一 | Phase进度、风险、下周计划 | 团队+ stakeholders |
| **Phase验收报告** | Phase完成时 | 验收标准达成情况、问题记录 | 团队+ stakeholders |
| **Beta反馈报告** | Phase 8完成时 | Beta测试反馈、优先级建议 | 团队+社区 |
| **项目总结报告** | 项目完成时 | 项目成果、经验教训、后续计划 | 团队+ stakeholders+社区 |

### 11.3 问题跟踪

| 问题类型 | 跟踪方式 | 处理流程 | 响应时间 |
|---------|----------|----------|----------|
| **技术阻塞** | GitHub Issue | 团队讨论→架构师决策→实施 | ≤2天 |
| **进度延期** | 项目进度表 | PM评估→调整计划→团队同步 | ≤1天 |
| **外部依赖阻塞** | 依赖状态表 | PM协调→外部沟通→备用方案 | ≤3天 |
| **质量问题** | 代码审查 | 架构师审查→修复→验证 | ≤1天 |

---

## 十二、后续规划

### 12.1 Phase 9后续：HarmonyOS Next

**决策条件**:
- Tauri官方明确支持HarmonyOS → 采用Tauri移植方案（1.5周）
- Tauri不支持HarmonyOS → 采用ArkTS原生方案（3周）

**启动条件**: Phase 8完成且Beta反馈良好

### 12.2 扩展平台规划（Phase 10+）

| 平台 | 优先级 | 工作量预估 | 启动条件 |
|------|--------|-----------|----------|
| **Notion** | P1 | 1.5周 | Phase 8完成 + 用户需求调研 |
| **语雀** | P1 | 1周 | Phase 8完成 + 国内用户需求 |
| **GitLab** | P2 | 1周 | Phase 8完成 + 企业用户需求 |
| **Google Docs** | P2 | 2周 | Phase 8完成 + 国际化需求 |
| **Confluence** | P2 | 2周 | Phase 8完成 + 企业用户需求 |

### 12.3 扩展Agent规划（Phase 11+）

| Agent | 优先级 | 工作量预估 | 启动条件 |
|-------|--------|-----------|----------|
| **Qwen Agent** | P2 | 1周 | Phase 8完成 + 国内用户需求 |
| **GLM Agent** | P2 | 1周 | Phase 8完成 + 国内用户需求 |
| **Mistral Agent** | P2 | 1周 | Phase 8完成 + 开源用户需求 |
| **Custom Agent框架** | P1 | 2周 | Phase 8完成 + 企业用户需求 |

### 12.4 实时协同规划（Phase 12+）

**内容**: Yjs CRDT实时协同编辑

**工作量预估**: 2周

**启动条件**: Phase 8完成 + 多用户协同需求调研

**关键技术点**:
- y-prosemirror绑定
- y-websocket provider
- Yjs Awareness（在线状态）
- 大文档性能优化

---

## 十三、项目预算估算

### 13.1 人力成本估算（假设）

| 角色 | 人数 | 周均工时 | 周数 | 总工时 | 单位成本（假设） | 总成本 |
|------|------|----------|------|--------|----------------|--------|
| **项目负责人** | 1 | 0.8h | 19 | 16h | $50/h | $800 |
| **架构师** | 1 | 5.6h | 19 | 106h | $80/h | $8,480 |
| **前端开发** | 2 | 5.6h/人 | 19 | 212h | $60/h | $12,720 |
| **Rust后端开发** | 1 | 8.6h | 19 | 164h | $70/h | $11,480 |
| **AI集成开发** | 1 | 8.2h | 19 | 156h | $70/h | $10,920 |
| **云同步开发** | 1 | 6.6h | 19 | 126h | $70/h | $8,820 |
| **测试工程师** | 1 | 5.1h | 19 | 96h | $50/h | $4,800 |
| **文档工程师** | 1 | 1.5h | 19 | 28h | $40/h | $1,120 |

**总人力成本（不含Phase 9）**: $60,240

**含Phase 9总人力成本**: $60,240 + $10,880 = $71,120

### 13.2 外部服务成本

| 服务 | 成本 | 说明 |
|------|------|------|
| **飞书开放平台** | 免费 | 开发者账号免费 |
| **OpenClaw API** | 按使用计费 | 开发阶段免费额度 |
| **npmjs.com发布** | 免费 | npm包发布免费 |
| **TestFlight** | 免费 | Apple开发者账号（$99/年） |
| **华为应用市场** | 免费 | 开发者账号注册费 |
| **GitHub Releases** | 免费 | 开源项目免费 |
| **云服务器（可选）** | $50/月 | WebSocket协同服务器（可选） |

**总外部服务成本**: ≈$0（开源免费） + 可选$50/月

### 13.3 工具与软件成本

| 工具 | 成本 | 说明 |
|------|------|------|
| **IDE（VSCode）** | 免费 | 开源免费 |
| **Git（GitHub）** | 免费 | 开源项目免费 |
| **CI/CD（GitHub Actions）** | 免费 | 公开仓库免费 |
| **测试工具（vitest）** | 免费 | 开源免费 |
| **设计工具（Figma）** | 免费 | 个人免费版 |

**总工具成本**: $0

---

## 十四、项目关键成功因素

### 14.1 技术成功因素

1. **架构设计清晰**: Registry + Adapter架构定义明确，扩展性强
2. **核心抽取合理**: @moraya/core抽取范围合理，复用度高
3. **API集成稳定**: 飞书/OpenClaw API集成稳定，错误处理完善
4. **性能优化到位**: 编辑器/同步/Agent性能达标
5. **测试覆盖完整**: 单元测试覆盖率≥80%，集成测试完整

### 14.2 团队成功因素

1. **架构师稳定**: 架构师全程参与，架构设计一致性
2. **团队技能匹配**: 团队技能匹配项目需求
3. **沟通协作高效**: 每周同步会议、架构评审、文档化决策
4. **backup机制**: 关键角色backup，降低人员风险

### 14.3 外部成功因素

1. **飞书支持及时**: 飞书开放平台API文档完整、技术支持及时
2. **OpenClaw支持及时**: OpenClaw团队API接入咨询及时
3. **Tauri进展跟踪**: Tauri Mobile/HarmonyOS进展及时跟踪
4. **社区反馈积极**: Beta测试用户反馈积极、Bug报告及时

---

## 十五、项目总结

### 15.1 项目核心成果

1. **多终端全覆盖**: Desktop/Web/Mobile三端基础版本
2. **云同步可扩展**: 首个飞书适配器 + Registry架构
3. **AI Agent可扩展**: 首个OpenClaw Agent + Registry架构
4. **Markdown协同**: Block级AI操作 + Sidecar存储
5. **架构文档**: 完整架构设计文档 + 技术选型文档

### 15.2 项目风险总结

- **高风险**: OpenClaw API文档不完整、架构师离职
- **中风险**: 飞书OAuth审核延迟、TestFlight审核延迟、关键开发人员请假
- **低风险**: IndexedDB性能瓶颈、npm包审核延迟

### 15.3 项目经验教训（预判）

1. **架构先行**: Phase 1架构设计充分，后续Phase更顺利
2. **文档化决策**: 架构评审、技术决策文档化，团队协作更高效
3. **风险缓冲**: 10%工时缓冲，降低延期风险
4. **外部依赖管理**: 前期沟通飞书/OpenClaw，降低API集成风险
5. **backup机制**: 关键角色backup，降低人员风险

### 15.4 项目后续展望

- **扩展平台**: Notion/语雀/GitLab等（Phase 10+）
- **扩展Agent**: Qwen/GLM/Mistral等（Phase 11+）
- **实时协同**: Yjs CRDT实时编辑（Phase 12+）
- **企业功能**: 权限管理、审计合规（Phase 13+）
- **商业化**: 订阅计划、企业版（Phase 14+）

---

**文档版本**: v1.0  
**最后更新**: 2026-05-07  
**审核状态**: 待审核  
**下一步**: 基于此项目计划启动Phase 1

---

## 附录：关键文档索引

| 文档名称 | 路径 | 说明 |
|---------|------|------|
| **方案设计文档** | docs/design-multi-terminal-ai-collab-platform.md | 架构设计、技术选型 |
| **项目计划文档** | docs/project-plan-multi-terminal-ai-collab-platform.md | 本文档 |
| **技术选型文档** | docs/tech-stack.md（待创建） | 详细技术选型分析 |
| **飞书API文档** | docs/feishu-api-spec.md（待创建） | 飞书开放平台API调研 |
| **OpenClaw API文档** | docs/openclaw-api-spec.md（待创建） | OpenClaw API调研 |
| **Markdown Block规范** | docs/design-markdown-block.md（待创建） | AI操作Block定义 |
| **用户手册** | Wiki（待更新） | 新功能使用指南 |
| **开发者文档** | docs/developer-guide.md（待创建） | Adapter开发指南 |