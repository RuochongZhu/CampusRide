<template>
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
  <!-- Modern Hero Section -->
  <div class="relative pt-16 pb-8 bg-white">
    <div class="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
    <div class="relative max-w-7xl mx-auto px-6">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          Campus <span class="text-indigo-600">Marketplace</span>
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover amazing items from fellow students. Buy, sell, and connect with your campus community.
        </p>
      </div>
    </div>
  </div>

  <!-- Enhanced Search and Filter Section -->
  <div class="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-6 py-6">
      <div class="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <!-- Search Bar -->
        <div class="flex-1 max-w-xl w-full">
          <div class="relative">
            <SearchOutlined class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search for anything..."
              class="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white shadow-sm"
              @keyup.enter="handleSearch"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''; handleSearch()"
              class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3">
          <button
            @click="showAdvancedFilter = !showAdvancedFilter"
            :class="[
              'flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200',
              showAdvancedFilter
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
            ]"
          >
            <FilterOutlined />
            Filters
          </button>

          <!-- View Mode Toggle -->
          <div class="flex bg-gray-100 rounded-xl p-1">
            <button
              @click="viewMode = 'grid'"
              :class="[
                'px-4 py-2 rounded-lg transition-all duration-200',
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              <AppstoreOutlined />
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'px-4 py-2 rounded-lg transition-all duration-200',
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              <BarsOutlined />
            </button>
          </div>

          <button
            @click="$router.push('/marketplace/favorites')"
            class="flex items-center gap-2 px-6 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-100 transition-all duration-200 shadow-sm"
          >
            <HeartOutlined />
            Favorites
          </button>

          <button
            @click="showPostModal = true"
            class="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <PlusOutlined />
            Post Item
          </button>
        </div>
      </div>

      <!-- Advanced Filters -->
      <div v-show="showAdvancedFilter" class="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Price Range -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">Price Range</label>
            <div class="px-4">
              <a-slider
                v-model:value="priceRange"
                range
                :min="0"
                :max="10000"
                :step="50"
                @change="applyFilters"
                class="mt-2"
              />
              <div class="flex justify-between text-sm text-gray-500 mt-1">
                <span>${{priceRange[0]}}</span>
                <span>{{priceRange[1] >= 10000 ? '无限' : '$' + priceRange[1]}}</span>
              </div>
            </div>
          </div>

          <!-- Condition -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">Condition</label>
            <select
              v-model="condition"
              @change="applyFilters"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="all">All Conditions</option>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <!-- Sort By -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">Sort By</label>
            <select
              v-model="sortBy"
              @change="applyFilters"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="created_at">Latest</option>
              <option value="price">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="views_count">Most Viewed</option>
              <option value="favorites_count">Most Popular</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Tags -->
    <div class="max-w-7xl mx-auto px-6 pb-4">
      <div class="flex gap-3 overflow-x-auto scrollbar-hide">
        <button
          v-for="category in categories"
          :key="category"
          @click="handleCategoryChange(category)"
          :class="[
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
            selectedCategory === category
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200'
          ]"
        >
          {{ category }}
        </button>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="flex flex-col items-center justify-center py-20">
    <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    <p class="text-gray-600 mt-4">Loading amazing items...</p>
  </div>

  <!-- Empty State -->
  <div v-else-if="items.length === 0" class="text-center py-20">
    <div class="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <SearchOutlined class="text-3xl text-gray-400" />
    </div>
    <h3 class="text-2xl font-semibold text-gray-900 mb-2">No items found</h3>
    <p class="text-gray-600 mb-8 max-w-md mx-auto">
      Try adjusting your filters or search terms, or be the first to post something amazing!
    </p>
    <button
      @click="showPostModal = true"
      class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
    >
      <PlusOutlined />
      Post First Item
    </button>
  </div>

  <!-- Items Display -->
  <div v-else class="max-w-7xl mx-auto px-6 py-8">
    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="item in items"
        :key="item.id"
        class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200"
        @click="viewItemDetails(item)"
      >
        <!-- Image -->
        <div class="relative aspect-[4/3] overflow-hidden">
          <img
            :src="getItemImage(item)"
            :alt="item.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <!-- Status Badge -->
          <div class="absolute top-3 left-3">
            <span class="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
              Available
            </span>
          </div>
          <!-- Action Buttons -->
          <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <!-- Delete Button (Owner Only) -->
            <button
              v-if="isItemOwner(item)"
              @click.stop="confirmDeleteItem(item)"
              class="p-2 bg-white/90 hover:bg-red-50 text-red-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              title="Delete item"
            >
              <DeleteOutlined class="text-sm" />
            </button>
            <!-- Favorite Button -->
            <button
              @click.stop="toggleFavorite(item)"
              class="p-2 bg-white/90 hover:bg-rose-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <HeartFilled
                v-if="item.is_favorited"
                class="text-sm text-rose-500"
              />
              <HeartOutlined
                v-else
                class="text-sm text-gray-600"
              />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-5">
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
              {{ item.title }}
            </h3>
          </div>

          <div class="flex items-center justify-between mb-4">
            <span class="text-2xl font-bold text-indigo-600">${{ item.price }}</span>
            <span :class="[
              'px-2 py-1 text-xs font-medium rounded-full',
              getConditionColorClass(item.condition)
            ]">
              {{ formatCondition(item.condition) }}
            </span>
          </div>

          <!-- Seller Info -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {{ getInitials(item.seller) }}
              </div>
              <span class="text-sm text-gray-600">{{ getSellerName(item.seller) }}</span>
            </div>
            <div class="flex items-center gap-4 text-gray-400 text-sm">
              <div class="flex items-center gap-1">
                <EyeOutlined />
                <span>{{ item.views_count || 0 }}</span>
              </div>
              <div class="flex items-center gap-1">
                <HeartOutlined />
                <span>{{ item.favorites_count || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200"
        @click="viewItemDetails(item)"
      >
        <div class="flex gap-6">
          <!-- Image -->
          <div class="flex-shrink-0">
            <div class="relative w-32 h-32 rounded-xl overflow-hidden">
              <img
                :src="getItemImage(item)"
                :alt="item.title"
                class="w-full h-full object-cover"
              />
              <!-- Status Badge -->
              <div class="absolute top-2 left-2">
                <span class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                  Available
                </span>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1 min-w-0">
                <h3 class="text-xl font-semibold text-gray-900 truncate">{{ item.title }}</h3>
                <p class="text-gray-600 mt-1 line-clamp-2">{{ truncateText(item.description, 100) }}</p>
              </div>
              <!-- Action Buttons -->
              <div class="flex items-center gap-2 ml-4">
                <!-- Delete Button (Owner Only) -->
                <button
                  v-if="isItemOwner(item)"
                  @click.stop="confirmDeleteItem(item)"
                  class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Delete item"
                >
                  <DeleteOutlined />
                </button>
                <!-- Favorite Button -->
                <button
                  @click.stop="toggleFavorite(item)"
                  class="p-2 hover:bg-rose-50 rounded-lg transition-all duration-200"
                >
                  <HeartFilled
                    v-if="item.is_favorited"
                    class="text-rose-500"
                  />
                  <HeartOutlined
                    v-else
                    class="text-gray-400"
                  />
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between mt-4">
              <div class="flex items-center gap-4">
                <span class="text-2xl font-bold text-indigo-600">${{ item.price }}</span>
                <span :class="[
                  'px-3 py-1 text-sm font-medium rounded-full',
                  getConditionColorClass(item.condition)
                ]">
                  {{ formatCondition(item.condition) }}
                </span>
              </div>

              <div class="flex items-center gap-6">
                <!-- Seller Info -->
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {{ getInitials(item.seller) }}
                  </div>
                  <span class="text-sm text-gray-600">{{ getSellerName(item.seller) }}</span>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-4 text-gray-400 text-sm">
                  <div class="flex items-center gap-1">
                    <EyeOutlined />
                    <span>{{ item.views_count || 0 }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <HeartOutlined />
                    <span>{{ item.favorites_count || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Enhanced Post Item Modal -->
  <div v-if="showPostModal" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" @click="showPostModal = false"></div>

      <!-- Modal -->
      <div class="relative transform overflow-hidden rounded-3xl bg-white px-8 py-8 text-left shadow-2xl transition-all sm:max-w-2xl sm:w-full">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-gray-900">Post New Item</h3>
          <button
            @click="showPostModal = false"
            class="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handlePostItem" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Title -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Item Title *</label>
              <input
                v-model="newItem.title"
                type="text"
                required
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="What are you selling?"
              />
            </div>

            <!-- Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Price *</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  v-model="newItem.price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="0.00"
                />
              </div>
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                v-model="newItem.category"
                required
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select a category</option>
                <option v-for="category in categoryOptions" :key="category.value" :value="category.value">
                  {{ category.label }}
                </option>
              </select>
            </div>

            <!-- Condition -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
              <select
                v-model="newItem.condition"
                required
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <!-- Location -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                v-model="newItem.location"
                type="text"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Campus, building, etc."
              />
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              v-model="newItem.description"
              rows="4"
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Describe your item in detail..."
            ></textarea>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input
              v-model="newItem.tagsInput"
              type="text"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="laptop, electronics, like-new (comma separated)"
            />
          </div>

          <!-- Images Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Images</label>
            <MediaUploader
              v-model="newItem.images"
              :maxFiles="5"
              accept="image/*"
              uploadText="Upload Images"
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 pt-6">
            <button
              type="button"
              @click="showPostModal = false"
              class="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="posting"
              class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="posting" class="flex items-center justify-center gap-2">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Posting...
              </span>
              <span v-else>Post Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Enhanced Item Details Modal -->
  <div v-if="showDetailsModal" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4 text-center">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" @click="showDetailsModal = false"></div>

      <!-- Modal -->
      <div class="relative transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 class="text-2xl font-bold text-gray-900 truncate">{{ selectedItem?.title }}</h3>
          <button
            @click="showDetailsModal = false"
            class="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div v-if="selectedItem" class="p-6">
          <!-- Enhanced Image Gallery -->
          <div v-if="selectedItem.images && selectedItem.images.length > 0" class="mb-8">
            <div class="relative rounded-2xl overflow-hidden bg-gray-100">
              <div class="aspect-[16/10] relative">
                <img
                  :src="selectedItem.images[currentImageIndex]"
                  :alt="`${selectedItem.title} - Image ${currentImageIndex + 1}`"
                  class="w-full h-full object-cover"
                />
                <!-- Navigation Arrows -->
                <button
                  v-if="selectedItem.images.length > 1"
                  @click="previousImage"
                  class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button
                  v-if="selectedItem.images.length > 1"
                  @click="nextImage"
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
              <!-- Image Indicators -->
              <div v-if="selectedItem.images.length > 1" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <button
                  v-for="(_, index) in selectedItem.images"
                  :key="index"
                  @click="currentImageIndex = index"
                  :class="[
                    'w-2 h-2 rounded-full transition-all duration-200',
                    currentImageIndex === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                  ]"
                />
              </div>
            </div>
          </div>
          <!-- Single Image -->
          <div v-else class="mb-8">
            <div class="aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100">
              <img :src="getItemImage(selectedItem)" :alt="selectedItem.title" class="w-full h-full object-cover" />
            </div>
          </div>

          <!-- Item Info -->
          <div class="grid md:grid-cols-2 gap-8 mb-8">
            <!-- Left Column -->
            <div class="space-y-6">
              <!-- Price and Condition -->
              <div class="flex items-center justify-between">
                <span class="text-4xl font-bold text-indigo-600">${{ selectedItem.price }}</span>
                <span :class="[
                  'px-4 py-2 text-sm font-medium rounded-full',
                  getConditionColorClass(selectedItem.condition)
                ]">
                  {{ formatCondition(selectedItem.condition) }}
                </span>
              </div>

              <!-- Description -->
              <div>
                <h4 class="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                <p class="text-gray-700 leading-relaxed">{{ selectedItem.description }}</p>
              </div>

              <!-- Item Details -->
              <div>
                <h4 class="text-lg font-semibold text-gray-900 mb-3">Details</h4>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Category:</span>
                    <span class="font-medium">{{ selectedItem.category }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Location:</span>
                    <span class="font-medium">{{ selectedItem.location || 'Not specified' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Views:</span>
                    <span class="font-medium">{{ selectedItem.views_count || 0 }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Posted:</span>
                    <span class="font-medium">{{ new Date(selectedItem.created_at).toLocaleDateString() }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-6">
              <!-- Seller Info -->
              <div class="bg-gray-50 rounded-2xl p-6">
                <h4 class="text-lg font-semibold text-gray-900 mb-4">Seller Information</h4>
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {{ getInitials(selectedItem.seller) }}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">{{ getSellerName(selectedItem.seller) }}</p>
                    <p class="text-sm text-gray-600">{{ selectedItem.seller?.university || 'University not specified' }}</p>
                    <div class="flex items-center gap-1 mt-1">
                      <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span class="text-sm text-gray-600">Active seller</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="space-y-3">
                <button
                  v-if="!isItemOwner(selectedItem)"
                  @click="startConversation(selectedItem)"
                  :disabled="startingConversation"
                  class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
                >
                  <MessageOutlined />
                  <span v-if="startingConversation">Starting conversation...</span>
                  <span v-else>Contact Seller</span>
                </button>

                <button
                  v-if="isItemOwner(selectedItem)"
                  disabled
                  class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                  Your Item
                </button>

                <div class="flex gap-3">
                  <button
                    @click="toggleFavorite(selectedItem)"
                    :class="[
                      'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                      selectedItem.is_favorited
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    ]"
                  >
                    <HeartFilled v-if="selectedItem.is_favorited" class="text-rose-500" />
                    <HeartOutlined v-else />
                    {{ selectedItem.favorites_count || 0 }}
                  </button>

                  <button
                    v-if="isItemOwner(selectedItem)"
                    @click="confirmDeleteItem(selectedItem)"
                    class="flex items-center justify-center px-4 py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl transition-all duration-200"
                    title="Delete item"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Comments Section -->
          <div class="border-t border-gray-200 pt-8">
            <h4 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a9.954 9.954 0 01-5.716-1.8c-.95.619-2.094 1.024-3.284 1.1-.584.037-1.115-.23-1.446-.724-.33-.494-.381-1.136-.133-1.681C2.82 15.85 3 14.965 3 14c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
              </svg>
              Comments & Reviews
            </h4>
            <CommentsSection :itemId="selectedItem.id" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Chat Modal -->
  <a-modal
    v-model:open="showChatModal"
    :title="currentConversation?.title || 'Chat'"
    :footer="null"
    width="600px"
    :bodyStyle="{ padding: 0, height: '500px' }"
  >
    <div v-if="currentConversation" class="flex flex-col h-full">
      <!-- Chat Header -->
      <div class="px-4 py-3 border-b bg-gray-50 flex items-center space-x-3">
        <img :src="getItemImage(currentConversation.item)" :alt="currentConversation.item.title" class="w-10 h-10 object-cover rounded" />
        <div>
          <div class="font-medium">{{ currentConversation.item.title }}</div>
          <div class="text-sm text-gray-500">${{ currentConversation.item.price }} • {{ getSellerName(currentConversation.item.seller) }}</div>
        </div>
      </div>

      <!-- Messages Area -->
      <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto bg-gray-50" style="height: 350px;">
        <div v-if="loadingMessages" class="flex justify-center items-center h-full">
          <a-spin />
        </div>
        <div v-else class="space-y-3">
          <div v-for="msg in conversationMessages" :key="msg.id" :class="[
            'flex',
            msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
          ]">
            <div :class="[
              'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
              msg.sender_id === currentUser?.id
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-900 border'
            ]">
              <div class="text-sm">{{ msg.message }}</div>
              <div :class="[
                'text-xs mt-1',
                msg.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
              ]">
                {{ formatTime(msg.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="p-4 border-t bg-white">
        <div class="flex space-x-2">
          <a-input
            v-model:value="newMessage"
            placeholder="Type a message..."
            @keyup.enter="sendNewMessage"
            :disabled="sendingMessage"
            class="flex-1"
          />
          <a-button
            type="primary"
            @click="sendNewMessage"
            :loading="sendingMessage"
            :disabled="!newMessage.trim()"
          >
            <template #icon><SendOutlined /></template>
          </a-button>
        </div>
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
  HeartOutlined, HeartFilled, MessageOutlined, PlusOutlined, EyeOutlined,
  LeftCircleOutlined, RightCircleOutlined, DeleteOutlined, SendOutlined
} from '@ant-design/icons-vue';
import { marketplaceAPI, userAPI } from '@/utils/api'
import MediaUploader from '@/components/MediaUploader.vue'
import CommentsSection from '@/components/CommentsSection.vue'

// State management
const loading = ref(false)
const posting = ref(false)
const startingConversation = ref(false)
const currentUser = ref(null)
const viewMode = ref('grid')
const searchQuery = ref('')
const selectedCategory = ref('All')
const showAdvancedFilter = ref(false)
const priceRange = ref([0, 10000])
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

    console.log('🔍 Fetching marketplace items with params:', params)
    const response = await marketplaceAPI.getItems(params)
    console.log('📋 Marketplace API response:', response.data)

    items.value = response.data.data.items || []
    console.log('✅ Items loaded:', items.value.length, items.value)
  } catch (error) {
    console.error('❌ Failed to fetch items:', error)
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
      message.success('Added to favorites! View in My Favorites', 3)
    }

    // 更新selectedItem如果它是同一个商品
    if (selectedItem.value && selectedItem.value.id === item.id) {
      selectedItem.value.is_favorited = item.is_favorited
      selectedItem.value.favorites_count = item.favorites_count
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
      images: newItem.value.images || []
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

const getConditionColorClass = (cond) => {
  const colors = {
    'new': 'bg-emerald-100 text-emerald-800',
    'like_new': 'bg-blue-100 text-blue-800',
    'good': 'bg-cyan-100 text-cyan-800',
    'fair': 'bg-amber-100 text-amber-800',
    'poor': 'bg-red-100 text-red-800'
  }
  return colors[cond] || 'bg-gray-100 text-gray-800'
}

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 获取当前用户信息
const fetchCurrentUser = async () => {
  try {
    const response = await userAPI.getMe()
    currentUser.value = response.data.user || response.data
  } catch (error) {
    console.error('❌ Failed to fetch current user:', error)
    // 用户未登录，这是正常情况
    currentUser.value = null
  }
}

// 检查是否是商品所有者
const isItemOwner = (item) => {
  if (!currentUser.value || !item) {
    return false
  }

  const userId = currentUser.value.id
  const sellerId = item.seller_id || item.seller?.id

  return userId && sellerId && userId === sellerId
}

// 删除商品
const deleteItem = async (item) => {
  try {
    await marketplaceAPI.deleteItem(item.id)
    message.success('Item deleted successfully')

    // 从列表中移除该商品
    const index = items.value.findIndex(i => i.id === item.id)
    if (index > -1) {
      items.value.splice(index, 1)
    }

    // 如果详情模态框打开且是当前商品，关闭模态框
    if (selectedItem.value && selectedItem.value.id === item.id) {
      showDetailsModal.value = false
      selectedItem.value = null
    }
  } catch (error) {
    console.error('❌ Failed to delete item:', error)
    message.error(error.response?.data?.message || 'Failed to delete item')
  }
}

// 删除确认
const confirmDeleteItem = (item) => {
  Modal.confirm({
    title: 'Delete Item',
    content: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: () => deleteItem(item)
  })
}

// 开始聊天对话
const startConversation = async (item) => {
  if (!currentUser.value) {
    message.error('Please log in to contact the seller')
    return
  }

  if (isItemOwner(item)) {
    message.warning('You cannot message yourself')
    return
  }

  startingConversation.value = true
  try {
    // 开启一个简单的对话消息
    const initialMessage = `Hi! I'm interested in your item "${item.title}". Is it still available?`

    const response = await marketplaceAPI.startConversation(item.id, initialMessage)

    if (response.data.success) {
      message.success('Conversation started! Redirecting to messages...')

      // 3秒后跳转到消息页面
      setTimeout(() => {
        showDetailsModal.value = false
        // 这里可以跳转到专门的聊天页面，或者打开聊天组件
        openChatModal(response.data.data.conversationId, item)
      }, 1000)
    }
  } catch (error) {
    console.error('Failed to start conversation:', error)
    message.error(error.response?.data?.message || 'Failed to start conversation')
  } finally {
    startingConversation.value = false
  }
}

// 打开聊天模态框（临时方案）
const showChatModal = ref(false)
const currentConversation = ref(null)
const conversationMessages = ref([])
const loadingMessages = ref(false)
const newMessage = ref('')
const sendingMessage = ref(false)
const messagesContainer = ref(null)
const currentImageIndex = ref(0)

const openChatModal = async (conversationId, item) => {
  currentConversation.value = {
    id: conversationId,
    item: item,
    title: `Chat about "${item.title}"`
  }
  showChatModal.value = true
  await loadConversationMessages(conversationId)
}

// 加载对话消息
const loadConversationMessages = async (conversationId) => {
  loadingMessages.value = true
  try {
    const response = await marketplaceAPI.getConversationMessages(conversationId)
    if (response.data.success) {
      conversationMessages.value = response.data.data.messages || []
      // 滚动到底部
      setTimeout(scrollToBottom, 100)
    }
  } catch (error) {
    console.error('Failed to load messages:', error)
    message.error('Failed to load messages')
  } finally {
    loadingMessages.value = false
  }
}

// 发送新消息
const sendNewMessage = async () => {
  if (!newMessage.value.trim() || !currentConversation.value) return

  sendingMessage.value = true
  try {
    const response = await marketplaceAPI.sendMessage(
      currentConversation.value.id,
      newMessage.value.trim()
    )

    if (response.data.success) {
      // 添加消息到列表
      conversationMessages.value.push(response.data.data)
      newMessage.value = ''
      // 滚动到底部
      setTimeout(scrollToBottom, 100)
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    message.error('Failed to send message')
  } finally {
    sendingMessage.value = false
  }
}

// 滚动到消息底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// 图片导航方法
const previousImage = () => {
  if (selectedItem.value?.images?.length > 1) {
    currentImageIndex.value = currentImageIndex.value === 0
      ? selectedItem.value.images.length - 1
      : currentImageIndex.value - 1
  }
}

const nextImage = () => {
  if (selectedItem.value?.images?.length > 1) {
    currentImageIndex.value = currentImageIndex.value === selectedItem.value.images.length - 1
      ? 0
      : currentImageIndex.value + 1
  }
}

// 重置图片索引
const viewItemDetails = async (item) => {
  try {
    console.log('📖 Fetching item details for:', item.id)

    // 调用API获取商品详情（会自动增加浏览量）
    const response = await marketplaceAPI.getItem(item.id)

    if (response.data.success) {
      selectedItem.value = response.data.data.item
      currentImageIndex.value = 0
      showDetailsModal.value = true

      console.log('✅ Item details loaded, views:', selectedItem.value.views_count)
    } else {
      throw new Error('Failed to fetch item details')
    }
  } catch (error) {
    console.error('Failed to fetch item details:', error)
    // 如果API调用失败，降级使用列表数据
    selectedItem.value = item
    currentImageIndex.value = 0
    showDetailsModal.value = true
    message.warning('无法获取最新商品信息')
  }
}

// Lifecycle
onMounted(() => {
  fetchCurrentUser()
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

/* 轮播图样式 */
.custom-slick-arrow {
  font-size: 32px;
  color: white;
  opacity: 0.7;
  transition: opacity 0.3s;
  cursor: pointer;
}

.custom-slick-arrow:hover {
  opacity: 1;
}

:deep(.ant-carousel .slick-slide) {
  text-align: center;
  height: 384px;
  overflow: hidden;
  background: #364d79;
}

:deep(.ant-carousel .slick-dots li button) {
  background: #C24D45;
}

:deep(.ant-carousel .slick-dots li.slick-active button) {
  background: #C24D45;
}
</style>
