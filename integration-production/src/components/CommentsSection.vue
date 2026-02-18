<template>
  <div class="comments-section">
    <div class="comments-header">
      <h3 class="comments-title">
        Comments ({{ totalComments }})
      </h3>
      <a-select
        v-model:value="sortBy"
        style="width: 150px"
        @change="handleSortChange"
      >
        <a-select-option value="newest">Newest First</a-select-option>
        <a-select-option value="oldest">Oldest First</a-select-option>
        <a-select-option value="most_liked">Most Liked</a-select-option>
      </a-select>
    </div>

    <!-- 评论表单（仅用于发布新评论） -->
    <div class="comment-form-wrapper">
      <a-textarea
        v-model:value="commentContent"
        placeholder="Write a comment..."
        :rows="3"
        :maxlength="2000"
        show-count
      />

      <!-- 表情选择器和图片上传 -->
      <div class="form-actions">
        <div class="left-actions">
          <MediaUploader
            v-model="commentImages"
            :maxFiles="4"
            :maxSize="5 * 1024 * 1024"
            accept="image/*"
            uploadText="Add Images"
            :hideButton="false"
          />

          <!-- 表情选择器 -->
          <a-dropdown trigger="click" placement="topLeft">
            <a-button type="text" :icon="h(SmileOutlined)" title="Add emoji">
              😀
            </a-button>
            <template #overlay>
              <div class="emoji-picker">
                <div class="emoji-grid">
                  <span v-for="emoji in emojiList" :key="emoji"
                        class="emoji-item"
                        @click="insertEmoji(emoji, null)">
                    {{ emoji }}
                  </span>
                </div>
              </div>
            </template>
          </a-dropdown>
        </div>

        <div class="action-buttons">
          <a-button
            type="primary"
            :loading="submitting"
            :disabled="!commentContent.trim()"
            @click="submitComment"
          >
            Comment
          </a-button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <a-spin :spinning="loading">
      <div class="comments-list">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item"
        >
          <!-- 主评论 -->
          <div class="comment-main">
            <a-avatar :src="comment.users.avatar_url" :size="40">
              {{ comment.users.username?.[0]?.toUpperCase() }}
            </a-avatar>

            <div class="comment-content">
              <div class="comment-header-info">
                <span class="comment-author">
                  {{ getDisplayName(comment.users) }}
                  <span class="comment-username">@{{ comment.users.username }}</span>
                </span>
                <span class="comment-time">
                  {{ formatTime(comment.created_at) }}
                  <span v-if="comment.is_edited" class="edited-badge">(edited)</span>
                </span>
              </div>

              <div class="comment-text">{{ comment.content }}</div>

              <!-- 评论图片 -->
              <div v-if="comment.images && comment.images.length > 0" class="comment-images">
                <img
                  v-for="(image, idx) in comment.images"
                  :key="idx"
                  :src="image"
                  @click="previewImage(image)"
                  class="comment-image"
                />
              </div>

              <!-- 评论操作 -->
              <div class="comment-actions">
                <a-button
                  type="text"
                  size="small"
                  :icon="h(likedComments.includes(comment.id) ? LikeFilled : LikeOutlined)"
                  @click="toggleLike(comment.id)"
                  :class="{ 'liked': likedComments.includes(comment.id) }"
                >
                  {{ comment.likes_count || 0 }}
                </a-button>

                <a-button
                  type="text"
                  size="small"
                  :icon="h(dislikedComments.includes(comment.id) ? DislikeFilled : DislikeOutlined)"
                  @click="toggleDislike(comment.id)"
                  :class="{ 'disliked': dislikedComments.includes(comment.id) }"
                >
                  {{ comment.dislikes_count || 0 }}
                </a-button>

                <a-button
                  type="text"
                  size="small"
                  :icon="h(CommentOutlined)"
                  @click="toggleReplyBox(comment.id)"
                >
                  Reply {{ comment.replies_count > 0 ? `(${comment.replies_count})` : '' }}
                </a-button>

                <a-dropdown v-if="canEditComment(comment)">
                  <a-button type="text" size="small" :icon="h(EllipsisOutlined)" />
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="editComment(comment)">
                        <EditOutlined /> Edit
                      </a-menu-item>
                      <a-menu-item danger @click="deleteComment(comment.id)">
                        <DeleteOutlined /> Delete
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>

              <!-- 回复输入框 -->
              <div v-if="activeReplyBox === comment.id" class="reply-form-wrapper">
                <a-textarea
                  v-model:value="replyContent[comment.id]"
                  :placeholder="`Reply to ${getDisplayName(comment.users)}...`"
                  :rows="2"
                  :maxlength="2000"
                  show-count
                  auto-size
                />

                <div class="reply-form-actions">
                  <div class="left-actions">
                    <!-- 表情选择器 -->
                    <a-dropdown trigger="click" placement="topLeft">
                      <a-button type="text" :icon="h(SmileOutlined)" size="small" title="Add emoji">
                        😀
                      </a-button>
                      <template #overlay>
                        <div class="emoji-picker">
                          <div class="emoji-grid">
                            <span v-for="emoji in emojiList" :key="emoji"
                                  class="emoji-item"
                                  @click="insertEmoji(emoji, comment.id)">
                              {{ emoji }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </a-dropdown>
                  </div>

                  <div class="reply-action-buttons">
                    <a-button
                      size="small"
                      @click="cancelReply(comment.id)"
                    >
                      Cancel
                    </a-button>
                    <a-button
                      type="primary"
                      size="small"
                      :loading="replySubmitting[comment.id]"
                      :disabled="!replyContent[comment.id]?.trim()"
                      @click="submitReply(comment.id)"
                    >
                      Reply
                    </a-button>
                  </div>
                </div>
              </div>

              <!-- 回复列表 -->
              <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                <div
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="reply-item"
                >
                  <a-avatar :src="reply.users.avatar_url" :size="32">
                    {{ reply.users.username?.[0]?.toUpperCase() }}
                  </a-avatar>

                  <div class="reply-content">
                    <div class="reply-header-info">
                      <span class="reply-author">
                        {{ getDisplayName(reply.users) }}
                        <span class="reply-username">@{{ reply.users.username }}</span>
                      </span>
                      <span class="reply-time">
                        {{ formatTime(reply.created_at) }}
                        <span v-if="reply.is_edited" class="edited-badge">(edited)</span>
                      </span>
                    </div>

                    <div class="reply-text">{{ reply.content }}</div>

                    <!-- 回复图片 -->
                    <div v-if="reply.images && reply.images.length > 0" class="reply-images">
                      <img
                        v-for="(image, idx) in reply.images"
                        :key="idx"
                        :src="image"
                        @click="previewImage(image)"
                        class="reply-image"
                      />
                    </div>

                    <!-- 回复操作 -->
                    <div class="reply-actions">
                      <a-button
                        type="text"
                        size="small"
                        :icon="h(likedComments.includes(reply.id) ? LikeFilled : LikeOutlined)"
                        @click="toggleLike(reply.id)"
                        :class="{ 'liked': likedComments.includes(reply.id) }"
                      >
                        {{ reply.likes_count || 0 }}
                      </a-button>

                      <a-button
                        type="text"
                        size="small"
                        :icon="h(dislikedComments.includes(reply.id) ? DislikeFilled : DislikeOutlined)"
                        @click="toggleDislike(reply.id)"
                        :class="{ 'disliked': dislikedComments.includes(reply.id) }"
                      >
                        {{ reply.dislikes_count || 0 }}
                      </a-button>

                      <a-button
                        type="text"
                        size="small"
                        :icon="h(CommentOutlined)"
                        @click="toggleReplyBox(reply.id)"
                      >
                        Reply
                      </a-button>

                      <a-dropdown v-if="canEditComment(reply)">
                        <a-button type="text" size="small" :icon="h(EllipsisOutlined)" />
                        <template #overlay>
                          <a-menu>
                            <a-menu-item @click="editComment(reply)">
                              <EditOutlined /> Edit
                            </a-menu-item>
                            <a-menu-item danger @click="deleteComment(reply.id)">
                              <DeleteOutlined /> Delete
                            </a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </div>

                    <!-- 回复的回复输入框 -->
                    <div v-if="activeReplyBox === reply.id" class="nested-reply-form-wrapper">
                      <a-textarea
                        v-model:value="replyContent[reply.id]"
                        :placeholder="`Reply to ${getDisplayName(reply.users)}...`"
                        :rows="2"
                        :maxlength="2000"
                        show-count
                        auto-size
                      />

                      <div class="reply-form-actions">
                        <div class="left-actions">
                          <!-- 表情选择器 -->
                          <a-dropdown trigger="click" placement="topLeft">
                            <a-button type="text" :icon="h(SmileOutlined)" size="small" title="Add emoji">
                              😀
                            </a-button>
                            <template #overlay>
                              <div class="emoji-picker">
                                <div class="emoji-grid">
                                  <span v-for="emoji in emojiList" :key="emoji"
                                        class="emoji-item"
                                        @click="insertEmoji(emoji, reply.id)">
                                    {{ emoji }}
                                  </span>
                                </div>
                              </div>
                            </template>
                          </a-dropdown>
                        </div>

                        <div class="reply-action-buttons">
                          <a-button
                            size="small"
                            @click="cancelReply(reply.id)"
                          >
                            Cancel
                          </a-button>
                          <a-button
                            type="primary"
                            size="small"
                            :loading="replySubmitting[reply.id]"
                            :disabled="!replyContent[reply.id]?.trim()"
                            @click="submitNestedReply(reply.id, comment.id)"
                          >
                            Reply
                          </a-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <a-button @click="loadMore" :loading="loadingMore">
            Load More Comments
          </a-button>
        </div>

        <!-- 空状态 -->
        <a-empty v-if="!loading && comments.length === 0" description="No comments yet. Be the first to comment!" />
      </div>
    </a-spin>

    <!-- 图片预览 -->
    <a-modal
      v-model:open="imagePreviewVisible"
      :footer="null"
      title="Image Preview"
      :width="800"
    >
      <img :src="previewImageUrl" style="width: 100%" alt="Preview" />
    </a-modal>

    <!-- 编辑评论模态框 -->
    <a-modal
      v-model:open="editModalVisible"
      title="Edit Comment"
      @ok="saveEdit"
      @cancel="cancelEdit"
      :confirmLoading="editSubmitting"
    >
      <a-textarea
        v-model:value="editingContent"
        :rows="4"
        :maxlength="2000"
        show-count
        placeholder="Edit your comment..."
      />

      <div style="margin-top: 12px">
        <MediaUploader
          v-model="editingImages"
          :maxFiles="4"
          :maxSize="5 * 1024 * 1024"
          accept="image/*"
          uploadText="Edit Images"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  CommentOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  SmileOutlined
} from '@ant-design/icons-vue';
import { marketplaceAPI } from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import MediaUploader from './MediaUploader.vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getPublicUserName } from '@/utils/publicName';

