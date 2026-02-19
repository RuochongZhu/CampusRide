<template>
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
  <!-- Modern Hero Section -->
  <div class="relative pt-16 pb-8 bg-white">
    <div class="absolute inset-0 bg-gradient-to-r from-rose-600/5 to-pink-600/5"></div>
    <div class="relative max-w-7xl mx-auto px-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6">
          <button
            @click="$router.push('/marketplace')"
            class="flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors rounded-xl hover:bg-gray-100"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Marketplace
          </button>
          <div>
            <h1 class="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <svg class="w-10 h-10 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
              </svg>
              My <span class="text-rose-600">Favorites</span>
            </h1>
            <p class="text-xl text-gray-600 mt-2">
              {{ favorites.length }} {{ favorites.length === 1 ? 'item' : 'items' }} you've favorited
            </p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-rose-600">{{ favorites.length }}</div>
          <div class="text-sm text-gray-500">Saved Items</div>
        </div>
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
            <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search your favorites..."
              class="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white shadow-sm"
              @input="handleSearch"
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
          <select
            v-model="selectedCategory"
            @change="applyFilters"
            class="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-white"
          >
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>

          <!-- View Mode Toggle -->
          <div class="flex bg-gray-100 rounded-xl p-1">
            <button
              @click="viewMode = 'grid'"
              :class="[
                'px-4 py-2 rounded-lg transition-all duration-200',
                viewMode === 'grid' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'px-4 py-2 rounded-lg transition-all duration-200',
                viewMode === 'list' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
              </svg>
            </button>
          </div>

          <button
            @click="refreshFavorites"
            :disabled="loading"
            class="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <svg :class="['w-4 h-4', loading && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </button>

          <button
            @click="clearFilters"
            v-if="searchQuery || selectedCategory"
            class="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="flex flex-col items-center justify-center py-20">
    <div class="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
    <p class="text-gray-600 mt-4">Loading your favorites...</p>
  </div>

  <!-- Empty State -->
  <div v-else-if="filteredFavorites.length === 0" class="text-center py-20">
    <div class="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <svg class="text-3xl text-gray-400 w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
      </svg>
    </div>
    <h3 class="text-2xl font-semibold text-gray-900 mb-2">
      {{ favorites.length === 0 ? 'No favorites yet' : 'No matches found' }}
    </h3>
    <p class="text-gray-600 mb-8 max-w-md mx-auto">
      {{ favorites.length === 0
          ? 'Start browsing the marketplace and save items you love!'
          : 'Try adjusting your search or filters to find what you\'re looking for.' }}
    </p>
    <div class="flex gap-4 justify-center">
      <button
        v-if="favorites.length === 0"
        @click="$router.push('/marketplace')"
        class="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
        </svg>
        Browse Marketplace
      </button>
      <button
        v-else
        @click="clearFilters"
        class="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Clear Filters
      </button>
    </div>
  </div>

  <!-- Items Display -->
  <div v-else class="max-w-7xl mx-auto px-6 py-8">
    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="item in filteredFavorites"
        :key="item.id"
        class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200"
        @click="viewItemDetails(item)"
      >
        <!-- Image -->
        <div class="relative aspect-[4/3] overflow-hidden">
          <img
            :src="getItemImage(item)"
            :alt="item.title"
            class="w-full h-full object-contain bg-gray-100"
          />
          <!-- Favorited Badge -->
          <div class="absolute top-3 left-3">
            <span class="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-medium rounded-full">
              ♥ Favorited
            </span>
          </div>
          <!-- Remove Favorite Button -->
          <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              @click.stop="toggleFavorite(item)"
              class="p-2 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              title="Remove from favorites"
            >
              <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
              </svg>
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
            <span class="text-2xl font-bold text-rose-600">${{ item.price }}</span>
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
              <div class="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {{ getInitials(item.seller) }}
              </div>
              <span class="text-sm text-gray-600">{{ getSellerName(item.seller) }}</span>
            </div>
            <div class="flex items-center gap-4 text-gray-400 text-sm">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                <span>{{ item.views_count || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Favorited Date -->
          <div v-if="item.favorited_at" class="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Saved {{ formatDate(item.favorited_at) }}
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="space-y-4">
      <div
        v-for="item in filteredFavorites"
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
                class="w-full h-full object-contain bg-gray-100"
              />
              <!-- Status Badge -->
              <div class="absolute top-2 left-2">
                <span class="px-2 py-1 bg-rose-100 text-rose-800 text-xs font-medium rounded-full">
                  ♥ Favorited
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
              <!-- Remove Favorite Button -->
              <button
                @click.stop="toggleFavorite(item)"
                class="ml-4 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200"
                title="Remove from favorites"
              >
                <svg class="w-6 h-6 fill-current" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>

            <div class="flex items-center justify-between mt-4">
              <div class="flex items-center gap-4">
                <span class="text-2xl font-bold text-rose-600">${{ item.price }}</span>
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
                  <div class="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {{ getInitials(item.seller) }}
                  </div>
                  <span class="text-sm text-gray-600">{{ getSellerName(item.seller) }}</span>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-4 text-gray-400 text-sm">
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <span>{{ item.views_count || 0 }}</span>
                  </div>
                  <div v-if="item.favorited_at" class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{{ formatDate(item.favorited_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                  :src="selectedItem.images[0]"
                  :alt="selectedItem.title"
                  class="w-full h-full object-contain bg-gray-100"
                />
                <!-- Favorited Badge -->
                <div class="absolute top-3 left-3">
                  <span class="px-3 py-1 bg-rose-100 text-rose-800 text-sm font-medium rounded-full">
                    ♥ Favorited {{ formatDate(selectedItem.favorited_at) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- Single Image -->
          <div v-else class="mb-8">
            <div class="aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 relative">
              <img :src="getItemImage(selectedItem)" :alt="selectedItem.title" class="w-full h-full object-contain bg-gray-100" />
              <div class="absolute top-3 left-3">
                <span class="px-3 py-1 bg-rose-100 text-rose-800 text-sm font-medium rounded-full">
                  ♥ Favorited {{ formatDate(selectedItem.favorited_at) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Item Info -->
          <div class="grid md:grid-cols-2 gap-8 mb-8">
            <!-- Left Column -->
            <div class="space-y-6">
              <!-- Price and Condition -->
              <div class="flex items-center justify-between">
                <span class="text-4xl font-bold text-rose-600">${{ selectedItem.price }}</span>
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
                    <span class="text-gray-600">Favorited:</span>
                    <span class="font-medium">{{ formatDate(selectedItem.favorited_at) }}</span>
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
                  <div class="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
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
                  @click="startConversation"
                  class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a9.954 9.954 0 01-5.716-1.8c-.95.619-2.094 1.024-3.284 1.1-.584.037-1.115-.23-1.446-.724-.33-.494-.381-1.136-.133-1.681C2.82 15.85 3 14.965 3 14c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
                  </svg>
                  Contact Seller
                </button>

                <div class="flex gap-3">
                  <button
                    @click="toggleFavorite(selectedItem)"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-xl transition-all duration-200 font-medium"
                  >
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                    </svg>
                    Remove from Favorites
                  </button>

                  <button
                    @click="$router.push('/marketplace')"
                    class="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-all duration-200"
                    title="Browse more items"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { marketplaceAPI } from '@/utils/api'
import { getPublicUserName } from '@/utils/publicName'

// State management
const loading = ref(false)
const favorites = ref([])
const viewMode = ref('grid')
const searchQuery = ref('')
const selectedCategory = ref('')
const showDetailsModal = ref(false)
const selectedItem = ref(null)

// Categories
const categories = ['Electronics', 'Books', 'Furniture', 'Fashion', 'Sports', 'Art', 'Others']

// Computed
const filteredFavorites = computed(() => {
  let items = [...favorites.value]

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
  }

  // 分类过滤
  if (selectedCategory.value) {
    items = items.filter(item => item.category === selectedCategory.value)
  }

  return items
})

// Methods
const fetchFavorites = async () => {
  loading.value = true
  try {
    const response = await marketplaceAPI.getMyFavorites()
    console.log('📋 Favorites API response:', response.data)

    // 后端返回的结构是 data.favorites，每个favorite包含item对象
    const favoritesData = response.data.data?.favorites || response.data.favorites || []

    // 提取item数据，并添加收藏时间信息
    favorites.value = favoritesData.map(favorite => {
      const item = favorite.item || favorite
      return {
        ...item,
        favorited_at: favorite.created_at // 添加收藏时间
      }
    })

    console.log('✅ Processed favorites:', favorites.value)
  } catch (error) {
    console.error('❌ Failed to fetch favorites:', error)
    message.error('Failed to load favorites')
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
}

const refreshFavorites = () => {
  fetchFavorites()
}

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const applyFilters = () => {
  // 过滤逻辑已在computed中处理
}

const toggleFavorite = async (item) => {
  try {
    // 从收藏页面取消收藏
    await marketplaceAPI.unfavoriteItem(item.id)

    // 从收藏列表中移除
    const index = favorites.value.findIndex(fav => fav.id === item.id)
    if (index > -1) {
      favorites.value.splice(index, 1)
    }

    // 如果详情模态框打开，关闭它
    if (selectedItem.value && selectedItem.value.id === item.id) {
      showDetailsModal.value = false
      selectedItem.value = null
    }

    message.success('Removed from favorites')
  } catch (error) {
    console.error('Failed to remove favorite:', error)
    message.error('Failed to remove from favorites')
  }
}

const viewItemDetails = (item) => {
  selectedItem.value = item
  showDetailsModal.value = true
}

const startConversation = () => {
  // Navigate to marketplace to contact seller
  showDetailsModal.value = false
  setTimeout(() => {
    window.location.href = `/marketplace?item=${selectedItem.value.id}`
  }, 300)
}

// Helper functions
const getItemImage = (item) => {
  if (item.images && item.images.length > 0) {
    return item.images[0]
  }
  return 'https://via.placeholder.com/400x300?text=No+Image'
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

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'today'
  } else if (diffDays === 1) {
    return 'yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Lifecycle
onMounted(() => {
  fetchFavorites()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Focus ring styles to match our design */
input:focus,
select:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2);
}

/* Smooth transitions */
* {
  transition: all 0.2s ease-in-out;
}
</style>
