# 开发指南

## 项目架构

本项目采用 **Monorepo** 架构，使用 **pnpm** 和 **Turborepo** 进行包管理和构建。

```
dse-auto-problem-maker/
├── apps/
│   ├── frontend/     # React 前端应用（Vite + TypeScript + Tailwind）
│   └── backend/      # Hono API 服务（Node.js + TypeScript）
├── packages/
│   ├── database/     # Prisma ORM + PostgreSQL schema
│   └── llm/          # LLM 抽象层（支持多供应商）
└── docs/             # 项目文档
```

## 技术栈

### 前端
- **框架**: React 18
- **构建工具**: Vite
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **数据请求**: TanStack Query (React Query)
- **路由**: React Router v6
- **数学公式渲染**: KaTeX + react-markdown

### 后端
- **框架**: Hono (轻量级 Web 框架)
- **语言**: TypeScript
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **验证**: Zod

### LLM 集成
- **支持的供应商**: DeepSeek, 豆包, 通义千问, ChatGPT
- **SDK**: OpenAI SDK (用于兼容供应商)
- **自定义**: Axios (用于非标准 API)

## 环境准备

### 前置要求
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 15
- Docker (可选，用于 LaTeX 编译)

### 安装依赖

```bash
# 安装所有依赖
pnpm install

# 生成 Prisma 客户端
pnpm db:generate
```

### 配置环境变量

1. 复制环境变量模板：
```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
```

2. 编辑 `.env` 文件，填入实际配置：
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dse_auto_problem_maker"

DEEPSEEK_API_KEY=your-deepseek-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 初始化数据库

```bash
# 推送 schema 到数据库
pnpm db:push

# 运行种子数据脚本
pnpm --filter @dse/database seed
```

## 开发

### 启动开发服务器

```bash
# 同时启动前端和后端
pnpm dev
```

或分别启动：

```bash
# 只启动前端（http://localhost:5173）
pnpm --filter @dse/frontend dev

# 只启动后端（http://localhost:3000）
pnpm --filter @dse/backend dev
```

### 数据库操作

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 推送 schema 到数据库（开发环境）
pnpm db:push

# 创建迁移（生产环境）
pnpm db:migrate

# 打开 Prisma Studio
pnpm --filter @dse/database studio
```

## 代码结构

### 后端 API 路由

- `GET /api/health` - 健康检查
- `GET /api/knowledge/categories` - 获取知识点分类
- `POST /api/questions/generate` - 生成题目
- `GET /api/questions/:id` - 获取题目详情
- `GET /api/questions/:id/translate/:language` - 获取题目翻译
- `POST /api/grading/submit` - 提交答案并批改
- `GET /api/ai-providers` - 获取 AI 供应商配置

详细 API 文档见 [docs/api.md](./api.md)

### 前端页面

- `/generate` - 题目生成页面
- `/question/:id` - 题目展示和作答页面
- `/admin` - 管理后台
  - `/admin/knowledge` - 知识点管理
  - `/admin/ai-providers` - AI 供应商配置
  - `/admin/syllabus` - 大纲管理

## 核心功能实现

### 1. 题目生成流程

1. 用户在前端选择知识点和题型
2. 前端调用 `POST /api/questions/generate`
3. 后端从数据库获取 AI 供应商配置
4. 调用 LLM Service 生成题目
5. 保存题目到数据库
6. 返回题目 ID，前端跳转到题目页面

### 2. 多语言翻译

1. 题目默认使用基准语言（languageBase）
2. 用户切换语言时，前端调用 `GET /api/questions/:id/translate/:language`
3. 后端检查缓存（QuestionTranslation 表）
4. 如果不存在，调用 LLM 翻译并缓存
5. 返回翻译结果

### 3. AI 批改答案

1. 用户提交答案
2. 前端调用 `POST /api/grading/submit`
3. 后端调用 LLM Service 批改
4. 保存批改结果到数据库
5. 返回得分、反馈、能力评估和改进建议

### 4. LLM 抽象层

```typescript
// 使用示例
import { LLMService } from '@dse/llm';

const llmService = new LLMService({
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: 'your-api-key',
  modelName: 'deepseek-chat',
});

// 生成题目
const question = await llmService.generateQuestion({
  exam: 'HKDSE Physics',
  syllabusSections: ['力学'],
  knowledgeTags: ['牛顿第二定律', '功与能'],
  questionType: 'mcq',
  difficulty: 3,
});

// 翻译
const translated = await llmService.translate({
  text: '原文',
  sourceLanguage: 'zh-cn',
  targetLanguage: 'en',
});

// 批改
const grading = await llmService.gradeAnswer({
  questionStem: '题干',
  standardAnswer: '标准答案',
  studentAnswer: '学生答案',
  questionType: 'short',
  maxScore: 10,
});
```

## 测试

```bash
# 运行测试（待实现）
pnpm test
```

## 构建

```bash
# 构建所有项目
pnpm build

# 只构建前端
pnpm --filter @dse/frontend build

# 只构建后端
pnpm --filter @dse/backend build
```

## 常见问题

### 1. Prisma 客户端未生成

```bash
pnpm db:generate
```

### 2. 数据库连接失败

检查 `DATABASE_URL` 是否正确，确保 PostgreSQL 服务已启动。

### 3. AI API 调用失败

- 检查 API Key 是否正确
- 检查网络连接
- 查看后端日志获取详细错误信息

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## License

MIT
