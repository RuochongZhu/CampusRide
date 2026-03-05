<template>
  <div class="min-h-screen bg-[#EDEEE8] main-content pt-16">
    <div class="pt-8 pb-16 max-w-7xl mx-auto px-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-[#333333]">Participation History</h1>
          <p class="text-sm text-gray-600 mt-1">View all your activity participation records</p>
        </div>
        <a-button type="default" @click="() => $router.push('/activities')">
          <ArrowLeftOutlined /> Back to Activities
        </a-button>
      </div>

      <!-- Filter Tabs -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <a-radio-group v-model:value="historyType" button-style="solid" @change="loadHistory">
          <a-radio-button value="participated">Activities I Participated In</a-radio-button>
          <a-radio-button value="organized">Activities I Organized</a-radio-button>
        </a-radio-group>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm p-12 text-center">
        <a-spin size="large" />
        <p class="mt-4 text-gray-500">Loading history...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <div class="text-red-500 mb-4">
          <WarningOutlined style="font-size: 48px;" />
        </div>
        <p class="text-gray-600">{{ error }}</p>
        <a-button type="primary" class="mt-4 bg-[#C24D45] border-none hover:bg-[#A93C35]" @click="loadHistory">
          Retry
        </a-button>
      </div>

      <!-- Empty State -->
      <div v-else-if="activities.length === 0" class="bg-white rounded-lg shadow-sm p-12 text-center">
        <div class="text-gray-400 mb-4">
          <InboxOutlined style="font-size: 64px;" />
        </div>
        <h3 class="text-lg font-medium text-gray-600 mb-2">No History Records</h3>
        <p class="text-sm text-gray-500 mb-4">
          {{ historyType === 'participated' ? 'You haven\'t participated in any activities yet' : 'You haven\'t organized any activities yet' }}
        </p>
        <a-button type="primary" class="bg-[#C24D45] border-none hover:bg-[#A93C35]" @click="() => $router.push('/activities')">
          Browse Activities
        </a-button>
      </div>

      <!-- Activities List -->
      <div v-else class="space-y-4">
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all cursor-pointer"
          @click="goToActivityDetail(activity.id)"
        >
          <!-- Activity Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-grow">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-medium text-[#333333]">{{ activity.title }}</h3>
                <a-tag :color="getCategoryColor(activity.category)">
                  {{ getCategoryLabel(activity.category) }}
                </a-tag>
                <a-tag :color="getStatusColor(activity.status)">
                  {{ getStatusLabel(activity.status) }}
                </a-tag>
              </div>
              <p class="text-sm text-gray-600 line-clamp-2">{{ activity.description }}</p>
            </div>
          </div>

          <!-- Activity Details -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <!-- Time Info -->
            <div class="flex items-center text-sm text-gray-600">
              <ClockCircleOutlined class="mr-2 text-[#C24D45]" />
              <div>
                <div class="font-medium">Activity Time</div>
                <div>{{ formatDateTime(activity.start_time) }}</div>
              </div>
            </div>

            <!-- Location Info -->
            <div class="flex items-center text-sm text-gray-600">
              <EnvironmentOutlined class="mr-2 text-[#C24D45]" />
              <div>
                <div class="font-medium">Activity Location</div>
                <div>{{ activity.location || 'TBD' }}</div>
              </div>
            </div>

            <!-- Participants Info -->
            <div class="flex items-center text-sm text-gray-600">
              <TeamOutlined class="mr-2 text-[#C24D45]" />
              <div>
                <div class="font-medium">Participant Count</div>
                <div>{{ activity.current_participants || 0 }} / {{ activity.max_participants || 'Unlimited' }}</div>
              </div>
            </div>
          </div>

          <!-- Participation Info (for participated activities) -->
          <div v-if="historyType === 'participated' && activity.user_participation" class="border-t pt-4 mt-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-6">
                <!-- Registration Time -->
                <div class="text-sm">
                  <span class="text-gray-500">Registration Time:</span>
                  <span class="text-gray-700">{{ formatDateTime(activity.user_participation.registration_time) }}</span>
                </div>

                <!-- Check-in Status -->
                <div class="text-sm">
                  <span class="text-gray-500">Check-in Status:</span>
                  <a-tag
                    v-if="activity.user_participation.attendance_status === 'attended'"
                    color="success"
                  >
                    <CheckCircleOutlined /> Checked In
                  </a-tag>
                  <a-tag v-else-if="activity.user_participation.attendance_status === 'absent'" color="error">
                    <CloseCircleOutlined /> Absent
                  </a-tag>
                  <a-tag v-else color="default">
                    Not Checked In
                  </a-tag>
                </div>

                <!-- Check-in Time (if checked in) -->
                <div v-if="activity.user_participation.checkin_time" class="text-sm">
                  <span class="text-gray-500">Check-in Time:</span>
                  <span class="text-gray-700">{{ formatDateTime(activity.user_participation.checkin_time) }}</span>
                </div>
              </div>

              <!-- Points Earned -->
              <div v-if="activity.reward_points && activity.user_participation.attendance_status === 'attended'" class="flex items-center">
                <span class="text-green-600 font-medium flex items-center">
                  <span class="mr-1">⭐</span>
                  +{{ activity.reward_points }} Points
                </span>
              </div>
            </div>
          </div>

          <!-- Organizer Stats (for organized activities) -->
          <div v-if="historyType === 'organized'" class="border-t pt-4 mt-4">
            <div class="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div class="text-2xl font-bold text-blue-600">{{ activity.current_participants || 0 }}</div>
                <div class="text-gray-500">Total Registrations</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">{{ activity.checked_in_count || 0 }}</div>
                <div class="text-gray-500">Checked In</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-orange-600">
                  {{ activity.current_participants ? Math.round((activity.checked_in_count || 0) / activity.current_participants * 100) : 0 }}%
                </div>
                <div class="text-gray-500">Check-in Rate</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="total > limit" class="flex justify-center mt-8">
          <a-pagination
            v-model:current="currentPage"
            :total="total"
            :page-size="limit"
            show-size-changer
            :page-size-options="['10', '20', '50']"
            @change="onPageChange"
            @show-size-change="onPageSizeChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InboxOutlined
} from '@ant-design/icons-vue'
import { activitiesAPI } from '@/utils/api'

