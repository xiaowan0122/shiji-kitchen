# 食记 Kitchen 技术架构与数据库设计

## 1. 最终技术选型

| 模块     | 技术                                    |
| -------- | --------------------------------------- |
| 小程序   | 微信原生小程序                          |
| 语言     | TypeScript                              |
| 页面     | WXML + WXSS                             |
| 云服务   | 腾讯云 CloudBase 国内站                 |
| 数据库   | CloudBase 传统文档型数据库              |
| 云函数   | Node.js + wx-server-sdk                 |
| 文件存储 | CloudBase Storage                       |
| 登录     | 微信小程序身份认证                      |
| 实时同步 | CloudBase collection.watch()            |
| 本地缓存 | wx.setStorage / wx.getStorage           |
| 测试     | Jest 或 Vitest + 微信开发者工具真机测试 |
| AI       | V1.0不启用真实AI                        |

不要使用：

- PostgreSQL PG模式。
- Redis。
- 独立服务器。
- Docker。
- 第三方付费API。
- 独立React管理后台。

## 2. 项目目录

shiji-kitchen/

├── miniprogram/
│   ├── app.ts
│   ├── app.json
│   ├── app.wxss
│   ├── pages/
│   │   ├── home/
│   │   ├── recipes/
│   │   ├── recipe-detail/
│   │   ├── recipe-edit/
│   │   ├── plan/
│   │   ├── calendar/
│   │   ├── meal-detail/
│   │   ├── kitchen/
│   │   ├── shopping/
│   │   ├── pantry/
│   │   ├── cooking/
│   │   ├── ranking/
│   │   ├── family/
│   │   ├── member/
│   │   ├── profile/
│   │   └── backup/
│   ├── components/
│   │   ├── recipe-card/
│   │   ├── ingredient-editor/
│   │   ├── step-editor/
│   │   ├── rating-stars/
│   │   ├── calendar/
│   │   ├── quantity-input/
│   │   └── workspace-switcher/
│   ├── services/
│   │   ├── cloud/
│   │   ├── api/
│   │   ├── repositories/
│   │   ├── sync/
│   │   ├── media/
│   │   └── calculators/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   └── assets/
│
├── cloudfunctions/
│   └── api/
│       ├── index.js
│       ├── package.json
│       ├── modules/
│       │   ├── auth.js
│       │   ├── workspace.js
│       │   ├── recipe.js
│       │   ├── media.js
│       │   ├── ingredient.js
│       │   ├── meal.js
│       │   ├── shopping.js
│       │   ├── pantry.js
│       │   ├── cooking.js
│       │   ├── ranking.js
│       │   └── backup.js
│       └── shared/
│           ├── auth.js
│           ├── validation.js
│           ├── errors.js
│           └── database.js
│
├── database/
│   ├── rules/
│   ├── indexes/
│   └── seed/
│
├── docs/
├── tests/
├── scripts/
├── AGENTS.md
├── README.md
├── project.config.json
└── .gitignore

说明：

小程序业务逻辑必须放在services和repositories中，不允许在页面里直接堆积数据库调用。

Cloud Functions统一作为重要写操作入口。

## 3. 身份认证

小程序启动：

1. 调用wx.cloud.init。
2. 调用auth.bootstrap云函数。
3. 云函数通过getWXContext()获取真实OPENID。
4. 查询users集合。
5. 不存在则创建用户。
6. 检查是否已经存在个人空间。
7. 不存在则创建个人空间。
8. 返回用户和个人空间基本信息。

不得让客户端自行提交openid作为可信身份。

不得在小程序前端保存AppSecret或云端管理员密钥。

## 4. 数据集合设计

### 4.1 users

文档ID使用用户OPENID。

字段：

- nickname
- avatarFileId
- createdAt
- updatedAt
- lastActiveAt
- settings

### 4.2 workspaces

字段：

- type：personal / family
- name
- ownerOpenid
- memberOpenids
- members
- memberCount
- settings
- createdAt
- updatedAt

members数组示例：

{
"openid": "用户身份",
"role": "owner",
"nickname": "家庭管理员",
"joinedAt": 1795000000000
}

家庭空间最多5名成员。

### 4.3 workspace_invites

