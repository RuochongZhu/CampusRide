<template>
  <a-modal
    v-model:open="isVisible"
    title="Select Location"
    width="600px"
    :footer="null"
    class="location-picker-modal"
  >
    <div class="location-picker">
      <!-- Search Input -->
      <div class="location-search">
        <a-input
          v-model:value="searchQuery"
          placeholder="Search for a location..."
          @press-enter="searchLocation"
          size="large"
        >
          <template #suffix>
            <a-button
              type="text"
              @click="searchLocation"
              :loading="searching"
            >
              <SearchOutlined />
            </a-button>
          </template>
        </a-input>
      </div>

      <!-- Map Container -->
      <div ref="mapContainer" class="map-container"></div>

      <!-- Selected Location Info -->
      <div v-if="selectedLocation" class="selected-location">
        <div class="location-info">
          <EnvironmentOutlined />
          <div class="location-details">
            <div class="location-address">{{ selectedLocation.address }}</div>
            <div class="location-coordinates">
              {{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="modal-actions">
        <a-space>
          <a-button @click="closeModal">
            Cancel
          </a-button>
          <a-button
            type="primary"
            @click="confirmSelection"
            :disabled="!selectedLocation"
          >
            Select Location
          </a-button>
        </a-space>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  Modal as AModal,
  Input as AInput,
  Button as AButton,
  Space as ASpace
} from 'ant-design-vue'
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  initialLocation: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:visible', 'location-selected'])

// Reactive data
const mapContainer = ref(null)
const searchQuery = ref('')
const searching = ref(false)
const selectedLocation = ref(null)
let map = null
let marker = null
let geocoder = null

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const initializeMap = async () => {
  if (!mapContainer.value || !window.google) return

  try {
    // Default location (Your University)
    const defaultLocation = props.initialLocation || {
      lat: 42.4534,
      lng: -76.4735
    }

    // Initialize map
    map = new google.maps.Map(mapContainer.value, {
      center: defaultLocation,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    // Initialize geocoder
    geocoder = new google.maps.Geocoder()

    // Initialize marker
    marker = new google.maps.Marker({
      position: defaultLocation,
      map: map,
      draggable: true,
      title: 'Selected Location'
    })

    // Set initial selected location
    selectedLocation.value = {
      lat: defaultLocation.lat,
      lng: defaultLocation.lng,
      address: 'Your University, Ithaca, NY, USA'
    }

    // Add click listener to map
    map.addListener('click', (event) => {
      updateMarkerPosition(event.latLng)
    })

    // Add drag listener to marker
    marker.addListener('dragend', (event) => {
      updateMarkerPosition(event.latLng)
    })

    console.log('Map initialized successfully')
  } catch (error) {
    console.error('Failed to initialize map:', error)
  }
}

const updateMarkerPosition = async (latLng) => {
  if (!marker || !geocoder) return

  const lat = latLng.lat()
  const lng = latLng.lng()

  // Update marker position
  marker.setPosition(latLng)

  try {
    // Reverse geocode to get address
    const response = await new Promise((resolve, reject) => {
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK') {
          resolve(results)
        } else {
          reject(new Error(`Geocoding failed: ${status}`))
        }
      })
    })

    const address = response[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`

    selectedLocation.value = {
      lat,
      lng,
      address
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    selectedLocation.value = {
      lat,
      lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }
}

const searchLocation = async () => {
  if (!searchQuery.value.trim() || !geocoder) return

  try {
    searching.value = true

    const response = await new Promise((resolve, reject) => {
      geocoder.geocode({ address: searchQuery.value }, (results, status) => {
        if (status === 'OK') {
          resolve(results)
        } else {
          reject(new Error(`Geocoding failed: ${status}`))
        }
      })
    })

    if (response && response.length > 0) {
      const location = response[0].geometry.location
      const address = response[0].formatted_address

      // Update map and marker
      map.setCenter(location)
      map.setZoom(16)
      marker.setPosition(location)

      selectedLocation.value = {
        lat: location.lat(),
        lng: location.lng(),
        address
      }
    }
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    searching.value = false
  }
}

const confirmSelection = () => {
  if (selectedLocation.value) {
    emit('location-selected', selectedLocation.value)
    closeModal()
  }
}

const closeModal = () => {
  emit('update:visible', false)
}

// Watch for modal visibility
watch(isVisible, async (newVisible) => {
  if (newVisible) {
    await nextTick()
    // Initialize map when modal becomes visible
    if (!map) {
      // Wait a bit for the modal to fully render
      setTimeout(initializeMap, 100)
    } else {
      // Resize existing map
      google.maps.event.trigger(map, 'resize')
    }
  }
})

// Load Google Maps if not already loaded
onMounted(() => {
  if (!window.google) {
    console.warn('Google Maps not loaded. Make sure to include Google Maps API.')
  }
})
</script>

<style scoped>
.location-picker {
  padding: 8px 0;
}

.location-search {
  margin-bottom: 16px;
}

.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  border: 1px solid #e6f7ff;
  margin-bottom: 16px;
}

.selected-location {
  padding: 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  margin-bottom: 16px;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-details {
  flex: 1;
}

.location-address {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.location-coordinates {
  font-size: 12px;
  color: #666;
  font-family: 'Courier New', monospace;
}

.modal-actions {
  text-align: right;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

:deep(.location-picker-modal .ant-modal-body) {
  padding: 20px;
}
</style>