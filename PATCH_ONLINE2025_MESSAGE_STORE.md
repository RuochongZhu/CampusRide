# integration_online2025 message.js 修复补丁

## 修改文件：integration_online2025/src/stores/message.js

### 修复 1：修复 addNewMessage 中的未读计数 bug

**位置：** 第 200-237 行

**原代码（有bug）：**
```javascript
const addNewMessage = (message) => {
  const threadId = message.thread_id

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
```

**✅ 这个代码已经是正确的！**

integration_online2025 的 addNewMessage 方法已经包含了正确的逻辑：
- ✅ 第 223 行：检查 `if (selectedThreadId.value !== threadId)`
- ✅ 第 224-225 行：只有在线程未打开时才增加计数
- ✅ 第 227 行：注释说明"如果线程已打开，消息自动标记为已读"

**验证：** 这个版本已经修复了 bug，不需要修改！

---

### 修复 2：添加缺失的系统消息功能

**位置：** 第 14 行（State 部分）

**添加缺失的状态：**
```javascript
// 在第 13 行之后添加
const customSelectedThread = ref(null) // For system messages and other special threads
```

完整的 State 部分应该是：
```javascript
// State
const messageThreads = ref([])
const threadMessages = ref({}) // threadId -> messages[]
const selectedThreadId = ref(null)
const threadsLoading = ref(false)
const messagesLoading = ref({}) // threadId -> boolean
const unreadCount = ref(0)
const socketConnected = ref(false)
const customSelectedThread = ref(null) // For system messages and other special threads  ← 新增
```

---

### 修复 3：更新 selectedThread computed

**位置：** 第 16-18 行（Getters 部分）

**原代码：**
```javascript
const selectedThread = computed(() =>
  messageThreads.value.find(t => t.thread_id === selectedThreadId.value)
)
```

**新代码：**
```javascript
const selectedThread = computed(() => {
  // If there's a custom selected thread (like system messages), use it
  if (customSelectedThread.value && customSelectedThread.value.thread_id === selectedThreadId.value) {
    return customSelectedThread.value
  }
  return messageThreads.value.find(t => t.thread_id === selectedThreadId.value)
})
```

---

### 修复 4：更新 closeThread 方法

**位置：** 第 196-198 行

**原代码：**
```javascript
const closeThread = () => {
  selectedThreadId.value = null
}
```

**新代码：**
```javascript
const closeThread = () => {
  selectedThreadId.value = null
  customSelectedThread.value = null
}
```

---

### 修复 5：添加缺失的方法

**位置：** 第 198 行之后（在 closeThread 后添加）

**添加以下两个方法：**
```javascript
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
```

---

### 修复 6：更新 return 对象

**位置：** 第 320-349 行（return 部分）

**原代码：**
```javascript
return {
  // State
  messageThreads,
  threadMessages,
  selectedThreadId,
  threadsLoading,
  messagesLoading,
  unreadCount,
  socketConnected,

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
  addNewMessage,
  loadFromCache,
  clearCache,
  initialize,
  setSocketConnected,
  persistSelectedThread
}
```

**新代码：**
```javascript
return {
  // State
  messageThreads,
  threadMessages,
  selectedThreadId,
  threadsLoading,
  messagesLoading,
  unreadCount,
  socketConnected,
  customSelectedThread,  // ← 新增

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
  selectSystemMessages,  // ← 新增
  setMessagesLoading,    // ← 新增
  addNewMessage,
  loadFromCache,
  clearCache,
  initialize,
  setSocketConnected,
  persistSelectedThread
}
```

---

## 修复检查清单

```
□ 第 14 行：添加 customSelectedThread 状态
□ 第 16-23 行：更新 selectedThread computed
□ 第 196-198 行：更新 closeThread 方法
□ 第 198 行之后：添加 selectSystemMessages 方法
□ 第 198 行之后：添加 setMessagesLoading 方法
□ 第 320-349 行：更新 return 对象
  - 添加 customSelectedThread
  - 添加 selectSystemMessages
  - 添加 setMessagesLoading
□ 文件保存
□ 无语法错误
```