字段：

- workspaceId
- codeHash
- createdBy
- expiresAt
- maxUses
- usedCount
- status
- createdAt

邀请码只在创建时返回明文。

数据库仅存储哈希值。

### 4.4 recipes

字段：

- workspaceId
- createdBy
- updatedBy
- title
- description
- coverFileId
- category
- tags
- servings
- prepMinutes
- cookMinutes
- difficulty
- ingredients
- steps
- sourceUrl
- rating
- status
- version
- createdAt
- updatedAt

ingredients示例：

[
{
"ingredientId": "ing_001",
"name": "猪肉",
"amount": 200,
"unit": "g",
"gramsPerUnit": 1,
"optional": false
}
]

steps示例：

[
{
"order": 1,
"description": "猪肉洗净切块",
"imageFileId": null,
"durationMinutes": 5
}
]

### 4.5 ingredients

标准食材库。

字段：

- name
- aliases
- category
- baseUnit
- gramsPerUnit
- densityGPerMl
- nutritionPer100g
- source
- updatedAt

营养数据：

{
"calories": 143,
"protein": 20.0,
"fat": 6.0,
"carbs": 0,
"fiber": 0,
"sodium": 62
}

数据为示例，正式食材数据必须有来源。

### 4.6 ingredient_prices

字段：

- workspaceId
- ingredientId
- purchaseQuantity
- purchaseUnit
- purchasePrice
- baseQuantity
- unitPrice
- storeName
- purchasedAt
- createdBy

允许同一种食材存在多条价格历史。

计算成本时优先使用最新有效价格。

### 4.7 meal_plans

字段：

- workspaceId
- dateKey
- mealType
- status
- note
- createdBy
- updatedAt

dateKey格式：

YYYY-MM-DD

mealType：

breakfast / lunch / dinner / snack

### 4.8 meal_plan_items

字段：

- workspaceId
- planId
- recipeId
- recipeNameSnapshot
- servings
- requestedBy
- assignedCook
- status
- note
- createdAt

status：

pending / confirmed / scheduled / cooking / completed / cancelled

### 4.9 shopping_lists

字段：

- workspaceId
- title
- status
- startDate
- endDate
- createdBy
- createdAt
- updatedAt

### 4.10 shopping_items

字段：

- workspaceId
- listId
- ingredientId
- name
- quantity
- unit
- category
- checked
- purchased
- sourceMealItemIds
- createdBy
- updatedAt

### 4.11 pantry_items

表示某种食材的库存管理主体。

字段：

- workspaceId
- ingredientId
- name
- baseUnit
- lowStockThreshold
- location
- updatedAt

### 4.12 pantry_lots

表示实际采购批次。

字段：

- workspaceId
- pantryItemId
- quantityPurchased
- quantityRemaining
- unit
- purchaseDate
- expiryDate
- purchasePrice
- createdBy
- createdAt

不同批次不能合并丢失保质期。

### 4.13 inventory_transactions

库存流水。

字段：

- workspaceId
- pantryItemId
- lotId
- type
- quantityDelta
- unit
- unitCostSnapshot
- relatedCookingId
- idempotencyKey
- createdBy
- createdAt

type：

purchase / consume / adjust / waste / return

### 4.14 cooking_records

字段：

- workspaceId
- recipeId
- recipeNameSnapshot
- coverFileIdSnapshot
- ingredientsSnapshot
- servings
- cookedBy
- cookedAt
- rating
- gradeTags
- notes
- photos
- estimatedCost
- actualCost
- nutritionSnapshot
- inventoryDeducted
- version
- createdAt

必须保存历史快照，不能在菜谱修改后自动改变过去的做饭记录。

### 4.15 media_assets

字段：

- workspaceId
- fileId
- ownerOpenid
- category
- mimeType
- fileSize
- linkedEntityType
- linkedEntityId
- createdAt

### 4.16 sync_events

字段：

- workspaceId
- revision
- entityType
- entityId
- action
- actorOpenid
- requestId
- createdAt

只用于通知其他设备刷新数据。

不要把完整菜谱、用户隐私等放在同步事件里。

### 4.17 operation_logs

使用requestId作为幂等操作标识。

字段：

