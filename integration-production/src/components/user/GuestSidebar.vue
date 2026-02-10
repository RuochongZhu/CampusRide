<template>
  <!-- Overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
    @click="$emit('close')"
  ></div>

  <!-- Sidebar -->
  <div
    :class="[
      'fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col',
      isOpen ? 'translate-x-0' : 'translate-x-full'
    ]"
  >
    <!-- Header -->
    <div class="bg-gradient-to-r from-[#C24D45] to-[#A93C35] p-6 text-white flex-shrink-0">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-2xl font-bold">Guest Account</h2>
        <button @click="$emit('close')" class="text-white hover:text-gray-200">
          <CloseOutlined class="text-xl" />
        </button>
      </div>

      <!-- Guest Info -->
      <div class="flex items-center space-x-4">
        <div class="relative">
          <img
            :src="defaultAvatar"
            alt="Guest Avatar"
            class="w-20 h-20 rounded-full border-4 border-white object-cover"
          />
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold">Guest User</h3>
          <p class="text-white/80 text-sm">Limited access mode</p>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex-1 overflow-y-auto flex flex-col p-6">
      <!-- Guest Information Card -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-start space-x-3">
          <InfoCircleOutlined class="text-blue-500 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <h4 class="font-semibold text-blue-900 mb-2">Guest Mode</h4>
            <p class="text-sm text-blue-700 mb-2">
              You are currently browsing as a guest. Guest users can:
            </p>
            <ul class="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Browse activities, marketplace, and carpooling</li>
              <li>View public content</li>
              <li>Access system group chats</li>
            </ul>
            <p class="text-sm text-blue-700 mt-3 font-medium">
              To access all features, please sign in or create an account.
            </p>
          </div>
        </div>
      </div>

      <!-- Limitations Card -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div class="flex items-start space-x-3">
          <ExclamationCircleOutlined class="text-yellow-600 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <h4 class="font-semibold text-yellow-900 mb-2">Guest Limitations</h4>
            <ul class="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Cannot access your profile</li>
              <li>Cannot send private messages</li>
              <li>Cannot create activities or posts</li>
              <li>Cannot join groups</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <a-button
          type="primary"
          block
          size="large"
          @click="goToLogin"
          class="!bg-[#B31B1B] hover:!bg-[#8F1515] border-none"
        >
          <LoginOutlined class="mr-2" />
          Sign In / Register
        </a-button>
        
        <a-button
          block
          size="large"
          @click="handleLogout"
          class="!text-gray-600 hover:!text-gray-800 border-gray-300"
        >
          <LogoutOutlined class="mr-2" />
          Continue as Guest
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CloseOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  LoginOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'logout'])

const router = useRouter()
const authStore = useAuthStore()
const defaultAvatar = '/Profile_Photo.jpg'

// Go to login page
const goToLogin = () => {
  emit('close')
  // Clear guest session
  localStorage.removeItem('userToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userData')
  authStore.logout()
  router.push('/login')
}

// Logout handler (just close sidebar, stay as guest)
const handleLogout = () => {
  emit('close')
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
