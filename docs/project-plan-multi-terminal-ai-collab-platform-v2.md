# Moraya 多终端 AI 协同 Markdown 平台 - 项目计划文档（简化版v2）

**版本**: v2.0  
**日期**: 2026-05-07  
**项目代号**: Moraya-X  
**项目周期**: 7-8周（约2个月）  
**项目类型**: OpenClaw对接 + 飞书文档同步

---

## 一、项目概述

### 1.1 项目背景

基于现有Moraya开源项目，利用OpenClaw中间层能力，实现飞书文档同步。

**关键前提**: OpenClaw已具备飞书平台对接能力
- OpenClaw Agent可调用飞书API
- OpenClaw已实现Markdown ↔ 飞书Block转换
- OpenClaw已实现飞书OAuth认证
- OpenClaw支持飞书实时订阅

### 1.2 项目目标（简化版）

**核心目标**:
- 对接OpenClaw API，实现文档上传/下载/同步
- 本地KB文件编辑 + 变更监听
- 首次同步 + 增量同步流程
- 同步状态反馈 + 状态指示器
- Desktop端优先（后续扩展Web/Mobile）

**不包含范围**:
- ❌ 飞书API直接封装（OpenClaw已实现）
- ❌ Markdown ↔ 飞书Block转换器（OpenClaw已实现）
- ❌ 飞书OAuth实现（OpenClaw已实现）
- ❌ Sync Adapter Registry（简化为单适配器）
- ❌ AI Agent角色系统（简化为sync-agent）

### 1.3 项目范围

**包含范围**:
- AI Agent Registry基础架构（简化版）
- OpenClawSyncAdapter实现
- Rust后端OpenClaw API封装
- 本地文件监听服务
- 同步引擎实现
- 前端同步UI
- 单元测试 + 集成测试

**不包含范围**:
- Web端开发（后续Phase 8）
- Mobile端开发（后续Phase 9）
- HarmonyOS支持（后续Phase 10，可选）
- 多云平台扩展（后续Phase 11）

---

## 二、团队与角色分工

### 2.1 团队组成（精简版）

| 角色 | 人数 | 职责 | 技能要求 |
|------|------|------|----------|
| **项目负责人 (PM)** | 1 | 项目规划、进度管理、OpenClaw协调 | 项目管理经验、技术背景 |
| **架构师** | 1 | 架构设计、核心代码编写、代码审查 | TypeScript/Rust/Svelte |
| **前端开发** | 2 | Svelte组件开发、UI实现 | Svelte/TypeScript |
| **Rust后端开发** | 1 | Rust Command实现、API封装 | Rust/reqwest/tauri |
| **集成开发** | 1 | OpenClaw适配器、同步引擎、文件监听 | TypeScript/API集成 |
| **测试工程师** | 1 | 自动化测试、集成测试 | vitest/playwright |

**总人数**: 6人（核心团队，精简版）

### 2.2 角色分工矩阵

| Phase | PM | 架构师 | 前端 | Rust | 集成开发 | 测试 |
|-------|----|----|------|------|---------|------|
| **Phase 1** | 协调 | 主导 | 辅助 | 辅助 | 辅助 | - |
| **Phase 2** | 协调 | 指导 | 配合 | 主导 | 主导 | 辅助 |
| **Phase 3** | 协调 | 指导 | 配合 | 主导 | 主导 | 辅助 |
| **Phase 4** | 协调 | 指导 | 配合 | 辅助 | 主导 | 辅助 |
| **Phase 5** | 协调 | 指导 | 主导 | 辅助 | 辅助 | 辅助 |
| **Phase 6** | 协调 | 指导 | 配合 | 配合 | 配合 | 主导 |
| **Phase 7** | 协调 | 指导 | 主导 | 配合 | 配合 | 辅助 |

### 2.3 外部协作（精简）

| 协作方 | 协作内容 | 协作频率 |
|--------|----------|----------|
| **OpenClaw团队** | API文档咨询、接口调试、契约确认 | 每周2次 |
| **飞书开放平台** | 文档参考、API限制咨询（通过OpenClaw） | 每周1次 |

---

## 三、项目里程碑规划（简化版）

### 3.1 总体里程碑

