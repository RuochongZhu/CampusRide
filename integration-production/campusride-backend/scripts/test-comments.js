import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Supabase configuration
const supabaseUrl = 'https://jfgenxnqpuutgdnnngsl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZ2VueG5xcHV1dGdkbm5uZ3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzNTc5NCwiZXhwIjoyMDcwNTExNzk0fQ.UCxqUWrAvghm1xbfi_CEosgE3u5G0XcH9pSMv6fA8sE';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing Comment System\n');

async function test() {
  try {
    // 1. Check if tables exist
    console.log('1️⃣  Checking if comment tables exist...');
    const { data: comments, error: commentsError } = await supabase
      .from('marketplace_comments')
      .select('id')
      .limit(1);

    if (commentsError && commentsError.message.includes('does not exist')) {
      console.log('❌ marketplace_comments table does not exist');
      console.log('   Run migration: integration/campusride-backend/database/migrations/005_marketplace_comments.sql\n');
      return;
    }

    console.log('✅ marketplace_comments table exists\n');

    // 2. Check if any marketplace items exist
    console.log('2️⃣  Checking for marketplace items...');
    const { data: items, error: itemsError } = await supabase
      .from('marketplace_items')
      .select('id, title')
      .limit(3);

    if (itemsError || !items || items.length === 0) {
      console.log('⚠️  No marketplace items found');
      console.log('   Please create a test item in the Marketplace to test comments\n');
      return;
    }

    console.log(`✅ Found ${items.length} marketplace items:`);
    items.forEach(item => {
      console.log(`   - ${item.title} (${item.id})`);
    });
    console.log('');

    // 3. Check API endpoint
    console.log('3️⃣  Testing comment API endpoint...');
    const testItemId = items[0].id;

    const response = await fetch(`http://localhost:3001/api/v1/marketplace/items/${testItemId}/comments`);
    const result = await response.json();

    if (response.ok) {
      console.log('✅ Comment API endpoint is working');
      console.log(`   Found ${result.data.comments.length} comments for item "${items[0].title}"\n`);
    } else {
      console.log('❌ Comment API endpoint failed:', result.error?.message);
      return;
    }

    // 4. Test summary
    console.log('📊 Test Summary:');
    console.log('   ✅ Database tables exist');
    console.log('   ✅ Marketplace items exist');
    console.log('   ✅ Comment API is functional');
    console.log('\n🎉 Comment system is ready to use!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open the frontend: http://localhost:5173/marketplace');
    console.log('   2. Click on any marketplace item');
    console.log('   3. Scroll down to see the comment section');
    console.log('   4. Post a test comment\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nDebug info:');
    console.error('   - Backend server: http://localhost:3001');
    console.error('   - Check backend logs for errors');
  }
}

test();
