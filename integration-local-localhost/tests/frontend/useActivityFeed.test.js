import { ref } from 'vue'
import { describe, expect, test } from 'vitest'
import { useActivityFeed } from '../../src/composables/useActivityFeed.js'

const createHandlers = () => ({
  router: { push: () => {} },
  shareActivity: () => {},
  editActivity: () => {},
  showParticipants: () => {},
  generateCheckinCode: () => {},
  openActivityChat: () => {},
  registerForActivity: () => {},
  cancelRegistration: () => {},
  openActivityCheckinModal: () => {},
  canCheckin: () => false
})

describe('useActivityFeed', () => {
  test('filters activities by distance and sorts by closest first', () => {
    const activities = ref([
      { id: 'a', distanceMeters: 1400, start_time: '2026-04-13T10:00:00.000Z', created_at: '2026-04-12T10:00:00.000Z' },
      { id: 'b', distanceMeters: 300, start_time: '2026-04-13T09:00:00.000Z', created_at: '2026-04-12T09:00:00.000Z' },
      { id: 'c', distanceMeters: null, start_time: '2026-04-13T08:00:00.000Z', created_at: '2026-04-12T08:00:00.000Z' }
    ])

    const { filteredActivities } = useActivityFeed({
      feedFilter: ref('all'),
      sortOption: ref('closest'),
      distanceFilter: ref(1000),
      currentPage: ref(1),
      activities,
      participatedActivityIds: ref(new Set()),
      handlers: createHandlers()
    })

    expect(filteredActivities.value.map(activity => activity.id)).toEqual(['b', 'c'])
  })

  test('filters group feed down to owned or joined activities', () => {
    const activities = ref([
      { id: 'owned', isOwner: true, start_time: '2026-04-13T10:00:00.000Z' },
      { id: 'joined', isRegistered: true, start_time: '2026-04-13T09:00:00.000Z' },
      { id: 'other', isOwner: false, isRegistered: false, start_time: '2026-04-13T08:00:00.000Z' }
    ])

    const { filteredActivities } = useActivityFeed({
      feedFilter: ref('groups'),
      sortOption: ref('newest'),
      distanceFilter: ref(5000),
      currentPage: ref(1),
      activities,
      participatedActivityIds: ref(new Set(['joined'])),
      handlers: createHandlers()
    })

    expect(filteredActivities.value.map(activity => activity.id)).toEqual(['owned', 'joined'])
  })
})
