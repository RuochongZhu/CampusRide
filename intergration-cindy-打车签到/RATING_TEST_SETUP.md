# 🎯 评分功能测试设置指南

## ⚠️ 重要说明

后端验证**不允许创建过去时间的行程**，这是一个安全特性。

要测试评分功能，你有以下几个选择：

---

## 方法 1: 修改现有行程时间（推荐）⭐

### 步骤：

1. **登录 Supabase**
   - 访问: https://supabase.com/dashboard
   - 选择你的项目: `imrepukmkbnsypupfxdo`

2. **打开 SQL Editor**
   - 左侧菜单 → SQL Editor
   - 点击 "New query"

3. **执行 SQL 更新**

```sql
-- 查找现有的行程
SELECT id, title, departure_time, status
FROM rides
WHERE driver_id = (SELECT id FROM users WHERE email = 'alice@cornell.edu')
ORDER BY created_at DESC
LIMIT 5;

-- 选择一个行程ID，将其时间改为1小时前
UPDATE rides
SET departure_time = NOW() - INTERVAL '1 hour'
WHERE id = '<your-ride-id>';

-- 验证更新
SELECT id, title, departure_time, status
FROM rides
WHERE id = '<your-ride-id>';
```

4. **验证预订状态**

```sql
-- 检查该行程的预订
SELECT 
    rb.id as booking_id,
    rb.status,
    u.email as passenger_email
FROM ride_bookings rb
JOIN users u ON rb.passenger_id = u.id
WHERE rb.ride_id = '<your-ride-id>';

-- 如果需要，将预订状态改为 confirmed
UPDATE ride_bookings
SET status = 'confirmed'
WHERE ride_id = '<your-ride-id>' AND status = 'pending';
```

5. **刷新浏览器测试**
   - `Command/Ctrl + Shift + R`
   - 进入 My Trips 查看该行程
   - 应该显示评分按钮了！

---

## 方法 2: 创建很近未来的行程

### 步骤：

1. **创建一个 5 分钟后的行程**
   - 登录司机账户 (alice@cornell.edu)
   - 发布新行程
   - 设置 departure_time 为当前时间 + 5 分钟

2. **乘客预订**
   - 登录乘客账户 (demo@cornell.edu)
   - 预订该行程

3. **司机接受**
   - 切换回司机账户
   - 接受预订

4. **等待 5 分钟**
   - ☕ 喝杯咖啡
   - 5 分钟后刷新页面
   - 评分按钮应该出现了！

---

## 方法 3: 使用已有的过去行程

如果你之前创建过测试行程，可以直接使用：

### 查找过去的行程

```sql
-- 在 Supabase SQL Editor 中执行：
SELECT 
    r.id,
    r.title,
    r.departure_time,
    r.status,
    COUNT(rb.id) as booking_count
FROM rides r
LEFT JOIN ride_bookings rb ON r.id = rb.ride_id
WHERE r.departure_time < NOW()
GROUP BY r.id
ORDER BY r.departure_time DESC
LIMIT 10;
```

### 确保有确认的预订

```sql
-- 检查并更新预订状态
UPDATE ride_bookings
SET status = 'confirmed'
WHERE ride_id = '<your-ride-id>'
  AND passenger_id = (SELECT id FROM users WHERE email = 'demo@cornell.edu');
```

---

## 🧪 完整测试流程（方法 1）

### 准备数据（5 分钟）

1. **创建新行程**（司机 Alice）
   ```
   登录: alice@cornell.edu / alice1234
   Carpooling → Driver → Post Ride
   Title: "Rating Test - Cornell to NYC"
   From: Cornell University
   To: New York City
   Date: 今天
   Time: 当前时间 + 10 分钟
   Seats: 3
   Price: $35
   ```

2. **预订行程**（乘客 Demo）
   ```
   登录: demo@cornell.edu / demo1234
   Carpooling → Passenger → Available Rides
   找到 "Rating Test - Cornell to NYC"
   点击 "Book Seat"
   提交预订
   ```

3. **接受预订**（司机 Alice）
   ```
   登录: alice@cornell.edu / alice1234
   点击通知铃铛 🔔
   找到 Demo 的预订请求
   点击 "Accept"
   ```

4. **修改时间**（Supabase）
   ```sql
   -- 在 Supabase SQL Editor 执行：
   
   -- 1. 找到刚创建的行程ID
   SELECT id, title, departure_time 
   FROM rides 
   WHERE title LIKE '%Rating Test%'
   ORDER BY created_at DESC 
   LIMIT 1;
   
   -- 2. 复制 id，然后修改时间
   UPDATE rides
   SET departure_time = NOW() - INTERVAL '1 hour'
   WHERE id = '<刚才复制的id>';
   ```

5. **测试评分**
   ```
   刷新浏览器 (Cmd/Ctrl + Shift + R)
   
   乘客测试:
   - 登录: demo@cornell.edu
   - My Trips → 点击该行程
   - 应该看到黄色 "Rate Driver" 按钮
   - 点击评分！
   
   司机测试:
   - 登录: alice@cornell.edu
   - My Trips → 点击该行程
   - 应该看到 "Rate Passengers" 部分
   - 点击 Demo 旁边的 "Rate" 按钮
   - 点击评分！
   ```

---

## 🔍 验证评分数据

### 检查评分是否保存

