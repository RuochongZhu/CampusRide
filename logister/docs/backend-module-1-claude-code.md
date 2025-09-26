# 校园拼车后端开发文档 - 模块 1 (Claude Code 负责)

## 🎯 模块概述

**负责人**: Claude Code  
**模块范围**: 用户认证系统、活动管理系统、排行榜系统  
**开发周期**: 2-3 周  
**优先级**: 高

### Sprint 计划

- **第一阶段 (Sprint 1 - 第 1 周)**:

  - 搭建 Socket.io 基础设施
  - 完成实时消息模块的核心功能
  - 定义 `notificationService` 和 `pointsService` 的接口并提供 Mock 实现
  - 为 Cursor AI 提供可用的通知服务接口

- **第二阶段 (Sprint 2 - 第 2 周)**:

  - 完成活动管理系统的全部 API 开发
  - 实现地理位置搜索功能
  - 集成积分奖励机制
  - 完成相关单元测试和集成测试

- **第三阶段 (Sprint 3 - 第 3 周)**:
  - 完成积分和排行榜系统的全部功能
  - 与拼车、活动、市场等模块集成积分系统
  - 性能优化和压力测试
  - 完善文档和部署准备

### 依赖关系

**依赖于 Cursor AI 的模块**:

- **用户系统**: 所有模块都将建立在 Cursor AI 完成的用户认证和管理系统之上
- **基础架构**: 在 Cursor AI 搭建的项目骨架中进行开发
- **认证中间件**: 使用 Cursor AI 提供的 `authMiddleware` 保护路由

**被依赖的服务**:

- **NotificationService**: 将被 Cursor AI 的拼车和市场模块调用
- **PointsService**: 将被所有涉及积分奖励的模块调用
- **实时通信**: Socket.io 基础设施供全系统使用

### 协作须知

- **接口优先**: 在开始编码前，先定义清晰的服务接口并提供 Mock 实现
- **及时同步**: 每日通过 `development_log.md` 同步进度和问题
- **代码审查**: 提交 PR 时 @Cursor AI 进行审查
- **测试覆盖**: 单元测试覆盖率不低于 80%，集成测试覆盖所有关键路径
- **文档同步**: API 变更时及时更新文档

## 📋 目录

