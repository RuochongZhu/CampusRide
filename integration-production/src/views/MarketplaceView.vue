<template>
<div class="min-h-screen bg-[#EDEEE8] pt-16">

  <!-- Search and Filter Section -->
  <div class="sticky top-16 z-40 bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-3 md:px-4 py-2 md:py-4">
      <!-- Mobile: single compact row; Desktop: original layout -->
      <div class="flex items-center gap-2 md:flex-col md:space-y-4">
        <div class="flex-grow flex items-center gap-2 md:gap-4 md:flex-row min-w-0">
          <a-input-search
            v-model:value="searchQuery"
            placeholder="Search items..."
            class="flex-1 md:max-w-xl marketplace-search-input"
            @search="handleSearch"
          />
          <!-- Mobile: open filter drawer; Desktop: toggle inline panel -->
          <a-button @click="isMobile ? (showFilterDrawer = true) : (showAdvancedFilter = !showAdvancedFilter)" class="flex-shrink-0 marketplace-icon-btn">
            <template #icon><FilterOutlined /></template>
            <span class="hidden sm:inline ml-1">Filters</span>
          </a-button>
        </div>
        <div class="flex items-center gap-2 md:gap-4 md:justify-end flex-shrink-0">
          <a-button-group class="hidden sm:flex">
            <a-button :type="viewMode === 'grid' ? 'primary' : 'default'" @click="viewMode = 'grid'">
              <template #icon><AppstoreOutlined /></template>
            </a-button>
            <a-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
              <template #icon><BarsOutlined /></template>
            </a-button>
          </a-button-group>
          <a-button type="primary" @click="showPostModal = true" class="flex-shrink-0 marketplace-post-btn">
            <template #icon><PlusOutlined /></template>
            <span class="hidden sm:inline ml-1">Post Item</span>
          </a-button>
        </div>
      </div>

      <!-- Desktop-only: Advanced Filter Panel (inline) -->
      <div v-if="!isMobile" v-show="showAdvancedFilter" class="bg-[#EDEEE8] p-3 md:p-4 rounded-lg mt-2 md:mt-0">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <div class="text-xs md:text-sm mb-2 text-gray-600">Price Range: ${{priceRange[0]}} - ${{priceRange[1]}}</div>
            <a-slider v-model:value="priceRange" range :min="0" :max="2000" :step="10" @change="applyFilters" />
          </div>
          <div>
            <div class="text-xs md:text-sm mb-2 text-gray-600">Condition</div>
            <a-select v-model:value="condition" style="width: 100%" :options="conditionOptions" @change="applyFilters" />
          </div>
          <div>
            <div class="text-xs md:text-sm mb-2 text-gray-600">Sort By</div>
            <a-select v-model:value="sortBy" style="width: 100%" :options="sortOptions" @change="applyFilters" />
          </div>
        </div>
      </div>
    </div>

    <!-- Category Tags Scroller -->
    <div class="max-w-7xl mx-auto px-3 md:px-4">
      <div class="marketplace-category-scroller">
        <a-tag
          v-for="category in categories"
          :key="category"
          :color="selectedCategory === category ? '#C24D45' : 'default'"
          class="cursor-pointer px-3 md:px-4 py-1.5 md:py-2 !rounded-full whitespace-nowrap text-xs md:text-sm flex-shrink-0"
          @click="handleCategoryChange(category)"
        >
          {{ category }}
        </a-tag>
      </div>
    </div>
  </div>

  <!-- Mobile Filter Drawer -->
  <a-drawer
    v-model:open="showFilterDrawer"
    title="Filters"
    placement="bottom"
    :height="'auto'"
    :headerStyle="{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '14px 16px' }"
    :bodyStyle="{ padding: '16px', background: '#EDEEE8' }"
    class="marketplace-filter-drawer"
  >
    <div class="space-y-5">
      <div>
        <div class="text-xs font-medium text-gray-500 mb-2">Price Range: ${{priceRange[0]}} - ${{priceRange[1]}}</div>
        <a-slider v-model:value="priceRange" range :min="0" :max="2000" :step="10" />
      </div>
      <div>
        <div class="text-xs font-medium text-gray-500 mb-2">Condition</div>
        <a-select v-model:value="condition" style="width: 100%" :options="conditionOptions" />
      </div>
      <div>
        <div class="text-xs font-medium text-gray-500 mb-2">Sort By</div>
        <a-select v-model:value="sortBy" style="width: 100%" :options="sortOptions" />
      </div>
      <div class="flex gap-3 pt-2">
        <a-button class="flex-1" @click="resetFilters">Reset</a-button>
        <a-button type="primary" class="flex-1" @click="applyFiltersAndCloseDrawer">Apply</a-button>
      </div>
    </div>
  </a-drawer>

  <!-- Route Item Status (e.g., deleted listing opened from WeChat link) -->
  <div v-if="routeItemAlert" class="max-w-7xl mx-auto px-3 md:px-4 pt-4">
    <a-alert
      :type="routeItemAlert.type"
      show-icon
      closable
      :message="routeItemAlert.message"
      :description="routeItemAlert.description"
      @close="routeItemAlert = null"
    />
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="flex justify-center items-center py-16 md:py-20">
    <a-spin size="large" />
  </div>

  <!-- Items Grid/List -->
  <div v-else class="py-3 md:py-8">
    <div class="max-w-7xl mx-auto px-3 md:px-4">
      <!-- Empty State -->
      <div v-if="items.length === 0" class="text-center py-16 md:py-20">
        <p class="text-gray-500 text-base md:text-lg">No items found</p>
        <p class="text-gray-400 mt-2 text-sm md:text-base">Try adjusting your filters or post a new item</p>
      </div>

      <!-- Items Display -->
      <div v-else :class="viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-6' : 'space-y-2.5 md:space-y-4'">
        <div v-for="item in items" :key="item.id"
          :class="viewMode === 'grid'
            ? 'marketplace-card-grid bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98]'
            : 'marketplace-card-list bg-white rounded-xl shadow-sm p-3 md:p-4 flex gap-3 md:gap-4 cursor-pointer active:scale-[0.99]'"
          @click="viewItemDetails(item)">
          <!-- Image -->
          <div :class="viewMode === 'grid' ? '' : 'w-24 h-24 md:w-48 md:h-48 flex-shrink-0'">
            <img
              :src="getItemImage(item)"
              :alt="item.title"
              :class="viewMode === 'grid' ? 'w-full h-36 md:h-48 object-contain bg-gray-50' : 'w-full h-full object-contain bg-gray-50 rounded-lg'"
              class="cursor-zoom-in"
              @click.stop="openImagePreview(item, 0)"
            />
          </div>
          <!-- Info -->
          <div :class="viewMode === 'grid' ? 'p-2.5 md:p-4' : 'flex-grow flex flex-col justify-between min-w-0'">
            <div>
              <div class="flex items-start justify-between gap-1">
                <h3 class="font-medium text-[13px] leading-tight md:text-lg flex-grow line-clamp-2 md:truncate">{{ item.title }}</h3>
                <HeartFilled
                  v-if="item.is_favorited"
                  class="text-[#C24D45] text-base md:text-xl cursor-pointer flex-shrink-0 p-0.5"
                  @click.stop="toggleFavorite(item)"
                />
                <HeartOutlined
                  v-else
                  class="text-gray-300 text-base md:text-xl cursor-pointer flex-shrink-0 p-0.5 hover:text-gray-400"
                  @click.stop="toggleFavorite(item)"
                />
              </div>
              <p v-if="viewMode === 'list'" class="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">{{ truncateText(item.description, 100) }}</p>
            </div>
            <div class="mt-1.5 md:mt-4">
              <div class="flex items-center justify-between">
                <span class="text-[15px] md:text-xl font-bold text-[#C24D45]">${{ item.price }}</span>
                <a-tag :color="getConditionColor(item.condition)" class="!text-[10px] md:!text-sm !m-0 !px-1.5 md:!px-2">{{ formatCondition(item.condition) }}</a-tag>
              </div>
              <div class="mt-1.5 md:mt-4 flex items-center justify-between">
                <div class="flex items-center gap-1.5 min-w-0">
                  <div v-if="item.seller" @click.stop>
                    <ClickableAvatar :user="item.seller" size="small" @message="handleUserMessage" />
                  </div>
                  <span class="text-[11px] md:text-sm text-gray-400 truncate">{{ getSellerName(item.seller) }}</span>
                </div>
                <div class="flex items-center gap-1 text-gray-300 text-[11px] md:text-sm">
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
    :width="isMobile ? '100%' : '600px'"
    :class="{ 'marketplace-mobile-modal': isMobile }"
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
                class="w-full h-20 object-contain bg-gray-100 rounded border"
              />
              <button
                type="button"
                @click.prevent="removeImage(index)"
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
    :width="isMobile ? '100%' : '700px'"
    :class="{ 'marketplace-mobile-modal': isMobile, 'marketplace-details-modal': true }"
  >
    <div v-if="selectedItem" class="marketplace-detail-content">
      <!-- Scrollable content area -->
      <div :class="isMobile ? 'marketplace-detail-scroll' : ''" class="space-y-3 md:space-y-4">
        <!-- Images: horizontal swipe/scroll for multiple photos -->
        <div v-if="selectedItemImages.length > 0" class="marketplace-image-scroller">
          <div class="marketplace-image-track">
            <div
              v-for="(img, index) in selectedItemImages"
              :key="`${selectedItem.id}_${index}`"
              class="marketplace-image-slide"
            >
              <img
                :src="img"
                :alt="`${selectedItem.title} ${index + 1}`"
                class="w-full h-48 md:h-64 object-contain bg-gray-50 rounded-lg cursor-zoom-in"
                @click.stop="openImagePreview(selectedItem, index)"
              />
            </div>
          </div>
          <div v-if="selectedItemImages.length > 1" class="text-[11px] md:text-xs text-gray-400 text-center mt-1.5">
            Swipe left/right to view more photos
          </div>
        </div>
        <div v-else class="w-full h-48 md:h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
          No images
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xl md:text-2xl font-bold text-[#C24D45]">${{ selectedItem.price }}</span>
          <a-tag :color="getConditionColor(selectedItem.condition)">{{ formatCondition(selectedItem.condition) }}</a-tag>
        </div>
        <p class="text-sm md:text-base text-gray-700 leading-relaxed">{{ selectedItem.description }}</p>
        <div class="flex items-center gap-3 pt-3 md:pt-4 border-t" @click.stop>
          <ClickableAvatar v-if="selectedItem.seller" :user="selectedItem.seller" @message="handleUserMessage" />
          <div>
            <p class="font-medium text-sm md:text-base">{{ getSellerName(selectedItem.seller) }}</p>
            <p class="text-xs md:text-sm text-gray-500">{{ selectedItem.seller?.university || 'Unknown University' }}</p>
          </div>
        </div>

        <!-- Desktop: inline action buttons -->
        <div v-if="!isMobile" class="flex items-center justify-between pt-3 md:pt-4 gap-2">
          <a-button @click="toggleFavorite(selectedItem)" class="flex-shrink-0">
            <template #icon>
              <HeartFilled v-if="selectedItem.is_favorited" class="text-[#C24D45]" />
              <HeartOutlined v-else />
            </template>
            {{ selectedItem.is_favorited ? 'Saved' : 'Save' }}
          </a-button>
          <div class="flex items-center gap-2">
            <a-button
              v-if="isSelectedItemOwner"
              @click="openEditModal(selectedItem)"
            >
              <template #icon><EditOutlined /></template>
              Edit
            </a-button>
            <a-button
              v-if="isSelectedItemOwner"
              danger
              @click="confirmDeleteItem(selectedItem)"
            >
              <template #icon><DeleteOutlined /></template>
              Delete
            </a-button>
          </div>
        </div>

        <!-- Comment Section -->
        <div class="mt-4 md:mt-6 pt-4 md:pt-6 border-t" :class="isMobile ? 'pb-20' : ''">
          <CommentSection :key="selectedItem.id" :itemId="selectedItem.id" :current-user="currentUser" />
        </div>
      </div>

      <!-- Mobile: fixed bottom action bar -->
      <div v-if="isMobile" class="marketplace-detail-actions">
        <a-button @click="toggleFavorite(selectedItem)" class="flex-1" size="large">
          <template #icon>
            <HeartFilled v-if="selectedItem.is_favorited" class="text-[#C24D45]" />
            <HeartOutlined v-else />
          </template>
          {{ selectedItem.is_favorited ? 'Saved' : 'Save' }}
        </a-button>
        <a-button
          v-if="isSelectedItemOwner"
          @click="openEditModal(selectedItem)"
          class="flex-1"
          size="large"
        >
          <template #icon><EditOutlined /></template>
          Edit
        </a-button>
        <a-button
          v-if="isSelectedItemOwner"
          danger
          @click="confirmDeleteItem(selectedItem)"
          class="flex-1"
          size="large"
        >
          <template #icon><DeleteOutlined /></template>
          Delete
        </a-button>
      </div>
    </div>
  </a-modal>

  <!-- Edit Item Modal -->
  <a-modal
    v-model:open="showEditModal"
    title="Edit Item"
    @ok="handleUpdateItem"
    okText="Save"
    cancelText="Cancel"
    :width="isMobile ? '100%' : '600px'"
    :class="{ 'marketplace-mobile-modal': isMobile }"
    :confirmLoading="editSubmitting"
    @cancel="closeEditModal"
  >
    <div class="space-y-4 pt-4">
      <a-input v-model:value="editItem.title" placeholder="Item Title *" />
      <a-textarea v-model:value="editItem.description" placeholder="Description *" :rows="4" />
      <a-input-number v-model:value="editItem.price" placeholder="Price *" style="width: 100%" prefix="$" :min="0" :precision="2" />
      <a-select v-model:value="editItem.category" style="width: 100%" placeholder="Select Category *" :options="categoryOptions" />
      <a-select v-model:value="editItem.condition" style="width: 100%" placeholder="Select Condition *" :options="conditionOptions.slice(1)" />
      <a-input v-model:value="editItem.location" placeholder="Location (optional)" />

      <!-- Image Upload Section -->
      <div>
        <label class="text-sm text-gray-600 mb-2 block">Images (optional)</label>
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            ref="editFileInput"
            type="file"
            accept="image/*"
            multiple
            @change="handleEditFileUpload"
            class="hidden"
          />
          <div class="text-center">
            <a-button @click="triggerEditFileUpload" :loading="editUploadingImages">
              <template #icon><PlusOutlined /></template>
              {{ editUploadingImages ? 'Uploading...' : 'Add Images' }}
            </a-button>
            <p class="text-xs text-gray-500 mt-2">
              Upload up to 5 images (JPG, PNG, WebP, max 5MB each)
            </p>
          </div>

          <!-- Image Preview -->
          <div v-if="editItem.images.length > 0" class="grid grid-cols-3 gap-2 mt-4">
            <div
              v-for="(image, index) in editItem.images"
              :key="index"
              class="relative group"
            >
              <img
                :src="image.url"
                :alt="`Preview ${index + 1}`"
                class="w-full h-20 object-contain bg-gray-100 rounded border"
              />
              <button
                type="button"
                @click.prevent="removeEditImage(index)"
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
        <a-input v-model:value="editItem.tagsInput" placeholder="e.g. laptop, electronics, like-new" />
      </div>
    </div>
  </a-modal>

  <!-- Fullscreen Image Preview -->
  <div
    v-if="imagePreviewVisible"
    class="marketplace-fullscreen-overlay"
    @click.self="closeImagePreview"
  >
    <button
      type="button"
      class="marketplace-fullscreen-close"
      aria-label="Close image preview"
      @click="closeImagePreview"
    >
      ×
    </button>

    <div
      class="marketplace-fullscreen-slider"
      @touchstart.passive="onPreviewTouchStart"
      @touchend.passive="onPreviewTouchEnd"
    >
      <div
        class="marketplace-fullscreen-track"
        :style="{ transform: `translateX(-${imagePreviewIndex * 100}%)` }"
      >
        <div
          v-for="(img, index) in imagePreviewImages"
          :key="`preview_${index}`"
          class="marketplace-fullscreen-slide"
        >
          <img
            :src="img"
            :alt="`Preview ${index + 1}`"
            class="marketplace-fullscreen-image"
          />
        </div>
      </div>
    </div>

    <div
      v-if="imagePreviewImages.length > 1"
      class="marketplace-fullscreen-indicator"
    >
      {{ imagePreviewIndex + 1 }} / {{ imagePreviewImages.length }}
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  SearchOutlined, FilterOutlined, AppstoreOutlined, BarsOutlined,
  HeartOutlined, HeartFilled, PlusOutlined, EyeOutlined, DeleteOutlined, EditOutlined
} from '@ant-design/icons-vue';
import { marketplaceAPI } from '@/utils/api'
import CommentSection from '@/components/marketplace/CommentSection.vue'
import ClickableAvatar from '@/components/common/ClickableAvatar.vue'
import { getPublicUserName } from '@/utils/publicName'

