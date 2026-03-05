# Resend 邮箱验证配置指南

## 📧 概述

CampusRide 使用 Resend 作为邮件服务提供商，用于发送邮箱验证和密码重置邮件。

---

## 🔧 配置步骤

### 1. 确认环境变量配置

在 `campusride-backend/.env` 文件中确认以下配置：

```env
# Resend邮件配置
RESEND_API_KEY=re_QXsB8Ehe_N2ZK6R1KLzLtFWP5PtixdwQ8
RESEND_FROM_EMAIL=noreply@socialinteraction.club
RESEND_FROM_NAME=Campus Ride (Dev)
FRONTEND_URL=http://localhost:5173
```

### 2. 验证 Resend API Key

登录 [Resend Dashboard](https://resend.com/api-keys) 确认：
- ✅ API Key 是否有效
- ✅ 域名 `socialinteraction.club` 是否已验证
- ✅ 发件邮箱 `noreply@socialinteraction.club` 是否可用

---

## 🚀 如何使用

### 方法1: 使用测试脚本（推荐）

```bash
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration
./test-email-verification.sh
```

脚本会自动：
1. 生成随机测试邮箱（test{随机数}@cornell.edu）
2. 注册新用户
3. 触发验证邮件发送
4. 显示验证链接（从后端日志中获取）

### 方法2: 手动注册测试

1. **打开前端**: http://localhost:5173/register

2. **填写注册表单**:
   - 邮箱: 你的真实Cornell邮箱（如 `abc123@cornell.edu`）
   - 密码: 至少8位
   - 昵称: 任意

3. **查看后端日志**:
   ```bash
   # 在后端服务运行的终端查看日志
   # 会显示类似:
   📧 Attempting to send verification email to abc123@cornell.edu
   🔗 Verification URL: http://localhost:5173/verify-email/{TOKEN}
   ✅ Verification email sent successfully
   ```

4. **验证邮箱**:
   - 如果是真实Cornell邮箱：直接查收邮件点击链接
   - 如果是测试邮箱：复制后端日志中的验证链接，在浏览器中访问

---

## 📬 邮件发送流程

```
用户注册
  ↓
生成验证Token (32字节随机hex)
  ↓
保存到Supabase users表
  ↓
调用Resend API发送邮件
  ↓
用户收到邮件
  ↓
点击验证链接: /verify-email/{TOKEN}
  ↓
前端调用后端验证接口
  ↓
更新 email_verified = true
  ↓
验证完成✅
```

---

## 🔍 调试步骤

### 1. 检查后端日志

启动后端时会显示：
```
📧 Email Service Initialized:
- API Key present: ✅
- Frontend URL: http://localhost:5173
- From Email: noreply@socialinteraction.club
```

### 2. 检查Resend控制台

访问 [Resend Emails Dashboard](https://resend.com/emails)：
- 查看最近发送的邮件
- 检查发送状态（Sent/Bounced/Failed）
- 查看邮件内容预览

### 3. 检查Supabase数据库

在Supabase SQL Editor中执行：
```sql
SELECT
  email,
  email_verified,
  email_verification_token,
  email_verification_expires
FROM users
WHERE email = 'your-test-email@cornell.edu';
```

---

## 🛠️ 常见问题

### Q1: 邮件没有发送成功

**检查项**:
1. Resend API Key是否正确
2. 后端日志是否有错误信息
3. Resend控制台是否显示发送失败

**解决方案**:
```bash
# 重新检查环境变量
cd campusride-backend
cat .env | grep RESEND

# 确认API Key
# 如果API Key过期，去Resend控制台重新生成
```

### Q2: 验证链接失效

验证Token有效期为24小时。如果过期：

```bash
# 重新发送验证邮件（功能待实现）
curl -X POST http://localhost:3001/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "test@cornell.edu"}'
```

### Q3: 前端URL不正确

确保 `.env` 中的 `FRONTEND_URL` 设置正确：
```env
FRONTEND_URL=http://localhost:5173  # Vite默认端口
```

### Q4: Cornell邮箱收不到邮件

可能原因：
1. 邮件进入垃圾箱
2. Cornell邮箱服务器拦截
3. 域名信誉问题

**解决方案**:
- 检查Cornell邮箱的垃圾邮件文件夹
- 在Resend中添加DKIM/SPF记录提高信誉
- 使用测试邮箱验证基本功能

---

## 🎯 前端验证页面实现

检查前端是否有 `/verify-email/:token` 路由：

```javascript
// router/index.js
{
  path: '/verify-email/:token',
  name: 'VerifyEmail',
  component: () => import('@/views/VerifyEmailView.vue')
}
```

验证页面需要：
1. 从URL获取token
2. 调用后端API: `POST /api/v1/auth/verify-email`
3. 显示验证结果（成功/失败/已过期）
4. 引导用户登录

---

## 📝 完整API端点

### 注册
```
POST /api/v1/auth/register
Body: {
  "email": "test@cornell.edu",
  "password": "Test12345",
  "nickname": "TestUser"
}
```

### 验证邮箱
```
POST /api/v1/auth/verify-email
Body: {
  "token": "{VERIFICATION_TOKEN}"
}
```

### 重新发送验证邮件
```
POST /api/v1/auth/resend-verification
Body: {
  "email": "test@cornell.edu"
}
```

---

## ✅ 测试清单

- [ ] 环境变量配置正确
- [ ] Resend API Key有效
- [ ] 后端服务运行正常
- [ ] 前端服务运行正常
- [ ] 使用测试邮箱注册成功
- [ ] 后端日志显示邮件发送成功
- [ ] Resend控制台显示邮件已发送
- [ ] 验证链接格式正确
- [ ] 点击验证链接成功验证
- [ ] Supabase中email_verified更新为true

---

## 🔗 相关资源

- [Resend文档](https://resend.com/docs)
- [Resend API参考](https://resend.com/docs/api-reference/introduction)
- [Supabase文档](https://supabase.com/docs)

---

**最后更新**: 2025-12-29
**维护者**: Claude Code
