<template>
  <div class="min-h-screen bg-[#EDEEE8] main-content pt-16">
    <div class="pt-8 pb-16 max-w-7xl mx-auto px-4">
      
      <!-- Groups Grid -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-[#333333]">Campus Groups</h2>
          <div class="flex space-x-3">
            <a-button
              type="default"
              class="!rounded-button"
              @click="showCreateGroupModal = true"
            >
              <PlusOutlined /> 创建小组
            </a-button>
            <a-button
              type="primary"
              class="!rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35]"
              @click="showPostThoughtModal = true"
            >
              <EditOutlined /> 发布想法
            </a-button>
            <a-button
              :type="isVisible ? 'default' : 'dashed'"
              class="!rounded-button"
              @click="toggleVisibility"
            >
              <EyeOutlined v-if="isVisible" />
              <EyeInvisibleOutlined v-else />
              {{ isVisible ? '出现' : '隐身' }}
            </a-button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="group in myGroups"
            :key="group.id"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all cursor-pointer"
            :class="selectedGroupId === group.id ? 'ring-2 ring-[#C24D45]' : ''"
            @click="enterGroup(group)"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-[#333333]">{{ group.name }}</h3>
            </div>
            <p class="text-sm text-[#666666] mb-4 line-clamp-2">{{ group.description || '暂无描述' }}</p>
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center space-x-4">
                <div class="flex items-center text-gray-500">
                  <TeamOutlined class="mr-1" />
                  <span>{{ group.member_count || 0 }} 成员</span>
                </div>
              </div>
              <a-button
                v-if="group.my_role === 'creator'"
                type="default"
                danger
                size="small"
                class="!rounded-button whitespace-nowrap"
                @click.stop="deleteGroupHandler(group.id)"
              >
                删除小组
              </a-button>
              <a-button
                v-else
                type="default"
                danger
                size="small"
                class="!rounded-button whitespace-nowrap"
                @click.stop="leaveGroupHandler(group.id)"
              >
                退出小组
              </a-button>
            </div>
          </div>
        </div>
        <div v-if="myGroups.length === 0" class="text-center py-12 text-gray-400">
          <TeamOutlined class="text-5xl mb-4" />
          <p>你还没有加入任何小组</p>
          <a-button
            type="primary"
            class="mt-4 !rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35]"
            @click="showBrowseGroupsModal = true"
          >
            浏览小组
          </a-button>
        </div>
      </div>

      <!-- Activity Feed Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div class="mb-4 md:mb-0">
                <a-radio-group v-model:value="feedFilter" button-style="solid">
                  <a-radio-button value="all">All Activities</a-radio-button>
                  <a-radio-button value="groups">My Groups</a-radio-button>
                  <a-radio-button value="urgent">Urgent Needs</a-radio-button>
                </a-radio-group>
              </div>
              <div class="flex items-center space-x-4">
                <div class="flex items-center">
                  <span class="text-sm text-[#666666] mr-2">Distance:</span>
                  <a-slider v-model:value="distanceFilter" :min="500" :max="5000" :step="500" class="w-32" />
                  <span class="text-sm text-[#666666] ml-2">{{ distanceFilter / 1000 }}km</span>
                </div>
                <a-select v-model:value="sortOption" class="w-32">
                  <a-select-option value="newest">Newest</a-select-option>
                  <a-select-option value="closest">Closest</a-select-option>
                </a-select>
              </div>
            </div>

            <!-- Activity Cards -->
            <div class="space-y-6">
              <div 
                v-for="activity in filteredActivities" 
                :key="activity.id"
                class="bg-[#FAFAFA] rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                @mouseenter="highlightRadarDot(activity.id)"
                @mouseleave="resetRadarDot()"
              >
                <div class="flex justify-between items-start">
                  <div class="flex space-x-3">
                    <img :src="activity.user.avatar" class="w-10 h-10 rounded-full" />
                    <div>
                      <div class="flex items-center space-x-2">
                        <h3 class="font-medium text-[#333333]">{{ activity.title }}</h3>
                        <a-tag :color="activity.category.color">{{ activity.category.name }}</a-tag>
                      </div>
                      <div class="flex items-center text-sm text-[#666666] space-x-2">
                        <span>{{ activity.user.name }}</span>
                        <span>•</span>
                        <span>{{ activity.group }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-sm text-[#666666]">{{ activity.timeAgo }}</div>
                </div>
                
                <p class="text-[#333333] my-3">{{ activity.description }}</p>
                
                <div class="flex flex-wrap gap-2 mb-3">
                  <a-tag v-for="tag in activity.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                </div>
                
                <div class="flex items-center justify-between text-sm text-[#666666]">
                  <div class="flex items-center space-x-4">
                    <div class="flex items-center">
                      <EnvironmentOutlined class="mr-1" />
                      <span>{{ activity.location }} ({{ activity.distance }})</span>
                    </div>
                    <div class="flex items-center">
                      <ClockCircleOutlined class="mr-1" />
                      <span>Expires in {{ activity.expiresIn }}</span>
                    </div>
                    <div class="flex items-center">
                      <TeamOutlined class="mr-1" />
                      <span>{{ activity.participants }} participating</span>
                    </div>
                  </div>
                  <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        class="bg-green-500 h-1.5 rounded-full" 
                        :style="{ width: activity.successRate + '%' }"
                      ></div>
                    </div>
                    <span class="ml-1">{{ activity.successRate }}%</span>
                  </div>
                </div>
                
                <div class="flex justify-end space-x-2 mt-4">
                  <a-button 
                    class="!rounded-button whitespace-nowrap"
                    @click="sendMessage(activity)"
                  >
                    <MessageOutlined /> Message
                  </a-button>
                  <a-button 
                    class="!rounded-button whitespace-nowrap"
                    @click="shareActivity(activity)"
                  >
                    <ShareAltOutlined /> Share
                  </a-button>
                  <a-button 
                    type="primary"
                    class="!rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35] whitespace-nowrap"
                    @click="joinActivity(activity)"
                  >
                    <LikeOutlined /> Interested
                  </a-button>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div class="mt-6 flex justify-center">
              <a-pagination v-model:current="currentPage" :total="totalPages" />
            </div>
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="space-y-6">
          <!-- Nearby Radar Widget -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-medium text-[#333333]">Nearby Radar</h2>
              <a-button
                type="link"
                class="text-[#C24D45]"
                @click="toggleMapExpand"
              >
                {{ isMapExpanded ? 'Collapse' : 'Expand' }}
              </a-button>
            </div>

            <!-- Google Maps Container -->
            <div id="small-map" class="relative bg-[#F5F5F5] rounded-lg overflow-hidden mb-4 h-64"></div>

            <!-- Radar Legend -->
            <div class="flex justify-between text-sm text-[#666666]">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span>想法位置</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span>可见用户</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span>我的位置</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expanded Map Modal -->
      <a-modal
        v-model:visible="isMapExpanded"
        title="Nearby Radar - Expanded View"
        :footer="null"
        width="90%"
        :style="{ top: '20px' }"
        class="radar-modal"
        @cancel="isMapExpanded = false"
      >
        <div id="large-map" class="relative bg-[#F5F5F5] rounded-lg overflow-hidden" style="height: 70vh;"></div>
      </a-modal>

      <!-- 创建小组弹窗 -->
      <CreateGroupModal
        :visible="showCreateGroupModal"
        @update:visible="showCreateGroupModal = $event"
        @success="handleGroupCreated"
      />

      <!-- 发布想法弹窗 -->
      <PostThoughtModal
        :visible="showPostThoughtModal"
        @update:visible="showPostThoughtModal = $event"
        :my-groups="myGroups"
        :default-group="selectedGroupId"
        @success="handleThoughtPosted"
      />

      <!-- 浏览小组弹窗 -->
      <a-modal
        v-model:visible="showBrowseGroupsModal"
        title="浏览所有小组"
        :footer="null"
        width="800px"
      >
        <div class="space-y-4 max-h-96 overflow-y-auto">
          <div
            v-for="group in allGroups"
            :key="group.id"
            class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex justify-between items-start">
              <div class="flex-grow">
                <h3 class="font-medium text-lg">{{ group.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ group.description || '暂无描述' }}</p>
                <div class="flex items-center mt-2 text-sm text-gray-500">
                  <TeamOutlined class="mr-1" />
                  <span>{{ group.member_count || 0 }} 成员</span>
                </div>
              </div>
              <a-button
                v-if="!isGroupJoined(group.id)"
                type="primary"
                class="!rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35]"
                @click="joinGroupHandler(group.id)"
              >
                加入
              </a-button>
              <a-tag v-else color="success">已加入</a-tag>
            </div>
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  BellOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  MessageOutlined,
  ShareAltOutlined,
  LikeOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons-vue'
import { Modal as AModal, Select as ASelect, SelectOption as ASelectOption, Tag as ATag, RadioGroup as ARadioGroup, RadioButton as ARadioButton, Slider as ASlider, Button as AButton, Pagination as APagination } from 'ant-design-vue'
import { groupAPI, thoughtAPI, visibilityAPI } from '@/utils/api'
import CreateGroupModal from '@/components/groups/CreateGroupModal.vue'
import PostThoughtModal from '@/components/groups/PostThoughtModal.vue'

// Reactive data
const feedFilter = ref('all')
const distanceFilter = ref(1000)
const sortOption = ref('newest')
const currentPage = ref(1)
const activeRadarDot = ref(null)
const isMapExpanded = ref(false)
const hoveredDot = ref(null)

// Groups related state
const myGroups = ref([])
const allGroups = ref([])
const selectedGroupId = ref(null)
const showCreateGroupModal = ref(false)
const showPostThoughtModal = ref(false)
const showBrowseGroupsModal = ref(false)

// Visibility state
const isVisible = ref(true)

// Thoughts state
const thoughts = ref([])
const mapThoughts = ref([])
const visibleUsers = ref([])

// Google Maps instances
let smallMap = null
let largeMap = null
let thoughtMarkers = []
let userMarkers = []

// Filter options
const feedFilters = ['all', 'groups', 'urgent']

// Activities data (keeping for backward compatibility)
const activities = ref([
  {
    id: 1,
    title: 'Study Group for Midterm Exam',
    category: { name: 'Academic', color: 'blue' },
    user: {
      name: 'Alex Johnson',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20male%20student%20with%20glasses%20wearing%20casual%20smart%20attire%20against%20neutral%20background&width=100&height=100&seq=2&orientation=squarish'
    },
    group: 'CS 5582 Study Group',
    timeAgo: '15 minutes ago',
    description: 'Looking for 3-4 people to join our study session for the upcoming midterm. We\'ll be focusing on chapters 5-8. I can help with the practical problems!',
    tags: ['Computer Science', 'Algorithms', 'Midterm'],
    location: 'Main Library',
    distance: '0.3 miles',
    expiresIn: '3 hours',
    participants: 4,
    successRate: 85
  }
])

// Map data
const mapImage = 'https://readdy.ai/api/search-image?query=aerial%20view%20of%20university%20campus%20map%20with%20buildings%20paths%20and%20green%20spaces%20in%20a%20simple%20clean%20design%20style&width=400&height=300&seq=6&orientation=landscape'

const nearbyDots = ref([
  {
    id: 1,
    color: 'bg-green-500',
    top: 45,
    left: 55,
    activityInfo: 'Study Group for Midterm Exam - Looking for 3-4 people to join',
    activityId: 1
  },
  {
    id: 2,
    color: 'bg-red-500',
    top: 35,
    left: 60,
    activityInfo: 'Need Help with Physics Assignment - Quantum mechanics problems',
    activityId: 2
  },
  {
    id: 3,
    color: 'bg-red-500',
    top: 55,
    left: 40,
    activityInfo: 'Looking for Math Study Partner - Calculus II',
    activityId: null
  },
  {
    id: 4,
    color: 'bg-purple-500',
    top: 60,
    left: 65,
    activityInfo: 'Basketball Pickup Game - 4 spots available',
    activityId: 3
  },
  {
    id: 5,
    color: 'bg-green-500',
    top: 40,
    left: 35,
    activityInfo: 'Offering Free Tutoring - Calculus I & II',
    activityId: 4
  },
  {
    id: 6,
    color: 'bg-purple-500',
    top: 30,
    left: 45,
    activityInfo: 'Campus Photography Walk - Join us this afternoon',
    activityId: null
  },
  {
    id: 7,
    color: 'bg-green-500',
    top: 65,
    left: 55,
    activityInfo: 'Programming Help Available - Java & Python',
    activityId: null
  }
])

// Recent connections data
const recentConnections = ref([
  {
    id: 1,
    user1: {
      name: 'David Kim',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20asian%20male%20student%20with%20friendly%20smile%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=7&orientation=squarish'
    },
    user2: {
      name: 'Jessica Lee',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20female%20student%20with%20long%20hair%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=8&orientation=squarish'
    },
    testimonial: 'David helped me understand the complex algorithms. Great study session!'
  },
  {
    id: 2,
    user1: {
      name: 'Michael Brown',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20male%20student%20with%20beard%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=9&orientation=squarish'
    },
    user2: {
      name: 'Sarah Johnson',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20female%20student%20with%20short%20hair%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=10&orientation=squarish'
    },
    testimonial: 'Found a great carpool partner for the semester. Saving money and the environment!'
  },
  {
    id: 3,
    user1: {
      name: 'Lisa Wang',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20asian%20female%20student%20with%20glasses%20wearing%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=11&orientation=squarish'
    },
    user2: {
      name: 'James Wilson',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20young%20male%20student%20with%20friendly%20smile%20wearing%20smart%20casual%20attire%20against%20neutral%20background&width=100&height=100&seq=12&orientation=squarish'
    },
    testimonial: 'Lisa\'s tutoring helped me ace my calculus exam. Highly recommended!'
  }
])

// Activity stats
const activityStats = ref({
  studySessions: 15,
  helpRequests: 28,
  newConnections: 42
})

// Computed properties
const filteredActivities = computed(() => {
  let filtered = activities.value

  if (feedFilter.value === 'groups') {
    filtered = filtered.filter(activity => activity.group.includes('CS 5582'))
  } else if (feedFilter.value === 'urgent') {
    filtered = filtered.filter(activity => activity.category.name === 'Help Needed')
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredActivities.value.length / 10) || 1
})

// Methods
const joinGroup = (group) => {
  alert(`Joined ${group.name}! You'll receive notifications about group activities.`)
}

const highlightRadarDot = (activityId) => {
  activeRadarDot.value = activityId
}

const resetRadarDot = () => {
  activeRadarDot.value = null
}

const toggleMapExpand = () => {
  isMapExpanded.value = !isMapExpanded.value
  if (isMapExpanded.value) {
    // 等待 modal 渲染后初始化大地图
    nextTick(() => {
      initLargeMap()
    })
  }
}

const showDotInfo = (dot) => {
  hoveredDot.value = dot
}

const hideDotInfo = () => {
  hoveredDot.value = null
}

const focusActivity = (activityId) => {
  if (activityId) {
    const element = document.querySelector(`[data-activity-id="${activityId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

const sendMessage = (activity) => {
  alert(`Opening chat with ${activity.user.name}...`)
}

const shareActivity = (activity) => {
  navigator.share?.({
    title: activity.title,
    text: activity.description,
    url: window.location.href
  }).catch(() => {
    navigator.clipboard?.writeText(window.location.href)
    alert('Activity link copied to clipboard!')
  })
}

const joinActivity = (activity) => {
  alert(`Joined "${activity.title}"! The organizer will be notified.`)
  activity.participants++
}

// === Groups API Methods ===
const fetchMyGroups = async () => {
  try {
    const response = await groupAPI.getMyGroups()
    myGroups.value = response.data.data.groups || []
  } catch (error) {
    console.error('获取我的小组失败:', error)
    message.error('获取小组列表失败')
  }
}

const fetchAllGroups = async () => {
  try {
    const response = await groupAPI.getGroups()
    allGroups.value = response.data.data.groups || []
  } catch (error) {
    console.error('获取所有小组失败:', error)
  }
}

const joinGroupHandler = async (groupId) => {
  try {
    const response = await groupAPI.joinGroup(groupId)
    if (response.data.success) {
      message.success('加入小组成功！')
      await fetchMyGroups()
      await fetchAllGroups()
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || '加入小组失败')
  }
}

const leaveGroupHandler = async (groupId) => {
  try {
    const response = await groupAPI.leaveGroup(groupId)
    if (response.data.success) {
      message.success('已退出小组')
      if (selectedGroupId.value === groupId) {
        selectedGroupId.value = null
      }
      await fetchMyGroups()
      await fetchThoughts()
      await fetchMapThoughts()
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || '退出小组失败')
  }
}

const deleteGroupHandler = async (groupId) => {
  try {
    const response = await groupAPI.deleteGroup(groupId)
    if (response.data.success) {
      message.success('小组已删除')
      if (selectedGroupId.value === groupId) {
        selectedGroupId.value = null
      }
      await fetchMyGroups()
      await fetchAllGroups()
      await fetchThoughts()
      await fetchMapThoughts()
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || '删除小组失败')
  }
}

const enterGroup = (group) => {
  selectedGroupId.value = selectedGroupId.value === group.id ? null : group.id
  fetchThoughts()
  fetchMapThoughts()
}

const handleGroupCreated = () => {
  fetchMyGroups()
  fetchAllGroups()
  message.success('小组创建成功！')
}

const isGroupJoined = (groupId) => {
  return myGroups.value.some(g => g.id === groupId)
}

// === Thoughts API Methods ===
const fetchThoughts = async () => {
  try {
    const params = {}
    if (selectedGroupId.value) {
      params.group_id = selectedGroupId.value
    }
    const response = await thoughtAPI.getThoughts(params)
    thoughts.value = response.data.data.thoughts || []
  } catch (error) {
    console.error('获取想法失败:', error)
  }
}

const fetchMapThoughts = async () => {
  try {
    const params = {}
    if (selectedGroupId.value) {
      params.group_id = selectedGroupId.value
    }
    const response = await thoughtAPI.getMapThoughts(params)
    mapThoughts.value = response.data.data.thoughts || []
    updateMapMarkers()
  } catch (error) {
    console.error('获取地图想法失败:', error)
  }
}

const handleThoughtPosted = () => {
  fetchThoughts()
  fetchMapThoughts()
  message.success('想法发布成功！')
}

// === Visibility API Methods ===
const toggleVisibility = async () => {
  try {
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

const fetchVisibleUsers = async () => {
  try {
    const params = {}
    if (selectedGroupId.value) {
      params.group_id = selectedGroupId.value
    }
    const response = await visibilityAPI.getMapUsers(params)
    visibleUsers.value = response.data.data.users || []
    updateMapMarkers()
  } catch (error) {
    console.error('获取可见用户失败:', error)
  }
}

// === Google Maps Methods ===
const initGoogleMaps = async () => {
  try {
    // 等待 Google Maps API 加载
    if (!window.google) {
      // 如果还没加载，等待一下
      await new Promise((resolve) => {
        const checkGoogle = setInterval(() => {
          if (window.google) {
            clearInterval(checkGoogle)
            resolve()
          }
        }, 100)
      })
    }

    // 初始化小地图
    const smallMapElement = document.getElementById('small-map')
    if (smallMapElement && window.google) {
      smallMap = new window.google.maps.Map(smallMapElement, {
        center: { lat: 42.4534, lng: -76.4735 }, // Cornell University
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false
      })
    }

    updateMapMarkers()
  } catch (error) {
    console.error('Google Maps 加载失败:', error)
    message.error('地图加载失败')
  }
}

const initLargeMap = async () => {
  try {
    if (!window.google) return

    const largeMapElement = document.getElementById('large-map')
    if (largeMapElement && !largeMap) {
      largeMap = new window.google.maps.Map(largeMapElement, {
        center: { lat: 42.4534, lng: -76.4735 },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false
      })
      updateLargeMapMarkers()
    }
  } catch (error) {
    console.error('大地图初始化失败:', error)
  }
}

const updateMapMarkers = () => {
  if (!smallMap || !window.google) {
    console.log('⚠️ 地图未初始化或Google API未加载')
    return
  }

  console.log('🗺️ 更新地图标记:', {
    thoughts: mapThoughts.value.length,
    users: visibleUsers.value.length
  })

  // 清除旧标记
  thoughtMarkers.forEach(marker => marker.setMap(null))
  userMarkers.forEach(marker => marker.setMap(null))
  thoughtMarkers = []
  userMarkers = []

  // 添加想法标记（红色）
  mapThoughts.value.forEach(thought => {
    console.log('📍 添加想法标记:', thought)
    if (thought.location && thought.location.lat && thought.location.lng) {
      // 截断过长的内容
      const maxLength = 100
      const displayContent = thought.content.length > maxLength
        ? thought.content.substring(0, maxLength) + '...'
        : thought.content

      const marker = new window.google.maps.Marker({
        position: { lat: thought.location.lat, lng: thought.location.lng },
        map: smallMap,
        title: thought.content,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#EF4444',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#FFF',
          scale: 8
        }
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px; max-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #333;">${thought.user?.first_name || '用户'}</div>
          <div style="font-size: 14px; color: #666; line-height: 1.4;">${displayContent}</div>
        </div>`
      })

      // 鼠标悬停时显示
      marker.addListener('mouseover', () => {
        infoWindow.open(smallMap, marker)
      })

      // 鼠标离开时隐藏
      marker.addListener('mouseout', () => {
        infoWindow.close()
      })

      thoughtMarkers.push(marker)
    }
  })

  // 添加用户标记（蓝色）
  visibleUsers.value.forEach(user => {
    if (user.current_location && user.current_location.lat && user.current_location.lng) {
      const marker = new window.google.maps.Marker({
        position: { lat: user.current_location.lat, lng: user.current_location.lng },
        map: smallMap,
        title: user.first_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3B82F6',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#FFF',
          scale: 8
        }
      })

      userMarkers.push(marker)
    }
  })
}

const updateLargeMapMarkers = () => {
  if (!largeMap || !window.google) return

  // 复制小地图的标记到大地图
  mapThoughts.value.forEach(thought => {
    if (thought.location && thought.location.lat && thought.location.lng) {
      // 截断过长的内容
      const maxLength = 100
      const displayContent = thought.content.length > maxLength
        ? thought.content.substring(0, maxLength) + '...'
        : thought.content

      const marker = new window.google.maps.Marker({
        position: { lat: thought.location.lat, lng: thought.location.lng },
        map: largeMap,
        title: thought.content,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#EF4444',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#FFF',
          scale: 10
        }
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px; max-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #333;">${thought.user?.first_name || '用户'}</div>
          <div style="font-size: 14px; color: #666; line-height: 1.4;">${displayContent}</div>
        </div>`
      })

      // 鼠标悬停时显示
      marker.addListener('mouseover', () => {
        infoWindow.open(largeMap, marker)
      })

      // 鼠标离开时隐藏
      marker.addListener('mouseout', () => {
        infoWindow.close()
      })
    }
  })

  visibleUsers.value.forEach(user => {
    if (user.current_location && user.current_location.lat && user.current_location.lng) {
      const marker = new window.google.maps.Marker({
        position: { lat: user.current_location.lat, lng: user.current_location.lng },
        map: largeMap,
        title: user.first_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3B82F6',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#FFF',
          scale: 10
        }
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px;">
          <div style="font-weight: bold; color: #333;">${user.first_name || '用户'}</div>
        </div>`
      })

      // 鼠标悬停时显示
      marker.addListener('mouseover', () => {
        infoWindow.open(largeMap, marker)
      })

      // 鼠标离开时隐藏
      marker.addListener('mouseout', () => {
        infoWindow.close()
      })
    }
  })
}

// Watch for group selection changes
watch(selectedGroupId, () => {
  fetchThoughts()
  fetchMapThoughts()
  fetchVisibleUsers()
})

// Initialize on mount
onMounted(async () => {
  await fetchMyGroups()
  await fetchAllGroups()
  await fetchThoughts()
  await fetchMapThoughts()
  await fetchVisibleUsers()
  await initGoogleMaps()

  // 获取我的可见性状态
  try {
    const response = await visibilityAPI.getMyVisibility()
    isVisible.value = response.data.data.visibility.is_visible
  } catch (error) {
    console.error('获取可见性状态失败:', error)
  }
})

</script>

<style scoped>
.main-content {
  flex: 1;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom slider styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #C24D45;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #C24D45;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* Animation classes */
.hover\:-translate-y-1:hover {
  transform: translateY(-0.25rem);
}

.radar-modal .ant-modal-body {
  padding: 0;
}
</style>
