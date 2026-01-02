# CampusRide 部署指南

本指南帮助你将 CampusRide 项目从本地部署到 GitHub + Vercel + Supabase + Railway 架构。

## 📁 项目结构

```
integration/                  # 前端 (Vue.js) - 部署到 Vercel
  ├── src/
  ├── vercel.json
  ├── .env.production        # 前端生产环境变量
  └── package.json

integration/campusride-backend/  # 后端 (Node.js) - 部署到 Railway
  ├── src/
  ├── railway.json
  ├── .env.production        # 后端生产环境变量（仅参考）
  └── package.json
```

## 🗃️ 第一步：初始化 Supabase 数据库

你的数据库已清空，需要重新创建表结构。

### 方法1：通过 Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目 `jfgenxnqpuutgdnnngsl`
3. 点击左侧 **SQL Editor**
4. 复制 `integration/campusride-backend/database/migrations/000_complete_schema.sql` 的全部内容
5. 粘贴到 SQL Editor 并点击 **Run**

### 方法2：通过命令行（需要 psql）

```bash
# 获取数据库连接字符串（在 Supabase Dashboard > Settings > Database 中找到）
psql "postgresql://postgres:[PASSWORD]@db.jfgenxnqpuutgdnnngsl.supabase.co:5432/postgres" \
  -f integration/campusride-backend/database/migrations/000_complete_schema.sql
```

## 🚂 第二步：部署 Railway（后端）

### 2.1 准备代码

```bash
# 创建一个新的目录用于部署
mkdir ~/campusride-deploy
cd ~/campusride-deploy

# 只复制后端代码
cp -r /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend .

# 进入后端目录
cd campusride-backend

# 初始化git（如果还没有）
git init
git add .
git commit -m "Initial backend deployment"
```

### 2.2 在 Railway Dashboard 配置

1. 登录 [Railway](https://railway.app)
2. 选择你现有的项目或创建新项目
3. 连接到 GitHub 仓库（或直接部署）
4. 配置环境变量（在 Variables 标签页）：

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://你的vercel域名.vercel.app

SUPABASE_URL=https://jfgenxnqpuutgdnnngsl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZ2VueG5xcHV1dGdkbm5uZ3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzU3OTQsImV4cCI6MjA3MDUxMTc5NH0.vS213cNKymhSf9yVNb2V5O6ANlzp3RAKqOVQwUvQ1Ws
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZ2VueG5xcHV1dGdkbm5uZ3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzNTc5NCwiZXhwIjoyMDcwNTExNzk0fQ.UCxqUWrAvghm1xbfi_CEosgE3u5G0XcH9pSMv6fA8sE

JWT_SECRET=生成一个强密钥至少32字符
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

RESEND_API_KEY=re_QXsB8Ehe_N2ZK6R1KLzLtFWP5PtixdwQ8
RESEND_FROM_EMAIL=noreply@socialinteraction.club
RESEND_FROM_NAME=Campus Ride
```

5. 部署后获取 Railway 分配的 URL（例如：`https://xxx.railway.app`）

## 🌐 第三步：部署 Vercel（前端）

### 3.1 准备代码

```bash
cd ~/campusride-deploy

# 复制前端代码（不包含后端）
cp -r /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration frontend
cd frontend

# 删除后端目录（前端不需要）
rm -rf campusride-backend

# 创建生产环境变量
echo "VITE_API_BASE_URL=https://你的railway域名.railway.app" > .env.production
echo "VITE_GOOGLE_MAPS_API_KEY=AIzaSyAi0TLayPvI8vfhD33bNtaVyoGHTjZ91F4" >> .env.production

git init
git add .
git commit -m "Initial frontend deployment"
```

### 3.2 在 Vercel Dashboard 配置

1. 登录 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库或上传项目
3. 配置构建设置：
   - **Framework Preset**: Vue.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. 配置环境变量：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_BASE_URL` | `https://你的railway域名.railway.app` |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSyAi0TLayPvI8vfhD33bNtaVyoGHTjZ91F4` |

5. 部署后获取 Vercel URL

### 3.3 更新 CORS 配置

部署完成后，回到 Railway 更新 `FRONTEND_URL` 为 Vercel 的实际域名。

## 🔗 第四步：更新现有 GitHub 仓库

如果你想更新现有仓库而不是创建新的：

```bash
# 克隆你的仓库
git clone https://github.com/你的用户名/你的仓库.git
cd 你的仓库

# 删除旧代码
rm -rf *

# 复制新代码
# 前端
cp -r /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/* .
rm -rf campusride-backend  # 如果后端和前端分开部署

# 或者如果是后端仓库
cp -r /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/* .

# 提交
git add .
git commit -m "Update to latest version"
git push origin main
```

## ✅ 第五步：验证部署

1. **数据库验证**
   - 访问 Supabase Dashboard > Table Editor
   - 确认所有表都已创建

2. **后端验证**
   - 访问 `https://你的railway域名.railway.app/api/v1/health`
   - 应该返回健康状态

3. **前端验证**
   - 访问你的 Vercel 域名
   - 尝试注册新用户
   - 测试登录功能

## 🛟 常见问题

### CORS 错误
确保 Railway 的 `FRONTEND_URL` 环境变量与 Vercel 域名完全匹配。

### 数据库连接失败
检查 `SUPABASE_URL` 和密钥是否正确。

### 构建失败
检查 `package.json` 中的依赖是否完整。

## 📦 本地备份位置

你的原始本地版本已备份到：
```
/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration_backup_local/
```

需要恢复时可以直接复制回来。

---

## 快速部署命令汇总

```bash
# 1. 初始化数据库
# （在 Supabase SQL Editor 中运行 000_complete_schema.sql）

# 2. 部署后端到 Railway
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend
# 通过 Railway CLI 或 Dashboard 部署

# 3. 部署前端到 Vercel
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration
# 设置环境变量后通过 Vercel CLI 或 Dashboard 部署
```
