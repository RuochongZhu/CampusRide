<template>
  <div
    v-if="thought"
    class="fixed z-50 bg-white rounded-2xl shadow-xl border border-[#f3d6d3] p-4 max-w-xs pointer-events-none chat-bubble"
    :style="{
      left: position.x + 10 + 'px',
      top: position.y + 10 + 'px',
      transform: 'translate(0, -50%)'
    }"
  >
    <div class="flex items-start space-x-3">
      <a-avatar :src="thought.user?.avatar_url" size="small">
        {{ thought.user?.first_name?.[0] || '?' }}
      </a-avatar>
      <div class="flex-grow">
        <div class="font-medium text-sm text-gray-800">
          {{ thought.user?.first_name }} {{ thought.user?.last_name }}
        </div>
        <div class="text-gray-600 text-sm mt-1 leading-relaxed">
          {{ thought.content }}
        </div>
        <div class="text-xs text-gray-400 mt-2 flex items-center">
          <ClockCircleOutlined class="mr-1" />
          {{ formatTime(thought.created_at) }}
        </div>
      </div>
    </div>
    <!-- 小三角 -->
    <div
      class="absolute w-3 h-3 bg-white transform rotate-45 -left-1.5"
      style="top: 50%; margin-top: -6px;"
    ></div>
  </div>
</template>

<script setup>
import { ClockCircleOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

defineProps({
  thought: {
    type: Object,
    default: null
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

const formatTime = (time) => {
  return dayjs(time).fromNow()
}
</script>


<style scoped>
.chat-bubble {
  animation: bubbleIn 0.16s ease-out;
}

@keyframes bubbleIn {
  from {
    opacity: 0;
    transform: translate(-6px, -50%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(0, -50%) scale(1);
  }
}
</style>
