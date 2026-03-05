<template>
  <a-modal
    v-model:open="visible"
    :title="`${activity?.title} - 活动签到`"
    width="500px"
    :footer="null"
    :maskClosable="false"
    @cancel="handleCancel"
  >
    <div class="checkin-modal">
      <!-- 活动信息 -->
      <div class="bg-gray-50 p-4 rounded-lg mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold">
            {{ getActivityInitial() }}
          </div>
          <div class="flex-1">
            <div class="font-medium text-gray-900">{{ activity?.title }}</div>
            <div class="text-sm text-gray-600">
              <EnvironmentOutlined class="mr-1" />
              {{ activity?.location }}
            </div>
            <div class="text-sm text-gray-600">
              <ClockCircleOutlined class="mr-1" />
              {{ formatActivityTime() }}
            </div>
          </div>
          <a-tag :color="getActivityStatusColor()" class="ml-2">
            {{ getActivityStatusText() }}
          </a-tag>
        </div>
      </div>

      <!-- 签到状态 -->
      <div v-if="checkinStatus" class="mb-4">
        <!-- Checking -->
        <div v-if="checkingEligibility" class="text-center py-6">
          <a-spin size="large" />
          <div class="mt-2 text-gray-600">正在检查签到条件...</div>
        </div>

        <!-- Cannot Check-in -->
        <div v-else-if="!checkinStatus.canCheckin" class="text-center py-6">
          <div class="text-red-500 text-lg mb-2">
            <CloseCircleOutlined />
          </div>
          <div class="text-gray-800 font-medium mb-2">无法签到</div>
          <div class="text-gray-600">{{ checkinStatus.reason }}</div>

          <div v-if="checkinStatus.checkinPeriod" class="mt-4 p-3 bg-blue-50 rounded-lg">
            <div class="text-sm text-blue-800">
              <strong>签到时间：</strong><br>
              {{ formatDateTime(checkinStatus.checkinPeriod.start) }} 至<br>
              {{ formatDateTime(checkinStatus.checkinPeriod.end) }}
            </div>
          </div>
        </div>

        <!-- Can Check-in -->
        <div v-else class="space-y-4">
          <!-- 时间剩余提示 -->
          <div v-if="checkinStatus.timeRemainingText" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <ClockCircleOutlined class="text-blue-600 mt-1" />
              <div>
                <div class="font-medium text-blue-800">签到时间剩余</div>
                <div class="text-sm text-blue-700 mt-1">
                  签到将在 {{ checkinStatus.timeRemainingText }} 后结束
                </div>
              </div>
            </div>
          </div>

          <!-- 位置验证提示 -->
          <div v-if="checkinStatus.requiresLocation" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <EnvironmentOutlined class="text-yellow-600 mt-1" />
              <div>
                <div class="font-medium text-yellow-800">需要位置验证</div>
                <div class="text-sm text-yellow-700 mt-1">
                  请在距离活动地点 {{ checkinStatus.verificationRadius }} 米范围内完成签到
                </div>
              </div>
            </div>
          </div>

          <!-- 位置状态 -->
          <div v-if="checkinStatus.requiresLocation">
            <div v-if="gettingLocation" class="flex items-center space-x-2 text-blue-600">
              <a-spin size="small" />
              <span>正在获取位置信息...</span>
            </div>

            <div v-else-if="locationError" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <div class="text-red-800 text-sm">
                <ExclamationCircleOutlined class="mr-1" />
                {{ locationError }}
              </div>
              <a-button
                size="small"
                type="link"
                @click="getCurrentLocation"
                class="p-0 mt-1"
              >
                重新获取位置
              </a-button>
            </div>

            <div v-else-if="userLocation" class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="text-green-800 text-sm">
                <CheckCircleOutlined class="mr-1" />
                位置获取成功（精度：±{{ Math.round(userLocation.accuracy) }} 米）
              </div>
            </div>

            <div v-else class="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div class="text-gray-700 text-sm">
                <EnvironmentOutlined class="mr-1" />
                请允许浏览器访问位置信息以完成签到
              </div>
              <a-button
                size="small"
                type="primary"
                @click="getCurrentLocation"
                class="mt-2"
              >
                获取位置
              </a-button>
            </div>
          </div>

          <!-- 签到按钮 -->
          <div class="text-center pt-4">
            <a-button
              type="primary"
              size="large"
              :loading="performingCheckin"
              :disabled="checkinStatus.requiresLocation && !userLocation"
              @click="handleCheckin"
              class="bg-[#C24D45] border-none hover:bg-[#A93C35] px-8"
            >
              <CheckCircleOutlined v-if="!performingCheckin" class="mr-2" />
              {{ performingCheckin ? '正在签到...' : '确认签到' }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 签到成功 -->
      <div v-if="checkinResult" class="text-center py-6">
        <div class="text-green-500 text-4xl mb-4">
          <CheckCircleOutlined />
        </div>
        <div class="text-lg font-medium text-gray-800 mb-2">签到成功！</div>
        <div class="text-gray-600 mb-4">
          签到时间：{{ formatDateTime(checkinResult.checkinTime) }}
        </div>

        <div v-if="checkinResult.distance !== undefined" class="bg-green-50 rounded-lg p-3 mb-4">
          <div class="text-sm text-green-800">
            <EnvironmentOutlined class="mr-1" />
            距离活动地点：{{ checkinResult.distance }} 米
            <CheckCircleOutlined class="ml-2 text-green-600" v-if="checkinResult.locationVerified" />
          </div>
        </div>

        <div v-if="checkinResult.pointsAwarded" class="bg-yellow-50 rounded-lg p-3 mb-4">
          <div class="text-sm text-yellow-800">
            <StarOutlined class="mr-1" />
            获得积分：+{{ checkinResult.pointsAwarded }} 分
          </div>
        </div>

        <a-button type="primary" @click="handleCancel" class="bg-[#C24D45] border-none">
          好的
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  StarOutlined
} from '@ant-design/icons-vue'
import { checkinAPI } from '@/utils/api'

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  activity: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:open', 'checkin-success'])

