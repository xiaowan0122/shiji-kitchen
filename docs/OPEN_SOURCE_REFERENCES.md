# 食记 Kitchen 开源项目功能借鉴分析

核对日期：2026-11-20
说明：以下分析基于本仓库 `references/` 内保存的源码快照与项目 README/LICENSE，仅用于功能/设计借鉴，**不直接复制或合并其源码**。

# 1. 参考项目与许可证

| 项目 | 仓库/本地目录 | 许可证 | 代码复用限制 |
| --- | --- | --- | --- |
| Mealie | references/mealie-mealie-next | AGPL-3.0 | 强 Copyleft：若复制其代码，衍生作品也须 AGPL 开源。商业/闭源（微信小程序）不可直接搬源码或受其保护的实现 |
| Tandoor | references/recipes-develop | AGPL-3.0-OR-LATER + Commons Clause | AGPL 强 Copyleft + Commons Clause 禁止“销售软件”。“销售”定义宽，闭源商用不可用；仅可借鉴设计理念 |
| Grocy | references/grocy-master | MIT | 最宽松：允许复制/修改/闭源商用，但须保留版权声明；仍建议仅借鉴设计 |

结论：本项目为闭源微信小程序，**三个项目的“代码”均不允许直接复制合入**（Mealie/Tandoor 因 AGPL/Commons Clause 尤为明确）。只允许：
- 借鉴其领域建模与交互理念（不受版权保护的"思路"）。
- 在不复制代码的前提下，参考字段/流程设计。
- 若要参考其算法实现，需重写为自己的实现并注意许可证边界；涉及 AGPL 项目时避免逐行照搬。

# 2. 功能借鉴分析

## 2.1 菜谱编辑器 / 食材 / 步骤

- Mealie、Tandoor 均把“食材(ingredient)”“步骤(step)”“单位(unit)”“食材字典(ingredient/food)”建模为独立概念，菜谱通过引用关联。
- 借鉴点：
  - 食材字典独立维护 + 菜谱内“名称快照”引用（历史不受字典改名影响）。对应 `ingredients` + `recipes.ingredientsRef.nameSnapshot`。
  - 单位(unit)与换算表独立建模，支撑份量缩放与成本换算。对应 `ingredients.unitConversions`。
  - 步骤带有序号、可选配图与时间。

## 2.2 份量缩放

- Mealie 提供 servings 与缩放换算；Tandoor 通过 recipe servings 与 step/ingredient 换算。
- 借鉴点：
  - 基准份量(servings) + 目标份量求系数，线性换算用量；“不可小数单位”与时间非线性缩放的取舍本项目明确定义（见 PRD 模块 C）。

## 2.3 饮食计划 / 点菜

- Tandoor 有 MealPlan + 按 date/mealType 的 item；支持按周排餐与从菜谱生成。
- 借鉴点：
  - `meal_plans`（日期范围）+ `meal_plan_items`（date+mealType+recipe 引用）。
  - 点菜请求态（requestedBy + approve）是本项目新增的“家庭点菜”语义，参考但不复制 Tandoor 实现。

## 2.4 购物清单

- Tandoor/Mealie 均支持从饮食计划/菜谱生成购物清单并合并用量。
- 借鉴点：
  - `shopping_lists` + `shopping_items`，标记 `isPurchase` 与聚合去重、换算合并。

## 2.5 家庭共享 / 多用户

- Mealie：Group / Household 两层；Tandoor：Space → Household / UserSpace 分层。
- 借鉴点：
  - 本项目统一简化为 `workspaceId`（个人/家庭两种 type）+ `workspace_members` 角色。参考其“空间隔离”宏观模型，不采用其具体表结构/代码。

## 2.6 库存批次 / 保质期 / 库存流水

- Grocy 是库存管理专长：批次(lot)、保质期(best-before)、库存流流水、采购/消耗/报损。
- 借鉴点：
  - `pantry_items`（汇总）+ `pantry_lots`（批次）+ `inventory_transactions`（流水），FIFO 扣减、临期提醒、报损。这是 Grocy 最值得借鉴的领域模型，但我们按 CloudBase 文档库重新建模。

## 2.7 营养 / 成本

- Mealie/Tandoor 均支持营养信息；Tandoor 有 Food 的营养与单位换算表。
- 借鉴点：`ingredients.nutritionBase`（每 100g/单位）+ 聚合；成本为本项目自行扩展（`ingredient_prices`）。

# 3. 借鉴边界清单（红线）

- 不复制三个项目任意受版权代码文件。
- 不移植其前端框架（Mealie Vue、Tandoor Vue、Grocy PHP/JS）到本项目。
- 不逐行照搬其算法；重写为自己的实现。
- 对 AGPL/Commons Clause 项目，尤其避免“整体结构照搬+改名”式复制。
- 借鉴仅停留在字段命名、交互流程、领域概念的层面。

# 4. 结论

- Grocy（MIT）的库存/批次/流水模型最值得参考，但以“设计借鉴”处理。
- Mealie/Tandoor（AGPL / Commons Clause）仅借鉴领域概念，明确不复制代码。
- 本项目的闭源定位决定了“借鉴思路、自研实现、不合并源码”的唯一合规路径。
