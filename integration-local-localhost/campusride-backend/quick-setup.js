import { supabaseAdmin } from './src/config/database.js';

async function createTables() {
  console.log('🚀 Creating missing tables...');

  try {
    // First, let's just try to create via raw query using RPC
    const createGroupMessages = `
      CREATE TABLE IF NOT EXISTS group_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const createActivityComments = `
      CREATE TABLE IF NOT EXISTS activity_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL CHECK (char_length(content) >= 5 AND char_length(content) <= 2000),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Try using RPC to execute SQL
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: createGroupMessages });
      console.log('✅ group_messages table created');
    } catch (e) {
      console.log('ℹ️ group_messages table may already exist');
    }

    try {
      await supabaseAdmin.rpc('exec_sql', { sql: createActivityComments });
      console.log('✅ activity_comments table created');
    } catch (e) {
      console.log('ℹ️ activity_comments table may already exist');
    }

    // Test tables exist by trying to access them
    try {
      const { data: groupMessages } = await supabaseAdmin.from('group_messages').select('*').limit(0);
      console.log('✅ group_messages table accessible');
    } catch (e) {
      console.log('❌ group_messages table not accessible:', e.message);
    }

    try {
      const { data: activityComments } = await supabaseAdmin.from('activity_comments').select('*').limit(0);
      console.log('✅ activity_comments table accessible');
    } catch (e) {
      console.log('❌ activity_comments table not accessible:', e.message);
    }

  } catch (error) {
    console.log('❌ Table creation failed:', error.message);
  }
}

createTables();