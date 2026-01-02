-- Migration: Add reactions column to messages table
-- This column stores emoji reactions as a JSONB array

-- Add reactions column if it doesn't exist
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

-- Create an index on reactions for efficient querying
CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING GIN (reactions);

-- Example of reactions structure:
-- [
--   { "user_id": "uuid-1", "emoji": "👍", "created_at": "2024-01-01T00:00:00Z" },
--   { "user_id": "uuid-2", "emoji": "❤️", "created_at": "2024-01-01T00:01:00Z" }
-- ]
