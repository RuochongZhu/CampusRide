<template>
  <!-- Overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
    @click="$emit('close')"
  ></div>

  <!-- Sidebar -->
  <div
    :class="[
      'fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col',
      isOpen ? 'translate-x-0' : 'translate-x-full'
    ]"
  >
    <!-- Header -->
    <div class="bg-gradient-to-r from-[#C24D45] to-[#A93C35] p-6 text-white flex-shrink-0">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-2xl font-bold">My Profile</h2>
        <button @click="$emit('close')" class="text-white hover:text-gray-200">
          <CloseOutlined class="text-xl" />
        </button>
      </div>

      <!-- User Info -->
      <div class="flex items-center space-x-4">
        <div class="relative">
          <img
            :src="userData.avatar_url || defaultAvatar"
            alt="Avatar"
            class="w-20 h-20 rounded-full border-4 border-white object-cover"
            @error="handleImageError"
          />
          <button
            @click="showUploadModal = true"
            class="absolute bottom-0 right-0 bg-white text-[#C24D45] rounded-full p-1 hover:bg-gray-100"
          >
            <CameraOutlined class="text-sm" />
          </button>
        </div>
        <div class="flex-1">
          <!-- Editable Nickname -->
          <div class="flex items-center">
            <div v-if="!isEditingNickname" class="flex items-center space-x-2">
              <h3 class="text-xl font-semibold">
                {{ userData.nickname || userData.first_name || 'User' }}
              </h3>
              <button @click="startEditNickname" class="text-white/80 hover:text-white">
                <EditOutlined class="text-sm" />
              </button>
            </div>
            <div v-else class="flex items-center space-x-2">
              <input
                v-model="editNicknameValue"
                class="bg-white/20 text-white placeholder-white/60 border border-white/40 rounded px-2 py-1 text-sm w-32"
                placeholder="Nickname"
                @keyup.enter="saveNickname"
                @keyup.esc="cancelEditNickname"
              />
              <button @click="saveNickname" class="text-white hover:text-green-300">
                <CheckOutlined class="text-sm" />
              </button>
              <button @click="cancelEditNickname" class="text-white hover:text-red-300">
                <CloseOutlined class="text-sm" />
              </button>
            </div>
          </div>
          <p class="text-white/80 text-sm">{{ userData.email }}</p>
          <div class="flex items-center mt-2">
            <StarFilled class="text-yellow-300 text-sm mr-1" />
            <span class="font-medium">{{ userData.rating?.toFixed(1) || '0.0' }}</span>
            <span class="text-white/60 text-xs ml-1">({{ userData.rating_count || 0 }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content area with flex-grow -->
    <div class="flex-1 overflow-y-auto flex flex-col">
      <!-- Horizontal Tabs -->
      <div class="border-b border-gray-200 flex-shrink-0">
        <div class="flex">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="flex-1 py-3 px-2 text-center text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.key
              ? 'border-[#C24D45] text-[#C24D45]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="p-4 flex-1 overflow-y-auto">
        <!-- History Tab (Points History) -->
        <div v-if="activeTab === 'history'" class="space-y-4">
          <!-- Current Points Display -->
          <div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-600">Current Weekly Points</p>
                <p class="text-3xl font-bold text-orange-600">{{ pointsData.total || 0 }}</p>
                <p class="text-xs text-gray-500 mt-1">Resets every Sunday</p>
              </div>
              <TrophyOutlined class="text-4xl text-orange-400" />
            </div>
          </div>

          <!-- Points History -->
          <div>
            <h4 class="font-semibold mb-2 text-gray-700">Points History</h4>
            <div v-if="pointsHistory.length === 0" class="text-center py-8 text-gray-400">
              <TrophyOutlined class="text-3xl mb-2" />
              <p class="text-sm">No points history yet</p>
            </div>
            <div v-else class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="item in pointsHistory"
                :key="item.id"
                class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-800">{{ item.reason }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(item.created_at) }}</p>
                </div>
                <span
                  :class="[
                    'font-bold text-sm',
                    item.points > 0 ? 'text-green-600' : 'text-red-600'
                  ]"
                >
                  {{ item.points > 0 ? '+' : '' }}{{ item.points }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Coupons Tab -->
        <div v-else-if="activeTab === 'coupons'" class="space-y-4">
          <!-- Coupon Filter -->
          <a-segmented
            v-model:value="couponFilter"
            :options="[
              { label: 'Active', value: 'active' },
              { label: 'Used', value: 'used' },
              { label: 'Expired', value: 'expired' }
            ]"
            block
          />

          <!-- Coupon Summary -->
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-green-50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-green-600">{{ couponsData.summary?.active || 0 }}</p>
              <p class="text-xs text-gray-600">Active</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-gray-600">{{ couponsData.summary?.used || 0 }}</p>
              <p class="text-xs text-gray-600">Used</p>
            </div>
            <div class="bg-red-50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-red-600">{{ couponsData.summary?.expired || 0 }}</p>
              <p class="text-xs text-gray-600">Expired</p>
            </div>
          </div>

          <!-- Coupon List -->
          <div v-if="filteredCoupons.length === 0" class="text-center py-8 text-gray-400">
            <GiftOutlined class="text-3xl mb-2" />
            <p class="text-sm">No {{ couponFilter }} coupons</p>
          </div>
          <div v-else class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="coupon in filteredCoupons"
              :key="coupon.id"
              class="border rounded-lg p-3 relative"
              :class="{
                'border-green-500 bg-green-50': coupon.status === 'active',
                'border-gray-300 bg-gray-50': coupon.status === 'used',
                'border-red-300 bg-red-50': coupon.status === 'expired'
              }"
            >
              <div class="flex items-start justify-between mb-2">
                <h5 class="font-bold text-sm">{{ coupon.merchant_name }}</h5>
                <GiftOutlined class="text-xl opacity-20" />
              </div>
              <p class="text-xs text-gray-600 mb-2">{{ coupon.description }}</p>
              <div class="bg-white rounded px-2 py-1 inline-block font-mono font-bold text-sm">
                {{ coupon.code }}
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Valid until: {{ formatDate(coupon.valid_until) }}
              </p>
              <p v-if="coupon.is_used && coupon.used_at" class="text-xs text-gray-500">
                Used on: {{ formatDate(coupon.used_at) }}
              </p>
              <a-button
                v-if="coupon.status === 'active'"
                size="small"
                type="primary"
                class="mt-2 !bg-green-600 border-none hover:!bg-green-700"
                @click="useCoupon(coupon.id)"
                :loading="coupon.using"
              >
                Use Coupon
              </a-button>
            </div>
          </div>
        </div>

        <!-- Leaderboard Tab -->
        <div v-else-if="activeTab === 'leaderboard'" class="space-y-4">
          <!-- Privacy Toggle -->
          <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <EyeInvisibleOutlined v-if="hideRankEnabled" class="text-gray-500" />
                <EyeOutlined v-else class="text-gray-500" />
                <div>
                  <p class="text-sm font-medium text-gray-700">Hide my rank</p>
                  <p class="text-xs text-gray-500">Others will see a blurred rank</p>
                </div>
              </div>
              <a-switch
                :checked="hideRankEnabled"
                :loading="hideRankLoading"
                @change="toggleHideRank"
              />
            </div>
          </div>

          <!-- My Rank Card -->
          <div v-if="myRank" class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-sm p-4 border border-purple-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  #{{ myRank.rank }}
                </div>
                <div>
                  <p class="text-sm text-gray-600">Your Current Rank</p>
                  <p class="text-xl font-bold text-purple-600">{{ myRank.points }} points</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Keep going!</p>
                <p class="text-xs text-gray-500">{{ getRankMessage(myRank.rank) }}</p>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="leaderboardLoading" class="flex justify-center items-center py-8">
            <a-spin size="large" />
          </div>

          <!-- Error State -->
          <div v-else-if="leaderboardError" class="text-center py-8">
            <ExclamationCircleOutlined class="text-3xl text-red-500 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Leaderboard</h3>
            <p class="text-gray-600 mb-4">{{ leaderboardError }}</p>
            <a-button type="primary" @click="fetchLeaderboard">Retry</a-button>
          </div>

          <!-- Leaderboard List -->
          <div v-else>
            <div v-if="leaderboardData.length === 0" class="text-center py-8 text-gray-500">
              <TrophyOutlined class="text-4xl mb-4 opacity-20" />
              <p class="text-lg">No leaderboard data yet</p>
              <p class="text-sm mt-2">Start earning points to appear on the leaderboard!</p>
            </div>
            <div v-else class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="(user, index) in leaderboardData"
                :key="user.user_id"
                class="p-3 bg-gray-50 rounded-lg transition-colors"
                :class="{
                  'bg-yellow-50 border border-yellow-200': index === 0,
                  'bg-gray-100': index === 1,
                  'bg-orange-50 border border-orange-200': index === 2
                }"
              >
                <div class="flex items-center space-x-3">
                  <!-- Rank Badge -->
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    :class="{
                      'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white': index === 0,
                      'bg-gradient-to-br from-gray-300 to-gray-400 text-white': index === 1,
                      'bg-gradient-to-br from-orange-400 to-orange-500 text-white': index === 2,
                      'bg-gray-200 text-gray-700': index > 2
                    }"
                  >
                    {{ index + 1 }}
                  </div>

                  <!-- User Info -->
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm text-gray-900 truncate">
                      {{ user.first_name }} {{ user.last_name }}
                    </p>
                    <div v-if="user.avg_rating && user.avg_rating > 0" class="flex items-center mt-1 space-x-2">
                      <StarFilled class="text-yellow-500 text-xs" />
                      <span class="text-xs text-gray-600">{{ (user.avg_rating || 5).toFixed(1) }}</span>
                    </div>
                  </div>

                  <!-- Points -->
                  <div class="text-right flex-shrink-0">
                    <p class="font-bold text-lg text-[#C24D45]">{{ user.total_points }}</p>
                    <p class="text-xs text-gray-500">points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Blocked Users Tab -->
        <div v-else-if="activeTab === 'blocked'" class="space-y-4">
          <!-- Info Banner -->
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="flex items-start space-x-2">
              <StopOutlined class="text-red-500 mt-0.5" />
              <div class="text-sm text-red-700">
                <p class="font-medium">Blocked Users</p>
                <p class="text-xs mt-1">Users you've blocked cannot send you messages.</p>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="blockedUsersLoading" class="flex justify-center items-center py-8">
            <a-spin size="large" />
          </div>

          <!-- Empty State -->
          <div v-else-if="blockedUsers.length === 0" class="text-center py-8 text-gray-500">
            <CheckCircleOutlined class="text-4xl mb-4 text-green-400" />
            <p class="text-lg">No blocked users</p>
            <p class="text-sm mt-2">You haven't blocked anyone yet.</p>
          </div>

          <!-- Blocked Users List -->
          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="user in blockedUsers"
              :key="user.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <a-avatar :src="user.avatar_url" :size="40">
                  {{ getInitials(user) }}
                </a-avatar>
                <div>
                  <p class="font-medium text-sm text-gray-900">
                    {{ user.first_name }} {{ user.last_name }}
                  </p>
                  <p class="text-xs text-gray-500">
                    Blocked on {{ formatDate(user.blocked_at) }}
                  </p>
                </div>
              </div>
              <a-button
                size="small"
                @click="unblockUser(user.id)"
                :loading="user.unblocking"
              >
                Unblock
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout Button at Bottom -->
    <div class="p-4 border-t border-gray-200 flex-shrink-0">
      <a-button
        type="primary"
        danger
        block
        size="large"
        @click="handleLogout"
        class="!bg-red-500 hover:!bg-red-600 border-none"
      >
        <LogoutOutlined /> Logout
      </a-button>
    </div>

    <!-- Avatar Upload Modal -->
    <a-modal
      v-model:open="showUploadModal"
      title="Update Avatar"
      :footer="null"
      width="400px"
    >
      <div class="space-y-4">
        <!-- Current Avatar -->
        <div v-if="uploadPreview || userData.avatar_url" class="text-center">
          <img
            :src="uploadPreview || userData.avatar_url"
            alt="Preview"
            class="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200"
            @error="handleImageError"
          />
        </div>

        <!-- Upload Button -->
        <div class="text-center">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
          <a-button @click="$refs.fileInput.click()" :loading="uploading" block>
            <UploadOutlined /> Choose Image
          </a-button>
          <p class="text-xs text-gray-500 mt-2">Max 5MB (JPEG, PNG, WebP)</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <a-button @click="showUploadModal = false" block>Cancel</a-button>
          <a-button
            type="primary"
            @click="uploadAvatar"
            :loading="uploading"
            :disabled="!uploadPreview"
            block
            class="!bg-[#C24D45] border-none hover:!bg-[#A93C35]"
          >
            Save
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  CloseOutlined,
  CameraOutlined,
  StarFilled,
  TrophyOutlined,
  GiftOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  EditOutlined,
  CheckOutlined,
  LogoutOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { userProfileAPI, leaderboardAPI, marketplaceAPI, messagesAPI } from '@/utils/api'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'logout'])

