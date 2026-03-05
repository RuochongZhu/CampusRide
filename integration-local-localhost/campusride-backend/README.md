# CampusRide Backend

CampusRide 校园拼车平台后端服务 - 双AI协作开发项目

## 🚀 项目概述

CampusRide是一个专为大学生设计的校园拼车和活动平台，提供安全可靠的拼车服务、二手市场交易和校园活动管理功能。

### 技术栈

- **框架**: Node.js + Express.js
- **数据库**: PostgreSQL + Supabase
- **认证**: JWT
- **实时通信**: Socket.io
- **文档**: Swagger/OpenAPI 3.0
- **测试**: Jest + Supertest

### 核心功能

- 🔐 **用户认证系统** - JWT认证、权限管理
- 🚗 **拼车系统** - 行程发布、搜索、预订管理
- 🛒 **二手市场** - 商品发布、搜索、收藏功能
- 🎯 **活动管理** - 活动创建、报名、签到系统
- ⭐ **积分系统** - 积分奖励、排行榜
- 🔔 **通知系统** - 实时通知推送
- 💬 **实时通信** - Socket.io实时消息

## 📋 开发团队

### 双AI协作开发模式

- **Cursor AI**: 负责基础架构、用户系统、拼车系统、二手市场
- **Claude Code**: 负责活动系统、积分系统、排行榜、实时通信

## 🛠️ 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL (通过Supabase)

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd campusride-backend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入真实的配置值
   ```

4. **启动开发服务器**
   ```bash
   # 普通启动
   npm run dev
   
   # 包含数据库初始化和示例数据
   npm run dev:init
   ```

### 环境变量配置

```env
# 服务器配置
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Supabase配置
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT配置
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

## 📖 API 文档

启动服务器后访问：
- **Swagger文档**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/api/v1/health

### 主要API端点

```
🔐 认证相关
POST /api/v1/auth/register     # 用户注册
POST /api/v1/auth/login        # 用户登录
POST /api/v1/auth/logout       # 用户登出

👤 用户管理
GET  /api/v1/users/profile     # 获取用户资料
PUT  /api/v1/users/profile     # 更新用户资料

🚗 拼车系统
GET  /api/v1/rideshare/rides   # 搜索拼车
POST /api/v1/rideshare/rides   # 发布拼车
POST /api/v1/rideshare/rides/:id/book  # 预订拼车

🛒 二手市场
GET  /api/v1/marketplace/items # 商品列表
POST /api/v1/marketplace/items # 发布商品
POST /api/v1/marketplace/items/:id/favorite # 收藏商品

🎯 活动管理
GET  /api/v1/activities        # 活动列表
POST /api/v1/activities        # 创建活动
POST /api/v1/activities/:id/register # 报名活动

⭐ 积分系统
GET  /api/v1/points/me         # 我的积分
POST /api/v1/points/award      # 奖励积分

🔔 通知系统
GET  /api/v1/notifications     # 获取通知
PUT  /api/v1/notifications/:id/read # 标记已读
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 查看测试覆盖率
npm run test:coverage
```

### 测试结构

```
tests/
├── unit/           # 单元测试
├── integration/    # 集成测试
└── e2e/           # 端到端测试
```

## 🗄️ 数据库

### 数据库管理命令

```bash
# 验证数据库连接
npm run db:validate

# 初始化数据库表结构
npm run db:init

# 创建示例数据
npm run db:sample
```

### 数据库表结构

- `users` - 用户表
- `rides` - 拼车行程表
- `ride_bookings` - 拼车预订表
- `marketplace_items` - 市场商品表
- `activities` - 活动表
- `activity_participants` - 活动参与表
- `point_transactions` - 积分交易表
- `notifications` - 通知表

## 🏗️ 项目结构

```
src/
├── app.js                 # Express应用配置
├── server.js             # 服务器启动文件
├── config/               # 配置文件
│   ├── database.js       # 数据库配置
│   ├── socket.js         # Socket.io配置
│   └── swagger.js        # API文档配置
├── middleware/           # 中间件
│   ├── auth.middleware.js      # 认证中间件
│   ├── error.middleware.js     # 错误处理中间件
│   └── notFound.middleware.js  # 404处理中间件
├── controllers/          # 控制器
│   ├── auth.controller.js      # 认证控制器
│   ├── user.controller.js      # 用户控制器
│   ├── rideshare.controller.js # 拼车控制器
│   ├── marketplace.controller.js # 市场控制器
│   ├── activity.controller.js  # 活动控制器
│   ├── points.controller.js    # 积分控制器
│   └── notification.controller.js # 通知控制器
├── routes/               # 路由
├── services/            # 业务逻辑服务
│   ├── notification.service.js # 通知服务
│   ├── points.service.js       # 积分服务
│   └── activity.service.js     # 活动服务
├── utils/               # 工具函数
│   └── database-init.js # 数据库初始化工具
└── database/           # 数据库相关
    └── schema.sql      # 数据库表结构
```

## 🔄 开发工作流

### 分支策略

- `main` - 生产分支
- `develop` - 开发分支
- `feature/*` - 功能分支

### 代码规范

- ESLint + Prettier 代码格式化
- Jest 单元测试覆盖率 > 70%
- API 遵循 RESTful 设计原则
- 统一的错误处理和响应格式

### 提交规范

```bash
git commit -m "[模块名] 功能描述"

# 示例
git commit -m "[auth] 添加用户注册功能"
git commit -m "[rideshare] 修复拼车搜索bug"
```

## 🚀 部署

### Docker 部署

```bash
# 构建镜像
docker build -t campusride-backend .

# 运行容器
docker run -p 3000:3000 --env-file .env campusride-backend
```

### 环境变量 (生产环境)

```env
NODE_ENV=production
DATABASE_SSL=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 监控与日志

### 日志级别

- `error` - 错误日志
- `warn` - 警告日志
- `info` - 信息日志
- `debug` - 调试日志

### 性能监控

- API 响应时间监控
- 数据库查询性能
- Socket.io 连接数量
- 内存使用情况

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 许可证

MIT License

## 👥 开发团队

- **Cursor AI** - 基础架构、用户系统、拼车、市场
- **Claude Code** - 活动系统、积分系统、实时通信

## 📞 联系方式

- 邮箱: dev@campusride.com
- 项目地址: [GitHub Repository]

---

**CampusRide** - 让校园出行更便捷，让校园生活更精彩！ 