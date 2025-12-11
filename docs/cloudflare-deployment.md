# Cloudflare 部署完整指南（小白版）

本指南将一步一步教你如何将项目部署到 Cloudflare，实现自动部署和更新。

## 📋 部署架构

```
GitHub 仓库
    ↓ (自动触发)
GitHub Actions
    ↓ (自动部署)
┌─────────────────┬─────────────────┐
│ Cloudflare Pages│ Cloudflare Worker│
│   (前端)         │    (后端 API)    │
└─────────────────┴─────────────────┘
```

## 🎯 部署目标

- **前端**: Cloudflare Pages (免费)
- **后端**: Cloudflare Workers (免费套餐 100,000 请求/天)
- **数据库**: 外部 PostgreSQL (推荐 Supabase 免费版)
- **自动部署**: GitHub Actions (推送到 main 分支自动部署)

---

## 📝 准备工作（需要的账号）

### 1. GitHub 账号
- 已有 ✅ (你的代码已经在 GitHub)

### 2. Cloudflare 账号
- 访问: https://dash.cloudflare.com/sign-up
- 注册一个免费账号
- **记下你的 Account ID**（稍后需要）

### 3. 数据库账号（推荐 Supabase）
- 访问: https://supabase.com
- 注册免费账号
- 创建新项目
- 获取 PostgreSQL 连接字符串

---

## 🔑 第一步：获取 Cloudflare 信息

### 1.1 获取 Account ID

1. 登录 Cloudflare Dashboard: https://dash.cloudflare.com
2. 点击右上角你的头像
3. 点击 "My Profile"
4. 在左侧菜单选择 "API Tokens"
5. 往下滚动，在页面右侧找到 **Account ID**
6. 复制并保存这个 ID（类似 `a1b2c3d4e5f6...`）

### 1.2 创建 API Token

1. 在同一页面，点击 "Create Token"
2. 找到 "Edit Cloudflare Workers" 模板，点击 "Use template"
3. 权限设置保持默认
4. 点击 "Continue to summary"
5. 点击 "Create Token"
6. **立即复制并保存这个 Token**（只会显示一次！）

---

## 🗄️ 第二步：设置数据库（Supabase）

### 2.1 创建数据库项目

1. 登录 https://supabase.com
2. 点击 "New project"
3. 填写信息：
   - Name: `dse-auto-problem-maker`
   - Database Password: 设置一个强密码（记住它！）
   - Region: 选择离你近的（如 Singapore）
4. 点击 "Create new project"
5. 等待 2-3 分钟创建完成

### 2.2 获取数据库连接字符串

1. 在项目页面，点击左侧 "Settings"（齿轮图标）
2. 点击 "Database"
3. 往下滚动找到 "Connection string"
4. 选择 "URI" 模式
5. 复制连接字符串（类似 `postgresql://postgres:[YOUR-PASSWORD]@...`）
6. 将 `[YOUR-PASSWORD]` 替换为你刚才设置的密码
7. **保存这个完整的连接字符串**

---

## 🔐 第三步：在 GitHub 设置 Secrets

**重要：LLM API Key 要设置在 GitHub Secrets 中，然后通过 GitHub Actions 自动配置到 Worker！**

### 3.1 进入 GitHub Secrets 设置

1. 打开你的 GitHub 仓库
2. 点击 "Settings"（设置）
3. 左侧菜单找到 "Secrets and variables"
4. 点击 "Actions"
5. 点击 "New repository secret"

### 3.2 添加以下 Secrets（一个一个添加）

#### Secret 1: CLOUDFLARE_API_TOKEN
- Name: `CLOUDFLARE_API_TOKEN`
- Value: 粘贴第一步获取的 API Token
- 点击 "Add secret"

#### Secret 2: CLOUDFLARE_ACCOUNT_ID
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: 粘贴第一步获取的 Account ID
- 点击 "Add secret"

#### Secret 3: DATABASE_URL
- Name: `DATABASE_URL`
- Value: 粘贴 Supabase 的连接字符串
- 点击 "Add secret"

#### Secret 4: DEEPSEEK_API_KEY (或其他 LLM)
- Name: `DEEPSEEK_API_KEY`
- Value: 粘贴你的 DeepSeek API Key
- 点击 "Add secret"

如果使用 OpenAI:
- Name: `OPENAI_API_KEY`
- Value: 粘贴你的 OpenAI API Key

#### Secret 5: VITE_API_URL
- Name: `VITE_API_URL`
- Value: 先填 `https://dse-backend.your-subdomain.workers.dev`
- **注意**: 稍后需要更新为实际的 Worker URL

