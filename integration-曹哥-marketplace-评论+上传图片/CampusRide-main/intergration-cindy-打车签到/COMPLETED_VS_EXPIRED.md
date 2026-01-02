# ✅ 完成 vs 过期 状态管理系统

## 🎯 核心逻辑

根据你的要求，我已经实现了更精确的状态管理：

### 状态区分

```
行程时间到达后，自动判断：

✅ 有人预订过（有 confirmed bookings）
   → status = 'completed' （已完成）
   → 🔵 蓝色标签

❌ 没人预订（无 confirmed bookings）
   → status = 'expired' （已过期）
   → ⚪ 灰色标签
```

---

## 📊 完整状态流转图

### 情况 1: 有预订的行程

```
发布行程
   ↓
status = 'active' 
🟢 进行中
   ↓
乘客预订 → 司机接受
   ↓
有 confirmed bookings
   ↓
时间到达
   ↓
自动更新
   ↓
status = 'completed'
🔵 已完成
```

### 情况 2: 无预订的行程

```
发布行程
   ↓
status = 'active'
🟢 进行中
   ↓
无人预订
   ↓
时间到达
   ↓
自动更新
   ↓
status = 'expired'
⚪ 已过期
```

### 情况 3: 满员的行程

```
发布行程
   ↓
status = 'active'
🟢 进行中
   ↓
座位全部被预订
   ↓
status = 'full'
🟠 已满员
   ↓
时间到达
   ↓
有 confirmed bookings
   ↓
status = 'completed'
🔵 已完成
```

---

## 🔍 后端实现逻辑

### 自动更新函数

```javascript
const updateExpiredRidesStatus = async () => {
  const now = new Date().toISOString();
  
  // 1. 找出所有过期的 active 行程
  const { data: expiredRides } = await supabaseAdmin
    .from('rides')
    .select('id')
    .eq('status', 'active')
    .lt('departure_time', now);
  
  if (expiredRides && expiredRides.length > 0) {
    const expiredRideIds = expiredRides.map(r => r.id);
    
    // 2. 查询这些行程中有已确认预订的
    const { data: ridesWithBookings } = await supabaseAdmin
      .from('ride_bookings')
      .select('ride_id')
      .in('ride_id', expiredRideIds)
      .eq('status', 'confirmed');
    
    const rideIdsWithBookings = [...new Set(ridesWithBookings.map(b => b.ride_id))];
    const rideIdsWithoutBookings = expiredRideIds.filter(
      id => !rideIdsWithBookings.includes(id)
    );
    
    // 3. 有预订的 → completed
    if (rideIdsWithBookings.length > 0) {
      await supabaseAdmin
        .from('rides')
        .update({ status: 'completed' })
        .in('id', rideIdsWithBookings);
    }
    
    // 4. 无预订的 → expired
    if (rideIdsWithoutBookings.length > 0) {
      await supabaseAdmin
        .from('rides')
        .update({ status: 'expired' })
        .in('id', rideIdsWithoutBookings);
    }
  }
};
```

### 触发时机

这个函数在以下时候自动执行：

1. **`getRides()`** - 查询 Available Rides 时
2. **`getMyTrips()`** - 查询 My Trips 时

---

## 🎨 前端状态显示

### 所有状态标签

| 状态 | 中文显示 | 颜色 | 含义 |
|------|---------|------|------|
| `active` | 进行中 | 🟢 绿色 | 正常进行中的行程 |
| `full` | 已满员 | 🟠 橙色 | 座位已满 |
| `completed` | 已完成 | 🔵 蓝色 | **时间已过 + 有预订** |
| `expired` | 已过期 | ⚪ 灰色 | **时间已过 + 无预订** |
| `cancelled` | 已取消 | ⚪ 灰色 | 手动取消 |
| `pending` | 待确认 | 🟡 黄色 | 等待司机确认 |
| `confirmed` | 已确认 | 🟢 绿色 | 司机已确认 |
| `rejected` | 已拒绝 | 🔴 红色 | 司机已拒绝 |

