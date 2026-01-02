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
              <a-slider v-model:value="priceRange" range :min="0" :max="2000" :step="10" @change="applyFilters" />
            </div>
            <div>
              <div class="text-sm mb-2">Condition</div>
              <a-select v-model:value="condition" style="width: 100%" :options="conditionOptions" @change="applyFilters" />
            </div>
            <div>
              <div class="text-sm mb-2">Sort By</div>
              <a-select v-model:value="sortBy" style="width: 100%" :options="sortOptions" @change="applyFilters" />
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
          @click="handleCategoryChange(category)"
        >
          {{ category }}
        </a-tag>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="flex justify-center items-center py-20">
    <a-spin size="large" />
  </div>

  <!-- Items Grid/List -->
  <div v-else class="py-8">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Empty State -->
      <div v-if="items.length === 0" class="text-center py-20">
        <p class="text-gray-500 text-lg">No items found</p>
        <p class="text-gray-400 mt-2">Try adjusting your filters or post a new item</p>
      </div>

      <!-- Items Display -->
      <div v-else :class="viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'space-y-4'">
        <div v-for="item in items" :key="item.id"
          :class="viewMode === 'grid' ? 'bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer' : 'bg-white rounded-lg shadow-sm p-4 flex space-x-4 cursor-pointer'"
          @click="viewItemDetails(item)">
          <div :class="viewMode === 'grid' ? '' : 'w-48 h-48 flex-shrink-0'">
            <img
              :src="getItemImage(item)"
              :alt="item.title"
              :class="viewMode === 'grid' ? 'w-full h-48 object-cover' : 'w-full h-full object-cover rounded-lg'"
            />
          </div>
          <div :class="viewMode === 'grid' ? 'p-4' : 'flex-grow flex flex-col justify-between'">
            <div>
              <div class="flex items-start justify-between">
                <h3 class="font-medium text-lg flex-grow pr-2">{{ item.title }}</h3>
                <HeartFilled
                  v-if="item.is_favorited"
                  class="text-[#C24D45] text-xl cursor-pointer flex-shrink-0"
                  @click.stop="toggleFavorite(item)"
                />
                <HeartOutlined
                  v-else
                  class="text-gray-400 text-xl cursor-pointer flex-shrink-0"
                  @click.stop="toggleFavorite(item)"
                />
              </div>
              <p v-if="viewMode === 'list'" class="text-sm text-gray-500 mt-1">{{ truncateText(item.description, 100) }}</p>
            </div>
            <div class="mt-4">
              <div class="flex items-center justify-between">
                <span class="text-xl font-bold text-[#C24D45]">${{ item.price }}</span>
                <a-tag :color="getConditionColor(item.condition)">{{ formatCondition(item.condition) }}</a-tag>
              </div>
              <div class="mt-4 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <a-avatar v-if="item.seller" size="small">{{ getInitials(item.seller) }}</a-avatar>
                  <span class="text-sm text-gray-500">{{ getSellerName(item.seller) }}</span>
                </div>
                <div class="flex items-center space-x-2 text-gray-400 text-sm">
                  <EyeOutlined /> <span>{{ item.views_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Post Item Modal -->
  <a-modal
    v-model:open="showPostModal"
    title="Post New Item"
    @ok="handlePostItem"
    okText="Post"
    cancelText="Cancel"
    width="600px"
    :confirmLoading="posting"
  >
    <div class="space-y-4 pt-4">
      <a-input v-model:value="newItem.title" placeholder="Item Title *" />
      <a-textarea v-model:value="newItem.description" placeholder="Description *" :rows="4" />
      <a-input-number v-model:value="newItem.price" placeholder="Price *" style="width: 100%" prefix="$" :min="0" :precision="2" />
      <a-select v-model:value="newItem.category" style="width: 100%" placeholder="Select Category *" :options="categoryOptions" />
      <a-select v-model:value="newItem.condition" style="width: 100%" placeholder="Select Condition *" :options="conditionOptions.slice(1)" />
      <a-input v-model:value="newItem.location" placeholder="Location (optional)" />
      <div>
        <label class="text-sm text-gray-600">Tags (comma separated)</label>
        <a-input v-model:value="newItem.tagsInput" placeholder="e.g. laptop, electronics, like-new" />
      </div>
    </div>
  </a-modal>

  <!-- Item Details Modal -->
  <a-modal
    v-model:open="showDetailsModal"
    :title="selectedItem?.title"
    :footer="null"
    width="700px"
  >
    <div v-if="selectedItem" class="space-y-4">
      <img :src="getItemImage(selectedItem)" :alt="selectedItem.title" class="w-full h-64 object-cover rounded-lg" />
      <div class="flex items-center justify-between">
        <span class="text-2xl font-bold text-[#C24D45]">${{ selectedItem.price }}</span>
        <a-tag :color="getConditionColor(selectedItem.condition)">{{ formatCondition(selectedItem.condition) }}</a-tag>
      </div>
      <p class="text-gray-700">{{ selectedItem.description }}</p>
      <div class="flex items-center space-x-4 pt-4 border-t">
        <a-avatar>{{ getInitials(selectedItem.seller) }}</a-avatar>
        <div>
          <p class="font-medium">{{ getSellerName(selectedItem.seller) }}</p>
          <p class="text-sm text-gray-500">{{ selectedItem.seller?.university || 'Unknown University' }}</p>
        </div>
      </div>
      <div class="flex space-x-2 pt-4">
        <a-button type="primary" block>
          <template #icon><MessageOutlined /></template> Contact Seller
        </a-button>
        <a-button @click="toggleFavorite(selectedItem)">
          <template #icon>
            <HeartFilled v-if="selectedItem.is_favorited" class="text-[#C24D45]" />
            <HeartOutlined v-else />
          </template>
        </a-button>
      </div>
    </div>
  </a-modal>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined, FilterOutlined, AppstoreOutlined, BarsOutlined,
  HeartOutlined, HeartFilled, MessageOutlined, PlusOutlined, EyeOutlined
} from '@ant-design/icons-vue';
import { marketplaceAPI } from '@/utils/api'

// State management
const loading = ref(false)
const posting = ref(false)
const viewMode = ref('grid')
const searchQuery = ref('')
const selectedCategory = ref('All')
const showAdvancedFilter = ref(false)
const priceRange = ref([0, 2000])
const condition = ref('all')
const sortBy = ref('created_at')
const showPostModal = ref(false)
const showDetailsModal = ref(false)
const selectedItem = ref(null)

// Items data
const items = ref([])

// Categories
const categories = ['All', 'Electronics', 'Books', 'Furniture', 'Fashion', 'Sports', 'Art', 'Others']
const categoryOptions = categories.slice(1).map(c => ({value: c, label: c}));

// New item form
const newItem = ref({
  title: '',
  description: '',
  price: null,
  category: null,
  condition: null,
  location: '',
  tagsInput: ''
})

// Condition options
const conditionOptions = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
];

