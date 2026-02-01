<template>
  <header class="fixed top-0 left-0 right-0 bg-[#EDEEE8] shadow-sm z-50">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-4 md:space-x-8">
        <!-- Mobile hamburger menu button -->
        <button
          class="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-200 transition-colors"
          @click="openMobileMenu"
        >
          <MenuOutlined class="text-xl text-[#333333]" />
        </button>

        <div
          class="text-2xl md:text-3xl font-bold text-[#C24D45] tracking-wider"
          style="font-family: 'VT323', monospace"
        >
          CampusGo
        </div>

        <nav class="hidden md:flex items-center space-x-6">
          <router-link
            to="/activities"
            class="nav-link"
            :class="{ active: $route.path.includes('activities') }"
          >
            Activities
          </router-link>
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
            v-if="isAdmin"
            to="/admin"
            class="nav-link admin-link"
            :class="{ active: $route.path.includes('admin') }"
          >
            <SettingOutlined /> Admin
          </router-link>
        </nav>
      </div>

      <div class="flex items-center space-x-2 md:space-x-4">
        <NotificationDropdown />
        <!-- Avatar - directly opens profile sidebar -->
        <div
          class="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform duration-300"
          @click="openUserSidebar"
        >
          <img
            :src="userAvatar"
            class="w-8 h-8 rounded-full object-cover border-2 border-[#C24D45]"
            :alt="userName"
          />
          <span class="hidden sm:inline text-sm font-medium text-[#333333]">{{
            userName
          }}</span>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <a-drawer
      v-model:open="isMobileMenuOpen"
      placement="left"
      :width="280"
      :closable="true"
      :headerStyle="{ background: '#EDEEE8', borderBottom: '1px solid #e5e5e5' }"
      :bodyStyle="{ padding: 0, background: '#EDEEE8' }"
    >
      <template #title>
        <span class="text-xl font-bold text-[#C24D45]" style="font-family: 'VT323', monospace">
          CampusGo
        </span>
      </template>

      <div class="flex flex-col h-full">
        <!-- User Info Section -->
        <div class="p-4 border-b border-gray-200 bg-white/50">
          <div class="flex items-center space-x-3">
            <img
              :src="userAvatar"
              class="w-12 h-12 rounded-full object-cover border-2 border-[#C24D45]"
              :alt="userName"
            />
            <div>
              <div class="font-medium text-[#333333]">{{ userName }}</div>
              <div class="text-sm text-gray-500">{{ userEmail }}</div>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 py-2">
          <router-link
            to="/"
            class="mobile-nav-link"
            :class="{ active: $route.path === '/' }"
            @click="closeMobileMenu"
          >
            <HomeOutlined class="text-lg" />
            <span>Home</span>
          </router-link>

          <router-link
            to="/activities"
            class="mobile-nav-link"
            :class="{ active: $route.path.includes('activities') }"
            @click="closeMobileMenu"
          >
            <CalendarOutlined class="text-lg" />
            <span>Activities</span>
          </router-link>

          <router-link
            to="/rideshare"
            class="mobile-nav-link"
            :class="{ active: $route.path.includes('rideshare') }"
            @click="closeMobileMenu"
          >
            <CarOutlined class="text-lg" />
            <span>Carpooling</span>
          </router-link>

          <router-link
            to="/marketplace"
            class="mobile-nav-link"
            :class="{ active: $route.path.includes('marketplace') }"
            @click="closeMobileMenu"
          >
            <ShopOutlined class="text-lg" />
            <span>Marketplace</span>
          </router-link>

          <router-link
            to="/leaderboard"
            class="mobile-nav-link"
            :class="{ active: $route.path.includes('leaderboard') }"
            @click="closeMobileMenu"
          >
            <TrophyOutlined class="text-lg" />
            <span>Leaderboard</span>
          </router-link>

          <router-link
            to="/messages"
            class="mobile-nav-link"
            :class="{ active: $route.path.includes('messages') }"
            @click="closeMobileMenu"
          >
            <MessageOutlined class="text-lg" />
            <span>Messages</span>
          </router-link>

          <router-link
            v-if="isAdmin"
            to="/admin"
            class="mobile-nav-link admin"
            :class="{ active: $route.path.includes('admin') }"
            @click="closeMobileMenu"
          >
            <SettingOutlined class="text-lg" />
            <span>Admin Panel</span>
          </router-link>
        </nav>

        <!-- Bottom Actions -->
        <div class="border-t border-gray-200 p-4">
          <button
            class="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#C24D45] text-white rounded-lg hover:bg-[#A93C35] transition-colors"
            @click="handleMobileLogout"
          >
            <LogoutOutlined />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </a-drawer>

    <!-- User Sidebar -->
    <UserSidebar :isOpen="isUserSidebarOpen" @close="isUserSidebarOpen = false" @logout="logout" />
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  SettingOutlined,
  MenuOutlined,
  HomeOutlined,
  CalendarOutlined,
  CarOutlined,
  ShopOutlined,
  TrophyOutlined,
  MessageOutlined,
  LogoutOutlined
} from "@ant-design/icons-vue";
import NotificationDropdown from '@/components/common/NotificationDropdown.vue';
import UserSidebar from '@/components/user/UserSidebar.vue';
import { useAuthStore } from '@/stores/auth';

