<template>
  <div
    class="clickable-avatar"
    :class="{ small, medium, large }"
    @click="handleAvatarClick"
    :title="tooltipText"
  >
    <div class="avatar-circle">
      {{ displayInitials }}
    </div>

    <!-- 头像点击触发的用户信息模态框 -->
    <UserProfileModal
      v-model="showUserModal"
      :user-id="userId"
      :user-info="userInfo"
      :context-type="contextType"
      :context-id="contextId"
      @message-sent="handleMessageSent"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import UserProfileModal from './UserProfileModal.vue'

const props = defineProps({
  // 用户基础信息
  userId: {
    type: String,
    required: true
  },
  userInfo: {
    type: Object,
    required: true
    // 应包含: { first_name, last_name, nickname, email, role, ... }
  },

  // 头像尺寸
  size: {
    type: String,
    default: 'medium', // 'small', 'medium', 'large'
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },

  // 上下文信息（用于消息发送）
  contextType: {
    type: String,
    default: 'general' // 'activity', 'group', 'marketplace', 'leaderboard', etc.
  },
  contextId: {
    type: String,
    default: null
  },

  // 是否可点击
  clickable: {
    type: Boolean,
    default: true
  },

  // 是否显示工具提示
  showTooltip: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['avatarClick', 'messageSent'])

// 响应式状态
const showUserModal = ref(false)

// 计算属性
const small = computed(() => props.size === 'small')
const medium = computed(() => props.size === 'medium')
const large = computed(() => props.size === 'large')

const displayInitials = computed(() => {
  return getUserInitials(props.userInfo?.first_name, props.userInfo?.last_name)
})

const tooltipText = computed(() => {
  if (!props.showTooltip) return ''
  const name = getUserDisplayName(props.userInfo)
  return props.clickable ? `点击发消息给 ${name}` : name
})

// 方法
function handleAvatarClick() {
  if (!props.clickable) return

  // 检查用户信息是否完整
  if (!props.userInfo || !props.userId) {
    message.warning('用户信息不完整，无法发送消息')
    return
  }

  // 不能给自己发消息
  const currentUserId = getCurrentUserId()
  if (currentUserId === props.userId) {
    message.info('不能给自己发送消息')
    return
  }

  emit('avatarClick', {
    userId: props.userId,
    userInfo: props.userInfo,
    contextType: props.contextType,
    contextId: props.contextId
  })

  showUserModal.value = true
}

function handleMessageSent(messageData) {
  emit('messageSent', messageData)
  message.success('消息发送成功！')
}

// 工具函数
function getUserInitials(firstName, lastName) {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return first + last || '?'
}

function getUserDisplayName(user) {
  if (!user) return '未知用户'
  if (user.nickname) return user.nickname
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim()
  }
  return user.email || '未知用户'
}

function getCurrentUserId() {
  // 从本地存储或状态管理中获取当前用户ID
  const userData = JSON.parse(localStorage.getItem('userData') || '{}')
  return userData.id || null
}
</script>

<style scoped>
.clickable-avatar {
  display: inline-block;
  position: relative;
}

.clickable-avatar[clickable] {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.clickable-avatar[clickable]:hover .avatar-circle {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.clickable-avatar[clickable]:active .avatar-circle {
  transform: scale(0.95);
}

.avatar-circle {
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 尺寸变体 */
.clickable-avatar.small .avatar-circle {
  width: 32px;
  height: 32px;
  font-size: 12px;
}

.clickable-avatar.medium .avatar-circle {
  width: 40px;
  height: 40px;
  font-size: 14px;
}

.clickable-avatar.large .avatar-circle {
  width: 60px;
  height: 60px;
  font-size: 18px;
}

/* 可点击状态指示 */
.clickable-avatar[clickable]::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #52c41a;
  border-radius: 50%;
  border: 2px solid white;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.clickable-avatar[clickable]:hover::after {
  opacity: 1;
}

/* 无障碍性 */
.clickable-avatar[clickable] {
  outline: none;
}

.clickable-avatar[clickable]:focus .avatar-circle {
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
}

/* 响应式 */
@media (max-width: 768px) {
  .clickable-avatar.large .avatar-circle {
    width: 48px;
    height: 48px;
    font-size: 16px;
  }

  .clickable-avatar.medium .avatar-circle {
    width: 36px;
    height: 36px;
    font-size: 13px;
  }
}
</style>