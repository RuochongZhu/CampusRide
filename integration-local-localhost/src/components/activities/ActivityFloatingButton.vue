<template>
  <div class="activity-floating-button">
    <a-tooltip placement="left" :title="tooltipText">
      <a-button
        type="primary"
        shape="circle"
        size="large"
        :icon="h(CalendarOutlined)"
        class="fab-button"
        @click="$emit('click')"
      />
    </a-tooltip>

    <!-- Activity Count Badge -->
    <a-badge
      v-if="activityCount > 0"
      :count="activityCount"
      :number-style="{ backgroundColor: '#ff4d4f' }"
      class="activity-badge"
    />
  </div>
</template>

<script setup>
import { h, computed } from 'vue'
import {
  Button as AButton,
  Tooltip as ATooltip,
  Badge as ABadge
} from 'ant-design-vue'
import { CalendarOutlined } from '@ant-design/icons-vue'

// Props
const props = defineProps({
  activityCount: {
    type: Number,
    default: 0
  },
  hasNewActivities: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['click'])

// Computed
const tooltipText = computed(() => {
  if (props.activityCount > 0) {
    return `Campus Activities (${props.activityCount} nearby)`
  }
  return 'Campus Activities'
})
</script>

<style scoped>
.activity-floating-button {
  position: fixed;
  bottom: 140px; /* Position above any existing FABs */
  right: 20px;
  z-index: 1000;
}

.fab-button {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #C24D45 0%, #A93C35 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(194, 77, 69, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-button:hover {
  background: linear-gradient(135deg, #A93C35 0%, #8B2F29 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(194, 77, 69, 0.4);
}

.fab-button:active {
  transform: translateY(0);
}

.fab-button .anticon {
  font-size: 20px;
  color: white;
}

.activity-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  z-index: 1001;
}

:deep(.activity-badge .ant-badge-count) {
  background-color: #ff4d4f;
  border: 2px solid white;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  line-height: 16px;
  border-radius: 10px;
}

/* Pulse animation for new activities */
.fab-button.has-new {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 12px rgba(194, 77, 69, 0.3);
  }
  50% {
    box-shadow: 0 4px 12px rgba(194, 77, 69, 0.6);
  }
  100% {
    box-shadow: 0 4px 12px rgba(194, 77, 69, 0.3);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .activity-floating-button {
    bottom: 80px;
    right: 16px;
  }

  .fab-button {
    width: 48px;
    height: 48px;
  }

  .fab-button .anticon {
    font-size: 18px;
  }
}
</style>