<template>
  <div class="comment-section">
    <div class="section-header">
      <h3>
        <CommentOutlined class="mr-2" />
        Comments ({{ totalComments }})
      </h3>
    </div>

    <!-- Comment Input (logged in users only) -->
    <div v-if="currentUser" class="comment-input-wrapper">
      <input
        v-model="newComment"
        type="text"
        placeholder="Type your comment..."
        class="comment-input"
        @keydown.enter="submitComment"
        @keydown.meta.enter="submitComment"
        @keydown.ctrl.enter="submitComment"
      />
      <a-button
        type="primary"
        :disabled="!newComment.trim()"
        :loading="submitting"
        @click="submitComment"
        class="send-btn"
      >
        <template #icon><SendOutlined /></template>
      </a-button>
    </div>

    <!-- Login prompt for guests -->
    <div v-else class="login-prompt">
      <a-alert
        message="Please log in to leave a comment"
        type="info"
        show-icon
      />
    </div>

    <!-- Comments List -->
    <div class="comments-list">
      <a-spin :spinning="loading">
        <!-- Empty State -->
        <div v-if="comments.length === 0 && !loading" class="empty-comments">
          <CommentOutlined class="empty-icon" />
          <p>No comments yet. Be the first to comment!</p>
        </div>

        <!-- Comment Items -->
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :current-user-id="currentUser?.id"
          @reply="handleReply"
          @like="handleLike"
          @delete="handleDelete"
        />

        <!-- Load More Button -->
        <div v-if="hasMore" class="load-more-wrapper">
          <a-button @click="loadMore" :loading="loadingMore" block>
            Load More Comments
          </a-button>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { CommentOutlined, SendOutlined } from '@ant-design/icons-vue'
import CommentItem from './CommentItem.vue'
import { marketplaceAPI } from '@/utils/api'

