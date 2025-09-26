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
          <h2 class="text-2xl font-bold mb-6">{{ userMode === 'passenger' ? 'Book a Ride' : 'Post a Trip' }}</h2>
          <!-- Form content here -->
          <div v-if="userMode === 'passenger'">
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Origin</label>
              <a-input v-model:value="passengerForm.origin" placeholder="Enter pickup location">
                <template #prefix><environment-outlined /></template>
              </a-input>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Destination</label>
              <a-input v-model:value="passengerForm.destination" placeholder="Enter destination">
                <template #prefix><aim-outlined /></template>
              </a-input>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Date & Time</label>
              <a-date-picker v-model:value="passengerForm.date" class="w-full" :disabled-date="disabledDate" format="YYYY-MM-DD" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Time</label>
              <a-time-picker v-model:value="passengerForm.time" class="w-full" format="HH:mm" />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Passengers</label>
              <a-input-number v-model:value="passengerForm.passengers" :min="1" :max="8" class="w-full" />
            </div>
            <button class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium transition-all">
              Find Rides
            </button>
          </div>
          <div v-else>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Origin</label>
              <a-input v-model:value="driverForm.origin" placeholder="Enter starting point">
                 <template #prefix><environment-outlined /></template>
              </a-input>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 mb-2">Destination</label>
              <a-input v-model:value="driverForm.destination" placeholder="Enter destination">
                 <template #prefix><aim-outlined /></template>
              </a-input>
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
              <a-input-number v-model:value="driverForm.price" :min="1" class="w-full" :formatter="value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')" :parser="value => value.replace(/\$\s?|(,*)/g, '')" />
            </div>
            <button class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium transition-all">
              Post Trip
            </button>
          </div>
        </div>
        <!-- Right Panel - Available Rides -->
        <div class="w-full lg:w-2/3">
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold">Available Rides</h2>
              <div class="flex items-center">
                <span class="mr-2 text-gray-600">Sort by:</span>
                <a-select v-model:value="sortBy" style="width: 120px">
                  <a-select-option value="price">Price</a-select-option>
                  <a-select-option value="time">Departure Time</a-select-option>
                  <a-select-option value="rating">Driver Rating</a-select-option>
                </a-select>
              </div>
            </div>
            <div class="flex flex-wrap gap-4 mb-6">
              <a-tag v-for="tag in filterOptions" :key="tag" :color="activeFilters.includes(tag) ? 'red' : 'default'" @click="toggleFilter(tag)" class="cursor-pointer px-3 py-1 text-sm">{{tag}}</a-tag>
            </div>
            <!-- Ride Cards -->
            <div class="space-y-4">
              <div v-for="(ride, index) in availableRides" :key="index" class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="md:w-1/4">
                    <div class="relative">
                      <img :src="ride.driverImage" :alt="ride.driverName" class="w-full h-32 object-cover rounded-lg"/>
                      <div class="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow">
                        <div class="flex items-center px-2">
                          <star-filled class="text-yellow-400 mr-1" />
                          <span class="font-medium">{{ ride.rating }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="mt-2 text-center">
                      <p class="font-medium">{{ ride.driverName }}</p>
                      <div class="flex items-center justify-center">
                        <safety-certificate-outlined v-if="ride.verified" class="text-green-500 mr-1" />
                        <span class="text-sm text-gray-600">{{ ride.verified ? 'Verified Driver' : 'Driver' }}</span>
                      </div>
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
                        <p class="font-medium">{{ ride.origin }}</p>
                        <p class="text-sm text-gray-500 mb-6">{{ formatTime(ride.departureTime) }}</p>
                        <p class="font-medium">{{ ride.destination }}</p>
                        <p class="text-sm text-gray-500">Est. arrival: {{ formatTime(ride.arrivalTime) }}</p>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <div class="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center"><car-outlined class="mr-1" />{{ ride.vehicle }}</div>
                      <div class="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center"><team-outlined class="mr-1" />{{ ride.availableSeats }} seats</div>
                      <div class="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center"><clock-circle-outlined class="mr-1" />{{ ride.duration }}</div>
                    </div>
                  </div>
                  <div class="md:w-1/4 flex flex-col justify-between">
                    <div>
                      <p class="text-2xl font-bold text-red-600">${{ ride.price }}</p>
                      <p class="text-sm text-gray-500">per person</p>
                    </div>
                    <button class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium mt-4 transition-all" @click="() => { selectedRide = ride; showBookingModal = true; }">Book Seat</button>
                  </div>
                </div>
              </div>
              <div v-if="availableRides.length === 0" class="text-center py-8">
                <inbox-outlined style="font-size: 48px" class="text-gray-300 mb-4" />
                <p class="text-gray-500">No rides available for your search criteria.</p>
              </div>
            </div>
            <div class="mt-6 flex justify-center">
              <a-pagination v-model:current="currentPage" :total="50" show-less-items />
            </div>
          </div>
        </div>
      </div>
      <!-- Other Sections: Incentives, Trust & Safety, Testimonials, etc. -->
      <div class="bg-white rounded-xl shadow-lg p-8 mt-12">
        <h2 class="text-2xl font-bold mb-6 text-center">Incentives & Loyalty Programs</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="flex flex-col items-center text-center p-6 bg-red-50 rounded-xl">
                <div class="bg-red-100 p-4 rounded-full mb-4"><star-filled style="font-size: 32px" class="text-red-600" /></div>
                <h3 class="text-xl font-bold mb-2">Reward Points</h3>
                <p class="text-gray-600">Earn points for every ride and redeem for discounts.</p>
            </div>
            <div class="flex flex-col items-center text-center p-6 bg-red-50 rounded-xl">
                <div class="bg-red-100 p-4 rounded-full mb-4"><trophy-outlined style="font-size: 32px" class="text-red-600" /></div>
                <h3 class="text-xl font-bold mb-2">Monthly Milestones</h3>
                <p class="text-gray-600">Unlock bigger discounts for completing more rides.</p>
            </div>
        </div>
      </div>
      
      <!-- Booking Modal -->
      <a-modal v-model:visible="showBookingModal" title="Book Your Ride" width="600px" @ok="handleBookingConfirmation" @cancel="showBookingModal = false" :footer="null">
        <div v-if="selectedRide" class="space-y-6">
          <div class="space-y-4">
            <div><label class="block text-gray-700 mb-2">Number of Seats</label><a-input-number v-model:value="bookingForm.seats" :min="1" :max="selectedRide.availableSeats" class="w-full" /></div>
            <div><label class="block text-gray-700 mb-2">Contact Number</label><a-input v-model:value="bookingForm.contactNumber" placeholder="Enter your contact number" /></div>
            <div class="bg-gray-50 p-4 rounded-lg"><div class="flex justify-between font-bold text-lg"><span>Total:</span><span>${{ selectedRide.price * bookingForm.seats }}</span></div></div>
            <button class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium" @click="handleBookingConfirmation">Confirm Booking</button>
          </div>
        </div>
      </a-modal>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { notification } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  EnvironmentOutlined, AimOutlined, CarOutlined, TeamOutlined, ClockCircleOutlined,
  StarFilled, SafetyCertificateOutlined, InboxOutlined, TrophyOutlined,
  PlusOutlined, MinusOutlined, CreditCardOutlined, DollarOutlined
} from '@ant-design/icons-vue';
import {
  Select as ASelect, SelectOption as ASelectOption, Tag as ATag, Pagination as APagination,
  Modal as AModal, Input as AInput, DatePicker as ADatePicker, TimePicker as ATimePicker,
  InputNumber as AInputNumber,
} from 'ant-design-vue';