// Mobile detection
const isMobile = ref(false)
const checkMobile = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth < 768
  // On first detection or switching to mobile, default to list view
  if (isMobile.value && !wasMobile) {
    viewMode.value = 'list'
  }
}

// State management
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const posting = ref(false)
const viewMode = ref(window.innerWidth < 768 ? 'list' : 'grid')
const showFilterDrawer = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('All')
const showAdvancedFilter = ref(false)
const priceRange = ref([0, 2000])
const condition = ref('all')
const sortBy = ref('created_at')
const showPostModal = ref(false)
const showDetailsModal = ref(false)
const selectedItem = ref(null)
const routeItemAlert = ref(null)
const uploadingImages = ref(false)
const fileInput = ref(null)
const showEditModal = ref(false)
const editSubmitting = ref(false)
const editUploadingImages = ref(false)
const editFileInput = ref(null)
const imagePreviewVisible = ref(false)
const imagePreviewImages = ref([])
const imagePreviewIndex = ref(0)
const previewTouchStartX = ref(0)

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

// Edit item form (mirrors "new item" structure)
const editItem = ref({
  title: '',
  description: '',
  price: null,
  category: null,
  condition: null,
  location: '',
  tagsInput: '',
  images: [] // [{ filename, url }]
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

const isSelectedItemOwner = computed(() => {
  if (!currentUser.value || !selectedItem.value) return false
  const userId = currentUser.value.id
  return selectedItem.value.seller_id === userId || selectedItem.value.seller?.id === userId
})

const normalizeSeller = (seller, item = {}) => {
  const sellerData = Array.isArray(seller) ? seller[0] : seller
  if (sellerData && typeof sellerData === 'object') return sellerData

  const fallbackId = item?.seller_id || item?.user_id || null
  const fallbackEmail = item?.seller_email || item?.email || ''
  const fallbackFirstName = item?.seller_first_name || item?.first_name || ''
  const fallbackLastName = item?.seller_last_name || item?.last_name || ''
  const fallbackAvatar = item?.seller_avatar_url || item?.avatar_url || ''
  const fallbackUniversity = item?.seller_university || item?.university || ''

  if (!fallbackId && !fallbackEmail && !fallbackFirstName && !fallbackLastName) {
    return null
  }

  return {
    id: fallbackId,
    email: fallbackEmail,
    first_name: fallbackFirstName,
    last_name: fallbackLastName,
    avatar_url: fallbackAvatar,
    university: fallbackUniversity
  }
}

const normalizeImages = (images, image) => {
  if (Array.isArray(images)) {
    return images.filter((img) => typeof img === 'string' && img.length > 0)
  }
  if (typeof images === 'string' && images.length > 0) {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        return parsed.filter((img) => typeof img === 'string' && img.length > 0)
      }
    } catch (_) {
      return [images]
    }
    return [images]
  }
  if (image) return [image]
  return []
}

