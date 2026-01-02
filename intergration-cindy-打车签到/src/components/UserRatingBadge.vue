<template>
  <div class="user-rating-badge" :class="sizeClass">
    <!-- 新用户标签 -->
    <div v-if="isNew && !loading && !error" class="rating-new">
      <span class="new-badge">NEW</span>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="rating-loading">
      <a-spin :size="size === 'small' ? 'small' : 'default'" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="rating-error" :title="errorMessage">
      <span class="error-icon">?</span>
    </div>

    <!-- 显示评分 -->
    <div v-else class="rating-display">
      <div class="rating-stars">
        <StarFilled class="star-icon" />
        <span class="rating-value">{{ displayRating }}</span>
      </div>
      <div v-if="showCount && totalRatings > 0" class="rating-count">
        ({{ totalRatings }})
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { StarFilled } from '@ant-design/icons-vue';
import { ratingAPI } from '@/utils/api';
import { message } from 'ant-design-vue';

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  showCount: {
    type: Boolean,
    default: true
  },
  autoLoad: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['loaded', 'error']);

// 状态
const loading = ref(false);
const error = ref(false);
const errorMessage = ref('');
const avgRating = ref(null);
const totalRatings = ref(0);
const isNew = ref(false);

// 计算属性
const sizeClass = computed(() => `size-${props.size}`);

const displayRating = computed(() => {
  if (avgRating.value === null) return 'N/A';
  // 四舍五入到1位小数
  return avgRating.value.toFixed(1);
});

// 加载评分数据
const loadRating = async () => {
  if (!props.userId) {
    error.value = true;
    errorMessage.value = 'User ID is required';
    return;
  }

  loading.value = true;
  error.value = false;
  errorMessage.value = '';

  try {
    const response = await ratingAPI.getUserRating(props.userId);
    
    if (response.data.success) {
      const data = response.data.data;
      
      avgRating.value = data.avgRating;
      totalRatings.value = data.totalRatings || 0;
      isNew.value = data.isNew || totalRatings.value === 0;

      emit('loaded', {
        avgRating: avgRating.value,
        totalRatings: totalRatings.value,
        isNew: isNew.value
      });
    } else {
      throw new Error('Failed to load rating');
    }
  } catch (err) {
    console.error('Error loading user rating:', err);
    error.value = true;
    errorMessage.value = err.response?.data?.error?.message || 'Failed to load rating';
    
    // 对于404错误，显示为新用户
    if (err.response?.status === 404) {
      isNew.value = true;
      error.value = false;
    } else {
      emit('error', err);
    }
  } finally {
    loading.value = false;
  }
};

// 监听 userId 变化
watch(() => props.userId, (newUserId) => {
  if (newUserId && props.autoLoad) {
    loadRating();
  }
}, { immediate: true });

// 暴露方法给父组件
defineExpose({
  loadRating,
  refresh: loadRating
});

onMounted(() => {
  if (props.autoLoad && props.userId) {
    loadRating();
  }
});
</script>

<style scoped>
.user-rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 尺寸变化 */
.size-small {
  font-size: 12px;
}

.size-small .star-icon {
  font-size: 12px;
}

.size-medium {
  font-size: 14px;
}

.size-medium .star-icon {
  font-size: 14px;
}

.size-large {
  font-size: 16px;
}

.size-large .star-icon {
  font-size: 16px;
}

/* 新用户标签 */
.rating-new .new-badge {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
  font-size: 10px;
  border-radius: 12px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 加载状态 */
.rating-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

/* 错误状态 */
.rating-error {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: help;
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #f5f5f5;
  color: #999;
  font-size: 12px;
  font-weight: bold;
}

/* 评分显示 */
.rating-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-stars {
  display: flex;
  align-items: center;
  gap: 2px;
}

.star-icon {
  color: #fadb14;
}

.rating-value {
  font-weight: 600;
  color: #333;
}

.rating-count {
  font-size: 0.9em;
  color: #999;
  font-weight: normal;
}

/* 响应式 */
@media (max-width: 640px) {
  .size-large {
    font-size: 14px;
  }
  
  .size-large .star-icon {
    font-size: 14px;
  }
}
</style>

