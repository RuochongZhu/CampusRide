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
        <div
          class="relative hover:scale-110 transition-transform duration-300 cursor-pointer"
          @click="handleNotificationClick"
        >
          <BellOutlined
            class="text-xl text-[#666666] hover:text-[#C24D45] transition-colors"
          />
          <span
            v-if="unreadCount > 0"
            class="absolute -top-1 -right-1 min-w-4 h-4 bg-[#C24D45] rounded-full text-white text-xs flex items-center justify-center px-1"
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

    <!-- Notifications Modal -->
    <div
      v-if="showNotificationModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16"
      @click="showNotificationModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-hidden mx-4 mt-4"
        @click.stop
      >
        <!-- Header -->
        <div class="bg-[#C24D45] text-white px-4 py-3 flex justify-between items-center">
          <h3 class="font-semibold">Notifications</h3>
          <button
            @click="showNotificationModal = false"
            class="text-white hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loadingNotifications" class="p-4 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C24D45] mx-auto mb-2"></div>
          <p class="text-gray-500 text-sm">Loading notifications...</p>
        </div>

        <!-- Notifications List -->
        <div v-else-if="notifications.length > 0" class="max-h-80 overflow-y-auto">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="border-b border-gray-100 p-4 hover:bg-gray-50"
            :class="{ 'bg-blue-50': !notification.is_read }"
          >
            <!-- Notification Content -->
            <div class="mb-2">
              <p class="text-sm font-medium text-gray-900">{{ notification.message }}</p>
              <p class="text-xs text-gray-500 mt-1">
                {{ formatTime(notification.created_at) }}
              </p>
            </div>

            <!-- Passenger Info (for booking requests) -->
            <div v-if="notification.passenger" class="mb-3">
              <p class="text-xs text-gray-600">
                From: {{ notification.passenger.first_name }} {{ notification.passenger.last_name }}
                ({{ notification.passenger.email }})
              </p>
              <p v-if="notification.trip" class="text-xs text-gray-600">
                Trip: {{ notification.trip.title }}
              </p>
            </div>

            <!-- Action Buttons for pending booking requests -->
            <div
              v-if="notification.type === 'booking_request' && notification.status === 'pending'"
              class="flex space-x-2"
            >
              <button
                @click="respondToBooking(notification.id, 'accept')"
                class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Accept
              </button>
              <button
                @click="respondToBooking(notification.id, 'reject')"
                class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </div>

            <!-- Status for processed notifications -->
            <div v-else-if="notification.status !== 'pending'" class="text-xs">
              <span
                :class="{
                  'text-green-600': notification.status === 'accepted',
                  'text-red-600': notification.status === 'rejected'
                }"
              >
                {{ notification.status === 'accepted' ? '✓ Accepted' : '✗ Rejected' }}
              </span>
            </div>

            <!-- Mark as read button -->
            <button
              v-if="!notification.is_read"
              @click="markAsRead(notification.id)"
              class="text-xs text-blue-600 hover:text-blue-800 mt-2"
            >
              Mark as read
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="p-8 text-center">
          <BellOutlined class="text-4xl text-gray-300 mb-2" />
          <p class="text-gray-500">No notifications yet</p>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 text-center">
          <button
            @click="router.push('/notifications')"
            class="text-[#C24D45] hover:text-[#a83e37] text-sm font-medium"
          >
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { SearchOutlined, BellOutlined } from "@ant-design/icons-vue";
import { notificationsAPI } from "@/utils/api";

const router = useRouter();
const isUserMenuOpen = ref(false);
const showNotificationModal = ref(false);
const unreadCount = ref(0);
const notifications = ref([]);
const loadingNotifications = ref(false);

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

// Load unread notification count
const loadUnreadCount = async () => {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    const response = await notificationsAPI.getUnreadCount();
    if (response.data.success) {
      unreadCount.value = response.data.data.unread_count || 0;
    }
  } catch (error) {
    console.error('Error loading unread count:', error);
  }
};

// Load notifications
const loadNotifications = async () => {
  try {
    loadingNotifications.value = true;
    const token = localStorage.getItem('userToken');
    if (!token) return;

    const response = await notificationsAPI.getNotifications({
      page: 1,
      limit: 10,
      unreadOnly: false
    });

    if (response.data.success) {
      notifications.value = response.data.data.notifications || [];
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  } finally {
    loadingNotifications.value = false;
  }
};

// Handle notification click
const handleNotificationClick = () => {
  showNotificationModal.value = true;
  if (notifications.value.length === 0) {
    loadNotifications();
  }
};

// Respond to booking (accept/reject)
const respondToBooking = async (notificationId, action) => {
  try {
    await notificationsAPI.respondToBooking(notificationId, action);
    // Reload notifications and unread count
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  } catch (error) {
    console.error('Error responding to booking:', error);
  }
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  try {
    await notificationsAPI.markAsRead(notificationId);
    await loadUnreadCount();
    // Update the notification in the list
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.is_read = true;
    }
  } catch (error) {
    console.error('Error marking as read:', error);
  }
};

// Format time for display
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // More than 1 day
  const days = Math.floor(diff / 86400000);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  // Show actual date
  return date.toLocaleDateString();
};

// Auto-refresh notifications every 30 seconds
let refreshInterval;

// Load user data when component mounts
onMounted(() => {
  loadUserData();
  loadUnreadCount();

  // Set up auto-refresh for notifications
  refreshInterval = setInterval(loadUnreadCount, 30000); // Every 30 seconds
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
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
