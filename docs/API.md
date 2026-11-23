# 食记 Kitchen 接口设计（云函数 API 规范）

**核对日期：** 2026-11-20

# 1. 总则

- 除“直接读库”外，业务读写通过**云函数**暴露，采用 `action` 分发模式（一个云函数多个 action），减少函数数量、降低冷启动成本。
- 调用方式：`wx.cloud.callFunction({ name, data: { action, payload } })`。
- 身份：云函数内用 `cloud.getWXContext().OPENID` 取得 openid，禁止信任客户端传入 openid。
- 统一响应：

```json
{ "code": 0, "data": {}, "msg": "ok" }
```

- 错误响应：

```json
{ "code": 40301, "data": null, "msg": "FORBIDDEN: 无权限" }
```

# 2. 错误码

| 码段 | 含义 |
| --- | --- |
| 0 | 成功 |
| 401xx | 未登录/需授权 |
| 403xx | 无权限（非成员/角色不足/越权） |
| 404xx | 资源不存在 |
| 422xx | 参数校验失败 |
| 409xx | 冲突（并发/重复邀请等） |
| 429xx | 限流 |
| 500xx | 服务端错误 |

# 3. 云函数列表

## 3.1 login
```
action: auth
  入参: {}（openid 取自上下文）
  出参: { user, personalWorkspace }
逻辑: 查 users，无则创建个人空间并初始化必要集合/默认食材字典
```

## 3.2 workspace
```
action: get           入参 { workspaceId }         出参 { workspace, members }
action: createFamily  入参 { name, memberLimit }    出参 { workspace }
action: listMine      入参 {}                       出参 { memberships[] }
action: changeRole    入参 { workspaceId, targetOpenid, role }  (仅 Owner/Admin)
action: removeMember  入参 { workspaceId, targetOpenid }        (仅 Owner/Admin)
action: leave         入参 { workspaceId }
```

## 3.3 invite
```
action: create   入参 { workspaceId, expireHours }  出参 { code }   (仅 Owner/Admin)
action: accept   入参 { code }                       出参 { workspace }
action: revoke   入参 { inviteId }                   (仅 Owner/Admin)
```

## 3.4 recipe
```
action: list      入参 { workspaceId, categoryId?, tag?, keyword?, cursor, pageSize }
action: get       入参 { workspaceId, recipeId }
action: save      入参 { workspaceId, recipe? }      (create/update 自动判别)
action: softDelete 入参 { workspaceId, recipeId }
action: restore   入参 { workspaceId, recipeId }
action: copyToFamily 入参 { recipeId, targetWorkspaceId }   (个人→家庭)
action: favorite  入参 { workspaceId, recipeId, isFavorite }
action: rating    入参 { workspaceId, recipeId, score }
```

## 3.5 pantry
```
action: purchase       入参 { workspaceId, ingredientId, qty, unit, unitPrice, purchaseDate?, bestBefore?, listItemId? }
action: consume        入参 { workspaceId, pantryItemId, qty, refType?, refId? }
action: adjust         入参 { workspaceId, pantryItemId, qty }
action: waste          入参 { workspaceId, pantryItemId, lotId?, qty }
action: listExpiring   入参 { workspaceId, days }
action: listLots       入参 { workspaceId, pantryItemId }
action: history        入参 { workspaceId, pantryItemId?, cursor }
```

## 3.6 shopping
```
action: generateFromPlan 入参 { workspaceId, planId }
action: create/updateItem
action: toggleChecked   入参 { workspaceId, itemId, checked }
action: list            入参 { workspaceId, listId?, status }
```

## 3.7 meal-plan
```
action: getRange   入参 { workspaceId, startDate, endDate }
action: setItem    入参 { workspaceId, date, mealType, recipeId?, note? }
action: requestItem 入参 { workspaceId, date, mealType, recipeId?, note }   (点菜)
action: approve    入参 { itemId }   (仅 Owner/Admin 采纳点菜)
action: deleteItem 入参 { itemId }
```

## 3.8 report（排行榜/统计）
```
action: ranking   入参 { workspaceId, period(week/month/year), metric }
action: nutritionSummary 入参 { workspaceId, date }
```

## 3.9 other
```
cooking: saveRecord / list / deleteRecord
media:   getSignedUrl { fileId }   (鉴权后签发临时链接)
backup:  export / import / validateSchema
sync:    pullIncremental { cursor }   (watch 兜底/断点续传)
```

# 4. 输入输出约束

- 所有入参在云函数内用校验库（如 zod/joi）校验，拒绝多余字段。
- 一律在云函数内校验所属空间与角色，再执行写操作。
- 列表接口统一返回 `{ items, nextCursor, hasMore }`。
- 时间统一 ISO 8601 / Date，前端转本地时区。

# 5. 批量与性能

- 批量写优先用云函数事务保证一致性（采购入库、批量勾选）。
- 避免客户端逐条 for 循环写库；聚合类一律走云函数。

# 6. 安全要求

- 云函数签发的临时存储 URL 有过期时间，且调用前校验 `media_assets.workspaceId ∈ 用户空间`。
- 邀请码读取仅开通给 `invite.accept` 逻辑，避免批量猜码（加入限流与一次性消费）。
- 详见 `docs/SECURITY.md`。
