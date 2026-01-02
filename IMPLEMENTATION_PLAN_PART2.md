# 🚀 CampusRide 实施计划 - 第二部分

## ⚠️ 重要原则：灵活性优先

**实用主义原则：**
- ✅ 如果某个方案不work，立即换备选方案
- ✅ 不要陷入debug死循环，超过30分钟就换方案
- ✅ 优先使用已验证的技术栈
- ✅ 保持代码简单直接，避免过度设计

**每个技术点都提供备选方案：**
- 方案A（推荐）
- 方案B（如果A不行）
- 方案C（最简单的fallback）

---

## 🔷 阶段三：Marketplace 二手市场增强（4-5天）

### 3.1 图片上传功能

#### 产品需求
- **用户故事**: 作为卖家，我希望上传多张商品图片来吸引买家
- **验收标准**:
  - ✅ 最多上传6张图片
  - ✅ 支持拖拽上传
  - ✅ 图片预览和删除
  - ✅ 设置主图
  - ✅ 自动压缩（前端或后端）

#### 方案对比

**方案A：Supabase Storage（推荐）**
- ✅ 优点：已集成、CDN加速、权限管理
- ❌ 缺点：需要配置bucket策略
- 适用：项目已使用Supabase

**方案B：Cloudinary**
- ✅ 优点：强大的图片处理能力、自动优化
- ❌ 缺点：需要额外注册、有免费额度限制
- 适用：需要高级图片处理

**方案C：本地存储 + Nginx（Fallback）**
- ✅ 优点：简单直接、无外部依赖
- ❌ 缺点：扩展性差、需要手动备份
- 适用：快速验证功能

#### 实现代码（方案A：Supabase Storage）

**前端 - ImageUploader.vue**
```vue
<template>
  <div class="image-uploader">
    <div class="upload-area">
      <!-- 上传区域 -->
      <a-upload
        v-model:file-list="fileList"
        list-type="picture-card"
        :before-upload="beforeUpload"
        :custom-request="handleUpload"
        :max-count="6"
        @preview="handlePreview"
        @remove="handleRemove"
      >
        <div v-if="fileList.length < 6">
          <PlusOutlined />
          <div class="upload-text">Upload</div>
        </div>
      </a-upload>

      <!-- 拖拽提示 -->
      <div class="upload-hint">
        <InfoCircleOutlined />
        <span>Drag & drop images here or click to browse (Max 6 images, 5MB each)</span>
      </div>
    </div>

    <!-- 图片预览Modal -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      @cancel="previewVisible = false"
    >
      <img :src="previewImage" style="width: 100%" />
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import { supabase } from '@/utils/supabase';

const props = defineProps({
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  },
  bucketName: {
    type: String,
    default: 'marketplace-images'
  }
});

const emit = defineEmits(['update:images', 'upload-complete']);

const fileList = ref([]);
const previewVisible = ref(false);
const previewImage = ref('');
const uploading = ref(false);

// 上传前验证
const beforeUpload = (file) => {
  // 验证文件类型
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('You can only upload image files!');
    return false;
  }

  // 验证文件大小
  const isLtMaxSize = file.size <= props.maxSize;
  if (!isLtMaxSize) {
    message.error(`Image must be smaller than ${props.maxSize / 1024 / 1024}MB!`);
    return false;
  }

  return true;
};

// 自定义上传逻辑
const handleUpload = async ({ file, onSuccess, onError, onProgress }) => {
  try {
    uploading.value = true;

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomStr}.${ext}`;

    // 上传到Supabase Storage
    const { data, error } = await supabase.storage
      .from(props.bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          onProgress({ percent });
        }
      });

    if (error) throw error;

    // 获取公开URL
    const { data: { publicUrl } } = supabase.storage
      .from(props.bucketName)
      .getPublicUrl(fileName);

    // 更新文件列表
    const uploadedFile = {
      uid: file.uid,
      name: file.name,
      status: 'done',
      url: publicUrl,
      path: fileName
    };

    fileList.value.push(uploadedFile);

    // 通知父组件
    emit('update:images', fileList.value.map(f => ({
      url: f.url,
      path: f.path,
      is_primary: fileList.value.indexOf(f) === 0
    })));

    onSuccess(data);
    message.success('Image uploaded successfully');

  } catch (error) {
    console.error('Upload error:', error);
    message.error('Failed to upload image');
    onError(error);
  } finally {
    uploading.value = false;
  }
};

