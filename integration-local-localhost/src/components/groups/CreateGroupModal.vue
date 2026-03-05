<template>
  <a-modal
    :open="open"
    title="Create Group"
    @ok="handleCreate"
    @cancel="handleCancel"
    :confirmLoading="creating"
    :okButtonProps="{
      style: { backgroundColor: '#C24D45', borderColor: '#C24D45' },
      disabled: !canSubmit
    }"
    :cancelButtonProps="{ disabled: creating || uploadingCover }"
    width="500px"
  >
    <a-form
      :model="formData"
      layout="vertical"
      class="mt-4"
    >
      <a-form-item label="Group Name" required>
        <a-input
          v-model:value="formData.name"
          placeholder="Enter group name"
          :maxlength="100"
        />
      </a-form-item>

      <a-form-item label="Group Description">
        <a-textarea
          v-model:value="formData.description"
          placeholder="Describe the purpose and features of this group..."
          :rows="4"
          :maxlength="1000"
          show-count
        />
      </a-form-item>

      <a-form-item label="Cover Image">
        <input
          ref="coverInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="handleCoverFileChange"
        />

        <div class="flex flex-col sm:flex-row gap-2">
          <a-button
            @click="triggerCoverSelect"
            :loading="uploadingCover"
            :disabled="creating"
            class="sm:flex-shrink-0"
          >
            <UploadOutlined />
            <span class="ml-1">{{ formData.cover_image ? 'Replace Image' : 'Upload Image' }}</span>
          </a-button>

          <a-input
            v-model:value="formData.cover_image"
            placeholder="Or paste image URL (optional)"
            @change="imageError = false"
          />
        </div>

        <p class="text-xs text-gray-500 mt-2">Supports JPG/PNG/WebP, up to 5MB.</p>

        <div v-if="formData.cover_image" class="mt-2">
          <div class="w-full h-32 rounded border overflow-hidden bg-gray-50">
            <img
              v-if="!imageError"
              :src="formData.cover_image"
              class="w-full h-full object-cover"
              @error="imageError = true"
              @load="imageError = false"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-400 px-4 text-center">
              Image preview is unavailable for this URL
            </div>
          </div>

          <div class="mt-2 flex items-center justify-between">
            <span class="text-xs text-gray-500">
              {{ uploadingCover ? 'Uploading image...' : 'Cover image ready' }}
            </span>
            <a-button type="link" danger size="small" class="!px-0" @click="clearCoverImage">
              Remove
            </a-button>
          </div>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { groupAPI, marketplaceAPI } from '@/utils/api'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'success'])

const creating = ref(false)
const uploadingCover = ref(false)
const imageError = ref(false)
const coverInputRef = ref(null)
const formData = ref({
  name: '',
  description: '',
  cover_image: ''
})

const canSubmit = computed(() => {
  return formData.value.name.trim().length > 0 && !uploadingCover.value
})

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    cover_image: ''
  }
  imageError.value = false
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

const triggerCoverSelect = () => {
  coverInputRef.value?.click()
}

const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

const handleCoverFileChange = async (event) => {
  const file = event.target?.files?.[0]
  if (!file) return

  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!acceptedTypes.includes(file.type)) {
    message.error('Only JPG, PNG and WebP images are supported')
    event.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    message.error('Image must be smaller than 5MB')
    event.target.value = ''
    return
  }

  uploadingCover.value = true
  imageError.value = false

  try {
    const base64Image = await readFileAsBase64(file)
    const response = await marketplaceAPI.uploadImage({
      image: base64Image,
      filename: file.name
    })

    if (!response.data?.success || !response.data?.data?.url) {
      throw new Error('Upload failed')
    }

    formData.value.cover_image = response.data.data.url
    message.success('Cover image uploaded')
  } catch (error) {
    console.error('Cover upload failed:', error)
    message.error(error.response?.data?.error?.message || error.message || 'Failed to upload image')
  } finally {
    uploadingCover.value = false
    event.target.value = ''
  }
}

const clearCoverImage = () => {
  formData.value.cover_image = ''
  imageError.value = false
}

const handleCancel = () => {
  if (creating.value || uploadingCover.value) return
  emit('update:open', false)
}

const handleCreate = async () => {
  if (!canSubmit.value) {
    message.error('Please enter group name')
    return
  }

  const payload = {
    name: formData.value.name.trim(),
    description: formData.value.description?.trim() || '',
    cover_image: formData.value.cover_image?.trim() || ''
  }

  creating.value = true
  try {
    const response = await groupAPI.createGroup(payload)
    if (response.data.success) {
      emit('success', response.data.data.group)
      emit('update:open', false)
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || 'Creation failed')
  } finally {
    creating.value = false
  }
}
</script>
