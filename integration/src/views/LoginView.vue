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
<!-- Right side with login form -->
<div class="w-full md:w-3/5 bg-white p-8 md:p-12">
<div class="max-w-md mx-auto">
<div class="flex items-center mb-6">
<h1 class="text-2xl font-bold text-[#B31B1B]">Campus Ride Home</h1>
</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Log in</h2>
          
          <!-- 错误提示 -->
          <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <div class="whitespace-pre-line">{{ errorMessage }}</div>
            <!-- 重发验证邮件按钮 -->
            <button
              v-if="showResendButton"
              @click="resendVerification"
              :disabled="isResending"
              class="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isResending ? '发送中...' : '重新发送验证邮件' }}
            </button>
          </div>
          
          <!-- 演示模式提示 -->
          <div class="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <div class="font-semibold mb-1">🎯 演示账号</div>
            <div class="text-sm">
              邮箱: demo@cornell.edu<br>
              密码: demo1234
            </div>
          </div>
          
          <form @submit.prevent="handleSignIn">
<div class="mb-4">
<label for="email" class="block text-sm font-medium text-gray-700 mb-1">University email address</label>
<input
type="email"
id="email"
v-model="email"
class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
placeholder="name@university.edu"
required
/>
</div>
<div class="mb-6">
<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
<input
type="password"
id="password"
v-model="password"
class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
required
/>
</div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-[#B31B1B] hover:bg-[#8F1515] text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Signing In...' : 'Sign In' }}
            </button>
</form>
<div class="relative flex items-center justify-center my-6">
<div class="border-t border-gray-300 absolute w-full"></div>
<span class="bg-white px-2 text-sm text-gray-500 relative">or</span>
</div>
          <button
            class="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md py-2 px-4 text-gray-700 hover:bg-gray-50 mb-3 transition-colors duration-300 cursor-pointer whitespace-nowrap"
            @click="signInWithGoogle"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          <button
            @click="guestLogin"
            class="w-full flex items-center justify-center bg-gray-100 text-gray-700 rounded-md py-2 px-4 hover:bg-gray-200 transition-colors duration-300 cursor-pointer whitespace-nowrap"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"/>
            </svg>
            Browse as Guest
          </button>
          <p class="mt-6 text-center text-sm text-gray-600">
            Don't have an account?
          </p>
          <button
            @click="goToRegister"
            class="mt-3 w-full bg-white border-2 border-[#B31B1B] text-[#B31B1B] font-medium py-2 px-4 rounded-md hover:bg-[#B31B1B] hover:text-white transition-colors duration-300"
          >
            Create New Account
          </button>
          
          <!-- Additional help links -->
          <div class="mt-4 text-center space-y-2">
            <button
              @click="goToResendVerification"
              class="text-sm text-[#B31B1B] hover:text-[#8F1515] underline"
            >
              Didn't receive verification email?
            </button>
            <br>
            <button
              @click="goToForgotPassword"
              class="text-sm text-[#B31B1B] hover:text-[#8F1515] underline"
            >
              Forgot your password?
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
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const showResendButton = ref(false)
const resendEmail = ref('')
const isResending = ref(false)

// 后端API基础URL
const API_BASE_URL = 'http://localhost:3001/api/v1'

// 清除错误信息
const clearError = () => {
  errorMessage.value = ''
  showResendButton.value = false
  resendEmail.value = ''
}

// 处理登录
const handleSignIn = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = '请输入邮箱和密码'
    return
  }
  
  isLoading.value = true
  clearError()
  
  // 首先尝试演示模式登录
  // 演示账号: demo@cornell.edu / demo1234
  if (email.value === 'demo@cornell.edu' && password.value === 'demo1234') {
    // 演示模式登录成功
    localStorage.setItem('userToken', 'demo-token-' + Date.now())
    localStorage.setItem('userData', JSON.stringify({
      id: 'demo-user-001',
      email: 'demo@cornell.edu',
      first_name: 'Demo User', // Use first_name to store display name
      last_name: 'User',
      student_id: 'DEMO2024',
      university: 'Cornell University',
      major: 'Computer Science',
      role: 'user',
      points: 100
    }))
    
    errorMessage.value = ''
    const redirect = router.currentRoute.value.query.redirect || '/home'
    setTimeout(() => {
      router.push(redirect)
    }, 500)
    isLoading.value = false
    return
  }
  
  // 尝试真实后端登录
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      // 保存认证信息
      localStorage.setItem('userToken', data.data.token)
      localStorage.setItem('userData', JSON.stringify(data.data.user))
      
      errorMessage.value = ''
      // 跳转到主页或指定页面
      const redirect = router.currentRoute.value.query.redirect || '/home'
      setTimeout(() => {
        router.push(redirect)
      }, 500)
    } else {
      // 如果是数据库连接错误，提供演示模式提示
      if (data.error?.code === 'DATABASE_ERROR' || response.status === 500) {
        errorMessage.value = '数据库连接失败。请使用演示账号登录：\n邮箱: demo@cornell.edu\n密码: demo1234'
      } else {
        // 如果是邮箱未验证错误
        if (data.error?.code === 'EMAIL_NOT_VERIFIED') {
          errorMessage.value = data.error.message + '\n\n点击下方按钮重新发送验证邮件：'
          showResendButton.value = true
          resendEmail.value = email.value
        } else if (data.error?.code === 'DATABASE_ERROR' || response.status === 500) {
          errorMessage.value = '数据库连接失败。请使用演示账号登录：\n邮箱: demo@cornell.edu\n密码: demo1234'
        } else {
          errorMessage.value = data.error?.message || 'Invalid credentials'
        }
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    // 网络错误时提供演示模式
    errorMessage.value = '无法连接到服务器。\n\n您可以使用演示账号体验系统：\n邮箱: demo@cornell.edu\n密码: demo1234'
  } finally {
    isLoading.value = false
  }
}

const signInWithGoogle = () => {
  clearError()
  // TODO: 实现Google OAuth登录
  errorMessage.value = 'Google OAuth功能开发中，敬请期待'
}

// 游客登录
const guestLogin = async () => {
  clearError()
  isLoading.value = true
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/guest-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      // 保存游客token和数据
      localStorage.setItem('userToken', data.data.token)
      localStorage.setItem('userData', JSON.stringify(data.data.user))
      
      errorMessage.value = ''
      const redirect = router.currentRoute.value.query.redirect || '/home'
      setTimeout(() => {
        router.push(redirect)
      }, 500)
    } else {
      errorMessage.value = data.error?.message || 'Guest login failed'
    }
  } catch (error) {
    console.error('Guest login error:', error)
    errorMessage.value = 'Network error. Please check your connection and try again.'
  } finally {
    isLoading.value = false
  }
}

// 重新发送验证邮件
const resendVerification = async () => {
  if (!resendEmail.value) return
  
  isResending.value = true
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: resendEmail.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      errorMessage.value = '验证邮件已发送！请检查您的邮箱。'
      showResendButton.value = false
    } else {
      errorMessage.value = data.error?.message || '发送验证邮件失败'
    }
  } catch (error) {
    console.error('Resend verification error:', error)
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    isResending.value = false
  }
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}

// 跳转到重发验证邮件页面
const goToResendVerification = () => {
  router.push('/resend-verification')
}

// 跳转到忘记密码页面
const goToForgotPassword = () => {
  router.push('/forgot-password')
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
