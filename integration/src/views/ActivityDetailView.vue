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
        <a-button @click="goBack" type="primary">返回</a-button>
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
            返回活动列表
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
            <div class="w-12 h-12 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
              {{ getOrganizerInitial() }}
            </div>
            <div>
              <div class="font-semibold text-lg">组织者</div>
              <div class="text-gray-600">{{ getOrganizerName() }}</div>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-8">
            <h3 class="text-2xl font-bold mb-4 text-[#333333]">活动描述</h3>
            <p class="text-gray-700 leading-relaxed text-lg">{{ activity.description || '暂无描述' }}</p>
          </div>

          <!-- Activity Details - Unified Info Card -->
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
            <div class="p-6">
              <h3 class="text-2xl font-bold mb-6 text-[#333333] flex items-center">
                <InfoCircleOutlined class="text-2xl text-[#C24D45] mr-3" />
                活动详情
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <!-- Time Info -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <ClockCircleOutlined class="text-blue-500 mr-2" />
                    时间信息
                  </h4>
                  <div class="space-y-2 ml-6">
                    <div class="flex justify-between">
                      <span class="text-gray-600">开始时间：</span>
                      <span class="text-gray-900">{{ formatDateTime(activity.start_time) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">结束时间：</span>
                      <span class="text-gray-900">{{ formatDateTime(activity.end_time) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">持续时间：</span>
                      <span class="text-gray-900">{{ getDuration(activity.start_time, activity.end_time) }}</span>
                    </div>
                    <div v-if="activity.checkin_enabled" class="flex justify-between">
                      <span class="text-gray-600">签到状态：</span>
                      <span :class="getCheckinStatusClass()">{{ getCheckinStatusText() }}</span>
                    </div>
                  </div>
                </div>

                <!-- Location Info -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <EnvironmentOutlined class="text-green-500 mr-2" />
                    地点信息
                  </h4>
                  <div class="space-y-2 ml-6">
                    <div class="flex justify-between">
                      <span class="text-gray-600">活动地点：</span>
                      <span class="text-gray-900">{{ activity.location || '待定' }}</span>
                    </div>
                    <div v-if="activity.locationDetails" class="flex justify-between">
                      <span class="text-gray-600">详细地址：</span>
                      <span class="text-gray-900">{{ activity.locationDetails }}</span>
                    </div>
                    <div v-if="activity.location_verification" class="flex justify-between">
                      <span class="text-gray-600">位置验证：</span>
                      <span class="text-orange-600 font-medium">需要（{{ activity.verification_radius || 50 }}米范围内）</span>
                    </div>
                  </div>
                </div>

                <!-- Participants Info -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <TeamOutlined class="text-purple-500 mr-2" />
                    参与信息
                  </h4>
                  <div class="space-y-2 ml-6">
                    <div class="flex justify-between">
                      <span class="text-gray-600">当前参与：</span>
                      <span class="text-gray-900">{{ activity.current_participants || 0 }} 人</span>
                    </div>
                    <div v-if="activity.max_participants" class="flex justify-between">
                      <span class="text-gray-600">最大人数：</span>
                      <span class="text-gray-900">{{ activity.max_participants }} 人</span>
                    </div>
                    <div v-if="activity.max_participants" class="mt-3">
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          :style="{ width: getParticipationPercentage() + '%' }"
                        ></div>
                      </div>
                      <div class="text-sm text-gray-600 mt-1">
                        {{ getParticipationPercentage() }}% 已满
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Additional Info -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <InfoCircleOutlined class="text-orange-500 mr-2" />
                    其他信息
                  </h4>
                  <div class="space-y-2 ml-6">
                    <div v-if="activity.entry_fee" class="flex justify-between">
                      <span class="text-gray-600">参与费用：</span>
                      <span class="text-gray-900">${{ activity.entry_fee }}</span>
                    </div>
                    <div v-if="activity.reward_points" class="flex justify-between">
                      <span class="text-gray-600">奖励积分：</span>
                      <span class="text-gray-900">{{ activity.reward_points }} 分</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">创建时间：</span>
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

          <!-- 实时签到状态显示 -->
          <div v-if="activity.checkin_enabled" class="bg-blue-50 border border-blue-200 rounded-xl shadow-sm mb-8">
            <div class="p-6">
              <h3 class="text-2xl font-bold mb-6 text-[#333333] flex items-center">
                <ClockCircleOutlined class="text-2xl text-blue-600 mr-3" />
                实时签到状态
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 签到时间状态 -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-blue-800">时间状态</h4>
                  <div class="bg-white rounded-lg p-4">
                    <div class="text-blue-700 font-medium mb-2">{{ getCheckinTimeStatus }}</div>
                    <div class="text-sm text-gray-600">
                      当前时间：{{ getCurrentTimeString }}
                    </div>
                  </div>
                </div>

                <!-- 签到条件检查 -->
                <div class="space-y-3">
                  <h4 class="text-lg font-semibold text-blue-800">签到条件</h4>
                  <div class="bg-white rounded-lg p-4 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">活动注册：</span>
                      <span :class="activity.isRegistered ? 'text-green-600' : 'text-red-600'">
                        <CheckCircleOutlined v-if="activity.isRegistered" class="mr-1" />
                        <CloseCircleOutlined v-else class="mr-1" />
                        {{ activity.isRegistered ? '已注册' : '未注册' }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">签到窗口：</span>
                      <span :class="isWithinCheckinWindow ? 'text-green-600' : 'text-orange-600'">
                        <CheckCircleOutlined v-if="isWithinCheckinWindow" class="mr-1" />
                        <ClockCircleOutlined v-else class="mr-1" />
                        {{ isWithinCheckinWindow ? '已开启' : '未开启' }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">签到状态：</span>
                      <span :class="activity.user_checked_in ? 'text-green-600' : 'text-gray-600'">
                        <CheckCircleOutlined v-if="activity.user_checked_in" class="mr-1" />
                        <ClockCircleOutlined v-else class="mr-1" />
                        {{ activity.user_checked_in ? '已完成' : '未完成' }}
                      </span>
                    </div>
                    <div v-if="activity.location_verification" class="flex items-center justify-between">
                      <span class="text-gray-600">位置验证：</span>
                      <span class="text-orange-600">
                        <EnvironmentOutlined class="mr-1" />
                        需要（{{ activity.verification_radius || 50 }}米内）
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 签到按钮状态汇总 -->
              <div class="mt-6 p-4 rounded-lg" :class="canPerformCheckin ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'">
                <div class="flex items-center justify-center">
                  <div class="text-center">
                    <div v-if="canPerformCheckin" class="text-green-700 font-bold text-lg mb-2">
                      <CheckCircleOutlined class="mr-2 text-2xl" />
                      可以签到
                    </div>
                    <div v-else-if="activity.user_checked_in" class="text-green-700 font-bold text-lg mb-2">
                      <CheckCircleOutlined class="mr-2 text-2xl" />
                      签到已完成
                    </div>
                    <div v-else class="text-gray-700 font-bold text-lg mb-2">
                      <ClockCircleOutlined class="mr-2 text-2xl" />
                      暂不可签到
                    </div>
                    <div class="text-sm text-gray-600">
                      签到窗口：活动开始前 {{ activity.checkin_start_offset || 30 }} 分钟 至 结束后 {{ activity.checkin_end_offset || 30 }} 分钟
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Requirements -->
          <div v-if="activity.requirements" class="mb-8">
            <h3 class="text-2xl font-bold mb-4 text-[#333333]">参与要求</h3>
            <div class="bg-yellow-50 p-6 rounded-xl">
              <p class="text-gray-700 leading-relaxed">{{ activity.requirements }}</p>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="activity.tags && activity.tags.length > 0" class="mb-8">
            <h3 class="text-2xl font-bold mb-4 text-[#333333]">标签</h3>
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
                {{ canPerformCheckin ? '活动签到' : getCheckinButtonLabel() }}
              </a-button>
            </a-tooltip>

            <!-- Already checked in indicator -->
            <div
              v-if="activity.user_checked_in && activity.isRegistered"
              class="flex items-center justify-center bg-green-50 border border-green-200 rounded-lg p-3 flex-1"
            >
              <CheckCircleOutlined class="text-green-600 mr-2" />
              <span class="text-green-800 font-medium">已签到</span>
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
              {{ isActivityFull() ? '活动已满' : '加入活动' }}
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
              退出活动
            </a-button>

            <!-- Comment Button - Show for all users -->
            <a-button
              type="default"
              size="large"
              class="!rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 border-none hover:from-blue-600 hover:to-blue-700 text-white flex-1"
              @click="openCommentModal"
            >
              <MessageOutlined class="mr-2" />
              发表评论
            </a-button>

            <!-- QR Code button - Show for activity owners -->
            <a-button
              v-if="activity.isOwner"
              type="primary"
              size="large"
              class="!rounded-lg bg-gradient-to-r from-green-500 to-green-600 border-none hover:from-green-600 hover:to-green-700 flex-1"
              @click="showQRCode"
            >
              <QrcodeOutlined class="mr-2" />
              查看签到二维码
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
              编辑活动
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
              删除活动
            </a-button>

            <!-- Back button - Always visible -->
            <a-button
              size="large"
              class="!rounded-lg flex-1"
              @click="goBack"
            >
              <ArrowLeftOutlined class="mr-2" />
              返回
            </a-button>
          </div>

          <!-- Comments Section -->
          <div class="mt-8 pt-8 border-t border-gray-200">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-bold text-[#333333]">活动评论</h3>
              <span class="text-gray-500">{{ comments.length }} 条评论</span>
            </div>

            <!-- Comments List -->
            <div v-if="commentsLoading" class="text-center py-8">
              <a-spin />
            </div>
            <div v-else-if="comments.length === 0" class="text-center py-8 text-gray-500">
              <MessageOutlined class="text-4xl mb-4" />
              <p>还没有评论，快来发表第一条评论吧！</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="bg-gray-50 p-4 rounded-lg"
              >
                <div class="flex items-start space-x-3">
                  <div class="w-10 h-10 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold">
                    {{ getCommentUserInitial(comment) }}
                  </div>
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

      <!-- 签到二维码弹窗 -->
      <CheckInQRCode
        v-model:visible="showQRCodeModal"
        :activity="activity"
        :participants="participants"
        @refresh="fetchActivityDetails"
      />

      <!-- 签到扫码弹窗 -->
      <CheckInScanner
        v-model:open="showCheckinScannerModal"
        :activity="activity"
        @success="handleCheckinSuccess"
      />

      <!-- 位置签到弹窗（统一使用 ActivityCheckinModal） -->
      <ActivityCheckinModal
        v-if="activity"
        v-model:open="showActivityCheckinModal"
        :activity="activity"
        @checkin-success="handleActivityCheckinSuccess"
      />

      <!-- 评论弹窗 -->
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
  QrcodeOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons-vue'
import { activitiesAPI } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import CheckInQRCode from '@/components/activities/CheckInQRCode.vue'
import CheckInScanner from '@/components/activities/CheckInScanner.vue'
import ActivityCheckinModal from '@/components/activities/ActivityCheckinModal.vue'
import ContactOrganizerModal from '@/components/activities/ContactOrganizerModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

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
const showQRCodeModal = ref(false)
const showCheckinScannerModal = ref(false)
const showActivityCheckinModal = ref(false)
const showCommentModal = ref(false)

// 实时时间相关状态
const currentTime = ref(new Date())
const refreshTimer = ref(null)

// 实时时间管理函数
const startTimeRefresh = () => {
  refreshTimer.value = setInterval(() => {
    currentTime.value = new Date()
  }, 1000) // 每秒更新一次
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
    location: raw.location || '待定',
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

  const now = currentTime.value // 使用实时时间
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

// 获取实时签到时间状态
const getCheckinTimeStatus = computed(() => {
  if (!activity.value?.start_time || !activity.value?.end_time) return '时间未设置'

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
      return `签到将在 ${hours}小时${minutes}分钟后开始`
    } else {
      return `签到将在 ${minutes}分钟后开始`
    }
  } else if (now > windowEnd) {
    const minutesSince = Math.floor((now - windowEnd) / (1000 * 60))
    const hours = Math.floor(minutesSince / 60)
    const minutes = minutesSince % 60

    if (hours > 0) {
      return `签到已于 ${hours}小时${minutes}分钟前结束`
    } else {
      return `签到已于 ${minutes}分钟前结束`
    }
  } else {
    const minutesLeft = Math.floor((windowEnd - now) / (1000 * 60))
    const hours = Math.floor(minutesLeft / 60)
    const minutes = minutesLeft % 60

    if (hours > 0) {
      return `签到剩余 ${hours}小时${minutes}分钟`
    } else {
      return `签到剩余 ${minutes}分钟`
    }
  }
})

// 格式化当前时间显示
const getCurrentTimeString = computed(() => {
  return currentTime.value.toLocaleTimeString('zh-CN')
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
      message.success('成功加入活动！')
      activity.value.isRegistered = true
      activity.value.current_participants = (activity.value.current_participants || 0) + 1
      activity.value.user_participation = payload.participation || null
    }
  } catch (err) {
    console.error('❌ Error joining activity:', err)
    message.error(err.response?.data?.error?.message || '加入活动失败')
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
      message.success('已取消参与活动')
      activity.value.isRegistered = false
      activity.value.current_participants = Math.max(0, (activity.value.current_participants || 1) - 1)
      activity.value.user_participation = null
    }
  } catch (err) {
    console.error('❌ Error cancelling registration:', err)
    message.error(err.response?.data?.error?.message || '取消参与失败')
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
      message.success('活动已删除')
      router.push('/activities')
    }
  } catch (err) {
    console.error('❌ Error deleting activity:', err)
    message.error(err.response?.data?.error?.message || '删除活动失败')
  } finally {
    isDeleting.value = false
  }
}

// Edit activity
const editActivity = () => {
  // For now, just show a message since edit route might not exist
  message.info('编辑功能开发中，敬请期待！')
  // router.push(`/activities/${activity.value.id}/edit`)
}

// Show QR Code modal
const showQRCode = async () => {
  showQRCodeModal.value = true
  await fetchParticipants()
}

// Open check-in scanner
const openCheckinScanner = () => {
  showCheckinScannerModal.value = true
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
      message.success('评论已删除')
    }
  } catch (err) {
    console.error('❌ Error deleting comment:', err)
    message.error(err.response?.data?.error?.message || '删除评论失败')
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

  if (diffInMinutes < 1) return '刚刚'
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}小时前`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}天前`

  return date.toLocaleDateString('zh-CN')
}

// Handle check-in success
const handleCheckinSuccess = async () => {
  message.success('签到成功，已获得积分奖励！')
  await fetchActivityDetails()
}

// Handle location check-in success
const handleActivityCheckinSuccess = async (payload) => {
  const points = payload?.result?.pointsAwarded ?? activity.value?.reward_points ?? 0
  if (points > 0) {
    message.success(`签到成功，获得 ${points} 积分！`)
  } else {
    message.success('签到成功！')
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
  message.success('消息发送成功！')
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
  if (!dateString) return '待定'
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '待定'
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end - start
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffHours > 0) {
    return `${diffHours}小时${diffMinutes > 0 ? diffMinutes + '分钟' : ''}`
  } else {
    return `${diffMinutes}分钟`
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
    return '时间未知'
  }
  
  const now = new Date()
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '时间无效'
  }
  
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffInMinutes < 1) {
    return '刚刚'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}小时前`
  } else if (diffInMinutes < 10080) { // 7 days
    const days = Math.floor(diffInMinutes / 1440)
    return `${days}天前`
  } else {
    const weeks = Math.floor(diffInMinutes / 10080)
    return `${weeks}周前`
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
    academic: '学术',
    sports: '运动',
    social: '社交',
    volunteer: '志愿',
    career: '职业',
    cultural: '文化',
    technology: '科技'
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
    draft: '草稿',
    published: '已发布',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    archived: '已归档'
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

const getCheckinStatusText = () => {
  if (!activity.value) return '未知'

  if (activity.value.user_checked_in) {
    return '已签到'
  }

  if (!activity.value.isRegistered) {
    return '未报名'
  }

  if (!activity.value.checkin_enabled) {
    return '未启用签到'
  }

  if (canPerformCheckin.value) {
    return '可以签到'
  }

  if (isWithinCheckinWindow.value) {
    return '签到窗口已开启'
  }

  return '签到窗口未开启'
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
    return '点击进行活动签到'
  }

  if (!activity.value.isRegistered) {
    return '请先加入活动才能签到'
  }

  if (!activity.value.checkin_enabled) {
    return '此活动未启用签到功能'
  }

  if (activity.value.user_checked_in) {
    return '您已经完成签到'
  }

  if (!isWithinCheckinWindow.value) {
    const now = new Date()
    const start = new Date(activity.value.start_time)
    const startOffset = activity.value.checkin_start_offset ?? 30
    const checkinStart = new Date(start.getTime() - startOffset * 60 * 1000)

    if (now < checkinStart) {
      const minutesUntil = Math.ceil((checkinStart - now) / (1000 * 60))
      if (minutesUntil < 60) {
        return `签到将在 ${minutesUntil} 分钟后开始`
      } else {
        const hoursUntil = Math.floor(minutesUntil / 60)
        const remainingMinutes = minutesUntil % 60
        return `签到将在 ${hoursUntil} 小时 ${remainingMinutes} 分钟后开始`
      }
    } else {
      return '签到时间已过'
    }
  }

  return '暂不可签到'
}

const getCheckinButtonLabel = () => {
  if (!activity.value) return '暂不可签到'

  if (!activity.value.checkin_enabled) {
    return '签到未启用'
  }

  if (!isWithinCheckinWindow.value) {
    return '签到未开放'
  }

  return '暂不可签到'
}

// Lifecycle
onMounted(async () => {
  startTimeRefresh() // 启动实时时间更新
  await fetchActivityDetails()
  if (activity.value) {
    await fetchComments()
  }
})

onUnmounted(() => {
  stopTimeRefresh() // 清理定时器
})
</script>

<style scoped>
.main-content {
  min-height: 100vh;
}
</style>
