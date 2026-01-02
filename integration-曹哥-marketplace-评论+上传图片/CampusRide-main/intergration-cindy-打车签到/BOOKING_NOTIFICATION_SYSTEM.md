# 预订通知系统 - 功能文档

## ✅ 已实现的功能

### 一、预订创建流程

当乘客创建预订时：

1. **预订状态**：默认为 `pending`（等待司机确认）
2. **支付状态**：默认为 `pending`（等待确认后支付）
3. **自动通知**：系统自动创建通知给司机
   - 类型：`booking_request`
   - 状态：`pending`
   - 消息："{乘客姓名} requested to join your trip: {行程标题}"

**API 端点**：
```
POST /api/v1/carpooling/rides/:id/book
```

**响应消息**：
```
"Your booking request has been sent to the driver for confirmation."
```

---

### 二、司机通知系统

#### 1. 获取通知列表

**API**: `GET /api/v1/notifications`

**查询参数**:
- `page`: 页码（默认：1）
- `limit`: 每页数量（默认：20）
- `status`: 筛选状态（pending/accepted/rejected）
- `type`: 通知类型
- `unreadOnly`: 只显示未读（true/false）

**返回数据**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "...",
        "type": "booking_request",
        "status": "pending",
        "message": "Demo User requested to join your trip: Cornell to NYC",
        "is_read": false,
        "passenger": {
          "first_name": "Demo",
          "last_name": "User",
          "email": "demo@cornell.edu"
        },
        "trip": {
          "title": "Cornell to NYC",
          "departure_time": "2025-11-10T10:00:00"
        }
      }
    ],
    "pagination": {
      "unread_count": 1
    }
  }
}
```

#### 2. 获取未读通知数量

**API**: `GET /api/v1/notifications/unread-count`

**返回**:
```json
{
  "success": true,
  "data": {
    "unread_count": 3
  }
}
```

#### 3. 响应预订请求

**API**: `POST /api/v1/notifications/:id/respond`

**请求体**:
```json
{
  "action": "accept"  // or "reject"
}
```

##### 当司机接受（action: "accept"）时：

1. 更新通知状态为 `accepted`
2. 更新预订状态为 `confirmed`
3. 标记通知为已读
4. 创建确认通知给乘客：
   - 类型：`booking_confirmed`
   - 消息："Your booking request has been confirmed by the driver!"

##### 当司机拒绝（action: "reject"）时：

1. 更新通知状态为 `rejected`
2. 更新预订状态为 `cancelled`
3. 标记通知为已读
4. 创建拒绝通知给乘客：
   - 类型：`booking_rejected`
   - 消息："Your booking request has been declined by the driver."

---

### 三、乘客通知系统

#### 获取乘客通知

**API**: `GET /api/v1/notifications/passenger`

**返回的通知类型**:
- `booking_confirmed` - 预订已确认
- `booking_rejected` - 预订被拒绝
- `trip_update` - 行程更新
- `trip_cancelled` - 行程取消

**返回数据**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "type": "booking_confirmed",
        "message": "Your booking request has been confirmed by the driver!",
        "driver": {
          "first_name": "Alice",
          "last_name": "Johnson"
        },
        "trip": {
          "title": "Cornell to NYC"
        }
      }
    ]
  }
}
```

---

### 四、通知管理

#### 1. 标记单个通知为已读

**API**: `PATCH /api/v1/notifications/:id/read`

#### 2. 标记所有通知为已读

**API**: `POST /api/v1/notifications/mark-all-read`

---

## 📊 完整的业务流程

### 场景 1: 成功预订流程

```
1. Demo (乘客) 预订 Alice (司机) 的行程
   ↓
2. 系统创建预订 (status: pending)
   ↓
3. 系统创建通知给 Alice (type: booking_request)
   ↓
4. Alice 查看通知，点击 "Accept"
   ↓
5. 系统更新预订状态 → confirmed
   ↓
6. 系统创建确认通知给 Demo (type: booking_confirmed)
   ↓
7. Demo 在 "My Trips" 看到状态为 confirmed
```

### 场景 2: 预订被拒绝流程

```
1. Demo (乘客) 预订 Alice (司机) 的行程
   ↓
2. 系统创建预订 (status: pending)
   ↓
3. 系统创建通知给 Alice (type: booking_request)
   ↓
4. Alice 查看通知，点击 "Reject"
   ↓
5. 系统更新预订状态 → cancelled
   ↓
6. 系统创建拒绝通知给 Demo (type: booking_rejected)
   ↓
7. Demo 收到拒绝通知
```

