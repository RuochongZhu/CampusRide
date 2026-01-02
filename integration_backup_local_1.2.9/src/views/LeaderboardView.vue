<template>
  <div class="min-h-screen bg-[#EDEEE8] main-content pt-16">
    <div class="pt-4 md:pt-8 pb-8 md:pb-16 max-w-5xl mx-auto px-3 md:px-4">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl md:text-3xl font-bold text-[#C24D45]">Weekly Leaderboard</h1>
            <p class="text-gray-600 mt-1 text-sm md:text-base">Top users by points this week</p>
            <p class="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">Points reset every Sunday • Earn rewards!</p>
          </div>
          <TrophyOutlined class="text-4xl md:text-6xl text-[#C24D45] opacity-20" />
        </div>
      </div>

      <!-- My Rank Card -->
      <div v-if="myRank" class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6 border border-purple-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 md:space-x-4">
            <div class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg md:text-2xl">
              #{{ myRank.rank }}
            </div>
            <div>
              <p class="text-xs md:text-sm text-gray-600">Your Current Rank</p>
              <p class="text-lg md:text-2xl font-bold text-purple-600">{{ myRank.points }} points</p>
            </div>
          </div>
          <div class="text-right hidden sm:block">
            <p class="text-sm text-gray-600">Keep going!</p>
            <p class="text-xs text-gray-500">{{ getRankMessage(myRank.rank) }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <a-spin size="large" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <ExclamationCircleOutlined class="text-5xl text-red-500 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to Load Leaderboard</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <a-button type="primary" @click="fetchLeaderboard">Retry</a-button>
      </div>

      <!-- Leaderboard List -->
      <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div v-if="leaderboardData.length === 0" class="text-center py-20 text-gray-500">
          <TrophyOutlined class="text-6xl mb-4 opacity-20" />
          <p class="text-lg">No leaderboard data yet</p>
          <p class="text-sm mt-2">Start earning points to appear on the leaderboard!</p>
        </div>
        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="(user, index) in leaderboardData"
            :key="user.user_id"
            class="p-3 md:p-4 hover:bg-gray-50 transition-colors"
            :class="{
              'bg-yellow-50': index === 0,
              'bg-gray-50': index === 1,
              'bg-orange-50': index === 2
            }"
          >
            <div class="flex items-center space-x-2 md:space-x-4">
              <!-- Rank Badge -->
              <div
                class="w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-lg flex-shrink-0"
                :class="{
                  'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg': index === 0,
                  'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-lg': index === 1,
                  'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg': index === 2,
                  'bg-gray-200 text-gray-700': index > 2
                }"
              >
                {{ index + 1 }}
              </div>

              <!-- Trophy Icon for Top 3 - hidden on mobile -->
              <div v-if="index < 3" class="flex-shrink-0 hidden sm:block">
                <TrophyOutlined
                  :class="{
                    'text-2xl md:text-3xl text-yellow-500': index === 0,
                    'text-2xl md:text-3xl text-gray-400': index === 1,
                    'text-2xl md:text-3xl text-orange-500': index === 2
                  }"
                />
              </div>

              <!-- Avatar -->
              <ClickableAvatar
                v-if="!user.hide_rank"
                :user="{
                  id: user.user_id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  avatar_url: user.avatar_url,
                  email: user.email
                }"
                :size="40"
                class="flex-shrink-0"
              />
              <!-- Anonymous Avatar for hidden users -->
              <div
                v-else
                class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0"
              >
                <UserOutlined class="text-gray-500 text-sm md:text-base" />
              </div>

              <!-- User Info -->
              <div class="flex-1 min-w-0">
                <p v-if="!user.hide_rank" class="font-semibold text-sm md:text-lg text-gray-900 truncate">
                  {{ user.first_name }} {{ user.last_name }}
                </p>
                <p v-else class="font-semibold text-sm md:text-lg text-gray-400 truncate blur-sm select-none">
                  Anonymous User
                </p>
                <p v-if="!user.hide_rank" class="text-xs md:text-sm text-gray-500 truncate hidden sm:block">{{ user.email }}</p>
                <p v-else class="text-xs md:text-sm text-gray-400 hidden sm:block">Rank hidden</p>
                <div v-if="user.avg_rating && user.avg_rating > 0 && !user.hide_rank" class="flex items-center mt-0.5 md:mt-1 space-x-1 md:space-x-2">
                  <StarFilled class="text-yellow-500 text-xs" />
                  <span class="text-xs text-gray-600">{{ user.avg_rating.toFixed(1) }}</span>
                </div>
              </div>

              <!-- Points -->
              <div class="text-right flex-shrink-0">
                <p class="font-bold text-lg md:text-2xl text-[#C24D45]">{{ user.total_points }}</p>
                <p class="text-xs text-gray-500">pts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- How to Earn Points Section -->
      <div class="bg-white rounded-lg shadow-sm p-4 md:p-6 mt-4 md:mt-6">
        <h3 class="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-900">How to Earn Points</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div class="flex items-start space-x-2 md:space-x-3">
            <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span class="text-green-600 font-bold text-xs md:text-sm">+50</span>
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm md:text-base">Create an Activity</p>
              <p class="text-xs md:text-sm text-gray-600">Organize events for the community</p>
            </div>
          </div>
          <div class="flex items-start space-x-2 md:space-x-3">
            <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span class="text-green-600 font-bold text-xs md:text-sm">+30</span>
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm md:text-base">Complete a Ride</p>
              <p class="text-xs md:text-sm text-gray-600">Finish carpooling trips</p>
            </div>
          </div>
          <div class="flex items-start space-x-2 md:space-x-3">
            <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span class="text-green-600 font-bold text-xs md:text-sm">+20</span>
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm md:text-base">Check-in to Activity</p>
              <p class="text-xs md:text-sm text-gray-600">Attend organized events</p>
            </div>
          </div>
          <div class="flex items-start space-x-2 md:space-x-3">
            <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span class="text-green-600 font-bold text-xs md:text-sm">+15</span>
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm md:text-base">Marketplace Transaction</p>
              <p class="text-xs md:text-sm text-gray-600">Buy or sell items</p>
            </div>
          </div>
          <div class="flex items-start space-x-2 md:space-x-3">
            <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span class="text-green-600 font-bold text-xs md:text-sm">+10</span>
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm md:text-base">Join an Activity</p>
              <p class="text-xs md:text-sm text-gray-600">Participate in community events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  TrophyOutlined,
  StarFilled,
  ExclamationCircleOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { leaderboardAPI } from '@/utils/api'
