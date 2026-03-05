import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useActivityParticipation } from '../src/composables/useActivityParticipation.js'

test('loads point balances from points API', async () => {
  const participatedActivityIds = ref(new Set())
  const pointsAPI = {
    async getMyPoints() {
      return {
        data: {
          success: true,
          data: {
            current_balance: 30,
            total_earned: 100,
            total_spent: 70
          }
        }
      }
    },
    async awardPoints() {
      return { data: { success: true } }
    }
  }

  const api = useActivityParticipation({
    activitiesAPI: {},
    pointsAPI,
    message: { success() {}, error() {} },
    participatedActivityIds
  })

  await api.fetchUserPoints()
  assert.deepEqual(api.userPoints.value, {
    current_balance: 30,
    total_earned: 100,
    total_spent: 70
  })
})

test('registers and cancels participation while syncing state', async () => {
  const participatedActivityIds = ref(new Set())
  const callLog = []
  let getPointsCalls = 0

  const activitiesAPI = {
    async joinActivity() {
      callLog.push('join')
      return {
        data: {
          success: true,
          data: {
            participation: { attendance_status: 'registered' }
          }
        }
      }
    },
    async leaveActivity() {
      callLog.push('leave')
      return { data: { success: true } }
    }
  }

  const pointsAPI = {
    async getMyPoints() {
      getPointsCalls += 1
      return {
        data: {
          success: true,
          data: {
            current_balance: 10,
            total_earned: 20,
            total_spent: 10
          }
        }
      }
    },
    async awardPoints() {
      return { data: { success: true } }
    }
  }

  const messages = []
  const api = useActivityParticipation({
    activitiesAPI,
    pointsAPI,
    message: {
      success(text) { messages.push(['success', text]) },
      error(text) { messages.push(['error', text]) }
    },
    participatedActivityIds
  })

  const activity = {
    id: 88,
    title: 'Campus Chess',
    reward_points: 5,
    isRegistered: false,
    current_participants: 2,
    participants: 2,
    user_participation: null,
    user_checked_in: false,
    registering: false,
    cancelling: false
  }

  await api.registerForActivity(activity)
  assert.equal(activity.isRegistered, true)
  assert.equal(activity.current_participants, 3)
  assert.equal(participatedActivityIds.value.has(88), true)
  assert.equal(getPointsCalls, 1)

  await api.cancelRegistration(activity)
  assert.equal(activity.isRegistered, false)
  assert.equal(activity.current_participants, 2)
  assert.equal(participatedActivityIds.value.has(88), false)
  assert.equal(getPointsCalls, 2)
  assert.deepEqual(callLog, ['join', 'leave'])

  const award = await api.awardPointsForActivity('join', 5, 'Campus Chess')
  assert.deepEqual(award, { success: true })
  assert.equal(messages.some((item) => item[0] === 'error'), false)
})