### CSS 样式

```javascript
const statusMap = {
  'pending': 'bg-yellow-100 text-yellow-700',
  'confirmed': 'bg-green-100 text-green-700',
  'active': 'bg-green-100 text-green-700',
  'full': 'bg-orange-100 text-orange-700',
  'cancelled': 'bg-gray-100 text-gray-700',
  'rejected': 'bg-red-100 text-red-700',
  'completed': 'bg-blue-100 text-blue-700',    // 蓝色 - 已完成
  'expired': 'bg-gray-200 text-gray-600'        // 灰色 - 已过期
};
```

---

## 🗄️ 数据库更新

### 更新 rides 表的 CHECK 约束

需要在 Supabase SQL Editor 中运行：

```sql
-- 删除旧的约束
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;

-- 添加新的约束（包含 expired）
ALTER TABLE rides
ADD CONSTRAINT rides_status_check
CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));
```

**文件位置：** `campusride-backend/database/update_rides_status_constraint.sql`

---

## 🧪 测试场景

### 测试 1: 有预订的行程 → completed

#### 步骤：

1. **Alice 发布行程**（5 分钟后）
   ```
   出发时间: 13:00
   状态: active 🟢
   ```

2. **Bob 预订并被接受**
   ```
   Booking status: confirmed
   ```

3. **等待时间到达（13:00）**

4. **刷新 My Trips**

#### 预期结果：

```
Alice 的 My Trips:
┌────────────────────────────────┐
│ 行程标题                        │
│ 状态: 已完成 🔵                 │
│ 1 booking                      │
└────────────────────────────────┘
```

---

### 测试 2: 无预订的行程 → expired

#### 步骤：

1. **Alice 发布行程**（5 分钟后）
   ```
   出发时间: 13:00
   状态: active 🟢
   ```

2. **无人预订**
   ```
   No bookings
   ```

3. **等待时间到达（13:00）**

4. **刷新 My Trips**

#### 预期结果：

```
Alice 的 My Trips:
┌────────────────────────────────┐
│ 行程标题                        │
│ 状态: 已过期 ⚪                 │
│ 0 bookings                     │
└────────────────────────────────┘
```

---

### 测试 3: 有 pending 但无 confirmed → expired

#### 步骤：

1. **Alice 发布行程**（5 分钟后）

2. **Bob 发送预订请求**（pending）
   ```
   Booking status: pending （司机未接受）
   ```

3. **等待时间到达**

4. **刷新 My Trips**

#### 预期结果：

```
状态: 已过期 ⚪

原因: 只有 confirmed 的预订才算，pending 不算
```

---

## 🚀 快速测试脚本

### 创建测试数据