dayjs.extend(relativeTime);

const props = defineProps({
  itemId: {
    type: [String, Number],
    required: true
  }
});

const authStore = useAuthStore();

// 状态
const comments = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const submitting = ref(false);
const sortBy = ref('newest');
const page = ref(1);
const hasMore = ref(false);
const totalComments = ref(0);

// 评论表单
const commentContent = ref('');
const commentImages = ref([]);

// 回复相关状态
const activeReplyBox = ref(null); // 当前激活的回复框ID
const replyContent = ref({}); // 存储每个评论的回复内容 { commentId: content }
const replySubmitting = ref({}); // 存储每个回复的提交状态 { commentId: boolean }

// 点赞/点踩状态
const likedComments = ref([]);
const dislikedComments = ref([]);

// 表情列表
const emojiList = ref([
  '😀', '😃', '😄', '😁', '😊', '😇', '🙂', '🤔',
  '😍', '🥰', '😘', '😗', '😙', '🤗', '🤩', '🤯',
  '😎', '🤓', '🧐', '😏', '😒', '😞', '😔', '😟',
  '😕', '😣', '😖', '😫', '😩', '🥺', '😢', '😭',
  '😤', '😠', '🤬', '😱', '😨', '😰', '🥵', '🥶',
  '🤪', '😵', '🤢', '🤮', '🤧', '🥳', '😷', '🤒',
  '👍', '👎', '👏', '🙌', '👌', '💪', '🙏', '❤️',
  '💔', '💕', '💖', '💗', '💙', '💚', '💛', '🧡',
  '💜', '🖤', '🤍', '🤎', '💯', '💢', '💬', '👀',
  '🔥', '⭐', '🌟', '✨', '🎉', '🎊', '🌈', '☀️'
]);

