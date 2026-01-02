# My Trips & Rating System - 安装指南

## 📋 安装步骤

### 第 1 步: 数据库迁移

**⚠️ 重要:** 必须在 Supabase SQL Editor 中执行以下 SQL 脚本

#### 1.1 创建 ratings 表

```sql
-- 创建评分系统表
-- Execute this in Supabase SQL Editor

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
  
  -- 约束：同一行程、同一评价人对同一被评价人只能评一次
  CONSTRAINT unique_rating_per_trip UNIQUE (trip_id, rater_id, ratee_id),
  
  -- 不能给自己评分
  CONSTRAINT no_self_rating CHECK (rater_id != ratee_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ratings_trip_id ON ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- 更新 ride_bookings 表的状态约束（添加新状态）
ALTER TABLE ride_bookings DROP CONSTRAINT IF EXISTS ride_bookings_status_check;

ALTER TABLE ride_bookings 
ADD CONSTRAINT ride_bookings_status_check 
CHECK (status IN (
  'pending', 
  'confirmed', 
  'rejected',
  'cancelled',
  'canceled_by_passenger',
  'canceled_by_driver',
  'completed',
  'no_show'
));

COMMENT ON TABLE ratings IS 'User ratings and reviews for completed trips';
COMMENT ON CONSTRAINT unique_rating_per_trip ON ratings IS 'Prevents duplicate ratings from the same user for the same person on the same trip';
COMMENT ON CONSTRAINT no_self_rating ON ratings IS 'Users cannot rate themselves';
```

**执行方法:**
1. 打开 Supabase Dashboard: https://imrepukmkbnsypupfxdo.supabase.co
2. 点击左侧菜单 "SQL Editor"
3. 点击 "New query"
4. 复制粘贴上面的 SQL 代码
5. 点击 "Run" 按钮
6. 确认看到 "Success. No rows returned"

#### 1.2 验证表创建成功

```sql
-- 验证 ratings 表
SELECT * FROM ratings LIMIT 1;

-- 验证约束
SELECT 
  constraint_name, 
  constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'ratings';
```

**预期结果:**
- `ratings` 表查询成功（即使是空结果）
- 看到约束: `unique_rating_per_trip`, `no_self_rating`, `ratings_role_of_rater_check`, `ratings_score_check`

---

### 第 2 步: 后端服务更新

后端代码已经更新，服务已重启。

**验证后端是否运行:**

```bash
# 检查后端健康状态
curl http://localhost:3001/api/v1/health

# 应该返回:
# {"success":true,"message":"Server is running","timestamp":"..."}
```

**检查新的 API 端点:**

```bash
# 测试 My Trips API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/carpooling/my-trips

# 测试 Rating API (公开)
curl http://localhost:3001/api/v1/ratings/average/USER_ID
```

---

### 第 3 步: 前端更新

前端 API 客户端已更新，现在可以使用新的功能。

**可用的新 API 方法:**

```javascript
// Carpooling API
import { carpoolingAPI } from '@/utils/api';

// 获取我的所有行程（合并 driver 和 passenger 视角）
const trips = await carpoolingAPI.getMyTrips();

// 乘客取消预订
await carpoolingAPI.cancelBooking(bookingId);

// 司机取消预订
await carpoolingAPI.cancelBookingByDriver(bookingId);

// Rating API
import { ratingsAPI } from '@/utils/api';

// 创建评分
await ratingsAPI.createRating({
  tripId: 'uuid',
  rateeId: 'uuid',
  score: 5,
  comment: 'Great trip!'
});

// 获取我的评分状态
const status = await ratingsAPI.getMyRatingStatus(tripId);

// 获取用户平均评分
const avgRating = await ratingsAPI.getUserAverageRating(userId);

// 获取行程的所有评分
const tripRatings = await ratingsAPI.getTripRatings(tripId);
```

---

### 第 4 步: 功能验证

#### 4.1 验证 My Trips API

**使用 cURL 测试:**

```bash
# 先登录获取 token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@cornell.edu","password":"alice1234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# 获取 My Trips
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/carpooling/my-trips | python3 -m json.tool
```

**预期响应:**

```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "uuid",
        "title": "Cornell to NYC",
        "role": "driver",
        "status": "active",
        "bookings": [...],
        ...
      },
      {
        "id": "uuid",
        "title": "NYC to Ithaca",
        "role": "passenger",
        "booking_id": "uuid",
        "booking_status": "confirmed",
        ...
      }
    ],
    "pagination": {...}
  }
}
```

#### 4.2 验证取消功能

**测试乘客取消:**

```bash
# 1. Bob 预订 Alice 的行程
BOOKING_ID="..."  # 从预订响应中获取

# 2. Bob 取消预订
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN_BOB" \
  http://localhost:3001/api/v1/carpooling/bookings/$BOOKING_ID \
  | python3 -m json.tool

# 预期: {"success": true, "message": "Booking canceled"}
```

