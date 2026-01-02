<template>
  <a-modal
    v-model:open="visible"
    title="Post Comment"
    width="600px"
    :footer="null"
    :maskClosable="false"
    @cancel="handleCancel"
  >
    <div class="space-y-6">
      <!-- Activity Info -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-[#C24D45] rounded-full flex items-center justify-center text-white font-bold text-lg">
            {{ getActivityInitial() }}
          </div>
          <div>
            <div class="font-semibold text-lg">{{ activity?.title || 'Activity' }}</div>
            <div class="text-gray-600">Share your thoughts and comments</div>
          </div>
        </div>
      </div>

      <!-- Comment Form -->
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        @finish="handleSubmit"
      >
        <a-form-item label="Comment Content" name="content">
          <a-textarea
            v-model:value="formData.content"
            placeholder="Share your thoughts about this activity..."
            :rows="4"
            size="large"
            :maxlength="500"
            show-count
          />
        </a-form-item>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <a-button size="large" @click="handleCancel">
            Cancel
          </a-button>
          <a-button
            type="primary"
            size="large"
            html-type="submit"
            :loading="isSubmitting"
            class="bg-[#C24D45] hover:bg-[#A93C35] border-[#C24D45]"
          >
            <SendOutlined class="mr-2" />
            Post Comment
          </a-button>
        </div>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import { activitiesAPI } from '@/utils/api'
import { SendOutlined } from '@ant-design/icons-vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  activity: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:visible', 'success'])

// Reactive data
const formRef = ref()
const isSubmitting = ref(false)

const formData = reactive({
  content: ''
})

// Form validation rules
const formRules = {
  content: [
    { required: true, message: '请输入评论内容', trigger: 'blur' },
    { min: 5, max: 500, message: '评论内容应为5-500个字符', trigger: 'blur' }
  ]
}

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const handleSubmit = async () => {
  try {
    isSubmitting.value = true

    // Validate form
    await formRef.value.validate()

    // Prepare comment data
    const commentData = {
      content: formData.content,
      activity_id: props.activity.id
    }

    // Submit comment via API (we'll create this endpoint)
    const response = await activitiesAPI.addComment(props.activity.id, commentData)

    if (response.data?.success) {
      message.success('Comment posted successfully!')
      emit('success', response.data.data)
      resetForm()
      visible.value = false
    }
  } catch (error) {
    console.error('Failed to submit comment:', error)

    if (error.response?.data?.error?.message) {
      message.error(error.response.data.error.message)
    } else {
      message.error('Failed to post comment, please try again')
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  resetForm()
  visible.value = false
}

const resetForm = () => {
  formData.content = ''
  formRef.value?.resetFields()
}

const getActivityInitial = () => {
  return props.activity?.title?.charAt(0)?.toUpperCase() || 'A'
}
</script>

<style scoped>
.ant-form-item-label > label {
  font-weight: 600;
  color: #333333;
}

.ant-input,
.ant-textarea {
  border-radius: 8px;
}

.ant-btn {
  border-radius: 8px;
}
</style>