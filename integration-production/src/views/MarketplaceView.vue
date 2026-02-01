<template>
<div class="min-h-screen bg-[#EDEEE8] pt-16">

  <!-- Search and Filter Section -->
  <div class="sticky top-16 z-40 bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
      <div class="flex flex-col space-y-3 md:space-y-4">
        <div class="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
          <div class="flex-grow flex items-center space-x-2 md:space-x-4">
            <a-input-search
              v-model:value="searchQuery"
              placeholder="Search items..."
              class="flex-1 md:max-w-xl"
              @search="handleSearch"
            />
            <a-button @click="showAdvancedFilter = !showAdvancedFilter" class="flex-shrink-0">
              <template #icon><FilterOutlined /></template>
              <span class="hidden sm:inline ml-1">Filters</span>
            </a-button>
          </div>
          <div class="flex items-center justify-between md:justify-end space-x-2 md:space-x-4">
            <a-button-group class="hidden sm:flex">
              <a-button :type="viewMode === 'grid' ? 'primary' : 'default'" @click="viewMode = 'grid'">
                <template #icon><AppstoreOutlined /></template>
              </a-button>
              <a-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
                <template #icon><BarsOutlined /></template>
              </a-button>
            </a-button-group>
            <a-button type="primary" @click="showPostModal = true" class="flex-shrink-0">
              <template #icon><PlusOutlined /></template>
              <span class="hidden sm:inline ml-1">Post Item</span>
            </a-button>
          </div>
        </div>

        <div v-show="showAdvancedFilter" class="bg-[#EDEEE8] p-3 md:p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <div class="text-xs md:text-sm mb-2">Price Range: ${{priceRange[0]}} - ${{priceRange[1]}}</div>
              <a-slider v-model:value="priceRange" range :min="0" :max="2000" :step="10" @change="applyFilters" />
            </div>
            <div>
              <div class="text-xs md:text-sm mb-2">Condition</div>
              <a-select v-model:value="condition" style="width: 100%" :options="conditionOptions" @change="applyFilters" />
            </div>
            <div>
              <div class="text-xs md:text-sm mb-2">Sort By</div>
              <a-select v-model:value="sortBy" style="width: 100%" :options="sortOptions" @change="applyFilters" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-3 md:px-4">
      <div class="flex space-x-2 overflow-x-auto pb-2 -mx-3 md:-mx-4 px-3 md:px-4 scrollbar-hide">
        <a-tag
          v-for="category in categories"
          :key="category"
          :color="selectedCategory === category ? '#C24D45' : 'default'"
          class="cursor-pointer px-3 md:px-4 py-1.5 md:py-2 !rounded-full whitespace-nowrap text-xs md:text-sm"
          @click="handleCategoryChange(category)"
        >
          {{ category }}
        </a-tag>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="flex justify-center items-center py-16 md:py-20">
    <a-spin size="large" />
  </div>

  <!-- Items Grid/List -->
  <div v-else class="py-4 md:py-8">
    <div class="max-w-7xl mx-auto px-3 md:px-4">
      <!-- Empty State -->
      <div v-if="items.length === 0" class="text-center py-16 md:py-20">
        <p class="text-gray-500 text-base md:text-lg">No items found</p>
        <p class="text-gray-400 mt-2 text-sm md:text-base">Try adjusting your filters or post a new item</p>
      </div>

      <!-- Items Display -->
      <div v-else :class="viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6' : 'space-y-3 md:space-y-4'">
        <div v-for="item in items" :key="item.id"
          :class="viewMode === 'grid' ? 'bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer' : 'bg-white rounded-lg shadow-sm p-3 md:p-4 flex space-x-3 md:space-x-4 cursor-pointer'"
          @click="viewItemDetails(item)">
          <div :class="viewMode === 'grid' ? '' : 'w-24 h-24 md:w-48 md:h-48 flex-shrink-0'">
            <img
              :src="getItemImage(item)"
              :alt="item.title"
              :class="viewMode === 'grid' ? 'w-full h-32 md:h-48 object-cover' : 'w-full h-full object-cover rounded-lg'"
            />
          </div>
          <div :class="viewMode === 'grid' ? 'p-2 md:p-4' : 'flex-grow flex flex-col justify-between min-w-0'">
            <div>
              <div class="flex items-start justify-between">
                <h3 class="font-medium text-sm md:text-lg flex-grow pr-1 md:pr-2 line-clamp-2 md:truncate">{{ item.title }}</h3>
                <HeartFilled
                  v-if="item.is_favorited"
                  class="text-[#C24D45] text-base md:text-xl cursor-pointer flex-shrink-0"
                  @click.stop="toggleFavorite(item)"
                />
                <HeartOutlined
                  v-else
                  class="text-gray-400 text-base md:text-xl cursor-pointer flex-shrink-0"
                  @click.stop="toggleFavorite(item)"
                />
              </div>
              <p v-if="viewMode === 'list'" class="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">{{ truncateText(item.description, 100) }}</p>
            </div>
            <div class="mt-2 md:mt-4">
              <div class="flex items-center justify-between">
                <span class="text-base md:text-xl font-bold text-[#C24D45]">${{ item.price }}</span>
                <a-tag :color="getConditionColor(item.condition)" class="text-xs md:text-sm !m-0">{{ formatCondition(item.condition) }}</a-tag>
              </div>
              <div class="mt-2 md:mt-4 flex items-center justify-between">
                <div class="hidden md:flex items-center space-x-2">
                  <ClickableAvatar v-if="item.seller" :user="item.seller" size="small" @message="handleUserMessage" />
                  <span class="text-sm text-gray-500">{{ getSellerName(item.seller) }}</span>
                </div>
                <div class="flex items-center space-x-1 md:space-x-2 text-gray-400 text-xs md:text-sm">
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

      <!-- Image Upload Section -->
      <div>
        <label class="text-sm text-gray-600 mb-2 block">Images (optional)</label>
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            @change="handleFileUpload"
            class="hidden"
          />
          <div class="text-center">
            <a-button @click="triggerFileUpload" :loading="uploadingImages">
              <template #icon><PlusOutlined /></template>
              {{ uploadingImages ? 'Uploading...' : 'Add Images' }}
            </a-button>
            <p class="text-xs text-gray-500 mt-2">
              Upload up to 5 images (JPG, PNG, WebP, max 5MB each)
            </p>
          </div>

          <!-- Image Preview -->
          <div v-if="newItem.images.length > 0" class="grid grid-cols-3 gap-2 mt-4">
            <div
              v-for="(image, index) in newItem.images"
              :key="index"
              class="relative group"
            >
              <img
                :src="image.url"
                :alt="`Preview ${index + 1}`"
                class="w-full h-20 object-cover rounded border"
              />
              <button
                @click="removeImage(index)"
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

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
        <ClickableAvatar :user="selectedItem.seller" @message="handleUserMessage" />
        <div>
          <p class="font-medium">{{ getSellerName(selectedItem.seller) }}</p>
          <p class="text-sm text-gray-500">{{ selectedItem.seller?.university || 'Unknown University' }}</p>
        </div>
      </div>
      <div class="flex items-center justify-between pt-4">
        <a-button @click="toggleFavorite(selectedItem)">
          <template #icon>
            <HeartFilled v-if="selectedItem.is_favorited" class="text-[#C24D45]" />
            <HeartOutlined v-else />
          </template>
          {{ selectedItem.is_favorited ? 'Saved' : 'Save' }}
        </a-button>
        <a-button
          v-if="currentUser && (selectedItem.seller_id === currentUser.id || selectedItem.seller?.id === currentUser.id)"
          danger
          @click="confirmDeleteItem(selectedItem)"
        >
          <template #icon><DeleteOutlined /></template>
          Delete
        </a-button>
      </div>

      <!-- Comment Section -->
      <div class="mt-6 pt-6 border-t">
        <CommentSection :itemId="selectedItem.id" :current-user="currentUser" />
      </div>
    </div>
  </a-modal>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  SearchOutlined, FilterOutlined, AppstoreOutlined, BarsOutlined,
  HeartOutlined, HeartFilled, PlusOutlined, EyeOutlined, DeleteOutlined
} from '@ant-design/icons-vue';
import { marketplaceAPI } from '@/utils/api'
import CommentSection from '@/components/marketplace/CommentSection.vue'
import ClickableAvatar from '@/components/common/ClickableAvatar.vue'

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
const uploadingImages = ref(false)
const fileInput = ref(null)