#### 4.3 验证评分功能

**测试创建评分:**

```bash
# 注意: 只能在行程开始后评分
TRIP_ID="..."
DRIVER_ID="..."

curl -X POST \
  -H "Authorization: Bearer $TOKEN_BOB" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "'$TRIP_ID'",
    "rateeId": "'$DRIVER_ID'",
    "score": 5,
    "comment": "Excellent driver!"
  }' \
  http://localhost:3001/api/v1/ratings | python3 -m json.tool

# 预期: {"success": true, "data": {...}, "message": "Thanks for your rating"}
```

**测试获取平均评分:**

```bash
curl http://localhost:3001/api/v1/ratings/average/$DRIVER_ID \
  | python3 -m json.tool

# 预期: {"success": true, "data": {"averageScore": 4.8, "totalRatings": 15}}
```

---

### 第 5 步: 前端 UI 集成

#### 5.1 更新 My Trips 页面

**需要修改的文件:** `src/views/RideshareView.vue` 或类似的页面

**关键改动:**

1. **更改标题:**
   ```vue
   <!-- 从 -->
   <h2>My Bookings</h2>
   
   <!-- 改为 -->
   <h2>My Trips</h2>
   ```

2. **使用新的 API:**
   ```vue
   <script>
   import { carpoolingAPI } from '@/utils/api';
   
   export default {
     async mounted() {
       // 替换原来的 getMyBookings 或 getMyRides
       const response = await carpoolingAPI.getMyTrips();
       this.trips = response.data.trips;
     }
   }
   </script>
   ```

3. **显示角色徽章:**
   ```vue
   <template>
     <div v-for="trip in trips" :key="trip.id" class="trip-card">
       <!-- 角色徽章 -->
       <span class="role-badge" :class="trip.role">
         {{ trip.role === 'driver' ? 'Driver' : 'Passenger' }}
       </span>
       
       <!-- 其他信息 -->
       <div class="trip-info">
         <h3>{{ trip.title }}</h3>
         <!-- ... -->
       </div>
     </div>
   </template>
   
   <style scoped>
   .role-badge {
     position: absolute;
     top: 10px;
     right: 10px;
     padding: 4px 12px;
     border-radius: 12px;
     font-size: 12px;
     font-weight: 600;
   }
   
   .role-badge.driver {
     background: #1890ff;
     color: white;
   }
   
   .role-badge.passenger {
     background: #52c41a;
     color: white;
   }
   </style>
   ```

4. **条件显示按钮:**
   ```vue
   <template>
     <div class="trip-actions">
       <!-- 行程开始前 -->
       <template v-if="!isTripStarted(trip)">
         <!-- 乘客可以取消 -->
         <button 
           v-if="trip.role === 'passenger' && canCancel(trip)"
           @click="handleCancelBooking(trip)"
           class="btn-cancel"
         >
           Cancel
         </button>
       </template>
       
       <!-- 行程开始后 -->
       <template v-else>
         <!-- 显示评分按钮 -->
         <button 
           v-if="!hasRated(trip)"
           @click="showRatingModal(trip)"
           class="btn-rate"
         >
           Rate
         </button>
       </template>
     </div>
   </template>
   
   <script>
   export default {
     methods: {
       isTripStarted(trip) {
         return new Date() >= new Date(trip.departure_time);
       },
       
       canCancel(trip) {
         if (trip.role === 'passenger') {
           return ['pending', 'confirmed'].includes(trip.booking_status);
         }
         return false;
       },
       
       async handleCancelBooking(trip) {
         try {
           await carpoolingAPI.cancelBooking(trip.booking_id);
           this.$message.success('Booking canceled');
           this.loadTrips(); // 刷新列表
         } catch (error) {
           const message = error.response?.data?.error?.message || 'Failed to cancel';
           this.$message.error(message);
         }
       }
     }
   }
   </script>
   ```

#### 5.2 创建评分弹窗组件

**新建文件:** `src/components/RatingModal.vue`

