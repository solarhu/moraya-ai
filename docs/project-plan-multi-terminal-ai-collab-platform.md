# Moraya 多终端 AI 协同 Markdown 平台 - 项目计划文档（v4：飞书CLI直接集成）

**版本**: v4.0  
**日期**: 2026-05-07  
**项目代号**: Moraya-X  
**项目周期**: 4周  
**项目类型**: 飞书CLI集成 + 飞书云文档同步

---

## 一、项目概述

### 1.1 项目背景

基于现有Moraya开源项目，通过飞书官方CLI工具实现飞书云文档同步。

**关键信息**: 飞书发布官方CLI工具
- 飞书CLI可直接操作飞书云文档
- 飞书CLI已实现飞书OAuth认证
- 飞书CLI已实现Markdown ↔ 飞书Block转换
- 飞书CLI支持upload/download/list等命令

**架构最简化**:
- 不需要封装飞书API（CLI已封装）
- 不需要实现飞书OAuth（CLI已实现）
- 不需要实现Markdown ↔ Block转换（CLI已实现）
- 不需要AI Agent中间层（直接调用CLI）
- 不需要OpenClaw服务（直接调用CLI）

### 1.2 项目目标（v4：最简化方案）

**核心目标**: 通过飞书CLI工具实现飞书云文档同步 + 本地Markdown编辑

具体目标:
1. **飞书CLI集成**: Rust后端调用飞书CLI命令
2. **本地文件监听**: 文件变更检测 + 变更队列
3. **同步流程**: 首次同步 + 增量同步（CLI命令）
4. **同步状态反馈**: 同步进度 + 状态指示器
5. **Desktop优先**: 后续扩展Web/Mobile

### 1.3 项目范围

**包含范围**:
- 飞书CLI命令调研 + 命令格式确认
- Rust后端CLI调用实现（Process.spawn）
- 本地文件监听服务
- SyncEngine（基于飞书CLI）
- 前端CLI配置 + 同步UI
- 单元测试 + 集成测试

**不包含范围**:
- 飞书API封装（CLI已实现）
- 飞书OAuth实现（CLI已实现）
- Markdown ↔ 飞书Block转换（CLI已实现）
- Web端开发（后续Phase 5）
- Mobile端开发（后续Phase 6）
- AI Agent架构（后续Phase 7，可选）

---

## 二、团队与角色分工

### 2.1 团队组成（最精简）

| 角色 | 人数 | 职责 | 技能要求 |
|------|------|------|----------|
| **项目负责人 (PM)** | 1 | 项目规划、飞书CLI调研 | 项目管理经验 |
| **Rust后端开发** | 1 | Rust Command实现、CLI调用 | Rust/Process.spawn |
| **前端开发** | 1 | Svelte组件开发、同步UI | Svelte/TypeScript |
| **集成开发** | 1 | 文件监听、同步引擎 | TypeScript |
| **测试工程师** | 1 | 自动化测试、集成测试 | vitest |

**总人数**: 5人（核心团队，最精简）

---

## 三、项目里程碑规划（v4）

### 3.1 总体里程碑

