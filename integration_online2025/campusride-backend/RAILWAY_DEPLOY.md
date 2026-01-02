# Railway 部署指南

## 重要说明
这是专门为线上部署准备的版本，已经做了以下安全优化：
- ✅ 移除了CORS中硬编码的localhost地址
- ✅ 生产环境只允许配置的FRONTEND_URL访问
- ✅ 添加了环境检测逻辑

## Railway 配置步骤

### 1. Root Directory 设置
在Railway的Settings中设置：
```
integration_online/campusride-backend
```

### 2. 环境变量配置
必须在Railway Variables中配置以下变量：

```bash
NODE_ENV=production
FRONTEND_URL=https://你的前端域名.vercel.app

SUPABASE_URL=https://jfgenxnqpuutgdnnngsl.supabase.co
SUPABASE_ANON_KEY=你的key
SUPABASE_SERVICE_KEY=你的key

JWT_SECRET=生产环境密钥
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

RESEND_API_KEY=你的key
RESEND_FROM_EMAIL=noreply@socialinteraction.club
RESEND_FROM_NAME=Campus Ride

API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. 重要：部署前必须设置FRONTEND_URL
否则CORS会阻止所有请求！
