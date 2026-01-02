<template>
  <div class="clickable-avatar">
    <a-badge :dot="user?.is_online" :offset="[-5, 35]">
      <a-avatar
        :src="user?.avatar_url"
        :size="size"
        :class="{ 'cursor-pointer': !disabled, 'hover:shadow-md': !disabled }"
        @click="showUserCard"
      >
        {{ getInitials(user) }}
      </a-avatar>
    </a-badge>

    <!-- 用户卡片Popover -->
    <a-popover
      v-model:open="cardVisible"
      trigger="click"
      placement="bottom"
      overlay-class-name="user-card-popover"
      :get-popup-container="getPopupContainer"
    >
      <template #content>
        <UserQuickCard
          :user="user"
          @message="handleMessage"
          @close="cardVisible = false"
        />
      </template>
      <!-- 隐藏的触发元素 -->
      <div ref="popoverTrigger" style="display: none;"></div>
    </a-popover>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message as antdMessage } from 'ant-design-vue'
import UserQuickCard from './UserQuickCard.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  size: {
    type: [String, Number],
    default: 'default'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'message'])

const router = useRouter()
const cardVisible = ref(false)
const popoverTrigger = ref(null)

const getInitials = (user) => {
  if (!user) return '?'
  const first = user.first_name?.[0] || ''
  const last = user.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

// 正确的方式访问document.body
const getPopupContainer = () => {
  return document.body
}

const showUserCard = async () => {
  if (props.disabled || !props.user) return

  cardVisible.value = true
  emit('click', props.user)

  // 等待DOM更新后触发popover
  await nextTick()
  if (popoverTrigger.value) {
    popoverTrigger.value.click()
  }
}

const handleMessage = () => {
  console.log('🚀 ClickableAvatar: handleMessage called for user:', props.user)
  cardVisible.value = false

  const query = {}

  if (props.user?.id) {
    query.userId = String(props.user.id)
  }
  if (props.user?.email) {
    query.userEmail = props.user.email
  }

  if (!query.userId && !query.userEmail) {
    console.warn('⚠️ ClickableAvatar: Missing user identifier for messaging', props.user)
    antdMessage.warning('Unable to open chat because this user is missing contact information.')
    return
  }

  const targetRoute = {
    path: '/messages',
    query
  }
  console.log('🚀 ClickableAvatar: Navigating to:', targetRoute)

  router.push(targetRoute).catch(() => {})

  emit('message', props.user)
}
</script>

<style scoped>
.clickable-avatar {
  display: inline-block;
}

.cursor-pointer {
  cursor: pointer;
  transition: all 0.2s ease;
}

.cursor-pointer:hover {
  transform: scale(1.05);
}

:global(.user-card-popover .ant-popover-inner-content) {
  padding: 0;
}

:global(.user-card-popover .ant-popover-arrow) {
  display: none;
}
</style>