```vue
<template>
  <a-modal
    v-model:visible="visible"
    title="Rate Trip"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="rating-form">
      <!-- 被评价人信息 -->
      <div class="ratee-info">
        <h4 v-if="trip.role === 'passenger'">Rate Driver</h4>
        <h4 v-else>Rate Passenger</h4>
        <p>{{ getRateeName() }}</p>
      </div>

      <!-- 星级评分 -->
      <div class="star-rating">
        <label>Your Rating:</label>
        <a-rate v-model:value="rating.score" :count="5" />
      </div>

      <!-- 评论 -->
      <div class="comment-section">
        <label>Comment (Optional):</label>
        <a-textarea
          v-model:value="rating.comment"
          placeholder="Share your experience..."
          :maxlength="500"
          :rows="4"
          show-count
        />
      </div>
    </div>
  </a-modal>
</template>

<script>
import { ratingsAPI } from '@/utils/api';

export default {
  name: 'RatingModal',
  props: {
    trip: {
      type: Object,
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
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
        const driver = this.trip.driver;
        return driver 
          ? `${driver.first_name} ${driver.last_name}`
          : 'Driver';
      } else {
        // 对于司机评价乘客，需要UI选择乘客
        return 'Passenger';
      }
    },

    async handleSubmit() {
      try {
        const rateeId = this.trip.role === 'passenger'
          ? this.trip.driver_id
          : this.selectedPassengerId; // 需要从UI获取

        await ratingsAPI.createRating({
          tripId: this.trip.id,
          rateeId,
          score: this.rating.score,
          comment: this.rating.comment || null
        });

        this.$message.success('Thanks for your rating');
        this.$emit('rated');
        this.handleCancel();
      } catch (error) {
        const errorCode = error.response?.data?.error?.code;
        const message = error.response?.data?.error?.message || 'Failed to submit rating';
        
        if (errorCode === 'ALREADY_RATED') {
          this.$message.warning("You've already rated this person for this trip");
        } else if (errorCode === 'TRIP_NOT_STARTED') {
          this.$message.warning('Cannot rate before the trip has started');
        } else {
          this.$message.error(message);
        }
      }
    },

    handleCancel() {
      this.rating = { score: 5, comment: '' };
      this.$emit('update:visible', false);
    }
  }
};
</script>

<style scoped>
.rating-form {
  padding: 20px 0;
}

.ratee-info {
  margin-bottom: 20px;
  text-align: center;
}

.ratee-info h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.ratee-info p {
  margin: 8px 0 0;
  color: #666;
}

.star-rating {
  margin-bottom: 20px;
  text-align: center;
}

.star-rating label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
}

.comment-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}
</style>
```

---

## ✅ 验证清单

完成安装后，请验证以下内容:

### 数据库
- [ ] `ratings` 表创建成功
- [ ] 索引创建成功
- [ ] 约束创建成功
- [ ] `ride_bookings` 状态约束更新成功

### 后端
- [ ] 后端服务运行正常 (`http://localhost:3001/api/v1/health`)
- [ ] My Trips API 可访问 (`GET /api/v1/carpooling/my-trips`)
- [ ] Rating API 可访问 (`POST /api/v1/ratings`)
- [ ] 取消 API 可访问 (`DELETE /api/v1/carpooling/bookings/:id`)

### 前端
- [ ] API 客户端更新成功
- [ ] `carpoolingAPI.getMyTrips()` 可调用
- [ ] `ratingsAPI.createRating()` 可调用
- [ ] UI 显示 "My Trips" 标题
- [ ] 角色徽章正确显示
- [ ] 取消按钮条件显示
- [ ] 评分按钮条件显示

### 功能测试
- [ ] 可以获取我的所有行程（driver + passenger）
- [ ] 乘客可以取消预订（行程开始前）
- [ ] 司机可以取消预订（行程开始前）
- [ ] 行程开始后无法取消（返回 409 错误）
- [ ] 行程开始后可以评分
- [ ] 不能重复评分
- [ ] 不能给自己评分
- [ ] 评分通知正确发送

---

## 🆘 常见问题

### Q1: ratings 表创建失败

**错误:** `relation "ratings" already exists`

**解决:** 表已存在，跳过此步骤。如果需要重新创建:
```sql
DROP TABLE IF EXISTS ratings CASCADE;
-- 然后重新执行创建脚本
```

### Q2: 约束创建失败

**错误:** `constraint "unique_rating_per_trip" already exists`

**解决:** 约束已存在，可以忽略此错误。

### Q3: My Trips API 返回空数组

**可能原因:**
1. 用户没有创建或预订任何行程
2. 认证 token 无效

**解决:**
1. 先创建一个测试行程
2. 检查 token 是否正确

### Q4: 评分 API 返回 409 "Trip not started"

**原因:** 行程的出发时间还没到

**解决:** 
1. 等待行程开始时间
2. 或者创建一个过去时间的测试行程

### Q5: 前端调用 API 报 404

**可能原因:**
1. 后端服务没有重启
2. API 路径错误

**解决:**
1. 确认后端服务运行: `curl http://localhost:3001/api/v1/health`
2. 检查 API 路径是否正确

---

## 📞 技术支持

如需帮助，请:
1. 查看完整文档: `MY_TRIPS_AND_RATING_SYSTEM.md`
2. 检查后端日志: `campusride-backend` 终端输出
3. 检查前端 Console: 浏览器开发者工具

---

**安装指南版本:** 1.0  
**最后更新:** 2025-11-04