// Reactive data
const checkinStatus = ref(null)
const checkingEligibility = ref(false)
const gettingLocation = ref(false)
const userLocation = ref(null)
const locationError = ref('')
const performingCheckin = ref(false)
const checkinResult = ref(null)

// Computed
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Methods
const checkCheckinEligibility = async () => {
  if (!props.activity?.id) return

  try {
    checkingEligibility.value = true
    checkinStatus.value = null
    checkinResult.value = null

    console.log('🔍 Checking checkin eligibility for activity:', props.activity.id)
    const response = await checkinAPI.checkEligibility(props.activity.id)
    console.log('✅ Checkin eligibility response:', response.data)

    if (response.data?.success) {
      checkinStatus.value = response.data.data

      // If location verification is required and no location yet, automatically get it
      if (checkinStatus.value.requiresLocation && !userLocation.value) {
        await getCurrentLocation()
      }
    }
  } catch (error) {
    console.error('❌ Failed to check checkin eligibility:', error)
    console.error('❌ Error details:', error.response?.data)

    // Show more specific error message
    let errorMessage = '检查签到条件失败'
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message
    } else if (error.response?.status === 400) {
      errorMessage = '请求参数错误，请联系管理员'
    } else if (error.response?.status === 401) {
      errorMessage = '认证失败，请重新登录'
    }

    message.error(errorMessage)
  } finally {
    checkingEligibility.value = false
  }
}

const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    locationError.value = '当前浏览器不支持定位服务'
    return
  }

  gettingLocation.value = true
  locationError.value = ''

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000 // 5-minute cached location is acceptable
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options)
    })

    userLocation.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString()
    }

    console.log('Location obtained:', userLocation.value)
  } catch (error) {
    console.error('Location error:', error)

    switch (error.code) {
      case error.PERMISSION_DENIED:
        locationError.value = '已拒绝位置权限，请在浏览器设置中允许访问位置信息'
        break
      case error.POSITION_UNAVAILABLE:
        locationError.value = '无法获取当前位置'
        break
      case error.TIMEOUT:
        locationError.value = '获取位置超时，请重试'
        break
      default:
        locationError.value = '获取位置失败，请重试'
        break
    }
  } finally {
    gettingLocation.value = false
  }
}

const handleCheckin = async () => {
  if (!props.activity?.id) return

  try {
    performingCheckin.value = true

    const checkinData = {
      userLocation: userLocation.value,
      deviceInfo: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }

    const response = await checkinAPI.performCheckin(props.activity.id, checkinData)

    if (response.data?.success) {
      checkinResult.value = response.data.data
      message.success(response.data.message || '签到成功！')

      // Notify parent component of successful check-in
      emit('checkin-success', {
        activityId: props.activity.id,
        result: checkinResult.value
      })
    }
  } catch (error) {
    console.error('Failed to perform checkin:', error)

    const errorMessage = error.response?.data?.error?.message || '签到失败'
    message.error(errorMessage)

    // If it's a distance issue, show detailed information
    if (error.response?.data?.error?.distance !== undefined) {
      const { distance, requiredRadius } = error.response.data.error
      message.warning(`当前距离活动地点约 ${Math.round(distance)} 米，需要在 ${requiredRadius} 米范围内才能签到`)
    }
  } finally {
    performingCheckin.value = false
  }
}

const handleCancel = () => {
  visible.value = false

  // Reset state
  setTimeout(() => {
    checkinStatus.value = null
    checkinResult.value = null
    userLocation.value = null
    locationError.value = ''
  }, 300)
}

const getActivityInitial = () => {
  return props.activity?.title?.charAt(0)?.toUpperCase() || 'A'
}

const getActivityStatusColor = () => {
  const status = props.activity?.status
  switch (status) {
    case 'ongoing':
      return 'green'
    case 'upcoming':
      return 'blue'
    case 'completed':
      return 'gray'
    default:
      return 'default'
  }
}

const getActivityStatusText = () => {
  const status = props.activity?.status
  switch (status) {
    case 'ongoing':
      return '进行中'
    case 'upcoming':
      return '即将开始'
    case 'completed':
      return '已结束'
    default:
      return '未知状态'
  }
}

const formatActivityTime = () => {
  if (!props.activity?.start_time) return ''

  const start = new Date(props.activity.start_time)
  const end = props.activity.end_time ? new Date(props.activity.end_time) : null

  const startStr = start.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  if (end) {
    const endStr = end.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${startStr} - ${endStr}`
  }

  return startStr
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Watch for modal visibility
watch(
  () => props.open,
  (isVisible) => {
    if (isVisible && props.activity?.id) {
      console.log('🚀 Modal opened for activity:', props.activity.id)
      console.log('🚀 Activity data:', props.activity)
      checkCheckinEligibility()
    }
  }
)
</script>

<style scoped>
.checkin-modal {
  max-height: 70vh;
  overflow-y: auto;
}

/* Custom scrollbar styling */
.checkin-modal::-webkit-scrollbar {
  width: 6px;
}

.checkin-modal::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.checkin-modal::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.checkin-modal::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
