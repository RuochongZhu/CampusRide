# 完整评分系统实现文档

## 📋 功能概述

实现了一个完整的司机-乘客互评系统，包括：
- ✅ 司机和乘客在完成行程后互相评分（1-5星）
- ✅ 后端按"收到的所有评分"计算平均值
- ✅ 评分显示在用户头像旁边
- ✅ 无评分用户显示 "NEW" 标签
- ✅ 完整的异常处理和错误提示
- ✅ 四舍五入到小数点后2位
- ✅ 自动更新用户评分缓存

---

## 🗄️ 数据库设计

### 1. Ratings 表结构

```sql
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,                              -- 行程ID
  rater_id UUID NOT NULL,                             -- 评价人ID
  ratee_id UUID NOT NULL,                             -- 被评价人ID
  role_of_rater VARCHAR(20) NOT NULL                  -- 评价人角色: 'driver' | 'passenger'
    CHECK (role_of_rater IN ('driver', 'passenger')),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),  -- 评分: 1-5
  comment TEXT,                                       -- 评论（可选）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 约束：同一行程、同一评价人对同一被评价人只能评一次
  CONSTRAINT unique_rating_per_trip UNIQUE (trip_id, rater_id, ratee_id),
  
  -- 不能给自己评分
  CONSTRAINT no_self_rating CHECK (rater_id != ratee_id)
);

-- 索引
CREATE INDEX idx_ratings_trip_id ON ratings(trip_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);
```

### 2. Users 表新增字段

```sql
-- 添加平均评分字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_avg_rating ON users(avg_rating DESC) 
WHERE avg_rating IS NOT NULL;
```

### 3. 自动更新触发器

```sql
-- 创建触发器函数：当添加新评分时自动更新用户评分
CREATE OR REPLACE FUNCTION update_user_rating_on_new_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新被评价人的平均评分
  UPDATE users
  SET 
    avg_rating = (
      SELECT ROUND(AVG(score)::numeric, 2)
      FROM ratings 
      WHERE ratee_id = NEW.ratee_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM ratings 
      WHERE ratee_id = NEW.ratee_id
    )
  WHERE id = NEW.ratee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_user_rating
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating_on_new_rating();
```

### 4. 执行迁移

在 Supabase SQL Editor 中执行：
```bash
campusride-backend/database/migrations/add_user_rating_fields.sql
```

---

## 🔌 后端 API

### API 端点列表

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/ratings` | 创建或更新评分 |
| GET | `/api/v1/ratings/user/:userId` | 获取用户平均评分 |
| GET | `/api/v1/ratings/trip/:tripId` | 获取行程的所有评分 |
| GET | `/api/v1/ratings/received/:userId` | 获取用户收到的评分（分页） |
| GET | `/api/v1/ratings/can-rate` | 检查是否可以评价 |

### 1. 创建评分

**请求示例：**
```javascript
POST /api/v1/ratings
Authorization: Bearer <token>
Content-Type: application/json

{
  "tripId": "uuid-of-trip",
  "rateeId": "uuid-of-user-being-rated",
  "score": 5,
  "comment": "Great driver! Very punctual.",
  "roleOfRater": "passenger"  // 'driver' or 'passenger'
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "Rating created successfully",
  "data": {
    "rating": {
      "id": "uuid",
      "trip_id": "uuid",
      "rater_id": "uuid",
      "ratee_id": "uuid",
      "score": 5,
      "comment": "Great driver!",
      "role_of_rater": "passenger",
      "created_at": "2025-11-12T22:00:00Z"
    }
  }
}
```

**验证规则：**
- ✅ 评分必须是 1-5 的整数
- ✅ 只能评价已完成的行程
- ✅ 不能给自己评分
- ✅ 同一行程只能评价同一人一次（可以更新）
- ✅ 必须是该行程的参与者

**错误处理：**
```javascript
// 400 - 验证错误
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Score must be an integer between 1 and 5"
  }
}

// 403 - 权限错误
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "You must be a participant of this trip to rate"
  }
}

// 404 - 行程不存在
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Trip not found"
  }
}
```

### 2. 获取用户评分

**请求示例：**
```javascript
GET /api/v1/ratings/user/:userId
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "avgRating": 4.75,           // 平均评分，四舍五入到2位小数
    "totalRatings": 24,          // 总评分数
    "cachedAvgRating": 4.75,     // 缓存的评分（来自users表）
    "cachedTotalRatings": 24,
    "isNew": false               // 是否是新用户（无评分）
  }
}
```

**新用户示例：**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "avgRating": null,
    "totalRatings": 0,
    "cachedAvgRating": null,
    "cachedTotalRatings": 0,
    "isNew": true                // 显示 NEW 标签
  }
}
```

