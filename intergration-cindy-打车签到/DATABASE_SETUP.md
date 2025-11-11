# 🗄️ 数据库设置指南

## ❌ 当前问题

Supabase 项目不存在或已被删除，导致：
- ❌ 无法连接数据库
- ❌ 无法登录
- ❌ 所有 API 请求失败

```
Error: Could not resolve host: jfgenxnqpuutgdnnngsl.supabase.co
```

## ✅ 解决方案

### 选项 1：创建新的 Supabase 项目（推荐 - 5分钟）

#### 步骤 1：创建 Supabase 账号和项目

1. 访问 [Supabase](https://supabase.com/)
2. 点击 **"Start your project"** 或 **"Sign in"**
3. 使用 GitHub 账号登录（最快）
4. 点击 **"New Project"**
5. 填写信息：
   - **Name**: `campusride` (或任意名称)
   - **Database Password**: 设置一个强密码（**记住它！**）
   - **Region**: 选择离你最近的区域
   - **Pricing Plan**: 选择 **Free** (免费)
6. 点击 **"Create new project"**
7. 等待 2-3 分钟项目创建完成

#### 步骤 2：获取 API 密钥

项目创建后：

1. 进入项目 Dashboard
2. 左侧菜单 → **Settings** → **API**
3. 复制以下信息：
   - **Project URL** (例如: `https://abc123.supabase.co`)
   - **anon public** key (第一个密钥)
   - **service_role** key (第二个密钥，点击 "reveal" 显示)

#### 步骤 3：更新环境变量

编辑 `campusride-backend/.env` 文件：

```bash
# Supabase配置
SUPABASE_URL=你的项目URL  # 从上面复制
SUPABASE_ANON_KEY=你的anon密钥  # 从上面复制
SUPABASE_SERVICE_KEY=你的service_role密钥  # 从上面复制
```

#### 步骤 4：创建数据库表

在 Supabase Dashboard：

1. 左侧菜单 → **SQL Editor**
2. 点击 **"+ New query"**
3. 复制并粘贴 `campusride-backend/src/database/schema.sql` 的内容
4. 点击 **"Run"** 执行

或者在终端运行：
```bash
cd campusride-backend
npm run db:init
```

#### 步骤 5：创建测试账号

```bash
cd campusride-backend
node scripts/create-demo-user.js
```

#### 步骤 6：重启后端服务器

停止当前服务器 (Ctrl+C)，然后重启：
```bash
cd campusride-backend
npm run dev
```

---

### 选项 2：使用本地 PostgreSQL 数据库

如果你已经安装了 PostgreSQL：

#### 1. 安装 PostgreSQL（如果没有）

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
下载安装：https://www.postgresql.org/download/windows/

#### 2. 创建数据库

```bash
psql postgres
CREATE DATABASE campusride;
CREATE USER campusride_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE campusride TO campusride_user;
\q
```

#### 3. 更新环境变量

编辑 `.env`:
```bash
DATABASE_URL=postgresql://campusride_user:your_password@localhost:5432/campusride
```

#### 4. 运行迁移

```bash
npm run db:init
node scripts/create-demo-user.js
```

---

### 选项 3：快速演示模式（最简单 - 1分钟）

我可以帮你设置一个内存数据库用于快速演示和测试。

---

## 🔍 验证设置是否成功

### 测试数据库连接

```bash
cd campusride-backend
node scripts/test-db-connection.js
```

应该看到：
```
✅ Database connection successful!
```

### 测试登录

1. 打开浏览器：`http://localhost:3000/login`
2. 输入：
   - Email: `demo@cornell.edu`
   - Password: `demo1234`
3. 应该能成功登录！

---

## 📋 快速命令参考

```bash
# 测试数据库连接
node scripts/test-db-connection.js

# 创建数据库表
npm run db:init

# 创建测试账号
node scripts/create-demo-user.js

# 查看所有用户
node scripts/view-users.js

# 重启开发服务器
npm run dev
```

---

## ❓ 常见问题

### Q: 为什么之前的 Supabase 项目失效了？
A: Supabase 免费项目如果长时间不活跃会被暂停。你需要创建一个新项目。

### Q: 使用 Supabase 免费版有什么限制？
A: 
- 500MB 数据库存储
- 2GB 文件存储
- 50,000 次 API 请求/月
- 对于开发和小规模使用完全够用！

### Q: 我不想创建 Supabase 账号怎么办？
A: 可以使用选项 2 (本地 PostgreSQL) 或选项 3 (内存数据库演示模式)

---

## 🆘 需要帮助？

如果遇到问题，请告诉我：
1. 你选择哪个选项？
2. 在哪一步遇到问题？
3. 具体的错误信息是什么？

我会帮你解决！🚀