---

## 🧪 测试结果

### ✅ 测试通过的功能

1. **预订创建**
   - ✅ 预订状态默认为 `pending`
   - ✅ 自动创建通知给司机
   - ✅ 返回正确的提示消息

2. **司机通知**
   - ✅ 成功获取通知列表
   - ✅ 显示乘客信息和行程详情
   - ✅ 未读通知计数正确

3. **接受预订**
   - ✅ 预订状态更新为 `confirmed`
   - ✅ 通知状态更新为 `accepted`
   - ✅ 成功创建确认通知给乘客

4. **拒绝预订**
   - ✅ 预订状态更新为 `cancelled`
   - ✅ 通知状态更新为 `rejected`
   - ✅ 成功创建拒绝通知给乘客

5. **乘客通知**
   - ✅ 成功接收确认通知
   - ✅ 成功接收拒绝通知
   - ✅ 显示司机信息和行程详情

---

## 🗄️ 数据库表结构

### notifications 表

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,           -- 通知类型
  trip_id UUID NOT NULL,                -- 关联行程ID
  driver_id UUID NOT NULL,              -- 司机ID
  passenger_id UUID NOT NULL,           -- 乘客ID
  booking_id UUID,                      -- 关联预订ID
  status VARCHAR(20) DEFAULT 'pending', -- 通知状态
  message TEXT,                         -- 通知消息
  is_read BOOLEAN DEFAULT FALSE,        -- 是否已读
  created_at TIMESTAMP,                 -- 创建时间
  updated_at TIMESTAMP                  -- 更新时间
);
```

### 通知类型 (type)

- `booking_request` - 新预订请求（司机接收）
- `booking_confirmed` - 预订已确认（乘客接收）
- `booking_rejected` - 预订被拒绝（乘客接收）
- `trip_update` - 行程更新
- `trip_cancelled` - 行程取消

### 通知状态 (status)

- `pending` - 待处理
- `accepted` - 已接受
- `rejected` - 已拒绝

---

## 🎯 前端集成指南

### 1. 显示通知铃铛

```javascript
import { notificationsAPI } from '@/utils/api';

// 获取未读数量
const { data } = await notificationsAPI.getUnreadCount();
const unreadCount = data.unread_count;

// 显示红色徽章
<Badge count={unreadCount}>
  <BellOutlined />
</Badge>
```

### 2. 司机查看通知

```javascript
// 获取通知列表
const { data } = await notificationsAPI.getNotifications({
  page: 1,
  limit: 20,
  unreadOnly: true
});

// 显示通知
data.notifications.map(notif => (
  <div>
    <p>{notif.message}</p>
    <p>{notif.passenger.first_name} {notif.passenger.last_name}</p>
    <button onClick={() => handleAccept(notif.id)}>Accept</button>
    <button onClick={() => handleReject(notif.id)}>Reject</button>
  </div>
));
```

### 3. 响应预订请求

```javascript
// 接受预订
const handleAccept = async (notificationId) => {
  await notificationsAPI.respondToBooking(notificationId, 'accept');
  message.success('Booking accepted!');
  // 刷新通知列表
};

// 拒绝预订
const handleReject = async (notificationId) => {
  await notificationsAPI.respondToBooking(notificationId, 'reject');
  message.info('Booking rejected');
  // 刷新通知列表
};
```

### 4. 乘客查看通知

```javascript
// 获取乘客通知
const { data } = await notificationsAPI.getPassengerNotifications();

data.notifications.map(notif => {
  if (notif.type === 'booking_confirmed') {
    return <Alert type="success" message={notif.message} />;
  } else if (notif.type === 'booking_rejected') {
    return <Alert type="warning" message={notif.message} />;
  }
});
```

---

## 📝 注意事项

1. **防止重复预订**：系统会检查同一用户是否已预订同一行程
2. **司机不能预订自己的行程**：系统会自动拒绝
3. **座位验证**：系统会检查剩余座位是否足够
4. **通知创建失败**：不会阻止预订流程，只记录错误日志

---

## 🚀 部署清单

- [x] 创建 notifications 表
- [x] 创建 ride_bookings 表
- [x] 部署后端 API
- [x] 更新前端 API 调用
- [ ] 前端 UI 实现（通知铃铛、预订确认界面）
- [ ] 实时通知推送（可选：使用 Socket.IO）

---

**文档版本**: 1.0  
**最后更新**: 2025-11-04  
**状态**: ✅ 所有后端功能已测试通过




