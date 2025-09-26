<template>
<div class="min-h-screen bg-[#EDEEE8] pt-16">
  
  <!-- Search and Filter Section -->
  <div class="sticky top-16 z-40 bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 py-4">
      <div class="flex flex-col space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex-grow flex items-center space-x-4">
            <a-input-search
              v-model:value="searchQuery"
              placeholder="Search items..."
              class="max-w-xl"
              @search="handleSearch"
            />
            <a-button @click="showAdvancedFilter = !showAdvancedFilter">
              <template #icon><FilterOutlined /></template> Filters
            </a-button>
          </div>
          <div class="flex items-center space-x-4">
            <a-button-group>
              <a-button :type="viewMode === 'grid' ? 'primary' : 'default'" @click="viewMode = 'grid'">
                <template #icon><AppstoreOutlined /></template>
              </a-button>
              <a-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
                <template #icon><BarsOutlined /></template>
              </a-button>
            </a-button-group>
            <a-button type="primary" @click="showPostModal = true">
              <template #icon><PlusOutlined /></template> Post Item
            </a-button>
          </div>
        </div>

        <div v-show="showAdvancedFilter" class="bg-[#EDEEE8] p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div class="text-sm mb-2">Price Range: ${{priceRange[0]}} - ${{priceRange[1]}}</div>
              <a-slider v-model:value="priceRange" range :min="0" :max="2000" :step="10" />
            </div>
            <div>
              <div class="text-sm mb-2">Condition</div>
              <a-select v-model:value="condition" style="width: 100%" :options="conditionOptions" />
            </div>
            <div>
              <div class="text-sm mb-2">Sort By</div>
              <a-select v-model:value="sortBy" style="width: 100%" :options="sortOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
        <a-tag 
          v-for="category in categories" 
          :key="category"
          :color="selectedCategory === category ? '#C24D45' : 'default'"
          class="cursor-pointer px-4 py-2 !rounded-full"
          @click="selectedCategory = category"
        >
          {{ category }}
        </a-tag>
      </div>
    </div>
  </div>

  <!-- Items Grid/List -->
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4">
      <div :class="viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'space-y-4'">
        <div v-for="item in filteredItems" :key="item.id" 
          :class="viewMode === 'grid' ? 'bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300' : 'bg-white rounded-lg shadow-sm p-4 flex space-x-4'">
          <div :class="viewMode === 'grid' ? '' : 'w-48 h-48 flex-shrink-0'">
            <img :src="item.image" :alt="item.title" :class="viewMode === 'grid' ? 'w-full h-48 object-cover' : 'w-full h-full object-cover rounded-lg'" />
          </div>
          <div :class="viewMode === 'grid' ? 'p-4' : 'flex-grow flex flex-col justify-between'">
            <div>
              <div class="flex items-start justify-between">
                <h3 class="font-medium text-lg flex-grow pr-2">{{ item.title }}</h3>
                <HeartOutlined :class="item.favorited ? 'text-[#C24D45]' : 'text-gray-400'" class="text-xl cursor-pointer flex-shrink-0" @click="toggleFavorite(item)" />
              </div>
              <p v-if="viewMode === 'list'" class="text-sm text-gray-500 mt-1">{{ item.description }}</p>
            </div>
            <div class="mt-4">
              <div class="flex items-center justify-between">
                <span class="text-xl font-bold text-[#C24D45]">${{ item.price }}</span>
                <div class="flex items-center space-x-1">
                  <StarFilled class="text-[#F9D367]" />
                  <span class="text-sm text-gray-500">{{ item.rating }}</span>
                </div>
              </div>
              <div class="mt-4 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <img :src="item.sellerAvatar" class="w-8 h-8 rounded-full object-cover" />
                  <span class="text-sm text-gray-500">{{ item.sellerName }}</span>
                </div>
                <a-button type="primary" @click="openChat(item)">
                  <template #icon><MessageOutlined /></template> Message
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Post Item Modal -->
  <a-modal v-model:visible="showPostModal" title="Post New Item" @ok="handlePostItem" okText="Post" cancelText="Cancel" width="600px">
    <div class="space-y-4 pt-4">
      <a-input v-model:value="newItem.title" placeholder="Item Title" />
      <a-textarea v-model:value="newItem.description" placeholder="Description" :rows="4" />
      <a-input-number v-model:value="newItem.price" placeholder="Price" style="width: 100%" prefix="$" :min="0"/>
      <a-select v-model:value="newItem.category" style="width: 100%" placeholder="Select Category" :options="categoryOptions" />
      <a-select v-model:value="newItem.condition" style="width: 100%" placeholder="Select Condition" :options="conditionOptions.slice(1)" />
    </div>
  </a-modal>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  SearchOutlined, FilterOutlined, AppstoreOutlined, BarsOutlined, HeartOutlined, StarFilled, MessageOutlined, PlusOutlined 
} from '@ant-design/icons-vue';
import {
  Select as ASelect, Slider as ASlider, Tag as ATag, Input as AInput, Button as AButton, ButtonGroup as AButtonGroup, Modal as AModal, InputNumber as AInputNumber, Textarea as ATextarea
} from 'ant-design-vue';

