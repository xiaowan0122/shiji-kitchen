# 食记 Kitchen 云存储设计（图片与媒体）

核对日期：2026-11-20

# 1. 目标

- 菜谱封面、步骤图、成品照片、头像统一云端保存。
- 按个人/家庭空间隔离，访问受控。
- 压缩与缩略图，控制流量与成本。
- 图片不出现在无鉴权的永久链接中（对家庭共享尤其重要）。

# 2. 目录设计（CloudBase Storage）

```text
images/
  {workspaceId}/
    recipe-{recipeId}/cover.jpg
    recipe-{recipeId}/step-{seq}.jpg
    album-{recordId}/photo-{n}.jpg
  avatars/
    {openid}.jpg
```

说明：
- 按 workspaceId 分隔，天然隔离。
- 文件名可加内容哈希，避免重名并支持去重。
- 不建议把图片直接内嵌到数据库文档，数据库只存 fileId/路径，图片二进制放 Storage。

# 3. 上传流程

1. 客户端选择图片。
2. 前端压缩：长边 ≤ 1600px、质量 ≥ 0.8，导出 jpg/webp；单图目标 ≤ 500KB。
3. 上传到云存储路径（含 workspaceId）。
4. 写入 `media_assets` 记录：fileId、归属、尺寸、大小、上传时间。
5. 业务文档写入 `coverFileId` / `photos[]`。

> 压缩在客户端用 canvas 完成，减少云函数与流量成本。

# 4. 访问控制

- 展示前调用 `media.getSignedUrl { fileId }`（云函数）。
- 云函数校验：`media_assets.workspaceId ∈ 用户空间`，通过后签发**短期临时下载链接**。
- 临时链接过期后不可用，避免长期扩散。
- 头像等低频资源可缓存，但同样走鉴权获取。

# 5. 生命周期与清理

- 软删除业务文档时，图片标记为“可回收”，由云函数定时任务在保留期后批量删除【需核实定时触发器配额】。
- `media_assets.status`：active / marked_delete / deleted。
- 降低占用：提供缩略图（列表用，如 <400px），详情/相册用原图，减少 CDN/读流量。

# 6. 成本与配额（摘要）

- 详细额度与价格见 docs/COST_CONTROL.md，以官方文档为准并标注核对日期。
- 家庭 3～5 人 + 个人，按“每菜谱数张图”估算月存储与下载量控制在免费额度内（估算，非保证）。

# 7. 待联网核实

1. 云存储免费容量与 CDN 免费流量额度。
2. 临时链接（getTempFileURL）的有效期与调用限制。
3. 图片处理（缩略图）是否为独立付费产品。
4. 定时删除任务是否占用配额。

# 8. 验收

- 上传后图片正确落库并可在有权限端显示。
- 无权限端拿到 fileId 无法取得可访问链接。
- 单图大小达标，列表用缩略图。
