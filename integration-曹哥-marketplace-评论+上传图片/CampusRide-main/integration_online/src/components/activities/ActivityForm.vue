<template>
  <div class="activity-form">
    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      layout="vertical"
      @finish="onSubmit"
      @finishFailed="onFinishFailed"
    >
      <div class="form-steps">
        <a-steps :current="currentStep" size="small">
          <a-step title="Basic Info" />
          <a-step title="Details" />
          <a-step title="Settings" />
        </a-steps>
      </div>

      <!-- Step 1: Basic Information -->
      <div v-show="currentStep === 0" class="form-step">
        <h3>Basic Information</h3>

        <a-form-item label="Activity Title" name="title">
          <a-input
            v-model:value="formData.title"
            placeholder="Enter activity title"
            :maxlength="100"
            show-count
          />
        </a-form-item>

        <a-form-item label="Description" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="Describe your activity"
            :rows="4"
            :maxlength="500"
            show-count
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Category" name="category">
              <a-select v-model:value="formData.category" placeholder="Select category">
                <a-select-option value="academic">Academic</a-select-option>
                <a-select-option value="sports">Sports</a-select-option>
                <a-select-option value="social">Social</a-select-option>
                <a-select-option value="volunteer">Volunteer</a-select-option>
                <a-select-option value="career">Career</a-select-option>
                <a-select-option value="cultural">Cultural</a-select-option>
                <a-select-option value="technology">Technology</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Type" name="type">
              <a-select v-model:value="formData.type" placeholder="Select type">
                <a-select-option value="individual">Individual</a-select-option>
                <a-select-option value="team">Team</a-select-option>
                <a-select-option value="competition">Competition</a-select-option>
                <a-select-option value="workshop">Workshop</a-select-option>
                <a-select-option value="seminar">Seminar</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <!-- Step 2: Time and Location -->
      <div v-show="currentStep === 1" class="form-step">
        <h3>Time & Location</h3>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Start Time" name="startTime">
              <a-date-picker
                v-model:value="formData.startTime"
                show-time
                format="YYYY-MM-DD HH:mm"
                placeholder="Select start time"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="End Time" name="endTime">
              <a-date-picker
                v-model:value="formData.endTime"
                show-time
                format="YYYY-MM-DD HH:mm"
                placeholder="Select end time"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Registration Deadline" name="registrationDeadline">
          <a-date-picker
            v-model:value="formData.registrationDeadline"
            show-time
            format="YYYY-MM-DD HH:mm"
            placeholder="Optional registration deadline"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="Location" name="location">
          <a-input
            v-model:value="formData.location"
            placeholder="Enter location (e.g., Cornell University Library)"
            suffix-icon
          >
            <template #suffix>
              <EnvironmentOutlined @click="openLocationPicker" class="location-icon" />
            </template>
          </a-input>
        </a-form-item>

        <div v-if="formData.locationCoordinates" class="location-preview">
          <a-tag color="blue">
            <EnvironmentOutlined />
            Location set: {{ formData.locationCoordinates.lat.toFixed(4) }}, {{ formData.locationCoordinates.lng.toFixed(4) }}
          </a-tag>
        </div>
      </div>

      <!-- Step 3: Settings -->
      <div v-show="currentStep === 2" class="form-step">
        <h3>Activity Settings</h3>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Max Participants" name="maxParticipants">
              <a-input-number
                v-model:value="formData.maxParticipants"
                :min="1"
                :max="1000"
                placeholder="No limit"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Entry Fee (Points)" name="entryFeePoints">
              <a-input-number
                v-model:value="formData.entryFeePoints"
                :min="0"
                :max="1000"
                placeholder="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Reward Points" name="rewardPoints">
              <a-input-number
                v-model:value="formData.rewardPoints"
                :min="0"
                :max="1000"
                placeholder="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Entry Fee ($)" name="entryFee">
              <a-input-number
                v-model:value="formData.entryFee"
                :min="0"
                :max="1000"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Requirements" name="requirements">
          <a-textarea
            v-model:value="formData.requirements"
            placeholder="Any special requirements or notes"
            :rows="3"
            :maxlength="300"
            show-count
          />
        </a-form-item>

        <a-form-item label="Tags" name="tags">
          <a-select
            v-model:value="formData.tags"
            mode="tags"
            placeholder="Add tags (press Enter to add)"
            :max-tag-count="5"
          />
        </a-form-item>

        <a-form-item label="Contact Information">
          <a-input
            v-model:value="formData.contactInfo.email"
            placeholder="Contact email (optional)"
            type="email"
          />
        </a-form-item>

        <div class="advanced-settings">
          <a-checkbox v-model:checked="formData.locationVerification">
            Require location verification for check-in
          </a-checkbox>
          <br>
          <a-checkbox v-model:checked="formData.autoComplete">
            Auto-complete activity when time ends
          </a-checkbox>
        </div>
      </div>

      <!-- Form Navigation -->
      <div class="form-actions">
        <a-space>
          <a-button v-if="currentStep > 0" @click="prevStep">
            Previous
          </a-button>
          <a-button
            v-if="currentStep < 2"
            type="primary"
            @click="nextStep"
            :disabled="!canProceed"
          >
            Next
          </a-button>
          <a-button
            v-if="currentStep === 2"
            type="primary"
            html-type="submit"
            :loading="submitting"
          >
            Create Activity
          </a-button>
          <a-button @click="$emit('cancel')">
            Cancel
          </a-button>
        </a-space>
      </div>
    </a-form>

    <!-- Location Picker Modal -->
    <LocationPickerModal
      v-model:open="showLocationPicker"
      @location-selected="onLocationSelected"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  InputNumber as AInputNumber,
  Textarea as ATextarea,
  Select as ASelect,
  SelectOption as ASelectOption,
  DatePicker as ADatePicker,
  Button as AButton,
  Steps as ASteps,
  Step as AStep,
  Row as ARow,
  Col as ACol,
  Space as ASpace,
  Checkbox as ACheckbox,
  Tag as ATag,
  message
} from 'ant-design-vue'
import { EnvironmentOutlined } from '@ant-design/icons-vue'
import { useActivityStore } from '../../stores/activity'
import LocationPickerModal from './LocationPickerModal.vue'
import dayjs from 'dayjs'

