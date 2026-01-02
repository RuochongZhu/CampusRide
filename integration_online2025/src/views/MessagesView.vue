<template>
  <div class="min-h-screen bg-[#EDEEE8] main-content pt-16">
    <div class="pt-8 pb-16 max-w-7xl mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Message Threads Sidebar -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-sm">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-xl font-bold text-[#333333] flex items-center">
                <MessageOutlined class="mr-2 text-[#C24D45]" />
                Messages
              </h2>
              <div class="text-sm text-gray-600 mt-1">
                {{ threadsTotalCount }} conversations
              </div>
            </div>

            <!-- Threads List -->
            <div class="h-[calc(100vh-16rem)] overflow-y-auto">
              <div v-if="threadsLoading" class="py-12 flex justify-center">
                <a-spin />
              </div>
              <div v-else-if="threadsError" class="py-12 text-center text-red-500">
                {{ threadsError }}
              </div>
              <div v-else-if="messageThreads.length === 0" class="py-12 text-center text-gray-500">
                <MessageOutlined class="text-4xl mb-4" />
                <p>No messages</p>
                <p class="text-sm text-gray-400 mt-2">Start conversations by participating in activities</p>
              </div>
              <div v-else>
                <div
                  v-for="thread in messageThreads"
                  :key="thread.thread_id"
                  class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  :class="{ 'bg-blue-50 border-blue-200': selectedThreadId === thread.thread_id }"
                  @click="selectThread(thread)"
                >
                  <div class="flex items-start space-x-3">
                    <div class="w-12 h-12 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold">
                      {{ getInitial(thread.organizer_first_name, thread.organizer_last_name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <h3 class="font-medium text-gray-900 truncate">
                          {{ thread.organizer_first_name }} {{ thread.organizer_last_name }}
                        </h3>
                        <span v-if="thread.unread_count > 0" class="bg-[#C24D45] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {{ thread.unread_count > 99 ? '99+' : thread.unread_count }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 truncate mt-1">{{ thread.activity_title }}</p>
                      <p class="text-sm text-gray-500 truncate mt-1">{{ thread.subject }}</p>
                      <div class="flex items-center justify-between mt-2">
                        <span class="text-xs text-gray-400">{{ formatTimeAgo(thread.last_message_time) }}</span>
                        <span class="text-xs text-gray-400">{{ thread.message_count }} messages</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Content Area -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-sm h-[calc(100vh-8rem)]">
            <!-- No thread selected -->
            <div v-if="!selectedThreadId" class="h-full flex items-center justify-center text-gray-500">
              <div class="text-center">
                <MessageOutlined class="text-6xl mb-4" />
                <p class="text-lg">Select a conversation to start chatting</p>
              </div>
            </div>

            <!-- Thread selected -->
            <div v-else class="h-full flex flex-col">
              <!-- Thread header -->
              <div class="p-4 border-b border-gray-200 bg-gray-50">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold">
                      {{ selectedThread ? getInitial(selectedThread.organizer_first_name, selectedThread.organizer_last_name) : '' }}
                    </div>
                    <div>
                      <h3 class="font-medium text-gray-900">
                        {{ selectedThread?.organizer_first_name }} {{ selectedThread?.organizer_last_name }}
                      </h3>
                      <p class="text-sm text-gray-600">{{ selectedThread?.activity_title }}</p>
                    </div>
                  </div>
                  <a-button type="text" @click="closeThread" class="text-gray-400 hover:text-gray-600">
                    <CloseOutlined />
                  </a-button>
                </div>
              </div>

              <!-- Messages area -->
              <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
                <div v-if="messageStore.messagesLoading[selectedThreadId]" class="py-12 flex justify-center">
                  <a-spin />
                </div>
                <div v-else-if="messagesError" class="py-12 text-center text-red-500">
                  {{ messagesError }}
                </div>
                <div v-else-if="currentThreadMessages.length === 0" class="py-12 text-center text-gray-500">
                  <p>This is the beginning of your conversation</p>
                </div>
                <div v-else>
                  <div
                    v-for="message in currentThreadMessages"
                    :key="message.id"
                    class="flex"
                    :class="message.sender_id === currentUserId ? 'justify-end' : 'justify-start'"
                  >
                    <div
                      class="max-w-[70%] p-3 rounded-lg"
                      :class="message.sender_id === currentUserId
                        ? 'bg-[#C24D45] text-white'
                        : 'bg-gray-200 text-gray-900'"
                    >
                      <div class="text-sm font-medium mb-1" v-if="message.sender_id !== currentUserId">
                        {{ message.sender_first_name }} {{ message.sender_last_name }}
                      </div>
                      <div class="mb-2">{{ message.content }}</div>
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

              <!-- Reply input -->
              <div class="p-4 border-t border-gray-200">
                <div class="flex space-x-3">
                  <a-textarea
                    v-model:value="replyMessage"
                    placeholder="Type your reply..."
                    :rows="2"
                    :maxlength="1000"
                    show-count
                    @keydown.enter.ctrl="sendReply"
                    @keydown.enter.meta="sendReply"
                  />
                  <a-button
                    type="primary"
                    :loading="sendingReply"
                    :disabled="!replyMessage.trim()"
                    @click="sendReply"
                    class="bg-[#C24D45] border-none hover:bg-[#A93C35] flex-shrink-0"
                  >
                    <SendOutlined />
                  </a-button>
                </div>
                <div class="text-xs text-gray-500 mt-2">
                  Press Ctrl+Enter or Cmd+Enter to send
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  MessageOutlined,
  SendOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useMessageStore } from '@/stores/message'
import { io } from 'socket.io-client'

const authStore = useAuthStore()
const messageStore = useMessageStore()

// Get current user ID from auth store or localStorage
const storedUser = ref(null)
try {
  storedUser.value = JSON.parse(localStorage.getItem('userData') || 'null')
} catch (error) {
  storedUser.value = null
}

const currentUserId = computed(() => authStore.userId || storedUser.value?.id || null)

// Local reactive data
const replyMessage = ref('')
const sendingReply = ref(false)
const messagesContainer = ref(null)
const socket = ref(null)

// Store getters
const messageThreads = computed(() => messageStore.messageThreads)
const currentThreadMessages = computed(() => messageStore.currentThreadMessages)
const selectedThread = computed(() => messageStore.selectedThread)
const selectedThreadId = computed(() => messageStore.selectedThreadId)
const threadsLoading = computed(() => messageStore.threadsLoading)
const threadsTotalCount = computed(() => messageStore.messageThreads.length)

// Error states (local to component)
const threadsError = ref(null)
const messagesError = ref(null)

// Socket.IO connection
const initializeSocket = () => {
  if (!currentUserId.value) return

  try {
    socket.value = io(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('token') || authStore.token
      },
      transports: ['websocket', 'polling']
    })

    socket.value.on('connect', () => {
      console.log('✅ Socket connected')
      messageStore.setSocketConnected(true)

      // Join current thread room if selected
      if (selectedThreadId.value) {
        socket.value.emit('join_message_thread', selectedThreadId.value)
      }
    })

    socket.value.on('disconnect', () => {
      console.log('❌ Socket disconnected')
      messageStore.setSocketConnected(false)
    })

    socket.value.on('new_message', (newMessage) => {
      console.log('📩 New message received:', newMessage)
      messageStore.addNewMessage(newMessage)

      // Scroll to bottom if it's for current thread
      if (newMessage.thread_id === selectedThreadId.value) {
        nextTick(() => scrollToBottom())
      }

      // Show notification if not current thread
      if (newMessage.thread_id !== selectedThreadId.value && newMessage.sender_id !== currentUserId.value) {
        message.info(`New message: ${newMessage.content.substring(0, 50)}...`)
      }
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      messageStore.setSocketConnected(false)
    })

  } catch (error) {
    console.error('Failed to initialize socket:', error)
  }
}

// Cleanup socket
const cleanupSocket = () => {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
}

// Methods
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now'
  const now = new Date()
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} days ago`
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks} weeks ago`
}

const formatMessageTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitial = (firstName, lastName) => {
  if (firstName) return firstName.charAt(0).toUpperCase()
  if (lastName) return lastName.charAt(0).toUpperCase()
  return 'U'
}

// Select a thread
const selectThread = (thread) => {
  try {
    // Leave previous thread room
    if (selectedThreadId.value && socket.value) {
      socket.value.emit('leave_message_thread', selectedThreadId.value)
    }

    // Select new thread
    messageStore.selectThread(thread)
    messageStore.persistSelectedThread()

    // Join new thread room
    if (socket.value) {
      socket.value.emit('join_message_thread', thread.thread_id)
    }

    // Clear any previous errors
    messagesError.value = null

    // Scroll to bottom after messages load
    nextTick(() => scrollToBottom())
  } catch (error) {
    console.error('Failed to select thread:', error)
    messagesError.value = error.response?.data?.error?.message || 'Failed to load messages'
  }
}

// Close thread
const closeThread = () => {
  if (selectedThreadId.value && socket.value) {
    socket.value.emit('leave_message_thread', selectedThreadId.value)
  }

  messageStore.closeThread()
  messageStore.persistSelectedThread()
  messagesError.value = null
}

// Send reply
const sendReply = async () => {
  if (!replyMessage.value.trim() || !selectedThreadId.value) return

  try {
    sendingReply.value = true

    await messageStore.sendReply(selectedThreadId.value, replyMessage.value.trim())

    // Clear the input
    replyMessage.value = ''

    // Scroll to bottom
    await nextTick()
    scrollToBottom()

    message.success('Message sent successfully')
  } catch (error) {
    console.error('Failed to send reply:', error)
    message.error(error.response?.data?.error?.message || 'Failed to send message')
  } finally {
    sendingReply.value = false
  }
}

// Scroll to bottom of messages
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Watch for thread changes to scroll to bottom
watch(currentThreadMessages, () => {
  nextTick(() => scrollToBottom())
}, { deep: true })

// Initialize on mount
onMounted(async () => {
  try {
    // Initialize message store (loads from cache and refreshes)
    await messageStore.initialize()

    // Initialize socket connection
    initializeSocket()
  } catch (error) {
    console.error('Failed to initialize messages view:', error)
    threadsError.value = error.response?.data?.error?.message || 'Failed to load messages'
  }
})

// Cleanup on unmount
onUnmounted(() => {
  cleanupSocket()
})
</script>

<style scoped>
.main-content {
  flex: 1;
}

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