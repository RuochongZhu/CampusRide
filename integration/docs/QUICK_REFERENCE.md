# 🚀 CampusRide 快速参考

## ⚡ 一分钟快速启动

```bash
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide
./server-manager.sh start
```

访问: http://localhost:3000

---

## 🔑 必须替换的配置

编辑: `integration/campusride-backend/.env`

```env
# 1. Supabase (https://supabase.com/dashboard → Settings → API)
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# 2. Resend (https://resend.com/api-keys)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@你的域名.com

# 3. JWT Secret (生成随机64位字符串)
JWT_SECRET=随机长字符串
```

---

## 📊 当前数据库表

### 已创建 ✅
- `users` - 用户
- `marketplace_items` - 商品
- `item_favorites` - 收藏
- `point_rules` - 积分规则
- `point_transactions` - 积分记录

### 需要创建 ⏳ (Carpooling)
- `rides` - 拼车行程
- `ride_bookings` - 拼车预订

SQL文件位置: 见 `PROJECT_HANDOVER.md`

---

## 🛠️ 常用命令

```bash
# 启动服务
./server-manager.sh start

# 停止服务
./server-manager.sh stop

# 重启并清理缓存
./server-manager.sh restart

# 查看状态
./server-manager.sh status

# 查看日志
./server-manager.sh logs
./server-manager.sh logs backend
./server-manager.sh logs frontend
```

---

## 📁 关键文件位置

### 前端
- 页面: `integration/src/views/`
- API调用: `integration/src/utils/api.js`
- 路由: `integration/src/router/index.js`

### 后端
- 控制器: `integration/campusride-backend/src/controllers/`
- 路由: `integration/campusride-backend/src/routes/`
- 配置: `integration/campusride-backend/.env`

---

## 🎯 下一步开发 Carpooling

1. 在 Supabase 创建 `rides` 和 `ride_bookings` 表
2. 参考 `marketplace.controller.js` 创建 `rideshare.controller.js`
3. 参考 `MarketplaceView.vue` 创建 `RideshareView.vue`
4. 在 `api.js` 添加 rideshareAPI

详见: `PROJECT_HANDOVER.md`

---

## 🔍 调试技巧

```bash
# 查看后端实时日志
tail -f /tmp/backend.log

# 查看前端实时日志
tail -f /tmp/frontend.log

# 测试后端健康
curl http://localhost:3001/api/v1/health

# 测试API (需要登录后获取token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/v1/marketplace/items
```

---

## 📚 完整文档

详细信息请查看: **PROJECT_HANDOVER.md**
