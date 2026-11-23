# 食记 Kitchen 数据库设计

**存储：** CloudBase 传统文档型数据库
**核对日期：** 2026-11-20

# 0. 总原则

- 采用**个人空间与家庭空间统一的 `workspaceId` 架构**：每个数据文档都带 `workspaceId`，通过它做隔离与权限判断。
- 个人空间即一个特殊的 workspace（`type=personal`，成员仅本人）。
- 家庭空间为 `type=family`，成员 3～5 人。
- 所有集合软删除用 `deleted` 字段；万能查询条件都包含 `workspaceId` 与 `deleted=false`。
- 时间统一存储为 Date，前端按本地时区展示。
- 参照开源项目（Tandoor 的 Space/Household、Mealie 的 Group/Household、Grocy 的批次/库存）抽象为符合本项目的模型，仅借鉴设计，不复制代码（见 OPEN_SOURCE_REFERENCES.md）。

# 1. 集合总览

| 集合 | 类型分组 | 说明 |
| --- | --- | --- |
| users | 身份 | 用户主档 |
| workspaces | 身份 | 空间（个人/家庭） |
| workspace_members | 身份 | 空间成员与角色 |
| workspace_invites | 身份 | 邀请码 |
| recipes | 菜谱域 | 菜谱主档 |
| ingredients | 菜谱域 | 食材字典 |
| ingredient_prices | 菜谱域+成本 | 食材价格记录 |
| meal_plans / meal_plan_items | 规划域 | 饮食计划 |
| shopping_lists / shopping_items | 采购域 | 购物清单 |
| pantry_items / pantry_lots | 库存域 | 库存汇总/批次 |
| inventory_transactions | 库存域 | 库存流水 |
| cooking_records | 记录域 | 烹饪记录 |
| media_assets | 记录域 | 媒体资产索引 |
| sync_events | 同步域 | 同步事件（视 SYNC_DESIGN 结论启用） |
| operation_logs | 审计 | 关键操作日志 |

# 2. 集合详细设计

以下 `_id` 为云数据库自动主键；`workspaceId`、`deleted`、`createdAt/updatedAt` 为通用字段，正文不重复列出的可视为“继承”。

## 2.1 users

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| openid | string | 唯一，登录后由云函数保障 |
| nickname | string | 昵称 |
| avatarFileId | string | 头像云存储 id |
| personalWorkspaceId | string | 个人空间 id |
| settings | object | 偏好（默认单位、时区、提醒天数） |
| status | enumerated | active / disabled |

索引：`openid` 唯一；`status`。

## 2.2 workspaces

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| type | enumerated | personal / family |
| name | string | 空间名 |
| ownerOpenId | string | 所有者（家庭空间 Owner） |
| memberLimit | number | 家庭空间默认 5 |
| icon | string | 空间图标 |
| settings | object | 空间级偏好 |

索引：`type`；`ownerOpenId`。

## 2.3 workspace_members

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| workspaceId | string | 空间 |
| openid | string | 成员 |
| role | enumerated | owner / admin / member |
| joinedAt | Date | 加入时间 |
| status | enumerated | active / removed |

索引：联合 `(workspaceId, openid)` 唯一；`workspaceId + role`。
权限判定以此集合为准（服务端每次校验）。

## 2.4 workspace_invites

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| workspaceId | string | 目标空间 |
| code | string | 一次性邀请码 |
| createdBy | string | 创建人（需 Owner/Admin） |
| expiresAt | Date | 有效期（默认 72h） |
| usedBy | string? | 使用人 |
| usedAt | Date? | 使用时间 |
| status | enumerated | active / used / revoked |

索引：`code` 唯一；`workspaceId + status`。

## 2.5 recipes（菜谱）

字段定义见 PRD 模块 A4，此处列出查询关注的字段：
- `workspaceId`, `name`, `categoryId`, `tags[]`, `isFavorite`, `status`, `deleted`, `createdBy`, `updatedAt`。
- `ingredientsRef[]`：内嵌食材引用（名称快照 + 用量 + 单位 + 换算单位）。
- `steps[]`：步骤序列。
- `nutrition` / `cost` / `rating`：聚合结果（可缓存，计算时重算）。

索引（组合覆盖主要查询）：
- `(workspaceId, deleted, updatedAt)`：空间内最新列表。
- `(workspaceId, categoryId, deleted)`：按分类筛选。
- `(workspaceId, isFavorite, deleted)`：收藏。
- 名称检索：CloudBase 支持 `db.RegExp` 前缀/包含，控制一次查询量（大数据量下走云函数 + 全文/分词，见下）。

## 2.6 ingredients（食材字典）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| name | string | 名称 |
| aliases | string[] | 别名 |
| defaultUnit | string | 默认单位 id |
| unitConversions | object[] | 单位换算表 |
| nutritionBase | object | 每 100g 或每单位营养基准 |
| priceMode | enumerated | recent / avg7 |
| category | string? | 食材分类 |

索引：`(workspaceId, name)`；`(workspaceId, deleted)`。

## 2.7 ingredient_prices（价格记录）

字段：`{ workspaceId, ingredientId, unit, price, quantity, date, source, createdBy }`。
索引：`(workspaceId, ingredientId, date)`——按食材取最近/均价。

## 2.8 meal_plans / meal_plan_items