- userOpenid
- workspaceId
- action
- requestId
- status
- createdAt

防止重复提交造成重复扣库存、重复生成购物记录。

## 5. 数据库索引

至少建立：

recipes：

- workspaceId + updatedAt
- workspaceId + category
- workspaceId + status

meal_plans：

- workspaceId + dateKey

meal_plan_items：

- workspaceId + planId
- workspaceId + recipeId

shopping_items：

- workspaceId + listId + checked

pantry_lots：

- workspaceId + pantryItemId + expiryDate

cooking_records：

- workspaceId + cookedAt
- workspaceId + recipeId

sync_events：

- workspaceId + createdAt
- workspaceId + revision

workspace_invites：

- codeHash + status

实际索引创建方式必须以当前CloudBase控制台和官方SDK支持为准。

## 6. Cloud Functions API

统一通过：

wx.cloud.callFunction({
name: "api",
data: {
action: "recipe.create",
payload: {}
}
})

云函数根据action分发业务逻辑。

### 认证

- auth.bootstrap
- auth.getProfile
- auth.updateProfile

### 家庭空间

- workspace.createFamily
- workspace.createInvite
- workspace.joinByInvite
- workspace.getMembers
- workspace.updateMemberRole
- workspace.removeMember
- workspace.leave

### 菜谱

- recipe.create
- recipe.update
- recipe.delete
- recipe.copyToWorkspace
- recipe.getDetail
- recipe.search

### 图片

- media.register
- media.getTemporaryUrls
- media.delete

### 食材

- ingredient.search
- ingredient.createCustom
- ingredient.updatePrice
- ingredient.getPriceHistory

### 饮食计划

- meal.createPlan
- meal.updatePlan
- meal.addRecipe
- meal.updateStatus
- meal.deleteItem

### 购物

- shopping.generateFromPlan
- shopping.addItem
- shopping.updateItem
- shopping.markPurchased
- shopping.deleteItem

### 库存

- pantry.addLot
- pantry.adjustStock
- pantry.consumeStock
- pantry.getExpiring
- pantry.getTransactions

### 烹饪

- cooking.complete
- cooking.updateRecord
- cooking.getHistory

### 统计

- ranking.get
- statistics.getCost
- statistics.getNutrition

### 备份

- backup.export
- backup.validateImport
- backup.import

所有API必须校验：

- 当前OPENID。
- workspaceId。
- 用户是否为家庭成员。
- 角色权限。
- 参数格式。
- 操作是否合法。

## 7. 实时同步设计

### 7.1 同步方式

每个设备在当前家庭空间只创建一个sync_events监听器。

监听条件：

workspaceId = 当前家庭ID

监听到事件后，根据entityType刷新对应Repository的数据。

例如：

recipe更新：
刷新菜谱详情及相关列表。

shopping_item更新：
刷新购物清单。

pantry更新：
刷新库存。

meal_plan更新：
刷新当前日期计划。

### 7.2 连接管理

- 页面切换不能重复创建监听。
- 空间切换必须关闭旧监听。
- 小程序进入后台时关闭或暂停监听。
- 小程序恢复前台时重新连接。
- 监听错误后退避重试。
- 连接失败时提供手动刷新。
- 不允许无限快速重连。

每台设备只允许一个活动家庭监听。

### 7.3 冲突处理

recipes文档增加version。

更新时客户端传入expectedVersion。

服务端检查版本：

如果当前版本与expectedVersion一致：
允许更新，version加1。

如果版本不一致：
返回VERSION_CONFLICT。

前端展示：

- 云端已有新版本。
- 重新加载。
- 用户重新编辑。

禁止直接覆盖其他成员的新内容。

库存变动必须使用事务或可靠的原子更新方式。

### 7.4 离线策略

V1.0：

- 缓存最近查看的菜谱。
- 缓存最近饮食计划。
- 缓存当前购物清单。
- 离线允许查看。
- 离线不允许执行库存扣减和家庭共享写操作。
- 网络恢复后自动刷新。

暂不实现复杂的离线编辑冲突合并。

## 8. 安全规则

### 8.1 基本原则

所有重要写操作通过云函数。

数据库直接读取通过Security Rules。

