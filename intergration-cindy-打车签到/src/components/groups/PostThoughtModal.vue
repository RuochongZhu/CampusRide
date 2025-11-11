<template>
  <a-modal
    :visible="visible"
    title="发布想法"
    @ok="handlePost"
    @cancel="handleCancel"
    :confirmLoading="posting"
    :okButtonProps="{ style: { backgroundColor: '#C24D45', borderColor: '#C24D45' } }"
    width="600px"
  >
    <a-form
      :model="formData"
      layout="vertical"
      class="mt-4"
    >
      <a-form-item label="想法内容" required>
        <a-textarea
          v-model:value="formData.content"
          placeholder="分享你的想法..."
          :rows="5"
          :maxlength="500"
          show-count
        />
      </a-form-item>

      <a-form-item label="发布到">
        <a-select
          v-model:value="formData.group_id"
          placeholder="选择小组（或全局）"
        >
          <a-select-option :value="null">
            <GlobalOutlined class="mr-2" />
            全局（所有人可见）
          </a-select-option>
          <a-select-option
            v-for="group in myGroups"
            :key="group.id"
            :value="group.id"
          >
            <TeamOutlined class="mr-2" />
            {{ group.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="位置" required>
        <a-button
          @click="getLocation"
          :loading="gettingLocation"
          block
        >
          <template #icon><EnvironmentOutlined /></template>
          {{ formData.location ? '位置已获取 ✓' : '获取当前位置' }}
        </a-button>

        <div v-if="formData.location" class="mt-3 p-3 bg-gray-50 rounded">
          <div class="text-sm text-gray-600">
            <div class="flex items-start">
              <EnvironmentOutlined class="mr-2 mt-1 text-[#C24D45]" />
              <div>
                <div class="font-medium">位置信息</div>
                <div class="text-xs mt-1">
                  {{ formData.location.address || `经纬度: ${formData.location.lat?.toFixed(4)}, ${formData.location.lng?.toFixed(4)}` }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  GlobalOutlined,
  TeamOutlined,
  EnvironmentOutlined
} from '@ant-design/icons-vue'
import { thoughtAPI } from '@/utils/api'
import { getCurrentLocation } from '@/utils/geocoding'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  myGroups: {
    type: Array,
    default: () => []
  },
  defaultGroup: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'success'])

const posting = ref(false)
const gettingLocation = ref(false)
const formData = ref({
  content: '',
  group_id: null,
  location: null
})

// 监听visible变化，重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value = {
      content: '',
      group_id: props.defaultGroup || null,
      location: null
    }
  }
})

// 获取当前位置
const getLocation = async () => {
  gettingLocation.value = true
  try {
    const location = await getCurrentLocation()
    formData.value.location = location
    message.success('位置获取成功')
  } catch (error) {
    message.error(error.message || '获取位置失败')
  } finally {
    gettingLocation.value = false
  }
}

// 关闭弹窗
const handleCancel = () => {
  emit('update:visible', false)
}

// 发布想法
const handlePost = async () => {
  // 验证
  if (!formData.value.content || formData.value.content.trim().length === 0) {
    message.error('请输入想法内容')
    return
  }

  if (!formData.value.location) {
    message.error('请获取位置')
    return
  }

  posting.value = true
  try {
    const response = await thoughtAPI.postThought(formData.value)
    if (response.data.success) {
      message.success('想法发布成功！')
      emit('success', response.data.data.thought)
      emit('update:visible', false)
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || '发布失败')
  } finally {
    posting.value = false
  }
}
</script>
