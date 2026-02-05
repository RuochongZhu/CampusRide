<template>
  <a-modal
    v-model:open="isVisible"
    :title="activity?.title || 'Activity Details'"
    width="700px"
    :footer="null"
    class="activity-detail-modal"
  >
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p class="mt-2">Loading activity details...</p>
    </div>

    <div v-else-if="activity" class="activity-detail">
      <!-- Header Section -->
      <div class="activity-header">
        <div class="activity-meta-row">
          <div class="activity-tags">
            <a-tag :color="getCategoryColor(activity.category)">
              {{ activity.category }}
            </a-tag>
            <a-tag :color="getStatusColor(activity.status)">
              {{ getStatusText(activity.status) }}
            </a-tag>
            <a-tag v-if="activity.reward_points > 0" color="orange">
              +{{ activity.reward_points }} pts
            </a-tag>
          </div>
          <div class="activity-actions">
            <a-dropdown v-if="isOrganizer" :trigger="['click']">
              <a-button type="text" size="small">
                <MoreOutlined />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="editActivity">
                    <EditOutlined />
                    Edit Activity
                  </a-menu-item>
                  <a-menu-item @click="viewParticipants">
                    <UserOutlined />
                    View Participants
                  </a-menu-item>
                  <a-menu-item danger @click="deleteActivity">
                    <DeleteOutlined />
                    Delete Activity
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>

        <div class="organizer-info">
          <a-avatar
            :src="activity.organizer?.avatar_url || defaultAvatar"
            :size="32"
          >
            {{ getInitials(activity.organizer) }}
          </a-avatar>
          <div class="organizer-details">
            <span class="organizer-name">{{ getOrganizerName(activity.organizer) }}</span>
            <span class="organizer-university">{{ activity.organizer?.university }}</span>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="activity-description">
        <p>{{ activity.description }}</p>
      </div>

      <!-- Time Information -->
      <div class="activity-time-info">
        <div class="time-item">
          <ClockCircleOutlined />
          <div class="time-details">
            <span class="time-label">Start Time</span>
            <span class="time-value">{{ formatDateTime(activity.start_time) }}</span>
          </div>
        </div>
        <div class="time-item">
          <ClockCircleOutlined />
          <div class="time-details">
            <span class="time-label">End Time</span>
            <span class="time-value">{{ formatDateTime(activity.end_time) }}</span>
          </div>
        </div>
        <div v-if="activity.registration_deadline" class="time-item">
          <CalendarOutlined />
          <div class="time-details">
            <span class="time-label">Registration Deadline</span>
            <span class="time-value">{{ formatDateTime(activity.registration_deadline) }}</span>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="activity-location">
        <EnvironmentOutlined />
        <span>{{ activity.location }}</span>
        <a-button
          v-if="activity.location_coordinates"
          type="link"
          size="small"
          @click="highlightLocation"
        >
          Show on Map
        </a-button>
      </div>

      <!-- Participants -->
      <div class="activity-participants">
        <div class="participants-header">
          <UserOutlined />
          <span>Participants</span>
          <span class="participants-count">
            {{ activity.current_participants || 0 }}
            <span v-if="activity.max_participants">/ {{ activity.max_participants }}</span>
          </span>
        </div>

        <div v-if="activity.participants && activity.participants.length > 0" class="participants-list">
          <a-avatar-group :max-count="8">
            <a-avatar
              v-for="participant in activity.participants"
              :key="participant.id"
              :src="participant.user?.avatar_url || defaultAvatar"
              :title="`${participant.user?.first_name} ${participant.user?.last_name}`"
            >
              {{ getInitials(participant.user) }}
            </a-avatar>
          </a-avatar-group>
        </div>
      </div>

      <!-- Requirements -->
      <div v-if="activity.requirements" class="activity-requirements">
        <h4>Requirements</h4>
        <p>{{ activity.requirements }}</p>
      </div>

      <!-- Tags -->
      <div v-if="activity.tags && activity.tags.length > 0" class="activity-tags-section">
        <h4>Tags</h4>
        <div class="tags-list">
          <a-tag v-for="tag in activity.tags" :key="tag" color="blue">
            {{ tag }}
          </a-tag>
        </div>
      </div>

      <!-- Fees and Rewards -->
      <div v-if="hasFeesOrRewards" class="activity-fees">
        <h4>Fees & Rewards</h4>
        <div class="fee-items">
          <div v-if="activity.entry_fee > 0" class="fee-item">
            <DollarOutlined />
            <span>Entry Fee: ${{ activity.entry_fee }}</span>
          </div>
          <div v-if="activity.entry_fee_points > 0" class="fee-item">
            <TrophyOutlined />
            <span>Points Required: {{ activity.entry_fee_points }}</span>
          </div>
          <div v-if="activity.reward_points > 0" class="fee-item">
            <GiftOutlined />
            <span>Reward Points: {{ activity.reward_points }}</span>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div v-if="activity.contact_info?.email" class="activity-contact">
        <h4>Contact</h4>
        <div class="contact-item">
          <MailOutlined />
          <a :href="`mailto:${activity.contact_info.email}`">{{ activity.contact_info.email }}</a>
        </div>
      </div>

      <!-- Check-in Section -->
      <div v-if="isParticipant && canCheckIn" class="check-in-section">
        <a-divider />
        <div class="check-in-form">
          <h4>Check-in</h4>
          <p>Activity check-in is now available!</p>
          <a-input
            v-model:value="checkinCode"
            placeholder="Enter check-in code"
            :maxlength="6"
            style="margin-bottom: 12px"
          />
          <a-button
            type="primary"
            @click="checkIn"
            :loading="checkingIn"
            block
          >
            Check In
          </a-button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="activity-actions-footer">
        <a-space>
          <a-button @click="closeModal">
            Close
          </a-button>

          <a-button
            v-if="!isOrganizer && !isParticipant && canRegister"
            type="primary"
            @click="joinActivity"
            :loading="joining"
          >
            Join Activity
          </a-button>

          <a-button
            v-if="!isOrganizer && isParticipant && canCancelRegistration"
            danger
            @click="leaveActivity"
            :loading="leaving"
          >
            Leave Activity
          </a-button>

          <a-button
            v-if="isParticipant && activity.attendance_status === 'attended'"
            type="primary"
            disabled
          >
            ✓ Attended
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-state">
      <a-result
        status="error"
        title="Failed to load activity"
        sub-title="Please try again later"
      >
        <template #extra>
          <a-button type="primary" @click="$emit('close')">
            Close
          </a-button>
        </template>
      </a-result>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Modal as AModal,
  Button as AButton,
  Tag as ATag,
  Avatar as AAvatar,
  AvatarGroup as AAvatarGroup,
  Dropdown as ADropdown,
  Menu as AMenu,
  MenuItem as AMenuItem,
  Spin as ASpin,
  Result as AResult,
  Divider as ADivider,
  Input as AInput,
  Space as ASpace,
  message
} from 'ant-design-vue'
import {
  MoreOutlined,
  EditOutlined,
  UserOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  TrophyOutlined,
  GiftOutlined,
  MailOutlined
} from '@ant-design/icons-vue'
import { useActivityStore } from '../../stores/activity'
import { useAuthStore } from '../../stores/auth'

