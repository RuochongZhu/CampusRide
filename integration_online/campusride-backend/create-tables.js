import { createClient } from '@supabase/supabase-js';

// Create tables directly via Supabase
const supabase = createClient(
  'https://jfgenxnqpuutgdnnngsl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmaGVueG5xcHV1dGdkbm5uZ3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTk2MTUyNCwiZXhwIjoyMDQ1NTM3NTI0fQ.YhORCm9BU7KhR3rFpoOJApHx7s3yj8hVFjLYrwJo-Wk'
);

async function createTables() {
  console.log('🚀 Creating tables...');

  try {
    // Create activity_comments table
    await supabase.sql`
      CREATE TABLE IF NOT EXISTS activity_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL CHECK (char_length(content) >= 5 AND char_length(content) <= 2000),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create group_messages table
    await supabase.sql`
      CREATE TABLE IF NOT EXISTS group_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('✅ Tables created successfully!');
  } catch (error) {
    console.log('ℹ️ Tables might already exist:', error.message);
  }
}

createTables();