1. [技术栈与架构](#技术栈与架构)
2. [数据库设计](#数据库设计)
3. [用户认证系统](#用户认证系统)
4. [活动管理系统](#活动管理系统)
5. [排行榜系统](#排行榜系统)
6. [API 接口详细设计](#api接口详细设计)
7. [安全与权限控制](#安全与权限控制)
8. [性能优化](#性能优化)
9. [测试策略](#测试策略)
10. [部署与运维](#部署与运维)
11. [错误处理与日志](#错误处理与日志)
12. [代码规范](#代码规范)

---

## 🏗️ 技术栈与架构

### 核心技术栈

```yaml
后端框架: Node.js + Express.js / Fastify
数据库:
  - 主数据库: PostgreSQL 15+
  - 缓存: Redis 7+
  - 搜索引擎: Elasticsearch 8+ (可选)
认证: JWT + Passport.js
ORM: Prisma / TypeORM
验证: Joi / Zod
文档: Swagger/OpenAPI 3.0
测试: Jest + Supertest
监控: Winston + Morgan
```

### 项目结构

```
src/
├── config/          # 配置文件
│   ├── database.js
│   ├── redis.js
│   ├── jwt.js
│   └── swagger.js
├── controllers/     # 控制器
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── activity.controller.js
│   └── leaderboard.controller.js
├── middleware/      # 中间件
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   ├── rate-limit.middleware.js
│   └── error.middleware.js
├── models/          # 数据模型
│   ├── User.js
│   ├── Activity.js
│   ├── Participation.js
│   └── LeaderboardEntry.js
├── routes/          # 路由
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── activity.routes.js
│   └── leaderboard.routes.js
├── services/        # 业务逻辑
│   ├── auth.service.js
│   ├── user.service.js
│   ├── activity.service.js
│   ├── leaderboard.service.js
│   └── email.service.js
├── utils/          # 工具函数
│   ├── password.util.js
│   ├── token.util.js
│   ├── validation.util.js
│   └── logger.util.js
├── validators/     # 输入验证
│   ├── auth.validator.js
│   ├── user.validator.js
│   └── activity.validator.js
└── tests/          # 测试文件
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🗄️ 数据库设计

### 用户表 (users)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),
  university VARCHAR(100) NOT NULL,
  major VARCHAR(100),
  graduation_year INTEGER,
  bio TEXT,
  points INTEGER DEFAULT 0,
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  last_active TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_student_id (student_id),
  INDEX idx_email (email),
  INDEX idx_university (university),
  INDEX idx_points (points DESC),
  INDEX idx_created_at (created_at)
);
```

### 活动表 (activities)

```sql
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('academic', 'sports', 'social', 'volunteer', 'career') NOT NULL,
  type ENUM('individual', 'team', 'competition') NOT NULL,
  organizer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  location VARCHAR(255),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  registration_deadline TIMESTAMP,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  status ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled') DEFAULT 'draft',
  requirements TEXT,
  tags JSON,
  image_url TEXT,
  contact_info JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time),
  INDEX idx_organizer_id (organizer_id),
  INDEX idx_location (location),
  FULLTEXT idx_title_description (title, description)
);
```

### 活动参与表 (activity_participations)

```sql
CREATE TABLE activity_participations (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attendance_status ENUM('registered', 'attended', 'absent', 'cancelled') DEFAULT 'registered',
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  points_earned INTEGER DEFAULT 0,
  certificate_url TEXT,

  UNIQUE KEY unique_participation (activity_id, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_activity_id (activity_id),
  INDEX idx_attendance_status (attendance_status)
);
```

### 排行榜表 (leaderboard_entries)

```sql
CREATE TABLE leaderboard_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category ENUM('overall', 'academic', 'sports', 'social', 'volunteer', 'career') NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER,
  activities_count INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP,
  period_type ENUM('weekly', 'monthly', 'semester', 'annual') NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_category_period (user_id, category, period_type, period_start),
  INDEX idx_category_period (category, period_type),
  INDEX idx_rank_position (rank_position),
  INDEX idx_points (points DESC)
);
```

### 点数历史表 (point_transactions)

```sql
CREATE TABLE point_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  transaction_type ENUM('earned', 'deducted', 'bonus', 'penalty') NOT NULL,
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
);
```

---

## 🔐 用户认证系统

### 认证流程设计

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Service
    participant D as Database
    participant E as Email Service
    participant R as Redis

    C->>A: 用户注册
    A->>D: 保存用户信息
    A->>E: 发送验证邮件
    A->>R: 存储验证token
    A->>C: 返回成功信息

    C->>A: 邮箱验证
    A->>R: 验证token
    A->>D: 更新验证状态
    A->>C: 验证成功

    C->>A: 用户登录
    A->>D: 验证凭据
    A->>A: 生成JWT token
    A->>R: 存储refresh token
    A->>C: 返回tokens
```

### 详细 API 设计

#### 1. 用户注册

```javascript
// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const {
      studentId,
      email,
      password,
      firstName,
      lastName,
      university,
      major,
      graduationYear,
      phone,
    } = req.body;

    // 1. 输入验证
    const validationResult = validateRegistration(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: validationResult.errors,
      });
    }

    // 2. 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { studentId }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email or student ID",
      });
    }

    // 3. 验证学生邮箱域名
    const emailDomain = email.split("@")[1];
    const validDomains = ["university.edu", "student.university.edu"];
    if (!validDomains.includes(emailDomain)) {
      return res.status(400).json({
        success: false,
        message: "Please use your university email address",
      });
    }

    // 4. 密码哈希
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. 生成验证token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 6. 创建用户
    const user = await User.create({
      studentId,
      email,
      passwordHash,
      firstName,
      lastName,
      university,
      major,
      graduationYear,
      phone,
      verificationToken,
      verificationStatus: "pending",
    });

    // 7. 发送验证邮件
    await emailService.sendVerificationEmail(
      email,
      verificationToken,
      firstName
    );

    // 8. 记录注册日志
    logger.info("User registered successfully", {
      userId: user.id,
      email: user.email,
      studentId: user.studentId,
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email for verification.",
      data: {
        userId: user.id,
        email: user.email,
        verificationRequired: true,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};
```

#### 2. 邮箱验证

```javascript
// GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // 1. 查找用户
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // 2. 检查是否已验证
    if (user.verificationStatus === "verified") {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
      });
    }

    // 3. 更新验证状态
    await User.updateOne(
      { id: user.id },
      {
        verificationStatus: "verified",
        verificationToken: null,
        isActive: true,
      }
    );

    // 4. 发送欢迎邮件
    await emailService.sendWelcomeEmail(user.email, user.firstName);

    // 5. 记录验证日志
    logger.info("Email verified successfully", {
      userId: user.id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
      data: {
        userId: user.id,
        verified: true,
      },
    });
  } catch (error) {
    logger.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during email verification",
    });
  }
};
```

#### 3. 用户登录

```javascript
// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // 1. 输入验证
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. 查找用户
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    if (user.verificationStatus !== "verified") {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // 4. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // 记录失败登录尝试
      await recordFailedLogin(user.id, req.ip);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 5. 检查账户锁定状态
    const isLocked = await checkAccountLock(user.id);
    if (isLocked) {
      return res.status(423).json({
        success: false,
        message:
          "Account temporarily locked due to multiple failed login attempts",
      });
    }

    // 6. 生成JWT tokens
    const accessTokenPayload = {
      userId: user.id,
      email: user.email,
      studentId: user.studentId,
      role: user.role || "student",
    };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: rememberMe ? "30d" : "7d" }
    );

    // 7. 存储refresh token到Redis
    const refreshTokenKey = `refresh_token:${user.id}`;
    await redis.setex(
      refreshTokenKey,
      rememberMe ? 2592000 : 604800,
      refreshToken
    );

    // 8. 更新最后活跃时间
    await User.updateOne({ id: user.id }, { lastActive: new Date() });

    // 9. 清除失败登录记录
    await clearFailedLogins(user.id);

    // 10. 记录成功登录
    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // 11. 设置安全的cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          studentId: user.studentId,
          firstName: user.firstName,
          lastName: user.lastName,
          university: user.university,
          major: user.major,
          avatarUrl: user.avatarUrl,
          points: user.points,
        },
        tokens: {
          accessToken,
          expiresIn: 900, // 15 minutes
        },
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};
```

### 安全机制

#### 1. 账户锁定机制

```javascript
const recordFailedLogin = async (userId, ip) => {
  const key = `failed_logins:${userId}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 3600); // 1小时过期
  }

  if (attempts >= 5) {
    const lockKey = `account_locked:${userId}`;
    await redis.setex(lockKey, 1800, "locked"); // 锁定30分钟

    // 发送安全警告邮件
    const user = await User.findById(userId);
    await emailService.sendSecurityAlert(user.email, {
      type: "account_locked",
      ip,
      timestamp: new Date(),
    });
  }
};
```

#### 2. JWT Token 刷新

```javascript
// POST /api/auth/refresh-token
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    // 验证refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 检查Redis中的token
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // 获取用户信息
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // 生成新的access token
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        studentId: user.studentId,
        role: user.role || "student",
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    logger.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
```

---

## 🎯 活动管理系统

### 活动生命周期管理

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Published: 发布活动
    Published --> Ongoing: 活动开始
    Ongoing --> Completed: 活动结束
    Published --> Cancelled: 取消活动
    Draft --> Cancelled: 取消草稿
    Completed --> [*]
    Cancelled --> [*]
```

### 详细 API 设计

#### 1. 创建活动

```javascript
// POST /api/activities
const createActivity = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      location,
      startTime,
      endTime,
      registrationDeadline,
      maxParticipants,
      entryFee,
      rewardPoints,
      requirements,
      tags,
      contactInfo,
    } = req.body;

    const organizerId = req.user.userId;

    // 1. 输入验证
    const validationResult = validateActivityCreation(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: validationResult.errors,
      });
    }

    // 2. 时间验证
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    const regDeadline = registrationDeadline
      ? new Date(registrationDeadline)
      : null;

    if (start <= now) {
      return res.status(400).json({
        success: false,
        message: "Activity start time must be in the future",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "Activity end time must be after start time",
      });
    }

    if (regDeadline && regDeadline >= start) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline must be before activity start time",
      });
    }

    // 3. 权限验证 - 检查用户是否有创建活动的权限
    const organizer = await User.findById(organizerId);
    if (!organizer.isActive || organizer.verificationStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Only verified users can create activities",
      });
    }

    // 4. 检查并发活动限制
    const concurrentActivities = await Activity.countDocuments({
      organizerId,
      status: { $in: ["published", "ongoing"] },
      endTime: { $gte: now },
    });

    if (concurrentActivities >= 3) {
      return res.status(400).json({
        success: false,
        message: "You can only have 3 active activities at a time",
      });
    }

    // 5. 创建活动
    const activity = await Activity.create({
      title,
      description,
      category,
      type,
      organizerId,
      location,
      startTime: start,
      endTime: end,
      registrationDeadline: regDeadline,
      maxParticipants,
      entryFee: entryFee || 0,
      rewardPoints: rewardPoints || 0,
      requirements,
      tags: tags || [],
      contactInfo,
      status: "draft",
    });

    // 6. 记录活动创建日志
    logger.info("Activity created successfully", {
      activityId: activity.id,
      organizerId,
      title: activity.title,
      category: activity.category,
    });

    // 7. 返回创建的活动信息
    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: {
        activity: {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          category: activity.category,
          type: activity.type,
          location: activity.location,
          startTime: activity.startTime,
          endTime: activity.endTime,
          registrationDeadline: activity.registrationDeadline,
          maxParticipants: activity.maxParticipants,
          currentParticipants: activity.currentParticipants,
          entryFee: activity.entryFee,
          rewardPoints: activity.rewardPoints,
          status: activity.status,
          createdAt: activity.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error("Activity creation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during activity creation",
    });
  }
};
```

#### 2. 活动报名

```javascript
// POST /api/activities/:id/register
const registerForActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    const userId = req.user.userId;

    // 1. 获取活动信息
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // 2. 检查活动状态
    if (activity.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Activity is not available for registration",
      });
    }

    // 3. 检查报名截止时间
    const now = new Date();
    if (activity.registrationDeadline && now > activity.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline has passed",
      });
    }

    // 4. 检查活动是否已开始
    if (now >= activity.startTime) {
      return res.status(400).json({
        success: false,
        message: "Activity has already started",
      });
    }

    // 5. 检查是否已报名
    const existingParticipation = await ActivityParticipation.findOne({
      activityId,
      userId,
    });

    if (existingParticipation) {
      return res.status(409).json({
        success: false,
        message: "You are already registered for this activity",
      });
    }

    // 6. 检查名额限制
    if (
      activity.maxParticipants &&
      activity.currentParticipants >= activity.maxParticipants
    ) {
      return res.status(400).json({
        success: false,
        message: "Activity is full",
      });
    }

    // 7. 检查用户资格（如果有特殊要求）
    const user = await User.findById(userId);
    if (activity.requirements) {
      const meetsRequirements = await checkUserRequirements(
        user,
        activity.requirements
      );
      if (!meetsRequirements.valid) {
        return res.status(400).json({
          success: false,
          message: "You do not meet the requirements for this activity",
          requirements: meetsRequirements.missing,
        });
      }
    }

    // 8. 检查用户积分（如果需要报名费）
    if (activity.entryFee > 0 && user.points < activity.entryFee) {
      return res.status(400).json({
        success: false,
        message: "Insufficient points for registration",
        required: activity.entryFee,
        available: user.points,
      });
    }

    // 9. 使用事务处理报名
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 创建参与记录
      const participation = await ActivityParticipation.create(
        [
          {
            activityId,
            userId,
            registrationTime: now,
            attendanceStatus: "registered",
          },
        ],
        { session }
      );

      // 更新活动参与人数
      await Activity.updateOne(
        { _id: activityId },
        { $inc: { currentParticipants: 1 } },
        { session }
      );

      // 扣除报名费（如果有）
      if (activity.entryFee > 0) {
        await User.updateOne(
          { _id: userId },
          { $inc: { points: -activity.entryFee } },
          { session }
        );

        // 记录积分交易
        await PointTransaction.create(
          [
            {
              userId,
              activityId,
              transactionType: "deducted",
              points: activity.entryFee,
              description: `Registration fee for ${activity.title}`,
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();

      // 10. 发送确认邮件
      await emailService.sendRegistrationConfirmation(user.email, {
        activityTitle: activity.title,
        startTime: activity.startTime,
        location: activity.location,
        contactInfo: activity.contactInfo,
      });

      // 11. 记录报名日志
      logger.info("User registered for activity successfully", {
        userId,
        activityId,
        activityTitle: activity.title,
        registrationTime: now,
      });

      res.status(200).json({
        success: true,
        message: "Successfully registered for the activity",
        data: {
          participationId: participation[0].id,
          activityTitle: activity.title,
          registrationTime: now,
          remainingPoints: user.points - (activity.entryFee || 0),
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error("Activity registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};
```

#### 3. 活动签到系统

```javascript
// POST /api/activities/:id/checkin
const checkinActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    const userId = req.user.userId;
    const { location: userLocation, checkinCode } = req.body;

    // 1. 获取活动和参与记录
    const [activity, participation] = await Promise.all([
      Activity.findById(activityId),
      ActivityParticipation.findOne({ activityId, userId }),
    ]);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    if (!participation) {
      return res.status(400).json({
        success: false,
        message: "You are not registered for this activity",
      });
    }

    // 2. 检查活动状态和时间
    const now = new Date();
    const activityStart = new Date(activity.startTime);
    const activityEnd = new Date(activity.endTime);

    if (activity.status !== "ongoing" && activity.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Activity is not available for check-in",
      });
    }

    // 允许提前30分钟签到
    const checkinStart = new Date(activityStart.getTime() - 30 * 60 * 1000);
    if (now < checkinStart) {
      return res.status(400).json({
        success: false,
        message: "Check-in is not yet available",
        availableAt: checkinStart,
      });
    }

    // 活动结束后30分钟内仍可签到
    const checkinEnd = new Date(activityEnd.getTime() + 30 * 60 * 1000);
    if (now > checkinEnd) {
      return res.status(400).json({
        success: false,
        message: "Check-in period has ended",
      });
    }

    // 3. 检查是否已签到
    if (participation.attendanceStatus === "attended") {
      return res.status(409).json({
        success: false,
        message: "You have already checked in for this activity",
      });
    }

    // 4. 验证签到码（如果需要）
    if (activity.checkinCode && activity.checkinCode !== checkinCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in code",
      });
    }

    // 5. 地理位置验证（如果启用）
    if (activity.locationVerification && userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        activity.location.latitude,
        activity.location.longitude
      );

      if (distance > 200) {
        // 200米范围内
        return res.status(400).json({
          success: false,
          message: "You are not at the activity location",
          distance: Math.round(distance),
        });
      }
    }

    // 6. 执行签到
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 更新参与记录
      await ActivityParticipation.updateOne(
        { _id: participation._id },
        {
          attendanceStatus: "attended",
          checkinTime: now,
          checkinLocation: userLocation,
        },
        { session }
      );

      // 奖励积分
      if (activity.rewardPoints > 0) {
        await User.updateOne(
          { _id: userId },
          { $inc: { points: activity.rewardPoints } },
          { session }
        );

        // 记录积分交易
        await PointTransaction.create(
          [
            {
              userId,
              activityId,
              transactionType: "earned",
              points: activity.rewardPoints,
              description: `Attendance reward for ${activity.title}`,
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();

      // 7. 记录签到日志
      logger.info("User checked in successfully", {
        userId,
        activityId,
        activityTitle: activity.title,
        checkinTime: now,
        pointsEarned: activity.rewardPoints,
      });

      res.status(200).json({
        success: true,
        message: "Check-in successful",
        data: {
          checkinTime: now,
          pointsEarned: activity.rewardPoints,
          totalPoints: await getUserTotalPoints(userId),
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error("Activity check-in error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during check-in",
    });
  }
};
```

---

## 📊 排行榜系统

### 排行榜类型设计

```javascript
const LEADERBOARD_TYPES = {
  OVERALL: "overall", // 总积分排行
  ACADEMIC: "academic", // 学术活动排行
  SPORTS: "sports", // 体育活动排行
  SOCIAL: "social", // 社交活动排行
  VOLUNTEER: "volunteer", // 志愿活动排行
  CAREER: "career", // 职业发展排行
};

const PERIOD_TYPES = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  SEMESTER: "semester",
  ANNUAL: "annual",
};
```

### 排行榜更新机制

```javascript
// 排行榜更新服务
class LeaderboardService {
  constructor() {
    this.updateQueue = [];
    this.isUpdating = false;
  }

  // 实时更新排行榜
  async updateUserRanking(userId, category, points) {
    try {
      const periods = await this.getCurrentPeriods();

      for (const period of periods) {
        await this.updateLeaderboardEntry(userId, category, points, period);
      }

      // 触发排行榜变化事件
      await this.emitRankingChangeEvent(userId, category);
    } catch (error) {
      logger.error("Failed to update user ranking:", error);
      throw error;
    }
  }

  async updateLeaderboardEntry(userId, category, points, period) {
    const { periodType, periodStart, periodEnd } = period;

    // 使用 upsert 操作
    const result = await LeaderboardEntry.findOneAndUpdate(
      {
        userId,
        category,
        periodType,
        periodStart,
        periodEnd,
      },
      {
        $inc: {
          points: points,
          activitiesCount: 1,
        },
        $set: {
          lastActivityDate: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // 重新计算排名
    await this.recalculateRankings(
      category,
      periodType,
      periodStart,
      periodEnd
    );

    return result;
  }

  // 批量重新计算排名
  async recalculateRankings(category, periodType, periodStart, periodEnd) {
    const entries = await LeaderboardEntry.find({
      category,
      periodType,
      periodStart,
      periodEnd,
    }).sort({ points: -1, lastActivityDate: 1 });

    const bulkOps = entries.map((entry, index) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { rankPosition: index + 1 } },
      },
    }));

    if (bulkOps.length > 0) {
      await LeaderboardEntry.bulkWrite(bulkOps);
    }
  }

  // 获取当前所有有效期间
  getCurrentPeriods() {
    const now = new Date();
    const periods = [];

    // 本周
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    periods.push({
      periodType: "weekly",
      periodStart: weekStart,
      periodEnd: weekEnd,
    });

    // 本月
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    periods.push({
      periodType: "monthly",
      periodStart: monthStart,
      periodEnd: monthEnd,
    });

    // 本学期
    const semesterPeriod = getCurrentSemesterPeriod(now);
    periods.push({
      periodType: "semester",
      periodStart: semesterPeriod.start,
      periodEnd: semesterPeriod.end,
    });

    // 本年
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    periods.push({
      periodType: "annual",
      periodStart: yearStart,
      periodEnd: yearEnd,
    });

    return periods;
  }
}
```

### 排行榜 API 设计

#### 1. 获取排行榜

```javascript
// GET /api/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const {
      category = "overall",
      period = "weekly",
      page = 1,
      limit = 50,
      userId,
    } = req.query;

    // 1. 参数验证
    if (!Object.values(LEADERBOARD_TYPES).includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    if (!Object.values(PERIOD_TYPES).includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Invalid period",
      });
    }

    // 2. 获取当前期间
    const currentPeriod = getCurrentPeriodDates(period);

    // 3. 构建查询条件
    const query = {
      category,
      periodType: period,
      periodStart: currentPeriod.start,
      periodEnd: currentPeriod.end,
    };

    // 4. 分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 100); // 最大100条

    // 5. 查询排行榜数据
    const [entries, totalCount] = await Promise.all([
      LeaderboardEntry.find(query)
        .populate("userId", "firstName lastName avatarUrl university major")
        .sort({ rankPosition: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      LeaderboardEntry.countDocuments(query),
    ]);

    // 6. 如果指定了用户ID，获取该用户的排名信息
    let userRanking = null;
    if (userId) {
      userRanking = await LeaderboardEntry.findOne({
        ...query,
        userId,
      }).populate("userId", "firstName lastName avatarUrl");
    }

    // 7. 格式化数据
    const formattedEntries = entries.map((entry) => ({
      rank: entry.rankPosition,
      user: {
        id: entry.userId._id,
        firstName: entry.userId.firstName,
        lastName: entry.userId.lastName,
        avatarUrl: entry.userId.avatarUrl,
        university: entry.userId.university,
        major: entry.userId.major,
      },
      points: entry.points,
      activitiesCount: entry.activitiesCount,
      lastActivityDate: entry.lastActivityDate,
    }));

    // 8. 构建响应
    const response = {
      success: true,
      data: {
        leaderboard: formattedEntries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limitNum),
          totalItems: totalCount,
          itemsPerPage: limitNum,
        },
        period: {
          type: period,
          start: currentPeriod.start,
          end: currentPeriod.end,
        },
        category,
      },
    };

    // 9. 添加用户排名信息
    if (userRanking) {
      response.data.userRanking = {
        rank: userRanking.rankPosition,
        points: userRanking.points,
        activitiesCount: userRanking.activitiesCount,
        lastActivityDate: userRanking.lastActivityDate,
      };
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching leaderboard",
    });
  }
};
```

#### 2. 获取用户排名历史

```javascript
// GET /api/leaderboard/user/:userId/history
const getUserRankingHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category = "overall", months = 6 } = req.query;

    // 1. 权限检查 - 只能查看自己的历史或管理员可以查看所有
    if (req.user.userId !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    // 2. 获取历史数据
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const history = await LeaderboardEntry.find({
      userId,
      category,
      periodType: "monthly",
      periodStart: { $gte: startDate, $lte: endDate },
    })
      .sort({ periodStart: -1 })
      .lean();

    // 3. 格式化历史数据
    const formattedHistory = history.map((entry) => ({
      period: {
        start: entry.periodStart,
        end: entry.periodEnd,
        month: entry.periodStart.getMonth() + 1,
        year: entry.periodStart.getFullYear(),
      },
      rank: entry.rankPosition,
      points: entry.points,
      activitiesCount: entry.activitiesCount,
      lastActivityDate: entry.lastActivityDate,
    }));

    // 4. 计算趋势
    const trends = calculateRankingTrends(formattedHistory);

    res.status(200).json({
      success: true,
      data: {
        history: formattedHistory,
        trends: {
          rankChange: trends.rankChange,
          pointsGrowth: trends.pointsGrowth,
          activityTrend: trends.activityTrend,
        },
        summary: {
          bestRank: Math.min(...formattedHistory.map((h) => h.rank)),
          totalPoints: formattedHistory.reduce((sum, h) => sum + h.points, 0),
          totalActivities: formattedHistory.reduce(
            (sum, h) => sum + h.activitiesCount,
            0
          ),
        },
      },
    });
  } catch (error) {
    logger.error("Get user ranking history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching ranking history",
    });
  }
};
```

---

## 🔒 安全与权限控制

### JWT 中间件

```javascript
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 检查用户是否仍然活跃
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid access token",
    });
  }
};
```

### 权限控制中间件

```javascript
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = req.user.role || "student";
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// 使用示例
router.delete(
  "/api/activities/:id",
  authenticateToken,
  requireRole(["admin", "moderator"]),
  deleteActivity
);
```

### 输入验证

```javascript
const activityValidation = {
  create: {
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(20).max(2000).required(),
    category: Joi.string()
      .valid(...Object.values(ACTIVITY_CATEGORIES))
      .required(),
    type: Joi.string().valid("individual", "team", "competition").required(),
    location: Joi.string().max(500).required(),
    startTime: Joi.date().greater("now").required(),
    endTime: Joi.date().greater(Joi.ref("startTime")).required(),
    registrationDeadline: Joi.date().less(Joi.ref("startTime")).optional(),
    maxParticipants: Joi.number().integer().min(1).max(1000).optional(),
    entryFee: Joi.number().min(0).max(1000).optional(),
    rewardPoints: Joi.number().integer().min(0).max(500).optional(),
    requirements: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  },
};
```

---

## ⚡ 性能优化

### 数据库优化

```javascript
// 复合索引优化
db.activities.createIndex({
  category: 1,
  status: 1,
  startTime: 1,
});

