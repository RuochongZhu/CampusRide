<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-[#B31B1B] mx-auto mb-4"></div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Verifying Your Email</h2>
        <p class="text-gray-600">Please wait while we verify your email address...</p>
      </div>

      <!-- Success State -->
      <div v-else-if="verificationStatus === 'success'" class="text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
        <p class="text-gray-600 mb-6">Your email address has been successfully verified. You can now log in to your Campus Ride account.</p>
        <button
          @click="goToLogin"
          class="w-full bg-[#B31B1B] hover:bg-[#8F1515] text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
        >
          Go to Login
        </button>
      </div>

      <!-- Already Verified State -->
      <div v-else-if="verificationStatus === 'already_verified'" class="text-center">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Already Verified</h2>
        <p class="text-gray-600 mb-6">Your email address has already been verified. You can log in to your account.</p>
        <button
          @click="goToLogin"
          class="w-full bg-[#B31B1B] hover:bg-[#8F1515] text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
        >
          Go to Login
        </button>
      </div>

      <!-- Error State -->
      <div v-else-if="verificationStatus === 'error'" class="text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
        <p class="text-red-600 mb-4">{{ errorMessage }}</p>
        
        <!-- Resend verification option -->
        <div class="bg-gray-50 rounded-md p-4 mb-4">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Need a new verification link?</h3>
          <div class="flex space-x-2">
            <input
              type="email"
              v-model="resendEmail"
              placeholder="Enter your email"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#B31B1B]"
            />
            <button
              @click="resendVerification"
              :disabled="isResending"
              class="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isResending ? 'Sending...' : 'Resend' }}
            </button>
          </div>
        </div>

        <button
          @click="goToLogin"
          class="w-full bg-[#B31B1B] hover:bg-[#8F1515] text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
        >
          Back to Login
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authAPI } from '../utils/api'

const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const verificationStatus = ref('')
const errorMessage = ref('')
const resendEmail = ref('')
const isResending = ref(false)

// Use centralized API client

// 验证邮箱
const verifyEmail = async () => {
  const token = route.params.token
  
  if (!token) {
    verificationStatus.value = 'error'
    errorMessage.value = 'Invalid verification link'
    isLoading.value = false
    return
  }

  try {
    const { data } = await authAPI.verifyEmail(token)
    if (data?.success) {
      verificationStatus.value = data.message?.includes('already verified') ? 'already_verified' : 'success'
    } else {
      verificationStatus.value = 'error'
      if (data?.error?.code === 'TOKEN_EXPIRED') {
        errorMessage.value = 'The verification link has expired. Please request a new verification email.'
      } else if (data?.error?.code === 'INVALID_TOKEN') {
        errorMessage.value = 'The verification link is invalid or has already been used.'
      } else {
        errorMessage.value = data?.error?.message || 'Verification failed. Please try again.'
      }
    }
  } catch (error) {
    console.error('Verification error:', error)
    verificationStatus.value = 'error'
    errorMessage.value = error?.response?.data?.error?.message || 'Network error. Please check your connection and try again.'
  } finally {
    isLoading.value = false
  }
}

// 重发验证邮件
const resendVerification = async () => {
  if (!resendEmail.value) {
    alert('Please enter your email address')
    return
  }

  isResending.value = true

  try {
    const { data } = await authAPI.resendVerification(resendEmail.value)
    if (data?.success) {
      alert('Verification email sent! Please check your inbox.')
      resendEmail.value = ''
    } else {
      alert(data?.error?.message || 'Failed to send verification email')
    }
  } catch (error) {
    console.error('Resend error:', error)
    alert('Network error. Please try again.')
  } finally {
    isResending.value = false
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  verifyEmail()
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