// Current user (get from localStorage)
const currentUser = ref(null)
try {
  const userStr = localStorage.getItem('userData')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
  }
} catch (e) {
  console.error('Failed to parse user from localStorage:', e)
}

// Items data
const items = ref([
  {
    id: 'demo-1',
    title: 'MacBook Air M1 - Excellent Condition',
    description: 'Barely used MacBook Air with M1 chip, 8GB RAM, 256GB SSD. Perfect for students! Comes with original charger and box.',
    price: 899,
    category: 'Electronics',
    condition: 'Like New',
    image: 'https://via.placeholder.com/300x200/f0f0f0/666?text=MacBook+Air',
    views_count: 45,
    seller: {
      id: 'seller-1',
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice.johnson@university.edu',
      avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
      university: 'Your University',
      is_online: true,
      avg_rating: 4.8,
      total_sales: 12,
      points: 320
    },
    created_at: '2024-01-20T10:30:00Z'
  },
  {
    id: 'demo-2',
    title: 'Calculus Textbook Bundle',
    description: 'Complete set of calculus textbooks with solution manuals. All in great condition with minimal highlighting.',
    price: 120,
    category: 'Books',
    condition: 'Good',
    image: 'https://via.placeholder.com/300x200/e8f4f8/666?text=Textbooks',
    views_count: 23,
    seller: {
      id: 'seller-2',
      first_name: 'Bob',
      last_name: 'Smith',
      email: 'bob.smith@university.edu',
      avatar_url: 'https://avatars.githubusercontent.com/u/3?v=4',
      university: 'Your University',
      is_online: false,
      avg_rating: 4.6,
      total_sales: 8,
      points: 180
    },
    created_at: '2024-01-19T15:20:00Z'
  },
  {
    id: 'demo-3',
    title: 'Desk Lamp & Study Accessories',
    description: 'Adjustable LED desk lamp with USB charging port, plus desk organizer and notebook stand. Great for dorm rooms!',
    price: 45,
    category: 'Furniture',
    condition: 'Excellent',
    image: 'https://via.placeholder.com/300x200/f8f0e8/666?text=Desk+Lamp',
    views_count: 67,
    seller: {
      id: 'seller-3',
      first_name: 'Carol',
      last_name: 'Williams',
      email: 'carol.williams@university.edu',
      avatar_url: 'https://avatars.githubusercontent.com/u/4?v=4',
      university: 'Your University',
      is_online: true,
      avg_rating: 5.0,
      total_sales: 25,
      points: 450
    },
    created_at: '2024-01-18T09:15:00Z'
  },
  {
    id: 'demo-4',
    title: 'Winter Jacket - North Face',
    description: 'Warm and waterproof winter jacket, size M. Barely worn, perfect for Ithaca winters. Paid $200, selling for half price.',
    price: 100,
    category: 'Fashion',
    condition: 'Like New',
    image: 'https://via.placeholder.com/300x200/e8f8e8/666?text=Winter+Jacket',
    views_count: 34,
    seller: {
      id: 'seller-4',
      first_name: 'David',
      last_name: 'Brown',
      email: 'david.brown@university.edu',
      avatar_url: 'https://avatars.githubusercontent.com/u/5?v=4',
      university: 'Your University',
      is_online: true,
      avg_rating: 4.7,
      total_sales: 15,
      points: 280
    },
    created_at: '2024-01-17T14:45:00Z'
  }
])

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
  tagsInput: '',
  images: []
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
      images: newItem.value.images.map(img => img.url)
    }

    await marketplaceAPI.createItem(itemData)
    message.success('Item posted successfully!')

    // Reset form
    newItem.value = { title: '', description: '', price: null, category: null, condition: null, location: '', tagsInput: '', images: [] }
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

