# DEV-Agent-Teams

> 基于 Open-Agent-Teams 架构的开发者多 Agent 协同系统 — OpenClaw × Hermes

## 核心理念

```
OpenClaw（横向编排） × Hermes（垂类深度） = DEV-Agent-Teams（开发能力倍增）
```

DEV-Agent-Teams 是 [Open-Agent-Teams](https://github.com/Jinchengawu/Open-Agent-Teams) 的具体实现，复用 OpenClaw 编排内核和 Hermes 垂类 Agent，提供开箱即用的多 Agent 开发团队。

## 架构概述

```
用户请求 → Dashboard (Next.js) → API Gateway → Agent Router
                                    │
        ┌───────────┬───────────┬───┴───┬───────────┐
        ▼           ▼           ▼       ▼           ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │Frontend│ │Backend │ │Testing │ │DevOps  │ │   PM   │
   │Hermes  │ │Hermes  │ │Hermes  │ │Hermes  │ │Hermes  │
   │ :8201  │ │ :8202  │ │ :8203  │ │ :8204  │ │ :8205  │
   │ :9201  │ │ :9202  │ │ :9203  │ │ :9204  │ │ :9205  │
   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
        │           │           │           │           │
        └───────────┴───────────┴───────────┴───────────┘
                            │
                    ┌───────┴───────┐
                    │  Shared Core  │
                    │  (agent-factory,
                    │   SessionManager,
                    │   ContextCompressor,
                    │   AgentBus,
                    │   WorkflowOrchestrator)
                    └───────────────┘
```

## 项目结构

```
DEV-Agent-Teams/
├── packages/
│   ├── core/                        # 共享核心库 (@dev-agent/core)
│   │   └── src/
│   │       ├── agent-factory.ts     # Agent 创建工厂
│   │       ├── session/             # SQLite 会话管理
│   │       ├── context/             # 上下文压缩器
│   │       ├── bus/                 # Agent 间通信总线
│   │       ├── memory/              # 内存存储
│   │       └── workflow/            # 工作流编排
│   ├── agents/                      # Agent 服务实例
│   │   ├── frontend/                # 前端开发 Agent (:8201)
│   │   ├── backend/                 # 后端开发 Agent (:8202)
│   │   ├── testing/                 # 测试开发 Agent (:8203)
│   │   ├── devops/                  # DevOps Agent (:8204)
│   │   └── pm/                      # 产品经理 Agent (:8205)
│   ├── dashboard/                   # Next.js 管理仪表盘 (:3000)
│   │   └── src/
│   │       ├── app/                 # 页面路由
│   │       ├── components/          # UI 组件
│   │       ├── hooks/               # React Hooks
│   │       └── lib/                 # 工具库
│   ├── openclaw/                    # OpenClaw 集成包
│   └── admin-template/              # 管理模板
├── scripts/                         # 启动 & 测试脚本
│   ├── start-all.sh                 # 一键启动全部服务
│   ├── test-routing.sh              # 路由测试
│   └── test-gateway.sh              # 网关测试
└── .env                             # 环境变量配置
```

## 快速开始

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 MODEL_PROVIDER、MODEL_NAME、API_KEY 等

# 2. 一键启动所有服务（Hermes + Agent + Dashboard）
./scripts/start-all.sh

# 3. 启动 Dashboard
cd packages/dashboard && npm run dev

# 4. 打开浏览器
open http://localhost:3000
```

## Agent 角色

| Agent | 端口 | Hermes | 职责 | 技能数 |
|-------|------|--------|------|--------|
| frontend | 8201 | 9201 | React/Vue/TypeScript/组件开发 | 6 |
| backend | 8202 | 9202 | Python/Node.js/Go/API 设计 | 8 |
| testing | 8203 | 9203 | pytest/Jest/Playwright/覆盖率 | 10 |
| devops | 8204 | 9204 | Docker/K8s/CI-CD/部署 | 11 |
| pm | 8205 | 9205 | PRD/需求分析/用户故事 | 10 |

## 核心特性

### 会话管理
- SQLite 持久化存储，支持多会话隔离
- 软删除机制，数据可追溯
- 会话级并发锁，防止竞态条件

### 上下文压缩
- Token 估算与自动压缩
- 长对话自动摘要，保持上下文窗口
- 可配置的压缩阈值

### Agent 间通信
- AgentBus 消息总线，支持 Agent 间协作
- RegistryClient 注册中心，自动发现同伴
- 标准化消息信封（TASK/RESULT/QUERY/REPLY）

### 工作流编排
- 内置开发工作流模板（需求→设计→开发→测试→部署）
- WorkflowOrchestrator 步骤调度
- 状态追踪与回滚

### 容错与重试
- Hermes 调用自动重试（5 次，指数退避 2s→32s）
- 5xx 错误自动重试，4xx 错误立即返回
- Dashboard API 超时 300s 匹配 Agent 端

### 仪表盘
- 实时 Agent 健康监控
- 多 Agent 并发对话
- 对话历史持久化（localStorage）
- Agent 自动检测路由

## 技术栈

| 层 | 技术 |
|----|------|
| Agent 运行时 | Node.js + Express + TypeScript |
| AI 模型 | DeepSeek Chat (via Hermes) |
| 前端 | Next.js 14 + React + Tailwind CSS |
| 数据库 | SQLite (better-sqlite3) |
| 编排 | Hermes Agent + OpenClaw |
| 通信 | AgentBus (HTTP + 注册中心) |

## 相关项目

- [Open-Agent-Teams](https://github.com/Jinchengawu/Open-Agent-Teams) — 抽象架构与集成规格（本项目的上游）
- [Hermes Agent](https://github.com/NousResearch/hermes-agent) — Agent 运行时
- [OpenClaw](https://github.com/openclaw) — 多 Agent 编排框架

## 许可证

MIT License

---

**版本**：v0.2.0  
**最后更新**：2026-05-26
