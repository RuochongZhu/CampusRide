<template>
  <div ref="mapContainer" class="w-full h-full relative">
    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
    >
      <div class="text-center">
        <a-spin size="large" />
        <p class="text-gray-600 mt-4">加载地图中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-if="error"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
    >
      <div class="text-center max-w-md p-6">
        <EnvironmentOutlined style="font-size: 64px" class="text-red-400 mb-4" />
        <p class="text-red-600 font-medium mb-2">地图加载失败</p>
        <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
        <a-button type="primary" @click="initMap">重试</a-button>
      </div>
    </div>

    <!-- 图例 -->
    <div
      v-if="!loading && !error"
      class="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg z-20"
    >
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
    <div
      v-if="!loading && !error"
      class="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg z-20"
    >
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
import { ref, onMounted, watch, nextTick } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import { EnvironmentOutlined } from '@ant-design/icons-vue'

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

const mapContainer = ref(null)
const loading = ref(true)
const error = ref(null)
let map = null
let thoughtMarkers = []
let userMarkers = []
let infoWindow = null

// 获取 API Key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// 初始化地图
const initMap = async () => {
  loading.value = true
  error.value = null

  try {
    // 检查 API Key
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('请在 .env 文件中配置 VITE_GOOGLE_MAPS_API_KEY')
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
      throw new Error('地图容器未找到')
    }

    // 创建地图
    map = new google.maps.Map(mapContainer.value, {
      center: { lat: 37.7749, lng: -122.4194 }, // 默认旧金山
      zoom: 13,
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

    // 如果有标记，自动调整视图
    fitMapToMarkers()

    loading.value = false
  } catch (err) {
    console.error('地图初始化失败:', err)
    error.value = err.message || '地图加载失败，请检查网络连接'
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

    const marker = new google.maps.Marker({
      position: {
        lat: thought.location.lat,
        lng: thought.location.lng
      },
      map: map,
      title: thought.content.substring(0, 50),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#C24D45',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2
      },
      animation: google.maps.Animation.DROP
    })

    // 点击事件
    marker.addListener('click', () => {
      const content = `
        <div style="max-width: 250px; padding: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${thought.user?.avatar_url || ''}"
                 style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;"
                 onerror="this.src='https://via.placeholder.com/32'" />
            <div>
              <div style="font-weight: 600; color: #333;">
                ${thought.user?.first_name || ''} ${thought.user?.last_name || ''}
              </div>
              <div style="font-size: 12px; color: #666;">
                ${new Date(thought.created_at).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
          <div style="color: #333; line-height: 1.5;">
            ${thought.content}
          </div>
          ${
            thought.location.address
              ? `<div style="font-size: 12px; color: #666; margin-top: 8px;">
                  📍 ${thought.location.address}
                 </div>`
              : ''
          }
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

// 渲染用户标记
const renderUserMarkers = () => {
  if (!map) return

  // 清除旧标记
  userMarkers.forEach(marker => marker.setMap(null))
  userMarkers = []

  props.users.forEach(user => {
    if (!user.location || !user.location.lat || !user.location.lng) {
      return
    }

    const marker = new google.maps.Marker({
      position: {
        lat: user.location.lat,
        lng: user.location.lng
      },
      map: map,
      title: user.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: user.has_thought ? 10 : 8,
        fillColor: '#3B82F6',
        fillOpacity: 0.9,
        strokeColor: 'white',
        strokeWeight: 2
      }
    })

    // 点击事件
    marker.addListener('click', () => {
      const content = `
        <div style="max-width: 200px; padding: 8px;">
          <div style="display: flex; align-items: center;">
            <img src="${user.avatar || ''}"
                 style="width: 40px; height: 40px; border-radius: 50%; margin-right: 8px;"
                 onerror="this.src='https://via.placeholder.com/40'" />
            <div>
              <div style="font-weight: 600; color: #333;">${user.name}</div>
              ${
                user.has_thought
                  ? '<div style="font-size: 12px; color: #10B981;">✓ 有想法</div>'
                  : '<div style="font-size: 12px; color: #666;">在线</div>'
              }
            </div>
          </div>
        </div>
      `
      infoWindow.setContent(content)
      infoWindow.open(map, marker)
    })

    userMarkers.push(marker)
  })
}

// 调整地图视图以显示所有标记
const fitMapToMarkers = () => {
  if (!map || (thoughtMarkers.length === 0 && userMarkers.length === 0)) {
    return
  }

  const bounds = new google.maps.LatLngBounds()

  thoughtMarkers.forEach(marker => {
    bounds.extend(marker.getPosition())
  })

  userMarkers.forEach(marker => {
    bounds.extend(marker.getPosition())
  })

  map.fitBounds(bounds)

  // 限制最大缩放级别
  const listener = google.maps.event.addListener(map, 'idle', () => {
    if (map.getZoom() > 16) map.setZoom(16)
    google.maps.event.removeListener(listener)
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