const authStore = useAuthStore()

// Tabs configuration
const tabs = [
  { key: 'history', label: 'Points' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'leaderboard', label: 'Ranking' },
  { key: 'blocked', label: 'Blocked' }
]

const activeTab = ref('history')
const couponFilter = ref('active')
const showUploadModal = ref(false)
const uploading = ref(false)
const uploadPreview = ref(null)
const fileInput = ref(null)

// Nickname editing state
const isEditingNickname = ref(false)
const editNicknameValue = ref('')

// Data
const userData = ref({
  first_name: '',
  last_name: '',
  nickname: '',
  email: '',
  avatar_url: '',
  rating: 0,
  rating_count: 0
})

const pointsData = ref({ total: 0 })
const pointsHistory = ref([])
const couponsData = ref({
  summary: { active: 0, used: 0, expired: 0 },
  active: [],
  used: [],
  expired: []
})

// Leaderboard data
const leaderboardLoading = ref(false)
const leaderboardError = ref(null)
const leaderboardData = ref([])
const myRank = ref(null)

// Blocked users data
const blockedUsers = ref([])
const blockedUsersLoading = ref(false)

// Hide rank privacy setting
const hideRankEnabled = ref(false)
const hideRankLoading = ref(false)

const defaultAvatar = import.meta.env.VITE_API_BASE_URL || ''

