# API接口标准化规范

## 🎯 规范概述

**目标**: 确保Claude Code和Cursor AI开发的后端模块API接口统一、规范、可维护  
**适用范围**: 所有REST API、WebSocket接口、内部服务接口  
**遵循标准**: RESTful API设计原则、OpenAPI 3.0规范、HTTP标准  

## 📋 目录

1. [接口设计原则](#接口设计原则)
2. [URL命名规范](#url命名规范)
3. [HTTP方法使用](#http方法使用)
4. [请求响应格式](#请求响应格式)
5. [状态码规范](#状态码规范)
6. [认证授权规范](#认证授权规范)
7. [参数验证规范](#参数验证规范)
8. [错误处理规范](#错误处理规范)
9. [分页规范](#分页规范)
10. [版本控制规范](#版本控制规范)
11. [文档规范](#文档规范)
12. [WebSocket规范](#websocket规范)

---

## 🏗️ 接口设计原则

### 核心设计原则
```yaml
一致性原则:
  - 命名风格统一
  - 响应格式一致
  - 错误处理统一
  - 认证方式一致

简洁性原则:
  - URL简洁明了
  - 参数合理精简
  - 响应内容精确
  - 文档清晰简洁

可预测性原则:
  - 行为符合预期
  - 命名语义明确
  - 状态码标准
  - 错误信息清晰

向后兼容原则:
  - 版本控制规范
  - 废弃通知机制
  - 平滑迁移策略
  - 兼容性测试

安全性原则:
  - 认证授权完整
  - 输入验证严格
  - 敏感信息保护
  - 访问控制精确
```

### 接口分类标准
```yaml
公开接口 (Public API):
  - 面向前端应用
  - 需要完整认证
  - 完整错误处理
  - 详细文档说明
  - 版本控制严格

内部接口 (Internal API):
  - 模块间通信
  - 简化认证机制
  - 基础错误处理
  - 内部文档
  - 版本控制灵活

管理接口 (Admin API):
  - 管理员专用
  - 高级权限验证
  - 审计日志记录
  - 详细操作记录
  - 安全性优先

第三方接口 (Third-party API):
  - 外部服务调用
  - API密钥认证
  - 速率限制
  - 监控告警
  - 错误重试机制
```

---

## 🔗 URL命名规范

### 基础命名规则
```yaml
路径结构:
  格式: /api/v{version}/{module}/{resource}[/{id}][/{sub-resource}]
  示例: 
    - /api/v1/auth/users
    - /api/v1/rideshare/rides/123
    - /api/v1/marketplace/products/456/images

命名约定:
  - 使用小写字母
  - 单词间用连字符(-)分隔
  - 资源名使用复数形式
  - 避免动词，使用名词
  - 路径深度不超过4层

模块前缀:
  模块1 (Claude Code):
    - /api/v1/auth/*      # 用户认证
    - /api/v1/users/*     # 用户管理
    - /api/v1/activities/* # 活动管理
    - /api/v1/leaderboard/* # 排行榜
    
  模块2 (Cursor AI):
    - /api/v1/rideshare/*   # 拼车服务
    - /api/v1/marketplace/* # 市场交易
    - /api/v1/notifications/* # 通知服务
    - /api/v1/files/*       # 文件管理

共享服务:
    - /api/v1/health        # 健康检查
    - /api/v1/metrics       # 监控指标
    - /api/v1/docs          # 文档服务
```

### URL模式示例
```bash
# ✅ 正确示例
GET  /api/v1/auth/users                    # 获取用户列表
GET  /api/v1/auth/users/123                # 获取特定用户
POST /api/v1/activities                    # 创建活动
PUT  /api/v1/activities/456                # 更新活动
GET  /api/v1/rideshare/rides/789/passengers # 获取拼车乘客列表
POST /api/v1/marketplace/products/search   # 商品搜索

# ❌ 错误示例
GET  /api/v1/getUserList                   # 不应使用动词
GET  /api/v1/user/123                      # 资源名应为复数
POST /api/v1/activity_create               # 不应使用下划线
GET  /api/v1/rides/list_all_active_rides   # 路径过于复杂
```

### 查询参数规范
```yaml
分页参数:
  - page: 页码，从1开始
  - limit: 每页数量，默认20，最大100
  - offset: 偏移量 (可选，与page二选一)

排序参数:
  - sort: 排序字段，例如 "created_at"
  - order: 排序方向，"asc" 或 "desc"，默认 "desc"
  - sort_by: 复合排序，例如 "price,-created_at"

筛选参数:
  - 使用资源字段名作为参数名
  - 支持操作符后缀: _gte, _lte, _like, _in
  - 例如: price_gte=100&category_in=electronics,books

搜索参数:
  - q: 全文搜索关键词
  - search: 搜索关键词 (q的别名)
  - fields: 指定搜索字段，例如 "title,description"

示例:
  GET /api/v1/marketplace/products?
      q=laptop&
      category=electronics&
      price_gte=500&
      price_lte=2000&
      sort=price&
      order=asc&
      page=1&
      limit=20
```

---

## 🔧 HTTP方法使用

### 标准HTTP方法
```yaml
GET:
  用途: 获取资源
  特点: 幂等、安全、可缓存
  示例:
    - GET /api/v1/users          # 获取用户列表
    - GET /api/v1/users/123      # 获取特定用户
    - GET /api/v1/activities     # 获取活动列表

POST:
  用途: 创建资源、非幂等操作
  特点: 非幂等、不可缓存
  示例:
    - POST /api/v1/users         # 创建用户
    - POST /api/v1/auth/login    # 用户登录
    - POST /api/v1/activities/123/register # 报名活动

PUT:
  用途: 完整更新资源
  特点: 幂等、需要完整资源数据
  示例:
    - PUT /api/v1/users/123      # 完整更新用户信息
    - PUT /api/v1/activities/456 # 完整更新活动信息

PATCH:
  用途: 部分更新资源
  特点: 幂等、只需要变更字段
  示例:
    - PATCH /api/v1/users/123    # 部分更新用户信息
    - PATCH /api/v1/products/789 # 更新商品状态

DELETE:
  用途: 删除资源
  特点: 幂等
  示例:
    - DELETE /api/v1/users/123   # 删除用户
    - DELETE /api/v1/rides/456   # 取消拼车

HEAD:
  用途: 获取资源元数据
  特点: 类似GET但不返回响应体
  示例:
    - HEAD /api/v1/files/123     # 检查文件是否存在

OPTIONS:
  用途: 获取支持的方法和CORS预检
  示例:
    - OPTIONS /api/v1/users      # 获取支持的方法
```

### 特殊操作处理
```yaml
批量操作:
  # 批量创建
  POST /api/v1/users/batch
  Body: { "users": [...] }
  
  # 批量更新
  PATCH /api/v1/users/batch
  Body: { "updates": [...] }
  
  # 批量删除
  DELETE /api/v1/users/batch
  Body: { "ids": [...] }

状态变更:
  # 激活用户
  PATCH /api/v1/users/123/status
  Body: { "status": "active" }
  
  # 完成拼车
  PATCH /api/v1/rides/456/status
  Body: { "status": "completed" }

关联操作:
  # 添加关联
  POST /api/v1/activities/123/participants/456
  
  # 移除关联
  DELETE /api/v1/activities/123/participants/456
  
  # 获取关联
  GET /api/v1/activities/123/participants

文件操作:
  # 上传文件
  POST /api/v1/files
  Content-Type: multipart/form-data
  
  # 获取文件
  GET /api/v1/files/123
  
  # 下载文件
  GET /api/v1/files/123/download
```

---

## 📊 请求响应格式

### 标准响应格式
```javascript
// 成功响应格式
{
  "success": true,
  "data": {
    // 具体数据
  },
  "message": "Operation completed successfully", // 可选
  "meta": {                                     // 可选
    "timestamp": "2024-06-30T10:00:00Z",
    "request_id": "req_123456789",
    "execution_time": 150
  }
}

// 列表响应格式
{
  "success": true,
  "data": {
    "items": [
      // 列表项
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_items": 200,
      "items_per_page": 20,
      "has_next": true,
      "has_prev": false
    }
  },
  "meta": {
    "timestamp": "2024-06-30T10:00:00Z",
    "request_id": "req_123456789"
  }
}

// 错误响应格式
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Email format is invalid"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-06-30T10:00:00Z",
    "request_id": "req_123456789"
  }
}
```

### 请求格式规范
```javascript
// JSON请求体格式
{
  // 使用camelCase命名
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "contactInfo": {
    "email": "john.doe@university.edu",
    "phone": "+86-138-0013-8000"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "push": false
    }
  }
}

// 查询参数格式
GET /api/v1/users?
    page=1&
    limit=20&
    sort=created_at&
    order=desc&
    status=active&
    university=beijing-university

// 表单数据格式
Content-Type: application/x-www-form-urlencoded
email=john%40university.edu&password=secret123&remember_me=true

// 文件上传格式
Content-Type: multipart/form-data
------WebKitFormBoundary...
Content-Disposition: form-data; name="file"; filename="avatar.jpg"
Content-Type: image/jpeg

[文件二进制数据]
------WebKitFormBoundary...
Content-Disposition: form-data; name="purpose"

avatar
```

### 数据类型规范
```yaml
字符串 (String):
  - 使用UTF-8编码
  - 最大长度限制明确
  - 必要时进行转义
  - 空值表示: null 或 ""

数字 (Number):
  - 整数: 使用Integer类型
  - 小数: 使用Decimal类型，指定精度
  - 货币: 使用字符串表示，保持精度
  - 大数: 使用字符串避免精度丢失

布尔值 (Boolean):
  - 只使用 true/false
  - 不使用 1/0 或 "true"/"false"

日期时间 (DateTime):
  - 格式: ISO 8601 (2024-06-30T10:00:00Z)
  - 时区: 统一使用UTC
  - 日期: YYYY-MM-DD
  - 时间: HH:MM:SS

数组 (Array):
  - 同类型元素
  - 明确最大长度
  - 空数组: []

对象 (Object):
  - 使用嵌套结构表示复杂数据
  - 避免过深嵌套（最多3层）
  - 空对象: {}

枚举 (Enum):
  - 使用字符串常量
  - 全大写，下划线分隔
  - 例如: "PENDING", "CONFIRMED", "CANCELLED"

文件 (File):
  - 使用URL引用
  - 包含文件元信息
  - 示例: {
      "url": "https://cdn.example.com/files/123.jpg",
      "filename": "avatar.jpg",
      "size": 102400,
      "type": "image/jpeg"
    }
```

---

## 📊 状态码规范

### HTTP状态码使用指南
```yaml
2xx 成功:
  200 OK:
    - GET请求成功
    - 一般性成功操作
  201 Created:
    - POST请求成功创建资源
    - 返回新创建的资源
  202 Accepted:
    - 异步处理已接受
    - 返回处理状态信息
  204 No Content:
    - DELETE请求成功
    - PUT请求成功但无返回内容

3xx 重定向:
  301 Moved Permanently:
    - 资源永久迁移
    - API版本废弃重定向
  302 Found:
    - 临时重定向
    - 文件下载链接
  304 Not Modified:
    - 缓存有效
    - 条件请求未变更

4xx 客户端错误:
  400 Bad Request:
    - 请求格式错误
    - 参数验证失败
  401 Unauthorized:
    - 未认证或认证失败
    - Token无效或过期
  403 Forbidden:
    - 已认证但无权限
    - 资源访问被拒绝
  404 Not Found:
    - 资源不存在
    - API端点不存在
  405 Method Not Allowed:
    - HTTP方法不支持
    - 例如POST到只读资源
  409 Conflict:
    - 资源冲突
    - 重复创建
  422 Unprocessable Entity:
    - 语法正确但语义错误
    - 业务逻辑验证失败
  429 Too Many Requests:
    - 请求频率超限
    - 触发速率限制

5xx 服务器错误:
  500 Internal Server Error:
    - 服务器内部错误
    - 未预期的异常
  502 Bad Gateway:
    - 上游服务错误
    - 第三方API调用失败
  503 Service Unavailable:
    - 服务暂时不可用
    - 维护模式
  504 Gateway Timeout:
    - 上游服务超时
    - 处理时间过长
```

### 错误码定义
```javascript
// 应用级错误码
const ERROR_CODES = {
  // 认证相关 (1000-1099)
  INVALID_CREDENTIALS: 1001,
  TOKEN_EXPIRED: 1002,
  TOKEN_INVALID: 1003,
  ACCOUNT_LOCKED: 1004,
  EMAIL_NOT_VERIFIED: 1005,
  
  // 验证相关 (1100-1199)
  VALIDATION_ERROR: 1101,
  REQUIRED_FIELD_MISSING: 1102,
  INVALID_FORMAT: 1103,
  VALUE_TOO_LONG: 1104,
  VALUE_TOO_SHORT: 1105,
  
  // 资源相关 (1200-1299)
  RESOURCE_NOT_FOUND: 1201,
  RESOURCE_ALREADY_EXISTS: 1202,
  RESOURCE_CONFLICT: 1203,
  RESOURCE_LOCKED: 1204,
  
  // 权限相关 (1300-1399)
  PERMISSION_DENIED: 1301,
  INSUFFICIENT_PRIVILEGES: 1302,
  OWNER_REQUIRED: 1303,
  
  // 业务逻辑 (1400-1499)
  BUSINESS_RULE_VIOLATION: 1401,
  OPERATION_NOT_ALLOWED: 1402,
  QUOTA_EXCEEDED: 1403,
  SERVICE_UNAVAILABLE: 1404,
  
  // 外部服务 (1500-1599)
  EXTERNAL_SERVICE_ERROR: 1501,
  PAYMENT_SERVICE_ERROR: 1502,
  EMAIL_SERVICE_ERROR: 1503,
  MAPS_SERVICE_ERROR: 1504,
  
  // 系统错误 (9000-9999)
  INTERNAL_ERROR: 9001,
  DATABASE_ERROR: 9002,
  CACHE_ERROR: 9003,
  FILE_SYSTEM_ERROR: 9004
};
```

### 状态码响应示例
```javascript
// 200 OK - 成功获取数据
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "user@university.edu",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}

// 201 Created - 成功创建资源
HTTP/1.1 201 Created
{
  "success": true,
  "data": {
    "activity": {
      "id": 456,
      "title": "Campus Marathon",
      "status": "published",
      "createdAt": "2024-06-30T10:00:00Z"
    }
  },
  "message": "Activity created successfully"
}

// 400 Bad Request - 验证错误
HTTP/1.1 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Email format is invalid"
      },
      {
        "field": "password",
        "code": "VALUE_TOO_SHORT",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}

// 401 Unauthorized - 认证失败
HTTP/1.1 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired",
    "details": {
      "expiredAt": "2024-06-30T09:30:00Z",
      "renewalEndpoint": "/api/v1/auth/refresh"
    }
  }
}

// 404 Not Found - 资源不存在
HTTP/1.1 404 Not Found
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with ID 999 not found"
  }
}

// 500 Internal Server Error - 服务器错误
HTTP/1.1 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": {
      "errorId": "error_123456789",
      "supportContact": "support@campusride.com"
    }
  }
}
```

---

## 🔐 认证授权规范

### JWT Token规范
```yaml
Token格式:
  类型: Bearer Token
  标准: JWT (RFC 7519)
  算法: RS256 (推荐) 或 HS256
  
Header示例:
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

Token结构:
  Access Token:
    - 有效期: 15分钟
    - 用途: API访问认证
    - 包含: 用户ID、角色、权限
    
  Refresh Token:
    - 有效期: 7天 (可配置)
    - 用途: 刷新Access Token
    - 存储: HttpOnly Cookie (推荐) 或 安全存储
    
  ID Token:
    - 有效期: 1小时
    - 用途: 用户身份信息
    - 包含: 用户基本信息
```

### Token Payload规范
```javascript
// Access Token Payload
{
  "iss": "campusride-auth",           // 发行者
  "sub": "user_123456789",            // 主体(用户ID)
  "aud": "campusride-api",            // 受众
  "exp": 1719758400,                  // 过期时间
  "iat": 1719757500,                  // 签发时间
  "jti": "token_abcdef123456",        // Token ID
  "userId": 123456789,                // 用户ID
  "email": "user@university.edu",     // 用户邮箱
  "role": "student",                  // 用户角色
  "permissions": [                    // 权限列表
    "activities:read",
    "activities:create",
    "rideshare:read",
    "rideshare:create"
  ],
  "university": "beijing-university", // 所属大学
  "verified": true                    // 是否已验证
}

// Refresh Token Payload
{
  "iss": "campusride-auth",
  "sub": "user_123456789",
  "aud": "campusride-auth",
  "exp": 1720363200,                  // 7天后过期
  "iat": 1719758400,
  "jti": "refresh_xyz789123",
  "type": "refresh"                   // Token类型
}
```

### 权限控制规范
```yaml
角色定义:
  student:          # 学生用户
    - 基础功能访问
    - 创建个人内容
    - 参与活动和拼车
    
  moderator:        # 版主
    - 审核用户内容
    - 管理活动和拼车
    - 处理举报
    
  admin:            # 管理员
    - 系统管理
    - 用户管理
    - 数据统计
    
  system:           # 系统账户
    - 内部服务调用
    - 自动化任务

权限格式:
  格式: {resource}:{action}[:{scope}]
  示例:
    - users:read              # 读取用户信息
    - users:update:own        # 更新自己的信息
    - activities:create       # 创建活动
    - activities:delete:any   # 删除任何活动
    - rideshare:manage:own    # 管理自己的拼车

权限检查中间件:
  1. 提取并验证Token
  2. 获取用户角色和权限
  3. 检查资源访问权限
  4. 记录访问日志
```

### 认证流程示例
```javascript
// 1. 用户登录
POST /api/v1/auth/login
{
  "email": "user@university.edu",
  "password": "securePassword123",
  "rememberMe": true
}

// 响应
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "user@university.edu",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIs...",
      "tokenType": "Bearer",
      "expiresIn": 900
    }
  }
}

// 2. 携带Token访问API
GET /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

// 3. Token刷新
POST /api/v1/auth/refresh
Cookie: refreshToken=xyz789...

// 4. 权限不足响应
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Insufficient permissions to access this resource",
    "required_permission": "activities:delete:any"
  }
}
```

---

## ✅ 参数验证规范

### 验证层级
```yaml
客户端验证:
  - 基础格式检查
  - 实时反馈
  - 用户体验优化
  - 不可依赖

服务端验证:
  - 完整业务规则检查
  - 安全性验证
  - 数据完整性保证
  - 必须实现

数据库约束:
  - 数据类型约束
  - 唯一性约束
  - 外键约束
  - 最后防线
```

### 验证规则定义
```javascript
// 用户注册验证规则
const userRegistrationRules = {
  studentId: {
    type: 'string',
    required: true,
    minLength: 6,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/,
    unique: true,
    message: 'Student ID must be 6-20 alphanumeric characters'
  },
  
  email: {
    type: 'string',
    required: true,
    format: 'email',
    maxLength: 255,
    domain: ['university.edu', 'student.university.edu'],
    unique: true,
    message: 'Must use university email address'
  },
  
  password: {
    type: 'string',
    required: true,
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain uppercase, lowercase, number and special character'
  },
  
  firstName: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\u4e00-\u9fa5\s]+$/,
    message: 'First name can only contain letters and spaces'
  },
  
  university: {
    type: 'string',
    required: true,
    enum: ['beijing-university', 'tsinghua-university', 'fudan-university'],
    message: 'Invalid university selection'
  },
  
  graduationYear: {
    type: 'integer',
    required: false,
    minimum: new Date().getFullYear(),
    maximum: new Date().getFullYear() + 10,
    message: 'Graduation year must be between current year and 10 years from now'
  }
};

// 活动创建验证规则
const activityCreationRules = {
  title: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 200,
    trim: true,
    message: 'Title must be 5-200 characters long'
  },
  
  startTime: {
    type: 'datetime',
    required: true,
    future: true,
    message: 'Start time must be in the future'
  },
  
  endTime: {
    type: 'datetime',
    required: true,
    after: 'startTime',
    message: 'End time must be after start time'
  },
  
  maxParticipants: {
    type: 'integer',
    required: false,
    minimum: 1,
    maximum: 1000,
    message: 'Maximum participants must be between 1 and 1000'
  },
  
  location: {
    type: 'object',
    required: true,
    properties: {
      address: {
        type: 'string',
        required: true,
        maxLength: 500
      },
      latitude: {
        type: 'number',
        required: false,
        minimum: -90,
        maximum: 90
      },
      longitude: {
        type: 'number',
        required: false,
        minimum: -180,
        maximum: 180
      }
    }
  }
};
```

### 验证错误响应
```javascript
// 单字段验证错误
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Email format is invalid",
        "value": "invalid-email"
      }
    ]
  }
}

// 多字段验证错误
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Multiple validation errors",
    "details": [
      {
        "field": "password",
        "code": "VALUE_TOO_SHORT",
        "message": "Password must be at least 8 characters",
        "value": "123"
      },
      {
        "field": "email",
        "code": "DUPLICATE_VALUE",
        "message": "Email already exists",
        "value": "existing@university.edu"
      },
      {
        "field": "startTime",
        "code": "INVALID_DATE_RANGE",
        "message": "Start time must be in the future",
        "value": "2024-06-29T10:00:00Z"
      }
    ]
  }
}

// 业务规则验证错误
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Cannot register for activity",
    "details": {
      "rule": "REGISTRATION_DEADLINE_PASSED",
      "message": "Registration deadline has passed",
      "deadline": "2024-06-29T18:00:00Z",
      "current": "2024-06-30T10:00:00Z"
    }
  }
}
```

### 安全验证规范
```yaml
输入清理:
  - HTML标签转义
  - SQL注入防护
  - XSS攻击防护
  - 路径遍历防护

文件上传验证:
  - 文件类型检查
  - 文件大小限制
  - 文件名安全检查
  - 病毒扫描 (可选)

速率限制:
  - 按IP限制
  - 按用户限制
  - 按接口限制
  - 渐进式惩罚

数据敏感性:
  - 密码不记录日志
  - 敏感信息脱敏
  - 个人信息保护
  - 访问权限控制
```

---

## 📄 分页规范

### 分页参数标准
```yaml
查询参数:
  page:             # 页码，从1开始
    type: integer
    minimum: 1
    default: 1
    
  limit:            # 每页条数
    type: integer
    minimum: 1
    maximum: 100
    default: 20
    
  offset:           # 偏移量 (可选，与page互斥)
    type: integer
    minimum: 0

排序参数:
  sort:             # 排序字段
    type: string
    allowed: ['created_at', 'updated_at', 'name', 'price']
    default: 'created_at'
    
  order:            # 排序方向
    type: string
    enum: ['asc', 'desc']
    default: 'desc'
```

### 分页响应格式
```javascript
// 基于页码的分页
{
  "success": true,
  "data": {
    "items": [
      // 数据项列表
    ],
    "pagination": {
      "current_page": 1,        // 当前页码
      "total_pages": 25,        // 总页数
      "total_items": 500,       // 总条数
      "items_per_page": 20,     // 每页条数
      "has_next": true,         // 是否有下一页
      "has_prev": false,        // 是否有上一页
      "next_page": 2,           // 下一页页码
      "prev_page": null         // 上一页页码
    }
  },
  "links": {                    // 分页链接
    "self": "/api/v1/users?page=1&limit=20",
    "next": "/api/v1/users?page=2&limit=20",
    "prev": null,
    "first": "/api/v1/users?page=1&limit=20",
    "last": "/api/v1/users?page=25&limit=20"
  }
}

// 基于游标的分页 (适用于大数据集)
{
  "success": true,
  "data": {
    "items": [
      // 数据项列表
    ],
    "pagination": {
      "has_next": true,
      "has_prev": false,
      "next_cursor": "eyJpZCI6MTIzLCJjcmVhdGVkX2F0IjoiMjAyNC0wNi0zMCJ9",
      "prev_cursor": null,
      "limit": 20
    }
  },
  "links": {
    "self": "/api/v1/activities?cursor=current&limit=20",
    "next": "/api/v1/activities?cursor=eyJpZCI6MTIzLCJjcmVhdGVkX2F0IjoiMjAyNC0wNi0zMCJ9&limit=20"
  }
}
```

### 分页实现示例
```javascript
// 页码分页实现
async function paginateUsers(page = 1, limit = 20, filters = {}) {
  // 参数验证
  page = Math.max(1, parseInt(page));
  limit = Math.min(100, Math.max(1, parseInt(limit)));
  
  const offset = (page - 1) * limit;
  
  // 构建查询条件
  const where = buildWhereClause(filters);
  
  // 并行查询数据和总数
  const [items, totalItems] = await Promise.all([
    User.find(where)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    User.countDocuments(where)
  ]);
  
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    items,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_items: totalItems,
      items_per_page: limit,
      has_next: page < totalPages,
      has_prev: page > 1,
      next_page: page < totalPages ? page + 1 : null,
      prev_page: page > 1 ? page - 1 : null
    }
  };
}

// 游标分页实现 (适用于实时数据)
async function paginateWithCursor(cursor = null, limit = 20, filters = {}) {
  limit = Math.min(100, Math.max(1, parseInt(limit)));
  
  const where = buildWhereClause(filters);
  
  // 解析游标
  if (cursor) {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
    where.createdAt = { $lt: new Date(decoded.created_at) };
  }
  
  // 查询数据 (多查询一条判断是否还有下一页)
  const items = await Activity.find(where)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();
  
  const hasNext = items.length > limit;
  if (hasNext) {
    items.pop(); // 移除多查询的一条
  }
  
  // 生成下一页游标
  let nextCursor = null;
  if (hasNext && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = Buffer.from(JSON.stringify({
      id: lastItem._id,
      created_at: lastItem.createdAt
    })).toString('base64');
  }
  
  return {
    items,
    pagination: {
      has_next: hasNext,
      next_cursor: nextCursor,
      limit
    }
  };
}
```

### 大数据集优化
```yaml
性能优化策略:
  索引优化:
    - 为排序字段建立索引
    - 为筛选字段建立复合索引
    - 避免全表扫描
    
  查询优化:
    - 使用lean()减少内存占用
    - 选择必要字段避免过度查询
    - 适当使用聚合管道
    
  缓存策略:
    - 缓存热点页面数据
    - 缓存总数统计
    - 设置合理的TTL
    
  分片策略:
    - 按时间分片
    - 按用户分片
    - 按地理位置分片

游标分页适用场景:
  - 实时数据流
  - 大数据集 (>100万条)
  - 频繁插入的数据
  - 需要一致性的分页

页码分页适用场景:
  - 相对静态的数据
  - 中小数据集 (<100万条)
  - 需要跳转到指定页
  - 展示总页数
```

---

## 🔄 版本控制规范

### 版本命名规范
```yaml
版本号格式:
  格式: v{major}.{minor}[.{patch}]
  示例: v1.0, v1.1, v2.0, v1.2.1
  
  major: 重大更新，不向后兼容
  minor: 功能更新，向后兼容
  patch: 修复更新，向后兼容

URL版本控制:
  路径版本控制: /api/v1/users (推荐)
  查询参数版本控制: /api/users?version=1
  请求头版本控制: API-Version: v1

版本生命周期:
  开发版: v1.0-dev     # 开发中
  测试版: v1.0-beta    # 测试中
  候选版: v1.0-rc      # 发布候选
  正式版: v1.0         # 正式发布
  维护版: v1.0.1       # 修复版本
  废弃版: v1.0 (deprecated) # 已废弃
```

### 版本兼容性策略
```yaml
向后兼容原则:
  可以添加:
    - 新的可选字段
    - 新的API端点
    - 新的查询参数
    - 新的响应字段
    
  不能更改:
    - 现有字段类型
    - 现有字段含义
    - 现有端点行为
    - 现有错误码含义
    
  废弃流程:
    1. 标记为废弃 (deprecated)
    2. 提供迁移指南
    3. 设置废弃时间表
    4. 发送废弃通知
    5. 移除废弃功能

版本共存策略:
  - 同时支持多个版本
  - 最多支持3个主版本
  - 新版本至少6个月预告
  - 提供自动迁移工具
```

### 版本控制实现
```javascript
// 版本中间件
const versionMiddleware = (req, res, next) => {
  // 从URL路径提取版本
  const pathVersion = req.path.match(/^\/api\/v(\d+)/);
  
  // 从请求头获取版本
  const headerVersion = req.headers['api-version'];
  
  // 从查询参数获取版本
  const queryVersion = req.query.version;
  
  // 版本优先级：路径 > 请求头 > 查询参数 > 默认
  let version = 'v1'; // 默认版本
  
  if (pathVersion) {
    version = `v${pathVersion[1]}`;
  } else if (headerVersion) {
    version = headerVersion;
  } else if (queryVersion) {
    version = queryVersion;
  }
  
  // 验证版本号
  const supportedVersions = ['v1', 'v2'];
  if (!supportedVersions.includes(version)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_VERSION',
        message: `API version ${version} is not supported`,
        supportedVersions
      }
    });
  }
  
  // 检查废弃版本
  const deprecatedVersions = {
    'v1': {
      deprecated: true,
      deprecationDate: '2024-01-01',
      removalDate: '2024-12-31',
      migrationGuide: 'https://docs.api.com/migration/v1-to-v2'
    }
  };
  
  req.apiVersion = version;
  
  // 添加废弃警告头
  if (deprecatedVersions[version]) {
    const dep = deprecatedVersions[version];
    res.set({
      'Deprecation': dep.deprecationDate,
      'Sunset': dep.removalDate,
      'Link': `<${dep.migrationGuide}>; rel="deprecation"`
    });
  }
  
  next();
};

// 版本特定的路由处理
const getUsersV1 = (req, res) => {
  // v1版本的用户列表格式
  res.json({
    success: true,
    users: [
      {
        id: 123,
        name: "John Doe",
        email: "john@university.edu"
      }
    ]
  });
};

const getUsersV2 = (req, res) => {
  // v2版本的用户列表格式
  res.json({
    success: true,
    data: {
      items: [
        {
          id: 123,
          firstName: "John",
          lastName: "Doe",
          email: "john@university.edu",
          profile: {
            university: "Beijing University",
            major: "Computer Science"
          }
        }
      ],
      pagination: {
        // 分页信息
      }
    }
  });
};

// 路由注册
router.get('/api/v1/users', getUsersV1);
router.get('/api/v2/users', getUsersV2);
```

### 版本迁移指南模板
```markdown
# API版本迁移指南: v1 → v2

## 概述
本指南帮助您将应用从API v1迁移到v2。v2版本提供了更好的性能、更一致的响应格式和新功能。

## 重要时间点
- **v2发布时间**: 2024-07-01
- **v1废弃时间**: 2024-12-31
- **v1停止服务**: 2025-06-30

## 主要变更

### 1. 响应格式统一
**v1格式:**
```json
{
  "success": true,
  "users": [...]
}
```

**v2格式:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {...}
  }
}
```

### 2. 字段名称变更
| v1字段 | v2字段 | 说明 |
|--------|--------|------|
| `name` | `firstName` + `lastName` | 拆分为名和姓 |
| `created` | `createdAt` | 使用ISO格式时间 |
| `status` | `isActive` | 改为布尔值 |

### 3. 新增功能
- 支持批量操作
- 改进的搜索功能
- 更好的错误处理

## 迁移步骤

### 步骤1: 更新客户端代码
1. 更改API基础URL从 `/api/v1` 到 `/api/v2`
2. 更新响应数据解析逻辑
3. 适配新的字段名称

### 步骤2: 测试验证
1. 在测试环境验证新API
2. 运行完整的集成测试
3. 性能基准测试

### 步骤3: 生产环境部署
1. 灰度发布
2. 监控错误率和性能
3. 完全切换到v2

## 代码示例

### JavaScript示例
```javascript
// v1代码
const response = await fetch('/api/v1/users');
const data = await response.json();
const users = data.users;

// v2代码
const response = await fetch('/api/v2/users');
const data = await response.json();
const users = data.data.items;
```

## 支持和帮助
- 技术文档: https://docs.api.com/v2
- 示例代码: https://github.com/example/api-v2-examples
- 技术支持: support@campusride.com
```

---

## 📚 文档规范

### API文档标准
```yaml
文档格式:
  标准: OpenAPI 3.0 (Swagger)
  格式: YAML (推荐) 或 JSON
  工具: Swagger UI, Redoc, Postman

文档结构:
  - API概述和认证说明
  - 错误码说明
  - 数据模型定义
  - 端点详细文档
  - 代码示例
  - 变更日志

更新频率:
  - 代码变更时同步更新
  - 每周检查文档完整性
  - 版本发布前全面审核

访问方式:
  - 在线文档: https://api.campusride.com/docs
  - 交互式API: https://api.campusride.com/swagger
  - 下载格式: PDF, OpenAPI JSON/YAML
```

### OpenAPI规范示例
```yaml
# campusride-api.yaml
openapi: 3.0.3
info:
  title: Campus Ride API
  description: |
    Campus Ride API provides comprehensive services for campus activities,
    ridesharing, marketplace, and user management.
    
    ## Authentication
    All API endpoints require authentication using JWT Bearer tokens.
    
    ## Rate Limiting
    API calls are limited to 1000 requests per hour per user.
    
  version: 2.0.0
  contact:
    name: API Support
    email: api-support@campusride.com
    url: https://campusride.com/support
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.campusride.com/v2
    description: Production server
  - url: https://staging-api.campusride.com/v2
    description: Staging server
  - url: http://localhost:3000/api/v2
    description: Development server

security:
  - bearerAuth: []

paths:
  /users:
    get:
      summary: Get users list
      description: Retrieve a paginated list of users with optional filtering
      tags:
        - Users
      parameters:
        - name: page
          in: query
          description: Page number (starts from 1)
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: Number of items per page
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: university
          in: query
          description: Filter by university
          required: false
          schema:
            type: string
            enum: [beijing-university, tsinghua-university]
      responses:
        '200':
          description: Users retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UsersListResponse'
              examples:
                success:
                  summary: Successful response
                  value:
                    success: true
                    data:
                      items:
                        - id: 123
                          firstName: "John"
                          lastName: "Doe"
                          email: "john@university.edu"
                          university: "beijing-university"
                          createdAt: "2024-06-30T10:00:00Z"
                      pagination:
                        current_page: 1
                        total_pages: 10
                        total_items: 200
                        items_per_page: 20
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '500':
          $ref: '#/components/responses/InternalServerError'
          
    post:
      summary: Create new user
      description: Register a new user account
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            examples:
              student:
                summary: Student registration
                value:
                  studentId: "ST2024001"
                  email: "student@university.edu"
                  password: "SecurePass123!"
                  firstName: "Jane"
                  lastName: "Smith"
                  university: "beijing-university"
                  major: "Computer Science"
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreateUserResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          description: User already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        JWT token obtained from the login endpoint.
        Format: `Bearer <token>`

  schemas:
    User:
      type: object
      required:
        - id
        - email
        - firstName
        - lastName
        - university
      properties:
        id:
          type: integer
          format: int64
          description: Unique user identifier
          example: 123
        studentId:
          type: string
          description: Student ID from university
          example: "ST2024001"
        email:
          type: string
          format: email
          description: University email address
          example: "student@university.edu"
        firstName:
          type: string
          minLength: 1
          maxLength: 50
          description: User's first name
          example: "John"
        lastName:
          type: string
          minLength: 1
          maxLength: 50
          description: User's last name
          example: "Doe"
        university:
          type: string
          enum: [beijing-university, tsinghua-university, fudan-university]
          description: University affiliation
        major:
          type: string
          maxLength: 100
          description: Field of study
          example: "Computer Science"
        points:
          type: integer
          minimum: 0
          description: User's activity points
          example: 150
        createdAt:
          type: string
          format: date-time
          description: Account creation timestamp
          example: "2024-06-30T10:00:00Z"

    CreateUserRequest:
      type: object
      required:
        - studentId
        - email
        - password
        - firstName
        - lastName
        - university
      properties:
        studentId:
          type: string
          minLength: 6
          maxLength: 20
          pattern: '^[A-Z0-9]+$'
          description: Student ID from university
        email:
          type: string
          format: email
          description: University email address
        password:
          type: string
          minLength: 8
          maxLength: 128
          description: Password (must contain uppercase, lowercase, number, special char)
        firstName:
          type: string
          minLength: 1
          maxLength: 50
        lastName:
          type: string
          minLength: 1
          maxLength: 50
        university:
          type: string
          enum: [beijing-university, tsinghua-university, fudan-university]
        major:
          type: string
          maxLength: 100

    PaginationInfo:
      type: object
      properties:
        current_page:
          type: integer
          minimum: 1
        total_pages:
          type: integer
          minimum: 0
        total_items:
          type: integer
          minimum: 0
        items_per_page:
          type: integer
          minimum: 1
        has_next:
          type: boolean
        has_prev:
          type: boolean

    SuccessResponse:
      type: object
      required:
        - success
      properties:
        success:
          type: boolean
          enum: [true]
        message:
          type: string
          description: Optional success message
        meta:
          type: object
          properties:
            timestamp:
              type: string
              format: date-time
            request_id:
              type: string

    ErrorResponse:
      type: object
      required:
        - success
        - error
      properties:
        success:
          type: boolean
          enum: [false]
        error:
          type: object
          required:
            - code
            - message
          properties:
            code:
              type: string
              description: Error code for programmatic handling
            message:
              type: string
              description: Human-readable error message
            details:
              oneOf:
                - type: array
                  items:
                    type: object
                - type: object
              description: Additional error details

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "BAD_REQUEST"
              message: "The request is invalid"

    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "UNAUTHORIZED"
              message: "Authentication required"

    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "VALIDATION_ERROR"
              message: "Input validation failed"
              details:
                - field: "email"
                  code: "INVALID_FORMAT"
                  message: "Email format is invalid"

    InternalServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "INTERNAL_ERROR"
              message: "An unexpected error occurred"

tags:
  - name: Authentication
    description: User authentication and authorization
  - name: Users
    description: User management operations
  - name: Activities
    description: Campus activities management
  - name: Rideshare
    description: Ridesharing services
  - name: Marketplace
    description: Campus marketplace
  - name: Notifications
    description: Notification services
```

---

## 🔌 WebSocket规范

### 连接管理
```yaml
连接URL格式:
  格式: wss://api.campusride.com/ws/v1/{namespace}
  示例:
    - wss://api.campusride.com/ws/v1/notifications
    - wss://api.campusride.com/ws/v1/chat
    - wss://api.campusride.com/ws/v1/rideshare

认证机制:
  方式1: 查询参数
    wss://api.campusride.com/ws/v1/notifications?token=jwt_token
    
  方式2: 连接后认证
    发送认证消息: {"type": "auth", "token": "jwt_token"}

连接生命周期:
  1. 建立连接
  2. 发送认证信息
  3. 接收认证确认
  4. 开始数据传输
  5. 心跳保持
  6. 优雅断开
```

### 消息格式规范
```javascript
// 基础消息格式
{
  "type": "message_type",        // 消息类型
  "id": "msg_123456789",         // 消息ID (可选)
  "timestamp": "2024-06-30T10:00:00Z", // 时间戳
  "data": {                      // 消息数据
    // 具体内容
  },
  "meta": {                      // 元数据 (可选)
    "version": "1.0",
    "source": "notification_service"
  }
}

// 认证消息
{
  "type": "auth",
  "token": "eyJhbGciOiJSUzI1NiIs..."
}

// 认证响应
{
  "type": "auth_response",
  "success": true,
  "user_id": 123,
  "message": "Authentication successful"
}

// 通知消息
{
  "type": "notification",
  "id": "notif_987654321",
  "timestamp": "2024-06-30T10:00:00Z",
  "data": {
    "notification_type": "ride_request",
    "title": "New Ride Request",
    "content": "Someone wants to join your ride",
    "action_url": "/rideshare/requests/456",
    "priority": "high"
  }
}

// 聊天消息
{
  "type": "chat_message",
  "id": "chat_msg_555",
  "timestamp": "2024-06-30T10:00:00Z",
  "data": {
    "conversation_id": "ride_123",
    "sender_id": 456,
    "sender_name": "Jane Doe",
    "message_type": "text",
    "content": "I'll be there in 5 minutes",
    "reply_to": null
  }
}

// 实时位置更新
{
  "type": "location_update",
  "id": "loc_789",
  "timestamp": "2024-06-30T10:00:00Z",
  "data": {
    "ride_id": 123,
    "user_id": 456,
    "latitude": 39.9042,
    "longitude": 116.4074,
    "accuracy": 10,
    "heading": 45,
    "speed": 15
  }
}

// 心跳消息
{
  "type": "ping"
}

// 心跳响应
{
  "type": "pong",
  "timestamp": "2024-06-30T10:00:00Z"
}

// 错误消息
{
  "type": "error",
  "timestamp": "2024-06-30T10:00:00Z",
  "error": {
    "code": "INVALID_MESSAGE_FORMAT",
    "message": "Message format is invalid",
    "details": {
      "expected_fields": ["type", "data"]
    }
  }
}
```

### 消息类型定义
```yaml
系统消息:
  - auth: 认证请求
  - auth_response: 认证响应
  - ping: 心跳检测
  - pong: 心跳响应
  - error: 错误消息
  - disconnect: 断开连接

通知消息:
  - notification: 一般通知
  - ride_request: 拼车请求
  - ride_update: 拼车状态更新
  - activity_reminder: 活动提醒
  - system_announcement: 系统公告

聊天消息:
  - chat_message: 聊天消息
  - typing_indicator: 正在输入
  - message_read: 消息已读
  - user_online: 用户上线
  - user_offline: 用户下线

实时数据:
  - location_update: 位置更新
  - status_change: 状态变更
  - live_stats: 实时统计
  - market_update: 市场更新
```

### 错误处理
```javascript
// WebSocket错误处理
const websocket = new WebSocket('wss://api.campusride.com/ws/v1/notifications');

websocket.onerror = (error) => {
  console.error('WebSocket error:', error);
  // 实现重连逻辑
  reconnectWithBackoff();
};

websocket.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
  
  // 正常关闭码
  if (event.code === 1000) {
    console.log('Connection closed normally');
    return;
  }
  
  // 异常关闭，尝试重连
  if (event.code !== 1001) { // 1001: 客户端主动关闭
    reconnectWithBackoff();
  }
};

// 指数退避重连
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function reconnectWithBackoff() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('Max reconnection attempts reached');
    return;
  }
  
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  
  setTimeout(() => {
    console.log(`Reconnecting... attempt ${reconnectAttempts + 1}`);
    reconnectAttempts++;
    connect();
  }, delay);
}

function connect() {
  const ws = new WebSocket('wss://api.campusride.com/ws/v1/notifications');
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    reconnectAttempts = 0; // 重置重连计数
    
    // 发送认证
    ws.send(JSON.stringify({
      type: 'auth',
      token: getAuthToken()
    }));
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleMessage(message);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  };
}
```

---

## 📋 API标准检查清单

### 设计阶段检查
- [ ] URL命名符合RESTful规范
- [ ] HTTP方法使用正确
- [ ] 请求响应格式统一
- [ ] 状态码使用标准
- [ ] 认证机制设计完整
- [ ] 参数验证规则明确

### 开发阶段检查
- [ ] 输入验证完整实现
- [ ] 错误处理统一规范
- [ ] 分页功能正确实现
- [ ] 版本控制机制完善
- [ ] 安全措施充分落实
- [ ] 性能优化策略应用

### 测试阶段检查
- [ ] API文档准确完整
- [ ] 接口测试覆盖全面
- [ ] 错误场景测试充分
- [ ] 性能基准测试通过
- [ ] 安全测试验证完成
- [ ] 跨模块集成测试成功

### 发布前检查
- [ ] OpenAPI文档生成
- [ ] 示例代码提供完整
- [ ] 迁移指南编写清晰
- [ ] 监控告警配置完成
- [ ] 日志记录规范实施
- [ ] 生产环境配置验证

---

**文档版本**: v1.0  
**最后更新**: 2024-06-30  
**维护人**: Claude Code & Cursor AI  
**审核状态**: 待审核  

---

*本规范确保API接口的一致性、可维护性和可扩展性，为前后端协作提供标准化指导。*