meal_plans：`{ workspaceId, startDate, endDate, createdBy }`。
索引：`(workspaceId, startDate, endDate)`。

meal_plan_items：`{ workspaceId, planId, date, mealType, recipeId?, recipeNameSnapshot?, note, status, requestedBy? }`。
索引：`(workspaceId, date, mealType)`；`(planId)`。

## 2.9 shopping_lists / shopping_items

shopping_lists：`{ workspaceId, name, dateRange?, status, createdBy }`。
索引：`(workspaceId, status, createdAt)`。

shopping_items：`{ workspaceId, listId, ingredientId?, name, amountText?, unit, checked, addedBy }`。
索引：`(workspaceId, listId)`。

## 2.10 pantry_items / pantry_lots / inventory_transactions

pantry_items（汇总视图）：`{ workspaceId, ingredientId?, name, totalQty, unit, minStock?, location?, reminderDays }`。
索引：`(workspaceId, name)`；`(workspaceId, updatedAt)`。

pantry_lots（批次）：`{ workspaceId, pantryItemId?, ingredientId, batchNo, qty, unit, unitPrice, purchaseDate, bestBefore, source, createdBy }`。
索引：`(workspaceId, pantryItemId)`；`(workspaceId, bestBefore)`——临期筛选；联合 `(workspaceId, ingredientId)`。

inventory_transactions（流水）：`{ workspaceId, pantryItemId, lotId?, type, qty, unit, beforeQty?, afterQty?, refType?, refId?, operator, createdAt }`。
索引：`(workspaceId, pantryItemId, createdAt)`；`(workspaceId, type, createdAt)`。

## 2.11 cooking_records / media_assets

cooking_records：`{ workspaceId, recipeId?, recipeNameSnapshot, photos[] (fileId), rating?, note?, date, createdBy }`。
索引：`(workspaceId, date)`；`(workspaceId, createdBy, date)`（排行榜/个人统计）。

media_assets（媒体索引，用于鉴权与文件生命周期）：`{ workspaceId, fileId, ownerOpenId, kind(image/video/avatar), size, width?, height?, uploadedAt, status }`。
索引：`(workspaceId, uploadedAt)`；`fileId` 唯一。

## 2.12 sync_events

`{ workspaceId, entity, entityId, op(insert/update/delete), payload?, version, createdBy, createdAt, acknowledgedBy[]? }`
索引：`(workspaceId, createdAt)`；`(workspaceId, entityId, version)`。
> 是否启用 sync_events 由 `docs/SYNC_DESIGN.md` 的验证结论决定：若 `watch()` 覆盖全部需求且额度足够，可减化为仅 operation_logs。

## 2.13 operation_logs

`{ workspaceId?, openid, action, entity, entityId, detail(脱敏), ip?, createdAt }`
索引：`(workspaceId, createdAt)`；`(openid, createdAt)`。

# 3. 关联关系

```text
users 1─1 workspaces(personal)
workspace 1─N workspace_members
workspace 1─N workspace_invites
workspace 1─N recipes / ingredients / meal_plans / shopping_lists
                / pantry_items / cooking_records / media_assets
recipes 1─N ingredients(ref) / ingredient_prices(间接)
cooking_records N─1 recipes（名称快照兜底）
meal_plan_items N─1 recipes / meal_plans
shopping_items N─1 shopping_lists / ingredients
pantry_lots N─1 pantry_items / ingredients
inventory_transactions N─1 pantry_items / pantry_lots(+ref 采购单/菜谱)
```

# 4. 查询方式

- 读操作优先走数据库查询（客户端 SDK，使用安全规则限定 `workspaceId`），只读集合可开“所有用户可读但限定”的权限。
- 聚合（排行榜、每日营养汇总、成本汇总、购物清单聚合）在**云函数**中完成，避免客户端复杂 JOIN 与权限泄露。
- 名称检索采用正则（前缀优先）；数据量增长后在云函数内做分词/倒排，或引入独立搜索引擎（V1.0 不引入第三方）。

# 5. 索引策略与成本

- 只为核心查询建组合索引，避免索引爆炸（免费额度内合理控制）。
- 日期范围查询一律带 `workspaceId` 前缀，避免全表扫描。
- 分页用 `_id` 或 `updatedAt` 游标，控制每次 fetch ≤ 20。

# 6. 数据权限

- 数据库集合默认权限：**仅创建者可读写**（最严），家庭共享数据经由云函数以管理员身份写入并在云函数内校验 `workspace_members` 角色。
- 只读类集合（如 ingredients 字典）可放开为“登录用户可读”配合规则限定 `workspaceId` 属于该用户空间。
- 任何客户端直接写库的集合，其安全规则必须同时校验 `workspaceId ∈ 用户空间` 且 `openid == 文档.openid`（个人数据）或 `openid ∈ workspace_members`（家庭数据）。
- **不能为了图省事把所有集合都设为仅创建者读写**，否则家庭共享需要二次写，会破坏一致性；应逐个集合明确规则（见 SECURITY.md）。

权限矩阵明细见 `docs/SECURITY.md`。

# 7. 数据完整性

- 使用 `transaction`/`runTransaction` 保证多集合一致性（如采购入库 = 建 lot + 加流水 + 更新汇总 + 购物项勾选）。
- 软删除 + 定期清理（云函数定时触发，预留）。
- 字段变更走 `scripts/migrations/` 与版本号，禁止未迁移直接改结构。
