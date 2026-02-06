import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { messagesAPI } from '@/utils/api'

export const useMessageStore = defineStore('message', () => {
  // State
  const messageThreads = ref([])
  const threadMessages = ref({}) // threadId -> messages[]
  const selectedThreadId = ref(null)
  const threadsLoading = ref(false)
  const messagesLoading = ref({}) // threadId -> boolean
  const unreadCount = ref(0)
  const socketConnected = ref(false)
  const customSelectedThread = ref(null) // For system messages and other special threads
  const seenMessageIds = ref(new Set())

  // Getters
  const selectedThread = computed(() => {
    // If there's a custom selected thread (like system messages), use it
    if (customSelectedThread.value && customSelectedThread.value.thread_id === selectedThreadId.value) {
      return customSelectedThread.value
    }
    return messageThreads.value.find(t => t.thread_id === selectedThreadId.value)
  })

  const currentThreadMessages = computed(() =>
    selectedThreadId.value ? threadMessages.value[selectedThreadId.value] || [] : []
  )

  const hasUnreadMessages = computed(() => unreadCount.value > 0)


  const rememberMessageId = (messageId) => {
    if (!messageId) return false
    if (seenMessageIds.value.has(messageId)) return true

    seenMessageIds.value.add(messageId)
    if (seenMessageIds.value.size > 1000) {
      const oldest = seenMessageIds.value.values().next().value
      if (oldest) {
        seenMessageIds.value.delete(oldest)
      }
    }

    return false
  }

  // Actions
  const loadMessageThreads = async (forceRefresh = false) => {
    if (threadsLoading.value && !forceRefresh) return

    try {
      threadsLoading.value = true

      const response = await messagesAPI.getMessageThreads({
        page: 1,
        limit: 50
      })

      if (response.data?.success) {
        const payload = response.data.data || {}
        messageThreads.value = payload.threads || []

        // Update localStorage cache
        localStorage.setItem('messageThreads', JSON.stringify(messageThreads.value))
        localStorage.setItem('messageThreadsTimestamp', Date.now().toString())
      }
    } catch (error) {
      console.error('Failed to load message threads:', error)

      // Try to load from localStorage as fallback
      const cached = localStorage.getItem('messageThreads')
      if (cached) {
        try {
          messageThreads.value = JSON.parse(cached)
        } catch (e) {
          console.error('Failed to parse cached message threads:', e)
        }
      }

      throw error
    } finally {
      threadsLoading.value = false
    }
  }

  const loadThreadMessages = async (threadId, forceRefresh = false) => {
    if (messagesLoading.value[threadId] && !forceRefresh) return

    try {
      messagesLoading.value[threadId] = true

      const response = await messagesAPI.getThreadMessages(threadId, {
        page: 1,
        limit: 100
      })

      if (response.data?.success) {
        const payload = response.data.data || {}
        const messages = payload.messages || []

        // Update thread messages
        threadMessages.value[threadId] = messages
        messages.forEach(msg => rememberMessageId(msg?.id))

        // Cache in localStorage
        const cacheKey = `threadMessages_${threadId}`
        localStorage.setItem(cacheKey, JSON.stringify(messages))
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString())

        // Mark thread as read
        await markThreadAsRead(threadId)
      }
    } catch (error) {
      console.error('Failed to load thread messages:', error)

      // Try to load from localStorage as fallback
      const cacheKey = `threadMessages_${threadId}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          threadMessages.value[threadId] = JSON.parse(cached)
        } catch (e) {
          console.error('Failed to parse cached thread messages:', e)
        }
      }

      throw error
    } finally {
      messagesLoading.value[threadId] = false
    }
  }

  const markThreadAsRead = async (threadId) => {
    try {
      await messagesAPI.markThreadAsRead(threadId)

      // Update unread count in the thread list
      const threadIndex = messageThreads.value.findIndex(t => t.thread_id === threadId)
      if (threadIndex !== -1) {
        const threadUnreadCount = messageThreads.value[threadIndex].unread_count || 0
        messageThreads.value[threadIndex].unread_count = 0

        // Update cache
        localStorage.setItem('messageThreads', JSON.stringify(messageThreads.value))

        // Optimize: use local count reduction instead of full refresh
        if (threadUnreadCount > 0) {
          unreadCount.value = Math.max(0, unreadCount.value - threadUnreadCount)
        }
      }
    } catch (error) {
      console.error('Failed to mark thread as read:', error)
    }
  }

  const sendReply = async (threadId, content) => {
    try {
      const response = await messagesAPI.replyToThread(threadId, {
        content: content.trim()
      })

      if (response.data?.success) {
        const newMessage = response.data.data

        // Add the new message to the thread (dedupe with socket echo)
        if (!threadMessages.value[threadId]) {
          threadMessages.value[threadId] = []
        }
        const exists = threadMessages.value[threadId].some(msg => msg.id === newMessage.id)
        const alreadySeen = rememberMessageId(newMessage.id)
        if (!exists && !alreadySeen) {
          threadMessages.value[threadId].push(newMessage)
        }

        // Update the thread's last message in the sidebar
        const threadIndex = messageThreads.value.findIndex(t => t.thread_id === threadId)
        if (threadIndex !== -1) {
          messageThreads.value[threadIndex].last_message = newMessage.content
          messageThreads.value[threadIndex].last_message_time = newMessage.created_at
          messageThreads.value[threadIndex].message_count += 1

          // Move thread to top
          const thread = messageThreads.value.splice(threadIndex, 1)[0]
          messageThreads.value.unshift(thread)
        }

        // Update cache
        const cacheKey = `threadMessages_${threadId}`
        localStorage.setItem(cacheKey, JSON.stringify(threadMessages.value[threadId]))
        localStorage.setItem('messageThreads', JSON.stringify(messageThreads.value))

        return newMessage
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
      throw error
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await messagesAPI.getUnreadCount()
      if (response.data?.success) {
        unreadCount.value = response.data.data?.count || 0
      }
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }

  const selectThread = (thread) => {
    selectedThreadId.value = thread.thread_id
    loadThreadMessages(thread.thread_id)
  }

  const closeThread = () => {
    selectedThreadId.value = null
    customSelectedThread.value = null
  }

  // Select system messages thread
  const selectSystemMessages = (systemMessagesData) => {
    selectedThreadId.value = 'system-messages'
    customSelectedThread.value = {
      thread_id: 'system-messages',
      other_user: {
        id: 'system',
        first_name: 'System',
        last_name: 'Messages',
        email: 'system@campusride.com',
        avatar_url: null
      },
      subject: 'Announcements & Feedback',
      unread_count: 0
    }
    threadMessages.value['system-messages'] = systemMessagesData || []
  }

  // Set messages loading state
  const setMessagesLoading = (threadId, loading) => {
    messagesLoading.value[threadId] = loading
  }

  const addNewMessage = (message) => {
    const threadId = message.thread_id

    if (rememberMessageId(message.id)) {
      return
    }

    if (threadMessages.value[threadId]?.some(msg => msg.id === message.id)) {
      return
    }

    // Add message to thread if we have it loaded
    if (threadMessages.value[threadId]) {
      threadMessages.value[threadId].push(message)

      // Update cache
      const cacheKey = `threadMessages_${threadId}`
      localStorage.setItem(cacheKey, JSON.stringify(threadMessages.value[threadId]))
    }

    // Update thread list
    const threadIndex = messageThreads.value.findIndex(t => t.thread_id === threadId)
    if (threadIndex !== -1) {
      messageThreads.value[threadIndex].last_message = message.content
      messageThreads.value[threadIndex].last_message_time = message.created_at
      messageThreads.value[threadIndex].message_count += 1

      // If message is for current user and thread is not currently selected, increment unread count
      const storedUser = JSON.parse(localStorage.getItem('userData') || '{}')
      if (message.receiver_id === storedUser.id) {
        // Only increment if this thread is not currently open
        if (selectedThreadId.value !== threadId) {
          messageThreads.value[threadIndex].unread_count = (messageThreads.value[threadIndex].unread_count || 0) + 1
          unreadCount.value += 1
        }
        // If thread is open, the message is already "read" - don't increment
      }

      // Move thread to top
      const thread = messageThreads.value.splice(threadIndex, 1)[0]
      messageThreads.value.unshift(thread)

      // Update cache
      localStorage.setItem('messageThreads', JSON.stringify(messageThreads.value))
    }
  }

  const loadFromCache = () => {
    try {
      // Load message threads from cache
      const cached = localStorage.getItem('messageThreads')
      const timestamp = localStorage.getItem('messageThreadsTimestamp')

      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp)
        // Use cache if less than 5 minutes old
        if (age < 5 * 60 * 1000) {
          messageThreads.value = JSON.parse(cached)
        }
      }

      // Load thread messages from cache for recently accessed threads
      const selectedThreadIdCache = localStorage.getItem('selectedThreadId')
      if (selectedThreadIdCache) {
        const cacheKey = `threadMessages_${selectedThreadIdCache}`
        const cachedMessages = localStorage.getItem(cacheKey)
        const cachedTimestamp = localStorage.getItem(`${cacheKey}_timestamp`)

        if (cachedMessages && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp)
          if (age < 5 * 60 * 1000) {
            threadMessages.value[selectedThreadIdCache] = JSON.parse(cachedMessages)
            threadMessages.value[selectedThreadIdCache].forEach(msg => rememberMessageId(msg?.id))
            selectedThreadId.value = selectedThreadIdCache
          }
        }
      }
    } catch (error) {
      console.error('Failed to load from cache:', error)
    }
  }

  const clearCache = () => {
    try {
      seenMessageIds.value = new Set()
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('messageThreads') || key.startsWith('threadMessages_') || key === 'selectedThreadId') {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const initialize = async () => {
    // Load from cache first for instant UI
    loadFromCache()

    // Then refresh from server
    try {
      await Promise.all([
        loadMessageThreads(true),
        loadUnreadCount()
      ])
    } catch (error) {
      console.error('Failed to initialize message store:', error)
    }
  }

  const setSocketConnected = (connected) => {
    socketConnected.value = connected

    // If socket reconnected, refresh data
    if (connected) {
      loadMessageThreads(true)
      loadUnreadCount()
    }
  }

  // Persist selected thread ID
  const persistSelectedThread = () => {
    if (selectedThreadId.value) {
      localStorage.setItem('selectedThreadId', selectedThreadId.value)
    } else {
      localStorage.removeItem('selectedThreadId')
    }
  }

  return {
    // State
    messageThreads,
    threadMessages,
    selectedThreadId,
    threadsLoading,
    messagesLoading,
    unreadCount,
    socketConnected,
    customSelectedThread,

    // Getters
    selectedThread,
    currentThreadMessages,
    hasUnreadMessages,

    // Actions
    loadMessageThreads,
    loadThreadMessages,
    markThreadAsRead,
    sendReply,
    loadUnreadCount,
    selectThread,
    closeThread,
    selectSystemMessages,
    setMessagesLoading,
    addNewMessage,
    loadFromCache,
    clearCache,
    initialize,
    setSocketConnected,
    persistSelectedThread
  }
})