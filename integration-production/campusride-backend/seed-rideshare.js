import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ── helpers ──────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function futureDate(daysFromNow, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function pastDate(daysAgo, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ── users ────────────────────────────────────────────────────────────
const USERS = [
  'f600615c-3a60-4f02-b481-bcb6768610bc', // zrc (rz469)
  '215ca302-e56a-4eb0-a975-6cc01364e900', // Cindy (xp88)
  '24631fad-e45c-4e21-a619-405d8e014da6', // witty (cl2822)
  '8cf39585-5c61-4007-bc81-5c47d58f95cf', // Lucas (yj596)
  '0fa37cd1-cd52-45a4-b64e-4d242c2e823b', // Keer Wang (kw764)
  '66da4df1-2d07-4c16-8c8b-0ccc67bbb5f0', // Alinaaaa (zx378)
  'da4cb849-52c0-461e-8a4a-9fe9f4258af9', // mayonaise (sh2662)
  '0f85badd-b63b-4255-b688-beec6d6808d7', // Charlle (cls384)
  '42bcfcd4-7fb5-4911-873f-3f9aca63b326', // Dianeth (dlt1)
  'f74b2c19-f486-451d-be43-3040debaec29', // Marilyn (xl2259)
  'dbfe8eb3-8d4e-4e71-9305-27abbc4e2414', // Felix (rc993)
  'aec26317-d4a5-4f5d-91fd-69bea5b8f9e1', // Nick (nhk37)
  '0f1260b0-234a-4b1d-a930-ab8bdfbd5d9a', // Charles (jy2224)
  '637bf3b6-fecb-4f55-b0cc-c90c0e0fd70e', // hawk (jd2382)
  '66c200a5-6b70-403a-a22e-1759d3c23aab', // Minseong (mk2692)
  '5184cad7-a9c4-45af-8190-917fcfc8a9d7', // Kaiyi (kw744)
];

// ── rides ────────────────────────────────────────────────────────────
// idx 0-11: active (future), 12-15: completed (past), 16-17: full (future), 18-19: cancelled
const RIDES = [
  // ═══════════════ ACTIVE rides (12) ═══════════════
  {
    driver_id: USERS[0], // zrc
    title: 'Cornell to JFK Airport',
    description: 'Heading to JFK for a flight. Leaving from Collegetown, happy to make a stop at Woodbury on the way if anyone is interested. Driving a Honda CR-V, plenty of trunk space for luggage.',
    departure_location: '401 College Ave, Ithaca, NY 14850',
    destination_location: 'John F. Kennedy International Airport, Queens, NY 11430',
    departure_time: futureDate(2, 6, 30),
    arrival_time: futureDate(2, 10, 30),
    available_seats: 3,
    price_per_seat: 55,
    vehicle_info: { make: 'Honda', model: 'CR-V', color: 'Silver', year: 2021, license_plate: 'NYS-ABC1' },
    status: 'active',
    rules: ['No smoking', 'Luggage OK', 'Quiet ride preferred'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: { music: 'low', conversation: 'quiet' },
    contact_info: { preferred: 'in-app' },
  },
  {
    driver_id: USERS[1], // Cindy
    title: 'Cornell to Penn Station Manhattan',
    description: 'Weekend trip to NYC! Driving straight to Midtown. Will pick up near campus or Collegetown.',
    departure_location: 'Cornell University, Ithaca, NY 14853',
    destination_location: 'Penn Station, 7th Ave & 32nd St, New York, NY 10001',
    departure_time: futureDate(3, 8, 0),
    arrival_time: futureDate(3, 12, 30),
    available_seats: 2,
    price_per_seat: 50,
    vehicle_info: { make: 'Toyota', model: 'Camry', color: 'White', year: 2022 },
    status: 'active',
    rules: ['No smoking', 'One suitcase per person'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[2], // witty
    title: 'Ithaca to Syracuse (quick trip)',
    description: 'Running errands in Syracuse, can drop off at Destiny USA mall or Syracuse University area. About 1 hour drive.',
    departure_location: 'Wegmans, 500 S Meadow St, Ithaca, NY 14850',
    destination_location: 'Destiny USA, 9090 Destiny USA Dr, Syracuse, NY 13204',
    departure_time: futureDate(1, 10, 0),
    arrival_time: futureDate(1, 11, 15),
    available_seats: 3,
    price_per_seat: 20,
    vehicle_info: { make: 'Subaru', model: 'Outback', color: 'Blue', year: 2020 },
    status: 'active',
    rules: [],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: { music: 'any' },
    contact_info: {},
  },
  {
    driver_id: USERS[3], // Lucas
    title: 'Cornell to LaGuardia Airport',
    description: 'Flying out of LGA next week. Comfortable ride with AC. Can fit 2 carry-ons and 2 checked bags.',
    departure_location: 'Statler Hall, Cornell University, Ithaca, NY 14853',
    destination_location: 'LaGuardia Airport, East Elmhurst, NY 11371',
    departure_time: futureDate(5, 7, 0),
    arrival_time: futureDate(5, 11, 0),
    available_seats: 3,
    price_per_seat: 50,
    vehicle_info: { make: 'Hyundai', model: 'Tucson', color: 'Black', year: 2023 },
    status: 'active',
    rules: ['No smoking', 'Be on time'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[4], // Keer Wang
    title: 'Cornell to Woodbury Outlets',
    description: 'Shopping trip to Woodbury Common! Leaving Saturday morning, planning to spend the day there and return around 7pm. Round trip available.',
    departure_location: 'East Hill Plaza, 400 Pine Tree Rd, Ithaca, NY 14850',
    destination_location: 'Woodbury Common Premium Outlets, 498 Red Apple Ct, Central Valley, NY 10917',
    departure_time: futureDate(4, 9, 0),
    arrival_time: futureDate(4, 12, 30),
    available_seats: 3,
    price_per_seat: 40,
    vehicle_info: { make: 'BMW', model: 'X3', color: 'Gray', year: 2021 },
    status: 'active',
    rules: ['Round trip only', 'No food in car'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: { music: 'pop' },
    contact_info: {},
  },
  {
    driver_id: USERS[5], // Alinaaaa
    title: 'NYC to Cornell (return trip)',
    description: 'Driving back to Cornell from Flushing after the long weekend. Pick up in Flushing or along the way.',
    departure_location: 'Flushing, Queens, NY 11354',
    destination_location: 'Cornell University, Ithaca, NY 14853',
    departure_time: futureDate(6, 14, 0),
    arrival_time: futureDate(6, 18, 30),
    available_seats: 2,
    price_per_seat: 50,
    vehicle_info: { make: 'Tesla', model: 'Model 3', color: 'White', year: 2023 },
    status: 'active',
    rules: ['No smoking', 'No strong food smells'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: { music: 'chill' },
    contact_info: {},
  },
  {
    driver_id: USERS[6], // mayonaise
    title: 'Cornell to Grand Central Terminal',
    description: 'Heading to Grand Central for Thanksgiving break prep. Space for suitcases. Leaving early morning.',
    departure_location: 'Collegetown, Ithaca, NY 14850',
    destination_location: 'Grand Central Terminal, 89 E 42nd St, New York, NY 10017',
    departure_time: futureDate(7, 6, 0),
    arrival_time: futureDate(7, 10, 15),
    available_seats: 4,
    price_per_seat: 50,
    vehicle_info: { make: 'Ford', model: 'Explorer', color: 'Dark Blue', year: 2022 },
    status: 'active',
    rules: ['Luggage OK', 'Be ready on time'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[7], // Charlle
    title: 'Cornell to Boston',
    description: 'Road trip to Boston for the weekend. Will drop off in Boston downtown area (near Back Bay or South Station). About 5 hour drive with a rest stop.',
    departure_location: 'Cornell University, Ithaca, NY 14853',
    destination_location: 'South Station, Boston, MA 02110',
    departure_time: futureDate(8, 7, 30),
    arrival_time: futureDate(8, 12, 30),
    available_seats: 3,
    price_per_seat: 60,
    vehicle_info: { make: 'Volkswagen', model: 'Tiguan', color: 'Red', year: 2021 },
    status: 'active',
    rules: ['No smoking', 'Luggage in trunk only'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[8], // Dianeth
    title: 'Cornell to Philadelphia',
    description: 'Visiting friends in Philly for the weekend. Can drop off at 30th Street Station or University City area. ~4 hour drive.',
    departure_location: 'Ithaca Commons, Ithaca, NY 14850',
    destination_location: '30th Street Station, 2955 Market St, Philadelphia, PA 19104',
    departure_time: futureDate(10, 9, 0),
    arrival_time: futureDate(10, 13, 0),
    available_seats: 2,
    price_per_seat: 45,
    vehicle_info: { make: 'Mazda', model: 'CX-5', color: 'Soul Red', year: 2022 },
    status: 'active',
    rules: ['No smoking'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: { music: 'driver choice' },
    contact_info: {},
  },
  {
    driver_id: USERS[9], // Marilyn
    title: 'Ithaca to Rochester',
    description: 'Going to Rochester for a concert. Leaving around noon, happy to drop off anywhere in the Rochester area. ~1.5 hour drive.',
    departure_location: 'Cayuga Medical Center, 101 Dates Dr, Ithaca, NY 14850',
    destination_location: 'Rochester, NY 14604',
    departure_time: futureDate(9, 12, 0),
    arrival_time: futureDate(9, 13, 45),
    available_seats: 3,
    price_per_seat: 25,
    vehicle_info: { make: 'Honda', model: 'Civic', color: 'Gray', year: 2020 },
    status: 'active',
    rules: [],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[10], // Felix
    title: 'Cornell to Albany (weekly)',
    description: 'I drive to Albany every Friday for work. Have 2 seats available. Can drop off at Albany bus station or near UAlbany campus.',
    departure_location: 'Cornell University, Ithaca, NY 14853',
    destination_location: 'Albany Bus Station, 34 Hamilton St, Albany, NY 12207',
    departure_time: futureDate(12, 15, 0),
    arrival_time: futureDate(12, 18, 0),
    available_seats: 2,
    price_per_seat: 30,
    vehicle_info: { make: 'Toyota', model: 'RAV4', color: 'Green', year: 2021 },
    status: 'active',
    rules: ['Be on time', 'No smoking'],
    ride_type: 'offer',
    recurring_type: 'weekly',
    recurring_pattern: { day: 'friday' },
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[11], // Nick
    title: 'Manhattan to Cornell (Sunday return)',
    description: 'Returning to Cornell Sunday evening from Times Square area. Can pick up anywhere in Midtown Manhattan. Trunk space for bags.',
    departure_location: 'Times Square, Manhattan, NY 10036',
    destination_location: 'Cornell University, Ithaca, NY 14853',
    departure_time: futureDate(13, 16, 0),
    arrival_time: futureDate(13, 20, 30),
    available_seats: 3,
    price_per_seat: 50,
    vehicle_info: { make: 'Nissan', model: 'Rogue', color: 'White', year: 2022 },
    status: 'active',
    rules: ['Pickup at Times Square only', 'No smoking'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },

  // ═══════════════ COMPLETED rides (4) ═══════════════
  {
    driver_id: USERS[12], // Charles
    title: 'Cornell to JFK Airport',
    description: 'Drove to JFK for spring break flights. Comfortable ride, made it in just under 4 hours!',
    departure_location: 'Cornell University, Ithaca, NY 14853',
    destination_location: 'John F. Kennedy International Airport, Queens, NY 11430',
    departure_time: pastDate(5, 7, 0),
    arrival_time: pastDate(5, 11, 0),
    available_seats: 3,
    price_per_seat: 55,
    vehicle_info: { make: 'Chevrolet', model: 'Equinox', color: 'Black', year: 2021 },
    status: 'completed',
    rules: ['No smoking', 'Luggage OK'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[13], // hawk
    title: 'Cornell to Binghamton',
    description: 'Quick trip to Binghamton for a family visit. About 50 min drive.',
    departure_location: 'Collegetown, Ithaca, NY 14850',
    destination_location: 'Binghamton, NY 13901',
    departure_time: pastDate(10, 14, 0),
    arrival_time: pastDate(10, 15, 0),
    available_seats: 4,
    price_per_seat: 15,
    vehicle_info: { make: 'Kia', model: 'Sportage', color: 'White', year: 2020 },
    status: 'completed',
    rules: [],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[14], // Minseong
    title: 'Cornell to Buffalo',
    description: 'Went to Buffalo for Niagara Falls day trip. Great ride with cool passengers.',
    departure_location: 'Cornell University, Ithaca, NY 14853',
    destination_location: 'Buffalo, NY 14203',
    departure_time: pastDate(18, 8, 0),
    arrival_time: pastDate(18, 11, 0),
    available_seats: 3,
    price_per_seat: 35,
    vehicle_info: { make: 'Honda', model: 'Accord', color: 'Blue', year: 2022 },
    status: 'completed',
    rules: ['No smoking'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[15], // Kaiyi
    title: 'Flushing to Cornell (return)',
    description: 'Drove back from Flushing after the weekend. Picked up passengers in Queens and drove back.',
    departure_location: 'Flushing, Queens, NY 11354',
    destination_location: 'Cornell University, Ithaca, NY 14853',
    departure_time: pastDate(25, 15, 0),
    arrival_time: pastDate(25, 19, 30),
    available_seats: 2,
    price_per_seat: 50,
    vehicle_info: { make: 'Audi', model: 'Q5', color: 'Gray', year: 2023 },
    status: 'completed',
    rules: ['No smoking', 'Be on time'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },

  // ═══════════════ FULL rides (2) ═══════════════
  {
    driver_id: USERS[0], // zrc
    title: 'Cornell to JFK - Memorial Day Weekend',
    description: 'Memorial Day weekend trip to JFK. ALL SEATS BOOKED. Contact me if you want to be on the waitlist.',
    departure_location: 'Cornell University, Ithaca, NY 14853',
    destination_location: 'John F. Kennedy International Airport, Queens, NY 11430',
    departure_time: futureDate(3, 6, 0),
    arrival_time: futureDate(3, 10, 0),
    available_seats: 2,
    price_per_seat: 60,
    vehicle_info: { make: 'Honda', model: 'CR-V', color: 'Silver', year: 2021, license_plate: 'NYS-ABC1' },
    status: 'full',
    rules: ['No smoking', 'Luggage OK'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[3], // Lucas
    title: 'Cornell to Port Authority Bus Terminal',
    description: 'Heading to Port Authority for a bus connection. All seats taken!',
    departure_location: 'East Hill Plaza, 400 Pine Tree Rd, Ithaca, NY 14850',
    destination_location: 'Port Authority Bus Terminal, 625 8th Ave, New York, NY 10018',
    departure_time: futureDate(5, 8, 0),
    arrival_time: futureDate(5, 12, 30),
    available_seats: 3,
    price_per_seat: 50,
    vehicle_info: { make: 'Hyundai', model: 'Tucson', color: 'Black', year: 2023 },
    status: 'full',
    rules: ['No smoking', 'One bag per person'],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },

  // ═══════════════ CANCELLED rides (2) ═══════════════
  {
    driver_id: USERS[5], // Alinaaaa
    title: 'Cornell to Syracuse (CANCELLED)',
    description: 'Had to cancel due to car maintenance. Sorry!',
    departure_location: 'Cornell University, Ithaca, NY 14853',
    destination_location: 'Syracuse, NY 13202',
    departure_time: futureDate(2, 10, 0),
    arrival_time: futureDate(2, 11, 15),
    available_seats: 3,
    price_per_seat: 20,
    vehicle_info: { make: 'Tesla', model: 'Model 3', color: 'White', year: 2023 },
    status: 'cancelled',
    rules: [],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
  {
    driver_id: USERS[8], // Dianeth
    title: 'Cornell to Woodbury Outlets (CANCELLED)',
    description: 'Trip cancelled - not enough passengers signed up. Will repost next weekend.',
    departure_location: 'Ithaca Commons, Ithaca, NY 14850',
    destination_location: 'Woodbury Common Premium Outlets, 498 Red Apple Ct, Central Valley, NY 10917',
    departure_time: futureDate(1, 9, 0),
    arrival_time: futureDate(1, 13, 0),
    available_seats: 4,
    price_per_seat: 40,
    vehicle_info: { make: 'Mazda', model: 'CX-5', color: 'Soul Red', year: 2022 },
    status: 'cancelled',
    rules: [],
    ride_type: 'offer',
    recurring_type: 'once',
    preferences: {},
    contact_info: {},
  },
];

// ── main seed function ───────────────────────────────────────────────
async function seedRideshare() {
  console.log('=== Seeding Rideshare Data ===\n');

  // 1. Validate users exist in DB
  const { data: users, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .in('id', USERS);

  if (userError) {
    console.error('Failed to verify users:', userError.message);
    process.exit(1);
  }

  const validIds = new Set(users.map(u => u.id));
  console.log(`Found ${validIds.size} valid user accounts out of ${USERS.length}\n`);

  if (validIds.size === 0) {
    console.error('No valid user IDs found. Aborting.');
    process.exit(1);
  }

  // 2. Insert rides
  console.log('--- Inserting rides ---');
  const insertedRides = [];

  for (let i = 0; i < RIDES.length; i++) {
    const ride = RIDES[i];

    if (!validIds.has(ride.driver_id)) {
      console.error(`  SKIP ride #${i}: driver ${ride.driver_id} not found in DB`);
      continue;
    }

    const row = { ...ride };
    // Remove undefined fields
    if (!row.recurring_pattern) delete row.recurring_pattern;
    if (!row.flexibility) delete row.flexibility;

    const { data, error } = await supabaseAdmin
      .from('rides')
      .insert(row)
      .select('id, title, status, available_seats, price_per_seat, driver_id')
      .single();

    if (error) {
      console.error(`  FAIL ride #${i} "${ride.title}": ${error.message}`);
    } else {
      console.log(`  OK  [${data.status.toUpperCase().padEnd(9)}] ${data.title}`);
      insertedRides.push({ idx: i, ...data });
    }
  }

  console.log(`\nInserted ${insertedRides.length} rides.\n`);

  // 3. Build bookings
  console.log('--- Inserting bookings ---');
  let bookingsInserted = 0;
  let bookingsFailed = 0;

  // Helper: pick passenger(s) that are NOT the driver
  function pickPassengers(driverId, count) {
    const candidates = USERS.filter(u => u !== driverId && validIds.has(u));
    // Shuffle then take first `count`
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async function insertBooking(rideId, passengerId, seatsBooked, pricePerSeat, status, paymentStatus) {
    const row = {
      ride_id: rideId,
      passenger_id: passengerId,
      seats_booked: seatsBooked,
      total_price: seatsBooked * pricePerSeat,
      status,
      payment_status: paymentStatus,
    };

    const { error } = await supabaseAdmin
      .from('ride_bookings')
      .insert(row);

    if (error) {
      console.error(`    FAIL booking for ride ${rideId}: ${error.message}`);
      bookingsFailed++;
      return false;
    }
    bookingsInserted++;
    return true;
  }

  // ── Completed rides (idx 12-15): every completed ride gets 1-2 completed bookings
  const completedRides = insertedRides.filter(r => r.status === 'completed');
  for (const ride of completedRides) {
    const numPassengers = randInt(1, 2);
    const passengers = pickPassengers(ride.driver_id, numPassengers);
    for (const pid of passengers) {
      const seats = 1;
      const ok = await insertBooking(ride.id, pid, seats, ride.price_per_seat, 'completed', 'paid');
      if (ok) console.log(`    OK  completed booking on "${ride.title}" (passenger ${pid.slice(0,8)}...)`);
    }
  }

  // ── Full rides (idx 16-17): fill all available seats with confirmed bookings
  const fullRides = insertedRides.filter(r => r.status === 'full');
  for (const ride of fullRides) {
    const totalSeats = ride.available_seats;
    // Create bookings that sum to totalSeats
    // e.g. for 2 seats: 2 passengers x 1 seat; for 3 seats: 2 passengers (1+2 or 1+1+1)
    const passengers = pickPassengers(ride.driver_id, totalSeats); // one passenger per seat
    for (const pid of passengers) {
      const seats = 1;
      const ok = await insertBooking(ride.id, pid, seats, ride.price_per_seat, 'confirmed', 'paid');
      if (ok) console.log(`    OK  confirmed (full) booking on "${ride.title}" (passenger ${pid.slice(0,8)}...)`);
    }
  }

  // ── Active rides: partially book 5 of the 12 active rides
  const activeRides = insertedRides.filter(r => r.status === 'active');
  // Pick the first 5 active rides to have some bookings
  const partiallyBookedActive = activeRides.slice(0, 5);
  for (const ride of partiallyBookedActive) {
    const numPassengers = randInt(1, 2);
    const passengers = pickPassengers(ride.driver_id, numPassengers);
    for (const pid of passengers) {
      const seats = 1;
      const ok = await insertBooking(ride.id, pid, seats, ride.price_per_seat, 'confirmed', 'pending');
      if (ok) console.log(`    OK  confirmed booking on "${ride.title}" (passenger ${pid.slice(0,8)}...)`);
    }
  }

  console.log(`\nInserted ${bookingsInserted} bookings (${bookingsFailed} failed).\n`);
  console.log('=== Rideshare Seed Complete ===');
}

seedRideshare().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
