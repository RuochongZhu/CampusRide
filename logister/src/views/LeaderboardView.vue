<template>
<div class="min-h-screen bg-[#EDEEE8] pt-16">
  <div class="pt-8 px-4 max-w-7xl mx-auto">
    <!-- Header Controls -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-[#333333]">Leaderboard</h1>
      <div class="flex items-center space-x-4">
        <a-select v-model:value="timePeriod" class="w-40">
          <a-select-option value="week">This Week</a-select-option>
          <a-select-option value="month">This Month</a-select-option>
          <a-select-option value="all">All Time</a-select-option>
        </a-select>
        <a-button @click="refreshData">
          <template #icon><SyncOutlined :spin="isRefreshing" /></template>
          Refresh
        </a-button>
      </div>
    </div>

    <!-- Personal Ranking Card -->
    <div class="bg-gradient-to-r from-[#C24D45] to-[#63B5B7] p-1 rounded-lg mb-8">
      <div class="bg-white rounded-lg p-6 flex items-center justify-between">
        <div class="flex items-center space-x-6">
          <img :src="currentUser.avatar" class="w-16 h-16 rounded-full border-4 border-[#C24D45]" />
          <div>
            <h3 class="text-xl font-bold text-[#333333]">{{ currentUser.name }}</h3>
            <p class="text-[#666666]">{{ currentUser.department }}</p>
          </div>
        </div>
        <div class="flex items-center space-x-12">
          <div class="text-center">
            <p class="text-3xl font-bold text-[#C24D45]">{{ currentUser.points }}</p>
            <p class="text-sm text-[#666666]">Total Points</p>
          </div>
          <div class="text-center">
            <div class="flex items-center justify-center space-x-2">
              <p class="text-3xl font-bold text-[#333333]">#{{ currentUser.rank }}</p>
              <TrophyOutlined :class="['text-2xl', currentUser.rankChange > 0 ? 'text-green-500' : 'text-red-500']" />
            </div>
            <p class="text-sm text-[#666666]">Current Rank</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard Categories -->
    <a-tabs v-model:activeKey="activeCategory" centered>
      <a-tab-pane v-for="category in categories" :key="category.key" :tab="category.label">
        <!-- Top 3 Winners -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div v-for="winner in topWinners" :key="winner.rank" 
               :class="['relative pt-12', 
                        winner.rank === 2 ? 'md:order-1' : 
                        winner.rank === 1 ? 'md:order-2' : 'md:order-3']">
            <div class="bg-white rounded-lg p-4 text-center relative shadow-lg">
              <div class="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <img :src="winner.avatar" :class="['rounded-full border-4', 
                                                 winner.rank === 1 ? 'w-24 h-24 border-yellow-400' :
                                                 'w-20 h-20 border-gray-300']" />
                <div :class="['absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold',
                             winner.rank === 1 ? 'bg-yellow-400' :
                             winner.rank === 2 ? 'bg-gray-400' : 'bg-orange-400']">
                  #{{ winner.rank }}
                </div>
              </div>
              <h3 class="font-bold text-lg mt-12">{{ winner.name }}</h3>
              <p class="text-[#666666] text-sm">{{ winner.department }}</p>
              <p class="text-2xl font-bold text-[#C24D45] mt-2">{{ winner.points }} pts</p>
            </div>
          </div>
        </div>

        <!-- Rankings List -->
        <div class="bg-white rounded-lg overflow-hidden shadow-lg">
          <div v-for="(user, index) in rankings" :key="user.id" 
               class="flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-0">
            <div class="flex items-center space-x-4">
              <span class="w-8 text-center font-bold text-lg text-[#666666]">{{ index + 4 }}</span>
              <img :src="user.avatar" class="w-12 h-12 rounded-full" />
              <div>
                <h4 class="font-medium">{{ user.name }}</h4>
                <p class="text-sm text-[#666666]">{{ user.department }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-8">
              <div class="text-center w-20">
                <p class="font-bold text-[#C24D45]">{{ user.points }}</p>
                <p class="text-sm text-[#666666]">Points</p>
              </div>
              <div class="flex items-center space-x-2 w-12">
                <ArrowUpOutlined v-if="user.rankChange > 0" class="text-green-500" />
                <ArrowDownOutlined v-else-if="user.rankChange < 0" class="text-red-500" />
                <MinusOutlined v-else class="text-gray-400" />
                <span class="text-sm" :class="user.rankChange > 0 ? 'text-green-500' : 
                                            user.rankChange < 0 ? 'text-red-500' : 'text-gray-400'">
                  {{ Math.abs(user.rankChange) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</div>
</template>

<script setup>
import { ref } from 'vue';
import { SyncOutlined, TrophyOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons-vue';
import { Select as ASelect, SelectOption as ASelectOption, Button as AButton, Tabs as ATabs, TabPane as ATabPane } from 'ant-design-vue';

const timePeriod = ref('week');
const activeCategory = ref('drivers');
const isRefreshing = ref(false);

const categories = [
  { key: 'drivers', label: 'Most Reliable Drivers' },
  { key: 'socializers', label: 'Most Active Socializers' },
  { key: 'sellers', label: 'Most Popular Sellers' },
  { key: 'citizens', label: 'Most Helpful Citizens' }
];

const currentUser = ref({
  name: 'Alexander Mitchell',
  department: 'Computer Science',
  points: 2850,
  rank: 5,
  rankChange: 2,
  avatar: 'https://public.readdy.ai/ai/img_res/34344f5c5a5a59c7f67e76e5fd3062b6.jpg'
});

const topWinners = ref([
  { rank: 2, name: 'Benjamin Taylor', department: 'Environmental Science', points: 3200, avatar: 'https://public.readdy.ai/ai/img_res/a6bf7fdb1258422077a774b770df37d0.jpg' },
  { rank: 1, name: 'Isabella Rodriguez', department: 'Business Analytics', points: 3450, avatar: 'https://public.readdy.ai/ai/img_res/fdf2cd9aa208e8cf18ce944b0519c14e.jpg' },
  { rank: 3, name: 'Sophia Chang', department: 'Data Science', points: 3100, avatar: 'https://public.readdy.ai/ai/img_res/f0f70d0a24f666b13ae89c45db93a711.jpg' }
]);

const rankings = ref([
  { id: 4, name: 'William Anderson', department: 'Mechanical Engineering', points: 2950, rankChange: 1, avatar: 'https://public.readdy.ai/ai/img_res/85bd80873f4e375d7f940b48ed1b1f29.jpg' },
  { id: 5, name: 'Olivia Martinez', department: 'Psychology', points: 2800, rankChange: -2, avatar: 'https://public.readdy.ai/ai/img_res/000b2ffe4c3d9d6a67786db96c55a534.jpg' },
  { id: 6, name: 'Ethan Parker', department: 'Architecture', points: 2750, rankChange: 0, avatar: 'https://public.readdy.ai/ai/img_res/62b06f4bd2d315327fd61b2d922b62db.jpg' }
]);

const refreshData = () => {
  isRefreshing.value = true;
  setTimeout(() => {
    isRefreshing.value = false;
  }, 1000);
};
</script>

<style scoped>
:deep(.ant-tabs-nav::before) {
  border-bottom: 1px solid #dcdcdc !important;
}

:deep(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #C24D45;
}

:deep(.ant-tabs-ink-bar) {
  background: #C24D45;
}

:deep(.ant-select-selector:hover) {
  border-color: #C24D45 !important;
}

:deep(.ant-select-focused .ant-select-selector) {
  border-color: #C24D45 !important;
  box-shadow: 0 0 0 2px rgba(194, 77, 69, 0.2) !important;
}
</style>
