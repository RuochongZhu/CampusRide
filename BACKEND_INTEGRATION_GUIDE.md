# CampusRide 后端集成指南

## 项目概述
- **项目名称**: CampusRide - 校园拼车与社交平台
- **技术栈**: Node.js + Express + Supabase (PostgreSQL)
- **认证方式**: JWT (JSON Web Tokens)
- **邮件服务**: Resend
- **实时通信**: Socket.io (已配置但暂时禁用)

## 当前实现的核心功能

### 1. 用户认证系统 (Authentication)
**文件位置**: `src/controllers/auth.controller.js`, `src/routes/auth.routes.js`

**API端点**:
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新Token
- `POST /api/v1/auth/forgot-password` - 忘记密码
- `POST /api/v1/auth/reset-password` - 重置密码
- `POST /api/v1/auth/verify-email` - 邮箱验证
- `POST /api/v1/auth/resend-verification` - 重新发送验证邮件

**功能特点**:
- 邮箱验证机制
- 密码加密存储 (bcrypt)
- JWT Token认证 (15分钟有效期)
- 刷新Token机制 (7天有效期)
- 邮箱验证状态检查

### 2. 用户管理系统 (User Management)
**文件位置**: `src/controllers/user.controller.js`, `src/routes/user.routes.js`

**API端点**:
- `GET /api/v1/users/me` - 获取当前用户信息
- `GET /api/v1/users/:userId` - 获取指定用户信息
- `PUT /api/v1/users/me` - 更新当前用户信息
- `DELETE /api/v1/users/me` - 删除当前用户账户

### 3. 积分系统 (Points System)
**文件位置**: `src/services/points.service.js`, `src/controllers/points.controller.js`, `src/routes/points.routes.js`

**API端点**:
- `POST /api/v1/points/award` - 奖励积分
- `POST /api/v1/points/deduct` - 扣除积分
- `GET /api/v1/points/me` - 获取当前用户积分
- `GET /api/v1/points/:userId` - 获取指定用户积分
- `GET /api/v1/points/transactions/me` - 获取积分交易历史
- `GET /api/v1/points/statistics/me` - 获取积分统计
- `GET /api/v1/points/rules` - 获取积分规则

**积分规则**:
- 发布帖子: +5分
- 回复帖子: +3分
- 点赞帖子: +2分
- 帖子被点赞: +2分
- 转发帖子: +2分
- 帖子被转发: +2分

### 4. 排行榜系统 (Leaderboard)
**文件位置**: `src/services/leaderboard.service.js`, `src/controllers/leaderboard.controller.js`, `src/routes/leaderboard.routes.js`

**API端点**:
- `GET /api/v1/leaderboard` - 获取排行榜 (公开访问)
- `GET /api/v1/leaderboard/me` - 获取当前用户排名 (需要认证)
- `GET /api/v1/leaderboard/:userId` - 获取指定用户排名 (需要认证)
- `GET /api/v1/leaderboard/stats` - 获取排行榜统计 (需要认证)
- `POST /api/v1/leaderboard/update` - 更新排行榜 (管理员功能)

**功能特点**:
- 支持多种时间周期 (周/月/全部)
- 支持多种分类 (整体/学术/体育/社交等)
- 实时排名计算
- 排名变化追踪

### 5. 市场交易系统 (Marketplace)
**文件位置**: `src/controllers/marketplace.controller.js`, `src/routes/marketplace.routes.js`

**API端点**:
- `GET /api/v1/marketplace/items` - 获取商品列表
- `POST /api/v1/marketplace/items` - 发布商品
- `GET /api/v1/marketplace/items/:id` - 获取商品详情
- `PUT /api/v1/marketplace/items/:id` - 更新商品
- `DELETE /api/v1/marketplace/items/:id` - 删除商品

### 6. 拼车系统 (Rideshare)
**文件位置**: `src/controllers/rideshare.controller.js`, `src/routes/rideshare.routes.js`

**API端点**:
- `GET /api/v1/rideshare/rides` - 获取拼车列表
- `POST /api/v1/rideshare/rides` - 创建拼车
- `GET /api/v1/rideshare/rides/:id` - 获取拼车详情
- `PUT /api/v1/rideshare/rides/:id` - 更新拼车
- `DELETE /api/v1/rideshare/rides/:id` - 删除拼车

### 7. 活动系统 (Activities)
**文件位置**: `src/controllers/activity.controller.js`, `src/routes/activity.routes.js`

**API端点**:
- `GET /api/v1/activities` - 获取活动列表
- `POST /api/v1/activities` - 创建活动
- `GET /api/v1/activities/:id` - 获取活动详情
- `PUT /api/v1/activities/:id` - 更新活动
- `DELETE /api/v1/activities/:id` - 删除活动

### 8. 通知系统 (Notifications)
**文件位置**: `src/services/notification.service.js`, `src/controllers/notification.controller.js`, `src/routes/notification.routes.js`