// Props
const props = defineProps({
  activity: {
    type: Object,
    required: true
  },
  open: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'close',
  'activity-updated',
  'activity-joined',
  'activity-left',
  'location-highlight'
])

// Stores
const activityStore = useActivityStore()
const authStore = useAuthStore()

// Default avatar
const defaultAvatar = '/Profile_Photo.jpg'

// Reactive data
const loading = ref(false)
const joining = ref(false)
const leaving = ref(false)
const checkingIn = ref(false)
const checkinCode = ref('')

// Computed
const isVisible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const currentUser = computed(() => authStore.user)

const isOrganizer = computed(() => {
  return currentUser.value && props.activity?.organizer_id === currentUser.value.id
})

const isParticipant = computed(() => {
  return props.activity?.user_participation !== null
})

const canRegister = computed(() => {
  if (!props.activity) return false

  const now = new Date()
  const startTime = new Date(props.activity.start_time)
  const deadline = props.activity.registration_deadline
    ? new Date(props.activity.registration_deadline)
    : new Date(startTime.getTime() - 60 * 60 * 1000) // 1 hour before start

  return props.activity.status === 'published' &&
         now <= deadline &&
         (!props.activity.max_participants ||
          props.activity.current_participants < props.activity.max_participants)
})

const canCancelRegistration = computed(() => {
  if (!props.activity || !isParticipant.value) return false

  const now = new Date()
  const startTime = new Date(props.activity.start_time)
  const hoursUntilStart = (startTime - now) / (1000 * 60 * 60)

  return hoursUntilStart > 1 && props.activity.user_participation.attendance_status !== 'attended'
})

