# 部署指南

本文档介绍如何部署 DSE Auto Problem Maker 到生产环境。

## 部署架构

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   用户浏览器  │ ───> │  前端(CDN)   │ ───> │  后端 API     │
└─────────────┘      └─────────────┘      └──────────────┘
                                                   │
                                          ┌────────┴────────┐
                                          │                 │
                                    ┌─────▼─────┐   ┌──────▼──────┐
                                    │ PostgreSQL│   │  LLM APIs   │
                                    └───────────┘   └─────────────┘
```

## 前端部署

### 选项 1: Vercel（推荐）

1. 在 Vercel 中导入项目
2. 设置构建配置：
   ```
   Framework: Vite
   Root Directory: apps/frontend
   Build Command: pnpm build
   Output Directory: dist
   ```
3. 设置环境变量：
   ```
   VITE_API_URL=https://your-api-domain.com
   ```
4. 部署

### 选项 2: Netlify

类似 Vercel 的配置。

### 选项 3: 静态文件服务器

```bash
# 构建前端
cd apps/frontend
pnpm build

# 将 dist/ 目录部署到任何静态文件服务器
# 如 Nginx, Apache, Cloudflare Pages 等
```

## 后端部署

### 选项 1: Railway / Render（推荐）

1. 创建新服务
2. 连接 GitHub 仓库
3. 设置构建配置：
   ```
   Build Command: pnpm install && pnpm --filter @dse/backend build
   Start Command: pnpm --filter @dse/backend start
   ```
4. 添加 PostgreSQL 数据库服务
5. 设置环境变量（见下方）
6. 部署

### 选项 2: Docker

```dockerfile
# Dockerfile (根目录)
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/llm/package.json ./packages/llm/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm db:generate
RUN pnpm --filter @dse/backend build

# Production
FROM base AS production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/packages ./packages

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/backend/dist/index.js"]
```

```bash
# 构建镜像
docker build -t dse-backend .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e DEEPSEEK_API_KEY="..." \
  dse-backend
```

### 选项 3: VPS (Ubuntu)

```bash
# 1. 安装 Node.js 和 pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# 2. 克隆仓库
git clone https://github.com/your-repo/dse-auto-problem-maker.git
cd dse-auto-problem-maker

# 3. 安装依赖
pnpm install

# 4. 设置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 5. 初始化数据库
pnpm db:generate
pnpm db:migrate
pnpm --filter @dse/database seed

# 6. 构建
pnpm build

# 7. 使用 PM2 运行
npm install -g pm2
pm2 start apps/backend/dist/index.js --name dse-backend
pm2 save
pm2 startup  # 设置开机自启
```

## 数据库

### 托管 PostgreSQL（推荐）

- **Supabase**: 提供免费套餐，易于使用
- **Railway**: PostgreSQL 插件
- **Render**: PostgreSQL 服务
- **AWS RDS**: 企业级方案

### 自托管 PostgreSQL

```bash
# 使用 Docker
docker run -d \
  --name dse-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=dse_auto_problem_maker \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

## 环境变量

### 后端必需的环境变量

```env
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/dse_auto_problem_maker"

# 服务器
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

# AI 供应商（至少配置一个）
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# 或使用 OpenAI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4

# 文件上传
UPLOAD_DIR=/var/uploads
MAX_FILE_SIZE=10485760
```

## 数据库迁移

在生产环境中使用 Prisma Migrate：

```bash
# 创建迁移
pnpm db:migrate

# 应用迁移到生产数据库
DATABASE_URL="production-db-url" pnpm db:migrate deploy
```

## 安全建议

1. **API Key 管理**
   - 不要将 API Key 提交到 Git
   - 使用环境变量或密钥管理服务
   - 定期轮换 API Key

2. **数据库安全**
   - 使用强密码
   - 启用 SSL 连接
   - 限制数据库访问 IP

3. **CORS 配置**
   - 仅允许前端域名访问后端
   - 不要使用 `*` 通配符

4. **HTTPS**
   - 前后端都启用 HTTPS
   - 使用 Let's Encrypt 免费证书

## 监控和日志

### 使用 PM2 日志

```bash
# 查看日志
pm2 logs dse-backend

# 查看实时日志
pm2 logs dse-backend --lines 100
```

### 使用日志服务

- **Sentry**: 错误追踪
- **LogRocket**: 用户会话回放
- **Datadog**: 全栈监控

## 备份

### 数据库备份

```bash
# 手动备份
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 自动备份（cron）
0 2 * * * pg_dump $DATABASE_URL > /backups/backup_$(date +\%Y\%m\%d).sql
```

### 自动化备份

使用托管数据库服务的自动备份功能（推荐）。

## 性能优化

1. **前端**
   - 启用 CDN
   - 启用 Gzip/Brotli 压缩
   - 使用浏览器缓存

2. **后端**
   - 启用 Redis 缓存（可选）
   - 数据库连接池
   - API 响应缓存

3. **数据库**
   - 添加必要的索引
   - 定期 VACUUM 和 ANALYZE

## 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
pnpm install

# 3. 运行数据库迁移
pnpm db:migrate deploy

# 4. 重新构建
pnpm build

# 5. 重启服务
pm2 restart dse-backend
```

## 故障排查

### 后端无法启动

1. 检查环境变量是否正确
2. 检查数据库连接
3. 查看日志: `pm2 logs dse-backend`

### 数据库连接失败

1. 检查 DATABASE_URL
2. 检查防火墙规则
3. 检查数据库服务状态

### AI API 调用失败

1. 检查 API Key 是否有效
2. 检查网络连接
3. 检查 API 配额

## 扩展性

### 水平扩展

- 使用负载均衡器（如 Nginx, HAProxy）
- 部署多个后端实例
- 使用共享 Redis 存储会话

### 数据库扩展

- 读写分离
- 数据库分片
- 使用 Prisma Accelerate

## 成本优化

1. **免费套餐组合**
   - 前端: Vercel / Netlify 免费套餐
   - 后端: Railway / Render 免费套餐
   - 数据库: Supabase 免费套餐

2. **低成本方案**
   - VPS: DigitalOcean / Linode ($5-10/月)
   - 数据库: 自托管在 VPS
   - CDN: Cloudflare 免费套餐

## 支持

如有部署问题，请在 GitHub Issues 中提问。
