<template>
  <a-modal
    :open="visible"
    title="活动签到二维码"
    :footer="null"
    @cancel="handleClose"
    width="500px"
    centered
  >
    <div class="qr-code-container">
      <!-- 活动信息 -->
      <div class="activity-info mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ activity?.title }}</h3>
        <div class="text-sm text-gray-600 space-y-1">
          <div class="flex items-center">
            <ClockCircleOutlined class="mr-2" />
            <span>{{ formatTime(activity?.start_time) }}</span>
          </div>
          <div class="flex items-center">
            <EnvironmentOutlined class="mr-2" />
            <span>{{ activity?.location }}</span>
          </div>
        </div>
      </div>

      <!-- 二维码 -->
      <div class="qr-code-wrapper text-center">
        <div v-if="checkinCode" class="mb-4">
          <qrcode-vue
            :value="qrCodeValue"
            :size="300"
            level="H"
            class="mx-auto"
          />
        </div>

        <!-- 签到码 -->
        <div class="checkin-code-display mt-4 p-4 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600 mb-2">签到码</div>
          <div class="text-3xl font-bold text-blue-600 tracking-wider">
            {{ checkinCode || '生成中...' }}
          </div>
          <div class="text-xs text-gray-500 mt-2">
            参与者可扫码或输入此签到码进行签到
          </div>
        </div>

        <!-- 签到统计 -->
        <div class="checkin-stats mt-4 p-4 bg-green-50 rounded-lg">
          <div class="flex justify-around">
            <div class="stat-item">
              <div class="text-2xl font-bold text-green-600">{{ participants?.length || 0 }}</div>
              <div class="text-xs text-gray-600">已报名</div>
            </div>
            <div class="stat-item">
              <div class="text-2xl font-bold text-blue-600">{{ checkedInCount }}</div>
              <div class="text-xs text-gray-600">已签到</div>
            </div>
            <div class="stat-item">
              <div class="text-2xl font-bold text-orange-600">{{ participants?.length - checkedInCount || 0 }}</div>
              <div class="text-xs text-gray-600">未签到</div>
            </div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="tips mt-4 text-left">
          <a-alert
            message="签到说明"
            type="info"
            show-icon
          >
            <template #description>
              <ul class="text-xs space-y-1 mt-2">
                <li>• 签到码每30分钟自动刷新</li>
                <li>• 参与者需要在活动时间内签到</li>
                <li>• 参与者需要在活动地点附近（{{活动.location_verification ? '500米' : '无距离限制'}}）</li>
                <li>• 签到成功后将获得积分奖励</li>
              </ul>
            </template>
          </a-alert>
        </div>

        <!-- 操作按钮 -->
        <div class="actions mt-6 flex gap-3">
          <a-button
            type="primary"
            block
            @click="refreshCode"
            :loading="refreshing"
          >
            <template #icon><ReloadOutlined /></template>
            刷新签到码
          </a-button>
          <a-button
            block
            @click="downloadQRCode"
          >
            <template #icon><DownloadOutlined /></template>
            下载二维码
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import QrcodeVue from 'qrcode.vue'
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue'
import { activitiesAPI } from '@/utils/api'
import dayjs from 'dayjs'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  activity: {
    type: Object,
    required: true
  },
  participants: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'refresh'])

const checkinCode = ref('')
const refreshing = ref(false)
let autoRefreshTimer = null

// 计算已签到人数
const checkedInCount = computed(() => {
  return props.participants?.filter(p => p.attendance_status === 'attended').length || 0
})

// 生成二维码的值
const qrCodeValue = computed(() => {
  if (!checkinCode.value || !props.activity) return ''

  // 二维码包含活动ID和签到码
  return JSON.stringify({
    type: 'activity_checkin',
    activityId: props.activity.id,
    checkinCode: checkinCode.value,
    activityTitle: props.activity.title,
    timestamp: Date.now()
  })
})

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 生成或获取签到码
const generateCheckinCode = async () => {
  if (!props.activity?.id) return

  try {
    const response = await activitiesAPI.generateCheckinCode(props.activity.id)
    if (response.data.success) {
      checkinCode.value = response.data.data.checkin_code
    }
  } catch (error) {
    console.error('生成签到码失败:', error)
    message.error('生成签到码失败')
  }
}

// 刷新签到码
const refreshCode = async () => {
  refreshing.value = true
  try {
    await generateCheckinCode()
    message.success('签到码已刷新')
    emit('refresh')
  } catch (error) {
    message.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

// 下载二维码
const downloadQRCode = () => {
  const canvas = document.querySelector('.qr-code-wrapper canvas')
  if (!canvas) {
    message.error('二维码未生成')
    return
  }

  const url = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = `activity-checkin-${props.activity.id}.png`
  link.href = url
  link.click()
  message.success('二维码已下载')
}

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false)
}

// 监听弹窗显示
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await generateCheckinCode()

    // 启动自动刷新（每30分钟）
    autoRefreshTimer = setInterval(() => {
      generateCheckinCode()
    }, 30 * 60 * 1000)
  } else {
    // 清除定时器
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
  }
})

// 组件卸载时清理
onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
})
</script>

<style scoped>
.qr-code-container {
  padding: 10px 0;
}

.stat-item {
  text-align: center;
}

.qr-code-wrapper canvas {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  background: white;
}
</style>
