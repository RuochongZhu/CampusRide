-- 006_group_messages.sql
-- Migration to add group messages functionality

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);

-- Add RLS policies for group_messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow group members to view messages
CREATE POLICY "group_messages_select_policy" ON group_messages
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_messages.group_id
    AND user_id = auth.uid()
  )
);

-- Policy to allow group members to insert messages
CREATE POLICY "group_messages_insert_policy" ON group_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_messages.group_id
    AND user_id = auth.uid()
  )
);

-- Policy to allow users to update their own messages
CREATE POLICY "group_messages_update_policy" ON group_messages
FOR UPDATE USING (auth.uid() = sender_id);

-- Policy to allow users to delete their own messages (soft delete)
CREATE POLICY "group_messages_delete_policy" ON group_messages
FOR DELETE USING (auth.uid() = sender_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_group_messages_updated_at
  BEFORE UPDATE ON group_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_group_messages_updated_at();

-- Create a view for group messages with sender info
CREATE OR REPLACE VIEW group_messages_with_sender AS
SELECT
  gm.*,
  u.first_name,
  u.last_name,
  u.avatar_url,
  u.email
FROM group_messages gm
JOIN users u ON gm.sender_id = u.id
WHERE gm.deleted_at IS NULL
ORDER BY gm.created_at DESC;

-- Add message count to groups view
CREATE OR REPLACE VIEW groups_with_stats AS
SELECT
  g.*,
  COALESCE(m.message_count, 0) as message_count,
  m.last_message_at
FROM groups g
LEFT JOIN (
  SELECT
    group_id,
    COUNT(*) as message_count,
    MAX(created_at) as last_message_at
  FROM group_messages
  WHERE deleted_at IS NULL
  GROUP BY group_id
) m ON g.id = m.group_id;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON group_messages TO authenticated;
GRANT USAGE ON SEQUENCE group_messages_id_seq TO authenticated;