```bash
cd /Users/xinyuepan/Desktop/intergration-backup_副本

python3 << 'EOF'
import requests
from datetime import datetime, timedelta

API_URL = "http://localhost:3001/api/v1"

# 登录 Alice
alice_login = requests.post(f"{API_URL}/auth/login", json={
    "email": "alice@cornell.edu",
    "password": "alice1234"
})
alice_token = alice_login.json()['data']['token']

# 登录 Bob
bob_login = requests.post(f"{API_URL}/auth/login", json={
    "email": "bob@cornell.edu",
    "password": "bob1234"
})
bob_token = bob_login.json()['data']['token']

# 测试 1: 创建一个有预订的行程（1 分钟后）
future_time_1 = (datetime.now() + timedelta(minutes=1)).strftime('%Y-%m-%dT%H:%M:%S')

ride1 = requests.post(
    f"{API_URL}/carpooling/rides",
    headers={"Authorization": f"Bearer {alice_token}"},
    json={
        "title": "Test Ride WITH Booking",
        "departureLocation": "Cornell",
        "destinationLocation": "NYC",
        "departureTime": future_time_1,
        "availableSeats": 3,
        "pricePerSeat": 35
    }
)

if ride1.json().get('success'):
    ride1_id = ride1.json()['data']['ride']['id']
    print(f"✅ 行程 1 创建成功 (有预订测试)")
    print(f"   时间: {future_time_1}")
    
    # Bob 预订
    booking = requests.post(
        f"{API_URL}/carpooling/rides/{ride1_id}/book",
        headers={"Authorization": f"Bearer {bob_token}"},
        json={"seatsBooked": 1}
    )
    
    if booking.json().get('success'):
        booking_id = booking.json()['data']['booking']['id']
        print(f"✅ Bob 预订成功")
        
        # Alice 接受预订（需要先获取 notification）
        notifications = requests.get(
            f"{API_URL}/notifications",
            headers={"Authorization": f"Bearer {alice_token}"}
        )
        
        if notifications.json().get('success'):
            notif = notifications.json()['data']['notifications'][0]
            
            # 接受预订
            accept = requests.post(
                f"{API_URL}/notifications/{notif['id']}/respond",
                headers={"Authorization": f"Bearer {alice_token}"},
                json={"action": "accept"}
            )
            
            if accept.json().get('success'):
                print(f"✅ Alice 接受预订")
                print(f"   → 1 分钟后应该变成 'completed' 🔵")

print()

# 测试 2: 创建一个无预订的行程（1 分钟后）
future_time_2 = (datetime.now() + timedelta(minutes=1)).strftime('%Y-%m-%dT%H:%M:%S')

ride2 = requests.post(
    f"{API_URL}/carpooling/rides",
    headers={"Authorization": f"Bearer {alice_token}"},
    json={
        "title": "Test Ride WITHOUT Booking",
        "departureLocation": "Cornell",
        "destinationLocation": "Boston",
        "departureTime": future_time_2,
        "availableSeats": 3,
        "pricePerSeat": 40
    }
)

if ride2.json().get('success'):
    print(f"✅ 行程 2 创建成功 (无预订测试)")
    print(f"   时间: {future_time_2}")
    print(f"   → 1 分钟后应该变成 'expired' ⚪")

print()
print("=" * 60)
print("🎯 测试说明:")
print("1. 等待 1 分钟")
print("2. 刷新 My Trips")
print("3. 检查状态:")
print("   - 'Test Ride WITH Booking' → 🔵 已完成")
print("   - 'Test Ride WITHOUT Booking' → ⚪ 已过期")
print("=" * 60)

EOF
```

---

## 📂 修改的文件

1. **`campusride-backend/src/controllers/carpooling.controller.js`**
   - 添加 `updateExpiredRidesStatus()` 辅助函数
   - 在 `getRides()` 中调用
   - 在 `getMyTrips()` 中调用

2. **`src/views/RideshareView.vue`**
   - `getStatusClass()`: 添加 `expired` 样式
   - `getStatusText()`: 添加 `expired` 显示文字

3. **`campusride-backend/database/update_rides_status_constraint.sql`**
   - 更新数据库 CHECK 约束

---

## ⚠️ 重要提醒

### 必须执行的 SQL

在测试前，**必须**在 Supabase SQL Editor 中运行：

```sql
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;

ALTER TABLE rides
ADD CONSTRAINT rides_status_check
CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));
```

否则数据库会拒绝 `'expired'` 状态！

---

## 🎯 总结

### 核心区别

| 场景 | 结果状态 | 显示 | 含义 |
|------|---------|------|------|
| 时间到 + 有人预订 | `completed` | 🔵 已完成 | 行程成功完成 |
| 时间到 + 无人预订 | `expired` | ⚪ 已过期 | 行程无人参与 |

### 判断依据

```javascript
有 confirmed bookings → completed
无 confirmed bookings → expired
```

**pending 不算，只有 confirmed 才算！**

---

## 🚀 下一步

1. **在 Supabase 中运行 SQL**（添加 `expired` 到约束）
2. **强制刷新浏览器**（Command/Ctrl + Shift + R）
3. **运行测试脚本**（创建测试数据）
4. **等待 1 分钟**
5. **刷新 My Trips 查看状态变化**

---

**完成！现在系统会自动区分 completed 和 expired 了！** 🎉




