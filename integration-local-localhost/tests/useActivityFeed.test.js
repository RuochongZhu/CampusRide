import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useActivityFeed } from '../src/composables/useActivityFeed.js'

function createActivity(overrides = {}) {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Activity',
    status: overrides.status ?? 'ongoing',
    isOwner: overrides.isOwner ?? false,
    isRegistered: overrides.isRegistered ?? false,
    registering: false,
    cancelling: false,
    max_participants: overrides.max_participants ?? 10,
    current_participants: overrides.current_participants ?? 0,
    start_time: overrides.start_time ?? '2026-02-08T12:00:00.000Z',
    created_at: overrides.created_at ?? '2026-02-08T10:00:00.000Z',
    allowCheckin: overrides.allowCheckin ?? false
  }
}

test('filters and paginates activities by feed state', () => {
  const feedFilter = ref('all')
  const sortOption = ref('newest')
  const currentPage = ref(1)
  const activities = ref(Array.from({ length: 12 }, (_, index) =>
    createActivity({
      id: index + 1,
      start_time: `2026-02-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`
    })
  ))
  const participatedActivityIds = ref(new Set([2, 4]))

  const api = useActivityFeed({
    feedFilter,
    sortOption,
    currentPage,
    activities,
    participatedActivityIds,
    handlers: {
      router: { push() {} },
      shareActivity() {},
      editActivity() {},
      showParticipants() {},
      generateCheckinCode() {},
      openActivityChat() {},
      registerForActivity() {},
      cancelRegistration() {},
      openActivityCheckinModal() {},
      canCheckin: () => false
    }
  })

  assert.equal(api.paginationTotal.value, 12)
  assert.equal(api.paginatedActivities.value.length, 10)

  currentPage.value = 2
  assert.equal(api.paginatedActivities.value.length, 2)

  feedFilter.value = 'groups'
  activities.value[0].isOwner = true
  const grouped = api.filteredActivities.value.map(item => item.id)
  assert.deepEqual(grouped.sort((a, b) => a - b), [1, 2, 4])
})

test('builds role-based actions and dispatches handler calls', () => {
  const calls = []
  const feedFilter = ref('all')
  const sortOption = ref('newest')
  const currentPage = ref(1)
  const activities = ref([createActivity({ id: 101 })])
  const participatedActivityIds = ref(new Set())

  const api = useActivityFeed({
    feedFilter,
    sortOption,
    currentPage,
    activities,
    participatedActivityIds,
    handlers: {
      router: { push(path) { calls.push(['view', path]) } },
      shareActivity: (activity) => calls.push(['share', activity.id]),
      editActivity: (activity) => calls.push(['edit', activity.id]),
      showParticipants: (activity) => calls.push(['participants', activity.id]),
      generateCheckinCode: (activity) => calls.push(['checkin-code', activity.id]),
      openActivityChat: (activity) => calls.push(['chat', activity.id]),
      registerForActivity: (activity) => calls.push(['join', activity.id]),
      cancelRegistration: (activity) => calls.push(['cancel', activity.id]),
      openActivityCheckinModal: (activity) => calls.push(['checkin', activity.id]),
      canCheckin: (activity) => activity.allowCheckin === true
    }
  })

  const ownerActions = api.getActivityActions(createActivity({ id: 1, isOwner: true, status: 'ongoing' }))
    .map(action => action.key)
  assert.deepEqual(ownerActions, ['view', 'share', 'edit', 'participants', 'checkin-code'])

  const guestActions = api.getActivityActions(createActivity({ id: 2, isRegistered: false, status: 'published' }))
    .map(action => action.key)
  assert.deepEqual(guestActions, ['view', 'share', 'join'])

  const registeredActions = api.getActivityActions(createActivity({ id: 3, isRegistered: true, status: 'ongoing', allowCheckin: true }))
    .map(action => action.key)
  assert.deepEqual(registeredActions, ['view', 'share', 'chat', 'cancel', 'checkin'])

  const sample = createActivity({ id: 9 })
  api.handleActivityAction('view', sample)
  api.handleActivityAction('join', sample)
  api.handleActivityAction('checkin', sample)
  assert.deepEqual(calls, [
    ['view', '/activities/9'],
    ['join', 9],
    ['checkin', 9]
  ])
})
