# Cloudflare 部署快速参考 🚀

> 详细指南请看: [docs/cloudflare-deployment.md](docs/cloudflare-deployment.md)

## 📝 核心答案

### Q: LLM API Key 配置在哪里？

**答案**: 需要配置在 **两个地方**：

1. **GitHub Secrets** (用于自动部署)
   - 位置: GitHub 仓库 > Settings > Secrets and variables > Actions
   - 添加: `DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY`

2. **Cloudflare Worker Secrets** (用于运行时)
   - 方法 1: 使用命令行
     ```bash
     wrangler secret put DEEPSEEK_API_KEY
     ```
   - 方法 2: 在 Cloudflare Dashboard
     - Workers & Pages > dse-backend > Settings > Variables and Secrets

### Q: 为什么要配置两次？

- **GitHub Secrets**: 让 GitHub Actions 知道这个值，用于自动部署
- **Worker Secrets**: 让 Worker 运行时能访问这个值，用于调用 API

---

## 🎯 部署流程概览

```
1. 准备账号
   ├─ GitHub (已有 ✓)
   ├─ Cloudflare (免费注册)
   └─ Supabase (免费数据库)

2. 获取凭证
   ├─ Cloudflare Account ID
   ├─ Cloudflare API Token
   ├─ Supabase 数据库 URL
   └─ LLM API Key

3. 配置 GitHub Secrets (5个)
   ├─ CLOUDFLARE_API_TOKEN
   ├─ CLOUDFLARE_ACCOUNT_ID
   ├─ DATABASE_URL
   ├─ DEEPSEEK_API_KEY (或 OPENAI_API_KEY)
   └─ VITE_API_URL

4. 创建 Cloudflare Pages
   └─ 连接 GitHub 仓库，自动构建

5. 部署 Cloudflare Worker
   ├─ 本地安装 wrangler
   ├─ 设置 Worker Secrets
   └─ 运行 wrangler deploy

6. 初始化数据库
   ├─ pnpm db:push
   └─ pnpm --filter @dse/database seed

7. 合并到 main 分支
   └─ 自动触发 GitHub Actions 部署
```

---

## 🔐 Secrets 配置清单

### GitHub Secrets (全部必需)

| Secret 名称 | 获取方式 | 示例值 |
|------------|---------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard > API Tokens | `abc123...` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard > Account ID | `a1b2c3...` |
| `DATABASE_URL` | Supabase > Database Settings | `postgresql://...` |
| `DEEPSEEK_API_KEY` | DeepSeek 官网 | `sk-...` |
| `VITE_API_URL` | Worker 部署后的 URL | `https://dse-backend.xxx.workers.dev` |

### Worker Secrets (运行时必需)

在终端运行：

```bash
# 数据库
wrangler secret put DATABASE_URL

# LLM API (选一个或多个)
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put DOUBAO_API_KEY
wrangler secret put TONGYI_API_KEY
```

---

## ⚡ 快速命令

### 首次部署

```bash
# 1. 安装 Wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 设置 Secrets
wrangler secret put DATABASE_URL
wrangler secret put DEEPSEEK_API_KEY

# 4. 部署 Worker
wrangler deploy

# 5. 初始化数据库
export DATABASE_URL="你的数据库URL"
pnpm db:push
pnpm --filter @dse/database seed

# 6. 合并到 main 并推送
git checkout main
git merge claude/exam-question-generator-0195Eqi8oMnXnbNh6j6E81Cw
git push origin main
```

### 后续更新

```bash
# 推送到 main 分支，自动部署
git push origin main

# 或手动部署 Worker
wrangler deploy
```

---

## 🌐 你的 URLs

部署后保存这些 URL：

- **前端**: `https://dse-frontend.pages.dev`
- **后端**: `https://dse-backend.xxx.workers.dev`

---

## ✅ 验证部署

### 1. 检查前端
```bash
curl https://dse-frontend.pages.dev
```

### 2. 检查后端
```bash
curl https://dse-backend.xxx.workers.dev/api/health
```

应该返回:
```json
{"status":"ok","timestamp":"..."}
```

### 3. 检查数据库连接
访问前端，尝试生成题目。如果成功，说明全部正常！

---

## 🔄 自动部署工作原理

```
你推送代码到 GitHub (main 分支)
         ↓
GitHub Actions 自动触发
         ↓
    构建前端和后端
         ↓
部署到 Cloudflare Pages 和 Workers
         ↓
     完成！(2-3分钟)
```

查看部署状态: GitHub 仓库 > Actions 标签

---

## 🆘 常见问题速查

### 前端无法连接后端

1. 检查 Pages 环境变量 `VITE_API_URL` 是否正确
2. 检查 Worker 的 `CORS_ORIGIN` 设置

### Worker 返回 500 错误

1. 检查 Worker Secrets 是否设置
2. 查看 Worker 日志: Cloudflare Dashboard > Workers > Logs

### 数据库连接失败

1. 检查 `DATABASE_URL` 格式
2. 确认 Supabase 项目在运行
3. 确认已运行 `pnpm db:push`

### LLM API 调用失败

1. 确认 Worker Secret 已设置
2. 检查 API Key 是否有效
3. 检查 API 余额

---

## 📚 更多资源

- **完整指南**: [docs/cloudflare-deployment.md](docs/cloudflare-deployment.md)
- **API 文档**: [docs/api.md](docs/api.md)
- **开发指南**: [docs/development.md](docs/development.md)
- **Cloudflare 文档**: https://developers.cloudflare.com
- **Wrangler 文档**: https://developers.cloudflare.com/workers/wrangler

---

## 💡 成本估算

完全免费方案（适合个人使用）：

| 服务 | 免费额度 | 预估使用 |
|------|---------|---------|
| Cloudflare Pages | 无限请求 | ✅ 足够 |
| Cloudflare Workers | 100,000 请求/天 | ✅ 足够 |
| Supabase | 500MB 数据库 + 1GB 传输 | ✅ 足够 |
| DeepSeek API | 按使用付费 | 约 ¥10/月 |

**总成本**: 约 ¥10/月（仅 LLM API 调用费用）

---

祝你部署顺利！🎉

如有问题，请查看完整指南或提 Issue。