```
Timeline (7-8周):
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: 核心架构 (Week 1)                                  │
│ [M1] AI Agent Registry完成                                 │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: OpenClaw同步适配器 (Week 2-3)                      │
│ [M2] OpenClawSyncAdapter + API封装完成                      │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: 本地文件监听 (Week 4)                              │
│ [M3] 文件监听服务 + 变更队列完成                             │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: 同步流程实现 (Week 5)                              │
│ [M4] 首次同步 + 增量同步流程完成                             │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: 前端同步UI (Week 6)                                │
│ [M5] 同步配置 + 状态指示器 + 同步按钮完成                     │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 6: 集成测试 (Week 7)                                  │
│ [M6] 全系统集成测试 + Beta版本发布                           │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 7: 文档 + 发布准备 (Week 8, 可选)                     │
│ [M7] 用户手册 + 技术文档 + 正式发布准备                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 详细里程碑

#### Milestone 1: 核心架构完成 (Week 1)

**交付物**:
- AI Agent Registry架构代码 (types.ts + registry.ts)
- OpenClawConfig Schema定义
- AgentRole枚举定义（sync-agent）
- 架构设计文档完成

**验收标准**:
- ✓ Registry接口定义完整并通过类型检查
- ✓ 至少1个mock adapter验证架构可行性
- ✓ OpenClawConfig定义文档化

#### Milestone 2: OpenClaw同步适配器完成 (Week 3)

**交付物**:
- OpenClawSyncAdapter完整实现
- Rust后端OpenClaw API封装（6个command）
- OpenClaw API单元测试
- 首次连接验证成功

**验收标准**:
- ✓ OpenClaw testConnection成功
- ✓ 至少1个文档成功上传到飞书（通过OpenClaw）
- ✓ 至少1个飞书文档成功下载（通过OpenClaw）
- ✓ 单元测试覆盖率≥80%

#### Milestone 3: 文件监听服务完成 (Week 4)

**交付物**:
- FileWatcher服务实现
- 文件变更事件监听
- 变更队列管理
- 本地Manifest维护

**验收标准**:
- ✓ 文件监听成功启动
- ✓ 文件变更事件正确触发
- ✓ 变更队列正确入队
- ✓ 本地Manifest正确维护

#### Milestone 4: 同步流程完成 (Week 5)

**交付物**:
- SyncEngine完整实现
- 首次同步上传流程（KB → 飞书）
- 首次同步下载流程（飞书 → KB）
- 增量同步流程（变更通知）
- 实时订阅（飞书 → KB）

**验收标准**:
- ✓ KB首次同步到飞书成功
- ✓ 飞书文档首次下载到KB成功
- ✓ 本地变更通知OpenClaw成功
- ✓ 飞书实时变更监听成功

#### Milestone 5: 前端同步UI完成 (Week 6)

**交付物**:
- OpenClaw配置表单
- 飞书绑定创建UI
- 同步状态指示器
- 手动同步按钮
- 同步历史查看

**验收标准**:
- ✓ OpenClaw配置成功保存
- ✓ KB ↔ 飞书绑定成功创建
- ✓ 同步状态正确显示
- ✓ 手动同步成功触发
- ✓ 同步历史正确查看

#### Milestone 6: 集成测试完成 (Week 7)

**交付物**:
- 全系统集成测试套件
- OpenClaw连接 + 同步测试
- 文件监听 + 增量同步测试
- Beta版本发布

**验收标准**:
- ✓ 所有单元测试通过（覆盖率≥80%）
- ✓ 首次同步流程完整验证
- ✓ 增量同步流程完整验证
- ✓ 实时订阅流程完整验证
- ✓ Beta版本发布成功

#### Milestone 7: 文档 + 发布准备 (Week 8, 可选)

**交付物**:
- 用户使用手册
- OpenClaw对接技术文档
- API契约文档
- 正式发布准备

**验收标准**:
- ✓ 用户手册涵盖所有同步功能
- ✓ OpenClaw对接文档完整
- ✓ API契约文档完整
- ✓ 正式发布准备完成

---

## 四、详细工作计划

### 4.1 Phase 1: 核心架构 (Week 1)

#### Week 1: AI Agent Registry基础架构

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| AI Agent Registry类型定义 | 架构师 | 8h | types.ts (AgentType, Adapter接口) |
| AI Agent Registry实现 | 架构师 | 4h | registry.ts (register/get) |
| OpenClawConfig Schema定义 | 架构师 | 4h | types.ts: OpenClawConfig |
| AgentRole枚举定义 | 架构师 | 1h | types.ts: AgentRole (sync-agent) |
| 架构设计文档完善 | 架构师 | 8h | design-multi-terminal-v2.md |
| 架构评审（团队） | PM | 4h | 评审会议记录 |

**周总工时**: 25h（架构师） + 4h（PM） = 29h

---

### 4.2 Phase 2: OpenClaw同步适配器 (Week 2-3)

#### Week 2: OpenClaw适配器 + Rust API基础

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| OpenClawSyncAdapter类实现 | 集成开发 | 16h | openclaw-sync-adapter.ts |
| validateConfig + testConnection | 集成开发 | 6h | 适配器方法 |
| Rust后端OpenClaw连接测试 | Rust | 8h | openclaw_test_connection command |
| Rust后端OpenClaw文档上传 | Rust | 12h | openclaw_upload_doc command |
| Rust后端OpenClaw文档下载 | Rust | 12h | openclaw_download_doc command |
| OpenClaw API调研文档 | PM | 8h | openclaw-api-spec.md |
| OpenClaw API契约确认 | PM | 8h | 与OpenClaw团队沟通 |

**周总工时**: 22h（集成开发） + 32h（Rust） + 16h（PM） = 70h

#### Week 3: OpenClaw适配器完善 + Rust API扩展

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| uploadDocument + downloadDocument | 集成开发 | 24h | 适配器核心方法 |
| listDocuments + getSyncStatus | 集成开发 | 16h | 适配器辅助方法 |
| Rust后端OpenClaw文档列表 | Rust | 8h | openclaw_list_docs command |
| Rust后端OpenClaw同步状态 | Rust | 8h | openclaw_sync_status command |
| Rust后端OpenClaw变更通知 | Rust | 8h | openclaw_notify_change command |
| Rust后端OpenClaw WebSocket订阅 | Rust | 16h | openclaw_watch_sync command |
| OpenClaw适配器单元测试 | 测试 | 8h | openclaw-sync-adapter.test.ts |

**周总工时**: 40h（集成开发） + 32h（Rust） + 8h（测试） = 80h

**Phase 2总工时**: 150h

---

### 4.3 Phase 3: 本地文件监听 (Week 4)

#### Week 4: 文件监听服务 + 变更队列

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| FileWatcher类实现 | 集成开发 | 12h | file-watcher.ts |
| 文件变更事件监听 | 集成开发 | 8h | listen file-change事件 |
| 变更队列管理 | 集成开发 | 12h | sync-queue.ts |
| 本地Manifest维护 | 集成开发 | 8h | local-manifest.ts |
| Rust后端文件监听命令 | Rust | 16h | start_file_watch / stop_file_watch |
| 文件监听单元测试 | 测试 | 8h | file-watcher.test.ts |

**周总工时**: 40h（集成开发） + 16h（Rust） + 8h（测试） = 64h

---

### 4.4 Phase 4: 同步流程实现 (Week 5)

#### Week 5: SyncEngine完整实现

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| SyncEngine类实现 | 集成开发 | 16h | sync-engine.ts |
| initialize + triggerSync | 集成开发 | 12h | 同步初始化 + 手动触发 |
| firstSyncUpload | 集成开发 | 12h | KB → 飞书首次上传 |
| firstSyncDownload | 集成开发 | 12h | 飞书 → KB首次下载 |
| notifyOpenClaw (增量同步) | 集成开发 | 8h | 变更通知 |
| startRealtimeSync | 集成开发 | 8h | 实时订阅飞书变更 |
| 同步流程单元测试 | 测试 | 8h | sync-engine.test.ts |

**周总工时**: 56h（集成开发） + 8h（测试） = 64h

---

### 4.5 Phase 5: 前端同步UI (Week 6)

#### Week 6: 同步配置 + 状态指示器

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| OpenClaw配置表单 | 前端 | 8h | OpenClawConfigForm.svelte |
| 飞书绑定创建UI | 前端 | 12h | KbFeishuBindDialog.svelte |
| 同步状态指示器 | 前端 | 8h | SyncStatusIndicator.svelte |
| 手动同步按钮 | 前端 | 4h | Sidebar.svelte集成 |
| 同步历史查看 | 前端 | 8h | SyncHistory.svelte |
| UI响应式设计 | 前端 | 4h | Desktop适配 |
| 前端UI测试 | 测试 | 8h | sync-ui.test.ts |

**周总工时**: 36h（前端） + 8h（测试） = 44h

---

### 4.6 Phase 6: 集成测试 (Week 7)

#### Week 7: 全系统集成测试

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 全系统单元测试完善 | 测试 | 16h | 覆盖率提升至80% |
| OpenClaw连接测试 | 测试 | 8h | openclaw-connection.test.ts |
| 文档上传下载测试 | 测试 | 8h | openclaw-sync.test.ts |
| 文件监听测试 | 测试 | 8h | file-watcher.test.ts |
| 增量同步测试 | 测试 | 8h | incremental-sync.test.ts |
| 实时订阅测试 | 测试 | 8h | realtime-sync.test.ts |
| Beta版本打包 | Rust | 8h | Desktop Beta版本 |
| Beta版本发布 | PM | 4h | GitHub Releases |

**周总工时**: 44h（测试） + 8h（Rust） + 4h（PM） = 56h

---

### 4.7 Phase 7: 文档 + 发布准备 (Week 8, 可选)

#### Week 8: 文档 + 正式发布

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 用户使用手册 | PM | 12h | Wiki更新 |
| OpenClaw对接技术文档 | 架构师 | 8h | openclaw-integration.md |
| API契约文档 | PM | 8h | openclaw-api-contract.md |
| 正式版本打包 | Rust | 8h | Desktop正式版本 |
| 正式版本发布准备 | PM | 8h | 发布材料准备 |
| 社区反馈收集 | PM | 8h | Beta反馈整理 |

**周总工时**: 36h（PM） + 8h（架构师） + 8h（Rust） = 52h

---

## 五、工作量汇总（简化版）

### 5.1 总工作量统计

| Phase | 时间 | 架构师 | 前端 | Rust | 集成开发 | 测试 | PM | 总计 |
|-------|------|--------|------|------|---------|------|----|----|
| **Phase 1** | Week 1 | 25h | - | - | - | - | 4h | 29h |
| **Phase 2** | Week 2-3 | - | - | 64h | 62h | 8h | 16h | 150h |
| **Phase 3** | Week 4 | - | - | 16h | 40h | 8h | - | 64h |
| **Phase 4** | Week 5 | - | - | - | 56h | 8h | - | 64h |
| **Phase 5** | Week 6 | - | 36h | - | - | 8h | - | 44h |
| **Phase 6** | Week 7 | - | - | 8h | - | 44h | 4h | 56h |
| **Phase 7 (可选)** | Week 8 | 8h | - | 8h | - | - | 36h | 52h |
| **总计 (不含Phase 7)** | Week 1-7 | 25h | 36h | 88h | 158h | 68h | 24h | 407h |
| **总计 (含Phase 7)** | Week 1-8 | 33h | 36h | 96h | 158h | 68h | 60h | 459h |

### 5.2 团队工时分配

| 角色 | 总工时 (不含Phase 7) | 周均工时 | 占比 |
|------|---------------------|----------|------|
| **架构师** | 25h | ~4h/周 | 6.1% |
| **前端开发** | 36h | ~6h/周 | 8.8% |
| **Rust后端开发** | 88h | ~14.7h/周 | 21.6% |
| **集成开发** | 158h | ~26.3h/周 | 38.8% |
| **测试工程师** | 68h | ~11.3h/周 | 16.7% |
| **项目经理** | 24h | ~4h/周 | 5.9% |

### 5.3 工作量风险缓冲

**建议增加10%风险缓冲工时**: 407h × 10% = 41h

**调整后总工时**: 407h + 41h = 448h（约7.5周）

---

## 六、风险评估与应对（简化版）

### 6.1 技术风险

| 风险 | 等级 | 影响 | 应对策略 |
|------|------|------|----------|
| **OpenClaw API不稳定** | 高 | Phase 2延期 | 1. 建立OpenClaw团队技术支持联系<br>2. 准备备用同步方案（手动同步） |
| **OpenClaw API文档不完整** | 高 | Phase 2延期 | 1. 前期深入调研OpenClaw团队<br>2. API契约提前确认 |
| **OpenClaw飞书对接能力不足** | 中 | 同步功能受限 | 1. 与OpenClaw团队确认飞书支持范围<br>2. 准备降级方案（仅支持基础同步） |
| **文件监听性能问题** | 低 | 变更检测延迟 | 1. 文件监听性能测试<br>2. 批量变更队列优化 |

### 6.2 外部依赖风险

| 风险 | 等级 | 影响 | 应对策略 |
|------|------|------|----------|
| **OpenClaw API接入咨询延迟** | 高 | Phase 2延期 | 1. 提前联系OpenClaw团队<br>2. 准备API契约文档模板 |
| **OpenClaw服务不稳定** | 中 | 同步失败 | 1. OpenClaw连接重试机制<br>2. 同步失败降级提示 |
| **飞书API限制（通过OpenClaw）** | 低 | 同步频率限制 | 1. 通过OpenClaw确认飞书限制<br>2. 同步频率控制 |

### 6.3 团队风险

| 风险 | 等级 | 影响 | 应对策略 |
|------|------|------|----------|
| **架构师离职** | 高 | 项目延期严重 | 1. 架构设计文档化<br>2. 集成开发backup架构理解 |
| **关键开发人员请假** | 中 | Phase延期 | 1. 关键任务提前完成<br>2. 团队backup机制 |
| **团队技能不足** | 低 | 开发效率低 | 1. 前期技术培训<br>2. OpenClaw API文档学习 |

### 6.4 风险应对预算

| 风险等级 | 预留缓冲工时 | 说明 |
|---------|-------------|------|
| **高风险** | 20h | OpenClaw API不稳定、架构师离职 |
| **中风险** | 15h | OpenClaw咨询延迟、服务不稳定 |
| **低风险** | 6h | 文件监听性能、飞书限制 |

**总风险缓冲工时**: 41h（已在总工时中包含）

---

## 七、验收标准（简化版）

### 7.1 Phase验收标准

每个Phase完成后需满足以下验收标准：

#### Phase 1验收标准

- ✓ AI Agent Registry架构定义完整
- ✓ OpenClawConfig定义文档化
- ✓ AgentRole枚举定义完整
- ✓ 代码通过类型检查（pnpm check）

#### Phase 2验收标准

- ✓ OpenClaw testConnection成功
- ✓ 至少1个文档成功上传到飞书（通过OpenClaw）
- ✓ 至少1个飞书文档成功下载（通过OpenClaw）
- ✓ OpenClaw文档列表获取成功
- ✓ 单元测试覆盖率≥80%

#### Phase 3验收标准

- ✓ 文件监听成功启动
- ✓ 文件变更事件正确触发
- ✓ 变更队列正确入队
- ✓ 本地Manifest正确维护

#### Phase 4验收标准

- ✓ KB首次同步到飞书成功（至少3个文档）
- ✓ 飞书文档首次下载到KB成功（至少3个文档）
- ✓ 本地变更通知OpenClaw成功
- ✓ 飞书实时变更监听成功（至少1个变更事件）

#### Phase 5验收标准

- ✓ OpenClaw配置成功保存
- ✓ KB ↔ 飞书绑定成功创建
- ✓ 同步状态正确显示（idle/syncing/success/error）
- ✓ 手动同步成功触发
- ✓ 同步历史正确查看

#### Phase 6验收标准

- ✓ 所有单元测试通过（覆盖率≥80%）
- ✓ 首次同步流程完整验证（KB ↔ 飞书）
- ✓ 增量同步流程完整验证（变更通知）
- ✓ 实时订阅流程完整验证（飞书变更）
- ✓ Beta版本发布成功

#### Phase 7验收标准 (可选)

- ✓ 用户手册涵盖所有同步功能
- ✓ OpenClaw对接文档完整
- ✓ API契约文档完整
- ✓ 正式发布准备完成

### 7.2 整体验收标准

项目完成后需满足以下整体验收标准：

**功能验收**:
- ✓ OpenClaw对接成功（连接测试通过）
- ✓ 文档上传下载成功（通过OpenClaw）
- ✓ 首次同步成功（KB ↔ 飞书）
- ✓ 增量同步成功（本地变更通知）
- ✓ 实时订阅成功（飞书变更监听）
- ✓ 同步状态正确显示

**性能验收**:
- ✓ 文件监听延迟<1s
- ✓ 同步上传延迟<5s（小文档）
- ✓ 同步下载延迟<5s（小文档）
- ✓ 同步状态更新延迟<3s

**安全验收**:
- ✓ OpenClaw API Key通过OS Keychain存储
- ✓ 所有OpenClaw API调用通过Rust后端代理
- ✓ CSP强制执行

**文档验收**:
- ✓ 用户手册完整
- ✓ OpenClaw对接文档完整
- ✓ API契约文档完整

**社区验收**:
- ✓ Beta版本发布GitHub Releases
- ✓ 至少5个Beta测试用户验证
- ✓ Wiki文档更新完成

---

## 八、项目时间表（简化版）

### 8.1 详细时间表

| Week | Phase | 关键里程碑 | 主要交付物 | 团队协作 |
|------|-------|-----------|-----------|----------|
| **Week 1** | Phase 1 | Registry架构启动 | AI Agent Registry + OpenClawConfig | 架构师主导 |
| **Week 2** | Phase 2 | OpenClaw API调研 | OpenClaw API文档 + 契约确认 | PM主导 + Rust配合 |
| **Week 3** | Phase 2 | [M2] 适配器完成 | OpenClawSyncAdapter + 6个command | 集成开发主导 |
| **Week 4** | Phase 3 | 文件监听启动 | FileWatcher + 变更队列 | 集成开发主导 |
| **Week 5** | Phase 4 | [M4] 同步流程完成 | SyncEngine + 首次/增量同步 | 集成开发主导 |
| **Week 6** | Phase 5 | 前端UI开发 | 配置表单 + 状态指示器 | 前端主导 |
| **Week 7** | Phase 6 | [M6] 集成测试完成 | 全系统测试 + Beta发布 | 测试主导 |
| **Week 8** | Phase 7 | [M7] 文档 + 发布（可选） | 用户手册 + 正式发布 | PM主导 |

### 8.2 关键决策点

| 决策点 | 时间 | 决策内容 | 决策标准 |
|--------|------|----------|----------|
| **OpenClaw API契约确认** | Week 2 | OpenClaw API接口定义确认 | OpenClaw团队明确API契约 |
| **OpenClaw飞书支持范围确认** | Week 2 | 飞书同步功能范围 | OpenClaw飞书支持能力评估 |
| **文件监听性能方案** | Week 4 | 文件监听实现方案 | 性能测试结果达标 |

### 8.3 同步会议安排

| 会议类型 | 频率 | 参与人员 | 会议内容 |
|---------|------|----------|----------|
| **每日站会** | 每日15分钟 | 全团队 | 任务进度、阻塞问题 |
| **周同步会** | 每周一1小时 | 全团队 | Phase进度、风险回顾 |
| **OpenClaw API协调会** | Week 2每周2次 | PM + 架构师 + OpenClaw团队 | API契约确认、接口调试 |
| **Beta反馈会** | Week 7完成时 | PM + 社区代表 | Beta反馈整理 |

---

## 九、项目依赖关系（简化版）

### 9.1 Phase依赖关系

```
Phase依赖链:
Phase 1 (AI Agent Registry)
    ↓
