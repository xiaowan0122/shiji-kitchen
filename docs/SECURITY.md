# 食记 Kitchen 安全设计

核对日期：2026-11-20

# 1. 威胁模型

需要考虑的主要风险：
- 越权读取/修改他人个人空间或家庭空间数据。
- 被移除成员凭旧缓存/旧 token 继续读写。
- 邀请码被爆破/滥用。
- 图片链接被无权限扩散。
- 客户端绕过规则直接写库。
- 云函数被调用方伪造 openid / workspaceId。
- 敏感信息（AppSecret、密钥）泄露。

# 2. 身份与隔离

- 身份唯一标识 = openid（微信登录，由 cloud.getWXContext().OPENID 获取，云函数内不可伪造）。
- 数据隔离维度 = workspaceId：每个文档必须携带，查询/写入均以此过滤。
- 个人空间 type=personal、成员仅本人；家庭空间 type=family、成员 3～5 人。
- 隔离规则（核心）：任何数据访问必须满足“数据.workspaceId 属于当前用户可访问的空间集合”。可访问空间集合 = 个人空间 + 该用户所属活动家庭空间。

# 3. 角色与权限矩阵

| 操作 | Owner | Admin | Member | 说明 |
| --- | --- | --- | --- | --- |
| 查看/编辑空间内共享内容 | 允许 | 允许 | 允许 | 菜谱/计划/清单/库存/记录 |
| 管理成员（邀请/移除/改角色） | 允许 | 允许 | 拒绝 | 仅 Owner/Admin |
| 删除空间 | 允许 | 拒绝 | 拒绝 | 仅 Owner |
| 移交 Owner | 允许（二次确认） | 拒绝 | 拒绝 | 仅 Owner 显式确认 |
| 移除 Admin/Member | 允许 | 允许（不可移除 Owner/同级以上） | 拒绝 | 分级约束 |
| 个人空间数据 | 仅本人 | 不适用 | 不适用 | 他人不可见 |

Owner 唯一；Admin 由 Owner/Admin 授予；Member 为普通成员。

# 4. 服务端强制校验（云函数）

数据库权限无法表达复杂角色逻辑，因此：
- 重要写操作一律走云函数，云函数内顺序执行：取 openid 到查 workspace_members 到校验角色与空间，再执行。
- 客户端传入的任何 workspaceId/openid 均视为不可信，以数据库与微信上下文为准。
- 提供统一 requireWorkspace(workspaceId, minRole) 服务端校验工具。

# 5. 数据库安全规则

原则：最小权限逐集合明确，不允许“一律仅创建者”，也不允许“一律所有用户可读写”。

| 集合 | 建议规则 | 说明 |
| --- | --- | --- |
| users / workspaces / workspace_members | 仅创建者读写 + 云函数写 | 成员列表走云函数返回 |
| workspace_invites | 仅创建者读，只有云函数写 | 防枚举 |
| recipes/ingredients/meal 相关/shopping 相关/pantry 相关/cooking/media | 读：auth.openid 属于空间成员；写：仅云函数 | 只读集合可放开读，写全走云函数 |
| sync_events / operation_logs | 仅云函数读写 | 审计数据不暴露 |

注意：CloudBase 安全规则中“判断 openid 是否属于某空间成员”的能力依赖平台版本，需联网后以官方文档核对（列入待核实）。

# 6. 邀请与移除

- 邀请码：一次性、带过期时间（默认 72h）、可撤销；Accept 时校验(code, status=active, expiresAt>now)并原子置 used，防并发重复使用。
- 移除成员：立即将 workspace_members 置 status=removed，服务端校验即时失效；不能只依赖客户端删缓存。
- 被移除成员：客户端缓存仍在，但所有云函数校验返回 403；实时 watch 回连时也因订阅/规则失效停止收到数据。
- 重复邀请/空间满员：返回明确错误，不静默覆盖。

# 7. 图片访问

- 图片上传到按 workspaceId 分目录的云存储路径，写入 media_assets 记录归属。
- 客户端不直接持有永久公开 URL；展示前调用 media.getSignedUrl { fileId }，云函数校验归属后签发短期临时链接。
- 头像/封面等展示可用缩略图，降低泄露范围。
- 详见 docs/STORAGE_DESIGN.md。

# 8. 云函数滥用防护

- 所有可写 action 做入参 schema 校验，拒绝多余字段。
- 邀请码、批量生成/导入接口加限流（按 openid 与 IP）。
- openid 一致性：云函数一律不读取客户端传入的 openid。
- 定时/后台任务代码不允许接收任意 openid/workspaceId 参数（固定使用管理身份）。

# 9. 敏感信息与合规

- AppID/AppSecret、云环境密钥只放对应环境变量，严禁入库/Git。
- project.private.config.json、.env* 已在 .gitignore。
- 上线前完成微信《用户隐私保护指引》配置与必要的授权弹窗。
- 关键操作写 operation_logs（脱敏），支持追溯。

# 10. 审计与事件记录

- 成员变更、角色变更、批量删除/恢复、导出备份等高风险操作必记 operation_logs。
- 同步事件与操作日志不暴露给普通客户端直连。

# 11. 上线前安全验收清单（摘要）

- 越权测试：无成员跨空间读写、团队成员越权改角色，均返回 403。
- 邀请码一次性与过期测试。
- 图片无鉴权链接不可用（临时链接过期后 403）。
- 客户端伪造 openid/workspaceId 无效。
- 密钥扫描：仓库中不复存在 AppSecret/token。
- 完整清单与用例见 docs/TEST_PLAN.md。
