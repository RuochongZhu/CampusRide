<template>
  <div class="min-h-screen bg-gray-50 pt-16">
    <main class="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <!-- Hero Section - Responsive -->
      <div class="relative rounded-xl overflow-hidden mb-6 md:mb-12" style="min-height: 200px;">
        <div class="absolute inset-0 bg-gradient-to-r from-red-900/90 to-transparent z-10"></div>
        <img
          src="https://public.readdy.ai/ai/img_res/200804c4fc3d12ef039423316cbf6d11.jpg"
          alt="Rideshare experience"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="relative z-20 flex flex-col justify-center h-full max-w-2xl p-4 md:p-8 text-white" style="min-height: 200px;">
          <h1 class="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">Share Your Journey</h1>
          <p class="text-sm md:text-xl mb-4 md:mb-6">Connect with drivers and passengers for a more affordable, sustainable, and social way to travel.</p>
        </div>
      </div>
      <!-- Main Booking and Ride Sections -->
      <div class="flex flex-col lg:flex-row gap-4 md:gap-8">
        <!-- Left Panel - Passenger/Driver Forms -->
        <div class="w-full lg:w-1/3 bg-white rounded-xl shadow-lg p-4 md:p-6 h-fit">
          <!-- Universal Search Bar -->
          <div class="mb-4">
            <div class="relative">
              <input
                v-model="universalSearch"
                @keyup.enter="performUniversalSearch"
                placeholder="Search rides by keyword..."
                class="w-full px-4 py-3 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <button
                v-if="universalSearch"
                @click="clearUniversalSearch"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="flex items-center bg-gray-100 rounded-full p-1 mb-4 md:mb-6">
            <button
              :class="['px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-1', userMode === 'passenger' ? 'bg-red-600 text-white' : 'text-gray-600']"
              @click="userMode = 'passenger'"
            >
              Passenger
            </button>
            <button
              :class="['px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-1', userMode === 'driver' ? 'bg-red-600 text-white' : 'text-gray-600']"
              @click="userMode = 'driver'"
            >
              Driver
            </button>
          </div>

          <h2 class="text-lg md:text-2xl font-bold mb-4 md:mb-6">
            {{ userMode === 'passenger' ? 'Post Ride Request' : 'Post a Trip' }}
          </h2>

          <!-- Passenger Post Request Form -->
          <div v-if="userMode === 'passenger'">
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Origin</label>
              <input
                ref="passengerRequestOriginInput"
                v-model="passengerRequestForm.origin"
                placeholder="Enter pickup location"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Destination</label>
              <input
                ref="passengerRequestDestInput"
                v-model="passengerRequestForm.destination"
                placeholder="Enter destination"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Date</label>
              <a-date-picker v-model:value="passengerRequestForm.date" class="w-full" :disabled-date="disabledDate" format="YYYY-MM-DD" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Preferred Time</label>
              <a-time-picker v-model:value="passengerRequestForm.time" class="w-full" format="HH:mm" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Seats Needed</label>
              <a-input-number v-model:value="passengerRequestForm.seats" :min="1" :max="8" class="w-full" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Max Price per Seat ($)</label>
              <a-input-number v-model:value="passengerRequestForm.price" :min="0" class="w-full" :formatter="value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')" :parser="value => value.replace(/\$\s?|(,*)/g, '')" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Time Flexibility</label>
              <a-select v-model:value="passengerRequestForm.flexibility" class="w-full">
                <a-select-option value="exact">Exact time</a-select-option>
                <a-select-option value="flexible">±2 hours</a-select-option>
                <a-select-option value="very_flexible">Any time that day</a-select-option>
              </a-select>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Description (Optional)</label>
              <a-textarea v-model:value="passengerRequestForm.description" placeholder="Any additional details..." :rows="3" />
            </div>
            <button
              @click="postPassengerRequest"
              :disabled="posting"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium transition-all disabled:bg-gray-400"
            >
              {{ posting ? 'Posting...' : 'Post Ride Request' }}
            </button>
          </div>

          <!-- Driver Post Form -->
          <div v-if="userMode === 'driver'">
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Origin</label>
              <input
                ref="driverOriginInput"
                v-model="driverForm.origin"
                placeholder="Enter starting point"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Destination</label>
              <input
                ref="driverDestInput"
                v-model="driverForm.destination"
                placeholder="Enter destination"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Date</label>
              <a-date-picker v-model:value="driverForm.date" class="w-full" :disabled-date="disabledDate" format="YYYY-MM-DD" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Departure Time</label>
              <a-time-picker v-model:value="driverForm.time" class="w-full" format="HH:mm" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Available Seats</label>
              <a-input-number v-model:value="driverForm.seats" :min="1" :max="8" class="w-full" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Price per Seat ($)</label>
              <a-input-number v-model:value="driverForm.price" :min="0" class="w-full" :formatter="value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')" :parser="value => value.replace(/\$\s?|(,*)/g, '')" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Description (Optional)</label>
              <a-textarea v-model:value="driverForm.description" placeholder="Any additional details..." :rows="3" />
            </div>
            <button
              @click="postTrip"
              :disabled="posting"
              class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium transition-all disabled:bg-gray-400"
            >
              {{ posting ? 'Posting...' : 'Post Trip' }}
            </button>
          </div>
        </div>

        <!-- Right Panel - Available Rides -->
        <div class="w-full lg:w-2/3">
          <div class="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
            <div class="flex justify-between items-center mb-4 md:mb-6">
              <h2 class="text-lg md:text-2xl font-bold">Available Rides</h2>
              <button
                @click="loadRides"
                class="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-all"
              >
                🔄 Refresh
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-8 md:py-12">
              <div class="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p class="text-gray-500 text-sm md:text-base">Loading rides...</p>
            </div>

            <!-- Ride Cards -->
            <div v-else class="space-y-3 md:space-y-4">
              <div v-for="ride in availableRides" :key="ride.id" class="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow cursor-pointer" @click="viewRideDetails(ride)">
                <div class="flex flex-col gap-3 md:gap-4">
                  <!-- Mobile: Horizontal compact layout -->
                  <div class="flex items-start gap-3 md:hidden">
                    <div class="flex-shrink-0">
                      <ClickableAvatar
                        v-if="ride.driver"
                        :user="ride.driver"
                        :size="48"
                        @message="handleUserMessage"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-gray-600 truncate">{{ ride.departure_location }}</p>
                      <p class="text-xs text-gray-500">→ {{ ride.destination_location }}</p>
                      <div class="flex items-center justify-between mt-2">
                        <span class="text-lg font-bold text-red-600">${{ ride.price_per_seat }}</span>
                        <span class="text-xs bg-gray-100 rounded-full px-2 py-0.5">{{ ride.remaining_seats || ride.available_seats }} seats</span>
                      </div>
                    </div>
                  </div>

                  <!-- Desktop: Original layout -->
                  <div class="hidden md:flex md:flex-row gap-4">
                    <div class="md:w-1/4">
                      <div class="relative flex justify-center">
                        <ClickableAvatar
                          v-if="ride.driver"
                          :user="ride.driver"
                          :size="96"
                          @message="handleUserMessage"
                        />
                        <div class="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow">
                          <div class="flex items-center px-2">
                            <star-filled class="text-yellow-400 mr-1" />
                            <span class="font-medium">{{ (ride.driver?.points || 0) / 100 || '4.5' }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="mt-2 text-center">
                        <p class="font-medium">{{ getDriverName(ride.driver) }}</p>
                        <p class="text-sm text-gray-600">{{ ride.driver?.university || 'Your University' }}</p>
                      </div>
                    </div>
                    <div class="md:w-2/4">
                      <div class="flex items-start mb-3">
                        <div class="mr-3 mt-1">
                          <div class="w-2 h-2 rounded-full bg-green-500"></div>
                          <div class="w-0.5 h-12 bg-gray-300 mx-auto my-1"></div>
                          <div class="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                        <div>
                          <p class="font-medium">{{ ride.departure_location }}</p>
                          <p class="text-sm text-gray-500 mb-6">{{ formatDateTime(ride.departure_time) }}</p>
                          <p class="font-medium">{{ ride.destination_location }}</p>
                        </div>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        <div class="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                          <team-outlined class="mr-1" />{{ ride.remaining_seats || ride.available_seats }} seats available
                        </div>
                        <div class="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm flex items-center">
                          {{ ride.status }}
                        </div>
                      </div>
                    </div>
                    <div class="md:w-1/4 flex flex-col justify-between">
                      <div>
                        <p class="text-2xl font-bold text-red-600">${{ ride.price_per_seat }}</p>
                        <p class="text-sm text-gray-500">per person</p>
                      </div>
                      <!-- Dynamic button based on booking status -->
                      <template v-if="ride.is_booked_by_user">
                        <button
                          class="bg-green-600 text-white py-2 px-4 rounded-md font-medium mt-4 cursor-not-allowed opacity-75"
                          disabled
                        >
                          ✓ Booked
                        </button>
                      </template>
                      <template v-else-if="ride.remaining_seats === 0">
                        <button
                          class="bg-gray-400 text-white py-2 px-4 rounded-md font-medium mt-4 cursor-not-allowed"
                          disabled
                        >
                          Fully Booked
                        </button>
                      </template>
                      <template v-else>
                        <button
                          class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium mt-4 transition-all"
                          @click.stop="openBookingModal(ride)"
                        >
                          Book Seat
                        </button>
                      </template>
                    </div>
                  </div>

                  <!-- Mobile Book Button -->
                  <div class="md:hidden">
                    <template v-if="ride.is_booked_by_user">
                      <button class="w-full bg-green-600 text-white py-2 rounded-md text-sm font-medium cursor-not-allowed opacity-75" disabled>
                        ✓ Booked
                      </button>
                    </template>
                    <template v-else-if="ride.remaining_seats === 0">
                      <button class="w-full bg-gray-400 text-white py-2 rounded-md text-sm font-medium cursor-not-allowed" disabled>
                        Fully Booked
                      </button>
                    </template>
                    <template v-else>
                      <button
                        class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm font-medium transition-all"
                        @click.stop="openBookingModal(ride)"
                      >
                        Book Seat
                      </button>
                    </template>
                  </div>
                </div>
              </div>

              <div v-if="availableRides.length === 0" class="text-center py-6 md:py-8">
                <inbox-outlined style="font-size: 36px" class="text-gray-300 mb-3 md:mb-4 md:text-5xl" />
                <p class="text-gray-500 text-sm md:text-base">No rides available. Be the first to post!</p>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalRides > 0" class="mt-4 md:mt-6 flex justify-center">
              <a-pagination
                v-model:current="currentPage"
                :total="totalRides"
                :pageSize="pageSize"
                @change="onPageChange"
                show-less-items
                :simple="windowWidth < 640"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Modal -->
      <a-modal
        v-model:open="showBookingModal"
        title="Book Your Ride"
        width="600px"
        :footer="null"
      >
        <div v-if="selectedRide" class="space-y-6">
          <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 class="font-bold mb-2">{{ selectedRide.title }}</h3>
            <p class="text-sm text-gray-600">{{ selectedRide.departure_location }} → {{ selectedRide.destination_location }}</p>
            <p class="text-sm text-gray-600">{{ formatDateTime(selectedRide.departure_time) }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-gray-700 mb-2">Number of Seats</label>
              <a-input-number
                v-model:value="bookingForm.seats"
                :min="1"
                :max="selectedRide.remaining_seats || selectedRide.available_seats"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-2">Contact Number *</label>
              <a-input
                v-model:value="bookingForm.contactNumber"
                placeholder="Enter your contact number"
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-2">Pickup Location (Optional)</label>
              <a-input
                v-model:value="bookingForm.pickupLocation"
                placeholder="Specific pickup location"
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-2">Special Requests (Optional)</label>
              <a-textarea
                v-model:value="bookingForm.specialRequests"
                placeholder="Any special requests..."
                :rows="3"
              />
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${{ selectedRide.price_per_seat * bookingForm.seats }}</span>
              </div>
            </div>
            <button
              class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium"
              @click="confirmBooking"
              :disabled="bookingRide"
            >
              {{ bookingRide ? 'Booking...' : 'Confirm Booking' }}
            </button>
          </div>
        </div>
      </a-modal>

      <!-- Ride Details Modal -->
      <a-modal
        v-model:open="showDetailsModal"
        title="Ride Details"
        width="700px"
        :footer="null"
      >
        <div v-if="selectedRide" class="space-y-4">
          <div class="flex items-center gap-4 mb-4">
            <ClickableAvatar
              v-if="selectedRide.driver"
              :user="selectedRide.driver"
              :size="80"
              @message="handleUserMessage"
            />
            <div>
              <h3 class="font-bold text-lg">{{ getDriverName(selectedRide.driver) }}</h3>
              <p class="text-sm text-gray-600">{{ selectedRide.driver?.university }}</p>
              <div class="flex items-center mt-1">
                <star-filled class="text-yellow-400 mr-1" />
                <span>{{ (selectedRide.driver?.points || 0) / 100 || '4.5' }}</span>
              </div>
            </div>
          </div>

          <div class="border-t pt-4">
            <h4 class="font-bold mb-2">Trip Information</h4>
            <p><strong>Title:</strong> {{ selectedRide.title }}</p>
            <p><strong>From:</strong> {{ selectedRide.departure_location }}</p>
            <p><strong>To:</strong> {{ selectedRide.destination_location }}</p>
            <p><strong>Departure:</strong> {{ formatDateTime(selectedRide.departure_time) }}</p>
            <p v-if="selectedRide.arrival_time"><strong>Arrival:</strong> {{ formatDateTime(selectedRide.arrival_time) }}</p>
            <p><strong>Available Seats:</strong> {{ selectedRide.remaining_seats || selectedRide.available_seats }}</p>
            <p><strong>Price per Seat:</strong> ${{ selectedRide.price_per_seat }}</p>
          </div>

          <div v-if="selectedRide.description" class="border-t pt-4">
            <h4 class="font-bold mb-2">Description</h4>
            <p class="text-gray-700">{{ selectedRide.description }}</p>
          </div>

          <template v-if="selectedRide.is_booked_by_user">
            <!-- Already booked by user -->
            <button
              class="w-full bg-green-600 text-white py-3 rounded-md font-medium mt-4 cursor-not-allowed opacity-75"
              disabled
            >
              ✓ You Have Booked This Ride
            </button>
          </template>
          <template v-else-if="selectedRide.remaining_seats === 0">
            <!-- Ride is full -->
            <button
              class="w-full bg-gray-400 text-white py-3 rounded-md font-medium mt-4 cursor-not-allowed"
              disabled
            >
              This Ride is Full
            </button>
          </template>
          <template v-else>
            <!-- Available for booking -->
            <button
              class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium mt-4"
              @click="openBookingModal(selectedRide)"
            >
              Book This Ride
            </button>
          </template>
        </div>
      </a-modal>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { notification } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  EnvironmentOutlined, AimOutlined, CarOutlined, TeamOutlined, ClockCircleOutlined,
  StarFilled, SafetyCertificateOutlined, InboxOutlined, TrophyOutlined
} from '@ant-design/icons-vue';
import {
  Select as ASelect, SelectOption as ASelectOption, Tag as ATag, Pagination as APagination,
  Modal as AModal, Input as AInput, DatePicker as ADatePicker, TimePicker as ATimePicker,
  InputNumber as AInputNumber, Textarea as ATextarea, Checkbox as ACheckbox
} from 'ant-design-vue';
import { carpoolingAPI } from '@/utils/api';
import ClickableAvatar from '@/components/common/ClickableAvatar.vue';

// Window width for responsive pagination
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// Universal Search
const universalSearch = ref('');

// Refs
const userMode = ref('passenger');
const loading = ref(false);
const posting = ref(false);
const bookingRide = ref(false);

// Passenger Request Form
const passengerRequestForm = ref({
  origin: '',
  destination: '',
  date: null,
  time: null,
  seats: 1,
  price: 50,
  flexibility: 'flexible',
  description: ''
});

// Driver Form
const driverForm = ref({
  origin: '',
  destination: '',
  date: null,
  time: null,
  seats: 3,
  price: 25,
  description: ''
});

// Rides
const availableRides = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const totalRides = ref(0);

// Modals
const showBookingModal = ref(false);
const showDetailsModal = ref(false);
const selectedRide = ref(null);
const bookingForm = ref({
  seats: 1,
  contactNumber: '',
  pickupLocation: '',
  specialRequests: ''
});

// Google Maps refs
const passengerRequestOriginInput = ref(null);
const passengerRequestDestInput = ref(null);
const driverOriginInput = ref(null);
const driverDestInput = ref(null);
let googleMapsLoaded = false;

// Initialize Google Maps Autocomplete
const initGoogleMaps = async () => {
  if (googleMapsLoaded) return;

  try {
    // 检查是否已经加载
    if (window.google && window.google.maps && window.google.maps.places) {
      googleMapsLoaded = true;
      console.log('✅ Google Maps already loaded');
      setupAutocomplete();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap&loading=async`;
    script.async = true;
    script.defer = true;

    // 创建全局回调
    window.initMap = () => {
      googleMapsLoaded = true;
      console.log('✅ Google Maps loaded successfully');
      setupAutocomplete();
    };

    // 错误处理
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps');
      notification.warning({
        message: 'Address Autocomplete Unavailable',
        description: 'You can still enter addresses manually.',
        duration: 3
      });
    };

    document.head.appendChild(script);
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    notification.warning({
      message: 'Address Autocomplete Unavailable',
      description: 'You can still enter addresses manually.',
      duration: 3
    });
  }
};

// 设置自动补全
const setupAutocomplete = () => {
  setTimeout(() => {
    try {
      if (!window.google?.maps?.places) {
        console.warn('Google Maps Places API not available');
        return;
      }

      let setupCount = 0;

      // Passenger Request Origin Input
      if (passengerRequestOriginInput.value) {
        const autocomplete5 = new google.maps.places.Autocomplete(passengerRequestOriginInput.value, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'us' }
        });
        autocomplete5.addListener('place_changed', () => {
          const place = autocomplete5.getPlace();
          if (place.formatted_address) {
            passengerRequestForm.value.origin = place.formatted_address;
          } else if (place.name) {
            passengerRequestForm.value.origin = place.name;
          }
        });
        setupCount++;
      }

      // Passenger Request Destination Input
      if (passengerRequestDestInput.value) {
        const autocomplete6 = new google.maps.places.Autocomplete(passengerRequestDestInput.value, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'us' }
        });
        autocomplete6.addListener('place_changed', () => {
          const place = autocomplete6.getPlace();
          if (place.formatted_address) {
            passengerRequestForm.value.destination = place.formatted_address;
          } else if (place.name) {
            passengerRequestForm.value.destination = place.name;
          }
        });
        setupCount++;
      }

      // Driver Origin Input
      if (driverOriginInput.value) {
        const autocomplete3 = new google.maps.places.Autocomplete(driverOriginInput.value, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'us' }
        });
        autocomplete3.addListener('place_changed', () => {
          const place = autocomplete3.getPlace();
          if (place.formatted_address) {
            driverForm.value.origin = place.formatted_address;
          } else if (place.name) {
            driverForm.value.origin = place.name;
          }
        });
        setupCount++;
      }

      // Driver Destination Input
      if (driverDestInput.value) {
        const autocomplete4 = new google.maps.places.Autocomplete(driverDestInput.value, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'us' }
        });
        autocomplete4.addListener('place_changed', () => {
          const place = autocomplete4.getPlace();
          if (place.formatted_address) {
            driverForm.value.destination = place.formatted_address;
          } else if (place.name) {
            driverForm.value.destination = place.name;
          }
        });
        setupCount++;
      }

      if (setupCount > 0) {
        console.log(`✅ Autocomplete initialized for ${setupCount} input fields`);
      }
    } catch (error) {
      console.warn('Failed to setup autocomplete:', error);
    }
  }, 500);
};

// Load rides from API
const loadRides = async (params = {}) => {
  try {
    loading.value = true;
    const response = await carpoolingAPI.getRides({
      page: currentPage.value,
      limit: pageSize.value,
      ...params
    });

    if (response.data.success) {
      availableRides.value = response.data.data.rides || [];
      totalRides.value = response.data.data.pagination?.total_items || 0;
    }
  } catch (error) {
    console.error('Failed to load rides:', error);
    notification.error({
      message: 'Error',
      description: error.response?.data?.error?.message || 'Failed to load rides. Please try again.'
    });
  } finally {
    loading.value = false;
  }
};

// Universal search functions
const performUniversalSearch = async () => {
  if (!universalSearch.value.trim()) {
    await loadRides();
    return;
  }

  const keyword = universalSearch.value.trim();
  await loadRides({
    departure: keyword,
    destination: keyword,
    searchMode: 'keyword'
  });
};

const clearUniversalSearch = async () => {
  universalSearch.value = '';
  await loadRides();
};

// Post trip (Driver)
const postTrip = async () => {
  // Validation
  if (!driverForm.value.origin || !driverForm.value.destination) {
    notification.error({
      message: 'Missing Information',
      description: 'Please fill in origin and destination.'
    });
    return;
  }

  if (!driverForm.value.date || !driverForm.value.time) {
    notification.error({
      message: 'Missing Information',
      description: 'Please select departure date and time.'
    });
    return;
  }

  try {
    posting.value = true;

    // Combine date and time
    const departureDateTime = dayjs(driverForm.value.date)
      .hour(dayjs(driverForm.value.time).hour())
      .minute(dayjs(driverForm.value.time).minute())
      .toISOString();

    // Auto-generate title from origin and destination
    const autoTitle = `${driverForm.value.origin} → ${driverForm.value.destination}`;

    const response = await carpoolingAPI.createRide({
      title: autoTitle,
      departureLocation: driverForm.value.origin,
      destinationLocation: driverForm.value.destination,
      departureTime: departureDateTime,
      availableSeats: driverForm.value.seats,
      pricePerSeat: driverForm.value.price,
      description: driverForm.value.description || ''
    });

    if (response.data.success) {
      notification.success({
        message: 'Success!',
        description: 'Your trip has been posted successfully.'
      });

      // Reset form
      driverForm.value = {
        origin: '',
        destination: '',
        date: null,
        time: null,
        seats: 3,
        price: 25,
        description: ''
      };

      // Switch to passenger mode to see the new ride
      userMode.value = 'passenger';

      // Reload rides
      await loadRides();
    }
  } catch (error) {
    console.error('Failed to post trip:', error);
    notification.error({
      message: 'Error',
      description: error.response?.data?.error?.message || 'Failed to post trip. Please try again.'
    });
  } finally {
    posting.value = false;
  }
};

// Post passenger request
const postPassengerRequest = async () => {
  // Validation
  if (!passengerRequestForm.value.origin || !passengerRequestForm.value.destination) {
    notification.error({
      message: 'Missing Information',
      description: 'Please fill in origin and destination.'
    });
    return;
  }

  if (!passengerRequestForm.value.date || !passengerRequestForm.value.time) {
    notification.error({
      message: 'Missing Information',
      description: 'Please select preferred date and time.'
    });
    return;
  }

  try {
    posting.value = true;

    // Combine date and time
    const departureDateTime = dayjs(passengerRequestForm.value.date)
      .hour(dayjs(passengerRequestForm.value.time).hour())
      .minute(dayjs(passengerRequestForm.value.time).minute())
      .toISOString();

    // Auto-generate title from origin and destination
    const autoTitle = `[REQUEST] ${passengerRequestForm.value.origin} → ${passengerRequestForm.value.destination}`;

    const response = await carpoolingAPI.createRide({
      title: autoTitle,
      departureLocation: passengerRequestForm.value.origin,
      destinationLocation: passengerRequestForm.value.destination,
      departureTime: departureDateTime,
      availableSeats: passengerRequestForm.value.seats,
      pricePerSeat: passengerRequestForm.value.price,
      description: passengerRequestForm.value.description || '',
      rideType: 'request', // Mark as passenger request
      flexibility: passengerRequestForm.value.flexibility
    });

    if (response.data.success) {
      notification.success({
        message: 'Success!',
        description: 'Your ride request has been posted. Drivers can now see it and contact you.'
      });

      // Reset form
      passengerRequestForm.value = {
        origin: '',
        destination: '',
        date: null,
        time: null,
        seats: 1,
        price: 50,
        flexibility: 'flexible',
        description: ''
      };

      // Reload rides
      await loadRides();
    }
  } catch (error) {
    console.error('Post passenger request error:', error);
    notification.error({
      message: 'Error',
      description: error.response?.data?.error?.message || 'Failed to post request. Please try again.'
    });
  } finally {
    posting.value = false;
  }
};

// Open booking modal
const openBookingModal = (ride) => {
  selectedRide.value = ride;
  showDetailsModal.value = false;
  showBookingModal.value = true;
  bookingForm.value = {
    seats: 1,
    contactNumber: '',
    pickupLocation: '',
    specialRequests: ''
  };
};

// View ride details
const viewRideDetails = (ride) => {
  selectedRide.value = ride;
  showDetailsModal.value = true;
};

// Confirm booking
const confirmBooking = async () => {
  if (!bookingForm.value.contactNumber) {
    notification.error({
      message: 'Contact Number Required',
      description: 'Please provide your contact number.'
    });
    return;
  }

  try {
    bookingRide.value = true;

    const response = await carpoolingAPI.bookRide(selectedRide.value.id, {
      seatsBooked: bookingForm.value.seats,
      contactNumber: bookingForm.value.contactNumber,
      pickupLocation: bookingForm.value.pickupLocation,
      specialRequests: bookingForm.value.specialRequests
    });

    if (response.data.success) {
      showBookingModal.value = false;
      notification.success({
        message: 'Booking Confirmed!',
        description: 'Your ride has been booked successfully. The driver will contact you.'
      });

      // Reload rides to update availability
      await loadRides();
    }
  } catch (error) {
    console.error('Failed to book ride:', error);
    notification.error({
      message: 'Booking Failed',
      description: error.response?.data?.error?.message || 'Failed to book ride. Please try again.'
    });
  } finally {
    bookingRide.value = false;
  }
};

// Pagination
const onPageChange = (page) => {
  currentPage.value = page;
  loadRides();
};

// Utilities
const disabledDate = (current) => {
  return current && current < dayjs().startOf('day');
};

const formatDateTime = (datetime) => {
  if (!datetime) return '';
  return dayjs(datetime).format('MMM D, YYYY h:mm A');
};

const getDriverName = (driver) => {
  if (!driver) return 'Driver';
  return `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Driver';
};

// Handle user message from ClickableAvatar
const handleUserMessage = (user) => {
  // This will be handled by the ClickableAvatar component internally
  // It navigates to /messages with userId query parameter
};

// Watch for mode changes and reinitialize Google Maps
watch(userMode, async () => {
  await nextTick();
  if (googleMapsLoaded && window.google?.maps?.places) {
    setupAutocomplete();
  }
});

// Lifecycle
onMounted(async () => {
  // Add resize listener
  window.addEventListener('resize', handleResize);
  // 立即开始加载 Google Maps（异步加载，不阻塞）
  initGoogleMaps();
  // 加载拼车列表
  await loadRides();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
:deep(.ant-select-selector),
:deep(.ant-picker),
:deep(.ant-input-number),
:deep(.ant-input-affix-wrapper) {
  border-radius: 0.375rem !important;
  height: 42px !important;
  display: flex;
  align-items: center;
  border-color: #d1d5db;
}
:deep(.ant-tag) {
  cursor: pointer;
  border-radius: 9999px;
}
:deep(.ant-pagination-item-active) {
  border-color: #dc2626;
}
:deep(.ant-pagination-item-active a) {
  color: #dc2626;
}
</style>

<style>
/* Google Maps Autocomplete 下拉框样式 */
.pac-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-top: 4px;
  font-family: inherit;
  z-index: 9999 !important;
}

.pac-container:after {
  display: none !important;
}

.pac-item {
  padding: 10px 12px;
  cursor: pointer;
  border-top: 1px solid #f3f4f6;
  line-height: 1.5;
  font-size: 14px;
}

.pac-item:first-child {
  border-top: none;
}

.pac-item:hover {
  background-color: #fef2f2;
}

.pac-item-selected {
  background-color: #fee2e2;
}

.pac-icon {
  margin-top: 6px;
}

.pac-item-query {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.pac-matched {
  font-weight: 700;
  color: #dc2626;
}

.hdpi.pac-logo:after {
  background-image: none !important;
}
</style>
