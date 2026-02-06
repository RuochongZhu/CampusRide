<template>
  <a-modal
    v-model:open="visible"
    :title="`${group?.name} Group Chat`"
    width="800px"
    :footer="null"
    :maskClosable="false"
    @cancel="handleCancel"
  >
    <div class="h-[500px] flex flex-col">
      <!-- Group Info -->
      <div class="bg-gray-50 p-3 rounded-lg mb-4 flex items-center space-x-3">
        <div class="w-10 h-10 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold">
          {{ getGroupInitial() }}
        </div>
        <div>
          <div class="font-medium text-gray-900">{{ group?.name }}</div>
          <div class="text-sm text-gray-600">{{ group?.member_count || 0 }} members online</div>
        </div>
        <div class="flex-1"></div>
        <a-tag color="green">Group Chat</a-tag>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4" ref="messagesContainer">
        <div v-if="messagesLoading" class="text-center py-8">
          <a-spin />
        </div>
        <div v-else-if="groupMessages.length === 0" class="text-center py-8 text-gray-500">
          <MessageOutlined class="text-4xl mb-4" />
          <p>No messages yet, start chatting!</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="message in groupMessages"
            :key="message.id"
            class="flex"
            :class="message.sender_id === currentUserId ? 'justify-end' : 'justify-start'"
          >
            <div class="max-w-[70%]">
              <div v-if="message.sender_id !== currentUserId" class="flex items-center space-x-2 mb-1 ml-2">
                <!-- 用户头像 -->
                <img
                  v-if="message.sender?.avatar_url"
                  :src="message.sender.avatar_url"
                  :alt="getUserName(message.sender)"
                  class="w-6 h-6 rounded-full object-cover cursor-pointer hover:opacity-80"
                  @click="showUserMenu(message.sender)"
                  :title="getUserName(message.sender)"
                />
                <div
                  v-else
                  class="w-6 h-6 bg-[#C24D45] rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-80"
                  @click="showUserMenu(message.sender)"
                  :title="getUserName(message.sender)"
                >
                  {{ getUserName(message.sender).charAt(0).toUpperCase() }}
                </div>
                <!-- 用户名 -->
                <span class="text-xs text-gray-500">{{ getUserName(message.sender) }}</span>
              </div>
              <div
                class="p-3 rounded-lg break-words"
                :class="message.sender_id === currentUserId
                  ? 'bg-[#C24D45] text-white rounded-br-sm'
                  : 'bg-gray-200 text-gray-900 rounded-bl-sm'"
              >
                <div class="mb-1">{{ message.content }}</div>
                <div
                  class="text-xs opacity-75"
                  :class="message.sender_id === currentUserId ? 'text-white' : 'text-gray-500'"
                >
                  {{ formatMessageTime(message.created_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="flex space-x-3">
        <a-textarea
          v-model:value="newMessage"
          placeholder="Type a message..."
          :rows="2"
          :maxlength="500"
          show-count
          @keydown.enter.ctrl="sendMessage"
          @keydown.enter.meta="sendMessage"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <a-button
          type="primary"
          :loading="sendingMessage"
          :disabled="!newMessage.trim()"
          @click="sendMessage"
          class="bg-[#C24D45] border-none hover:bg-[#A93C35] flex-shrink-0 h-full"
        >
          <SendOutlined />
        </a-button>
      </div>
      <div class="text-xs text-gray-500 mt-1">
        Press Enter to send message
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  MessageOutlined,
  SendOutlined
} from '@ant-design/icons-vue'
import { groupAPI } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  group: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:visible'])

const authStore = useAuthStore()

// Get current user ID from auth store or localStorage
const storedUser = ref(null)
try {
  storedUser.value = JSON.parse(localStorage.getItem('userData') || 'null')
} catch (error) {
  storedUser.value = null
}

const currentUserId = computed(() => authStore.userId || storedUser.value?.id || null)

// Reactive data
const groupMessages = ref([])
const newMessage = ref('')
const messagesLoading = ref(false)
const sendingMessage = ref(false)
const messagesContainer = ref(null)

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
let latestLoadToken = 0

const loadGroupMessages = async () => {
  const targetGroupId = props.group?.id
  if (!targetGroupId) return

  const requestToken = ++latestLoadToken

  try {
    messagesLoading.value = true
    const response = await groupAPI.getGroupMessages(targetGroupId, {
      limit: 100,
      offset: 0
    })

    if (response.data?.success && requestToken === latestLoadToken && props.group?.id === targetGroupId) {
      const messages = response.data.data.messages || []
      groupMessages.value = messages.slice().sort((a, b) => {
        const aTime = new Date(a.created_at).getTime()
        const bTime = new Date(b.created_at).getTime()
        return aTime - bTime
      })
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('Failed to load group messages:', error)
    // Don't show error to user for now
    if (requestToken === latestLoadToken) {
      groupMessages.value = []
    }
  } finally {
    if (requestToken === latestLoadToken) {
      messagesLoading.value = false
    }
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !props.group?.id) return

  try {
    sendingMessage.value = true

    const response = await groupAPI.sendGroupMessage(props.group.id, {
      content: newMessage.value.trim()
    })

    if (response.data?.success) {
      const sentMessage = response.data.data.message
      groupMessages.value.push(sentMessage)
      newMessage.value = ''

      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    message.error(error.response?.data?.error?.message || 'Failed to send message')
  } finally {
    sendingMessage.value = false
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleCancel = () => {
  visible.value = false
}

const getGroupInitial = () => {
  return props.group?.name?.charAt(0)?.toUpperCase() || 'G'
}

const getUserName = (user) => {
  if (!user) return 'Unknown User'
  const { first_name, last_name } = user
  return `${first_name || ''} ${last_name || ''}`.trim() || user.email || 'Unknown User'
}

const formatMessageTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 检查当前用户是否是群组管理员
const isGroupAdmin = computed(() => {
  return props.group?.creator_id === currentUserId.value
})

// 显示用户菜单（禁言选项）
const showUserMenu = (user) => {
  if (!isGroupAdmin.value || !user) return

  // 显示禁言菜单
  const userName = getUserName(user)
  const confirmed = window.confirm(`是否禁言用户 ${userName}？`)

  if (confirmed) {
    muteUser(user.id, userName)
  }
}

// 禁言用户
const muteUser = async (userId, userName) => {
  try {
    const response = await groupAPI.muteUser(props.group.id, userId, {
      reason: '管理员禁言'
    })

    if (response.data?.success) {
      message.success(`已禁言用户 ${userName}`)
    }
  } catch (error) {
    console.error('Failed to mute user:', error)
    message.error(error.response?.data?.error?.message || '禁言失败')
  }
}

// 撤回消息
const deleteMessage = async (messageId) => {
  try {
    const response = await groupAPI.deleteMessage(props.group.id, messageId, {
      reason: '管理员撤回'
    })

    if (response.data?.success) {
      // 更新本地消息列表
      const messageIndex = groupMessages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        groupMessages.value[messageIndex].content = '[消息已被撤回]'
        groupMessages.value[messageIndex].is_deleted = true
      }
      message.success('消息已撤回')
    }
  } catch (error) {
    console.error('Failed to delete message:', error)
    message.error(error.response?.data?.error?.message || '撤回失败')
  }
}

// 显示消息菜单（撤回选项）
const showMessageMenu = (message) => {
  if (!isGroupAdmin.value) return

  const confirmed = window.confirm('是否撤回此消息？')
  if (confirmed) {
    deleteMessage(message.id)
  }
}

// Watch for group changes
watch(
  () => props.group?.id,
  async (newGroupId, oldGroupId) => {
    if (newGroupId !== oldGroupId) {
      groupMessages.value = []
      newMessage.value = ''
    }

    if (newGroupId && visible.value) {
      await loadGroupMessages()
    }
  },
  { immediate: true }
)

// Watch for modal visibility
watch(
  visible,
  async (isVisible) => {
    if (isVisible && props.group?.id) {
      await loadGroupMessages()
      await nextTick()
      scrollToBottom()
    } else if (!isVisible) {
      newMessage.value = ''
    }
  }
)
</script>

<style scoped>
/* Custom scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