const AInputSearch = AInput.Search;

// State management
const viewMode = ref('grid')
const searchQuery = ref('')
const selectedCategory = ref('All')
const showAdvancedFilter = ref(false)
const priceRange = ref([0, 2000])
const condition = ref('all')
const sortBy = ref('latest')
const showPostModal = ref(false)

// Categories
const categories = ['All', 'Electronics', 'Books', 'Furniture', 'Fashion', 'Sports', 'Art', 'Others']
const categoryOptions = categories.slice(1).map(c => ({value: c, label: c}));

// New item form
const newItem = ref({
  title: '',
  description: '',
  price: null,
  category: null,
  condition: null
})

// Sample items data
const items = ref([
  {
    id: 1,
    title: 'MacBook Pro M3 2024',
    description: 'Latest model, only used for 2 months. Perfect condition with original packaging.',
    price: 1599,
    rating: 4.8,
    category: 'Electronics',
    condition: 'like-new',
    favorited: false,
    sellerName: 'Michael Chen',
    sellerAvatar: 'https://public.readdy.ai/ai/img_res/539e6fa3fa12610ae42a7bcac135190f.jpg',
    image: 'https://public.readdy.ai/ai/img_res/550990d6396fe731a589085be79fcdd0.jpg'
  },
  {
    id: 2,
    title: 'Calculus Textbook Bundle',
    description: 'Complete set of calculus textbooks for Math 101-103.',
    price: 125,
    rating: 4.9,
    category: 'Books',
    condition: 'used',
    favorited: true,
    sellerName: 'Sarah Johnson',
    sellerAvatar: 'https://public.readdy.ai/ai/img_res/de2255ba37565d676e2c732b5dc5961c.jpg',
    image: 'https://public.readdy.ai/ai/img_res/55dfd7c25a4de7828a074200e5bf6faf.jpg'
  }
])

// Computed properties
const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value;
    const matchesPrice = item.price >= priceRange.value[0] && item.price <= priceRange.value[1];
    const matchesCondition = condition.value === 'all' || item.condition === condition.value;
    return matchesSearch && matchesCategory && matchesPrice && matchesCondition;
  });
})

// Methods
const handleSearch = () => {
  console.log('Searching for:', searchQuery.value)
}

const toggleFavorite = (item) => {
  item.favorited = !item.favorited
}

const openChat = (item) => {
  alert(`Opening chat with ${item.sellerName} about "${item.title}"`)
}

const handlePostItem = () => {
  if (!newItem.value.title || !newItem.value.price) {
    alert('Please fill in required fields')
    return
  }
  
  items.value.unshift({
    id: items.value.length + 1,
    ...newItem.value,
    rating: 5.0,
    favorited: false,
    sellerName: 'You',
    sellerAvatar: 'https://public.readdy.ai/ai/img_res/e488429cf1a5ca4e6366c8ee916e9030.jpg',
    image: 'https://public.readdy.ai/ai/img_res/550990d6396fe731a589085be79fcdd0.jpg'
  })

  newItem.value = { title: '', description: '', price: 0, category: '', condition: '' }
  showPostModal.value = false
  alert('Item posted successfully!')
}

const conditionOptions = [
  { value: 'all', label: 'All' }, { value: 'new', label: 'New' }, { value: 'like-new', label: 'Like New' }, { value: 'used', label: 'Used' }
];

const sortOptions = [
  { value: 'latest', label: 'Latest' }, { value: 'price-low', label: 'Price: Low to High' }, { value: 'price-high', label: 'Price: High to Low' }, { value: 'popular', label: 'Most Popular' }
];
</script>

<style scoped>
:deep(.ant-btn-primary) {
  background-color: #C24D45;
  border-color: #C24D45;
}
:deep(.ant-btn-primary:hover) {
  background-color: #A93E37;
  border-color: #A93E37;
}
:deep(.ant-slider-track) {
  background-color: #C24D45;
}
:deep(.ant-slider-handle) {
  border-color: #C24D45;
}
:deep(.ant-select-selector:hover) {
  border-color: #C24D45 !important;
}
:deep(.ant-select-focused .ant-select-selector) {
  border-color: #C24D45 !important;
  box-shadow: 0 0 0 2px rgba(194, 77, 69, 0.2) !important;
}
</style>
