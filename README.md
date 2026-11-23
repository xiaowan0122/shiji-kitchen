# 食记 Kitchen

支持个人使用与家庭共享的微信原生小程序：记录菜谱、管理食材、规划饮食、计算成本与营养、管理冰箱库存，并实现多设备自动同步。

## 产品定位

- 个人空间：自己的菜谱、做饭记录、饮食计划、成本与营养数据。
- 家庭空间：3～5 名家庭成员共享菜谱、饮食计划、购物清单、冰箱库存与烹饪记录。
- 多设备自动同步，菜谱图片云端保存。

## 技术栈

微信原生小程序 + TypeScript + WXML + WXSS；后端使用腾讯云 CloudBase 国内站（传统文档型数据库、云函数、云存储、微信登录）。成本目标 0 元，V1.0 不接入付费 AI（仅预留接口）。

## 目录结构

```text
shiji-kitchen/
├── AGENTS.md                  # Agent 最高执行约束
├── README.md
├── project.config.json        # 微信开发者工具项目配置（阶段1创建）
├── miniprogram/               # 小程序前端（阶段1起）
│   ├── app.ts / app.json / app.wxss
│   ├── pages/  components/  services/  utils/  types/  assets/  styles/
├── cloudfunctions/            # 云函数（阶段2起）
├── docs/                      # 全部设计与技术文档
├── docx/                      # 前序规划草稿（保留）
├── references/                # 开源参考项目源码（保留）
└── scripts/                   # 迁移/构建脚本
```

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [docs/PRD.md](docs/PRD.md) | 详细产品需求 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技术架构 |
| [docs/DATABASE.md](docs/DATABASE.md) | 数据库设计 |
| [docs/API.md](docs/API.md) | 接口设计 |
| [docs/SECURITY.md](docs/SECURITY.md) | 安全规则与权限 |
| [docs/SYNC_DESIGN.md](docs/SYNC_DESIGN.md) | 自动同步方案 |
| [docs/STORAGE_DESIGN.md](docs/STORAGE_DESIGN.md) | 云存储/图片方案 |
| [docs/COST_CONTROL.md](docs/COST_CONTROL.md) | 免费成本分析 |
| [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md) | 备份与恢复 |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | 测试计划 |
| [docs/CODEX_PLAN.md](docs/CODEX_PLAN.md) | 分阶段开发计划 |
| [docs/OPEN_SOURCE_REFERENCES.md](docs/OPEN_SOURCE_REFERENCES.md) | 开源借鉴分析 |
| [docs/DECISIONS.md](docs/DECISIONS.md) | 技术决策记录 |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | 开发环境检查 |

## 开发状态

当前阶段：**阶段 0 —— 项目初始化与技术文档**。尚未创建 CloudBase 云环境，未进入阶段 1 页面开发。阶段划分与验收标准见 `docs/CODEX_PLAN.md`。

## 环境要求

- Node.js（本机检测到 v24.22.1）
- npm（11.19.1）
- Git（2.47.0）
- 微信开发者工具（阶段 1 起需要，当前未检测到，见 `docs/ENVIRONMENT.md`）
