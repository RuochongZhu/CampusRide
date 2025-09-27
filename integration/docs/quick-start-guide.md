# CampusRide 后端开发快速启动指南

## 🚀 项目概览

CampusRide 是一个校园拼车平台，采用双模块并行开发架构：

- **Cursor AI**: 负责基础架构、用户系统、拼车、二手市场
- **Claude Code**: 负责活动系统、积分系统、实时通信、通知服务

## 📁 文档结构

```
docs/
├── quick-start-guide.md              # 本文档
├── architecture-decisions.md         # 架构决策记录
├── backend-module-1-claude-code.md   # Claude Code负责的模块详细文档
├── backend-module-2-cursor-ai.md     # Cursor AI负责的模块详细文档
├── api-standards-specification.md    # API接口标准规范
├── development-feedback-system.md    # 开发反馈机制
└── integration-testing-standards.md  # 集成测试规范
```

## 🏃 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/your-org/campusride-backend.git
cd campusride-backend

# 切换到develop分支
git checkout develop

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env
```

### 2. 环境变量配置

编辑 `.env` 文件，配置以下必要的环境变量：

```env
# 服务器配置
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Supabase配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# JWT配置
JWT_SECRET=your_jwt_secret

# 数据库配置（如果使用本地数据库）
DATABASE_URL=postgresql://user:password@localhost:5432/campusride

# Redis配置（可选）
REDIS_URL=redis://localhost:6379

# 其他服务配置...
```

### 3. 数据库初始化

```bash
# 运行数据库迁移
npm run db:migrate

# 运行数据库种子数据（可选）
npm run db:seed
```

### 4. 启动开发服务器

```bash
# 启动开发服务器（带热重载）
npm run dev

# 或者分别启动
npm run dev:cursor-ai    # 只启动Cursor AI负责的模块
npm run dev:claude-code  # 只启动Claude Code负责的模块
```

## 🛠️ 开发工作流

### 1. 创建功能分支

```bash
# Cursor AI的功能分支
git checkout -b feature/rideshare-api

# Claude Code的功能分支
git checkout -b feature/points-system
```

### 2. 开发过程

1. **查看你的任务文档**

   - Cursor AI: 阅读 `backend-module-2-cursor-ai.md`
   - Claude Code: 阅读 `backend-module-1-claude-code.md`

2. **遵循 API 规范**

   - 所有 API 设计参考 `api-standards-specification.md`

3. **编写测试**

   ```bash
   # 运行测试
   npm test

   # 运行特定模块的测试
   npm test -- --testPathPattern=rideshare

   # 查看测试覆盖率
   npm run test:coverage
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "[模块名] 功能描述"
   git push origin feature/your-feature
   ```

### 3. 创建 Pull Request

1. 在 GitHub 上创建 PR 到 develop 分支
2. 使用 PR 模板填写必要信息
3. @另一位开发者进行代码审查
4. 根据反馈进行修改
5. 审查通过后合并

## 📋 每日任务清单

### Cursor AI (第一周)

- [ ] 搭建项目基础架构
- [ ] 配置 Express 服务器和中间件
- [ ] 设置数据库连接
- [ ] 实现用户注册 API
- [ ] 实现用户登录 API
- [ ] 实现 JWT 认证中间件
- [ ] 创建用户资料管理 API
- [ ] 编写相关测试
- [ ] 更新 API 文档

### Claude Code (第一周)

- [ ] 等待基础架构就绪
- [ ] 集成 Socket.io
- [ ] 实现实时消息基础功能
- [ ] 创建 NotificationService
- [ ] 创建 PointsService 接口
- [ ] 设计活动系统数据库表
- [ ] 实现活动创建 API
- [ ] 编写相关测试
- [ ] 更新 API 文档

## 🔗 重要链接

- [API 文档](http://localhost:3000/api-docs)
- [Postman 集合](./postman/CampusRide.postman_collection.json)
- [数据库设计图](./docs/database-schema.png)
- [架构图](./docs/architecture-diagram.png)

## ❓ 常见问题

### Q: 如何调用另一个模块的 API？

A: 使用内部服务调用，参考以下示例：

```javascript
// 在Claude Code的代码中调用Cursor AI的用户服务
const userService = require("../modules/user/user.service");
const user = await userService.getUserById(userId);
```

### Q: 如何处理模块间的事件通信？

A: 使用事件总线，参考以下示例：

```javascript
// 发送事件
eventBus.emit("user.points.updated", { userId, points });

// 监听事件
eventBus.on("ride.completed", async (data) => {
  await pointsService.awardPoints(data.userId, "ride_completed");
});
```

### Q: 遇到集成问题怎么办？

A:

1. 检查 `integration-testing-standards.md` 中的测试用例
2. 在 `development-feedback-system.md` 中记录问题
3. 在每日站会中讨论
4. 必要时创建 Issue 并@对方

## 📞 联系方式

- **Cursor AI**: @cursor-ai
- **Claude Code**: @claude-code
- **技术负责人**: @tech-lead
- **项目经理**: @project-manager

## 🎯 第一周目标

1. **Cursor AI**: 完成基础架构和用户系统，确保 Claude Code 可以开始集成
2. **Claude Code**: 完成实时通信基础和服务接口定义
3. **共同目标**: 建立良好的协作机制，确保接口契约清晰

---

祝开发顺利！如有任何问题，请及时沟通。
