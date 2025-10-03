# CampusRide 项目交接文档

## 📋 目录
1. [项目概述](#项目概述)
2. [技术栈与架构](#技术栈与架架构)
3. [数据库设计](#数据库设计)
4. [环境配置与API密钥](#环境配置与api密钥)
5. [前后端运行逻辑](#前后端运行逻辑)
6. [已实现功能](#已实现功能)
7. [待开发功能 - Carpooling](#待开发功能---carpooling)
8. [快速开始](#快速开始)

---

## 项目概述

CampusRide 是一个校园拼车与社区平台，整合了以下核心功能：
- ✅ 用户认证系统（登录、注册、邮箱验证）
- ✅ Leaderboard 排行榜与积分系统
- ✅ Marketplace 校园二手市场
- ⏳ Carpooling 拼车功能（待开发）
- ⏳ Activities 校园活动（待完善）

---

## 技术栈与架构

### 前端
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI库**: Ant Design Vue
- **样式**: Tailwind CSS
- **HTTP客户端**: Axios
- **路由**: Vue Router

### 后端
- **运行环境**: Node.js
- **框架**: Express.js
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT
- **实时通信**: Socket.IO
- **邮件服务**: Resend
- **API文档**: Swagger

### 项目结构
```
CampusRide/
├── integration/                    # 主项目目录
│   ├── src/                       # 前端源码
│   │   ├── views/                # 页面组件
│   │   ├── components/           # 公共组件
│   │   ├── router/               # 路由配置
│   │   └── utils/                # 工具类（包括api.js）
│   ├── campusride-backend/       # 后端源码
│   │   ├── src/
│   │   │   ├── controllers/     # 控制器
│   │   │   ├── routes/          # 路由
│   │   │   ├── services/        # 业务逻辑
│   │   │   ├── middleware/      # 中间件
│   │   │   └── config/          # 配置
│   │   └── database/
│   │       └── migrations/      # 数据库迁移文件
│   └── package.json
└── server-manager.sh             # 服务管理脚本
```

---

## 数据库设计

### 当前已创建的表

#### 1. users (用户表)
```sql
- id: UUID (主键)
- email: VARCHAR (唯一)
- password: VARCHAR (加密)
- first_name: VARCHAR
- last_name: VARCHAR
- university: VARCHAR
- points: INTEGER (积分)
- is_verified: BOOLEAN
- verification_token: VARCHAR
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. marketplace_items (市场商品表)
```sql
- id: UUID (主键)
- seller_id: UUID (外键 -> users.id)
- title: VARCHAR(255)
- description: TEXT
- category: VARCHAR(100)
- price: DECIMAL(10,2)
- condition: VARCHAR(50) [new, like_new, good, fair, poor]
- location: VARCHAR(255)
- images: JSONB (图片URL数组)
- tags: JSONB (标签数组)
- status: VARCHAR(50) [active, sold, removed]
- views_count: INTEGER
- favorites_count: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. item_favorites (商品收藏表)
```sql
- id: UUID (主键)
- user_id: UUID (外键 -> users.id)
- item_id: UUID (外键 -> marketplace_items.id)
- created_at: TIMESTAMP
- UNIQUE(user_id, item_id)
```

#### 4. point_rules (积分规则表)
```sql
- id: UUID
- action_type: VARCHAR
- points: INTEGER
- description: TEXT
```

#### 5. point_transactions (积分交易表)
```sql
- id: UUID
- user_id: UUID (外键 -> users.id)
- points: INTEGER
- transaction_type: VARCHAR
- description: TEXT
- created_at: TIMESTAMP
```

### 待创建的表（用于 Carpooling 功能）

#### rides (拼车行程表)
```sql
-- 需要创建
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES users(id),
    departure_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    available_seats INTEGER NOT NULL,
    price_per_seat DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### ride_bookings (拼车预订表)
```sql
-- 需要创建
CREATE TABLE ride_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id),
    passenger_id UUID NOT NULL REFERENCES users(id),
    seats_booked INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, passenger_id)
);
```

---

## 环境配置与API密钥

### 配置文件位置
`integration/campusride-backend/.env`

### 必须替换的配置项

#### 1. Supabase 配置
```env
# 在 https://supabase.com/dashboard 获取
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=你的_anon_public_key
SUPABASE_SERVICE_KEY=你的_service_role_key
```

**如何获取**:
1. 登录 https://supabase.com/dashboard
2. 选择你的项目（或创建新项目）
3. 进入 Settings → API
4. 复制 `Project URL` 和 `anon public` / `service_role` keys

#### 2. Resend 邮件服务配置
```env
# 在 https://resend.com/api-keys 获取
RESEND_API_KEY=re_你的API密钥
RESEND_FROM_EMAIL=noreply@你的域名.com
RESEND_FROM_NAME=你的应用名称
```

**如何获取**:
1. 注册 https://resend.com
2. 验证你的域名（或使用 onboarding@resend.dev 测试）
3. 创建 API Key
4. 设置发件邮箱

#### 3. JWT 配置
```env
# 自定义强密码
JWT_SECRET=你的超长随机密钥_建议64位以上
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### 4. 服务器配置
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 完整的 .env 模板
```env
# 服务器配置
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Supabase配置 - 必须替换
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_KEY=你的_service_key

# JWT配置 - 必须替换
JWT_SECRET=生成一个随机的64位以上密钥
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Resend邮件配置 - 必须替换
RESEND_API_KEY=re_你的key
RESEND_FROM_EMAIL=noreply@你的域名.com
RESEND_FROM_NAME=CampusRide

# 数据库配置（可选，Supabase已包含）
DATABASE_URL=postgresql://user:password@localhost:5432/campusride

# Redis配置（可选）
REDIS_URL=redis://localhost:6379

# API配置
API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 前后端运行逻辑

### 系统架构流程图

```
用户浏览器
    ↓
前端 (Vue 3 on http://localhost:3000)
    ↓ HTTP Request (Axios)
后端 (Express on http://localhost:3001)
    ↓
中间件链
    ├─ CORS 验证
    ├─ Rate Limiting
    ├─ JWT 认证 (authenticateToken)
    └─ 错误处理
    ↓
路由 (Routes)
    ↓
控制器 (Controllers)
    ↓
服务层 (Services - 可选)
    ↓
Supabase (PostgreSQL)
    ├─ Row Level Security (RLS)
    └─ 数据持久化
```

### 详细运行流程

#### 1. 前端请求流程

```javascript
// src/utils/api.js 中定义的API调用
import { marketplaceAPI } from '@/utils/api'

// 1. 用户操作触发
await marketplaceAPI.getItems({ category: 'Electronics' })

// 2. Axios 拦截器自动添加 JWT Token
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('userToken')
//   config.headers.Authorization = `Bearer ${token}`
// })

// 3. 发送到后端
// GET http://localhost:3001/api/v1/marketplace/items?category=Electronics
```

#### 2. 后端处理流程

```javascript
// app.js - 主应用文件
app.use('/api/v1/marketplace', marketplaceRoutes)

// routes/marketplace.routes.js - 路由定义
router.get('/items', authenticateToken, asyncHandler(getItems))

// middleware/auth.middleware.js - JWT验证
// 验证token，解析user信息，附加到 req.user

// controllers/marketplace.controller.js - 控制器
export const getItems = async (req, res, next) => {
  // 1. 从 req.query 获取参数
  // 2. 调用 Supabase 查询数据
  // 3. 返回 JSON 响应
}

// config/database.js - Supabase连接
// supabaseAdmin 实例用于数据库操作
```

#### 3. 数据库访问流程

```javascript
// 使用 Supabase Client
const { data, error } = await supabaseAdmin
  .from('marketplace_items')
  .select(`
    *,
    seller:users!seller_id(id, first_name, last_name)
  `)
  .eq('status', 'active')
  .order('created_at', { ascending: false })

// RLS 策略自动应用
// 只返回用户有权限查看的数据
```

### 认证流程

```
1. 用户注册
   ↓
POST /api/v1/auth/register
   ↓
创建用户 + 生成验证token
   ↓
发送验证邮件 (Resend)
   ↓
用户点击邮件链接
   ↓
POST /api/v1/auth/verify-email
   ↓
账户激活

2. 用户登录
   ↓
POST /api/v1/auth/login
   ↓
验证邮箱密码
   ↓
生成 JWT Token
   ↓
返回给前端
   ↓
前端存储在 localStorage
   ↓
后续请求自动携带 token
```

---

## 已实现功能

### 1. 认证系统 ✅
- **文件位置**:
  - 前端: `src/views/LoginView.vue`, `RegisterView.vue`
  - 后端: `src/controllers/auth.controller.js`
  - 路由: `src/routes/auth.routes.js`

- **API端点**:
  - `POST /api/v1/auth/register` - 注册
  - `POST /api/v1/auth/login` - 登录
  - `POST /api/v1/auth/verify-email` - 邮箱验证
  - `POST /api/v1/auth/forgot-password` - 忘记密码
  - `POST /api/v1/auth/reset-password` - 重置密码

### 2. Leaderboard 排行榜 ✅
- **文件位置**:
  - 前端: `src/views/LeaderboardView.vue`
  - 后端: `src/controllers/leaderboard.controller.js`
  - 服务: `src/services/leaderboard.service.js`

- **API端点**:
  - `GET /api/v1/leaderboard` - 获取排行榜
  - `GET /api/v1/leaderboard/me` - 获取我的排名
  - `GET /api/v1/leaderboard/stats` - 获取统计数据

### 3. Marketplace 市场 ✅
- **文件位置**:
  - 前端: `src/views/MarketplaceView.vue`
  - 后端: `src/controllers/marketplace.controller.js`
  - 路由: `src/routes/marketplace.routes.js`

- **API端点**:
  - `GET /api/v1/marketplace/items` - 获取商品列表
  - `POST /api/v1/marketplace/items` - 发布商品
  - `GET /api/v1/marketplace/items/:id` - 获取商品详情
  - `PUT /api/v1/marketplace/items/:id` - 更新商品
  - `DELETE /api/v1/marketplace/items/:id` - 删除商品
  - `POST /api/v1/marketplace/items/:id/favorite` - 收藏商品
  - `DELETE /api/v1/marketplace/items/:id/favorite` - 取消收藏
  - `GET /api/v1/marketplace/favorites` - 获取我的收藏

### 4. 积分系统 ✅
- **文件位置**:
  - 后端: `src/controllers/points.controller.js`
  - 服务: `src/services/points.service.js`

---

## 待开发功能 - Carpooling

### 开发步骤

#### Step 1: 创建数据库表

在 Supabase Dashboard → SQL Editor 运行：

```sql
-- 拼车行程表
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    departure_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE,
    available_seats INTEGER NOT NULL CHECK (available_seats > 0),
    price_per_seat DECIMAL(10,2),
    vehicle_info TEXT,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 拼车预订表
CREATE TABLE IF NOT EXISTS ride_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seats_booked INTEGER NOT NULL CHECK (seats_booked > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, passenger_id)
);

-- 创建索引
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_departure_time ON rides(departure_time);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_ride_bookings_ride_id ON ride_bookings(ride_id);
CREATE INDEX idx_ride_bookings_passenger_id ON ride_bookings(passenger_id);

-- 启用 RLS
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_bookings ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Anyone can view active rides"
    ON rides FOR SELECT
    USING (status = 'active');

CREATE POLICY "Drivers can create rides"
    ON rides FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND driver_id = auth.uid());

CREATE POLICY "Drivers can update their rides"
    ON rides FOR UPDATE
    USING (driver_id = auth.uid());

CREATE POLICY "Users can book rides"
    ON ride_bookings FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND passenger_id = auth.uid());

CREATE POLICY "Users can view their bookings"
    ON ride_bookings FOR SELECT
    USING (passenger_id = auth.uid() OR ride_id IN (
        SELECT id FROM rides WHERE driver_id = auth.uid()
    ));
```

#### Step 2: 创建后端 API

**参考 marketplace 实现**，创建以下文件：

1. **控制器**: `src/controllers/rideshare.controller.js`
```javascript
// 参考 marketplace.controller.js 结构
export const createRide = async (req, res, next) => {
  // 创建拼车行程
}

export const getRides = async (req, res, next) => {
  // 获取行程列表（支持筛选）
}

export const bookRide = async (req, res, next) => {
  // 预订行程
}
```

2. **路由**: `src/routes/rideshare.routes.js`
```javascript
router.post('/rides', requireRegisteredUser, asyncHandler(createRide));
router.get('/rides', asyncHandler(getRides));
router.post('/rides/:id/book', requireRegisteredUser, asyncHandler(bookRide));
```

3. **在 app.js 注册路由**
```javascript
app.use('/api/v1/rideshare', rideshareRoutes);
```

#### Step 3: 创建前端页面

**参考 MarketplaceView.vue**，创建 `src/views/RideshareView.vue`

关键功能：
- 行程列表展示
- 筛选器（出发地、目的地、时间）
- 发布行程表单
- 预订功能

#### Step 4: 添加 API 方法

在 `src/utils/api.js` 添加：

```javascript
export const rideshareAPI = {
  getRides: (params = {}) => api.get('/rideshare/rides', { params }),
  createRide: (data) => api.post('/rideshare/rides', data),
  getRide: (id) => api.get(`/rideshare/rides/${id}`),
  bookRide: (rideId, data) => api.post(`/rideshare/rides/${rideId}/book`, data),
  getMyRides: () => api.get('/rideshare/my-rides'),
  getMyBookings: () => api.get('/rideshare/bookings/me'),
}
```

---

## 快速开始

### 初始设置

1. **克隆项目**
```bash
git clone <repository-url>
cd CampusRide
```

2. **配置环境变量**
```bash
cd integration/campusride-backend
cp .env.example .env
# 编辑 .env 文件，替换 Supabase 和 Resend 配置
```

3. **安装依赖**
```bash
# 后端
cd integration/campusride-backend
npm install

# 前端
cd ../
npm install
```

4. **设置数据库**
- 登录 Supabase Dashboard
- 在 SQL Editor 中运行已有的迁移文件
- 确认表已创建

### 启动服务

使用服务管理脚本（推荐）：

```bash
cd /path/to/CampusRide

# 启动所有服务
./server-manager.sh start

# 查看状态
./server-manager.sh status

# 查看日志
./server-manager.sh logs

# 重启服务
./server-manager.sh restart
```

手动启动：

```bash
# 终端1 - 启动后端
cd integration/campusride-backend
PORT=3001 npm start

# 终端2 - 启动前端
cd integration
npm run dev
```

### 访问地址

- **前端**: http://localhost:3000
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001/api-docs

### 测试账户

如果需要测试，先注册一个账户，然后验证邮箱。

---

## 开发建议

### 1. 代码风格
- 参考现有的 marketplace 实现
- 使用 async/await 处理异步操作
- 统一的错误处理（使用 AppError）
- RESTful API 设计

### 2. 数据库操作
- 使用 Supabase Client (supabaseAdmin)
- 利用 RLS 策略保证安全
- 使用事务处理复杂操作

### 3. 前端开发
- Vue 3 Composition API
- 使用 Ant Design Vue 组件
- 统一的 API 调用（通过 utils/api.js）

### 4. 测试
- 在 Supabase Dashboard 测试 SQL 查询
- 使用 API 文档测试端点
- 前端控制台检查网络请求

---

## 常见问题

### Q1: 数据库连接失败
**A**: 检查 .env 中的 SUPABASE_URL 和 SUPABASE_SERVICE_KEY 是否正确

### Q2: 邮件发送失败
**A**:
1. 检查 RESEND_API_KEY 是否有效
2. 确认发件邮箱域名已验证
3. 查看后端日志获取详细错误

### Q3: JWT Token 过期
**A**: Token 默认15分钟过期，需要重新登录或实现 refresh token 机制

### Q4: CORS 错误
**A**: 检查 app.js 中的 CORS 配置是否包含前端 URL

---

## 资源链接

- **Supabase 文档**: https://supabase.com/docs
- **Resend 文档**: https://resend.com/docs
- **Vue 3 文档**: https://vuejs.org
- **Ant Design Vue**: https://antdv.com
- **Express.js**: https://expressjs.com

---

**最后更新**: 2025年10月3日
**当前版本**: v1.0.0
**维护者**: [添加你的联系方式]