**API端点**:
- `GET /api/v1/notifications` - 获取通知列表
- `PUT /api/v1/notifications/:id/read` - 标记通知为已读
- `DELETE /api/v1/notifications/:id` - 删除通知

## 数据库结构

### 核心表结构

#### 1. users 表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  university VARCHAR(255),
  major VARCHAR(255),
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_token VARCHAR(255),
  verification_expires TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. point_rules 表
```sql
CREATE TABLE point_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  base_points INTEGER NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. point_transactions 表
```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  source VARCHAR(50),
  reason TEXT,
  metadata JSONB,
  multiplier INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. leaderboard_entries 表
```sql
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  points INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 环境配置

### 必需的环境变量
```env
# 服务器配置
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Supabase配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Resend邮件配置
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Campus Ride

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/campusride

# API配置
API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 中间件系统

### 1. 认证中间件 (`auth.middleware.js`)
- JWT Token验证
- 用户权限检查
- Token过期处理

### 2. 错误处理中间件 (`error.middleware.js`)
- 统一错误响应格式
- 错误日志记录
- 生产环境错误隐藏

### 3. 404处理中间件 (`notFound.middleware.js`)
- 处理未找到的路由

## 服务层架构

### 1. 数据库服务 (`config/database.js`)
- Supabase客户端配置
- 数据库连接管理

### 2. 邮件服务 (`services/email.service.js`)
- 验证邮件发送
- 密码重置邮件
- 通知邮件

### 3. 积分服务 (`services/points.service.js`)
- 积分计算逻辑
- 积分规则管理
- 积分交易记录

### 4. 排行榜服务 (`services/leaderboard.service.js`)
- 排名计算
- 时间周期处理
- 分类筛选

### 5. 通知服务 (`services/notification.service.js`)
- 实时通知推送
- 通知存储管理

## 当前缺失的功能

### 1. 数据库表缺失
- ❌ `notifications` 表 (通知系统需要)
- ❌ `marketplace_items` 表 (市场交易需要)
- ❌ `rideshare_rides` 表 (拼车系统需要)
- ❌ `activities` 表 (活动系统需要)

### 2. 功能实现缺失
- ❌ 市场交易系统的完整实现
- ❌ 拼车系统的完整实现
- ❌ 活动系统的完整实现
- ❌ 通知系统的数据库存储
- ❌ 文件上传功能 (头像上传等)
- ❌ 搜索功能
- ❌ 分页功能
- ❌ 数据验证中间件

### 3. 安全功能缺失
- ❌ 请求频率限制
- ❌ 输入数据验证
- ❌ SQL注入防护
- ❌ XSS防护
- ❌ CORS配置

## 与其他后端集成时的注意事项

### 1. 数据库集成
- **用户表冲突**: 确保 `users` 表结构兼容
- **ID类型**: 使用UUID作为主键，避免ID冲突
- **字段映射**: 确保用户信息字段名称一致
- **外键约束**: 检查表之间的关联关系

### 2. 认证系统集成
- **JWT Secret**: 使用相同的JWT密钥
- **Token格式**: 确保JWT payload结构一致
- **用户ID字段**: 统一使用 `userId` 字段名
- **权限系统**: 协调角色和权限定义

### 3. API设计集成
- **URL前缀**: 统一使用 `/api/v1/` 前缀
- **响应格式**: 统一响应结构 `{success: boolean, data: any, error: any}`
- **错误码**: 统一错误码定义
- **HTTP状态码**: 遵循RESTful规范

### 4. 环境配置集成
- **端口分配**: 避免端口冲突
- **数据库连接**: 共享数据库实例或配置连接
- **CORS设置**: 配置允许的前端域名
- **日志系统**: 统一日志格式和存储

### 5. 数据迁移策略
- **用户数据**: 需要用户ID映射表
- **积分数据**: 保持积分历史记录
- **权限数据**: 重新分配用户角色
- **测试数据**: 清理测试数据

### 6. 部署集成
- **Docker配置**: 统一容器化部署
- **环境变量**: 合并环境配置
- **健康检查**: 统一健康检查端点
- **监控系统**: 集成监控和日志

## 建议的集成步骤

### 阶段1: 数据库集成
1. 合并数据库表结构
2. 创建数据迁移脚本
3. 测试数据完整性

### 阶段2: 认证系统集成
1. 统一JWT配置
2. 合并用户权限系统
3. 测试认证流程

### 阶段3: API集成
1. 统一API响应格式
2. 合并路由配置
3. 测试API兼容性

### 阶段4: 功能集成
1. 集成业务逻辑
2. 测试完整流程
3. 性能优化

### 阶段5: 部署集成
1. 统一部署配置
2. 集成监控系统
3. 生产环境测试

## 联系信息
- **开发者**: Claude AI Assistant
- **项目**: CampusRide Backend
- **最后更新**: 2025-09-19
- **版本**: 1.0.0