---

## 📦 第四步：部署前端到 Cloudflare Pages

### 4.1 创建 Pages 项目

1. 访问 https://dash.cloudflare.com
2. 左侧菜单选择 "Workers & Pages"
3. 点击 "Create application"
4. 选择 "Pages" 标签
5. 点击 "Connect to Git"
6. 授权 Cloudflare 访问你的 GitHub
7. 选择 `dse-auto-problem-maker` 仓库
8. 点击 "Begin setup"

### 4.2 配置构建设置

**Framework preset**: `Vite`

**Build configurations**:
- Production branch: `main`
- Build command: `pnpm install && pnpm --filter @dse/frontend build`
- Build output directory: `apps/frontend/dist`
- Root directory: `/` (留空或填 `/`)

**Environment variables**:
- 点击 "Add variable"
- Name: `VITE_API_URL`
- Value: `https://dse-backend.your-subdomain.workers.dev`（稍后更新）

点击 "Save and Deploy"

### 4.3 等待首次部署

- 等待 3-5 分钟
- 部署成功后，会显示你的 Pages URL
- 类似 `https://dse-frontend.pages.dev`
- **复制并保存这个 URL**

---

## ⚙️ 第五步：部署后端到 Cloudflare Workers

### 5.1 安装 Wrangler CLI（在本地电脑）

打开终端（Terminal）：

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

这会打开浏览器，点击"允许"授权。

### 5.2 配置 wrangler.toml

编辑项目根目录的 `wrangler.toml` 文件：

```toml
name = "dse-backend"
main = "apps/backend/src/index.ts"
compatibility_date = "2024-01-01"

[vars]
NODE_ENV = "production"
CORS_ORIGIN = "https://dse-frontend.pages.dev"  # 替换为你的 Pages URL
```

### 5.3 设置 Worker Secrets

在终端运行以下命令（一个一个运行）：

```bash
# 设置数据库连接
wrangler secret put DATABASE_URL
# 粘贴你的 Supabase 连接字符串，按 Enter

# 设置 DeepSeek API Key
wrangler secret put DEEPSEEK_API_KEY
# 粘贴你的 API Key，按 Enter

# 如果使用 OpenAI
wrangler secret put OPENAI_API_KEY
# 粘贴你的 API Key，按 Enter
```

### 5.4 首次部署 Worker

```bash
# 在项目根目录运行
wrangler deploy
```

等待部署完成，会显示你的 Worker URL：
- 类似 `https://dse-backend.your-subdomain.workers.dev`
- **复制并保存这个 URL**

---

## 🔄 第六步：更新 URL 配置

### 6.1 更新前端环境变量

1. 回到 Cloudflare Dashboard
2. 进入 "Workers & Pages"
3. 选择你的 Pages 项目 (dse-frontend)
4. 点击 "Settings"
5. 找到 "Environment variables"
6. 编辑 `VITE_API_URL`
7. 更新为实际的 Worker URL: `https://dse-backend.your-subdomain.workers.dev`
8. 点击 "Save"

### 6.2 更新 GitHub Secret

1. 回到 GitHub 仓库
2. Settings > Secrets and variables > Actions
3. 找到 `VITE_API_URL`
4. 点击 "Update"
5. 更新为实际的 Worker URL
6. 点击 "Update secret"

### 6.3 更新 wrangler.toml

编辑 `wrangler.toml`，更新 CORS_ORIGIN：

```toml
[vars]
CORS_ORIGIN = "https://dse-frontend.pages.dev"  # 你的实际 Pages URL
```

提交更改：

```bash
git add wrangler.toml
git commit -m "chore: 更新 Cloudflare 部署配置"
git push
```

---

## 🚀 第七步：初始化数据库

### 7.1 在本地运行数据库迁移

```bash
# 设置环境变量（临时）
export DATABASE_URL="你的 Supabase 连接字符串"

# 运行数据库迁移
pnpm db:push

# 导入初始数据
pnpm --filter @dse/database seed
```

现在数据库已经准备好了！

---

## ✅ 第八步：测试部署

### 8.1 访问前端

打开浏览器，访问你的 Pages URL：
- `https://dse-frontend.pages.dev`

### 8.2 测试功能

1. 点击"生成题目"
2. 选择知识点
3. 点击"生成题目"
4. 如果成功生成，说明后端 API 和数据库都正常！

---

## 🔄 第九步：设置自动部署

### 9.1 合并代码到 main 分支

现在你的代码在 feature 分支，需要合并到 main：

