<template>
  <div class="w-64 bg-white border-r h-full overflow-y-auto flex-shrink-0">
    <div class="p-4">
      <h2 class="text-lg font-bold mb-4 text-gray-800">🗺️ Map Social</h2>

      <!-- Global options -->
      <div
        class="p-3 rounded-lg cursor-pointer mb-2 transition-colors"
        :class="!selectedGroup ? 'bg-[#C24D45] text-white' : 'hover:bg-gray-100'"
        @click="$emit('select-group', null)"
      >
        <div class="flex items-center">
          <GlobalOutlined class="mr-2 text-lg" />
          <span class="font-medium">Global Map</span>
        </div>
        <div class="text-xs mt-1 opacity-75">View all thoughts</div>
      </div>

      <div class="my-4 border-t border-gray-200"></div>

      <!-- My Groups header -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-600">My Groups</h3>
        <span class="text-xs text-gray-400">{{ myGroups.length }}</span>
      </div>

      <!-- Group list -->
      <div v-if="myGroups.length > 0" class="space-y-2">
        <div
          v-for="group in myGroups"
          :key="group.id"
          class="p-3 rounded-lg cursor-pointer transition-colors"
          :class="selectedGroup === group.id ? 'bg-[#C24D45] text-white' : 'hover:bg-gray-100'"
          @click="$emit('select-group', group.id)"
        >
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
              :class="selectedGroup === group.id ? 'bg-white/20' : 'bg-[#C24D45]/10'"
            >
              <TeamOutlined
                class="text-lg"
                :class="selectedGroup === group.id ? 'text-white' : 'text-[#C24D45]'"
              />
            </div>
            <div class="flex-grow min-w-0">
              <div class="font-medium truncate">{{ group.name }}</div>
              <div class="text-xs opacity-75 flex items-center">
                <UserOutlined class="mr-1" style="font-size: 10px;" />
                {{ group.member_count }} members
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-6 text-gray-400">
        <TeamOutlined class="text-3xl mb-2" />
        <p class="text-sm">No groups joined yet</p>
      </div>

      <!-- Create Group button -->
      <a-button
        type="dashed"
        block
        class="mt-4"
        @click="$emit('create-group')"
      >
        <template #icon><PlusOutlined /></template>
        Create Group
      </a-button>

      <!-- Browse Groups button -->
      <a-button
        block
        class="mt-2"
        @click="showBrowseModal = true"
      >
        <template #icon><SearchOutlined /></template>
        Browse Groups
      </a-button>
    </div>

    <!-- Browse Groups modal -->
    <a-modal
      v-model:open="showBrowseModal"
      title="Browse Groups"
      :footer="null"
      width="600px"
      @after-open="handleSearch"
    >
      <div class="space-y-2">
        <a-input-search
          v-model:value="searchQuery"
          placeholder="Search groups..."
          @search="handleSearch"
        />

        <div v-if="loading" class="text-center py-8">
          <a-spin />
        </div>

        <div v-else-if="allGroups.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="group in allGroups"
            :key="group.id"
            class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <div class="flex items-center justify-between">
              <div class="flex-grow">
                <div class="font-medium">{{ group.name }}</div>
                <div class="text-sm text-gray-500 line-clamp-1">
                  {{ group.description || 'No description' }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ group.member_count }} members
                </div>
              </div>
              <a-button
                v-if="!isInGroup(group.id)"
                type="primary"
                size="small"
                @click="handleJoinGroup(group.id)"
              >
                Join
              </a-button>
              <a-tag v-else color="green">Joined</a-tag>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-400">
          No groups available
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  GlobalOutlined,
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons-vue'
import { groupAPI } from '@/utils/api'

const props = defineProps({
  myGroups: {
    type: Array,
    default: () => []
  },
  selectedGroup: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select-group', 'create-group'])

const showBrowseModal = ref(false)
const searchQuery = ref('')
const allGroups = ref([])
const loading = ref(false)

// Check if user has joined group
const isInGroup = (groupId) => {
  return props.myGroups.some(g => g.id === groupId)
}

// Search groups
const handleSearch = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    const response = await groupAPI.getGroups(params)
    allGroups.value = response.data.data.groups || []
  } catch (error) {
    message.error('Search failed')
  } finally {
    loading.value = false
  }
}

// Join group
const handleJoinGroup = async (groupId) => {
  try {
    const response = await groupAPI.joinGroup(groupId)
    if (response.data.success) {
      message.success('Joined successfully!')
      showBrowseModal.value = false
      emit('select-group', null) // Trigger refresh
      window.location.reload() // Simple refresh
    }
  } catch (error) {
    message.error(error.response?.data?.error?.message || 'Join failed')
  }
}

// Load groups when opening browse modal
const handleOpenBrowse = () => {
  showBrowseModal.value = true
  handleSearch()
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.ant-btn-primary) {
  background-color: #C24D45;
  border-color: #C24D45;
}

:deep(.ant-btn-primary:hover) {
  background-color: #A93E37;
  border-color: #A93E37;
}
</style>
