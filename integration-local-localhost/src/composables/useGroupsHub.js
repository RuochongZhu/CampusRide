import { ref } from 'vue'
import { message } from 'ant-design-vue'

export function useGroupsHub({ groupAPI, onGroupChanged, loadActivities }) {
  const myGroups = ref([])
  const allGroups = ref([])
  const selectedGroupId = ref(null)

  const showCreateGroupModal = ref(false)
  const showPostThoughtModal = ref(false)
  const showBrowseGroupsModal = ref(false)
  const showGroupChatModal = ref(false)
  const selectedGroupForChat = ref(null)

  const fetchMyGroups = async () => {
    // Guests or not-yet-restored auth state should not trigger a noisy error toast.
    if (!localStorage.getItem('userToken')) {
      myGroups.value = []
      return
    }

    try {
      const response = await groupAPI.getMyGroups()
      myGroups.value = response.data.data.groups || []
    } catch (error) {
      console.error('Failed to fetch my groups:', error)
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        myGroups.value = []
        return
      }
      message.error('Failed to fetch groups list')
    }
  }

  const fetchAllGroups = async () => {
    try {
      const response = await groupAPI.getGroups()
      allGroups.value = response.data.data.groups || []
    } catch (error) {
      console.error('Failed to fetch all groups:', error)
    }
  }

  const joinGroupHandler = async (groupId) => {
    try {
      const response = await groupAPI.joinGroup(groupId)
      if (response.data.success) {
        message.success('Group joined successfully!')
        await fetchMyGroups()
        await fetchAllGroups()
      }
    } catch (error) {
      message.error(error.response?.data?.error?.message || 'Failed to join group')
    }
  }

  const leaveGroupHandler = async (groupId) => {
    try {
      const response = await groupAPI.leaveGroup(groupId)
      if (response.data.success) {
        message.success('Left the group')
        if (selectedGroupId.value === groupId) {
          selectedGroupId.value = null
        }
        await fetchMyGroups()
        if (onGroupChanged) {
          await onGroupChanged()
        }
      }
    } catch (error) {
      message.error(error.response?.data?.error?.message || 'Failed to leave group')
    }
  }

  const deleteGroupHandler = async (groupId) => {
    try {
      const response = await groupAPI.deleteGroup(groupId)
      if (response.data.success) {
        message.success('Group deleted successfully')
        if (selectedGroupId.value === groupId) {
          selectedGroupId.value = null
        }
        await fetchMyGroups()
        await fetchAllGroups()
        if (onGroupChanged) {
          await onGroupChanged()
        }
      }
    } catch (error) {
      message.error(error.response?.data?.error?.message || 'Failed to delete group')
    }
  }

  const selectGroup = (group) => {
    selectedGroupId.value = selectedGroupId.value === group.id ? null : group.id
    if (loadActivities) {
      loadActivities()
    }
  }

  const handleGroupCreated = async (createdGroup) => {
    if (createdGroup?.id) {
      selectedGroupId.value = createdGroup.id
    }

    await fetchMyGroups()
    await fetchAllGroups()

    if (onGroupChanged) {
      await onGroupChanged()
    }

    if (loadActivities) {
      await loadActivities()
    }

    message.success('Group created successfully!')
  }

  const isGroupJoined = (groupId) => {
    return myGroups.value.some(group => group.id === groupId)
  }

  const openGroupChat = (group) => {
    selectedGroupForChat.value = group
    showGroupChatModal.value = true
  }

  return {
    myGroups,
    allGroups,
    selectedGroupId,
    showCreateGroupModal,
    showPostThoughtModal,
    showBrowseGroupsModal,
    showGroupChatModal,
    selectedGroupForChat,
    fetchMyGroups,
    fetchAllGroups,
    joinGroupHandler,
    leaveGroupHandler,
    deleteGroupHandler,
    selectGroup,
    handleGroupCreated,
    isGroupJoined,
    openGroupChat
  }
}

export default useGroupsHub