// Computed
const filteredCoupons = computed(() => {
  return couponsData.value[couponFilter.value] || []
})

// Nickname editing methods
const startEditNickname = () => {
  editNicknameValue.value = userData.value.nickname || userData.value.first_name || ''
  isEditingNickname.value = true
}

const cancelEditNickname = () => {
  isEditingNickname.value = false
  editNicknameValue.value = ''
}

const saveNickname = async () => {
  if (!editNicknameValue.value.trim()) {
    message.warning('Nickname cannot be empty')
    return
  }

  try {
    const response = await userProfileAPI.updateUserProfile({
      nickname: editNicknameValue.value.trim()
    })

    if (response.data.success) {
      userData.value.nickname = editNicknameValue.value.trim()
      userData.value.first_name = editNicknameValue.value.trim()
      message.success('Nickname updated successfully!')

      // Update localStorage
      const storedData = JSON.parse(localStorage.getItem('userData') || '{}')
      storedData.first_name = editNicknameValue.value.trim()
      storedData.nickname = editNicknameValue.value.trim()
      localStorage.setItem('userData', JSON.stringify(storedData))
    }
  } catch (err) {
    console.error('Failed to update nickname:', err)
    message.error(err.response?.data?.error?.message || 'Failed to update nickname')
  } finally {
    isEditingNickname.value = false
  }
}

