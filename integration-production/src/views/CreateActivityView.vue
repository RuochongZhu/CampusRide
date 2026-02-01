<template>
  <div class="min-h-screen bg-gradient-to-br from-[#EDEEE8] to-[#E8F4F8] main-content pt-16">
    <div class="pt-8 pb-16 max-w-5xl mx-auto px-4">
      <!-- Header Section -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-[#C24D45] rounded-full mb-4">
          <PlusOutlined class="text-white text-2xl" />
        </div>
        <h1 class="text-4xl font-bold text-[#333333] mb-3">Create New Activity</h1>
        <p class="text-lg text-[#666666] max-w-2xl mx-auto">
          Organize an engaging activity and connect with fellow students. Earn <span class="text-[#C24D45] font-semibold">15 points</span> for creating meaningful activities!
        </p>
      </div>

      <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <!-- Progress Indicator -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-[#C24D45] rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-semibold">1</span>
              </div>
              <span class="text-[#333333] font-medium">Basic Information</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span class="text-gray-500 text-sm font-semibold">2</span>
              </div>
              <span class="text-gray-500 font-medium">Details & Settings</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span class="text-gray-500 text-sm font-semibold">3</span>
              </div>
              <span class="text-gray-500 font-medium">Review & Publish</span>
            </div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-[#C24D45] h-2 rounded-full transition-all duration-300" style="width: 33%"></div>
          </div>
        </div>

        <a-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          layout="vertical"
          @finish="handleSubmit"
        >
          <!-- Basic Information -->
          <div class="mb-8">
            <div class="flex items-center mb-6">
              <div class="w-1 h-8 bg-[#C24D45] rounded-full mr-4"></div>
              <h2 class="text-2xl font-bold text-[#333333]">Basic Information</h2>
            </div>
            
            <a-row :gutter="24">
              <a-col :span="24">
                <a-form-item label="Activity Title" name="title" class="mb-6">
                  <a-input 
                    v-model:value="formData.title" 
                    placeholder="Enter a descriptive title for your activity"
                    size="large"
                    class="!rounded-lg !border-gray-300 focus:!border-[#C24D45] focus:!shadow-lg"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="Category" name="category" class="mb-6">
                  <a-select
                    v-model:value="formData.category"
                    placeholder="Select category"
                    size="large"
                    class="!rounded-lg"
                  >
                    <a-select-option value="academic">
                      <div class="flex items-center">
                        <BookOutlined class="mr-2 text-blue-500" />
                        Academic
                      </div>
                    </a-select-option>
                    <a-select-option value="sports">
                      <div class="flex items-center">
                        <TrophyOutlined class="mr-2 text-green-500" />
                        Sports
                      </div>
                    </a-select-option>
                    <a-select-option value="social">
                      <div class="flex items-center">
                        <TeamOutlined class="mr-2 text-purple-500" />
                        Social
                      </div>
                    </a-select-option>
                    <a-select-option value="volunteer">
                      <div class="flex items-center">
                        <HeartOutlined class="mr-2 text-red-500" />
                        Volunteer
                      </div>
                    </a-select-option>
                    <a-select-option value="career">
                      <div class="flex items-center">
                        <ShoppingOutlined class="mr-2 text-orange-500" />
                        Career
                      </div>
                    </a-select-option>
                    <a-select-option value="cultural">
                      <div class="flex items-center">
                        <GlobalOutlined class="mr-2 text-indigo-500" />
                        Cultural
                      </div>
                    </a-select-option>
                    <a-select-option value="technology">
                      <div class="flex items-center">
                        <CodeOutlined class="mr-2 text-cyan-500" />
                        Technology
                      </div>
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Publish to Group" name="groupId" class="mb-6">
                  <a-select
                    v-model:value="formData.groupId"
                    placeholder="Select a group"
                    size="large"
                    class="!rounded-lg"
                    :loading="loadingGroups"
                    :disabled="myGroups.length === 0"
                  >
                    <a-select-option
                      v-for="group in myGroups"
                      :key="group.id"
                      :value="group.id"
                    >
                      <div class="flex items-center">
                        <TeamOutlined class="mr-2 text-blue-500" />
                        {{ group.name }}
                      </div>
                    </a-select-option>
                  </a-select>
                  <div v-if="myGroups.length === 0 && !loadingGroups" class="text-sm text-orange-500 mt-2">
                    You need to join a group before creating an activity.
                    <router-link to="/groups" class="text-blue-500 underline">Browse Groups</router-link>
                  </div>
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="24">
              <a-col :span="24">
                <a-form-item name="urgentNeed" class="mb-6">
                  <a-checkbox
                    v-model:checked="formData.urgentNeed"
                    class="text-lg"
                  >
                    <span class="flex items-center">
                      <ExclamationCircleOutlined class="mr-2 text-red-500" />
                      <span class="font-medium">Urgent Need</span>
                    </span>
                  </a-checkbox>
                  <div class="text-sm text-gray-500 mt-2">
                    Mark this if the activity requires immediate attention or has urgent deadlines
                  </div>
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="Description" name="description">
              <a-textarea 
                v-model:value="formData.description" 
                placeholder="Describe your activity in detail..."
                :rows="4"
                size="large"
              />
            </a-form-item>

            <a-form-item label="Tags" name="tags">
              <a-select
                v-model:value="formData.tags"
                mode="tags"
                placeholder="Add tags to help people find your activity"
                size="large"
              >
                <a-select-option value="Study Group">Study Group</a-select-option>
                <a-select-option value="Sports">Sports</a-select-option>
                <a-select-option value="Networking">Networking</a-select-option>
                <a-select-option value="Volunteer">Volunteer</a-select-option>
                <a-select-option value="Workshop">Workshop</a-select-option>
                <a-select-option value="Social">Social</a-select-option>
              </a-select>
            </a-form-item>

            <!-- Activity Images -->
            <a-form-item label="Activity Images" name="images">
              <div class="mb-2 text-sm text-gray-500">
                <PictureOutlined class="mr-1" />
                Upload images to showcase your activity (max 5 images)
              </div>
              <MediaUploader
                v-model="formData.images"
                :max-files="5"
                accept="image/*"
                upload-text="Upload Images"
              />
            </a-form-item>
          </div>

          <!-- Location & Time -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-[#333333] mb-6">Location & Time</h2>
            
            <a-form-item label="Location" name="location">
              <a-input 
                v-model:value="formData.location" 
                placeholder="Enter the location of your activity"
                size="large"
              />
            </a-form-item>

            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="Start Time" name="startTime">
                  <a-date-picker 
                    v-model:value="formData.startTime" 
                    show-time
                    format="YYYY-MM-DD HH:mm"
                    placeholder="Select start time"
                    size="large"
                    class="w-full"
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
                    size="large"
                    class="w-full"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="Registration Deadline" name="registrationDeadline">
              <a-date-picker 
                v-model:value="formData.registrationDeadline" 
                show-time
                format="YYYY-MM-DD HH:mm"
                placeholder="Select registration deadline (optional)"
                size="large"
                class="w-full"
              />
            </a-form-item>
          </div>

          <!-- Participants & Fees -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-[#333333] mb-6">Participants & Fees</h2>
            
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="Maximum Participants" name="maxParticipants">
                  <a-input-number 
                    v-model:value="formData.maxParticipants" 
                    placeholder="Leave empty for unlimited"
                    :min="1"
                    :max="1000"
                    size="large"
                    class="w-full"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Entry Fee ($)" name="entryFee">
                  <a-input-number 
                    v-model:value="formData.entryFee" 
                    placeholder="0.00"
                    :min="0"
                    :step="0.01"
                    :precision="2"
                    size="large"
                    class="w-full"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="Entry Fee (Points)" name="entryFeePoints">
                  <a-input-number 
                    v-model:value="formData.entryFeePoints" 
                    placeholder="0"
                    :min="0"
                    size="large"
                    class="w-full"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Reward Points" name="rewardPoints">
                  <a-input-number 
                    v-model:value="formData.rewardPoints" 
                    placeholder="Points participants will earn"
                    :min="0"
                    size="large"
                    class="w-full"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </div>

          <!-- Additional Information -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-[#333333] mb-6">Additional Information</h2>
            
            <a-form-item label="Requirements" name="requirements">
              <a-textarea 
                v-model:value="formData.requirements" 
                placeholder="Any special requirements or things participants should bring..."
                :rows="3"
                size="large"
              />
            </a-form-item>

            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="Contact Email" name="contactEmail">
                  <a-input 
                    v-model:value="formData.contactInfo.email" 
                    placeholder="your.email@university.edu"
                    size="large"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Contact Phone" name="contactPhone">
                  <a-input 
                    v-model:value="formData.contactInfo.phone" 
                    placeholder="(555) 123-4567"
                    size="large"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item name="locationVerification">
                  <a-checkbox v-model:checked="formData.locationVerification">
                    Require location verification for check-in
                  </a-checkbox>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="autoComplete">
                  <a-checkbox v-model:checked="formData.autoComplete">
                    Auto-complete activity when time ends
                  </a-checkbox>
                </a-form-item>
              </a-col>
            </a-row>
          </div>

          <!-- Submit Buttons -->
          <div class="mt-12 pt-8 border-t border-gray-200">
            <div class="bg-gradient-to-r from-[#C24D45] to-[#E74C3C] rounded-2xl p-6 text-white">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-xl font-bold mb-2">Ready to Create Your Activity?</h3>
                  <p class="text-red-100">You'll earn <span class="font-semibold">15 points</span> for creating this activity!</p>
                </div>
                <div class="flex items-center space-x-4">
                  <a-button 
                    size="large"
                    class="!rounded-lg bg-white text-gray-700 hover:bg-gray-50 border-none"
                    @click="handleCancel"
                  >
                    <ArrowLeftOutlined class="mr-2" />
                    Cancel
                  </a-button>
                  <a-button 
                    type="primary" 
                    html-type="submit" 
                    size="large"
                    class="!rounded-lg bg-white text-[#C24D45] hover:bg-gray-50 border-none font-semibold"
                    :loading="isSubmitting"
                  >
                    <template v-if="!isSubmitting">
                      <PlusOutlined class="mr-2" />
                      Create Activity
                    </template>
                    <template v-else>
                      Creating Activity...
                    </template>
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { activitiesAPI, groupAPI } from '@/utils/api'
import MediaUploader from '@/components/MediaUploader.vue'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  TrophyOutlined,
  TeamOutlined,
  HeartOutlined,
  ShoppingOutlined,
  GlobalOutlined,
  CodeOutlined,
  ExclamationCircleOutlined,
  PictureOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const formRef = ref()
const isSubmitting = ref(false)
const myGroups = ref([])
const loadingGroups = ref(false)

// Form data
const formData = reactive({
  title: '',
  description: '',
  category: '',
  groupId: null, // Required: activity must belong to a group
  urgentNeed: false,
  location: '',
  startTime: null,
  endTime: null,
  registrationDeadline: null,
  maxParticipants: null,
  entryFee: 0,
  entryFeePoints: 0,
  rewardPoints: 0,
  requirements: '',
  tags: [],
  images: [], // New: array of uploaded image URLs
  contactInfo: {
    email: '',
    phone: ''
  },
  locationVerification: false,
  autoComplete: false
})

// Fetch user's groups on mount
onMounted(async () => {
  await fetchMyGroups()
})

const fetchMyGroups = async () => {
  try {
    loadingGroups.value = true
    const response = await groupAPI.getMyGroups()
    if (response.data?.success) {
      myGroups.value = response.data.data || []
    }
  } catch (error) {
    console.error('Failed to load groups:', error)
    message.warning('Failed to load your groups. Please join a group first.')
  } finally {
    loadingGroups.value = false
  }
}

// Form validation rules
const formRules = {
  title: [
    { required: true, message: 'Please enter activity title', trigger: 'blur' },
    { min: 5, max: 255, message: 'Title must be 5-255 characters', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please enter activity description', trigger: 'blur' },
    { min: 20, max: 2000, message: 'Description must be 20-2000 characters', trigger: 'blur' }
  ],
  category: [
    { required: true, message: 'Please select category', trigger: 'change' }
  ],
  groupId: [
    { required: true, message: 'Please select a group to publish in', trigger: 'change' }
  ],
  location: [
    { required: true, message: 'Please enter location', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: 'Please select start time', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: 'Please select end time', trigger: 'change' }
  ]
}

// Methods
const handleSubmit = async () => {
  try {
    isSubmitting.value = true

    // Validate form
    await formRef.value.validate()

    // Prepare data for API
    const activityData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      groupId: formData.groupId, // Required group association
      type: 'general', // Default type since we removed the selection
      urgentNeed: formData.urgentNeed,
      location: formData.location,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
      registrationDeadline: formData.registrationDeadline?.toISOString(),
      maxParticipants: formData.maxParticipants || 10, // Default to 10 if null
      entryFee: formData.entryFee || 0,
      entryFeePoints: formData.entryFeePoints || 0,
      rewardPoints: formData.rewardPoints || 0,
      requirements: formData.requirements || '',
      tags: formData.tags || [],
      images: formData.images || [], // Include uploaded images
      contactInfo: formData.contactInfo || {},
      locationVerification: formData.locationVerification || false,
      autoComplete: formData.autoComplete || false
    }
    
    // Submit to API
    const response = await activitiesAPI.createActivity(activityData)

    if (response.data?.success) {
      message.success('Activity created successfully!')
      // 显示积分奖励提示
      showPointsNotification('+15', '创建活动获得积分！')
      router.push('/activities')
    }
  } catch (error) {
    console.error('Failed to create activity:', error)
    
    // Handle validation errors
    if (error.response?.data?.error?.details) {
      const validationErrors = error.response.data.error.details.map(detail => detail.msg).join(', ')
      message.error(`Validation failed: ${validationErrors}`)
    } else if (error.response?.data?.error?.message) {
      message.error(error.response.data.error.message)
    } else if (error.message) {
      message.error(error.message)
    } else {
      message.error('Failed to create activity')
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push('/activities')
}

// 积分提示相关
const showPointsNotification = (points, message) => {
  // 创建积分提示元素
  const notification = document.createElement('div');
  notification.className = 'fixed top-20 right-4 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-500 ease-out';
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <div class="text-2xl font-bold">${points}</div>
      <div>
        <div class="font-semibold">积分奖励！</div>
        <div class="text-sm opacity-90">${message}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // 显示动画
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // 3秒后自动消失
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
};
</script>

<style scoped>
.main-content {
  flex: 1;
}

.ant-form-item-label > label {
  font-weight: 600;
  color: #333333;
}

.ant-input,
.ant-select,
.ant-textarea,
.ant-input-number {
  border-radius: 8px;
}

.ant-btn {
  border-radius: 8px;
}
</style>