```bash
# 切换到 main 分支
git checkout main

# 合并 feature 分支
git merge claude/exam-question-generator-0195Eqi8oMnXnbNh6j6E81Cw

# 推送到 GitHub
git push origin main
```

### 9.2 GitHub Actions 自动部署

推送到 main 后，GitHub Actions 会自动：
1. 构建前端
2. 部署到 Cloudflare Pages
3. 部署后端到 Cloudflare Workers

查看部署状态：
1. GitHub 仓库页面
2. 点击 "Actions" 标签
3. 查看最新的 workflow 运行状态

---

## 🎉 完成！

现在你的项目已经：
- ✅ 部署到 Cloudflare Pages (前端)
- ✅ 部署到 Cloudflare Workers (后端)
- ✅ 连接到 Supabase 数据库
- ✅ 配置了 LLM API
- ✅ 设置了自动部署

每次推送到 main 分支，都会自动重新部署！

---

## 📊 重要信息总结

### 你的 URLs
- **前端**: https://dse-frontend.pages.dev
- **后端**: https://dse-backend.your-subdomain.workers.dev

### Secrets 配置位置

| Secret 类型 | 配置位置 | 用途 |
|------------|---------|------|
| LLM API Keys | GitHub Secrets + Worker Secrets | AI 调用 |
| DATABASE_URL | GitHub Secrets + Worker Secrets | 数据库连接 |
| CLOUDFLARE_API_TOKEN | GitHub Secrets | 自动部署 |
| CLOUDFLARE_ACCOUNT_ID | GitHub Secrets | 自动部署 |
| VITE_API_URL | GitHub Secrets + Pages 环境变量 | 前端连接后端 |

**重要**:
- **LLM API Key 同时设置在两个地方**:
  1. GitHub Secrets (供 GitHub Actions 使用)
  2. Worker Secrets (供 Worker 运行时使用)

---

## 🔧 常见问题

### Q1: 前端显示 "无法连接后端"

**解决方案**:
1. 检查 Pages 环境变量中的 `VITE_API_URL` 是否正确
2. 检查 Worker 的 `CORS_ORIGIN` 是否包含 Pages URL
3. 重新部署前端

### Q2: 后端 API 返回 500 错误

**解决方案**:
1. 检查 Worker Secrets 是否正确设置（DATABASE_URL, API Keys）
2. 查看 Worker 日志: Cloudflare Dashboard > Workers > dse-backend > Logs
3. 确认数据库已初始化（运行了 seed 脚本）

### Q3: 数据库连接失败

**解决方案**:
1. 检查 DATABASE_URL 格式是否正确
2. 确认 Supabase 项目正在运行
3. 检查 IP 白名单设置（Supabase 默认允许所有连接）

### Q4: GitHub Actions 部署失败

**解决方案**:
1. 检查所有 GitHub Secrets 是否设置正确
2. 查看 Actions 日志获取详细错误信息
3. 确认 CLOUDFLARE_API_TOKEN 有足够权限

### Q5: LLM API 调用失败

**解决方案**:
1. 确认在 Worker Secrets 中设置了 API Key
2. 检查 API Key 是否有效和有余额
3. 在管理后台检查 AI 供应商配置

---

## 🆘 获取帮助

如果遇到问题：
1. 查看 Cloudflare Worker 日志
2. 查看 GitHub Actions 日志
3. 查看浏览器控制台错误
4. 在 GitHub Issues 提问

---

## 💡 优化建议

### 1. 自定义域名

在 Cloudflare Pages 设置中添加自定义域名：
1. Pages 项目 > Custom domains
2. 添加你的域名
3. 按照提示配置 DNS

### 2. 设置缓存

在 Worker 中添加缓存可以减少 API 调用：
- 使用 Cloudflare KV 缓存翻译结果
- 缓存常用的知识点数据

### 3. 监控和分析

启用 Cloudflare Analytics:
- Workers & Pages > 选择项目 > Analytics
- 查看请求量、错误率等

---

## 🔐 安全建议

1. **定期轮换 API Keys**
   - 每 3-6 个月更换一次
   - 使用 `wrangler secret put` 更新

2. **限制 CORS**
   - 只允许你的前端域名访问后端
   - 不要使用 `*` 通配符

3. **保护 Secrets**
   - 不要将 Secrets 提交到 Git
   - 不要在代码中硬编码

4. **使用强密码**
   - 数据库密码至少 16 位
   - 包含大小写字母、数字、特殊字符

---

好的！现在你有了完整的部署配置。祝部署顺利！ 🎉