// Logout handler
const handleLogout = () => {
  emit('logout')
}

// Methods
const fetchAllData = async () => {
  if (!authStore.userId) return

  try {
    // Fetch user profile
    const profileRes = await userProfileAPI.getUserProfile(authStore.userId)
    if (profileRes.data.success) {
      const data = profileRes.data.data
      userData.value = {
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        nickname: data.user.nickname || data.user.first_name || '',
        email: data.user.email || '',
        avatar_url: data.user.avatar_url || '',
        rating: data.ratings?.summary?.average || 0,
        rating_count: data.ratings?.summary?.total || 0
      }
      couponsData.value = data.coupons || { summary: {}, active: [], used: [], expired: [] }
      pointsData.value.total = data.statistics?.points || 0
    }

    // Fetch points history
    const pointsRes = await userProfileAPI.getUserPointsHistory(authStore.userId)
    if (pointsRes.data.success) {
      pointsHistory.value = pointsRes.data.data.history || []
    }
  } catch (err) {
    console.error('Failed to fetch sidebar data:', err)
  }
}

const useCoupon = async (couponId) => {
  try {
    const coupon = couponsData.value.active.find(c => c.id === couponId)
    if (coupon) coupon.using = true

    const response = await userProfileAPI.useCoupon(couponId)

    if (response.data.success) {
      message.success('Coupon used successfully!')
      await fetchAllData()
    } else {
      throw new Error(response.data.error?.message || 'Failed to use coupon')
    }
  } catch (err) {
    console.error('Use coupon error:', err)
    message.error(err.message || 'Failed to use coupon')
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    message.error('Only JPEG, PNG, and WebP images are allowed')
    return
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    message.error('Image size must be less than 5MB')
    return
  }

  // Preview
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const uploadAvatar = async () => {
  if (!uploadPreview.value) return

  try {
    uploading.value = true

    // Upload avatar using the dedicated endpoint
    const uploadRes = await userProfileAPI.uploadAvatar({ image: uploadPreview.value })

    if (uploadRes.data.success) {
      message.success('Avatar updated successfully!')
      userData.value.avatar_url = uploadRes.data.data.user.avatar_url
      authStore.updateUserAvatar(uploadRes.data.data.user.avatar_url)
      showUploadModal.value = false
      uploadPreview.value = null
    } else {
      throw new Error(uploadRes.data.error?.message || 'Failed to upload avatar')
    }
  } catch (err) {
    console.error('Upload avatar error:', err)
    message.error(err.message || 'Failed to upload avatar')
  } finally {
    uploading.value = false
  }
}

const handleImageError = (e) => {
  e.target.src = defaultAvatar
}

const fetchLeaderboard = async () => {
  try {
    leaderboardLoading.value = true
    leaderboardError.value = null

    // Fetch top 20 users for compact sidebar view
    const leaderboardRes = await leaderboardAPI.getLeaderboard({ limit: 20 })
    if (leaderboardRes.data.success) {
      leaderboardData.value = leaderboardRes.data.data.users || []
    } else {
      throw new Error(leaderboardRes.data.error?.message || 'Failed to fetch leaderboard')
    }

    // Fetch my rank
    try {
      const rankRes = await leaderboardAPI.getMyRank()
      if (rankRes.data.success) {
        myRank.value = rankRes.data.data
      }
    } catch (err) {
      // It's okay if we can't get rank (user might not be logged in)
      console.log('Could not fetch user rank:', err.message)
    }
  } catch (err) {
    console.error('Fetch leaderboard error:', err)
    leaderboardError.value = err.message || 'Failed to load leaderboard'
  } finally {
    leaderboardLoading.value = false
  }
}

const getRankMessage = (rank) => {
  if (rank === 1) return 'You\'re #1! Amazing!'
  if (rank <= 3) return 'Top 3! Keep it up!'
  if (rank <= 10) return 'Top 10! Great job!'
  if (rank <= 20) return 'Top 20! You\'re doing well!'
  return 'Keep earning points!'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Blocked users methods
const getInitials = (user) => {
  if (!user) return '?'
  const first = user.first_name?.[0] || ''
  const last = user.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

const fetchBlockedUsers = async () => {
  try {
    blockedUsersLoading.value = true
    const response = await messagesAPI.getBlockedUsers()
    if (response.data?.success) {
      blockedUsers.value = (response.data.data?.blocked_users || []).map(block => ({
        // Extract user info from nested blocked_user object
        id: block.blocked_user?.id || block.blocked_id,
        first_name: block.blocked_user?.first_name || '',
        last_name: block.blocked_user?.last_name || '',
        email: block.blocked_user?.email || '',
        avatar_url: block.blocked_user?.avatar_url || '',
        blocked_at: block.created_at,
        reason: block.reason,
        unblocking: false
      }))
    }
  } catch (err) {
    console.error('Failed to fetch blocked users:', err)
    blockedUsers.value = []
  } finally {
    blockedUsersLoading.value = false
  }
}

const unblockUser = async (userId) => {
  try {
    const user = blockedUsers.value.find(u => u.id === userId)
    if (user) user.unblocking = true

    const response = await messagesAPI.unblockUser(userId)
    if (response.data?.success) {
      message.success('User unblocked successfully')
      blockedUsers.value = blockedUsers.value.filter(u => u.id !== userId)
    } else {
      throw new Error(response.data?.error?.message || 'Failed to unblock user')
    }
  } catch (err) {
    console.error('Failed to unblock user:', err)
    message.error(err.message || 'Failed to unblock user')
    const user = blockedUsers.value.find(u => u.id === userId)
    if (user) user.unblocking = false
  }
}

// Hide rank functions
const fetchHideRankStatus = async () => {
  try {
    const response = await userProfileAPI.getHideRankStatus()
    if (response.data?.success) {
      hideRankEnabled.value = response.data.data?.hide_rank || false
    }
  } catch (err) {
    console.error('Failed to fetch hide rank status:', err)
  }
}

const toggleHideRank = async (checked) => {
  try {
    hideRankLoading.value = true
    const response = await userProfileAPI.toggleHideRank(checked)
    if (response.data?.success) {
      hideRankEnabled.value = checked
      message.success(response.data.message || (checked ? 'Your rank is now hidden' : 'Your rank is now visible'))
    } else {
      throw new Error(response.data?.error?.message || 'Failed to update privacy setting')
    }
  } catch (err) {
    console.error('Failed to toggle hide rank:', err)
    message.error(err.message || 'Failed to update privacy setting')
  } finally {
    hideRankLoading.value = false
  }
}

// Watch isOpen to fetch data
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      fetchAllData()
    }
  },
  { immediate: true }
)

// Watch activeTab to fetch leaderboard data when user switches to leaderboard tab
watch(
  () => activeTab.value,
  (newTab) => {
    if (newTab === 'leaderboard' && props.isOpen) {
      fetchLeaderboard()
      fetchHideRankStatus()
    }
    if (newTab === 'blocked' && props.isOpen) {
      fetchBlockedUsers()
    }
  }
)
</script>

<style scoped>
.nav-link {
  @apply text-[#666666] hover:text-[#C24D45] transition-colors duration-200 font-medium;
}

.nav-link.active {
  @apply text-[#C24D45];
}
</style>
