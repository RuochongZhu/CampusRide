<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="flex w-full max-w-5xl shadow-lg rounded-lg overflow-hidden">
      <!-- Left side with image -->
      <div class="hidden md:block w-2/5 bg-[#B31B1B] p-8 flex items-center justify-center">
        <div class="w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src="https://public.readdy.ai/ai/img_res/081b30f0b98732b66b8b3cd229f310e5.jpg"
            alt="Campus Ride Home"
            class="object-cover w-full h-auto"
          />
        </div>
      </div>
      <!-- Right side with reset password form -->
      <div class="w-full md:w-3/5 bg-white p-8 md:p-12">
        <div class="max-w-md mx-auto">
          <div class="flex items-center mb-6">
            <h1 class="text-2xl font-bold text-[#B31B1B]">Campus Ride Home</h1>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Reset Password</h2>
          
          <!-- 错误提示 -->
          <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ errorMessage }}
          </div>
          
          <!-- 成功提示 -->
          <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {{ successMessage }}
          </div>

          <p class="text-gray-600 mb-6">
            Enter your new password below. It must be exactly 8 characters using only letters and numbers.
          </p>

          <form @submit.prevent="handleResetPassword">
            <!-- 新密码 -->
            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                id="password"
                v-model="form.password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
                placeholder="8 characters, letters and numbers"
                required
              />
            </div>
            
            <!-- 确认密码 -->
            <div class="mb-6">
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                v-model="form.confirmPassword"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
                placeholder="Confirm your new password"
                required
              />
            </div>
            
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-[#B31B1B] hover:bg-[#8F1515] text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
          
          <div class="text-center mt-6">
            <button
              @click="goToLogin"
              class="text-sm text-[#B31B1B] hover:text-[#8F1515] underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authAPI } from '../utils/api'

const router = useRouter()
const route = useRoute()

// 表单数据
const form = ref({
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resetToken = ref('')

// Use centralized API client

// 获取URL中的token
onMounted(() => {
  resetToken.value = route.params.token
  if (!resetToken.value) {
    errorMessage.value = 'Invalid reset link. Please request a new password reset.'
  }
})

// 清除提示信息
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

// 表单验证
const validateForm = () => {
  clearMessages()
  
  if (!form.value.password || !form.value.confirmPassword) {
    errorMessage.value = 'Please fill in all fields'
    return false
  }
  
  // Password validation: exactly 8 characters, letters and numbers only
  if (form.value.password.length !== 8) {
    errorMessage.value = 'Password must be exactly 8 characters'
    return false
  }
  
  const passwordRegex = /^[a-zA-Z0-9]{8}$/
  if (!passwordRegex.test(form.value.password)) {
    errorMessage.value = 'Password must contain only letters and numbers'
    return false
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return false
  }
  
  return true
}

// 处理密码重置
const handleResetPassword = async () => {
  if (!validateForm()) return
  
  if (!resetToken.value) {
    errorMessage.value = 'Invalid reset link. Please request a new password reset.'
    return
  }
  
  isLoading.value = true
  clearMessages()
  
  try {
    const { data } = await authAPI.resetPassword(resetToken.value, form.value.password)
    if (data?.success) {
      successMessage.value = 'Password reset successfully! You can now log in with your new password.'
      // Don't force-navigation here; users may want to copy/save info or retry.
      // Provide an explicit "Back to Login" button instead.
    } else {
      errorMessage.value = data?.error?.message || 'Failed to reset password'
    }
  } catch (error) {
    console.error('Reset password error:', error)
    errorMessage.value = error?.response?.data?.error?.message || 'Network error. Please check your connection and try again.'
  } finally {
    isLoading.value = false
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* 保留原有样式 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
