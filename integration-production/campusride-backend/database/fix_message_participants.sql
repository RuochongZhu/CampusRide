-- Fix: Create message_participants table if not exists
-- Run this in Supabase SQL Editor

-- Message participants table (for group conversations)
CREATE TABLE IF NOT EXISTS message_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP,
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'muted', 'left')),

  UNIQUE(thread_id, user_id)
);

-- Create indexes for message_participants
CREATE INDEX IF NOT EXISTS idx_message_participants_thread_id ON message_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_user_id ON message_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_status ON message_participants(status);

-- Also ensure messages table has the required columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS context_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS context_id VARCHAR(255) NULL;

-- Make activity_id nullable for general messages
ALTER TABLE messages ALTER COLUMN activity_id DROP NOT NULL;