// Admin emails allowed to access admin panel
const ADMIN_EMAILS = ['rz469@university.edu'];

const router = useRouter();
const authStore = useAuthStore();
const isUserSidebarOpen = ref(false);
const isMobileMenuOpen = ref(false);
const userEmail = ref('');

// Check if current user is an admin
const isAdmin = computed(() => {
  return ADMIN_EMAILS.includes(userEmail.value);
});

const defaultAvatar = "/Profile_Photo.jpg";
const userAvatar = ref(defaultAvatar);
const userName = ref("Guest");

// Load user data from localStorage
const loadUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      // Use first_name (which contains the nickname) or fallback to email
      userName.value = user.first_name || user.email?.split('@')[0] || 'User';
      userEmail.value = user.email || '';
      // Load avatar_url
      userAvatar.value = user.avatar_url || defaultAvatar;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    userName.value = 'User';
    userEmail.value = '';
    userAvatar.value = defaultAvatar;
  }
};

// Listen for user data updates (e.g., after avatar upload)
const handleUserUpdate = () => {
  loadUserData();
};

// Mobile menu controls
const openMobileMenu = () => {
  isMobileMenuOpen.value = true;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

// Handle bell icon click
const handleBellClick = () => {
  router.push('/messages');
};

// Open user sidebar directly
const openUserSidebar = () => {
  isUserSidebarOpen.value = true;
};

// Load user data when component mounts
onMounted(() => {
  loadUserData();
  // Listen for user data updates (e.g., after avatar upload)
  window.addEventListener('user-updated', handleUserUpdate);
  window.addEventListener('storage', handleUserUpdate);
});

// Cleanup event listeners
onUnmounted(() => {
  window.removeEventListener('user-updated', handleUserUpdate);
  window.removeEventListener('storage', handleUserUpdate);
});

const logout = async () => {
  // Use auth store's logout to properly clear all tokens
  await authStore.logout();
  isUserSidebarOpen.value = false;
  router.push("/login");
};

const handleMobileLogout = () => {
  closeMobileMenu();
  logout();
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

.admin-link {
  @apply text-[#722ed1] hover:text-[#9254de];
  display: flex;
  align-items: center;
  gap: 4px;
}

.admin-link.active {
  @apply text-[#9254de];
}

.admin-link::after {
  background-color: #722ed1;
}

/* Mobile navigation link styles */
.mobile-nav-link {
  @apply flex items-center space-x-3 px-4 py-3 text-[#666666] hover:bg-white/70 hover:text-[#C24D45] transition-colors;
}

.mobile-nav-link.active {
  @apply bg-white/70 text-[#C24D45] border-l-4 border-[#C24D45];
}

.mobile-nav-link.admin {
  @apply text-[#722ed1] hover:text-[#9254de];
}

.mobile-nav-link.admin.active {
  @apply text-[#9254de] border-[#722ed1];
}

input[type="text"] {
  @apply text-sm;
}

input[type="text"]:focus {
  @apply ring-2 ring-[#63B5B7] ring-opacity-50;
}
</style>
