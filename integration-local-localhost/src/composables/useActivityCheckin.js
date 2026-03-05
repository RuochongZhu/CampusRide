import { ref } from 'vue'

export function useActivityCheckin({
  activities,
  activitiesAPI,
  message,
  fetchUserPoints,
  getCurrentLocation,
  getPublicNameFromRaw,
  defaultAvatar
}) {
  const showCheckinModal = ref(false)
  const showParticipantsModal = ref(false)
  const showCheckinCodeModal = ref(false)
  const selectedActivity = ref(null)
  const checkinForm = ref({
    location: null,
    checking: false
  })
  const participantsList = ref([])

  const showActivityCheckinModal = ref(false)
  const selectedActivityForCheckin = ref(null)

  const showActivityChatModal = ref(false)
  const selectedActivityForChat = ref(null)

  const mapParticipant = (participant) => {
    const fullName = participant.user
      ? getPublicNameFromRaw(participant.user.first_name, participant.user.last_name, participant.user.email, 'Participant')
      : ''

    return {
      id: participant.id,
      user_id: participant.user_id,
      name: fullName || 'Participant',
      email: participant.user?.email || 'N/A',
      avatar: participant.user?.avatar_url || defaultAvatar,
      joined_at: participant.registration_time,
      status: participant.attendance_status || 'registered'
    }
  }

  const showParticipants = async (activity) => {
    try {
      selectedActivity.value = activity
      const response = await activitiesAPI.getActivityParticipants(activity.id)
      if (response.data?.success) {
        const payload = response.data.data || {}
        participantsList.value = (payload.participants || []).map(mapParticipant)
        showParticipantsModal.value = true
      }
    } catch (error) {
      console.error('Failed to load participants list:', error)
      message.error(error.response?.data?.error?.message || 'Failed to load participants list')
    }
  }

  const openActivityChat = (activity) => {
    selectedActivityForChat.value = activity
    showActivityChatModal.value = true
  }

  const generateCheckinCode = async (activity) => {
    try {
      const response = await activitiesAPI.generateCheckinCode(activity.id)

      if (response.data?.success) {
        const payload = response.data.data || {}
        activity.checkin_code = payload.checkinCode
        activity.code_expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        activity.status = activity.status === 'published' ? 'ongoing' : activity.status

        selectedActivity.value = activity
        showCheckinCodeModal.value = true
        message.success('Check-in code generated successfully!')

        const activityIndex = activities.value.findIndex(a => a.id === activity.id)
        if (activityIndex !== -1) {
          activities.value[activityIndex].checkin_code = activity.checkin_code
          activities.value[activityIndex].code_expires_at = activity.code_expires_at
          activities.value[activityIndex].status = 'ongoing'
        }
      }
    } catch (error) {
      console.error('Failed to generate check-in code:', error)
      message.error(error.response?.data?.error?.message || 'Failed to generate check-in code')
    }
  }

  const canCheckin = (activity) => {
    if (activity.status !== 'ongoing') return false
    if (!activity.isRegistered) return false
    if (activity.user_checked_in) return false
    if (activity.user_participation?.checked_in) return false
    if (activity.checkin_enabled !== undefined && !activity.checkin_enabled) return false
    return true
  }

  const openActivityCheckinModal = (activity) => {
    selectedActivityForCheckin.value = activity
    showActivityCheckinModal.value = true
  }

  const updateActivityAfterCheckin = (activityId, participation = null) => {
    const activityIndex = activities.value.findIndex(a => a.id === activityId)
    if (activityIndex !== -1) {
      const activity = activities.value[activityIndex]
      activity.user_checked_in = true
      if (participation) {
        activity.user_participation = participation
      }

      if (activity.isOwner && activity.status === 'published') {
        activity.status = 'ongoing'
      }
    }
  }

  const handleActivityCheckinSuccess = async (data) => {
    const activity = activities.value.find(a => a.id === data.activityId)
    if (activity && activity.user_participation) {
      activity.user_participation.checked_in = true
      activity.user_participation.checkin_time = data.result.checkinTime
      activity.user_checked_in = true
    }

    message.success('Check In成功！')
    showActivityCheckinModal.value = false
    await fetchUserPoints()
  }

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'TBD'
    return new Date(dateString).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const submitCheckin = async () => {
    try {
      if (!selectedActivity.value) return
      const activity = selectedActivity.value

      checkinForm.value.checking = true
      const now = new Date()
      const startTime = new Date(activity.start_time)
      const endTime = new Date(activity.end_time)

      if (now < startTime) {
        message.error(`活动还未开始。开始时间：${formatDateTime(activity.start_time)}`)
        checkinForm.value.checking = false
        return
      }

      if (now > endTime) {
        message.error('活动已结束，无法Check In')
        checkinForm.value.checking = false
        return
      }

      message.loading('正在获取您的位置...', 0)
      let currentLocation
      try {
        currentLocation = await getCurrentLocation()
        checkinForm.value.location = currentLocation
        message.destroy()
      } catch (locationError) {
        message.destroy()
        message.error(locationError.message || '获取位置失败，无法完成Check In')
        console.error('Location error:', locationError)
        checkinForm.value.checking = false
        return
      }

      if (activity.location_verification && activity.locationCoordinates) {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          activity.locationCoordinates.lat,
          activity.locationCoordinates.lng
        )

        const maxDistance = activity.max_checkin_distance || 100
        if (distance > maxDistance) {
          message.error(`您距离Activity Location太远了。当前距离：${Math.round(distance)}米，要求距离：${maxDistance}meters of the activity location`)
          checkinForm.value.checking = false
          return
        }
      }

      const response = await activitiesAPI.checkinActivity(activity.id, { location: currentLocation })

      if (response.data?.success) {
        const data = response.data.data || {}
        activity.user_checked_in = true
        if (activity.user_participation) {
          activity.user_participation.attendance_status = 'attended'
          activity.user_participation.checkin_time = new Date().toISOString()
        } else {
          activity.user_participation = {
            attendance_status: 'attended',
            checkin_time: new Date().toISOString()
          }
        }

        showCheckinModal.value = false
        updateActivityAfterCheckin(activity.id, activity.user_participation)

        const earned = data.pointsEarned ?? activity.reward_points ?? 0
        if (earned > 0) {
          message.success(`Check In成功！您获得了 ${earned} 积分 🎉`)
        } else {
          message.success('Check In成功！')
        }

        await fetchUserPoints()
      }
    } catch (error) {
      message.error(error.response?.data?.error?.message || 'Check In失败')
      console.error('Checkin error:', error)
    } finally {
      checkinForm.value.checking = false
    }
  }

  const copyCheckinCode = () => {
    if (!selectedActivity.value?.checkin_code) return
    navigator.clipboard.writeText(selectedActivity.value.checkin_code)
      .then(() => {
        message.success('Check-in code copied to clipboard!')
      })
      .catch(() => {
        message.error('Failed to copy check-in code')
      })
  }

  const getParticipantStatusColor = (status) => {
    switch (status) {
      case 'checked_in':
        return 'green'
      case 'registered':
        return 'blue'
      case 'cancelled':
        return 'red'
      default:
        return 'default'
    }
  }

  const getParticipantStatusText = (status) => {
    switch (status) {
      case 'checked_in':
        return 'Checked In'
      case 'registered':
        return 'Registered'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    showCheckinModal,
    showParticipantsModal,
    showCheckinCodeModal,
    selectedActivity,
    checkinForm,
    participantsList,
    showActivityCheckinModal,
    selectedActivityForCheckin,
    showActivityChatModal,
    selectedActivityForChat,
    showParticipants,
    openActivityChat,
    generateCheckinCode,
    canCheckin,
    openActivityCheckinModal,
    handleActivityCheckinSuccess,
    submitCheckin,
    copyCheckinCode,
    getParticipantStatusColor,
    getParticipantStatusText,
    formatJoinDate
  }
}

export default useActivityCheckin
