<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    width="500px"
    :footer="null"
    @cancel="closeModal"
  >
    <div class="user-profile-modal">
      <!-- 用户信息头部 -->
      <div class="user-header">
        <div class="user-avatar">
          {{ getUserInitials(userInfo.first_name, userInfo.last_name) }}
        </div>
        <div class="user-details">
          <h3 class="user-name">{{ getUserDisplayName(userInfo) }}</h3>
          <p class="user-email" v-if="userInfo.email">{{ userInfo.email }}</p>
          <p class="user-role" v-if="userInfo.role">{{ formatRole(userInfo.role) }}</p>
        </div>
      </div>

      <!-- 消息发送区域 -->
      <div class="message-section">
        <h4>发送消息</h4>

        <!-- 回复限制提示 -->
        <div v-if="showReplyWarning" class="reply-warning">
          <a-alert
            type="warning"
            show-icon
            :message="replyWarningMessage"
            description="为了防止骚扰，您需要等待对方回复后才能发送更多消息。"
          />
        </div>

        <!-- 消息输入框 -->
        <div class="message-input-area" :class="{ disabled: showReplyWarning }">
          <a-form @finish="handleSendMessage">
            <a-form-item>
              <a-input
                v-model:value="messageForm.subject"
                placeholder="消息标题（可选）"
                :disabled="sending || showReplyWarning"
              />
            </a-form-item>
            <a-form-item>
              <a-textarea
                v-model:value="messageForm.content"
                :rows="4"
                placeholder="输入您的消息..."
                :maxlength="2000"
                show-count
                :disabled="sending || showReplyWarning"
              />
            </a-form-item>
            <a-form-item class="form-actions">
              <a-space>
                <a-button
                  type="primary"
                  html-type="submit"
                  :loading="sending"
                  :disabled="!messageForm.content?.trim() || showReplyWarning"
                >
                  发送消息
                </a-button>
                <a-button @click="closeModal">
                  取消
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </div>

        <!-- 现有对话 -->
        <div v-if="existingThread" class="existing-thread">
          <h4>现有对话</h4>
          <div class="thread-preview">
            <div class="thread-info">
              <span class="thread-subject">{{ existingThread.subject || '无标题对话' }}</span>
              <span class="thread-time">{{ formatTime(existingThread.updated_at) }}</span>
            </div>
            <a-button
              type="link"
              @click="viewFullConversation"
              size="small"
            >
              查看完整对话
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { messagesAPI } from '@/utils/api'
import { useMessageStore } from '@/stores/message'
import { useRouter } from 'vue-router'
import { sanitizePublicDisplayName } from '@/utils/publicName'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    required: true
  },
  userInfo: {
    type: Object,
    required: true
  },
  contextType: {
    type: String, // 'activity', 'group', 'marketplace', 'leaderboard' 等
    default: 'general'
  },
  contextId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'messageSent'])

const messageStore = useMessageStore()
const router = useRouter()

// 响应式数据
const visible = ref(props.modelValue)
const sending = ref(false)
const loading = ref(false)
const existingThread = ref(null)
const replyStatus = ref(null) // { awaiting_reply: boolean, can_send: boolean }

const messageForm = ref({
  subject: '',
  content: ''
})

// 计算属性
const modalTitle = computed(() => {
  const name = getUserDisplayName(props.userInfo)
  return `发消息给 ${name}`
})

const showReplyWarning = computed(() => {
  return replyStatus.value?.awaiting_reply && !replyStatus.value?.can_send
})

const replyWarningMessage = computed(() => {
  if (existingThread.value) {
    return `您已向 ${getUserDisplayName(props.userInfo)} 发送过消息`
  }
  return '等待对方回复中...'
})

