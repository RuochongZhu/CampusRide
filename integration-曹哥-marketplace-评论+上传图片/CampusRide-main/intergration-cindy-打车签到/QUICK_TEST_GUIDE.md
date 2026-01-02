# My Trips & Rating System - 快速测试指南

## 🎯 快速开始

### 必需步骤（务必先做！）

#### 步骤 1: 在 Supabase 中创建 ratings 表

**⚠️ 这是最重要的步骤，必须先完成！**

1. 打开 Supabase Dashboard: https://imrepukmkbnsypupfxdo.supabase.co
2. 点击左侧菜单 **"SQL Editor"**
3. 点击 **"New query"**
4. 复制粘贴以下 SQL 代码:

```sql
-- 创建评分系统表
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  ratee_id UUID NOT NULL,
  role_of_rater VARCHAR(20) NOT NULL CHECK (role_of_rater IN ('driver', 'passenger')),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_rating_per_trip UNIQUE (trip_id, rater_id, ratee_id),
  CONSTRAINT no_self_rating CHECK (rater_id != ratee_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ratings_trip_id ON ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- 更新 ride_bookings 表的状态约束
ALTER TABLE ride_bookings DROP CONSTRAINT IF EXISTS ride_bookings_status_check;
ALTER TABLE ride_bookings 
ADD CONSTRAINT ride_bookings_status_check 
CHECK (status IN (
  'pending', 'confirmed', 'rejected', 'cancelled',
  'canceled_by_passenger', 'canceled_by_driver', 'completed', 'no_show'
));
```

5. 点击 **"Run"** 按钮
6. 确认看到 "Success. No rows returned"

#### 步骤 2: 验证后端已重启

后端已自动重启，验证是否运行正常:

```bash
curl http://localhost:3001/api/v1/health
```

应该返回:
```json
{"success":true,"message":"Server is running","timestamp":"..."}
```

---

## 🧪 功能测试

### 自动测试（推荐）

运行自动测试脚本:

```bash
# 在项目根目录执行
bash test-my-trips-system.sh
```

这个脚本会自动测试:
- ✅ 后端健康检查
- ✅ 用户登录
- ✅ My Trips API
- ✅ 创建行程
- ✅ 评分 API
- ✅ 通知系统

### 手动测试

#### 测试 1: My Trips API

```bash
# 1. 登录获取 token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@cornell.edu","password":"alice1234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# 2. 获取 My Trips
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/carpooling/my-trips \
  | python3 -m json.tool
```

**预期结果:** 返回 Alice 作为 driver 和 passenger 的所有行程

**检查点:**
- ✅ `role` 字段为 "driver" 或 "passenger"
- ✅ driver 行程包含 `bookings` 数组
- ✅ passenger 行程包含 `booking_id` 和 `booking_status`

#### 测试 2: 乘客取消预订

**前提:** 需要一个已存在的预订

```bash
# 假设有一个预订 ID
BOOKING_ID="your-booking-id-here"

# 取消预订
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/carpooling/bookings/$BOOKING_ID \
  | python3 -m json.tool
```

**预期结果:**
```json
{
  "success": true,
  "message": "Booking canceled"
}
```

**检查点:**
- ✅ 预订状态变为 `canceled_by_passenger`
- ✅ 如果之前是 `confirmed`，座位数正确回退
- ✅ 司机收到通知

#### 测试 3: 评分功能

**注意:** 只能在行程开始后评分

```bash
# 假设有一个已开始的行程
TRIP_ID="past-trip-id-here"
DRIVER_ID="driver-user-id-here"

# 创建评分
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "'$TRIP_ID'",
    "rateeId": "'$DRIVER_ID'",
    "score": 5,
    "comment": "Excellent driver!"
  }' \
  http://localhost:3001/api/v1/ratings \
  | python3 -m json.tool
```

**预期结果:**
```json
{
  "success": true,
  "data": {
    "rating": {
      "id": "...",
      "score": 5,
      "comment": "Excellent driver!",
      ...
    }
  },
  "message": "Thanks for your rating"
}
```

**检查点:**
- ✅ 评分创建成功
- ✅ 被评分者收到通知
- ✅ 再次评分会返回 409 错误

#### 测试 4: 获取用户平均评分

```bash
USER_ID="user-id-here"

curl http://localhost:3001/api/v1/ratings/average/$USER_ID \
  | python3 -m json.tool
```

**预期结果:**
```json
{
  "success": true,
  "data": {
    "averageScore": 4.7,
    "totalRatings": 15
  }
}
```

---

## 🎨 前端集成测试

### 测试 My Trips 页面

1. 在浏览器中打开前端: http://localhost:5173
2. 登录为 Alice
3. 导航到 "My Trips" 页面

