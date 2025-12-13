# 🚀 DSE 自动出题系统 - 部署完整检查清单

## ✅ 第一步：Supabase 数据库设置

### 1.1 创建 Supabase 项目
- [ ] 访问 https://supabase.com 并登录
- [ ] 创建新项目（选择离你最近的区域，如 ap-northeast-1）
- [ ] **记住你设置的数据库密码**（很重要！）

### 1.2 初始化数据库
- [ ] 在 Supabase 左侧菜单找到 **SQL Editor**
- [ ] 点击 **"+ New query"** 创建新查询
- [ ] 复制 `database-init.sql` 的全部内容
- [ ] 粘贴到 SQL Editor 并点击 **"Run"**
- [ ] 确认看到绿色的成功提示

### 1.3 获取连接字符串（重要！）
- [ ] 进入 **Project Settings** → **Database**
- [ ] 找到 **Connection string** 部分
- [ ] ⚠️ **选择 "Session pooling" 模式**（端口 6543）
- [ ] 复制连接字符串（类似 `postgresql://postgres.xxx:[YOUR-PASSWORD]@...pooler.supabase.com:6543/postgres`）
- [ ] 将 `[YOUR-PASSWORD]` 替换为你的实际密码
- [ ] 保存这个完整的连接字符串

---

## ✅ 第二步：Cloudflare 账号设置

### 2.1 获取 Cloudflare API Token
- [ ] 登录 https://dash.cloudflare.com
- [ ] 进入 **My Profile** → **API Tokens**
- [ ] 点击 **"Create Token"**
- [ ] 选择 **"Edit Cloudflare Workers"** 模板
- [ ] 权限设置：
  - Account - Cloudflare Pages - Edit
  - Account - Cloudflare Workers Scripts - Edit
- [ ] 点击 **"Continue to summary"** → **"Create Token"**
- [ ] **复制并保存这个 Token**（只显示一次！）

### 2.2 获取 Account ID
- [ ] 在 Cloudflare Dashboard 主页
- [ ] 右侧栏找到 **Account ID**
- [ ] 点击复制按钮
- [ ] 保存这个 Account ID

---

## ✅ 第三步：GitHub Secrets 配置

### 3.1 基础配置（必需）
在 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

添加以下 Secrets：

- [ ] `CLOUDFLARE_API_TOKEN`
  ```
  你的 Cloudflare API Token（第二步获取）
  ```

- [ ] `CLOUDFLARE_ACCOUNT_ID`
  ```
  你的 Cloudflare Account ID（第二步获取）
  ```

- [ ] `DATABASE_URL`
  ```
  postgresql://postgres.xxx:你的密码@...pooler.supabase.com:6543/postgres
  （第一步获取，必须是 6543 端口！）
  ```

### 3.2 AI Provider API Keys（至少配置一个）

- [ ] `DEEPSEEK_API_KEY`（推荐，性价比最高）
  ```
  你的 DeepSeek API Key
  获取地址：https://platform.deepseek.com
  ```

- [ ] `OPENAI_API_KEY`（可选）
  ```
  你的 OpenAI API Key
  获取地址：https://platform.openai.com
  ```

- [ ] `DOUBAO_API_KEY`（可选）
  ```
  你的豆包 API Key
  获取地址：https://www.volcengine.com/
  ```

- [ ] `TONGYI_API_KEY`（可选）
  ```
  你的通义千问 API Key
  获取地址：https://dashscope.aliyun.com/
  ```

### 3.3 前端配置

- [ ] `VITE_API_URL`
  ```
  https://dse-auto-problem-maker.<你的子域>.workers.dev
  （Worker 部署后会得到这个 URL）
  ```

---

## ✅ 第四步：Cloudflare Pages 配置

### 4.1 创建 Pages 项目
- [ ] 登录 Cloudflare Dashboard
- [ ] 进入 **Workers & Pages**
- [ ] 点击 **"Create application"** → **"Pages"** → **"Connect to Git"**
- [ ] 选择你的 GitHub 仓库
- [ ] 项目名称：`dse-frontend`

