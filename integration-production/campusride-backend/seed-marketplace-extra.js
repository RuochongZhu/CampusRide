import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SELLERS = [
  'f600615c-3a60-4f02-b481-bcb6768610bc',
  '215ca302-e56a-4eb0-a975-6cc01364e900',
  '24631fad-e45c-4e21-a619-405d8e014da6',
  '8cf39585-5c61-4007-bc81-5c47d58f95cf',
  '0fa37cd1-cd52-45a4-b64e-4d242c2e823b',
  '66da4df1-2d07-4c16-8c8b-0ccc67bbb5f0',
  'da4cb849-52c0-461e-8a4a-9fe9f4258af9',
  '0f85badd-b63b-4255-b688-beec6d6808d7',
  '42bcfcd4-7fb5-4911-873f-3f9aca63b326',
  'f74b2c19-f486-451d-be43-3040debaec29',
  'dbfe8eb3-8d4e-4e71-9305-27abbc4e2414',
  'aec26317-d4a5-4f5d-91fd-69bea5b8f9e1',
];

// Helper: random int in [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: date N days ago as ISO string
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const items = [
  {
    seller_id: SELLERS[0],
    title: 'Nintendo Switch + Games Bundle',
    description:
      'Selling my Nintendo Switch with three games (Mario Kart, Zelda, Smash Bros). Perfect for downtime between classes at Olin Library or rainy Ithaca evenings in the dorm. Console is in great shape with minor cosmetic wear on the dock.',
    category: 'Electronics',
    price: 220,
    condition: 'good',
    location: 'Donlon Hall',
    images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80'],
    tags: ['nintendo', 'switch', 'gaming', 'console'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[1],
    title: 'Bose QuietComfort 45 Headphones',
    description:
      'Almost-new Bose QC45 with active noise cancelling. These were a lifesaver during finals week at Uris Library -- blocks out every conversation. Comes with original case and charging cable.',
    category: 'Electronics',
    price: 180,
    condition: 'like_new',
    location: 'Uris Library',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    tags: ['bose', 'headphones', 'noise-cancelling'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[2],
    title: 'Dyson Desk Fan + Space Heater',
    description:
      'Dyson AM09 that doubles as a fan and space heater -- essential for Ithaca winters when your dorm radiator isn\'t cutting it. Whisper quiet and oscillates. Grabbed it for Mary Donlon but graduating now.',
    category: 'Furniture',
    price: 90,
    condition: 'good',
    location: 'Mary Donlon Hall',
    images: ['https://images.unsplash.com/photo-1617375407361-9815c98fbee5?w=800&q=80'],
    tags: ['fan', 'heater', 'dyson', 'dorm'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[3],
    title: 'Economics & Finance Textbook Set',
    description:
      'Bundle of five textbooks covering Micro, Macro, Corporate Finance, and Econometrics. Used them for AEM and Econ courses in Uris Hall. Minimal highlighting, no missing pages.',
    category: 'Books',
    price: 55,
    condition: 'good',
    location: 'Uris Hall',
    images: ['https://images.unsplash.com/photo-1554244933-d876deb6b2ff?w=800&q=80'],
    tags: ['economics', 'finance', 'textbook', 'AEM'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[4],
    title: 'New Balance 990v5 Running Shoes Size 9',
    description:
      'Classic NB 990v5 in gray, size 9. Wore them mostly for jogs around Beebe Lake and up Libe Slope. Plenty of tread left -- just upgrading to the v6. Great all-around campus shoe.',
    category: 'Fashion',
    price: 85,
    condition: 'good',
    location: 'Barton Hall',
    images: ['https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80'],
    tags: ['running', 'shoes', 'new balance', 'athletic'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[5],
    title: 'Fujifilm Instax Mini 11 Polaroid Camera',
    description:
      'Cute lavender Instax Mini 11 in near-perfect condition. Took it to Slope Day and a few Willard Straight events. Includes 20 unused film sheets and the original box.',
    category: 'Electronics',
    price: 50,
    condition: 'like_new',
    location: 'Willard Straight Hall',
    images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80'],
    tags: ['polaroid', 'camera', 'fujifilm', 'instax'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[6],
    title: 'Rock Climbing Shoes + Chalk Bag (Size 10)',
    description:
      'La Sportiva Tarantulace climbing shoes (size 10) plus a chalk bag. Used at Lindseth Climbing Center about a dozen times. Rubber is still grippy, perfect for bouldering nights.',
    category: 'Sports',
    price: 65,
    condition: 'good',
    location: 'Lindseth Climbing Center',
    images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80'],
    tags: ['climbing', 'shoes', 'bouldering', 'chalk'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[7],
    title: 'Succulent Plant Collection (8 pots)',
    description:
      'Eight healthy succulents in matching white ceramic pots. They thrived on my windowsill near the Cornell Botanic Gardens greenhouse. Low maintenance and perfect for brightening up a dorm desk.',
    category: 'Others',
    price: 25,
    condition: 'new',
    location: 'Cornell Botanic Gardens',
    images: ['https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&q=80'],
    tags: ['plants', 'succulents', 'dorm', 'decor'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[8],
    title: 'Anker Nebula Portable Projector',
    description:
      'Compact Anker Nebula Capsule II projector -- great for movie nights in Collegetown Terrace common rooms. Projects up to 100 inches, has built-in Android TV. Battery lasts about 2.5 hours.',
    category: 'Electronics',
    price: 195,
    condition: 'good',
    location: 'Collegetown Terrace',
    images: ['https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80'],
    tags: ['projector', 'portable', 'movie', 'anker'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[9],
    title: 'Xiaomi Electric Scooter',
    description:
      'Xiaomi Mi Electric Scooter 1S -- beats walking up the hill from Collegetown to Day Hall every morning. Top speed 15 mph, range about 18 miles. Folds up for easy storage in your room.',
    category: 'Sports',
    price: 280,
    condition: 'good',
    location: 'Day Hall',
    images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80'],
    tags: ['scooter', 'electric', 'commute', 'xiaomi'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[10],
    title: 'LSAT Prep Book Set (Kaplan + PowerScore)',
    description:
      'Complete LSAT prep set: Kaplan Premier, PowerScore Logic Games Bible, and three official LSAC practice tests. Studied at Myron Taylor Hall law library. All books in excellent condition.',
    category: 'Books',
    price: 50,
    condition: 'like_new',
    location: 'Myron Taylor Hall',
    images: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80'],
    tags: ['LSAT', 'law school', 'prep', 'kaplan'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[11],
    title: 'IKEA Futon Sofa Bed (Gray)',
    description:
      'IKEA HAMMARN futon sofa bed in gray. Super handy when friends crash in your Cascadilla Hall apartment after a late night in Collegetown. Some wear on the armrest but structurally solid.',
    category: 'Furniture',
    price: 120,
    condition: 'fair',
    location: 'Cascadilla Hall',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'],
    tags: ['futon', 'sofa', 'bed', 'IKEA'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[0],
    title: 'Instant Pot Duo 6-Quart + Rice Cooker',
    description:
      'Instant Pot Duo 7-in-1 plus a Zojirushi rice cooker. Cooked hundreds of meals in the Mews Hall shared kitchen. Both work perfectly and come with their accessories. Essential for off-campus living.',
    category: 'Others',
    price: 45,
    condition: 'good',
    location: 'Mews Hall Kitchen',
    images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80'],
    tags: ['instant pot', 'rice cooker', 'cooking', 'kitchen'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[1],
    title: 'Smith Ski Goggles + Gloves Set',
    description:
      'Smith Squad goggles with ChromaPop lens and insulated ski gloves. Used them on trips to Greek Peak right outside Ithaca. Goggles are anti-fog and fit over glasses. Ready for next winter.',
    category: 'Sports',
    price: 70,
    condition: 'good',
    location: 'Greek Peak nearby',
    images: ['https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&q=80'],
    tags: ['ski', 'goggles', 'gloves', 'winter'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
  {
    seller_id: SELLERS[2],
    title: 'Audio-Technica Vinyl Record Player + 10 Records',
    description:
      'Audio-Technica AT-LP60X turntable with a curated stack of 10 vinyl records (jazz, indie, classic rock). Kept it in my room near Schwartz Center for the Performing Arts. Sounds warm and beautiful.',
    category: 'Others',
    price: 130,
    condition: 'good',
    location: 'Schwartz Center',
    images: ['https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&q=80'],
    tags: ['vinyl', 'turntable', 'records', 'music'],
    status: 'active',
    views_count: randInt(5, 100),
    favorites_count: randInt(0, 10),
    created_at: daysAgo(randInt(1, 30)),
    updated_at: new Date().toISOString(),
  },
];

async function seed() {
  console.log(`Inserting ${items.length} marketplace items...`);

  const { data, error } = await supabaseAdmin
    .from('marketplace_items')
    .insert(items)
    .select('id, title');

  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`Successfully inserted ${data.length} items:`);
  data.forEach((item) => {
    console.log(`  - ${item.title} (${item.id})`);
  });
}

seed();