db.leaderboard_entries.createIndex({
  category: 1,
  periodType: 1,
  periodStart: 1,
  points: -1,
});

// 分页优化
const getActivitiesOptimized = async (page, limit, filters) => {
  const skip = (page - 1) * limit;

  // 使用聚合管道优化查询
  const pipeline = [
    { $match: filters },
    { $sort: { startTime: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "organizerId",
        foreignField: "_id",
        as: "organizer",
        pipeline: [{ $project: { firstName: 1, lastName: 1, avatarUrl: 1 } }],
      },
    },
    { $unwind: "$organizer" },
  ];

  return await Activity.aggregate(pipeline);
};
```

### 缓存策略

```javascript
// Redis缓存实现
class CacheService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.defaultTTL = 3600; // 1小时
  }

  async getLeaderboard(category, period) {
    const key = `leaderboard:${category}:${period}`;
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const data = await this.fetchLeaderboardFromDB(category, period);
    await this.redis.setex(key, this.defaultTTL, JSON.stringify(data));

    return data;
  }

  async invalidateLeaderboard(category, period) {
    const key = `leaderboard:${category}:${period}`;
    await this.redis.del(key);
  }

  async getUserProfile(userId) {
    const key = `user:${userId}`;
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const user = await User.findById(userId).lean();
    await this.redis.setex(key, 1800, JSON.stringify(user)); // 30分钟

    return user;
  }
}
```

---

## 🧪 测试策略

### 单元测试示例

```javascript
// tests/unit/auth.service.test.js
describe("AuthService", () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        studentId: "ST001",
        email: "test@university.edu",
        password: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
        university: "Test University",
      };

      const result = await authService.registerUser(userData);

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.verificationStatus).toBe("pending");
    });

    it("should reject duplicate email registration", async () => {
      const userData = {
        studentId: "ST002",
        email: "existing@university.edu",
        password: "SecurePass123!",
        firstName: "Jane",
        lastName: "Doe",
        university: "Test University",
      };

      // First registration
      await authService.registerUser(userData);

      // Duplicate registration
      const result = await authService.registerUser(userData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("already exists");
    });
  });

  describe("loginUser", () => {
    it("should login with correct credentials", async () => {
      const email = "verified@university.edu";
      const password = "SecurePass123!";

      const result = await authService.loginUser(email, password);

      expect(result.success).toBe(true);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.user.email).toBe(email);
    });

    it("should reject unverified user login", async () => {
      const email = "unverified@university.edu";
      const password = "SecurePass123!";

      const result = await authService.loginUser(email, password);

      expect(result.success).toBe(false);
      expect(result.message).toContain("verify your email");
    });
  });
});
```

### 集成测试示例

```javascript
// tests/integration/activity.test.js
describe("Activity API Integration", () => {
  let server;
  let authToken;
  let testUser;

  beforeAll(async () => {
    server = require("../../src/app");

    // 创建测试用户并登录
    testUser = await createTestUser();
    authToken = await loginTestUser(testUser.email, "password");
  });

  afterAll(async () => {
    await cleanupTestData();
    server.close();
  });

  describe("POST /api/activities", () => {
    it("should create a new activity", async () => {
      const activityData = {
        title: "Test Activity",
        description: "This is a test activity description",
        category: "academic",
        type: "individual",
        location: "Test Location",
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        endTime: new Date(Date.now() + 90000000), // Day after tomorrow
        maxParticipants: 50,
        rewardPoints: 10,
      };

      const response = await request(server)
        .post("/api/activities")
        .set("Authorization", `Bearer ${authToken}`)
        .send(activityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activity.title).toBe(activityData.title);
    });
  });

  describe("POST /api/activities/:id/register", () => {
    it("should register user for activity", async () => {
      const activity = await createTestActivity();

      const response = await request(server)
        .post(`/api/activities/${activity.id}/register`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activityTitle).toBe(activity.title);
    });
  });
});
```

---

## 🚀 部署与运维

### Docker 配置

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/campusride
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=campusride
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 环境变量配置

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/campusride
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_POOL_SIZE=5

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
UPLOAD_MAX_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn
```

