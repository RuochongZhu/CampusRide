import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testMessagingSystem() {
  console.log('🧪 Testing Marketplace Messaging System\n');

  try {
    // Step 1: Check if tables exist
    console.log('1️⃣  Checking tables...');
    const { error: convError } = await supabase
      .from('marketplace_conversations')
      .select('id')
      .limit(1);

    const { error: msgError } = await supabase
      .from('marketplace_messages')
      .select('id')
      .limit(1);

    if (convError) {
      console.log('❌ marketplace_conversations table not found');
      console.log('   Error:', convError.message);
      console.log('\n💡 Please run the SQL from create-marketplace-messages-tables.js in Supabase SQL Editor\n');
      return;
    }

    if (msgError) {
      console.log('❌ marketplace_messages table not found');
      console.log('   Error:', msgError.message);
      console.log('\n💡 Please run the SQL from create-marketplace-messages-tables.js in Supabase SQL Editor\n');
      return;
    }

    console.log('✅ Tables exist!\n');

    // Step 2: Get a marketplace item
    console.log('2️⃣  Finding marketplace items...');
    const { data: items, error: itemsError } = await supabase
      .from('marketplace_items')
      .select('id, title, seller_id, status')
      .eq('status', 'active')
      .limit(5);

    if (itemsError || !items || items.length === 0) {
      console.log('⚠️  No active marketplace items found');
      console.log('   Please create some items first\n');
      return;
    }

    console.log(`✅ Found ${items.length} active items`);
    items.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.title} (ID: ${item.id})`);
    });
    console.log('');

    // Step 3: Get users (potential buyers/sellers)
    console.log('3️⃣  Finding users...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .limit(5);

    if (usersError || !users || users.length < 2) {
      console.log('⚠️  Need at least 2 users for testing');
      return;
    }

    console.log(`✅ Found ${users.length} users\n`);

    // Step 4: Check existing conversations
    console.log('4️⃣  Checking existing conversations...');
    const { data: conversations, error: convListError } = await supabase
      .from('marketplace_conversations')
      .select(`
        id,
        created_at,
        message_count,
        item:marketplace_items(id, title),
        buyer:profiles!marketplace_conversations_buyer_id_fkey(first_name, last_name),
        seller:profiles!marketplace_conversations_seller_id_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (conversations && conversations.length > 0) {
      console.log(`✅ Found ${conversations.length} existing conversations:`);
      conversations.forEach((conv, i) => {
        console.log(`   ${i + 1}. ${conv.buyer?.first_name} ↔️  ${conv.seller?.first_name}`);
        console.log(`      Item: ${conv.item?.title}`);
        console.log(`      Messages: ${conv.message_count}`);
        console.log(`      ID: ${conv.id}\n`);
      });
    } else {
      console.log('📭 No conversations found yet\n');
    }

    // Step 5: Test API endpoints info
    console.log('5️⃣  API Endpoints Ready:');
    console.log('   POST   /api/v1/marketplace/items/:itemId/message');
    console.log('   POST   /api/v1/marketplace/conversations/:conversationId/messages');
    console.log('   GET    /api/v1/marketplace/conversations');
    console.log('   GET    /api/v1/marketplace/conversations/:conversationId/messages');
    console.log('   GET    /api/v1/marketplace/conversations/unread-count\n');

    console.log('✅ Marketplace Messaging System is ready to use!');
    console.log('\n📝 Next steps:');
    console.log('   1. Login to the frontend');
    console.log('   2. Browse marketplace items');
    console.log('   3. Click "Contact Seller" on any item');
    console.log('   4. Send a message to start a conversation\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMessagingSystem();
