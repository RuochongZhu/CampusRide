import { computed } from 'vue'
import {
  EyeOutlined,
  ShareAltOutlined,
  EditOutlined,
  TeamOutlined,
  QrcodeOutlined,
  MessageOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'

export function useActivityFeed({
  feedFilter,
  sortOption,
  currentPage,
  activities,
  participatedActivityIds,
  handlers
}) {
  const PAGE_SIZE = 10

  const filteredActivities = computed(() => {
    let filtered = [...activities.value]

    if (feedFilter.value === 'groups') {
      filtered = filtered.filter(activity =>
        activity.isOwner || participatedActivityIds.value.has(activity.id)
      )
    } else if (feedFilter.value === 'urgent') {
      const now = Date.now()
      filtered = filtered.filter(activity => {
        if (!activity.start_time) return false
        const startTime = new Date(activity.start_time).getTime()
        return startTime > now && (startTime - now) <= 2 * 60 * 60 * 1000
      })
    }

    if (sortOption.value === 'newest') {
      filtered.sort((a, b) => new Date(b.start_time || b.created_at || 0) - new Date(a.start_time || a.created_at || 0))
    } else if (sortOption.value === 'closest') {
      filtered.sort((a, b) => {
        const aTime = new Date(a.start_time || 0).getTime()
        const bTime = new Date(b.start_time || 0).getTime()
        return aTime - bTime
      })
    }

    return filtered
  })

  const paginationTotal = computed(() => filteredActivities.value.length)
  const paginatedActivities = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return filteredActivities.value.slice(start, start + PAGE_SIZE)
  })

  const isOwnerActivity = (activity) => Boolean(activity?.isOwner)
  const isRegisteredActivity = (activity) => Boolean(activity?.isRegistered)
  const isCompletedActivity = (activity) => activity?.status === 'completed'
  const isActivityFull = (activity) => {
    if (!activity?.max_participants) return false
    return activity.current_participants >= activity.max_participants
  }

  const getActivityActions = (activity) => {
    const actions = [
      {
        key: 'view',
        icon: EyeOutlined,
        className: '!rounded-button text-xs h-7 w-7 p-0 flex items-center justify-center',
        type: 'default'
      },
      {
        key: 'share',
        icon: ShareAltOutlined,
        className: '!rounded-button text-xs h-7 w-7 p-0 hidden sm:flex items-center justify-center',
        type: 'default'
      }
    ]

    if (isOwnerActivity(activity)) {
      actions.push(
        {
          key: 'edit',
          icon: EditOutlined,
          className: '!rounded-button text-xs h-7 w-7 p-0 hidden sm:flex items-center justify-center',
          type: 'default'
        },
        {
          key: 'participants',
          icon: TeamOutlined,
          className: '!rounded-button text-xs h-7 w-7 p-0 flex items-center justify-center',
          type: 'default'
        }
      )

      if (activity.status === 'ongoing') {
        actions.push({
          key: 'checkin-code',
          icon: QrcodeOutlined,
          className: '!rounded-button bg-[#52C41A] border-none hover:bg-[#45A117] text-xs h-7 w-7 p-0 flex items-center justify-center',
          type: 'primary'
        })
      }

      return actions
    }

    if (isRegisteredActivity(activity)) {
      actions.push({
        key: 'chat',
        icon: MessageOutlined,
        className: '!rounded-button bg-[#FA8C16] border-none hover:bg-[#D46B08] text-white text-xs h-7 w-7 p-0 flex items-center justify-center',
        type: 'default'
      })
    }

    if (!isCompletedActivity(activity)) {
      if (!isRegisteredActivity(activity)) {
        actions.push({
          key: 'join',
          icon: UserAddOutlined,
          label: 'Join',
          className: '!rounded-button bg-[#C24D45] border-none hover:bg-[#A93C35] text-xs h-7 px-2 flex items-center',
          type: 'primary',
          disabled: isActivityFull(activity),
          loading: Boolean(activity.registering)
        })
      } else {
        actions.push({
          key: 'cancel',
          icon: UserDeleteOutlined,
          className: '!rounded-button bg-gray-500 border-none hover:bg-gray-600 text-white text-xs h-7 w-7 p-0 hidden sm:flex items-center justify-center',
          type: 'default',
          loading: Boolean(activity.cancelling)
        })
      }

      if (handlers.canCheckin(activity)) {
        actions.push({
          key: 'checkin',
          icon: CheckCircleOutlined,
          className: '!rounded-button bg-[#FA8C16] border-none hover:bg-[#D46B08] text-xs h-7 w-7 p-0 flex items-center justify-center',
          type: 'primary'
        })
      }
    }

    return actions
  }

  const actionHandlers = {
    view: (activity) => handlers.router.push(`/activities/${activity.id}`),
    share: handlers.shareActivity,
    edit: handlers.editActivity,
    participants: handlers.showParticipants,
    'checkin-code': handlers.generateCheckinCode,
    chat: handlers.openActivityChat,
    join: handlers.registerForActivity,
    cancel: handlers.cancelRegistration,
    checkin: handlers.openActivityCheckinModal
  }

  const handleActivityAction = (actionKey, activity) => {
    const action = actionHandlers[actionKey]
    if (action) action(activity)
  }

  return {
    PAGE_SIZE,
    filteredActivities,
    paginationTotal,
    paginatedActivities,
    getActivityActions,
    handleActivityAction
  }
}

export default useActivityFeed
