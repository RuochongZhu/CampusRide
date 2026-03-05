<template>
<div class="min-h-screen bg-[#EDEEE8]">

<!-- Hero Section -->
<section class="pt-20 md:pt-24 pb-8 md:pb-16 bg-gradient-to-r from-[#C24D45] to-[#63B5B7] text-white relative overflow-hidden">
<div class="absolute inset-0 bg-grid-pattern opacity-20"></div>
<div class="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-20"></div>
<div class="max-w-7xl mx-auto px-4">
<div>
<swiper
:modules="swiperModules"
:slides-per-view="1"
:space-between="30"
:autoplay="{ delay: 3000 }"
:pagination="{ clickable: true }"
class="h-full"
>
<swiper-slide v-for="(slide, index) in heroSlides" :key="index">
<div class="flex flex-col items-start">
<h2 class="text-2xl md:text-4xl font-bold mb-2 md:mb-4">{{ slide.title }}</h2>
<p class="text-sm md:text-lg mb-4 md:mb-8">{{ slide.description }}</p>
<img :src="slide.image" class="w-full h-40 md:h-64 object-cover rounded-lg mb-4 md:mb-8" />
<router-link :to="slide.link">
<button class="bg-white text-[#C24D45] px-4 md:px-6 py-2 md:py-3 text-sm md:text-base hover:bg-[#EDEEE8] whitespace-nowrap rounded-lg transition-colors duration-300">Get Started</button>
</router-link>
</div>
</swiper-slide>
</swiper>
</div>
</div>
</section>

<!-- Popular Routes -->
<section class="py-8 md:py-16 bg-[#EDEEE8]">
<div class="max-w-7xl mx-auto px-4">
<div class="flex justify-between items-center mb-4 md:mb-8">
<h3 class="text-xl md:text-2xl font-bold text-[#333333]">Popular Routes</h3>
<router-link to="/rideshare" class="text-sm md:text-base text-[#C24D45] hover:text-[#63B5B7] font-medium flex items-center">
<span class="hidden sm:inline">View Carpooling</span>
<span class="sm:hidden">View</span>
<RightOutlined class="ml-1 md:ml-2" />
</router-link>
</div>
<swiper
:modules="swiperModules"
:slides-per-view="1.2"
:space-between="12"
:breakpoints="routesBreakpoints"
class="w-full"
>
<swiper-slide v-for="route in popularRoutes" :key="route.id">
<router-link to="/rideshare">
<div class="bg-white rounded-lg shadow-sm p-4 md:p-6 cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-lg backdrop-blur-sm bg-opacity-90">
<div class="flex items-center mb-3 md:mb-4">
<EnvironmentOutlined class="text-lg md:text-xl text-[#63B5B7] mr-2" />
<div>
<div class="font-medium text-sm md:text-base text-[#333333]">{{ route.from }}</div>
<div class="text-xs md:text-sm text-[#666666]">To: {{ route.to }}</div>
</div>
</div>
<div class="text-xs md:text-sm text-[#666666] mb-1 md:mb-2">
<ClockCircleOutlined class="mr-1" /> {{ route.time }}
</div>
<div class="text-xs md:text-sm text-[#666666]">
<TeamOutlined class="mr-1" /> {{ route.riders }} active carpools
</div>
</div>
</router-link>
</swiper-slide>
</swiper>
</div>
</section>

<!-- Marketplace Highlights -->
<section class="py-8 md:py-16 bg-white">
<div class="max-w-7xl mx-auto px-4">
<div class="flex justify-between items-center mb-4 md:mb-8">
<h3 class="text-xl md:text-2xl font-bold text-[#333333]">Marketplace Highlights</h3>
<router-link to="/marketplace" class="text-sm md:text-base text-[#C24D45] hover:text-[#63B5B7] font-medium flex items-center">
<span class="hidden sm:inline">Campus Marketplace</span>
<span class="sm:hidden">View</span>
<RightOutlined class="ml-1 md:ml-2" />
</router-link>
</div>
<swiper
:modules="swiperModules"
:slides-per-view="1.5"
:space-between="12"
:breakpoints="marketplaceBreakpoints"
class="w-full"
>
<swiper-slide v-for="item in marketplaceItems" :key="item.id">
<router-link to="/marketplace">
<div class="bg-[#EDEEE8] rounded-lg shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-lg backdrop-blur-sm bg-opacity-90">
<img :src="item.image" class="w-full h-32 md:h-48 object-cover" />
<div class="p-3 md:p-4">
<h4 class="font-medium mb-1 md:mb-2 text-sm md:text-base text-[#333333] truncate">{{ item.title }}</h4>
<div class="flex items-center justify-between">
<span class="text-base md:text-lg font-bold text-[#C24D45]">${{ item.price }}</span>
<div class="flex items-center">
<StarFilled class="text-[#F9D367] mr-1 text-sm" />
<span class="text-xs md:text-sm text-[#666666]">{{ item.rating }}</span>
</div>
</div>
</div>
</div>
</router-link>
</swiper-slide>
</swiper>
</div>
</section>

