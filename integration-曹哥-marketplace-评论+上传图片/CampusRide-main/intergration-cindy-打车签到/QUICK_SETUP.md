# 🚀 快速设置指南

## 📊 当前进度

- ✅ 前端和后端服务器运行中
- ✅ Supabase 项目已创建
- ✅ API 密钥已配置
- ⏳ 等待 Supabase 项目初始化（2-5分钟）

---

## ⏱️ 现在：等待2分钟

**喝杯水 💧 或休息一下！**

新创建的 Supabase 项目需要几分钟来初始化服务器和DNS。

---

## 📋 2分钟后：按照以下步骤操作

### 步骤 1：检查 Supabase 是否就绪

```bash
cd campusride-backend
node scripts/check-supabase-now.js
```

**如果看到：** `🎉 太好了！Supabase 项目已经可以访问了！`  
→ 继续下一步

**如果看到：** `⏳ 项目还在初始化中...`  
→ 再等2分钟，然后重新运行检查

---

### 步骤 2：创建数据库表

#### 方法 A：在 Supabase Dashboard（推荐）

1. 打开：https://app.supabase.com
2. 进入你的项目
3. 左侧菜单 → **SQL Editor**
4. 点击 **"+ New query"**
5. 打开文件：`campusride-backend/src/database/schema.sql`
6. 复制全部内容粘贴到 SQL Editor
7. 点击 **"Run"** 执行
8. 等待几秒钟直到显示 "Success"

#### 方法 B：使用命令行（如果支持）

```bash
node scripts/create-tables.js
```

---

### 步骤 3：创建测试账号

```bash
node scripts/create-demo-user.js
```

**预期输出：**
```
✅ Demo user created successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email:    demo@cornell.edu
Password: demo1234
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 步骤 4：重启后端（如需要）

后端应该自动重启。如果没有：

```bash
# 按 Ctrl+C 停止
# 然后重新启动
cd campusride-backend
npm run dev
```

---

### 步骤 5：登录！🎉

1. 打开浏览器：**http://localhost:3000/login**
2. 输入测试账号：
   ```
   Email: demo@cornell.edu
   Password: demo1234
   ```
3. 点击 **"Sign in"**

**成功！** 你现在可以：
- ✅ 发布拼车
- ✅ 搜索拼车
- ✅ 测试地址自动完成
- ✅ 使用所有功能

---

## 🎯 完整命令序列（复制粘贴）

等 Supabase 就绪后，依次运行：

```bash
# 1. 检查状态
cd campusride-backend
node scripts/check-supabase-now.js

# 2. 创建测试用户（表已在Dashboard创建后）
node scripts/create-demo-user.js

# 3. 测试登录
# 打开 http://localhost:3000/login
# Email: demo@cornell.edu
# Password: demo1234
```

---

## 📱 测试功能清单

登录后测试：

### Rideshare（拼车）
1. 切换到 "Driver" 模式
2. 输入地址（测试 Google Maps 自动完成）：
   - Origin: 输入 "corn" → 选择 "Cornell University"
   - Destination: 输入 "new y" → 选择 "New York"
3. 选择日期和时间
4. 设置座位数和价格
5. 点击 "Post Trip"

### Google Maps 自动完成
- 在地址输入框输入任意地址
- 应该看到下拉建议列表
- 选择一个地址自动填充

---

## ⏰ 时间线总结

| 时间点 | 操作 |
|--------|------|
| **现在** | ✅ 已完成配置 |
| **+2分钟** | 检查 Supabase 状态 |
| **+3分钟** | 创建数据库表 |
| **+4分钟** | 创建测试用户 |
| **+5分钟** | 🎉 开始使用！ |

---

## ❓ 遇到问题？

### Supabase 一直无法访问
- 检查 Dashboard 项目状态
- 确认邮箱已验证
- 尝试重新创建项目

### 无法创建表
- 确保在 SQL Editor 中执行完整的 schema.sql
- 检查是否有错误提示
- 逐个表创建（users 表最重要）

### 无法创建测试用户
- 确保 users 表已创建
- 检查 Supabase 连接
- 查看错误信息

### 无法登录
- 确认测试用户已创建
- 检查密码是否正确：`demo1234`
- 查看浏览器控制台错误

---

## 📞 需要帮助？

把错误信息告诉我，我会帮你解决！

---

**🎯 目标：5分钟内开始使用完整功能！**