// Delete item
const confirmDeleteItem = (item) => {
  Modal.confirm({
    title: 'Delete Item',
    content: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: async () => {
      try {
        await marketplaceAPI.deleteItem(item.id)
        message.success('Item deleted successfully')
        showDetailsModal.value = false
        await fetchItems()
      } catch (error) {
        console.error('Delete item error:', error)
        message.error(error.response?.data?.error?.message || 'Failed to delete item')
      }
    }
  })
}

// Scroll to comments section
const scrollToComments = () => {
  // Find the comment section within the modal
  const modal = document.querySelector('.ant-modal-content')
  if (modal) {
    const commentSection = modal.querySelector('.comment-section')
    if (commentSection) {
      // Scroll the modal content to show the comment section
      const textarea = commentSection.querySelector('textarea')
      if (textarea) {
        // Focus on the textarea
        setTimeout(() => {
          textarea.focus()
          // Scroll into view
          commentSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
  }
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

// Handle user message from ClickableAvatar
const handleUserMessage = (user) => {
  // This will be handled by the ClickableAvatar component internally
  // It navigates to /messages with userId query parameter
}

// Image upload methods
const triggerFileUpload = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  // Validate total images limit
  if (newItem.value.images.length + files.length > 5) {
    message.error('Maximum 5 images allowed')
    return
  }

  uploadingImages.value = true

  try {
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        message.error(`${file.name} is not an image file`)
        continue
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error(`${file.name} is too large. Maximum size is 5MB`)
        continue
      }

      // Convert to base64
      const base64 = await fileToBase64(file)

      // Upload to backend
      const response = await marketplaceAPI.uploadImage({
        image: base64,
        filename: file.name,
        itemType: 'marketplace'
      })

      if (response.data.success) {
        newItem.value.images.push({
          filename: response.data.data.filename,
          url: response.data.data.url
        })
        message.success(`${file.name} uploaded successfully`)
      }
    }
  } catch (error) {
    console.error('Failed to upload images:', error)
    message.error(error.response?.data?.error?.message || 'Failed to upload images')
  } finally {
    uploadingImages.value = false
    // Clear the input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const removeImage = async (index) => {
  try {
    const image = newItem.value.images[index]

    // Remove from backend storage
    await marketplaceAPI.deleteImage(image.filename)

    // Remove from local array
    newItem.value.images.splice(index, 1)
    message.success('Image removed successfully')
  } catch (error) {
    console.error('Failed to remove image:', error)
    message.error('Failed to remove image')
  }
}

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
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
