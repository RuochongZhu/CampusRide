<template>
  <div class="min-h-screen bg-gray-50 pt-16">
    <main class="container mx-auto px-4 py-8">
      <!-- Hero Section -->
      <div class="relative rounded-xl overflow-hidden mb-12" style="min-height: 400px;">
        <div class="absolute inset-0 bg-gradient-to-r from-red-900/90 to-transparent z-10"></div>
        <img
          src="https://public.readdy.ai/ai/img_res/200804c4fc3d12ef039423316cbf6d11.jpg"
          alt="Rideshare experience"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="relative z-20 flex flex-col justify-center h-full max-w-2xl p-8 text-white">
          <h1 class="text-4xl md:text-5xl font-bold mb-4">Share Your Journey</h1>
          <p class="text-xl mb-6">Connect with drivers and passengers for a more affordable, sustainable, and social way to travel.</p>
        </div>
      </div>
      <!-- Main Booking and Ride Sections -->
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Left Panel - Passenger/Driver Forms -->
        <div class="w-full lg:w-1/3 bg-white rounded-xl shadow-lg p-6 h-fit">
          <div class="flex items-center bg-gray-100 rounded-full p-1 mb-6">
            <button
              :class="['px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-1', userMode === 'passenger' ? 'bg-red-600 text-white' : 'text-gray-600']"
              @click="userMode = 'passenger'"
            >
              Passenger
            </button>
            <button
              :class="['px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-1', userMode === 'driver' ? 'bg-red-600 text-white' : 'text-gray-600']"
              @click="userMode = 'driver'"
            >
              Driver
            </button>
          </div>
          <h2 class="text-2xl font-bold mb-6">{{ userMode === 'passenger' ? 'Search Rides' : 'Post a Trip' }}</h2>

          <!-- Passenger Search Form -->
          <div v-if="userMode === 'passenger'">
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Origin</label>
              <input
                ref="passengerOriginInput"
                v-model="searchForm.origin"
                placeholder="Enter pickup location"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Destination</label>
              <input
                ref="passengerDestInput"
                v-model="searchForm.destination"
                placeholder="Enter destination"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Date</label>
              <a-date-picker v-model:value="searchForm.date" class="w-full" :disabled-date="disabledDate" format="YYYY-MM-DD" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Minimum Seats</label>
              <a-input-number v-model:value="searchForm.minSeats" :min="1" :max="8" class="w-full" />
            </div>
            <button
              @click="searchRides"
              :disabled="loading"
              class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium transition-all disabled:bg-gray-400"
            >
              {{ loading ? 'Searching...' : 'Find Rides' }}
            </button>
          </div>

          <!-- Driver Post Form -->
          <div v-else>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Trip Title</label>
              <a-input v-model:value="driverForm.title" placeholder="e.g., Cornell to NYC">
                <template #prefix><car-outlined /></template>
              </a-input>
            </div>
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
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold">Available Rides</h2>
              <button
                @click="loadRides"
                class="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-all"
              >
                🔄 Refresh
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p class="text-gray-500">Loading rides...</p>
            </div>

            <!-- Ride Cards -->
            <div v-else class="space-y-4">
              <div v-for="ride in availableRides" :key="ride.id" class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" @click="viewRideDetails(ride)">
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="md:w-1/4">
                    <div class="relative">
                      <img
                        :src="ride.driver?.avatar_url || 'https://public.readdy.ai/ai/img_res/0b81ac2ae733527fd246b41f1c5e355a.jpg'"
                        :alt="getDriverName(ride.driver)"
                        class="w-full h-32 object-cover rounded-lg"
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
                      <p class="text-sm text-gray-600">{{ ride.driver?.university || 'Cornell University' }}</p>
                    </div>
                  </div>
                  <div class="md:w-2/4">
                    <h3 class="font-bold text-lg mb-2">{{ ride.title }}</h3>
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
                        <p class="text-sm text-gray-500">{{ ride.arrival_time ? 'Est. arrival: ' + formatDateTime(ride.arrival_time) : '' }}</p>
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
                    <button
                      class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium mt-4 transition-all"
                      @click.stop="openBookingModal(ride)"
                      :disabled="ride.remaining_seats === 0"
                    >
                      {{ ride.remaining_seats === 0 ? 'Full' : 'Book Seat' }}
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="availableRides.length === 0" class="text-center py-8">
                <inbox-outlined style="font-size: 48px" class="text-gray-300 mb-4" />
                <p class="text-gray-500">No rides available. Be the first to post!</p>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalRides > 0" class="mt-6 flex justify-center">
              <a-pagination
                v-model:current="currentPage"
                :total="totalRides"
                :pageSize="pageSize"
                @change="onPageChange"
                show-less-items
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
            <img
              :src="selectedRide.driver?.avatar_url || 'https://public.readdy.ai/ai/img_res/0b81ac2ae733527fd246b41f1c5e355a.jpg'"
              :alt="getDriverName(selectedRide.driver)"
              class="w-20 h-20 rounded-full object-cover"
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

          <button
            class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium mt-4"
            @click="openBookingModal(selectedRide)"
            :disabled="selectedRide.remaining_seats === 0"
          >
            {{ selectedRide.remaining_seats === 0 ? 'Ride is Full' : 'Book This Ride' }}
          </button>
        </div>
      </a-modal>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { notification } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  EnvironmentOutlined, AimOutlined, CarOutlined, TeamOutlined, ClockCircleOutlined,
  StarFilled, SafetyCertificateOutlined, InboxOutlined, TrophyOutlined
} from '@ant-design/icons-vue';
import {
  Select as ASelect, SelectOption as ASelectOption, Tag as ATag, Pagination as APagination,
  Modal as AModal, Input as AInput, DatePicker as ADatePicker, TimePicker as ATimePicker,
  InputNumber as AInputNumber, Textarea as ATextarea
} from 'ant-design-vue';
import { carpoolingAPI } from '@/utils/api';