// 预览图片
const handlePreview = (file) => {
  previewImage.value = file.url || file.preview;
  previewVisible.value = true;
};

// 删除图片
const handleRemove = async (file) => {
  try {
    // 从Supabase删除
    if (file.path) {
      const { error } = await supabase.storage
        .from(props.bucketName)
        .remove([file.path]);

      if (error) throw error;
    }

    // 从列表移除
    const index = fileList.value.findIndex(f => f.uid === file.uid);
    if (index > -1) {
      fileList.value.splice(index, 1);
    }

    // 通知父组件
    emit('update:images', fileList.value.map(f => ({
      url: f.url,
      path: f.path,
      is_primary: fileList.value.indexOf(f) === 0
    })));

    message.success('Image removed');

  } catch (error) {
    console.error('Remove error:', error);
    message.error('Failed to remove image');
  }
};

// 设置主图
const setPrimaryImage = (file) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid);
  if (index > -1) {
    const [primaryFile] = fileList.value.splice(index, 1);
    fileList.value.unshift(primaryFile);

    emit('update:images', fileList.value.map(f => ({
      url: f.url,
      path: f.path,
      is_primary: fileList.value.indexOf(f) === 0
    })));
  }
};
</script>
```

**如果Supabase Storage有问题，立即切换到方案C（本地存储）：**

```javascript
// 方案C：简单本地存储
const handleUpload = async ({ file, onSuccess, onError }) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/v1/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error.message);

    fileList.value.push({
      uid: file.uid,
      name: file.name,
      status: 'done',
      url: result.data.url
    });

    onSuccess(result.data);
    message.success('Image uploaded');

  } catch (error) {
    message.error('Upload failed');
    onError(error);
  }
};
```

**后端 - 本地存储版本（Fallback）**
```javascript
// controllers/upload.controller.js
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp'; // 图片压缩

// 配置multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'marketplace');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'), false);
    }
    cb(null, true);
  }
});

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' }
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    // 压缩图片
    const compressedPath = path.join(path.dirname(filePath), `compressed_${fileName}`);
    await sharp(filePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(compressedPath);

    // 删除原图
    await fs.unlink(filePath);

    // 重命名压缩图
    await fs.rename(compressedPath, filePath);

    // 返回URL
    const imageUrl = `/uploads/marketplace/${fileName}`;

    res.status(201).json({
      success: true,
      data: {
        url: imageUrl,
        filename: fileName
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload image' }
    });
  }
};

export const uploadMiddleware = upload.single('image');
```

**如果Sharp压缩有问题，直接跳过压缩：**
```javascript
// 最简版本：不压缩，直接存储
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' }
      });
    }

    const imageUrl = `/uploads/marketplace/${req.file.filename}`;

    res.status(201).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: error.message }
    });
  }
};
```

#### Supabase Storage 配置（如果使用方案A）

**1. 创建Bucket**
```sql
-- 在Supabase Dashboard执行
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-images', 'marketplace-images', true);
```

**2. 设置存储策略**
```sql
-- 允许认证用户上传
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketplace-images');

-- 所有人可以读取
CREATE POLICY "Public can read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace-images');

-- 用户可以删除自己的文件
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'marketplace-images' AND auth.uid()::text = owner);
```

**如果策略配置失败，使用公开bucket：**
```javascript
// 前端直接使用公开上传
const { data, error } = await supabase.storage
  .from('marketplace-images')
  .upload(fileName, file, {
    public: true,
    upsert: false
  });
