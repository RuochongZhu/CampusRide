<template>
  <div class="comment-item" :class="{ 'is-reply': isReply }">
    <div class="comment-avatar">
      <a-avatar :src="comment.user?.avatar_url" :size="isReply ? 32 : 40">
        {{ getUserInitials(comment.user) }}
      </a-avatar>
    </div>

    <div class="comment-content">
      <div class="comment-header">
        <span class="user-name">
          {{ getDisplayName(comment.user) }}
        </span>
        <span class="timestamp">{{ formatTimeAgo(comment.created_at) }}</span>
      </div>

      <div class="comment-body" :class="{ 'deleted': comment.deleted_at }">
        {{ comment.content }}
      </div>

      <div class="comment-actions" v-if="!comment.deleted_at">
        <a-button
          type="text"
          size="small"
          :class="{ 'liked': comment.is_liked_by_user }"
          @click="$emit('like', comment.id)"
        >
          <LikeOutlined v-if="!comment.is_liked_by_user" />
          <LikeFilled v-else class="text-blue-500" />
          <span class="ml-1">{{ comment.likes_count || 0 }}</span>
        </a-button>

        <a-button
          v-if="!isReply"
          type="text"
          size="small"
          @click="showReplyInput = !showReplyInput"
        >
          <CommentOutlined />
          <span class="ml-1">Reply</span>
        </a-button>

        <a-button
          v-if="comment.user?.id === currentUserId"
          type="text"
          size="small"
          danger
          @click="confirmDelete"
        >
          <DeleteOutlined />
          <span class="ml-1">Delete</span>
        </a-button>
      </div>

      <!-- Reply Input -->
      <div v-if="showReplyInput && !isReply" class="reply-input-wrapper">
        <a-textarea
          v-model:value="replyContent"
          :rows="2"
          :placeholder="`Reply to ${getDisplayName(comment.user)}...`"
          :maxlength="1000"
          @keydown.meta.enter="submitReply"
          @keydown.ctrl.enter="submitReply"
        />
        <div class="reply-actions">
          <span class="char-count">{{ replyContent.length }}/1000</span>
          <a-button size="small" @click="cancelReply">Cancel</a-button>
          <a-button
            type="primary"
            size="small"
            :disabled="!replyContent.trim()"
            :loading="submittingReply"
            @click="submitReply"
          >
            Reply
          </a-button>
        </div>
      </div>

      <!-- Replies List -->
      <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
        <CommentItem
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :current-user-id="currentUserId"
          :is-reply="true"
          @like="$emit('like', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import {
  LikeOutlined,
  LikeFilled,
  CommentOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { getPublicUserName } from '@/utils/publicName'

dayjs.extend(relativeTime)

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    default: null
  },
  isReply: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['reply', 'like', 'delete'])

const showReplyInput = ref(false)
const replyContent = ref('')
const submittingReply = ref(false)

const getUserInitials = (user) => {
  if (!user) return '?'
  const first = user.first_name?.[0] || ''
  const last = user.last_name?.[0] || ''
  return (first + last).toUpperCase()
}

const getDisplayName = (user) => getPublicUserName(user, 'User')

const formatTimeAgo = (timestamp) => {
  return dayjs(timestamp).fromNow()
}

const submitReply = async () => {
  if (!replyContent.value.trim()) return

  try {
    submittingReply.value = true
    emit('reply', props.comment.id, replyContent.value.trim())
    replyContent.value = ''
    showReplyInput.value = false
  } catch (error) {
    console.error('Submit reply error:', error)
    message.error('Failed to post reply')
  } finally {
    submittingReply.value = false
  }
}

const cancelReply = () => {
  replyContent.value = ''
  showReplyInput.value = false
}

const confirmDelete = () => {
  Modal.confirm({
    title: 'Delete Comment',
    content: 'Are you sure you want to delete this comment? This action cannot be undone.',
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: () => {
      emit('delete', props.comment.id)
    }
  })
}
</script>

<style scoped>
.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item.is-reply {
  padding-left: 52px;
  border-bottom: none;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.user-name {
  font-weight: 600;
  color: #262626;
}

.timestamp {
  font-size: 12px;
  color: #8c8c8c;
}

.comment-body {
  color: #262626;
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-body.deleted {
  color: #8c8c8c;
  font-style: italic;
}

.comment-actions {
  display: flex;
  gap: 4px;
}

.comment-actions .ant-btn {
  height: 28px;
  padding: 0 8px;
  font-size: 13px;
  color: #8c8c8c;
}

.comment-actions .ant-btn:hover {
  color: #1890ff;
}

.comment-actions .ant-btn.liked {
  color: #1890ff;
}

.reply-input-wrapper {
  margin-top: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.reply-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.char-count {
  font-size: 12px;
  color: #8c8c8c;
  margin-right: auto;
}

.replies-list {
  margin-top: 8px;
}
</style>
