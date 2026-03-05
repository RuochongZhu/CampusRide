<template>
  <div class="activity-list">
    <!-- Filters -->
    <div class="activity-filters mb-4">
      <div class="filter-row">
        <a-select
          v-model:value="filters.category"
          placeholder="Category"
          style="width: 140px"
          allow-clear
          @change="fetchActivities"
        >
          <a-select-option value="academic">Academic</a-select-option>
          <a-select-option value="sports">Sports</a-select-option>
          <a-select-option value="social">Social</a-select-option>
          <a-select-option value="volunteer">Volunteer</a-select-option>
          <a-select-option value="career">Career</a-select-option>
          <a-select-option value="cultural">Cultural</a-select-option>
          <a-select-option value="technology">Technology</a-select-option>
        </a-select>

        <a-select
          v-model:value="filters.status"
          placeholder="Status"
          style="width: 120px"
          allow-clear
          @change="fetchActivities"
        >
          <a-select-option value="published">Open</a-select-option>
          <a-select-option value="ongoing">Ongoing</a-select-option>
          <a-select-option value="completed">Completed</a-select-option>
        </a-select>

        <a-select
          v-model:value="filters.sortBy"
          placeholder="Sort By"
          style="width: 140px"
          @change="fetchActivities"
        >
          <a-select-option value="newest">Newest</a-select-option>
          <a-select-option value="start_time">Start Time</a-select-option>
          <a-select-option value="participants">Most Popular</a-select-option>
        </a-select>

        <a-button type="primary" @click="fetchActivities" :loading="loading">
          Refresh
        </a-button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p class="mt-2">Loading activities...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="activities.length === 0" class="empty-state">
      <div class="empty-icon">🎯</div>
      <h3>No activities found</h3>
      <p>Be the first to create an activity in your area!</p>
    </div>

    <!-- Activity Cards -->
    <div v-else class="activity-cards">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="activity-card"
        @click="$emit('activity-selected', activity)"
        @mouseenter="highlightLocation(activity)"
        @mouseleave="clearHighlight()"
      >
        <div class="activity-header">
          <div class="activity-title-row">
            <h3 class="activity-title">{{ activity.title }}</h3>
            <div class="activity-tags">
              <a-tag :color="getCategoryColor(activity.category)">
                {{ activity.category }}
              </a-tag>
              <a-tag v-if="activity.reward_points > 0" color="orange">
                +{{ activity.reward_points }} pts
              </a-tag>
            </div>
          </div>
          <div class="activity-meta">
            <div class="activity-organizer-wrap">
              <a-tooltip :title="getOrganizerBubbleText(activity)">
                <a-avatar
                  :src="activity.organizer?.avatar_url"
                  :size="24"
                  class="activity-organizer-avatar"
                >
                  {{ getOrganizerInitial(activity) }}
                </a-avatar>
              </a-tooltip>
              <span class="activity-organizer">{{ getOrganizerName(activity) }}</span>
            </div>
            <span class="activity-time">{{ formatTime(activity.start_time) }}</span>
          </div>
        </div>

        <p class="activity-description">{{ activity.description }}</p>

        <div class="activity-footer">
          <div class="activity-location">
            <EnvironmentOutlined />
            <span>{{ activity.location }}</span>
          </div>
          <div class="activity-participants">
            <UserOutlined />
            <span>{{ activity.current_participants || 0 }}/{{ activity.max_participants || '∞' }}</span>
          </div>
          <div class="activity-actions">
            <!-- 签到按钮 -->
            <a-button
              v-if="canCheckin(activity)"
              type="primary"
              size="small"
              @click.stop="openCheckinModal(activity)"
              class="checkin-button"
            >
              <CheckCircleOutlined />
              签到
            </a-button>
            <div class="activity-status">
              <a-tag :color="getStatusColor(activity.status)">
                {{ getStatusText(activity.status) }}
              </a-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="load-more-container">
      <a-button @click="loadMore" :loading="loadingMore">
        Load More
      </a-button>
    </div>

    <!-- 签到模态框 -->
    <ActivityCheckinModal
      v-model:open="checkinModalVisible"
      :activity="selectedActivity"
      @checkin-success="handleCheckinSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import {
  Select as ASelect,
  SelectOption as ASelectOption,
  Button as AButton,
  Tag as ATag,
  Spin as ASpin,
  Avatar as AAvatar,
  Tooltip as ATooltip,
  message
} from 'ant-design-vue'
import { EnvironmentOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'
import { useActivityStore } from '../../stores/activity'
import ActivityCheckinModal from './ActivityCheckinModal.vue'

// Props
const props = defineProps({
  filterType: {
    type: String,
    default: 'all' // 'all', 'my', 'nearby'
  },
  mapBounds: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['activity-selected', 'location-highlight'])

// Store
const activityStore = useActivityStore()

// Reactive data
const loading = ref(false)
const loadingMore = ref(false)
const activities = ref([])
const hasMore = ref(true)
const currentPage = ref(1)

const filters = reactive({
  category: undefined,
  status: undefined,
  sortBy: 'newest'
})

// 签到相关状态
const checkinModalVisible = ref(false)
const selectedActivity = ref(null)

// Methods
const fetchActivities = async (reset = true) => {
  if (reset) {
    loading.value = true
    currentPage.value = 1
    activities.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const params = {
      page: currentPage.value,
      limit: 10,
      ...filters
    }

    // Add filter type specific params
    if (props.filterType === 'my') {
      params.organizerOnly = true
    } else if (props.filterType === 'nearby' && props.mapBounds) {
      params.bounds = props.mapBounds
    }

    const response = await activityStore.fetchActivities(params)

    if (reset) {
      activities.value = response.data || []
    } else {
      activities.value.push(...(response.data || []))
    }

    hasMore.value = response.hasMore || false
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    message.error('Failed to load activities')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  currentPage.value++
  fetchActivities(false)
}

const highlightLocation = (activity) => {
  if (activity.location_coordinates) {
    emit('location-highlight', {
      coordinates: activity.location_coordinates,
      activity: activity
    })
  }
}

const clearHighlight = () => {
  emit('location-highlight', null)
}

// 签到相关方法
const canCheckin = (activity) => {
  // 检查活动状态是否允许签到（正在进行中）
  if (activity.status !== 'ongoing') return false

  // 检查用户是否已经参加活动
  if (!activity.user_participation) return false

  // 检查是否已经签到
  if (activity.user_participation.checked_in) return false

  // 检查活动是否启用签到功能
  if (!activity.checkin_enabled) return false

  return true
}

const openCheckinModal = (activity) => {
  selectedActivity.value = activity
  checkinModalVisible.value = true
}

const handleCheckinSuccess = (data) => {
  // 更新活动状态
  const activity = activities.value.find(a => a.id === data.activityId)
  if (activity && activity.user_participation) {
    activity.user_participation.checked_in = true
    activity.user_participation.checkin_time = data.result.checkinTime
  }

  message.success('签到成功！')
  checkinModalVisible.value = false
}

// Utility functions
const getCategoryColor = (category) => {
  const colors = {
    academic: 'blue',
    sports: 'green',
    social: 'purple',
    volunteer: 'orange',
    career: 'cyan',
    cultural: 'magenta',
    technology: 'geekblue'
  }
  return colors[category] || 'default'
}

const getStatusColor = (status) => {
  const colors = {
    published: 'green',
    ongoing: 'blue',
    completed: 'default',
    cancelled: 'red'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    published: 'Open',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return texts[status] || status
}

const getOrganizerName = (activity) => {
  if (activity.organizer) {
    return `${activity.organizer.first_name} ${activity.organizer.last_name}`
  }
  return 'Unknown'
}

const getOrganizerInitial = (activity) => {
  const firstName = activity.organizer?.first_name || ''
  const lastName = activity.organizer?.last_name || ''
  return (firstName[0] || lastName[0] || '?').toUpperCase()
}

const getOrganizerBubbleText = (activity) => {
  const name = getOrganizerName(activity)
  const description = activity.description ? `\n${activity.description.slice(0, 60)}${activity.description.length > 60 ? '...' : ''}` : ''
  return `${name} 发布了活动：${activity.title}${description}`
}

const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Watchers
watch(() => props.filterType, () => {
  fetchActivities()
})

watch(() => props.mapBounds, () => {
  if (props.filterType === 'nearby') {
    fetchActivities()
  }
})

// Lifecycle
onMounted(() => {
  fetchActivities()
})
</script>

<style scoped>
.activity-list {
  max-height: 60vh;
  overflow-y: auto;
}

.activity-filters {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.activity-organizer-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.activity-organizer-avatar {
  border: 2px solid #f97316;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.activity-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.activity-card:hover {
  border-color: #C24D45;
  box-shadow: 0 2px 8px rgba(194, 77, 69, 0.15);
  transform: translateY(-2px);
}

.activity-header {
  margin-bottom: 12px;
}

.activity-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.activity-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.activity-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.activity-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.activity-description {
  color: #666;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.activity-location,
.activity-participants {
  display: flex;
  align-items: center;
  gap: 4px;
}

.activity-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkin-button {
  background-color: #C24D45;
  border-color: #C24D45;
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
}

.checkin-button:hover {
  background-color: #A93C35;
  border-color: #A93C35;
}

.load-more-container {
  text-align: center;
  padding: 20px;
}
</style>