```

---

### 3.2 评论系统

#### 产品需求
- **用户故事**: 作为买家，我希望询问商品详情并查看其他人的评论
- **验收标准**:
  - ✅ 发布评论
  - ✅ 回复评论（一级回复）
  - ✅ 点赞评论
  - ✅ 删除自己的评论
  - ✅ 实时评论更新

#### 技术方案

**方案A：Supabase Realtime + PostgreSQL（推荐）**
- ✅ 优点：实时更新、已有数据库
- ❌ 缺点：需要配置realtime订阅

**方案B：轮询（Fallback）**
- ✅ 优点：简单可靠
- ❌ 缺点：不是真正实时、消耗资源
- 使用场景：Realtime不work时

#### 数据库设计

```sql
CREATE TABLE marketplace_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES marketplace_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES marketplace_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_marketplace_comments_item_id ON marketplace_comments(item_id);
CREATE INDEX idx_marketplace_comments_user_id ON marketplace_comments(user_id);
CREATE INDEX idx_marketplace_comments_parent ON marketplace_comments(parent_comment_id);

-- 评论点赞表
CREATE TABLE marketplace_comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES marketplace_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment ON marketplace_comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON marketplace_comment_likes(user_id);

-- 触发器：更新评论点赞数
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_comments
    SET likes_count = likes_count - 1
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_likes
AFTER INSERT OR DELETE ON marketplace_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();
```

#### 前端实现

**CommentSection.vue**
```vue
<template>
  <div class="comment-section">
    <div class="section-header">
      <h3>Comments ({{ totalComments }})</h3>
    </div>

    <!-- 发表评论 -->
    <div class="comment-input" v-if="currentUser">
      <a-avatar :src="currentUser.avatar_url">
        {{ currentUser.first_name?.[0] }}
      </a-avatar>
      <div class="input-wrapper">
        <a-textarea
          v-model:value="newComment"
          :rows="2"
          placeholder="Write a comment..."
          :maxlength="1000"
          @keydown.meta.enter="submitComment"
          @keydown.ctrl.enter="submitComment"
        />
        <div class="input-footer">
          <span class="char-count">{{ newComment.length }}/1000</span>
          <a-button
            type="primary"
            :loading="submitting"
            :disabled="!newComment.trim()"
            @click="submitComment"
          >
            Post
          </a-button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="comments-list">
      <a-spin :spinning="loading">
        <div v-if="comments.length === 0" class="empty-comments">
          <CommentOutlined class="empty-icon" />
          <p>No comments yet. Be the first to comment!</p>
        </div>

        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :current-user-id="currentUser?.id"
          @reply="handleReply"
          @like="handleLike"
          @delete="handleDelete"
        />

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <a-button @click="loadMore" :loading="loadingMore">
            Load More Comments
          </a-button>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { CommentOutlined } from '@ant-design/icons-vue';
import { marketplaceAPI } from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import CommentItem from './CommentItem.vue';
import { supabase } from '@/utils/supabase';

const props = defineProps({
  itemId: {
    type: String,
    required: true
  }
});

const authStore = useAuthStore();
const currentUser = computed(() => authStore.user);

const comments = ref([]);
const newComment = ref('');
const submitting = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(false);
const page = ref(1);
const limit = 20;

const totalComments = computed(() => comments.value.length);

// 加载评论
const loadComments = async (append = false) => {
  try {
    if (append) {
      loadingMore.value = true;
    } else {
      loading.value = true;
    }

    const response = await marketplaceAPI.getItemComments(props.itemId, {
      page: page.value,
      limit
    });

    if (append) {
      comments.value.push(...response.data.comments);
    } else {
      comments.value = response.data.comments;
    }

    hasMore.value = response.data.pagination.has_more;

  } catch (error) {
    console.error('Load comments error:', error);
    message.error('Failed to load comments');
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) return;

  try {
    submitting.value = true;

    const response = await marketplaceAPI.createComment(props.itemId, {
      content: newComment.value.trim()
    });

    // 添加到列表顶部
    comments.value.unshift(response.data);
    newComment.value = '';

    message.success('Comment posted');

  } catch (error) {
    console.error('Submit comment error:', error);
    message.error('Failed to post comment');
  } finally {
    submitting.value = false;
  }
};

// 回复评论
const handleReply = async (commentId, content) => {
  try {
    const response = await marketplaceAPI.createComment(props.itemId, {
      content,
      parent_comment_id: commentId
    });

    // 找到父评论并添加回复
    const parentComment = findComment(comments.value, commentId);
    if (parentComment) {
      if (!parentComment.replies) {
        parentComment.replies = [];
      }
      parentComment.replies.push(response.data);
    }

    message.success('Reply posted');

  } catch (error) {
    console.error('Reply error:', error);
    message.error('Failed to post reply');
  }
};

