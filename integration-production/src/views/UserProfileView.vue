<template>
  <div class="min-h-screen bg-[#EDEEE8] main-content pt-16">
    <div class="pt-8 pb-16 max-w-7xl mx-auto px-4">

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <a-spin size="large" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <ExclamationCircleOutlined class="text-5xl text-red-500 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Profile</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <a-button type="primary" @click="fetchProfileData">Retry</a-button>
      </div>

      <!-- Profile Content -->
      <div v-else-if="profileData">

        <!-- Profile Header -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-4">
              <!-- Avatar -->
              <div class="relative">
                <img
                  :src="profileData.user.avatar_url || defaultAvatar"
                  alt="User Avatar"
                  class="w-24 h-24 rounded-full object-cover border-4 border-[#C24D45]"
                  @error="handleImageError"
                />
                <div
                  class="absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white"
                  :class="profileData.user.is_online ? 'bg-green-500' : 'bg-gray-400'"
                ></div>
              </div>

              <!-- User Info -->
              <div>
                <h1 class="text-2xl font-bold text-gray-900">
                  {{ profileData.user.first_name }} {{ profileData.user.last_name }}
                </h1>
                <p class="text-gray-600">{{ profileData.user.email }}</p>
                <p class="text-sm text-gray-500">{{ profileData.user.university || 'Cornell University' }}</p>

                <!-- Rating Badge -->
                <div class="flex items-center mt-2">
                  <div class="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                    <StarFilled class="text-yellow-500 text-sm mr-1" />
                    <span class="font-medium text-sm">
                      {{ profileData.ratings.summary.average.toFixed(1) }}
                    </span>
                    <span class="text-gray-500 text-xs ml-1">
                      ({{ profileData.ratings.summary.total }} ratings)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-2">
              <a-button
                v-if="!isOwnProfile"
                type="primary"
                class="!rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35]"
                @click="sendMessage"
              >
                <MessageOutlined /> Message
              </a-button>
              <a-button
                v-if="isOwnProfile"
                type="default"
                class="!rounded-button"
                @click="showEditModal = true"
              >
                <EditOutlined /> Edit Profile
              </a-button>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <!-- Carpools -->
          <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Carpools</p>
                <p class="text-2xl font-bold text-[#C24D45]">{{ profileData.statistics.carpools }}</p>
              </div>
              <CarOutlined class="text-3xl text-[#C24D45] opacity-20" />
            </div>
          </div>

          <!-- Activities -->
          <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Activities</p>
                <p class="text-2xl font-bold text-blue-600">{{ profileData.statistics.activities }}</p>
              </div>
              <TeamOutlined class="text-3xl text-blue-600 opacity-20" />
            </div>
          </div>

          <!-- Sales -->
          <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Sales</p>
                <p class="text-2xl font-bold text-green-600">{{ profileData.statistics.sales }}</p>
              </div>
              <ShoppingOutlined class="text-3xl text-green-600 opacity-20" />
            </div>
          </div>

          <!-- Points -->
          <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Points</p>
                <p class="text-2xl font-bold text-orange-600">{{ profileData.statistics.points }}</p>
              </div>
              <TrophyOutlined class="text-3xl text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        <!-- Tabs Section -->
        <a-tabs v-model:activeKey="activeTab" class="profile-tabs">

          <!-- Activity History Tab - Visible to all -->
          <a-tab-pane key="history" tab="Activity History">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium">Participation History</h3>
                <a-select v-model:value="historyFilter" class="w-40">
                  <a-select-option value="all">All Types</a-select-option>
                  <a-select-option value="carpools">Carpools</a-select-option>
                  <a-select-option value="activities">Activities</a-select-option>
                  <a-select-option value="marketplace">Marketplace</a-select-option>
                </a-select>
              </div>

              <a-list
                :data-source="filteredHistory"
                :loading="historyLoading"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <div class="w-full">
                      <div class="flex justify-between items-start">
                        <div class="flex items-start space-x-3">
                          <!-- Type Icon -->
                          <div
                            class="w-10 h-10 rounded-full flex items-center justify-center"
                            :class="getHistoryTypeClass(item.type)"
                          >
                            <CarOutlined v-if="item.type === 'carpool'" />
                            <TeamOutlined v-else-if="item.type === 'activity'" />
                            <ShoppingOutlined v-else />
                          </div>

                          <!-- Content -->
                          <div class="flex-1">
                            <h4 class="font-medium text-gray-900">{{ item.title }}</h4>
                            <p class="text-sm text-gray-600 mt-1">{{ formatDate(item.date) }}</p>
                            <a-tag :color="getStatusColor(item.status)" size="small" class="mt-2">
                              {{ item.status }}
                            </a-tag>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a-list-item>
                </template>
                <template #empty>
                  <div class="text-center py-8 text-gray-500">
                    <HistoryOutlined class="text-4xl mb-2" />
                    <p>No activity history yet</p>
                  </div>
                </template>
              </a-list>
            </div>
          </a-tab-pane>

          <!-- Ratings Tab - Visible to all -->
          <a-tab-pane key="ratings" tab="Ratings & Reviews">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-medium mb-4">Recent Ratings</h3>

              <div v-if="profileData.ratings.recent.length === 0" class="text-center py-8 text-gray-500">
                <StarOutlined class="text-4xl mb-2" />
                <p>No ratings yet</p>
              </div>

              <div v-else class="space-y-4">
                <div
                  v-for="rating in profileData.ratings.recent"
                  :key="rating.id"
                  class="border rounded-lg p-4"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-3">
                      <img
                        :src="rating.rater?.avatar_url || defaultAvatar"
                        class="w-10 h-10 rounded-full object-cover"
                        @error="handleImageError"
                      />
                      <div>
                        <p class="font-medium">
                          {{ rating.rater?.first_name }} {{ rating.rater?.last_name }}
                        </p>
                        <p class="text-xs text-gray-500">{{ formatDate(rating.created_at) }}</p>
                      </div>
                    </div>
                    <div class="flex items-center">
                      <StarFilled
                        v-for="i in 5"
                        :key="i"
                        :class="i <= rating.score ? 'text-yellow-500' : 'text-gray-300'"
                      />
                    </div>
                  </div>
                  <p class="text-gray-700 mt-2">{{ rating.comment }}</p>
                  <a-tag size="small" class="mt-2">{{ rating.role_of_rater }}</a-tag>
                </div>
              </div>
            </div>
          </a-tab-pane>

          <!-- Points Tab - Only visible to self -->
          <a-tab-pane v-if="isOwnProfile" key="points" tab="Points & Rewards">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex justify-between items-center mb-6">
                <div>
                  <h3 class="text-lg font-medium">Current Balance</h3>
                  <p class="text-4xl font-bold text-orange-600 mt-2">
                    {{ profileData.statistics.points }} <span class="text-lg text-gray-500">points</span>
                  </p>
                </div>
                <TrophyOutlined class="text-6xl text-orange-600 opacity-10" />
              </div>

              <a-divider />

              <h4 class="font-medium mb-4">Points History</h4>
              <div v-if="pointsHistory.length === 0" class="text-center py-8 text-gray-500">
                <TrophyOutlined class="text-4xl mb-2" />
                <p>No points history yet</p>
              </div>
              <a-list v-else :data-source="pointsHistory" :loading="pointsLoading">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <div class="flex justify-between items-center w-full">
                      <div>
                        <p class="font-medium">{{ item.description }}</p>
                        <p class="text-xs text-gray-500">{{ formatDate(item.created_at) }}</p>
                      </div>
                      <div
                        :class="item.points > 0 ? 'text-green-600' : 'text-red-600'"
                        class="font-bold"
                      >
                        {{ item.points > 0 ? '+' : '' }}{{ item.points }}
                      </div>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </div>
          </a-tab-pane>

          <!-- Coupons Tab - Only visible to self -->
          <a-tab-pane v-if="isOwnProfile" key="coupons" tab="Coupons">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-medium">My Coupons</h3>
                <a-segmented
                  v-model:value="couponFilter"
                  :options="[
                    { label: 'Active', value: 'active' },
                    { label: 'Used', value: 'used' },
                    { label: 'Expired', value: 'expired' }
                  ]"
                />
              </div>

              <!-- Coupon Summary -->
              <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="bg-green-50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-green-600">{{ profileData.coupons.summary.active }}</p>
                  <p class="text-sm text-gray-600">Active</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-gray-600">{{ profileData.coupons.summary.used }}</p>
                  <p class="text-sm text-gray-600">Used</p>
                </div>
                <div class="bg-red-50 rounded-lg p-4 text-center">
                  <p class="text-2xl font-bold text-red-600">{{ profileData.coupons.summary.expired }}</p>
                  <p class="text-sm text-gray-600">Expired</p>
                </div>
              </div>

              <!-- Coupon List -->
              <div v-if="filteredCoupons.length === 0" class="text-center py-8 text-gray-500">
                <GiftOutlined class="text-4xl mb-2" />
                <p>No {{ couponFilter }} coupons</p>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="coupon in filteredCoupons"
                  :key="coupon.id"
                  class="border rounded-lg p-4 relative overflow-hidden"
                  :class="{
                    'border-green-500 bg-green-50': coupon.status === 'active',
                    'border-gray-300 bg-gray-50': coupon.status === 'used',
                    'border-red-300 bg-red-50': coupon.status === 'expired'
                  }"
                >
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h4 class="font-bold text-lg">{{ coupon.merchant_name }}</h4>
                      <p class="text-sm text-gray-600 mt-1">{{ coupon.description }}</p>
                      <div class="mt-3">
                        <div class="bg-white rounded px-3 py-2 inline-block font-mono font-bold text-lg">
                          {{ coupon.code }}
                        </div>
                      </div>
                      <p class="text-xs text-gray-500 mt-2">
                        Valid until: {{ formatDate(coupon.valid_until) }}
                      </p>
                      <p v-if="coupon.is_used && coupon.used_at" class="text-xs text-gray-500">
                        Used on: {{ formatDate(coupon.used_at) }}
                      </p>
                    </div>
                    <GiftOutlined class="text-4xl opacity-10" />
                  </div>

                  <a-button
                    v-if="coupon.status === 'active'"
                    type="primary"
                    size="small"
                    class="mt-3 !rounded-button bg-green-600 border-none hover:bg-green-700"
                    @click="useCoupon(coupon.id)"
                    :loading="coupon.using"
                  >
                    Use Coupon
                  </a-button>
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <a-modal
      v-model:open="showEditModal"
      title="Edit Profile"
      :footer="null"
      width="500px"
    >
      <a-form layout="vertical">
        <a-form-item label="First Name">
          <a-input v-model:value="editForm.first_name" />
        </a-form-item>
        <a-form-item label="Last Name">
          <a-input v-model:value="editForm.last_name" />
        </a-form-item>
        <a-form-item label="Avatar Image">
          <div class="space-y-3">
            <!-- Current Avatar Preview -->
            <div v-if="editForm.avatar_url" class="flex items-center space-x-3">
              <img
                :src="editForm.avatar_url"
                alt="Current Avatar"
                class="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                @error="handleImageError"
              />
              <a-button size="small" danger @click="removeAvatar">Remove</a-button>
            </div>

            <!-- Upload Button -->
            <div>
              <input
                ref="avatarInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarUpload"
              />
              <a-button @click="$refs.avatarInput.click()" :loading="uploadingAvatar">
                <UploadOutlined /> Choose Image
              </a-button>
              <p class="text-xs text-gray-500 mt-1">Max 5MB (JPEG, PNG, WebP)</p>
            </div>

            <!-- Upload Progress -->
            <div v-if="uploadingAvatar" class="text-sm text-blue-600">
              Uploading avatar...
            </div>
          </div>
        </a-form-item>
        <a-form-item label="University">
          <a-input v-model:value="editForm.university" />
        </a-form-item>
        <div class="flex justify-end space-x-2 mt-4">
          <a-button @click="showEditModal = false">Cancel</a-button>
          <a-button type="primary" @click="updateProfile" :loading="updating">
            Save Changes
          </a-button>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ExclamationCircleOutlined,
  MessageOutlined,
  EditOutlined,
  StarFilled,
  StarOutlined,
  CarOutlined,
  TeamOutlined,
  ShoppingOutlined,
  TrophyOutlined,
  GiftOutlined,
  UploadOutlined,
  HistoryOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { marketplaceAPI } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(true)
