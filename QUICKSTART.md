# 快速开始指南

## 项目简介

**DSE Auto Problem Maker** 是一个基于 AI 的 HKDSE 物理自动出题与批改系统。

核心功能：
- 🎯 基于知识点自动生成题目（选择题/简答题）
- 🌍 支持多语言（简体中文、繁体中文、英文）
- 🤖 AI 自动批改，提供详细反馈和能力评估
- 📊 知识点和能力标签体系
- 🔧 支持多个 LLM 供应商（DeepSeek、ChatGPT 等）

## 技术栈

- **前端**: React + TypeScript + Vite + Tailwind CSS
- **后端**: Hono + Node.js + TypeScript
- **数据库**: PostgreSQL + Prisma
- **AI**: 统一 LLM 抽象层

## 5 分钟快速开始

### 1. 环境准备

确保已安装：
- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 15

### 2. 克隆并安装

```bash
cd dse-auto-problem-maker
pnpm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env，至少配置以下内容
# DATABASE_URL="postgresql://user:password@localhost:5432/dse_auto_problem_maker"
# DEEPSEEK_API_KEY=your-api-key  # 或其他 LLM 供应商
```

### 4. 初始化数据库

```bash
# 创建数据库表
pnpm db:push

# 导入初始数据（知识点、能力标签等）
pnpm --filter @dse/database seed
```

### 5. 启动开发服务器

```bash
# 同时启动前端和后端
pnpm dev
```

访问：
- 前端: http://localhost:5173
- 后端: http://localhost:3000

## 使用流程

### 1. 配置 AI 供应商（可选）

如果没有在环境变量中配置，可以在管理后台配置：

1. 访问 http://localhost:5173/admin/ai-providers
2. 点击"添加供应商"
3. 填入 API Key 等信息
4. 设置为默认供应商

### 2. 生成题目

1. 访问 http://localhost:5173/generate
2. 选择知识点分类（如"力学"）
3. 选择知识点标签（如"牛顿第二定律"）
4. 选择题型和难度
5. 点击"生成题目"
6. 等待 3-8 秒，AI 生成题目

### 3. 作答和批改

1. 在题目页面作答
2. 点击"看答案"
3. AI 自动批改，显示：
   - 得分
   - 详细反馈
   - 能力评估
   - 改进建议

### 4. 多语言切换

在题目页面点击顶部的语言按钮即可切换。

## 项目结构

```
dse-auto-problem-maker/
├── apps/
│   ├── frontend/         # React 前端
│   │   ├── src/
│   │   │   ├── pages/    # 页面组件
│   │   │   ├── components/
│   │   │   └── lib/      # API 和工具
│   │   └── package.json
│   └── backend/          # Hono 后端
│       ├── src/
│       │   ├── routes/   # API 路由
│       │   └── index.ts
│       └── package.json
├── packages/
│   ├── database/         # Prisma + 数据库
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/seed.ts   # 种子数据
│   └── llm/              # LLM 抽象层
│       └── src/
│           ├── client.ts
│           ├── services.ts
│           └── prompts.ts
└── docs/                 # 文档
```

## 常用命令

```bash
# 开发
pnpm dev                  # 启动所有服务
pnpm build                # 构建所有项目

# 数据库
pnpm db:generate          # 生成 Prisma 客户端
pnpm db:push              # 推送 schema 到数据库
pnpm db:migrate           # 创建迁移
pnpm --filter @dse/database seed  # 运行种子数据

# 单独启动
pnpm --filter @dse/frontend dev   # 只启动前端
pnpm --filter @dse/backend dev    # 只启动后端
```

## 功能演示

### 生成题目示例

选择"力学" > "牛顿第二定律" > "选择题" > 难度3

AI 会生成类似：

```
一个质量为 2 kg 的物体在光滑水平面上受到 10 N 的水平力作用，
其加速度为：

A. 2 m/s²
B. 5 m/s²  ✓
C. 10 m/s²
D. 20 m/s²

解析：根据牛顿第二定律 F = ma
a = F/m = 10/2 = 5 m/s²
```

### 批改示例

学生答案：A

AI 批改结果：
```
得分: 0/10
判定: ❌ 错误

反馈:
你的答案不正确。正确答案是 B (5 m/s²)。
你可能混淆了加速度和力的关系。

能力评估:
- 概念理解: 不足
- 计算能力: 不足
- 逻辑推理: 一般

建议:
1. 复习牛顿第二定律公式 F=ma
2. 注意区分力、质量、加速度的关系
3. 练习单位转换
```

## 数据库结构

主要表：
- `knowledge_categories` - 知识点分类
- `knowledge_tags` - 知识点标签
- `ability_tags` - 能力标签
- `questions` - 题目
- `question_translations` - 题目翻译
- `user_answers` - 用户答案
- `grading_results` - 批改结果
- `ai_provider_configs` - AI 供应商配置

## 支持的 LLM 供应商

- **DeepSeek** ✅ (推荐，性价比高)
- **ChatGPT (OpenAI)** ✅
- **豆包 (Doubao)** ✅
- **通义千问 (Tongyi)** ✅
- **自定义供应商** ✅

## 下一步

### 功能增强
- [ ] 真题 PDF 解析（OCR + LaTeX 转换）
- [ ] LaTeX 和 PDF 导出
- [ ] 题目收藏和历史记录
- [ ] 用户系统和权限管理
- [ ] 题库搜索和筛选
- [ ] 批量生成题目
- [ ] 练习模式和考试模式

### 性能优化
- [ ] Redis 缓存
- [ ] 数据库索引优化
- [ ] API 响应缓存
- [ ] 图片和 LaTeX 渲染优化

### 部署
- [ ] Docker 容器化
- [ ] CI/CD 流程
- [ ] 生产环境配置
- [ ] 监控和日志

## 故障排查

### 数据库连接失败
```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 检查 DATABASE_URL 是否正确
echo $DATABASE_URL
```

### AI API 调用失败
- 检查 API Key 是否正确
- 检查网络连接
- 查看后端日志: `pnpm --filter @dse/backend dev`

### 前端无法连接后端
- 确保后端在 http://localhost:3000 运行
- 检查前端 vite.config.ts 中的 proxy 配置

## 获取帮助

- 📖 [完整文档](./docs/development.md)
- 🔌 [API 文档](./docs/api.md)
- 🚀 [部署指南](./docs/deployment.md)
- 🐛 [GitHub Issues](https://github.com/Ben-noncodingceo/dse-auto-problem-maker/issues)

## License

MIT
