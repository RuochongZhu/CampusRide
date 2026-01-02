// Run message reactions migration
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
  console.log('🔄 Running message reactions migration...');

  try {
    // Check if reactions column already exists
    const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'reactions'
      `
    });

    // If RPC doesn't work, try adding the column directly
    const { error: addError } = await supabase
      .from('messages')
      .select('reactions')
      .limit(1);

    if (addError && addError.message.includes('does not exist')) {
      console.log('📝 reactions column does not exist, creating it...');

      // Try to add the column using raw SQL through Supabase
      // Note: This requires running the SQL directly in Supabase dashboard
      console.log('⚠️ Please run the following SQL in your Supabase dashboard:');
      console.log(`
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING GIN (reactions);
      `);

      console.log('✅ Migration SQL generated. Please execute it in Supabase SQL Editor.');
    } else if (!addError) {
      console.log('✅ reactions column already exists!');
    } else {
      console.log('⚠️ Could not determine column status:', addError.message);
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    console.log('⚠️ Please run the following SQL in your Supabase dashboard:');
    console.log(`
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING GIN (reactions);
    `);
  }
}

runMigration();