**检查点:**
- ✅ 页面标题为 "My Trips"（不是 "My Bookings"）
- ✅ 每个行程卡片右上角显示 "Driver" 或 "Passenger" 徽章
- ✅ Driver 行程显示乘客列表
- ✅ Passenger 行程显示司机信息

### 测试取消功能

1. 找到一个状态为 `confirmed` 的 passenger 行程
2. 检查是否显示 "Cancel" 按钮
3. 点击 "Cancel"
4. 确认弹窗后，检查:
   - ✅ 行程状态变为 "Canceled"
   - ✅ "Cancel" 按钮消失
   - ✅ 司机收到通知（在通知中心）

### 测试评分功能

**模拟行程已开始:**

由于无法快速让时间流逝，你需要:
1. 在数据库中创建一个 `departure_time` 为过去时间的测试行程
2. 或者等待真实行程开始

**测试步骤:**
1. 找到一个已开始的行程
2. 检查 "Cancel" 按钮是否消失
3. 检查是否显示 "Rate" 按钮
4. 点击 "Rate" 打开评分弹窗
5. 选择星级（1-5）
6. 输入评论（可选）
7. 点击 "Submit"
8. 检查:
   - ✅ 显示成功消息 "Thanks for your rating"
   - ✅ "Rate" 按钮变为 "View Rating"
   - ✅ 被评分者收到通知

---

## 📋 完整功能清单

### 已实现的功能

| 功能 | 状态 | 说明 |
|------|------|------|
| My Trips 统一视图 | ✅ | 合并 driver 和 passenger 视角 |
| 角色徽章显示 | ✅ | 显示 "Driver" 或 "Passenger" |
| 乘客取消预订 | ✅ | 行程开始前可取消 |
| 司机取消预订 | ✅ | 行程开始前可取消某个乘客 |
| 座位自动回退 | ✅ | 取消后自动更新座位数 |
| 行程状态更新 | ✅ | full ↔ active 自动切换 |
| 取消通知 | ✅ | 自动发送通知给受影响方 |
| 评分功能 | ✅ | 行程开始后可评分 |
| 司机评价乘客 | ✅ | 1-5星 + 可选评论 |
| 乘客评价司机 | ✅ | 1-5星 + 可选评论 |
| 防重复评分 | ✅ | UNIQUE 约束 |
| 防自我评分 | ✅ | CHECK 约束 |
| 评分通知 | ✅ | 收到评分时通知 |
| 平均评分统计 | ✅ | 显示用户平均分和总评价数 |

### API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/carpooling/my-trips` | GET | 获取所有行程 |
| `/carpooling/bookings/:id` | DELETE | 乘客取消预订 |
| `/carpooling/bookings/:id/cancel-by-driver` | POST | 司机取消预订 |
| `/ratings` | POST | 创建评分 |
| `/ratings/my` | GET | 获取我的评分状态 |
| `/ratings/average/:userId` | GET | 获取用户平均评分 |
| `/ratings/trip/:tripId` | GET | 获取行程所有评分 |

---

## 🐛 常见问题

### Q: My Trips API 返回 500 错误

**可能原因:** ratings 表未创建

**解决方案:**
1. 检查 Supabase SQL Editor 中是否已执行 ratings 表创建脚本
2. 验证表是否存在: `SELECT * FROM ratings LIMIT 1;`

### Q: 评分 API 返回 409 "Trip not started"

**原因:** 行程的 `departure_time` 还没到

**解决方案:**
1. 创建一个 `departure_time` 为过去时间的测试行程
2. 或者等待真实行程开始

### Q: 取消预订失败

**可能原因:**
1. 行程已开始
2. 预订状态不是 `pending` 或 `confirmed`

**解决方案:**
1. 检查行程 `departure_time`
2. 检查预订 `status`

### Q: 前端显示不正确

**可能原因:** 前端代码未更新

**解决方案:**
1. 确认 `src/utils/api.js` 已更新
2. 重启前端开发服务器
3. 清除浏览器缓存

---

## 📚 相关文档

- **完整文档:** `MY_TRIPS_AND_RATING_SYSTEM.md`
- **安装指南:** `INSTALLATION_GUIDE.md`
- **测试指南:** 本文档

---

## ✅ 测试完成标志

完成所有测试后，请确认:

- [ ] ratings 表已在 Supabase 中创建
- [ ] 后端服务运行正常
- [ ] My Trips API 返回正确数据
- [ ] 可以取消预订（行程开始前）
- [ ] 可以创建评分（行程开始后）
- [ ] 通知系统正常工作
- [ ] 前端 UI 正确显示（如果已实现）

---

**准备好测试了吗？开始吧！** 🚀

如有问题，请查看完整文档或检查后端日志。