---

## 📋 开发检查清单

### 开发前检查

- [ ] 环境变量配置完成
- [ ] 数据库连接测试通过
- [ ] Redis 连接测试通过
- [ ] 测试数据库初始化
- [ ] API 文档工具配置（Swagger）

### 开发中检查

- [ ] 所有 API 接口实现 JWT 认证
- [ ] 输入验证中间件已应用
- [ ] 错误处理中间件已配置
- [ ] 日志记录已实现
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试已编写

### 代码质量检查

- [ ] ESLint 检查通过
- [ ] 代码格式化（Prettier）
- [ ] 安全漏洞扫描（npm audit）
- [ ] 性能分析完成
- [ ] 内存泄漏检查

### 部署前检查

- [ ] 生产环境配置验证
- [ ] 数据库迁移脚本准备
- [ ] 监控和日志配置
- [ ] 负载测试完成
- [ ] 回滚计划准备

---

## 📞 支持与联系

### 技术问题

- 开发文档：本文档
- API 文档：http://localhost:3000/api-docs
- 测试覆盖率报告：/coverage/index.html

### 协作规范

- 代码提交前必须通过所有测试
- 重要功能需要代码审查
- 遵循 Git 提交规范
- 及时更新技术文档

---

**文档版本**: v1.0  
**最后更新**: 2024-06-30  
**负责人**: Claude Code  
**审核人**: 待定

---

_本文档包含完整的后端开发规范和实现细节，请严格按照文档进行开发，确保代码质量和系统稳定性。_
