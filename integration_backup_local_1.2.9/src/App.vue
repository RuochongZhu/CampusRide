<template>
  <div id="app">
    <!-- 根据路由决定是否显示导航栏 -->
    <HeaderComponent v-if="!hideNavigation" />
    
    <!-- 路由视图 - 这里显示不同的页面 -->
    <router-view />
    
    <!-- 根据路由决定是否显示页脚 -->
    <FooterComponent v-if="!hideNavigation" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import HeaderComponent from '@/components/layout/HeaderComponent.vue'
import FooterComponent from '@/components/layout/FooterComponent.vue'
import { useAuthStore } from './stores/auth'



const route = useRoute()

onMounted(() => {
  const authStore = useAuthStore()
authStore.initializeAuth()

  const urlParams = new URLSearchParams(window.location.search)
  const tk = urlParams.get('tk')
  if (tk) {
    localStorage.setItem('tk', tk)
  }
})

// 计算是否隐藏导航栏（比如登录页面）
const hideNavigation = computed(() => {
  return route.meta.hideNavigation || false
})
</script>

<style>
@import './assets/styles/tailwind.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>

