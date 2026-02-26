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
                {{ displayUserName }}
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
        <!-- Points & Ranking Tab (Combined) -->
        <div v-if="activeTab === 'points-ranking'" class="space-y-4">
          <!-- Feature Disabled Notice -->
          <div v-if="!pointsRankingEnabled" class="text-center py-8">
            <LockOutlined class="text-4xl text-gray-300 mb-4" />
            <h3 class="text-lg font-medium text-gray-600">Points & Ranking Unavailable</h3>
            <p class="text-sm text-gray-400 mt-2">This feature is currently disabled by the administrator.</p>
          </div>

          <template v-else>
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

            <!-- Display Name Toggle -->
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <IdcardOutlined class="text-gray-500" />
                  <div>
                    <p class="text-sm font-medium text-gray-700">Show my NetID after nickname</p>
                    <p class="text-xs text-gray-500">Applies globally across all user names and avatars</p>
                  </div>
                </div>
                <a-switch
                  :checked="showNetIdSuffixEnabled"
                  @change="toggleNetIdSuffix"
                />
              </div>
            </div>

            <!-- Points History -->
            <div>
              <h4 class="font-semibold mb-2 text-gray-700">Points History</h4>
              <div v-if="pointsHistory.length === 0" class="text-center py-4 text-gray-400">
                <TrophyOutlined class="text-2xl mb-2" />
                <p class="text-sm">No points history yet</p>
              </div>
              <div v-else class="space-y-2 max-h-40 overflow-y-auto">
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

            <!-- Leaderboard -->
            <div>
              <h4 class="font-semibold mb-2 text-gray-700">Weekly Leaderboard</h4>
              <div v-if="leaderboardLoading" class="flex justify-center items-center py-4">
                <a-spin />
              </div>
              <div v-else-if="leaderboardData.length === 0" class="text-center py-4 text-gray-400">
                <TrophyOutlined class="text-2xl mb-2" />
                <p class="text-sm">No leaderboard data yet</p>
              </div>
              <div v-else class="space-y-2 max-h-48 overflow-y-auto">
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
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm text-gray-900 truncate">
                        {{ getDisplayName(user) }}
                      </p>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <p class="font-bold text-lg text-[#C24D45]">{{ user.total_points }}</p>
                      <p class="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
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
                    {{ getDisplayName(user) }}
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
    <div class="p-4 border-t border-gray-200 flex-shrink-0 space-y-2">
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
      <a-popconfirm
        title="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
        ok-text="Yes, Delete My Account"
        cancel-text="Cancel"
        ok-type="danger"
        @confirm="handleDeleteAccount"
      >
        <a-button
          block
          size="small"
          class="!text-gray-500 hover:!text-red-500"
        >
          <DeleteOutlined /> Delete My Account
        </a-button>
      </a-popconfirm>
    </div>

    <!-- Avatar Upload Modal -->
    <a-modal
      v-model:open="showUploadModal"
      title="Update Avatar"
      :footer="null"
      width="400px"
    >
      <div class="space-y-4">
        <!-- Image Cropper Area -->
        <div class="relative">
          <!-- Preview with drag -->
          <div v-if="uploadPreview" class="avatar-crop-container">
            <div
              class="crop-wrapper"
              @mousedown="startDrag"
              @mousemove="onDrag"
              @mouseup="endDrag"
              @mouseleave="endDrag"
              @touchstart="startDrag"
              @touchmove="onDrag"
              @touchend="endDrag"
              @wheel="onWheel"
            >
              <img
                ref="cropImage"
                :src="uploadPreview"
                alt="Preview"
                class="crop-image"
                :style="cropImageStyle"
                @load="onImageLoad"
                draggable="false"
              />
              <div class="crop-overlay">
                <div class="crop-circle"></div>
              </div>
            </div>
            <p class="text-xs text-gray-500 text-center mt-3">Drag to move • Scroll to zoom</p>
            <!-- Zoom slider -->
            <div class="flex items-center justify-center mt-2 px-4">
              <span class="text-xs text-gray-500 mr-2">-</span>
              <a-slider
                v-model:value="cropScale"
                :min="MIN_ZOOM"
                :max="MAX_ZOOM"
                :step="5"
                style="width: 150px"
              />
              <span class="text-xs text-gray-500 ml-2">+</span>
            </div>
          </div>

          <!-- Current Avatar (when no new image selected) -->
          <div v-else-if="userData.avatar_url" class="text-center">
            <img
              :src="userData.avatar_url"
              alt="Current Avatar"
              class="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200"
              @error="handleImageError"
            />
            <p class="text-sm text-gray-500 mt-2">Current avatar</p>
          </div>

          <!-- No avatar placeholder -->
          <div v-else class="text-center py-8">
            <div class="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
              <CameraOutlined class="text-4xl text-gray-400" />
            </div>
            <p class="text-sm text-gray-500 mt-2">No avatar set</p>
          </div>
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
            <UploadOutlined /> {{ uploadPreview ? 'Choose Different Image' : 'Choose Image' }}
          </a-button>
          <p class="text-xs text-gray-500 mt-2">Max 5MB (JPEG, PNG, WebP)</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <a-button @click="cancelUpload" block>Cancel</a-button>
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
  EyeInvisibleOutlined,
  DeleteOutlined,
  LockOutlined,
  IdcardOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { userProfileAPI, leaderboardAPI, marketplaceAPI, messagesAPI, userAPI, adminAPI } from '@/utils/api'
