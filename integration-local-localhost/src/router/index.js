import { createRouter, createWebHistory } from 'vue-router'

const LoginView = () => import('@/views/LoginView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')
const EmailVerificationView = () => import('@/views/EmailVerificationView.vue')
const ResendVerificationView = () => import('@/views/ResendVerificationView.vue')
const ForgotPasswordView = () => import('@/views/ForgotPasswordView.vue')
const ResetPasswordView = () => import('@/views/ResetPasswordView.vue')
const RideshareView = () => import('@/views/RideshareView.vue')
const ActivitiesView = () => import('@/views/ActivitiesView.vue')
const CreateActivityView = () => import('@/views/CreateActivityView.vue')
const ActivityDetailView = () => import('@/views/ActivityDetailView.vue')
const ParticipationHistoryView = () => import('@/views/ParticipationHistoryView.vue')
const MarketplaceView = () => import('@/views/MarketplaceView.vue')
const MyMarketplaceItems = () => import('@/views/MyMarketplaceItems.vue')
const MyFavoritesView = () => import('@/views/MyFavoritesView.vue')
const LeaderboardView = () => import('@/views/LeaderboardView.vue')
const GroupMapView = () => import('@/views/GroupMapView.vue')
const GroupDetailView = () => import('@/views/GroupDetailView.vue')
const MessagesView = () => import('@/views/MessagesView.vue')
const AvatarTestView = () => import('@/views/AvatarTestView.vue')
const UserProfileView = () => import('@/views/UserProfileView.vue')
const AdminView = () => import('@/views/AdminView.vue')
const TermsOfServiceView = () => import('@/views/TermsOfServiceView.vue')
const PrivacyPolicyView = () => import('@/views/PrivacyPolicyView.vue')
const CookiePolicyView = () => import('@/views/CookiePolicyView.vue')
const CarpoolDisclaimerView = () => import('@/views/CarpoolDisclaimerView.vue')
const DisclosuresView = () => import('@/views/DisclosuresView.vue')

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/home',
    redirect: '/marketplace'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      title: 'Login - CampusGo',
      hideNavigation: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { 
      requiresAuth: false,
      title: 'Register - CampusGo',
      hideNavigation: true
    }
  },
  {
    path: '/verify-email/:token',
    name: 'EmailVerification',
    component: EmailVerificationView,
    meta: { 
      requiresAuth: false,
      title: 'Email Verification - CampusGo',
      hideNavigation: true
    }
  },
  {
    path: '/resend-verification',
    name: 'ResendVerification',
    component: ResendVerificationView,
    meta: { 
      requiresAuth: false,
      title: 'Resend Verification - CampusGo',
      hideNavigation: true
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView,
    meta: { 
      requiresAuth: false,
      title: 'Forgot Password - CampusGo',
      hideNavigation: true
    }
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPasswordView,
    meta: { 
      requiresAuth: false,
      title: 'Reset Password - CampusGo',
      hideNavigation: true
    }
  },
  {
    path: '/rideshare',
    name: 'Rideshare',
    component: RideshareView,
    meta: { 
      requiresAuth: true,
      title: 'Rideshare - CampusGo'
    }
  },
  {
    path: '/rideshare/:id',
    name: 'RideshareDetail',
    component: RideshareView,
    meta: {
      requiresAuth: false,
      title: 'Ride Details - CampusGo'
    }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: ActivitiesView,
    meta: {
      requiresAuth: true,
      title: 'Campus Activities - CampusGo'
    }
  },
  {
    path: '/activities/create',
    name: 'CreateActivity',
    component: CreateActivityView,
    meta: {
      requiresAuth: true,
      title: 'Create Activity - CampusGo'
    }
  },
  {
    path: '/activities/history',
    name: 'ParticipationHistory',
    component: ParticipationHistoryView,
    meta: {
      requiresAuth: true,
      title: 'Participation History - CampusGo'
    }
  },
  {
    path: '/activities/:id',
    name: 'ActivityDetail',
    component: ActivityDetailView,
    meta: {
      requiresAuth: false,
      title: 'Activity Details - CampusGo'
    }
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: MarketplaceView,
    meta: {
      requiresAuth: true,
      title: 'Campus Marketplace - CampusGo'
    }
  },
  {
    path: '/marketplace/:id',
    name: 'MarketplaceDetail',
    component: MarketplaceView,
    meta: {
      requiresAuth: false,
      title: 'Marketplace Item - CampusGo'
    }
  },
  {
    path: '/marketplace/my-items',
    name: 'MyMarketplaceItems',
    component: MyMarketplaceItems,
    meta: {
      requiresAuth: true,
      title: 'My Items - CampusGo'
    }
  },
  {
    path: '/marketplace/favorites',
    name: 'MyFavorites',
    component: MyFavoritesView,
    meta: {
      requiresAuth: true,
      title: 'My Favorites - CampusGo'
    }
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: LeaderboardView,
    meta: {
      requiresAuth: true,
      title: 'Leaderboard - CampusGo'
    }
  },
  {
    path: '/groups',
    name: 'Groups',
    component: GroupMapView,
    meta: {
      requiresAuth: true,
      title: 'Campus Groups - CampusGo'
    }
  },
  {
    path: '/groups/:id',
    name: 'GroupDetail',
    component: GroupDetailView,
    meta: {
      requiresAuth: true,
      title: 'Group Details - CampusGo'
    }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: MessagesView,
    meta: {
      requiresAuth: true,
      title: 'Messages - CampusGo'
    }
  },
  {
    path: '/test-avatar',
    name: 'AvatarTest',
    component: AvatarTestView,
    meta: {
      requiresAuth: false,
      title: 'ClickableAvatar Test - CampusGo'
    }
  },
  {
    path: '/profile/:userId',
    name: 'UserProfile',
    component: UserProfileView,
    meta: {
      requiresAuth: true,
      title: 'User Profile - CampusGo'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: {
      requiresAuth: true,
      title: 'Admin Panel - CampusGo'
    }
  },
  // Legal Pages - Public Access
  {
    path: '/terms',
    name: 'TermsOfService',
    component: TermsOfServiceView,
    meta: {
      requiresAuth: false,
      title: 'Terms of Service - CampusGo'
    }
  },
  {
    path: '/privacy',
    name: 'PrivacyPolicy',
    component: PrivacyPolicyView,
    meta: {
      requiresAuth: false,
      title: 'Privacy Policy - CampusGo'
    }
  },
  {
    path: '/cookies',
    name: 'CookiePolicy',
    component: CookiePolicyView,
    meta: {
      requiresAuth: false,
      title: 'Cookie Policy - CampusGo'
    }
  },
  {
    path: '/carpool-disclaimer',
    name: 'CarpoolDisclaimer',
    component: CarpoolDisclaimerView,
    meta: {
      requiresAuth: false,
      title: 'Carpool Disclaimer - CampusGo'
    }
  },
  {
    path: '/disclosures',
    name: 'Disclosures',
    component: DisclosuresView,
    meta: {
      requiresAuth: false,
      title: 'Disclosures & Transparency - CampusGo'
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
  document.title = to.meta.title || 'CampusGo'
  
  const requiresAuth = to.meta.requiresAuth
  const isAuthenticated = checkAuthStatus()
  
  // Check if user is guest
  const storedUser = localStorage.getItem('userData')
  let isGuest = false
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser)
      isGuest = user?.isGuest || user?.role === 'guest'
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Block guest users from accessing profile
  if (to.name === 'UserProfile' && isGuest) {
    next('/')
    return
  }
  
  if (requiresAuth && !isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/activities')
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
