<template>
  <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
    <!-- 临时地图占位背景 -->
    <div class="absolute inset-0 flex items-center justify-center text-gray-300">
      <div class="text-center">
        <EnvironmentOutlined style="font-size: 64px;" class="mb-4" />
        <p class="text-lg font-medium">地图区域</p>
        <p class="text-sm mt-2">等待 Google Maps API 集成</p>
        <p class="text-xs mt-1 text-gray-400">当前显示模拟位置点</p>
      </div>
    </div>

    <!-- 网格背景 -->
    <svg class="absolute inset-0 w-full h-full opacity-20">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>

    <!-- 想法标记点 -->
    <div
      v-for="thought in thoughts"
      :key="thought.id"
      class="absolute w-10 h-10 bg-[#C24D45] rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform shadow-lg flex items-center justify-center"
      :style="getMarkerPosition(thought.location)"
      @mouseenter="$emit('marker-hover', thought, $event)"
      @mouseleave="$emit('marker-hover', null)"
      @click="$emit('marker-click', thought)"
    >
      <MessageOutlined class="text-white text-lg" />
      <!-- 脉冲动画 -->
      <div class="absolute inset-0 rounded-full bg-[#C24D45] animate-ping opacity-75"></div>
    </div>

    <!-- 用户位置标记 -->
    <div
      v-for="user in users"
      :key="user.user_id"
      class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      :style="getMarkerPosition(user.location)"
    >
      <div class="relative">
        <a-avatar
          :src="user.avatar"
          :size="user.has_thought ? 50 : 40"
          class="ring-2 ring-white shadow-lg"
        >
          {{ user.name?.[0] || '?' }}
        </a-avatar>
        <!-- 有想法的标记 -->
        <div
          v-if="user.has_thought"
          class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
        ></div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
      <div class="text-xs font-semibold text-gray-600 mb-2">图例</div>
      <div class="space-y-1">
        <div class="flex items-center text-xs text-gray-600">
          <div class="w-3 h-3 bg-[#C24D45] rounded-full mr-2"></div>
          <span>想法位置</span>
        </div>
        <div class="flex items-center text-xs text-gray-600">
          <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span>用户位置</span>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
      <div class="text-xs text-gray-500 mb-1">统计</div>
      <div class="flex items-center space-x-4">
        <div class="text-center">
          <div class="text-lg font-bold text-[#C24D45]">{{ thoughts.length }}</div>
          <div class="text-xs text-gray-500">想法</div>
        </div>
        <div class="w-px h-8 bg-gray-300"></div>
        <div class="text-center">
          <div class="text-lg font-bold text-blue-500">{{ users.length }}</div>
          <div class="text-xs text-gray-500">用户</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { EnvironmentOutlined, MessageOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  thoughts: {
    type: Array,
    default: () => []
  },
  users: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['marker-hover', 'marker-click'])

// 临时坐标转换函数（地理坐标 -> 屏幕坐标）
// 这是一个简化版本，真实地图API会提供精确的投影转换
const getMarkerPosition = (location) => {
  if (!location || !location.lat || !location.lng) {
    return { left: '50%', top: '50%' }
  }

  // 使用简单的线性映射
  // 经度 -180 到 180 映射到 0% 到 100%
  // 纬度 90 到 -90 映射到 0% 到 100%
  const xPercent = ((location.lng + 180) / 360) * 100
  const yPercent = ((90 - location.lat) / 180) * 100

  return {
    left: `${xPercent}%`,
    top: `${yPercent}%`
  }
}
</script>

<style scoped>
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