// Props
const props = defineProps({
  activity: {
    type: Object,
    default: null
  },
  mode: {
    type: String,
    default: 'create' // 'create' or 'edit'
  }
})

// Emits
const emit = defineEmits(['activity-created', 'activity-updated', 'cancel'])

// Store
const activityStore = useActivityStore()

// Form data
const formRef = ref()
const currentStep = ref(0)
const submitting = ref(false)
const showLocationPicker = ref(false)

const formData = reactive({
  title: '',
  description: '',
  category: undefined,
  type: undefined,
  startTime: null,
  endTime: null,
  registrationDeadline: null,
  location: '',
  locationCoordinates: null,
  maxParticipants: null,
  entryFee: 0,
  entryFeePoints: 0,
  rewardPoints: 0,
  requirements: '',
  tags: [],
  contactInfo: {
    email: ''
  },
  locationVerification: false,
  autoComplete: true
})

// Form validation rules
const formRules = {
  title: [
    { required: true, message: 'Please enter activity title', trigger: 'blur' },
    { min: 5, max: 100, message: 'Title should be 5-100 characters', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please enter description', trigger: 'blur' },
    { min: 10, max: 500, message: 'Description should be 10-500 characters', trigger: 'blur' }
  ],
  category: [
    { required: true, message: 'Please select a category', trigger: 'change' }
  ],
  type: [
    { required: true, message: 'Please select a type', trigger: 'change' }
  ],
  startTime: [
    { required: true, message: 'Please select start time', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: 'Please select end time', trigger: 'change' }
  ],
  location: [
    { required: true, message: 'Please enter location', trigger: 'blur' }
  ]
}

// Computed
const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return formData.title && formData.description && formData.category && formData.type
  } else if (currentStep.value === 1) {
    return formData.startTime && formData.endTime && formData.location
  }
  return true
})

