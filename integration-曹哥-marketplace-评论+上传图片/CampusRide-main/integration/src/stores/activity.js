import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { activitiesAPI } from '../utils/api'

export const useActivityStore = defineStore('activity', () => {
  // State
  const activities = ref([])
  const selectedActivity = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({
    category: null,
    status: 'published',
    sortBy: 'newest',
    search: '',
    mapBounds: null
  })
  const pagination = ref({
    current: 1,
    pageSize: 20,
    total: 0,
    hasMore: true
  })

  // Getters
  const filteredActivities = computed(() => {
    let filtered = activities.value

    if (filters.value.category) {
      filtered = filtered.filter(activity => activity.category === filters.value.category)
    }

    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase()
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  })

  const nearbyActivities = computed(() => {
    if (!filters.value.mapBounds) return activities.value

    return activities.value.filter(activity => {
      if (!activity.location_coordinates) return false

      const { lat, lng } = activity.location_coordinates
      const bounds = filters.value.mapBounds

      return lat >= bounds.south &&
             lat <= bounds.north &&
             lng >= bounds.west &&
             lng <= bounds.east
    })
  })

  const upcomingActivities = computed(() => {
    const now = new Date()
    return activities.value.filter(activity => {
      const startTime = new Date(activity.start_time)
      return startTime > now && activity.status === 'published'
    })
  })

  // Actions
  const fetchActivities = async (options = {}) => {
    try {
      loading.value = true
      error.value = null

      const params = {
        page: options.page || pagination.value.current,
        limit: options.limit || pagination.value.pageSize,
        category: options.category || filters.value.category,
        status: options.status || filters.value.status,
        sortBy: options.sortBy || filters.value.sortBy,
        search: options.search || filters.value.search,
        organizerOnly: options.organizerOnly || false,
        ...options
      }

      const response = await activitiesAPI.getActivities(params)
      const payload = response.data?.data || {}
      const fetchedActivities = payload.activities || []

      if (options.append) {
        activities.value.push(...fetchedActivities)
      } else {
        activities.value = fetchedActivities
      }

      pagination.value = {
        ...pagination.value,
        total: payload.total || 0,
        hasMore: payload.hasMore ?? false
      }

      return {
        success: true,
        data: fetchedActivities,
        hasMore: payload.hasMore ?? false
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch activities'
      console.error('Failed to fetch activities:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const fetchActivityById = async (activityId) => {
    try {
      loading.value = true
      error.value = null

      const response = await activitiesAPI.getActivity(activityId)
      const payload = response.data?.data || {}
      selectedActivity.value = payload.activity

      return {
        success: true,
        activity: payload.activity
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch activity'
      console.error('Failed to fetch activity:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const createActivity = async (activityData) => {
    try {
      loading.value = true
      error.value = null

      const response = await activitiesAPI.createActivity(activityData)
      const payload = response.data?.data || {}

      if (payload.activity) {
        activities.value.unshift(payload.activity)
      }

      return {
        success: true,
        activity: payload.activity
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create activity'
      console.error('Failed to create activity:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const updateActivity = async (activityId, updateData) => {
    try {
      loading.value = true
      error.value = null

      const response = await activitiesAPI.updateActivity(activityId, updateData)
      const payload = response.data?.data || {}

      if (payload.activity) {
        const index = activities.value.findIndex(a => a.id === activityId)
        if (index !== -1) {
          activities.value[index] = payload.activity
        }

        if (selectedActivity.value?.id === activityId) {
          selectedActivity.value = payload.activity
        }
      }

      return {
        success: true,
        activity: payload.activity
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update activity'
      console.error('Failed to update activity:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const deleteActivity = async (activityId) => {
    try {
      loading.value = true
      error.value = null

      await activitiesAPI.deleteActivity(activityId)

      // Remove activity from the list
      activities.value = activities.value.filter(a => a.id !== activityId)

      // Clear selected activity if it's the deleted one
      if (selectedActivity.value?.id === activityId) {
        selectedActivity.value = null
      }

      return {
        success: true
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete activity'
      console.error('Failed to delete activity:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const joinActivity = async (activityId) => {
    try {
      loading.value = true
      error.value = null

      const response = await activitiesAPI.joinActivity(activityId)
      const payload = response.data?.data || {}

      // Update activity in the list to reflect new participant count
      const activity = activities.value.find(a => a.id === activityId)
      if (activity) {
        activity.current_participants = (activity.current_participants || 0) + 1
        activity.user_participation = payload.participation
      }

      return {
        success: true,
        participation: payload.participation
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to join activity'
      console.error('Failed to join activity:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const leaveActivity = async (activityId) => {
    try {
      loading.value = true
      error.value = null

      await activitiesAPI.leaveActivity(activityId)

      // Update activity in the list to reflect reduced participant count
      const activity = activities.value.find(a => a.id === activityId)
      if (activity) {
        activity.current_participants = Math.max((activity.current_participants || 0) - 1, 0)
        activity.user_participation = null
      }

      return {
        success: true
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to leave activity'
      console.error('Failed to leave activity:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const checkInActivity = async (activityId, checkinData = {}) => {
    try {
      loading.value = true
      error.value = null

      const response = await activitiesAPI.checkinActivity(activityId, checkinData)
      const payload = response.data?.data || {}

      const activity = activities.value.find(a => a.id === activityId)
      if (activity && activity.user_participation) {
        activity.user_participation.attendance_status = 'attended'
        activity.user_participation.checkin_time = new Date().toISOString()
        activity.user_participation.points_earned = payload.pointsEarned
      }

      return {
        success: true,
        participation: payload.participation,
        pointsEarned: payload.pointsEarned
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to check in'
      console.error('Failed to check in:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const searchActivities = async (searchParams) => {
    try {
      loading.value = true
      error.value = null

      const response = await activitiesAPI.searchActivities(searchParams)
      const payload = response.data?.data || {}

      return {
        success: true,
        activities: payload.activities || [],
        total: payload.total || 0,
        hasMore: payload.hasMore ?? false
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to search activities'
      console.error('Failed to search activities:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const getMyActivities = async (type = 'organized') => {
    try {
      loading.value = true
      error.value = null

      const response = await activitiesAPI.getMyActivities({
        type
      })
      const payload = response.data?.data || {}

      return {
        success: true,
        activities: payload.activities || []
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch my activities'
      console.error('Failed to fetch my activities:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const getActivityParticipants = async (activityId) => {
    try {
      loading.value = true
      error.value = null

      const response = await activitiesAPI.getActivityParticipants(activityId)
      const payload = response.data?.data || {}

      return {
        success: true,
        participants: payload.participants || []
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch participants'
      console.error('Failed to fetch participants:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  // Utility actions
  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const updateMapBounds = (bounds) => {
    filters.value.mapBounds = bounds
  }

  const clearError = () => {
    error.value = null
  }

  const resetActivities = () => {
    activities.value = []
    pagination.value = {
      current: 1,
      pageSize: 20,
      total: 0,
      hasMore: true
    }
  }

  const loadMore = async () => {
    if (!pagination.value.hasMore || loading.value) return

    pagination.value.current++
    return await fetchActivities({
      page: pagination.value.current,
      append: true
    })
  }

  // Activity categories and types for forms
  const categories = [
    'academic',
    'sports',
    'social',
    'volunteer',
    'career',
    'cultural',
    'technology'
  ]

  const activityTypes = [
    'individual',
    'team',
    'competition',
    'workshop',
    'seminar'
  ]

  return {
    // State
    activities,
    selectedActivity,
    loading,
    error,
    filters,
    pagination,

    // Getters
    filteredActivities,
    nearbyActivities,
    upcomingActivities,

    // Actions
    fetchActivities,
    fetchActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    joinActivity,
    leaveActivity,
    checkInActivity,
    searchActivities,
    getMyActivities,
    getActivityParticipants,

    // Utility actions
    setFilters,
    updateMapBounds,
    clearError,
    resetActivities,
    loadMore,

    // Constants
    categories,
    activityTypes
  }
})
