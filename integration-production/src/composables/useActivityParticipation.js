import { ref } from 'vue'

export function useActivityParticipation({ activitiesAPI, pointsAPI, message, participatedActivityIds }) {
  const userPoints = ref({
    current_balance: 0,
    total_earned: 0,
    total_spent: 0
  })

  const fetchUserPoints = async () => {
    try {
      const response = await pointsAPI.getMyPoints()
      if (response.data?.success) {
        const payload = response.data.data || {}
        userPoints.value = {
          current_balance: payload.current_balance ?? payload.points ?? 0,
          total_earned: payload.total_earned ?? payload.points ?? 0,
          total_spent: payload.total_spent ?? 0
        }
      }
    } catch (error) {
      console.error('Failed to fetch user points:', error)
    }
  }

  const registerForActivity = async (activity) => {
    try {
      activity.registering = true
      const response = await activitiesAPI.joinActivity(activity.id)

      if (response.data?.success) {
        const payload = response.data.data || {}
        activity.isRegistered = true
        activity.current_participants = (activity.current_participants || 0) + 1
        activity.participants = activity.current_participants
        activity.user_participation = payload.participation || null
        activity.user_checked_in = false
        participatedActivityIds.value = new Set([
          ...participatedActivityIds.value,
          activity.id
        ])

        const joinPoints = activity.reward_points || 0
        if (joinPoints > 0) {
          message.success(`Successfully joined "${activity.title}"! You'll earn ${joinPoints} points when you check in.`)
        } else {
          message.success(`Successfully joined "${activity.title}"!`)
        }

        await fetchUserPoints()
      }
    } catch (error) {
      message.error(error.response?.data?.error?.message || 'Failed to join activity')
    } finally {
      activity.registering = false
    }
  }

  const cancelRegistration = async (activity) => {
    try {
      activity.cancelling = true
      const response = await activitiesAPI.leaveActivity(activity.id)

      if (response.data?.success) {
        activity.isRegistered = false
        activity.current_participants = Math.max((activity.current_participants || 1) - 1, 0)
        activity.participants = activity.current_participants
        activity.user_participation = null
        activity.user_checked_in = false
        participatedActivityIds.value = new Set(
          [...participatedActivityIds.value].filter(id => id !== activity.id)
        )
        message.success(`Registration cancelled for "${activity.title}"`)
        await fetchUserPoints()
      }
    } catch (error) {
      message.error(error.response?.data?.error?.message || 'Failed to cancel registration')
    } finally {
      activity.cancelling = false
    }
  }

  const awardPointsForActivity = async (action, points, activityTitle) => {
    try {
      const pointsData = {
        action,
        points,
        description: `${action === 'join' ? 'Joined' : action === 'checkin' ? 'Checked into' : 'Completed'} activity: ${activityTitle}`,
        category: 'activity',
        metadata: {
          activity_title: activityTitle,
          action
        }
      }

      const response = await pointsAPI.awardPoints(pointsData)
      if (response.data.success) {
        return response.data
      }
    } catch (error) {
      console.error('Failed to award points:', error)
    }
  }

  return {
    userPoints,
    fetchUserPoints,
    registerForActivity,
    cancelRegistration,
    awardPointsForActivity
  }
}

export default useActivityParticipation