<!-- Popular Activities -->
<section class="py-8 md:py-16 bg-white">
<div class="max-w-7xl mx-auto px-4">
<div class="flex justify-between items-center mb-4 md:mb-8">
<h3 class="text-xl md:text-2xl font-bold text-[#333333]">Popular Activities</h3>
<router-link to="/activities" class="text-sm md:text-base text-[#C24D45] hover:text-[#63B5B7] font-medium flex items-center">
<span class="hidden sm:inline">Campus Activities</span>
<span class="sm:hidden">View</span>
<RightOutlined class="ml-1 md:ml-2" />
</router-link>
</div>
<swiper
:modules="swiperModules"
:slides-per-view="1.5"
:space-between="12"
:breakpoints="activitiesBreakpoints"
class="w-full"
>
<swiper-slide v-for="activity in activities" :key="activity.id">
<router-link to="/activities">
<div class="bg-[#EDEEE8] rounded-lg shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-lg backdrop-blur-sm bg-opacity-90">
<img :src="activity.image" class="w-full h-32 md:h-48 object-cover" />
<div class="p-3 md:p-4">
<h4 class="font-medium mb-1 md:mb-2 text-sm md:text-base text-[#333333] truncate">{{ activity.title }}</h4>
<div class="flex items-center justify-between">
<span class="text-xs md:text-sm text-[#666666]">{{ activity.date }}</span>
<div class="flex items-center">
<TeamOutlined class="text-[#63B5B7] mr-1 text-sm" />
<span class="text-xs md:text-sm text-[#666666]">{{ activity.participants }}</span>
</div>
</div>
</div>
</div>
</router-link>
</swiper-slide>
</swiper>
</div>
</section>

</div>
</template>

<script setup>
import { ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Autoplay, EffectFade } from 'swiper/modules'
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  StarFilled,
  RightOutlined
} from '@ant-design/icons-vue'

const swiperModules = [Pagination, Autoplay, EffectFade]

// Swiper responsive breakpoints
const routesBreakpoints = {
  // Mobile: 1.2 slides
  320: { slidesPerView: 1.2, spaceBetween: 12 },
  // Tablet: 2.2 slides
  640: { slidesPerView: 2.2, spaceBetween: 16 },
  // Desktop: 3.2 slides
  1024: { slidesPerView: 3.2, spaceBetween: 20 }
}

const marketplaceBreakpoints = {
  // Mobile: 1.5 slides
  320: { slidesPerView: 1.5, spaceBetween: 12 },
  // Small tablet: 2.2 slides
  480: { slidesPerView: 2.2, spaceBetween: 14 },
  // Tablet: 3.2 slides
  768: { slidesPerView: 3.2, spaceBetween: 16 },
  // Desktop: 4.2 slides
  1024: { slidesPerView: 4.2, spaceBetween: 20 }
}

const activitiesBreakpoints = {
  // Mobile: 1.5 slides
  320: { slidesPerView: 1.5, spaceBetween: 12 },
  // Small tablet: 2.2 slides
  480: { slidesPerView: 2.2, spaceBetween: 14 },
  // Tablet: 3.2 slides
  768: { slidesPerView: 3.2, spaceBetween: 16 },
  // Desktop: 4.2 slides
  1024: { slidesPerView: 4.2, spaceBetween: 20 }
}

const heroSlides = [
  {
    title: 'Campus Leaderboard Champions',
    description: 'Join our top contributors and earn exclusive rewards for your campus engagement.',
    image: 'https://public.readdy.ai/ai/img_res/97d5e606f54cdcc8b4ba606651952576.jpg',
    link: '/leaderboard'
  },
  {
    title: 'Upcoming Campus Activities',
    description: 'Discover and join exciting events happening around your campus.',
    image: 'https://public.readdy.ai/ai/img_res/3aedf07eaf3eed59bd7fb15483c857f3.jpg',
    link: '/activities'
  },
  {
    title: 'Smart Campus Carpooling',
    description: 'Share rides with fellow students and make your commute more sustainable.',
    image: 'https://public.readdy.ai/ai/img_res/7f4cbd6255208873a1f48372973bd798.jpg',
    link: '/rideshare'
  },
  {
    title: 'Campus Marketplace',
    description: 'Buy, sell, and trade items within your trusted campus community.',
    image: 'https://public.readdy.ai/ai/img_res/5e50be881cae9e025ae38b436ff2befc.jpg',
    link: '/marketplace'
  }
]

const popularRoutes = [
  { id: 1, from: 'North Campus', to: 'Downtown Area', time: 'Weekdays 8:00 AM', riders: 15 },
  { id: 2, from: 'Student Housing', to: 'Main Campus', time: 'Daily 9:00 AM', riders: 23 },
  { id: 3, from: 'South Campus', to: 'Shopping District', time: 'Weekends 11:00 AM', riders: 18 },
  { id: 4, from: 'West Campus', to: 'Research Center', time: 'Weekdays 10:00 AM', riders: 12 },
  { id: 5, from: 'East Campus', to: 'Sports Complex', time: 'Daily 2:00 PM', riders: 20 },
  { id: 6, from: 'Library', to: 'Innovation Hub', time: 'Weekdays 1:00 PM', riders: 16 },
  { id: 7, from: 'Graduate Housing', to: 'Medical Center', time: 'Daily 7:30 AM', riders: 25 },
  { id: 8, from: 'International Center', to: 'Language School', time: 'Weekdays 9:30 AM', riders: 14 },
  { id: 9, from: 'Arts Building', to: 'Performance Hall', time: 'Weekends 3:00 PM', riders: 19 },
  { id: 10, from: 'Science Complex', to: 'Technology Park', time: 'Daily 8:30 AM', riders: 22 }
]