const userMode = ref('passenger');
const passengerForm = ref({ origin: '', destination: '', date: null, time: null, passengers: 1 });
const driverForm = ref({ origin: '', destination: '', date: null, time: null, seats: 3, price: 25 });
const sortBy = ref('price');
const activeFilters = ref(['All']);
const filterOptions = ['All', 'Today', 'Tomorrow', 'Weekend', 'Verified Drivers'];
const currentPage = ref(1);
const selectedRide = ref(null);
const showBookingModal = ref(false);
const bookingForm = ref({ seats: 1, contactNumber: '' });

const availableRides = ref([
  { driverName: 'John Smith', driverImage: 'https://public.readdy.ai/ai/img_res/0b81ac2ae733527fd246b41f1c5e355a.jpg', rating: 4.8, verified: true, origin: 'San Francisco, CA', destination: 'Los Angeles, CA', departureTime: '08:30 AM, Apr 2', arrivalTime: '03:15 PM, Apr 2', price: 45, availableSeats: 3, vehicle: 'Tesla Model 3', duration: '6h 45min' },
  { driverName: 'Emily Johnson', driverImage: 'https://public.readdy.ai/ai/img_res/acec183bef4a70f55d91b559d6bac8a0.jpg', rating: 4.9, verified: true, origin: 'Boston, MA', destination: 'New York, NY', departureTime: '10:00 AM, Apr 2', arrivalTime: '02:30 PM, Apr 2', price: 35, availableSeats: 2, vehicle: 'Honda Civic', duration: '4h 30min' },
  { driverName: 'David Wilson', driverImage: 'https://public.readdy.ai/ai/img_res/6d3c87b63466c768e640f07570f2ea69.jpg', rating: 4.6, verified: false, origin: 'Chicago, IL', destination: 'Detroit, MI', departureTime: '09:15 AM, Apr 3', arrivalTime: '02:45 PM, Apr 3', price: 40, availableSeats: 4, vehicle: 'Toyota Camry', duration: '5h 30min' }
]);

const disabledDate = (current) => {
  return current && current < dayjs().startOf('day');
};

const formatTime = (time) => {
  return time; // Placeholder
};

const toggleFilter = (tag) => {
  if (tag === 'All') {
    activeFilters.value = ['All'];
    return;
  }
  if (activeFilters.value.includes('All')) {
    activeFilters.value = [];
  }
  const index = activeFilters.value.indexOf(tag);
  if (index === -1) {
    activeFilters.value.push(tag);
  } else {
    activeFilters.value.splice(index, 1);
  }
  if (activeFilters.value.length === 0) {
    activeFilters.value = ['All'];
  }
};

const handleBookingConfirmation = () => {
  if (!bookingForm.value.contactNumber) {
    notification.error({
      message: 'Contact Number Required',
      description: 'Please provide your contact number.',
    });
    return;
  }
  showBookingModal.value = false;
  notification.success({
    message: 'Booking Confirmed!',
    description: 'Your ride is confirmed. Details sent to your contact number.',
  });
  bookingForm.value = { seats: 1, contactNumber: '' };
};

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
