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
        <!-- Left Panel - Passenger/Driver/My Trips -->
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
            <button
              :class="['px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-1', userMode === 'mytrips' ? 'bg-red-600 text-white' : 'text-gray-600']"
              @click="userMode = 'mytrips'; loadMyTrips()"
            >
              My Trips
            </button>
          </div>
          <h2 class="text-2xl font-bold mb-6">
            {{ userMode === 'passenger' ? 'Search Rides' : userMode === 'driver' ? 'Post a Trip' : 'My Trips' }}
          </h2>

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
          <div v-else-if="userMode === 'driver'">
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

          <!-- My Trips View -->
          <div v-else-if="userMode === 'mytrips'">
            <div v-if="loadingMyTrips" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p class="text-gray-500 text-sm">Loading your trips...</p>
            </div>

            <div v-else-if="myTrips.length === 0" class="text-center py-8">
              <inbox-outlined style="font-size: 48px" class="text-gray-300 mb-4" />
              <p class="text-gray-500">No trips yet</p>
              <p class="text-sm text-gray-400 mt-2">Book a ride or post a trip to get started!</p>
            </div>

            <div v-else class="space-y-4 max-h-[600px] overflow-y-auto">
              <div 
                v-for="trip in myTrips" 
                :key="trip.id" 
                class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                @click="viewTripDetails(trip)"
              >
                <!-- Role Badge -->
                <div class="flex justify-between items-start mb-3">
                  <h3 class="font-bold text-lg">{{ trip.title }}</h3>
                  <span :class="['px-3 py-1 rounded-full text-xs font-semibold', 
                    trip.role === 'driver' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700']">
                    {{ trip.role === 'driver' ? 'Driver' : 'Passenger' }}
                  </span>
                </div>

                <!-- Route -->
                <div class="mb-3">
                  <p class="text-sm text-gray-600">
                    {{ trip.departure_location }} → {{ trip.destination_location }}
                  </p>
                  <p class="text-sm text-gray-500">{{ formatDateTime(trip.departure_time) }}</p>
                </div>

                <!-- Status -->
                <div class="flex items-center justify-between">
                  <span :class="['px-3 py-1 rounded-full text-xs font-medium',
                    getStatusClass(trip)]">
                    {{ getStatusText(trip) }}
                  </span>
                  <span class="text-lg font-bold text-red-600">${{ trip.price_per_seat || trip.total_price }}</span>
                </div>

                <!-- Additional Info for Driver -->
                <div v-if="trip.role === 'driver' && trip.bookings && trip.bookings.length > 0" class="mt-3 pt-3 border-t">
                  <p class="text-sm text-gray-600">
                    {{ trip.bookings.length }} booking(s) - {{ trip.booked_seats }} seat(s) booked
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel - Available Rides -->
        <div class="w-full lg:w-2/3">
          <!-- DEBUG INFO (临时调试信息) -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p class="text-sm font-medium text-yellow-800">🔍 调试信息 (Debug Info)</p>
            <div class="mt-2 text-xs text-yellow-700 space-y-1">
              <p>• Loading状态: {{ loading ? '加载中...' : '已加载' }}</p>
              <p>• availableRides数组长度: {{ availableRides.length }}</p>
              <p>• userMode: {{ userMode }}</p>
              <p>• 当前时间: {{ new Date().toLocaleString() }}</p>
            </div>
            <button
              @click="() => { console.log('Current availableRides:', availableRides); alert(`当前有 ${availableRides.length} 个行程`); }"
              class="mt-2 px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-xs"
            >
              查看详细数据
            </button>
          </div>
          
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

      <!-- My Trip Details Modal -->
      <a-modal
        v-model:open="showTripDetailsModal"
        :title="selectedTrip?.role === 'driver' ? 'My Trip (Driver)' : 'My Trip (Passenger)'"
        width="700px"
        :footer="null"
      >
        <div v-if="selectedTrip" class="space-y-4">
          <!-- Role Badge -->
          <div class="flex justify-between items-center mb-4">
            <span :class="['px-4 py-2 rounded-full text-sm font-semibold',
              selectedTrip.role === 'driver' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700']">
              {{ selectedTrip.role === 'driver' ? '🚗 You are the Driver' : '🎒 You are a Passenger' }}
            </span>
          </div>

          <!-- Trip Information -->
          <div class="border-t pt-4">
            <h4 class="font-bold mb-3">Trip Information</h4>
            <div class="space-y-2">
              <p><strong>Title:</strong> {{ selectedTrip.title }}</p>
              <p><strong>From:</strong> {{ selectedTrip.departure_location }}</p>
              <p><strong>To:</strong> {{ selectedTrip.destination_location }}</p>
              <p><strong>Departure:</strong> {{ formatDateTime(selectedTrip.departure_time) }}</p>
              <p><strong>Status:</strong> <span :class="['px-2 py-1 rounded text-xs font-medium', getStatusClass(selectedTrip)]">
                {{ getStatusText(selectedTrip) }}
              </span></p>
              <p><strong>Price:</strong> ${{ selectedTrip.price_per_seat || selectedTrip.total_price }} 
                {{ selectedTrip.role === 'passenger' ? ' (total)' : ' per seat' }}
              </p>
            </div>
          </div>

          <!-- Driver View: Bookings List -->
          <div v-if="selectedTrip.role === 'driver' && selectedTrip.bookings && selectedTrip.bookings.length > 0" class="border-t pt-4">
            <h4 class="font-bold mb-3">Passengers ({{ selectedTrip.bookings.length }})</h4>
            <div class="space-y-3">
              <div v-for="booking in selectedTrip.bookings" :key="booking.id" 
                class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p class="font-medium">
                    {{ booking.passenger?.first_name }} {{ booking.passenger?.last_name }}
                  </p>
                  <p class="text-sm text-gray-600">
                    {{ booking.seats_booked }} seat(s) - {{ booking.status }}
                  </p>
                </div>
                <button
                  v-if="canCancelBooking(selectedTrip) && ['pending', 'confirmed'].includes(booking.status)"
                  @click="cancelPassengerBooking(booking)"
                  class="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>

          <!-- Passenger View: Driver Info -->
          <div v-if="selectedTrip.role === 'passenger' && selectedTrip.driver" class="border-t pt-4">
            <h4 class="font-bold mb-3">Driver Information</h4>
            <div class="flex items-center gap-3">
              <img
                :src="selectedTrip.driver.avatar_url || 'https://public.readdy.ai/ai/img_res/0b81ac2ae733527fd246b41f1c5e355a.jpg'"
                :alt="selectedTrip.driver.first_name"
                class="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <p class="font-medium">{{ selectedTrip.driver.first_name }} {{ selectedTrip.driver.last_name }}</p>
                <p class="text-sm text-gray-600">{{ selectedTrip.driver.university }}</p>
              </div>
            </div>
          </div>

          <!-- Cancel Button (before trip starts) -->
          <div v-if="canCancelBooking(selectedTrip)" class="border-t pt-4">
            <button
              @click="confirmCancelTrip"
              :disabled="cancelling"
              class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-medium transition-colors disabled:bg-gray-400"
            >
              {{ cancelling ? 'Cancelling...' : (selectedTrip.role === 'driver' ? 'Cancel This Trip' : 'Cancel My Booking') }}
            </button>
            <p class="text-sm text-gray-500 text-center mt-2">
              {{ selectedTrip.role === 'driver' ? 'This will cancel the entire trip and notify all passengers' : 'You can cancel before the trip starts' }}
            </p>
          </div>

          <!-- Rating Section (after trip starts) -->
          <div v-else-if="canRateTrip(selectedTrip) && !isTripCancelled(selectedTrip)" class="border-t pt-4">
            <!-- Loading ratings status -->
            <div v-if="loadingRatingStatus" class="text-center py-4">
              <a-spin />
              <p class="text-sm text-gray-500 mt-2">Loading rating status...</p>
            </div>

            <!-- Rating status loaded -->
            <div v-else>
              <!-- Passenger View: Rate Driver -->
              <div v-if="selectedTrip.role === 'passenger'">
                <!-- Not rated yet -->
                <button
                  v-if="!hasRatedDriver"
                  @click="openRatingModal(selectedTrip.driver)"
                  class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <star-outlined />
                  Rate Driver
                </button>
                
                <!-- Already rated -->
                <div v-else class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-green-700 font-medium">✅ You've rated the driver</p>
                      <p class="text-sm text-gray-600 mt-1">
                        {{ myRatingGiven?.score }} stars
                        <span v-if="myRatingGiven?.comment"> - "{{ myRatingGiven.comment }}"</span>
                      </p>
                    </div>
                    <button
                      @click="viewRatingDetails"
                      class="text-blue-600 hover:text-blue-700 text-sm underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              <!-- Driver View: Rate Passengers -->
              <div v-else-if="selectedTrip.role === 'driver' && selectedTrip.bookings && selectedTrip.bookings.length > 0">
                <h4 class="font-bold mb-3">Rate Passengers</h4>
                <div class="space-y-3">
                  <div v-for="booking in confirmedBookings(selectedTrip.bookings)" :key="booking.id"
                    class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p class="font-medium">
                        {{ booking.passenger?.first_name }} {{ booking.passenger?.last_name }}
                      </p>
                      <p v-if="hasRatedPassenger(booking.passenger_id)" class="text-sm text-green-600">
                        ✅ Rated: {{ getPassengerRating(booking.passenger_id)?.score }} stars
                      </p>
                    </div>
                    <button
                      v-if="!hasRatedPassenger(booking.passenger_id)"
                      @click="openRatingModal(booking.passenger)"
                      class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors flex items-center gap-1"
                    >
                      <star-outlined />
                      Rate
                    </button>
                    <button
                      v-else
                      @click="viewPassengerRating(booking.passenger_id)"
                      class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors text-sm"
                    >
                      View Rating
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trip Started (no rating available) -->
          <div v-else-if="!canCancelBooking(selectedTrip) && !canRateTrip(selectedTrip) && !isTripCancelled(selectedTrip)" class="border-t pt-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p class="text-blue-700">
                🚗 Trip has started. Cancellation is no longer available.
              </p>
            </div>
          </div>
        </div>
      </a-modal>

      <!-- Rating Modal -->
      <a-modal
        v-model:open="showRatingModal"
        title="Rate Your Experience"
        width="500px"
        :footer="null"
      >
        <div v-if="ratingTarget" class="space-y-4">
          <!-- User Info -->
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <img
              :src="ratingTarget.avatar_url || 'https://public.readdy.ai/ai/img_res/0b81ac2ae733527fd246b41f1c5e355a.jpg'"
              :alt="ratingTarget.first_name"
              class="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p class="font-medium">{{ ratingTarget.first_name }} {{ ratingTarget.last_name }}</p>
              <p class="text-sm text-gray-600">{{ selectedTrip?.role === 'driver' ? 'Passenger' : 'Driver' }}</p>
            </div>
          </div>

          <!-- Rating Stars -->
          <div class="text-center">
            <p class="text-sm text-gray-600 mb-3">How was your experience?</p>
            <div class="flex justify-center gap-2">
              <button
                v-for="star in 5"
                :key="star"
                @click="ratingForm.score = star"
                class="text-3xl transition-all hover:scale-110"
              >
                <star-filled v-if="star <= ratingForm.score" class="text-yellow-400" />
                <star-outlined v-else class="text-gray-300" />
              </button>
            </div>
            <p v-if="ratingForm.score > 0" class="text-sm text-gray-600 mt-2">
              {{ getRatingText(ratingForm.score) }}
            </p>
          </div>

          <!-- Comment -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              v-model="ratingForm.comment"
              rows="4"
              placeholder="Share your experience..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              maxlength="500"
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">
              {{ ratingForm.comment?.length || 0 }} / 500
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="showRatingModal = false"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="submitRating"
              :disabled="ratingForm.score === 0 || submittingRating"
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors disabled:bg-gray-400"
            >
              {{ submittingRating ? 'Submitting...' : 'Submit Rating' }}
            </button>
          </div>
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
  StarFilled, StarOutlined, SafetyCertificateOutlined, InboxOutlined, TrophyOutlined
} from '@ant-design/icons-vue';
import {
  Select as ASelect, SelectOption as ASelectOption, Tag as ATag, Pagination as APagination,
  Modal as AModal, Input as AInput, DatePicker as ADatePicker, TimePicker as ATimePicker,
  InputNumber as AInputNumber, Textarea as ATextarea, Spin as ASpin
} from 'ant-design-vue';
import { carpoolingAPI, ratingsAPI } from '@/utils/api';

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

