<template>
  <div class="min-h-screen bg-gradient-to-br from-[#EDEEE8] to-[#E8F4F8] main-content pt-16">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center min-h-96">
        <a-spin size="large" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-16">
        <div class="text-red-500 text-xl mb-4">{{ error }}</div>
        <a-button @click="goBack" type="primary">Go Back</a-button>
      </div>

      <!-- Activity Detail -->
      <div v-else-if="activity" class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- Back Button -->
        <div class="p-6 border-b border-gray-200">
          <a-button
            @click="goBack"
            type="text"
            size="large"
            class="!text-[#C24D45] hover:!bg-[#FFF5F5] !border-none !shadow-none"
          >
            <template #icon>
              <ArrowLeftOutlined />
            </template>
            Back to Activities
          </a-button>
        </div>

        <!-- Header Image -->
        <div class="h-64 bg-gradient-to-r from-[#C24D45] to-[#E74C3C] relative">
          <div class="absolute inset-0 bg-black bg-opacity-20"></div>
          <div class="absolute bottom-6 left-6 text-white">
            <h1 class="text-4xl font-bold mb-2">{{ activity.title }}</h1>
            <div class="flex items-center space-x-4">
              <a-tag :color="getCategoryColor(activity.category)" class="text-lg px-4 py-2">
                {{ getCategoryName(activity.category) }}
              </a-tag>
              <a-tag :color="getStatusColor(activity.status)" class="text-lg px-4 py-2">
                {{ getStatusName(activity.status) }}
              </a-tag>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-8">
          <!-- Organizer Info -->
          <div class="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
            <img
              :src="activity.organizer?.avatar_url || defaultAvatar"
              :alt="getOrganizerName()"
              class="w-12 h-12 rounded-full object-cover mr-4"
              @error="handleAvatarError"
            />
            <div>
              <div class="font-semibold text-lg">Organizer</div>
              <div class="text-gray-600">{{ getOrganizerName() }}</div>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-8">
            <h3 class="text-2xl font-bold mb-4 text-[#333333]">Description</h3>
            <p class="text-gray-700 leading-relaxed text-lg">{{ activity.description || 'No description available' }}</p>
          </div>

          <!-- Activity Details - Unified Info Card -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
            <div class="p-6">
              <h3 class="text-2xl font-bold mb-6 text-[#333333] flex items-center">
                <InfoCircleOutlined class="text-2xl text-[#C24D45] mr-3" />
                Activity Details
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <!-- Time Info -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <ClockCircleOutlined class="text-blue-500 mr-2" />
                    Time Information
                  </h4>
                  <div class="space-y-2 ml-6">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Start Time:</span>
                      <span class="text-gray-900">{{ formatDateTime(activity.start_time) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">End Time:</span>
                      <span class="text-gray-900">{{ formatDateTime(activity.end_time) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Duration:</span>
                      <span class="text-gray-900">{{ getDuration(activity.start_time, activity.end_time) }}</span>
                    </div>
                    <div v-if="activity.checkin_enabled" class="flex justify-between">
                      <span class="text-gray-600">Check-in Status:</span>
                      <span :class="getCheckinStatusClass()">{{ getCheckinStatusText() }}</span>
                    </div>
                  </div>
                </div>

                <!-- Location Info -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <EnvironmentOutlined class="text-green-500 mr-2" />
                    Location Information
                  </h4>
                  <div class="space-y-2 ml-6">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Venue:</span>
                      <span class="text-gray-900">{{ activity.location || 'TBD' }}</span>
                    </div>
                    <div v-if="activity.locationDetails" class="flex justify-between">
                      <span class="text-gray-600">Address:</span>
                      <span class="text-gray-900">{{ activity.locationDetails }}</span>
                    </div>
                    <div v-if="activity.location_verification" class="flex justify-between">
                      <span class="text-gray-600">Location Verification:</span>
                      <span class="text-orange-600 font-medium">Required (within {{ activity.verification_radius || 50 }}m)</span>
                    </div>
                  </div>
                </div>

                <!-- Participants Info -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <TeamOutlined class="text-purple-500 mr-2" />
                    Participation
                  </h4>
                  <div class="space-y-2 ml-6">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Current:</span>
                      <span class="text-gray-900">{{ activity.current_participants || 0 }} people</span>
                    </div>
                    <div v-if="activity.max_participants" class="flex justify-between">
                      <span class="text-gray-600">Maximum:</span>
                      <span class="text-gray-900">{{ activity.max_participants }} people</span>
                    </div>
                    <div v-if="activity.max_participants" class="mt-3">
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          :style="{ width: getParticipationPercentage() + '%' }"
                        ></div>
                      </div>
                      <div class="text-sm text-gray-600 mt-1">
                        {{ getParticipationPercentage() }}% full
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Additional Info -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <InfoCircleOutlined class="text-orange-500 mr-2" />
                    Additional Information
                  </h4>
                  <div class="space-y-2 ml-6">
                    <div v-if="activity.entry_fee" class="flex justify-between">
                      <span class="text-gray-600">Entry Fee:</span>
                      <span class="text-gray-900">${{ activity.entry_fee }}</span>
                    </div>
                    <div v-if="activity.reward_points" class="flex justify-between">
                      <span class="text-gray-600">Reward Points:</span>
                      <span class="text-gray-900">{{ activity.reward_points }} points</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Created:</span>
                      <span class="text-gray-900">{{ formatDateTime(activity.created_at) }}</span>
                    </div>
                    <div class="text-center">
                      <span class="text-sm text-[#C24D45]">({{ getTimeAgo(activity.created_at) }})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Real-time check-in status display -->
          <div v-if="activity.checkin_enabled" class="bg-blue-50 border border-blue-200 rounded-xl shadow-sm mb-8">
            <div class="p-6">
              <h3 class="text-2xl font-bold mb-6 text-[#333333] flex items-center">
                <ClockCircleOutlined class="text-2xl text-blue-600 mr-3" />
                Real-time Check-in Status
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Check-in time status -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-blue-800">Time Status</h4>
                  <div class="bg-white rounded-lg p-4">
                    <div class="text-blue-700 font-medium mb-2">{{ getCheckinTimeStatus }}</div>
                    <div class="text-sm text-gray-600">
                      Current Time: {{ getCurrentTimeString }}
                    </div>
                  </div>
                </div>

                <!-- Check-in condition checks -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-blue-800">Check-in Requirements</h4>
                  <div class="bg-white rounded-lg p-4 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Activity Registration:</span>
                      <span :class="activity.isRegistered ? 'text-green-600' : 'text-red-600'">
                        <CheckCircleOutlined v-if="activity.isRegistered" class="mr-1" />
                        <CloseCircleOutlined v-else class="mr-1" />
                        {{ activity.isRegistered ? 'Registered' : 'Not Registered' }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Check-in Window:</span>
                      <span :class="isWithinCheckinWindow ? 'text-green-600' : 'text-orange-600'">
                        <CheckCircleOutlined v-if="isWithinCheckinWindow" class="mr-1" />
                        <ClockCircleOutlined v-else class="mr-1" />
                        {{ isWithinCheckinWindow ? 'Open' : 'Not Open' }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">Check-in Status:</span>
                      <span :class="activity.user_checked_in ? 'text-green-600' : 'text-gray-600'">
                        <CheckCircleOutlined v-if="activity.user_checked_in" class="mr-1" />
                        <ClockCircleOutlined v-else class="mr-1" />
                        {{ activity.user_checked_in ? 'Completed' : 'Not Completed' }}
                      </span>
                    </div>
                    <div v-if="activity.location_verification" class="flex items-center justify-between">
                      <span class="text-gray-600">Location Verification:</span>
                      <span class="text-orange-600">
                        <EnvironmentOutlined class="mr-1" />
                        Required (within {{ activity.verification_radius || 50 }}m)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Check-in button status summary -->
              <div class="mt-6 p-4 rounded-lg" :class="canPerformCheckin ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'">
                <div class="flex items-center justify-center">
                  <div class="text-center">
                    <div v-if="canPerformCheckin" class="text-green-700 font-bold text-lg mb-2">
                      <CheckCircleOutlined class="mr-2 text-2xl" />
                      Ready to Check-in
                    </div>
                    <div v-else-if="activity.user_checked_in" class="text-green-700 font-bold text-lg mb-2">
                      <CheckCircleOutlined class="mr-2 text-2xl" />
                      Check-in Complete
                    </div>
                    <div v-else class="text-gray-700 font-bold text-lg mb-2">
                      <ClockCircleOutlined class="mr-2 text-2xl" />
                      Check-in Not Available
                    </div>
                    <div class="text-sm text-gray-600">
                      Check-in window: {{ activity.checkin_start_offset || 30 }} min before to {{ activity.checkin_end_offset || 30 }} min after activity
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Requirements -->
          <div v-if="activity.requirements" class="mb-8">
            <h3 class="text-2xl font-bold mb-4 text-[#333333]">Requirements</h3>
            <div class="bg-yellow-50 p-6 rounded-xl">
              <p class="text-gray-700 leading-relaxed">{{ activity.requirements }}</p>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="activity.tags && activity.tags.length > 0" class="mb-8">
            <h3 class="text-2xl font-bold mb-4 text-[#333333]">Tags</h3>
            <div class="flex flex-wrap gap-2">
              <a-tag
                v-for="tag in activity.tags"
                :key="tag"
                color="blue"
                class="text-sm px-3 py-1"
              >
                {{ tag }}
              </a-tag>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <!-- Check-in Button - Always show for registered users (unless already checked in) -->
            <a-tooltip v-if="activity.isRegistered && !activity.user_checked_in" :title="getCheckinButtonTooltip()">
              <a-button
                type="primary"
                size="large"
                :class="canPerformCheckin ?
                  '!rounded-lg bg-gradient-to-r from-green-500 to-green-600 border-none hover:from-green-600 hover:to-green-700 text-white flex-1' :
                  '!rounded-lg bg-gray-400 border-none text-white flex-1 cursor-not-allowed'"
                @click="canPerformCheckin ? openActivityCheckinModal() : null"
                :disabled="!canPerformCheckin"
              >
                <CheckCircleOutlined class="mr-2" />
                {{ canPerformCheckin ? 'Check In' : getCheckinButtonLabel() }}
              </a-button>
            </a-tooltip>

            <!-- Already checked in indicator -->
            <div
              v-if="activity.user_checked_in && activity.isRegistered"
              class="flex items-center justify-center bg-green-50 border border-green-200 rounded-lg p-3 flex-1"
            >
              <CheckCircleOutlined class="text-green-600 mr-2" />
              <span class="text-green-800 font-medium">Checked In</span>
            </div>

            <!-- Join Activity button for non-registered users -->
            <a-button
              v-if="!activity.isOwner && !activity.isRegistered"
              type="primary"
              size="large"
              class="!rounded-lg bg-gradient-to-r from-[#C24D45] to-[#A93C35] border-none hover:from-[#A93C35] hover:to-[#8F2B25] text-white flex-1"
              @click="joinActivity"
              :loading="isJoining"
              :disabled="isActivityFull()"
            >
              <UserAddOutlined class="mr-2" />
              {{ isActivityFull() ? 'Activity Full' : 'Join Activity' }}
            </a-button>

            <!-- Leave Activity button for registered users who haven't checked in -->
            <a-button
              v-if="!activity.isOwner && activity.isRegistered && !activity.user_checked_in && (!activity.checkin_enabled || !canPerformCheckin)"
              size="large"
              class="!rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 border-none hover:from-gray-600 hover:to-gray-700 text-white flex-1"
              @click="cancelRegistration"
              :loading="isCancelling"
            >
              <UserDeleteOutlined class="mr-2" />
              Leave Activity
            </a-button>

            <!-- Comment Button - Show for all users -->
            <a-button
              type="default"
              size="large"
              class="!rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 border-none hover:from-blue-600 hover:to-blue-700 text-white flex-1"
              @click="openCommentModal"
            >
              <MessageOutlined class="mr-2" />
              Add Comment
            </a-button>

            <!-- Edit Activity button - Show for activity owners -->
            <a-button
              v-if="activity.isOwner"
              type="primary"
              size="large"
              class="!rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 border-none hover:from-blue-600 hover:to-blue-700 flex-1"
              @click="editActivity"
            >
              <EditOutlined class="mr-2" />
              Edit Activity
            </a-button>

            <!-- Delete Activity button - Show for activity owners -->
            <a-button
              v-if="activity.isOwner"
              danger
              size="large"
              class="!rounded-lg flex-1"
              @click="deleteActivity"
              :loading="isDeleting"
            >
              <DeleteOutlined class="mr-2" />
              Delete Activity
            </a-button>

            <!-- Back button - Always visible -->
            <a-button
              size="large"
              class="!rounded-lg flex-1"
              @click="goBack"
            >
              <ArrowLeftOutlined class="mr-2" />
              Back
            </a-button>
          </div>

          <!-- Comments Section -->
          <div class="mt-8 pt-8 border-t border-gray-200">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-bold text-[#333333]">Activity Comments</h3>
              <span class="text-gray-500">{{ comments.length }} {{ comments.length === 1 ? 'comment' : 'comments' }}</span>
            </div>

            <!-- Comments List -->
            <div v-if="commentsLoading" class="text-center py-8">
              <a-spin />
            </div>
            <div v-else-if="comments.length === 0" class="text-center py-8 text-gray-500">
              <MessageOutlined class="text-4xl mb-4" />
              <p>No comments yet. Be the first to leave a comment!</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="bg-gray-50 p-4 rounded-lg"
              >
                <div class="flex items-start space-x-3">
                  <img
                    :src="comment.user?.avatar_url || defaultAvatar"
                    :alt="getCommentUserName(comment)"
                    class="w-10 h-10 rounded-full object-cover"
                    @error="handleAvatarError"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class="font-medium text-gray-900">{{ getCommentUserName(comment) }}</span>
                      <span class="text-sm text-gray-500">{{ formatCommentTime(comment.created_at) }}</span>
                    </div>
                    <p class="text-gray-700 leading-relaxed">{{ comment.content }}</p>
                  </div>
                  <div v-if="comment.user_id === currentUserId" class="flex-shrink-0">
                    <a-button
                      type="text"
                      size="small"
                      danger
                      @click="deleteComment(comment.id)"
                      :loading="comment.deleting"
                    >
                      <DeleteOutlined />
                    </a-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Location Check-in Modal (using ActivityCheckinModal) -->
      <ActivityCheckinModal
        v-if="activity"
        v-model:open="showActivityCheckinModal"
        :activity="activity"
        @checkin-success="handleActivityCheckinSuccess"
      />

      <!-- Comments Modal -->
      <ContactOrganizerModal
        v-model:visible="showCommentModal"
        :activity="activity"
        @success="handleCommentSuccess"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons-vue'
import { activitiesAPI } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import ActivityCheckinModal from '@/components/activities/ActivityCheckinModal.vue'
import ContactOrganizerModal from '@/components/activities/ContactOrganizerModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Default avatar
const defaultAvatar = '/Profile_Photo.jpg'

const storedUser = ref(null)
try {
  storedUser.value = JSON.parse(localStorage.getItem('userData') || 'null')
} catch (error) {
  storedUser.value = null
}

const currentUserId = computed(() => authStore.userId || storedUser.value?.id || null)

// Reactive data
const activity = ref(null)
const participants = ref([])
const comments = ref([])
const isLoading = ref(true)
const error = ref(null)
const isJoining = ref(false)
const isCancelling = ref(false)
const isDeleting = ref(false)
const commentsLoading = ref(false)
const showActivityCheckinModal = ref(false)
const showCommentModal = ref(false)

// Real-time state management
const currentTime = ref(new Date())
const refreshTimer = ref(null)

// Real-time time management functions
const startTimeRefresh = () => {
  refreshTimer.value = setInterval(() => {
    currentTime.value = new Date()
  }, 1000) // Update every second
}

const stopTimeRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const normalizeActivity = (raw) => {
  if (!raw) return null

  const participants = raw.participants || []
  const directParticipation = raw.user_participation || raw.userParticipation || raw.participation
  const fallbackParticipation = participants.find((participant) => {
    const participantUserId = participant.user_id || participant.user?.id || participant.userId
    return currentUserId.value && participantUserId === currentUserId.value
  })

  const resolvedParticipation = directParticipation || fallbackParticipation || null

  return {
    ...raw,
    organizer: raw.organizer || null,
    location: raw.location || 'TBD',
    locationDetails: raw.location_coordinates?.address || null,
    current_participants: raw.current_participants || 0,
    max_participants: raw.max_participants,
    reward_points: raw.reward_points || 0,
    entry_fee: raw.entry_fee || 0,
    isOwner: currentUserId.value ? raw.organizer_id === currentUserId.value : false,
    isRegistered: Boolean(resolvedParticipation),
    user_participation: resolvedParticipation,
    location_verification: Boolean(raw.location_verification),
    max_checkin_distance: raw.max_checkin_distance || raw.verification_radius || 50,
    location_coordinates: raw.location_coordinates || null,
    checkin_enabled: raw.checkin_enabled !== undefined ? raw.checkin_enabled : true,
    checkin_start_offset: raw.checkin_start_offset ?? 30,
    checkin_end_offset: raw.checkin_end_offset ?? 30,
    verification_radius: raw.verification_radius || 50,
    user_checked_in: Boolean(
      resolvedParticipation?.checked_in ||
      resolvedParticipation?.attendance_status === 'attended'
    )
  }
}

const isWithinCheckinWindow = computed(() => {
  if (!activity.value?.start_time || !activity.value?.end_time) return false

  const now = currentTime.value // Use real-time
  const start = new Date(activity.value.start_time)
  const end = new Date(activity.value.end_time)
  const startOffset = activity.value.checkin_start_offset ?? 30
  const endOffset = activity.value.checkin_end_offset ?? 30

  const windowStart = new Date(start.getTime() - startOffset * 60 * 1000)
  const windowEnd = new Date(end.getTime() + endOffset * 60 * 1000)

  return now >= windowStart && now <= windowEnd
})

const canPerformCheckin = computed(() => {
  if (!activity.value) return false
  if (!activity.value.isRegistered) return false
  if (activity.value.user_checked_in) return false
  if (activity.value.checkin_enabled === false) return false
  if (!isWithinCheckinWindow.value) return false
  return true
})

// Real-time check-in time status
const getCheckinTimeStatus = computed(() => {
  if (!activity.value?.start_time || !activity.value?.end_time) return 'Time not set'

  const now = currentTime.value
  const start = new Date(activity.value.start_time)
  const end = new Date(activity.value.end_time)
  const startOffset = activity.value.checkin_start_offset ?? 30
  const endOffset = activity.value.checkin_end_offset ?? 30

  const windowStart = new Date(start.getTime() - startOffset * 60 * 1000)
  const windowEnd = new Date(end.getTime() + endOffset * 60 * 1000)

  if (now < windowStart) {
    const minutesUntil = Math.ceil((windowStart - now) / (1000 * 60))
    const hours = Math.floor(minutesUntil / 60)
    const minutes = minutesUntil % 60

    if (hours > 0) {
      return `Check-in starts in ${hours}h ${minutes}m`
    } else {
      return `Check-in starts in ${minutes} minutes`
    }
  } else if (now > windowEnd) {
    const minutesSince = Math.floor((now - windowEnd) / (1000 * 60))
    const hours = Math.floor(minutesSince / 60)
    const minutes = minutesSince % 60

    if (hours > 0) {
      return `Check-in ended ${hours}h ${minutes}m ago`
    } else {
      return `Check-in ended ${minutes} minutes ago`
    }
  } else {
    const minutesLeft = Math.floor((windowEnd - now) / (1000 * 60))
    const hours = Math.floor(minutesLeft / 60)
    const minutes = minutesLeft % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes} minutes remaining`
    }
  }
})

// Format current time display
const getCurrentTimeString = computed(() => {
  return currentTime.value.toLocaleTimeString('en-US')
})

// Fetch activity details
const fetchActivityDetails = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const activityId = route.params.id
    const response = await activitiesAPI.getActivity(activityId)
    
    if (response.data?.success) {
      const payload = response.data.data || {}
      activity.value = normalizeActivity(payload.activity)
      if (!activity.value) {
        error.value = 'Activity not found'
      }
    } else {
      error.value = response.data?.error?.message || 'Failed to load activity details'
    }
  } catch (err) {
    console.error('❌ Error fetching activity details:', err)
    error.value = err.response?.data?.error?.message || 'Failed to load activity details'
  } finally {
    isLoading.value = false
  }
}

// Join activity
const joinActivity = async () => {
  try {
    isJoining.value = true
    
    const response = await activitiesAPI.joinActivity(activity.value.id)
    
    if (response.data?.success) {
      const payload = response.data.data || {}
      message.success('Successfully joined the activity!')
      activity.value.isRegistered = true
      activity.value.current_participants = (activity.value.current_participants || 0) + 1
      activity.value.user_participation = payload.participation || null
    }
  } catch (err) {
    console.error('❌ Error joining activity:', err)
    message.error(err.response?.data?.error?.message || 'Failed to join activity')
  } finally {
    isJoining.value = false
  }
}

// Cancel registration
const cancelRegistration = async () => {
  try {
    isCancelling.value = true
    
    const response = await activitiesAPI.leaveActivity(activity.value.id)
    
    if (response.data?.success) {
      message.success('Left activity successfully')
      activity.value.isRegistered = false
      activity.value.current_participants = Math.max(0, (activity.value.current_participants || 1) - 1)
      activity.value.user_participation = null
    }
  } catch (err) {
    console.error('❌ Error cancelling registration:', err)
    message.error(err.response?.data?.error?.message || 'Failed to leave activity')
  } finally {
    isCancelling.value = false
  }
}

// Delete activity
const deleteActivity = async () => {
  try {
    isDeleting.value = true
    
    const response = await activitiesAPI.deleteActivity(activity.value.id)
    
    if (response.data?.success) {
      message.success('Activity deleted successfully')
      router.push('/activities')
    }
  } catch (err) {
    console.error('❌ Error deleting activity:', err)
    message.error(err.response?.data?.error?.message || 'Failed to delete activity')
  } finally {
    isDeleting.value = false
  }
}

// Edit activity
const editActivity = () => {
  // For now, just show a message since edit route might not exist
  message.info('Edit feature is under development, coming soon!')
  // router.push(`/activities/${activity.value.id}/edit`)
}

// Open location check-in modal
const openActivityCheckinModal = () => {
  showActivityCheckinModal.value = true
}

// Open comment modal
const openCommentModal = () => {
  showCommentModal.value = true
}

// Handle comment success
const handleCommentSuccess = async (newComment) => {
  showCommentModal.value = false
  await fetchComments()
}

// Fetch comments
const fetchComments = async () => {
  if (!activity.value?.id) return

  try {
    commentsLoading.value = true
    const response = await activitiesAPI.getComments(activity.value.id)

    if (response.data?.success) {
      comments.value = response.data.data.comments || []
    }
  } catch (err) {
    console.error('❌ Error fetching comments:', err)
    // Don't show error message to user
    comments.value = []
  } finally {
    commentsLoading.value = false
  }
}

// Delete comment
const deleteComment = async (commentId) => {
  try {
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) comment.deleting = true

    const response = await activitiesAPI.deleteComment(activity.value.id, commentId)

    if (response.data?.success) {
      comments.value = comments.value.filter(c => c.id !== commentId)
      message.success('Comment deleted successfully')
    }
  } catch (err) {
    console.error('❌ Error deleting comment:', err)
    message.error(err.response?.data?.error?.message || 'Failed to delete comment')
  } finally {
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) comment.deleting = false
  }
}

// Comment utility functions
const getCommentUserName = (comment) => {
  if (!comment.user) return 'Unknown User'
  return comment.user.name || comment.user.email || 'Unknown User'
}

const getCommentUserInitial = (comment) => {
  if (!comment.user) return 'U'
  const name = comment.user.name || comment.user.email || 'Unknown'
  return name.charAt(0).toUpperCase()
}

const formatCommentTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} days ago`

  return date.toLocaleDateString('en-US')
}

// Handle location check-in success
const handleActivityCheckinSuccess = async (payload) => {
  const points = payload?.result?.pointsAwarded ?? activity.value?.reward_points ?? 0
  if (points > 0) {
    message.success(`Check-in successful! Earned ${points} points!`)
  } else {
    message.success('Check-in successful!')
  }
  if (activity.value?.user_participation) {
    activity.value.user_participation.checked_in = true
    activity.value.user_participation.checkin_time = payload?.result?.checkinTime || new Date().toISOString()
  }
  activity.value.user_checked_in = true
  showActivityCheckinModal.value = false
  await fetchActivityDetails()
}

// Handle contact success
const handleContactSuccess = () => {
  message.success('Message sent successfully!')
  showContactModal.value = false
}

// Fetch participants for QR code modal
const fetchParticipants = async () => {
  try {
    const response = await activitiesAPI.getActivityParticipants(activity.value.id)
    if (response.data?.success) {
      participants.value = response.data.data.participants || []
    }
  } catch (err) {
    console.error('❌ Error fetching participants:', err)
    // Don't show error message, just use empty array
    participants.value = []
  }
}

// Go back
const goBack = () => {
  router.back()
}

// Utility functions
const formatDateTime = (dateString) => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 'TBD'
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end - start
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffHours > 0) {
    return `${diffHours}h${diffMinutes > 0 ? ' ' + diffMinutes + 'm' : ''}`
  } else {
    return `${diffMinutes}m`
  }
}

const getParticipationPercentage = () => {
  if (!activity.value.max_participants) return 0
  return Math.round((activity.value.current_participants / activity.value.max_participants) * 100)
}

const isActivityFull = () => {
  return activity.value.max_participants && 
         activity.value.current_participants >= activity.value.max_participants
}

const getTimeAgo = (dateString) => {
  if (!dateString) {
    return 'Unknown time'
  }

  const now = new Date()
  const date = new Date(dateString)

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid time'
  }

  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours} hours ago`
  } else if (diffInMinutes < 10080) { // 7 days
    const days = Math.floor(diffInMinutes / 1440)
    return `${days} days ago`
  } else {
    const weeks = Math.floor(diffInMinutes / 10080)
    return `${weeks} weeks ago`
  }
}

const getCategoryColor = (category) => {
  const colors = {
    academic: 'blue',
    sports: 'green',
    social: 'purple',
    volunteer: 'orange',
    career: 'red',
    cultural: 'cyan',
    technology: 'geekblue'
  }
  return colors[category] || 'default'
}

const getCategoryName = (category) => {
  const names = {
    academic: 'Academic',
    sports: 'Sports',
    social: 'Social',
    volunteer: 'Volunteer',
    career: 'Career',
    cultural: 'Cultural',
    technology: 'Technology'
  }
  return names[category] || category
}

const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    published: 'green',
    ongoing: 'blue',
    completed: 'purple',
    cancelled: 'red',
    archived: 'gray'
  }
  return colors[status] || 'default'
}

const getStatusName = (status) => {
  const names = {
    draft: 'Draft',
    published: 'Published',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    archived: 'Archived'
  }
  return names[status] || status
}

const getOrganizerName = () => {
  if (!activity.value?.organizer) return 'Unknown'
  return activity.value.organizer.name || activity.value.organizer.email || 'Unknown'
}

const getOrganizerInitial = () => {
  if (!activity.value?.organizer) return 'O'
  const name = activity.value.organizer.name || activity.value.organizer.email || 'Organizer'
  return name.charAt(0).toUpperCase()
}

const handleAvatarError = (e) => {
  e.target.src = defaultAvatar
}

const getCheckinStatusText = () => {
  if (!activity.value) return 'Unknown'

  if (activity.value.user_checked_in) {
    return 'Checked In'
  }

  if (!activity.value.isRegistered) {
    return 'Not Registered'
  }

  if (!activity.value.checkin_enabled) {
    return 'Check-in Disabled'
  }

  if (canPerformCheckin.value) {
    return 'Ready to Check In'
  }

  if (isWithinCheckinWindow.value) {
    return 'Check-in Window Open'
  }

  return 'Check-in Window Closed'
}

const getCheckinStatusClass = () => {
  if (!activity.value) return 'text-gray-900'

  if (activity.value.user_checked_in) {
    return 'text-green-600 font-medium'
  }

  if (!activity.value.isRegistered || !activity.value.checkin_enabled) {
    return 'text-gray-500'
  }

  if (canPerformCheckin.value) {
    return 'text-green-600 font-medium'
  }

  if (isWithinCheckinWindow.value) {
    return 'text-blue-600'
  }

  return 'text-gray-900'
}

const getCheckinButtonTooltip = () => {
  if (!activity.value) return ''

  if (canPerformCheckin.value) {
    return 'Click to check in to the activity'
  }

  if (!activity.value.isRegistered) {
    return 'Please join the activity first to check in'
  }

  if (!activity.value.checkin_enabled) {
    return 'Check-in is not enabled for this activity'
  }

  if (activity.value.user_checked_in) {
    return 'You have already checked in'
  }

  if (!isWithinCheckinWindow.value) {
    const now = new Date()
    const start = new Date(activity.value.start_time)
    const startOffset = activity.value.checkin_start_offset ?? 30
    const checkinStart = new Date(start.getTime() - startOffset * 60 * 1000)

    if (now < checkinStart) {
      const minutesUntil = Math.ceil((checkinStart - now) / (1000 * 60))
      if (minutesUntil < 60) {
        return `Check-in starts in ${minutesUntil} minutes`
      } else {
        const hoursUntil = Math.floor(minutesUntil / 60)
        const remainingMinutes = minutesUntil % 60
        return `Check-in starts in ${hoursUntil} hours ${remainingMinutes} minutes`
      }
    } else {
      return 'Check-in time has passed'
    }
  }

  return 'Check-in not available'
}

const getCheckinButtonLabel = () => {
  if (!activity.value) return 'Check-in Unavailable'

  if (!activity.value.checkin_enabled) {
    return 'Check-in Disabled'
  }

  if (!isWithinCheckinWindow.value) {
    return 'Check-in Closed'
  }

  return 'Check-in Unavailable'
}

// Lifecycle
onMounted(async () => {
  startTimeRefresh() // Start real-time updates
  await fetchActivityDetails()
  if (activity.value) {
    await fetchComments()
  }
})

onUnmounted(() => {
  stopTimeRefresh() // Clean up timer
})
</script>

<style scoped>
.main-content {
  min-height: 100vh;
}
</style>
