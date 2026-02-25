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
          :activities="activityStore.nearbyActivities"
          :my-location="myLocation"
          :highlight-target="highlightTarget"
          @marker-hover="handleMarkerHover"
          @marker-click="handleMarkerClick"
        />

        <!-- 悬停气泡 -->
        <ThoughtBubble
          v-if="hoveredThought"
          :thought="hoveredThought"
          :position="bubblePosition"
        />

        <!-- Activity悬浮按钮 -->
        <ActivityFloatingButton
          :activity-count="nearbyActivityCount"
          @click="showActivityModal = true"
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
      v-model:open="showCreateModal"
      @success="handleGroupCreated"
    />

    <!-- 发布活动弹窗 -->
    <PostThoughtModal
      v-model:open="showThoughtModal"
      :my-groups="myGroups"
      :default-group="selectedGroup"
      @success="handleThoughtPosted"
    />

    <!-- Activity功能弹窗 -->
    <ActivityModal
      v-model:open="showActivityModal"
      :map-bounds="currentMapBounds"
      @activity-created="handleActivityCreated"
      @activity-updated="handleActivityUpdated"
      @activity-joined="handleActivityJoined"
      @activity-left="handleActivityLeft"
      @location-highlight="handleActivityLocationHighlight"
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
import ActivityFloatingButton from '@/components/activities/ActivityFloatingButton.vue'
import ActivityModal from '@/components/activities/ActivityModal.vue'
import { useActivityStore } from '@/stores/activity'

// 状态
const selectedGroup = ref(null)
const isVisible = ref(true)
const myGroups = ref([])
const thoughts = ref([])
const mapThoughts = ref([])
const visibleUsers = ref([])
const myLocation = ref(null)
const highlightTarget = ref(null)
const hoveredThought = ref(null)
const bubblePosition = ref({ x: 0, y: 0 })
const showCreateModal = ref(false)
const showThoughtModal = ref(false)

// Activity相关状态
const showActivityModal = ref(false)
const currentMapBounds = ref(null)

// Activity Store
const activityStore = useActivityStore()

// Activity相关computed
const nearbyActivityCount = computed(() => {
  return activityStore.nearbyActivities.length
})

const getActivityCoordinates = (activity) => {
  const raw = activity?.location_coordinates || activity?.locationCoordinates || activity?.coordinates
  if (!raw) return null

  const lat = Number(raw.lat)
  const lng = Number(raw.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng }
}

const setMapHighlightTarget = (activity, coordinates = null) => {
  const targetCoordinates = coordinates || getActivityCoordinates(activity)
  if (!targetCoordinates) return

  highlightTarget.value = {
    id: activity?.id || null,
    coordinates: targetCoordinates,
    title: activity?.title || '',
    ts: Date.now()
  }
}

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
      myLocation.value = isVisible.value ? response.data.data.visibility?.current_location || location : null
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
      x: event?.clientX ?? bubblePosition.value.x,
      y: event?.clientY ?? bubblePosition.value.y
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
const handleGroupCreated = (group) => {
  if (group?.id) {
    selectedGroup.value = group.id
  }
  fetchMyGroups()
  fetchThoughts()
  fetchMapThoughts()
  fetchVisibleUsers()
  message.success('小组创建成功！')
}

// 想法发布成功
const handleThoughtPosted = (activity) => {
  fetchThoughts()
  fetchMapThoughts()
  activityStore.fetchActivities()
  setMapHighlightTarget(activity)
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

// Activity事件处理
const handleActivityCreated = (activity) => {
  message.success('活动创建成功！')
  activityStore.fetchActivities()
  setMapHighlightTarget(activity)
}

const handleActivityUpdated = (activity) => {
  message.success('活动更新成功！')
  activityStore.fetchActivities()
  setMapHighlightTarget(activity)
}

const handleActivityJoined = (activity) => {
  message.success('成功加入活动！')
  activityStore.fetchActivities()
}

const handleActivityLeft = (activity) => {
  message.success('已退出活动！')
  activityStore.fetchActivities()
}

const handleActivityLocationHighlight = (coordinates) => {
  if (!coordinates) {
    highlightTarget.value = null
    return
  }

  const targetCoordinates = coordinates.coordinates || coordinates
  setMapHighlightTarget(coordinates.activity || null, targetCoordinates)
}

// 获取地图边界变化（需要在MapCanvas中触发）
const handleMapBoundsChanged = (bounds) => {
  currentMapBounds.value = bounds
  activityStore.updateMapBounds(bounds)
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
    myLocation.value = response.data.data.visibility.current_location || null
  } catch (error) {
    console.error('获取可见性状态失败:', error)
  }

  // 初始化Activity store
  try {
    await activityStore.fetchActivities()
    console.log('Activity store initialized')
  } catch (error) {
    console.error('初始化Activity失败:', error)
  }
})
</script>