// My Trips
const myTrips = ref([]);
const loadingMyTrips = ref(false);
const selectedTrip = ref(null);
const showTripDetailsModal = ref(false);
const cancelling = ref(false);

// Rating
const showRatingModal = ref(false);
const ratingTarget = ref(null);
const ratingForm = ref({
  score: 0,
  comment: ''
});
const submittingRating = ref(false);
const loadingRatingStatus = ref(false);
const myRatingStatus = ref(null);
const myRatingGiven = ref(null);
const hasRatedDriver = ref(false);

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
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

      // Passenger Origin Input
      if (passengerOriginInput.value) {
        const autocomplete1 = new google.maps.places.Autocomplete(passengerOriginInput.value, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'us' } // 限制为美国地址
        });
        autocomplete1.addListener('place_changed', () => {
          const place = autocomplete1.getPlace();
          if (place.formatted_address) {
            searchForm.value.origin = place.formatted_address;
          } else if (place.name) {
            searchForm.value.origin = place.name;
          }
        });
        setupCount++;
      }

      // Passenger Destination Input
      if (passengerDestInput.value) {
        const autocomplete2 = new google.maps.places.Autocomplete(passengerDestInput.value, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'us' }
        });
        autocomplete2.addListener('place_changed', () => {
          const place = autocomplete2.getPlace();
          if (place.formatted_address) {
            searchForm.value.destination = place.formatted_address;
          } else if (place.name) {
            searchForm.value.destination = place.name;
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
    console.log('🔍 loadRides called with params:', params);
    
    const response = await carpoolingAPI.getRides({
      page: currentPage.value,
      limit: pageSize.value,
      ...params
    });

    console.log('📦 API Response:', response.data);

    if (response.data.success) {
      const rides = response.data.data.rides || [];
      console.log(`✅ Received ${rides.length} rides from API`);
      console.log('📋 Rides:', rides.map(r => ({ id: r.id, title: r.title, time: r.departure_time })));
      
      availableRides.value = rides;
      totalRides.value = response.data.data.pagination?.total_items || 0;
      
      console.log(`✅ availableRides.value updated, length: ${availableRides.value.length}`);
    } else {
      console.error('❌ API returned success=false');
    }
  } catch (error) {
    console.error('❌ Failed to load rides:', error);
    notification.error({
      message: 'Error',
      description: error.response?.data?.error?.message || 'Failed to load rides. Please try again.'
    });
  } finally {
    loading.value = false;
    console.log('✅ loadRides completed, loading:', loading.value);
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

    // Combine date and time (keep in local timezone)
    const departureDateTime = dayjs(driverForm.value.date)
      .hour(dayjs(driverForm.value.time).hour())
      .minute(dayjs(driverForm.value.time).minute())
      .second(0)
      .millisecond(0);
    
    // Check if the time is in the past
    const now = dayjs();
    
    if (departureDateTime.isBefore(now)) {
      notification.error({
        message: '时间错误',
        description: '出发时间不能是过去的时间，请选择未来的时间。',
        duration: 5
      });
      posting.value = false;
      return;
    }
    
    const departureTimeString = departureDateTime.format('YYYY-MM-DDTHH:mm:ss');

    // Auto-generate title from origin and destination
    const autoTitle = `${driverForm.value.origin} → ${driverForm.value.destination}`;

    const response = await carpoolingAPI.createRide({
      title: autoTitle,
      departureLocation: driverForm.value.origin,
      destinationLocation: driverForm.value.destination,
      departureTime: departureTimeString,
      availableSeats: driverForm.value.seats,
      pricePerSeat: driverForm.value.price,
      description: driverForm.value.description || ''
    });

    if (response.data.success) {
      console.log('✅ Trip posted successfully:', response.data.data);
      
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
      console.log('🔄 Switching to passenger mode');
      userMode.value = 'passenger';

      // Reload rides
      console.log('🔄 Reloading rides after posting...');
      await loadRides();
      console.log('✅ Rides reloaded, availableRides.value.length:', availableRides.value.length);
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

// My Trips
const loadMyTrips = async () => {
  try {
    loadingMyTrips.value = true;
    const response = await carpoolingAPI.getMyTrips();
    
    if (response.data.success) {
      myTrips.value = response.data.data.trips;
    }
  } catch (error) {
    console.error('Failed to load my trips:', error);
    notification.error({
      message: 'Error',
      description: 'Failed to load your trips. Please try again.'
    });
  } finally {
    loadingMyTrips.value = false;
  }
};

const getStatusClass = (trip) => {
  const status = trip.role === 'driver' ? trip.status : trip.booking_status;
  const statusMap = {
    'pending': 'bg-yellow-100 text-yellow-700',
    'confirmed': 'bg-green-100 text-green-700',
    'active': 'bg-green-100 text-green-700',
    'full': 'bg-orange-100 text-orange-700',
    'cancelled': 'bg-gray-100 text-gray-700',
    'rejected': 'bg-red-100 text-red-700',
    'completed': 'bg-blue-100 text-blue-700',
    'expired': 'bg-gray-200 text-gray-600'
  };
  return statusMap[status] || 'bg-gray-100 text-gray-700';
};

const getStatusText = (trip) => {
  const status = trip.role === 'driver' ? trip.status : trip.booking_status;
  const statusMap = {
    'pending': '待确认',
    'confirmed': '已确认',
    'active': '进行中',
    'full': '已满员',
    'cancelled': '已取消',
    'rejected': '已拒绝',
    'completed': '已完成',
    'expired': '已过期'
  };
  return statusMap[status] || status;
};

// View trip details
const viewTripDetails = async (trip) => {
  selectedTrip.value = trip;
  showTripDetailsModal.value = true;
  
  // Load rating status if trip has started
  if (canRateTrip(trip)) {
    await loadRatingStatus(trip.id);
  }
};

// Load rating status for a trip
const loadRatingStatus = async (tripId) => {
  try {
    loadingRatingStatus.value = true;
    const response = await ratingsAPI.getMyRatingStatus(tripId);
    
    if (response.data.success) {
      myRatingStatus.value = response.data.data;
      
      // Check if I've rated anyone
      const ratingsGiven = myRatingStatus.value.ratingsGiven || [];
      myRatingGiven.value = ratingsGiven.length > 0 ? ratingsGiven[0] : null;
      hasRatedDriver.value = ratingsGiven.length > 0;
    }
  } catch (error) {
    console.error('Failed to load rating status:', error);
  } finally {
    loadingRatingStatus.value = false;
  }
};

// Check if trip can be cancelled (before start time)
const canCancelBooking = (trip) => {
  if (!trip) return false;
  
  const now = new Date();
  const departureTime = new Date(trip.departure_time);
  
  // Can only cancel before trip starts
  if (now >= departureTime) return false;
  
  // Check status
  if (trip.role === 'passenger') {
    return ['pending', 'confirmed'].includes(trip.booking_status);
  } else {
    return ['active', 'full'].includes(trip.status);
  }
};

// Check if trip is cancelled
const isTripCancelled = (trip) => {
  if (!trip) return false;
  
  if (trip.role === 'passenger') {
    return ['cancelled', 'rejected'].includes(trip.booking_status);
  } else {
    return trip.status === 'cancelled';
  }
};

// Check if trip can be rated (after start time and booking is confirmed)
const canRateTrip = (trip) => {
  if (!trip) return false;
  
  const now = new Date();
  const departureTime = new Date(trip.departure_time);
  
  // Must be after trip starts
  if (now < departureTime) return false;
  
  // Check based on role
  if (trip.role === 'passenger') {
    // Passenger can rate if their booking was confirmed
    return trip.booking_status === 'confirmed' || trip.booking_status === 'completed';
  } else {
    // Driver can rate if trip is active/completed and has confirmed bookings
    return ['active', 'full', 'completed'].includes(trip.status) && 
           trip.bookings && 
           trip.bookings.some(b => b.status === 'confirmed' || b.status === 'completed');
  }
};

// Get confirmed bookings
const confirmedBookings = (bookings) => {
  if (!bookings) return [];
  return bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
};

// Check if driver has rated a specific passenger
const hasRatedPassenger = (passengerId) => {
  if (!myRatingStatus.value || !myRatingStatus.value.ratingsGiven) return false;
  return myRatingStatus.value.ratingsGiven.some(r => r.ratee_id === passengerId);
};

// Get passenger rating
const getPassengerRating = (passengerId) => {
  if (!myRatingStatus.value || !myRatingStatus.value.ratingsGiven) return null;
  return myRatingStatus.value.ratingsGiven.find(r => r.ratee_id === passengerId);
};

// Open rating modal
const openRatingModal = (user) => {
  ratingTarget.value = user;
  ratingForm.value = {
    score: 0,
    comment: ''
  };
  showRatingModal.value = true;
};

// Get rating text
const getRatingText = (score) => {
  const texts = {
    1: '😞 Poor',
    2: '😕 Fair',
    3: '😐 Good',
    4: '😊 Very Good',
    5: '🌟 Excellent'
  };
  return texts[score] || '';
};

// Submit rating
const submitRating = async () => {
  if (!selectedTrip.value || !ratingTarget.value || ratingForm.value.score === 0) return;
  
  try {
    submittingRating.value = true;
    
    const response = await ratingsAPI.createRating({
      tripId: selectedTrip.value.id,
      rateeId: ratingTarget.value.id,
      score: ratingForm.value.score,
      comment: ratingForm.value.comment || undefined
    });
    
    if (response.data.success) {
      notification.success({
        message: 'Rating Submitted',
        description: 'Thanks for your rating!'
      });
      
      // Close modal
      showRatingModal.value = false;
      
      // Reload rating status
      await loadRatingStatus(selectedTrip.value.id);
    }
  } catch (error) {
    console.error('Failed to submit rating:', error);
    notification.error({
      message: 'Rating Failed',
      description: error.response?.data?.error?.message || 'Failed to submit rating. Please try again.'
    });
  } finally {
    submittingRating.value = false;
  }
};

// View rating details
const viewRatingDetails = () => {
  if (myRatingGiven.value) {
    notification.info({
      message: 'Your Rating',
      description: `You gave ${myRatingGiven.value.score} stars${myRatingGiven.value.comment ? `: "${myRatingGiven.value.comment}"` : ''}`,
      duration: 5
    });
  }
};

// View passenger rating
const viewPassengerRating = (passengerId) => {
  const rating = getPassengerRating(passengerId);
  if (rating) {
    notification.info({
      message: 'Your Rating',
      description: `You gave ${rating.score} stars${rating.comment ? `: "${rating.comment}"` : ''}`,
      duration: 5
    });
  }
};

// Confirm and cancel trip
const confirmCancelTrip = async () => {
  if (!selectedTrip.value) return;
  
  try {
    cancelling.value = true;
    
    if (selectedTrip.value.role === 'passenger') {
      // Passenger cancels their booking
      await carpoolingAPI.cancelBooking(selectedTrip.value.booking_id);
      
      notification.success({
        message: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.'
      });
    } else {
      // Driver cancels the entire trip
      await carpoolingAPI.deleteRide(selectedTrip.value.id);
      
      notification.success({
        message: 'Trip Cancelled',
        description: 'Your trip has been cancelled. All passengers have been notified.'
      });
    }
    
    // Close modal and reload trips
    showTripDetailsModal.value = false;
    await loadMyTrips();
    
  } catch (error) {
    console.error('Failed to cancel:', error);
    notification.error({
      message: 'Cancellation Failed',
      description: error.response?.data?.error?.message || 'Failed to cancel. Please try again.'
    });
  } finally {
    cancelling.value = false;
  }
};

// Cancel specific passenger booking (driver only)
const cancelPassengerBooking = async (booking) => {
  if (!selectedTrip.value || selectedTrip.value.role !== 'driver') return;
  
  try {
    await carpoolingAPI.cancelBookingByDriver(booking.id);
    
    notification.success({
      message: 'Booking Cancelled',
      description: `${booking.passenger?.first_name}'s booking has been cancelled.`
    });
    
    // Reload trip details
    await loadMyTrips();
    
    // Update the selected trip
    const updatedTrip = myTrips.value.find(t => t.id === selectedTrip.value.id);
    if (updatedTrip) {
      selectedTrip.value = updatedTrip;
    }
    
  } catch (error) {
    console.error('Failed to cancel passenger booking:', error);
    notification.error({
      message: 'Cancellation Failed',
      description: error.response?.data?.error?.message || 'Failed to cancel booking.'
    });
  }
};

// Utilities
const disabledDate = (current) => {
  return current && current < dayjs().startOf('day');
};

const formatDateTime = (datetime) => {
  if (!datetime) return '';
  // Parse the datetime string and format in local timezone
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
  console.log('🚀 Component mounted');
  // 立即开始加载 Google Maps（异步加载，不阻塞）
  initGoogleMaps();
  // 加载拼车列表
  console.log('🔄 Initial load of rides...');
  await loadRides();
  console.log('✅ Initial load completed, availableRides.length:', availableRides.value.length);
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
