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

const SELLERS = [
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
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const ITEMS = [
  // ========== Electronics ==========
  {
    title: 'MacBook Air M2 - Space Gray',
    description: 'Selling my MacBook Air M2, 8GB RAM, 256GB SSD. Used for one semester, battery health 97%. Comes with original charger and box. Great for CS coursework and everything else!',
    category: 'Electronics',
    price: 849,
    condition: 'like_new',
    location: 'Collegetown, Ithaca',
    images: [
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'
    ],
    tags: ['macbook', 'laptop', 'apple', 'M2']
  },
  {
    title: 'iPad Pro 11" with Apple Pencil',
    description: 'iPad Pro 11-inch (4th gen) with Apple Pencil 2nd gen. Perfect for note-taking in lectures. Screen protector included, no scratches. 128GB WiFi model.',
    category: 'Electronics',
    price: 599,
    condition: 'like_new',
    location: 'North Campus',
    images: [
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
      'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?w=800&q=80'
    ],
    tags: ['ipad', 'tablet', 'apple pencil', 'note-taking']
  },
  {
    title: 'AirPods Pro (2nd Gen) - Like New',
    description: 'AirPods Pro 2nd generation with USB-C case. Active noise cancellation is amazing for studying in the library. Only used for 3 months, still under Apple warranty.',
    category: 'Electronics',
    price: 165,
    condition: 'like_new',
    location: 'West Campus',
    images: [
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
      'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800&q=80'
    ],
    tags: ['airpods', 'earbuds', 'apple', 'noise cancelling']
  },
  {
    title: 'Keychron K2 Mechanical Keyboard',
    description: 'Keychron K2 wireless mechanical keyboard with Gateron Brown switches. Bluetooth + USB-C. Great typing experience for long coding sessions. Includes keycap puller.',
    category: 'Electronics',
    price: 55,
    condition: 'good',
    location: 'Collegetown',
    images: [
      'https://images.unsplash.com/photo-1626958390898-162d3577f293?w=800&q=80',
      'https://images.unsplash.com/photo-1558050032-160f36233a07?w=800&q=80'
    ],
    tags: ['keyboard', 'mechanical', 'keychron', 'wireless']
  },
  {
    title: 'Dell 27" 4K Monitor',
    description: 'Dell U2720Q 27-inch 4K USB-C monitor. USB-C delivers power to laptop while displaying. IPS panel with excellent color accuracy. Perfect dual-screen setup for your dorm.',
    category: 'Electronics',
    price: 280,
    condition: 'good',
    location: 'Collegetown, Dryden Rd',
    images: [
      'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800&q=80',
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'
    ],
    tags: ['monitor', '4K', 'dell', 'USB-C']
  },
  {
    title: 'Sony Alpha a6400 Camera Kit',
    description: 'Sony a6400 mirrorless camera with 16-50mm kit lens. 24.2MP, 4K video, fast autofocus. Great for photography club or content creation. Includes camera bag and extra battery.',
    category: 'Electronics',
    price: 720,
    condition: 'good',
    location: 'East Hill',
    images: [
      'https://images.unsplash.com/photo-1602903835460-0de5c9fab926?w=800&q=80',
      'https://images.unsplash.com/photo-1640958902361-61d589cb041c?w=800&q=80'
    ],
    tags: ['camera', 'sony', 'mirrorless', 'photography']
  },

  // ========== Books ==========
  {
    title: 'CS 2110 & 3110 Textbook Bundle',
    description: 'Data Structures and Algorithms in Java + OCaml from the Very Beginning. Both required for Cornell CS curriculum. Good condition with some highlighting. Save $80 compared to bookstore!',
    category: 'Books',
    price: 65,
    condition: 'good',
    location: 'Gates Hall',
    images: [
      'https://images.unsplash.com/photo-1599837487527-e009248aa71b?w=800&q=80',
      'https://images.unsplash.com/photo-1580121441575-41bcb5c6b47c?w=800&q=80'
    ],
    tags: ['textbook', 'CS', 'programming', 'cornell']
  },
  {
    title: 'MATH 1920 Multivariable Calculus Textbook',
    description: 'Stewart\'s Calculus: Early Transcendentals, 9th edition. Required for MATH 1920. Clean copy, no writing or highlighting. Includes online access code (unused).',
    category: 'Books',
    price: 45,
    condition: 'like_new',
    location: 'Malott Hall',
    images: [
      'https://images.unsplash.com/photo-1708011271954-c0d2b3155ded?w=800&q=80'
    ],
    tags: ['textbook', 'calculus', 'math', 'stewart']
  },
  {
    title: 'Classic Novel Collection (12 books)',
    description: 'Collection of 12 classic novels: 1984, Brave New World, To Kill a Mockingbird, Great Gatsby, and more. Perfect for English/Literature classes or leisure reading. All in great condition.',
    category: 'Books',
    price: 35,
    condition: 'good',
    location: 'Olin Library',
    images: [
      'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?w=800&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80'
    ],
    tags: ['novels', 'literature', 'classics', 'reading']
  },
  {
    title: 'GRE Prep Book Set - Kaplan + ETS',
    description: 'Kaplan GRE Prep Plus 2025 + Official ETS GRE Guide. Barely used, all practice tests still available. Great for anyone planning to apply to grad school.',
    category: 'Books',
    price: 40,
    condition: 'like_new',
    location: 'Mann Library',
    images: [
      'https://images.unsplash.com/photo-1622577891040-c05db30904ce?w=800&q=80'
    ],
    tags: ['GRE', 'test prep', 'grad school', 'kaplan']
  },

  // ========== Furniture ==========
  {
    title: 'LED Desk Lamp with USB Port',
    description: 'Adjustable LED desk lamp with 5 brightness levels and 3 color temperatures. Built-in USB charging port. Flexible gooseneck design, perfect for late-night studying.',
    category: 'Furniture',
    price: 25,
    condition: 'good',
    location: 'North Campus Dorms',
    images: [
      'https://images.unsplash.com/photo-1519219788971-8d9797e0928e?w=800&q=80'
    ],
    tags: ['desk lamp', 'LED', 'USB', 'study']
  },
  {
    title: 'IKEA KALLAX Bookshelf (White)',
    description: 'IKEA KALLAX 4x2 shelf unit in white. Perfect for organizing textbooks, decorations, and storage bins. Moving out and can\'t take it. You\'ll need a car to pick up.',
    category: 'Furniture',
    price: 40,
    condition: 'good',
    location: 'Collegetown Terrace',
    images: [
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80',
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80'
    ],
    tags: ['bookshelf', 'IKEA', 'furniture', 'storage']
  },
  {
    title: 'Ergonomic Office Chair - Mesh Back',
    description: 'Ergonomic mesh office chair with lumbar support and adjustable armrests. Your back will thank you during finals week. Height adjustable, rolls smoothly on hardwood.',
    category: 'Furniture',
    price: 95,
    condition: 'good',
    location: 'Schwartz Center',
    images: [
      'https://images.unsplash.com/photo-1579487785973-74d2ca7abdd5?w=800&q=80',
      'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=800&q=80'
    ],
    tags: ['chair', 'ergonomic', 'office', 'study']
  },
  {
    title: 'Mini Fridge - Perfect for Dorm',
    description: 'Compact 3.2 cu ft mini fridge with small freezer compartment. Quiet operation, won\'t disturb your roommate. Great for keeping drinks and snacks cold. End-of-year sale!',
    category: 'Furniture',
    price: 60,
    condition: 'fair',
    location: 'Balch Hall',
    images: [
      'https://images.unsplash.com/photo-1643494847705-74808059bf07?w=800&q=80',
      'https://images.unsplash.com/photo-1540961403310-79825242906e?w=800&q=80'
    ],
    tags: ['mini fridge', 'dorm', 'appliance', 'refrigerator']
  },
  {
    title: 'Standing Desk Converter',
    description: 'FlexiSpot standing desk converter, sits on top of existing desk. Adjustable height with gas spring. Keyboard tray included. Alternate between sitting and standing for better posture!',
    category: 'Furniture',
    price: 110,
    condition: 'like_new',
    location: 'Hasbrouck Apartments',
    images: [
      'https://images.unsplash.com/photo-1622131278701-eb225474ffd2?w=800&q=80',
      'https://images.unsplash.com/photo-1622126755582-16754165dce8?w=800&q=80'
    ],
    tags: ['standing desk', 'ergonomic', 'converter', 'health']
  },

  // ========== Fashion ==========
  {
    title: 'North Face Parka - Ithaca Winter Ready',
    description: 'North Face McMurdo parka, size M. Down insulated, waterproof, fur-trimmed hood. Survived two Ithaca winters, still in great shape. Essential for walking to class in January.',
    category: 'Fashion',
    price: 120,
    condition: 'good',
    location: 'Collegetown',
    images: [
      'https://images.unsplash.com/photo-1514564652994-565a3bf3a25b?w=800&q=80',
      'https://images.unsplash.com/photo-1461935793258-ac2ac2c930b2?w=800&q=80'
    ],
    tags: ['jacket', 'winter', 'north face', 'parka']
  },
  {
    title: 'Nike Air Max 270 - Size 10',
    description: 'Nike Air Max 270, men\'s size 10. White/black colorway. Worn a few times but still look fresh. Super comfortable for walking across campus. Original box included.',
    category: 'Fashion',
    price: 75,
    condition: 'like_new',
    location: 'Helen Newman Hall',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80'
    ],
    tags: ['nike', 'sneakers', 'shoes', 'air max']
  },
  {
    title: 'Herschel Retreat Backpack',
    description: 'Herschel Retreat backpack in navy blue. Padded laptop sleeve fits 15" laptop. Multiple compartments, water bottle pocket. Barely used, like new condition.',
    category: 'Fashion',
    price: 45,
    condition: 'like_new',
    location: 'Duffield Hall',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80'
    ],
    tags: ['backpack', 'herschel', 'laptop bag', 'school']
  },
  {
    title: 'Cornell Big Red Hoodie - Medium',
    description: 'Official Cornell Big Red hoodie, size Medium. Heavyweight cotton blend, super warm. Barely worn (I got two as gifts). Perfect for game day or chilly library sessions.',
    category: 'Fashion',
    price: 30,
    condition: 'new',
    location: 'Cornell Store',
    images: [
      'https://images.unsplash.com/photo-1769839272205-07cb052f5ca2?w=800&q=80',
      'https://images.unsplash.com/photo-1648218943004-5ec604ef627a?w=800&q=80'
    ],
    tags: ['hoodie', 'cornell', 'sweatshirt', 'big red']
  },

  // ========== Sports ==========
  {
    title: 'Lululemon Yoga Mat + Carrying Strap',
    description: 'Lululemon Reversible Mat 5mm. Great grip, no slipping during hot yoga. Used for one semester at Teagle Down gym. Comes with carrying strap. Clean, no odor.',
    category: 'Sports',
    price: 45,
    condition: 'good',
    location: 'Teagle Hall',
    images: [
      'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80',
      'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&q=80'
    ],
    tags: ['yoga mat', 'lululemon', 'fitness', 'yoga']
  },
  {
    title: 'Wilson Tennis Racket + Ball Can',
    description: 'Wilson Clash 100 tennis racket with cover. Plus 1 unopened can of Penn tennis balls. Great for playing at the Reis Tennis Center. Grip size 4 3/8.',
    category: 'Sports',
    price: 85,
    condition: 'good',
    location: 'Reis Tennis Center',
    images: [
      'https://images.unsplash.com/photo-1545151414-8a948e1ea54f?w=800&q=80',
      'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&q=80'
    ],
    tags: ['tennis', 'racket', 'wilson', 'sports']
  },
  {
    title: 'Trek FX2 Hybrid Bicycle',
    description: 'Trek FX2 hybrid bike, medium frame. 21-speed, aluminum frame. Great for commuting between North Campus and Engineering Quad. Includes bike lock and front light. Recently tuned up.',
    category: 'Sports',
    price: 320,
    condition: 'good',
    location: 'Day Hall Bike Rack',
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80'
    ],
    tags: ['bicycle', 'trek', 'commute', 'bike']
  },
  {
    title: 'Adjustable Dumbbell Set (5-25 lbs)',
    description: 'Bowflex SelectTech adjustable dumbbells, 5 to 25 lbs each. Replaces 5 sets of weights. Perfect for dorm room workouts when you can\'t make it to Noyes gym.',
    category: 'Sports',
    price: 150,
    condition: 'good',
    location: 'West Campus',
    images: [
      'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800&q=80',
      'https://images.unsplash.com/photo-1603077492340-e6e62b2a688b?w=800&q=80'
    ],
    tags: ['dumbbells', 'weights', 'workout', 'bowflex']
  },

  // ========== Art ==========
  {
    title: 'Acrylic Paint Set + Canvas Bundle',
    description: 'Professional acrylic paint set (24 colors) with 6 assorted canvases (2 large, 4 medium). Also includes brush set and palette. Great for ART 1101 or hobby painting.',
    category: 'Art',
    price: 55,
    condition: 'new',
    location: 'Tjaden Hall',
    images: [
      'https://images.unsplash.com/photo-1760794751749-6df8746cf42b?w=800&q=80',
      'https://images.unsplash.com/photo-1767170876219-b52255355c86?w=800&q=80'
    ],
    tags: ['paint', 'acrylic', 'canvas', 'art supplies']
  },
  {
    title: 'Wacom Intuos Drawing Tablet',
    description: 'Wacom Intuos Medium drawing tablet with pen. Bluetooth wireless. Great for digital art, photo editing, and design coursework. Works with Photoshop, Illustrator, Procreate.',
    category: 'Art',
    price: 65,
    condition: 'good',
    location: 'Milstein Hall',
    images: [
      'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=800&q=80',
      'https://images.unsplash.com/photo-1599252441131-5aafffcf7740?w=800&q=80'
    ],
    tags: ['wacom', 'drawing tablet', 'digital art', 'design']
  },
  {
    title: 'Framed Art Prints Collection (Set of 4)',
    description: 'Set of 4 modern abstract art prints in black frames. Each 11x14 inches. Perfect for decorating your dorm or apartment. Minimalist style that goes with any room.',
    category: 'Art',
    price: 35,
    condition: 'like_new',
    location: 'Johnson Art Museum area',
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
      'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=800&q=80'
    ],
    tags: ['art prints', 'wall art', 'frames', 'decoration']
  },

  // ========== Others ==========
  {
    title: 'Nespresso Coffee Machine + Pods',
    description: 'Nespresso Vertuo Next coffee machine in matte black. Makes espresso and regular coffee with one touch. Comes with 20 assorted capsules. A must-have for early morning classes!',
    category: 'Others',
    price: 85,
    condition: 'good',
    location: 'Cascadilla Hall',
    images: [
      'https://images.unsplash.com/photo-1565452344518-47faca79dc69?w=800&q=80',
      'https://images.unsplash.com/photo-1608354580875-30bd4168b351?w=800&q=80'
    ],
    tags: ['coffee', 'nespresso', 'kitchen', 'appliance']
  },
  {
    title: 'Board Game Night Bundle (5 games)',
    description: 'Settlers of Catan, Ticket to Ride, Codenames, Pandemic, and Exploding Kittens. All complete with no missing pieces. Perfect for game nights with friends!',
    category: 'Others',
    price: 60,
    condition: 'good',
    location: 'RPU (Robert Purcell)',
    images: [
      'https://images.unsplash.com/photo-1629760946220-5693ee4c46ac?w=800&q=80',
      'https://images.unsplash.com/photo-1547638375-ebf04735d792?w=800&q=80'
    ],
    tags: ['board games', 'catan', 'game night', 'party']
  },
  {
    title: 'Yamaha F335 Acoustic Guitar',
    description: 'Yamaha F335 acoustic guitar with soft case and guitar picks. Great beginner-to-intermediate guitar. Learned a few songs but switching to ukulele. Sounds great, stays in tune well.',
    category: 'Others',
    price: 95,
    condition: 'good',
    location: 'Donlon Hall',
    images: [
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80',
      'https://images.unsplash.com/photo-1610557607773-51db1458e1c9?w=800&q=80'
    ],
    tags: ['guitar', 'acoustic', 'yamaha', 'music']
  },
  {
    title: 'Dorm Kitchen Starter Kit',
    description: 'Everything you need for dorm cooking: pot, pan, spatula, ladle, cutting board, knife set, and measuring cups. All in good condition. Saved me so many dining hall trips!',
    category: 'Others',
    price: 30,
    condition: 'fair',
    location: 'Mews Hall',
    images: [
      'https://images.unsplash.com/photo-1556910602-38f53e68e15d?w=800&q=80',
      'https://images.unsplash.com/photo-1541508168132-0b1d81249c25?w=800&q=80',
      'https://images.unsplash.com/photo-1654064755996-80036b6e6984?w=800&q=80'
    ],
    tags: ['kitchen', 'cookware', 'dorm', 'cooking']
  },
];

