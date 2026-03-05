<template>
  <a-modal
    v-model:open="isVisible"
    title="Campus Activities"
    width="90%"
    style="max-width: 1200px;"
    :footer="null"
    centered
    class="activity-modal"
    @cancel="closeModal"
  >
    <div class="activity-modal-content">
      <!-- Navigation Tabs -->
      <div class="activity-nav-tabs mb-4">
        <a-radio-group v-model:value="activeTab" button-style="solid" size="large">
          <a-radio-button value="list">Browse Activities</a-radio-button>
          <a-radio-button value="my">My Activities</a-radio-button>
          <a-radio-button value="create">Create Activity</a-radio-button>
        </a-radio-group>
      </div>

      <!-- Activity List Tab -->
      <div v-if="activeTab === 'list'" class="activity-tab-content">
        <ActivityList
          :map-bounds="mapBounds"
          @activity-selected="onActivitySelected"
          @location-highlight="$emit('location-highlight', $event)"
        />
      </div>

      <!-- My Activities Tab -->
      <div v-if="activeTab === 'my'" class="activity-tab-content">
        <ActivityList
          :filter-type="'my'"
          @activity-selected="onActivitySelected"
          @location-highlight="$emit('location-highlight', $event)"
        />
      </div>

      <!-- Create Activity Tab -->
      <div v-if="activeTab === 'create'" class="activity-tab-content">
        <ActivityForm
          @activity-created="onActivityCreated"
          @cancel="activeTab = 'list'"
        />
      </div>

      <!-- Activity Detail Modal -->
      <ActivityDetail
        v-if="selectedActivity"
        :activity="selectedActivity"
        :open="showDetailModal"
        @close="closeDetailModal"
        @activity-updated="onActivityUpdated"
        @activity-joined="onActivityJoined"
        @activity-left="onActivityLeft"
        @location-highlight="$emit('location-highlight', $event)"
      />
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Modal as AModal, RadioGroup as ARadioGroup, RadioButton as ARadioButton, message } from 'ant-design-vue'
import ActivityList from './ActivityList.vue'
import ActivityForm from './ActivityForm.vue'
import ActivityDetail from './ActivityDetail.vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'list' // 'list', 'create', 'detail'
  },
  activityId: {
    type: String,
    default: null
  },
  mapBounds: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits([
  'update:visible',
  'activity-created',
  'activity-updated',
  'activity-joined',
  'activity-left',
  'location-highlight'
])

// Reactive data
const activeTab = ref('list')
const selectedActivity = ref(null)
const showDetailModal = ref(false)

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const closeModal = () => {
  emit('update:visible', false)
  activeTab.value = 'list'
  selectedActivity.value = null
  showDetailModal.value = false
}

const onActivitySelected = (activity) => {
  selectedActivity.value = activity
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedActivity.value = null
}

const onActivityCreated = (activity) => {
  message.success('Activity created successfully!')
  activeTab.value = 'list'
  emit('activity-created', activity)
}

const onActivityUpdated = (activity) => {
  message.success('Activity updated successfully!')
  emit('activity-updated', activity)
}

const onActivityJoined = (activity) => {
  message.success('Successfully joined the activity!')
  emit('activity-joined', activity)
}

const onActivityLeft = (activity) => {
  message.success('Successfully left the activity!')
  emit('activity-left', activity)
}

// Watch props
watch(() => props.mode, (newMode) => {
  if (newMode) {
    activeTab.value = newMode
  }
})

watch(() => props.visible, (newVisible) => {
  if (newVisible && props.mode) {
    activeTab.value = props.mode
  }
})
</script>

<style scoped>
.activity-modal :deep(.ant-modal-body) {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.activity-nav-tabs {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.activity-tab-content {
  min-height: 400px;
}

.activity-modal :deep(.ant-radio-button-wrapper) {
  border-radius: 6px;
  margin-right: 8px;
}

.activity-modal :deep(.ant-radio-button-wrapper-checked) {
  background-color: #C24D45;
  border-color: #C24D45;
}

.activity-modal :deep(.ant-radio-button-wrapper-checked):not(.ant-radio-button-wrapper-disabled):hover {
  background-color: #A93C35;
  border-color: #A93C35;
}
</style>