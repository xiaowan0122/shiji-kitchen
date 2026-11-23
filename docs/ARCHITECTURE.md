# 食记 Kitchen 技术架构

**版本：** V1.0
**核对日期：** 2026-11-20

# 1. 技术选型

| 模块 | 选型 |
| --- | --- |
| 小程序 | 微信原生小程序 |
| 语言 | TypeScript |
| 页面 | WXML + WXSS |
| 云服务 | 腾讯云 CloudBase 国内站 |
| 数据库 | CloudBase 传统文档型数据库 |
| 云函数 | Node.js + wx-server-sdk |
| 存储 | CloudBase 云存储 |
| 登录 | 微信小程序身份认证（openid） |
| 实时同步 | CloudBase `collection.watch()`（需联网核实额度和权限） |
| 本地缓存 | wx.setStorage / wx.getStorage |
| 测试 | Jest/Vitest + 微信开发者工具真机 |
| AI | V1.0 不启用真实 AI，仅预留接口 |

明确不使用：独立服务器、Docker、PostgreSQL/MySQL、Redis、付费第三方 API、独立 React 管理后台、真实付费 AI。

# 2. 分层架构

```text
┌───────────────────────────────────────────────┐
│ 小程序客户端（miniprogram/）                    │
│  UI：WXML + WXSS + 组件                         │
│  状态：页面内 + 全局 store（轻量自研/第三方）      │
│  数据层：services/（封装 wx.cloud 调用）         │
│  本地缓存：utils/cache                           │
├───────────────────────────────────────────────┤
│ 云端：CloudBase                                │
│  ├ 数据库（文档型）——业务数据                   │
│  ├ 云函数（cloudfunctions/）——服务端校验/聚合   │
│  └ 云存储——图片/媒体                            │
└───────────────────────────────────────────────┘
```

## 2.1 客户端分层职责

| 层 | 目录 | 职责 |
| --- | --- | --- |
| 页面层 | `miniprogram/pages/*` | 只负责渲染与交互，调用 services |
| 组件层 | `miniprogram/components/*` | 复用 UI（份量选择器、标签、图片、步进器等） |
| 服务层 | `miniprogram/services/*` | 封装全部云调用与本地缓存读写，对外暴露领域方法 |
| 类型层 | `miniprogram/types/*` | 与云端一致的 TS 类型与枚举 |
| 工具层 | `miniprogram/utils/*` | 单位换算、营养计算、成本计算、时间、排序等纯函数 |

## 2.2 服务端（云函数）职责

- `login`：openid 注册/认证、初始化个人空间。
- `workspace`：空间创建/成员管理/角色变更。
- `invite`：邀请码签发/校验使用。
- `recipe`：菜谱的创建/编辑/删除/复制到家庭（服务端校验权限）。
- `pantry`：库存批次、扣减 FIFO、流水。
- `shopping`：购物清单聚合生成。
- `sync`：增量事件对账（若采用 sync_events 方案）。
- `backup`：全量导出/导入校验。

> 重要写操作必须在云函数内二次校验权限，不能只信任客户端传入的 workspaceId。

# 3. 领域模型与模块划分

领域界定（对应 PRD 模块）：
- 身份与空间：users / workspaces / workspace_invites / workspace_members。
- 菜谱域：recipes / ingredients / ingredient_prices。
- 规划域：meal_plans / meal_plan_items。
- 采购域：shopping_lists / shopping_items。
- 库存域：pantry_items / pantry_lots / inventory_transactions。
- 记录域：cooking_records / media_assets。
- 同步与审计：sync_events / operation_logs。

详细字段、索引与集合关系见 `docs/DATABASE.md`。

# 4. 关键数据流

## 4.1 登录流
`小程序 onLaunch → wx.cloud.init → cloudfunctions/login(openid) → 查 users → 无则建个人空间 → 返回用户+空间上下文`

## 4.2 写操作流（家庭共享写）
`页面 → services 校验本地 → 云函数（校验角色/权限）→ 写库 + 写 sync_events → 触发实时事件 → 其他设备 watch 收到并刷新`

## 4.3 图片流
`选择图片 → 前端压缩（canvas）→ 上传云存储（目录按 workspaceId）→ 得到 fileId 入库 → 展示时用后端鉴权链接`

# 5. 同步设计要点

- 主数据源为云端；客户端为缓存视图。
- 实时：`collection.watch()` 监听目标集合条件（如 `workspaceId == X`）。
- 兜底：监听失败/断网时走“增量拉取 + 本地重放”，见 `docs/SYNC_DESIGN.md`。
- 冲突：文档级“最后写入为准 + updatedAt/version 校验”。

# 6. 错误处理与日志

- 统一错误码：`AUTH_REQUIRED / FORBIDDEN / NOT_FOUND / VALIDATION / CONFLICT / RATE_LIMIT / STORAGE`。
- 云函数写关键操作写 `operation_logs`（非敏感、脱敏）。
- 客户端统一错误提示，保留用户输入。

# 7. 目标目录结构

```text
shiji-kitchen/
├── project.config.json            # 微信工具项目配置（阶段1）
├── miniprogram/
│   ├── app.ts  app.json  app.wxss
│   ├── pages/
│   │   ├── home/  recipes/  recipe-detail/  recipe-edit/
│   │   ├── meal-plan/  shopping-list/  pantry/  cost/  nutrition/
│   │   ├── cooking-record/  album/  calendar/  ranking/
│   │   └── auth/  space/  invite/  settings/  recycle/
│   ├── components/
│   ├── services/
│   ├── utils/
│   ├── types/
│   ├── assets/
│   └── styles/
├── cloudfunctions/
│   ├── login/ user/ workspace/ invite/ recipe/
│   ├── pantry/ shopping/ sync/ backup/
│   └── <function>/index.ts   package.json
├── docs/  docx/  references/  scripts/
```

# 8. 性能与质量指标

- 列表分页 20 条；图片压缩后上传（单图 ≤ 500KB），列表用缩略图。
- 纯函数（单位换算、营养/成本）全部可单测。
- 云函数冷启动优化：精简依赖、按需引入。
- Core Web 不可直接用于小程序，改以“首屏可交互时间”“屏显数据量”衡量。

# 9. 部署拓扑

- 使用单个 CloudBase 环境（免费环境，配额见 COST_CONTROL.md）。
- 云函数按域拆分（单一云环境内多个函数）。
- 数据库集合权限：默认“仅创建者可读写”，通过云函数执行特权操作并自行鉴权。

# 10. 演进与扩展点

- AI：预留 `ai_tasks` 集合与 `services/ai.ts` 抽象，V1.0 返回降级结果。
- 多语言、主题换肤作为低侵入扩展点。
- 若 `watch()` 额度不足，退化为“客户端轮询 + 增量对账”方案。