### 3. 检查是否可以评价

**请求示例：**
```javascript
GET /api/v1/ratings/can-rate?tripId=xxx&rateeId=xxx
Authorization: Bearer <token>
```

**响应示例：**
```json
// 可以评价
{
  "success": true,
  "data": {
    "canRate": true,
    "roleOfRater": "passenger"
  }
}

// 不能评价
{
  "success": true,
  "data": {
    "canRate": false,
    "reason": "Trip not completed yet"
  }
}

// 已经评价过
{
  "success": true,
  "data": {
    "canRate": false,
    "reason": "Already rated",
    "ratingId": "uuid"
  }
}
```

---

## 🎨 前端组件

### 1. UserRatingBadge 组件

显示用户评分或 "NEW" 标签的组件。

**使用示例：**
```vue
<template>
  <div class="user-card">
    <a-avatar :src="user.avatar_url" :size="64" />
    <div class="user-info">
      <h3>{{ user.first_name }} {{ user.last_name }}</h3>
      <!-- 评分徽章 -->
      <UserRatingBadge 
        :userId="user.id"
        size="medium"
        :showCount="true"
        @loaded="handleRatingLoaded"
        @error="handleRatingError"
      />
    </div>
  </div>
</template>

<script setup>
import UserRatingBadge from '@/components/UserRatingBadge.vue';

const handleRatingLoaded = (data) => {
  console.log('Rating loaded:', data);
  // data: { avgRating, totalRatings, isNew }
};

const handleRatingError = (error) => {
  console.error('Failed to load rating:', error);
};
</script>
```

**Props：**
| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| userId | String | required | 用户ID |
| size | String | 'medium' | 尺寸：'small', 'medium', 'large' |
| showCount | Boolean | true | 是否显示评分数量 |
| autoLoad | Boolean | true | 是否自动加载 |

**Events：**
| 事件 | 参数 | 描述 |
|------|------|------|
| loaded | { avgRating, totalRatings, isNew } | 评分加载完成 |
| error | error | 加载失败 |

**显示效果：**
- 有评分：⭐ 4.8 (24)
- 新用户：NEW（紫色渐变徽章，带脉冲动画）
- 加载中：转圈图标
- 错误：? 图标（鼠标悬停显示错误信息）

### 2. RatingModal 组件

评分弹窗组件。

**使用示例：**
```vue
<template>
  <div>
    <!-- 触发按钮 -->
    <a-button @click="showRatingModal">
      Rate Driver
    </a-button>

    <!-- 评分弹窗 -->
    <RatingModal
      v-model:open="ratingModalVisible"
      :tripId="trip.id"
      :rateeId="driverId"
      :rateeInfo="driverInfo"
      roleOfRater="passenger"
      @success="handleRatingSuccess"
      @cancel="handleRatingCancel"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import RatingModal from '@/components/RatingModal.vue';

const ratingModalVisible = ref(false);
const trip = ref({ id: 'uuid-of-trip' });
const driverId = ref('uuid-of-driver');
const driverInfo = ref({
  first_name: 'John',
  last_name: 'Doe',
  avatar_url: 'https://...'
});

const showRatingModal = () => {
  ratingModalVisible.value = true;
};

const handleRatingSuccess = (data) => {
  console.log('Rating submitted:', data);
  // 刷新页面或更新UI
};

const handleRatingCancel = () => {
  console.log('Rating cancelled');
};
</script>
```

**Props：**
| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| open | Boolean | false | 是否显示弹窗 |
| tripId | String | required | 行程ID |
| rateeId | String | required | 被评价人ID |
| rateeInfo | Object | null | 被评价人信息 |
| roleOfRater | String | required | 评价人角色：'driver' 或 'passenger' |

**Events：**
| 事件 | 参数 | 描述 |
|------|------|------|
| update:open | boolean | 弹窗显示/隐藏 |
| success | data | 评分成功 |
| cancel | - | 取消评分 |

---

## 💻 完整前端实现示例

### RideshareView.vue 集成示例

