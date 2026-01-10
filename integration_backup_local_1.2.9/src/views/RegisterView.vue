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

            <!-- Email Address with Cornell suffix -->
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Cornell NetID</label>
              <div class="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#B31B1B] focus-within:border-transparent">
                <input
                  type="text"
                  id="email"
                  v-model="emailUsername"
                  @input="validateEmailUsername"
                  class="flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-0"
                  :class="{ 'border-red-500': emailError }"
                  placeholder="netid"
                  required
                  pattern="[a-zA-Z0-9._-]+"
                />
                <span class="px-3 py-2 text-gray-600 bg-gray-50 border-l">@cornell.edu</span>
              </div>
              <p v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailError }}</p>
              <p v-else class="mt-1 text-xs text-gray-500">Enter your Cornell NetID (only letters, numbers, dots, underscores)</p>
            </div>

            <!-- Password -->
            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                v-model="form.password"
                @input="validatePassword"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B31B1B] focus:border-transparent"
                :class="{ 'border-red-500': passwordError }"
                placeholder="At least 8 characters"
                required
                minlength="8"
              />
              <p v-if="passwordError" class="mt-1 text-sm text-red-600">{{ passwordError }}</p>
              <div v-else class="mt-1">
                <p class="text-xs text-gray-500 mb-1">Password must contain:</p>
                <ul class="text-xs text-gray-500 space-y-0.5 pl-4">
                  <li :class="{ 'text-green-600': passwordChecks.length }">✓ At least 8 characters</li>
                  <li :class="{ 'text-green-600': passwordChecks.uppercase }">✓ One uppercase letter (A-Z)</li>
                  <li :class="{ 'text-green-600': passwordChecks.lowercase }">✓ One lowercase letter (a-z)</li>
                  <li :class="{ 'text-green-600': passwordChecks.number }">✓ One number (0-9)</li>
                </ul>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="mb-4">
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

            <!-- Combined Agreement -->
            <div class="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div class="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="userAgreement"
                  v-model="form.userAgreement"
                  class="mt-1 h-4 w-4 text-[#B31B1B] border-gray-300 rounded focus:ring-[#B31B1B]"
                  required
                />
                <label for="userAgreement" class="text-sm text-gray-700">
                  <span class="font-medium">I agree to the following <span class="text-red-500">*</span></span>
                  <ul class="mt-2 space-y-1 text-xs text-gray-600">
                    <li>• <router-link to="/terms" target="_blank" class="text-[#B31B1B] underline hover:text-[#8F1515]">Terms of Service</router-link> - Platform usage rules</li>
                    <li>• <router-link to="/privacy" target="_blank" class="text-[#B31B1B] underline hover:text-[#8F1515]">Privacy Policy</router-link> - How we handle your data</li>
                    <li>• <router-link to="/carpool-disclaimer" target="_blank" class="text-[#B31B1B] underline hover:text-[#8F1515]">Carpool Disclaimer</router-link> - Shared-expense carpool terms</li>
                    <li>• <router-link to="/cookies" target="_blank" class="text-[#B31B1B] underline hover:text-[#8F1515]">Cookie Policy</router-link> - Browser data usage</li>
                    <li>• Anonymized data may be used for academic research under Cornell IRB oversight</li>
                  </ul>
                  <p class="mt-2 text-xs text-gray-500">
                    By checking this box, you confirm you have read and agree to all policies above.
                  </p>
                </label>
              </div>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../utils/api'

const router = useRouter()

// Form data
const form = ref({
  nickname: '',
  password: '',
  confirmPassword: '',
  userAgreement: false
})

// Email username (NetID) - separate from full email
const emailUsername = ref('')
const emailError = ref('')

// Password validation
const passwordError = ref('')
const passwordChecks = ref({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false
})

// Compute full email
const fullEmail = computed(() => {
  return emailUsername.value ? `${emailUsername.value}@cornell.edu` : ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Validate email username (NetID)
const validateEmailUsername = () => {
  const username = emailUsername.value.trim()

  if (!username) {
    emailError.value = 'NetID is required'
    return false
  }

  // Only allow letters, numbers, dots, underscores, hyphens
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    emailError.value = 'Only letters, numbers, dots, underscores and hyphens allowed'
    return false
  }

  if (username.length < 2) {
    emailError.value = 'NetID must be at least 2 characters'
    return false
  }

  if (username.length > 50) {
    emailError.value = 'NetID must be less than 50 characters'
    return false
  }

  emailError.value = ''
  return true
}

// Validate password
const validatePassword = () => {
  const pwd = form.value.password

  // Update checks
  passwordChecks.value = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd)
  }

  // Check all requirements
  if (!passwordChecks.value.length) {
    passwordError.value = 'Password must be at least 8 characters'
    return false
  }

  if (!passwordChecks.value.uppercase) {
    passwordError.value = 'Password must contain at least one uppercase letter'
    return false
  }

  if (!passwordChecks.value.lowercase) {
    passwordError.value = 'Password must contain at least one lowercase letter'
    return false
  }

  if (!passwordChecks.value.number) {
    passwordError.value = 'Password must contain at least one number'
    return false
  }

  passwordError.value = ''
  return true
}

// Use centralized API client

// Clear messages
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

// Form validation
const validateForm = () => {
  clearMessages()

  // Validate nickname
  if (!form.value.nickname) {
    errorMessage.value = 'Please enter your display name'
    return false
  }

  if (form.value.nickname.trim().length < 2) {
    errorMessage.value = 'Display name must be at least 2 characters'
    return false
  }

  if (form.value.nickname.trim().length > 50) {
    errorMessage.value = 'Display name must be less than 50 characters'
    return false
  }

  // Validate email username (NetID)
  if (!validateEmailUsername()) {
    return false
  }

  // Validate password
  if (!form.value.password) {
    errorMessage.value = 'Please enter a password'
    return false
  }

  // Use the password validation function
  if (!validatePassword()) {
    // Error message already set by validatePassword
    return false
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return false
  }

  // Validate terms agreement
  if (!form.value.userAgreement) {
    errorMessage.value = 'You must agree to the Terms, Privacy Policy, and other policies to use CampusRide'
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
      email: fullEmail.value,
      password: form.value.password,
      user_agreement: form.value.userAgreement,
      user_agreement_at: new Date().toISOString(),
      research_consent: true,  // Included in combined agreement
      research_consent_at: new Date().toISOString()
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