// 图片预览
const imagePreviewVisible = ref(false);
const previewImageUrl = ref('');

// 编辑评论
const editModalVisible = ref(false);
const editingComment = ref(null);
const editingContent = ref('');
const editingImages = ref([]);
const editSubmitting = ref(false);

// 当前用户
const currentUser = computed(() => authStore.user);
const getDisplayName = (user) => getPublicUserName(user, 'User');

// 加载评论
const loadComments = async (reset = false) => {
  if (reset) {
    page.value = 1;
    comments.value = [];
  }

  loading.value = reset;
  loadingMore.value = !reset;

  try {
    const response = await marketplaceAPI.getComments(props.itemId, {
      page: page.value,
      limit: 10,
      sort: sortBy.value
    });

    if (response.data.success) {
      const newComments = response.data.data.comments || [];

      if (reset) {
        comments.value = newComments;
      } else {
        comments.value = [...comments.value, ...newComments];
      }

      hasMore.value = response.data.data.pagination.hasMore;
      totalComments.value = comments.value.length;

      // 加载点赞状态
      await loadLikeStatus();
    }
  } catch (error) {
    console.error('Load comments error:', error);
    message.error('Failed to load comments');
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 加载点赞状态
const loadLikeStatus = async () => {
  const commentIds = [];

  comments.value.forEach(comment => {
    commentIds.push(comment.id);
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => commentIds.push(reply.id));
    }
  });

  if (commentIds.length === 0) return;

  try {
    const response = await marketplaceAPI.getLikeStatus(commentIds);
    if (response.data.success) {
      likedComments.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Load like status error:', error);
    // 如果加载失败，不影响评论显示
  }
};

// 提交评论（仅用于发布新评论）
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    message.warning('Please enter comment content');
    return;
  }

  submitting.value = true;

  try {
    const response = await marketplaceAPI.createComment(props.itemId, {
      content: commentContent.value.trim(),
      parentId: null  // 新评论没有父评论
    });

    if (response.data.success) {
      message.success('Comment posted successfully');

      // 清空表单
      commentContent.value = '';
      commentImages.value = [];

      // 重新加载评论
      await loadComments(true);
    }
  } catch (error) {
    console.error('Submit comment error:', error);
    message.error(error.response?.data?.error?.message || 'Failed to post comment');
  } finally {
    submitting.value = false;
  }
};

