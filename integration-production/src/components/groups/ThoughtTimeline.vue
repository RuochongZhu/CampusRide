<template>
  <div class="w-80 bg-white border-l h-full overflow-y-auto flex-shrink-0">
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-gray-800">💭 想法动态</h3>
        <a-tag :color="groupId ? '#C24D45' : 'blue'">
          {{ groupId ? '小组' : '全局' }}
        </a-tag>
      </div>

      <!-- 想法列表 -->
      <div v-if="thoughts.length > 0" class="space-y-3">
        <div
          v-for="thought in thoughts"
          :key="thought.id"
          class="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <div class="flex items-start space-x-2">
            <a-avatar :src="thought.user?.avatar_url" size="small">
              {{ thought.user?.first_name?.[0] || '?' }}
            </a-avatar>
            <div class="flex-grow min-w-0">
              <div class="flex items-center justify-between">
                <div class="font-medium text-sm text-gray-800 truncate">
                  {{ getDisplayName(thought.user) }}
                </div>
                <a-dropdown v-if="isMyThought(thought)" :trigger="['click']">
                  <a-button type="text" size="small">
                    <template #icon><MoreOutlined /></template>
                  </a-button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="handleDelete(thought.id)">
                        <DeleteOutlined class="mr-2" />
                        删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>

              <div class="text-gray-600 text-sm mt-1 leading-relaxed">
                {{ thought.content }}
              </div>

              <div class="flex items-center justify-between mt-2">
                <div class="text-xs text-gray-400 flex items-center">
                  <EnvironmentOutlined class="mr-1" />
                  {{ getLocationText(thought.location) }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ formatTime(thought.created_at) }}
                </div>
              </div>

              <!-- 小组标签 -->
              <div v-if="thought.group" class="mt-2">
                <a-tag size="small" color="purple">
                  <TeamOutlined class="mr-1" />
                  {{ thought.group.name }}
                </a-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-12 text-gray-400">
        <MessageOutlined class="text-4xl mb-3" />
        <p class="text-sm">暂无想法</p>
        <p class="text-xs mt-1">点击"发布活动"分享你的想法</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  EnvironmentOutlined,
  MessageOutlined,
  TeamOutlined,
  MoreOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { getPublicUserName } from '@/utils/publicName'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps({
  thoughts: {
    type: Array,
    default: () => []
  },
  groupId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['delete'])

// 判断是否是我的想法
const isMyThought = (thought) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return thought.user_id === user.id
}

// 删除想法
const handleDelete = (thoughtId) => {
  emit('delete', thoughtId)
}

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).fromNow()
}

// 获取位置文本
const getLocationText = (location) => {
  if (!location) return '未知位置'
  if (location.address) return location.address
  return `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`
}

const getDisplayName = (user) => getPublicUserName(user, 'User')
</script>