// Sort options
const sortOptions = [
  { value: 'created_at', label: 'Latest', order: 'desc' },
  { value: 'price', label: 'Price: Low to High', order: 'asc' },
  { value: 'price', label: 'Price: High to Low', order: 'desc' },
  { value: 'views_count', label: 'Most Viewed', order: 'desc' },
  { value: 'favorites_count', label: 'Most Popular', order: 'desc' }
];

// Methods
const fetchItems = async () => {
  loading.value = true
  try {
    const params = {
      category: selectedCategory.value !== 'All' ? selectedCategory.value : undefined,
      condition: condition.value !== 'all' ? condition.value : undefined,
      minPrice: priceRange.value[0],
      maxPrice: priceRange.value[1],
      sortBy: sortBy.value,
      order: sortOptions.find(opt => opt.value === sortBy.value)?.order || 'desc'
    }

    const response = await marketplaceAPI.getItems(params)
    items.value = response.data.data.items || []
  } catch (error) {
    console.error('Failed to fetch items:', error)
    message.error('Failed to load marketplace items')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  if (!searchQuery.value || searchQuery.value.trim().length < 2) {
    fetchItems()
    return
  }

  loading.value = true
  try {
    const params = {
      q: searchQuery.value,
      category: selectedCategory.value !== 'All' ? selectedCategory.value : undefined
    }
    const response = await marketplaceAPI.searchItems(params)
    items.value = response.data.data.items || []
  } catch (error) {
    console.error('Search failed:', error)
    message.error('Search failed')
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = (category) => {
  selectedCategory.value = category
  fetchItems()
}

const applyFilters = () => {
  fetchItems()
}

const toggleFavorite = async (item) => {
  try {
    if (item.is_favorited) {
      await marketplaceAPI.unfavoriteItem(item.id)
      item.is_favorited = false
      item.favorites_count = Math.max(0, (item.favorites_count || 0) - 1)
      message.success('Removed from favorites')
    } else {
      await marketplaceAPI.favoriteItem(item.id)
      item.is_favorited = true
      item.favorites_count = (item.favorites_count || 0) + 1
      message.success('Added to favorites')
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
    message.error(error.response?.data?.error?.message || 'Failed to update favorite')
  }
}

const handlePostItem = async () => {
  if (!newItem.value.title || !newItem.value.description || !newItem.value.price ||
      !newItem.value.category || !newItem.value.condition) {
    message.error('Please fill in all required fields')
    return
  }

  posting.value = true
  try {
    const tags = newItem.value.tagsInput
      ? newItem.value.tagsInput.split(',').map(t => t.trim()).filter(t => t)
      : []

    const itemData = {
      title: newItem.value.title,
      description: newItem.value.description,
      price: newItem.value.price,
      category: newItem.value.category,
      condition: newItem.value.condition,
      location: newItem.value.location || '',
      tags,
      images: []
    }

    await marketplaceAPI.createItem(itemData)
    message.success('Item posted successfully!')

    // Reset form
    newItem.value = { title: '', description: '', price: null, category: null, condition: null, location: '', tagsInput: '' }
    showPostModal.value = false

    // Refresh items
    fetchItems()
  } catch (error) {
    console.error('Failed to post item:', error)
    message.error(error.response?.data?.error?.message || 'Failed to post item')
  } finally {
    posting.value = false
  }
}

const viewItemDetails = (item) => {
  selectedItem.value = item
  showDetailsModal.value = true
}

// Helper functions
const getItemImage = (item) => {
  if (item.images && item.images.length > 0) {
    return item.images[0]
  }
  return 'https://via.placeholder.com/400x300?text=No+Image'
}

const getSellerName = (seller) => {
  if (!seller) return 'Unknown'
  return `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || 'Unknown'
}

const getInitials = (seller) => {
  if (!seller) return '?'
  const first = seller.first_name?.[0] || ''
  const last = seller.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

const formatCondition = (cond) => {
  if (!cond) return 'Unknown'
  return cond.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const getConditionColor = (cond) => {
  const colors = {
    'new': 'green',
    'like_new': 'blue',
    'good': 'cyan',
    'fair': 'orange',
    'poor': 'red'
  }
  return colors[cond] || 'default'
}

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Lifecycle
onMounted(() => {
  fetchItems()
})
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