// 切换回复框显示
const toggleReplyBox = (commentId) => {
  if (activeReplyBox.value === commentId) {
    // 如果点击的是当前激活的回复框，关闭它
    activeReplyBox.value = null;
  } else {
    // 否则激活新的回复框
    activeReplyBox.value = commentId;
    // 初始化回复内容
    if (!replyContent.value[commentId]) {
      replyContent.value[commentId] = '';
    }
  }
};

// 提交回复
const submitReply = async (commentId) => {
  if (!replyContent.value[commentId]?.trim()) {
    message.warning('Please enter reply content');
    return;
  }

  // 设置该评论的提交状态
  replySubmitting.value[commentId] = true;

  try {
    const response = await marketplaceAPI.createComment(props.itemId, {
      content: replyContent.value[commentId].trim(),
      parentId: commentId  // 设置父评论ID
    });

    if (response.data.success) {
      message.success('Reply posted successfully');

      // 清空该评论的回复内容
      replyContent.value[commentId] = '';
      // 关闭回复框
      activeReplyBox.value = null;

      // 重新加载评论
      await loadComments(true);
    }
  } catch (error) {
    console.error('Submit reply error:', error);
    message.error(error.response?.data?.error?.message || 'Failed to post reply');
  } finally {
    replySubmitting.value[commentId] = false;
  }
};

