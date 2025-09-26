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
      <!-- Right side with forgot password form -->
      <div class="w-full md:w-3/5 bg-white p-8 md:p-12">
        <div class="max-w-md mx-auto">
          <div class="flex items-center mb-6">
            <h1 class="text-2xl font-bold text-[#B31B1B]">Campus Ride Home</h1>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Forgot Password</h2>
          
          <!-- 错误提示 -->
          <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ errorMessage }}
          </div>
          
          <!-- 成功提示 -->
          <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {{ successMessage }}
          </div>

          <p class="text-gray-600 mb-6">
            Enter your Cornell email address and we'll send you a link to reset your password.
          </p>

          <form @submit.prevent="handleForgotPassword">
            <!-- 邮箱 -->
            <div class="mb-6">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Cornell Email Address</label>
              <input
                type="email"
                id="email"
                v-model="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
                placeholder="your-netid@cornell.edu"
                required
              />
            </div>
            
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-[#B31B1B] hover:bg-[#8F1515] text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </form>
          
          <div class="text-center mt-6 space-y-2">
            <button
              @click="goToLogin"
              class="text-sm text-[#B31B1B] hover:text-[#8F1515] underline"
            >
              Back to Login
            </button>
            <br>
            <button
              @click="goToResendVerification"
              class="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Need to verify your email instead?
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单数据
const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 后端API基础URL
const API_BASE_URL = 'http://localhost:3001/api/v1'

// 清除提示信息
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

// 表单验证
const validateForm = () => {
  clearMessages()
  
  if (!email.value) {
    errorMessage.value = 'Email address is required'
    return false
  }
  
  // Cornell email validation
  if (!email.value.endsWith('@cornell.edu')) {
    errorMessage.value = 'Email must end with @cornell.edu'
    return false
  }
  
  return true
}

// 处理忘记密码
const handleForgotPassword = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  clearMessages()
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      successMessage.value = 'Password reset email sent successfully! Please check your inbox.'
      
      // 3秒后提示用户检查邮箱
      setTimeout(() => {
        if (successMessage.value.includes('check your inbox')) {
          successMessage.value += '\n\nIf you don\'t see the email, please check your spam folder.'
        }
      }, 3000)
    } else {
      errorMessage.value = data.error?.message || 'Failed to send password reset email'
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    errorMessage.value = 'Network error. Please check your connection and try again.'
  } finally {
    isLoading.value = false
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 跳转到重发验证邮件页面
const goToResendVerification = () => {
  router.push('/resend-verification')
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