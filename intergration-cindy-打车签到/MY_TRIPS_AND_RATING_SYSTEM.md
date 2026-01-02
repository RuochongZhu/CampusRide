# My Trips & Rating System - 完整实现文档

## 📋 目录

1. [系统概述](#系统概述)
2. [数据模型](#数据模型)
3. [后端实现](#后端实现)
4. [前端集成](#前端集成)
5. [API 文档](#api-文档)
6. [测试指南](#测试指南)

---

## 🎯 系统概述

### 主要功能

1. **"My Trips" 统一视图**
   - 合并 Driver 和 Passenger 两种身份的行程
   - 每个行程卡片显示用户在该行程中的角色（Driver/Passenger）
   - 根据行程状态显示不同的操作按钮

2. **取消功能（行程开始前）**
   - 乘客可以取消自己的预订（pending 或 confirmed）
   - 司机可以取消某个乘客的预订
   - 自动处理座位回退和行程状态更新
   - 发送通知给受影响的用户

3. **评分系统（行程开始后）**
   - 司机可以评价乘客（1-5星 + 可选评论）
   - 乘客可以评价司机（1-5星 + 可选评论）
   - 防止重复评分
   - 防止自我评分
   - 只有行程参与者才能评分

---

## 🗄️ 数据模型

### 1. Rides（行程表）

```sql
CREATE TABLE rides (
  id UUID PRIMARY KEY,
  driver_id UUID NOT NULL,
  title VARCHAR(255),
  departure_location VARCHAR(255),
  destination_location VARCHAR(255),
  departure_time TIMESTAMP,
  available_seats INT,
  price_per_seat DECIMAL,
  status VARCHAR(20) CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Status 说明:**
- `active`: 可预订
- `full`: 已满（所有确认座位 >= 可用座位）
- `completed`: 已完成
- `cancelled`: 已取消

### 2. Ride_Bookings（预订表）

```sql
CREATE TABLE ride_bookings (
  id UUID PRIMARY KEY,
  ride_id UUID NOT NULL,
  passenger_id UUID NOT NULL,
  seats_booked INT,
  total_price DECIMAL,
  status VARCHAR(50) CHECK (status IN (
    'pending',
    'confirmed',
    'rejected',
    'cancelled',
    'canceled_by_passenger',
    'canceled_by_driver',
    'completed',
    'no_show'
  )),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  CONSTRAINT unique_passenger_per_ride UNIQUE (ride_id, passenger_id),
  CONSTRAINT check_seats_positive CHECK (seats_booked > 0)
);
```

**Status 说明:**
- `pending`: 等待司机确认
- `confirmed`: 司机已接受
- `rejected`: 司机已拒绝
- `canceled_by_passenger`: 乘客取消
- `canceled_by_driver`: 司机取消
- `completed`: 行程已完成
- `no_show`: 未出席（可选）

### 3. Ratings（评分表）

```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  ratee_id UUID NOT NULL,
  role_of_rater VARCHAR(20) CHECK (role_of_rater IN ('driver', 'passenger')),
  score INT CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  CONSTRAINT unique_rating_per_trip UNIQUE (trip_id, rater_id, ratee_id),
  CONSTRAINT no_self_rating CHECK (rater_id != ratee_id)
);
```

**约束说明:**
- 每人对同一行程的同一用户只能评价一次
- 不能给自己评分
- 评分范围：1-5星

### 4. Notifications（通知表）

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  trip_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  passenger_id UUID NOT NULL,
  booking_id UUID,
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**通知类型:**
- `booking_request`: 乘客请求预订
- `booking_confirmed`: 司机接受预订
- `booking_rejected`: 司机拒绝预订
- `booking_canceled`: 乘客取消预订
- `booking_canceled_by_driver`: 司机取消预订
- `rating_received`: 收到评分

---

## ⚙️ 后端实现

### 核心 Controller Functions

#### 1. **getMyTrips** - 获取我的所有行程

**位置:** `carpooling.controller.js`

**功能:**
- 合并用户作为 Driver 和 Passenger 的所有行程
- 为每个行程附加 `role` 字段（'driver' 或 'passenger'）
- 返回统一的行程列表

**响应格式:**
```javascript
{
  success: true,
  data: {
    trips: [
      {
        id: "uuid",
        title: "Cornell to NYC",
        departure_time: "2025-11-15T08:00:00Z",
        role: "driver",  // or "passenger"
        status: "active",
        bookings: [...],  // 仅当 role=driver 时存在
        booking_id: "uuid",  // 仅当 role=passenger 时存在
        booking_status: "confirmed",  // 仅当 role=passenger 时存在
        driver: {...},  // 司机信息
        ...
      }
    ],
    pagination: {...}
  }
}
```

#### 2. **cancelBooking** - 乘客取消预订

**位置:** `carpooling.controller.js`

**验证:**
- 只能取消自己的预订
- 只能取消 `pending` 或 `confirmed` 状态的预订
- 只能在行程开始前取消

**逻辑:**
1. 更新预订状态为 `canceled_by_passenger`
2. 如果之前是 `confirmed`，重新计算座位
3. 如果行程状态是 `full`，检查是否需要改回 `active`
4. 发送通知给司机

#### 3. **cancelBookingByDriver** - 司机取消预订

**位置:** `carpooling.controller.js`

**验证:**
- 只有司机可以取消
- 只能在行程开始前取消

**逻辑:**
1. 更新预订状态为 `canceled_by_driver`
2. 如果之前是 `confirmed`，重新计算座位
3. 如果行程状态是 `full`，检查是否需要改回 `active`
4. 发送通知给乘客

#### 4. **createRating** - 创建评分

**位置:** `rating.controller.js`

**验证:**
- 行程必须已开始（`now >= departure_time`）
- 用户必须是行程参与者（司机或已确认的乘客）
- 不能给自己评分
- 不能重复评分（检查 `UNIQUE` 约束）
- 评分必须在 1-5 之间

**逻辑:**
1. 验证用户身份（司机或乘客）
2. 司机只能评价该行程的确认乘客
3. 乘客只能评价司机
4. 创建评分记录
5. 发送 `rating_received` 通知给被评分者

#### 5. **getMyRatingStatus** - 获取评分状态

**功能:**
- 查询用户在某个行程上的评分状态
- 返回用户给出的评分和收到的评分

**响应格式:**
```javascript
{
  success: true,
  data: {
    role: "driver",  // or "passenger"
    ratingsGiven: [...],  // 我给别人的评分
    ratingsReceived: [...]  // 别人给我的评分
  }
}
```

---

## 🎨 前端集成

### API 客户端更新

**位置:** `src/utils/api.js`

#### carpoolingAPI 新增:

```javascript
export const carpoolingAPI = {
  // ... existing methods

  // 获取我的所有行程（合并视角）
  getMyTrips: (params = {}) => api.get('/carpooling/my-trips', { params }),

  // 司机取消某个预订
  cancelBookingByDriver: (bookingId) => 
    api.post(`/carpooling/bookings/${bookingId}/cancel-by-driver`),
};
```

#### ratingsAPI 新增:

```javascript
export const ratingsAPI = {
  // 创建评分
  createRating: (data) => api.post('/ratings', data),

  // 获取我的评分状态（针对某个行程）
  getMyRatingStatus: (tripId) => api.get('/ratings/my', { params: { tripId } }),

  // 获取用户的平均评分
  getUserAverageRating: (userId) => api.get(`/ratings/average/${userId}`),

  // 获取行程的所有评分
  getTripRatings: (tripId) => api.get(`/ratings/trip/${tripId}`),
};
```

### UI/UX 实现指南

#### 1. My Trips 页面

**标题:**  
将 "My Bookings" 改为 "My Trips"

**卡片设计:**

```vue
<template>
  <div class="trip-card">
    <!-- 右上角徽章 -->
    <span class="role-badge" :class="trip.role">
      {{ trip.role === 'driver' ? 'Driver' : 'Passenger' }}
    </span>

    <!-- 行程信息 -->
    <div class="trip-info">
      <h3>{{ trip.title }}</h3>
      <p>{{ trip.departure_location }} → {{ trip.destination_location }}</p>
      <p>{{ formatDate(trip.departure_time) }}</p>
    </div>

    <!-- 状态 -->
    <div class="status-pill" :class="getStatusClass(trip)">
      {{ getStatusText(trip) }}
    </div>

    <!-- 按钮区域 -->
    <div class="actions">
      <!-- 行程开始前 -->
      <template v-if="!isTripStarted(trip)">
        <!-- 乘客视角 -->
        <button 
          v-if="trip.role === 'passenger' && canCancel(trip)"
          @click="handleCancelBooking(trip)"
          class="btn-cancel"
        >
          Cancel
        </button>

        <!-- 司机视角 -->
        <template v-if="trip.role === 'driver'">
          <!-- 查看预订列表，可以取消某个乘客 -->
          <button @click="viewBookings(trip)">
            View Bookings
          </button>
        </template>
      </template>

      <!-- 行程开始后 -->
      <template v-else>
        <!-- 评分按钮 -->
        <button 
          v-if="!hasRated(trip)"
          @click="showRatingModal(trip)"
          class="btn-rate"
        >
          Rate
        </button>

        <!-- 已评分 -->
        <div v-else class="rated-info">
          <span>⭐ Rated {{ myRating(trip).score }}/5</span>
          <button @click="viewRating(trip)">View Details</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    isTripStarted(trip) {
      return new Date() >= new Date(trip.departure_time);
    },

    canCancel(trip) {
      return ['pending', 'confirmed'].includes(
        trip.role === 'passenger' ? trip.booking_status : trip.status
      );
    },

    getStatusClass(trip) {
      if (trip.role === 'passenger') {
        return `status-${trip.booking_status}`;
      }
      return `status-${trip.status}`;
    },

    getStatusText(trip) {
      if (trip.role === 'passenger') {
        const statusMap = {
          pending: 'Pending',
          confirmed: 'Confirmed',
          canceled_by_passenger: 'Canceled',
          canceled_by_driver: 'Canceled by Driver'
        };
        return statusMap[trip.booking_status] || trip.booking_status;
      }
      return trip.status.charAt(0).toUpperCase() + trip.status.slice(1);
    },

    async handleCancelBooking(trip) {
      try {
        await carpoolingAPI.cancelBooking(trip.booking_id);
        this.$message.success('Booking canceled');
        this.refreshTrips();
      } catch (error) {
        this.$message.error(error.response?.data?.error?.message || 'Failed to cancel');
      }
    },

    showRatingModal(trip) {
      // 打开评分弹窗
      this.selectedTrip = trip;
      this.ratingModalVisible = true;
    }
  }
};
</script>
```

#### 2. 评分弹窗

```vue
<template>
  <a-modal 
    v-model:visible="visible" 
    title="Rate Trip"
    @ok="handleSubmit"
  >
    <div class="rating-form">
      <!-- 评分对象信息 -->
      <div class="ratee-info">
        <h4 v-if="trip.role === 'passenger'">Rate Driver</h4>
        <h4 v-else>Rate Passenger</h4>
        <p>{{ getRateeName() }}</p>
      </div>

      <!-- 星级评分 -->
      <div class="star-rating">
        <a-rate v-model:value="rating.score" :count="5" />
      </div>

      <!-- 评论 -->
      <div class="comment">
        <a-textarea
          v-model:value="rating.comment"
          placeholder="Optional: Share your experience (max 500 characters)"
          :maxlength="500"
          :rows="4"
        />
      </div>
    </div>
  </a-modal>
</template>

<script>
import { ratingsAPI } from '@/utils/api';

export default {
  props: ['trip', 'visible'],
  emits: ['update:visible', 'rated'],
  data() {
    return {
      rating: {
        score: 5,
        comment: ''
      }
    };
  },
  methods: {
    getRateeName() {
      if (this.trip.role === 'passenger') {
        return this.trip.driver 
          ? `${this.trip.driver.first_name} ${this.trip.driver.last_name}`
          : 'Driver';
      } else {
        // 对于司机，需要从 UI 选择要评价的乘客
        return this.selectedPassenger?.name || 'Passenger';
      }
    },

    async handleSubmit() {
      try {
        const rateeId = this.trip.role === 'passenger'
          ? this.trip.driver_id
          : this.selectedPassenger.id;

        await ratingsAPI.createRating({
          tripId: this.trip.id,
          rateeId,
          score: this.rating.score,
          comment: this.rating.comment || null
        });

        this.$message.success('Thanks for your rating');
        this.$emit('rated');
        this.$emit('update:visible', false);
      } catch (error) {
        const message = error.response?.data?.error?.message || 'Failed to submit rating';
        
        if (error.response?.data?.error?.code === 'ALREADY_RATED') {
          this.$message.warning("You've already rated this person for this trip");
        } else {
          this.$message.error(message);
        }
      }
    }
  }
};
</script>
```

---

## 📡 API 文档

### My Trips API

#### GET /api/v1/carpooling/my-trips

**描述:** 获取用户的所有行程（合并 driver 和 passenger 视角）

**认证:** Required

**查询参数:**
- `status` (optional): 筛选状态
- `page` (optional): 页码，默认 1
- `limit` (optional): 每页数量，默认 20

**响应:**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "uuid",
        "title": "Cornell to NYC",
        "departure_location": "Cornell University",
        "destination_location": "JFK Airport",
        "departure_time": "2025-11-15T08:00:00Z",
        "available_seats": 3,
        "price_per_seat": 35,
        "status": "active",
        "role": "driver",
        "booked_seats": 2,
        "remaining_seats": 1,
        "bookings": [...]
      },
      {
        "id": "uuid",
        "title": "NYC to Ithaca",
        "role": "passenger",
        "booking_id": "uuid",
        "booking_status": "confirmed",
        "seats_booked": 1,
        "total_price": 30,
        "driver": {...}
      }
    ],
    "pagination": {
      "current_page": 1,
      "items_per_page": 20,
      "total_items": 5,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

### Cancellation APIs

#### DELETE /api/v1/carpooling/bookings/:id

**描述:** 乘客取消预订

**认证:** Required

**路径参数:**
- `id`: 预订 ID

**响应:**
```json
{
  "success": true,
  "message": "Booking canceled"
}
```

**错误码:**
- `404`: Booking not found
- `403`: Not authorized
- `400`: Cannot cancel this booking
- `409`: Trip has started, cancellation is unavailable

#### POST /api/v1/carpooling/bookings/:id/cancel-by-driver

**描述:** 司机取消某个乘客的预订

**认证:** Required

**路径参数:**
- `id`: 预订 ID

**响应:**
```json
{
  "success": true,
  "message": "Booking canceled successfully"
}
```

**错误码:**
- `404`: Booking not found
- `403`: Only the driver can cancel this booking
- `409`: Trip has started, cancellation is unavailable

### Rating APIs

#### POST /api/v1/ratings

**描述:** 创建评分

**认证:** Required

**请求体:**
```json
{
  "tripId": "uuid",
  "rateeId": "uuid",
  "score": 5,
  "comment": "Great driver!"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "rating": {
      "id": "uuid",
      "trip_id": "uuid",
      "rater_id": "uuid",
      "ratee_id": "uuid",
      "role_of_rater": "passenger",
      "score": 5,
      "comment": "Great driver!",
      "created_at": "2025-11-15T10:00:00Z"
    }
  },
  "message": "Thanks for your rating"
}
```

**错误码:**
- `400`: Missing fields / Invalid score / Cannot rate self
- `404`: Trip not found
- `409`: Trip not started / Already rated
- `403`: Not a participant / Invalid ratee

#### GET /api/v1/ratings/my

**描述:** 获取我的评分状态（针对某个行程）

**认证:** Required

**查询参数:**
- `tripId` (required): 行程 ID

**响应:**
```json
{
  "success": true,
  "data": {
    "role": "passenger",
    "ratingsGiven": [
      {
        "id": "uuid",
        "trip_id": "uuid",
        "ratee_id": "uuid",
        "score": 5,
        "comment": "Great!",
        "created_at": "2025-11-15T10:00:00Z"
      }
    ],
    "ratingsReceived": []
  }
}
```

#### GET /api/v1/ratings/average/:userId

**描述:** 获取用户的平均评分

**认证:** Not required (public)

**路径参数:**
- `userId`: 用户 ID

**响应:**
```json
{
  "success": true,
  "data": {
    "averageScore": 4.7,
    "totalRatings": 23
  }
}
```

#### GET /api/v1/ratings/trip/:tripId

**描述:** 获取行程的所有评分

**认证:** Not required (public)

**路径参数:**
- `tripId`: 行程 ID

**响应:**
```json
{
  "success": true,
  "data": {
    "ratings": [
      {
        "id": "uuid",
        "trip_id": "uuid",
        "score": 5,
        "comment": "Excellent!",
        "rater": {
          "id": "uuid",
          "first_name": "Alice",
          "last_name": "Johnson"
        },
        "ratee": {
          "id": "uuid",
          "first_name": "Bob",
          "last_name": "Smith"
        },
        "role_of_rater": "passenger",
        "created_at": "2025-11-15T10:00:00Z"
      }
    ]
  }
}
```

---

## 🧪 测试指南

### 数据库设置

**步骤 1: 在 Supabase SQL Editor 中执行**

```sql
-- 1. 创建 ratings 表
-- 执行: campusride-backend/database/create_ratings.sql

-- 2. 更新 ride_bookings 状态约束
-- 已包含在 create_ratings.sql 中
```

### 测试场景

#### 场景 1: My Trips 功能测试

**目标:** 验证 My Trips API 正确合并 driver 和 passenger 视角

**步骤:**
1. 以 Alice (driver) 登录
2. 创建一个新行程
3. 调用 `GET /api/v1/carpooling/my-trips`
4. 验证响应中包含该行程，`role: "driver"`

5. 以 Bob (passenger) 登录
6. 预订 Alice 的行程
7. 调用 `GET /api/v1/carpooling/my-trips`
8. 验证响应中包含该行程，`role: "passenger"`

**预期结果:**
- Alice 看到自己的行程，role 为 "driver"
- Bob 看到预订的行程，role 为 "passenger"

#### 场景 2: 乘客取消预订

**目标:** 验证乘客取消功能和座位回退逻辑

**步骤:**
1. Bob 预订 Alice 的行程（3 座位）
2. Alice 接受预订（booking status → confirmed）
3. Bob 调用 `DELETE /api/v1/carpooling/bookings/:id`
4. 验证:
   - booking.status → `canceled_by_passenger`
   - ride 的已确认座位数减少
   - 如果 ride 之前是 `full`，现在改回 `active`
   - Alice 收到通知

**预期结果:**
- 预订状态正确更新
- 座位正确回退
- 通知正确发送

#### 场景 3: 司机取消预订

**目标:** 验证司机取消功能

**步骤:**
1. Bob 预订 Alice 的行程
2. Alice 接受预订
3. Alice 调用 `POST /api/v1/carpooling/bookings/:id/cancel-by-driver`
4. 验证:
   - booking.status → `canceled_by_driver`
   - 座位正确回退
   - Bob 收到通知

**预期结果:**
- 预订状态正确更新
- 通知正确发送

#### 场景 4: 行程开始后无法取消

**目标:** 验证时间校验

**步骤:**
1. 创建一个过去时间的测试行程
2. 尝试取消预订
3. 验证返回 409 错误："Trip has started, cancellation is unavailable"

**预期结果:**
- 返回 409 错误
- 错误消息正确

#### 场景 5: 评分功能测试

**目标:** 验证评分系统

**步骤 1: 行程开始前无法评分**
1. Bob 预订 Alice 的行程（未来时间）
2. Alice 接受预订
3. Bob 尝试评分 Alice
4. 验证返回 409 错误："Cannot rate before the trip has started"

**步骤 2: 行程开始后可以评分**
1. 创建一个过去时间的测试行程
2. Bob 预订并被 Alice 接受
3. Bob 调用 `POST /api/v1/ratings`，评分 Alice
4. 验证:
   - 评分记录创建成功
   - `role_of_rater: "passenger"`
   - Alice 收到 `rating_received` 通知

**步骤 3: 不能重复评分**
1. Bob 再次尝试评分 Alice
2. 验证返回 409 错误："You've already rated this person for this trip"

**步骤 4: 司机评分乘客**
1. Alice 调用 `POST /api/v1/ratings`，评分 Bob
2. 验证:
   - 评分记录创建成功
   - `role_of_rater: "driver"`

**步骤 5: 不能给自己评分**
1. Alice 尝试评分自己
2. 验证返回 400 错误："You cannot rate yourself"

**预期结果:**
- 所有验证逻辑正确执行
- 评分记录正确创建
- 通知正确发送

#### 场景 6: 获取平均评分

**目标:** 验证评分统计功能

**步骤:**
1. 多个乘客评分 Alice（例如：5, 4, 5, 4）
2. 调用 `GET /api/v1/ratings/average/:userId`
3. 验证:
   - `averageScore: 4.5`
   - `totalRatings: 4`

**预期结果:**
- 平均分计算正确

---

## 📝 总结

### 已实现的功能

✅ **My Trips 统一视图**
- 合并 Driver 和 Passenger 视角
- 显示用户角色徽章
- 统一的状态显示

✅ **取消功能**
- 乘客取消预订（行程开始前）
- 司机取消预订（行程开始前）
- 自动座位回退
- 行程状态自动更新（full ↔ active）
- 通知系统集成

✅ **评分系统**
- 行程开始后可评分
- 司机评价乘客
- 乘客评价司机
- 防重复评分
- 防自我评分
- 评分统计（平均分、总数）

✅ **数据完整性**
- UNIQUE 约束（一个行程每人只能预订一次）
- CHECK 约束（座位数 > 0，评分 1-5）
- 外键关系
- 索引优化

### 文案（英文）

- "My Trips" (替换 "My Bookings")
- Badge: "Driver" / "Passenger"
- Buttons: "Cancel", "Rate", "View Rating", "Confirm", "Reject"
- Toast Messages:
  - "Booking request sent to the driver."
  - "Booking canceled."
  - "Trip has started, cancellation is unavailable."
  - "Thanks for your rating."
  - "You've already rated this person for this trip."

---

## 🚀 部署清单

### 后端

1. ✅ 数据库迁移
   - 执行 `create_ratings.sql`
   - 执行 `add_booking_constraints.sql`（如果还没有）

2. ✅ 代码部署
   - `carpooling.controller.js` - 新增 getMyTrips, cancelBooking, cancelBookingByDriver
   - `rating.controller.js` - 新文件
   - `rating.routes.js` - 新文件
   - `carpooling.routes.js` - 更新路由
   - `app.js` - 注册 rating routes

3. ✅ 重启服务
   ```bash
   cd campusride-backend
   npm run dev
   ```

### 前端

1. ✅ API 客户端更新
   - `src/utils/api.js` - 新增 ratingsAPI, 更新 carpoolingAPI

2. ✅ UI 组件实现
   - 更新 "My Bookings" 页面为 "My Trips"
   - 实现 role 徽章显示
   - 实现取消按钮（条件显示）
   - 实现评分按钮（行程开始后显示）
   - 实现评分弹窗组件

3. ✅ 测试
   - 手动测试所有场景
   - 验证 UI 正确显示

---

## 📞 支持

如有问题，请查看:
- [API 文档](#api-文档)
- [测试指南](#测试指南)
- 后端日志: `campusride-backend/logs/`
- 前端 Console: 浏览器开发者工具

---

**文档版本:** 1.0  
**最后更新:** 2025-11-04  
**作者:** AI Assistant







