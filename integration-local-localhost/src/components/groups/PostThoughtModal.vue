<template>
  <a-modal
    :open="open"
    title="Post Activity"
    @ok="handlePost"
    @cancel="handleCancel"
    :confirmLoading="posting"
    :okButtonProps="{ style: { backgroundColor: '#C24D45', borderColor: '#C24D45' } }"
    width="700px"
  >
    <a-form
      :model="formData"
      layout="vertical"
      class="mt-4"
    >
      <!-- Activity Title -->
      <a-form-item label="Activity Title" required>
        <a-input
          v-model:value="formData.title"
          placeholder="Enter activity title..."
          :maxlength="100"
          show-count
        />
      </a-form-item>

      <!-- Activity Content -->
      <a-form-item label="Activity Content" required>
        <a-textarea
          v-model:value="formData.content"
          placeholder="Describe activity details..."
          :rows="4"
          :maxlength="500"
          show-count
        />
      </a-form-item>

      <!-- Activity Time -->
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="Start Time" required>
            <a-date-picker
              v-model:value="formData.start_time"
              show-time
              format="YYYY-MM-DD HH:mm"
              placeholder="Select start time"
              style="width: 100%"
              :disabled-date="disabledDate"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="End Time" required>
            <a-date-picker
              v-model:value="formData.end_time"
              show-time
              format="YYYY-MM-DD HH:mm"
              placeholder="Select end time"
              style="width: 100%"
              :disabled-date="disabledEndDate"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <!-- Publish to -->
      <a-form-item label="Publish to">
        <a-select
          v-model:value="formData.group_id"
          placeholder="Select group (or global)"
        >
          <a-select-option :value="null">
            <GlobalOutlined class="mr-2" />
            Global (visible to everyone)
          </a-select-option>
          <a-select-option
            v-for="group in myGroups"
            :key="group.id"
            :value="group.id"
          >
            <TeamOutlined class="mr-2" />
            {{ group.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- Location Selection -->
      <a-form-item label="Activity Location" required>
        <a-radio-group v-model:value="locationInputMode" class="mb-3">
          <a-radio-button value="current">Use current location</a-radio-button>
          <a-radio-button value="manual">Enter location manually</a-radio-button>
        </a-radio-group>

        <!-- Current Location Mode -->
        <div v-if="locationInputMode === 'current'">
          <a-button
            @click="getLocation"
            :loading="gettingLocation"
            block
          >
            <template #icon><EnvironmentOutlined /></template>
            {{ formData.location ? 'Location retrieved ✓' : 'Get current location' }}
          </a-button>
        </div>

        <!-- Manual Input Mode -->
        <div v-else>
          <a-input
            v-model:value="formData.location_address"
            placeholder="Enter activity location, e.g.: Library 301, Gymnasium..."
            class="mb-2"
          />
          <a-input-group compact>
            <a-input
              v-model:value="manualLocation.lat"
              placeholder="Latitude (optional)"
              style="width: 50%"
              @change="updateManualLocation"
            />
            <a-input
              v-model:value="manualLocation.lng"
              placeholder="Longitude (optional)"
              style="width: 50%"
              @change="updateManualLocation"
            />
          </a-input-group>
          <div class="text-xs text-gray-500 mt-1">
            Note: Address is required, coordinates are optional
          </div>
        </div>

        <div v-if="formData.location" class="mt-3 p-3 bg-gray-50 rounded">
          <div class="text-sm text-gray-600">
            <div class="flex items-start">
              <EnvironmentOutlined class="mr-2 mt-1 text-[#C24D45]" />
              <div>
                <div class="font-medium">Location Information</div>
                <div class="text-xs mt-1">
                  {{ formData.location.address || formData.location_address || `Coordinates: ${formData.location.lat?.toFixed(4)}, ${formData.location.lng?.toFixed(4)}` }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-form-item>

      <a-form-item label="Reward Points">
        <a-input-number
          v-model:value="formData.reward_points"
          :min="0"
          :max="1000"
          placeholder="Earned after check-in"
          style="width: 100%"
        />
      </a-form-item>

      <!-- Location Verification -->
      <a-form-item>
        <a-checkbox v-model:checked="formData.location_verification">
          Enable location verification (participants must check in near activity location)
        </a-checkbox>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  GlobalOutlined,
  TeamOutlined,
  EnvironmentOutlined
} from '@ant-design/icons-vue'
import { thoughtAPI, activitiesAPI } from '@/utils/api'
import { getCurrentLocation } from '@/utils/geocoding'
import dayjs from 'dayjs'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  myGroups: {
    type: Array,
    default: () => []
  },
  defaultGroup: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:open', 'success'])

const posting = ref(false)
const gettingLocation = ref(false)
const locationInputMode = ref('current')
const manualLocation = ref({
  lat: '',
  lng: ''
})

const formData = ref({
  title: '',
  content: '',
  group_id: null,
  location: null,
  location_address: '',
  start_time: null,
  end_time: null,
  reward_points: 10,
  location_verification: true
})

// Watch open property changes, reset form
watch(() => props.open, (newVal) => {
  if (newVal) {
    formData.value = {
      title: '',
      content: '',
      group_id: props.defaultGroup || null,
              location: null,
      location_address: '',
      start_time: null,
      end_time: null,
          reward_points: 10,
      location_verification: true
    }
    locationInputMode.value = 'current'
    manualLocation.value = { lat: '', lng: '' }
  }
})

// Disable past dates
const disabledDate = (current) => {
  return current && current < dayjs().startOf('day')
}

// Disable end time before start time
const disabledEndDate = (current) => {
  if (!formData.value.start_time) {
    return current && current < dayjs().startOf('day')
  }
  return current && current < dayjs(formData.value.start_time)
}

// Get current location
const getLocation = async () => {
  gettingLocation.value = true
  try {
    const location = await getCurrentLocation()
    formData.value.location = location
    message.success('Location retrieved successfully')
  } catch (error) {
    message.error(error.message || 'Failed to get location')
  } finally {
    gettingLocation.value = false
  }
}

// Update manually entered location
const updateManualLocation = () => {
  const lat = parseFloat(manualLocation.value.lat)
  const lng = parseFloat(manualLocation.value.lng)

  if (formData.value.location_address) {
    formData.value.location = {
      address: formData.value.location_address,
      lat: !isNaN(lat) ? lat : null,
      lng: !isNaN(lng) ? lng : null
    }
  }
}

// Watch manual address input changes
watch(() => formData.value.location_address, (newAddress) => {
  if (locationInputMode.value === 'manual' && newAddress) {
    updateManualLocation()
  }
})

// Close modal
const handleCancel = () => {
  emit('update:open', false)
}

// Post activity
const handlePost = async () => {
  // Validate required fields
  if (!formData.value.title || formData.value.title.trim().length === 0) {
    message.error('Please enter activity title')
    return
  }

  if (!formData.value.content || formData.value.content.trim().length === 0) {
    message.error('Please enter activity content')
    return
  }

  if (!formData.value.start_time) {
    message.error('Please select start time')
    return
  }

  if (!formData.value.end_time) {
    message.error('Please select end time')
    return
  }

  if (dayjs(formData.value.end_time).isBefore(formData.value.start_time)) {
    message.error('End time cannot be before start time')
    return
  }

  // Validate location
  if (locationInputMode.value === 'current') {
    if (!formData.value.location) {
      message.error('Please get location')
      return
    }
  } else {
    if (!formData.value.location_address || formData.value.location_address.trim().length === 0) {
      message.error('Please enter activity location')
      return
    }
    updateManualLocation()
  }


  posting.value = true
  try {
    // Prepare activity data - ensure field names match backend validation
    const activityData = {
      title: formData.value.title.trim(),
      description: formData.value.content.trim(),
      category: 'social',
      type: 'team',
      startTime: dayjs(formData.value.start_time).toISOString(),
      endTime: dayjs(formData.value.end_time).toISOString(),
      location: formData.value.location?.address || formData.value.location_address || '',
      // Only send coordinates if they are numeric
      locationCoordinates: (formData.value.location?.lat && formData.value.location?.lng)
        ? {
            lat: parseFloat(formData.value.location.lat),
            lng: parseFloat(formData.value.location.lng)
          }
        : null,
      rewardPoints: formData.value.reward_points || 0,
      locationVerification: formData.value.location_verification,
      status: 'published',
      group_id: formData.value.group_id || null
    }

    console.log('📤 Sending activity data:', activityData)

    // Call create activity API
    const response = await activitiesAPI.createActivity(activityData)

    if (response.data.success) {
      message.success('Activity posted successfully!')
      emit('success', response.data.data.activity)
      emit('update:open', false)
    }
  } catch (error) {
    console.error('❌ Failed to post activity:', error)
    console.error('📋 Error details:', error.response?.data)

    // Show detailed validation errors
    if (error.response?.data?.error?.details) {
      const errorMessages = error.response.data.error.details
        .map(detail => detail.msg || detail.message)
        .join('; ')
      message.error(`Validation failed: ${errorMessages}`)
    } else {
      message.error(error.response?.data?.error?.message || 'Publication failed')
    }
  } finally {
    posting.value = false
  }
}
</script>