const canCheckIn = computed(() => {
  if (!props.activity || !isParticipant.value) return false

  const now = new Date()
  const startTime = new Date(props.activity.start_time)
  const endTime = new Date(props.activity.end_time)
  const checkinWindow = 30 * 60 * 1000 // 30 minutes
  const earliestCheckin = new Date(startTime.getTime() - checkinWindow)

  return now >= earliestCheckin &&
         now <= endTime &&
         props.activity.user_participation.attendance_status !== 'attended'
})

const hasFeesOrRewards = computed(() => {
  return props.activity?.entry_fee > 0 ||
         props.activity?.entry_fee_points > 0 ||
         props.activity?.reward_points > 0
})

// Methods
const closeModal = () => {
  emit('close')
}

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

const getOrganizerName = (organizer) => {
  if (!organizer) return 'Unknown'
  return `${organizer.first_name || ''} ${organizer.last_name || ''}`.trim()
}

const getInitials = (user) => {
  if (!user) return '?'
  const firstInitial = user.first_name ? user.first_name[0] : ''
  const lastInitial = user.last_name ? user.last_name[0] : ''
  return (firstInitial + lastInitial).toUpperCase() || '?'
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const highlightLocation = () => {
  if (props.activity.location_coordinates) {
    emit('location-highlight', props.activity.location_coordinates)
  }
}

const joinActivity = async () => {
  try {
    joining.value = true
    const result = await activityStore.joinActivity(props.activity.id)

    if (result.success) {
      emit('activity-joined', props.activity)
      message.success('Successfully joined the activity!')
    } else {
      message.error(result.error || 'Failed to join activity')
    }
  } catch (error) {
    console.error('Failed to join activity:', error)
    message.error('Failed to join activity')
  } finally {
    joining.value = false
  }
}

const leaveActivity = async () => {
  try {
    leaving.value = true
    const result = await activityStore.leaveActivity(props.activity.id)

    if (result.success) {
      emit('activity-left', props.activity)
      message.success('Successfully left the activity!')
    } else {
      message.error(result.error || 'Failed to leave activity')
    }
  } catch (error) {
    console.error('Failed to leave activity:', error)
    message.error('Failed to leave activity')
  } finally {
    leaving.value = false
  }
}

const checkIn = async () => {
  try {
    checkingIn.value = true
    const result = await activityStore.checkInActivity(props.activity.id, {
      checkinCode: checkinCode.value
    })

    if (result.success) {
      message.success(`Successfully checked in! Earned ${result.pointsEarned || 0} points.`)
      emit('activity-updated', props.activity)
    } else {
      message.error(result.error || 'Failed to check in')
    }
  } catch (error) {
    console.error('Failed to check in:', error)
    message.error('Failed to check in')
  } finally {
    checkingIn.value = false
  }
}

const editActivity = () => {
  // Emit event to parent to show edit form
  emit('edit-activity', props.activity)
}

const viewParticipants = () => {
  // Emit event to parent to show participants
  emit('view-participants', props.activity)
}

const deleteActivity = () => {
  // Show confirmation modal
  // Implementation would depend on your modal system
  message.warning('Delete functionality would be implemented with confirmation modal')
}
</script>

<style scoped>
.activity-detail {
  padding: 8px 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.activity-header {
  margin-bottom: 24px;
}

.activity-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.activity-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.organizer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.organizer-details {
  display: flex;
  flex-direction: column;
}

.organizer-name {
  font-weight: 600;
  color: #333;
}

.organizer-university {
  font-size: 12px;
  color: #666;
}

.activity-description {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  line-height: 1.6;
}

.activity-time-info {
  margin-bottom: 24px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.time-details {
  display: flex;
  flex-direction: column;
}

.time-label {
  font-size: 12px;
  color: #666;
}

.time-value {
  font-weight: 500;
  color: #333;
}

.activity-location {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 12px;
  border: 1px solid #e6f7ff;
  background: #f6ffed;
  border-radius: 6px;
}

.activity-participants {
  margin-bottom: 24px;
}

.participants-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
}

.participants-count {
  margin-left: auto;
  color: #666;
}

.participants-list {
  margin-top: 12px;
}

.activity-requirements,
.activity-tags-section,
.activity-fees,
.activity-contact {
  margin-bottom: 24px;
}

.activity-requirements h4,
.activity-tags-section h4,
.activity-fees h4,
.activity-contact h4 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.tags-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.fee-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fee-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-in-section {
  margin-top: 24px;
}

.check-in-form h4 {
  margin-bottom: 8px;
  color: #333;
}

.activity-actions-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.error-state {
  padding: 20px;
}

:deep(.ant-avatar-group .ant-avatar) {
  cursor: pointer;
}

:deep(.activity-detail-modal .ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>