```
Timeline (4周):
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: 飞书CLI调研 + Rust实现 (Week 1)                   │
│ [M1] 飞书CLI命令格式确认 + Rust CLI调用完成                 │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: 文件监听 + 同步引擎 (Week 2)                       │
│ [M2] 文件监听服务 + SyncEngine完成                          │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: 前端同步UI (Week 3)                                │
│ [M3] CLI配置 + 同步状态指示器完成                            │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: 集成测试 + 发布 (Week 4)                           │
│ [M4] 全系统测试 + Beta版本发布                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 详细里程碑

#### Milestone 1: 飞书CLI调研 + Rust CLI调用完成 (Week 1)

**交付物**:
- 飞书CLI命令格式文档（feishu-cli-spec.md）
- Rust后端5个CLI调用Command
- CLI输出解析逻辑
- CLI调用单元测试

**验收标准**:
- ✓ 飞书CLI命令格式确认（auth/upload/download/list/delete）
- ✓ feishu_cli_auth_login成功执行
- ✓ feishu_cli_upload成功上传至少1个文档
- ✓ feishu_cli_download成功下载至少1个文档
- ✓ CLI输出正确解析
- ✓ 单元测试通过

#### Milestone 2: 文件监听 + 同步引擎完成 (Week 2)

**交付物**:
- FileWatcher服务实现
- SyncEngine完整实现（基于飞书CLI）
- 文件变更监听
- 变更队列管理
- 首次同步上传/下载

**验收标准**:
- ✓ 文件监听成功启动
- ✓ 文件变更事件正确触发
- ✓ KB首次同步到飞书成功（至少3个文档）
- ✓ 飞书文档首次下载到KB成功（至少3个文档）
- ✓ CLI命令正确触发同步

#### Milestone 3: 前端同步UI完成 (Week 3)

**交付物**:
- 飞书CLI配置表单
- 同步状态指示器
- 手动同步按钮
- 同步历史查看

**验收标准**:
- ✓ CLI配置成功保存
- ✓ 飞书文件夹Token配置成功
- ✓ 同步状态正确显示
- ✓ 手动同步成功触发

#### Milestone 4: 集成测试 + Beta发布完成 (Week 4)

**交付物**:
- 全系统集成测试套件
- 飞书CLI调用测试
- 同步流程测试
- Beta版本发布

**验收标准**:
- ✓ 所有单元测试通过（覆盖率≥80%）
- ✓ 飞书CLI调用流程完整验证
- ✓ 首次同步 + 增量同步完整验证
- ✓ Beta版本发布成功

---

## 四、详细工作计划（v4）

### 4.1 Phase 1: 飞书CLI调研 + Rust实现 (Week 1)

#### Week 1: CLI调研 + Rust CLI调用

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 飞书CLI命令调研文档 | PM | 12h | feishu-cli-spec.md |
| 飞书CLI命令格式确认 | PM | 8h | 与飞书团队沟通 |
| Rust CLI调用基础实现 | Rust | 12h | Process.spawn封装 |
| feishu_cli_auth_login | Rust | 4h | 认证登录Command |
| feishu_cli_upload | Rust | 8h | 上传文档Command |
| feishu_cli_download | Rust | 8h | 下载文档Command |
| feishu_cli_list | Rust | 8h | 列出文档Command |
| feishu_cli_delete | Rust | 4h | 删除文档Command |
| CLI输出解析逻辑 | Rust | 8h | parse_upload_result等 |
| CLI调用单元测试 | Rust | 8h | feishu_cli.test.ts |

**周总工时**: 20h（PM） + 44h（Rust） = 64h

---

### 4.2 Phase 2: 文件监听 + 同步引擎 (Week 2)

#### Week 2: 文件监听 + SyncEngine

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| FileWatcher服务实现 | 集成开发 | 12h | file-watcher.ts |
| 文件变更事件监听 | 集成开发 | 8h | Tauri事件监听 |
| 变更队列管理 | 集成开发 | 8h | sync-queue.ts |
| SyncEngine类实现 | 集成开发 | 16h | sync-engine.ts |
| uploadDocument（CLI调用） | 集成开发 | 8h | 调用feishu_cli_upload |
| downloadDocument（CLI调用） | 集成开发 | 8h | 调用feishu_cli_download |
| listDocuments（CLI调用） | 集成开发 | 4h | 调用feishu_cli_list |
| firstSyncUpload | 集成开发 | 8h | KB → 飞书首次上传 |
| firstSyncDownload | 集成开发 | 8h | 飞书 → KB首次下载 |
| Rust文件监听Command | Rust | 16h | start_file_watch |
| 同步流程单元测试 | 测试 | 8h | sync-engine.test.ts |

**周总工时**: 44h（集成开发） + 16h（Rust） + 8h（测试） = 68h

---

### 4.3 Phase 3: 前端同步UI (Week 3)

#### Week 3: CLI配置 + 同步状态UI

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 飞书CLI配置表单 | 前端 | 8h | FeishuCliConfig.svelte |
| CLI路径配置 | 前端 | 4h | CLI路径输入 |
| 飞书文件夹Token配置 | 前端 | 4h | FolderToken输入 |
| 飞书CLI认证按钮 | 前端 | 4h | 认证登录按钮 |
| 同步状态指示器 | 前端 | 8h | SyncStatusIndicator.svelte |
| 手动同步按钮 | 前端 | 4h | SyncButton.svelte |
| 同步历史查看 | 前端 | 4h | SyncHistory.svelte |
| UI响应式设计 | 前端 | 4h | Desktop适配 |
| 前端UI测试 | 测试 | 8h | sync-ui.test.ts |

**周总工时**: 32h（前端） + 8h（测试） = 40h

---

### 4.4 Phase 4: 集成测试 + 发布 (Week 4)

#### Week 4: 全系统集成测试

| 任务 | 负责人 | 工时 | 交付物 |
|------|--------|------|--------|
| 全系统单元测试完善 | 测试 | 16h | 覆盖率提升至80% |
| 飞书CLI调用集成测试 | 测试 | 8h | feishu-cli.test.ts |
| 同步流程集成测试 | 测试 | 8h | sync-flow.test.ts |
| 首次同步测试 | 测试 | 4h | first-sync.test.ts |
| 增量同步测试 | 测试 | 4h | incremental-sync.test.ts |
| Beta版本打包 | Rust | 8h | Desktop Beta版本 |
| Beta版本发布 | PM | 4h | GitHub Releases |

**周总工时**: 32h（测试） + 8h（Rust） + 4h（PM） = 44h

---

## 五、工作量汇总（v4）

### 5.1 总工作量统计

| Phase | 时间 | PM | 前端 | Rust | 集成开发 | 测试 | 总计 |
|-------|------|----|------|------|---------|------|------|
| **Phase 1** | Week 1 | 20h | - | 44h | - | - | 64h |
| **Phase 2** | Week 2 | - | - | 16h | 44h | 8h | 68h |
| **Phase 3** | Week 3 | - | 32h | - | - | 8h | 40h |
| **Phase 4** | Week 4 | 4h | - | 8h | - | 32h | 44h |
| **总计** | Week 1-4 | 24h | 32h | 68h | 44h | 48h | 216h |

**实际开发工时**: 216h

**风险缓冲（10%）**: 22h

**调整后总工时**: 216h + 22h = 238h（约4周）

### 5.2 团队工时分配

| 角色 | 总工时 | 周均工时 | 占比 |
|------|--------|----------|------|
| **项目经理** | 24h | 6h/周 | 11.1% |
| **前端开发** | 32h | 8h/周 | 14.8% |
| **Rust后端开发** | 68h | 17h/周 | 31.5% |
| **集成开发** | 44h | 11h/周 | 20.4% |
| **测试工程师** | 48h | 12h/周 | 22.2% |

---

## 六、飞书CLI命令格式（待确认）

### 6.1 CLI命令假设格式

```bash
# 1. 认证登录
feishu auth login
# 输出: Authentication successful. Token saved.

