<template>
  <header class="fixed top-0 left-0 right-0 bg-[#EDEEE8] shadow-sm z-50">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-8">
        <router-link
          to="/"
          class="text-3xl font-bold text-[#C24D45] tracking-wider"
          style="font-family: 'VT323', monospace"
        >
          CampusRide
        </router-link>

        <nav class="hidden md:flex items-center space-x-6">
          <router-link
            to="/rideshare"
            class="nav-link"
            :class="{ active: $route.path.includes('rideshare') }"
          >
            Carpooling
          </router-link>
          <router-link
            to="/marketplace"
            class="nav-link"
            :class="{ active: $route.path.includes('marketplace') }"
          >
            Marketplace
          </router-link>
          <router-link
            to="/activities"
            class="nav-link"
            :class="{ active: $route.path.includes('activities') }"
          >
            Activities
          </router-link>
          <router-link
            to="/leaderboard"
            class="nav-link"
            :class="{ active: $route.path.includes('leaderboard') }"
          >
            Leaderboard
          </router-link>
        </nav>
      </div>

      <div class="flex items-center space-x-4">
        <div class="relative">
          <input
            type="text"
            placeholder="Search..."
            class="pl-10 pr-4 py-2 rounded-full border border-[#63B5B7] focus:outline-none focus:border-[#63B5B7]"
          />
          <SearchOutlined class="absolute left-3 top-2.5 text-[#666666]" />
        </div>
        <div class="relative hover:scale-110 transition-transform duration-300">
          <BellOutlined
            class="text-xl text-[#666666] cursor-pointer hover:text-[#C24D45]"
            @click="handleBellClick"
          />
          <span
            v-if="unreadCount > 0"
            class="absolute -top-1 -right-1 w-4 h-4 bg-[#C24D45] rounded-full text-white text-xs flex items-center justify-center"
            >{{ unreadCount > 99 ? '99+' : unreadCount }}</span
          >
        </div>
        <div class="relative">
          <div
            class="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform duration-300"
            @click="toggleUserMenu"
          >
            <img :src="userAvatar" class="w-8 h-8 rounded-full" />
            <span class="text-sm font-medium text-[#333333]">{{
              userName
            }}</span>
          </div>
          <div
            v-if="isUserMenuOpen"
            class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
          >
            <a
              @click="logout"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >Logout</a
            >
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { SearchOutlined, BellOutlined } from "@ant-design/icons-vue";
import { messagesAPI } from "@/utils/api";
import { message } from 'ant-design-vue';

const router = useRouter();
const isUserMenuOpen = ref(false);
const unreadCount = ref(0);
let intervalId = null;

const userAvatar =
  "https://public.readdy.ai/ai/img_res/9a0c9c6cdab1f4bc283dccbb036ec8a1.jpg";
const userName = ref("Guest");

// Load user data from localStorage
const loadUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      // Use first_name (which contains the nickname) or fallback to email
      userName.value = user.first_name || user.email?.split('@')[0] || 'User';
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    userName.value = 'User';
  }
};

// Load unread message count
const loadUnreadCount = async () => {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) {
      unreadCount.value = 0;
      return;
    }

    const response = await messagesAPI.getUnreadCount();
    if (response.data?.success) {
      unreadCount.value = response.data.data.count || 0;
    }
  } catch (error) {
    // Silently fail if not authenticated or API unavailable
    console.log('Could not load unread count:', error.message);
    unreadCount.value = 0;
  }
};

// Handle bell icon click
const handleBellClick = () => {
  router.push('/messages');
};

// Load user data when component mounts
onMounted(() => {
  loadUserData();
  loadUnreadCount();

  // Poll for new messages every 30 seconds
  intervalId = setInterval(() => {
    loadUnreadCount();
  }, 30000);
});

// Cleanup interval on unmount
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

const logout = () => {
  // Clear all user data from localStorage
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  isUserMenuOpen.value = false;
  router.push("/login");
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=VT323&display=swap");

.nav-link {
  @apply text-[#666666] hover:text-[#C24D45] font-medium relative;
}

.nav-link.active {
  @apply text-[#C24D45];
}

.nav-link::after {
  content: "";
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -4px;
  left: 0;
  background-color: #c24d45;
  transition: width 0.3s ease;
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

input[type="text"] {
  @apply text-sm;
}

input[type="text"]:focus {
  @apply ring-2 ring-[#63B5B7] ring-opacity-50;
}
</style>
