<template>
  <div class="media-uploader">
    <!-- 上传按钮 -->
    <div class="upload-trigger">
      <input
        ref="fileInput"
        type="file"
        :accept="acceptTypes"
        :multiple="multiple"
        @change="handleFileSelect"
        class="hidden-input"
      />

      <a-button
        v-if="!hideButton"
        :icon="uploadIcon"
        :loading="uploading"
        @click="triggerFileSelect"
        :disabled="disabled || (maxFiles && modelValue.length >= maxFiles)"
      >
        {{ uploadText }}
      </a-button>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <a-progress :percent="uploadProgress" status="active" />
      <span class="progress-text">Uploading... {{ uploadProgress }}%</span>
    </div>

    <!-- 文件预览列表 -->
    <div v-if="modelValue && modelValue.length > 0" class="media-preview-list">
      <div
        v-for="(file, index) in modelValue"
        :key="index"
        class="media-preview-item"
      >
        <!-- 图片预览 -->
        <div v-if="isImage(file)" class="preview-image">
          <img :src="file" :alt="`Image ${index + 1}`" />
          <div class="preview-overlay">
            <a-button
              type="text"
              :icon="h(EyeOutlined)"
              @click="previewMedia(file)"
              class="preview-btn"
            />
            <a-button
              type="text"
              danger
              :icon="h(DeleteOutlined)"
              @click="removeFile(index)"
              class="delete-btn"
            />
          </div>
        </div>

        <!-- 视频预览 -->
        <div v-else-if="isVideo(file)" class="preview-video">
          <video :src="file" controls></video>
          <div class="preview-overlay">
            <a-button
              type="text"
              :icon="h(EyeOutlined)"
              @click="previewMedia(file)"
              class="preview-btn"
            />
            <a-button
              type="text"
              danger
              :icon="h(DeleteOutlined)"
              @click="removeFile(index)"
              class="delete-btn"
            />
          </div>
        </div>

        <!-- 其他文件 -->
        <div v-else class="preview-file">
          <FileOutlined class="file-icon" />
          <span class="file-name">{{ getFileName(file) }}</span>
          <a-button
            type="text"
            danger
            :icon="h(DeleteOutlined)"
            @click="removeFile(index)"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      :title="previewTitle"
      :width="800"
    >
      <img
        v-if="previewType === 'image'"
        :src="previewUrl"
        style="width: 100%"
        alt="Preview"
      />
      <video
        v-else-if="previewType === 'video'"
        :src="previewUrl"
        controls
        style="width: 100%"
      />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue';
import { message } from 'ant-design-vue';
import {
  UploadOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileOutlined
} from '@ant-design/icons-vue';
import { uploadAPI } from '@/utils/api';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxFiles: {
    type: Number,
    default: 5
  },
  maxSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  },
  accept: {
    type: String,
    default: 'image/*, video/*'
  },
  multiple: {
    type: Boolean,
    default: true
  },
  uploadText: {
    type: String,
    default: 'Upload Media'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  hideButton: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error']);

const fileInput = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const previewVisible = ref(false);
const previewUrl = ref('');
const previewType = ref('');
const previewTitle = ref('');

// 计算接受的文件类型
const acceptTypes = computed(() => props.accept);

// 上传图标
const uploadIcon = computed(() => {
  if (props.accept.includes('image') && !props.accept.includes('video')) {
    return h(PictureOutlined);
  } else if (props.accept.includes('video') && !props.accept.includes('image')) {
    return h(VideoCameraOutlined);
  }
  return h(UploadOutlined);
});

// 触发文件选择
const triggerFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files);

  if (!files || files.length === 0) {
    return;
  }

  // 检查文件数量
  if (props.maxFiles && props.modelValue.length + files.length > props.maxFiles) {
    message.error(`Maximum ${props.maxFiles} files allowed`);
    return;
  }

  // 验证文件
  const validFiles = [];
  for (const file of files) {
    // 检查文件大小
    if (file.size > props.maxSize) {
      message.error(`${file.name} is too large. Max size is ${props.maxSize / 1024 / 1024}MB`);
      continue;
    }

    // 检查文件类型
    const fileType = file.type;
    const acceptedTypes = props.accept.split(',').map(t => t.trim());
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return fileType === type;
    });

    if (!isAccepted) {
      message.error(`${file.name} is not an accepted file type`);
      continue;
    }

    validFiles.push(file);
  }

  if (validFiles.length === 0) {
    return;
  }

  // 上传文件
  await uploadFiles(validFiles);

  // 清空input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 上传文件
const uploadFiles = async (files) => {
  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const response = await uploadAPI.uploadFiles(files, (progressEvent) => {
      uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    });

    if (response.data.success && response.data.data) {
      const uploadedUrls = response.data.data.map(file => file.url);
      const newFiles = [...props.modelValue, ...uploadedUrls];

      emit('update:modelValue', newFiles);
      emit('upload-success', uploadedUrls);

      message.success(`${files.length} file(s) uploaded successfully`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    message.error(error.response?.data?.error?.message || 'Upload failed');
    emit('upload-error', error);
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

// 删除文件
const removeFile = async (index) => {
  const fileUrl = props.modelValue[index];

  try {
    // 从服务器删除文件
    await uploadAPI.deleteFile(fileUrl);

    // 从列表中移除
    const newFiles = [...props.modelValue];
    newFiles.splice(index, 1);
    emit('update:modelValue', newFiles);

    message.success('File removed');
  } catch (error) {
    console.error('Delete error:', error);
    // 即使删除失败，也从列表中移除
    const newFiles = [...props.modelValue];
    newFiles.splice(index, 1);
    emit('update:modelValue', newFiles);
  }
};

// 预览媒体
const previewMedia = (url) => {
  previewUrl.value = url;

  if (isImage(url)) {
    previewType.value = 'image';
    previewTitle.value = 'Image Preview';
  } else if (isVideo(url)) {
    previewType.value = 'video';
    previewTitle.value = 'Video Preview';
  }

  previewVisible.value = true;
};

// 判断是否是图片
const isImage = (url) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
};

// 判断是否是视频
const isVideo = (url) => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

// 获取文件名
const getFileName = (url) => {
  const parts = url.split('/');
  return parts[parts.length - 1];
};

// 暴露方法
defineExpose({
  triggerFileSelect,
  uploadFiles
});
</script>

<style scoped>
.media-uploader {
  width: 100%;
}

.hidden-input {
  display: none;
}

.upload-trigger {
  margin-bottom: 12px;
}

.upload-progress {
  margin: 12px 0;
}

.progress-text {
  display: block;
  margin-top: 8px;
  color: #666;
  font-size: 13px;
}

.media-preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.media-preview-item {
  position: relative;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1;
}

.preview-image,
.preview-video {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-image img,
.preview-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.media-preview-item:hover .preview-overlay {
  opacity: 1;
}

.preview-btn,
.delete-btn {
  color: white !important;
}

.preview-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.delete-btn:hover {
  background: rgba(255, 77, 79, 0.3) !important;
}

.preview-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  gap: 8px;
}

.file-icon {
  font-size: 32px;
  color: #1890ff;
}

.file-name {
  font-size: 12px;
  text-align: center;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
