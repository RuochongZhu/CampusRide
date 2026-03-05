# CampusRide - 校园社交与出行平台

CampusRide 是一个集成了拼车、二手市场、活动社交和积分系统的校园平台，帮助学生更便捷地连接和互助。

## 🚀 技术栈

### 前端
- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **Ant Design Vue** - UI组件库
- **TailwindCSS** - 实用优先的CSS框架
- **Google Maps API** - 地图服务

### 后端
- **Node.js + Express** - 后端服务器
- **Supabase** - PostgreSQL数据库 + 实时功能
- **JWT** - 身份认证
- **Nodemailer** - 邮件服务
- **Socket.io** - 实时通信

## 📋 功能模块

1. **用户认证** - 邮箱验证、登录注册、密码管理
2. **拼车系统** - 发布/搜索拼车、实时位置、预订管理
3. **二手市场** - 商品发布、搜索、收藏
4. **活动社交（Groups）** - 小组创建、想法分享、地图展示
5. **积分系统** - 行为激励、排行榜
6. **排行榜** - 用户活跃度展示

## 🛠️ 快速开始

### 前置要求

- Node.js >= 16
- npm 或 yarn
- Supabase 账号
- Google Maps API Key

### 1. 克隆项目

```bash
git clone <repository-url>
cd CampusRide/integration
```

### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd campusride-backend
npm install
cd ..
```

### 3. 配置环境变量

#### 前端 `.env`
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### 后端 `campusride-backend/.env`
```env
# 服务器配置
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT 密钥
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 邮件服务（Resend）
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. 数据库设置

1. 在 Supabase 创建新项目
2. 运行数据库迁移脚本（位于 `campusride-backend/migrations/`）
3. 确保所有表已创建：
   - users, rides, ride_bookings
   - marketplace_items, item_favorites
   - groups, group_members, thoughts
   - user_visibility
   - point_rules, point_transactions

### 5. 启动项目

#### 开发模式

```bash
# 终端 1: 启动前端（端口 3000）
npm run dev

# 终端 2: 启动后端（端口 3001）
cd campusride-backend
npm run dev
```

访问 http://localhost:3000

#### 生产模式

```bash
# 构建前端
npm run build

# 启动后端
cd campusride-backend
npm start
```

## 📁 项目结构

```
integration/
├── src/                          # 前端源代码
│   ├── views/                    # 页面组件
│   │   ├── LoginView.vue         # 登录页
│   │   ├── RegisterView.vue      # 注册页
│   │   ├── HomeView.vue          # 首页
│   │   ├── CarpoolView.vue       # 拼车页
│   │   ├── MarketplaceView.vue   # 二手市场
│   │   ├── ActivitiesView.vue    # 活动社交
│   │   └── LeaderboardView.vue   # 排行榜
│   ├── components/               # 可复用组件
│   ├── utils/                    # 工具函数
│   │   ├── api.js               # API接口封装
│   │   └── auth.js              # 认证工具
│   ├── router/                   # 路由配置
│   └── App.vue                   # 根组件
│
├── campusride-backend/           # 后端源代码
│   ├── src/
│   │   ├── controllers/          # 控制器层
│   │   ├── services/             # 业务逻辑层
│   │   ├── routes/               # 路由定义
│   │   ├── middleware/           # 中间件
│   │   ├── config/               # 配置文件
│   │   └── server.js            # 服务器入口
│   └── migrations/               # 数据库迁移文件
│
├── public/                       # 静态资源
├── index.html                    # HTML入口
├── package.json                  # 前端依赖
└── vite.config.js               # Vite配置
```

## 🔌 API端点

后端API文档地址：`http://localhost:3001/api-docs`

主要端点：
- `/api/v1/auth/*` - 认证相关
- `/api/v1/users/*` - 用户管理
- `/api/v1/carpooling/*` - 拼车功能
- `/api/v1/marketplace/*` - 二手市场
- `/api/v1/groups/*` - 小组管理
- `/api/v1/thoughts/*` - 想法分享
- `/api/v1/visibility/*` - 用户可见性
- `/api/v1/points/*` - 积分系统
- `/api/v1/leaderboard/*` - 排行榜

## 🐛 常见问题

### 端口冲突
如果端口 3000 或 3001 被占用：

```bash
# 前端使用其他端口
PORT=3002 npm run dev

# 后端使用其他端口
cd campusride-backend
PORT=3003 npm run dev
```

### 数据库连接失败
检查 Supabase 配置：
1. 确认 `SUPABASE_URL` 和密钥正确
2. 检查 Supabase 项目是否暂停
3. 验证网络连接

### Google Maps 不显示
1. 确认 API Key 已启用 Maps JavaScript API
2. 检查 API Key 的域名限制
3. 查看浏览器控制台错误信息

### 邮件发送失败
1. 验证 Resend API Key
2. 确认发件人邮箱已验证
3. 检查邮箱域名配置

## 📝 开发指南

### 添加新功能
1. 后端：在 `campusride-backend/src/` 下创建对应的 controller、service、route
2. 前端：在 `src/views/` 或 `src/components/` 创建新组件
3. API：在 `src/utils/api.js` 添加新的API调用

### 数据库修改
1. 在 Supabase Dashboard 修改表结构
2. 记录迁移SQL到 `campusride-backend/migrations/`
3. 更新相关的 service 文件

### 样式定制
- 全局样式：修改 `tailwind.config.js`
- 主题色：在 `src/App.vue` 或组件中调整
- 组件样式：使用 TailwindCSS 工具类

## 🚢 部署

### Vercel 部署（前端）
```bash
# 已配置 vercel.json
vercel deploy
```

### 后端部署
推荐平台：
- Railway
- Render
- Heroku

环境变量记得在部署平台配置。

## 📄 许可证

[添加您的许可证信息]

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

**需要帮助？** 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 或提交 Issue。
