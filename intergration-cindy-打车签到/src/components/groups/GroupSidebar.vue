<template>
  <div class="w-64 bg-white border-r h-full overflow-y-auto flex-shrink-0">
    <div class="p-4">
      <h2 class="text-lg font-bold mb-4 text-gray-800">🗺️ 地图社交</h2>

      <!-- 全局选项 -->
      <div
        class="p-3 rounded-lg cursor-pointer mb-2 transition-colors"
        :class="!selectedGroup ? 'bg-[#C24D45] text-white' : 'hover:bg-gray-100'"
        @click="$emit('select-group', null)"
      >
        <div class="flex items-center">
          <GlobalOutlined class="mr-2 text-lg" />
          <span class="font-medium">全局地图</span>
        </div>
        <div class="text-xs mt-1 opacity-75">查看所有想法</div>
      </div>

      <div class="my-4 border-t border-gray-200"></div>

      <!-- 我的小组标题 -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-600">我的小组</h3>
        <span class="text-xs text-gray-400">{{ myGroups.length }}</span>
      </div>

      <!-- 小组列表 -->
      <div v-if="myGroups.length > 0" class="space-y-2">
        <div
          v-for="group in myGroups"
          :key="group.id"
          class="p-3 rounded-lg cursor-pointer transition-colors"
          :class="selectedGroup === group.id ? 'bg-[#C24D45] text-white' : 'hover:bg-gray-100'"
          @click="$emit('select-group', group.id)"
        >
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
              :class="selectedGroup === group.id ? 'bg-white/20' : 'bg-[#C24D45]/10'"
            >
              <TeamOutlined
                class="text-lg"
                :class="selectedGroup === group.id ? 'text-white' : 'text-[#C24D45]'"
              />
            </div>
            <div class="flex-grow min-w-0">
              <div class="font-medium truncate">{{ group.name }}</div>
              <div class="text-xs opacity-75 flex items-center">
                <UserOutlined class="mr-1" style="font-size: 10px;" />
                {{ group.member_count }} 成员
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-6 text-gray-400">
        <TeamOutlined class="text-3xl mb-2" />
        <p class="text-sm">还没有加入小组</p>
      </div>

      <!-- 创建小组按钮 -->
      <a-button
        type="dashed"
        block
        class="mt-4"
        @click="$emit('create-group')"
      >
        <template #icon><PlusOutlined /></template>
        创建小组
      </a-button>

      <!-- 浏览小组按钮 -->
      <a-button
        block
        class="mt-2"
        @click="showBrowseModal = true"
      >
        <template #icon><SearchOutlined /></template>
        浏览小组
      </a-button>
    </div>

    <!-- 浏览小组弹窗 -->
    <a-modal
      v-model:visible="showBrowseModal"
      title="浏览小组"
      :footer="null"
      width="600px"
    >
      <div class="space-y-2">
        <a-input-search
          v-model:value="searchQuery"
          placeholder="搜索小组..."
          @search="handleSearch"
        />

        <div v-if="loading" class="text-center py-8">
          <a-spin />
        </div>

        <div v-else-if="allGroups.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="group in allGroups"
            :key="group.id"
            class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <div class="flex items-center justify-between">
              <div class="flex-grow">
                <div class="font-medium">{{ group.name }}</div>
                <div class="text-sm text-gray-500 line-clamp-1">
                  {{ group.description || '暂无描述' }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ group.member_count }} 成员
                </div>
              </div>
              <a-button
                v-if="!isInGroup(group.id)"
                type="primary"
                size="small"
                @click="handleJoinGroup(group.id)"
              >
                加入
              </a-button>
              <a-tag v-else color="green">已加入</a-tag>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-400">
          暂无小组
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  GlobalOutlined,
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons-vue'
import { groupAPI } from '@/utils/api'

const props = defineProps({
  myGroups: {
    type: Array,
    default: () => []
  },
  selectedGroup: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select-group', 'create-group'])

const showBrowseModal = ref(false)
const searchQuery = ref('')
const allGroups = ref([])
const loading = ref(false)

// 检查是否已加入小组
const isInGroup = (groupId) => {
  return props.myGroups.some(g => g.id === groupId)
}

// 搜索小组
const handleSearch = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    const response = await groupAPI.getGroups(params)
    allGroups.value = response.data.data.groups || []
  } catch (error) {
    message.error('搜索失败')
  } finally {
    loading.value = false
  }
}

// 加入小组
const handleJoinGroup = async (groupId) => {
  try {
    const response = await groupAPI.joinGroup(groupId)
    if (response.data.success) {
      message.success('加入成功！')
      showBrowseModal.value = false
      emit('select-group', null) // 触发刷新
      window.location.reload() // 简单粗暴的刷新
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || '加入失败')
  }
}

// 打开浏览弹窗时加载小组
const handleOpenBrowse = () => {
  showBrowseModal.value = true
  handleSearch()
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.ant-btn-primary) {
  background-color: #C24D45;
  border-color: #C24D45;
}

:deep(.ant-btn-primary:hover) {
  background-color: #A93E37;
  border-color: #A93E37;
}
</style>
