# 评分系统快速上手指南

## 🚀 5分钟快速集成

### 步骤 1: 执行数据库迁移

在 **Supabase SQL Editor** 中执行以下文件：

```sql
-- 文件位置: campusride-backend/database/migrations/add_user_rating_fields.sql
-- 复制文件内容并在 Supabase 中执行
```

### 步骤 2: 验证后端API

访问 Swagger 文档查看新的评分API：
```
http://localhost:3001/api-docs
```

查找以下端点：
- `POST /api/v1/ratings` - 创建评分
- `GET /api/v1/ratings/user/:userId` - 获取用户评分

### 步骤 3: 在前端使用评分徽章

**最简单的用法：**

```vue
<template>
  <div class="user-profile">
    <a-avatar :src="user.avatar_url" />
    <span>{{ user.name }}</span>
    
    <!-- 添加这一行显示评分 -->
    <UserRatingBadge :userId="user.id" />
  </div>
</template>

<script setup>
import UserRatingBadge from '@/components/UserRatingBadge.vue';

const user = { 
  id: 'user-uuid', 
  name: 'John Doe',
  avatar_url: 'https://...'
};
</script>
```

**效果：**
- 有评分用户：⭐ 4.8 (24)
- 新用户：**NEW**（紫色徽章）
- 加载中：⏳
- 错误：?

### 步骤 4: 添加评分功能

```vue
<template>
  <div>
    <!-- 评分按钮 -->
    <a-button @click="openRating">Rate User</a-button>

    <!-- 评分弹窗 -->
    <RatingModal
      v-model:open="showRating"
      :tripId="tripId"
      :rateeId="userId"
      :rateeInfo="userInfo"
      roleOfRater="passenger"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import RatingModal from '@/components/RatingModal.vue';

const showRating = ref(false);
const tripId = ref('trip-uuid');
const userId = ref('user-uuid');
const userInfo = ref({ 
  first_name: 'John', 
  last_name: 'Doe' 
});

const openRating = () => {
  showRating.value = true;
};

const handleSuccess = (data) => {
  console.log('Rating submitted!', data);
};
</script>
```

---

## 📝 常用场景

### 场景 1: 在用户列表中显示评分

```vue
<div v-for="user in users" :key="user.id" class="user-item">
  <a-avatar :src="user.avatar_url" />
  <span>{{ user.name }}</span>
  <UserRatingBadge :userId="user.id" size="small" />
</div>
```

### 场景 2: 在行程详情中显示司机评分

```vue
<div class="driver-info">
  <h3>Driver</h3>
  <a-avatar :src="driver.avatar_url" :size="64" />
  <div>
    <p>{{ driver.name }}</p>
    <UserRatingBadge :userId="driver.id" size="medium" :showCount="true" />
  </div>
</div>
```

### 场景 3: 完成行程后评价

```vue
<template>
  <div class="completed-trip">
    <h3>Trip Completed!</h3>
    <p>How was your experience?</p>
    
    <!-- 司机评价乘客 -->
    <div v-if="isDriver">
      <h4>Rate Your Passengers</h4>
      <div v-for="passenger in passengers" :key="passenger.id">
        <a-avatar :src="passenger.avatar_url" />
        <span>{{ passenger.name }}</span>
        <a-button @click="ratePassenger(passenger)">
          Rate
        </a-button>
      </div>
    </div>
    
    <!-- 乘客评价司机 -->
    <div v-else>
      <h4>Rate Your Driver</h4>
      <a-button type="primary" @click="rateDriver">
        Rate {{ driver.name }}
      </a-button>
    </div>

    <!-- 评分弹窗 -->
    <RatingModal
      v-model:open="showRatingModal"
      :tripId="tripId"
      :rateeId="currentRateeId"
      :rateeInfo="currentRateeInfo"
      :roleOfRater="isDriver ? 'driver' : 'passenger'"
      @success="handleRatingSuccess"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import RatingModal from '@/components/RatingModal.vue';

const showRatingModal = ref(false);
const currentRateeId = ref(null);
const currentRateeInfo = ref(null);
const tripId = ref('trip-uuid');
const isDriver = ref(true); // 或 false

const ratePassenger = (passenger) => {
  currentRateeId.value = passenger.id;
  currentRateeInfo.value = passenger;
  showRatingModal.value = true;
};

const rateDriver = () => {
  currentRateeId.value = driver.value.id;
  currentRateeInfo.value = driver.value;
  showRatingModal.value = true;
};

const handleRatingSuccess = () => {
  message.success('Thank you for your feedback!');
  // 刷新页面或更新状态
};
</script>
```

---

## 🎨 自定义样式

### 改变徽章尺寸

