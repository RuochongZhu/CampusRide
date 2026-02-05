<template>
  <div class="min-h-screen bg-[#EDEEE8] pt-16 px-4">
    <div class="max-w-4xl mx-auto py-8">
      <div class="bg-white rounded-lg shadow-sm p-8">
        <h1 class="text-3xl font-bold text-[#333333] mb-8 text-center">
          ClickableAvatar Component Test Page
        </h1>

        <!-- Test Section -->
        <div class="space-y-8">

          <!-- Single Avatar Test -->
          <div class="border border-gray-200 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-4">Single Avatar Test</h3>
            <p class="text-gray-600 mb-4">Click the avatar below to see the user card popup:</p>

            <div class="flex items-center space-x-4">
              <ClickableAvatar
                :user="testUser"
                size="large"
                @message="handleUserMessage"
                @click="handleAvatarClick"
              />
              <div>
                <p class="font-medium">{{ testUser.first_name }} {{ testUser.last_name }}</p>
                <p class="text-sm text-gray-500">{{ testUser.email }}</p>
              </div>
            </div>
          </div>

          <!-- Multiple Avatars Test -->
          <div class="border border-gray-200 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-4">Multiple Avatars Test</h3>
            <p class="text-gray-600 mb-4">Test different sizes and users:</p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div v-for="(user, index) in testUsers" :key="index"
                   class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <ClickableAvatar
                  :user="user"
                  :size="user.avatarSize"
                  @message="handleUserMessage"
                  @click="handleAvatarClick"
                />
                <div>
                  <p class="font-medium text-sm">{{ user.first_name }} {{ user.last_name }}</p>
                  <p class="text-xs text-gray-500">{{ user.university }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Integration Examples -->
          <div class="border border-gray-200 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-4">Integration Examples</h3>
            <p class="text-gray-600 mb-4">How it would appear in different modules:</p>

            <!-- Marketplace Style -->
            <div class="mb-6">
              <h4 class="font-medium mb-3">Marketplace Item Card Style:</h4>
              <div class="border rounded-lg p-4 bg-white">
                <h5 class="font-semibold text-lg mb-2">MacBook Air M1 - Excellent Condition</h5>
                <p class="text-gray-600 text-sm mb-3">Barely used MacBook Air with M1 chip. Perfect for students!</p>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <ClickableAvatar :user="testUsers[0]" size="small" @message="handleUserMessage" />
                    <span class="text-sm text-gray-500">{{ testUsers[0].first_name }} {{ testUsers[0].last_name }}</span>
                  </div>
                  <span class="font-bold text-lg text-[#C24D45]">$899</span>
                </div>
              </div>
            </div>

            <!-- Rideshare Style -->
            <div class="mb-6">
              <h4 class="font-medium mb-3">Rideshare Card Style:</h4>
              <div class="border rounded-lg p-4 bg-white">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <ClickableAvatar :user="testUsers[1]" size="default" @message="handleUserMessage" />
                    <div>
                      <p class="font-medium">{{ testUsers[1].first_name }} {{ testUsers[1].last_name }}</p>
                      <p class="text-sm text-gray-500">Driver • ⭐ 4.9</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-lg">$15</p>
                    <p class="text-sm text-gray-500">2 seats left</p>
                  </div>
                </div>
                <div class="mt-3 text-sm text-gray-600">
                  📍 Campus → NYC • Tomorrow 2:00 PM
                </div>
              </div>
            </div>

            <!-- Activities Style -->
            <div>
              <h4 class="font-medium mb-3">Activity Participants Style:</h4>
              <div class="border rounded-lg p-4 bg-white">
                <h5 class="font-semibold mb-3">Study Group - Final Exam Prep</h5>
                <div class="flex flex-wrap gap-3">
                  <div v-for="user in testUsers.slice(0, 4)" :key="user.id"
                       class="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1">
                    <ClickableAvatar :user="user" size="small" @message="handleUserMessage" />
                    <span class="text-sm">{{ user.first_name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Event Log -->
          <div class="border border-gray-200 rounded-lg p-6">
            <h3 class="text-xl font-semibold mb-4">Event Log</h3>
            <div class="bg-gray-50 rounded p-4 max-h-32 overflow-y-auto">
              <div v-if="eventLog.length === 0" class="text-gray-500 text-sm">
                No events yet. Click on any avatar above!
              </div>
              <div v-else class="space-y-1">
                <div v-for="(event, index) in eventLog" :key="index" class="text-sm">
                  <span class="text-gray-500">{{ event.time }}</span> - {{ event.message }}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ClickableAvatar from '@/components/common/ClickableAvatar.vue'

const router = useRouter()

// Test data
const testUser = ref({
  id: 'test-user-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@university.edu',
  avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
  university: 'Your University',
  is_online: true,
  avg_rating: 4.8,
  total_carpools: 12,
  total_activities: 8,
  points: 250
})

const testUsers = ref([
  {
    id: 'user-1',
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice.smith@university.edu',
    avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
    university: 'Your University',
    is_online: true,
    avatarSize: 'small',
    avg_rating: 4.9,
    total_carpools: 15,
    total_activities: 12,
    points: 320
  },
  {
    id: 'user-2',
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob.johnson@university.edu',
    avatar_url: 'https://avatars.githubusercontent.com/u/3?v=4',
    university: 'Your University',
    is_online: false,
    avatarSize: 'default',
    avg_rating: 4.7,
    total_carpools: 8,
    total_activities: 15,
    points: 180
  },
  {
    id: 'user-3',
    first_name: 'Carol',
    last_name: 'Williams',
    email: 'carol.williams@university.edu',
    avatar_url: 'https://avatars.githubusercontent.com/u/4?v=4',
    university: 'Your University',
    is_online: true,
    avatarSize: 'large',
    avg_rating: 5.0,
    total_carpools: 20,
    total_activities: 25,
    points: 450
  },
  {
    id: 'user-4',
    first_name: 'David',
    last_name: 'Brown',
    email: 'david.brown@university.edu',
    avatar_url: 'https://avatars.githubusercontent.com/u/5?v=4',
    university: 'Your University',
    is_online: true,
    avatarSize: 'default',
    avg_rating: 4.6,
    total_carpools: 5,
    total_activities: 18,
    points: 210
  }
])

// Event logging
const eventLog = ref([])

const addToLog = (message) => {
  const now = new Date()
  eventLog.value.unshift({
    time: now.toLocaleTimeString(),
    message: message
  })

  // Keep only last 10 events
  if (eventLog.value.length > 10) {
    eventLog.value = eventLog.value.slice(0, 10)
  }
}

// Event handlers
const handleAvatarClick = (user) => {
  addToLog(`Avatar clicked: ${user.first_name} ${user.last_name}`)
}

const handleUserMessage = (user) => {
  addToLog(`Message button clicked for: ${user.first_name} ${user.last_name} - Redirecting to /messages?userId=${user.id}`)
  // The ClickableAvatar component handles the actual navigation
}
</script>

<style scoped>
/* Component specific styles if needed */
</style>