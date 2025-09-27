# CampusRide API 端点列表

## 基础信息
- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

## 认证相关 API

### 用户注册
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "student_id": "string",
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string",
  "university": "string",
  "major": "string"
}
```

### 用户登录
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

### 邮箱验证
```
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "string"
}
```

### 重新发送验证邮件
```
POST /api/v1/auth/resend-verification
Content-Type: application/json

{
  "email": "string"
}
```

### 忘记密码
```
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "string"
}
```

### 重置密码
```
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "string",
  "new_password": "string"
}
```

### 刷新Token
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "string"
}
```

### 用户登出
```
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

## 用户管理 API

### 获取当前用户信息
```
GET /api/v1/users/me
Authorization: Bearer <token>
```

### 获取指定用户信息
```
GET /api/v1/users/:userId
Authorization: Bearer <token>
```

### 更新当前用户信息
```
PUT /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "string",
  "last_name": "string",
  "university": "string",
  "major": "string",
  "avatar_url": "string"
}
```

### 删除当前用户账户
```
DELETE /api/v1/users/me
Authorization: Bearer <token>
```

## 积分系统 API

### 奖励积分
```
POST /api/v1/points/award
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "string",
  "points": "number (optional)",
  "ruleType": "string (optional)",
  "source": "string (optional)",
  "reason": "string (optional)",
  "metadata": "object (optional)",
  "multiplier": "number (optional)"
}
```

### 扣除积分
```
POST /api/v1/points/deduct
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "string",
  "points": "number",
  "reason": "string (optional)",
  "source": "string (optional)",
  "metadata": "object (optional)"
}
```

### 获取当前用户积分
```
GET /api/v1/points/me
Authorization: Bearer <token>
```

### 获取指定用户积分
```
GET /api/v1/points/:userId
Authorization: Bearer <token>
```

### 获取积分交易历史
```
GET /api/v1/points/transactions/me
Authorization: Bearer <token>
Query Parameters:
- limit: number (1-100, default: 20)
- offset: number (default: 0)
- transactionType: "earned" | "deducted"
- source: string
- startDate: ISO8601 string
- endDate: ISO8601 string
```

### 获取积分统计
```
GET /api/v1/points/statistics/me
Authorization: Bearer <token>
Query Parameters:
- period: "week" | "month" | "year" (default: "month")
```

### 获取积分规则
```
GET /api/v1/points/rules
```

## 排行榜 API

### 获取排行榜
```
GET /api/v1/leaderboard
Query Parameters:
- category: "overall" | "academic" | "sports" | "social" | "volunteer" | "career" | "cultural" | "technology" (default: "overall")
- timePeriod: "week" | "month" | "all" (default: "week")
- limit: number (1-100, default: 50)
- offset: number (default: 0)
```

### 获取当前用户排名
```
GET /api/v1/leaderboard/me
Authorization: Bearer <token>
Query Parameters:
- category: string (default: "overall")
- timePeriod: "week" | "month" | "all" (default: "week")
```

### 获取指定用户排名
```
GET /api/v1/leaderboard/:userId
Authorization: Bearer <token>
Query Parameters:
- category: string (default: "overall")
- timePeriod: "week" | "month" | "all" (default: "week")
```

### 获取排行榜统计
```
GET /api/v1/leaderboard/stats
Authorization: Bearer <token>
```

### 更新排行榜 (管理员)
```
POST /api/v1/leaderboard/update
Authorization: Bearer <token>
```

## 市场交易 API (部分实现)

### 获取商品列表
```
GET /api/v1/marketplace/items
Query Parameters:
- category: string
- limit: number
- offset: number
```

### 发布商品
```
POST /api/v1/marketplace/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "condition": "string"
}
```

### 获取商品详情
```
GET /api/v1/marketplace/items/:id
```

### 更新商品
```
PUT /api/v1/marketplace/items/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "condition": "string"
}
```

### 删除商品
```
DELETE /api/v1/marketplace/items/:id
Authorization: Bearer <token>
```

## 拼车 API (部分实现)

### 获取拼车列表
```
GET /api/v1/rideshare/rides
Query Parameters:
- origin: string
- destination: string
- date: ISO8601 string
- limit: number
- offset: number
```

### 创建拼车
```
POST /api/v1/rideshare/rides
Authorization: Bearer <token>
Content-Type: application/json

{
  "origin": "string",
  "destination": "string",
  "departure_time": "ISO8601 string",
  "available_seats": "number",
  "price_per_seat": "number",
  "description": "string"
}
```

### 获取拼车详情
```
GET /api/v1/rideshare/rides/:id
```

### 更新拼车
```
PUT /api/v1/rideshare/rides/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "origin": "string",
  "destination": "string",
  "departure_time": "ISO8601 string",
  "available_seats": "number",
  "price_per_seat": "number",
  "description": "string"
}
```

### 删除拼车
```
DELETE /api/v1/rideshare/rides/:id
Authorization: Bearer <token>
```

## 活动 API (部分实现)

### 获取活动列表
```
GET /api/v1/activities
Query Parameters:
- category: string
- date: ISO8601 string
- limit: number
- offset: number
```

### 创建活动
```
POST /api/v1/activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "category": "string",
  "date": "ISO8601 string",
  "location": "string",
  "max_participants": "number"
}
```

### 获取活动详情
```
GET /api/v1/activities/:id
```

### 更新活动
```
PUT /api/v1/activities/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "category": "string",
  "date": "ISO8601 string",
  "location": "string",
  "max_participants": "number"
}
```

### 删除活动
```
DELETE /api/v1/activities/:id
Authorization: Bearer <token>
```

## 通知 API (部分实现)

### 获取通知列表
```
GET /api/v1/notifications
Authorization: Bearer <token>
Query Parameters:
- limit: number
- offset: number
- unread_only: boolean
```

### 标记通知为已读
```
PUT /api/v1/notifications/:id/read
Authorization: Bearer <token>
```

### 删除通知
```
DELETE /api/v1/notifications/:id
Authorization: Bearer <token>
```

## 系统 API

### 健康检查
```
GET /api/v1/health
```

### API文档
```
GET /api-docs
```

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 响应数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-19T02:55:01.394Z",
    "request_id": "req_1758248190447"
  }
}
```

## 错误码

- `1001`: TOKEN_MISSING - 缺少认证Token
- `1002`: TOKEN_INVALID - Token无效或过期
- `1003`: TOKEN_EXPIRED - Token已过期
- `1004`: ACCESS_DENIED - 访问被拒绝
- `1005`: VALIDATION_ERROR - 数据验证错误
- `1006`: DATABASE_ERROR - 数据库错误
- `1007`: EMAIL_NOT_VERIFIED - 邮箱未验证
- `1008`: USER_NOT_FOUND - 用户不存在
- `1009`: INVALID_CREDENTIALS - 无效的登录凭据
