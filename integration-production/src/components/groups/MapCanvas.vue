<template>
  <div ref="mapContainer" class="w-full h-full relative">
    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
    >
      <div class="text-center">
        <a-spin size="large" />
        <p class="text-gray-600 mt-4">Loading map...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-if="error"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
    >
      <div class="text-center max-w-md p-6">
        <EnvironmentOutlined style="font-size: 64px" class="text-red-400 mb-4" />
        <p class="text-red-600 font-medium mb-2">Map loading failed</p>
        <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
        <a-button type="primary" @click="initMap">Retry</a-button>
      </div>
    </div>

    <!-- 图例 -->
    <div
      v-if="!loading && !error"
      class="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg z-20"
    >
      <div class="text-xs font-semibold text-gray-600 mb-2">Legend</div>
      <div class="space-y-1">
        <div class="flex items-center text-xs text-gray-600">
          <div class="w-3 h-3 bg-[#C24D45] rounded-full mr-2"></div>
          <span>Thought Locations</span>
        </div>
        <div class="flex items-center text-xs text-gray-600">
          <div class="w-3 h-3 bg-blue-500 rounded-full mr-2 ring-2 ring-blue-300"></div>
          <span>Visible Users</span>
        </div>
        <div class="flex items-center text-xs text-gray-600">
          <div class="w-3 h-3 bg-green-500 rounded-full mr-2 ring-2 ring-green-300 animate-pulse"></div>
          <span>My Location</span>
        </div>
        <div class="flex items-center text-xs text-gray-600">
          <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
          <span>Campus Activities</span>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div
      v-if="!loading && !error"
      class="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg z-20"
    >
      <div class="text-xs text-gray-500 mb-1">Statistics</div>
      <div class="flex items-center space-x-4">
        <div class="text-center">
          <div class="text-lg font-bold text-[#C24D45]">{{ thoughts.length }}</div>
          <div class="text-xs text-gray-500">Thoughts</div>
        </div>
        <div class="w-px h-8 bg-gray-300"></div>
        <div class="text-center">
          <div class="text-lg font-bold text-blue-500">{{ users.length }}</div>
          <div class="text-xs text-gray-500">Users</div>
        </div>
        <div class="w-px h-8 bg-gray-300"></div>
        <div class="text-center">
          <div class="text-lg font-bold text-orange-500">{{ activities.length }}</div>
          <div class="text-xs text-gray-500">Activities</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Loader } from '@googlemaps/js-api-loader'
import { EnvironmentOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  thoughts: {
    type: Array,
    default: () => []
  },
  users: {
    type: Array,
    default: () => []
  },
  activities: {
    type: Array,
    default: () => []
  },
  myLocation: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['marker-hover', 'marker-click', 'user-click'])

const router = useRouter()
const authStore = useAuthStore()

const mapContainer = ref(null)
const loading = ref(true)
const error = ref(null)
let map = null
let thoughtMarkers = []
let userMarkers = []
let activityMarkers = []
let myLocationMarker = null
let infoWindow = null

// 获取 API Key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Create avatar marker icon
const createAvatarMarkerIcon = (avatarUrl, isCurrentUser = false) => {
  const size = isCurrentUser ? 48 : 40
  const borderColor = isCurrentUser ? '#10B981' : '#3B82F6' // green for current user, blue for others
  const borderWidth = isCurrentUser ? 4 : 3
  const glowColor = isCurrentUser ? 'rgba(16, 185, 129, 0.4)' : 'transparent'

  return {
    url: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size + 8}" height="${size + 16}">
        <defs>
          <clipPath id="circle">
            <circle cx="${(size + 8) / 2}" cy="${size / 2}" r="${size / 2 - borderWidth}"/>
          </clipPath>
          ${isCurrentUser ? `
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          ` : ''}
        </defs>
        ${isCurrentUser ? `<circle cx="${(size + 8) / 2}" cy="${size / 2}" r="${size / 2 + 2}" fill="${glowColor}" filter="url(#glow)"/>` : ''}
        <circle cx="${(size + 8) / 2}" cy="${size / 2}" r="${size / 2}" fill="${borderColor}"/>
        <circle cx="${(size + 8) / 2}" cy="${size / 2}" r="${size / 2 - borderWidth}" fill="#fff"/>
        <image href="${avatarUrl || 'https://via.placeholder.com/40'}" x="${4 + borderWidth}" y="${borderWidth}" width="${size - borderWidth * 2}" height="${size - borderWidth * 2}" clip-path="url(#circle)" preserveAspectRatio="xMidYMid slice"/>
        <polygon points="${(size + 8) / 2 - 6},${size} ${(size + 8) / 2 + 6},${size} ${(size + 8) / 2},${size + 12}" fill="${borderColor}"/>
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(size + 8, size + 16),
    anchor: new google.maps.Point((size + 8) / 2, size + 12)
  }
}