import ClickableAvatar from '@/components/common/ClickableAvatar.vue'

// State
const loading = ref(true)
const error = ref(null)
const leaderboardData = ref([])
const myRank = ref(null)

// Methods
const fetchLeaderboard = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch top 50 users
    const leaderboardRes = await leaderboardAPI.getLeaderboard({ limit: 50 })
    if (leaderboardRes.data.success) {
      leaderboardData.value = leaderboardRes.data.data.users || []
    } else {
      throw new Error(leaderboardRes.data.error?.message || 'Failed to fetch leaderboard')
    }

    // Fetch my rank
    try {
      const rankRes = await leaderboardAPI.getMyRank()
      if (rankRes.data.success) {
        myRank.value = rankRes.data.data
      }
    } catch (err) {
      // It's okay if we can't get rank (user might not be logged in)
      console.log('Could not fetch user rank:', err.message)
    }
  } catch (err) {
    console.error('Fetch leaderboard error:', err)
    error.value = err.message || 'Failed to load leaderboard'
    message.error(error.value)
  } finally {
    loading.value = false
  }
}

const getRankMessage = (rank) => {
  if (rank === 1) return '🏆 You\'re #1! Amazing!'
  if (rank <= 3) return '🥇 Top 3! Keep it up!'
  if (rank <= 10) return '⭐ Top 10! Great job!'
  if (rank <= 20) return '💪 Top 20! You\'re doing well!'
  return '👍 Keep earning points!'
}

// Lifecycle
onMounted(() => {
  fetchLeaderboard()
})
</script>

<style scoped>
.main-content {
  min-height: calc(100vh - 64px);
}
</style>