const props = defineProps({
  itemId: {
    type: String,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const comments = ref([])
const newComment = ref('')
const submitting = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const limit = 20
const hasMore = ref(false)
let latestRequestId = 0

const totalComments = computed(() => {
  let count = comments.value.length
  comments.value.forEach(comment => {
    if (comment.replies) {
      count += comment.replies.length
    }
  })
  return count
})

const getUserInitials = (user) => {
  if (!user) return '?'
  const first = user.first_name?.[0] || ''
  const last = user.last_name?.[0] || ''
  return (first + last).toUpperCase()
}

// Load comments
const loadComments = async (append = false) => {
  const itemId = props.itemId
  const requestId = ++latestRequestId

  if (!itemId) {
    comments.value = []
    hasMore.value = false
    return
  }

  try {
    if (append) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    const response = await marketplaceAPI.getItemComments(itemId, {
      page: page.value,
      limit
    })

    // Ignore stale responses when user quickly switches items.
    if (requestId !== latestRequestId || itemId !== props.itemId) return

    const responseData = response.data?.data || response.data
    if (append) {
      comments.value.push(...(responseData?.comments || []))
    } else {
      comments.value = responseData?.comments || []
    }

    hasMore.value = responseData?.pagination?.has_more || false

  } catch (error) {
    console.error('Load comments error:', error)
    message.error('Failed to load comments')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Submit new comment
const submitComment = async () => {
  if (!newComment.value.trim()) return

  try {
    submitting.value = true

    const response = await marketplaceAPI.createComment(props.itemId, {
      content: newComment.value.trim()
    })

    // Add to the top of the list
    const newCommentData = response.data?.data || response.data
    comments.value.unshift(newCommentData)
    newComment.value = ''

    message.success('Comment posted successfully')

  } catch (error) {
    console.error('Submit comment error:', error)
    if (error.response?.data?.error?.code === 'ITEM_NOT_FOUND') {
      message.error('Item not found')
    } else if (error.response?.data?.error?.code === 'CONTENT_TOO_LONG') {
      message.error('Comment is too long (max 1000 characters)')
    } else {
      message.error('Failed to post comment')
    }
  } finally {
    submitting.value = false
  }
}

// Handle reply
const handleReply = async (parentCommentId, content) => {
  try {
    const response = await marketplaceAPI.createComment(props.itemId, {
      content,
      parent_comment_id: parentCommentId
    })

    // Find parent comment and add reply
    const replyData = response.data?.data || response.data
    const parentComment = comments.value.find(c => c.id === parentCommentId)
    if (parentComment) {
      if (!parentComment.replies) {
        parentComment.replies = []
      }
      parentComment.replies.push(replyData)
    }

    message.success('Reply posted successfully')

  } catch (error) {
    console.error('Reply error:', error)
    message.error('Failed to post reply')
  }
}

// Handle like/unlike
const handleLike = async (commentId) => {
  try {
    // Find comment (could be top-level or reply)
    let comment = comments.value.find(c => c.id === commentId)
    if (!comment) {
      // Search in replies
      for (const topComment of comments.value) {
        if (topComment.replies) {
          comment = topComment.replies.find(r => r.id === commentId)
          if (comment) break
        }
      }
    }

    if (!comment) return

    const isLiked = comment.is_liked_by_user

    if (isLiked) {
      await marketplaceAPI.unlikeComment(commentId)
      comment.likes_count = Math.max(0, (comment.likes_count || 0) - 1)
      comment.is_liked_by_user = false
    } else {
      await marketplaceAPI.likeComment(commentId)
      comment.likes_count = (comment.likes_count || 0) + 1
      comment.is_liked_by_user = true
    }

  } catch (error) {
    console.error('Like error:', error)
    if (error.response?.status === 400) {
      // Already liked/unliked, just refresh
      loadComments()
    } else {
      message.error('Failed to like comment')
    }
  }
}

// Handle delete
const handleDelete = async (commentId) => {
  try {
    await marketplaceAPI.deleteComment(commentId)

    // Remove from list
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index > -1) {
      comments.value.splice(index, 1)
    } else {
      // Search in replies
      for (const topComment of comments.value) {
        if (topComment.replies) {
          const replyIndex = topComment.replies.findIndex(r => r.id === commentId)
          if (replyIndex > -1) {
            topComment.replies.splice(replyIndex, 1)
            break
          }
        }
      }
    }

    message.success('Comment deleted successfully')

  } catch (error) {
    console.error('Delete error:', error)
    if (error.response?.status === 403) {
      message.error('You can only delete your own comments')
    } else if (error.response?.status === 404) {
      message.error('Comment not found')
    } else {
      message.error('Failed to delete comment')
    }
  }
}

// Load more
const loadMore = () => {
  page.value++
  loadComments(true)
}

watch(() => props.itemId, () => {
  page.value = 1
  hasMore.value = false
  comments.value = []
  newComment.value = ''
  loadComments(false)
}, { immediate: true })
</script>

<style scoped>
.comment-section {
  padding: 20px 0;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin: 0;
  display: flex;
  align-items: center;
}

.comment-input-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  align-items: center;
}

.comment-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  font-size: 14px;
  color: #333;
  background: #f5f5f5;
  transition: all 0.3s ease;
  outline: none;
}

.send-btn {
  flex-shrink: 0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-input::placeholder {
  color: #999;
}

.comment-input:focus {
  background: #fff;
  border-color: #C24D45;
  box-shadow: 0 0 0 2px rgba(194, 77, 69, 0.1);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.char-count {
  font-size: 12px;
  color: #8c8c8c;
}

.login-prompt {
  margin-bottom: 24px;
}

.comments-list {
  min-height: 100px;
}

.empty-comments {
  text-align: center;
  padding: 60px 20px;
  color: #8c8c8c;
}

.empty-icon {
  font-size: 48px;
  color: #d9d9d9;
  margin-bottom: 16px;
}

.empty-comments p {
  margin: 0;
  font-size: 14px;
}

.load-more-wrapper {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