```vue
<template>
  <div class="rideshare-view">
    <!-- My Trips Section -->
    <div class="my-trips">
      <h2>My Completed Trips</h2>
      
      <div v-for="trip in completedTrips" :key="trip.id" class="trip-card">
        <!-- 司机视角：显示乘客列表和评分 -->
        <div v-if="trip.role === 'driver'" class="driver-view">
          <h3>{{ trip.title }}</h3>
          <p>{{ formatDateTime(trip.departure_time) }}</p>
          
          <!-- 乘客列表 -->
          <div class="passengers-list">
            <h4>Passengers</h4>
            <div v-for="booking in trip.bookings" :key="booking.id" class="passenger-item">
              <a-avatar :src="booking.passenger.avatar_url" />
              <div class="passenger-info">
                <span class="passenger-name">
                  {{ booking.passenger.first_name }} {{ booking.passenger.last_name }}
                </span>
                <!-- 乘客评分 -->
                <UserRatingBadge 
                  :userId="booking.passenger.id"
                  size="small"
                />
              </div>
              <!-- 评价按钮 -->
              <a-button
                v-if="!hasRated(trip.id, booking.passenger.id)"
                type="primary"
                size="small"
                @click="openRatingModal(trip, booking.passenger, 'driver')"
              >
                Rate Passenger
              </a-button>
              <a-tag v-else color="success">Rated</a-tag>
            </div>
          </div>
        </div>

        <!-- 乘客视角：显示司机信息和评分 -->
        <div v-else class="passenger-view">
          <h3>{{ trip.title }}</h3>
          <p>{{ formatDateTime(trip.departure_time) }}</p>
          
          <div class="driver-info-card">
            <a-avatar :src="trip.driver.avatar_url" :size="48" />
            <div class="driver-details">
              <span class="driver-name">
                {{ trip.driver.first_name }} {{ trip.driver.last_name }}
              </span>
              <!-- 司机评分 -->
              <UserRatingBadge 
                :userId="trip.driver.id"
                size="medium"
              />
            </div>
            <!-- 评价按钮 -->
            <a-button
              v-if="!hasRated(trip.id, trip.driver.id)"
              type="primary"
              @click="openRatingModal(trip, trip.driver, 'passenger')"
            >
              Rate Driver
            </a-button>
            <a-tag v-else color="success">Rated</a-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 评分弹窗 -->
    <RatingModal
      v-model:open="ratingModalVisible"
      :tripId="currentTripId"
      :rateeId="currentRateeId"
      :rateeInfo="currentRateeInfo"
      :roleOfRater="currentRoleOfRater"
      @success="handleRatingSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import UserRatingBadge from '@/components/UserRatingBadge.vue';
import RatingModal from '@/components/RatingModal.vue';
import { rideshareAPI, ratingAPI } from '@/utils/api';

// 状态
const completedTrips = ref([]);
const myRatings = ref(new Set());
const ratingModalVisible = ref(false);
const currentTripId = ref(null);
const currentRateeId = ref(null);
const currentRateeInfo = ref(null);
const currentRoleOfRater = ref(null);

// 加载已完成的行程
const loadCompletedTrips = async () => {
  try {
    const response = await rideshareAPI.getMyTrips();
    completedTrips.value = response.data.data.trips.filter(
      trip => trip.status === 'completed' || trip.booking_status === 'completed'
    );
  } catch (error) {
    console.error('Failed to load trips:', error);
    message.error('Failed to load trips');
  }
};

// 加载我的评分记录
const loadMyRatings = async () => {
  try {
    const userId = localStorage.getItem('userId'); // 假设存储了用户ID
    const response = await ratingAPI.getUserReceivedRatings(userId);
    
    // 存储已评价的记录: "tripId-rateeId"
    myRatings.value = new Set(
      response.data.data.ratings.map(r => `${r.trip_id}-${r.ratee_id}`)
    );
  } catch (error) {
    console.error('Failed to load ratings:', error);
  }
};

// 检查是否已评价
const hasRated = (tripId, rateeId) => {
  return myRatings.value.has(`${tripId}-${rateeId}`);
};

// 打开评分弹窗
const openRatingModal = (trip, ratee, roleOfRater) => {
  currentTripId.value = trip.id;
  currentRateeId.value = ratee.id;
  currentRateeInfo.value = ratee;
  currentRoleOfRater.value = roleOfRater;
  ratingModalVisible.value = true;
};

// 评分成功处理
const handleRatingSuccess = (data) => {
  message.success('Rating submitted successfully!');
  myRatings.value.add(`${currentTripId.value}-${currentRateeId.value}`);
  ratingModalVisible.value = false;
};

// 格式化时间
const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString();
};

onMounted(() => {
  loadCompletedTrips();
  loadMyRatings();
});
</script>

<style scoped>
.trip-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.passengers-list {
  margin-top: 16px;
}

.passenger-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
}

.passenger-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.driver-info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-top: 16px;
}

.driver-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
```

