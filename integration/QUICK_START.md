# CampusRide Integration 快速启动指南

## 🚀 5分钟快速上手

### 步骤1: 准备工作
```bash
# 确保已安装 Node.js 16+
node --version

# 克隆项目
git clone <repository-url>
cd CampusRide/integration
```

### 步骤2: 注册外部服务
1. **Supabase**: [supabase.com](https://supabase.com) → 新建项目 → 获取 URL 和密钥
2. **Resend**: [resend.com](https://resend.com) → 注册 → 创建 API Key
3. **Google Maps**: [console.cloud.google.com](https://console.cloud.google.com) → 启用 Maps JavaScript API → 创建 API Key

### 步骤3: 配置环境变量
**前端 `.env`**:
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_GOOGLE_MAPS_API_KEY=你的Google_Maps_API_Key
```

**后端 `campusride-backend/.env`**:
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# 替换为你的 Supabase 配置
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥

# 生成强密码（建议使用随机字符串）
JWT_SECRET=你的JWT密钥_至少32位
JWT_EXPIRES_IN=7d

# 替换为你的 Resend 配置
RESEND_API_KEY=re_你的Resend密钥
EMAIL_FROM=noreply@你的域名.com

# Google Maps API Key（可选，用于后端地理计算）
GOOGLE_MAPS_API_KEY=你的Google_Maps_API_Key
```

### 步骤4: 安装和启动
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd campusride-backend
npm install
cd ..

# 启动后端 (终端1) - 使用开发模式自动重启
cd campusride-backend
npm run dev

# 启动前端 (终端2)
cd ..
npm run dev
```

**注意**: 首次启动前需要在 Supabase 创建数据库表，参考 `campusride-backend/migrations/` 目录下的 SQL 文件。

### 步骤5: 验证
1. 后端健康检查: http://localhost:3001/api/v1/health
2. 后端API文档: http://localhost:3001/api-docs
3. 前端应用: http://localhost:3000
4. 测试注册功能和邮件发送

## 📋 数据库设置

在 Supabase Dashboard 中执行以下操作：

1. 进入 SQL Editor
2. 运行 `campusride-backend/migrations/` 下的所有 SQL 文件：
   - `001_initial_schema.sql` - 基础表结构
   - `002_groups_and_thoughts.sql` - Groups 功能表
   - `003_visibility.sql` - 用户可见性表
3. 确认所有表已创建成功

主要数据表：
- `users` - 用户表
- `rides` - 拼车信息
- `marketplace_items` - 二手商品
- `groups` - 小组
- `thoughts` - 想法分享
- `user_visibility` - 用户位置可见性
- `point_transactions` - 积分记录

## 🔧 常见问题快速修复

**NPM权限错误**:
```bash
npm install --cache /tmp/npm-cache
```

**端口被占用**:
```bash
# 查找占用进程
lsof -i :3000
lsof -i :3001

# 结束进程
pkill -f "node"
```

**数据库连接失败**:
- 检查 Supabase URL 和密钥是否正确
- 确认 Supabase 项目未暂停
- 验证网络连接

**邮件发送失败**:
- 检查 Resend API Key 是否有效
- 确认发件人邮箱已在 Resend 验证
- 查看后端日志中的详细错误

**Google Maps 不显示**:
- 确认 API Key 已启用 Maps JavaScript API
- 检查 API Key 的域名/IP 限制设置
- 查看浏览器控制台是否有错误信息

**前端页面空白**:
```bash
# 清除 Vite 缓存
rm -rf node_modules/.vite
npm run dev
```

---

详细文档请查看 README.md