async function seedMarketplace() {
  console.log('=== Seeding Marketplace Data ===\n');

  const { data: users, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .in('id', SELLERS);

  if (userError) {
    console.error('Failed to verify users:', userError.message);
    process.exit(1);
  }

  const validIds = users.map(u => u.id);
  console.log(`Found ${validIds.length} valid seller accounts\n`);

  if (validIds.length === 0) {
    console.error('No valid seller IDs found. Aborting.');
    process.exit(1);
  }

  let inserted = 0;
  let failed = 0;

  for (const item of ITEMS) {
    const sellerId = validIds[inserted % validIds.length];
    const daysAgo = randInt(0, 30);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

    const row = {
      seller_id: sellerId,
      title: item.title,
      description: item.description,
      category: item.category,
      price: item.price,
      condition: item.condition,
      location: item.location || 'Cornell University',
      images: item.images,
      tags: item.tags,
      status: 'active',
      views_count: randInt(5, 120),
      favorites_count: randInt(0, 15),
      created_at: createdAt,
      updated_at: createdAt,
    };

    const { error } = await supabaseAdmin
      .from('marketplace_items')
      .insert(row);

    if (error) {
      console.error(`  FAIL: ${item.title} — ${error.message}`);
      failed++;
    } else {
      console.log(`  OK: ${item.title}`);
      inserted++;
    }
  }

  console.log(`\n=== Done: ${inserted} inserted, ${failed} failed ===`);
}

seedMarketplace();