const normalizeMarketplaceItem = (item = {}) => {
  const normalized = {
    ...item,
    seller: normalizeSeller(item.seller, item),
    images: normalizeImages(item.images, item.image)
  }

  if (normalized.images.length > 0) {
    normalized.image = normalized.images[0]
  }

  return normalized
}

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
    items.value = (response.data.data.items || []).map(normalizeMarketplaceItem)
  } catch (error) {
    console.error('Failed to fetch items:', error)
    message.error('Failed to load marketplace items')
  } finally {
    loading.value = false
  }
}

const openItemFromRoute = async () => {
  const itemId = route.params?.id || route.query?.itemId
  if (!itemId) return

  routeItemAlert.value = null
  selectedItem.value = null

  try {
    const response = await marketplaceAPI.getItem(itemId)
    const item = response.data?.data?.item || response.data?.data
    if (!item) {
      routeItemAlert.value = {
        type: 'warning',
        message: 'This item has been deleted.',
        description: 'The listing is no longer available.'
      }
      return
    }
    selectedItem.value = normalizeMarketplaceItem(item)
    showDetailsModal.value = true
  } catch (error) {
    console.error('Failed to load item detail:', error)
    const status = error?.response?.status
    if (status === 404) {
      routeItemAlert.value = {
        type: 'warning',
        message: 'This item has been deleted.',
        description: 'The listing is no longer available.'
      }
      return
    }
    message.error('Failed to load item detail')
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
    items.value = (response.data.data.items || []).map(normalizeMarketplaceItem)
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

const resetFilters = () => {
  priceRange.value = [0, 2000]
  condition.value = 'all'
  sortBy.value = 'created_at'
}

const applyFiltersAndCloseDrawer = () => {
  showFilterDrawer.value = false
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
  selectedItem.value = normalizeMarketplaceItem(item)
  showDetailsModal.value = true
}

const openEditModal = (item) => {
  if (!item) return

  editItem.value = {
    title: item.title || '',
    description: item.description || '',
    price: item.price ?? null,
    category: item.category || null,
    condition: item.condition || null,
    location: item.location || '',
    tagsInput: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tagsInput || ''),
    images: (getItemImages(item) || []).map(url => ({
      url,
      filename: extractFilenameFromUrl(url)
    }))
  }

  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const handleUpdateItem = async () => {
  if (!selectedItem.value) return

  if (!editItem.value.title || !editItem.value.description || !editItem.value.price ||
      !editItem.value.category || !editItem.value.condition) {
    message.error('Please fill in all required fields')
    return
  }

  editSubmitting.value = true
  try {
    const tags = editItem.value.tagsInput
      ? editItem.value.tagsInput.split(',').map(t => t.trim()).filter(t => t)
      : []

    const payload = {
      title: editItem.value.title,
      description: editItem.value.description,
      price: editItem.value.price,
      category: editItem.value.category,
      condition: editItem.value.condition,
      location: editItem.value.location || '',
      tags,
      images: editItem.value.images.map(img => img.url)
    }

    const response = await marketplaceAPI.updateItem(selectedItem.value.id, payload)
    const updated = response.data?.data?.item
    if (updated) {
      // Preserve client-only fields that update endpoint doesn't compute (e.g. is_favorited).
      const previous = selectedItem.value || {}
      selectedItem.value = normalizeMarketplaceItem({
        ...previous,
        ...updated,
        is_favorited: previous.is_favorited ?? false
      })

      const idx = items.value.findIndex(i => i.id === updated.id)
      if (idx !== -1) {
        const existing = items.value[idx] || {}
        items.value[idx] = normalizeMarketplaceItem({
          ...existing,
          ...updated,
          is_favorited: existing.is_favorited ?? false
        })
      }
    }

    message.success('Item updated successfully!')
    showEditModal.value = false
  } catch (error) {
    console.error('Failed to update item:', error)
    message.error(error.response?.data?.error?.message || 'Failed to update item')
  } finally {
    editSubmitting.value = false
  }
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

const getItemImages = (item) => {
  if (!item) return []
  if (Array.isArray(item.images) && item.images.length > 0) return item.images
  if (item.image) return [item.image]
  return []
}

const selectedItemImages = computed(() => getItemImages(selectedItem.value))

const openImagePreview = (item, startIndex = 0) => {
  const images = getItemImages(item)
  if (images.length === 0) return

  imagePreviewImages.value = images
  imagePreviewIndex.value = Math.min(Math.max(startIndex, 0), images.length - 1)
  imagePreviewVisible.value = true
  document.body.style.overflow = 'hidden'
}

const closeImagePreview = () => {
  imagePreviewVisible.value = false
  imagePreviewImages.value = []
  imagePreviewIndex.value = 0
  previewTouchStartX.value = 0
  document.body.style.overflow = ''
}

const showNextPreviewImage = () => {
  if (imagePreviewIndex.value >= imagePreviewImages.value.length - 1) return
  imagePreviewIndex.value += 1
}

const showPreviousPreviewImage = () => {
  if (imagePreviewIndex.value <= 0) return
  imagePreviewIndex.value -= 1
}

const onPreviewTouchStart = (event) => {
  previewTouchStartX.value = event.changedTouches?.[0]?.clientX || 0
}

const onPreviewTouchEnd = (event) => {
  const touchEndX = event.changedTouches?.[0]?.clientX || 0
  const deltaX = touchEndX - previewTouchStartX.value
  const minSwipeDistance = 40

  if (Math.abs(deltaX) < minSwipeDistance) return

  // Follow requested behavior: swipe right to go to next image.
  if (deltaX > 0) {
    showNextPreviewImage()
  } else {
    showPreviousPreviewImage()
  }
}

const extractFilenameFromUrl = (url) => {
  if (!url || typeof url !== 'string') return ''
  const withoutQuery = url.split('?')[0]
  const parts = withoutQuery.split('/')
  return parts[parts.length - 1] || ''
}

const getSellerName = (seller) => {
  return getPublicUserName(seller, 'Unknown')
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

const triggerEditFileUpload = () => {
  editFileInput.value?.click()
}

const handleEditFileUpload = async (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  // Validate total images limit
  if (editItem.value.images.length + files.length > 5) {
    message.error('Maximum 5 images allowed')
    return
  }

  editUploadingImages.value = true

  try {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        message.error(`${file.name} is not an image file`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        message.error(`${file.name} is too large. Maximum size is 5MB`)
        continue
      }

      const base64 = await fileToBase64(file)
      const response = await marketplaceAPI.uploadImage({
        image: base64,
        filename: file.name,
        itemType: 'marketplace'
      })

      if (response.data.success) {
        editItem.value.images.push({
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
    editUploadingImages.value = false
    if (editFileInput.value) {
      editFileInput.value.value = ''
    }
  }
}

const removeEditImage = async (index) => {
  try {
    const image = editItem.value.images[index]
    const filename = image?.filename || extractFilenameFromUrl(image?.url)

    if (filename) {
      await marketplaceAPI.deleteImage(filename)
    }

    editItem.value.images.splice(index, 1)
    message.success('Image removed successfully')
  } catch (error) {
    console.error('Failed to remove image:', error)
    // Still remove locally to avoid blocking the user.
    editItem.value.images.splice(index, 1)
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
onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  await fetchItems()
  await openItemFromRoute()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* ===== Theme colors ===== */
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

/* ===== Category scroller with fade hints ===== */
.marketplace-category-scroller {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  mask-image: linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 24px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 24px), transparent 100%);
}
.marketplace-category-scroller::-webkit-scrollbar {
  display: none;
}

/* ===== Image scroller (detail modal) ===== */
.marketplace-image-scroller {
  width: 100%;
}
.marketplace-image-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  gap: 8px;
}
.marketplace-image-track::-webkit-scrollbar {
  display: none;
}
.marketplace-image-slide {
  flex: 0 0 100%;
  scroll-snap-align: center;
}

/* ===== Fullscreen image preview ===== */
.marketplace-fullscreen-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
}
.marketplace-fullscreen-close {
  position: absolute;
  top: max(16px, env(safe-area-inset-top));
  right: 16px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  z-index: 10;
}
.marketplace-fullscreen-slider {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.marketplace-fullscreen-track {
  height: 100%;
  display: flex;
  transition: transform 0.25s ease-out;
}
.marketplace-fullscreen-slide {
  min-width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(56px, env(safe-area-inset-top)) 16px max(56px, env(safe-area-inset-bottom));
}
.marketplace-fullscreen-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.marketplace-fullscreen-indicator {
  position: absolute;
  bottom: max(16px, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 13px;
  letter-spacing: 0.02em;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 9999px;
  padding: 6px 12px;
}

/* ===== Mobile-only styles (< 768px) ===== */
@media (max-width: 767px) {
  /* Mobile modal: full-width, anchored to bottom */
  .marketplace-mobile-modal :deep(.ant-modal) {
    max-width: 100vw !important;
    margin: 0 !important;
    top: auto !important;
    bottom: 0;
    padding-bottom: 0;
    position: fixed;
  }
  .marketplace-mobile-modal :deep(.ant-modal-content) {
    border-radius: 16px 16px 0 0;
    max-height: 90vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .marketplace-mobile-modal :deep(.ant-modal-header) {
    border-radius: 16px 16px 0 0;
    padding: 14px 16px;
  }
  .marketplace-mobile-modal :deep(.ant-modal-body) {
    padding: 12px 16px 16px;
    overflow: hidden;
  }
  .marketplace-mobile-modal :deep(.ant-modal-footer) {
    padding: 10px 16px;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
  }

  /* Details modal: taller, no body overflow (scroll handled inside) */
  .marketplace-details-modal :deep(.ant-modal-content) {
    max-height: 92vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .marketplace-details-modal :deep(.ant-modal-body) {
    flex: 1;
    overflow: hidden;
    padding-bottom: 0;
    position: relative;
  }

  /* Detail content wrapper */
  .marketplace-detail-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }

  /* Scrollable area above fixed action bar */
  .marketplace-detail-scroll {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    max-height: calc(92vh - 56px - 64px); /* modal header + action bar */
  }

  /* Fixed bottom action bar */
  .marketplace-detail-actions {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 8px;
    padding: 10px 0;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
    background: #fff;
    border-top: 1px solid #f0f0f0;
    z-index: 10;
    flex-shrink: 0;
  }

  /* Search input compact height */
  .marketplace-search-input :deep(.ant-input) {
    height: 36px;
    font-size: 14px;
  }
  .marketplace-search-input :deep(.ant-input-search-button) {
    height: 36px !important;
  }

  /* Icon button compact */
  .marketplace-icon-btn {
    height: 36px !important;
    width: 36px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }

  /* Post button compact */
  .marketplace-post-btn {
    height: 36px !important;
    padding: 0 10px !important;
    font-size: 13px;
  }

  /* Image remove button always visible on mobile (no hover) */
  .marketplace-mobile-modal .group button,
  .group button {
    opacity: 1 !important;
  }

  /* Filter drawer rounded top */
  .marketplace-filter-drawer :deep(.ant-drawer-content-wrapper) {
    border-radius: 16px 16px 0 0;
    overflow: hidden;
  }
}
</style>