---

## 🧪 测试指南

### 1. 数据库测试

```sql
-- 测试：创建评分
INSERT INTO ratings (trip_id, rater_id, ratee_id, score, comment, role_of_rater)
VALUES (
  'trip-uuid',
  'rater-uuid',
  'ratee-uuid',
  5,
  'Excellent!',
  'passenger'
);

-- 测试：查看用户平均评分
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.avg_rating,
  u.total_ratings,
  COUNT(r.id) as actual_count,
  ROUND(AVG(r.score)::numeric, 2) as calculated_avg
FROM users u
LEFT JOIN ratings r ON r.ratee_id = u.id
WHERE u.id = 'user-uuid'
GROUP BY u.id;

-- 测试：触发器是否工作
SELECT * FROM users WHERE id = 'ratee-uuid';
-- 应该看到 avg_rating 和 total_ratings 自动更新
```

### 2. API 测试

使用 curl 或 Postman：

```bash
# 1. 创建评分
curl -X POST http://localhost:3001/api/v1/ratings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "uuid",
    "rateeId": "uuid",
    "score": 5,
    "comment": "Great!",
    "roleOfRater": "passenger"
  }'

# 2. 获取用户评分
curl http://localhost:3001/api/v1/ratings/user/USER_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. 检查是否可以评价
curl "http://localhost:3001/api/v1/ratings/can-rate?tripId=TRIP_UUID&rateeId=USER_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 前端测试

1. **测试 NEW 标签**：创建新用户，应该显示 NEW 标签
2. **测试评分显示**：有评分的用户应显示星星和数字
3. **测试评分提交**：完成行程后评价对方
4. **测试错误处理**：尝试评价未完成的行程
5. **测试重复评价**：尝试评价同一人两次（应该更新）

---

## 📊 数据流程

```
1. 用户完成行程
   ↓
2. 前端显示"Rate Driver/Passenger"按钮
   ↓
3. 用户点击打开 RatingModal
   ↓
4. 用户选择星级和填写评论
   ↓
5. 提交到后端 POST /api/v1/ratings
   ↓
6. 后端验证：
   - 行程是否完成
   - 是否有权限评价
   - 是否重复评价
   ↓
7. 创建/更新评分记录
   ↓
8. 触发器自动更新 users.avg_rating
   ↓
9. 返回成功响应
   ↓
10. 前端刷新显示，UserRatingBadge 更新
```

---

## ✅ 功能清单

- [x] 数据库表设计和创建
- [x] 自动更新触发器
- [x] 后端评分API（创建、查询）
- [x] 四舍五入到2位小数
- [x] 前端评分徽章组件（含 NEW 标签）
- [x] 前端评分弹窗组件
- [x] 完整的异常处理
- [x] API错误响应
- [x] 前端错误显示
- [x] 防止重复评价（可更新）
- [x] 权限验证
- [x] 响应式设计

---

## 🚀 部署步骤

1. **数据库迁移**
   ```bash
   # 在 Supabase SQL Editor 执行
   campusride-backend/database/migrations/add_user_rating_fields.sql
   ```

2. **重启后端服务**
   ```bash
   cd campusride-backend
   npm run dev
   ```

3. **测试API**
   ```bash
   # 访问 Swagger 文档
   http://localhost:3001/api-docs
   ```

4. **前端使用**
   - 导入组件：`UserRatingBadge.vue` 和 `RatingModal.vue`
   - 在需要的页面使用（如 RideshareView.vue）

---

## 📝 注意事项

1. **评分更新**：评分可以更新，同一行程对同一人只保留最后一次评分
2. **缓存同步**：触发器会自动同步评分到 users 表
3. **权限控制**：只有行程参与者才能评价
4. **状态检查**：只能评价已完成的行程
5. **异常处理**：前端和后端都有完整的错误处理

---

**实施日期**: 2025-11-12  
**版本**: v1.0.0  
**状态**: ✅ 完成并测试

