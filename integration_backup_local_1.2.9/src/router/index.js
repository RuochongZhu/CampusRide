import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import EmailVerificationView from '@/views/EmailVerificationView.vue'
import ResendVerificationView from '@/views/ResendVerificationView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import RideshareView from '@/views/RideshareView.vue'
import ActivitiesView from '@/views/ActivitiesView.vue'
import CreateActivityView from '@/views/CreateActivityView.vue'
import ActivityDetailView from '@/views/ActivityDetailView.vue'
import ParticipationHistoryView from '@/views/ParticipationHistoryView.vue'
import MarketplaceView from '@/views/MarketplaceView.vue'
import MyMarketplaceItems from '@/views/MyMarketplaceItems.vue'
import MyFavoritesView from '@/views/MyFavoritesView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import GroupMapView from '@/views/GroupMapView.vue'
import GroupDetailView from '@/views/GroupDetailView.vue'
import MessagesView from '@/views/MessagesView.vue'
import AvatarTestView from '@/views/AvatarTestView.vue'
import UserProfileView from '@/views/UserProfileView.vue'
import AdminView from '@/views/AdminView.vue'

// Legal Pages
import TermsOfServiceView from '@/views/TermsOfServiceView.vue'
import PrivacyPolicyView from '@/views/PrivacyPolicyView.vue'
import CookiePolicyView from '@/views/CookiePolicyView.vue'
import CarpoolDisclaimerView from '@/views/CarpoolDisclaimerView.vue'
import DisclosuresView from '@/views/DisclosuresView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: { 
      requiresAuth: true,
      title: 'CampusRide - Campus Transportation & Community'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { 
      requiresAuth: false,
      title: 'Login - CampusRide',
      hideNavigation: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { 
      requiresAuth: false,
      title: 'Register - CampusRide',
      hideNavigation: true
    }
  },
  {
    path: '/verify-email/:token',
    name: 'EmailVerification',
    component: EmailVerificationView,
    meta: { 
      requiresAuth: false,
      title: 'Email Verification - CampusRide',
      hideNavigation: true
    }
  },
  {
    path: '/resend-verification',
    name: 'ResendVerification',
    component: ResendVerificationView,
    meta: { 
      requiresAuth: false,
      title: 'Resend Verification - CampusRide',
      hideNavigation: true
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView,
    meta: { 
      requiresAuth: false,
      title: 'Forgot Password - CampusRide',
      hideNavigation: true
    }
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPasswordView,
    meta: { 
      requiresAuth: false,
      title: 'Reset Password - CampusRide',
      hideNavigation: true
    }
  },
  {
    path: '/rideshare',
    name: 'Rideshare',
    component: RideshareView,
    meta: { 
      requiresAuth: true,
      title: 'Rideshare - CampusRide'
    }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: ActivitiesView,
    meta: {
      requiresAuth: true,
      title: 'Campus Activities - CampusRide'
    }
  },
  {
    path: '/activities/create',
    name: 'CreateActivity',
    component: CreateActivityView,
    meta: {
      requiresAuth: true,
      title: 'Create Activity - CampusRide'
    }
  },
  {
    path: '/activities/history',
    name: 'ParticipationHistory',
    component: ParticipationHistoryView,
    meta: {
      requiresAuth: true,
      title: 'Participation History - CampusRide'
    }
  },
  {
    path: '/activities/:id',
    name: 'ActivityDetail',
    component: ActivityDetailView,
    meta: {
      requiresAuth: true,
      title: 'Activity Details - CampusRide'
    }
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: MarketplaceView,
    meta: {
      requiresAuth: true,
      title: 'Campus Marketplace - CampusRide'
    }
  },
  {
    path: '/marketplace/my-items',
    name: 'MyMarketplaceItems',
    component: MyMarketplaceItems,
    meta: {
      requiresAuth: true,
      title: 'My Items - CampusRide'
    }
  },
  {
    path: '/marketplace/favorites',
    name: 'MyFavorites',
    component: MyFavoritesView,
    meta: {
      requiresAuth: true,
      title: 'My Favorites - CampusRide'
    }
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: LeaderboardView,
    meta: {
      requiresAuth: true,
      title: 'Leaderboard - CampusRide'
    }
  },
  {
    path: '/groups',
    name: 'Groups',
    component: GroupMapView,
    meta: {
      requiresAuth: true,
      title: 'Campus Groups - CampusRide'
    }
  },
  {
    path: '/groups/:id',
    name: 'GroupDetail',
    component: GroupDetailView,
    meta: {
      requiresAuth: true,
      title: 'Group Details - CampusRide'
    }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: MessagesView,
    meta: {
      requiresAuth: true,
      title: 'Messages - CampusRide'
    }
  },
  {
    path: '/test-avatar',
    name: 'AvatarTest',
    component: AvatarTestView,
    meta: {
      requiresAuth: false,
      title: 'ClickableAvatar Test - CampusRide'
    }
  },
  {
    path: '/profile/:userId',
    name: 'UserProfile',
    component: UserProfileView,
    meta: {
      requiresAuth: true,
      title: 'User Profile - CampusRide'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: {
      requiresAuth: true,
      title: 'Admin Panel - CampusRide'
    }
  },
  // Legal Pages - Public Access
  {
    path: '/terms',
    name: 'TermsOfService',
    component: TermsOfServiceView,
    meta: {
      requiresAuth: false,
      title: 'Terms of Service - CampusRide'
    }
  },
  {
    path: '/privacy',
    name: 'PrivacyPolicy',
    component: PrivacyPolicyView,
    meta: {
      requiresAuth: false,
      title: 'Privacy Policy - CampusRide'
    }
  },
  {
    path: '/cookies',
    name: 'CookiePolicy',
    component: CookiePolicyView,
    meta: {
      requiresAuth: false,
      title: 'Cookie Policy - CampusRide'
    }
  },
  {
    path: '/carpool-disclaimer',
    name: 'CarpoolDisclaimer',
    component: CarpoolDisclaimerView,
    meta: {
      requiresAuth: false,
      title: 'Carpool Disclaimer - CampusRide'
    }
  },
  {
    path: '/disclosures',
    name: 'Disclosures',
    component: DisclosuresView,
    meta: {
      requiresAuth: false,
      title: 'Disclosures & Transparency - CampusRide'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 全局导航守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'CampusRide'
  
  const requiresAuth = to.meta.requiresAuth
  const isAuthenticated = checkAuthStatus()
  
  if (requiresAuth && !isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/home')
  } else {
    next()
  }
})

function checkAuthStatus() {
  // 简化版认证检查，你可以后续完善
  const token = localStorage.getItem('userToken')
  return !!token
}

export default router