import { sanitizePublicDisplayName, getPublicNameFromRaw, useNetIdSuffixPreference, setNetIdSuffixPreference } from '@/utils/publicName'

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
  { key: 'points-ranking', label: 'Points & Ranking' },
  { key: 'blocked', label: 'Blocked' }
]

const activeTab = ref('points-ranking')
const couponFilter = ref('active')
const showUploadModal = ref(false)
const uploading = ref(false)
const uploadPreview = ref(null)
const fileInput = ref(null)
const cropImage = ref(null)

// Crop controls - drag based
const cropScale = ref(100)
const cropX = ref(0)
const cropY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const originalImageSize = ref({ width: 0, height: 0 })
const baseDisplayScale = ref(1)

const CROP_VIEWPORT_SIZE = 200
const MIN_ZOOM = 100
const MAX_ZOOM = 300

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

// Points & Ranking feature enabled status
const pointsRankingEnabled = ref(true)
const showNetIdSuffixEnabled = useNetIdSuffixPreference()

const defaultAvatar = '/Profile_Photo.jpg'

// Computed
const zoomFactor = computed(() => cropScale.value / 100)

const displayedImageSize = computed(() => ({
  width: originalImageSize.value.width * baseDisplayScale.value * zoomFactor.value,
  height: originalImageSize.value.height * baseDisplayScale.value * zoomFactor.value
}))

const cropImageStyle = computed(() => {
  return {
    width: `${displayedImageSize.value.width}px`,
    height: `${displayedImageSize.value.height}px`,
    transform: `translate(-50%, -50%) translate(${cropX.value}px, ${cropY.value}px)`
  }
})

const filteredCoupons = computed(() => {
  return couponsData.value[couponFilter.value] || []
})

const displayUserName = computed(() => {
  const baseName = userData.value.nickname || userData.value.first_name || 'User'
  return sanitizePublicDisplayName(baseName, userData.value.email, 'User')
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
      firstName: editNicknameValue.value.trim()
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

      // Dispatch event to notify HeaderComponent
      window.dispatchEvent(new Event('user-updated'))
    }
  } catch (err) {
    console.error('Failed to update nickname:', err)
    message.error('Failed to update nickname')
  } finally {
    isEditingNickname.value = false
  }
}

// Logout handler
const handleLogout = () => {
  emit('logout')
}

// Delete account handler
const handleDeleteAccount = async () => {
  try {
    const response = await userAPI.deleteMe()
    if (response.data?.success) {
      message.success('Your account has been deleted')
      // Clear local storage and redirect to login
      localStorage.removeItem('userToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userData')
      window.location.href = '/login'
    }
  } catch (err) {
    console.error('Failed to delete account:', err)
    message.error(err.response?.data?.error?.message || 'Failed to delete account')
  }
}

