<template>
  <a-modal
    :open="visible"
    title="Create Group"
    @ok="handleCreate"
    @cancel="handleCancel"
    :confirmLoading="creating"
    :okButtonProps="{ style: { backgroundColor: '#C24D45', borderColor: '#C24D45' } }"
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
        <a-input
          v-model:value="formData.cover_image"
          placeholder="Image URL (optional)"
        />
        <div v-if="formData.cover_image" class="mt-2">
          <img
            :src="formData.cover_image"
            class="w-full h-32 object-cover rounded"
            @error="imageError = true"
          />
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { groupAPI } from '@/utils/api'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'success'])

const creating = ref(false)
const imageError = ref(false)
const formData = ref({
  name: '',
  description: '',
  cover_image: ''
})

// Watch visible property changes, reset form
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value = {
      name: '',
      description: '',
      cover_image: ''
    }
    imageError.value = false
  }
})

// Close modal
const handleCancel = () => {
  emit('update:visible', false)
}

// Create group
const handleCreate = async () => {
  // Validation
  if (!formData.value.name || formData.value.name.trim().length === 0) {
    message.error('Please enter group name')
    return
  }

  creating.value = true
  try {
    const response = await groupAPI.createGroup(formData.value)
    if (response.data.success) {
      message.success('Group created successfully!')
      emit('success', response.data.data.group)
      emit('update:visible', false)
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || 'Creation failed')
  } finally {
    creating.value = false
  }
}
</script>