// 点赞评论
const handleLike = async (commentId) => {
  try {
    const comment = findComment(comments.value, commentId);
    if (!comment) return;

    const isLiked = comment.is_liked_by_user;

    if (isLiked) {
      await marketplaceAPI.unlikeComment(commentId);
      comment.likes_count--;
      comment.is_liked_by_user = false;
    } else {
      await marketplaceAPI.likeComment(commentId);
      comment.likes_count++;
      comment.is_liked_by_user = true;
    }

  } catch (error) {
    console.error('Like error:', error);
    message.error('Failed to like comment');
  }
};

// 删除评论
const handleDelete = async (commentId) => {
  try {
    await marketplaceAPI.deleteComment(commentId);

    // 从列表移除
    removeComment(comments.value, commentId);

    message.success('Comment deleted');

  } catch (error) {
    console.error('Delete error:', error);
    message.error('Failed to delete comment');
  }
};

// 加载更多
const loadMore = () => {
  page.value++;
  loadComments(true);
};

// 辅助函数：查找评论
const findComment = (list, id) => {
  for (const comment of list) {
    if (comment.id === id) return comment;
    if (comment.replies) {
      const found = findComment(comment.replies, id);
      if (found) return found;
    }
  }
  return null;
};

// 辅助函数：移除评论
const removeComment = (list, id) => {
  const index = list.findIndex(c => c.id === id);
  if (index > -1) {
    list.splice(index, 1);
    return true;
  }
  for (const comment of list) {
    if (comment.replies && removeComment(comment.replies, id)) {
      return true;
    }
  }
  return false;
};

// Realtime订阅（方案A）
let realtimeChannel;

