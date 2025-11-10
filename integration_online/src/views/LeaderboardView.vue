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
        <a-button 
          :type="autoRefreshEnabled ? 'primary' : 'default'"
          @click="toggleAutoRefresh"
          class="ml-2"
        >
          <template #icon><SyncOutlined /></template>
          {{ autoRefreshEnabled ? 'Auto Refresh ON' : 'Auto Refresh OFF' }}
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { SyncOutlined, TrophyOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons-vue';
import { Select as ASelect, SelectOption as ASelectOption, Button as AButton, Tabs as ATabs, TabPane as ATabPane, message } from 'ant-design-vue';
import { leaderboardAPI } from '@/utils/api.js';

const timePeriod = ref('week');
const activeCategory = ref('overall');
const isRefreshing = ref(false);
const loading = ref(false);
const autoRefreshEnabled = ref(true); // 自动刷新开关

const categories = [
  { key: 'overall', label: 'Overall Ranking' },
  { key: 'drivers', label: 'Most Reliable Drivers' },
  { key: 'socializers', label: 'Most Active Socializers' },
  { key: 'sellers', label: 'Most Popular Sellers' },
  { key: 'citizens', label: 'Most Helpful Citizens' }
];

const currentUser = ref({
  name: 'Loading...',
  department: 'Loading...',
  points: 0,
  rank: 0,
  rankChange: 0,
  avatar: 'https://via.placeholder.com/100'
});

const topWinners = ref([]);
const rankings = ref([]);

       // 获取排行榜数据
       const fetchLeaderboard = async () => {
         try {
           loading.value = true;
           // 添加时间戳参数防止缓存
           const timestamp = Date.now();
           const response = await leaderboardAPI.getLeaderboard({
             category: activeCategory.value,
             timePeriod: timePeriod.value,
             limit: 20,
             _t: timestamp
           });

           if (response.data.success) {
             const users = response.data.data.users || [];

             // 设置前三名
             topWinners.value = users.slice(0, 3).map((user, index) => ({
               rank: index + 1,
               name: user.name,
               department: user.department,
               points: user.points,
               avatar: user.avatar_url || 'https://via.placeholder.com/100'
             }));

             // 设置其余排名
             rankings.value = users.slice(3).map((user, index) => ({
               id: user.id,
               name: user.name,
               department: user.department,
               points: user.points,
               rankChange: user.rankChange || 0,
               avatar: user.avatar_url || 'https://via.placeholder.com/100'
             }));
           }
         } catch (error) {
           console.error('Failed to fetch leaderboard:', error);
           // 显示模拟数据
           const mockUsers = [
             { id: 1, name: 'Alice Johnson', department: 'Computer Science', points: 250, avatar_url: 'https://via.placeholder.com/100' },
             { id: 2, name: 'Bob Smith', department: 'Engineering', points: 200, avatar_url: 'https://via.placeholder.com/100' },
             { id: 3, name: 'Carol Davis', department: 'Business', points: 180, avatar_url: 'https://via.placeholder.com/100' },
             { id: 4, name: 'David Wilson', department: 'Mathematics', points: 150, avatar_url: 'https://via.placeholder.com/100' },
             { id: 5, name: 'Eva Brown', department: 'Physics', points: 120, avatar_url: 'https://via.placeholder.com/100' }
           ];

           // 设置前三名
           topWinners.value = mockUsers.slice(0, 3).map((user, index) => ({
             rank: index + 1,
             name: user.name,
             department: user.department,
             points: user.points,
             avatar: user.avatar_url
           }));

           // 设置其余排名
           rankings.value = mockUsers.slice(3).map((user, index) => ({
             id: user.id,
             name: user.name,
             department: user.department,
             points: user.points,
             rankChange: 0,
             avatar: user.avatar_url
           }));
         } finally {
           loading.value = false;
         }
       };

       // 获取当前用户排名
       const fetchMyRanking = async () => {
         try {
           const token = localStorage.getItem('userToken');
           if (!token) {
             currentUser.value = {
               name: 'Please Login',
               department: 'to see your ranking',
               points: 0,
               rank: 0,
               rankChange: 0,
               avatar: 'https://via.placeholder.com/100'
             };
             return;
           }

           // 添加时间戳参数防止缓存
           const timestamp = Date.now();
           console.log('🔍 获取个人排名数据...');
           const response = await leaderboardAPI.getMyRank({
             category: activeCategory.value,
             timePeriod: timePeriod.value,
             _t: timestamp
           });
           console.log('📊 个人排名响应:', response);

           if (response.data.success && response.data.data.user) {
             const user = response.data.data.user;
             console.log('👤 用户数据:', user);
             currentUser.value = {
               name: `${user.first_name} ${user.last_name}`,
               department: user.major || user.university || 'Unknown',
               points: user.points,
               rank: user.rank,
               rankChange: user.rankChange || 0,
               avatar: user.avatar_url || 'https://via.placeholder.com/100'
             };
             console.log('✅ 更新后的用户信息:', currentUser.value);
           } else {
             // 用户没有排名数据
             currentUser.value = {
               name: 'No Ranking Data',
               department: 'Start earning points!',
               points: 0,
               rank: 0,
               rankChange: 0,
               avatar: 'https://via.placeholder.com/100'
             };
           }
         } catch (error) {
           console.error('Failed to fetch my ranking:', error);
           // 如果用户未登录，显示默认信息
           if (error.error?.code === 'TOKEN_INVALID' || error.error?.code === 'TOKEN_MISSING' || error.error?.code === 401) {
             currentUser.value = {
               name: 'Please Login',
               department: 'to see your ranking',
               points: 0,
               rank: 0,
               rankChange: 0,
               avatar: 'https://via.placeholder.com/100'
             };
           } else {
             currentUser.value = {
               name: 'Error Loading',
               department: 'Please try again',
               points: 0,
               rank: 0,
               rankChange: 0,
               avatar: 'https://via.placeholder.com/100'
             };
           }
         }
       };

const refreshData = async () => {
  isRefreshing.value = true;
  await Promise.all([fetchLeaderboard(), fetchMyRanking()]);
  isRefreshing.value = false;
  message.success('Data refreshed successfully');
};

// 切换自动刷新
const toggleAutoRefresh = () => {
  autoRefreshEnabled.value = !autoRefreshEnabled.value;
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
    message.success('Auto refresh enabled');
  } else {
    stopAutoRefresh();
    message.info('Auto refresh disabled');
  }
};

// 自动刷新机制
let refreshInterval = null;
const startAutoRefresh = () => {
  if (!autoRefreshEnabled.value) return;
  
  // 每30秒自动刷新一次
  refreshInterval = setInterval(async () => {
    if (!document.hidden && autoRefreshEnabled.value) { // 只在页面可见且启用自动刷新时刷新
      console.log('🔄 自动刷新排行榜数据');
      await Promise.all([fetchLeaderboard(), fetchMyRanking()]);
    }
  }, 30000); // 30秒
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// 页面可见性变化监听
const handleVisibilityChange = () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    // 页面重新可见时立即刷新数据
    console.log('👁️ 页面重新可见，刷新排行榜数据');
    Promise.all([fetchLeaderboard(), fetchMyRanking()]);
    startAutoRefresh();
  }
};

// 监听分类和时间周期变化
watch([activeCategory, timePeriod], () => {
  fetchLeaderboard();
  fetchMyRanking();
});

// 组件挂载时获取数据
onMounted(() => {
  fetchLeaderboard();
  fetchMyRanking();
  startAutoRefresh();
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

// 组件卸载时清理
onUnmounted(() => {
  stopAutoRefresh();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
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