// Create simple avatar marker for fallback
const createSimpleAvatarMarker = (user, isCurrentUser = false) => {
  const size = isCurrentUser ? 48 : 40
  const borderColor = isCurrentUser ? '#10B981' : '#3B82F6'

  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: size / 2,
    fillColor: borderColor,
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 3
  }
}

// 初始化地图
const initMap = async () => {
  loading.value = true
  error.value = null

  try {
    // 检查 API Key
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Please configure VITE_GOOGLE_MAPS_API_KEY in .env file')
    }

    // 加载 Google Maps API
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry']
    })

    await loader.load()

    await nextTick()

    if (!mapContainer.value) {
      throw new Error('Map container not found')
    }

    // 创建地图
    map = new google.maps.Map(mapContainer.value, {
      center: { lat: 42.4534, lng: -76.4735 }, // Your University
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.SATELLITE, // Use satellite view
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    })

    // 创建 InfoWindow
    infoWindow = new google.maps.InfoWindow()

    // 渲染标记
    renderThoughtMarkers()
    renderUserMarkers()
    renderActivityMarkers()
    renderMyLocationMarker()

    // 如果有标记，自动调整视图
    fitMapToMarkers()

    loading.value = false
  } catch (err) {
    console.error('Map initialization failed:', err)
    error.value = err.message || 'Map loading failed, please check network connection'
    loading.value = false
  }
}

// 渲染想法标记
const renderThoughtMarkers = () => {
  if (!map) return

  // 清除旧标记
  thoughtMarkers.forEach(marker => marker.setMap(null))
  thoughtMarkers = []

  props.thoughts.forEach(thought => {
    if (!thought.location || !thought.location.lat || !thought.location.lng) {
      return
    }

    // Create avatar-based marker for thoughts
    const avatarUrl = thought.user?.avatar_url || 'https://via.placeholder.com/40'
    const isCurrentUser = thought.user?.id === authStore.userId

    const marker = new google.maps.Marker({
      position: {
        lat: thought.location.lat,
        lng: thought.location.lng
      },
      map: map,
      title: thought.content.substring(0, 50),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#C24D45',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 3
      },
      animation: google.maps.Animation.DROP
    })

    // 点击事件
    marker.addListener('click', () => {
      const content = `
        <div style="max-width: 280px; padding: 12px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <img src="${thought.user?.avatar_url || 'https://via.placeholder.com/40'}"
                 style="width: 44px; height: 44px; border-radius: 50%; margin-right: 12px; border: 2px solid #C24D45; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/40'" />
            <div>
              <div style="font-weight: 600; color: #333; font-size: 14px;">
                ${thought.user?.first_name || ''} ${thought.user?.last_name || ''}
              </div>
              <div style="font-size: 11px; color: #666;">
                ${new Date(thought.created_at).toLocaleString('en-US')}
              </div>
            </div>
          </div>
          <div style="color: #333; line-height: 1.6; font-size: 13px; background: #f9f9f9; padding: 10px; border-radius: 8px;">
            ${thought.content}
          </div>
          ${
            thought.location.address
              ? `<div style="font-size: 11px; color: #666; margin-top: 10px;">
                  📍 ${thought.location.address}
                 </div>`
              : ''
          }
          ${thought.user?.id !== authStore.userId ? `
          <button onclick="window.dispatchEvent(new CustomEvent('chat-with-user', {detail: {userId: '${thought.user?.id}', userName: '${thought.user?.first_name} ${thought.user?.last_name}'}}));"
                  style="margin-top: 12px; width: 100%; padding: 8px 16px; background: #C24D45; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">
            💬 Chat
          </button>
          ` : ''}
        </div>
      `
      infoWindow.setContent(content)
      infoWindow.open(map, marker)
      emit('marker-click', thought)
    })

    // 悬停效果
    marker.addListener('mouseover', () => {
      marker.setAnimation(google.maps.Animation.BOUNCE)
      setTimeout(() => marker.setAnimation(null), 750)
    })

    thoughtMarkers.push(marker)
  })
}