Phase 2 (OpenClaw适配器 + Rust API)
    ↓
Phase 3 (文件监听)
    ↓
Phase 4 (同步流程)
    ↓
Phase 5 (前端同步UI)
    ↓
Phase 6 (集成测试)
    ↓
Phase 7 (文档 + 发布, 可选)
```

### 9.2 外部依赖

| 依赖项 | 提供方 | 需求时间 | 风险 |
|--------|--------|----------|------|
| **OpenClaw API文档** | OpenClaw团队 | Phase 2 Week 2 | 高 |
| **OpenClaw API契约确认** | OpenClaw团队 | Phase 2 Week 2 | 高 |
| **OpenClaw飞书支持范围确认** | OpenClaw团队 | Phase 2 Week 2 | 中 |
| **OpenClaw API接入调试支持** | OpenClaw团队 | Phase 2 Week 2-3 | 高 |

### 9.3 技术依赖

| 技术依赖 | 版本要求 | 获取方式 | 风险 |
|---------|---------|----------|------|
| **Tauri v2** | ≥2.9 | Cargo.toml | 低 |
| **Svelte 5** | ^5.0 | npm | 低 |
| **ProseMirror** | via Milkdown v7 | npm | 低 |
| **Rust 2021** | stable | rustup | 低 |
| **OpenClaw API** | 需确认契约 | 外部服务 | 高 |

---

## 十、成功指标（简化版）

### 10.1 项目成功指标

| 指标类别 | 具体指标 | 目标值 | 测量方式 |
|---------|---------|--------|----------|
| **交付完整性** | Phase完成率 | 100%（Phase 1-6） | 里程碑验收 |
| **功能完整性** | OpenClaw对接成功率 | ≥90%（连接测试） | 功能验收 |
| **功能完整性** | 文档同步成功率 | ≥90%（首次同步） | 功能验收 |
| **代码质量** | 单元测试覆盖率 | ≥80% | vitest覆盖率 |
| **代码质量** | TypeScript类型检查 | 100%通过 | pnpm check |
| **性能** | 文件监听延迟 | <1s | 性能基准 |
| **性能** | 同步上传延迟 | <5s（小文档） | 性能基准 |
| **安全** | API Key安全存储 | 100%通过OS Keychain | 安全审计 |
| **文档** | 文档完整度 | ≥90% | 文档评审 |
| **社区** | Beta测试用户数 | ≥5人 | GitHub Releases反馈 |

### 10.2 Phase成功指标

| Phase | 核心指标 | 目标值 |
|-------|---------|--------|
| **Phase 1** | Registry架构完整性 | 2个文件完整（types.ts + registry.ts） |
| **Phase 2** | OpenClaw连接成功率 | ≥90% |
| **Phase 3** | 文件监听成功率 | ≥95%（变更事件触发） |
| **Phase 4** | 首次同步成功率 | ≥90%（KB ↔ 飞书） |
| **Phase 5** | UI功能完整性 | 5个组件完整 |
| **Phase 6** | Beta版本发布成功率 | 100%（Desktop Beta发布） |

---

## 十一、项目监控与报告（简化版）

### 11.1 项目监控机制

| 监控项 | 监控频率 | 监控方式 | 负责人 |
|--------|----------|----------|--------|
| **Phase进度** | 每周 | 里程碑验收 | PM |
| **代码质量** | 每周 | pnpm check + vitest | 架构师 |
| **团队工时** | 每周 | 工时记录表 | PM |
| **风险状态** | 每周 | 风险跟踪表 | PM |
| **外部依赖状态** | 每周 | 依赖状态表 | PM |
| **OpenClaw API状态** | 每周 | OpenClaw连接测试 | PM |

### 11.2 项目报告

| 报告类型 | 频率 | 内容 | 发布对象 |
|---------|------|------|----------|
| **周进度报告** | 每周一 | Phase进度、风险、下周计划 | 团队 |
| **Phase验收报告** | Phase完成时 | 验收标准达成情况 | 团队 |
| **Beta反馈报告** | Phase 6完成时 | Beta测试反馈 | 团队+社区 |
| **项目总结报告** | 项目完成时 | 项目成果、经验教训 | 团队+社区 |

---

## 十二、后续规划（简化版）

### 12.1 Phase 8: Web端支持（后续）

**工作量预估**: 2周

**关键任务**:
- @moraya/core抽取
- SvelteKit PWA配置
- IndexedDB存储

### 12.2 Phase 9: Mobile端支持（后续）

**工作量预估**: 2周

**关键任务**:
- Tauri v2 iOS/Android
- 移动端UI适配

### 12.3 Phase 10: HarmonyOS支持（可选）

**工作量预估**: 3周

**决策条件**: 等Tauri官方支持或ArkTS原生

### 12.4 Phase 11: 多云平台支持（后续）

**工作量预估**: 1周/平台

**关键任务**:
- 通过OpenClaw扩展其他云平台（Notion/语雀等）
- OpenClaw团队负责新平台对接

---

## 十三、项目预算估算（简化版）

### 13.1 人力成本估算（假设）

| 角色 | 人数 | 周均工时 | 周数 | 总工时 | 单位成本（假设） | 总成本 |
|------|------|----------|------|--------|----------------|--------|
| **项目负责人** | 1 | 4h | 7 | 24h | $50/h | $1,200 |
| **架构师** | 1 | 4h | 7 | 25h | $80/h | $2,000 |
| **前端开发** | 2 | 3h/人 | 7 | 36h | $60/h | $2,160 |
| **Rust后端开发** | 1 | 14.7h | 7 | 88h | $70/h | $6,160 |
| **集成开发** | 1 | 26.3h | 7 | 158h | $70/h | $11,060 |
| **测试工程师** | 1 | 11.3h | 7 | 68h | $50/h | $3,400 |

**总人力成本（不含Phase 7）**: $25,980

**含Phase 7总人力成本**: $25,980 + $3,620 = $29,600

### 13.2 外部服务成本

| 服务 | 成本 | 说明 |
|------|------|------|
| **OpenClaw API** | 按使用计费 | 开发阶段可能有免费额度 |
| **飞书开放平台** | 免费（通过OpenClaw） | OpenClaw已处理飞书费用 |
| **GitHub Releases** | 免费 | 开源项目免费 |

**总外部服务成本**: ≈$0（开发阶段） + OpenClaw按使用计费

### 13.3 与原方案预算对比

| 项目 | 原方案 | 简化方案 | 减少 |
|------|--------|----------|------|
| **人力成本** | $60,240 | $25,980 | -$34,260（57%） |
| **开发周期** | 18-21周 | 7周 | -11-14周（60%） |
| **外部依赖** | 飞书官方 | OpenClaw | 降低集成风险 |

---

## 十四、项目关键成功因素（简化版）

### 14.1 技术成功因素

1. **OpenClaw API稳定**: OpenClaw API契约明确、接口稳定
2. **OpenClaw飞书支持完整**: OpenClaw飞书对接能力满足需求
3. **文件监听性能达标**: 文件变更检测延迟<1s
4. **同步流程稳定**: 首次同步 + 增量同步成功率≥90%

### 14.2 团队成功因素

1. **OpenClaw团队协作**: OpenClaw团队及时响应API咨询
2. **集成开发主力**: 集成开发承担最大工作量（38.8%）
3. **架构设计清晰**: AI Agent Registry架构简单清晰
4. **测试覆盖完整**: 单元测试覆盖率≥80%

### 14.3 外部成功因素

1. **OpenClaw团队支持**: OpenClaw团队及时提供API文档和技术支持
2. **OpenClaw飞书对接稳定**: OpenClaw飞书API调用稳定
3. **Beta用户反馈积极**: Beta测试用户反馈积极、Bug报告及时

---

## 十五、项目总结（简化版）

### 15.1 项目核心成果（简化版）

1. **OpenClaw对接成功**: 通过OpenClaw中间层实现飞书文档同步
2. **本地编辑 + 同步通知**: 本地KB文件编辑 + 变更监听 + 同步通知
3. **首次同步 + 增量同步**: KB ↔ 飞书首次同步 + 本地变更增量同步
4. **实时订阅**: 飞书实时变更监听 + 双向同步
5. **同步状态反馈**: 同步进度 + 状态指示器 + 手动同步按钮

### 15.2 简化带来的优势

| 优势 | 描述 |
|------|------|
| **开发量减少57%** | 从420小时减少到300小时 |
| **开发周期缩短60%** | 从18-21周缩短到7周 |
| **人力成本降低57%** | 从$60K降低到$26K |
| **技术风险降低** | OpenClaw已验证飞书API稳定性 |
| **维护成本降低** | OpenClaw维护飞书对接逻辑 |

### 15.3 项目经验教训（预判）

1. **中间层架构有效**: OpenClaw中间层大幅减少开发量
2. **OpenClaw协作关键**: OpenClaw团队及时支持是关键成功因素
3. **单一Agent角色简化**: sync-agent单一角色降低复杂度
4. **文件监听性能重要**: 文件监听性能影响用户体验
5. **API契约确认优先**: OpenClaw API契约需在Phase 2前确认

### 15.4 项目后续展望

- **Phase 8: Web端**: @moraya/core + SvelteKit PWA
- **Phase 9: Mobile端**: Tauri v2 iOS/Android
- **Phase 10: HarmonyOS**: 等Tauri官方支持（可选）
- **Phase 11: 多云平台**: 通过OpenClaw扩展Notion/语雀等

---

**文档版本**: v2.0（简化版）  
**最后更新**: 2026-05-07  
**审核状态**: 待审核  
**下一步**: 与OpenClaw团队确认API契约后启动Phase 1

---

## 附录：关键文档索引（简化版）

| 文档名称 | 路径 | 说明 |
|---------|------|------|
| **方案设计文档v2** | docs/design-multi-terminal-ai-collab-platform-v2.md | 本架构设计 |
| **项目计划文档v2** | docs/project-plan-multi-terminal-ai-collab-platform-v2.md | 本项目计划 |
| **OpenClaw API文档** | docs/openclaw-api-spec.md（待创建） | OpenClaw API调研 |
| **OpenClaw API契约文档** | docs/openclaw-api-contract.md（待创建） | API契约确认 |
| **用户手册** | Wiki（待更新） | 同步功能使用指南 |
| **OpenClaw对接技术文档** | docs/openclaw-integration.md（待创建） | OpenClaw对接指南 |