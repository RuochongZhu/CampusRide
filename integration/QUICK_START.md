# CampusRide Integration 快速启动指南

## 🚀 5分钟快速上手

### 步骤1: 准备工作
```bash
# 确保已安装 Node.js 18+
node --version

# 克隆项目
git clone <repository-url>
cd CampusRide/integration
```

### 步骤2: 注册外部服务
1. **Supabase**: [supabase.com](https://supabase.com) → 新建项目 → 获取 URL 和密钥
2. **Resend**: [resend.com](https://resend.com) → 注册 → 创建 API Key

### 步骤3: 配置环境变量
**前端 `.env`**:
```env
VITE_API_BASE_URL=http://localhost:3001
```

**后端 `campusride-backend/.env`**:
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# 替换为你的 Supabase 配置
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_KEY=你的服务密钥

# 生成强密码
JWT_SECRET=你的JWT密钥
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 替换为你的 Resend 配置
RESEND_API_KEY=你的Resend密钥
RESEND_FROM_EMAIL=noreply@你的域名.com
RESEND_FROM_NAME=Campus Ride

API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 步骤4: 安装和启动
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd campusride-backend
npm install

# 运行数据库迁移
node src/database/direct-migration.js

# 启动后端 (终端1)
npm start

# 启动前端 (终端2)
cd ../
npm run dev
```

### 步骤5: 验证
1. 后端: http://localhost:3001/api/v1/health
2. 前端: http://localhost:3000
3. 注册测试账号验证邮件发送

## 🔧 常见问题快速修复

**NPM权限错误**: `npm install --cache /tmp/npm-cache`
**端口被占用**: `pkill -f node`
**数据库连接失败**: 检查 Supabase 配置
**邮件发送失败**: 检查 Resend API Key

---

详细文档请查看 README.md