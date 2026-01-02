<template>
  <div class="rating-badge-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-badge">
      <a-spin :size="size === 'small' ? 'small' : 'default'" />
    </div>

    <!-- 错误状态 -->
    <a-tooltip v-else-if="error" :title="error" placement="top">
      <div class="error-badge">
        <QuestionCircleOutlined />
      </div>
    </a-tooltip>

    <!-- 新用户标签 -->
    <div v-else-if="isNew" class="new-user-badge" :class="[`size-${size}`]">
      <span class="new-text">NEW</span>
    </div>

    <!-- 评分显示 -->
    <div v-else class="rating-badge" :class="[`size-${size}`]">
      <StarFilled class="star-icon" />
      <span class="rating-value">{{ displayRating }}</span>
      <span v-if="showCount && totalRatings > 0" class="rating-count">({{ totalRatings }})</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { StarFilled, QuestionCircleOutlined } from '@ant-design/icons-vue'
import { ratingAPI } from '@/utils/api'

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'medium',
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
})

const emit = defineEmits(['loaded', 'error'])

// 状态管理
const loading = ref(false)
const error = ref('')
const avgRating = ref(null)
const totalRatings = ref(0)
const isNew = ref(false)

// 计算属性
const displayRating = computed(() => {
  if (avgRating.value === null) return '0.0'
  return Number(avgRating.value).toFixed(1)
})

// 方法
const fetchRating = async () => {
  if (!props.userId) {
    error.value = 'User ID is required'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await ratingAPI.getUserRating(props.userId)

    if (response.data.success) {
      const data = response.data.data
      avgRating.value = data.avgRating
      totalRatings.value = data.totalRatings || 0
      isNew.value = data.isNew || false

      emit('loaded', {
        avgRating: data.avgRating,
        totalRatings: data.totalRatings,
        isNew: data.isNew
      })
    } else {
      throw new Error('Failed to fetch rating')
    }
  } catch (err) {
    console.error('Failed to fetch user rating:', err)
    error.value = 'Failed to load rating'
    emit('error', err)
  } finally {
    loading.value = false
  }
}

// 监听 userId 变化
watch(() => props.userId, (newUserId) => {
  if (newUserId && props.autoLoad) {
    fetchRating()
  }
}, { immediate: false })

// 生命周期
onMounted(() => {
  if (props.autoLoad && props.userId) {
    fetchRating()
  }
})

// 暴露方法
defineExpose({
  fetchRating,
  refresh: fetchRating
})
</script>

<style scoped>
.rating-badge-container {
  display: inline-flex;
  align-items: center;
}

/* 加载状态 */
.loading-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 20px;
}

/* 错误状态 */
.error-badge {
  display: flex;
  align-items: center;
  color: #ff4d4f;
  cursor: help;
}

/* 新用户标签 */
.new-user-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 10px;
  letter-spacing: 0.5px;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.new-user-badge.size-small {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 10px;
}

.new-user-badge.size-medium {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
}

.new-user-badge.size-large {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 14px;
}

.new-text {
  display: block;
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5), 0 0 12px rgba(102, 126, 234, 0.3);
  }
  100% {
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  }
}

/* 评分徽章 */
.rating-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  padding: 2px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rating-badge.size-small {
  padding: 1px 6px;
  border-radius: 10px;
  gap: 2px;
}

.rating-badge.size-medium {
  padding: 2px 8px;
  border-radius: 12px;
  gap: 4px;
}

.rating-badge.size-large {
  padding: 3px 10px;
  border-radius: 14px;
  gap: 6px;
}

.star-icon {
  color: #fadb14;
  flex-shrink: 0;
}

.rating-badge.size-small .star-icon {
  font-size: 10px;
}

.rating-badge.size-medium .star-icon {
  font-size: 12px;
}

.rating-badge.size-large .star-icon {
  font-size: 14px;
}

.rating-value {
  color: #8b4513;
  font-weight: 600;
  font-size: 12px;
  line-height: 1;
}

.rating-badge.size-small .rating-value {
  font-size: 10px;
}

.rating-badge.size-medium .rating-value {
  font-size: 12px;
}

.rating-badge.size-large .rating-value {
  font-size: 14px;
}

.rating-count {
  color: #8b4513;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

.rating-badge.size-small .rating-count {
  font-size: 8px;
}

.rating-badge.size-medium .rating-count {
  font-size: 10px;
}

.rating-badge.size-large .rating-count {
  font-size: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .rating-badge,
  .new-user-badge {
    transform: scale(0.9);
  }
}
</style>