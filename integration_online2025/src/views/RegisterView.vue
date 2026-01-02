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
      <!-- Right side with register form -->
      <div class="w-full md:w-3/5 bg-white p-8 md:p-12">
        <div class="max-w-md mx-auto">
          <div class="flex items-center mb-6">
            <h1 class="text-2xl font-bold text-[#B31B1B]">Campus Ride Home</h1>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

          <!-- Error Message -->
          <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {{ successMessage }}
          </div>

          <form @submit.prevent="handleRegister">
            <!-- Display Name -->
            <div class="mb-4">
              <label for="nickname" class="block text-sm font-medium text-gray-700 mb-1">Display Name / Nickname</label>
              <input
                type="text"
                id="nickname"
                v-model="form.nickname"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
                placeholder="How you want to be displayed"
                required
                maxlength="50"
              />
            </div>

            <!-- Email Address -->
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Cornell Email Address</label>
              <input
                type="email"
                id="email"
                v-model="form.email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
                placeholder="your-netid@cornell.edu"
                required
              />
            </div>

            <!-- Password -->
            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                v-model="form.password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
                placeholder="8 characters, letters and numbers"
                required
              />
            </div>

            <!-- Confirm Password -->
            <div class="mb-6">
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                v-model="form.confirmPassword"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-[#B31B1B] hover:bg-[#8F1515] text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>
          
          <div class="relative flex items-center justify-center my-6">
            <div class="border-t border-gray-300 absolute w-full"></div>
            <span class="bg-white px-2 text-sm text-gray-500 relative">or</span>
          </div>
          
          <button
            @click="signUpWithGoogle"
            :disabled="isLoading"
            class="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md py-2 px-4 text-gray-700 hover:bg-gray-50 mb-3 transition-colors duration-300 disabled:opacity-50"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
          
          <p class="mt-6 text-center text-sm text-gray-600">
            Already have an account?
          </p>
          <button
            @click="goToLogin"
            class="mt-3 w-full bg-white border-2 border-[#B31B1B] text-[#B31B1B] font-medium py-2 px-4 rounded-md hover:bg-[#B31B1B] hover:text-white transition-colors duration-300"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../utils/api'

const router = useRouter()

// Form data
const form = ref({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Use centralized API client

// Clear messages
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

// Form validation
const validateForm = () => {
  clearMessages()

  if (!form.value.nickname || !form.value.email || !form.value.password || !form.value.confirmPassword) {
    errorMessage.value = 'Please fill in all required fields'
    return false
  }
  
  // Nickname validation
  if (form.value.nickname.trim().length < 2) {
    errorMessage.value = 'Display name must be at least 2 characters'
    return false
  }
  
  if (form.value.nickname.trim().length > 50) {
    errorMessage.value = 'Display name must be less than 50 characters'
    return false
  }
  
  // Cornell email validation
  // Gmail support temporarily disabled - uncomment line below to re-enable Gmail testing
  // if (!form.value.email.endsWith('@cornell.edu') && !form.value.email.endsWith('@gmail.com')) {
  if (!form.value.email.endsWith('@cornell.edu')) {
    errorMessage.value = 'Email must end with @cornell.edu'
    return false
  }
  
  // Password validation: exactly 8 characters, letters and numbers only
  if (form.value.password.length !== 8) {
    errorMessage.value = 'Password must be exactly 8 characters'
    return false
  }

  const passwordRegex = /^[a-zA-Z0-9]{8}$/
  if (!passwordRegex.test(form.value.password)) {
    errorMessage.value = 'Password must be 8 characters with letters and numbers only'
    return false
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return false
  }

  return true
}

// Handle registration
const handleRegister = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  clearMessages()
  
  try {
    const { data } = await authAPI.register({
      nickname: form.value.nickname.trim(),
      email: form.value.email,
      password: form.value.password
    })

    if (data?.success) {
      successMessage.value = 'Registration successful! Please check your email and click the verification link.'
      setTimeout(() => {
        successMessage.value = "Check your email\n\nIf you haven't received the email, please check your spam folder or contact the administrator."
      }, 3000)
    } else {
      errorMessage.value = data?.error?.message || 'Registration failed, please try again'
    }
  } catch (error) {
    console.error('Registration error:', error)
    const msg = error?.response?.data?.error?.message || error.message || 'Network error, please check your connection'
    errorMessage.value = msg
  } finally {
    isLoading.value = false
  }
}

// Google sign-up
const signUpWithGoogle = () => {
  clearMessages()
  // TODO: Implement Google OAuth registration
  errorMessage.value = 'Google OAuth feature is under development, coming soon'
}

// Go to login page
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* Keep original styles */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style> 