// Methods
const fetchAllData = async () => {
  // Check if user is guest
  if (authStore.isGuest || authStore.user?.role === 'guest') {
    message.warning('Guest users cannot access profiles')
    emit('close')
    return
  }

  if (!authStore.userId) return

  try {
    // First check localStorage for locally saved nickname
    const storedData = JSON.parse(localStorage.getItem('userData') || '{}')
    const localNickname = storedData.nickname || storedData.first_name

    // If we have local data, use it immediately (don't wait for API)
    if (localNickname) {
      userData.value.nickname = localNickname
      userData.value.first_name = localNickname
    }
    if (storedData.avatar_url) {
      userData.value.avatar_url = storedData.avatar_url
    }
    if (storedData.email) {
      userData.value.email = storedData.email
    }

    // Fetch user profile from API (but don't override local nickname)
    try {
      const profileRes = await userProfileAPI.getUserProfile(authStore.userId)
      if (profileRes.data.success) {
        const data = profileRes.data.data
        // 后端直接返回用户数据，不是包装在 user 对象中
        userData.value = {
          // 保留本地昵称，不被后端数据覆盖
          first_name: localNickname || data.first_name || '',
          last_name: data.last_name || '',
          nickname: localNickname || data.first_name || '',
          email: data.email || '',
          avatar_url: storedData.avatar_url || data.avatar_url || '',
          rating: data.ratings?.summary?.average || data.avg_rating || 0,
          rating_count: data.ratings?.summary?.total || data.total_ratings || 0
        }
        couponsData.value = data.coupons || { summary: {}, active: [], used: [], expired: [] }
        pointsData.value.total = data.statistics?.points || data.points || 0
      }
    } catch (profileErr) {
      console.log('Could not fetch profile from API, using local data')
    }

    // Fetch points history
    try {
      const pointsRes = await userProfileAPI.getUserPointsHistory(authStore.userId)
      if (pointsRes.data.success) {
        pointsHistory.value = pointsRes.data.data.history || []
      }
    } catch (pointsErr) {
      console.log('Could not fetch points history')
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
    // Reset crop controls when new image is selected
    cropScale.value = 100
    cropX.value = 0
    cropY.value = 0
    originalImageSize.value = { width: 0, height: 0 }
    baseDisplayScale.value = 1
  }
  reader.readAsDataURL(file)
}

const onImageLoad = (e) => {
  const width = e.target.naturalWidth || 0
  const height = e.target.naturalHeight || 0
  originalImageSize.value = { width, height }

  if (width > 0 && height > 0) {
    // Always fit the shorter side to crop area at 100% zoom.
    baseDisplayScale.value = Math.max(CROP_VIEWPORT_SIZE / width, CROP_VIEWPORT_SIZE / height)
  } else {
    baseDisplayScale.value = 1
  }

  cropScale.value = 100
  cropX.value = 0
  cropY.value = 0
}

const clampCropOffset = () => {
  const { width, height } = displayedImageSize.value
  if (!width || !height) return

  const maxX = Math.max(0, (width - CROP_VIEWPORT_SIZE) / 2)
  const maxY = Math.max(0, (height - CROP_VIEWPORT_SIZE) / 2)

  cropX.value = Math.min(maxX, Math.max(-maxX, cropX.value))
  cropY.value = Math.min(maxY, Math.max(-maxY, cropY.value))
}

// Drag handlers
const startDrag = (e) => {
  isDragging.value = true
  const point = e.touches ? e.touches[0] : e
  dragStart.value = {
    x: point.clientX - cropX.value,
    y: point.clientY - cropY.value
  }
}

const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const point = e.touches ? e.touches[0] : e
  cropX.value = point.clientX - dragStart.value.x
  cropY.value = point.clientY - dragStart.value.y
  clampCropOffset()
}

const endDrag = () => {
  isDragging.value = false
}

const onWheel = (e) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -10 : 10
  const newScale = cropScale.value + delta
  cropScale.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale))
}

const cancelUpload = () => {
  showUploadModal.value = false
  uploadPreview.value = null
  cropScale.value = 100
  cropX.value = 0
  cropY.value = 0
  originalImageSize.value = { width: 0, height: 0 }
  baseDisplayScale.value = 1
}

