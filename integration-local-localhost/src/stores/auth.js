import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, userAPI } from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('userToken'))
  const refreshToken = ref(localStorage.getItem('refreshToken'))
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userId = computed(() => user.value?.id)
  const userEmail = computed(() => user.value?.email)
  const userName = computed(() => user.value?.full_name || user.value?.email)
  const isGuest = computed(() => user.value?.isGuest || user.value?.role === 'guest')

  // Actions
  const login = async (credentials) => {
    try {
      loading.value = true
      error.value = null

      const response = await authAPI.login(credentials)

      if (response.data.success) {
        token.value = response.data.data.token
        refreshToken.value = response.data.data.refresh_token
        user.value = response.data.data.user

        // Store in localStorage
        localStorage.setItem('userToken', token.value)
        localStorage.setItem('refreshToken', refreshToken.value)
        localStorage.setItem('userData', JSON.stringify(user.value))

        return { success: true, user: user.value }
      } else {
        throw new Error(response.data.error?.message || 'Login failed')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    try {
      loading.value = true
      error.value = null

      const response = await authAPI.register(userData)

      if (response.data.success) {
        return { success: true, message: response.data.message }
      } else {
        throw new Error(response.data.message || 'Registration failed')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      // Call logout API if available
      if (token.value) {
        await authAPI.logout()
      }
    } catch (err) {
      console.warn('Logout API call failed:', err)
    } finally {
      // Clear local state regardless of API call result
      token.value = null
      refreshToken.value = null
      user.value = null
      localStorage.removeItem('userToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userData')
    }
  }

  const fetchUser = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await userAPI.getMe()

      if (response.data.success) {
        user.value = response.data.data?.user
        localStorage.setItem('userData', JSON.stringify(user.value))
        return { success: true, user: user.value }
      } else {
        throw new Error(response.data.message || 'Failed to fetch user')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch user'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updateData) => {
    try {
      loading.value = true
      error.value = null

      const response = await userAPI.updateMe(updateData)

      if (response.data.success) {
        user.value = { ...user.value, ...response.data.data?.user }
        localStorage.setItem('userData', JSON.stringify(user.value))
        return { success: true, user: user.value }
      } else {
        throw new Error(response.data.message || 'Failed to update profile')
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to update profile'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Initialize user from localStorage if token exists
  const initializeAuth = async () => {
    const storedToken = localStorage.getItem('userToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('userData')

    // 如果没有任何token，直接返回，不需要初始化
    if (!storedToken && !storedRefreshToken) {
      return
    }

    // 先从localStorage恢复状态
    if (storedToken) {
      token.value = storedToken
    }
    if (storedRefreshToken) {
      refreshToken.value = storedRefreshToken
    }
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.warn('Failed to parse stored user data:', e)
      }
    }

    // 只有当有access token时才尝试验证
    if (storedToken) {
      try {
        // Verify token is still valid by fetching user
        const result = await fetchUser()
        if (!result.success) {
          // fetchUser失败，但不要立即清除状态
          // api.js的拦截器会处理token刷新或重定向
          console.warn('Failed to verify user, token may need refresh')
        }
      } catch (err) {
        // 捕获错误但不清除状态，让api.js的拦截器处理
        console.warn('Error during auth initialization:', err)
      }
    }
  }

  return {
    // State
    user,
    token,
    refreshToken,
    loading,
    error,

    // Getters
    isLoggedIn,
    userId,
    userEmail,
    userName,
    isGuest,

    // Actions
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    clearError,
    initializeAuth,
    updateUserAvatar: (avatarUrl) => {
      if (user.value) {
        user.value.avatar_url = avatarUrl
        localStorage.setItem('userData', JSON.stringify(user.value))
      }
    }
  }
})