// 监听器
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    initializeModal()
  } else {
    resetForm()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 方法
async function initializeModal() {
  loading.value = true
  try {
    // 检查是否已有对话线程
    await checkExistingThread()

    // 检查回复状态
    await checkReplyStatus()

  } catch (error) {
    console.error('初始化用户模态框失败:', error)
    message.error('加载用户信息失败')
  } finally {
    loading.value = false
  }
}

async function checkExistingThread() {
  try {
    const response = await messagesAPI.getMessageThreads({
      with_user_id: props.userId,
      limit: 1
    })

    if (response.data?.threads?.length > 0) {
      existingThread.value = response.data.threads[0]
    }
  } catch (error) {
    console.error('检查现有线程失败:', error)
  }
}

async function checkReplyStatus() {
  if (!existingThread.value) {
    // 如果没有现有线程，可以发送第一条消息
    replyStatus.value = { awaiting_reply: false, can_send: true }
    return
  }

  try {
    // 调用新的 API 检查回复状态
    const response = await messagesAPI.checkReplyStatus(existingThread.value.thread_id)
    replyStatus.value = response.data
  } catch (error) {
    console.error('检查回复状态失败:', error)
    // 默认允许发送（降级处理）
    replyStatus.value = { awaiting_reply: false, can_send: true }
  }
}

async function handleSendMessage() {
  if (!messageForm.value.content?.trim()) {
    message.warning('请输入消息内容')
    return
  }

  if (showReplyWarning.value) {
    message.warning('请等待对方回复后再发送消息')
    return
  }

  sending.value = true
  try {
    const messageData = {
      receiver_id: props.userId,
      subject: messageForm.value.subject?.trim() || generateSubject(),
      content: messageForm.value.content.trim(),
      message_type: getMessageType(),
      context_type: props.contextType,
      context_id: props.contextId
    }

    let response
    if (existingThread.value) {
      // 回复现有线程
      response = await messagesAPI.replyToThread(existingThread.value.thread_id, {
        content: messageData.content
      })
    } else {
      // 创建新线程
      response = await messagesAPI.sendMessage(messageData)
    }

    message.success('消息发送成功！')

    // 刷新消息存储
    await messageStore.loadMessageThreads(true) // force refresh

    emit('messageSent', response.data)
    closeModal()

  } catch (error) {
    console.error('发送消息失败:', error)
    const errorMessage = error.response?.data?.message || '发送消息失败，请重试'
    message.error(errorMessage)
  } finally {
    sending.value = false
  }
}

function generateSubject() {
  const contextLabels = {
    activity: '关于活动的消息',
    group: '群组消息',
    marketplace: '关于商品的消息',
    leaderboard: '排行榜消息',
    general: '私人消息'
  }
  return contextLabels[props.contextType] || '私人消息'
}

function getMessageType() {
  const typeMap = {
    activity: 'activity_inquiry',
    group: 'general',
    marketplace: 'general',
    leaderboard: 'general',
    general: 'general'
  }
  return typeMap[props.contextType] || 'general'
}

async function viewFullConversation() {
  closeModal()

  // 跳转到消息页面，并选中该线程
  await router.push('/messages')

  // 等待路由跳转完成后选中线程
  setTimeout(() => {
    messageStore.selectedThreadId = existingThread.value.thread_id
  }, 100)
}

function closeModal() {
  visible.value = false
  resetForm()
}

function resetForm() {
  messageForm.value = {
    subject: '',
    content: ''
  }
  existingThread.value = null
  replyStatus.value = null
}

// 工具函数
function getUserDisplayName(user) {
  if (user.nickname) return sanitizePublicDisplayName(user.nickname, user.email, '未知用户')
  if (user.first_name || user.last_name) {
    return sanitizePublicDisplayName(`${user.first_name || ''} ${user.last_name || ''}`.trim(), user.email, '未知用户')
  }
  return sanitizePublicDisplayName('', user.email, '未知用户')
}

function getUserInitials(firstName, lastName) {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return first + last || '?'
}

function formatRole(role) {
  const roleMap = {
    'student': '学生',
    'faculty': '教职工',
    'admin': '管理员',
    'moderator': '版主'
  }
  return roleMap[role] || role
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  } else if (diffMinutes < 1440) {
    return `${Math.floor(diffMinutes / 60)} 小时前`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style scoped>
.user-profile-modal {
  padding: 8px 0;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.user-email {
  margin: 0 0 4px 0;
  color: #8c8c8c;
  font-size: 14px;
}

.user-role {
  margin: 0;
  color: #1890ff;
  font-size: 12px;
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.message-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.reply-warning {
  margin-bottom: 16px;
}

.message-input-area.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.form-actions {
  margin-bottom: 0;
}

.existing-thread {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.thread-preview {
  background: #fafafa;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.thread-info {
  flex: 1;
}

.thread-subject {
  display: block;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.thread-time {
  font-size: 12px;
  color: #8c8c8c;
}
</style>