// 渲染用户标记 - 使用头像
const renderUserMarkers = () => {
  if (!map) return

  // 清除旧标记
  userMarkers.forEach(marker => marker.setMap(null))
  userMarkers = []

  props.users.forEach(user => {
    if (!user.location || !user.location.lat || !user.location.lng) {
      return
    }

    // Skip current user (they have a separate marker)
    if (user.id === authStore.userId) {
      return
    }

    const avatarUrl = user.avatar || user.avatar_url || 'https://via.placeholder.com/40'

    // Create avatar-based marker for users
    const marker = new google.maps.Marker({
      position: {
        lat: user.location.lat,
        lng: user.location.lng
      },
      map: map,
      title: user.name || `${user.first_name} ${user.last_name}`,
      icon: createAvatarMarkerIcon(avatarUrl, false)
    })

    // 点击事件 - 显示用户信息和聊天按钮
    marker.addListener('click', () => {
      const displayName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'
      const content = `
        <div style="max-width: 240px; padding: 12px;">
          <div style="display: flex; align-items: center;">
            <img src="${avatarUrl}"
                 style="width: 52px; height: 52px; border-radius: 50%; margin-right: 12px; border: 3px solid #3B82F6; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/52'" />
            <div>
              <div style="font-weight: 600; color: #333; font-size: 15px;">${displayName}</div>
              <div style="font-size: 12px; color: #666;">${user.email || ''}</div>
              ${
                user.has_thought
                  ? '<div style="font-size: 11px; color: #10B981; margin-top: 2px;">✓ Has shared thought</div>'
                  : '<div style="font-size: 11px; color: #3B82F6; margin-top: 2px;">● Online</div>'
              }
            </div>
          </div>
          <button onclick="window.dispatchEvent(new CustomEvent('chat-with-user', {detail: {userId: '${user.id}', userName: '${displayName}'}}));"
                  style="margin-top: 12px; width: 100%; padding: 10px 16px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">
            💬 Start Chat
          </button>
        </div>
      `
      infoWindow.setContent(content)
      infoWindow.open(map, marker)
      emit('user-click', user)
    })

    userMarkers.push(marker)
  })
}

// 渲染"我的位置"标记 - 特殊显示
const renderMyLocationMarker = () => {
  if (!map) return

  // 清除旧的我的位置标记
  if (myLocationMarker) {
    myLocationMarker.setMap(null)
    myLocationMarker = null
  }

  // Check if we have current user's location from users array or myLocation prop
  let myLoc = props.myLocation
  let currentUserAvatar = authStore.user?.avatar_url || 'https://via.placeholder.com/40'

  if (!myLoc) {
    const currentUser = props.users.find(u => u.id === authStore.userId)
    if (currentUser && currentUser.location) {
      myLoc = currentUser.location
      currentUserAvatar = currentUser.avatar || currentUser.avatar_url || currentUserAvatar
    }
  }

  if (!myLoc || !myLoc.lat || !myLoc.lng) {
    return
  }

  // Create special marker for current user with avatar and pulsing effect
  myLocationMarker = new google.maps.Marker({
    position: {
      lat: myLoc.lat,
      lng: myLoc.lng
    },
    map: map,
    title: 'My Location',
    icon: createAvatarMarkerIcon(currentUserAvatar, true),
    zIndex: 1000 // Ensure it's on top
  })

  // Add outer pulsing circle
  const pulseCircle = new google.maps.Circle({
    map: map,
    center: { lat: myLoc.lat, lng: myLoc.lng },
    radius: 30,
    strokeColor: '#10B981',
    strokeOpacity: 0.4,
    strokeWeight: 2,
    fillColor: '#10B981',
    fillOpacity: 0.15
  })

  // Click event for my location
  myLocationMarker.addListener('click', () => {
    const content = `
      <div style="padding: 12px; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
          <div style="width: 12px; height: 12px; background: #10B981; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite;"></div>
          <div style="font-weight: 600; color: #333; font-size: 15px;">My Location</div>
        </div>
        <div style="font-size: 12px; color: #666;">You are here</div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `
    infoWindow.setContent(content)
    infoWindow.open(map, myLocationMarker)
  })
}

