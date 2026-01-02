<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    :confirmLoading="submitting"
    :maskClosable="false"
    width="500px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="rating-modal-content">
      <!-- 用户信息 -->
      <div v-if="rateeInfo" class="ratee-info">
        <a-avatar
          :size="64"
          :src="rateeInfo.avatar_url"
        >
          {{ getInitials(rateeInfo) }}
        </a-avatar>
        <div class="ratee-details">
          <h3 class="ratee-name">
            {{ rateeInfo.first_name }} {{ rateeInfo.last_name }}
          </h3>
          <p class="ratee-role">{{ roleText }}</p>
        </div>
      </div>

      <a-divider />

      <!-- 评分选择 -->
      <div class="rating-section">
        <label class="rating-label">
          Rating <span class="required">*</span>
        </label>
        <div class="star-rating">
          <StarFilled
            v-for="star in 5"
            :key="star"
            :class="['star', { active: star <= selectedRating, hover: star <= hoverRating }]"
            @click="selectRating(star)"
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
          />
        </div>
        <div class="rating-text">
          {{ ratingText }}
        </div>
      </div>

      <!-- 评论输入 -->
      <div class="comment-section">
        <label class="comment-label">Comment (Optional)</label>
        <a-textarea
          v-model:value="comment"
          :rows="4"
          :maxlength="500"
          placeholder="Share your experience (optional)"
          :showCount="true"
        />
      </div>

      <!-- 错误提示 -->
      <a-alert
        v-if="errorMessage"
        :message="errorMessage"
        type="error"
        closable
        @close="errorMessage = ''"
        class="error-alert"
      />
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { StarFilled } from '@ant-design/icons-vue';
import { ratingAPI } from '@/utils/api';
import { message } from 'ant-design-vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  // For trip ratings
  tripId: {
    type: String,
    default: null
  },
  // For activity ratings
  activityId: {
    type: String,
    default: null
  },
  rateeId: {
    type: String,
    required: true
  },
  rateeInfo: {
    type: Object,
    default: null
  },
  roleOfRater: {
    type: String,
    required: true,
    validator: (value) => ['driver', 'passenger', 'organizer', 'participant'].includes(value)
  },
  // 'trip' or 'activity'
  ratingType: {
    type: String,
    default: 'trip',
    validator: (value) => ['trip', 'activity'].includes(value)
  }
});

const emit = defineEmits(['update:open', 'success', 'cancel']);

// 状态
const visible = ref(props.open);
const submitting = ref(false);
const selectedRating = ref(0);
const hoverRating = ref(0);
const comment = ref('');
const errorMessage = ref('');

// 计算属性
const modalTitle = computed(() => {
  if (props.ratingType === 'activity') {
    const role = props.roleOfRater === 'organizer' ? 'Participant' : 'Organizer/Participant';
    return `Rate ${role}`;
  }
  const role = props.roleOfRater === 'driver' ? 'Passenger' : 'Driver';
  return `Rate ${role}`;
});

const roleText = computed(() => {
  if (props.ratingType === 'activity') {
    return props.roleOfRater === 'organizer' ? 'Activity Participant' : 'Activity Organizer/Participant';
  }
  return props.roleOfRater === 'driver' ? 'Passenger' : 'Driver';
});

const ratingText = computed(() => {
  const rating = hoverRating.value || selectedRating.value;
  const texts = {
    0: 'Select a rating',
    1: '⭐ Poor',
    2: '⭐⭐ Fair',
    3: '⭐⭐⭐ Good',
    4: '⭐⭐⭐⭐ Very Good',
    5: '⭐⭐⭐⭐⭐ Excellent'
  };
  return texts[rating] || texts[0];
});

// 监听 open 变化
watch(() => props.open, (newVal) => {
  visible.value = newVal;
});

watch(visible, (newVal) => {
  emit('update:open', newVal);
});

// 方法
const getInitials = (user) => {
  if (!user) return '?';
  const first = user.first_name?.charAt(0) || '';
  const last = user.last_name?.charAt(0) || '';
  return (first + last).toUpperCase() || '?';
};

const selectRating = (rating) => {
  selectedRating.value = rating;
  errorMessage.value = '';
};

const validateForm = () => {
  if (selectedRating.value === 0) {
    errorMessage.value = 'Please select a rating';
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  submitting.value = true;
  errorMessage.value = '';

  try {
    let response;

    if (props.ratingType === 'activity') {
      // Activity rating
      response = await ratingAPI.createActivityRating({
        activityId: props.activityId,
        rateeId: props.rateeId,
        score: selectedRating.value,
        comment: comment.value.trim() || null,
        roleOfRater: props.roleOfRater
      });
    } else {
      // Trip rating
      response = await ratingAPI.createRating({
        tripId: props.tripId,
        rateeId: props.rateeId,
        score: selectedRating.value,
        comment: comment.value.trim() || null,
        roleOfRater: props.roleOfRater
      });
    }

    if (response.data.success) {
      message.success('Rating submitted successfully!');
      emit('success', response.data.data);
      handleCancel();
    } else {
      throw new Error('Failed to submit rating');
    }
  } catch (error) {
    console.error('Error submitting rating:', error);
    errorMessage.value = error.response?.data?.error?.message || 'Failed to submit rating. Please try again.';

    // 如果是特定错误，显示友好提示
    if (error.response?.status === 400) {
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'VALIDATION_ERROR') {
        errorMessage.value = 'Invalid rating data. Please check your input.';
      }
    } else if (error.response?.status === 403) {
      errorMessage.value = props.ratingType === 'activity'
        ? 'You are not authorized to rate this user for this activity.'
        : 'You are not authorized to rate this user for this trip.';
    } else if (error.response?.status === 404) {
      errorMessage.value = props.ratingType === 'activity'
        ? 'Activity or user not found.'
        : 'Trip or user not found.';
    }
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
  resetForm();
  emit('cancel');
};

const resetForm = () => {
  selectedRating.value = 0;
  hoverRating.value = 0;
  comment.value = '';
  errorMessage.value = '';
};

// 暴露方法
defineExpose({
  resetForm
});
</script>

<style scoped>
.rating-modal-content {
  padding: 8px 0;
}

/* 用户信息 */
.ratee-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.ratee-details {
  flex: 1;
}

.ratee-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.ratee-role {
  margin: 4px 0 0;
  font-size: 14px;
  color: #666;
}

/* 评分部分 */
.rating-section {
  margin-bottom: 24px;
}

.rating-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #333;
}

.required {
  color: #ff4d4f;
}

.star-rating {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.star {
  font-size: 32px;
  color: #d9d9d9;
  cursor: pointer;
  transition: all 0.2s ease;
}

.star:hover {
  transform: scale(1.1);
}

.star.active,
.star.hover {
  color: #fadb14;
}

.rating-text {
  font-size: 14px;
  color: #666;
  min-height: 20px;
  font-weight: 500;
}

/* 评论部分 */
.comment-section {
  margin-bottom: 16px;
}

.comment-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

/* 错误提示 */
.error-alert {
  margin-top: 16px;
}

/* 响应式 */
@media (max-width: 640px) {
  .ratee-info {
    flex-direction: column;
    text-align: center;
  }

  .star {
    font-size: 28px;
  }
}
</style>