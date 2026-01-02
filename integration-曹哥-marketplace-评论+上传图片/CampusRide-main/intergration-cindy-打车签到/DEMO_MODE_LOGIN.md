# 🎭 演示模式已启用！

## ✅ 问题已解决！

由于 Supabase 项目无法连接，我已经启用了**演示模式**（内存数据库）。

现在你可以立即登录和使用所有功能！

---

## 🚀 立即登录

### 步骤 1：等待后端重启

后端服务器应该会自动重启（nodemon检测到配置变化）。

在终端看到：
```
🎭 启动演示模式（内存数据库）
🎭 初始化演示模式数据库...
✅ 测试用户已创建
📧 Email: demo@cornell.edu
🔑 Password: demo1234
```

### 步骤 2：打开浏览器

访问：**http://localhost:3000/login**

### 步骤 3：使用测试账号登录

```
📧 邮箱: demo@cornell.edu
🔑 密码: demo1234
```

### 步骤 4：成功登录！🎉

---

## 💡 演示模式说明

### ✅ 可以做什么

- ✅ 登录/登出
- ✅ 发布拼车行程
- ✅ 搜索拼车
- ✅ 预订座位
- ✅ 测试所有前端功能
- ✅ 测试 Google Maps 地址自动完成
- ✅ 查看个人资料

### ⚠️ 注意事项

- 📝 数据存储在内存中
- 🔄 重启后端后数据会清空
- 🎭 仅用于演示和开发
- 💾 不适合生产环境

---

## 🔄 如何切换回真实数据库

当 Supabase 准备好后：

### 1. 编辑 .env 文件

```bash
cd campusride-backend
# 编辑 .env 文件，将以下行改为:
USE_DEMO_MODE=false
```

### 2. 确保 Supabase 可访问

```bash
node scripts/check-supabase-now.js
```

### 3. 创建数据库表

在 Supabase Dashboard 的 SQL Editor 执行 `schema.sql`

### 4. 创建真实测试用户

```bash
node scripts/create-demo-user.js
```

### 5. 重启后端

后端会自动重启并连接到真实数据库

---

## 🧪 测试功能

登录后试试这些功能：

### 1. 发布拼车

1. 进入 Rideshare 页面
2. 切换到 "Driver" 模式
3. 填写行程信息：
   - Origin: 输入 "cornell" （测试地址自动完成）
   - Destination: 输入 "new york"
   - 日期、时间、座位数、价格
4. 点击 "Post Trip"

### 2. 搜索拼车

1. 切换到 "Passenger" 模式
2. 输入搜索条件
3. 点击 "Find Rides"
4. 查看刚才发布的行程

### 3. Google Maps 自动完成

在地址输入框输入：
- `corn` → 应该看到 Cornell University
- `cayu` → 应该看到 Cayuga Lake
- `new y` → 应该看到 New York

---

## ❓ 遇到问题？

### 后端没有重启？

手动重启：
```bash
# 在后端终端按 Ctrl+C
# 然后运行：
cd campusride-backend
npm run dev
```

### 还是无法登录？

检查终端输出，应该看到：
```
🎭 启动演示模式（内存数据库）
✅ 测试用户已创建
```

如果没看到，运行：
```bash
cd campusride-backend
cat .env | grep DEMO
# 应该显示: USE_DEMO_MODE=true
```

### 需要更多测试用户？

告诉我，我可以帮你添加更多演示用户！

---

## 🎯 总结

✅ **演示模式已启用**  
✅ **无需等待 Supabase**  
✅ **立即可以登录使用**  
✅ **所有功能都可测试**  

**现在就去登录吧！** 🚀

```
http://localhost:3000/login

📧 demo@cornell.edu
🔑 demo1234
```