```vue
<!-- 小尺寸 -->
<UserRatingBadge :userId="userId" size="small" />

<!-- 中等尺寸（默认） -->
<UserRatingBadge :userId="userId" size="medium" />

<!-- 大尺寸 -->
<UserRatingBadge :userId="userId" size="large" />
```

### 隐藏评分数量

```vue
<!-- 只显示星星和分数，不显示 (24) -->
<UserRatingBadge :userId="userId" :showCount="false" />
```

### 手动控制加载

```vue
<template>
  <UserRatingBadge 
    ref="ratingBadgeRef"
    :userId="userId" 
    :autoLoad="false"
  />
  <a-button @click="loadRating">Load Rating</a-button>
</template>

<script setup>
import { ref } from 'vue';

const ratingBadgeRef = ref(null);

const loadRating = () => {
  ratingBadgeRef.value?.loadRating();
};
</script>
```

---

## 🔧 API 使用示例

### 直接使用 API（不用组件）

```javascript
import { ratingAPI } from '@/utils/api';

// 1. 获取用户评分
const getUserRating = async (userId) => {
  try {
    const response = await ratingAPI.getUserRating(userId);
    const { avgRating, totalRatings, isNew } = response.data.data;
    
    if (isNew) {
      console.log('This is a new user - show NEW badge');
    } else {
      console.log(`Rating: ${avgRating} (${totalRatings} reviews)`);
    }
  } catch (error) {
    console.error('Failed to get rating:', error);
  }
};

// 2. 创建评分
const submitRating = async () => {
  try {
    const response = await ratingAPI.createRating({
      tripId: 'trip-uuid',
      rateeId: 'user-uuid',
      score: 5,
      comment: 'Great experience!',
      roleOfRater: 'passenger'
    });
    
    console.log('Rating submitted:', response.data);
  } catch (error) {
    console.error('Failed to submit rating:', error);
  }
};

// 3. 检查是否可以评价
const checkCanRate = async (tripId, rateeId) => {
  try {
    const response = await ratingAPI.canRateUser(tripId, rateeId);
    const { canRate, reason, roleOfRater } = response.data.data;
    
    if (canRate) {
      console.log('Can rate as:', roleOfRater);
      // 显示评分按钮
    } else {
      console.log('Cannot rate:', reason);
      // 隐藏评分按钮或显示原因
    }
  } catch (error) {
    console.error('Failed to check rating permission:', error);
  }
};
```

---

## 🐛 常见问题

### Q1: NEW 标签不显示？

**A:** 确保用户确实没有收到任何评分。检查数据库：
```sql
SELECT COUNT(*) FROM ratings WHERE ratee_id = 'user-uuid';
```

### Q2: 评分不更新？

**A:** 检查触发器是否正确创建：
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_user_rating';
```

### Q3: 无法提交评分？

**A:** 检查以下条件：
- ✅ 行程是否已完成（status = 'completed'）
- ✅ 是否是该行程的参与者
- ✅ 是否尝试给自己评分
- ✅ token是否有效

### Q4: 评分显示为 "?"

**A:** 这表示加载评分失败。查看浏览器控制台：
```javascript
// 在组件上添加错误处理
<UserRatingBadge 
  :userId="userId" 
  @error="(err) => console.error('Rating error:', err)"
/>
```

---

## 📊 测试数据

### 创建测试评分

在 Supabase SQL Editor 中：

```sql
-- 为用户添加一些测试评分
INSERT INTO ratings (trip_id, rater_id, ratee_id, score, comment, role_of_rater)
VALUES 
  (gen_random_uuid(), gen_random_uuid(), 'YOUR_USER_ID', 5, 'Excellent!', 'passenger'),
  (gen_random_uuid(), gen_random_uuid(), 'YOUR_USER_ID', 4, 'Good', 'passenger'),
  (gen_random_uuid(), gen_random_uuid(), 'YOUR_USER_ID', 5, 'Great', 'driver');

-- 查看用户评分（应该自动计算为 4.67）
SELECT avg_rating, total_ratings FROM users WHERE id = 'YOUR_USER_ID';
```

---

## 🎯 下一步

1. ✅ 完成数据库迁移
2. ✅ 验证后端API正常
3. ✅ 在一个页面中测试评分徽章
4. ✅ 测试评分提交功能
5. ✅ 在所有需要的地方添加评分显示

---

## 📚 完整文档

详细的实现文档请查看：
- `RATING_SYSTEM_COMPLETE.md` - 完整技术文档

---

**需要帮助？**
- 查看 Swagger 文档: http://localhost:3001/api-docs
- 检查后端日志: `tail -f campusride-backend/backend.log`
- 检查浏览器控制台的错误信息

**Happy Coding!** 🎉

