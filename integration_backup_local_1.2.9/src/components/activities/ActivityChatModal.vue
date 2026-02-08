<template>
  <a-modal
    v-model:open="visible"
    :title="`${activity?.title} - Group Chat`"
    width="800px"
    :footer="null"
    :maskClosable="false"
    @cancel="handleCancel"
  >
    <div class="h-[500px] flex flex-col">
      <!-- Activity Info -->
      <div class="bg-gray-50 p-3 rounded-lg mb-4 flex items-center space-x-3">
        <div class="w-10 h-10 bg-[#FA8C16] rounded-full flex items-center justify-center text-white">
          <TeamOutlined />
        </div>
        <div class="flex-1">
          <div class="font-medium text-gray-900">{{ activity?.title }}</div>
          <div class="text-sm text-gray-600">{{ memberCount }} participants</div>
        </div>
        <a-button size="small" @click="showMembersDrawer = true">
          <UsergroupAddOutlined /> Members
        </a-button>
        <a-tag color="orange">Activity Chat</a-tag>
      </div>

      <!-- System Announcements -->
      <div v-if="announcements.length > 0" class="announcements-section mb-3">
        <div
          v-for="announcement in announcements"
          :key="announcement.id"
          class="announcement-item p-3 rounded-lg mb-2"
          :class="{
            'bg-blue-50 border border-blue-200': announcement.announcement_type === 'general',
            'bg-orange-50 border border-orange-200': announcement.announcement_type === 'warning',
            'bg-red-50 border border-red-200': announcement.announcement_type === 'important',
            'bg-purple-50 border border-purple-200': announcement.announcement_type === 'maintenance'
          }"
        >
          <div class="flex items-start space-x-2">
            <NotificationOutlined class="mt-1" :class="{
              'text-blue-500': announcement.announcement_type === 'general',
              'text-orange-500': announcement.announcement_type === 'warning',
              'text-red-500': announcement.announcement_type === 'important',
              'text-purple-500': announcement.announcement_type === 'maintenance'
            }" />
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <span class="font-medium text-sm">{{ announcement.title }}</span>
                <a-tag :color="getAnnouncementTypeColor(announcement.announcement_type)" size="small">
                  {{ announcement.announcement_type }}
                </a-tag>
                <a-tag v-if="announcement.is_pinned" color="gold" size="small">Pinned</a-tag>
              </div>
              <p class="text-sm text-gray-600 mt-1 mb-0">{{ announcement.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4" ref="messagesContainer">
        <div v-if="messagesLoading" class="text-center py-8">
          <a-spin />
        </div>
        <div v-else-if="chatMessages.length === 0" class="text-center py-8 text-gray-500">
          <MessageOutlined class="text-4xl mb-4" />
          <p>No messages yet. Start the conversation!</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="msg in chatMessages"
            :key="msg.id"
            class="flex group"
            :class="msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'"
          >
            <!-- Other user's message with avatar -->
            <template v-if="msg.sender_id !== currentUserId">
              <ClickableAvatar
                :user="{
                  id: msg.sender?.id,
                  name: getUserName(msg.sender),
                  email: msg.sender?.email,
                  avatar_url: msg.sender?.avatar_url
                }"
                size="small"
                class="mr-2 flex-shrink-0"
                @message="handleUserMessage"
              />
              <div class="max-w-[65%]">
                <div class="text-xs text-gray-500 mb-1">
                  {{ getUserName(msg.sender) }}
                </div>
                <div class="p-3 rounded-lg break-words bg-gray-200 text-gray-900 rounded-bl-sm relative group">
                  <div class="mb-1">{{ msg.content }}</div>
                  <div class="text-xs text-gray-500">
                    {{ formatMessageTime(msg.created_at) }}
                  </div>
                  <!-- Delete button for organizer/admin -->
                  <a-button
                    v-if="canDeleteMessage(msg)"
                    type="text"
                    size="small"
                    danger
                    class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click="deleteMessage(msg.id)"
                  >
                    <DeleteOutlined />
                  </a-button>
                </div>
              </div>
            </template>

            <!-- My message -->
            <template v-else>
              <div class="max-w-[65%] relative group">
                <div class="p-3 rounded-lg break-words bg-[#FA8C16] text-white rounded-br-sm">
                  <div class="mb-1">{{ msg.content }}</div>
                  <div class="text-xs text-white opacity-75">
                    {{ formatMessageTime(msg.created_at) }}
                  </div>
                  <!-- Delete button for own message -->
                  <a-button
                    type="text"
                    size="small"
                    class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-white"
                    @click="deleteMessage(msg.id)"
                  >
                    <DeleteOutlined />
                  </a-button>
                </div>
              </div>
            </template>
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
          class="bg-[#FA8C16] border-none hover:bg-[#D46B08] flex-shrink-0 h-full"
        >
          <SendOutlined />
        </a-button>
      </div>
      <div class="text-xs text-gray-500 mt-1">
        Press Enter to send message
      </div>
    </div>

    <!-- Members Drawer -->
    <a-drawer
      v-model:open="showMembersDrawer"
      title="Activity Members"
      placement="right"
      :width="320"
    >
      <div v-if="membersLoading" class="text-center py-8">
        <a-spin />
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="member in members"
          :key="member.id"
          class="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
          @click="handleMemberClick(member)"
        >
          <ClickableAvatar
            :user="{
              id: member.id,
              name: getUserName(member),
              email: member.email,
              avatar_url: member.avatar_url
            }"
            size="default"
            class="mr-3"
            @message="handleUserMessage"
          />
          <div class="flex-1">
            <div class="font-medium text-gray-900 flex items-center">
              {{ getUserName(member) }}
              <a-tag v-if="member.is_organizer" color="orange" size="small" class="ml-2">Organizer</a-tag>
            </div>
            <div class="text-sm text-gray-500">{{ member.email }}</div>
          </div>
          <div v-if="member.is_online" class="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </a-drawer>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import {
  MessageOutlined,
  SendOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  DeleteOutlined,
  NotificationOutlined
} from '@ant-design/icons-vue'
import { activityChatAPI, userAPI, announcementsAPI } from '@/utils/api'
import { getPublicUserName } from '@/utils/publicName'
import { useAuthStore } from '@/stores/auth'
import ClickableAvatar from '@/components/common/ClickableAvatar.vue'

