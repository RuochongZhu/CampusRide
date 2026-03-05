<template>
  <div class="h-16 bg-white/95 backdrop-blur border-b px-6 flex items-center justify-between flex-shrink-0">
    <!-- 当前视图标题 -->
    <div class="flex items-center space-x-3">
      <h1 class="text-xl font-bold text-gray-800">
        {{ selectedGroup ? '小组地图' : '全局地图' }}
      </h1>
      <a-tag v-if="selectedGroup" color="#C24D45">小组模式</a-tag>
    </div>

    <!-- 操作按钮组 -->
    <div class="flex items-center space-x-3">
      <!-- 可见性切换 -->
      <a-tooltip :title="isVisible ? '点击隐身' : '点击出现在地图'">
        <a-button
          :type="isVisible ? 'primary' : 'default'"
          @click="$emit('toggle-visibility')"
        >
          <template #icon>
            <EyeOutlined v-if="isVisible" />
            <EyeInvisibleOutlined v-else />
          </template>
          {{ isVisible ? '已出现' : '已隐身' }}
        </a-button>
      </a-tooltip>

      <!-- 发布活动 -->
      <a-button
        type="primary"
        @click="$emit('post-thought')"
      >
        <template #icon><EditOutlined /></template>
        发布活动
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { EyeOutlined, EyeInvisibleOutlined, EditOutlined } from '@ant-design/icons-vue'

defineProps({
  isVisible: {
    type: Boolean,
    default: true
  },
  selectedGroup: {
    type: String,
    default: null
  }
})

defineEmits(['toggle-visibility', 'post-thought'])
</script>

<style scoped>
:deep(.ant-btn-primary) {
  background-color: #C24D45;
  border-color: #C24D45;
}

:deep(.ant-btn-primary:hover) {
  background-color: #A93E37;
  border-color: #A93E37;
}
</style>
