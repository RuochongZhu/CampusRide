<template>
  <a-modal
    :open="visible"
    title="扫码签到"
    :footer="null"
    @cancel="handleClose"
    width="500px"
    centered
  >
    <div class="checkin-scanner-container">
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

      <!-- 签到方式选择 -->
      <a-tabs v-model:activeKey="checkinMethod" class="mb-4">
        <a-tab-pane key="qrcode" tab="扫描二维码">
          <!-- QR码扫描器 -->
          <div class="qr-scanner-wrapper">
            <div v-if="!scannerActive" class="text-center py-8">
              <a-button
                type="primary"
                size="large"
                @click="startScanner"
                class="bg-[#C24D45] hover:bg-[#A93C35]"
              >
                <template #icon><CameraOutlined /></template>
                启动摄像头
              </a-button>
            </div>

            <div v-else class="scanner-area">
              <div id="qr-reader" class="qr-reader"></div>
              <div class="scanner-controls mt-4 flex justify-center gap-3">
                <a-button @click="stopScanner" danger>
                  <template #icon><CloseOutlined /></template>
                  关闭摄像头
                </a-button>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="manual" tab="手动输入">
          <!-- 手动输入签到码 -->
          <div class="manual-input p-4">
            <a-form layout="vertical">
              <a-form-item label="签到码">
                <a-input
                  v-model:value="manualCode"
                  placeholder="请输入6位签到码"
                  size="large"
                  :maxlength="6"
                  class="text-center text-2xl tracking-wider font-mono"
                />
              </a-form-item>
              <a-button
                type="primary"
                size="large"
                block
                @click="handleManualCheckin"
                :loading="checkingIn"
                :disabled="!manualCode || manualCode.length !== 6"
                class="bg-[#C24D45] hover:bg-[#A93C35]"
              >
                <template #icon><CheckCircleOutlined /></template>
                确认签到
              </a-button>
            </a-form>
          </div>
        </a-tab-pane>
      </a-tabs>

      <!-- 签到提示 -->
      <div class="tips mt-4">
        <a-alert
          message="签到提示"
          type="info"
          show-icon
        >
          <template #description>
            <ul class="text-xs space-y-1 mt-2">
              <li>• 请确保您已报名参加此活动</li>
              <li>• 签到需要在活动时间内进行</li>
              <li v-if="activity?.location_verification">• 需要在活动地点附近（500米内）</li>
              <li>• 签到成功后将获得积分奖励</li>
            </ul>
          </template>
        </a-alert>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  CloseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'
import { activitiesAPI } from '@/utils/api'
import dayjs from 'dayjs'
import { Html5Qrcode } from 'html5-qrcode'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  activity: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'success'])

const checkinMethod = ref('qrcode')
const scannerActive = ref(false)
const manualCode = ref('')
const checkingIn = ref(false)
let html5QrCode = null

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 启动扫描器
const startScanner = async () => {
  try {
    scannerActive.value = true

    // 等待DOM更新
    await new Promise(resolve => setTimeout(resolve, 100))

    html5QrCode = new Html5Qrcode("qr-reader")

    await html5QrCode.start(
      { facingMode: "environment" }, // 使用后置摄像头
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      onScanSuccess,
      onScanError
    )
  } catch (error) {
    console.error('启动扫描器失败:', error)
    message.error('无法启动摄像头，请检查权限设置')
    scannerActive.value = false
  }
}

// 停止扫描器
const stopScanner = async () => {
  if (html5QrCode) {
    try {
      await html5QrCode.stop()
      html5QrCode = null
    } catch (error) {
      console.error('停止扫描器失败:', error)
    }
  }
  scannerActive.value = false
}

// 扫描成功回调
const onScanSuccess = async (decodedText, decodedResult) => {
  try {
    // 解析QR码内容
    const qrData = JSON.parse(decodedText)

    if (qrData.type === 'activity_checkin' && qrData.activityId === props.activity.id) {
      await handleCheckin(qrData.checkinCode)
    } else {
      message.error('二维码无效或不属于此活动')
    }
  } catch (error) {
    console.error('解析二维码失败:', error)
    message.error('二维码格式错误')
  }
}

// 扫描错误回调（静默处理）
const onScanError = (error) => {
  // 不显示错误，扫描器会持续尝试
}

// 处理签到
const handleCheckin = async (checkinCode) => {
  if (checkingIn.value) return

  checkingIn.value = true

  try {
    // 获取当前位置
    let location = null
    if (props.activity.location_verification) {
      try {
        location = await getCurrentLocation()
      } catch (error) {
        message.error('无法获取位置信息，签到失败')
        checkingIn.value = false
        return
      }
    }

    // 调用签到API
    const response = await activitiesAPI.checkinActivity(props.activity.id, {
      checkin_code: checkinCode,
      location: location
    })

    if (response.data.success) {
      message.success('签到成功！')
      await stopScanner()
      emit('success')
      emit('update:visible', false)
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || '签到失败'
    message.error(errorMsg)
  } finally {
    checkingIn.value = false
  }
}

// 手动输入签到
const handleManualCheckin = async () => {
  await handleCheckin(manualCode.value)
}

// 获取当前位置
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        reject(new Error('无法获取位置'))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

// 关闭弹窗
const handleClose = async () => {
  await stopScanner()
  emit('update:visible', false)
}

// 监听弹窗关闭
watch(() => props.visible, async (newVal) => {
  if (!newVal) {
    await stopScanner()
    manualCode.value = ''
    checkinMethod.value = 'qrcode'
  }
})

// 组件卸载时清理
onUnmounted(async () => {
  await stopScanner()
})
</script>

<style scoped>
.checkin-scanner-container {
  padding: 10px 0;
}

.qr-reader {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.scanner-area {
  margin-top: 20px;
}

:deep(.ant-tabs-tab) {
  font-size: 16px;
}

:deep(#qr-reader__dashboard_section_csr) {
  display: none !important;
}
</style>