const setupRealtime = () => {
  try {
    realtimeChannel = supabase
      .channel(`marketplace:${props.itemId}:comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_comments',
          filter: `item_id=eq.${props.itemId}`
        },
        (payload) => {
          handleRealtimeChange(payload);
        }
      )
      .subscribe();
  } catch (error) {
    console.error('Realtime setup failed, falling back to polling:', error);
    setupPolling(); // 如果Realtime失败，使用轮询
  }
};

const handleRealtimeChange = (payload) => {
  const { eventType, new: newRecord, old: oldRecord } = payload;

  if (eventType === 'INSERT') {
    // 新评论
    if (!comments.value.find(c => c.id === newRecord.id)) {
      comments.value.unshift(newRecord);
    }
  } else if (eventType === 'DELETE') {
    // 删除评论
    removeComment(comments.value, oldRecord.id);
  } else if (eventType === 'UPDATE') {
    // 更新评论（点赞数等）
    const comment = findComment(comments.value, newRecord.id);
    if (comment) {
      Object.assign(comment, newRecord);
    }
  }
};

// 轮询方案（Fallback）
let pollingInterval;

const setupPolling = () => {
  pollingInterval = setInterval(() => {
    loadComments(false);
  }, 30000); // 每30秒刷新
};

// 生命周期
onMounted(() => {
  loadComments();
  setupRealtime(); // 尝试使用Realtime，失败自动切换轮询
});

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});
</script>
```

**CommentItem.vue**
```vue
<template>
  <div class="comment-item" :class="{ 'is-reply': isReply }">
    <ClickableAvatar
      :user="comment.user"
      size="default"
    />

    <div class="comment-content">
      <div class="comment-header">
        <span class="user-name">{{ comment.user.first_name }} {{ comment.user.last_name }}</span>
        <span class="timestamp">{{ formatTimeAgo(comment.created_at) }}</span>
      </div>

      <div class="comment-body">
        {{ comment.content }}
      </div>

      <div class="comment-actions">
        <a-button
          type="text"
          size="small"
          :class="{ 'liked': comment.is_liked_by_user }"
          @click="$emit('like', comment.id)"
        >
          <LikeOutlined v-if="!comment.is_liked_by_user" />
          <LikeFilled v-else />
          {{ comment.likes_count || 0 }}
        </a-button>

        <a-button
          type="text"
          size="small"
          @click="showReplyInput = !showReplyInput"
        >
          <CommentOutlined /> Reply
        </a-button>

        <a-button
          v-if="comment.user.id === currentUserId"
          type="text"
          size="small"
          danger
          @click="confirmDelete"
        >
          <DeleteOutlined /> Delete
        </a-button>
      </div>

      <!-- 回复输入 -->
      <div v-if="showReplyInput" class="reply-input">
        <a-textarea
          v-model:value="replyContent"
          :rows="2"
          :placeholder="`Reply to ${comment.user.first_name}...`"
          @keydown.meta.enter="submitReply"
        />
        <div class="reply-actions">
          <a-button size="small" @click="showReplyInput = false">Cancel</a-button>
          <a-button
            type="primary"
            size="small"
            :disabled="!replyContent.trim()"
            @click="submitReply"
          >
            Reply
          </a-button>
        </div>
      </div>

      <!-- 子回复 -->
      <div v-if="comment.replies && comment.replies.length > 0" class="replies">
        <CommentItem
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :current-user-id="currentUserId"
          :is-reply="true"
          @reply="$emit('reply', $event)"
          @like="$emit('like', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Modal } from 'ant-design-vue';
import {
  LikeOutlined,
  LikeFilled,
  CommentOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import ClickableAvatar from '@/components/common/ClickableAvatar.vue';
import { formatTimeAgo } from '@/utils/timeUtils';

const props = defineProps({
  comment: Object,
  currentUserId: String,
  isReply: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['reply', 'like', 'delete']);

const showReplyInput = ref(false);
const replyContent = ref('');

const submitReply = () => {
  if (!replyContent.value.trim()) return;

  emit('reply', props.comment.id, replyContent.value.trim());
  replyContent.value = '';
  showReplyInput.value = false;
};

const confirmDelete = () => {
  Modal.confirm({
    title: 'Delete Comment',
    content: 'Are you sure you want to delete this comment?',
    okText: 'Delete',
    okType: 'danger',
    onOk: () => {
      emit('delete', props.comment.id);
    }
  });
};
</script>
```

#### 后端API

```javascript
// controllers/marketplace-comments.controller.js

// 获取商品评论
export const getItemComments = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.userId;

    const offset = (page - 1) * limit;

    // 查询主评论
    let query = supabase
      .from('marketplace_comments')
      .select(`
        *,
        user:users!marketplace_comments_user_id_fkey(
          id, first_name, last_name, avatar_url
        ),
        replies:marketplace_comments!parent_comment_id(
          *,
          user:users!marketplace_comments_user_id_fkey(
            id, first_name, last_name, avatar_url
          )
        )
      `)
      .eq('item_id', itemId)
      .is('parent_comment_id', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: comments, error, count } = await query;

    if (error) throw error;

    // 检查用户是否点赞了评论
    if (userId) {
      const commentIds = comments.map(c => c.id);
      const { data: likes } = await supabase
        .from('marketplace_comment_likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', commentIds);

      const likedIds = new Set(likes?.map(l => l.comment_id) || []);

      comments.forEach(comment => {
        comment.is_liked_by_user = likedIds.has(comment.id);
      });
    }

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          has_more: offset + limit < count
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GET_COMMENTS_FAILED', message: 'Failed to get comments' }
    });
  }
};

// 创建评论
export const createComment = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { content, parent_comment_id } = req.body;
    const userId = req.user.userId;

    // 验证内容
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CONTENT', message: 'Comment content cannot be empty' }
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: { code: 'CONTENT_TOO_LONG', message: 'Comment must be 1000 characters or less' }
      });
    }

    // 验证商品存在
    const { data: item } = await supabase
      .from('marketplace_items')
      .select('id')
      .eq('id', itemId)
      .single();

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' }
      });
    }

    // 如果是回复，验证父评论存在
    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('marketplace_comments')
        .select('id')
        .eq('id', parent_comment_id)
        .single();

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          error: { code: 'PARENT_COMMENT_NOT_FOUND', message: 'Parent comment not found' }
        });
      }
    }

    // 创建评论
    const { data: comment, error } = await supabase
      .from('marketplace_comments')
      .insert({
        item_id: itemId,
        user_id: userId,
        parent_comment_id: parent_comment_id || null,
        content: content.trim()
      })
      .select(`
        *,
        user:users!marketplace_comments_user_id_fkey(
          id, first_name, last_name, avatar_url
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: comment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_COMMENT_FAILED', message: 'Failed to create comment' }
    });
  }
};