const router = useRouter()

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  activity: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:visible'])

const authStore = useAuthStore()

// Get current user ID
const storedUser = ref(null)
try {
  storedUser.value = JSON.parse(localStorage.getItem('userData') || 'null')
} catch (error) {
  storedUser.value = null
}

const currentUserId = computed(() => authStore.userId || storedUser.value?.id || null)

// Reactive data
const chatMessages = ref([])
const members = ref([])
const newMessage = ref('')
const messagesLoading = ref(false)
const membersLoading = ref(false)
const sendingMessage = ref(false)
const messagesContainer = ref(null)
const showMembersDrawer = ref(false)
const currentUserRole = ref(null) // Store current user's role (admin, moderator, user)
const deletingMessageId = ref(null) // Track which message is being deleted
const announcements = ref([]) // System announcements for activity chat

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const memberCount = computed(() => members.value.length || props.activity?.current_participants || 0)

// Methods
let latestLoadToken = 0

const loadChatMessages = async () => {
  const activityId = props.activity?.id
  if (!activityId) return

  const requestToken = ++latestLoadToken

  try {
    messagesLoading.value = true
    const response = await activityChatAPI.getMessages(activityId, {
      limit: 100,
      page: 1
    })

    if (response.data?.success && requestToken === latestLoadToken && props.activity?.id === activityId) {
      const messages = response.data.data.messages || []
      chatMessages.value = messages.slice().sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('Failed to load activity chat messages:', error)
    if (requestToken === latestLoadToken) {
      chatMessages.value = []
    }
  } finally {
    if (requestToken === latestLoadToken) {
      messagesLoading.value = false
    }
  }
}

const loadMembers = async () => {
  const activityId = props.activity?.id
  if (!activityId) return

  try {
    membersLoading.value = true
    const response = await activityChatAPI.getMembers(activityId)

    if (response.data?.success) {
      members.value = response.data.data.members || []
    }
  } catch (error) {
    console.error('Failed to load activity members:', error)
    members.value = []
  } finally {
    membersLoading.value = false
  }
}

// Load current user's role to determine delete permissions
const loadCurrentUserRole = async () => {
  try {
    const response = await userAPI.getMe()
    if (response.data?.success) {
      currentUserRole.value = response.data.data.role || 'user'
    }
  } catch (error) {
    console.error('Failed to load user role:', error)
    currentUserRole.value = 'user'
  }
}

// Load system announcements for activity chat
const loadAnnouncements = async () => {
  try {
    const response = await announcementsAPI.getAnnouncements({
      show_in_activity_chat: true,
      limit: 5
    })
    if (response.data?.success) {
      announcements.value = response.data.data.announcements || []
    }
  } catch (error) {
    console.error('Failed to load announcements:', error)
    announcements.value = []
  }
}

// Get announcement type color
const getAnnouncementTypeColor = (type) => {
  const colors = {
    general: 'blue',
    warning: 'orange',
    important: 'red',
    maintenance: 'purple'
  }
  return colors[type] || 'blue'
}

// Check if current user can delete a message
const canDeleteMessage = (msg) => {
  if (!currentUserId.value) return false

  // User can delete their own messages
  if (msg.sender_id === currentUserId.value) return true

  // Organizer or admin can delete any message
  const isOrganizer = props.activity?.organizer_id === currentUserId.value
  const isAdmin = currentUserRole.value === 'admin' || currentUserRole.value === 'moderator'

  return isOrganizer || isAdmin
}

// Delete a message
const deleteMessage = async (messageId) => {
  if (!props.activity?.id) return

  try {
    deletingMessageId.value = messageId

    await activityChatAPI.deleteMessage(props.activity.id, messageId)

    // Remove message from local list
    chatMessages.value = chatMessages.value.filter(msg => msg.id !== messageId)
    message.success('Message deleted')
  } catch (error) {
    console.error('Failed to delete message:', error)
    const errorMsg = error.response?.data?.error?.message || 'Failed to delete message'
    message.error(errorMsg)
  } finally {
    deletingMessageId.value = null
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !props.activity?.id) return

  try {
    sendingMessage.value = true

    const response = await activityChatAPI.sendMessage(props.activity.id, {
      content: newMessage.value.trim()
    })

    if (response.data?.success) {
      const sentMessage = response.data.data
      chatMessages.value.push(sentMessage)
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

const getUserName = (user) => {
  return getPublicUserName(user, 'Unknown User')
}

const formatMessageTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleUserMessage = (user) => {
  router.push({
    path: '/messages',
    query: { userId: user.id }
  })
}

const handleMemberClick = (member) => {
  // Could show user quick card or navigate to profile
}

// Watch for activity changes
watch(
  () => props.activity?.id,
  async (newActivityId, oldActivityId) => {
    if (newActivityId !== oldActivityId) {
      chatMessages.value = []
      members.value = []
      newMessage.value = ''
    }

    if (newActivityId && visible.value) {
      await Promise.all([loadChatMessages(), loadMembers()])
    }
  },
  { immediate: true }
)

// Watch for modal visibility
watch(
  visible,
  async (isVisible) => {
    if (isVisible && props.activity?.id) {
      await Promise.all([
        loadChatMessages(),
        loadMembers(),
        loadCurrentUserRole(),
        loadAnnouncements()
      ])
      await nextTick()
      scrollToBottom()
    } else if (!isVisible) {
      newMessage.value = ''
      showMembersDrawer.value = false
    }
  }
)
</script>

<style scoped>
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