// Refs
const userMode = ref('passenger');
const loading = ref(false);
const posting = ref(false);
const bookingRide = ref(false);

// Search Form (Passenger)
const searchForm = ref({
  origin: '',
  destination: '',
  date: null,
  minSeats: 1
});

// Driver Form
const driverForm = ref({
  title: '',
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
const passengerOriginInput = ref(null);
const passengerDestInput = ref(null);
const driverOriginInput = ref(null);
const driverDestInput = ref(null);
let googleMapsLoaded = false;

// Initialize Google Maps Autocomplete with new API
const initGoogleMaps = async () => {
  if (googleMapsLoaded) return;

  try {
    // 检查是否已经加载
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      setupAutocomplete();
      return;
    }

    // Load Google Maps script manually
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    // 创建全局回调
    window.initMap = () => {
      googleMapsLoaded = true;
      setupAutocomplete();
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
      if (passengerOriginInput.value && window.google?.maps?.places) {
        const autocomplete1 = new google.maps.places.Autocomplete(passengerOriginInput.value);
        autocomplete1.addListener('place_changed', () => {
          const place = autocomplete1.getPlace();
          if (place.formatted_address) {
            searchForm.value.origin = place.formatted_address;
          }
        });
      }

      if (passengerDestInput.value && window.google?.maps?.places) {
        const autocomplete2 = new google.maps.places.Autocomplete(passengerDestInput.value);
        autocomplete2.addListener('place_changed', () => {
          const place = autocomplete2.getPlace();
          if (place.formatted_address) {
            searchForm.value.destination = place.formatted_address;
          }
        });
      }

      if (driverOriginInput.value && window.google?.maps?.places) {
        const autocomplete3 = new google.maps.places.Autocomplete(driverOriginInput.value);
        autocomplete3.addListener('place_changed', () => {
          const place = autocomplete3.getPlace();
          if (place.formatted_address) {
            driverForm.value.origin = place.formatted_address;
          }
        });
      }

      if (driverDestInput.value && window.google?.maps?.places) {
        const autocomplete4 = new google.maps.places.Autocomplete(driverDestInput.value);
        autocomplete4.addListener('place_changed', () => {
          const place = autocomplete4.getPlace();
          if (place.formatted_address) {
            driverForm.value.destination = place.formatted_address;
          }
        });
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

// Search rides
const searchRides = async () => {
  const params = {};

  if (searchForm.value.origin) {
    params.departure = searchForm.value.origin;
  }
  if (searchForm.value.destination) {
    params.destination = searchForm.value.destination;
  }
  if (searchForm.value.date) {
    params.date = dayjs(searchForm.value.date).format('YYYY-MM-DD');
  }
  if (searchForm.value.minSeats) {
    params.minSeats = searchForm.value.minSeats;
  }

  currentPage.value = 1;
  await loadRides(params);
};

// Post trip (Driver)
const postTrip = async () => {
  // Validation
  if (!driverForm.value.title || !driverForm.value.origin || !driverForm.value.destination) {
    notification.error({
      message: 'Missing Information',
      description: 'Please fill in title, origin, and destination.'
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

    const response = await carpoolingAPI.createRide({
      title: driverForm.value.title,
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
        title: '',
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

// Watch for mode changes and reinitialize Google Maps
watch(userMode, async () => {
  await nextTick();
  if (googleMapsLoaded && window.google?.maps?.places) {
    setupAutocomplete();
  }
});

// Lifecycle
onMounted(async () => {
  await loadRides();
  // 延迟加载 Google Maps,避免影响主要功能
  setTimeout(() => {
    initGoogleMaps();
  }, 1000);
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
