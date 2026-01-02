import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './assets/styles/main.css'
import { useAuthStore } from './stores/auth'
import { installAppRecovery } from './utils/appRecovery'

// 导入 Swiper 样式
import 'swiper/css';
import 'swiper/css/pagination';

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)
app.use(Antd)

// 初始化认证状态
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')

// Auto-recover when returning after long inactivity (sleep/background)
installAppRecovery()
