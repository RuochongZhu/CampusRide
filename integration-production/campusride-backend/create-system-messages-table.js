import { supabaseAdmin } from './src/config/database.js';

async function createSystemMessagesTable() {
  console.log('Creating system_messages table using Supabase Admin...');
  
  // First, check if we can insert directly - Supabase might auto-create
  try {
    // Try to create a test record to see if table exists
    const { data: testData, error: testError } = await supabaseAdmin
      .from('system_messages')
      .select('id')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Table already exists!');
      return;
    }
    
    console.log('Table does not exist, attempting to create via direct insert...');
    console.log('Error:', testError.message);
    
  } catch (e) {
    console.log('Exception:', e.message);
  }
  
  // Since we can't create tables via client, let's try using the postgrest-js schema endpoint
  console.log('\n📝 Please run this SQL in Supabase Dashboard SQL Editor:');
  console.log('=========================================');
  console.log(`
CREATE TABLE IF NOT EXISTS system_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(20) NOT NULL DEFAULT 'user',
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'general',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_messages_created_at ON system_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_messages_sender_type ON system_messages(sender_type);

CREATE TABLE IF NOT EXISTS system_message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES system_messages(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_system_message_reads_user ON system_message_reads(user_id);

INSERT INTO system_messages (sender_id, sender_type, content, message_type, is_pinned)
VALUES (NULL, 'admin', 'Welcome to CampusRide! This is the system announcements channel.', 'announcement', true);
  `);
  console.log('=========================================\n');
}

createSystemMessagesTable();
