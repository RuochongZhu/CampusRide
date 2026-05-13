/**
 * Seed script for activities, activity_participants, groups, and group_members.
 *
 * Usage:  node seed-activities.js
 * Requires .env in the same directory with SUPABASE_URL and SUPABASE_SERVICE_KEY.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ---------------------------------------------------------------------------
// Valid user IDs
// ---------------------------------------------------------------------------
const USERS = {
  zrc:       'f600615c-3a60-4f02-b481-bcb6768610bc',
  cindy:     '215ca302-e56a-4eb0-a975-6cc01364e900',
  witty:     '24631fad-e45c-4e21-a619-405d8e014da6',
  lucas:     '8cf39585-5c61-4007-bc81-5c47d58f95cf',
  keer:      '0fa37cd1-cd52-45a4-b64e-4d242c2e823b',
  alina:     '66da4df1-2d07-4c16-8c8b-0ccc67bbb5f0',
  mayo:      'da4cb849-52c0-461e-8a4a-9fe9f4258af9',
  charlle:   '0f85badd-b63b-4255-b688-beec6d6808d7',
  dianeth:   '42bcfcd4-7fb5-4911-873f-3f9aca63b326',
  marilyn:   'f74b2c19-f486-451d-be43-3040debaec29',
  felix:     'dbfe8eb3-8d4e-4e71-9305-27abbc4e2414',
  nick:      'aec26317-d4a5-4f5d-91fd-69bea5b8f9e1',
  charles:   '0f1260b0-234a-4b1d-a930-ab8bdfbd5d9a',
  hawk:      '637bf3b6-fecb-4f55-b0cc-c90c0e0fd70e',
  minseong:  '66c200a5-6b70-403a-a22e-1759d3c23aab',
  kaiyi:     '5184cad7-a9c4-45af-8190-917fcfc8a9d7',
};

const ALL_USER_IDS = Object.values(USERS);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function randomCheckinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** Pick `count` random items from `arr`, excluding any in `exclude`. */
function pickRandom(arr, count, exclude = []) {
  const pool = arr.filter((x) => !exclude.includes(x));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Return an ISO string offset by `days` from now (fractional OK). */
function daysFromNow(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

// ---------------------------------------------------------------------------
// Image URLs by theme
// ---------------------------------------------------------------------------
const IMG = {
  running:      'https://images.unsplash.com/photo-1461896836934-bd45ba7b5491?w=800&q=80',
  workshop:     'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
  volunteering: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80',
  basketball:   'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
  hiking:       'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
  cultural:     'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  coding:       'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
  photography:  'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80',
  boardgames:   'https://images.unsplash.com/photo-1629760946220-5693ee4c46ac?w=800&q=80',
  fitness:      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  art:          'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
  career:       'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
  movie:        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  study:        'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80',
  cleanup:      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80',
};

// =====================================================================
// PART 1 — GROUPS
// =====================================================================
async function seedGroups() {
  console.log('\n=== Seeding groups & group_members ===');

  const groupDefs = [
    {
      name: 'Cornell Running Club',
      description: 'A group for runners of all levels. Weekly group runs around campus and Ithaca trails.',
      creator_id: USERS.zrc,
      memberIds: [USERS.lucas, USERS.felix, USERS.nick, USERS.hawk],
      // total 5 (creator + 4)
    },
    {
      name: 'CS Study Group',
      description: 'Collaborative study sessions for CS courses. Share notes, work on problem sets, prep for prelims.',
      creator_id: USERS.witty,
      memberIds: [USERS.kaiyi, USERS.minseong],
      // total 4 -> need one more member
    },
    {
      name: 'Board Game Night',
      description: 'Weekly board game meetups. From Catan to Codenames — all skill levels welcome!',
      creator_id: USERS.charlle,
      memberIds: [USERS.dianeth, USERS.marilyn, USERS.mayo, USERS.alina, USERS.cindy],
      // total 6
    },
    {
      name: 'Cornell Photography',
      description: 'Capture the beauty of Cornell and Ithaca. Photo walks, editing workshops, and portfolio reviews.',
      creator_id: USERS.alina,
      memberIds: [USERS.marilyn, USERS.dianeth, USERS.charles],
      // total 4
    },
    {
      name: 'Cooking & Foodie',
      description: 'Share recipes, cook together, and explore Ithaca\'s food scene. Potluck dinners every other week.',
      creator_id: USERS.cindy,
      memberIds: [USERS.keer, USERS.mayo, USERS.charlle, USERS.alina],
      // total 5
    },
    {
      name: 'Career Prep Network',
      description: 'Interview practice, resume reviews, and career advice. Helping each other land great opportunities.',
      creator_id: USERS.lucas,
      memberIds: [USERS.zrc, USERS.witty],
      // total 3
    },
    {
      name: 'Cornell Hiking & Outdoors',
      description: 'Weekend hikes around Ithaca gorges, Finger Lakes, and state parks. All fitness levels welcome.',
      creator_id: USERS.nick,
      memberIds: [USERS.hawk, USERS.felix, USERS.keer, USERS.charles],
      // total 5
    },
    {
      name: 'Chinese Student Association',
      description: 'Connecting Chinese students and friends at Cornell. Cultural events, holiday celebrations, and community support.',
      creator_id: USERS.keer,
      memberIds: [USERS.zrc, USERS.cindy, USERS.kaiyi, USERS.minseong, USERS.alina],
      // total 6
    },
  ];

  // Adjust CS Study Group to have 4 total (creator + 3 members)
  groupDefs[1].memberIds.push(USERS.charles);

  const groupRows = groupDefs.map((g, i) => ({
    name: g.name,
    description: g.description,
    creator_id: g.creator_id,
    member_count: 1 + g.memberIds.length,
    group_kind: 'community',
    created_at: daysAgo(30 - i * 3),
  }));

  const { data: insertedGroups, error: gErr } = await supabase
    .from('groups')
    .insert(groupRows)
    .select('id, name');

  if (gErr) throw new Error(`groups insert failed: ${JSON.stringify(gErr)}`);
  console.log(`  Inserted ${insertedGroups.length} groups`);

  // Build group_members rows
  const memberRows = [];
  for (let i = 0; i < insertedGroups.length; i++) {
    const gId = insertedGroups[i].id;
    const def = groupDefs[i];

    // creator
    memberRows.push({
      group_id: gId,
      user_id: def.creator_id,
      role: 'creator',
    });

    // members
    for (const uid of def.memberIds) {
      memberRows.push({
        group_id: gId,
        user_id: uid,
        role: 'member',
      });
    }
  }

  const { data: insertedMembers, error: mErr } = await supabase
    .from('group_members')
    .insert(memberRows)
    .select('id');

  if (mErr) throw new Error(`group_members insert failed: ${JSON.stringify(mErr)}`);
  console.log(`  Inserted ${insertedMembers.length} group_members`);

  return insertedGroups;
}

// =====================================================================
// PART 2 — ACTIVITIES
// =====================================================================
async function seedActivities() {
  console.log('\n=== Seeding activities ===');

  const now = new Date();

  // ---------- 12 published (future) ----------
  const published = [
    {
      title: '5K Fun Run at Beebe Lake',
      description: 'Join us for a scenic 5K run around Beebe Lake! All paces welcome. Water and snacks provided at the finish line.',
      category: 'sports', type: 'team',
      location: 'Beebe Lake Trail, Cornell University',
      location_coordinates: { lat: 42.4510, lng: -76.4735 },
      start_time: daysFromNow(3),
      end_time: daysFromNow(3.1),
      registration_deadline: daysFromNow(2),
      max_participants: 30,
      entry_fee: 0, reward_points: 20,
      tags: ['running', '5k', 'outdoors', 'fitness'],
      image_urls: [IMG.running],
      organizer_id: USERS.zrc,
      requirements: 'Wear running shoes. Bring a water bottle.',
      view_count: 87,
      created_at: daysAgo(10),
    },
    {
      title: 'Intro to Machine Learning Workshop',
      description: 'A beginner-friendly workshop covering ML fundamentals: linear regression, decision trees, and neural network basics. Bring your laptop!',
      category: 'technology', type: 'workshop',
      location: 'Gates Hall G01, Cornell University',
      location_coordinates: { lat: 42.4450, lng: -76.4810 },
      start_time: daysFromNow(5),
      end_time: daysFromNow(5.15),
      registration_deadline: daysFromNow(4),
      max_participants: 25,
      entry_fee: 0, reward_points: 15,
      tags: ['machine-learning', 'AI', 'workshop', 'python'],
      image_urls: [IMG.coding, IMG.workshop],
      organizer_id: USERS.witty,
      requirements: 'Laptop with Python 3.8+ installed.',
      view_count: 134,
      created_at: daysAgo(8),
    },
    {
      title: 'Volunteering at Ithaca Food Bank',
      description: 'Help sort and distribute food to families in need. A great way to give back to the Ithaca community.',
      category: 'volunteer', type: 'team',
      location: 'Ithaca Community Food Bank, 535 Third St, Ithaca',
      location_coordinates: { lat: 42.4380, lng: -76.4960 },
      start_time: daysFromNow(7),
      end_time: daysFromNow(7.2),
      max_participants: 15,
      entry_fee: 0, reward_points: 25,
      tags: ['volunteer', 'community', 'food-bank'],
      image_urls: [IMG.volunteering],
      organizer_id: USERS.cindy,
      view_count: 56,
      created_at: daysAgo(12),
    },
    {
      title: 'Resume Review & Mock Interviews',
      description: 'Get your resume reviewed by peers and practice behavioral and technical interviews. Open to all majors.',
      category: 'career', type: 'workshop',
      location: 'Statler Hall 185, Cornell University',
      location_coordinates: { lat: 42.4456, lng: -76.4819 },
      start_time: daysFromNow(4),
      end_time: daysFromNow(4.15),
      registration_deadline: daysFromNow(3),
      max_participants: 20,
      entry_fee: 0, reward_points: 10,
      tags: ['career', 'resume', 'interview', 'professional'],
      image_urls: [IMG.career],
      organizer_id: USERS.lucas,
      requirements: 'Bring a printed copy of your resume.',
      view_count: 92,
      created_at: daysAgo(7),
    },
    {
      title: 'Basketball 3v3 Tournament',
      description: 'Competitive 3v3 basketball tournament. Form a team of 3 and sign up! Prizes for top 3 teams.',
      category: 'sports', type: 'competition',
      location: 'Newman Arena, Cornell University',
      location_coordinates: { lat: 42.4465, lng: -76.4940 },
      start_time: daysFromNow(10),
      end_time: daysFromNow(10.3),
      registration_deadline: daysFromNow(8),
      max_participants: 24,
      entry_fee: 5, reward_points: 30,
      tags: ['basketball', 'tournament', 'competition', '3v3'],
      image_urls: [IMG.basketball],
      organizer_id: USERS.felix,
      requirements: 'Team of 3 required. Wear basketball shoes.',
      view_count: 178,
      created_at: daysAgo(14),
    },
    {
      title: 'Cornell Japanese Culture Night',
      description: 'Experience Japanese culture through food, traditional performances, calligraphy, and origami workshops. Free matcha tea!',
      category: 'cultural', type: 'team',
      location: 'Willard Straight Hall, Cornell University',
      location_coordinates: { lat: 42.4468, lng: -76.4856 },
      start_time: daysFromNow(8),
      end_time: daysFromNow(8.2),
      max_participants: 50,
      entry_fee: 0, reward_points: 10,
      tags: ['japanese', 'culture', 'food', 'performance'],
      image_urls: [IMG.cultural],
      organizer_id: USERS.keer,
      view_count: 145,
      created_at: daysAgo(9),
    },
    {
      title: 'Gorge Trail Hike',
      description: 'A moderate 3-mile hike through Cascadilla Gorge. Beautiful waterfalls and rock formations. Meet at the trailhead.',
      category: 'sports', type: 'team',
      location: 'Cascadilla Gorge Trail, Ithaca',
      location_coordinates: { lat: 42.4415, lng: -76.4880 },
      start_time: daysFromNow(6),
      end_time: daysFromNow(6.15),
      max_participants: 12,
      entry_fee: 0, reward_points: 15,
      tags: ['hiking', 'nature', 'gorge', 'outdoors'],
      image_urls: [IMG.hiking],
      organizer_id: USERS.nick,
      requirements: 'Sturdy shoes. Trail can be slippery.',
      view_count: 68,
      created_at: daysAgo(6),
    },
    {
      title: 'Startup Pitch Night',
      description: 'Watch student entrepreneurs pitch their startup ideas to a panel of judges. Network with founders and investors.',
      category: 'career', type: 'seminar',
      location: 'eHub, Collegetown, Ithaca',
      location_coordinates: { lat: 42.4424, lng: -76.4848 },
      start_time: daysFromNow(12),
      end_time: daysFromNow(12.15),
      max_participants: 40,
      entry_fee: 0, reward_points: 15,
      tags: ['startup', 'entrepreneurship', 'pitch', 'networking'],
      image_urls: [IMG.career, IMG.workshop],
      organizer_id: USERS.hawk,
      view_count: 110,
      created_at: daysAgo(11),
    },
    {
      title: 'Board Game Marathon',
      description: 'An afternoon of board games! We have Catan, Ticket to Ride, Codenames, Pandemic, and more. Snacks provided.',
      category: 'social', type: 'team',
      location: 'RPU Community Center, Cornell University',
      location_coordinates: { lat: 42.4530, lng: -76.4770 },
      start_time: daysFromNow(2),
      end_time: daysFromNow(2.25),
      max_participants: 20,
      entry_fee: 0, reward_points: 5,
      tags: ['board-games', 'social', 'fun', 'games'],
      image_urls: [IMG.boardgames],
      organizer_id: USERS.charlle,
      view_count: 43,
      created_at: daysAgo(5),
    },
    {
      title: 'Photography Walk: Cornell Campus in Spring',
      description: 'Capture the beauty of Cornell in spring. We will walk through Arts Quad, Libe Slope, and the Botanic Gardens.',
      category: 'cultural', type: 'individual',
      location: 'Arts Quad, Cornell University',
      location_coordinates: { lat: 42.4490, lng: -76.4840 },
      start_time: daysFromNow(9),
      end_time: daysFromNow(9.1),
      max_participants: 15,
      entry_fee: 0, reward_points: 10,
      tags: ['photography', 'spring', 'campus', 'art'],
      image_urls: [IMG.photography],
      organizer_id: USERS.alina,
      requirements: 'Bring your camera or phone.',
      view_count: 75,
      created_at: daysAgo(4),
    },
    {
      title: 'Python Coding Challenge',
      description: 'Solve algorithmic problems in Python within a time limit. Categories: Easy, Medium, Hard. Prizes for top scorers!',
      category: 'technology', type: 'competition',
      location: 'Phillips Hall 101, Cornell University',
      location_coordinates: { lat: 42.4488, lng: -76.4822 },
      start_time: daysFromNow(14),
      end_time: daysFromNow(14.2),
      registration_deadline: daysFromNow(12),
      max_participants: 30,
      entry_fee: 0, reward_points: 25,
      tags: ['python', 'coding', 'competition', 'algorithms'],
      image_urls: [IMG.coding],
      organizer_id: USERS.minseong,
      requirements: 'Bring your laptop. Python 3 will be used.',
      view_count: 163,
      created_at: daysAgo(13),
    },
    {
      title: 'Study Session: Econ 1110 Final Prep',
      description: 'Group study session for Econ 1110 final. We will go through past exams and review key concepts together.',
      category: 'academic', type: 'workshop',
      location: 'Mann Library, Cornell University',
      location_coordinates: { lat: 42.4487, lng: -76.4766 },
      start_time: daysFromNow(1),
      end_time: daysFromNow(1.15),
      max_participants: 25,
      entry_fee: 0, reward_points: 10,
      tags: ['study', 'economics', 'econ-1110', 'finals'],
      image_urls: [IMG.study],
      organizer_id: USERS.dianeth,
      view_count: 98,
      created_at: daysAgo(3),
    },
  ];

  // ---------- 4 completed (past) ----------
  const completed = [
    {
      title: 'Earth Day Campus Cleanup',
      description: 'Helped clean up litter across Cornell Plantations and surrounding trails. Thank you to all 18 volunteers!',
      category: 'volunteer', type: 'team',
      location: 'Cornell Botanic Gardens (Plantations)',
      location_coordinates: { lat: 42.4520, lng: -76.4710 },
      start_time: daysAgo(10),
      end_time: daysAgo(9.8),
      max_participants: 20,
      entry_fee: 0, reward_points: 20,
      status: 'completed',
      tags: ['earth-day', 'cleanup', 'volunteer', 'environment'],
      image_urls: [IMG.cleanup, IMG.volunteering],
      organizer_id: USERS.cindy,
      view_count: 112,
      created_at: daysAgo(25),
    },
    {
      title: 'Badminton Doubles Tournament',
      description: 'A fun doubles tournament with 8 teams. Congratulations to the winners!',
      category: 'sports', type: 'competition',
      location: 'Bartels Hall, Cornell University',
      location_coordinates: { lat: 42.4460, lng: -76.4950 },
      start_time: daysAgo(5),
      end_time: daysAgo(4.7),
      max_participants: 16,
      entry_fee: 0, reward_points: 25,
      status: 'completed',
      tags: ['badminton', 'tournament', 'doubles', 'sports'],
      image_urls: [IMG.running],
      organizer_id: USERS.kaiyi,
      view_count: 89,
      created_at: daysAgo(20),
    },
    {
      title: 'Movie Night: Studio Ghibli',
      description: 'We watched Spirited Away and My Neighbor Totoro. Great turnout and amazing vibes!',
      category: 'social', type: 'individual',
      location: 'Uris Auditorium, Cornell University',
      location_coordinates: { lat: 42.4478, lng: -76.4843 },
      start_time: daysAgo(8),
      end_time: daysAgo(7.8),
      max_participants: 60,
      entry_fee: 0, reward_points: 5,
      status: 'completed',
      tags: ['movie', 'ghibli', 'anime', 'social'],
      image_urls: [IMG.movie],
      organizer_id: USERS.mayo,
      view_count: 195,
      created_at: daysAgo(22),
    },
    {
      title: 'Tech Talk: AI in Healthcare',
      description: 'A fascinating seminar on how AI is transforming diagnostics, drug discovery, and patient care.',
      category: 'technology', type: 'seminar',
      location: 'Weill Hall, Cornell University',
      location_coordinates: { lat: 42.4465, lng: -76.4780 },
      start_time: daysAgo(3),
      end_time: daysAgo(2.9),
      max_participants: 40,
      entry_fee: 0, reward_points: 10,
      status: 'completed',
      tags: ['AI', 'healthcare', 'tech-talk', 'seminar'],
      image_urls: [IMG.coding, IMG.workshop],
      organizer_id: USERS.witty,
      view_count: 157,
      created_at: daysAgo(18),
    },
  ];

  // ---------- 2 ongoing ----------
  const ongoing = [
    {
      title: '30-Day Fitness Challenge',
      description: 'Push yourself with daily workouts for 30 days. Track your progress and earn points. All fitness levels welcome!',
      category: 'sports', type: 'individual',
      location: 'Teagle Gym, Cornell University',
      location_coordinates: { lat: 42.4455, lng: -76.4930 },
      start_time: daysAgo(5),
      end_time: daysFromNow(25),
      max_participants: 50,
      entry_fee: 0, reward_points: 30,
      status: 'ongoing',
      tags: ['fitness', 'challenge', '30-day', 'workout'],
      image_urls: [IMG.fitness],
      organizer_id: USERS.felix,
      view_count: 142,
      created_at: daysAgo(15),
    },
    {
      title: 'Cornell Art Exhibition',
      description: 'Student art exhibition featuring paintings, sculptures, and digital art. Open daily 10am-5pm.',
      category: 'cultural', type: 'individual',
      location: 'Johnson Museum of Art, Cornell University',
      location_coordinates: { lat: 42.4512, lng: -76.4855 },
      start_time: daysAgo(3),
      end_time: daysFromNow(18),
      max_participants: 100,
      entry_fee: 0, reward_points: 10,
      status: 'ongoing',
      tags: ['art', 'exhibition', 'museum', 'student-art'],
      image_urls: [IMG.art],
      organizer_id: USERS.marilyn,
      view_count: 88,
      created_at: daysAgo(16),
    },
  ];

  // ---------- 2 cancelled ----------
  const cancelled = [
    {
      title: 'Outdoor Movie (cancelled - rain)',
      description: 'Was supposed to be an outdoor screening on Libe Slope. Cancelled due to heavy rain forecast.',
      category: 'social', type: 'team',
      location: 'Libe Slope, Cornell University',
      location_coordinates: { lat: 42.4485, lng: -76.4865 },
      start_time: daysFromNow(1),
      end_time: daysFromNow(1.15),
      max_participants: 80,
      entry_fee: 0, reward_points: 5,
      status: 'cancelled',
      tags: ['movie', 'outdoor', 'social'],
      image_urls: [IMG.movie],
      organizer_id: USERS.charlle,
      view_count: 34,
      created_at: daysAgo(7),
    },
    {
      title: 'Tennis Clinic (cancelled - no instructor)',
      description: 'Tennis basics clinic for beginners. Unfortunately cancelled because the instructor is unavailable.',
      category: 'sports', type: 'workshop',
      location: 'Reis Tennis Center, Cornell University',
      location_coordinates: { lat: 42.4440, lng: -76.4955 },
      start_time: daysFromNow(2),
      end_time: daysFromNow(2.1),
      max_participants: 12,
      entry_fee: 0, reward_points: 10,
      status: 'cancelled',
      tags: ['tennis', 'clinic', 'beginner'],
      image_urls: [IMG.running],
      organizer_id: USERS.hawk,
      view_count: 19,
      created_at: daysAgo(9),
    },
  ];

  // Combine and add common defaults
  const allActivities = [...published, ...completed, ...ongoing, ...cancelled].map((a) => ({
    ...a,
    status: a.status || 'published',
    checkin_code: randomCheckinCode(),
    entry_fee: a.entry_fee || 0,
    entry_fee_points: 0,
    current_participants: 0,      // will be updated later
    featured: false,
    checkin_enabled: false,
    location_verification: false,
    auto_complete: false,
    contact_info: null,
    requirements: a.requirements || null,
    registration_deadline: a.registration_deadline || null,
  }));

  const { data: insertedActivities, error: aErr } = await supabase
    .from('activities')
    .insert(allActivities)
    .select('id, title, status, organizer_id, max_participants, reward_points');

  if (aErr) throw new Error(`activities insert failed: ${JSON.stringify(aErr)}`);
  console.log(`  Inserted ${insertedActivities.length} activities`);

  return insertedActivities;
}

// =====================================================================
// PART 3 — ACTIVITY PARTICIPANTS
// =====================================================================
async function seedParticipants(activities) {
  console.log('\n=== Seeding activity_participants ===');

  const participantRows = [];

  for (const act of activities) {
    const organizer = act.organizer_id;

    if (act.status === 'cancelled') continue; // no participants for cancelled

    if (act.status === 'published') {
      // 3-8 registered participants
      const count = 3 + Math.floor(Math.random() * 6);
      const participants = pickRandom(ALL_USER_IDS, count, [organizer]);
      for (const uid of participants) {
        participantRows.push({
          activity_id: act.id,
          user_id: uid,
          attendance_status: 'registered',
          payment_status: 'paid',
          checked_in: false,
          points_earned: 0,
          location_verified: false,
        });
      }
    }

    if (act.status === 'completed') {
      // 5-10 attended participants
      const count = 5 + Math.floor(Math.random() * 6);
      const participants = pickRandom(ALL_USER_IDS, count, [organizer]);
      for (const uid of participants) {
        const checkinTime = new Date(
          new Date(act.start_time || daysAgo(5)).getTime() + Math.random() * 3600000
        ).toISOString();
        participantRows.push({
          activity_id: act.id,
          user_id: uid,
          attendance_status: 'attended',
          payment_status: 'paid',
          checked_in: true,
          checkin_time: checkinTime,
          points_earned: act.reward_points,
          location_verified: true,
        });
      }
    }

    if (act.status === 'ongoing') {
      // 5-10 participants, mix of registered and attended
      const count = 5 + Math.floor(Math.random() * 6);
      const participants = pickRandom(ALL_USER_IDS, count, [organizer]);
      for (let j = 0; j < participants.length; j++) {
        const isCheckedIn = j < Math.ceil(participants.length / 2);
        participantRows.push({
          activity_id: act.id,
          user_id: participants[j],
          attendance_status: isCheckedIn ? 'attended' : 'registered',
          payment_status: 'paid',
          checked_in: isCheckedIn,
          checkin_time: isCheckedIn ? daysAgo(2 + Math.random() * 3) : null,
          points_earned: 0,
          location_verified: isCheckedIn,
        });
      }
    }
  }

  // Insert in batches of 50 to avoid payload limits
  const batchSize = 50;
  let totalInserted = 0;
  for (let i = 0; i < participantRows.length; i += batchSize) {
    const batch = participantRows.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('activity_participants')
      .insert(batch)
      .select('id');
    if (error) throw new Error(`activity_participants insert failed: ${JSON.stringify(error)}`);
    totalInserted += data.length;
  }
  console.log(`  Inserted ${totalInserted} activity_participants`);

  return participantRows;
}

// =====================================================================
// UPDATE current_participants counts
// =====================================================================
async function updateParticipantCounts(activities, participantRows) {
  console.log('\n=== Updating current_participants counts ===');

  for (const act of activities) {
    const count = participantRows.filter(
      (p) => p.activity_id === act.id && p.attendance_status !== 'cancelled'
    ).length;

    if (count > 0) {
      const { error } = await supabase
        .from('activities')
        .update({ current_participants: count })
        .eq('id', act.id);
      if (error) {
        console.error(`  Failed to update count for ${act.title}: ${JSON.stringify(error)}`);
      }
    }
  }
  console.log('  Done updating counts');
}

// =====================================================================
// MAIN
// =====================================================================
async function main() {
  console.log('Starting seed script...');
  console.log('Supabase URL:', process.env.SUPABASE_URL);

  try {
    const groups = await seedGroups();
    const activities = await seedActivities();
    const participantRows = await seedParticipants(activities);
    await updateParticipantCounts(activities, participantRows);

    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log(`  Groups:               ${groups.length}`);
    console.log(`  Activities:           ${activities.length}`);
    console.log(`  Participants:         ${participantRows.length}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

main();
