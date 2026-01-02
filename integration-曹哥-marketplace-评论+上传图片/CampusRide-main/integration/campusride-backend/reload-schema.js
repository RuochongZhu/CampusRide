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

async function reloadSchema() {
  console.log('🔄 Attempting to reload PostgREST schema cache...\n');

  try {
    // Method 1: Try direct table access to force cache refresh
    console.log('Method 1: Accessing tables directly...');

    const { data: conv, error: convErr } = await supabase
      .from('marketplace_conversations')
      .select('*')
      .limit(1);

    const { data: msg, error: msgErr } = await supabase
      .from('marketplace_messages')
      .select('*')
      .limit(1);

    if (!convErr && !msgErr) {
      console.log('✅ Tables are now accessible!\n');
      console.log('✓ marketplace_conversations');
      console.log('✓ marketplace_messages\n');
      return true;
    }

    console.log('⚠️ Tables still not accessible');
    if (convErr) {
      console.log('Conversations error:', convErr.message);
    }
    if (msgErr) {
      console.log('Messages error:', msgErr.message);
    }

    console.log('\n💡 PostgREST cache needs to be refreshed.');
    console.log('This usually happens automatically within a few minutes.');
    console.log('\n📝 Quick fix options:');
    console.log('1. Wait 2-3 minutes for automatic cache refresh');
    console.log('2. Go to Supabase Dashboard > Settings > API > Restart Server');
    console.log('3. Or run this SQL in SQL Editor:');
    console.log('   NOTIFY pgrst, \'reload schema\';');
    console.log('   NOTIFY pgrst, \'reload config\';');

    return false;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Run every 10 seconds for up to 2 minutes
let attempts = 0;
const maxAttempts = 12;

const checkInterval = setInterval(async () => {
  attempts++;
  console.log(`\n🔍 Attempt ${attempts}/${maxAttempts}...`);

  const success = await reloadSchema();

  if (success) {
    console.log('\n🎉 Success! Schema cache is now loaded.');
    console.log('\n✅ You can now use the messaging feature!');
    clearInterval(checkInterval);
    process.exit(0);
  }

  if (attempts >= maxAttempts) {
    console.log('\n⏱️ Timeout reached.');
    console.log('Please manually restart PostgREST server in Supabase Dashboard.');
    clearInterval(checkInterval);
    process.exit(1);
  }
}, 10000);

// Initial check
reloadSchema().then(success => {
  if (success) {
    clearInterval(checkInterval);
    console.log('\n🎉 Success! Schema cache is already loaded.');
    console.log('\n✅ You can now use the messaging feature!');
    process.exit(0);
  }
});