// 点赞评论
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // 检查是否已点赞
    const { data: existingLike } = await supabase
      .from('marketplace_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_LIKED', message: 'You already liked this comment' }
      });
    }

    // 创建点赞
    const { error } = await supabase
      .from('marketplace_comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId
      });

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { message: 'Comment liked' }
    });

  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LIKE_FAILED', message: 'Failed to like comment' }
    });
  }
};

// 取消点赞
export const unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const { error } = await supabase
      .from('marketplace_comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: { message: 'Comment unliked' }
    });

  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UNLIKE_FAILED', message: 'Failed to unlike comment' }
    });
  }
};

// 删除评论
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // 验证评论所有权
    const { data: comment } = await supabase
      .from('marketplace_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' }
      });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'You can only delete your own comments' }
      });
    }

    // 软删除
    const { error } = await supabase
      .from('marketplace_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: { message: 'Comment deleted' }
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: 'Failed to delete comment' }
    });
  }
};
```

---

## 🔷 阶段四：通用头像与聊天系统（5-6天）

### 4.1 ClickableAvatar通用组件

#### 产品需求
- **用户故事**: 作为用户，我希望点击任何地方的头像都能快速查看该用户信息并发起聊天
- **验收标准**:
  - ✅ 点击头像显示用户卡片
  - ✅ 显示用户基本信息、评分、活动数
  - ✅ 一键发起私信
  - ✅ 应用到所有模块

**ClickableAvatar.vue**
```vue
<template>
  <div class="clickable-avatar" @click="showUserCard">
    <a-badge :dot="user.is_online" :offset="[-5, 35]">
      <a-avatar
        :src="user.avatar_url"
        :size="size"
        :class="{ 'cursor-pointer': !disabled }"
      >
        {{ getInitials(user) }}
      </a-avatar>
    </a-badge>

    <!-- 用户卡片Popover -->
    <a-popover
      v-model:open="cardVisible"
      trigger="click"
      placement="bottom"
      :overlay-class-name="'user-card-popover'"
    >
      <template #content>
        <UserQuickCard
          :user="user"
          @message="handleMessage"
          @close="cardVisible = false"
        />
      </template>
    </a-popover>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import UserQuickCard from './UserQuickCard.vue';

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
});

const emit = defineEmits(['click', 'message']);

const router = useRouter();
const cardVisible = ref(false);

const getInitials = (user) => {
  const first = user.first_name?.[0] || '';
  const last = user.last_name?.[0] || '';
  return (first + last).toUpperCase();
};

const showUserCard = () => {
  if (props.disabled) return;
  cardVisible.value = true;
  emit('click', props.user);
};

const handleMessage = () => {
  cardVisible.value = false;
  router.push({
    name: 'messages',
    query: { userId: props.user.id }
  });
  emit('message', props.user);
};
</script>
```

**UserQuickCard.vue**
```vue
<template>
  <div class="user-quick-card">
    <div class="card-header">
      <a-avatar :src="user.avatar_url" :size="64">
        {{ getInitials(user) }}
      </a-avatar>
      <div class="user-info">
        <h3>{{ user.first_name }} {{ user.last_name }}</h3>
        <p class="email">{{ maskEmail(user.email) }}</p>
        <div class="rating">
          <StarFilled v-for="i in 5" :key="i"
            :class="{ active: i <= user.avg_rating }" />
          <span>{{ user.avg_rating?.toFixed(1) || '5.0' }}</span>
        </div>
      </div>
    </div>

    <div class="card-stats">
      <div class="stat-item">
        <CarOutlined />
        <span class="stat-value">{{ user.total_carpools || 0 }}</span>
        <span class="stat-label">Rides</span>
      </div>
      <div class="stat-item">
        <CalendarOutlined />
        <span class="stat-value">{{ user.total_activities || 0 }}</span>
        <span class="stat-label">Activities</span>
      </div>
      <div class="stat-item">
        <TrophyOutlined />
        <span class="stat-value">{{ user.points || 0 }}</span>
        <span class="stat-label">Points</span>
      </div>
    </div>

    <div class="card-actions">
      <a-button type="primary" block @click="$emit('message')">
        <MessageOutlined /> Send Message
      </a-button>
      <a-button block @click="viewProfile">
        <UserOutlined /> View Profile
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import {
  StarFilled,
  CarOutlined,
  CalendarOutlined,
  TrophyOutlined,
  MessageOutlined,
  UserOutlined
} from '@ant-design/icons-vue';