const router = useRouter()

// State
const historyType = ref('participated') // 'participated' or 'organized'
const activities = ref([])
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const limit = ref(20)
const total = ref(0)

// Category colors mapping
const CATEGORY_COLORS = {
  academic: 'blue',
  sports: 'orange',
  social: 'purple',
  volunteer: 'green',
  career: 'red',
  cultural: 'cyan',
  technology: 'geekblue'
}

// Category labels mapping
const CATEGORY_LABELS = {
  academic: 'Academic',
  sports: 'Sports',
  social: 'Social',
  volunteer: 'Volunteer',
  career: 'Career',
  cultural: 'Cultural',
  technology: 'Technology'
}

// Status colors mapping
const STATUS_COLORS = {
  draft: 'default',
  published: 'blue',
  ongoing: 'orange',
  completed: 'green',
  cancelled: 'red'
}

// Status labels mapping
const STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

// Load history data
const loadHistory = async () => {
  try {
    loading.value = true
    error.value = null

    const offset = (currentPage.value - 1) * limit.value
    const response = await activitiesAPI.getHistoryActivities({
      type: historyType.value,
      limit: limit.value,
      offset: offset
    })

    if (response.data.success) {
      activities.value = response.data.data.activities || []
      total.value = response.data.data.total || 0
    } else {
      throw new Error(response.data.error?.message || 'Failed to load history')
    }
  } catch (err) {
    console.error('Failed to load activity history:', err)
    error.value = err.response?.data?.error?.message || err.message || 'Failed to load history'
    message.error(error.value)
  } finally {
    loading.value = false
  }
}

// Format date time
const formatDateTime = (dateString) => {
  if (!dateString) return 'TBD'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get category color
const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || 'default'
}

// Get category label
const getCategoryLabel = (category) => {
  return CATEGORY_LABELS[category] || category
}

// Get status color
const getStatusColor = (status) => {
  return STATUS_COLORS[status] || 'default'
}

// Get status label
const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status
}

// Go to activity detail
const goToActivityDetail = (activityId) => {
  router.push(`/activities/${activityId}`)
}

// Page change handler
const onPageChange = (page) => {
  currentPage.value = page
  loadHistory()
}

// Page size change handler
const onPageSizeChange = (current, pageSize) => {
  currentPage.value = 1
  limit.value = pageSize
  loadHistory()
}

// Load data on mount
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.main-content {
  flex: 1;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