// 取消回复
const cancelReply = (commentId) => {
  activeReplyBox.value = null;
  replyContent.value[commentId] = '';
};

// 提交嵌套回复 (回复的回复)
const submitNestedReply = async (replyId, parentCommentId) => {
  if (!replyContent.value[replyId]?.trim()) {
    message.warning('Please enter reply content');
    return;
  }

  // 设置该回复的提交状态
  replySubmitting.value[replyId] = true;

  try {
    // 嵌套回复的parent_id应该是主评论的ID，而不是回复的ID
    // 这样所有回复都会显示在主评论下
    const response = await marketplaceAPI.createComment(props.itemId, {
      content: replyContent.value[replyId].trim(),
      parentId: parentCommentId  // 使用主评论ID作为父级
    });

    if (response.data.success) {
      message.success('Reply posted successfully');

      // 清空该回复的内容
      replyContent.value[replyId] = '';
      // 关闭回复框
      activeReplyBox.value = null;

      // 重新加载评论
      await loadComments(true);
    }
  } catch (error) {
    console.error('Submit nested reply error:', error);
    message.error(error.response?.data?.error?.message || 'Failed to post reply');
  } finally {
    replySubmitting.value[replyId] = false;
  }
};

// 切换点赞
const toggleLike = async (commentId) => {
  try {
    const response = await marketplaceAPI.toggleLike(commentId);

    if (response.data.success) {
      const { isLiked, likesCount } = response.data.data;

      // 更新点赞状态
      if (isLiked) {
        likedComments.value.push(commentId);
        // 如果点赞，移除点踩状态
        const dislikeIndex = dislikedComments.value.indexOf(commentId);
        if (dislikeIndex > -1) {
          dislikedComments.value.splice(dislikeIndex, 1);
        }
      } else {
        const index = likedComments.value.indexOf(commentId);
        if (index > -1) {
          likedComments.value.splice(index, 1);
        }
      }

      // 更新评论的点赞数
      updateCommentLikes(commentId, likesCount);
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    message.error('Failed to update like');
  }
};

// 切换点踩
const toggleDislike = async (commentId) => {
  try {
    const response = await marketplaceAPI.toggleDislike(commentId);

    if (response.data.success) {
      const { isDisliked, dislikesCount } = response.data.data;

      // 更新点踩状态
      if (isDisliked) {
        dislikedComments.value.push(commentId);
        // 如果点踩，移除点赞状态
        const likeIndex = likedComments.value.indexOf(commentId);
        if (likeIndex > -1) {
          likedComments.value.splice(likeIndex, 1);
        }
      } else {
        const index = dislikedComments.value.indexOf(commentId);
        if (index > -1) {
          dislikedComments.value.splice(index, 1);
        }
      }

      // 更新评论的点踩数
      updateCommentDislikes(commentId, dislikesCount);
    }
  } catch (error) {
    console.error('Toggle dislike error:', error);
    message.error('Failed to update dislike');
  }
};

// 更新评论点赞数
const updateCommentLikes = (commentId, likesCount) => {
  for (const comment of comments.value) {
    if (comment.id === commentId) {
      comment.likes_count = likesCount;
      return;
    }

    if (comment.replies) {
      for (const reply of comment.replies) {
        if (reply.id === commentId) {
          reply.likes_count = likesCount;
          return;
        }
      }
    }
  }
};

// 更新评论点踩数
const updateCommentDislikes = (commentId, dislikesCount) => {
  for (const comment of comments.value) {
    if (comment.id === commentId) {
      // 暂时使用默认值，因为数据库中还没有dislikes_count列
      comment.dislikes_count = dislikesCount || 0;
      return;
    }

    if (comment.replies) {
      for (const reply of comment.replies) {
        if (reply.id === commentId) {
          reply.dislikes_count = dislikesCount || 0;
          return;
        }
      }
    }
  }
};

// 检查是否可以编辑评论
const canEditComment = (comment) => {
  return currentUser.value && currentUser.value.id === comment.user_id;
};

// 编辑评论
const editComment = (comment) => {
  editingComment.value = comment;
  editingContent.value = comment.content;
  editingImages.value = comment.images || [];
  editModalVisible.value = true;
};

// 保存编辑
const saveEdit = async () => {
  if (!editingContent.value.trim()) {
    message.warning('Comment content cannot be empty');
    return;
  }

  editSubmitting.value = true;

  try {
    const response = await marketplaceAPI.updateComment(editingComment.value.id, {
      content: editingContent.value.trim(),
      images: editingImages.value
    });

    if (response.data.success) {
      message.success('Comment updated successfully');
      editModalVisible.value = false;

      // 重新加载评论
      await loadComments(true);
    }
  } catch (error) {
    console.error('Update comment error:', error);
    message.error(error.response?.data?.error?.message || 'Failed to update comment');
  } finally {
    editSubmitting.value = false;
  }
};

// 取消编辑
const cancelEdit = () => {
  editingComment.value = null;
  editingContent.value = '';
  editingImages.value = [];
  editModalVisible.value = false;
};

// 删除评论
const deleteComment = (commentId) => {
  Modal.confirm({
    title: 'Delete Comment',
    content: 'Are you sure you want to delete this comment?',
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: async () => {
      try {
        await marketplaceAPI.deleteComment(commentId);
        message.success('Comment deleted successfully');

        // 重新加载评论
        await loadComments(true);
      } catch (error) {
        console.error('Delete comment error:', error);
        message.error(error.response?.data?.error?.message || 'Failed to delete comment');
      }
    }
  });
};

// 排序改变
const handleSortChange = () => {
  loadComments(true);
};

// 加载更多
const loadMore = () => {
  page.value++;
  loadComments(false);
};

// 预览图片
const previewImage = (url) => {
  previewImageUrl.value = url;
  imagePreviewVisible.value = true;
};

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).fromNow();
};

