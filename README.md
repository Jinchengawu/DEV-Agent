# DEV-Agent

> 基于 OpenClaw + Hermes 架构的开发者多 Agent 协同系统

## 架构概述

DEV-Agent 是一个基于 OpenClaw 编排内核和 Hermes 垂类 Agent 的多 Agent 协同系统，专为软件开发者设计。

```
用户请求 → OpenClaw 内核 → 意图分析 → Agent 路由
                │
    ┌───────────┼───────────┬───────────┐
    │           │           │           │
    ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│frontend│ │backend │ │testing │ │devops  │
│Hermes  │ │Hermes  │ │Hermes  │ │Hermes  │
│ :8201  │ │ :8202  │ │ :8203  │ │ :8204  │
└────────┘ └────────┘ └────────┘ └────────┘
```

## 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 编排内核 | OpenClaw | 多 Agent 协同框架 |
| Agent 运行时 | Hermes | 垂类深度执行 |
| 前端 | React/Vue/TypeScript | 前端开发专用 |
| 后端 | Python/Node.js/Go | 后端开发专用 |
| 测试 | pytest/Jest/Playwright | 测试开发专用 |
| DevOps | Docker/K8s/CI-CD | 运维部署专用 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动所有服务（OpenClaw + Hermes + Agent）
./scripts/start-openclaw.sh

# 3. 测试路由
openclaw agent --local -m "帮我创建 React 组件"
```

## 项目结构

```
DEV-Agent/
├── README.md
├── config/
│   └── openclaw/
│       └── instances.yaml        # Agent 实例配置
├── packages/
│   ├── gateway/                  # 网关服务（备用）
│   └── openclaw/                 # OpenClaw 集成
├── plugins/
│   └── ai-router/                # AI 路由插件
│       ├── HOOK.md
│       └── handler.ts
├── scripts/
│   ├── start-all.sh              # 启动所有 Agent
│   ├── start-openclaw.sh         # 启动 OpenClaw
│   └── test-gateway.sh           # 测试路由
├── skills/
│   ├── frontend/                 # 前端技能（9 个）
│   ├── backend/                  # 后端技能（9 个）
│   ├── testing/                  # 测试技能（10 个）
│   └── devops/                   # DevOps 技能（10 个）
├── templates/                    # 项目模板
└── examples/                     # 示例项目
```

## Agent 角色

### 前端 Agent (端口 8201)
- **职责**：React/Vue/TypeScript/CSS 开发
- **技能**：react-development, vue-development, nextjs-development, css-tailwind
- **Hermes**：独立实例，专注前端开发

### 后端 Agent (端口 8202)
- **职责**：Python/Node.js/Go/API/数据库开发
- **技能**：python-development, nodejs-development, api-design, database-design
- **Hermes**：独立实例，专注后端开发

### 测试 Agent (端口 8203)
- **职责**：单元测试/集成测试/E2E 测试
- **技能**：pytest-development, jest-development, playwright, e2e-testing
- **Hermes**：独立实例，专注测试开发

### DevOps Agent (端口 8204)
- **职责**：Docker/K8s/CI-CD/监控
- **技能**：docker-management, kubernetes-deployment, ci-cd-pipeline
- **Hermes**：独立实例，专注运维部署

## 路由规则

| 任务类型 | 关键词 | 目标 Agent |
|---------|--------|-----------|
| 前端开发 | React, Vue, 组件, UI, CSS | frontend |
| 后端开发 | API, 数据库, 服务器, 接口 | backend |
| 测试 | 测试, 单元测试, E2E, 覆盖率 | testing |
| 运维 | Docker, K8s, CI/CD, 部署 | devops |
| 通用 | 代码, 调试, 重构 | 内核 |

## 配置

### Agent 实例配置
```yaml
# config/openclaw/instances.yaml
instances:
  - id: dev-frontend
    label: "前端开发 Agent"
    port: 8201
    hermes_port: 8201
    tags: ["react", "vue", "typescript", "css"]
    skills: ["react-development", "vue-development"]
```

### OpenClaw 配置
```yaml
# OpenClaw 会自动加载 ~/.openclaw/config.yaml
# 无需额外配置
```

## 使用示例

```bash
# 测试前端路由
openclaw agent --local -m "帮我创建 React 登录组件"

# 测试后端路由
openclaw agent --local -m "设计用户数据库表结构"

# 测试测试路由
openclaw agent --local -m "编写单元测试用例"

# 测试 DevOps 路由
openclaw agent --local -m "配置 Docker 部署"
```

## 相关项目

- [AI-local-OS](https://github.com/Jinchengawu/AI-local-OS) - 基础架构
- [OpenClaw](https://github.com/openclaw) - 多 Agent 编排框架
- [Hermes Agent](https://github.com/NousResearch/hermes-agent) - Agent 运行时

## 许可证

MIT License

---

**版本**：v0.1.0  
**最后更新**：2026-05-21