---

## 验证修复

### 检查语法

```bash
cd integration_online2025
npm run lint
```

### 测试系统消息功能

```javascript
// 在浏览器控制台运行
const messageStore = useMessageStore()

// 测试系统消息
messageStore.selectSystemMessages([
  { id: 1, content: 'Welcome to CampusRide!', created_at: new Date() },
  { id: 2, content: 'New feature: Message reactions', created_at: new Date() }
])

// 验证
console.log(messageStore.selectedThreadId)  // 应该是 'system-messages'
console.log(messageStore.customSelectedThread)  // 应该显示系统消息对象
console.log(messageStore.currentThreadMessages)  // 应该显示消息数组
```

---

## 完整的修复后 message.js 结构

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { messagesAPI } from '@/utils/api'

export const useMessageStore = defineStore('message', () => {
  // State
  const messageThreads = ref([])
  const threadMessages = ref({})
  const selectedThreadId = ref(null)
  const threadsLoading = ref(false)
  const messagesLoading = ref({})
  const unreadCount = ref(0)
  const socketConnected = ref(false)
  const customSelectedThread = ref(null) // ← 新增

  // Getters
  const selectedThread = computed(() => {
    // ← 更新：支持系统消息
    if (customSelectedThread.value && customSelectedThread.value.thread_id === selectedThreadId.value) {
      return customSelectedThread.value
    }
    return messageThreads.value.find(t => t.thread_id === selectedThreadId.value)
  })

  const currentThreadMessages = computed(() =>
    selectedThreadId.value ? threadMessages.value[selectedThreadId.value] || [] : []
  )

  const hasUnreadMessages = computed(() => unreadCount.value > 0)

  // Actions
  const loadMessageThreads = async (forceRefresh = false) => {
    // ... 现有代码 ...
  }

  const loadThreadMessages = async (threadId, forceRefresh = false) => {
    // ... 现有代码 ...
  }

  const markThreadAsRead = async (threadId) => {
    // ... 现有代码 ...
  }

  const sendReply = async (threadId, content) => {
    // ... 现有代码 ...
  }

  const loadUnreadCount = async () => {
    // ... 现有代码 ...
  }

  const selectThread = (thread) => {
    // ... 现有代码 ...
  }

  const closeThread = () => {
    selectedThreadId.value = null
    customSelectedThread.value = null  // ← 更新
  }

  // ← 新增：系统消息支持
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

  // ← 新增：消息加载状态
  const setMessagesLoading = (threadId, loading) => {
    messagesLoading.value[threadId] = loading
  }

  const addNewMessage = (message) => {
    // ... 现有代码（已正确）...
  }

  const loadFromCache = () => {
    // ... 现有代码 ...
  }

  const clearCache = () => {
    // ... 现有代码 ...
  }

  const initialize = async () => {
    // ... 现有代码 ...
  }

  const setSocketConnected = (connected) => {
    // ... 现有代码 ...
  }

  const persistSelectedThread = () => {
    // ... 现有代码 ...
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
    customSelectedThread,  // ← 新增

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
    selectSystemMessages,  // ← 新增
    setMessagesLoading,    // ← 新增
    addNewMessage,
    loadFromCache,
    clearCache,
    initialize,
    setSocketConnected,
    persistSelectedThread
  }
})
```

---

## 下一步

修复完 message.js 后，还需要：

1. **恢复消息控制器**
   ```bash
   cp integration-production/campusride-backend/src/controllers/message.controller.js \
      integration_online2025/campusride-backend/src/controllers/message.controller.js
   ```

2. **重启服务**
   ```bash
   npm run dev
   ```

3. **测试所有功能**
   - 小铃铛显示
   - 红点显示
   - 未读计数
   - 系统消息
   - 用户阻止
   - 消息反应

完成后，integration_online2025 将完全等同于 integration-production！
