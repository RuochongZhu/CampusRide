import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  try {
    // Method 1: Try to query the tables directly
    console.log('Method 1: Direct table query');
    const { data: convData, error: convError } = await supabase
      .from('marketplace_conversations')
      .select('*')
      .limit(0);

    const { data: msgData, error: msgError } = await supabase
      .from('marketplace_messages')
      .select('*')
      .limit(0);

    if (!convError && !msgError) {
      console.log('✅ SUCCESS! Both tables exist and are accessible!\n');
      console.log('✓ marketplace_conversations');
      console.log('✓ marketplace_messages\n');

      console.log('🎉 Marketplace Messaging System is READY!\n');
      return true;
    }

    // Show detailed errors
    console.log('⚠️  Table access issues:\n');
    if (convError) {
      console.log('marketplace_conversations error:');
      console.log('  Code:', convError.code);
      console.log('  Message:', convError.message);
      console.log('  Details:', convError.details);
      console.log('  Hint:', convError.hint, '\n');
    }

    if (msgError) {
      console.log('marketplace_messages error:');
      console.log('  Code:', msgError.code);
      console.log('  Message:', msgError.message);
      console.log('  Details:', msgError.details);
      console.log('  Hint:', msgError.hint, '\n');
    }

    // Method 2: Query information_schema
    console.log('\nMethod 2: Checking information_schema...');
    const { data: tables, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'marketplace%');

    if (!schemaError && tables) {
      console.log('Found marketplace tables:', tables);
    } else {
      console.log('Schema query error:', schemaError?.message);
    }

    return false;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

checkTables()
  .then(success => {
    if (success) {
      console.log('📱 API Endpoints Ready:');
      console.log('   POST   /api/v1/marketplace/items/:itemId/message');
      console.log('   POST   /api/v1/marketplace/conversations/:conversationId/messages');
      console.log('   GET    /api/v1/marketplace/conversations');
      console.log('   GET    /api/v1/marketplace/conversations/:conversationId/messages');
      console.log('   GET    /api/v1/marketplace/conversations/unread-count\n');
      process.exit(0);
    } else {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Go to Supabase Dashboard > Table Editor');
      console.log('   2. Check if tables "marketplace_conversations" and "marketplace_messages" exist');
      console.log('   3. If not, the SQL may not have executed correctly');
      console.log('   4. Try running the SQL again in SQL Editor\n');
      process.exit(1);
    }
  });