```sql
-- 在 Supabase SQL Editor 执行：
SELECT 
    r.id,
    r.score,
    r.comment,
    r.role_of_rater,
    u1.email as rater_email,
    u2.email as ratee_email,
    r.created_at
FROM ratings r
JOIN users u1 ON r.rater_id = u1.id
JOIN users u2 ON r.ratee_id = u2.id
ORDER BY r.created_at DESC
LIMIT 10;
```

### 检查通知是否发送

```sql
SELECT 
    n.type,
    n.message,
    n.is_read,
    u.email as recipient_email,
    n.created_at
FROM notifications n
LEFT JOIN users u ON (
    CASE 
        WHEN n.type = 'rating_received' THEN n.passenger_id
        ELSE n.driver_id
    END = u.id
)
WHERE n.type = 'rating_received'
ORDER BY n.created_at DESC
LIMIT 10;
```

---

## 📊 SQL 快速查询集合

### 查看所有测试账户

```sql
SELECT id, email, first_name, last_name
FROM users
WHERE email IN ('alice@cornell.edu', 'demo@cornell.edu');
```

### 查看测试行程

```sql
SELECT 
    r.id,
    r.title,
    r.departure_time,
    r.status,
    u.email as driver_email
FROM rides r
JOIN users u ON r.driver_id = u.id
WHERE u.email = 'alice@cornell.edu'
ORDER BY r.created_at DESC
LIMIT 5;
```

### 查看测试预订

```sql
SELECT 
    rb.id,
    rb.status,
    rb.seats_booked,
    r.title,
    u.email as passenger_email
FROM ride_bookings rb
JOIN rides r ON rb.ride_id = r.id
JOIN users u ON rb.passenger_id = u.id
WHERE u.email = 'demo@cornell.edu'
ORDER BY rb.created_at DESC
LIMIT 5;
```

### 创建完整测试场景（所有SQL）

```sql
-- ==== 完整测试数据创建 ====

-- 1. 创建一个过去的测试行程（需要在 rides 表中手动插入）
-- 注意：这需要禁用触发器或直接在数据库操作

-- 2. 或者更简单：修改现有行程
UPDATE rides
SET departure_time = NOW() - INTERVAL '2 hours'
WHERE id IN (
    SELECT r.id
    FROM rides r
    JOIN users u ON r.driver_id = u.id
    WHERE u.email = 'alice@cornell.edu'
    ORDER BY r.created_at DESC
    LIMIT 1
);

-- 3. 确保有确认的预订
UPDATE ride_bookings
SET status = 'confirmed'
WHERE ride_id IN (
    SELECT r.id
    FROM rides r
    JOIN users u ON r.driver_id = u.id
    WHERE u.email = 'alice@cornell.edu'
    ORDER BY r.created_at DESC
    LIMIT 1
)
AND passenger_id = (
    SELECT id FROM users WHERE email = 'demo@cornell.edu'
);

-- 4. 验证设置
SELECT 
    r.id as ride_id,
    r.title,
    r.departure_time,
    r.status as ride_status,
    rb.id as booking_id,
    rb.status as booking_status,
    NOW() as current_time,
    CASE 
        WHEN r.departure_time < NOW() THEN '✅ 可以评分'
        ELSE '❌ 行程未开始'
    END as can_rate
FROM rides r
LEFT JOIN ride_bookings rb ON r.id = rb.ride_id
WHERE r.driver_id = (SELECT id FROM users WHERE email = 'alice@cornell.edu')
ORDER BY r.created_at DESC
LIMIT 1;
```

---

## ✅ 测试前检查清单

在测试评分功能前，确保：

- [ ] 后端服务运行正常 (http://localhost:3001)
- [ ] 前端服务运行正常 (http://localhost:3002)
- [ ] 浏览器已强制刷新 (Cmd/Ctrl + Shift + R)
- [ ] 存在一个 `departure_time < NOW()` 的行程
- [ ] 该行程有至少一个 `status='confirmed'` 的预订
- [ ] 乘客和司机账户都能登录
- [ ] 在 My Trips 中能看到该行程

---

## 🐛 常见问题

### Q: 为什么看不到评分按钮？

**检查清单：**
```sql
-- 运行这个诊断查询
SELECT 
    r.id,
    r.title,
    r.departure_time,
    NOW() as current_time,
    r.departure_time < NOW() as is_started,
    rb.status,
    CASE 
        WHEN r.departure_time >= NOW() THEN '行程未开始'
        WHEN rb.status != 'confirmed' THEN '预订未确认'
        ELSE '✅ 应该可以评分'
    END as diagnosis
FROM rides r
LEFT JOIN ride_bookings rb ON r.id = rb.ride_id
WHERE r.id = '<your-ride-id>';
```

### Q: 如何重置评分（重新测试）？

```sql
-- 删除所有评分（小心使用！）
DELETE FROM ratings
WHERE trip_id = '<your-ride-id>';

-- 或只删除特定用户的评分
DELETE FROM ratings
WHERE rater_id = (SELECT id FROM users WHERE email = 'demo@cornell.edu')
  AND trip_id = '<your-ride-id>';
```

---

## 🎉 准备好了吗？

按照上面任一方法准备好测试数据后：

1. **刷新浏览器** (Cmd/Ctrl + Shift + R)
2. **登录测试账户**
3. **进入 My Trips**
4. **点击已开始的行程**
5. **查看评分按钮** ⭐

如果看到黄色的 "Rate" 按钮，恭喜！可以开始测试了！

---

**祝测试顺利！** ⭐⭐⭐⭐⭐







