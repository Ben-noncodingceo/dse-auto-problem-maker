# DSE Auto Problem Maker

HKDSE Physics 自动出题与批改系统

## 功能特性

- ✅ 基于 DSE 物理大纲的知识点选择
- ✅ 多 LLM 供应商支持（DeepSeek、豆包、通义千问、ChatGPT）
- ✅ 自动生成选择题和简答/计算题
- ✅ 多语言支持（简体中文、繁体中文、英文）
- ✅ AI 自动批改答案，提供详细反馈
- ✅ 知识点标签 + 能力标签体系
- ✅ LaTeX / PDF 导出功能
- ✅ 真题 PDF 解析与学习

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Query
- Zustand

### 后端
- Node.js + TypeScript
- Hono (轻量级 Web 框架)
- Prisma ORM
- PostgreSQL
- Redis (缓存)

### 基础设施
- Docker (LaTeX 编译服务)
- Cloudflare R2 (对象存储，可选)

## 项目结构

```
dse-auto-problem-maker/
├── apps/
│   ├── frontend/     # React 前端应用
│   └── backend/      # Hono API 服务
├── packages/
│   ├── database/     # Prisma schema
│   ├── shared/       # 共享类型和工具
│   └── llm/          # LLM 抽象层
├── docker/           # Docker 配置
└── docs/             # 文档
```

## 快速开始

### 前置要求

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 15
- Docker (用于 LaTeX 编译)

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp apps/backend/.env.example apps/backend/.env

# 编辑 .env 文件，填入必要的配置
```

### 初始化数据库

```bash
pnpm db:generate
pnpm db:push
```

### 启动开发服务器

```bash
pnpm dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:3000

## 开发指南

详见 [docs/development.md](docs/development.md)

## 部署

详见 [docs/deployment.md](docs/deployment.md)

## License

MIT