const uploadAvatar = async () => {
  if (!uploadPreview.value) return

  try {
    uploading.value = true

    // Create a canvas to crop the image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = async () => {
      // Set canvas size to desired output (256x256 for avatar)
      const outputSize = 256
      const cropSize = CROP_VIEWPORT_SIZE
      canvas.width = outputSize
      canvas.height = outputSize

      // Match output crop exactly to what the user sees in the 200x200 preview.
      const naturalWidth = img.naturalWidth || img.width
      const naturalHeight = img.naturalHeight || img.height
      const totalScale = baseDisplayScale.value * zoomFactor.value
      const sourceSize = cropSize / totalScale
      const rawSourceX = (naturalWidth / 2) - ((cropSize / 2) + cropX.value) / totalScale
      const rawSourceY = (naturalHeight / 2) - ((cropSize / 2) + cropY.value) / totalScale
      const sourceX = Math.max(0, Math.min(rawSourceX, naturalWidth - sourceSize))
      const sourceY = Math.max(0, Math.min(rawSourceY, naturalHeight - sourceSize))

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, outputSize, outputSize)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        outputSize,
        outputSize
      )

      // Convert to base64
      const croppedImage = canvas.toDataURL('image/jpeg', 0.9)

      // Upload avatar using the dedicated endpoint
      const uploadRes = await userProfileAPI.uploadAvatar({ image: croppedImage })

      if (uploadRes.data.success) {
        message.success('Avatar updated successfully!')
        const newAvatarUrl = uploadRes.data.data.user.avatar_url
        userData.value.avatar_url = newAvatarUrl
        authStore.updateUserAvatar(newAvatarUrl)

        // Update localStorage to sync with HeaderComponent
        try {
          const storedUserData = localStorage.getItem('userData')
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData)
            parsedData.avatar_url = newAvatarUrl
            localStorage.setItem('userData', JSON.stringify(parsedData))
          }
        } catch (e) {
          console.error('Failed to update localStorage:', e)
        }

        // Dispatch event to notify HeaderComponent
        window.dispatchEvent(new Event('user-updated'))

        showUploadModal.value = false
        uploadPreview.value = null
        cropScale.value = 100
        cropX.value = 0
        cropY.value = 0
        originalImageSize.value = { width: 0, height: 0 }
        baseDisplayScale.value = 1
      } else {
        throw new Error(uploadRes.data.error?.message || 'Failed to upload avatar')
      }
      uploading.value = false
    }

    img.onerror = () => {
      message.error('Failed to process image')
      uploading.value = false
    }

    img.src = uploadPreview.value
  } catch (err) {
    console.error('Upload avatar error:', err)
    message.error(err.message || 'Failed to upload avatar')
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

const getDisplayName = (user) => {
  return getPublicNameFromRaw(user?.first_name, user?.last_name, user?.email, 'User')
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
    // Silently fail - hide rank status is not critical
    console.log('Could not fetch hide rank status')
    hideRankEnabled.value = false
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

const toggleNetIdSuffix = (checked) => {
  setNetIdSuffixPreference(checked)
  message.success(checked ? 'NetID suffix is now visible globally' : 'NetID suffix is now hidden globally')
}

// Watch isOpen to fetch data
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      fetchAllData()
      checkPointsRankingEnabled()
    }
  },
  { immediate: true }
)

// Watch activeTab to fetch leaderboard data when user switches to points-ranking tab
watch(
  () => activeTab.value,
  (newTab) => {
    if (newTab === 'points-ranking' && props.isOpen) {
      fetchLeaderboard()
      fetchHideRankStatus()
    }
    if (newTab === 'blocked' && props.isOpen) {
      fetchBlockedUsers()
    }
  }
)

watch(
  () => cropScale.value,
  () => {
    clampCropOffset()
  }
)

// Check if points & ranking feature is enabled
const checkPointsRankingEnabled = async () => {
  try {
    const response = await adminAPI.checkPointsRankingEnabled()
    if (response.data?.success) {
      pointsRankingEnabled.value = response.data.data.enabled
    }
  } catch (error) {
    console.error('Failed to check points ranking status:', error)
    // Default to enabled if check fails
    pointsRankingEnabled.value = true
  }
}
</script>

<style scoped>
.nav-link {
  @apply text-[#666666] hover:text-[#C24D45] transition-colors duration-200 font-medium;
}

.nav-link.active {
  @apply text-[#C24D45];
}

/* Avatar Crop Styles */
.avatar-crop-container {
  width: 100%;
}

.crop-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 50%;
  background: #f0f0f0;
  touch-action: none;
}

.crop-image {
  position: absolute;
  top: 50%;
  left: 50%;
  object-fit: none;
  transition: transform 0.05s ease, width 0.05s ease, height 0.05s ease;
  cursor: grab;
  user-select: none;
}

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.crop-circle {
  width: 100%;
  height: 100%;
  border: 3px solid #C24D45;
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
}

.crop-controls {
  padding: 0 16px;
}

.crop-controls :deep(.ant-slider-track) {
  background-color: #C24D45;
}

.crop-controls :deep(.ant-slider-handle) {
  border-color: #C24D45;
}

.crop-controls :deep(.ant-slider-handle:hover) {
  border-color: #A93C35;
}
</style>