const error = ref(null)
const profileData = ref(null)
const activeTab = ref('history')
const historyFilter = ref('all')
const historyLoading = ref(false)
const history = ref([])
const couponFilter = ref('active')
const pointsHistory = ref([])
const pointsLoading = ref(false)
const showEditModal = ref(false)
const updating = ref(false)
const uploadingAvatar = ref(false)
const avatarInput = ref(null)
const editForm = ref({
  first_name: '',
  last_name: '',
  avatar_url: '',
  university: ''
})

const defaultAvatar = '/Profile_Photo.jpg'

// Computed
const userId = computed(() => route.params.userId || authStore.userId)
const isOwnProfile = computed(() => userId.value === authStore.userId)

const filteredHistory = computed(() => {
  if (historyFilter.value === 'all') return history.value
  return history.value.filter(item => {
    if (historyFilter.value === 'carpools') return item.type === 'carpool'
    if (historyFilter.value === 'activities') return item.type === 'activity'
    if (historyFilter.value === 'marketplace') return item.type === 'purchase'
    return true
  })
})

const filteredCoupons = computed(() => {
  if (!profileData.value) return []
  return profileData.value.coupons[couponFilter.value] || []
})

// Methods
const fetchProfileData = async () => {
  try {
    loading.value = true
    error.value = null

    const token = localStorage.getItem('userToken')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(
      `http://localhost:3001/api/v1/users/${userId.value}/profile`,
      { headers }
    )
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch profile')
    }

    profileData.value = data.data

    // Initialize edit form
    if (isOwnProfile.value) {
      editForm.value = {
        first_name: data.data.user.first_name || '',
        last_name: data.data.user.last_name || '',
        avatar_url: data.data.user.avatar_url || '',
        university: data.data.user.university || ''
      }
    }

    // Fetch history
    await fetchHistory()

    // Fetch points history if own profile
    if (isOwnProfile.value) {
      await fetchPointsHistory()
    }

  } catch (err) {
    console.error('Fetch profile error:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const fetchHistory = async () => {
  try {
    historyLoading.value = true
    const token = localStorage.getItem('userToken')

    const response = await fetch(
      `http://localhost:3001/api/v1/users/${userId.value}/history`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    const data = await response.json()
    if (data.success) {
      history.value = data.data.history || []
    }
  } catch (err) {
    console.error('Fetch history error:', err)
  } finally {
    historyLoading.value = false
  }
}

const fetchPointsHistory = async () => {
  try {
    pointsLoading.value = true
    const token = localStorage.getItem('userToken')

    const response = await fetch(
      `http://localhost:3001/api/v1/users/${userId.value}/points/history`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    const data = await response.json()
    if (data.success) {
      pointsHistory.value = data.data.history || []
    }
  } catch (err) {
    console.error('Fetch points history error:', err)
  } finally {
    pointsLoading.value = false
  }
}

const updateProfile = async () => {
  try {
    updating.value = true
    const token = localStorage.getItem('userToken')

    const response = await fetch(
      'http://localhost:3001/api/v1/users/profile',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm.value)
      }
    )

    const data = await response.json()
    if (data.success) {
      message.success('Profile updated successfully')
      showEditModal.value = false
      await fetchProfileData()
    } else {
      throw new Error(data.error?.message || 'Failed to update profile')
    }
  } catch (err) {
    console.error('Update profile error:', err)
    message.error(err.message)
  } finally {
    updating.value = false
  }
}

const useCoupon = async (couponId) => {
  try {
    const coupon = profileData.value.coupons.active.find(c => c.id === couponId)
    if (coupon) coupon.using = true

    const token = localStorage.getItem('userToken')

    const response = await fetch(
      `http://localhost:3001/api/v1/users/coupons/${couponId}/use`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    const data = await response.json()
    if (data.success) {
      message.success('Coupon used successfully!')
      await fetchProfileData()
    } else {
      throw new Error(data.error?.message || 'Failed to use coupon')
    }
  } catch (err) {
    console.error('Use coupon error:', err)
    message.error(err.message)
  }
}

const sendMessage = () => {
  router.push({
    path: '/messages',
    query: { userId: userId.value }
  })
}

const handleImageError = (e) => {
  e.target.src = defaultAvatar
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getRatingColor = (level) => {
  const colors = {
    'Bronze': 'orange',
    'Silver': 'default',
    'Gold': 'gold',
    'Platinum': 'purple',
    'Diamond': 'cyan'
  }
  return colors[level] || 'default'
}

const getHistoryTypeClass = (type) => {
  const classes = {
    'carpool': 'bg-red-100 text-[#C24D45]',
    'activity': 'bg-blue-100 text-blue-600',
    'purchase': 'bg-green-100 text-green-600'
  }
  return classes[type] || 'bg-gray-100 text-gray-600'
}

const getStatusColor = (status) => {
  const colors = {
    'completed': 'green',
    'confirmed': 'blue',
    'cancelled': 'red',
    'pending': 'orange'
  }
  return colors[status] || 'default'
}

// Avatar upload functions
const handleAvatarUpload = async (event) => {
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

  try {
    uploadingAvatar.value = true

    // Convert to base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const base64Image = e.target.result

        // Upload via marketplace API (reusing existing image upload endpoint)
        const response = await marketplaceAPI.uploadImage({ image: base64Image })

        if (response.data.success) {
          editForm.value.avatar_url = response.data.data.url
          message.success('Avatar uploaded successfully')
        } else {
          throw new Error(response.data.error?.message || 'Upload failed')
        }
      } catch (err) {
        console.error('Upload error:', err)
        message.error(err.message || 'Failed to upload avatar')
      } finally {
        uploadingAvatar.value = false
        // Reset input
        if (avatarInput.value) {
          avatarInput.value.value = ''
        }
      }
    }

    reader.onerror = () => {
      message.error('Failed to read image file')
      uploadingAvatar.value = false
    }

    reader.readAsDataURL(file)
  } catch (err) {
    console.error('Avatar upload error:', err)
    message.error('Failed to upload avatar')
    uploadingAvatar.value = false
  }
}

const removeAvatar = () => {
  editForm.value.avatar_url = ''
  message.success('Avatar removed')
}

// Lifecycle
onMounted(() => {
  fetchProfileData()
})
</script>

<style scoped>
.main-content {
  min-height: calc(100vh - 64px);
}

.profile-tabs :deep(.ant-tabs-nav) {
  background: white;
  padding: 0 24px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.profile-tabs :deep(.ant-tabs-tab) {
  font-weight: 500;
}
</style>