// Methods
const nextStep = async () => {
  try {
    if (currentStep.value === 0) {
      await formRef.value.validateFields(['title', 'description', 'category', 'type'])
    } else if (currentStep.value === 1) {
      await formRef.value.validateFields(['startTime', 'endTime', 'location'])
      validateTimeOrder()
    }
    currentStep.value++
  } catch (error) {
    // Validation failed
  }
}

const prevStep = () => {
  currentStep.value--
}

const validateTimeOrder = () => {
  if (formData.startTime && formData.endTime) {
    if (dayjs(formData.endTime).isBefore(formData.startTime)) {
      throw new Error('End time must be after start time')
    }
  }

  if (formData.registrationDeadline && formData.startTime) {
    if (dayjs(formData.registrationDeadline).isAfter(formData.startTime)) {
      throw new Error('Registration deadline must be before start time')
    }
  }
}

const onSubmit = async () => {
  try {
    submitting.value = true

    // Validate all fields
    await formRef.value.validate()
    validateTimeOrder()

    const activityData = {
      ...formData,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
      registrationDeadline: formData.registrationDeadline?.toISOString()
    }

    let result
    if (props.mode === 'edit' && props.activity) {
      result = await activityStore.updateActivity(props.activity.id, activityData)
      if (result.success) {
        emit('activity-updated', result.activity)
        message.success('Activity updated successfully!')
      }
    } else {
      result = await activityStore.createActivity(activityData)
      if (result.success) {
        emit('activity-created', result.activity)
        message.success('Activity created successfully!')
      }
    }

    if (!result.success) {
      message.error(result.error || 'Failed to save activity')
    }
  } catch (error) {
    console.error('Failed to submit form:', error)
    message.error('Please check all required fields')
  } finally {
    submitting.value = false
  }
}

const onFinishFailed = (errorInfo) => {
  console.error('Form validation failed:', errorInfo)
  message.error('Please check all required fields')
}

const openLocationPicker = () => {
  showLocationPicker.value = true
}

const onLocationSelected = (location) => {
  formData.location = location.address
  formData.locationCoordinates = {
    lat: location.lat,
    lng: location.lng
  }
  showLocationPicker.value = false
}

// Initialize form data if editing
if (props.mode === 'edit' && props.activity) {
  Object.assign(formData, {
    ...props.activity,
    startTime: dayjs(props.activity.start_time),
    endTime: dayjs(props.activity.end_time),
    registrationDeadline: props.activity.registration_deadline ? dayjs(props.activity.registration_deadline) : null,
    locationCoordinates: props.activity.location_coordinates,
    maxParticipants: props.activity.max_participants,
    entryFee: props.activity.entry_fee,
    entryFeePoints: props.activity.entry_fee_points,
    rewardPoints: props.activity.reward_points,
    contactInfo: props.activity.contact_info || { email: '' },
    locationVerification: props.activity.location_verification,
    autoComplete: props.activity.auto_complete
  })
}

// Watch for time validation
watch([() => formData.startTime, () => formData.endTime], () => {
  if (formData.startTime && formData.endTime && dayjs(formData.endTime).isBefore(formData.startTime)) {
    formData.endTime = null
  }
})
</script>

<style scoped>
.activity-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-steps {
  margin-bottom: 24px;
}

.form-step {
  min-height: 400px;
  padding: 16px 0;
}

.form-step h3 {
  margin-bottom: 24px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.form-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.location-preview {
  margin-top: 8px;
}

.location-icon {
  cursor: pointer;
  color: #C24D45;
}

.location-icon:hover {
  color: #A93C35;
}

.advanced-settings {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  margin-top: 16px;
}

.advanced-settings .ant-checkbox-wrapper {
  margin-bottom: 8px;
}

:deep(.ant-steps-item-title) {
  font-size: 14px !important;
}

:deep(.ant-input-number) {
  width: 100%;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}
</style>