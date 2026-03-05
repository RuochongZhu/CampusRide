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
import { getPublicUserName } from '@/utils/publicName'

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
  },
  highlightTarget: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['marker-hover', 'marker-click', 'user-click'])

const router = useRouter()
const authStore = useAuthStore()
const getDisplayName = (user) => getPublicUserName(user, 'User')

const mapContainer = ref(null)
const loading = ref(true)
const error = ref(null)
let map = null
let thoughtMarkers = []
let userMarkers = []
let activityMarkers = []
let myLocationMarker = null
let infoWindow = null
let isInfoWindowPinned = false
let activityMarkerIndex = new Map()

// 获取 API Key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Create avatar marker icon
const createAvatarMarkerIcon = (avatarUrl, options = {}) => {
  const {
    isCurrentUser = false,
    borderColor = isCurrentUser ? '#10B981' : '#3B82F6',
    glowColor = isCurrentUser ? 'rgba(16, 185, 129, 0.4)' : 'transparent',
    size = isCurrentUser ? 48 : 40
  } = options
  const borderWidth = isCurrentUser ? 4 : 3

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

const normalizeCoordinates = (coords) => {
  if (!coords) return null

  const lat = Number(coords.lat)
  const lng = Number(coords.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng }
}

const getActivityCoordinates = (activity) => {
  return normalizeCoordinates(activity.location_coordinates || activity.locationCoordinates || activity.coordinates)
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
    infoWindow.addListener('closeclick', () => {
      isInfoWindowPinned = false
    })

    map.addListener('click', () => {
      isInfoWindowPinned = false
      infoWindow.close()
      emit('marker-hover', null, null)
    })

    // 渲染标记
    renderThoughtMarkers()
    renderUserMarkers()
    renderActivityMarkers()
    renderMyLocationMarker()

    if (props.highlightTarget) {
      focusHighlightedTarget()
    }

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
    const thoughtLocation = normalizeCoordinates(thought.location)
    if (!thoughtLocation) {
      return
    }

    // Create avatar-based marker for thoughts
    const avatarUrl = thought.user?.avatar_url || 'https://via.placeholder.com/40'
    const isCurrentUser = thought.user?.id === authStore.userId

    const marker = new google.maps.Marker({
      position: thoughtLocation,
      map: map,
      title: thought.content.substring(0, 50),
      icon: createAvatarMarkerIcon(avatarUrl, {
        isCurrentUser,
        borderColor: isCurrentUser ? '#10B981' : '#C24D45'
      }),
      animation: google.maps.Animation.DROP
    })

    // 点击事件
    marker.addListener('click', () => {
      isInfoWindowPinned = true
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
    marker.addListener('mouseover', (e) => {
      marker.setAnimation(google.maps.Animation.BOUNCE)
      setTimeout(() => marker.setAnimation(null), 750)
      if (!isInfoWindowPinned) {
        emit('marker-hover', thought, e?.domEvent || e)
      }
    })

    marker.addListener('mouseout', () => {
      if (!isInfoWindowPinned) {
        emit('marker-hover', null, null)
      }
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
    const userLocation = normalizeCoordinates(user.location)
    if (!userLocation) {
      return
    }

    const userId = user.id || user.user_id

    // Skip current user (they have a separate marker)
    if (userId && userId === authStore.userId) {
      return
    }

    const avatarUrl = user.avatar || user.avatar_url || 'https://via.placeholder.com/40'

    // Create avatar-based marker for users
    const marker = new google.maps.Marker({
      position: userLocation,
      map: map,
      title: getDisplayName(user),
      icon: createAvatarMarkerIcon(avatarUrl)
    })

    // 悬停气泡 - 显示用户最新想法（对话气泡效果）
    marker.__activityId = markerActivityId
    marker.__infoContent = content

    if (markerActivityId) {
      activityMarkerIndex.set(markerActivityId, marker)
    }

    marker.addListener('mouseover', () => {
      if (isInfoWindowPinned) return

      const displayName = getDisplayName(user)
      const thoughtText = user.latest_thought || ''
      const thoughtTime = user.latest_thought_time
        ? new Date(user.latest_thought_time).toLocaleString('en-US')
        : ''

      const hoverContent = `
        <div style="max-width: 260px; padding: 10px 12px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${avatarUrl}"
                 style="width: 36px; height: 36px; border-radius: 50%; margin-right: 10px; border: 2px solid #3B82F6; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/36'" />
            <div>
              <div style="font-weight: 600; color: #333; font-size: 13px;">${displayName}</div>
              ${thoughtTime ? `<div style="font-size: 11px; color: #888;">${thoughtTime}</div>` : ''}
            </div>
          </div>
          ${thoughtText
            ? `<div style="color: #333; line-height: 1.5; font-size: 12px; background: #f3f4f6; padding: 8px 10px; border-radius: 10px;">${thoughtText}</div>`
            : `<div style="font-size: 12px; color: #666;">No recent thought</div>`
          }
        </div>
      `

      infoWindow.setContent(hoverContent)
      infoWindow.open(map, marker)
    })

    marker.addListener('mouseout', () => {
      if (isInfoWindowPinned) return
      infoWindow.close()
    })

    // 点击事件 - 显示用户信息和聊天按钮
    marker.addListener('click', () => {
      isInfoWindowPinned = true

      const displayName = getDisplayName(user)
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
          <button onclick="window.dispatchEvent(new CustomEvent('chat-with-user', {detail: {userId: '${userId}', userName: '${displayName}'}}));"
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
    const currentUser = props.users.find(u => (u.id || u.user_id) === authStore.userId)
    if (currentUser && currentUser.location) {
      myLoc = currentUser.location
      currentUserAvatar = currentUser.avatar || currentUser.avatar_url || currentUserAvatar
    }
  }

  myLoc = normalizeCoordinates(myLoc)

  if (!myLoc) {
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
    icon: createAvatarMarkerIcon(currentUserAvatar, { isCurrentUser: true }),
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
  activityMarkerIndex.clear()

  props.activities.forEach(activity => {
    const activityLocation = getActivityCoordinates(activity)
    if (!activityLocation) {
      return
    }

    const organizerAvatar = activity.organizer?.avatar_url
    const markerActivityId = activity.id || null
    const marker = new google.maps.Marker({
      position: activityLocation,
      map: map,
      title: activity.title,
      icon: organizerAvatar
        ? createAvatarMarkerIcon(organizerAvatar, { borderColor: '#f97316', size: 42 })
        : {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: '#f97316',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2
          },
      animation: google.maps.Animation.DROP
    })

    const startTime = new Date(activity.start_time)
    const endTime = new Date(activity.end_time)
    const now = new Date()

    let statusColor = '#10b981'
    let statusText = 'Upcoming'

    if (now > startTime && now < endTime) {
      statusColor = '#3b82f6'
      statusText = 'In Progress'
    } else if (now > endTime) {
      statusColor = '#6b7280'
      statusText = 'Ended'
    }

    const organizerName = getPublicUserName(activity.organizer, 'Organizer')

    const content = `
      <div style="max-width: 320px; padding: 12px;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          ${organizerAvatar
            ? `<img src="${organizerAvatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; border: 2px solid #f97316; object-fit: cover;" onerror="this.src='https://via.placeholder.com/40'" />`
            : `<div style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; background: #fed7aa; color: #9a3412; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">ACT</div>`
          }
          <div style="min-width: 0;">
            <div style="font-weight: 600; color: #333; font-size: 15px; line-height: 1.4;">${activity.title}</div>
            <div style="font-size: 12px; color: #666;">by ${organizerName}</div>
          </div>
        </div>

        <div style="margin-bottom: 8px;">
          <span style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 8px;">
            ${activity.category}
          </span>
          <span style="color: ${statusColor}; font-weight: 500; font-size: 12px;">${statusText}</span>
        </div>

        <div style="color: #555; line-height: 1.5; margin-bottom: 8px; font-size: 13px;">
          ${activity.description?.substring(0, 100)}${activity.description?.length > 100 ? '...' : ''}
        </div>

        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          <div style="margin-bottom: 4px;">
            🕒 ${startTime.toLocaleDateString('en-US')} ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style="margin-bottom: 4px;">
            📍 ${activity.location || 'Unknown location'}
          </div>
          ${activity.current_participants !== undefined
            ? `<div>👥 ${activity.current_participants || 0}${activity.max_participants ? `/${activity.max_participants}` : ''} participants</div>`
            : ''
          }
        </div>

        ${activity.reward_points > 0
          ? `<div style="background-color: #fef3cd; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #92400e;">🏆 Reward: ${activity.reward_points} points</div>`
          : ''
        }
      </div>
    `

    marker.addListener('mouseover', () => {
      if (isInfoWindowPinned) return
      infoWindow.setContent(content)
      infoWindow.open(map, marker)
    })

    marker.addListener('mouseout', () => {
      if (isInfoWindowPinned) return
      infoWindow.close()
    })

    marker.addListener('click', () => {
      isInfoWindowPinned = true
      infoWindow.setContent(content)
      infoWindow.open(map, marker)
      emit('marker-click', activity)
    })

    activityMarkers.push(marker)
  })
}

const focusHighlightedTarget = () => {
  if (!map || !props.highlightTarget) return

  const targetCoordinates = normalizeCoordinates(props.highlightTarget.coordinates)
  if (!targetCoordinates) return

  map.panTo(targetCoordinates)
  if (map.getZoom() < 16) {
    map.setZoom(16)
  }

  let targetMarker = null
  if (props.highlightTarget.id) {
    targetMarker = activityMarkerIndex.get(props.highlightTarget.id) || null
  }

  if (!targetMarker) {
    targetMarker = activityMarkers.find((marker) => {
      const position = marker.getPosition()
      if (!position) return false
      return Math.abs(position.lat() - targetCoordinates.lat) < 0.00001 &&
             Math.abs(position.lng() - targetCoordinates.lng) < 0.00001
    }) || null
  }

  if (!targetMarker) return

  targetMarker.setAnimation(google.maps.Animation.BOUNCE)
  setTimeout(() => targetMarker.setAnimation(null), 900)

  if (targetMarker.__infoContent) {
    isInfoWindowPinned = false
    infoWindow.setContent(targetMarker.__infoContent)
    infoWindow.open(map, targetMarker)
  }
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
      if (props.highlightTarget) {
        focusHighlightedTarget()
      }
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

watch(
  () => props.highlightTarget,
  () => {
    if (map && props.highlightTarget) {
      focusHighlightedTarget()
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