# 2. 上传文档
feishu upload <file_path> --folder <folder_token>
# 输出: Document ID: doc_xxx

# 3. 下载文档
feishu download <document_id> --output <output_path>

# 4. 列出文档
feishu list --folder <folder_token>

# 5. 删除文档
feishu delete <document_id>

# 6. 查看文档信息
feishu info <document_id>
```

**关键决策点**: Week 1需与飞书团队确认实际CLI命令格式

---

## 七、验收标准（v4）

### 7.1 Phase验收标准

#### Phase 1验收标准

- ✓ 飞书CLI命令格式确认
- ✓ feishu_cli_auth_login成功执行
- ✓ feishu_cli_upload成功上传文档
- ✓ feishu_cli_download成功下载文档
- ✓ CLI输出正确解析

#### Phase 2验收标准

- ✓ 文件监听成功启动
- ✓ 文件变更事件正确触发
- ✓ KB首次同步到飞书成功（至少3个文档）
- ✓ 飞书文档首次下载到KB成功（至少3个文档）
- ✓ CLI命令正确触发同步

#### Phase 3验收标准

- ✓ CLI配置成功保存
- ✓ 飞书文件夹Token配置成功
- ✓ 同步状态正确显示
- ✓ 手动同步成功触发

#### Phase 4验收标准

- ✓ 所有单元测试通过（覆盖率≥80%）
- ✓ 飞书CLI调用流程完整验证
- ✓ 首次同步 + 增量同步完整验证
- ✓ Beta版本发布成功

---

## 八、项目时间表（v4）

### 8.1 详细时间表

| Week | Phase | 关键里程碑 | 主要交付物 | 团队协作 |
|------|-------|-----------|-----------|----------|
| **Week 1** | Phase 1 | CLI调研启动 | CLI命令格式文档 | PM主导 + Rust |
| **Week 2** | Phase 2 | [M2] 同步引擎完成 | FileWatcher + SyncEngine | 集成开发主导 |
| **Week 3** | Phase 3 | 前端UI开发 | CLI配置 + 同步状态 | 前端主导 |
| **Week 4** | Phase 4 | [M4] Beta发布 | 全系统测试 + Beta | 测试主导 |

---

## 九、风险评估（v4）

### 9.1 技术风险

| 风险 | 等级 | 影响 | 应对策略 |
|------|------|------|----------|
| **飞书CLI命令格式不确定** | 高 | Phase 1延期 | 1. Week 1前联系飞书团队确认<br>2. 准备CLI命令格式假设文档 |
| **飞书CLI不稳定** | 低 | 同步失败 | 1. CLI调用错误处理<br>2. CLI版本锁定 |
| **CLI输出解析复杂** | 中 | 结果解析错误 | 1. CLI输出格式文档化<br>2. 解析逻辑单元测试 |

### 9.2 外部依赖风险

| 风险 | 等级 | 影响 | 应对策略 |
|------|------|------|----------|
| **飞书CLI发布延迟** | 高 | Phase 1延期 | 1. 确认飞书CLI发布时间<br>2. 准备备用方案（飞书API封装） |
| **飞书CLI命令变化** | 低 | 需调整CLI调用 | 1. CLI版本锁定<br>2. CLI升级适配文档 |

---

## 十、后续规划（v4）

### 10.1 Phase 5-7规划（后续）

| Phase | 内容 | 工作量预估 | 启动条件 |
|-------|------|-----------|----------|
| **Phase 5** | Web端支持 | 2周 | Phase 4完成 |
| **Phase 6** | Mobile端支持 | 2周 | Phase 5完成 |
| **Phase 7** | AI Agent架构（可选） | 4周 | Phase 6完成 |

---

## 十一、方案总结（v4）

### 11.1 核心成果

1. **飞书CLI直接集成**: 架构最简化，无需中间层
2. **官方工具**: 飞书官方维护CLI，稳定可靠
3. **开发量最小**: 约216h，周期4周
4. **维护成本最低**: 飞书官方维护CLI更新
5. **无需封装**: CLI已实现OAuth + 转换 + API调用

### 11.2 方案对比总结

| 项目 | v1 | v2 | v3 | **v4** |
|------|----|----|----|----|
| **架构** | 多层 | 中间层 | Agent | **最简** |
| **核心** | API封装 | OpenClaw | Agent调用 | **CLI调用** |
| **工作量** | 420h | 300h | 428h | **216h** |
| **周期** | 18-21周 | 7周 | 8-9周 | **4周** |
| **维护成本** | 高 | 中 | 高 | **最低** |

### 11.3 最终推荐方案

**推荐v4方案**（飞书CLI直接集成）

**理由**:
- 飞书CLI是官方工具，最稳定
- 架构最简化，开发量最小
- 周期最短，4周完成
- 维护成本最低
- 飞书官方维护CLI更新
- 无需任何中间层

---

**文档版本**: v4.0（飞书CLI直接集成）  
**最后更新**: 2026-05-07  
**审核状态**: 待审核  
**下一步**: 与飞书团队确认CLI命令格式后启动开发