<template>
  <a-modal
    :visible="visible"
    title="创建小组"
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
      <a-form-item label="小组名称" required>
        <a-input
          v-model:value="formData.name"
          placeholder="请输入小组名称"
          :maxlength="100"
        />
      </a-form-item>

      <a-form-item label="小组描述">
        <a-textarea
          v-model:value="formData.description"
          placeholder="介绍一下这个小组的目的和特色..."
          :rows="4"
          :maxlength="1000"
          show-count
        />
      </a-form-item>

      <a-form-item label="封面图片">
        <a-input
          v-model:value="formData.cover_image"
          placeholder="图片 URL（可选）"
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

// 监听visible变化，重置表单
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

// 关闭弹窗
const handleCancel = () => {
  emit('update:visible', false)
}

// 创建小组
const handleCreate = async () => {
  // 验证
  if (!formData.value.name || formData.value.name.trim().length === 0) {
    message.error('请输入小组名称')
    return
  }

  creating.value = true
  try {
    const response = await groupAPI.createGroup(formData.value)
    if (response.data.success) {
      message.success('小组创建成功！')
      emit('success', response.data.data.group)
      emit('update:visible', false)
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || '创建失败')
  } finally {
    creating.value = false
  }
}
</script>
