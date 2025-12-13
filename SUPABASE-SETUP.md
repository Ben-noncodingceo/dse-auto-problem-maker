# 📖 Supabase 数据库初始化指南

## 🎯 问题：在 Supabase 中找不到 "New query"

Supabase 的界面可能有些不同。让我告诉你正确的步骤：

---

## 📝 方法一：使用 SQL Editor（推荐）

### 步骤 1：打开 SQL Editor

1. 登录 Supabase: https://supabase.com
2. 选择你的项目（点击项目卡片）
3. 在左侧菜单栏找到 **SQL Editor** 图标（通常是 `</>`代码符号）
4. 点击进入 SQL Editor

### 步骤 2：创建新查询

在 SQL Editor 页面：
- 如果看到 **"+ New query"** 按钮，点击它
- 如果没有，直接在编辑器区域输入 SQL

### 步骤 3：运行初始化脚本

1. 打开项目文件 `database-init.sql`
2. **复制全部内容**（Ctrl+A 然后 Ctrl+C）
3. **粘贴到 SQL Editor**（Ctrl+V）
4. 点击右上角的 **"Run"** 按钮（或按 Ctrl+Enter）
5. 等待执行完成（大约 5-10 秒）

✅ 如果看到绿色的成功提示，说明数据库初始化完成！

---

## 📝 方法二：使用 Table Editor（如果 SQL Editor 找不到）

如果你的 Supabase 界面中真的没有 SQL Editor，可以使用这个方法：

### 步骤 1：打开 Database

1. 左侧菜单点击 **"Database"**（数据库图标）
2. 你会看到 "Tables"、"Functions"、"Extensions" 等标签

### 步骤 2：找到 SQL 编辑器

在 Database 页面：
- 查找顶部的标签栏
- 点击 **"SQL"** 或 **"Query Editor"** 标签
- 应该会出现一个 SQL 输入框

### 步骤 3：执行初始化脚本

同样复制 `database-init.sql` 的内容并粘贴运行。

---

## 🔗 如何连接 Supabase 和 Cloudflare Worker

Worker 通过 **DATABASE_URL** 连接到 Supabase。以下是详细步骤：

### 第 1 步：获取 Supabase 数据库连接字符串

⚠️ **重要：Cloudflare Worker 必须使用连接池（Connection Pooling）**

1. 在 Supabase 项目页面
2. 点击左侧的 **"Project Settings"**（齿轮图标）
3. 在左侧菜单点击 **"Database"**
4. 向下滚动找到 **"Connection string"** 部分
5. 选择 **"Session pooling"** 模式（⚠️ 不是 Transaction pooling，也不是 URI）
6. 你会看到类似这样的字符串（注意端口是 **6543**）：
   ```
   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```
7. **重要**：将 `[YOUR-PASSWORD]` 替换为你创建项目时设置的数据库密码
8. **复制完整的连接字符串**

💡 **为什么要用 6543 端口？**
- Cloudflare Workers 是无服务器环境，不支持长连接
- 端口 6543 使用连接池，专为无服务器设计
- 端口 5432 是直连数据库，Worker 无法使用

### 第 2 步：在 GitHub 设置 DATABASE_URL Secret

你已经设置了这个 Secret ✅，但请确认：

1. GitHub 仓库 → Settings → Secrets and variables → Actions
2. 检查 `DATABASE_URL` 的值是否是完整的连接字符串
3. ⚠️ **格式必须包含端口 6543（连接池）**：
   ```
   postgresql://postgres.xxx:你的密码@aws-0-xx.pooler.supabase.com:6543/postgres
   ```

### 第 3 步：GitHub Actions 会自动注入

当你推送代码到 main 分支时：
1. GitHub Actions 会自动部署 Worker
2. **自动将 DATABASE_URL 注入到 Worker 中**
3. Worker 就能连接到 Supabase 了！

### 第 4 步：验证连接

Worker 部署成功后，访问：
```
https://dse-auto-problem-maker.peungsun.workers.dev/api/health
```

如果返回：
```json
{"status":"ok","timestamp":"..."}
```

说明连接成功！✅

---

## ⚠️ 常见问题

### Q1: 执行 SQL 脚本时报错："relation already exists"

**原因**：数据库中已经有这些表了。

**解决方案**：
1. 删除现有的表（如果是测试数据）
2. 或者跳过这个错误，继续使用现有的表

### Q2: 连接字符串中的密码在哪里？

**答案**：
- 是你创建 Supabase 项目时设置的数据库密码
- 如果忘记了，在 Project Settings → Database → Reset Database Password

### Q3: Worker 无法连接到数据库

**检查清单**：
1. DATABASE_URL 格式正确（`postgresql://...`）
2. 密码已替换（不是 `[YOUR-PASSWORD]`）
3. GitHub Secret 已设置
4. Worker 已重新部署

### Q4: Supabase 免费版有限制吗？

**答案**：
- 500 MB 存储空间 ✅ 足够
- 2GB 数据传输/月 ✅ 足够
- 最多 500,000 行数据 ✅ 足够

完全够用！🎉

---

## 🎯 快速检查清单

- [ ] 在 Supabase SQL Editor 运行 `database-init.sql`
- [ ] 获取 Supabase 数据库连接字符串
- [ ] 在 GitHub Secrets 中设置 `DATABASE_URL`
- [ ] 推送代码到 main 分支
- [ ] 等待 GitHub Actions 部署完成
- [ ] 访问 Worker URL/api/health 验证连接

---

## 📸 如果还找不到 SQL Editor

请给我发一张你的 Supabase 界面截图，我帮你找到正确的位置！

或者告诉我你看到的菜单选项，我可以指导你。