const marketplaceItems = [
  { id: 1, title: 'MacBook Pro 2024', price: 899, rating: 4.8, image: 'https://public.readdy.ai/ai/img_res/a7f671e64315a0a278764543d58c294b.jpg' },
  { id: 2, title: 'Mountain Bike', price: 299, rating: 4.6, image: 'https://public.readdy.ai/ai/img_res/2e0cbdbceb8be7f97d6fad444a161189.jpg' },
  { id: 3, title: 'Textbook Bundle', price: 125, rating: 4.9, image: 'https://public.readdy.ai/ai/img_res/55dfd7c25a4de7828a074200e5bf6faf.jpg' },
  { id: 4, title: 'Study Desk', price: 85, rating: 4.7, image: 'https://public.readdy.ai/ai/img_res/57826a3242ed0c6055808e6463c7303d.jpg' },
  { id: 5, title: 'Gaming Console', price: 450, rating: 4.8, image: 'https://public.readdy.ai/ai/img_res/fd32fbfb4499cd3c3ac1124f5738da64.jpg' },
  { id: 6, title: 'Camera Kit', price: 699, rating: 4.9, image: 'https://public.readdy.ai/ai/img_res/bb66ee23082045456321d0a778eeeb30.jpg' },
  { id: 7, title: 'Electric Scooter', price: 399, rating: 4.7, image: 'https://public.readdy.ai/ai/img_res/e70c2c3b26288bb181f771dc7ee2265b.jpg' },
  { id: 8, title: 'Dorm Essentials', price: 199, rating: 4.8, image: 'https://public.readdy.ai/ai/img_res/047a9aa08e104e43ee04792d1b8a4508.jpg' },
  { id: 9, title: 'Fitness Equipment', price: 249, rating: 4.6, image: 'https://public.readdy.ai/ai/img_res/70c651af7f2bb69217e8aa18e08e1ca8.jpg' },
  { id: 10, title: 'Art Supplies', price: 159, rating: 4.9, image: 'https://public.readdy.ai/ai/img_res/80ec65ceb90d38b68ded2a62993e8b3d.jpg' }
]

const activities = [
  { id: 1, title: 'Campus Music Festival', date: 'Apr 30, 2025', participants: '500+', image: 'https://readdy.ai/api/search-image?query=vibrant%20outdoor%20music%20festival%20on%20university%20campus%20with%20students%20enjoying%20live%20performances%20and%20colorful%20stage%20lighting&width=400&height=300&seq=22&orientation=landscape' },
  { id: 2, title: 'Tech Innovation Fair', date: 'May 2, 2025', participants: '300+', image: 'https://readdy.ai/api/search-image?query=modern%20university%20tech%20fair%20with%20students%20showcasing%20innovative%20projects%20and%20interactive%20displays&width=400&height=300&seq=23&orientation=landscape' },
  { id: 3, title: 'Sports Tournament', date: 'May 5, 2025', participants: '400+', image: 'https://readdy.ai/api/search-image?query=university%20sports%20tournament%20with%20students%20competing%20in%20various%20sports%20activities%20on%20modern%20campus%20facilities&width=400&height=300&seq=24&orientation=landscape' },
  { id: 4, title: 'Cultural Exchange Day', date: 'May 8, 2025', participants: '250+', image: 'https://readdy.ai/api/search-image?query=diverse%20group%20of%20students%20participating%20in%20cultural%20exchange%20activities%20with%20traditional%20performances%20and%20food%20stalls&width=400&height=300&seq=25&orientation=landscape' },
  { id: 5, title: 'Career Networking', date: 'May 10, 2025', participants: '350+', image: 'https://readdy.ai/api/search-image?query=professional%20networking%20event%20at%20university%20with%20students%20and%20industry%20professionals%20in%20modern%20conference%20setting&width=400&height=300&seq=26&orientation=landscape' }
]

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

.nav-link {
@apply text-[#666666] hover:text-[#C24D45] font-medium relative;
}

.nav-link::after {
content: '';
position: absolute;
width: 0;
height: 2px;
bottom: -4px;
left: 0;
background-color: #C24D45;
transition: width 0.3s ease;
}

.nav-link:hover::after {
width: 100%;
}

input[type="text"] {
@apply text-sm;
}

input[type="text"]:focus {
@apply ring-2 ring-[#63B5B7] ring-opacity-50;
}

.swiper-slide {
transition: transform 0.3s ease;
}

.swiper-slide:hover {
transform: translateY(-5px);
}
</style>
