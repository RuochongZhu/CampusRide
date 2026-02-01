<template>
  <div class="user-quick-card">
    <div class="card-header">
      <a-avatar :src="user?.avatar_url || defaultAvatar" :size="64">
        {{ getInitials(user) }}
      </a-avatar>
      <div class="user-info">
        <h3>{{ user?.first_name }} {{ user?.last_name }}</h3>
        <p class="email">{{ maskEmail(user?.email) }}</p>
        <div class="rating">
          <template v-if="hasRating">
            <StarFilled v-for="i in 5" :key="i"
              :class="{ active: i <= Math.round(user?.avg_rating || 0) }" />
            <span>{{ user.avg_rating.toFixed(1) }}</span>
          </template>
          <template v-else>
            <StarOutlined v-for="i in 5" :key="i" class="no-rating" />
            <span class="no-rating-text">N/A</span>
          </template>
        </div>
      </div>
    </div>

    <div class="card-stats">
      <div class="stat-item">
        <CarOutlined />
        <span class="stat-value">{{ stats.rides }}</span>
        <span class="stat-label">Rides</span>
      </div>
      <div class="stat-item">
        <ShopOutlined />
        <span class="stat-value">{{ stats.trades }}</span>
        <span class="stat-label">Trades</span>
      </div>
      <div class="stat-item">
        <CalendarOutlined />
        <span class="stat-value">{{ stats.activities }}</span>
        <span class="stat-label">Activities</span>
      </div>
    </div>

    <div class="card-actions">
      <a-button type="primary" block @click="$emit('message')">
        <MessageOutlined /> Send Message
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  StarFilled,
  StarOutlined,
  CarOutlined,
  CalendarOutlined,
  MessageOutlined,
  ShopOutlined
} from '@ant-design/icons-vue'
import { userProfileAPI } from '@/utils/api'

const props = defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['message', 'close'])

const defaultAvatar = '/Profile_Photo.jpg'

// Stats data
const stats = ref({
  rides: 0,
  trades: 0,
  activities: 0
})

// Check if user has a valid rating
const hasRating = computed(() => {
  return props.user?.avg_rating !== null &&
         props.user?.avg_rating !== undefined &&
         props.user?.avg_rating > 0
})

const getInitials = (user) => {
  if (!user) return '?'
  const first = user.first_name?.[0] || ''
  const last = user.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

const maskEmail = (email) => {
  if (!email) return ''
  // Show full email instead of masking
  return email
}

// Load user stats
const loadUserStats = async (userId) => {
  if (!userId) return

  try {
    const response = await userProfileAPI.getUserProfile(userId)
    if (response.data?.success || response.data?.data) {
      const userData = response.data?.data || response.data
      stats.value = {
        rides: (userData.total_rides_as_driver || 0) + (userData.total_rides_as_passenger || 0) + (userData.total_carpools || 0),
        trades: userData.total_marketplace_posts || userData.total_sales || 0,
        activities: userData.total_activities || 0
      }
    }
  } catch (error) {
    console.error('Failed to load user stats:', error)
    // Use fallback from props if API fails
    stats.value = {
      rides: props.user?.total_carpools || 0,
      trades: props.user?.total_sales || 0,
      activities: props.user?.total_activities || 0
    }
  }
}

// Watch for user changes
watch(() => props.user?.id, (newId) => {
  if (newId) {
    loadUserStats(newId)
  }
}, { immediate: true })

onMounted(() => {
  if (props.user?.id) {
    loadUserStats(props.user.id)
  }
})
</script>

<style scoped>
.user-quick-card {
  width: 320px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.user-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.email {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #8c8c8c;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating .anticon {
  color: #d9d9d9;
  font-size: 14px;
}

.rating .anticon.active {
  color: #fadb14;
}

.rating .anticon.no-rating {
  color: #e0e0e0;
}

.rating span {
  margin-left: 4px;
  font-size: 14px;
  color: #595959;
  font-weight: 500;
}

.rating .no-rating-text {
  color: #bfbfbf;
  font-style: italic;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-item .anticon {
  color: #1890ff;
  font-size: 18px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 11px;
  color: #8c8c8c;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-actions .ant-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