云函数必须从getWXContext()获取OPENID。

云函数使用管理员SDK访问数据库时，必须自行执行权限检查，因为服务端操作不能依赖客户端安全规则代替鉴权。

### 8.2 工作空间规则

个人空间：
只有Owner可以读取。

家庭空间：
只有memberOpenids中存在的成员可以读取。

菜谱：
必须先确认当前用户属于文档的workspaceId。

sync_events：
只有当前工作空间成员可以读取。

workspace_invites：
禁止客户端直接读取。

inventory_transactions：
禁止客户端直接修改或删除。

operation_logs：
禁止客户端直接访问。

### 8.3 防止越权

不能相信客户端传入的：

- ownerOpenid
- userOpenid
- role
- isAdmin
- memberOpenids

所有这些字段由服务端生成和校验。

CloudBase安全规则采用官方支持的表达式，先在测试环境验证再部署。

## 9. 图片存储设计

云存储路径：

workspaces/{workspaceId}/recipes/{recipeId}/cover/
workspaces/{workspaceId}/recipes/{recipeId}/steps/
workspaces/{workspaceId}/cooking/{cookingRecordId}/

上传流程：

1. 选择图片。
2. 压缩图片。
3. 检查文件大小。
4. 生成随机文件名。
5. wx.cloud.uploadFile上传。
6. 服务端校验上传者和workspaceId。
7. media_assets记录fileId。
8. 获取图片时先校验成员权限。
9. 云函数生成临时下载URL。
10. 前端展示图片。

临时URL不作为永久数据库字段。

删除图片时检查引用关系。

## 10. 计算规则

### 10.1 成本

unitPrice = purchasePrice / baseQuantity

ingredientCost = usedBaseQuantity × unitPrice

recipeCost = sum(ingredientCost)

costPerServing = recipeCost / servings

缺少价格的数据不能作为0元参与完整成本统计。

### 10.2 营养

ingredientNutrition = nutritionPer100g × gramsUsed / 100

recipeNutrition = sum(ingredientNutrition)

perServingNutrition = recipeNutrition / servings

未知营养值必须标记为不完整。

### 10.3 库存

剩余库存 = 所有批次quantityRemaining之和。

优先建议使用较早到期批次。

消耗时生成inventory_transactions。

禁止库存数量变成负数，除非用户明确执行库存修正。

### 10.4 排行榜

周榜：
按本周已完成的cooking_records统计。

月榜：
按本月已完成的cooking_records统计。

年榜：
按本年已完成的cooking_records统计。

不使用定时后台任务。

小家庭数据直接查询并聚合。

## 11. 免费额度保护

免费体验环境的资源点为共享额度。

需要控制：

- 数据库调用。
- 云函数调用。
- 云存储容量。
- CDN流量。
- 实时连接数。

设计以下保护：

- 列表分页。
- 图片压缩。
- 不重复下载图片。
- 仅监听同步事件集合。
- 监听关闭机制。
- 不使用高频轮询。
- 不使用定时统计任务。
- 不调用付费AI。
- 不调用短信服务。

云端免费额度耗尽后，必须显示服务受限提示，不允许自动升级或产生费用。

## 12. 测试要求

至少测试：

1. 不同用户无法访问彼此个人空间。
2. 非家庭成员无法读取家庭数据。
3. 家庭成员移除后无法访问。
4. 普通成员不能删除家庭。
5. 邀请码过期后无法使用。
6. 重复使用requestId不会重复扣库存。
7. 两台设备同时编辑同一菜谱会触发冲突。
8. 两台设备同时扣减库存不会发生负库存。
9. 图片URL过期后可以重新获取。
10. 图片权限不会因猜测fileID而泄露。
11. watch连接在退出后可以关闭。
12. 网络恢复后数据能够重新同步。
13. JSON导入不会覆盖不相关空间的数据。

## 13. 官方技术资料

- https://docs.cloudbase.net/
- https://docs.cloudbase.net/recipes/add-cloud-function-wechat-miniprogram
- https://docs.cloudbase.net/database/realtime
- https://docs.cloudbase.net/database/security-rules
- https://docs.cloudbase.net/storage/security-rules
- https://cloud.tencent.com/document/product/876/127357