// 插入表情
const insertEmoji = (emoji, commentId) => {
  if (commentId === null) {
    // 插入到主评论框
    const currentText = commentContent.value || '';
    commentContent.value = currentText + emoji;
  } else {
    // 插入到回复框
    const currentText = replyContent.value[commentId] || '';
    replyContent.value[commentId] = currentText + emoji;
  }
};

// 初始化
onMounted(() => {
  loadComments(true);
});

// 暴露方法
defineExpose({
  loadComments
});
</script>

<style scoped>
.comments-section {
  margin-top: 24px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.comments-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.comment-form-wrapper {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 12px;
  gap: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.comment-content {
  flex: 1;
}

.comment-header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
}

.comment-username {
  color: #8c8c8c;
  font-weight: 400;
  margin-left: 4px;
}

.comment-time {
  color: #8c8c8c;
  font-size: 12px;
}

.edited-badge {
  font-style: italic;
  margin-left: 4px;
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-images {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.comment-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.comment-image:hover {
  transform: scale(1.05);
}

.comment-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* 回复输入框样式 */
.reply-form-wrapper {
  margin-top: 12px;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

/* 嵌套回复输入框样式 */
.nested-reply-form-wrapper {
  margin-top: 8px;
  background: #fafafa;
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid #52c41a;
}

.reply-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}

.reply-action-buttons {
  display: flex;
  gap: 6px;
}

.replies-list {
  margin-left: 52px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reply-item {
  display: flex;
  gap: 8px;
}

.reply-content {
  flex: 1;
}

.reply-header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.reply-author {
  font-weight: 600;
  font-size: 13px;
}

.reply-username {
  color: #8c8c8c;
  font-weight: 400;
  margin-left: 4px;
}

.reply-time {
  color: #8c8c8c;
  font-size: 12px;
}

.reply-text {
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-images {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.reply-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.reply-image:hover {
  transform: scale(1.05);
}

.reply-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.load-more {
  text-align: center;
  padding: 16px 0;
}

/* 表情选择器样式 */
.emoji-picker {
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  padding: 8px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.emoji-item {
  font-size: 18px;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  text-align: center;
  transition: background-color 0.2s;
}

.emoji-item:hover {
  background-color: #f5f5f5;
}

/* 点赞点踩按钮样式 */
.liked {
  color: #1890ff !important;
}

.disliked {
  color: #ff4d4f !important;
}
</style>
