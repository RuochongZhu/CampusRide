<template>
  <div class="h-screen flex bg-[#EDEEE8]">
    <!-- 左侧小组边栏 -->
    <GroupSidebar
      :my-groups="myGroups"
      :selected-group="selectedGroup"
      @select-group="handleSelectGroup"
      @create-group="showCreateModal = true"
    />

    <!-- 主内容区域 -->
    <div class="flex-grow relative flex flex-col">
      <!-- 顶部工具栏 -->
      <MapToolbar
        :is-visible="isVisible"
        :selected-group="selectedGroup"
        @toggle-visibility="toggleVisibility"
        @post-thought="showThoughtModal = true"
      />

      <!-- 地图区域 -->
      <div class="flex-grow relative">
        <MapCanvas
          :thoughts="mapThoughts"
          :users="visibleUsers"
          @marker-hover="handleMarkerHover"
          @marker-click="handleMarkerClick"
        />

        <!-- 悬停气泡 -->
        <ThoughtBubble
          v-if="hoveredThought"
          :thought="hoveredThought"
          :position="bubblePosition"
        />
      </div>
    </div>

    <!-- 右侧时间线 -->
    <ThoughtTimeline
      :thoughts="thoughts"
      :group-id="selectedGroup"
      @delete="handleDeleteThought"
    />

    <!-- 创建小组弹窗 -->
    <CreateGroupModal
      v-model:visible="showCreateModal"
      @success="handleGroupCreated"
    />

    <!-- 发布想法弹窗 -->
    <PostThoughtModal
      v-model:visible="showThoughtModal"
      :my-groups="myGroups"
      :default-group="selectedGroup"
      @success="handleThoughtPosted"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { groupAPI, thoughtAPI, visibilityAPI } from '@/utils/api'
import GroupSidebar from '@/components/groups/GroupSidebar.vue'
import MapToolbar from '@/components/groups/MapToolbar.vue'
import MapCanvas from '@/components/groups/MapCanvas.vue'
import ThoughtBubble from '@/components/groups/ThoughtBubble.vue'
import ThoughtTimeline from '@/components/groups/ThoughtTimeline.vue'
import CreateGroupModal from '@/components/groups/CreateGroupModal.vue'
import PostThoughtModal from '@/components/groups/PostThoughtModal.vue'

// 状态
const selectedGroup = ref(null)
const isVisible = ref(true)
const myGroups = ref([])
const thoughts = ref([])
const mapThoughts = ref([])
const visibleUsers = ref([])
const hoveredThought = ref(null)
const bubblePosition = ref({ x: 0, y: 0 })
const showCreateModal = ref(false)
const showThoughtModal = ref(false)

// 切换小组
const handleSelectGroup = (groupId) => {
  selectedGroup.value = groupId
  fetchMapThoughts()
  fetchThoughts()
  fetchVisibleUsers()
}

// 切换可见性
const toggleVisibility = async () => {
  try {
    // 获取当前位置
    let location = null
    if (!isVisible.value) {
      // 要变为可见，获取位置
      location = await getCurrentLocation()
    }

    const response = await visibilityAPI.updateVisibility({
      is_visible: !isVisible.value,
      current_location: location
    })

    if (response.data.success) {
      isVisible.value = !isVisible.value
      message.success(isVisible.value ? '您已出现在地图上' : '您已隐身')
      fetchVisibleUsers()
    }
  } catch (error) {
    message.error('切换可见性失败')
  }
}

// 获取当前位置
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      }
    )
  })
}

// 获取我的小组
const fetchMyGroups = async () => {
  try {
    const response = await groupAPI.getMyGroups()
    myGroups.value = response.data.data.groups || []
  } catch (error) {
    console.error('获取小组失败:', error)
  }
}

// 获取想法时间线
const fetchThoughts = async () => {
  try {
    const params = {}
    if (selectedGroup.value) {
      params.group_id = selectedGroup.value
    }
    const response = await thoughtAPI.getThoughts(params)
    thoughts.value = response.data.data.thoughts || []
  } catch (error) {
    console.error('获取想法失败:', error)
  }
}

// 获取地图想法
const fetchMapThoughts = async () => {
  try {
    const params = {}
    if (selectedGroup.value) {
      params.group_id = selectedGroup.value
    }
    const response = await thoughtAPI.getMapThoughts(params)
    mapThoughts.value = response.data.data.thoughts || []
  } catch (error) {
    console.error('获取地图想法失败:', error)
  }
}

// 获取可见用户
const fetchVisibleUsers = async () => {
  try {
    const params = {}
    if (selectedGroup.value) {
      params.group_id = selectedGroup.value
    }
    const response = await visibilityAPI.getMapUsers(params)
    visibleUsers.value = response.data.data.users || []
  } catch (error) {
    console.error('获取可见用户失败:', error)
  }
}

// 标记悬停
const handleMarkerHover = (thought, event) => {
  if (thought) {
    hoveredThought.value = thought
    bubblePosition.value = {
      x: event.clientX,
      y: event.clientY
    }
  } else {
    hoveredThought.value = null
  }
}

// 标记点击
const handleMarkerClick = (thought) => {
  // 可以打开详情弹窗或其他操作
  console.log('Clicked thought:', thought)
}

// 小组创建成功
const handleGroupCreated = () => {
  fetchMyGroups()
  message.success('小组创建成功！')
}

// 想法发布成功
const handleThoughtPosted = () => {
  fetchThoughts()
  fetchMapThoughts()
  message.success('想法发布成功！')
}

// 删除想法
const handleDeleteThought = async (thoughtId) => {
  try {
    const response = await thoughtAPI.deleteThought(thoughtId)
    if (response.data.success) {
      fetchThoughts()
      fetchMapThoughts()
      message.success('想法已删除')
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || '删除失败')
  }
}

// 初始化
onMounted(async () => {
  await fetchMyGroups()
  await fetchThoughts()
  await fetchMapThoughts()
  await fetchVisibleUsers()

  // 获取我的可见性状态
  try {
    const response = await visibilityAPI.getMyVisibility()
    isVisible.value = response.data.data.visibility.is_visible
  } catch (error) {
    console.error('获取可见性状态失败:', error)
  }
})
</script>