const props = defineProps({
  user: Object
});

const emit = defineEmits(['message', 'close']);

const router = useRouter();

const getInitials = (user) => {
  return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
};

const maskEmail = (email) => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  return `${name.slice(0, 3)}***@${domain}`;
};

const viewProfile = () => {
  router.push(`/profile/${props.user.id}`);
  emit('close');
};
</script>
```

---

### 4.2 消息通知系统

#### 技术方案

**方案A：Supabase Realtime + Socket.io（推荐）**
- 实时消息推送
- 在线状态管理

**方案B：纯轮询（Fallback）**
- 每10秒轮询一次
- 简单可靠

**NotificationDropdown.vue - 铃铛通知**
```vue
<template>
  <a-dropdown
    v-model:open="dropdownVisible"
    :trigger="['click']"
    placement="bottomRight"
    overlay-class-name="notification-dropdown"
  >
    <div class="notification-bell">
      <a-badge :count="unreadCount" :overflow-count="99">
        <BellOutlined @click="handleBellClick" />
      </a-badge>
    </div>

    <template #overlay>
      <div class="notification-panel">
        <div class="panel-header">
          <h3>Notifications</h3>
          <a-button type="text" size="small" @click="markAllAsRead">
            Mark all read
          </a-button>
        </div>

        <div class="notification-list">
          <a-spin :spinning="loading">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item"
              :class="{ 'unread': !notification.is_read }"
              @click="handleNotificationClick(notification)"
            >
              <ClickableAvatar :user="notification.sender" size="small" />
              <div class="notification-content">
                <p class="message">{{ notification.message }}</p>
                <span class="time">{{ formatTimeAgo(notification.created_at) }}</span>
              </div>
            </div>

            <div v-if="notifications.length === 0" class="empty-notifications">
              <BellOutlined class="empty-icon" />
              <p>No notifications</p>
            </div>
          </a-spin>
        </div>

        <div class="panel-footer">
          <a-button type="link" @click="viewAllMessages">
            View All Messages
          </a-button>
        </div>
      </div>
    </template>
  </a-dropdown>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { BellOutlined } from '@ant-design/icons-vue';
import { messagesAPI } from '@/utils/api';
import ClickableAvatar from '@/components/common/ClickableAvatar.vue';
import { formatTimeAgo } from '@/utils/timeUtils';
import { supabase } from '@/utils/supabase';

const router = useRouter();

const dropdownVisible = ref(false);
const notifications = ref([]);
const loading = ref(false);
const unreadCount = ref(0);

// 加载通知
const loadNotifications = async () => {
  try {
    loading.value = true;

    const response = await messagesAPI.getNotifications({
      limit: 20
    });

    notifications.value = response.data.notifications;
    unreadCount.value = response.data.unread_count;

  } catch (error) {
    console.error('Load notifications error:', error);
  } finally {
    loading.value = false;
  }
};

// 点击铃铛
const handleBellClick = () => {
  dropdownVisible.value = !dropdownVisible.value;
  if (dropdownVisible.value) {
    loadNotifications();
  }
};

