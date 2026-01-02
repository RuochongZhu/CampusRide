<template>
  <div class="notification-bell-wrapper">
    <!-- Bell Icon - Click to open Messages page -->
    <a-badge :count="unreadCount" :overflow-count="99">
      <div class="notification-bell" @click="openMessagesPanel">
        <BellOutlined class="bell-icon" />
      </div>
    </a-badge>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { BellOutlined } from '@ant-design/icons-vue'
import { useMessageStore } from '@/stores/message'

const router = useRouter()
const messageStore = useMessageStore()

// Use the store's unread count - automatically updates when messages are marked as read
const unreadCount = computed(() => messageStore.unreadCount)

let refreshInterval = null
let isPageVisible = true

// 点击小铃铛直接打开消息界面
const openMessagesPanel = () => {
  router.push('/messages')
}

// Handle page visibility changes to prevent useless polling when tab is hidden
const handleVisibilityChange = () => {
  isPageVisible = !document.hidden
  if (isPageVisible) {
    // Refresh immediately when page becomes visible again
    messageStore.loadUnreadCount()
  }
}

onMounted(() => {
  // 初始获取未读数量
  messageStore.loadUnreadCount()

  // Listen for page visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 每30秒自动刷新未读数量 (only when page is visible)
  refreshInterval = setInterval(() => {
    if (isPageVisible) {
      messageStore.loadUnreadCount()
    }
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.notification-bell-wrapper {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.notification-bell {
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  cursor: pointer;
}

.notification-bell:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.bell-icon {
  font-size: 20px;
  color: #595959;
}

.notification-popup-content {
  padding: 8px 0;
}

.notification-item-popup {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.notification-item-popup:hover {
  background-color: #f5f5f5;
}

.notification-item-popup.unread {
  background-color: #f6ffed;
  border-left-color: #52c41a;
}

:deep(.ant-modal-content) {
  padding: 16px;
}
</style>
