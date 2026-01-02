<template>
  <div class="image-uploader">
    <!-- Upload Area -->
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
        <plus-outlined />
        <div class="upload-text">Upload</div>
      </div>
    </a-upload>

    <!-- Upload Hint -->
    <div class="upload-hint text-sm text-gray-500 mt-2">
      <info-circle-outlined />
      <span class="ml-1">Max 6 images, 5MB each. First image will be the cover.</span>
    </div>

    <!-- Preview Modal -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      @cancel="previewVisible = false"
    >
      <img :src="previewImage" style="width: 100%" alt="Preview" />
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import { marketplaceAPI } from '@/utils/api';

const props = defineProps({
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  },
  initialImages: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:images', 'upload-complete']);

const fileList = ref(props.initialImages.map((url, index) => ({
  uid: `${index}`,
  name: `image-${index}`,
  status: 'done',
  url: url,
  thumbUrl: url
})));
const previewVisible = ref(false);
const previewImage = ref('');
const uploading = ref(false);

// Validate before upload
const beforeUpload = (file) => {
  // Check file type
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('You can only upload image files!');
    return false;
  }

  // Check file size
  const isLtMaxSize = file.size <= props.maxSize;
  if (!isLtMaxSize) {
    message.error(`Image must be smaller than ${props.maxSize / 1024 / 1024}MB!`);
    return false;
  }

  return true;
};

// Custom upload logic
const handleUpload = async ({ file, onSuccess, onError, onProgress }) => {
  try {
    uploading.value = true;

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('image', file);

    // Upload via API
    const response = await marketplaceAPI.uploadImage(formData, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress({ percent });
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Upload failed');
    }

    // Add to file list
    const uploadedFile = {
      uid: file.uid,
      name: file.name,
      status: 'done',
      url: response.data.data.url,
      thumbUrl: response.data.data.url
    };

    fileList.value.push(uploadedFile);

    // Emit updated images list
    emitImagesList();

    onSuccess(response.data);
    message.success('Image uploaded successfully');

  } catch (error) {
    console.error('Upload error:', error);
    message.error(error.message || 'Failed to upload image');
    onError(error);
  } finally {
    uploading.value = false;
  }
};

// Preview image
const handlePreview = (file) => {
  previewImage.value = file.url || file.preview || file.thumbUrl;
  previewVisible.value = true;
};

// Remove image
const handleRemove = (file) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid);
  if (index > -1) {
    fileList.value.splice(index, 1);
  }

  // Emit updated images list
  emitImagesList();

  message.success('Image removed');
};

// Emit images list to parent
const emitImagesList = () => {
  const images = fileList.value
    .filter(f => f.status === 'done' && f.url)
    .map((f, index) => ({
      url: f.url,
      isPrimary: index === 0
    }));

  emit('update:images', images);
};

// Watch for initial images changes
import { watch } from 'vue';
watch(() => props.initialImages, (newImages) => {
  if (newImages && newImages.length > 0) {
    fileList.value = newImages.map((url, index) => ({
      uid: `${index}`,
      name: `image-${index}`,
      status: 'done',
      url: url,
      thumbUrl: url
    }));
  }
}, { immediate: true });
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.upload-text {
  margin-top: 8px;
  color: #666;
}

.upload-hint {
  display: flex;
  align-items: center;
}

:deep(.ant-upload-select-picture-card) {
  width: 104px;
  height: 104px;
}

:deep(.ant-upload-list-picture-card-container) {
  width: 104px;
  height: 104px;
}
</style>