// 渲染活动标记
const renderActivityMarkers = () => {
  if (!map) return

  // 清除旧标记
  activityMarkers.forEach(marker => marker.setMap(null))
  activityMarkers = []

  props.activities.forEach(activity => {
    if (!activity.location_coordinates || !activity.location_coordinates.lat || !activity.location_coordinates.lng) {
      return
    }

    const marker = new google.maps.Marker({
      position: {
        lat: activity.location_coordinates.lat,
        lng: activity.location_coordinates.lng
      },
      map: map,
      title: activity.title,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#f97316', // orange-500
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2
      },
      animation: google.maps.Animation.DROP
    })

    // 点击事件
    marker.addListener('click', () => {
      const startTime = new Date(activity.start_time)
      const endTime = new Date(activity.end_time)
      const now = new Date()

      let statusColor = '#10b981' // green
      let statusText = 'Upcoming'

      if (now > startTime && now < endTime) {
        statusColor = '#3b82f6' // blue
        statusText = 'In Progress'
      } else if (now > endTime) {
        statusColor = '#6b7280' // gray
        statusText = 'Ended'
      }

      const content = `
        <div style="max-width: 300px; padding: 12px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 8px; height: 8px; background-color: ${statusColor}; border-radius: 50%; margin-right: 8px;"></div>
            <div style="font-weight: 600; color: #333; font-size: 16px;">${activity.title}</div>
          </div>

          <div style="margin-bottom: 8px;">
            <span style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 8px;">
              ${activity.category}
            </span>
            <span style="color: ${statusColor}; font-weight: 500; font-size: 12px;">${statusText}</span>
          </div>

          <div style="color: #555; line-height: 1.5; margin-bottom: 8px; font-size: 14px;">
            ${activity.description?.substring(0, 100)}${activity.description?.length > 100 ? '...' : ''}
          </div>

          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
            <div style="margin-bottom: 4px;">
              🕒 ${startTime.toLocaleDateString('en-US')} ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style="margin-bottom: 4px;">
              📍 ${activity.location}
            </div>
            ${activity.current_participants !== undefined ?
              `<div>👥 ${activity.current_participants || 0}${activity.max_participants ? `/${activity.max_participants}` : ''} participants</div>` :
              ''
            }
          </div>

          ${activity.reward_points > 0 ?
            `<div style="background-color: #fef3cd; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #92400e;">
              🏆 Reward: ${activity.reward_points} points
            </div>` :
            ''
          }
        </div>
      `
      infoWindow.setContent(content)
      infoWindow.open(map, marker)
      emit('marker-click', activity)
    })

    // 悬停效果
    marker.addListener('mouseover', () => {
      marker.setAnimation(google.maps.Animation.BOUNCE)
      setTimeout(() => marker.setAnimation(null), 750)
    })

    activityMarkers.push(marker)
  })
}

// 调整地图视图以显示所有标记
const fitMapToMarkers = () => {
  if (!map || (thoughtMarkers.length === 0 && userMarkers.length === 0 && activityMarkers.length === 0 && !myLocationMarker)) {
    return
  }

  const bounds = new google.maps.LatLngBounds()

  thoughtMarkers.forEach(marker => {
    bounds.extend(marker.getPosition())
  })

  userMarkers.forEach(marker => {
    bounds.extend(marker.getPosition())
  })

  activityMarkers.forEach(marker => {
    bounds.extend(marker.getPosition())
  })

  if (myLocationMarker) {
    bounds.extend(myLocationMarker.getPosition())
  }

  map.fitBounds(bounds)

  // 限制最大缩放级别
  const listener = google.maps.event.addListener(map, 'idle', () => {
    if (map.getZoom() > 16) map.setZoom(16)
    google.maps.event.removeListener(listener)
  })
}

// Listen for chat events from InfoWindow
if (typeof window !== 'undefined') {
  window.addEventListener('chat-with-user', (event) => {
    const { userId, userName } = event.detail
    if (userId) {
      router.push({
        path: '/messages',
        query: { userId }
      })
    }
  })
}

// 监听数据变化
watch(
  () => props.thoughts,
  () => {
    if (map) {
      renderThoughtMarkers()
      fitMapToMarkers()
    }
  },
  { deep: true }
)

watch(
  () => props.users,
  () => {
    if (map) {
      renderUserMarkers()
      renderMyLocationMarker()
      fitMapToMarkers()
    }
  },
  { deep: true }
)

watch(
  () => props.activities,
  () => {
    if (map) {
      renderActivityMarkers()
      fitMapToMarkers()
    }
  },
  { deep: true }
)

watch(
  () => props.myLocation,
  () => {
    if (map) {
      renderMyLocationMarker()
      fitMapToMarkers()
    }
  },
  { deep: true }
)

// 组件挂载时初始化地图
onMounted(() => {
  initMap()
})
</script>

<style scoped>
/* Google Maps 容器必须有明确的高度 */
</style>