// 点击通知
const handleNotificationClick = async (notification) => {
  // 标记为已读
  if (!notification.is_read) {
    await messagesAPI.markNotificationAsRead(notification.id);
    notification.is_read = true;
    unreadCount.value--;
  }

  // 根据类型跳转
  if (notification.type === 'message') {
    router.push({
      name: 'messages',
      query: { threadId: notification.thread_id }
    });
  } else if (notification.type === 'booking') {
    router.push(`/carpooling/booking/${notification.booking_id}`);
  }

  dropdownVisible.value = false;
};

// 全部标记为已读
const markAllAsRead = async () => {
  try {
    await messagesAPI.markAllNotificationsAsRead();
    notifications.value.forEach(n => n.is_read = true);
    unreadCount.value = 0;
  } catch (error) {
    console.error('Mark all read error:', error);
  }
};

// 查看所有消息
const viewAllMessages = () => {
  router.push('/messages');
  dropdownVisible.value = false;
};

// Realtime订阅（方案A）
let realtimeChannel;

const setupRealtime = () => {
  try {
    const userId = localStorage.getItem('userId');

    realtimeChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          // 新通知
          notifications.value.unshift(payload.new);
          unreadCount.value++;
        }
      )
      .subscribe();
  } catch (error) {
    console.error('Realtime setup failed, using polling:', error);
    setupPolling();
  }
};

// 轮询方案（Fallback）
let pollingInterval;

const setupPolling = () => {
  pollingInterval = setInterval(() => {
    loadNotifications();
  }, 10000); // 每10秒
};

onMounted(() => {
  loadNotifications();
  setupRealtime();
});

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});
</script>
```

---

## 🔷 阶段五-十：剩余部分概要

由于文档很长，我把剩余阶段做成概要版本，每个阶段包含：
1. 核心代码
2. 备选方案
3. 快速调试建议

### 阶段五：Activity地图增强
- 用户头像标记（使用Leaflet.js或Google Maps）
- 实时位置更新（WebSocket或轮询）
- 如果地图库有问题：用简单的列表视图代替

### 阶段六：用户资料与优惠券
- 用户Profile页面（基本CRUD）
- 优惠券发放（Cron job或手动触发）
- 如果Cron不work：用简单的定时任务

### 阶段七：积分系统
- 直接复制Cindy的代码
- 确保数据库触发器正常
- 如果触发器有问题：改用API调用

### 阶段八：数据库迁移
- 所有SQL脚本
- 回滚脚本（重要！）
- 测试脚本

### 阶段九：测试
- 关键路径测试优先
- 不追求100%覆盖率
- 手动测试 + 简单自动化

### 阶段十：部署
- 环境变量配置
- Docker配置（可选）
- 监控（可选）

---

## 🚨 Debug策略

### 如果遇到问题：

**1. 30分钟规则**
- 超过30分钟没解决，立即换方案
- 不要陷入死循环

**2. 降级策略**
```
复杂方案 → 简单方案 → 最简单能work的方案
```

**3. 常见问题快速解决**

| 问题 | 快速方案 |
|------|---------|
| Supabase Realtime不work | 改用轮询 |
| 图片上传失败 | 用本地存储 |
| WebSocket连接问题 | 改用HTTP轮询 |
| 复杂SQL查询慢 | 简化查询或加缓存 |
| 第三方API超时 | 设置timeout，降级处理 |

**4. 日志策略**
```javascript
// 任何异步操作都加try-catch + 详细日志
try {
  // 操作
} catch (error) {
  console.error('详细描述:', {
    error: error.message,
    stack: error.stack,
    context: { /* 上下文信息 */ }
  });
  // 降级处理
}
```

**5. 功能开关**
```javascript
// 任何新功能都加开关
const FEATURES = {
  REALTIME: process.env.ENABLE_REALTIME === 'true',
  IMAGE_UPLOAD: process.env.ENABLE_IMAGE_UPLOAD === 'true',
  // ...
};

// 使用
if (FEATURES.REALTIME) {
  setupRealtime();
} else {
  setupPolling();
}
```

---

## ✅ 下一步

现在你有两份文档：
1. `IMPLEMENTATION_PLAN_DETAILED.md` - 前两个阶段的详细实现
2. `IMPLEMENTATION_PLAN_PART2.md` - 剩余阶段 + 灵活性策略

我可以开始实施了吗？还是需要我继续补充某个特定阶段的详细内容？
