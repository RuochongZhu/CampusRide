<template>
  <div class="min-h-screen bg-gradient-to-br from-[#EDEEE8] to-[#E8F4F8] main-content pt-16">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center min-h-96">
        <a-spin size="large" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-16">
        <div class="text-red-500 text-xl mb-4">{{ error }}</div>
        <a-button @click="goBack" type="primary">Back</a-button>
      </div>

      <!-- Group Detail -->
      <div v-else-if="group" class="space-y-6">
        <!-- Back Button -->
        <div class="mb-4">
          <a-button
            @click="goBack"
            type="text"
            size="large"
            class="!text-[#C24D45] hover:!bg-[#FFF5F5]"
          >
            <template #icon>
              <ArrowLeftOutlined />
            </template>
            Back to group list
          </a-button>
        </div>

        <!-- Group Header -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <!-- Header Banner -->
          <div class="h-48 bg-gradient-to-r from-[#C24D45] to-[#E74C3C] relative">
            <div class="absolute inset-0 bg-black bg-opacity-20"></div>
            <div class="absolute bottom-6 left-6 text-white">
              <h1 class="text-4xl font-bold mb-2">{{ group.name }}</h1>
              <div class="flex items-center space-x-4 text-lg">
                <div class="flex items-center">
                  <TeamOutlined class="mr-2" />
                  <span>{{ group.member_count || 0 }} members</span>
                </div>
                <div v-if="group.created_at" class="flex items-center">
                  <ClockCircleOutlined class="mr-2" />
                  <span>Created on {{ formatDate(group.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Group Info -->
          <div class="p-8">
            <div class="mb-6">
              <h3 class="text-2xl font-bold mb-3 text-[#333333]">Group Description</h3>
              <p class="text-gray-700 leading-relaxed text-lg">{{ group.description || 'No description' }}</p>
            </div>

            <!-- Group Actions -->
            <div class="flex gap-3 pt-4 border-t border-gray-200">
              <a-button
                type="primary"
                size="large"
                class="!rounded-lg bg-gradient-to-r from-[#C24D45] to-[#E74C3C] border-none hover:from-[#A93C35] hover:to-[#C0392B]"
                @click="showPostThoughtModal = true"
              >
                <EditOutlined class="mr-2" />
                Post Activity
              </a-button>

              <a-button
                v-if="!group.is_member"
                type="primary"
                size="large"
                class="!rounded-lg"
                @click="joinGroup"
                :loading="isJoining"
              >
                <UserAddOutlined class="mr-2" />
                Join Group
              </a-button>

              <a-button
                v-else-if="group.my_role !== 'creator'"
                danger
                size="large"
                class="!rounded-lg"
                @click="leaveGroup"
                :loading="isLeaving"
              >
                <UserDeleteOutlined class="mr-2" />
                Leave Group
              </a-button>

              <a-button
                v-if="group.my_role === 'creator'"
                danger
                size="large"
                class="!rounded-lg"
                @click="deleteGroup"
                :loading="isDeleting"
              >
                <DeleteOutlined class="mr-2" />
                Delete Group
              </a-button>
            </div>
          </div>
        </div>

        <!-- Group Activities Section -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-[#333333]">Group Activities</h2>
            <a-radio-group v-model:value="activityFilter" button-style="solid">
              <a-radio-button value="upcoming">Upcoming</a-radio-button>
              <a-radio-button value="ongoing">Ongoing</a-radio-button>
              <a-radio-button value="all">All</a-radio-button>
            </a-radio-group>
          </div>

          <!-- Activities Loading -->
          <div v-if="activitiesLoading" class="py-12 flex justify-center">
            <a-spin />
          </div>

          <!-- No Activities -->
          <div v-else-if="filteredActivities.length === 0" class="text-center py-16 text-gray-400">
            <CalendarOutlined class="text-6xl mb-4" />
            <p class="text-lg">No activities</p>
            <p class="text-sm mt-2">This group has not created any activities yet</p>
          </div>

          <!-- Activities List -->
          <div v-else class="space-y-4">
            <div
              v-for="activity in filteredActivities"
              :key="activity.id"
              class="bg-[#FAFAFA] rounded-lg p-6 hover:shadow-md transition-all duration-300 cursor-pointer"
              @click="goToActivity(activity.id)"
            >
              <!-- Activity Header -->
              <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <h3 class="text-xl font-semibold text-[#333333]">{{ activity.title }}</h3>
                    <a-tag :color="getCategoryColor(activity.category)">
                      {{ getCategoryName(activity.category) }}
                    </a-tag>
                    <a-tag :color="getStatusColor(activity.status)">
                      {{ getStatusName(activity.status) }}
                    </a-tag>
                  </div>
                  <p class="text-gray-600 line-clamp-2">{{ activity.description }}</p>
                </div>
              </div>

              <!-- Activity Details -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="flex items-center text-sm text-gray-600">
                  <ClockCircleOutlined class="mr-2 text-blue-500" />
                  <span>{{ formatDateTime(activity.start_time) }}</span>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <EnvironmentOutlined class="mr-2 text-green-500" />
                  <span>{{ activity.location || 'TBD' }}</span>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <TeamOutlined class="mr-2 text-purple-500" />
                  <span>{{ activity.current_participants || 0 }} / {{ activity.max_participants || '∞' }} people</span>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <UserOutlined class="mr-2 text-orange-500" />
                  <span>{{ getOrganizerName(activity) }}</span>
                </div>
              </div>

              <!-- Activity Stats -->
              <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                <div class="flex items-center space-x-4">
                  <span v-if="activity.entry_fee && activity.entry_fee > 0" class="text-sm text-orange-600 font-medium">
                    💰 ${{ activity.entry_fee }}
                  </span>
                  <span v-if="activity.reward_points && activity.reward_points > 0" class="text-sm text-green-600 font-medium">
                    ⭐ +{{ activity.reward_points }} pts
                  </span>
                  <a-tag v-if="activity.isOwner" color="blue">My Activity</a-tag>
                  <a-tag v-else-if="activity.isRegistered" color="green">Joined</a-tag>
                </div>

                <a-button
                  type="primary"
                  class="!rounded-lg bg-[#C24D45] border-none hover:bg-[#A93C35]"
                  @click.stop="goToActivity(activity.id)"
                >
                  View Details
                  <ArrowRightOutlined class="ml-2" />
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Activity Modal -->
      <PostThoughtModal
        v-model:open="showPostThoughtModal"
        :my-groups="[group]"
        :default-group="groupId"
        @success="handleThoughtPosted"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  EditOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  DeleteOutlined,
  CalendarOutlined
} from '@ant-design/icons-vue'
import { groupAPI, activitiesAPI } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import PostThoughtModal from '@/components/groups/PostThoughtModal.vue'
import { getPublicUserName } from '@/utils/publicName'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const groupId = ref(route.params.id)
const group = ref(null)
const activities = ref([])
const isLoading = ref(true)
const activitiesLoading = ref(true)
const error = ref(null)
const isJoining = ref(false)
const isLeaving = ref(false)
const isDeleting = ref(false)
const activityFilter = ref('upcoming')
const showPostThoughtModal = ref(false)

const storedUser = ref(null)
try {
  storedUser.value = JSON.parse(localStorage.getItem('userData') || 'null')
} catch (error) {
  storedUser.value = null
}

const currentUserId = computed(() => authStore.userId || storedUser.value?.id || null)

// Fetch group details
const fetchGroupDetails = async () => {
  try {
    isLoading.value = true
    error.value = null

    // Note: Need to add API to get single group details on backend
    // Temporarily use getMyGroups and getGroups to fetch
    const [myGroupsRes, allGroupsRes] = await Promise.all([
      groupAPI.getMyGroups(),
      groupAPI.getGroups()
    ])

    const myGroups = myGroupsRes.data?.data?.groups || []
    const allGroups = allGroupsRes.data?.data?.groups || []

    // 查找当前小组
    let foundGroup = myGroups.find(g => g.id === groupId.value)
    if (foundGroup) {
      foundGroup.is_member = true
    } else {
      foundGroup = allGroups.find(g => g.id === groupId.value)
      if (foundGroup) {
        foundGroup.is_member = false
      }
    }

    if (!foundGroup) {
      error.value = 'Group does not exist'
      return
    }

    group.value = foundGroup
  } catch (err) {
    console.error('Failed to fetch group details:', err)
    error.value = 'Failed to load group details'
  } finally {
    isLoading.value = false
  }
}

// Fetch group activities
const fetchGroupActivities = async () => {
  try {
    activitiesLoading.value = true

    // 获取所有活动，然后筛选属于该小组的
    const response = await activitiesAPI.getActivities({
      status: ['published', 'ongoing'],
      sortBy: 'start_time',
      sortOrder: 'asc',
      limit: 100
    })

    const allActivities = response.data?.data?.activities || []

    // 筛选出属于当前小组的活动
    // 注意：需要在活动数据中添加 group_id 字段，或者通过其他方式关联
    // 暂时显示所有活动作为演示
    activities.value = allActivities.map(normalizeActivity)

  } catch (err) {
    console.error('Failed to fetch group activities:', err)
  } finally {
    activitiesLoading.value = false
  }
}

const normalizeActivity = (raw) => {
  if (!raw) return null
  return {
    ...raw,
    organizer: raw.organizer || null,
    location: raw.location || 'TBD',
    current_participants: raw.current_participants || 0,
    max_participants: raw.max_participants,
    reward_points: raw.reward_points || 0,
    entry_fee: raw.entry_fee || 0,
    isOwner: currentUserId.value ? raw.organizer_id === currentUserId.value : false,
    isRegistered: Boolean(raw.user_participation)
  }
}

// Filtered activities based on status
const filteredActivities = computed(() => {
  const now = new Date()

  return activities.value.filter(activity => {
    const startTime = new Date(activity.start_time)
    const endTime = new Date(activity.end_time)

    // 只显示未结束的活动
    if (endTime < now) {
      return false
    }

    if (activityFilter.value === 'upcoming') {
      return startTime > now
    } else if (activityFilter.value === 'ongoing') {
      return startTime <= now && endTime > now
    } else {
      return true // 'all'
    }
  })
})

// Actions
const joinGroup = async () => {
  try {
    isJoining.value = true
    const response = await groupAPI.joinGroup(groupId.value)

    if (response.data.success) {
      message.success('Joined group successfully!')
      await fetchGroupDetails()
    }
  } catch (err) {
    message.error(err.response?.data?.error?.message || 'Failed to join group')
  } finally {
    isJoining.value = false
  }
}

const leaveGroup = async () => {
  try {
    isLeaving.value = true
    const response = await groupAPI.leaveGroup(groupId.value)

    if (response.data.success) {
      message.success('Left group successfully')
      router.push('/activities')
    }
  } catch (err) {
    message.error(err.response?.data?.error?.message || 'Failed to leave group')
  } finally {
    isLeaving.value = false
  }
}

const deleteGroup = async () => {
  try {
    isDeleting.value = true
    const response = await groupAPI.deleteGroup(groupId.value)

    if (response.data.success) {
      message.success('Group deleted successfully')
      router.push('/activities')
    }
  } catch (err) {
    message.error(err.response?.data?.error?.message || 'Failed to delete group')
  } finally {
    isDeleting.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToActivity = (activityId) => {
  router.push(`/activities/${activityId}`)
}

const handleThoughtPosted = () => {
  message.success('Activity posted successfully!')
}

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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
    cancelled: 'red'
  }
  return colors[status] || 'default'
}

const getStatusName = (status) => {
  const names = {
    draft: 'Draft',
    published: 'Published',
    ongoing: 'Ongoing',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return names[status] || status
}

const getOrganizerName = (activity) => {
  return getPublicUserName(activity?.organizer, 'Unknown')
}

// Lifecycle
onMounted(async () => {
  await fetchGroupDetails()
  await fetchGroupActivities()
})
</script>

<style scoped>
.main-content {
  min-height: 100vh;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