### 4.2 构建配置
- [ ] **Framework preset**: 选择 `Vite`
- [ ] **Build command**: `pnpm install && pnpm --filter @dse/frontend build`
- [ ] **Build output directory**: `apps/frontend/dist`
- [ ] **Root directory**: 留空
- [ ] 点击 **"Save and Deploy"**

---

## ✅ 第五步：合并代码触发自动部署

### 5.1 合并分支
```bash
# 切换到 main 分支
git checkout main

# 合并你的开发分支
git merge claude/exam-question-generator-0195Eqi8oMnXnbNh6j6E81Cw

# 推送到 GitHub
git push origin main
```

### 5.2 监控部署
- [ ] 访问 GitHub 仓库的 **Actions** 标签
- [ ] 查看最新的 **"Deploy to Cloudflare"** workflow
- [ ] 等待两个任务完成：
  - ✅ Deploy Frontend to Cloudflare Pages
  - ✅ Deploy Backend to Cloudflare Workers

---

## ✅ 第六步：验证部署

### 6.1 验证 Worker（后端）
访问：
```
https://dse-auto-problem-maker.<你的子域>.workers.dev/health
```

应该返回：
```json
{"status":"ok","timestamp":"2024-..."}
```

### 6.2 验证 Pages（前端）
访问：
```
https://dse-frontend.pages.dev
```

应该看到前端界面正常加载。

### 6.3 验证数据库连接
访问：
```
https://dse-auto-problem-maker.<你的子域>.workers.dev/api/knowledge/categories
```

应该返回知识点分类列表（初始数据）。

---

## ✅ 第七步：配置 AI Provider

### 7.1 访问管理后台
```
https://dse-frontend.pages.dev/admin
```

### 7.2 配置 AI 供应商
- [ ] 点击 **"AI 供应商管理"**
- [ ] 点击 **"添加供应商"**
- [ ] 填写信息：
  - **名称**: DeepSeek（或其他）
  - **Provider**: deepseek（或 chatgpt、doubao、tongyi）
  - **Base URL**: https://api.deepseek.com/v1（根据供应商调整）
  - **Model**: deepseek-chat（根据供应商调整）
  - **API Key**: 在 GitHub Secrets 中设置的 key
  - **设为默认**: ✅
- [ ] 保存

---

## 🎯 完成！

现在你的系统已经完全部署好了！

### 主要功能入口：

1. **生成题目**
   ```
   https://dse-frontend.pages.dev/generate
   ```

2. **管理后台**
   ```
   https://dse-frontend.pages.dev/admin
   ```

3. **API 文档**（Health Check）
   ```
   https://dse-auto-problem-maker.<你的子域>.workers.dev/health
   ```

---

## ⚠️ 常见问题排查

### 问题 1：Worker 部署失败
**检查**：
- GitHub Secrets 是否都设置正确
- DATABASE_URL 是否使用 6543 端口（连接池）
- Cloudflare API Token 权限是否足够

### 问题 2：数据库连接失败
**检查**：
- Supabase 项目是否正常运行
- DATABASE_URL 密码是否正确
- 是否使用了 Session pooling（6543 端口）

### 问题 3：前端无法连接后端
**检查**：
- VITE_API_URL 是否设置正确
- Worker URL 是否正确
- CORS 配置是否正确（wrangler.toml 中的 CORS_ORIGIN）

### 问题 4：AI 生成失败
**检查**：
- AI Provider 是否配置正确
- API Key 是否有效
- API 余额是否充足

---

## 📞 需要帮助？

如果遇到任何问题，请检查：

1. **GitHub Actions 日志**（查看详细错误信息）
2. **Cloudflare Workers 日志**（实时请求日志）
3. **浏览器控制台**（前端错误信息）

祝部署顺利！🎉
